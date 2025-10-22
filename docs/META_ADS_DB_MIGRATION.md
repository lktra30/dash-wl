# Migração: Meta Ads Credentials do .env para Banco de Dados

## Resumo

O sistema foi reconfigurado para buscar as credenciais do Meta Ads (Access Token e Account ID) **diretamente do banco de dados** (tabela `whitelabels`) ao invés de usar variáveis de ambiente (`.env`).

## Motivação

✅ **Antes (Problema):**
- Credenciais no `.env` eram compartilhadas por todos os whitelabels
- Impossível ter configurações diferentes por cliente
- Difícil de gerenciar múltiplas contas

✅ **Depois (Solução):**
- Cada whitelabel tem suas próprias credenciais
- Credenciais são armazenadas de forma segura (criptografadas)
- Gerenciamento via interface de Configurações
- Suporte multi-tenant real

## Alterações Implementadas

### 1. Nova Helper Function

**Arquivo:** `lib/supabase/meta-ads-credentials.ts` **(NOVO)**

Funções criadas:
- `getMetaAdsCredentials(supabase)` - Busca e descriptografa credenciais
- `isMetaAdsConfigured(supabase)` - Verifica se Meta Ads está configurado

```typescript
// Uso
const credentials = await getMetaAdsCredentials(supabase)
if (credentials) {
  const { accessToken, accountId } = credentials
  // Usar nas chamadas da API do Meta
}
```

**Fluxo:**
1. Busca `whitelabel_id` do usuário autenticado
2. Busca `meta_ads_key_encrypted` e `meta_ads_account_id` da tabela whitelabels
3. Descriptografa o Access Token usando `decrypt()` do `lib/crypto.ts`
4. Retorna `{ accessToken, accountId }` ou `null` se não configurado

### 2. Atualização da API de Meta Ads

**Arquivo:** `app/api/dashboard/ads/route.ts`

**Antes:**
```typescript
// ❌ Lia do .env (fixo para todos)
const accessToken = process.env.META_API_ACCESS_TOKEN
const adAccountId = process.env.META_AD_ACCOUNT_ID
```

**Depois:**
```typescript
// ✅ Busca do banco de dados (por whitelabel)
const credentials = await getMetaAdsCredentials(supabase)

if (!credentials) {
  return NextResponse.json({
    error: "Meta Ads não configurado",
    message: "Configure o Access Token e Account ID nas Configurações"
  }, { status: 400 })
}

const { accessToken, accountId } = credentials
```

**Mensagem de erro em português** para melhor UX.

## Estrutura de Dados

### Tabela: `whitelabels`

```sql
-- Colunas relacionadas ao Meta Ads
meta_ads_key_encrypted   TEXT  -- Access Token criptografado (AES-256-GCM)
meta_ads_account_id      TEXT  -- Account ID (formato: act_1234567890)
```

### Criptografia

- **Algoritmo:** AES-256-GCM
- **Formato armazenado:** `iv:authTag:ciphertext` (hex)
- **Chave:** `ENCRYPTION_KEY` do `.env` (32 bytes hex)
- **Funções:** `encrypt()` e `decrypt()` do `lib/crypto.ts`

## Fluxo Completo

### 1. Configuração (Admin)

```
Admin → Configurações → API Keys
  ↓
Preenche Meta Ads Access Token e Account ID
  ↓
Clica em "Salvar Alterações"
  ↓
POST /api/settings/whitelabel
  ↓
Token é criptografado com encrypt()
  ↓
Salvo em whitelabels.meta_ads_key_encrypted
  ↓
Account ID salvo em whitelabels.meta_ads_account_id
```

### 2. Uso na API (Busca de Dados)

```
GET /api/dashboard/ads
  ↓
Autentica usuário
  ↓
getMetaAdsCredentials(supabase)
  ↓
Busca whitelabel do usuário
  ↓
Descriptografa meta_ads_key_encrypted
  ↓
Retorna { accessToken, accountId }
  ↓
Usa credenciais na chamada Meta Graph API
  ↓
Retorna dados de anúncios
```

## Segurança

✅ **Access Token:**
- Armazenado criptografado (AES-256-GCM)
- Nunca exposto no frontend
- Descriptografado apenas no servidor quando necessário

✅ **Account ID:**
- Armazenado em texto plano (não é sensível)
- Retornado para frontend para exibição

✅ **ENCRYPTION_KEY:**
- Continua no `.env`
- Nunca exposta ou enviada ao cliente
- Usada apenas no servidor

## Variáveis de Ambiente

### ❌ Removidas (não são mais usadas)

