document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DO DOM ---
    const tituloDisplay = document.getElementById('denuncia-titulo-display');
    const descricaoDisplay = document.getElementById('denuncia-descricao-display');
    const categoriaDisplay = document.getElementById('denuncia-categoria-display');
    const enderecoDisplay = document.getElementById('denuncia-endereco-display');
    const midiasExistentesContainer = document.getElementById('midias-existentes-container');
    const descricaoTextarea = document.getElementById('update-description');
    const timelineContainer = document.getElementById('denuncia-timeline-container');
    const novasMidiasPreview = document.getElementById('novas-midias-preview');

    // Controles de Edição
    const formAtualizacao = document.getElementById('form-atualizacao');
    const btnAddMidia = document.getElementById('btn-add-midia');
    const midiaInput = document.getElementById('midia-input');
    const timelineSection = document.getElementById('timeline-section');
    const addMediaSection = document.getElementById('add-media-section');
    const statusSelect = document.getElementById('timeline-new-status-select');
    const notasTextarea = document.getElementById('timeline-new-notes');
    const btnAddTimeline = document.getElementById('btn-add-timeline-event');

    // Botões de Ação
    const btnSalvar = document.getElementById('btn-save');
    const btnExcluir = document.getElementById('btn-delete');
    const btnVoltar = document.getElementById('btn-back');

    // --- ESTADO DA APLICAÇÃO ---
    let denunciaAtual = {};
    let novasMidias = []; // Array para armazenar novos arquivos em Base64

    // --- FUNÇÕES ---

    // Pega o ID da denúncia da URL
    const getDenunciaId = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    };

    // Formata o endereço para exibição
    const formatarEndereco = (endereco) => {
        if (!endereco) return "Endereço não informado.";
        return `${endereco.logradouro || ''}, ${endereco.numero || 's/n'} - ${endereco.bairro || ''}, ${endereco.cidade || ''} - ${endereco.estado || ''}`;
    };

    // Formata a data para um padrão legível
    const formatarTimestamp = (isoTimestamp) => {
        if (!isoTimestamp) return 'Data indisponível';
        return new Date(isoTimestamp).toLocaleString('pt-BR');
    };

    // Renderiza os elementos da página com os dados da denúncia
    const renderizarPagina = () => {
        tituloDisplay.textContent = denunciaAtual.titulo || "Título não encontrado";
        descricaoDisplay.textContent = denunciaAtual.descricao || "Esta denúncia não possui uma descrição detalhada."; 
        categoriaDisplay.textContent = `Categoria: ${denunciaAtual.categoria || "Não informada"}`;
        enderecoDisplay.textContent = `Local: ${formatarEndereco(denunciaAtual.endereco)}`;
        descricaoTextarea.value = denunciaAtual.descricao || "";

        // Renderiza mídias existentes
        midiasExistentesContainer.innerHTML = '';
        if (denunciaAtual.midias && denunciaAtual.midias.length > 0) {
            denunciaAtual.midias.forEach(midiaUrl => {
                const mediaItem = document.createElement('div');
                mediaItem.className = 'media-item';
                mediaItem.innerHTML = `<img src="${midiaUrl}" alt="Mídia da denúncia">`;
                midiasExistentesContainer.appendChild(mediaItem);
            });
        } else {
            midiasExistentesContainer.innerHTML = '<p class="info-secundaria">Nenhuma mídia foi enviada para esta denúncia.</p>';
        }

        // Renderiza a timeline
        timelineContainer.innerHTML = '';
        if (denunciaAtual.timeline && denunciaAtual.timeline.length > 0) {
            const timelineOrdenada = [...denunciaAtual.timeline].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            timelineOrdenada.forEach(evento => {
                const eventoDiv = document.createElement('div');
                eventoDiv.className = 'timeline-item';
                eventoDiv.innerHTML = `
                    <div class="timeline-item-status">${evento.status}</div>
                    <div class="timeline-item-timestamp">${formatarTimestamp(evento.timestamp)}</div>
                    ${evento.notas ? `<div class="timeline-item-notes">${evento.notas}</div>` : ''}
                `;
                timelineContainer.appendChild(eventoDiv);
            });
        }
    };

    // Converte arquivos para Base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    // Renderiza os previews das novas mídias selecionadas
    const renderizarPreviewNovasMidias = () => {
        novasMidiasPreview.innerHTML = '';
        novasMidias.forEach((midia, index) => {
            const mediaItem = document.createElement('div');
            mediaItem.className = 'media-item';
            mediaItem.innerHTML = `
                <img src="${midia.base64}" alt="Preview da nova mídia">
                <button type="button" class="btn-remove-nova-midia" data-index="${index}">X</button>
            `;
            novasMidiasPreview.appendChild(mediaItem);
        });

        // Adiciona evento para os botões de remover
        document.querySelectorAll('.btn-remove-nova-midia').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const indexToRemove = parseInt(e.target.dataset.index, 10);
                novasMidias.splice(indexToRemove, 1);
                renderizarPreviewNovasMidias();
            });
        });
    };

    // Carrega os dados da denúncia da API
    const carregarDenuncia = async (id) => {
        try {
            const response = await axios.get(`https://rachadura.onrender.com/api/denuncias/${id}`);
            denunciaAtual = response.data;

            // Verifica se o usuário logado é o "dono" da denúncia
            const usuarioLogadoId = localStorage.getItem('usuarioId');
            if (denunciaAtual.usuarioId === usuarioLogadoId) {
                // Habilita controles de edição
                btnSalvar.style.display = 'block';
                btnExcluir.style.display = 'block';
                timelineSection.style.display = 'block';
                addMediaSection.style.display = 'block';
            } else {
                // Desabilita campos se não for o dono
                descricaoTextarea.disabled = true;
            }

            renderizarPagina();
        } catch (error) {
            console.error("Erro ao carregar a denúncia:", error);
            alert("Não foi possível carregar os detalhes da denúncia. Verifique o console.");
            tituloDisplay.textContent = "Denúncia não encontrada.";
        }
    };

    // --- LÓGICA DE EVENTOS ---

    // Salvar alterações
    formAtualizacao.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Pega o novo status e notas da timeline
        const novoStatus = statusSelect.value;
        const novasNotas = notasTextarea.value.trim();

        // 2. Pega as novas mídias que o usuário selecionou
        const novasMidiasUrls = novasMidias.map(m => m.base64);

        // Validação: Se um novo status foi selecionado ou novas mídias foram adicionadas,
        // um status é obrigatório para contextualizar a atualização.
        if ((novoStatus || novasMidiasUrls.length > 0) && !novoStatus) {
            alert("Por favor, selecione um status para acompanhar as novas mídias ou notas.");
            statusSelect.focus();
            return;
        }

        // 3. Cria um novo evento de timeline, se houver um novo status
        if (novoStatus) {
            const novoEventoTimeline = {
                status: novoStatus,
                timestamp: new Date().toISOString(),
                notas: novasNotas || "",
                midias: novasMidiasUrls // <-- A MÁGICA ACONTECE AQUI! As novas mídias são anexadas a este evento.
            };
            // Adiciona o novo evento ao histórico da denúncia
            if (!Array.isArray(denunciaAtual.timeline)) {
                denunciaAtual.timeline = [];
            }
            denunciaAtual.timeline.push(novoEventoTimeline);
        }

        // 4. Atualiza a descrição (a única outra informação editável)
        denunciaAtual.descricao = descricaoTextarea.value;

        // 5. Envia o objeto COMPLETO da denúncia para ser atualizado no backend
        try {
            await axios.put(`https://rachadura.onrender.com/api/denuncias/${denunciaAtual.id}`, denunciaAtual);
            alert("Denúncia atualizada com sucesso!");
            // Redireciona para a página de comentários/detalhes para ver o resultado
            window.location.href = `/views/comentarios.html?id=${denunciaAtual.id}`;
        } catch (error) {
            console.error("Erro ao salvar as alterações:", error);
            alert("Não foi possível salvar as alterações. Tente novamente.");
        }
    });
    // Excluir denúncia
    btnExcluir.addEventListener('click', async () => {
        if (confirm("Tem certeza que deseja excluir esta denúncia? Esta ação não pode ser desfeita.")) {
            try {
                await axios.delete(`https://rachadura.onrender.com/api/denuncias/${denunciaAtual.id}`);
                alert("Denúncia excluída com sucesso.");
                window.location.href = '/views/home_page.html';
            } catch (error) {
                console.error("Erro ao excluir a denúncia:", error);
                alert("Não foi possível excluir a denúncia. Tente novamente.");
            }
        }
    });

    // Adicionar novas mídias
    btnAddMidia.addEventListener('click', () => midiaInput.click());
    midiaInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            for (const file of files) {
                const base64 = await fileToBase64(file);
                novasMidias.push({ file, base64 });
            }
            renderizarPreviewNovasMidias();
        }
    });

    // Adicionar evento na timeline (apenas localmente antes de salvar)
    btnAddTimeline.addEventListener('click', () => {
        const status = statusSelect.value;
        const notas = notasTextarea.value;
        if (!status) {
            alert("Por favor, selecione um status.");
            return;
        }

        const novoEvento = {
            status,
            timestamp: new Date().toISOString(),
            notas: notas.trim()
        };

        // Adiciona visualmente na UI
        const eventoDiv = document.createElement('div');
        eventoDiv.className = 'timeline-item';
        eventoDiv.innerHTML = `
            <div class="timeline-item-status">${novoEvento.status} (não salvo)</div>
            <div class="timeline-item-timestamp">${formatarTimestamp(novoEvento.timestamp)}</div>
            ${novoEvento.notas ? `<div class="timeline-item-notes">${novoEvento.notas}</div>` : ''}
        `;
        timelineContainer.prepend(eventoDiv); // Adiciona no topo para feedback imediato

        // Limpa os campos
        statusSelect.value = "";
        notasTextarea.value = "";

        alert("Evento adicionado. Clique em 'Salvar Alterações' para confirmar.");
    });

    btnVoltar.addEventListener('click', () => window.history.back());

    // --- INICIALIZAÇÃO ---
    const denunciaId = getDenunciaId();
    if (denunciaId) {
        carregarDenuncia(denunciaId);
    } else {
        alert("ID da denúncia não fornecido. Redirecionando...");
        window.location.href = '/views/home_page.html';
    }
});