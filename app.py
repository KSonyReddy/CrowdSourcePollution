from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime
import pytz
from models import Assignment
from models import PollutionReport
from collections import defaultdict
import json
app = Flask(__name__)
app.secret_key = 'your_secret_key'

# Database setup
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'instance', 'user.db')
app.config['SQLALCHEMY_BINDS'] = {
    'pollution': 'sqlite:///' + os.path.join(basedir, 'instance', 'pollution.db')
}
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'  # Specify the login route

# Function to get current time in IST
def get_ist_time():
    ist = pytz.timezone('Asia/Kolkata')
    return datetime.now(ist)

# Function to convert UTC time to IST for display
def convert_to_ist(timestamp):
    if timestamp is None:
        return None
    
    # If the timestamp is already timezone-aware, convert it to IST
    if timestamp.tzinfo is not None:
        ist = pytz.timezone('Asia/Kolkata')
        return timestamp.astimezone(ist)
    
    # If the timestamp is naive (no timezone), assume it's in UTC and convert to IST
    utc = pytz.UTC
    ist = pytz.timezone('Asia/Kolkata')
    return utc.localize(timestamp).astimezone(ist)

# Add the helper function to the Jinja environment
@app.template_filter('ist_time')
def ist_time_filter(timestamp):
    return convert_to_ist(timestamp)

# Add a custom filter for date formatting
@app.template_filter('format_date')
def format_date_filter(timestamp, format='%Y-%m-%d %H:%M IST'):
    if timestamp is None:
        return ""
    ist_timestamp = convert_to_ist(timestamp)
    return ist_timestamp.strftime(format)

# Add a custom filter for datetime formatting
@app.template_filter('format_datetime')
def format_datetime(value):
    if value is None:
        return ""
    if isinstance(value, str):
        try:
            value = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            return value
    return value.strftime('%Y-%m-%d %H:%M:%S')

# Add date filter
@app.template_filter('format_date')
def format_date(value):
    if value is None:
        return ""
    if isinstance(value, str):
        try:
            value = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            return value
    return value.strftime('%Y-%m-%d %H:%M')

# Models
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, unique=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    constituency = db.Column(db.String(100), nullable=True)  # For users to be assigned to team heads
    locality = db.Column(db.String(100), nullable=True)  # Added for locality
    
    def get_id(self):
        return str(self.id)
    
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    @property
    def is_teamhead(self):
        return self.role == 'teamhead'
    
    @property
    def is_user(self):
        return self.role == 'user'

# User loader function for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class PollutionReport(db.Model):
    _bind_key_ = 'pollution'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    pollution_type = db.Column(db.String(100), nullable=False)
    severity = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=get_ist_time)
    
    # Add relationship with User model
    user = db.relationship('User', backref=db.backref('reports', lazy=True))

class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject = db.Column(db.String(200))
    content = db.Column(db.Text, nullable=False)
    is_notification = db.Column(db.Boolean, default=False)
    is_read = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=get_ist_time)
    
    # Add relationships with User model
    sender = db.relationship('User', foreign_keys=[sender_id], backref=db.backref('sent_messages', lazy=True))
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref=db.backref('received_messages', lazy=True))

class Reward(db.Model):
    __tablename__ = 'rewards'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    teamhead_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=get_ist_time)
    
    # Add relationships with User model
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('received_rewards', lazy=True))
    teamhead = db.relationship('User', foreign_keys=[teamhead_id], backref=db.backref('given_rewards', lazy=True))

with app.app_context():
    db.create_all()

