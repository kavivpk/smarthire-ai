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

const sendAptitudeResult = async (toEmail, studentName, resultData) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"SmartHire AI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `📊 Your Aptitude Assessment Results`,
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
          .score-box { background: #f0f9ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }
          .score-label { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .score-val { font-size: 32px; font-weight: bold; color: #1d4ed8; }
          .section-breakdown { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
          .section-title { font-size: 14px; font-weight: bold; color: #4b5563; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .footer { background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SmartHire <span>AI</span></div>
            <div class="subtitle">Aptitude Test Result</div>
          </div>
          <div class="body">
            <div class="greeting">Hello, ${studentName || 'Student'}! 👋</div>
            <div class="message">
              Thank you for completing the aptitude assessment on SmartHire AI. 
              We have successfully evaluated your test.
            </div>

            <div class="score-box">
              <div class="score-label">Total Score</div>
              <div class="score-val">${resultData.totalScore || 0}%</div>
            </div>

            ${resultData.categoryScores && Object.keys(resultData.categoryScores).length > 0 ? `
            <div class="section-breakdown">
              <div class="section-title">Section-wise Breakdown</div>
              ${Object.entries(resultData.categoryScores).map(([category, score]) => `
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="font-weight: 500; color: #374151;">${category}</span>
                  <span style="color: #2563eb; font-weight: bold;">${score.correct} / ${score.total}</span>
                </div>
              `).join('')}
            </div>
            ` : ''}

            <div class="message">
              <strong>Overall Details:</strong><br>
              Correct Answers: ${resultData.correct} out of ${resultData.total}<br><br>
              Keep practicing to improve your placement readiness!
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

const sendTechnicalInterviewReport = async (toEmail, studentName, reportData) => {
  const transporter = createTransporter();
  const rows = (reportData.reports || []).slice(0, 8).map((report, index) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${report.overallScore || 0}/10</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${report.feedback || ''}</td>
    </tr>
  `).join('');

  const recommendations = (reportData.recommendations || [])
    .map(item => `<li>${item}</li>`)
    .join('');

  const mailOptions = {
    from: `"SmartHire AI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Technical Interview Report',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
        <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden;">
          <div style="background: #1e40af; padding: 24px; color: #ffffff;">
            <h2 style="margin: 0;">SmartHire AI</h2>
            <p style="margin: 6px 0 0;">Technical Interview Report</p>
          </div>
          <div style="padding: 24px;">
            <p>Hello ${studentName || 'Candidate'},</p>
            <p>Your technical interview evaluation is ready.</p>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 18px; margin: 18px 0;">
              <div style="font-size: 13px; color: #475569;">Overall Score</div>
              <div style="font-size: 34px; font-weight: 700; color: #1d4ed8;">${reportData.overallScore || 0}/10</div>
            </div>
            <p><strong>Technical:</strong> ${reportData.averageTechnical || 0}/10</p>
            <p><strong>Communication:</strong> ${reportData.averageCommunication || 0}/10</p>
            <p><strong>Grammar:</strong> ${reportData.averageGrammar || 0}/10</p>
            <p><strong>Confidence:</strong> ${reportData.averageConfidence || 0}/10</p>
            <p><strong>Strongest Area:</strong> ${reportData.strongestSkill || 'N/A'}</p>
            <p><strong>Weakest Area:</strong> ${reportData.weakestSkill || 'N/A'}</p>
            <h3>Recommendations</h3>
            <ul>${recommendations}</ul>
            ${rows ? `
              <h3>Question Feedback</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #cbd5e1;">#</th>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #cbd5e1;">Score</th>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #cbd5e1;">Feedback</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendRoomInvite, sendAptitudeResult, sendTechnicalInterviewReport, sendCodingReport, sendLoginSummary };

async function sendCodingReport(toEmail, studentName, reportData) {
  const transporter = createTransporter();

  const testRows = (reportData.testCaseResults || []).map((tc, i) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${i + 1}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-family:monospace;">${tc.input || ''}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-family:monospace;">${tc.expected || ''}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-family:monospace;">${tc.actual || ''}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">
        <span style="color:${tc.status === 'Pass' ? '#16a34a' : '#dc2626'};font-weight:bold;">${tc.status || 'N/A'}</span>
      </td>
    </tr>
  `).join('');

  const scoreColor = (reportData.score || 0) >= 7 ? '#16a34a'
    : (reportData.score || 0) >= 4 ? '#d97706' : '#dc2626';

  const mailOptions = {
    from: `"SmartHire AI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `💻 Coding Assessment Report — ${reportData.problemTitle || 'Problem'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:24px;">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:28px;text-align:center;">
            <div style="color:white;font-size:22px;font-weight:bold;">SmartHire <span style="color:#60a5fa;">AI</span></div>
            <div style="color:#93c5fd;font-size:13px;margin-top:4px;">Coding Assessment Report</div>
          </div>

          <div style="padding:28px;">
            <p style="font-size:16px;font-weight:bold;color:#1f2937;margin:0 0 6px;">Hello, ${studentName || 'Candidate'}! 👋</p>
            <p style="color:#6b7280;font-size:13px;margin:0 0 24px;">
              Your coding submission for <strong>${reportData.problemTitle || 'the problem'}</strong> has been evaluated.
            </p>

            <!-- Score + Verdict -->
            <div style="display:flex;gap:16px;margin-bottom:20px;">
              <div style="flex:1;background:#f0f9ff;border:2px solid #3b82f6;border-radius:12px;padding:18px;text-align:center;">
                <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Score</div>
                <div style="font-size:32px;font-weight:bold;color:${scoreColor};">${reportData.score || 0}<span style="font-size:16px;color:#9ca3af;">/10</span></div>
              </div>
              <div style="flex:1;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:18px;text-align:center;">
                <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Verdict</div>
                <div style="font-size:18px;font-weight:bold;color:#1f2937;">${reportData.verdict || 'N/A'}</div>
              </div>
            </div>

            <!-- Details row -->
            <div style="background:#f9fafb;border-radius:10px;padding:16px;margin-bottom:20px;">
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:13px;">
                <span style="color:#6b7280;">Language</span>
                <span style="color:#1f2937;font-weight:500;">${reportData.language || 'N/A'}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:13px;">
                <span style="color:#6b7280;">Test Cases Passed</span>
                <span style="color:#1f2937;font-weight:500;">${reportData.testCasesPassed || 0} / ${reportData.testCasesTotal || 0}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;">
                <span style="color:#6b7280;">Time Complexity</span>
                <span style="color:#1f2937;font-weight:500;font-family:monospace;">${reportData.timeComplexity || 'N/A'}</span>
              </div>
            </div>

            <!-- Feedback -->
            ${reportData.feedback ? `
            <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:6px;padding:14px;margin-bottom:20px;">
              <div style="font-size:12px;font-weight:bold;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Feedback</div>
              <div style="font-size:13px;color:#78350f;line-height:1.6;">${reportData.feedback}</div>
            </div>` : ''}

            <!-- Hints -->
            ${reportData.hints ? `
            <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:6px;padding:14px;margin-bottom:20px;">
              <div style="font-size:12px;font-weight:bold;color:#14532d;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Hint</div>
              <div style="font-size:13px;color:#166534;line-height:1.6;">${reportData.hints}</div>
            </div>` : ''}

            <!-- Test case table -->
            ${testRows ? `
            <h3 style="font-size:13px;font-weight:bold;color:#374151;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 10px;">Test Case Results</h3>
            <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px;">
              <thead>
                <tr style="background:#f3f4f6;">
                  <th style="padding:8px;text-align:left;color:#6b7280;">#</th>
                  <th style="padding:8px;text-align:left;color:#6b7280;">Input</th>
                  <th style="padding:8px;text-align:left;color:#6b7280;">Expected</th>
                  <th style="padding:8px;text-align:left;color:#6b7280;">Actual</th>
                  <th style="padding:8px;text-align:center;color:#6b7280;">Status</th>
                </tr>
              </thead>
              <tbody>${testRows}</tbody>
            </table>` : ''}
          </div>

          <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#9ca3af;">
            © 2024 SmartHire AI · AI-Powered Placement Intelligence
          </div>
        </div>
      </body>
      </html>
    `
  };

  return transporter.sendMail(mailOptions);
}
