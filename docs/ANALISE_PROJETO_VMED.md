# Análise Técnica e de Negócio do Projeto V MED BRASIL

**Documento Oficial de Engenharia e Produto**  
**Versão:** 1.0.0  
**Data:** 20 de Abril de 2026  
**Destinatário:** Fornecedor Externo / Equipe de Engenharia e Arquitetura (Adapta One) & Stakeholders V MED BRASIL  
**Ambiente:** Plataforma Web & Progressive Web App (PWA) — Ecossistema Integrado de Saúde

---

## Sumário Executivo

A **V MED BRASIL** é uma plataforma omnichannel de saúde digital, bem-estar, estética médica e benefícios corporativos. O ecossistema foi projetado para integrar a jornada ponta a ponta do cuidado contínuo: desde a atração de pacientes (B2C) e gestão de planos de saúde empresariais (B2B), até o agendamento de consultas (presenciais, domiciliares e telemedicina), prontuário médico eletrônico, prescrição digital, rede credenciada de farmácias e laboratórios de análises clínicas, e um motor financeiro com faturamento corporativo, split de pagamentos e cashback/fidelidade.

Este documento reflete com fidelidade técnica e transparência o **estado real implementado** no código-fonte, nos esquemas de banco de dados do PocketBase (Skip Cloud) e nas regras de negócio da aplicação.

---

## 1. Visão Geral do Produto

### 1.1. Propósito e Proposta de Valor

A plataforma soluciona a fragmentação do ecossistema de saúde brasileiro, reunindo em uma única interface:

1. **Pacientes (B2C):** Agendamento simplificado de consultas por especialidade e geolocalização, telemedicina integrada, prontuário individual com linha do tempo de saúde, histórico de exames e receitas, gestão de dependentes e programa de fidelidade (cashback e pontos de saúde).
2. **Empresas e Departamentos de Recursos Humanos (B2B):** Gestão corporativa de benefícios e subsídios em saúde (_Health Allowance_) e medicamentos (_Medication Allowance_), modalidades de concessão (benefício integral, desconto em folha de pagamento ou modelo misto), emissão de faturas mensais consolidadas e relatórios preditivos de saúde corporativa.
3. **Profissionais de Saúde (Médicos, Odontólogos, Estetas e Terapeutas):** Painel clínico completo, gestão de agenda multilocação, prontuário clínico personalizável por especialidade, prescrições eletrônicas com orientações farmacêuticas, integração com sistemas médicos externos (GestãoMed e FinançasMed) e ferramentas de marketing/posicionamento digital (Social AI e Brand Kit).
4. **Rede Credenciada (Farmácias e Laboratórios):** Validação de receitas e cupons de benefício em ponto de venda (PDV), vitrine de produtos e promoções, conciliação de faturamento e upload de laudos de exames para sincronização direta com o prontuário do paciente.
5. **Diretoria Médica e Supervisão Técnica:** Homologação de novos profissionais cadastrados (conferência de CRM/CRO/CRF, RQE e subespecialidades) com trilha de auditoria completa para cumprimento das normas do CFM e ANVISA.
6. **Administração Central (Backoffice V MED):** Gestão global de usuários, taxas de split de pagamento, tabela de especialidades, regras de cashback, auditoria de logs, gateway financeiro Asaas e CRM de leads e expansão.

### 1.2. Perfis de Acesso (Roles)

O sistema opera sob o modelo de Controle de Acesso Baseado em Papéis (RBAC - _Role-Based Access Control_), estruturado no banco de dados através da enumeração `role` na coleção `users`:

- `patient`: Paciente final e seus dependentes familiares.
- `professional`: Médicos e profissionais de saúde com registro ativo em conselho de classe.
- `company`: Administrador de RH / Financeiro de empresa conveniada (benefício corporativo).
- `medical_director`: Diretor médico e técnico responsável pela supervisão e homologação legal.
- `pharmacy`: Farmácias e drogarias credenciadas na rede de descontos e benefícios.
- `laboratory`: Laboratórios de análises clínicas e diagnóstico por imagem.
- `admin`: Administrador global da plataforma com acesso irrestrito de gestão e auditoria.

### 1.3. Stack Tecnológica

- **Frontend Web / Mobile Web:**
  - **Framework:** React 18 com TypeScript e Vite.
  - **Roteamento:** React Router DOM (v6) com guardiões e roteamento dinâmico baseado em papéis.
  - **Estilização e Componentes:** Tailwind CSS, componentes acessíveis Radix UI / Shadcn UI, Lucide Icons.
  - **Gerenciamento de Estado & Notificações:** Hooks customizados (`useAuth`, `useRealtime`, `useToast`), Sonner e Radix Toast.
  - **Gráficos & Visualização:** Recharts (análise financeira, CRM e métricas de RH).
- **Backend & Banco de Dados (Skip Cloud / PocketBase):**
  - **Engine:** PocketBase (Go / SQLite embedded otimizado) em nuvem gerenciada.
  - **Comunicação Cliente-Servidor:** SDK oficial do PocketBase (`pocketbase/client`), com suporte a subscrição WebSocket em tempo real (`pb.collection(...).subscribe`).
  - **Lógica Servidora (pb_hooks):** Funções JavaScript assíncronas executadas em ambiente Goja JSVM no backend (gatilhos em registros, endpoints utilitários via `routerAdd`, agendamento de tarefas cron e chamadas HTTP externas seguras).
- **Camada PWA (Progressive Web App):**
  - Manifest WebApp (`public/manifest.webmanifest`) com suporte a ícones dinâmicos, tema `#14805A` e shortcuts.
  - Service Worker inteligente (`public/sw.js`) com estratégia _Network-First_ para rotas de navegação, _Stale-While-Revalidate_ para assets estáticos e isolamento estrito de segurança (nenhum dado de saúde é armazenado em cache de navegador).
  - Tela de contingência offline (`public/offline.html`).

---

## 2. Mapa Completo de Módulos e Rotas

Abaixo está o inventário de todas as rotas e módulos funcionais implementados no código-fonte (`src/App.tsx`), detalhando propósito, perfil de acesso e rota associada:

