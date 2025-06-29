document.addEventListener('DOMContentLoaded', () => {

    const API_URL = "https://rachadura.onrender.com/api/usuarios";
    let db_usuarios = [];

    // --- LÓGICA DE ENDEREÇO COM VUE.JS ---
    const appEndereco = Vue.createApp({
        data() {
            return {
                cep: '', logradouro: '', numero: '', complemento: '',
                bairro: '', cidade: '', estado: ''
            }
        },
        methods: {
            async buscarCep() {
                if (this.cep.length >= 8) {
                    try {
                        const response = await axios.get(`https://viacep.com.br/ws/${this.cep}/json/`);
                        if (!response.data.erro) {
                            this.logradouro = response.data.logradouro;
                            this.bairro = response.data.bairro;
                            this.cidade = response.data.localidade;
                            this.estado = response.data.uf;
                        }
                    } catch (error) {
                        console.error("Erro ao buscar CEP:", error);
                    }
                }
            },
            getEnderecoCompleto() {
                return {
                    cep: this.cep, logradouro: this.logradouro, numero: this.numero, complemento: this.complemento,
                    bairro: this.bairro, cidade: this.cidade, estado: this.estado
                };
            }
        }
    }).mount('#vue-endereco-app');

    // --- FUNÇÕES AUXILIARES ---
    const fileToBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    const generateUserId = () => "user_" + Math.floor(Math.random() * 90000 + 10000);

    // Valida se o usuário é maior de 18 anos
    const isMaiorDeIdade = (dataNascimento) => {
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const m = hoje.getMonth() - nascimento.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        return idade >= 18;
    };

    // --- LÓGICA PRINCIPAL ---
    const carregarUsuarios = async () => { /* ... (sem alterações) ... */ };
    const loginUser = (login, senha) => { /* ... (sem alterações) ... */ };
    const addUser = async (novoUsuario) => { /* ... (sem alterações) ... */ };

    // --- EVENT LISTENERS ---
    const formLogin = document.getElementById('login-form');
    formLogin.addEventListener('submit', (e) => { /* ... (sem alterações) ... */ });

    const btnSalvar = document.getElementById('btn-salvar-usuario');
    btnSalvar.addEventListener('click', async () => {
        const usuario = document.getElementById('reg-usuario').value.trim();
        const nome = document.getElementById('reg-nome').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const cpf = document.getElementById('reg-cpf').value.trim();
        const dataNascimento = document.getElementById('reg-nascimento').value;
        const senha = document.getElementById('reg-senha').value;
        const senha2 = document.getElementById('reg-senha2').value;
        const fotoFile = document.getElementById('reg-foto').files[0];

        // Validações
        if (!usuario || !nome || !email || !senha || !cpf || !dataNascimento) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }
        if (senha !== senha2) {
            alert("As senhas não conferem.");
            return;
        }
        if (!isMaiorDeIdade(dataNascimento)) {
            alert("É necessário ser maior de 18 anos para se cadastrar.");
            return;
        }

        let fotoBase64 = "https://randomuser.me/api/portraits/lego/1.jpg"; // Imagem padrão
        if (fotoFile) {
            fotoBase64 = await fileToBase64(fotoFile);
        }

        // Monta o objeto final do usuário com todos os novos campos
        const novoUsuario = {
            id: generateUserId(),
            nome: nome,
            usuario: usuario,
            senha: senha,
            email: email,
            cpf: cpf,
            data_nascimento: dataNascimento,
            foto_perfil: fotoBase64,
            endereco_residencial: appEndereco.getEnderecoCompleto(), // Pega o endereço do Vue
            data_criacao: new Date().toISOString(),
            nivel: "usuario",
            status: "ativo"
        };
        
        if (await addUser(novoUsuario)) {
            const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            registerModal.hide();
            document.getElementById('register-form').reset();
        }
    });

    // --- INICIALIZAÇÃO ---
    carregarUsuarios();

    // Funções que estavam faltando para colar:
    async function carregarUsuarios() {
        try {
            const response = await axios.get(API_URL);
            db_usuarios = response.data;
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
    }
    
    function loginUser(login, senha) {
        const user = db_usuarios.find(u => u.usuario === login && u.senha === senha);
        if (user) {
            sessionStorage.setItem('usuarioCorrente', JSON.stringify(user));
            localStorage.setItem('usuarioId', user.id);
            return true;
        }
        return false;
    }

    async function addUser(novoUsuario) {
        try {
            const response = await axios.post(API_URL, novoUsuario);
            db_usuarios.push(response.data);
            alert("Usuário criado com sucesso!");
            return true;
        } catch (error) {
            alert("Erro ao criar usuário.");
            return false;
        }
    }

    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        if (loginUser(username, password)) {
            window.location.href = 'home_page.html';
        } else {
            alert('Usuário ou senha incorretos.');
        }
    });

});