function renderizarCarrinho() {
    const carrinho = obterCarrinho()
    const div = document.getElementById('listaCarrinho')
    const resumo = document.getElementById('resumoPedido')

    if (carrinho.length === 0) {
        div.innerHTML = `<p class="vazio">Seu carrinho está vazio. <a href="index.html">Ver produtos</a></p>`
        resumo.style.display = 'none'
        return
    }

    div.innerHTML = carrinho.map((item) => `
        <div class="item-carrinho">
            <img src="${item.imagem_url || 'https://via.placeholder.com/64'}" alt="${item.nome}">
            <div class="info-item">
                <strong>${item.nome}</strong><br>
                <span>R$ ${item.preco.toFixed(2)} un.</span>
            </div>
            <div class="qtd-controle">
                <button onclick="alterarQtdTela(${item.codProduto}, -1)">-</button>
                <span>${item.quantidade}</span>
                <button onclick="alterarQtdTela(${item.codProduto}, 1)">+</button>
            </div>
            <strong>R$ ${(item.preco * item.quantidade).toFixed(2)}</strong>
            <button class="btn btn-secundario" onclick="removerItemTela(${item.codProduto})">Remover</button>
        </div>
    `).join('')

    const subtotal = calcularSubtotalCarrinho()
    const frete = 10.0
    document.getElementById('subtotalTexto').textContent = `R$ ${subtotal.toFixed(2)}`
    document.getElementById('freteTexto').textContent = `R$ ${frete.toFixed(2)}`
    document.getElementById('totalTexto').textContent = `R$ ${(subtotal + frete).toFixed(2)}`
    resumo.style.display = 'block'
}

function alterarQtdTela(idProduto, delta) {
    alterarQuantidade(idProduto, delta)
    montarNavbar()
    renderizarCarrinho()
}

function removerItemTela(idProduto) {
    removerDoCarrinho(idProduto)
    montarNavbar()
    renderizarCarrinho()
}

document.getElementById('btnCheckout').addEventListener('click', async () => {
    const divMensagem = document.getElementById('mensagem')

    if (!estaLogado()) {
        divMensagem.innerHTML = `<div class="mensagem erro">Você precisa entrar na sua conta para finalizar o pedido.</div>`
        setTimeout(() => window.location.href = 'login.html', 1500)
        return
    }

    const itens = obterCarrinho().map((item) => ({
        idProduto: item.codProduto,
        quantidade: item.quantidade
    }))

    try {
        const pedido = await apiFetch('/pedidos', {
            method: 'POST',
            body: JSON.stringify({ itens })
        })

        limparCarrinho()
        divMensagem.innerHTML = `<div class="mensagem sucesso">Pedido #${pedido.codPedido} realizado com sucesso!</div>`
        setTimeout(() => window.location.href = 'pedidos.html', 1500)

    } catch (err) {
        divMensagem.innerHTML = `<div class="mensagem erro">${err.message}</div>`
    }
})

document.addEventListener('DOMContentLoaded', renderizarCarrinho)
