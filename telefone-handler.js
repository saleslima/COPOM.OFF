import { checkExistingOcorrencias, reiterarOcorrencia, clearVeiculos, clearPessoas, addVeiculo, addPessoa, renderVeiculos, renderPessoas } from './attendance.js';
import { getData, getRef } from './database.js';
import { update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function setupTelefoneHandler() {
    const telefoneInput = document.getElementById('telefone');

    telefoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length > 0) {
            if (value.length <= 2) {
                value = `(${value}`;
            } else if (value.length <= 6) {
                value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
            } else if (value.length <= 10) {
                value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
            } else {
                value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
            }
        }

        e.target.value = value;
    });

    telefoneInput.addEventListener('blur', async (e) => {
        const telefone = e.target.value.trim();

        if (!telefone) return;

        const digitsOnly = telefone.replace(/\D/g, '');

        if (digitsOnly.length >= 3) {
            const firstDigitAfterDDD = digitsOnly.charAt(2);

            if (firstDigitAfterDDD === '9') {
                if (digitsOnly.length !== 11) {
                    alert('Telefone com DDD deve ter 11 dígitos quando começar com 9 (DDD + 9 dígitos)');
                    e.target.focus();
                    return;
                }
            }
        }

        const existingOcorrencia = await checkExistingOcorrencias(telefone);

        if (existingOcorrencia) {
            const [key, ocorrencia] = existingOcorrencia;

            const existingAlert = document.querySelector('.telefone-alert');
            if (existingAlert) {
                existingAlert.remove();
            }

            const alertDiv = document.createElement('div');
            alertDiv.className = 'telefone-alert';
            alertDiv.style.cssText = 'background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin-top: 10px; margin-bottom: 10px;';

            if (ocorrencia.encerrado) {
                alertDiv.innerHTML = `
                    <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Ocorrência encerrada encontrada:</strong> #${ocorrencia.numeroRegistro} (${ocorrencia.dataHora})</p>
                    <p style="margin: 0 0 10px 0; font-size: 13px;"><strong>Endereço:</strong> ${ocorrencia.rua}, ${ocorrencia.numero} - ${ocorrencia.bairro}</p>
                    <p style="margin: 0 0 10px 0; font-size: 13px;"><strong>Natureza:</strong> ${ocorrencia.natureza}</p>
                    <div style="display: flex; gap: 10px;">
                        <button id="btnResgatarOcorrencia" class="btn-cadastro" style="padding: 8px 16px; font-size: 14px; flex: 1;">Resgatar Ocorrência</button>
                        <button id="btnCancelarAlerta" class="btn-secondary" style="padding: 8px 16px; font-size: 14px; flex: 1;">Cancelar</button>
                    </div>
                `;
            } else {
                alertDiv.innerHTML = `
                    <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Ocorrência em aberto encontrada:</strong> #${ocorrencia.numeroRegistro} (${ocorrencia.dataHora})</p>
                    <p style="margin: 0 0 10px 0; font-size: 13px;"><strong>Endereço:</strong> ${ocorrencia.rua}, ${ocorrencia.numero} - ${ocorrencia.bairro}</p>
                    <p style="margin: 0 0 10px 0; font-size: 13px;"><strong>Natureza:</strong> ${ocorrencia.natureza}</p>
                    ${ocorrencia.reiteracoes && ocorrencia.reiteracoes.length > 0 ? `<p style="margin: 0 0 10px 0; font-size: 13px; color: #d32f2f;"><strong>Reiterações:</strong> ${ocorrencia.reiteracoes.length}</p>` : ''}
                    <div style="display: flex; gap: 10px;">
                        <button id="btnReiterarOcorrencia" class="btn-cadastro" style="padding: 8px 16px; font-size: 14px; flex: 1;">Reiterar</button>
                        <button id="btnReiterarComComplemento" class="btn-secondary" style="padding: 8px 16px; font-size: 14px; flex: 1;">Reiterar com Complemento</button>
                        <button id="btnCancelarAlerta" class="btn-secondary" style="padding: 8px 16px; font-size: 14px; flex: 1;">Cancelar</button>
                    </div>
                    <div id="reiteracaoComplementoSection" style="display: none; margin-top: 15px;">
                        <label for="reiteracaoComplemento" style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 14px;">Histórico Complementar:</label>
                        <textarea id="reiteracaoComplemento" rows="4" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; font-size: 14px; margin-bottom: 10px;"></textarea>
                        <button id="btnSalvarReiteracaoComplemento" class="btn-cadastro" style="padding: 8px 16px; font-size: 14px; width: 100%;">Salvar Reiteração</button>
                    </div>
                `;
            }

            telefoneInput.parentNode.insertAdjacentElement('afterend', alertDiv);

            setupOcorrenciaHandlers(key, ocorrencia, alertDiv, telefoneInput);
        }
    });
}

