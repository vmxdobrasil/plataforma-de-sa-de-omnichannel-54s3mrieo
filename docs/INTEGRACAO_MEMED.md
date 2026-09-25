# Integração Memed — Prescrição Digital (Pesquisa & Plano de Credenciamento)

Este documento descreve o plano de pesquisa, credenciamento e viabilidade técnica para integração da **Memed (Prescrição Digital)** à plataforma **V MED BRASIL**.

> **Nota de Escopo:** Este documento é estritamente estratégico e técnico-documental para planejamento e credenciamento de parceria. Nenhuma linha de código ou migration foi implementada neste momento.

---

## 1. Visão Geral

- **A Memed:** É a maior plataforma de prescrição digital do Brasil, contando com mais de 210 mil médicos ativos, mais de 350 parceiros de software integrados, cerca de 4 milhões de prescrições geradas mensalmente, rede com mais de 36 mil farmácias com integração nativa para dispensação e uma base proprietária com mais de 60 mil itens de medicamentos, exames e produtos de saúde constantemente atualizados.
- **Modelo de parceria para operadores de software:** A integração padrão da Memed é **gratuita** para parceiros desenvolvedores/operadores de software de saúde (prontuários eletrônicos, plataformas de telemedicina e ERPs médicos). A monetização da Memed ocorre na cadeia de dispensação farmacêutica (farmácias parceiras e conversão de compras), não cobrando licenciamento mensal ou custo por receita gerada do operador de software na modalidade standard.
- **Arquitetura de produto Memed:** A Memed não comercializa prontuário eletrônico completo para os parceiros: opera como um **módulo embutido (iframe / micro front-end)** inserido diretamente dentro do fluxo de atendimento/prontuário do parceiro.
  - O operador de software (V MED BRASIL) injeta automaticamente os dados do paciente (nome, CPF, data de nascimento, telefone, sexo).
  - O médico utiliza o catálogo clínico inteligente e o assistente posológico da Memed.
  - A assinatura digital é realizada no próprio fluxo (via certificado em nuvem ICP-Brasil).
  - O paciente recebe a receita digital interativa diretamente via WhatsApp, SMS e e-mail disparados pela infraestrutura da Memed.

---

## 2. Processo de Credenciamento (Passo a Passo)

1. **Preenchimento do formulário de parceria:**
   - Acessar o formulário oficial: `https://memed.com.br/parceiro-software/`.
   - Preencher os dados de contato corporativo (Nome, E-mail, Telefone, Nome da empresa) e acionar o botão _"Fale com especialista"_. A página inicial solicita apenas as informações básicas de contato institucional.
2. **Contato com especialista de parcerias da Memed:**
   - Aguardar o contato do time de parcerias comerciais e novos negócios da Memed.
   - Apresentar o perfil da V MED BRASIL (plataforma B2B/B2C, telemedicina, marketplace e prontuário integrado para médicos afiliados).
3. **Formalização do termo de parceria:**
   - Assinatura/aceite eletrônico do contrato/termo de parceria técnica e comercial para operadores de software (modelo padrão isento de royalties para uso standard).
4. **Obtenção de credenciais de parceiro e acesso ao Sandbox:**
   - Abertura de conta de parceiro no painel **Med.Studio** da Memed.
   - Emissão de chaves de API, identificadores de parceiro (`partner_id` / client credentials) e URLs de sandbox.
   - _Observação técnica importante:_ A documentação técnica aprofundada (especificação de OAuth/tokens de autenticação, parâmetros do micro front-end e webhooks de evento) fica protegida após autenticação de parceiro credenciado. Embora páginas públicas existam em `doc.memed.com.br`, o conteúdo detalhado de implementação só é desbloqueado pós-credenciamento.
   - _Antecipação técnica:_ Os repositórios públicos da organização Memed no GitHub (`https://github.com/MemedDev`, com ~27 repositórios públicos) disponibilizam bibliotecas e SDKs em JavaScript (como o micro front-end wrapper e SDKs de assinatura PDF com suporte a Soluti), permitindo antecipar o modelo de injeção em containers web/React.
