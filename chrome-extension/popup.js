document.addEventListener('DOMContentLoaded', function() {
  const statusDiv = document.getElementById('status');
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const autoSummaryToggle = document.getElementById('auto-summary-toggle');
  const autoSummaryStatus = document.getElementById('auto-summary-status');
  let autoSummaryInterval = null;

  // Add message to chat
  function addMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Handle chat input
  async function handleChatInput() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessage(message, true);
    chatInput.value = '';

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
      addMessage(data.response);
    } catch (error) {
      console.error('Error:', error);
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

  // Function to summarize the current page
  async function summarizeCurrentPage() {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Execute content script to get page content
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getPageContent
      });

      const pageContent = results[0].result;
      
      // Send data to your API
      const response = await fetch('http://localhost:3001/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: tab.url,
          title: tab.title,
          content: pageContent,
          timeSpent: 0,
          scrollDepth: 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to summarize page');
      }

      const data = await response.json();
      showStatus('Page summarized successfully!', 'success');
      addMessage('I just learned about: ' + tab.title, false);
    } catch (error) {
      console.error('Error:', error);
      showStatus('Error: ' + error.message, 'error');
    }
  }

  // Handle auto-summary toggle
  autoSummaryToggle.addEventListener('change', async (e) => {
    const isEnabled = e.target.checked;
    autoSummaryStatus.textContent = `Auto-summary: ${isEnabled ? 'On' : 'Off'}`;
    
    if (isEnabled) {
      // Start periodic summarization
      await summarizeCurrentPage(); // Initial summarization
      autoSummaryInterval = setInterval(summarizeCurrentPage, 30000); // Every 30 seconds
    } else {
      // Stop periodic summarization
      if (autoSummaryInterval) {
        clearInterval(autoSummaryInterval);
        autoSummaryInterval = null;
      }
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = '';
    }, 3000);
  }
});

// This function will be executed in the context of the web page
function getPageContent() {
  // Get the main content of the page
  const content = document.body.innerText;
  return content;
} 