// ============================================================
// Email Service - Templates & Sending (with proper error surfacing)
// ============================================================
const nodemailer = require('nodemailer');

const emailStatus = {
  configured: false,
  lastError: null,
  sentCount: 0,
};

function isEmailConfigured() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function getExpirationTemplate({ serviceName, providerName, endDate, daysRemaining }) {
  return {
    subject: `Upozorneni: Konci vam smlouva na ${serviceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f8fa; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 32px;">
          <h1 style="color: #1a365d; text-align: center;">Domaci Rozpocet</h1>
          <div style="background: #fef0ee; border-radius: 12px; padding: 20px; border-left: 4px solid #e85d4a; margin: 24px 0;">
            <h2 style="color: #e85d4a;">Blizici se expirace</h2>
            <p>Dne <strong>${endDate}</strong> vam konci smlouva u <strong>${providerName}</strong>.</p>
          </div>
          <div style="background: #e6f7ef; border-radius: 12px; padding: 20px;">
            <p style="color: #1e6441;">Zbyva <strong>${daysRemaining} dni</strong>. Cas vyjednat lepsi podminky.</p>
          </div>
          <p style="color: #6b7280; text-align: center; margin-top: 32px;"><em>Vas AI Strazce financi</em></p>
        </div>
      </div>
    `,
  };
}

function getMonthlyRatRaceTemplate({ familyName, month, year, ratRacePercentage, passiveIncome, totalExpenses, biggestCategory, wellmallSaved }) {
  const color = ratRacePercentage < 25 ? '#e85d4a' : ratRacePercentage < 50 ? '#f59e0b' : ratRacePercentage < 75 ? '#3b82f6' : '#2d8f5e';
  return {
    subject: `Mesicni shrnuti Rat Race - ${month}/${year}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f8fa; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 32px;">
          <h1 style="color: #1a365d; text-align: center;">Domaci Rozpocet</h1>
          <p style="text-align: center; color: #6b7280;">Shrnuti pro rodinu ${familyName}</p>
          <div style="text-align: center; margin: 32px 0;">
            <span style="font-size: 48px; font-weight: 800; color: ${color};">${ratRacePercentage}%</span>
            <p style="color: #6b7280;">Rat Race Metr</p>
          </div>
          <p>Pasivni prijmy: <strong>${passiveIncome} Kc</strong> | Vydaje: <strong>${totalExpenses} Kc</strong></p>
          <p>Nejvetsi kategorie: <strong>${biggestCategory}</strong></p>
          <p>WellMall usetreno: <strong>${wellmallSaved} Kc</strong></p>
          <p style="color: #6b7280; text-align: center; margin-top: 32px;"><em>Gratulujeme k posunu!</em></p>
        </div>
      </div>
    `,
  };
}

async function sendExpirationEmail(to, data) {
  if (!isEmailConfigured()) {
    console.log('[EMAIL] SMTP not configured - skipping:', to, data.serviceName);
    emailStatus.lastError = 'SMTP not configured';
    return { sent: false, reason: 'smtp_not_configured' };
  }

  try {
    const transporter = createTransporter();
    const template = getExpirationTemplate(data);
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'rozpocet@wellmall.cz',
      to,
      subject: template.subject,
      html: template.html,
    });
    emailStatus.sentCount++;
    return { sent: true };
  } catch (err) {
    emailStatus.lastError = err.message;
    console.error(`[EMAIL] Failed to send to ${to}:`, err.message);
    return { sent: false, reason: err.message };
  }
}

async function sendMonthlyRatRaceEmail(to, data) {
  if (!isEmailConfigured()) {
    console.log('[EMAIL] SMTP not configured - skipping monthly to:', to);
    return { sent: false, reason: 'smtp_not_configured' };
  }

  try {
    const transporter = createTransporter();
    const template = getMonthlyRatRaceTemplate(data);
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'rozpocet@wellmall.cz',
      to,
      subject: template.subject,
      html: template.html,
    });
    emailStatus.sentCount++;
    return { sent: true };
  } catch (err) {
    emailStatus.lastError = err.message;
    console.error(`[EMAIL] Failed to send monthly to ${to}:`, err.message);
    return { sent: false, reason: err.message };
  }
}

function getEmailStatus() {
  return { ...emailStatus, configured: isEmailConfigured() };
}

module.exports = {
  sendExpirationEmail, sendMonthlyRatRaceEmail,
  getExpirationTemplate, getMonthlyRatRaceTemplate,
  getEmailStatus, isEmailConfigured,
};
