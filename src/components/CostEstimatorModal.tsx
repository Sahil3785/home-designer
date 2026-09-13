import React, { useMemo, useState } from 'react';
import { Project } from '../core/model/types';
import { wallLength } from '../core/model/geometry';
import { computeRoomAreaSqFt } from '../core/model/roomDetection';
import { SIXTEENTHS_PER_FOOT } from '../core/units';
import { X, IndianRupee, Download, Printer, TrendingUp } from 'lucide-react';

interface CostEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

type CityTier = 'tier1' | 'tier2' | 'tier3';
type Quality = 'economy' | 'standard' | 'premium' | 'luxury';

const TIER_LABELS: Record<CityTier, string> = {
  tier1: 'Tier-1 City (Mumbai / Delhi / Bangalore)',
  tier2: 'Tier-2 City (Pune / Hyderabad / Ahmedabad)',
  tier3: 'Tier-3 City / Town / Rural',
};

const QUALITY_LABELS: Record<Quality, string> = {
  economy: 'Economy (Basic Finishes)',
  standard: 'Standard (Mid-Range)',
  premium: 'Premium (High-End)',
  luxury: 'Luxury (Ultra Premium)',
};

// Base rate per sqft in INR for RCC+Brickwork+Finishing (all-in)
const BASE_RATES: Record<CityTier, Record<Quality, number>> = {
  tier1: { economy: 2000, standard: 2800, premium: 3800, luxury: 5500 },
  tier2: { economy: 1500, standard: 2100, premium: 3000, luxury: 4500 },
  tier3: { economy: 1100, standard: 1600, premium: 2400, luxury: 3500 },
};

const FLOORING_RATES: Record<string, number> = {
  mat_oak_hardwood: 280,
  mat_walnut_wood: 320,
  mat_calacatta_marble: 480,
  mat_nero_marble: 420,
  mat_travertine: 360,
  mat_spanish_terracotta: 200,
  mat_white_tile: 180,
  mat_cement_tile: 150,
  mat_polished_concrete: 220,
};

interface LineItem { label: string; qty: string; rate: string; amount: number; note?: string; }

