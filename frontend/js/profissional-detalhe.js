// Pega o "id" da URL, ex: profissional.html?id=3
const parametros = new URLSearchParams(window.location.search)
const idProfissional = parametros.get('id')

// Guarda os dados dos serviços carregados, pra usar quando o modal de agendamento abrir
let servicosCache = []

async function carregarPerfil() {
    if (!idProfissional) {
        document.getElementById('cabecalhoPerfil').innerHTML = `<p class="vazio">Profissional não informado.</p>`
        return
    }

    try {
        const p = await apiFetch(`/profissionais/${idProfissional}`)
        renderizarCabecalho(p)
        renderizarServicos(p.servicosProfissional || [])
        renderizarAvaliacoes(p.avaliacoesProfissional || [])
    } catch (err) {
        document.getElementById('cabecalhoPerfil').innerHTML = `<p class="vazio">${err.message}</p>`
    }
}

function renderizarCabecalho(p) {
    const foto = p.foto_url || 'https://via.placeholder.com/300x300?text=LUMIE'
    const loc = p.localizacaoProfissional

    const enderecoTexto = loc
        ? `${loc.logradouro}, ${loc.numero} - ${loc.bairro}, ${loc.localidade}/${loc.uf}`
        : 'Endereço não informado'

    const estrelas = p.avaliacaoMedia !== null
        ? `${'★'.repeat(Math.round(p.avaliacaoMedia))}${'☆'.repeat(5 - Math.round(p.avaliacaoMedia))} <span class="qtd">${p.avaliacaoMedia.toFixed(1)} (${p.totalAvaliacoes})</span>`
        : `<span class="qtd">Sem avaliações ainda</span>`

    document.getElementById('cabecalhoPerfil').innerHTML = `
        <div class="cabecalho-perfil">
            <img src="${foto}" alt="${p.nome}">
            <div class="dados">
                <h1>${p.nome}</h1>
                <p style="color:var(--texto-claro); margin:0 0 6px;">${p.especialidade}</p>
                <span class="estrelas">${estrelas}</span>
                <p style="margin:8px 0 0; font-size:0.88rem;">📍 ${enderecoTexto}</p>
                ${p.bio ? `<p style="margin:8px 0 0; font-size:0.9rem;">${p.bio}</p>` : ''}
            </div>
        </div>
    `

    // Se o profissional tem coordenadas cadastradas E a biblioteca do mapa carregou,
    // mostra o mini-mapa com um marcador. Sem essa checagem do "typeof L", uma falha
    // ao carregar o Leaflet (ex: sem internet) quebraria a página inteira.
    if (loc && loc.latitude && loc.longitude && typeof L !== 'undefined') {
        const divMapa = document.getElementById('mapaPerfil')
        divMapa.style.display = 'block'

        const mapa = L.map('mapaPerfil').setView([loc.latitude, loc.longitude], 15)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(mapa)
        L.marker([loc.latitude, loc.longitude]).addTo(mapa).bindPopup(p.nome)

        setTimeout(() => mapa.invalidateSize(), 100)
    }
}

function renderizarServicos(servicos) {
    servicosCache = servicos
    const div = document.getElementById('listaServicos')

    if (servicos.length === 0) {
        div.innerHTML = `<p class="vazio">Nenhum serviço cadastrado ainda.</p>`
        return
    }

    div.innerHTML = servicos.map((s) => `
        <div class="card-servico">
            <div>
                <strong>${s.nome}</strong><br>
                <span style="font-size:0.85rem; color:var(--texto-claro);">${s.duracao_minutos} min ${s.descricao ? '· ' + s.descricao : ''}</span>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
                <strong>R$ ${Number(s.preco).toFixed(2)}</strong>
                <button class="btn btn-primario" onclick="agendarServico(${s.codServico})">Agendar</button>
            </div>
        </div>
    `).join('')
}

function renderizarAvaliacoes(avaliacoes) {
    const div = document.getElementById('listaAvaliacoes')

    if (avaliacoes.length === 0) {
        div.innerHTML = `<p class="vazio">Esse profissional ainda não recebeu avaliações.</p>`
        return
    }

    div.innerHTML = avaliacoes.map((av) => `
        <div class="card-avaliacao">
            <div class="cabecalho-avaliacao">
                <strong>${'★'.repeat(av.nota)}${'☆'.repeat(5 - av.nota)}</strong>
                <span style="color:var(--texto-claro);">${new Date(av.dataAvaliacao).toLocaleDateString('pt-BR')}</span>
            </div>
            <p style="margin:0; font-size:0.9rem;">${av.comentario || '<em>Sem comentário.</em>'}</p>
        </div>
    `).join('')
}

// Abre o modal de agendamento pro serviço escolhido
function agendarServico(idServico) {
    if (!estaLogado()) {
        alert('Você precisa entrar na sua conta pra agendar um horário.')
        window.location.href = `login.html`
        return
    }

    const servico = servicosCache.find((s) => s.codServico === idServico)
    if (!servico) return

    const hoje = new Date().toISOString().split('T')[0]

    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.id = 'modalAgendamento'
    overlay.innerHTML = `
        <div class="modal-conteudo">
            <button class="modal-fechar" onclick="fecharModalAgendamento()">✕</button>
            <h3>Agendar: ${servico.nome}</h3>
            <div id="mensagemAgendamento"></div>
            <form id="formAgendamento">
                <div class="campo">
                    <label for="dataAgendamento">Data</label>
                    <input type="date" id="dataAgendamento" min="${hoje}" required>
                </div>
                <div class="campo">
                    <label for="horaAgendamento">Horário</label>
                    <input type="time" id="horaAgendamento" required>
                </div>
                <div class="campo">
                    <label for="obsAgendamento">Observações (opcional)</label>
                    <textarea id="obsAgendamento" rows="2"></textarea>
                </div>
                <button type="submit" class="btn btn-primario btn-bloco">Confirmar agendamento</button>
            </form>
        </div>
    `
    document.body.appendChild(overlay)

    document.getElementById('formAgendamento').addEventListener('submit', (evento) => {
        confirmarAgendamento(evento, idServico)
    })
}

function fecharModalAgendamento() {
    const overlay = document.getElementById('modalAgendamento')
    if (overlay) overlay.remove()
}

async function confirmarAgendamento(evento, idServico) {
    evento.preventDefault()

    const data = document.getElementById('dataAgendamento').value
    const hora = document.getElementById('horaAgendamento').value
    const observacoes = document.getElementById('obsAgendamento').value
    const divMensagem = document.getElementById('mensagemAgendamento')

    try {
        await apiFetch('/agendamentos', {
            method: 'POST',
            body: JSON.stringify({
                idServico,
                dataHora: `${data}T${hora}:00`,
                observacoes
            })
        })

        divMensagem.innerHTML = `<div class="mensagem sucesso">Agendamento confirmado! Redirecionando...</div>`
        setTimeout(() => window.location.href = 'meus-agendamentos.html', 1200)

    } catch (err) {
        // err.message já vem certo do api.js, ex: "Esse horário já está reservado."
        divMensagem.innerHTML = `<div class="mensagem erro">${err.message}</div>`
    }
}

document.addEventListener('DOMContentLoaded', carregarPerfil)
