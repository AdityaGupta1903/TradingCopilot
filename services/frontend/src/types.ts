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

export interface Quote {
    symbol: string;
    interval: Timeframe;
    price: number;
    changePercent: number;
    high: number;
    low: number;
    volume: number;
}

export interface Trade {
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

export interface StrategyResult {
    totalTrades: number;
    totalPnl: number;
    winRate: number;
    averageTradePnl: number;
    profitFactor: number | null;
    trades: Trade[];
    equityCurve: Array<{ time: number; equity: number }>;
    candles?: Candle[];
    candlesUsed?: number;
    historyStartTime?: number | null;
    historyEndTime?: number | null;
}
