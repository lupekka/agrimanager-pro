import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  LayoutDashboard, dynamicIconImports, 
  Baby, Milk, Network, Wallet, ListChecks, Package, 
  Plus, Trash2, ChevronRight, LogOut, UserPlus, Search
} from 'lucide-react';

// --- CONFIGURAZIONE FIREBASE ---
const firebaseConfig = {
  apiKey: "IL_TUO_API_KEY",
  authDomain: "IL_TUO_PROGETTO.firebaseapp.com",
  projectId: "IL_TUO_PROGETTO",
  storageBucket: "IL_TUO_PROGETTO.firebasestorage.app",
  messagingSenderId: "IL_TUO_SENDER_ID",
  appId: "IL_TUO_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- COMPONENTE RICORSIVO DINASTIA ---
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
  const [view, setView] = useState('inventory'); // Vista di default
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Stati Dati
  const [animals, setAnimals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [speciesFilter, setSpeciesFilter] = useState('');

  // Stati Form
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
        onSnapshot(query(collection(db, 'transactions'), where('ownerId', '==', currentUser.uid)), (s) => 
          setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() }))));
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
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-emerald-100">
          <h1 className="text-3xl font-black text-emerald-800 mb-6 text-center">AgriManage Pro</h1>
          <input type="email" placeholder="Email" className="w-full p-4 mb-3 border rounded-2xl" onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full p-4 mb-6 border rounded-2xl" onChange={e => setPassword(e.target.value)} />
          <button onClick={() => signInWithEmailAndPassword(auth, email, password)} className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold mb-3">Accedi</button>
          <button onClick={() => createUserWithEmailAndPassword(auth, email, password)} className="w-full text-emerald-600 font-bold">Crea account</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* SIDEBAR (Come nello screenshot) */}
      <aside className="w-full md:w-72 bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-emerald-600 p-2 rounded-xl text-white"><Package size={24}/></div>
          <h2 className="text-xl font-black text-emerald-900 tracking-tighter">AgriManagePro</h2>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'inventory', label: 'Inventario Capi', icon: <LayoutDashboard size={20}/> },
            { id: 'births', label: 'Registro Parti', icon: <Baby size={20}/> },
            { id: 'production', label: 'Produzione', icon: <Milk size={20}/> },
            { id: 'dinastia', label: 'Dinastia', icon: <Network size={20}/> },
            { id: 'products', label: 'Inventario Prodotti', icon: <Package size={20}/> },
            { id: 'economy', label: 'Economia', icon: <Wallet size={20}/> },
            { id: 'activities', label: 'Attività', icon: <ListChecks size={20}/> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${view === item.id ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <button onClick={() => signOut(auth)} className="mt-10 flex items-center gap-3 p-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition">
          <LogOut size={20}/> Esci
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 capitalize">{view.replace('_', ' ')}</h1>
          <p className="text-gray-500 font-medium italic">Gestione Azienda Agricola 4.0</p>
        </header>

        {/* VIEW: INVENTARIO CAPI */}
        {view === 'inventory' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
              <input placeholder="Nome Capo" className="p-4 border rounded-2xl" value={newAnimal.name} onChange={e => setNewAnimal({...newAnimal, name: e.target.value})} />
              <input placeholder="Specie" className="p-4 border rounded-2xl" value={newAnimal.species} onChange={e => setNewAnimal({...newAnimal, species: e.target.value})} />
              <select className="p-4 border rounded-2xl text-sm" value={newAnimal.fatherId} onChange={e => setNewAnimal({...newAnimal, fatherId: e.target.value})}>
                <option value="">Padre (Ignoto)</option>
                {animals.filter(a => a.species === newAnimal.species).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={handleAddAnimal} className="bg-emerald-600 text-white p-4 rounded-2xl font-bold hover:shadow-lg transition">Aggiungi Capo</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {animals.map(a => (
                <div key={a.id} className="bg-white p-6 rounded-2xl border flex justify-between items-center hover:border-emerald-200 transition">
                  <div><p className="font-black text-gray-800 text-lg">{a.name}</p><p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{a.species}</p></div>
                  <button onClick={() => deleteDoc(doc(db, 'animals', a.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={20}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: DINASTIA (Ex Genealogia) */}
        {view === 'dinastia' && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-3xl border flex items-center gap-4 shadow-sm">
              <Search className="text-gray-400" />
              <input 
                placeholder="Filtra Dinastia per Specie (es. Oca, Mucca...)" 
                className="flex-1 outline-none font-bold text-gray-700"
                value={speciesFilter}
                onChange={e => setSpeciesFilter(e.target.value)}
              />
            </div>
            <div className="space-y-6">
              {animals
                .filter(a => (!speciesFilter || a.species.toLowerCase().includes(speciesFilter.toLowerCase())) && !a.fatherId && !a.motherId)
                .map(founder => (
                  <div key={founder.id} className="bg-white/50 p-6 rounded-3xl border border-dashed border-emerald-200">
                    <h3 className="bg-emerald-800 text-white px-4 py-1 rounded-full text-xs font-black inline-block mb-4 uppercase">Linea Capostipite: {founder.species}</h3>
                    <DynastyBranch animal={founder} allAnimals={animals} />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* VIEW: INVENTARIO PRODOTTI (Nuova Sezione) */}
        {view === 'products' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="Nome Prodotto (es. Mangime)" className="p-4 border rounded-2xl" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              <div className="flex gap-2">
                <input placeholder="Q.tà" type="number" className="p-4 border rounded-2xl w-full" value={newProduct.qty} onChange={e => setNewProduct({...newProduct, qty: e.target.value})} />
                <select className="p-4 border rounded-2xl" value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})}>
                  <option value="kg">kg</option><option value="l">litri</option><option value="unità">unità</option>
                </select>
              </div>
              <button onClick={handleAddProduct} className="bg-emerald-600 text-white p-4 rounded-2xl font-bold">Aggiorna Scorte</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-3xl border text-center shadow-sm">
                  <Package className="mx-auto text-emerald-200 mb-2" size={32}/>
                  <p className="font-black text-gray-800">{p.name}</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{p.qty} <span className="text-xs uppercase">{p.unit}</span></p>
                  <button onClick={() => deleteDoc(doc(db, 'products', p.id))} className="mt-4 text-gray-300 hover:text-red-400"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLACEHOLDER PER LE ALTRE SEZIONI */}
        {['births', 'production', 'economy', 'activities'].includes(view) && (
          <div className="h-96 border-4 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-300">
            <Plus size={48} className="mb-4 opacity-20"/>
            <p className="font-bold uppercase tracking-widest text-sm">Sezione {view} in fase di sincronizzazione</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