# Routes
@app.route('/')
def home():
    return redirect(url_for('login'))

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        role = request.form['role']

        # Validate password confirmation
        if password != confirm_password:
            return render_template('signup.html', error="Passwords do not match")

        # Check if username or email already exists
        existing_user = User.query.filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            if existing_user.username == username:
                return render_template('signup.html', error="Username already exists")
            else:
                return render_template('signup.html', error="Email already exists")

        # Create new user
        try:
            hashed_password = generate_password_hash(password)
            user = User(
                username=username,
                email=email,
                password=hashed_password,
                role=role
            )
            db.session.add(user)
            db.session.commit()
            flash("Account created successfully! Please login.")
            return redirect(url_for('login'))
        except Exception as e:
            db.session.rollback()
            return render_template('signup.html', error="An error occurred. Please try again.")
            
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        with app.app_context():
            user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password, password):
            # Use Flask-Login to log in the user
            login_user(user)
            
            # Store user role in session for backward compatibility
            session['user_id'] = user.id
            session['role'] = user.role
            
            print(f"Logged in user ID: {session.get('user_id')}")
            print(f"Logged in user role (session): {session.get('role')}")
            print(f"User object role from database: '{user.role}'")

            if user.role == 'admin':
                print("Checking for 'admin' - True")
                return redirect(url_for('admin_dashboard'))
            else:
                print("Checking for 'admin' - False")

            if user.role == 'teamhead':
                print("Checking for 'teamhead' - True")
                return redirect(url_for('teamhead_dashboard'))
            else:
                print("Checking for 'teamhead' - False")

            if user.role == 'user':
                print("Checking for 'user' - True")
                return redirect(url_for('user_dashboard'))
            else:
                print("Checking for 'user' - False")
        else:
            return "Invalid credentials"
    return render_template('login.html')
@app.route('/logout')
@login_required
def logout():
    # Clear the session
    logout_user()
    session.clear()
    return redirect(url_for('telangana_map'))

@app.route('/telangana_map')
def telangana_map():
    # Default pollution data from 2025 census
    default_pollution_data = {
        'Hyderabad': {
            'pollution_types': {
                'Air': {'level': 'HIGH', 'value': '85 AQI'},
                'Land': {'level': 'HIGH', 'value': '40 %'},
                'Light': {'level': 'LOW', 'value': '10 lux'},
                'Noise': {'level': 'HIGH', 'value': '70 dB'},
                'Water': {'level': 'HIGH', 'value': '50 mg/L'}
            },
            'overall': 'HIGH',
            'reports': 0
        },
        # Add similar data for other districts...
    }

    # Get all reports ordered by timestamp
    reports = PollutionReport.query.order_by(PollutionReport.timestamp.desc()).all()
    district_data = default_pollution_data.copy()

    # Update district data with user reports
    for report in reports:
        try:
            district = report.location.strip()
            
            # Initialize district if not in default data
            if district not in district_data:
                district_data[district] = {
                    'pollution_types': {
                        'Air': {'level': 'LOW', 'value': '0'},
                        'Land': {'level': 'LOW', 'value': '0'},
                        'Light': {'level': 'LOW', 'value': '0'},
                        'Noise': {'level': 'LOW', 'value': '0'},
                        'Water': {'level': 'LOW', 'value': '0'}
                    },
                    'overall': 'LOW',
                    'reports': 0
                }

            # Update pollution type data
            pollution_type = report.pollution_type
            if pollution_type in district_data[district]['pollution_types']:
                type_data = district_data[district]['pollution_types'][pollution_type]
                
                # Update severity if higher
                if report.severity == 'HIGH':
                    type_data['level'] = 'HIGH'
                elif report.severity == 'MODERATE' and type_data['level'] == 'LOW':
                    type_data['level'] = 'MODERATE'

            # Update overall district severity
            severity_levels = [data['level'] for data in district_data[district]['pollution_types'].values()]
            if 'HIGH' in severity_levels:
                district_data[district]['overall'] = 'HIGH'
            elif 'MODERATE' in severity_levels:
                district_data[district]['overall'] = 'MODERATE'
            else:
                district_data[district]['overall'] = 'LOW'

            # Increment report count
            district_data[district]['reports'] += 1

        except Exception as e:
            print(f"Error processing report: {str(e)}")
            continue

    return render_template("telangana_map.html", pollution_data=district_data)

