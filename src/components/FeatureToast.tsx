import React from 'react';
import { X, Lightbulb, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  tip?: string;
  icon?: React.ReactNode;
}

interface FeatureToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const FeatureToast: React.FC<FeatureToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 40,
        left: 72,
        maxWidth: 380,
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderLeft: '4px solid var(--accent-blue)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        padding: '12px 16px',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        animation: 'slideUp 0.2s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {toast.icon || <Info size={16} color="var(--accent-blue)" />}
          <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{toast.title}</strong>
        </div>
        <button
          onClick={onDismiss}
          style={{ color: 'var(--text-muted)', padding: 2 }}
          title="Dismiss Tip"
        >
          <X size={14} />
        </button>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
        {toast.description}
      </p>

      {toast.tip && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--accent-amber)',
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            padding: '4px 8px',
            borderRadius: 4,
            marginTop: 2,
          }}
        >
          <Lightbulb size={12} />
          <span>{toast.tip}</span>
        </div>
      )}
    </div>
  );
};
