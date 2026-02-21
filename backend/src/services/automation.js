// ============================================================
// Automation Service - Expiration checks & notifications
// ============================================================
const { getDb, insert } = require('../models/db');
const { sendExpirationEmail } = require('./email');

async function checkExpirations() {
  const db = getDb();
  const now = new Date();
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  for (const user of db.users) {
    const expenses = db.expenses.filter(e => e.userId === user.id);

    for (const expense of expenses) {
      if (!expense.contractEndDate) continue;

      const endDate = new Date(expense.contractEndDate);
      if (endDate <= ninetyDays && endDate >= now) {
        const daysRemaining = Math.ceil(
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if notification already sent
        const existingNotif = db.notifications.find(
          n => n.userId === user.id &&
               n.title.includes(expense.title) &&
               n.type === 'critical'
        );

        if (!existingNotif) {
          // Create in-app notification
          insert('notifications', {
            userId: user.id,
            title: `Končí smlouva: ${expense.title}`,
            message: `Dne ${endDate.toLocaleDateString('cs-CZ')} vám končí ${
              expense.subcategoryId === 'mortgage' ? 'fixace hypotéky' : 'smlouva'
            } u ${expense.providerName || expense.title}. Zbývá ${daysRemaining} dní.`,
            type: daysRemaining <= 30 ? 'critical' : 'warning',
            isRead: false,
          });

          // Send email
          try {
            await sendExpirationEmail(user.email, {
              serviceName: expense.title,
              providerName: expense.providerName || expense.title,
              endDate: endDate.toLocaleDateString('cs-CZ'),
              daysRemaining,
            });
          } catch (err) {
            console.error(`Failed to send expiration email to ${user.email}:`, err);
          }
        }
      }
    }

    // Check for overlapping subscriptions
    const subscriptions = expenses.filter(e => e.categoryId === 'subscriptions');
    const streamingServices = subscriptions.filter(e =>
      ['netflix', 'hbo'].includes(e.subcategoryId)
    );

    if (streamingServices.length > 1) {
      const totalCost = streamingServices.reduce((sum, e) => sum + e.amountTotal, 0);
      const existingAdvice = db.notifications.find(
        n => n.userId === user.id && n.message.includes('streaming')
      );

      if (!existingAdvice) {
        insert('notifications', {
          userId: user.id,
          title: 'Tip na úsporu: Streaming služby',
          message: `Využíváte ${streamingServices.length} streaming služeb. Zrušením jedné ušetříte ročně až ${totalCost * 12} Kč.`,
          type: 'info',
          isRead: false,
        });
      }
    }
  }
}

module.exports = { checkExpirations };
