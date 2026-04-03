import { useEffect, useState } from 'react'
import { Filter, Star, Video, Home as HomeIcon, MapPin, Search as SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { BookingFlow } from '@/components/BookingFlow'
import { getProfessionals } from '@/services/users'

export default function Search() {
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedPro, setSelectedPro] = useState<any>(null)
  const [professionals, setProfessionals] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    getProfessionals().then(setProfessionals).catch(console.error)
  }, [])

  const handleBook = (pro: any) => {
    setSelectedPro(pro)
    setBookingOpen(true)
  }

  const filteredPros = professionals.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.specialty && p.specialty.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Rede V MED</h1>
          <p className="text-muted-foreground mt-1">
            Encontre especialistas e agende em até 3 cliques
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl shadow-sm border">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Especialidade, sintoma ou nome..."
            className="pl-10 bg-muted/50 border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <Button variant="outline" className="rounded-full shrink-0">
            <Filter className="h-4 w-4 mr-2" /> Filtros
          </Button>
          <Button variant="secondary" className="rounded-full shrink-0">
            <MapPin className="h-4 w-4 mr-2" /> Presencial
          </Button>
          <Button variant="secondary" className="rounded-full shrink-0">
            <Video className="h-4 w-4 mr-2" /> Telemedicina
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPros.map((pro) => (
          <Card
            key={pro.id}
            className="overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up"
          >
            <CardContent className="p-0 flex flex-col sm:flex-row">
              <div className="p-6 flex-1 flex flex-col sm:flex-row gap-6">
                <Avatar className="h-20 w-20 border shadow-sm">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${pro.name}`}
                  />
                  <AvatarFallback>{pro.name[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{pro.name}</h3>
                      <p className="text-muted-foreground">{pro.specialty || 'Clínico Geral'}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-md text-sm font-medium">
                      <Star className="h-3.5 w-3.5 fill-current" /> 4.9
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="font-normal text-xs bg-muted/50">
                        <MapPin className="h-3 w-3 mr-1" /> Presencial
                      </Badge>
                      <Badge variant="outline" className="font-normal text-xs bg-muted/50">
                        <Video className="h-3 w-3 mr-1" /> Online
                      </Badge>
                      <Badge variant="outline" className="font-normal text-xs bg-muted/50">
                        <HomeIcon className="h-3 w-3 mr-1" /> Domiciliar
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 p-6 sm:w-64 flex flex-col justify-center border-t sm:border-t-0 sm:border-l">
                <Button className="w-full mb-2 rounded-full" onClick={() => handleBook(pro)}>
                  Agendar Agora
                </Button>
                <Button variant="ghost" className="w-full text-xs h-8">
                  Ver Perfil Completo
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredPros.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum profissional encontrado.</p>
        )}
      </div>

      {selectedPro && (
        <BookingFlow open={bookingOpen} onOpenChange={setBookingOpen} professional={selectedPro} />
      )}
    </div>
  )
}
