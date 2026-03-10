import React, { useState } from 'react';
import { Syringe, PlusCircle, FileDown } from 'lucide-react';
import { useAnimals } from '../../hooks/useAnimals';
import { Treatment } from '../../types';
import { TreatmentForm } from './TreatmentForm';
import { TreatmentList } from './TreatmentList';
import { pdfService } from '../../services/pdfService';

export const HealthBook: React.FC = () => {
  const { animals, addTreatment, updateTreatment, deleteTreatment } = useAnimals();
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [newTreatment, setNewTreatment] = useState({
    tipo: 'Vaccino' as any,
    dataSomministrazione: new Date().toISOString().split('T')[0],
    dataScadenza: '',
    note: ''
  });

  const handleAddTreatment = async () => {
    if (!selectedAnimal) return alert("Seleziona un animale");
    if (!newTreatment.dataSomministrazione) return alert("Inserisci la data");
    
    const treatment: Treatment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      ...newTreatment,
      completed: false
    };
    
    await addTreatment(selectedAnimal.id, treatment);
    
    setNewTreatment({
      tipo: 'Vaccino',
      dataSomministrazione: new Date().toISOString().split('T')[0],
      dataScadenza: '',
      note: ''
    });
    setShowTreatmentForm(false);
    alert("✅ Trattamento registrato!");
  };

  const handleExportPDF = () => {
    if (animals.length === 0) {
      alert("Nessun animale da esportare");
      return;
    }
    pdfService.exportASLReport(animals);
  };

  return (
    <div className="space-y-6">
      {/* Header con pulsante esporta */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-black text-emerald-900 uppercase flex items-center gap-2">
          <Syringe size={18} className="text-emerald-600" />
          Libretto Sanitario
        </h3>
        <button
          onClick={handleExportPDF}
          className="bg-stone-800 text-white px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-stone-700"
        >
          <FileDown size={16} />
          Esporta PDF
        </button>
      </div>

      {/* Selezione animale */}
      <div className="bg-white p-5 rounded-3xl border shadow-sm">
        <div className="flex gap-3">
          <select
            className="flex-1 p-3 bg-stone-50 rounded-xl font-bold text-stone-800 text-sm border-none shadow-inner"
            value={selectedAnimal?.id || ''}
            onChange={(e) => {
              const animal = animals.find(a => a.id === e.target.value);
              setSelectedAnimal(animal || null);
              setShowTreatmentForm(false);
            }}
          >
            <option value="">-- Scegli un animale --</option>
            {animals.map(a => (
              <option key={a.id} value={a.id}>
                {a.codice} {a.nome && `(${a.nome})`} - {a.species}
              </option>
            ))}
          </select>
          
          {selectedAnimal && (
            <button
              onClick={() => setShowTreatmentForm(!showTreatmentForm)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1"
            >
              <PlusCircle size={16} />
              {showTreatmentForm ? 'Chiudi' : 'Nuovo'}
            </button>
          )}
        </div>
      </div>

      {/* Form nuovo trattamento */}
      {selectedAnimal && showTreatmentForm && (
        <TreatmentForm
          animalName={`${selectedAnimal.codice} ${selectedAnimal.nome ? `(${selectedAnimal.nome})` : ''}`}
          newTreatment={newTreatment}
          onChange={setNewTreatment}
          onSave={handleAddTreatment}
          onCancel={() => setShowTreatmentForm(false)}
        />
      )}

           {/* Lista trattamenti */}
      <TreatmentList
        animals={animals}
        selectedAnimal={selectedAnimal}
        onSelectAnimal={setSelectedAnimal}
        onCompleteTreatment={(animalId, treatmentId) => 
          updateTreatment(animalId, treatmentId, { completed: true })
        }
        onDeleteTreatment={deleteTreatment}
      />
    </div>
  );
};
