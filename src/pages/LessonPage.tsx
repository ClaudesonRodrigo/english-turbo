import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, XCircle, BookOpen, ArrowLeft, Lightbulb } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { AudioButton } from '../components/AudioButton';
import type { Lesson } from '../types';
// Importamos o Auth para saber QUEM está fazendo a lição
import { useAuth } from '../contexts/AuthContext';

const answerSchema = z.object({
  answer: z.string().min(1, "Sua resposta não pode estar vazia"),
});

type AnswerForm = z.infer<typeof answerSchema>;

export function LessonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Pegamos o usuário logado
  
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [attempts, setAttempts] = useState(0);
  const [showHintBtn, setShowHintBtn] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AnswerForm>({
    resolver: zodResolver(answerSchema),
  });

  useEffect(() => {
    async function loadLesson() {
      if (!id) return;
      try {
        const docRef = doc(db, "lessons", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCurrentLesson({ id: docSnap.id, ...docSnap.data() } as Lesson);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Erro ao buscar lição:", error);
      } finally {
        setLoading(false);
      }
    }
    loadLesson();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center">Carregando aula...</div>;

  if (!currentLesson) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold text-slate-700">Lição não encontrada 😕</h1>
        <Link to="/" className="text-blue-600 hover:underline">Voltar para Home</Link>
      </div>
    );
  }

  const currentExercise = currentLesson.exercises[currentExIndex];

  const onSubmit = (data: AnswerForm) => {
    const normalizedUserAnswer = data.answer.trim().toLowerCase();
    const normalizedCorrect = currentExercise.correctAnswer.toLowerCase();

    if (normalizedUserAnswer === normalizedCorrect) {
      setFeedback('success');
      setAttempts(0);
      setShowHintBtn(false);
      setHintVisible(false);
    } else {
      setFeedback('error');
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setShowHintBtn(true);
      }
    }
  };

  const saveProgress = async () => {
    if (!user) return; // Segurança extra

    try {
      setIsSaving(true);
      // AGORA SALVAMOS OS DADOS REAIS DO USUÁRIO
      await addDoc(collection(db, "progress"), {
        lessonId: currentLesson.id,
        lessonTitle: currentLesson.title,
        completedAt: new Date(),
        user: user.displayName || "Usuário sem nome", // Nome do Google
        userId: user.uid, // ID Único (Segredo do sucesso)
        email: user.email // Útil para o professor saber quem é
      });
      alert("Lesson Finished! Progress Saved! 🚀");
      navigate("/");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const nextExercise = () => {
    setFeedback(null);
    reset();
    setAttempts(0);
    setShowHintBtn(false);
    setHintVisible(false);

    if (currentExIndex < currentLesson.exercises.length - 1) {
      setCurrentExIndex(prev => prev + 1);
    } else {
      saveProgress();
    }
  };

  const getHint = () => {
    const answer = currentExercise.correctAnswer;
    const limit = Math.max(4, Math.floor(answer.length / 3));
    return answer.substring(0, limit) + "...";
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden relative">
        
        <Link to="/" className="absolute top-6 right-6 text-white/80 hover:text-white transition z-10">
           <ArrowLeft />
        </Link>

        <div className="bg-blue-600 p-6 text-white relative">
          <div className="flex flex-col gap-4 mb-2">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={20} />
                <span className="text-sm font-semibold uppercase tracking-wider">Lesson {currentLesson.number}</span>
              </div>
              <h1 className="text-2xl font-bold">{currentLesson.title}</h1>
            </div>
            
            <div className="self-start">
                <AudioButton text={`${currentLesson.title}. ${currentLesson.theory.join('. ')}`} />
            </div>
          </div>

          <div className="mt-4 bg-blue-700/50 p-3 rounded text-sm space-y-3">
             {currentLesson.theory.map((line, idx) => (
               <div key={idx} className="flex justify-between items-center bg-blue-800/30 p-2 rounded">
                 <p className="flex-1 mr-2">{line}</p>
                 <div>
                    <AudioButton text={line} />
                 </div>
               </div>
             ))}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <span className="text-xs font-bold text-gray-400">EXERCISE {currentExIndex + 1} OF {currentLesson.exercises.length}</span>
            <div className="flex flex-col gap-2 mt-1">
                <h2 className="text-xl font-semibold text-slate-800">{currentExercise.question}</h2>
                <div className="self-start">
                  <AudioButton text={currentExercise.question.replace('Traduza:', '').replace('Responda:', '')} />
                </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <div className="relative">
                <input 
                  {...register("answer")}
                  type="text" 
                  autoComplete="off"
                  placeholder="Type in English..."
                  className="w-full p-4 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-0 outline-none transition text-lg text-black pr-12"
                  disabled={feedback === 'success' || isSaving}
                />
                
                {feedback === 'success' && (
                  <CheckCircle2 className="absolute right-4 top-4 text-green-500 animate-bounce" />
                )}
                {feedback === 'error' && (
                  <XCircle className="absolute right-4 top-4 text-red-500 animate-pulse" />
                )}
              </div>
              {errors.answer && <p className="text-red-500 text-sm mt-1">{errors.answer.message}</p>}
            </div>

            {showHintBtn && feedback !== 'success' && (
              <div className="animate-fade-in bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                {!hintVisible ? (
                  <button 
                    type="button"
                    onClick={() => setHintVisible(true)}
                    className="flex items-center gap-2 text-yellow-700 font-bold text-sm w-full hover:underline"
                  >
                    <Lightbulb size={18} />
                    Precisa de ajuda? (3 erros detectados)
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <Lightbulb size={18} className="text-yellow-500" />
                    <span>Dica: Começa com <strong>"{getHint()}"</strong></span>
                  </div>
                )}
              </div>
            )}

            {feedback === 'success' && (
              <div className="bg-green-100 text-green-800 p-3 rounded-lg text-center font-bold">
                Correct! Well done! 🎉
              </div>
            )}

            {feedback === 'error' && (
              <div className="bg-red-100 text-red-800 p-3 rounded-lg text-center font-bold">
                 Incorrect. Try again! ({attempts} attempt{attempts > 1 ? 's' : ''})
              </div>
            )}

            <div className="pt-2">
              {feedback === 'success' ? (
                <button 
                  onClick={nextExercise}
                  type="button"
                  disabled={isSaving}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
                >
                  {currentExIndex < currentLesson.exercises.length - 1 ? 'Next Question' : 'Finish & Save'}
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
    </div>
  );
}