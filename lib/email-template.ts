export function createEmailTemplate(content: string, recipientName?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sthavishtah Yoga</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            background-color: #f8f9fa;
            line-height: 1.6;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #2d5016 0%, #4a7c59 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            position: relative;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
            opacity: 0.3;
        }
        .logo-section {
            position: relative;
            z-index: 1;
        }
        .logo-img {
            width: 80px;
            height: 80px;
            margin: 0 auto 15px;
            display: block;
            border-radius: 50%;
            border: 3px solid rgba(255, 255, 255, 0.3);
            background-color: rgba(255, 255, 255, 0.1);
            padding: 5px;
        }
        .company-name {
            font-size: 28px;
            font-weight: bold;
            margin: 0;
            letter-spacing: 1px;
        }
        .tagline {
            font-size: 14px;
            margin: 5px 0 0;
            opacity: 0.9;
            font-style: italic;
        }
        .content {
            padding: 40px 30px;
            color: #333333;
        }
        .greeting {
            font-size: 18px;
            color: #2d5016;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .message-content {
            font-size: 16px;
            line-height: 1.8;
            color: #555555;
        }
        .message-content p {
            margin: 15px 0;
        }
        .divider {
            height: 2px;
            background: linear-gradient(90deg, #2d5016, #4a7c59, #2d5016);
            margin: 30px 0;
            border-radius: 1px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer-content {
            color: #666666;
            font-size: 14px;
        }
        .contact-info {
            margin: 15px 0;
        }
        .contact-info a {
            color: #2d5016;
            text-decoration: none;
            font-weight: 500;
        }
        .contact-info a:hover {
            text-decoration: underline;
        }
        .social-links {
            margin: 20px 0;
        }
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            padding: 10px 20px;
            background-color: #2d5016;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            transition: background-color 0.3s;
        }
        .social-links a:hover {
            background-color: #4a7c59;
        }
        .disclaimer {
            font-size: 12px;
            color: #999999;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #e9ecef;
        }
        @media (max-width: 600px) {
            .email-container {
                margin: 0;
                box-shadow: none;
            }
            .header {
                padding: 20px 15px;
            }
            .company-name {
                font-size: 24px;
            }
            .content {
                padding: 30px 20px;
            }
            .footer {
                padding: 20px 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header with Logo and Branding -->
        <div class="header">
            <div class="logo-section">
                <img src="https://sthavishtah.com/images/logo.png" alt="Sthavishtah Yoga Logo" class="logo-img" />
                <h1 class="company-name">STHAVISHTAH</h1>
                <p class="tagline">Breathe • Balance • Become</p>
            </div>
        </div>

        <!-- Main Content -->
        <div class="content">
            ${recipientName ? `<div class="greeting">Namaste ${recipientName},</div>` : '<div class="greeting">Namaste,</div>'}
            
            <div class="message-content">
                ${content}
            </div>

            <div class="divider"></div>

            <p style="color: #2d5016; font-weight: 600; margin-bottom: 5px;">With gratitude and light,</p>
            <p style="color: #4a7c59; font-weight: 500;">The Sthavishtah Yoga Team</p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-content">
                <div class="contact-info">
                    <strong>Sthavishtah Yoga Academy</strong><br>
                    📧 <a href="mailto:sthavishtah2024@gmail.com">sthavishtah2024@gmail.com</a><br>
                    🌐 <a href="https://sthavishtah.com">www.sthavishtah.com</a>
                </div>

                <div class="social-links">
                    <a href="https://instagram.com/sthavishtah">📷 Follow us @sthavishtah</a>
                </div>

                <div class="disclaimer">
                    <p>This email was sent from Sthavishtah Yoga Academy. If you no longer wish to receive these emails, please contact us.</p>
                    <p>© ${new Date().getFullYear()} Sthavishtah Yoga Academy. All rights reserved.</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `
}

export function createPasswordEmailTemplate(name: string, userId: string, password: string): string {
  const content = `
    <p>We're delighted to welcome you to the Sthavishtah Yoga family! Your account has been successfully created.</p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #2d5016; margin: 20px 0;">
        <h3 style="color: #2d5016; margin-top: 0;">Your Login Credentials:</h3>
        <p style="margin: 10px 0;"><strong>User ID:</strong> <code style="background-color: #e9ecef; padding: 2px 6px; border-radius: 3px;">${userId}</code></p>
        <p style="margin: 10px 0;"><strong>Password:</strong> <code style="background-color: #e9ecef; padding: 2px 6px; border-radius: 3px;">${password}</code></p>
    </div>

    <p>Please keep these credentials secure and do not share them with anyone. You can now access your personalized yoga journey through our platform.</p>

    <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; color: #2d5016;"><strong>🌟 What's Next?</strong></p>
        <ul style="margin: 10px 0; color: #4a7c59;">
            <li>Log in to explore our course offerings</li>
            <li>Join our Bhagavad Gita study sessions</li>
            <li>Access personalized yoga practices</li>
            <li>Connect with our community of practitioners</li>
        </ul>
    </div>

    <p>If you have any questions or need assistance, our support team is here to help you on your wellness journey.</p>
  `

  return createEmailTemplate(content, name)
}

export function createBulkEmailTemplate(message: string, recipientName?: string): string {
  return createEmailTemplate(message, recipientName)
}
