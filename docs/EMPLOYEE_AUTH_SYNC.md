# Sincronização Automática: Employees → Users → Auth

## Resumo

Implementado sistema de sincronização bidirecional entre `employees`, `public.users` e `auth.users` no Supabase.

## Problema Inicial

Quando um colaborador era criado diretamente na tabela `employees`, **não havia** criação automática de:
- ❌ Registro em `public.users`
- ❌ Registro em `auth.users` (credenciais de login)

**Resultado**: Colaboradores criados não conseguiam fazer login no sistema.

## Solução Implementada

### Fluxo de Sincronização

#### 1️⃣ **Criação via Employee** (NOVO)
```
employees (INSERT)
    ↓ [trigger: on_employee_create_auth]
auth.users (criado com senha = email)
    ↓ [trigger existente: on_auth_user_created]
public.users (criado automaticamente)
    ↓ [trigger existente: on_user_to_employee]
employees (atualizado se necessário)
```

#### 2️⃣ **Criação via Auth** (JÁ EXISTIA)
```
auth.users (signup)
    ↓ [trigger: on_auth_user_created]
public.users
    ↓ [trigger: on_user_to_employee]
employees
```

### Mapeamento de Roles

| employee.user_role | users.role | Descrição |
|-------------------|------------|-----------|
| `colaborador` | `sales` | Vendedor/SDR/Closer |
| `gestor` | `manager` | Gerente de equipe |
| `admin` | `admin` | Administrador |

### Trigger Criado

**Nome**: `on_employee_create_auth`  
**Tabela**: `public.employees`  
**Evento**: `AFTER INSERT`  
**Função**: `public.handle_employee_to_auth()`

**Lógica**:
1. Verifica se já existe `auth.users` com o email
2. Se não existir:
   - Mapeia `employee.user_role` → `users.role`
   - Cria `auth.users` com:
     - `id` = employee.id (para facilitar mapeamento)
     - `email` = employee.email
     - `password` = employee.email (criptografado com bcrypt)
     - `email_confirmed_at` = NOW() (auto-confirmado)
     - `raw_user_meta_data` = { name, role, whitelabel_id }
3. O trigger existente `on_auth_user_created` cria `public.users` automaticamente

## Backfill Realizado

Executado backfill para sincronizar employees existentes:

**Antes**:
- 26 employees totais
- 10+ sem auth.users
- 10+ sem public.users

**Depois**:
- ✅ 26 employees totais
- ✅ 0 sem auth.users
- ✅ 0 sem public.users
- ✅ 26 totalmente sincronizados

## Credenciais Padrão

**IMPORTANTE**: Quando um colaborador é criado, a senha inicial é **igual ao email**.

**Exemplo**:
- Email: `joao.silva@example.com`
- Senha inicial: `joao.silva@example.com`

⚠️ **Recomendação**: Implemente um fluxo de "primeiro acesso" que force o usuário a alterar a senha.

## Como Testar

### Teste 1: Criar Novo Colaborador

```sql
-- Inserir novo colaborador
INSERT INTO public.employees (
  id,
  name,
  email,
  phone,
  role,
  department,
  hire_date,
  status,
  whitelabel_id,
  user_role
)
VALUES (
  gen_random_uuid(),
  'Teste Silva',
  'teste.silva@example.com',
  '11999999999',
  'sales',
  'Sales',
  CURRENT_DATE,
  'active',
  '11111111-1111-1111-1111-111111111111', -- ID do whitelabel
  'colaborador'
);

-- Verificar criação automática
SELECT 
  e.name as employee_name,
  e.email,
  u.role as user_role,
  au.email_confirmed_at,
  'SUCCESS' as status
FROM public.employees e
INNER JOIN public.users u ON e.email = u.email
INNER JOIN auth.users au ON e.email = au.email
WHERE e.email = 'teste.silva@example.com';
```

### Teste 2: Login do Colaborador

1. Vá para a página de login
2. Email: `teste.silva@example.com`
3. Senha: `teste.silva@example.com`
4. ✅ Deve fazer login com sucesso

