import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { initDatabase, pushData, getData, getRef, update } from './database.js';
import { 
    setCurrentUser, 
    getCurrentUser,
    loadUserProfiles, 
    updateFunctionOptions,
    updatePAOptions, 
    authenticateUser 
} from './auth.js';
import { showMessage, showScreen, formatCPF, formatCEP, setupAutoUppercase } from './utils.js';
import { 
    addVeiculo, 
    addPessoa, 
    removeVeiculoById, 
    removePessoaById, 
    renderVeiculos, 
    renderPessoas, 
    saveAttendance, 
    clearVeiculos,
    clearPessoas,
    checkExistingOcorrencias,
    reiterarOcorrencia
} from './attendance.js';
import { loadDispatcherOcorrencias, registerVTR } from './dispatcher.js';
import { setupOcorrenciasSearch } from './search.js';
import { setupTelefoneHandler } from './telefone-handler.js';
import { setupFormHandlers } from './form-handlers.js';
import { showUserDashboard, showDispatcherScreen, showSupervisorScreen } from './ui-screens.js';

const firebaseConfig = {
  apiKey: "AIzaSyAsPjA0R4ee9GAMLmqbHDPg15gh44sVAgM",
  authDomain: "copomoff-e0add.firebaseapp.com",
  databaseURL: "https://copomoff-e0add-default-rtdb.firebaseio.com",
  projectId: "copomoff-e0add",
  storageBucket: "copomoff-e0add.firebasestorage.app",
  messagingSenderId: "606132177403",
  appId: "1:606132177403:web:24e7c0485ece7bcd44235e",
  measurementId: "G-SR6NZRH2VB"
};

const app = initializeApp(firebaseConfig);
initDatabase(app);

// Screen elements
const loginScreen = document.getElementById('loginScreen');
const cadastroPasswordScreen = document.getElementById('cadastroPasswordScreen');
const userLoginScreen = document.getElementById('userLoginScreen');
const cadastroScreen = document.getElementById('cadastroScreen');
const userDashboard = document.getElementById('userDashboard');
const attendanceScreen = document.getElementById('attendanceScreen');
const dispatcherScreen = document.getElementById('dispatcherScreen');

export const allScreens = [loginScreen, cadastroPasswordScreen, userLoginScreen, cadastroScreen, userDashboard, attendanceScreen, dispatcherScreen];

// Button elements
const btnCadastro = document.getElementById('btnCadastro');
const btnUsuario = document.getElementById('btnUsuario');
const btnBackFromCadastroPassword = document.getElementById('btnBackFromCadastroPassword');
const btnBackFromUserLogin = document.getElementById('btnBackFromUserLogin');
const btnBackFromCadastro = document.getElementById('btnBackFromCadastro');
const btnLogout = document.getElementById('btnLogout');
const btnBackFromAttendance = document.getElementById('btnBackFromAttendance');
const btnLogoutDispatcher = document.getElementById('btnLogoutDispatcher');
const btnCadastrarVTR = document.getElementById('btnCadastrarVTR');
const btnNovoCadastro = document.getElementById('btnNovoCadastro');
const btnUsuarios = document.getElementById('btnUsuarios');
const searchUsuario = document.getElementById('searchUsuario');

// Form elements
const form = document.getElementById('cadastroForm');
const cadastroPasswordForm = document.getElementById('cadastroPasswordForm');
const userLoginForm = document.getElementById('userLoginForm');
const messageDiv = document.getElementById('message');
const cadastroPasswordMessage = document.getElementById('cadastroPasswordMessage');
const userLoginMessage = document.getElementById('userLoginMessage');
const attendanceMessage = document.getElementById('attendanceMessage');
const tipoSelect = document.getElementById('tipo');
const civilFields = document.getElementById('civilFields');
const militarFields = document.getElementById('militarFields');

// Check for existing session on page load
window.addEventListener('DOMContentLoaded', async () => {
    const savedSession = localStorage.getItem('copomUserSession');
    if (savedSession) {
        try {
            const userData = JSON.parse(savedSession);
            setCurrentUser(userData);
            showUserDashboard(userData, allScreens);
        } catch (error) {
            console.error('Error restoring session:', error);
            localStorage.removeItem('copomUserSession');
        }
    }
});

// Button event listeners
btnCadastro.addEventListener('click', () => {
    showScreen(cadastroPasswordScreen, allScreens);
});

btnUsuario.addEventListener('click', async () => {
    showScreen(userLoginScreen, allScreens);
});

