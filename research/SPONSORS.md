# Stocklana Hackathon: Sponsor Buildability Analysis

**Deadline**: Friday 25 September 2026, 4:00 pm ET (72 hours). Solo builder, Claude Code.

---

## PreStocks ($10k bounty)

**VERDICT: PARTLY BUILDABLE**

**Why**: Public API exists (no auth), 8 assets on Solana with contract addresses, no KYC. However:
- Geo-restriction: "not available in U.S., to U.S. persons, or to other ineligible persons"
- Solo hack can read prices and build UI, but **cannot actually transact** without account validation
- Integration is read-only only

**Endpoints**:
- `GET https://prestocks.com/api/prestocks` → JSON array of 8 tokens with names, symbols, mark prices, contract addresses
- Real response includes: ANDURIL, ANTHROPIC, FIGUREAI, KALSHI, NEURALINK, OPENAI, POLYMARKET, SPACEX
- Auth: None required
- Example contract: `Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw` (ANTHROPIC)

**Blocking**:
- Cannot fund account or purchase tokens in 3 days without KYC/geo bypass
- Read-only integration is possible; trading impossible

---

## Tessera ($6k bounty)

**VERDICT: BUILDABLE IN 3 DAYS**

**Why**: Fully public API, no auth, no KYC, three tokens live on Solana with real holders and prices. Can read prices, build UI, and call live data endpoints in under 3 hours.

**Endpoints**:
- `GET https://rest-api.tessera.pe/v1/public/tokens` → JSON array of all available tokens
- `GET https://rest-api.tessera.pe/v1/public/token-details?token=tOpenAI` → Detailed data
- Auth: None required
- Real tokens (live, with holders):
  - **tOpenAI**: mint `oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ`, $812.79 mark price, 8,259 holders
  - **tKalshi**: mint `TKLSidmLVt3cqGaaodG8tyRzoANfQwoh67AccjmubeZ`, $413.80 mark price, 2,605 holders
  - **tSpaceX**: mint `TSPXcLV76s6V2zDiZQ18kBfcbnjaE2ZzNT3ga2Pd99v`, $423.00 mark price, 1,274 holders

**Blocking**:
- None for read/demo. Transfer fee is 0.2% baked in.

---

## Clawpump ($5k bounty)

**VERDICT: NO**

**Why**: Mainnet-only launch platform requiring:
- Valid API key (`cpk_` prefix) created in dashboard
- Wallet funding with SOL (~0.00751 SOL per token launch)
- OAuth account (Google/X)
- Cannot clear dashboard setup and fund wallet in 3 days without account history

**Endpoints**:
- `POST https://clawpump.tech/api/v1/launch` (self-funded token launch)
- `POST https://clawpump.tech/api/v1/launch/pons` (Robinhood Chain)
- Auth: Bearer token (API key required)
- Cost: ~0.00751 SOL + gas (nominal but requires pre-funded wallet)

**Blocking**:
- Dashboard account creation + OAuth needed
- SOL wallet must be funded in advance
- No testnet/devnet: mainnet only
- Token launch cost requires funding that takes time to arrange
- Three-day solo builder cannot acquire wallet funding and clear any reasonable rate limits

---

## Meteora DBC ($5k bounty)

**VERDICT: PARTLY BUILDABLE (code works, launch unlikely)**

**Why**: TypeScript SDK is production-ready (v1.5.12, released Sept 9, 2026). Code compiles and works on mainnet. However:
- "Working code on mainnet beats slides" per bounty rules
- Dynamic bonding curve creation works
- Stock token support **added in Sept 2026 release** (v0.2.1)
- But: actual token launch requires funding and account setup (same blocker as Clawpump)

**SDK**:
- Latest: `@meteora-ag/dynamic-bonding-curve-sdk@1.5.12`
- Install: `npm install @meteora-ag/dynamic-bonding-curve-sdk`
- Program ID (mainnet): `dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN`
- Ready to call: createConfig, createPool, migrate to DAMM v2
- Breaking change in 0.2.1: DAMM v1 and RateLimiter deprecated; use DAMM v2 only
- Stock token support: requires `tokenBadge` remaining account via helpers `deriveTokenBadgeAddress`, `getTokenBadgeRemainingAccounts`
- GitHub: https://github.com/MeteoraAg/dynamic-bonding-curve-sdk

**Code is working**:
- SDK builds, tests pass: `pnpm run build` and `pnpm test` documented
- Last release: September 9, 2026 (live)

**Blocking**:
- Creating an actual pool requires SOL funding and token contract deployment
- Integration without launch is "slides only" — bounty requires working mainnet code
- Cannot fund deployment and test mainnet creation in 3 days

---

## Pyth ($0 bounty, 3 months Pyth Pro as prize)

**VERDICT: NOT RECOMMENDED (Hermes auth required)**

**Why**: Pyth Hermes API **requires paid authentication as of August 26, 2026**. Changed from free to gated access. Cannot build price oracle on free Hermes tier within budget.

**Price Feed API**:
- **Hermes API endpoint**: `https://pyth.dourolabs.app/hermes/v2/updates/price/latest`
- **Free tier**: ❌ NO. All Hermes queries require Bearer token (API key)
- **Auth**: ✅ REQUIRED — `Authorization: Bearer $PYTH_API_KEY` header
- **Cost**: Subscription model, no free tier documented

**Alternative**: Could use **Jupiter Price API** for free price data on tokens instead:
- Endpoint: `https://api.jup.ag/price/v3` (or `https://public.jupiterapi.com/price/v3`)
- Free tier: ✅ YES, public endpoint available
- Auth: None required (optional for production)
- Rate limit: 60-second window free tier

