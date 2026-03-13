import { useState, useCallback } from "react";
import { emailService } from "../services/emailService";
import { useAuth } from "./useAuth";

// TIPI DEFINITI DIRETTAMENTE QUI
export interface Treatment {
  id: string;
  tipo: string;
  dataSomministrazione: string;
  dataScadenza?: string;
  note: string;
  completed?: boolean;
}

export interface Animal {
  id: string;
  microchip: string;
  nome?: string;
  species: string;
  notes: string;
  sire?: string;
  dam?: string;
  birthDate?: string;
  ownerId: string;
  treatments?: Treatment[];
}

export interface ExpiringTreatment {
  animalId: string;
  animalName: string;
  species: string;
  treatment: Treatment;
  daysLeft: number;
  isExpired: boolean;
}

export const useNotifications = () => {
  const { user, userName } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem("emailNotifications") !== "false"
  );

  const checkExpiringTreatments = useCallback(
    (animals: Animal[]): ExpiringTreatment[] => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiring: ExpiringTreatment[] = [];

      animals.forEach((animal) => {
        animal.treatments?.forEach((treatment) => {
          if (treatment.dataScadenza && !treatment.completed) {
            const scadenza = new Date(treatment.dataScadenza);
            scadenza.setHours(0, 0, 0, 0);

            const diffTime = scadenza.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const isExpired = diffDays < 0;
            const isExpiring = !isExpired && diffDays <= 7;

            if (isExpiring || isExpired) {
              expiring.push({
                animalId: animal.id,
                animalName: animal.microchip,
                species: animal.species,
                treatment,
                daysLeft: diffDays,
                isExpired,
              });
            }

            // 📧 INVIA EMAIL per trattamenti in scadenza
            if (
              notificationsEnabled &&
              !isExpired &&
              diffDays <= 7 &&
              diffDays >= 0 &&
              user?.email
            ) {
              const notificationKey = `${animal.id}_${treatment.id}_${diffDays}`;
              const sentNotifications = JSON.parse(
                localStorage.getItem("sentEmailNotifications") || "[]"
              );

              if (!sentNotifications.includes(notificationKey)) {
                emailService.sendTreatmentReminder(
                  user.email,
                  userName || "Utente",
                  animal.microchip,
                  animal.nome,
                  treatment.tipo,
                  treatment.dataScadenza,
                  diffDays
                );

                sentNotifications.push(notificationKey);
                localStorage.setItem(
                  "sentEmailNotifications",
                  JSON.stringify(sentNotifications)
                );
              }
            }
          }
        });
      });

      return expiring;
    },
    [user, userName, notificationsEnabled]
  );

  return {
    notificationsEnabled,
    setNotificationsEnabled,
    checkExpiringTreatments,
  };
};