| Rota                       | Módulo / Nome                                | Perfil Mínimo            | Descrição Funcional                                                                                                                                                                                                                                |
| :------------------------- | :------------------------------------------- | :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                        | **Ponto de Entrada / Dashboard do Paciente** | Público / Todos          | Ponto central que redireciona automaticamente o usuário autenticado para o seu painel de acordo com a sua role (`admin`, `company`, `professional`, etc.) ou renderiza a home com agendamentos, métricas de saúde e busca rápida de especialistas. |
| `/login`                   | **Autenticação & Acesso**                    | Público                  | Tela unificada de login e criação rápida de contas (paciente ou profissional com validação de CRM e UF).                                                                                                                                           |
| `/signup`                  | **Cadastro de Usuário**                      | Público                  | Interface de auto-cadastro com seleção de perfil e validação de regras de acesso.                                                                                                                                                                  |
| `/landing`                 | **Landing Page B2C**                         | Público                  | Página promocional pública de alta conversão, com simulador de crédito de saúde, selos de segurança institucional e captura de leads com integração WhatsApp.                                                                                      |
| `/termos-de-uso`           | **Termos e Condições de Uso**                | Público                  | Documento legal completo regulamentando obrigações contratuais, telemedicina (Resolução CFM 2.314/2022), pagamentos via Asaas e aviso mandatório de urgências (não atendimento a emergências de risco de vida).                                    |
| `/politica-de-privacidade` | **Política de Privacidade (LGPD)**           | Público                  | Documento legal exaustivo em conformidade com a LGPD (Lei 13.709/2018), detalhando o papel do Controlador, encarregado (DPO), bases legais, direitos do titular e diretrizes da Google Play Health Apps Policy.                                    |
| `/register`                | **Portal Geral de Cadastros**                | Público                  | Hub para seleção do formulário de credenciamento ou adesão específico por tipo de parceiro.                                                                                                                                                        |
| `/register/company`        | **Credenciamento B2B**                       | Público                  | Formulário de adesão para novas empresas contratantes de planos e benefícios corporativos de saúde.                                                                                                                                                |
| `/register/partner`        | **Credenciamento de Farmácias/Laboratórios** | Público                  | Cadastro e envio de documentação técnica por drogarias e laboratórios interessados em integrar a rede conveniada.                                                                                                                                  |
| `/register/individual`     | **Cadastro Paciente Avulso**                 | Público                  | Fluxo detalhado de cadastro individual B2C para usuários particulares da plataforma.                                                                                                                                                               |
| `/register/professional`   | **Credenciamento Profissional**              | Público                  | Formulário de solicitação de credenciamento médico/odontológico/estético com upload de CRM, RQE e dados bancários para split.                                                                                                                      |
| `/search`                  | **Busca de Profissionais e Serviços**        | Autenticado              | Catálogo de busca com filtros por especialidade, categoria, modalidade (Presencial/Online/Domicílio), preço e geolocalização.                                                                                                                      |
| `/health-profile`          | **Perfil de Saúde do Paciente**              | Autenticado              | Prontuário pessoal do paciente com timeline histórica de consultas, receitas digitais, metas de saúde preventivas e alternador de dependentes familiares.                                                                                          |
| `/documents`               | **Meus Documentos de Saúde**                 | Autenticado              | Repositório central de arquivos médicos do paciente (exames, atestados, contratos e receitas) com status de validade e download.                                                                                                                   |
| `/my-exams`                | **Histórico de Exames**                      | Autenticado              | Listagem detalhada de pedidos de exames e laudos recebidos de clínicas e laboratórios parceiros da rede.                                                                                                                                           |
| `/pharmacy`                | **Vitrine de Farmácia e Drogarias**          | Autenticado              | Catálogo de medicamentos, dermocosméticos e produtos farmacêuticos com destaque para promoções e preços com benefício.                                                                                                                             |
| `/pharmacy-sales`          | **Validação de PDV Farmacêutico**            | Autenticado (`pharmacy`) | Terminal de ponto de venda para a drogaria consultar créditos em benefício do paciente e registrar transações com desconto corporativo.                                                                                                            |
| `/partners`                | **Diretório da Rede Credenciada**            | Autenticado              | Guia de clínicas, farmácias e laboratórios credenciados com endereços, horários de funcionamento e serviços disponíveis.                                                                                                                           |
| `/benefits/statement`      | **Extrato da Carteira de Benefícios**        | Autenticado              | Extrato financeiro de uso do subsídio de saúde, movimentações em folha de pagamento e histórico de acúmulo e resgate de cashback.                                                                                                                  |
| `/hr/simulator`            | **Simulador de Custos de RH**                | Autenticado              | Ferramenta interativa de cálculo de impacto financeiro e ROI para contratação de planos corporativos por porte de empresa.                                                                                                                         |
| `/settings`                | **Configurações da Conta**                   | Autenticado              | Gestão de dados pessoais, preferências de notificação (e-mail/navegador), alteração de senha e gestão de privacidade (sincronização externa).                                                                                                      |
| `/telemedicine/:id`        | **Sala de Telemedicina**                     | Autenticado              | Sala de atendimento remoto por vídeo com transmissão em tempo real, temporizador de consulta e atalhos rápidos para prontuário e prescrição.                                                                                                       |
| `/professional`            | **Dashboard Clínico do Profissional**        | Profissional             | Painel principal do médico/especialista: lista de atendimentos do dia, sala de espera virtual (_checked-in_), abertura de prontuário, emissão de receitas, prescrição digital e sincronização de exames de laboratórios externos.                  |
| `/professional/schedule`   | **Gestão de Grade e Agenda**                 | Profissional             | Gerenciamento de horários disponíveis (`availability_slots`) por dia da semana e modalidade de atendimento (Presencial, Online, Domiciliar).                                                                                                       |
| `/dashboard/social-ai`     | **Gerador de Conteúdo Médico (Social AI)**   | Profissional             | Ferramenta assistida por IA para geração de artigos, posts de Instagram, roteiros de Reels e cartilhas educativas baseadas na especialidade do profissional.                                                                                       |
| `/dashboard/brand-kit`     | **Identidade Visual do Especialista**        | Profissional             | Customização de cores de marca, logomarca e tom de voz comunicacional para aplicação em receitas e documentos médicos.                                                                                                                             |
| `/dashboard/marketplace`   | **Marketplace de Soluções Médicas**          | Profissional             | Vitrine de cursos, agentes inteligentes de atendimento e produtos de capacitação para médicos e terapeutas.                                                                                                                                        |
| `/dashboard/academy`       | **Academy V MED**                            | Profissional             | Plataforma de capacitação e treinamentos contínuos em saúde digital, conformidade médica e gestão de consultórios.                                                                                                                                 |
| `/dashboard/agents`        | **Hub de Agentes Virtuais**                  | Profissional             | Catálogo de agentes autônomos para automação de triagem, suporte a dúvidas de pós-consulta e agendamento inteligente.                                                                                                                              |
| `/dashboard/agency`        | **Painel de Agência / Parcerias**            | Profissional             | Métricas de conversão de campanhas e posicionamento de mercado para clínicas parceiras.                                                                                                                                                            |
| `/dashboard/pharmacy`      | **Painel de Gestão da Farmácia**             | Farmácia                 | Dashboard da farmácia para cadastro de produtos, promoções, controle de comissões e histórico de vendas de conveniados.                                                                                                                            |
| `/dashboard/laboratory`    | **Painel de Gestão do Laboratório**          | Laboratório              | Dashboard do laboratório para gestão de exames cadastrados, sincronização de laudos técnicos e faturamento de procedimentos.                                                                                                                       |
| `/dashboard/clinic`        | **Dashboard da Clínica**                     | Profissional / Clínica   | Visão administrativa de consultório com agenda consolidada de múltiplos médicos, fila de pacientes e estatísticas de presença.                                                                                                                     |
| `/company/dashboard`       | **Portal Corporativo B2B**                   | Empresa / Admin          | Painel de controle da empresa conveniada com métricas de adesão, consumo de saldo de saúde em reais e indicadores de absenteísmo.                                                                                                                  |
| `/company/employees`       | **Gestão de Colaboradores e Vidas**          | Empresa / Admin          | Inclusão de funcionários, concessão e ajuste de limites (`health_allowance` e `medication_allowance`), definição de modelo de custeio e ativação de renovação automática.                                                                          |
| `/company/transactions`    | **Financeiro & Faturamento B2B**             | Empresa / Admin          | Demonstrativo analítico de despesas da empresa com saúde, histórico de débitos por colaborador e acompanhamento de faturas geradas.                                                                                                                |
| `/admin`                   | **Dashboard Geral Administrativo**           | Admin                    | Painel master com estatísticas consolidadas de usuários, faturamento bruto, atendimentos realizados, cadastros pendentes e saúde do servidor.                                                                                                      |
| `/admin/users`             | **Gestão Geral de Usuários**                 | Admin                    | Listagem completa, edição de perfis, ativação/bloqueio de contas, visualização de permissões e convites diretos.                                                                                                                                   |
| `/admin/professionals`     | **Gestão de Profissionais Credenciados**     | Admin                    | Controle da base médica, definição de percentuais de comissão e repasse, status cadastral e histórico de comunicações.                                                                                                                             |
| `/admin/verification`      | **Fila de Verificação Documental**           | Admin / Diretor Médico   | Validação de documentos de identidade, diplomas e registros em conselhos regionais de classe.                                                                                                                                                      |
| `/admin/supervision`       | **Supervisão Médica e Técnica**              | Admin / Diretor Médico   | Painel exclusivo da diretoria médica para homologação de profissionais, averiguação de RQE, especialidades e subespecialidades.                                                                                                                    |
| `/admin/companies`         | **Gestão de Contratos B2B**                  | Admin                    | Cadastro, edição e acompanhamento de status de empresas parceiras (ativo, suspenso, aguardando contrato).                                                                                                                                          |
| `/admin/pharmacy`          | **Gestão da Rede Farmacêutica**              | Admin                    | Validação de documentação sanitária de farmácias (AFE, CRF do RT), comissões de repasse e produtos conveniados.                                                                                                                                    |
| `/admin/network`           | **Gestão da Rede Credenciada**               | Admin                    | Mapeamento geográfico, distribuição de prestadores e homologação de parceiros de saúde em todo o território nacional.                                                                                                                              |
| `/admin/specialties`       | **Tabela de Especialidades Médicas**         | Admin                    | Manutenção da taxonomia médica oficial (categorias, palavras-chave, sintomas associados e prioridade de busca).                                                                                                                                    |
| `/admin/insurance`         | **Gestão de Convênios & Parceiros**          | Admin                    | Cadastro de operadoras de seguro/planos de saúde parceiros, chaves de API externas e webhooks de autorização.                                                                                                                                      |
| `/admin/financial`         | **Dashboard Financeiro Executivo**           | Admin                    | Visão macro de faturamento da plataforma, margem de comissão, volume por vertical (consultas, farmácias, exames) e exportação de relatórios em CSV.                                                                                                |
| `/admin/invoices`          | **Faturamento & Invoices B2B**               | Admin                    | Geração e conciliação de faturas mensais de empresas contratantes, controle de vencimentos e upload de boletos/faturas.                                                                                                                            |
| `/admin/transactions`      | **Auditoria de Transações**                  | Admin                    | Rastreamento detalhado de cada movimentação de crédito/débito no ecossistema e cruzamento com o processador de pagamento.                                                                                                                          |
| `/admin/asaas`             | **Gateway Asaas (Integração & Cobrança)**    | Admin                    | Configuração de ambiente (Sandbox/Produção), teste de conexão, geração manual de links de cobrança (PIX, Boleto, Cartão), consulta de status e log de eventos.                                                                                     |
| `/admin/crm`               | **CRM de Prospecção e Expansão**             | Admin                    | Pipeline de vendas Kanban com etapas de prospecção corporativa (Novos Contatos, Em Negociação, Proposta Enviada, Fechado, Perdido).                                                                                                                |
| `/admin/leads`             | **Gestão de Formulários e Leads**            | Admin                    | Fila de leads capturados em formulários de credenciamento (empresas, parceiros, individuais e profissionais) com alteração de status.                                                                                                              |
| `/admin/ai`                | **Configuração de Inteligência Artificial**  | Admin                    | Monitoramento e parâmetros dos agentes inteligentes e modelos de linguagem configurados na infraestrutura.                                                                                                                                         |
| `/admin/audit`             | **Trilhas de Auditoria (Audit Logs)**        | Admin                    | Registro detalhado de eventos de segurança (login, visualização de prontuários, alterações cadastrais) com data, usuário e endereço IP.                                                                                                            |
| `/admin/settings`          | **Configurações Gerais do Sistema**          | Admin                    | Customização de nome do sistema, logomarca oficial, paleta de cores primárias e regras globais de operação.                                                                                                                                        |
| `/forbidden`               | **Acesso Negado (403)**                      | Autenticado              | Tela de contingência quando um usuário autenticado tenta acessar uma rota incompatível com sua role.                                                                                                                                               |

