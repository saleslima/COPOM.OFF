import { 
    addVeiculo, 
    addPessoa, 
    renderVeiculos, 
    renderPessoas, 
    saveAttendance,
    loadUserOcorrencias
} from './attendance.js';
import { showMessage, setupAutoUppercase, formatCPF } from './utils.js';

export function setupFormHandlers(allScreens) {
    const btnVeiculos = document.getElementById('btnVeiculos');
    const btnPessoas = document.getElementById('btnPessoas');
    const btnAdicionarVeiculo = document.getElementById('btnAdicionarVeiculo');
    const btnAdicionarPessoa = document.getElementById('btnAdicionarPessoa');
    const btnMinhasOcorrencias = document.getElementById('btnMinhasOcorrencias');
    const btnCloseOcorrencias = document.getElementById('btnCloseOcorrencias');
    const attendanceForm = document.getElementById('attendanceForm');
    const attendanceMessage = document.getElementById('attendanceMessage');

    btnVeiculos.addEventListener('click', (e) => {
        e.preventDefault();
        const veiculosSection = document.getElementById('veiculosSection');
        veiculosSection.style.display = veiculosSection.style.display === 'none' ? 'block' : 'none';
        document.getElementById('pessoasSection').style.display = 'none';
    });

    btnPessoas.addEventListener('click', (e) => {
        e.preventDefault();
        const pessoasSection = document.getElementById('pessoasSection');
        pessoasSection.style.display = pessoasSection.style.display === 'none' ? 'block' : 'none';
        document.getElementById('veiculosSection').style.display = 'none';
    });

    const placaInput = document.getElementById('placa');
    placaInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });

    placaInput.addEventListener('blur', async (e) => {
        const placa = e.target.value.replace(/[^A-Z0-9]/g, '');

        if (placa.length === 7) {
            try {
                const response = await fetch(`https://placa.app.br/api/v1/consultar/${placa}`);
                const data = await response.json();

                if (data && !data.erro) {
                    document.getElementById('modelo').value = (data.marca + ' ' + data.modelo).toUpperCase();
                    document.getElementById('ano').value = data.ano || '';
                    document.getElementById('cor').value = (data.cor || '').toUpperCase();
                    document.getElementById('tipoVeiculo').value = (data.tipo || '').toUpperCase();
                    document.getElementById('estadoVeiculo').value = (data.uf || '').toUpperCase();
                }
            } catch (error) {
                console.log('Não foi possível consultar a placa automaticamente');
            }
        }
    });

    const veiculoInputs = ['modelo', 'cor', 'tipoVeiculo', 'estadoVeiculo'];
    setupAutoUppercase(veiculoInputs.map(id => document.getElementById(id)));

    setupAutoUppercase([document.getElementById('nomePessoa')]);

    document.getElementById('cpfPessoa').addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        if (value.length <= 11) {
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        e.target.value = value;
    });

    btnAdicionarVeiculo.addEventListener('click', (e) => {
        e.preventDefault();
        const placa = document.getElementById('placa').value.trim();
        const modelo = document.getElementById('modelo').value.trim();
        const ano = document.getElementById('ano').value.trim();
        const cor = document.getElementById('cor').value.trim();
        const tipo = document.getElementById('tipoVeiculo').value.trim();
        const estado = document.getElementById('estadoVeiculo').value.trim();
        const situacao = document.getElementById('situacaoVeiculo').value;

        if (!placa || !situacao) {
            alert('Por favor, preencha ao menos a placa e a situação');
            return;
        }

        const veiculo = {
            id: Date.now(),
            placa,
            modelo,
            ano,
            cor,
            tipo,
            estado,
            situacao
        };

        addVeiculo(veiculo);
        renderVeiculos(document.getElementById('veiculosAdicionados'));

        document.getElementById('placa').value = '';
        document.getElementById('modelo').value = '';
        document.getElementById('ano').value = '';
        document.getElementById('cor').value = '';
        document.getElementById('tipoVeiculo').value = '';
        document.getElementById('estadoVeiculo').value = '';
        document.getElementById('situacaoVeiculo').value = '';
    });

    btnAdicionarPessoa.addEventListener('click', (e) => {
        e.preventDefault();
        const nome = document.getElementById('nomePessoa').value.trim();
        const cpf = document.getElementById('cpfPessoa').value.trim();
        const dataNascimento = document.getElementById('dataNascimento').value;
        const telefone = document.getElementById('telefonePessoa').value.trim();
        const envolvimento = document.getElementById('envolvimento').value;

        if (!nome || !envolvimento) {
            alert('Por favor, preencha ao menos o nome e o envolvimento');
            return;
        }

        const pessoa = {
            id: Date.now(),
            nome,
            cpf,
            dataNascimento,
            telefone,
            envolvimento
        };

        addPessoa(pessoa);
        renderPessoas(document.getElementById('pessoasAdicionadas'));

        document.getElementById('nomePessoa').value = '';
        document.getElementById('cpfPessoa').value = '';
        document.getElementById('dataNascimento').value = '';
        document.getElementById('telefonePessoa').value = '';
        document.getElementById('envolvimento').value = '';
    });

    btnMinhasOcorrencias.addEventListener('click', async () => {
        await loadUserOcorrencias(document.getElementById('ocorrenciasContent'));
        document.getElementById('ocorrenciasList').style.display = 'block';
    });

    btnCloseOcorrencias.addEventListener('click', () => {
        document.getElementById('ocorrenciasList').style.display = 'none';
    });

    attendanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            telefone: document.getElementById('telefone').value,
            nome: document.getElementById('nomeAtendimento').value.toUpperCase(),
            cep: document.getElementById('cep').value,
            rua: document.getElementById('rua').value.toUpperCase(),
            numero: document.getElementById('numero').value.toUpperCase(),
            bairro: document.getElementById('bairro').value.toUpperCase(),
            municipio: document.getElementById('municipio').value.toUpperCase(),
            estado: document.getElementById('estado').value.toUpperCase(),
            btl: document.getElementById('btl').value,
            referencia: document.getElementById('referencia').value.toUpperCase(),
            historico: document.getElementById('historico').value.toUpperCase(),
            natureza: document.getElementById('natureza').value,
            gravidade: document.getElementById('gravidade').value
        };

        const success = await saveAttendance(formData, attendanceMessage);

        if (success) {
            attendanceForm.reset();
            renderVeiculos(document.getElementById('veiculosAdicionados'));
            renderPessoas(document.getElementById('pessoasAdicionados'));
            document.getElementById('veiculosSection').style.display = 'none';
            document.getElementById('pessoasSection').style.display = 'none';
        }
    });
}