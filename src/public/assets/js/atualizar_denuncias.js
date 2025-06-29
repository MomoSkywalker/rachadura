const API_URL = "https://rachadura.onrender.com/api/denuncias";
const params = new URLSearchParams(window.location.search);
const currentDenunciaId = params.get("id");

// Estado temporário para edição
let denunciaParaEdicao = {
  titulo: "",
  categoria: "",
  descricao: "",
  endereco: {},
  imagem: null,
  video: null,
  timeline: []
};

// -------------------------
// 1. Carregar Dados Denúncia
// -------------------------
async function carregarDadosDenuncia() {
console.log("ID buscado:", currentDenunciaId);
  if (!currentDenunciaId) {
    document.getElementById("cartao-title").textContent = "Nova Denúncia";
    document.getElementById("btn-delete").style.display = "none";
    renderizarTimeline([]);
    updateSelectedFilesUI();
    return;
  }
  try {
    const res = await fetch(`${API_URL}/${currentDenunciaId}`);
    console.log("Resposta fetch:", res.status, await res.clone().text());
    if (!res.ok) throw new Error();
    const denuncia = await res.json();

    denunciaParaEdicao = {
      ...denuncia,
      endereco: denuncia.endereco || {},
      timeline: Array.isArray(denuncia.timeline) ? denuncia.timeline : []
    };

    document.getElementById("cartao-title").textContent = "Editar Denúncia";
    document.getElementById("denuncia-titulo-input").value = denuncia.titulo || "";
    document.querySelector("select[name='categoria']").value = denuncia.categoria || "";
    document.getElementById("update-description").value = denuncia.descricao || "";
    // Endereço
    document.getElementById("cep-input").value = denuncia.endereco?.cep || "";
    document.getElementById("logradouro-input").value = denuncia.endereco?.logradouro || "";
    document.getElementById("bairro-input").value = denuncia.endereco?.bairro || "";
    document.getElementById("cidade-input").value = denuncia.endereco?.cidade || "";
    document.getElementById("estado-input").value = denuncia.endereco?.estado || "";

    document.getElementById("btn-delete").style.display = "inline-block";
    renderizarTimeline(denunciaParaEdicao.timeline);
    updateSelectedFilesUI();
  } catch {
    alert("Denúncia não encontrada. Redirecionando.");
    window.location.href = "feed.html";
  }
}

// --------------
// 2. Timeline UI
// --------------
function renderizarTimeline(timelineArray) {
  const container = document.getElementById("denuncia-timeline-container");
  if (!timelineArray || !timelineArray.length) {
    container.innerHTML = '<p>Nenhum histórico para esta denúncia ainda.</p>';
    return;
  }
  const ul = document.createElement('ul');
  ul.classList.add('timeline-list');
  timelineArray
    .slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .forEach(evento => {
      const li = document.createElement('li');
      li.classList.add('timeline-item');
      li.innerHTML = `
        <div class="timeline-item-status">${evento.status}</div>
        <div class="timeline-item-timestamp">${formatarTimestamp(evento.timestamp)}</div>
        ${evento.notas ? `<div class="timeline-item-notes">${evento.notas}</div>` : ""}
      `;
      ul.appendChild(li);
    });
  container.innerHTML = '';
  container.appendChild(ul);
}

function formatarTimestamp(iso) {
  if (!iso) return '';
  const data = new Date(iso);
  return data.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

// -------------------------
// 3. Controle de Mídia UI
// -------------------------
function updateSelectedFilesUI() {
  const el = document.getElementById("selected-files-info");
  let html = '';
  // Imagem
  if (denunciaParaEdicao.imagem) {
    html += `
      <div class="media-preview-container">
        <p>Imagem:</p>
        <img src="${denunciaParaEdicao.imagem}" alt="Pré-visualização da imagem" class="media-preview" style="max-width:160px;max-height:120px;border-radius:8px;">
        <button class="btn-remove-media" data-type="image">Remover Imagem</button>
      </div>
    `;
  }
  // Vídeo
  if (denunciaParaEdicao.video) {
    html += `
      <div class="media-preview-container">
        <p>Vídeo:</p>
        <video controls class="media-preview" style="max-width:220px;max-height:140px;border-radius:8px;">
          <source src="${denunciaParaEdicao.video}">
          Seu navegador não suporta vídeo.
        </video>
        <button class="btn-remove-media" data-type="video">Remover Vídeo</button>
      </div>
    `;
  }
  el.innerHTML = html || '<p>Nenhuma mídia adicionada.</p>';

  document.querySelectorAll('.btn-remove-media').forEach(button => {
    button.onclick = (e) => {
      const tipo = e.target.dataset.type;
      if (tipo === 'image') denunciaParaEdicao.imagem = null;
      if (tipo === 'video') denunciaParaEdicao.video = null;
      updateSelectedFilesUI();
    };
  });
}

// Adiciona imagem/vídeo (arquivo local, convertido em Base64)
function handleFileSelect(event, tipo) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onloadend = () => {
    denunciaParaEdicao[tipo] = reader.result;
    updateSelectedFilesUI();
  };
  reader.readAsDataURL(file);
}

