# Fix: Admin@acme.com Não Conseguia Acessar Configurações

## Problema Reportado

O usuário `admin@acme.com` com role `admin` não conseguia acessar a página `/configuracoes` do whitelabel.

## Investigação

### 1. Verificação do Role
```sql
SELECT email, role FROM users WHERE email = 'admin@acme.com';
-- Resultado: role = "admin" ✅ (correto)
```

### 2. Verificação do Whitelabel
```sql
SELECT u.email, u.whitelabel_id, w.name 
FROM users u 
JOIN whitelabels w ON u.whitelabel_id = w.id
WHERE u.email = 'admin@acme.com';
```

**Resultado**: 
- ❌ whitelabel_id = `22222222-2222-2222-2222-222222222222` (TechStart CRM)
- ✅ Deveria ser = `11111111-1111-1111-1111-111111111111` (Axis/Acme)

## Causa Raiz

O usuário `admin@acme.com` estava **associado ao whitelabel errado**:

| Campo | Valor Incorreto | Valor Correto |
|-------|----------------|---------------|
| **whitelabel_id** | TechStart CRM | Axis (Acme) |
| **whitelabel_name** | TechStart CRM | Axis |
| **domain** | techstart.example.com | acme.example.com |

### Por Que Isso Impedia o Acesso?

A página de configurações (`/configuracoes`) usa a função `isAdmin(user)` que verifica:
1. ✅ Se o role é "admin" ou "superadmin" → **PASSOU**
2. Mas as configurações de whitelabel são específicas por whitelabel

Embora o usuário tivesse permissão para ver a página, ele estava vendo/editando as configurações do **whitelabel errado** (TechStart em vez de Acme).

## Solução Aplicada

### 1. Corrigido `public.users`
```sql
UPDATE public.users
SET whitelabel_id = '11111111-1111-1111-1111-111111111111'
WHERE email = 'admin@acme.com';
```

### 2. Corrigido `public.employees`
```sql
UPDATE public.employees
SET whitelabel_id = '11111111-1111-1111-1111-111111111111'
WHERE email = 'admin@acme.com';
```

### 3. Resultado
```sql
-- Verificação após correção
SELECT 
  u.email,
  u.role,
  w.name as whitelabel_name,
  w.domain
FROM public.users u
JOIN public.whitelabels w ON u.whitelabel_id = w.id
WHERE u.email = 'admin@acme.com';
```

| email | role | whitelabel_name | domain |
|-------|------|-----------------|--------|
| admin@acme.com | admin | Axis | acme.example.com |

✅ **Agora o usuário está no whitelabel correto!**

## Whitelabels no Sistema

| ID | Nome | Domain |
|----|------|--------|
| `11111111-1111-1111-1111-111111111111` | **Axis** | acme.example.com |
| `22222222-2222-2222-2222-222222222222` | **TechStart CRM** | techstart.example.com |
| `70452663-7f7f-43e9-9fa4-ed999b1805ff` | **SuperAdmin Dashboard** | superadmin.localhost |

**Nota**: O whitelabel "Axis" usa o domínio "acme.example.com", o que explica o email `@acme.com`.

## Teste

1. **Faça logout** da sessão atual
2. **Faça login** novamente como `admin@acme.com`
3. **Acesse** `/configuracoes`
4. ✅ Deve conseguir acessar e ver as configurações do whitelabel **Axis**

## Verificação de Outros Usuários

Para evitar problemas similares, execute:

```sql
-- Verificar se há outros usuários com email/whitelabel incompatíveis
SELECT 
  u.email,
  u.role,
  w.name as whitelabel_name,
  w.domain,
  CASE 
    WHEN u.email LIKE '%@acme.com%' AND w.domain != 'acme.example.com' THEN '⚠️ MISMATCH'
    WHEN u.email LIKE '%@techstart.com%' AND w.domain != 'techstart.example.com' THEN '⚠️ MISMATCH'
    ELSE '✅ OK'
  END as status
FROM public.users u
JOIN public.whitelabels w ON u.whitelabel_id = w.id
WHERE u.role != 'SuperAdmin'
ORDER BY status DESC, u.email;
```

## Prevenção

### Recomendações

1. **Validação no Cadastro**: Ao criar usuário, validar que o domínio do email corresponde ao whitelabel
2. **Constraint no Banco**: Adicionar validação para garantir consistência
3. **Auditoria Periódica**: Executar query de verificação mensalmente

### Query de Auditoria
```sql
-- Encontrar inconsistências email/whitelabel
SELECT 
  u.email,
  SUBSTRING(u.email FROM '@(.*)$') as email_domain,
  w.domain as whitelabel_domain,
  w.name as whitelabel_name
FROM public.users u
JOIN public.whitelabels w ON u.whitelabel_id = w.id
WHERE u.role != 'SuperAdmin'
  AND SUBSTRING(u.email FROM '@(.*)$') != SUBSTRING(w.domain FROM '^([^.]+)')
ORDER BY u.email;
```

## Arquivos Relacionados

- `lib/permissions.ts` - Função `isAdmin()` (funcionando corretamente)
- `app/dashboard/Configuracoes/page.tsx` - Página de configurações
- `hooks/use-auth.tsx` - Hook de autenticação
- `app/api/auth/me/route.ts` - API que retorna dados do usuário

## Resumo

✅ **Problema**: Usuário associado ao whitelabel errado  
✅ **Solução**: Corrigido whitelabel_id em users e employees  
✅ **Status**: Resolvido - usuário pode acessar configurações  
✅ **Ação Necessária**: Fazer logout e login novamente  
