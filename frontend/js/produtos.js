let listaProdutos = []


const iconesCategoria = {
    'Maquiagem': '💄',
    'Skincare': '🧴',
    'Cabelos': '💇',
    'Body Care': '🧖',
    'Acessórios': '🖌️',
    'Presentes': '🎁'
}

async function carregarCategorias() {
    try {
        const categorias = await apiFetch('/categorias')

        renderizarCategorias(categorias)
        preencherSelectCategoria(categorias)
        preencherRodapeCategorias(categorias)

    } catch (err) {
        console.error('Erro ao carregar categorias:', err)
    }
}

function renderizarCategorias(categorias) {
    const grid = document.getElementById('gridCategorias')
    if (!grid) return

    grid.innerHTML = categorias.map((cat) => `
        <div class="card-categoria" onclick="filtrarPorCategoria(${cat.codCategoria})">
            <div class="img-categoria" style="display:flex; align-items:center; justify-content:center; font-size:2.2rem;">
                ${iconesCategoria[cat.nome] || '✨'}
            </div>
            <span>${cat.nome}</span>
        </div>
    `).join('')
}

function preencherSelectCategoria(categorias) {
    const select = document.getElementById('selectCategoria')
    if (!select) return

    categorias.forEach((cat) => {
        const opcao = document.createElement('option')
        opcao.value = cat.codCategoria
        opcao.textContent = cat.nome
        select.appendChild(opcao)
    })
}

function preencherRodapeCategorias(categorias) {
    const lista = document.getElementById('listaCategoriasRodape')
    if (!lista) return

    lista.innerHTML = categorias.map((cat) => `<li><a href="#gridProdutos" onclick="filtrarPorCategoria(${cat.codCategoria})">${cat.nome}</a></li>`).join('')
}

function filtrarPorCategoria(idCategoria) {
    document.getElementById('selectCategoria').value = idCategoria
    aplicarFiltros()
    document.getElementById('gridProdutos').scrollIntoView({ behavior: 'smooth' })
}

async function carregarProdutos() {
    const grid = document.getElementById('gridProdutos')

    try {
        listaProdutos = await apiFetch('/produtos')
        renderizarProdutos(listaProdutos)
    } catch (err) {
        grid.innerHTML = `<p class="vazio">Não foi possível carregar os produtos agora.</p>`
    }
}

function renderizarProdutos(produtos) {
    const grid = document.getElementById('gridProdutos')

    if (produtos.length === 0) {
        grid.innerHTML = `<p class="vazio">Nenhum produto encontrado.</p>`
        return
    }

    grid.innerHTML = produtos.map((produto) => {
        const estoque = produto.estoqueProduto ? produto.estoqueProduto.quantidade_atual : 0
        const semEstoque = estoque <= 0
        const imagem = produto.imagem_url || 'https://via.placeholder.com/300x200?text=LUMIE'

        return `
            <div class="card-produto">
                <button class="icone-favorito" title="Favoritar" onclick="alternarFavorito(${produto.codProduto}, this)">${ehFavorito(produto.codProduto) ? '❤️' : '♡'}</button>
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

function aplicarFiltros() {
    const busca = document.getElementById('inputBusca').value.toLowerCase()
    const categoria = document.getElementById('selectCategoria').value

    const filtrados = listaProdutos.filter((produto) => {
        const bateBusca = produto.nome.toLowerCase().includes(busca)
        const bateCategoria = !categoria || produto.idCategoria == categoria
        return bateBusca && bateCategoria
    })

    renderizarProdutos(filtrados)
}

document.addEventListener('DOMContentLoaded', () => {
    carregarCategorias()
    carregarProdutos()

    document.getElementById('inputBusca').addEventListener('input', aplicarFiltros)
    document.getElementById('selectCategoria').addEventListener('change', aplicarFiltros)
})