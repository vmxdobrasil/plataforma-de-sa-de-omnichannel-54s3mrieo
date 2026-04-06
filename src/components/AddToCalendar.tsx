import { Calendar, Download, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AddToCalendarProps {
  appointment: any
}

const formatICSDate = (date: Date) => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export function AddToCalendar({ appointment }: AddToCalendarProps) {
  const isProfessional = appointment.expand?.patient_id ? true : false
  const personName = isProfessional
    ? appointment.expand?.patient_id?.name
    : appointment.expand?.professional_id?.name

  const title = `Consulta V MED - ${personName || 'Atendimento'}`
  const description = `Consulta ${appointment.type}. ${appointment.notes || ''}`
  const location =
    appointment.type === 'Online'
      ? `${window.location.origin}/telemedicine/${appointment.id}`
      : 'V MED Clinic'
  const startDate = new Date(appointment.dateTime)
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatICSDate(startDate)}/${formatICSDate(endDate)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`

  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(title)}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&body=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`

  const handleDownloadIcal = () => {
    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
URL:${location}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`

    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.setAttribute('download', `consulta-${appointment.id}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="mr-2 h-4 w-4" /> Adicionar ao Calendário
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => window.open(googleUrl, '_blank')}>
          <Calendar className="mr-2 h-4 w-4" /> Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(outlookUrl, '_blank')}>
          <Mail className="mr-2 h-4 w-4" /> Outlook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadIcal}>
          <Download className="mr-2 h-4 w-4" /> Download iCal (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
