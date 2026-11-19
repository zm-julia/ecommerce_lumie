const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

// As imagens ficam em frontend/uploads (o backend já serve a pasta frontend inteira)
const pastaUploads = path.join(__dirname, '..', '..', 'frontend', 'uploads')
fs.mkdirSync(pastaUploads, { recursive: true })

const extensoes = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif'
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, pastaUploads),
    filename: (req, file, cb) => {
        const nome = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extensoes[file.mimetype]}`
        cb(null, nome)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (extensoes[file.mimetype]) {
            cb(null, true)
        } else {
            cb(new Error('FORMATO_INVALIDO'))
        }
    }
})

function uploadImagem(req, res, next) {
    upload.single('imagem')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ erro: 'A imagem deve ter no máximo 5 MB.' })
            }
            if (err.message === 'FORMATO_INVALIDO') {
                return res.status(400).json({ erro: 'Formato inválido. Use JPG, PNG, WEBP ou GIF.' })
            }
            console.error(err)
            return res.status(500).json({ erro: 'Erro ao enviar a imagem.' })
        }

        if (!req.file) {
            return res.status(400).json({ erro: 'Nenhuma imagem foi enviada.' })
        }

        next()
    })
}

module.exports = uploadImagem