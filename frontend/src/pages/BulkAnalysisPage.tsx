import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  DocumentArrowDownIcon, 
  PlayIcon, 
  StopIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface BulkAnalysisResult {
  categories: CategoryAnalysisResult[];
  summary: {
    totalCategories: number;
    totalKeywords: number;
    avgMonthlySearches: number;
    highOpportunityKeywords: number;
  };
}

interface CategoryAnalysisResult {
  parent: string;
  sub: string;
  subSub: string;
  url: string;
  inferredKeywords: string;
  productTitles: string[];
  keywordAnalysis: KeywordAnalysisResult[];
}

interface KeywordAnalysisResult {
  keyword: string;
  avgMonthlySearches: number;
  competition: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  cpcLow: number;
  cpcHigh: number;
  opportunityScore: number;
  opportunityLevel: 'high' | 'medium' | 'low';
  googleApiVerified: boolean;
}

interface AnalysisStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
}

export default function BulkAnalysisPage() {
  const [activeTab, setActiveTab] = useState<'aliexpress' | 'custom'>('aliexpress');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<BulkAnalysisResult | null>(null);
  const [customTitles, setCustomTitles] = useState('');
  const [maxCategories, setMaxCategories] = useState(3);
  const [country, setCountry] = useState('US');
  const [includeProductTitles, setIncludeProductTitles] = useState(true);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  const initializeAnalysisSteps = (type: 'aliexpress' | 'custom') => {
    const steps: AnalysisStep[] = type === 'aliexpress' 
      ? [
          { id: 'scraping', name: 'Scraping AliExpress Categories', status: 'pending' },
          { id: 'extracting', name: 'Extracting Product Titles', status: 'pending' },
          { id: 'inferring', name: 'Inferring Keywords', status: 'pending' },
          { id: 'analyzing', name: 'Analyzing Keywords with Google Ads', status: 'pending' },
          { id: 'generating', name: 'Generating Excel Report', status: 'pending' }
        ]
      : [
          { id: 'processing', name: 'Processing Custom Titles', status: 'pending' },
          { id: 'inferring', name: 'Inferring Keywords', status: 'pending' },
          { id: 'analyzing', name: 'Analyzing Keywords with Google Ads', status: 'pending' },
          { id: 'generating', name: 'Generating Excel Report', status: 'pending' }
        ];
    
    setAnalysisSteps(steps);
    setCurrentStep(null);
  };

  const updateStepStatus = (stepId: string, status: AnalysisStep['status'], message?: string) => {
    setAnalysisSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, message }
        : step
    ));
    setCurrentStep(stepId);
  };

  const runAliExpressAnalysis = async () => {
    setIsAnalyzing(true);
    initializeAnalysisSteps('aliexpress');
    
    try {
      // Simulate step progression for better UX
      updateStepStatus('scraping', 'running', 'Finding AliExpress categories...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateStepStatus('scraping', 'completed', 'Found categories');
      updateStepStatus('extracting', 'running', 'Extracting product titles...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      updateStepStatus('extracting', 'completed', 'Product titles extracted');
      updateStepStatus('inferring', 'running', 'Generating keywords from titles...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateStepStatus('inferring', 'completed', 'Keywords generated');
      updateStepStatus('analyzing', 'running', 'Fetching Google Ads data...');
      
      const response = await fetch('http://localhost:3000/api/v1/products/bulk-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxCategories,
          country,
          language: 'en',
          includeProductTitles
        })
      });

      const data = await response.json();
      
      if (data.success) {
        updateStepStatus('analyzing', 'completed', 'Google Ads data retrieved');
        updateStepStatus('generating', 'running', 'Creating Excel report...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        updateStepStatus('generating', 'completed', 'Excel report ready');
        setResults(data.data);
        toast.success(`Analysis complete! Found ${data.data.summary.totalKeywords} keywords across ${data.data.summary.totalCategories} categories.`);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = (error as Error).message;
      
      // Mark current step as error
      if (currentStep) {
        updateStepStatus(currentStep, 'error', errorMessage);
      }
      
      toast.error('Analysis failed: ' + errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runCustomAnalysis = async () => {
    const titles = customTitles
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (titles.length === 0) {
      toast.error('Please enter at least one product title');
      return;
    }

    setIsAnalyzing(true);
    initializeAnalysisSteps('custom');
    
    try {
      // Simulate step progression for better UX
      updateStepStatus('processing', 'running', `Processing ${titles.length} product titles...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateStepStatus('processing', 'completed', 'Titles processed');
      updateStepStatus('inferring', 'running', 'Generating keywords from titles...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      updateStepStatus('inferring', 'completed', 'Keywords generated');
      updateStepStatus('analyzing', 'running', 'Fetching Google Ads data...');
      
      const response = await fetch('http://localhost:3000/api/v1/products/custom-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titles,
          country,
          language: 'en'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        updateStepStatus('analyzing', 'completed', 'Google Ads data retrieved');
        updateStepStatus('generating', 'running', 'Creating Excel report...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        updateStepStatus('generating', 'completed', 'Excel report ready');
        setResults(data.data);
        toast.success(`Analysis complete! Found ${data.data.summary.totalKeywords} keywords from ${titles.length} product titles.`);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = (error as Error).message;
      
      // Mark current step as error
      if (currentStep) {
        updateStepStatus(currentStep, 'error', errorMessage);
      }
      
      toast.error('Analysis failed: ' + errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadSpreadsheet = async () => {
    if (!results) return;

    try {
      const endpoint = activeTab === 'aliexpress' 
        ? 'http://localhost:3000/api/v1/products/bulk-analysis/download'
        : 'http://localhost:3000/api/v1/products/custom-analysis/download';

      const body = activeTab === 'aliexpress' 
        ? { maxCategories, country, language: 'en', includeProductTitles }
        : { titles: customTitles.split('\n').map(t => t.trim()).filter(t => t.length > 0), country, language: 'en' };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `keyword-analysis-${country}-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Spreadsheet downloaded successfully!');
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed: ' + (error as Error).message);
    }
  };

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOpportunityColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <>
      <Helmet>
        <title>Bulk Keyword Analysis - Global Product Analyzer</title>
      </Helmet>
      
      <div className="space-y-6">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">Bulk Keyword Analysis</h1>
            <p className="mt-1 text-sm text-gray-500">
              Analyze multiple product categories or custom titles for keyword opportunities
            </p>
          </div>
          {results && (
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <button
                onClick={downloadSpreadsheet}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Download Excel
              </button>
            </div>
          )}
        </div>

        {/* Analysis Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'aliexpress', name: 'AliExpress Categories', icon: ChartBarIcon },
                { id: 'custom', name: 'Custom Titles', icon: ClipboardDocumentListIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'aliexpress' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Max Categories
                    </label>
                    <select
                      value={maxCategories}
                      onChange={(e) => setMaxCategories(Number(e.target.value))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value={1}>1 Category</option>
                      <option value={2}>2 Categories</option>
                      <option value={3}>3 Categories</option>
                      <option value={5}>5 Categories</option>
                      <option value={10}>10 Categories</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeProductTitles"
                      checked={includeProductTitles}
                      onChange={(e) => setIncludeProductTitles(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="includeProductTitles" className="ml-2 block text-sm text-gray-700">
                      Include Product Titles
                    </label>
                  </div>
                </div>

                <div className="flex justify-start">
                  <button
                    onClick={runAliExpressAnalysis}
                    disabled={isAnalyzing}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <StopIcon className="h-5 w-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <PlayIcon className="h-5 w-5 mr-2" />
                        Start Analysis
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Titles (one per line)
                  </label>
                  <textarea
                    value={customTitles}
                    onChange={(e) => setCustomTitles(e.target.value)}
                    rows={8}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter product titles, one per line...&#10;&#10;Example:&#10;Wireless Bluetooth Earbuds&#10;LED Strip Lights RGB&#10;Fitness Tracker Watch"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    {customTitles.split('\n').filter(t => t.trim().length > 0).length} titles entered
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-start">
                  <button
                    onClick={runCustomAnalysis}
                    disabled={isAnalyzing || customTitles.trim().length === 0}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <StopIcon className="h-5 w-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <PlayIcon className="h-5 w-5 mr-2" />
                        Analyze Titles
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Status */}
        {isAnalyzing && analysisSteps.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin text-primary-600" />
                Analysis in Progress
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                {analysisSteps.map((step) => (
                  <div key={step.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {step.status === 'completed' ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : step.status === 'error' ? (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                      ) : step.status === 'running' ? (
                        <ArrowPathIcon className="h-5 w-5 text-primary-600 animate-spin" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        step.status === 'completed' ? 'text-green-700' :
                        step.status === 'error' ? 'text-red-700' :
                        step.status === 'running' ? 'text-primary-700' :
                        'text-gray-500'
                      }`}>
                        {step.name}
                      </p>
                      {step.message && (
                        <p className="text-xs text-gray-500 mt-1">{step.message}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {step.status === 'running' && (
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-primary-600 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>
                    {analysisSteps.filter(s => s.status === 'completed').length} of {analysisSteps.length} steps
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${(analysisSteps.filter(s => s.status === 'completed').length / analysisSteps.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Analysis Summary</h3>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                  <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ChartBarIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Categories</dt>
                            <dd className="text-lg font-medium text-gray-900">{results.summary.totalCategories}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Keywords</dt>
                            <dd className="text-lg font-medium text-gray-900">{results.summary.totalKeywords}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ChartBarIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Avg Searches</dt>
                            <dd className="text-lg font-medium text-gray-900">{results.summary.avgMonthlySearches.toLocaleString()}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ChartBarIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">High Opportunity</dt>
                            <dd className="text-lg font-medium text-gray-900">{results.summary.highOpportunityKeywords}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Detailed Results</h3>
              </div>
              <div className="overflow-hidden">
                {results.categories.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="border-b border-gray-200 last:border-b-0">
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {category.parent} &gt; {category.sub} &gt; {category.subSub}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {category.keywordAnalysis.length} keywords found
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          <a 
                            href={category.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-500"
                          >
                            View Category →
                          </a>
                        </div>
                      </div>
                      
                      {category.inferredKeywords && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Inferred Keywords:</span> {category.inferredKeywords}
                          </p>
                        </div>
                      )}

                      {category.keywordAnalysis.length > 0 && (
                        <div className="mt-4">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Searches</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competition</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPC Range</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunity</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Google API Verified</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {category.keywordAnalysis.slice(0, 5).map((keyword, keywordIndex) => (
                                  <tr key={keywordIndex}>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {keyword.keyword}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {keyword.avgMonthlySearches.toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCompetitionColor(keyword.competition)}`}>
                                        {keyword.competition}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                      ${keyword.cpcLow.toFixed(2)} - ${keyword.cpcHigh.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOpportunityColor(keyword.opportunityLevel)}`}>
                                        {keyword.opportunityLevel} ({keyword.opportunityScore.toFixed(1)})
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-center">
                                      {keyword.googleApiVerified ? (
                                        <CheckCircleSolidIcon className="h-5 w-5 text-green-500" />
                                      ) : (
                                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {category.keywordAnalysis.length > 5 && (
                            <p className="mt-2 text-sm text-gray-500">
                              Showing top 5 of {category.keywordAnalysis.length} keywords
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
