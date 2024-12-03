
function showLoginRegister() {
    document.getElementById('loginRegisterModal').style.display = 'flex';
}

function register() {
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('As senhas não coincidem');
        return;
    }

    const userData = { fullName, email, password };

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            setTimeout(() => {
                window.location.href = '/index.html';
            })
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao se registar. Por favor, tente novamente mais tarde.');
    });
}

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const userData = { email, password };

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(data.message);
            loginUser(data.fullName, data.credits);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao fazer login. Por favor, tente novamente mais tarde.');
    });
}

function loginUser(fullName, credits) {
    document.getElementById('loginRegisterModal').style.display = 'none';
    document.getElementById('profileLink').textContent = fullName;
    document.getElementById('profileNavItem').style.display = 'block';
    document.getElementById('creditsNavItem').style.display = 'flex'; 
    const loginButton = document.getElementById('loginButton');
    loginButton.textContent = 'Logout';
    loginButton.classList.remove('btn-primary');
    loginButton.classList.add('btn', 'btn-primary');
    loginButton.onclick = logout;
    userCredits = credits;
    updateCreditsDisplay();
}

function logout() {

    location.reload();
}


let userCredits = 0;

function updateCreditsDisplay() {
    const creditsNavItem = document.getElementById('userCreditsNavbar');
    if (creditsNavItem) {
        creditsNavItem.textContent = userCredits;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Recupera o email do cookie
    const userEmail = getCookie('userEmail');

    // Se o email do utilizador estiver disponível, procura os dados do utilizador
    if (userEmail) {
        fetch(`/userDetails`)
            .then(response => response.json())
            .then(data => {
                document.getElementById('profileLink').textContent = data.fullName;
                document.getElementById('profileNavItem').style.display = 'block';
                document.getElementById('creditsNavItem').style.display = 'inline';
                userCredits = data.credits;
                updateCreditsDisplay();
            })
            .catch(error => {
                console.error('Erro ao carregar os dados do utilizador:', error);
            });

        fetch(`/userBets`)
            .then(response => response.json())
            .then(bets => {
                const userBetsContent = document.getElementById('userBetsContent');
                if (userBetsContent) {
                    if (bets.length === 0) {
                        userBetsContent.innerHTML = '<p>Sem apostas guardadas.</p>';
                    } else {
                        const ul = document.createElement('ul');
                        bets.forEach(bet => {
                            const li = document.createElement('li');
                            li.textContent = `Cor: ${bet.color}, Valor: ${bet.amount}, Resultado: ${bet.result}, Ganhos: ${bet.gain}`;
                            ul.appendChild(li);
                        });
                        userBetsContent.appendChild(ul);
                    }
                }
            })
            .catch(error => {
                console.error('Erro ao carregar as apostas do utilizador:', error);
            });
    }
    
});

function getCookie(name) {
    const cookieName = `${name}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i].trim();
        if (cookie.indexOf(cookieName) === 0) {
            return cookie.substring(cookieName.length, cookie.length);
        }
    }
    return null;
}




function bet() {
    const betAmount = parseInt(document.getElementById('betAmount').value);
    const selectedColor = document.getElementById('colorSelect').value;
    const email = document.getElementById('email').value;

    const profileNavItem = document.getElementById('profileNavItem');
    if (!profileNavItem || profileNavItem.style.display === 'none') {
        console.error('O utilizador não está logado.');
        alert('Você precisa estar logado para adicionar créditos.');
        return;
    }

    if (betAmount > userCredits) {
        alert('Créditos insuficientes para fazer a aposta!');
        return;
    }

    // Verifica se o valor da aposta é válido
    if (!betAmount || isNaN(betAmount) || betAmount <= 0) {
        alert('Insira um valor válido para a aposta.');
        return;
    }

    const betData = { email, betAmount, selectedColor };

    fetch('/bet', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(betData),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            const resultColor = data.resultColor;

            // Atualiza a roleta e os créditos do utilizador
            spinWheel(resultColor);

            userCredits = data.newCredits;
            updateCreditsDisplay();

            // Atualiza a lista de últimos resultados
            addResult(`Resultado da roleta: ${resultColor}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao fazer a aposta. Por favor, tente novamente mais tarde.');
    });
}

function spinWheel(resultText) {
    const wheel = document.getElementById('wheel');
    const resultDegrees = {
        'Vermelho': 0,
        'Azul': 90,
        'Verde': 180,
        'Amarelo': 270
    };

    // Adiciona um valor de rotação completo ao ângulo de destino para simular várias rotações
    const rotations = (Math.floor(Math.random() * 5) + 2) * 360;
    const targetRotation = resultDegrees[resultText] + rotations;

    wheel.style.transition = 'transform 4s ease';
    wheel.style.transform = `rotate(${targetRotation}deg)`;

    setTimeout(() => {
        wheel.style.transition = 'none';
        wheel.style.transform = `rotate(${resultDegrees[resultText]}deg)`;

        // Remove a classe de destaque de todas as cores
        document.querySelectorAll('.color').forEach(colorElement => {
            colorElement.classList.remove('highlight');
        });

        // Adiciona a classe de destaque à cor resultante
        const selectedColorElement = document.querySelector(`.${resultText.toLowerCase()}`);
        if (selectedColorElement) {
            selectedColorElement.classList.add('highlight');
        } else {
            console.error(`Elemento com classe ${resultText.toLowerCase()} não encontrado.`);
        }

    }, 4000);
}

