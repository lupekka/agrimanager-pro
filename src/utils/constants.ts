import { Species, TreatmentType } from '../types';

export const speciesList: Species[] = ['Maiali', 'Cavalli', 'Mucche', 'Galline', 'Oche'];
export const treatmentTypes: TreatmentType[] = ['Vaccino', 'Vermifugo', 'Visita', 'Cura', 'Medicazione', 'Altro'];

export const weatherAdviceMap: { [key: number]: { icon: string; description: string; advice: string } } = {
  0: { icon: "☀️", description: "Sereno", advice: "LAVORI ALL'APERTO OTTIMALI" },
  1: { icon: "🌤️", description: "Poco nuvoloso", advice: "IDEALE PER LAVORI IN CAMPAGNA" },
  2: { icon: "⛅", description: "Parzialmente nuvoloso", advice: "LAVORABILE" },
  3: { icon: "☁️", description: "Nuvoloso", advice: "CONSIGLIATO LAVORO AL COPERTO" },
  45: { icon: "🌫️", description: "Nebbia", advice: "ATTENZIONE VISIBILITÀ RIDOTTA" },
  48: { icon: "🌫️", description: "Nebbia con ghiaccio", advice: "RISCHIO GHIACCIO, ATTENZIONE" },
  51: { icon: "🌧️", description: "Pioggerella leggera", advice: "POSSIBILI LAVORI AL COPERTO" },
  53: { icon: "🌧️", description: "Pioggerella moderata", advice: "LAVORI AL COPERTO" },
  55: { icon: "🌧️", description: "Pioggerella intensa", advice: "EVITARE LAVORI ESTERNI" },
  56: { icon: "🌧️", description: "Pioggerella ghiacciata", advice: "ALLERTA GHIACCIO" },
  61: { icon: "🌧️", description: "Pioggia leggera", advice: "RIPARARE GLI ANIMALI" },
  63: { icon: "🌧️", description: "Pioggia moderata", advice: "MANTENERE GLI ANIMALI AL COPERTO" },
  65: { icon: "🌧️", description: "Pioggia intensa", advice: "EVITARE USCITE" },
  66: { icon: "🌧️", description: "Pioggia ghiacciata", advice: "PERICOLO, RIPARARE TUTTO" },
  67: { icon: "🌧️", description: "Pioggia ghiacciata intensa", advice: "EMERGENZA, PROTEGGERE GLI ANIMALI" },
  71: { icon: "❄️", description: "Neve leggera", advice: "CONTROLLARE RISCALDAMENTO" },
  73: { icon: "❄️", description: "Neve moderata", advice: "PROTEGGERE DAL FREDDO" },
  75: { icon: "❄️", description: "Neve intensa", advice: "EMERGENZA NEVE" },
  77: { icon: "❄️", description: "Neve granulare", advice: "ATTENZIONE AL GHIACCIO" },
  80: { icon: "🌧️", description: "Rovesci leggeri", advice: "LAVORI AL COPERTO" },
  81: { icon: "🌧️", description: "Rovesci moderati", advice: "RIPARARE GLI ANIMALI" },
  82: { icon: "🌧️", description: "Rovesci violenti", advice: "EVITARE USCITE" },
  85: { icon: "❄️", description: "Rovesci di neve leggeri", advice: "CONTROLLARE TEMPERATURA" },
  86: { icon: "❄️", description: "Rovesci di neve intensi", advice: "EMERGENZA" },
  95: { icon: "⛈️", description: "Temporale", advice: "PERICOLO, RIPARARE GLI ANIMALI" },
  96: { icon: "⛈️", description: "Temporale con grandine", advice: "EMERGENZA, PROTEGGERE TUTTO" },
  99: { icon: "⛈️", description: "Temporale violento", advice: "ALLERTA MASSIMA" }
};

export const commonSymptoms = ['Febbre', 'Tosse', 'Diarrea', 'Zoppia', 'Gonfiore', 'Ferita', 'Inappetenza', 'Letargia', 'Respiro'];

export const diagnoses = [
  {
    name: "Infezione Respiratoria",
    keywords: ['tosse', 'starnuti', 'naso', 'respira', 'febbre', 'dispnea', 'fiatone'],
    causes: ["Influenza", "Bronchite", "Polmonite", "Mycoplasma"],
    action: "ISOLARE IL CAPO, MISURARE TEMPERATURA, GARANTIRE VENTILAZIONE, CONTATTARE VETERINARIO",
    severity: "high" as const
  },
  {
    name: "Problema Gastrointestinale",
    keywords: ['diarrea', 'feci liquide', 'vomito', 'stomaco', 'intestino', 'disidrata'],
    causes: ["Parassiti intestinali", "Infezione batterica", "Coccidiosi", "Alimentazione scorretta"],
    action: "SOSPENDERE ALIMENTAZIONE PER 12H, GARANTIRE ACQUA CON ELETTROLITI, CONTATTARE VETERINARIO",
    severity: "high" as const
  },
  {
    name: "Patologia Podale",
    keywords: ['zoppia', 'zampa', 'piede', 'arto', 'gamba', 'ungula', 'zoccolo'],
    causes: ["Ascesso podale", "Panaritium", "Corpo estraneo", "Artrite"],
    action: "ISPEZIONARE L'ARTO, PULIRE LA FERITA, APPLICARE DISINFETTANTE, CONTATTARE VETERINARIO",
    severity: "medium" as const
  },
  {
    name: "Lesione Cutanea",
    keywords: ['ferita', 'lesione', 'taglio', 'abrasione', 'pelle', 'cute', 'piaga'],
    causes: ["Ferita traumatica", "Dermatite", "Infezione cutanea", "Parassiti esterni"],
    action: "PULIRE CON DISINFETTANTE, APPLICARE POMPATA, MONITORARE SEGNI DI INFEZIONE",
    severity: "medium" as const
  },
  {
    name: "Gonfiore/Tumefazione",
    keywords: ['gonfio', 'gonfiore', 'tumefazione', 'edema', 'palla'],
    causes: ["Ascesso", "Edema", "Reazione allergica", "Trauma"],
    action: "APPLICARE GHIACCIO, MONITORARE L'EVOLUZIONE, CONTATTARE VETERINARIO SE PERSISTE",
    severity: "medium" as const
  },
  {
    name: "Sintomi Generali",
    keywords: ['febbre', 'inappetenza', 'non mangia', 'letargia', 'stanco', 'abbattuto'],
    causes: ["Infezione sistemica", "Stress", "Dolore", "Patologia metabolica"],
    action: "MISURARE TEMPERATURA, MONITORARE COMPORTAMENTO, CONTATTARE VETERINARIO",
    severity: "medium" as const
  }
];