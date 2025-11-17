"use client"

import { useState, useMemo } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { EventInput } from "@fullcalendar/core"
import type { Meeting } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, Clock, User, CheckCircle2, XCircle, AlertCircle, Circle } from "lucide-react"

interface CalendarViewProps {
  meetings: Meeting[]
}

// Status color mapping
const statusConfig = {
  scheduled: {
    color: "#3b82f6", // blue
    bg: "bg-blue-50 dark:bg-blue-950",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-400",
    icon: Clock,
    label: "Agendada"
  },
  completed: {
    color: "#22c55e", // green
    bg: "bg-green-50 dark:bg-green-950",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-400",
    icon: CheckCircle2,
    label: "Realizada"
  },
  cancelled: {
    color: "#ef4444", // red
    bg: "bg-red-50 dark:bg-red-950",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-400",
    icon: XCircle,
    label: "Cancelada"
  },
  no_show: {
    color: "#f59e0b", // amber
    bg: "bg-amber-50 dark:bg-amber-950",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-400",
    icon: AlertCircle,
    label: "Não compareceu"
  }
}

export function CalendarView({ meetings }: CalendarViewProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Convert meetings to FullCalendar events
  const events: EventInput[] = useMemo(() => {
    return meetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      start: meeting.scheduledAt,
      end: meeting.completedAt || meeting.scheduledAt,
      backgroundColor: statusConfig[meeting.status].color,
      borderColor: statusConfig[meeting.status].color,
      extendedProps: {
        meeting
      }
    }))
  }, [meetings])

  const handleEventClick = (clickInfo: any) => {
    const meeting = clickInfo.event.extendedProps.meeting as Meeting
    setSelectedMeeting(meeting)
    setIsDialogOpen(true)
  }

  const StatusIcon = selectedMeeting ? statusConfig[selectedMeeting.status].icon : Circle

  return (
    <>
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendário de Reuniões
          </CardTitle>
          <CardDescription>
            Clique em uma reunião para ver mais detalhes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="calendar-container">
            <style jsx global>{`
              .calendar-container .fc {
                font-family: inherit;
              }
              .calendar-container .fc .fc-toolbar-title {
                font-size: 1.5rem;
                font-weight: 600;
                color: hsl(var(--foreground));
              }
              .calendar-container .fc .fc-button {
                background-color: hsl(var(--primary));
                border-color: hsl(var(--primary));
                color: hsl(var(--primary-foreground));
                text-transform: capitalize;
              }
              .calendar-container .fc .fc-button:hover {
                background-color: hsl(var(--primary) / 0.9);
                border-color: hsl(var(--primary) / 0.9);
              }
              .calendar-container .fc .fc-button:disabled {
                opacity: 0.5;
              }
              .calendar-container .fc .fc-button-active {
                background-color: hsl(var(--primary) / 0.8);
              }
              .calendar-container .fc-theme-standard td,
              .calendar-container .fc-theme-standard th {
                border-color: hsl(var(--border));
              }
              .calendar-container .fc-theme-standard .fc-scrollgrid {
                border-color: hsl(var(--border));
              }
              .calendar-container .fc .fc-daygrid-day-number {
                color: hsl(var(--foreground));
              }
              .calendar-container .fc .fc-col-header-cell-cushion {
                color: hsl(var(--muted-foreground));
                font-weight: 600;
              }
              .calendar-container .fc .fc-daygrid-day.fc-day-today {
                background-color: hsl(var(--accent) / 0.1);
              }
              .calendar-container .fc-event {
                cursor: pointer;
                border-radius: 4px;
                padding: 2px 4px;
                font-size: 0.875rem;
              }
              .calendar-container .fc-event:hover {
                opacity: 0.85;
              }
              .calendar-container .fc-daygrid-event {
                white-space: normal;
              }
            `}</style>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay"
              }}
              locale="pt-br"
              events={events}
              eventClick={handleEventClick}
              height="auto"
              buttonText={{
                today: "Hoje",
                month: "Mês",
                week: "Semana",
                day: "Dia"
              }}
              dayMaxEvents={3}
              eventDisplay="block"
            />
          </div>
        </CardContent>
      </Card>

      {/* Meeting Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedMeeting && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <StatusIcon className="h-5 w-5" />
                  {selectedMeeting.title}
                </DialogTitle>
                <DialogDescription>
                  Detalhes da reunião
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Status Badge */}
                <div>
                  <Badge 
                    variant="outline" 
                    className={`${statusConfig[selectedMeeting.status].bg} ${statusConfig[selectedMeeting.status].border} ${statusConfig[selectedMeeting.status].text}`}
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig[selectedMeeting.status].label}
                  </Badge>
                </div>

                {/* Meeting Details */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Data e Hora</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedMeeting.scheduledAt), "PPP 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {selectedMeeting.completedAt && (
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Realizada em</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(selectedMeeting.completedAt), "PPP 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedMeeting.convertedToSale && (
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 mt-1 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">
                          Convertida em Venda
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedMeeting.notes && (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Observações</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedMeeting.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
