import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import sys
import os

# Add parent directory to path to import settings
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from config import settings

def send_email(to_email: str, subject: str, body_html: str):
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = settings.EMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body_html, 'html'))
        
        # Added timeout=5 to prevent background tasks from hanging indefinitely
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5)
        server.starttls()
        server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(settings.EMAIL_USER, to_email, text)
        server.quit()
        print(f"Email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")

def send_verification_email(to_email: str, token: str):
    subject = "Activate your BreatheX AI account"
    verify_url = f"http://localhost:8000/auth/verify?token={token}"
    
    html = f"""
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #2563eb; margin: 0; font-size: 28px;">Welcome to BreatheX AI!</h2>
        </div>
        <p style="font-size: 16px; color: #334155; line-height: 1.6;">Hello,</p>
        <p style="font-size: 16px; color: #334155; line-height: 1.6;">Thank you for registering. Please click the button below to activate your account and start analyzing respiratory health.</p>
        <div style="text-align: center; margin: 35px 0;">
            <a href="{verify_url}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Activate My Account</a>
        </div>
        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">If the button doesn't work, copy and paste this link into your browser:<br><a href="{verify_url}" style="color: #2563eb;">{verify_url}</a></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
        <p style="font-size: 12px; color: #94a2b8; text-align: center; margin: 0;">© 2026 BreatheX AI. All rights reserved.</p>
    </div>
    """
    send_email(to_email, subject, html)

def send_report_email(to_email: str, prediction: str, confidence: float):
    subject = f"Your BreatheX AI Medical Report: {prediction}"
    
    color = "#16a34a" if prediction.lower() == "healthy" else "#dc2626"
    
    if prediction.lower() == "healthy":
        recommendation = """
        <ul style="color: #334155; font-size: 16px; line-height: 1.6;">
            <li><strong>Keep it up:</strong> Your respiratory health appears normal.</li>
            <li><strong>Stay Active:</strong> Continue maintaining a healthy lifestyle and regular exercise.</li>
            <li><strong>Monitor:</strong> Retest if you develop a persistent cough, shortness of breath, or wheezing.</li>
        </ul>
        """
    elif prediction.lower() == "asthma":
        recommendation = """
        <ul style="color: #334155; font-size: 16px; line-height: 1.6;">
            <li><strong>Consult a Doctor:</strong> Our analysis suggests patterns consistent with Asthma. Please schedule an appointment with a pulmonologist or general physician.</li>
            <li><strong>Avoid Triggers:</strong> Stay away from dust, smoke, cold air, and known allergens.</li>
            <li><strong>Keep Medication Handy:</strong> If you have an inhaler prescribed previously, keep it nearby.</li>
        </ul>
        """
    elif prediction.lower() == "copd":
        recommendation = """
        <ul style="color: #334155; font-size: 16px; line-height: 1.6;">
            <li><strong>Urgent Consultation:</strong> Our analysis suggests patterns consistent with COPD (Chronic Obstructive Pulmonary Disease). Please consult a doctor as soon as possible.</li>
            <li><strong>Stop Smoking:</strong> If you smoke, it is critical to stop immediately to prevent further lung damage.</li>
            <li><strong>Avoid Pollutants:</strong> Limit exposure to indoor and outdoor air pollution.</li>
        </ul>
        """
    else:
        recommendation = "<p style='color: #334155; font-size: 16px;'>Please consult a medical professional for a detailed interpretation of these results.</p>"

    html = f"""
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 25px;">
            <h2 style="color: #0f172a; margin: 0; font-size: 26px;">BreatheX AI <span style="color: #2563eb;">Medical Report</span></h2>
        </div>
        
        <p style="font-size: 16px; color: #334155;">Your respiratory sound analysis is complete. Here is the AI-generated assessment:</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e2e8f0;">
            <p style="font-size: 18px; margin: 0; color: #475569;">Detected Condition: <strong style="color: {color}; font-size: 22px; display: block; margin-top: 5px;">{prediction.upper()}</strong></p>
            <p style="font-size: 16px; margin: 15px 0 0 0; color: #475569;">AI Confidence Level: <strong style="color: #0f172a;">{confidence}%</strong></p>
        </div>

        <h3 style="color: #0f172a; margin-top: 30px; font-size: 20px;">What you should do next:</h3>
        {recommendation}

        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-top: 35px; border-radius: 0 8px 8px 0;">
            <p style="font-size: 13px; color: #991b1b; margin: 0; line-height: 1.5;"><strong>Medical Disclaimer:</strong> This is an AI-generated report intended solely for informational and screening purposes. It <strong>does not</strong> constitute a formal medical diagnosis. Always consult a qualified healthcare professional or doctor for proper medical advice and treatment.</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
            <a href="http://localhost:5173/dashboard" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: bold;">Go to your Dashboard</a>
        </div>
    </div>
    """
    send_email(to_email, subject, html)
