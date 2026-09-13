import React, { useState } from 'react';
import {
  Compass,
  PenTool,
  DoorOpen,
  Box,
  Sliders,
  RotateCcw,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const tourSteps = [
    {
      title: 'Welcome to Home Designer!',
      subtitle: 'Designed specifically for you in pure Feet and Inches',
      icon: <Sparkles size={28} color="#2563eb" />,
      content: (
        <div>
          <p style={{ marginBottom: 12, lineHeight: 1.5 }}>
            This application is built for drawing your entire house plan in 2D and instantly exploring it in 3D.
          </p>
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '10px 14px',
              borderRadius: 8,
              color: '#166534',
              fontSize: 13,
            }}
          >
            📏 <strong>100% Feet &amp; Inches:</strong> You never have to worry about meters or centimeters. All inputs, walls, doors, and rulers work naturally in feet and inches (e.g.{' '}
            <code>10' 6"</code> or <code>12' 4 1/2"</code>).
          </div>
        </div>
      ),
    },
    {
      title: '1. The 2D Floor Plan Canvas',
      subtitle: 'Infinite drafting area with architectural rulers',
      icon: <Compass size={28} color="#0891b2" />,
      content: (
        <div>
          <p style={{ marginBottom: 10, lineHeight: 1.5 }}>
            The white canvas on the left is where you draw and arrange your floor plan.
          </p>
          <ul style={{ paddingLeft: 18, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            <li>
              <strong>Architectural Rulers:</strong> The top and left rulers show exact feet marks (<code>0'</code>, <code>2'</code>, <code>4'</code>, <code>6'</code>, etc.).
            </li>
            <li>
              <strong>Pan the Canvas:</strong> Scroll with two fingers on your Mac trackpad, or hold the Spacebar / Middle Click and drag.
            </li>
            <li>
              <strong>Zoom In / Out:</strong> Pinch with two fingers on your trackpad or scroll with your mouse wheel.
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: '2. Drawing Walls is Easy',
      subtitle: 'Click to start, move, and click to place',
      icon: <PenTool size={28} color="#2563eb" />,
      content: (
        <div>
          <p style={{ marginBottom: 10, lineHeight: 1.5 }}>
            To start drawing walls, press <strong>W</strong> on your keyboard or click the <strong>Draw Wall</strong> icon on the left toolbar.
          </p>
          <ul style={{ paddingLeft: 18, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            <li>
              <strong>Click once:</strong> Sets where the wall starts.
            </li>
            <li>
              <strong>Move cursor:</strong> A live dimension badge shows the exact length in feet and inches (e.g. <code>14' 6"</code>) and angle.
            </li>
            <li>
              <strong>Click again:</strong> Places the wall. The next wall segment starts immediately so you can sketch whole rooms in seconds!
            </li>
            <li>
              <strong>Finish drawing:</strong> Right-click or press <code>Escape</code>.
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: '3. Automatic Room Detection',
      subtitle: 'Closed walls automatically calculate square footage',
      icon: <CheckCircle2 size={28} color="#059669" />,
      content: (
        <div>
          <p style={{ marginBottom: 10, lineHeight: 1.5 }}>
            Whenever your walls connect to enclose a space, Home Designer instantly detects the room!
          </p>
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '10px 14px',
              borderRadius: 8,
              color: '#1e40af',
              fontSize: 13,
              marginBottom: 10,
            }}
          >
            ✨ <strong>Try it:</strong> Draw a dividing wall down the middle of the starter room. It will automatically split into two labeled rooms with their exact square footage!
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            In the 3D view, hardwood flooring is automatically laid down inside each detected room.
          </p>
        </div>
      ),
    },
    {
      title: '4. Inserting Doors & Windows',
      subtitle: 'Hover over any wall to see a live preview',
      icon: <DoorOpen size={28} color="#d97706" />,
      content: (
        <div>
          <p style={{ marginBottom: 10, lineHeight: 1.5 }}>
            Press <strong>D</strong> for the Door Tool or <strong>I</strong> for the Window Tool:
          </p>
          <ul style={{ paddingLeft: 18, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            <li>
              <strong>Hover over any wall:</strong> A live preview will slide along the wall with distance badges showing how far it is from each corner.
            </li>
            <li>
              <strong>Flip Swing Direction:</strong> Press <strong>F</strong> or <strong>Spacebar</strong> to flip the door swing inside or outside!
            </li>
            <li>
              <strong>Click to Place:</strong> Locks the door or window onto that wall, and the 3D model immediately cuts out the opening.
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: '5. Real-Time 3D Orbit View',
      subtitle: 'Your house comes alive automatically',
      icon: <Box size={28} color="#4f46e5" />,
      content: (
        <div>
          <p style={{ marginBottom: 10, lineHeight: 1.5 }}>
            Every wall, door, and floor you draw in 2D is instantly generated in 3D on the right!
          </p>
          <ul style={{ paddingLeft: 18, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            <li>
              <strong>Rotate / Orbit:</strong> Click and drag with your left mouse button.
            </li>
            <li>
              <strong>Pan:</strong> Click and drag with your right mouse button (or hold Shift + Left Click).
            </li>
            <li>
              <strong>View Presets:</strong> Click <em>Perspective</em>, <em>Top View</em>, or <em>Front View</em> in the top-right corner of the 3D screen.
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: '6. Property Inspector & Undo/Redo',
      subtitle: 'Customize dimensions anytime with peace of mind',
      icon: <Sliders size={28} color="#2563eb" />,
      content: (
        <div>
          <p style={{ marginBottom: 10, lineHeight: 1.5 }}>
            Press <strong>V</strong> (Select Tool) and click on any wall or door:
          </p>
          <ul style={{ paddingLeft: 18, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            <li>
              The right <strong>Inspector Panel</strong> lets you edit thickness (e.g. <code>6"</code>, <code>4 1/2"</code>), ceiling height (<code>9' 0"</code>), or door dimensions.
            </li>
            <li>
              <strong>Full Undo / Redo:</strong> Press <code>⌘Z</code> to undo any mistake, and <code>⌘⇧Z</code> to redo.
            </li>
            <li>
              <strong>Autosave:</strong> Your project automatically saves every 20 seconds locally on your Mac.
            </li>
          </ul>
        </div>
      ),
    },
  ];

  const current = tourSteps[currentStep];
  const isLast = currentStep === tourSteps.length - 1;

  const handleFinish = () => {
    localStorage.setItem('homedesigner_tour_completed', 'true');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(17, 24, 39, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: 520,
          maxWidth: '100%',
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: '#fcfdfe',
          }}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {current.icon}
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {current.title}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                {current.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={handleFinish}
            style={{
              color: 'var(--text-muted)',
              padding: 4,
              borderRadius: 6,
            }}
            title="Close Guide"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', fontSize: 14, color: 'var(--text-primary)', minHeight: 170 }}>
          {current.content}
        </div>

        {/* Modal Footer / Navigation */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Step Dots */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {tourSteps.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentStep(idx)}
                style={{
                  width: idx === currentStep ? 20 : 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: idx === currentStep ? 'var(--accent-blue)' : 'var(--border-medium)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              />
            ))}
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
              {currentStep + 1} of {tourSteps.length}
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                }}
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>
            )}

            {!isLast ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '7px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: 'var(--accent-blue)',
                  color: '#ffffff',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: 'var(--accent-emerald)',
                  color: '#ffffff',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <CheckCircle2 size={16} />
                <span>Start Designing!</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
