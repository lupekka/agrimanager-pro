import React, { useState } from 'react';
import { Baby, Users, User } from 'lucide-react';
import { BirthRegistrationGroup } from './BirthRegistrationGroup';
import { BirthRegistration } from './BirthRegistration';

type BirthType = 'single' | 'group';

export const BirthRegistrationSelector: React.FC = () => {
  const [birthType, setBirthType] = useState<BirthType>('group');

  return (
    <div className="space-y-6">
      {/* Selettore tipo registrazione */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm">
        <div className="flex gap-4">
          <button
            onClick={() => setBirthType('group')}
            className={`flex-1 p-4 rounded-xl text-center font-black transition-all ${
              birthType === 'group'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Users size={24} className="mx-auto mb-2" />
            <span className="text-sm">Registra come GRUPPO</span>
            <p className="text-[10px] mt-1 opacity-80">Per cucciolate di maiali, capre, ecc.</p>
          </button>
          
          <button
            onClick={() => setBirthType('single')}
            className={`flex-1 p-4 rounded-xl text-center font-black transition-all ${
              birthType === 'single'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <User size={24} className="mx-auto mb-2" />
            <span className="text-sm">Registra come SINGOLO</span>
            <p className="text-[10px] mt-1 opacity-80">Per animali di grossa taglia (cavalli, mucche)</p>
          </button>
        </div>
      </div>
      
      {/* Componente corrispondente */}
      {birthType === 'group' ? (
        <BirthRegistrationGroup />
      ) : (
        <BirthRegistration />
      )}
    </div>
  );
};
