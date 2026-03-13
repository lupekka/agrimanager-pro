import emailjs from '@emailjs/browser';

// TIPI DEFINITI DIRETTAMENTE QUI
export type Species = 'Maiali' | 'Cavalli' | 'Mucche' | 'Galline' | 'Oche';
export type TreatmentType = 'Vaccino' | 'Vermifugo' | 'Visita' | 'Cura' | 'Medicazione' | 'Altro';

export interface Treatment {
  id: string;
  tipo: TreatmentType;
  dataSomministrazione: string;
  dataScadenza?: string;
  note: string;
  completed?: boolean;
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

// Configurazione EmailJS
const EMAILJS_SERVICE_ID = 'service_5v9gl8d';
const EMAILJS_TEMPLATE_ID = 'template_b9g21wr';
const EMAILJS_PUBLIC_KEY = 'NqT_cVjxLyGhwS2XF';

emailjs.init(EMAILJS_PUBLIC_KEY);

export const emailService = {
  /**
   * Invia una notifica per trattamento in scadenza
   */
  sendTreatmentReminder: async (
    userEmail: string,
    userName: string,
    animal: Animal,
    treatment: Treatment,
    daysLeft: number
  ) => {
    try {
      const templateParams = {
        to_email: userEmail,
        user_name: userName,
        animal_code: animal.microchip,
        animal_name: animal.nome || '',
        treatment_type: treatment.tipo,
        expiration_date: treatment.dataScadenza 
          ? new Date(treatment.dataScadenza).toLocaleDateString('it-IT')
          : 'N/D',
        days_left: daysLeft,
        app_url: 'https://agrimanagerpro.it/health'
      };

      console.log('📧 Invio email con parametri:', templateParams);

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );
      
      console.log('✅ Email inviata con successo:', response);
      return { success: true };
    } catch (error) {
      console.error('❌ Errore invio email:', error);
      return { success: false, error };
    }
  },

  /**
   * Invia email di test (utile per verificare configurazione)
   */
  sendTestEmail: async (toEmail: string) => {
    try {
      const templateParams = {
        to_email: toEmail,
        user_name: 'Utente di test',
        animal_code: 'TEST-001',
        animal_name: 'Test',
        treatment_type: 'Vaccino di prova',
        expiration_date: new Date().toLocaleDateString('it-IT'),
        days_left: 3,
        app_url: 'https://agrimanagerpro.it'
      };

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );
      
      console.log('✅ Email di test inviata:', response);
      return { success: true };
    } catch (error) {
      console.error('❌ Errore email di test:', error);
      return { success: false, error };
    }
  }
};
