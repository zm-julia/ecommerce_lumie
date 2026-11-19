if (!estaLogado()) {
    window.location.href = 'login.html'
}

const classesStatusAgendamento = {
    SOLICITADO: 'pendente',
    CONFIRMADO: 'transito',
    CONCLUIDO: 'entregue',
    CANCELADO: 'cancelado'
}

async function carregarAgendamentos() {
    const div = document.getElementById('listaAgendamentos')

    try {
        const agendamentos = await apiFetch('/agendamentos/meus-agendamentos')

        if (agendamentos.length === 0) {
            div.innerHTML = `<p class="vazio">Você ainda não tem agendamentos. <a href="profissionais.html">Encontrar um profissional</a></p>`
            return
        }

        div.innerHTML = agendamentos.map((ag) => montarCardAgendamento(ag)).join('')

    } catch (err) {
        div.innerHTML = `<p class="vazio">${err.message}</p>`
    }
}

function montarCardAgendamento(ag) {
    const servico = ag.servicoAgendamento
    const profissional = servico ? servico.profissionalServico : null
    const dataFormatada = new Date(ag.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

    const podeCancel = ag.status === 'SOLICITADO' || ag.status === 'CONFIRMADO'
    const podeAvaliar = ag.status === 'CONCLUIDO' && !ag.avaliacaoAgendamento

    let botoes = ''
    if (podeCancel) {
        botoes += `<button class="btn btn-secundario" onclick="cancelarAgendamento(${ag.codAgendamento})">Cancelar</button>`
    }
    if (podeAvaliar) {
        botoes += `<button class="btn btn-primario" onclick="abrirModalAvaliacao(${ag.codAgendamento})">Avaliar</button>`
    }
    if (ag.avaliacaoAgendamento) {
        botoes += `<span style="font-size:0.85rem; color:var(--texto-claro);">Você avaliou: ${'★'.repeat(ag.avaliacaoAgendamento.nota)}</span>`
    }

    return `
        <div class="card-servico">
            <div>
                <strong>${servico ? servico.nome : 'Serviço removido'}</strong><br>
                <span style="font-size:0.85rem; color:var(--texto-claro);">
                    ${profissional ? profissional.nome : ''} · ${dataFormatada}
                </span>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <span class="tag-status ${classesStatusAgendamento[ag.status] || ''}">${ag.status}</span>
                ${botoes}
            </div>
        </div>
    `
}

async function cancelarAgendamento(idAgendamento) {
    if (!confirm('Tem certeza que deseja cancelar esse agendamento?')) return

    try {
        await apiFetch(`/agendamentos/${idAgendamento}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'CANCELADO' })
        })
        carregarAgendamentos()
    } catch (err) {
        alert(err.message)
    }
}

// Abre um modal simples pra escolher a nota (1 a 5) e escrever um comentário
function abrirModalAvaliacao(idAgendamento) {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.id = 'modalAvaliacao'
    overlay.innerHTML = `
        <div class="modal-conteudo">
            <button class="modal-fechar" onclick="document.getElementById('modalAvaliacao').remove()">✕</button>
            <h3>Avaliar atendimento</h3>
            <div id="mensagemAvaliacao"></div>
            <form id="formAvaliacao">
                <div class="campo">
                    <label for="notaAvaliacao">Nota</label>
                    <select id="notaAvaliacao" required>
                        <option value="5">★★★★★ Excelente</option>
                        <option value="4">★★★★☆ Muito bom</option>
                        <option value="3">★★★☆☆ Bom</option>
                        <option value="2">★★☆☆☆ Regular</option>
                        <option value="1">★☆☆☆☆ Ruim</option>
                    </select>
                </div>
                <div class="campo">
                    <label for="comentarioAvaliacao">Comentário (opcional)</label>
                    <textarea id="comentarioAvaliacao" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primario btn-bloco">Enviar avaliação</button>
            </form>
        </div>
    `
    document.body.appendChild(overlay)

    document.getElementById('formAvaliacao').addEventListener('submit', (evento) => {
        enviarAvaliacao(evento, idAgendamento)
    })
}

async function enviarAvaliacao(evento, idAgendamento) {
    evento.preventDefault()

    const nota = document.getElementById('notaAvaliacao').value
    const comentario = document.getElementById('comentarioAvaliacao').value
    const divMensagem = document.getElementById('mensagemAvaliacao')

    try {
        await apiFetch('/avaliacoes', {
            method: 'POST',
            body: JSON.stringify({ idAgendamento, nota: Number(nota), comentario })
        })

        divMensagem.innerHTML = `<div class="mensagem sucesso">Avaliação enviada. Obrigado!</div>`
        setTimeout(() => {
            document.getElementById('modalAvaliacao').remove()
            carregarAgendamentos()
        }, 1000)

    } catch (err) {
        divMensagem.innerHTML = `<div class="mensagem erro">${err.message}</div>`
    }
}

document.addEventListener('DOMContentLoaded', carregarAgendamentos)
