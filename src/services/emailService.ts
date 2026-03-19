import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = 'service_5v9gl8d';
const EMAILJS_TEMPLATE_ID = 'template_b9g21wr';
const EMAILJS_PUBLIC_KEY = 'NqT_cVjxLyGhwS2XF';

emailjs.init(EMAILJS_PUBLIC_KEY);

export const emailService = {
  sendTreatmentReminder: async (
    userEmail: string,
    userName: string,
    animalMicrochip: string,
    animalName: string | undefined,
    treatmentType: string,
    expirationDate: string | undefined,
    daysLeft: number
  ) => {
    try {
      // 🔍 LOG 1: Valori ricevuti dalla chiamata
      console.log('📧 EMAILJS - VALORI RICEVUTI:', {
        userEmail,
        userName,
        animalMicrochip,
        animalName,
        treatmentType,
        expirationDate,
        daysLeft
      });

      const templateParams = {
        to_email: userEmail,
        user_name: userName,
        animal_code: animalMicrochip,
        animal_name: animalName || '',
        treatment_type: treatmentType,
        expiration_date: expirationDate || 'N/D',
        days_left: daysLeft,
        app_url: 'https://agrimanagerpro.it/health'
      };

      // 🔍 LOG 2: Parametri pronti per l'invio
      console.log('📧 EMAILJS - PARAMETRI PRONTI:', templateParams);

      // 🔍 LOG 3: Tentativo di invio
      console.log('📧 EMAILJS - INVIO IN CORSO...', {
        serviceId: EMAILJS_SERVICE_ID,
        templateId: EMAILJS_TEMPLATE_ID
      });

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID, 
        EMAILJS_TEMPLATE_ID, 
        templateParams
      );

      // 🔍 LOG 4: Successo
      console.log('✅ EMAILJS - INVIO RIUSCITO:', response);
      return { success: true, response };

    } catch (error: any) {
      // 🔍 LOG 5: Errore dettagliato
      console.error('❌ EMAILJS - ERRORE COMPLETO:', {
        name: error.name,
        message: error.message,
        text: error.text,
        status: error.status,
        stack: error.stack
      });

      // Se c'è un errore di validazione del template
      if (error.text?.includes('variable is damaged')) {
        console.error('❌ EMAILJS - ERRORE VARIABILI: Controlla che i nomi nel template corrispondano esattamente');
      }

      return { success: false, error };
    }
  }
};
