
const CHAVE_CARRINHO = 'carrinho'

function obterCarrinho() {
    const dados = localStorage.getItem(CHAVE_CARRINHO)
    return dados ? JSON.parse(dados) : []
}

function salvarCarrinho(carrinho) {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho))
}

function adicionarAoCarrinho(produto, quantidadeDisponivel) {
    const carrinho = obterCarrinho()
    const itemExistente = carrinho.find((item) => item.codProduto === produto.codProduto)

    if (itemExistente) {
        if (itemExistente.quantidade >= quantidadeDisponivel) {
            alert('Não há mais estoque disponível para esse produto.')
            return
        }
        itemExistente.quantidade += 1
    } else {
        if (quantidadeDisponivel <= 0) {
            alert('Produto sem estoque no momento.')
            return
        }
        carrinho.push({
            codProduto: produto.codProduto,
            nome: produto.nome,
            preco: Number(produto.preco),
            imagem_url: produto.imagem_url,
            quantidade: 1
        })
    }

    salvarCarrinho(carrinho)
    montarNavbar()
}

function removerDoCarrinho(idProduto) {
    let carrinho = obterCarrinho()
    carrinho = carrinho.filter((item) => item.codProduto !== idProduto)
    salvarCarrinho(carrinho)
}

function alterarQuantidade(idProduto, delta, quantidadeDisponivel) {
    const carrinho = obterCarrinho()
    const item = carrinho.find((i) => i.codProduto === idProduto)
    if (!item) return

    const novaQuantidade = item.quantidade + delta

    if (novaQuantidade <= 0) {
        removerDoCarrinho(idProduto)
    } else if (quantidadeDisponivel !== undefined && novaQuantidade > quantidadeDisponivel) {
        alert('Não há mais estoque disponível para esse produto.')
        return
    } else {
        item.quantidade = novaQuantidade
        salvarCarrinho(carrinho)
    }
}

function limparCarrinho() {
    localStorage.removeItem(CHAVE_CARRINHO)
}

function calcularSubtotalCarrinho() {
    return obterCarrinho().reduce((total, item) => total + item.preco * item.quantidade, 0)
}
