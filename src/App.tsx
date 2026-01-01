import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { lessonOne } from './data/seed';
import { CheckCircle2, XCircle, BookOpen, Trophy, History } from 'lucide-react';

// Importando o Firebase e funções do Firestore
import { db } from './lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

// Tipagem para o histórico que vem do banco
interface ProgressItem {
  id: string;
  lessonTitle: string;
  completedAt: Timestamp;
  user: string;
}

const answerSchema = z.object({
  answer: z.string().min(1, "Sua resposta não pode estar vazia"),
});

type AnswerForm = z.infer<typeof answerSchema>;

function App() {
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado para armazenar o histórico vindo do Firebase
  const [history, setHistory] = useState<ProgressItem[]>([]);
  
  const currentExercise = lessonOne.exercises[currentExIndex];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AnswerForm>({
    resolver: zodResolver(answerSchema),
  });

  // Efeito para carregar o histórico em tempo real
  useEffect(() => {
    // Cria uma query para buscar a coleção 'progress' ordenada por data (mais recente primeiro)
    const q = query(collection(db, "progress"), orderBy("completedAt", "desc"));

    // O onSnapshot fica "ouvindo" o banco. Se algo mudar lá, atualiza aqui na hora.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedHistory = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProgressItem[];
      
      setHistory(loadedHistory);
    });

    // Limpa a conexão quando o componente desmontar
    return () => unsubscribe();
  }, []);

  const onSubmit = (data: AnswerForm) => {
    // Validação estrita (conforme sua preferência atual)
    const normalizedUserAnswer = data.answer.trim().toLowerCase();
    const normalizedCorrect = currentExercise.correctAnswer.toLowerCase();

    if (normalizedUserAnswer === normalizedCorrect) {
      setFeedback('success');
    } else {
      setFeedback('error');
    }
  };

  const saveProgress = async () => {
    try {
      setIsSaving(true);
      // Salva na coleção 'progress'
      await addDoc(collection(db, "progress"), {
        lessonId: lessonOne.id,
        lessonTitle: lessonOne.title,
        completedAt: new Date(),
        user: "Carioca" 
      });
      // Não precisamos de alert aqui se mostrarmos na lista, mas deixei para confirmação visual
      alert("Sucesso! Lição concluída e salva na nuvem! 🚀");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar o progresso. Verifique o console.");
    } finally {
      setIsSaving(false);
    }
  };

  const nextExercise = () => {
    setFeedback(null);
    reset();
    
    if (currentExIndex < lessonOne.exercises.length - 1) {
      setCurrentExIndex(prev => prev + 1);
    } else {
      saveProgress();
    }
  };

  // Função auxiliar para formatar a data do Firestore
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp.seconds * 1000).toLocaleDateString("pt-BR", {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans gap-8">
      
      {/* CARD PRINCIPAL DO QUIZ */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
        
        {/* Header da Aula */}
        <div className="bg-blue-600 p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={20} />
            <span className="text-sm font-semibold uppercase tracking-wider">Lesson {lessonOne.number}</span>
          </div>
          <h1 className="text-2xl font-bold">{lessonOne.title}</h1>
          <div className="mt-4 bg-blue-700/50 p-3 rounded text-sm">
             <p>{lessonOne.theory[0]}</p>
             <p className="font-mono mt-1 text-yellow-300">Ex: {lessonOne.theory[1]}</p>
          </div>
        </div>

        {/* Área de Prática */}
        <div className="p-6">
          <div className="mb-4">
            <span className="text-xs font-bold text-gray-400">EXERCISE {currentExIndex + 1} OF {lessonOne.exercises.length}</span>
            <h2 className="text-xl font-semibold text-slate-800 mt-1">{currentExercise.question}</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <input 
                {...register("answer")}
                type="text" 
                autoComplete="off"
                placeholder="Type in English..."
                className="w-full p-4 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-0 outline-none transition text-lg text-black"
                disabled={feedback === 'success' || isSaving}
              />
              {errors.answer && <p className="text-red-500 text-sm mt-1">{errors.answer.message}</p>}
            </div>

            {feedback === 'success' && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                <CheckCircle2 /> <span className="font-bold">Correct! Well done.</span>
              </div>
            )}

            {feedback === 'error' && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                <XCircle /> <span className="font-bold">Incorrect. Try again!</span>
              </div>
            )}

            <div className="pt-2">
              {feedback === 'success' ? (
                <button 
                  onClick={nextExercise}
                  type="button"
                  disabled={isSaving}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition flex justify-center items-center gap-2"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      {currentExIndex < lessonOne.exercises.length - 1 ? 'Next Question' : 'Finish Lesson'}
                    </>
                  )}
                </button>
              ) : (
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-blue-600/30"
                >
                  Check Answer
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* NOVO: ÁREA DE HISTÓRICO (DASHBOARD) */}
      <div className="max-w-md w-full">
        <div className="flex items-center gap-2 mb-4 text-slate-700">
          <History size={20} />
          <h3 className="font-bold text-lg">Activity History</h3>
        </div>

        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-slate-400 text-center italic">No lessons completed yet.</p>
          ) : (
            history.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-full text-yellow-600">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{item.lessonTitle}</p>
                    <p className="text-xs text-slate-500">Completed by {item.user}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {formatDate(item.completedAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

export default App;