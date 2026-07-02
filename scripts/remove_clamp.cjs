const fs = require('fs');
const files = [
  'src/pages/Pedidos.tsx',
  'src/pages/Fidelidade.tsx',
  'src/components/admin/AdminOrders.tsx'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/line-clamp-\d+/g, 'break-words');
    fs.writeFileSync(f, content);
  }
});
console.log('Removed line-clamp');
