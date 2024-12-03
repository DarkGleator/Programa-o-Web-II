document.addEventListener('DOMContentLoaded', () => {
    // Recupera os dados do utilizador
    fetch('/userDetails')
        .then(response => response.json())
        .then(data => {
            const userDetailsContent = document.getElementById('userDetailsContent');
            if (userDetailsContent) {
                userDetailsContent.innerHTML = `
                    <p><strong>Nome:</strong> ${data.fullName}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Créditos:</strong> ${data.credits}</p>
                `;
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados do utilizador:', error);
        });

    // Recupera e exibe as apostas do utilizador
    loadUserBets();

   // Adicione um event listener ao botão de eliminar conta
const deleteUserButton = document.getElementById('deleteUserButton');
if (deleteUserButton) {
    deleteUserButton.addEventListener('click', deleteUserAccount);
}


    // Adiciona um event listener ao botão de excluir apostas selecionadas
    const deleteUserBetsButton = document.getElementById('deleteUserBetsButton');
    if (deleteUserBetsButton) {
        deleteUserBetsButton.addEventListener('click', deleteSelectedUserBets);
    }

    // Adiciona um event listener ao botão de "Editar Dados"
    const editUserDetailsButton = document.getElementById('editUserDetailsButton');
    const editUserDetailsForm = document.getElementById('editUserDetailsForm');
    if (editUserDetailsButton && editUserDetailsForm) {
        editUserDetailsButton.addEventListener('click', () => {
            editUserDetailsForm.style.display = 'block';
            editUserDetailsButton.style.display = 'none';
        });

        // Adiciona um event listener ao botão de "Salvar"
        const saveUserDetailsButton = document.getElementById('saveUserDetailsButton');
        if (saveUserDetailsButton) {
            saveUserDetailsButton.addEventListener('click', saveUserDetails);
        }
    }
});

function saveUserDetails() {
    const newFullName = document.getElementById('editFullName').value;
    const newEmail = document.getElementById('editEmail').value;

     // Verifica se ambos os campos estão preenchidos
     if (!newFullName || !newEmail) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    fetch('/updateUserDetails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newFullName, newEmail })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('Dados do utilizador atualizados com sucesso!');
            // Recarrega os dados do utilizador após a atualização
            location.reload();
        } else {
            alert('Ocorreu um erro ao atualizar os dados do utilizador.');
        }
    })
}

function loadUserBets() {
    fetch('/userBets')
        .then(response => response.json())
        .then(bets => {
            const userBetsContent = document.getElementById('userBetsContent');
            if (userBetsContent) {
                if (bets.length === 0) {
                    userBetsContent.innerHTML = '<p>Sem apostas registadas.</p>';
                } else {
                    const ul = document.createElement('ul');
                    bets.forEach(bet => {
                        const li = document.createElement('li');
                        if (bet.color) {
                            li.textContent = `Cor: ${bet.color}, Valor: ${bet.amount}, Resultado: ${bet.result}, Ganho: ${bet.gain}`;
                        } else if (bet.number) {
                            li.textContent = `Número escolhido: ${bet.number}, Valor da aposta: ${bet.betAmount}, Números gerados: ${bet.numbersArray.join(', ')}, Ganho: ${bet.gain}`;
                        }

                      // Adiciona checkboxes para selecionar as apostas
                      const checkbox = document.createElement('input');
                      checkbox.type = 'checkbox';
                      checkbox.value = JSON.stringify(bet);
                      checkbox.name = 'selectedBets';

                      li.prepend(checkbox);
                      ul.appendChild(li);
                  });

                  // Substitui a lista existente de apostas
                  userBetsContent.innerHTML = '';
                  userBetsContent.appendChild(ul);
              }
          }
      })
      .catch(error => {
          console.error('Erro ao carregar as apostas do utilizador:', error);
      });
}

function deleteSelectedUserBets() {
    const selectedCheckboxes = document.querySelectorAll('input[name="selectedBets"]:checked');
    const selectedBets = Array.from(selectedCheckboxes).map(checkbox => JSON.parse(checkbox.value));

    // Verificar se pelo menos uma aposta está selecionada
    if (selectedCheckboxes.length === 0) {
        alert('Por favor, selecione pelo menos uma aposta para excluir.');
        return;
    }

    fetch('/deleteSelectedUserBets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedBets })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('As apostas selecionadas foram removidas com sucesso!');
            // Remove as apostas selecionadas da lista existente
            selectedCheckboxes.forEach(checkbox => {
                checkbox.parentNode.remove(); // Remove o elemento pai do checkbox (<li>)
            });
        } else {
            alert('Ocorreu um erro ao remover as apostas selecionadas.');
        }
    })
    .catch(error => console.error(error));
}

// Adiciona a função para eliminar a conta
function deleteUserAccount() {
    // Confirma se o utilizador realmente deseja eliminar a conta
    if (confirm("Tem certeza de que deseja eliminar a sua conta? Esta ação é irreversível.")) {
        // Envia uma requisição para eliminar a conta para o servidor
        fetch('/deleteUserAccount', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}) 
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Se a eliminação for bem-sucedida, redireciona o utilizador para a página de login
                window.location.href = '/index.html'; 
            } else {
                // Se ocorrer algum erro durante a eliminação, mostra uma mensagem de erro
                alert('Ocorreu um erro ao eliminar a conta. Por favor, tente novamente mais tarde.');
            }
        })
        .catch(error => console.error(error));
    }
}