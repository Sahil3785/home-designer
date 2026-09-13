import React, { useState, useEffect } from 'react';
import { Sixteenths } from '../core/units/units';
import { formatFeetInches } from '../core/units/formatter';
import { parseFeetInches } from '../core/units/parser';

interface FeetInchesInputProps {
  value: Sixteenths;
  onChange: (newValue: Sixteenths) => void;
  label?: string;
  disabled?: boolean;
  min?: Sixteenths;
  max?: Sixteenths;
  className?: string;
  step?: Sixteenths;
  style?: React.CSSProperties;
}

export const FeetInchesInput: React.FC<FeetInchesInputProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  min,
  max,
  className = '',
  step = 16, // 1 inch default step
  style,
}) => {
  const [text, setText] = useState(() => formatFeetInches(value));
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with prop when not actively typing
  useEffect(() => {
    if (!isEditing) {
      setText(formatFeetInches(value));
      setError(null);
    }
  }, [value, isEditing]);

  const commitValue = () => {
    setIsEditing(false);
    const result = parseFeetInches(text);
    if (result.isValid) {
      let finalVal = result.sixteenths;
      if (min !== undefined && finalVal < min) finalVal = min;
      if (max !== undefined && finalVal > max) finalVal = max;
      onChange(finalVal);
      setText(formatFeetInches(finalVal));
      setError(null);
    } else {
      setError(result.error || 'Invalid dimension');
      setText(formatFeetInches(value)); // revert to current value
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitValue();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setText(formatFeetInches(value));
      setError(null);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = value + step;
      if (max === undefined || next <= max) {
        onChange(next);
        setText(formatFeetInches(next));
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = value - step;
      if (min === undefined || next >= min) {
        onChange(next);
        setText(formatFeetInches(next));
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }} className={className}>
      {label && (
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
          {label}
        </span>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          value={text}
          disabled={disabled}
          onChange={(e) => {
            setText(e.target.value);
            setIsEditing(true);
            setError(null);
          }}
          onFocus={() => setIsEditing(true)}
          onBlur={commitValue}
          onKeyDown={handleKeyDown}
          title="Format: 10', 10' 6&quot;, 12' 4 1/2&quot;, 6&quot;, 8' 9 3/4&quot;"
          placeholder="e.g. 10' 6&quot;"
          style={{
            width: '100%',
            borderColor: error ? 'var(--accent-rose)' : undefined,
            paddingRight: 36,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const next = value + step;
              if (max === undefined || next <= max) {
                onChange(next);
                setText(formatFeetInches(next));
              }
            }}
            style={{
              fontSize: 8,
              padding: '1px 4px',
              background: 'var(--bg-surface-hover)',
              borderRadius: 2,
              lineHeight: 1,
            }}
            title="Increase by 1&quot;"
          >
            ▲
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const next = value - step;
              if (min === undefined || next >= min) {
                onChange(next);
                setText(formatFeetInches(next));
              }
            }}
            style={{
              fontSize: 8,
              padding: '1px 4px',
              background: 'var(--bg-surface-hover)',
              borderRadius: 2,
              lineHeight: 1,
            }}
            title="Decrease by 1&quot;"
          >
            ▼
          </button>
        </div>
      </div>
      {error && (
        <span style={{ fontSize: 10, color: 'var(--accent-rose)', marginTop: 2 }}>{error}</span>
      )}
    </div>
  );
};
