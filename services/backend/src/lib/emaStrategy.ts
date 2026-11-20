import type { Candle, StrategyBacktestResult, StrategyTrade, Timeframe } from '../types/market.js';

const defaultRiskReward = 3;

const average = (values: number[]): number => {
    if (!values.length) {
        return 0;
    }

    return values.reduce((total, value) => total + value, 0) / values.length;
};

export const calculateEma = (values: number[], period: number): number[] => {
    if (!values.length) {
        return [];
    }

    const multiplier = 2 / (period + 1);
    const output: number[] = [];
    let previous = values[0];

    values.forEach((value, index) => {
        previous = index === 0 ? value : value * multiplier + previous * (1 - multiplier);
        output.push(previous);
    });

    return output;
};

export const runFiveEmaBacktest = (
    candles: Candle[],
    options: { riskRewardMultiplier?: number } = {},
): StrategyBacktestResult => {
    const riskRewardMultiplier = options.riskRewardMultiplier ?? defaultRiskReward;
    const closes = candles.map((candle) => candle.close);
    const emaValues = calculateEma(closes, 5);
    const trades: StrategyTrade[] = [];

    for (let index = 2; index < candles.length - 1; index += 1) {
        const first = candles[index - 2];
        const second = candles[index - 1];
        const current = candles[index];
        const emaAtFirst = emaValues[index - 2] ?? emaValues[emaValues.length - 1];
        const emaAtSecond = emaValues[index - 1] ?? emaValues[emaValues.length - 1];

        const longSetup =
            first.close < emaAtFirst &&
            second.close < emaAtSecond &&
            first.high < emaAtFirst &&
            second.high < emaAtSecond &&
            first.open < first.close &&
            second.open > second.close &&
            current.high > second.high;

        const shortSetup =
            first.close > emaAtFirst &&
            second.close > emaAtSecond &&
            first.low > emaAtFirst &&
            second.low > emaAtSecond &&
            first.open > first.close &&
            second.open < second.close &&
            current.low < second.low;

        if (!longSetup && !shortSetup) {
            continue;
        }

        const side = longSetup ? 'long' : 'short';
        const entryPrice = side === 'long' ? second.high : second.low;
        const stopPrice = side === 'long' ? second.low : second.high;
        const risk = side === 'long' ? entryPrice - stopPrice : stopPrice - entryPrice;

        if (risk <= 0) {
            continue;
        }

        const targetPrice = side === 'long' ? entryPrice + risk * riskRewardMultiplier : entryPrice - risk * riskRewardMultiplier;

        let exitPrice = entryPrice;
        let exitIndex = index;
        let brief = `${side.toUpperCase()} setup confirmed`;

        for (let j = index + 1; j < candles.length; j += 1) {
            const next = candles[j];
            if (side === 'long') {
                if (next.low <= stopPrice) {
                    exitPrice = stopPrice;
                    exitIndex = j;
                    brief = 'Long trade stopped out';
                    break;
                }

                if (next.high >= targetPrice) {
                    exitPrice = targetPrice;
                    exitIndex = j;
                    brief = 'Long trade reached target';
                    break;
                }
            } else if (next.high >= stopPrice) {
                exitPrice = stopPrice;
                exitIndex = j;
                brief = 'Short trade stopped out';
                break;
            } else if (next.low <= targetPrice) {
                exitPrice = targetPrice;
                exitIndex = j;
                brief = 'Short trade reached target';
                break;
            }
        }

        const pnl = side === 'long' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);

        trades.push({
            entryTime: current.time,
            exitTime: candles[Math.min(exitIndex, candles.length - 1)].time,
            side,
            entryPrice,
            exitPrice,
            pnl,
            stopPrice,
            targetPrice,
            brief,
        });
    }

    const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    const profitTrades = trades.filter((trade) => trade.pnl > 0).length;
    const averageTradePnl = trades.length ? average(trades.map((trade) => trade.pnl)) : 0;
    const grossProfit = trades.filter((trade) => trade.pnl > 0).reduce((sum, trade) => sum + trade.pnl, 0);
    const grossLoss = Math.abs(trades.filter((trade) => trade.pnl < 0).reduce((sum, trade) => sum + trade.pnl, 0));
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? null : 0) : grossProfit / grossLoss;

    const pnlEvents = new Map<number, { entries: number; exits: number }>();
    for (const trade of trades) {
        const entryEvent = pnlEvents.get(trade.entryTime) ?? { entries: 0, exits: 0 };
        entryEvent.entries += trade.pnl;
        pnlEvents.set(trade.entryTime, entryEvent);

        if (trade.exitTime !== 0) {
            const exitEvent = pnlEvents.get(trade.exitTime) ?? { entries: 0, exits: 0 };
            exitEvent.exits += trade.pnl;
            pnlEvents.set(trade.exitTime, exitEvent);
        }
    }

    let activeTradePnl = 0;
    const equityCurve = candles.map((candle) => {
        const event = pnlEvents.get(candle.time);
        activeTradePnl += event?.entries ?? 0;
        const point = { time: candle.time, equity: activeTradePnl + totalPnl };
        activeTradePnl -= event?.exits ?? 0;
        return point;
    });

    return {
        symbol: candles[0]?.symbol ?? 'UNKNOWN',
        interval: candles[0]?.interval ?? '1h',
        totalTrades: trades.length,
        totalPnl,
        winRate: trades.length ? (profitTrades / trades.length) * 100 : 0,
        averageTradePnl,
        profitFactor,
        trades,
        equityCurve,
    };
};

export const getDefaultSymbols = (): string[] => ['XAUUSDT', 'BTCUSDT', 'ETHUSDT'];

export const timeframeOptions: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