---

## 3. Modelo de Dados (PocketBase Schema)

O banco de dados PocketBase do projeto é composto por **31 coleções**, categorizadas a seguir por domínio de negócio com seus campos fundamentais e regras de relacionamento:

### 3.1. Domínio de Usuários e Perfis

1. **`users` (auth collection)**
   - **Campos principais:** `id`, `email`, `name`, `avatar`, `role` (enum: _patient, professional, company, medical_director, pharmacy, laboratory, admin_), `phone`, `document_id` (CPF ou documento pessoal), `tax_id` (CNPJ para pessoas jurídicas), `parent_id` (relação recursiva com `users` para titular de dependente), `company_id` (relação com a empresa contratante do colaborador).
   - **Campos clínicos do paciente:** `date_of_birth`, `gender`, `blood_type` (A+, A-, B+, B-, AB+, AB-, O+, O-), `allergies`, `continuous_medications`, `emergency_contact_name`, `emergency_contact_phone`, `allow_external_sync` (autorização LGPD para sincronização de exames).
   - **Campos médicos e regulatórios:** `crm_number`, `crm_state`, `rg`, `rqe`, `specialty`, `sub_specialty`, `bio`, `consultation_value`, `work_shift`, `is_verified` (homologação médica concluída), `has_video_call`.
   - **Campos de benefício corporativo:** `health_allowance` (saldo em reais para consultas e exames), `medication_allowance` (saldo em reais para farmácia), `allowance_type` (_benefit_, _payroll_deduction_, _mixed_), `auto_renew_benefits` (renovação mensal automática), `low_balance_threshold`, `department`, `matricula`, `job_title`, `company_status` (_active_, _suspended_, _pending_contract_).
   - **Campos financeiros e bancários:** `asaas_customer_id`, `asaas_wallet_id`, `commission_rate`, `pending_commission_rate`, `is_blocked`, `block_reason`.
   - **Campos de crescimento e filiação:** `referral_code` (código de indicação único), `referred_by` (usuário que indicou), `origin_type` (_b2c_, _b2b_), `utm_source`, `utm_medium`, `utm_campaign`, `loyalty_points` (saldo de pontos de fidelidade).
   - **Campos de dependentes:** `is_dependent`, `kinship` (grau de parentesco).
   - **Geolocalização e Endereço:** `lat`, `lng`, `address_street`, `address_number`, `address_neighborhood`, `address_zip_code`, `city`, `state`.

