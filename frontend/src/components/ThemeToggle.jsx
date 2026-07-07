import { useTheme } from '../context/useTheme';

export default function ThemeToggle() {
  const { isDark, setIsDark } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500 }}
        className="text-gray-500 dark:text-gray-400">
        {isDark ? 'Dark' : 'Light'}
      </span>
      <div
        onClick={() => setIsDark(!isDark)}
        style={{
          width: 48, height: 26, borderRadius: 999,
          backgroundColor: isDark ? '#2563eb' : '#d1d5db',
          position: 'relative', cursor: 'pointer',
          transition: 'background-color 0.3s', flexShrink: 0,
          boxShadow: isDark ? '0 0 8px rgba(37,99,235,0.4)' : 'none',
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          backgroundColor: '#ffffff',
          position: 'absolute', top: 4,
          left: isDark ? 26 : 4,
          transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
        }} />
      </div>
    </div>
  );
}
