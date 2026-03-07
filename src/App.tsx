import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  LayoutDashboard, Baby, Milk, Network, Wallet, 
  ListChecks, Package, Plus, Trash2, LogOut, Search, TrendingUp, TrendingDown 
} from 'lucide-react';

// --- CONFIGURAZIONE FIREBASE (METTI LE TUE CHIAVI QUI) ---
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

  // Stati Dati
  const [animals, setAnimals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [speciesFilter, setSpeciesFilter] = useState('');

  // Stati Form
  const [newAnimal, setNewAnimal] = useState({ name: '', species: '', fatherId: '', motherId: '' });
  const [newProduct, setNewProduct] = useState({ name: '', qty: '', unit: 'kg' });
  const [newTrans, setNewTrans] = useState({ amount: '', desc: '' });
  const [newAct, setNewAct] = useState('');

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
        onSnapshot(query(collection(db, 'activities'), where('ownerId', '==', currentUser.uid)), (s) => 
          setActivities(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      }
    });
    return unsubscribe;
  }, []);

  // Handlers
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

  const handleAddTrans = async (type: 'entrata' | 'uscita') => {
    if (!newTrans.amount) return;
    await addDoc(collection(db, 'transactions'), { 
      amount: parseFloat(newTrans.amount), 
      desc: newTrans.desc, 
      type, 
      ownerId: user.uid,
      date: new Date().toLocaleDateString()
    });
    setNewTrans({ amount: '', desc: '' });
  };

  const handleAddActivity = async () => {
    if (!newAct) return;
    await addDoc(collection(db, 'activities'), { text: newAct, done: false, ownerId: user.uid });
    setNewAct('');
  };

  const totalFinance = transactions.reduce((acc, t) => t.type === 'entrata' ? acc + t.amount : acc - t.amount, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
          <h1 className="text-3xl font-black text-emerald-800 mb-6 text-center italic">AgriManage Pro</h1>
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
      {/* SIDEBAR */}
      <aside className="w-full md:w-72 bg-white border-r p-6 flex flex-col h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-emerald-600 p-2 rounded-xl text-white"><Package size={24}/></div>
          <h2 className="text-xl font-black text-emerald-900 tracking-tighter">AgriManagePro</h2>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {[
            { id: 'inventory', label: 'Inventario Capi', icon: <LayoutDashboard size={18}/> },
            { id: 'births', label: 'Registro Parti', icon: <Baby size={18}/> },
            { id: 'production', label: 'Produzione', icon: <Milk size={18}/> },
            { id: 'dinastia', label: 'Dinastia', icon: <Network size={18}/> },
            { id: 'products', label: 'Inventario Prodotti', icon: <Package size={18}/> },
            { id: 'economy', label: 'Economia', icon: <Wallet size={18}/> },
            { id: 'activities', label: 'Attività', icon: <ListChecks size={18}/> },
          ].map((item) => (
            <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-sm transition-all ${view === item.id ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="mt-4 flex items-center gap-3 p-4 text-red-400 font-bold text-sm"><LogOut size={18}/> Esci</button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-10 capitalize">{view.replace('_', ' ')}</h1>

        {/* VIEW: INVENTARIO CAPI */}
        {view === 'inventory' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
              <input placeholder="Nome Capo" className="p-3 border rounded-xl" value={newAnimal.name} onChange={e => setNewAnimal({...newAnimal, name: e.target.value})} />
              <input placeholder="Specie" className="p-3 border rounded-xl" value={newAnimal.species} onChange={e => setNewAnimal({...newAnimal, species: e.target.value})} />
              <select className="p-3 border rounded-xl" value={newAnimal.fatherId} onChange={e => setNewAnimal({...newAnimal, fatherId: e.target.value})}>
                <option value="">Padre (Ignoto)</option>
                {animals.filter(a => a.species === newAnimal.species).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={handleAddAnimal} className="bg-emerald-600 text-white p-3 rounded-xl font-bold">Aggiungi</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {animals.map(a => (
                <div key={a.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center">
                  <div><p className="font-bold text-gray-800">{a.name}</p><p className="text-[10px] text-emerald-600 font-bold uppercase">{a.species}</p></div>
                  <button onClick={() => deleteDoc(doc(db, 'animals', a.id))} className="text-gray-200 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: DINASTIA */}
        {view === 'dinastia' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border flex items-center gap-3 shadow-sm">
              <Search size={20} className="text-gray-300" />
              <input placeholder="Cerca Specie (es. Oca)..." className="flex-1 outline-none font-bold text-gray-700" onChange={e => setSpeciesFilter(e.target.value)} />
            </div>
            {animals.filter(a => (!speciesFilter || a.species.toLowerCase().includes(speciesFilter.toLowerCase())) && !a.fatherId && !a.motherId).map(founder => (
              <div key={founder.id} className="p-6 bg-emerald-50/30 rounded-3xl border border-dashed border-emerald-200">
                <span className="bg-emerald-800 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase mb-4 inline-block">Capostipite {founder.species}</span>
                <DynastyBranch animal={founder} allAnimals={animals} />
              </div>
            ))}
          </div>
        )}

        {/* VIEW: PRODOTTI */}
        {view === 'products' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="Prodotto" className="p-3 border rounded-xl" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              <input placeholder="Quantità" type="number" className="p-3 border rounded-xl" value={newProduct.qty} onChange={e => setNewProduct({...newProduct, qty: e.target.value})} />
              <button onClick={handleAddProduct} className="bg-emerald-600 text-white p-3 rounded-xl font-bold">Salva Scorte</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-3xl border text-center">
                  <Package className="mx-auto text-emerald-200 mb-2" />
                  <p className="font-bold text-gray-800">{p.name}</p>
                  <p className="text-xl font-black text-emerald-600">{p.qty} <span className="text-[10px] uppercase">{p.unit}</span></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: ECONOMIA */}
        {view === 'economy' && (
          <div className="space-y-6">
            <div className="bg-emerald-800 p-8 rounded-3xl text-white text-center shadow-xl">
              <p className="text-emerald-300 text-xs font-bold uppercase mb-2">Bilancio Totale</p>
              <h2 className="text-5xl font-black">€ {totalFinance.toFixed(2)}</h2>
            </div>
            <div className="bg-white p-6 rounded-3xl border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="Importo (€)" type="number" className="p-3 border rounded-xl" value={newTrans.amount} onChange={e => setNewTrans({...newTrans, amount: e.target.value})} />
              <input placeholder="Descrizione" className="p-3 border rounded-xl" value={newTrans.desc} onChange={e => setNewTrans({...newTrans, desc: e.target.value})} />
              <div className="flex gap-2">
                <button onClick={() => handleAddTrans('entrata')} className="flex-1 bg-emerald-600 text-white rounded-xl font-bold"><TrendingUp size={18} className="mx-auto"/></button>
                <button onClick={() => handleAddTrans('uscita')} className="flex-1 bg-red-500 text-white rounded-xl font-bold"><TrendingDown size={18} className="mx-auto"/></button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: ATTIVITÀ */}
        {view === 'activities' && (
          <div className="space-y-6">
            <div className="flex gap-3">
              <input placeholder="Cosa devi fare oggi?" className="flex-1 p-4 border rounded-2xl shadow-sm" value={newAct} onChange={e => setNewAct(e.target.value)} />
              <button onClick={handleAddActivity} className="bg-emerald-600 text-white px-8 rounded-2xl font-bold">Aggiungi</button>
            </div>
            <div className="space-y-3">
              {activities.map(act => (
                <div key={act.id} className="bg-white p-4 rounded-2xl border flex items-center justify-between group">
                  <p className="font-bold text-gray-700">{act.text}</p>
                  <button onClick={() => deleteDoc(doc(db, 'activities', act.id))} className="text-gray-200 group-hover:text-red-400"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* PLACEHOLDER PER PARTI E PRODUZIONE */}
        {['births', 'production'].includes(view) && (
          <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
             <Plus className="mx-auto text-gray-200 mb-4" size={48} />
             <p className="text-gray-400 font-bold uppercase text-sm tracking-widest">Sezione in fase di test dati</p>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
