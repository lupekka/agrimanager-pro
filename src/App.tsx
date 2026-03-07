import React, { useState, useEffect } from 'react';
import { PawPrint, CalendarDays, TrendingUp, Network, Baby, Milk, Trash2, PlusCircle, LogOut, Lock, UserPlus, Menu, X, DollarSign, Search, History, Package, LayoutDashboard, Edit2, ChevronRight, CheckCircle2, MinusCircle, FileText, Save, PieChart, Activity, AlertTriangle, ListChecks } from 'lucide-react';

// --- CONFIGURAZIONE FIREBASE (TUE CHIAVI PERSONALI) ---
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, where } from "firebase/firestore";
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

// --- TIPI ---
type Species = 'Maiali' | 'Cavalli' | 'Mucche' | 'Galline' | 'Oche';
interface Animal { id: string; name: string; species: Species; notes: string; sire?: string; dam?: string; birthDate?: string; ownerId: string; }
interface BirthRecord { id: string; animalName: string; species: Species; date: string; offspringCount: number; birthDate: string; ownerId: string; }
interface Production { id: string; item: string; quantity: number; date: string; species: Species; ownerId: string; }
interface Transaction { id: string; type: 'Entrata' | 'Uscita'; amount: number; desc: string; species: Species; date: string; ownerId: string; }
interface Task { id: string; text: string; done: boolean; dateCompleted?: string; ownerId: string; }
interface Product { id: string; name: string; quantity: number; unit: string; ownerId: string; }

