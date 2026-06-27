import HeroBanner from '@/components/home/HeroBanner';
import ProductsSection from '@/components/home/ProductsSection';
import Brands from '@/components/home/Brands';
import Newsletter from '@/components/home/Newsletter';
import WhatsAppButton from '@/components/common/WhatsAppButton';

export default function Home() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      <HeroBanner />
      <ProductsSection />
      <Brands />
      <Newsletter />
      <WhatsAppButton />
    </div>
  );
}
