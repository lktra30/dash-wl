# Sistema de Comissões

Biblioteca consolidada para cálculo de comissões de vendas para SDRs e Closers.

## 📁 Estrutura

```
lib/commissions/
  └── index.ts       # Biblioteca principal com todos os cálculos
```

## 🎯 Fórmulas de Cálculo

### Comissão SDR (Sales Development Representative)
SDRs recebem comissão por **reuniões realizadas**:

```
Reunião Realizada (lost/open): R$ 50
Reunião Convertida (won): R$ 100

Taxa Fixa = Soma das comissões por reunião
Bônus Checkpoint = Taxa Fixa × Multiplicador do Checkpoint
Bônus Quantidade = Bônus por Deal × Quantidade de Deals
Comissão Final = Taxa Fixa + Bônus Checkpoint + Bônus Quantidade
```

**Exemplo SDR:**
- 2 deals won: 2 × R$ 100 = R$ 200
- 1 deal lost: 1 × R$ 50 = R$ 50
- Taxa Fixa: R$ 250
- Atingimento: 15% (3 reuniões de meta de 20)
- Checkpoint: 0 (abaixo de 50%)
- Bônus Checkpoint: R$ 0 (250 × 0)
- Bônus Quantidade: R$ 300 (R$ 100 × 3 deals)
- **Comissão Final: R$ 550** (250 + 0 + 300)

### Comissão Closer
Closers recebem comissão por **vendas fechadas**:

```
Taxa Fixa = Valor Total de Vendas × Percentual de Comissão
Bônus Checkpoint = Taxa Fixa × Multiplicador do Checkpoint
Bônus Quantidade = Bônus por Venda × Quantidade de Vendas
Comissão Final = Taxa Fixa + Bônus Checkpoint + Bônus Quantidade
```

**Exemplo Closer:**
- Vendas: R$ 50.000
- Percentual: 10%
- Taxa Fixa: R$ 5.000
- Atingimento: 100% (Checkpoint 3, multiplicador 100%)
- Bônus Checkpoint: R$ 5.000 (5.000 × 1.0)
- Bônus Quantidade: R$ 200 (R$ 100 × 2 vendas)
- **Comissão Final: R$ 10.200** (5.000 + 5.000 + 200)

### Checkpoints
O sistema usa 3 níveis de checkpoint baseados no atingimento de meta:

- **Checkpoint 1**: >= 50% da meta → Multiplicador: 50%
- **Checkpoint 2**: >= 75% da meta → Multiplicador: 75%
- **Checkpoint 3**: >= 100% da meta → Multiplicador: 100%
- **Abaixo**: < 50% da meta → Multiplicador: 0%

## 📊 Tipos Principais

### `EmployeeCommissionResult`
Resultado detalhado do cálculo de comissão para um funcionário individual.

```typescript
interface EmployeeCommissionResult {
  employeeId: string
  totalSales: number
  salesCount: number
  baseCommission: number
  bonus: number
  checkpointTier: number
  checkpointMultiplier: number
  finalCommission: number
  targetAchievementPercent: number
}
```

### `RoleCommissionSummary`
Agregação de comissões por role (SDR ou Closer).

```typescript
interface RoleCommissionSummary {
  role: 'sdr' | 'closer'
  totalCommissions: number
  employeeCount: number
  totalSales: number
  salesCount: number
  employees: EmployeeCommissionResult[]
}
```

### `TotalCommissionsCard`
Dados consolidados para exibição no Card de Total de Comissões.

```typescript
interface TotalCommissionsCard {
  totalCommissions: number
  sdrCommissions: number
  closerCommissions: number
  sdrCount: number
  closerCount: number
  totalSales: number
  totalDeals: number
}
```

## 🔧 Funções Principais

### `calculateTotalCommissionsCard(deals, settings)`
Função principal que calcula o total de comissões para exibição no Card 1.

**Parâmetros:**
- `deals`: Array de deals (apenas deals com `status = 'won'` são processados)
- `settings`: Configurações de comissão da whitelabel

**Retorna:** `TotalCommissionsCard`

**Exemplo:**
```typescript
import { calculateTotalCommissionsCard } from '@/lib/commissions'

const cardData = calculateTotalCommissionsCard(deals, settings)
console.log(cardData.totalCommissions) // Total de comissões
```

