import emailjs from '@emailjs/browser';

// Configurazione EmailJS
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

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );
      
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }
};
