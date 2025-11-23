import { pushData, getData, getNextSequentialNumber, getRef } from './database.js';
import { showMessage } from './utils.js';
import { getCurrentUser } from './auth.js';
import { update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export let veiculos = [];
export let pessoas = [];

export function addVeiculo(veiculo) {
    veiculos.push(veiculo);
}

export function removePessoaById(id) {
    pessoas = pessoas.filter(p => p.id !== id);
}

export function removeVeiculoById(id) {
    veiculos = veiculos.filter(v => v.id !== id);
}

export function addPessoa(pessoa) {
    pessoas.push(pessoa);
}

export function clearVeiculos() {
    veiculos = [];
}

export function clearPessoas() {
    pessoas = [];
}

export function getVeiculos() {
    return veiculos;
}

export function getPessoas() {
    return pessoas;
}

export function renderVeiculos(container) {
    if (!container) return;
    
    if (veiculos.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '<h4>Veículos Adicionados:</h4>';
    veiculos.forEach(veiculo => {
        html += `
            <div class="veiculo-item">
                <button class="btn-remove" onclick="window.removeVeiculo(${veiculo.id})">×</button>
                <p><strong>Placa:</strong> ${veiculo.placa}</p>
                ${veiculo.modelo ? `<p><strong>Modelo:</strong> ${veiculo.modelo}</p>` : ''}
                ${veiculo.ano ? `<p><strong>Ano:</strong> ${veiculo.ano}</p>` : ''}
                ${veiculo.cor ? `<p><strong>Cor:</strong> ${veiculo.cor}</p>` : ''}
                ${veiculo.tipo ? `<p><strong>Tipo:</strong> ${veiculo.tipo}</p>` : ''}
                ${veiculo.estado ? `<p><strong>Estado:</strong> ${veiculo.estado}</p>` : ''}
                <p><strong>Situação:</strong> ${veiculo.situacao}</p>
            </div>
        `;
    });
    container.innerHTML = html;
}

export function renderPessoas(container) {
    if (!container) return;
    
    if (pessoas.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '<h4>Pessoas Adicionadas:</h4>';
    pessoas.forEach(pessoa => {
        html += `
            <div class="pessoa-item">
                <button class="btn-remove" onclick="window.removePessoa(${pessoa.id})">×</button>
                <p><strong>Nome:</strong> ${pessoa.nome}</p>
                ${pessoa.cpf ? `<p><strong>CPF:</strong> ${pessoa.cpf}</p>` : ''}
                ${pessoa.dataNascimento ? `<p><strong>Data Nascimento:</strong> ${new Date(pessoa.dataNascimento).toLocaleDateString('pt-BR')}</p>` : ''}
                ${pessoa.telefone ? `<p><strong>Telefone:</strong> ${pessoa.telefone}</p>` : ''}
                <p><strong>Envolvimento:</strong> ${pessoa.envolvimento}</p>
            </div>
        `;
    });
    container.innerHTML = html;
}

export function formatCPF(value) {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 11) {
        cleaned = cleaned.substring(0, 11);
    }
    if (cleaned.length <= 11) {
        cleaned = cleaned.replace(/(\d{3})(\d)/, '$1.$2');
        cleaned = cleaned.replace(/(\d{3})(\d)/, '$1.$2');
        cleaned = cleaned.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return cleaned;
}

export async function saveAttendance(formData, attendanceMessage) {
    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        const sequentialNumber = await getNextSequentialNumber(today);
        const currentUser = getCurrentUser();

        const attendanceData = {
            numeroRegistro: sequentialNumber,
            dataHora: now.toLocaleString('pt-BR'),
            timestamp: now.getTime(),
            userId: currentUser ? (currentUser.cpf ? currentUser.cpf.replace(/\D/g, '') : currentUser.re) : null,
            ...formData,
            data: today,
            veiculos: veiculos.length > 0 ? veiculos : null,
            pessoas: pessoas.length > 0 ? pessoas : null
        };
        
        // If resgatando, add reference to original occurrence
        if (window.resgatandoOcorrenciaKey) {
            const atendimentos = await getData('atendimentos');
            const ocorrenciaOriginal = atendimentos[window.resgatandoOcorrenciaKey];
            attendanceData.ocorrenciaResgatadaDe = ocorrenciaOriginal.numeroRegistro;
            attendanceData.ocorrenciaResgatadaKey = window.resgatandoOcorrenciaKey;
            delete window.resgatandoOcorrenciaKey;
        }

        await pushData('atendimentos', attendanceData);
        showMessage(attendanceMessage, `Atendimento salvo com sucesso! Número do registro: ${sequentialNumber}`, 'success');

        clearVeiculos();
        clearPessoas();

        return true;
    } catch (error) {
        showMessage(attendanceMessage, 'Erro ao salvar atendimento: ' + error.message, 'error');
        return false;
    }
}

export async function checkExistingOcorrencias(telefone) {
    try {
        const atendimentos = await getData('atendimentos');
        
        if (!atendimentos) {
            return null;
        }
        
        const now = Date.now();
        const sixHoursAgo = now - (6 * 60 * 60 * 1000);
        
        const matchingOcorrencias = Object.entries(atendimentos)
            .filter(([key, atendimento]) => {
                return atendimento.telefone === telefone && 
                       atendimento.timestamp >= sixHoursAgo;
            })
            .sort((a, b) => b[1].timestamp - a[1].timestamp);
        
        if (matchingOcorrencias.length > 0) {
            return matchingOcorrencias[0]; // Return most recent
        }
        
        return null;
    } catch (error) {
        console.error('Erro ao verificar ocorrências:', error);
        return null;
    }
}

export async function reiterarOcorrencia(ocorrenciaKey, complemento = null) {
    try {
        const atendimentoRef = getRef(`atendimentos/${ocorrenciaKey}`);
        const now = new Date();
        
        const reiteracao = {
            dataHora: now.toLocaleString('pt-BR'),
            tipo: 'REITERAÇÃO'
        };
        
        if (complemento) {
            reiteracao.complemento = complemento;
        }
        
        const atendimentos = await getData('atendimentos');
        const ocorrencia = atendimentos[ocorrenciaKey];
        
        const reiteracoes = ocorrencia.reiteracoes || [];
        reiteracoes.push(reiteracao);
        
        await update(atendimentoRef, {
            reiteracoes: reiteracoes,
            ultimaReiteracao: now.toLocaleString('pt-BR'),
            reiteracaoLida: false
        });
        
        return true;
    } catch (error) {
        console.error('Erro ao reiterar ocorrência:', error);
        return false;
    }
}

export async function resgatarOcorrencia(ocorrenciaKey) {
    // This function is no longer needed as we're using the form directly
    return null;
}

export async function loadUserOcorrencias(ocorrenciasContent) {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        ocorrenciasContent.innerHTML = '<p>Usuário não identificado.</p>';
        return;
    }

    try {
        const atendimentos = await getData('atendimentos');

        if (!atendimentos) {
            ocorrenciasContent.innerHTML = '<p>Nenhuma ocorrência encontrada.</p>';
            return;
        }

        const now = Date.now();
        const sevenHoursAgo = now - (7 * 60 * 60 * 1000);

        const userOcorrencias = Object.entries(atendimentos)
            .filter(([key, atendimento]) => atendimento.timestamp >= sevenHoursAgo)
            .sort((a, b) => b[1].timestamp - a[1].timestamp);

        if (userOcorrencias.length === 0) {
            ocorrenciasContent.innerHTML = '<p>Nenhuma ocorrência encontrada nas últimas 7 horas.</p>';
        } else {
            let html = '<div class="ocorrencias-grid">';
            userOcorrencias.forEach(([key, ocorrencia]) => {
                html += `
                    <div class="ocorrencia-card">
                        <h3>Registro #${ocorrencia.numeroRegistro}</h3>
                        <p><strong>Data/Hora:</strong> ${ocorrencia.dataHora}</p>
                        <p><strong>Nome:</strong> ${ocorrencia.nome}</p>
                        <p><strong>Telefone:</strong> ${ocorrencia.telefone}</p>
                        <p><strong>Endereço:</strong> ${ocorrencia.rua}, ${ocorrencia.numero} - ${ocorrencia.bairro}</p>
                        <p><strong>Município:</strong> ${ocorrencia.municipio} - ${ocorrencia.estado}</p>
                        <p><strong>CEP:</strong> ${ocorrencia.cep}</p>
                        <p><strong>BTL:</strong> ${ocorrencia.btl}</p>
                        <p><strong>Referência:</strong> ${ocorrencia.referencia}</p>
                        <p><strong>Natureza:</strong> ${ocorrencia.natureza}</p>
                        <p><strong>Gravidade:</strong> ${ocorrencia.gravidade}</p>
                        <p><strong>Histórico:</strong> ${ocorrencia.historico}</p>
                    </div>
                `;
            });
            html += '</div>';
            ocorrenciasContent.innerHTML = html;
        }
    } catch (error) {
        ocorrenciasContent.innerHTML = '<p>Erro ao carregar ocorrências: ' + error.message + '</p>';
    }
}