// --- COMPONENTE DINASTIA (SISTEMATO) ---
const DynastyBranch = ({ animal, allAnimals, level = 0 }: { animal: Animal, allAnimals: Animal[], level: number }) => {
  const children = allAnimals.filter(a => a.sire === animal.id || a.dam === animal.id);
  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-emerald-100' : ''} mt-2`}>
      <div className={`flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border ${level === 0 ? 'border-l-4 border-emerald-600' : 'border-gray-100 ml-2'}`}>
        <div className="flex flex-col">
          <span className="font-bold text-gray-800">{animal.name}</span>
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
  const [activeTab, setActiveTab] = useState('inventory');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [births, setBirths] = useState<BirthRecord[]>([]);
  const [production, setProduction] = useState<Production[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newAnimal, setNewAnimal] = useState({ name: '', species: 'Maiali' as Species, birthDate: '', sire: '', dam: '', notes: '' });
  const [newBirth, setNewBirth] = useState({ idCode: '', species: 'Maiali' as Species, count: 1, birthDate: '' });
  const [newProd, setNewProd] = useState({ item: '', quantity: 1, species: 'Maiali' as Species });
  const [newTrans, setNewTrans] = useState({ desc: '', amount: 0, type: 'Entrata' as 'Entrata' | 'Uscita', species: 'Maiali' as Species });
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 0, unit: 'kg' });
  const [newTask, setNewTask] = useState('');
  const [searchTask, setSearchTask] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', notes: '' });

  const speciesList: Species[] = ['Maiali', 'Cavalli', 'Mucche', 'Galline', 'Oche'];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const qF = (c: string) => query(collection(db, c), where("ownerId", "==", user.uid));
    const unsubA = onSnapshot(qF('animals'), s => setAnimals(s.docs.map(d => ({id: d.id, ...d.data()})) as Animal[]));
    const unsubB = onSnapshot(qF('births'), s => setBirths(s.docs.map(d => ({id: d.id, ...d.data()})) as BirthRecord[]));
    const unsubP = onSnapshot(qF('production'), s => setProduction(s.docs.map(d => ({id: d.id, ...d.data()})) as Production[]));
    const unsubT = onSnapshot(qF('transactions'), s => setTransactions(s.docs.map(d => ({id: d.id, ...d.data()})) as Transaction[]));
    const unsubTk = onSnapshot(qF('tasks'), s => setTasks(s.docs.map(d => ({id: d.id, ...d.data()})) as Task[]));
    const unsubPr = onSnapshot(qF('products'), s => setProducts(s.docs.map(d => ({id: d.id, ...d.data()})) as Product[]));
    return () => { unsubA(); unsubB(); unsubP(); unsubT(); unsubTk(); unsubPr(); };
  }, [user]);

  // LOGICA: AUTOMAZIONE PARTI (CREA N INDIVIDUI)
  const handleSaveBirth = async () => {
    if (!newBirth.idCode || newBirth.count <= 0) return alert("Inserisci madre e quantità");
    await addDoc(collection(db, 'births'), { ...newBirth, date: new Date().toLocaleDateString(), ownerId: user?.uid });
    for (let i = 0; i < newBirth.count; i++) {
      await addDoc(collection(db, 'animals'), {
        name: `Figlio di ${newBirth.idCode} #${i + 1}`,
        species: newBirth.species,
        birthDate: newBirth.birthDate,
        dam: newBirth.idCode,
        notes: `Nato il ${newBirth.birthDate} - Parto automatico`,
        ownerId: user?.uid
      });
    }
    setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' });
  };

  // LOGICA: SOMMA SMART PRODOTTI
  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.quantity <= 0) return;
    const existing = products.find(p => p.name.toLowerCase().trim() === newProduct.name.toLowerCase().trim());
    if (existing) {
      await updateDoc(doc(db, 'products', existing.id), { quantity: existing.quantity + newProduct.quantity });
    } else {
      await addDoc(collection(db, 'products'), { ...newProduct, ownerId: user?.uid });
    }
    setNewProduct({ name: '', quantity: 0, unit: 'kg' });
  };

  const reduceProduct = async (id: string, amount: number) => {
    const p = products.find(prod => prod.id === id);
    if (p && p.quantity >= amount) await updateDoc(doc(db, 'products', id), { quantity: p.quantity - amount });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-emerald-800 bg-stone-50 italic animate-pulse">CARICAMENTO AGRIMANAGE PRO...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md">
          <h1 className="text-4xl font-black text-center mb-10 text-emerald-950 italic">AgriManage <span className="text-emerald-600">Pro</span></h1>
          <form onSubmit={async (e) => { e.preventDefault(); try { await signInWithEmailAndPassword(auth, email, password); } catch(err) { alert("Credenziali errate"); } }} className="space-y-4">
            <input type="email" placeholder="Email" className="ui-input w-full border p-4 rounded-2xl" onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="ui-input w-full border p-4 rounded-2xl" onChange={e => setPassword(e.target.value)} />
            <button type="submit" className="w-full bg-emerald-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg hover:bg-emerald-700 transition-all">Accedi</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8F9FA] text-stone-900 font-sans">
      <style>{`.ui-input { background: white; padding: 0.85rem 1.25rem; border-radius: 1rem; border: 1.5px solid #E9ECEF; outline: none; transition: 0.3s; font-weight: 600; } .ui-input:focus { border-color: #059669; box-shadow: 0 0 0 4px #D1FAE5; }`}</style>

      {/* SIDEBAR */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-80 bg-white border-r border-stone-100 p-8 flex flex-col transform transition-transform duration-500 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg"><TrendingUp size={24} strokeWidth={3} /></div>
          <h1 className="text-2xl font-black italic text-emerald-950">AgriManage</h1>
          <button className="md:hidden ml-auto p-2" onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
        </div>
        <nav className="space-y-2 flex-1 overflow-y-auto">
          {[
            { id: 'inventory', label: 'Inventario Capi', icon: PawPrint },
            { id: 'births', label: 'Registro Parti', icon: Baby },
            { id: 'production', label: 'Produzione', icon: Milk },
            { id: 'dinastia', label: 'Dinastia e Sangue', icon: Network },
            { id: 'products', label: 'Scorte Magazzino', icon: Package },
            { id: 'finance', label: 'Bilancio Economico', icon: Wallet },
            { id: 'tasks', label: 'Attività Agenda', icon: ListChecks }
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`flex items-center gap-4 w-full p-4 rounded-2xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-xl scale-[1.02]' : 'text-stone-400 hover:bg-emerald-50 hover:text-emerald-700'}`}>
              <item.icon size={20} strokeWidth={activeTab === item.id ? 3 : 2} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="mt-8 flex items-center gap-2 text-red-500 font-black uppercase text-[10px] tracking-widest p-4 hover:bg-red-50 rounded-2xl transition-all"><LogOut size={16} /> Esci dall'app</button>
      </aside>

      <main className="flex-1 p-6 md:p-14 h-screen overflow-y-auto scroll-smooth">
        
        {/* KPI DASHBOARD */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Capi</p>
                <h4 className="text-3xl font-black text-emerald-600 italic">{animals.length}</h4>
            </div>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Budget</p>
                <h4 className="text-3xl font-black text-stone-800 italic">€{transactions.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0).toFixed(0)}</h4>
            </div>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Task</p>
                <h4 className="text-3xl font-black text-amber-500 italic">{tasks.filter(t=>!t.done).length}</h4>
            </div>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Scorte</p>
                <h4 className="text-3xl font-black text-blue-500 italic">{products.length}</h4>
            </div>
        </div>

        <div className="mb-10 flex justify-between items-center">
          <h2 className="text-5xl font-black text-emerald-950 capitalize tracking-tighter italic grow">{activeTab.replace('dinastia', 'Mappa Dinastica')}</h2>
          <div className="md:hidden bg-emerald-600 p-2 rounded-xl text-white shadow-lg" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} /></div>
        </div>

        {/* --- INVENTARIO CAPI --- */}
        {activeTab === 'inventory' && (
          <div className="space-y-12">
            <div className="bg-white p-10 rounded-[2.5rem] border border-stone-100 shadow-xl">
              <h3 className="text-xs font-black mb-8 text-emerald-900 uppercase tracking-widest flex items-center gap-2"><PlusCircle size={20} className="text-emerald-500" /> Registrazione Anagrafica</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Identificativo</label><input placeholder="Nome o Codice" className="ui-input w-full" value={newAnimal.name} onChange={e => setNewAnimal({...newAnimal, name: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Specie</label><select className="ui-input w-full" value={newAnimal.species} onChange={e => setNewAnimal({...newAnimal, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Data Nascita</label><input type="date" className="ui-input w-full" value={newAnimal.birthDate} onChange={e => setNewAnimal({...newAnimal, birthDate: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Padre</label><select className="ui-input w-full text-xs" value={newAnimal.sire} onChange={e => setNewAnimal({...newAnimal, sire: e.target.value})}><option value="">Ignoto</option>{animals.filter(a => a.species === newAnimal.species).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Madre</label><select className="ui-input w-full text-xs" value={newAnimal.dam} onChange={e => setNewAnimal({...newAnimal, dam: e.target.value})}><option value="">Ignota</option>{animals.filter(a => a.species === newAnimal.species).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
              </div>
              <div className="space-y-2 mb-8"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Note e Trattamenti</label><textarea placeholder="Aggiungi dettagli..." className="ui-input w-full h-24 resize-none" value={newAnimal.notes} onChange={e => setNewAnimal({...newAnimal, notes: e.target.value})}></textarea></div>
              <button onClick={async () => { if(!newAnimal.name) return; await addDoc(collection(db, 'animals'), { ...newAnimal, ownerId: user.uid }); setNewAnimal({name:'', species:'Maiali', birthDate:'', sire:'', dam:'', notes:''}); }} className="bg-emerald-600 text-white font-black rounded-2xl py-5 px-12 shadow-lg hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs">Salva Capo</button>
            </div>

            {speciesList.map(species => {
              const capi = animals.filter(a => a.species === species);
              return capi.length > 0 && (
                <div key={species} className="space-y-6">
                  <div className="flex items-center gap-4">
                      <h3 className="text-3xl font-black text-emerald-950 uppercase italic tracking-tighter">{species}</h3>
                      <span className="h-px grow bg-stone-200"></span>
                      <span className="bg-white border border-stone-200 px-4 py-1.5 rounded-full text-xs font-black text-emerald-700 shadow-sm">{capi.length} INDIVIDUI</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {capi.map(a => (
                      <div key={a.id} className="bg-white p-8 rounded-[2rem] border border-stone-100 relative group shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
                        {editingId === a.id ? (
                          <div className="space-y-4">
                            <input className="ui-input w-full" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                            <textarea className="ui-input w-full text-xs h-20" value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} />
                            <button onClick={async () => { await updateDoc(doc(db, 'animals', a.id), { name: editData.name, notes: editData.notes }); setEditingId(null); }} className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase">Salva</button>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="text-2xl font-black text-stone-800 tracking-tight">{a.name}</h4>
                                <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl"><PawPrint size={18} /></div>
                            </div>
                            <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-4 flex items-center gap-2"><CalendarDays size={14} className="text-emerald-500" /> Nato: {a.birthDate || 'N/D'}</p>
                            <div className="flex gap-4 mb-6">
                                <div className="bg-stone-50 p-2 rounded-xl grow text-center border border-stone-100"><p className="text-[8px] font-black text-stone-400 uppercase">P:</p><p className="text-[10px] font-bold text-stone-700 truncate">{animals.find(p => p.id === a.sire)?.name || '-'}</p></div>
                                <div className="bg-stone-50 p-2 rounded-xl grow text-center border border-stone-100"><p className="text-[8px] font-black text-stone-400 uppercase">M:</p><p className="text-[10px] font-bold text-stone-700 truncate">{animals.find(m => m.id === a.dam)?.name || '-'}</p></div>
                            </div>
                            {a.notes && <div className="mt-4 p-4 bg-stone-50 rounded-2xl text-xs text-stone-500 italic border-l-4 border-emerald-500 font-medium">{a.notes}</div>}
                            <div className="absolute top-4 right-4 flex gap-2 md:opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => { setEditingId(a.id); setEditData({name: a.name, notes: a.notes}); }} className="bg-stone-100 hover:bg-emerald-100 text-stone-400 p-2 rounded-xl"><Edit2 size={16}/></button>
                              <button onClick={() => deleteDoc(doc(db, 'animals', a.id))} className="bg-stone-100 hover:bg-red-100 text-stone-400 p-2 rounded-xl"><Trash2 size={16}/></button>
                            </div>
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

        {/* --- REGISTRO PARTI --- */}
        {activeTab === 'births' && (
          <div className="space-y-10">
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-xl">
              <h3 className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-8 flex items-center gap-2"><Baby size={20}/> Registra Parto (Crea Capi Automaticamente)</h3>
              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 w-full"><label className="text-[10px] font-black text-stone-400 mb-2 block uppercase tracking-widest">Identificativo Madre</label><input className="ui-input w-full" value={newBirth.idCode} onChange={e => setNewBirth({...newBirth, idCode: e.target.value})} /></div>
                <div className="w-full md:w-48"><label className="text-[10px] font-black text-stone-400 mb-2 block uppercase tracking-widest">Specie</label><select className="ui-input w-full" value={newBirth.species} onChange={e => setNewBirth({...newBirth, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select></div>
                <div className="w-full md:w-24"><label className="text-[10px] font-black text-stone-400 mb-2 block uppercase tracking-widest">Nati</label><input type="number" className="ui-input w-full text-center" value={newBirth.count} onChange={e => setNewBirth({...newBirth, count: parseInt(e.target.value)})} /></div>
                <div className="w-full md:w-48"><label className="text-[10px] font-black text-stone-400 mb-2 block uppercase tracking-widest">Data Nascita</label><input type="date" className="ui-input w-full" value={newBirth.birthDate} onChange={e => setNewBirth({...newBirth, birthDate: e.target.value})} /></div>
                <button onClick={handleSaveBirth} className="bg-emerald-600 text-white px-10 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg">Registra</button>
              </div>
            </div>
            <div className="bg-white rounded-[2rem] border divide-y overflow-hidden shadow-sm">
              {births.map(b => (
                <div key={b.id} className="p-6 flex justify-between items-center hover:bg-stone-50 transition">
                  <div><p className="font-black text-xl italic tracking-tighter">{b.animalName} <span className="text-[10px] px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 ml-4 uppercase font-black">{b.species}</span></p><p className="text-xs text-stone-400 font-bold mt-2 uppercase tracking-widest">{b.offspringCount} nati il {b.birthDate}</p></div>
                  <button onClick={() => deleteDoc(doc(db, 'births', b.id))} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-100 transition-all"><Trash2 size={20}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- DINASTIA --- */}
        {activeTab === 'dinastia' && (
          <div className="space-y-12">
            {speciesList.map(species => {
              const founders = animals.filter(a => a.species === species && !a.sire && !a.dam);
              return founders.length > 0 && (
                <div key={species} className="bg-white p-10 md:p-14 rounded-[3rem] border border-stone-100 shadow-xl relative overflow-hidden">
                  <h3 className="text-4xl font-black text-emerald-950 mb-10 border-b pb-6 uppercase tracking-tighter italic">{species}</h3>
                  <div className="relative z-10">
                      {founders.map(founder => (
                        <div key={founder.id} className="mb-10 last:mb-0"><DynastyBranch animal={founder} allAnimals={animals} level={0} /></div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- PRODUZIONE --- */}
        {activeTab === 'production' && (
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <input placeholder="Prodotto (es. Latte)" className="ui-input" value={newProd.item} onChange={e => setNewProd({...newProd, item: e.target.value})} />
                <input type="number" className="ui-input" value={newProd.quantity} onChange={e => setNewProd({...newProd, quantity: parseFloat(e.target.value)})} />
                <select className="ui-input" value={newProd.species} onChange={e => setNewProd({...newProd, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select>
                <button onClick={async () => { if(!newProd.item) return; await addDoc(collection(db, 'production'), { ...newProd, date: new Date().toLocaleDateString('it-IT'), ownerId: user.uid }); setNewProd({item:'', quantity:1, species:'Maiali'}); }} className="bg-emerald-600 text-white font-black rounded-2xl py-4 shadow-lg">Registra</button>
              </div>
            </div>
            <div className="bg-white rounded-[2rem] border divide-y overflow-hidden shadow-sm">
              {production.map(p => (
                <div key={p.id} className="p-6 flex justify-between items-center hover:bg-stone-50 transition">
                  <div><p className="font-black text-xl italic tracking-tighter">{p.item} <span className="text-[10px] px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 ml-4 uppercase font-black">{p.species}</span></p><p className="text-xs text-stone-400 font-bold mt-2 uppercase tracking-widest">{p.quantity} unità il {p.date}</p></div>
                  <button onClick={() => deleteDoc(doc(db, 'production', p.id))} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-100 transition-all"><Trash2 size={20}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- PRODOTTI SCORTE --- */}
        {activeTab === 'products' && (
          <div className="space-y-10">
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-xl">
              <h3 className="text-xl font-black mb-8 italic text-emerald-900">Magazzino Intelligente</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input placeholder="Prodotto" className="ui-input" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                <input placeholder="Q.tà" type="number" className="ui-input" value={newProduct.quantity || ''} onChange={e => setNewProduct({...newProduct, quantity: parseFloat(e.target.value)})} />
                <select className="ui-input" value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})}><option>kg</option><option>litri</option><option>unità</option></select>
                <button onClick={handleAddProduct} className="bg-emerald-600 text-white font-black rounded-2xl py-4 shadow-lg hover:bg-emerald-700 transition-all text-xs uppercase tracking-widest">Carica</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {products.map(p => (
                <div key={p.id} className="bg-white p-8 rounded-[2rem] border border-stone-100 text-center shadow-sm relative group hover:border-emerald-200 transition-all">
                  <div className="bg-emerald-50 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-emerald-600 mx-auto mb-6"><Package size={32} /></div>
                  <h4 className="font-black text-stone-800 uppercase tracking-tight text-xl mb-2">{p.name}</h4>
                  <div className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-full text-2xl font-black shadow-lg shadow-emerald-100 mb-6">{p.quantity} <span className="text-xs uppercase font-bold">{p.unit}</span></div>
                  <div className="flex gap-2 justify-center pt-6 border-t border-stone-50">
                    <button onClick={() => reduceProduct(p.id, 1)} className="p-3 bg-stone-50 text-stone-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"><MinusCircle size={24}/></button>
                    <button onClick={() => deleteDoc(doc(db, 'products', p.id))} className="p-3 bg-stone-50 text-stone-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"><Trash2 size={24}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ECONOMIA --- */}
        {activeTab === 'finance' && (
          <div className="space-y-10">
            <div className="bg-emerald-950 p-12 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
                <div className="relative z-10 text-center md:text-left mb-8 md:mb-0">
                    <p className="text-emerald-300 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Profitto Netto Aziendale</p>
                    <h2 className="text-7xl font-black italic tracking-tighter">€ {transactions.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0).toFixed(2)}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-emerald-900/50 backdrop-blur-md p-6 rounded-3xl border border-emerald-800"><p className="text-[9px] font-black text-emerald-400 uppercase mb-1">Entrate</p><p className="text-2xl font-black">+ €{transactions.filter(t=>t.type==='Entrata').reduce((acc,t)=>acc+t.amount,0).toFixed(0)}</p></div>
                    <div className="bg-red-900/30 backdrop-blur-md p-6 rounded-3xl border border-red-800/50"><p className="text-[9px] font-black text-red-400 uppercase mb-1">Uscite</p><p className="text-2xl font-black">- €{transactions.filter(t=>t.type==='Uscita').reduce((acc,t)=>acc+t.amount,0).toFixed(0)}</p></div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
              <input placeholder="Descrizione" className="ui-input" value={newTrans.desc} onChange={e => setNewTrans({...newTrans, desc: e.target.value})} />
              <input placeholder="€" type="number" className="ui-input" value={newTrans.amount || ''} onChange={e => setNewTrans({...newTrans, amount: parseFloat(e.target.value)})} />
              <select className="ui-input font-black" value={newTrans.type} onChange={e => setNewTrans({...newTrans, type: e.target.value as any})}><option>Entrata</option><option>Uscita</option></select>
              <select className="ui-input" value={newTrans.species} onChange={e => setNewTrans({...newTrans, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select>
              <button onClick={async () => { if(!newTrans.desc) return; await addDoc(collection(db, 'transactions'), { ...newTrans, date: new Date().toLocaleDateString('it-IT'), ownerId: user.uid }); setNewTrans({desc:'', amount:0, type:'Entrata', species:'Maiali'}); }} className="bg-emerald-600 text-white font-black rounded-2xl py-4 shadow-lg hover:bg-emerald-700 transition-all text-[10px] uppercase tracking-widest">Registra</button>
            </div>
          </div>
        )}

        {/* --- AGENDA (Risolto punto 6) --- */}
        {activeTab === 'tasks' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 pb-24">
                <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-xl">
                    <h3 className="text-xl font-black mb-8 italic flex items-center gap-3"><ListChecks className="text-emerald-600" size={24}/> Da Fare</h3>
                    <div className="flex gap-4 mb-10">
                        <input className="ui-input flex-1" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Cosa devi fare?" />
                        <button onClick={async () => { if(newTask) { await addDoc(collection(db, 'tasks'), { text: newTask, done: false, ownerId: user.uid }); setNewTask(''); } }} className="bg-emerald-600 text-white px-8 rounded-2xl font-black uppercase tracking-widest text-[10px]">Aggiungi</button>
                    </div>
                    <div className="space-y-3">
                        {tasks.filter(t => !t.done).map(t => (
                            <div key={t.id} className="flex items-center justify-between p-6 bg-stone-50 rounded-[1.5rem] group hover:bg-emerald-50 transition-all border border-stone-100">
                                <div className="flex items-center gap-6"><button onClick={async () => await updateDoc(doc(db, 'tasks', t.id), { done: true, dateCompleted: new Date().toLocaleDateString('it-IT') })} className="text-stone-300 hover:text-emerald-500 transition-colors"><CheckCircle2 size={32}/></button><span className="font-black text-stone-700">{t.text}</span></div>
                                <button onClick={() => deleteDoc(doc(db, 'tasks', t.id))} className="text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={20}/></button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-10 rounded-[3rem] border shadow-xl flex flex-col">
                    <div className="flex justify-between items-center mb-8 border-b pb-6">
                        <h3 className="text-xl font-black italic flex items-center gap-3"><History size={24} className="text-stone-400" /> Rendiconto Storico</h3>
                        <div className="relative"><Search className="absolute left-4 top-3 text-stone-300" size={18}/><input className="ui-input pl-12 py-3 text-xs w-52" placeholder="Cerca lavoro..." value={searchTask} onChange={e => setSearchTask(e.target.value)} /></div>
                    </div>
                    <div className="space-y-10 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                        {Array.from(new Set(tasks.filter(t => t.done).map(t => t.dateCompleted))).sort().reverse().map(date => (
                        <div key={date}>
                            <p className="text-[11px] font-black text-emerald-600 uppercase mb-4 bg-emerald-50 inline-block px-4 py-1.5 rounded-full tracking-[0.2em]">{date}</p>
                            <div className="space-y-3">
                            {tasks.filter(t => t.done && t.dateCompleted === date && t.text.toLowerCase().includes(searchTask.toLowerCase())).map(i => (
                                <div key={i.id} className="flex justify-between items-center group/item p-2">
                                <p className="text-sm font-bold text-stone-400 line-through">• {i.text}</p>
                                <button onClick={() => deleteDoc(doc(db, 'tasks', i.id))} className="text-red-200 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"><Trash2 size={16}/></button>
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
