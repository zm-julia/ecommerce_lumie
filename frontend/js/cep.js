async function autocompletarEndereco(campoCep, campoLogradouro, campoBairro, campoLocalidade, campoUf) {
    const cep = campoCep.value.replace(/[^\d]/g, '')

    if (cep.length !== 8) {
        return
    }

    try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const dados = await resposta.json()

        if (dados.erro) {
            alert('CEP não encontrado.')
            return
        }

        campoLogradouro.value = dados.logradouro
        campoBairro.value = dados.bairro
        campoLocalidade.value = dados.localidade
        campoUf.value = dados.uf

    } catch (err) {
        console.error('Erro ao consultar o ViaCEP:', err)
        alert('Não foi possível consultar o CEP agora. Tente novamente.')
    }
}
