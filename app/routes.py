# app/routes.py
import os
import secrets
from PIL import Image
from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app
from flask_login import current_user, login_user, logout_user, login_required
from .models import db, User, Investigation, Report, ThreadFeedItem
from .forms import SignUpForm, LoginForm, UpdateProfileForm

main = Blueprint('main', __name__)

# --- Helper Function for Saving Picture ---
def save_picture(form_picture):
    random_hex = secrets.token_hex(8)
    _, f_ext = os.path.splitext(form_picture.filename)
    picture_fn = random_hex + f_ext
    picture_path = os.path.join(current_app.config['UPLOAD_FOLDER'], picture_fn)

    output_size = (150, 150)
    i = Image.open(form_picture)
    i.thumbnail(output_size)
    i.save(picture_path)
    return picture_fn
    
# --- Function to create dummy data ---
def create_dummy_data_for_user(user):
    # Dummy Investigations
    inv1 = Investigation(title='DJI Mavic Investigation #202', status='Pending', drone_image='mavic.png', author=user)
    inv2 = Investigation(title='DJI Avata Investigation #202', status='Analysis', drone_image='avata.png', author=user)
    inv3 = Investigation(title='DJI Neo Investigation #2025', status='In Progress', drone_image='neo.png', author=user)
    inv4 = Investigation(title='DJI Inspire Investigation #30', status='Completed', drone_image='inspire.png', author=user)
    db.session.add_all([inv1, inv2, inv3, inv4])
    # Dummy Reports
    rep1 = Report(title='Forensic Analysis Report', file_type='pdf', author=user)
    rep2 = Report(title='Monthly Summary Report', file_type='doc', author=user)
    rep3 = Report(title='Incident Analysis Report', file_type='csv', author=user)
    db.session.add_all([rep1, rep2, rep3])
    # Dummy Thread Feed Items (global for all users for now)
    if ThreadFeedItem.query.count() == 0:
        feed1 = ThreadFeedItem(title='New Drone Detection in Restricted Area', icon='fa-satellite-dish')
        feed2 = ThreadFeedItem(title='Suspicious Flight Pattern Detected', icon='fa-exclamation-triangle')
        db.session.add_all([feed1, feed2])
    db.session.commit()


# --- Authentication Routes ---
@main.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('main.home'))
    form = SignUpForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        # Create dummy data for the new user
        create_dummy_data_for_user(user)
        flash('Your account has been created! You can now log in.', 'success')
        return redirect(url_for('main.login'))
    return render_template('signup.html', title='Sign Up', form=form)

@main.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.home'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember.data)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('main.home'))
        else:
            flash('Login Unsuccessful. Please check email and password.', 'danger')
    return render_template('login.html', title='Login', form=form)

@main.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.login'))


# --- Dashboard Routes ---
@main.route('/')
@login_required
def home():
    active_investigations = Investigation.query.filter_by(author=current_user).limit(4).all()
    recent_reports = Report.query.filter_by(author=current_user).limit(4).all()
    thread_feed = ThreadFeedItem.query.order_by(ThreadFeedItem.timestamp.desc()).limit(5).all()
    
    return render_template('home.html', 
                           active_page='home',
                           investigations=active_investigations,
                           reports=recent_reports,
                           feed_items=thread_feed)

@main.route('/analytics')
@login_required
def analytics():
    return render_template('analytics.html', active_page='analytics')

@main.route('/reports')
@login_required
def reports():
    return render_template('reports.html', active_page='reports')

@main.route('/settings')
@login_required
def settings():
    return render_template('settings.html', active_page='settings')

@main.route('/projects')
@login_required
def projects():
    return render_template('projects.html', active_page='projects')

@main.route('/messages')
@login_required
def messages():
    return render_template('messages.html', active_page='messages')

# --- Profile Routes ---
@main.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    form = UpdateProfileForm()
    if form.validate_on_submit():
        if form.picture.data:
            picture_file = save_picture(form.picture.data)
            current_user.profile_pic_url = picture_file
        
        current_user.username = form.username.data
        current_user.email = form.email.data
        current_user.first_name = form.first_name.data
        current_user.last_name = form.last_name.data
        # Update with new profile fields if you added them to the form
        # current_user.role = form.role.data 
        # current_user.organization = form.organization.data
        current_user.bio = form.bio.data
        db.session.commit()
        flash('Your profile has been updated!', 'success')
        return redirect(url_for('main.profile'))
        
    elif request.method == 'GET':
        form.username.data = current_user.username
        form.email.data = current_user.email
        form.first_name.data = current_user.first_name
        form.last_name.data = current_user.last_name
        form.bio.data = current_user.bio
    
    if current_user.profile_pic_url == 'default-profile-pic.png':
        image_file = url_for('static', filename='images/' + current_user.profile_pic_url)
    else:
        image_file = url_for('static', filename='profile_pics/' + current_user.profile_pic_url)
        
    return render_template('profile.html', title='Profile', active_page='profile', form=form, image_file=image_file)

@main.route('/profile/delete', methods=['POST'])
@login_required
def delete_account():
    db.session.delete(current_user)
    db.session.commit()
    logout_user()
    flash('Your account has been permanently deleted.', 'info')
    return redirect(url_for('main.login'))