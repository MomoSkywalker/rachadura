const API = "https://rachadura.onrender.com/api";
const params = new URLSearchParams(window.location.search);
const denunciaId = params.get('id');
const usuarioId = localStorage.getItem("usuarioId");

// Utilitários para fetch rápido de usuários, denúncia e comentários
async function getUsuarios() {
  const res = await fetch(`${API}/usuarios`);
  return await res.json();
}
async function getDenuncia() {
  const res = await fetch(`${API}/denuncias/${denunciaId}`);
  return await res.json();
}
async function getComentarios() {
  const res = await fetch(`${API}/comentarios?denunciaId=${denunciaId}`);
  return await res.json();
}

function obterImagemPrincipal(denuncia) {
  let img = (denuncia.midias && denuncia.midias[0]) ||
            denuncia.imagem ||
            denuncia.imagem_denuncia ||
            null;
  if (!img) return 'https://placehold.co/400x200?text=Denúncia';
  if (img.startsWith('data:image/')) return img;
  if (img.startsWith('http')) return img;
  if (!img.includes('/')) return `/assets/img/${img}`;
  return img;
}

// Renderiza os detalhes da denúncia, timeline, e botões (editar/deletar para dono)
async function renderDenuncia() {
  const [usuarios, denuncia] = await Promise.all([getUsuarios(), getDenuncia()]);
  if (!denuncia) {
    document.getElementById("denunciaDetalhe").innerHTML = "<p>Denúncia não encontrada.</p>";
    return;
  }
  const usuario = usuarios.find(u => u.id === denuncia.usuarioId) || {nome:"Desconhecido",foto_perfil:"https://placehold.co/32x32"};
  // Endereço completo, sem repetir bairro
  const end = denuncia.endereco || {};
  let bairro = end.bairro || "";
  let logradouro = end.logradouro || "";
  if (bairro && logradouro && logradouro.toLowerCase().includes(bairro.toLowerCase())) bairro = "";
  const enderecoFormatado = [logradouro, bairro, end.cidade].filter(Boolean).join(", ");

  // Likes/dislikes
  const likes = denuncia.likes || [];
  const dislikes = denuncia.dislikes || [];
  const jaCurtiu = usuarioId && likes.includes(usuarioId);
  const jaDescurtiu = usuarioId && dislikes.includes(usuarioId);

  let midiasHtml = "";
  if (denuncia.midias && denuncia.midias.length)
    midiasHtml = denuncia.midias.map(m => `<img src="${obterImagemPrincipal({midias:[m]})}" style="max-width:420px;margin:10px 0;border-radius:10px;">`).join("");
  else if (denuncia.imagem) midiasHtml = `<img src="${denuncia.imagem}" style="max-width:420px;margin:10px 0;border-radius:10px;">`;

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
      ${midiasHtml}
      <p class="card-text mt-2">${denuncia.descricao || ""}</p>
      <div class="mb-2">
        <span class="fw-semibold">Endereço:</span> ${enderecoFormatado || "-"}
      </div>
      <div class="mb-3">
        <span class="fw-semibold">Categoria:</span> ${denuncia.categoria || "-"}
      </div>
      <div>
        <button class="btn btn-outline-success btn-sm me-2 botao-curtir${jaCurtiu ? " ativo" : ""}" id="likeBtn">👍 <span>${likes.length}</span></button>
        <button class="btn btn-outline-danger btn-sm me-2 botao-descurtir${jaDescurtiu ? " ativo" : ""}" id="dislikeBtn">👎 <span>${dislikes.length}</span></button>
        ${
          usuarioId === denuncia.usuarioId
            ? `<button class="btn btn-primary btn-sm me-2" id="editBtn">Editar</button>
               <button class="btn btn-outline-secondary btn-sm" id="deleteBtn">Excluir</button>`
            : ""
        }
      </div>
    </div>
  </div>
`;
  // Listeners dos botões
  if (usuarioId) {
    document.getElementById("likeBtn").onclick = async () => await votarLikeDislike(true);
    document.getElementById("dislikeBtn").onclick = async () => await votarLikeDislike(false);
  }
  if (usuarioId === denuncia.usuarioId) {
    document.getElementById("deleteBtn").onclick = async () => await deletarDenuncia();
    document.getElementById("editBtn").onclick = () => window.location.href = `/views/atualizar_denuncia.html?id=${denuncia.id}`;
  }
}

async function votarLikeDislike(like) {
  const denuncia = await getDenuncia();
  let likes = denuncia.likes || [];
  let dislikes = denuncia.dislikes || [];
  // Remove usuário do outro array e toggle no atual
  if (!usuarioId) return;
  if (like) {
    dislikes = dislikes.filter(u => u !== usuarioId);
    if (likes.includes(usuarioId)) likes = likes.filter(u => u !== usuarioId);
    else likes.push(usuarioId);
  } else {
    likes = likes.filter(u => u !== usuarioId);
    if (dislikes.includes(usuarioId)) dislikes = dislikes.filter(u => u !== usuarioId);
    else dislikes.push(usuarioId);
  }
  // Atualiza denúncia
  await fetch(`${API}/denuncias/${denunciaId}`, {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({likes, dislikes})
  });
  renderDenuncia();
}

async function deletarDenuncia() {
  if (!confirm("Deseja realmente excluir esta denúncia?")) return;
  await fetch(`${API}/denuncias/${denunciaId}`, {method: "DELETE"});
  alert("Denúncia removida.");
  window.location.href = "/views/feed.html";
}

async function renderTimeline() {
  const denuncia = await getDenuncia();
  if (!denuncia.timeline || !denuncia.timeline.length) {
    document.getElementById("timelineContainer").innerHTML = "<p>Sem eventos registrados nesta denúncia.</p>";
    return;
  }
  let html = `<h3>Histórico (Timeline)</h3><div class="timeline">`;
  denuncia.timeline.forEach(ev => {
    html += `
      <div class="timeline-item">
        <span class="timeline-status">${ev.status}</span>
        <span class="timeline-date">${ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ""}</span>
        <div class="timeline-notas">${ev.notas || ""}</div>
      </div>
    `;
  });
  html += "</div>";
  document.getElementById("timelineContainer").innerHTML = html;
}

async function renderComentarios() {
  const [usuarios, comentarios] = await Promise.all([getUsuarios(), getComentarios()]);
  const lista = document.getElementById("listaComentarios");

  if (!comentarios.length) {
    lista.innerHTML = "<p>Seja o primeiro a comentar!</p>";
    return;
  }

  let comentariosHtml = `<ul class="list-group">`;
  comentarios.forEach(c => {
    const user = usuarios.find(u => u.id === c.usuarioId) || { nome: "Desconhecido", foto_perfil: "https://placehold.co/32x32" };
    comentariosHtml += `
      <li class="list-group-item d-flex align-items-start">
        <img src="${user.foto_perfil}" class="rounded-circle me-2" width="32" height="32" alt="Usuário">
        <div>
          <span class="fw-bold">${user.nome}</span>
          <span class="text-muted ms-2">${c.data ? new Date(c.data).toLocaleString() : ""}</span>
          <div class="mt-1">${c.texto}</div>
        </div>
      </li>
    `;
  });
  comentariosHtml += "</ul>";
  lista.innerHTML = comentariosHtml;
}


// Envia novo comentário
document.addEventListener("DOMContentLoaded", () => {
  renderDenuncia();
  renderTimeline();
  renderComentarios();

  document.getElementById("formComentario").onsubmit = async e => {
    e.preventDefault();
    const texto = document.getElementById("novoComentario").value.trim();
    if (!texto) return;
    await fetch(`${API}/comentarios`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        denunciaId,
        usuarioId,
        texto,
        data: new Date().toISOString()
      })
    });
    document.getElementById("novoComentario").value = "";
    renderComentarios();
  };
});
