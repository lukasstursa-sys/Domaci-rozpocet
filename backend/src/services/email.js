// ============================================================
// Email Service - Templates & Sending
// ============================================================
const nodemailer = require('nodemailer');

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

// Template: Expiration Warning
function getExpirationTemplate({ serviceName, providerName, endDate, daysRemaining }) {
  return {
    subject: `⚠️ Upozornění: Končí vám smlouva na ${serviceName}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f8fa; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 15px rgba(0,0,0,0.07);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1a365d; font-size: 24px; margin: 0;">Domácí Rozpočet</h1>
            <p style="color: #6b7280; font-size: 14px;">Váš finanční strážce</p>
          </div>

          <div style="background: #fef0ee; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #e85d4a;">
            <h2 style="color: #e85d4a; font-size: 18px; margin: 0 0 8px 0;">⚠️ Blížící se expirace</h2>
            <p style="color: #4b5563; margin: 0;">
              Dne <strong>${endDate}</strong> vám končí fixace/smlouva u <strong>${providerName}</strong>.
            </p>
          </div>

          <div style="background: #e6f7ef; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #1e6441; margin: 0; font-size: 14px;">
              Zbývá <strong>${daysRemaining} dní</strong>. Nyní je nejlepší čas vyjednat si lepší podmínky
              nebo porovnat nabídky konkurence.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 32px;">
            Váš AI Strážce financí<br>
            <em>Domácí Rozpočet - Cesta z krysího závodu</em>
          </p>
        </div>
      </div>
    `,
  };
}

// Template: Monthly Rat Race Summary
function getMonthlyRatRaceTemplate({
  familyName, month, year, ratRacePercentage,
  passiveIncome, totalExpenses, biggestCategory,
  wellmallSaved
}) {
  const progressColor = ratRacePercentage < 25 ? '#e85d4a' :
                         ratRacePercentage < 50 ? '#f59e0b' :
                         ratRacePercentage < 75 ? '#3b82f6' : '#2d8f5e';

  return {
    subject: `📈 Váš měsíční posun z Krysího závodu - ${month}/${year}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f8fa; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 15px rgba(0,0,0,0.07);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1a365d; font-size: 24px; margin: 0;">Domácí Rozpočet</h1>
            <p style="color: #6b7280; font-size: 14px;">Měsíční shrnutí pro rodinu ${familyName}</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; width: 120px; height: 120px; border-radius: 50%; border: 8px solid ${progressColor}; line-height: 104px; font-size: 36px; font-weight: 800; color: ${progressColor};">
              ${ratRacePercentage}%
            </div>
            <p style="color: #4b5563; font-size: 14px; margin-top: 12px;">Rat Race Metr</p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
            <div style="background: #e6f7ef; border-radius: 12px; padding: 16px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">Pasivní příjmy</p>
              <p style="color: #2d8f5e; font-size: 20px; font-weight: 700; margin: 4px 0 0 0;">${passiveIncome} Kč</p>
            </div>
            <div style="background: #fef0ee; border-radius: 12px; padding: 16px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">Celkové výdaje</p>
              <p style="color: #e85d4a; font-size: 20px; font-weight: 700; margin: 4px 0 0 0;">${totalExpenses} Kč</p>
            </div>
          </div>

          <div style="background: #f7f8fa; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 14px; color: #4b5563;">
              Největší výdajová kategorie: <strong>${biggestCategory}</strong>
            </p>
          </div>

          <div style="background: #e8edf5; border-radius: 12px; padding: 16px;">
            <p style="margin: 0; font-size: 14px; color: #1a365d;">
              WellMall rozdělení: <strong>${wellmallSaved} Kč</strong> ušetřeno
            </p>
          </div>

          <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 32px;">
            Gratulujeme k posunu!<br>
            <em>Domácí Rozpočet - Cesta z krysího závodu</em>
          </p>
        </div>
      </div>
    `,
  };
}

async function sendExpirationEmail(to, data) {
  if (!process.env.SMTP_USER) {
    console.log('[EMAIL] SMTP not configured. Skipping email to:', to);
    console.log('[EMAIL] Template data:', data);
    return;
  }

  const transporter = createTransporter();
  const template = getExpirationTemplate(data);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'rozpocet@wellmall.cz',
    to,
    subject: template.subject,
    html: template.html,
  });
}

async function sendMonthlyRatRaceEmail(to, data) {
  if (!process.env.SMTP_USER) {
    console.log('[EMAIL] SMTP not configured. Skipping monthly email to:', to);
    return;
  }

  const transporter = createTransporter();
  const template = getMonthlyRatRaceTemplate(data);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'rozpocet@wellmall.cz',
    to,
    subject: template.subject,
    html: template.html,
  });
}

module.exports = {
  sendExpirationEmail,
  sendMonthlyRatRaceEmail,
  getExpirationTemplate,
  getMonthlyRatRaceTemplate,
};
