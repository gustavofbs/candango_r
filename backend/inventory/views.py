from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db.models import Count, Q, F
from .models import Category, Product, Customer, Supplier, Expense, ProductionCost, Sale, SaleItem, StockMovement
from .serializers import (
    CategorySerializer, ProductSerializer, CustomerSerializer,
    SupplierSerializer, ExpenseSerializer, ProductionCostSerializer, SaleSerializer,
    SaleCreateSerializer, StockMovementSerializer
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
    queryset = ProductionCost.objects.select_related('product').all()
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
        
        return queryset
    
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
                    'is_locked': cost.is_locked,
                    'locked_by_sale_number': cost.locked_by_sale.sale_number if cost.locked_by_sale else None,
                    'locked_at': cost.locked_at,
                    'costs': [],
                    'total': 0
                }
            
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
        if self.action == 'create':
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


@api_view(['GET'])
def dashboard_view(request):
    """
    Endpoint para retornar dados do dashboard
    """
    total_products = Product.objects.count()
    total_customers = Customer.objects.filter(active=True).count()
    total_suppliers = Supplier.objects.filter(active=True).count()
    
    low_stock_products = Product.objects.filter(
        current_stock__lt=F('min_stock')
    ).select_related('category')[:10]
    
    recent_movements = StockMovement.objects.select_related('product')[:10]
    
    recent_sales = Sale.objects.select_related('customer')[:5]
    
    data = {
        'totalProducts': total_products,
        'totalCustomers': total_customers,
        'totalSuppliers': total_suppliers,
        'lowStockProducts': ProductSerializer(low_stock_products, many=True).data,
        'recentMovements': StockMovementSerializer(recent_movements, many=True).data,
        'recentSales': SaleSerializer(recent_sales, many=True).data,
    }
    
    return Response(data)
