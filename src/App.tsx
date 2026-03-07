import React, { useState, useEffect } from 'react';
import { PawPrint, CalendarDays, TrendingUp, TreeDeciduous, Baby, Milk, Save, Edit2, Trash2, Plus, History, Search, Menu, X, DollarSign, PlusCircle, LogOut, Lock, UserPlus } from 'lucide-react';

// --- CONFIGURAZIONE CLOUD, AUTH E FIRESTORE ---
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, where, orderBy } from "firebase/firestore";
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

export default function App() {
  // Stati Autenticazione
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);

  // Stati Applicazione
  const [activeTab, setActiveTab] = useState('inventory');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [births, setBirths] = useState<BirthRecord[]>([]);
  const [production, setProduction] = useState<Production[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Stati Form
  const [newTask, setNewTask] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newAnimal, setNewAnimal] = useState({ name: '', species: 'Maiali' as Species, birthDate: '' });
  const [newBirth, setNewBirth] = useState({ idCode: '', species: 'Maiali' as Species, count: 1, birthDate: '' });
  const [newProd, setNewProd] = useState({ item: '', quantity: 1, species: 'Maiali' as Species });
  const [newTrans, setNewTrans] = useState({ desc: '', amount: 0, type: 'Entrata' as 'Entrata' | 'Uscita', species: 'Maiali' as Species });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', notes: '' });
  const [editParents, setEditParents] = useState({ sire: '', dam: '' });

  const speciesList: Species[] = ['Maiali', 'Cavalli', 'Mucche', 'Galline', 'Oche'];

  // 1. Gestione Accesso
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Sincronizzazione Dati Protetti (Filtro per ownerId)
  useEffect(() => {
    if (!user) {
        setAnimals([]); setBirths([]); setProduction([]); setTransactions([]); setTasks([]);
        return;
    }

    const qAnimals = query(collection(db, 'animals'), where("ownerId", "==", user.uid));
    const qBirths = query(collection(db, 'births'), where("ownerId", "==", user.uid));
    const qProd = query(collection(db, 'production'), where("ownerId", "==", user.uid));
    const qTrans = query(collection(db, 'transactions'), where("ownerId", "==", user.uid));
    const qTasks = query(collection(db, 'tasks'), where("ownerId", "==", user.uid));

    const unsubAnimals = onSnapshot(qAnimals, snap => setAnimals(snap.docs.map(d => ({id: d.id, ...d.data()})) as Animal[]));
    const unsubBirths = onSnapshot(qBirths, snap => setBirths(snap.docs.map(d => ({id: d.id, ...d.data()})) as BirthRecord[]));
    const unsubProd = onSnapshot(qProd, snap => setProduction(snap.docs.map(d => ({id: d.id, ...d.data()})) as Production[]));
    const unsubTrans = onSnapshot(qTrans, snap => setTransactions(snap.docs.map(d => ({id: d.id, ...d.data()})) as Transaction[]));
    const unsubTasks = onSnapshot(qTasks, snap => setTasks(snap.docs.map(d => ({id: d.id, ...d.data()})) as Task[]));

    return () => { unsubAnimals(); unsubBirths(); unsubProd(); unsubTrans(); unsubTasks(); };
  }, [user]);

  // Azioni Auth
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      setAuthError("Errore: controllare email e password (min. 6 caratteri)");
    }
  };

  const handleLogout = () => signOut(auth);

  // Azioni Database (Sempre con ownerId)
  const deleteFromCloud = async (coll: string, id: string) => await deleteDoc(doc(db, coll, id));
  const toggleTaskCloud = async (task: Task) => await updateDoc(doc(db, 'tasks', task.id), { done: !task.done, date: new Date().toLocaleDateString() });
  const saveAnimalEdit = async (id: string) => { await updateDoc(doc(db, 'animals', id), { name: editData.name, notes: editData.notes }); setEditingId(null); };
  
  const getBalance = (species: Species) => transactions.filter(t => t.species === species).reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0);
  const getCount = (species: Species) => animals.filter(a => a.species === species).reduce((acc, a) => acc + (a.quantity || 1), 0);
  const formatCurrency = (amount: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);

  const groupedTasks = tasks.filter(t => t.done && t.text.toLowerCase().includes(searchQuery.toLowerCase())).reduce((acc, task) => {
    acc[task.date] = acc[task.date] || []; acc[task.date].push(task); return acc;
  }, {} as Record<string, Task[]>);

  const navItems = [
    { id: 'inventory', label: 'Inventario Capi', icon: PawPrint },
    { id: 'births', label: 'Registro Parti', icon: Baby },
    { id: 'production', label: 'Produzione', icon: Milk },
    { id: 'genealogy', label: 'Genealogia', icon: TreeDeciduous },
    { id: 'finance', label: 'Economia', icon: TrendingUp },
    { id: 'tasks', label: 'Attività', icon: CalendarDays }
  ];

  if (loading) return <div className="min-h-screen bg-stone-100 flex items-center justify-center font-bold text-emerald-800">Caricamento AgriManage...</div>;

  // SCHERMATA LOGIN/REGISTRAZIONE
  if (!user) {
    return (
      <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-emerald-100">
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
            {authError && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg border border-red-100">{authError}</p>}
            <button type="submit" className="ui-button-primary w-full py-4 text-lg shadow-emerald-200">
              {isRegistering ? 'Registrati e Inizia' : 'Entra in Stalla'}
            </button>
          </form>
          <button onClick={() => {setIsRegistering(!isRegistering); setAuthError('');}} className="mt-6 text-emerald-700 text-sm w-full text-center font-bold hover:underline">
            {isRegistering ? 'Hai già un account? Accedi qui' : 'Non hai un account? Registrati ora'}
          </button>
        </div>
      </div>
    );
  }

  // INTERFACCIA APP COMPLETA (DOPO LOGIN)
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-stone-100/50 text-stone-900 overflow-hidden antialiased">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-white border-b border-stone-200 p-4 flex justify-between items-center z-20 sticky top-0">
        <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-lg text-white"><DollarSign size={18}/></div>
            <h1 className="text-lg font-bold text-emerald-950 tracking-tight">AgriManage Pro</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-lg bg-stone-100 text-stone-700"><Menu size={24} /></button>
      </div>

      {isMobileMenuOpen && ( <div className="fixed inset-0 bg-emerald-950/40 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} /> )}

      {/* SIDEBAR */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-white md:border-r border-stone-200 p-6 flex flex-col transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex justify-between items-center mb-10 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg shadow-emerald-200"><DollarSign size={24} /></div>
            <h1 className="text-2xl font-extrabold tracking-tighter text-emerald-950">AgriManage<span className="text-emerald-600">Pro</span></h1>
          </div>
          <button className="md:hidden p-2 text-stone-500" onClick={() => setIsMobileMenuOpen(false)}><X size={20} /></button>
        </div>
        
        <nav className="space-y-2 flex-1 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3.5 w-full p-3.5 rounded-xl font-medium transition-all ${activeTab === item.id ? 'bg-emerald-50 text-emerald-700 shadow-inner' : 'text-stone-700 hover:bg-stone-100 hover:text-emerald-800'}`}>
              <item.icon size={22} className={activeTab === item.id ? 'text-emerald-600' : 'text-stone-400'} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-stone-100">
            <div className="bg-stone-50 p-3 rounded-xl mb-4 border border-stone-100">
                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Account Attivo</p>
                <p className="text-xs font-bold text-stone-700 truncate">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-all">
                <LogOut size={20} /> Esci dall'app
            </button>
        </div>
      </aside>

      {/* CONTENUTO DINAMICO */}
      <main className="flex-1 p-4 md:p-10 h-[calc(100vh-69px)] md:h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200">
        
        <div className="mb-8 pb-4 border-b border-stone-200">
          <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Gestione Azienda</p>
          <h2 className="text-4xl font-black tracking-tighter text-emerald-950">{navItems.find(i=>i.id===activeTab)?.label}</h2>
        </div>

        {/* --- TAB INVENTARIO --- */}
        {activeTab === 'inventory' && (
          <div className="space-y-10">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6"><PlusCircle className="text-emerald-500" size={24}/><h3 className="text-xl font-bold text-emerald-950">Aggiungi Capo</h3></div>
              <div className="flex flex-col md:flex-row gap-4">
                <input placeholder="Codice Capo" className="ui-input flex-1" value={newAnimal.name} onChange={e => setNewAnimal({...newAnimal, name: e.target.value})} />
                <input type="date" className="ui-input md:w-48" value={newAnimal.birthDate} onChange={e => setNewAnimal({...newAnimal, birthDate: e.target.value})} />
                <select className="ui-input md:w-48" value={newAnimal.species} onChange={e => setNewAnimal({...newAnimal, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select>
                <button onClick={async () => { if(!newAnimal.name) return; await addDoc(collection(db, 'animals'), { ...newAnimal, notes: '', quantity: 1, sire: '', dam: '', ownerId: user.uid }); setNewAnimal({name: '', species: 'Maiali', birthDate: ''}); }} className="ui-button-primary">Registra</button>
              </div>
            </div>
            {speciesList.map(species => (
              <div key={species}>
                <div className="flex justify-between items-center mb-5 pb-2 border-b border-stone-200/70"><h3 className="text-2xl font-black text-emerald-950 tracking-tight">{species}</h3><span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm">{getCount(species)} capi</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {animals.filter(a => a.species === species).map(a => (
                    <div key={a.id} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:border-emerald-200 hover:shadow-lg transition-all group relative">
                      {editingId === a.id ? (
                        <div className="space-y-3">
                          <input className="ui-input w-full" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                          <textarea className="ui-input w-full text-sm h-20" value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} placeholder="Note..." />
                          <button onClick={() => saveAnimalEdit(a.id)} className="ui-button-primary w-full py-2">Salva</button>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-xl font-bold text-emerald-950 mb-1">{a.name}</h4>
                          <p className="text-sm text-stone-500 mb-4 flex items-center gap-1.5"><CalendarDays size={14}/> Nato il: {a.birthDate || 'N/D'}</p>
                          {a.notes && <p className="text-xs italic bg-stone-50 p-3 rounded-xl border border-stone-100 text-stone-600">{a.notes}</p>}
                          <div className="absolute top-4 right-4 flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingId(a.id); setEditData({name: a.name, notes: a.notes}); }} className="p-1.5 rounded-lg bg-stone-100 text-stone-500 hover:bg-emerald-100"><Edit2 size={16}/></button>
                            <button onClick={() => deleteFromCloud('animals', a.id)} className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100"><Trash2 size={16}/></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB PARTI --- */}
        {activeTab === 'births' && (
          <div className="space-y-8">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6"><PlusCircle className="text-emerald-500" size={24}/><h3 className="text-xl font-bold text-emerald-950">Nuovo Parto</h3></div>
              <div className="flex flex-col md:flex-row gap-4">
                <input placeholder="Codice Madre" className="ui-input flex-1" value={newBirth.idCode} onChange={e => setNewBirth({...newBirth, idCode: e.target.value})} />
                <input type="number" className="ui-input w-24" value={newBirth.count} onChange={e => setNewBirth({...newBirth, count: parseInt(e.target.value)})} />
                <input type="date" className="ui-input md:w-44" value={newBirth.birthDate} onChange={e => setNewBirth({...newBirth, birthDate: e.target.value})} />
                <select className="ui-input md:w-44" value={newBirth.species} onChange={e => setNewBirth({...newBirth, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select>
                <button onClick={async () => { if(!newBirth.idCode) return; await addDoc(collection(db, 'births'), { animalName: newBirth.idCode, species: newBirth.species, date: new Date().toLocaleDateString(), offspringCount: newBirth.count, birthDate: newBirth.birthDate, ownerId: user.uid }); await addDoc(collection(db, 'animals'), { name: `Cuccioli di ${newBirth.idCode}`, species: newBirth.species, notes: 'Nati in azienda', birthDate: newBirth.birthDate, quantity: newBirth.count, sire:'', dam:'', ownerId: user.uid }); setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' }); }} className="ui-button-primary">Salva</button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm divide-y divide-stone-100">
              {births.map(b => <div key={b.id} className="p-5 flex justify-between items-center group">
                <div><p className="font-bold text-emerald-950 text-lg">{b.animalName} <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 ml-2">{b.species}</span></p><p className="text-sm text-stone-500 flex items-center gap-1.5 mt-1"><Baby size={16} className="text-emerald-500"/> {b.offspringCount} nati il {b.birthDate}</p></div>
                <button onClick={() => deleteFromCloud('births', b.id)} className="p-2 rounded-lg bg-red-50 text-red-400 md:opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
              </div>)}
            </div>
          </div>
        )}

        {/* --- TAB PRODUZIONE --- */}
        {activeTab === 'production' && (
          <div className="space-y-8">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6"><PlusCircle className="text-emerald-500" size={24}/><h3 className="text-xl font-bold text-emerald-950">Produzione Giornaliera</h3></div>
              <div className="flex flex-col md:flex-row gap-4">
                <input placeholder="Prodotto (Latte, Uova...)" className="ui-input flex-1" value={newProd.item} onChange={e => setNewProd({...newProd, item: e.target.value})} />
                <input type="number" className="ui-input w-28" value={newProd.quantity} onChange={e => setNewProd({...newProd, quantity: parseInt(e.target.value)})} />
                <select className="ui-input md:w-44" value={newProd.species} onChange={e => setNewProd({...newProd, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select>
                <button onClick={async () => { if(!newProd.item) return; await addDoc(collection(db, 'production'), { ...newProd, date: new Date().toLocaleDateString(), ownerId: user.uid }); setNewProd({ item: '', quantity: 1, species: 'Maiali' }); }} className="ui-button-primary">Registra</button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm divide-y divide-stone-100">
              {production.map(p => <div key={p.id} className="p-5 flex justify-between items-center group">
                <div><p className="font-bold text-emerald-950 text-lg">{p.item} <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 ml-2">{p.species}</span></p><p className="text-sm text-stone-500 flex items-center gap-1.5 mt-1"><Milk size={16} className="text-emerald-500"/> {p.quantity} unità il {p.date}</p></div>
                <button onClick={() => deleteFromCloud('production', p.id)} className="p-2 rounded-lg bg-red-50 text-red-400 md:opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
              </div>)}
            </div>
          </div>
        )}

        {/* --- TAB ECONOMIA --- */}
        {activeTab === 'finance' && (
          <div className="space-y-10">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6"><PlusCircle className="text-emerald-500" size={24}/><h3 className="text-xl font-bold text-emerald-950">Transazione Finanziaria</h3></div>
              <div className="flex flex-col md:flex-row gap-4">
                <input placeholder="Descrizione Spesa/Ricavo" className="ui-input flex-1" value={newTrans.desc} onChange={e => setNewTrans({...newTrans, desc: e.target.value})} />
                <input type="number" className="ui-input w-32" value={newTrans.amount} onChange={e => setNewTrans({...newTrans, amount: parseInt(e.target.value)})} />
                <select className="ui-input md:w-36" value={newTrans.type} onChange={e => setNewTrans({...newTrans, type: e.target.value as 'Entrata' | 'Uscita'})}><option>Entrata</option><option>Uscita</option></select>
                <select className="ui-input md:w-44" value={newTrans.species} onChange={e => setNewTrans({...newTrans, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select>
                <button onClick={async () => { if(!newTrans.desc) return; await addDoc(collection(db, 'transactions'), { ...newTrans, date: new Date().toLocaleDateString(), ownerId: user.uid }); setNewTrans({ desc: '', amount: 0, type: 'Entrata', species: 'Maiali' }); }} className="ui-button-primary">Salva</button>
              </div>
            </div>
            {speciesList.map(species => (
              <div key={species}>
                <div className="flex justify-between items-center mb-5 pb-2 border-b border-stone-200/70"><h3 className="text-2xl font-black text-emerald-950">{species}</h3><div className="text-right"><p className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">Bilancio Specie</p><span className={`font-black text-xl ${getBalance(species) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(getBalance(species))}</span></div></div>
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm divide-y divide-stone-100">
                  {transactions.filter(t => t.species === species).map(t => <div key={t.id} className="p-5 flex justify-between items-center group">
                    <div><p className="font-bold text-stone-800">{t.desc}</p><p className="text-xs text-stone-400 mt-1">{t.date}</p></div>
                    <div className="flex items-center gap-4"><span className={`font-black ${t.type === 'Entrata' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'Entrata' ? '+' : '-'}{formatCurrency(t.amount)}</span><button onClick={() => deleteFromCloud('transactions', t.id)} className="p-2 rounded-lg bg-red-50 text-red-400 md:opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button></div>
                  </div>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB ATTIVITÀ --- */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
              <h3 className="text-2xl font-black text-emerald-950 mb-6 flex items-center gap-2.5"><CalendarDays className="text-emerald-600"/> Da fare</h3>
              <div className="flex gap-3 mb-6 pb-6 border-b border-stone-100">
                <input className="ui-input flex-1" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Aggiungi impegno..." />
                <button onClick={async () => { if(newTask) { await addDoc(collection(db, 'tasks'), { text: newTask, done: false, date: '', ownerId: user.uid }); setNewTask(''); } }} className="ui-button-primary px-4"><PlusCircle size={24}/></button>
              </div>
              <div className="space-y-1">
                {tasks.filter(t => !t.done).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-emerald-50 transition group">
                    <div className="flex items-center gap-4"><input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={t.done} onChange={() => toggleTaskCloud(t)} /><span className="font-bold text-stone-800">{t.text}</span></div>
                    <button onClick={() => deleteFromCloud('tasks', t.id)} className="p-2 rounded-lg bg-red-50 text-red-400 md:opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-stone-100"><h3 className="text-xl font-bold text-stone-700 flex items-center gap-2"><History size={20}/> Storico</h3><div className="relative"><Search className="absolute left-3 top-2.5 text-stone-300" size={16}/><input className="ui-input pl-9 py-2 text-xs w-40" placeholder="Cerca..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div></div>
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                {Object.entries(groupedTasks).map(([date, dailyTasks]) => (
                  <div key={date}>
                    <h4 className="font-black text-emerald-900 bg-emerald-50/50 px-3 py-1 rounded-lg text-xs mb-3">{date}</h4>
                    {dailyTasks.map(t => (
                        <div key={t.id} className="flex items-center justify-between group/hist py-1">
                            <p className="text-sm text-stone-500 flex items-center gap-2">• <span className="line-through">{t.text}</span></p>
                            <button onClick={() => deleteFromCloud('tasks', t.id)} className="p-1.5 rounded-lg text-red-300 hover:text-red-600 opacity-0 group-hover/hist:opacity-100 transition"><Trash2 size={14}/></button>
                        </div>
                    ))}
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
