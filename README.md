# LUMIÉ - Beauty & Professionals (rodando tudo em localhost)

```
lumie/
├── backend/          # API (Node.js + Express + Sequelize + MySQL)
├── frontend/         # HTML, CSS e JS puro
├── diagramas_UML/
├── documentacao/
└── README.md
```

O backend também serve a pasta `frontend/`, então **um único comando sobe tudo**
em **http://localhost:3000** (não precisa de Live Server nem de segundo terminal).

## Pré-requisitos
- Node.js 18+
- MySQL rodando na sua máquina

## Passo a passo
1. Entre na pasta do backend e instale as dependências:
   ```
   cd backend
   npm install
   ```
2. Abra `backend/.env` e confira `DB_USER` e `DB_PASS` (usuário e senha do SEU MySQL).
3. Crie o banco vazio no MySQL (o nome deve bater com `DB_NAME`):
   ```sql
   CREATE DATABASE db_ecom;
   ```
4. Crie as tabelas e os dados de teste (dentro de `backend/`):
   ```
   npm run sync
   npm run seed
   ```
5. Suba o projeto:
   ```
   npm start        # ou: npm run dev (com nodemon)
   ```
6. Acesse **http://localhost:3000**

Login admin criado pelo seed:
- **E-mail:** admin@lumie.com
- **Senha:** admin123

## Observações
- Teste a API em http://localhost:3000/api. As rotas são as mesmas do original.
- Validação de CPF (frontend e backend) e consulta de CEP (ViaCEP) mantidas.
- Mapa (Leaflet), gráficos (Chart.js) e algumas imagens vêm de CDN/Unsplash: precisa de internet.
- `npm run sync` apaga e recria as tabelas (`force: true`).
