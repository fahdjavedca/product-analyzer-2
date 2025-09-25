// Popup script for CJ Dropshipping Product Analyzer Chrome Extension

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const statsEl = document.getElementById('stats');
  const analyzedCountEl = document.getElementById('analyzedCount');
  const highOppCountEl = document.getElementById('highOppCount');
  const avgScoreEl = document.getElementById('avgScore');
  
  const autoAnalyzeToggle = document.getElementById('autoAnalyze');
  const showScoresToggle = document.getElementById('showScores');
  const highlightHighToggle = document.getElementById('highlightHigh');

  // Load settings
  const settings = await chrome.storage.sync.get({
    autoAnalyze: false, // Always false by default
    showScores: true,
    highlightHigh: true
  });

  autoAnalyzeToggle.classList.toggle('active', settings.autoAnalyze);
  showScoresToggle.classList.toggle('active', settings.showScores);
  highlightHighToggle.classList.toggle('active', settings.highlightHigh);

  // Check if we're on a CJ Dropshipping page
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isCJPage = tab.url && tab.url.includes('cjdropshipping.com');
  
  if (isCJPage) {
    statusEl.textContent = 'Extension is active on this page';
    statusEl.className = 'status active';
    analyzeBtn.disabled = false;
    
    // Load stats
    const stats = await chrome.storage.local.get({
      analyzedCount: 0,
      highOppCount: 0,
      avgScore: 0
    });
    
    if (stats.analyzedCount > 0) {
      statsEl.style.display = 'block';
      analyzedCountEl.textContent = stats.analyzedCount;
      highOppCountEl.textContent = stats.highOppCount;
      avgScoreEl.textContent = stats.avgScore.toFixed(1);
    }
  } else {
    statusEl.textContent = 'Navigate to CJ Dropshipping to use this extension';
    statusEl.className = 'status inactive';
    analyzeBtn.disabled = true;
  }

  // Toggle handlers
  autoAnalyzeToggle.addEventListener('click', async () => {
    const isActive = autoAnalyzeToggle.classList.contains('active');
    autoAnalyzeToggle.classList.toggle('active');
    await chrome.storage.sync.set({ autoAnalyze: !isActive });
  });

  showScoresToggle.addEventListener('click', async () => {
    const isActive = showScoresToggle.classList.contains('active');
    showScoresToggle.classList.toggle('active');
    await chrome.storage.sync.set({ showScores: !isActive });
  });

  highlightHighToggle.addEventListener('click', async () => {
    const isActive = highlightHighToggle.classList.contains('active');
    highlightHighToggle.classList.toggle('active');
    await chrome.storage.sync.set({ highlightHigh: !isActive });
  });


  // Analyze button handler
  analyzeBtn.addEventListener('click', async () => {
    if (!isCJPage) return;
    
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
    
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'analyzeProducts' });
      
      // Wait a moment for analysis to complete
      setTimeout(async () => {
        const stats = await chrome.storage.local.get({
          analyzedCount: 0,
          highOppCount: 0,
          avgScore: 0
        });
        
        statsEl.style.display = 'block';
        analyzedCountEl.textContent = stats.analyzedCount;
        highOppCountEl.textContent = stats.highOppCount;
        avgScoreEl.textContent = stats.avgScore.toFixed(1);
        
        analyzeBtn.textContent = 'Re-analyze Products';
        analyzeBtn.disabled = false;
      }, 2000);
      
    } catch (error) {
      console.error('Error analyzing products:', error);
      analyzeBtn.textContent = 'Analyze Products on Page';
      analyzeBtn.disabled = false;
    }
  });
});
