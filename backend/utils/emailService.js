const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER and EMAIL_PASS must be configured in backend .env');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendRoomInvite = async (toEmail, roomId, studentName, interviewerName) => {
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const transporter = createTransporter();

  const mailOptions = {
    from: `"SmartHire AI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🎯 Interview Room Invitation — ${roomId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 500px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 32px; text-align: center; }
          .logo { color: white; font-size: 24px; font-weight: bold; margin-bottom: 4px; }
          .logo span { color: #60a5fa; }
          .subtitle { color: #93c5fd; font-size: 14px; }
          .body { padding: 32px; }
          .greeting { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
          .message { color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
          .room-box { background: #f0f9ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }
          .room-label { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .room-id { font-size: 32px; font-weight: bold; color: #ef4444; letter-spacing: 4px; }
          .btn { display: block; background: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 10px; text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 16px; border: none; }
          .steps { background: #f9fafb; border-radius: 10px; padding: 16px; margin-bottom: 24px; }
          .step { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; font-size: 13px; color: #374151; }
          .step-num { background: #2563eb; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; }
          .footer { background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .info-label { color: #9ca3af; }
          .info-value { color: #374151; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SmartHire <span>AI</span></div>
            <div class="subtitle">AI-Powered Interview Platform</div>
          </div>
          <div class="body">
            <div class="greeting">Hello, ${studentName || 'Student'}! 👋</div>
            <div class="message">
              You have been invited to join a live AI interview session on SmartHire AI.
              Please find your room details below.
            </div>

            <div class="room-box">
              <div class="room-label">Your Interview Room ID</div>
              <div class="room-id">${roomId}</div>
            </div>

            <div class="info-row">
              <span class="info-label">Invited by</span>
              <span class="info-value">${interviewerName || 'Interviewer'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Interview Type</span>
              <span class="info-value">AI-Powered Live Interview</span>
            </div>
            <div class="info-row" style="margin-bottom: 24px">
              <span class="info-label">Platform</span>
              <span class="info-value">SmartHire AI</span>
            </div>

            <a href="${appUrl}/live-interview" class="btn" style="display: block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 10px; text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 16px; border: none;">
              <span style="color: #ffffff; text-decoration: none;">🚀 Join Interview Now</span>
            </a>

            <div class="steps">
              <div style="font-weight: bold; margin-bottom: 10px; font-size: 13px; color: #374151;">
                How to join:
              </div>
              <div class="step">
                <div class="step-num">1</div>
                <span>Click "Join Interview Now" button above</span>
              </div>
              <div class="step">
                <div class="step-num">2</div>
                <span>Enter your name on the interview page</span>
              </div>
              <div class="step">
                <div class="step-num">3</div>
                <span>Enter Room ID: <strong>${roomId}</strong></span>
              </div>
              <div class="step">
                <div class="step-num">4</div>
                <span>Select "Student" role and click Join</span>
              </div>
            </div>
          </div>
          <div class="footer">
            © 2024 SmartHire AI · AI-Powered Placement Intelligence
          </div>
        </div>
      </body>
      </html>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendRoomInvite };
