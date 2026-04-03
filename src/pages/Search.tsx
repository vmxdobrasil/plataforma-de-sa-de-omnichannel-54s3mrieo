import { useState } from 'react'
import { Filter, Star, Video, Home as HomeIcon, MapPin, Search as SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { BookingFlow } from '@/components/BookingFlow'

const professionals = [
  {
    id: 1,
    name: 'Dra. Carolina Mendes',
    spec: 'Dermatologia Estética',
    rating: 4.9,
    reviews: 124,
    type: ['Presencial', 'Online'],
    price: 'R$ 350',
    img: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=10',
  },
  {
    id: 2,
    name: 'Dr. Roberto Alves',
    spec: 'Ortopedia',
    rating: 4.8,
    reviews: 89,
    type: ['Presencial'],
    price: 'Plano Bradesco',
    img: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=11',
  },
  {
    id: 3,
    name: 'Dra. Juliana Ferreira',
    spec: 'Psicologia',
    rating: 5.0,
    reviews: 201,
    type: ['Online'],
    price: 'R$ 200',
    img: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=12',
  },
  {
    id: 4,
    name: 'Equipe Cuidar',
    spec: 'Enfermagem Domiciliar',
    rating: 4.7,
    reviews: 45,
    type: ['Domiciliar'],
    price: 'Sob Consulta',
    img: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=13',
  },
]

export default function Search() {
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedPro, setSelectedPro] = useState('')

  const handleBook = (name: string) => {
    setSelectedPro(name)
    setBookingOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Encontre Especialistas</h1>
          <p className="text-muted-foreground mt-1">Agendamento rápido em até 3 cliques</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl shadow-sm border">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Especialidade, sintoma ou nome..."
            className="pl-10 bg-muted/50 border-none"
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
          <Button variant="secondary" className="rounded-full shrink-0">
            <HomeIcon className="h-4 w-4 mr-2" /> Domiciliar
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {professionals.map((pro) => (
          <Card
            key={pro.id}
            className="overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up"
          >
            <CardContent className="p-0 flex flex-col sm:flex-row">
              <div className="p-6 flex-1 flex flex-col sm:flex-row gap-6">
                <Avatar className="h-20 w-20 border shadow-sm">
                  <AvatarImage src={pro.img} />
                  <AvatarFallback>{pro.name[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{pro.name}</h3>
                      <p className="text-muted-foreground">{pro.spec}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-md text-sm font-medium">
                      <Star className="h-3.5 w-3.5 fill-current" /> {pro.rating}{' '}
                      <span className="text-amber-600/60 ml-1">({pro.reviews})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex gap-2">
                      {pro.type.map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="font-normal text-xs bg-muted/50"
                        >
                          {t === 'Online' && <Video className="h-3 w-3 mr-1" />}
                          {t === 'Presencial' && <MapPin className="h-3 w-3 mr-1" />}
                          {t === 'Domiciliar' && <HomeIcon className="h-3 w-3 mr-1" />}
                          {t}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-sm font-medium text-foreground ml-auto">{pro.price}</div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 p-6 sm:w-64 flex flex-col justify-center border-t sm:border-t-0 sm:border-l">
                <Button className="w-full mb-2 rounded-full" onClick={() => handleBook(pro.name)}>
                  Agendar Agora
                </Button>
                <Button variant="ghost" className="w-full text-xs h-8">
                  Ver Perfil Completo
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BookingFlow
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        professionalName={selectedPro}
      />
    </div>
  )
}
