import type { Candle, MarketQuote, Timeframe } from '../types/market.js';
import { config } from '../config.js';
import type { MarketDataProvider } from './marketDataProvider.js';

const instrumentIds: Record<string, string> = {
    XAUUSDT: 'XAU-USDT-SWAP',
    BTCUSDT: 'BTC-USDT-SWAP',
    ETHUSDT: 'ETH-USDT-SWAP',
};

const bars: Record<Timeframe, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1H',
    '4h': '4H',
    '1d': '1D',
};

const maxCandlesPerRequest = 300;
const historyPageLimit = 100;
const historyRequestDelayMs = 125;

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

type OkxResponse = {
    code: string;
    msg: string;
    data: Array<[string, string, string, string, string, string]>;
};

export class OkxMarketProvider implements MarketDataProvider {
    name = 'okx';

    async fetchHistoricalCandles(symbol: string, interval: Timeframe, startTime: number, endTime: number): Promise<Candle[]> {
        const normalizedSymbol = symbol.trim().toUpperCase();
        const instrumentId = instrumentIds[normalizedSymbol];
        if (!instrumentId) {
            throw new Error(`Unsupported OKX symbol: ${normalizedSymbol}`);
        }

        const candleByTime = new Map<number, Candle>();
        let cursor = endTime + 1;

        while (cursor > startTime) {
            const query = new URLSearchParams({
                instId: instrumentId,
                bar: bars[interval],
                limit: String(historyPageLimit),
                after: String(cursor),
            });
            const url = `${config.okxBaseUrl}/api/v5/market/history-candles?${query}`;
            let rows: OkxResponse['data'] | undefined;

            for (let attempt = 0; attempt < 4; attempt += 1) {
                const response = await fetch(url);
                if (!response.ok) {
                    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
                        await delay(500 * (attempt + 1));
                        continue;
                    }
                    throw new Error(`OKX history request failed: ${response.status} ${response.statusText}`);
                }

                const result = (await response.json()) as OkxResponse;
                if (result.code === '50011' && attempt < 3) {
                    await delay(500 * (attempt + 1));
                    continue;
                }
                if (result.code !== '0') {
                    throw new Error(`OKX history request failed: ${result.msg || result.code}`);
                }
                rows = result.data;
                break;
            }

            if (!rows?.length) {
                break;
            }

            let oldestTime = Number.POSITIVE_INFINITY;
            for (const [time, open, high, low, close, volume] of rows) {
                const timestamp = Number(time);
                oldestTime = Math.min(oldestTime, timestamp);
                if (timestamp < startTime || timestamp > endTime) {
                    continue;
                }
                candleByTime.set(timestamp, {
                    symbol: normalizedSymbol,
                    interval,
                    time: timestamp,
                    open: Number(open),
                    high: Number(high),
                    low: Number(low),
                    close: Number(close),
                    volume: Number(volume),
                });
            }

            if (!Number.isFinite(oldestTime) || oldestTime >= cursor || oldestTime <= startTime) {
                break;
            }

            cursor = oldestTime;
            await delay(historyRequestDelayMs);
        }

        return [...candleByTime.values()].sort((left, right) => left.time - right.time);
    }

    async fetchCandles(symbol: string, interval: Timeframe, limit = maxCandlesPerRequest): Promise<Candle[]> {
        const normalizedSymbol = symbol.trim().toUpperCase();
        const instrumentId = instrumentIds[normalizedSymbol];
        if (!instrumentId) {
            throw new Error(`Unsupported OKX symbol: ${normalizedSymbol}`);
        }

        const requestedLimit = Number.isFinite(limit) ? Math.trunc(limit) : maxCandlesPerRequest;
        const boundedLimit = Math.min(Math.max(requestedLimit, 1), maxCandlesPerRequest);
        const query = new URLSearchParams({ instId: instrumentId, bar: bars[interval], limit: String(boundedLimit) });
        const response = await fetch(`${config.okxBaseUrl}/api/v5/market/candles?${query}`);
        if (!response.ok) {
            throw new Error(`Market data request failed: ${response.status} ${response.statusText}`);
        }

        const result = (await response.json()) as OkxResponse;
        if (result.code !== '0') {
            throw new Error(`OKX market data request failed: ${result.msg || result.code}`);
        }

        return result.data
            .map(([time, open, high, low, close, volume]) => ({
                symbol: normalizedSymbol,
                interval,
                time: Number(time),
                open: Number(open),
                high: Number(high),
                low: Number(low),
                close: Number(close),
                volume: Number(volume),
            }))
            .reverse();
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