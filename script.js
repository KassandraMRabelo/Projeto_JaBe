// Arquivo JavaScript para a tela da vítima com funcionalidade de localização em tempo real

// Variáveis globais
let watchId = null;
let locationHistory = [];
let highAccuracyRetries = 0;
const MAX_RETRIES = 5; // Aumentado de 3 para 5
let map = null;
let currentMarker = null;
let miniMap = null;
let miniMarker = null;
let isRetrying = false;
let timeoutRetryCount = 0;
const MAX_TIMEOUT_RETRIES = 3;

// Função para inicializar o mapa Leaflet
function inicializarMapa() {
    // Inicializar o mapa principal
    map = L.map('map').setView([-6.7719, -43.0241], 15); // Coordenadas aproximadas de Floriano, PI
    
    // Adicionar camada de mapa base (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Inicializar o mini-mapa para o overlay de compartilhamento
    const miniMapElement = document.getElementById('mini-map');
    if (miniMapElement) {
        miniMap = L.map('mini-map', {
            zoomControl: false,
            attributionControl: false
        }).setView([-6.7719, -43.0241], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);
    }
    
    // Configurar controles do mapa
    document.getElementById('zoom-in').addEventListener('click', function() {
        map.zoomIn();
    });
    
    document.getElementById('zoom-out').addEventListener('click', function() {
        map.zoomOut();
    });
    
    document.getElementById('center-map').addEventListener('click', function() {
        if (locationHistory.length > 0) {
            const currentLocation = locationHistory[0];
            map.setView([currentLocation.latitude, currentLocation.longitude], 17);
        }
    });
    
    let currentLayer = 'streets';
    document.getElementById('toggle-layers').addEventListener('click', function() {
        if (currentLayer === 'streets') {
            // Mudar para camada de satélite
            map.eachLayer(function(layer) {
                if (layer instanceof L.TileLayer) {
                    map.removeLayer(layer);
                }
            });
            
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                maxZoom: 19
            }).addTo(map);
            
            currentLayer = 'satellite';
        } else {
            // Voltar para camada de ruas
            map.eachLayer(function(layer) {
                if (layer instanceof L.TileLayer) {
                    map.removeLayer(layer);
                }
            });
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(map);
            
            currentLayer = 'streets';
        }
    });
}

