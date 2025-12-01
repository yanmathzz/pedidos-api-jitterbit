# 🚀 API de Gerenciamento de Pedidos - Teste Jitterbit

API RESTful desenvolvida em Node.js para o teste técnico da Jitterbit. Implementa operações CRUD completas para gerenciamento de pedidos com transformação de dados e banco de dados SQLite.

## ✨ Funcionalidades

### ✅ Obrigatórias (Requisitos Mínimos)
- **POST /order** - Criar novo pedido com transformação de dados
- **GET /order/:orderId** - Buscar pedido específico por ID

### ✅ Opcionais (Pontos Extras)
- **GET /order/list** - Listar todos os pedidos
- **PUT /order/:orderId** - Atualizar pedido existente  
- **DELETE /order/:orderId** - Deletar pedido
- **GET /health** - Verificar saúde da API

### ✅ Técnicas Implementadas
- ✅ Banco de dados SQLite persistente
- ✅ Transformação automática de dados (mapping)
- ✅ Validações robustas de entrada
- ✅ Tratamento completo de erros
- ✅ Código organizado e bem comentado
- ✅ Respostas HTTP adequadas para cada operação

## 🛠️ Tecnologias

| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| Node.js | 18+ | Runtime JavaScript |
| Express.js | 4.18.2 | Framework web |
| SQLite3 | 5.1.6 | Banco de dados relacional |
| Nodemon | 3.0.1 | Desenvolvimento (recarga automática) |

## 📡 Endpoints da API

| Método | Endpoint | Descrição | Status HTTP de Sucesso |
|--------|----------|-----------|------------------------|
| POST | `/order` | Criar novo pedido | 201 Created |
| GET | `/order/:orderId` | Buscar pedido por ID | 200 OK |
| GET | `/order/list` | Listar todos pedidos | 200 OK |
| PUT | `/order/:orderId` | Atualizar pedido | 200 OK |
| DELETE | `/order/:orderId` | Deletar pedido | 200 OK |
| GET | `/health` | Verificar saúde da API | 200 OK |

## 🚀 Instalação

### Pré-requisitos
- Node.js (versão 18 ou superior)
- NPM (vem com Node.js)
- Git (para clonar o repositório)

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/pedidos-api-jitterbit.git
cd pedidos-api-jitterbit
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute a API**
```bash
# Modo desenvolvimento (com recarga automática)
npm run dev

# Modo produção
npm start
```

4. **Verifique se está rodando**
```
✅ API DE GERENCIAMENTO DE PEDIDOS - JITTERBIT
📍 Servidor rodando em: http://localhost:3000
🗄️  Banco de dados: SQLite (pedidos.db)
```

## 📊 Como Usar

### Testes com cURL (Windows PowerShell)

#### 1. Criar Pedido
```powershell
curl -X POST http://localhost:3000/order `
  -H "Content-Type: application/json" `
  -d '{
    "numeroPedido": "v10089015vdb-01",
    "valorTotal": 10000,
    "dataCriacao": "2023-07-19T12:24:11.5299601+00:00",
    "items": [
      {
        "idItem": "2434",
        "quantidadeItem": 1,
        "valorItem": 1000
      }
    ]
  }'
```

#### 2. Buscar Pedido
```powershell
curl http://localhost:3000/order/v10089015vdb
```

#### 3. Listar Todos os Pedidos
```powershell
curl http://localhost:3000/order/list
```

#### 4. Atualizar Pedido
```powershell
curl -X PUT http://localhost:3000/order/v10089015vdb `
  -H "Content-Type: application/json" `
  -d '{
    "numeroPedido": "v10089015vdb-01",
    "valorTotal": 15000,
    "dataCriacao": "2023-07-19T12:24:11.5299601+00:00",
    "items": [
      {
        "idItem": "2434",
        "quantidadeItem": 2,
        "valorItem": 1000
      }
    ]
  }'
```

#### 5. Deletar Pedido
```powershell
curl -X DELETE http://localhost:3000/order/v10089015vdb
```

