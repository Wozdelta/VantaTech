import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Truck } from 'lucide-react';
import { FaPix, FaCcVisa, FaCcMastercard, FaInstagram, FaWhatsapp } from 'react-icons/fa6';
import { SiMercadopago } from 'react-icons/si';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pt-16 pb-8 mt-16 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16 max-w-5xl mx-auto">

          {/* Suporte & Contato */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h3 className="text-lg font-bold text-vanta-darkblue dark:text-white mb-6">Suporte & Contato</h3>
            <ul className="space-y-3">
              <li><Link to="/faq" className="text-gray-600 dark:text-gray-300 hover:text-vanta-blue transition-colors">Perguntas Frequentes</Link></li>
              <li><Link to="/garantia" className="text-gray-600 dark:text-gray-300 hover:text-vanta-blue transition-colors">Política de Garantia</Link></li>
              <li><Link to="/devolucoes" className="text-gray-600 dark:text-gray-300 hover:text-vanta-blue transition-colors">Trocas e Devoluções</Link></li>
              <li className="pt-2 text-gray-500 dark:text-gray-400 text-sm">
                Seg a Sex: 9h às 18h<br />
                wozdelta@gmail.com<br />
                (16) 99770-0430
              </li>
            </ul>
          </div>

          {/* Redes Sociais & Comunidade */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h3 className="text-lg font-bold text-vanta-darkblue dark:text-white mb-6">Redes Sociais</h3>
            <div className="flex justify-center md:justify-start space-x-4 mb-6">
              <a href="https://www.instagram.com/vantatech016?igsh=aThuOGVvemVtZmcz&utm_source=qr" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-pink-500 hover:text-white transition-all duration-300" title="Instagram">
                <FaInstagram className="w-5 h-5" />
              </a>
              <a href="https://wa.me/5516997700430" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-green-500 hover:text-white transition-all duration-300" title="WhatsApp">
                <FaWhatsapp className="w-5 h-5" />
              </a>
            </div>
            
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-8">Pagamento</h4>
            <div className="flex justify-center md:justify-start gap-2 text-gray-400 dark:text-gray-500">
               {/* Pix */}
               <div className="flex items-center justify-center w-12 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm text-[#32BCAD] hover:border-[#32BCAD] transition-colors" title="Pix">
                 <FaPix className="w-5 h-5" />
               </div>
               
               {/* Visa */}
               <div className="flex items-center justify-center w-12 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm text-[#1434CB] dark:text-[#4B68FF] hover:border-[#1434CB] transition-colors" title="Visa">
                 <FaCcVisa className="w-7 h-7" />
               </div>
               
               {/* Mastercard */}
               <div className="flex items-center justify-center w-12 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm text-[#EB001B] hover:border-gray-400 transition-colors" title="Mastercard">
                 <FaCcMastercard className="w-7 h-7" />
               </div>
               
               {/* Mercado Pago */}
               <div className="flex items-center justify-center w-12 h-8 bg-[#009EE3] border border-[#009EE3] rounded shadow-sm text-white hover:opacity-90 transition-opacity" title="Mercado Pago">
                 <SiMercadopago className="w-6 h-6" />
               </div>
            </div>
          </div>

          {/* Segurança & Selos */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h3 className="text-lg font-bold text-vanta-darkblue dark:text-white mb-6">Segurança e Confiança</h3>
            <div className="space-y-4 w-full sm:w-auto">
              <div className="flex flex-col md:flex-row items-center text-center md:text-left p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 gap-3">
                <ShieldCheck className="w-8 h-8 text-vanta-blue flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Compra Segura</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ambiente 100% protegido</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center text-center md:text-left p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 gap-3">
                <Lock className="w-8 h-8 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Certificado SSL</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Seus dados criptografados</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center text-center md:text-left p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 gap-3">
                <Truck className="w-8 h-8 text-vanta-orange flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Entrega Garantida</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Região de Araraquara, São Carlos, Matão, Américo Brasiliense</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            &copy; {new Date().getFullYear()} VantaTech. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
