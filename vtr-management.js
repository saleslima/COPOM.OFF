import { getData } from './database.js';
import { getCurrentUser } from './auth.js';

export async function loadVTRPanels(btlNumber) {
    try {
        const vtrsDisponiveis = await getData('vtrsDisponiveis') || {};
        const vtrAssignments = await getData('vtrAssignments') || {};
        const atendimentos = await getData('atendimentos') || {};

        const assignedVTRNumbers = new Set(Object.values(vtrAssignments).map(v => v.vtrNumber));

        let btlPrefix = btlNumber.substring(0, 2);

        if (window.selectedBTL) {
            btlPrefix = window.selectedBTL.substring(0, 2);
        }

        const availableVTRs = Object.entries(vtrsDisponiveis)
            .filter(([key, vtr]) => {
                if (assignedVTRNumbers.has(vtr.vtrNumber)) return false;

                const vtrPrefix = vtr.vtrNumber.substring(0, 2);
                return vtrPrefix === btlPrefix;
            })
            .sort((a, b) => a[1].vtrNumber.localeCompare(b[1].vtrNumber));

        const vtrDisponiveisContent = document.getElementById('vtrDisponiveisContent');
        if (availableVTRs.length === 0) {
            vtrDisponiveisContent.innerHTML = '<p class="no-vtrs">Nenhuma VTR disponível</p>';
        } else {
            let html = '';
            availableVTRs.forEach(([key, vtr]) => {
                html += `<div class="vtr-disponivel-item" data-vtr="${vtr.vtrNumber}">${vtr.vtrNumber}</div>`;
            });
            vtrDisponiveisContent.innerHTML = html;
        }

        const empenhadasForBTL = Object.entries(vtrAssignments).filter(([key, assignment]) => {
            const vtrPrefix = assignment.vtrNumber.substring(0, 2);
            return vtrPrefix === btlPrefix;
        });

        const vtrEmpenhadasContent = document.getElementById('vtrEmpenhadasContent');
        if (empenhadasForBTL.length === 0) {
            vtrEmpenhadasContent.innerHTML = '<p class="no-vtrs">Nenhuma VTR empenhada</p>';
        } else {
            let html = '<div class="vtr-list">';
            empenhadasForBTL.forEach(([key, assignment]) => {
                const ocorrencia = atendimentos[assignment.ocorrenciaId];
                if (ocorrencia) {
                    html += `
                        <div class="vtr-item" data-vtr="${assignment.vtrNumber}" data-ocorrencia-key="${assignment.ocorrenciaId}">
                            <div class="vtr-number">VTR ${assignment.vtrNumber}</div>
                            <div class="vtr-occurrence">#${ocorrencia.numeroRegistro}</div>
                            <div class="vtr-gravidade gravidade-${ocorrencia.gravidade.toLowerCase()}">${ocorrencia.gravidade}</div>
                        </div>
                    `;
                }
            });
            html += '</div>';
            vtrEmpenhadasContent.innerHTML = html;

            document.querySelectorAll('.vtr-item').forEach(item => {
                item.addEventListener('dblclick', async () => {
                    const ocorrenciaKey = item.getAttribute('data-ocorrencia-key');
                    const vtrNumber = item.getAttribute('data-vtr');
                    const { showVTROcorrenciaDetails } = await import('./vtr-occurrence-modal.js');
                    showVTROcorrenciaDetails(ocorrenciaKey, atendimentos[ocorrenciaKey], vtrNumber);
                });
            });
        }
    } catch (error) {
        console.error('Erro ao carregar VTRs:', error);
    }
}