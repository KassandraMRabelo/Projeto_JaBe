// Dados mock para as denúncias
const denunciasData = [
    {
        id: 1,
        nomeVitima: "Maria Silva Santos",
        telefone: "(89) 99999-1234",
        cpf: "123.456.789-00",
        endereco: "Rua Fernando Marques, 123 - Centro",
        enderecoCompleto: "Rua Fernando Marques, 123, Apto 45 - Centro - Floriano/PI - CEP: 64800-000",
        dataHora: "2024-06-15 14:30",
        status: "urgente",
        descricao: "Situação de violência doméstica em andamento. Vítima relata agressões físicas e ameaças constantes do companheiro. Solicita ajuda imediata pois teme pela sua segurança e dos filhos menores.",
        latitude: -6.76725,
        longitude: -43.0257
    },
    {
        id: 2,
        nomeVitima: "Ana Paula Costa",
        telefone: "(89) 99488-5678",
        cpf: "987.654.321-00",
        endereco: "Rua Alfredo Estrela, 456 - Alto da Cruz",
        enderecoCompleto: "Rua Alfredo Estrela, 456, Casa 12 - Alto da Cruz - Floriano/PI - CEP: 64808-310",
        dataHora: "2024-06-15 13:15",
        status: "nova",
        descricao: "Denúncia de assédio moral no ambiente de trabalho. Vítima relata perseguições e humilhações constantes por parte do supervisor direto, causando danos psicológicos.",
        latitude: -6.7693,
        longitude: -43.0220
    },
    {
        id: 3,
        nomeVitima: "Carla Mendes",
        telefone: "(89) 97777-9012",
        cpf: "456.789.123-00",
        endereco: "Rua Francisco Aires, 789 - Manguinha",
        enderecoCompleto: "Rua Francisco Aires, 789, Casa 2 - Manguinha - Floriano/PI - CEP: 64808-120",
        dataHora: "2024-06-15 12:00",
        status: "em-atendimento",
        descricao: "Caso de stalking e perseguição. Ex-companheiro não aceita o fim do relacionamento e está seguindo a vítima, enviando mensagens ameaçadoras e aparecendo em locais frequentados por ela.",
        latitude: -6.7651,
        longitude: -43.0309
    },
    {
        id: 4,
        nomeVitima: "Fernanda Oliveira",
        telefone: "(89) 96666-3456",
        cpf: "789.123.456-00",
        endereco: "Avenida Esmaragdo de Freitas, 321 - Sambaíba Velha",
        enderecoCompleto: "Av. Esmaragdo de Freitas, 321, Bloco B Apto 78 - Sambaíba Velha - Floriano/PI - CEP: 64808-070",
        dataHora: "2024-06-15 10:45",
        status: "atendida",
        descricao: "Denúncia de violência psicológica resolvida. Vítima recebeu atendimento adequado e foi encaminhada para acompanhamento psicológico. Medida protetiva deferida.",
        latitude: -6.7714,
        longitude: -43.0321
    },
    {
        id: 5,
        nomeVitima: "Juliana Santos",
        telefone: "(89) 95555-7890",
        cpf: "321.654.987-00",
        endereco: "Rua João Dantas, 654 - Irapuá II",
        enderecoCompleto: "Rua João Dantas, 654, Sala 15 - Irapuá II - Floriano/PI - CEP: 64808-180",
        dataHora: "2024-06-15 09:20",
        status: "nova",
        descricao: "Relato de importunação sexual em transporte público. Vítima foi abordada de forma inadequada durante trajeto para o trabalho e solicita providências.",
        latitude: -6.7725,
        longitude: -43.0199
    },
    {
        id: 6,
        nomeVitima: "Patricia Lima",
        telefone: "(89) 94444-2468",
        cpf: "654.987.321-00",
        endereco: "Rua Padre Uchôa, 987 - Centro",
        enderecoCompleto: "Rua Padre Uchôa, 987, Cobertura - Centro - Floriano/PI - CEP: 64800-000",
        dataHora: "2024-06-15 08:10",
        status: "urgente",
        descricao: "Situação de cárcere privado. Vítima está sendo mantida contra sua vontade e conseguiu fazer contato solicitando resgate imediato. Localização confirmada.",
        latitude: -6.7661,
        longitude: -43.0241
    },
    {
        id: 7,
        nomeVitima: "Roberta Alves",
        telefone: "(89) 93333-1357",
        cpf: "147.258.369-00",
        endereco: "Av. Eurípedes de Aguiar, 1500 - Caixa D’água",
        enderecoCompleto: "Av. Eurípedes de Aguiar, 1500, 25º andar - Caixa D’água - Floriano/PI - CEP: 64808-300",
        dataHora: "2024-06-14 16:30",
        status: "em-atendimento",
        descricao: "Denúncia de discriminação e violência de gênero no ambiente corporativo. Caso em investigação com coleta de depoimentos e evidências.",
        latitude: -6.7705,
        longitude: -43.0275
    },
    {
        id: 8,
        nomeVitima: "Camila Rodrigues",
        telefone: "(89) 92222-8642",
        cpf: "258.369.147-00",
        endereco: "Rua Raimundo Castro, 246 - Sambaíba Nova",
        enderecoCompleto: "Rua Raimundo Castro, 246, Apto 33 - Sambaíba Nova - Floriano/PI - CEP: 64808-060",
        dataHora: "2024-06-14 14:15",
        status: "atendida",
        descricao: "Caso de violência doméstica solucionado. Agressor foi detido e vítima está em local seguro com medidas protetivas ativas.",
        latitude: -6.7745,
        longitude: -43.0267
    }
];


function getEstatisticas() {
    const total = denunciasData.length;
    const urgentes = denunciasData.filter(d => d.status === 'urgente').length;
    const pendentes = denunciasData.filter(d => d.status === 'nova').length;
    const atendidas = denunciasData.filter(d => d.status === 'atendida').length;
    
    return { total, urgentes, pendentes, atendidas };
}

// Função para filtrar denúncias
function filtrarDenuncias(filtro) {
    if (filtro === 'todos') {
        return denunciasData;
    }
    return denunciasData.filter(denuncia => denuncia.status === filtro);
}

// Função para obter denúncia por ID
function obterDenuncia(id) {
    return denunciasData.find(denuncia => denuncia.id === parseInt(id));
}

// Função para atualizar status da denúncia
function atualizarStatus(id, novoStatus) {
    const denuncia = denunciasData.find(d => d.id === parseInt(id));
    if (denuncia) {
        denuncia.status = novoStatus;
        return true;
    }
    return false;
}