#### 6. Verificar Saúde
```powershell
curl http://localhost:3000/health
```

## 🔧 Transformação de Dados (Mapping)

A API realiza automaticamente a transformação dos dados conforme especificado no teste:

### 📥 Entrada (JSON Recebido)
```json
{
  "numeroPedido": "v10089015vdb-01",
  "valorTotal": 10000,
  "dataCriacao": "2023-07-19T12:24:11.5299601+00:00",
  "items": [
    {
      "idItem": "2434",
      "quantidadeItem": 1,
      "valorItem": 1000
    }
  ]
}
```

### 📤 Saída (Armazenada no Banco)
```json
{
  "orderId": "v10089015vdb",
  "value": 10000,
  "creationDate": "2023-07-19T12:24:11.529Z",
  "items": [
    {
      "productId": 2434,
      "quantity": 1,
      "price": 1000
    }
  ]
}
```

### 🔄 Regras de Transformação
| Campo Original | Campo Transformado | Regra |
|----------------|--------------------|-------|
| `numeroPedido` | `orderId` | Remove sufixo após "-" (ex: "-01") |
| `valorTotal` | `value` | Mantém mesmo valor numérico |
| `dataCriacao` | `creationDate` | Converte para formato ISO 8601 |
| `idItem` | `productId` | Converte string para número inteiro |
| `quantidadeItem` | `quantity` | Mantém mesmo valor numérico |
| `valorItem` | `price` | Mantém mesmo valor numérico |

## 🗄️ Estrutura do Banco de Dados

### Tabela `orders`
| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| id | INTEGER | ✅ | Chave primária autoincrementada |
| orderId | TEXT | ✅ | ID único do pedido (UNIQUE) |
| value | REAL | ✅ | Valor total do pedido |
| creationDate | TEXT | ✅ | Data de criação (formato ISO) |
| createdAt | TIMESTAMP | - | Data de registro no banco |

### Tabela `items`
| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| id | INTEGER | ✅ | Chave primária autoincrementada |
| orderId | TEXT | ✅ | Chave estrangeira para `orders` |
| productId | INTEGER | ✅ | ID do produto |
| quantity | INTEGER | ✅ | Quantidade do item |
| price | REAL | ✅ | Preço unitário do item |

### Relacionamento
```
orders (1) ─────── (n) items
  orderId ──────→ orderId (FOREIGN KEY)
```

## 📋 Critérios do Teste Atendidos

### ✅ Funcionalidade Completa
- [x] POST /order - Criar pedido (obrigatório)
- [x] GET /order/:orderId - Buscar pedido (obrigatório)
- [x] GET /order/list - Listar todos (opcional)
- [x] PUT /order/:orderId - Atualizar pedido (opcional)
- [x] DELETE /order/:orderId - Deletar pedido (opcional)

### ✅ Código e Organização
- [x] Código bem organizado e comentado
- [x] Convenções de nomenclatura adequadas (camelCase)
- [x] Estrutura modular e limpa

### ✅ Tratamento de Erros
- [x] Mensagens de erro compreensíveis
- [x] Validação de dados de entrada
- [x] Tratamento de exceções robusto

### ✅ Respostas HTTP
- [x] 200 OK - Operação bem sucedida
- [x] 201 Created - Recurso criado
- [x] 400 Bad Request - Dados inválidos
- [x] 404 Not Found - Recurso não existe
- [x] 409 Conflict - Recurso duplicado
- [x] 500 Internal Server Error - Erro interno

### ✅ Banco de Dados
- [x] SQLite como banco de dados
- [x] Estrutura de tabelas conforme especificado
- [x] Persistência de dados entre execuções

### ✅ GitHub
- [x] Repositório público no GitHub
- [x] Commits organizados com mensagens claras
- [x] README.md completo

## 🐛 Tratamento de Erros

A API retorna códigos HTTP específicos para diferentes situações:

