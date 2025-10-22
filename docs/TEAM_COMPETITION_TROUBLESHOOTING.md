# Team Competition - Guia de Teste

## Problema Identificado e Corrigido

### Problema
O toggle de competição de equipes não mantinha o estado após recarregar a página. Ele sempre voltava para "desativado".

### Causa Raiz
O endpoint `/api/auth/me` não estava retornando o campo `team_competition` do banco de dados, então o hook `use-auth` não conseguia carregar o valor correto.

### Correções Aplicadas

1. **API `/api/auth/me`** (app/api/auth/me/route.ts)
   - ✅ Adicionado `teamCompetition: whitelabel.team_competition || false` ao objeto `safeWhitelabelData`

2. **Hook `use-auth`** (hooks/use-auth.tsx)
   - ✅ Adicionada função `refreshWhitelabel()` ao contexto
   - ✅ Atualizado tipo `AuthContextType` para incluir `refreshWhitelabel`
   - ✅ O campo já estava sendo normalizado corretamente

3. **Página de Times** (app/dashboard/Times/page.tsx)
   - ✅ Agora usa `refreshWhitelabel()` após atualizar a configuração
   - ✅ Garante que o contexto é atualizado imediatamente

## Como Testar

### Teste 1: Verificar Persistência
1. Acesse a página de **Times** (Dashboard > Times)
2. Se houver 2+ equipes, você verá o card "Competição de Equipes"
3. Ative o toggle
4. Aguarde a mensagem de sucesso
5. **Recarregue a página** (F5)
6. ✅ O toggle deve permanecer ativado

### Teste 2: Verificar na Página Principal
1. Com a competição ativada, volte para a página principal (Dashboard)
2. ✅ Deve aparecer a seção "Competição de Equipes" com o ranking
3. Volte para Times e desative o toggle
4. Retorne à página principal
5. ✅ A seção de competição deve desaparecer

### Teste 3: Verificar Banco de Dados
Execute no Supabase:
```sql
SELECT id, name, team_competition FROM whitelabels;
```
✅ O campo `team_competition` deve refletir o estado atual (true/false)

### Teste 4: Verificar API
Teste o endpoint diretamente:
```bash
# Login primeiro, depois:
curl http://localhost:3000/api/auth/me
```
✅ A resposta deve incluir `"teamCompetition": true` ou `false`

## Verificação de Estado

### Estado Inicial
- Banco: `team_competition = false` (padrão)
- Interface: Toggle desativado
- Dashboard: Seção de competição oculta

### Após Ativar
- Banco: `team_competition = true`
- Interface: Toggle ativado (persiste após reload)
- Dashboard: Seção de competição visível

### Sincronização
- ✅ Mudanças são salvas imediatamente no banco
- ✅ Contexto de auth é atualizado via `refreshWhitelabel()`
- ✅ Interface reflete o estado corretamente após reload
- ✅ Todas as páginas veem o mesmo valor do contexto

## Troubleshooting

### Se o problema persistir:

1. **Limpe o cache do navegador**
   - Ctrl + Shift + Delete
   - Limpe cookies e cache

2. **Verifique o Console**
   - Abra DevTools (F12)
   - Procure por erros em vermelho
   - Verifique as respostas das APIs na aba Network

3. **Verifique o Banco**
   ```sql
   SELECT * FROM whitelabels WHERE id = 'seu-whitelabel-id';
   ```
   
4. **Force Logout/Login**
   - Faça logout completo
   - Limpe cookies
   - Faça login novamente

## Fluxo de Dados Corrigido

```
Usuário ativa toggle
    ↓
PATCH /api/settings/team-competition
    ↓
Atualiza banco: team_competition = true
    ↓
refreshWhitelabel() chamado
    ↓
GET /api/auth/me (com team_competition)
    ↓
Contexto atualizado
    ↓
UI reflete novo estado em todas as páginas
```