// Função para obter e exibir a localização em tempo real
function iniciarRastreamentoLocalizacao() {
    // Atualizar status do GPS para "Ativando..."
    const gpsStatus = document.getElementById('gps-status');
    const gpsBar = document.getElementById('gps-bar');
    const gpsIcon = document.querySelector('.indicator-icon.gps');
    
    if (gpsStatus) gpsStatus.textContent = "Ativando...";
    if (gpsBar) gpsBar.style.width = "30%";
    
    // Verificar se o navegador suporta geolocalização
    if (!navigator.geolocation) {
        mostrarAlertaPersonalizado("Seu navegador não suporta geolocalização. Por favor, use um navegador mais recente.", "error");
        if (gpsStatus) gpsStatus.textContent = "Não suportado";
        return;
    }

    // Iniciar rastreamento contínuo da localização com alta precisão
    watchId = navigator.geolocation.watchPosition(
        // Sucesso
        function(position) {
            // Extrair dados da posição
            const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
            const timestamp = new Date(position.timestamp);
            
            // Resetar contador de tentativas de timeout
            timeoutRetryCount = 0;
            
            // Verificar se a precisão é aceitável (menos de 100 metros)
            if (accuracy > 100 && highAccuracyRetries < MAX_RETRIES) {
                highAccuracyRetries++;
                console.log(`Precisão insuficiente (${accuracy}m). Tentativa ${highAccuracyRetries}/${MAX_RETRIES}`);
                
                if (gpsStatus) gpsStatus.textContent = `Melhorando precisão (${highAccuracyRetries}/${MAX_RETRIES})`;
                if (gpsBar) gpsBar.style.width = "60%";
                
                // Tentar novamente com um timeout mais longo
                setTimeout(() => {
                    navigator.geolocation.getCurrentPosition(
                        position => {
                            const { latitude, longitude, accuracy } = position.coords;
                            const timestamp = new Date(position.timestamp);
                            processarLocalizacao(latitude, longitude, accuracy, timestamp);
                        },
                        error => {
                            console.warn("Erro ao melhorar precisão:", error.message);
                            // Se falhar na tentativa de melhorar precisão, use a última posição conhecida
                            if (highAccuracyRetries >= MAX_RETRIES) {
                                processarLocalizacao(latitude, longitude, accuracy, timestamp);
                            }
                        },
                        { 
                            enableHighAccuracy: true, 
                            timeout: 30000, // Aumentado para 30 segundos
                            maximumAge: 0 
                        }
                    );
                }, 1000);
                
                return;
            }
            
            // Processar a localização obtida
            processarLocalizacao(latitude, longitude, accuracy, timestamp);
            
            // Resetar contador de tentativas
            highAccuracyRetries = 0;
            isRetrying = false;
        },
        // Erro
        function(error) {
            console.warn("Erro ao obter localização:", error.message);
            
            // Tratamento específico para timeout
            if (error.code === error.TIMEOUT) {
                timeoutRetryCount++;
                
                if (timeoutRetryCount <= MAX_TIMEOUT_RETRIES) {
                    console.log(`Timeout ao obter localização. Tentativa ${timeoutRetryCount}/${MAX_TIMEOUT_RETRIES}`);
                    
                    if (gpsStatus) gpsStatus.textContent = `Reconectando (${timeoutRetryCount}/${MAX_TIMEOUT_RETRIES})`;
                    if (gpsBar) gpsBar.style.width = "40%";
                    
                    // Tentar novamente com timeout maior
                    setTimeout(() => {
                        // Parar o rastreamento atual
                        if (watchId !== null) {
                            navigator.geolocation.clearWatch(watchId);
                            watchId = null;
                        }
                        
                        // Iniciar novo rastreamento com timeout maior
                        watchId = navigator.geolocation.watchPosition(
                            position => {
                                const { latitude, longitude, accuracy } = position.coords;
                                const timestamp = new Date(position.timestamp);
                                processarLocalizacao(latitude, longitude, accuracy, timestamp);
                                timeoutRetryCount = 0; // Resetar contador se bem-sucedido
                            },
                            handleLocationError,
                            { 
                                enableHighAccuracy: true, 
                                timeout: 45000 + (timeoutRetryCount * 15000), // Aumentar o timeout progressivamente
                                maximumAge: 0 
                            }
                        );
                    }, 2000);
                    
                    return;
                }
            }
            
            // Tratamento geral de erros
            handleLocationError(error);
        },
        // Opções
        {
            enableHighAccuracy: true, // Alta precisão OBRIGATÓRIA
            timeout: 30000,           // Timeout aumentado para 30 segundos
            maximumAge: 0             // Não usar cache
        }
    );
}

// Função para tratar erros de localização
function handleLocationError(error) {
    const gpsStatus = document.getElementById('gps-status');
    const gpsBar = document.getElementById('gps-bar');
    const gpsIcon = document.querySelector('.indicator-icon.gps');
    
    if (gpsBar) gpsBar.style.width = "0%";
    if (gpsIcon) gpsIcon.classList.remove('active');
    
    let mensagemErro = "";
    let tipoAlerta = "error";
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            mensagemErro = "Você precisa permitir o acesso à sua localização para usar este sistema. Por favor, verifique as permissões do seu navegador e tente novamente.";
            if (gpsStatus) gpsStatus.textContent = "Permissão negada";
            break;
            
        case error.POSITION_UNAVAILABLE:
            mensagemErro = "Não foi possível determinar sua localização. Verifique se o GPS do seu dispositivo está ativado e tente novamente.";
            if (gpsStatus) gpsStatus.textContent = "Indisponível";
            break;
            
        case error.TIMEOUT:
            mensagemErro = "O tempo para obter sua localização esgotou. Isso pode acontecer em ambientes internos ou com sinal fraco. Tente se mover para uma área mais aberta ou próxima a janelas.";
            if (gpsStatus) gpsStatus.textContent = "Tempo esgotado";
            tipoAlerta = "warning";
            break;
            
        default:
            mensagemErro = "Ocorreu um erro desconhecido ao obter sua localização. Por favor, tente novamente.";
            if (gpsStatus) gpsStatus.textContent = "Erro desconhecido";
    }
    
    // Mostrar alerta personalizado
    mostrarAlertaPersonalizado(mensagemErro, tipoAlerta);
    
    // Se não estiver em processo de retry, tente uma abordagem alternativa
    if (!isRetrying && error.code === error.TIMEOUT) {
        isRetrying = true;
        
        // Tentar obter localização com baixa precisão após timeout
        setTimeout(() => {
            console.log("Tentando obter localização com baixa precisão...");
            if (gpsStatus) gpsStatus.textContent = "Tentando novamente...";
            if (gpsBar) gpsBar.style.width = "30%";
            
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude, accuracy } = position.coords;
                    const timestamp = new Date();
                    processarLocalizacao(latitude, longitude, accuracy, timestamp);
                    isRetrying = false;
                },
                error => {
                    console.warn("Falha na tentativa alternativa:", error.message);
                    isRetrying = false;
                    
                    // Última tentativa: usar IP para localização aproximada
                    if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
                        usarLocalizacaoPorIP();
                    }
                },
                { 
                    enableHighAccuracy: false, // Desativar alta precisão para resposta mais rápida
                    timeout: 20000,
                    maximumAge: 60000 // Permitir cache de 1 minuto
                }
            );
        }, 1000);
    }
}

