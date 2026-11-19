document.getElementById('formLogin').addEventListener('submit', async (evento) => {
    evento.preventDefault()

    const email = document.getElementById('email').value
    const senha = document.getElementById('senha').value
    const divMensagem = document.getElementById('mensagem')

    try {
        const resultado = await apiFetch('/login', {
            method: 'POST',
            body: JSON.stringify({ email, senha })
        })

        localStorage.setItem('token', resultado.token)
        localStorage.setItem('usuario', JSON.stringify(resultado.usuario))

        window.location.href = 'index.html'

    } catch (err) {
        divMensagem.innerHTML = `<div class="mensagem erro">${err.message}</div>`
    }
})