btnBackFromCadastroPassword.addEventListener('click', () => {
    showScreen(loginScreen, allScreens);
    cadastroPasswordForm.reset();
    cadastroPasswordMessage.style.display = 'none';
});

btnBackFromUserLogin.addEventListener('click', () => {
    showScreen(loginScreen, allScreens);
    userLoginMessage.style.display = 'none';
    userLoginForm.reset();
});

btnBackFromCadastro.addEventListener('click', () => {
    showScreen(loginScreen, allScreens);
    form.reset();
    civilFields.style.display = 'none';
    militarFields.style.display = 'none';
});

btnLogout.addEventListener('click', () => {
    localStorage.removeItem('copomUserSession');
    setCurrentUser(null);
    showScreen(loginScreen, allScreens);
});

btnBackFromAttendance.addEventListener('click', () => {
    localStorage.removeItem('copomUserSession');
    setCurrentUser(null);
    showScreen(loginScreen, allScreens);
    document.getElementById('attendanceForm').reset();
    document.getElementById('ocorrenciasList').style.display = 'none';
});

btnLogoutDispatcher.addEventListener('click', () => {
    localStorage.removeItem('copomUserSession');
    setCurrentUser(null);
    showScreen(loginScreen, allScreens);
});

// Service change handler
document.getElementById('loginServico').addEventListener('change', (e) => {
    updateFunctionOptions(e.target.value, document.getElementById('loginPerfil'));
    document.getElementById('loginPA').innerHTML = '<option value="">Selecione...</option>';
});

// Profile change handler
document.getElementById('loginPerfil').addEventListener('change', (e) => {
    updatePAOptions(e.target.value, document.getElementById('loginPA'), document.getElementById('paLabel'));
});

// User login form submission
userLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const cpfRe = document.getElementById('loginCpfRe').value.toUpperCase();
    const servico = document.getElementById('loginServico').value;
    const perfil = document.getElementById('loginPerfil').value;
    const paValue = document.getElementById('loginPA').value;

    const userData = await authenticateUser(cpfRe, servico, perfil, paValue, userLoginMessage);

    if (userData) {
        localStorage.setItem('copomUserSession', JSON.stringify(userData));
        showUserDashboard(userData, allScreens);
    }
});

// Cadastro password form submission
cadastroPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const password = document.getElementById('cadastroPassword').value;

    if (password === 'DAQTA') {
        showScreen(cadastroScreen, allScreens);
        cadastroPasswordForm.reset();
        cadastroPasswordMessage.style.display = 'none';
    } else {
        showMessage(cadastroPasswordMessage, 'Senha incorreta!', 'error');
    }
});

// Show/hide fields based on tipo selection
tipoSelect.addEventListener('change', (e) => {
    const tipo = e.target.value;

    if (tipo === 'CIVIL') {
        civilFields.style.display = 'block';
        militarFields.style.display = 'none';
        document.getElementById('re').value = '';
        document.getElementById('graduacao').value = '';
        document.getElementById('nomeGuerra').value = '';
        document.querySelectorAll('input[name="funcaoMilitar"]').forEach(cb => cb.checked = false);
    } else if (tipo === 'MILITAR') {
        civilFields.style.display = 'none';
        militarFields.style.display = 'block';
        document.getElementById('cpf').value = '';
        document.getElementById('nomeCompleto').value = '';
        document.querySelectorAll('input[name="funcaoCivil"]').forEach(cb => cb.checked = false);
    } else {
        civilFields.style.display = 'none';
        militarFields.style.display = 'none';
    }
});

// Setup auto-uppercase for all text inputs
const uppercaseInputs = document.querySelectorAll('input[type="text"]:not([readonly])');
setupAutoUppercase(Array.from(uppercaseInputs));
setupAutoUppercase([document.getElementById('loginCpfRe')]);

// Add auto-uppercase for password input
document.getElementById('cadastroPassword').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
});

// CPF mask
document.getElementById('cpf').addEventListener('input', (e) => {
    e.target.value = formatCPF(e.target.value);
});

// CEP mask and auto-fill
const cepInput = document.getElementById('cep');
cepInput.addEventListener('input', (e) => {
    e.target.value = formatCEP(e.target.value);
});

cepInput.addEventListener('blur', async (e) => {
    const cep = e.target.value.replace(/\D/g, '');

    if (cep.length === 8) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                document.getElementById('rua').value = data.logradouro.toUpperCase();
                document.getElementById('bairro').value = data.bairro.toUpperCase();
                document.getElementById('municipio').value = data.localidade.toUpperCase();
                document.getElementById('estado').value = data.uf.toUpperCase();
            } else {
                showMessage(attendanceMessage, 'CEP não encontrado.', 'error');
            }
        } catch (error) {
            showMessage(attendanceMessage, 'Erro ao buscar CEP.', 'error');
        }
    }
});

