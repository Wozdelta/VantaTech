export type Product = {
  id: string;
  name: string;
  brand: string;
  condition: 'Novo' | 'Seminovo Premium' | 'Usado Premium';
  memory: string;
  color: string;
  price: number;
  oldPrice?: number;
  badge?: 'Novo' | 'Oferta' | 'Mais Vendido';
};

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'iPhone 14 Pro Max',
    brand: 'Apple',
    condition: 'Seminovo Premium',
    memory: '256GB',
    color: 'Preto-espacial',
    price: 6499.00,
    oldPrice: 7299.00,
    badge: 'Oferta',
  },
  {
    id: '2',
    name: 'Samsung Galaxy S23 Ultra',
    brand: 'Samsung',
    condition: 'Novo',
    memory: '512GB',
    color: 'Verde',
    price: 5899.00,
    oldPrice: 6599.00,
    badge: 'Mais Vendido',
  },
  {
    id: '3',
    name: 'iPhone 13',
    brand: 'Apple',
    condition: 'Usado Premium',
    memory: '128GB',
    color: 'Estelar',
    price: 3599.00,
    oldPrice: 4199.00,
  },
  {
    id: '4',
    name: 'Xiaomi 13 Pro',
    brand: 'Xiaomi',
    condition: 'Seminovo Premium',
    memory: '256GB',
    color: 'Branco',
    price: 4599.00,
    badge: 'Novo',
  },
  {
    id: '5',
    name: 'Motorola Edge 40',
    brand: 'Motorola',
    condition: 'Seminovo Premium',
    memory: '256GB',
    color: 'Preto Eclipse',
    price: 2499.00,
    oldPrice: 2999.00,
  },
  {
    id: '6',
    name: 'Google Pixel 7 Pro',
    brand: 'Google',
    condition: 'Novo',
    memory: '128GB',
    color: 'Obsidian',
    price: 4299.00,
  },
  {
    id: '7',
    name: 'Samsung Galaxy Z Flip 4',
    brand: 'Samsung',
    condition: 'Usado Premium',
    memory: '256GB',
    color: 'Bora Purple',
    price: 3199.00,
    oldPrice: 3899.00,
    badge: 'Oferta',
  },
  {
    id: '8',
    name: 'iPhone 12',
    brand: 'Apple',
    condition: 'Usado Premium',
    memory: '64GB',
    color: 'Azul',
    price: 2299.00,
    oldPrice: 2699.00,
  },
  {
    id: '9',
    name: 'Poco F5 Pro',
    brand: 'Poco',
    condition: 'Novo',
    memory: '256GB',
    color: 'Preto',
    price: 2899.00,
    badge: 'Mais Vendido',
  },
  {
    id: '10',
    name: 'Realme GT Neo 5',
    brand: 'Realme',
    condition: 'Seminovo Premium',
    memory: '1TB',
    color: 'Roxo',
    price: 3199.00,
  },
  {
    id: '11',
    name: 'Samsung Galaxy S22',
    brand: 'Samsung',
    condition: 'Usado Premium',
    memory: '128GB',
    color: 'Phantom Black',
    price: 2499.00,
    oldPrice: 2899.00,
  },
  {
    id: '12',
    name: 'Redmi Note 12 Pro',
    brand: 'Xiaomi',
    condition: 'Novo',
    memory: '256GB',
    color: 'Azul Celeste',
    price: 1799.00,
    badge: 'Oferta',
  }
];
