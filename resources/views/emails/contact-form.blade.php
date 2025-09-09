<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Form Submission</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #3b82f6, #06b6d4);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px;
        }
        .field {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        .field-label {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 5px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .field-value {
            color: #475569;
            font-size: 16px;
            word-wrap: break-word;
        }
        .message-content {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 15px;
            white-space: pre-wrap;
            line-height: 1.6;
        }
        .footer {
            background: #f1f5f9;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .timestamp {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💬 New Contact Form Submission</h1>
        </div>
        
        <div class="content">
            <div class="field">
                <div class="field-label">Name</div>
                <div class="field-value">{{ $senderName }}</div>
            </div>
            
            <div class="field">
                <div class="field-label">Email</div>
                <div class="field-value">
                    <a href="mailto:{{ $senderEmail }}" style="color: #3b82f6; text-decoration: none;">
                        {{ $senderEmail }}
                    </a>
                </div>
            </div>
            
            <div class="field">
                <div class="field-label">Message</div>
                <div class="field-value">
                    <div class="message-content">{{ $messageContent }}</div>
                </div>
            </div>
            
            <div class="timestamp">
                Received on {{ now()->format('F j, Y \a\t g:i A T') }}
            </div>
        </div>
        
        <div class="footer">
            <p>This message was sent via the DIU ACM contact form.</p>
            <p>You can reply directly to this email to respond to {{ $senderName }}.</p>
        </div>
    </div>
</body>
</html>
