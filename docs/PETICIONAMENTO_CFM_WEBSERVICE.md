# Pedido de Credenciamento no Webservice "Listagem de Médicos" do CFM

**Processo Administrativo via SEI-Medicina**  
**Normatização:** Resolução CFM nº 2.129/2015 e Resolução CFM nº 2.309/2022  
**Finalidade:** Verificação automatizada de regularidade de inscrição de profissionais médicos na plataforma V MED BRASIL  
**Status do Documento:** Rascunho oficial pronto para protocolo imediato no SEI-Medicina

---

## 1. Dados Cadastrais da Empresa Solicitante

> **Instrução para a Diretoria:** O CNPJ, Razão Social e dados do Representante Legal abaixo utilizam campos preenchíveis. Atualize com os dados definitivos antes de anexar ao SEI-Medicina.

| Campo                             | Dado Cadastral                                                           | Observações                              |
| :-------------------------------- | :----------------------------------------------------------------------- | :--------------------------------------- |
| **Razão Social**                  | `[PREENCHER: VMX do Brasil Serviços em Saúde e Tecnologia Ltda.]`        | Conforme Contrato Social                 |
| **Nome Fantasia**                 | V MED BRASIL                                                             | Marca comercial da plataforma            |
| **CNPJ**                          | `[PREENCHER: 00.000.000/0001-00]`                                        | Inscrição no Cadastro Nacional da PJ     |
| **Inscrição Estadual/Municipal**  | `[PREENCHER: ISENTO / 000.000-0]`                                        | Município sede                           |
| **Endereço Completo**             | `[PREENCHER: Logradouro, Número, Complemento, Bairro, CEP, Cidade - UF]` | Sede da operadora                        |
| **Telefone Institucional**        | `[PREENCHER: (11) 0000-0000]`                                            | Telefone de contato oficial              |
| **E-mail Institucional**          | `[PREENCHER: juridico@vmedbrasil.com / contato@vmedbrasil.com]`          | Para notificações do CFM                 |
| **Representante Legal**           | `[PREENCHER: Nome Completo do Sócio-Administrador]`                      | Constar expressamente no Contrato Social |
| **CPF do Representante Legal**    | `[PREENCHER: 000.000.000-00]`                                            | Titular do usuário externo no SEI        |
| **E-mail do Representante Legal** | `[PREENCHER: representante@vmedbrasil.com]`                              | Mesma conta cadastrada no SEI-Medicina   |
| **Diretor Médico / RT**           | Dr. Fauzer Andrigo Mendonça Simoes Rangel                                | Diretor Médico da V MED BRASIL           |
| **CRM do Diretor Médico**         | CRM-SP 185.341                                                           | Registro profissional ativo              |

---

## 2. Tipo de Webservice e Custo Anual

- **Tipo de Solicitante:** Empresa Privada.
- **Taxa de Acesso (Anual):** **R$ 948,00 (novecentos e quarenta e oito reais)** — taxa administrativa anual do CFM.
- **Forma de Pagamento:** Depósito bancário direto identificado em conta corrente indicada pelo CFM no processo SEI após a análise inicial (o CFM **não emite boleto** nem nota fiscal mercantil; emite recibo oficial dentro do próprio processo SEI).
- **Origem dos Recursos:** O pagamento deve ser realizado **obrigatoriamente a partir da conta corrente da própria Pessoa Jurídica solicitante** (constando o CNPJ e a Razão Social da empresa no comprovante de transferência).

---

## 3. Justificativa e Finalidade do Uso (Para inclusão no formulário SEI)

> **Texto para transcrição no formulário do SEI-Medicina:**

```text
À Presidência e Diretoria de Tecnologia da Informação do Conselho Federal de Medicina (CFM),

A empresa [RAZÃO SOCIAL DA EMPRESA], pessoa jurídica de direito privado inscrita no CNPJ sob o nº [CNPJ], mantenedora da plataforma tecnológica de saúde V MED BRASIL (www.vmedbrasil.com), sob a responsabilidade médica e técnica do Dr. Fauzer Andrigo Mendonça Simoes Rangel, vem, com fulcro na Resolução CFM nº 2.129/2015 e Resolução CFM nº 2.309/2022, requerer o credenciamento e concessão de acesso ao Web Service oficial "Listagem de Médicos" do CFM.

1. FINALIDADE ESTRITA:
A finalidade do acesso é estritamente institucional, regulatória e de segurança do paciente, consistindo na:
(a) Validação automatizada no momento do cadastramento de novos médicos que solicitam prestar telemedicina e atendimento clínico aos pacientes da plataforma;
(b) Verificação contínua e periódica da SITUAÇÃO DA INSCRIÇÃO (garantindo que somente médicos com registro ATIVO no respectivo Conselho Regional de Medicina possam atender, bloquear agendas e prescrever);
(c) Identificação de situações de suspensão, interdição cautelar, cassação ou cancelamento de CRM, determinando a suspensão preventiva imediata de privilégios de atendimento até eventual regularização;
(d) Validação do nome civil completo e especialidade médica registrada perante o CFM, prevenindo falsidade ideológica, exercício ilegal da medicina (art. 282 do CP) e assegurando a publicidade fidedigna exigida pelo Código de Ética Médica e pela Resolução CFM nº 2.314/2022 (Telemedicina).

2. CUMPRIMENTO DA LGPD E SIGILO:
A solicitante declara ciência de que o Webservice disponibiliza exclusivamente dados públicos de registro profissional (nome, CRM, UF, tipo de inscrição, situação cadastral e especialidade registrada). Em conformidade estrita com o art. 11 da Lei Federal nº 13.709/2018 (LGPD), a V MED BRASIL não solicita nem armazena quaisquer dados privados de médicos não fornecidos voluntariamente na relação de credenciamento. O acesso será realizado por conexão direta e segura (TLS 1.3), sendo vedada qualquer forma de cessão, sublicenciamento ou intermediação por terceiros.

Nestes termos, pede deferimento e a emissão das orientações de pagamento e chaves técnicas de integração.
```

