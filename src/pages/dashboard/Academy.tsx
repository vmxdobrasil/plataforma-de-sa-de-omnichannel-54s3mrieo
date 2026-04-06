import { useEffect, useState } from 'react'
import { getSubscriptions } from '@/services/ecosystem'
import { useAuth } from '@/hooks/use-auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlayCircle, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Academy() {
  const [courses, setCourses] = useState<any[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      getSubscriptions(user.id).then((subs) => {
        const enrolledCourses = subs
          .filter((s) => s.expand?.product_id?.category === 'course' && s.status === 'active')
          .map((s) => s.expand.product_id)
        setCourses(enrolledCourses)
      })
    }
  }, [user])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">V MED Academy</h1>
        <p className="text-muted-foreground">Acesse seus cursos e materiais educativos.</p>
      </div>

      {courses.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="mb-2">Nenhum curso matriculado</CardTitle>
          <CardDescription className="mb-6">
            Você ainda não possui acesso a nenhum curso. Explore o marketplace para descobrir novos
            conteúdos.
          </CardDescription>
          <Button asChild>
            <Link to="/dashboard/marketplace">Visitar Marketplace</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <div className="aspect-video w-full bg-muted flex items-center justify-center relative overflow-hidden rounded-t-lg">
                <img
                  src={`https://img.usecurling.com/p/400/225?q=education&seed=${course.id}`}
                  alt={course.name}
                  className="object-cover w-full h-full opacity-60"
                />
                <PlayCircle className="h-12 w-12 text-white absolute" />
              </div>
              <CardHeader>
                <CardTitle>{course.name}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[30%]"></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">30% concluído</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Continuar Aula</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
