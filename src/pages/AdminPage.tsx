import { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { UploadCloud, CheckCircle, AlertTriangle, Database } from 'lucide-react';
import lessonsData from '../data/db-seed.json'; // Importa o JSON direto

export function AdminPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [log, setLog] = useState<string[]>([]);

  const handleUpload = async () => {
    if (!confirm("Tem certeza? Isso vai sobrescrever as lições no Banco de Dados com os dados do JSON.")) return;

    setStatus('loading');
    setLog([]);
    
    try {
      // Usamos Batch para ser mais eficiente (várias gravações de uma vez)
      const batch = writeBatch(db);
      const newLog = [];

      newLog.push(`Iniciando upload de ${lessonsData.length} lições...`);

      lessonsData.forEach((lesson) => {
        // Cria a referência: Coleção 'lessons', Documento com o ID da lição (ex: 'lesson-01')
        const docRef = doc(db, "lessons", lesson.id);
        batch.set(docRef, lesson);
        newLog.push(`Preparei: ${lesson.title} (${lesson.id})`);
      });

      newLog.push("Enviando dados para o Firestore...");
      setLog(newLog);

      await batch.commit();

      setStatus('success');
      setLog(prev => [...prev, "✅ SUCESSO! Todas as lições foram salvas na nuvem."]);

    } catch (error) {
      console.error(error);
      setStatus('error');
      setLog(prev => [...prev, "❌ ERRO: Verifique o console para detalhes."]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <header className="border-b border-slate-700 pb-4">
          <h1 className="text-3xl font-bold flex items-center gap-3 text-red-500">
            <Database /> Área Administrativa (Secret)
          </h1>
          <p className="text-slate-400 mt-2">
            Use esta ferramenta para popular o banco de dados do English Turbo.
          </p>
        </header>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Carregar Lições do JSON</h2>
          <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-lg border border-slate-700 mb-6">
            <div className="bg-blue-900/50 p-3 rounded-lg text-blue-400">
              <span className="font-mono text-lg">{lessonsData.length}</span>
            </div>
            <div>
              <p className="font-bold text-slate-200">Lições detectadas</p>
              <p className="text-sm text-slate-500">No arquivo src/data/db-seed.json</p>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={status === 'loading'}
            className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition ${
              status === 'loading' 
                ? 'bg-slate-600 cursor-wait' 
                : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20'
            }`}
          >
            {status === 'loading' ? (
              <>Enviando...</>
            ) : (
              <><UploadCloud /> Upload para Firebase</>
            )}
          </button>
        </div>

        {/* LOGS DE OPERAÇÃO */}
        <div className="bg-black/50 rounded-xl p-6 font-mono text-sm h-64 overflow-y-auto border border-slate-800">
          <p className="text-slate-500 mb-2">// Console de Logs...</p>
          {log.map((line, idx) => (
            <p key={idx} className="mb-1 text-green-400 border-l-2 border-green-900 pl-2">
              {line}
            </p>
          ))}
          {status === 'success' && (
            <div className="mt-4 p-3 bg-green-900/20 text-green-400 border border-green-900 rounded flex items-center gap-2">
              <CheckCircle size={16} /> Upload Concluído. Agora o App pode ler do Firebase!
            </div>
          )}
          {status === 'error' && (
            <div className="mt-4 p-3 bg-red-900/20 text-red-400 border border-red-900 rounded flex items-center gap-2">
              <AlertTriangle size={16} /> Falha no Upload.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}