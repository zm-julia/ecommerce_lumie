const express = require('express')
const router = express.Router()

const produtoController = require('../controllers/produtoController')
const verificaToken = require('../middlewares/auth')
const isAdmin = require('../middlewares/isAdmin')
const uploadImagem = require('../middlewares/upload')


router.get('/produtos/buscar', produtoController.buscarPorNome)
router.get('/produtos', produtoController.listar)
router.get('/produtos/:id', produtoController.buscarPorId)


// Envio de imagem do produto (só ADMIN). Devolve o caminho que vai no campo imagem_url
router.post('/produtos/upload', verificaToken, isAdmin, uploadImagem, (req, res) => {
    return res.status(201).json({ imagem_url: `/uploads/${req.file.filename}` })
})

router.post('/produtos', verificaToken, isAdmin, produtoController.cadastrar)
router.put('/produtos/:id', verificaToken, isAdmin, produtoController.atualizar)
router.patch('/produtos/:id', verificaToken, isAdmin, produtoController.atualizarParcial)
router.delete('/produtos/:id', verificaToken, isAdmin, produtoController.apagar)

module.exports = router