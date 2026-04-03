import { useState } from 'react'
import { Bot, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Olá! Sou a V MED AI. Como posso ajudar com sua saúde hoje?' },
  ])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    setMessages((prev) => [...prev, { role: 'user', text: input }])
    setInput('')

    setTimeout(() => {
      const isCardio =
        input.toLowerCase().includes('dor no peito') || input.toLowerCase().includes('coração')
      const isDerma = input.toLowerCase().includes('pele') || input.toLowerCase().includes('mancha')
      const isDental =
        input.toLowerCase().includes('dente') || input.toLowerCase().includes('sorriso')

      let recommendation =
        'Com base no que você me disse, recomendo agendar uma avaliação clínica geral.'
      if (isCardio)
        recommendation =
          'Sintomas como dor no peito exigem atenção. Recomendo buscar um Cardiologista imediatamente ou usar nosso botão SOS.'
      else if (isDerma)
        recommendation =
          'Parece ser uma questão dermatológica. Posso filtrar especialistas em Dermatologia Estética e Clínica para você.'
      else if (isDental)
        recommendation =
          'Para questões odontológicas, temos excelentes dentistas na rede V MED. Deseja ver os horários para Odontologia?'

      setMessages((prev) => [...prev, { role: 'ai', text: recommendation }])
    }, 1000)
  }

  return (
    <>
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 h-[400px] flex flex-col shadow-2xl z-50 animate-fade-in-up border-primary/20">
          <div className="p-3 border-b bg-primary text-primary-foreground flex justify-between items-center rounded-t-xl">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">V MED AI</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-primary-foreground hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-2 rounded-lg text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-3 border-t flex gap-2">
            <Input
              placeholder="Digite um sintoma..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button size="icon" onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg animate-pulse-glow z-50 bg-primary hover:bg-primary/90"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bot className="h-6 w-6" />
      </Button>
    </>
  )
}
