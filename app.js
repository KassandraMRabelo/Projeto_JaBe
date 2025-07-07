// Variáveis globais
let filtroAtual = 'todos';
let denunciaAtual = null;
// Seleciona elementos
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const modalOverlay = document.getElementById('modal-overlay');

// Função para abrir/fechar menu
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    modalOverlay.classList.toggle('active');
});

// Fecha o menu clicando fora (no overlay)
modalOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    modalOverlay.classList.remove('active');
});
// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    inicializarApp();
});

function inicializarApp() {
    carregarEstatisticas();
    carregarDenuncias();
    configurarEventListeners();
    configurarNavegacao();
}

// Configurar event listeners
function configurarEventListeners() {
    // Menu toggle para mobile
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const modalOverlay = document.getElementById('modal-overlay');
    
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
        modalOverlay.classList.toggle('active');
    });
    
    modalOverlay.addEventListener('click', function() {
        sidebar.classList.remove('open');
        modalOverlay.classList.remove('active');
        fecharDetalhes();
    });
    
    // Filtros
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active de todos os botões
            filterBtns.forEach(b => b.classList.remove('active'));
            // Adiciona active ao botão clicado
            this.classList.add('active');
            
            filtroAtual = this.dataset.filter;
            carregarDenuncias();
        });
    });
    
    // Fechar detalhes
    const closeDetails = document.getElementById('close-details');
    closeDetails.addEventListener('click', fecharDetalhes);
}

// Configurar navegação
function configurarNavegacao() {
    const navItems = document.querySelectorAll('.nav-item a');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active de todos os itens
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            // Adiciona active ao item clicado
            this.parentElement.classList.add('active');
            
            // Esconde todas as seções
            sections.forEach(section => section.classList.remove('active'));
            
            // Mostra a seção correspondente
            const targetSection = this.dataset.section + '-section';
            const section = document.getElementById(targetSection);
            if (section) {
                section.classList.add('active');
            }
            
            // Fecha sidebar no mobile
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('open');
                document.getElementById('modal-overlay').classList.remove('active');
            }
            
            // Carrega mapa se necessário
            if (this.dataset.section === 'mapa') {
                carregarMapa();
            }
        });
    });
}

// Carregar estatísticas
function carregarEstatisticas() {
    const stats = getEstatisticas();
    
    document.getElementById('total-denuncias').textContent = stats.total;
    document.getElementById('pendentes').textContent = stats.pendentes;
    document.getElementById('urgentes').textContent = stats.urgentes;
    document.getElementById('atendidas').textContent = stats.atendidas;
}

// Carregar denúncias
function carregarDenuncias() {
    const container = document.getElementById('denuncias-container');
    const denuncias = filtrarDenuncias(filtroAtual);
    
    if (denuncias.length === 0) {
        container.innerHTML = '<div class="loading">Nenhuma denúncia encontrada</div>';
        return;
    }
    
    container.innerHTML = '';
    
    denuncias.forEach(denuncia => {
        const card = criarCardDenuncia(denuncia);
        container.appendChild(card);
    });
}

