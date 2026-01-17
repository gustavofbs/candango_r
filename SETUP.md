# Setup do Projeto - Candango R

## Instalação de Dependências

Após a remoção do Supabase, é necessário instalar as novas dependências:

```bash
pnpm install
```

Isso irá instalar o `axios` e todas as outras dependências do projeto.

## Configuração de Variáveis de Ambiente

1. Copie o arquivo `env.example` para `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Edite o arquivo `.env.local` e configure a URL da API Django:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

## Estrutura da API

A camada de API foi criada em `lib/api/` com os seguintes módulos:

- `client.ts` - Cliente HTTP configurado com axios
- `products.ts` - API de produtos
- `categories.ts` - API de categorias
- `customers.ts` - API de clientes
- `suppliers.ts` - API de fornecedores
- `sales.ts` - API de vendas
- `movements.ts` - API de movimentações de estoque
- `costs.ts` - API de custos de produção
- `dashboard.ts` - API do dashboard

## Próximos Passos

Após instalar as dependências, você estará pronto para:
1. Configurar o backend Django (Fase 2)
2. Integrar o frontend com a API Django (Fase 5)
