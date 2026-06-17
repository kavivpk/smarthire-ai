import Editor from '@monaco-editor/react';

const LANGUAGE_CONFIG = {
  python:     { label: 'Python',     monacoId: 'python',     icon: '🐍' },
  javascript: { label: 'JavaScript', monacoId: 'javascript', icon: '🟨' },
  java:       { label: 'Java',       monacoId: 'java',       icon: '☕' },
  cpp:        { label: 'C++',        monacoId: 'cpp',        icon: '⚙️' },
  c:          { label: 'C',          monacoId: 'c',          icon: '🔵' },
  go:         { label: 'Go',         monacoId: 'go',         icon: '🐹' },
};

export default function CodeEditor({ language, value, onChange, onLanguageChange }) {
  const config = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG.python;

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden border border-gray-700" style={{ background: '#1e1e1e' }}>
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700" style={{ background: '#252526' }}>
        {/* Tab bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">solution.{language === 'cpp' ? 'cpp' : language === 'javascript' ? 'js' : language}</span>
          <span className="w-2 h-2 bg-yellow-400 rounded-full" title="Unsaved changes" />
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Language:</label>
          <select
            value={language}
            onChange={e => onLanguageChange && onLanguageChange(e.target.value)}
            className="text-xs bg-gray-700 text-gray-200 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
            style={{ fontFamily: 'Consolas, monospace' }}
          >
            {Object.entries(LANGUAGE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 relative min-h-0">
        <Editor
          height="100%"
          language={config.monacoId}
          value={value}
          onChange={v => onChange && onChange(v || '')}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            cursorStyle: 'line',
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
            scrollbar: { verticalScrollbarSize: 6 },
          }}
          loading={
            <div className="flex items-center justify-center h-full text-gray-500 text-sm font-mono">
              Loading editor...
            </div>
          }
        />
    </div>
  </div>
  );
}
