import { afterEach, describe, expect, it, vi } from 'vitest';
import { OkxMarketProvider } from './okxProvider.js';

const response = (data: Array<[string, string, string, string, string, string]>) => ({
    ok: true,
    json: async () => ({ code: '0', msg: '', data }),
});

describe('OkxMarketProvider', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('paginates older candles and returns the requested range in ascending order', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(response([
                ['300000', '3', '4', '2', '3.5', '30'],
                ['200000', '2', '3', '1', '2.5', '20'],
            ]))
            .mockResolvedValueOnce(response([
                ['100000', '1', '2', '0', '1.5', '10'],
                ['50000', '0.5', '1', '0', '0.8', '5'],
            ]));
        vi.stubGlobal('fetch', fetchMock);

        const candles = await new OkxMarketProvider().fetchHistoricalCandles('XAUUSDT', '5m', 150000, 350000);

        expect(candles.map((candle) => candle.time)).toEqual([200000, 300000]);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(String(fetchMock.mock.calls[0][0])).toContain('after=350001');
        expect(String(fetchMock.mock.calls[1][0])).toContain('after=200000');
    });
});