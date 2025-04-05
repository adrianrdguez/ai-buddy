// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Chrome Buddy extension installed');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PAGE_CONTENT') {
    // Handle page content if needed
    console.log('Received page content');
  }
  return true;
}); 