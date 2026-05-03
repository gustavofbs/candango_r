from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db.models import Count, Q, F
from .models import Category, Product, Customer, Supplier, Expense, ProductionCost, Sale, SaleItem, StockMovement, Company
from .serializers import (
    CategorySerializer, ProductSerializer, CustomerSerializer,
    SupplierSerializer, ExpenseSerializer, ProductionCostSerializer, SaleSerializer,
    SaleCreateSerializer, StockMovementSerializer, CompanySerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['code', 'name', 'current_stock', 'sale_price', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        active = self.request.query_params.get('active', None)
        if active is not None:
            queryset = queryset.filter(active=active.lower() == 'true')
        
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category_id=category)
        
        low_stock = self.request.query_params.get('low_stock', None)
        if low_stock == 'true':
            queryset = queryset.filter(current_stock__lt=F('min_stock'))
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        products = self.get_queryset().filter(
            current_stock__lt=F('min_stock')
        ).order_by('current_stock')
        
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'document', 'email', 'phone']
    ordering_fields = ['code', 'name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        active = self.request.query_params.get('active', None)
        if active is not None:
            queryset = queryset.filter(active=active.lower() == 'true')
        
        return queryset


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'document', 'email', 'contact_name']
    ordering_fields = ['code', 'name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        active = self.request.query_params.get('active', None)
        if active is not None:
            queryset = queryset.filter(active=active.lower() == 'true')
        
        return queryset


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'expense_type']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        active = self.request.query_params.get('active', None)
        if active is not None:
            queryset = queryset.filter(active=active.lower() == 'true')
        
        expense_type = self.request.query_params.get('expense_type', None)
        if expense_type:
            queryset = queryset.filter(expense_type=expense_type)
        
        return queryset


