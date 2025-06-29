const API = "https://rachadura.onrender.com/api";
const params = new URLSearchParams(window.location.search);
const denunciaId = params.get('id');
const usuarioId = localStorage.getItem("usuarioId");

// --- FUNÇÕES DE RENDERIZAÇÃO ---

function obterImagemPrincipal(denuncia) {
    // Esta função permanece útil para a imagem principal da denúncia
    let img = (denuncia.midias && denuncia.midias[0]) || denuncia.imagem || denuncia.imagem_denuncia || null;
    if (!img) return 'https://placehold.co/400x200?text=Denúncia';
    if (img.startsWith('data:image/')) return img;
    if (img.startsWith('http')) return img;
    if (!img.includes('/')) return `/assets/img/${img}`;
    return img;
}

function renderDenuncia(denuncia, usuariosMap) {
    if (!denuncia) {
        document.getElementById("denunciaDetalhe").innerHTML = "<p>Denúncia não encontrada.</p>";
        return;
    }
    const usuario = usuariosMap.get(denuncia.usuarioId) || { nome: "Desconhecido", foto_perfil: "https://placehold.co/32x32" };
    const end = denuncia.endereco || {};
    const enderecoFormatado = [end.logradouro, end.bairro, end.cidade].filter(Boolean).join(", ");

    const likes = denuncia.likes || [];
    const dislikes = denuncia.dislikes || [];
    const jaCurtiu = usuarioId && likes.includes(usuarioId);
    const jaDescurtiu = usuarioId && dislikes.includes(usuarioId);
    
    // Usa a função para pegar a imagem principal (do array 'midias' raiz)
    const midiaPrincipalHtml = `<img src="${obterImagemPrincipal(denuncia)}" style="max-width:420px;margin:10px 0;border-radius:10px;">`;

    document.getElementById("denunciaDetalhe").innerHTML = `
      <div class="card border-0 mb-3" style="max-width: 620px; margin:auto;">
        <div class="card-body">
          <div class="d-flex align-items-center mb-3">
            <img src="${usuario.foto_perfil}" class="rounded-circle me-3" width="48" height="48" alt="Usuário">
            <div>
              <h5 class="card-title mb-0">${denuncia.titulo || "-"}</h5>
              <small class="text-muted">${usuario.nome}</small>
            </div>
          </div>
          ${midiaPrincipalHtml}
          <p class="card-text mt-2">${denuncia.descricao || ""}</p>
          <div class="mb-2"><span class="fw-semibold">Endereço:</span> ${enderecoFormatado || "-"}</div>
          <div class="mb-3"><span class="fw-semibold">Categoria:</span> ${denuncia.categoria || "-"}</div>
          <div class="like-dislike-group">
            <button class="like-btn${jaCurtiu ? ' ativo' : ''}" id="likeBtn" title="Curtir"><i class="bi bi-hand-thumbs-up-fill"></i><span>${likes.length}</span></button>
            <button class="dislike-btn${jaDescurtiu ? ' ativo' : ''}" id="dislikeBtn" title="Não curtir"><i class="bi bi-hand-thumbs-down-fill"></i><span>${dislikes.length}</span></button>
            ${usuarioId === denuncia.usuarioId ? `<button class="btn btn-primary btn-sm me-2" id="editBtn">Adicionar Atualização</button><button class="btn btn-outline-secondary btn-sm" id="deleteBtn">Excluir</button>` : ""}
          </div>
        </div>
      </div>`;

    // Listeners dos botões de ação são adicionados após a renderização
    if (usuarioId) {
        document.getElementById("likeBtn").onclick = () => votarLikeDislike(true);
        document.getElementById("dislikeBtn").onclick = () => votarLikeDislike(false);
    }
    if (usuarioId === denuncia.usuarioId) {
        document.getElementById("deleteBtn").onclick = () => deletarDenuncia();
        document.getElementById("editBtn").onclick = () => window.location.href = `/views/atualizar_denuncia.html?id=${denuncia.id}`;
    }
}

// ---> ATUALIZAÇÃO PRINCIPAL NESTA FUNÇÃO <---
function renderTimeline(denuncia) {
    const timelineContainer = document.getElementById("timelineContainer");
    if (!denuncia.timeline || !denuncia.timeline.length) {
        timelineContainer.innerHTML = "<p>Sem eventos registrados nesta denúncia.</p>";
        return;
    }
    let html = `<h3>Histórico (Timeline)</h3><div class="timeline">`;
    // Ordena a timeline para mostrar o mais recente primeiro
    const timelineOrdenada = [...denuncia.timeline].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

    timelineOrdenada.forEach(ev => {
        // --- INÍCIO DA LÓGICA PARA ADICIONAR MÍDIAS DA TIMELINE ---
        let midiasHtml = "";
        if (ev.midias && ev.midias.length > 0) {
            midiasHtml = `<div class="midias-timeline">`;
            ev.midias.forEach(url => {
                midiasHtml += `<img src="${url}" alt="Mídia do evento ${ev.status}" title="Clique para ampliar">`;
            });
            midiasHtml += `</div>`;
        }
        // --- FIM DA LÓGICA PARA ADICIONAR MÍDIAS ---

        html += `
          <div class="timeline-item">
            <span class="timeline-status">${ev.status}</span>
            <span class="timeline-date">${ev.timestamp ? new Date(ev.timestamp).toLocaleString('pt-BR') : ""}</span>
            <div class="timeline-notas">${ev.notas || ""}</div>
            ${midiasHtml}
          </div>
        `;
    });
    html += "</div>";
    timelineContainer.innerHTML = html;
}