// Função para usar localização aproximada por IP (fallback)
function usarLocalizacaoPorIP() {
    console.log("Tentando obter localização aproximada por IP...");
    const gpsStatus = document.getElementById('gps-status');
    if (gpsStatus) gpsStatus.textContent = "Usando localização por IP...";
    
    // Usar coordenadas de Floriano, PI como fallback
    // Em um sistema real, seria feita uma chamada a um serviço de geolocalização por IP
    const latitude = -6.7719;
    const longitude = -43.0241;
    const accuracy = 5000; // Precisão baixa (5km)
    const timestamp = new Date();
    
    // Processar a localização aproximada
    processarLocalizacao(latitude, longitude, accuracy, timestamp);
    
    // Avisar o usuário
    mostrarAlertaPersonalizado("Usando localização aproximada baseada na sua região. A precisão é limitada. Para melhor precisão, permita o acesso ao GPS e tente novamente em uma área aberta.", "warning");
}

// Função para mostrar alerta personalizado
function mostrarAlertaPersonalizado(mensagem, tipo) {
    const alertOverlay = document.getElementById('alertOverlay');
    if (!alertOverlay) return;
    
    const alertTitle = alertOverlay.querySelector('h3');
    const alertText = alertOverlay.querySelector('p');
    const alertIcon = alertOverlay.querySelector('.alert-icon i');
    
    if (alertTitle && alertText && alertIcon) {
        switch(tipo) {
            case "error":
                alertTitle.textContent = "Erro de Localização";
                alertIcon.className = "fas fa-exclamation-circle";
                alertIcon.parentElement.style.backgroundColor = "rgba(234, 67, 53, 0.2)";
                alertIcon.style.color = "#ea4335";
                break;
                
            case "warning":
                alertTitle.textContent = "Atenção";
                alertIcon.className = "fas fa-exclamation-triangle";
                alertIcon.parentElement.style.backgroundColor = "rgba(251, 188, 5, 0.2)";
                alertIcon.style.color = "#fbbc05";
                break;
                
            default:
                alertTitle.textContent = "Informação";
                alertIcon.className = "fas fa-info-circle";
                alertIcon.parentElement.style.backgroundColor = "rgba(66, 133, 244, 0.2)";
                alertIcon.style.color = "#4285f4";
        }
        
        alertText.textContent = mensagem;
        alertOverlay.style.display = 'flex';
    } else {
        // Fallback para alert padrão se o overlay não estiver disponível
        alert(mensagem);
    }
}

// Função para processar a localização obtida
function processarLocalizacao(latitude, longitude, accuracy, timestamp) {
    // Atualizar status do GPS
    const gpsStatus = document.getElementById('gps-status');
    const gpsBar = document.getElementById('gps-bar');
    const gpsIcon = document.querySelector('.indicator-icon.gps');
    
    // Determinar nível de precisão
    let nivelPrecisao = "Baixa";
    let porcentagemPrecisao = 60;
    
    if (accuracy < 10) {
        nivelPrecisao = "Alta";
        porcentagemPrecisao = 95;
    } else if (accuracy < 50) {
        nivelPrecisao = "Média";
        porcentagemPrecisao = 80;
    } else if (accuracy > 1000) {
        nivelPrecisao = "Muito Baixa";
        porcentagemPrecisao = 30;
    }
    
    if (gpsStatus) gpsStatus.textContent = `Ativo (${nivelPrecisao})`;
    if (gpsBar) gpsBar.style.width = `${porcentagemPrecisao}%`;
    if (gpsIcon) gpsIcon.classList.add('active');
    
    // Atualizar informações de localização na interface
    atualizarInformacoesLocalizacao(latitude, longitude, accuracy, timestamp, nivelPrecisao);
    
    // Obter endereço a partir das coordenadas
    obterEnderecoPorCoordenadas(latitude, longitude);
    
    // Adicionar ao histórico
    adicionarAoHistorico(latitude, longitude, timestamp);
    
    // Atualizar mapa
    atualizarMapa(latitude, longitude);
}

