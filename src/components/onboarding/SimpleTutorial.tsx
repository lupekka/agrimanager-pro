import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';

interface SimpleTutorialProps {
  onComplete: () => void;
  userName?: string;
}

const steps = [
  {
    title: "👋 BENVENUTO IN AGRIMANAGER PRO!",
    description: "Ciao {name}, benvenuto! Questa app ti aiuterà a gestire la tua azienda agricola in modo semplice e veloce.",
    image: "📱",
    tip: "Useremo solo parole semplici e tante immagini. Niente paura!"
  },
  {
    title: "📊 LA DASHBOARD",
    description: "Questa è la tua HOME. Appena apri l'app vedrai subito:",
    bullets: [
      "🐷 Quanti animali hai",
      "✅ I compiti da fare oggi",
      "💰 Quanti soldi hai guadagnato e speso"
    ],
    image: "🏠",
    tip: "È come il cruscotto della tua macchina: tutto sotto controllo!"
  },
  {
    title: "🐷 I TUOI ANIMALI",
    description: "Qui puoi aggiungere tutti i tuoi animali, uno per uno.",
    bullets: [
      "📝 Dai un nome a ogni animale",
      "🎂 Segna la data di nascita",
      "👪 Registra mamma e papà",
      "💉 Annota cure e vaccini"
    ],
    image: "🐮🐷🐔",
    tip: "Puoi aggiungere anche una foto se vuoi!"
  },
  {
    title: "💉 LIBRETTO SANITARIO",
    description: "Per ogni animale puoi tenere traccia di:",
    bullets: [
      "💊 Vaccini",
      "🏥 Visite dal veterinario",
      "⚠️ Cure speciali",
      "📅 Promemoria scadenze"
    ],
    image: "🩺",
    tip: "L'app ti ricorderà quando serve un richiamo!"
  },
  {
    title: "💰 I SOLDI",
    description: "Tieni sotto controllo le tue finanze:",
    bullets: [
      "📈 Quello che guadagni (vendite)",
      "📉 Quello che spendi (mangimi, cure)",
      "🧾 Tutto diviso per specie animale"
    ],
    image: "💶",
    tip: "A fine mese avrai tutto pronto per il commercialista!"
  },
  {
    title: "📦 MAGAZZINO",
    description: "Non dimenticare mai cosa hai in magazzino:",
    bullets: [
      "🌾 Mangimi",
      "💊 Medicinali",
      "🛠️ Attrezzature",
      "🛒 Pubblica quello che vendi"
    ],
    image: "📦",
    tip: "Ti avviseremo quando le scorte sono basse!"
  },
  {
    title: "📅 AGENDA",
    description: "Organizza la tua giornata:",
    bullets: [
      "✅ Lista delle cose da fare",
      "📌 Scadenze importanti",
      "⏰ Promemoria"
    ],
    image: "📋",
    tip: "Spunta le cose fatte e vedi cosa resta da fare!"
  },
  {
    title: "🤖 ASSISTENTE INTELLIGENTE",
    description: "Hai un dubbio? Puoi chiedere all'assistente:",
    bullets: [
      "🗣️ Scrivi 'Venduto maiale 100€' e lui registra la vendita",
      "🤒 Descrivi i sintomi di un animale e lui ti dà un consiglio",
      "📸 Scatta una foto e lui analizza il problema"
    ],
    image: "🤖",
    tip: "Non sostituisce il veterinario, ma può aiutarti!"
  },
  {
    title: "🛒 MARKET",
    description: "Compra e vendi con altri agricoltori:",
    bullets: [
      "🥚 Vendi le uova in eccedenza",
      "🌾 Compra mangime dai vicini",
      "🤝 Tutto a Km 0"
    ],
    image: "🏪",
    tip: "Contatta direttamente su WhatsApp chi vende!"
  },
  {
    title: "🎉 ORA SEI PRONTO!",
    description: "Hai visto tutto quello che serve per iniziare. Ricorda:",
    bullets: [
      "❓ Se hai dubbi, clicca sul punto interrogativo",
      "🔄 Puoi rivedere questo tutorial dalle Impostazioni",
      "📞 Supporto sempre disponibile"
    ],
    image: "🚀",
    tip: "Buon lavoro e buona agricoltura!"
  }
];

export const SimpleTutorial: React.FC<SimpleTutorialProps> = ({ onComplete, userName = "Agricoltore" }) => {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
      localStorage.setItem('tutorialCompletato', 'true');
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-4 border-emerald-500 relative">
        
        {/* Barra di progresso */}
        <div className="h-2 bg-stone-200 rounded-t-3xl overflow-hidden">
          <div 
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Pulsante chiudi (sempre visibile) */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 bg-stone-200 hover:bg-stone-300 rounded-full p-2 transition-colors z-10"
          title="Salta tutorial"
        >
          <X size={24} className="text-stone-700" />
        </button>

        {/* Contenuto */}
        <div className="p-8">
          
          {/* Numero passo (grande e chiaro) */}
          <div className="text-center mb-4">
            <span className="inline-block bg-emerald-100 text-emerald-800 font-black text-sm px-4 py-1 rounded-full">
              PASSO {step + 1} DI {steps.length}
            </span>
          </div>

          {/* Emoji gigante */}
          <div className="text-8xl text-center mb-6 animate-bounce">
            {currentStep.image}
          </div>

          {/* Titolo grande */}
          <h2 className="text-3xl font-black text-emerald-900 text-center mb-4">
            {currentStep.title.replace('{name}', userName)}
          </h2>

          {/* Descrizione */}
          <p className="text-lg text-stone-700 text-center mb-6">
            {currentStep.description}
          </p>

          {/* Punti elenco (se presenti) */}
          {currentStep.bullets && (
            <div className="bg-stone-50 rounded-2xl p-5 mb-6 border-2 border-stone-200">
              <p className="font-black text-emerald-800 mb-3 text-sm uppercase">RIEPILOGO:</p>
              <ul className="space-y-3">
                {currentStep.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3 text-base">
                    <span className="text-emerald-600 font-bold text-xl">•</span>
                    <span className="text-stone-700">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Consiglio speciale */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6">
            <p className="text-sm font-black text-amber-800 mb-1">💡 CONSIGLIO:</p>
            <p className="text-base text-amber-900">{currentStep.tip}</p>
          </div>

          {/* Bottoni di navigazione (GRANDI) */}
          <div className="flex gap-3 mt-4">
            {step > 0 ? (
              <button
                onClick={handlePrev}
                className="flex-1 bg-stone-200 text-stone-800 py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:bg-stone-300 transition-colors"
              >
                <ArrowLeft size={24} />
                INDIETRO
              </button>
            ) : (
              <div className="flex-1" /> // Spazio vuoto per bilanciare
            )}
            
            <button
              onClick={handleNext}
              className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg"
            >
              {step === steps.length - 1 ? (
                <>FINITO <Check size={24} /></>
              ) : (
                <>AVANTI <ArrowRight size={24} /></>
              )}
            </button>
          </div>

          {/* Testo piccolo per uscita */}
          <p className="text-center text-stone-400 text-sm mt-4">
            Puoi uscire in qualsiasi momento cliccando sulla X in alto
          </p>
        </div>
      </div>
    </div>
  );
};
