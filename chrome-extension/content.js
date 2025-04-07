// Track scroll depth and user engagement
let maxScrollDepth = 0;
let startTime = Date.now();
let lastUserActivity = Date.now();
let lastContentHash = '';
let contentChangeCount = 0;
let isExtensionContextValid = true;
let messageQueue = [];
let isProcessingQueue = false;
let retryCount = 0;
const MAX_RETRIES = 3;

// Initialize window variables
window.maxScrollDepth = maxScrollDepth;
window.startTime = startTime;
window.lastUserActivity = lastUserActivity;
window.contentChangeCount = contentChangeCount;

// Function to check if extension context is valid
function checkExtensionContext() {
  try {
    if (chrome && chrome.runtime && chrome.runtime.id) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Function to process message queue
function processMessageQueue() {
  if (isProcessingQueue || messageQueue.length === 0) return;
  
  isProcessingQueue = true;
  const message = messageQueue[0]; // Peek at the first message without removing it
  
  sendMessageToBackground(message.type, message.data, (success) => {
    isProcessingQueue = false;
    
    if (success) {
      // Only remove the message if it was sent successfully
      messageQueue.shift();
      retryCount = 0; // Reset retry count on success
    } else {
      retryCount++;
      if (retryCount >= MAX_RETRIES) {
        // After max retries, remove the message and move on
        messageQueue.shift();
        retryCount = 0;
      }
    }
    
    if (messageQueue.length > 0) {
      setTimeout(processMessageQueue, 1000);
    }
  });
}

// Function to safely send message
function sendMessageToBackground(type, data, callback) {
  try {
    // Check if we're on a restricted URL
    const isRestrictedUrl = window.location.hostname.includes('supabase.com') ||
                          window.location.hostname.includes('localhost') ||
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.includes('thesecondbrain.io') ||
                          window.location.hostname.includes('mail.google.com');

    if (isRestrictedUrl) {
      if (callback) callback(false);
      return;
    }

    if (!checkExtensionContext()) {
      isExtensionContextValid = false;
      messageQueue.push({ type, data });
      if (callback) callback(false);
      return;
    }

    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type, data }, (response) => {
        if (chrome.runtime.lastError) {
          const errorMessage = chrome.runtime.lastError.message || 
                             JSON.stringify(chrome.runtime.lastError);
          console.error(`Error sending message to background: ${errorMessage}`);
          
          if (chrome.runtime.lastError.message?.includes('context invalidated')) {
            isExtensionContextValid = false;
            messageQueue.push({ type, data });
          }
          if (callback) callback(false);
        } else {
          isExtensionContextValid = true;
          if (callback) callback(true);
        }
      });
    } else {
      console.error('Chrome runtime API is not available');
      isExtensionContextValid = false;
      messageQueue.push({ type, data });
      if (callback) callback(false);
    }
  } catch (error) {
    console.error(`Error in sendMessageToBackground: ${error.message || error}`);
    isExtensionContextValid = false;
    messageQueue.push({ type, data });
    if (callback) callback(false);
  }
}

// Function to attempt reconnection
function attemptReconnection() {
  if (!isExtensionContextValid) {
    if (checkExtensionContext()) {
      isExtensionContextValid = true;
      retryCount = 0; // Reset retry count on successful reconnection
      processMessageQueue();
    }
  }
}

// Listen for messages from background script
if (chrome && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'PING') {
      sendResponse({ status: 'alive' });
      return false; // Don't keep the message channel open
    }
    
    if (request.type === 'GET_METRICS') {
      const metrics = {
        timeSpent: Math.floor((Date.now() - startTime) / 1000),
        scrollDepth: maxScrollDepth,
        activeTime: Math.floor((Date.now() - lastUserActivity) / 1000),
        contentChanges: contentChangeCount
      };
      sendResponse({ metrics });
      return false; // Don't keep the message channel open
    }
    
    if (request.type === 'GET_CONTENT') {
      const content = document.body.innerText;
      sendResponse(content);
      return false; // Don't keep the message channel open
    }
    
    return false; // Don't keep the message channel open for unknown message types
  });
}

// Track user activity
document.addEventListener('mousemove', updateLastActivity);
document.addEventListener('keydown', updateLastActivity);
document.addEventListener('click', updateLastActivity);

function updateLastActivity() {
  lastUserActivity = Date.now();
  window.lastUserActivity = lastUserActivity;
  sendMetrics();
}

// Track scroll depth
document.addEventListener('scroll', () => {
  const scrollHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );
  const scrollTop = Math.max(
    document.body.scrollTop,
    document.documentElement.scrollTop
  );
  const clientHeight = document.documentElement.clientHeight;
  
  const currentScrollDepth = (scrollTop + clientHeight) / scrollHeight;
  maxScrollDepth = Math.max(maxScrollDepth, currentScrollDepth);
  window.maxScrollDepth = maxScrollDepth;
  updateLastActivity();
});

// Track content changes
function getContentHash() {
  const content = document.body.innerText;
  return content.split(' ').length; // Simple content length as hash
}

// Check for content changes periodically
setInterval(() => {
  const currentHash = getContentHash();
  if (currentHash !== lastContentHash) {
    contentChangeCount++;
    window.contentChangeCount = contentChangeCount;
    lastContentHash = currentHash;
    sendMetrics();
  }
}, 5000);

// Function to send metrics to background script
function sendMetrics() {
  const timeSpent = Math.floor((Date.now() - startTime) / 1000);
  const activeTime = Math.floor((Date.now() - lastUserActivity) / 1000);
  
  const metrics = {
    timeSpent,
    scrollDepth: maxScrollDepth,
    activeTime,
    contentChanges: contentChangeCount
  };
  
  sendMessageToBackground('PAGE_DATA', metrics);
}

// Function to get page content
function getPageContent() {
  const content = document.body.innerText;
  return content;
}

// Expose getPageContent to window
window.getPageContent = getPageContent;

// Send initial metrics after a short delay to ensure page is loaded
setTimeout(sendMetrics, 1000);

// Attempt reconnection periodically
setInterval(attemptReconnection, 5000);

// Process message queue periodically
setInterval(processMessageQueue, 1000);

// Send final metrics when page is unloaded
window.addEventListener('beforeunload', sendMetrics); 