import React, { useMemo } from 'react';
import { Project } from '../core/model/types';
import {
  generateVastuReport,
  VASTU_SECTOR_DEFS,
  VastuSector,
  RoomVastuAudit,
} from '../core/model/vastu';
import {
  X,
  Compass,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  ShieldCheck,
  Flame,
  Droplets,
  Wind,
  Sun,
  Eye,
} from 'lucide-react';

interface VastuModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onToggleVastuGrid?: () => void;
  onUpdateNorthOrientation?: (degrees: number) => void;
}

export const VastuModal: React.FC<VastuModalProps> = ({
  isOpen,
  onClose,
  project,
  onToggleVastuGrid,
  onUpdateNorthOrientation,
}) => {
  const report = useMemo(() => generateVastuReport(project), [project]);
  const showGrid = project.settings.showVastuGrid === true;

  if (!isOpen) return null;

  // 9-Grid layout mapping for Mandala UI
  const mandalaGrid: VastuSector[][] = [
    ['NW', 'N', 'NE'],
    ['W', 'Center', 'E'],
    ['SW', 'S', 'SE'],
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 960,
          maxHeight: '90vh',
          background: 'var(--bg-surface, #1e293b)',
          border: '1px solid var(--border-medium, #334155)',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--text-primary, #f8fafc)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-medium, #334155)',
            background: 'var(--bg-surface-elevated, #0f172a)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.35)',
              }}
            >
              <Compass size={22} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                Vastu Shastra & Spatial Harmony Compliance Engine
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
                9-Sector Vastu Purusha Mandala Audit • North Orientation: {report.northOrientation}°
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Score & KPI Dashboard Banner */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
              gap: 16,
            }}
          >
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(2, 132, 199, 0.05))',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background:
                    report.overallScore >= 80
                      ? '#10b981'
                      : report.overallScore >= 60
                      ? '#f59e0b'
                      : '#ef4444',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                }}
              >
                {report.overallScore}%
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Vastu Index
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                  {report.rating}
                </div>
                <div style={{ fontSize: 11, color: '#38bdf8', marginTop: 2 }}>
                  Spatial Alignment
                </div>
              </div>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: 'var(--bg-surface-elevated, #0f172a)',
                border: '1px solid var(--border-medium, #334155)',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase' }}>
                Auspicious Zones
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
                {report.auspiciousCount} <span style={{ fontSize: 13, fontWeight: 400, color: '#94a3b8' }}>/ {report.totalRoomsAudited}</span>
              </div>
              <div style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>
                Positively Aligned
              </div>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: 'var(--bg-surface-elevated, #0f172a)',
                border: '1px solid var(--border-medium, #334155)',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase' }}>
                Needs Remedies
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: report.inauspiciousCount > 0 ? '#f59e0b' : '#10b981', marginTop: 4 }}>
                {report.inauspiciousCount}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)', marginTop: 2 }}>
                Architectural Cures
              </div>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: 'var(--bg-surface-elevated, #0f172a)',
                border: '1px solid var(--border-medium, #334155)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase', marginBottom: 8 }}>
                2D CAD Canvas Grid
              </div>
              <button
                onClick={onToggleVastuGrid}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: showGrid ? '1px solid #0ea5e9' : '1px solid var(--border-medium, #334155)',
                  background: showGrid ? '#0ea5e920' : 'transparent',
                  color: showGrid ? '#38bdf8' : 'var(--text-secondary, #94a3b8)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Eye size={14} />
                <span>{showGrid ? 'Vastu Grid: ON' : 'Show 9-Grid'}</span>
              </button>
            </div>
          </div>

          {/* Vastu Purusha Mandala 3x3 Interactive Chart */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={16} color="#0ea5e9" />
                <span>Vastu Purusha Mandala (9 Directional Energy Sectors)</span>
              </h3>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                North Compass is at 0° (Top)
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                borderRadius: 12,
                padding: 8,
                background: 'var(--bg-surface-elevated, #0f172a)',
                border: '1px solid var(--border-medium, #334155)',
              }}
            >
              {mandalaGrid.flat().map((sec) => {
                const info = VASTU_SECTOR_DEFS[sec];
                const matchingRooms = report.roomAudits.filter((a) => a.sector === sec);

                return (
                  <div
                    key={sec}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: sec === 'Center' ? 'rgba(236, 72, 153, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${info.color}40`,
                      minHeight: 110,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: info.color }}>
                        {sec} • {info.sanskritName.split(' ')[0]}
                      </span>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: `${info.color}20`, color: info.color }}>
                        {info.element.split(' ')[0]}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)', marginBottom: 6 }}>
                      {info.deity}
                    </div>

                    {/* Rooms placed here */}
                    <div style={{ marginTop: 'auto' }}>
                      {matchingRooms.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {matchingRooms.map((rm) => (
                            <span
                              key={rm.roomId}
                              style={{
                                fontSize: 10,
                                fontWeight: 500,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background:
                                  rm.status === 'auspicious'
                                    ? '#10b98125'
                                    : rm.status === 'acceptable'
                                    ? '#f59e0b25'
                                    : '#ef444425',
                                color:
                                  rm.status === 'auspicious'
                                    ? '#34d399'
                                    : rm.status === 'acceptable'
                                    ? '#fbbf24'
                                    : '#f87171',
                                border: `1px solid ${
                                  rm.status === 'auspicious'
                                    ? '#10b98150'
                                    : rm.status === 'acceptable'
                                    ? '#f59e0b50'
                                    : '#ef444450'
                                }`,
                              }}
                            >
                              {rm.roomName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'rgba(148, 163, 184, 0.5)', fontStyle: 'italic' }}>
                          Ideal: {info.idealRooms[0]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room-by-Room Audit Table */}
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>
              Spatial Audit Breakdown by Room
            </h3>

            {report.roomAudits.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                Draw enclosed rooms on the active floor to run live Vastu placement analysis.
              </div>
            ) : (
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-medium, #334155)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface-elevated, #0f172a)', borderBottom: '1px solid var(--border-medium, #334155)' }}>
                      <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600 }}>Room Name</th>
                      <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600 }}>Vastu Sector</th>
                      <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600 }}>Elemental Harmony</th>
                      <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600 }}>Compliance Assessment & Remedy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.roomAudits.map((audit) => (
                      <tr key={audit.roomId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{audit.roomName}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ color: audit.sectorInfo.color, fontWeight: 600 }}>
                            {audit.sector} ({audit.sectorInfo.sanskritName.split(' ')[0]})
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              background:
                                audit.status === 'auspicious'
                                  ? '#10b98125'
                                  : audit.status === 'acceptable'
                                  ? '#f59e0b25'
                                  : '#ef444425',
                              color:
                                audit.status === 'auspicious'
                                  ? '#34d399'
                                  : audit.status === 'acceptable'
                                  ? '#fbbf24'
                                  : '#f87171',
                            }}
                          >
                            {audit.status.toUpperCase()} ({audit.score}%)
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.4 }}>
                          <div>{audit.notes}</div>
                          {audit.remedy && (
                            <div style={{ color: '#f59e0b', fontSize: 11, marginTop: 4, fontWeight: 500 }}>
                              💡 Remedy: {audit.remedy}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Architectural Remedies */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: 'var(--bg-surface-elevated, #0f172a)',
              border: '1px solid var(--border-medium, #334155)',
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 600, color: '#38bdf8' }}>
              Golden Principles of Architectural Harmony
            </h4>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6 }}>
              {report.generalRemedies.map((rem, i) => (
                <li key={i}>{rem}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '14px 24px',
            borderTop: '1px solid var(--border-medium, #334155)',
            background: 'var(--bg-surface-elevated, #0f172a)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
