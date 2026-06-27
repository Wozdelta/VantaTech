import { useState } from 'react';
import { Filter, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterSectionProps = {
  title: string;
  options: string[];
  type?: 'checkbox' | 'radio';
};

function FilterSection({ title, options, type = 'checkbox' }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 py-4">
      <button 
        className="flex w-full items-center justify-between font-semibold text-gray-800 dark:text-gray-200 hover:text-vanta-blue dark:hover:text-vanta-blue transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isOpen ? "rotate-180" : "")} />
      </button>
      
      {isOpen && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {options.map((option, idx) => (
            <label key={idx} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 border border-gray-300 dark:border-gray-600 rounded-[4px] group-hover:border-vanta-blue transition-colors">
                <input type={type} name={title} className="peer sr-only" />
                <div className="absolute inset-0 bg-vanta-blue rounded-[3px] scale-0 peer-checked:scale-100 transition-transform duration-200 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SidebarFilters() {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 sticky top-[100px]">
        <div className="flex items-center gap-2 mb-6 text-vanta-darkblue dark:text-white">
          <Filter className="w-5 h-5" />
          <h2 className="font-bold text-lg">Filtrar Produtos</h2>
        </div>

        <FilterSection 
          title="Marca" 
          options={['Apple', 'Samsung', 'Xiaomi', 'Motorola', 'Realme']} 
        />
        
        <FilterSection 
          title="Estado do aparelho" 
          options={['Novo', 'Seminovo Premium', 'Usado Premium']} 
        />

        <FilterSection 
          title="Memória" 
          options={['64GB', '128GB', '256GB', '512GB', '1TB']} 
        />

        <div className="border-b border-gray-100 dark:border-gray-800 py-4 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
             <div className="relative flex items-center justify-center w-5 h-5 border border-gray-300 dark:border-gray-600 rounded-[4px] group-hover:border-vanta-blue transition-colors">
                <input type="checkbox" className="peer sr-only" />
                <div className="absolute inset-0 bg-vanta-blue rounded-[3px] scale-0 peer-checked:scale-100 transition-transform duration-200 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              </div>
             <span className="text-sm font-medium text-gray-800 dark:text-gray-300">Possui 5G</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
             <div className="relative flex items-center justify-center w-5 h-5 border border-gray-300 dark:border-gray-600 rounded-[4px] group-hover:border-vanta-blue transition-colors">
                <input type="checkbox" className="peer sr-only" />
                <div className="absolute inset-0 bg-vanta-blue rounded-[3px] scale-0 peer-checked:scale-100 transition-transform duration-200 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              </div>
             <span className="text-sm font-medium text-gray-800 dark:text-gray-300">Dual Chip</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
             <div className="relative flex items-center justify-center w-5 h-5 border border-gray-300 dark:border-gray-600 rounded-[4px] group-hover:border-vanta-blue transition-colors">
                <input type="checkbox" className="peer sr-only" />
                <div className="absolute inset-0 bg-vanta-blue rounded-[3px] scale-0 peer-checked:scale-100 transition-transform duration-200 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              </div>
             <span className="text-sm font-medium text-vanta-orange">Pronta Entrega</span>
          </label>
        </div>

        <button className="w-full mt-6 py-3 rounded-xl bg-vanta-darkblue text-white font-bold hover:bg-vanta-blue transition-colors duration-300 shadow-sm">
          Aplicar Filtros
        </button>
      </div>
    </aside>
  );
}
