(() => {
  "use strict";

  const TYPING_SELECTORS = [
    '[data-tid="typing-indicator"]',
    '[data-tid="chat-typing-indicator"]',
    '[data-tid="typingindicator"]',
    'div[class*="typingIndicator"]',
    'div[class*="TypingIndicator"]',
    'div[class*="typing-indicator"]',
    ".ts-typing-indicator",
    ".typing-indicator",
    'div[aria-label*="typing" i]',
    'div[role="status"][aria-label*="typing" i]',
    'img[src*="typing-balls-dark.svg"]',
    '[class*="open-compose-copilot" i]',
    '[id*="open-compose-copilot" i]',
    '[name*="open-compose-copilot" i]',
    '[data-tid*="open-compose-copilot" i]',
    '[aria-label*="open-compose-copilot" i]',
    "open-compose-copilot",
    '[class*="suggested-schedule-message-delivery-button" i]',
    '[id*="suggested-schedule-message-delivery-button" i]',
    '[name*="suggested-schedule-message-delivery-button" i]',
    '[data-tid*="suggested-schedule-message-delivery-button" i]',
    '[aria-label*="suggested-schedule-message-delivery-button" i]',
    "suggested-schedule-message-delivery-button",
  ];

  const COMBINED_SELECTOR = TYPING_SELECTORS.join(", ");

  let enabled = true;
  let styleEl = null;
  let observer = null;

  // Inject a dynamic style sheet we can toggle on/off
  function injectStyle() {
    if (styleEl) return;
    styleEl = document.createElement("style");
    styleEl.id = "teams-typing-blocker-dynamic";
    styleEl.textContent = `${COMBINED_SELECTOR} {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      overflow: hidden !important;
    }`;
    (document.head || document.documentElement).appendChild(styleEl);
  }

  function removeStyle() {
    if (styleEl) {
      styleEl.remove();
      styleEl = null;
    }
  }

  // MutationObserver as a fallback: forcefully hide any typing indicator
  // that might get added dynamically with inline styles overriding CSS
  function hideNode(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.matches?.(COMBINED_SELECTOR)) {
      node.setAttribute("aria-hidden", "true");
      node.style.setProperty("display", "none", "important");
    }
    node.querySelectorAll?.(COMBINED_SELECTOR).forEach((el) => {
      el.setAttribute("aria-hidden", "true");
      el.style.setProperty("display", "none", "important");
    });
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          hideNode(node);
        }
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    // Hide anything already in the DOM
    document.querySelectorAll(COMBINED_SELECTOR).forEach((el) => {
      el.setAttribute("aria-hidden", "true");
      el.style.setProperty("display", "none", "important");
    });
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    // Restore hidden elements
    document.querySelectorAll(COMBINED_SELECTOR).forEach((el) => {
      el.removeAttribute("aria-hidden");
      el.style.removeProperty("display");
    });
  }

  function activate() {
    injectStyle();
    startObserver();
  }

  function deactivate() {
    removeStyle();
    stopObserver();
  }

  // Listen for toggle from popup
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "toggle") {
      enabled = message.enabled;
      if (enabled) {
        activate();
      } else {
        deactivate();
      }
    }
  });

  // Init
  chrome.storage.sync.get({ enabled: true }, (settings) => {
    enabled = settings.enabled;
    if (enabled) activate();
  });
})();
