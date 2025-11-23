import { getData, pushData, removeData, updateData, getRef } from './database.js';
import { getCurrentUser } from './auth.js';
import { update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { formatDateTimeLocal } from './search.js';

export async function loadDispatcherOcorrencias(btlNumber, dispatcherContent) {
    try {
        const atendimentos = await getData('atendimentos');

        if (!atendimentos) {
            dispatcherContent.innerHTML = '<p>Nenhuma ocorrência encontrada.</p>';
            const { loadVTRPanels } = await import('./vtr-management.js');
            await loadVTRPanels(btlNumber);
            return;
        }

        const vtrAssignments = await getData('vtrAssignments') || {};
        const assignedOcorrencias = new Map();
        Object.values(vtrAssignments).forEach(v => {
            assignedOcorrencias.set(v.ocorrenciaId, v.vtrNumber);
        });

        const btlOcorrencias = Object.entries(atendimentos)
            .filter(([key, atendimento]) => {
                return atendimento.btl === btlNumber && !atendimento.encerrado;
            })
            .sort((a, b) => b[1].timestamp - a[1].timestamp);

        if (btlOcorrencias.length === 0) {
            dispatcherContent.innerHTML = '<p>Nenhuma ocorrência pendente para este BTL.</p>';
        } else {
            const now = Date.now();
            let html = '<div class="ocorrencias-list-dispatcher">';
            btlOcorrencias.forEach(([key, ocorrencia]) => {
                const tempoMs = now - ocorrencia.timestamp;
                const horas = Math.floor(tempoMs / (1000 * 60 * 60));
                const minutos = Math.floor((tempoMs % (1000 * 60 * 60)) / (1000 * 60));
                const tempoFormatado = `${horas}h ${minutos}min`;

                const naturezaCodigo = ocorrencia.natureza.split(' - ')[0];

                let corNatureza = '';
                if (ocorrencia.gravidade === 'URGENTE') {
                    corNatureza = 'color: #d32f2f;';
                } else if (ocorrencia.gravidade === 'NORMAL') {
                    corNatureza = 'color: #1976d2;';
                } else if (ocorrencia.gravidade === 'SOP') {
                    corNatureza = 'color: #388e3c;';
                }

                const numReiteracoes = ocorrencia.reiteracoes ? ocorrencia.reiteracoes.length : 0;
                const hasVTR = assignedOcorrencias.has(key);

                const isReiteradaNaoLida = ocorrencia.ultimaReiteracao && !ocorrencia.reiteracaoLida;

                let itemClass = 'ocorrencia-item-dispatcher';
                if (isReiteradaNaoLida) {
                    itemClass += ' ocorrencia-reiterada-nao-lida';
                }

                const showInPendencias = !hasVTR || isReiteradaNaoLida;

                if (showInPendencias) {
                    html += `
                        <div class="${itemClass}" data-key="${key}" style="display: flex; align-items: center; gap: 10px; padding: 10px 15px;">
                            <span style="font-weight: 600; font-size: 16px; min-width: 50px;">#${ocorrencia.numeroRegistro}</span>
                            <span style="flex: 1; font-size: 14px;">${ocorrencia.rua}, ${ocorrencia.numero}</span>
                            <span style="font-weight: 600; font-size: 14px; ${corNatureza} min-width: 60px;">${naturezaCodigo}</span>
                            <span style="font-size: 14px; color: #666; min-width: 80px;">${tempoFormatado}</span>
                            <span style="font-size: 14px; font-weight: 600; color: ${numReiteracoes > 0 ? '#d32f2f' : '#999'}; min-width: 40px; text-align: center;">${numReiteracoes}</span>
                        </div>
                    `;
                }
            });
            html += '</div>';
            dispatcherContent.innerHTML = html;

            document.querySelectorAll('.ocorrencia-item-dispatcher').forEach(item => {
                item.addEventListener('click', async () => {
                    const key = item.getAttribute('data-key');
                    const atendimentos = await getData('atendimentos');
                    const ocorrencia = atendimentos[key];

                    if (ocorrencia.ultimaReiteracao && !ocorrencia.reiteracaoLida) {
                        const atendimentoRef = getRef(`atendimentos/${key}`);
                        await update(atendimentoRef, {
                            reiteracaoLida: true
                        });
                    }

                    item.classList.remove('ocorrencia-reiterada-nao-lida');

                    const vtrAssignments = await getData('vtrAssignments') || {};
                    const hasVTR = Object.values(vtrAssignments).some(v => v.ocorrenciaId === key);
                    if (hasVTR) {
                        item.remove();
                    }
                });

                item.addEventListener('dblclick', async () => {
                    const key = item.getAttribute('data-key');
                    const atendimentos = await getData('atendimentos');
                    const { showOcorrenciaDetails } = await import('./occurrence-modal.js');
                    showOcorrenciaDetails(key, atendimentos[key]);
                });
            });
        }

        const { loadVTRPanels } = await import('./vtr-management.js');
        await loadVTRPanels(btlNumber);

        const { setupDispatcherSearch } = await import('./dispatcher-search.js');
        setupDispatcherSearch();
        
        // Setup VTR cadastro button
        const btnCadastrarVTR = document.getElementById('btnCadastrarVTR');
        if (btnCadastrarVTR) {
            // Remove any existing listeners
            const newBtn = btnCadastrarVTR.cloneNode(true);
            btnCadastrarVTR.parentNode.replaceChild(newBtn, btnCadastrarVTR);
            
            newBtn.addEventListener('click', async () => {
                const vtrNumber = document.getElementById('vtrCadastroInput').value.trim().toUpperCase();

                if (!vtrNumber) {
                    alert('Por favor, digite o número da VTR');
                    return;
                }

                const success = await registerVTR(vtrNumber);

                if (success) {
                    document.getElementById('vtrCadastroInput').value = '';
                }
            });
        }
    } catch (error) {
        dispatcherContent.innerHTML = '<p>Erro ao carregar ocorrências: ' + error.message + '</p>';
    }
}

export async function registerVTR(vtrNumber) {
    try {
        const leadingDigits = vtrNumber.match(/^\d+/);
        if (!leadingDigits || leadingDigits[0].length < 5) {
            alert('VTR inválida! Deve iniciar com pelo menos 5 números.');
            return false;
        }
        
        await pushData('vtrsDisponiveis', {
            vtrNumber: vtrNumber,
            timestamp: Date.now()
        });

        const currentUser = getCurrentUser();
        await loadDispatcherOcorrencias(currentUser.paValue, document.getElementById('dispatcherContent'));
        return true;
    } catch (error) {
        alert('Erro ao cadastrar VTR: ' + error.message);
        return false;
    }
}