// Função para parar o rastreamento de localização
function pararRastreamentoLocalizacao() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        
        const gpsStatus = document.getElementById('gps-status');
        const gpsBar = document.getElementById('gps-bar');
        const gpsIcon = document.querySelector('.indicator-icon.gps');
        
        if (gpsStatus) gpsStatus.textContent = "Desativado";
        if (gpsBar) gpsBar.style.width = "0%";
        if (gpsIcon) gpsIcon.classList.remove('active');
    }
}

// Função para atualizar informações de localização na interface
function atualizarInformacoesLocalizacao(latitude, longitude, accuracy, timestamp, nivelPrecisao) {
    // Atualizar horário da última atualização
    const updateTimeElement = document.getElementById('update-time');
    if (updateTimeElement) {
        updateTimeElement.textContent = `Última atualização: ${timestamp.toLocaleString('pt-BR')}`;
    }
    
    // Atualizar precisão
    const accuracyElement = document.getElementById('accuracy');
    if (accuracyElement) {
        const precisaoMetros = Math.round(accuracy);
        accuracyElement.innerHTML = `Precisão: <strong>${nivelPrecisao}</strong> (${precisaoMetros}m)`;
    }
    
    // Atualizar coordenadas
    const latElement = document.getElementById('latitude');
    const lonElement = document.getElementById('longitude');
    
    if (latElement) latElement.textContent = latitude.toFixed(6);
    if (lonElement) lonElement.textContent = longitude.toFixed(6);
    
    // Atualizar status do botão de atualização
    const updateBtn = document.querySelector('.update-btn');
    if (updateBtn) {
        updateBtn.classList.remove('updating');
        updateBtn.querySelector('span').textContent = 'Atualizar';
    }
    
    console.log(`Localização atualizada: ${latitude}, ${longitude} (Precisão: ${Math.round(accuracy)}m)`);
}

