import React, { useState, useEffect } from 'react';

const INITIAL_MARKETS = [
  { symbol: 'EUR / USD', price: 1.0874, change: '+0.42%', up: true },
  { symbol: 'XAU / USD (Gold)', price: 2684.50, change: '+1.15%', up: true },
  { symbol: 'S&P 500 Futures', price: 5740.25, change: '+0.68%', up: true },
  { symbol: 'US 10Y Yield', price: 3.74, change: '-0.05%', up: false }
];

export const TickerChart = () => {
  const [markets, setMarkets] = useState(INITIAL_MARKETS);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarkets(prev =>
        prev.map(item => {
          const delta = (Math.random() - 0.48) * 0.004;
          const newPrice = Number((item.price * (1 + delta)).toFixed(item.price > 100 ? 2 : 4));
          const isUp = delta >= 0;
          const pct = (delta * 100).toFixed(2);
          return {
            ...item,
            price: newPrice,
            change: `${isUp ? '+' : ''}${pct}%`,
            up: isUp
          };
        })
      );
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ticker-card">
      <div className="ticker-header">
        <div className="ticker-title">Live Market Analysis</div>
        <div className="live-badge">
          <span className="live-dot"></span>
          REALTIME
        </div>
      </div>

      <svg className="chart" viewBox="0 0 480 180" style={{ width: '100%', height: '140px' }}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1="0" y1="30" x2="480" y2="30" stroke="var(--border-color)" strokeDasharray="3 3" />
        <line x1="0" y1="80" x2="480" y2="80" stroke="var(--border-color)" strokeDasharray="3 3" />
        <line x1="0" y1="130" x2="480" y2="130" stroke="var(--border-color)" strokeDasharray="3 3" />

        {/* Chart Fill Area */}
        <path
          d="M 10 140 Q 90 120, 160 90 T 320 60 T 470 20 L 470 170 L 10 170 Z"
          fill="url(#chartGradient)"
        />

        {/* Chart Line */}
        <path
          d="M 10 140 Q 90 120, 160 90 T 320 60 T 470 20"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Pulse Dot at Peak */}
        <circle cx="470" cy="20" r="5" fill="var(--accent)" />
        <circle cx="470" cy="20" r="10" fill="var(--accent)" opacity="0.4">
          <animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>

      <div className="readouts">
        {markets.map((m, idx) => (
          <div className="readout-item" key={idx}>
            <div className="readout-symbol">{m.symbol}</div>
            <div className="readout-value">
              <span>{m.price.toLocaleString()}</span>
              <span className={`readout-change ${m.up ? 'up' : 'down'}`}>
                {m.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