5. **Desenvolvimento e homologação em ambiente de Sandbox:**
   - Implementação do SDK/iframe no Painel do Profissional da V MED BRASIL.
   - Configuração do webhook em hook PocketBase (`pb_hooks`) para capturar o evento de documento gerado/assinado.
6. **Homologação técnica com o time da Memed:**
   - Validação conjunta com a equipe de engenharia/suporte da Memed: abertura do módulo com dados pré-populados, validação de CRM ativo do médico, fluxo de assinatura e envio bem-sucedido de webhook.
7. **Liberação para Produção:**
   - Fornecimento das credenciais de produção e ativação definitiva para os profissionais afiliados.

- **Prazos de homologação:** Não há SLA público estipulado no site. O cronograma é alinhado diretamente na conversa com o especialista e equipe de implantação da Memed. Recomenda-se registrar no planejamento uma expectativa estimada em semanas (não dias), a ser confirmada na primeira reunião comercial/técnica.

---

## 3. Requisitos Técnicos (Checklist de Implementação)

- [ ] **Conta Memed ativa de cada médico:**
  - Gratuita para o profissional, exigindo CRM ativo e regular junto ao respectivo CRM/CFM.
  - O médico conecta ou cria sua conta Memed através do fluxo de onboarding/ativação da integração dentro da plataforma V MED.
- [ ] **Credenciais de parceiro ativas:**
  - Token de parceiro / API Key fornecido pela Memed configurado de forma segura no backend.
- [ ] **SDK / Micro Front-End / Iframe web para React 18:**
  - Carregamento assíncrono do módulo de prescrição dentro da tela de atendimento/finalização de consulta no **Painel do Profissional** (`src/pages/ProfessionalDashboard.tsx`).
- [ ] **Preenchimento automático dos dados do paciente:**
  - Mapeamento direto a partir das coleções do PocketBase (`users` e `appointments`):
    - Nome completo (`name`)
    - CPF (`tax_id` / `document_id`)
    - Data de nascimento (`date_of_birth`)
    - Telefone celular (`phone`)
    - E-mail (`email`)
- [ ] **Mecanismo de autenticação médico-parceiro:**
  - Integração via token de parceiro e identificador do médico (confirmar se JWT assinado ou token OAuth fornecido pela Memed após liberação de credenciais).
- [ ] **Webhook de retorno de documento assinado:**
  - Registro de endpoint público no backend Skip Cloud (`pocketbase/hooks/vmed_memed_webhook.js`):
    - Recebimento do payload com ID da receita, link do PDF assinado e hash de validação.
    - Persistência e sincronização automática nas coleções existentes `prescriptions` e `documents` vinculadas ao paciente e ao médico.
- [ ] **Certificado digital ICP-Brasil do profissional:**
  - Necessário para emissão válida de medicamentos sujeitos a controle especial e receituários conforme exigência legal (detalhado na Seção 4).
- [ ] **Padrões de segurança e arquitetura:**
  - Toda a comunicação via HTTPS com criptografia ponta a ponta.
  - Chaves de API e segredos de webhook armazenados em secrets do backend Skip Cloud (acesso via `$os.getenv('MEMED_API_KEY')` / `$os.getenv('MEMED_WEBHOOK_SECRET')`, seguindo o padrão de `V_MED_API_KEY` e `ASAAS_API_KEY`).
  - Nenhuma informação clínica confidencial ou token de integração em cache local/localStorage desprotegido do PWA.

---

## 4. Certificado Digital do Médico (Fluxo de Assinatura)

