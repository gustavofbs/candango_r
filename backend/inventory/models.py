from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='Nome')
    description = models.TextField(blank=True, null=True, verbose_name='Descrição')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    class Meta:
        verbose_name = 'Categoria'
        verbose_name_plural = 'Categorias'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    UNIT_CHOICES = [
        ('UN', 'Unidade'),
        ('KG', 'Quilograma'),
        ('L', 'Litro'),
        ('M', 'Metro'),
        ('CX', 'Caixa'),
        ('PC', 'Peça'),
    ]

    code = models.CharField(max_length=50, unique=True, blank=True, verbose_name='Código')
    name = models.CharField(max_length=200, verbose_name='Nome')
    composition = models.TextField(blank=True, null=True, verbose_name='Composição')
    size = models.CharField(max_length=50, blank=True, null=True, verbose_name='Tamanho')
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        verbose_name='Categoria'
    )
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='UN', verbose_name='Unidade')
    purchase_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Preço de Compra'
    )
    current_stock = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Estoque Atual'
    )
    min_stock = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Estoque Mínimo'
    )
    max_stock = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Estoque Máximo'
    )
    location = models.CharField(max_length=100, blank=True, null=True, verbose_name='Localização')
    active = models.BooleanField(default=True, verbose_name='Ativo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')

    class Meta:
        verbose_name = 'Produto'
        verbose_name_plural = 'Produtos'
        ordering = ['name']
    
    def save(self, *args, **kwargs):
        if not self.code:
            # Gera código automático
            last_product = Product.objects.order_by('-id').first()
            if last_product and last_product.code.isdigit():
                next_num = int(last_product.code) + 1
            else:
                next_num = 1
            self.code = str(next_num).zfill(5)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.code} - {self.name}'


class Customer(models.Model):
    code = models.CharField(max_length=50, unique=True, blank=True, verbose_name='Código')
    name = models.CharField(max_length=200, verbose_name='Nome')
    document = models.CharField(max_length=20, blank=True, null=True, verbose_name='CPF/CNPJ')
    email = models.EmailField(blank=True, null=True, verbose_name='Email')
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Telefone')
    zipcode = models.CharField(max_length=10, blank=True, null=True, verbose_name='CEP')
    address = models.CharField(max_length=300, blank=True, null=True, verbose_name='Endereço')
    neighborhood = models.CharField(max_length=100, blank=True, null=True, verbose_name='Bairro')
    city = models.CharField(max_length=100, blank=True, null=True, verbose_name='Cidade')
    state = models.CharField(max_length=2, blank=True, null=True, verbose_name='Estado')
    notes = models.TextField(blank=True, null=True, verbose_name='Observações')
    active = models.BooleanField(default=True, verbose_name='Ativo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['name']
    
    def save(self, *args, **kwargs):
        if not self.code:
            # Gera código automático
            last_customer = Customer.objects.order_by('-id').first()
            if last_customer and last_customer.code.isdigit():
                next_num = int(last_customer.code) + 1
            else:
                next_num = 1
            self.code = str(next_num).zfill(5)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.code} - {self.name}'


class Supplier(models.Model):
    code = models.CharField(max_length=50, unique=True, blank=True, verbose_name='Código')
    name = models.CharField(max_length=200, verbose_name='Nome')
    document = models.CharField(max_length=20, blank=True, null=True, verbose_name='CNPJ')
    contact_name = models.CharField(max_length=200, blank=True, null=True, verbose_name='Nome do Contato')
    email = models.EmailField(blank=True, null=True, verbose_name='Email')
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Telefone')
    zipcode = models.CharField(max_length=10, blank=True, null=True, verbose_name='CEP')
    address = models.CharField(max_length=300, blank=True, null=True, verbose_name='Endereço')
    neighborhood = models.CharField(max_length=100, blank=True, null=True, verbose_name='Bairro')
    city = models.CharField(max_length=100, blank=True, null=True, verbose_name='Cidade')
    state = models.CharField(max_length=2, blank=True, null=True, verbose_name='Estado')
    notes = models.TextField(blank=True, null=True, verbose_name='Observações')
    active = models.BooleanField(default=True, verbose_name='Ativo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    class Meta:
        verbose_name = 'Fornecedor'
        verbose_name_plural = 'Fornecedores'
        ordering = ['name']
    
    def save(self, *args, **kwargs):
        if not self.code:
            # Gera código automático
            last_supplier = Supplier.objects.order_by('-id').first()
            if last_supplier and last_supplier.code.isdigit():
                next_num = int(last_supplier.code) + 1
            else:
                next_num = 1
            self.code = str(next_num).zfill(5)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.code} - {self.name}'


