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
      position: 'absolute', bottom: 12, left: 8, right: 8,
      background: '#0a0a14', border: '3px solid #ffd700',
      padding: '12px 16px', zIndex: 50,
    }}>
      {/* Speaker name */}
      <div style={{
        fontSize: 'var(--fs-sm)', color: '#ffd700', marginBottom: 8,
        textTransform: 'uppercase',
      }}>
        {speakerName}
      </div>

      {/* Dialogue text */}
      <div style={{
        fontSize: 'var(--fs-xs)', color: '#e0e0e0', lineHeight: 1.8,
        marginBottom: menuOptions ? 10 : 0,
        whiteSpace: 'pre-line',
      }}>
        {text}
      </div>

      {/* Menu options */}
      {menuOptions && menuOptions.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10,
          maxHeight: 200, overflowY: 'auto',
        }} className="no-scrollbar">
          {menuOptions.map((opt, i) => {
            const isSelected = i === selectedIndex;
            return (
              <button
                key={opt.action}
                onClick={() => onMenuSelect(opt.action)}
                disabled={opt.disabled}
                style={{
                  padding: '8px 12px',
                  background: opt.disabled ? '#111' : isSelected ? '#2a2a4e' : '#1a1a2e',
                  border: `2px solid ${opt.disabled ? '#333' : isSelected ? '#fff' : '#ffd700'}`,
                  color: opt.disabled ? '#555' : '#ffd700',
                  fontSize: 'var(--fs-xs)', textAlign: 'left',
                }}
              >
                {isSelected ? '► ' : '  '}{opt.label}
              </button>
            );
          })}
          <button
            onClick={onDismiss}
            style={{
              padding: '8px 12px',
              background: selectedIndex === menuOptions.length ? '#1a1a2e' : '#111',
              border: `2px solid ${selectedIndex === menuOptions.length ? '#fff' : '#444'}`,
              color: selectedIndex === menuOptions.length ? '#ccc' : '#888',
              fontSize: 'var(--fs-xs)', textAlign: 'left',
            }}
          >
            {selectedIndex === menuOptions.length ? '► ' : '  '}CANCEL
          </button>
        </div>
      )}

      {/* Continue button (no menu) */}
      {(!menuOptions || menuOptions.length === 0) && (
        <button
          onClick={onDismiss}
          style={{
            marginTop: 10, padding: '10px 14px', fontSize: 'var(--fs-xs)', color: '#888',
            background: '#111', border: '1px solid #444', width: '100%', cursor: 'pointer',
          }}
        >
          ► CONTINUE
        </button>
      )}
    </div>
  );
}
