import React, { useState, useEffect } from 'react';
import {
  PawPrint, CalendarDays, TrendingUp, Network, Baby, Trash2,
  PlusCircle, LogOut, Lock, Menu, X, DollarSign, Search,
  History, Package, Edit2, CheckCircle2,
  MinusCircle, PieChart, Activity, ListChecks, Wallet,
  ArrowUpRight, ArrowDownLeft, Ghost, UserPlus
} from 'lucide-react';

// Firebase
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, onSnapshot, deleteDoc,
  doc, updateDoc, query, where, getDocs
} from "firebase/firestore";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, signOut, User
} from "firebase/auth";

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
    <div className={level > 0 ? "ml-6 border-l-2 border-emerald-100 mt-2" : "mt-2"}>
      <div className={`flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border ${level === 0 ? 'border-l-4 border-emerald-600' : 'border-gray-100 ml-2'}`}>
        <div className="flex flex-col">
          <span className="font-bold text-gray-800">{animal.name || '??'}</span>
          <span className="text-[10px] text-gray-400 uppercase font-black">Gen. {level} • {animal.species}</span>
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

  // Filtro
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
    alert("Pulizia completata");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) { await createUserWithEmailAndPassword(auth, email, password); }
      else { await signInWithEmailAndPassword(auth, email, password); }
    } catch (err: any) { alert("Errore: controlla email e password"); }
  };

  // --- LE FUNZIONI ORA PARLANO CON L'UTENTE SE SBAGLIA ---

  const handleSaveAnimal = async () => {
    if (!newAnimal.name.trim()) return alert("ERRORE: Devi inserire un Codice o un Nome per il capo!");
    try {
      await addDoc(collection(db, 'animals'), { ...newAnimal, ownerId: user!.uid });
      setNewAnimal({ name: '', species: 'Maiali', birthDate: '', sire: '', dam: '', notes: '' });
      alert("Capo registrato con successo!");
    } catch (err) { alert("Errore di rete. Riprova."); }
  };

  const handleSaveTransaction = async () => {
    if (!newTrans.desc.trim()) return alert("ERRORE: Inserisci una descrizione (es. 'Vendita uova').");
    if (newTrans.amount <= 0) return alert("ERRORE: L'importo non può essere zero. Inserisci una cifra valida.");
    try {
      await addDoc(collection(db, 'transactions'), { ...newTrans, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
      setNewTrans({ desc: '', amount: 0, type: 'Entrata', species: 'Maiali' });
      alert("Movimento economico registrato!");
    } catch (err) { alert("Errore di rete. Riprova."); }
  };

  const handleSaveBirth = async () => {
    if (!newBirth.idCode.trim()) return alert("ERRORE: Devi scrivere il nome/codice della madre.");
    if (newBirth.count < 1) return alert("ERRORE: Il numero di nati deve essere almeno 1.");
    try {
      await addDoc(collection(db, 'births'), { ...newBirth, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
      for (let i = 0; i < newBirth.count; i++) {
        await addDoc(collection(db, 'animals'), {
          name: `Figlio di ${newBirth.idCode} #${i + 1}`, species: newBirth.species,
          birthDate: newBirth.birthDate, dam: newBirth.idCode, notes: 'Parto automatico', ownerId: user!.uid
        });
      }
      setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' });
      alert("Parto registrato! I figli sono stati aggiunti all'inventario.");
    } catch (err) { alert("Errore di rete. Riprova."); }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) return alert("ERRORE: Come si chiama il prodotto?");
    if (newProduct.quantity <= 0) return alert("ERRORE: La quantità deve essere maggiore di zero.");
    try {
      const existing = products.find(p => p.name.trim().toLowerCase() === newProduct.name.trim().toLowerCase());
      if (existing) { 
        await updateDoc(doc(db, 'products', existing.id), { quantity: existing.quantity + newProduct.quantity }); 
      } else { 
        await addDoc(collection(db, 'products'), { ...newProduct, ownerId: user!.uid }); 
      }
      setNewProduct({ name: '', quantity: 0, unit: 'kg' });
      alert("Magazzino aggiornato con successo!");
    } catch (err) { alert("Errore di rete. Riprova."); }
  };

  const reduceProduct = async (id: string, amount: number) => {
    const p = products.find(prod => prod.id === id);
    if (p && p.quantity >= amount) await updateDoc(doc(db, 'products', id), { quantity: p.quantity - amount });
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return alert("ERRORE: Scrivi il lavoro da fare prima di cliccare aggiungi.");
    try {
      await addDoc(collection(db, 'tasks'), { text: newTask, done: false, ownerId: user!.uid });
      setNewTask('');
    } catch (err) { alert("Errore di rete. Riprova."); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-emerald-800 bg-stone-50 italic animate-pulse">AGRIMANAGE PRO...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md">
          <h1 className="text-4xl font-black text-center mb-10 italic text-emerald-950">AgriManage <span className="text-emerald-600">Pro</span></h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="Email" className="ui-input w-full border p-4 rounded-2xl" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="ui-input w-full border p-4 rounded-2xl" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg">
              {isRegistering ? "Crea Account" : "Entra"}
            </button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-6 text-emerald-600 font-bold text-sm">
            {isRegistering ? "Hai già un account? Accedi" : "Non hai un account? Registrati"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8F9FA] text-stone-900 font-sans">
      <style>{`.ui-input { background: white; padding: 0.85rem 1.25rem; border-radius: 1rem; border: 1.5px solid #E9ECEF; outline: none; transition: 0.3s; font-weight: 600; } .ui-input:focus { border-color: #059669; box-shadow: 0 0 0 4px #D1FAE5; }`}</style>

      {/* SIDEBAR */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-80 bg-white border-r p-8 flex flex-col transform transition-transform duration-500 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg"><TrendingUp size={24} strokeWidth={3} /></div>
          <h1 className="text-2xl font-black italic text-emerald-950">AgriManage</h1>
          <button className="md:hidden ml-auto" onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
        </div>
        <nav className="space-y-2 flex-1 overflow-y-auto">
          {[
            { id: 'inventory', label: 'Inventario Capi', icon: PawPrint },
            { id: 'births', label: 'Registro Parti', icon: Baby },
            { id: 'dinastia', label: 'Dinastia e Sangue', icon: Network },
            { id: 'products', label: 'Scorte Magazzino', icon: Package },
            { id: 'finance', label: 'Bilancio Economico', icon: Wallet },
            { id: 'tasks', label: 'Agenda Lavori', icon: ListChecks }
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`flex items-center gap-4 w-full p-4 rounded-2xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-xl' : 'text-stone-400 hover:bg-emerald-50'}`}>
              <item.icon size={20} strokeWidth={activeTab === item.id ? 3 : 2} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="mt-8 flex items-center gap-2 text-red-500 font-black p-4 hover:bg-red-50 rounded-2xl"><LogOut size={16} /> Esci</button>
      </aside>

      <main className="flex-1 p-6 md:p-14 h-screen overflow-y-auto scroll-smooth">
        
        {/* KPI DASHBOARD */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border text-center">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Capi Effettivi</p>
            <h4 className="text-3xl font-black text-emerald-600 italic">{validAnimals.length}</h4>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border text-center">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Saldo Netto</p>
            <h4 className="text-3xl font-black text-stone-800 italic">€{transactions.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0).toFixed(0)}</h4>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border text-center">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Compiti</p>
            <h4 className="text-3xl font-black text-amber-500 italic">{tasks.filter(t=>!t.done).length}</h4>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border text-center">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Prodotti</p>
            <h4 className="text-3xl font-black text-blue-500 italic">{products.length}</h4>
          </div>
        </div>

        <div className="mb-10 flex justify-between items-center">
          <h2 className="text-5xl font-black text-emerald-950 capitalize tracking-tighter italic grow">{activeTab}</h2>
          <button className="md:hidden bg-emerald-600 p-2 rounded-xl text-white shadow-lg" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} /></button>
        </div>

        {/* --- INVENTARIO CAPI --- */}
        {activeTab === 'inventory' && (
          <div className="space-y-12">
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-xl">
              <h3 className="text-xs font-black mb-8 text-emerald-900 uppercase flex items-center gap-2"><PlusCircle size={20} /> Nuova Anagrafica</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <input placeholder="Codice Capo" className="ui-input" value={newAnimal.name} onChange={e => setNewAnimal({...newAnimal, name: e.target.value})} />
                <select className="ui-input" value={newAnimal.species} onChange={e => setNewAnimal({...newAnimal, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select>
                <input type="date" className="ui-input" value={newAnimal.birthDate} onChange={e => setNewAnimal({...newAnimal, birthDate: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <select className="ui-input text-xs" value={newAnimal.sire} onChange={e => setNewAnimal({...newAnimal, sire: e.target.value})}>
                  <option value="">Padre (Sire)</option>
                  {validAnimals.filter(a => a.species === newAnimal.species).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className="ui-input text-xs" value={newAnimal.dam} onChange={e => setNewAnimal({...newAnimal, dam: e.target.value})}>
                  <option value="">Madre (Dam)</option>
                  {validAnimals.filter(a => a.species === newAnimal.species).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <textarea placeholder="Note e trattamenti..." className="ui-input w-full h-24 mb-8" value={newAnimal.notes} onChange={e => setNewAnimal({...newAnimal, notes: e.target.value})}></textarea>
              <button onClick={handleSaveAnimal} className="bg-emerald-600 text-white font-black rounded-2xl py-5 px-12 uppercase text-xs shadow-lg hover:bg-emerald-700 transition-all">Salva</button>
            </div>

            {speciesList.map(species => {
              const capi = validAnimals.filter(a => a.species === species);
              return capi.length > 0 && (
                <div key={species} className="space-y-6">
                  <h3 className="text-3xl font-black text-emerald-950 uppercase italic tracking-tighter border-b pb-2">{species} ({capi.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {capi.map(a => (
                      <div key={a.id} className="bg-white p-8 rounded-[2rem] border shadow-sm relative group hover:shadow-xl transition-all">
                        <h4 className="text-2xl font-black text-stone-800">{a.name}</h4>
                        <p className="text-[10px] text-stone-400 font-black uppercase mb-4 tracking-widest"><CalendarDays size={14} className="inline mr-1"/>{a.birthDate || 'N/D'}</p>
                        {(a.sire || a.dam) && (
                          <div className="mb-4 text-[9px] font-black text-emerald-600 uppercase">
                            {a.sire && <div>Sire: {validAnimals.find(p=>p.id===a.sire)?.name}</div>}
                            {a.dam && <div>Dam: {validAnimals.find(p=>p.id===a.dam)?.name}</div>}
                          </div>
                        )}
                        {a.notes && <div className="mt-4 p-4 bg-stone-50 rounded-2xl text-xs italic border-l-4 border-emerald-500 leading-relaxed">{a.notes}</div>}
                        <button onClick={() => deleteDoc(doc(db, 'animals', a.id))} className="absolute top-4 right-4 text-stone-300 hover:text-red-600 md:opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- ECONOMIA --- */}
        {activeTab === 'finance' && (
          <div className="space-y-12">
            {speciesList.map(s => {
                const specTrans = transactions.filter(t => t.species === s);
                const balance = specTrans.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0);
                return (
                    <div key={s} className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                        <div className="flex justify-between items-center mb-6"><h4 className="text-2xl font-black italic uppercase">{s}</h4><span className={`text-3xl font-black ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>€ {balance.toFixed(2)}</span></div>
                        <div className="space-y-2">
                            {specTrans.sort((a,b)=>b.date.localeCompare(a.date)).map(t => (
                                <div key={t.id} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl group hover:bg-white transition">
                                    <div className="flex items-center gap-3">
                                      {t.type === 'Entrata' ? <ArrowUpRight className="text-emerald-500" size={18}/> : <ArrowDownLeft className="text-red-500" size={18}/>}
                                      <span className="font-bold text-stone-700">{t.desc} ({t.date})</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className={`font-black ${t.type === 'Entrata' ? 'text-emerald-600' : 'text-red-500'}`}>€{t.amount.toFixed(2)}</span>
                                      <button onClick={() => deleteDoc(doc(db, 'transactions', t.id))} className="text-stone-300 hover:text-red-500 md:opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-900 mb-6">Aggiungi Movimento</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input placeholder="Causale (es. Mangime)" className="ui-input md:col-span-2" value={newTrans.desc} onChange={e => setNewTrans({...newTrans, desc: e.target.value})} />
                <input placeholder="Importo €" type="number" step="any" className="ui-input" value={newTrans.amount || ''} onChange={e => setNewTrans({...newTrans, amount: Number(e.target.value.replace(',', '.')) || 0})} />
                <select className="ui-input font-black" value={newTrans.type} onChange={e => setNewTrans({...newTrans, type: e.target.value as any})}><option>Entrata</option><option>Uscita</option></select>
                <select className="ui-input" value={newTrans.species} onChange={e => setNewTrans({...newTrans, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select>
              </div>
              <button onClick={handleSaveTransaction} className="mt-6 bg-emerald-600 text-white font-black rounded-2xl py-4 px-12 shadow-lg hover:bg-emerald-700 uppercase text-[10px]">Salva Movimento</button>
            </div>
          </div>
        )}

        {/* --- REGISTRO PARTI --- */}
        {activeTab === 'births' && (
          <div className="bg-white p-10 rounded-[2.5rem] border shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-900 mb-8">Registra Parto</h3>
            <div className="flex flex-col md:flex-row gap-6 items-end">
              <div className="flex-1 w-full"><label className="text-[10px] font-black text-stone-400 mb-2 block uppercase">Nome Madre</label><input placeholder="Codice madre..." className="ui-input w-full" value={newBirth.idCode} onChange={e => setNewBirth({...newBirth, idCode: e.target.value})} /></div>
              <div className="w-full md:w-24"><label className="text-[10px] font-black text-stone-400 mb-2 block uppercase">Nati</label><input type="number" className="ui-input w-full text-center" value={newBirth.count} onChange={e => setNewBirth({...newBirth, count: parseInt(e.target.value) || 1})} /></div>
              <div className="w-full md:w-48"><label className="text-[10px] font-black text-stone-400 mb-2 block uppercase">Data</label><input type="date" className="ui-input w-full" value={newBirth.birthDate} onChange={e => setNewBirth({...newBirth, birthDate: e.target.value})} /></div>
              <button onClick={handleSaveBirth} className="bg-emerald-600 text-white px-10 h-14 rounded-2xl font-black shadow-lg">Salva Parto</button>
            </div>
          </div>
        )}

        {/* --- DINASTIA --- */}
        {activeTab === 'dinastia' && (
          <div className="space-y-12">
            {speciesList.map(species => {
              const founders = validAnimals.filter(a => a.species === species && !a.sire && !a.dam);
              return founders.length > 0 && (
                <div key={species} className="bg-white p-10 rounded-[3rem] border shadow-xl relative overflow-hidden">
                  <h3 className="text-4xl font-black text-emerald-950 mb-10 border-b pb-6 uppercase italic tracking-tighter">{species}</h3>
                  <div className="relative z-10">
                      {founders.map(founder => <div key={founder.id} className="mb-10 last:mb-0"><DynastyBranch animal={founder} allAnimals={validAnimals} level={0} /></div>)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- PRODOTTI --- */}
        {activeTab === 'products' && (
          <div className="space-y-10">
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-900 mb-6">Aggiungi al Magazzino</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input placeholder="Nome prodotto" className="ui-input" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                <input placeholder="Q.tà" type="number" step="any" className="ui-input" value={newProduct.quantity || ''} onChange={e => setNewProduct({...newProduct, quantity: Number(e.target.value.replace(',', '.')) || 0})} />
                <select className="ui-input" value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})}><option>kg</option><option>litri</option><option>unità</option></select>
                <button onClick={handleAddProduct} className="bg-emerald-600 text-white font-black rounded-2xl py-4 shadow-lg hover:bg-emerald-700 uppercase tracking-widest text-xs">Carica</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {products.map(p => (
                <div key={p.id} className="bg-white p-8 rounded-[2rem] border text-center shadow-sm relative group hover:shadow-xl transition-all">
                  <div className="bg-emerald-50 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-emerald-600 mx-auto mb-6"><Package size={32} /></div>
                  <h4 className="font-black text-stone-800 uppercase text-xl mb-2">{p.name}</h4>
                  <div className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-full text-2xl font-black shadow-lg mb-6">{p.quantity} <span className="text-xs font-bold">{p.unit}</span></div>
                  <div className="flex gap-2 justify-center pt-6 border-t border-stone-50">
                    <button onClick={() => reduceProduct(p.id, 1)} className="p-3 text-stone-400 hover:text-red-500"><MinusCircle size={24}/></button>
                    <button onClick={() => deleteDoc(doc(db, 'products', p.id))} className="p-3 text-stone-400 hover:text-red-500"><Trash2 size={24}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- AGENDA LAVORI --- */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 pb-24">
            <div className="bg-white p-10 rounded-[3rem] border shadow-xl">
              <h3 className="text-xl font-black mb-8 italic flex items-center gap-3"><ListChecks className="text-emerald-600" /> Da Fare</h3>
              <div className="flex gap-4 mb-10">
                <input className="ui-input flex-1" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Scrivi il lavoro da fare..." />
                <button onClick={handleAddTask} className="bg-emerald-600 text-white px-8 rounded-2xl font-black uppercase text-[10px]">Aggiungi</button>
              </div>
              <div className="space-y-3">
                {tasks.filter(t => !t.done).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-6 bg-stone-50 rounded-[1.5rem] group hover:bg-emerald-50 transition-all border border-stone-100">
                    <div className="flex items-center gap-6">
                      <button onClick={async () => await updateDoc(doc(db, 'tasks', t.id), { done: true, dateCompleted: new Date().toLocaleDateString('it-IT') })} className="text-stone-300 hover:text-emerald-500 transition-colors"><CheckCircle2 size={32}/></button>
                      <span className="font-black text-stone-700">{t.text}</span>
                    </div>
                    <button onClick={() => deleteDoc(doc(db, 'tasks', t.id))} className="text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={20}/></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-10 rounded-[3rem] border shadow-xl flex flex-col">
              <h3 className="text-xl font-black italic flex items-center gap-3 mb-8"><History className="text-stone-400" /> Storico Completati</h3>
              <div className="space-y-10 overflow-y-auto max-h-[600px] pr-2">
                {Array.from(new Set(tasks.filter(t => t.done).map(t => t.dateCompleted))).sort().reverse().map(date => (
                  <div key={date}>
                    <p className="text-[11px] font-black text-emerald-600 uppercase mb-4 bg-emerald-50 inline-block px-4 py-1.5 rounded-full">{date}</p>
                    <div className="space-y-3">
                      {tasks.filter(t => t.done && t.dateCompleted === date).map(i => (
                        <div key={i.id} className="flex justify-between items-center group p-2">
                          <p className="text-sm font-bold text-stone-400 line-through">• {i.text}</p>
                          <button onClick={() => deleteDoc(doc(db, 'tasks', i.id))} className="text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
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
    </div>
  );
}
