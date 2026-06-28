import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Sparkles, Send } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      navigate(`/login?email=${encodeURIComponent(email)}`);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[32px] mt-12 mb-8 bg-gradient-to-br from-vanta-darkblue via-[#0d1f3b] to-vanta-darkblue shadow-2xl border border-white/10 group">

      {/* Premium Tech Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      {/* Glow Effects */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[400px] h-[400px] rounded-full bg-vanta-blue/20 blur-[100px] group-hover:bg-vanta-blue/30 transition-colors duration-1000"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] rounded-full bg-vanta-orange/10 blur-[100px] group-hover:bg-vanta-orange/20 transition-colors duration-1000"></div>

      <div className="relative p-10 md:p-16 lg:p-20 flex flex-col lg:flex-row items-center justify-between gap-10">

        {/* Content */}
        <div className="text-center lg:text-left flex-1 max-w-2xl relative z-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            Receba nossas <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-vanta-blue">ofertas exclusivas</span>
          </h2>

          <p className="text-blue-100/80 md:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Faça login ou crie sua conta para garantir acesso às nossas ofertas exclusivas e descontos especiais em smartphones novos e seminovos.
          </p>
        </div>

        {/* Form */}
        <div className="w-full max-w-md relative z-10">
          <form className="relative group/form" onSubmit={handleLogin}>
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-gray-400 group-focus-within/form:text-vanta-blue transition-colors duration-300" />
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu melhor e-mail"
              required
              className="w-full h-16 pl-14 pr-[140px] rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-white placeholder-blue-200/50 outline-none focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 focus:border-white transition-all duration-500 shadow-[0_8px_32px_rgba(0,0,0,0.2)] focus:shadow-[0_8px_32px_rgba(29,142,255,0.3)]"
            />

            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-6 rounded-full bg-vanta-orange text-white font-bold hover:bg-orange-600 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,106,0,0.3)] transition-all duration-300 flex items-center gap-2 group/btn"
            >
              Logar
              <Send className="w-4 h-4 group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