// Criar card de denúncia
function criarCardDenuncia(denuncia) {
    const card = document.createElement('div');
    card.className = denuncia-card ${denuncia.status};
    card.dataset.id = denuncia.id;
    
    const statusTexto = {
        'urgente': 'Urgente',
        'nova': 'Nova',
        'em-atendimento': 'Em Atendimento',
        'atendida': 'Atendida'
    };
    
    const dataFormatada = formatarData(denuncia.dataHora);
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-title">${denuncia.nomeVitima}</div>
            <span class="card-status status-${denuncia.status}">${statusTexto[denuncia.status]}</span>
        </div>
        <div class="card-body">
            <div class="card-info">
                <div class="info-item">
                    <i class="fas fa-phone"></i>
                    <span>${denuncia.telefone}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${denuncia.endereco}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>${dataFormatada}</span>
                </div>
            </div>
        </div>
        <div class="card-footer">
            <div class="card-date">${dataFormatada}</div>
            <button class="btn-detalhes" onclick="abrirDetalhes(${denuncia.id})">
                <i class="fas fa-eye"></i> Visualizar Detalhes
            </button>
        </div>
    `;
    
    // Adicionar evento de clique no card
    card.addEventListener('click', function(e) {
        if (!e.target.closest('.btn-detalhes')) {
            abrirDetalhes(denuncia.id);
        }
    });
    
    return card;
}

// Abrir detalhes da denúncia
function abrirDetalhes(id) {
    const denuncia = obterDenuncia(id);
    if (!denuncia) return;
    
    denunciaAtual = denuncia;
    
    const detailsPanel = document.getElementById('details-panel');
    const detailsContent = document.getElementById('details-content');
    
    const statusTexto = {
        'urgente': 'Urgente',
        'nova': 'Nova',
        'em-atendimento': 'Em Atendimento',
        'atendida': 'Atendida'
    };
    
    const dataFormatada = formatarDataCompleta(denuncia.dataHora);
    
    detailsContent.innerHTML = `
        <div class="detail-section">
            <h4><i class="fas fa-user"></i> Dados da Vítima</h4>
            <div class="detail-info">
                <div class="detail-item">
                    <div class="detail-label">Nome Completo</div>
                    <div class="detail-value">${denuncia.nomeVitima}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Telefone</div>
                    <div class="detail-value">${denuncia.telefone}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">CPF</div>
                    <div class="detail-value">${denuncia.cpf || 'Não informado'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Endereço Completo</div>
                    <div class="detail-value">${denuncia.enderecoCompleto}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Data e Hora</div>
                    <div class="detail-value">${dataFormatada}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">
                        <span class="card-status status-${denuncia.status}">${statusTexto[denuncia.status]}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-file-alt"></i> Descrição do Fato</h4>
            <div class="detail-info">
                <div class="detail-item">
                    <div class="detail-value">${denuncia.descricao}</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-map-marked-alt"></i> Localização</h4>
            <div class="detail-info">
                <div class="detail-item">
                    <div class="detail-label">Coordenadas</div>
                    <div class="detail-value">Lat: ${denuncia.latitude}, Lng: ${denuncia.longitude}</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-tools"></i> Ações Disponíveis</h4>
            <div class="actions-grid">
                ${denuncia.status !== 'em-atendimento' ? 
                    '<button class="action-btn btn-atendimento" onclick="alterarStatus(\'em-atendimento\')"><i class="fas fa-play"></i> Em Atendimento</button>' : 
                    '<button class="action-btn btn-atendimento" disabled><i class="fas fa-play"></i> Em Atendimento</button>'
                }
                ${denuncia.status !== 'atendida' ? 
                    '<button class="action-btn btn-finalizar" onclick="alterarStatus(\'atendida\')"><i class="fas fa-check"></i> Finalizar</button>' : 
                    '<button class="action-btn btn-finalizar" disabled><i class="fas fa-check"></i> Finalizada</button>'
                }
                <button class="action-btn btn-repassar" onclick="repassarDenuncia()">
                    <i class="fas fa-share"></i> Repassar
                </button>
                <button class="action-btn btn-cancelar" onclick="cancelarDenuncia()">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button class="action-btn btn-rota" onclick="verRota()">
                    <i class="fas fa-route"></i> Ver Rota no Mapa
                </button>
            </div>
        </div>
    `;
    
    detailsPanel.classList.add('open');
    
    // Adicionar overlay no mobile
    if (window.innerWidth <= 768) {
        document.getElementById('modal-overlay').classList.add('active');
    }
}

// Fechar detalhes
function fecharDetalhes() {
    const detailsPanel = document.getElementById('details-panel');
    detailsPanel.classList.remove('open');
    document.getElementById('modal-overlay').classList.remove('active');
    denunciaAtual = null;
}

// Alterar status da denúncia
function alterarStatus(novoStatus) {
    if (!denunciaAtual) return;
    
    const confirmacao = confirm(Tem certeza que deseja alterar o status para "${novoStatus}"?);
    if (!confirmacao) return;
    
    if (atualizarStatus(denunciaAtual.id, novoStatus)) {
        // Atualizar dados locais
        denunciaAtual.status = novoStatus;
        
        // Recarregar interface
        carregarEstatisticas();
        carregarDenuncias();
        abrirDetalhes(denunciaAtual.id); // Reabrir detalhes atualizados
        
        mostrarNotificacao(Status alterado para "${novoStatus}" com sucesso!, 'success');
    } else {
        mostrarNotificacao('Erro ao alterar status da denúncia.', 'error');
    }
}

// Repassar denúncia
function repassarDenuncia() {
    if (!denunciaAtual) return;
    
    const viatura = prompt('Digite o código da viatura para repassar:');
    if (viatura) {
        mostrarNotificacao(Denúncia repassada para a viatura ${viatura}, 'success');
    }
}

// Cancelar denúncia
function cancelarDenuncia() {
    if (!denunciaAtual) return;
    
    const motivo = prompt('Digite o motivo do cancelamento:');
    if (motivo) {
        const confirmacao = confirm('Tem certeza que deseja cancelar esta denúncia?');
        if (confirmacao) {
            mostrarNotificacao('Denúncia cancelada com sucesso!', 'success');
            fecharDetalhes();
        }
    }
}

// Ver rota no mapa
function verRota() {
    if (!denunciaAtual) return;
    
    const endereco = encodeURIComponent(denunciaAtual.enderecoCompleto);
    const url = https://www.google.com/maps/search/?api=1&query=${endereco};
    window.open(url, '_blank');
}

// Carregar mapa
function carregarMapa() {
    const mapaElement = document.getElementById('mapa');
    
    // Simulação de mapa - em produção seria integrado com Google Maps ou similar
    mapaElement.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <i class="fas fa-map-marked-alt" style="font-size: 3rem; color: #3c2a70; margin-bottom: 1rem;"></i>
            <h3>Mapa Interativo</h3>
            <p>Integração com Google Maps em desenvolvimento...</p>
            <div style="margin-top: 2rem;">
                <p><strong>Denúncias no Mapa:</strong></p>
                <div style="display: flex; justify-content: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
                    <span style="color: #f44336;"><i class="fas fa-map-pin"></i> Urgentes: ${getEstatisticas().urgentes}</span>
                    <span style="color: #3c2a70;"><i class="fas fa-map-pin"></i> Novas: ${getEstatisticas().pendentes}</span>
                    <span style="color: #4caf50;"><i class="fas fa-map-pin"></i> Atendidas: ${getEstatisticas().atendidas}</span>
                </div>
            </div>
        </div>
    `;
}

// Mostrar notificação
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Criar elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.className = notificacao ${tipo};
    notificacao.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: ${tipo === 'success' ? '#4caf50' : tipo === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    
    notificacao.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${mensagem}</span>
        </div>
    `;
    
    document.body.appendChild(notificacao);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notificacao.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notificacao);
        }, 300);
    }, 3000);
}

// Formatação de data
function formatarData(dataHora) {
    const data = new Date(dataHora);
    return data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
}

function formatarDataCompleta(dataHora) {
    const data = new Date(dataHora);
    return data.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) + ' às ' + data.toLocaleTimeString('pt-BR');
}

// Adicionar estilos para animações de notificação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
        
`;
document.head.appendChild(style);

document.getElementById('form-config').addEventListener('submit', function (e) {
  e.preventDefault();

  const tema = document.getElementById('tema').value;
  const notificacoes = document.getElementById('notificacoes').checked;
  const resumo = document.getElementById('exibirResumo').checked;
  const dev = document.getElementById('modoDesenvolvedor').checked;

  const mensagem = `
    Configurações salvas:<br>
    Tema: <strong>${tema}</strong><br>
    Notificações: ${notificacoes ? "ativadas" : "desativadas"}<br>
    Resumo no painel: ${resumo ? "sim" : "não"}<br>
    Modo desenvolvedor: ${dev ? "ativo" : "desativado"}
  `;

  document.getElementById('mensagem-config').innerHTML = mensagem;
});