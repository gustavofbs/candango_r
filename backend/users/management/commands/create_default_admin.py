from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Cria o usuário admin padrão se não existir nenhum superusuário'

    def handle(self, *args, **options):
        if not User.objects.filter(is_staff=True).exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@empresa.com',
                password='admin123',
                first_name='Administrador',
            )
            self.stdout.write(self.style.SUCCESS(
                'Admin padrão criado: usuário=admin / senha=admin123 — ALTERE A SENHA!'
            ))
        else:
            self.stdout.write('Usuário admin já existe, nenhuma ação necessária.')
