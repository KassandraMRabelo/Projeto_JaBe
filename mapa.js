// Funcionalidades do mapa
let mapaInicializado = false;

// Inicializar mapa (simulação)
function inicializarMapa() {
    if (mapaInicializado) return;
    
    const mapaElement = document.getElementById('mapa');
    if (!mapaElement) return;
    
    // Criar interface do mapa simulado
    mapaElement.innerHTML = `
        <div class="mapa-simulado">
            <div class="mapa-header">
                <h3><i class="fas fa-map-marked-alt"></i> Mapa de Denúncias em Tempo Real</h3>
                <div class="mapa-controles">
                    <button class="btn-mapa" onclick="centralizarMapa()">
                        <i class="fas fa-crosshairs"></i> Centralizar
                    </button>
                    <button class="btn-mapa" onclick="atualizarMapa()">
                        <i class="fas fa-sync-alt"></i> Atualizar
                    </button>
                </div>
            </div>
            
            <div class="mapa-legenda">
                <div class="legenda-item">
                    <span class="pin urgente"></span> Urgente
                </div>
                <div class="legenda-item">
                    <span class="pin nova"></span> Nova
                </div>
                <div class="legenda-item">
                    <span class="pin em-atendimento"></span> Em Atendimento
                </div>
                <div class="legenda-item">
                    <span class="pin atendida"></span> Atendida
                </div>
            </div>
            
            <div class="mapa-canvas" id="mapa-canvas">
                <div class="mapa-background">
                    <div class="grid-lines"></div>
                    <div class="denuncias-pins" id="denuncias-pins">
                        <!-- Pins serão inseridos aqui -->
                    </div>
                </div>
            </div>
            
            <div class="mapa-info" id="mapa-info">
                <div class="info-content">
                    <p>Clique em um pin para ver detalhes da denúncia</p>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar estilos específicos do mapa
    adicionarEstilosMapa();
    
    // Carregar pins das denúncias
    carregarPinsDenuncias();
    
    mapaInicializado = true;
}

// Adicionar estilos específicos do mapa
function adicionarEstilosMapa() {
    const style = document.createElement('style');
    style.textContent = `
        .mapa-simulado {
            height: 100%;
            display: flex;
            flex-direction: column;
            background: white;
        }
        
        .mapa-header {
            padding: 1rem;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8f9fa;
        }
        
        .mapa-header h3 {
            margin: 0;
            color: #3c2a70;
            font-size: 1.1rem;
        }
        
        .mapa-controles {
            display: flex;
            gap: 0.5rem;
        }
        
        .btn-mapa {
            padding: 0.5rem 1rem;
            border: 1px solid #ddd;
            background: white;
            color: #666;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        }
        
        .btn-mapa:hover {
            background: #3c2a70;
            color: white;
            border-color: #3c2a70;
        }
        
        .mapa-legenda {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid #eee;
            display: flex;
            gap: 1.5rem;
            background: #fafafa;
            flex-wrap: wrap;
        }
        
        .legenda-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            color: #666;
        }
        
        .pin {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        
        .pin.urgente { background: #f44336; }
        .pin.nova { background: #3c2a70; }
        .pin.em-atendimento { background: #ff9800; }
        .pin.atendida { background: #4caf50; }
        
        .mapa-canvas {
            flex: 1;
            position: relative;
            overflow: hidden;
            background: linear-gradient(45deg, #e8f4f8 25%, transparent 25%), 
                        linear-gradient(-45deg, #e8f4f8 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #e8f4f8 75%), 
                        linear-gradient(-45deg, transparent 75%, #e8f4f8 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
        
        .mapa-background {
            width: 100%;
            height: 100%;
            position: relative;
            background: linear-gradient(to bottom, #87CEEB 0%, #98FB98 100%);
        }
        
        .denuncias-pins {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        
        .denuncia-pin {
            position: absolute;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            z-index: 10;
        }
        
        .denuncia-pin:hover {
            transform: scale(1.3);
            z-index: 20;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        
        .denuncia-pin.urgente { background: #f44336; }
        .denuncia-pin.nova { background: #3c2a70; }
        .denuncia-pin.em-atendimento { background: #ff9800; }
        .denuncia-pin.atendida { background: #4caf50; }
        
        .mapa-info {
            padding: 1rem;
            border-top: 1px solid #eee;
            background: #f8f9fa;
            min-height: 60px;
        }
        
        .info-content {
            color: #666;
            font-size: 0.9rem;
        }
        
        .pin-tooltip {
            position: absolute;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            pointer-events: none;
            z-index: 1000;
            max-width: 200px;
            transform: translate(-50%, -100%);
            margin-top: -10px;
        }
        
        .pin-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 5px solid transparent;
            border-top-color: rgba(0,0,0,0.8);
        }
        
        @media (max-width: 768px) {
            .mapa-header {
                flex-direction: column;
                gap: 0.5rem;
                align-items: stretch;
            }
            
            .mapa-controles {
                justify-content: center;
            }
            
            .mapa-legenda {
                justify-content: center;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Carregar pins das denúncias no mapa
function carregarPinsDenuncias() {
    const pinsContainer = document.getElementById('denuncias-pins');
    if (!pinsContainer) return;
    
    pinsContainer.innerHTML = '';
    
    denunciasData.forEach((denuncia, index) => {
        const pin = document.createElement('div');
        pin.className = `denuncia-pin ${denuncia.status}`;
        pin.dataset.id = denuncia.id;
        
        // Posicionamento simulado (em produção seria baseado nas coordenadas reais)
        const x = 10 + (index % 5) * 18 + Math.random() * 10;
        const y = 10 + Math.floor(index / 5) * 15 + Math.random() * 10;
        
        pin.style.left = x + '%';
        pin.style.top = y + '%';
        
        // Eventos do pin
        pin.addEventListener('click', function() {
            mostrarInfoDenuncia(denuncia);
        });
        
        pin.addEventListener('mouseenter', function(e) {
            mostrarTooltip(e, denuncia);
        });
        
        pin.addEventListener('mouseleave', function() {
            removerTooltip();
        });
        
        pinsContainer.appendChild(pin);
    });
}

// Mostrar informações da denúncia no mapa
function mostrarInfoDenuncia(denuncia) {
    const infoElement = document.getElementById('mapa-info');
    if (!infoElement) return;
    
    const statusTexto = {
        'urgente': 'Urgente',
        'nova': 'Nova',
        'em-atendimento': 'Em Atendimento',
        'atendida': 'Atendida'
    };
    
    infoElement.innerHTML = `
        <div class="info-content">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                <div>
                    <strong>${denuncia.nomeVitima}</strong>
                    <span class="card-status status-${denuncia.status}" style="margin-left: 0.5rem; font-size: 0.8rem;">
                        ${statusTexto[denuncia.status]}
                    </span>
                </div>
                <button class="btn-mapa" onclick="abrirDetalhes(${denuncia.id})" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">
                    Ver Detalhes
                </button>
            </div>
            <div style="font-size: 0.85rem; color: #666;">
                <div><i class="fas fa-map-marker-alt"></i> ${denuncia.endereco}</div>
                <div><i class="fas fa-clock"></i> ${formatarData(denuncia.dataHora)}</div>
            </div>
        </div>
    `;
}

// Mostrar tooltip
function mostrarTooltip(event, denuncia) {
    removerTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'pin-tooltip';
    tooltip.innerHTML = `
        <strong>${denuncia.nomeVitima}</strong><br>
        ${denuncia.endereco}<br>
        <small>${formatarData(denuncia.dataHora)}</small>
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = event.target.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 + 'px';
    tooltip.style.top = rect.top + 'px';
}

// Remover tooltip
function removerTooltip() {
    const tooltip = document.querySelector('.pin-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// Centralizar mapa
function centralizarMapa() {
    mostrarNotificacao('Mapa centralizado', 'info');
    
    // Resetar informações
    const infoElement = document.getElementById('mapa-info');
    if (infoElement) {
        infoElement.innerHTML = `
            <div class="info-content">
                <p>Clique em um pin para ver detalhes da denúncia</p>
            </div>
        `;
    }
}

// Atualizar mapa
function atualizarMapa() {
    mostrarNotificacao('Mapa atualizado', 'success');
    carregarPinsDenuncias();
}

// Integração com a navegação principal
document.addEventListener('DOMContentLoaded', function() {
    // Observar mudanças na seção do mapa
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'mapa-section' && mutation.target.classList.contains('active')) {
                setTimeout(inicializarMapa, 100);
            }
        });
    });
    
    const mapaSection = document.getElementById('mapa-section');
    if (mapaSection) {
        observer.observe(mapaSection, { attributes: true, attributeFilter: ['class'] });
    }
});