### 3.2. Domínio Clínico e Atendimentos

2. **`appointments` (base)**
   - **Campos:** `patient_id` (relação `users`), `professional_id` (relação `users`), `dateTime` (timestamp da consulta), `type` (_Presencial_, _Online_, _Domiciliar_), `status` (_scheduled_, _completed_, _cancelled_, _checked_in_), `classification` (_first_visit_, _follow_up_, _emergency_, _telemedicine_, _exam_), `notes`, `rating` (avaliação de 1 a 5), `cancellation_reason`, `cancelled_by`, `insurance_partner_id` (relação `insurance_partners`).
   - **Campos Financeiros Integrados (GestãoMed):** `valor` (valor cobrado em R$), `forma_pagamento` (PIX, cartao, transferencia, dinheiro, boleto), `status_pagamento` (Pago, Aguardando), `repasse_pct` (% de comissão destinada ao profissional).
   - **Lembretes e Automação:** `reminder_24h_sent`, `reminder_12h_sent`, `reminder_4h_sent`.
3. **`availability_slots` (base)**
   - **Campos:** `professional_id` (relação `users`), `day_of_week` (0 a 6 representando Domingo a Sábado), `start_time` (HH:mm), `end_time` (HH:mm), `slot_type` (_Presencial_, _Online_, _Domiciliar_), `slot_duration` (duração em minutos).
4. **`health_records` (base - Prontuário Eletrônico)**
   - **Campos:** `patient_id` (relação `users`), `professional_id` (relação `users`), `content` (registro clínico / anamnese), `type` (_clinical_, _dental_, _aesthetic_), `attachments` (arquivos anexos).
5. **`prescriptions` (base - Receita Digital)**
   - **Campos:** `patient_id` (relação `users`), `professional_id` (relação `users`), `medications` (posologia e medicamentos prescritos), `pharmacy_instructions` (orientações adicionais ao farmacêutico).
6. **`treatment_plans` (base)**
   - **Campos:** `patient_id` (relação `users`), `title`, `description`, `status` (_active_, _completed_).
7. **`health_goals` (base - Metas de Prevenção)**
   - **Campos:** `patient_id` (relação `users`), `title`, `description`, `category`, `points_reward` (pontos de fidelidade ganhos ao cumprir a meta), `status` (_pending_, _completed_).
8. **`documents` (base - GED Médico)**
   - **Campos:** `patient_id` (relação `users`), `professional_id` (relação `users`), `appointment_id` (relação `appointments`), `title`, `type` (_exam_, _prescription_, _certificate_, _contract_, _legal_doc_, _other_), `file` (arquivo PDF/PNG), `expiry_date` (data de expiração), `notes`.
9. **`medical_specialties` (base)**
   - **Campos:** `name`, `category` (_Cirurgias_, _Clínicas_, _Exames_, _Outros_), `priority`, `keywords` (termos de busca), `symptoms` (sintomas relacionados para triagem automática).

### 3.3. Domínio Corporativo e Financeiro (B2B / Benefícios)

10. **`benefit_transactions` (base - Extrato da Carteira)**
    - **Campos:** `employee_id` (relação `users`), `company_id` (relação `users`), `appointment_id` (relação `appointments`), `partner_id` (relação `users` — farmácia ou laboratório), `amount` (valor em R$), `type` (_credit_, _debit_), `category` (_health_service_, _medication_, _preventive_service_, _emergency_service_, _exam_), `description`, `asaas_payment_id`, `payment_status` (_pending_, _confirmed_, _failed_, _refunded_).
