# Fix: Acesso Negado à Página de Configurações

## Problema

Usuários com role "SuperAdmin" não conseguiam acessar a página `/configuracoes`, recebendo a mensagem:

```
Admin Access Required
Only administrators can modify whitelabel settings and brand customization.
```

## Causa Raiz

A página de configurações (`app/dashboard/Configuracoes/page.tsx`) estava verificando apenas se o role era exatamente `"admin"` (minúsculo):

```tsx
const isAdmin = user.role === "admin"
```

### Problemas Identificados

1. **Case Sensitivity**: A verificação era case-sensitive, mas no banco de dados existem roles com diferentes cases:
   - `"SuperAdmin"` (com maiúsculas)
   - `"admin"` (minúsculo)

2. **Não Incluía SuperAdmin**: SuperAdmins têm permissões administrativas mas não eram reconhecidos pela verificação

3. **Dados do Banco**:
   ```sql
   -- Exemplo de usuários no banco:
   arthuurfcarvalho@gmail.com → role: "SuperAdmin"
   admin@techstart.com → role: "admin"
   ```

## Solução

### 1. Criada Função de Permissão Centralizada

Adicionada função `isAdmin()` em `lib/permissions.ts`:

```typescript
// Check if user is an admin (includes both admin and superadmin roles)
export function isAdmin(user: User): boolean {
  const role = user.role?.toLowerCase()
  return role === "admin" || role === "superadmin"
}
```

**Benefícios**:
- Case-insensitive (aceita "Admin", "ADMIN", "admin", etc.)
- Reconhece tanto "admin" quanto "superadmin"
- Centraliza a lógica de verificação de permissões

### 2. Atualizada Página de Configurações

Modificada `app/dashboard/Configuracoes/page.tsx`:

**Antes**:
```tsx
const isAdmin = user.role === "admin"

{isAdmin ? (
  // Conteúdo da página
) : (
  <AdminAccessRequired />
)}
```

**Depois**:
```tsx
import { isAdmin } from "@/lib/permissions"

const hasAdminAccess = isAdmin(user)

{hasAdminAccess ? (
  // Conteúdo da página
) : (
  <AdminAccessRequired />
)}
```

## Verificação no Banco de Dados

Query executada via MCP Supabase:
```sql
SELECT id, email, name, role, whitelabel_id 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
```

**Resultados**:
- ✅ SuperAdmin pode acessar configurações
- ✅ admin pode acessar configurações
- ❌ sales não pode acessar configurações

## Testes

1. **SuperAdmin**: Deve conseguir acessar `/configuracoes`
2. **Admin**: Deve conseguir acessar `/configuracoes`
3. **Sales/SDR/Closer**: Deve ver "Admin Access Required"

## Arquivos Modificados

1. `lib/permissions.ts` - Adicionada função `isAdmin()`
2. `app/dashboard/Configuracoes/page.tsx` - Usa função de permissão centralizada

## Benefícios da Solução

- ✅ **Consistência**: Lógica de permissão centralizada
- ✅ **Flexibilidade**: Case-insensitive, aceita variações
- ✅ **Manutenibilidade**: Fácil adicionar novos roles administrativos
- ✅ **Segurança**: Mantém controle de acesso adequado

## Próximos Passos Recomendados

### Opcional: Normalizar Roles no Banco

Para evitar inconsistências, considere executar:

```sql
-- Normalizar todos os roles para lowercase
UPDATE users 
SET role = LOWER(role) 
WHERE role IS NOT NULL;
```

Ou criar uma constraint/trigger para sempre armazenar em lowercase.

### Recomendação: Usar a Função Centralizada

Sempre que precisar verificar se um usuário é admin, use:

```tsx
import { isAdmin } from "@/lib/permissions"

if (isAdmin(user)) {
  // Lógica administrativa
}
```

Em vez de comparações diretas como `user.role === "admin"`.
