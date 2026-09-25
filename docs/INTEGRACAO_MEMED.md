# Integração Memed — Prescrição Digital (Pesquisa, Onboarding & Guia de Deploy)

Este documento descreve a arquitetura, o onboarding guiado em 3 passos para os médicos afiliados da **V MED BRASIL** e as **instruções de deploy e configuração de secrets** para a integração da **Memed (Prescrição Digital)**.

---

## 1. Visão Geral da Integração

- **Plataforma:** Memed (Prescrição Digital Inteligente)
- **Escopo no V MED BRASIL:**
  - Painel do Profissional (`src/pages/ProfessionalDashboard.tsx`) com aba dedicada "Prescrição Memed".
  - Onboarding guiado em 3 passos:
    1. **Conectar Conta:** Fluxo OAuth 2.0 padrão da Memed para médicos credenciados.
    2. **Habilitar Certificado Digital:** Orientação completa para emissão gratuita via **AR-CFM** (portal do CFM) ou provedores de nuvem (VIDaaS-Valid, BirdID-Soluti, SafeID-Safeweb).
    3. **Teste de Assinatura Sandbox:** Validação do ambiente de testes da Memed e conferência de CRM/UF.
- **Segurança da Casa:**
  - **Zero tokens no cliente:** `access_token` e `refresh_token` são salvos de forma oculta (`hidden: true`) na coleção `memed_integrations` e manipulados exclusivamente por hooks Goja server-side no PocketBase (`pocketbase/hooks/memed_oauth.js`).
  - **Isolamento de Erro:** Falhas da API externa da Memed **nunca** quebram a sessão ou os fluxos de consulta da V MED BRASIL.
  - **Auditoria CFM/LGPD:** Eventos de conexão, renovação silenciosa de token, desconexão e teste sandbox são registrados na coleção `audit_logs`.

---

## 2. Onboarding Guiado em 3 Passos (Experiência do Médico)

### Passo 1: Conectar Conta (Fluxo OAuth 2.0)

- O médico clica em **Conectar Memed** no Painel do Profissional.
- O backend gera a URL oficial de autorização da Memed via endpoint seguro `GET /backend/v1/memed/oauth/authorize-url`, protegida com parâmetro `state` anti-CSRF gerado dinamicamente a partir do ID do médico e timestamp.
- Quando o médico autoriza na Memed, o callback é recebido em `POST /backend/v1/memed/oauth/callback`, que troca o `code` pelos tokens e armazena com segurança na coleção `memed_integrations`.
- **Restrição Real (Credenciais Pendentes):** Caso os secrets `MEMED_CLIENT_ID` e `MEMED_CLIENT_SECRET` ainda não tenham sido configurados pelo administrador, o conector exibe um aviso claro e amigável orientando que o credenciamento de parceria está em andamento, permitindo que o médico avance para os passos de certificado e teste simulado sem bloqueio.

### Passo 2: Habilitar Certificado de Assinatura ICP-Brasil

- Todo médico afiliado precisa de certificado digital ICP-Brasil para assinar receituários de controle especial e antimicrobianos com validade sanitária nacional (Leis nº 14.063/2020 e RDC Anvisa nº 1.000/2025).
- **Certificado Gratuito do CFM (AR-CFM):**
  - O CFM disponibiliza gratuitamente o certificado digital em nuvem para todos os médicos com inscrição ativa.
  - Links disponibilizados no card:
    - Solicitação: `https://prescricaoeletronica.cfm.org.br/`
    - Portal de Prescrição CFM: `https://prescricao.cfm.org.br/`
- **Provedores de Nuvem Suportados:** VIDaaS (Valid), BirdID (Soluti), SafeID (Safeweb) e tokens físicos A1/A3 (Certisign/Serasa).
- Botão "Já possuo certificado habilitado / Avançar para o Teste" salva o progresso e transita para o Passo 3.

### Passo 3: Teste de Assinatura em Ambiente Sandbox

