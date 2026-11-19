// Página protegida: só ADMIN pode acessar
if (!estaLogado() || !ehAdmin()) {
    window.location.href = 'index.html'
}

let categoriasCache = []
let graficoVendas = null
let graficoEstoque = null

// ---------- CONTROLE DE ABAS ----------
document.querySelectorAll('.abas button').forEach((botao) => {
    botao.addEventListener('click', () => {
        document.querySelectorAll('.abas button').forEach((b) => b.classList.remove('ativa'))
        document.querySelectorAll('.painel-secao').forEach((s) => s.classList.remove('ativa'))

        botao.classList.add('ativa')
        document.getElementById(botao.dataset.aba).classList.add('ativa')

        if (botao.dataset.aba === 'abaRelatorios') carregarRelatorios()
        if (botao.dataset.aba === 'abaPedidos') carregarPedidosAdmin()
        if (botao.dataset.aba === 'abaEstoque') carregarEstoque()
        if (botao.dataset.aba === 'abaProfissionais') carregarProfissionaisAdmin()
        if (botao.dataset.aba === 'abaServicos') carregarServicosAdmin()
        if (botao.dataset.aba === 'abaAgendamentos') carregarAgendamentosAdmin()
    })
})

function mostrarMensagem(texto, tipo = 'sucesso') {
    const div = document.getElementById('mensagem')
    div.innerHTML = `<div class="mensagem ${tipo}">${texto}</div>`
    setTimeout(() => { div.innerHTML = '' }, 3000)
}

// ---------- CATEGORIAS (usadas nos selects) ----------
async function carregarCategoriasSelect() {
    categoriasCache = await apiFetch('/categorias')
    const select = document.getElementById('produtoCategoria')
    select.innerHTML = categoriasCache.map((c) => `<option value="${c.codCategoria}">${c.nome}</option>`).join('')
}

// ---------- PRODUTOS ----------
async function carregarProdutosAdmin() {
    const produtos = await apiFetch('/produtos')
    const corpo = document.getElementById('corpoTabelaProdutos')

    corpo.innerHTML = produtos.map((p) => `
        <tr>
            <td>${p.codProduto}</td>
            <td>${p.nome}</td>
            <td>${p.categoriaProduto ? p.categoriaProduto.nome : ''}</td>
            <td>R$ ${Number(p.preco).toFixed(2)}</td>
            <td>${p.estoqueProduto ? p.estoqueProduto.quantidade_atual : 0}</td>
            <td>
                <button class="btn btn-secundario" onclick='editarProduto(${JSON.stringify(p)})'>Editar</button>
                <button class="btn btn-perigo" onclick="apagarProduto(${p.codProduto})">Excluir</button>
            </td>
        </tr>
    `).join('')

    // Também alimenta o select de produtos da aba de estoque
    const selectEstoque = document.getElementById('estoqueProduto')
    selectEstoque.innerHTML = produtos.map((p) => `<option value="${p.codProduto}">${p.nome}</option>`).join('')
}

// ---------- IMAGEM DO PRODUTO (upload) ----------
const inputImagemArquivo = document.getElementById('produtoImagemArquivo')
const previewImagemProduto = document.getElementById('previewImagemProduto')

function mostrarPreviewImagem(src) {
    if (src) {
        previewImagemProduto.src = src.startsWith('/uploads') ? `${API_URL}${src}` : src
        previewImagemProduto.style.display = 'block'
    } else {
        previewImagemProduto.removeAttribute('src')
        previewImagemProduto.style.display = 'none'
    }
}

inputImagemArquivo.addEventListener('change', () => {
    const arquivo = inputImagemArquivo.files[0]
    mostrarPreviewImagem(arquivo ? URL.createObjectURL(arquivo) : document.getElementById('produtoImagem').value)
})

document.getElementById('produtoImagem').addEventListener('input', (evento) => {
    if (!inputImagemArquivo.files[0]) mostrarPreviewImagem(evento.target.value)
})

document.getElementById('formProduto').addEventListener('reset', () => {
    setTimeout(() => mostrarPreviewImagem(''), 0)
})

