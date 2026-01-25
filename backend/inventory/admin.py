from django.contrib import admin
from .models import Category, Product, Customer, Supplier, ProductionCost, Sale, SaleItem, StockMovement


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'category', 'current_stock', 'min_stock', 'purchase_price', 'active']
    list_filter = ['active', 'category']
    search_fields = ['code', 'name']
    list_editable = ['active']


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'document', 'email', 'phone', 'city', 'active']
    list_filter = ['active', 'state']
    search_fields = ['code', 'name', 'document', 'email']
    list_editable = ['active']


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'document', 'contact_name', 'email', 'phone', 'active']
    list_filter = ['active', 'state']
    search_fields = ['code', 'name', 'document', 'email']
    list_editable = ['active']


@admin.register(ProductionCost)
class ProductionCostAdmin(admin.ModelAdmin):
    list_display = ['product', 'description', 'cost_type', 'value', 'date']
    list_filter = ['cost_type', 'date']
    search_fields = ['product__name', 'description']
    date_hierarchy = 'date'


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 1
    fields = ['product', 'quantity', 'unit_price', 'discount', 'total_price']
    readonly_fields = ['total_price']


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ['sale_number', 'customer', 'sale_date', 'total_amount', 'discount', 'final_amount', 'status']
    list_filter = ['status', 'payment_method', 'sale_date']
    search_fields = ['sale_number', 'customer__name']
    date_hierarchy = 'sale_date'
    readonly_fields = ['final_amount']
    inlines = [SaleItemInline]


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['product', 'movement_type', 'quantity', 'reference_type', 'created_at']
    list_filter = ['movement_type', 'reference_type', 'created_at']
    search_fields = ['product__name', 'notes']
    date_hierarchy = 'created_at'
    readonly_fields = ['total_price', 'created_at']
