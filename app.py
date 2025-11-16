from flask import Flask, render_template, request, jsonify, redirect, url_for
import json
import os
from datetime import datetime
from models import db, Game, Category, Clue, Player, GameInstance
from sqlalchemy.exc import SQLAlchemyError
from flask_migrate import Migrate
from flask_cors import CORS
from remote_answers import init_socketio, generate_qr_code, create_game_session, register_guest, get_join_link, get_guest_qr_code, broadcast_clue, broadcast_answer_reveal, broadcast_game_over, get_guest_responses, get_guest_scores

app = Flask(__name__)
CORS(app)

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

# Initialize SocketIO
init_socketio(app)

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

@app.route('/edit/<game_id>')
def edit_game_route(game_id):
    return render_template('creator.html', edit_mode=True, game_id=game_id)

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
        
        return jsonify(game.to_dict())
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/games/<game_id>', methods=['DELETE'])
def delete_game(game_id):
    try:
        game = Game.query.get(game_id)
        if game is None:
            return jsonify({'error': 'Game not found'}), 404
        
        # Delete associated categories and clues
        for category in game.categories:
            for clue in category.clues:
                db.session.delete(clue)
            db.session.delete(category)
        
        # Delete the game
        db.session.delete(game)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Game deleted successfully', 'id': game_id})
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

@app.route('/api/games/<game_id>/categories', methods=['GET'])
def get_categories(game_id):
    try:
        game = Game.query.get(game_id)
        if game is None:
            return jsonify({'error': 'Game not found'}), 404
        
        categories = [{
            'id': category.id,
            'title': category.title
        } for category in game.categories]
        
        return jsonify(categories)
    except SQLAlchemyError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/games/<game_id>/categories/<category_id>', methods=['DELETE'])
def delete_category(game_id, category_id):
    try:
        category = Category.query.get(category_id)
        
        if category is None:
            return jsonify({'error': 'Category not found'}), 404
            
        if str(category.game_id) != game_id:
            return jsonify({'error': 'Category does not belong to the specified game'}), 403
        
        # Delete all clues in the category
        for clue in category.clues:
            db.session.delete(clue)
            
        # Delete the category
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Category deleted successfully'})
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/games/<game_id>/categories/<category_id>/clues', methods=['GET'])
def get_clues(game_id, category_id):
    try:
        category = Category.query.filter_by(id=category_id, game_id=game_id).first()
        if category is None:
            return jsonify({'error': 'Category not found'}), 404
        
        clues = [{
            'id': clue.id,
            'value': clue.value,
            'answer': clue.answer,
            'question': clue.question,
            'status': clue.status
        } for clue in category.clues]
        
        return jsonify(clues)
    except SQLAlchemyError as e:
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

# Remote answer routes
@app.route('/join/<session_id>')
def join_game(session_id):
    # Check if name is provided
    guest_name = request.args.get('name')
    
    # If no name provided, show the join form first
    if not guest_name:
        print(f"No guest name provided, showing join form for session: {session_id}")
        return render_template('mobile_join.html', session_id=session_id)
    
    print(f"Guest name provided: {guest_name}")
    
    # Special case for test session
    if session_id == 'test123':
        print(f"Creating test session for guest: {guest_name}")
        # Create a temporary test session
        session_id = create_game_session('test', 'web')
        guest_info = {
            'guest_id': f'guest-{int(datetime.now().timestamp())}',
            'session_id': session_id,
            'name': guest_name
        }
    else:
        # Register the guest with a real session
        print(f"Registering guest '{guest_name}' for session: {session_id}")
        guest_info = register_guest(session_id, guest_name)
    
    if not guest_info:
        # Provide a more helpful error page with error message
        print(f"Failed to register guest - session {session_id} not found")
        return render_template('mobile_join.html', 
                              session_id=session_id, 
                              error="Game session not found or has ended. Please try again.")
    
    # Get additional parameters
    show_clue = request.args.get('showClue', 'false').lower() == 'true'
    
    print(f"Rendering mobile template with showClue={show_clue}")
    
    # Render the mobile answer template
    return render_template('mobile_answer.html',
                          session_id=session_id,
                          guest_id=guest_info['guest_id'],
                          guest_name=guest_name,
                          show_clue=show_clue)

@app.route('/api/remote/<game_id>/create', methods=['POST'])
def create_remote_session(game_id):
    # Create a new remote session
    host_sid = request.args.get('host_sid', 'web')
    session_id = create_game_session(game_id, host_sid)
    
    # Generate QR code for the session
    guest_name = request.args.get('guest_name', 'Guest')
    qr_code = get_guest_qr_code(session_id, guest_name, request.host)
    join_link = get_join_link(session_id, guest_name, request.host)
    
    return jsonify({
        'session_id': session_id,
        'qr_code': qr_code,
        'join_link': join_link
    })

@app.route('/api/remote/<session_id>/responses', methods=['GET'])
def get_responses(session_id):
    # Get all guest responses for the current clue
    responses = get_guest_responses(session_id)
    return jsonify(responses)

@app.route('/api/remote/<session_id>/scores', methods=['GET'])
def get_scores(session_id):
    # Get all guest scores for the session
    scores = get_guest_scores(session_id)
    return jsonify(scores)

@app.route('/api/remote/<session_id>/broadcast', methods=['POST'])
def broadcast_to_guests(session_id):
    data = request.get_json()
    
    action = data.get('action')
    
    if action == 'clue':
        # Broadcast a clue to all guests
        result = broadcast_clue(
            session_id,
            data.get('category', ''),
            data.get('clue', ''),
            data.get('answer', ''),
            data.get('value', 0),
            data.get('timeLimit', 30)
        )
    elif action == 'reveal':
        # Broadcast the answer reveal
        result = broadcast_answer_reveal(
            session_id,
            data.get('correctResponses', [])
        )
    elif action == 'game_over':
        # Broadcast game over
        result = broadcast_game_over(
            session_id,
            data.get('winnerMessage', 'Game Over!')
        )
    else:
        return jsonify({'error': 'Invalid action'}), 400
    
    return jsonify({'success': result})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    from remote_answers import socketio
    socketio.run(app, host='0.0.0.0', port=port, debug=os.environ.get('FLASK_DEBUG', 'True') == 'True')