@app.route('/user_dashboard', methods=['GET', 'POST'])
@login_required
def user_dashboard():
    # Check if the user has the correct role
    if not current_user.is_user:
        flash("You don't have permission to access this page.")
        return redirect(url_for('login'))
    
    with app.app_context():
        user = current_user
        
        if request.method == 'POST':
            try:
                # Get form data
                location = request.form.get('location')
                pollution_type = request.form.get('pollution_type')
                severity = request.form.get('severity')
                description = request.form.get('description')

                # Validate required fields
                if not all([location, pollution_type, severity, description]):
                    return jsonify({
                        'success': False,
                        'error': 'All fields are required'
                    }), 400

                # Create new report
                report = PollutionReport(
                    user_id=user.id,
                    location=location,
                    pollution_type=pollution_type,
                    severity=severity,
                    description=description
                )
                
                # Add to database
                db.session.add(report)
                db.session.commit()

                return jsonify({
                    'success': True,
                    'message': 'Report submitted successfully'
                })

            except Exception as e:
                db.session.rollback()
                print(f"Error submitting report: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': str(e)
                }), 500

        # Get user's reports
        user_reports = PollutionReport.query.filter_by(user_id=user.id).order_by(PollutionReport.timestamp.desc()).all()
        user_reports_count = len(user_reports)

        # Get unread messages count
        unread_messages_count = Message.query.filter_by(
            receiver_id=user.id,
            is_read=False
        ).count()

        # Get unread notifications count
        unread_notifications_count = Message.query.filter_by(
            receiver_id=user.id,
            is_read=False,
            is_notification=True
        ).count()

        # Get all notifications
        notifications = Message.query.filter_by(
            receiver_id=user.id,
            is_notification=True
        ).order_by(Message.timestamp.desc()).all()

        # Get all messages (both sent and received)
        messages = Message.query.filter(
            (Message.sender_id == user.id) | (Message.receiver_id == user.id),
            Message.is_notification == False
        ).order_by(Message.timestamp.desc()).all()

        # Get admin and teamhead users for the message form
        recipients = User.query.filter(
            User.role.in_(['admin', 'teamhead'])
        ).all()

        return render_template('user_dashboard.html',
                             user=user,
                             user_reports=user_reports,
                             user_reports_count=user_reports_count,
                             unread_messages_count=unread_messages_count,
                             unread_notifications_count=unread_notifications_count,
                             notifications=notifications,
                             messages=messages,
                             recipients=recipients)