class Expense(models.Model):
    EXPENSE_TYPE_CHOICES = [
        ('FIXO', 'Fixo'),
        ('VARIAVEL', 'Variável'),
    ]
    
    name = models.CharField(max_length=200, verbose_name='Nome da Despesa')
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Valor da Despesa'
    )
    expense_type = models.CharField(
        max_length=10,
        choices=EXPENSE_TYPE_CHOICES,
        verbose_name='Tipo'
    )
    date = models.DateField(verbose_name='Data')
    notes = models.TextField(blank=True, null=True, verbose_name='Observações')
    active = models.BooleanField(default=True, verbose_name='Ativo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')

    class Meta:
        verbose_name = 'Despesa'
        verbose_name_plural = 'Despesas'
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f'{self.name} - R$ {self.amount} ({self.get_expense_type_display()})'


class ProductionCost(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='production_costs',
        verbose_name='Produto'
    )
    description = models.CharField(max_length=200, blank=True, default='', verbose_name='Descrição')
    cost_type = models.CharField(max_length=50, verbose_name='Tipo de Custo')
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Valor'
    )
    date = models.DateField(verbose_name='Data')
    notes = models.TextField(blank=True, null=True, verbose_name='Observações')
    
    # Campos de refinamento
    refinement_code = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Código de Refinamento',
        help_text='Código único que agrupa custos do mesmo refinamento'
    )
    refinement_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Nome do Refinamento',
        help_text='Nome descritivo do refinamento'
    )
    
    # Campos de travamento
    is_locked = models.BooleanField(
        default=False,
        verbose_name='Travado',
        help_text='Indica se este custo foi usado em uma venda liquidada'
    )
    locked_by_sale = models.ForeignKey(
        'Sale',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='locked_costs',
        verbose_name='Venda que Travou'
    )
    locked_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Travado em'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    class Meta:
        verbose_name = 'Custo de Produção'
        verbose_name_plural = 'Custos de Produção'
        ordering = ['-date']
        indexes = [
            models.Index(fields=['refinement_code']),
            models.Index(fields=['is_locked']),
        ]

    def __str__(self):
        if self.refinement_code:
            return f'{self.refinement_code} - {self.product.name} - {self.get_cost_type_display()} - R$ {self.value}'
        return f'{self.product.name} - {self.description} - R$ {self.value}'


class Sale(models.Model):
    STATUS_CHOICES = [
        ('disputa', 'Disputa'),
        ('homologado', 'Homologado'),
        ('producao', 'Produção'),
        ('aguardando_pagamento', 'Aguardando Pagamento'),
        ('liquidado', 'Liquidado'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('dinheiro', 'Dinheiro'),
        ('cartao_credito', 'Cartão de Crédito'),
        ('cartao_debito', 'Cartão de Débito'),
        ('pix', 'PIX'),
        ('boleto', 'Boleto'),
        ('transferencia', 'Transferência'),
    ]

    SALE_TYPE_CHOICES = [
        ('venda', 'Venda'),
        ('dispensa', 'Dispensa'),
        ('pregao', 'Pregão'),
    ]

    sale_number = models.CharField(max_length=50, unique=True, verbose_name='Número da Venda')
    sale_type = models.CharField(
        max_length=20,
        choices=SALE_TYPE_CHOICES,
        default='venda',
        verbose_name='Tipo de Venda'
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sales',
        verbose_name='Cliente'
    )
    sale_date = models.DateField(verbose_name='Data da Venda')
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Valor Total'
    )
    discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Desconto'
    )
    final_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Valor Final'
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        blank=True,
        null=True,
        verbose_name='Forma de Pagamento'
    )
    nf = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Nota Fiscal',
        help_text='Número da Nota Fiscal'
    )
    tax_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        verbose_name='Percentual de Imposto (%)',
        help_text='Percentual de imposto aplicado sobre o valor total'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente', verbose_name='Status')
    notes = models.TextField(blank=True, null=True, verbose_name='Observações')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    class Meta:
        verbose_name = 'Venda'
        verbose_name_plural = 'Vendas'
        ordering = ['-sale_date', '-created_at']

    def __str__(self):
        return f'{self.sale_number} - R$ {self.final_amount}'

    def save(self, *args, **kwargs):
        self.final_amount = self.total_amount - self.discount
        super().save(*args, **kwargs)