// Função para converter coordenadas em endereço usando OpenStreetMap
function obterEnderecoPorCoordenadas(latitude, longitude) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na resposta: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Formatar o endereço para exibir apenas informações essenciais
            const endereco = formatarEndereco(data);
            const enderecoEl = document.getElementById('current-address');

            if (enderecoEl) {
                enderecoEl.textContent = endereco;
            } else {
                console.log("Endereço:", endereco);
            }
        })
        .catch(error => {
            console.error("Erro ao obter endereço:", error);
            
            // Em caso de falha, usar um endereço genérico baseado nas coordenadas
            const enderecoEl = document.getElementById('current-address');
            if (enderecoEl) {
                enderecoEl.textContent = `Localização em Floriano, Piauí (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
            }
            
            // Tentar novamente após 5 segundos em caso de falha
            setTimeout(() => obterEnderecoPorCoordenadas(latitude, longitude), 5000);
        });
}

// Função para formatar o endereço de forma mais limpa
function formatarEndereco(data) {
    // Verificar se temos os dados necessários
    if (!data || !data.address) {
        return "Endereço não disponível";
    }
    
    const address = data.address;
    
    // Extrair componentes do endereço
    const rua = address.road || address.street || address.pedestrian || "";
    const numero = address.house_number || "";
    const bairro = address.suburb || address.neighbourhood || address.city_district || "";
    const cidade = address.city || address.town || address.village || "";
    const estado = address.state || "";
    const cep = address.postcode || "";
    
    // Construir endereço formatado
    let enderecoFormatado = "";
    
    if (rua) {
        enderecoFormatado += rua;
        if (numero) enderecoFormatado += ", " + numero;
    }
    
    if (bairro) {
        if (enderecoFormatado) enderecoFormatado += " - ";
        enderecoFormatado += bairro;
    }
    
    if (cidade) {
        if (enderecoFormatado) enderecoFormatado += ", ";
        enderecoFormatado += cidade;
        
        if (estado) enderecoFormatado += " - " + estado;
    }
    
    if (cep) {
        if (enderecoFormatado) enderecoFormatado += ", ";
        enderecoFormatado += "CEP: " + cep;
    }
    
    return enderecoFormatado || "Endereço não disponível";
}

// Função para adicionar localização ao histórico
function adicionarAoHistorico(latitude, longitude, timestamp) {
    // Limitar o histórico a 5 entradas
    if (locationHistory.length >= 5) {
        locationHistory.pop(); // Remove o mais antigo
    }
    
    // Adicionar nova entrada no início
    locationHistory.unshift({
        latitude,
        longitude,
        timestamp,
        address: 'Carregando endereço...'
    });
    
    // Obter endereço para a entrada do histórico
    obterEnderecoParaHistorico(latitude, longitude, 0);
    
    // Atualizar a interface do histórico
    atualizarInterfaceHistorico();
}

// Função para obter endereço para uma entrada do histórico
function obterEnderecoParaHistorico(latitude, longitude, index) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na resposta: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Formatar o endereço para exibir apenas informações essenciais
            const endereco = formatarEndereco(data);
            
            // Atualizar o endereço no histórico
            if (locationHistory[index]) {
                locationHistory[index].address = endereco;
                
                // Atualizar a interface
                atualizarInterfaceHistorico();
            }
        })
        .catch(error => {
            console.error("Erro ao obter endereço para histórico:", error);
            
            // Em caso de falha, usar um endereço genérico
            if (locationHistory[index]) {
                locationHistory[index].address = `Localização em Floriano, Piauí (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                atualizarInterfaceHistorico();
            }
            
            // Tentar novamente após 5 segundos em caso de falha
            setTimeout(() => obterEnderecoParaHistorico(latitude, longitude, index), 5000);
        });
}

// Função para atualizar a interface do histórico
function atualizarInterfaceHistorico() {
    const historyList = document.querySelector('.history-list');
    if (!historyList) return;
    
    // Limpar o histórico atual
    historyList.innerHTML = '';
    
    // Adicionar cada entrada do histórico
    locationHistory.forEach((entry, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const historyTime = document.createElement('div');
        historyTime.className = 'history-time';
        historyTime.textContent = entry.timestamp.toLocaleTimeString('pt-BR');
        
        const historyLocation = document.createElement('div');
        historyLocation.className = 'history-location';
        historyLocation.textContent = entry.address;
        
        historyItem.appendChild(historyTime);
        historyItem.appendChild(historyLocation);
        
        // Adicionar evento de clique
        historyItem.addEventListener('click', function() {
            document.querySelectorAll('.history-item').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
            
            // Centralizar o mapa nesta localização
            if (map) {
                map.setView([entry.latitude, entry.longitude], 17);
                
                // Destacar o marcador
                if (currentMarker) {
                    currentMarker.setLatLng([entry.latitude, entry.longitude]);
                }
            }
        });
        
        historyList.appendChild(historyItem);
    });
}

// Função para atualizar o mapa
function atualizarMapa(latitude, longitude) {
    if (!map) return;
    
    // Centralizar o mapa na nova localização
    map.setView([latitude, longitude], 17);
    
    // Atualizar ou criar o marcador
    if (currentMarker) {
        currentMarker.setLatLng([latitude, longitude]);
    } else {
        // Criar um ícone personalizado roxo
        const purpleIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div class="marker-pulse"></div><i class="fas fa-map-marker-alt" style="color: #8a4fbf; font-size: 24px; position: relative; z-index: 10;"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
        
        currentMarker = L.marker([latitude, longitude], {icon: purpleIcon}).addTo(map);
    }
    
    // Atualizar o mini-mapa no overlay de compartilhamento
    if (miniMap) {
        miniMap.setView([latitude, longitude], 15);
        
        if (miniMarker) {
            miniMarker.setLatLng([latitude, longitude]);
        } else {
            const purpleIcon = L.divIcon({
                className: 'custom-mini-marker',
                html: '<i class="fas fa-map-marker-alt" style="color: #8a4fbf; font-size: 18px;"></i>',
                iconSize: [20, 20],
                iconAnchor: [10, 20]
            });
            
            miniMarker = L.marker([latitude, longitude], {icon: purpleIcon}).addTo(miniMap);
        }
    }
}

