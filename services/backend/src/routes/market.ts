import { Router } from 'express';
import { createMarketProvider } from '../services/binanceProvider.js';
import type { Timeframe } from '../types/market.js';

const router = Router();
const provider = createMarketProvider();
const supportedSymbols = ['XAUUSDT', 'BTCUSDT', 'ETHUSDT'];

const validTimeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

const normalizeTimeframe = (value: string | undefined): Timeframe => {
    if (!value || !validTimeframes.includes(value as Timeframe)) {
        return '1h';
    }

    return value as Timeframe;
};

router.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        provider: provider.name,
        supportedSymbols,
        intervals: validTimeframes,
    });
});

router.get('/symbols', (_req, res) => {
    res.json({
        symbols: supportedSymbols,
        source: provider.name,
    });
});

router.get('/candles', async (req, res) => {
    try {
        const symbol = String(req.query.symbol ?? 'XAUUSDT').toUpperCase();
        const interval = normalizeTimeframe(String(req.query.interval ?? '1h'));
        const limit = Number(req.query.limit ?? 300);

        const candles = await provider.fetchCandles(symbol, interval, Number.isFinite(limit) ? limit : 300);
        res.json({ symbol, interval, candles, source: provider.name });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unable to fetch candles',
            source: provider.name,
        });
    }
});

router.get('/quote', async (req, res) => {
    try {
        const symbol = String(req.query.symbol ?? 'XAUUSDT').toUpperCase();
        const interval = normalizeTimeframe(String(req.query.interval ?? '1h'));
        const quote = await provider.getLatestQuote(symbol, interval);
        res.json({ symbol, interval, quote, source: provider.name });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unable to fetch quote',
            source: provider.name,
        });
    }
});

export default router;
