from flask_migrate import Migrate
from app import app, db

# Setup Flask-Migrate
migrate = Migrate(app, db)

if __name__ == '__main__':
    # This script is used for migration commands
    print("Run Flask-Migrate commands like:")
    print("flask db init - Initialize migrations")
    print("flask db migrate - Create migration script")
    print("flask db upgrade - Apply migrations")
    print("flask db downgrade - Revert migrations")
