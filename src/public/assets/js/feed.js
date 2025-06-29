fetch('https://rachadura.onrender.com/api/denuncias')
    .then(response => response.json())
    .then(denuncias => {
        const feed = document.getElementById('feed');
        feed.innerHTML = ''; // limpa o feed

        denuncias.forEach(denuncia => {
            const end = denuncia.endereco || {};
            const enderecoFormatado = `${end.logradouro || ""}, ${end.bairro || ""}, ${end.cidade || ""}`;
            const card = document.createElement('div');
            card.className = 'cartao';

            card.innerHTML = `
        <div class="perfil">
          <img src="${denuncia.foto_perfil || 'https://placehold.co/32x32?text=U'}" alt="Perfil" class="icone" style="width:32px; height:32px; border-radius:50%;">
          <span class="usuario">${denuncia.usuarioId || 'Usuário'}</span>
        </div>
        <img src="${denuncia.imagem || denuncia.midias?.[0] || 'https://placehold.co/400x200?text=Denúncia'}" alt="Denúncia" class="imagem-denuncia" style="width:100%;max-width:420px;border-radius:10px;margin:12px 0;">
        <div class="descricao">${denuncia.descricao || ''}</div>
        <div class="localizacao">${enderecoFormatado}</div>
        <div class="categoria">${denuncia.categoria ? 'Categoria: ' + denuncia.categoria : ''}</div>
      `;

            // Evento de clique: abre a página de comentários da denúncia
            card.addEventListener('click', () => {
                window.location.href = `/views/comentarios.html?id=${encodeURIComponent(denuncia.id)}`;
            });

            feed.appendChild(card);
        });
    });
