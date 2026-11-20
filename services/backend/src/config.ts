import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

dotenv.config();

export const config = {
    port: Number(process.env.PORT ?? 4000),
    marketDataProvider: process.env.MARKET_DATA_PROVIDER ?? 'okx',
    okxBaseUrl: process.env.OKX_BASE_URL ?? 'https://www.okx.com',
    binanceBaseUrl: process.env.BINANCE_BASE_URL ?? 'https://api.binance.com',
    binanceFuturesBaseUrl: process.env.BINANCE_FUTURES_BASE_URL ?? 'https://fapi.binance.com',
    demoMode: (process.env.DEMO_MODE ?? 'false').toLowerCase() === 'true',
};
