const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server-firestore.js');
let code = fs.readFileSync(serverFile, 'utf8');

code = code.replace(/function calculateAdaptiveAnalytics/g, 'async function calculateAdaptiveAnalytics');
code = code.replace(/calculateAdaptiveAnalytics\(/g, 'await calculateAdaptiveAnalytics(');
// We made it async so we added await to definition too, let's fix that
code = code.replace(/async function await calculateAdaptiveAnalytics/g, 'async function calculateAdaptiveAnalytics');

fs.writeFileSync(serverFile, code, 'utf8');
console.log('Fixed calculateAdaptiveAnalytics');
