const enabledCheckbox = document.getElementById("enabled");

chrome.storage.sync.get({ enabled: true }, (settings) => {
  enabledCheckbox.checked = settings.enabled;
});

enabledCheckbox.addEventListener("change", () => {
  const enabled = enabledCheckbox.checked;
  chrome.storage.sync.set({ enabled }, () => {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, {
          action: "toggle",
          enabled,
        }).catch(() => {});
      }
    });
  });
});
