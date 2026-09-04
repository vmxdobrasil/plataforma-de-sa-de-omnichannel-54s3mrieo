# Guia de Publicação: V MED BRASIL na Google Play Store via PWABuilder / TWA

Este guia documenta o passo a passo completo para empacotar o Progressive Web App (PWA) do **V MED BRASIL** em formato Android App Bundle (`.aab`) usando o **PWABuilder** (Trusted Web Activity - TWA) e publicá-lo na **Google Play Store**.

---

## 1. Pré-requisitos Técnicos

1. **URL de Produção HTTPS Ativa**:
   - `https://www.vmedbrasil.com` (ou domínio configurado).
   - O PWA requer conexão segura SSL/TLS com certificado válido.
2. **Web App Manifest Completo**:
   - Localizado em `public/manifest.webmanifest`.
   - Contém:
     - `name`: "V MED BRASIL"
     - `short_name`: "V MED"
     - `start_url`: "/"
     - `display`: "standalone"
     - `theme_color`: "#14805A"
     - `background_color`: "#0B5239"
     - Ícones PNG em 192x192, 512x512, com propriedades `any` e `maskable`.
     - Atalhos rápidos com ícones (Agendar Consulta, SOS Emergência, Guia Saúde).
3. **Service Worker com Suporte Offline**:
   - Arquivo `public/sw.js` com página de contingência `public/offline.html`.
   - **Nota de Compliance Médico**: Nenhuma chamada para a API PocketBase (`/api/`) ou dados confidenciais de saúde é mantida em cache no dispositivo.

---

## 2. Conta de Desenvolvedor Google Play

1. Acesse o [Google Play Console](https://play.google.com/console/signup).
2. Faça login com a conta institucional da empresa ou e-mail de desenvolvimento.
3. Efetue o pagamento da taxa única de inscrição de **US$ 25,00**.
4. Conclua a verificação de identidade e preenchimento dos dados da organização (CNPJ, D-U-N-S se exigido para contas corporativas).

---

## 3. Geração do Pacote Android (AAB) via PWABuilder

1. Acesse **[PWABuilder.com](https://www.pwabuilder.com)**.
2. Insira a URL pública da aplicação: `https://www.vmedbrasil.com` e clique em **Start**.
3. O PWABuilder analisará o Manifest, o Service Worker e a pontuação PWA (deve atingir status verde/aprovado).
4. Clique em **Package For Stores** e selecione a opção **Google Play**.
5. No modal de configuração Android:
   - **Package ID / Application ID**: `com.vmedbrasil.app`
   - **App Name**: `V MED BRASIL`
   - **Launcher Name**: `V MED`
   - **App Version Name**: `1.0.0`
   - **App Version Code**: `1` (incremente a cada atualização de binário)
   - **Theme Color**: `#14805A`
   - **Nav Bar Color**: `#0B5239`
   - **Display Mode**: `Standalone`
   - **Signing Key**:
     - Marque **"Mine"** se já possui uma keystore, ou selecione **"Generate a new key"** pelo PWABuilder (baixe e guarde o arquivo `.keystore` e as senhas em cofre seguro!).
6. Clique em **Generate Package** e faça o download do arquivo compactado `.zip`.
7. Extraia o pacote gerado. O arquivo principal pronto para upload na Play Store é o `app-release.aab` (Android App Bundle).

---

## 4. Configuração do Digital Asset Links (Obrigatório para remover barra do navegador)

Para que a TWA execute em tela cheia sem a barra de endereço da web, o Google Play exige a comprovação de propriedade do domínio via arquivo `assetlinks.json`:

1. No pacote gerado pelo PWABuilder, localize o arquivo `assetlinks.json`.
2. O conteúdo segue a estrutura:
   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.vmedbrasil.app",
         "sha256_cert_fingerprints": ["SUA_CHAVE_FINGERPRINT_SHA256_AQUI"]
       }
     }
   ]
   ```
3. Coloque esse arquivo na raiz pública do servidor sob a rota:
   - `https://www.vmedbrasil.com/.well-known/assetlinks.json`
4. Garanta que o servidor responda com `Content-Type: application/json` e HTTP 200.

---

## 5. Declarações Obrigatórias de Privacidade e Saúde na Play Console

Como o **V MED BRASIL** gerencia telemedicina, agendamentos clínicos e receitas digitais, o Google Play impõe regras estritas de segurança de dados (Health Apps Policy):

### 5.1. Seção "Segurança dos Dados" (Data Safety)

Na Play Console, navegue até **Conteúdo do app > Segurança dos dados**:

- **O app coleta ou compartilha dados de usuários?** Sim.
- **Tipos de dados coletados**:
  - _Informações pessoais_: Nome, e-mail, telefone, CPF/documento de identificação, endereço.
  - _Saúde e condicionamento físico_: Informações clínicas, histórico de consultas, prescrições e registros de exames.
  - _Informações financeiras_: Dados de transações e saldo de benefícios corporativos (processados pelo Asaas).
- **Finalidade do tratamento**:
  - Funcionalidade do app (agendamento de consultas médicas, emissão de prescrição digital, prontuário eletrônico).
  - Gestão de contas e comunicação com profissionais de saúde.
  - Prevenção a fraudes e segurança dos pacientes.
- **Criptografia em trânsito**: Marque **Sim** (todos os dados trafegam exclusivamente via HTTPS com TLS 1.3).
- **Exclusão de conta e dados**:
  - O app permite que o paciente solicite a exclusão de sua conta e histórico em `Configurações > Minha Conta > Solicitar Exclusão`, em conformidade com a LGPD e regulamentações do CFM.

### 5.2. Política de Aplicativos de Saúde (Health Content and Services)

- Declare que o V MED BRASIL atua na categoria **Serviços de Saúde e Telessaúde**.
- Forneça os dados do Diretor Técnico Médico e registro profissional perante o Conselho Regional de Medicina (CRM).
- Termos de Uso e Política de Privacidade devem estar disponíveis na URL:
  - `https://www.vmedbrasil.com/privacy`

### 5.3. Política de Privacidade

- Preencha o link direto e público para a Política de Privacidade (deve ser legível em navegador sem exigir login prévio).

---

## 6. Criação da Versão de Produção e Lançamento

1. Na Google Play Console, acesse **Produção > Criar nova versão**.
2. Faça o upload do arquivo `app-release.aab`.
3. Preencha as **Notas de versão** (exemplo: _"Versão inicial do aplicativo V MED BRASIL — Consultas, telemedicina e gestão integrada de saúde."_).
4. Revise os alertas de conformidade.
5. Inicie o lançamento para produção ou para faixa de teste fechado (recomendado criar 1 faixa de teste interno primeiro).
6. Aguarde a análise da equipe do Google Play (normalmente de 2 a 5 dias úteis).

---

_Documento mantido pela equipe de engenharia V MED BRASIL._