- **Legislação e Níveis de Assinatura:**
  - **Assinatura Qualificada ICP-Brasil (e-CPF):** É de uso estritamente **obrigatório** para prescrição de medicamentos controlados (Notificações de Receita A, B, B2, C2, Receita de Controle Especial e numerações emitidas pelo SNCR). Base legal: **Lei Federal nº 14.063/2020** e **RDC Anvisa nº 1.000/2025**.
  - **Assinatura Avançada (ex: gov.br nível Prata ou Ouro):** Admissível para medicamentos isentos de prescrição (MIPs), receituários comuns e receitas sujeitas à retenção não abrangidas pelas notificações estritas (como determinados antimicrobianos e análogos de GLP-1), conforme permissões de autoridades de saúde.
- **Provedores de Certificado em Nuvem (Cloud PSC):**
  - O mercado de saúde brasileiro opera majoritariamente com provedores de assinatura remota/em nuvem:
    - **VIDaaS** (Valid) — amplamente suportado e verificado no ecossistema Memed.
    - **BirdID** (Soluti) — presença direta via SDKs Soluti.
    - **SafeID** (Safeweb)
    - **RemoteID** (Certisign)
    - **DS Cloud** (Digital Sign)
- **Certificado Digital Gratuito do CFM (AR-CFM):**
  - O Conselho Federal de Medicina (CFM) disponibiliza gratuitamente para todos os médicos com inscrição ativa o certificado digital padrão ICP-Brasil (A1/A3 em nuvem) através da sua Autoridade de Registro própria (**AR-CFM**):
    - Portal de solicitação: `https://prescricaoeletronica.cfm.org.br/` e `https://prescricao.cfm.org.br/`.
    - **Ação recomendada para a V MED BRASIL:** Incluir no guia de credenciamento do profissional afiliado a orientação passo a passo para emissão do certificado gratuito do CFM, reduzindo drasticamente a fricção financeira de adesão do médico.
- **Ponto de confirmação na homologação:**
  - Alinhar com o time técnico da Memed quais provedores de nuvem estão homologados de forma transparente no pop-up/modal de assinatura embutido.

---

## 5. RDC Anvisa 1.000/25 e SNCR (Ponto Regulatório Crítico)

- **A RDC Anvisa nº 1.000/2025:**
  - Publicada em **11/12/2025** e em vigor desde **15/02/2026**, a norma reestrutura as diretrizes para emissão e dispensação de receituários eletrônicos de medicamentos sujeitos a controle especial:
    - Notificações de Receita A (amarela - entorpecentes);
    - Notificações de Receita B e B2 (azul - psicotrópicos e anorexígenos);
    - Notificações de Receita C2 (retinóides) e Talidomida;
    - Receitas de Controle Especial (branca em duas vias) e receitas sujeitas à retenção.
- **Obrigatoriedade de Integração ao SNCR:**
  - Conforme a resolução, um receituário eletrônico de controlado só tem validade sanitária e jurídica se for gerado por software/plataforma **integrado via API ao Sistema Nacional de Controle de Receituários (SNCR)** da Anvisa, com numeração oficial alocada dinamicamente pelo SNCR e assinado por certificado ICP-Brasil qualificado.
- **Cronograma e Prazos Oficiais:**
  - **18/05/2026:** Obrigatoriedade da versão 2 dos modelos impressos com identificadores padronizados;
  - **30/06/2026:** Disponibilização dos modelos eletrônicos para integração;
  - **30/09/2026:** Entrada em vigor e exigibilidade das funcionalidades eletrônicas completas do SNCR (prazo prorrogado pela **RDC Anvisa nº 1.028/2026**).
- **O que NÃO é considerado receituário eletrônico válido para controlados:**
  - Fotografia, escaneamento ou digitalização de receita em papel;
  - Documento gerado em PDF e impresso para posterior assinatura à caneta;
  - PDF avulso assinado digitalmente sem rastreabilidade e sem numeração concedida pela API do SNCR.
