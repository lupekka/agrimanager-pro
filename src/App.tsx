import React, { useState, useEffect } from 'react';
import {
  PawPrint, CalendarDays, TrendingUp, Network, Baby, Trash2,
  PlusCircle, LogOut, Lock, Menu, X, Search, LayoutDashboard,
  History, Package, Edit2, CheckCircle2,
  MinusCircle, Activity, ListChecks, Wallet,
  ArrowUpRight, ArrowDownLeft, Ghost, UserPlus, Stethoscope, 
  UploadCloud, AlertTriangle, FileDown, Store, ShoppingBag, 
  MessageCircle, Mail, Bot, Info, Send
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, where, getDocs, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setDoc, getDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";

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
const db = initializeFirestore(app, { localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}) });
const auth = getAuth(app);

// --- INTERFACCE DATI ---
type Species = 'Maiali' | 'Cavalli' | 'Mucche' | 'Galline' | 'Oche';
interface Animal { id: string; name: string; species: Species; notes: string; sire?: string; dam?: string; birthDate?: string; ownerId: string; }
interface Transaction { id: string; type: 'Entrata' | 'Uscita'; amount: number; desc: string; species: Species; date: string; ownerId: string; }
interface Task { id: string; text: string; done: boolean; dueDate?: string; ownerId: string; }
interface Product { id: string; name: string; quantity: number; unit: string; ownerId: string; }
interface MarketItem { id: string; name: string; price: number; quantity: number; unit: string; sellerId: string; sellerName: string; contactEmail: string; contactPhone: string; createdAt: string; }

