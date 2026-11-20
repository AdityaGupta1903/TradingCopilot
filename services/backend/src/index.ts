import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import marketRoutes from './routes/market.js';
import simulationRoutes from './routes/simulation.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
    res.json({
        ok: true,
        service: 'tradingcopilot-backend',
        provider: config.marketDataProvider,
        demoMode: config.demoMode,
    });
});

app.use('/api/market', marketRoutes);
app.use('/api/simulation', simulationRoutes);

app.listen(config.port, () => {
    console.log(`TradingCopilot backend running on http://localhost:${config.port}`);
});
