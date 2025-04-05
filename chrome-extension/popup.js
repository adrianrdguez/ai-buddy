document.addEventListener('DOMContentLoaded', function() {
  const summarizeButton = document.getElementById('summarize');
  const statusDiv = document.getElementById('status');

  summarizeButton.addEventListener('click', async () => {
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
          timeSpent: 0, // You can track this if needed
          scrollDepth: 0 // You can track this if needed
        })
      });

      if (!response.ok) {
        throw new Error('Failed to summarize page');
      }

      const data = await response.json();
      showStatus('Page summarized successfully!', 'success');
    } catch (error) {
      console.error('Error:', error);
      showStatus('Error: ' + error.message, 'error');
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