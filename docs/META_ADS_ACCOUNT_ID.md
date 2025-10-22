# Meta Ads Account ID - Implementação

## Resumo

Foi adicionado um campo para **Meta Ads Account ID** na página de Configurações, que permite armazenar o Account ID do Meta/Facebook Ads para cada whitelabel.

## Alterações Implementadas

### 1. Migração de Banco de Dados

**Arquivo:** `scripts/24-add-meta-ads-account-id.sql`

- Adiciona coluna `meta_ads_account_id` (TEXT) na tabela `whitelabels`
- Cria índice para melhor performance
- Adiciona comentário explicativo

**Executar:**
```sql
-- No Supabase SQL Editor, execute:
ALTER TABLE whitelabels 
ADD COLUMN IF NOT EXISTS meta_ads_account_id TEXT;

CREATE INDEX IF NOT EXISTS idx_whitelabels_meta_ads_account_id ON whitelabels(meta_ads_account_id);
```

### 2. Backend

#### `lib/types.ts`
- ✅ Adicionado `metaAdsAccountId?: string` à interface `Whitelabel`

#### `app/api/settings/whitelabel/route.ts`
- ✅ Aceita `metaAdsAccountId` no body do PUT
- ✅ Salva `meta_ads_account_id` no banco de dados
- ✅ Retorna `metaAdsAccountId` na resposta

#### `app/api/auth/me/route.ts`
- ✅ Retorna `metaAdsAccountId` nos dados do whitelabel

#### `hooks/use-auth.tsx`
- ✅ Normaliza `meta_ads_account_id` para `metaAdsAccountId`

### 3. Frontend

#### `components/settings/api-keys-card.tsx`
- ✅ Adicionado campo de input para Meta Ads Account ID
- ✅ Novo campo aparece ANTES do Access Token
- ✅ Props: `metaAdsAccountId`, `onMetaAdsAccountIdChange`
- ✅ Placeholder: "act_1234567890"
- ✅ Descrição explicativa em português

#### `app/dashboard/Configuracoes/page.tsx`
- ✅ Estado `metaAdsAccountId` adicionado
- ✅ Inicializa com valor do whitelabel
- ✅ Envia no body do PUT para API
- ✅ Passa props para `ApiKeysCard`

## Interface do Usuário

### Card de Chaves de API

```
┌─────────────────────────────────────────────┐
│ 🔑 Chaves de API                            │
│ Configure suas chaves de API para a         │
│ plataforma de anúncios                      │
├─────────────────────────────────────────────┤
│ 🔒 Segurança: Todas as chaves de API são   │
│ criptografadas antes do armazenamento.      │
│                                             │
│ Meta Ads Account ID                         │
│ ┌───────────────────────────────────────┐  │
│ │ act_1234567890                        │  │
│ └───────────────────────────────────────┘  │
│ O Account ID do Meta Ads (formato:         │
│ act_1234567890). Este ID é usado para      │
│ buscar dados de campanhas.                 │
│                                             │
│ Meta Ads Access Token      [✓ Configured]  │
│ ┌───────────────────────────────────┐ 👁️  │
│ │ ●●●●●●●●●●●●●●●●                  │     │
│ └───────────────────────────────────┘      │
│ [Update] [Remove]                          │
│                                             │
│ ⚠️ Importante: As chaves são salvas        │
│ imediatamente quando você clica em         │
│ Salvar/Atualizar.                          │
└─────────────────────────────────────────────┘
```

## Fluxo de Dados

1. **Carregamento:**
   - API `/api/auth/me` retorna `whitelabel.metaAdsAccountId`
   - Hook `useAuth` normaliza para `metaAdsAccountId`
   - Página de Configurações inicializa estado

2. **Edição:**
   - Usuário digita Account ID no campo
   - Estado local atualizado com `setMetaAdsAccountId`

3. **Salvamento:**
   - Clique em "Salvar Alterações"
   - PUT para `/api/settings/whitelabel` com `metaAdsAccountId`
   - API salva em `whitelabels.meta_ads_account_id`
   - Página recarrega para mostrar dados atualizados

## Formato do Account ID

- **Formato padrão:** `act_1234567890`
- **Tipo:** String (TEXT no banco)
- **Obrigatório:** Não (campo opcional)
- **Validação:** Nenhuma no frontend (aceita qualquer texto)

## Próximos Passos

### Para Implementar Integração com Meta Ads:

1. **Validação do Account ID:**
   ```typescript
   // Adicionar validação no frontend
   const isValidAccountId = (id: string) => {
     return /^act_\d+$/.test(id)
   }
   ```

2. **Usar na API de Meta Ads:**
   ```typescript
   // Exemplo de uso
   const accountId = whitelabel.metaAdsAccountId
   const response = await fetch(
     `https://graph.facebook.com/v18.0/${accountId}/insights`,
     {
       headers: {
         'Authorization': `Bearer ${metaAdsAccessToken}`
       }
     }
   )
   ```

3. **Configurar endpoint de teste:**
   - Criar rota `/api/ads/meta/test` para validar Account ID e Token
   - Retornar status de conexão e dados básicos da conta

## Segurança

- ✅ Account ID não é sensível (é público no Meta Ads)
- ✅ Armazenado em texto plano (não precisa criptografia)
- ✅ Access Token continua criptografado
- ✅ Retornado para frontend sem problemas de segurança

## Testando

1. Execute a migração SQL
2. Acesse Configurações > Chaves de API
3. Digite um Account ID (exemplo: `act_1234567890`)
4. Clique em "Salvar Alterações"
5. Recarregue a página
6. Verifique se o Account ID foi salvo e aparece no campo

## Observações

- Campo aparece **antes** do Access Token para melhor organização
- Salva junto com todas as outras configurações (não tem botão separado)
- Persiste através do reload da página
- Pode ser limpo deixando o campo vazio
