from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Sale, ProductionCost


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
