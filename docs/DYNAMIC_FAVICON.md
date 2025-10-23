# Sistema de Favicon Dinâmico

## Visão Geral

O sistema de favicon dinâmico permite que cada whitelabel (cliente) tenha seu próprio favicon baseado em sua logo. O favicon é atualizado automaticamente com base no domínio que está acessando a aplicação.

## Como Funciona

### 1. Estrutura do Banco de Dados

A tabela `whitelabels` já possui os campos necessários:
- `domain` - Domínio do cliente (ex: `cliente1.seuapp.com`)
- `logo_url` - URL da logo armazenada no Supabase Storage

### 2. Componentes do Sistema

#### API Route: `/api/favicon`
- **Arquivo**: `app/api/favicon/route.ts`
- **Função**: Busca o whitelabel pelo domínio do request e redireciona para a logo correspondente
- **Fallback**: Redireciona para `/favicon.ico` se não encontrar logo

#### Componente Client-Side: `DynamicFavicon`
- **Arquivo**: `components/dynamic-favicon.tsx`
- **Função**: Atualiza o favicon dinamicamente no navegador usando a logo do whitelabel autenticado
- **Benefícios**: Funciona mesmo sem reload da página

#### Integração no Layout
- **Arquivo**: `app/layout.tsx`
- O componente `DynamicFavicon` está integrado dentro do `AuthProvider`

## Configuração

### Passo 1: Adicionar Domínio no Supabase

Para cada whitelabel, você precisa adicionar o domínio na tabela:

```sql
UPDATE whitelabels
SET domain = 'cliente1.seuapp.com'
WHERE id = 'uuid-do-whitelabel';
```

### Passo 2: Upload da Logo

1. Acesse a página de Configurações
2. Faça upload da logo (formato quadrado recomendado: 512x512px)
3. A logo é automaticamente armazenada no Supabase Storage

### Passo 3: Configurar DNS

No provedor de DNS do cliente:
1. Adicione um registro CNAME apontando para seu domínio do Vercel
2. Exemplo: `cliente1.seuapp.com` → `seu-projeto.vercel.app`

### Passo 4: Adicionar Domínio no Vercel

1. Acesse o projeto no Vercel
2. Vá em Settings → Domains
3. Adicione o domínio do cliente
4. Verifique a configuração DNS

## Fluxo de Funcionamento

### Primeira Visita (Antes do Login)
1. Usuário acessa `cliente1.seuapp.com`
2. API `/api/favicon` é chamada
3. Busca whitelabel pelo domínio
4. Retorna a logo como favicon

### Após Login
1. Componente `DynamicFavicon` é montado
2. Usa a logo do whitelabel do usuário autenticado
3. Atualiza o favicon dinamicamente

## Formatos de Logo Suportados

- **Formatos**: PNG, SVG, JPEG, WebP
- **Tamanho Máximo**: 5MB
- **Dimensões Recomendadas**: 512x512px (quadrado)
- **Dimensões Mínimas**: 200x200px
- **Dimensões Máximas**: 1024x1024px

## Troubleshooting

### Favicon não aparece
1. Verifique se o campo `domain` está preenchido corretamente
2. Verifique se a logo foi feita upload com sucesso
3. Limpe o cache do navegador (Ctrl+Shift+Delete)
4. Verifique os logs da API em `/api/favicon`

### Logo não carrega
1. Verifique se o Storage do Supabase está público
2. Verifique se a URL da logo está acessível
3. Verifique as permissões de RLS no Storage

### Domínio não funciona
1. Verifique se o domínio está configurado no Vercel
2. Verifique se o DNS está apontando corretamente
3. Aguarde propagação do DNS (pode levar até 48h)

## Exemplo de Configuração Completa

```sql
-- 1. Atualizar domínio do whitelabel
UPDATE whitelabels
SET domain = 'cliente1.seuapp.com'
WHERE name = 'Cliente 1';

-- 2. Verificar configuração
SELECT name, domain, logo_url
FROM whitelabels
WHERE domain = 'cliente1.seuapp.com';
```

## Notas Técnicas

- O favicon é atualizado sem necessidade de reload da página
- Suporta múltiplos domínios apontando para o mesmo projeto
- Cache do navegador pode causar atraso na atualização (limpe o cache se necessário)
- A logo é servida diretamente do Supabase Storage para melhor performance

## Segurança

- O campo `domain` tem constraint UNIQUE no banco de dados
- Apenas whitelabels autenticados podem acessar suas logos
- As logos são armazenadas em storage público, mas a URL é privada
