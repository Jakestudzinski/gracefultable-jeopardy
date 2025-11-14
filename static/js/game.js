document.addEventListener('DOMContentLoaded', () => {
    // Game state
    let gameData = null;
    let players = [];
    let currentPlayer = 0;
    let timer = null;
    let timerInterval = null;
    
    // DOM elements
    const gameTitle = document.getElementById('game-title');
    const setupScreen = document.getElementById('setup-screen');
    const gameBoard = document.getElementById('game-board');
    const clueDisplay = document.getElementById('clue-display');
    const answerDisplay = document.getElementById('answer-display');
    const categoriesRow = document.getElementById('categories-row');
    const boardGrid = document.getElementById('board-grid');
    const playersContainer = document.getElementById('players-container');
    const addPlayerButton = document.getElementById('add-player');
    const startGameButton = document.getElementById('start-game');
    const backToHomeButton = document.getElementById('back-to-home');
    const clueText = document.getElementById('clue-text');
    const answerText = document.getElementById('answer-text');
    const timerElement = document.getElementById('timer');
    const showAnswerButton = document.getElementById('show-answer');
    const playerButtons = document.getElementById('player-buttons');
    const nobodyButton = document.getElementById('nobody');
    const continueButton = document.getElementById('continue');
    const scoreboard = document.getElementById('scoreboard');
    
    // Current clue being played
    let currentClue = null;
    
    // Load game data
    loadGame();
    
    // Button event handlers
    addPlayerButton.addEventListener('click', addPlayer);
    startGameButton.addEventListener('click', startGame);
    backToHomeButton.addEventListener('click', () => {
        window.location.href = '/';
    });
    showAnswerButton.addEventListener('click', showAnswer);
    nobodyButton.addEventListener('click', () => {
        updateScore(-currentClue.value);
        continueGame();
    });
    continueButton.addEventListener('click', continueGame);
    
    // Add default players
    addPlayer();
    addPlayer();
    
    // Load game data from the server
    async function loadGame() {
        try {
            const response = await fetch(`/api/games/${gameId}`);
            gameData = await response.json();
            
            if (!gameData || !gameData.title) {
                throw new Error('Invalid game data');
            }
            
            gameTitle.textContent = gameData.title;
        } catch (error) {
            console.error('Error loading game:', error);
            alert('Error loading game. Redirecting to home page.');
            window.location.href = '/';
        }
    }
    
    // Add a player input field
    function addPlayer() {
        const playerInput = document.createElement('div');
        playerInput.className = 'player-input';
        
        const playerName = document.createElement('input');
        playerName.type = 'text';
        playerName.className = 'player-name';
        playerName.placeholder = `Player ${playersContainer.children.length + 1} Name`;
        playerName.required = true;
        
        playerInput.appendChild(playerName);
        playersContainer.appendChild(playerInput);
    }
    
    // Start the game
    function startGame() {
        // Validate player names
        const playerInputs = document.querySelectorAll('.player-name');
        players = [];
        
        for (const input of playerInputs) {
            const name = input.value.trim();
            if (!name) {
                alert('All player names are required.');
                return;
            }
            
            players.push({
                name,
                score: 0
            });
        }
        
        if (players.length === 0) {
            alert('At least one player is required.');
            return;
        }
        
        // Hide setup screen, show game board
        setupScreen.style.display = 'none';
        gameBoard.style.display = 'block';
        
        // Build the game board
        buildGameBoard();
        updateScoreboard();
    }
    
    // Build the game board
    function buildGameBoard() {
        // Clear existing content
        categoriesRow.innerHTML = '';
        boardGrid.innerHTML = '';
        
        // Add categories
        for (const category of gameData.categories) {
            // Add category header
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            
            // Create a more styled title element
            const titleElement = document.createElement('div');
            titleElement.className = 'category-title';
            titleElement.textContent = category.title.toUpperCase();
            
            categoryHeader.appendChild(titleElement);
            categoriesRow.appendChild(categoryHeader);
        }
        
        // Determine values (assuming all categories have the same values)
        const values = [200, 400, 600, 800, 1000];
        
        // Create board grid
        for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
            const value = values[valueIndex];
            
            for (let categoryIndex = 0; categoryIndex < gameData.categories.length; categoryIndex++) {
                const category = gameData.categories[categoryIndex];
                const clue = category.clues.find(c => parseInt(c.value) === value);
                
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                
                if (clue) {
                    if (clue.status === 'used') {
                        cell.classList.add('used');
                    } else {
                        cell.textContent = value;
                        cell.addEventListener('click', () => {
                            selectClue(categoryIndex, clue);
                        });
                    }
                } else {
                    cell.classList.add('used');
                }
                
                boardGrid.appendChild(cell);
            }
        }
    }
    
    // Select a clue to play
    function selectClue(categoryIndex, clue) {
        // Update the clue status to used
        clue.status = 'used';
        
        // Get category title
        const categoryTitle = gameData.categories[categoryIndex].title;
        
        // Store current clue
        currentClue = {
            categoryIndex,
            categoryTitle,
            ...clue
        };
        
        // Show clue display
        const categoryDisplay = document.createElement('div');
        categoryDisplay.className = 'clue-category';
        categoryDisplay.textContent = categoryTitle.toUpperCase();
        
        clueText.innerHTML = '';
        clueText.appendChild(categoryDisplay);
        
        const answerElement = document.createElement('div');
        answerElement.className = 'clue-answer';
        answerElement.textContent = clue.answer;
        clueText.appendChild(answerElement);
        
        clueDisplay.style.display = 'flex';
        gameBoard.style.display = 'none';
        
        // Start timer
        timerElement.textContent = 30;
        timer = 30;
        timerInterval = setInterval(() => {
            timer--;
            timerElement.textContent = timer;
            
            if (timer <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                showAnswer();
            }
        }, 1000);
    }
    
    // Show the answer
    function showAnswer() {
        // Clear timer
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // Show answer display
        clueDisplay.style.display = 'none';
        answerDisplay.style.display = 'flex';
        answerText.textContent = currentClue.question;
        
        // Create player buttons
        playerButtons.innerHTML = '';
        players.forEach((player, index) => {
            const button = document.createElement('button');
            button.className = 'btn';
            button.textContent = player.name;
            button.addEventListener('click', () => {
                // Award points to the correct player
                updateScore(currentClue.value, index);
                continueGame();
            });
            
            playerButtons.appendChild(button);
        });
    }
    
    // Update player score
    function updateScore(points, playerIndex = currentPlayer) {
        players[playerIndex].score += parseInt(points);
        updateScoreboard();
    }
    
    // Continue game after answering
    function continueGame() {
        // Hide answer display
        answerDisplay.style.display = 'none';
        gameBoard.style.display = 'block';
        
        // Update board
        buildGameBoard();
        
        // Move to next player
        currentPlayer = (currentPlayer + 1) % players.length;
        updateScoreboard();
        
        // Check if all clues are used
        const allUsed = gameData.categories.every(category => {
            return category.clues.every(clue => clue.status === 'used');
        });
        
        if (allUsed) {
            // Game over
            setTimeout(() => {
                alert('Game Over! ' + getWinnerMessage());
                window.location.href = '/';
            }, 500);
        }
    }
    
    // Get winner message
    function getWinnerMessage() {
        let maxScore = -Infinity;
        let winners = [];
        
        for (const player of players) {
            if (player.score > maxScore) {
                maxScore = player.score;
                winners = [player.name];
            } else if (player.score === maxScore) {
                winners.push(player.name);
            }
        }
        
        if (winners.length === 1) {
            return `${winners[0]} wins with $${maxScore}!`;
        } else {
            return `It's a tie between ${winners.join(' and ')} with $${maxScore}!`;
        }
    }
    
    // Update the scoreboard
    function updateScoreboard() {
        scoreboard.innerHTML = '';
        
        players.forEach((player, index) => {
            const playerScore = document.createElement('div');
            playerScore.className = 'player-score';
            
            if (index === currentPlayer) {
                playerScore.classList.add('current');
            }
            
            const playerName = document.createElement('div');
            playerName.className = 'player-name';
            playerName.textContent = player.name;
            
            const scoreValue = document.createElement('div');
            scoreValue.className = 'score-value';
            scoreValue.textContent = `$${player.score}`;
            
            playerScore.appendChild(playerName);
            playerScore.appendChild(scoreValue);
            
            scoreboard.appendChild(playerScore);
        });
    }
});
