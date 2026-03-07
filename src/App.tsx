import React, { useState, useEffect } from 'react';
import { PawPrint, CalendarDays, TrendingUp, Network, Baby, Milk, Trash2, PlusCircle, LogOut, Lock, UserPlus, Menu, X, DollarSign, Search, History, Package, LayoutDashboard, Edit2, ChevronRight, CheckCircle2, MinusCircle } from 'lucide-react';

// --- CONFIGURAZIONE FIREBASE ---
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

// --- COMPONENTE DINASTIA ---
const DynastyBranch = ({ animal, allAnimals, level = 0 }: { animal: Animal, allAnimals: Animal[], level: number }) => {
  const children = allAnimals.filter(a => a.sire === animal.id || a.dam === animal.id);
  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-emerald-100' : ''} mt-2`}>
      <div className={`flex items-center gap-3 p-3 bg-white rounded-r-lg shadow-sm border-b border-gray-100 ${level === 0 ? 'border-l-4 border-emerald-600' : 'ml-2'}`}>
        <div className="flex flex-col">
          <span className="font-bold text-gray-800">{animal.name}</span>
          <span className="text-[10px] text-gray-400 uppercase font-bold">Gen. {level} • {animal.species}</span>
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
  
  // Dati
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [births, setBirths] = useState<BirthRecord[]>([]);
  const [production, setProduction] = useState<Production[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newAnimal, setNewAnimal] = useState({ name: '', species: 'Maiali' as Species, birthDate: '', sire: '', dam: '' });
  const [newBirth, setNewBirth] = useState({ idCode: '', species: 'Maiali' as Species, count: 1, birthDate: '' });
  const [newProd, setNewProd] = useState({ item: '', quantity: 1, species: 'Maiali' as Species });
  const [newTrans, setNewTrans] = useState({ desc: '', amount: 0, type: 'Entrata' as 'Entrata' | 'Uscita', species: 'Maiali' as Species });
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 0, unit: 'kg' });
  const [newTask, setNewTask] = useState('');
  const [searchTask, setSearchTask] = useState('');

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

  // FUNZIONI AZIONE
  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.quantity <= 0) return;
    const existing = products.find(p => p.name.toLowerCase() === newProduct.name.toLowerCase());
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

  const completeTask = async (task: Task) => {
    await updateDoc(doc(db, 'tasks', task.id), { done: true, dateCompleted: new Date().toLocaleDateString('it-IT') });
  };

  const getGroupedHistory = () => {
    const groups: Record<string, Task[]> = {};
    tasks.filter(t => t.done && t.text.toLowerCase().includes(searchTask.toLowerCase())).forEach(t => {
      const date = t.dateCompleted || 'Recenti';
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });
    return groups;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-emerald-800 bg-stone-50">Caricamento AgriManage Pro...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
          <h1 className="text-3xl font-black text-center mb-6 text-emerald-950">AgriManage <span className="text-emerald-600">Pro</span></h1>
          <div className="space-y-4">
            <input type="email" placeholder="Email" className="ui-input w-full border p-3 rounded-xl" onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="ui-input w-full border p-3 rounded-xl" onChange={e => setPassword(e.target.value)} />
            <button onClick={() => signInWithEmailAndPassword(auth, email, password)} className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold">Accedi</button>
            <button onClick={() => createUserWithEmailAndPassword(auth, email, password)} className="w-full text-emerald-700 text-sm font-bold text-center">Registrati ora</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-stone-100/50 text-stone-900 font-sans">
      <style>{`.ui-input { background: white; padding: 0.75rem 1rem; border-radius: 0.75rem; border: 1px solid #e7e5e4; outline: none; } .ui-input:focus { border-color: #059669; }`}</style>

      {/* SIDEBAR */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-stone-200 p-6 flex flex-col transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center gap-3 mb-10 pb-4 border-b">
          <div className="bg-emerald-600 p-2.5 rounded-xl text-white"><DollarSign size={20} /></div>
          <h1 className="text-xl font-black tracking-tighter text-emerald-950 uppercase italic">AgriManage</h1>
          <button className="md:hidden ml-auto" onClick={() => setIsMobileMenuOpen(false)}><X size={20} /></button>
        </div>
        <nav className="space-y-1.5 flex-1 overflow-y-auto">
          {[
            { id: 'inventory', label: 'Inventario Capi', icon: PawPrint },
            { id: 'births', label: 'Registro Parti', icon: Baby },
            { id: 'production', label: 'Produzione', icon: Milk },
            { id: 'dinastia', label: 'Dinastia', icon: Network },
            { id: 'products', label: 'Prodotti e Scorte', icon: Package },
            { id: 'finance', label: 'Economia', icon: TrendingUp },
            { id: 'tasks', label: 'Attività', icon: CalendarDays }
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full p-3.5 rounded-xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-stone-500 hover:bg-stone-50'}`}>
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="mt-auto flex items-center gap-2 p-3 text-red-500 font-bold"><LogOut size={18} /> Esci</button>
      </aside>

      <main className="flex-1 p-4 md:p-10 h-screen overflow-y-auto scroll-smooth">
        <div className="mb-8 flex justify-between items-end">
          <h2 className="text-4xl font-black text-emerald-950 capitalize tracking-tighter">{activeTab}</h2>
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden bg-white p-3 rounded-xl border"><Menu size={24} /></button>
        </div>

        {/* --- INVENTARIO CAPI (Punto 1: Data Nascita) --- */}
        {activeTab === 'inventory' && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
              <h3 className="text-lg font-bold mb-6 text-emerald-900 uppercase text-xs tracking-widest">Aggiungi Capo</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input placeholder="Codice/Nome" className="ui-input" value={newAnimal.name} onChange={e => setNewAnimal({...newAnimal, name: e.target.value})} />
                <select className="ui-input" value={newAnimal.species} onChange={e => setNewAnimal({...newAnimal, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select>
                <input type="date" className="ui-input" value={newAnimal.birthDate} onChange={e => setNewAnimal({...newAnimal, birthDate: e.target.value})} />
                <select className="ui-input text-xs" value={newAnimal.sire} onChange={e => setNewAnimal({...newAnimal, sire: e.target.value})}><option value="">Padre (Ignoto)</option>{animals.filter(a => a.species === newAnimal.species).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                <button onClick={async () => { if(!newAnimal.name) return; await addDoc(collection(db, 'animals'), { ...newAnimal, notes: '', ownerId: user.uid }); setNewAnimal({name:'', species:'Maiali', birthDate:'', sire:'', dam:''}); }} className="bg-emerald-600 text-white font-bold rounded-xl py-3">Salva</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {animals.map(a => (
                <div key={a.id} className="bg-white p-5 rounded-2xl border relative group shadow-sm">
                  <h4 className="text-xl font-black">{a.name}</h4>
                  <p className="text-xs text-stone-400 mt-2 flex items-center gap-1.5 uppercase font-bold tracking-widest text-emerald-600">{a.species}</p>
                  <p className="text-xs text-stone-400 mt-1 italic">Nato: {a.birthDate || 'N/D'}</p>
                  <button onClick={() => deleteDoc(doc(db, 'animals', a.id))} className="absolute top-4 right-4 text-stone-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- REGISTRO PARTI (Punto 2: Layout e Specie) --- */}
        {activeTab === 'births' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full"><label className="text-[10px] font-black text-stone-400 mb-1 block uppercase">Nome Madre</label><input className="ui-input w-full" value={newBirth.idCode} onChange={e => setNewBirth({...newBirth, idCode: e.target.value})} /></div>
                <div className="w-full md:w-44"><label className="text-[10px] font-black text-stone-400 mb-1 block uppercase">Specie</label><select className="ui-input w-full" value={newBirth.species} onChange={e => setNewBirth({...newBirth, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select></div>
                <div className="w-full md:w-24"><label className="text-[10px] font-black text-stone-400 mb-1 block uppercase">Q.tà Nati</label><input type="number" className="ui-input w-full" value={newBirth.count} onChange={e => setNewBirth({...newBirth, count: parseInt(e.target.value)})} /></div>
                <div className="w-full md:w-44"><label className="text-[10px] font-black text-stone-400 mb-1 block uppercase">Data</label><input type="date" className="ui-input w-full" value={newBirth.birthDate} onChange={e => setNewBirth({...newBirth, birthDate: e.target.value})} /></div>
                <button onClick={async () => { if(!newBirth.idCode) return; await addDoc(collection(db, 'births'), { animalName: newBirth.idCode, species: newBirth.species, offspringCount: newBirth.count, birthDate: newBirth.birthDate, ownerId: user.uid }); setNewBirth({idCode:'', species:'Maiali', count:1, birthDate:''}); }} className="bg-emerald-600 text-white px-8 h-12 rounded-xl font-bold">Salva</button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border divide-y shadow-sm">
              {births.map(b => (
                <div key={b.id} className="p-4 flex justify-between items-center group">
                  <div><p className="font-bold">{b.animalName} <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 ml-2 font-black uppercase">{b.species}</span></p><p className="text-xs text-stone-400">{b.offspringCount} nati il {b.birthDate}</p></div>
                  <button onClick={() => deleteDoc(doc(db, 'births', b.id))} className="text-red-300 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- PRODUZIONE (Punto 3: Aggiunta/Modifica) --- */}
        {activeTab === 'production' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input placeholder="Prodotto" className="ui-input" value={newProd.item} onChange={e => setNewProd({...newProd, item: e.target.value})} />
                <input type="number" className="ui-input" value={newProd.quantity} onChange={e => setNewProd({...newProd, quantity: parseFloat(e.target.value)})} />
                <select className="ui-input" value={newProd.species} onChange={e => setNewProd({...newProd, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select>
                <button onClick={async () => { if(!newProd.item) return; await addDoc(collection(db, 'production'), { ...newProd, date: new Date().toLocaleDateString('it-IT'), ownerId: user.uid }); setNewProd({item:'', quantity:1, species:'Maiali'}); }} className="bg-emerald-600 text-white font-bold rounded-xl py-3">Registra</button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border divide-y shadow-sm">
              {production.map(p => (
                <div key={p.id} className="p-4 flex justify-between items-center group">
                  <div><p className="font-bold">{p.item} ({p.species})</p><p className="text-xs text-stone-500">Q.tà: {p.quantity} - {p.date}</p></div>
                  <button onClick={() => deleteDoc(doc(db, 'production', p.id))} className="text-red-300 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- DINASTIA --- */}
        {activeTab === 'dinastia' && (
          <div className="space-y-6">
            {speciesList.map(species => (
              <div key={species} className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm">
                <h3 className="text-2xl font-black text-emerald-950 mb-6 border-b pb-4 uppercase tracking-tighter">{species}</h3>
                {animals.filter(a => a.species === species && !a.sire).map(founder => (
                  <div key={founder.id} className="mb-6 last:mb-0"><DynastyBranch animal={founder} allAnimals={animals} level={0} /></div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* --- PRODOTTI (Punto 4: Somma Automatica) --- */}
        {activeTab === 'products' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl border shadow-sm">
              <h3 className="text-xl font-bold mb-6">Gestione Scorte Smart</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input placeholder="Nome Prodotto" className="ui-input" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                <input placeholder="Q.tà" type="number" className="ui-input" value={newProduct.quantity || ''} onChange={e => setNewProduct({...newProduct, quantity: parseFloat(e.target.value)})} />
                <select className="ui-input" value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})}><option>kg</option><option>litri</option><option>unità</option></select>
                <button onClick={handleAddProduct} className="bg-emerald-600 text-white font-bold rounded-xl py-3">Carica</button>
              </div>
              <p className="text-[10px] text-stone-400 mt-4 uppercase font-bold italic">* Prodotti con lo stesso nome verranno sommati automaticamente.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {products.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-2xl border text-center shadow-sm">
                  <div className="bg-emerald-50 w-10 h-10 rounded-lg flex items-center justify-center text-emerald-600 mx-auto mb-3"><Package size={20}/></div>
                  <h4 className="font-black text-stone-800 uppercase tracking-tight">{p.name}</h4>
                  <p className="text-3xl font-black text-emerald-600 my-1">{p.quantity} <span className="text-xs text-stone-400 uppercase">{p.unit}</span></p>
                  <div className="flex gap-2 justify-center mt-4">
                    <button onClick={() => reduceProduct(p.id, 1)} className="p-2 bg-stone-100 rounded-lg hover:text-red-500"><MinusCircle size={18}/></button>
                    <button onClick={() => deleteDoc(doc(db, 'products', p.id))} className="p-2 bg-stone-100 rounded-lg hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ECONOMIA (Punto 5: Specie Movimento) --- */}
        {activeTab === 'finance' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-6 rounded-3xl border shadow-sm">
              <input placeholder="Descrizione" className="ui-input" value={newTrans.desc} onChange={e => setNewTrans({...newTrans, desc: e.target.value})} />
              <input placeholder="Costo €" type="number" className="ui-input" value={newTrans.amount || ''} onChange={e => setNewTrans({...newTrans, amount: parseFloat(e.target.value)})} />
              <select className="ui-input font-bold" value={newTrans.type} onChange={e => setNewTrans({...newTrans, type: e.target.value as any})}><option>Entrata</option><option>Uscita</option></select>
              <select className="ui-input" value={newTrans.species} onChange={e => setNewTrans({...newTrans, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select>
              <button onClick={async () => { if(!newTrans.desc) return; await addDoc(collection(db, 'transactions'), { ...newTrans, date: new Date().toLocaleDateString('it-IT'), ownerId: user.uid }); setNewTrans({desc:'', amount:0, type:'Entrata', species:'Maiali'}); }} className="bg-emerald-600 text-white font-bold rounded-xl py-3">Registra</button>
            </div>
            {speciesList.map(s => (
              <div key={s} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                <h4 className="font-black uppercase text-xs text-stone-400 tracking-widest">{s}</h4>
                <span className={`text-xl font-black ${transactions.filter(t => t.species === s).reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  € {transactions.filter(t => t.species === s).reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* --- ATTIVITÀ (Punto 6: Storico e Ricerca) --- */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 pb-20">
            <div className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm">
              <h3 className="text-xl font-bold mb-6 text-emerald-950 uppercase text-xs tracking-widest">Agenda Oggi</h3>
              <div className="flex gap-3 mb-8">
                <input className="ui-input flex-1" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Aggiungi impegno..." />
                <button onClick={async () => { if(newTask) { await addDoc(collection(db, 'tasks'), { text: newTask, done: false, ownerId: user.uid }); setNewTask(''); } }} className="bg-emerald-600 text-white px-6 rounded-xl font-bold">Aggiungi</button>
              </div>
              <div className="space-y-2">
                {tasks.filter(t => !t.done).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl group hover:bg-emerald-50">
                    <div className="flex items-center gap-4"><button onClick={() => completeTask(t)} className="text-stone-300 hover:text-emerald-500"><CheckCircle2 size={24}/></button><span className="font-bold text-stone-700">{t.text}</span></div>
                    <button onClick={() => deleteDoc(doc(db, 'tasks', t.id))} className="text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm flex flex-col max-h-[600px]">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-2"><History size={16}/> Storico Lavori</h3>
                <div className="relative"><Search className="absolute left-3 top-2.5 text-stone-300" size={14}/><input className="ui-input pl-9 py-2 text-xs w-44" placeholder="Cerca nel passato..." value={searchTask} onChange={e => setSearchTask(e.target.value)} /></div>
              </div>
              <div className="space-y-6 overflow-y-auto pr-2">
                {Object.entries(getGroupedHistory()).sort((a,b) => b[0].localeCompare(a[0])).map(([date, items]) => (
                  <div key={date}>
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-3 bg-emerald-50 inline-block px-2 py-1 rounded">{date}</p>
                    <div className="space-y-1">
                      {items.map(i => (
                        <div key={i.id} className="flex justify-between items-center group p-1">
                          <p className="text-sm text-stone-400 line-through">• {i.text}</p>
                          <button onClick={() => deleteDoc(doc(db, 'tasks', i.id))} className="text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
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
