# Correção: SuperAdmin Visualizar Todos os Whitelabels

## Problema
Na página de admin, o SuperAdmin conseguia ver apenas seu próprio whitelabel em vez de todos os whitelabels do sistema.

## Causa Raiz
A Row Level Security (RLS) do Supabase tinha apenas uma política de SELECT para whitelabels:

```sql
"Users can view their own whitelabel"
WHERE id = get_current_user_whitelabel_id()
```

Esta política restringia TODOS os usuários (incluindo SuperAdmin) a verem apenas seu próprio whitelabel.

## Solução Implementada

### 1. Função RLS: `is_current_user_superadmin()`

Criada uma nova função SQL para verificar se o usuário atual é SuperAdmin:

```sql
CREATE OR REPLACE FUNCTION is_current_user_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role = 'SuperAdmin'
  FROM users 
  WHERE id = auth.uid()
  LIMIT 1;
$$;
```

**Características:**
- `SECURITY DEFINER` - Executa com privilégios do criador
- `STABLE` - Otimização de performance (resultado não muda durante a transação)
- Usa `auth.uid()` - UUID do usuário autenticado no JWT do Supabase
- Verifica diretamente na tabela `users` se `role = 'SuperAdmin'`

### 2. Políticas RLS para SuperAdmin

Criadas 4 novas políticas RLS que dão controle total ao SuperAdmin:

#### SELECT - Ver Todos os Whitelabels
```sql
CREATE POLICY "SuperAdmin can view all whitelabels"
ON whitelabels
FOR SELECT
TO public
USING (is_current_user_superadmin());
```

#### UPDATE - Atualizar Qualquer Whitelabel
```sql
CREATE POLICY "SuperAdmin can update any whitelabel"
ON whitelabels
FOR UPDATE
TO public
USING (is_current_user_superadmin())
WITH CHECK (is_current_user_superadmin());
```

#### INSERT - Criar Novos Whitelabels
```sql
CREATE POLICY "SuperAdmin can insert whitelabels"
ON whitelabels
FOR INSERT
TO public
WITH CHECK (is_current_user_superadmin());
```

#### DELETE - Deletar Whitelabels
```sql
CREATE POLICY "SuperAdmin can delete whitelabels"
ON whitelabels
FOR DELETE
TO public
USING (is_current_user_superadmin());
```

## Políticas RLS Atuais

### SELECT (Ver)
1. ✅ **SuperAdmin can view all whitelabels** - SuperAdmin vê TODOS
2. ✅ **Users can view their own whitelabel** - Usuários normais veem apenas o seu

### UPDATE (Atualizar)
1. ✅ **SuperAdmin can update any whitelabel** - SuperAdmin atualiza QUALQUER um
2. ✅ **Admins can update their whitelabel** - Admins atualizam apenas o seu

### INSERT (Criar)
1. ✅ **SuperAdmin can insert whitelabels** - Apenas SuperAdmin pode criar

### DELETE (Deletar)
1. ✅ **SuperAdmin can delete whitelabels** - Apenas SuperAdmin pode deletar

## Como Funciona

As políticas RLS no Supabase usam lógica **OR** (permissiva) por padrão. Isso significa:

- **SuperAdmin**: Satisfaz a política "SuperAdmin can view all whitelabels" → Vê TODOS os whitelabels
- **Usuário Normal**: Satisfaz apenas "Users can view their own whitelabel" → Vê apenas o seu próprio

## Migração Aplicada

**Nome:** `add_superadmin_rls_functions_and_policies`

A migração:
1. Cria a função `is_current_user_superadmin()`
2. Adiciona 4 políticas RLS para operações CRUD do SuperAdmin
3. Mantém as políticas existentes para usuários normais

## Resultado

Agora o SuperAdmin pode:
- ✅ Ver todos os 3 whitelabels existentes no sistema
- ✅ Criar novos whitelabels
- ✅ Editar qualquer whitelabel
- ✅ Deletar whitelabels

Usuários normais continuam com acesso restrito:
- ✅ Ver apenas seu próprio whitelabel
- ✅ Admins podem editar apenas seu próprio whitelabel

## Segurança

- ✅ Verificação baseada em `auth.uid()` - UUID do JWT do Supabase
- ✅ Políticas RLS aplicadas no nível do banco de dados
- ✅ Não depende de verificações apenas no código da aplicação
- ✅ `SECURITY DEFINER` permite execução mesmo com RLS ativo
- ✅ Função `STABLE` para otimização de performance

## Testes Recomendados

1. ✅ Login como SuperAdmin (arthuurfcarvalho@gmail.com)
2. ✅ Acessar `/admin`
3. ✅ Verificar se todos os 3 whitelabels são exibidos
4. ✅ Testar edição de whitelabels diferentes do seu
5. ✅ Testar criação de novo whitelabel
6. ✅ Login como usuário normal e verificar que só vê seu whitelabel
