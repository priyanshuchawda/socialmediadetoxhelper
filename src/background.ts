let activeTabId: number | undefined;
let startTime: number | undefined;
let activeDomain: string | undefined;

chrome.tabs.onActivated.addListener((activeInfo) => {
  updateTabUsage(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateTabUsage(tabId);
  }
});

function updateTabUsage(tabId: number) {
  chrome.tabs.get(tabId, (tab) => {
    console.log('Updating tab usage for:', tab.url);
    if (activeTabId && startTime && activeDomain) {
      const duration = Date.now() - startTime;
      console.log('Updating usage data:', activeDomain, duration);
      updateUsageData(activeDomain, duration);
    }

    if (tab.url && isSocialMediaSite(tab.url)) {
      console.log('Social media site detected:', tab.url);
      activeTabId = tabId;
      startTime = Date.now();
      activeDomain = getDomain(tab.url);
      checkDailyLimit(activeDomain);
    } else {
      console.log('Not a social media site:', tab.url);
      activeTabId = undefined;
      startTime = undefined;
      activeDomain = undefined;
    }
  });
}

function isSocialMediaSite(url: string): boolean {
  const socialMediaDomains = ['facebook.com', 'twitter.com', 'instagram.com'];
  return socialMediaDomains.some(domain => url.includes(domain));
}

function getDomain(url: string): string {
  const matches = url.match(/^https?:\/\/([^/?#]+)(?:[/?#]|$)/i);
  return matches && matches[1] ? matches[1] : 'unknown';
}

function updateUsageData(domain: string, duration: number) {
  console.log('Updating usage data:', domain, duration);
  chrome.storage.local.get(['usageData'], (result) => {
    const usageData: { [date: string]: { [domain: string]: number } } = result.usageData || {};
    const date = new Date().toISOString().split('T')[0];
    if (!usageData[date]) {
      usageData[date] = {};
    }
    if (!usageData[date][domain]) {
      usageData[date][domain] = 0;
    }
    usageData[date][domain] += duration;
    chrome.storage.local.set({ usageData }, () => {
      console.log('Usage data updated:', JSON.stringify(usageData, null, 2));
    });
  });
}

function checkDailyLimit(domain: string) {
  const today = new Date().toISOString().split('T')[0];
  chrome.storage.local.get(['usageData', 'settings'], (result) => {
    const usageData: { [domain: string]: number } = result.usageData?.[today] || {};
    const settings: { dailyLimit: number } = result.settings || { dailyLimit: 120 };
    const totalUsage = Object.values(usageData).reduce((sum, duration) => sum + duration, 0);
    
    if (totalUsage > settings.dailyLimit * 60000) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'Daily Limit Reached',
        message: `You've reached your daily social media usage limit of ${settings.dailyLimit} minutes.`
      });
    }
  });
}