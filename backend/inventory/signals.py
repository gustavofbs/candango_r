from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from django.db.models import Sum
from .models import Sale, ProductionCost, SaleItem


@receiver(pre_save, sender=Sale)
def lock_production_costs_on_liquidation(sender, instance, **kwargs):
    """
    Trava os custos de produção quando uma venda é marcada como 'liquidado'
    """
    # Verifica se é uma atualização (não criação)
    if instance.pk:
        try:
            old_instance = Sale.objects.get(pk=instance.pk)
            
            # Se mudou para 'liquidado' e não estava antes
            if instance.status == 'liquidado' and old_instance.status != 'liquidado':
                # Trava todos os custos usados nos itens desta venda
                for item in instance.items.all():
                    if item.cost_refinement_code:
                        # Busca todos os custos com este código de refinamento
                        costs = ProductionCost.objects.filter(
                            refinement_code=item.cost_refinement_code,
                            is_locked=False
                        )
                        
                        # Trava os custos
                        costs.update(
                            is_locked=True,
                            locked_by_sale=instance,
                            locked_at=timezone.now()
                        )
        except Sale.DoesNotExist:
            pass


@receiver(post_save, sender=Sale)
def create_cost_snapshot_on_sale(sender, instance, created, **kwargs):
    """
    Cria snapshot dos custos quando uma venda é criada ou atualizada
    """
    if created or instance.status == 'liquidado':
        for item in instance.items.all():
            if item.cost_refinement_code and not item.cost_snapshot:
                # Busca todos os custos deste refinamento
                costs = ProductionCost.objects.filter(
                    refinement_code=item.cost_refinement_code
                )
                
                # Cria o snapshot
                breakdown = {}
                total = 0
                cost_ids = []
                
                for cost in costs:
                    breakdown[cost.cost_type] = float(cost.value)
                    total += float(cost.value)
                    cost_ids.append(cost.id)
                
                item.cost_snapshot = {
                    'refinement_code': item.cost_refinement_code,
                    'breakdown': breakdown,
                    'total': total,
                    'cost_ids': cost_ids,
                    'calculated_at': timezone.now().isoformat()
                }
                item.cost_calculated_at = timezone.now()
                item.save(update_fields=['cost_snapshot', 'cost_calculated_at'])


def update_sale_item_costs_for_refinement(refinement_code):
    """
    Atualiza o unit_cost e total_cost de todos os itens de venda que usam um refinamento específico
    """
    if not refinement_code:
        return
    
    # Calcula o total do refinamento
    total_refinement_cost = ProductionCost.objects.filter(
        refinement_code=refinement_code
    ).aggregate(total=Sum('value'))['total'] or 0
    
    # Busca todos os itens de venda que usam este refinamento
    # Verifica tanto cost_refinement_code quanto locked_by_sale
    sale_items = SaleItem.objects.filter(cost_refinement_code=refinement_code)
    
    # Também busca itens vinculados através do locked_by_sale
    production_costs = ProductionCost.objects.filter(refinement_code=refinement_code).first()
    if production_costs and production_costs.locked_by_sale:
        sale_items_by_lock = SaleItem.objects.filter(
            sale=production_costs.locked_by_sale,
            product=production_costs.product
        )
        # Combina os querysets
        sale_items = sale_items | sale_items_by_lock
    
    # Atualiza cada item
    for item in sale_items.distinct():
        item.unit_cost = total_refinement_cost
        # Chama save() sem update_fields para que o método save() do modelo
        # recalcule automaticamente total_cost, profit e outros campos
        item.save()


@receiver(post_save, sender=ProductionCost)
def update_sale_costs_on_production_cost_change(sender, instance, created, **kwargs):
    """
    Atualiza os custos dos itens de venda quando um custo de produção é criado ou modificado
    """
    if instance.refinement_code:
        update_sale_item_costs_for_refinement(instance.refinement_code)


@receiver(post_delete, sender=ProductionCost)
def update_sale_costs_on_production_cost_delete(sender, instance, **kwargs):
    """
    Atualiza os custos dos itens de venda quando um custo de produção é deletado
    """
    if instance.refinement_code:
        update_sale_item_costs_for_refinement(instance.refinement_code)