11. **`faturas_empresas` (base - Faturamento de RH)**
    - **Campos:** `company_id` (relação `users`), `billing_period_start`, `billing_period_end`, `total_amount` (soma das despesas de saúde do mês), `status` (_open_, _paid_, _overdue_), `file` (boleto/demonstrativo PDF anexado).
12. **`configuracoes_split` (base)**
    - **Campos:** `default_commission` (taxa de intermediação padrão da V MED), `consultation_percentage`, `exam_percentage`, `pharmacy_percentage`, `is_active`.
13. **`regras_cashback` (base)**
    - **Campos:** `category` (_health_service_, _medication_, _preventive_service_, _emergency_service_, _exam_), `percentage` (% revertida em cashback), `is_active`.
14. **`loyalty_points_history` (base)**
    - **Campos:** `user_id` (relação `users`), `points_delta` (variação positiva ou negativa de pontos), `reason` (_signup_, _dependent_, _referral_, _cashback_, _points_redemption_), `related_appointment_id` (relação `appointments`).

### 3.4. Domínio Gateway Asaas e Conciliação

15. **`asaas_config` (base)**
    - **Campos:** `environment` (_sandbox_, _production_), `webhook_url` (URL de recebimento de notificações de pagamento), `is_active`, `last_tested_at`, `last_test_status`.
16. **`transacoes` (base - Cobranças Asaas)**
    - **Campos:** `asaas_id` (ID da cobrança no Asaas), `asaas_payment_id`, `valor`, `descricao`, `cliente_nome`, `cliente_cpf_cnpj`, `metodo_pagamento` (_BOLETO_, _PIX_, _CREDIT_CARD_), `status` (_pending_, _received_, _confirmed_, _overdue_, _canceled_), `link_pagamento`, `invoice_url`, `data_vencimento`, `external_reference`, `metadata`.
17. **`log_transacoes_asaas` (base)**
    - **Campos:** `asaas_id`, `appointment_id` (relação `appointments`), `benefit_transaction_id` (relação `benefit_transactions`), `amount`, `split_amount`, `status`, `metadata`.

### 3.5. Domínio da Rede Farmacêutica e Laboratorial

18. **`pharmacy_products` (base)**
    - **Campos:** `pharmacy_id` (relação `users`), `name`, `description`, `price`, `promo_price`, `is_promotion`, `image`.
19. **`insurance_partners` (base - Operadoras de Convênios)**
    - **Campos:** `name`, `partner_code`, `api_key`, `webhook_url`, `status` (_active_, _inactive_).

### 3.6. Domínio de Crescimento, Marketing e CRM

20. **`registration_leads` (base - Leads de Entrada)**
    - **Campos:** `name`, `email`, `phone`, `tax_id`, `employee_count` (porte de vidas para empresas), `benefit_intention`, `type` (_company_, _partner_, _individual_, _professional_), `status` (_pending_, _contacted_, _converted_, _rejected_), `metadata`.
21. **`campaigns` (base)**
    - **Campos:** `name`, `slug`, `source`, `medium`, `qr_code_content`, `visit_count`, `registration_count`.
22. **`landing_visits` (base)**
    - **Campos:** `utm_source`, `utm_medium`, `utm_campaign`, `origin`, `referral_code`.

### 3.7. Domínio de Ferramentas Médicas e Posicionamento (Ecosistema)

23. **`products` (base - Catálogo de Extensões)**
    - **Campos:** `name`, `description`, `price`, `category` (_course_, _agent_, _mentorship_, _service_).
24. **`subscriptions` (base)**
    - **Campos:** `user_id` (relação `users`), `product_id` (relação `products`), `status` (_active_, _inactive_, _expired_), `valid_until`.
25. **`brand_kits` (base)**
    - **Campos:** `user_id` (relação `users`), `primary_color`, `secondary_color`, `tone` (_Professional_, _Empathetic_, _Educational_, _Informative_), `audience_description`, `logo`.
26. **`generated_content` (base - Social AI)**
    - **Campos:** `professional_id` (relação `users`), `specialty`, `topic`, `content_type` (_Instagram Post_, _Reels Script_, _LinkedIn Article_, _Patient Guide_), `tone`, `generated_text`.

### 3.8. Domínio de Comunicação e Mensageria

27. **`messages` (base - Chat e Triagem)**
    - **Campos:** `sender_id` (relação `users`), `receiver_id` (relação `users`), `content`, `is_read`, `file`, `message_type` (_text_, _appointment_invite_, _file_, _video_call_invite_), `metadata`.
28. **`notification_templates` (base)**
    - **Campos:** `slug`, `name`, `subject`, `body_text`, `body_html`, `type` (_email_, _whatsapp_, _both_), `is_active`.
29. **`notification_logs` (base)**
    - **Campos:** `recipient_id` (relação `users`), `template_slug`, `message_type`, `subject`, `content`, `status` (_pending_, _sent_, _delivered_, _failed_), `priority`, `error_message`, `retry_count`, `metadata`.

### 3.9. Domínio de Sistema, Auditoria e Governança

30. **`system_settings` (base)**
    - **Campos:** `company_name`, `primary_color`, `logo`.
31. **`audit_logs` (base)**
    - **Campos:** `user_id` (relação `users`), `action` (_view_, _create_, _update_, _delete_), `resource_type`, `resource_id`, `details` (payload JSON gravado para auditoria).

---

## 4. Fluxos Principais de Ponta a Ponta

### 4.1. Fluxo de Cadastro e Login por Perfil

1. O usuário acessa a plataforma (`/login` ou `/signup`).
2. No auto-cadastro rápido, seleciona entre **Paciente** ou **Profissional**:
   - Se **Paciente**, informa nome, e-mail e senha. O sistema cria o registro na coleção `users` com `role = 'patient'`. O hook de boas-vindas (`welcome_webhook.js`) é disparado. Se houver código de indicação (`referral_code`), credita os pontos correspondentes via `loyalty_points_referral.js`.
   - Se **Profissional**, exige adicionalmente `crm_number` e `crm_state`. O registro é criado com `role = 'professional'` e `is_verified = false`. O profissional não pode atender imediatamente: ele entra na fila de supervisão médica (`/admin/supervision`) para conferência e homologação documental pelo Diretor Médico.
