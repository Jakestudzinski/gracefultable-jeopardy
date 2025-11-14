# GracefulTable Jeopardy

A web application for creating and playing custom Jeopardy-style games with SQLAlchemy database integration.

## Features

- Create custom Jeopardy games with categories and clues
- Play games with a Jeopardy-style interface
- Track scores for multiple players
- Save and load game templates
- Database persistence with SQLAlchemy
- Database migration support

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Initialize the database:
   ```
   flask db init     # Only needed first time
   flask db migrate  # Create migration
   flask db upgrade  # Apply migration
   python init_db.py # (Optional) Add sample data
   ```

3. Run the application:
   ```
   python app.py
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Database Structure

- **Game**: Main game entity with title and metadata
- **Category**: Categories belonging to a game
- **Clue**: Individual clues within a category
- **GameInstance**: Represents a played game session
- **Player**: Player information and scores

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Usage

### Creating a Game

1. Click "Create New Game" on the homepage
2. Enter game title
3. Add categories and clues
4. Save your game

### Playing a Game

1. Select a game from the list on the homepage
2. Add player names
3. Click "Start Game"
4. Select clues from the board to play
