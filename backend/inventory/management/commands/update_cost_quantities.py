from django.core.management.base import BaseCommand
from inventory.models import ProductionCost, SaleItem


class Command(BaseCommand):
    help = 'Atualiza o campo quantity em custos de produção antigos baseado nas vendas associadas'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando atualização de quantities em custos de produção...')
        
        # Busca todos os custos que têm venda associada mas não têm quantity
        costs_without_quantity = ProductionCost.objects.filter(
            locked_by_sale__isnull=False,
            quantity__isnull=True
        ).select_related('locked_by_sale', 'product')
        
        total_costs = costs_without_quantity.count()
        self.stdout.write(f'Encontrados {total_costs} custos sem quantity vinculados a vendas')
        
        updated_count = 0
        
        for cost in costs_without_quantity:
            # Busca o item da venda correspondente ao produto deste custo
            sale_item = SaleItem.objects.filter(
                sale=cost.locked_by_sale,
                product=cost.product
            ).first()
            
            if sale_item:
                old_quantity = cost.quantity
                cost.quantity = sale_item.quantity
                cost.save(update_fields=['quantity'])
                updated_count += 1
                self.stdout.write(
                    f'✓ Custo ID {cost.id}: quantity {old_quantity} -> {sale_item.quantity} (Produto: {cost.product.name})'
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f'✗ Custo ID {cost.id}: Não encontrado SaleItem correspondente'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Concluído! {updated_count} custos atualizados de {total_costs} totais.'
            )
        )
