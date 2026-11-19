if (!estaLogado()) {
    window.location.href = 'login.html'
}

const classesStatus = {
    PENDENTE_PAGAMENTO: 'pendente',
    PAGO: 'pago',
    ENVIADO: 'enviado',
    ENTREGUE: 'entregue',
    CANCELADO: 'cancelado',
    EM_TRANSITO: 'transito',
    SAIU_PARA_ENTREGA: 'enviado',
    EXTRAVIADO: 'extraviado'
}

async function carregarPedidos() {
    const div = document.getElementById('listaPedidos')

    try {
        const pedidos = await apiFetch('/pedidos/meus-pedidos')

        if (pedidos.length === 0) {
            div.innerHTML = `<p class="vazio">Você ainda não fez nenhum pedido. <a href="index.html">Ver produtos</a></p>`
            return
        }

        div.innerHTML = pedidos.map((pedido) => {
            const itensHtml = pedido.itensPedido.map((item) => `
                <tr>
                    <td>${item.produtoItem ? item.produtoItem.nome : 'Produto removido'}</td>
                    <td>${item.quantidade}</td>
                    <td>R$ ${Number(item.precoUnitario).toFixed(2)}</td>
                    <td>R$ ${Number(item.valorTotalItem).toFixed(2)}</td>
                </tr>
            `).join('')

            const statusEntrega = pedido.entregaPedido ? pedido.entregaPedido.statusEntrega : null

            return `
                <div class="tabela-wrap" style="margin-bottom:20px;">
                    <div style="padding:14px 16px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                        <div>
                            <strong>Pedido #${pedido.codPedido}</strong><br>
                            <small>${new Date(pedido.dataPedido).toLocaleString('pt-BR')}</small>
                        </div>
                        <div>
                            <span class="tag-status ${classesStatus[pedido.status] || ''}">${pedido.status}</span>
                            ${statusEntrega ? `<span class="tag-status ${classesStatus[statusEntrega] || ''}">${statusEntrega}</span>` : ''}
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr><th>Produto</th><th>Qtd.</th><th>Preço un.</th><th>Subtotal</th></tr>
                        </thead>
                        <tbody>${itensHtml}</tbody>
                    </table>
                    <div style="padding:12px 16px; text-align:right;">
                        <strong>Total: R$ ${Number(pedido.valorTotal).toFixed(2)}</strong>
                    </div>
                </div>
            `
        }).join('')

    } catch (err) {
        div.innerHTML = `<p class="vazio">${err.message}</p>`
    }
}

document.addEventListener('DOMContentLoaded', carregarPedidos)
