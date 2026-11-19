const campoCep = document.getElementById('cep')
const campoLogradouro = document.getElementById('logradouro')
const campoBairro = document.getElementById('bairro')
const campoLocalidade = document.getElementById('localidade')
const campoUf = document.getElementById('uf')
const campoCpf = document.getElementById('cpf')

campoCep.addEventListener('blur', () => {
    autocompletarEndereco(campoCep, campoLogradouro, campoBairro, campoLocalidade, campoUf)
})

campoCpf.addEventListener('blur', () => {
    const aviso = document.getElementById('avisoCpf')
    if (campoCpf.value && !validaCpf(campoCpf.value)) {
        aviso.textContent = 'CPF inválido.'
    } else {
        aviso.textContent = ''
    }
})

document.getElementById('formCadastro').addEventListener('submit', async (evento) => {
    evento.preventDefault()

    const divMensagem = document.getElementById('mensagem')

    if (!validaCpf(campoCpf.value)) {
        divMensagem.innerHTML = `<div class="mensagem erro">CPF inválido. Confira os números digitados.</div>`
        return
    }

    const corpo = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        senha: document.getElementById('senha').value,
        telefone: document.getElementById('telefone').value,
        cpf: campoCpf.value,
        cep: campoCep.value,
        logradouro: campoLogradouro.value,
        complemento: document.getElementById('complemento').value,
        bairro: campoBairro.value,
        localidade: campoLocalidade.value,
        uf: campoUf.value,
        numero: document.getElementById('numero').value
    }

    try {
        await apiFetch('/usuarios', {
            method: 'POST',
            body: JSON.stringify(corpo)
        })

        divMensagem.innerHTML = `<div class="mensagem sucesso">Conta criada com sucesso! Redirecionando para o login...</div>`
        setTimeout(() => window.location.href = 'login.html', 1500)

    } catch (err) {
        divMensagem.innerHTML = `<div class="mensagem erro">${err.message}</div>`
    }
})
