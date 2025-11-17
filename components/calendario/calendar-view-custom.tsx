"use client"

import { useState, useMemo } from "react"
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO
} from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Meeting } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Clock, User, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalendarViewCustomProps {
  meetings: Meeting[]
}

const statusConfig = {
  scheduled: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    icon: Clock,
    label: "Agendada"
  },
  completed: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    icon: CheckCircle2,
    label: "Realizada"
  },
  cancelled: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    icon: XCircle,
    label: "Cancelada"
  },
  no_show: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    icon: AlertCircle,
    label: "Não compareceu"
  }
}

export function CalendarViewCustom({ meetings }: CalendarViewCustomProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentDate])

  // Group meetings by date
  const meetingsByDate = useMemo(() => {
    const grouped = new Map<string, Meeting[]>()
    
    meetings.forEach((meeting) => {
      try {
        const date = format(parseISO(meeting.scheduledAt), "yyyy-MM-dd")
        const existing = grouped.get(date) || []
        grouped.set(date, [...existing, meeting])
      } catch (error) {
        console.error('Error parsing meeting date:', meeting.scheduledAt, error)
      }
    })

    return grouped
  }, [meetings])

  const handlePrevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1))
  }

  const handleEventClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setIsDialogOpen(true)
  }

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const StatusIcon = selectedMeeting ? statusConfig[selectedMeeting.status].icon : Clock

  return (
    <>
      <div className="bg-background border rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-2xl font-semibold capitalize">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevMonth}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const dateKey = format(day, "yyyy-MM-dd")
              const dayMeetings = meetingsByDate.get(dateKey) || []
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[100px] border rounded-lg p-2 bg-card hover:bg-accent/50 transition-colors",
                    !isCurrentMonth && "opacity-50",
                    isToday && "ring-2 ring-primary"
                  )}
                >
                  <div className="text-sm font-medium mb-1">
                    {format(day, "d")}
                  </div>
                  
                  {/* Events */}
                  <div className="space-y-1 overflow-y-auto max-h-[80px]">
                    {dayMeetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        onClick={() => handleEventClick(meeting)}
                        className={cn(
                          "relative text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity",
                          statusConfig[meeting.status].bg,
                          statusConfig[meeting.status].text
                        )}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {meeting.title}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] opacity-90">
                              <Clock className="h-2.5 w-2.5" />
                              {format(parseISO(meeting.scheduledAt), "hh:mm a")}
                            </div>
                          </div>
                          {meeting.status === 'scheduled' && (
                            <Badge 
                              variant="destructive" 
                              className="h-4 w-4 p-0 flex items-center justify-center text-[8px] rounded-full"
                            >
                              !
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

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
                    className={cn(
                      "gap-1",
                      statusConfig[selectedMeeting.status].bg,
                      statusConfig[selectedMeeting.status].text
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig[selectedMeeting.status].label}
                  </Badge>
                </div>

                {/* Date and Time */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Data e Hora:</span>
                    <span>
                      {format(parseISO(selectedMeeting.scheduledAt), "PPP 'às' p", { locale: ptBR })}
                    </span>
                  </div>

                  {selectedMeeting.completedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Realizada em:</span>
                      <span>
                        {format(parseISO(selectedMeeting.completedAt), "PPP 'às' p", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedMeeting.notes && (
                  <div className="space-y-2">
                    <div className="font-medium text-sm">Observações:</div>
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {selectedMeeting.notes}
                    </div>
                  </div>
                )}

                {/* SDR Info */}
                {selectedMeeting.sdrId && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">SDR:</span>
                    <span>{selectedMeeting.sdrName || `ID ${selectedMeeting.sdrId}`}</span>
                  </div>
                )}

                {/* Closer Info */}
                {selectedMeeting.closerId && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Closer:</span>
                    <span>{selectedMeeting.closerName || `ID ${selectedMeeting.closerId}`}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
