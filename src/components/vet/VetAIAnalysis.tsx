import React, { useState, useEffect, useRef } from 'react';
import { Stethoscope, Camera, UploadCloud, Activity, AlertTriangle, MessageCircle } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { DiagnosisResult, Prediction } from '../../types';
import { SymptomSelector } from './SymptomSelector';
import { DiagnosisResult as DiagnosisResultComponent } from './DiagnosisResult';

export const VetAIAnalysis: React.FC = () => {
  const [vetSymptom, setVetSymptom] = useState('');
  const [vetImage, setVetImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [vetResult, setVetResult] = useState<DiagnosisResult | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [model, setModel] = useState<any>(null);

  useEffect(() => {
    const loadModel = async () => {
      if (!model && !modelLoading && !modelError) {
        setModelLoading(true);
        try {
          const loadedModel = await aiService.loadModel();
          setModel(loadedModel);
        } catch (error) {
          setModelError("Errore caricamento AI. Usa solo sintomi.");
        } finally {
          setModelLoading(false);
        }
      }
    };
    loadModel();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setVetImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageElement: HTMLImageElement): Promise<Prediction[]> => {
    if (!model) return [];
    try {
      return await aiService.analyzeImage(imageElement);
    } catch (error) {
      console.error("Errore analisi immagine:", error);
      return [];
    }
  };

  const handleAnalyze = async () => {
    if (!vetSymptom.trim() && !vetImage) {
      alert("Inserisci almeno un sintomo o carica una foto");
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      let aiPredictions: Prediction[] = [];
      let visualDesc = "";
      
      if (vetImage && model) {
        const img = document.getElementById('vet-analysis-image') as HTMLImageElement;
        if (img && img.complete) {
          aiPredictions = await analyzeImage(img);
          
          if (aiPredictions.length > 0) {
            visualDesc = `📸 Analisi foto: ${aiPredictions.map(p => 
              `${p.className.split(',')[0]} (${Math.round(p.probability*100)}%)`
            ).join(', ')}. `;
          }
        }
      }
      
      const diagnosis = aiService.getDiagnosisFromSymptoms(vetSymptom);
      
      setVetResult({
        ...diagnosis,
        visualFindings: aiPredictions.map(p => `${p.className.split(',')[0]} (${Math.round(p.probability*100)}%)`),
      });
    } catch (error) {
      console.error("Errore analisi:", error);
      alert("Errore durante l'analisi.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border shadow-xl max-w-lg mx-auto border-t-8 border-blue-600">
      <div className="bg-blue-600 p-6 rounded-2xl text-white mb-6 flex items-center gap-4 shadow-lg">
        <Stethoscope size={40} strokeWidth={1} />
        <div>
          <h3 className="text-xl font-black uppercase italic leading-none mb-1">Diagnosi Veterinaria IA</h3>
          <p className="text-blue-100 text-[10px] uppercase tracking-widest">
            {modelLoading ? "⏳ Caricamento AI..." : model ? "✓ AI Pronta" : "Analisi senza foto"}
          </p>
        </div>
      </div>

      {modelLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2">
            <Activity className="animate-spin text-blue-600" size={16} />
            <p className="text-[10px] font-bold text-blue-800">Caricamento AI in corso...</p>
          </div>
        </div>
      )}

      {modelError && !modelLoading && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
          <AlertTriangle size={16} className="text-amber-600 mx-auto mb-1" />
          <p className="text-[9px] font-bold text-amber-800">{modelError}</p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {/* Upload foto */}
        <div>
          <p className="text-[10px] font-black text-stone-700 uppercase mb-2 flex items-center gap-2">
            <Camera size={14} /> Foto del sintomo
          </p>
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-blue-50 transition-all bg-stone-50">
            {vetImage ? (
              <div className="relative w-full h-full">
                <img 
                  src={vetImage} 
                  alt="Sintomo" 
                  className="w-full h-full object-cover rounded-2xl"
                  id="vet-analysis-image"
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setVetImage(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="text-center p-4">
                <UploadCloud size={32} className="text-stone-400 mx-auto mb-2" />
                <p className="text-[9px] font-bold text-stone-600">CLICCA PER CARICARE FOTO</p>
                <p className="text-[7px] text-stone-400 mt-1">(opzionale, migliora la diagnosi)</p>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>

        {/* Sintomi */}
        <div>
          <p className="text-[10px] font-black text-stone-700 uppercase mb-2 flex items-center gap-2">
            <MessageCircle size={14} /> Sintomi osservati
          </p>
          
          <SymptomSelector onSelect={(s) => {
            setVetSymptom(prev => prev ? `${prev}, ${s}` : s);
          }} />

          <textarea
            className="w-full p-4 bg-stone-50 rounded-2xl font-bold text-sm h-32 shadow-inner text-stone-800 resize-none"
            placeholder="Descrivi i sintomi in dettaglio..."
            value={vetSymptom}
            onChange={e => setVetSymptom(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="w-full bg-stone-900 text-white py-4 rounded-xl font-black uppercase text-sm shadow-lg hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isAnalyzing ? (
          <><Activity className="animate-spin" size={16} /> ANALISI IN CORSO...</>
        ) : (
          <><Stethoscope size={16} /> ANALIZZA SINTOMI {model ? 'E FOTO' : ''}</>
        )}
      </button>

      {vetResult && (
        <DiagnosisResultComponent 
          result={vetResult} 
          onReset={() => {
            setVetResult(null);
            setVetSymptom('');
            setVetImage(null);
          }}
        />
      )}
    </div>
  );
};