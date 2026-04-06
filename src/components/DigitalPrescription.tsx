import { Printer, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function DigitalPrescription({ prescription }: { prescription: any }) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    window.location.origin + '/verify/px/' + prescription.id,
  )}&color=000000`

  return (
    <div className="flex flex-col h-full bg-white text-black p-4 md:p-8 rounded-lg relative overflow-hidden print:w-full print:h-full print:p-0 print:m-0 print:absolute print:inset-0 print:z-50">
      {/* Decorative Header */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-emerald-600 print:bg-emerald-600 print:text-emerald-600" />

      <div className="flex justify-between items-start mb-8 mt-4 border-b pb-6">
        <div>
          <h2 className="text-2xl font-bold font-serif tracking-tight text-emerald-800">V MED</h2>
          <p className="text-sm text-gray-500 uppercase tracking-widest">Receituário Digital</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">Dr(a). {prescription.expand?.professional_id?.name}</p>
          <p className="text-sm text-gray-600">
            {prescription.expand?.professional_id?.specialty || 'Clínico Geral'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            CRM: {prescription.expand?.professional_id?.document_id || '000000-XX'}
          </p>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Paciente</p>
        <p className="text-lg font-medium">{prescription.expand?.patient_id?.name || 'Paciente'}</p>
        <p className="text-sm text-gray-600">
          Data: {format(new Date(prescription.created), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="flex-1 min-h-[200px]">
        <p className="text-sm text-gray-500 uppercase tracking-wider mb-3">Prescrição</p>
        <div className="whitespace-pre-wrap text-base leading-relaxed bg-gray-50 p-6 rounded-md border border-gray-100">
          {prescription.medications}
        </div>

        {prescription.pharmacy_instructions && (
          <div className="mt-6">
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">
              Instruções à Farmácia
            </p>
            <p className="text-sm border-l-4 border-emerald-500 pl-3 py-1 text-gray-700">
              {prescription.pharmacy_instructions}
            </p>
          </div>
        )}
      </div>

      <div className="mt-12 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 border shadow-sm">
            <img src={qrCodeUrl} alt="Validação QR Code" className="w-24 h-24" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-emerald-600 mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-semibold text-sm">Documento Assinado Digitalmente</span>
            </div>
            <p className="text-xs text-gray-500 max-w-[200px]">
              Aponte a câmera para o QR Code para validar a autenticidade desta prescrição na
              farmácia.
            </p>
            <p className="text-[10px] text-gray-400 mt-1 font-mono">ID: {prescription.id}</p>
          </div>
        </div>

        <Button onClick={() => window.print()} className="print:hidden w-full md:w-auto gap-2">
          <Printer className="h-4 w-4" /> Imprimir Receita
        </Button>
      </div>
    </div>
  )
}
