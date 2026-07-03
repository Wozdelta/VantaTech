const fs = require('fs');
const path = 'c:/Users/vitor/Downloads/Site loja vantatech016/src/components/admin/AdminOrders.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldTableStart = '<div className="overflow-x-hidden lg:overflow-x-auto min-h-[380px]">';
const oldTableEnd = '        </table>\n      </div>';

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
endIndex += oldTableEnd.length;

// Extract the old table block
let tableBlock = content.substring(startIndex, endIndex);

// We need to revert the lg: classes in the table block back to standard table classes
// because now this block is ONLY rendered in 'table' mode.
tableBlock = tableBlock.replace('<table className="w-full text-left border-collapse block lg:table">', '<table className="w-full text-left border-collapse">');
tableBlock = tableBlock.replace('<thead className="hidden lg:table-header-group', '<thead className="');
tableBlock = tableBlock.replace('<tr className="lg:table-row', '<tr className="');
tableBlock = tableBlock.replace('<tbody className="block lg:table-row-group', '<tbody className="');
tableBlock = tableBlock.replaceAll('<tr className="block lg:table-row', '<tr className="');
tableBlock = tableBlock.replaceAll('block lg:table-cell ', '');
tableBlock = tableBlock.replaceAll('<span className="lg:hidden text-xs font-bold text-gray-500 uppercase mr-4">Pedido</span>', '');
tableBlock = tableBlock.replaceAll('<span className="lg:hidden text-xs font-bold text-gray-500 uppercase mr-4 mb-3 block">Produtos</span>', '');
tableBlock = tableBlock.replaceAll('<span className="lg:hidden text-xs font-bold text-gray-500 uppercase mr-4">Total</span>', '');
tableBlock = tableBlock.replaceAll('<span className="lg:hidden text-xs font-bold text-gray-500 uppercase mr-4">Status</span>', '');
tableBlock = tableBlock.replaceAll('<span className="lg:hidden text-xs font-bold text-gray-500 uppercase mr-4">Ações</span>', '');
tableBlock = tableBlock.replace('<div className="overflow-x-hidden lg:overflow-x-auto min-h-[380px]">', '<div className="overflow-x-auto min-h-[380px]">');
// Clean up messy classes left behind
tableBlock = tableBlock.replaceAll('flex justify-between items-center lg:items-start lg:justify-start', '');
tableBlock = tableBlock.replaceAll('flex justify-between items-center lg:items-start lg:justify-end', '');
tableBlock = tableBlock.replaceAll('flex justify-between items-center lg:justify-end', '');
tableBlock = tableBlock.replaceAll('lg:border-0', '');
tableBlock = tableBlock.replaceAll('lg:px-6 lg:py-4', 'px-6 py-4');
tableBlock = tableBlock.replaceAll('lg:text-right', 'text-right');
tableBlock = tableBlock.replaceAll('lg:text-left', 'text-left');
tableBlock = tableBlock.replaceAll('lg:p-0', '');
tableBlock = tableBlock.replaceAll(' p-4 "', '"');
tableBlock = tableBlock.replaceAll(' px-0 py-3 ', ' ');

const newCardsBlock = `
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50/50 dark:bg-gray-900/20 min-h-[380px]">
        {errorMsg ? (
          <div className="col-span-full text-center py-12">
            <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 inline-block font-bold">
              Erro no Supabase: {errorMsg}
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum pedido encontrado.
          </div>
        ) : (
          paginatedOrders.map((pedido) => (
            <div key={pedido.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-700 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <span className="text-sm font-black text-vanta-blue block mb-1 tracking-tight">#{pedido.numero}</span>
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(pedido.criado_em).toLocaleDateString('pt-BR')} às {new Date(pedido.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <span className={\`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider \${getStatusColor(pedido.status)}\`}>
                  {getStatusIcon(pedido.status)}
                  <span className="ml-1">{pedido.status}</span>
                </span>
              </div>
              
              {/* Body (Produtos) */}
              <div className="flex flex-col gap-3 py-1">
                {pedido.itens_pedido.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img src={item.imagem_url || '/placeholder.png'} alt={item.produto_nome} className="w-12 h-12 rounded-xl object-cover bg-gray-50 border border-gray-100 dark:border-gray-700 shadow-sm" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1">{item.produto_nome}</p>
                      <p className="text-xs text-vanta-orange font-bold bg-orange-50 dark:bg-orange-900/20 inline-block px-1.5 py-0.5 rounded">
                        {item.quantidade}x R$ {item.produto_preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer (Total + Actions) */}
              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total do Pedido</span>
                  <span className="text-lg font-black text-gray-900 dark:text-white">R$ {pedido.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex items-center gap-2 w-full">
                  {updating === pedido.id ? (
                    <div className="flex-1 px-3 py-2 flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-50 rounded-xl">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Atualizando...
                    </div>
                  ) : (
                    <select
                      value={pedido.status}
                      onChange={(e) => updateOrderStatus(pedido.id, e.target.value, pedido.status, pedido.itens_pedido, pedido.user_id, pedido.afiliado_id, pedido.total)}
                      disabled={updating === pedido.id}
                      className="flex-1 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-700 bg-gray-50 border border-gray-200 rounded-xl shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-vanta-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 transition-colors appearance-none cursor-pointer"
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
                    className="p-2.5 text-gray-400 hover:text-vanta-blue hover:bg-vanta-blue/10 rounded-xl transition-colors bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm"
                    title="Ver Detalhes do Pedido"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteOrder(pedido.id)}
                    disabled={updating === pedido.id}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm"
                    title="Excluir Pedido"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
`;

const fullReplacement = `      {viewMode === 'table' ? (
${tableBlock}
      ) : (
${newCardsBlock}
      )}`;

content = content.substring(0, startIndex) + fullReplacement + content.substring(endIndex);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated AdminOrders.tsx');
