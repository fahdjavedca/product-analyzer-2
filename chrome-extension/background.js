// Background script for CJ Dropshipping Product Analyzer Chrome Extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('CJ Product Analyzer extension installed');
  
  // Set default settings
  chrome.storage.sync.set({
    autoAnalyze: false, // Always disabled by default
    showScores: true,
    highlightHigh: true
  });
});

// Listen for tab updates to inject content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('cjdropshipping.com')) {
    // Inject content script
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(err => {
      console.log('Could not inject content script:', err);
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    // Update stats in storage
    chrome.storage.local.set({
      analyzedCount: request.analyzedCount,
      highOppCount: request.highOppCount,
      avgScore: request.avgScore
    });
  }
  
  if (request.action === 'getGoogleAdsData') {
    // This would integrate with Google Ads API
    // NO MOCK DATA - fail gracefully
    sendResponse({ 
      success: false, 
      error: 'Google Ads API not implemented - real data required' 
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('cjdropshipping.com')) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleOverlay' });
  }
});