- **Implicações Estratégicas para a V MED BRASIL:**
  - **Vantagem de Arquitetura:** A emissão de controlados pelo fluxo embutido da Memed transfere o ônus da integração pesada com o SNCR para a própria Memed. A V MED BRASIL herda essa conformidade regulatória sem precisar construir e certificar um conector direto com a Anvisa/SNCR.
  - **Faseamento de Uso:**
    - _Fase 1 (Imediata):_ Prescrições simples, medicamentos isentos, exames laboratoriais/imagem e antimicrobianos atendem perfeitamente a demanda da telemedicina e consultas eletivas.
    - _Fase 2 (SNCR):_ Acompanhar o roadmap da Memed quanto à certificação da API do SNCR até o prazo regulatório (setembro/2026). Até a plena liberação, prescrições de controlados estritos de urgência devem seguir os formulários físicos tradicionais.

---

## 6. Rascunho de E-mail / Formulário de Solicitação de Parceria

Abaixo o texto padronizado para submissão no formulário em `https://memed.com.br/parceiro-software/` ou encaminhamento direto ao time de parcerias:

```text
Assunto: Solicitação de parceria técnica — Operador de software V MED BRASIL

Olá, equipe Memed!

Somos a V MED BRASIL (https://www.vmedbrasil.com), plataforma omnichannel de saúde, bem-estar e estética (B2C e B2B) com agendamento, telemedicina, prontuário digital e gestão de tratamentos. Atendemos pacientes, médicos/profissionais, empresas (benefícios corporativos), farmácias e laboratórios.

Gostaríamos de credenciar a integração padrão para operadores de software para oferecer prescrição digital Memed aos nossos médicos afiliados, embutida no fluxo de atendimento (Painel do Profissional).

Dados para o formulário / cadastro:
- Nome do responsável: [Preencher com o nome do responsável técnico/médico]
- E-mail: contato@vmedbrasil.com [ou e-mail institucional do responsável]
- Telefone: [Preencher com telefone de contato com WhatsApp]
- Nome da empresa: VMX do Brasil Serviços em Saúde e Tecnologia Ltda. (V MED BRASIL)
- Site: https://www.vmedbrasil.com
- Stack técnica: React 18 + TypeScript (SPA/PWA), backend PocketBase com hooks server-side
- Perfis envolvidos: profissionais de saúde (médicos) com CRM ativo
- Escopo desejado: prescrição embutida (iframe/SDK web), assinatura digital (incluindo certificado em nuvem e AR-CFM gratuito do CFM), webhook de documento assinado, suporte futuro a receituários de controlados conforme RDC Anvisa 1.000/25 (SNCR)
- Solicitamos: credenciais de ambiente de teste/sandbox, documentação técnica de integração e cronograma de homologação

Aguardo o contato do especialista. Obrigado!
```

---

## 7. Links de Referência

- **Formulário oficial de parceria Memed:**  
  [https://memed.com.br/parceiro-software/](https://memed.com.br/parceiro-software/)
- **Documentação pública da Memed:**  
  [https://doc.memed.com.br/](https://doc.memed.com.br/) _(acesso aos guias detalhados mediante credenciais de parceiro)_
- **GitHub oficial MemedDev (SDKs e bibliotecas abertas):**  
  [https://github.com/MemedDev](https://github.com/MemedDev)
- **Resumo oficial do CFM sobre a RDC Anvisa nº 1.000/2025:**  
  [https://prescricaoeletronica.cfm.org.br/rdc-1000.html](https://prescricaoeletronica.cfm.org.br/rdc-1000.html)
- **Portal de Prescrição Eletrônica e Certificado Gratuito CFM (AR-CFM):**  
  [https://prescricaoeletronica.cfm.org.br/](https://prescricaoeletronica.cfm.org.br/)  
  [https://prescricao.cfm.org.br/](https://prescricao.cfm.org.br/)
- **Portal do ITI — Consulta de Certificados Digitais ICP-Brasil:**  
  [https://meucertificado.iti.gov.br/certificados](https://meucertificado.iti.gov.br/certificados)
- **Portal do SNCR / Anvisa:**  
  [https://sncr.anvisa.gov.br/](https://sncr.anvisa.gov.br/)
