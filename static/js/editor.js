document.addEventListener('DOMContentLoaded', () => {
    const gameForm = document.getElementById('game-form');
    const addCategoryButton = document.getElementById('add-category');
    const categoriesContainer = document.getElementById('categories-container');
    const pageTitle = document.querySelector('h1');
    
    // Get game ID from URL if in edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game_id') || window.location.pathname.split('/').pop();
    const isEditMode = window.location.pathname.includes('/edit/');
    
    // Initialize category counter
    let categoryCounter = 0;
    
    // If in edit mode, load the existing game data
    if (isEditMode && gameId) {
        pageTitle.textContent = 'Edit Jeopardy Game';
        loadGameForEditing(gameId);
    } else {
        // Add first category by default for new games
        addCategory();
    }
    
    // Add category button click handler
    addCategoryButton.addEventListener('click', () => {
        addCategory();
    });
    
    // Use event delegation for dynamically added buttons
    document.addEventListener('click', (e) => {
        // Handle Add Clue button clicks
        if (e.target && e.target.classList.contains('add-clue')) {
            const categoryElement = e.target.closest('.category');
            const categoryId = categoryElement.dataset.id;
            addClue(categoryElement, categoryId);
        }
        
        // Handle Remove Category button clicks
        if (e.target && e.target.classList.contains('remove-category')) {
            e.target.closest('.category').remove();
        }
        
        // Handle Remove Clue button clicks
        if (e.target && e.target.classList.contains('remove-clue')) {
            e.target.closest('.clue').remove();
        }
    });
    
    // Form submit handler
    gameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate the form
        if (!validateForm()) {
            alert('Please fill in all required fields and ensure each category has at least one clue.');
            return;
        }
        
        try {
            // Get the game title
            const gameTitle = document.getElementById('game-title').value;
            let resultGameId;
            
            if (isEditMode) {
                // Update the game title
                await fetch(`/api/games/${gameId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ title: gameTitle })
                });
                
                resultGameId = gameId;
                
                // First delete all existing categories and clues
                const existingCategories = await fetch(`/api/games/${gameId}/categories`).then(res => res.json());
                
                for (const category of existingCategories) {
                    await fetch(`/api/games/${gameId}/categories/${category.id}`, {
                        method: 'DELETE'
                    });
                }
            } else {
                // Create a new game
                const gameResponse = await fetch('/api/games', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ title: gameTitle })
                });
                
                const gameData = await gameResponse.json();
                
                if (!gameData.id) {
                    throw new Error('Failed to create game');
                }
                
                resultGameId = gameData.id;
            }
            
            // Add categories and clues
            const categories = document.querySelectorAll('.category');
            
            for (const category of categories) {
                const categoryTitle = category.querySelector('input[name^="categories"][name$="[title]"]').value;
                
                const categoryResponse = await fetch(`/api/games/${resultGameId}/categories`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ title: categoryTitle })
                });
                
                const categoryData = await categoryResponse.json();
                
                if (!categoryData.id) {
                    throw new Error('Failed to create category');
                }
                
                const categoryId = categoryData.id;
                const clues = category.querySelectorAll('.clue');
                
                for (const clue of clues) {
                    const value = clue.querySelector('select[name^="categories"][name*="[clues]"][name$="[value]"]').value;
                    const answer = clue.querySelector('textarea[name^="categories"][name*="[clues]"][name$="[answer]"]').value;
                    const question = clue.querySelector('textarea[name^="categories"][name*="[clues]"][name$="[question]"]').value;
                    
                    await fetch(`/api/games/${resultGameId}/categories/${categoryId}/clues`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ value, answer, question })
                    });
                }
            }
            
            // Show success message and redirect
            alert(isEditMode ? 'Game updated successfully!' : 'Game created successfully!');
            window.location.href = '/';
            
        } catch (error) {
            console.error('Error saving game:', error);
            alert('Error saving game. Please try again later.');
        }
    });
    
    // Function to load existing game data for editing
    async function loadGameForEditing(gameId) {
        try {
            // Get game data
            const gameResponse = await fetch(`/api/games/${gameId}`);
            const gameData = await gameResponse.json();
            
            // Set title
            document.getElementById('game-title').value = gameData.title;
            
            // Get categories
            const categoriesResponse = await fetch(`/api/games/${gameId}/categories`);
            const categoriesData = await categoriesResponse.json();
            
            // Clear default categories
            categoriesContainer.innerHTML = '';
            
            // Load each category and its clues
            for (const categoryData of categoriesData) {
                const categoryId = categoryCounter++;
                
                // Create category element
                const categoryElement = document.createElement('div');
                categoryElement.className = 'category';
                categoryElement.dataset.id = categoryId;
                categoryElement.dataset.dbId = categoryData.id; // Store the actual DB ID
                
                // Create category title input
                const titleGroup = document.createElement('div');
                titleGroup.className = 'form-group';
                
                const titleLabel = document.createElement('label');
                titleLabel.setAttribute('for', `category-title-${categoryId}`);
                titleLabel.textContent = 'Category Title';
                
                const titleInput = document.createElement('input');
                titleInput.type = 'text';
                titleInput.id = `category-title-${categoryId}`;
                titleInput.name = `categories[${categoryId}][title]`;
                titleInput.value = categoryData.title;
                titleInput.required = true;
                
                const removeButton = document.createElement('button');
                removeButton.type = 'button';
                removeButton.className = 'btn small danger remove-category';
                removeButton.textContent = 'Remove';
                
                titleGroup.appendChild(titleLabel);
                titleGroup.appendChild(titleInput);
                titleGroup.appendChild(removeButton);
                
                // Create clues container
                const cluesTitle = document.createElement('h3');
                cluesTitle.textContent = 'Clues';
                
                const cluesContainer = document.createElement('div');
                cluesContainer.className = 'clues-container';
                
                // Add clue button
                const addClueButton = document.createElement('button');
                addClueButton.type = 'button';
                addClueButton.className = 'btn small add-clue';
                addClueButton.textContent = 'Add Clue';
                
                categoryElement.appendChild(titleGroup);
                categoryElement.appendChild(cluesTitle);
                categoryElement.appendChild(cluesContainer);
                categoryElement.appendChild(addClueButton);
                
                categoriesContainer.appendChild(categoryElement);
                
                // Get and add clues
                try {
                    const cluesResponse = await fetch(`/api/games/${gameId}/categories/${categoryData.id}/clues`);
                    
                    if (!cluesResponse.ok) {
                        console.warn(`Failed to load clues for category ${categoryData.id}:`, await cluesResponse.text());
                        // Add an empty clue as fallback
                        addClue(categoryElement, categoryId);
                        continue;
                    }
                    
                    const cluesData = await cluesResponse.json();
                    
                    // Check if cluesData is an array
                    if (!Array.isArray(cluesData)) {
                        console.warn('Clues data is not an array:', cluesData);
                        // Add an empty clue as fallback
                        addClue(categoryElement, categoryId);
                        continue;
                    }
                    
                    if (cluesData.length === 0) {
                        // Add at least one empty clue if none exist
                        addClue(categoryElement, categoryId);
                    } else {
                        // Add each clue
                        cluesData.forEach((clueData, clueIndex) => {
                            addClue(categoryElement, categoryId, clueData);
                        });
                    }
                } catch (error) {
                    console.error(`Error loading clues for category ${categoryData.id}:`, error);
                    // Add an empty clue as fallback
                    addClue(categoryElement, categoryId);
                }
            }
            
            // If no categories, add one
            if (categoriesData.length === 0) {
                addCategory();
            }
            
        } catch (error) {
            console.error('Error loading game for editing:', error);
            alert('Error loading game data. Please try again later.');
            
            // Redirect to home if there's an error
            window.location.href = '/';
        }
    }
    
    // Function to add a new category
    function addCategory() {
        const categoryId = categoryCounter++;
        
        // Clone category template and replace placeholders
        const categoryTemplate = document.getElementById('category-template').innerHTML;
        const categoryHTML = categoryTemplate.replace(/{id}/g, categoryId);
        
        // Create category element
        const categoryElement = document.createElement('div');
        categoryElement.innerHTML = categoryHTML;
        categoryElement.querySelector('.category').dataset.id = categoryId;
        
        // Add to container
        categoriesContainer.appendChild(categoryElement.querySelector('.category'));
        
        // Add first clue by default
        addClue(categoryElement.querySelector('.category'), categoryId);
    }
    
    // Function to add a new clue to a category
    function addClue(categoryElement, categoryId, clueData = null) {
        const cluesContainer = categoryElement.querySelector('.clues-container');
        const clueId = cluesContainer.children.length;
        
        // Clone clue template and replace placeholders
        const clueTemplate = document.getElementById('clue-template').innerHTML;
        const clueHTML = clueTemplate
            .replace(/{categoryId}/g, categoryId)
            .replace(/{clueId}/g, clueId);
        
        // Create clue element
        const clueElement = document.createElement('div');
        clueElement.innerHTML = clueHTML;
        
        // If clue data provided, fill in the form
        if (clueData) {
            const valueSelect = clueElement.querySelector('select[name^="categories"][name*="[clues]"][name$="[value]"]');
            const answerText = clueElement.querySelector('textarea[name^="categories"][name*="[clues]"][name$="[answer]"]');
            const questionText = clueElement.querySelector('textarea[name^="categories"][name*="[clues]"][name$="[question]"]');
            
            // Set values
            valueSelect.value = clueData.value;
            answerText.value = clueData.answer;
            questionText.value = clueData.question;
            
            // Store the clue ID in a data attribute
            clueElement.querySelector('.clue').dataset.dbId = clueData.id;
        }
        
        // Add to container
        cluesContainer.appendChild(clueElement.querySelector('.clue'));
    }
    
    // Function to validate the form
    function validateForm() {
        // Check if game title is filled
        if (!document.getElementById('game-title').value.trim()) {
            return false;
        }
        
        // Check if there's at least one category
        const categories = document.querySelectorAll('.category');
        if (categories.length === 0) {
            return false;
        }
        
        // Check each category
        for (const category of categories) {
            // Check if category title is filled
            const categoryTitle = category.querySelector('input[name^="categories"][name$="[title]"]').value;
            if (!categoryTitle.trim()) {
                return false;
            }
            
            // Check if category has at least one clue
            const clues = category.querySelectorAll('.clue');
            if (clues.length === 0) {
                return false;
            }
            
            // Check each clue
            for (const clue of clues) {
                const answer = clue.querySelector('textarea[name^="categories"][name*="[clues]"][name$="[answer]"]').value;
                const question = clue.querySelector('textarea[name^="categories"][name*="[clues]"][name$="[question]"]').value;
                
                if (!answer.trim() || !question.trim()) {
                    return false;
                }
            }
        }
        
        return true;
    }
});
