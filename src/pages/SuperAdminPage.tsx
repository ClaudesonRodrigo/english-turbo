import { useEffect, useState } from 'react';
import { Shield, Search, UserCheck, GraduationCap, XCircle, CheckCircle } from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Tipo de dados do Usuário
interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
  role?: 'student' | 'teacher' | 'admin'; // O papel do usuário
  myTeacher?: string;
}

export function SuperAdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Busca todos os usuários do banco
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsers(usersList);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      alert("Erro ao carregar lista de usuários.");
    } finally {
      setLoading(false);
    }
  }

  // Função para mudar o cargo (Role)
  const toggleRole = async (user: UserProfile) => {
    const newRole = user.role === 'teacher' ? 'student' : 'teacher';
    
    if (!confirm(`Tem certeza que deseja mudar ${user.displayName} para ${newRole.toUpperCase()}?`)) return;

    try {
      // Atualiza no Firebase
      await updateDoc(doc(db, "users", user.id), {
        role: newRole
      });

      // Atualiza na tela localmente para não precisar recarregar
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, role: newRole } : u
      ));

    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Erro ao atualizar permissão.");
    }
  };

  // Filtra usuários pela busca
  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER DO SUPER ADMIN */}
        <header className="flex justify-between items-center border-b border-slate-700 pb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-purple-400">
              <Shield size={32} /> God Mode (Super Admin)
            </h1>
            <p className="text-slate-400 mt-1">Gerencie permissões e acessos da plataforma.</p>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
             <span className="text-slate-400 text-sm">Total Usuários:</span>
             <span className="ml-2 text-xl font-bold text-white">{users.length}</span>
          </div>
        </header>

        {/* BARRA DE BUSCA */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-3">
          <Search className="text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-white w-full placeholder-slate-500"
          />
        </div>

        {/* TABELA DE USUÁRIOS */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold">
              <tr>
                <th className="p-4">Usuário</th>
                <th className="p-4">Email</th>
                <th className="p-4">Função Atual (Role)</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Carregando base de dados...</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-700/50 transition">
                  <td className="p-4 flex items-center gap-3">
                    {user.photoURL ? (
                       <img src={user.photoURL} className="w-10 h-10 rounded-full border border-slate-600" alt="Avatar" />
                    ) : (
                       <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center font-bold">
                         {user.displayName?.charAt(0)}
                       </div>
                    )}
                    <span className="font-semibold">{user.displayName}</span>
                  </td>
                  <td className="p-4 text-slate-400 font-mono text-sm">{user.email}</td>
                  <td className="p-4">
                    {user.role === 'teacher' ? (
                      <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/30 flex w-fit items-center gap-1">
                        <UserCheck size={14} /> PROFESSOR
                      </span>
                    ) : (
                      <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30 flex w-fit items-center gap-1">
                        <GraduationCap size={14} /> ALUNO
                      </span>
                    )}
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    {user.role === 'teacher' ? (
                      <button 
                        onClick={() => toggleRole(user)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 px-3 py-1 rounded text-sm font-bold transition flex items-center gap-2"
                      >
                        <XCircle size={16} /> Rebaixar para Aluno
                      </button>
                    ) : (
                      <button 
                        onClick={() => toggleRole(user)}
                        className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/50 px-3 py-1 rounded text-sm font-bold transition flex items-center gap-2"
                      >
                        <CheckCircle size={16} /> Promover a Professor
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}