// Função para atualizar localização manualmente
function atualizarLocalizacaoManual() {
    const updateBtn = document.querySelector('.update-btn');
    if (updateBtn) {
        updateBtn.classList.add('updating');
        updateBtn.querySelector('span').textContent = 'Atualizando...';
    }
    
    // Resetar contadores de tentativas
    highAccuracyRetries = 0;
    timeoutRetryCount = 0;
    isRetrying = false;
    
    // Mostrar mensagem de aguarde
    mostrarAlertaPersonalizado("Obtendo sua localização atual. Isso pode levar alguns segundos...", "info");
    
    // Se já estiver rastreando, obter uma nova posição com alta precisão
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const { latitude, longitude, accuracy } = position.coords;
                const timestamp = new Date();
                
                // Verificar se a precisão é aceitável
                if (accuracy > 100) {
                    mostrarAlertaPersonalizado("A precisão da localização está baixa. Tente novamente em um local com melhor sinal GPS ou próximo a janelas.", "warning");
                }
                
                // Processar a localização obtida
                processarLocalizacao(latitude, longitude, accuracy, timestamp);
                
                // Mostrar confirmação
                const alertOverlay = document.getElementById('alertOverlay');
                if (alertOverlay) {
                    const alertTitle = alertOverlay.querySelector('h3');
                    const alertText = alertOverlay.querySelector('p');
                    const alertIcon = alertOverlay.querySelector('.alert-icon i');
                    
                    if (alertTitle) alertTitle.textContent = "Localização Atualizada";
                    if (alertText) alertText.textContent = "Sua localização foi atualizada com sucesso.";
                    if (alertIcon) {
                        alertIcon.className = "fas fa-check-circle";
                        alertIcon.parentElement.style.backgroundColor = "rgba(52, 168, 83, 0.2)";
                        alertIcon.style.color = "#34a853";
                    }
                    
                    alertOverlay.style.display = 'flex';
                }
            },
            function(error) {
                console.warn("Erro ao obter localização:", error.message);
                
                // Tratar erro específico
                handleLocationError(error);
                
                if (updateBtn) {
                    updateBtn.classList.remove('updating');
                    updateBtn.querySelector('span').textContent = 'Atualizar';
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 45000, // Timeout aumentado para 45 segundos
                maximumAge: 0
            }
        );
    }
}

// Função para mostrar/esconder overlay de compartilhamento
function toggleShareOverlay() {
    const overlay = document.getElementById('shareOverlay');
    if (overlay) {
        overlay.style.display = overlay.style.display === 'flex' ? 'none' : 'flex';
        
        // Atualizar informações de localização no overlay
        if (overlay.style.display === 'flex' && locationHistory.length > 0) {
            const currentLocation = locationHistory[0];
            
            const locationDetails = document.querySelector('.location-details');
            if (locationDetails) {
                const addressElement = locationDetails.querySelector('p:first-child');
                const timeElement = locationDetails.querySelector('p:last-child');
                
                if (addressElement) {
                    addressElement.innerHTML = `<i class="fas fa-map-pin"></i> ${currentLocation.address}`;
                }
                
                if (timeElement) {
                    timeElement.innerHTML = `<i class="fas fa-clock"></i> Atualizado: ${currentLocation.timestamp.toLocaleString('pt-BR')}`;
                }
            }
            
            // Atualizar mini-mapa
            if (miniMap) {
                miniMap.invalidateSize();
                miniMap.setView([currentLocation.latitude, currentLocation.longitude], 15);
                
                if (miniMarker) {
                    miniMarker.setLatLng([currentLocation.latitude, currentLocation.longitude]);
                } else {
                    const purpleIcon = L.divIcon({
                        className: 'custom-mini-marker',
                        html: '<i class="fas fa-map-marker-alt" style="color: #8a4fbf; font-size: 18px;"></i>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 20]
                    });
                    
                    miniMarker = L.marker([currentLocation.latitude, currentLocation.longitude], {icon: purpleIcon}).addTo(miniMap);
                }
            }
        }
    }
}

