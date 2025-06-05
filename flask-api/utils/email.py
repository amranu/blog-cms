"""
Email utilities for sending verification emails
"""
import smtplib
import os
import uuid
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid
from flask import current_app

def send_verification_email(user_email, user_name, verification_token):
    """
    Send email verification email to user using local SMTP server
    """
    
    # Get base URL from environment or use default
    base_url = os.getenv('BASE_URL', 'https://isodigm.ca')
    verification_link = f"{base_url}/verify-email?token={verification_token}"
    
    # Email content
    subject = "Email Verification Required - Blog CMS"
    
    body_html = f"""
    <html>
    <body>
        <h2>Email Verification Required</h2>
        <p>Hello {user_name},</p>
        <p>Thank you for registering for our Blog CMS. Please click the link below to verify your email address:</p>
        <p><a href="{verification_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email Address</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p>{verification_link}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Blog CMS Team</p>
    </body>
    </html>
    """
    
    body_text = f"""
    Email Verification Required
    
    Hello {user_name},
    
    Thank you for registering for our Blog CMS. Please visit the following link to verify your email address:
    
    {verification_link}
    
    This link will expire in 24 hours.
    
    If you did not create an account, please ignore this email.
    
    Best regards,
    Blog CMS Team
    """
    
    try:
        # Try to send via local SMTP first
        send_email_smtp_local(user_email, subject, body_html, body_text)
        if current_app:
            current_app.logger.info(f"Verification email sent to {user_email} via local SMTP")
        return True
    except Exception as e:
        # Fallback to logging if SMTP fails
        if current_app:
            current_app.logger.error(f"Failed to send email via SMTP: {str(e)}")
            current_app.logger.info(f"Verification link for {user_email}: {verification_link}")
        
        print(f"""
        ========================================
        EMAIL VERIFICATION REQUIRED
        ========================================
        To: {user_email}
        Name: {user_name}
        
        Please click the following link to verify your email address:
        {verification_link}
        
        This link will expire in 24 hours.
        
        If you did not create an account, please ignore this email.
        ========================================
        """)
        return True

def send_email_smtp_local(to_email, subject, body_html, body_text=None):
    """
    Send email via local Postfix SMTP server with proper RFC 5322 headers
    """
    
    smtp_server = 'host.docker.internal'
    smtp_port = 25
    from_email = 'Blog CMS <noreply@isodigm.ca>'
    
    # Create message with proper headers
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Date'] = formatdate(localtime=True)
    msg['Message-ID'] = make_msgid(domain='isodigm.ca')
    msg['X-Mailer'] = 'Blog CMS 1.0'
    msg['MIME-Version'] = '1.0'
    
    # Add Reply-To header
    msg['Reply-To'] = from_email
    
    # Add text and HTML parts
    if body_text:
        text_part = MIMEText(body_text, 'plain', 'utf-8')
        text_part['Content-Type'] = 'text/plain; charset=utf-8'
        msg.attach(text_part)
    
    html_part = MIMEText(body_html, 'html', 'utf-8')
    html_part['Content-Type'] = 'text/html; charset=utf-8'
    msg.attach(html_part)
    
    # Send email via local Postfix
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        # Enable debugging for troubleshooting
        # server.set_debuglevel(1)
        
        # Send the message
        result = server.send_message(msg)
        server.quit()
        
        if current_app:
            current_app.logger.info(f"Email sent successfully to {to_email}")
            
        return True
    except Exception as e:
        if current_app:
            current_app.logger.error(f"Failed to send email to {to_email} via local SMTP: {str(e)}")
        raise e

def send_email_smtp(to_email, subject, body_html, body_text=None):
    """
    Send email via SMTP (for production use)
    Configure these environment variables:
    - SMTP_SERVER
    - SMTP_PORT
    - SMTP_USERNAME
    - SMTP_PASSWORD
    - FROM_EMAIL
    """
    
    smtp_server = os.getenv('SMTP_SERVER')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    smtp_username = os.getenv('SMTP_USERNAME')
    smtp_password = os.getenv('SMTP_PASSWORD')
    from_email = os.getenv('FROM_EMAIL', smtp_username)
    
    if not all([smtp_server, smtp_username, smtp_password]):
        raise ValueError("SMTP configuration incomplete. Please set SMTP_SERVER, SMTP_USERNAME, and SMTP_PASSWORD environment variables.")
    
    # Create message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = from_email
    msg['To'] = to_email
    
    # Add text and HTML parts
    if body_text:
        text_part = MIMEText(body_text, 'plain')
        msg.attach(text_part)
    
    html_part = MIMEText(body_html, 'html')
    msg.attach(html_part)
    
    # Send email
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        if current_app:
            current_app.logger.error(f"Failed to send email to {to_email}: {str(e)}")
        raise e