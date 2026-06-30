import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MapPin, Store, Navigation, Pill, TestTube, Phone } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'

const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function PartnerDirectory() {
  const { user } = useAuth()
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  const loadData = async () => {
    try {
      const res = await pb.collection('users').getFullList({
        filter: '(role = "pharmacy" || role = "laboratory") && registration_status = "approved"',
        sort: 'name',
      })
      setPartners(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('users', () => loadData())

  const enableLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert('Não foi possível obter sua localização.'),
    )
  }

  const filtered = partners
    .filter((p) => {
      if (filter !== 'all' && p.role !== filter) return false
      if (search) {
        const s = search.toLowerCase()
        return (
          p.name?.toLowerCase().includes(s) ||
          p.city?.toLowerCase().includes(s) ||
          p.address_neighborhood?.toLowerCase().includes(s)
        )
      }
      return true
    })
    .map((p) => ({
      ...p,
      distance:
        userLocation && p.lat && p.lng
          ? haversine(userLocation.lat, userLocation.lng, p.lat, p.lng)
          : null,
    }))
    .sort((a, b) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance
      if (a.distance !== null) return -1
      if (b.distance !== null) return 1
      return 0
    })

  return (
    <div className="space-y-6 pb-10 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Navigation className="h-8 w-8 text-primary" /> Onde Usar
          </h1>
          <p className="text-muted-foreground mt-1">
            Encontre farmácias e laboratórios parceiros próximos.
          </p>
        </div>
        <Button variant="outline" onClick={enableLocation} className="shrink-0">
          <MapPin className="h-4 w-4 mr-2" />{' '}
          {userLocation ? 'Localização Ativa' : 'Ativar Localização'}
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <Input
          placeholder="Buscar por nome, cidade ou bairro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pharmacy">Farmácias</SelectItem>
            <SelectItem value="laboratory">Laboratórios</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando parceiros...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum parceiro encontrado.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border shrink-0">
                    <AvatarImage src={p.avatar ? pb.files.getURL(p, p.avatar) : ''} />
                    <AvatarFallback>
                      {p.role === 'pharmacy' ? (
                        <Pill className="h-5 w-5 text-teal-600" />
                      ) : (
                        <TestTube className="h-5 w-5 text-blue-600" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{p.name}</p>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {p.role === 'pharmacy' ? 'Farmácia' : 'Laboratório'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{p.business_name}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      {p.address_street}, {p.address_number} - {p.address_neighborhood}
                    </span>
                  </div>
                  <div className="text-muted-foreground pl-6">
                    {p.city} - {p.state}
                  </div>
                  {p.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {p.phone}
                    </div>
                  )}
                </div>
                {p.distance !== null && (
                  <Badge className="bg-primary/10 text-primary border-0">
                    <Navigation className="h-3 w-3 mr-1" />{' '}
                    {p.distance < 1
                      ? `${Math.round(p.distance * 1000)}m`
                      : `${p.distance.toFixed(1)}km`}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
