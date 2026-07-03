const fs = require('fs');

// --- Fix AdminOrders.tsx ---
let ordersPath = 'c:/Users/vitor/Downloads/Site loja vantatech016/src/components/admin/AdminOrders.tsx';
let ordersContent = fs.readFileSync(ordersPath, 'utf8');

// 1. Hide filter bar on PC
ordersContent = ordersContent.replace(
  '<div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">',
  '<div className="flex lg:hidden flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">'
);

// 2. Fix layout wrappers
const viewModeTableIndex = ordersContent.indexOf('{viewMode === \'table\' ? (');
if (viewModeTableIndex !== -1) {
  // We need to replace `{viewMode === 'table' ? ( ... ) : ( ... )}` with the correct responsive wrappers.
  const tableBlockStart = ordersContent.indexOf('<div className="overflow-x-auto min-h-[380px]">', viewModeTableIndex);
  const cardsBlockStart = ordersContent.indexOf('<div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50/50 dark:bg-gray-900/20 min-h-[380px]">', tableBlockStart);
  const endOfCards = ordersContent.indexOf('      )}', cardsBlockStart);
  
  if (tableBlockStart !== -1 && cardsBlockStart !== -1 && endOfCards !== -1) {
    let tableBlock = ordersContent.substring(tableBlockStart, ordersContent.lastIndexOf('      ) : (', cardsBlockStart));
    let cardsBlock = ordersContent.substring(cardsBlockStart, endOfCards);

    // Make table block always visible on lg
    tableBlock = tableBlock.replace(
      '<div className="overflow-x-auto min-h-[380px]">', 
      '<div className={`overflow-x-auto min-h-[380px] ${viewMode === \'table\' ? \'block\' : \'hidden\'} lg:block`}>'
    );
    
    // Make cards block hidden on lg
    cardsBlock = cardsBlock.replace(
      '<div className="p-4 grid',
      '<div className={`p-4 grid ${viewMode === \'cards\' ? \'block\' : \'hidden\'} lg:hidden'
    );

    // Restore table headers for PC
    const oldThead = `<thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <th className="px-6 py-4 relative whitespace-nowrap">
                  <span className="lg:hidden">Pedido / Data</span>
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === 'data' ? null : 'data')}
                    className="hidden lg:flex items-center gap-1 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 uppercase tracking-wider transition-colors focus:outline-none"
                  >
                    Pedido / Data
                    {filterData !== 'mais_recente' && <span className="w-1.5 h-1.5 rounded-full bg-vanta-blue ml-0.5"></span>}
                    <import-lucide-chevron-down className={\`w-3.5 h-3.5 ml-0.5 transition-transform \${openDropdown === 'data' ? 'rotate-180' : ''}\`} />
                  </button>
                  {openDropdown === 'data' && (
                    <div className="hidden lg:block">
                      <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}></div>
                      <div className="absolute top-full left-4 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50 overflow-hidden text-sm font-normal normal-case">
                        <button onClick={() => { setFilterData('mais_recente'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Mais Recente</span>
                          {filterData === 'mais_recente' && <import-lucide-check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterData('mais_antigo'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Mais Antigo</span>
                          {filterData === 'mais_antigo' && <import-lucide-check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                      </div>
                    </div>
                  )}
              </th>
              <th className="px-6 py-4 whitespace-nowrap">Produtos</th>
              <th className="px-6 py-4 relative whitespace-nowrap">
                  <span className="lg:hidden">Total</span>
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === 'total' ? null : 'total')}
                    className="hidden lg:flex items-center gap-1 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 uppercase tracking-wider transition-colors focus:outline-none"
                  >
                    Total
                    {filterTotal && <span className="w-1.5 h-1.5 rounded-full bg-vanta-blue ml-0.5"></span>}
                    <import-lucide-chevron-down className={\`w-3.5 h-3.5 ml-0.5 transition-transform \${openDropdown === 'total' ? 'rotate-180' : ''}\`} />
                  </button>
                  {openDropdown === 'total' && (
                    <div className="hidden lg:block">
                      <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}></div>
                      <div className="absolute top-full left-4 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50 overflow-hidden text-sm font-normal normal-case">
                        <button onClick={() => { setFilterTotal(''); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Padrão</span>
                          {!filterTotal && <import-lucide-check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterTotal('maior'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Maior Valor</span>
                          {filterTotal === 'maior' && <import-lucide-check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterTotal('menor'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Menor Valor</span>
                          {filterTotal === 'menor' && <import-lucide-check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                      </div>
                    </div>
                  )}
              </th>
              <th className="px-6 py-4 relative whitespace-nowrap">
                  <span className="lg:hidden">Status</span>
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                    className="hidden lg:flex items-center gap-1 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 uppercase tracking-wider transition-colors focus:outline-none"
                  >
                    Status
                    {filterStatus && <span className="w-1.5 h-1.5 rounded-full bg-vanta-blue ml-0.5"></span>}
                    <import-lucide-chevron-down className={\`w-3.5 h-3.5 ml-0.5 transition-transform \${openDropdown === 'status' ? 'rotate-180' : ''}\`} />
                  </button>
                  {openDropdown === 'status' && (
                    <div className="hidden lg:block">
                      <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}></div>
                      <div className="absolute top-full left-4 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50 overflow-hidden text-sm font-normal normal-case">
                        <button onClick={() => { setFilterStatus(''); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Todos</span>
                          {!filterStatus && <import-lucide-check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterStatus('pendente'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Pendente</span>
                          {filterStatus === 'pendente' && <import-lucide-check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterStatus('pago'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Pago</span>
                          {filterStatus === 'pago' && <import-lucide-check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterStatus('enviado'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Enviado</span>
                          {filterStatus === 'enviado' && <import-lucide-check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterStatus('entregue'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Entregue</span>
                          {filterStatus === 'entregue' && <import-lucide-check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterStatus('cancelado'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Cancelado</span>
                          {filterStatus === 'cancelado' && <import-lucide-check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                      </div>
                    </div>
                  )}
              </th>
              <th className="px-6 py-4 text-right whitespace-nowrap">Ações</th>
            </tr>
          </thead>`.replace(/import-lucide-/g, '');

    const theadStart = tableBlock.indexOf('<thead');
    const theadEnd = tableBlock.indexOf('</thead>') + 8;
    tableBlock = tableBlock.substring(0, theadStart) + oldThead + tableBlock.substring(theadEnd);

    const newContent = ordersContent.substring(0, viewModeTableIndex) + '\n      <>\n' + tableBlock + '\n' + cardsBlock + '\n      </>\n' + ordersContent.substring(endOfCards + 8);
    fs.writeFileSync(ordersPath, newContent, 'utf8');
  }
}

