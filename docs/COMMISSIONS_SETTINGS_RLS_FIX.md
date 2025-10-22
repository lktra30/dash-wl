# Fix: Erro ao Buscar Metas (Commissions Settings RLS)

## Problema

Os usuários estão recebendo erros ao acessar a página principal:

```
Erro ao buscar metas: {}
```

Stack trace:
```
at getGoalTargets (lib\goal-progress-service.ts:39:13)
at async getMeetingsProgress (lib\goal-progress-service.ts:101:19)
at async fetchProgress (components\goals\meetings-goal-progress.tsx:33:22)
```

## Causa Raiz

As políticas de Row Level Security (RLS) na tabela `commissions_settings` estavam muito restritivas. A política original permitia apenas que **admins** lessem os dados:

```sql
CREATE POLICY "Admins can view commission settings"
  ON commissions_settings
  FOR SELECT
  USING (
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

Isso causava falha nas queries quando usuários com roles diferentes (SDR, Closer, Manager, etc.) tentavam acessar as metas para exibir seu progresso.

## Solução

### 1. Atualizar Políticas RLS

Execute o script SQL `scripts/26-fix-commissions-settings-rls.sql`:

```sql
-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Admins can view commission settings" ON commissions_settings;

-- Create new policy: All authenticated users can view commission settings in their whitelabel
CREATE POLICY "Users can view commission settings"
  ON commissions_settings
  FOR SELECT
  USING (
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid()
    )
  );

-- Ensure superadmins can view all commission settings
CREATE POLICY "Superadmins can view all commission settings"
  ON commissions_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );
```

### 2. Melhorias no Tratamento de Erros

O arquivo `lib/goal-progress-service.ts` foi atualizado para fornecer mais informações de debug:

- Logging detalhado dos erros incluindo `message`, `code`, `details` e `hint`
- Verificação adicional se `data` é null mesmo sem erro
- Valores padrão claros quando não há configuração

## Como Aplicar

### Via Supabase Dashboard:

1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Execute o conteúdo do arquivo `scripts/26-fix-commissions-settings-rls.sql`

### Via CLI (se disponível):

```bash
supabase db push --file scripts/26-fix-commissions-settings-rls.sql
```

## Verificação

Após aplicar a correção:

1. Faça logout e login novamente
2. Acesse a página principal do dashboard
3. Verifique que os cards de metas estão carregando sem erros no console
4. Os usuários de todos os roles (SDR, Closer, Manager) devem conseguir ver suas metas

## Política de Segurança

A nova estrutura de políticas:

- **SELECT (Leitura)**: Todos os usuários autenticados podem ler as configurações do seu whitelabel
- **INSERT/UPDATE/DELETE**: Apenas admins podem modificar as configurações
- **Superadmins**: Podem visualizar todas as configurações de todos os whitelabels

## Arquivos Modificados

- `scripts/26-fix-commissions-settings-rls.sql` - Novo script de migração
- `lib/goal-progress-service.ts` - Melhor tratamento de erros e logging

## Notas Adicionais

- As modificações mantêm a segurança permitindo apenas admins editarem as configurações
- Usuários regulares só podem **ler** as metas, não modificá-las
- Valores padrão (20 meetings, 10000 sales) são retornados em caso de erro