3. Se o acesso for via portal de credenciamento (`/register/*`), os dados são salvos em `registration_leads` para análise prévia do time de expansão e conversão no CRM.
4. Ao autenticar no `Login.tsx`, a função `signIn` autentica no PocketBase e o roteador `EntryPoint` redireciona o usuário para seu ambiente restrito de acordo com a `role`:
   - `admin` ➔ `/admin`
   - `medical_director` ➔ `/admin/supervision`
   - `company` ➔ `/company/employees`
   - `professional` ➔ `/professional`
   - `pharmacy` ➔ `/dashboard/pharmacy`
   - `laboratory` ➔ `/dashboard/laboratory`
   - `patient` ➔ `/` (Home do Paciente)

### 4.2. Fluxo de Agendamento de Consulta e Sincronização GestãoMed

1. **Seleção de Horário:** O paciente (ou profissional no consultório) navega em `/search` ou clica em "Novo Agendamento". O modal `BookingFlow.tsx` ou `AppointmentBookingDialog.tsx` carrega os horários disponíveis (`availability_slots`) do profissional para a modalidade escolhida (Presencial, Online, Domiciliar).
2. **Identificação do Paciente e Vínculo FinançasMed:** Se aberto no painel clínico, o diálogo aciona o endpoint utilitário `GET /backend/v1/financasmed/pacientes?medico_email=...`, exibindo a base de pacientes externos do médico e facilitando o autocomplete.
3. **Forma de Pagamento:**
   - **Particular / Direto (PIX / Cartão):** Se PIX, o sistema gera a transação e aciona o backend do Asaas (`/backend/v1/asaas/pay`), devolvendo o QRCode Copia e Cola na tela.
   - **Benefício Corporativo (Empresa):** Se o paciente for colaborador de empresa conveniada, o sistema verifica o saldo disponível (`health_allowance`). Se houver saldo suficiente, debita automaticamente da carteira corporativa criando um registro em `benefit_transactions` e atualizando o saldo do colaborador.
   - **Desconto em Folha (_Payroll_):** O valor é autorizado contra o limite de folha da empresa.
   - **Split Corporativo:** O sistema abate o saldo corporativo restante e gera cobrança avulsa (PIX/Cartão) apenas da diferença.
4. **Criação do Agendamento:** O registro é persistido na coleção `appointments` com status `scheduled`.
5. **Gatilho de Sincronização FinançasMed (`vmed_financasmed_pacientes_webhook.js`):** O backend dispara uma chamada HTTP POST assíncrona (`https://financasmed.goskip.app/api/hooks/vmed/pacientes`) transmitindo os dados do paciente (nome, e-mail, telefone, CPF, convênio) para o app financeiro do médico. O código utiliza tratamento de erro seguro (não trava a V MED caso o serviço externo esteja offline).
6. **Finalização do Atendimento e Disparo GestãoMed:**
   - No encerramento da consulta em `ProfessionalDashboard.tsx`, o médico preenche a evolução clínica no prontuário e revisa o **bloco de dados financeiros**: `valor`, `forma_pagamento`, `status_pagamento` e `% repasse`.
   - A função `finalizeAppointment(apptId, paymentData)` atualiza a consulta para `status = 'completed'`.
   - O hook de backend `pocketbase/hooks/vmed_gestaomed_webhook.js` intercepta o evento, expande o e-mail do médico e os dados do paciente, e dispara um `POST` com cabeçalho `X-API-Key` para `https://gestaomed.goskip.app/api/hooks/vmed/consulta`, consolidando o faturamento diretamente na planilha/gestão financeira do consultório.

### 4.3. Fluxo de Fidelidade e Cashback

1. Quando uma consulta é finalizada (`status = 'completed'`), o gatilho `pocketbase/hooks/on_cashback_credit.js` entra em ação.
2. O sistema consulta a coleção `regras_cashback` para a categoria do serviço (ex: `health_service`, `exam`).
3. Com base na porcentagem cadastrada e no valor pago da consulta, o cálculo converte o valor em pontos de fidelidade (1 ponto para cada centavo de cashback).
4. O saldo `loyalty_points` do paciente na coleção `users` é acrescido e um evento é gravado em `loyalty_points_history` com `reason = 'cashback'` e vínculo com a consulta.
5. O paciente pode visualizar seu saldo em `/benefits/statement` e efetuar o resgate de pontos através da rota `POST /backend/v1/points/redeem` (`redeem_points.js`), transformando pontos em desconto em novos serviços.

### 4.4. Fluxo Corporativo B2B (Empresas & RH)

1. **Contratação e Setup:** A empresa contratante é cadastrada na coleção `users` com `role = 'company'` e status em `faturas_empresas`.
2. **Vínculo de Colaboradores:** No portal `/company/employees`, o RH cadastra ou importa seus funcionários informando matrícula, cargo, subsídio inicial (`health_allowance`) e modalidade (`allowance_type`). A rota de backend `POST /backend/v1/company/link-employee` (`company_link_employee.js`) efetua a vinculação direta.
3. **Uso em Consultas e Farmácias:** Quando o funcionário agenda uma consulta ou adquire medicamentos na farmácia credenciada (`/pharmacy-sales`), a transação é debitada do benefício.
4. **Renovação Mensal:** No primeiro dia do mês (ou via disparo manual pelo RH através do botão "Executar Renovação" que chama `/backend/v1/company/execute-renewal`), o backend executa uma transação atômica (`$app.runInTransaction`) recarregando os saldos mensais dos colaboradores com `auto_renew_benefits = true` e registrando os créditos em `benefit_transactions`.
5. **Geração de Fatura:** O hook `cron_monthly_renewal.js` e a rota `generate_invoice.js` consolidam os débitos do período em um registro em `faturas_empresas` com status `open` e emitem a notificação financeira para quitação do RH.

### 4.5. Fluxo de Assinaturas e Produtos do Ecossistema

1. Profissionais de saúde têm acesso ao marketplace de soluções médicas em `/dashboard/marketplace` e aos agentes autônomos em `/dashboard/agents`.
2. A assinatura de um plano de suporte ou agente inteligente é registrada na coleção `subscriptions` vinculada ao usuário e ao produto (`products`), com validade de 12 meses renováveis.