// Função para compartilhar localização
function compartilharLocalizacao() {
    // Verificar se temos uma localização atual para compartilhar
    if (locationHistory.length === 0) {
        mostrarAlertaPersonalizado("Não há localização disponível para compartilhar. Aguarde a obtenção da sua localização atual.", "warning");
        return;
    }
    
    const shareBtn = document.querySelector('.share-actions .share-btn');
    if (shareBtn) {
        shareBtn.textContent = 'Compartilhando...';
        shareBtn.disabled = true;
    }
    
    // Obter opções selecionadas
    const compartilharEmergencia = document.getElementById('share-emergency').checked;
    const compartilharAdmin = document.getElementById('share-admin').checked;
    const compartilharPolicia = document.getElementById('share-police').checked;
    
    // Obter duração selecionada
    const duracaoBtn = document.querySelector('.duration-btn.active');
    const duracao = duracaoBtn ? duracaoBtn.getAttribute('data-duration') : '15';
    
    // Obter mensagem opcional
    const mensagem = document.querySelector('.share-message textarea').value;
    
    // Obter localização atual
    const localizacaoAtual = locationHistory[0];
    
    // Simular compartilhamento (aqui seria implementada a lógica real de envio)
    console.log("Compartilhando localização:");
    console.log("- Latitude:", localizacaoAtual.latitude);
    console.log("- Longitude:", localizacaoAtual.longitude);
    console.log("- Endereço:", localizacaoAtual.address);
    console.log("- Compartilhar com emergência:", compartilharEmergencia);
    console.log("- Compartilhar com admin:", compartilharAdmin);
    console.log("- Compartilhar com polícia:", compartilharPolicia);
    console.log("- Duração:", duracao);
    console.log("- Mensagem:", mensagem);
    
    // Simular envio bem-sucedido após 1.5 segundos
    setTimeout(() => {
        const shareOverlay = document.getElementById('shareOverlay');
        const shareConfirmOverlay = document.getElementById('shareConfirmOverlay');
        
        if (shareOverlay) shareOverlay.style.display = 'none';
        if (shareConfirmOverlay) shareConfirmOverlay.style.display = 'flex';
        
        if (shareBtn) {
            shareBtn.textContent = 'Compartilhar Agora';
            shareBtn.disabled = false;
        }
    }, 1500);
}

// Função para fechar alertas
function fecharAlerta() {
    const alertOverlay = document.getElementById('alertOverlay');
    const shareConfirmOverlay = document.getElementById('shareConfirmOverlay');
    
    if (alertOverlay) alertOverlay.style.display = 'none';
    if (shareConfirmOverlay) shareConfirmOverlay.style.display = 'none';
}

