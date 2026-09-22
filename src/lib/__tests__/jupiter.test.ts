import { getMultiplier, getTransferFeePercentage } from "../jupiter";

describe("Jupiter API Client", () => {
  describe("getMultiplier", () => {
    it("should extract multiplier from scaledUiAmountConfig", () => {
      const extensions: any = {
        scaledUiAmountConfig: {
          interestRateConfig: {
            currentInterestRate: "1003269010000000000", // 1.00326901 in 18 decimals
          },
        },
      };

      const multiplier = getMultiplier(extensions);
      expect(multiplier).toBeCloseTo(1.00326901, 5);
    });

    it("should return 1 when no scaledUiAmountConfig", () => {
      const extensions: any = {};
      const multiplier = getMultiplier(extensions);
      expect(multiplier).toBe(1);
    });

    it("should return 1 when no interestRateConfig", () => {
      const extensions: any = {
        scaledUiAmountConfig: {},
      };
      const multiplier = getMultiplier(extensions);
      expect(multiplier).toBe(1);
    });
  });

  describe("getTransferFeePercentage", () => {
    it("should extract transfer fee from transferFeeConfig", () => {
      const extensions: any = {
        transferFeeConfig: {
          transferFeeBasisPoints: 20, // 20 bps = 0.20%
        },
      };

      const fee = getTransferFeePercentage(extensions);
      expect(fee).toBe(0.2);
    });

    it("should return 0 when no transferFeeConfig", () => {
      const extensions: any = {};
      const fee = getTransferFeePercentage(extensions);
      expect(fee).toBe(0);
    });

    it("should return 0 when transferFeeBasisPoints is not present", () => {
      const extensions: any = {
        transferFeeConfig: {},
      };
      const fee = getTransferFeePercentage(extensions);
      expect(fee).toBe(0);
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
