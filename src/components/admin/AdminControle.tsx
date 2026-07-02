import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { ShieldCheck, Save, Loader2, Store, ShoppingBag, Ticket, Award, UserCircle, Globe, Lock, PackagePlus, HelpCircle } from 'lucide-react';
import { useAlert } from '../../contexts/AlertContext';

export default function AdminControle() {
  const { settings, updateSettings } = useSettings();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  
  const [localSettings, setLocalSettings] = useState({
    acesso_loja: settings.acesso_loja,
    acesso_pedidos: settings.acesso_pedidos,
    acesso_cupons: settings.acesso_cupons,
    acesso_fidelidade: settings.acesso_fidelidade,
    acesso_perfil: settings.acesso_perfil,
    acesso_encomendas: settings.acesso_encomendas,
    acesso_ajuda: settings.acesso_ajuda,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings(localSettings);
      showAlert({
        title: 'Sucesso',
        message: 'Regras de acesso atualizadas!',
        type: 'success'
      });
    } catch (error) {
      showAlert({
        title: 'Erro',
        message: 'Não foi possível salvar as configurações.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const SegmentedControl = ({ 
    value, 
    onChange 
  }: { 
    value: string, 
    onChange: (val: any) => void 
  }) => (
    <div className="relative flex items-center bg-gray-100 dark:bg-gray-900/80 p-1 rounded-xl mt-5 w-full">
      <div 
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-transform duration-300 ease-in-out ${
          value === 'admin' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'
        }`}
      />
      <button
        onClick={() => onChange('todos')}
        className={`relative z-10 flex-1 py-2 px-2 text-[13px] font-bold rounded-lg transition-colors duration-300 flex items-center justify-center gap-1.5 whitespace-nowrap ${
          value === 'todos' 
            ? 'text-gray-900 dark:text-white' 
            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        <Globe className={`w-3.5 h-3.5 ${value === 'todos' ? 'text-green-500' : 'opacity-60'}`} />
        Público
      </button>
      <button
        onClick={() => onChange('admin')}
        className={`relative z-10 flex-1 py-2 px-2 text-[13px] font-bold rounded-lg transition-colors duration-300 flex items-center justify-center gap-1.5 whitespace-nowrap ${
          value === 'admin' 
            ? 'text-gray-900 dark:text-white' 
            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        <Lock className={`w-3.5 h-3.5 ${value === 'admin' ? 'text-red-500' : 'opacity-60'}`} />
        Privado
      </button>
    </div>
  );

  const ControlCard = ({ icon: Icon, title, description, value, onChange, colorClass, bgClass }: any) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl ${bgClass} ${colorClass} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
            <Icon className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{description}</p>
          </div>
        </div>
      </div>
      <SegmentedControl value={value} onChange={onChange} />
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-vanta-blue" />
            </div>
            Permissões de Acesso
          </h2>
          <p className="text-gray-500 text-sm mt-2 max-w-2xl leading-relaxed">
            Configure quem tem acesso a cada módulo do sistema. Módulos definidos como <span className="font-bold text-gray-700 dark:text-gray-300">"Público"</span> ficam visíveis para todos os clientes, enquanto módulos em <span className="font-bold text-gray-700 dark:text-gray-300">"Privado"</span> são visíveis apenas para administradores.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-vanta-blue hover:bg-vanta-darkblue text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Salvar Permissões
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <ControlCard 
          icon={Store}
          title="Loja e Vitrine"
          description="Página inicial e catálogo"
          colorClass="text-purple-600 dark:text-purple-400"
          bgClass="bg-purple-100 dark:bg-purple-900/30"
          value={localSettings.acesso_loja}
          onChange={(val: any) => setLocalSettings(prev => ({ ...prev, acesso_loja: val }))}
        />

        <ControlCard 
          icon={ShoppingBag}
          title="Meus Pedidos"
          description="Histórico de compras"
          colorClass="text-green-600 dark:text-green-400"
          bgClass="bg-green-100 dark:bg-green-900/30"
          value={localSettings.acesso_pedidos}
          onChange={(val: any) => setLocalSettings(prev => ({ ...prev, acesso_pedidos: val }))}
        />

        <ControlCard 
          icon={Ticket}
          title="Meus Cupons"
          description="Carteira de descontos"
          colorClass="text-blue-600 dark:text-blue-400"
          bgClass="bg-blue-100 dark:bg-blue-900/30"
          value={localSettings.acesso_cupons}
          onChange={(val: any) => setLocalSettings(prev => ({ ...prev, acesso_cupons: val }))}
        />

        <ControlCard 
          icon={Award}
          title="Clube Vanta"
          description="Programa de fidelidade"
          colorClass="text-orange-600 dark:text-orange-400"
          bgClass="bg-orange-100 dark:bg-orange-900/30"
          value={localSettings.acesso_fidelidade}
          onChange={(val: any) => setLocalSettings(prev => ({ ...prev, acesso_fidelidade: val }))}
        />

        <ControlCard 
          icon={UserCircle}
          title="Configurar Perfil"
          description="Edição de dados e endereço"
          colorClass="text-pink-600 dark:text-pink-400"
          bgClass="bg-pink-100 dark:bg-pink-900/30"
          value={localSettings.acesso_perfil}
          onChange={(val: any) => setLocalSettings(prev => ({ ...prev, acesso_perfil: val }))}
        />

        <ControlCard 
          icon={PackagePlus}
          title="Encomendar"
          description="Página de encomenda de aparelhos"
          colorClass="text-yellow-600 dark:text-yellow-400"
          bgClass="bg-yellow-100 dark:bg-yellow-900/30"
          value={localSettings.acesso_encomendas}
          onChange={(val: any) => setLocalSettings(prev => ({ ...prev, acesso_encomendas: val }))}
        />

        <ControlCard 
          icon={HelpCircle}
          title="Central de Ajuda"
          description="Suporte e contato"
          colorClass="text-cyan-600 dark:text-cyan-400"
          bgClass="bg-cyan-100 dark:bg-cyan-900/30"
          value={localSettings.acesso_ajuda}
          onChange={(val: any) => setLocalSettings(prev => ({ ...prev, acesso_ajuda: val }))}
        />
      </div>
    </div>
  );
}
