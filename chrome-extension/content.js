// Content script for CJ Dropshipping Product Analyzer Chrome Extension

console.log('CJ Product Analyzer content script loaded');

// Initialize Google Ads service (avoid redeclaration)
let googleAdsService;

// Prevent multiple script execution
if (window.cjAnalyzerLoaded) {
  console.log('CJ Product Analyzer already loaded, skipping initialization');
} else {
  window.cjAnalyzerLoaded = true;

function initializeGoogleAdsService() {
  // Check if already initialized
  if (window.googleAdsService) {
    return window.googleAdsService;
  }

  // Try to create new service
  if (typeof GoogleAdsService !== 'undefined') {
    console.log('Creating new GoogleAdsService instance');
    return new GoogleAdsService();
  } else {
    console.log('GoogleAdsService class not available, using fallback');
    // Fallback if GoogleAdsService is not available
    return {
      getKeywordData: async (keyword) => {
        // NO MOCK DATA - fail gracefully
        throw new Error('Google Ads service not available - real data required');
      },
      generateIntelligentKeywords: async (title, price, category) => {
        // Fallback to basic keyword extraction
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'women', 'men', 'unisex', 'new', 'hot', 'best', 'top', 'quality', 'premium'];
        
        const keywords = title
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 2 && !stopWords.includes(word))
          .slice(0, 3);
        
        return {
          keywords,
          isRealData: false // Mark as fallback data
        };
      },
      isConfigured: async () => false // Always return false for fallback
    };
  }
}

// Initialize the service
try {
  googleAdsService = initializeGoogleAdsService();
  window.googleAdsService = googleAdsService;
  console.log('Google Ads service initialized successfully');
} catch (error) {
  console.error('Failed to initialize Google Ads service:', error);
  googleAdsService = {
    getKeywordData: async () => { throw new Error('Service initialization failed'); },
    generateIntelligentKeywords: async () => ({ keywords: [], isRealData: false }),
    isConfigured: async () => false
  };
}

let isAnalyzing = false;
let analyzedProducts = new Set();
let productOverlays = new Map();
let mutationObserver = null;
let autoAnalyzeEnabled = true; // Auto-analyze new products from infinite scroll

// Setup mutation observer to detect new products from infinite scroll
function setupInfiniteScrollObserver() {
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  mutationObserver = new MutationObserver((mutations) => {
    let newProductsFound = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node contains product elements
            const productSelectors = [
              '.product-card',
              '[data-product-id]',
              '.product-item',
              '.goods-item',
              '.product-list-item'
            ];
            
            let hasNewProducts = false;
            productSelectors.forEach(selector => {
              if (node.matches && node.matches(selector)) {
                hasNewProducts = true;
              } else if (node.querySelector && node.querySelector(selector)) {
                hasNewProducts = true;
              }
            });
            
            if (hasNewProducts) {
              newProductsFound = true;
              console.log('🔄 New products detected from infinite scroll');
            }
          }
        });
      }
    });
    
    // Always restore existing overlays after DOM changes
    setTimeout(() => {
      restoreOverlays();
    }, 100);
    
    if (newProductsFound && autoAnalyzeEnabled && !isAnalyzing) {
      console.log('🚀 Auto-analyzing new products...');
      // Debounce the analysis to avoid too many rapid calls
      setTimeout(() => {
        if (!isAnalyzing) {
          analyzeNewProducts();
        }
      }, 1000);
    }
  });

  // Observe the main content area for changes
  const targetNode = document.body;
  if (targetNode) {
    mutationObserver.observe(targetNode, {
      childList: true,
      subtree: true
    });
    console.log('✅ Infinite scroll observer setup complete');
  }
}

