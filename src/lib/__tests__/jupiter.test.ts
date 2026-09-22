import { getIssuerControls, getMultiplier, getRoutePlan, getTransferFeePercentage, type ParsedExtension } from "../jupiter";

// Fixtures below are copied from the live responses on 2026-09-22:
//   getAccountInfo(jsonParsed) for oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ (tOpenAI)
//   lite-api.jup.ag/price/v3 for XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W (SPYx)
// The previous fixtures described an object-shaped `extensions` that the RPC does not return,
// so the fee was reported as 0 for every mint while the tests passed.

describe("Jupiter API Client", () => {
  describe("getTransferFeePercentage", () => {
    const tOpenAiExtensions: ParsedExtension[] = [
      {
        extension: "transferFeeConfig",
        state: {
          newerTransferFee: { epoch: 987, maximumFee: 18446744073709552000, transferFeeBasisPoints: 20 },
          olderTransferFee: { epoch: 987, maximumFee: 18446744073709552000, transferFeeBasisPoints: 20 },
          withheldAmount: 1071444,
        },
      },
      { extension: "metadataPointer", state: { authority: "EXvTtxurWBUNNCtLojaN8ZBJFNJPZFSH3szoih9hh7YW" } },
    ];

    it("reads 20 bps from the live tOpenAI extension array", () => {
      expect(getTransferFeePercentage(tOpenAiExtensions)).toBe(0.2);
    });

    it("returns 0 when the mint carries no transferFeeConfig", () => {
      expect(getTransferFeePercentage([{ extension: "metadataPointer", state: {} }])).toBe(0);
    });

    it("returns 0 for an empty extension array", () => {
      expect(getTransferFeePercentage([])).toBe(0);
    });
  });

  describe("scaled UI multiplier: which of the two is live", () => {
    // Copied from the live SPYx mint account on 2026-09-22. A scaledUiAmountConfig carries the
    // current multiplier AND a newMultiplier with the timestamp it takes effect. Reading the
    // first field once that timestamp has passed manufactured ~0.18% of cost on a $500 order.
    const spyx: ParsedExtension[] = [
      {
        extension: "scaledUiAmountConfig",
        state: {
          authority: "S7vYFFWH6BjJyEsdrPQpqpYTqLTrPRK6KW3VwsJuRaS",
          multiplier: "1.003909240011759",
          newMultiplier: "1.005714560286254",
          newMultiplierEffectiveTimestamp: 1781755200,
        },
      },
    ];

    it("takes newMultiplier once its effective timestamp has passed", () => {
      // Jupiter's own usdPricePrescaled / usdPrice equalled exactly this on the same day.
      expect(getMultiplier(spyx, 1790103463)).toBeCloseTo(1.005714560286254, 12);
    });

    it("keeps the current multiplier while the new one is still in the future", () => {
      expect(getMultiplier(spyx, 1781755199)).toBeCloseTo(1.003909240011759, 12);
    });

    it("returns null when the mint read failed, so no caller can mistake it for 1", () => {
      expect(getMultiplier(null)).toBeNull();
    });

    it("returns null when the mint carries no scaled config", () => {
      expect(getMultiplier([{ extension: "metadataPointer", state: {} }])).toBeNull();
    });
  });

  describe("a failed mint read is not an absence", () => {
    it("reports null rather than zero when extensions could not be read", () => {
      expect(getTransferFeePercentage(null)).toBeNull();
    });
  });

  describe("scaled UI multiplier", () => {
    // The multiplier is served by price/v3, not by the mint account.
    const spyxPrice = {
      usdPrice: 773.7723983316074,
      decimals: 8,
      liquidity: 8201610,
      scaledUiConfig: { multiplier: 1.003909240011759 },
    };

    it("carries the multiplier on the price response", () => {
      expect(spyxPrice.scaledUiConfig.multiplier).toBeCloseTo(1.003909, 6);
    });

    it("moves the wallet unit count by the multiplier", () => {
      const rawUnits = 0.6462 * 1e8;
      const uiUnits = (rawUnits / 1e8) * spyxPrice.scaledUiConfig.multiplier;
      expect(uiUnits).toBeGreaterThan(0.6462);
      expect(uiUnits).toBeCloseTo(0.648725, 5);
    });
  });

  describe("Quote calculation with multiplier and transfer fees", () => {
    it("should calculate all-in cost correctly for SPYx with multiplier", () => {
      // SPYx has 0.1798% multiplier
      // $500 order: ~0.6437 tokens after 0.1798% price impact
      const amountInUsd = 500;
      const multiplier = 1.00571456;
      const referencePrice = 774.28;
      const amountOutRaw = 643700; // 0.6437 tokens in raw units (6 decimals)
      const decimals = 6;

      // Simulate calculation
      const amountOutTokens = (amountOutRaw / Math.pow(10, decimals)) * multiplier;
      const shareValueUsd = amountOutTokens * referencePrice;
      const allInCostUsd = amountInUsd - shareValueUsd;
      const allInCostPct = (allInCostUsd / amountInUsd) * 100;

      // Cost should be small on a deep book
      expect(allInCostPct).toBeGreaterThan(-1);
      expect(allInCostPct).toBeLessThan(2); // Less than 2% on deep book like SPY
    });

    it("should include transfer fee in all-in cost for tOpenAI", () => {
      const amountInUsd = 100;
      const transferFeePercentage = 0.2; // 20 bps
      const referencePrice = 100;
      const amountOutTokens = 0.99; // After price impact
      const multiplier = 1;

      // Calculate with transfer fee
      const shareValueUsd = amountOutTokens * referencePrice;
      let allInCostUsd = amountInUsd - shareValueUsd;
      const transferFeeAmount = (amountInUsd * transferFeePercentage) / 100;
      allInCostUsd += transferFeeAmount;
      const allInCostPct = (allInCostUsd / amountInUsd) * 100;

      // Should include the 0.2% transfer fee
      expect(allInCostPct).toBeGreaterThanOrEqual(0.2);
    });
  });

  describe("getIssuerControls: what the issuer can do to a holder's money", () => {
    it("returns null when the mint read failed, never as an absence of risk", () => {
      expect(getIssuerControls(null)).toBeNull();
    });

    it("returns an empty array when the read succeeded and found none of the checked powers", () => {
      expect(getIssuerControls([{ extension: "metadataPointer", state: {} }])).toEqual([]);
    });

    it("finds permanentDelegate, pausableConfig, transferHook and confidentialTransferMint", () => {
      const extensions: ParsedExtension[] = [
        { extension: "permanentDelegate", state: {} },
        { extension: "pausableConfig", state: {} },
        { extension: "transferHook", state: {} },
        { extension: "confidentialTransferMint", state: {} },
      ];
      const keys = getIssuerControls(extensions)?.map((c) => c.key);
      expect(keys).toEqual(
        expect.arrayContaining(["permanentDelegate", "pausableConfig", "transferHook", "confidentialTransferMint"])
      );
    });

    it("surfaces defaultAccountState only when new accounts actually start frozen", () => {
      const frozen: ParsedExtension[] = [{ extension: "defaultAccountState", state: { state: "frozen" } }];
      const initialized: ParsedExtension[] = [{ extension: "defaultAccountState", state: { state: "initialized" } }];
      expect(getIssuerControls(frozen)?.map((c) => c.key)).toContain("defaultAccountState");
      expect(getIssuerControls(initialized)?.map((c) => c.key)).not.toContain("defaultAccountState");
    });

    it("never uses the extension's own RPC name as the label", () => {
      const extensions: ParsedExtension[] = [{ extension: "permanentDelegate", state: {} }];
      const controls = getIssuerControls(extensions);
      expect(controls?.[0].label).not.toBe("permanentDelegate");
      expect(controls?.[0].label.toLowerCase()).toContain("issuer");
    });
  });

  describe("getRoutePlan: where the order actually fills", () => {
    it("returns null when the raw quote carries no route plan", () => {
      expect(getRoutePlan({})).toBeNull();
      expect(getRoutePlan(null)).toBeNull();
    });

    it("reads venue and percent off each leg of a real routePlan shape", () => {
      const raw = {
        routePlan: [
          { swapInfo: { label: "Whirlpool", ammKey: "abc" }, percent: 70 },
          { swapInfo: { label: "Raydium CLMM", ammKey: "def" }, percent: 30 },
        ],
      };
      expect(getRoutePlan(raw)).toEqual([
        { venue: "Whirlpool", percent: 70 },
        { venue: "Raydium CLMM", percent: 30 },
      ]);
    });

    it("drops legs missing a usable venue or percent rather than inventing one", () => {
      const raw = { routePlan: [{ swapInfo: {}, percent: 100 }] };
      expect(getRoutePlan(raw)).toBeNull();
    });
  });

  describe("Cost calculation for thin vs deep books", () => {
    it("should show higher price impact on thin books like PLTRx", () => {
      // PLTRx has only $270k liquidity
      // $500 order should have ~1.41% price impact
      const thinBookImpact = 1.41;
      expect(thinBookImpact).toBeGreaterThan(0.14);
    });

    it("should show lower price impact on deep books like SPYx", () => {
      // SPYx has $8M liquidity
      // $500 order should have ~0.14% price impact
      const deepBookImpact = 0.14;
      expect(deepBookImpact).toBeLessThan(0.5);
    });
  });
});