setupAutoUppercase([document.getElementById('historico')]);

// Setup form handlers and search
setupFormHandlers(allScreens);
setupOcorrenciasSearch();
setupTelefoneHandler();

// Cadastro form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();    

    const tipo = tipoSelect.value;

    if (!tipo) {
        showMessage(messageDiv, 'Por favor, selecione o tipo.', 'error');
        return;
    }

    const servico = document.getElementById('servico').value;
    
    if (!servico) {
        showMessage(messageDiv, 'Por favor, selecione o serviço.', 'error');
        return;
    }

    let data = { tipo, servico, timestamp: Date.now() };

    if (tipo === 'CIVIL') {
        const cpf = document.getElementById('cpf').value;
        const nomeCompleto = document.getElementById('nomeCompleto').value.toUpperCase();
        const funcoesCheckboxes = document.querySelectorAll('input[name="funcaoCivil"]:checked');
        const funcoes = Array.from(funcoesCheckboxes).map(cb => cb.value);

        if (!cpf) {
            showMessage(messageDiv, 'Por favor, preencha o campo CPF.', 'error');
            return;
        }

        if (!nomeCompleto) {
            showMessage(messageDiv, 'Por favor, preencha o campo Nome Completo.', 'error');
            return;
        }

        if (funcoes.length === 0) {
            showMessage(messageDiv, 'Por favor, selecione ao menos uma função.', 'error');
            return;
        }

        const cpfDigits = cpf.replace(/\D/g, '');
        if (cpfDigits.length !== 11) {
            showMessage(messageDiv, 'CPF deve conter exatamente 11 dígitos.', 'error');
            return;
        }

        data = { ...data, cpf, nomeCompleto, funcoes };
    } else if (tipo === 'MILITAR') {
        const re = document.getElementById('re').value.toUpperCase();
        const graduacao = document.getElementById('graduacao').value;
        const nomeGuerra = document.getElementById('nomeGuerra').value.toUpperCase();
        const funcoesCheckboxes = document.querySelectorAll('input[name="funcaoMilitar"]:checked');
        const funcoes = Array.from(funcoesCheckboxes).map(cb => cb.value);

        if (!re) {
            showMessage(messageDiv, 'Por favor, preencha o campo RE.', 'error');
            return;
        }

        if (!graduacao) {
            showMessage(messageDiv, 'Por favor, selecione a graduação.', 'error');
            return;
        }

        if (!nomeGuerra) {
            showMessage(messageDiv, 'Por favor, preencha o campo Nome Guerra.', 'error');
            return;
        }

        if (funcoes.length === 0) {
            showMessage(messageDiv, 'Por favor, selecione ao menos uma função.', 'error');
            return;
        }

        data = { ...data, re, graduacao, nomeGuerra, funcoes };
    }

    try {
        if (window.editingUserKey) {
            // Update existing user
            const userRef = getRef(`cadastros/${window.editingUserKey}`);
            await update(userRef, data);
            showMessage(messageDiv, 'Usuário atualizado com sucesso!', 'success');
            delete window.editingUserKey;
            form.querySelector('button[type="submit"]').textContent = 'Cadastro';
        } else {
            // Create new user
            await pushData('cadastros', data);        
            showMessage(messageDiv, 'Salvo com sucesso!', 'success');
        }
        
        form.reset();
        civilFields.style.display = 'none';
        militarFields.style.display = 'none';
        
        // Refresh user list if it's visible
        if (document.getElementById('usuariosContainer').style.display !== 'none') {
            await loadUsuarios();
        }
    } catch (error) {
        showMessage(messageDiv, 'Erro ao realizar cadastro: ' + error.message, 'error');
    }
});