let lastResults = [];

// Atualiza a lista dos últimos resultados
function addResult(result) {
    lastResults.push(result);
    if (lastResults.length > 5) {
        lastResults.shift();
    }
    updateResults(); // Atualiza a lista dos resultados após a adição de um novo utilizador
}

function updateResults() {
    const resultsList = document.getElementById('lastResults');
    resultsList.innerHTML = '';
    lastResults.forEach(result => {
        const li = document.createElement('li');
        li.textContent = result;
        resultsList.appendChild(li);
    });
}

function displayMultipliers() {
    const multiplierList = document.getElementById('multiplierList');
    multiplierList.innerHTML = '';
    for (const color in multipliers) {
        const li = document.createElement('li');
        li.textContent = `${color}: ${multipliers[color]}x`;
        multiplierList.appendChild(li);
    }
}


// Função para sortear um número aleatório entre o min e max, inclusive
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function placeBet() {
    const numberInput = parseInt(document.getElementById('numberInput').value);
    const email = document.getElementById('email').value; 
    const betAmount = parseInt(document.getElementById('betAmountInput').value); 

    const profileNavItem = document.getElementById('profileNavItem');
    if (!profileNavItem || profileNavItem.style.display === 'none') {
        console.error('O utilizador não está logado.');
        alert('Você precisa estar logado para fazer uma aposta.');
        return;
    }

    // Verifica se o número fornecido está entre 0 e 10
    if (numberInput < 0 || numberInput > 10 || isNaN(numberInput)) {
        alert('Por favor, escolha um número válido entre 0 e 10.');
        return;
    }

    // Verifica se o valor da aposta é válido
    if (betAmount <= 0 || isNaN(betAmount)) {
        alert('Por favor, insira um valor válido para a aposta.');
        return;
    }

    // Fazer a requisição ao servidor para processar a aposta
    fetch('/placeBetOnNumbers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email, number: numberInput, betAmount: betAmount }) // Passa o email do utilizador e o valor da aposta para o servidor
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Aposta registada com sucesso!');
            userCredits = data.newCredits;
            updateCreditsDisplay();
            fillNumberSquares(data.numbersArray); // Preenche os quadrados com os números gerados pelo servidor

            // Atualiza o histórico de apostas do utilizador
            const betDetails = { number: numberInput, amount: betAmount, result: 'N/A', gain: 'N/A' };
            updateBetHistory(betDetails);
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Erro ao fazer a aposta:', error);
        alert('Erro ao fazer a aposta. Por favor, tente novamente.');
    });
}

// Função para preencher os quadrados com os números gerados pelo servidor
function fillNumberSquares(numbersArray) {
    for (let i = 0; i < numbersArray.length; i++) {
        document.getElementById(`numberSquare${i + 1}`).innerText = numbersArray[i];
    }
}


function updateBetHistory(betDetails) {
    const userEmail = getCookie('userEmail');

    fetch('/updateBetHistory', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userEmail: userEmail, betDetails: betDetails })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Recarrega as apostas do utilizador após a atualização
            loadUserBets();
        } else {
            console.error('Erro ao atualizar o histórico de apostas do utilizador:', data.error);
        }
    })
}



function switchForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const formTitle = document.getElementById('formTitle');

    if (loginForm.style.display === 'block') {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        formTitle.textContent = 'Registro';
    } else {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        formTitle.textContent = 'Login';
    }
}





document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.style.display = isLoggedIn() ? 'inline-block' : 'none';
    }
});


function closeLoginRegister() {
    document.getElementById('loginRegisterModal').style.display = 'none';
}

function getCookie(name) {
    const cookieValue = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return cookieValue ? cookieValue.pop() : null;
}




function addCredits() {
    const profileNavItem = document.getElementById('profileNavItem');
    if (!profileNavItem || profileNavItem.style.display === 'none') {
        console.error('O utilizador não está logado.');
        alert('Você precisa estar logado para adicionar créditos.');
        return;
    }

    const userEmail = getCookie('userEmail');

    fetch('/addCredits', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userEmail }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Dados recebidos:', data);
        if (data.success) {
            console.log('Créditos adicionados com sucesso!');
            userCredits = data.newCredits;
            updateCreditsDisplay(data.newCredits);
            alert('Você recebeu os seus créditos com sucesso!');
        } else {
            console.log('Erro ao adicionar créditos:', data.message || 'Erro desconhecido');
            alert(data.message || 'Erro ao adicionar créditos.');
        }
    })
    .catch(error => {
        console.error('Erro ao adicionar créditos:', error);
        alert('Erro ao adicionar créditos. Por favor, tente novamente mais tarde.');
    });
}