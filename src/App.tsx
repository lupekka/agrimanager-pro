import React, { useState, useEffect } from 'react';
import { PawPrint, CalendarDays, TrendingUp, Network, Baby, Milk, Trash2, PlusCircle, LogOut, Lock, UserPlus, Menu, X, DollarSign, Search, History, Package, LayoutDashboard, Edit2, ChevronRight } from 'lucide-react';

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
interface Animal { id: string; name: string; species: Species; notes: string; sire?: string; dam?: string; birthDate?: string; quantity?: number; ownerId: string; }
interface BirthRecord { id: string; animalName: string; species: Species; date: string; offspringCount: number; birthDate: string; ownerId: string; }
interface Production { id: string; item: string; quantity: number; date: string; species: Species; ownerId: string; }
interface Transaction { id: string; type: 'Entrata' | 'Uscita'; amount: number; desc: string; species: Species; date: string; ownerId: string; }
interface Task { id: string; text: string; done: boolean; date: string; ownerId: string; }
interface Product { id: string; name: string; quantity: number; unit: string; ownerId: string; }

// --- COMPONENTE SUPPORTO DINASTIA ---
const DynastyBranch = ({ animal, allAnimals, level = 0 }: { animal: Animal, allAnimals: Animal[], level: number }) => {
  const children = allAnimals.filter(a => a.sire === animal.id || a.dam === animal.id);
  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-emerald-100' : ''} mt-2`}>
      <div className={`flex items-center gap-3 p-3 bg-white rounded-r-lg shadow-sm border-b border-gray-100 ${level === 0 ? 'border-l-4 border-emerald-600' : 'ml-2'}`}>
        <div className="flex flex-col">
          <span className="font-bold text-gray-800 flex items-center gap-2">
            {level > 0 && <ChevronRight size={14} className="text-emerald-400" />}
            {animal.name}
          </span>
          <span className="text-[10px] text-gray-400 uppercase font-bold">Gen. {level} • {animal.species}</span>
        </div>
      </div>
      {children.map(child => <DynastyBranch key={child.id} animal={child} allAnimals={allAnimals} level={level + 1} />)}
    </div>
  );
};