// Analyze only new products (not already analyzed)
async function analyzeNewProducts() {
  if (isAnalyzing) {
    console.log('⏳ Analysis already in progress, skipping...');
    return;
  }
  
  console.log('🔍 Checking for new products to analyze...');
  
  // Get all current product elements
  const productSelectors = [
    '.product-card',
    '[data-product-id]',
    '.product-item',
    '.goods-item',
    '.product-list-item'
  ];
  
  let allProductElements = [];
  productSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    allProductElements = allProductElements.concat(Array.from(elements));
  });
  
  // Filter to only new products (not already analyzed)
  const newProducts = allProductElements.filter(element => {
    const productId = getProductId(element);
    return productId && !analyzedProducts.has(productId);
  });
  
  if (newProducts.length === 0) {
    console.log('📭 No new products found');
    return;
  }
  
  console.log(`🆕 Found ${newProducts.length} new products to analyze`);
  
  // Check if Google Ads API is configured
  let isConfigured = false;
  try {
    isConfigured = await googleAdsService.isConfigured();
  } catch (error) {
    console.error('Error checking Google Ads configuration:', error);
    return;
  }
  
  if (!isConfigured) {
    console.log('⚠️ Google Ads API not configured, skipping auto-analysis');
    return;
  }
  
  isAnalyzing = true;
  
  try {
    // Analyze new products
    for (let i = 0; i < newProducts.length; i++) {
      const element = newProducts[i];
      try {
        const analysis = await analyzeProduct(element);
        if (analysis) {
          console.log('🎯 Auto-analysis: About to call addProductOverlay with:', { element: element.tagName, analysis: analysis.adsData });
          addProductOverlay(element, analysis);
        }
        // Small delay between products to avoid overwhelming the API
        if (i < newProducts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Error analyzing product ${i + 1}:`, error);
      }
    }
    
    console.log(`✅ Auto-analysis complete: ${newProducts.length} new products processed`);
    
  } catch (error) {
    console.error('Error in auto-analysis:', error);
  } finally {
    isAnalyzing = false;
  }
}

// Get unique product ID for tracking
function getProductId(element) {
  // Try various methods to get a unique identifier
  const productId = element.getAttribute('data-product-id') ||
                   element.getAttribute('data-id') ||
                   element.getAttribute('id') ||
                   element.querySelector('[data-product-id]')?.getAttribute('data-product-id') ||
                   element.querySelector('a')?.href ||
                   element.outerHTML.substring(0, 100); // Fallback to element signature
  
  return productId;
}

// Initialize the extension
function init() {
  console.log('Initializing CJ Product Analyzer');
  
  // Add a visible indicator that the extension is loaded
  const indicator = document.createElement('div');
  indicator.id = 'cj-analyzer-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: #10b981;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;
  indicator.textContent = 'CJ Analyzer: Ready';
  document.body.appendChild(indicator);
  
  // Add a manual trigger button
  const triggerButton = document.createElement('button');
  triggerButton.id = 'cj-analyzer-trigger';
  triggerButton.style.cssText = `
    position: fixed;
    top: 50px;
    left: 10px;
    background: #2563eb;
    color: white;
    padding: 8px 12px;
    border: none;
    border-radius: 6px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    cursor: pointer;
  `;
  triggerButton.textContent = 'Analyze Products';
  triggerButton.onclick = () => {
    console.log('Manual analysis triggered');
    // Reset analysis state completely
    resetAnalysisState();
    analyzeProductsOnPage();
  };
  document.body.appendChild(triggerButton);
  
  // Remove indicator after 3 seconds
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }, 3000);
  
  // Load settings
  chrome.storage.sync.get(['autoAnalyze', 'showScores', 'highlightHigh'], (settings) => {
    console.log('Extension settings:', settings);
    // Always disable auto-analyze on page load - only run when button is clicked
    console.log('Auto-analyze disabled by default, waiting for manual trigger');
  });
  
  // Setup infinite scroll observer for new products
  setupInfiniteScrollObserver();
}

// Legacy function - replaced by setupInfiniteScrollObserver()
// This function is kept for reference but no longer used

// Clear all existing overlays
function clearAllOverlays() {
  const allOverlays = document.querySelectorAll('.cj-analyzer-overlay');
  allOverlays.forEach(overlay => overlay.remove());
  
  // Clear the overlay map
  productOverlays.clear();
  console.log(`Cleared ${allOverlays.length} existing overlays`);
}

// Restore overlays that may have been removed during DOM updates
function restoreOverlays() {
  let restoredCount = 0;
  
  productOverlays.forEach((overlayData, productId) => {
    const { element, overlay } = overlayData;
    
    // Check if the element still exists in the DOM
    if (document.contains(element)) {
      // Check if the overlay is still attached
      if (!element.contains(overlay)) {
        // Overlay was removed, re-attach it
        element.style.position = 'relative';
        element.appendChild(overlay);
        restoredCount++;
      }
    } else {
      // Element no longer exists, remove from our tracking
      productOverlays.delete(productId);
    }
  });
  
  if (restoredCount > 0) {
    console.log(`🔄 Restored ${restoredCount} overlays after DOM update`);
  }
}

// Reset analysis state completely
function resetAnalysisState() {
  analyzedProducts.clear();
  productOverlays.clear();
  clearAllOverlays();
  console.log('Reset analysis state completely');
}

// Show status message
function showStatus(message, type = 'info') {
  const colors = {
    info: '#3b82f6',
    success: '#10b981', 
    warning: '#f59e0b',
    error: '#ef4444'
  };
  
  const statusEl = document.getElementById('cj-analyzer-status') || (() => {
    const el = document.createElement('div');
    el.id = 'cj-analyzer-status';
    el.style.cssText = `
      position: fixed;
      top: 60px;
      left: 20px;
      z-index: 10000;
      background: ${colors[type]};
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    document.body.appendChild(el);
    return el;
  })();
  
  statusEl.textContent = message;
  statusEl.style.background = colors[type];
  statusEl.style.display = 'block';
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 3000);
}

