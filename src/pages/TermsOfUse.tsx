import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  PhoneCall,
  Mail,
  Scale,
  CreditCard,
  UserCheck,
  Stethoscope,
  Building,
  HelpCircle,
  ExternalLink,
  Printer,
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
  { id: 'identificacao', title: '1. Identificação do Responsável' },
  { id: 'aceitacao', title: '2. Aceitação dos Termos' },
  { id: 'descricao-servicos', title: '3. Descrição dos Serviços' },
  { id: 'cadastro-contas', title: '4. Cadastro, Acesso e Segurança' },
  { id: 'aviso-urgencia', title: '5. Aviso Importante: Emergências Médicas' },
  { id: 'telemedicina', title: '6. Atendimento Clínico e Telemedicina' },
  { id: 'pagamentos-beneficios', title: '7. Assinaturas, Benefícios e Pagamentos' },
  { id: 'fidelidade', title: '8. Programa de Pontos e Benefícios' },
  { id: 'uso-adequado', title: '9. Conduta e Proibições' },
  { id: 'propriedade-intelectual', title: '10. Propriedade Intelectual' },
  { id: 'limitacao-responsabilidade', title: '11. Limitação de Responsabilidade' },
  { id: 'alteracoes', title: '12. Modificações dos Termos' },
  { id: 'legislacao-foro', title: '13. Legislação Aplicável e Foro' },
  { id: 'contato', title: '14. Canais de Atendimento' },
]

