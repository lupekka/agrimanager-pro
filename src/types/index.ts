// TIPI PRINCIPALI
export type Species = 'Maiali' | 'Cavalli' | 'Mucche' | 'Galline' | 'Oche';
export type UserRole = 'farmer' | 'consumer';
export type TreatmentType = 'Vaccino' | 'Vermifugo' | 'Visita' | 'Cura' | 'Medicazione' | 'Altro';
export type TransactionType = 'Entrata' | 'Uscita';

export interface Treatment {
  id: string;
  tipo: TreatmentType;
  dataSomministrazione: string;
  dataScadenza?: string;
  note: string;
  completed?: boolean;
}

export interface User {
  uid: string;
  email: string;
  username: string;
  farmName: string;
  location: string;
  role: UserRole;
  createdAt?: string;
}

export interface Animal { 
  id: string; 
  microchip: string;
  nome?: string;
  species: Species; 
  notes: string; 
  sire?: string; 
  dam?: string; 
  birthDate?: string; 
  ownerId: string;
  treatments?: Treatment[];
}

// NUOVO: Interfaccia per i gruppi di animali (es. cucciolate di maiali)
export interface AnimalGroup {
  id: string;
  species: Species;           // Specie (es. Maiali)
  name: string;               // Nome del gruppo (es. "Lotto Marzo 2026")
  motherMicrochip: string;    // Madre (microchip)
  fatherMicrochip?: string;   // Padre (opzionale)
  birthDate: string;          // Data di nascita
  quantity: number;           // Numero totale di nati
  currentQuantity: number;    // Numero attuale (dopo vendite/morti)
  ownerId: string;
  notes: string;
  createdAt: string;
  treatments?: Treatment[];   // Trattamenti comuni a tutto il gruppo
}

export interface Transaction { 
  id: string; 
  type: TransactionType; 
  amount: number; 
  desc: string; 
  species: Species; 
  date: string; 
  ownerId: string; 
}

export interface Task { 
  id: string; 
  text: string; 
  done: boolean; 
  dueDate?: string; 
  ownerId: string; 
}

export interface Product { 
  id: string; 
  name: string; 
  quantity: number; 
  unit: string; 
  ownerId: string; 
}

export interface StockLog { 
  id: string; 
  productName: string; 
  change: number; 
  date: string; 
  ownerId: string; 
  reason?: string;
}

export interface MarketItem { 
  id: string; 
  name: string; 
  price: number; 
  quantity: number; 
  unit: string; 
  sellerId: string; 
  sellerName: string; 
  contactEmail: string; 
  contactPhone: string; 
  createdAt: string;
  ownerId: string; 
}

export interface WeatherData {
  icon: string;
  temp: number;
  desc: string;
  advice: string;
  location: string;
  loading: boolean;
  error: string | null;
  forecast?: { date: string; max: number; min: number; icon: string }[];
}

export interface Prediction {
  className: string;
  probability: number;
}

export interface DiagnosisResult {
  title: string;
  possibleCauses: string[];
  action: string;
  severity: 'high' | 'medium' | 'low';
  visualFindings?: string[];
}

export interface ExpiringTreatment {
  animalId: string;
  animalName: string;
  species: Species;
  treatment: Treatment;
  daysLeft: number;
  isExpired: boolean;
}