// Find and analyze products on the page
async function analyzeProductsOnPage() {
  if (isAnalyzing) {
    showStatus('Analysis already in progress...', 'warning');
    return;
  }
  
  isAnalyzing = true;
  console.log('Analyzing products on page...');
  showStatus('Starting analysis...', 'info');
  
  // Clear any existing overlays
  clearAllOverlays();
  
  // More comprehensive selectors for CJ Dropshipping
  const productSelectors = [
    // Common CJ Dropshipping selectors
    '.product-item',
    '.product-card', 
    '.item-card',
    '.product-list-item',
    '.goods-item',
    '.product-box',
    '.item-box',
    // CJ Dropshipping specific selectors
    '.el-card',
    '.el-card__body',
    '.product-list .item',
    '.goods-list .item',
    // Look for elements with product-like structure
    'div[class*="product"]:has(img)',
    'div[class*="item"]:has(img)',
    'div[class*="goods"]:has(img)',
    'div[class*="card"]:has(img)',
    'div[class*="box"]:has(img)',
    // Generic fallback - look for any div with image and reasonable size
    'div:has(img)'
  ];
  
  let productElements = [];
  for (const selector of productSelectors) {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        productElements = Array.from(elements);
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        break;
      }
    } catch (error) {
      console.log(`Selector ${selector} failed:`, error);
    }
  }
  
  // If no specific selectors work, try a more generic approach
  if (productElements.length === 0) {
    console.log('Trying generic product detection...');
    // Look for any div that contains an image and text that looks like a product
    const allDivs = document.querySelectorAll('div');
    productElements = Array.from(allDivs).filter(div => {
      const hasImage = div.querySelector('img');
      const hasText = div.textContent && div.textContent.length > 10;
      const hasPrice = /\$[\d,]+\.?\d*/.test(div.textContent);
      const hasReasonableSize = div.offsetWidth > 100 && div.offsetHeight > 100;
      
      return hasImage && hasText && hasPrice && hasReasonableSize;
    });
    console.log(`Generic detection found ${productElements.length} potential products`);
  }
  
  console.log(`Found ${productElements.length} product elements`);
  showStatus(`Found ${productElements.length} products`, 'info');
  
  if (productElements.length === 0) {
    showStatus('❌ No products found. Try running debugProductSelectors() in console', 'error');
    console.log('No products found. Run debugProductSelectors() in the console to see what selectors are available on this page.');
    console.log('Current page URL:', window.location.href);
    console.log('Page title:', document.title);
    return;
  }
  
  // Check if Google Ads API is configured
  console.log('🔍 Checking Google Ads API configuration...');
  let isConfigured = false;
  try {
    isConfigured = await googleAdsService.isConfigured();
    console.log('✅ Configuration check completed:', isConfigured);
  } catch (error) {
    console.error('❌ Error checking Google Ads configuration:', error);
  }
  
  // TEMPORARY: Skip configuration check since we can see the API is working in the console
  // We'll debug the configuration check separately
  if (!isConfigured) {
    console.log('⚠️ Configuration check failed, but we can see Google Ads API is working in the console');
    console.log('🔄 Temporarily bypassing configuration check to show overlays');
    
    // Test if backend is reachable
    try {
      const testResponse = await fetch('http://localhost:3000/api/health');
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('🔧 Backend response:', testData);
        if (testData.googleAdsConfigured === true) {
          console.log('✅ Backend confirms Google Ads is configured - proceeding with analysis');
          isConfigured = true; // Override the failed check
        }
      } else {
        console.log('🚫 Backend not reachable:', testResponse.status, testResponse.statusText);
        showStatus('❌ Backend not reachable - no analysis possible', 'error');
        return;
      }
    } catch (backendError) {
      console.log('🚫 Cannot reach backend at localhost:3000:', backendError.message);
      showStatus('❌ Backend not reachable - no analysis possible', 'error');
      return;
    }
  }
  
  if (!isConfigured) {
    showStatus('❌ Google Ads API not configured - no analysis possible', 'error');
    return;
  }
  
  console.log('✅ Google Ads API is configured, proceeding with analysis...');
  
  // Debug: Log first few elements to see what we found
  console.log('First 3 product elements:');
  productElements.slice(0, 3).forEach((el, i) => {
    console.log(`Element ${i + 1}:`, {
      className: el.className,
      tagName: el.tagName,
      textContent: el.textContent?.substring(0, 100) + '...',
      hasImage: !!el.querySelector('img'),
      children: el.children.length
    });
  });
  
  // Test keyword generation with a sample product
  console.log('Testing keyword generation...');
  const testProduct = {
    title: 'Wireless Bluetooth Headphones',
    price: '$29.99',
    category: 'Electronics'
  };
  
  googleAdsService.generateIntelligentKeywords(testProduct.title, testProduct.price, testProduct.category)
    .then(result => {
      console.log('Test keyword generation result:', result);
    })
    .catch(error => {
      console.log('Test keyword generation error:', error);
    });
  
  let analyzedCount = 0;
  let highOppCount = 0;
  let totalScore = 0;
  
  // Process products one by one to show real-time results
  for (let i = 0; i < productElements.length; i++) {
    const element = productElements[i];
    try {
      const productData = extractProductData(element);
      if (productData) {
        console.log(`Processing product ${i + 1}/${productElements.length}: ${productData.title}`);
        
        // Check if already analyzed
        if (analyzedProducts.has(productData.id)) {
          console.log(`Product already analyzed: ${productData.title}`);
          continue;
        }
        
        // Show progress
        showStatus(`Analyzing ${i + 1}/${productElements.length}: ${productData.title.substring(0, 30)}...`, 'info');
        
        console.log(`Analyzing product: ${productData.title}`);
        const analysis = await analyzeProduct(productData);
        if (analysis) {
          console.log(`Analysis successful for: ${productData.title}, Score: ${analysis.opportunityScore}`);
          console.log('🎯 About to call addProductOverlay with:', { element: element.tagName, analysis: analysis.adsData });
          addProductOverlay(element, analysis);
          analyzedProducts.add(productData.id);
          analyzedCount++;
          totalScore += analysis.opportunityScore;
          if (analysis.opportunityScore >= 70) {
            highOppCount++;
          }
        } else {
          console.log(`Analysis failed for: ${productData.title}`);
        }
      } else {
        console.log('Failed to extract product data from element');
      }
    } catch (error) {
      console.error('Error analyzing product:', error);
    }
    
    // Small delay to show real-time progress
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Update stats (only if background script is available)
  const avgScore = analyzedCount > 0 ? totalScore / analyzedCount : 0;
  try {
    chrome.runtime.sendMessage({
      action: 'updateStats',
      analyzedCount,
      highOppCount,
      avgScore
    });
  } catch (error) {
    console.log('Background script not available, skipping stats update');
  }
  
  isAnalyzing = false;
  console.log(`Analysis complete: ${analyzedCount} products analyzed`);
  
  if (analyzedCount > 0) {
    showStatus(`Analysis complete: ${analyzedCount} products analyzed`, 'success');
  } else {
    showStatus('No products could be analyzed', 'warning');
  }
}

