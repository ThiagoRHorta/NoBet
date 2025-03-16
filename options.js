// Função para normalizar a entrada do usuário.
// Converte entradas como "www.exemplo.com", "exemplo.com", "http://exemplo.com" etc. para "*://exemplo.com/*"
function normalizeURL(input) {
  input = input.trim().toLowerCase()
    .replace(/^(https?:\/\/)?/i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '');

  // Gera ambos os padrões
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

  // Adiciona novo site à lista
  addButton.addEventListener("click", () => {
    let rawInput = siteInput.value;
    if (!rawInput.trim()) {
      alert("Por favor, insira um site válido.");
      return;
    }
    
    // Normaliza para array de padrões
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

  // Exporta a lista de sites para um arquivo blocked.txt (versão simplificada)
  exportButton.addEventListener("click", () => {
    chrome.storage.sync.get({ blockedSites: [] }, (data) => {
      // Processa a lista para extrair domínios base
      const baseDomains = data.blockedSites.reduce((acc, site) => {
        // Remove padrões e subdomínios
        const cleanDomain = site
          .replace('*://', '')
          .replace('/*', '')
          .replace(/\*\./g, '')
          .split('/')[0];

        // Evita duplicatas usando Set
        if (!acc.includes(cleanDomain)) {
          acc.push(cleanDomain);
        }
        return acc;
      }, []);

      // Cria conteúdo formatado
      const content = baseDomains.join('\n');
      
      // Gera arquivo para download
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

  // Aciona o input file ao clicar no botão de importação
  importButton.addEventListener("click", () => {
    importFile.click();
  });

  // No evento de importação, substitua:
  importFile.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      
      // Nova lógica para normalização completa
      const normalizedSites = lines.flatMap(line => {
        const rawDomain = line.trim().replace(/^"|"$/g, '');
        return normalizeURL(rawDomain);
      });

      // Remove duplicatas usando Set
      const uniqueSites = [...new Set(normalizedSites)];
      
      chrome.storage.sync.set({ blockedSites: uniqueSites }, () => {
        importFile.value = "";
      });
    };
    reader.readAsText(file);
  });
});