// --- Fix AdminEntradas.tsx ---
let entradasPath = 'c:/Users/vitor/Downloads/Site loja vantatech016/src/components/admin/AdminEntradas.tsx';
let entradasContent = fs.readFileSync(entradasPath, 'utf8');

const entradasViewModeTableIndex = entradasContent.indexOf(') : viewMode === \'table\' ? (');
if (entradasViewModeTableIndex !== -1) {
  const tableBlockStart = entradasContent.indexOf('<div className="overflow-x-auto">', entradasViewModeTableIndex);
  const cardsBlockStart = entradasContent.indexOf('<div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50/50 dark:bg-gray-900/20">', tableBlockStart);
  const endOfCards = entradasContent.indexOf('      )}', cardsBlockStart);
  
  if (tableBlockStart !== -1 && cardsBlockStart !== -1 && endOfCards !== -1) {
    let tableBlock = entradasContent.substring(tableBlockStart, entradasContent.lastIndexOf('      ) : (', cardsBlockStart));
    let cardsBlock = entradasContent.substring(cardsBlockStart, endOfCards);

    // Make table block always visible on lg
    tableBlock = tableBlock.replace(
      '<div className="overflow-x-auto">', 
      '<div className={`overflow-x-auto ${viewMode === \'table\' ? \'block\' : \'hidden\'} lg:block`}>'
    );
    
    // Make cards block hidden on lg
    cardsBlock = cardsBlock.replace(
      '<div className="p-4 grid',
      '<div className={`p-4 grid ${viewMode === \'cards\' ? \'block\' : \'hidden\'} lg:hidden'
    );

    const newContent = entradasContent.substring(0, entradasViewModeTableIndex) + ') : (\n      <>\n' + tableBlock + '\n' + cardsBlock + '\n      </>\n' + entradasContent.substring(endOfCards + 8);
    fs.writeFileSync(entradasPath, newContent, 'utf8');
  }
}

console.log('Fixed responsive layouts for AdminOrders and AdminEntradas');
