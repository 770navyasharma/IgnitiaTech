# app/__init__.py
import os
from flask import Flask
from flask_login import LoginManager
from .models import db, User

def create_app():
    app = Flask(__name__)
    
    # --- Configurations ---
    app.config['SECRET_KEY'] = 'a-very-secret-key-that-you-should-change'
    basedir = os.path.abspath(os.path.dirname(__file__))
    
    # Correct path for the instance folder at the root level
    instance_path = os.path.join(basedir, '../instance')
    os.makedirs(instance_path, exist_ok=True)
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(instance_path, "site.db")}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Set the upload folder path relative to the app package
    app.config['UPLOAD_FOLDER'] = os.path.join(basedir, 'static/profile_pics')
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


    # --- Initialize Extensions ---
    db.init_app(app)
    login_manager = LoginManager(app)
    # Redirect to the login route within the 'main' blueprint
    login_manager.login_view = 'main.login' 
    login_manager.login_message_category = 'info'

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # --- Register Blueprints ---
    from .routes import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app