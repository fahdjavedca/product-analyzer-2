import { googleAdsService, KeywordMetrics } from './googleAdsService';
import { logger } from '@/config/logger';

export interface KeywordExtractionResult {
  mainKeywords: string[];
  seedKeywords: string[];
  expandedKeywords: KeywordMetrics[];
}

export interface KeywordScore {
  keyword: string;
  score: number;
  metrics: KeywordMetrics;
  opportunity: 'high' | 'medium' | 'low';
}

export class KeywordService {
  /**
   * Extract main keywords from product title
   * Abstracts the actual product keyword from keyword-stuffed titles
   */
  extractMainKeywords(title: string): string[] {
    // Remove common dropshipping keywords and extract core product terms
    const stopWords = [
      'dropship', 'dropshipping', 'wholesale', 'bulk', 'cheap', 'affordable',
      'best', 'top', 'quality', 'premium', 'new', 'hot', 'trending', '2024',
      'free', 'shipping', 'fast', 'quick', 'easy', 'simple', 'amazing',
      'incredible', 'fantastic', 'perfect', 'excellent', 'outstanding'
    ];

    // Clean and split title
    const cleanedTitle = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Split into words and filter out stop words
    const words = cleanedTitle.split(' ')
      .filter(word => word.length > 2 && !stopWords.includes(word));

    // Extract potential main keywords (2-3 word phrases)
    const mainKeywords: string[] = [];
    
    // Single word keywords
    words.forEach(word => {
      if (word.length > 3) {
        mainKeywords.push(word);
      }
    });

    // Two word phrases
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (phrase.length > 5) {
        mainKeywords.push(phrase);
      }
    }

    // Three word phrases (only if title is long enough)
    if (words.length > 4) {
      for (let i = 0; i < words.length - 2; i++) {
        const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (phrase.length > 8) {
          mainKeywords.push(phrase);
        }
      }
    }

    // Remove duplicates and return top keywords
    return [...new Set(mainKeywords)].slice(0, 10);
  }

  /**
   * Generate seed keywords for Google Ads API
   */
  generateSeedKeywords(title: string, mainKeywords: string[]): string[] {
    const seedKeywords = new Set<string>();

    // Add main keywords
    mainKeywords.forEach(keyword => {
      if (keyword.length > 3) {
        seedKeywords.add(keyword);
      }
    });

    // Add variations of main keywords
    mainKeywords.forEach(keyword => {
      const words = keyword.split(' ');
      if (words.length > 1) {
        // Add individual words
        words.forEach(word => {
          if (word.length > 3) {
            seedKeywords.add(word);
          }
        });
      }
    });

    return Array.from(seedKeywords).slice(0, 20);
  }

  /**
   * Calculate keyword opportunity score
   */
  calculateKeywordScore(metrics: KeywordMetrics): number {
    const { avgMonthlySearches, competition, cpcLow, cpcHigh } = metrics;
    
    // Weighted scoring formula
    const searchVolumeScore = Math.min(avgMonthlySearches / 10000, 1) * 0.3;
    const competitionScore = (1 - competition) * 0.3;
    const cpcScore = Math.min((cpcLow + cpcHigh) / 2 / 5, 1) * 0.4;
    
    return (searchVolumeScore + competitionScore + cpcScore) * 100;
  }

  /**
   * Categorize opportunity level
   */
  getOpportunityLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Analyze keywords for a product
   */
  async analyzeKeywords(title: string, country: string = 'US'): Promise<KeywordExtractionResult> {
    try {
      // Extract main keywords from title
      const mainKeywords = this.extractMainKeywords(title);
      
      // Generate seed keywords
      const seedKeywords = this.generateSeedKeywords(title, mainKeywords);
      
      // Get expanded keywords from Google Ads API
      const expandedKeywords = await googleAdsService.getKeywordMetrics({
        keywords: seedKeywords,
        country,
        language: 'en',
      });

      return {
        mainKeywords,
        seedKeywords,
        expandedKeywords,
      };

    } catch (error) {
      logger.error('Failed to analyze keywords:', error);
      throw new Error('Failed to analyze keywords');
    }
  }

  /**
   * Score and rank keywords
   */
  scoreKeywords(keywords: KeywordMetrics[]): KeywordScore[] {
    return keywords
      .map(metrics => ({
        keyword: metrics.keyword,
        score: this.calculateKeywordScore(metrics),
        metrics,
        opportunity: this.getOpportunityLevel(this.calculateKeywordScore(metrics)),
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get top performing keywords
   */
  getTopKeywords(keywords: KeywordScore[], limit: number = 10): KeywordScore[] {
    return keywords
      .filter(k => k.opportunity === 'high' || k.opportunity === 'medium')
      .slice(0, limit);
  }
}

export const keywordService = new KeywordService();
