import { useEffect, useState } from 'react';
import { fetchCandles, fetchQuote, runBacktest, runForwardTest } from './api/client';
import { PriceChart } from './components/PriceChart';
import { StrategyPanel } from './components/StrategyPanel';
import type { Candle, Quote, StrategyResult, Timeframe } from './types';

const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
const defaultSymbols = ['XAUUSDT', 'BTCUSDT', 'ETHUSDT'];

const App = () => {
    const [symbol, setSymbol] = useState('XAUUSDT');
    const [interval, setInterval] = useState<Timeframe>('5m');
    const [candles, setCandles] = useState<Candle[]>([]);
    const [quote, setQuote] = useState<Quote | null>(null);
    const [result, setResult] = useState<StrategyResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [simulationMode, setSimulationMode] = useState<'backtest' | 'forward' | null>(null);
    const [error, setError] = useState('');

    const loadMarketData = async () => {
        try {
            setLoading(true);
            const [nextCandles, nextQuote] = await Promise.all([
                fetchCandles(symbol, interval, 300),
                fetchQuote(symbol, interval),
            ]);
            setCandles(nextCandles.slice(-300));
            setQuote(nextQuote);
            setError('');
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Unable to load market data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMarketData();
        const timer = window.setInterval(() => {
            void loadMarketData();
        }, 15000);

        return () => window.clearInterval(timer);
    }, [symbol, interval]);

    const handleSimulation = async (mode: 'backtest' | 'forward') => {
        setSimulationMode(mode);
        setLoading(true);

        try {
            const nextResult =
                mode === 'backtest'
                    ? await runBacktest(symbol, interval)
                    : await runForwardTest(symbol, interval, 300);
            setResult(nextResult);
            setError('');
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Simulation failed');
        } finally {
            setLoading(false);
            setSimulationMode(null);
        }
    };

    return (
        <div className="page-shell">
            <header className="topbar">
                <div>
                    <p className="eyebrow">TradingCopilot</p>
                    <h1>Market workspace</h1>
                </div>
                <div className="status-pill">{quote ? `Live ${quote.price.toFixed(2)}` : 'Connecting…'}</div>
            </header>

            <main className="layout">
                <section className="panel chart-panel">
                    <div className="toolbar">
                        <label>
                            Symbol
                            <select value={symbol} onChange={(event) => { setResult(null); setSymbol(event.target.value); }}>
                                {defaultSymbols.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Timeframe
                            <select value={interval} onChange={(event) => { setResult(null); setInterval(event.target.value as Timeframe); }}>
                                {timeframes.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <button type="button" disabled={simulationMode !== null} onClick={() => void handleSimulation('backtest')}>
                            Run backtest
                        </button>
                        <button type="button" className="secondary" disabled={simulationMode !== null} onClick={() => void handleSimulation('forward')}>
                            Run forward test
                        </button>
                    </div>

                    {error ? <div className="error-box">{error}</div> : null}

                    <div className="market-meta">
                        <div>
                            <span className="muted-label">Price</span>
                            <strong>{quote ? `$${quote.price.toFixed(2)}` : '—'}</strong>
                        </div>
                        <div>
                            <span className="muted-label">24h change</span>
                            <strong>{quote ? `${quote.changePercent.toFixed(2)}%` : '—'}</strong>
                        </div>
                        <div>
                            <span className="muted-label">High</span>
                            <strong>{quote ? `$${quote.high.toFixed(2)}` : '—'}</strong>
                        </div>
                        <div>
                            <span className="muted-label">Low</span>
                            <strong>{quote ? `$${quote.low.toFixed(2)}` : '—'}</strong>
                        </div>
                    </div>

                    <PriceChart candles={result?.candles ?? candles} trades={result?.trades ?? []} />
                </section>

                <aside className="panel side-panel">
                    <h2>5 EMA strategy</h2>
                    <p className="muted">
                        This engine evaluates breakout setups that remain on one side of the 5-period EMA, with an intrabar trigger and 3R target logic.
                    </p>
                    <StrategyPanel result={result} />
                </aside>
            </main>

            <div className="footer-note">
                {simulationMode === 'backtest'
                    ? `Loading one year of ${interval} history and running the backtest…`
                    : simulationMode === 'forward'
                        ? 'Running the forward simulation…'
                        : loading
                            ? 'Refreshing market state…'
                            : 'Live public market data with simulated trades only.'}
            </div>
        </div>
    );
};

export default App;
