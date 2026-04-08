import type { MenuOption } from '../overworld/overworldTypes';

interface DialogueBoxProps {
  speakerName: string;
  text: string;
  menuOptions?: MenuOption[] | null;
  selectedIndex?: number;
  onMenuSelect: (action: string) => void;
  onDismiss: () => void;
}

export default function DialogueBox({ speakerName, text, menuOptions, selectedIndex = 0, onMenuSelect, onDismiss }: DialogueBoxProps) {
  return (
    <div style={{
      position: 'fixed', bottom: 160, left: 8, right: 8,
      background: '#0a0a14', border: '3px solid #ffd700',
      padding: '10px 14px', zIndex: 50, maxWidth: 360, margin: '0 auto',
    }}>
      {/* Speaker name */}
      <div style={{
        fontSize: '0.45rem', color: '#ffd700', marginBottom: 6,
        textTransform: 'uppercase',
      }}>
        {speakerName}
      </div>

      {/* Dialogue text */}
      <div style={{
        fontSize: '0.38rem', color: '#e0e0e0', lineHeight: 1.8,
        marginBottom: menuOptions ? 10 : 0,
      }}>
        {text}
      </div>

      {/* Menu options */}
      {menuOptions && menuOptions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
          {menuOptions.map((opt, i) => {
            const isSelected = i === selectedIndex;
            return (
              <button
                key={opt.action}
                onClick={() => onMenuSelect(opt.action)}
                disabled={opt.disabled}
                style={{
                  padding: '6px 10px',
                  background: opt.disabled ? '#111' : isSelected ? '#2a2a4e' : '#1a1a2e',
                  border: `2px solid ${opt.disabled ? '#333' : isSelected ? '#fff' : '#ffd700'}`,
                  color: opt.disabled ? '#555' : '#ffd700',
                  fontSize: '0.38rem', textAlign: 'left',
                  fontFamily: "'Press Start 2P', monospace",
                }}
              >
                {isSelected ? '► ' : '  '}{opt.label}
              </button>
            );
          })}
          <button
            onClick={onDismiss}
            style={{
              padding: '6px 10px',
              background: selectedIndex === menuOptions.length ? '#1a1a2e' : '#111',
              border: `2px solid ${selectedIndex === menuOptions.length ? '#fff' : '#444'}`,
              color: selectedIndex === menuOptions.length ? '#ccc' : '#888',
              fontSize: '0.35rem', textAlign: 'left',
              fontFamily: "'Press Start 2P', monospace",
            }}
          >
            {selectedIndex === menuOptions.length ? '► ' : '  '}CANCEL
          </button>
        </div>
      )}

      {/* Tap to dismiss (no menu) */}
      {(!menuOptions || menuOptions.length === 0) && (
        <button
          onClick={onDismiss}
          style={{
            marginTop: 8, padding: '8px 14px', fontSize: '0.35rem', color: '#888',
            background: '#111', border: '1px solid #444', width: '100%',
            fontFamily: "'Press Start 2P', monospace", cursor: 'pointer',
          }}
        >
          ► CONTINUE
        </button>
      )}
    </div>
  );
}