btnCadastrarVTR.addEventListener('click', async () => {
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

// Make remove functions global
window.removeVeiculo = function(id) {
    removeVeiculoById(id);
    renderVeiculos(document.getElementById('veiculosAdicionados'));
};

window.removePessoa = function(id) {
    removePessoaById(id);
    renderPessoas(document.getElementById('pessoasAdicionadas'));
};

btnNovoCadastro.addEventListener('click', () => {
    document.getElementById('cadastroFormContainer').style.display = 'block';
    document.getElementById('usuariosContainer').style.display = 'none';
    form.reset();
    civilFields.style.display = 'none';
    militarFields.style.display = 'none';
    messageDiv.style.display = 'none';
});

btnUsuarios.addEventListener('click', async () => {
    document.getElementById('cadastroFormContainer').style.display = 'none';
    document.getElementById('usuariosContainer').style.display = 'block';
    await loadUsuarios();
});

searchUsuario.addEventListener('input', async (e) => {
    e.target.value = e.target.value.toUpperCase();
    await loadUsuarios(e.target.value);
});

async function loadUsuarios(searchTerm = '') {
    const usuariosList = document.getElementById('usuariosList');
    
    try {
        const cadastros = await getData('cadastros');
        
        if (!cadastros) {
            usuariosList.innerHTML = '<p style="text-align: center; color: #999;">Nenhum usuário cadastrado.</p>';
            return;
        }
        
        let usuarios = Object.entries(cadastros)
            .map(([key, data]) => ({ key, ...data }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        if (searchTerm) {
            usuarios = usuarios.filter(user => {
                const cpf = user.cpf ? user.cpf.replace(/\D/g, '') : '';
                const re = user.re ? user.re.toUpperCase() : '';
                const searchClean = searchTerm.replace(/\D/g, '');
                
                return cpf.includes(searchClean) || re.includes(searchTerm);
            });
        } else {
            usuarios = usuarios.slice(0, 10);
        }
        
        if (usuarios.length === 0) {
            usuariosList.innerHTML = '<p style="text-align: center; color: #999;">Nenhum usuário encontrado.</p>';
            return;
        }
        
        let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';
        usuarios.forEach(user => {
            const funcoesDisplay = user.funcoes ? user.funcoes.join(', ') : (user.funcao || 'N/A');
            
            html += `
                <div style="background: #f9f9f9; padding: 15px; border: 1px solid #ddd; border-radius: 4px;">
                    ${user.tipo === 'CIVIL' ? `
                        <p style="margin: 5px 0;"><strong>Nome:</strong> ${user.nomeCompleto}</p>
                        <p style="margin: 5px 0;"><strong>CPF:</strong> ${user.cpf}</p>
                    ` : `
                        <p style="margin: 5px 0;"><strong>${user.graduacao} ${user.nomeGuerra}</strong></p>
                        <p style="margin: 5px 0;"><strong>RE:</strong> ${user.re}</p>
                    `}
                    <p style="margin: 5px 0;"><strong>Serviço:</strong> ${user.servico}</p>
                    <p style="margin: 5px 0;"><strong>Função(ões):</strong> ${funcoesDisplay}</p>
                    <button class="btn-cadastro" onclick="window.editarUsuario('${user.key}')" style="margin-top: 10px; padding: 8px 16px; font-size: 14px;">Editar</button>
                </div>
            `;
        });
        html += '</div>';
        usuariosList.innerHTML = html;
        
    } catch (error) {
        usuariosList.innerHTML = '<p style="text-align: center; color: #d32f2f;">Erro ao carregar usuários.</p>';
    }
}

window.editarUsuario = async function(userKey) {
    try {
        const cadastros = await getData('cadastros');
        const user = cadastros[userKey];
        
        if (!user) {
            alert('Usuário não encontrado');
            return;
        }
        
        document.getElementById('cadastroFormContainer').style.display = 'block';
        document.getElementById('usuariosContainer').style.display = 'none';
        
        window.editingUserKey = userKey;
        
        tipoSelect.value = user.tipo;
        tipoSelect.dispatchEvent(new Event('change'));
        
        document.getElementById('servico').value = user.servico;
        
        if (user.tipo === 'CIVIL') {
            document.getElementById('cpf').value = user.cpf;
            document.getElementById('nomeCompleto').value = user.nomeCompleto;
            
            if (user.funcoes) {
                document.querySelectorAll('input[name="funcaoCivil"]').forEach(cb => {
                    cb.checked = user.funcoes.includes(cb.value);
                });
            }
        } else if (user.tipo === 'MILITAR') {
            document.getElementById('re').value = user.re;
            document.getElementById('graduacao').value = user.graduacao;
            document.getElementById('nomeGuerra').value = user.nomeGuerra;
            
            if (user.funcoes) {
                document.querySelectorAll('input[name="funcaoMilitar"]').forEach(cb => {
                    cb.checked = user.funcoes.includes(cb.value);
                });
            }
        }
        
        form.querySelector('button[type="submit"]').textContent = 'Atualizar';
        
    } catch (error) {
        alert('Erro ao carregar dados do usuário: ' + error.message);
    }
};