function setupOcorrenciaHandlers(key, ocorrencia, alertDiv, telefoneInput) {
    const btnReiterar = document.getElementById('btnReiterarOcorrencia');
    const btnResgatar = document.getElementById('btnResgatarOcorrencia');
    const btnReiterarComComplemento = document.getElementById('btnReiterarComComplemento');
    const btnCancelarAlerta = document.getElementById('btnCancelarAlerta');
    const reiteracaoComplementoTextarea = document.getElementById('reiteracaoComplemento');
    const attendanceForm = document.getElementById('attendanceForm');
    const btnVeiculos = document.getElementById('btnVeiculos');
    const btnPessoas = document.getElementById('btnPessoas');
    const btnBackFromAttendance = document.getElementById('btnBackFromAttendance');

    if (reiteracaoComplementoTextarea) {
        reiteracaoComplementoTextarea.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    if (btnReiterarComComplemento) {
        btnReiterarComComplemento.addEventListener('click', () => {
            const section = document.getElementById('reiteracaoComplementoSection');
            section.style.display = section.style.display === 'none' ? 'block' : 'none';

            if (section.style.display === 'block') {
                document.querySelectorAll('.form-row, .form-group').forEach(el => {
                    if (!el.closest('#reiteracaoComplementoSection') && el.id !== 'historico') {
                        el.style.display = 'none';
                    }
                });
                document.getElementById('veiculosSection').style.display = 'none';
                document.getElementById('pessoasSection').style.display = 'none';
                btnVeiculos.style.display = 'none';
                btnPessoas.style.display = 'none';
                attendanceForm.querySelector('.button-group').style.display = 'none';

                const historicoField = document.getElementById('historico');
                historicoField.value = ocorrencia.historico;
                historicoField.readOnly = false;
                historicoField.parentElement.style.display = 'block';

                btnBackFromAttendance.style.display = 'none';

                let btnSalvarHistorico = document.getElementById('btnSalvarHistoricoReiteracao');
                if (!btnSalvarHistorico) {
                    btnSalvarHistorico = document.createElement('button');
                    btnSalvarHistorico.id = 'btnSalvarHistoricoReiteracao';
                    btnSalvarHistorico.type = 'button';
                    btnSalvarHistorico.className = 'btn-cadastro';
                    btnSalvarHistorico.textContent = 'Salvar';
                    btnSalvarHistorico.style.cssText = 'margin-top: 20px; margin-right: 10px;';
                    btnBackFromAttendance.parentNode.insertBefore(btnSalvarHistorico, btnBackFromAttendance);

                    btnSalvarHistorico.addEventListener('click', async () => {
                        await handleSalvarHistoricoReiteracao(key, ocorrencia, alertDiv, telefoneInput);
                    });
                } else {
                    btnSalvarHistorico.style.display = '';
                }
            } else {
                restoreFormFields(btnVeiculos, btnPessoas, attendanceForm, btnBackFromAttendance);
            }
        });
    }

    const btnSalvarReiteracaoComplemento = document.getElementById('btnSalvarReiteracaoComplemento');
    if (btnSalvarReiteracaoComplemento) {
        btnSalvarReiteracaoComplemento.addEventListener('click', async () => {
            await handleSalvarHistoricoReiteracao(key, ocorrencia, alertDiv, telefoneInput);
        });
    }

    if (btnReiterar) {
        btnReiterar.addEventListener('click', async () => {
            const success = await reiterarOcorrencia(key);
            if (success) {
                alert(`Ocorrência #${ocorrencia.numeroRegistro} reiterada com sucesso!`);
                alertDiv.remove();
                telefoneInput.value = '';
            } else {
                alert('Erro ao reiterar ocorrência');
            }
        });
    }

    if (btnResgatar) {
        btnResgatar.addEventListener('click', async () => {
            document.getElementById('telefone').value = ocorrencia.telefone;
            document.getElementById('nomeAtendimento').value = ocorrencia.nome;
            document.getElementById('cep').value = ocorrencia.cep;
            document.getElementById('rua').value = ocorrencia.rua;
            document.getElementById('numero').value = ocorrencia.numero;
            document.getElementById('bairro').value = ocorrencia.bairro;
            document.getElementById('municipio').value = ocorrencia.municipio;
            document.getElementById('estado').value = ocorrencia.estado;
            document.getElementById('btl').value = ocorrencia.btl;
            document.getElementById('referencia').value = ocorrencia.referencia;
            document.getElementById('historico').value = ocorrencia.historico;
            document.getElementById('natureza').value = ocorrencia.natureza;
            document.getElementById('gravidade').value = ocorrencia.gravidade;

            if (ocorrencia.veiculos && ocorrencia.veiculos.length > 0) {
                clearVeiculos();
                ocorrencia.veiculos.forEach(v => {
                    addVeiculo({ ...v, id: Date.now() + Math.random() });
                });
                renderVeiculos(document.getElementById('veiculosAdicionados'));
            }

            if (ocorrencia.pessoas && ocorrencia.pessoas.length > 0) {
                clearPessoas();
                ocorrencia.pessoas.forEach(p => {
                    addPessoa({ ...p, id: Date.now() + Math.random() });
                });
                renderPessoas(document.getElementById('pessoasAdicionados'));
            }

            window.resgatandoOcorrenciaKey = key;

            alert(`Formulário preenchido com dados da ocorrência #${ocorrencia.numeroRegistro}. Você pode adicionar informações ao histórico antes de salvar.`);
            alertDiv.remove();
        });
    }

    if (btnCancelarAlerta) {
        btnCancelarAlerta.addEventListener('click', () => {
            alertDiv.remove();
        });
    }
}

async function handleSalvarHistoricoReiteracao(key, ocorrencia, alertDiv, telefoneInput) {
    const historicoAtualizado = document.getElementById('historico').value.trim();

    if (!historicoAtualizado || historicoAtualizado === ocorrencia.historico) {
        alert('Por favor, modifique o histórico antes de salvar');
        return;
    }

    const atendimentoRef = getRef(`atendimentos/${key}`);
    const now = new Date();

    const reiteracao = {
        dataHora: now.toLocaleString('pt-BR'),
        tipo: 'REITERAÇÃO COM COMPLEMENTO',
        historicoAnterior: ocorrencia.historico,
        historicoNovo: historicoAtualizado
    };

    const atendimentos = await getData('atendimentos');
    const ocorrenciaAtual = atendimentos[key];

    const reiteracoes = ocorrenciaAtual.reiteracoes || [];
    reiteracoes.push(reiteracao);

    await update(atendimentoRef, {
        historico: historicoAtualizado,
        reiteracoes: reiteracoes,
        ultimaReiteracao: now.toLocaleString('pt-BR'),
        reiteracaoLida: false
    });

    alert(`Ocorrência #${ocorrencia.numeroRegistro} reiterada com complemento e histórico atualizado!`);
    alertDiv.remove();
    telefoneInput.value = '';

    const btnVeiculos = document.getElementById('btnVeiculos');
    const btnPessoas = document.getElementById('btnPessoas');
    const attendanceForm = document.getElementById('attendanceForm');
    const btnBackFromAttendance = document.getElementById('btnBackFromAttendance');

    restoreFormFields(btnVeiculos, btnPessoas, attendanceForm, btnBackFromAttendance);

    document.getElementById('historico').value = '';
}

function restoreFormFields(btnVeiculos, btnPessoas, attendanceForm, btnBackFromAttendance) {
    document.querySelectorAll('.form-row, .form-group').forEach(el => {
        if (!el.closest('#reiteracaoComplementoSection')) {
            el.style.display = '';
        }
    });
    btnVeiculos.style.display = '';
    btnPessoas.style.display = '';
    attendanceForm.querySelector('.button-group').style.display = '';
    btnBackFromAttendance.style.display = '';

    const btnSalvarHistorico = document.getElementById('btnSalvarHistoricoReiteracao');
    if (btnSalvarHistorico) {
        btnSalvarHistorico.style.display = 'none';
    }
}