---

## 4. Passo a Passo Operacional para Submissão

1. **Passo 1 — Cadastro de Usuário Externo no SEI-Medicina:**
   - URL: `https://sei.cfm.org.br/sei/controlador_externo.php?acao=usuario_externo_enviar_cadastro&acao_origem=usuario_externo_avisar_cadastro&id_orgao_acesso_externo=0`
   - O cadastro deve ser feito em nome do **Representante Legal** que consta no Contrato Social.
   - Enviar documento de identidade e Contrato Social para validação pelo cartório do CFM.
2. **Passo 2 — Abertura do Processo de Peticionamento:**
   - URL: `https://sistemas.cfm.org.br/listamedicos/informacoes/peticionamento`
   - Clicar em "Peticionamento" ➔ "Processo Novo".
   - Selecionar o tipo de Webservice: **Empresa Privada**.
   - Colar a justificativa e os dados cadastrais da Seção 3 deste documento.
   - Anexar: Contrato Social consolidado, Cartão CNPJ e cópia da Cédula de Identidade Médica do Diretor Médico.
3. **Passo 3 — Assinatura do Termo de Sigilo e Pagamento:**
   - Acompanhar diariamente o processo no SEI.
   - Assinar eletronicamente o Termo de Sigilo fornecido pelo CFM.
   - Efetuar a transferência bancária de **R$ 948,00** a partir da conta PJ da empresa e anexar o comprovante autenticado ao processo.
4. **Passo 4 — Recebimento das Credenciais do Web Service:**
   - O CFM enviará o manual de integração, as credenciais (usuário, senha/token) e o endpoint SOAP/REST para consulta diária ou consulta por CRM/UF.
   - Salvar as credenciais recebidas nos secrets da plataforma (`CFM_WS_USER`, `CFM_WS_KEY`, `CFM_WS_PASSWORD`).

---

## 5. Avaliação Técnica da API Pública do CFM (`siem-servicos-api.cfm.org.br`)

Durante a homologação técnica da V MED BRASIL, foi realizada inspeção na documentação OpenAPI (Swagger) do domínio `https://siem-servicos-api.cfm.org.br/swagger-ui/index.html` e nos endpoints `/api/medico/registro/crms` e `/api/medico/registro/{crm}/{uf}`:

### 5.1. Conclusão Técnica

1. **Natureza da API `siem-servicos-api`:**  
   Embora os esquemas OpenAPI e a interface Swagger estejam acessíveis publicamente para documentação, os endpoints de consulta a registros médicos e biometria possuem autenticação mandatória via protocolo OpenID Connect (`security: [{ "oidc": [] }]`), vinculados aos sistemas institucionais do CFM (SIA, DMD, PAE e e-CRMs).
2. **Restrição de Uso:**  
   A API `siem-servicos-api` não disponibiliza endpoint anônimo sem credenciamento e token emitido pela autoridade certificadora do CFM. Além disso, endpoints como `/api/medico/registro/{cpf}` e biometria tratam dados restritos.
3. **Diretriz de Engenharia V MED BRASIL:**
   - O canal oficial legalmente válido, normatizado e mantido para empresas de tecnologia é o **Webservice Listagem de Médicos (Resolução CFM 2.129/15 e 2.309/22)**;
   - Enquanto o processo administrativo SEI estiver em tramitação, a V MED BRASIL opera com a estratégia de **fallback em cascata**:
     1. **Consulta automatizada via API parceira de validação cadastral (ex: Infosimples / BigDataCorp)** configurada via secret `CFM_API_KEY` com caching local em `professional_verifications`;
     2. **Validação manual assistida pelo Diretor Médico e Admin** em `/admin/verification`, com upload e checagem de certidão de quitação do CRM;
     3. Em caso de indisponibilidade de qualquer serviço externo, o cadastro do profissional é salvo como `pendente_verificacao` com retry assíncrono programado, sem gerar erro 500 para o médico.

---

## 6. Checklist de Ativação Pós-Deferimento do CFM

- [ ] Inserir secret `CFM_WS_USER` no backend PocketBase via `set_env`;
- [ ] Inserir secret `CFM_WS_PASSWORD` ou token de segurança via `set_env`;
- [ ] Ativar flag de uso do Webservice direto no hook `crm_validation.js`;
- [ ] Executar teste automatizado com CRM teste homologado pelo CFM;
- [ ] Monitorar o primeiro ciclo do cron mensal de checagem em `audit_logs`.