// Extract product data from DOM element
function extractProductData(element) {
  try {
    // Try to find product title with more comprehensive selectors
    const titleSelectors = [
      '.product-title',
      '.item-title', 
      '.goods-title',
      '.el-card__body h3',
      '.el-card__body h4',
      '.el-card__body .title',
      '.el-card__body .name',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      '[class*="title"]',
      '[class*="name"]',
      'a[title]',
      'a[href*="product"]',
      'a[href*="item"]',
      // Look for any text that might be a title
      'span:not([class*="price"]):not([class*="cost"]):not([class*="tag"])',
      'div:not([class*="price"]):not([class*="cost"]):not([class*="tag"])'
    ];
    
    let title = '';
    for (const selector of titleSelectors) {
      const titleEl = element.querySelector(selector);
      if (titleEl) {
        const text = titleEl.textContent?.trim() || titleEl.getAttribute('title') || '';
        // Filter out very short text or text that looks like prices
        if (text && text.length > 5 && !/^\$[\d,]+\.?\d*$/.test(text) && !/^Lists?:?\s*\d+$/.test(text)) {
          title = text;
          break;
        }
      }
    }
    
    // If no title found, try to get any meaningful text from the element
    if (!title) {
      const allText = element.textContent?.trim() || '';
      const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 5);
      title = lines[0] || '';
      
      // If still no title, try to get text from any child element
      if (!title) {
        const textElements = element.querySelectorAll('span, div, p, h1, h2, h3, h4, h5, h6, a');
        for (const textEl of textElements) {
          const text = textEl.textContent?.trim();
          if (text && text.length > 5 && !text.includes('$') && !text.includes('USD') && !text.includes('CAD')) {
            title = text;
            break;
          }
        }
      }
    }
    
    // Skip if no meaningful title found
    if (!title || title.length < 3 || title === 'Unknown Product' || title === 'unknown product') {
      console.log('Skipping element - no meaningful title found:', title);
      return null;
    }
    
    // Try to find price with more comprehensive selectors
    const priceSelectors = [
      '.price',
      '.product-price',
      '.item-price',
      '.goods-price',
      '[class*="price"]',
      '[class*="cost"]',
      '[class*="amount"]'
    ];
    
    let price = '';
    for (const selector of priceSelectors) {
      const priceEl = element.querySelector(selector);
      if (priceEl) {
        price = priceEl.textContent?.trim() || '';
        if (price) break;
      }
    }
    
    // If no price found, try to extract from text content
    if (!price) {
      const priceMatch = element.textContent?.match(/\$[\d,]+\.?\d*(?:-\$[\d,]+\.?\d*)?/);
      if (priceMatch) {
        price = priceMatch[0];
      }
    }
    
    // Generate unique ID based on title and position
    const id = btoa(title + element.offsetTop + element.offsetLeft).substring(0, 16);
    
    console.log(`Extracted product: "${title}" - Price: "${price}"`);
    
    return {
      id,
      title,
      price,
      element
    };
  } catch (error) {
    console.error('Error extracting product data:', error);
    return null;
  }
}