class SaleItem(models.Model):
    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Venda'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='sale_items',
        verbose_name='Produto'
    )
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Quantidade'
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Preço Unitário'
    )
    unit_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Custo Unitário'
    )
    cost_refinement_code = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Código de Refinamento de Custo',
        help_text='Código do refinamento de custo usado neste item'
    )
    cost_snapshot = models.JSONField(
        blank=True,
        null=True,
        verbose_name='Snapshot do Custo',
        help_text='Detalhamento dos custos no momento da venda'
    )
    cost_calculated_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Custo Calculado em'
    )
    discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Desconto'
    )
    tax = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Imposto'
    )
    freight = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Frete'
    )
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Preço Total'
    )
    total_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Custo Total'
    )
    profit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Lucro'
    )

    class Meta:
        verbose_name = 'Item de Venda'
        verbose_name_plural = 'Itens de Venda'

    def __str__(self):
        return f'{self.sale.sale_number} - {self.product.name}'

    def save(self, *args, **kwargs):
        # Calcula preço total
        self.total_price = (self.quantity * self.unit_price) - self.discount
        # Calcula custo total
        self.total_cost = self.quantity * self.unit_cost
        # Calcula lucro: (preço total - custo total - imposto - frete)
        self.profit = self.total_price - self.total_cost - self.tax - self.freight
        super().save(*args, **kwargs)


class StockMovement(models.Model):
    MOVEMENT_TYPE_CHOICES = [
        ('entrada', 'Entrada'),
        ('saida', 'Saída'),
        ('ajuste', 'Ajuste'),
    ]

    REFERENCE_TYPE_CHOICES = [
        ('compra', 'Compra'),
        ('venda', 'Venda'),
        ('devolucao', 'Devolução'),
        ('transferencia', 'Transferência'),
        ('ajuste_inventario', 'Ajuste de Inventário'),
        ('perda', 'Perda'),
        ('outros', 'Outros'),
    ]

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='stock_movements',
        verbose_name='Produto'
    )
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPE_CHOICES, verbose_name='Tipo de Movimentação')
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Quantidade'
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Preço Unitário'
    )
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Preço Total'
    )
    reference_type = models.CharField(
        max_length=30,
        choices=REFERENCE_TYPE_CHOICES,
        blank=True,
        null=True,
        verbose_name='Tipo de Referência'
    )
    reference_id = models.IntegerField(blank=True, null=True, verbose_name='ID de Referência')
    notes = models.TextField(blank=True, null=True, verbose_name='Observações')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    class Meta:
        verbose_name = 'Movimentação de Estoque'
        verbose_name_plural = 'Movimentações de Estoque'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.product.name} - {self.movement_type} - {self.quantity}'

    def save(self, *args, **kwargs):
        if self.unit_price and self.quantity:
            self.total_price = self.unit_price * self.quantity
        
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            if self.movement_type == 'entrada':
                self.product.current_stock += self.quantity
            elif self.movement_type == 'saida':
                self.product.current_stock -= self.quantity
            elif self.movement_type == 'ajuste':
                self.product.current_stock = self.quantity
            
            self.product.save()


class Company(models.Model):
    razao_social = models.CharField(max_length=200, verbose_name='Razão Social')
    nome_fantasia = models.CharField(max_length=200, blank=True, null=True, verbose_name='Nome Fantasia')
    cnpj = models.CharField(max_length=18, unique=True, verbose_name='CNPJ')
    inscricao_estadual = models.CharField(max_length=20, blank=True, null=True, verbose_name='Inscrição Estadual')
    
    # Endereço
    cep = models.CharField(max_length=9, verbose_name='CEP')
    street = models.CharField(max_length=200, verbose_name='Rua')
    number = models.CharField(max_length=20, verbose_name='Número')
    complement = models.CharField(max_length=100, blank=True, null=True, verbose_name='Complemento')
    neighborhood = models.CharField(max_length=100, verbose_name='Bairro')
    city = models.CharField(max_length=100, verbose_name='Cidade')
    state = models.CharField(max_length=2, verbose_name='UF')
    
    # Contato
    phone = models.CharField(max_length=20, verbose_name='Telefone')
    email = models.EmailField(verbose_name='E-mail')
    website = models.URLField(blank=True, null=True, verbose_name='Website')
    
    # Responsável
    responsavel = models.CharField(max_length=200, verbose_name='Responsável')
    
    # Logo
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True, verbose_name='Logo')
    
    # Metadata
    active = models.BooleanField(default=True, verbose_name='Ativo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')

    class Meta:
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'
        ordering = ['-created_at']

    def __str__(self):
        return self.razao_social
