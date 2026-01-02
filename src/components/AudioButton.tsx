import { Volume2 } from 'lucide-react';

interface AudioButtonProps {
  text: string;
}

export function AudioButton({ text }: AudioButtonProps) {
  const speak = () => {
    // Cancela qualquer fala anterior para não encavalar
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // Define inglês americano
    utterance.rate = 0.8; // Velocidade um pouco mais lenta (0.8x) para facilitar o estudo
    
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button 
      onClick={speak}
      type="button"
      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-sm font-semibold transition-all active:scale-95"
      title="Ouvir pronúncia"
    >
      <Volume2 size={16} />
      Listen
    </button>
  );
}