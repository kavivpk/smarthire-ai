const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/pages/LiveInterview.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all emojis with an empty string using Unicode property escapes
const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;
content = content.replace(emojiRegex, '');

// Also remove any stray mojibake that might have crept in (e.g., ðŸ¤–)
content = content.replace(/ðŸ¤–|ðŸ’»|ðŸ—£ï¸/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Emojis and mojibake removed.');
