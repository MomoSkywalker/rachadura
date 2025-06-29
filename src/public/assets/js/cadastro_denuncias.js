// A função verificarLoginERedirecionar foi REMOVIDA daqui, pois agora está no auth.js

document.addEventListener('DOMContentLoaded', () => {

    // 1. Chama a função que agora existe globalmente graças ao arquivo auth.js
    if (!verificarLoginERedirecionar("Você precisa estar logado para cadastrar uma denúncia.")) {
        return; 
    }

    // O resto do seu código Vue.js continua normalmente...
    const { createApp } = Vue;
    const SUA_CHAVE_API_DO_GOOGLE = "AIzaSyCXaSAFrF6bVb5s5eI2uQDTyE231PgkVbw"; 

    createApp({
      data() {
        return {
          endereco: { cep: "", logradouro: "", numero: "", estado: "", cidade: "", bairro: "", lat: null, lng: null },
          enderecoBloqueado: false,
          imagensBase64: []
        };
      },
      methods: {
        // ... TODAS AS SUAS FUNÇÕES methods (cepAlteradoEvento, geocodificarEndereco, etc.) FICAM AQUI ...
        // Nenhuma mudança é necessária dentro de 'methods'.
        // Cole aqui todo o bloco 'methods: { ... }' da sua versão anterior.
        cepAlteradoEvento() {
          if (!this.endereco.cep) return;
          axios.get(`https://viacep.com.br/ws/${this.endereco.cep}/json/`)
            .then(response => {
              const bean = response.data;
              if (bean.erro) {
                alert("CEP não encontrado.");
                return;
              }
              this.endereco.logradouro = bean.logradouro;
              this.endereco.bairro = bean.bairro;
              this.endereco.estado = bean.uf;
              this.endereco.cidade = bean.localidade;
              this.enderecoBloqueado = true;
            })
            .catch(() => {
              alert("Erro ao buscar o CEP. Verifique se está correto.");
            });
        },
        async geocodificarEndereco() {
          const enderecoCompleto = `${this.endereco.logradouro}, ${this.endereco.numero}, ${this.endereco.bairro}, ${this.endereco.cidade}, ${this.endereco.estado}`;
          if (!this.endereco.logradouro || !this.endereco.cidade) {
            return;
          }
          const enderecoFormatado = encodeURIComponent(enderecoCompleto);
          const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${enderecoFormatado}&key=${SUA_CHAVE_API_DO_GOOGLE}`;
          try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.status === 'OK') {
              const location = data.results[0].geometry.location;
              this.endereco.lat = location.lat;
              this.endereco.lng = location.lng;
              alert("Endereço localizado no mapa com sucesso!");
            } else {
              alert("Não foi possível encontrar as coordenadas para este endereço.");
              this.endereco.lat = null;
              this.endereco.lng = null;
            }
          } catch (error) {
            console.error("Falha na API de geocodificação:", error);
          }
        },
        async filesToBase64(files) {
          return Promise.all(Array.from(files).map(file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })));
        },
        async enviarFormulario(event) {
          event.preventDefault();
          if (!this.endereco.lat || !this.endereco.lng) {
            alert("Por favor, verifique o endereço para que as coordenadas possam ser geradas antes de enviar.");
            await this.geocodificarEndereco();
            if (!this.endereco.lat || !this.endereco.lng) return;
          }
          const usuarioId = localStorage.getItem("usuarioId");
          const titulo = document.getElementById("denuncia-titulo-input").value;
          const categoria = document.querySelector("select[name='categoria']").value;
          const descricao = document.getElementById("update-description").value;
          const files = document.getElementById("midia").files;
          const midias = await this.filesToBase64(files);
          const timeline = [{ status: "Denúncia Criada", timestamp: new Date().toISOString(), notas: "Denúncia registrada pelo usuário." }];
          const dados = { usuarioId, titulo, categoria, descricao, midias, endereco: this.endereco, dataRegistro: new Date().toISOString(), timeline };
          axios.post("https://rachadura.onrender.com/api/denuncias", dados)
            .then(response => {
              alert("Denúncia enviada com sucesso!");
              this.mostrarTabela();
              window.location.href = "/views/feed.html";
            })
            .catch(error => {
              alert("Erro ao enviar denúncia");
              console.error(error);
            });
        },
        mostrarTabela() {
          const usuarioId = localStorage.getItem("usuarioId");
          if (!usuarioId) {
            document.getElementById("tabela-denuncias").innerHTML = "";
            return;
          }
          axios.get("https://rachadura.onrender.com/api/denuncias")
            .then(res => {
              const denuncias = res.data.filter(d => d.usuarioId === usuarioId).sort((a, b) => new Date(b.dataRegistro) - new Date(a.dataRegistro)).slice(0, 5);
              if (denuncias.length === 0) {
                document.getElementById("tabela-denuncias").innerHTML = "";
                return;
              }
              let html = `<div class="tabela-container"><h2 class="titulo-tabela">Denúncias Enviadas</h2><table class="tabela-denuncias"><thead><tr><th>Título</th><th>Categoria</th><th>Descrição</th><th>Local</th><th>Data</th></tr></thead><tbody>`;
              denuncias.forEach(d => {
                const end = d.endereco || {};
                html += `<tr><td>${d.titulo || "-"}</td><td>${d.categoria || "-"}</td><td>${d.descricao || "-"}</td><td>${end.logradouro || "-"}, ${end.bairro || "-"}, ${end.cidade || "-"}</td><td>${d.dataRegistro ? new Date(d.dataRegistro).toLocaleString() : "-"}</td></tr>`;
              });
              html += `</tbody></table></div>`;
              document.getElementById("tabela-denuncias").innerHTML = html;
            })
            .catch(err => {
              console.error("Erro ao carregar tabela:", err);
            });
        }
      },
      mounted() {
        const form = document.getElementById("formDenuncia");
        const botaoCancelar = document.getElementById("btn-back");
        if (form) {
          form.addEventListener("submit", this.enviarFormulario);
        }
        if (botaoCancelar) {
          botaoCancelar.addEventListener("click", (event) => {
            event.preventDefault();
            form.reset();
            this.endereco = { cep: "", logradouro: "", numero: "", estado: "", cidade: "", bairro: "", lat: null, lng: null };
            this.enderecoBloqueado = false;
            window.location.href = "/views/home_page.html";
          });
        }
        this.mostrarTabela();
      }
    }).mount("#appCep");
});
