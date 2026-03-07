import React, { useState, useEffect } from 'react';
import {
  PawPrint, CalendarDays, TrendingUp, Network, Baby, Trash2,
  PlusCircle, LogOut, Lock, Menu, X, Search,
  History, Package, Edit2, CheckCircle2,
  MinusCircle, Activity, ListChecks, Wallet,
  ArrowUpRight, ArrowDownLeft, Ghost, UserPlus
} from 'lucide-react';

// Firebase
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, where, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";

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

// TIPI
type Species = 'Maiali' | 'Cavalli' | 'Mucche' | 'Galline' | 'Oche';
interface Animal { id: string; name: string; species: Species; notes: string; sire?: string; dam?: string; birthDate?: string; ownerId: string; }
interface BirthRecord { id: string; animalName: string; species: Species; date: string; offspringCount: number; birthDate: string; ownerId: string; }
interface Transaction { id: string; type: 'Entrata' | 'Uscita'; amount: number; desc: string; species: Species; date: string; ownerId: string; }
interface Task { id: string; text: string; done: boolean; dateCompleted?: string; ownerId: string; }
interface Product { id: string; name: string; quantity: number; unit: string; ownerId: string; }

// Componente Dinastia
const DynastyBranch = ({ animal, allAnimals, level = 0 }: { animal: Animal, allAnimals: Animal[], level?: number }) => {
  const children = allAnimals.filter(a => a.sire === animal.id || a.dam === animal.id);
  return (
    <div className={level > 0 ? "ml-4 border-l-2 border-emerald-100 mt-2" : "mt-2"}>
      <div className={`flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border ${level === 0 ? 'border-l-4 border-emerald-500' : 'border-gray-100 ml-2'}`}>
        <div className="flex flex-col">
          <span className="font-bold text-gray-800 text-sm">{animal.name || '??'}</span>
          <span className="text-[9px] text-gray-400 uppercase font-black">Gen. {level} • {animal.species}</span>
        </div>
      </div>
      {children.map(child => <DynastyBranch key={child.id} animal={child} allAnimals={allAnimals} level={level + 1} />)}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [births, setBirths] = useState<BirthRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newAnimal, setNewAnimal] = useState({ name: '', species: 'Maiali' as Species, birthDate: '', sire: '', dam: '', notes: '' });
  const [newBirth, setNewBirth] = useState({ idCode: '', species: 'Maiali' as Species, count: 1, birthDate: '' });
  const [newTrans, setNewTrans] = useState({ desc: '', amount: 0, type: 'Entrata' as 'Entrata' | 'Uscita', species: 'Maiali' as Species });
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 0, unit: 'kg' });
  const [newTask, setNewTask] = useState('');
  const [searchTask, setSearchTask] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', notes: '' });

  const speciesList: Species[] = ['Maiali', 'Cavalli', 'Mucche', 'Galline', 'Oche'];
  const validAnimals = animals.filter(a => a.name && a.name.trim().length > 0);
  const ghostCount = animals.length - validAnimals.length;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const q = (coll: string) => query(collection(db, coll), where("ownerId", "==", user.uid));
    const unsubs = [
      onSnapshot(q('animals'), s => setAnimals(s.docs.map(d => ({ id: d.id, ...d.data() })) as Animal[])),
      onSnapshot(q('births'), s => setBirths(s.docs.map(d => ({ id: d.id, ...d.data() })) as BirthRecord[])),
      onSnapshot(q('transactions'), s => setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[])),
      onSnapshot(q('tasks'), s => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() })) as Task[])),
      onSnapshot(q('products'), s => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]))
    ];
    return () => unsubs.forEach(u => u());
  }, [user?.uid]);

  const cleanFantasmi = async () => {
    const snap = await getDocs(query(collection(db, 'animals'), where("ownerId", "==", user?.uid)));
    snap.docs.forEach(async (d) => { if (!d.data().name) await deleteDoc(doc(db, 'animals', d.id)); });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) { await createUserWithEmailAndPassword(auth, email, password); }
      else { await signInWithEmailAndPassword(auth, email, password); }
    } catch (err: any) { alert("Errore: controlla email e password"); }
  };

  // --- FUNZIONI DI SALVATAGGIO ---
  const handleSaveAnimal = async () => {
    if (!newAnimal.name.trim()) return alert("Inserisci un identificativo!");
    await addDoc(collection(db, 'animals'), { ...newAnimal, ownerId: user!.uid });
    setNewAnimal({ name: '', species: 'Maiali', birthDate: '', sire: '', dam: '', notes: '' });
  };

  const handleSaveTransaction = async () => {
    if (!newTrans.desc.trim() || newTrans.amount <= 0) return alert("Inserisci descrizione e un importo valido!");
    await addDoc(collection(db, 'transactions'), { ...newTrans, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    setNewTrans({ desc: '', amount: 0, type: 'Entrata', species: 'Maiali' });
  };

  const handleSaveBirth = async () => {
    if (!newBirth.idCode.trim() || newBirth.count < 1) return alert("Inserisci madre e numero di nati validi!");
    await addDoc(collection(db, 'births'), { ...newBirth, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    for (let i = 0; i < newBirth.count; i++) {
      await addDoc(collection(db, 'animals'), { name: `Figlio di ${newBirth.idCode} #${i + 1}`, species: newBirth.species, birthDate: newBirth.birthDate, dam: newBirth.idCode, notes: 'Parto registrato in app', ownerId: user!.uid });
    }
    setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' });
    alert("Parto registrato e figli aggiunti all'inventario!");
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || newProduct.quantity <= 0) return alert("Inserisci nome e quantità!");
    const nameToMatch = newProduct.name.trim().toLowerCase();
    const existing = products.find(p => p.name.trim().toLowerCase() === nameToMatch);
    if (existing) { 
      await updateDoc(doc(db, 'products', existing.id), { quantity: existing.quantity + newProduct.quantity }); 
    } else { 
      await addDoc(collection(db, 'products'), { ...newProduct, name: newProduct.name.trim(), ownerId: user!.uid }); 
    }
    setNewProduct({ name: '', quantity: 0, unit: 'kg' });
  };

  const reduceProduct = async (id: string, amount: number) => {
    const p = products.find(prod => prod.id === id);
    if (p && p.quantity >= amount) await updateDoc(doc(db, 'products', id), { quantity: p.quantity - amount });
  };

  // LA FUNZIONE CHE MANCAVA E FACEVA CRASHARE VERCEL!
  const handleAddTask = async () => {
    if (!newTask.trim()) return alert("Scrivi il lavoro da fare prima di aggiungere!");
    try {
      await addDoc(collection(db, 'tasks'), { text: newTask, done: false, ownerId: user!.uid });
      setNewTask('');
    } catch (err) {
      alert("Errore di rete. Riprova.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-emerald-800 bg-stone-50 italic animate-pulse">AGRIMANAGE PRO...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
          <div className="flex justify-center mb-6"><div className="bg-emerald-600 p-4 rounded-2xl text-white shadow-lg shadow-emerald-200"><TrendingUp size={32} strokeWidth={3} /></div></div>
          <h1 className="text-3xl font-black text-center mb-8 text-emerald-950 italic">AgriManage</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="Email" className="ui-input w-full" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="ui-input w-full" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase shadow-md active:scale-95 transition-transform">{isRegistering ? "Registrati" : "Entra"}</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-6 text-stone-400 font-bold text-xs hover:text-emerald-600">
            {isRegistering ? "Hai già un account? Accedi" : "Nuovo utente? Registrati qui"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-stone-50 text-stone-900">
      <style>{`.ui-input { background: #f3f4f6; padding: 1rem 1.25rem; border-radius: 0.75rem; width: 100%; border: 1.5px solid transparent; outline: none; transition: 0.2s; font-size: 0.875rem; font-weight: 600; } .ui-input:focus { background: white; border-color: #10b981; box-shadow: 0 0 0 4px rgba(16,185,129,0.1); }`}</style>

      {/* HEADER MOBILE */}
      <header className="md:hidden fixed top-0 w-full bg-white/90 backdrop-blur-md z-40 border-b border-stone-200 px-5 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-1.5 rounded-lg text-white"><TrendingUp size={18} strokeWidth={3} /></div>
          <h1 className="text-xl font-black italic text-emerald-950">AgriManage</h1>
        </div>
        <button onClick={() => signOut(auth)} className="text-stone-400 hover:text-red-500"><LogOut size={20} /></button>
      </header>

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-stone-200 p-6 fixed h-full z-40">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg"><TrendingUp size={22} strokeWidth={3} /></div>
          <h1 className="text-2xl font-black italic text-emerald-950">AgriManage</h1>
        </div>
        <nav className="space-y-2 flex-1">
          {[ { id: 'inventory', label: 'Capi', icon: PawPrint }, { id: 'births', label: 'Parti', icon: Baby }, { id: 'finance', label: 'Bilancio', icon: Wallet }, { id: 'products', label: 'Scorte', icon: Package }, { id: 'tasks', label: 'Agenda', icon: ListChecks }, { id: 'dinastia', label: 'Dinastia', icon: Network } ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-4 w-full p-3 rounded-xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-stone-500 hover:bg-stone-100'}`}>
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="mt-auto flex items-center gap-3 text-red-500 font-bold p-3 hover:bg-red-50 rounded-xl"><LogOut size={18} /> Esci dall'App</button>
      </aside>

      {/* CONTENUTO PRINCIPALE */}
      <main className="flex-1 w-full md:ml-72 p-4 pt-24 md:pt-10 md:p-10">
        
        {/* KPI DASHBOARD */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-center items-center">
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-wider mb-0.5">Capi</p>
            <h4 className="text-2xl font-black text-emerald-600 italic">{validAnimals.length}</h4>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-center items-center">
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-wider mb-0.5">Netto</p>
            <h4 className="text-2xl font-black text-stone-800 italic">€{transactions.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0).toFixed(0)}</h4>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-center items-center">
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-wider mb-0.5">Task</p>
            <h4 className="text-2xl font-black text-amber-500 italic">{tasks.filter(t=>!t.done).length}</h4>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-center items-center">
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-wider mb-0.5">Scorte</p>
            <h4 className="text-2xl font-black text-blue-500 italic">{products.length}</h4>
          </div>
        </div>

        {ghostCount > 0 && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-700 font-bold"><Ghost size={16} /><span>Errori rilevati</span></div>
            <button onClick={cleanFantasmi} className="bg-amber-600 text-white px-3 py-1.5 rounded-lg font-bold uppercase">Pulisci</button>
          </div>
        )}

        <h2 className="text-4xl md:text-5xl font-black text-emerald-950 capitalize tracking-tighter italic mb-8">{activeTab}</h2>

        {/* --- INVENTARIO CAPI --- */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="bg-white p-5 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
              <h3 className="text-xs font-black mb-5 text-emerald-900 uppercase flex items-center gap-2"><PlusCircle size={18} /> Nuova Anagrafica</h3>
              <div className="space-y-3 mb-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase ml-1">Codice/Nome</label>
                  <input placeholder="Codice" className="ui-input" value={newAnimal.name} onChange={e => setNewAnimal({...newAnimal, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase ml-1">Specie</label>
                    <select className="ui-input" value={newAnimal.species} onChange={e => setNewAnimal({...newAnimal, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase ml-1">Nato il</label>
                    <input type="date" className="ui-input" value={newAnimal.birthDate} onChange={e => setNewAnimal({...newAnimal, birthDate: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase ml-1">Padre</label>
                    <select className="ui-input text-xs" value={newAnimal.sire} onChange={e => setNewAnimal({...newAnimal, sire: e.target.value})}><option value="">Ignoto</option>{validAnimals.filter(a => a.species === newAnimal.species).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase ml-1">Madre</label>
                    <select className="ui-input text-xs" value={newAnimal.dam} onChange={e => setNewAnimal({...newAnimal, dam: e.target.value})}><option value="">Ignota</option>{validAnimals.filter(a => a.species === newAnimal.species).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase ml-1">Note e Trattamenti</label>
                  <textarea placeholder="Scrivi note sanitarie..." className="ui-input h-20 resize-none" value={newAnimal.notes} onChange={e => setNewAnimal({...newAnimal, notes: e.target.value})}></textarea>
                </div>
              </div>
              <button onClick={handleSaveAnimal} className="w-full bg-emerald-600 text-white font-black rounded-xl py-3.5 uppercase text-xs active:scale-[0.98] transition-transform">Salva nel Registro</button>
            </div>

            {speciesList.map(species => {
              const capi = validAnimals.filter(a => a.species === species);
              if (capi.length === 0) return null;
              return (
                <div key={species} className="space-y-3">
                  <h3 className="text-xl md:text-2xl font-black text-emerald-950 uppercase italic px-1 pt-4">{species} <span className="text-sm text-stone-400">({capi.length})</span></h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {capi.map(a => (
                      <div key={a.id} className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm relative group flex flex-col">
                        {editingId === a.id ? (
                          <div className="space-y-3">
                            <input className="ui-input font-bold" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                            <textarea className="ui-input text-xs h-20 resize-none" value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} />
                            <button onClick={async () => { await updateDoc(doc(db, 'animals', a.id), { name: editData.name, notes: editData.notes }); setEditingId(null); }} className="w-full bg-emerald-600 text-white py-2 rounded-xl text-xs font-black uppercase">Salva Modifiche</button>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-lg font-black text-stone-800">{a.name}</h4>
                              <div className="flex gap-2">
                                <button onClick={() => { setEditingId(a.id); setEditData({name: a.name, notes: a.notes}); }} className="text-stone-300 hover:text-emerald-600 p-1"><Edit2 size={16}/></button>
                                <button onClick={() => { if(window.confirm("Eliminare definitivamente?")) deleteDoc(doc(db, 'animals', a.id)); }} className="text-stone-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                              </div>
                            </div>
                            <p className="text-[10px] text-stone-400 font-bold uppercase mb-2"><CalendarDays size={12} className="inline mr-1 mb-0.5"/>{a.birthDate || 'N/D'}</p>
                            {(a.sire || a.dam) && (
                              <div className="bg-stone-50 p-2 rounded-lg text-[10px] font-bold text-stone-500 mb-2 flex gap-4">
                                {a.sire && <span>Padre: {validAnimals.find(p=>p.id===a.sire)?.name}</span>}
                                {a.dam && <span>Madre: {validAnimals.find(p=>p.id===a.dam)?.name}</span>}
                              </div>
                            )}
                            {a.notes && <p className="text-xs text-stone-600 mt-2 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 italic">{a.notes}</p>}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- BILANCIO FINANZIARIO --- */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
              <h3 className="text-xs font-black uppercase mb-4 text-emerald-900">Registra Movimento</h3>
              <div className="space-y-3 mb-4">
                <input placeholder="Causale (es. Vendita)" className="ui-input" value={newTrans.desc} onChange={e => setNewTrans({...newTrans, desc: e.target.value})} />
                <div className="grid grid-cols-3 gap-3">
                  <input placeholder="€" type="number" className="ui-input col-span-1" value={newTrans.amount || ''} onChange={e => setNewTrans({...newTrans, amount: Number(e.target.value) || 0})} />
                  <select className="ui-input col-span-1 px-2 font-black" value={newTrans.type} onChange={e => setNewTrans({...newTrans, type: e.target.value as any})}><option>Entrata</option><option>Uscita</option></select>
                  <select className="ui-input col-span-1 px-2" value={newTrans.species} onChange={e => setNewTrans({...newTrans, species: e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s.substring(0,3)}.</option>)}</select>
                </div>
              </div>
              <button onClick={handleSaveTransaction} className="w-full bg-emerald-600 text-white font-black rounded-xl py-3.5 text-xs uppercase">Aggiungi</button>
            </div>
            
            {speciesList.map(s => {
                const specTrans = transactions.filter(t => t.species === s || t.species === s.substring(0,3)+".");
                const balance = specTrans.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0);
                
                if(specTrans.length === 0) return null;

                return (
                    <div key={s} className="bg-white p-5 rounded-2xl border shadow-sm">
                        <div className="flex justify-between items-center mb-4 border-b border-stone-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Activity className="text-stone-400" size={18}/>
                            <h4 className="text-lg font-black italic uppercase">{s}</h4>
                          </div>
                          <span className={`font-black text-xl ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>€ {balance.toFixed(2)}</span>
                        </div>
                        <div className="space-y-2">
                            {specTrans.sort((a,b)=>b.date.localeCompare(a.date)).map(t => (
                                <div key={t.id} className="flex justify-between items-center py-2 bg-stone-50 px-3 rounded-xl border border-stone-100">
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${t.type === 'Entrata' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                        {t.type === 'Entrata' ? <ArrowUpRight size={16}/> : <ArrowDownLeft size={16}/>}
                                      </div>
                                      <div className="leading-tight"><p className="font-bold text-stone-700 text-sm">{t.desc}</p><p className="text-[9px] font-black text-stone-400">{t.date}</p></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className={`font-black text-sm ${t.type === 'Entrata' ? 'text-emerald-600' : 'text-red-500'}`}>€{t.amount.toFixed(2)}</span>
                                      <button onClick={() => { if(window.confirm("Cancellare questa transazione?")) deleteDoc(doc(db, 'transactions', t.id)); }} className="text-stone-300 hover:text-red-500 bg-white p-1.5 rounded-lg shadow-sm border border-stone-100"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
          </div>
        )}

        {/* --- REGISTRO PARTI --- */}
        {activeTab === 'births' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm">
            <h3 className="text-xs font-black uppercase text-emerald-900 mb-5">Nuovo Parto</h3>
            <div className="space-y-3 mb-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-400 uppercase ml-1">Specie del Nasciuturo</label>
                <select className="ui-input w-full" value={newBirth.species} onChange={e => setNewBirth({...newBirth, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-400 uppercase ml-1">Codice Madre</label>
                <input placeholder="Madre..." className="ui-input w-full" value={newBirth.idCode} onChange={e => setNewBirth({...newBirth, idCode: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase ml-1">Numero Nati</label>
                  <input type="number" placeholder="Nati" className="ui-input w-full" value={newBirth.count} onChange={e => setNewBirth({...newBirth, count: Number(e.target.value) || 1})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase ml-1">Data Nascita</label>
                  <input type="date" className="ui-input w-full" value={newBirth.birthDate} onChange={e => setNewBirth({...newBirth, birthDate: e.target.value})} />
                </div>
              </div>
            </div>
            <button onClick={handleSaveBirth} className="w-full bg-emerald-600 text-white font-black py-3.5 rounded-xl text-xs uppercase">Registra Nati</button>
          </div>
        )}

        {/* --- DINASTIA --- */}
        {activeTab === 'dinastia' && (
          <div className="space-y-6">
            {speciesList.map(species => {
              const founders = validAnimals.filter(a => a.species === species && !a.sire && !a.dam);
              if (founders.length === 0) return null;
              return (
                <div key={species} className="bg-white p-5 rounded-3xl border shadow-sm">
                  <h3 className="text-xl font-black text-emerald-950 mb-4 border-b pb-2 uppercase italic">{species}</h3>
                  {founders.map(founder => <div key={founder.id} className="mb-4"><DynastyBranch animal={founder} allAnimals={validAnimals} level={0} /></div>)}
                </div>
              );
            })}
          </div>
        )}

        {/* --- PRODOTTI E MAGAZZINO --- */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
              <div className="space-y-3 mb-4">
                <input placeholder="Nome prodotto (es. Mangime)" className="ui-input" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Q.tà" type="number" className="ui-input" value={newProduct.quantity || ''} onChange={e => setNewProduct({...newProduct, quantity: Number(e.target.value) || 0})} />
                  <select className="ui-input" value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})}><option>kg</option><option>litri</option><option>unità</option></select>
                </div>
              </div>
              <button onClick={handleAddProduct} className="w-full bg-emerald-600 text-white font-black rounded-xl py-3.5 text-xs uppercase">Carica Magazzino</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-2xl border text-center shadow-sm relative">
                  <div className="text-emerald-500 mb-2 flex justify-center"><Package size={24}/></div>
                  <h4 className="font-bold text-stone-800 text-sm mb-1">{p.name}</h4>
                  <div className="text-xl font-black text-emerald-600 mb-3">{p.quantity} <span className="text-[10px]">{p.unit}</span></div>
                  <div className="flex justify-center gap-4 border-t pt-3">
                    <button onClick={() => reduceProduct(p.id, 1)} className="text-stone-400 hover:text-red-500 bg-stone-50 p-2 rounded-lg"><MinusCircle size={18}/></button>
                    <button onClick={() => deleteDoc(doc(db, 'products', p.id))} className="text-stone-400 hover:text-red-500 bg-stone-50 p-2 rounded-lg"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- AGENDA LAVORI --- */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-3xl border shadow-sm">
              <h3 className="text-lg font-black mb-4 italic flex items-center gap-2"><ListChecks className="text-emerald-600" size={20} /> Da Fare</h3>
              <div className="flex gap-2 mb-5">
                <input className="ui-input flex-1 py-3" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Scrivi cosa fare..." />
                <button onClick={handleAddTask} className="bg-emerald-600 text-white px-4 rounded-xl font-black text-[10px] uppercase">Add</button>
              </div>
              <div className="space-y-2">
                {tasks.filter(t => !t.done).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <div className="flex items-center gap-3">
                      <button onClick={async () => await updateDoc(doc(db, 'tasks', t.id), { done: true, dateCompleted: new Date().toLocaleDateString('it-IT') })} className="text-stone-300 hover:text-emerald-500"><CheckCircle2 size={24}/></button>
                      <span className="font-bold text-sm text-stone-700">{t.text}</span>
                    </div>
                    <button onClick={() => deleteDoc(doc(db, 'tasks', t.id))} className="text-stone-300 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border shadow-sm">
              <h3 className="text-lg font-black italic flex items-center gap-2 mb-4"><History className="text-stone-400" size={20} /> Storico</h3>
              <div className="space-y-6">
                {Array.from(new Set(tasks.filter(t => t.done).map(t => t.dateCompleted))).sort().reverse().map(date => (
                  <div key={date}>
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">{date}</p>
                    <div className="space-y-2">
                      {tasks.filter(t => t.done && t.dateCompleted === date).map(i => (
                        <div key={i.id} className="flex justify-between items-center p-2 bg-stone-50 rounded-lg">
                          <p className="text-xs font-bold text-stone-400 line-through">• {i.text}</p>
                          <button onClick={() => deleteDoc(doc(db, 'tasks', i.id))} className="text-red-200 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/95 backdrop-blur-xl border-t border-stone-200 flex justify-around px-1 pt-2 pb-safe z-50">
        {[
          { id: 'inventory', icon: PawPrint, label: 'Capi' },
          { id: 'finance', icon: Wallet, label: 'Bilancio' },
          { id: 'births', icon: Baby, label: 'Parti' },
          { id: 'products', icon: Package, label: 'Scorte' },
          { id: 'tasks', icon: ListChecks, label: 'Agenda' },
          { id: 'dinastia', icon: Network, label: 'Albero' }
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center pt-2 pb-1 w-full transition-colors ${activeTab === item.id ? 'text-emerald-600' : 'text-stone-400'}`}>
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[8px] font-black mt-1 uppercase">{item.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}
