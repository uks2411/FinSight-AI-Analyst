export interface FinancialData {
  year: string;
  sales: number;
  expenses: number;
  operatingProfit: number;
  opmPercentage: number;
  otherIncome: number;
  interest: number;
  depreciation: number;
  profitBeforeTax: number;
  taxPercentage: number;
  netProfit: number;
  eps: number;
  isForecast?: boolean;
}

export interface ForecastData extends FinancialData {
  rationale: string;
}

export interface AnalysisResult {
  forecast: ForecastData;
  keyPatterns: string[];
  sectorComparison: string;
  overallSentiment: 'Bullish' | 'Neutral' | 'Bearish';
}

export interface TrainingResult {
  stockName: string;
  sector: string;
  predictedYear: string;
  predictedData: FinancialData;
  actualData: FinancialData;
  accuracyScore: number; // 0 to 100
  learning: string; // The specific pattern learned
  rationale: string;
}

export interface LearnedPattern {
  id: string;
  stockName: string;
  sector: string;
  insight: string;
  yearRange: string;
  accuracyScore: number;
  timestamp: number;
  // Store raw data to allow detailed viewing and re-estimation
  history: FinancialData[];
  actual: FinancialData;
  fullTrainingResult?: TrainingResult;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}