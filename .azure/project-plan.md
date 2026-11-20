# TradingCopilot Project Plan

Status: Approved
Execution mode: local

## Overview

Build a browser-based trading tool for charting market candles, loading live updates, and running a 5 EMA strategy simulation in both backtest and forward-test modes. The project should remain runnable locally and be structured for Azure-friendly extension later without deploying during this phase.

## Scope

- Frontend React + TypeScript dashboard for ticker selection, charting, and strategy reporting
- Backend TypeScript API for market data access and simulation engine
- Free-tier public market data provider integration via Binance public endpoints
- 5 EMA strategy engine with trade simulation and risk/reward rules
- Local development only; no Azure deployment in this phase

## Services

- frontend: services/frontend
- backend: services/backend

## Data provider

Use Binance public endpoints as the default provider, with a provider interface that can be swapped to another exchange or Azure-hosted provider later.

## Verification

- Backend smoke tests cover the 5 EMA strategy behavior.
- Frontend build verifies the React app compiles.
- Local runtime verification is performed with the smallest relevant build/test commands.
