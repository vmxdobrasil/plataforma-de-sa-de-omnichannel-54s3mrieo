import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Copy, Trash2, Wand2, Check, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  generateContent,
  saveGeneratedContent,
  getGeneratedContent,
  deleteGeneratedContent,
} from '@/services/social_ai'
import { getBrandKit } from '@/services/ecosystem'
import { useRealtime } from '@/hooks/use-realtime'

export default function SocialAI() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [topic, setTopic] = useState('')
  const [contentType, setContentType] = useState('Instagram Post')
  const [tone, setTone] = useState('Informative')
  const [audience, setAudience] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedText, setGeneratedText] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadHistory = async () => {
    try {
      const records = await getGeneratedContent()
      setHistory(records)
    } catch (error) {
      console.error('Failed to load history', error)
    }
  }

  useEffect(() => {
    if (user?.role === 'professional' && user?.is_verified) {
      loadHistory()
      getBrandKit(user.id).then((bk) => {
        if (bk) {
          if (bk.tone) setTone(bk.tone)
          if (bk.audience_description) setAudience(bk.audience_description)
        }
      })
    }
  }, [user])

  useRealtime('generated_content', () => {
    loadHistory()
  })

  if (!user) {
    return <Navigate to="/login" />
  }

  if (user.role !== 'professional') {
    return <Navigate to="/" />
  }

  if (!user.is_verified) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Your account must be verified to use the Social AI tool. Please complete your
            verification process.
            <div className="mt-4">
              <Link to="/settings">
                <Button variant="outline">Go to Settings</Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!user.specialty) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Specialty Required</AlertTitle>
          <AlertDescription>
            You need to set your medical specialty in your profile before generating content.
            <div className="mt-4">
              <Link to="/settings">
                <Button variant="outline">Update Profile</Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleGenerate = async () => {
    if (!topic) {
      toast({ title: 'Error', description: 'Please enter a topic', variant: 'destructive' })
      return
    }

    setIsGenerating(true)
    try {
      const res = await generateContent({
        topic,
        specialty: user.specialty,
        content_type: contentType,
        tone,
        audience,
      })

      setGeneratedText(res.generated_text)

      await saveGeneratedContent({
        professional_id: user.id,
        specialty: user.specialty,
        topic,
        content_type: contentType,
        tone,
        generated_text: res.generated_text,
      })

      toast({ title: 'Success', description: 'Content generated and saved successfully!' })
      setTopic('')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate content',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast({ title: 'Copied', description: 'Text copied to clipboard' })
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteGeneratedContent(id)
      toast({ title: 'Deleted', description: 'Content removed from history' })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete content', variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />V MED Social AI
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate customized content tailored for a {user.specialty}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Generator</CardTitle>
              <CardDescription>Configure your AI prompt parameters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g. Benefits of Vitamin D"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instagram Post">Instagram Post</SelectItem>
                    <SelectItem value="Reels Script">Reels Script</SelectItem>
                    <SelectItem value="LinkedIn Article">LinkedIn Article</SelectItem>
                    <SelectItem value="Patient Guide">Patient Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Audience (from Brand Kit)</Label>
                <Input
                  placeholder="e.g. Women 25-45 looking for skincare..."
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tone of Voice</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Informative">Informative</SelectItem>
                    <SelectItem value="Empathetic">Empathetic</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Educational">Educational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleGenerate} disabled={isGenerating || !topic}>
                {isGenerating ? (
                  <>
                    <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {generatedText && (
            <Card className="border-primary/50 shadow-md">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-lg flex items-center justify-between">
                  Latest Generation
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(generatedText, 'latest')}
                  >
                    {copiedId === 'latest' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 whitespace-pre-wrap text-sm leading-relaxed">
                {generatedText}
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Content Library</h2>
            {history.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <Wand2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No content yet</h3>
                <p className="text-muted-foreground">Generate your first post to see it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.map((item) => (
                  <Card key={item.id} className="flex flex-col h-full">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle
                            className="text-base font-semibold line-clamp-1"
                            title={item.topic}
                          >
                            {item.topic}
                          </CardTitle>
                          <CardDescription className="flex gap-2 mt-1 items-center text-xs">
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {item.content_type}
                            </span>
                            <span>•</span>
                            <span>{item.tone}</span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="text-sm text-muted-foreground line-clamp-4 relative group">
                        {item.generated_text}
                        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-between">
                      <div className="text-xs text-muted-foreground">
                        {new Date(item.created).toLocaleDateString()}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(item.generated_text, item.id)}
                        >
                          {copiedId === item.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