export default function App() {
  // Stati Auth
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);

  // Stati App
  const [activeTab, setActiveTab] = useState('inventory');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [births, setBirths] = useState<BirthRecord[]>([]);
  const [production, setProduction] = useState<Production[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Stati Form
  const [newTask, setNewTask] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dinastiaFilter, setDinastiaFilter] = useState('');
  const [newAnimal, setNewAnimal] = useState({ name: '', species: 'Maiali' as Species, birthDate: '', sire: '', dam: '' });
  const [newBirth, setNewBirth] = useState({ idCode: '', species: 'Maiali' as Species, count: 1, birthDate: '' });
  const [newProd, setNewProd] = useState({ item: '', quantity: 1, species: 'Maiali' as Species });
  const [newTrans, setNewTrans] = useState({ desc: '', amount: 0, type: 'Entrata' as 'Entrata' | 'Uscita', species: 'Maiali' as Species });
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 0, unit: 'kg' });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', notes: '' });

  const speciesList: Species[] = ['Maiali', 'Cavalli', 'Mucche', 'Galline', 'Oche'];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const qF = (coll: string) => query(collection(db, coll), where("ownerId", "==", user.uid));
    
    const unsubA = onSnapshot(qF('animals'), s => setAnimals(s.docs.map(d => ({id: d.id, ...d.data()})) as Animal[]));
    const unsubB = onSnapshot(qF('births'), s => setBirths(s.docs.map(d => ({id: d.id, ...d.data()})) as BirthRecord[]));
    const unsubP = onSnapshot(qF('production'), s => setProduction(s.docs.map(d => ({id: d.id, ...d.data()})) as Production[]));
    const unsubT = onSnapshot(qF('transactions'), s => setTransactions(s.docs.map(d => ({id: d.id, ...d.data()})) as Transaction[]));
    const unsubTk = onSnapshot(qF('tasks'), s => setTasks(s.docs.map(d => ({id: d.id, ...d.data()})) as Task[]));
    const unsubPr = onSnapshot(qF('products'), s => setProducts(s.docs.map(d => ({id: d.id, ...d.data()})) as Product[]));

    return () => { unsubA(); unsubB(); unsubP(); unsubT(); unsubTk(); unsubPr(); };
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) { setAuthError("Errore credenziali (min. 6 caratteri)"); }
  };

  const getBalance = (s: Species) => transactions.filter(t => t.species === s).reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0);
  const getCount = (s: Species) => animals.filter(a => a.species === s).reduce((acc, a) => acc + (a.quantity || 1), 0);

  const navItems = [
    { id: 'inventory', label: 'Inventario Capi', icon: PawPrint },
    { id: 'births', label: 'Registro Parti', icon: Baby },
    { id: 'production', label: 'Produzione', icon: Milk },
    { id: 'dinastia', label: 'Dinastia', icon: Network },
    { id: 'products', label: 'Inventario Prodotti', icon: Package },
    { id: 'finance', label: 'Economia', icon: TrendingUp },
    { id: 'tasks', label: 'Attività', icon: CalendarDays }
  ];

  if (loading) return <div className="min-h-screen bg-stone-100 flex items-center justify-center font-bold text-emerald-800">Caricamento AgriManage...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
        <style>{`.ui-input { width: 100%; padding: 0.75rem 1rem; border-radius: 0.75rem; border: 1px solid #e7e5e4; outline: none; transition: all 0.2s; } .ui-input:focus { border-color: #059669; ring: 2px; ring-color: #d1fae5; } .ui-button-primary { background-color: #059669; color: white; font-weight: 700; padding: 0.75rem 1.5rem; border-radius: 0.75rem; transition: all 0.2s; shadow: 0 4px 6px -1px rgba(0,0,0,0.1); } .ui-button-primary:hover { background-color: #047857; }`}</style>
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-emerald-600 w-20 h-20 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl">
              {isRegistering ? <UserPlus size={40} /> : <Lock size={40} />}
            </div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tighter">AgriManage <span className="text-emerald-600">Pro</span></h1>
            <p className="text-stone-500 mt-2 font-medium">{isRegistering ? 'Crea il tuo spazio aziendale' : 'Accedi alla tua azienda'}</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" required className="ui-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email aziendale" />
            <input type="password" required className="ui-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
            {authError && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg">{authError}</p>}
            <button type="submit" className="ui-button-primary w-full py-4 text-lg">{isRegistering ? 'Registrati' : 'Entra in Stalla'}</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="mt-6 text-emerald-700 text-sm w-full text-center font-bold">{isRegistering ? 'Hai già un account? Accedi' : 'Registrati ora'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-stone-100/50 text-stone-900 overflow-hidden antialiased font-sans">
      <style>{`.ui-input { background: white; width: 100%; padding: 0.75rem 1rem; border-radius: 0.75rem; border: 1px solid #e7e5e4; outline: none; transition: all 0.2s; } .ui-input:focus { border-color: #059669; border-width: 1px; } .ui-button-primary { background-color: #059669; color: white; font-weight: 700; padding: 0.75rem 1.5rem; border-radius: 0.75rem; border: none; cursor: pointer; }`}</style>
      
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center z-20 sticky top-0">
        <h1 className="text-lg font-bold text-emerald-950">AgriManage Pro</h1>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-stone-100 rounded-lg"><Menu size={24} /></button>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-white md:border-r border-stone-200 p-6 flex flex-col transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex justify-between items-center mb-10 pb-4 border-b">
          <h1 className="text-2xl font-extrabold tracking-tighter text-emerald-950">AgriManage<span className="text-emerald-600">Pro</span></h1>
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}><X size={20} /></button>
        </div>
        <nav className="space-y-2 flex-1 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3.5 w-full p-3.5 rounded-xl font-medium transition-all ${activeTab === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-stone-700 hover:bg-stone-100'}`}>
              <item.icon size={22} className={activeTab === item.id ? 'text-emerald-600' : 'text-stone-400'} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="mt-auto pt-6 border-t flex items-center gap-3 w-full p-3 text-red-600 font-bold"><LogOut size={20} /> Esci</button>
      </aside>

      <main className="flex-1 p-4 md:p-10 h-screen overflow-y-auto">
        <div className="mb-8"><p className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Gestione Azienda</p><h2 className="text-4xl font-black text-emerald-950">{navItems.find(i=>i.id===activeTab)?.label}</h2></div>

        {/* --- INVENTARIO CAPI --- */}
        {activeTab === 'inventory' && (
          <div className="space-y-10">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6"><PlusCircle className="text-emerald-500" size={24}/><h3 className="text-xl font-bold text-emerald-950">Aggiungi Capo</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input placeholder="Codice Capo" className="ui-input" value={newAnimal.name} onChange={e => setNewAnimal({...newAnimal, name: e.target.value})} />
                <select className="ui-input" value={newAnimal.species} onChange={e => setNewAnimal({...newAnimal, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select>
                <select className="ui-input" value={newAnimal.sire} onChange={e => setNewAnimal({...newAnimal, sire: e.target.value})}>
                    <option value="">Seleziona Padre</option>
                    {animals.filter(a => a.species === newAnimal.species).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select className="ui-input" value={newAnimal.dam} onChange={e => setNewAnimal({...newAnimal, dam: e.target.value})}>
                    <option value="">Seleziona Madre</option>
                    {animals.filter(a => a.species === newAnimal.species).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <button onClick={async () => { if(!newAnimal.name) return; await addDoc(collection(db, 'animals'), { ...newAnimal, notes: '', ownerId: user.uid }); setNewAnimal({name:'', species:'Maiali', birthDate:'', sire:'', dam:''}); }} className="ui-button-primary">Registra</button>
              </div>
            </div>
            {speciesList.map(species => (
              <div key={species} className="mb-8">
                <h3 className="text-2xl font-black text-emerald-950 border-b mb-4 pb-2">{species} <span className="text-sm font-normal text-stone-400">({getCount(species)} capi)</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {animals.filter(a => a.species === species).map(a => (
                    <div key={a.id} className="bg-white p-6 rounded-2xl border shadow-sm group relative">
                      <h4 className="text-xl font-bold">{a.name}</h4>
                      <div className="mt-2 text-xs text-stone-400">Padre: {animals.find(p => p.id === a.sire)?.name || 'Ignoto'} • Madre: {animals.find(p => p.id === a.dam)?.name || 'Ignota'}</div>
                      <button onClick={() => deleteFromCloud('animals', a.id)} className="absolute top-4 right-4 text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- DINASTIA --- */}
        {activeTab === 'dinastia' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center gap-4">
              <Search className="text-stone-300" />
              <input placeholder="Filtra Dinastia per Specie..." className="ui-input" value={dinastiaFilter} onChange={e => setDinastiaFilter(e.target.value)} />
            </div>
            {speciesList.filter(s => s.toLowerCase().includes(dinastiaFilter.toLowerCase())).map(species => (
              <div key={species} className="bg-white p-8 rounded-3xl border shadow-sm">
                <h3 className="text-xl font-black text-emerald-800 mb-6 uppercase tracking-widest">{species}</h3>
                {animals.filter(a => a.species === species && !a.sire && !a.dam).map(founder => (
                    <div key={founder.id} className="mb-8 border-b pb-6 last:border-0">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase">Linea di sangue principale</p>
                        <DynastyBranch animal={founder} allAnimals={animals} level={0} />
                    </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* --- INVENTARIO PRODOTTI --- */}
        {activeTab === 'products' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl border shadow-sm">
              <h3 className="text-xl font-bold mb-6">Aggiungi a Inventario</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input placeholder="Prodotto (es. Mangime)" className="ui-input" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                <input placeholder="Q.tà" type="number" className="ui-input" value={newProduct.quantity} onChange={e => setNewProduct({...newProduct, quantity: parseFloat(e.target.value)})} />
                <select className="ui-input" value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})}><option>kg</option><option>litri</option><option>unità</option><option>sacchi</option></select>
                <button onClick={async () => { await addDoc(collection(db, 'products'), { ...newProduct, ownerId: user.uid }); setNewProduct({name:'', quantity:0, unit:'kg'}); }} className="ui-button-primary">Aggiungi</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {products.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                        <Package className="mx-auto text-emerald-100 mb-2" size={32} />
                        <h4 className="font-bold">{p.name}</h4>
                        <p className="text-2xl font-black text-emerald-600">{p.quantity} <span className="text-xs uppercase">{p.unit}</span></p>
                        <button onClick={() => deleteFromCloud('products', p.id)} className="mt-4 text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* --- ALTRE TAB (LOGICA ORIGINALE) --- */}
        {activeTab === 'births' && (
            <div className="space-y-8">
                <div className="bg-white p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row gap-4">
                    <input placeholder="Codice Madre" className="ui-input flex-1" value={newBirth.idCode} onChange={e => setNewBirth({...newBirth, idCode: e.target.value})} />
                    <input type="number" className="ui-input w-24" value={newBirth.count} onChange={e => setNewBirth({...newBirth, count: parseInt(e.target.value)})} />
                    <input type="date" className="ui-input" value={newBirth.birthDate} onChange={e => setNewBirth({...newBirth, birthDate: e.target.value})} />
                    <button onClick={async () => { await addDoc(collection(db, 'births'), { animalName: newBirth.idCode, species: newBirth.species, date: new Date().toLocaleDateString(), offspringCount: newBirth.count, birthDate: newBirth.birthDate, ownerId: user.uid }); setNewBirth({idCode:'', species:'Maiali', count:1, birthDate:''}); }} className="ui-button-primary">Salva</button>
                </div>
                <div className="bg-white rounded-2xl border shadow-sm divide-y">
                    {births.map(b => <div key={b.id} className="p-4 flex justify-between items-center"><div><p className="font-bold">{b.animalName}</p><p className="text-xs text-stone-400">{b.offspringCount} nati il {b.birthDate}</p></div><button onClick={() => deleteFromCloud('births', b.id)} className="text-red-300"><Trash2 size={18}/></button></div>)}
                </div>
            </div>
        )}

        {activeTab === 'finance' && (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-8 rounded-3xl border">
                    <input placeholder="Descrizione" className="ui-input" value={newTrans.desc} onChange={e => setNewTrans({...newTrans, desc: e.target.value})} />
                    <input type="number" className="ui-input" value={newTrans.amount} onChange={e => setNewTrans({...newTrans, amount: parseFloat(e.target.value)})} />
                    <select className="ui-input" value={newTrans.type} onChange={e => setNewTrans({...newTrans, type: e.target.value as any})}><option>Entrata</option><option>Uscita</option></select>
                    <button onClick={async () => { await addDoc(collection(db, 'transactions'), { ...newTrans, date: new Date().toLocaleDateString(), ownerId: user.uid }); setNewTrans({desc:'', amount:0, type:'Entrata', species:'Maiali'}); }} className="ui-button-primary">Salva</button>
                </div>
                {speciesList.map(s => <div key={s} className="bg-white p-6 rounded-3xl border flex justify-between items-center"><div><h4 className="font-bold">{s}</h4><p className="text-xs text-stone-400">Bilancio aggiornato</p></div><span className={`text-xl font-black ${getBalance(s) >= 0 ? 'text-green-600' : 'text-red-600'}`}>€ {getBalance(s).toFixed(2)}</span></div>)}
            </div>
        )}

        {activeTab === 'tasks' && (
            <div className="bg-white p-8 rounded-3xl border shadow-sm">
                <div className="flex gap-4 mb-8">
                    <input className="ui-input" placeholder="Nuova attività..." value={newTask} onChange={e => setNewTask(e.target.value)} />
                    <button onClick={async () => { await addDoc(collection(db, 'tasks'), { text: newTask, done: false, date:'', ownerId: user.uid }); setNewTask(''); }} className="ui-button-primary">Aggiungi</button>
                </div>
                <div className="space-y-2">
                    {tasks.filter(t => !t.done).map(t => <div key={t.id} className="p-4 bg-stone-50 rounded-xl flex justify-between"><span>{t.text}</span><button onClick={() => deleteFromCloud('tasks', t.id)} className="text-red-300"><Trash2 size={16}/></button></div>)}
                </div>
            </div>
        )}

      </main>
    </div>
  );
}

const deleteFromCloud = async (coll: string, id: string) => await deleteDoc(doc(db, coll, id));
