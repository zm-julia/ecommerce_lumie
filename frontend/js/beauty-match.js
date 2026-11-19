// Perguntas do quiz. Cada opção carrega um "valor" que a função calcularCategoria()
// usa pra decidir qual categoria recomendar no final.
const perguntasQuiz = [
    {
        titulo: 'Qual é o seu principal objetivo?',
        campo: 'objetivo',
        opcoes: [
            { valor: 'hidratar', texto: 'Hidratar a pele' },
            { valor: 'oleosidade', texto: 'Controlar a oleosidade' },
            { valor: 'antiidade', texto: 'Cuidar dos sinais de idade' },
            { valor: 'tom', texto: 'Uniformizar o tom da pele' },
            { valor: 'cabelo', texto: 'Cuidar dos cabelos' },
            { valor: 'make', texto: 'Arrasar na maquiagem' }
        ]
    },
    {
        titulo: 'Onde você quer focar?',
        campo: 'area',
        opcoes: [
            { valor: 'rosto', texto: 'Rosto' },
            { valor: 'corpo', texto: 'Corpo' },
            { valor: 'cabelo', texto: 'Cabelo' },
            { valor: 'tanto_faz', texto: 'Tanto faz' }
        ]
    }
]

// Guarda as respostas conforme o usuário vai clicando
const respostasQuiz = {}
let etapaAtual = 0

// A regra de recomendação em si: cruza objetivo + área e devolve o NOME
// da categoria (tem que bater exatamente com o nome cadastrado no banco)
function calcularCategoriaRecomendada() {
    const { objetivo, area } = respostasQuiz

    if (objetivo === 'hidratar') {
        return area === 'corpo' ? 'Body Care' : 'Skincare'
    }
    if (objetivo === 'oleosidade' || objetivo === 'antiidade') {
        return 'Skincare'
    }
    if (objetivo === 'tom' || objetivo === 'make') {
        return 'Maquiagem'
    }
    if (objetivo === 'cabelo') {
        return 'Cabelos'
    }
    return 'Maquiagem'
}

function renderizarEtapa() {
    const pergunta = perguntasQuiz[etapaAtual]
    const div = document.getElementById('areaQuiz')

    div.innerHTML = `
        <p style="font-size:0.8rem; color:var(--texto-claro); margin:0 0 4px;">
            Pergunta ${etapaAtual + 1} de ${perguntasQuiz.length}
        </p>
        <h2>${pergunta.titulo}</h2>
        <div id="opcoesQuiz">
            ${pergunta.opcoes.map((op) => `
                <div class="campo">
                    <label style="display:flex; align-items:center; gap:8px; font-weight:400; cursor:pointer;">
                        <input type="radio" name="opcaoQuiz" value="${op.valor}" style="width:auto;">
                        ${op.texto}
                    </label>
                </div>
            `).join('')}
        </div>
        <button id="btnProximo" class="btn btn-primario btn-bloco" disabled>
            ${etapaAtual === perguntasQuiz.length - 1 ? 'Ver minhas recomendações' : 'Próximo'}
        </button>
    `

    // Só libera o botão depois que o usuário escolher uma opção
    document.querySelectorAll('input[name="opcaoQuiz"]').forEach((input) => {
        input.addEventListener('change', () => {
            document.getElementById('btnProximo').disabled = false
        })
    })

    document.getElementById('btnProximo').addEventListener('click', avancarEtapa)
}

function avancarEtapa() {
    const escolha = document.querySelector('input[name="opcaoQuiz"]:checked').value
    const pergunta = perguntasQuiz[etapaAtual]
    respostasQuiz[pergunta.campo] = escolha

    if (etapaAtual < perguntasQuiz.length - 1) {
        etapaAtual++
        renderizarEtapa()
    } else {
        mostrarResultado()
    }
}

async function mostrarResultado() {
    const categoria = calcularCategoriaRecomendada()

    document.getElementById('areaQuiz').innerHTML = `
        <h2>Combinou com você: <span style="color:var(--coral);">${categoria}</span> ✨</h2>
        <p style="color:var(--texto-claro);">Separamos alguns produtos dessa categoria pra você começar.</p>
        <button class="btn btn-secundario" onclick="reiniciarQuiz()">Refazer o quiz</button>
    `

    const divResultado = document.getElementById('areaResultado')
    divResultado.innerHTML = `<p class="vazio">Buscando recomendações...</p>`

    try {
        const produtos = await apiFetch('/produtos')
        const recomendados = produtos.filter((p) => p.categoriaProduto && p.categoriaProduto.nome === categoria)

        if (recomendados.length === 0) {
            divResultado.innerHTML = `<p class="vazio">Ainda não temos produtos nessa categoria. <a href="index.html">Ver catálogo completo</a></p>`
            return
        }

        divResultado.innerHTML = `
            <div class="grid-produtos">
                ${recomendados.map((produto) => montarCardResultado(produto)).join('')}
            </div>
        `
    } catch (err) {
        divResultado.innerHTML = `<p class="vazio">Não foi possível buscar as recomendações agora.</p>`
    }
}

// Mesmo cartão de produto usado na home, só que sem o botão de favorito
function montarCardResultado(produto) {
    const estoque = produto.estoqueProduto ? produto.estoqueProduto.quantidade_atual : 0
    const semEstoque = estoque <= 0
    const imagem = produto.imagem_url || 'https://via.placeholder.com/300x200?text=LUMIE'

    return `
        <div class="card-produto">
            <img class="img-produto" src="${imagem}" alt="${produto.nome}">
            <div class="info">
                <span class="categoria-tag">${produto.categoriaProduto.nome}</span>
                <h3>${produto.nome}</h3>
                <span class="preco">R$ ${Number(produto.preco).toFixed(2)}</span>
                <button class="btn btn-primario btn-bloco" ${semEstoque ? 'disabled' : ''}
                    onclick='adicionarAoCarrinho(${JSON.stringify(produto)}, ${estoque})'>
                    ${semEstoque ? 'Indisponível' : 'Adicionar ao carrinho'}
                </button>
            </div>
        </div>
    `
}

function reiniciarQuiz() {
    etapaAtual = 0
    respostasQuiz.objetivo = undefined
    respostasQuiz.area = undefined
    document.getElementById('areaResultado').innerHTML = ''
    renderizarEtapa()
}

document.addEventListener('DOMContentLoaded', renderizarEtapa)
