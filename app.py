from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime
from models import db, Game, Category, Clue, Player, GameInstance
from sqlalchemy.exc import SQLAlchemyError
from flask_migrate import Migrate

app = Flask(__name__)

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///jeopardy.db')
# Fix for PostgreSQL URI format if using Heroku
if app.config['SQLALCHEMY_DATABASE_URI'] and app.config['SQLALCHEMY_DATABASE_URI'].startswith('postgres://'):
    app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Add secret key for session management
app.secret_key = os.environ.get('SECRET_KEY', 'dev_key_for_graceful_jeopardy')

# Initialize database
db.init_app(app)

# Initialize Flask-Migrate
migrate = Migrate(app, db)

# Create database tables if they don't exist (for development)
with app.app_context():
    db.create_all()

# Ensure data directory exists (for backwards compatibility)
data_dir = os.path.join(os.path.dirname(__file__), 'data', 'games')
os.makedirs(data_dir, exist_ok=True)

# Routes
@app.route('/')
def index():
    # Test database connection
    db_status = {
        'connected': True,
        'game_count': 0,
        'error': None
    }
    
    try:
        # Try to query the database
        game_count = Game.query.count()
        db_status['game_count'] = game_count
    except Exception as e:
        db_status['connected'] = False
        db_status['error'] = str(e)
    
    return render_template('index.html', db_status=db_status)

@app.route('/creator')
def creator():
    return render_template('creator.html')

@app.route('/game/<game_id>')
def game(game_id):
    return render_template('game.html', game_id=game_id)

# API endpoints
@app.route('/api/games', methods=['GET'])
def list_games():
    try:
        games = Game.query.all()
        return jsonify([{
            'id': game.id,
            'title': game.title,
            'created': game.created.isoformat()
        } for game in games])
    except SQLAlchemyError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/games', methods=['POST'])
def create_game():
    data = request.get_json()
    if not data or 'title' not in data:
        return jsonify({'error': 'Title is required'}), 400
    
    try:
        new_game = Game(title=data['title'])
        db.session.add(new_game)
        db.session.commit()
        
        return jsonify({
            'id': new_game.id,
            'title': new_game.title,
            'created': new_game.created.isoformat()
        })
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/games/<game_id>', methods=['GET'])
def get_game(game_id):
    try:
        game = Game.query.get(game_id)
        if game is None:
            return jsonify({'error': 'Game not found'}), 404
        
        return jsonify(game.to_dict())
    except SQLAlchemyError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/games/<game_id>', methods=['PUT'])
def update_game(game_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        game = Game.query.get(game_id)
        if game is None:
            return jsonify({'error': 'Game not found'}), 404
        
        # Update title if provided
        if 'title' in data:
            game.title = data['title']
        
        game.updated = datetime.now()
        db.session.commit()
        
        return jsonify({'success': True, 'id': game_id})
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/games/<game_id>/categories', methods=['POST'])
def add_category(game_id):
    data = request.get_json()
    if not data or 'title' not in data:
        return jsonify({'error': 'Category title is required'}), 400
    
    try:
        game = Game.query.get(game_id)
        if game is None:
            return jsonify({'error': 'Game not found'}), 404
        
        # Get position for new category
        position = len(game.categories)
        
        # Create category
        category = Category(
            game_id=game.id,
            title=data['title'],
            position=position
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'id': str(category.id),
            'title': category.title
        })
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/games/<game_id>/categories/<category_id>/clues', methods=['POST'])
def add_clue(game_id, category_id):
    data = request.get_json()
    if not data or 'value' not in data or 'answer' not in data or 'question' not in data:
        return jsonify({'error': 'Value, answer, and question are required'}), 400
    
    try:
        # Find category
        category = Category.query.filter_by(id=category_id, game_id=game_id).first()
        if category is None:
            return jsonify({'error': 'Category not found'}), 404
        
        # Create clue
        clue = Clue(
            category_id=category.id,
            value=int(data['value']),
            answer=data['answer'],
            question=data['question'],
            status='unused'
        )
        
        db.session.add(clue)
        db.session.commit()
        
        return jsonify({
            'id': str(clue.id),
            'value': clue.value,
            'answer': clue.answer,
            'question': clue.question,
            'status': clue.status
        })
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/status', methods=['GET'])
def api_status():
    status = {
        'status': 'ok',
        'database': {
            'connected': True,
            'game_count': 0,
            'category_count': 0,
            'clue_count': 0,
        },
        'timestamp': datetime.now().isoformat()
    }
    
    try:
        # Try database queries
        status['database']['game_count'] = Game.query.count()
        status['database']['category_count'] = Category.query.count()
        status['database']['clue_count'] = Clue.query.count()
    except Exception as e:
        status['status'] = 'error'
        status['database']['connected'] = False
        status['error'] = str(e)
    
    return jsonify(status)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_DEBUG', 'True') == 'True')
