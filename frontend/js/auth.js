
function getUsuarioLogado() {
    const usuario = localStorage.getItem('usuario')
    return usuario ? JSON.parse(usuario) : null
}

function estaLogado() {
    return !!localStorage.getItem('token')
}

function ehAdmin() {
    const usuario = getUsuarioLogado()
    return usuario && usuario.tipo_usuario === 'ADMIN'
}

function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    window.location.href = 'index.html'
}

function montarNavbar() {
    const nav = document.getElementById('navbar')
    if (!nav) return

    const logado = estaLogado()
    const usuario = getUsuarioLogado()
    const qtdCarrinho = obterCarrinho().reduce((total, item) => total + item.quantidade, 0)

    let areaConta = ''

    if (logado) {
        areaConta = `
            <a href="pedidos.html">Meus Pedidos</a>
            <a href="meus-agendamentos.html">Meus Agendamentos</a>
            <a href="perfil.html">Olá, ${usuario.nome.split(' ')[0]}<br><small>Minha conta</small></a>
            <button onclick="logout()">Sair</button>
        `
        if (usuario.tipo_usuario === 'ADMIN') {
            areaConta += `<a href="admin.html" class="btn-destaque">Painel Admin</a>`
        }
    } else {
        areaConta = `
            <a href="login.html">Entrar</a>
            <a href="cadastro.html" class="btn-destaque">Criar conta</a>
        `
    }

    nav.innerHTML = `
        <div class="container">
            <a href="index.html" class="logo">LUMIÉ<small>BEAUTY &amp; PROFESSIONALS</small></a>
            <div class="nav-links">
                <a href="index.html">Shop</a>
                <a href="beauty-match.html">Beauty Match</a>
                <a href="profissionais.html">Professionals</a>
                <a href="sobre.html">Sobre nós</a>
            </div>
            <div class="nav-links">
                <a href="carrinho.html">Carrinho <span class="carrinho-badge">${qtdCarrinho}</span></a>
                ${areaConta}
            </div>
        </div>
    `
}

document.addEventListener('DOMContentLoaded', montarNavbar)
