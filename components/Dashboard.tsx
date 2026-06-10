import React from 'react';
import { FinancialData, ForecastData } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, ComposedChart, Area
} from 'recharts';
import { formatCurrency } from '../utils/dataParser';
import { motion } from 'motion/react';

interface DashboardProps {
  data: FinancialData[];
  forecast?: ForecastData;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, forecast }) => {
  const chartData = [...data];
  if (forecast) {
    chartData.push(forecast);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="Latest Sales" 
          value={formatCurrency(data[data.length - 1].sales)} 
          subtext={data[data.length-1].year} 
          delay={0.1}
          accentClass="bg-brand-500"
        />
        <MetricCard 
          label="Latest Op. Profit" 
          value={formatCurrency(data[data.length - 1].operatingProfit)} 
          subtext={`${data[data.length-1].opmPercentage}% Margin`} 
          color="text-teal-400"
          delay={0.2}
          accentClass="bg-teal-500"
        />
        <MetricCard 
          label="Latest EPS" 
          value={`Rs ${data[data.length - 1].eps.toFixed(2)}`} 
          subtext="Earnings per share" 
          delay={0.3}
          accentClass="bg-amber-500"
        />
        {forecast ? (
           <MetricCard 
             label="Forecasted EPS" 
             value={`Rs ${forecast.eps.toFixed(2)}`} 
             subtext={forecast.year} 
             highlight
             delay={0.4}
             accentClass="bg-brand-400"
           />
        ) : (
           <MetricCard 
             label="Growth (YoY)" 
             value={data.length > 1 ? `${(((data[data.length - 1].sales - data[data.length - 2].sales) / data[data.length - 2].sales) * 100).toFixed(1)}%` : 'N/A'} 
             subtext="Revenue growth rate" 
             color="text-emerald-400"
             delay={0.4}
             accentClass="bg-emerald-500"
           />
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Revenue & Profit Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-dark-card p-6 rounded-2xl border border-dark-border shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-500/10 to-transparent" />
          <h3 className="text-sm font-display font-medium text-slate-100 mb-6 flex items-center gap-2 uppercase tracking-wider">
            <span className="w-1.5 h-4 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.5)]"></span>
            Revenue & Profit Trends
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1b1b1b" opacity={0.6} />
                <XAxis dataKey="year" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} stroke="#737373" fontFamily="JetBrains Mono" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => Math.abs(val) >= 1000 ? `${(val/1000).toFixed(0)}k` : val} stroke="#737373" fontFamily="JetBrains Mono" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #262626', backgroundColor: '#090909', color: '#ededed', fontFamily: 'JetBrains Mono', fontSize: '11px' }}
                  cursor={{ fill: '#14b8a6', opacity: 0.05 }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '20px', color: '#a3a3a3', fontFamily: 'Inter', fontSize: '11px' }} />
                <Bar dataKey="sales" name="Sales" fill="url(#colorSales)" stroke="#14b8a6" strokeWidth={1} strokeOpacity={0.3} radius={[4, 4, 0, 0]} barSize={24} />
                <Area type="monotone" dataKey="operatingProfit" name="Op. Profit" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.05} strokeWidth={2} />
                <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#0a0a0a' }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Margins Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-dark-card p-6 rounded-2xl border border-dark-border shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
          <h3 className="text-sm font-display font-medium text-slate-100 mb-6 flex items-center gap-2 uppercase tracking-wider">
            <span className="w-1.5 h-4 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
            Margin Analysis (%)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1b1b1b" opacity={0.6} />
                <XAxis dataKey="year" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} stroke="#737373" fontFamily="JetBrains Mono" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} domain={['auto', 'auto']} stroke="#737373" fontFamily="JetBrains Mono" tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: '1px solid #262626', backgroundColor: '#090909', color: '#ededed', fontFamily: 'JetBrains Mono', fontSize: '11px' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '20px', color: '#a3a3a3', fontFamily: 'Inter', fontSize: '11px' }} />
                <Line type="monotone" dataKey="opmPercentage" name="Operating Margin" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#0a0a0a' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="taxPercentage" name="Tax Rate" stroke="#737373" strokeDasharray="4 4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      {/* Data Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-dark-card rounded-2xl border border-dark-border overflow-hidden shadow-xl"
      >
        <div className="px-6 py-5 border-b border-dark-border bg-dark-card flex justify-between items-center">
          <h3 className="text-sm font-display font-medium text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-500 rounded-full"></span>
            Historical & Estimation Sheet
          </h3>
          <span className="text-[10px] bg-dark-bg border border-dark-border px-3 py-1 rounded-full font-mono text-dark-muted">
            {chartData.length} entries matching
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-dark-muted">
            <thead className="text-[10px] text-dark-muted uppercase bg-[#080808] border-b border-dark-border tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Year</th>
                <th className="px-6 py-4 text-right">Sales</th>
                <th className="px-6 py-4 text-right">Op. Profit</th>
                <th className="px-6 py-4 text-right">OPM %</th>
                <th className="px-6 py-4 text-right">Net Profit</th>
                <th className="px-6 py-4 text-right">EPS</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, idx) => (
                <tr 
                  key={idx} 
                  className={`border-b border-dark-border/40 last:border-none hover:bg-[#090909] transition-colors ${row.isForecast ? 'bg-brand-950/15 hover:bg-brand-950/25' : ''}`}
                >
                  <td className="px-6 py-4 font-semibold text-slate-200">
                    <div className="flex items-center gap-2.5">
                      <span>{row.year}</span>
                      {row.isForecast && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-brand-500/10 text-brand-400 uppercase tracking-wider border border-brand-500/20">
                          Forecast
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-300">{formatCurrency(row.sales)}</td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-teal-400">{formatCurrency(row.operatingProfit)}</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-300">{row.opmPercentage}%</td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-slate-100">{formatCurrency(row.netProfit)}</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-300">Rs {row.eps.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

const MetricCard = ({ label, value, subtext, color = "text-white", highlight = false, delay = 0, accentClass = "bg-brand-500" }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay }}
    className={`p-6 rounded-2xl border transition-all hover:translate-y-[-2px] relative overflow-hidden shadow-md ${highlight ? 'bg-brand-950/20 border-brand-500/30 shadow-[0_4px_20px_rgba(20,184,166,0.05)]' : 'bg-dark-card border-dark-border'}`}
  >
    {/* Decorative Glowing Accent Bar */}
    <div className={`absolute top-0 left-0 right-0 h-[2px] ${highlight ? 'bg-brand-400' : accentClass} opacity-60`} />

    <div className={`text-[10px] font-medium uppercase tracking-wider mb-2 ${highlight ? 'text-brand-300' : 'text-dark-muted'}`}>
        {label}
    </div>
    <div className={`text-2xl font-display font-semibold tracking-tight ${highlight ? 'text-brand-300' : color}`}>
        {value}
    </div>
    <div className={`text-[10px] mt-1.5 font-mono ${highlight ? 'text-brand-400/60' : 'text-dark-muted'}`}>
        {subtext}
    </div>
  </motion.div>
);