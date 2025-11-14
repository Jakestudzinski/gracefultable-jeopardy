from app import app, db
from models import Game, Category, Clue, Player, GameInstance

# This script initializes the database with tables
with app.app_context():
    # Create all tables
    db.create_all()
    print("Database tables created successfully!")
    
    # Check if we already have games
    game_count = Game.query.count()
    if game_count == 0:
        # Add a sample game
        sample_game = Game(title="Sample Jeopardy Game")
        db.session.add(sample_game)
        db.session.commit()
        
        # Add sample categories
        categories = [
            Category(game_id=sample_game.id, title="Science", position=0),
            Category(game_id=sample_game.id, title="History", position=1),
            Category(game_id=sample_game.id, title="Geography", position=2),
            Category(game_id=sample_game.id, title="Literature", position=3),
            Category(game_id=sample_game.id, title="Entertainment", position=4)
        ]
        db.session.add_all(categories)
        db.session.commit()
        
        # Add sample clues for each category
        clues = []
        
        # Science clues
        clues.extend([
            Clue(category_id=categories[0].id, value=200, answer="This planet is known as the Red Planet", question="What is Mars?", status="unused"),
            Clue(category_id=categories[0].id, value=400, answer="This element has the chemical symbol 'Au'", question="What is Gold?", status="unused"),
            Clue(category_id=categories[0].id, value=600, answer="This is the most abundant gas in Earth's atmosphere", question="What is Nitrogen?", status="unused"),
            Clue(category_id=categories[0].id, value=800, answer="This scientist developed the theory of relativity", question="Who is Albert Einstein?", status="unused"),
            Clue(category_id=categories[0].id, value=1000, answer="This particle has a negative charge", question="What is an electron?", status="unused")
        ])
        
        # History clues
        clues.extend([
            Clue(category_id=categories[1].id, value=200, answer="This document begins with 'We the People'", question="What is the Constitution?", status="unused"),
            Clue(category_id=categories[1].id, value=400, answer="This war lasted from 1939 to 1945", question="What is World War II?", status="unused"),
            Clue(category_id=categories[1].id, value=600, answer="This empire had Moctezuma II as its ruler", question="What is the Aztec Empire?", status="unused"),
            Clue(category_id=categories[1].id, value=800, answer="This queen ruled England for 63 years", question="Who is Queen Victoria?", status="unused"),
            Clue(category_id=categories[1].id, value=1000, answer="The Battle of Hastings took place in this year", question="What is 1066?", status="unused")
        ])
        
        # Geography clues
        clues.extend([
            Clue(category_id=categories[2].id, value=200, answer="This is the largest ocean on Earth", question="What is the Pacific Ocean?", status="unused"),
            Clue(category_id=categories[2].id, value=400, answer="This country is known as the Land of the Rising Sun", question="What is Japan?", status="unused"),
            Clue(category_id=categories[2].id, value=600, answer="The Sahara Desert is located on this continent", question="What is Africa?", status="unused"),
            Clue(category_id=categories[2].id, value=800, answer="This mountain is the tallest in the world", question="What is Mount Everest?", status="unused"),
            Clue(category_id=categories[2].id, value=1000, answer="This South American river is the largest by volume", question="What is the Amazon River?", status="unused")
        ])
        
        # Literature clues
        clues.extend([
            Clue(category_id=categories[3].id, value=200, answer="This author wrote 'Romeo and Juliet'", question="Who is William Shakespeare?", status="unused"),
            Clue(category_id=categories[3].id, value=400, answer="This novel by Harper Lee features Atticus Finch", question="What is To Kill a Mockingbird?", status="unused"),
            Clue(category_id=categories[3].id, value=600, answer="This Greek poet wrote 'The Iliad'", question="Who is Homer?", status="unused"),
            Clue(category_id=categories[3].id, value=800, answer="This novel begins with 'Call me Ishmael'", question="What is Moby Dick?", status="unused"),
            Clue(category_id=categories[3].id, value=1000, answer="This Russian wrote 'War and Peace'", question="Who is Leo Tolstoy?", status="unused")
        ])
        
        # Entertainment clues
        clues.extend([
            Clue(category_id=categories[4].id, value=200, answer="This animated movie features a lion named Simba", question="What is The Lion King?", status="unused"),
            Clue(category_id=categories[4].id, value=400, answer="This band performed 'Hey Jude'", question="Who are The Beatles?", status="unused"),
            Clue(category_id=categories[4].id, value=600, answer="This TV show features the character Walter White", question="What is Breaking Bad?", status="unused"),
            Clue(category_id=categories[4].id, value=800, answer="This actor starred in 'The Godfather'", question="Who is Marlon Brando?", status="unused"),
            Clue(category_id=categories[4].id, value=1000, answer="This director made 'E.T.' and 'Jurassic Park'", question="Who is Steven Spielberg?", status="unused")
        ])
        
        db.session.add_all(clues)
        db.session.commit()
        
        print(f"Added sample game with {len(categories)} categories and {len(clues)} clues.")
    else:
        print(f"Database already contains {game_count} games.")
        
    print("Database initialization complete!")
