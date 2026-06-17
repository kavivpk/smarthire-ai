import re

with open('frontend/src/pages/LiveInterview.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Map of unicode escape to actual character
replacements = {
    r'\u{1F4CB}': '📋',
    r'\u{1F916}': '🤖',
    r'\u{1F464}': '👤',
    r'\u{1F4C4}': '📄',
    r'\u{1F680}': '🚀',
    r'\u{1F389}': '🎉',
    r'\u{1F4E7}': '📧',
    r'\u{1F3A4}': '🎤',
    r'\u{1F504}': '🔄',
    r'\u2705': '✅',
    r'\u2192': '→',
    r'\u2715': '✕',
    r'\u2014': '—',
}

for escape, char in replacements.items():
    content = content.replace(escape, char)

with open('frontend/src/pages/LiveInterview.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done! All unicode escapes replaced.")
