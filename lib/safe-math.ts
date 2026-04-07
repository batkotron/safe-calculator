// SAFE conversion math
// Supports post-money SAFEs, pre-money SAFEs, MFN, and stacked SAFEs.
// References:
//   - YC Post-Money SAFE: https://www.ycombinator.com/documents
//   - "SAFE Financing Documents" (YC, 2018)

export type SafeType = 'post-money' | 'pre-money' | 'mfn';

export interface Safe {
  id: string;
  name: string;
  type: SafeType;
  amount: number;
  cap?: number;       // valuation cap (undefined for MFN)
  discount?: number;  // 0-1, e.g. 0.20 for 20%
}

export interface PricedRound {
  preMoneyValuation: number;
  newInvestment: number;
  optionPoolTarget: number; // 0-1, e.g. 0.10 for 10% post-round
}

export interface CapTableEntry {
  name: string;
  shares: number;
  ownership: number; // 0-1
  pricePaid?: number;
}

export interface ConversionResult {
  capTable: CapTableEntry[];
  pricePerShare: number;
  postMoneyValuation: number;
  totalShares: number;
  founderDilution: number; // 0-1
}

export interface ConversionInputs {
  founderShares: number; // existing common shares
  safes: Safe[];
  round: PricedRound;
}

/**
 * Compute the SAFE conversion price for a single SAFE given a price-per-share
 * and the post-money valuation of the round (used for post-money SAFE math).
 */
function safeConversionPrice(
  safe: Safe,
  roundPricePerShare: number,
  postMoneyShares: number
): number {
  // Discount price applies to all SAFE types
  const discountPrice = safe.discount
    ? roundPricePerShare * (1 - safe.discount)
    : Infinity;

  // Cap price
  let capPrice = Infinity;
  if (safe.cap && safe.type === 'post-money') {
    capPrice = safe.cap / postMoneyShares;
  } else if (safe.cap && safe.type === 'pre-money') {
    // Pre-money: cap divided by pre-money shares
    capPrice = safe.cap / (postMoneyShares - safeNewShares(safe, roundPricePerShare));
  }

  // SAFE converts at the LOWER of cap and discount (better for investor)
  const price = Math.min(discountPrice, capPrice);
  return price === Infinity ? roundPricePerShare : price;
}

function safeNewShares(safe: Safe, conversionPrice: number): number {
  return safe.amount / conversionPrice;
}

/**
 * Iteratively compute the cap table after SAFE conversion + priced round.
 * Iteration is needed because post-money SAFEs depend on the total post-money
 * share count, which depends on how many shares each SAFE creates.
 */
export function convertSafes(inputs: ConversionInputs): ConversionResult {
  const { founderShares, safes, round } = inputs;

  // Initial guess: assume all SAFEs convert at the round price
  let postMoneyShares = founderShares;
  let pricePerShare = round.preMoneyValuation / founderShares;

  // Iterate to convergence
  for (let i = 0; i < 50; i++) {
    // Step 1: compute conversion price for each SAFE
    let safeShares = 0;
    const safeResults = safes.map((safe) => {
      // MFN matches the lowest conversion price of any other SAFE
      let conversionPrice: number;
      if (safe.type === 'mfn') {
        // Find the best (lowest) price among other SAFEs
        const otherPrices = safes
          .filter((s) => s.id !== safe.id && s.type !== 'mfn')
          .map((s) => safeConversionPrice(s, pricePerShare, postMoneyShares));
        conversionPrice = otherPrices.length ? Math.min(...otherPrices) : pricePerShare;
      } else {
        conversionPrice = safeConversionPrice(safe, pricePerShare, postMoneyShares);
      }
      const shares = safeNewShares(safe, conversionPrice);
      safeShares += shares;
      return { safe, shares, conversionPrice };
    });

    // Step 2: option pool top-up (post-money method)
    // We want the option pool to be `optionPoolTarget` of the post-money cap table
    const sharesBeforePool = founderShares + safeShares;
    const newInvestorShares = round.newInvestment / pricePerShare;
    const totalNonPool = sharesBeforePool + newInvestorShares;
    const poolTarget = round.optionPoolTarget;
    const poolShares = poolTarget > 0 ? (totalNonPool * poolTarget) / (1 - poolTarget) : 0;

    const newPostMoneyShares = sharesBeforePool + newInvestorShares + poolShares;
    const newPricePerShare = round.preMoneyValuation / (sharesBeforePool + poolShares);

    // Check convergence
    const delta = Math.abs(newPostMoneyShares - postMoneyShares) / postMoneyShares;
    postMoneyShares = newPostMoneyShares;
    pricePerShare = newPricePerShare;

    if (delta < 0.0001) {
      // Build final cap table
      const capTable: CapTableEntry[] = [
        {
          name: 'Founders',
          shares: founderShares,
          ownership: founderShares / postMoneyShares,
        },
        ...safeResults.map((r) => ({
          name: r.safe.name,
          shares: r.shares,
          ownership: r.shares / postMoneyShares,
          pricePaid: r.conversionPrice,
        })),
        {
          name: 'New investor',
          shares: newInvestorShares,
          ownership: newInvestorShares / postMoneyShares,
          pricePaid: pricePerShare,
        },
        {
          name: 'Option pool',
          shares: poolShares,
          ownership: poolShares / postMoneyShares,
        },
      ];

      return {
        capTable,
        pricePerShare,
        postMoneyValuation: round.preMoneyValuation + round.newInvestment,
        totalShares: postMoneyShares,
        founderDilution: 1 - founderShares / postMoneyShares,
      };
    }
  }

  // If we didn't converge, return best effort
  throw new Error('SAFE conversion did not converge');
}
