import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { getSplitConfig, updateSplitConfig, createSplitConfig } from '@/services/split_config'

export function SplitConfigPanel() {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setConfig(await getSplitConfig())
      } catch {
        /* intentionally ignored */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = {
        default_commission: Number(config.default_commission),
        consultation_percentage: Number(config.consultation_percentage),
        exam_percentage: Number(config.exam_percentage),
        pharmacy_percentage: Number(config.pharmacy_percentage),
        is_active: config.is_active,
      }
      if (config?.id) await updateSplitConfig(config.id, data)
      else await createSplitConfig({ ...data, is_active: true })
      toast.success('Configuração salva com sucesso!')
    } catch {
      toast.error('Erro ao salvar configuração.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>

  const fields = [
    { key: 'default_commission', label: 'Comissão Padrão (%)' },
    { key: 'consultation_percentage', label: 'Consultas (%)' },
    { key: 'exam_percentage', label: 'Exames (%)' },
    { key: 'pharmacy_percentage', label: 'Farmácia (%)' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Split</CardTitle>
        <CardDescription>
          Defina as porcentagens de comissão da plataforma V MED Brasil por categoria.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((f) => (
          <div key={f.key} className="space-y-2">
            <Label>{f.label}</Label>
            <Input
              type="number"
              step="0.01"
              value={config?.[f.key] || 0}
              onChange={(e) => setConfig({ ...config, [f.key]: e.target.value })}
            />
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Switch
            checked={config?.is_active ?? true}
            onCheckedChange={(v) => setConfig({ ...config, is_active: v })}
          />
          <Label>Configuração ativa</Label>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Salvando...' : 'Salvar Configuração'}
        </Button>
      </CardContent>
    </Card>
  )
}