---

## 5. Estado Real das Integrações

A tabela e os tópicos abaixo expõem com exatidão o estado operacional e os requisitos pendentes de cada integração externa:

| Integração                | Finalidade                                                                      | Arquivos Chave no Repositório                                                                                                                                                       | Estado de Implementação                                                                                                                             | Pendência / Próximo Passo                                                                                                                                                    |
| :------------------------ | :------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Asaas Gateway**         | Cobrança (PIX, Boleto, Cartão), split de pagamentos entre clínica e plataforma. | `src/pages/AdminAsaas.tsx`<br>`src/services/asaas.ts`<br>`pocketbase/hooks/asaas_config.js`<br>`pocketbase/hooks/asaas_webhook.js`                                                  | **Telas e Serviços 100% Implementados**. Suporta chave via painel ou via secret (`ASAAS_API_KEY`). Webhook e links de cobrança codificados.         | **Chave de API NÃO cadastrada no backend**. O usuário precisa cadastrar a API Key na tela `/admin/asaas` ou definir o secret `ASAAS_API_KEY` para ativar a comunicação real. |
| **FinançasMed**           | Sincronização cadastral de pacientes do médico em tempo real.                   | `src/services/financasmed.ts`<br>`pocketbase/hooks/financasmed_pacientes_api.js`<br>`pocketbase/hooks/vmed_financasmed_pacientes_webhook.js`<br>`docs/INTEGRACAO_VMED_PACIENTES.md` | **Implementado e Homologado**. Endpoints `/api/hooks/vmed/pacientes` consumidos no cadastro e no agendamento com fallback seguro.                   | Necessita do secret `V_MED_API_KEY` configurado no backend caso a chave sofra rotação. O código já possui tolerância a falhas.                                               |
| **GestãoMed**             | Envio de dados financeiros de consultas concluídas para o ERP do médico.        | `src/services/appointments.ts`<br>`pocketbase/hooks/vmed_gestaomed_webhook.js`<br>`src/components/clinic/AppointmentBookingDialog.tsx`                                              | **Implementado e Homologado**. Disparo automático via webhook após atualização de status da consulta para `completed`.                              | Depende da presença do secret `V_MED_API_KEY` no ambiente para envio do header `X-API-Key`.                                                                                  |
| **PWA / TWA**             | Instalação mobile em Android/iOS e empacotamento para Google Play Store.        | `public/manifest.webmanifest`<br>`public/sw.js`<br>`public/offline.html`<br>`src/components/PwaInstallPrompt.tsx`<br>`docs/PWA_PLAYSTORE.md`                                        | **Arquitetura PWA Completa**. Manifest configurado, Service Worker em conformidade médica, banner de instalação customizado e atalhos operacionais. | **Publicação na Play Store pendente**. Requer conta Google Play Developer (taxa de US$ 25), geração do `.aab` via PWABuilder e publicação do `assetlinks.json`.              |
| **Skip AI / LLMs**        | Triagem inteligente no chat e geração de conteúdo médico no Social AI.          | `src/lib/skipAi.ts`<br>`pocketbase/hooks/chat_ai_triage.js`<br>`pocketbase/hooks/social_ai_generate.js`                                                                             | **Implementado nativamente**. Utiliza a infraestrutura de IA do Skip Cloud através das variáveis de ambiente já provisionadas.                      | Otimização dos prompts de especialidades e criação de catálogo de agentes médicos no Agents Hub.                                                                             |
| **Laboratórios Externos** | Importação de exames de redes parceiras mediante autorização do paciente.       | `pocketbase/hooks/external_labs_sync.js`<br>`src/pages/ProfessionalDashboard.tsx`                                                                                                   | **Parcial / Estruturado**. API de sincronização mockada pronta para plugar conectores HL7 / FHIR de laboratórios reais.                             | Conectar os conectores de rede específicos das grandes redes diagnósticas (Dasa, Fleury, Sabin, etc.).                                                                       |

---

## 6. Segurança, Governança e Conformidade Legal

### 6.1. Proteção de Dados de Saúde e Conformidade LGPD

1. **Classificação de Dados Sensíveis:** Conforme art. 5º, II da Lei nº 13.709/2018 (LGPD), todas as informações clínicas, anamneses, prescrições e laudos são tratadas sob a base legal de tutela da saúde (art. 11, II, "f") e dever de sigilo médico.
2. **Páginas Legais Públicas:**
   - `/termos-de-uso` (`TermsOfUse.tsx`): 14 seções detalhadas contemplando regras do CFM, limitação de responsabilidade, modelo de intermediação, cancelamentos e o **aviso mandatório de urgência médica** (orientando SAMU 192 e Bombeiros 193).
   - `/politica-de-privacidade` (`PrivacyPolicy.tsx`): 13 seções cobrindo direitos do titular (art. 18 LGPD), prazos de retenção de prontuários (20 anos conforme Lei Federal nº 13.787/2018 e Resolução CFM 1.821/2007) e conformidade com a Google Play Health Policy.
3. **Isolamento de Cache no PWA:**
   - O Service Worker (`public/sw.js`) possui regra expressa de bloqueio: requisições com destino a `/api/`, chamadas ao banco PocketBase, tokens de autorização e prontuários médicos **nunca são cacheados** no navegador ou disco local do dispositivo móvel.
4. **Controle de Acesso por Papéis (RBAC):**
   - Guardiões de rota no cliente (`AdminOutlet`, `CompanyOutlet`, `ProtectedOutlet`) e Access Rules nativas no PocketBase impedem que empresas visualizem dados de saúde de seus funcionários (as empresas recebem apenas extratos financeiros agregados) e garantem que apenas médicos homologados acessem dados clínicos de seus respectivos pacientes.

### 6.2. Pendências Conhecidas e Honestidade Técnica (O que deve ser ajustado antes do go-live)

- **Substituição de Dados Placeholder:**
  - Nas telas de Termos de Uso e Política de Privacidade, a razão social e o CNPJ estão como `VMX do Brasil Serviços em Saúde e Tecnologia Ltda. / 00.000.000/0001-00`. Devem ser substituídos pela razão social e CNPJ oficiais da empresa operadora.
  - Os e-mails de DPO e suporte (`dpo@vmedbrasil.com`, `contato@vmedbrasil.com`) devem ter caixas postais ativas configuradas no domínio corporativo.
  - Realizar validação formal por assessoria jurídica especializada em Direito Médico e Digital.
