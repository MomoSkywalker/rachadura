// Usamos a sintaxe do jQuery $(document).ready() que é equivalente ao DOMContentLoaded
$(document).ready(function() {

    const API_URL = "https://rachadura.onrender.com/api/usuarios";
    let db_usuarios = [];

    // ---> NOVO: INICIALIZAÇÃO DAS MÁSCARAS COM JQUERY <---
    // A sintaxe é muito mais limpa. O jQuery encontra o elemento pelo ID e o plugin aplica a máscara.
    $('#reg-cpf').mask('000.000.000-00');
    $('#reg-cep').mask('00.000-000');


    // --- LÓGICA DE ENDEREÇO COM VUE.JS (permanece a mesma) ---
    const appEndereco = Vue.createApp({
        data() {
            return {
                cep: '', logradouro: '', numero: '', complemento: '',
                bairro: '', cidade: '', estado: ''
            }
        },
        methods: {
            async buscarCep() {
                // O v-model do Vue ainda funciona com a máscara do jQuery.
                const cepLimpo = this.cep.replace(/\D/g, ''); 
                if (cepLimpo.length === 8) {
                    try {
                        const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
                        if (!response.data.erro) {
                            this.logradouro = response.data.logradouro;
                            this.bairro = response.data.bairro;
                            this.cidade = response.data.localidade;
                            this.estado = response.data.uf;
                        } else {
                            alert("CEP não encontrado.");
                        }
                    } catch (error) { console.error("Erro ao buscar CEP:", error); }
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


    // --- FUNÇÕES DE LÓGICA (sem alterações) ---
    const fileToBase64 = file => new Promise((resolve, reject) => { /* ... */ });
    const generateUserId = () => "user_" + Math.floor(Math.random() * 90000 + 10000);
    const isMaiorDeIdade = (dataNascimento) => { /* ... */ };


    // --- LÓGICA PRINCIPAL ---
    async function carregarUsuarios() { /* ... */ }
    function loginUser(login, senha) { /* ... */ }
    async function addUser(novoUsuario) { /* ... */ }


    // --- EVENT LISTENERS COM JQUERY ---
    $('#login-form').on('submit', (e) => {
        e.preventDefault();
        if (loginUser($('#username').val(), $('#password').val())) {
            window.location.href = 'home_page.html';
        } else {
            alert('Usuário ou senha incorretos.');
        }
    });

    $('#btn-salvar-usuario').on('click', async () => {
        // Pega o valor sem máscara usando o próprio plugin
        const cpf = $('#reg-cpf').cleanVal(); 
        const dataNascimento = $('#reg-nascimento').val();

        if (!isMaiorDeIdade(dataNascimento)) {
            alert("É necessário ser maior de 18 anos para se cadastrar.");
            return;
        }
        
        const senha = $('#reg-senha').val();
        const senha2 = $('#reg-senha2').val();
        if (senha !== senha2) {
            alert("As senhas não conferem.");
            return;
        }

        let fotoBase64 = "https://i.pravatar.cc/150";
        const fotoFile = $('#reg-foto')[0].files[0];
        if (fotoFile) {
            fotoBase64 = await fileToBase64(fotoFile);
        }

        const novoUsuario = {
            id: generateUserId(),
            nome: $('#reg-nome').val().trim(),
            usuario: $('#reg-usuario').val().trim(),
            senha: senha,
            email: $('#reg-email').val().trim(),
            cpf: cpf,
            data_nascimento: dataNascimento,
            foto_perfil: fotoBase64,
            endereco_residencial: appEndereco.getEnderecoCompleto(),
            data_criacao: new Date().toISOString(),
            nivel: "usuario",
            status: "ativo"
        };
        
        if (await addUser(novoUsuario)) {
            // Usando jQuery para encontrar o modal e o Bootstrap para escondê-lo
            var registerModal = new bootstrap.Modal($('#registerModal')[0]);
            registerModal.hide();
            $('#register-form')[0].reset();
            appEndereco.cep = ''; // Limpa o CEP no Vue
        }
    });

    carregarUsuarios();

    // Funções de lógica que podem ser coladas aqui (sem alterações da versão anterior)
    function loginUser(login, senha) { const user = db_usuarios.find(u => u.usuario === login && u.senha === senha); if (user) { sessionStorage.setItem('usuarioCorrente', JSON.stringify(user)); localStorage.setItem('usuarioId', user.id); return true; } return false; }
    async function addUser(novoUsuario) { try { const response = await axios.post(API_URL, novoUsuario); db_usuarios.push(response.data); alert("Usuário criado com sucesso!"); return true; } catch (error) { alert("Erro ao criar usuário."); return false; } }
    async function carregarUsuarios() { try { const response = await axios.get(API_URL); db_usuarios = response.data; } catch (error) { console.error('Erro ao carregar usuários:', error); } }
    function isMaiorDeIdade(dataNascimento) { const hoje = new Date(); const nascimento = new Date(dataNascimento); let idade = hoje.getFullYear() - nascimento.getFullYear(); const m = hoje.getMonth() - nascimento.getMonth(); if (m < 0 || (m === 0 && hoje.getDate() <= nascimento.getDate())) { idade--; } return idade >= 18; }
});