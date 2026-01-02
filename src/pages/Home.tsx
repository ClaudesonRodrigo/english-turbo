import { Link } from 'react-router-dom';
import { BookOpen, Trophy, PlayCircle, History, Lock, CheckCircle, LogOut, Settings, Save, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, where, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Lesson } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ProgressItem {
  id: string;
  lessonId: string;
  lessonTitle: string;
  completedAt: any;
  user: string;
  userId: string;
}

export function Home() {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState<ProgressItem[]>([]);
  const [availableLessons, setAvailableLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para o Modal de Configuração
  const [showSettings, setShowSettings] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState("");
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);

  // 1. Busca as Lições
  useEffect(() => {
    async function fetchLessons() {
      try {
        const lessonsCollection = collection(db, "lessons");
        const q = query(lessonsCollection, orderBy("number", "asc"));
        
        const snapshot = await getDocs(q);
        const lessonsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Lesson[];

        setAvailableLessons(lessonsList);
      } catch (error) {
        console.error("Erro ao buscar lições:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLessons();
  }, []);

  // 2. Busca o Histórico
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "progress"), 
      where("userId", "==", user.uid),
      orderBy("completedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedHistory = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProgressItem[];
      setHistory(loadedHistory);
    });
    return () => unsubscribe();
  }, [user]);

  // 3. Busca (ou Cria) o Perfil do Usuário para ver se já tem professor
  useEffect(() => {
    async function fetchUserProfile() {
      if (!user) return;
      
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.myTeacher) {
          setTeacherEmail(data.myTeacher);
        }
      }
    }
    fetchUserProfile();
  }, [user]);

  const handleSaveTeacher = async () => {
    if (!user) return;
    setIsSavingTeacher(true);
    try {
      // Salva/Atualiza o documento do usuário na coleção 'users'
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        myTeacher: teacherEmail.trim().toLowerCase(), // O vinculo mágico
        lastActive: new Date()
      }, { merge: true }); // merge: true não apaga dados antigos se existirem

      alert("Professor vinculado com sucesso!");
      setShowSettings(false);
    } catch (error) {
      console.error("Erro ao salvar professor:", error);
      alert("Erro ao salvar.");
    } finally {
      setIsSavingTeacher(false);
    }
  };

  const getLessonStatus = (lesson: Lesson) => {
    const isCompleted = history.some(h => h.lessonId === lesson.id);
    
    if (lesson.number === 1) {
      return { locked: false, completed: isCompleted };
    }

    const previousLesson = availableLessons.find(l => l.number === lesson.number - 1);
    
    if (!previousLesson) return { locked: true, completed: false };

    const isPrevCompleted = history.some(h => h.lessonId === previousLesson.id);

    return { 
      locked: !isPrevCompleted, 
      completed: isCompleted 
    };
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Carregando aulas...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans relative">
      
      {/* MODAL DE CONFIGURAÇÕES (Overlay) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserIcon className="text-blue-600" /> Meu Professor
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Digite o email do seu professor para que ele possa acompanhar o seu progresso.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Email do Professor</label>
                <input 
                  type="email" 
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  placeholder="ex: professor@ingles.com"
                  className="w-full p-3 border border-slate-300 rounded-lg mt-1 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveTeacher}
                  disabled={isSavingTeacher}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex justify-center items-center gap-2"
                >
                  {isSavingTeacher ? 'Salvando...' : <><Save size={18} /> Salvar</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <header className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            {user?.photoURL && (
              <img 
                src={user.photoURL} 
                alt="Avatar" 
                className="w-12 h-12 rounded-full border-2 border-blue-500"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900">English Turbo 🚀</h1>
              <p className="text-slate-500 text-sm">Hi, {user?.displayName}!</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Botão para abrir modal de professor */}
            <button 
              onClick={() => setShowSettings(true)}
              className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition hover:text-blue-600"
              title="Vincular Professor"
            >
              <Settings size={20} />
            </button>

            <Link to="/teacher" className="text-xs text-slate-300 hover:text-slate-500 transition font-bold px-2">
              TEACHER
            </Link>
            
            <Link to="/admin" className="text-xs text-slate-300 hover:text-slate-500 transition font-bold px-2">
              ADMIN
            </Link>

            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            <button 
              onClick={logout}
              className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* LISTA DE AULAS */}
          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800 mb-4">
              <BookOpen className="text-blue-600" /> Learning Path
            </h2>
            <div className="space-y-4">
              {availableLessons.length === 0 ? (
                <p>Nenhuma aula encontrada.</p>
              ) : (
                availableLessons.map((lesson) => {
                  const status = getLessonStatus(lesson);

                  return (
                    <div 
                      key={lesson.id} 
                      className={`relative p-5 rounded-xl border-l-4 transition-all ${
                        status.locked 
                          ? 'bg-slate-200 border-slate-400 opacity-70 grayscale' 
                          : status.completed
                            ? 'bg-green-50 border-green-500 shadow-sm' 
                            : 'bg-white border-blue-500 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold uppercase tracking-wider ${
                              status.locked ? 'text-slate-500' : status.completed ? 'text-green-600' : 'text-blue-600'
                            }`}>
                              Lesson {lesson.number}
                            </span>
                            {status.completed && <CheckCircle size={14} className="text-green-600"/>}
                          </div>
                          
                          <h3 className={`text-lg font-bold ${status.locked ? 'text-slate-500' : 'text-slate-800'}`}>
                            {lesson.title}
                          </h3>
                          <p className="text-slate-400 text-sm mt-1">{lesson.exercises.length} Exercises</p>
                        </div>

                        {status.locked ? (
                          <div className="bg-slate-300 text-slate-500 p-3 rounded-full cursor-not-allowed">
                            <Lock size={24} />
                          </div>
                        ) : (
                          <Link 
                            to={`/lesson/${lesson.id}`} 
                            className={`p-3 rounded-full transition ${
                              status.completed 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            <PlayCircle size={24} />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Histórico */}
          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800 mb-4">
              <History className="text-yellow-600" /> Your Activity
            </h2>
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 max-h-[400px] overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-slate-400 text-center italic py-4">
                  Welcome! Complete your first lesson to see it here.
                </p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border-b border-slate-50 last:border-0">
                    <div className="bg-yellow-100 p-2 rounded-full text-yellow-600">
                      <Trophy size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{item.lessonTitle}</p>
                      <p className="text-xs text-slate-400">
                        {item.completedAt ? new Date(item.completedAt.seconds * 1000).toLocaleDateString("pt-BR") : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}