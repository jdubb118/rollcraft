import { useRef, useCallback } from 'react';
import type { Direction } from '../overworld/overworldTypes';

interface DPadProps {
  onDirection: (dir: Direction | null) => void;
  onAction: () => void;
}

// Invisible joystick — touch anywhere on the left half to move,
// direction based on drag angle from initial touch point
export default function DPad({ onDirection, onAction }: DPadProps) {
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const activeDir = useRef<Direction | null>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  const DEAD_ZONE = 15; // pixels before registering direction

  const getDirection = useCallback((dx: number, dy: number): Direction | null => {
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < DEAD_ZONE) return null;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle > -45 && angle <= 45) return 'right';
    if (angle > 45 && angle <= 135) return 'down';
    if (angle > -135 && angle <= -45) return 'up';
    return 'left';
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    originRef.current = { x: e.clientX, y: e.clientY };
    activeDir.current = null;

    // Show joystick indicator
    if (joystickRef.current) {
      joystickRef.current.style.opacity = '1';
      joystickRef.current.style.left = `${e.clientX - 40}px`;
      joystickRef.current.style.top = `${e.clientY - 40}px`;
    }
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(0, 0)';
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!originRef.current) return;
    const dx = e.clientX - originRef.current.x;
    const dy = e.clientY - originRef.current.y;
    const dir = getDirection(dx, dy);

    if (dir !== activeDir.current) {
      activeDir.current = dir;
      onDirection(dir);
    }

    // Move knob indicator (clamped)
    if (knobRef.current) {
      const maxDist = 25;
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
      const angle = Math.atan2(dy, dx);
      const nx = Math.cos(angle) * dist;
      const ny = Math.sin(angle) * dist;
      knobRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
    }
  }, [getDirection, onDirection]);

  const handlePointerUp = useCallback(() => {
    originRef.current = null;
    activeDir.current = null;
    onDirection(null);

    if (joystickRef.current) {
      joystickRef.current.style.opacity = '0';
    }
  }, [onDirection]);

  return (
    <>
      {/* Invisible touch zone — left 60% of screen */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, width: '60%', height: '35%',
          zIndex: 100, touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      {/* Joystick visual indicator (appears on touch) */}
      <div
        ref={joystickRef}
        style={{
          position: 'fixed', width: 80, height: 80,
          borderRadius: '50%', border: '2px solid rgba(255,215,0,0.3)',
          background: 'rgba(255,255,255,0.05)',
          pointerEvents: 'none', zIndex: 101, opacity: 0,
          transition: 'opacity 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          ref={knobRef}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,215,0,0.4)', border: '2px solid rgba(255,215,0,0.6)',
            transition: 'transform 0.05s',
          }}
        />
      </div>

      {/* A button — right side */}
      <button
        style={{
          position: 'fixed', bottom: 40, right: 30,
          width: 56, height: 56, borderRadius: '50%',
          background: '#ffd700', color: '#000', fontSize: '0.6rem',
          fontFamily: "'Press Start 2P', monospace", border: '3px solid #b8960f',
          zIndex: 100, touchAction: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onPointerDown={onAction}
      >
        A
      </button>
    </>
  );
}
