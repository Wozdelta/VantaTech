import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, ShoppingCart, User, Menu, X, Smartphone, Trash2, Moon, Sun, Settings, Package, Ticket, Crown, LayoutDashboard, HelpCircle, LogOut, Lock } from 'lucide-react';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa6';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabase';
import { useAlert } from '@/contexts/AlertContext';
import { useSettings } from '@/contexts/SettingsContext';
import CartDrawer from './CartDrawer';
import SearchBar from './SearchBar';

export default function Navbar() {
  const { showAlert } = useAlert();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const navRef = useRef<HTMLElement>(null);
  const { user, perfil, signOut } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const { settings } = useSettings();

  const showFidelidade = settings.acesso_fidelidade === 'todos' || perfil?.cargo === 'Admin';
  const showCupons = settings.acesso_cupons === 'todos' || perfil?.cargo === 'Admin';
  const showEncomendas = settings.acesso_encomendas === 'todos' || perfil?.cargo === 'Admin';
  const showAjuda = settings.acesso_ajuda === 'todos' || perfil?.cargo === 'Admin';
  const showPedidos = settings.acesso_pedidos === 'todos' || perfil?.cargo === 'Admin';

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categorias_menu')
        .select('nome')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      if (data) {
        setCategories(data.map(c => c.nome));
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setCategories([]);
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  type Notificacao = {
    id: string;
    titulo: string;
    mensagem: string;
    lida: boolean;
    criado_em: string;
  };

  const [notifications, setNotifications] = useState<Notificacao[]>([]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user]);

  async function fetchNotifications() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('usuario_id', user.id)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      if (data) {
        setNotifications(data as Notificacao[]);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  }

  async function markAsRead(id: string) {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id)
        .eq('usuario_id', user?.id);

      if (error) throw error;
      
      // Atualiza localmente para não precisar de outro fetch
      setNotifications(prev => 
        prev.map(notif => notif.id === id ? { ...notif, lida: true } : notif)
      );
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }

  async function clearAllNotifications() {
    if (!user) return;
    try {
      // Como a tabela tem RLS, isso só vai apagar as notificações DO USUÁRIO LOGADO.
      const { error } = await supabase
        .from('notificacoes')
        .delete()
        .eq('usuario_id', user.id);

      if (error) throw error;

      // Limpa no visual da tela
      setNotifications([]);
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
      showAlert({
        title: 'Erro',
        message: 'Não foi possível limpar as notificações.',
        type: 'error'
      });
    }
  }

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  const closeMenus = () => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  };

  const NotificationsContent = (
    <>
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
         <h4 className="font-bold text-gray-800 dark:text-white text-lg">Suas Notificações</h4>
         <div className="flex items-center gap-2">
           {notifications.length > 0 && (
             <button 
               onClick={clearAllNotifications} 
               className="text-[11px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider"
               title="Limpar todas as notificações"
             >
               Limpar Todas
             </button>
           )}
           {unreadCount > 0 && (
             <span className="text-[11px] font-bold bg-vanta-orange text-white px-2.5 py-1 rounded-full whitespace-nowrap">
               {unreadCount} nova{unreadCount !== 1 && 's'}
             </span>
           )}
         </div>
      </div>
      
      {!user ? (
        <div className="py-8 text-center flex flex-col items-center">
          <Bell className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Faça login para ver seus avisos e novidades.</p>
          <Link to="/login" onClick={() => setActiveDropdown(null)} className="px-6 py-2.5 bg-vanta-blue text-white text-sm font-bold rounded-xl hover:bg-vanta-darkblue transition-all shadow-md hover:shadow-lg">
            Fazer Login
          </Link>
        </div>
      ) : (
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar text-left">
          {notifications.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center">
              <Bell className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Você não tem novas notificações.</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`relative overflow-hidden p-4 rounded-xl border transition-all duration-300 ${
                  notif.lida 
                    ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50 opacity-75' 
                    : 'bg-white dark:bg-gray-900 border-vanta-blue/30 shadow-sm hover:shadow-md'
                }`}
              >
                {!notif.lida && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-vanta-blue"></div>
                )}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h5 className={`font-bold text-sm mb-1 ${notif.lida ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                      {notif.titulo}
                    </h5>
                    <p className={`text-sm leading-snug mb-2 ${notif.lida ? 'text-gray-500 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
                      {notif.mensagem}
                    </p>
                    <div className="flex items-center text-[11px] font-medium text-gray-400">
                      <span>{new Date(notif.criado_em).toLocaleDateString('pt-BR')} às {new Date(notif.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  
                  {!notif.lida && (
                    <button 
                      onClick={() => markAsRead(notif.id)}
                      className="shrink-0 group flex items-center justify-center p-2 rounded-lg bg-blue-50 text-vanta-blue hover:bg-vanta-blue hover:text-white dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-vanta-blue dark:hover:text-white transition-all duration-300"
                      title="Marcar como lida"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );

  const UserContent = (
    <div className="py-2">
      {user ? (
        <div className="px-4 pb-4 mb-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-vanta-blue to-blue-400 p-[2px] shrink-0">
            <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center overflow-hidden">
              {perfil?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                <img src={perfil?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-gray-400" />
              )}
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
              Olá, {perfil?.nome_completo?.split(' ')[0] || user.user_metadata?.nome_completo?.split(' ')[0] || user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.name?.split(' ')[0] || 'Usuário'}
            </p>
            {perfil?.cargo === 'Admin' ? (
              <span className="inline-block mt-0.5 px-2 py-0.5 bg-vanta-orange/10 text-vanta-orange text-[10px] font-bold rounded-md uppercase tracking-wider">
                Admin
              </span>
            ) : (
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="px-4 pb-4 mb-2 border-b border-gray-100 dark:border-gray-800">
          <Link 
            to="/login" 
            onClick={() => closeMenus()}
            className="flex items-center justify-center w-full py-2.5 bg-vanta-blue text-white text-sm font-bold rounded-xl hover:bg-vanta-darkblue transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            Fazer Login
          </Link>
        </div>
      )}

      <div className="flex flex-col px-2">
        {user && (
          <>
            <Link to="/perfil" onClick={() => closeMenus()} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-vanta-blue rounded-xl transition-colors font-medium group">
              <Settings className="w-4 h-4 text-gray-400 group-hover:text-vanta-blue transition-colors" />
              Configurar Perfil
            </Link>
        {showPedidos ? (
          <Link to="/pedidos" onClick={() => closeMenus()} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-vanta-blue rounded-xl transition-colors font-medium group">
            <Package className="w-4 h-4 text-gray-400 group-hover:text-vanta-blue transition-colors" />
            Meus Pedidos
          </Link>
        ) : (
          <div className="flex items-center justify-between px-3 py-2.5 text-sm text-gray-400 dark:text-gray-600 rounded-xl font-medium cursor-not-allowed select-none">
            <div className="flex items-center gap-3"><Package className="w-4 h-4 opacity-50" /> Meus Pedidos</div>
            <Lock className="w-3 h-3 opacity-50" />
          </div>
        )}
        
        {showCupons ? (
          <Link to="/cupons" onClick={() => closeMenus()} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-vanta-blue rounded-xl transition-colors font-medium group">
            <Ticket className="w-4 h-4 text-gray-400 group-hover:text-vanta-blue transition-colors" />
            Meus Cupons
          </Link>
        ) : (
          <div className="flex items-center justify-between px-3 py-2.5 text-sm text-gray-400 dark:text-gray-600 rounded-xl font-medium cursor-not-allowed select-none">
            <div className="flex items-center gap-3"><Ticket className="w-4 h-4 opacity-50" /> Meus Cupons</div>
            <Lock className="w-3 h-3 opacity-50" />
          </div>
        )}

        {showFidelidade ? (
          <Link to="/fidelidade" onClick={() => closeMenus()} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-vanta-orange rounded-xl transition-colors font-medium group">
            <Crown className="w-4 h-4 text-gray-400 group-hover:text-vanta-orange transition-colors" />
            Clube Vanta
          </Link>
        ) : (
          <div className="flex items-center justify-between px-3 py-2.5 text-sm text-gray-400 dark:text-gray-600 rounded-xl font-medium cursor-not-allowed select-none">
            <div className="flex items-center gap-3"><Crown className="w-4 h-4 opacity-50" /> Clube Vanta</div>
            <Lock className="w-3 h-3 opacity-50" />
          </div>
        )}
        
        {showEncomendas ? (
          <Link to="/encomendar" onClick={() => closeMenus()} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-vanta-blue rounded-xl transition-colors font-medium group">
            <Smartphone className="w-4 h-4 text-gray-400 group-hover:text-vanta-blue transition-colors" />
            Encomendar um Aparelho
          </Link>
        ) : (
          <div className="flex items-center justify-between px-3 py-2.5 text-sm text-gray-400 dark:text-gray-600 rounded-xl font-medium cursor-not-allowed select-none">
            <div className="flex items-center gap-3"><Smartphone className="w-4 h-4 opacity-50" /> Encomendar um Aparelho</div>
            <Lock className="w-3 h-3 opacity-50" />
          </div>
        )}
        </>
        )}
        
        {perfil?.cargo === 'Admin' && (
          <Link to="/admin" onClick={() => closeMenus()} className="flex items-center gap-3 px-3 py-2.5 text-sm text-vanta-orange hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-colors font-semibold mt-1 group">
            <LayoutDashboard className="w-4 h-4 text-vanta-orange/70 group-hover:text-vanta-orange transition-colors" />
            Dashboard
          </Link>
        )}
        
        {showAjuda ? (
          <Link to="/ajuda" onClick={() => closeMenus()} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-vanta-blue rounded-xl transition-colors font-medium group">
            <HelpCircle className="w-4 h-4 text-gray-400 group-hover:text-vanta-blue transition-colors" />
            Ajuda
          </Link>
        ) : (
          <div className="flex items-center justify-between px-3 py-2.5 text-sm text-gray-400 dark:text-gray-600 rounded-xl font-medium cursor-not-allowed select-none">
            <div className="flex items-center gap-3"><HelpCircle className="w-4 h-4 opacity-50" /> Ajuda</div>
            <Lock className="w-3 h-3 opacity-50" />
          </div>
        )}

        {user && (
          <button 
            onClick={() => {
              signOut();
              closeMenus();
            }}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-semibold mt-1 group text-left"
          >
            <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-500 transition-colors" />
            Sair da conta
          </button>
        )}
      </div>

      <div className="mt-2 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center">
         <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Contato</p>
         <div className="flex items-center justify-center gap-6 w-full">
           <a href="https://wa.me/5516997700430" target="_blank" rel="noopener noreferrer" className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-full transition-colors" title="WhatsApp">
              <FaWhatsapp className="w-6 h-6" />
           </a>
           <a href="https://www.instagram.com/vantatech016?igsh=aThuOGVvemVtZmcz&utm_source=qr" target="_blank" rel="noopener noreferrer" className="p-2 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/30 rounded-full transition-colors" title="Instagram">
              <FaInstagram className="w-6 h-6" />
           </a>
         </div>
      </div>
    </div>
  );

  const DarkModeToggle = (
    <button 
      onClick={() => setIsDark(!isDark)}
      className="flex items-center justify-center w-10 h-10 p-2 text-gray-600 dark:text-gray-300 hover:text-vanta-blue dark:hover:text-vanta-blue transition-colors group relative rounded-full"
      title={isDark ? "Modo Claro" : "Modo Escuro"}
    >
      <Sun className={cn(
        "absolute w-6 h-6 transition-all duration-500 ease-out",
        isDark ? "rotate-0 scale-100 opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(29,142,255,0.4)]" : "-rotate-90 scale-0 opacity-0"
      )} />
      <Moon className={cn(
        "absolute w-6 h-6 transition-all duration-500 ease-out",
        !isDark ? "rotate-0 scale-100 opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(29,142,255,0.4)]" : "rotate-90 scale-0 opacity-0"
      )} />
    </button>
  );

  return (
    <header ref={navRef} className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 shadow-soft transition-all duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navbar */}
        <div className="flex items-center justify-between h-[75px]">
          {/* Logo */}
          <Link to="/" className="flex items-center group shrink-0 mr-2 md:mr-0">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-vanta-darkblue dark:text-white tracking-tight">
              Vanta<span className="text-vanta-orange">Tech</span>
            </span>
          </Link>

          {/* Search Bar */}
          <SearchBar className="flex-1 max-w-2xl mx-1 sm:mx-4 md:mx-8" />

          {/* Actions */}
          <div className="hidden md:flex items-center gap-6 text-gray-600 dark:text-gray-300">
            {DarkModeToggle}
            <ActionIcon 
              icon={Bell} 
              label="Notificações" 
              badge={unreadCount}
              isOpen={activeDropdown === 'notificacoes'}
              onClick={() => toggleDropdown('notificacoes')}
            >
              {NotificationsContent}
            </ActionIcon>

            <ActionIcon 
              icon={ShoppingCart} 
              label="Carrinho" 
              badge={cartCount}
              onClick={() => setIsCartOpen(true)}
            />

            {/* User Login */}
            <ActionIcon 
              icon={User} 
              label="Minha Conta" 
              avatarUrl={perfil?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
              isOpen={activeDropdown === 'user'}
              onClick={() => toggleDropdown('user')}
            >
              {UserContent}
            </ActionIcon>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-1">
            <ActionIcon 
              icon={ShoppingCart} 
              label="Carrinho" 
              badge={cartCount}
              onClick={() => setIsCartOpen(true)}
            />
            <button 
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-vanta-blue transition-colors relative"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-vanta-orange px-1 text-[10px] font-bold text-white border-2 border-white dark:border-gray-900">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Categories Menu - Desktop */}
        <nav className="hidden md:flex items-center justify-center space-x-8 h-12 border-t border-gray-100 dark:border-gray-800">
          {categories.map((category) => (
            <Link
              key={category}
              to={`/produtos?categoria=${encodeURIComponent(category.toLowerCase())}`}
              className="relative text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-vanta-darkblue dark:hover:text-white transition-colors duration-300 group py-3"
            >
              {category}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-vanta-blue transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        "md:hidden absolute top-[75px] left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-lg overflow-y-auto transition-all duration-300 ease-in-out",
        mobileMenuOpen ? "max-h-[85vh] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="p-4 flex flex-col">
          <div className="flex justify-around pb-4 border-b border-gray-100 dark:border-gray-800 items-center">
             {DarkModeToggle}
             <ActionIcon icon={Bell} label="Notificações" badge={unreadCount} isOpen={activeDropdown === 'notificacoes_mobile'} onClick={() => toggleDropdown('notificacoes_mobile')} align="center">
               {NotificationsContent}
             </ActionIcon>
          </div>
          <div className="pt-2">
            {UserContent}
          </div>
        </div>
      </div>
      
      <CartDrawer />
    </header>
  );
}

function ActionIcon({ icon: Icon, badge, label, onClick, children, isOpen, align = 'right', avatarUrl }: { icon: any, badge?: number, label: string, onClick?: () => void, children?: React.ReactNode, isOpen?: boolean, align?: 'left' | 'right' | 'center', avatarUrl?: string }) {
  return (
    <div className="relative">
      <button 
        className="relative p-2 group" 
        aria-label={label} 
        title={label}
        onClick={onClick}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={label} className="w-8 h-8 rounded-full object-cover border-2 border-transparent group-hover:border-vanta-blue transition-all group-hover:drop-shadow-[0_0_8px_rgba(29,142,255,0.4)]" />
        ) : (
          <Icon className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 group-hover:text-vanta-blue group-hover:drop-shadow-[0_0_8px_rgba(29,142,255,0.4)]" />
        )}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[20px] w-auto h-5 px-1.5 text-[11px] font-bold text-white bg-vanta-orange rounded-full border-[2.5px] border-white dark:border-gray-900 shadow-sm leading-none whitespace-nowrap z-10">
            {badge}
          </span>
        )}
      </button>
      {isOpen && children && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 bg-black/60 z-[100] md:hidden backdrop-blur-sm animate-fade-in" onClick={onClick} />
          
          {/* Container (Bottom sheet on mobile, Dropdown on desktop) */}
          <div className={cn(
            "fixed inset-x-0 bottom-0 z-[101] bg-white dark:bg-gray-900 rounded-t-[32px] p-6 shadow-2xl animate-slide-up flex flex-col text-left max-h-[90vh] overflow-y-auto",
            "md:absolute md:inset-auto md:bottom-auto md:top-full md:mt-2 md:w-80 md:rounded-xl md:shadow-hover md:border md:border-gray-100 md:dark:border-gray-800 md:p-4 md:z-50 md:animate-fade-in md:overflow-visible",
            align === 'left' ? 'md:left-0' : align === 'center' ? 'md:left-1/2 md:-translate-x-1/2' : 'md:right-0'
          )}>
            {/* Mobile handle and close */}
            <div className="md:hidden flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
              <span className="font-bold text-lg text-vanta-darkblue dark:text-white">{label}</span>
              <button onClick={onClick} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {children}
          </div>
        </>
      )}
    </div>
  );
}
