import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

import { Home } from './pages/Home';
import { LessonPage } from './pages/LessonPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { TeacherPage } from './pages/TeacherPage';
import { SuperAdminPage } from './pages/SuperAdminPage'; // Nova página
import { AuthProvider, useAuth } from './contexts/AuthContext';

// --- CONFIGURAÇÃO DE SEGURANÇA ---
// COLOQUE AQUI O SEU EMAIL REAL DO GOOGLE
const SUPER_ADMIN_EMAILS = ["claudesonborges@gmail.com", "itachi189@gmail.com"]; 

// --- Componentes de Proteção de Rota ---

// 1. Proteção Básica: Só logado
function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-100">Carregando...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

// 2. Proteção de Professor: Só se tiver o cargo 'teacher' no banco (ou for admin)
function TeacherRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkRole() {
      if (!user) return;
      if (SUPER_ADMIN_EMAILS.includes(user.email || "")) {
        setIsAllowed(true); // Super Admin entra em tudo
        return;
      }

      // Verifica no banco se é professor
      const snap = await getDoc(doc(db, "users", user.uid));
      const role = snap.data()?.role;
      setIsAllowed(role === 'teacher');
    }
    if (user) checkRole();
  }, [user]);

  if (loading || isAllowed === null) return <div className="h-screen flex items-center justify-center bg-slate-100">Verificando permissões...</div>;
  
  if (!isAllowed) {
    alert("Acesso negado: Área restrita a Professores.");
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

// 3. Proteção Super Admin: Só o email Mestre
function SuperAdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Verificando credenciais...</div>;
  
  if (!user || !SUPER_ADMIN_EMAILS.includes(user.email || "")) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Rotas de Aluno (Básicas) */}
          <Route path="/" element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } />
          
          <Route path="/lesson/:id" element={
            <PrivateRoute>
              <LessonPage />
            </PrivateRoute>
          } />
          
          {/* Rota de Admin de Conteúdo (Você decide se mantém aberta ou fecha) */}
          <Route path="/admin" element={
            <SuperAdminRoute>
              <AdminPage />
            </SuperAdminRoute>
          } />

          {/* Rota do Professor (Agora protegida por cargo) */}
          <Route path="/teacher" element={
            <TeacherRoute>
              <TeacherPage />
            </TeacherRoute>
          } />

          {/* Rota do DONO (Você) */}
          <Route path="/super-admin" element={
            <SuperAdminRoute>
              <SuperAdminPage />
            </SuperAdminRoute>
          } />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;