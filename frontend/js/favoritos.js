// ---------- FAVORITOS (guardados no LocalStorage, só os códigos dos produtos) ----------
const CHAVE_FAVORITOS = 'favoritos'

function obterFavoritos() {
    try {
        const dados = JSON.parse(localStorage.getItem(CHAVE_FAVORITOS))
        return Array.isArray(dados) ? dados : []
    } catch (err) {
        return []
    }
}

function salvarFavoritos(ids) {
    localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(ids))
}

function ehFavorito(codProduto) {
    return obterFavoritos().includes(Number(codProduto))
}

// Marca ou desmarca o produto como favorito (chamado pelo coração do card)
function alternarFavorito(codProduto, botao) {
    const id = Number(codProduto)
    let favoritos = obterFavoritos()

    if (favoritos.includes(id)) {
        favoritos = favoritos.filter((fav) => fav !== id)
    } else {
        favoritos.push(id)
    }

    salvarFavoritos(favoritos)

    if (botao) {
        botao.textContent = favoritos.includes(id) ? '❤️' : '♡'
    }

    // Atualiza o contador do menu
    if (typeof montarNavbar === 'function') montarNavbar()

    // Na página "Meus favoritos", o produto some da lista ao desfavoritar
    if (document.getElementById('gridFavoritos')) renderizarFavoritos()
}


// ---------- PÁGINA "MEUS FAVORITOS" (favoritos.html) ----------
let todosOsProdutos = []

async function carregarFavoritos() {
    const grid = document.getElementById('gridFavoritos')

    try {
        todosOsProdutos = await apiFetch('/produtos')
        renderizarFavoritos()
    } catch (err) {
        grid.innerHTML = `<p class="vazio">Não foi possível carregar os favoritos agora.</p>`
    }
}

function renderizarFavoritos() {
    const grid = document.getElementById('gridFavoritos')
    const ids = obterFavoritos()
    const favoritos = todosOsProdutos.filter((produto) => ids.includes(produto.codProduto))

    if (favoritos.length === 0) {
        grid.innerHTML = `
            <p class="vazio">
                Você ainda não favoritou nenhum produto.<br>
                <a href="index.html#gridProdutos">Ver produtos ›</a>
            </p>
        `
        return
    }

    grid.innerHTML = favoritos.map((produto) => {
        const estoque = produto.estoqueProduto ? produto.estoqueProduto.quantidade_atual : 0
        const semEstoque = estoque <= 0
        const imagem = produto.imagem_url || 'https://via.placeholder.com/300x200?text=LUMIE'

        return `
            <div class="card-produto">
                <button class="icone-favorito" title="Remover dos favoritos" onclick="alternarFavorito(${produto.codProduto}, this)">❤️</button>
                <img class="img-produto" src="${imagem}" alt="${produto.nome}">
                <div class="info">
                    <span class="categoria-tag">${produto.categoriaProduto ? produto.categoriaProduto.nome : ''}</span>
                    <h3>${produto.nome}</h3>
                    <span class="estoque-info ${semEstoque ? 'zerado' : ''}">
                        ${semEstoque ? 'Sem estoque no momento' : `${estoque} unidades disponíveis`}
                    </span>
                    <span class="preco">R$ ${Number(produto.preco).toFixed(2)}</span>
                    <button class="btn btn-primario btn-bloco" ${semEstoque ? 'disabled' : ''}
                        onclick='adicionarAoCarrinho(${JSON.stringify(produto)}, ${estoque})'>
                        ${semEstoque ? 'Indisponível' : 'Adicionar ao carrinho'}
                    </button>
                </div>
            </div>
        `
    }).join('')
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('gridFavoritos')) carregarFavoritos()
})