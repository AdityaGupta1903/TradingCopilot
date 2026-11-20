import type { StrategyResult } from '../types';

interface StrategyPanelProps {
    result: StrategyResult | null;
}

export const StrategyPanel = ({ result }: StrategyPanelProps) => {
    if (!result) {
        return <div className="panel empty-panel">Run a strategy simulation to see results.</div>;
    }

    const formatTime = (time: number) => new Date(time).toLocaleString(undefined, {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

    const cards = [
        { label: 'Total PnL', value: `$${result.totalPnl.toFixed(2)}` },
        { label: 'Win rate', value: `${result.winRate.toFixed(1)}%` },
        { label: 'Trades', value: String(result.totalTrades) },
        { label: 'Profit factor', value: result.profitFactor === null ? '∞' : result.profitFactor.toFixed(2) },
    ];

    return (
        <div className="panel">
            <div className="kpi-grid">
                {cards.map((card) => (
                    <div key={card.label} className="kpi-card">
                        <div className="kpi-label">{card.label}</div>
                        <div className="kpi-value">{card.value}</div>
                    </div>
                ))}
            </div>

            <div className="trade-list">
                {result.candlesUsed !== undefined ? (
                    <p className="muted backtest-range">
                        {result.candlesUsed.toLocaleString()} candles tested
                        {result.historyStartTime && result.historyEndTime
                            ? ` · ${formatTime(result.historyStartTime)} to ${formatTime(result.historyEndTime)}`
                            : ''}
                    </p>
                ) : null}
                {result.trades.length ? (
                    <>
                        <div className="trade-header">
                            <span>Side</span>
                            <span>Entry time</span>
                            <span>Exit time</span>
                            <span>P&amp;L</span>
                        </div>
                        {[...result.trades].reverse().map((trade, index) => (
                            <div className="trade-row" key={`${trade.entryTime}-${index}`}>
                                <strong className={trade.side === 'long' ? 'trade-long' : 'trade-short'}>{trade.side.toUpperCase()}</strong>
                                <span>{formatTime(trade.entryTime)}</span>
                                <span>{formatTime(trade.exitTime)}</span>
                                <span className={trade.pnl >= 0 ? 'trade-positive' : 'trade-negative'}>
                                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </>
                ) : (
                    <p className="muted">No valid 5 EMA setups were identified in the current sample.</p>
                )}
            </div>
        </div>
    );
};
