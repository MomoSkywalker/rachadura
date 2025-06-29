 // Chave para armazenamento no localStorage
        const LOCAL_STORAGE_KEY = 'denuncias_app_data';
        const params = new URLSearchParams(window.location.search);
        const denunciaId = params.get('id');

        // Função para obter dados do localStorage ou usar os dados padrão
        function getFeedData() {
            const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedData) {
                return JSON.parse(savedData);
            } else {
                // Dados iniciais com imagens de falta de infraestrutura real
                return {
                    "feed": [
                        {
                            "id": 1,
                            "usuario": "joao_silva",
                            "foto_perfil": "https://randomuser.me/api/portraits/men/1.jpg",
                            "imagem_denuncia": "https://www.cnnbrasil.com.br/wp-content/uploads/sites/12/2021/12/estrada-destruida-chuva.jpg",
                            "descricao": "Estrada completamente destruída após as chuvas, impossibilitando o trânsito de veículos e isolando a comunidade.",
                            "localizacao": "Estrada Rural, Zona Rural",
                            "likes": 5,
                            "dislikes": 2,
                            "userReaction": null,
                            "comentarios": [
                                {
                                    "id": 1,
                                    "usuario": "maria_oliveira",
                                    "foto_perfil": "https://randomuser.me/api/portraits/women/2.jpg",
                                    "texto": "Já faz mais de um mês que está assim!",
                                    "data": "2025-05-10T14:30:00"
                                },
                                {
                                    "id": 2,
                                    "usuario": "ana_souza",
                                    "foto_perfil": "https://randomuser.me/api/portraits/women/4.jpg",
                                    "texto": "Vou acionar a prefeitura sobre isso.",
                                    "data": "2025-05-11T09:15:00"
                                }
                            ]
                        },
                        {
                            "id": 2,
                            "usuario": "maria_oliveira",
                            "foto_perfil": "https://randomuser.me/api/portraits/women/2.jpg",
                            "imagem_denuncia": "https://s2-g1.glbimg.com/7Lk5t3Q3k5x3Q3Q3Q3Q3Q3Q3Q3Q=/0x0:1280x853/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_59edd422c0c84a879bd37670ae4f538a/internal_photos/bs/2023/d/5/1K5Q5ZQ8SZGZ5Q5Q5Q5Q/agua-vazando.jpg",
                            "descricao": "Vazamento de água há mais de 3 meses, desperdício de água potável e risco de alagamento na rua.",
                            "localizacao": "Rua das Flores, Bairro Central",
                            "likes": 8,
                            "dislikes": 1,
                            "userReaction": null,
                            "comentarios": []
                        },
                        {
                            "id": 3,
                            "usuario": "carlos_lima",
                            "foto_perfil": "https://randomuser.me/api/portraits/men/3.jpg",
                            "imagem_denuncia": "https://www.otempo.com.br/image/contentid/policy:1.2761684:1631731231/image.jpg",
                            "descricao": "Ponte em estado precário, com risco de desabamento. Moradores precisam atravessar a pé com medo.",
                            "localizacao": "Ponte sobre o Rio Jacaré, Zona Leste",
                            "likes": 12,
                            "dislikes": 0,
                            "userReaction": null,
                            "comentarios": [
                                {
                                    "id": 3,
                                    "usuario": "pedro_henrique",
                                    "foto_perfil": "https://randomuser.me/api/portraits/men/5.jpg",
                                    "texto": "Essa ponte já deveria ter sido reformada há anos!",
                                    "data": "2025-03-12T18:45:00"
                                }

                            ]
                        }
                    ]
                };
            }
        }

        // Função para salvar dados no localStorage
        function saveFeedData(data) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        }

        // Variáveis globais
        let feedData = getFeedData();
        let currentPostId = null;
        let currentCommentId = null;
        let isEditing = false;
        let isEditingComment = false;

        // Elementos do modal
        const denunciaModal = document.getElementById('denunciaModal');
        const confirmacaoModal = document.getElementById('confirmacaoModal');
        const novaDenunciaBtn = document.getElementById('novaDenunciaBtn');
        const cancelarDenunciaBtn = document.getElementById('cancelarDenunciaBtn');
        const confirmarDenunciaBtn = document.getElementById('confirmarDenunciaBtn');
        const cancelarExclusaoBtn = document.getElementById('cancelarExclusaoBtn');
        const confirmarExclusaoBtn = document.getElementById('confirmarExclusaoBtn');
        const modalTitle = document.getElementById('modalTitle');
        const confirmacaoMensagem = document.getElementById('confirmacaoMensagem');

        // Função para renderizar o feed
        function renderFeed() {
            const feedContainer = document.getElementById('feedContainer');
            feedContainer.innerHTML = '';
            
            feedData.feed.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post';
                
                postElement.innerHTML = `
                    <div class="post-actions">
                        <button class="action-btn" onclick="openEditModal(${post.id})">
                            <svg class="action-icon" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                            </svg>
                        </button>
                        <button class="action-btn" onclick="openDeleteConfirmation(${post.id}, 'post')">
                            <svg class="action-icon" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                            </svg>
                        </button>
                    </div>
                    <div class="post-header">
                        <img src="${post.foto_perfil}" alt="${post.usuario}" class="post-avatar">
                        <div>
                            <div class="post-user">${post.usuario}</div>
                            <div class="post-location">${post.localizacao}</div>
                        </div>
                    </div>
                    <p class="post-description">${post.descricao}</p>
                    <div class="post-image-container">
                        <img src="${post.imagem_denuncia}" alt="Denúncia" class="post-image" onerror="this.src='https://via.placeholder.com/600x400?text=Imagem+não+disponível'">
                    </div>
                    <div class="reaction-buttons">
                        <button class="reaction-btn ${post.userReaction === 'like' ? 'active' : ''}" 
                                onclick="handleReaction(${post.id}, 'like')">
                            <svg class="reaction-icon" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M23,10C23,8.89 22.1,8 21,8H14.68L15.64,3.43C15.66,3.33 15.67,3.22 15.67,3.11C15.67,2.7 15.5,2.32 15.23,2.05L14.17,1L7.59,7.58C7.22,7.95 7,8.45 7,9V19A2,2 0 0,0 9,21H18C18.83,21 19.54,20.5 19.84,19.78L22.86,12.73C22.95,12.5 23,12.26 23,12V10M1,21H5V9H1V21Z" />
                            </svg>
                            <span>${post.likes}</span>
                        </button>
                        <button class="reaction-btn ${post.userReaction === 'dislike' ? 'active' : ''}" 
                                onclick="handleReaction(${post.id}, 'dislike')">
                            <svg class="reaction-icon" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M19,15H23V3H19M15,3H6C5.17,3 4.46,3.5 4.16,4.22L1.14,11.27C1.05,11.5 1,11.74 1,12V14A2,2 0 0,0 3,16H9.31L8.36,20.57C8.34,20.67 8.33,20.77 8.33,20.88C8.33,21.3 8.5,21.67 8.77,21.94L9.83,23L16.41,16.41C16.78,16.05 17,15.55 17,15V5C17,3.89 16.1,3 15,3Z" />
                            </svg>
                            <span>${post.dislikes}</span>
                        </button>
                    </div>
                    <div class="comments-section" id="comments-${post.id}">
                        <div class="comments-title">Comentários (${post.comentarios.length})</div>
                        ${renderComments(post.comentarios, post.id)}
                        <form class="comment-form" onsubmit="addComment(event, ${post.id})">
                            <input type="text" class="comment-input" placeholder="Adicione um comentário..." required>
                            <button type="submit" class="comment-submit">Enviar</button>
                        </form>
                    </div>
                `;
                
                feedContainer.appendChild(postElement);
            });
        }

        // Função para renderizar comentários
        function renderComments(comments, postId) {
            if (!comments || comments.length === 0) {
                return '<div class="no-comments">Nenhum comentário ainda. Seja o primeiro a comentar!</div>';
            }
            
            return comments.map(comment => {
                const isCurrentUser = comment.usuario === "usuário_atual"; // Simulação - você pode ajustar isso
                const editDeleteButtons = isCurrentUser ? `
                    <div class="comment-actions">
                        <button class="comment-action" onclick="startEditComment(${postId}, ${comment.id})">Editar</button>
                        <button class="comment-action" onclick="openDeleteConfirmation(${comment.id}, 'comment', ${postId})">Excluir</button>
                    </div>
                ` : '';
                
                if (isEditingComment && currentCommentId === comment.id) {
                    return `
                        <div class="comment">
                            <img src="${comment.foto_perfil}" alt="${comment.usuario}" class="comment-avatar">
                            <div class="comment-content">
                                <div class="comment-user">${comment.usuario}</div>
                                <form class="edit-comment-form" onsubmit="saveEditedComment(event, ${postId}, ${comment.id})">
                                    <input type="text" class="edit-comment-input" value="${comment.texto}" required>
                                    <div class="edit-comment-buttons">
                                        <button type="submit" class="edit-comment-btn" style="background-color: var(--cor-botao); color: white;">Salvar</button>
                                        <button type="button" class="edit-comment-btn" onclick="cancelEditComment()" style="background-color: var(--cor-texto-secundario); color: white;">Cancelar</button>
                                    </div>
                                </form>
                                <div class="comment-date">${formatDate(comment.data)}</div>
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="comment">
                            <img src="${comment.foto_perfil}" alt="${comment.usuario}" class="comment-avatar">
                            <div class="comment-content">
                                <div class="comment-user">${comment.usuario}</div>
                                <div class="comment-text">${comment.texto}</div>
                                ${editDeleteButtons}
                                <div class="comment-date">${formatDate(comment.data)}</div>
                            </div>
                        </div>
                    `;
                }
            }).join('');
        }

        // Função para formatar data
        function formatDate(isoString) {
            const date = new Date(isoString);
            return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        }

        // Função para adicionar comentário
        function addComment(event, postId) {
            event.preventDefault();
            const input = event.target.querySelector('.comment-input');
            const commentText = input.value.trim();
            
            if (commentText) {
                const post = feedData.feed.find(p => p.id === postId);
                
                const newComment = {
                    id: Date.now(),
                    usuario: "usuário_atual", // Você pode substituir por um usuário real
                    foto_perfil: "https://randomuser.me/api/portraits/men/10.jpg",
                    texto: commentText,
                    data: new Date().toISOString()
                };
                
                post.comentarios.push(newComment);
                saveFeedData(feedData);
                renderFeed();
                input.value = '';
            }
        }

        // Função para lidar com likes/dislikes
        function handleReaction(postId, reaction) {
            const post = feedData.feed.find(p => p.id === postId);
            
            if (post.userReaction === reaction) {
                post[reaction + 's']--;
                post.userReaction = null;
            } 
            else if (post.userReaction) {
                post[post.userReaction + 's']--;
                post[reaction + 's']++;
                post.userReaction = reaction;
            }
            else {
                post[reaction + 's']++;
                post.userReaction = reaction;
            }
            
            saveFeedData(feedData);
            renderFeed();
        }

        // Função para abrir modal de nova denúncia
        function openNewDenunciaModal() {
            isEditing = false;
            currentPostId = null;
            modalTitle.textContent = 'Nova Denúncia';
            
            document.getElementById('denunciaUsuario').value = '';
            document.getElementById('denunciaLocalizacao').value = '';
            document.getElementById('denunciaDescricao').value = '';
            document.getElementById('denunciaImagem').value = '';
            
            denunciaModal.style.display = 'flex';
        }

        // Função para abrir modal de edição
        function openEditModal(postId) {
            isEditing = true;
            currentPostId = postId;
            modalTitle.textContent = 'Editar Denúncia';
            
            const post = feedData.feed.find(p => p.id === postId);
            
            document.getElementById('denunciaUsuario').value = post.usuario;
            document.getElementById('denunciaLocalizacao').value = post.localizacao;
            document.getElementById('denunciaDescricao').value = post.descricao;
            document.getElementById('denunciaImagem').value = post.imagem_denuncia;
            
            denunciaModal.style.display = 'flex';
        }

        // Função para salvar denúncia (nova ou edição)
        function saveDenuncia() {
            const usuario = document.getElementById('denunciaUsuario').value.trim();
            const localizacao = document.getElementById('denunciaLocalizacao').value.trim();
            const descricao = document.getElementById('denunciaDescricao').value.trim();
            const imagem = document.getElementById('denunciaImagem').value.trim();
            
            if (!usuario || !localizacao || !descricao) {
                alert('Por favor, preencha todos os campos obrigatórios!');
                return;
            }
            
            if (isEditing) {
                // Editar post existente
                const post = feedData.feed.find(p => p.id === currentPostId);
                post.usuario = usuario;
                post.localizacao = localizacao;
                post.descricao = descricao;
                if (imagem) post.imagem_denuncia = imagem;
            } else {
                // Criar novo post
                const newPost = {
                    id: Date.now(),
                    usuario: usuario,
                    foto_perfil: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 50)}.jpg`,
                    imagem_denuncia: imagem || 'https://via.placeholder.com/600x400?text=Sem+imagem',
                    descricao: descricao,
                    localizacao: localizacao,
                    likes: 0,
                    dislikes: 0,
                    userReaction: null,
                    comentarios: []
                };
                feedData.feed.unshift(newPost);
            }
            
            saveFeedData(feedData);
            renderFeed();
            denunciaModal.style.display = 'none';
        }

        // Função para abrir modal de confirmação de exclusão
        function openDeleteConfirmation(id, type, postId = null) {
            if (type === 'post') {
                currentPostId = id;
                confirmacaoMensagem.textContent = 'Tem certeza que deseja excluir esta denúncia?';
            } else {
                currentCommentId = id;
                currentPostId = postId;
                confirmacaoMensagem.textContent = 'Tem certeza que deseja excluir este comentário?';
            }
            
            document.getElementById('confirmarExclusaoBtn').dataset.type = type;
            confirmacaoModal.style.display = 'flex';
        }

        // Função para excluir denúncia ou comentário
        function deleteItem() {
            const type = document.getElementById('confirmarExclusaoBtn').dataset.type;
            
            if (type === 'post') {
                feedData.feed = feedData.feed.filter(p => p.id !== currentPostId);
            } else {
                const post = feedData.feed.find(p => p.id === currentPostId);
                post.comentarios = post.comentarios.filter(c => c.id !== currentCommentId);
            }
            
            saveFeedData(feedData);
            renderFeed();
            confirmacaoModal.style.display = 'none';
        }

        // Função para começar a editar um comentário
        function startEditComment(postId, commentId) {
            isEditingComment = true;
            currentCommentId = commentId;
            currentPostId = postId;
            renderFeed();
        }

        // Função para salvar um comentário editado
        function saveEditedComment(event, postId, commentId) {
            event.preventDefault();
            const input = event.target.querySelector('.edit-comment-input');
            const newText = input.value.trim();
            
            if (newText) {
                const post = feedData.feed.find(p => p.id === postId);
                const comment = post.comentarios.find(c => c.id === commentId);
                comment.texto = newText;
                
                saveFeedData(feedData);
                isEditingComment = false;
                currentCommentId = null;
                renderFeed();
            }
        }

        // Função para cancelar a edição de comentário
        function cancelEditComment() {
            isEditingComment = false;
            currentCommentId = null;
            renderFeed();
        }

        // Event Listeners
        novaDenunciaBtn.addEventListener('click', openNewDenunciaModal);
        cancelarDenunciaBtn.addEventListener('click', () => denunciaModal.style.display = 'none');
        confirmarDenunciaBtn.addEventListener('click', saveDenuncia);
        cancelarExclusaoBtn.addEventListener('click', () => confirmacaoModal.style.display = 'none');
        confirmarExclusaoBtn.addEventListener('click', deleteItem);

        // Fechar modais ao clicar fora
        window.addEventListener('click', (event) => {
            if (event.target === denunciaModal) {
                denunciaModal.style.display = 'none';
            }
            if (event.target === confirmacaoModal) {
                confirmacaoModal.style.display = 'none';
            }
        });

        // Carrega o feed quando a página é aberta
        document.addEventListener('DOMContentLoaded', renderFeed);