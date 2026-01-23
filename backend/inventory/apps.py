from django.apps import AppConfig


class InventoryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'inventory'
    verbose_name = 'Sistema de Controle de Estoque'
    
    def ready(self):
        import inventory.signals
