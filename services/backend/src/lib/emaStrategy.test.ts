import { describe, expect, it } from 'vitest';
import type { Candle } from '../types/market.js';
import { runFiveEmaBacktest } from './emaStrategy.js';

const createCandles = (values: number[]): Candle[] => {
    return values.map((close, index) => ({
        symbol: 'XAUUSDT',
        interval: '1h',
        time: Date.now() - (values.length - index) * 60 * 60 * 1000,
        open: close - 0.3,
        high: close + 1.2,
        low: close - 1.4,
        close,
        volume: 2500 + index * 10,
    }));
};

describe('runFiveEmaBacktest', () => {
    it('returns a valid empty-result summary when no valid 5 EMA setup is present', () => {
        const candles = createCandles(
            Array.from({ length: 60 }, (_, index) => 100 + Math.sin(index / 6) * 0.4),
        );

        const result = runFiveEmaBacktest(candles, { riskRewardMultiplier: 3 });

        expect(result.totalTrades).toBe(0);
        expect(result.trades).toEqual([]);
        expect(result.averageTradePnl).toBe(0);
        expect(result.totalPnl).toBe(0);
    });

    it('serializes a winning result with no losses without an infinite profit factor', () => {
        const candles = createCandles([100, 100, 100, 100, 100, 110, 110.5, 110, 100]);
        candles[5] = { ...candles[5], open: 111, high: 112, low: 109 };
        candles[6] = { ...candles[6], open: 110, high: 112, low: 110 };

        const result = runFiveEmaBacktest(candles, { riskRewardMultiplier: 3 });

        expect(result.totalTrades).toBe(1);
        expect(result.trades[0].pnl).toBeGreaterThan(0);
        expect(result.trades[0].entryTime).toBe(candles[7].time);
        expect(result.profitFactor).toBeNull();
        expect(JSON.parse(JSON.stringify(result)).profitFactor).toBeNull();
    });
});
