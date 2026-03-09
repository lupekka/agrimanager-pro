import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';
import { DiagnosisResult, Prediction } from '../types';
import { diagnoses } from '../utils/constants';

let modelInstance: mobilenet.MobileNet | null = null;
let modelLoading = false;
let modelLoadPromise: Promise<mobilenet.MobileNet> | null = null;

export const aiService = {
  async loadModel(): Promise<mobilenet.MobileNet> {
    if (modelInstance) return modelInstance;
    if (modelLoadPromise) return modelLoadPromise;
    
    modelLoading = true;
    modelLoadPromise = (async () => {
      try {
        await tf.setBackend('webgl');
        modelInstance = await mobilenet.load();
        return modelInstance;
      } catch (error) {
        console.error("Errore caricamento modello:", error);
        modelLoadPromise = null;
        throw error;
      } finally {
        modelLoading = false;
      }
    })();
    
    return modelLoadPromise;
  },

  async analyzeImage(imageElement: HTMLImageElement): Promise<Prediction[]> {
    try {
      const model = await this.loadModel();
      const predictions = await model.classify(imageElement);
      return predictions.slice(0, 5);
    } catch (error) {
      console.error("Errore analisi immagine:", error);
      return [];
    }
  },

  getDiagnosisFromSymptoms(symptoms: string): DiagnosisResult {
    const s = symptoms.toLowerCase();
    
    for (const diag of diagnoses) {
      for (const keyword of diag.keywords) {
        if (s.includes(keyword)) {
          return {
            title: diag.name,
            possibleCauses: diag.causes,
            action: diag.action,
            severity: diag.severity
          };
        }
      }
    }
    
    return {
      title: "Sintomi Aspecifici",
      possibleCauses: ["Stress", "Malessere generale", "Infezione in fase iniziale", "Problemi ambientali"],
      action: "MONITORARE L'EVOLUZIONE, RACCOGLIERE PIÙ INFORMAZIONI, CONTATTARE VETERINARIO SE NECESSARIO",
      severity: "low"
    };
  },

  isModelLoaded(): boolean {
    return modelInstance !== null;
  }
};