import { GoogleGenAI, Type } from "@google/genai";
import { FinancialData, AnalysisResult, TrainingResult, LearnedPattern } from "../types";

const SYSTEM_INSTRUCTION_TRAINER = `
You are an advanced AI Financial Model Trainer. Your goal is to learn how to predict stock fundamentals by comparing your internal logic against verified historical actuals.

CRITICAL PROTOCOL:
1. You are provided with "Training Data" (Years 1 to N-1).
2. You are provided with the "Target Verification Year" (Year N).
3. You must generate a BLIND PREDICTION for Year N metrics based ONLY on the Training Data and any existing sector Knowledge Base.
4. ONLY AFTER your internal prediction is ready, look at the "Actuals" provided in the prompt to calculate your final accuracy score.
5. Do NOT simply copy the Actuals into your predictedData output. Your predictedData should reflect what your model honestly expected before seeing the answer.
6. The accuracyScore must be an integer between 0 and 100. (e.g., 95, not 0.95).
`;

const SYSTEM_INSTRUCTION_ANALYST = `
You are an expert Chief Financial Officer (CFO) and Investment Analyst. 
Forecast future performance applying the "Learned Patterns" provided in context.
`;

const SYSTEM_INSTRUCTION_SYNTHESIZER = `
You are a Meta-Learning AI. Your task is to look at a collection of individual stock training results and synthesize "Master Sector Strategies". 
Look for non-obvious patterns across stocks in the same sector and cross-sector correlations.
If you find new, deep insights, describe them. If not, state "NO NEW PATTERNS".
`;

const getClient = () => {
  return new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

const formatPatternsForPrompt = (learnedPatterns: LearnedPattern[], metaInsights: string[] = []) => {
  let context = "";
  
  if (metaInsights.length > 0) {
    context += "--- MASTER META-LEARNINGS (PRIORITIZE THESE) ---\n";
    metaInsights.forEach(m => context += `- ${m}\n`);
    context += "\n";
  }

  if (learnedPatterns.length > 0) {
    const patternsBySector = learnedPatterns.reduce((acc, p) => {
      const s = p.sector || 'Uncategorized';
      if (!acc[s]) acc[s] = [];
      acc[s].push(p.insight);
      return acc;
    }, {} as Record<string, string[]>);

    context += "--- SECTOR KNOWLEDGE BASE ---\n";
    for (const [sec, insights] of Object.entries(patternsBySector)) {
      context += `\n[Sector: ${sec}]\n${insights.map(i => `- ${i}`).join('\n')}`;
    }
  }

  return context || "No prior patterns learned yet.";
};

export const trainStockModel = async (
  history: FinancialData[], 
  actualLastYear: FinancialData, 
  stockName: string, 
  sector: string,
  learnedPatterns: LearnedPattern[] = [],
  metaInsights: string[] = []
): Promise<TrainingResult> => {
  const ai = getClient();
  const patternsContext = formatPatternsForPrompt(learnedPatterns, metaInsights);

  const prompt = `
    TASK: BLIND PREDICTION & VALIDATION
    STOCK: ${stockName}
    SECTOR: ${sector}

    --- GLOBAL CONTEXT & LEARNED STRATEGIES ---
    ${patternsContext}

    --- 1. TRAINING DATA (Use this for your prediction) ---
    ${JSON.stringify(history, null, 2)}

    --- 2. VERIFICATION TARGET (The year you are predicting) ---
    Year: ${actualLastYear.year}

    --- 3. ACTUALS (Revealed for validation) ---
    Actual Data for ${actualLastYear.year}: ${JSON.stringify(actualLastYear, null, 2)}

    INSTRUCTION:
    1. Study the Training Data and use the Master Meta-Learnings to refine your logic.
    2. Predict ${actualLastYear.year} metrics.
    3. Compare prediction to Actuals and output JSON.
    4. ENSURE accuracyScore is 0-100 (e.g. 98), not 0-1.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_TRAINER,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          predictedData: {
            type: Type.OBJECT,
            properties: {
              year: { type: Type.STRING },
              sales: { type: Type.NUMBER },
              expenses: { type: Type.NUMBER },
              operatingProfit: { type: Type.NUMBER },
              netProfit: { type: Type.NUMBER },
              eps: { type: Type.NUMBER },
            },
            required: ["year", "sales", "netProfit", "eps"],
          },
          accuracyScore: { type: Type.NUMBER },
          learning: { type: Type.STRING },
          rationale: { type: Type.STRING },
        },
        required: ["predictedData", "accuracyScore", "learning", "rationale"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini.");

  try {
    const rawResult = JSON.parse(text);
    
    // Normalize accuracy score to 0-100 if model returns decimal
    let normalizedScore = rawResult.accuracyScore;
    if (normalizedScore <= 1 && normalizedScore > 0) {
      normalizedScore = Math.round(normalizedScore * 100);
    } else {
      normalizedScore = Math.round(normalizedScore);
    }

    return {
      stockName, sector,
      predictedYear: actualLastYear.year,
      predictedData: { ...rawResult.predictedData, isForecast: true },
      actualData: actualLastYear,
      accuracyScore: normalizedScore,
      learning: rawResult.learning,
      rationale: rawResult.rationale,
    };
  } catch (e) {
    throw new Error("Failed to parse Training response.");
  }
};

export const synthesizeKnowledge = async (patterns: LearnedPattern[]): Promise<{ masterInsights: string[], status: 'new' | 'none' }> => {
  const ai = getClient();
  const input = patterns.map(p => `Stock: ${p.stockName} (${p.sector}): ${p.insight} (Accuracy: ${p.accuracyScore}%)`).join('\n');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: `Examine these financial insights and synthesize global cross-sector patterns:\n\n${input}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_SYNTHESIZER,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          masterInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
          status: { type: Type.STRING, enum: ['new', 'none'] }
        },
        required: ["masterInsights", "status"]
      }
    }
  });

  return JSON.parse(response.text || '{"masterInsights":[], "status":"none"}');
};

export const analyzeAndForecast = async (
  history: FinancialData[], 
  stockName: string,
  sector: string,
  learnedPatterns: LearnedPattern[] = []
): Promise<AnalysisResult> => {
  const ai = getClient();
  const patternsContext = formatPatternsForPrompt(learnedPatterns);

  const prompt = `
    TASK: FINANCIAL ANALYSIS & FORECAST
    STOCK: ${stockName}
    SECTOR: ${sector}

    Historical Data: ${JSON.stringify(history, null, 2)}
    
    ${patternsContext}

    Analyze the historical performance and project the next fiscal year.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_ANALYST,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          forecast: {
            type: Type.OBJECT,
            properties: {
              year: { type: Type.STRING },
              sales: { type: Type.NUMBER },
              expenses: { type: Type.NUMBER },
              operatingProfit: { type: Type.NUMBER },
              opmPercentage: { type: Type.NUMBER },
              netProfit: { type: Type.NUMBER },
              eps: { type: Type.NUMBER },
              rationale: { type: Type.STRING },
            },
            required: ["year", "sales", "netProfit", "eps", "rationale"],
          },
          keyPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
          sectorComparison: { type: Type.STRING },
          overallSentiment: { type: Type.STRING, enum: ["Bullish", "Neutral", "Bearish"] },
        },
        required: ["forecast", "keyPatterns", "sectorComparison", "overallSentiment"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response.");

  try {
    const result = JSON.parse(text) as AnalysisResult;
    result.forecast.isForecast = true;
    return result;
  } catch (e) {
    throw new Error("Failed to parse response.");
  }
};