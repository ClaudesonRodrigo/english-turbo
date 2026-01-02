import { useEffect, useState } from 'react';
import { Users, Search, AlertCircle, CheckCircle, TrendingUp, MoreVertical, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

// Definindo o tipo do Aluno vindo do banco
interface Student {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
  lastActive: any; // Timestamp do Firebase
}

export function TeacherPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      if (!user || !user.email) return;

      try {
        // BUSCA REAL: Encontre usuários onde 'myTeacher' é igual ao MEU email
        const q = query(
          collection(db, "users"), 
          where("myTeacher", "==", user.email.toLowerCase())
        );

        const querySnapshot = await getDocs(q);
        const studentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Student[];

        setStudents(studentsList);
      } catch (error) {
        console.error("Erro ao buscar alunos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, [user]);

  // Função auxiliar para formatar data
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Nunca acessou';
    return new Date(timestamp.seconds * 1000).toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER DO PROFESSOR */}
        <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="text-blue-600" /> Painel do Professor
            </h1>
            <p className="text-slate-500">
              Gerencie seus alunos. <span className="text-blue-600 font-bold">Seu email de professor é: {user?.email}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/" className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition">
              Ver como Aluno
            </Link>
          </div>
        </header>

        {/* CARDS DE RESUMO (KPIs Reais) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
             <p className="text-slate-400 text-xs font-bold uppercase">Total Alunos</p>
             <p className="text-3xl font-bold text-slate-800 mt-1">{students.length}</p>
          </div>
          
          {/* Estes dados ainda são estáticos, pois precisariam de queries complexas */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 opacity-50">
             <p className="text-slate-400 text-xs font-bold uppercase">Aulas Concluídas</p>
             <p className="text-3xl font-bold text-blue-600 mt-1">-</p>
          </div>
        </div>

        {/* TABELA DE ALUNOS REAIS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Meus Alunos ({students.length})</h2>
            
            {students.length === 0 && (
                <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                    Aguardando alunos vincularem seu email...
                </span>
            )}
          </div>

          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
              <tr>
                <th className="p-4">Aluno</th>
                <th className="p-4">Email</th>
                <th className="p-4">Último Acesso</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                  <tr><td colSpan={4} className="p-4 text-center">Carregando alunos...</td></tr>
              ) : students.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">Nenhum aluno encontrado. Peça para eles cadastrarem o email <strong>{user?.email}</strong> nas configurações.</td></tr>
              ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition cursor-pointer">
                      <td className="p-4 flex items-center gap-3">
                        {student.photoURL ? (
                            <img src={student.photoURL} className="w-10 h-10 rounded-full border border-slate-200" alt="Avatar" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                {student.displayName?.charAt(0) || '?'}
                            </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800">{student.displayName || "Usuário sem nome"}</p>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 text-sm">
                        {student.email}
                      </td>
                      <td className="p-4 text-sm text-slate-600 flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400"/>
                        {formatDate(student.lastActive)}
                      </td>
                      <td className="p-4 text-right text-slate-400">
                        <button className="p-2 hover:bg-slate-200 rounded-full transition" title="Ver Detalhes (Em breve)">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}