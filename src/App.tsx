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
interface BirthRecord { id: string; animalName: string; species: Species; date: string; offspringCount: number; birthDate: string; ownerId: string; }
interface Transaction { id: string; type: 'Entrata' | 'Uscita'; amount: number; desc: string; species: Species; date: string; ownerId: string; }
interface Task { id: string; text: string; done: boolean; dateCompleted?: string; dueDate?: string; ownerId: string; }
interface Product { id: string; name: string; quantity: number; unit: string; ownerId: string; }
interface MarketItem { id: string; name: string; price: number; quantity: number; unit: string; sellerId: string; sellerName: string; contactEmail: string; contactPhone: string; createdAt: string; }

// --- COMPONENTE GENEALOGIA ---
const DynastyBranch = ({ animal, allAnimals, level = 0 }: { animal: Animal, allAnimals: Animal[], level?: number }) => {
  const children = allAnimals.filter(a => a.dam === animal.name || a.sire === animal.name || a.dam === animal.id || a.sire === animal.id);
  return (
    <div className={level > 0 ? "ml-6 border-l-2 border-emerald-200 pl-4 mt-2" : "mt-2"}>
      <div className={`p-4 rounded-2xl border shadow-sm flex flex-col bg-white ${level === 0 ? 'border-l-4 border-emerald-500 shadow-md' : 'border-stone-100'}`}>
        <span className="font-black text-stone-800 tracking-tight text-sm">{animal.name}</span>
        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">{animal.species} • GENERAZIONE {level}</span>
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

  // --- STATI DATI ---
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [births, setBirths] = useState<BirthRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);

  // --- STATI INPUT ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regRole, setRegRole] = useState<'farmer' | 'consumer'>('farmer');
  const [regName, setRegName] = useState('');
  const [newAnimal, setNewAnimal] = useState({ name: '', species: 'Maiali' as Species, birthDate: '', dam: '', sire: '', notes: '' });
  const [newBirth, setNewBirth] = useState({ idCode: '', species: 'Maiali' as Species, count: 1, birthDate: '' });
  const [newTrans, setNewTrans] = useState({ desc: '', amount: 0, type: 'Entrata' as any, species: 'Maiali' as Species });
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 0, unit: 'kg' });
  const [newTask, setNewTask] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

  // --- IA & VET & MARKET ---
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

  // --- GESTIONE ACCESSO E RUOLI ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            const d = userDoc.data();
            setUserRole(d.role);
            setUserName(d.name || 'Utente');
            setActiveTab(d.role === 'consumer' ? 'market' : 'dashboard');
          } else {
            setUserRole('farmer');
            setUserName('Azienda Agricola');
            setActiveTab('dashboard');
          }
        } catch (e) {
          setUserRole('farmer');
          setActiveTab('dashboard');
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- SINCRONIZZAZIONE REAL-TIME DATABASE ---
  useEffect(() => {
    if (!user?.uid || !userRole) return;
    const unsubs: any[] = [];
    
    // Tutti vedono il mercato
    unsubs.push(onSnapshot(collection(db, 'market_items'), s => {
      setMarketItems(s.docs.map(d => ({ id: d.id, ...d.data() } as MarketItem)));
    }));

    // Solo l'agricoltore vede i suoi dati privati
    if (userRole === 'farmer') {
      const q = (coll: string) => query(collection(db, coll), where("ownerId", "==", user.uid));
      unsubs.push(onSnapshot(q('animals'), s => setAnimals(s.docs.map(d => ({ id: d.id, ...d.data() } as Animal)))));
      unsubs.push(onSnapshot(q('births'), s => setBirths(s.docs.map(d => ({ id: d.id, ...d.data() } as BirthRecord)))));
      unsubs.push(onSnapshot(q('transactions'), s => setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)))));
      unsubs.push(onSnapshot(q('tasks'), s => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() } as Task)))));
      unsubs.push(onSnapshot(q('products'), s => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as Product)))));
    }
    return () => unsubs.forEach(u => u());
  }, [user?.uid, userRole]);

  // --- AZIONI: AUTH ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        const uc = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', uc.user.uid), {
          role: regRole,
          name: regName,
          email: email,
          createdAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      alert("Errore durante l'accesso. Riprova.");
      setLoading(false);
    }
  };

  // --- AZIONI: ANAGRAFICA ---
  const handleSaveAnimal = async () => {
    if (!newAnimal.name.trim()) return alert("Inserisci un identificativo!");
    await addDoc(collection(db, 'animals'), { ...newAnimal, ownerId: user!.uid });
    setNewAnimal({ name: '', species: 'Maiali', birthDate: '', dam: '', sire: '', notes: '' });
  };

  const handleSaveBirth = async () => {
    if (!newBirth.idCode.trim()) return alert("Specifica il codice della madre!");
    await addDoc(collection(db, 'births'), { ...newBirth, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    for (let i = 0; i < newBirth.count; i++) {
      await addDoc(collection(db, 'animals'), {
        name: `FIGLIO_${newBirth.idCode}_${Math.floor(Math.random()*1000)}`,
        species: newBirth.species,
        birthDate: newBirth.birthDate,
        dam: newBirth.idCode,
        notes: 'Nascita registrata via app',
        ownerId: user!.uid
      });
    }
    setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' });
    alert("Parto registrato e nuovi capi aggiunti all'inventario!");
  };

  // --- AZIONI: BILANCIO ---
  const handleSaveTransaction = async () => {
    if (newTrans.amount <= 0 || !newTrans.desc) return alert("Dati non validi!");
    await addDoc(collection(db, 'transactions'), { ...newTrans, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    setNewTrans({ desc: '', amount: 0, type: 'Entrata', species: 'Maiali' });
  };

  // --- AZIONI: SCORTE ---
  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.quantity <= 0) return alert("Dati magazzino mancanti!");
    const existing = products.find(p => p.name.toLowerCase() === newProduct.name.toLowerCase());
    if (existing) {
      await updateDoc(doc(db, 'products', existing.id), { quantity: existing.quantity + newProduct.quantity });
    } else {
      await addDoc(collection(db, 'products'), { ...newProduct, ownerId: user!.uid });
    }
    setNewProduct({ name: '', quantity: 0, unit: 'kg' });
  };

  const reduceProduct = async (id: string, amount: number) => {
    const p = products.find(prod => prod.id === id);
    if (p && p.quantity >= amount) await updateDoc(doc(db, 'products', id), { quantity: p.quantity - amount });
  };

  // --- AZIONI: AGENDA ---
  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await addDoc(collection(db, 'tasks'), { text: newTask, done: false, dueDate: newTaskDate, ownerId: user!.uid });
    setNewTask('');
  };

  // --- AZIONI: MERCATO ---
  const handlePublishToMarket = async () => {
    if (!sellingProduct || sellPrice <= 0) return alert("Inserisci un prezzo!");
    await addDoc(collection(db, 'market_items'), {
      name: sellingProduct.name,
      price: sellPrice,
      quantity: sellingProduct.quantity,
      unit: sellingProduct.unit,
      sellerId: user!.uid,
      sellerName: userName,
      contactEmail: user!.email,
      contactPhone: sellPhone,
      createdAt: new Date().toISOString()
    });
    setSellingProduct(null);
    alert("Prodotto ora visibile nel mercato pubblico!");
  };

  // --- AZIONI: ASSISTENTE IA ---
  const handleAICommand = async () => {
    if (!aiInput.trim()) return;
    setAiLogs(["Analisi in corso..."]);
    const frasi = aiInput.toLowerCase().split(/ e |,|\./).filter(s => s.trim());
    let logs = [];
    for (let f of frasi) {
      const numMatch = f.match(/(\d+)/);
      const num = numMatch ? Number(numMatch[1]) : null;
      
      if (f.includes('venduto') && num) {
        await addDoc(collection(db, 'transactions'), { desc: `Vendita: ${f}`, amount: num, type: 'Entrata', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        logs.push(`✅ Registrato incasso: ${num}€`);
      } else if ((f.includes('comprato') || f.includes('speso')) && num) {
        await addDoc(collection(db, 'transactions'), { desc: `Spesa: ${f}`, amount: num, type: 'Uscita', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        logs.push(`✅ Registrata spesa: ${num}€`);
      } else if (f.includes('ho') && num) {
        const prodName = f.replace(/ho|(\d+)/g, '').trim().toUpperCase();
        await addDoc(collection(db, 'products'), { name: prodName, quantity: num, unit: 'unità', ownerId: user!.uid });
        logs.push(`✅ Magazzino aggiornato: ${num} ${prodName}`);
      }
    }
    setAiLogs(logs.length > 0 ? logs : ["Non ho capito il comando. Prova con 'Venduto maiale a 100€'"]);
    setAiInput('');
  };

  // --- AZIONI: PDF ---
  const exportASLReport = () => {
    if (animals.length === 0) return alert("Nessun dato da esportare!");
    const doc = new jsPDF();
    const nomeAz = window.prompt("Nome della tua Azienda Agricola:") || "Azienda Agricola";
    doc.setFontSize(22); doc.setTextColor(5, 150, 105); doc.text(nomeAz, 14, 22);
    doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.text(`Registro Capi Generato il ${new Date().toLocaleDateString()}`, 14, 30);
    
    const rows = animals.sort((a,b) => a.species.localeCompare(b.species)).map(a => [a.name, a.species, a.birthDate || 'N/D', a.dam || '-', a.notes || '-']);
    autoTable(doc, {
      head: [['ID/CODICE', 'SPECIE', 'NASCITA', 'MADRE', 'NOTE']],
      body: rows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] }
    });
    doc.save(`Registro_ASL_${nomeAz.replace(/ /g, '_')}.pdf`);
  };

  // --- RENDER CARICAMENTO ---
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
      <Activity className="animate-spin text-emerald-600 mb-4" size={48} />
      <h2 className="font-black text-emerald-950 uppercase tracking-[0.3em] animate-pulse">AgriManage Pro 2026</h2>
    </div>
  );

  // --- RENDER AUTH ---
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-sm border border-stone-200 relative z-10">
          <div className="flex justify-center mb-8">
            <div className="bg-emerald-600 p-5 rounded-[2rem] text-white shadow-xl shadow-emerald-200">
              <TrendingUp size={40} strokeWidth={3} />
            </div>
          </div>
          <h1 className="text-4xl font-black text-center mb-2 text-emerald-950 italic tracking-tighter">AgriManage</h1>
          <p className="text-center text-stone-400 text-[10px] font-black uppercase tracking-widest mb-10">Smart Farming Ecosystem</p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-4 bg-stone-50 p-6 rounded-[2rem] border border-stone-200 mb-6">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRegRole('farmer')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black border-2 transition-all ${regRole === 'farmer' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-stone-400 border-stone-200'}`}>AZIENDA</button>
                  <button type="button" onClick={() => setRegRole('consumer')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black border-2 transition-all ${regRole === 'consumer' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-stone-400 border-stone-200'}`}>CLIENTE</button>
                </div>
                <input placeholder="Nome Azienda o Tuo Nome" className="w-full p-4 rounded-2xl bg-white border-none shadow-inner font-bold text-sm" value={regName} onChange={e => setRegName(e.target.value)} required />
              </div>
            )}
            <input type="email" placeholder="Email" className="w-full p-4 rounded-2xl bg-stone-50 border-none shadow-inner font-bold text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="w-full p-4 rounded-2xl bg-stone-50 border-none shadow-inner font-bold text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-950 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95">
              {isRegistering ? "Crea Account" : "Accedi Ora"}
            </button>
          </form>
          <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-[10px] font-black text-stone-400 uppercase tracking-widest mt-8 underline decoration-2 underline-offset-4">
            {isRegistering ? "Hai già un account? Accedi" : "Nuovo utente? Registrati"}
          </button>
        </div>
      </div>
    );
  }

  // --- CONFIGURAZIONE MENU ---
  const menuItems = userRole === 'farmer' ? [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'inventory', label: 'Capi', icon: PawPrint },
    { id: 'births', label: 'Parti', icon: Baby },
    { id: 'finance', label: 'Bilancio', icon: Wallet },
    { id: 'products', label: 'Scorte', icon: Package },
    { id: 'tasks', label: 'Agenda', icon: ListChecks },
    { id: 'dinastia', label: 'Dinastia', icon: Network },
    { id: 'vet', label: 'Vet IA', icon: Stethoscope },
    { id: 'market', label: 'Il Mio Mercato', icon: Store, color: 'text-amber-500' }
  ] : [
    { id: 'market', label: 'Acquista Local', icon: ShoppingBag }
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col md:flex-row relative text-stone-900 font-sans">
      
      {/* BOTTONE IA FLUTTUANTE */}
      {userRole === 'farmer' && (
        <button onClick={() => setShowAssistant(!showAssistant)} className="fixed bottom-28 right-6 md:bottom-10 md:right-10 bg-blue-600 text-white p-5 rounded-full shadow-2xl z-50 hover:scale-110 transition-transform animate-bounce border-4 border-white">
          <Bot size={32} />
        </button>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r p-8 fixed h-full shadow-sm z-40">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-emerald-100 shadow-xl"><TrendingUp size={24} strokeWidth={3} /></div>
          <h1 className="text-2xl font-black italic tracking-tighter text-emerald-950 uppercase">AgriPro</h1>
        </div>
        <nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-4 w-full p-4 rounded-2xl font-black text-xs uppercase tracking-tight transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100' : 'text-stone-400 hover:bg-stone-50'}`}>
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-8 pt-8 border-t">
          <div className="flex items-center gap-3 mb-6 p-4 bg-stone-50 rounded-2xl">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-black">{userName.charAt(0)}</div>
            <div className="truncate"><p className="text-[10px] font-black text-stone-400 uppercase">Profilo</p><p className="font-bold text-xs truncate">{userName}</p></div>
          </div>
          <button onClick={() => signOut(auth)} className="text-red-500 font-black flex items-center gap-3 w-full p-2 text-xs uppercase hover:translate-x-1 transition-transform"><LogOut size={18}/> Esci</button>
        </div>
      </aside>

      {/* MOBILE NAV BOTTOM */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t flex justify-around p-4 z-50 shadow-2xl">
        {menuItems.slice(0, 5).map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 ${activeTab === item.id ? 'text-emerald-600' : 'text-stone-300'}`}>
            <item.icon size={24} />
            <span className="text-[8px] font-black uppercase">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-72 p-6 md:p-12 pb-32">
        <header className="flex justify-between items-center mb-12">
          <h2 className="text-5xl font-black text-stone-900 italic tracking-tighter uppercase">{activeTab}</h2>
        </header>

        {/* --- ASSISTENTE VOCALE MODALE --- */}
        {showAssistant && (
          <div className="mb-12 bg-white p-8 rounded-[3rem] border-2 border-blue-100 shadow-2xl animate-in slide-in-from-top-6 duration-500">
            <div className="flex items-center gap-3 mb-6 text-blue-900">
              <Bot size={24} />
              <h3 className="font-black text-xs uppercase tracking-widest">Digital Assistant IA</h3>
            </div>
            <div className="flex gap-4">
              <input className="flex-1 p-6 bg-blue-50 border-none rounded-[2rem] font-bold text-blue-900 text-lg placeholder:text-blue-200 shadow-inner" placeholder="Dettami: 'Venduto 1 maiale a 150€ e speso 40€ mangime'..." value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleAICommand()} />
              <button onClick={handleAICommand} className="bg-blue-600 text-white px-10 rounded-[2rem] font-black shadow-xl hover:bg-blue-700 transition-all">INVIO</button>
            </div>
            {aiLogs.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-3">
                {aiLogs.map((l, i) => <span key={i} className="bg-emerald-100 text-emerald-800 px-5 py-2.5 rounded-2xl text-xs font-black animate-in zoom-in border border-emerald-200">{l}</span>)}
              </div>
            )}
          </div>
        )}

        {/* --- 1. DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && userRole === 'farmer' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-700">
            <div onClick={()=>setActiveTab('inventory')} className="bg-emerald-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all">
              <PawPrint size={180} className="absolute -bottom-16 -right-16 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700" />
              <p className="text-[11px] font-black uppercase opacity-60 tracking-[0.3em] mb-4">Anagrafica Stalla</p>
              <h4 className="text-8xl font-black italic tracking-tighter leading-none">{animals.length}</h4>
              <p className="mt-2 font-bold text-emerald-100 uppercase text-xs">Capi Attivi</p>
              <button className="mt-10 bg-white/20 px-6 py-3 rounded-full text-[10px] font-black uppercase flex items-center gap-3 backdrop-blur-md">Gestione Inventario <ArrowUpRight size={16}/></button>
            </div>
            
            <div onClick={()=>setActiveTab('finance')} className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-xl relative group overflow-hidden cursor-pointer hover:border-emerald-500 transition-all">
               <p className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em] mb-4">Cash Flow Netto</p>
               <h4 className="text-6xl font-black text-stone-900 italic tracking-tighter leading-none">€{transactions.reduce((acc,t)=>acc+(t.type==='Entrata'?t.amount:-t.amount),0).toFixed(0)}</h4>
               <div className="flex gap-6 mt-10">
                 <div className="bg-emerald-50 px-6 py-3 rounded-2xl text-emerald-600 font-black text-[11px] uppercase border border-emerald-100 shadow-sm">+€{transactions.filter(t=>t.type==='Entrata').reduce((acc,t)=>acc+t.amount,0)}</div>
                 <div className="bg-red-50 px-6 py-3 rounded-2xl text-red-600 font-black text-[11px] uppercase border border-red-100 shadow-sm">-€{transactions.filter(t=>t.type==='Uscita').reduce((acc,t)=>acc+t.amount,0)}</div>
               </div>
            </div>

            <div onClick={()=>setActiveTab('tasks')} className="bg-stone-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden cursor-pointer group">
               <ListChecks size={120} className="absolute -bottom-6 -right-6 opacity-5 group-hover:rotate-12 transition-transform duration-700" />
               <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4">Prossimi Task</p>
               <h4 className="text-6xl font-black italic tracking-tighter leading-none">{tasks.filter(t=>!t.done).length}</h4>
               <p className="text-stone-500 text-[10px] font-black uppercase mt-4 italic tracking-widest">Attività pianificate oggi</p>
               <button className="mt-8 bg-emerald-600 px-6 py-3 rounded-full text-[10px] font-black uppercase">Apri Agenda</button>
            </div>
          </div>
        )}

        {/* --- 2. INVENTARIO TAB --- */}
        {activeTab === 'inventory' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-6">
            <div className="bg-white p-10 rounded-[3rem] border shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xs font-black uppercase text-stone-400 tracking-[0.2em] italic">Nuova Registrazione Capo</h3>
                <button onClick={exportASLReport} className="text-[11px] font-black bg-stone-950 text-white px-6 py-3 rounded-2xl flex items-center gap-3 hover:bg-emerald-600 transition-all uppercase shadow-xl shadow-stone-200"><FileDown size={18}/> Esporta Registro PDF</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <input placeholder="Codice / Tag" className="p-5 bg-stone-50 border-none rounded-3xl font-black text-sm shadow-inner focus:ring-2 focus:ring-emerald-100" value={newAnimal.name} onChange={e=>setNewAnimal({...newAnimal, name:e.target.value})} />
                <select className="p-5 bg-stone-50 border-none rounded-3xl font-black text-sm shadow-inner" value={newAnimal.species} onChange={e=>setNewAnimal({...newAnimal, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                <input type="date" className="p-5 bg-stone-50 border-none rounded-3xl font-black text-sm shadow-inner" value={newAnimal.birthDate} onChange={e=>setNewAnimal({...newAnimal, birthDate:e.target.value})} />
                <input placeholder="ID Madre" className="p-5 bg-stone-50 border-none rounded-3xl font-black text-sm shadow-inner" value={newAnimal.dam} onChange={e=>setNewAnimal({...newAnimal, dam:e.target.value})} />
                <button onClick={handleSaveAnimal} className="bg-emerald-600 text-white font-black rounded-3xl p-5 uppercase text-[11px] tracking-widest shadow-2xl shadow-emerald-100 hover:scale-105 transition-all">Salva Capo</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {animals.map(a => (
                <div key={a.id} className="bg-white p-8 rounded-[2.5rem] border shadow-sm relative group hover:border-emerald-500 transition-all hover:shadow-2xl">
                  <button onClick={()=>deleteDoc(doc(db,'animals',a.id))} className="absolute top-6 right-6 text-stone-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
                  <div className="bg-emerald-50 text-emerald-600 p-4 rounded-[1.5rem] w-fit mb-6 shadow-inner"><PawPrint size={24}/></div>
                  <h4 className="text-2xl font-black text-stone-900 tracking-tighter leading-none mb-2">{a.name}</h4>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{a.species} • {a.birthDate || 'DATA MANCANTE'}</p>
                  <div className="mt-6 pt-6 border-t border-stone-50 flex flex-col gap-2">
                    {a.dam && <div className="flex justify-between items-center bg-stone-50 p-2 rounded-xl"><span className="text-[8px] font-black text-stone-400 uppercase">Madre:</span><span className="text-[10px] font-bold">{a.dam}</span></div>}
                    {a.notes && <p className="text-[10px] text-stone-500 italic mt-2">"{a.notes}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 3. REGISTRO PARTI TAB --- */}
        {activeTab === 'births' && (
          <div className="bg-white p-12 rounded-[4rem] border shadow-sm max-w-2xl animate-in zoom-in-95 duration-500">
             <div className="bg-amber-50 p-10 rounded-[3rem] border-2 border-amber-100 text-amber-700 mb-10 flex items-center gap-8 shadow-xl shadow-amber-50">
               <Baby size={64} strokeWidth={1} className="animate-pulse" />
               <div>
                  <h3 className="text-xl font-black uppercase tracking-widest italic leading-none">Automazione Nascite</h3>
                  <p className="text-xs font-bold mt-2 leading-relaxed opacity-80 uppercase">Registra il parto: i nuovi capi appariranno in anagrafica collegati alla genealogia della madre.</p>
               </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest">Codice Identificativo Madre</label>
                  <input className="w-full p-6 bg-stone-50 border-none rounded-[2rem] font-black text-lg shadow-inner focus:ring-2 focus:ring-amber-200" placeholder="Es: MAIALA_01" value={newBirth.idCode} onChange={e=>setNewBirth({...newBirth, idCode:e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest">Numero di Nati</label>
                  <input type="number" className="w-full p-6 bg-stone-50 border-none rounded-[2rem] font-black text-lg shadow-inner" value={newBirth.count} onChange={e=>setNewBirth({...newBirth, count:Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest">Data del Parto</label>
                  <input type="date" className="w-full p-6 bg-stone-50 border-none rounded-[2rem] font-black text-sm shadow-inner" value={newBirth.birthDate} onChange={e=>setNewBirth({...newBirth, birthDate:e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest">Specie dei Nati</label>
                  <select className="w-full p-6 bg-stone-50 border-none rounded-[2rem] font-black text-sm shadow-inner" value={newBirth.species} onChange={e=>setNewBirth({...newBirth, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                </div>
             </div>
             <button onClick={handleSaveBirth} className="w-full bg-emerald-700 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] shadow-2xl shadow-emerald-200 hover:scale-[1.02] transition-all active:scale-95">Conferma Registrazione</button>
          </div>
        )}

        {/* --- 4. DINASTIA TAB --- */}
        {activeTab === 'dinastia' && (
          <div className="bg-white p-12 rounded-[4rem] border shadow-sm animate-in fade-in duration-1000">
            <div className="flex items-center gap-4 mb-12 border-b pb-8">
               <Network className="text-emerald-500" size={32} strokeWidth={3}/>
               <h3 className="text-3xl font-black italic uppercase tracking-tighter">Mappa Genealogica</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {animals.filter(a => !a.dam && !a.sire).map(root => (
                <div key={root.id} className="bg-stone-50/50 p-10 rounded-[3rem] border border-stone-100 shadow-inner overflow-x-auto min-h-[300px]">
                  <DynastyBranch animal={root} allAnimals={animals} />
                </div>
              ))}
              {animals.length === 0 && <p className="text-stone-300 font-black italic uppercase tracking-widest text-center py-20 border-2 border-dashed rounded-[3rem]">Nessun dato disponibile per generare l'albero.</p>}
            </div>
          </div>
        )}

        {/* --- 5. BILANCIO TAB --- */}
        {activeTab === 'finance' && (
          <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
            <div className="bg-stone-950 p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center">
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
               <div className="relative z-10 text-center md:text-left mb-8 md:mb-0">
                  <p className="text-[11px] font-black uppercase text-emerald-400 tracking-[0.4em] mb-6">Totale Disponibilità</p>
                  <h3 className="text-8xl font-black italic tracking-tighter leading-none">€ {transactions.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0).toFixed(0)}</h3>
               </div>
               <div className="relative z-10 flex gap-8">
                  <div className="text-center bg-white/5 p-6 rounded-3xl backdrop-blur-sm border border-white/10"><p className="text-[10px] font-black text-emerald-400 uppercase mb-2">Entrate</p><p className="text-3xl font-black">+€{transactions.filter(t=>t.type==='Entrata').reduce((acc,t)=>acc+t.amount,0)}</p></div>
                  <div className="text-center bg-white/5 p-6 rounded-3xl backdrop-blur-sm border border-white/10"><p className="text-[10px] font-black text-red-400 uppercase mb-2">Uscite</p><p className="text-3xl font-black">-€{transactions.filter(t=>t.type==='Uscita').reduce((acc,t)=>acc+t.amount,0)}</p></div>
               </div>
            </div>
            <div className="bg-white p-10 rounded-[3rem] border-2 border-emerald-50 grid grid-cols-1 md:grid-cols-4 gap-6 shadow-sm">
              <input placeholder="Causale Movimento" className="p-6 bg-stone-50 border-none rounded-3xl font-black text-lg col-span-2 shadow-inner" value={newTrans.desc} onChange={e=>setNewTrans({...newTrans, desc:e.target.value})} />
              <div className="flex items-center bg-stone-50 rounded-3xl px-6 shadow-inner">
                <span className="text-emerald-600 font-black mr-2">€</span>
                <input type="number" placeholder="0.00" className="w-full bg-transparent border-none font-black text-xl" value={newTrans.amount || ''} onChange={e=>setNewTrans({...newTrans, amount:Number(e.target.value)})} />
              </div>
              <button onClick={handleSaveTransaction} className="bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all">Registra Movimento</button>
            </div>
            <div className="space-y-4">
              {transactions.sort((a,b)=>b.date.localeCompare(a.date)).map(t => (
                <div key={t.id} className="bg-white p-8 rounded-[2.5rem] border shadow-sm flex justify-between items-center group hover:translate-x-2 transition-transform">
                  <div className="flex items-center gap-6">
                    <div className={`p-5 rounded-3xl ${t.type === 'Entrata' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600 shadow-inner'}`}>{t.type === 'Entrata' ? <ArrowUpRight size={28}/> : <ArrowDownLeft size={28}/>}</div>
                    <div><p className="font-black text-stone-800 uppercase text-lg tracking-tighter">{t.desc}</p><p className="text-[10px] font-black text-stone-400 uppercase mt-1 tracking-widest">{t.date}</p></div>
                  </div>
                  <div className="flex items-center gap-8">
                    <span className={`text-4xl font-black italic tracking-tighter ${t.type==='Entrata' ? 'text-emerald-600' : 'text-red-500'}`}>{t.type==='Entrata' ? '+' : '-'}€{t.amount}</span>
                    <button onClick={()=>deleteDoc(doc(db,'transactions',t.id))} className="p-3 text-stone-100 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={24}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 6. SCORTE TAB --- */}
        {activeTab === 'products' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {sellingProduct && (
              <div className="bg-amber-50 p-12 rounded-[4rem] border-4 border-amber-400 shadow-2xl animate-in zoom-in-95 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-400 text-white px-8 py-3 rounded-bl-[2rem] font-black text-xs uppercase tracking-widest shadow-md">Market Listing</div>
                <h3 className="text-3xl font-black text-amber-950 italic mb-8 uppercase tracking-tighter flex items-center gap-3"><ShoppingBag size={32}/> Metti in Vetrina: {sellingProduct.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-amber-600 ml-6 uppercase tracking-[0.2em]">Prezzo Unitario (€)</label>
                    <input type="number" className="w-full p-6 rounded-[2rem] border-none shadow-xl font-black text-2xl text-emerald-600" placeholder="0.00" onChange={e=>setSellPrice(Number(e.target.value))} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-amber-600 ml-6 uppercase tracking-[0.2em]">Cellulare per WhatsApp</label>
                    <input className="w-full p-6 rounded-[2rem] border-none shadow-xl font-black text-2xl" placeholder="340 0000000" onChange={e=>setSellPhone(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-6">
                  <button onClick={handlePublishToMarket} className="flex-1 bg-amber-500 text-white font-black py-6 rounded-[2rem] uppercase tracking-[0.3em] shadow-2xl hover:bg-amber-600 transition-all active:scale-95">Pubblica Ora</button>
                  <button onClick={()=>setSellingProduct(null)} className="px-12 bg-white text-amber-500 font-black rounded-[2rem] border-4 border-amber-100 uppercase text-xs tracking-widest">Annulla</button>
                </div>
              </div>
            )}
            <div className="bg-white p-10 rounded-[3rem] border shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600"></div>
              <h3 className="text-[11px] font-black uppercase text-stone-400 mb-10 tracking-[0.4em] flex items-center gap-3 italic"><Package className="text-emerald-500" size={20}/> Carico e Scarico Magazzino</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input placeholder="NOME PRODOTTO" className="p-6 bg-stone-50 rounded-[2rem] font-black shadow-inner border-none uppercase text-sm tracking-widest" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name:e.target.value})} />
                <div className="flex gap-4">
                  <input type="number" placeholder="QUANTITÀ" className="flex-1 p-6 bg-stone-50 rounded-[2rem] font-black shadow-inner border-none" value={newProduct.quantity || ''} onChange={e=>setNewProduct({...newProduct, quantity:Number(e.target.value)})} />
                  <select className="p-6 bg-stone-50 rounded-[2rem] font-black border-none shadow-inner text-xs uppercase" value={newProduct.unit} onChange={e=>setNewProduct({...newProduct, unit:e.target.value})}><option>kg</option><option>balle</option><option>unità</option><option>litri</option></select>
                </div>
                <button onClick={handleAddProduct} className="bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">Aggiungi</button>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map(p => (
                <div key={p.id} className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm text-center flex flex-col group hover:border-emerald-200 hover:shadow-2xl transition-all duration-500">
                  <div className="bg-emerald-50 text-emerald-600 p-6 rounded-[2.5rem] w-fit mx-auto mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-inner"><Package size={40}/></div>
                  <h4 className="font-black text-stone-800 uppercase text-xs mb-2 tracking-widest">{p.name}</h4>
                  <p className="text-5xl font-black text-emerald-600 italic tracking-tighter mb-8 leading-none">{p.quantity} <span className="text-[10px] uppercase not-italic opacity-30 tracking-[0.3em] block mt-2">{p.unit}</span></p>
                  <button onClick={()=>setSellingProduct(p)} className="w-full bg-amber-100 text-amber-700 font-black py-4 rounded-3xl text-[10px] uppercase tracking-[0.2em] mb-4 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2"><Store size={16}/> Vendi nel Mercato</button>
                  <button onClick={()=>deleteDoc(doc(db,'products',p.id))} className="text-stone-200 hover:text-red-500 transition-colors mt-auto pt-6 border-t border-stone-50"><Trash2 size={20} className="mx-auto"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 7. MERCATO KM 0 TAB --- */}
        {activeTab === 'market' && (
          <div className="space-y-16 animate-in slide-in-from-bottom-12 duration-1000">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-16 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden">
               <ShoppingBag size={350} className="absolute -bottom-24 -right-24 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
               <div className="relative z-10 max-w-2xl">
                 <div className="bg-white/20 w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-6 backdrop-blur-md border border-white/20">Marketplace Locale</div>
                 <h3 className="text-7xl font-black italic tracking-tighter uppercase mb-6 leading-[0.85]">Eccellenze dal Campo</h3>
                 <p className="text-amber-50 font-bold text-xl leading-relaxed opacity-90 italic">La freschezza non aspetta. Acquista prodotti genuini direttamente da chi lavora la terra.</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {marketItems.map(item => (
                <div key={item.id} className="bg-white rounded-[4rem] border border-stone-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl hover:translate-y-[-10px] transition-all duration-500">
                  <div className="h-64 bg-stone-50 flex items-center justify-center relative overflow-hidden shadow-inner">
                     <div className="absolute top-8 right-8 bg-white/95 backdrop-blur px-6 py-3 rounded-[2rem] font-black text-3xl text-emerald-600 shadow-2xl border border-emerald-50 italic tracking-tighter">€{item.price.toFixed(0)}</div>
                     <ShoppingBag size={100} className="text-stone-100 group-hover:scale-150 transition-transform duration-1000" />
                  </div>
                  <div className="p-12 flex flex-col flex-1">
                    <p className="text-[11px] font-black text-amber-500 uppercase tracking-[0.3em] mb-4 italic">{item.sellerName}</p>
                    <h4 className="text-4xl font-black text-stone-900 tracking-tighter mb-8 leading-none uppercase">{item.name}</h4>
                    <div className="flex justify-between items-center mb-12 bg-stone-50 p-8 rounded-[2.5rem] border-2 border-white shadow-inner">
                       <span className="text-[12px] font-black text-stone-400 uppercase italic tracking-widest">In Stock</span>
                       <span className="font-black text-stone-800 text-2xl uppercase tracking-tighter">{item.quantity} {item.unit}</span>
                    </div>
                    {item.contactPhone ? (
                       <a href={`https://wa.me/39${item.contactPhone}?text=Salve ${item.sellerName}, vorrei ordinare ${item.name} visto su AgriManage.`} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-[#25D366]/30 flex items-center justify-center gap-4 hover:scale-105 transition-all active:scale-95"><MessageCircle size={24}/> Ordina WhatsApp</a>
                    ) : (
                       <a href={`mailto:${item.contactEmail}`} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 flex items-center justify-center gap-4 hover:scale-105 transition-all active:scale-95"><Mail size={24}/> Invia Richiesta</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 8. VETERINARIO IA TAB --- */}
        {activeTab === 'vet' && (
          <div className="bg-white p-16 rounded-[5rem] border shadow-sm max-w-4xl animate-in zoom-in-95 duration-700">
            <div className="bg-blue-600 p-12 rounded-[3.5rem] text-white mb-12 flex items-center gap-10 shadow-2xl shadow-blue-200 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
               <Stethoscope size={80} strokeWidth={1} className="relative z-10" />
               <div className="relative z-10">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-4">Triage Veterinario IA</h3>
                  <p className="text-blue-50 font-bold opacity-80 text-lg leading-relaxed italic max-w-lg">Analisi clinica preliminare basata su modelli di intelligenza artificiale veterinaria.</p>
               </div>
            </div>
            <textarea className="w-full p-10 bg-stone-50 border-none rounded-[3.5rem] font-bold text-stone-800 text-xl h-64 mb-10 shadow-inner italic placeholder:text-stone-300 focus:ring-4 focus:ring-blue-100" placeholder="Descrivi qui i sintomi dell'animale... (es: 'Il vitello 04 non mangia, ha febbre e naso asciutto')" value={vetSymptom} onChange={e=>setVetSymptom(e.target.value)}></textarea>
            <button onClick={()=>{setIsAnalyzing(true); setTimeout(()=>{setVetResult({title:"Esito Triage Intelligente", desc:"I sintomi indicano una probabile spossatezza o infezione respiratoria iniziale.", action:"ISOLARE IL CAPO, MONITORARE TEMPERATURA E CHIAMARE VETERINARIO URGENTEMENTE"}); setIsAnalyzing(false);},3000)}} className="w-full bg-stone-950 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-sm flex items-center justify-center gap-6 hover:bg-blue-600 transition-all shadow-2xl">
              {isAnalyzing ? <><Activity className="animate-spin"/> Elaborazione Dati Clinici...</> : <><Bot size={28}/> Avvia Analisi Diagnostica</>}
            </button>
            {vetResult && (
              <div className="mt-16 p-12 bg-emerald-50 border-4 border-emerald-100 rounded-[4rem] animate-in slide-in-from-bottom-12 duration-700">
                 <div className="flex items-center gap-4 mb-6">
                    <AlertTriangle className="text-emerald-600" size={32} />
                    <h4 className="text-emerald-950 font-black uppercase text-xl tracking-tighter italic">{vetResult.title}</h4>
                 </div>
                 <p className="text-emerald-800 font-bold text-xl mb-10 leading-relaxed italic">"{vetResult.desc}"</p>
                 <div className="bg-emerald-600 text-white p-8 rounded-[2rem] text-center text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-200 border-4 border-white/20">{vetResult.action}</div>
              </div>
            )}
          </div>
        )}

        {/* --- 9. AGENDA TAB --- */}
        {activeTab === 'tasks' && (
          <div className="max-w-4xl space-y-12 animate-in slide-in-from-left-8 duration-500">
            <div className="bg-white p-12 rounded-[4rem] border shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-full bg-emerald-500/5"></div>
               <h3 className="text-[12px] font-black uppercase text-stone-400 mb-10 tracking-[0.5em] italic flex items-center gap-4"><CalendarDays className="text-emerald-600" size={24}/> Pianificazione Attività Giornaliera</h3>
               <div className="flex flex-col md:flex-row gap-6">
                 <input className="flex-1 p-6 bg-stone-50 rounded-[2.5rem] font-black text-stone-800 text-lg shadow-inner border-none focus:ring-4 focus:ring-emerald-50" placeholder="Cosa devi segnare?" value={newTask} onChange={e=>setNewTask(e.target.value)} />
                 <input type="date" className="p-6 bg-stone-50 rounded-[2.5rem] font-black shadow-inner border-none text-sm uppercase tracking-widest text-emerald-700" value={newTaskDate} onChange={e=>setNewTaskDate(e.target.value)} />
                 <button onClick={handleAddTask} className="bg-emerald-950 text-white px-12 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-emerald-600 transition-all">Aggiungi</button>
               </div>
            </div>
            <div className="space-y-6">
              {tasks.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).map(t => (
                <div key={t.id} className={`bg-white p-10 rounded-[3.5rem] border-2 flex justify-between items-center transition-all duration-500 ${t.done ? 'opacity-20 grayscale scale-95' : 'shadow-xl border-white hover:border-emerald-500 group border-l-[16px] border-l-emerald-600'}`}>
                  <div>
                    <p className={`text-2xl font-black tracking-tighter leading-none mb-3 ${t.done ? 'line-through' : 'text-stone-900'}`}>{t.text}</p>
                    <div className="flex items-center gap-3">
                      <div className="bg-stone-100 px-4 py-1.5 rounded-full flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Scadenza: {t.dueDate}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={()=>updateDoc(doc(db,'tasks',t.id),{done:!t.done})} className={`p-6 rounded-[2rem] shadow-2xl transition-all ${t.done ? 'bg-stone-200 text-stone-500' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}><CheckCircle2 size={32}/></button>
                    <button onClick={()=>deleteDoc(doc(db,'tasks',t.id))} className="p-6 bg-red-50 text-red-400 rounded-[2rem] hover:bg-red-600 hover:text-white transition-all shadow-xl"><Trash2 size={32}/></button>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && <div className="text-center py-32 border-4 border-dashed rounded-[5rem] border-stone-100"><p className="text-stone-200 font-black uppercase italic tracking-[0.5em] text-2xl">Agenda Vuota</p></div>}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
