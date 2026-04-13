// Fallback: respond to popup requests for selected text
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelection') {
    const selection = window.getSelection().toString().trim();
    sendResponse({ code: selection });
  }
  return true;
});
