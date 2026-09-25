import React, { useId, useMemo } from 'react'
import { CheckCircle2, AlertCircle, Clock, ShieldCheck, Stethoscope } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  VALID_BRAZILIAN_UFS,
  normalizeCrmInput,
  type BrazilianUF,
  type CrmValidationResult,
} from '@/services/crm-validation'

export interface CrmFieldProps {
  crmNumber: string
  crmUf: string
  onCrmChange: (number: string, uf: string) => void
  validationResult?: CrmValidationResult | null
  isValidating?: boolean
  disabled?: boolean
  required?: boolean
  showStatusBanner?: boolean
}

export const CrmInputField: React.FC<CrmFieldProps> = ({
  crmNumber,
  crmUf,
  onCrmChange,
  validationResult,
  isValidating = false,
  disabled = false,
  required = true,
  showStatusBanner = true,
}) => {
  const numberId = useId()
  const ufId = useId()

  const normalized = useMemo(() => {
    return normalizeCrmInput(crmNumber, crmUf)
  }, [crmNumber, crmUf])

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value
    // Se o usuário colar algo como "123456/SP" ou "SP 123456", detecta e auto-preenche a UF
    const parsed = normalizeCrmInput(rawVal, crmUf)
    if (parsed.crmUf && parsed.crmUf !== crmUf) {
      onCrmChange(parsed.crmNumber, parsed.crmUf)
    } else {
      // Aceita números e pontuação comum sem travar digitação
      onCrmChange(rawVal, crmUf)
    }
  }

  const handleUfChange = (newUf: string) => {
    onCrmChange(crmNumber, newUf)
  }

  // Cor do feedback de digitação (sem travar)
  const formatStatus = useMemo(() => {
    if (!crmNumber && !crmUf) return 'empty'
    if (normalized.isValidFormat) return 'valid'
    if (crmNumber && crmNumber.length >= 4 && !crmUf) return 'need_uf'
    return 'invalid'
  }, [crmNumber, crmUf, normalized.isValidFormat])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={numberId}
          className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200"
        >
          <Stethoscope className="w-4 h-4 text-emerald-600" />
          <span>Registro no CRM {required && <span className="text-red-500">*</span>}</span>
        </Label>
        {normalized.formatted && (
          <span className="text-xs font-mono text-slate-500">{normalized.formatted}</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 relative">
          <Input
            id={numberId}
            type="text"
            placeholder="Ex: 123456"
            value={crmNumber}
            onChange={handleNumberChange}
            disabled={disabled}
            className={`font-mono transition-colors ${
              formatStatus === 'valid'
                ? 'border-emerald-500/80 focus-visible:ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
                : formatStatus === 'invalid' && crmNumber.length > 0
                  ? 'border-red-500/80 focus-visible:ring-red-500 bg-red-50/20 dark:bg-red-950/10'
                  : ''
            }`}
          />
          <div className="absolute right-2.5 top-2.5 pointer-events-none">
            {formatStatus === 'valid' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-in fade-in duration-200" />
            )}
            {formatStatus === 'invalid' && crmNumber.length > 0 && (
              <AlertCircle className="w-4 h-4 text-red-500 animate-in fade-in duration-200" />
            )}
          </div>
        </div>

        <div>
          <Select value={crmUf || undefined} onValueChange={handleUfChange} disabled={disabled}>
            <SelectTrigger
              id={ufId}
              className={`font-semibold ${
                !crmUf && formatStatus === 'need_uf' ? 'border-amber-500 bg-amber-50/30' : ''
              }`}
            >
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {VALID_BRAZILIAN_UFS.map((uf) => (
                <SelectItem key={uf} value={uf} className="font-mono">
                  {uf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Feedback de formato imediato em tempo real (verde / vermelho sem bloquear) */}
      {formatStatus === 'invalid' && crmNumber.length > 0 && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>
            {normalized.validationError ||
              'Número de CRM deve conter de 4 a 8 dígitos numéricos com UF válida.'}
          </span>
        </p>
      )}

      {formatStatus === 'need_uf' && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Selecione a Unidade Federativa (UF) do Conselho Regional.</span>
        </p>
      )}

      {formatStatus === 'valid' && !validationResult && (
        <p className="text-xs text-emerald-600 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>
            Formato estrutural válido ({normalized.formatted}). Pronto para verificação de
            regularidade.
          </span>
        </p>
      )}

      {/* Banner de status retornado da verificação backend */}
      {showStatusBanner && validationResult && (
        <div
          className={`rounded-lg p-3 text-xs border transition-all ${
            validationResult.situacao === 'ativo' &&
            validationResult.status_validacao === 'validado'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200'
              : validationResult.status_validacao === 'validacao_manual'
                ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200'
                : 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">
                Situação CFM: {validationResult.situacao.toUpperCase()}
              </span>
            </div>
            <Badge
              variant={
                validationResult.situacao === 'ativo' &&
                validationResult.status_validacao === 'validado'
                  ? 'default'
                  : 'outline'
              }
              className="text-[10px] uppercase font-mono"
            >
              {validationResult.status_validacao.replace('_', ' ')}
            </Badge>
          </div>

          <div className="mt-2 space-y-1 text-slate-700 dark:text-slate-300">
            {validationResult.nome_cfm && (
              <p>
                <strong className="text-slate-900 dark:text-white">Nome registrado:</strong>{' '}
                {validationResult.nome_cfm}
              </p>
            )}
            {validationResult.especialidade && (
              <p>
                <strong className="text-slate-900 dark:text-white">Especialidade:</strong>{' '}
                {validationResult.especialidade}
              </p>
            )}
            {validationResult.observacoes && (
              <p className="text-[11px] opacity-90">{validationResult.observacoes}</p>
            )}
            {validationResult.divergencia_nome && (
              <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                ⚠️ Divergência relevante de nome detectada. Encaminhado para conferência
                administrativa.
              </p>
            )}
          </div>
        </div>
      )}

      {isValidating && (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
          <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Consultando registro oficial no Conselho Federal de Medicina...</span>
        </div>
      )}
    </div>
  )
}
