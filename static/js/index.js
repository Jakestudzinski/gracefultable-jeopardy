document.addEventListener('DOMContentLoaded', () => {
    checkDatabaseConnection();
    loadGames();
});

async function checkDatabaseConnection() {
    try {
        // Only add detailed status if the server-side status wasn't already provided
        if (!document.querySelector('.db-status')) {
            const response = await fetch('/api/status');
            const status = await response.json();
            
            const container = document.querySelector('.container');
            const actionsDiv = document.querySelector('.actions');
            
            const dbStatusDiv = document.createElement('div');
            dbStatusDiv.className = 'db-status';
            dbStatusDiv.innerHTML = `
                <h3>Database Connection Status</h3>
                <div class="status-indicator ${status.database.connected ? 'connected' : 'disconnected'}">
                    <p><strong>Status:</strong> ${status.database.connected ? 'Connected' : 'Disconnected'}</p>
                    <p><strong>Games in database:</strong> ${status.database.game_count}</p>
                    <p><strong>Categories in database:</strong> ${status.database.category_count}</p>
                    <p><strong>Clues in database:</strong> ${status.database.clue_count}</p>
                    ${!status.database.connected ? `<p class="error"><strong>Error:</strong> ${status.error}</p>` : ''}
                </div>
            `;
            
            // Insert after actions div
            container.insertBefore(dbStatusDiv, actionsDiv.nextSibling);
        }
    } catch (error) {
        console.error('Error checking database connection:', error);
    }
}

async function loadGames() {
    try {
        const response = await fetch('/api/games');
        const games = await response.json();
        
        const gamesList = document.getElementById('games-list');
        gamesList.innerHTML = '';
        
        if (games.length === 0) {
            gamesList.innerHTML = '<p>No games found. Create a new game to get started!</p>';
            return;
        }
        
        games.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            
            const gameInfo = document.createElement('div');
            gameInfo.className = 'game-info';
            
            const title = document.createElement('h3');
            title.textContent = game.title;
            
            const created = document.createElement('p');
            created.textContent = `Created: ${formatDate(game.created)}`;
            
            gameInfo.appendChild(title);
            gameInfo.appendChild(created);
            
            const actions = document.createElement('div');
            actions.className = 'game-actions';
            
            const playButton = document.createElement('a');
            playButton.href = `/game/${game.id}`;
            playButton.className = 'btn primary';
            playButton.textContent = 'Play';
            
            const editButton = document.createElement('a');
            editButton.href = `/edit/${game.id}`;
            editButton.className = 'btn secondary';
            editButton.textContent = 'Edit';
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn danger';
            deleteButton.textContent = 'Delete';
            deleteButton.dataset.gameId = game.id;
            deleteButton.addEventListener('click', confirmDeleteGame);
            
            actions.appendChild(playButton);
            actions.appendChild(editButton);
            actions.appendChild(deleteButton);
            
            gameCard.appendChild(gameInfo);
            gameCard.appendChild(actions);
            
            gamesList.appendChild(gameCard);
        });
    } catch (error) {
        console.error('Error loading games:', error);
        document.getElementById('games-list').innerHTML = '<p>Error loading games. Please try again later.</p>';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Function to confirm deletion of a game
async function confirmDeleteGame(event) {
    const gameId = event.target.dataset.gameId;
    const gameTitle = event.target.closest('.game-card').querySelector('h3').textContent;
    
    if (confirm(`Are you sure you want to delete the game "${gameTitle}"? This action cannot be undone.`)) {
        await deleteGame(gameId);
    }
}

// Function to delete a game
async function deleteGame(gameId) {
    try {
        const response = await fetch(`/api/games/${gameId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Remove the game card from the DOM
            const gameCard = document.querySelector(`.game-card button[data-game-id="${gameId}"]`).closest('.game-card');
            gameCard.remove();
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'alert success';
            successMessage.textContent = 'Game deleted successfully!';
            
            const container = document.querySelector('.container');
            container.insertBefore(successMessage, container.querySelector('.games-list'));
            
            // Remove the message after 3 seconds
            setTimeout(() => {
                successMessage.remove();
            }, 3000);
            
            // If no games left, show message
            const gamesList = document.getElementById('games-list');
            if (gamesList.children.length === 0) {
                gamesList.innerHTML = '<p>No games found. Create a new game to get started!</p>';
            }
        } else {
            throw new Error(result.error || 'Failed to delete game');
        }
    } catch (error) {
        console.error('Error deleting game:', error);
        alert(`Error deleting game: ${error.message}`);
    }
}
