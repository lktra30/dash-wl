# Correção: Redirecionamento após Logout

## Problema
Quando o usuário clicava no botão de logout, a sessão era encerrada e o estado local era limpo, mas o usuário permanecia na mesma página em vez de ser redirecionado para a página de login.

## Solução Implementada

### Arquivo Modificado: `hooks/use-auth.tsx`

#### 1. Importação do useRouter
```typescript
import { useRouter } from "next/navigation"
```

#### 2. Inicialização do router no AuthProvider
```typescript
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  // ... resto do código
}
```

#### 3. Adicionado redirecionamento no logout
```typescript
const logout = useCallback(async () => {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })

    if (!response.ok) {
      const message = await parseError(response, "Failed to logout")
      throw new Error(message)
    }
  } catch (error) {
    console.error("[v0] Logout error:", error)
  } finally {
    setAuthState({ user: null, whitelabel: null, isLoading: false })
    // Redirecionar para a página de login após logout
    router.push("/")
  }
}, [router])
```

## Fluxo de Logout Atualizado

1. Usuário clica em "Sair" (botão de logout)
2. Requisição POST enviada para `/api/auth/logout`
3. Supabase encerra a sessão do usuário
4. Estado local é limpo (`user: null`, `whitelabel: null`)
5. **Novo:** Usuário é redirecionado para `/` (página de login)

## Resultado

Agora, após fazer logout, o usuário é automaticamente redirecionado para a página de login (`/`), proporcionando uma melhor experiência de usuário e evitando que o usuário fique em páginas que requerem autenticação.

## Arquivos Afetados

- ✅ `hooks/use-auth.tsx` - Adicionado redirecionamento após logout
