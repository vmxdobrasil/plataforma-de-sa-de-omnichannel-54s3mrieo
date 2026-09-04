# Documentação Oficial de Integração: V MED BRASIL ↔ FinançasMed (Pacientes)

Este documento descreve o contrato de integração de **Pacientes** entre a **V MED BRASIL** e o **FinançasMed** (app financeiro de médicos), bem como os fluxos e endpoints implementados na V MED BRASIL.

---

## 1. Contexto Geral

No **FinançasMed**, cada médico possui seus pacientes cadastrados de forma isolada (multi-tenant por médico). Com a presente integração:

1. **Listagem de Pacientes:** A V MED BRASIL lista os pacientes cadastrados para determinado médico no FinançasMed diretamente na tela de agendamento de consultas (`GET /backend/v1/financasmed/pacientes?medico_email=...`), preenchendo o autocomplete/seleção com badges indicando origem.
2. **Cadastro / Sincronização Automática:** Ao criar um agendamento na V MED BRASIL, os dados do paciente são enviados automaticamente para o FinançasMed (`POST https://financasmed.goskip.app/api/hooks/vmed/pacientes`), garantindo que o paciente exista no FinançasMed antes ou durante o ciclo da consulta.
3. **Cadastro Direto de Paciente:** Quando um paciente com role `patient` é cadastrado na V MED com vínculo a um médico (via `parent_id` ou `referred_by`), seus dados também são disparados para o FinançasMed do médico responsável.
4. **Origem:** Os pacientes cadastrados via V MED entram automaticamente com origem `"vmed"`, aparecendo na tela `/pacientes` do médico no FinançasMed.
5. **Landing Page:** Pacientes vindos da landing page pública do médico (`/agenda/:slug`) possuem origem `"landing"` e aparecem em ambos os sistemas.

---

## 2. Autenticação e Segurança

- **Header obrigatório:** `X-API-Key`
- **Segredo compartilhado:** `V_MED_API_KEY` (configurado como Secret no Skip Cloud / PocketBase, acessado via `$os.getenv('V_MED_API_KEY')`).
- **Importante:** A chave de API nunca é exposta no frontend. Todas as chamadas do cliente web passam pelo endpoint autenticado da V MED (`/backend/v1/financasmed/pacientes`), que repassa a requisição ao FinançasMed injetando o header `X-API-Key`.

---

## 3. Contrato de Integração FinançasMed

### 3.1. Listar Pacientes de um Médico

- **Método:** `GET`
- **URL externa:** `https://financasmed.goskip.app/api/hooks/vmed/pacientes`
- **Query param:** `medico_email` (obrigatório) — e-mail do médico no FinançasMed
- **Header:** `X-API-Key: <V_MED_API_KEY>`

**Exemplo de Resposta 200 OK:**

```json
{
  "total": 1,
  "medico_id": "dpj80f0mu2cbi17",
  "medico_email": "fauzermedicina@hotmail.com",
  "pacientes": [
    {
      "id": "rec123abc456",
      "name": "Maria Oliveira Souza",
      "cpf": "123.456.789-00",
      "birth_date": "1988-04-15",
      "phone": "(62) 98765-4321",
      "email": "maria@example.com",
      "convenio": "Unimed",
      "origin": "landing",
      "status": "ativo",
      "notes": "Primeira consulta de rotina",
      "created": "2025-08-15 14:00:00.000Z",
      "updated": "2025-08-15 14:00:00.000Z"
    }
  ]
}
```

### 3.2. Cadastrar / Atualizar Paciente via V MED BRASIL

- **Método:** `POST`
- **URL externa:** `https://financasmed.goskip.app/api/hooks/vmed/pacientes`
- **Headers:**
  - `Content-Type: application/json`
  - `X-API-Key: <V_MED_API_KEY>`

**Body:**

- **Campos obrigatórios:** `medico_email`, `name`, `phone`
- **Campos opcionais:** `email`, `cpf`, `birth_date` (formato YYYY-MM-DD), `convenio`, `notes`

```json
{
  "medico_email": "fauzermedicina@hotmail.com",
  "name": "Carlos Eduardo Lima",
  "phone": "(62) 99123-4567",
  "email": "carlos.lima@gmail.com",
  "cpf": "111.222.333-44",
  "birth_date": "1990-10-20",
  "convenio": "Bradesco Saúde",
  "notes": "Paciente encaminhado para checkup cardiológico"
}
```

**Resposta 201 Created:**

```json
{
  "id": "pat_987xyz",
  "message": "Paciente cadastrado com sucesso no FinançasMed",
  "patient": {
    "id": "pat_987xyz",
    "name": "Carlos Eduardo Lima",
    "phone": "(62) 99123-4567",
    "email": "carlos.lima@gmail.com",
    "convenio": "Bradesco Saúde",
    "origin": "vmed"
  }
}
```

