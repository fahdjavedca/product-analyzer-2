// Debug script to help troubleshoot the extension
// Run this in the browser console on a CJ Dropshipping page

console.log('=== CJ Analyzer Debug Script ===');

// Check if we're on the right page
console.log('Current URL:', window.location.href);
console.log('Is CJ Dropshipping page:', window.location.href.includes('cjdropshipping.com'));

// Look for common product selectors
const selectors = [
  '.product-item',
  '.product-card', 
  '.item-card',
  '.product-list-item',
  '.goods-item',
  '.product-box',
  '.item-box',
  '[class*="product"]',
  '[class*="item"]',
  '[class*="goods"]',
  'div[class*="card"]',
  'div[class*="box"]'
];

console.log('\n=== Testing Selectors ===');
selectors.forEach(selector => {
  try {
    const elements = document.querySelectorAll(selector);
    console.log(`${selector}: ${elements.length} elements found`);
    if (elements.length > 0) {
      console.log('  First element:', elements[0]);
      console.log('  Text content:', elements[0].textContent?.substring(0, 100));
    }
  } catch (error) {
    console.log(`${selector}: Error - ${error.message}`);
  }
});

// Look for any divs that might be products
console.log('\n=== Looking for Product-like Elements ===');
const allDivs = document.querySelectorAll('div');
let productCandidates = [];

allDivs.forEach(div => {
  const hasImage = div.querySelector('img');
  const hasText = div.textContent && div.textContent.length > 10;
  const hasPrice = /\$[\d,]+\.?\d*/.test(div.textContent);
  const hasReasonableSize = div.offsetWidth > 100 && div.offsetHeight > 100;
  
  if (hasImage && hasText && hasPrice && hasReasonableSize) {
    productCandidates.push({
      element: div,
      text: div.textContent?.substring(0, 100),
      width: div.offsetWidth,
      height: div.offsetHeight,
      classes: div.className
    });
  }
});

console.log(`Found ${productCandidates.length} potential product elements:`);
productCandidates.slice(0, 5).forEach((candidate, index) => {
  console.log(`Candidate ${index + 1}:`, candidate);
});

// Look for specific CJ Dropshipping elements
console.log('\n=== CJ Dropshipping Specific Elements ===');
const cjSelectors = [
  '[data-testid*="product"]',
  '[data-testid*="item"]',
  '[data-testid*="goods"]',
  '.ant-card',
  '.ant-card-body',
  '.ant-list-item',
  '.ant-col'
];

cjSelectors.forEach(selector => {
  try {
    const elements = document.querySelectorAll(selector);
    console.log(`${selector}: ${elements.length} elements found`);
  } catch (error) {
    console.log(`${selector}: Error - ${error.message}`);
  }
});

// Check for common CJ Dropshipping patterns
console.log('\n=== CJ Dropshipping Patterns ===');
const patterns = [
  'Lists:',
  'QTY',
  'Free Shipping',
  'Up to',
  '% off'
];

patterns.forEach(pattern => {
  const elements = document.querySelectorAll('*');
  let count = 0;
  elements.forEach(el => {
    if (el.textContent && el.textContent.includes(pattern)) {
      count++;
    }
  });
  console.log(`"${pattern}": ${count} occurrences`);
});

console.log('\n=== Debug Complete ===');
console.log('If you see product candidates above, the extension should be able to detect them.');
console.log('If not, CJ Dropshipping may have changed their HTML structure.');

