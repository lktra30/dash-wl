# Calendário de Reuniões - Visualização

Esta página exibe todas as reuniões agendadas e realizadas em um calendário interativo.

## Componentes Criados

### 1. Página: `app/dashboard/calendario/page.tsx`
- Página principal do calendário
- Busca todas as reuniões através do `dataService.getMeetings()`
- Passa os dados para o componente `CalendarView`

### 2. Componente: `components/calendario/calendar-view.tsx`
- Exibe o calendário com FullCalendar
- Mostra reuniões com cores diferentes por status:
  - 🔵 Azul: Agendada (scheduled)
  - 🟢 Verde: Realizada (completed)
  - 🔴 Vermelho: Cancelada (cancelled)
  - 🟠 Laranja: Não compareceu (no_show)
- Ao clicar em uma reunião, abre um dialog com detalhes:
  - Título
  - Status
  - Data/hora agendada
  - Data/hora de conclusão (se aplicável)
  - Se foi convertida em venda
  - Observações

## Funcionalidades

### Visualizações Disponíveis
- **Mês**: Visão mensal completa
- **Semana**: Visão semanal detalhada
- **Dia**: Visão diária por hora

### Navegação
- Botões para navegar entre períodos (anterior/próximo)
- Botão "Hoje" para voltar à data atual
- Clique em eventos para ver detalhes

## Características Técnicas

### Dependências Utilizadas
- **@fullcalendar/react**: Componente React do FullCalendar
- **@fullcalendar/daygrid**: Plugin para visualização de dias/mês
- **@fullcalendar/timegrid**: Plugin para visualização de semana/dia
- **@fullcalendar/interaction**: Plugin para interações (cliques)
- **date-fns**: Formatação de datas em português
- **Shadcn UI**: Componentes de UI (Card, Dialog, Badge)

### Integração com o Sistema
- Usa o `SecureDataService` para buscar reuniões da API
- Respeita autenticação e whitelabel do usuário
- Carregamento com estado de loading
- Tratamento de erros

### Estrutura de Dados
```typescript
interface Meeting {
  id: string
  whitelabelId: string
  sdrId: string
  contactId?: string
  dealId?: string
  title: string
  scheduledAt: string
  completedAt?: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  convertedToSale: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}
```

## Estilização

O calendário usa:
- Tema adaptável (dark/light mode)
- Cores consistentes com o design system
- CSS-in-JS para personalização do FullCalendar
- Responsivo e acessível

## Navegação

A página foi adicionada à sidebar principal:
- Ícone: Calendar (📅)
- Posição: Entre "CRM" e "Metas e Comissões"
- URL: `/dashboard/calendario`

## Modo Visualização Apenas

Esta implementação é **somente visualização** - não permite:
- ❌ Criar reuniões
- ❌ Editar reuniões
- ❌ Deletar reuniões
- ✅ Apenas visualizar reuniões existentes

As reuniões são criadas automaticamente pelo sistema quando vendas são fechadas (ver `scripts/34-auto-create-meetings-from-deals.sql`).

## Próximos Passos (Opcional)

Se quiser adicionar funcionalidades no futuro:
1. Adicionar filtros por status, SDR, etc.
2. Exportar calendário para ICS
3. Integração com calendários externos (Google Calendar, Outlook)
4. Notificações de reuniões próximas
