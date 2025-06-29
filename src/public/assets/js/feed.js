fetch('https://rachadura.onrender.com/api/feed')
    .then(response => response.json())
    .then(data => {
        const feed = document.getElementById('feed');
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'cartao';
            card.innerHTML = `
        <div class="perfil">
          <img src="${item.foto_perfil}" alt="Perfil de ${item.usuario}" class="icone" style="width:32px; height:32px; border-radius:50%;">
          <span class="usuario">${item.usuario}</span>
        </div>
        <img src="${item.imagem_denuncia}" alt="Denúncia" class="imagem-denuncia" style="width:100%;max-width:420px;border-radius:10px;margin:12px 0;">
        <div class="descricao">${item.descricao}</div>
        <div class="localizacao">${item.localizacao}</div>
        <div class="categoria">${item.categoria ? 'Categoria: ' + item.categoria : ''}</div>
      `;
            // ADICIONE ESSE BLOCO:
            card.addEventListener('click', () => {
                // Usando id ou outro campo único
                window.location.href = `/views/comentarios.html?id=${encodeURIComponent(item.id)}`;
            });
            feed.appendChild(card);
        });

    });