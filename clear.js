const fs = require('fs');

fs.writeFileSync('./storage/lastIndex.json', JSON.stringify({ lastIndex: 1 }), { encoding: 'utf8' });
fs.writeFileSync('./storage/offers.json', JSON.stringify([]), { encoding: 'utf8' });
