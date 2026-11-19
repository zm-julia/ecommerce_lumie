require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')

const db = require('./db/conn')
require('./models/rel') // garante que os relacionamentos sejam carregados

const app = express()

// CORS mantido (permite também abrir o frontend por outro servidor, ex: Live Server)
app.use(cors())
app.use(express.json())

// Rotas da API
app.use(require('./routes/usuarioRoutes'))
app.use(require('./routes/categoriaRoutes'))
app.use(require('./routes/produtoRoutes'))
app.use(require('./routes/estoqueRoutes'))
app.use(require('./routes/pedidoRoutes'))
app.use(require('./routes/relatorioRoutes'))
app.use(require('./routes/cepRoutes'))
app.use(require('./routes/profissionalRoutes'))
app.use(require('./routes/servicoRoutes'))
app.use(require('./routes/agendamentoRoutes'))
app.use(require('./routes/avaliacaoRoutes'))

// Rota de teste rápido da API
app.get('/api', (req, res) => {
    res.json({ mensagem: 'API LUMIÉ Beauty & Professionals no ar!' })
})

// Frontend (pasta ../frontend) servido pelo próprio backend: tudo em http://localhost:3000
app.use(express.static(path.join(__dirname, '..', 'frontend')))

const PORT = process.env.PORT || 3000

db.authenticate()
    .then(() => {
        app.listen(PORT, () => {
            console.log('--------------------------------------------------')
            console.log(`Servidor rodando em http://localhost:${PORT}`)
            console.log('--------------------------------------------------')
        })
    })
    .catch((err) => {
        console.error('Não foi possível iniciar o servidor: erro de conexão com o banco.', err)
    })
