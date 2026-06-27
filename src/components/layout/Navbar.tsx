import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, ShoppingCart, User, Menu, X, Smartphone, Trash2, Moon, Sun } from 'lucide-react';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa6';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'Apple',
  'Samsung',
  'Xiaomi',
  'Motorola',
  'Realme',
  'Poco',
  'Google Pixel',
  'Acessórios'
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const navRef = useRef<HTMLElement>(null);

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

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Seu pedido #1234 foi enviado', time: 'Há 2 horas' },
    { id: 2, title: 'Promoção de iPhone 14', time: 'Há 5 horas' },
    { id: 3, title: 'Bem-vindo à VantaTech!', time: 'Há 1 dia' },
  ]);

  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'iPhone 14 Pro Max', price: 'R$ 6.499,00' }
  ]);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeCartItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const NotificationsContent = (
    <>
      <div className="flex items-center justify-between mb-2 border-b border-gray-100 dark:border-gray-800 pb-2">
         <h4 className="font-bold text-gray-800 dark:text-white">Notificações</h4>
         {notifications.length > 0 && (
           <button onClick={clearNotifications} className="text-xs text-vanta-blue hover:text-vanta-darkblue dark:hover:text-blue-400 transition-colors">
             Limpar todas
           </button>
         )}
      </div>
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 text-left">
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Nenhuma notificação no momento.</p>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className="text-sm">
              <p className="font-medium text-gray-900 dark:text-gray-100">{notif.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{notif.time}</p>
            </div>
          ))
        )}
      </div>
    </>
  );

  const CartContent = (
    <>
      <h4 className="font-bold text-gray-800 dark:text-white mb-2 border-b border-gray-100 dark:border-gray-800 pb-2 text-left">Seu Carrinho</h4>
      
      <div className="max-h-[300px] overflow-y-auto text-left">
        {cartItems.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Seu carrinho está vazio.</p>
        ) : (
          cartItems.map(item => (
            <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500">FOTO</span>
              </div>
              <div className="flex-1">
                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{item.name}</p>
                 <p className="text-xs text-vanta-darkblue dark:text-blue-400 font-bold">{item.price}</p>
              </div>
              <button 
                onClick={() => removeCartItem(item.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                title="Remover"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
      
      <button 
        className="w-full mt-3 py-2 bg-vanta-blue text-white text-sm font-bold rounded-lg hover:bg-vanta-darkblue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={cartItems.length === 0}
      >
        Finalizar Compra
      </button>
    </>
  );

  const UserContent = (
    <>
      <div className="p-2 border-b border-gray-100 dark:border-gray-800 mb-2">
        <Link 
          to="/login" 
          onClick={() => setActiveDropdown(null)}
          className="block w-full text-center py-2 bg-vanta-blue text-white text-sm font-bold rounded-lg hover:bg-vanta-darkblue transition-colors"
        >
          Fazer Login
        </Link>
      </div>
      <div className="flex flex-col gap-1">
        <Link to="/ajuda" className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-vanta-blue rounded-md transition-colors">Ajuda</Link>
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
    </>
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
          <Link to="/" className="flex items-center group">
            <span className="text-3xl font-bold text-vanta-darkblue dark:text-white tracking-tight">
              Vanta<span className="text-vanta-orange">Tech</span>
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8 relative group">
            <input 
              type="text" 
              placeholder="Procure por celulares, marcas ou modelos..." 
              className="w-full h-11 pl-5 pr-12 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none transition-all duration-300 focus:bg-white dark:focus:bg-gray-900 focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 group-hover:shadow-[0_0_15px_rgba(29,142,255,0.15)]"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 dark:text-gray-500 hover:text-vanta-blue dark:hover:text-vanta-blue transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-6 text-gray-600 dark:text-gray-300">
            {DarkModeToggle}
            <ActionIcon 
              icon={Bell} 
              label="Notificações" 
              badge={notifications.length}
              isOpen={activeDropdown === 'notificacoes'}
              onClick={() => toggleDropdown('notificacoes')}
            >
              {NotificationsContent}
            </ActionIcon>

            <ActionIcon 
              icon={ShoppingCart} 
              label="Carrinho" 
              badge={cartItems.length}
              isOpen={activeDropdown === 'carrinho'}
              onClick={() => toggleDropdown('carrinho')}
            >
              {CartContent}
            </ActionIcon>

            {/* User Login */}
            <ActionIcon 
              icon={User} 
              label="Minha Conta" 
              isOpen={activeDropdown === 'user'}
              onClick={() => toggleDropdown('user')}
            >
              {UserContent}
            </ActionIcon>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            {DarkModeToggle}
            <button 
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-vanta-blue transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Categories Menu - Desktop */}
        <nav className="hidden md:flex items-center justify-center space-x-8 h-12 border-t border-gray-100 dark:border-gray-800">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              to={`/categoria/${category.toLowerCase()}`}
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
        "md:hidden absolute top-[75px] left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-lg overflow-hidden transition-all duration-300 ease-in-out",
        mobileMenuOpen ? "max-h-[1000px] opacity-100 overflow-visible" : "max-h-0 opacity-0 overflow-hidden"
      )}>
        <div className="p-4 space-y-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Procurar..." 
              className="w-full h-10 pl-4 pr-10 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                to={`/categoria/${category.toLowerCase()}`}
                className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <Smartphone className="w-4 h-4 mr-2 text-vanta-blue" />
                {category}
              </Link>
            ))}
          </div>
          <div className="flex justify-around pt-4 pb-6 border-t border-gray-100 dark:border-gray-800">
             <ActionIcon icon={Bell} label="Notificações" badge={notifications.length} isOpen={activeDropdown === 'notificacoes_mobile'} onClick={() => toggleDropdown('notificacoes_mobile')} align="left">
               {NotificationsContent}
             </ActionIcon>
             <ActionIcon icon={ShoppingCart} label="Carrinho" badge={cartItems.length} isOpen={activeDropdown === 'carrinho_mobile'} onClick={() => toggleDropdown('carrinho_mobile')} align="center">
               {CartContent}
             </ActionIcon>
             <ActionIcon icon={User} label="Minha Conta" isOpen={activeDropdown === 'user_mobile'} onClick={() => toggleDropdown('user_mobile')} align="right">
               {UserContent}
             </ActionIcon>
          </div>
        </div>
      </div>
    </header>
  );
}

function ActionIcon({ icon: Icon, badge, label, onClick, children, isOpen, align = 'right' }: { icon: any, badge?: number, label: string, onClick?: () => void, children?: React.ReactNode, isOpen?: boolean, align?: 'left' | 'right' | 'center' }) {
  return (
    <div className="relative">
      <button 
        className="relative p-2 group" 
        aria-label={label} 
        title={label}
        onClick={onClick}
      >
        <Icon className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 group-hover:text-vanta-blue group-hover:drop-shadow-[0_0_8px_rgba(29,142,255,0.4)]" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-vanta-orange rounded-full border-2 border-white shadow-sm">
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
