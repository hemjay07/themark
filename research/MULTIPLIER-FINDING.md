# The finding that makes THE MARK correct where the field is wrong (conductor, 2026-09-22 14:20Z)

Decoded the mint accounts directly (`getAccountInfo`, jsonParsed, mainnet):

| mint | extensions | multiplier |
|---|---|---|
| AAPLx `XsbEhLAt` | metadataPointer, permanentDelegate, defaultAccountState, **scaledUiAmountConfig**, pausableConfig, confidentialTransferMint, transferHook, tokenMetadata | 1.00266421 -> **1.00326901** (+0.0603%), effective 2026-08-08 |
| SPYx `XsoCS1Tf` | same set | 1.00390924 -> **1.00571456** (+0.1798%), effective 2026-06-18 |
| TSLAx, PLTRx, INTCx | same set | 1 (no accretion yet) |
| tOpenAI `oPAiAikW` | **transferFeeConfig 20 bps**, metadataPointer, tokenMetadata | n/a |

## Why it matters
`scaledUiAmountConfig` is the multiplier the holders complain about: @RwaLlama, 22 Sep, "the token's multiplier
just ticks up" instead of paying a dividend. It is on-chain, readable, and it carries the **next** multiplier
and the timestamp it takes effect.

It is also the correctness test for this product. Jupiter quotes in raw units; the wallet shows UI amounts,
which are raw x multiplier. A cost calculation that ignores it is wrong by the multiplier's distance from 1:
**0.27% on AAPLx, 0.57% on SPYx.** That is larger than the entire 0.20% median gap the other fourteen teams
are drawing. Every cost number in this category that does not read the mint is wrong by more than the thing it
is measuring.

## What the build must do
1. Read `scaledUiAmountConfig` from the output mint and apply the multiplier when converting the quote's raw
   `outAmount` into shares and dollars. State the multiplier on the receipt.
2. Verify empirically, not by reasoning: after the founder's real $20 swap, reconcile the number we printed
   against the wallet's displayed balance and the explorer. If they disagree, we are wrong and we fix it before
   the demo. This is the one thing that must be checked against ground truth.
3. tOpenAI carries a real **20 bps transfer fee**, so a Tessera order pays 0.20% on top of price impact. It
   must appear in the all-in cost, itemised.
4. The same mints carry `permanentDelegate`, `pausableConfig` and `defaultAccountState`: the issuer can freeze,
   seize and pause. One line on the receipt, from the chain, because the third repeated complaint in the census
   is "you do not own the share" and no one else shows it.
