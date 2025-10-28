/**
 * Script de Teste - Facebook Lead Ads Webhook
 *
 * Usage:
 *   node scripts/test-facebook-webhook.js <PAGE_ID> [URL]
 *
 * Examples:
 *   node scripts/test-facebook-webhook.js 123456789012345
 *   node scripts/test-facebook-webhook.js 123456789012345 https://seu-dominio.com
 *   node scripts/test-facebook-webhook.js 123456789012345 http://localhost:3000
 */

const pageId = process.argv[2];
const baseUrl = process.argv[3] || 'http://localhost:3000';

if (!pageId) {
  console.error('❌ Erro: Page ID é obrigatório!');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/test-facebook-webhook.js <PAGE_ID> [URL]');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/test-facebook-webhook.js 123456789012345');
  process.exit(1);
}

const testLeadId = `TEST_LEAD_${Date.now()}`;
const webhookUrl = `${baseUrl}/api/webhooks/facebook`;

const payload = {
  object: 'page',
  entry: [
    {
      id: pageId,
      time: Math.floor(Date.now() / 1000),
      changes: [
        {
          field: 'leadgen',
          value: {
            leadgen_id: testLeadId,
            page_id: pageId,
            form_id: '123456789',
            ad_id: '987654321',
            created_time: Math.floor(Date.now() / 1000),
          },
        },
      ],
    },
  ],
};

console.log('🧪 Testando Facebook Lead Ads Webhook');
console.log('=====================================');
console.log('');
console.log('📍 URL:', webhookUrl);
console.log('📄 Page ID:', pageId);
console.log('🆔 Test Lead ID:', testLeadId);
console.log('');
console.log('📤 Enviando payload...');
console.log('');

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
})
  .then(async (response) => {
    console.log('📥 Resposta recebida:');
    console.log('   Status:', response.status, response.statusText);
    console.log('');

    if (response.ok) {
      console.log('✅ Webhook processado com sucesso!');
      console.log('');
      console.log('🔍 Próximos passos:');
      console.log('   1. Verifique os logs do servidor');
      console.log('   2. Execute no Supabase:');
      console.log('');
      console.log(`      SELECT * FROM facebook_leads WHERE facebook_lead_id = '${testLeadId}';`);
      console.log('');
      console.log('   3. Se o Access Token estiver correto, verifique os contacts:');
      console.log('');
      console.log(`      SELECT * FROM contacts WHERE lead_source = 'inbound' ORDER BY created_at DESC LIMIT 5;`);
      console.log('');
    } else {
      console.log('❌ Erro ao processar webhook');
      const text = await response.text();
      console.log('   Resposta:', text);
    }
  })
  .catch((error) => {
    console.error('❌ Erro ao enviar requisição:');
    console.error('  ', error.message);
    console.log('');
    console.log('💡 Dicas:');
    console.log('   - Certifique-se que o servidor está rodando');
    console.log('   - Verifique se a URL está correta:', webhookUrl);
    console.log('   - Para localhost, use: http://localhost:3000');
    console.log('   - Para produção, use: https://seu-dominio.com');
  });
