#!/usr/bin/env python3
"""
MRC Authentication System - Database Initialization Script
Creates the database and adds the hardcoded initial user for Phase 1
"""

from app import create_app, db
from app.models import User
import os

def init_database():
    """Initialize the database and create the hardcoded user"""
    app = create_app()
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print("Database tables created successfully!")
        
        # Check if initial user already exists
        existing_user = User.query.filter_by(email='michaelyoussef396@gmail.com').first()
        
        if existing_user:
            print("Initial user already exists!")
            print(f"Username: {existing_user.username}")
            print(f"Email: {existing_user.email}")
            print(f"Full Name: {existing_user.full_name}")
            return
        
        # Create the hardcoded initial user as specified in PRD
        initial_user = User(
            username='michael',
            email='michaelyoussef396@gmail.com',
            full_name='Michael Rodriguez',
            phone='+61 400 123 458'
        )
        initial_user.set_password('AdminMike123!')
        
        db.session.add(initial_user)
        db.session.commit()
        
        print("Initial user created successfully!")
        print("Login credentials:")
        print("  Username: michael")
        print("  Email: michaelyoussef396@gmail.com")
        print("  Password: AdminMike123!")
        print("  Full Name: Michael Rodriguez")
        print("  Phone: +61 400 123 458")

if __name__ == '__main__':
    init_database()