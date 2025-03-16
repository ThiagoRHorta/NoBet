function normalizeURL(input) {
  input = input.trim().toLowerCase()
    .replace(/^(https?:\/\/)?/i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '');

  return [
    `*://${input}/*`,
    `*://*.${input}/*`
  ];
}
  
document.addEventListener("DOMContentLoaded", () => {
  const addButton = document.getElementById("addButton");
  const siteInput = document.getElementById("siteInput");
  const exportButton = document.getElementById("exportButton");
  const importButton = document.getElementById("importButton");
  const importFile = document.getElementById("importFile");

  addButton.addEventListener("click", () => {
    let rawInput = siteInput.value;
    if (!rawInput.trim()) {
      alert("Please, enter a valid website.");
      return;
    }
    
    const normalizedPatterns = normalizeURL(rawInput);
    
    chrome.storage.sync.get({ blockedSites: [] }, (data) => {
      let sites = data.blockedSites;
      
      normalizedPatterns.forEach(pattern => {
        if (!sites.includes(pattern)) {
          sites.push(pattern);
        }
      });
      
      chrome.storage.sync.set({ blockedSites: sites }, () => {
        siteInput.value = "";
      });
    });
  });

  exportButton.addEventListener("click", () => {
    chrome.storage.sync.get({ blockedSites: [] }, (data) => {
      const baseDomains = data.blockedSites.reduce((acc, site) => {
        const cleanDomain = site
          .replace('*://', '')
          .replace('/*', '')
          .replace(/\*\./g, '')
          .split('/')[0];

        if (!acc.includes(cleanDomain)) {
          acc.push(cleanDomain);
        }
        return acc;
      }, []);

      const content = baseDomains.join('\n');
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "blocked.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });

  importButton.addEventListener("click", () => {
    importFile.click();
  });

  importFile.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      
      const normalizedSites = lines.flatMap(line => {
        const rawDomain = line.trim().replace(/^"|"$/g, '');
        return normalizeURL(rawDomain);
      });

      const uniqueSites = [...new Set(normalizedSites)];
      
      chrome.storage.sync.set({ blockedSites: uniqueSites }, () => {
        importFile.value = "";
      });
    };
    reader.readAsText(file);
  });
});
