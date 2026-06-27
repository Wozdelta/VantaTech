import { FaWhatsapp } from 'react-icons/fa6';

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/5516997700430"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-[#25D366] text-white rounded-full shadow-lg hover:bg-[#1DA851] hover:scale-110 hover:-translate-y-1 transition-all duration-300 animate-fade-in group"
      aria-label="Fale conosco no WhatsApp"
      title="Fale conosco no WhatsApp"
    >
      <FaWhatsapp className="w-8 h-8 md:w-9 md:h-9" />
      {/* Tooltip on hover */}
      <span className="absolute right-full mr-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-semibold px-4 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap border border-gray-100 dark:border-gray-700">
        Precisa de ajuda?
      </span>
    </a>
  );
}