```env
# Estas variáveis NÃO são mais necessárias:
# META_API_ACCESS_TOKEN=xxx
# META_AD_ACCOUNT_ID=act_xxx
```

### ✅ Ainda Necessária

```env
# Necessária para criptografia/descriptografia
ENCRYPTION_KEY=your-64-character-hex-key
```

Gerar com:
```bash
openssl rand -hex 32
```

## Migração de Dados Existentes

Se você já tinha credenciais no `.env`, precisa:

1. Acessar **Configurações** no dashboard
2. Colar o **Access Token** no campo "Meta Ads Access Token"
3. Colar o **Account ID** no campo "Meta Ads Account ID"
4. Clicar em **"Salvar Alterações"**
5. Remover as variáveis do `.env` (opcional, mas recomendado)

## Tratamento de Erros

### Credenciais não configuradas

```json
{
  "error": "Meta Ads não configurado",
  "message": "Configure o Access Token e Account ID nas Configurações"
}
```

**HTTP Status:** `400 Bad Request`

### Falha na descriptografia

```json
{
  "error": "Failed to decrypt Meta Ads access token"
}
```

**HTTP Status:** `500 Internal Server Error`

### Usuário não autenticado

```json
{
  "error": "User not authenticated"
}
```

**HTTP Status:** `401 Unauthorized`

## Benefícios

✅ **Multi-tenant Real**
- Cada whitelabel pode ter sua própria conta Meta Ads
- Configurações isoladas por cliente

✅ **Segurança Aprimorada**
- Tokens criptografados no banco
- Sem credenciais hardcoded no código

✅ **Gerenciamento Facilitado**
- Atualizar credenciais via interface web
- Sem necessidade de acessar servidor ou .env

✅ **Escalabilidade**
- Adicionar novos whitelabels sem mexer em configuração
- Suporta múltiplas contas Meta Ads

## Testando

### 1. Configurar Credenciais

```bash
# 1. Acesse o dashboard
http://localhost:3000/dashboard/Configuracoes

# 2. Na seção "Chaves de API"
#    - Meta Ads Account ID: act_1234567890
#    - Meta Ads Access Token: EAAG... (seu token)

# 3. Clique em "Salvar Alterações"
```

### 2. Verificar no Banco

```sql
-- Verificar se foi salvo
SELECT 
  name,
  meta_ads_account_id,
  meta_ads_key_encrypted IS NOT NULL as has_token
FROM whitelabels;
```

### 3. Testar API

```bash
# Fazer requisição para buscar dados de anúncios
curl http://localhost:3000/api/dashboard/ads \
  -H "Cookie: your-session-cookie"

# Deve retornar dados ou erro configurado
```

## Retrocompatibilidade

⚠️ **BREAKING CHANGE:** Este é um breaking change.

Se você tinha credenciais no `.env`:
- Elas NÃO funcionarão mais automaticamente
- Você DEVE configurar via interface de Configurações
- O sistema retornará erro 400 até configurar

## Arquivos Modificados

1. `lib/supabase/meta-ads-credentials.ts` **(NOVO)**
2. `app/api/dashboard/ads/route.ts` **(MODIFICADO)**

## Próximos Passos (Opcional)

### 1. Adicionar Validação de Token

Criar endpoint para testar conexão:

```typescript
// app/api/ads/meta/test/route.ts
export async function GET(request: NextRequest) {
  const credentials = await getMetaAdsCredentials(supabase)
  
  // Tentar buscar dados da conta para validar
  const response = await fetch(
    `https://graph.facebook.com/v23.0/${credentials.accountId}?access_token=${credentials.accessToken}`
  )
  
  return NextResponse.json({
    valid: response.ok,
    accountName: data.name
  })
}
```

### 2. UI de Status

Mostrar na página de Configurações se a conexão está funcionando:

```tsx
// Adicionar botão "Testar Conexão"
<Button onClick={testMetaAdsConnection}>
  Testar Conexão Meta Ads
</Button>
```

### 3. Logs de Auditoria

Registrar quando credenciais são atualizadas:

```sql
CREATE TABLE credential_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  whitelabel_id UUID NOT NULL,
  service TEXT NOT NULL, -- 'meta_ads', 'google_ads'
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted'
  user_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Suporte

Se encontrar problemas:

1. ✅ Verifique se `ENCRYPTION_KEY` está configurada
2. ✅ Verifique se credenciais foram salvas (campo não vazio no banco)
3. ✅ Verifique logs do servidor para erros de descriptografia
4. ✅ Tente reconfigurar via interface de Configurações
