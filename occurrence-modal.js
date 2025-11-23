import { getData, pushData, getRef } from './database.js';
import { getCurrentUser } from './auth.js';
import { update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { loadDispatcherOcorrencias } from './dispatcher.js';

export async function showOcorrenciaDetails(key, ocorrencia) {
    const modal = document.getElementById('ocorrenciaModal');
    const modalContent = document.getElementById('ocorrenciaModalContent');

    const vtrsDisponiveis = await getData('vtrsDisponiveis') || {};
    const vtrAssignments = await getData('vtrAssignments') || {};

    const assignedVTRNumbers = new Set(Object.values(vtrAssignments).map(v => v.vtrNumber));

    const currentUser = getCurrentUser();
    let btlForFiltering = currentUser.paValue;
    if (window.selectedBTL) {
        btlForFiltering = window.selectedBTL;
    }

    const btlPrefix = btlForFiltering.substring(0, 2);

    const availableVTRs = Object.entries(vtrsDisponiveis)
        .filter(([key, vtr]) => {
            if (assignedVTRNumbers.has(vtr.vtrNumber)) return false;

            const vtrPrefix = vtr.vtrNumber.substring(0, 2);
            return vtrPrefix === btlPrefix;
        })
        .sort((a, b) => a[1].vtrNumber.localeCompare(b[1].vtrNumber));

    let vtrOptionsHTML = '<option value="">Selecione uma VTR...</option>';
    availableVTRs.forEach(([key, vtr]) => {
        vtrOptionsHTML += `<option value="${vtr.vtrNumber}">${vtr.vtrNumber}</option>`;
    });

    let veiculosHTML = '';
    if (ocorrencia.veiculos && ocorrencia.veiculos.length > 0) {
        veiculosHTML = '<div style="margin-top: 15px; padding: 10px; background: #f5f5f5; border-radius: 4px;"><h3 style="margin-top: 0;">Veículos Envolvidos</h3>';
        ocorrencia.veiculos.forEach((veiculo, index) => {
            veiculosHTML += `
                <div style="margin-bottom: 10px; padding: 10px; background: white; border: 1px solid #ddd; border-radius: 4px;">
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
        veiculosHTML += '</div>';
    }

    let pessoasHTML = '';
    if (ocorrencia.pessoas && ocorrencia.pessoas.length > 0) {
        pessoasHTML = '<div style="margin-top: 15px; padding: 10px; background: #f5f5f5; border-radius: 4px;"><h3 style="margin-top: 0;">Pessoas Envolvidas</h3>';
        ocorrencia.pessoas.forEach((pessoa, index) => {
            pessoasHTML += `
                <div style="margin-bottom: 10px; padding: 10px; background: white; border: 1px solid #ddd; border-radius: 4px;">
                    <p><strong>Nome:</strong> ${pessoa.nome}</p>
                    ${pessoa.cpf ? `<p><strong>CPF:</strong> ${pessoa.cpf}</p>` : ''}
                    ${pessoa.dataNascimento ? `<p><strong>Data Nascimento:</strong> ${new Date(pessoa.dataNascimento).toLocaleDateString('pt-BR')}</p>` : ''}
                    ${pessoa.telefone ? `<p><strong>Telefone:</strong> ${pessoa.telefone}</p>` : ''}
                    <p><strong>Envolvimento:</strong> ${pessoa.envolvimento}</p>
                </div>
            `;
        });
        pessoasHTML += '</div>';
    }

    const isSOP = ocorrencia.gravidade === 'SOP';

    let html = `
        <h2>Detalhes da Ocorrência #${ocorrencia.numeroRegistro}</h2>
        <div class="modal-details">
            <p><strong>Data/Hora:</strong> ${ocorrencia.dataHora}</p>
            <p><strong>Nome:</strong> ${ocorrencia.nome}</p>
            <p><strong>Telefone:</strong> ${ocorrencia.telefone}</p>
            <p><strong>Endereço:</strong> ${ocorrencia.rua}, ${ocorrencia.numero} - ${ocorrencia.bairro}</p>
            <p><strong>Município:</strong> ${ocorrencia.municipio} - ${ocorrencia.estado}</p>
            <p><strong>CEP:</strong> ${ocorrencia.cep}</p>
            <p><strong>BTL:</strong> ${ocorrencia.btl}</p>
            <p><strong>Referência:</strong> ${ocorrencia.referencia}</p>
            <p><strong>Natureza:</strong> ${ocorrencia.natureza}</p>
            <p><strong>Gravidade:</strong> <span class="gravidade-${ocorrencia.gravidade.toLowerCase()}">${ocorrencia.gravidade}</span></p>
            <p><strong>Histórico:</strong> ${ocorrencia.historico}</p>
            ${ocorrencia.complemento ? `<p><strong>Complemento:</strong> ${ocorrencia.complemento}</p>` : ''}
            ${ocorrencia.dataHoraIrradiado ? `<p><strong>Irradiado em:</strong> ${ocorrencia.dataHoraIrradiado}</p>` : ''}
            ${ocorrencia.observacaoRedirecionamento ? `<p><strong>Observação Redirecionamento:</strong> ${ocorrencia.observacaoRedirecionamento}</p>` : ''}
        </div>
        ${veiculosHTML}
        ${pessoasHTML}
    `;

    if (isSOP) {
        if (ocorrencia.dataHoraIrradiado) {
            html += `
                <div class="vtr-assignment-form">
                    <button id="btnIrradiado" class="btn-cadastro" style="width: 100%; margin-bottom: 10px; background-color: #999;" disabled>Irradiado</button>
                    <button id="btnManterOcorrencia" class="btn-secondary" style="width: 100%; margin-bottom: 10px;">Manter</button>
                    <button id="btnEncerrarOcorrencia" class="btn-cadastro" style="width: 100%; background-color: #d32f2f;">Encerrar</button>
                </div>
            `;
        } else {
            html += `
                <div class="vtr-assignment-form">
                    <button id="btnIrradiado" class="btn-cadastro" style="width: 100%; margin-bottom: 10px; background-color: #388e3c;">Irradiado</button>
                    <button id="btnRedirecionar" class="btn-secondary" style="width: 100%; margin-top: 10px;">Redirecionar</button>
                </div>
            `;
        }
    } else {
        html += `
            <div class="vtr-assignment-form">
                <label for="vtrEmpenharSelect">Empenhar VTR:</label>
                <select id="vtrEmpenharSelect" class="vtr-select">
                    ${vtrOptionsHTML}
                </select>
                <button id="btnConfirmarVTR" class="btn-cadastro">Confirmar</button>
                <button id="btnRedirecionar" class="btn-secondary" style="width: 100%; margin-top: 10px;">Redirecionar</button>
            </div>
        `;
    }

    modalContent.innerHTML = html;
    modal.style.display = 'block';

    setupOcorrenciaModalHandlers(key, ocorrencia, modal, isSOP);
}

function setupOcorrenciaModalHandlers(key, ocorrencia, modal, isSOP) {
    const btnRedirecionar = document.getElementById('btnRedirecionar');
    if (btnRedirecionar) {
        btnRedirecionar.addEventListener('click', async () => {
            const { showRedirecionarDialog } = await import('./occurrence-redirect.js');
            showRedirecionarDialog(key, ocorrencia);
        });
    }

    if (isSOP) {
        const btnIrradiado = document.getElementById('btnIrradiado');
        const btnManterOcorrencia = document.getElementById('btnManterOcorrencia');
        const btnEncerrarOcorrencia = document.getElementById('btnEncerrarOcorrencia');

        if (btnIrradiado && !ocorrencia.dataHoraIrradiado) {
            btnIrradiado.addEventListener('click', async () => {
                try {
                    const now = new Date();
                    const dataHoraIrradiado = now.toLocaleString('pt-BR');

                    const atendimentoRef = getRef(`atendimentos/${key}`);
                    await update(atendimentoRef, {
                        dataHoraIrradiado: dataHoraIrradiado
                    });

                    const atendimentosAtualizados = await getData('atendimentos');
                    const ocorrenciaAtualizada = atendimentosAtualizados[key];

                    modal.style.display = 'none';
                    await showOcorrenciaDetails(key, ocorrenciaAtualizada);
                } catch (error) {
                    alert('Erro ao registrar irradiado: ' + error.message);
                }
            });
        }

        if (btnManterOcorrencia) {
            btnManterOcorrencia.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        if (btnEncerrarOcorrencia) {
            btnEncerrarOcorrencia.addEventListener('click', async () => {
                try {
                    const atendimentoRef = getRef(`atendimentos/${key}`);
                    await update(atendimentoRef, {
                        encerrado: true,
                        historicoFinal: `IRRADIADO EM ${ocorrencia.dataHoraIrradiado}`,
                        resultado: 'IRRADIADO',
                        dataHoraEncerramento: new Date().toLocaleString('pt-BR')
                    });

                    alert('Ocorrência encerrada como irradiado!');
                    modal.style.display = 'none';

                    const currentUser = getCurrentUser();
                    await loadDispatcherOcorrencias(currentUser.paValue, document.getElementById('dispatcherContent'));
                } catch (error) {
                    alert('Erro ao encerrar ocorrência: ' + error.message);
                }
            });
        }
    } else {
        const btnConfirmarVTR = document.getElementById('btnConfirmarVTR');
        if (btnConfirmarVTR) {
            btnConfirmarVTR.addEventListener('click', async () => {
                const vtrNumber = document.getElementById('vtrEmpenharSelect').value;

                if (!vtrNumber) {
                    alert('Por favor, selecione uma VTR');
                    return;
                }

                try {
                    await pushData('vtrAssignments', {
                        vtrNumber: vtrNumber,
                        ocorrenciaId: key,
                        timestamp: Date.now()
                    });

                    modal.style.display = 'none';
                    const currentUser = getCurrentUser();
                    await loadDispatcherOcorrencias(currentUser.paValue, document.getElementById('dispatcherContent'));
                } catch (error) {
                    alert('Erro ao empenhar VTR: ' + error.message);
                }
            });
        }
    }
}