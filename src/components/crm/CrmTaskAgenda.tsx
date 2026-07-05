import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isToday,
  addMonths,
  getDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const mockEvents = [
  { date: format(new Date(), 'yyyy-MM-dd'), title: 'Follow-up TechHealth', color: 'bg-blue-500' },
  {
    date: format(new Date(Date.now() + 86400000 * 2), 'yyyy-MM-dd'),
    title: 'Reunião MedBrasil',
    color: 'bg-emerald-500',
  },
  {
    date: format(new Date(Date.now() + 86400000 * 5), 'yyyy-MM-dd'),
    title: 'Proposta Vida Plena',
    color: 'bg-yellow-500',
  },
]

export function CrmTaskAgenda() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDay = getDay(monthStart)
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, -1))}
            className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((d, i) => (
          <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const events = mockEvents.filter((e) => e.date === dateStr)
          return (
            <div
              key={dateStr}
              className={cn(
                'min-h-[44px] rounded-lg p-1 text-xs transition-colors',
                isToday(day) ? 'bg-primary/15 ring-1 ring-primary/30' : 'hover:bg-white/20',
              )}
            >
              <span className={cn('font-medium', isToday(day) && 'text-primary')}>
                {format(day, 'd')}
              </span>
              {events.map((e, i) => (
                <div
                  key={i}
                  className={cn(
                    'mt-0.5 px-1 py-0.5 rounded text-[10px] text-white truncate',
                    e.color,
                  )}
                >
                  {e.title}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
