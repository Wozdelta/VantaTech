import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#1D8EFF 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-vanta-blue/10 to-transparent rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-vanta-blue dark:text-gray-400 dark:hover:text-vanta-blue transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para loja
        </Link>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl border border-gray-100 dark:border-gray-700 p-8 sm:p-10 animate-slide-up">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-vanta-darkblue dark:text-white tracking-tight">
              {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {isLogin ? 'Faça login para continuar na VantaTech' : 'Junte-se a nós para a melhor experiência'}
            </p>
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            {!isLogin && (
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nome completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="text" className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-vanta-blue focus:border-transparent transition-all outline-none" placeholder="João Silva" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-vanta-blue focus:border-transparent transition-all outline-none" 
                  placeholder="voce@exemplo.com" 
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Senha</label>
                {isLogin && (
                  <a href="#" className="text-xs font-semibold text-vanta-blue hover:text-vanta-darkblue transition-colors">Esqueceu a senha?</a>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input type="password" className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-vanta-blue focus:border-transparent transition-all outline-none" placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" className="w-full py-3.5 bg-vanta-blue text-white font-bold text-lg rounded-xl hover:bg-vanta-darkblue hover:-translate-y-0.5 shadow-[0_8px_20px_rgba(29,142,255,0.3)] transition-all duration-300 mt-2">
              {isLogin ? 'Entrar' : 'Cadastrar'}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Ou continue com</span>
              </div>
            </div>

            <div className="mt-6">
              <button className="w-full flex items-center justify-center py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <FcGoogle className="w-5 h-5 mr-2" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Continuar com Google</span>
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLogin ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
              <button onClick={() => setIsLogin(!isLogin)} className="ml-1.5 font-bold text-vanta-blue hover:text-vanta-darkblue transition-colors">
                {isLogin ? 'Crie agora' : 'Faça login'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
