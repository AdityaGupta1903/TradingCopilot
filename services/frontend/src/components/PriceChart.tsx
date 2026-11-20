import { useEffect, useRef } from 'react';
import {
    CandlestickSeries,
    ColorType,
    CrosshairMode,
    createChart,
    createSeriesMarkers,
    LineSeries,
} from 'lightweight-charts';
import type {
    IChartApi,
    ISeriesApi,
    ISeriesMarkersPluginApi,
    SeriesMarker,
    Time,
    UTCTimestamp,
} from 'lightweight-charts';
import type { Candle, Trade } from '../types';

interface PriceChartProps {
    candles: Candle[];
    trades?: Trade[];
}

export const PriceChart = ({ candles, trades = [] }: PriceChartProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
    const hasFittedContentRef = useRef(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const chart = createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight,
            layout: {
                background: { type: ColorType.Solid, color: '#0b1117' },
                textColor: '#aeb8c2',
                fontFamily: 'Inter, sans-serif',
            },
            grid: {
                vertLines: { color: '#1b232d' },
                horzLines: { color: '#1b232d' },
            },
            crosshair: { mode: CrosshairMode.Normal },
            rightPriceScale: { borderColor: '#303944' },
            timeScale: { borderColor: '#303944', timeVisible: true, secondsVisible: false },
        });
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });
        const emaSeries = chart.addSeries(LineSeries, {
            color: '#d58cff',
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
        });
        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;
        emaSeriesRef.current = emaSeries;
        markersRef.current = createSeriesMarkers(candleSeries);

        const resizeObserver = new ResizeObserver(([entry]) => {
            chart.applyOptions({
                width: Math.floor(entry.contentRect.width),
                height: Math.floor(entry.contentRect.height),
            });
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
            chartRef.current = null;
            candleSeriesRef.current = null;
            emaSeriesRef.current = null;
            markersRef.current = null;
            hasFittedContentRef.current = false;
        };
    }, []);

    useEffect(() => {
        const candleSeries = candleSeriesRef.current;
        const emaSeries = emaSeriesRef.current;
        const markers = markersRef.current;
        if (!candleSeries || !emaSeries || !markers) {
            return;
        }

        const chartCandles = candles.map((candle) => ({
            time: Math.floor(candle.time / 1000) as UTCTimestamp,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
        }));
        let previousEma: number | undefined;
        const multiplier = 2 / 6;
        const emaPoints = candles.map((candle) => {
            previousEma = previousEma === undefined
                ? candle.close
                : candle.close * multiplier + previousEma * (1 - multiplier);
            return { time: Math.floor(candle.time / 1000) as UTCTimestamp, value: previousEma };
        });

        candleSeries.setData(chartCandles);
        emaSeries.setData(emaPoints);
        if (chartCandles.length && !hasFittedContentRef.current) {
            chartRef.current?.timeScale().fitContent();
            hasFittedContentRef.current = true;
        }

        const visibleTimes = new Set(chartCandles.map((candle) => Number(candle.time)));
        const tradeMarkers: SeriesMarker<Time>[] = [];
        for (const trade of trades) {
            const entryTime = Math.floor(trade.entryTime / 1000) as UTCTimestamp;
            if (visibleTimes.has(Number(entryTime))) {
                tradeMarkers.push({
                    time: entryTime,
                    position: trade.side === 'long' ? 'belowBar' : 'aboveBar',
                    shape: trade.side === 'long' ? 'arrowUp' : 'arrowDown',
                    color: trade.side === 'long' ? '#26a69a' : '#ef5350',
                    text: `${trade.side === 'long' ? 'Long' : 'Short'} entry`,
                });
            }

            const exitTime = Math.floor(trade.exitTime / 1000) as UTCTimestamp;
            if (visibleTimes.has(Number(exitTime))) {
                tradeMarkers.push({
                    time: exitTime,
                    position: trade.side === 'long' ? 'aboveBar' : 'belowBar',
                    shape: 'circle',
                    color: trade.pnl >= 0 ? '#7bd88f' : '#ff8b82',
                    text: 'Exit',
                });
            }
        }
        tradeMarkers.sort((left, right) => Number(left.time) - Number(right.time));
        markers.setMarkers(tradeMarkers);
    }, [candles, trades]);

    return (
        <div className="chart-shell">
            <div className="chart-legend" aria-label="Chart legend">
                <span><i className="legend-mark ema-mark" />5 EMA</span>
                <span><i className="legend-mark long-mark" />Long entry</span>
                <span><i className="legend-mark short-mark" />Short entry</span>
                <span><i className="legend-mark exit-mark" />Exit</span>
            </div>
            <div className="chart-wrap" ref={containerRef} />
            {!candles.length ? <div className="chart-empty">Loading market data...</div> : null}
            <a className="chart-attribution" href="https://www.tradingview.com/" target="_blank" rel="noreferrer">
                TradingView Lightweight Charts
            </a>
        </div>
    );
};
