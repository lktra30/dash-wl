# 🧪 Guia de Testes - Facebook Lead Ads Webhook

## Método 1: Teste Local com cURL (Recomendado para início)

### Passo 1: Verificar configuração no banco
```sql
-- Verificar se o whitelabel tem as credenciais configuradas
SELECT
  id,
  name,
  facebook_page_id,
  facebook_access_token_encrypted IS NOT NULL as has_token,
  facebook_webhook_verify_token
FROM whitelabels
WHERE facebook_page_id IS NOT NULL;
```

### Passo 2: Testar webhook com payload simulado

**IMPORTANTE**: Substitua os valores:
- `YOUR_PAGE_ID`: O Page ID configurado no whitelabel
- `YOUR_LEADGEN_ID`: Um ID único para o teste (ex: `TEST_LEAD_001`)

```bash
# Windows PowerShell
$body = @'
{
  "object": "page",
  "entry": [
    {
      "id": "YOUR_PAGE_ID",
      "time": 1234567890,
      "changes": [
        {
          "field": "leadgen",
          "value": {
            "leadgen_id": "TEST_LEAD_001",
            "page_id": "YOUR_PAGE_ID",
            "form_id": "123456789",
            "ad_id": "987654321",
            "created_time": 1234567890
          }
        }
      ]
    }
  ]
}
'@

Invoke-WebRequest -Uri "http://localhost:3000/api/webhooks/facebook" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

```bash
# Linux/Mac (curl)
curl -X POST http://localhost:3000/api/webhooks/facebook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [
      {
        "id": "YOUR_PAGE_ID",
        "time": 1234567890,
        "changes": [
          {
            "field": "leadgen",
            "value": {
              "leadgen_id": "TEST_LEAD_001",
              "page_id": "YOUR_PAGE_ID",
              "form_id": "123456789",
              "ad_id": "987654321",
              "created_time": 1234567890
            }
          }
        ]
      }
    ]
  }'
```

### Passo 3: Verificar logs no terminal
Você deve ver logs como:
```
Facebook webhook received: { object: 'page', entry: [...] }
Processing entry for page: YOUR_PAGE_ID
Found whitelabel: abc-123-def-456
Processing leadgen change: { leadgen_id: 'TEST_LEAD_001', ... }
Fetching full lead data from Facebook: TEST_LEAD_001
```

### Passo 4: Verificar no banco de dados
```sql
-- Ver se o lead foi registrado (mesmo que tenha erro na API do Facebook)
SELECT * FROM facebook_leads
WHERE facebook_lead_id = 'TEST_LEAD_001';

-- Ver se o contact foi criado (só se o Access Token estiver correto)
SELECT * FROM contacts
WHERE lead_source = 'inbound'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Método 2: Teste com Facebook Graph API (Mais realista)

### Passo 1: Criar um lead de teste via Graph API Explorer

1. Acesse: https://developers.facebook.com/tools/explorer/
2. Selecione seu App
3. Gere um Access Token com permissão `leads_retrieval`
4. Execute (substitua PAGE_ID e FORM_ID):

```
POST /PAGE_ID/leadgen_forms/FORM_ID/leads
```

Com body:
```json
{
  "field_data": [
    {
      "name": "full_name",
      "values": ["João Teste"]
    },
    {
      "name": "email",
      "values": ["joao.teste@example.com"]
    },
    {
      "name": "phone",
      "values": ["11999999999"]
    }
  ]
}
```

### Passo 2: Webhook será acionado automaticamente
Verifique os logs do servidor e o banco de dados.

---

## Método 3: Teste Real com Formulário

### Passo 1: Criar um anúncio de teste
1. Acesse o Facebook Ads Manager
2. Crie uma campanha "Lead Generation"
3. Configure o formulário com campos básicos
4. Use orçamento mínimo ($1/dia)
5. Segmente apenas você mesmo (sua cidade + interesses específicos)

### Passo 2: Preencher o formulário
1. Encontre seu anúncio no feed
2. Clique e preencha o formulário
3. Aguarde 30-60 segundos

### Passo 3: Verificar resultado
```sql
-- Verificar leads recebidos nas últimas 24h
SELECT
  fl.facebook_lead_id,
  fl.form_data,
  fl.processed,
  fl.error_message,
  c.name,
  c.email,
  c.phone,
  fl.created_at
FROM facebook_leads fl
LEFT JOIN contacts c ON fl.contact_id = c.id
WHERE fl.created_at > NOW() - INTERVAL '24 hours'
ORDER BY fl.created_at DESC;
```

---

## 🐛 Troubleshooting

### Problema: "No whitelabel found for page"
```sql
-- Verificar se o Page ID está correto
SELECT id, name, facebook_page_id
FROM whitelabels
WHERE facebook_page_id = 'SEU_PAGE_ID';
```
**Solução**: Confirme que o Page ID no banco é exatamente o mesmo que o Facebook envia.

### Problema: "Facebook API error: 400"
**Causa**: Access Token inválido ou sem permissão
**Solução**:
1. Gere um novo Page Access Token
2. Certifique-se que tem permissão `leads_retrieval`
3. Use token de página (page access token), não user access token
4. Atualize no dashboard

### Problema: Lead registrado mas contact não criado
```sql
-- Ver o erro
SELECT facebook_lead_id, error_message, form_data
FROM facebook_leads
WHERE processed = false;
```
**Causas comuns**:
- Token expirado
- Lead ID inválido
- Campos obrigatórios faltando

### Problema: Webhook não recebe nada
1. Verifique se o servidor está rodando
2. Confirme que o webhook está subscrito no Facebook:
   - Facebook App Dashboard → Webhooks → leadgen
3. Use ngrok se estiver em localhost:
```bash
ngrok http 3000
# Use a URL do ngrok no Facebook: https://abc123.ngrok.io/api/webhooks/facebook
```

---

## ✅ Checklist de Validação

- [ ] Migration 35, 36, 37 executadas no Supabase
- [ ] `ENCRYPTION_KEY` configurado no `.env`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado no `.env`
- [ ] Servidor rodando (`npm run dev`)
- [ ] Whitelabel tem `facebook_page_id` configurado
- [ ] Whitelabel tem `facebook_access_token_encrypted` configurado
- [ ] Webhook subscrito no Facebook App Dashboard
- [ ] Callback URL correto (produção ou ngrok)
- [ ] Tabela `facebook_leads` existe
- [ ] Coluna `lead_source` existe em `contacts`

---

## 📊 Query Útil: Dashboard de Leads

```sql
-- Ver estatísticas dos últimos 7 dias
SELECT
  w.name as whitelabel,
  COUNT(*) as total_leads,
  SUM(CASE WHEN fl.processed THEN 1 ELSE 0 END) as processed,
  SUM(CASE WHEN NOT fl.processed THEN 1 ELSE 0 END) as failed,
  COUNT(DISTINCT DATE(fl.created_at)) as days_with_leads
FROM facebook_leads fl
JOIN whitelabels w ON fl.whitelabel_id = w.id
WHERE fl.created_at > NOW() - INTERVAL '7 days'
GROUP BY w.id, w.name
ORDER BY total_leads DESC;
```
