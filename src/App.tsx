import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
// Importante: Verifique se o caminho abaixo bate com suas pastas
import { lessonOne } from './data/seed'; 
import { CheckCircle2, XCircle, BookOpen } from 'lucide-react';

const answerSchema = z.object({
  answer: z.string().min(1, "Sua resposta não pode estar vazia"),
});

type AnswerForm = z.infer<typeof answerSchema>;

function App() {
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  
  const currentExercise = lessonOne.exercises[currentExIndex];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AnswerForm>({
    resolver: zodResolver(answerSchema),
  });

  const onSubmit = (data: AnswerForm) => {
    const normalizedUserAnswer = data.answer.trim().toLowerCase();
    const normalizedCorrect = currentExercise.correctAnswer.toLowerCase();

    if (normalizedUserAnswer === normalizedCorrect) {
      setFeedback('success');
    } else {
      setFeedback('error');
    }
  };

  const nextExercise = () => {
    setFeedback(null);
    reset();
    if (currentExIndex < lessonOne.exercises.length - 1) {
      setCurrentExIndex(prev => prev + 1);
    } else {
      alert("Lesson Finished! Parabéns Carioca!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
        
        {/* Header da Aula */}
        <div className="bg-blue-600 p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={20} />
            <span className="text-sm font-semibold uppercase tracking-wider">Lesson {lessonOne.number}</span>
          </div>
          <h1 className="text-2xl font-bold">{lessonOne.title}</h1>
          {/* Exibindo a teoria básica */}
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
                disabled={feedback === 'success'}
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
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
                >
                  Next Question
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

export default App;