# app/routes.py
import os
import secrets
from PIL import Image
from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, abort
from flask_login import current_user, login_user, logout_user, login_required
from .models import db, User, Investigation, Report, ThreadFeedItem
from .forms import SignUpForm, LoginForm, UpdateProfileForm, NewInvestigationForm, EditInvestigationForm
from collections import defaultdict

main = Blueprint('main', __name__)

# --- Context Processor ---
@main.app_context_processor
def inject_forms():
    return dict(
        new_investigation_form=NewInvestigationForm(),
        edit_investigation_form=EditInvestigationForm()
    )

# --- Helper Function for Saving Picture ---
def save_picture(form_picture):
    random_hex = secrets.token_hex(8)
    _, f_ext = os.path.splitext(form_picture.filename)
    picture_fn = random_hex + f_ext
    upload_path = os.path.join(current_app.root_path, 'static/profile_pics')
    picture_path = os.path.join(upload_path, picture_fn)
    output_size = (150, 150)
    i = Image.open(form_picture)
    i.thumbnail(output_size)
    i.save(picture_path)
    return picture_fn
    
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

# --- Dashboard & Page Routes ---
@main.route('/')
@login_required
def home():
    active_investigations = Investigation.query.filter_by(author=current_user).order_by(Investigation.timestamp.desc()).limit(4).all()
    total_investigations_count = Investigation.query.filter_by(author=current_user).count()
    recent_reports = Report.query.filter_by(author=current_user).limit(4).all()
    thread_feed = ThreadFeedItem.query.order_by(ThreadFeedItem.timestamp.desc()).limit(5).all()
    return render_template('home.html', 
                           active_page='home',
                           investigations=active_investigations,
                           total_investigations_count=total_investigations_count,
                           reports=recent_reports,
                           feed_items=thread_feed)

@main.route('/investigations')
@login_required
def investigations():
    all_investigations = Investigation.query.filter_by(author=current_user).order_by(Investigation.timestamp.desc()).all()
    grouped_investigations = defaultdict(list)
    for inv in all_investigations:
        date_key = inv.timestamp.date()
        grouped_investigations[date_key].append(inv)
    return render_template('investigations.html', 
                           active_page='investigations',
                           grouped_investigations=grouped_investigations)

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
        current_user.role = form.role.data
        current_user.organization = form.organization.data
        current_user.website_url = form.website_url.data
        current_user.bio = form.bio.data
        db.session.commit()
        flash('Your profile has been updated!', 'success')
        return redirect(url_for('main.profile'))
        
    elif request.method == 'GET':
        form.username.data = current_user.username
        form.email.data = current_user.email
        form.first_name.data = current_user.first_name
        form.last_name.data = current_user.last_name
        form.role.data = current_user.role
        form.organization.data = current_user.organization
        form.website_url.data = current_user.website_url
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

# --- Create Investigation Route ---
@main.route('/investigation/new', methods=['POST'])
@login_required
def new_investigation():
    form = NewInvestigationForm()
    if form.validate_on_submit():
        investigation = Investigation(
            title=form.title.data,
            location=form.location.data,
            drone_type=form.drone_type.data,
            description=form.description.data,
            author=current_user
        )
        if form.drone_photo.data:
            photo_file = save_picture(form.drone_photo.data) 
            investigation.drone_photo = photo_file
        
        db.session.add(investigation)
        db.session.commit()
        flash('Investigation Established Successfully! Status is now LIVE.', 'success')
    else:
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"Error in {getattr(form, field).label.text}: {error}", 'danger')
    return redirect(url_for('main.home'))



@main.route('/investigation/<int:investigation_id>/delete', methods=['POST'])
@login_required
def delete_investigation(investigation_id):
    inv = Investigation.query.get_or_404(investigation_id)
    if inv.author != current_user:
        abort(403) # Forbidden
    db.session.delete(inv)
    db.session.commit()
    flash('Investigation has been deleted.', 'success')
    return redirect(url_for('main.investigations'))


# =============================================
# START OF UPDATED ROUTE
# =============================================
@main.route('/investigation/<int:investigation_id>/update_status', methods=['POST'])
@login_required
def update_status(investigation_id):
    inv = Investigation.query.get_or_404(investigation_id)
    if inv.author != current_user:
        abort(403)
    
    # This is an extra check we get from the JS to know if we should redirect
    should_go_live = request.form.get('go_live')

    new_status = request.form.get('new_status')
    if new_status:
        inv.status = new_status
        db.session.commit()
        flash(f'Investigation status updated to {new_status}.', 'success')
    
    # If the action was 'Start' or 'Continue', the JS will send 'go_live'.
    # This tells our backend to redirect to the live page.
    if should_go_live:
         return redirect(url_for('main.live_investigation', investigation_id=inv.id))

    # For any other status change (Pause, Complete), go back to the main list.
    return redirect(url_for('main.investigations'))
# =============================================
# END OF UPDATED ROUTE
# =============================================




@main.route('/investigation/<int:investigation_id>/edit', methods=['POST'])
@login_required
def edit_investigation(investigation_id):
    inv = Investigation.query.get_or_404(investigation_id)
    if inv.author != current_user:
        abort(403)
    
    form = EditInvestigationForm() # Use the new edit form
    if form.validate_on_submit():
        inv.title = form.title.data
        inv.location = form.location.data
        inv.description = form.description.data
        if form.drone_photo.data:
            photo_file = save_picture(form.drone_photo.data)
            inv.drone_photo = photo_file
        db.session.commit()
        flash('Investigation details have been updated!', 'success')
    else:
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"Error in {getattr(form, field).label.text}: {error}", 'danger')
                
    return redirect(url_for('main.investigations'))


@main.route('/investigation/<int:investigation_id>/live')
@login_required
def live_investigation(investigation_id):
    inv = Investigation.query.get_or_404(investigation_id)
    if inv.author != current_user: abort(403)
    
    # When entering the live page, ensure the status is 'Live'
    if inv.status != 'Live':
        inv.status = 'Live'
        db.session.commit()

    return render_template('live_investigation.html', investigation=inv)

