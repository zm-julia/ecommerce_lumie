let listaProfissionais = []

// Monta a string de estrelas (★★★★☆) a partir da nota média (0 a 5)
function montarEstrelas(media) {
    if (media === null) {
        return '<span class="qtd">Sem avaliações ainda</span>'
    }

    const cheias = Math.round(media)
    const estrelas = '★'.repeat(cheias) + '☆'.repeat(5 - cheias)
    return `${estrelas} <span class="qtd">${media.toFixed(1)}</span>`
}

async function carregarProfissionais() {
    const grid = document.getElementById('gridProfissionais')

    try {
        listaProfissionais = await apiFetch('/profissionais')
        preencherSelectEspecialidades()
        renderizarProfissionais(listaProfissionais)
    } catch (err) {
        grid.innerHTML = `<p class="vazio">Não foi possível carregar os profissionais agora.</p>`
    }
}

function preencherSelectEspecialidades() {
    const select = document.getElementById('selectEspecialidade')

    // Pega as especialidades sem repetir (Set remove duplicatas)
    const especialidades = [...new Set(listaProfissionais.map((p) => p.especialidade))]

    especialidades.forEach((esp) => {
        const opcao = document.createElement('option')
        opcao.value = esp
        opcao.textContent = esp
        select.appendChild(opcao)
    })
}

function renderizarProfissionais(profissionais) {
    const grid = document.getElementById('gridProfissionais')

    if (profissionais.length === 0) {
        grid.innerHTML = `<p class="vazio">Nenhum profissional encontrado.</p>`
        return
    }

    grid.innerHTML = profissionais.map((p) => {
        const foto = p.foto_url || 'https://via.placeholder.com/300x300?text=LUMIE'
        const cidade = p.localizacaoProfissional ? p.localizacaoProfissional.localidade : ''

        return `
            <a href="profissional.html?id=${p.codProfissional}" class="card-profissional">
                <img class="img-profissional" src="${foto}" alt="${p.nome}">
                <div class="info">
                    <h3>${p.nome}</h3>
                    <span class="especialidade">${p.especialidade}${cidade ? ' · ' + cidade : ''}</span>
                    <span class="estrelas">${montarEstrelas(p.avaliacaoMedia)}</span>
                    <span class="preco-a-partir">A partir de R$ ${Number(p.preco_base).toFixed(2)}</span>
                </div>
            </a>
        `
    }).join('')
}

function aplicarFiltrosProfissional() {
    const busca = document.getElementById('inputBuscaProfissional').value.toLowerCase()
    const especialidade = document.getElementById('selectEspecialidade').value

    const filtrados = listaProfissionais.filter((p) => {
        const bateBusca = p.nome.toLowerCase().includes(busca) || p.especialidade.toLowerCase().includes(busca)
        const bateEspecialidade = !especialidade || p.especialidade === especialidade
        return bateBusca && bateEspecialidade
    })

    renderizarProfissionais(filtrados)
    if (mapaLeaflet) plotarMarcadores(filtrados)
}

let mapaLeaflet = null
let marcadoresAtivos = []

// Mostra/esconde o mapa. Só cria o mapa na primeira vez que for aberto
// (não faz sentido inicializar o Leaflet se o usuário nunca clicar em "Ver no mapa")
function alternarMapa() {
    const divMapa = document.getElementById('mapaProfissionais')
    const mostrando = divMapa.style.display !== 'none'

    if (mostrando) {
        divMapa.style.display = 'none'
        document.getElementById('btnAlternarMapa').textContent = '🗺️ Ver no mapa'
        return
    }

    if (typeof L === 'undefined') {
        alert('Não foi possível carregar o mapa agora. Verifique sua conexão.')
        return
    }

    divMapa.style.display = 'block'
    document.getElementById('btnAlternarMapa').textContent = '📋 Ver em lista'

    if (!mapaLeaflet) {
        // Centraliza em São Paulo por padrão (onde estão os profissionais do exemplo)
        mapaLeaflet = L.map('mapaProfissionais').setView([-23.5629, -46.6708], 12)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(mapaLeaflet)
    }

    // O mapa às vezes fica com o tamanho errado se foi criado enquanto escondido -
    // essa chamada corrige isso assim que ele vira visível
    setTimeout(() => mapaLeaflet.invalidateSize(), 100)

    plotarMarcadores(listaProfissionais)
}

function plotarMarcadores(profissionais) {
    if (!mapaLeaflet) return

    // Limpa os marcadores antigos antes de desenhar os novos (ex: depois de um filtro)
    marcadoresAtivos.forEach((marcador) => mapaLeaflet.removeLayer(marcador))
    marcadoresAtivos = []

    profissionais.forEach((p) => {
        const loc = p.localizacaoProfissional
        // Só plota quem tem coordenadas cadastradas
        if (!loc || !loc.latitude || !loc.longitude) return

        const marcador = L.marker([loc.latitude, loc.longitude]).addTo(mapaLeaflet)
        marcador.bindPopup(`
            <strong>${p.nome}</strong><br>
            ${p.especialidade}<br>
            ${loc.bairro}, ${loc.localidade}<br>
            <a href="profissional.html?id=${p.codProfissional}">Ver perfil ›</a>
        `)
        marcadoresAtivos.push(marcador)
    })
}

document.addEventListener('DOMContentLoaded', () => {
    carregarProfissionais()

    document.getElementById('inputBuscaProfissional').addEventListener('input', aplicarFiltrosProfissional)
    document.getElementById('selectEspecialidade').addEventListener('change', aplicarFiltrosProfissional)
    document.getElementById('btnAlternarMapa').addEventListener('click', alternarMapa)
})