export default function TermsOfUse() {
  const [activeSection, setActiveSection] = useState<string>('identificacao')

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Termos de Uso | V MED BRASIL'
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
                Plataforma de Saúde & Bem-Estar
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
              <Link to="/politica-de-privacidade">
                Política de Privacidade
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
            <Scale className="h-3.5 w-3.5" />
            Documento Legal & Termos Contratuais
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Termos e Condições Gerais de Uso
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Bem-vindo à <strong>V MED BRASIL</strong>. Estes termos regem o acesso e utilização dos
            serviços disponibilizados por meio de nosso aplicativo web, Progressive Web App (PWA) e
            demais canais integrados.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>
              <strong>Última atualização:</strong> 20 de abril de 2026
            </span>
            <span>•</span>
            <span>
              <strong>Versão:</strong> 2.4 (Conforme CFM e Marco Civil da Internet)
            </span>
            <span>•</span>
            <span>
              <strong>Jurisdição:</strong> Brasil
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Advisory Box */}
        <Alert className="mb-8 border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="font-semibold text-amber-900 dark:text-amber-200">
            Aviso de Transparência e Validade Jurídica
          </AlertTitle>
          <AlertDescription className="text-xs sm:text-sm text-amber-900/90 dark:text-amber-200/90 mt-1 leading-relaxed">
            Este instrumento regulamenta as relações contratuais entre a plataforma V MED BRASIL, os
            pacientes, empresas parceiras, clínicas, farmácias, laboratórios e profissionais de
            saúde credenciados. Caso você não concorde com qualquer uma das disposições aqui
            estabelecidas, solicitamos que interrompa a utilização da plataforma.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Table of contents - desktop sticky sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 hidden lg:block">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border/60">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Índice do Documento</span>
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
                  <p className="text-[11px] text-muted-foreground">Dúvidas sobre estes termos?</p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full text-xs justify-start"
                  >
                    <a href="mailto:contato@vmedbrasil.com">
                      <Mail className="h-3.5 w-3.5 mr-2 text-primary" />
                      contato@vmedbrasil.com
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Body Content */}
          <main className="lg:col-span-8 max-w-3xl space-y-8 leading-relaxed text-sm sm:text-base">
            {/* Sec 1 */}
            <section id="identificacao" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Building className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  1. Identificação do Responsável
                </h2>
              </div>
              <p className="text-muted-foreground">
                A plataforma <strong>V MED BRASIL</strong> (denominada neste documento simplesmente
                como &quot;Plataforma&quot;, &quot;V MED&quot; ou &quot;nós&quot;) é operada sob a
                gestão do ecossistema{' '}
                <strong>VMX do Brasil Serviços em Saúde e Tecnologia Ltda.</strong>, pessoa jurídica
                de direito privado, inscrita no CNPJ sob o nº 00.000.000/0001-00, com sede no
                Brasil, e endereço eletrônico oficial de contato{' '}
                <a
                  href="mailto:contato@vmedbrasil.com"
                  className="text-primary hover:underline font-medium"
                >
                  contato@vmedbrasil.com
                </a>
                .
              </p>
              <p className="text-muted-foreground">
                A V MED atua como plataforma tecnológica integradora no segmento de saúde digital,
                bem-estar, estética e benefícios em saúde, conectando pacientes, profissionais de
                saúde autônomos, clínicas, farmácias, laboratórios de análises clínicas e empresas
                contratantes de benefícios corporativos.
              </p>
            </section>

            {/* Sec 2 */}
            <section id="aceitacao" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <UserCheck className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  2. Aceitação dos Termos de Uso
                </h2>
              </div>
              <p className="text-muted-foreground">
                Ao navegar, efetuar cadastro, baixar o aplicativo (PWA/TWA), agendar atendimentos ou
                utilizar qualquer funcionalidade da plataforma V MED BRASIL, você expressa seu
                consentimento livre, informado e inequívoco com todos os dispositivos deste Termo de
                Uso e com a nossa{' '}
                <Link
                  to="/politica-de-privacidade"
                  className="text-primary underline font-medium hover:text-primary/80"
                >
                  Política de Privacidade
                </Link>
                .
              </p>
              <p className="text-muted-foreground">
                Caso você esteja representando uma pessoa jurídica (empresa empregadora, clínica,
                farmácia ou laboratório parceiro), você declara possuir plenos poderes civis e
                societários para vinculá-la aos compromissos aqui assumidos.
              </p>
            </section>

            {/* Sec 3 */}
            <section id="descricao-servicos" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Stethoscope className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  3. Descrição dos Serviços Oferecidos
                </h2>
              </div>
              <p className="text-muted-foreground">
                A plataforma V MED BRASIL disponibiliza soluções digitais voltadas para a promoção,
                gestão e acesso à saúde contínua, incluindo:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                <li>
                  <strong>Agendamento e Intermediação de Consultas:</strong> busca de profissionais
                  de saúde por especialidade, localização e disponibilidade, permitindo o
                  agendamento presencial ou à distância;
                </li>
                <li>
                  <strong>Ambiente de Telemedicina:</strong> sala de atendimento por
                  videoconferência com transmissão segura, em conformidade com as diretrizes do
                  Conselho Federal de Medicina (CFM);
                </li>
                <li>
                  <strong>Prontuário Digital e Histórico de Saúde:</strong> armazenamento de
                  receitas eletrônicas, solicitações de exames, atestados e registros clínicos
                  gerados nos atendimentos da rede;
                </li>
                <li>
                  <strong>Carteira de Benefícios e Créditos de Saúde:</strong> gestão de limites
                  corporativos ou individuais para utilização em consultas, farmácias e laboratórios
                  credenciados;
                </li>
                <li>
                  <strong>Rede Credenciada de Farmácias e Laboratórios:</strong> validação de
                  cupons, verificação de receitas e aplicação de descontos acordados;
                </li>
                <li>
                  <strong>Portal Corporativo (RH):</strong> gestão de colaboradores beneficiários,
                  limites de crédito pré ou pós-pagos e extratos analíticos.
                </li>
              </ul>
            </section>

            {/* Sec 4 */}
            <section id="cadastro-contas" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  4. Cadastro, Acesso e Segurança da Conta
                </h2>
              </div>
              <p className="text-muted-foreground">
                Para utilizar a maioria dos serviços, o usuário deve criar uma conta, fornecendo
                informações verdadeiras, exatas e atualizadas (como nome completo, CPF, e-mail,
                telefone e data de nascimento). Profissionais de saúde deverão adicionalmente
                fornecer número de registro de conselho de classe válido (ex.: CRM, CRO, CRF,
                CREFITO) e estado emissor, passando por processo de homologação pela diretoria
                médica.
              </p>
              <p className="text-muted-foreground">
                O usuário é o único responsável pela guarda e confidencialidade de sua senha de
                acesso. É expressamente vedado o compartilhamento de credenciais. Toda e qualquer
                operação realizada mediante a autenticação com suas credenciais será considerada de
                sua autoria.
              </p>
            </section>

            {/* Sec 5 - EMERGENCY WARNING */}
            <section
              id="aviso-urgencia"
              className="scroll-mt-24 p-5 sm:p-6 rounded-2xl border-2 border-red-500/40 bg-red-500/5 space-y-3"
            >
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  5. Aviso Fundamental: Não Atendimento a Emergências Médicas
                </h2>
              </div>
              <p className="font-semibold text-red-950 dark:text-red-200 text-sm sm:text-base">
                A PLATAFORMA V MED BRASIL, SEUS SERVIÇOS DIGITAIS E SEUS RECURSOS DE TELEMEDICINA
                NÃO SÃO DESTINADOS AO ATENDIMENTO DE URGÊNCIAS E EMERGÊNCIAS MÉDICAS COM RISCO DE
                MORTE.
              </p>
              <p className="text-xs sm:text-sm text-red-900/90 dark:text-red-300 leading-relaxed">
                Em situações de risco iminente à vida, sintomas graves (como dor precordial súbita,
                dificuldade respiratória aguda, perda de consciência, sinais de acidente vascular
                cerebral ou convulsões), o usuário deve se dirigir imediatamente ao pronto-socorro
                mais próximo ou acionar o <strong>SAMU (192)</strong> ou os{' '}
                <strong>Bombeiros (193)</strong>. A telemedicina tem indicação para consultas
                eletivas, acompanhamentos, triagens e rotina clínica.
              </p>
            </section>

            {/* Sec 6 */}
            <section id="telemedicina" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <PhoneCall className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  6. Atendimento Clínico e Telemedicina
                </h2>
              </div>
              <p className="text-muted-foreground">
                A prática de telemedicina por meio da V MED BRASIL observa integralmente as
                diretrizes da <strong>Resolução CFM nº 2.314/2022</strong> e da legislação federal
                pertinente (Lei Federal nº 14.510/2022). O profissional médico goza de total
                autonomia profissional para decidir se a condição clínica do paciente permite o
                atendimento à distância ou se requer encaminhamento imediato para avaliação
                presencial.
              </p>
              <p className="text-muted-foreground">
                O paciente declara estar ciente de que o atendimento remoto tem limitações inerentes
                à ausência de exame físico presencial, comprometendo-se a prestar relatos fidedignos
                e detalhados de seus sintomas, alergias e histórico medicamentoso.
              </p>
            </section>

            {/* Sec 7 */}
            <section id="pagamentos-beneficios" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <CreditCard className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  7. Assinaturas, Benefícios e Pagamentos
                </h2>
              </div>
              <p className="text-muted-foreground">
                As transações financeiras, emissão de cobranças, PIX dinâmico, cartões e
                parcelamentos são processados por meio de instituição de pagamento homologada e
                autorizada pelo Banco Central do Brasil, a saber,{' '}
                <strong>Asaas Gestão Financeira Instituição de Pagamento S.A.</strong>.
              </p>
              <p className="text-muted-foreground">
                A V MED BRASIL não armazena dados sensíveis completos de cartões de crédito em seus
                servidores locais. Todos os fluxos de pagamento seguem os padrões de segurança do
                PCI-DSS e criptografia TLS ponta a ponta.
              </p>
              <p className="text-muted-foreground">
                <strong>Cancelamentos e Reembolsos:</strong> cancelamentos de consultas agendadas
                devem ser solicitados com antecedência mínima de 24 (vinte e quatro) horas para
                garantia de estorno integral ou reagendamento sem custo, salvo casos fortuitos ou de
                força maior devidamente justificados.
              </p>
            </section>

            {/* Sec 8 */}
            <section id="fidelidade" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Scale className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  8. Programa de Pontos, Benefícios e Cashback
                </h2>
              </div>
              <p className="text-muted-foreground">
                A V MED BRASIL poderá, a seu exclusivo critério e como mera liberalidade
                promocional, oferecer programas de pontuação, créditos de bem-estar ou cashback
                decorrentes de consultas, compras em farmácias ou participação em campanhas.
              </p>
              <p className="text-muted-foreground">
                As regras de conversão, acúmulo, prazo de validade e resgate de pontos serão
                divulgadas com transparência no aplicativo e poderão ser alteradas, suspensas ou
                encerradas mediante aviso prévio razoável aos usuários, respeitados os créditos já
                legitimamente adquiridos até a data da alteração.
              </p>
            </section>

            {/* Sec 9 */}
            <section id="uso-adequado" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  9. Conduta do Usuário e Proibições
                </h2>
              </div>
              <p className="text-muted-foreground">É expressamente proibido ao usuário:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                <li>
                  Falsificar identidade, utilizar CPF ou credenciais de terceiros sem autorização
                  legal;
                </li>
                <li>
                  Forjar receitas médicas, laudos, atestados ou documentos de comprovação clínica;
                </li>
                <li>
                  Gravar em áudio ou vídeo as consultas de telemedicina sem a autorização expressa e
                  mútua de todos os participantes;
                </li>
                <li>
                  Tentar violar os sistemas de autenticação, praticar engenharia reversa, varreduras
                  de vulnerabilidades ou introduzir códigos maliciosos;
                </li>
                <li>
                  Cometer atos de injúria, difamação, racismo, assédio ou preconceito contra
                  profissionais de saúde, colaboradores da rede ou outros pacientes.
                </li>
              </ul>
              <p className="text-muted-foreground">
                A violação destas regras sujeitará o infrator à imediata suspensão ou rescisão de
                sua conta, além das sanções cíveis e criminais cabíveis.
              </p>
            </section>

            {/* Sec 10 */}
            <section id="propriedade-intelectual" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  10. Propriedade Intelectual
                </h2>
              </div>
              <p className="text-muted-foreground">
                Todas as marcas, logotipos, identidades visuais, códigos-fonte, algoritmos,
                interfaces gráficas, bancos de dados e conteúdos publicados na plataforma são de
                titularidade exclusiva da V MED BRASIL ou de seus licenciantes, protegidos pela Lei
                de Direitos Autorais (Lei nº 9.610/98) e pela Lei de Propriedade Industrial (Lei nº
                9.279/96).
              </p>
              <p className="text-muted-foreground">
                Nenhum direito de propriedade intelectual é transferido ao usuário por força deste
                instrumento, concedendo-se apenas uma licença revogável, não exclusiva e
                intransferível para uso estritamente pessoal dos serviços da plataforma.
              </p>
            </section>

            {/* Sec 11 */}
            <section id="limitacao-responsabilidade" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Scale className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  11. Limitação de Responsabilidade
                </h2>
              </div>
              <p className="text-muted-foreground">
                A V MED BRASIL é uma provedora de aplicações de internet que facilita o agendamento,
                comunicação e pagamento entre pacientes e prestadores de saúde autônomos. A
                responsabilidade técnica, ética e clínica pelos atos médicos, diagnósticos,
                prescrições e procedimentos é exclusiva de cada profissional de saúde credenciado,
                em conformidade com o Código de Ética Médica e resoluções dos respectivos conselhos.
              </p>
              <p className="text-muted-foreground">
                Não nos responsabilizamos por instabilidades temporárias decorrentes de serviços de
                terceiros (como redes de telecomunicações do usuário, servidores de nuvem globais ou
                interrupções de energia elétrica).
              </p>
            </section>

            {/* Sec 12 */}
            <section id="alteracoes" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  12. Modificações dos Termos
                </h2>
              </div>
              <p className="text-muted-foreground">
                Podemos atualizar estes Termos de Uso periodicamente para refletir mudanças nos
                serviços, na legislação sanitária, na LGPD ou em exigências de lojas de aplicativos
                (como Google Play Store). Notificaremos alterações relevantes por e-mail ou aviso em
                destaque no aplicativo. O uso contínuo após a vigência das alterações consubstancia
                a aceitação dos novos termos.
              </p>
            </section>

            {/* Sec 13 */}
            <section id="legislacao-foro" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Scale className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  13. Legislação Aplicável e Foro
                </h2>
              </div>
              <p className="text-muted-foreground">
                Estes Termos de Uso são regidos e interpretados segundo as leis da República
                Federativa do Brasil, em especial o Marco Civil da Internet (Lei nº 12.965/2014), a
                Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018) e o Código de Defesa do
                Consumidor (Lei nº 8.078/1990).
              </p>
              <p className="text-muted-foreground">
                Fica eleito o foro da comarca da sede da empresa prestadora ou do domicílio do
                consumidor, na forma da legislação processual brasileira, para dirimir eventuais
                litígios decorrentes deste instrumento.
              </p>
            </section>

            {/* Sec 14 */}
            <section id="contato" className="scroll-mt-24 space-y-4 pt-4 border-t border-border/60">
              <div className="flex items-center gap-2 text-primary">
                <HelpCircle className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  14. Canais de Atendimento e Dúvidas
                </h2>
              </div>
              <p className="text-muted-foreground">
                Para dúvidas, esclarecimentos sobre estes Termos de Uso ou comunicações oficiais,
                entre em contato com nossa equipe:
              </p>
              <div className="p-4 rounded-xl bg-card border border-border/80 space-y-2">
                <p className="font-semibold text-foreground">
                  V MED BRASIL — Central de Atendimento
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  E-mail oficial:{' '}
                  <a
                    href="mailto:contato@vmedbrasil.com"
                    className="text-primary hover:underline font-medium"
                  >
                    contato@vmedbrasil.com
                  </a>
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  Website oficial:{' '}
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
                <Link to="/politica-de-privacidade">
                  Ir para Política de Privacidade <ChevronRight className="h-4 w-4 ml-1" />
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
