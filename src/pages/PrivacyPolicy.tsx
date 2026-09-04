import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Lock,
  Eye,
  FileCheck2,
  Database,
  Share2,
  Clock,
  UserCheck,
  AlertCircle,
  Mail,
  ChevronRight,
  ArrowLeft,
  Printer,
  ExternalLink,
  Cookie,
  Baby,
  RefreshCw,
  Server,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import logoUrl from '@/assets/1002440441png1782862869065-a785f.png'

interface SectionItem {
  id: string
  title: string
}

const SECTIONS: SectionItem[] = [
  { id: 'controlador-dpo', title: '1. Controlador e Encarregado de Dados (DPO)' },
  { id: 'dados-coletados', title: '2. Dados Pessoais Coletados' },
  { id: 'dados-sensiveis', title: '3. Tratamento de Dados Sensíveis de Saúde' },
  { id: 'finalidades', title: '4. Finalidades e Bases Legais (LGPD)' },
  { id: 'compartilhamento', title: '5. Compartilhamento de Dados' },
  { id: 'seguranca', title: '6. Segurança da Informação e Criptografia' },
  { id: 'direitos-titular', title: '7. Seus Direitos como Titular (Art. 18 LGPD)' },
  { id: 'retencao', title: '8. Retenção e Descarte (Prazos CFM)' },
  { id: 'cookies-pwa', title: '9. Cookies e Armazenamento Local no PWA' },
  { id: 'menores', title: '10. Dados de Crianças e Adolescentes' },
  { id: 'google-play', title: '11. Conformidade com Google Play e Lojas de Apps' },
  { id: 'atualizacoes', title: '12. Alterações desta Política' },
  { id: 'contato', title: '13. Contato e Exercício de Direitos' },
]

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState<string>('controlador-dpo')

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Política de Privacidade | V MED BRASIL'
  }, [])

  const scrollTo = (id: string) => {
    setActiveSection(id)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-muted/20 text-foreground">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logoUrl}
              alt="V MED BRASIL Logo"
              className="h-9 w-9 rounded-xl object-contain bg-primary p-1 shadow-sm transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-foreground leading-none">
                V MED <span className="text-primary">BRASIL</span>
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                Privacidade & Proteção de Dados (LGPD)
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground"
            >
              <Link to="/termos-de-uso">
                Termos de Uso
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Link>
            </Button>
            <Button asChild size="sm" className="rounded-full px-4 text-xs sm:text-sm">
              <Link to="/login">Entrar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="border-b border-border/40 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            Em conformidade com a LGPD (Lei nº 13.709/2018)
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Política de Privacidade e Proteção de Dados
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Na <strong>V MED BRASIL</strong>, privacidade, sigilo médico e transparência são pilares
            fundamentais. Entenda como coletamos, tratamos, protegemos seus dados pessoais e como
            você pode exercer plenamente seus direitos de titular.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>
              <strong>Última atualização:</strong> 20 de abril de 2026
            </span>
            <span>•</span>
            <span>
              <strong>Vigência:</strong> Imediata
            </span>
            <span>•</span>
            <span>
              <strong>URL de Produção:</strong> https://www.vmedbrasil.com
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Advisory Box */}
        <Alert className="mb-8 border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100">
          <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="font-semibold text-emerald-900 dark:text-emerald-200">
            Compromisso com o Sigilo e Dados de Saúde
          </AlertTitle>
          <AlertDescription className="text-xs sm:text-sm text-emerald-900/90 dark:text-emerald-200/90 mt-1 leading-relaxed">
            Seus dados de saúde (prontuários, receitas, diagnósticos e histórico médico) são
            classificados como <strong>dados pessoais sensíveis</strong> e protegidos por sigilo
            médico legal.{' '}
            <strong>
              NUNCA comercializamos ou vendemos seus dados clínicos ou cadastrais a terceiros para
              publicidade
            </strong>
            .
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Table of contents - desktop sticky sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 hidden lg:block">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border/60">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Navegação da Política</span>
                </div>
                <nav className="space-y-1 text-xs">
                  {SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollTo(section.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                        activeSection === section.id
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <span className="truncate">{section.title}</span>
                      <ChevronRight className="h-3 w-3 shrink-0 ml-1 opacity-60" />
                    </button>
                  ))}
                </nav>

                <div className="mt-6 pt-4 border-t border-border/60 space-y-2">
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Contato do Encarregado (DPO):
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full text-xs justify-start"
                  >
                    <a href="mailto:dpo@vmedbrasil.com">
                      <Mail className="h-3.5 w-3.5 mr-2 text-primary" />
                      dpo@vmedbrasil.com
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Body Content */}
          <main className="lg:col-span-8 max-w-3xl space-y-8 leading-relaxed text-sm sm:text-base">
            {/* Sec 1 */}
            <section id="controlador-dpo" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <UserCheck className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  1. Controlador de Dados e Encarregado (DPO)
                </h2>
              </div>
              <p className="text-muted-foreground">
                Para fins da Lei Geral de Proteção de Dados Pessoais (Lei Federal nº 13.709/2018 -
                LGPD), o <strong>Controlador</strong> dos dados tratados na plataforma é:
              </p>
              <div className="p-4 rounded-xl bg-card border border-border/80 text-xs sm:text-sm space-y-1 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Razão Social:</strong> VMX do Brasil Serviços
                  em Saúde e Tecnologia Ltda. (V MED BRASIL)
                </p>
                <p>
                  <strong className="text-foreground">CNPJ:</strong> 00.000.000/0001-00
                </p>
                <p>
                  <strong className="text-foreground">Sede:</strong> Brasil
                </p>
                <p>
                  <strong className="text-foreground">Portal Web:</strong>{' '}
                  <a
                    href="https://www.vmedbrasil.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    https://www.vmedbrasil.com
                  </a>
                </p>
              </div>
              <p className="text-muted-foreground">
                Nomeamos um{' '}
                <strong>
                  Encarregado pelo Tratamento de Dados Pessoais (Data Protection Officer - DPO)
                </strong>{' '}
                para atender às solicitações dos titulares de dados e interagir com a Autoridade
                Nacional de Proteção de Dados (ANPD):
              </p>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs sm:text-sm space-y-1">
                <p className="font-semibold text-foreground">Encarregado de Dados (DPO)</p>
                <p className="text-muted-foreground">
                  E-mail de contato exclusivo para privacidade:{' '}
                  <a
                    href="mailto:dpo@vmedbrasil.com"
                    className="text-primary hover:underline font-medium"
                  >
                    dpo@vmedbrasil.com
                  </a>
                </p>
                <p className="text-muted-foreground">
                  E-mail geral de atendimento:{' '}
                  <a
                    href="mailto:contato@vmedbrasil.com"
                    className="text-primary hover:underline font-medium"
                  >
                    contato@vmedbrasil.com
                  </a>
                </p>
              </div>
            </section>

            {/* Sec 2 */}
            <section id="dados-coletados" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Database className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  2. Dados Pessoais Coletados
                </h2>
              </div>
              <p className="text-muted-foreground">
                Coletamos apenas os dados estritamente necessários para viabilizar as
                funcionalidades da plataforma e a prestação do cuidado em saúde:
              </p>
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-card border border-border/80">
                  <h3 className="font-semibold text-foreground text-sm mb-1">
                    a) Dados Cadastrais e de Identificação
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Nome completo, CPF, e-mail, telefone/WhatsApp, data de nascimento, endereço e
                    gênero. Para profissionais de saúde, número de registro profissional (CRM, CRO,
                    CRF, etc.), estado emissor e especialidade.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-card border border-border/80">
                  <h3 className="font-semibold text-foreground text-sm mb-1">
                    b) Dados de Dependentes
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Nome, data de nascimento, CPF e grau de parentesco de filhos ou dependentes
                    inseridos pelo titular responsável para fins de agendamento de consultas ou
                    gestão de receitas pediátricas/familiares.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-card border border-border/80">
                  <h3 className="font-semibold text-foreground text-sm mb-1">
                    c) Dados Financeiros e de Pagamento
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Histórico de transações, extrato de créditos/benefícios, dados para emissão de
                    PIX ou cobranças processadas via nosso parceiro financeiro{' '}
                    <strong>Asaas</strong>. Não armazenamos números de cartão de crédito completos
                    nem CVV.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-card border border-border/80">
                  <h3 className="font-semibold text-foreground text-sm mb-1">
                    d) Dados Técnicos e de Navegação
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Endereço IP, data e hora de acessos, identificador de sessão, tipo de
                    dispositivo, navegador e registros técnicos necessários para segurança e
                    auditoria (Marco Civil da Internet, art. 15).
                  </p>
                </div>
              </div>
            </section>

            {/* Sec 3 */}
            <section id="dados-sensiveis" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Eye className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  3. Tratamento de Dados Pessoais Sensíveis de Saúde
                </h2>
              </div>
              <p className="text-muted-foreground">
                Dados de saúde são categorizados como <strong>sensíveis</strong> pela LGPD (art. 5º,
                II). Na V MED BRASIL, compreendem:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground text-xs sm:text-sm">
                <li>
                  Histórico clínico, anamneses, queixas, sintomas relatados e evolução clínica
                  registrada pelos médicos nos prontuários eletrônicos;
                </li>
                <li>Prescrições e receitas de medicamentos simples ou de controle especial;</li>
                <li>
                  Pedidos de exames laboratoriais e complementares, laudos e resultados anexados;
                </li>
                <li>
                  Metas de saúde, hábitos de vida e parâmetros biométricos fornecidos
                  voluntariamente pelo paciente para acompanhamento preventivo.
                </li>
              </ul>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Esses dados são protegidos pelo <strong>sigilo profissional médico</strong> (Código
                de Ética Médica, Resoluções do CFM) e tratados exclusivamente para a tutela da saúde
                (art. 7º, VIII e art. 11, II, &quot;f&quot; da LGPD).
              </p>
            </section>

            {/* Sec 4 */}
            <section id="finalidades" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <FileCheck2 className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  4. Finalidades e Bases Legais do Tratamento
                </h2>
              </div>
              <p className="text-muted-foreground">
                Tratamos os dados pessoais estritamente amparados pelas bases legais previstas nos
                artigos 7º e 11 da LGPD:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm border border-border/80 rounded-xl overflow-hidden">
                  <thead className="bg-muted text-foreground">
                    <tr>
                      <th className="p-3 text-left font-semibold">Finalidade</th>
                      <th className="p-3 text-left font-semibold">Base Legal (LGPD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-muted-foreground">
                    <tr>
                      <td className="p-3">
                        Agendamento de consultas presenciais e realização de telemedicina
                      </td>
                      <td className="p-3">
                        Execução de contrato (art. 7º, V) e Tutela da saúde (art. 11, II,
                        &quot;f&quot;)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3">
                        Manutenção de prontuário eletrônico e emissão de receitas digitais
                      </td>
                      <td className="p-3">
                        Cumprimento de obrigação legal/regulatória (CFM / Lei 13.787/18)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3">
                        Processamento de pagamentos, cobranças PIX e gestão de benefícios
                      </td>
                      <td className="p-3">Execução de contrato (art. 7º, V)</td>
                    </tr>
                    <tr>
                      <td className="p-3">
                        Envio de lembretes de consulta, confirmações e avisos do sistema
                      </td>
                      <td className="p-3">
                        Legítimo interesse (art. 7º, IX) e execução contratual
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3">
                        Prevenção a fraudes, segurança da aplicação e registros de logs
                      </td>
                      <td className="p-3">
                        Obrigação legal (Marco Civil) e proteção ao crédito/fraude
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Sec 5 */}
            <section id="compartilhamento" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Share2 className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  5. Compartilhamento de Dados com Terceiros
                </h2>
              </div>
              <p className="text-muted-foreground">
                O compartilhamento de dados ocorre unicamente quando estritamente necessário para
                viabilizar a prestação dos serviços contratados pelo usuário:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground text-xs sm:text-sm">
                <li>
                  <strong>Profissionais de Saúde:</strong> médicos e especialistas que atenderem
                  você têm acesso aos dados clínicos relevantes, histórico de consultas e prontuário
                  para o ato médico, sob dever absoluto de sigilo profissional;
                </li>
                <li>
                  <strong>Laboratórios e Farmácias Credenciadas:</strong> quando o paciente decide
                  utilizar benefícios ou apresentar receitas para compra de medicamentos ou exames,
                  apenas os dados da prescrição são compartilhados para validação e faturamento;
                </li>
                <li>
                  <strong>Processador de Pagamentos (Asaas):</strong> envio de dados cadastrais
                  essenciais para validação de identidade bancária, cobrança PIX e split de
                  pagamento regulamentado;
                </li>
                <li>
                  <strong>Sistemas Integrados de Gestão Médica (GestãoMed / FinançasMed):</strong>{' '}
                  compartilhamento estritamente operacional para cadastro de pacientes e conciliação
                  financeira do atendimento nas clínicas integradas;
                </li>
                <li>
                  <strong>Empresas Empregadoras (Benefício Corporativo):</strong> recebem apenas
                  relatórios quantitativos agregados e extratos de utilização financeira de
                  créditos.
                  <strong>
                    Diagnósticos, receitas, anamneses e hipóteses clínicas NUNCA são compartilhados
                    com o empregador
                  </strong>
                  ;
                </li>
                <li>
                  <strong>Autoridades Públicas e Judiciais:</strong> mediante ordem judicial ou
                  expressa previsão em lei.
                </li>
              </ul>
            </section>

            {/* Sec 6 */}
            <section id="seguranca" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Lock className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  6. Segurança da Informação e Criptografia
                </h2>
              </div>
              <p className="text-muted-foreground">
                Adotamos rígidos padrões de segurança técnica e organizacional para proteger seus
                dados contra acessos não autorizados, destruição ou vazamento:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground text-xs sm:text-sm">
                <li>
                  <strong>Criptografia em Trânsito:</strong> todo o tráfego entre seu dispositivo
                  (navegador ou app instalado) e nossos servidores é protegido por TLS/HTTPS de alta
                  segurança;
                </li>
                <li>
                  <strong>Controle de Acesso por Perfil (RBAC):</strong> pacientes, médicos,
                  clínicas, farmácias e administradores têm acesso restrito e segregado apenas aos
                  dados que competem à sua função;
                </li>
                <li>
                  <strong>Proteção no PWA:</strong> dados clínicos sensíveis não são armazenados em
                  caches públicos de navegador ou de forma persistente e desprotegida no aparelho;
                </li>
                <li>
                  <strong>Trilhas de Auditoria:</strong> registros detalhados de quem acessou e
                  alterou registros em conformidade com as exigências dos conselhos profissionais.
                </li>
              </ul>
            </section>

            {/* Sec 7 */}
            <section id="direitos-titular" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  7. Seus Direitos como Titular (Art. 18 da LGPD)
                </h2>
              </div>
              <p className="text-muted-foreground">
                A LGPD garante a você, a qualquer momento e mediante requisição simples e gratuita,
                os seguintes direitos:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3 rounded-lg border border-border/80 bg-card">
                  <strong className="text-foreground">Confirmação e Acesso:</strong> saber se
                  tratamos seus dados e acessar uma cópia completa.
                </div>
                <div className="p-3 rounded-lg border border-border/80 bg-card">
                  <strong className="text-foreground">Correção:</strong> retificar dados
                  incompletos, inexatos ou desatualizados.
                </div>
                <div className="p-3 rounded-lg border border-border/80 bg-card">
                  <strong className="text-foreground">Anonimização ou Bloqueio:</strong> sobre dados
                  desnecessários ou tratados em desconformidade.
                </div>
                <div className="p-3 rounded-lg border border-border/80 bg-card">
                  <strong className="text-foreground">Portabilidade:</strong> solicitar a
                  transferência dos seus dados a outro prestador de serviços.
                </div>
                <div className="p-3 rounded-lg border border-border/80 bg-card">
                  <strong className="text-foreground">Eliminação:</strong> exclusão dos dados
                  tratados com base no consentimento, ressalvadas as hipóteses legais de retenção.
                </div>
                <div className="p-3 rounded-lg border border-border/80 bg-card">
                  <strong className="text-foreground">Revogação do Consentimento:</strong> revogar
                  autorizações previamente concedidas de forma facilitada.
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Para exercer qualquer direito, envie mensagem para{' '}
                <a
                  href="mailto:dpo@vmedbrasil.com"
                  className="text-primary hover:underline font-medium"
                >
                  dpo@vmedbrasil.com
                </a>
                . Responderemos no prazo legal estipulado pela ANPD.
              </p>
            </section>

            {/* Sec 8 */}
            <section id="retencao" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  8. Retenção e Descarte de Dados (Prazos do CFM)
                </h2>
              </div>
              <p className="text-muted-foreground">
                Armazenamos seus dados apenas pelo tempo necessário para atingir as finalidades para
                as quais foram coletados ou para cumprimento de prazos legais e regulatórios:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground text-xs sm:text-sm">
                <li>
                  <strong>Prontuários e Documentos Médicos:</strong> retidos pelo prazo mínimo de{' '}
                  <strong>20 (vinte) anos</strong> a partir do último registro, em estrito
                  cumprimento à <strong>Lei Federal nº 13.787/2018</strong> e Resolução CFM nº
                  1.821/2007;
                </li>
                <li>
                  <strong>Registros de Conexão (IPs):</strong> mantidos por 6 (seis) meses, conforme
                  art. 15 do Marco Civil da Internet;
                </li>
                <li>
                  <strong>Dados Fiscais e Financeiros:</strong> mantidos por 5 (cinco) anos após a
                  transação, nos termos do Código Tributário Nacional e Código Civil.
                </li>
              </ul>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Findos os prazos ou mediante requisição legítima de exclusão que não colida com
                obrigações legais, os dados serão descartados de forma segura ou anonimizados.
              </p>
            </section>

            {/* Sec 9 */}
            <section id="cookies-pwa" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Cookie className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  9. Cookies e Armazenamento Local no PWA
                </h2>
              </div>
              <p className="text-muted-foreground">
                Utilizamos armazenamento local (`localStorage` e `sessionStorage`) estritamente
                funcional para viabilizar:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs sm:text-sm">
                <li>Manutenção segura da sua sessão autenticada;</li>
                <li>Armazenamento de suas preferências visuais (ex.: tema claro ou escuro);</li>
                <li>
                  Cache de interface estática (ícones e layout) para funcionamento rápido em modo
                  offline (PWA).
                </li>
              </ul>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Não utilizamos cookies invasivos de rastreamento de terceiros para publicidade
                comportamental cruzada.
              </p>
            </section>

            {/* Sec 10 */}
            <section id="menores" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Baby className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  10. Tratamento de Dados de Crianças e Adolescentes
                </h2>
              </div>
              <p className="text-muted-foreground">
                O cadastro e atendimento de menores de 18 (dezoito) anos somente são permitidos por
                meio de sua vinculação como dependente de um responsável legal cadastrado na
                plataforma (pai, mãe ou tutor legal), em conformidade com o art. 14 da LGPD e o
                Estatuto da Criança e do Adolescente (ECA).
              </p>
              <p className="text-muted-foreground text-xs sm:text-sm">
                O consentimento para o tratamento dos dados do menor é fornecido expressamente pelo
                responsável no momento do cadastro do dependente.
              </p>
            </section>

            {/* Sec 11 */}
            <section id="google-play" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Server className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  11. Conformidade com a Política de Desenvolvedor da Google Play
                </h2>
              </div>
              <p className="text-muted-foreground">
                Em atendimento às diretrizes de privacidade e segurança de dados de usuários da
                Google Play Store e PWABuilder/TWA:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground text-xs sm:text-sm">
                <li>
                  Esta Política de Privacidade é pública, acessível de forma transparente e sem
                  necessidade de autenticação prévia;
                </li>
                <li>
                  Informamos explicitamente todas as categorias de dados pessoais e de saúde
                  coletadas e compartilhadas;
                </li>
                <li>
                  Oferecemos mecanismo claro para solicitação de exclusão de conta e de dados
                  cadastrais através do e-mail do DPO ({' '}
                  <a
                    href="mailto:dpo@vmedbrasil.com"
                    className="text-primary hover:underline font-medium"
                  >
                    dpo@vmedbrasil.com
                  </a>{' '}
                  );
                </li>
                <li>
                  Não acessamos permissões invasivas desnecessárias no dispositivo (como agenda de
                  contatos ou localização em segundo plano) sem solicitação de consentimento prévio
                  no momento do uso.
                </li>
              </ul>
            </section>

            {/* Sec 12 */}
            <section id="atualizacoes" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <RefreshCw className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  12. Alterações desta Política de Privacidade
                </h2>
              </div>
              <p className="text-muted-foreground">
                Poderemos atualizar esta Política periodicamente para refletir aprimoramentos em
                nossos serviços ou alterações legislativas e regulatórias. Sempre que houver
                mudanças materiais, publicaremos a nova versão nesta página, atualizando a data no
                topo deste documento.
              </p>
            </section>

            {/* Sec 13 */}
            <section id="contato" className="scroll-mt-24 space-y-4 pt-4 border-t border-border/60">
              <div className="flex items-center gap-2 text-primary">
                <Mail className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  13. Contato e Exercício de Direitos do Titular
                </h2>
              </div>
              <p className="text-muted-foreground">
                Se você tiver perguntas sobre esta Política de Privacidade ou desejar exercer
                qualquer um dos seus direitos de titular previstos na LGPD, entre em contato:
              </p>
              <div className="p-4 rounded-xl bg-card border border-border/80 space-y-2">
                <p className="font-semibold text-foreground">
                  Encarregado de Proteção de Dados (DPO)
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  E-mail do DPO:{' '}
                  <a
                    href="mailto:dpo@vmedbrasil.com"
                    className="text-primary hover:underline font-medium"
                  >
                    dpo@vmedbrasil.com
                  </a>
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  Endereço Oficial da Aplicação:{' '}
                  <a
                    href="https://www.vmedbrasil.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    https://www.vmedbrasil.com
                  </a>
                </p>
              </div>
            </section>

            {/* Bottom Actions */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60">
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Início
                </Link>
              </Button>
              <Button asChild className="w-full sm:w-auto">
                <Link to="/termos-de-uso">
                  Ver Termos de Uso <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-border/60 bg-card py-8 text-center text-xs text-muted-foreground">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <p>
            V MED BRASIL © {new Date().getFullYear()} — Plataforma de Saúde e Bem-Estar. Todos os
            direitos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/termos-de-uso" className="text-primary font-medium hover:underline">
              Termos de Uso
            </Link>
            <span>•</span>
            <Link
              to="/politica-de-privacidade"
              className="text-primary font-medium hover:underline"
            >
              Política de Privacidade
            </Link>
            <span>•</span>
            <Link to="/login" className="hover:underline">
              Área do Usuário
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