### 3.3. Códigos de Retorno do FinançasMed

- `200 OK`: Lista retornada com sucesso.
- `201 Created`: Paciente cadastrado com sucesso.
- `400 Bad Request`: Parâmetros obrigatórios ausentes.
- `401 Unauthorized`: API key inválida ou ausente.
- `404 Not Found`: Médico não encontrado com o e-mail fornecido.
- `422 Unprocessable Entity`: Falha na validação dos dados enviados.
- `500 Internal Server Error`: Erro interno no servidor do FinançasMed.

---

## 4. O que foi implementado no lado V MED BRASIL

### 4.1. Backend (PocketBase pb_hooks)

1. **`pocketbase/hooks/financasmed_pacientes_api.js`**:
   - Rota autenticada `GET /backend/v1/financasmed/pacientes?medico_email=...` protegida com `$apis.requireAuth()`.
   - Se o usuário autenticado for um médico (`role === 'professional'`) e omitir o parâmetro `medico_email`, o hook utiliza automaticamente o seu e-mail de login.
   - Lê `V_MED_API_KEY` do ambiente via `$os.getenv('V_MED_API_KEY')` e repassa a requisição para `https://financasmed.goskip.app/api/hooks/vmed/pacientes`.
   - Log padronizado: `[FinançasMed] GET pacientes status ... | médico: ... | total: ...`.

2. **`pocketbase/hooks/vmed_financasmed_pacientes_webhook.js`**:
   - `onRecordAfterCreateSuccess('appointments')`:
     - Disparado sempre que um novo agendamento é salvo.
     - Expande `professional_id` para obter o `email` do médico.
     - Expande `patient_id` para obter nome, telefone, email, CPF (`document_id` / `tax_id`) e data de nascimento (`date_of_birth`).
     - Expande convênio caso exista `insurance_partner_id`.
     - Executa `POST https://financasmed.goskip.app/api/hooks/vmed/pacientes` com timeout de 10s.
     - Envolvido em `try/catch` com log `[FinançasMed] [appointment_create] ...`, **garantindo que qualquer instabilidade do FinançasMed nunca quebre o fluxo da V MED**.
   - `onRecordAfterCreateSuccess('users')`:
     - Disparado quando um usuário com `role === 'patient'` é cadastrado.
     - Identifica se há vínculo direto com médico via `parent_id` ou `referred_by`. Em caso afirmativo, envia imediatamente o POST para o FinançasMed do respectivo médico com log `[FinançasMed] [patient_create] ...`.

### 4.2. Frontend (React + TypeScript)

1. **`src/services/financasmed.ts`**:
   - Funções tipadas `getFinancasMedPacientes(medicoEmail)` e interfaces `FinancasMedPatient` e `FinancasMedListResponse`.
   - Usa o cliente PocketBase oficial (`pb.send('/backend/v1/financasmed/pacientes?medico_email=...')`).

2. **`src/components/clinic/AppointmentBookingDialog.tsx`**:
   - Ao selecionar o médico (ou quando aberto pelo médico logado via `defaultDoctorId`), consulta os pacientes no FinançasMed via e-mail do médico.
   - Exibe indicador em tempo real com Badge de status (ex: `X paciente(s) sincronizado(s) do FinançasMed`).
   - O campo de seleção de pacientes agrupa e destaca os pacientes do FinançasMed com tag visual `FinançasMed • origin`, permitindo tanto escolher pacientes da base V MED quanto importar/associar pacientes existentes no FinançasMed.
   - Ao confirmar o agendamento, o hook de backend envia o POST de sincronização automaticamente.

3. **Pontos de Acesso na UI**:
   - **`src/pages/ProfessionalDashboard.tsx`**: Botão "Novo Agendamento" no topo do dashboard clínico com abertura do dialog já associado ao médico logado.
   - **`src/pages/ProfessionalSchedule.tsx`**: Botão "Novo Agendamento" no gerenciamento de agenda.
   - **`src/pages/clinic/ClinicDashboard.tsx`**: Botão "Novo Agendamento" para a equipe da clínica.

### 4.3. Preservação de Navegação e Regras Críticas

- Todas as rotas de guardiões (`EntryPoint`, `AdminOutlet`, `CompanyOutlet`, `ProtectedOutlet`) e redirecionamentos admin foram preservadas integralmente sem qualquer alteração na lógica de rotas já corrigida nas versões 0.0.330/0.0.331.
- Chaves de integração mantidas exclusivamente no backend via variáveis de ambiente/secret.
