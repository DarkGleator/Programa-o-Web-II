const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080;

const usersFilePath = path.join(__dirname, 'data', 'users.json');

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cookieParser());

app.use('/perfil.js', express.static(path.join(__dirname, 'perfil.js')));


app.post('/register', (req, res) => {
    const { fullName, email, password } = req.body;

    // Leitura síncrona do arquivo dos utilizadores
    let users;
    try {
        const userData = fs.readFileSync(usersFilePath, 'utf8');
        users = JSON.parse(userData);
        if (!Array.isArray(users)) {
            throw new Error('Conteúdo do arquivo dos utilizadores não é uma matriz');
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao ler o arquivo dos utilizadores' });
    }

    // Verifica se o email já está registado
    if (users.some(user => user.email === email)) {
        return res.status(400).json({ error: 'E-mail já criado' });
    }

    // Adiciona novo utilizador
    const newUser = { fullName, email, password, credits: 500, bets: [] };
    users.push(newUser);

    // Escreve no arquivo dos utilizadores
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users));
   res.json({ message: 'O Utilizador foi registado com sucesso.' });
   
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao guardar o utilizador' });
    }
});


app.post('/login', (req, res) => {
    const { email, password } = req.body;

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao ler o arquivo dos utilizadores' });
        }

        const users = JSON.parse(data);
        const user = users.find(user => user.email === email && user.password === password);

        if (!user) {
            return res.status(400).json({ error: 'E-mail ou senha incorretos' });
        }

        // Define o cookie com o email do utilizador
        res.cookie('userEmail', email, { maxAge: 900000, httpOnly: true }); // 15 minutos de validade

        res.json({ message: 'Login bem-sucedido', fullName: user.fullName, credits: user.credits });
    });
});

const multipliers = {
    'Vermelho': 2,
    'Azul': 10,
    'Verde': 3,
    'Amarelo': 6
};

app.post('/bet', (req, res) => {
    const { email, betAmount, selectedColor } = req.body;

    // Leitura síncrona do arquivo dos utilizadores
    let users;
    try {
        const userData = fs.readFileSync(usersFilePath, 'utf8');
        users = JSON.parse(userData);
        if (!Array.isArray(users)) {
            throw new Error('Conteúdo do arquivo dos utilizadores não é uma matriz');
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao ler o arquivo dos utilizadores' });
    }

    // Encontra os utilizadores pelo email
    const user = users.find(user => user.email === email);
    if (!user) {
        return res.status(400).json({ error: 'Utilizador não encontrado' });
    }

    // Verifica se os utilizadores tem créditos suficientes
    if (user.credits < betAmount) {
        return res.status(400).json({ error: 'Créditos insuficientes' });
    }

    // Simulação da roleta e cálculo do ganho
    const result = Math.floor(Math.random() * 360);
    let resultColor = '';
    if (result >= 0 && result < 90) {
        resultColor = 'Vermelho';
    } else if (result >= 90 && result < 180) {
        resultColor = 'Azul';
    } else if (result >= 180 && result < 270) {
        resultColor = 'Verde';
    } else {
        resultColor = 'Amarelo';
    }

    let gain = 0;
    if (selectedColor === resultColor) {
        gain = betAmount * multipliers[selectedColor];
    }

    // Atualiza os créditos do Utilizador
    user.credits = user.credits - betAmount + gain;

    // Adiciona a aposta ao Utilizador
    if (!user.bets) {
        user.bets = [];
    }
    user.bets.push({ color: selectedColor, amount: betAmount, result: resultColor, gain: gain });

    // Escreve no arquivo do Utilizador
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
        res.json({ resultColor, gain, newCredits: user.credits });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao atualizar os créditos do Utilizador' });
    }
});

app.get('/userDetails', (req, res) => {
    const userEmail = req.cookies.userEmail;

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao ler o arquivo dos Utilizadores' });
        }
    
        let users = [];
        try {
            users = JSON.parse(data);
            if (!Array.isArray(users)) {
                throw new Error('Conteúdo do arquivo do utilizador não é uma matriz');
            }
        } catch (parseError) {
            console.error(parseError);
            return res.status(500).json({ error: 'Erro ao analisar o arquivo do utilizador' });
        }

        const user = users.find(user => user.email === userEmail);

        if (!user) {
            return res.status(404).json({ error: 'O utilizador não foi encontrado' });
        }

        const userDetails = {
            fullName: user.fullName,
            email: user.email,
            credits: user.credits
        };
        res.json(userDetails);
    });
});

app.get('/userBets', (req, res) => {
    const userEmail = req.cookies.userEmail;

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao ler o arquivo do utilizador' });
        }
    
        let users = [];
        try {
            users = JSON.parse(data);
            if (!Array.isArray(users)) {
                throw new Error('Conteúdo do arquivo do utilizador não é uma matriz');
            }
        } catch (parseError) {
            console.error(parseError);
            return res.status(500).json({ error: 'Erro ao analisar o arquivo do utilizador' });
        }

        const user = users.find(user => user.email === userEmail);

        if (!user) {
            return res.status(404).json({ error: 'O utilizador não foi encontrado' });
        }

        const userBets = user.bets || [];
        res.json(userBets);
    });
});

