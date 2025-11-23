import { formatDateTimeLocal } from './search.js';

export function setupDispatcherSearch() {
    if (document.getElementById('dispatcherSearchSection')) {
        return;
    }

    const dispatcherHeader = document.querySelector('.dispatcher-header');

    const searchSection = document.createElement('div');
    searchSection.id = 'dispatcherSearchSection';
    searchSection.style.cssText = 'margin-top: 15px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;';
    searchSection.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="margin: 0; font-size: 16px;">Pesquisar Ocorrências</h3>
            <button id="btnToggleDispatcherSearch" class="btn-secondary" style="padding: 8px 16px; font-size: 14px;">+ Expandir</button>
        </div>
        <div id="dispatcherSearchFormContainer" style="display: none;">
            <input type="text" id="searchOcorrenciasDispatcherInput" placeholder="Digite endereço ou natureza..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; margin-bottom: 10px;">

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 14px; font-weight: 600;">Data/Hora Início</label>
                    <input type="datetime-local" id="searchDataInicioDispatcher" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 14px; font-weight: 600;">Data/Hora Fim</label>
                    <input type="datetime-local" id="searchDataFimDispatcher" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                </div>
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <button id="btnFiltroHojeDispatcher" class="btn-secondary" style="flex: 1; padding: 8px; font-size: 13px;">Hoje</button>
                <button id="btnFiltroOntemDispatcher" class="btn-secondary" style="flex: 1; padding: 8px; font-size: 13px;">Ontem</button>
                <button id="btnFiltroSemanaDispatcher" class="btn-secondary" style="flex: 1; padding: 8px; font-size: 13px;">Última Semana</button>
                <button id="btnFiltroMesDispatcher" class="btn-secondary" style="flex: 1; padding: 8px; font-size: 13px;">Último Mês</button>
            </div>

            <div style="display: flex; gap: 10px;">
                <button id="btnExecutarPesquisaDispatcher" class="btn-cadastro" style="flex: 1; padding: 10px; font-size: 14px;">Pesquisar</button>
                <button id="btnLimparPesquisaDispatcher" class="btn-secondary" style="flex: 1; padding: 10px; font-size: 14px;">Limpar</button>
            </div>
        </div>

        <div id="ocorrenciasSearchContentDispatcher" style="margin-top: 15px;"></div>
    `;

    dispatcherHeader.appendChild(searchSection);

    const btnToggleDispatcherSearch = document.getElementById('btnToggleDispatcherSearch');
    const dispatcherSearchFormContainer = document.getElementById('dispatcherSearchFormContainer');

    btnToggleDispatcherSearch.addEventListener('click', () => {
        if (dispatcherSearchFormContainer.style.display === 'none') {
            dispatcherSearchFormContainer.style.display = 'block';
            btnToggleDispatcherSearch.textContent = '- Ocultar';
        } else {
            dispatcherSearchFormContainer.style.display = 'none';
            btnToggleDispatcherSearch.textContent = '+ Expandir';
        }
    });

    const searchInput = document.getElementById('searchOcorrenciasDispatcherInput');
    searchInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });

    document.getElementById('btnFiltroHojeDispatcher').addEventListener('click', () => {
        const hoje = new Date();
        const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0);
        const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59);

        document.getElementById('searchDataInicioDispatcher').value = formatDateTimeLocal(inicioHoje);
        document.getElementById('searchDataFimDispatcher').value = formatDateTimeLocal(fimHoje);
    });

    document.getElementById('btnFiltroOntemDispatcher').addEventListener('click', () => {
        const hoje = new Date();
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        const inicioOntem = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 0, 0);
        const fimOntem = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 23, 59);

        document.getElementById('searchDataInicioDispatcher').value = formatDateTimeLocal(inicioOntem);
        document.getElementById('searchDataFimDispatcher').value = formatDateTimeLocal(fimOntem);
    });

    document.getElementById('btnFiltroSemanaDispatcher').addEventListener('click', () => {
        const hoje = new Date();
        const semanaAtras = new Date(hoje);
        semanaAtras.setDate(semanaAtras.getDate() - 7);

        document.getElementById('searchDataInicioDispatcher').value = formatDateTimeLocal(semanaAtras);
        document.getElementById('searchDataFimDispatcher').value = formatDateTimeLocal(hoje);
    });

    document.getElementById('btnFiltroMesDispatcher').addEventListener('click', () => {
        const hoje = new Date();
        const mesAtras = new Date(hoje);
        mesAtras.setMonth(mesAtras.getMonth() - 1);

        document.getElementById('searchDataInicioDispatcher').value = formatDateTimeLocal(mesAtras);
        document.getElementById('searchDataFimDispatcher').value = formatDateTimeLocal(hoje);
    });
}