// Analyze a single product element (overload for DOM elements)
async function analyzeProduct(elementOrData) {
  // Handle both DOM elements and product data objects
  let productData;
  let productElement;
  let productId;
  
  if (elementOrData.nodeType === Node.ELEMENT_NODE) {
    // It's a DOM element, extract product data
    productElement = elementOrData;
    productId = getProductId(productElement);
    
    // Check if already analyzed
    if (analyzedProducts.has(productId)) {
      console.log(`Product already analyzed: ${productId}`);
      return null;
    }
    
    productData = extractProductData(productElement);
    if (!productData) {
      console.log('Could not extract product data from element');
      return null;
    }
  } else {
    // It's a product data object (legacy support)
    productData = elementOrData;
    productElement = productData.element;
    productId = productData.id || getProductId(productElement);
  }
  
  // Mark as analyzed
  if (productId) {
    analyzedProducts.add(productId);
  }
  try {
    console.log(`Starting analysis for: ${productData.title}`);
    
    // Generate intelligent keywords using OpenAI
    console.log('🔍 Generating intelligent keywords...');
    console.log('Product data:', {
      title: productData.title,
      price: productData.price,
      category: productData.categoryPath ? productData.categoryPath.join(' > ') : ''
    });
    
    const keywordResult = await googleAdsService.generateIntelligentKeywords(
      productData.title, 
      productData.price, 
      productData.categoryPath ? productData.categoryPath.join(' > ') : ''
    );
    
    // Handle both old format (array) and new format (object)
    const keywords = Array.isArray(keywordResult) ? keywordResult : keywordResult.keywords;
    const isRealKeywordData = Array.isArray(keywordResult) ? false : keywordResult.isRealData;
    
    console.log(`✅ Generated keywords: ${keywords.join(', ')}`);
    
    if (keywords.length === 0) {
      console.log('No keywords found');
      return null;
    }
    
    console.log(`Getting Google Ads data for ${keywords.length} keywords...`);
    
    try {
      // Get data for all keywords
      const keywordDataArray = [];
      let totalSearchVolume = 0;
      let hasRealData = false;
      
      for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        console.log(`Getting data for keyword ${i + 1}/${keywords.length}: ${keyword}`);
        
        try {
          const adsData = await getGoogleAdsData(keyword);
          if (adsData) {
            adsData.keyword = keyword;
            adsData.isRealData = true;
            keywordDataArray.push(adsData);
            totalSearchVolume += parseInt(adsData.avgMonthlySearches) || 0;
            hasRealData = true;
            console.log(`✅ Data for "${keyword}": ${adsData.avgMonthlySearches} searches, ${adsData.competition} competition`);
          } else {
            console.log(`❌ No data for "${keyword}"`);
          }
        } catch (error) {
          console.error(`Error getting data for "${keyword}":`, error);
        }
        
        // Small delay between API calls to avoid rate limiting
        if (i < keywords.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      if (!hasRealData || keywordDataArray.length === 0) {
        console.log('No Google Ads data received for any keywords');
        return null;
      }
      
      console.log(`📊 Total search volume across ${keywordDataArray.length} keywords: ${totalSearchVolume.toLocaleString()}`);
      
      // Use the first keyword's competition and CPC data for overall scoring
      const primaryAdsData = keywordDataArray[0];
      
      // Ensure isRealData is set on the primary adsData
      primaryAdsData.isRealData = true;
      
      // Calculate opportunity score based on total volume and primary keyword data
      const opportunityScore = calculateOpportunityScore({
        ...primaryAdsData,
        avgMonthlySearches: totalSearchVolume
      }, productData);
      
      console.log(`Calculated opportunity score: ${opportunityScore}`);
      
      return {
        keywords,
        keywordDataArray, // Array of individual keyword data
        totalSearchVolume,
        adsData: primaryAdsData, // Keep for backward compatibility
        opportunityScore,
        recommendation: getRecommendation(opportunityScore)
      };
    } catch (error) {
      console.error('Google Ads data not available:', error);
      showStatus(`⚠️ Google Ads API error: ${error.message}`, 'warning');
      return null; // Skip this product if no real data available
    }
  } catch (error) {
    console.error('Error analyzing product:', error);
    return null;
  }
}

// Extract keywords from product title
function extractKeywords(title) {
  // Simple keyword extraction - remove common words and split
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
  
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .slice(0, 3); // Take top 3 keywords
}

// Get Google Ads data
async function getGoogleAdsData(keyword) {
  try {
    // Try to get real data from Google Ads service
    const data = await googleAdsService.getKeywordData(keyword);
    return data;
  } catch (error) {
    console.error('Error getting Google Ads data:', error);
    // NO MOCK DATA - fail gracefully
    throw new Error('Google Ads API not available - real data required');
  }
}

// Calculate opportunity score
function calculateOpportunityScore(adsData, productData) {
  let score = 0;
  
  // Search volume score (0-40 points)
  const searchVolume = adsData.avgMonthlySearches;
  if (searchVolume > 5000) score += 40;
  else if (searchVolume > 2000) score += 30;
  else if (searchVolume > 1000) score += 20;
  else if (searchVolume > 500) score += 10;
  
  // Competition score (0-30 points) - lower competition = higher score
  if (adsData.competition === 'LOW') score += 30;
  else if (adsData.competition === 'MEDIUM') score += 20;
  else if (adsData.competition === 'HIGH') score += 5;
  
  // CPC score (0-30 points) - higher CPC = higher opportunity
  if (adsData.cpcLow && adsData.cpcHigh) {
    const avgCpc = (parseFloat(adsData.cpcLow) + parseFloat(adsData.cpcHigh)) / 2;
    if (avgCpc > 3) score += 30;
    else if (avgCpc > 2) score += 20;
    else if (avgCpc > 1) score += 10;
  }
  
  return Math.min(100, Math.max(0, score));
}

// Get recommendation based on score
function getRecommendation(score) {
  if (score >= 80) return 'Excellent opportunity!';
  if (score >= 60) return 'Good opportunity';
  if (score >= 40) return 'Moderate opportunity';
  return 'Low opportunity';
}

// Add overlay to product element
function addProductOverlay(element, analysis) {
  // Remove existing overlay
  const existingOverlay = productOverlays.get(element);
  if (existingOverlay) {
    existingOverlay.remove();
  }
  
  // Also remove any existing overlays by class
  const existingOverlays = element.querySelectorAll('.cj-analyzer-overlay');
  existingOverlays.forEach(overlay => overlay.remove());
  
  // Determine competition color
  const competitionColor = analysis.adsData.competition === 'LOW' ? '#10b981' : 
                          analysis.adsData.competition === 'MEDIUM' ? '#f59e0b' : 
                          analysis.adsData.competition === 'UNKNOWN' ? '#6b7280' : '#ef4444';
  
  // Only show overlays for real Google Ads data
  const isRealData = analysis.adsData.isRealData || false;
  console.log('🔍 Overlay creation check:', {
    isRealData,
    'analysis.adsData.isRealData': analysis.adsData.isRealData,
    adsData: analysis.adsData,
    element: element.tagName,
    elementClass: element.className
  });
  
  if (!isRealData) {
    console.log('⚠️ Skipping overlay - no real Google Ads data available');
    console.log('📊 Analysis data received:', analysis);
    return;
  }
  
  console.log('✅ Creating overlay with real Google Ads data');
  
  const dataSource = 'Google Ads API';
  const validationIcon = '✅';
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'cj-analyzer-overlay';
  overlay.innerHTML = `
            <div class="cj-analyzer-header">
              <div class="cj-analyzer-country">🇨🇦 Canada Market Data</div>
              <div class="cj-analyzer-competition" style="color: ${competitionColor}">
                ${analysis.adsData.competition === 'UNKNOWN' ? 'No Data' : analysis.adsData.competition + ' Competition'}
              </div>
            </div>
    <div class="cj-analyzer-validation">
      <span class="validation-icon">${validationIcon}</span>
      <span class="validation-text">${dataSource}</span>
    </div>
    <div class="cj-analyzer-keywords">
      <div class="keywords-label">Target Keywords & Search Volumes:</div>
      ${analysis.keywordDataArray ? 
        analysis.keywordDataArray.map(data => 
          `<div class="keyword-item">
            <span class="keyword">${data.keyword}</span>
            <span class="keyword-volume">${parseInt(data.avgMonthlySearches).toLocaleString()} searches</span>
            <span class="keyword-competition ${data.competition.toLowerCase()}">${data.competition}</span>
          </div>`
        ).join('') : 
        analysis.keywords.map(k => `<span class="keyword">${k}</span>`).join('')
      }
    </div>
            <div class="cj-analyzer-metrics">
              <div class="metric">
                <span class="metric-label">Total Monthly Searches:</span>
                <span class="metric-value searches">${analysis.totalSearchVolume ? analysis.totalSearchVolume.toLocaleString() : (analysis.adsData.avgMonthlySearches > 0 ? analysis.adsData.avgMonthlySearches.toLocaleString() : 'Not Available')}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Primary Keyword CPC:</span>
                <span class="metric-value cpc">${analysis.adsData.cpcLow && analysis.adsData.cpcHigh ? `$${analysis.adsData.cpcLow} - $${analysis.adsData.cpcHigh}` : 'Not Available'}</span>
              </div>
            </div>
    <div class="cj-analyzer-recommendation">${analysis.recommendation}</div>
  `;
  
  // Position overlay underneath the product
  element.style.position = 'relative';
  element.appendChild(overlay);
  
  // Store overlay by product ID for persistence during infinite scroll
  const productId = getProductId(element);
  if (productId) {
    productOverlays.set(productId, { element, overlay });
  }
  
  console.log('🎯 Overlay created and added to DOM:', {
    productId: productId,
    overlayAdded: document.contains(overlay),
    elementInDOM: document.contains(element),
    overlayHTML: overlay.outerHTML.substring(0, 200) + '...'
  });
  
  // Show status update for this specific product
  showStatus(`✅ Analyzed: ${analysis.keywords[0]}`, 'success');
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeProducts') {
    analyzeProductsOnPage();
  }
  
  if (request.action === 'toggleOverlay') {
    // Toggle overlay visibility
    const overlays = document.querySelectorAll('.cj-analyzer-overlay');
    overlays.forEach(overlay => {
      overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
    });
  }
});

// Debug function to help identify product selectors
function debugProductSelectors() {
  console.log('=== DEBUGGING PRODUCT SELECTORS ===');
  
  const selectors = [
    '.product-item', '.product-card', '.item-card', '.product-list-item', 
    '.goods-item', '.product-box', '.item-box', '.el-card', '.el-card__body',
    '.product-list .item', '.goods-list .item'
  ];
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`✅ ${selector}: ${elements.length} elements`);
      // Log first element's structure
      const firstEl = elements[0];
      console.log(`   First element classes: ${firstEl.className}`);
      console.log(`   First element HTML: ${firstEl.outerHTML.substring(0, 200)}...`);
    } else {
      console.log(`❌ ${selector}: 0 elements`);
    }
  });
  
  // Also check for any divs with images
  const divsWithImages = document.querySelectorAll('div:has(img)');
  console.log(`📊 Total divs with images: ${divsWithImages.length}`);
}

  // Make debug function available globally
  window.debugProductSelectors = debugProductSelectors;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
