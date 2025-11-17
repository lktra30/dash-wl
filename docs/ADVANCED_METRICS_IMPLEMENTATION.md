# Métricas Avançadas - Implementação

## Visão Geral

Sistema de métricas avançadas com suporte completo para dois modelos de negócio:
- **TCV (Total Contract Value)**: Vendas únicas/one-time
- **MRR (Monthly Recurring Revenue)**: Receita recorrente/assinaturas

## Arquitetura

### Separação de Responsabilidades

#### 🗄️ Banco de Dados (SQL Functions)
**Quando usar:** Métricas baseadas em volume/contagem que não dependem do modelo de negócio

**Funções criadas:**
1. `get_funnel_conversion_rates()` - Taxa de conversão entre etapas do pipeline
2. `get_channel_breakdown()` - Distribuição de leads por canal
3. `get_customer_evolution()` - Evolução mensal de novos clientes

**Vantagens:**
- Performance otimizada (executa no banco)
- Reusabilidade (pode ser chamada de múltiplos lugares)
- Independente de lógica de negócio

#### ⚙️ Backend (API Routes)
**Quando usar:** Métricas que dependem do modelo de negócio (TCV vs MRR)

**Endpoints criados:**
- `/api/dashboard/advanced-metrics?metric=growth-rate` - Taxa de crescimento
- `/api/dashboard/advanced-metrics?metric=temporal-evolution` - Evolução MRR/TCV
- `/api/dashboard/advanced-metrics?metric=ltv-cac` - Lifetime Value vs CAC

**Vantagens:**
- Flexibilidade para lógica complexa
- Fácil adaptação para novos modelos de negócio
- Cache e otimizações customizadas

## Métricas Implementadas

### 1. Taxa de Conversão do Funil
**Tipo:** Independente de modelo de negócio  
**Fonte:** Database function `get_funnel_conversion_rates()`

**Calcula:**
- Conversão entre cada etapa do pipeline
- % de contatos que avançam para próxima etapa
- Visualização por cores: Verde (≥70%), Amarelo (≥40%), Vermelho (<40%)

**Parâmetros:**
- `pipelineId` (opcional): Filtrar por pipeline específico
- `fromDate` / `toDate` (opcional): Período de análise

### 2. Distribuição por Canal
**Tipo:** Independente de modelo de negócio  
**Fonte:** Database function `get_channel_breakdown()`

**Calcula:**
- Quantidade de leads por fonte (`lead_source`)
- Taxa de conversão por canal
- % de participação de cada canal

**Visualização:**
- Gráfico de pizza com cores diferenciadas
- Tabela detalhada com estatísticas

### 3. Evolução de Clientes
**Tipo:** Independente de modelo de negócio  
**Fonte:** Database function `get_customer_evolution()`

**Calcula:**
- Novos clientes por mês
- Total acumulado ao longo do tempo
- Média mensal de novos clientes

**Parâmetros:**
- `months` (padrão: 12): Quantos meses analisar

### 4. Taxa de Crescimento
**Tipo:** Dependente de modelo de negócio  
**Fonte:** Backend API com cálculos TCV/MRR

**TCV Mode:**
- Soma receita total por mês
- Calcula crescimento mensal baseado em total de vendas

**MRR Mode:**
- Rastreia receita recorrente mensal
- Crescimento baseado em adições/churns de MRR

**Visualização:**
- Barras: Receita mensal
- Linha: % de crescimento mês a mês
- Badge com média de crescimento

### 5. Evolução Temporal
**Tipo:** Dependente de modelo de negócio  
**Fonte:** Backend API com queries diferentes

**TCV Mode:**
```typescript
// Soma deal_value de contacts com sale_date
SELECT month, SUM(deal_value) as tcv
FROM contacts
GROUP BY month
```

**MRR Mode:**
```typescript
// Calcula MRR ativo considerando duration
// Deals ativos = (sale_date + duration) > current_month
SELECT month, SUM(monthly_value) as mrr
FROM deals
WHERE status = 'won' AND still_active
GROUP BY month
```

### 6. LTV vs CAC
**Tipo:** Dependente de modelo de negócio  
**Fonte:** Backend API com fórmulas diferentes

**TCV Mode:**
```
LTV = Receita Total / Número de Clientes
CAC = Gasto com Ads / Número de Clientes
```

**MRR Mode:**
```
LTV = Valor Mensal Médio × Lifetime Médio (em meses)
CAC = Gasto com Ads / Número de Clientes
```

**Análise Automática:**
- ✅ Excelente: Ratio ≥ 3:1
- ⚠️ Aceitável: Ratio entre 1:1 e 3:1
- 🚨 Crítico: Ratio < 1:1

## Estrutura de Arquivos

```
app/api/dashboard/advanced-metrics/
  └── route.ts                          # API única com switch para todas métricas

components/metrics/
  ├── funnel-conversion-chart.tsx       # Conversão do funil
  ├── channel-breakdown-chart.tsx       # Distribuição por canal
  ├── customer-evolution-chart.tsx      # Evolução de clientes
  ├── growth-rate-chart.tsx             # Taxa de crescimento
  ├── temporal-evolution-chart.tsx      # MRR/TCV ao longo do tempo
  └── ltv-cac-comparison.tsx            # LTV vs CAC

app/dashboard/Metricas/
  └── page.tsx                          # Página com tabs organizadas

scripts/
  └── 40-create-advanced-metrics-functions.sql  # Migration com SQL functions
```

