const fs = require('fs');
const path = require('path');

const walk = (dir, callback) => {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
};

walk(__dirname, (filePath) => {
    if (!filePath.endsWith('.js')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // auth pages
    if (filePath.includes('auth\\Signin.js') || filePath.includes('auth\\Signup.js')) {
        content = content.replace(/..\/..\/context\/AuthContext/g, './AuthContext');
    }

    // store components and pages
    if (filePath.includes('store\\')) {
        // Since we moved components/store/* to store/, and pages/store/* to store/
        // They are now in the same directory.
        content = content.replace(/..\/..\/components\/store\//g, './');
        content = content.replace(/..\/components\/store\//g, './');
        
        // Contexts
        content = content.replace(/..\/..\/context\/CartContext/g, './CartContext');
        content = content.replace(/..\/..\/context\/AuthContext/g, '../auth/AuthContext');
        content = content.replace(/..\/..\/context\/ThemeContext/g, '../context/ThemeContext');
    }

    // portfolio pages
    if (filePath.includes('portfolio\\Landing.js') || filePath.includes('portfolio\\Navbar.js')) {
        content = content.replace(/..\/context\/ThemeContext/g, '../context/ThemeContext');
        content = content.replace(/..\/context\/AuthContext/g, '../auth/AuthContext');
    }

    // admin pages
    if (filePath.includes('admin\\portfolio\\Admin.js')) {
        content = content.replace(/..\/context\/AuthContext/g, '../../auth/AuthContext');
    }
    if (filePath.includes('admin\\store\\Admin.js')) {
        content = content.replace(/..\/..\/context\/AuthContext/g, '../../auth/AuthContext');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed imports in', filePath);
    }
});