async function enviarImagemProduto(arquivo) {
    const formData = new FormData()
    formData.append('imagem', arquivo)

    const resposta = await fetch(`${API_URL}/produtos/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
    })

    const dados = await resposta.json().catch(() => ({}))

    if (!resposta.ok) {
        throw new Error(dados.erro || 'Erro ao enviar a imagem.')
    }

    return dados.imagem_url
}

function editarProduto(produto) {
    document.getElementById('tituloFormProduto').textContent = `Editando: ${produto.nome}`
    document.getElementById('produtoId').value = produto.codProduto
    document.getElementById('produtoNome').value = produto.nome
    document.getElementById('produtoCategoria').value = produto.idCategoria
    document.getElementById('produtoDescricao').value = produto.descricao || ''
    document.getElementById('produtoPreco').value = produto.preco
    document.getElementById('produtoImagem').value = produto.imagem_url || ''
    inputImagemArquivo.value = ''
    mostrarPreviewImagem(produto.imagem_url)
    document.getElementById('campoEstoqueInicial').style.display = 'none'
    document.getElementById('btnCancelarEdicao').style.display = 'inline-block'
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

document.getElementById('btnCancelarEdicao').addEventListener('click', () => {
    document.getElementById('formProduto').reset()
    document.getElementById('produtoId').value = ''
    document.getElementById('tituloFormProduto').textContent = 'Novo produto'
    document.getElementById('campoEstoqueInicial').style.display = 'block'
    document.getElementById('btnCancelarEdicao').style.display = 'none'
})

document.getElementById('formProduto').addEventListener('submit', async (evento) => {
    evento.preventDefault()

    const id = document.getElementById('produtoId').value
    const corpo = {
        idCategoria: document.getElementById('produtoCategoria').value,
        nome: document.getElementById('produtoNome').value,
        descricao: document.getElementById('produtoDescricao').value,
        preco: document.getElementById('produtoPreco').value,
        imagem_url: document.getElementById('produtoImagem').value
    }

    try {
        // Se escolheu um arquivo, envia a imagem primeiro e usa o caminho devolvido
        const arquivo = inputImagemArquivo.files[0]
        if (arquivo) {
            corpo.imagem_url = await enviarImagemProduto(arquivo)
        }

        if (id) {
            await apiFetch(`/produtos/${id}`, { method: 'PUT', body: JSON.stringify(corpo) })
            mostrarMensagem('Produto atualizado com sucesso!')
        } else {
            corpo.quantidade_atual = document.getElementById('produtoEstoqueInicial').value
            await apiFetch('/produtos', { method: 'POST', body: JSON.stringify(corpo) })
            mostrarMensagem('Produto cadastrado com sucesso!')
        }

        document.getElementById('btnCancelarEdicao').click()
        carregarProdutosAdmin()

    } catch (err) {
        mostrarMensagem(err.message, 'erro')
    }
})

async function apagarProduto(id) {
    if (!confirm('Tem certeza que deseja excluir esse produto?')) return

    try {
        await apiFetch(`/produtos/${id}`, { method: 'DELETE' })
        mostrarMensagem('Produto removido com sucesso!')
        carregarProdutosAdmin()
    } catch (err) {
        mostrarMensagem(err.message, 'erro')
    }
}

// ---------- ESTOQUE ----------
async function carregarEstoque() {
    const estoques = await apiFetch('/estoque')
    const corpo = document.getElementById('corpoTabelaEstoque')

    corpo.innerHTML = estoques.map((e) => `
        <tr>
            <td>${e.produtoEstoque ? e.produtoEstoque.nome : ''}</td>
            <td>${e.quantidade_atual}</td>
            <td>${e.quantidade_minima}</td>
        </tr>
    `).join('')
}

document.getElementById('formEstoque').addEventListener('submit', async (evento) => {
    evento.preventDefault()

    const corpo = {
        idProduto: document.getElementById('estoqueProduto').value,
        tipoMovimento: document.getElementById('estoqueTipo').value,
        quantidade: document.getElementById('estoqueQuantidade').value
    }

    try {
        await apiFetch('/estoque', { method: 'POST', body: JSON.stringify(corpo) })
        mostrarMensagem('Estoque atualizado com sucesso!')
        document.getElementById('formEstoque').reset()
        carregarEstoque()
        carregarProdutosAdmin()
    } catch (err) {
        mostrarMensagem(err.message, 'erro')
    }
})

// ---------- PEDIDOS ----------
async function carregarPedidosAdmin() {
    const pedidos = await apiFetch('/pedidos')
    const corpo = document.getElementById('corpoTabelaPedidos')

    corpo.innerHTML = pedidos.map((p) => `
        <tr>
            <td>${p.codPedido}</td>
            <td>${p.usuarioPedido ? p.usuarioPedido.nome : ''}</td>
            <td>${new Date(p.dataPedido).toLocaleDateString('pt-BR')}</td>
            <td>R$ ${Number(p.valorTotal).toFixed(2)}</td>
            <td>
                <select onchange="atualizarStatusPedido(${p.codPedido}, this.value, 'status')">
                    ${['PENDENTE_PAGAMENTO', 'PAGO', 'ENVIADO', 'ENTREGUE', 'CANCELADO']
                        .map((s) => `<option value="${s}" ${s === p.status ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </td>
            <td>
                ${p.entregaPedido ? `
                <select onchange="atualizarStatusPedido(${p.codPedido}, this.value, 'statusEntrega')">
                    ${['EM_TRANSITO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'EXTRAVIADO']
                        .map((s) => `<option value="${s}" ${s === p.entregaPedido.statusEntrega ? 'selected' : ''}>${s}</option>`).join('')}
                </select>` : '-'}
            </td>
            <td>-</td>
        </tr>
    `).join('')
}

async function atualizarStatusPedido(idPedido, valor, campo) {
    try {
        await apiFetch(`/pedidos/${idPedido}`, {
            method: 'PATCH',
            body: JSON.stringify({ [campo]: valor })
        })
        mostrarMensagem('Status do pedido atualizado!')
    } catch (err) {
        mostrarMensagem(err.message, 'erro')
    }
}

// ---------- PROFISSIONAIS ----------
async function carregarProfissionaisAdmin() {
    const profissionais = await apiFetch('/profissionais')
    const corpo = document.getElementById('corpoTabelaProfissionais')

    corpo.innerHTML = profissionais.map((p) => `
        <tr>
            <td>${p.codProfissional}</td>
            <td>${p.nome}</td>
            <td>${p.especialidade}</td>
            <td>${p.localizacaoProfissional ? p.localizacaoProfissional.localidade : ''}</td>
            <td>R$ ${Number(p.preco_base).toFixed(2)}</td>
            <td>${p.avaliacaoMedia !== null ? `★ ${p.avaliacaoMedia.toFixed(1)} (${p.totalAvaliacoes})` : '-'}</td>
            <td>
                <button class="btn btn-secundario" onclick='editarProfissional(${JSON.stringify(p)})'>Editar</button>
                <button class="btn btn-perigo" onclick="apagarProfissional(${p.codProfissional})">Excluir</button>
            </td>
        </tr>
    `).join('')

    // Também alimenta o select de profissionais da aba de serviços
    const selectServico = document.getElementById('servicoProfissional')
    selectServico.innerHTML = profissionais.map((p) => `<option value="${p.codProfissional}">${p.nome}</option>`).join('')
}

function editarProfissional(p) {
    document.getElementById('tituloFormProfissional').textContent = `Editando: ${p.nome}`
    document.getElementById('profissionalId').value = p.codProfissional
    document.getElementById('profissionalNome').value = p.nome
    document.getElementById('profissionalEspecialidade').value = p.especialidade
    document.getElementById('profissionalPrecoBase').value = p.preco_base
    document.getElementById('profissionalBio').value = p.bio || ''
    document.getElementById('profissionalFoto').value = p.foto_url || ''

    if (p.localizacaoProfissional) {
        document.getElementById('profissionalCep').value = p.localizacaoProfissional.cep
        document.getElementById('profissionalNumero').value = p.localizacaoProfissional.numero
        document.getElementById('profissionalLogradouro').value = p.localizacaoProfissional.logradouro
        document.getElementById('profissionalBairro').value = p.localizacaoProfissional.bairro
        document.getElementById('profissionalLocalidade').value = p.localizacaoProfissional.localidade
        document.getElementById('profissionalUf').value = p.localizacaoProfissional.uf
        document.getElementById('profissionalLatitude').value = p.localizacaoProfissional.latitude || ''
        document.getElementById('profissionalLongitude').value = p.localizacaoProfissional.longitude || ''
    }

    document.getElementById('btnCancelarEdicaoProfissional').style.display = 'inline-block'
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

document.getElementById('btnCancelarEdicaoProfissional').addEventListener('click', () => {
    document.getElementById('formProfissional').reset()
    document.getElementById('profissionalId').value = ''
    document.getElementById('tituloFormProfissional').textContent = 'Novo profissional'
    document.getElementById('btnCancelarEdicaoProfissional').style.display = 'none'
})

// Autocompleta o endereço do profissional assim que o CEP é preenchido
document.getElementById('profissionalCep').addEventListener('blur', () => {
    autocompletarEndereco(
        document.getElementById('profissionalCep'),
        document.getElementById('profissionalLogradouro'),
        document.getElementById('profissionalBairro'),
        document.getElementById('profissionalLocalidade'),
        document.getElementById('profissionalUf')
    )
})

document.getElementById('formProfissional').addEventListener('submit', async (evento) => {
    evento.preventDefault()

    const id = document.getElementById('profissionalId').value
    const corpo = {
        nome: document.getElementById('profissionalNome').value,
        especialidade: document.getElementById('profissionalEspecialidade').value,
        preco_base: document.getElementById('profissionalPrecoBase').value,
        bio: document.getElementById('profissionalBio').value,
        foto_url: document.getElementById('profissionalFoto').value,
        cep: document.getElementById('profissionalCep').value,
        numero: document.getElementById('profissionalNumero').value,
        logradouro: document.getElementById('profissionalLogradouro').value,
        bairro: document.getElementById('profissionalBairro').value,
        localidade: document.getElementById('profissionalLocalidade').value,
        uf: document.getElementById('profissionalUf').value,
        latitude: document.getElementById('profissionalLatitude').value || null,
        longitude: document.getElementById('profissionalLongitude').value || null
    }

    try {
        if (id) {
            await apiFetch(`/profissionais/${id}`, { method: 'PUT', body: JSON.stringify(corpo) })
            mostrarMensagem('Profissional atualizado com sucesso!')
        } else {
            await apiFetch('/profissionais', { method: 'POST', body: JSON.stringify(corpo) })
            mostrarMensagem('Profissional cadastrado com sucesso!')
        }

        document.getElementById('btnCancelarEdicaoProfissional').click()
        carregarProfissionaisAdmin()

    } catch (err) {
        mostrarMensagem(err.message, 'erro')
    }
})

async function apagarProfissional(id) {
    if (!confirm('Tem certeza que deseja excluir esse profissional?')) return

    try {
        await apiFetch(`/profissionais/${id}`, { method: 'DELETE' })
        mostrarMensagem('Profissional removido com sucesso!')
        carregarProfissionaisAdmin()
    } catch (err) {
        mostrarMensagem(err.message, 'erro')
    }
}

// ---------- SERVIÇOS ----------
async function carregarServicosAdmin() {
    // Garante que o select de profissionais já esteja preenchido
    if (document.getElementById('servicoProfissional').options.length === 0) {
        await carregarProfissionaisAdmin()
    }

    const servicos = await apiFetch('/servicos')
    const corpo = document.getElementById('corpoTabelaServicos')

    corpo.innerHTML = servicos.map((s) => `
        <tr>
            <td>${s.codServico}</td>
            <td>${s.nome}</td>
            <td>${s.profissionalServico ? s.profissionalServico.nome : ''}</td>
            <td>R$ ${Number(s.preco).toFixed(2)}</td>
            <td>${s.duracao_minutos} min</td>
            <td>
                <button class="btn btn-secundario" onclick='editarServico(${JSON.stringify(s)})'>Editar</button>
                <button class="btn btn-perigo" onclick="apagarServico(${s.codServico})">Excluir</button>
            </td>
        </tr>
    `).join('')
}

function editarServico(s) {
    document.getElementById('tituloFormServico').textContent = `Editando: ${s.nome}`
    document.getElementById('servicoId').value = s.codServico
    document.getElementById('servicoProfissional').value = s.idProfissional
    document.getElementById('servicoNome').value = s.nome
    document.getElementById('servicoDescricao').value = s.descricao || ''
    document.getElementById('servicoPreco').value = s.preco
    document.getElementById('servicoDuracao').value = s.duracao_minutos
    document.getElementById('btnCancelarEdicaoServico').style.display = 'inline-block'
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

document.getElementById('btnCancelarEdicaoServico').addEventListener('click', () => {
    document.getElementById('formServico').reset()
    document.getElementById('servicoId').value = ''
    document.getElementById('tituloFormServico').textContent = 'Novo serviço'
    document.getElementById('btnCancelarEdicaoServico').style.display = 'none'
})

document.getElementById('formServico').addEventListener('submit', async (evento) => {
    evento.preventDefault()

    const id = document.getElementById('servicoId').value
    const corpo = {
        idProfissional: document.getElementById('servicoProfissional').value,
        nome: document.getElementById('servicoNome').value,
        descricao: document.getElementById('servicoDescricao').value,
        preco: document.getElementById('servicoPreco').value,
        duracao_minutos: document.getElementById('servicoDuracao').value
    }

    try {
        if (id) {
            await apiFetch(`/servicos/${id}`, { method: 'PUT', body: JSON.stringify(corpo) })
            mostrarMensagem('Serviço atualizado com sucesso!')
        } else {
            await apiFetch('/servicos', { method: 'POST', body: JSON.stringify(corpo) })
            mostrarMensagem('Serviço cadastrado com sucesso!')
        }

        document.getElementById('btnCancelarEdicaoServico').click()
        carregarServicosAdmin()

    } catch (err) {
        mostrarMensagem(err.message, 'erro')
    }
})

async function apagarServico(id) {
    if (!confirm('Tem certeza que deseja excluir esse serviço?')) return

    try {
        await apiFetch(`/servicos/${id}`, { method: 'DELETE' })
        mostrarMensagem('Serviço removido com sucesso!')
        carregarServicosAdmin()
    } catch (err) {
        mostrarMensagem(err.message, 'erro')
    }
}

// ---------- AGENDAMENTOS ----------
async function carregarAgendamentosAdmin() {
    const agendamentos = await apiFetch('/agendamentos')
    const corpo = document.getElementById('corpoTabelaAgendamentos')

    corpo.innerHTML = agendamentos.map((ag) => {
        const servico = ag.servicoAgendamento
        const profissional = servico ? servico.profissionalServico : null
        const dataFormatada = new Date(ag.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

        return `
            <tr>
                <td>${ag.codAgendamento}</td>
                <td>${ag.usuarioAgendamento ? ag.usuarioAgendamento.nome : ''}</td>
                <td>${servico ? servico.nome : ''}</td>
                <td>${profissional ? profissional.nome : ''}</td>
                <td>${dataFormatada}</td>
                <td>
                    <select onchange="atualizarStatusAgendamento(${ag.codAgendamento}, this.value)">
                        ${['SOLICITADO', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO']
                            .map((s) => `<option value="${s}" ${s === ag.status ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </td>
            </tr>
        `
    }).join('')
}

async function atualizarStatusAgendamento(idAgendamento, status) {
    try {
        await apiFetch(`/agendamentos/${idAgendamento}`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        })
        mostrarMensagem('Status do agendamento atualizado!')
    } catch (err) {
        mostrarMensagem(err.message, 'erro')
    }
}

// ---------- RELATÓRIOS (Chart.js) ----------
async function carregarRelatorios() {
    const vendas = await apiFetch('/relatorios/vendas')
    const estoque = await apiFetch('/relatorios/estoque')

    if (graficoVendas) graficoVendas.destroy()
    if (graficoEstoque) graficoEstoque.destroy()

    graficoVendas = new Chart(document.getElementById('graficoVendas'), {
        type: 'bar',
        data: {
            labels: vendas.map((v) => v.categoria),
            datasets: [{
                label: 'Total vendido (R$)',
                data: vendas.map((v) => v.totalVendido),
                backgroundColor: '#6d1b34'
            }]
        },
        options: { responsive: true }
    })

    graficoEstoque = new Chart(document.getElementById('graficoEstoque'), {
        type: 'bar',
        data: {
            labels: estoque.map((e) => e.produto),
            datasets: [{
                label: 'Quantidade atual',
                data: estoque.map((e) => e.quantidade_atual),
                backgroundColor: '#e0637a'
            }]
        },
        options: { responsive: true }
    })
}

document.addEventListener('DOMContentLoaded', () => {
    carregarCategoriasSelect().then(carregarProdutosAdmin)
})