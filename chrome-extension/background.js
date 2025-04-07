// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Chrome Buddy extension installed');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request.type, 'from tab:', sender.tab?.id);
  
  if (request.type === 'PAGE_DATA') {
    console.log('Received page data from tab', sender.tab?.id, ':', request.data);
    // Store the data if needed
    if (sender.tab?.id) {
      chrome.storage.local.set({ [sender.tab.id]: request.data });
    }
  }
  
  // Always return true to indicate we will send a response asynchronously
  return true;
});

// Listen for tab updates to ensure content script is running
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    console.log('Tab updated:', tabId, tab.url);
    
    // Check if content script is running
    chrome.tabs.sendMessage(tabId, { type: 'PING' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Content script not responding, attempting to inject:', chrome.runtime.lastError);
        // Only inject if the content script isn't responding
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        }).then(() => {
          console.log('Content script injected successfully');
        }).catch(err => {
          console.error('Script injection failed:', err);
        });
      } else {
        console.log('Content script is already running');
      }
    });
  }
}); 