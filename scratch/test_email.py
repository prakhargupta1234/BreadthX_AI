import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

EMAIL_USER = "guptaprakhar97791@gmail.com"
EMAIL_PASSWORD = "qbwb bekd ubth dmov"

try:
    print("Connecting to SMTP server...")
    server = smtplib.SMTP('smtp.gmail.com', 587, timeout=5)
    server.starttls()
    print("Logging in...")
    server.login(EMAIL_USER, EMAIL_PASSWORD)
    print("Login successful! Sending test email...")
    
    msg = MIMEMultipart()
    msg['From'] = EMAIL_USER
    msg['To'] = EMAIL_USER
    msg['Subject'] = "BreatheX AI Test Email"
    msg.attach(MIMEText("If you see this, the email integration works!", 'plain'))
    
    server.sendmail(EMAIL_USER, EMAIL_USER, msg.as_string())
    server.quit()
    print("Test email sent successfully!")
except Exception as e:
    print(f"Error: {e}")
