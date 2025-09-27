import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import { logger } from '@/config/logger';

export interface AliExpressCategory {
  parent: string;
  sub: string;
  subSub: string;
  url: string;
}

export interface AliExpressProduct {
  id: string;
  title: string;
  description?: string;
  price?: string | number;
  currency?: string;
  image?: string;
  images?: string[];
  url?: string;
  vendorName?: string;
  categoryPath?: string[];
}

export class AliExpressService {
  /**
   * Scrape AliExpress mega menu categories by hovering "All Categories"
   * Returns array of { parent, sub, subSub, url }
   */
  async scrapeCategories(maxParents: number = 2): Promise<AliExpressCategory[]> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    });

    try {
      await page.goto('https://www.aliexpress.com/', { waitUntil: 'domcontentloaded' });

      // Hover All Categories to reveal mega menu
      await page.hover('text=All Categories');
      await page.waitForSelector('text=Recommended', { timeout: 12000 }).catch(() => {});

      // Parent categories - try multiple selectors
      const parentSelectors = [
        'li a',
        '.categories-list a',
        '[class*="category"] a',
        '.menu-item a'
      ];

      const parentTexts = new Set<string>();
      
      for (const selector of parentSelectors) {
        try {
          const elements = await page.locator(selector).all();
          for (const element of elements) {
            const text = await element.textContent();
            if (text && /^[A-Za-z].+/.test(text) && text.length < 60 && text.length > 2) {
              parentTexts.add(text.trim());
            }
          }
        } catch (error) {
          logger.warn(`Failed to scrape with selector ${selector}:`, error);
        }
      }

      const parents = Array.from(parentTexts).slice(0, maxParents);
      const results: AliExpressCategory[] = [];

      for (const parent of parents) {
        try {
          const parentEl = page.locator(`text=${parent}`).first();
          await parentEl.hover().catch(() => {});
          await page.waitForTimeout(500);

          // Capture sub and sub-sub from the right pane
          const items = await page.$$eval('a', links =>
            links
              .filter(a => {
                const parent = a.closest('[class*="sub"]') || a.closest('[class*="category"]');
                return parent && a.href && a.textContent?.trim();
              })
              .map(a => ({
                sub: a.closest('[class*="sub"]')?.querySelector('h3')?.textContent?.trim() ||
                     a.closest('[class*="category"]')?.querySelector('h3')?.textContent?.trim() || '',
                subSub: a.textContent?.trim() || '',
                url: a.href
              }))
              .filter(row => row.subSub && row.url && row.subSub.length > 2)
          );

          for (const row of items) {
            if (row.subSub && row.url) {
              results.push({ 
                parent, 
                sub: row.sub || 'General', 
                subSub: row.subSub, 
                url: row.url 
              });
            }
          }
        } catch (error) {
          logger.warn(`Failed to scrape subcategories for parent ${parent}:`, error);
        }
      }

      return results;

    } catch (error) {
      logger.error('Failed to scrape AliExpress categories:', error);
      throw new Error('Failed to scrape AliExpress categories');
    } finally {
      await browser.close();
    }
  }

  /**
   * Visit a category URL and extract product titles
   * Returns array of product titles from the first 10 products
   */
  async getProductTitles(url: string): Promise<string[]> {
    try {
      const response = await fetch(url, { 
        headers: { 
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' 
        } 
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);

      const titles: string[] = [];
      
      // Multiple selectors for product titles - AliExpress changes these frequently
      const titleSelectors = [
        '.manhattan--titleText--WccSjUS',
        'a[product-title]',
        '.multi--titleText--nXeOvyr',
        'a.product-title',
        '[class*="title"] a',
        '.item-title',
        '.product-title',
        'h3 a',
        '.title a'
      ];

      for (const selector of titleSelectors) {
        $(selector).each((i, el) => {
          if (titles.length < 10) {
            const title = $(el).text().trim();
            if (title && title.length > 5) {
              titles.push(title);
            }
          }
        });
        if (titles.length >= 10) break;
      }

      return titles.slice(0, 10);

    } catch (error) {
      logger.error(`Failed to get product titles from ${url}:`, error);
      return [];
    }
  }

  /**
   * Infer keywords from product titles
   * Returns comma-separated string of 6-10 high-intent keywords
   */
  inferKeywords(titles: string[]): string {
    if (titles.length === 0) return '';

    // Clean and normalize titles
    const cleaned = titles.map(title =>
      title
        .toLowerCase()
        .replace(/\b([a-z]{1,2}\d{2,}|[a-z0-9-]{3,})\b/gi, '') // Remove model codes
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    ).filter(Boolean);

    // Build n-gram candidates
    const uniq = Array.from(new Set(cleaned));
    const candidates = uniq
      .flatMap(text => {
        const words = text.split(' ').filter(Boolean);
        const grams: string[] = [];
        
        // Generate 1-3 word phrases
        for (let n = 1; n <= Math.min(3, words.length); n++) {
          for (let i = 0; i + n <= words.length; i++) {
            const phrase = words.slice(i, i + n).join(' ');
            if (phrase.length >= 3) { // Reduced from 5 to 3
              grams.push(phrase);
            }
          }
        }
        return grams;
      })
      .filter(phrase => phrase.length >= 3); // Reduced from 5 to 3

    // Remove duplicates and rank by frequency
    const phraseCounts = new Map<string, number>();
    candidates.forEach(phrase => {
      phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
    });

    const ranked = Array.from(phraseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([phrase]) => phrase)
      .slice(0, 10);

    // Fallback to original titles if no candidates found
    const result = ranked.slice(0, 8).join(', ') || uniq.slice(0, 6).join(', ');
    
    // If still empty, return some basic keywords from the original titles
    if (!result) {
      const basicKeywords = titles
        .map(title => title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 3);
      return basicKeywords.join(', ');
    }
    
    return result;
  }

  /**
   * Get full product data from a category URL
   */
  async getProducts(url: string): Promise<AliExpressProduct[]> {
    try {
      const response = await fetch(url, { 
        headers: { 
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' 
        } 
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);

      const products: AliExpressProduct[] = [];
      
      // Multiple selectors for product data
      const productSelectors = [
        '.manhattan--container--1lM3C',
        '.multi--container--1UZxx',
        '.item',
        '.product-item'
      ];

      for (const containerSelector of productSelectors) {
        $(containerSelector).each((i, el) => {
          if (products.length < 10) {
            const $el = $(el);
            const title = $el.find('[class*="title"], .product-title, h3 a').first().text().trim();
            const price = $el.find('[class*="price"], .price').first().text().trim();
            const image = $el.find('img').first().attr('src');
            const url = $el.find('a').first().attr('href');

            if (title && title.length > 5) {
              products.push({
                id: `aliexpress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title,
                description: title, // Use title as description for now
                price: price ? parseFloat(price.replace(/[^0-9.-]/g, '')) : undefined,
                currency: 'USD',
                image: image || undefined,
                images: image ? [image] : [],
                url: url || undefined,
                vendorName: 'AliExpress',
                categoryPath: []
              });
            }
          }
        });
        if (products.length >= 10) break;
      }

      return products.slice(0, 10);

    } catch (error) {
      logger.error(`Failed to get products from ${url}:`, error);
      return [];
    }
  }
}

export const aliexpressService = new AliExpressService();