// Permitir uso de URL externa
function adicionarURLMedia(tipo) {
  const url = prompt(`Cole a URL da ${tipo === 'imagem' ? 'imagem' : 'vídeo'} externa:`);
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    denunciaParaEdicao[tipo] = url;
    updateSelectedFilesUI();
  } else if (url) {
    alert("URL inválida.");
  }
}

// ----------------------
// 4. Adicionar Timeline
// ----------------------
function adicionarEventoTimeline() {
  const status = document.getElementById("timeline-new-status-select").value;
  const notas = document.getElementById("timeline-new-notes").value.trim();
  if (!status) {
    alert("Selecione um status.");
    return;
  }
  const evento = {
    status: status,
    timestamp: new Date().toISOString(),
    notas: notas
  };
  if (!Array.isArray(denunciaParaEdicao.timeline)) denunciaParaEdicao.timeline = [];
  denunciaParaEdicao.timeline.push(evento);
  renderizarTimeline(denunciaParaEdicao.timeline);
  document.getElementById("timeline-new-status-select").selectedIndex = 0;
  document.getElementById("timeline-new-notes").value = "";
}

// ----------------------
// 5. Salvar Atualização
// ----------------------
async function salvarAtualizacaoDenuncia(event) {
  event.preventDefault();

  // Monta objeto com todos os campos do formulário e da edição
  const dadosAtualizados = {
    titulo: document.getElementById("denuncia-titulo-input").value,
    categoria: document.querySelector("select[name='categoria']").value,
    descricao: document.getElementById("update-description").value,
    endereco: {
      cep: document.getElementById("cep-input").value,
      logradouro: document.getElementById("logradouro-input").value,
      bairro: document.getElementById("bairro-input").value,
      cidade: document.getElementById("cidade-input").value,
      estado: document.getElementById("estado-input").value
    },
    imagem: denunciaParaEdicao.imagem,
    video: denunciaParaEdicao.video,
    timeline: denunciaParaEdicao.timeline
  };

  try {
    const response = await fetch(
      currentDenunciaId ? `${API_URL}/${currentDenunciaId}` : API_URL,
      {
        method: currentDenunciaId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosAtualizados)
      }
    );
    if (!response.ok) throw new Error("Falha ao salvar denúncia");

    alert("Denúncia salva com sucesso!");
    window.location.href = currentDenunciaId
      ? "comentarios.html?id=" + currentDenunciaId
      : "feed.html";
  } catch (err) {
    alert("Erro ao salvar denúncia. Tente novamente.");
  }
}

// ----------------------
// 6. Excluir denúncia
// ----------------------
async function excluirDenuncia() {
  if (!currentDenunciaId) return;
  if (!confirm("Tem certeza que deseja excluir esta denúncia?")) return;

  try {
    const response = await fetch(`${API_URL}/${currentDenunciaId}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Falha ao excluir denúncia");

    alert("Denúncia excluída com sucesso!");
    window.location.href = "feed.html";
  } catch (err) {
    alert("Erro ao excluir denúncia. Tente novamente.");
  }
}

// ----------------------
// 7. Listeners
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
  carregarDadosDenuncia();

  // Formulário principal
  document.getElementById("btn-save").onclick = salvarAtualizacaoDenuncia;

  // Timeline
  document.getElementById("btn-add-timeline-event").onclick = adicionarEventoTimeline;

  // Mídia: arquivo local
  document.getElementById("btn-add-image").onclick = () => {
    if (confirm("Deseja adicionar uma imagem do seu dispositivo? (Clique em 'Cancelar' para usar uma URL)")) {
      document.getElementById("image-input").click();
    } else {
      adicionarURLMedia("imagem");
    }
  };
  document.getElementById("btn-add-video").onclick = () => {
    if (confirm("Deseja adicionar um vídeo do seu dispositivo? (Clique em 'Cancelar' para usar uma URL)")) {
      document.getElementById("video-input").click();
    } else {
      adicionarURLMedia("video");
    }
  };
  document.getElementById("image-input").onchange = (event) => handleFileSelect(event, "imagem");
  document.getElementById("video-input").onchange = (event) => handleFileSelect(event, "video");

  // Voltar
  document.getElementById("btn-back").onclick = () => window.history.back();

  // Excluir denúncia
  document.getElementById("btn-delete").onclick = excluirDenuncia;
});