### `calculateSDRCommissionsFromDeals(deals, settings)`
Calcula comissões apenas para SDRs.

**Retorna:** `RoleCommissionSummary`

### `calculateCloserCommissionsFromDeals(deals, settings)`
Calcula comissões apenas para Closers.

**Retorna:** `RoleCommissionSummary`

### `determineCheckpointTier(achievementPercent, settings)`
Determina qual checkpoint tier foi alcançado.

**Retorna:** `{ tier: number, multiplier: number }`

## 🎨 Funções de Formatação

### `formatCurrency(value)`
Formata valor para Real brasileiro (BRL).
```typescript
formatCurrency(1500.50) // "R$ 1.500,50"
```

### `formatPercent(value, decimals?)`
Formata percentual.
```typescript
formatPercent(85.5) // "85.5%"
formatPercent(85.567, 2) // "85.57%"
```

### `getCheckpointLabel(tier)`
Retorna o label do checkpoint.
```typescript
getCheckpointLabel(3) // "Checkpoint 3"
```

### `getCheckpointColor(tier)`
Retorna a classe de cor do checkpoint para UI.
```typescript
getCheckpointColor(3) // "text-green-500"
```

## 🔍 Debug

A biblioteca inclui logs detalhados no console para debug:

```
[Commission] Calculando para SDR abc123: { dealsCount: 2, deals: [...] }
[Commission] Totais - Vendas: 50000, Quantidade: 2
[Commission] Meta: 100000, Atingimento: 50%
[Commission] Checkpoint - Tier: 1, Multiplicador: 0.5
[Commission] Taxa Fixa (Comissão Base): 5000 (10% de 50000)
[Commission] Bônus Checkpoint: 2500 (5000 × 0.5)
[Commission] Bônus por Quantidade: 200 (100 × 2)
[Commission] Comissão Final: 7700 = 5000 + 2500 + 200
```

## 📝 Como Usar

### Em Componentes React

```typescript
import { calculateTotalCommissionsCard, formatCurrency } from '@/lib/commissions'

function CommissionsCard({ deals, settings }) {
  const cardData = calculateTotalCommissionsCard(deals, settings)
  
  return (
    <div>
      <h2>Total de Comissões</h2>
      <p>{formatCurrency(cardData.totalCommissions)}</p>
      <p>{cardData.totalDeals} deals fechados</p>
    </div>
  )
}
```

### Em Páginas Next.js

```typescript
import { calculateTotalCommissionsCard } from '@/lib/commissions'

export default function ComissoesPage() {
  const [deals, setDeals] = useState([])
  const [settings, setSettings] = useState(null)
  
  const overview = useMemo(() => {
    if (!settings) return null
    return calculateTotalCommissionsCard(deals, settings)
  }, [deals, settings])
  
  return <CommissionOverviewCard overview={overview} />
}
```

## ⚙️ Configurações Necessárias

As seguintes configurações devem estar presentes em `CommissionSettings`:

```typescript
{
  // Thresholds dos checkpoints (%)
  checkpoint1Percent: 50,
  checkpoint2Percent: 75,
  checkpoint3Percent: 100,
  
  // Multiplicadores dos checkpoints (%)
  checkpoint1CommissionPercent: 50,
  checkpoint2CommissionPercent: 75,
  checkpoint3CommissionPercent: 100,
  
  // Configurações de comissão
  closerCommissionPercent: 10,      // % sobre valor da venda
  closerSalesTarget: 100000,        // Meta mensal em R$
  sdrBonusClosedMeeting: 100,       // Bônus por venda
}
```

## 🐛 Troubleshooting

### Comissões aparecem como R$ 0,00

Verifique:
1. ✅ Os deals têm `status = 'won'`
2. ✅ Os deals têm `sdrId` ou `closerId` preenchidos
3. ✅ As configurações de comissão estão carregadas
4. ✅ Os valores dos deals (`value`) são maiores que 0
5. ✅ Verifique os logs no console para identificar onde o cálculo está falhando

### Multiplicador está 0

Isso acontece quando o atingimento de meta está abaixo de 50% (Checkpoint 1). Neste caso:
- Taxa Fixa é recebida normalmente
- Bônus Checkpoint é R$ 0,00 (Taxa Fixa × 0)
- Bônus por Quantidade é recebido normalmente
- **A pessoa ainda recebe: Taxa Fixa + Bônus Quantidade**