## Como Usar

### No Frontend

```tsx
import { FunnelConversionChart } from '@/components/metrics/funnel-conversion-chart';
import { LtvCacComparison } from '@/components/metrics/ltv-cac-comparison';

// Componente independente de modelo
<FunnelConversionChart 
  pipelineId="uuid" 
  fromDate="2024-01-01" 
  toDate="2024-12-31" 
/>

// Componente que adapta automaticamente ao modelo do whitelabel
<LtvCacComparison />
```

### Diretamente na API

```typescript
// Métrica independente (banco de dados)
const response = await fetch('/api/dashboard/advanced-metrics?metric=funnel-conversion&pipelineId=xxx');

// Métrica dependente (backend detecta businessModel automaticamente)
const response = await fetch('/api/dashboard/advanced-metrics?metric=ltv-cac');
```

## Extensibilidade

### Adicionar Nova Métrica Independente

1. Criar função SQL em nova migration:
```sql
CREATE OR REPLACE FUNCTION get_minha_metrica(p_whitelabel_id UUID)
RETURNS TABLE (...) AS $$
BEGIN
  -- Sua query aqui
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. Adicionar case na API:
```typescript
case 'minha-metrica':
  return await getMinhaMetrica(supabase, whitelabelId);
```

3. Criar componente React

### Adicionar Nova Métrica Dependente

1. Criar função na API com lógica TCV/MRR:
```typescript
async function getMinhaMetricaDependente(
  supabase: any,
  whitelabelId: string,
  businessModel: 'TCV' | 'MRR'
) {
  if (businessModel === 'MRR') {
    // Lógica MRR
  } else {
    // Lógica TCV
  }
}
```

2. Adicionar ao switch principal
3. Criar componente React

## Boas Práticas

### ✅ Fazer

- Usar `SECURITY DEFINER` em funções SQL que acessam múltiplas tabelas com RLS
- Sempre filtrar por `whitelabel_id` nas queries
- Retornar dados estruturados (arrays de objetos) da API
- Incluir `businessModel` no retorno de métricas dependentes
- Adicionar tooltips informativos nos gráficos

### ❌ Não Fazer

- Hardcoded business model no banco de dados
- Misturar lógica de TCV e MRR na mesma query SQL
- Retornar valores null sem tratamento no frontend
- Fazer cálculos de receita em SQL functions (usar backend)

## Performance

### Database Functions
- Executam com `SECURITY DEFINER` (bypass RLS)
- Otimizadas com indexes em: `whitelabel_id`, `sale_date`, `stage_id`, `lead_source`
- Cache via RLS policies

### API Routes
- `dynamic = 'force-dynamic'` para dados sempre atualizados
- Queries otimizadas com `.select()` específico
- Possibilidade de adicionar Redis cache no futuro

## Testes

### Teste Manual via Browser
1. Acessar `/dashboard/Metricas`
2. Navegar pelas tabs: Evolução, Funil & Canais, Crescimento, LTV
3. Verificar se gráficos carregam corretamente

### Teste de Business Model
1. Alterar `whitelabels.business_model` para "MRR"
2. Verificar que métricas de crescimento e LTV mudam fórmulas
3. Retornar para "TCV" e confirmar cálculos corretos

### Teste de SQL Functions via Supabase
```sql
-- Teste funnel conversion
SELECT * FROM get_funnel_conversion_rates('whitelabel-uuid-here', NULL, NULL, NULL);

-- Teste channel breakdown
SELECT * FROM get_channel_breakdown('whitelabel-uuid-here', NULL, NULL);

-- Teste customer evolution
SELECT * FROM get_customer_evolution('whitelabel-uuid-here', 12);
```

## Troubleshooting

### Erro: "Unauthorized"
**Causa:** Usuário não autenticado ou sem whitelabel  
**Solução:** Verificar sessão do Supabase e tabela `employees`

### Erro: "Invalid metric"
**Causa:** Parâmetro `metric` não reconhecido  
**Solução:** Usar um dos valores: `funnel-conversion`, `channel-breakdown`, `customer-evolution`, `growth-rate`, `temporal-evolution`, `ltv-cac`

### Dados vazios retornados
**Causa:** Whitelabel sem dados históricos ou RLS bloqueando  
**Solução:** 
1. Verificar se há `contacts` com `sale_date` preenchido
2. Testar SQL functions diretamente no Supabase SQL Editor
3. Confirmar que RLS policies permitem acesso aos dados

### Gráficos não carregam
**Causa:** Componente recharts não renderizando  
**Solução:**
1. Verificar console do browser para erros
2. Confirmar que `data` não está null/undefined
3. Adicionar fallback para arrays vazios

## Roadmap Futuro

- [ ] Adicionar cache Redis para métricas pesadas
- [ ] Implementar métricas de churn rate (específico MRR)
- [ ] Criar comparação entre pipelines diferentes
- [ ] Exportar métricas para CSV/PDF
- [ ] Adicionar filtros avançados (por time, por usuário)
- [ ] Dashboard de previsões (forecasting) com ML
- [ ] Alertas automáticos para quedas de performance
