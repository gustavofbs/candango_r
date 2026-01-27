from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, ProductViewSet, CustomerViewSet,
    SupplierViewSet, ExpenseViewSet, ProductionCostViewSet, SaleViewSet,
    StockMovementViewSet, CompanyViewSet
)
from . import views

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'production-costs', ProductionCostViewSet, basename='productioncost')
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'stock-movements', StockMovementViewSet, basename='stockmovement')
router.register(r'company', CompanyViewSet, basename='company')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', views.dashboard_view, name='dashboard'),
]
