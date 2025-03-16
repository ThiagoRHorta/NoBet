let ruleIdCounter = 1;

async function updateRules(blockedSites) {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map(rule => rule.id);

  const rules = blockedSites.flatMap((pattern) => {
    const baseDomain = pattern
      .replace('*://', '')
      .replace('/*', '')
      .replace('*.', '');

    return {
      id: ruleIdCounter++,
      priority: 1,
      action: { type: "block" },
      condition: {
        urlFilter: `||${baseDomain}^`,
        resourceTypes: ["main_frame"]
      }
    };
  });

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeRuleIds,
    addRules: rules
  });
}

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get({ blockedSites: [] }, (data) => {
    updateRules(data.blockedSites);
  });
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.blockedSites) {
    updateRules(changes.blockedSites.newValue);
  }
});