// Função para sortear um número aleatório entre min e max, inclusive
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

app.post('/placeBetOnNumbers', (req, res) => {
    const { email, number, betAmount } = req.body;

    // Verifica se o utilizador está logado
    const userEmail = req.cookies.userEmail;
    if (!userEmail) {
        return res.status(401).json({ success: false, message: 'Você têm que estar logado para fazer uma aposta.' });
    }

    // Verifica se o número e o email foram fornecidos
    if (!email || typeof number === 'undefined' || typeof betAmount === 'undefined') {
        return res.status(400).json({ success: false, message: 'Preencha todos os campos para fazer uma aposta.' });
    }

    // Verifica se o número está entre 0 e 10
    if (number < 0 || number > 10 || isNaN(number)) {
        return res.status(400).json({ success: false, message: 'Escolha um número válido entre 0 e 10.' });
    }

    // Simula a rotação dos números e gera números aleatórios para as caixas
    const numbersArray = [];
    for (let i = 0; i < 6; i++) {
        numbersArray.push(getRandomNumber(0, 10));
    }

    // Verifica se o número escolhido pelo utilizador aparece duas vezes nos números gerados
    const count = numbersArray.filter(num => num === number).length;

    // Determina os ganhos com base no resultado da aposta
    let gain = 0; 
    if (count >= 2) {
        gain = betAmount * 2; 
    }


    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao ler o arquivo do utilizador' });
        }

        try {
            let users = JSON.parse(data);
            const userIndex = users.findIndex(user => user.email === email);

            if (userIndex === -1) {
                return res.status(404).json({ error: 'O utilizador não foi encontrado.' });
            }

            // Atualiza os créditos do utilizador com base na nova aposta
            users[userIndex].credits -= betAmount;
            users[userIndex].credits += gain; 

            // Adiciona os dados da aposta ao histórico do utilizador
            const betDetails = { number, betAmount, numbersArray, gain };
            if (!users[userIndex].bets) {
                users[userIndex].bets = [];
            }
            users[userIndex].bets.push(betDetails);

            // Escreve os dados atualizados de volta no arquivo users.json
            fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), err => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Erro ao atualizar os créditos do utilizador.' });
                }

                console.log('Dados gravados com sucesso no users.json'); 
                res.json({ success: true, message: 'Aposta criada com sucesso!', numbersArray, betAmount, gain, newCredits: users[userIndex].credits });
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao processar os dados do utilizador.' });
        }
    });
});

app.post('/updateBetHistory', (req, res) => {
    const { userEmail, betDetails } = req.body;

    if (!userEmail || !betDetails) {
        return res.status(400).json({ success: false, message: 'Forneça o email do utilizador e os dados da aposta.' });
    }
    // Le o arquivo users.json
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao ler o arquivo do utilizador' });
        }

        try {
            let users = JSON.parse(data);
            const userIndex = users.findIndex(user => user.email === userEmail);

            if (userIndex === -1) {
                return res.status(404).json({ error: 'O Utilizador não foi encontrado.' });
            }

            // Atualiza o histórico de apostas do utilizador com o novo histórico
            users[userIndex].betHistory = newBetHistory;

            // Escreve os dados atualizados de volta no arquivo users.json
            fs.writeFile(usersFilePath, JSON.stringify(users), err => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Erro ao atualizar o histórico de apostas do utilizador.' });
                }

                // Retorna uma resposta de sucesso
                res.json({ success: true, message: 'Histórico de apostas do utilizador atualizado com sucesso!' });
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao processar os dados do utilizador.' });
        }
    });
});

app.post('/updateUserDetails', (req, res) => {
    const { newFullName, newEmail } = req.body;
    const userEmail = req.cookies.userEmail;

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao ler o arquivo dos utilizador' });
        }

        try {
            // Converte os dados do JSON para um objeto JavaScript
            let users = JSON.parse(data);

            // Procurar pelo utilizador com o email correspondente
            const userIndex = users.findIndex(user => user.email === userEmail);

            // Se o utilizador não foi encontrado, retorna um erro
            if (userIndex === -1) {
                return res.status(404).json({ error: 'Utilizador não encontrado.' });
            }

            // Atualiza os dados do utilizador
            users[userIndex].fullName = newFullName;
            users[userIndex].email = newEmail;

            // Escreve os dados atualizados de volta no arquivo users.json
            fs.writeFile(usersFilePath, JSON.stringify(users), err => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Erro ao atualizar os dados do utilizador.' });
                }

                // Atualiza o cookie do email do utilizador com o novo email
                res.cookie('userEmail', newEmail, { maxAge: 900000, httpOnly: true });

                // Responde com sucesso
                res.json({ success: true });
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao processar os dados do utilizador.' });
        }
    });
});