@app.route('/send_message', methods=['POST'])
@login_required
def send_message():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        recipient_id = data.get('recipient')
        subject = data.get('subject')
        content = data.get('content')
        
        if not all([recipient_id, subject, content]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Handle special case for admin recipient
        if recipient_id == 'admin':
            # Find an admin user
            admin_user = User.query.filter_by(role='admin').first()
            if admin_user:
                recipient_id = admin_user.id
            else:
                return jsonify({'error': 'No admin user found'}), 404
        
        # Convert recipient_id to integer if it's a string
        try:
            recipient_id = int(recipient_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid recipient ID'}), 400
            
        recipient = User.query.get(recipient_id)
        if not recipient:
            return jsonify({'error': 'Recipient not found'}), 404
            
        message = Message(
            sender_id=current_user.id,
            receiver_id=recipient_id,
            subject=subject,
            content=content
        )
        
        db.session.add(message)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Message sent successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error sending message: {str(e)}")  # Add logging for debugging
        return jsonify({'error': str(e)}), 500

@app.route('/add_volunteer', methods=['POST'])
@login_required
def add_volunteer():
    if not current_user.is_teamhead:
        return jsonify({'success': False, 'error': 'Unauthorized'})
    
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    constituency = data.get('constituency')
    
    if not all([username, email, password]):
        return jsonify({'success': False, 'error': 'Missing required fields'})
    
    try:
        new_volunteer = User(
            username=username,
            email=email,
            role='user',  # Changed from 'volunteer' to 'user' to match your model
            constituency=constituency or current_user.constituency,
            locality=current_user.locality
        )
        new_volunteer.set_password(password)
        db.session.add(new_volunteer)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/give_award', methods=['POST'])
@login_required
def give_award():
    if not current_user.is_teamhead:
        return jsonify({'success': False, 'error': 'Unauthorized'})
    
    volunteer_id = request.form.get('volunteer_id')
    award_type = request.form.get('award_type')
    description = request.form.get('description')
    
    if not all([volunteer_id, award_type]):
        return jsonify({'success': False, 'error': 'Missing required fields'})
    
    try:
        new_award = Reward(
            user_id=volunteer_id,
            teamhead_id=current_user.id,
            reason=description
        )
        db.session.add(new_award)
        db.session.commit()
        
        # Also send a notification to the user
        notification = Message(
            sender_id=current_user.id,
            receiver_id=volunteer_id,
            content=f"You have been awarded for: {description}",
            is_notification=True
        )
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/update_profile', methods=['POST'])
@login_required
def update_profile():
    if not current_user.is_teamhead:
        return jsonify({'success': False, 'error': 'Unauthorized'})
    
    email = request.form.get('email')
    phone = request.form.get('phone')
    
    try:
        current_user.email = email
        current_user.phone = phone
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/set_locality', methods=['POST'])
@login_required
def set_locality():
    if not current_user.is_teamhead:
        return jsonify({'success': False, 'error': 'Unauthorized'})
    
    locality = request.form.get('locality')
    
    if not locality:
        return jsonify({'success': False, 'error': 'Missing locality'})
    
    try:
        current_user.locality = locality
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/mark_message_read/<int:message_id>', methods=['POST'])
@login_required
def mark_message_read(message_id):
    try:
        print(f"Marking message {message_id} as read for user {current_user.id}")
        message = Message.query.get_or_404(message_id)
        
        # Check if the current user is the recipient
        if message.receiver_id != current_user.id:
            print(f"User {current_user.id} is not the recipient of message {message_id}")
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Mark the message as read
        message.is_read = True
        db.session.commit()
        
        print(f"Message {message_id} marked as read")
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error marking message as read: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/get_report/<int:report_id>')
@login_required
def get_report(report_id):
    try:
        report = PollutionReport.query.get_or_404(report_id)
        user = User.query.get(report.user_id)
        
        # Check if the user has permission to view this report
        if not current_user.is_admin and not current_user.is_teamhead:
            if report.user_id != current_user.id:
                return jsonify({'success': False, 'error': 'Unauthorized'})
        
        return jsonify({
            'success': True,
            'id': report.id,
            'title': report.title,
            'description': report.description,
            'location': report.location,
            'pollution_type': report.pollution_type,
            'severity': report.severity,
            'timestamp': report.timestamp.strftime('%Y-%m-%d %H:%M'),
            'username': user.username
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/get_volunteer/<int:volunteer_id>')
@login_required
def get_volunteer(volunteer_id):
    try:
        volunteer = User.query.get_or_404(volunteer_id)
        
        # Check if the user has permission to view this volunteer
        if not current_user.is_admin and not current_user.is_teamhead:
            return jsonify({'success': False, 'error': 'Unauthorized'})
        
        # Get volunteer's reports count
        reports_count = PollutionReport.query.filter_by(user_id=volunteer.id).count()
        
        # Get volunteer's awards count
        awards_count = Reward.query.filter_by(user_id=volunteer.id).count()
        
        return jsonify({
            'success': True,
            'id': volunteer.id,
            'username': volunteer.username,
            'email': volunteer.email,
            'constituency': volunteer.constituency,
            'locality': volunteer.locality,
            'reports_count': reports_count,
            'awards_count': awards_count
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/get_profile')
@login_required
def get_profile():
    try:
        return jsonify({
            'success': True,
            'username': current_user.username,
            'email': current_user.email,
            'role': current_user.role,
            'constituency': current_user.constituency,
            'locality': current_user.locality
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/assign_volunteer', methods=['POST'])
@login_required
def assign_volunteer():
    if not current_user.is_teamhead:
        return jsonify({'success': False, 'error': 'Unauthorized'})
    
    data = request.get_json()
    report_id = data.get('report_id')
    volunteer_id = data.get('volunteer_id')
    notes = data.get('notes')
    
    if not all([report_id, volunteer_id]):
        return jsonify({'success': False, 'error': 'Missing required fields'})
    
    try:
        report = PollutionReport.query.get_or_404(report_id)
        volunteer = User.query.get_or_404(volunteer_id)
        
        # Check if the volunteer is in the team head's constituency
        if volunteer.constituency != current_user.constituency:
            return jsonify({'success': False, 'error': 'Volunteer is not in your constituency'})
        
        # Create assignment
        assignment = Assignment(
            report_id=report_id,
            volunteer_id=volunteer_id,
            teamhead_id=current_user.id,
            notes=notes,
            status='pending'
        )
        db.session.add(assignment)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/admin_dashboard')
@login_required
def admin_dashboard():
    # Check if the user has the correct role
    if not current_user.is_admin:
        flash("You don't have permission to access this page.")
        return redirect(url_for('login'))
    
    with app.app_context():
        admin_user = current_user
        
        # Get user counts
        total_users = User.query.filter(User.role == 'user').count()
        total_teamheads = User.query.filter(User.role == 'teamhead').count()
        total_reports = PollutionReport.query.count()
        
        # Get recent reports with user information
        recent_reports = db.session.query(PollutionReport, User).join(
            User, PollutionReport.user_id == User.id
        ).order_by(PollutionReport.timestamp.desc()).limit(5).all()
        
        # Prepare chart data
        severity_counts = db.session.query(
            PollutionReport.severity,
            db.func.count(PollutionReport.id)
        ).group_by(PollutionReport.severity).all()
        
        type_counts = db.session.query(
            PollutionReport.pollution_type,
            db.func.count(PollutionReport.id)
        ).group_by(PollutionReport.pollution_type).all()
        
        severity_labels = [count[0] for count in severity_counts]
        severity_data = [count[1] for count in severity_counts]
        
        type_labels = [count[0] for count in type_counts]
        type_data = [count[1] for count in type_counts]
        
        # Get unread messages count for the admin
        unread_messages_count = Message.query.filter_by(
            receiver_id=admin_user.id,
            is_read=False
        ).count()
        
        return render_template('admin_dashboard.html',
                             admin_user=admin_user,
                             total_users=total_users,
                             total_teamheads=total_teamheads,
                             total_reports=total_reports,
                             recent_reports=recent_reports,
                             severity_labels=severity_labels,
                             severity_data=severity_data,
                             type_labels=type_labels,
                             type_data=type_data,
                             unread_messages_count=unread_messages_count)

@app.route('/admin_users')
def admin_users():
    if 'role' not in session or session['role'] != 'admin':
        return redirect(url_for('login'))

    with app.app_context():
        # Get the current admin user
        admin_user = User.query.get(session['user_id'])
        # Get all users except admins
        users = User.query.filter(User.role != 'admin').all()
        return render_template('admin_users.html', users=users, admin_user=admin_user)

@app.route('/admin_reports')
def admin_reports():
    if 'role' not in session or session['role'] != 'admin':
        return redirect(url_for('login'))

    with app.app_context():
        # Get the current admin user
        admin_user = User.query.get(session['user_id'])
        # Get all reports with user information
        reports = db.session.query(PollutionReport, User).join(
            User, PollutionReport.user_id == User.id
        ).order_by(PollutionReport.timestamp.desc()).all()
        return render_template('admin_reports.html', reports=reports, admin_user=admin_user)

@app.route('/teamhead_dashboard')
@login_required
def teamhead_dashboard():
    # Check if the user has the correct role
    if not current_user.is_teamhead:
        flash("You don't have permission to access this page.")
        return redirect(url_for('login'))
    
    with app.app_context():
        # Get the current team head
        teamhead = current_user
        
        # Get all reports from users in the team head's constituency
        reports = db.session.query(PollutionReport, User).join(
            User, PollutionReport.user_id == User.id
        ).filter(User.constituency == teamhead.constituency).order_by(PollutionReport.timestamp.desc()).all()
        
        # Get received messages for the team head
        received_messages = db.session.query(Message, User).join(
            User, Message.sender_id == User.id
        ).filter(Message.receiver_id == teamhead.id).order_by(Message.timestamp.desc()).all()
        
        # Get sent messages for the team head
        sent_messages = db.session.query(Message, User).join(
            User, Message.receiver_id == User.id
        ).filter(Message.sender_id == teamhead.id).order_by(Message.timestamp.desc()).all()
        
        # Get unread messages count
        unread_messages_count = Message.query.filter_by(
            receiver_id=teamhead.id,
            is_read=False
        ).count()
        
        # Get unread messages
        unread_messages = db.session.query(Message, User).join(
            User, Message.sender_id == User.id
        ).filter(
            Message.receiver_id == teamhead.id,
            Message.is_read == False
        ).order_by(Message.timestamp.desc()).all()
        
        # Get volunteers (users) in the team head's constituency
        volunteers = User.query.filter_by(
            role='user',
            constituency=teamhead.constituency
        ).all()
        
        # Get all users for the message form (including admins)
        users = User.query.all()
        
        # Get volunteer activity (reports count)
        volunteer_activity = {}
        for volunteer in volunteers:
            volunteer_activity[volunteer.id] = PollutionReport.query.filter_by(user_id=volunteer.id).count()
        
        # Get total reports count
        total_reports = len(reports)
        
        # Get active volunteers count (those who have submitted reports)
        active_volunteers = sum(1 for activity in volunteer_activity.values() if activity > 0)
        
        # Get critical reports count
        critical_reports = sum(1 for report, _ in reports if report.severity == 'Critical')
        
        # Get awards given count
        rewards = Reward.query.filter_by(teamhead_id=teamhead.id).all()
        awards_given = len(rewards)
        
        # Prepare chart data for pollution types
        pollution_type_counts = db.session.query(
            PollutionReport.pollution_type,
            db.func.count(PollutionReport.id)
        ).filter(
            PollutionReport.user_id.in_([v.id for v in volunteers])
        ).group_by(PollutionReport.pollution_type).all()
        
        pollution_type_data = {
            'labels': [count[0] for count in pollution_type_counts],
            'data': [count[1] for count in pollution_type_counts]
        }
        
        # Prepare chart data for severity levels
        severity_counts = db.session.query(
            PollutionReport.severity,
            db.func.count(PollutionReport.id)
        ).filter(
            PollutionReport.user_id.in_([v.id for v in volunteers])
        ).group_by(PollutionReport.severity).all()
        
        severity_data = {
            'labels': [count[0] for count in severity_counts],
            'data': [count[1] for count in severity_counts]
        }
        
        return render_template('teamhead_dashboard.html', 
                             teamhead=teamhead,
                             reports=reports,
                             received_messages=received_messages,
                             sent_messages=sent_messages,
                             unread_messages=unread_messages,
                             unread_messages_count=unread_messages_count,
                             volunteers=volunteers,
                             users=users,
                             volunteer_activity=volunteer_activity,
                             rewards=rewards,
                             pollution_type_data=pollution_type_data,
                             severity_data=severity_data,
                             total_reports=total_reports,
                             active_volunteers=active_volunteers,
                             critical_reports=critical_reports,
                             awards_given=awards_given,
                             pollution_data=json.dumps(pollution_type_data))

@app.route('/send_reply', methods=['POST'])
def send_reply():
    if 'role' not in session or session['role'] != 'teamhead':
        return redirect(url_for('login'))

    sender_id = request.form.get('sender')
    reply = request.form.get('reply')

    if sender_id and reply:
        with app.app_context():
            new_message = Message(
                sender_id=session['user_id'],
                receiver_id=sender_id,
                content=reply,
                is_notification=False
            )
            db.session.add(new_message)
            db.session.commit()
        flash("Reply sent successfully!")

    return redirect(url_for('teamhead_dashboard'))

@app.route('/admin_profile')
def admin_profile():
    if 'role' not in session or session['role'] != 'admin':
        return redirect(url_for('login'))

    with app.app_context():
        admin_user = User.query.get(session['user_id'])
        return render_template('admin_dashboard.html', users=[admin_user] if admin_user else [])

@app.route('/award_volunteer', methods=['POST'])
def award_volunteer():
    if 'role' not in session or session['role'] != 'teamhead':
        return redirect(url_for('login'))

    user_id = request.form.get('user_id')
    reason = request.form.get('reason')

    if user_id and reason:
        with app.app_context():
            new_reward = Reward(
                user_id=user_id,
                teamhead_id=session['user_id'],
                reason=reason
            )
            db.session.add(new_reward)
            db.session.commit()
            
            # Also send a notification to the user
            notification = Message(
                sender_id=session['user_id'],
                receiver_id=user_id,
                content=f"You have been awarded for: {reason}",
                is_notification=True
            )
            db.session.add(notification)
            db.session.commit()
            
        flash("Volunteer awarded successfully!")

    return redirect(url_for('teamhead_dashboard'))

@app.route('/verify_constituency')
def verify_constituency():
    try:
        # Try to query the constituency column
        user = User.query.first()
        if user:
            # If we can access the constituency attribute without error, the column exists
            constituency_value = user.constituency
            return f"Constituency column exists! Value for first user: {constituency_value}"
        else:
            return "No users found in the database."
    except Exception as e:
        return f"Error: {str(e)}"

@app.route('/set_teamhead_locality', methods=['POST'])
@login_required
def set_teamhead_locality():
    if not current_user.is_teamhead:
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    data = request.get_json()
    locality = data.get('locality')
    
    if not locality:
        return jsonify({'success': False, 'message': 'Locality is required'})
    
    try:
        current_user.locality = locality
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})

# Add a context processor to make unread_messages globally available
@app.context_processor
def inject_unread_messages():
    def get_unread_messages():
        if current_user.is_authenticated:
            return Message.query.filter_by(
                receiver_id=current_user.id,
                is_read=False
            ).order_by(Message.timestamp.desc()).all()
        return []
    
    def get_unread_messages_count():
        if current_user.is_authenticated:
            return Message.query.filter_by(
                receiver_id=current_user.id,
                is_read=False
            ).count()
        return 0
    
    return dict(
        unread_messages=get_unread_messages(),
        unread_messages_count=get_unread_messages_count()
    )

@app.route('/admin/messages')
@login_required
def admin_messages():
    if not current_user.is_admin:
        flash('Permission denied.', 'error')
        return redirect(url_for('login'))
    
    # Get all messages for the admin
    messages = Message.query.filter(
        (Message.receiver_id == current_user.id) |
        (Message.sender_id == current_user.id)
    ).order_by(Message.timestamp.desc()).all()
    
    # Get unread messages count
    unread_messages_count = Message.query.filter_by(
        receiver_id=current_user.id,
        is_read=False
    ).count()
    
    # Get all team heads and users for the recipient dropdown
    teamheads = User.query.filter_by(role='teamhead').all()
    users = User.query.filter_by(role='user').all()
    
    return render_template('admin_messages.html',
                         admin_user=current_user,
                         messages=messages,
                         unread_messages_count=unread_messages_count,
                         teamheads=teamheads,
                         users=users)

@app.route('/get_message/<int:message_id>')
@login_required
def get_message(message_id):
    try:
        print(f"Getting message ID: {message_id} for user ID: {current_user.id}")
        message = Message.query.get_or_404(message_id)
        
        # Check if the current user is either the sender or receiver
        if message.sender_id != current_user.id and message.receiver_id != current_user.id:
            print(f"User {current_user.id} is not authorized to view message {message_id}")
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Determine if the current user is the sender
        is_sender = message.sender_id == current_user.id
        
        # Format message for JSON response
        formatted_message = {
            'id': message.id,
            'subject': message.subject,
            'content': message.content,
            'sender_id': message.sender_id,
            'sender_username': message.sender.username,
            'sender_role': message.sender.role,
            'receiver_id': message.receiver_id,
            'receiver_username': message.receiver.username,
            'receiver_role': message.receiver.role,
            'timestamp': message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'is_read': message.is_read,
            'is_sender': is_sender
        }
        
        print(f"Returning message: {formatted_message['id']} - {formatted_message['subject']}")
        return jsonify({
            'success': True,
            'data': formatted_message
        })
    except Exception as e:
        print(f"Error getting message: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/get_recipients')
@login_required
def get_recipients():
    if not current_user.is_teamhead:
        return jsonify({'error': 'Unauthorized'}), 403
        
    try:
        # Get all volunteers in the team head's constituency
        volunteers = User.query.filter_by(
            role='volunteer',
            constituency=current_user.constituency
        ).all()
        
        return jsonify({
            'volunteers': [{'id': v.id, 'username': v.username} for v in volunteers]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_messages')
@login_required
def get_messages():
    try:
        print(f"Getting messages for user ID: {current_user.id}")
        # Get all messages for the current user (both sent and received)
        messages = Message.query.filter(
            (Message.sender_id == current_user.id) | 
            (Message.receiver_id == current_user.id),
            Message.is_notification == False
        ).order_by(Message.timestamp.desc()).all()
        
        print(f"Found {len(messages)} messages")
        
        # Format messages for JSON response
        formatted_messages = []
        for message in messages:
            formatted_message = {
                'id': message.id,
                'subject': message.subject,
                'content': message.content,
                'sender_id': message.sender_id,
                'sender_username': message.sender.username,
                'sender_role': message.sender.role,
                'receiver_id': message.receiver_id,
                'receiver_username': message.receiver.username,
                'receiver_role': message.receiver.role,
                'timestamp': message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'is_read': message.is_read
            }
            formatted_messages.append(formatted_message)
            print(f"Formatted message: {formatted_message['id']} - {formatted_message['subject']}")
        
        response_data = {
            'success': True,
            'messages': formatted_messages
        }
        
        print(f"Returning {len(formatted_messages)} messages")
        return jsonify(response_data)
    except Exception as e:
        print(f"Error getting messages: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/map')
def map_view():
    from models import PollutionReport  # adjust if needed
    reports = PollutionReport.query.all()
    reports_data = [
        {
            "location": r.location,
            "pollution_type": r.pollution_type,
            "severity": r.severity,
            "description": r.description
        } for r in reports
    ]
    return render_template("map.html", reports=reports_data)

def get_district_pollution_data():
    # Get all pollution reports from the database
    reports = PollutionReport.query.all()
    
    # Initialize district data structure
    district_data = {}
    
    # Process each report to count reports by district
    for report in reports:
        # Extract district from location (assuming location format is "City, District")
        location_parts = report.location.split(',')
        if len(location_parts) > 1:
            district = location_parts[1].strip()
        else:
            district = location_parts[0].strip()
        
        # Initialize district if not exists
        if district not in district_data:
            district_data[district] = {
                'severity': 'low',  # Default severity
                'pollution_types': {
                    'Air': {'severity': 'low', 'value': 0, 'unit': 'AQI'},
                    'Water': {'severity': 'low', 'value': 0, 'unit': 'mg/L'},
                    'Noise': {'severity': 'low', 'value': 0, 'unit': 'dB'},
                    'Land': {'severity': 'low', 'value': 0, 'unit': '%'},
                    'Light': {'severity': 'low', 'value': 0, 'unit': 'lux'}
                },
                'reports': 0
            }
        
        # Increment report count
        district_data[district]['reports'] += 1
        
        # Update pollution type data
        if report.pollution_type in district_data[district]['pollution_types']:
            # Update severity if higher
            current_severity = district_data[district]['pollution_types'][report.pollution_type]['severity']
            report_severity = report.severity.lower()
            
            if (report_severity == 'high' and current_severity != 'high') or \
               (report_severity == 'moderate' and current_severity == 'low'):
                district_data[district]['pollution_types'][report.pollution_type]['severity'] = report_severity
            
            # Update value (assuming some numeric value is stored)
            # This is a placeholder - you would need to extract actual values from reports
            district_data[district]['pollution_types'][report.pollution_type]['value'] += 1
        
        # Update overall severity if higher
        if (report.severity.lower() == 'high' and district_data[district]['severity'] != 'high') or \
           (report.severity.lower() == 'moderate' and district_data[district]['severity'] == 'low'):
            district_data[district]['severity'] = report.severity.lower()
    
    # If no reports exist, return empty data
    if not district_data:
        # Return a message indicating no reports
        return {'message': 'No pollution reports available yet.'}
    
    return district_data

@app.route('/get_reports')
def get_reports():
    # Get all pollution reports for the map
    reports = PollutionReport.query.all()
    
    # Format reports for the map
    formatted_reports = []
    for report in reports:
        try:
            # Extract coordinates from location string
            location = report.location.strip()
            if '(' in location and ')' in location:
                # Extract location name and coordinates
                location_parts = location.split('(')
                location_name = location_parts[0].strip()
                coords_str = location_parts[1].strip(')').strip()
                
                # Parse coordinates
                coords = [float(coord.strip()) for coord in coords_str.split(',')]
                
                if len(coords) == 2:
                    formatted_report = {
                        'id': report.id,
                        'location': location_name,
                        'pollution_type': report.pollution_type,
                        'severity': report.severity,
                        'description': report.description,
                        'timestamp': report.timestamp.strftime('%Y-%m-%d %H:%M'),
                        'user': {
                            'username': report.user.username
                        },
                        'latitude': coords[0],
                        'longitude': coords[1]
                    }
                    formatted_reports.append(formatted_report)
                    continue
            
            # If we get here, the location format was invalid
            print(f"Invalid location format for report {report.id}: {location}")
            
        except Exception as e:
            print(f"Error processing report {report.id}: {str(e)}")
            continue
    
    return jsonify({
        'success': True,
        'reports': formatted_reports
    })

@app.route('/get_district_data')
def get_district_data():
    try:
        district_data = get_district_pollution_data()
        return jsonify(district_data)
    except Exception as e:
        print(f"Error getting district data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports', methods=['POST'])
@login_required
def submit_report():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all([data.get('location'), data.get('pollution_type'), 
                   data.get('severity'), data.get('description')]):
            return jsonify({
                'success': False,
                'error': 'All fields are required'
            }), 400

        # Create new report with just the district name
        report = PollutionReport(
            user_id=current_user.id,
            location=data['location'].strip(),  # Just use the district name
            pollution_type=data['pollution_type'],
            severity=data['severity'],
            description=data['description']
        )
        
        # Add to database
        db.session.add(report)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Report submitted successfully',
            'report': {
                'id': report.id,
                'location': report.location,
                'pollution_type': report.pollution_type,
                'severity': report.severity,
                'description': report.description,
                'timestamp': report.timestamp.strftime('%Y-%m-%d %H:%M'),
                'user': {
                    'username': current_user.username
                }
            }
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error submitting report: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