export const CostEstimatorModal: React.FC<CostEstimatorModalProps> = ({ isOpen, onClose, project }) => {
  const [tier, setTier] = useState<CityTier>('tier2');
  const [quality, setQuality] = useState<Quality>('standard');

  const stats = useMemo(() => {
    let totalAreaSqFt = 0;
    let extWallLinFt = 0;
    let intWallLinFt = 0;
    let doorCount = 0;
    let windowCount = 0;
    let flooringCost = 0;

    for (const floor of project.floors) {
      for (const room of floor.rooms) {
        if (room.polygon.length >= 3) {
          const area = computeRoomAreaSqFt(room.polygon);
          if (area > 5) {
            totalAreaSqFt += area;
            const rate = FLOORING_RATES[room.floorMaterialId || ''] || 200;
            flooringCost += area * rate;
          }
        }
      }
      for (const wall of floor.walls) {
        const lenFt = wallLength(wall) / SIXTEENTHS_PER_FOOT;
        if (wall.thickness >= 128) extWallLinFt += lenFt;
        else intWallLinFt += lenFt;
        for (const op of wall.openings) {
          if (op.type === 'door') doorCount++;
          else if (op.type === 'window') windowCount++;
        }
      }
    }
    return { totalAreaSqFt, extWallLinFt, intWallLinFt, doorCount, windowCount, flooringCost };
  }, [project]);

  const baseRate = BASE_RATES[tier][quality];
  const qm = quality === 'economy' ? 0.8 : quality === 'standard' ? 1.0 : quality === 'premium' ? 1.4 : 2.0;
  const tm = tier === 'tier1' ? 1.15 : tier === 'tier2' ? 1.0 : 0.85;

  const items: LineItem[] = [
    {
      label: 'RCC Structure, Foundation & Slab',
      qty: `${stats.totalAreaSqFt.toFixed(0)} sqft`,
      rate: `₹${Math.round(baseRate * 0.32)}/sqft`,
      amount: stats.totalAreaSqFt * baseRate * 0.32,
      note: 'Includes M30 concrete, TMT steel, formwork',
    },
    {
      label: `Exterior Brickwork (9" Load-Bearing Walls)`,
      qty: `${stats.extWallLinFt.toFixed(0)} lin.ft`,
      rate: `₹${Math.round(950 * qm * tm)}/lin.ft`,
      amount: stats.extWallLinFt * 950 * qm * tm,
    },
    {
      label: `Interior Partitions (4½" Walls)`,
      qty: `${stats.intWallLinFt.toFixed(0)} lin.ft`,
      rate: `₹${Math.round(550 * qm * tm)}/lin.ft`,
      amount: stats.intWallLinFt * 550 * qm * tm,
    },
    {
      label: 'Flooring (as per material selection)',
      qty: `${stats.totalAreaSqFt.toFixed(0)} sqft`,
      rate: 'Per selected material',
      amount: stats.flooringCost,
      note: 'Oak ~₹280, Marble ~₹480, Tile ~₹180/sqft',
    },
    {
      label: `Doors (${stats.doorCount} nos.)`,
      qty: `${stats.doorCount} units`,
      rate: `₹${Math.round(18000 * qm).toLocaleString('en-IN')}/unit`,
      amount: stats.doorCount * 18000 * qm,
      note: 'Solid core flush door with frame & hardware',
    },
    {
      label: `Windows (${stats.windowCount} nos.)`,
      qty: `${stats.windowCount} units`,
      rate: `₹${Math.round(12000 * qm).toLocaleString('en-IN')}/unit`,
      amount: stats.windowCount * 12000 * qm,
      note: 'UPVC / aluminium glazed window with hardware',
    },
    {
      label: 'Electrical Works (Full Internal Wiring)',
      qty: `${stats.totalAreaSqFt.toFixed(0)} sqft`,
      rate: `₹${Math.round(130 * qm * tm)}/sqft`,
      amount: stats.totalAreaSqFt * 130 * qm * tm,
      note: 'Concealed conduit, MCB, DB, outlets, switches',
    },
    {
      label: 'Plumbing & Sanitary Works',
      qty: `${stats.totalAreaSqFt.toFixed(0)} sqft`,
      rate: `₹${Math.round(95 * qm * tm)}/sqft`,
      amount: stats.totalAreaSqFt * 95 * qm * tm,
      note: 'CPVC supply, PVC drainage, sanitary fixtures',
    },
    {
      label: 'Plastering, Putty & Painting',
      qty: `${stats.totalAreaSqFt.toFixed(0)} sqft`,
      rate: `₹${Math.round(75 * qm * tm)}/sqft`,
      amount: stats.totalAreaSqFt * 75 * qm * tm,
      note: 'Internal 2-coat emulsion, external weatherproof',
    },
    {
      label: 'Kitchen Platform & Cabinetry',
      qty: '1 lot',
      rate: quality === 'luxury' ? '₹4,50,000' : quality === 'premium' ? '₹2,80,000' : quality === 'standard' ? '₹1,60,000' : '₹80,000',
      amount: quality === 'luxury' ? 450000 : quality === 'premium' ? 280000 : quality === 'standard' ? 160000 : 80000,
      note: 'Modular kitchen with chimney, hob, sink',
    },
    {
      label: 'Architectural Contingency (5%)',
      qty: '5%',
      rate: 'On sub-total',
      amount: 0, // computed below
    },
  ];

  const subTotal = items.slice(0, -1).reduce((s, it) => s + it.amount, 0);
  items[items.length - 1].amount = subTotal * 0.05;
  const grandTotal = subTotal + items[items.length - 1].amount;
  const perSqFt = stats.totalAreaSqFt > 0 ? grandTotal / stats.totalAreaSqFt : 0;

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

  const handleExport = () => {
    const lines = [
      `Home Designer — Construction Cost Estimate`,
      `Project: ${project.name || 'Untitled'}`,
      `City: ${TIER_LABELS[tier]} | Quality: ${QUALITY_LABELS[quality]}`,
      `Total Area: ${stats.totalAreaSqFt.toFixed(0)} sqft`,
      ``,
      `Item,Qty,Rate,Amount (INR)`,
      ...items.map((it) => `"${it.label}","${it.qty}","${it.rate}","${fmt(it.amount)}"`),
      ``,
      `Grand Total,,,"${fmt(grandTotal)}"`,
      `Cost per sqft,,,"${fmt(perSqFt)}/sqft"`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${project.name || 'Project'}_CostEstimate.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
    background: active ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--bg-elevated)',
    color: active ? 'white' : 'var(--text-secondary)',
    boxShadow: active ? '0 4px 12px rgba(245,158,11,0.3)' : 'none',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-panel)', borderRadius: 16,
        border: '1px solid var(--border-medium)',
        width: '92vw', maxWidth: 1040, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-panel-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IndianRupee size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Construction Cost Estimator</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                Indian market rates · Auto-computed from your floor plan
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleExport} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}><Download size={14} />Export CSV</button>
            <button onClick={onClose} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
              color: 'var(--text-secondary)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex',
            }}><X size={16} /></button>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start',
          background: 'var(--bg-panel-secondary)',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>City / Region</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(Object.keys(TIER_LABELS) as CityTier[]).map((t) => (
                <button key={t} onClick={() => setTier(t)} style={pillStyle(tier === t)}>{t === 'tier1' ? 'Tier-1 (Metro)' : t === 'tier2' ? 'Tier-2 City' : 'Tier-3 / Town'}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Construction Quality</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(Object.keys(QUALITY_LABELS) as Quality[]).map((q) => (
                <button key={q} onClick={() => setQuality(q)} style={pillStyle(quality === q)}>{QUALITY_LABELS[q].split(' ')[0]}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Grand Total Banner */}
        <div style={{
          padding: '16px 24px',
          background: 'linear-gradient(90deg, rgba(245,158,11,0.12), rgba(217,119,6,0.08))',
          borderBottom: '1px solid rgba(245,158,11,0.2)',
          display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#d97706', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Estimated Grand Total</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>{fmt(grandTotal)}</div>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Cost / sqft', value: fmt(perSqFt) },
              { label: 'Total Area', value: `${stats.totalAreaSqFt.toFixed(0)} sqft` },
              { label: 'City', value: TIER_LABELS[tier].split('(')[0].trim() },
              { label: 'Quality', value: QUALITY_LABELS[quality].split(' ')[0] },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Line Items Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-panel-secondary)', position: 'sticky', top: 0 }}>
                {['#', 'Line Item', 'Qty / Unit', 'Rate', 'Amount (INR)', 'Note'].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                    color: 'var(--text-secondary)', fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                    borderBottom: '1px solid var(--border-medium)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  borderTop: i === items.length - 1 ? '2px dashed rgba(245,158,11,0.3)' : 'none',
                }}>
                  <td style={{ padding: '11px 14px', color: 'var(--text-tertiary)', width: 40 }}>{i + 1}</td>
                  <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--text-secondary)' }}>{item.qty}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--text-secondary)' }}>{item.rate}</td>
                  <td style={{ padding: '11px 14px', fontWeight: 700, color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(item.amount)}
                  </td>
                  <td style={{ padding: '11px 14px', color: 'var(--text-tertiary)', fontSize: 11 }}>{item.note || ''}</td>
                </tr>
              ))}
              <tr style={{ background: 'rgba(245,158,11,0.08)', borderTop: '2px solid rgba(245,158,11,0.4)' }}>
                <td colSpan={4} style={{ padding: '14px', fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>
                  GRAND TOTAL (Including Contingency)
                </td>
                <td style={{ padding: '14px', fontWeight: 900, fontSize: 18, color: '#f59e0b' }}>
                  {fmt(grandTotal)}
                </td>
                <td style={{ padding: '14px', color: 'var(--text-tertiary)', fontSize: 12 }}>
                  ≈ {fmt(perSqFt)}/sqft all-in
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-subtle)' }}>
            ⚠️ This is an indicative estimate only. Actual costs may vary by 15–30% based on site conditions, design complexity, and contractor pricing. Please get at least 3 contractor quotes before finalizing.
          </div>
        </div>
      </div>
    </div>
  );
};
