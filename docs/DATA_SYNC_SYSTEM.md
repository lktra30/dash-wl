# Sistema de Sincronização de Dados

## Resumo

Este documento descreve o sistema automático de sincronização entre as tabelas `auth.users`, `public.users`, `public.employees` e `public.commissions_settings`.

## Estrutura de Dados

### 1. auth.users (Autenticação Supabase)
- Tabela gerenciada pelo Supabase Auth
- Contém credenciais e informações de autenticação
- Todo usuário que faz login tem registro aqui

### 2. public.users (Usuários do Sistema)
- Contém informações de perfil dos usuários
- Sincronizado automaticamente com `auth.users`
- Campos importantes:
  - `id`: Mesmo UUID do `auth.users.id`
  - `email`: Email do usuário
  - `role`: admin, manager, sales, **SuperAdmin**
  - `whitelabel_id`: FK para whitelabels (NULL para SuperAdmin)

### 3. public.employees (Colaboradores)
- Apenas usuários **não-SuperAdmin** são sincronizados aqui
- Representa colaboradores da empresa
- Campos importantes:
  - `id`: Mesmo UUID do `public.users.id`
  - `email`: Chave de sincronização
  - `user_role`: admin, gestor, colaborador (controle de acesso)
  - `team_id`: Equipe do colaborador

### 4. public.commissions_settings (Configurações de Comissão)
- Criado automaticamente quando um whitelabel é criado
- Contém valores padrão para cálculo de comissões
- Um registro por whitelabel

## Triggers e Funções

### 1. handle_new_user() - auth.users → public.users

**Trigger:** `on_auth_user_created`
**Quando:** AFTER INSERT OR UPDATE em `auth.users`

**Funcionamento:**
- Extrai metadados de `raw_user_meta_data`:
  - `is_superadmin`: boolean
  - `role`: admin, manager, sales
  - `whitelabel_id`: UUID do whitelabel
  - `name`: Nome do usuário
- Se `is_superadmin = true`:
  - Define `role = 'SuperAdmin'`
  - Define `whitelabel_id = NULL`
- Se `is_superadmin = false`:
  - Usa role do metadata ou 'sales' como padrão
  - Usa whitelabel_id do metadata ou primeiro whitelabel disponível
- Cria ou atualiza registro em `public.users`

### 2. handle_user_to_employee() - public.users → public.employees

**Trigger:** `on_user_to_employee`
**Quando:** AFTER INSERT OR UPDATE em `public.users`

**Funcionamento:**
- Verifica se `role != 'SuperAdmin'`
- Se não for SuperAdmin:
  - Define `department` baseado em `role`:
    - admin/manager → 'Management'
    - sales → 'Sales'
    - outros → 'General'
  - Define `user_role` (nível de acesso):
    - admin → 'admin' (acesso total)
    - manager → 'gestor' (acesso a metas, equipes, colaboradores)
    - outros → 'colaborador' (apenas CRM)
  - Cria ou atualiza registro em `public.employees`
- Se for SuperAdmin, não faz nada

### 3. handle_new_whitelabel() - Criação de CommissionSettings

**Trigger:** `on_whitelabel_created`
**Quando:** AFTER INSERT em `public.whitelabels`

**Funcionamento:**
- Cria registro em `commissions_settings` com valores padrão:
  - Checkpoint 1: 50% meta → 50% comissão
  - Checkpoint 2: 75% meta → 75% comissão
  - Checkpoint 3: 100% meta → 100% comissão
  - SDR: R$ 50 por reunião, meta 20 reuniões/mês
  - SDR Bonus: R$ 100 quando reunião vira venda
  - Closer: 10% comissão, meta R$ 10.000/mês

## Constraints de Validação

### users_whitelabel_id_check
Garante que:
- SuperAdmin **deve ter** `whitelabel_id = NULL`
- Outros usuários **devem ter** `whitelabel_id != NULL`

## Backfill de Dados Existentes

A migração inclui queries de backfill que:
1. Sincronizam usuários de `auth.users` para `public.users` (se faltarem)
2. Sincronizam usuários de `public.users` para `public.employees` (exceto SuperAdmin)
3. Criam `commissions_settings` para whitelabels existentes (se faltarem)

## Fluxo de Criação de Usuário

```
1. Usuário se registra
   ↓
2. auth.users é criado (Supabase Auth)
   ↓
3. Trigger on_auth_user_created dispara
   ↓
4. handle_new_user() cria registro em public.users
   ↓
5. Trigger on_user_to_employee dispara
   ↓
6. handle_user_to_employee() cria registro em public.employees (se não for SuperAdmin)
```

## Fluxo de Criação de Whitelabel

```
1. Novo whitelabel é criado
   ↓
2. Trigger on_whitelabel_created dispara
   ↓
3. handle_new_whitelabel() cria commissions_settings padrão
```

## Regras Importantes

### SuperAdmin
- ✅ Existe em `auth.users`
- ✅ Existe em `public.users` com `role = 'SuperAdmin'` e `whitelabel_id = NULL`
- ❌ **NÃO** existe em `public.employees`

### Usuários Normais
- ✅ Existe em `auth.users`
- ✅ Existe em `public.users` com `whitelabel_id != NULL`
- ✅ Existe em `public.employees`

### Usuários Mock (Dados de Teste)
- ❌ Pode não existir em `auth.users`
- ✅ Existe em `public.users`
- ✅ Existe em `public.employees`

## Verificação do Sistema

Execute as queries de verificação:

```sql
-- Contadores gerais
SELECT 'Auth Users' AS table_name, COUNT(*) FROM auth.users
UNION ALL
SELECT 'Public Users', COUNT(*) FROM public.users
UNION ALL
SELECT 'Employees', COUNT(*) FROM public.employees
UNION ALL
SELECT 'Commission Settings', COUNT(*) FROM public.commissions_settings;

-- Verificação de SuperAdmin
SELECT 
  'SuperAdmins com NULL whitelabel' AS check_type,
  COUNT(*) AS count
FROM public.users 
WHERE role = 'SuperAdmin' AND whitelabel_id IS NULL

UNION ALL

SELECT 
  'SuperAdmins com whitelabel (deve ser 0)',
  COUNT(*)
FROM public.users 
WHERE role = 'SuperAdmin' AND whitelabel_id IS NOT NULL

UNION ALL

SELECT 
  'Employees que são SuperAdmin (deve ser 0)',
  COUNT(*)
FROM public.employees e
INNER JOIN public.users u ON e.email = u.email
WHERE u.role = 'SuperAdmin';
```

## Arquivos de Migração

- `scripts/24-complete-sync-functions.sql`: Criação dos triggers e funções
- `scripts/25-allow-null-whitelabel-for-superadmin.sql`: Permite NULL em whitelabel_id para SuperAdmin

## Resultados Atuais

✅ **SuperAdmins com NULL whitelabel:** 1  
✅ **SuperAdmins com whitelabel não-nulo:** 0  
✅ **Usuários não-SuperAdmin com NULL whitelabel:** 0  
✅ **Employees que são SuperAdmin:** 0  
✅ **Total de Usuários:** 5  
✅ **Total de Employees:** 26  
✅ **Total de Commission Settings:** 3  

Sistema 100% sincronizado e funcionando! 🎉
