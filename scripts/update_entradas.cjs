const fs = require('fs');
const path = 'c:/Users/vitor/Downloads/Site loja vantatech016/src/components/admin/AdminEntradas.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldTableStart = '<div className="overflow-x-hidden lg:overflow-x-auto">';
const oldTableEnd = '        </div>\n      )}';

const startIndex = content.indexOf(oldTableStart);
if (startIndex === -1) {
  console.log('Error: Could not find table start');
  process.exit(1);
}

// Find the corresponding end
let endIndex = content.indexOf(oldTableEnd, startIndex);
if (endIndex === -1) {
  console.log('Error: Could not find table end');
  process.exit(1);
}
endIndex += oldTableEnd.length - 8; // keep the closing brace intact if needed, let's just do exact string replacement

// Extract the old table block
let tableBlock = content.substring(startIndex, content.indexOf('        </div>', startIndex) + 14);

// We need to revert the lg: classes in the table block back to standard table classes
tableBlock = tableBlock.replace('<table className="w-full text-left border-collapse block lg:table">', '<table className="w-full text-left border-collapse">');
tableBlock = tableBlock.replace('<thead className="hidden lg:table-header-group">', '<thead>');
tableBlock = tableBlock.replace('<tbody className="block lg:table-row-group divide-y divide-gray-100 dark:divide-gray-700">', '<tbody className="divide-y divide-gray-100 dark:divide-gray-700">');
tableBlock = tableBlock.replaceAll('<tr key={`${item.productId}-${item.variantIndex}`} className="block lg:table-row hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors p-4 lg:p-0">', '<tr key={`${item.productId}-${item.variantIndex}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">');
tableBlock = tableBlock.replaceAll('block lg:table-cell ', '');
tableBlock = tableBlock.replaceAll('<span className="lg:hidden text-xs font-bold text-gray-500 uppercase mr-4">Aparelho</span>', '');
tableBlock = tableBlock.replaceAll('<span className="lg:hidden text-xs font-bold text-gray-500 uppercase mr-4">Detalhes</span>', '');
tableBlock = tableBlock.replaceAll('<span className="lg:hidden text-xs font-bold text-gray-500 uppercase mr-4">Venda</span>', '');
tableBlock = tableBlock.replaceAll('<span className="lg:hidden text-xs font-bold text-gray-500 uppercase mr-4">Custo</span>', '');
tableBlock = tableBlock.replaceAll('<span className="lg:hidden text-xs font-bold text-gray-500 uppercase mr-4">Lucro</span>', '');
tableBlock = tableBlock.replace('<div className="overflow-x-hidden lg:overflow-x-auto">', '<div className="overflow-x-auto">');

// Clean up messy classes left behind
tableBlock = tableBlock.replaceAll('flex justify-between items-center lg:items-start lg:justify-start', '');
tableBlock = tableBlock.replaceAll('flex justify-between items-center lg:items-start lg:justify-end', '');
tableBlock = tableBlock.replaceAll('flex justify-between items-center lg:justify-end', '');
tableBlock = tableBlock.replaceAll('lg:border-0', '');
tableBlock = tableBlock.replaceAll('lg:px-6 lg:py-4', 'px-6 py-4');
tableBlock = tableBlock.replaceAll('lg:text-right', 'text-right');
tableBlock = tableBlock.replaceAll('lg:text-left', 'text-left');
tableBlock = tableBlock.replaceAll('lg:w-full', 'w-full');
tableBlock = tableBlock.replaceAll(' px-0 py-3 ', ' ');

const newCardsBlock = `
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
`;

const fullReplacement = `      {viewMode === 'table' ? (
${tableBlock}
      ) : (
${newCardsBlock}
      )}`;

content = content.substring(0, startIndex) + fullReplacement + content.substring(startIndex + tableBlock.length);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated AdminEntradas.tsx');
