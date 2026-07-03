const fs = require('fs');
const path = 'c:/Users/vitor/Downloads/Site loja vantatech016/src/components/admin/AdminOrders.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Swap tooltips and icons in the toggle buttons
content = content.replace('title="Visão em Cards"', 'title="Visão Detalhada (Cards)"');
content = content.replace('title="Visão em Tabela"', 'title="Visão Minimalista (Tabela)"');
content = content.replace('<LayoutGrid className="w-5 h-5" />', '<List className="w-5 h-5" />');
content = content.replace('<List className="w-5 h-5" />', '<LayoutGrid className="w-5 h-5" />'); // wait, this might swap back. Let's do it safely.

// 2. Add Filter bar under search bar
const searchBarEnd = `        </div>
      </div>

      {viewMode === 'table' ? (`;

const newFilters = `        </div>

        {/* Filtros em dropdown para Mobile e Desktop */}
        <div className="flex flex-wrap gap-2 mt-4">
          <select
            value={filterData}
            onChange={(e) => setFilterData(e.target.value)}
            className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-vanta-blue/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white cursor-pointer"
          >
            <option value="mais_recente">Mais Recente</option>
            <option value="mais_antigo">Mais Antigo</option>
          </select>
          
          <select
            value={filterTotal}
            onChange={(e) => setFilterTotal(e.target.value)}
            className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-vanta-blue/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white cursor-pointer"
          >
            <option value="">Total: Padrão</option>
            <option value="maior">Maior Valor</option>
            <option value="menor">Menor Valor</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-vanta-blue/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white cursor-pointer"
          >
            <option value="">Status: Todos</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="enviado">Enviado</option>
            <option value="entregue">Entregue</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {viewMode === 'table' ? (`;

content = content.replace(searchBarEnd, newFilters);

// 3. Clean up the table block (remove inline filters and fix classes)
// Let's replace the whole table block with a clean string
const tableStartIdx = content.indexOf('<div className="overflow-x-auto min-h-[380px]">');
const tableEndIdx = content.indexOf('      ) : (', tableStartIdx);
if (tableStartIdx !== -1 && tableEndIdx !== -1) {
  const cleanTableBlock = `
      <div className="overflow-x-auto min-h-[380px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <th className="px-6 py-4 whitespace-nowrap">Pedido / Data</th>
              <th className="px-6 py-4 whitespace-nowrap">Produtos</th>
              <th className="px-6 py-4 whitespace-nowrap">Total</th>
              <th className="px-6 py-4 whitespace-nowrap">Status</th>
              <th className="px-6 py-4 text-right whitespace-nowrap">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {errorMsg ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 inline-block font-bold">
                    Erro no Supabase: {errorMsg}
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-50 dark:border-gray-800 align-top">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-vanta-blue mb-1">
                        #{pedido.numero}
                      </span>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {new Date(pedido.criado_em).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(pedido.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 align-top min-w-[250px]">
                    <div className="flex flex-col gap-2">
                      {pedido.itens_pedido.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <img src={item.imagem_url || '/placeholder.png'} alt={item.produto_nome} className="w-8 h-8 rounded object-cover bg-gray-100" />
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white whitespace-normal line-clamp-2">{item.produto_nome}</p>
                            <p className="text-xs text-gray-500">{item.quantidade}x R$ {item.produto_preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 whitespace-nowrap align-top">
                    <span>R$ {pedido.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-50 dark:border-gray-800 align-top">
                    <span className={\`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold \${getStatusColor(pedido.status)}\`}>
                      {getStatusIcon(pedido.status)}
                      {pedido.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap align-top">
                    <div className="flex items-center justify-end gap-2">
                      {updating === pedido.id ? (
                        <div className="px-3 py-1.5 flex items-center justify-center text-sm font-medium text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Atualizando...
                        </div>
                      ) : (
                        <select
                          value={pedido.status}
                          onChange={(e) => updateOrderStatus(pedido.id, e.target.value, pedido.status, pedido.itens_pedido, pedido.user_id, pedido.afiliado_id, pedido.total)}
                          disabled={updating === pedido.id}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-vanta-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 transition-colors"
                        >
                          {['Pendente', 'Pago', 'Enviado', 'Entregue', 'Cancelado', 'Cancelado pelo cliente'].map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      <button
                        onClick={() => setSelectedOrder(pedido)}
                        className="p-1.5 text-gray-400 hover:text-vanta-blue hover:bg-vanta-blue/10 rounded-lg transition-colors"
                        title="Ver Detalhes do Pedido"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteOrder(pedido.id)}
                        disabled={updating === pedido.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Excluir Pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
`;
  content = content.substring(0, tableStartIdx) + cleanTableBlock + content.substring(tableEndIdx);
}

// 4. Safely swap the toggle icons and titles
const toggleBlockStart = content.indexOf('<div className="lg:hidden flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-xl">');
const toggleBlockEnd = content.indexOf('</div>', toggleBlockStart + 80) + 6;
if (toggleBlockStart !== -1) {
  let toggleBlock = content.substring(toggleBlockStart, toggleBlockEnd);
  // Re-write the toggle buttons to accurately reflect the user's intent:
  // "Cards" -> Detailed View (List icon)
  // "Table" -> Minimalist View (Grid or Table icon)
  toggleBlock = `        <div className="lg:hidden flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-xl">
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

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated AdminOrders.tsx filters and table mode');
