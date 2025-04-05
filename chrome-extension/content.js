// Track scroll depth
let maxScrollDepth = 0;
let startTime = Date.now();

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
});

// Track time spent on page
window.addEventListener('beforeunload', () => {
  const timeSpent = Math.floor((Date.now() - startTime) / 1000); // in seconds
  
  // Send data to background script
  chrome.runtime.sendMessage({
    type: 'PAGE_DATA',
    data: {
      timeSpent,
      scrollDepth: maxScrollDepth
    }
  });
}); 