## Arquivos Modificados

1. **scripts/27-employee-to-auth-sync.sql** - Script de migração completo
2. **docs/EMPLOYEE_AUTH_SYNC.md** - Esta documentação

## Queries de Monitoramento

### Ver Status de Sincronização

```sql
SELECT 
  'Employees sem auth' as status,
  COUNT(*) as count
FROM public.employees e
LEFT JOIN auth.users au ON e.email = au.email
WHERE au.id IS NULL

UNION ALL

SELECT 
  'Employees sem users' as status,
  COUNT(*) as count
FROM public.employees e
LEFT JOIN public.users u ON e.email = u.email
WHERE u.id IS NULL

UNION ALL

SELECT 
  'Totalmente sincronizados' as status,
  COUNT(*) as count
FROM public.employees e
INNER JOIN auth.users au ON e.email = au.email
INNER JOIN public.users u ON e.email = u.email;
```

### Ver Detalhes de Um Colaborador

```sql
SELECT 
  e.id as employee_id,
  e.name,
  e.email,
  e.user_role as employee_role,
  u.id as user_id,
  u.role as user_role,
  au.id as auth_id,
  au.email_confirmed_at,
  au.created_at as auth_created_at
FROM public.employees e
LEFT JOIN public.users u ON e.email = u.email
LEFT JOIN auth.users au ON e.email = au.email
WHERE e.email = 'email@example.com';
```

## Segurança

### Proteção de Senha

- ✅ Senha criptografada com **bcrypt** (gen_salt('bf'))
- ✅ Não armazenada em texto plano
- ✅ Mesmo algoritmo usado pelo Supabase Auth

### Política de Email Confirmado

- ✅ Email auto-confirmado (`email_confirmed_at = NOW()`)
- ⚠️ **Considere**: Implementar verificação de email se necessário

## Melhorias Futuras Recomendadas

1. **Primeiro Acesso**
   - Forçar troca de senha no primeiro login
   - Enviar email de boas-vindas

2. **Verificação de Email**
   - Adicionar fluxo de confirmação de email
   - Enviar link de ativação

3. **Gestão de Senha**
   - Gerar senha aleatória em vez de usar email
   - Enviar senha inicial por email/SMS

4. **Auditoria**
   - Log de criação de usuários
   - Notificar admins quando colaborador é criado

5. **Sincronização de Updates**
   - Adicionar trigger AFTER UPDATE em employees
   - Sincronizar mudanças de nome, role, etc.

## Troubleshooting

### Colaborador Criado Mas Não Consegue Logar

```sql
-- Verificar se auth foi criado
SELECT * FROM auth.users WHERE email = 'colaborador@email.com';

-- Se não existir, verificar employee
SELECT * FROM public.employees WHERE email = 'colaborador@email.com';

-- Criar manualmente se necessário
-- (ou deletar e recriar o employee para trigger funcionar)
```

### Email Duplicado

Se tentar criar employee com email já existente em auth:

```sql
-- O trigger detectará e não criará duplicata
-- Verificar via:
SELECT 
  e.email,
  COUNT(DISTINCT au.id) as auth_count,
  COUNT(DISTINCT u.id) as user_count
FROM public.employees e
LEFT JOIN auth.users au ON e.email = au.email
LEFT JOIN public.users u ON e.email = u.email
GROUP BY e.email
HAVING COUNT(DISTINCT au.id) > 1 OR COUNT(DISTINCT u.id) > 1;
```

## Resultados da Migração

✅ **Trigger criado**: `on_employee_create_auth`  
✅ **Função criada**: `public.handle_employee_to_auth()`  
✅ **Backfill executado**: 26 employees sincronizados  
✅ **0 employees** sem auth.users  
✅ **0 employees** sem public.users  
✅ **100% sincronização** completa  

## Próximo Passo

Teste criando um novo colaborador via interface da aplicação e verifique se consegue fazer login imediatamente!
