import { Router } from 'express';
import { createMarketProvider } from '../services/binanceProvider.js';
import { runFiveEmaBacktest } from '../lib/emaStrategy.js';

const router = Router();
const provider = createMarketProvider();

router.post('/backtest', async (req, res) => {
    try {
        const symbol = String(req.body?.symbol ?? 'XAUUSDT').toUpperCase();
        const interval = String(req.body?.interval ?? '1h');
        if (!provider.fetchHistoricalCandles) {
            throw new Error(`The ${provider.name} provider does not support paginated historical backtests`);
        }

        const endTime = Date.now();
        const startTime = endTime - 365 * 24 * 60 * 60 * 1000;
        const candles = await provider.fetchHistoricalCandles(symbol, interval as any, startTime, endTime);
        const result = runFiveEmaBacktest(candles, {
            riskRewardMultiplier: Number(req.body?.riskRewardMultiplier ?? 3),
        });

        res.json({
            symbol,
            interval,
            source: provider.name,
            candles,
            candlesUsed: candles.length,
            historyStartTime: candles[0]?.time ?? null,
            historyEndTime: candles[candles.length - 1]?.time ?? null,
            result,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Backtest failed',
            source: provider.name,
        });
    }
});

router.post('/forward-test', async (req, res) => {
    try {
        const symbol = String(req.body?.symbol ?? 'XAUUSDT').toUpperCase();
        const interval = String(req.body?.interval ?? '1h');
        const lookback = Number(req.body?.lookback ?? 300);
        const candles = await provider.fetchCandles(symbol, interval as any, lookback);
        const result = runFiveEmaBacktest(candles, {
            riskRewardMultiplier: Number(req.body?.riskRewardMultiplier ?? 3),
        });

        res.json({
            symbol,
            interval,
            source: provider.name,
            mode: 'forward-simulated',
            candlesUsed: candles.length,
            result,
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Forward test failed',
            source: provider.name,
        });
    }
});

export default router;
