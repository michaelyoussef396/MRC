import os
from datetime import timedelta
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production-mrc'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'mrc_auth.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production-mrc'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)  # 8-hour access tokens
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)  # 30-day refresh tokens
    JWT_COOKIE_SECURE = os.environ.get('JWT_COOKIE_SECURE', 'False').lower() in ['true', 'on', '1']
    JWT_COOKIE_CSRF_PROTECT = False  # Simplified for development
    JWT_TOKEN_LOCATION = ['cookies']
    JWT_COOKIE_SAMESITE = 'Lax'
    JWT_ACCESS_COOKIE_NAME = 'access_token_cookie'
    JWT_REFRESH_COOKIE_NAME = 'refresh_token_cookie'
    
    # CORS Configuration  
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001,http://localhost:3002').split(',')
    
    # Mail settings (SendGrid/Mailgun)
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.sendgrid.net'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER') or 'noreply@mouldrestoration.com.au'
