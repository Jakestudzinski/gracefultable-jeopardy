from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class Game(db.Model):
    __tablename__ = 'games'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    created = db.Column(db.DateTime, default=datetime.now)
    updated = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    categories = db.relationship('Category', backref='game', cascade='all, delete-orphan')
    game_instances = db.relationship('GameInstance', backref='game')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'created': self.created.isoformat(),
            'updated': self.updated.isoformat() if self.updated else None,
            'categories': [category.to_dict() for category in self.categories]
        }

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    position = db.Column(db.Integer, default=0)
    
    # Relationships
    clues = db.relationship('Clue', backref='category', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'title': self.title,
            'position': self.position,
            'clues': [clue.to_dict() for clue in self.clues]
        }

class Clue(db.Model):
    __tablename__ = 'clues'
    
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    value = db.Column(db.Integer, nullable=False)
    answer = db.Column(db.Text, nullable=False)
    question = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='unused')
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'value': self.value,
            'answer': self.answer,
            'question': self.question,
            'status': self.status
        }

class Player(db.Model):
    __tablename__ = 'players'
    
    id = db.Column(db.Integer, primary_key=True)
    game_instance_id = db.Column(db.Integer, db.ForeignKey('game_instances.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    score = db.Column(db.Integer, default=0)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'score': self.score
        }

class GameInstance(db.Model):
    __tablename__ = 'game_instances'
    
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    start_time = db.Column(db.DateTime, default=datetime.now)
    end_time = db.Column(db.DateTime)
    
    # Relationships
    players = db.relationship('Player', backref='game_instance', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'game_id': self.game_id,
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'players': [player.to_dict() for player in self.players]
        }
