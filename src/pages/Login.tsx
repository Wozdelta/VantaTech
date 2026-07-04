import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User, Loader2, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from '../lib/supabase';

type ViewState = 'login' | 'register' | 'forgot_email' | 'forgot_otp' | 'forgot_new_password';

export default function Login() {
  const [view, setView] = useState<ViewState>('login');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (view === 'login') {
        if (!email || !password) throw new Error('Preencha o e-mail e a senha.');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error('E-mail ou senha inválidos.');
        
        // Se a pessoa já tinha conta e fez login, não deve dar pontos para afiliado
        localStorage.removeItem('afiliado_id');
        
        navigate('/');

      } else if (view === 'register') {
        if (!email || !password || !nome) throw new Error('Preencha todos os campos.');
        
        const afiliadoId = localStorage.getItem('afiliado_id');
        
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { 
              nome_completo: nome
            } 
          },
        });
        if (error) {
          if (error.message.includes('User already registered')) throw new Error('Este e-mail já está em uso.');
          throw new Error(error.message);
        }

        navigate('/');

      } else if (view === 'forgot_email') {
        if (!email) throw new Error('Preencha seu e-mail.');
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) {
          console.error("Erro no reset de senha:", error);
          const chaves = Object.getOwnPropertyNames(error).join(', ');
          const name = error.name || 'Sem nome';
          const msg = error.message || 'Sem mensagem';
          const status = (error as any).status || 'Sem status';
          throw new Error(`Erro: Nome=${name}, Msg=${msg}, Status=${status}, Chaves=[${chaves}]`);
        }
        setSuccess('Código enviado! Verifique sua caixa de entrada e spam.');
        setView('forgot_otp');

      } else if (view === 'forgot_otp') {
        if (!otp) throw new Error('Preencha o código de 6 dígitos.');
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: otp,
          type: 'recovery'
        });
        if (error) throw new Error('Código inválido ou expirado.');
        setSuccess('Código verificado! Crie sua nova senha abaixo.');
        setView('forgot_new_password');

      } else if (view === 'forgot_new_password') {
        if (!password || password.length < 6) throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error('Erro ao atualizar a senha.');
        setSuccess('Senha alterada com sucesso! Você já está logado.');
        setTimeout(() => navigate('/'), 2000);
      }
      
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#1D8EFF 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-vanta-blue/10 to-transparent rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Back Link */}
        {view === 'login' || view === 'register' ? (
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-vanta-blue dark:text-gray-400 transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar para loja
          </Link>
        ) : (
          <button 
            onClick={() => {
              setView('login');
              setError('');
              setSuccess('');
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-vanta-blue dark:text-gray-400 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar para o Login
          </button>
        )}

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl border border-gray-100 dark:border-gray-700 p-8 sm:p-10 animate-slide-up">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-vanta-darkblue dark:text-white tracking-tight">
              {view === 'login' && 'Bem-vindo de volta'}
              {view === 'register' && 'Crie sua conta'}
              {view === 'forgot_email' && 'Esqueceu a senha?'}
              {view === 'forgot_otp' && 'Digite o Código'}
              {view === 'forgot_new_password' && 'Nova Senha'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {view === 'login' && 'Faça login para continuar na VantaTech'}
              {view === 'register' && 'Junte-se a nós para a melhor experiência'}
              {view === 'forgot_email' && 'Enviaremos um código de recuperação para você'}
              {view === 'forgot_otp' && `Enviamos um código de recuperação para ${email}`}
              {view === 'forgot_new_password' && 'Crie uma senha forte e segura'}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg text-center">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg flex items-center justify-center text-center">
                <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
                {success}
              </div>
            )}

            {/* REGISTER: Nome */}
            {view === 'register' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nome completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-vanta-blue focus:border-transparent transition-all outline-none" 
                    placeholder="João Silva" 
                  />
                </div>
              </div>
            )}

            {/* Email (Aparece no Login, Cadastro e Esqueci Senha Passo 1) */}
            {(view === 'login' || view === 'register' || view === 'forgot_email') && (
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">E-mail</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-vanta-blue focus:border-transparent transition-all outline-none" 
                    placeholder="voce@exemplo.com" 
                  />
                </div>
              </div>
            )}

            {/* OTP Code (Passo 2) */}
            {view === 'forgot_otp' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Código de recuperação</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.trim())}
                    required
                    className="w-full pl-11 pr-4 py-3 text-center tracking-[0.3em] text-2xl font-bold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-vanta-blue focus:border-transparent transition-all outline-none" 
                    placeholder="Código" 
                  />
                </div>
              </div>
            )}

            {/* Senha (Aparece no Login, Cadastro e Nova Senha) */}
            {(view === 'login' || view === 'register' || view === 'forgot_new_password') && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {view === 'forgot_new_password' ? 'Nova Senha' : 'Senha'}
                  </label>
                  {view === 'login' && (
                    <button 
                      type="button"
                      onClick={() => {
                        setView('forgot_email');
                        setError('');
                      }} 
                      className="text-xs font-semibold text-vanta-blue hover:text-vanta-darkblue transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-vanta-blue focus:border-transparent transition-all outline-none" 
                    placeholder="••••••••" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || (view === 'forgot_new_password' && success.includes('alterada'))}
              className="w-full py-3.5 bg-vanta-blue text-white font-bold text-lg rounded-xl hover:bg-vanta-darkblue hover:-translate-y-0.5 shadow-[0_8px_20px_rgba(29,142,255,0.3)] transition-all duration-300 mt-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              ) : view === 'login' ? 'Entrar'
                : view === 'register' ? 'Cadastrar'
                : view === 'forgot_email' ? 'Enviar Código'
                : view === 'forgot_otp' ? 'Verificar Código'
                : 'Salvar Nova Senha'}
            </button>
          </form>

          {/* Opções Alternativas só aparecem no Login/Register */}
          {(view === 'login' || view === 'register') && (
            <>
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
                  <button 
                    type="button"
                    onClick={() => supabase.auth.signInWithOAuth({ 
                      provider: 'google',
                      options: {
                        redirectTo: window.location.origin
                      }
                    })}
                    className="w-full flex items-center justify-center py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <FcGoogle className="w-5 h-5 mr-2" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Continuar com Google</span>
                  </button>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {view === 'login' ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
                  <button 
                    onClick={() => {
                      setView(view === 'login' ? 'register' : 'login');
                      setError('');
                    }} 
                    className="ml-1.5 font-bold text-vanta-blue hover:text-vanta-darkblue transition-colors"
                  >
                    {view === 'login' ? 'Crie agora' : 'Faça login'}
                  </button>
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
