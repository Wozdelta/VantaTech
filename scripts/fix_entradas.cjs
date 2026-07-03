const fs = require('fs');
const path = 'c:/Users/vitor/Downloads/Site loja vantatech016/src/components/admin/AdminEntradas.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Swap tooltips and icons in the toggle buttons
content = content.replace('title="Visão em Cards"', 'title="Visão Detalhada (Cards)"');
content = content.replace('title="Visão em Tabela"', 'title="Visão Minimalista (Tabela)"');
content = content.replace('<LayoutGrid className="w-5 h-5" />', '<List className="w-5 h-5" />');
content = content.replace('<List className="w-5 h-5" />', '<LayoutGrid className="w-5 h-5" />');

// Clean toggle block properly (force the right icons/tooltips to avoid double replace issues)
const toggleBlockStart = content.indexOf('<div className="lg:hidden flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-xl shrink-0">');
if (toggleBlockStart !== -1) {
  const toggleBlockEnd = content.indexOf('</div>', toggleBlockStart + 80) + 6;
  const toggleBlock = `        <div className="lg:hidden flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={\`flex items-center justify-center px-3 py-2 rounded-lg transition-all \${viewMode === 'table' ? 'bg-white dark:bg-gray-800 text-vanta-blue shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}\`}
            title="Visão Minimalista (Tabela)"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={\`flex items-center justify-center px-3 py-2 rounded-lg transition-all \${viewMode === 'cards' ? 'bg-white dark:bg-gray-800 text-vanta-blue shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}\`}
            title="Visão Detalhada (Cards)"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>`;
  content = content.substring(0, toggleBlockStart) + toggleBlock + content.substring(toggleBlockEnd);
}


// 2. Replace the table block
const tableStartIdx = content.indexOf('<div className="overflow-x-hidden lg:overflow-x-auto">');
const tableEndIdx = content.indexOf('        </div>', tableStartIdx) + 14;

if (tableStartIdx !== -1) {
  const cleanTableBlock = `
      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Aparelho</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Detalhes</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Valor Venda</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Valor Pago (Custo)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Lucro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedItems.map((item) => (
                <tr key={\`\${item.productId}-\${item.variantIndex}\`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-50 dark:border-gray-800 align-top">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{item.nome}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-50 dark:border-gray-800 align-top">
                    <div className="flex flex-col text-left">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Cor: <span className="font-medium">{item.cor}</span></span>
                      {(item.armazenamento || item.bateria) && (
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                          {item.armazenamento && <div>Capacidade: <span className="font-medium">{item.armazenamento}</span></div>}
                          {item.bateria && <div>Saúde Bateria: <span className="font-medium">{item.bateria}%</span></div>}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 whitespace-nowrap text-right align-top">
                    R$ {item.precoVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-50 dark:border-gray-800 align-top">
                    <div className="relative w-full max-w-[150px]">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.precoCusto || ''}
                        onChange={(e) => handleCustoChange(item.productId, item.variantIndex, e.target.value)}
                        disabled={item.isSaving}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-vanta-blue focus:ring-1 focus:ring-vanta-blue transition-colors disabled:opacity-50"
                        placeholder="0.00"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap border-b border-gray-50 dark:border-gray-800 align-top">
                    <div className="flex flex-col items-end gap-2">
                      <span className={\`text-sm font-bold \${item.lucro > 0 ? 'text-green-500 dark:text-green-400' : 'text-gray-500'}\`}>
                        R$ {item.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {item.isSaving && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Salvando...
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50/50 dark:bg-gray-900/20">
          {paginatedItems.map((item) => (
            <div key={\`\${item.productId}-\${item.variantIndex}\`} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-700 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-3">
                <span className="text-sm font-black text-gray-900 dark:text-white leading-tight flex-1 pr-2">{item.nome}</span>
                <span className="inline-flex flex-col text-right shrink-0">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Lucro</span>
                  <span className={\`text-sm font-black \${item.lucro > 0 ? 'text-green-500 dark:text-green-400' : 'text-gray-400'}\`}>
                    R$ {item.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </span>
              </div>

              {/* Body */}
              <div className="flex flex-col gap-1.5 py-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-medium">Cor</span>
                  <span className="font-bold text-gray-900 dark:text-gray-200">{item.cor}</span>
                </div>
                {item.armazenamento && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">Capacidade</span>
                    <span className="font-bold text-gray-900 dark:text-gray-200">{item.armazenamento}</span>
                  </div>
                )}
                {item.bateria && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">Saúde Bateria</span>
                    <span className="font-bold text-gray-900 dark:text-gray-200">{item.bateria}%</span>
                  </div>
                )}
              </div>

              {/* Footer (Preços) */}
              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Valor Venda</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">R$ {item.precoVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Custo (Valor Pago)</label>
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.precoCusto || ''}
                      onChange={(e) => handleCustoChange(item.productId, item.variantIndex, e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold focus:outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all shadow-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}`;

  content = content.substring(0, tableStartIdx) + cleanTableBlock + content.substring(tableEndIdx);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated AdminEntradas.tsx filters and table mode');
