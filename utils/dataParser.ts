import { FinancialData } from '../types';

export interface BulkStockEntry {
  stockName: string;
  sector: string;
  data: FinancialData[];
}

export const parseFinancialText = (text: string): FinancialData[] => {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const splitRegex = /\t|\s{2,}/;

  let headerIndex = -1;
  let columnMap: { index: number, year: string, yearNum: number }[] = [];

  // 1. Find Header Row
  for(let i=0; i<lines.length; i++) {
     const rawFull = lines[i].split(splitRegex);
     const potentialCols: { index: number, year: string, yearNum: number }[] = [];
     
     rawFull.forEach((val, idx) => {
        const v = val.trim();
        if(!v) return;
        const yearMatch = v.match(/(19|20)\d{2}/); 
        if (yearMatch && !v.includes('TTM')) {
             potentialCols.push({ index: idx, year: v, yearNum: parseInt(yearMatch[0]) });
        }
     });

     if (potentialCols.length >= 2) {
         headerIndex = i;
         columnMap = potentialCols;
         break;
     }
  }

  if (headerIndex === -1 || columnMap.length === 0) return [];

  // 2. Calibrate Offset
  // Some rows start with a label, others might have an empty first cell.
  let colOffset = 0;
  const calibrationRow = lines.slice(headerIndex + 1).find(l => {
    const low = l.toLowerCase();
    return low.includes('sales') || low.includes('revenue') || low.includes('expenses');
  });
  
  if (calibrationRow) {
      const rowRaw = calibrationRow.split(splitRegex);
      const firstDateColIdx = columnMap[0].index;
      // If the value at the first year's index isn't a number, we likely need to shift
      const val = rowRaw[firstDateColIdx]?.replace(/,/g, '').trim();
      if (val && isNaN(parseFloat(val))) {
          colOffset = 1;
      }
  }

  const result = columnMap.map(c => ({
      year: c.year,
      yearNum: c.yearNum,
      sales: 0, expenses: 0, operatingProfit: 0, opmPercentage: 0,
      otherIncome: 0, interest: 0, depreciation: 0, profitBeforeTax: 0,
      taxPercentage: 0, netProfit: 0, eps: 0, isForecast: false
  }));

  const cleanNum = (val: string) => {
      if (!val) return 0;
      let v = val.replace(/,/g, '').replace(/[()]/g, '').replace(/%/g, '').trim();
      return parseFloat(v) || 0;
  };

  // 3. Extract Rows
  for (let i = headerIndex + 1; i < lines.length; i++) {
      const rowRaw = lines[i].split(splitRegex);
      let label = (rowRaw[0] || "").trim().toLowerCase();
      // If first cell is empty, label might be in second cell
      if (!label && rowRaw.length > 1) label = (rowRaw[1] || "").trim().toLowerCase();

      let key: keyof FinancialData | undefined;
      if (label.includes('sales') || label.includes('revenue')) key = 'sales';
      else if (label.includes('expenses')) key = 'expenses';
      else if (label.includes('operating profit')) key = 'operatingProfit';
      else if (label.includes('opm')) key = 'opmPercentage';
      else if (label.includes('other income')) key = 'otherIncome';
      else if (label.includes('interest')) key = 'interest';
      else if (label.includes('depreciation')) key = 'depreciation';
      else if (label.includes('profit before tax')) key = 'profitBeforeTax';
      else if (label.includes('tax')) key = 'taxPercentage';
      else if (label.includes('net profit')) key = 'netProfit';
      else if (label.startsWith('eps') || label.includes('earnings per share')) key = 'eps';

      if (key) {
          columnMap.forEach((col, arrayIndex) => {
              const targetIndex = col.index + colOffset;
              if (rowRaw[targetIndex] !== undefined) {
                  (result[arrayIndex] as any)[key!] = cleanNum(rowRaw[targetIndex]);
              }
          });
      }
  }

  return result.sort((a, b) => a.yearNum - b.yearNum).map(({yearNum, ...rest}) => rest);
};

export const parseBulkFile = (text: string): BulkStockEntry[] => {
    const entries: BulkStockEntry[] = [];
    // Split by "stock name:" case insensitively
    const parts = text.split(/(?=stock name:)/i);
    
    parts.forEach(section => {
        if (!section.trim()) return;
        const lines = section.split('\n');
        let name = "Unknown";
        let sector = "General";
        let tableLines: string[] = [];

        lines.forEach(line => {
            const low = line.toLowerCase();
            if (low.startsWith('stock name:')) {
                name = line.split(':')[1]?.trim() || "Unknown";
            } else if (low.startsWith('stock sector:')) {
                sector = line.split(':')[1]?.trim() || "General";
            } else if (line.trim()) {
                tableLines.push(line);
            }
        });

        const data = parseFinancialText(tableLines.join('\n'));
        if (data.length > 0) {
            entries.push({ stockName: name, sector, data });
        }
    });

    return entries;
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(val);
};