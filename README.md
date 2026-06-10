# FinSight AI Analyst

<div align="center">
   
  <img src="finsight.png" alt="FinSight AI Analyst Logo" width="200" height="200" />
  <h3>Predictive Fundamental Analytics</h3>
  <p>An intelligent financial tool that parses raw stock fundamentals, visualizes historical trends, and leverages the Gemini API to forecast future performance.</p>
</div>

---

## 🚀 Overview

**FinSight AI Analyst** is a research project bridging core fundamental analysis with LLM-driven predictive analytics. The system parses raw financial data, generates interactive visualizations, and applies advanced predictive validation to forecast company metrics. 

> **What's Next:** The current phase focuses on fundamental data. The next phase of development involves building a companion tool dedicated to **Technical Analysis**.

---

## 🛠️ Built With

The project leverages a robust stack combining data science libraries, modern visualization tools, and generative AI:

*   **Language:** Python
*   **AI Engine:** Gemini API
*   **Data Processing:** Pandas, NumPy
*   **Visualization:** Recharts / D3.js
*   **Core Methodology:** Fundamental Analysis
*   **Security:** Sandboxed Execution Engine

---

## ⚡ Key Technical Features

### 01. Data Ingestion
The platform supports flexible data input methods designed for seamless financial analysis:
*   **Manual Copy-Paste:** Quick entry for fast analysis.
*   **Bulk Text-File Uploads:** Directly parses raw yearly financial statements (Sales, Expenses, Net Profit, EPS) exported from **Screener.in**.

### 02. Predictive Validation
To ensure honest accuracy benchmarking, the system uses an isolated training methodology:
*   Trains on historical data up to the penultimate year to forecast the latest year's metrics.
*   Features a **strict code-level sandboxing engine** to completely isolate the test year and prevent data leakage.

### 03. Sector-Aware Inferences
The model retains contextual insights within specific industries. It dynamically utilizes transferred learnings from previously analyzed peer stocks (e.g., *Sun Pharma*) to improve predictive accuracy for other companies within the same domain (e.g., *Dr. Reddy's*).

### 04. Meta-Patterns Engine
A continuous macro-trend evaluation layer that:
*   Identifies global statistical trends across divergent market sectors.
*   Dynamically applies these cross-sector insights back to the entire training database to optimize overall forecasting accuracy.

