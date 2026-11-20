import type { Candle, MarketQuote, Timeframe } from '../types/market.js';

export interface MarketDataProvider {
    name: string;
    fetchCandles(symbol: string, interval: Timeframe, limit?: number): Promise<Candle[]>;
    fetchHistoricalCandles?(symbol: string, interval: Timeframe, startTime: number, endTime: number): Promise<Candle[]>;
    getLatestQuote(symbol: string, interval: Timeframe): Promise<MarketQuote | null>;
}
