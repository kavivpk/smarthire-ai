import { useTheme } from '../context/useTheme';

export default function ThemeToggle() {
  const { isDark, setIsDark } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <span style={{
        fontSize: '13px',
        color: isDark ? '#9ca3af' : '#6b7280'
      }}>
        {isDark ? 'Dark' : 'Light'}
      </span>
      <div
        onClick={() => setIsDark(!isDark)}
        style={{
          width: '48px',
          height: '26px',
          borderRadius: '999px',
          backgroundColor: isDark ? '#2563eb' : '#d1d5db',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background-color 0.3s',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          position: 'absolute',
          top: '4px',
          left: isDark ? '26px' : '4px',
          transition: 'left 0.3s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
    </div>
  );
}