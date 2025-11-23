import { getData, getRef } from './database.js';
import { getCurrentUser } from './auth.js';
import { update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { loadDispatcherOcorrencias } from './dispatcher.js';

export async function showRedirecionarDialog(key, ocorrencia) {
    const modal = document.getElementById('ocorrenciaModal');
    const modalContent = document.getElementById('ocorrenciaModalContent');

    let btlOptionsHTML = '';
    for (let i = 1; i <= 49; i++) {
        if (i === 34 || i === 40 || i === 41 || i === 42 || i === 44 || i === 45 || i === 47) continue;
        
        const btlValue = `${String(i).padStart(2, '0')}º BPM/M`;
        if (btlValue !== ocorrencia.btl) {
            btlOptionsHTML += `<option value="${btlValue}">${btlValue}</option>`;
        }
    }

    let html = `
        <h2>Redirecionar Ocorrência #${ocorrencia.numeroRegistro}</h2>
        <div class="modal-details">
            <p><strong>BTL Atual:</strong> ${ocorrencia.btl}</p>
        </div>
        <div class="vtr-assignment-form">
            <label for="btlRedirecionarSelect">Selecione o BTL de destino:</label>
            <select id="btlRedirecionarSelect" class="vtr-select">
                <option value="">Selecione...</option>
                ${btlOptionsHTML}
            </select>
            <button id="btnProximoRedirecionar" class="btn-cadastro" style="width: 100%; margin-top: 10px;">Próximo</button>
            <button id="btnCancelarRedirecionar" class="btn-secondary" style="width: 100%; margin-top: 10px;">Cancelar</button>
        </div>
    `;

    modalContent.innerHTML = html;

    document.getElementById('btnProximoRedirecionar').addEventListener('click', () => {
        const btlSelecionado = document.getElementById('btlRedirecionarSelect').value;

        if (!btlSelecionado) {
            alert('Por favor, selecione um BTL');
            return;
        }

        showObservacaoDialog(key, ocorrencia, btlSelecionado);
    });

    document.getElementById('btnCancelarRedirecionar').addEventListener('click', async () => {
        const atendimentos = await getData('atendimentos');
        const { showOcorrenciaDetails } = await import('./occurrence-modal.js');
        await showOcorrenciaDetails(key, atendimentos[key]);
    });
}

async function showObservacaoDialog(key, ocorrencia, btlDestino) {
    const modal = document.getElementById('ocorrenciaModal');
    const modalContent = document.getElementById('ocorrenciaModalContent');

    let html = `
        <h2>Redirecionar Ocorrência #${ocorrencia.numeroRegistro}</h2>
        <div class="modal-details">
            <p><strong>BTL Atual:</strong> ${ocorrencia.btl}</p>
            <p><strong>BTL Destino:</strong> ${btlDestino}</p>
        </div>
        <div class="vtr-assignment-form">
            <label for="observacaoRedirecionar">Observação:</label>
            <textarea id="observacaoRedirecionar" rows="4" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;"></textarea>
            <button id="btnConfirmarRedirecionar" class="btn-cadastro" style="width: 100%; margin-top: 10px;">Confirmar</button>
            <button id="btnVoltarRedirecionar" class="btn-secondary" style="width: 100%; margin-top: 10px;">Voltar</button>
        </div>
    `;

    modalContent.innerHTML = html;

    const observacaoInput = document.getElementById('observacaoRedirecionar');
    observacaoInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });

    document.getElementById('btnConfirmarRedirecionar').addEventListener('click', async () => {
        const observacao = document.getElementById('observacaoRedirecionar').value.trim();

        if (!observacao) {
            alert('Por favor, insira uma observação');
            return;
        }

        try {
            const atendimentoRef = getRef(`atendimentos/${key}`);
            await update(atendimentoRef, {
                btl: btlDestino,
                btlOriginal: ocorrencia.btl,
                observacaoRedirecionamento: observacao,
                dataHoraRedirecionamento: new Date().toLocaleString('pt-BR')
            });

            alert(`Ocorrência redirecionada para ${btlDestino} com sucesso!`);
            modal.style.display = 'none';

            const currentUser = getCurrentUser();
            await loadDispatcherOcorrencias(currentUser.paValue, document.getElementById('dispatcherContent'));
        } catch (error) {
            alert('Erro ao redirecionar ocorrência: ' + error.message);
        }
    });

    document.getElementById('btnVoltarRedirecionar').addEventListener('click', () => {
        showRedirecionarDialog(key, ocorrencia);
    });
}

