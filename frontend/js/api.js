
// Frontend e backend rodam juntos em http://localhost:3000 (o backend serve a pasta frontend).
// Quando a página é servida pelo próprio backend (porta 3000), as chamadas usam a mesma origem.
// Se você abrir os HTMLs por outro servidor (ex: Live Server), cai no fallback http://localhost:3000.
const API_URL = (window.location.port === '3000') ? '' : 'http://localhost:3000'

async function apiFetch(rota, opcoes = {}) {
    const token = localStorage.getItem('token')

    const headers = {
        'Content-Type': 'application/json',
        ...(opcoes.headers || {})
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const resposta = await fetch(`${API_URL}${rota}`, { ...opcoes, headers })

    if (resposta.status === 401 && token) {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
    }

    const dados = await resposta.json().catch(() => ({}))

    if (!resposta.ok) {
        throw new Error(dados.erro || 'Ocorreu um erro na requisição.')
    }

    return dados
}