| HTTP Status | Situação | Exemplo de Mensagem |
|-------------|----------|---------------------|
| 200 | Sucesso na operação | `{ "success": true, "data": {...} }` |
| 201 | Pedido criado | `{ "success": true, "message": "Pedido criado" }` |
| 400 | Dados inválidos | `{ "error": "Campos obrigatórios ausentes" }` |
| 404 | Pedido não encontrado | `{ "error": "Pedido XYZ não encontrado" }` |
| 409 | Pedido já existe | `{ "error": "Pedido XYZ já existe" }` |
| 500 | Erro interno | `{ "error": "Erro interno do servidor" }` |

### Exemplos de Validação:
- ✅ Campo `numeroPedido` obrigatório
- ✅ Campo `valorTotal` deve ser número positivo
- ✅ Campo `items` deve ser array não vazio
- ✅ `idItem` deve ser conversível para número
- ✅ Datas devem estar em formato válido

## 📁 Estrutura do Projeto

```
pedidos-api-jitterbit/
│
├── src/
│   └── app.js                 # Código principal da API (560 linhas)
│
├── pedidos.db                 # Banco de dados SQLite (gerado automaticamente)
│
├── package.json               # Dependências e configurações do projeto
├── package-lock.json          # Versões exatas das dependências
├── README.md                  # Esta documentação
└── .gitignore                 # Arquivos ignorados pelo Git
```

### Arquivo `src/app.js` - Principais Seções:
1. **Configuração inicial** (Express, SQLite, Middlewares)
2. **Inicialização do banco** (criação de tabelas)
3. **Função de transformação** (`transformarDados()`)
4. **Endpoints da API** (5 endpoints principais)
5. **Health check** (verificação de saúde)
6. **Tratamento de erros** (middleware global)
7. **Inicialização do servidor**

## 🧪 Testes Realizados

### Casos de Teste Verificados:
1. ✅ Criar pedido com dados válidos
2. ✅ Tentar criar pedido duplicado (deve falhar com 409)
3. ✅ Buscar pedido existente
4. ✅ Buscar pedido não existente (deve retornar 404)
5. ✅ Listar pedidos (com e sem dados)
6. ✅ Atualizar pedido existente
7. ✅ Atualizar pedido não existente (deve falhar)
8. ✅ Deletar pedido existente
9. ✅ Deletar pedido não existente (deve falhar)
10. ✅ Validação de dados incompletos
11. ✅ Validação de tipos de dados incorretos

## 🔄 Fluxo de Dados

```
1. Cliente envia requisição
   ↓
2. API valida dados de entrada
   ↓
3. Transformação (mapping) dos campos
   ↓
4. Persistência no banco SQLite
   ↓
5. Resposta formatada para cliente
   ↓
6. Logs no console para debugging
```

## 👨‍💻 Autor

**Yan Matheus Pinheiro**  
🎯 Candidato à vaga de Professional Services na Jitterbit  
📧 Email: ymatheus706@gmail.com  
🔗 LinkedIn: [linkedin.com/in/yan-matheus-361b6b235](www.linkedin.com/in/yan-matheus-361b6b235)  
🐙 GitHub: [github.com/yanmathzz](https://github.com/yanmathzz)

## 📄 Sobre este Projeto

Este projeto foi desenvolvido especificamente para o **Teste Teórico de Professional Services da Jitterbit**, com o objetivo de demonstrar habilidades em:

- Desenvolvimento de APIs RESTful com Node.js
- Trabalho com bancos de dados (SQLite/SQL)
- Transformação e manipulação de dados
- Boas práticas de código e documentação
- Tratamento de erros e validações
- Versionamento com Git/GitHub

**Data de Desenvolvimento:** [Data Atual]  
**Tempo de Desenvolvimento:** [X horas]  
**Status:** ✅ Completo e pronto para avaliação

## 🤝 Contribuição

Este é um projeto de teste técnico, mas sugestões são bem-vindas! Para contribuir:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto foi desenvolvido para fins de avaliação técnica. Distribuído sob licença MIT. Veja o arquivo `LICENSE` para mais informações.

