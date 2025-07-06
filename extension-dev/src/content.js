// Content script for page monitoring
let pageStartTime = Date.now();
let lastActivityTime = Date.now();
let isPageVisible = !document.hidden;

// Function to send activity data to background script
function sendActivityToBackground(activityData) {
  chrome.runtime.sendMessage({
    type: 'LOG_ACTIVITY',
    activity: activityData
  });
}

// Track page visibility changes
document.addEventListener('visibilitychange', () => {
  const now = Date.now();
  const wasVisible = isPageVisible;
  isPageVisible = !document.hidden;
  
  if (wasVisible !== isPageVisible) {
    sendActivityToBackground({
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      activityType: isPageVisible ? 'page_visible' : 'page_hidden',
      timestamp: new Date(now).toISOString(),
      duration: now - lastActivityTime,
      isDistraction: !isPageVisible
    });
    
    lastActivityTime = now;
  }
});

// Track mouse movements and clicks (throttled)
let lastMouseActivity = 0;
const MOUSE_THROTTLE = 5000; // 5 seconds

function trackMouseActivity(eventType) {
  const now = Date.now();
  if (now - lastMouseActivity > MOUSE_THROTTLE) {
    lastMouseActivity = now;
    lastActivityTime = now;
    
    sendActivityToBackground({
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      activityType: `mouse_${eventType}`,
      timestamp: new Date(now).toISOString(),
      duration: 0,
      isDistraction: false
    });
  }
}

// Add mouse event listeners
document.addEventListener('mousemove', () => trackMouseActivity('move'));
document.addEventListener('click', () => trackMouseActivity('click'));

// Track keyboard activity (throttled)
let lastKeyActivity = 0;
const KEY_THROTTLE = 3000; // 3 seconds

document.addEventListener('keydown', () => {
  const now = Date.now();
  if (now - lastKeyActivity > KEY_THROTTLE) {
    lastKeyActivity = now;
    lastActivityTime = now;
    
    sendActivityToBackground({
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      activityType: 'keyboard_activity',
      timestamp: new Date(now).toISOString(),
      duration: 0,
      isDistraction: false
    });
  }
});

// Track scroll activity (throttled)
let lastScrollActivity = 0;
const SCROLL_THROTTLE = 10000; // 10 seconds

document.addEventListener('scroll', () => {
  const now = Date.now();
  if (now - lastScrollActivity > SCROLL_THROTTLE) {
    lastScrollActivity = now;
    lastActivityTime = now;
    
    sendActivityToBackground({
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      activityType: 'scroll_activity',
      timestamp: new Date(now).toISOString(),
      duration: 0,
      isDistraction: false
    });
  }
});

// Track page unload
window.addEventListener('beforeunload', () => {
  const now = Date.now();
  const timeOnPage = now - pageStartTime;
  
  sendActivityToBackground({
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname,
    activityType: 'page_unload',
    timestamp: new Date(now).toISOString(),
    duration: timeOnPage,
    isDistraction: false
  });
});

// Initial page load tracking
sendActivityToBackground({
  url: window.location.href,
  title: document.title,
  domain: window.location.hostname,
  activityType: 'page_load',
  timestamp: new Date(pageStartTime).toISOString(),
  duration: 0,
  isDistraction: false
});
