import { useEffect, useState, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Pill,
  Activity,
  ShieldCheck,
  Download,
  Smile,
  Sparkles,
  Camera,
  Plus,
  CalendarCheck,
} from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { getUser, getDependents, updateUser } from '@/services/users'
import { getPatientPrescriptions } from '@/services/prescriptions'
import { getPatientAppointments, updateAppointmentStatus } from '@/services/appointments'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import pb from '@/lib/pocketbase/client'

const bpData = [
  { date: 'Jan', sys: 120, dia: 80 },
  { date: 'Fev', sys: 118, dia: 79 },
  { date: 'Mar', sys: 122, dia: 82 },
  { date: 'Abr', sys: 115, dia: 75 },
  { date: 'Mai', sys: 119, dia: 78 },
]

export default function HealthProfile() {
  const { user } = useAuth()
  const [activeProfile, setActiveProfile] = useState<any>(null)
  const [dependents, setDependents] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    if (!user?.id) return
    try {
      const [usr, deps] = await Promise.all([getUser(user.id), getDependents(user.id)])
      if (!activeProfile) setActiveProfile(usr)
      else if (activeProfile.id === usr.id) setActiveProfile(usr)
      setDependents(deps)

      const activeId = activeProfile?.id || usr.id
      const [prescs, appts] = await Promise.all([
        getPatientPrescriptions(activeId),
        getPatientAppointments(activeId),
      ])
      setPrescriptions(prescs)
      setAppointments(appts.filter((a) => new Date(a.dateTime).getTime() >= Date.now() - 86400000))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id, activeProfile?.id])
  useRealtime('users', () => loadData())
  useRealtime('prescriptions', () => loadData())
  useRealtime('appointments', () => loadData())

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeProfile?.id) return
    const formData = new FormData()
    formData.append('avatar', file)
    try {
      await updateUser(activeProfile.id, formData)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleCheckIn = async (id: string) => {
    try {
      await updateAppointmentStatus(id, 'checked_in')
    } catch (err) {
      console.error(err)
    }
  }

  if (!activeProfile) return null

  const avatarUrl = activeProfile.avatar
    ? pb.files.getURL({ id: activeProfile.id, collectionId: 'users' }, activeProfile.avatar)
    : `https://api.dicebear.com/7.x/notionists/svg?seed=${activeProfile.name}`

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground w-32">
          Perfis Familiares
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          <div
            className="flex flex-col items-center gap-1 cursor-pointer"
            onClick={() => setActiveProfile(user)}
          >
            <Avatar
              className={`h-12 w-12 border-2 ${activeProfile.id === user?.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
            >
              <AvatarImage
                src={
                  user?.avatar
                    ? pb.files.getURL({ id: user.id, collectionId: 'users' }, user.avatar)
                    : `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name}`
                }
              />
              <AvatarFallback>Eu</AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-medium">Principal</span>
          </div>
          {dependents.map((dep) => (
            <div
              key={dep.id}
              className="flex flex-col items-center gap-1 cursor-pointer"
              onClick={() => setActiveProfile(dep)}
            >
              <Avatar
                className={`h-12 w-12 border-2 ${activeProfile.id === dep.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
              >
                <AvatarImage
                  src={
                    dep.avatar
                      ? pb.files.getURL({ id: dep.id, collectionId: 'users' }, dep.avatar)
                      : `https://api.dicebear.com/7.x/notionists/svg?seed=${dep.name}`
                  }
                />
                <AvatarFallback>{dep.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-[10px] font-medium truncate max-w-[60px]">
                {dep.name.split(' ')[0]}
              </span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1 justify-center">
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-dashed">
              <Plus className="h-5 w-5" />
            </Button>
            <span className="text-[10px] font-medium text-muted-foreground">Adicionar</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-card rounded-xl border shadow-sm animate-fade-in-up relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-0"></div>
        <div className="relative group">
          <Avatar className="h-28 w-28 border-4 border-background shadow-md">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{activeProfile.name[0]}</AvatarFallback>
          </Avatar>
          <div
            className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full cursor-pointer shadow-sm hover:scale-105 transition-transform"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleAvatarChange}
          />
        </div>
        <div className="text-center md:text-left flex-1 z-10">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <h1 className="text-3xl font-bold">{activeProfile.name}</h1>
            {activeProfile.loyalty_points > 0 && (
              <Badge className="bg-yellow-400/20 text-yellow-700 hover:bg-yellow-400/30 border-yellow-400/30">
                <Sparkles className="w-3 h-3 mr-1" /> {activeProfile.loyalty_points} pts
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Sangue {activeProfile.blood_type || '?'} • Plano Bradesco Top
          </p>
          <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-3 h-3 mr-1" /> LGPD Protegido
            </Badge>
            {activeProfile.allergies && (
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                Alergia: {activeProfile.allergies}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {appointments.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50 shadow-sm animate-fade-in-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-blue-500" /> Próximas Consultas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold">
                    {format(new Date(apt.dateTime), "dd/MM 'às' HH:mm")} -{' '}
                    {apt.expand?.professional_id?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {apt.type} • {apt.notes}
                  </p>
                </div>
                {apt.status === 'scheduled' ? (
                  <Button
                    onClick={() => handleCheckIn(apt.id)}
                    className="shrink-0 bg-blue-600 hover:bg-blue-700"
                  >
                    Fazer Check-in (Sala de Espera)
                  </Button>
                ) : apt.status === 'checked_in' ? (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 py-1.5 shrink-0 px-3"
                  >
                    Aguardando Atendimento...
                  </Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0">
                    {apt.status}
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs
        defaultValue="timeline"
        className="animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-muted/50 rounded-lg flex-wrap">
          <TabsTrigger value="timeline" className="py-2.5 rounded-md">
            Clínico
          </TabsTrigger>
          <TabsTrigger value="pharmacy" className="py-2.5 rounded-md">
            Receitas
          </TabsTrigger>
          <TabsTrigger value="biometrics" className="py-2.5 rounded-md">
            Biometria
          </TabsTrigger>
          <TabsTrigger value="aesthetic" className="py-2.5 rounded-md">
            Estética
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-6 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="relative border-l-2 border-muted ml-3 space-y-8">
                <div className="relative pl-6">
                  <div className="absolute -left-[21px] bg-background border-2 border-primary w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Consulta de Rotina</h3>
                  <p className="text-sm text-muted-foreground mb-2">Histórico Simulado</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-md border">
                    Paciente apresenta exames normais. Pressão controlada.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pharmacy" className="mt-6 space-y-4">
          {prescriptions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma receita encontrada.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {prescriptions.map((p) => (
                <Card key={p.id} className="border-emerald-200 bg-emerald-50/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 shrink-0">
                        <Pill className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{p.medications}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Prescrito por {p.expand?.professional_id?.name}
                        </p>
                        {p.pharmacy_instructions && (
                          <p className="text-xs mt-2 bg-white p-2 rounded border">
                            {p.pharmacy_instructions}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="biometrics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pressão Arterial</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  sys: { label: 'Sistólica', color: 'hsl(var(--chart-1))' },
                  dia: { label: 'Diastólica', color: 'hsl(var(--chart-2))' },
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bpData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} domain={[60, 140]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="sys"
                      stroke="var(--color-sys)"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="dia"
                      stroke="var(--color-dia)"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aesthetic" className="mt-6 space-y-4">
          <p className="text-muted-foreground py-4 text-center">
            Nenhum procedimento estético registrado.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
