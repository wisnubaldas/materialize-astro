from fastapi_mail import FastMail, MessageSchema, ConnectionConfig  # noqa: F401, I001
from app.utils.env import ENV

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib


class SMTPEmailService:
    def __init__(self):
        self.username = ENV.ELMAIL_USER
        self.password = ENV.ELMAIL_PASSWORD
        self.server = ENV.ELMAIL_SERVER
        self.port = ENV.ELMAIL_PORT
        self.from_email = ENV.ELMAIL_USER

    async def send_email(self, to_email: str, subject: str, html_body: str):
        # Create message
        message = MIMEMultipart("alternative")
        message["From"] = self.from_email
        message["To"] = to_email
        message["Subject"] = subject

        part_html = MIMEText(html_body, "html")
        message.attach(part_html)

        # Send email
        try:
            await aiosmtplib.send(
                message,
                hostname=self.server,
                port=self.port,
                username=self.username,
                password=self.password,
                start_tls=True,
            )
            return {"success": True, "message": "Email sent successfully"}
        except Exception as e:
            return {"success": False, "error": str(e)}


smtp_email_service = SMTPEmailService()
