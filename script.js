document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const toggleAgressorInfo = document.getElementById('toggleAgressorInfo');
    const agressorInfoForm = document.getElementById('agressorInfoForm');
    const emergencyTrigger = document.getElementById('emergencyTrigger');
    const reportTrigger = document.getElementById('reportTrigger');
    const emergencyForm = document.getElementById('emergencyForm');
    const detailedReportForm = document.getElementById('detailedReportForm');
    const immediateAlertForm = document.getElementById('immediateAlertForm');
    const detailedReportFormElement = document.getElementById('detailedReportFormElement');
    const cancelEmergency = document.getElementById('cancelEmergency');
    const cancelReport = document.getElementById('cancelReport');
    const getLocationBtn = document.getElementById('getLocationBtn');
    const locationStatus = document.getElementById('locationStatus');
    const confirmationModal = document.getElementById('confirmationModal');
    const closeModal = document.getElementById('closeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const reportDescription = document.getElementById('reportDescription');
    const charCount = document.getElementById('charCount');
    const reportFiles = document.getElementById('reportFiles');
    const filePreview = document.getElementById('filePreview');
    const locationMapContainer = document.getElementById('locationMapContainer');
    
    
    // Elementos do modal de permissão
    const permissionModal = document.getElementById('permissionModal');
    const denyPermission = document.getElementById('denyPermission');
    const askLaterPermission = document.getElementById('askLaterPermission');
    const grantPermission = document.getElementById('grantPermission');

    // Variáveis
    let currentLocation = null;
    let emergencyCoords = null;
    let map = null;
    let marker = null;
    let permissionRequested = false;

    // Expressões regulares para validação
    const regex = {
        nome: /^[A-Za-zÀ-ÖØ-öø-ÿ\s']+$/,
        cpf: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
        telefone: /^(\+\d{1,3})?\s?(\(\d{2}\)|\d{2})?\s?\d{4,5}-?\d{4}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        numero: /^\d+$/,
        coordenadas: /^-?\d{1,3}\.\d+$/
    };

    // Carrega a biblioteca Leaflet dinamicamente
    function loadLeaflet() {
        return new Promise((resolve, reject) => {
            if (window.L) {
                resolve();
                return;
            }

            const leafletCSS = document.createElement('link');
            leafletCSS.rel = 'stylesheet';
            leafletCSS.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
            leafletCSS.integrity = 'sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A==';
            leafletCSS.crossOrigin = '';
            document.head.appendChild(leafletCSS);

            const leafletJS = document.createElement('script');
            leafletJS.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
            leafletJS.integrity = 'sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA==';
            leafletJS.crossOrigin = '';
            leafletJS.onload = resolve;
            leafletJS.onerror = reject;
            document.head.appendChild(leafletJS);
        });
    }

    // Funções de validação
    function validarNome(nome) {
        if (!nome) return { valido: false, mensagem: 'Nome é obrigatório' };
        if (!regex.nome.test(nome)) return { valido: false, mensagem: 'Nome deve conter apenas letras' };
        if (nome.length < 3) return { valido: false, mensagem: 'Nome muito curto (mínimo 3 caracteres)' };
        return { valido: true };
    }

    function validarCPF(cpf) {
        if (!cpf) return { valido: false, mensagem: 'CPF é obrigatório' };
        const cpfLimpo = cpf.replace(/[^\d]/g, '');
        if (!regex.cpf.test(cpf)) return { valido: false, mensagem: 'Formato de CPF inválido' };
        if (cpfLimpo.length !== 11) return { valido: false, mensagem: 'CPF deve ter 11 dígitos' };
        return { valido: true };
    }

    function validarTelefone(telefone) {
        if (!telefone) return { valido: false, mensagem: 'Telefone é obrigatório' };
        if (!regex.telefone.test(telefone)) return { valido: false, mensagem: 'Formato de telefone inválido' };
        return { valido: true };
    }

    function validarLocalizacao(localizacao) {
        if (!localizacao) return { valido: false, mensagem: 'Localização é obrigatória' };
        if (localizacao.length < 5) return { valido: false, mensagem: 'Localização muito curta' };
        return { valido: true };
    }

    function validarDescricao(descricao) {
        if (!descricao) return { valido: false, mensagem: 'Descrição é obrigatória' };
        if (descricao.length < 20) return { valido: false, mensagem: 'Descrição muito curta (mínimo 20 caracteres)' };
        if (descricao.length > 1000) return { valido: false, mensagem: 'Descrição muito longa (máximo 1000 caracteres)' };
        return { valido: true };
    }

    function mostrarErro(campo, mensagem) {
        const erroElement = document.getElementById(`${campo.id}Error`);
        if (erroElement) {
            erroElement.textContent = mensagem;
            erroElement.style.display = 'block';
            campo.classList.add('campo-invalido');
        }
    }

    function limparErro(campo) {
        const erroElement = document.getElementById(`${campo.id}Error`);
        if (erroElement) {
            erroElement.textContent = '';
            erroElement.style.display = 'none';
            campo.classList.remove('campo-invalido');
        }
    }

    // Modal de Permissão
    function showPermissionModal() {
        permissionModal.style.display = 'flex';
    }

    function hidePermissionModal() {
        permissionModal.style.display = 'none';
    }

    // Funções principais
    function showEmergencyForm() {
        hideForms();
        emergencyForm.style.display = 'block';
        window.scrollTo({
            top: emergencyForm.offsetTop - 20,
            behavior: 'smooth'
        });
    }

    function showReportForm() {
        hideForms();
        detailedReportForm.style.display = 'block';
        window.scrollTo({
            top: detailedReportForm.offsetTop - 20,
            behavior: 'smooth'
        });
    }

    function hideForms() {
        emergencyForm.style.display = 'none';
        detailedReportForm.style.display = 'none';
        currentLocation = null;
        emergencyCoords = null;
        locationStatus.textContent = 'Aguardando permissão...';
        if (map) {
            map.remove();
            map = null;
            marker = null;
        }
        locationMapContainer.innerHTML = '';
        getLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Obter Localização';
        getLocationBtn.style.backgroundColor = '';
        getLocationBtn.disabled = false;
    }

    async function getCurrentLocation() {
        if (!permissionRequested) {
            showPermissionModal();
            return;
        }
        
        locationStatus.textContent = 'Obtendo localização...';
        getLocationBtn.disabled = true;

        try {
            await loadLeaflet();
            
            if (navigator.geolocation) {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });

                emergencyCoords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                
                showLocationOnMap(emergencyCoords);
                
                locationStatus.textContent = 'Localização obtida com sucesso!';
                getLocationBtn.innerHTML = '<i class="fas fa-check"></i> Localização Obtida';
                getLocationBtn.style.backgroundColor = '#28a745';
            } else {
                locationStatus.textContent = 'Geolocalização não suportada pelo navegador.';
                getLocationBtn.disabled = false;
            }
        } catch (error) {
            console.error('Erro ao obter localização:', error);
            locationStatus.textContent = 'Erro ao obter localização. Tente novamente.';
            getLocationBtn.disabled = false;
        }
    }

    function showLocationOnMap(coords) {
        locationMapContainer.innerHTML = '';
        
        const mapElement = document.createElement('div');
        mapElement.id = 'map';
        mapElement.style.height = '300px';
        mapElement.style.width = '100%';
        mapElement.style.borderRadius = '8px';
        mapElement.style.marginTop = '15px';
        locationMapContainer.appendChild(mapElement);
        
        map = L.map('map').setView([coords.latitude, coords.longitude], 16);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);
        
        marker = L.marker([coords.latitude, coords.longitude]).addTo(map)
            .bindPopup(`
                <div style="padding: 10px;">
                    <strong>Sua localização</strong><br>
                    Latitude: ${coords.latitude.toFixed(6)}<br>
                    Longitude: ${coords.longitude.toFixed(6)}
                </div>
            `)
            .openPopup();
        
        L.circle([coords.latitude, coords.longitude], {
            color: 'blue',
            fillColor: '#1e90ff',
            fillOpacity: 0.2,
            radius: 50
        }).addTo(map);
    }

    function validarFormularioEmergencia() {
        const nome = document.getElementById('emergencyName');
        const cpf = document.getElementById('emergencyCpf');
        const telefone = document.getElementById('emergencyPhone');
        
        const valNome = validarNome(nome.value);
        const valCpf = validarCPF(cpf.value);
        const valTelefone = validarTelefone(telefone.value);
        
        if (!valNome.valido) mostrarErro(nome, valNome.mensagem);
        if (!valCpf.valido) mostrarErro(cpf, valCpf.mensagem);
        if (!valTelefone.valido) mostrarErro(telefone, valTelefone.mensagem);
        
        if (!emergencyCoords) {
            alert('Por favor, obtenha sua localização antes de enviar o alerta.');
            return false;
        }
        
        return valNome.valido && valCpf.valido && valTelefone.valido;
    }

    function validarFormularioDenuncia() {
        const nome = document.getElementById('reportName');
        const cpf = document.getElementById('reportCpf');
        const telefone = document.getElementById('reportPhone');
        const localizacao = document.getElementById('reportLocation');
        const descricao = document.getElementById('reportDescription');
        const tipo = document.getElementById('reportType');
        
        const valNome = validarNome(nome.value);
        const valCpf = validarCPF(cpf.value);
        const valTelefone = validarTelefone(telefone.value);
        const valLocalizacao = validarLocalizacao(localizacao.value);
        const valDescricao = validarDescricao(descricao.value);
        
        if (!valNome.valido) mostrarErro(nome, valNome.mensagem);
        if (!valCpf.valido) mostrarErro(cpf, valCpf.mensagem);
        if (!valTelefone.valido) mostrarErro(telefone, valTelefone.mensagem);
        if (!valLocalizacao.valido) mostrarErro(localizacao, valLocalizacao.mensagem);
        if (!valDescricao.valido) mostrarErro(descricao, valDescricao.mensagem);
        
        if (tipo.value === "") {
            mostrarErro(tipo, 'Por favor, selecione um tipo de ocorrência');
            return false;
        }
        
        return valNome.valido && valCpf.valido && valTelefone.valido && 
               valLocalizacao.valido && valDescricao.valido;
    }

    function handleEmergencySubmit(e) {
        e.preventDefault();
        
        if (!validarFormularioEmergencia()) {
            return;
        }
        
        const name = document.getElementById('emergencyName').value;
        const cpf = document.getElementById('emergencyCpf').value;
        const phone = document.getElementById('emergencyPhone').value;

        console.log('Alerta de Emergência Enviado:', {
            name,
            cpf,
            phone,
            location: emergencyCoords,
            timestamp: new Date().toISOString()
        });

        showConfirmationModal(
            'Alerta Enviado!',
            'As autoridades foram acionadas com sua localização em tempo real.'
        );

        immediateAlertForm.reset();
        hideForms();
    }

    function handleReportSubmit(e) {
    e.preventDefault();
    
    if (!validarFormularioDenuncia()) {
        return;
    }
    
    const anonimo = anonimoCheckbox.checked;
    const name = anonimo ? 'Anônimo' : document.getElementById('reportName').value;
    const cpf = anonimo ? '' : document.getElementById('reportCpf').value;
    const phone = anonimo ? '' : document.getElementById('reportPhone').value;
    const type = document.getElementById('reportType').value;
    const location = document.getElementById('reportLocation').value;
    const description = reportDescription.value;
    const files = reportFiles.files;

        let agressorInfo = null;
    if (agressorInfoForm.style.display === 'block') {
        agressorInfo = {
            nome: document.getElementById('agressorNome').value,
            idade: document.getElementById('agressorIdade').value,
            descricao: document.getElementById('agressorDescricao').value,
            relacionamento: document.getElementById('agressorRelacionamento').value,
            endereco: document.getElementById('agressorEndereco').value
        };
    }

         console.log('Denúncia Elaborada Enviada:', {
        anonimo,
        name,
        cpf,
        phone,
        type,
        location,
        description,
        agressorInfo,
        files: files ? Array.from(files).map(f => f.name) : [],
        timestamp: new Date().toISOString()
    });

    showConfirmationModal(
        'Denúncia Registrada!',
        anonimo ? 
            'Sua denúncia anônima foi recebida e será processada.' :
            'Sua denúncia foi recebida e será processada pela equipe responsável.'
    );

    detailedReportFormElement.reset();
    filePreview.innerHTML = '';
    charCount.textContent = '0';
    agressorInfoForm.style.display = 'none';
    toggleAgressorInfo.innerHTML = '<i class="fas fa-user-slash"></i> Adicionar informações sobre o agressor';
    hideForms();
}

    function updateCharCount() {
        const count = reportDescription.value.length;
        charCount.textContent = count;
        
        if (count > 1000) {
            reportDescription.value = reportDescription.value.substring(0, 1000);
            charCount.textContent = '1000';
        }
    }

    function handleFileUpload() {
        filePreview.innerHTML = '';
        
        if (reportFiles.files.length > 0) {
            Array.from(reportFiles.files).forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-preview-item';
                fileItem.innerHTML = `
                    <i class="fas fa-file"></i>
                    ${file.name}
                    <i class="fas fa-times remove-file" data-index="${index}"></i>
                `;
                filePreview.appendChild(fileItem);
            });

            document.querySelectorAll('.remove-file').forEach(btn => {
                btn.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    const dt = new DataTransfer();
                    const files = reportFiles.files;
                    
                    for (let i = 0; i < files.length; i++) {
                        if (i !== index) {
                            dt.items.add(files[i]);
                        }
                    }
                    
                    reportFiles.files = dt.files;
                    handleFileUpload();
                });
            });
        }
    }

    function toggleAgressorForm() {
    if (agressorInfoForm.style.display === 'none') {
        agressorInfoForm.style.display = 'block';
        toggleAgressorInfo.innerHTML = '<i class="fas fa-minus-circle"></i> Ocultar informações sobre o agressor';
    } else {
        agressorInfoForm.style.display = 'none';
        toggleAgressorInfo.innerHTML = '<i class="fas fa-user-slash"></i> Adicionar informações sobre o agressor';
    }
}

    function showConfirmationModal(title, message) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        confirmationModal.style.display = 'flex';
    }

    function closeConfirmationModal() {
        confirmationModal.style.display = 'none';
    }

    // Event Listeners
    emergencyTrigger.addEventListener('click', showEmergencyForm);
    reportTrigger.addEventListener('click', showReportForm);
    cancelEmergency.addEventListener('click', hideForms);
    cancelReport.addEventListener('click', hideForms);
    getLocationBtn.addEventListener('click', getCurrentLocation);
    immediateAlertForm.addEventListener('submit', handleEmergencySubmit);
    detailedReportFormElement.addEventListener('submit', handleReportSubmit);
    closeModal.addEventListener('click', closeConfirmationModal);
    reportDescription.addEventListener('input', updateCharCount);
    reportFiles.addEventListener('change', handleFileUpload);
    toggleAgressorInfo.addEventListener('click', toggleAgressorForm);
    
    // Event Listeners para o modal de permissão
    denyPermission.addEventListener('click', () => {
        hidePermissionModal();
        locationStatus.textContent = 'Permissão negada. Você pode alterar isso nas configurações.';
        permissionRequested = true;
    });

    askLaterPermission.addEventListener('click', () => {
        hidePermissionModal();
    });

    grantPermission.addEventListener('click', () => {
        hidePermissionModal();
        permissionRequested = true;
        getCurrentLocation();
    });

    // Validação em tempo real
    document.getElementById('emergencyName').addEventListener('blur', function() {
        const validacao = validarNome(this.value);
        if (!validacao.valido) {
            mostrarErro(this, validacao.mensagem);
        } else {
            limparErro(this);
        }
    });

    document.getElementById('emergencyCpf').addEventListener('blur', function() {
        const validacao = validarCPF(this.value);
        if (!validacao.valido) {
            mostrarErro(this, validacao.mensagem);
        } else {
            limparErro(this);
        }
    });

    document.getElementById('emergencyPhone').addEventListener('blur', function() {
        const validacao = validarTelefone(this.value);
        if (!validacao.valido) {
            mostrarErro(this, validacao.mensagem);
        } else {
            limparErro(this);
        }
    });

    document.getElementById('reportName').addEventListener('blur', function() {
        const validacao = validarNome(this.value);
        if (!validacao.valido) {
            mostrarErro(this, validacao.mensagem);
        } else {
            limparErro(this);
        }
    });

    document.getElementById('reportCpf').addEventListener('blur', function() {
        const validacao = validarCPF(this.value);
        if (!validacao.valido) {
            mostrarErro(this, validacao.mensagem);
        } else {
            limparErro(this);
        }
    });

    document.getElementById('reportPhone').addEventListener('blur', function() {
        const validacao = validarTelefone(this.value);
        if (!validacao.valido) {
            mostrarErro(this, validacao.mensagem);
        } else {
            limparErro(this);
        }
    });

    document.getElementById('reportLocation').addEventListener('blur', function() {
        const validacao = validarLocalizacao(this.value);
        if (!validacao.valido) {
            mostrarErro(this, validacao.mensagem);
        } else {
            limparErro(this);
        }
    });

    document.getElementById('reportDescription').addEventListener('blur', function() {
        const validacao = validarDescricao(this.value);
        if (!validacao.valido) {
            mostrarErro(this, validacao.mensagem);
        } else {
            limparErro(this);
        }
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target === confirmationModal) {
            closeConfirmationModal();
        }
        if (e.target === permissionModal) {
            hidePermissionModal();
        }
    });
})