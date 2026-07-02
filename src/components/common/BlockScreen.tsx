import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BlockScreen({ title, message }: { title: string, message: string }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 text-center">
        {title}
      </h1>
      <p className="text-gray-500 text-center max-w-md mb-8">
        {message}
      </p>
      <Link to="/" className="px-6 py-2.5 bg-vanta-blue text-white rounded-xl font-bold">
        Voltar ao início
      </Link>
    </div>
  );
}