- Botão "Executar Teste no Sandbox" dispara chamada ao endpoint seguro `POST /backend/v1/memed/test-sandbox`.
- **Sem credenciais de parceiro:** Executa um _dry-run_ simulando a validação estrutural do CRM/UF do médico e os cabeçalhos esperados pela Memed, salvando log de auditoria informativa.
- **Com credenciais ativas:** Comunica diretamente com a API Sandbox da Memed (`https://sandbox.api.memed.com.br/v1/sinapse-prescricao/v1/profissionais/status`) usando o token obtido no Passo 1, confirmando a aptidão para emissão real.

---

## 3. Endpoints Server-Side Implementados (`pocketbase/hooks/memed_oauth.js`)

| Método | Endpoint                                     | Descrição                                                                                                                                               |
| ------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/backend/v1/memed/status`                   | Retorna o status atual do médico (`desconectado`, `conectando`, `conectado`, `erro`) e se os segredos de parceiro estão configurados, sem vazar tokens. |
| `GET`  | `/backend/v1/memed/oauth/authorize-url`      | Gera a URL de autorização da Memed com `state` anti-CSRF e URL de redirect oficial.                                                                     |
| `POST` | `/backend/v1/memed/oauth/callback`           | Troca o `code` recebido no redirect por `access_token` e `refresh_token` (chamada server-to-server).                                                    |
| `POST` | `/backend/v1/memed/token/refresh`            | Executa a renovação silenciosa do token usando o `refresh_token` salvo, atualizando `last_sync` sem deslogar o médico.                                  |
| `POST` | `/backend/v1/memed/test-sandbox`             | Valida dados do médico e conectividade de assinatura no ambiente sandbox da Memed.                                                                      |
| `POST` | `/backend/v1/memed/disconnect`               | Desconecta a conta, limpa tokens com segurança e registra em `audit_logs`.                                                                              |
| `GET`  | `/backend/v1/memed/prescriber-session`       | Inicializa a sessão do prescritor com dados do paciente pré-preenchidos (nome, CPF, nascimento) e tokens do SDK web.                                    |
| `POST` | `/backend/v1/memed/prescription/save-signed` | Captura retorno da prescrição assinada (memed_prescription_id, URL de validação, controlados, rascunhos) persistindo em `prescriptions`.                |
| `POST` | `/backend/v1/memed/webhook`                  | Endpoint webhook para recepção de notificações de prescrição emitida pela Memed.                                                                        |

---

## 4. Arquitetura da Prescrição Embutida no Fluxo de Atendimento (EHR / V MED)

1. **Sem saída da plataforma:**
   - O médico acessa a aba **Receitas** dentro do prontuário do paciente (`ProfessionalDashboard.tsx`).
   - O componente `EmbeddedMemedPrescription.tsx` inicializa a sessão via `GET /backend/v1/memed/prescriber-session?patient_id=...`.
2. **Pré-preenchimento Automático:**
   - Nome completo, CPF, data de nascimento, sexo e endereço são lidos diretamente do cadastro do paciente na coleção `users` e enviados para o comando `setPaciente` da Memed, dispensando qualquer redigitação pelo médico.
3. **Apoio à Decisão Clínica & Interações Medicamentosas:**
   - O comando `setFeatureToggle` ativa o motor de alertas (`enableAlerts: true`). O sistema escuta o evento `medicamentoAdicionado` e exibe alertas visuais de risco (ex: interações graves, contraindicações).
4. **Controlados & RDC Anvisa nº 1.000/2025 (SNCR):**
   - Suporte total aos receituários Azul (Notificação B1/B2) e Amarelo (Notificação A1/A2/A3), além de Antimicrobianos, Simples, Exames e Atestados estruturados, com numeração serial SNCR automática.
5. **Captura do Documento Assinado:**
   - No evento `prescricaoImpressa`, o payload com `prescriptionUuid`, link de validação pública e medicamentos estruturados é interceptado e gravado em `prescriptions` com `status="assinada"`.
6. **Resiliência e Continuidade (Regra Crítica da Casa):**
   - Toda chamada externa à Memed é protegida em blocos `try/catch`. Caso os servidores da Memed oscilem ou as credenciais de produção ainda não estejam cadastradas, o sistema oferece salvamento imediato de **Rascunho Local** (`status="rascunho"`), permitindo que o atendimento nunca seja interrompido.

---

## 5. Instruções de Deploy: Como Cadastrar os Secrets da Memed

Quando a equipe de Parcerias da Memed responder ao e-mail de credenciamento e liberar o acesso ao **Med.Studio**, cadastre os seguintes segredos no ambiente backend Skip Cloud:

### Variáveis / Secrets Necessários:

1. **`MEMED_CLIENT_ID`**
   - Identificador público do cliente OAuth fornecido pela Memed no Med.Studio.
   - Exemplo: `vmed_prod_cli_98a72b1`

2. **`MEMED_CLIENT_SECRET`**
   - Segredo privado de parceiro fornecido pela Memed para a troca de tokens server-to-server.
   - Exemplo: `sec_4f9a0c1e8d7211...`

3. **`MEMED_PARTNER_KEY`** (ou `MEMED_API_KEY`)
   - Chave de API de parceiro para chamadas diretas aos serviços de sinapse/catálogo da Memed.

4. **`MEMED_ENVIRONMENT`**
   - Define o ambiente de operação.
   - Valores aceitos: `sandbox` (padrão) ou `production`.

### URL de Redirecionamento (Redirect URI) a Informar à Memed:

Ao cadastrar a aplicação parceira no portal **Med.Studio** da Memed, informe a seguinte URL de callback:

```text
https://plataforma-de-saude-omnichannel-2585c.shrd00.internal.goskip.dev/professional/dashboard?tab=memed&action=oauth-callback
```

_(Em produção com domínio customizado, substituir pela URL correspondente, ex: `https://www.vmedbrasil.com/professional/dashboard?tab=memed&action=oauth-callback`)_.

