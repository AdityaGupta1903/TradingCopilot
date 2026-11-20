import type { Candle, Quote, StrategyResult, Timeframe } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

const request = async <T>(path: string): Promise<T> => {
    const response = await fetch(`${BASE_URL}${path}`);

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
};

export const fetchCandles = async (symbol: string, interval: Timeframe, limit = 300) => {
    const data = await request<{ candles: Candle[]; symbol: string; interval: Timeframe; source: string }>(
        `/market/candles?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`,
    );

    return data.candles;
};

export const fetchQuote = async (symbol: string, interval: Timeframe) => {
    const data = await request<{ quote: Quote | null; symbol: string; interval: Timeframe; source: string }>(
        `/market/quote?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}`,
    );

    return data.quote;
};

export const runBacktest = async (symbol: string, interval: Timeframe, riskRewardMultiplier = 3) => {
    const response = await fetch(`${BASE_URL}/simulation/backtest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol, interval, riskRewardMultiplier }),
    });

    if (!response.ok) {
        throw new Error('Backtest request failed');
    }

    const data = (await response.json()) as {
        result: StrategyResult;
        candles: Candle[];
        candlesUsed: number;
        historyStartTime: number | null;
        historyEndTime: number | null;
    };
    return {
        ...data.result,
        candles: data.candles,
        candlesUsed: data.candlesUsed,
        historyStartTime: data.historyStartTime,
        historyEndTime: data.historyEndTime,
    };
};

export const runForwardTest = async (symbol: string, interval: Timeframe, lookback = 300, riskRewardMultiplier = 3) => {
    const response = await fetch(`${BASE_URL}/simulation/forward-test`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol, interval, lookback, riskRewardMultiplier }),
    });

    if (!response.ok) {
        throw new Error('Forward test request failed');
    }

    const data = (await response.json()) as { result: StrategyResult };
    return data.result;
};
