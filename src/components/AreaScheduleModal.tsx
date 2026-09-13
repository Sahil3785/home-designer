import React, { useMemo, useState } from 'react';
import { Project } from '../core/model/types';
import { formatFeetInches } from '../core/units';
import { computeRoomBoundingDimensions, computeRoomAreaSqFt } from '../core/model/roomDetection';
import { calculateMepTakeoff } from '../core/model/mep';
import { X, Download, Printer, BarChart3, ArrowUpDown, Zap } from 'lucide-react';

interface AreaScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onRenameRoom?: (floorId: string, roomId: string, newName: string) => void;
}

type SortKey = 'name' | 'floor' | 'area';

interface ScheduleRow {
  index: number;
  roomId: string;
  floorId: string;
  floorName: string;
  name: string;
  widthFt: number;
  depthFt: number;
  areaSqFt: number;
  floorMaterial: string;
  ceilingHeight: string;
}

export const AreaScheduleModal: React.FC<AreaScheduleModalProps> = ({
  isOpen, onClose, project, onRenameRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'mep'>('rooms');
  const [sortKey, setSortKey] = useState<SortKey>('floor');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const allSymbols = useMemo(() => {
    return project.floors.flatMap((f) => f.symbols || []);
  }, [project]);

  const mepTakeoff = useMemo(() => {
    return calculateMepTakeoff(allSymbols);
  }, [allSymbols]);

  const rows: ScheduleRow[] = useMemo(() => {
    const result: ScheduleRow[] = [];
    let idx = 1;
    for (const floor of project.floors) {
      for (const room of floor.rooms) {
        if (room.polygon.length < 3) continue;
        const { widthFt, depthFt } = computeRoomBoundingDimensions(room.polygon);
        const areaSqFt = computeRoomAreaSqFt(room.polygon);
        if (areaSqFt < 5) continue;
        const matDef = project.materials.find((m) => m.id === room.floorMaterialId);
        result.push({
          index: idx++, roomId: room.id, floorId: floor.id,
          floorName: floor.name, name: room.name,
          widthFt, depthFt, areaSqFt,
          floorMaterial: matDef ? matDef.name : 'White Oak Hardwood',
          ceilingHeight: formatFeetInches(floor.ceilingHeight),
        });
      }
    }
    return result;
  }, [project]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'floor') cmp = a.floorName.localeCompare(b.floorName) || a.index - b.index;
      else if (sortKey === 'area') cmp = a.areaSqFt - b.areaSqFt;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const totalArea = rows.reduce((s, r) => s + r.areaSqFt, 0);
  const carpetArea = totalArea * 0.7;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleExportCSV = () => {
    if (activeTab === 'mep') {
      const header = 'No,Fixture Name,Category,CAD Code,Quantity,Total Watts (W)';
      const lines = mepTakeoff.itemized.map((item, i) =>
        `${i + 1},"${item.name}","${item.category}","${item.type}",${item.count},${item.totalWatts}`
      );
      lines.push(`,,,,,"TOTAL: ${mepTakeoff.totalWattage} W (${mepTakeoff.totalKw} kW)"`);
      lines.push(`,,,,,"SANCTIONED LOAD: ${mepTakeoff.recommendedSanctionedLoadKw} kW (${mepTakeoff.recommendedSupply})"`);
      const csv = [header, ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${project.name || 'FloorPlan'}_MEP_Takeoff.csv`; a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const header = 'No,Room Name,Floor,Width (ft),Depth (ft),Area (sqft),Floor Material,Ceiling Height';
    const lines = sorted.map((r, i) =>
      `${i + 1},"${r.name}","${r.floorName}",${r.widthFt.toFixed(1)},${r.depthFt.toFixed(1)},${r.areaSqFt.toFixed(1)},"${r.floorMaterial}","${r.ceilingHeight}"`
    );
    lines.push(`,,,,,"TOTAL: ${totalArea.toFixed(0)} sqft (BUA)"`);
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${project.name || 'FloorPlan'}_AreaSchedule.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const thStyle: React.CSSProperties = {
    padding: '10px 12px', textAlign: 'left', fontWeight: 600,
    color: 'var(--text-secondary)', fontSize: 11,
    textTransform: 'uppercase', letterSpacing: 0.5,
    borderBottom: '1px solid var(--border-medium)',
    userSelect: 'none',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: 'var(--bg-panel)', borderRadius: 16,
        border: '1px solid var(--border-medium)',
        width: '90vw', maxWidth: 1000, maxHeight: '88vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-panel-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: activeTab === 'mep' ? 'linear-gradient(135deg, #0284c7, #0ea5e9)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {activeTab === 'mep' ? <Zap size={20} color="white" /> : <BarChart3 size={20} color="white" />}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeTab === 'mep' ? 'MEP Fixtures & Electrical Load Schedule' : 'Room & Area Schedule'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                {activeTab === 'mep'
                  ? `${allSymbols.length} Total Points · Connected Load: ${mepTakeoff.totalKw} kW · Supply: ${mepTakeoff.recommendedSupply}`
                  : `${rows.length} Rooms · BUA: ${totalArea.toFixed(0)} sqft · Carpet: ~${carpetArea.toFixed(0)} sqft`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={handleExportCSV} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}><Download size={14} />Export CSV</button>
            <button onClick={() => window.print()} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}><Printer size={14} />Print PDF</button>
            <button onClick={onClose} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
              color: 'var(--text-secondary)', borderRadius: 8, padding: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}><X size={16} /></button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 8, padding: '10px 24px', background: 'var(--bg-panel-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('rooms')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'rooms' ? 'var(--accent-blue)' : 'transparent',
              color: activeTab === 'rooms' ? '#ffffff' : 'var(--text-secondary)',
              border: activeTab === 'rooms' ? '1px solid transparent' : '1px solid var(--border-subtle)',
            }}
          >
            <BarChart3 size={14} />
            Room Area Schedule ({rows.length})
          </button>
          <button
            onClick={() => setActiveTab('mep')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'mep' ? 'var(--accent-blue)' : 'transparent',
              color: activeTab === 'mep' ? '#ffffff' : 'var(--text-secondary)',
              border: activeTab === 'mep' ? '1px solid transparent' : '1px solid var(--border-subtle)',
            }}
          >
            <Zap size={14} />
            MEP Fixtures & Electrical Load ({allSymbols.length})
          </button>
        </div>

        {activeTab === 'rooms' ? (
          <>
            {/* Rooms Summary Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--border-subtle)' }}>
              {[
                { label: 'Total Rooms', value: rows.length.toString(), color: '#6366f1' },
                { label: 'Built-Up Area', value: `${totalArea.toFixed(0)} sqft`, color: '#8b5cf6' },
                { label: 'Carpet Area (~70%)', value: `${carpetArea.toFixed(0)} sqft`, color: '#a78bfa' },
                { label: 'Floors', value: project.floors.length.toString(), color: '#7c3aed' },
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderRight: i < 3 ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Rooms Table */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-panel-secondary)', position: 'sticky', top: 0, zIndex: 1 }}>
                    <th style={{ ...thStyle, width: 50 }}>No.</th>
                    <th style={{ ...thStyle, cursor: 'pointer', width: 200 }} onClick={() => toggleSort('name')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Room Name <ArrowUpDown size={10} opacity={sortKey === 'name' ? 1 : 0.3} /></span>
                    </th>
                    <th style={{ ...thStyle, cursor: 'pointer', width: 120 }} onClick={() => toggleSort('floor')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Floor <ArrowUpDown size={10} opacity={sortKey === 'floor' ? 1 : 0.3} /></span>
                    </th>
                    <th style={{ ...thStyle, width: 80 }}>Width</th>
                    <th style={{ ...thStyle, width: 80 }}>Depth</th>
                    <th style={{ ...thStyle, cursor: 'pointer', width: 110 }} onClick={() => toggleSort('area')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Area (sqft) <ArrowUpDown size={10} opacity={sortKey === 'area' ? 1 : 0.3} /></span>
                    </th>
                    <th style={{ ...thStyle, width: 180 }}>Floor Finish</th>
                    <th style={{ ...thStyle, width: 100 }}>Ceiling Ht.</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, i) => (
                    <tr key={row.roomId} style={{
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <td style={{ padding: '11px 12px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td style={{ padding: '11px 12px' }}>
                        {editingId === row.roomId ? (
                          <input value={editName} autoFocus
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => { if (onRenameRoom && editName.trim()) onRenameRoom(row.floorId, row.roomId, editName.trim()); setEditingId(null); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { if (onRenameRoom && editName.trim()) onRenameRoom(row.floorId, row.roomId, editName.trim()); setEditingId(null); } else if (e.key === 'Escape') setEditingId(null); }}
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent-blue)', color: 'var(--text-primary)', borderRadius: 6, padding: '3px 8px', fontSize: 13, width: '100%' }}
                          />
                        ) : (
                          <span title="Double-click to rename" onDoubleClick={() => { setEditingId(row.roomId); setEditName(row.name); }}
                            style={{ fontWeight: 600, color: 'var(--text-primary)', cursor: 'text' }}>
                            {row.name}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '11px 12px', color: 'var(--text-secondary)' }}>{row.floorName}</td>
                      <td style={{ padding: '11px 12px', color: 'var(--text-secondary)' }}>{row.widthFt.toFixed(1)}'</td>
                      <td style={{ padding: '11px 12px', color: 'var(--text-secondary)' }}>{row.depthFt.toFixed(1)}'</td>
                      <td style={{ padding: '11px 12px' }}>
                        <span style={{ color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                          {row.areaSqFt.toFixed(1)}
                        </span>
                      </td>
                      <td style={{ padding: '11px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>{row.floorMaterial}</td>
                      <td style={{ padding: '11px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>{row.ceilingHeight}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'rgba(99,102,241,0.08)', borderTop: '2px solid rgba(99,102,241,0.3)' }}>
                    <td colSpan={5} style={{ padding: '13px 12px', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>
                      TOTAL ({rows.length} Rooms)
                    </td>
                    <td style={{ padding: '13px 12px' }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#6366f1', background: 'rgba(99,102,241,0.15)', padding: '3px 10px', borderRadius: 20 }}>
                        {totalArea.toFixed(1)} sqft
                      </span>
                    </td>
                    <td colSpan={2} style={{ padding: '13px 12px', fontSize: 12, color: 'var(--text-tertiary)' }}>
                      Carpet Area ≈ {carpetArea.toFixed(0)} sqft
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            {/* MEP Summary Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--border-subtle)' }}>
              {[
                { label: 'Total MEP Points', value: mepTakeoff.totalPoints.toString(), color: '#0284c7' },
                { label: 'Total Connected Load', value: `${mepTakeoff.totalKw} kW`, color: '#0ea5e9' },
                { label: 'Sanctioned Load (0.7 Div)', value: `${mepTakeoff.recommendedSanctionedLoadKw} kW`, color: '#059669' },
                { label: 'Recommended Supply', value: mepTakeoff.recommendedSupply, color: '#d97706' },
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderRight: i < 3 ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <div style={{ fontSize: i === 3 ? 16 : 22, fontWeight: 800, color: stat.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* MEP Takeoff Table */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {mepTakeoff.itemized.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Zap size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <div style={{ fontSize: 15, fontWeight: 600 }}>No MEP Fixtures Placed Yet</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Switch to the MEP Tool (Key E) in 2D Plan to place lights, fans, sockets, ACs, and plumbing points.
                  </div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-panel-secondary)', position: 'sticky', top: 0, zIndex: 1 }}>
                      <th style={{ ...thStyle, width: 50 }}>No.</th>
                      <th style={{ ...thStyle, width: 100 }}>CAD Code</th>
                      <th style={{ ...thStyle }}>Fixture Name</th>
                      <th style={{ ...thStyle, width: 120 }}>Category</th>
                      <th style={{ ...thStyle, width: 90, textAlign: 'right' }}>Quantity</th>
                      <th style={{ ...thStyle, width: 120, textAlign: 'right' }}>Unit Wattage</th>
                      <th style={{ ...thStyle, width: 130, textAlign: 'right' }}>Total Watts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mepTakeoff.itemized.map((item, i) => (
                      <tr key={item.type} style={{
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}>
                        <td style={{ padding: '11px 12px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                          {String(i + 1).padStart(2, '0')}
                        </td>
                        <td style={{ padding: '11px 12px', fontWeight: 700, color: 'var(--accent-blue)' }}>
                          {item.type.toUpperCase()}
                        </td>
                        <td style={{ padding: '11px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.name}
                        </td>
                        <td style={{ padding: '11px 12px' }}>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 4,
                            textTransform: 'uppercase',
                            background: item.category === 'electrical' ? '#fef3c7' : item.category === 'plumbing' ? '#e0f2fe' : '#f1f5f9',
                            color: item.category === 'electrical' ? '#b45309' : item.category === 'plumbing' ? '#0369a1' : '#334155',
                          }}>
                            {item.category}
                          </span>
                        </td>
                        <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 700 }}>
                          {item.count}
                        </td>
                        <td style={{ padding: '11px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {Math.round(item.totalWatts / item.count)} W
                        </td>
                        <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>
                          {item.totalWatts.toLocaleString()} W
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: 'rgba(2,132,199,0.08)', borderTop: '2px solid rgba(2,132,199,0.3)' }}>
                      <td colSpan={4} style={{ padding: '13px 12px', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>
                        TOTAL CONNECTED LOAD ({mepTakeoff.totalPoints} Points)
                      </td>
                      <td style={{ padding: '13px 12px', textAlign: 'right', fontWeight: 800 }}>
                        {mepTakeoff.totalPoints}
                      </td>
                      <td style={{ padding: '13px 12px' }}></td>
                      <td style={{ padding: '13px 12px', textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: '#0284c7', background: 'rgba(2,132,199,0.15)', padding: '3px 10px', borderRadius: 20 }}>
                          {mepTakeoff.totalWattage.toLocaleString()} W ({mepTakeoff.totalKw} kW)
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
