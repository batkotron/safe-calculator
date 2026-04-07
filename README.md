# SAFE Calculator

The free, open-source SAFE note calculator that handles **multiple stacking SAFEs** - the killer feature most calculators are missing.

**Live tool:** [batkotron.github.io/safe-calculator](https://batkotron.github.io/safe-calculator)

By [Michael Batko](https://batko.ai) - founder of [batko.ai](https://batko.ai), the platform helping founders raise smarter.

## What it does

Models how SAFE notes convert into equity at a priced round, including:

- **Post-money SAFEs** (the modern YC standard - 90% of SAFEs)
- **Pre-money SAFEs** (the older YC format)
- **MFN (Most Favoured Nation)** - no cap, no discount, matches future best terms
- **Multiple stacking SAFEs** - the killer feature. Models how 3 SAFEs at different caps interact at conversion.
- **Valuation cap and discount rate** for each SAFE
- **Option pool top-up** (pre or post-money)

## Why this exists

Most SAFE calculators online handle one SAFE at a time. But real founders rarely raise on a single SAFE - they raise multiple over 6-18 months at different caps and terms.

When the priced round happens, those SAFEs interact in non-obvious ways. A founder who doesn't model this gets surprised by their dilution at the exact moment they should be celebrating.

This calculator solves that.

## Run it locally

```bash
git clone https://github.com/batkotron/safe-calculator
cd safe-calculator
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build for production

```bash
npm run build
```

The static export is written to `out/`. The GitHub Actions workflow auto-deploys this to GitHub Pages on every push to `main`.

## How the math works

For each SAFE, the calculator computes the **conversion price**:

- **Post-money SAFE with cap:** `cap / post-money shares (excluding new investor)`
- **Post-money SAFE with discount:** `priced round price * (1 - discount)`
- **MFN:** matches the lowest conversion price of any other SAFE in the stack
- **Pre-money SAFE:** uses the pre-money valuation, more dilutive to existing shareholders

The calculator picks the **lower of cap and discount price** for each SAFE (the better deal for the investor), then iterates to a stable cap table.

See [`lib/safe-math.ts`](./lib/safe-math.ts) for the full implementation.

## Disclaimer

This is not legal or financial advice. SAFE conversion math depends on the exact wording of your SAFE and the priced round documents. Always verify with your lawyer before signing anything.

## More resources

- [batko.ai/raise](https://batko.ai/raise) - All the raising tools in one place
- [batko.ai/blog](https://batko.ai/blog) - Writing on fundraising and dilution math

## Licence

MIT. Use it however you want. Attribution appreciated but not required.
