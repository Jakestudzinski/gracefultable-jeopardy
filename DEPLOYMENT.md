# Deploying GracefulTable Jeopardy

This guide provides instructions for deploying the GracefulTable Jeopardy application to different hosting platforms.

## Prerequisites

- Python 3.9+ installed
- Git installed
- Account on the platform you plan to deploy to (Heroku, Render, Netlify, Vercel, etc.)

## Option 1: Deploy to Heroku

### 1. Create a Heroku account and install the CLI

If you haven't already, sign up for a Heroku account at [heroku.com](https://heroku.com) and install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli).

### 2. Login to Heroku

```bash
heroku login
```

### 3. Create a new Heroku app

```bash
heroku create gracefultable-jeopardy
```

### 4. Add a PostgreSQL database

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

### 5. Deploy the application

```bash
git init
git add .
git commit -m "Initial commit for deployment"
git push heroku main
```

### 6. Run database migrations

```bash
heroku run flask db upgrade
```

### 7. Initialize the database with sample data (optional)

```bash
heroku run python init_db.py
```

### 8. Open the application

```bash
heroku open
```

## Option 2: Deploy to Render

### 1. Create a Render account

Sign up for a Render account at [render.com](https://render.com).

### 2. Create a new Web Service

- Click "New +" and select "Web Service"
- Connect your GitHub repository or upload your code
- Configure the service:
  - Name: gracefultable-jeopardy
  - Environment: Python
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `gunicorn wsgi:app`

### 3. Add environment variables

Add the following environment variables in your Render dashboard:
- `FLASK_APP=app.py`
- `FLASK_DEBUG=False`
- `SECRET_KEY=your_secret_key_here`

### 4. Create a PostgreSQL database

- Create a PostgreSQL database in your Render dashboard
- Add the database URL as an environment variable:
  - `DATABASE_URL=your_database_url_here`

### 5. Initialize the database

- Open a shell in the Render dashboard
- Run: `flask db upgrade`
- Run: `python init_db.py`

## Option 3: Local Production Setup with Nginx/Apache

### 1. Install required packages

```bash
pip install -r requirements.txt
```

### 2. Set up environment variables

Create a `.env` file with the following variables:
```
FLASK_APP=app.py
FLASK_DEBUG=False
SECRET_KEY=your_production_secret_key
DATABASE_URL=your_database_url
```

### 3. Set up the database

```bash
flask db upgrade
python init_db.py
```

### 4. Run with Gunicorn

```bash
gunicorn wsgi:app
```

### 5. Set up Nginx or Apache as a reverse proxy

Example Nginx configuration:
```
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

- **Database connection issues**: Verify your DATABASE_URL environment variable is correct.
- **Missing dependencies**: Make sure all dependencies in requirements.txt are installed.
- **Application errors**: Check the logs using `heroku logs` or the equivalent on your platform.

## Post-Deployment Steps

1. Create a real game through the application interface
2. Test the game creation, editing, and gameplay functionality
3. Add SSL certificate for production use
