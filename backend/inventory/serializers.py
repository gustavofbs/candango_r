from rest_framework import serializers
from .models import Category, Product, Customer, Supplier, Expense, ProductionCost, Sale, SaleItem, StockMovement, Company


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'code', 'name', 'composition', 'size', 'category', 'category_name',
            'unit', 'purchase_price', 'current_stock',
            'min_stock', 'max_stock', 'location', 'active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'code', 'name', 'document', 'email', 'phone',
            'zipcode', 'address', 'neighborhood', 'city', 'state', 'notes', 'active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            'id', 'code', 'name', 'document', 'contact_name', 'email',
            'phone', 'zipcode', 'address', 'neighborhood', 'city', 'state', 'notes', 'active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = [
            'id', 'name', 'amount', 'expense_type', 'date', 'notes', 'active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductionCostSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.code', read_only=True)
    locked_by_sale_number = serializers.CharField(source='locked_by_sale.sale_number', read_only=True, allow_null=True)
    locked_by_sale_customer = serializers.CharField(source='locked_by_sale.customer.name', read_only=True, allow_null=True)
    
    class Meta:
        model = ProductionCost
        fields = [
            'id', 'product', 'product_name', 'product_code', 'description', 
            'cost_type', 'value', 'date', 'notes',
            'refinement_code', 'refinement_name', 'is_locked', 
            'locked_by_sale', 'locked_by_sale_number', 'locked_by_sale_customer', 'locked_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'is_locked', 'locked_by_sale', 'locked_at']


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.code', read_only=True)
    
    class Meta:
        model = SaleItem
        fields = [
            'id', 'product', 'product_name', 'product_code',
            'quantity', 'unit_price', 'unit_cost', 'cost_refinement_code',
            'cost_snapshot', 'cost_calculated_at', 'discount', 
            'tax', 'freight', 'total_price', 'total_cost', 'profit'
        ]
        read_only_fields = ['id', 'total_price', 'total_cost', 'profit', 'cost_calculated_at']


class SaleSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True, allow_null=True)
    customer_state = serializers.CharField(source='customer.state', read_only=True, allow_null=True)
    items = SaleItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Sale
        fields = [
            'id', 'sale_number', 'sale_type', 'customer', 'customer_name', 'customer_state', 'sale_date',
            'total_amount', 'discount', 'final_amount', 'payment_method', 'nf', 'tax_percentage',
            'status', 'notes', 'created_at', 'items'
        ]
        read_only_fields = ['id', 'final_amount', 'created_at']


class SaleCreateSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    
    class Meta:
        model = Sale
        fields = [
            'sale_number', 'sale_type', 'customer', 'sale_date', 'total_amount',
            'discount', 'payment_method', 'nf', 'tax_percentage', 'status', 'notes', 'items'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        sale = Sale.objects.create(**validated_data)
        
        for item_data in items_data:
            SaleItem.objects.create(sale=sale, **item_data)
        
        return sale


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.code', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'product_code', 'movement_type',
            'quantity', 'unit_price', 'total_price', 'reference_type',
            'reference_id', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'total_price', 'created_at']


class CompanySerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = [
            'id', 'razao_social', 'nome_fantasia', 'cnpj', 'inscricao_estadual',
            'cep', 'street', 'number', 'complement',
            'neighborhood', 'city', 'state', 'phone', 'email', 'website',
            'responsavel', 'logo', 'logo_url', 'active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'logo_url', 'created_at', 'updated_at']
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None
