import HeroBanner from '@/components/home/HeroBanner';
import ProductsSection from '@/components/home/ProductsSection';
import Brands from '@/components/home/Brands';
import VantaClubSection from '@/components/home/VantaClubSection';
import Newsletter from '@/components/home/Newsletter';
import WhatsAppButton from '@/components/common/WhatsAppButton';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';

import BlockScreen from '@/components/common/BlockScreen';

export default function Home() {
  const { settings } = useSettings();
  const { perfil } = useAuth();
  
  const showFidelidade = settings.acesso_fidelidade === 'todos' || perfil?.cargo === 'Admin';
  const showLoja = settings.acesso_loja === 'todos' || perfil?.cargo === 'Admin';

  if (!showLoja) {
    return (
      <BlockScreen 
        title="Loja em Manutenção" 
        message="Nossa vitrine está fechada temporariamente para atualizações. Volte em breve!" 
      />
    );
  }

  return (
    <div className="flex flex-col gap-16 pb-16">
      <HeroBanner />
      <ProductsSection />
      <Brands />
      <VantaClubSection />
      <Newsletter />
      <WhatsAppButton />
    </div>
  );
}
