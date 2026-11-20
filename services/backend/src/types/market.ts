export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface Candle {
    symbol: string;
    interval: Timeframe;
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface MarketQuote {
    symbol: string;
    interval: Timeframe;
    price: number;
    changePercent: number;
    high: number;
    low: number;
    volume: number;
}

export interface BacktestRequest {
    symbol: string;
    interval: Timeframe;
    limit?: number;
    startTime?: number;
    endTime?: number;
    riskRewardMultiplier?: number;
}

export interface ForwardTestRequest {
    symbol: string;
    interval: Timeframe;
    lookback?: number;
    runMinutes?: number;
}

export interface StrategyTrade {
    entryTime: number;
    exitTime: number;
    side: 'long' | 'short';
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    stopPrice: number;
    targetPrice: number;
    brief: string;
}

export interface StrategyBacktestResult {
    symbol: string;
    interval: Timeframe;
    trades: StrategyTrade[];
    totalPnl: number;
    winRate: number;
    averageTradePnl: number;
    totalTrades: number;
    profitFactor: number | null;
    equityCurve: Array<{ time: number; equity: number }>;
}