// --- COMPONENTE GENEALOGIA ---
const DynastyBranch = ({ animal, allAnimals, level = 0 }: { animal: Animal, allAnimals: Animal[], level?: number }) => {
  const children = allAnimals.filter(a => a.dam === animal.name || a.sire === animal.name || a.dam === animal.id || a.sire === animal.id);
  return (
    <div className={level > 0 ? "ml-6 border-l-2 border-emerald-100 pl-4 mt-2" : "mt-2"}>
      <div className={`p-3 rounded-xl border bg-white shadow-sm ${level === 0 ? 'border-l-4 border-emerald-500' : ''}`}>
        <p className="font-black text-stone-800 text-sm uppercase">{animal.name}</p>
        <p className="text-[9px] text-stone-400 font-bold">SPECIE: {animal.species} • GEN {level}</p>
      </div>
      {children.map(child => <DynastyBranch key={child.id} animal={child} allAnimals={allAnimals} level={level + 1} />)}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'farmer' | 'consumer' | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRegistering, setIsRegistering] = useState(false);

  // --- DATI ---
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);

  // --- INPUT FORM ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regRole, setRegRole] = useState<'farmer' | 'consumer'>('farmer');
  const [regName, setRegName] = useState('');
  const [newAnimal, setNewAnimal] = useState({ name: '', species: 'Maiali' as Species, birthDate: '', dam: '', sire: '', notes: '' });
  const [newBirth, setNewBirth] = useState({ idCode: '', species: 'Maiali' as Species, count: 1, birthDate: '' });
  const [newTrans, setNewTrans] = useState({ desc: '', amount: 0, type: 'Entrata' as any, species: 'Maiali' as Species });
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 0, unit: 'kg' });
  const [newTask, setNewTask] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

  // --- IA & VET & MERCATO ---
  const [showAssistant, setShowAssistant] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [vetSymptom, setVetSymptom] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [vetResult, setVetResult] = useState<any>(null);
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
  const [sellPrice, setSellPrice] = useState(0);
  const [sellPhone, setSellPhone] = useState('');

  const speciesList: Species[] = ['Maiali', 'Cavalli', 'Mucche', 'Galline', 'Oche'];
  const validAnimals = animals.filter(a => a.name && a.name.trim().length > 0);

  // --- LOGICA ACCESSO ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          const d = userDoc.data();
          setUserRole(d.role);
          setUserName(d.name || 'Utente');
          setActiveTab(d.role === 'consumer' ? 'market' : 'dashboard');
        } else {
          setUserRole('farmer'); setUserName('Azienda Agricola'); setActiveTab('dashboard');
        }
      } else { setUser(null); setUserRole(null); }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- SINCRONIZZAZIONE DATABASE ---
  useEffect(() => {
    if (!user?.uid || !userRole) return;
    const unsubs: any[] = [];
    unsubs.push(onSnapshot(collection(db, 'market_items'), s => setMarketItems(s.docs.map(d => ({ id: d.id, ...d.data() } as MarketItem)))));
    if (userRole === 'farmer') {
      const q = (coll: string) => query(collection(db, coll), where("ownerId", "==", user.uid));
      unsubs.push(onSnapshot(q('animals'), s => setAnimals(s.docs.map(d => ({ id: d.id, ...d.data() } as Animal)))));
      unsubs.push(onSnapshot(q('transactions'), s => setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)))));
      unsubs.push(onSnapshot(q('tasks'), s => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() } as Task)))));
      unsubs.push(onSnapshot(q('products'), s => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as Product)))));
    }
    return () => unsubs.forEach(u => u());
  }, [user?.uid, userRole]);

  // --- FUNZIONI CORE ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        const uc = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', uc.user.uid), { role: regRole, name: regName, email });
      } else { await signInWithEmailAndPassword(auth, email, password); }
    } catch (e) { alert("Errore di accesso. Controlla email e password."); }
  };

  const handleSaveAnimal = async () => {
    if (!newAnimal.name.trim()) return alert("Nome/ID Capo obbligatorio.");
    await addDoc(collection(db, 'animals'), { ...newAnimal, ownerId: user!.uid });
    setNewAnimal({ name: '', species: 'Maiali', birthDate: '', dam: '', sire: '', notes: '' });
  };

  const handleSaveBirth = async () => {
    if (!newBirth.idCode.trim()) return alert("Indica l'ID della madre.");
    await addDoc(collection(db, 'births'), { ...newBirth, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    for (let i = 0; i < newBirth.count; i++) {
      await addDoc(collection(db, 'animals'), {
        name: `NATO_${newBirth.idCode}_${Math.floor(Math.random()*1000)}`,
        species: newBirth.species, birthDate: newBirth.birthDate, dam: newBirth.idCode,
        notes: 'Nascita registrata', ownerId: user!.uid
      });
    }
    setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' });
    alert("Parto salvato e figli aggiunti all'inventario.");
  };

  const handleSaveTransaction = async () => {
    if (newTrans.amount <= 0 || !newTrans.desc) return alert("Inserisci descrizione e importo.");
    await addDoc(collection(db, 'transactions'), { ...newTrans, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    setNewTrans({ desc: '', amount: 0, type: 'Entrata', species: 'Maiali' });
  };

  const handleAICommand = async () => {
    if (!aiInput.trim()) return;
    setAiLogs(["Analisi comando..."]);
    const frasi = aiInput.toLowerCase().split(/ e |,|\./).filter(s => s.trim());
    let logs = [];
    for (let f of frasi) {
      const num = f.match(/(\d+)/)?.[1];
      if (f.includes('venduto') && num) {
        await addDoc(collection(db, 'transactions'), { desc: `VENDITA IA: ${f}`, amount: Number(num), type: 'Entrata', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        logs.push(`✅ Registrata Entrata: ${num}€`);
      } else if (f.includes('speso') || f.includes('comprato') && num) {
        await addDoc(collection(db, 'transactions'), { desc: `SPESA IA: ${f}`, amount: Number(num), type: 'Uscita', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        logs.push(`✅ Registrata Uscita: ${num}€`);
      } else if (f.includes('ho') && num) {
        const prod = f.replace(/ho|(\d+)/g, '').trim().toUpperCase();
        await addDoc(collection(db, 'products'), { name: prod, quantity: Number(num), unit: 'unità', ownerId: user!.uid });
        logs.push(`✅ Magazzino: ${num} ${prod}`);
      }
    }
    setAiLogs(logs); setAiInput('');
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.quantity <= 0) return;
    const existing = products.find(p => p.name.toLowerCase() === newProduct.name.toLowerCase());
    if (existing) { await updateDoc(doc(db, 'products', existing.id), { quantity: existing.quantity + newProduct.quantity }); }
    else { await addDoc(collection(db, 'products'), { ...newProduct, ownerId: user!.uid }); }
    setNewProduct({ name: '', quantity: 0, unit: 'kg' });
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await addDoc(collection(db, 'tasks'), { text: newTask, done: false, dueDate: newTaskDate, ownerId: user!.uid });
    setNewTask('');
  };

  const handlePublishToMarket = async () => {
    if (!sellingProduct || sellPrice <= 0) return alert("Inserisci un prezzo.");
    await addDoc(collection(db, 'market_items'), { 
      name: sellingProduct.name, price: sellPrice, quantity: sellingProduct.quantity, unit: sellingProduct.unit, 
      sellerId: user!.uid, sellerName: userName, contactEmail: user!.email, contactPhone: sellPhone, createdAt: new Date().toISOString() 
    });
    setSellingProduct(null); alert("Prodotto ora nel mercato!");
  };

  const exportASLReport = () => {
    const doc = new jsPDF(); const n = window.prompt("Nome Azienda:") || "Azienda";
    doc.setFontSize(20); doc.text(n, 14, 20);
    const capiOrdinati = [...animals].sort((a,b) => a.species.localeCompare(b.species));
    autoTable(doc, { 
      head: [['CODICE', 'SPECIE', 'NASCITA', 'MADRE', 'NOTE']], 
      body: capiOrdinati.map(a => [a.name, a.species, a.birthDate || '', a.dam || '', a.notes]),
      startY: 30 
    });
    doc.save(`Registro_${n.replace(/ /g,'_')}.pdf`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-emerald-800 bg-stone-50 animate-pulse uppercase tracking-widest">AgriManage Pro 2026...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm border">
          <div className="flex justify-center mb-6"><div className="bg-emerald-600 p-4 rounded-3xl text-white shadow-lg"><TrendingUp size={32}/></div></div>
          <h1 className="text-3xl font-black text-center mb-2 text-emerald-950 italic tracking-tighter">AgriManage Pro</h1>
          <p className="text-center text-stone-400 text-[10px] font-black uppercase tracking-widest mb-10">Gestionale & Marketplace</p>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-4 bg-stone-50 p-4 rounded-2xl border mb-4">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRegRole('farmer')} className={`flex-1 p-3 rounded-xl text-[10px] font-black border transition-all ${regRole === 'farmer' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-stone-400'}`}>AZIENDA</button>
                  <button type="button" onClick={() => setRegRole('consumer')} className={`flex-1 p-3 rounded-xl text-[10px] font-black border transition-all ${regRole === 'consumer' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-stone-400'}`}>CLIENTE</button>
                </div>
                <input placeholder="Nome o Azienda" className="w-full p-4 rounded-2xl border-none shadow-inner bg-white font-bold text-sm" value={regName} onChange={e => setRegName(e.target.value)} required />
              </div>
            )}
            <input type="email" placeholder="Email" className="w-full p-4 rounded-2xl border-none shadow-inner bg-stone-50 font-bold text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="w-full p-4 rounded-2xl border-none shadow-inner bg-stone-50 font-bold text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-700 text-white py-4 rounded-2xl font-black uppercase shadow-lg active:scale-95 transition-all">{isRegistering ? "Registrati" : "Accedi"}</button>
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-[10px] font-black text-stone-400 uppercase tracking-widest mt-4 underline">{isRegistering ? "Hai un account? Accedi" : "Nuovo Utente? Registrati"}</button>
          </form>
        </div>
      </div>
    );
  }

  const menuItems = userRole === 'farmer' ? [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'inventory', label: 'Capi', icon: PawPrint },
    { id: 'births', label: 'Parti', icon: Baby },
    { id: 'finance', label: 'Bilancio', icon: Wallet },
    { id: 'products', label: 'Scorte', icon: Package },
    { id: 'tasks', label: 'Agenda', icon: ListChecks },
    { id: 'dinastia', label: 'Albero', icon: Network },
    { id: 'vet', label: 'Vet IA', icon: Stethoscope },
    { id: 'market', label: 'Mercato', icon: Store }
  ] : [
    { id: 'market', label: 'Negozio', icon: ShoppingBag }
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col md:flex-row relative text-stone-900 font-sans overflow-x-hidden">
      
      {/* ASSISTENTE IA FLOATING */}
      {userRole === 'farmer' && (
        <button onClick={() => setShowAssistant(!showAssistant)} className="fixed bottom-24 right-4 md:bottom-8 md:right-8 bg-blue-600 text-white p-4 rounded-full shadow-2xl z-50 hover:scale-110 transition-transform active:scale-90">
          <Bot size={28} />
        </button>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r p-6 fixed h-full shadow-sm z-40">
        <h1 className="text-2xl font-black mb-10 text-emerald-900 italic tracking-tighter uppercase">AgriPro</h1>
        <nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 w-full p-4 rounded-2xl font-black text-xs uppercase transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-50'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="text-red-500 font-black flex items-center gap-3 p-4 mt-auto text-xs uppercase"><LogOut size={18}/> Esci</button>
      </aside>

      {/* MOBILE NAV BOTTOM */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t flex justify-around p-3 z-50 shadow-lg overflow-x-auto hide-scrollbar">
        {menuItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center min-w-[65px] gap-1 ${activeTab === item.id ? 'text-emerald-600' : 'text-stone-300'}`}>
            <item.icon size={20} />
            <span className="text-[7px] font-black uppercase">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* CONTENUTO PRINCIPALE */}
      <main className="flex-1 md:ml-64 p-4 md:p-10 pb-32">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-stone-900 italic uppercase tracking-tighter">{activeTab}</h2>
            <span className="bg-white px-3 py-1 rounded-full border text-[9px] font-black uppercase text-stone-400">Utente: {userName}</span>
        </div>

        {/* MODALE IA */}
        {showAssistant && (
          <div className="mb-8 bg-white p-6 rounded-3xl border-2 border-blue-100 shadow-xl animate-in slide-in-from-top-4">
            <h3 className="text-blue-900 font-black text-xs uppercase mb-4 flex items-center gap-2 italic"><Bot size={16}/> Assistente Vocale</h3>
            <div className="flex gap-2">
              <input className="flex-1 p-3 bg-blue-50 border-none rounded-xl font-bold text-sm shadow-inner" placeholder="Esempio: 'Venduto maiale a 100€ e speso 50€ fieno'" value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleAICommand()} />
              <button onClick={handleAICommand} className="bg-blue-600 text-white px-6 rounded-xl font-black text-xs">OK</button>
            </div>
            {aiLogs.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{aiLogs.map((l, i) => <span key={i} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black animate-in zoom-in">{l}</span>)}</div>}
          </div>
        )}

        {/* --- 1. DASHBOARD --- */}
        {activeTab === 'dashboard' && userRole === 'farmer' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in">
            <div onClick={()=>setActiveTab('inventory')} className="bg-emerald-600 p-6 rounded-3xl text-white shadow-xl cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group">
              <p className="text-[10px] font-black uppercase opacity-60 mb-1">Capi Attivi</p>
              <h4 className="text-4xl font-black italic">{animals.length}</h4>
              <PawPrint size={64} className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform"/>
            </div>
            <div onClick={()=>setActiveTab('finance')} className="bg-white p-6 rounded-3xl border shadow-sm cursor-pointer hover:border-emerald-300 transition-all">
               <p className="text-[10px] font-black text-stone-400 uppercase mb-1">Saldo Netto</p>
               <h4 className="text-2xl font-black italic">€{transactions.reduce((acc,t)=>acc+(t.type==='Entrata'?t.amount:-t.amount),0)}</h4>
            </div>
            <div onClick={()=>setActiveTab('tasks')} className="bg-stone-900 p-6 rounded-3xl text-white shadow-xl cursor-pointer">
               <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Attività</p>
               <h4 className="text-2xl font-black italic">{tasks.filter(t=>!t.done).length}</h4>
            </div>
          </div>
        )}

        {/* --- 2. INVENTARIO (ORDINATO PER SPECIE) --- */}
        {activeTab === 'inventory' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-4">
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest italic flex items-center gap-2">Nuovo Capo</h3>
                <button onClick={exportASLReport} className="text-[10px] font-black bg-stone-100 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all uppercase"><FileDown size={14}/> Scarica PDF</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input placeholder="Codice Capo (ID)" className="p-3 bg-stone-50 border-none rounded-xl font-bold text-sm shadow-inner" value={newAnimal.name} onChange={e=>setNewAnimal({...newAnimal, name:e.target.value})} />
                <select className="p-3 bg-stone-50 border-none rounded-xl font-bold text-sm shadow-inner uppercase" value={newAnimal.species} onChange={e=>setNewAnimal({...newAnimal, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                <input type="date" className="p-3 bg-stone-50 border-none rounded-xl font-bold text-sm shadow-inner" value={newAnimal.birthDate} onChange={e=>setNewAnimal({...newAnimal, birthDate:e.target.value})} />
                <button onClick={handleSaveAnimal} className="bg-emerald-600 text-white font-black rounded-xl p-3 uppercase text-[10px] shadow-lg">Aggiungi</button>
              </div>
            </div>

            {speciesList.map(specie => {
              const capi = animals.filter(a => a.species === specie);
              if (capi.length === 0) return null;
              return (
                <div key={specie} className="space-y-4">
                  <h4 className="text-sm font-black text-emerald-800 uppercase px-3 bg-emerald-50 w-fit py-1 rounded-lg italic tracking-widest">{specie} ({capi.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {capi.map(a => (
                      <div key={a.id} className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm relative group hover:border-emerald-500 transition-all">
                        <button onClick={()=>deleteDoc(doc(db,'animals',a.id))} className="absolute top-4 right-4 text-stone-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                        <h4 className="text-lg font-black text-stone-800 tracking-tighter leading-tight uppercase">{a.name}</h4>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">{a.species} • {a.birthDate || 'NASCITA IGNOTA'}</p>
                        {a.dam && <div className="mt-4 pt-4 border-t flex justify-between items-center"><span className="text-[8px] font-black text-stone-300 uppercase">Figlio di:</span><span className="text-[9px] font-bold text-stone-600 uppercase">{a.dam}</span></div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- 3. REGISTRO PARTI --- */}
        {activeTab === 'births' && (
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm max-w-lg mx-auto animate-in zoom-in-95">
             <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 text-amber-700 mb-8 flex items-center gap-4">
               <Baby size={48} strokeWidth={1.5} />
               <p className="text-xs font-bold italic uppercase tracking-tighter leading-relaxed">Inserisci il codice della madre: i nati verranno aggiunti automaticamente all'anagrafica stalla.</p>
             </div>
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest italic">Codice ID Madre</label>
                  <input className="w-full p-4 bg-stone-50 border-none rounded-2xl font-black text-sm shadow-inner" placeholder="MAIALA_01" value={newBirth.idCode} onChange={e=>setNewBirth({...newBirth, idCode:e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest italic">Numero Nati</label>
                    <input type="number" className="w-full p-4 bg-stone-50 border-none rounded-2xl font-black text-sm shadow-inner" value={newBirth.count} onChange={e=>setNewBirth({...newBirth, count:Number(e.target.value)})} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest italic">Specie</label>
                    <select className="w-full p-4 bg-stone-50 border-none rounded-2xl font-black text-sm shadow-inner uppercase" value={newBirth.species} onChange={e=>setNewBirth({...newBirth, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest italic">Data Parto</label>
                  <input type="date" className="w-full p-4 bg-stone-50 border-none rounded-2xl font-black text-sm shadow-inner text-emerald-700 uppercase" value={newBirth.birthDate} onChange={e=>setNewBirth({...newBirth, birthDate:e.target.value})} />
                </div>
                <button onClick={handleSaveBirth} className="w-full bg-emerald-700 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform active:scale-95">Esegui Registrazione Parto</button>
             </div>
          </div>
        )}

        {/* --- 4. BILANCIO (ORDINATO PER SPECIE) --- */}
        {activeTab === 'finance' && (
          <div className="space-y-10 animate-in slide-in-from-right-4">
            <div className="bg-stone-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden text-center">
               <p className="text-[11px] font-black uppercase text-emerald-400 tracking-[0.3em] mb-4 italic">Capitale Netto Aziendale</p>
               <h3 className="text-6xl font-black italic tracking-tighter leading-none">€ {transactions.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0).toFixed(0)}</h3>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border grid grid-cols-1 md:grid-cols-4 gap-4 shadow-sm">
              <input placeholder="Causale Operazione" className="p-4 bg-stone-50 rounded-2xl font-bold col-span-2 shadow-inner border-none uppercase text-xs" value={newTrans.desc} onChange={e=>setNewTrans({...newTrans, desc:e.target.value})} />
              <div className="flex items-center bg-stone-50 rounded-2xl px-4 shadow-inner">
                <span className="text-emerald-600 font-black mr-2 italic">€</span>
                <input type="number" placeholder="0" className="w-full bg-transparent border-none font-black text-lg tracking-tighter" value={newTrans.amount || ''} onChange={e=>setNewTrans({...newTrans, amount:Number(e.target.value)})} />
              </div>
              <button onClick={handleSaveTransaction} className="bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-black transition-all">Salva</button>
            </div>

            {speciesList.map(specie => {
              const transSpecie = transactions.filter(t => t.species === specie);
              if (transSpecie.length === 0) return null;
              const bilancioSpecie = transSpecie.reduce((acc,t)=>acc+(t.type==='Entrata'?t.amount:-t.amount), 0);
              return (
                <div key={specie} className="space-y-3">
                  <div className="flex justify-between items-center px-4 py-2 bg-stone-100 rounded-2xl">
                    <h4 className="text-xs font-black text-stone-500 uppercase italic tracking-widest">{specie}</h4>
                    <span className={`text-sm font-black italic ${bilancioSpecie >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>Bilancio Parziale: €{bilancioSpecie}</span>
                  </div>
                  <div className="space-y-2">
                    {transSpecie.map(t => (
                      <div key={t.id} className="bg-white p-5 rounded-3xl border border-stone-50 flex justify-between items-center shadow-sm group">
                        <div className="flex items-center gap-4">
                           <div className={`p-3 rounded-2xl ${t.type==='Entrata' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600 shadow-inner'}`}>{t.type==='Entrata' ? <ArrowUpRight size={20}/> : <ArrowDownLeft size={20}/>}</div>
                           <div><p className="font-black text-stone-900 uppercase text-xs tracking-tighter">{t.desc}</p><p className="text-[9px] font-black text-stone-300 uppercase tracking-widest">{t.date}</p></div>
                        </div>
                        <div className="flex items-center gap-6">
                           <span className={`text-xl font-black italic tracking-tighter ${t.type==='Entrata' ? 'text-emerald-600' : 'text-red-500'}`}>{t.type==='Entrata' ? '+' : '-'}€{t.amount}</span>
                           <button onClick={()=>deleteDoc(doc(db,'transactions',t.id))} className="p-3 text-stone-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- 5. SCORTE MAGAZZINO --- */}
        {activeTab === 'products' && (
          <div className="space-y-10 animate-in fade-in">
            {sellingProduct && (
              <div className="bg-amber-50 p-8 rounded-[3rem] border-2 border-amber-300 shadow-2xl animate-in zoom-in-95 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-400 text-white px-6 py-2 rounded-bl-2xl font-black text-[9px] uppercase tracking-widest italic shadow-md">Pubblicazione Mercato</div>
                <h3 className="text-xl font-black text-amber-950 italic mb-6 uppercase tracking-tighter flex items-center gap-3"><ShoppingBag size={24}/> Vendi: {sellingProduct.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-amber-600 ml-4 uppercase tracking-widest italic">Prezzo (€)</label>
                    <input type="number" className="w-full p-4 rounded-2xl border-none shadow-md font-black text-emerald-600" placeholder="0.00" onChange={e=>setSellPrice(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-amber-600 ml-4 uppercase tracking-widest italic">Contatto WhatsApp</label>
                    <input className="w-full p-4 rounded-2xl border-none shadow-md font-black" placeholder="340 0000000" onChange={e=>setSellPhone(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={handlePublishToMarket} className="flex-1 bg-amber-500 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl">Conferma</button>
                  <button onClick={()=>setSellingProduct(null)} className="px-10 bg-white text-amber-500 font-black rounded-2xl border-2 border-amber-200 text-xs">Annulla</button>
                </div>
              </div>
            )}
            <div className="bg-white p-6 rounded-3xl border shadow-sm relative overflow-hidden">
              <h3 className="text-[10px] font-black uppercase text-stone-400 mb-6 tracking-widest flex items-center gap-2 italic"><Package className="text-emerald-500" size={16}/> Carico e Scarico Magazzino Fisico</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input placeholder="ARTICOLO (ES: FIENO)" className="p-4 bg-stone-50 rounded-2xl font-black shadow-inner border-none uppercase text-xs tracking-widest focus:ring-4 focus:ring-emerald-50 transition-all" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name:e.target.value})} />
                <div className="flex gap-2">
                  <input type="number" placeholder="QTY" className="flex-1 p-4 bg-stone-50 rounded-2xl font-black shadow-inner border-none text-xl tracking-tighter" value={newProduct.quantity || ''} onChange={e=>setNewProduct({...newProduct, quantity:Number(e.target.value)})} />
                  <select className="p-4 bg-stone-50 rounded-2xl font-black border-none shadow-inner text-[10px] uppercase tracking-widest italic" value={newProduct.unit} onChange={e=>setNewProduct({...newProduct, unit:e.target.value})}><option>kg</option><option>balle</option><option>unità</option><option>litri</option></select>
                </div>
                <button onClick={handleAddProduct} className="bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">Carica</button>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm text-center flex flex-col group hover:border-emerald-200 transition-all duration-500">
                  <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl w-fit mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-inner"><Package size={32}/></div>
                  <h4 className="font-black text-stone-800 uppercase text-[10px] mb-1 tracking-widest">{p.name}</h4>
                  <p className="text-4xl font-black text-emerald-600 italic tracking-tighter mb-6 leading-none">{p.quantity} <span className="text-[9px] uppercase not-italic opacity-30 tracking-[0.3em] block mt-1">{p.unit}</span></p>
                  <button onClick={()=>setSellingProduct(p)} className="w-full bg-amber-100 text-amber-700 font-black py-3 rounded-2xl text-[9px] uppercase tracking-widest mb-3 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2"><Store size={14}/> Vendi Km 0</button>
                  <button onClick={()=>deleteDoc(doc(db,'products',p.id))} className="text-stone-200 hover:text-red-500 transition-colors mt-auto pt-4 border-t border-stone-50"><Trash2 size={16} className="mx-auto"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 6. AGENDA (CON RICERCA E ORDINAMENTO) --- */}
        {activeTab === 'tasks' && (
          <div className="max-w-3xl space-y-10 animate-in slide-in-from-left-6 duration-500">
            <div className="bg-white p-8 rounded-[3rem] border shadow-sm relative overflow-hidden border-t-8 border-stone-900">
               <h3 className="text-[11px] font-black uppercase text-stone-400 mb-8 tracking-[0.4em] italic flex items-center gap-4 leading-none"><CalendarDays className="text-emerald-600" size={24}/> Programmazione Attività</h3>
               <div className="flex flex-col md:flex-row gap-4 mb-6">
                 <input className="flex-1 p-5 bg-stone-50 rounded-3xl font-black text-stone-800 text-sm shadow-inner border-none" placeholder="Cosa devi segnare oggi?" value={newTask} onChange={e=>setNewTask(e.target.value)} />
                 <input type="date" className="p-5 bg-stone-50 rounded-3xl font-black shadow-inner border-none text-xs uppercase tracking-widest text-emerald-700" value={newTaskDate} onChange={e=>setNewTaskDate(e.target.value)} />
                 <button onClick={handleAddTask} className="bg-emerald-950 text-white px-10 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-emerald-600 transition-all">Add</button>
               </div>
               {/* BARRA RICERCA ATTIVITÀ */}
               <div className="relative group">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
                  <input className="w-full p-4 pl-12 bg-stone-50 border-none rounded-2xl font-black text-[11px] uppercase italic tracking-[0.2em] shadow-inner focus:ring-4 focus:ring-emerald-50 transition-all placeholder:text-stone-200" placeholder="Filtra lavori (es: 'Vaccino', 'Fieno')..." value={taskSearch} onChange={e=>setTaskSearch(e.target.value)} />
               </div>
            </div>
            <div className="space-y-4">
              {tasks.filter(t => t.text.toLowerCase().includes(taskSearch.toLowerCase()))
                .sort((a,b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
                .map(t => (
                <div key={t.id} className={`bg-white p-6 rounded-[2.5rem] border-2 flex justify-between items-center transition-all duration-500 ${t.done ? 'opacity-20 grayscale scale-95' : 'shadow-xl border-white hover:border-emerald-500 group border-l-[10px] border-l-emerald-600'}`}>
                  <div>
                    <p className={`text-lg font-black tracking-tight leading-none mb-3 uppercase ${t.done ? 'line-through text-stone-400' : 'text-stone-950'}`}>{t.text}</p>
                    <div className="flex items-center gap-3">
                      <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest italic">Scadenza Impegno: <span className="text-emerald-600 font-black">{t.dueDate || 'N/D'}</span></p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={()=>updateDoc(doc(db,'tasks',t.id),{done:!t.done})} className={`p-4 rounded-2xl shadow-sm transition-all ${t.done ? 'bg-stone-200 text-stone-500' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}><CheckCircle2 size={24}/></button>
                    <button onClick={()=>deleteDoc(doc(db,'tasks',t.id))} className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-xl"><Trash2 size={24}/></button>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-center py-20 text-stone-200 font-black uppercase italic tracking-widest text-xs">Agenda lavori libera.</p>}
            </div>
          </div>
        )}

        {/* --- 7. DINASTIA TAB --- */}
        {activeTab === 'dinastia' && (
          <div className="bg-white p-8 rounded-[3rem] border shadow-sm animate-in fade-in duration-1000 relative overflow-hidden overflow-x-auto">
            <div className="flex items-center gap-4 mb-12 border-b-4 border-stone-50 pb-8">
               <div className="bg-stone-900 p-4 rounded-2xl text-white shadow-xl shadow-stone-200"><Network size={24} strokeWidth={3}/></div>
               <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-1 text-stone-900">Linee di Sangue</h3>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em] italic">Mappa gerarchica e genetica aziendale</p>
               </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {animals.filter(a => !a.dam && !a.sire).map(root => (
                <div key={root.id} className="bg-stone-50/50 p-8 rounded-[3rem] border border-stone-100 shadow-inner min-w-[280px]">
                  <DynastyBranch animal={root} allAnimals={animals} />
                </div>
              ))}
              {animals.length === 0 && <p className="text-stone-300 font-black italic uppercase tracking-widest text-center py-20 border-2 border-dashed rounded-[3rem] col-span-full">No Data Stream Detected</p>}
            </div>
          </div>
        )}

        {/* --- 8. VETERINARIO IA TAB --- */}
        {activeTab === 'vet' && (
          <div className="bg-white p-10 rounded-[4rem] border shadow-sm max-w-3xl animate-in zoom-in-95 duration-700 mx-auto relative overflow-hidden">
            <div className="bg-blue-600 p-10 rounded-[3rem] text-white mb-10 flex items-center gap-8 shadow-2xl shadow-blue-100 relative overflow-hidden group">
               <Stethoscope size={64} strokeWidth={1} className="relative z-10 group-hover:rotate-12 transition-transform duration-700" />
               <div className="relative z-10">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-3">Neural Vet Triage</h3>
                  <p className="text-blue-50 font-bold opacity-80 text-sm leading-relaxed italic max-w-lg tracking-tight">Analisi clinica preliminare basata su intelligenza artificiale veterinaria 2026.</p>
               </div>
            </div>
            <div className="space-y-4 mb-8 ml-4">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em] italic">Input Symptoms & Observation</p>
                <textarea className="w-full p-8 bg-stone-50 border-none rounded-[3rem] font-bold text-stone-800 text-lg h-56 shadow-inner italic placeholder:text-stone-200 focus:ring-8 focus:ring-blue-50 transition-all leading-snug" placeholder="Descrivi il comportamento anomalo (es: 'Inappetenza e respiro affannato vitello IT02')..." value={vetSymptom} onChange={e=>setVetSymptom(e.target.value)}></textarea>
            </div>
            <button onClick={()=>{setIsAnalyzing(true); setTimeout(()=>{setVetResult({title:"Esito Diagnostico Preliminare", desc:"I sintomi indicati suggeriscono una possibile spossatezza da calore o fase iniziale di infezione respiratoria.", action:"ISOLARE IL CAPO, MONITORARE LA TEMPERATURA E CONTATTARE IL VETERINARIO DI ZONA URGENTEMENTE"}); setIsAnalyzing(false);},3000)}} className="w-full bg-stone-950 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-6 hover:bg-blue-600 transition-all shadow-2xl">
              {isAnalyzing ? <><Activity className="animate-spin" size={24}/> Neural Processing...</> : <><Bot size={28}/> Launch Triage Diagnostic</>}
            </button>
            {vetResult && (
              <div className="mt-16 p-10 bg-emerald-50 border-4 border-emerald-100 rounded-[3.5rem] animate-in slide-in-from-bottom-12 duration-700">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="bg-emerald-500 p-2 rounded-2xl text-white shadow-xl"><AlertTriangle size={24} /></div>
                    <h4 className="text-xl font-black uppercase text-emerald-950 tracking-tighter italic">{vetResult.title}</h4>
                 </div>
                 <p className="text-emerald-800 font-bold text-lg mb-8 leading-relaxed italic tracking-tighter">"{vetResult.desc}"</p>
                 <div className="bg-emerald-600 text-white p-6 rounded-2xl text-center text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl border-b-8 border-emerald-700">{vetResult.action}</div>
              </div>
            )}
          </div>
        )}

        {/* --- 9. MERCATO KM 0 TAB --- */}
        {activeTab === 'market' && (
          <div className="space-y-16 animate-in slide-in-from-bottom-12 duration-1000">
            <div className="bg-amber-500 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
               <ShoppingBag size={300} className="absolute -bottom-16 -right-16 opacity-10 rotate-12" />
               <div className="relative z-10 max-w-2xl">
                 <div className="bg-white/20 w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-6 backdrop-blur-md border border-white/20">Mercato Locale Km 0</div>
                 <h3 className="text-5xl font-black italic tracking-tighter uppercase mb-6 leading-none">Food Directly From Source.</h3>
                 <p className="text-amber-50 font-bold text-lg leading-relaxed opacity-95 italic">Sostieni l'agricoltura locale. Filiera corta digitale, trasparente, genuina.</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {marketItems.map(item => (
                <div key={item.id} className="bg-white rounded-[3.5rem] border-2 border-stone-50 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl hover:translate-y-[-10px] transition-all duration-700">
                  <div className="h-60 bg-stone-50 flex items-center justify-center relative overflow-hidden group-hover:bg-amber-50 transition-colors duration-1000 shadow-inner">
                     <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-3xl px-5 py-2.5 rounded-[1.5rem] font-black text-2xl text-emerald-600 shadow-2xl border-2 border-emerald-50 italic tracking-tighter group-hover:scale-110 transition-transform z-20">€{item.price.toFixed(0)}</div>
                     <ShoppingBag size={80} className="text-stone-100 opacity-50 group-hover:scale-150 transition-all duration-1000 ease-in-out" />
                  </div>
                  <div className="p-10 flex flex-col flex-1 relative">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-3 italic leading-none">{item.sellerName}</p>
                    <h4 className="text-3xl font-black text-stone-950 tracking-tighter mb-8 leading-[0.85] uppercase group-hover:text-amber-600 transition-colors duration-500">{item.name}</h4>
                    <div className="flex justify-between items-center mb-10 bg-stone-50 p-6 rounded-3xl border-2 border-white shadow-inner">
                       <span className="text-[11px] font-black text-stone-400 uppercase italic tracking-widest">Disponibile</span>
                       <span className="font-black text-stone-900 text-xl uppercase tracking-tighter">{item.quantity} <span className="text-xs text-stone-300 font-bold">{item.unit}</span></span>
                    </div>
                    {item.contactPhone ? (
                       <a href={`https://wa.me/39${item.contactPhone}?text=Salve ${item.sellerName}, vorrei acquistare ${item.name} visto su AgriManage.`} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(37,211,102,0.3)] flex items-center justify-center gap-4 hover:scale-105 transition-all active:scale-95"><MessageCircle size={24}/> Ordina WhatsApp</a>
                    ) : (
                       <a href={`mailto:${item.contactEmail}`} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 flex items-center justify-center gap-4 hover:scale-105 transition-all active:scale-95"><Mail size={24}/> Invia Email Ordine</a>
                    )}
                  </div>
                </div>
              ))}
              {marketItems.length === 0 && (
                <div className="col-span-full py-40 text-center flex flex-col items-center gap-10">
                  <ShoppingBag size={100} className="text-stone-100" />
                  <p className="text-stone-200 font-black italic uppercase tracking-[0.8em] text-3xl leading-none">No Public Listings Available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