app.post('/deleteSelectedUserBets', (req, res) => {
    const userEmail = req.cookies.userEmail; 
    const selectedBets = req.body.selectedBets; 

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao ler os dados do utilizador.' });
        }

        try {
            // Converte os dados do JSON para um objeto JavaScript
            const users = JSON.parse(data);

            // Procura pelo utilizador com o email correspondente
            const userIndex = users.findIndex(user => user.email === userEmail);

            // Se o utilizador não foi encontrado, retorna um erro
            if (userIndex === -1) {
                return res.status(404).json({ error: 'Utilizador não encontrado.' });
            }

            // Filtra as apostas do utilizador, mantendo apenas aquelas que não foram selecionadas para exclusão
            users[userIndex].bets = users[userIndex].bets.filter(bet => !selectedBets.some(selectedBet => selectedBet.color === bet.color && selectedBet.amount === bet.amount));

            // Escreve os dados atualizados de volta no arquivo users.json
            fs.writeFile(usersFilePath, JSON.stringify(users), err => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Erro ao atualizar os dados do utilizador.' });
                }

                res.json({ success: true });
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao processar os dados do utilizador.' });
        }
    });
});

app.post('/addCredits', (req, res) => {
    const userEmail = req.cookies.userEmail;

    // Verifica se o utilizador está logado
    if (!userEmail) {
        return res.status(401).json({ success: false, message: 'O Utilizador não está logado.' });
    }

    // Le o arquivo de utilizador
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo do utilizador:', err);
            return res.status(500).json({ success: false, message: 'Erro ao adicionar créditos. Tente novamente mais tarde.' });
        }

        let users;
        try {
            users = JSON.parse(data);
        } catch (parseErr) {
            console.error('Erro ao analisar o arquivo do utilizador:', parseErr);
            return res.status(500).json({ success: false, message: 'Erro ao processar os dados do utilizador.' });
        }

        // Encontra o utilizador pelo email
        const userIndex = users.findIndex(u => u.email === userEmail);
        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: 'O Utilizador não encontrado.' });
        }

        if (typeof users[userIndex].creditClaims === 'undefined') {
            users[userIndex].creditClaims = 0;
        }

        console.log(`O utilizador ${userEmail} já pegou créditos ${users[userIndex].creditClaims} vezes.`);

        // Verifica se o utilizador já pegou os créditos três vezes
        if (users[userIndex].creditClaims >= 3) {
            return res.status(403).json({ success: false, message: 'Você já recebeu os créditos três vezes.' });
        }

        // Adiciona 50 créditos ao utilizador
        users[userIndex].credits += 50;
        // Atualiza o contador de reivindicações de crédito do utilizador
        users[userIndex].creditClaims += 1;

        console.log(`O Utilizador ${userEmail} agora tem ${users[userIndex].credits} créditos e já recebeu créditos ${users[userIndex].creditClaims} vezes.`);

        // Escreve de volta no arquivo do utilizador
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), err => {
            if (err) {
                console.error('Erro ao escrever de volta no arquivo do utilizador:', err);
                return res.status(500).json({ success: false, message: 'Erro ao adicionar créditos. Tente novamente mais tarde.' });
            }

            console.log(`Arquivo ${usersFilePath} atualizado com sucesso para o utilizador ${userEmail}.`);

            // Retorna uma resposta de sucesso com os novos créditos
            return res.json({ success: true, newCredits: users[userIndex].credits });
        });
    });
});


app.post('/deleteUserAccount', (req, res) => {
    const userEmail = req.cookies.userEmail;

    // Ler o arquivo de utilizador
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo do utilizador:', err);
            return res.status(500).json({ success: false, message: 'Erro ao excluir a conta. Tente novamente mais tarde.' });
        }

        let users;
        try {
            users = JSON.parse(data);
        } catch (parseErr) {
            console.error('Erro ao analisar o arquivo do utilizador:', parseErr);
            return res.status(500).json({ success: false, message: 'Erro ao processar dados do utilizador.' });
        }

        // Encontra o índice do utilizador pelo email
        const userIndex = users.findIndex(u => u.email === userEmail);
        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: 'O Utilizador não foi encontrado.' });
        }

        // Remove o utilizador da matriz de utilizadoeres
        const deletedUser = users.splice(userIndex, 1)[0];

        // Escreve de volta no arquivo de utilizadores
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), err => {
            if (err) {
                console.error('Erro ao escrever de volta no arquivo do utilizador:', err);
                return res.status(500).json({ success: false, message: 'Erro ao excluir a conta. Tente novamente mais tarde.' });
            }

            console.log(`O Utilizador ${deletedUser.email} foi excluído com sucesso.`);

            // Limpa cookie do email do utilizador
            res.clearCookie('userEmail');

            // Retorna uma resposta de sucesso
            return res.json({ success: true });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor aberto na porta ${PORT}`);
});
