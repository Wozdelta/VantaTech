import { useState, useEffect } from 'react';
import { Search, HelpCircle, MessageSquare, Ticket, FileText, ChevronRight, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AjudaSearch from '../components/ajuda/AjudaSearch';
import AjudaFAQ from '../components/ajuda/AjudaFAQ';
import AjudaChatBot from '../components/ajuda/AjudaChatBot';
import AjudaTicketForm from '../components/ajuda/AjudaTicketForm';
import AjudaMeusTickets from '../components/ajuda/AjudaMeusTickets';

type TabType = 'faq' | 'tickets' | 'chat';

export default function Ajuda() {
  const { user, perfil } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('faq');
  
  // Se o usuário clicar em "Abrir Ticket" na IA ou na Pesquisa
  const handleOpenTicketForm = () => {
    setActiveTab('tickets');
    // Adicionar logica para abrir o modal ou rolar para o form se necessário
    // Por enquanto, apenas muda a tab e foca na aba de tickets (que pode renderizar o form)
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in pb-20">
      
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex-1">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-4 tracking-tight">
            <div className="w-14 h-14 bg-vanta-blue/10 rounded-2xl flex items-center justify-center">
              <HelpCircle className="w-8 h-8 text-vanta-blue" />
            </div>
            Central de Suporte
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-xl">
            Como podemos ajudar você hoje? Encontre respostas rápidas ou fale com nossa equipe de especialistas.
          </p>
        </div>
        
        {/* Quick Tabs no Header Mobile */}
        <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl overflow-x-auto hide-scrollbar w-full md:w-auto">
          {[
            { id: 'faq', label: 'FAQ', icon: FileText },
            { id: 'chat', label: 'Assistente IA', icon: MessageCircle },
            { id: 'tickets', label: 'Meus Tickets', icon: Ticket }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-white dark:bg-gray-800 text-vanta-blue shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-8">
        {activeTab === 'faq' && (
          <div className="space-y-8 animate-fade-in">
            {/* Campo de Pesquisa Inteligente */}
            <AjudaSearch onOpenTicket={handleOpenTicketForm} />
            
            {/* Categorias FAQ */}
            <AjudaFAQ onOpenTicket={handleOpenTicketForm} />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="animate-fade-in h-[600px] bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <AjudaChatBot onOpenTicket={handleOpenTicketForm} />
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="space-y-8 animate-fade-in">
            {/* Tickets */}
            <AjudaMeusTickets user={user} perfil={perfil} />
          </div>
        )}
      </div>

    </div>
  );
}