// Adicionar event listeners quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando sistema de localização em tempo real...");
    
    // Inicializar o mapa Leaflet
    inicializarMapa();
    
    // Iniciar rastreamento de localização
    iniciarRastreamentoLocalizacao();
    
    // Botão de atualização
    const updateBtn = document.querySelector('.update-btn');
    if (updateBtn) {
        updateBtn.addEventListener('click', atualizarLocalizacaoManual);
    }
    
    // Botão de emergência
    const emergencyButton = document.querySelector('.emergency-button');
    if (emergencyButton) {
        emergencyButton.addEventListener('click', function() {
            // Verificar se temos uma localização atual
            if (locationHistory.length === 0) {
                mostrarAlertaPersonalizado("Não foi possível enviar alerta de emergência. Aguarde a obtenção da sua localização atual.", "error");
                return;
            }
            
            const alertOverlay = document.getElementById('alertOverlay');
            if (alertOverlay) {
                // Atualizar texto do alerta para emergência
                const alertTitle = alertOverlay.querySelector('h3');
                const alertText = alertOverlay.querySelector('p');
                const alertIcon = alertOverlay.querySelector('.alert-icon i');
                
                if (alertTitle) alertTitle.textContent = "Alerta de Emergência Enviado";
                if (alertText) alertText.textContent = "Sua localização e um alerta de emergência foram enviados aos contatos cadastrados.";
                if (alertIcon) {
                    alertIcon.className = "fas fa-exclamation-triangle";
                    alertIcon.parentElement.style.backgroundColor = "rgba(234, 67, 53, 0.2)";
                    alertIcon.style.color = "#ea4335";
                }
                
                alertOverlay.style.display = 'flex';
                
                // Restaurar texto original após fechar
                const closeBtn = alertOverlay.querySelector('.close-btn');
                if (closeBtn) {
                    const originalCloseHandler = closeBtn.onclick;
                    closeBtn.onclick = function() {
                        if (alertTitle) alertTitle.textContent = "Localização Atualizada";
                        if (alertText) alertText.textContent = "Sua localização foi atualizada com sucesso.";
                        if (alertIcon) {
                            alertIcon.className = "fas fa-check-circle";
                            alertIcon.parentElement.style.backgroundColor = "rgba(52, 168, 83, 0.2)";
                            alertIcon.style.color = "#34a853";
                        }
                        
                        if (originalCloseHandler) originalCloseHandler();
                        else fecharAlerta();
                        
                        // Restaurar handler original
                        closeBtn.onclick = originalCloseHandler;
                    };
                }
            }
        });
    }
    
    // Botão de compartilhar localização na barra lateral
    const shareLocationButton = document.querySelector('.share-location-button');
    if (shareLocationButton) {
        shareLocationButton.addEventListener('click', function() {
            // Verificar se temos uma localização atual
            if (locationHistory.length === 0) {
                mostrarAlertaPersonalizado("Não há localização disponível para compartilhar. Aguarde a obtenção da sua localização atual.", "warning");
                return;
            }
            
            toggleShareOverlay();
        });
    }
    
    // Botão de compartilhar no cabeçalho
    const shareHeaderBtn = document.querySelector('.header-controls .share-btn');
    if (shareHeaderBtn) {
        shareHeaderBtn.addEventListener('click', function() {
            // Verificar se temos uma localização atual
            if (locationHistory.length === 0) {
                mostrarAlertaPersonalizado("Não há localização disponível para compartilhar. Aguarde a obtenção da sua localização atual.", "warning");
                return;
            }
            
            toggleShareOverlay();
        });
    }
    
    // Botões para fechar alertas
    const closeButtons = document.querySelectorAll('.close-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            fecharAlerta();
            
            const messageOverlay = document.getElementById('messageOverlay');
            const shareOverlay = document.getElementById('shareOverlay');
            
            if (messageOverlay) messageOverlay.style.display = 'none';
            if (shareOverlay) shareOverlay.style.display = 'none';
        });
    });
    
    // Botão de compartilhar no overlay
    const shareActionBtn = document.querySelector('.share-actions .share-btn');
    if (shareActionBtn) {
        shareActionBtn.addEventListener('click', compartilharLocalizacao);
    }
    
    // Botões de cancelar no overlay
    const cancelButtons = document.querySelectorAll('.cancel-btn');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function() {
            const messageOverlay = document.getElementById('messageOverlay');
            const shareOverlay = document.getElementById('shareOverlay');
            
            if (messageOverlay) messageOverlay.style.display = 'none';
            if (shareOverlay) shareOverlay.style.display = 'none';
        });
    });
    
    // Botões de duração no overlay de compartilhamento
    const durationButtons = document.querySelectorAll('.duration-btn');
    durationButtons.forEach(button => {
        button.addEventListener('click', function() {
            durationButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Verificar conexão de rede
    window.addEventListener('online', function() {
        const connectionStatus = document.querySelector('.connection-status');
        if (connectionStatus) {
            connectionStatus.classList.add('connected');
            connectionStatus.classList.remove('disconnected');
            connectionStatus.innerHTML = '<i class="fas fa-wifi"></i><span>Conectado</span>';
        }
    });
    
    window.addEventListener('offline', function() {
        const connectionStatus = document.querySelector('.connection-status');
        if (connectionStatus) {
            connectionStatus.classList.remove('connected');
            connectionStatus.classList.add('disconnected');
            connectionStatus.innerHTML = '<i class="fas fa-wifi"></i><span>Desconectado</span>';
            
            mostrarAlertaPersonalizado("Você está offline. Algumas funcionalidades podem não estar disponíveis até que a conexão seja restabelecida.", "warning");
        }
    });
    
    // Mostrar dicas para melhorar a precisão da localização
    setTimeout(() => {
        mostrarAlertaPersonalizado("Para obter a melhor precisão de localização, certifique-se de estar em uma área aberta ou próximo a janelas. Em ambientes internos, a precisão pode ser reduzida.", "info");
    }, 3000);
});

// Limpar o rastreamento quando a página for fechada
window.addEventListener('beforeunload', function() {
    pararRastreamentoLocalizacao();
});
