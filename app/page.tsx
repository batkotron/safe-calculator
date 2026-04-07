'use client';

import { useState, useMemo } from 'react';
import { convertSafes, type Safe, type SafeType } from '@/lib/safe-math';

const fmt = (n: number) => n.toLocaleString('en-AU', { maximumFractionDigits: 0 });
const pct = (n: number) => (n * 100).toFixed(2) + '%';
const money = (n: number) =>
  '$' + n.toLocaleString('en-AU', { maximumFractionDigits: 0 });

export default function Page() {
  const [founderShares, setFounderShares] = useState(10_000_000);
  const [preMoney, setPreMoney] = useState(15_000_000);
  const [newInvestment, setNewInvestment] = useState(3_000_000);
  const [poolTarget, setPoolTarget] = useState(0.10);

  const [safes, setSafes] = useState<Safe[]>([
    {
      id: '1',
      name: 'SAFE #1 - Pre-seed',
      type: 'post-money',
      amount: 500_000,
      cap: 5_000_000,
      discount: 0.20,
    },
    {
      id: '2',
      name: 'SAFE #2 - Angel round',
      type: 'post-money',
      amount: 250_000,
      cap: 8_000_000,
      discount: 0.15,
    },
  ]);

  const addSafe = () => {
    setSafes([
      ...safes,
      {
        id: Date.now().toString(),
        name: `SAFE #${safes.length + 1}`,
        type: 'post-money',
        amount: 250_000,
        cap: 10_000_000,
        discount: 0.15,
      },
    ]);
  };

  const removeSafe = (id: string) => setSafes(safes.filter((s) => s.id !== id));

  const updateSafe = (id: string, patch: Partial<Safe>) => {
    setSafes(safes.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const result = useMemo(() => {
    try {
      return convertSafes({
        founderShares,
        safes,
        round: {
          preMoneyValuation: preMoney,
          newInvestment,
          optionPoolTarget: poolTarget,
        },
      });
    } catch (e) {
      return null;
    }
  }, [founderShares, safes, preMoney, newInvestment, poolTarget]);

  return (
    <div className="container">
      <header>
        <h1>SAFE Calculator</h1>
        <p>
          Model how SAFE notes convert into equity at a priced round. Handles
          stacked SAFEs, post-money, pre-money, and MFN. Free and open-source.
        </p>
      </header>

      <div className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Existing cap table</h2>
        <div className="grid">
          <div>
            <label className="label">Founder shares</label>
            <input
              type="number"
              value={founderShares}
              onChange={(e) => setFounderShares(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>SAFEs</h2>
        {safes.map((safe) => (
          <div key={safe.id} className="safe-row">
            <div>
              <label className="label">Name</label>
              <input
                value={safe.name}
                onChange={(e) => updateSafe(safe.id, { name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                value={safe.type}
                onChange={(e) =>
                  updateSafe(safe.id, { type: e.target.value as SafeType })
                }
              >
                <option value="post-money">Post-money</option>
                <option value="pre-money">Pre-money</option>
                <option value="mfn">MFN</option>
              </select>
            </div>
            <div>
              <label className="label">Amount ($)</label>
              <input
                type="number"
                value={safe.amount}
                onChange={(e) =>
                  updateSafe(safe.id, { amount: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="label">Cap ($)</label>
              <input
                type="number"
                value={safe.cap ?? ''}
                disabled={safe.type === 'mfn'}
                onChange={(e) =>
                  updateSafe(safe.id, {
                    cap: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div>
              <label className="label">Discount (%)</label>
              <input
                type="number"
                value={safe.discount ? safe.discount * 100 : ''}
                disabled={safe.type === 'mfn'}
                onChange={(e) =>
                  updateSafe(safe.id, {
                    discount: e.target.value ? Number(e.target.value) / 100 : undefined,
                  })
                }
              />
            </div>
            <button className="secondary" onClick={() => removeSafe(safe.id)}>
              Remove
            </button>
          </div>
        ))}
        <button onClick={addSafe} style={{ marginTop: 8 }}>
          + Add SAFE
        </button>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Priced round</h2>
        <div className="grid">
          <div>
            <label className="label">Pre-money valuation ($)</label>
            <input
              type="number"
              value={preMoney}
              onChange={(e) => setPreMoney(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">New investment ($)</label>
            <input
              type="number"
              value={newInvestment}
              onChange={(e) => setNewInvestment(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Option pool target (%)</label>
            <input
              type="number"
              value={poolTarget * 100}
              onChange={(e) => setPoolTarget(Number(e.target.value) / 100)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Resulting cap table</h2>
        {result ? (
          <>
            <p className="muted" style={{ marginBottom: 12 }}>
              Post-money valuation: <strong>{money(result.postMoneyValuation)}</strong>
              {' • '}
              Price per share: <strong>${result.pricePerShare.toFixed(4)}</strong>
              {' • '}
              Founder dilution: <strong>{pct(result.founderDilution)}</strong>
            </p>
            <table>
              <thead>
                <tr>
                  <th>Holder</th>
                  <th>Shares</th>
                  <th>Ownership</th>
                  <th>Conversion price</th>
                </tr>
              </thead>
              <tbody>
                {result.capTable.map((row, i) => (
                  <tr key={i}>
                    <td>{row.name}</td>
                    <td>{fmt(row.shares)}</td>
                    <td>{pct(row.ownership)}</td>
                    <td>{row.pricePaid ? '$' + row.pricePaid.toFixed(4) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="muted">Adjust inputs to see conversion.</p>
        )}
      </div>

      <footer>
        Free and open-source. Built by{' '}
        <a href="https://batko.ai" target="_blank" rel="noopener">
          Michael Batko
        </a>
        . More fundraising tools at{' '}
        <a href="https://batko.ai/raise" target="_blank" rel="noopener">
          batko.ai/raise
        </a>
        .{' '}
        <a
          href="https://github.com/batkotron/safe-calculator"
          target="_blank"
          rel="noopener"
        >
          View source
        </a>
        .
      </footer>
    </div>
  );
}
