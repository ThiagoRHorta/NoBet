let ruleIdCounter = 1; // Inicia em 1 e usa incremento simples

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

// Restante do código mantido igual

// Atualiza as regras ao carregar
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get({ blockedSites: [] }, (data) => {
    updateRules(data.blockedSites);
  });
});

// Atualiza quando há mudanças
chrome.storage.onChanged.addListener((changes) => {
  if (changes.blockedSites) {
    updateRules(changes.blockedSites.newValue);
  }
});