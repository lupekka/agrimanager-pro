import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
// Import corretti senza dynamicIconImports
import { 
  LayoutDashboard, Baby, Milk, Network, Wallet, 
  ListChecks, Package, Plus, Trash2, LogOut, Search 
} from 'lucide-react';

// --- CONFIGURAZIONE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyD6ZxCO6BvGLKfsF235GSsLh-7GQm84Vdk",
  authDomain: "agrimanager-pro-e3cf7.firebaseapp.com",
  projectId: "agrimanager-pro-e3cf7",
  storageBucket: "agrimanager-pro-e3cf7.firebasestorage.app",
  messagingSenderId: "415553695665",
  appId: "1:415553695665:web:6e9ddd9f5241424afad790"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- COMPONENTE DINASTIA ---
const DynastyBranch = ({ animal, allAnimals, level = 0 }: any) => {
  const children = allAnimals.filter((a: any) => a.fatherId === animal.id || a.motherId === animal.id);
  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-emerald-100' : ''} mt-2`}>
      <div className={`flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border ${level === 0 ? 'border-l-4 border-emerald-600' : 'border-gray-100'}`}>
        <div>
          <p className="font-bold text-gray-800">{animal.name}</p>
          <p className="text-[10px] text-emerald-600 font-bold uppercase">Gen. {level} • {animal.species}</p>
        </div>
      </div>
      {children.map((child: any) => (
        <DynastyBranch key={child.id} animal={child} allAnimals={allAnimals} level={level + 1} />
      ))}
    </div>
  );
};

function App() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState('inventory');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [animals, setAnimals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [newAnimal, setNewAnimal] = useState({ name: '', species: '', fatherId: '', motherId: '' });
  const [newProduct, setNewProduct] = useState({ name: '', qty: '', unit: 'kg' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        onSnapshot(query(collection(db, 'animals'), where('ownerId', '==', currentUser.uid)), (s) => 
          setAnimals(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        onSnapshot(query(collection(db, 'products'), where('ownerId', '==', currentUser.uid)), (s) => 
          setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      }
    });
    return unsubscribe;
  }, []);

  const handleAddAnimal = async () => {
    if (!newAnimal.name || !newAnimal.species) return;
    await addDoc(collection(db, 'animals'), { ...newAnimal, ownerId: user.uid });
    setNewAnimal({ name: '', species: '', fatherId: '', motherId: '' });
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.qty) return;
    await addDoc(collection(db, 'products'), { ...newProduct, ownerId: user.uid });
    setNewProduct({ name: '', qty: '', unit: 'kg' });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
          <h1 className="text-3xl font-black text-emerald-800 mb-6 text-center italic">AgriManage Pro</h1>
          <input type="email" placeholder="Email" className="w-full p-4 mb-3 border rounded-2xl" onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full p-4 mb-6 border rounded-2xl" onChange={e => setPassword(e.target.value)} />
          <button onClick={() => signInWithEmailAndPassword(auth, email, password)} className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold mb-3">Accedi</button>
          <button onClick={() => createUserWithEmailAndPassword(auth, email, password)} className="w-full text-emerald-600 font-bold">Registrati</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-72 bg-white border-r p-6 flex flex-col h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-emerald-600 p-2 rounded-xl text-white"><Package size={24}/></div>
          <h2 className="text-xl font-black text-emerald-900 tracking-tighter">AgriManagePro</h2>
        </div>
        <nav className="flex-1 space-y-1">
          {[
            { id: 'inventory', label: 'Inventario Capi', icon: <LayoutDashboard size={18}/> },
            { id: 'births', label: 'Registro Parti', icon: <Baby size={18}/> },
            { id: 'production', label: 'Produzione', icon: <Milk size={18}/> },
            { id: 'dinastia', label: 'Dinastia', icon: <Network size={18}/> },
            { id: 'products', label: 'Inventario Prodotti', icon: <Package size={18}/> },
            { id: 'economy', label: 'Economia', icon: <Wallet size={18}/> },
            { id: 'activities', label: 'Attività', icon: <ListChecks size={18}/> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-sm transition-all ${view === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="mt-auto flex items-center gap-3 p-4 text-red-400 font-bold text-sm"><LogOut size={18}/> Esci</button>
      </aside>

      <main className="flex-1 p-6 md:p-12">
        <h1 className="text-4xl font-black text-gray-900 mb-10 capitalize">{view}</h1>

        {view === 'inventory' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-3xl border shadow-sm mb-8">
            <input placeholder="Nome Capo" className="p-3 border rounded-xl" value={newAnimal.name} onChange={e => setNewAnimal({...newAnimal, name: e.target.value})} />
            <input placeholder="Specie" className="p-3 border rounded-xl" value={newAnimal.species} onChange={e => setNewAnimal({...newAnimal, species: e.target.value})} />
            <select className="p-3 border rounded-xl" value={newAnimal.fatherId} onChange={e => setNewAnimal({...newAnimal, fatherId: e.target.value})}>
              <option value="">Padre (Ignoto)</option>
              {animals.filter(a => a.species === newAnimal.species).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={handleAddAnimal} className="bg-emerald-600 text-white p-3 rounded-xl font-bold">Aggiungi</button>
          </div>
        )}

        {view === 'dinastia' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border flex items-center gap-3 shadow-sm">
              <Search size={20} className="text-gray-300" />
              <input placeholder="Filtra per specie..." className="flex-1 outline-none font-bold text-gray-700" onChange={e => setSpeciesFilter(e.target.value)} />
            </div>
            {animals.filter(a => (!speciesFilter || a.species.toLowerCase().includes(speciesFilter.toLowerCase())) && !a.fatherId && !a.motherId).map(founder => (
              <div key={founder.id} className="p-4 bg-emerald-50/50 rounded-3xl border border-dashed border-emerald-200">
                <DynastyBranch animal={founder} allAnimals={animals} />
              </div>
            ))}
          </div>
        )}

        {view === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-3xl border shadow-sm">
            <input placeholder="Prodotto" className="p-3 border rounded-xl" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
            <input placeholder="Quantità" type="number" className="p-3 border rounded-xl" value={newProduct.qty} onChange={e => setNewProduct({...newProduct, qty: e.target.value})} />
            <button onClick={handleAddProduct} className="bg-emerald-600 text-white p-3 rounded-xl font-bold">Salva Scorte</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
