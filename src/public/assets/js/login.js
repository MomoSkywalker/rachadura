document.addEventListener('DOMContentLoaded', () => {

    const API_URL = "https://rachadura.onrender.com/api/usuarios";
    let db_usuarios = [];

    // --- FUNÇÕES AUXILIARES ---

    const fileToBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    const generateUserId = () => "user_" + Math.floor(Math.random() * 90000 + 10000);

    // --- CARREGAMENTO INICIAL ---

    const carregarUsuarios = async () => {
        try {
            const response = await axios.get(API_URL);
            db_usuarios = response.data;
            console.log("Usuários carregados:", db_usuarios);
        } catch (error) {
            console.error('Erro ao carregar usuários da API:', error);
            alert("Não foi possível conectar ao servidor de usuários.");
        }
    };

    // --- LÓGICA DE LOGIN E CADASTRO ---

    const loginUser = (login, senha) => {
        const usuarioEncontrado = db_usuarios.find(user => user.usuario === login && user.senha === senha);
        
        if (usuarioEncontrado) {
            // Salva apenas os dados essenciais na sessionStorage
            const usuarioCorrente = {
                id: usuarioEncontrado.id,
                usuario: usuarioEncontrado.usuario,
                email: usuarioEncontrado.email,
                nome: usuarioEncontrado.nome,
                foto_perfil: usuarioEncontrado.foto_perfil
            };
            sessionStorage.setItem('usuarioCorrente', JSON.stringify(usuarioCorrente));
            localStorage.setItem('usuarioId', usuarioCorrente.id); // Mantendo o padrão das outras páginas
            return true;
        }
        return false;
    };

    const addUser = async (novoUsuario) => {
        try {
            const response = await axios.post(API_URL, novoUsuario);
            db_usuarios.push(response.data);
            alert("Usuário criado com sucesso! Por favor, faça o login.");
            return true;
        } catch (error) {
            console.error('Erro ao inserir usuário via API:', error);
            alert("Erro ao criar usuário. O nome de usuário pode já existir.");
            return false;
        }
    };

    // --- EVENT LISTENERS ---

    const formLogin = document.getElementById('login-form');
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (loginUser(username, password)) {
            // Redireciona para a página principal após o login
            window.location.href = 'home_page.html';
        } else {
            alert('Usuário ou senha incorretos.');
        }
    });

    const btnSalvar = document.getElementById('btn-salvar-usuario');
    btnSalvar.addEventListener('click', async () => {
        const usuario = document.getElementById('reg-usuario').value.trim();
        const nome = document.getElementById('reg-nome').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const senha = document.getElementById('reg-senha').value;
        const senha2 = document.getElementById('reg-senha2').value;
        const fotoFile = document.getElementById('reg-foto').files[0];

        if (!usuario || !nome || !email || !senha) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }
        if (senha !== senha2) {
            alert("As senhas não conferem.");
            return;
        }

        let fotoBase64 = "https://randomuser.me/api/portraits/lego/1.jpg"; // Imagem padrão
        if (fotoFile) {
            fotoBase64 = await fileToBase64(fotoFile);
        }

        const novoUsuario = {
            id: generateUserId(),
            nome: nome,
            usuario: usuario,
            senha: senha, // Lembre-se do aviso de segurança!
            foto_perfil: fotoBase64,
            email: email,
            data_criacao: new Date().toISOString(),
            nivel: "usuario",
            status: "ativo",
            tentativas_login: 0,
            ultima_atividade: new Date().toISOString()
        };
        
        if (await addUser(novoUsuario)) {
            // Fecha o modal e limpa o formulário
            const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            registerModal.hide();
            document.getElementById('register-form').reset();
        }
    });

    // --- INICIALIZAÇÃO ---
    carregarUsuarios();

});