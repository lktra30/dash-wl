# Competição de Equipes - Documentação

## Visão Geral
O recurso de Competição de Equipes permite que whitelabels com 2 ou mais equipes ativem um ranking competitivo na página principal do dashboard, incentivando a competição saudável entre times de vendas.

## Requisitos
- Whitelabel deve ter **2 ou mais equipes** cadastradas
- Recurso deve ser ativado manualmente na página de Equipes
- Apenas usuários com perfil **admin** podem ativar/desativar

## Como Funciona

### 1. Ativação do Recurso
1. Navegue até **Dashboard > Times**
2. Se houver 2+ equipes, um card "Competição de Equipes" aparecerá no topo
3. Use o toggle para ativar/desativar a competição
4. A configuração é salva automaticamente no banco de dados

### 2. Visualização na Página Principal
Quando ativado, um componente de competição aparece na página principal mostrando:

#### Top 3 (Pódio)
- **1º Lugar (Ouro)**: Equipe com maior receita
- **2º Lugar (Prata)**: Segunda melhor equipe
- **3º Lugar (Bronze)**: Terceira melhor equipe

Cada card do pódio exibe:
- 🏆 Posição e título
- 💰 Receita total
- 🎯 Deals ganhos / Total de deals
- 📈 Taxa de conversão
- 👥 Número de membros

#### Demais Equipes
- Lista compacta com ranking
- Métricas resumidas
- Borda colorida com a cor da equipe

### 3. Métricas Calculadas

O ranking é baseado em:
- **Receita Total**: Soma do valor de todos os deals ganhos (status = 'won')
- **Deals Ganhos**: Número de deals fechados com sucesso
- **Taxa de Conversão**: (Deals Ganhos / Total de Deals) × 100
- **Membros**: Número de colaboradores ativos na equipe

**Critério de Ordenação**: Receita Total (decrescente)

### 4. Como os Deals são Atribuídos às Equipes
Um deal é contabilizado para uma equipe se:
- O SDR (sdr_id) OU o Closer (closer_id) pertence à equipe
- Ou seja, se qualquer colaborador envolvido no deal for membro da equipe

## Estrutura Técnica

### Banco de Dados

#### Tabela: `whitelabels`
```sql
ALTER TABLE whitelabels 
ADD COLUMN team_competition BOOLEAN DEFAULT FALSE;
```

### APIs

#### GET /api/teams/rankings
Retorna o ranking de todas as equipes do whitelabel

**Response:**
```json
{
  "success": true,
  "rankings": [
    {
      "id": "uuid",
      "name": "Equipe Alpha",
      "color": "#3b82f6",
      "rank": 1,
      "totalRevenue": 150000,
      "wonDeals": 15,
      "totalDeals": 20,
      "conversionRate": 75.0,
      "memberCount": 5
    }
  ],
  "totalTeams": 4
}
```

#### PATCH /api/settings/team-competition
Atualiza o status da competição de equipes

**Request:**
```json
{
  "team_competition": true
}
```

**Response:**
```json
{
  "success": true,
  "team_competition": true
}
```

### Componentes

#### `TeamCompetition` (components/mainPage/team-competition.tsx)
Componente principal que exibe a competição na página principal

**Props:**
- `whitelabelId: string` - ID do whitelabel

**Features:**
- Auto-refresh dos dados
- Design responsivo
- Animações e gradientes para o pódio
- Skeleton loading state

#### Página de Times (app/dashboard/Times/page.tsx)
- Card de configuração (apenas para admins)
- Toggle para ativar/desativar
- Aparece apenas se houver 2+ equipes

## Design

### Cores do Pódio
- **1º Lugar**: Gradiente Dourado (`from-yellow-400 to-yellow-600`)
- **2º Lugar**: Gradiente Prata (`from-gray-300 to-gray-500`)
- **3º Lugar**: Gradiente Bronze (`from-orange-400 to-orange-600`)

### Ícones
- 🏆 Trophy (lucide-react) para competição
- 💰 DollarSign para receita
- 🎯 Target para deals
- 📈 TrendingUp para conversão
- 👥 Users para membros

## Regras de Negócio

1. **Visibilidade**:
   - Componente só aparece na página principal se `whitelabel.teamCompetition === true`
   - Toggle de configuração só aparece na página de Times se houver 2+ equipes
   - Apenas admins podem ativar/desativar

2. **Cálculos**:
   - Apenas deals com status 'won' são contabilizados para receita
   - Taxa de conversão considera todos os deals (won, lost, open)
   - Ranking é sempre ordenado por receita total

3. **Atualização**:
   - Dados são carregados ao montar o componente
   - Não há auto-refresh em tempo real (usuário precisa recarregar a página)

## Casos de Uso

### Cenário 1: Whitelabel com 1 equipe
- Toggle de competição **não aparece** na página de Times
- Componente de competição **não pode ser ativado**

### Cenário 2: Whitelabel com 2+ equipes, recurso desativado
- Toggle aparece na página de Times
- Componente **não aparece** na página principal
- Admin pode ativar quando desejar

### Cenário 3: Whitelabel com 2+ equipes, recurso ativado
- Toggle aparece ativo na página de Times
- Componente aparece na página principal
- Rankings são calculados e exibidos em tempo real

## Melhorias Futuras
- [ ] Auto-refresh em tempo real usando WebSockets
- [ ] Histórico de rankings (salvar snapshots diários/semanais)
- [ ] Filtro por período de tempo
- [ ] Notificações quando uma equipe muda de posição
- [ ] Gamificação com conquistas e badges
- [ ] Gráfico de evolução temporal dos rankings
- [ ] Exportar rankings para PDF/Excel