- **Remoção de Credenciais de Teste na Tela de Login:**
  - O arquivo `src/pages/Login.tsx` exibe atualmente em seu rodapé uma dica de teste com credenciais fixas (`valterpmendonca@gmail.com` / `Skip@Pass`). Esse bloco de texto e qualquer credencial hardcoded devem ser removidos para o lançamento público de produção.
- **Cadastro de Credenciais Reais do Asaas:**
  - Cadastrar a chave de produção no painel `/admin/asaas` e homologar a URL de webhook para recepção de notificações bancárias.

---

## 7. Roadmap Técnico e Pendências para Conclusão

Para orientar a fábrica de software ou time técnico parceiro (Adapta One), listam-se as prioridades de evolução técnica:

### 7.1. Publicação nas Lojas de Aplicativos (Google Play & Apple App Store)

- **Status Atual:** PWA 100% pronto, auditável pelo Lighthouse e compatível com PWABuilder.
- **Ações Necessárias:**
  1. Criação/ativação da Conta de Desenvolvedor no Google Play Console (pagamento da taxa de US$ 25,00).
  2. Geração do pacote Android App Bundle (`.aab`) através do [PWABuilder.com](https://www.pwabuilder.com) apontando para o domínio HTTPS de produção (`https://www.vmedbrasil.com`).
  3. Hospedagem do arquivo `.well-known/assetlinks.json` na raiz pública para validação de posse do domínio (TWA sem barra de endereço).
  4. Preenchimento do questionário de _Data Safety_ e _Health Content and Services_ na Play Console conforme instruções presentes em `docs/PWA_PLAYSTORE.md`.

### 7.2. Melhorias no Motor de Gamificação e Fidelidade

- **Status Atual:** Pontuação baseada em cashback (`on_cashback_credit.js`), indicação de amigos (`on_user_referral_code.js`), cadastro de dependentes (`loyalty_points_dependent.js`) e metas de saúde cumpridas (`on_goal_completed.js`).
- **Pendências de Negócio:**
  1. **Catálogo de Resgate:** Interface visual para o paciente trocar pontos diretamente por cupons em farmácias, consultas gratuitas ou descontos em procedimentos estéticos (atualmente o resgate ocorre via dedução direta no saldo).
  2. **Badges e Conquistas:** Implementar medalhas visuais de engajamento clínico (ex.: "Check-up em Dia", "3 Metas Concluídas", "Paciente Preventivo").
  3. **Ranking e Níveis (Tiers):** Categorização de membros em níveis de benefícios (ex.: Prata, Ouro, Diamante) com percentuais progressivos de cashback.

### 7.3. Módulos com Implementação Parcial no Código

1. **Conectores HL7/FHIR de Laboratórios:** A tela e os endpoints de sincronização externa existem em `src/pages/ProfessionalDashboard.tsx` e `pocketbase/hooks/external_labs_sync.js`, mas os dados atuais são mockados para demonstração do fluxo. É necessário plugar as APIs reais de laudos das redes parceiras.
2. **Gateway de Notificações WhatsApp:** A coleção `notification_templates` e `notification_logs` possui suporte a WhatsApp, porém o disparador atual no backend precisa ser conectado a um provedor oficial de WhatsApp Business API (ex: Z-API, Twilio ou Evolution API).
3. **Assinatura Digital ICP-Brasil:** As receitas emitidas possuem campos textuais completos de posologia; para validade jurídica estrita de medicamentos controlados (Portaria 344/98 SVS/MS), deve-se integrar um conector de certificado digital em nuvem (ex: BirdID / VIDaaS) para assinatura com certificado digital A1/A3 ICP-Brasil.

---

## 8. Guia para a Equipe de Engenharia Externa (Adapta One)

### 8.1. Estrutura do Código-Fonte

```
.
├── docs/                               # Documentação técnica e manuais de integração
│   ├── ANALISE_PROJETO_VMED.md         # Este documento técnico consolidado
│   ├── INTEGRACAO_VMED_PACIENTES.md    # Contrato técnico V MED <-> FinançasMed
│   └── PWA_PLAYSTORE.md                # Manual de publicação na Google Play Store
├── pocketbase/
│   ├── hooks/                          # Serverless pb_hooks (Goja JSVM / PocketBase)
│   └── migrations/                     # Migrações incrementais do banco de dados (0001 a 0112)
├── public/                             # Assets estáticos, manifest PWA e Service Worker
│   ├── manifest.webmanifest            # Manifesto PWA
│   ├── sw.js                           # Service Worker com isolamento de saúde
│   └── offline.html                    # Página de contingência sem conexão
├── src/
│   ├── components/                     # Componentes React reutilizáveis e Shadcn UI
│   ├── hooks/                          # Hooks customizados (useAuth, useRealtime, useToast)
│   ├── lib/                            # Clientes de API, utilitários e canvas PWA
│   ├── pages/                          # Telas organizadas por domínio de negócio
│   └── services/                       # Camada de comunicação com a API PocketBase e parceiros
```

### 8.2. Orientações para Desenvolvimento e Deploy

1. **Manipulação do Banco de Dados:** Nunca altere as coleções diretamente por ferramentas gráficas em produção. Qualquer alteração estrutural no banco de dados deve ser realizada através de novos arquivos de migração sequenciais em `pocketbase/migrations/` (a próxima migração disponível é a `0113_*.js`).
2. **Server-side Logic:** Novas rotas de backend ou gatilhos de dados devem ser adicionados na pasta `pocketbase/hooks/`, seguindo os padrões já adotados (`routerAdd`, `onRecordAfterCreateSuccess`, `onRecordAfterUpdateSuccess`).
3. **Variáveis de Ambiente / Secrets:** Chaves de API de terceiros (como Asaas, FinançasMed e provedores de IA) devem ser gerenciadas exclusivamente via variáveis de ambiente seguras (`$os.getenv`), nunca trafegando em arquivos `.env` ou embutidas no código do cliente React.

---

_Documento homologado para fins de transferência de conhecimento tecnológico e transição para a equipe Adapta One._
