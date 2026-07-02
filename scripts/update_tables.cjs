const fs = require('fs');
const files = [
  'src/components/admin/AdminOrders.tsx',
  'src/components/admin/AdminEntradas.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/className=\"px-6 py-4\"/g, 'className=\"px-6 py-4 whitespace-nowrap\"');
  content = content.replace(/className=\"px-6 py-4 relative\"/g, 'className=\"px-6 py-4 relative whitespace-nowrap\"');
  content = content.replace(/className=\"px-6 py-4 text-right\"/g, 'className=\"px-6 py-4 text-right whitespace-nowrap\"');
  
  // also fix double whitespace-nowrap
  content = content.replace(/whitespace-nowrap whitespace-nowrap/g, 'whitespace-nowrap');
  fs.writeFileSync(f, content);
});
console.log('Tables updated with whitespace-nowrap');
