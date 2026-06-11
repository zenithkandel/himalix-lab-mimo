const fs = require('fs');
const path = require('path');

const unifiedCssPath = path.join(__dirname, 'src', 'App.css');
const originalStoreCssPath = path.join(__dirname, '..', 'himalix-store', 'frontend', 'src', 'App.css');

// 1. Read existing unified App.css and find where Labs CSS ends
let unifiedCss = fs.readFileSync(unifiedCssPath, 'utf8');

// Find the marker
const marker = '/* Isolated Storefront CSS */';
const markerIndex = unifiedCss.indexOf(marker);

let labsCss = '';
if (markerIndex !== -1) {
  labsCss = unifiedCss.substring(0, markerIndex).trim();
} else {
  // If marker not found, let's find the first occurrence of '.store-app'
  const storeAppIndex = unifiedCss.indexOf('.store-app');
  if (storeAppIndex !== -1) {
    labsCss = unifiedCss.substring(0, storeAppIndex).trim();
  } else {
    labsCss = unifiedCss.trim();
  }
}

// 2. Read original store App.css
let originalStoreCss = fs.readFileSync(originalStoreCssPath, 'utf8');

// 3. Strip imports from store CSS (we will put them at the top of the file)
const importRegex = /@import\s+url\([^)]+\);/g;
const imports = originalStoreCss.match(importRegex) || [];
let storeCssClean = originalStoreCss.replace(importRegex, '');

// Strip comments to ensure safe brace matching
storeCssClean = storeCssClean.replace(/\/\*[\s\S]*?\*\//g, '');

function scopeSelector(selector, prefix) {
  return selector.split(',')
    .map(s => {
      s = s.trim();
      if (!s) return '';
      // If it's a media query or keyframe percentage/keyword, leave it alone
      if (/^(from|to|\d+%|@)/i.test(s)) {
        return s;
      }
      
      // Exact matches for root/body/html container elements
      if (s === 'body' || s === 'html' || s === ':root') {
        return prefix;
      }
      
      // Prefix matching nested root elements
      if (s.startsWith('body ') || s.startsWith('html ') || s.startsWith(':root ')) {
        return prefix + s.substring(4);
      }
      if (s.startsWith('body:') || s.startsWith('html:') || s.startsWith(':root:')) {
        let colonIdx = s.indexOf(':');
        return prefix + s.substring(colonIdx);
      }
      
      // For all other selectors (like .btn, h1, etc.) prefix with space
      return prefix + ' ' + s;
    })
    .join(', ');
}

function scopeCss(cssText, prefix) {
  let output = '';
  let i = 0;
  let len = cssText.length;
  
  while (i < len) {
    // Find next opening brace
    let nextBrace = cssText.indexOf('{', i);
    if (nextBrace === -1) {
      output += cssText.substring(i);
      break;
    }
    
    let selector = cssText.substring(i, nextBrace).trim();
    
    if (selector.startsWith('@media') || selector.startsWith('@supports') || selector.startsWith('@document')) {
      output += cssText.substring(i, nextBrace) + ' {\n';
      i = nextBrace + 1;
      let braceCount = 1;
      let innerContent = '';
      while (i < len && braceCount > 0) {
        let char = cssText[i];
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        
        if (braceCount > 0) {
          innerContent += char;
          i++;
        }
      }
      output += scopeCss(innerContent, prefix);
      output += '\n}\n';
      i++; // skip closing brace
    } else if (selector.startsWith('@keyframes')) {
      output += cssText.substring(i, nextBrace) + ' {\n';
      i = nextBrace + 1;
      let braceCount = 1;
      while (i < len && braceCount > 0) {
        let char = cssText[i];
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        output += char;
        i++;
      }
    } else if (selector.startsWith('@font-face') || selector.startsWith('@import') || selector.startsWith('@charset')) {
      output += cssText.substring(i, nextBrace) + ' {\n';
      i = nextBrace + 1;
      let braceCount = 1;
      while (i < len && braceCount > 0) {
        let char = cssText[i];
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        output += char;
        i++;
      }
    } else {
      let nextCloseBrace = cssText.indexOf('}', nextBrace);
      if (nextCloseBrace === -1) {
        output += cssText.substring(i);
        break;
      }
      let rules = cssText.substring(nextBrace, nextCloseBrace + 1);
      let scopedSelector = scopeSelector(selector, prefix);
      output += scopedSelector + ' ' + rules + '\n';
      i = nextCloseBrace + 1;
    }
  }
  return output;
}

const prefix = '.store-app';
const scopedStoreCss = scopeCss(storeCssClean, prefix);

const finalCss = [
  ...imports,
  labsCss,
  '\n\n/* Isolated Storefront CSS */',
  scopedStoreCss
].join('\n\n');

fs.writeFileSync(unifiedCssPath, finalCss, 'utf8');
console.log('CSS scoping and compilation completed successfully!');
