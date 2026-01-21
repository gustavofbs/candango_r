# Backend Django - Candango R

Sistema ERP de Controle de Estoque - Backend API REST

## Setup Inicial

### 1. Criar ambiente virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Configurar variáveis de ambiente

Copie o arquivo `env.example` para `.env`:

```bash
cp env.example .env
```

Edite o arquivo `.env` e configure as variáveis necessárias.

### 4. Executar migrations

```bash
python manage.py migrate
```

### 5. Criar superusuário (admin)

```bash
python manage.py createsuperuser
```

### 6. Rodar servidor de desenvolvimento

```bash
python manage.py runserver
```

O servidor estará disponível em: `http://localhost:8000`

## Estrutura do Projeto

```
backend/
├── config/              # Configurações do Django
│   ├── settings.py      # Settings principal
│   ├── urls.py          # URLs raiz
│   ├── wsgi.py          # WSGI para produção
│   └── asgi.py          # ASGI para async
├── inventory/           # App principal do sistema
│   ├── models.py        # Models do banco de dados
│   ├── serializers.py   # Serializers DRF
│   ├── views.py         # ViewSets da API
│   ├── urls.py          # URLs da API
│   └── admin.py         # Configuração do Django Admin
├── manage.py            # CLI do Django
└── requirements.txt     # Dependências Python
```

## Endpoints da API

Após configurar o projeto, a API estará disponível em:

- `http://localhost:8000/api/` - Endpoints da API
- `http://localhost:8000/admin/` - Django Admin

## Próximos Passos

1. Implementar models (Fase 3)
2. Criar serializers e viewsets (Fase 4)
3. Configurar autenticação JWT (Fase 6)
4. Deploy no Render (Fase 8)
