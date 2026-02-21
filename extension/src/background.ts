// ============================================================
// Chrome Extension Background Service Worker
// Handles alarms, notifications, and periodic checks
// ============================================================

// Set up daily alarm for contract expiration checks
chrome.alarms?.create('dailyCheck', {
  delayInMinutes: 1,
  periodInMinutes: 24 * 60, // Every 24 hours
});

// Set up monthly alarm for WellMall report (1st of month)
chrome.alarms?.create('monthlyReport', {
  delayInMinutes: 5,
  periodInMinutes: 30 * 24 * 60, // Every ~30 days
});

chrome.alarms?.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyCheck') {
    await checkExpirations();
  }
  if (alarm.name === 'monthlyReport') {
    await sendMonthlyReminder();
  }
});

async function checkExpirations() {
  const token = await getStoredToken();
  if (!token) return;

  try {
    const response = await fetch('http://localhost:3001/api/notifications', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return;

    const notifications = await response.json();
    const unread = notifications.filter((n: any) => !n.isRead && n.type === 'critical');

    if (unread.length > 0) {
      chrome.notifications?.create('expiration-alert', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Domácí Rozpočet - Upozornění',
        message: `Máte ${unread.length} důležitých upozornění. ${unread[0].title}`,
        priority: 2,
      });
    }
  } catch (err) {
    console.error('Background check failed:', err);
  }
}

async function sendMonthlyReminder() {
  const token = await getStoredToken();
  if (!token) return;

  chrome.notifications?.create('monthly-summary', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Domácí Rozpočet - Měsíční shrnutí',
    message: 'Nový měsíc začíná! Zkontrolujte si svůj finanční přehled a Rat Race metr.',
    priority: 1,
  });
}

async function getStoredToken(): Promise<string | null> {
  return new Promise((resolve) => {
    if (chrome.storage?.local) {
      chrome.storage.local.get(['dr_token'], (result) => {
        resolve(result.dr_token || null);
      });
    } else {
      resolve(null);
    }
  });
}

// Handle notification clicks
chrome.notifications?.onClicked.addListener((notificationId) => {
  chrome.tabs?.create({ url: 'newtab.html' });
  chrome.notifications?.clear(notificationId);
});

// Handle extension install
chrome.runtime?.onInstalled?.addListener(() => {
  console.log('Domácí Rozpočet extension installed');
});
