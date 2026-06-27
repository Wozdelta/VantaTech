import { SiApple, SiSamsung, SiXiaomi, SiMotorola, SiGoogle } from 'react-icons/si';

export default function Brands() {
  const brands = [
    { name: 'Apple', icon: SiApple },
    { name: 'Samsung', icon: SiSamsung },
    { name: 'Xiaomi', icon: SiXiaomi },
    { name: 'Motorola', icon: SiMotorola },
    { name: 'Google', icon: SiGoogle },
    { name: 'Realme', icon: null }, 
    { name: 'Poco', icon: null }, 
  ];

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold text-vanta-darkblue dark:text-white mb-8 text-center">Nossas Marcas</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {brands.map((brand, index) => {
          const Icon = brand.icon;
          return (
            <div 
              key={index}
              className="flex items-center justify-center h-24 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-hover hover:border-vanta-blue/30 transition-all duration-300 group cursor-pointer"
            >
              <div className="text-center flex flex-col items-center">
                 {Icon ? (
                   <Icon className="w-8 h-8 text-gray-500 dark:text-gray-400 mb-2 group-hover:scale-110 group-hover:text-vanta-blue dark:group-hover:text-vanta-blue transition-all" />
                 ) : (
                   <div className="w-8 h-8 mb-2 flex items-center justify-center font-black text-gray-400 dark:text-gray-500 group-hover:text-vanta-blue dark:group-hover:text-vanta-blue group-hover:scale-110 transition-all text-xl italic tracking-tighter">
                     {brand.name === 'Realme' ? 'R' : 'POCO'}
                   </div>
                 )}
                 <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 group-hover:text-vanta-blue dark:group-hover:text-vanta-blue transition-colors">{brand.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
