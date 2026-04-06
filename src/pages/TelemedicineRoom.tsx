import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Settings,
  ShieldCheck,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { updateAppointmentStatus } from '@/services/appointments'

export default function TelemedicineRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [appointment, setAppointment] = useState<any>(null)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [timer, setTimer] = useState('00:00')

  useEffect(() => {
    if (!id) return
    pb.collection('appointments')
      .getOne(id, { expand: 'professional_id,patient_id' })
      .then((rec) => setAppointment(rec))
      .catch(() => navigate('/'))
  }, [id, navigate])

  useEffect(() => {
    let start = Date.now()
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000)
      const m = Math.floor(diff / 60)
        .toString()
        .padStart(2, '0')
      const s = (diff % 60).toString().padStart(2, '0')
      setTimer(`${m}:${s}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleEndCall = async () => {
    if (appointment && user?.role === 'professional') {
      try {
        await updateAppointmentStatus(appointment.id, 'completed')
      } catch (e) {}
    }
    navigate('/')
  }

  const otherUser =
    user?.role === 'patient'
      ? appointment?.expand?.professional_id
      : appointment?.expand?.patient_id

  if (!appointment) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Activity className="animate-spin text-primary h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] -m-6 bg-black flex flex-col md:flex-row relative">
      <div className="flex-1 relative flex items-center justify-center bg-zinc-900 p-4">
        {/* Main Video Placeholder (Other Person) */}
        <div className="relative w-full max-w-4xl aspect-video bg-zinc-800 rounded-xl overflow-hidden shadow-2xl border border-zinc-700/50 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />

          <div className="flex flex-col items-center opacity-30">
            <img
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${otherUser?.name || 'Wait'}`}
              className="w-32 h-32 rounded-full mb-4 opacity-50"
              alt="Participant"
            />
            <p className="text-zinc-400 font-medium">Aguardando vídeo de {otherUser?.name}...</p>
          </div>

          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3">
            <Badge
              variant="secondary"
              className="bg-zinc-800/80 text-white backdrop-blur-md border-none"
            >
              {otherUser?.name}
            </Badge>
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium bg-emerald-400/10 px-2 py-1 rounded-full backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3" /> Criptografia E2E
            </div>
          </div>
        </div>

        {/* Self Video Mini */}
        <div className="absolute bottom-6 right-6 w-32 md:w-48 aspect-video bg-zinc-800 rounded-lg overflow-hidden shadow-xl border-2 border-zinc-700 z-30 transition-all hover:scale-105 cursor-pointer flex items-center justify-center">
          {isVideoOn ? (
            <div className="text-xs text-zinc-500 font-medium flex flex-col items-center">
              <Video className="h-6 w-6 mb-1 opacity-50" />
              Você
            </div>
          ) : (
            <div className="bg-zinc-900 w-full h-full flex items-center justify-center">
              <VideoOff className="text-zinc-600 h-6 w-6" />
            </div>
          )}
          {!isMicOn && (
            <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1 shadow-sm">
              <MicOff className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
      </div>

      <div className="w-full md:w-80 bg-zinc-950 border-l border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" />
            Detalhes da Consulta
          </h2>
          <p className="text-zinc-400 text-sm mt-1">{timer} em andamento</p>
        </div>

        <div className="p-4 flex-1 overflow-auto text-zinc-300 text-sm space-y-4">
          <div>
            <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider mb-1">
              Paciente
            </p>
            <p className="font-medium text-white">{appointment.expand?.patient_id?.name}</p>
          </div>
          <div>
            <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider mb-1">
              Profissional
            </p>
            <p className="font-medium text-white">{appointment.expand?.professional_id?.name}</p>
            <p className="text-zinc-400">{appointment.expand?.professional_id?.specialty}</p>
          </div>
          {appointment.notes && (
            <div>
              <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider mb-1">
                Motivo / Notas
              </p>
              <p className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                {appointment.notes}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 bg-zinc-900/50 flex justify-center gap-4 border-t border-zinc-800">
          <Button
            variant="secondary"
            size="icon"
            className={`rounded-full h-12 w-12 border-none ${isMicOn ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
            onClick={() => setIsMicOn(!isMicOn)}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className={`rounded-full h-12 w-12 border-none ${isVideoOn ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
            onClick={() => setIsVideoOn(!isVideoOn)}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="rounded-full h-12 w-12 hover:bg-red-600 shadow-lg shadow-red-500/20"
            onClick={handleEndCall}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
