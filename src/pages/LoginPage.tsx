import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Zap } from "lucide-react";

export function LoginPage() {
  const { user, signInGoogle } = useAuth();

  // Se o usuário já estiver logado, manda ele direto pra Home
  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-white">
      <div className="max-w-md w-full text-center space-y-8">
        
        {/* Logo e Título */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-blue-600 p-4 rounded-full shadow-lg shadow-blue-500/30">
            <Zap size={48} className="text-white" fill="currentColor" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">English Turbo</h1>
          <p className="text-slate-400 text-lg">
            Sua plataforma de aceleração de inglês.
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
          <p className="mb-6 text-slate-300">Entre para acessar suas aulas e acompanhar seu progresso.</p>
          
          <button
            onClick={signInGoogle}
            className="w-full bg-white text-slate-900 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-95"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google Logo" 
              className="w-6 h-6"
            />
            Entrar com Google
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-8">
          Desenvolvido por Rodrigo Borges (Carioca)
        </p>
      </div>
    </div>
  );
}