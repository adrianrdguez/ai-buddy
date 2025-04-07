document.addEventListener('DOMContentLoaded', function() {
  const statusDiv = document.getElementById('status');
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const autoSummaryToggle = document.getElementById('auto-summary-toggle');
  const autoSummaryStatus = document.getElementById('auto-summary-status');
  const loadingContainer = document.getElementById('loading-container');
  let autoSummaryInterval = null;
  let thinkingMessage = null;

  // Load saved auto-summary state
  chrome.storage.local.get('autoSummaryEnabled', (data) => {
    autoSummaryToggle.checked = data.autoSummaryEnabled || false;
    autoSummaryStatus.textContent = `Auto-summary: ${autoSummaryToggle.checked ? 'On' : 'Off'}`;
    if (autoSummaryToggle.checked) {
      startAutoSummary();
    }
  });

  // Add message to chat
  function addMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.style.whiteSpace = 'pre-wrap';
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageDiv;
  }

  // Show thinking message
  function showLoading() {
    thinkingMessage = addMessage('Thinking...', false);
    sendButton.disabled = true;
    chatInput.disabled = true;
  }

  // Hide thinking message
  function hideLoading() {
    if (thinkingMessage) {
      thinkingMessage.remove();
      thinkingMessage = null;
    }
    sendButton.disabled = false;
    chatInput.disabled = false;
  }

  // Handle chat input
  async function handleChatInput() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessage(message, true);
    chatInput.value = '';
    showLoading();

    try {
      // Send message to backend
      const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      hideLoading();
      addMessage(data.response);
    } catch (error) {
      console.error('Error:', error);
      hideLoading();
      addMessage('Sorry, I encountered an error. Please try again.');
    }
  }

  // Event listeners
  sendButton.addEventListener('click', handleChatInput);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleChatInput();
    }
  });

  // Function to get page content
  function getPageContent() {
    console.log('Getting page content...');
    // Get the main content of the page
    const content = document.body.innerText;
    console.log('Content length:', content.length);
    return content;
  }

  // Function to check if URL is allowed for summarization
  function isUrlAllowed(url) {
    try {
      const urlObj = new URL(url);
      // Don't process restricted protocols
      if (['chrome:', 'edge:', 'about:', 'file:', 'data:'].includes(urlObj.protocol)) {
        return false;
      }
      // Don't process restricted domains
      if (urlObj.hostname.includes('supabase.com') || 
          urlObj.hostname.includes('localhost') || 
          urlObj.hostname === '127.0.0.1' ||
          urlObj.hostname.includes('thesecondbrain.io') ||
          urlObj.hostname.includes('mail.google.com')) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // Function to check if we should summarize based on metrics
  function shouldSummarize(metrics) {
    const { timeSpent, scrollDepth, activeTime, contentChanges } = metrics;
    
    // Check if basic requirements are met
    const hasEngagement = scrollDepth > 0.1 || activeTime > 30 || contentChanges > 0;
    const hasMinimumTime = timeSpent > 30;
    
    if (!hasEngagement || !hasMinimumTime) {
      return false;
    }
    
    // Check for significant changes
    const hasSignificantChanges = contentChanges >= 3;
    const hasSignificantScroll = scrollDepth > 0.5;
    const hasSignificantTime = timeSpent > 120;
    
    return hasSignificantChanges || hasSignificantScroll || hasSignificantTime;
  }

  // Function to start auto-summary
  function startAutoSummary() {
    chrome.storage.local.set({ autoSummaryEnabled: true });
    
    // Clear any existing interval
    if (autoSummaryInterval) {
      clearInterval(autoSummaryInterval);
    }
    
    // Set up new interval
    autoSummaryInterval = setInterval(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && isUrlAllowed(tabs[0].url)) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_METRICS' }, (response) => {
            if (response && response.metrics) {
              if (shouldSummarize(response.metrics)) {
                // Get page content and summarize
                chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_CONTENT' }, async (content) => {
                  if (content) {
                    try {
                      const summary = await summarizePage(content);
                      if (summary) {
                        // Save summary to database
                        await saveSummaryToDB(tabs[0].url, summary);
                        // Show success message
                        showStatus('Page summarized successfully!', 'success');
                        addMessage('I just learned about: ' + tabs[0].title, false);
                      }
                    } catch (error) {
                      console.error('Error summarizing page:', error);
                      showStatus('Error summarizing page: ' + error.message, 'error');
                    }
                  }
                });
              }
            }
          });
        }
      });
    }, 30000); // Check every 30 seconds
  }

  // Function to stop auto-summary
  function stopAutoSummary() {
    chrome.storage.local.set({ autoSummaryEnabled: false });
    if (autoSummaryInterval) {
      clearInterval(autoSummaryInterval);
    }
  }

  // Toggle auto-summary
  autoSummaryToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      startAutoSummary();
    } else {
      stopAutoSummary();
    }
  });

  // Listen for metrics updates from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'PAGE_DATA') {
      chrome.storage.local.get(['autoSummaryEnabled'], (result) => {
        if (result.autoSummaryEnabled && isUrlAllowed(sender.tab.url)) {
          if (shouldSummarize(request.data)) {
            // Get page content and summarize
            chrome.tabs.sendMessage(sender.tab.id, { type: 'GET_CONTENT' }, async (content) => {
              if (content) {
                try {
                  const summary = await summarizePage(content);
                  if (summary) {
                    // Save summary to database
                    await saveSummaryToDB(sender.tab.url, summary);
                    // Show success message
                    showStatus('Page summarized successfully!', 'success');
                    addMessage('I just learned about: ' + sender.tab.title, false);
                  }
                } catch (error) {
                  console.error('Error summarizing page:', error);
                  showStatus('Error summarizing page: ' + error.message, 'error');
                }
              }
            });
          }
        }
      });
    }
    return false; // Don't keep the message channel open
  });

  // Function to summarize page content
  async function summarizePage(content) {
    try {
      const response = await fetch('http://localhost:3001/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.summary;
    } catch (error) {
      console.error('Error in summarizePage:', error);
      return null;
    }
  }

  // Function to save summary to database
  async function saveSummaryToDB(url, summary) {
    try {
      const response = await fetch('http://localhost:3001/summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          summary,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving summary to DB:', error);
      return null;
    }
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = '';
    }, 3000);
  }
}); 