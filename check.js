const si = require('react-icons/si');
const keys = Object.keys(si);
const brands = ['apple', 'samsung', 'xiaomi', 'motorola', 'google', 'realme', 'poco'];

brands.forEach(b => {
  const matches = keys.filter(k => k.toLowerCase().includes(b));
  console.log(`${b}:`, matches);
});
