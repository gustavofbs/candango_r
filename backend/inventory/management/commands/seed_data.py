from django.core.management.base import BaseCommand
from inventory.models import Category, Product, Customer, Supplier
from decimal import Decimal
from datetime import date


class Command(BaseCommand):
    help = 'Popula o banco de dados com dados de teste'

    def handle(self, *args, **kwargs):
        self.stdout.write('Criando dados de teste...')

        categories = [
            Category.objects.get_or_create(name='Eletrônicos', defaults={'description': 'Produtos eletrônicos'})[0],
            Category.objects.get_or_create(name='Alimentos', defaults={'description': 'Produtos alimentícios'})[0],
            Category.objects.get_or_create(name='Bebidas', defaults={'description': 'Bebidas em geral'})[0],
            Category.objects.get_or_create(name='Limpeza', defaults={'description': 'Produtos de limpeza'})[0],
            Category.objects.get_or_create(name='Higiene', defaults={'description': 'Produtos de higiene pessoal'})[0],
        ]
        self.stdout.write(self.style.SUCCESS(f'✓ {len(categories)} categorias criadas'))

        products_data = [
            {
                'code': 'PROD001',
                'name': 'Mouse Sem Fio',
                'category': categories[0],
                'unit': 'UN',
                'purchase_price': Decimal('25.00'),
                'sale_price': Decimal('45.00'),
                'current_stock': Decimal('50'),
                'min_stock': Decimal('10'),
                'max_stock': Decimal('100'),
                'location': 'Prateleira A1',
            },
            {
                'code': 'PROD002',
                'name': 'Teclado Mecânico',
                'category': categories[0],
                'unit': 'UN',
                'purchase_price': Decimal('150.00'),
                'sale_price': Decimal('280.00'),
                'current_stock': Decimal('30'),
                'min_stock': Decimal('5'),
                'max_stock': Decimal('50'),
                'location': 'Prateleira A2',
            },
            {
                'code': 'PROD003',
                'name': 'Arroz 5kg',
                'category': categories[1],
                'unit': 'UN',
                'purchase_price': Decimal('18.00'),
                'sale_price': Decimal('28.00'),
                'current_stock': Decimal('8'),
                'min_stock': Decimal('20'),
                'max_stock': Decimal('200'),
                'location': 'Estoque B1',
            },
            {
                'code': 'PROD004',
                'name': 'Feijão 1kg',
                'category': categories[1],
                'unit': 'UN',
                'purchase_price': Decimal('6.50'),
                'sale_price': Decimal('10.90'),
                'current_stock': Decimal('5'),
                'min_stock': Decimal('30'),
                'max_stock': Decimal('150'),
                'location': 'Estoque B1',
            },
            {
                'code': 'PROD005',
                'name': 'Refrigerante 2L',
                'category': categories[2],
                'unit': 'UN',
                'purchase_price': Decimal('4.50'),
                'sale_price': Decimal('8.90'),
                'current_stock': Decimal('120'),
                'min_stock': Decimal('50'),
                'max_stock': Decimal('300'),
                'location': 'Geladeira 1',
            },
            {
                'code': 'PROD006',
                'name': 'Água Mineral 500ml',
                'category': categories[2],
                'unit': 'UN',
                'purchase_price': Decimal('1.20'),
                'sale_price': Decimal('2.50'),
                'current_stock': Decimal('200'),
                'min_stock': Decimal('100'),
                'max_stock': Decimal('500'),
                'location': 'Estoque C1',
            },
            {
                'code': 'PROD007',
                'name': 'Detergente 500ml',
                'category': categories[3],
                'unit': 'UN',
                'purchase_price': Decimal('2.00'),
                'sale_price': Decimal('3.90'),
                'current_stock': Decimal('80'),
                'min_stock': Decimal('30'),
                'max_stock': Decimal('150'),
                'location': 'Prateleira D1',
            },
            {
                'code': 'PROD008',
                'name': 'Sabão em Pó 1kg',
                'category': categories[3],
                'unit': 'UN',
                'purchase_price': Decimal('8.50'),
                'sale_price': Decimal('14.90'),
                'current_stock': Decimal('45'),
                'min_stock': Decimal('20'),
                'max_stock': Decimal('100'),
                'location': 'Prateleira D2',
            },
            {
                'code': 'PROD009',
                'name': 'Shampoo 400ml',
                'category': categories[4],
                'unit': 'UN',
                'purchase_price': Decimal('12.00'),
                'sale_price': Decimal('19.90'),
                'current_stock': Decimal('60'),
                'min_stock': Decimal('25'),
                'max_stock': Decimal('120'),
                'location': 'Prateleira E1',
            },
            {
                'code': 'PROD010',
                'name': 'Sabonete 90g',
                'category': categories[4],
                'unit': 'UN',
                'purchase_price': Decimal('1.80'),
                'sale_price': Decimal('3.50'),
                'current_stock': Decimal('150'),
                'min_stock': Decimal('50'),
                'max_stock': Decimal('300'),
                'location': 'Prateleira E2',
            },
        ]

        for product_data in products_data:
            Product.objects.get_or_create(code=product_data['code'], defaults=product_data)
        self.stdout.write(self.style.SUCCESS(f'✓ {len(products_data)} produtos criados'))

        customers_data = [
            {
                'code': 'CLI001',
                'name': 'João da Silva',
                'document': '123.456.789-00',
                'email': 'joao.silva@email.com',
                'phone': '(61) 98765-4321',
                'address': 'Rua das Flores, 123',
                'city': 'Brasília',
                'state': 'DF',
            },
            {
                'code': 'CLI002',
                'name': 'Maria Santos',
                'document': '987.654.321-00',
                'email': 'maria.santos@email.com',
                'phone': '(61) 91234-5678',
                'address': 'Avenida Central, 456',
                'city': 'Brasília',
                'state': 'DF',
            },
            {
                'code': 'CLI003',
                'name': 'Empresa ABC Ltda',
                'document': '12.345.678/0001-90',
                'email': 'contato@empresaabc.com',
                'phone': '(61) 3333-4444',
                'address': 'Setor Comercial Sul, 789',
                'city': 'Brasília',
                'state': 'DF',
            },
            {
                'code': 'CLI004',
                'name': 'Pedro Oliveira',
                'document': '456.789.123-00',
                'email': 'pedro.oliveira@email.com',
                'phone': '(61) 99999-8888',
                'address': 'Quadra 10, Casa 5',
                'city': 'Taguatinga',
                'state': 'DF',
            },
            {
                'code': 'CLI005',
                'name': 'Ana Paula Costa',
                'document': '789.123.456-00',
                'email': 'ana.costa@email.com',
                'phone': '(61) 97777-6666',
                'address': 'Rua do Comércio, 321',
                'city': 'Ceilândia',
                'state': 'DF',
            },
        ]

        for customer_data in customers_data:
            Customer.objects.get_or_create(code=customer_data['code'], defaults=customer_data)
        self.stdout.write(self.style.SUCCESS(f'✓ {len(customers_data)} clientes criados'))

        suppliers_data = [
            {
                'code': 'FORN001',
                'name': 'Distribuidora Tech Ltda',
                'document': '11.222.333/0001-44',
                'contact_name': 'Carlos Mendes',
                'email': 'vendas@distribuidoratech.com',
                'phone': '(11) 4444-5555',
                'address': 'Av. Paulista, 1000',
                'city': 'São Paulo',
                'state': 'SP',
            },
            {
                'code': 'FORN002',
                'name': 'Alimentos Brasil S.A.',
                'document': '22.333.444/0001-55',
                'contact_name': 'Fernanda Lima',
                'email': 'comercial@alimentosbrasil.com',
                'phone': '(21) 3333-2222',
                'address': 'Rua do Porto, 500',
                'city': 'Rio de Janeiro',
                'state': 'RJ',
            },
            {
                'code': 'FORN003',
                'name': 'Bebidas & Cia',
                'document': '33.444.555/0001-66',
                'contact_name': 'Roberto Santos',
                'email': 'vendas@bebidasecia.com',
                'phone': '(31) 2222-1111',
                'address': 'Av. Afonso Pena, 2000',
                'city': 'Belo Horizonte',
                'state': 'MG',
            },
            {
                'code': 'FORN004',
                'name': 'Limpeza Total Distribuidora',
                'document': '44.555.666/0001-77',
                'contact_name': 'Juliana Alves',
                'email': 'contato@limpezatotal.com',
                'phone': '(61) 3344-5566',
                'address': 'SIA Trecho 3, Lote 100',
                'city': 'Brasília',
                'state': 'DF',
            },
            {
                'code': 'FORN005',
                'name': 'Higiene & Beleza Atacado',
                'document': '55.666.777/0001-88',
                'contact_name': 'Marcos Silva',
                'email': 'vendas@higienebeleza.com',
                'phone': '(85) 3222-4444',
                'address': 'Rua do Comércio, 800',
                'city': 'Fortaleza',
                'state': 'CE',
            },
        ]

        for supplier_data in suppliers_data:
            Supplier.objects.get_or_create(code=supplier_data['code'], defaults=supplier_data)
        self.stdout.write(self.style.SUCCESS(f'✓ {len(suppliers_data)} fornecedores criados'))

        self.stdout.write(self.style.SUCCESS('\n✅ Dados de teste criados com sucesso!'))
        self.stdout.write(self.style.WARNING('\n⚠️  Note que alguns produtos estão com estoque abaixo do mínimo para teste do dashboard.'))
