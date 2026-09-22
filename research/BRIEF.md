# Stocklana: the brief every idea agent works from (2026-09-22)

## The event, from the live page (read today, not from a paste)
Stocklana, Solana Foundation. https://hackathons.solana.com/hackathons/stocklana
- Submissions close **Friday 25 September 2026, 4:00 pm ET** (~20:00 UTC). About 3 days. Judging to 2 October.
- 813 registered, **161 projects already submitted**. The gallery is hidden until judging, so the field can only
  be seen through public posts and repos (research/grok-2026-09-22.md).
- Prizes: main track $100,000 (Solana Foundation) + bounties: PreStocks $10k (3 winners 5/3/2; any non-PreStocks
  pre-IPO token makes you ineligible), Tessera $6k (t-OpenAI, t-Kalshi), Clawpump $5k (3 winners; requires a
  token launched with a **stock-paired** liquidity pool via Clawpump + Meteora), Meteora DBC $5k ("working code
  on mainnet beats slides"), Pyth (3 months Pyth Pro, non-cash).
- Submission needs at least one link: GitHub, live demo, or video. One submission per team. Original work.
- **The judges' one question, verbatim:** "could this be a real app that people will actually use?" They look for
  a real user and problem, a working end-to-end demo, a reason it belongs on Solana, and quality of execution.
- The rules name five wedges: trading (24/7 venues, order books, swaps), investing (recurring buys, index
  baskets, robo portfolios), credit and yield, infrastructure (price feeds, corporate actions, compliance,
  analytics), consumer (mobile-first, social, spending from a portfolio). "Pick one wedge and make it excellent."

## Who is building (research/grok-2026-09-22.md, live X + GitHub, 175 sources)
- **Crowded to saturation: the read-only dashboard.** 14 named public repos (After Hours, Afterbell, STOCKNINE,
  stock.sh, GapGuard, Closing Bell, Henar, Multiplier, Sharelens, PreStocks Lens, MITIGATOR, tape-stocklana,
  noctis, fairfill). Same loop: Jupiter + Pyth + Finnhub, a table, maybe a paper trade. Do not build this.
- **Second crowded: deposit xStock, borrow USDC, earn yield.** 8 named (Stax, StockSpend, Backdoor, Anala,
  Othello, DividendX, hanko, Erodoro). A weekend program will not beat Kamino.
- Medium: index/basket/recurring (6 named, two live on mainnet). Consumer/social/games (6 named).
- **Thinnest public field: agents and launchpads.** stockcurve's own 15 Sep competitor scan says no live mainnet
  DBC quoted in a stock token exists; Clawpump confirms its featured pool is still HWEEN/SOL, not stock-paired.
- Coverage limit: ~130 of the 161 submissions are invisible. Absence of a public repo is weak evidence.

## What holders actually complain about (repeated, multi-voice, dated)
1. Dividends accrete into a multiplier and are never paid as cash; the wallet balance lies (@RwaLlama, @steinRWA,
   22 Sep; Kraken xStocks FAQ). Two repos already *watch* this; none *acts* on it.
2. Off-hours and weekend depth is thin and price drifts (@RStudios64042 15 Sep, @gupta_kanv 15 Sep,
   @DYORTerminal 22 Sep, Kraken FAQ). 63% of volume is after-hours (DEMAND.md).
3. You do not own the share; you are a creditor of the vehicle (Ondo's own terms via @RwaLlama, 22 Sep).
Plus: $5k redeem minimum + KYC to reach a real share; SpaceX allocation failure (Bybit, Jun 2026); the Edel
wGOOGLx exploit (Jul 2026) where the wrapper was gamed while the stock did not move.
Measured demand (DEMAND.md): 801,439 addresses holding tokenized equities (12 Sep), $4.9B H1 volume, 95%+ of the
category on Solana, PreStocks 100,000 holders and $3.3M first-week volume.

## What the sponsors say they want
PreStocks: usage that drives value, not another premium chart; their own stated problem is the discount and thin
USDC liquidity. Tessera: "a flow that gives t-tokens a reason to move"; t-tokens are not equity. Clawpump: a
stocknized agent with a stock-paired pool. Meteora: new curves, fee models, quote assets, graduation mechanics,
price discovery for thinly traded or newly tokenized pairs; mainnet code over slides. Pyth: data doing real work.

## What has earned "this is a product" in past Solana hackathons
Unruggable, Trepa, Pregame, TypeX, TapeDrive, CrowdBrain. The pattern: **one action a stranger can finish in two
minutes, on a phone or a wallet they already have, with a receipt on-chain.** Not a research console.

## The builder and the constraints
Solo founder with Claude Code and a pipeline that produces a measured, top-0.1% frontend (SURFACE: a charter, a
wonder gate, a Ruler that refuses clipped text and dead canvases, a headed run on his own screen). He has shipped
a real data instrument before: a crawler, an indexer, statistics with denominators published with a method.
Hard constraints: ~2.5 working days; one person; no team; mainnet spending only if he says yes and only small;
never a fabricated figure; the last project failed because nobody had asked for it, so the demand line must be
real and named. Stack defaults to avoid in 72 h: multi-chain, custom L2, two-sided marketplace liquidity,
perfect design system before the core action works.
