document.addEventListener('DOMContentLoaded', () => {
    const gameForm = document.getElementById('game-form');
    const addCategoryButton = document.getElementById('add-category');
    const categoriesContainer = document.getElementById('categories-container');
    
    // Initialize category counter
    let categoryCounter = 0;
    
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
            // First, create the game
            const gameTitle = document.getElementById('game-title').value;
            
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
            
            // Then, add categories and clues
            const gameId = gameData.id;
            const categories = document.querySelectorAll('.category');
            
            for (const category of categories) {
                const categoryTitle = category.querySelector('input[name^="categories"][name$="[title]"]').value;
                
                const categoryResponse = await fetch(`/api/games/${gameId}/categories`, {
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
                    
                    await fetch(`/api/games/${gameId}/categories/${categoryId}/clues`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ value, answer, question })
                    });
                }
            }
            
            // Redirect to the game page
            window.location.href = `/game/${gameId}`;
        } catch (error) {
            console.error('Error creating game:', error);
            alert('Error creating game. Please try again later.');
        }
    });
    
    // Add first category by default
    addCategory();
    
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
    function addClue(categoryElement, categoryId) {
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