class ProductionCostViewSet(viewsets.ModelViewSet):
    queryset = ProductionCost.objects.select_related('product', 'customer', 'locked_by_sale').all()
    serializer_class = ProductionCostSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'product__name', 'refinement_code', 'refinement_name']
    ordering_fields = ['date', 'value', 'created_at']
    ordering = ['-date']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        product = self.request.query_params.get('product', None)
        if product:
            queryset = queryset.filter(product_id=product)
        
        cost_type = self.request.query_params.get('cost_type', None)
        if cost_type:
            queryset = queryset.filter(cost_type=cost_type)
        
        refinement_code = self.request.query_params.get('refinement_code', None)
        if refinement_code:
            queryset = queryset.filter(refinement_code=refinement_code)
        
        is_locked = self.request.query_params.get('is_locked', None)
        if is_locked is not None:
            queryset = queryset.filter(is_locked=is_locked.lower() == 'true')
        
        cost_category = self.request.query_params.get('cost_category', None)
        if cost_category:
            queryset = queryset.filter(cost_category=cost_category)
        
        return queryset

    def _update_product_stock_and_price(self, product, qty, unit_cost, reverse=False):
        """Update product stock and weighted average purchase_price."""
        from decimal import Decimal
        qty = Decimal(str(qty)) if qty else Decimal('0')
        unit_cost = Decimal(str(unit_cost)) if unit_cost else Decimal('0')
        if reverse:
            new_stock = max(Decimal('0'), product.current_stock - qty)
            product.current_stock = new_stock
        else:
            old_stock = product.current_stock
            old_price = product.purchase_price
            new_stock = old_stock + qty
            if new_stock > 0:
                product.purchase_price = ((old_stock * old_price) + (qty * unit_cost)) / new_stock
            product.current_stock = new_stock
        product.save(update_fields=['current_stock', 'purchase_price'])

    @action(detail=False, methods=['post'])
    def save_production_entry(self, request):
        """
        Cria um grupo de custos de produção e atualiza estoque/preço do produto.
        Payload: {product_id, date, quantity, costs: [{cost_type, value}], notes}
        """
        from decimal import Decimal
        import time
        product_id = request.data.get('product_id')
        date = request.data.get('date')
        quantity = request.data.get('quantity')
        costs = request.data.get('costs', [])
        notes = request.data.get('notes', '')
        if not product_id or not date or not quantity or not costs:
            return Response({'error': 'Campos obrigatórios faltando'}, status=400)
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Produto não encontrado'}, status=404)
        qty = Decimal(str(quantity))
        timestamp = str(int(time.time()))[-6:]
        ref_code = f'PROD-{product.code}-{timestamp}'
        for i, cost in enumerate(costs):
            ProductionCost.objects.create(
                product=product,
                cost_type=cost['cost_type'],
                value=Decimal(str(cost['value'])),
                date=date,
                quantity=qty if i == 0 else None,
                refinement_code=ref_code,
                refinement_name=ref_code,
                notes=notes if notes and i == 0 else None,
                cost_category='production',
                description='',
            )
        total_unit_cost = sum(Decimal(str(c['value'])) for c in costs)
        self._update_product_stock_and_price(product, qty, total_unit_cost)
        return Response({'status': 'ok', 'refinement_code': ref_code})

    @action(detail=False, methods=['post'])
    def delete_production_group(self, request):
        """
        Exclui todos os custos de um grupo de produção e reverte o estoque.
        Payload: {refinement_code}
        """
        from decimal import Decimal
        ref_code = request.data.get('refinement_code')
        if not ref_code:
            return Response({'error': 'refinement_code obrigatório'}, status=400)
        costs = ProductionCost.objects.filter(refinement_code=ref_code, cost_category='production')
        main = costs.filter(quantity__isnull=False).select_related('product').first()
        if main and main.quantity:
            product = main.product
            qty = Decimal(str(main.quantity))
            product.current_stock = max(Decimal('0'), product.current_stock - qty)
            product.save(update_fields=['current_stock'])
        costs.delete()
        return Response({'status': 'ok'})
    
    @action(detail=False, methods=['get'])
    def refinements(self, request):
        """
        Lista refinamentos de custo agrupados por código
        """
        product_id = request.query_params.get('product', None)
        include_locked = request.query_params.get('include_locked', 'false').lower() == 'true'
        
        queryset = self.get_queryset()
        
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        if not include_locked:
            queryset = queryset.filter(is_locked=False)
        
        # Agrupa por refinement_code
        refinements = {}
        for cost in queryset.filter(refinement_code__isnull=False).select_related('product', 'locked_by_sale'):
            code = cost.refinement_code
            if code not in refinements:
                refinements[code] = {
                    'refinement_code': code,
                    'refinement_name': cost.refinement_name,
                    'product_id': cost.product.id,
                    'product_name': cost.product.name,
                    'product_code': cost.product.code,
                    'quantity': float(cost.quantity) if cost.quantity else None,
                    'is_locked': cost.is_locked,
                    'locked_by_sale_number': cost.locked_by_sale.sale_number if cost.locked_by_sale else None,
                    'locked_at': cost.locked_at,
                    'costs': [],
                    'total': 0,
                    'date': cost.date.isoformat() if cost.date else None,
                }
            
            if refinements[code]['quantity'] is None and cost.quantity:
                refinements[code]['quantity'] = float(cost.quantity)
            refinements[code]['costs'].append({
                'id': cost.id,
                'cost_type': cost.cost_type,
                'value': float(cost.value),
                'description': cost.description,
            })
            refinements[code]['total'] += float(cost.value)
        
        return Response(list(refinements.values()))


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.select_related('customer').prefetch_related('items__product').all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['sale_number', 'customer__name']
    ordering_fields = ['sale_date', 'final_amount', 'created_at']
    ordering = ['-sale_date', '-created_at']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SaleCreateSerializer
        return SaleSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        customer = self.request.query_params.get('customer', None)
        if customer:
            queryset = queryset.filter(customer_id=customer)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        sales = self.get_queryset()[:10]
        serializer = self.get_serializer(sales, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def next_number(self, request):
        """Gera o próximo número de venda sequencial"""
        # Busca a última venda criada
        last_sale = Sale.objects.order_by('-id').first()
        
        if last_sale and last_sale.sale_number.isdigit():
            # Se o último número é numérico, incrementa
            next_num = int(last_sale.sale_number) + 1
        else:
            # Se não existe venda ou o formato é diferente, começa do 1
            next_num = 1
        
        # Formata com 5 dígitos (00001, 00002, etc.)
        next_sale_number = str(next_num).zfill(5)
        
        return Response({'next_number': next_sale_number})
    
    def perform_destroy(self, instance):
        for item in instance.items.all():
            product = item.product
            product.current_stock = float(product.current_stock) + float(item.quantity)
            product.save()
        instance.delete()

    @action(detail=False, methods=['post'])
    def recalculate_profits(self, request):
        """Recalcula o lucro de todos os itens de venda"""
        items = SaleItem.objects.all()
        total_items = items.count()
        
        updated = 0
        for item in items:
            old_profit = item.profit
            # Força o recálculo chamando save()
            item.save()
            
            if old_profit != item.profit:
                updated += 1
        
        return Response({
            'message': f'Lucros recalculados com sucesso!',
            'total_items': total_items,
            'updated_items': updated
        })


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.select_related('product').all()
    serializer_class = StockMovementSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name', 'product__code', 'notes']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        product = self.request.query_params.get('product', None)
        if product:
            queryset = queryset.filter(product_id=product)
        
        movement_type = self.request.query_params.get('movement_type', None)
        if movement_type:
            queryset = queryset.filter(movement_type=movement_type)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        movements = self.get_queryset()[:20]
        serializer = self.get_serializer(movements, many=True)
        return Response(serializer.data)


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['razao_social', 'nome_fantasia', 'cnpj']
    ordering_fields = ['razao_social', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        active = self.request.query_params.get('active', None)
        if active is not None:
            queryset = queryset.filter(active=active.lower() == 'true')
        
        return queryset


@api_view(['GET'])
def dashboard_view(request):
    """
    Endpoint para retornar dados do dashboard
    Aceita parâmetros opcionais: month (1-12) e year (YYYY)
    """
    from datetime import datetime
    from django.db.models import Sum
    
    try:
        total_products = Product.objects.count()
        total_customers = Customer.objects.filter(active=True).count()
        total_suppliers = Supplier.objects.filter(active=True).count()
        
        low_stock_products = Product.objects.filter(
            current_stock__lt=F('min_stock')
        ).select_related('category')[:10]
        
        recent_sales = Sale.objects.select_related('customer')[:5]
        
        # Obter mês e ano dos parâmetros ou usar mês/ano atual
        now = datetime.now()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))
        
        # Lucro total das vendas do mês (TODAS as vendas, independente do status)
        monthly_profit = SaleItem.objects.filter(
            sale__sale_date__month=month,
            sale__sale_date__year=year
        ).aggregate(total=Sum('profit'))['total'] or 0
        
        # Total de despesas do mês (active = True)
        try:
            monthly_expenses = Expense.objects.filter(
                date__month=month,
                date__year=year,
                active=True
            ).aggregate(total=Sum('amount'))['total'] or 0
        except Exception as e:
            print(f"Erro ao buscar despesas: {e}")
            monthly_expenses = 0
        
        # Resultado = Lucro - Despesas
        monthly_result = float(monthly_profit) - float(monthly_expenses)
        
        # Resultado Acumulado (de janeiro até o mês selecionado)
        cumulative_profit = SaleItem.objects.filter(
            sale__sale_date__month__lte=month,
            sale__sale_date__year=year
        ).aggregate(total=Sum('profit'))['total'] or 0
        
        try:
            cumulative_expenses = Expense.objects.filter(
                date__month__lte=month,
                date__year=year,
                active=True
            ).aggregate(total=Sum('amount'))['total'] or 0
        except Exception as e:
            print(f"Erro ao buscar despesas acumuladas: {e}")
            cumulative_expenses = 0
        
        cumulative_result = float(cumulative_profit) - float(cumulative_expenses)
        
        data = {
            'totalProducts': total_products,
            'totalCustomers': total_customers,
            'totalSuppliers': total_suppliers,
            'lowStockProducts': ProductSerializer(low_stock_products, many=True).data,
            'recentSales': SaleSerializer(recent_sales, many=True).data,
            'monthlyResult': monthly_result,
            'monthlyProfit': float(monthly_profit),
            'monthlyExpenses': float(monthly_expenses),
            'cumulativeResult': cumulative_result,
            'selectedMonth': month,
            'selectedYear': year,
        }
        
        return Response(data)
    except Exception as e:
        print(f"Erro no dashboard_view: {e}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
