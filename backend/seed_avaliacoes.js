// Cria AVALIAÇÕES FICTÍCIAS (dados de demonstração) para as profissionais.
//
// Como usar (dentro da pasta backend, com o banco já criado e o seed.js já rodado):
//     node seed_avaliacoes.js
//
// Não apaga nada do banco. Se já foi executado antes, ele avisa e não duplica.
const bcrypt = require('bcrypt')
const conn = require('./db/conn')
const { Usuario, Profissional, Servico, Agendamento, Avaliacao } = require('./models/rel')

// Clientes fictícios (CPFs gerados só para teste, válidos matematicamente)
const clientes = [
    { nome: 'Ana Paula Souza',     email: 'ana.souza@exemplo.com',      cpf: '12345678909', telefone: '(48) 99111-0001' },
    { nome: 'Fernanda Oliveira',   email: 'fernanda.oliveira@exemplo.com', cpf: '23456789173', telefone: '(48) 99111-0002' },
    { nome: 'Mariana Costa',       email: 'mariana.costa@exemplo.com',  cpf: '34567891228', telefone: '(48) 99111-0003' },
    { nome: 'Patrícia Almeida',    email: 'patricia.almeida@exemplo.com', cpf: '45678912364', telefone: '(48) 99111-0004' },
    { nome: 'Larissa Martins',     email: 'larissa.martins@exemplo.com', cpf: '56789123482', telefone: '(48) 99111-0005' },
    { nome: 'Bruna Teixeira',      email: 'bruna.teixeira@exemplo.com', cpf: '67891234582', telefone: '(48) 99111-0006' }
]

// Avaliações por profissional (índice do cliente, nota de 1 a 5, comentário)
const avaliacoesPorProfissional = {
    'Camila Rocha': [
        { cliente: 0, nota: 5, comentario: 'Maquiagem perfeita para a minha formatura, durou a noite toda! Super recomendo.' },
        { cliente: 1, nota: 5, comentario: 'Atendimento impecável e muito caprichosa. Voltarei com certeza.' },
        { cliente: 2, nota: 4, comentario: 'Ficou lindo, só atrasou uns 10 minutos. Mas o resultado compensou.' },
        { cliente: 3, nota: 5, comentario: 'Amei! Ela entendeu exatamente o que eu queria.' }
    ],
    'Bianca Lima': [
        { cliente: 1, nota: 5, comentario: 'Corte e escova incríveis, saí do salão me sentindo outra pessoa.' },
        { cliente: 4, nota: 4, comentario: 'Ótima profissional e ambiente muito agradável.' },
        { cliente: 5, nota: 5, comentario: 'Cabelo ficou maravilhoso e o atendimento foi muito atencioso.' },
        { cliente: 0, nota: 5, comentario: 'A melhor escova que já fiz, durou vários dias.' }
    ],
    'Juliana Mendes': [
        { cliente: 2, nota: 5, comentario: 'Consulta muito completa, explicou tudo com calma.' },
        { cliente: 3, nota: 5, comentario: 'Excelente profissional, minha pele melhorou muito com o tratamento indicado.' },
        { cliente: 4, nota: 4, comentario: 'Atendimento muito bom, a consulta foi só um pouco corrida.' },
        { cliente: 5, nota: 5, comentario: 'Super atenciosa e didática, me senti muito segura.' }
    ],
    'Lívia Castro': [
        { cliente: 0, nota: 5, comentario: 'Penteado de noiva lindo e firme o dia todo, as fotos ficaram lindas!' },
        { cliente: 3, nota: 5, comentario: 'Delicada e muito talentosa, adorei o resultado.' },
        { cliente: 4, nota: 5, comentario: 'Fiz o penteado para um casamento e recebi vários elogios.' },
        { cliente: 2, nota: 4, comentario: 'Gostei muito, só queria que tivesse mais opções de horário.' }
    ]
}

async function seedAvaliacoes() {
    try {
        const jaExiste = await Usuario.findOne({ where: { email: clientes[0].email } })
        if (jaExiste) {
            console.log('As avaliações de demonstração já foram criadas antes. Nada a fazer.')
            return
        }

        const senhaCriptografada = await bcrypt.hash('123456', 10)

        // 1. Clientes fictícios
        const usuarios = []
        for (const c of clientes) {
            const usuario = await Usuario.create({
                ...c,
                senha: senhaCriptografada,
                cep: '88010-001',
                logradouro: 'Rua Felipe Schmidt',
                bairro: 'Centro',
                localidade: 'Florianópolis',
                uf: 'SC',
                numero: '100'
            })
            usuarios.push(usuario)
        }

        // 2. Para cada avaliação: um agendamento CONCLUIDO (no passado) + a avaliação
        let total = 0
        for (const [nomeProfissional, avaliacoes] of Object.entries(avaliacoesPorProfissional)) {
            const profissional = await Profissional.findOne({ where: { nome: nomeProfissional } })
            if (!profissional) {
                console.log(`Profissional "${nomeProfissional}" não encontrada, pulando.`)
                continue
            }

            const servico = await Servico.findOne({ where: { idProfissional: profissional.codProfissional } })
            if (!servico) {
                console.log(`"${nomeProfissional}" não tem serviço cadastrado, pulando.`)
                continue
            }

            for (let i = 0; i < avaliacoes.length; i++) {
                const av = avaliacoes[i]
                const usuario = usuarios[av.cliente]

                const dataAtendimento = new Date()
                dataAtendimento.setDate(dataAtendimento.getDate() - (10 + i * 7))
                dataAtendimento.setHours(14, 0, 0, 0)

                const dataAvaliacao = new Date(dataAtendimento)
                dataAvaliacao.setDate(dataAvaliacao.getDate() + 1)

                const agendamento = await Agendamento.create({
                    idUsuario: usuario.codUsuario,
                    idServico: servico.codServico,
                    dataHora: dataAtendimento,
                    status: 'CONCLUIDO'
                })

                await Avaliacao.create({
                    idUsuario: usuario.codUsuario,
                    idProfissional: profissional.codProfissional,
                    idAgendamento: agendamento.codAgendamento,
                    nota: av.nota,
                    comentario: av.comentario,
                    dataAvaliacao
                })
                total++
            }
        }

        console.log('--------------------------------------------------')
        console.log(`${total} avaliações de demonstração criadas com sucesso!`)
        console.log('--------------------------------------------------')

    } catch (err) {
        console.error('Erro ao criar as avaliações:', err)
    } finally {
        await conn.close()
    }
}

seedAvaliacoes()