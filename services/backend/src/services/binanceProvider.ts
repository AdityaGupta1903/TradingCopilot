import type { Candle, MarketQuote, Timeframe } from '../types/market.js';
import { config } from '../config.js';
import type { MarketDataProvider } from './marketDataProvider.js';
import { OkxMarketProvider } from './okxProvider.js';

const normalizeSymbol = (symbol: string): string => symbol.trim().toUpperCase();

const normalizeTimeframe = (interval: Timeframe): string => interval;

const getBaseUrl = (): string => {
    const providerFlag = config.marketDataProvider.toLowerCase();
    if (providerFlag.includes('future')) {
        return config.binanceFuturesBaseUrl;
    }

    return config.binanceBaseUrl;
};

const fetchJson = async <T>(url: string): Promise<T> => {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Market data request failed: ${response.status} ${response.statusText} for ${url}`);
    }

    return (await response.json()) as T;
};

export class BinanceMarketProvider implements MarketDataProvider {
    name = 'binance';

    async fetchCandles(symbol: string, interval: Timeframe, limit = 200): Promise<Candle[]> {
        const normalizedSymbol = normalizeSymbol(symbol);
        const normalizedInterval = normalizeTimeframe(interval);
        const baseUrl = getBaseUrl();
        const endpoint = `${baseUrl}/api/${config.marketDataProvider.includes('futures') ? 'fapi' : 'v3'}/klines?symbol=${normalizedSymbol}&interval=${normalizedInterval}&limit=${limit}`;

        const rows = await fetchJson<Array<[number, string, string, string, string, string, number, number, number, number, string, string]>>(endpoint);

        return rows.map(([time, open, high, low, close, volume]) => ({
            symbol: normalizedSymbol,
            interval,
            time: Number(time),
            open: Number(open),
            high: Number(high),
            low: Number(low),
            close: Number(close),
            volume: Number(volume),
        }));
    }

    async getLatestQuote(symbol: string, interval: Timeframe): Promise<MarketQuote | null> {
        const candles = await this.fetchCandles(symbol, interval, 10);
        if (candles.length < 2) {
            return null;
        }

        const previous = candles[candles.length - 2];
        const latest = candles[candles.length - 1];
        const changePercent = previous.close === 0 ? 0 : ((latest.close - previous.close) / previous.close) * 100;

        return {
            symbol: latest.symbol,
            interval,
            price: latest.close,
            changePercent,
            high: latest.high,
            low: latest.low,
            volume: latest.volume,
        };
    }
}

export class DemoMarketProvider implements MarketDataProvider {
    name = 'demo';

    async fetchCandles(symbol: string, interval: Timeframe, limit = 200): Promise<Candle[]> {
        const base = 100;
        return Array.from({ length: limit }, (_, index) => {
            const time = Date.now() - (limit - index) * 60_000;
            const drift = Math.sin(index / 8) * 1.5;
            const close = base + index * 0.25 + drift;
            return {
                symbol: symbol.toUpperCase(),
                interval,
                time,
                open: close - 0.8,
                high: close + 0.9,
                low: close - 1.1,
                close,
                volume: 1000 + index * 12,
            };
        });
    }

    async getLatestQuote(symbol: string, interval: Timeframe): Promise<MarketQuote | null> {
        const candles = await this.fetchCandles(symbol, interval, 2);
        const latest = candles[candles.length - 1];
        return {
            symbol: latest.symbol,
            interval,
            price: latest.close,
            changePercent: 0,
            high: latest.high,
            low: latest.low,
            volume: latest.volume,
        };
    }
}

export const createMarketProvider = (): MarketDataProvider => {
    if (config.demoMode) {
        return new DemoMarketProvider();
    }

    if (config.marketDataProvider.toLowerCase() === 'okx') {
        return new OkxMarketProvider();
    }

    return new BinanceMarketProvider();
};
