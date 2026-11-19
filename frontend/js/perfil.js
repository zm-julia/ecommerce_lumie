if (!estaLogado()) {
    window.location.href = 'login.html'
}

async function carregarPerfil() {
    try {
        const usuario = await apiFetch('/usuarios/perfil')

        document.getElementById('nome').value = usuario.nome
        document.getElementById('email').value = usuario.email
        document.getElementById('telefone').value = usuario.telefone
        document.getElementById('cpf').value = usuario.cpf
        document.getElementById('cep').value = usuario.cep
        document.getElementById('numero').value = usuario.numero
        document.getElementById('logradouro').value = usuario.logradouro
        document.getElementById('bairro').value = usuario.bairro
        document.getElementById('localidade').value = usuario.localidade
        document.getElementById('uf').value = usuario.uf

    } catch (err) {
        document.getElementById('mensagem').innerHTML = `<div class="mensagem erro">${err.message}</div>`
    }
}

document.getElementById('formPerfil').addEventListener('submit', async (evento) => {
    evento.preventDefault()

    const divMensagem = document.getElementById('mensagem')
    const cpf = document.getElementById('cpf').value

    if (!validaCpf(cpf)) {
        divMensagem.innerHTML = `<div class="mensagem erro">CPF inválido.</div>`
        return
    }

    const corpo = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        cpf,
        cep: document.getElementById('cep').value,
        numero: document.getElementById('numero').value,
        logradouro: document.getElementById('logradouro').value,
        bairro: document.getElementById('bairro').value,
        localidade: document.getElementById('localidade').value,
        uf: document.getElementById('uf').value
    }

    try {
        const usuarioLogado = getUsuarioLogado()
        const usuarioAtualizado = await apiFetch(`/usuarios/${usuarioLogado.codUsuario}`, {
            method: 'PUT',
            body: JSON.stringify(corpo)
        })

        localStorage.setItem('usuario', JSON.stringify({
            codUsuario: usuarioAtualizado.codUsuario,
            nome: usuarioAtualizado.nome,
            email: usuarioAtualizado.email,
            tipo_usuario: usuarioAtualizado.tipo_usuario
        }))

        divMensagem.innerHTML = `<div class="mensagem sucesso">Dados atualizados com sucesso!</div>`
        montarNavbar()

    } catch (err) {
        divMensagem.innerHTML = `<div class="mensagem erro">${err.message}</div>`
    }
})

// Alteração parcial (PATCH): troca só a senha, sem reenviar os demais dados
document.getElementById('formSenha').addEventListener('submit', async (evento) => {
    evento.preventDefault()

    const divMensagem = document.getElementById('mensagemSenha')
    const novaSenha = document.getElementById('novaSenha').value
    const confirmaSenha = document.getElementById('confirmaSenha').value

    if (novaSenha !== confirmaSenha) {
        divMensagem.innerHTML = `<div class="mensagem erro">As senhas não conferem.</div>`
        return
    }

    try {
        const usuarioLogado = getUsuarioLogado()
        await apiFetch(`/usuarios/${usuarioLogado.codUsuario}`, {
            method: 'PATCH',
            body: JSON.stringify({ senha: novaSenha })
        })

        document.getElementById('formSenha').reset()
        divMensagem.innerHTML = `<div class="mensagem sucesso">Senha alterada com sucesso!</div>`

    } catch (err) {
        divMensagem.innerHTML = `<div class="mensagem erro">${err.message}</div>`
    }
})

document.getElementById('cep').addEventListener('blur', () => {
    autocompletarEndereco(
        document.getElementById('cep'),
        document.getElementById('logradouro'),
        document.getElementById('bairro'),
        document.getElementById('localidade'),
        document.getElementById('uf')
    )
})

document.addEventListener('DOMContentLoaded', carregarPerfil)