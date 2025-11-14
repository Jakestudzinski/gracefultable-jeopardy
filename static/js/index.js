document.addEventListener('DOMContentLoaded', () => {
    loadGames();
});

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
            
            actions.appendChild(playButton);
            
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
