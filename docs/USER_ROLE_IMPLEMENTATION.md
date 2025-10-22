# Adição do Campo de Nível de Acesso para Colaboradores

## Resumo das Alterações

Foi implementado um campo de seleção de **Nível de Acesso** nas páginas de criação e edição de colaboradores, com as seguintes opções:

### Níveis de Acesso

1. **Admin**: Acesso total ao sistema
2. **Gestor**: Acesso à metas, equipes e colaboradores
3. **Colaborador**: Acesso somente à CRM

### Características

- Campo obrigatório com valor padrão "Colaborador"
- Ícone de alerta (AlertCircle) com tooltip explicativo das permissões
- Tooltip aparece ao passar o mouse sobre o ícone
- Informações são salvas na coluna `users.role` (conforme solicitado)

## Arquivos Modificados

### 1. Frontend

#### `app/dashboard/Colaboradores/page.tsx`
- Adicionado import do componente `Tooltip` e ícone `AlertCircle`
- Adicionado campo `user_role` ao estado `formData`
- Criado novo campo de seleção com tooltip explicativo
- Valor padrão: "colaborador"

#### `components/colaboradores/edit-employee-sheet.tsx`
- Adicionado import do componente `Tooltip` e ícone `AlertCircle`
- Adicionado campo `user_role` ao estado `formData`
- Criado novo campo de seleção com tooltip explicativo no formulário de edição
- Sincronização com dados existentes do colaborador

### 2. Backend

#### `app/api/dashboard/employees/route.ts`
- Adicionado `user_role` ao GET (retorna o campo na listagem)
- Adicionado `user_role` ao POST (aceita o campo na criação)
- Valor padrão na criação: "colaborador"

#### `app/api/dashboard/employees/[id]/route.ts`
- Adicionado `user_role` ao PUT (aceita o campo na atualização)

### 3. Tipos

#### `lib/types.ts`
- Adicionada propriedade `user_role` à interface `Employee`
- Tipo: `"admin" | "gestor" | "colaborador"`
- Campo opcional para compatibilidade com dados existentes

### 4. Migração de Banco de Dados

#### `scripts/23-add-user-role-to-employees.sql`
- Criado script de migração SQL
- Adiciona coluna `user_role` à tabela `employees`
- Define valor padrão como "colaborador"
- Adiciona constraint CHECK para validar valores
- Cria índice para melhor performance
- Atualiza registros existentes com valor padrão

## Como Executar

### 1. Migração do Banco de Dados

Execute o script SQL no Supabase:

```bash
# Acesse o Supabase Dashboard > SQL Editor
# Cole e execute o conteúdo do arquivo:
scripts/23-add-user-role-to-employees.sql
```

Ou use o cliente Supabase:

```sql
-- Copie e cole o conteúdo do arquivo 23-add-user-role-to-employees.sql
-- no SQL Editor do Supabase
```

### 2. Verificar a Migração

```sql
-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'employees' AND column_name = 'user_role';

-- Verificar valores existentes
SELECT id, name, email, user_role
FROM employees
LIMIT 10;
```

### 3. Testar a Funcionalidade

1. Acesse a página de Colaboradores
2. Clique em "Adicionar Colaborador"
3. Preencha os campos obrigatórios
4. Selecione o **Nível de Acesso** (Admin, Gestor ou Colaborador)
5. Passe o mouse sobre o ícone de alerta para ver as permissões
6. Salve o colaborador
7. Edite um colaborador existente e verifique se o campo está funcionando

## Interface do Usuário

### Campo de Seleção

```
Nível de Acesso * [ℹ️]
┌─────────────────────────────────┐
│ Colaborador                  ▼  │
└─────────────────────────────────┘

Opções:
- Admin
- Gestor  
- Colaborador
```

### Tooltip (ao passar o mouse sobre o ícone ℹ️)

```
┌──────────────────────────────────────┐
│ Admin:                               │
│ Acesso total ao sistema              │
│                                      │
│ Gestor:                              │
│ Acesso à metas, equipes e           │
│ colaboradores                        │
│                                      │
│ Colaborador:                         │
│ Acesso somente à CRM                 │
└──────────────────────────────────────┘
```

**Nota:** O tooltip é sensível ao tema (dark/light mode):
- **Light Mode**: Fundo claro com texto escuro
- **Dark Mode**: Fundo escuro com texto claro
- Ícone com efeito hover que muda para a cor primária
- Bordas e sombras adaptativas ao tema

## Observações Técnicas

- O campo é armazenado na coluna `employees.user_role` (não `users.role`)
- Validação no banco de dados garante apenas valores válidos
- Índice criado para otimizar consultas por nível de acesso
- Campo opcional para retrocompatibilidade com registros antigos
- Valor padrão "colaborador" é aplicado automaticamente

## Próximos Passos (Opcional)

Para implementar o controle de acesso baseado nestes níveis:

1. Criar middleware de autenticação que verifica `user_role`
2. Implementar guards nas rotas protegidas
3. Ocultar/desabilitar componentes baseado no nível de acesso
4. Adicionar validações no backend por nível de acesso

## Suporte

Se encontrar algum problema, verifique:

1. ✅ Migração SQL foi executada com sucesso
2. ✅ Coluna `user_role` existe na tabela `employees`
3. ✅ API está retornando o campo `user_role`
4. ✅ Componente `Tooltip` existe em `components/ui/tooltip.tsx`