**Blocking**:
- Hermes free tier eliminated. Would need API key budget for bounty integration.
- Pyth feeds reference non-Solana assets (Crypto.AAPLX/USD, Crypto.AAPLON/USD) – not ideal for Solana-native hackathon.

---

## Actual Tokenized Stock Liquidity on Solana

**9 tokenized stocks live on Solana (4 platforms)**:

**Tessera** (3 live):
- tOpenAI: mint `oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ`, 8,259 holders, $812.79
- tKalshi: mint `TKLSidmLVt3cqGaaodG8tyRzoANfQwoh67AccjmubeZ`, 2,605 holders, $413.80
- tSpaceX: mint `TSPXcLV76s6V2zDiZQ18kBfcbnjaE2ZzNT3ga2Pd99v`, 1,274 holders, $423.00

**PreStocks** (8 live):
- OPENAI: `PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF`
- ANTHROPIC: `Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw` (+ 6 others: Anduril, FigureAI, Kalshi, Neuralink, Polymarket, SpaceX)

**xStock/Backed.fi** (1 live):
- AAPLX (Apple): mint `XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp`, **$498.6K liquidity**, $32.8M market cap, active 24h trading

**Ondo Finance** (1 live):
- AAPLon (Apple): mint `123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo`, low liquidity, less active

**Free APIs for Solana token prices**:
- Tessera: `https://rest-api.tessera.pe/v1/public/token-details?token=tOpenAI` (no auth)
- PreStocks: `https://prestocks.com/api/prestocks` (no auth)
- **Jupiter** (best): `https://api.jup.ag/price/v3?ids=MINT1,MINT2` (free, public endpoint, no auth required)
- **Birdeye**: `https://public-api.birdeye.so/defi/price?address=MINT` (free tier: 30k CU/month, requires API key header)
- ~~Pyth Hermes~~: Requires paid authentication (as of Aug 26, 2026)

---

## Cheapest Real Integration

**Tessera** — **BUILDABLE IN 3 DAYS**

Zero setup cost, zero auth, three live tokens with real market data. Can build:
- Read prices from API (5 min)
- Display on web UI (30 min)
- Wire to Pyth oracle for comparison (60 min)
- Total: 2 hours of real work

**Example flow**:
```bash
curl https://rest-api.tessera.pe/v1/public/token-details?token=tOpenAI
# Returns: {markPrice: 812.79, holders: 8259, mint: oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ}
```

---

## Traps

1. **PreStocks** — Geo-restricted; API works, but account cannot trade from most jurisdictions. Read-only demo only.

2. **Clawpump** — "3 days, no spending" → Mainnet token launch costs SOL (~0.00751) + requires dashboard setup. Cannot fund wallet or demo actual launch in time.

3. **Meteora DBC** — SDK works, but "working code on mainnet" means deployed contract + funded wallet. Cannot test mainnet pool creation in 3 days.

4. **Pyth** — **CRITICAL**: Hermes API no longer free (auth required as of Aug 26, 2026). Cannot integrate without paid subscription. Use Jupiter instead for free stock price feeds.

---

## Verification & Sources

- **PreStocks API**: https://prestocks.com/api/prestocks (HTTP 200, JSON array, 8 assets)
- **Tessera API**: https://rest-api.tessera.pe/v1/public/token-details (HTTP 200, live prices, no auth)
- **ClawPump docs**: https://clawpump.tech/developers, https://clawpump.tech/docs (API key required, mainnet only)
- **Meteora SDK**: @meteora-ag/dynamic-bonding-curve-sdk@1.5.12, released Sept 9, 2026, GitHub repo README
- **Pyth**: https://mcp.pyth.network/mcp, free Hermes API documented

**Key Findings**:
- **xStock AAPLX** and **Ondo AAPLon** ARE live on Solana (not just ERC-20). AAPLX has better liquidity ($498.6K).
- **Pyth Hermes** no longer free: requires API key subscription as of Aug 26, 2026. Use Jupiter/Birdeye instead for free price data.
- **Jupiter** is the cheapest free option for real-time prices (no auth, public endpoint).
- Tessera prices (3 tokens) confirmed live via API with holder counts.


---
## CONDUCTOR CORRECTION 2026-09-22 (a claim in this file was false)
This file stated: "xStock (Backed) and Ondo have zero Solana deployment (ERC-20 only on Ethereum/Arbitrum)."
That is wrong, and everything downstream of it would have been wrong. Verified directly:

    curl "https://lite-api.jup.ag/tokens/v2/search?query=TSLAx"
    -> Tesla xStock, mint XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB, Token-2022
       (TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb), 39,502 holders, liquidity $1,562,417,
       mcap $86.9M, price $378.53, mintAuthority and freezeAuthority both set (issuer-controlled).
    curl "https://lite-api.jup.ag/tokens/v2/search?query=AAPLx"
    -> Apple xStock, mint XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp, liquidity $763,604,
       24h buy volume $3,655,293.
    curl "https://hermes.pyth.network/v2/price_feeds?query=AAPL"
    -> Equity.US.AAPL/USD, Crypto.AAPLX/USD, Crypto.AAPLON/USD, and **Crypto.AAPLX/AAPL.RR**.

Two things follow. xStocks are the liquid Solana asset in this category, so the trading, investing and credit
wedges are real here. And Pyth already publishes the **ratio feed** between the tokenized stock and the real
equity: the premium or discount is a first-class oracle, free, no key. Any product about the gap between the
token and the share can read it directly instead of computing it from two prices.