function renderComentarios(comentarios, usuariosMap) {
    const lista = document.getElementById("listaComentarios");
    if (!comentarios.length) {
        lista.innerHTML = "<p>Seja o primeiro a comentar!</p>";
        return;
    }
    let comentariosHtml = '';
    comentarios.forEach(c => {
        const user = usuariosMap.get(c.usuarioId) || { nome: "Desconhecido", foto_perfil: "https://placehold.co/32x32" };
        comentariosHtml += `
            <div class="comentario-bloco">
                <img src="${user.foto_perfil}" class="foto-comentario" alt="Usuário">
                <span class="usuario-comentario">${user.nome}</span>
                <span class="data-comentario">${c.data ? new Date(c.data).toLocaleString('pt-BR') : ""}</span>
                <div class="texto-comentario">${c.texto}</div>
            </div>
        `;
    });
    lista.innerHTML = comentariosHtml;
}


// --- FUNÇÕES DE AÇÃO (INTERAÇÃO COM API) ---

async function votarLikeDislike(like) {
    if (!usuarioId) return;
    const res = await fetch(`${API}/denuncias/${denunciaId}`);
    const denuncia = await res.json();
    let likes = denuncia.likes || [];
    let dislikes = denuncia.dislikes || [];
    
    if (like) {
        dislikes = dislikes.filter(u => u !== usuarioId);
        likes.includes(usuarioId) ? likes = likes.filter(u => u !== usuarioId) : likes.push(usuarioId);
    } else {
        likes = likes.filter(u => u !== usuarioId);
        dislikes.includes(usuarioId) ? dislikes = dislikes.filter(u => u !== usuarioId) : dislikes.push(usuarioId);
    }
    
    await fetch(`${API}/denuncias/${denunciaId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ likes, dislikes })
    });
    // Re-renderiza apenas a seção da denúncia para atualizar os contadores
    const usuariosMap = new Map((await (await fetch(`${API}/usuarios`)).json()).map(u => [u.id, u]));
    renderDenuncia(await (await fetch(`${API}/denuncias/${denunciaId}`)).json(), usuariosMap);
}

async function deletarDenuncia() {
    if (!confirm("Deseja realmente excluir esta denúncia?")) return;
    await fetch(`${API}/denuncias/${denunciaId}`, { method: "DELETE" });
    alert("Denúncia removida.");
    window.location.href = "/views/feed.html";
}

async function enviarComentario() {
    const texto = document.getElementById("novoComentario").value.trim();
    if (!texto || !usuarioId) return;
    await fetch(`${API}/comentarios`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ denunciaId, usuarioId, texto, data: new Date().toISOString() })
    });
    document.getElementById("novoComentario").value = "";
    // Re-renderiza apenas a seção de comentários
    const [usuarios, comentarios] = await Promise.all([
        (await fetch(`${API}/usuarios`)).json(),
        (await fetch(`${API}/comentarios?denunciaId=${denunciaId}`)).json()
    ]);
    renderComentarios(comentarios, new Map(usuarios.map(u => [u.id, u])));
}


// ---> OTIMIZAÇÃO: BUSCA OS DADOS UMA VEZ E CHAMA AS FUNÇÕES DE RENDERIZAÇÃO <---
document.addEventListener("DOMContentLoaded", async () => {
    if (!denunciaId) {
        document.body.innerHTML = "<h1>Erro: ID da denúncia não fornecido.</h1>";
        return;
    }
    try {
        // Busca todos os dados necessários em paralelo para mais performance
        const [denuncia, usuarios, comentarios] = await Promise.all([
            fetch(`${API}/denuncias/${denunciaId}`).then(res => res.json()),
            fetch(`${API}/usuarios`).then(res => res.json()),
            fetch(`${API}/comentarios?denunciaId=${denunciaId}`).then(res => res.json())
        ]);

        const usuariosMap = new Map(usuarios.map(u => [u.id, u]));

        // Chama cada função de renderização com os dados já buscados
        renderDenuncia(denuncia, usuariosMap);
        renderTimeline(denuncia);
        renderComentarios(comentarios, usuariosMap);
        
        // Adiciona o listener para o formulário de comentário
        document.getElementById("formComentario").onsubmit = e => {
            e.preventDefault();
            enviarComentario();
        };

    } catch (error) {
        console.error("Falha ao carregar a página da denúncia:", error);
        document.getElementById("denunciaDetalhe").innerHTML = "<h2>Não foi possível carregar a denúncia.</h2><p>Verifique o console para mais detalhes.</p>";
    }
});