---

## 5. Como Validar o Fluxo no Sandbox Após Receber as Credenciais

1. **Cadastrar os Secrets:**
   - Adicione `MEMED_CLIENT_ID`, `MEMED_CLIENT_SECRET`, `MEMED_PARTNER_KEY` e defina `MEMED_ENVIRONMENT=sandbox`.
2. **Acessar o Painel do Profissional:**
   - Faça login com um perfil médico (ex: `valterpmendonca@gmail.com` ou qualquer médico ativo).
   - Abra a aba **Prescrição Memed**.
3. **Verificar o Card de Conexão:**
   - O alerta de "Credenciais pendentes" desaparecerá automaticamente.
   - Clique no botão **Conectar Memed**.
   - Você será redirecionado para a tela oficial de login/autorização da Memed em ambiente Sandbox (`https://sandbox.auth.memed.com.br`).
4. **Autorizar a Conexão:**
   - Informe as credenciais do médico de teste no sandbox da Memed.
   - Ao autorizar, você retornará para o Painel do Profissional com a mensagem de sucesso: `"Conta Memed conectada com sucesso!"`.
   - O badge passará imediatamente para **Conectado** (verde).
5. **Executar o Teste do Passo 3:**
   - Clique em **Executar Teste no Sandbox**.
   - O backend chamará `https://sandbox.api.memed.com.br/v1/sinapse-prescricao/v1/profissionais/status` usando o Bearer Token recém-obtido.
   - O resultado será exibido com confirmação técnica de sucesso e registrado em `audit_logs`.
6. **Validar Resiliência e Desconexão:**
   - Em caso de token expirado, o conector oferece **Reconectar com 1 Clique** (dispara refresh silencioso).
   - O diálogo de desconectar limpa os tokens com segurança mantendo válidas as receitas anteriores.
