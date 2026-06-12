const fs = require('fs');
const path = require('path');

const storeDir = path.join(__dirname, 'store');
fs.readdirSync(storeDir).forEach(f => {
    if (!f.endsWith('.js')) return;
    let filePath = path.join(storeDir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/..\/..\/config\/db/g, '../config/db');
    content = content.replace(/..\/..\/middleware\/auth/g, '../middleware/auth');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed imports in', filePath);
    }
});
