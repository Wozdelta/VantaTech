import { useState, useEffect } from 'react';
import { Filter, ChevronDown, Check, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

type FilterSectionProps = {
  title: string;
  options: string[];
  selectedOptions: string[];
  onChange: (option: string) => void;
};

function FilterSection({ title, options, selectedOptions, onChange }: FilterSectionProps) {
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
          {options.map((option, idx) => {
            const isChecked = selectedOptions.some(item => item.toLowerCase() === option.toLowerCase());
            return (
              <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 border border-gray-300 dark:border-gray-600 rounded-[4px] group-hover:border-vanta-blue transition-colors">
                  <input 
                    type="checkbox" 
                    checked={isChecked} 
                    onChange={() => onChange(option)} 
                    className="peer sr-only" 
                  />
                  <div className={cn(
                    "absolute inset-0 bg-vanta-blue rounded-[3px] transition-transform duration-200 flex items-center justify-center",
                    isChecked ? "scale-100" : "scale-0"
                  )}>
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{option}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PriceFilterSection({ min, max, onChange }: { min: string, max: string, onChange: (min: string, max: string) => void }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 py-4">
      <button 
        className="flex w-full items-center justify-between font-semibold text-gray-800 dark:text-gray-200 hover:text-vanta-blue dark:hover:text-vanta-blue transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        Faixa de Preço
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isOpen ? "rotate-180" : "")} />
      </button>
      
      {isOpen && (
        <div className="mt-5 space-y-4 animate-fade-in">
          <div className="flex gap-3">
            <div className="flex-1 relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs">R$</span>
              <input 
                type="number" 
                min="0"
                value={min} 
                onChange={e => {
                  const val = e.target.value;
                  if (Number(val) < 0) return;
                  onChange(val, max);
                }}
                onKeyDown={e => e.key === '-' && e.preventDefault()}
                placeholder="Mín" 
                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl pl-8 pr-3 py-2.5 text-sm font-bold text-gray-800 dark:text-white outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all"
              />
            </div>
            <div className="flex items-center text-gray-400 font-medium">-</div>
            <div className="flex-1 relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs">R$</span>
              <input 
                type="number" 
                min="0"
                value={max} 
                onChange={e => {
                  const val = e.target.value;
                  if (Number(val) < 0) return;
                  onChange(min, val);
                }}
                onKeyDown={e => e.key === '-' && e.preventDefault()}
                placeholder="Máx" 
                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl pl-8 pr-3 py-2.5 text-sm font-bold text-gray-800 dark:text-white outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={() => onChange('', '1500')} className="px-3 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-vanta-blue dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-lg hover:bg-vanta-blue hover:text-white hover:border-vanta-blue transition-all">Até R$ 1.500</button>
            <button onClick={() => onChange('1500', '3000')} className="px-3 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-vanta-blue dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-lg hover:bg-vanta-blue hover:text-white hover:border-vanta-blue transition-all">R$ 1.500 - R$ 3.000</button>
            <button onClick={() => onChange('3000', '')} className="px-3 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-vanta-blue dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-lg hover:bg-vanta-blue hover:text-white hover:border-vanta-blue transition-all">Acima de R$ 3.000</button>
          </div>
        </div>
      )}
    </div>
  );
}

type SidebarFiltersProps = {
  activeFilters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  marcas: string[];
  categorias: string[];
};

export default function SidebarFilters({ activeFilters, onFilterChange, marcas, categorias }: SidebarFiltersProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleFilterToggle = (category: string, option: string) => {
    // Garante que o array existe (tratamento para case insensitive que faremos no Produtos)
    const categoryName = Object.keys(activeFilters).find(k => k.toLowerCase() === category.toLowerCase()) || category;
    
    // Procura a opção ignorando maiúsculas e minúsculas
    const categoryFilters = activeFilters[categoryName] || [];
    const isSelected = categoryFilters.some((item: string) => item.toLowerCase() === option.toLowerCase());
    
    let newCategoryFilters;
    if (isSelected) {
      newCategoryFilters = categoryFilters.filter((item: string) => item.toLowerCase() !== option.toLowerCase());
    } else {
      newCategoryFilters = [...categoryFilters, option];
    }

    const newFilters = { ...activeFilters, [categoryName]: newCategoryFilters };
    onFilterChange(newFilters);
  };

  const handlePriceChange = (min: string, max: string) => {
    const newFilters = { ...activeFilters, PrecoMin: min, PrecoMax: max };
    onFilterChange(newFilters);
  };

  return (
    <>
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden w-full flex items-center justify-center gap-2 bg-vanta-darkblue dark:bg-vanta-blue text-white py-3.5 rounded-full font-bold shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-[1.02] active:scale-95 transition-all"
      >
        <SlidersHorizontal className="w-5 h-5" />
        Filtros e Ordenação
      </button>

      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[90] lg:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-[100] w-[85%] max-w-sm bg-white dark:bg-gray-950 overflow-y-auto transition-transform duration-300 shadow-2xl lg:relative lg:block lg:w-64 lg:transform-none lg:bg-transparent lg:dark:bg-transparent lg:z-0 lg:shadow-none lg:overflow-visible",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="bg-white dark:bg-gray-900 lg:rounded-2xl lg:border border-gray-100 dark:border-gray-800 p-6 lg:sticky lg:top-[100px] min-h-screen lg:min-h-0">
          <div className="flex items-center justify-between gap-2 mb-6 text-vanta-darkblue dark:text-white">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              <h2 className="font-bold text-lg">Filtrar Produtos</h2>
            </div>
            <button className="lg:hidden p-2 text-gray-400 hover:text-red-500 bg-gray-100 dark:bg-gray-800 rounded-full" onClick={() => setIsMobileOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

        {categorias.length > 0 && (
          <FilterSection 
            title="Categorias" 
            options={categorias} 
            selectedOptions={activeFilters.Categorias || []}
            onChange={(option) => handleFilterToggle('Categorias', option)}
          />
        )}

        {marcas.length > 0 && (
          <FilterSection 
            title="Marca" 
            options={marcas} 
            selectedOptions={activeFilters.Marca || []}
            onChange={(option) => handleFilterToggle('Marca', option)}
          />
        )}
        
        <FilterSection 
          title="Condição" 
          options={['Novo', 'Lacrado', 'Seminovo', 'Usado']} 
          selectedOptions={activeFilters.Condição || []}
          onChange={(option) => handleFilterToggle('Condição', option)}
        />

        <PriceFilterSection 
          min={activeFilters.PrecoMin || ''} 
          max={activeFilters.PrecoMax || ''} 
          onChange={handlePriceChange} 
        />

        <FilterSection 
          title="Memória" 
          options={['64GB', '128GB', '256GB', '512GB', '1TB']} 
          selectedOptions={activeFilters.Memória || []}
          onChange={(option) => handleFilterToggle('Memória', option)}
        />
        
        {/* Espaço extra no mobile para scroll */}
        <div className="h-20 lg:hidden"></div>
      </div>
    </aside>
    </>
  );
}
