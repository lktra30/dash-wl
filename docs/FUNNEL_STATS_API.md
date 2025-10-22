# Lógica de Processamento do Funil - API Backend (CUMULATIVO)

## 📊 Nova Rota: `/api/dashboard/funnel-stats`

### Fluxo de Dados

```
Cliente (Frontend)
    ↓
GET /api/dashboard/funnel-stats
    ↓
Backend processa os dados (CUMULATIVO)
    ↓
Retorna estatísticas calculadas
```

## 🔢 Lógica de Contabilização CUMULATIVA

A API usa um **funil cumulativo**, onde cada etapa inclui todos os leads que passaram por ela e avançaram além.

### 1. **Total de Leads** (`novoLead`)
```typescript
novoLead = contacts.length
// Contabiliza TODOS os contatos, independente do status
// Todos que entraram no funil
```

### 2. **Em Contato** (`emContato`) - CUMULATIVO
```typescript
emContato = contacts.filter(c => 
  c.funnel_stage === 'contacted' ||
  c.funnel_stage === 'meeting' ||
  c.funnel_stage === 'negotiation' ||
  c.funnel_stage === 'won' ||
  c.funnel_stage === 'lost'
).length

// Inclui TODOS que passaram pela etapa de contato:
// - Contacted (parados nesta etapa)
// - Meeting (avançaram para reunião)
// - Negotiation (avançaram para negociação)
// - Won (fecharam ganho)
// - Lost (fecharam perdido)
```

### 3. **Reunião** (`reuniao`) - CUMULATIVO
```typescript
reuniao = contacts.filter(c => 
  c.funnel_stage === 'meeting' ||
  c.funnel_stage === 'negotiation' ||
  c.funnel_stage === 'won' ||
  c.funnel_stage === 'lost'
).length

// Inclui TODOS que chegaram à etapa de reunião:
// - Meeting (parados em reunião)
// - Negotiation (avançaram para negociação)
// - Won (fecharam ganho após reunião)
// - Lost (perderam após reunião)
```

### 4. **Fechado/Ganho** (`fechado`)
```typescript
fechado = contacts.filter(c => c.funnel_stage === 'won').length
// Contabiliza apenas contatos com status 'won'
// Etapa final positiva do funil
```

### 5. **Perdido** (`perdido`)
```typescript
perdido = contacts.filter(c => c.funnel_stage === 'lost').length
// Contabiliza apenas contatos com status 'lost'
// Etapa final negativa do funil
```

## 📝 Exemplo de Resposta (CUMULATIVO)

Se tivermos 10 contatos no banco com os seguintes status:
- 3 com status `new_lead`
- 2 com status `contacted`
- 2 com status `meeting`
- 1 com status `negotiation`
- 1 com status `won`
- 1 com status `lost`

A API retorna:
```json
{
  "novoLead": 10,    // Total: 3+2+2+1+1+1 = 10
  "emContato": 7,    // contacted(2) + meeting(2) + negotiation(1) + won(1) + lost(1) = 7
  "reuniao": 5,      // meeting(2) + negotiation(1) + won(1) + lost(1) = 5
  "fechado": 1,      // Apenas won(1)
  "perdido": 1       // Apenas lost(1)
}
```

## 🎯 Interpretação das Taxas de Conversão

Com esta lógica cumulativa, as taxas de conversão mostram:

### Taxa de Contato
```
emContato / novoLead = 7 / 10 = 70%
// 70% dos leads chegaram à etapa de contato
```

### Taxa de Reunião
```
reuniao / emContato = 5 / 7 = 71.4%
// 71.4% dos leads contatados chegaram à reunião
```

### Taxa de Ganho (Win Rate)
```
fechado / reuniao = 1 / 5 = 20%
// 20% das reuniões resultaram em ganho
```

### Conversão Total
```
fechado / novoLead = 1 / 10 = 10%
// 10% dos leads totais se converteram em negócios ganhos
```

## 🎯 Vantagens desta Abordagem Cumulativa

1. **Realista**: Reflete o fluxo real do funil - um lead que ganhou passou por todas as etapas
2. **Taxas Corretas**: Permite calcular taxas de conversão precisas entre etapas
3. **Visualização Clara**: O funil visual mostra o afunilamento natural do processo
4. **Análise de Gargalo**: Identifica onde os leads estão caindo no processo

## 🔄 Integração com Frontend

O componente `FunnelCard` já está configurado para usar esta API através do `dataService.getFunnelStats()`:

```typescript
const stats = await dataService.getFunnelStats()
// Retorna dados cumulativos processados no backend
```

## 🚀 Próximos Passos (Opcional)

Podemos adicionar filtros opcionais:
- Filtro por período (dateRange)
- Filtro por equipe
- Filtro por responsável
- Filtro por valor de negócio

Exemplo:
```
GET /api/dashboard/funnel-stats?from=2025-01-01&to=2025-12-31&teamId=123
```
