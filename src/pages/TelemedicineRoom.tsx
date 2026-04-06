import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Activity, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { updateAppointmentStatus } from '@/services/appointments'

declare global {
  interface Window {
    JitsiMeetExternalAPI: any
  }
}

export default function TelemedicineRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<any>(null)

  const [appointment, setAppointment] = useState<any>(null)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [timer, setTimer] = useState('00:00')
  const [jitsiLoaded, setJitsiLoaded] = useState(false)

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

  useEffect(() => {
    if (!appointment || !jitsiContainerRef.current) return

    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement('script')
      script.src = 'https://meet.jit.si/external_api.js'
      script.async = true
      script.onload = initJitsi
      document.body.appendChild(script)
    } else {
      initJitsi()
    }

    function initJitsi() {
      if (apiRef.current) return
      const domain = 'meet.jit.si'
      const options = {
        roomName: `vmed-appointment-${appointment.id}`,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: user?.name || 'Visitante',
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [], // Hide default toolbar to use our custom buttons
          SHOW_JITSI_WATERMARK: false,
        },
      }

      const api = new window.JitsiMeetExternalAPI(domain, options)
      apiRef.current = api

      api.on('audioMuteStatusChanged', (e: any) => setIsMicOn(!e.muted))
      api.on('videoMuteStatusChanged', (e: any) => setIsVideoOn(!e.muted))

      setJitsiLoaded(true)
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose()
        apiRef.current = null
      }
    }
  }, [appointment, user])

  const toggleMic = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleAudio')
    }
  }

  const toggleVideo = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleVideo')
    }
  }

  const handleEndCall = async () => {
    if (appointment && user?.role === 'professional') {
      try {
        await updateAppointmentStatus(appointment.id, 'completed')
      } catch (e) {
        console.error('Failed to update status', e)
      }
    }
    navigate('/')
  }

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
        {/* Jitsi Container */}
        <div
          ref={jitsiContainerRef}
          className="w-full h-full max-w-5xl rounded-xl overflow-hidden shadow-2xl border border-zinc-700/50"
        />

        {!jitsiLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10">
            <Activity className="animate-spin text-primary h-8 w-8 mb-4" />
            <p className="text-zinc-400 font-medium">Iniciando sala segura...</p>
          </div>
        )}

        <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
          <Badge
            variant="secondary"
            className="bg-zinc-800/80 text-white backdrop-blur-md border-none"
          >
            Consulta Online
          </Badge>
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium bg-emerald-400/10 px-2 py-1 rounded-full backdrop-blur-sm">
            <ShieldCheck className="h-3 w-3" /> Criptografia E2E
          </div>
        </div>
      </div>

      <div className="w-full md:w-80 bg-zinc-950 border-l border-zinc-800 flex flex-col z-20">
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
            onClick={toggleMic}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className={`rounded-full h-12 w-12 border-none ${isVideoOn ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
            onClick={toggleVideo}
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
