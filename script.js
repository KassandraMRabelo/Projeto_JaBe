document.addEventListener('DOMContentLoaded', function() {
    // Elementos principais
    const emergencyBtn = document.getElementById('emergencyBtn');
    const denunciaForm = document.getElementById('denunciaForm');
    const limparForm = document.getElementById('limparForm');
    const descricao = document.getElementById('descricao');
    const charCount = document.getElementById('charCount');
    const fileInput = document.getElementById('anexos');
    const filePreview = document.getElementById('filePreview');
    
    // Modais
    const confirmationModal = document.getElementById('confirmationModal');
    const emergencyModal = document.getElementById('emergencyModal');
    const modalCloseBtns = document.querySelectorAll('.modal-close-btn, #cancelEmergency');
    const countdownElement = document.getElementById('countdown');
    
    // Variáveis
    let countdown;
    let countdownValue = 5;
    
    // Evento de Alerta de Emergência
    emergencyBtn.addEventListener('click', function() {
        // Ativar estado de emergência
        this.classList.add('active');
        
        // Mostrar modal de emergência
        emergencyModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Iniciar contagem regressiva
        startCountdown();
        
        // Simular envio do alerta (substituir por código real)
        setTimeout(() => {
            console.log('Alerta enviado às autoridades');
        }, 1000);
    });
    
    // Evento de Cancelamento de Emergência
    document.getElementById('cancelEmergency').addEventListener('click', function() {
        emergencyBtn.classList.remove('active');
        emergencyModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        resetCountdown();
    });
    
    // Fechar modais
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            confirmationModal.style.display = 'none';
            emergencyModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            emergencyBtn.classList.remove('active');
            resetCountdown();
        });
    });
    
    // Limpar formulário
    limparForm.addEventListener('click', function() {
        denunciaForm.reset();
        filePreview.innerHTML = '';
        charCount.textContent = '0';
    });
    
    // Contador de caracteres
    descricao.addEventListener('input', function() {
        charCount.textContent = this.value.length;
    });
    
    // Preview de arquivos
    fileInput.addEventListener('change', function() {
        filePreview.innerHTML = '';
        
        if (this.files.length > 0) {
            for (let i = 0; i < this.files.length; i++) {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-preview-item';
                fileItem.innerHTML = `
                    <i class="fas fa-file-alt"></i>
                    ${this.files[i].name}
                    <i class="fas fa-times remove-file" data-index="${i}"></i>
                `;
                filePreview.appendChild(fileItem);
            }
        }
    });
    
    // Remover arquivos do preview
    filePreview.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-file')) {
            const index = e.target.getAttribute('data-index');
            const dt = new DataTransfer();
            const files = fileInput.files;
            
            for (let i = 0; i < files.length; i++) {
                if (index != i) {
                    dt.items.add(files[i]);
                }
            }
            
            fileInput.files = dt.files;
            e.target.parentElement.remove();
        }
    });
    
    // Envio do formulário
    denunciaForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Gerar número de protocolo fictício
        const protocolo = '#2023-' + Math.floor(1000 + Math.random() * 9000);
        document.getElementById('protocolo').textContent = protocolo;
        
        // Mostrar modal de confirmação
        confirmationModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Limpar formulário
        this.reset();
        filePreview.innerHTML = '';
        charCount.textContent = '0';
        
        // Simular envio (substituir por código real)
        console.log('Denúncia enviada:', {
            tipo: document.getElementById('tipo-denuncia').value,
            descricao: descricao.value,
            local: document.getElementById('local').value,
            anexos: fileInput.files
        });
    });
    
    // Função para iniciar contagem regressiva
    function startCountdown() {
        countdownValue = 5;
        countdownElement.textContent = countdownValue;
        
        countdown = setInterval(() => {
            countdownValue--;
            countdownElement.textContent = countdownValue;
            
            if (countdownValue <= 0) {
                clearInterval(countdown);
                // Ação quando o tempo acabar
            }
        }, 1000);
    }
    
    // Função para resetar contagem regressiva
    function resetCountdown() {
        clearInterval(countdown);
        countdownValue = 5;
        countdownElement.textContent = countdownValue;
    }
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', function(e) {
        if (e.target === confirmationModal || e.target === emergencyModal) {
            confirmationModal.style.display = 'none';
            emergencyModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            emergencyBtn.classList.remove('active');
            resetCountdown();
        }
    });
});