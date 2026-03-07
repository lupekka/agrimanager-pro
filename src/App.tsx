import React, { useState, useEffect } from 'react';
import {
  PawPrint, CalendarDays, TrendingUp, Network, Baby, Trash2,
  PlusCircle, LogOut, Lock, Menu, X, Search, LayoutDashboard,
  History, Package, Edit2, CheckCircle2,
  MinusCircle, Activity, ListChecks, Wallet,
  ArrowUpRight, ArrowDownLeft, Ghost, UserPlus, Stethoscope, 
  UploadCloud, AlertTriangle, FileDown, Store, ShoppingBag, 
  MessageCircle, Mail, Bot, Info, Send, Save, ArrowRightLeft, Plus, ChevronDown, ChevronRight,
  Camera
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, where, getDocs, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setDoc, getDoc, orderBy, limit } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";

// TensorFlow per AI locale (gratuita)
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

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

// --- INTERFACCE ---
type Species = 'Maiali' | 'Cavalli' | 'Mucche' | 'Galline' | 'Oche';
interface Animal { id: string; name: string; species: Species; notes: string; sire?: string; dam?: string; birthDate?: string; ownerId: string; }
interface Transaction { id: string; type: 'Entrata' | 'Uscita'; amount: number; desc: string; species: Species; date: string; ownerId: string; }
interface Task { id: string; text: string; done: boolean; dueDate?: string; ownerId: string; }
interface Product { id: string; name: string; quantity: number; unit: string; ownerId: string; }
interface StockLog { id: string; productName: string; change: number; date: string; ownerId: string; }
interface MarketItem { id: string; name: string; price: number; quantity: number; unit: string; sellerId: string; sellerName: string; contactEmail: string; contactPhone: string; createdAt: string; }

const DynastyBranch = ({ animal, allAnimals, level = 0 }: { animal: Animal, allAnimals: Animal[], level?: number }) => {
  const children = allAnimals.filter(a => a.dam === animal.name || a.sire === animal.name || a.dam === animal.id || a.sire === animal.id);
  return (
    <div className={level > 0 ? "ml-4 border-l-2 border-stone-300 pl-4 mt-2" : ""}>
      <div className={`p-3 rounded-xl border bg-white mb-2 shadow-sm ${level === 0 ? 'border-l-4 border-l-emerald-600' : ''}`}>
        <p className="font-bold text-stone-900 text-xs uppercase">{animal.name}</p>
        <p className="text-[10px] text-stone-600 font-bold uppercase">{animal.species} • GEN {level}</p>
        {animal.sire && <p className="text-[8px] text-stone-500 mt-1">Padre: {animal.sire}</p>}
        {animal.dam && <p className="text-[8px] text-stone-500">Madre: {animal.dam}</p>}
      </div>
      {children.map(child => <DynastyBranch key={child.id} animal={child} allAnimals={allAnimals} level={level + 1} />)}
    </div>
  );
};

export default function App() {
  // STATO ASSISTENTE
  const [showAssistant, setShowAssistant] = useState(false);
  
  // STATO MODELLO TENSORFLOW
  const [model, setModel] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'farmer' | 'consumer' | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRegistering, setIsRegistering] = useState(false);

  // STATO PER LE SPECIE ESPANSE
  const [expandedSpecies, setExpandedSpecies] = useState<Species[]>([]);

  // DATI
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);

  // INPUTS
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regRole, setRegRole] = useState<'farmer' | 'consumer'>('farmer');
  const [regName, setRegName] = useState('');
  
  const [newAnimal, setNewAnimal] = useState({ 
    name: '', 
    species: 'Maiali' as Species, 
    birthDate: '', 
    sire: '',
    dam: '', 
    notes: '' 
  });
  const [editingAnimalId, setEditingAnimalId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');

  const [newBirth, setNewBirth] = useState({ idCode: '', species: 'Maiali' as Species, count: 1, birthDate: '' });
  const [newTrans, setNewTrans] = useState({ desc: '', amount: 0, type: 'Entrata' as 'Entrata'|'Uscita', species: 'Maiali' as Species });
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 0, unit: 'kg' });
  
  const [newTask, setNewTask] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

  const [aiInput, setAiInput] = useState('');
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [vetSymptom, setVetSymptom] = useState('');
  const [vetImage, setVetImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [vetResult, setVetResult] = useState<any>(null);
  
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
  const [sellPrice, setSellPrice] = useState(0);
  const [sellPhone, setSellPhone] = useState('');

  const speciesList: Species[] = ['Maiali', 'Cavalli', 'Mucche', 'Galline', 'Oche'];

  // FUNZIONE PER TOGGLE ESPANSIONE SPECIE
  const toggleSpecies = (species: Species) => {
    setExpandedSpecies(prev => 
      prev.includes(species) 
        ? prev.filter(s => s !== species) 
        : [...prev, species]
    );
  };

  // ACCESSO
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role);
            setUserName(data.name || 'Utente');
            setActiveTab(data.role === 'consumer' ? 'market' : 'dashboard');
          } else { setUserRole('farmer'); setUserName('Azienda Agricola'); }
        } catch (e) { setUserRole('farmer'); setUserName('Azienda Agricola'); }
      } else { setUser(null); setUserRole(null); }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // SYNC DATI
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
      unsubs.push(onSnapshot(query(collection(db, 'stock_logs'), where("ownerId", "==", user.uid), orderBy('date', 'desc'), limit(15)), s => setStockLogs(s.docs.map(d => ({ id: d.id, ...d.data() } as StockLog)))));
    }
    return () => unsubs.forEach(u => u());
  }, [user?.uid, userRole]);

  // Caricamento modello TensorFlow per il Vet IA
  useEffect(() => {
    const loadModel = async () => {
      if (activeTab === 'vet' && !model && !modelLoading) {
        setModelLoading(true);
        try {
          console.log("Caricamento modello AI in corso...");
          const loadedModel = await cocoSsd.load();
          setModel(loadedModel);
          console.log("✅ Modello AI caricato con successo!");
        } catch (error) {
          console.error("❌ Errore caricamento modello:", error);
        } finally {
          setModelLoading(false);
        }
      }
    };
    
    loadModel();
  }, [activeTab, model, modelLoading]);

  // FUNZIONI
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        const uc = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', uc.user.uid), { role: regRole, name: regName, email });
      } else { await signInWithEmailAndPassword(auth, email, password); }
    } catch (e) { alert("Credenziali errate."); setLoading(false); }
  };

  const handleSaveAnimal = async () => {
    if (!newAnimal.name.trim()) return alert("Codice Capo richiesto.");
    
    if (newAnimal.sire) {
      const sireExists = animals.some(a => a.name === newAnimal.sire || a.id === newAnimal.sire);
      if (!sireExists) {
        if (!confirm(`Il padre "${newAnimal.sire}" non esiste nell'anagrafica. Continuare comunque?`)) {
          return;
        }
      }
    }
    
    if (newAnimal.dam) {
      const damExists = animals.some(a => a.name === newAnimal.dam || a.id === newAnimal.dam);
      if (!damExists) {
        if (!confirm(`La madre "${newAnimal.dam}" non esiste nell'anagrafica. Continuare comunque?`)) {
          return;
        }
      }
    }
    
    await addDoc(collection(db, 'animals'), { 
      ...newAnimal, 
      ownerId: user!.uid 
    });
    
    setNewAnimal({ 
      name: '', 
      species: 'Maiali', 
      birthDate: '', 
      sire: '',
      dam: '', 
      notes: '' 
    });
  };

  const handleUpdateNotes = async (id: string) => {
    await updateDoc(doc(db, 'animals', id), { notes: editNote });
    setEditingAnimalId(null);
  };

  const handleSaveTransaction = async () => {
    if (newTrans.amount <= 0 || !newTrans.desc) return alert("Inserisci dati.");
    await addDoc(collection(db, 'transactions'), { ...newTrans, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    setNewTrans({ desc: '', amount: 0, type: 'Entrata', species: 'Maiali' });
  };

  const handleModifyProduct = async (p: Product, amount: number, isAddition: boolean) => {
    const newQty = isAddition ? p.quantity + amount : Math.max(0, p.quantity - amount);
    await updateDoc(doc(db, 'products', p.id), { quantity: newQty });
    await addDoc(collection(db, 'stock_logs'), { productName: p.name, change: isAddition ? amount : -amount, date: new Date().toLocaleString('it-IT'), ownerId: user!.uid });
  };

  const handlePublishToMarket = async () => {
    if (!sellingProduct || sellPrice <= 0) return alert("Inserisci prezzo e dati corretti.");
    try {
      await addDoc(collection(db, 'market_items'), { 
        name: sellingProduct.name, price: Number(sellPrice), quantity: sellingProduct.quantity, unit: sellingProduct.unit, 
        sellerId: user!.uid, sellerName: userName || user!.email || 'Azienda Agricola', 
        contactEmail: user!.email || '', contactPhone: sellPhone, createdAt: new Date().toISOString() 
      });
      await deleteDoc(doc(db, 'products', sellingProduct.id));
      setSellingProduct(null);
      alert("Prodotto pubblicato con successo!");
    } catch (e) { alert("Errore: verifica i dati e riprova."); }
  };

  const handleAICommand = async () => {
    const frasi = aiInput.toLowerCase().split(/ e |,|\./).filter(s => s.trim());
    let logs = [];
    for (let f of frasi) {
      const num = f.match(/(\d+)/)?.[1];
      if (f.includes('venduto') && num) {
        await addDoc(collection(db, 'transactions'), { desc: `IA: ${f}`, amount: Number(num), type: 'Entrata', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        logs.push(`✅ Registrata Entrata: ${num}€`);
      } else if (f.includes('speso') && num) {
        await addDoc(collection(db, 'transactions'), { desc: `IA: ${f}`, amount: Number(num), type: 'Uscita', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        logs.push(`✅ Registrata Uscita: ${num}€`);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setVetImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const exportASLReport = () => {
    const d = new jsPDF(); const n = window.prompt("Nome Azienda:") || "Azienda";
    d.text(n, 14, 20);
    const sorted = [...animals].sort((a,b) => a.species.localeCompare(b.species));
    autoTable(d, { 
      head: [['ID', 'Specie', 'Data', 'Padre', 'Madre', 'Note']], 
      body: sorted.map(a => [a.name, a.species, a.birthDate || '', a.sire || '', a.dam || '', a.notes]), 
      startY: 30 
    });
    d.save('Registro_Stalla.pdf');
  };

  const handleSaveBirth = async () => {
    if (!newBirth.idCode.trim()) return alert("Inserisci il codice della madre.");
    if (newBirth.count <= 0 || newBirth.count > 20) return alert("Inserisci un numero valido di nati (1-20).");
    if (!newBirth.birthDate) return alert("Inserisci la data di nascita.");
    
    try {
      const mother = animals.find(a => a.name === newBirth.idCode || a.id === newBirth.idCode);
      
      if (!mother) {
        return alert("Madre non trovata. Verifica il codice.");
      }
      
      for (let i = 0; i < newBirth.count; i++) {
        const birthDate = new Date(newBirth.birthDate);
        const defaultName = `${newBirth.species.substring(0, 3)}-${birthDate.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
        
        await addDoc(collection(db, 'animals'), {
          name: defaultName,
          species: newBirth.species,
          birthDate: newBirth.birthDate,
          dam: mother.name,
          notes: 'Nato in azienda',
          ownerId: user!.uid
        });
      }
      
      await addDoc(collection(db, 'stock_logs'), {
        productName: `Nascita ${newBirth.species}`,
        change: newBirth.count,
        date: new Date().toLocaleString('it-IT'),
        ownerId: user!.uid,
        reason: 'birth'
      });
      
      setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' });
      alert(`${newBirth.count} nuovi capi registrati con successo!`);
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      alert("Errore durante la registrazione dei parti.");
    }
  };

  // Funzione per analizzare l'immagine con TensorFlow.js
  const analyzeImageWithTensorFlow = async (imageElement) => {
    if (!model) return [];
    
    try {
      const predictions = await model.detect(imageElement);
      
      const animalKeywords = ['animal', 'dog', 'cat', 'cow', 'horse', 'sheep', 'pig', 'chicken', 'bird', 'leg', 'head', 'ear', 'eye', 'nose', 'mouth', 'hoof', 'tail'];
      
      const relevantPredictions = predictions.filter(p => 
        animalKeywords.some(keyword => p.class.toLowerCase().includes(keyword))
      );
      
      return relevantPredictions.length > 0 ? relevantPredictions : predictions;
    } catch (error) {
      console.error("Errore analisi:", error);
      return [];
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-emerald-800 bg-stone-50">Sincronizzazione in corso...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm border">
          <h1 className="text-2xl font-black text-center mb-6 text-emerald-950 italic uppercase tracking-tighter">AgriManage Pro</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border">
                <input placeholder="Tuo Nome o Azienda" className="w-full p-3 rounded-xl border text-sm" value={regName} onChange={e => setRegName(e.target.value)} required />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRegRole('farmer')} className={`flex-1 p-2 rounded-xl text-[10px] font-bold border transition-all ${regRole === 'farmer' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-stone-600'}`}>AZIENDA</button>
                  <button type="button" onClick={() => setRegRole('consumer')} className={`flex-1 p-2 rounded-xl text-[10px] font-bold border transition-all ${regRole === 'consumer' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-stone-600'}`}>CLIENTE</button>
                </div>
              </div>
            )}
            <input type="email" placeholder="Email" className="w-full p-3 rounded-xl border text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="w-full p-3 rounded-xl border text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-700 text-white py-3 rounded-xl font-bold uppercase shadow-lg active:scale-95">{isRegistering ? "Crea Account" : "Entra"}</button>
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-xs font-bold text-stone-600 uppercase mt-4 text-center underline">{isRegistering ? "Accesso" : "Registrati qui"}</button>
          </form>
        </div>
      </div>
    );
  }

  const menuItems = userRole === 'farmer' ? [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'inventory', label: 'Capi', icon: PawPrint },
    { id: 'births', label: 'Parti', icon: Baby },
    { id: 'finance', label: 'Soldi', icon: Wallet },
    { id: 'products', label: 'Scorte', icon: Package },
    { id: 'tasks', label: 'Agenda', icon: ListChecks },
    { id: 'dinastia', label: 'Albero', icon: Network },
    { id: 'vet', label: 'Vet IA', icon: Stethoscope },
    { id: 'market', label: 'Market', icon: Store }
  ] : [{ id: 'market', label: 'Acquista', icon: ShoppingBag }];

  const totalIncomeVal = transactions.filter(t => t.type === 'Entrata').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenseVal = transactions.filter(t => t.type === 'Uscita').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row relative text-stone-900 font-sans overflow-x-hidden">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r p-6 fixed h-full shadow-sm z-40">
        <h1 className="text-xl font-black mb-8 text-emerald-900 italic uppercase leading-none">AgriPro</h1>
        <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-600 hover:bg-stone-50'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="mt-4 flex items-center gap-2 text-red-600 font-bold p-2 text-xs uppercase"><LogOut size={18} /> Esci</button>
      </aside>

      {/* NAV MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t flex justify-around p-2 z-50 shadow-lg overflow-x-auto hide-scrollbar">
        {menuItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center min-w-[65px] p-2 transition-colors ${activeTab === item.id ? 'text-emerald-600' : 'text-stone-500'}`}>
            <item.icon size={22} />
            <span className="text-[9px] font-bold uppercase mt-1">{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 pt-[env(safe-area-inset-top)]">
        <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-black text-stone-900 uppercase italic tracking-tight">{activeTab}</h2>
            {userRole === 'farmer' && (
                <button onClick={() => setShowAssistant(!showAssistant)} className="bg-blue-600 text-white p-2 rounded-full shadow-md animate-bounce">
                    <Bot size={20} />
                </button>
            )}
        </div>

        {showAssistant && (
          <div className="mb-6 bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-xl animate-in slide-in-from-top-4">
            <h3 className="text-blue-900 font-bold text-xs uppercase mb-3 flex items-center gap-2 italic"><Bot size={16}/> Comandi Rapidi</h3>
            <div className="flex gap-2">
              <input className="flex-1 p-2 bg-stone-50 border-none rounded-xl text-sm font-bold" placeholder="Es: Venduto maiale a 100€" value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleAICommand()} />
              <button onClick={handleAICommand} className="bg-blue-600 text-white px-5 rounded-xl font-bold text-xs shadow-md">OK</button>
            </div>
            {aiLogs.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{aiLogs.map((l, i) => <span key={i} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-bold animate-in zoom-in">{l}</span>)}</div>}
          </div>
        )}

        {/* 1. DASHBOARD */}
        {activeTab === 'dashboard' && userRole === 'farmer' && (
          <div className="space-y-4">
            <div className="bg-stone-900 p-6 rounded-3xl text-white shadow-xl text-center">
               <p className="text-[10px] font-black text-emerald-400 uppercase mb-1 tracking-widest italic">Netto Aziendale</p>
               <h3 className="text-4xl font-black">€ {(totalIncomeVal - totalExpenseVal).toFixed(0)}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div onClick={()=>setActiveTab('inventory')} className="bg-emerald-600 p-4 rounded-2xl text-white shadow-lg cursor-pointer">
                <p className="text-[9px] font-bold uppercase opacity-70">Capi in Stalla</p>
                <h4 className="text-2xl font-black italic">{animals.length}</h4>
              </div>
              <div onClick={()=>setActiveTab('tasks')} className="bg-white p-4 rounded-2xl border shadow-sm cursor-pointer hover:border-emerald-300">
                <p className="text-[9px] font-bold text-stone-600 uppercase">Task</p>
                <h4 className="text-2xl font-black text-stone-900 italic">{tasks.filter(t=>!t.done).length}</h4>
              </div>
            </div>
          </div>
        )}

        {/* 2. INVENTARIO - MODIFICATO CON ACCORDION */}
        {activeTab === 'inventory' && userRole === 'farmer' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-[10px] font-black text-stone-600 uppercase">Registrazione Capi</h3>
                <button onClick={exportASLReport} className="text-[9px] font-bold bg-stone-900 text-white px-3 py-1 rounded-lg uppercase shadow-md">PDF ASL</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  placeholder="Codice Capo *" 
                  className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner" 
                  value={newAnimal.name} 
                  onChange={e=>setNewAnimal({...newAnimal, name:e.target.value})} 
                />
                
                <select 
                  className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner uppercase" 
                  value={newAnimal.species} 
                  onChange={e=>setNewAnimal({...newAnimal, species:e.target.value as Species})}
                >
                  {speciesList.map(s=><option key={s}>{s}</option>)}
                </select>
                
                <input 
                  type="date" 
                  className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner text-emerald-700" 
                  value={newAnimal.birthDate} 
                  onChange={e=>setNewAnimal({...newAnimal, birthDate:e.target.value})} 
                />
                
                <input 
                  placeholder="Padre (Codice)" 
                  className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner uppercase" 
                  value={newAnimal.sire} 
                  onChange={e=>setNewAnimal({...newAnimal, sire:e.target.value})} 
                />
                
                <input 
                  placeholder="Madre (Codice)" 
                  className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner uppercase" 
                  value={newAnimal.dam} 
                  onChange={e=>setNewAnimal({...newAnimal, dam:e.target.value})} 
                />
                
                <input 
                  placeholder="Note (Cure, Salute)" 
                  className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner col-span-2" 
                  value={newAnimal.notes} 
                  onChange={e=>setNewAnimal({...newAnimal, notes:e.target.value})} 
                />
                
                <button 
                  onClick={handleSaveAnimal} 
                  className="bg-emerald-600 text-white font-bold rounded-lg py-2 text-[10px] uppercase col-span-full shadow-md active:scale-95"
                >
                  Salva Capo
                </button>
              </div>
            </div>

            {/* SEZIONE SPECIE CON ACCORDION */}
            <div className="space-y-3">
              {speciesList.map(specie => {
                const capi = animals.filter(a => a.species === specie);
                if (capi.length === 0) return null;
                const isExpanded = expandedSpecies.includes(specie);
                
                return (
                  <div key={specie} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                    {/* Header della specie - sempre visibile */}
                    <div 
                      onClick={() => toggleSpecies(specie)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown size={20} className="text-emerald-600" />
                        ) : (
                          <ChevronRight size={20} className="text-stone-400" />
                        )}
                        <h4 className="text-sm font-black text-emerald-800 uppercase">
                          {specie}
                        </h4>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
                          {capi.length} {capi.length === 1 ? 'capo' : 'capi'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Contenuto espandibile */}
                    {isExpanded && (
                      <div className="p-4 border-t border-stone-100 bg-stone-50/50 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {capi.map(a => (
                            <div key={a.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative group hover:border-emerald-500 transition-all">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-black text-stone-800 uppercase text-xs">{a.name}</h4>
                                <div className="flex gap-2">
                                  <button onClick={()=>{setEditingAnimalId(a.id); setEditNote(a.notes || '');}} className="text-stone-600 hover:text-emerald-500"><Edit2 size={14}/></button>
                                  <button onClick={()=>deleteDoc(doc(db,'animals',a.id))} className="text-stone-600 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                              </div>
                              
                              {/* Visualizzazione genitori */}
                              <div className="mb-2 text-[8px] font-bold text-stone-500 uppercase">
                                {a.sire && <div>Padre: {a.sire}</div>}
                                {a.dam && <div>Madre: {a.dam}</div>}
                                {!a.sire && !a.dam && <div className="text-stone-300">Genitori non registrati</div>}
                              </div>
                              
                              {editingAnimalId === a.id ? (
                                <div className="mt-2 space-y-2">
                                  <textarea 
                                    className="w-full p-2 bg-stone-50 rounded-lg text-[10px] border-none font-bold italic shadow-inner" 
                                    value={editNote} 
                                    onChange={e=>setEditNote(e.target.value)} 
                                    placeholder="Modifica note..."
                                  />
                                  <button 
                                    onClick={()=>handleUpdateNotes(a.id)} 
                                    className="w-full bg-emerald-600 text-white py-1.5 rounded-lg text-[9px] font-black uppercase"
                                  >
                                    Salva Note
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <p className="text-[9px] text-stone-600 font-bold mb-2 italic uppercase">{a.birthDate || 'N/D'}</p>
                                  <p className="text-[10px] text-stone-700 bg-stone-50 p-2 rounded-lg italic leading-relaxed font-medium">"{a.notes || 'Nessuna nota presente.'}"</p>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. FINANCE */}
        {activeTab === 'finance' && userRole === 'farmer' && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="bg-white p-4 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-5 gap-2">
              <input placeholder="Causale Spesa/Incasso" className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner col-span-1 md:col-span-2 uppercase" value={newTrans.desc} onChange={e=>setNewTrans({...newTrans, desc:e.target.value})} />
              <div className="flex items-center bg-stone-50 rounded-xl px-4 shadow-inner">
                <span className="text-emerald-600 font-black text-xs mr-1 italic">€</span>
                <input type="number" placeholder="0" className="w-full bg-transparent border-none font-black text-sm" value={newTrans.amount || ''} onChange={e=>setNewTrans({...newTrans, amount:Number(e.target.value)})} />
              </div>
              <select className={`p-2 rounded-lg font-black text-[10px] border-none shadow-sm uppercase ${newTrans.type === 'Entrata' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`} value={newTrans.type} onChange={e=>setNewTrans({...newTrans, type:e.target.value as any})}>
                  <option value="Entrata">📈 ENTRATA</option>
                  <option value="Uscita">📉 USCITA</option>
              </select>
              <select className="p-2 bg-stone-50 rounded-lg text-[10px] font-black border-none uppercase shadow-inner" value={newTrans.species} onChange={e=>setNewTrans({...newTrans, species:e.target.value as Species})}>
                {speciesList.map(s=><option key={s}>{s}</option>)}
              </select>
              <button onClick={handleSaveTransaction} className="bg-emerald-950 text-white rounded-lg py-3 text-[10px] font-black uppercase col-span-full shadow-lg mt-1 active:scale-95 transition-all">Registra Movimento</button>
            </div>

            {speciesList.map(specie => {
              const transSpecie = transactions.filter(t => t.species === specie);
              if (transSpecie.length === 0) return null;
              const subtotal = transSpecie.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0);
              return (
                <div key={specie} className="space-y-1.5 animate-in fade-in">
                  <div className="flex justify-between items-center px-4 py-1.5 bg-stone-200 rounded-xl">
                    <h4 className="text-[10px] font-black text-stone-700 uppercase italic tracking-widest leading-none">{specie}</h4>
                    <span className={`text-[12px] font-black italic ${subtotal >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>Saldo: €{subtotal}</span>
                  </div>
                  <div className="space-y-1">
                    {transSpecie.map(t => (
                      <div key={t.id} className="bg-white p-3 rounded-xl border border-stone-200 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-lg ${t.type==='Entrata' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{t.type==='Entrata' ? <ArrowUpRight size={14}/> : <ArrowDownLeft size={14}/>}</div>
                           <div><p className="font-bold text-xs text-stone-900 uppercase leading-none mb-1">{t.desc}</p><p className="text-[8px] font-bold text-stone-500 uppercase">{t.date}</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className={`font-black text-sm italic ${t.type==='Entrata' ? 'text-emerald-600' : 'text-red-600'}`}>{t.type==='Entrata' ? '+' : '-'}€{t.amount}</span>
                           <button onClick={()=>deleteDoc(doc(db,'transactions',t.id))} className="text-stone-500 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. PRODOTTI */}
        {activeTab === 'products' && userRole === 'farmer' && (
          <div className="space-y-6 animate-in fade-in">
            {sellingProduct && (
              <div className="bg-amber-50 p-5 rounded-2xl border-2 border-amber-300 shadow-xl mb-6 animate-in zoom-in-95 max-w-lg mx-auto">
                <h3 className="text-sm font-black text-amber-950 uppercase mb-4 italic leading-none">Vetrina Km 0: {sellingProduct.name}</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <input type="number" className="p-2 rounded-lg text-xs font-bold border-none shadow-md text-emerald-700" placeholder="Prezzo (€)" onChange={e=>setSellPrice(Number(e.target.value))} />
                  <input className="p-2 rounded-lg text-xs font-bold border-none shadow-md" placeholder="WhatsApp" onChange={e=>setSellPhone(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button onClick={handlePublishToMarket} className="flex-1 bg-amber-500 text-white font-bold py-2 rounded-lg text-[10px] uppercase shadow-md active:scale-95">Pubblica</button>
                  <button onClick={()=>setSellingProduct(null)} className="px-4 bg-white text-stone-900 border-2 border-amber-200 rounded-lg text-[10px] font-black uppercase">Annulla</button>
                </div>
              </div>
            )}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm border-t-4 border-emerald-600">
              <h3 className="text-[10px] font-black uppercase text-stone-600 mb-4 tracking-widest italic flex items-center gap-2"><Package size={14} className="text-emerald-600"/> Aggiornamento Magazzino</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input placeholder="Articolo (Fieno, Mais...)" className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner uppercase" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name:e.target.value})} />
                <div className="flex gap-2">
                  <input type="number" placeholder="QTY" className="flex-1 p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner" value={newProduct.quantity || ''} onChange={e=>setNewProduct({...newProduct, quantity:Number(e.target.value)})} />
                  <select className="p-2 bg-stone-50 rounded-lg text-[10px] uppercase font-bold border-none shadow-inner" value={newProduct.unit} onChange={e=>setNewProduct({...newProduct, unit:e.target.value})}><option>kg</option><option>balle</option><option>unità</option></select>
                </div>
                <button onClick={handleAddProduct} className="bg-emerald-600 text-white rounded-lg font-black uppercase text-[10px] py-2 shadow-md">Carica</button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-md text-center group hover:border-emerald-500 transition-all">
                  <h4 className="font-black text-stone-900 uppercase text-[10px] mb-2">{p.name}</h4>
                  <p className="text-3xl font-black text-emerald-600 mb-3 leading-none tracking-tighter italic">{p.quantity} <span className="text-[9px] uppercase opacity-50 italic font-bold">{p.unit}</span></p>
                  <div className="flex gap-1 mb-2">
                    <button onClick={()=>handleModifyProduct(p, 1, false)} className="flex-1 bg-stone-100 p-2 rounded-lg text-stone-700 hover:bg-red-50 hover:text-red-600 border border-stone-100 shadow-sm"><MinusCircle size={16}/></button>
                    <button onClick={()=>handleModifyProduct(p, 1, true)} className="flex-1 bg-stone-100 p-2 rounded-lg text-stone-700 hover:bg-emerald-50 hover:text-emerald-600 border border-stone-100 shadow-sm"><PlusCircle size={16}/></button>
                  </div>
                  <button onClick={()=>setSellingProduct(p)} className="w-full bg-amber-100 text-amber-900 font-black py-1.5 rounded-lg text-[8px] uppercase tracking-widest border border-amber-200 shadow-sm italic hover:bg-amber-200">Vendi Km 0</button>
                  <button onClick={()=>deleteDoc(doc(db,'products',p.id))} className="text-stone-400 mt-2 hover:text-red-500 transition-colors"><Trash2 size={12}/></button>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <h3 className="text-[10px] font-black uppercase text-stone-600 mb-4 flex items-center gap-2 italic"><History size={14} className="text-emerald-600"/> Cronologia Movimenti</h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                    {stockLogs.map(log => (
                        <div key={log.id} className="flex justify-between items-center text-[10px] p-2 bg-stone-50 rounded-xl border border-stone-100">
                            <span className="font-black text-stone-800 uppercase italic tracking-tighter">{log.productName}</span>
                            <span className={`font-black px-2 py-0.5 rounded-full ${log.change > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{log.change > 0 ? '+' : ''}{log.change}</span>
                            <span className="text-stone-500 font-bold uppercase text-[8px] italic">{log.date}</span>
                        </div>
                    ))}
                    {stockLogs.length === 0 && <p className="text-center text-[9px] text-stone-500 uppercase italic py-4">Nessun movimento recente.</p>}
                </div>
            </div>
          </div>
        )}

        {/* 5. TASKS */}
        {activeTab === 'tasks' && userRole === 'farmer' && (
          <div className="space-y-6 max-w-lg mx-auto animate-in slide-in-from-left-6">
            <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3 border-t-4 border-stone-900">
               <h3 className="text-[10px] font-black uppercase text-stone-600 italic">Programmazione</h3>
               <div className="flex flex-col gap-2">
                 <input className="p-2 bg-stone-50 rounded-lg font-bold text-xs border-none shadow-inner uppercase" placeholder="Descrizione attività..." value={newTask} onChange={e=>setNewTask(e.target.value)} />
                 <div className="flex gap-2">
                    <input type="date" className="flex-1 p-2 bg-stone-50 rounded-lg font-bold text-[10px] text-emerald-700 border-none shadow-inner" value={newTaskDate} onChange={e=>setNewTaskDate(e.target.value)} />
                    <button onClick={handleAddTask} className="bg-emerald-950 text-white px-6 rounded-lg font-black text-[10px] uppercase shadow-md active:scale-95">Add</button>
                 </div>
               </div>
               <div className="relative pt-2 border-t mt-2">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input className="w-full p-2 pl-8 bg-stone-100 border-none rounded-lg text-[10px] font-black italic shadow-inner tracking-widest text-stone-700" placeholder="Filtra lavori..." value={taskSearch} onChange={e=>setTaskSearch(e.target.value)} />
               </div>
            </div>
            <div className="space-y-2">
              {tasks.filter(t => t.text.toLowerCase().includes(taskSearch.toLowerCase()))
                .sort((a,b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
                .map(t => (
                <div key={t.id} className={`bg-white p-3 rounded-xl border-2 flex justify-between items-center transition-all ${t.done ? 'opacity-30' : 'shadow-md border-white border-l-8 border-l-emerald-600'}`}>
                  <div>
                    <p className={`text-[13px] font-black uppercase tracking-tight ${t.done ? 'line-through text-stone-500' : 'text-stone-900'}`}>{t.text}</p>
                    <p className="text-[9px] font-bold text-stone-700 uppercase mt-1 italic tracking-widest">Scadenza: {t.dueDate || 'N/D'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>updateDoc(doc(db,'tasks',t.id),{done:!t.done})} className={`p-2 rounded-lg transition-all ${t.done ? 'bg-stone-200 text-stone-600' : 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100'}`}><CheckCircle2 size={18}/></button>
                    <button onClick={()=>deleteDoc(doc(db,'tasks',t.id))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. VET IA - VERSIONE TENSORFLOW.JS (100% GRATUITA) */}
        {activeTab === 'vet' && userRole === 'farmer' && (
          <div className="bg-white p-6 rounded-3xl border shadow-xl max-w-lg mx-auto border-t-8 border-blue-600">
            <div className="bg-blue-600 p-6 rounded-2xl text-white mb-6 flex items-center gap-4 shadow-lg">
              <Stethoscope size={40} strokeWidth={1} />
              <div>
                <h3 className="text-xl font-black uppercase italic leading-none mb-1">Diagnosi IA</h3>
                <p className="text-blue-100 text-[10px] uppercase tracking-widest">
                  {modelLoading ? "⏳ Caricamento AI..." : model ? "✓ AI Pronta" : "Clicca per caricare AI"}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {/* Sezione Foto */}
              <div>
                <p className="text-[10px] font-black text-stone-700 uppercase mb-2 flex items-center gap-2">
                  <Camera size={14} /> Foto del sintomo
                </p>
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-blue-50 transition-all bg-stone-50">
                  {vetImage ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={vetImage} 
                        alt="Sintomo" 
                        className="w-full h-full object-cover rounded-2xl"
                        id="vet-analysis-image"
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setVetImage(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <UploadCloud size={32} className="text-stone-400 mx-auto mb-2" />
                      <p className="text-[9px] font-bold text-stone-600">CLICCA PER CARICARE</p>
                      <p className="text-[7px] text-stone-400 mt-1">(foto dell'animale o del sintomo)</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload}
                  />
                </label>
              </div>

              {/* Sezione Sintomi */}
              <div>
                <p className="text-[10px] font-black text-stone-700 uppercase mb-2 flex items-center gap-2">
                  <MessageCircle size={14} /> Sintomi
                </p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {['Febbre', 'Tosse', 'Diarrea', 'Zoppia', 'Gonfiore', 'Ferita', 'Inappetenza', 'Letargia'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setVetSymptom(prev => prev ? `${prev}, ${s.toLowerCase()}` : s.toLowerCase())}
                      className="text-[8px] bg-stone-100 hover:bg-blue-100 px-2 py-1 rounded-full font-bold"
                    >
                      + {s}
                    </button>
                  ))}
                </div>

                <textarea
                  className="w-full p-4 bg-stone-50 rounded-2xl font-bold text-sm h-32 shadow-inner"
                  placeholder="Descrivi i sintomi in dettaglio..."
                  value={vetSymptom}
                  onChange={e => setVetSymptom(e.target.value)}
                />
              </div>
            </div>

            {/* Pulsante Analisi */}
            <button
              onClick={async () => {
                if (!vetSymptom.trim() && !vetImage) {
                  alert("Inserisci almeno un sintomo o carica una foto");
                  return;
                }
                
                setIsAnalyzing(true);
                
                try {
                  let aiPredictions = [];
                  
                  // Analizza la foto con TensorFlow.js se presente
                  if (vetImage && model) {
                    const img = document.getElementById('vet-analysis-image');
                    if (img && img.complete) {
                      aiPredictions = await analyzeImageWithTensorFlow(img);
                    }
                  }
                  
                  // Logica di diagnosi
                  const symptoms = vetSymptom.toLowerCase();
                  
                  // Costruisci il risultato
                  let title = "Analisi in corso";
                  let possibleCauses = [];
                  let action = "";
                  let severity = "medium";
                  let visualDesc = "";
                  
                  if (aiPredictions.length > 0) {
                    // Cosa ha visto l'AI
                    const detectedItems = aiPredictions.map(p => 
                      `${p.class} (${Math.round(p.score*100)}%)`
                    ).join(', ');
                    
                    visualDesc = `Nell'immagine ho rilevato: ${detectedItems}. `;
                    
                    // Diagnosi basata su quello che l'AI ha visto
                    if (aiPredictions.some(p => p.class.includes('cow') || p.class.includes('horse') || p.class.includes('sheep') || p.class.includes('pig'))) {
                      const animal = aiPredictions.find(p => p.class.includes('cow') || p.class.includes('horse') || p.class.includes('sheep') || p.class.includes('pig'))?.class;
                      
                      if (symptoms.includes('zoppia')) {
                        title = `Problema locomotorio in ${animal}`;
                        possibleCauses = ["Trauma", "Artrite", "Ascesso podale", "Corpo estraneo"];
                        action = "ISPEZIONARE L'ARTO, VERIFICARE PRESENZA DI CORPI ESTRANEI, CONTATTARE VETERINARIO";
                      } else if (symptoms.includes('tosse') || symptoms.includes('febbre')) {
                        title = `Possibile infezione respiratoria in ${animal}`;
                        possibleCauses = ["Influenza", "Bronchite", "Polmonite"];
                        action = "ISOLARE IL CAPO, MONITORARE TEMPERATURA, CONTATTARE VETERINARIO";
                        severity = "high";
                      } else if (symptoms.includes('diarrea')) {
                        title = `Problema gastrointestinale in ${animal}`;
                        possibleCauses = ["Parassiti", "Infezione batterica", "Alimentazione"];
                        action = "SOSPENDERE ALIMENTAZIONE PER 12H, GARANTIRE ACQUA, CONTATTARE VETERINARIO";
                        severity = "high";
                      }
                    }
                  }
                  
                  // Se non c'è diagnosi specifica
                  if (!title || title === "Analisi in corso") {
                    if (symptoms.includes('febbre') || symptoms.includes('tosse')) {
                      title = "Possibile infezione respiratoria";
                      possibleCauses = ["Influenza", "Bronchite", "Polmonite"];
                      action = "ISOLARE IL CAPO, MONITORARE TEMPERATURA, CONTATTARE VETERINARIO";
                      severity = "high";
                    } else if (symptoms.includes('diarrea')) {
                      title = "Problema gastrointestinale";
                      possibleCauses = ["Parassiti", "Infezione batterica", "Alimentazione"];
                      action = "SOSPENDERE ALIMENTAZIONE PER 12H, GARANTIRE ACQUA, CONTATTARE VETERINARIO";
                      severity = "high";
                    } else {
                      title = "Sintomi aspecifici";
                      possibleCauses = ["Stress", "Malessere generale", "Infezione in fase iniziale"];
                      action = "MONITORARE L'EVOLUZIONE, RACCOGLIERE PIÙ INFORMAZIONI";
                      severity = "low";
                    }
                  }
                  
                  setVetResult({
                    title: title,
                    desc: `${visualDesc}Sintomi descritti: ${vetSymptom || 'non specificati'}.`,
                    action: action,
                    possibleCauses: possibleCauses,
                    severity: severity,
                    visualFindings: aiPredictions.map(p => `${p.class} (${Math.round(p.score*100)}%)`),
                    confidence: aiPredictions.length > 0 ? "alta (foto analizzata)" : "media (solo sintomi)"
                  });
                } catch (error) {
                  console.error("Errore analisi:", error);
                  alert("Errore durante l'analisi. Riprova.");
                } finally {
                  setIsAnalyzing(false);
                }
              }}
              disabled={isAnalyzing || (modelLoading && !model)}
              className="w-full bg-stone-900 text-white py-4 rounded-xl font-black uppercase text-sm shadow-lg hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {modelLoading ? (
                <><Activity className="animate-spin" size={16}/> CARICAMENTO AI...</>
              ) : isAnalyzing ? (
                <><Activity className="animate-spin" size={16}/> ANALISI IN CORSO...</>
              ) : (
                <><Camera size={16}/> ANALIZZA CON AI</>
              )}
            </button>

            {/* Risultato */}
            {vetResult && (
              <div className="mt-8 space-y-4 animate-in slide-in-from-bottom-8">
                <div className={`p-5 rounded-2xl border-l-8 ${
                  vetResult.severity === 'high' ? 'border-l-red-600 bg-red-50' :
                  vetResult.severity === 'medium' ? 'border-l-amber-500 bg-amber-50' :
                  'border-l-emerald-600 bg-emerald-50'
                }`}>
                  
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-black uppercase">{vetResult.title}</h4>
                    <span className="bg-green-500 text-white text-[8px] px-2 py-1 rounded-full">
                      AI Locale ✓
                    </span>
                  </div>

                  <p className="text-xs mb-4 italic">{vetResult.desc}</p>

                  {vetResult.visualFindings?.length > 0 && (
                    <div className="mb-4 bg-blue-50 p-3 rounded-xl">
                      <p className="text-[8px] font-black mb-2">🔍 COSA HA VISTO L'AI:</p>
                      <div className="flex flex-wrap gap-1">
                        {vetResult.visualFindings.map((f, i) => (
                          <span key={i} className="text-[8px] bg-white px-2 py-1 rounded-full border border-blue-200">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-[8px] font-black mb-2">POSSIBILI CAUSE:</p>
                    <div className="flex flex-wrap gap-1">
                      {vetResult.possibleCauses.map((c, i) => (
                        <span key={i} className="text-[8px] bg-white px-2 py-1 rounded-full border">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl text-center text-[9px] font-black uppercase ${
                    vetResult.severity === 'high' ? 'bg-red-600 text-white' :
                    vetResult.severity === 'medium' ? 'bg-amber-500 text-white' :
                    'bg-emerald-600 text-white'
                  }`}>
                    {vetResult.action}
                  </div>
                </div>

                <p className="text-[6px] text-stone-400 text-center">
                  🤖 AI eseguita localmente nel browser - 100% gratuita - Privacy garantita
                </p>

                <button
                  onClick={() => {
                    setVetResult(null);
                    setVetSymptom('');
                    setVetImage(null);
                  }}
                  className="w-full bg-stone-200 py-3 rounded-xl text-[9px] font-black uppercase hover:bg-stone-300"
                >
                  NUOVA ANALISI
                </button>
              </div>
            )}
          </div>
        )}

        {/* 7. MARKET */}
        {activeTab === 'market' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-12 duration-1000">
            <div className="bg-amber-500 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
               <ShoppingBag size={250} className="absolute -bottom-16 -right-16 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-[10s]" />
               <div className="relative z-10 max-w-2xl text-center md:text-left">
                 <h3 className="text-4xl font-black italic uppercase mb-2 leading-none tracking-tighter">Market Km 0</h3>
                 <p className="text-amber-50 font-black text-xs italic tracking-[0.2em] uppercase leading-none opacity-90">Eccellenze locali 2026</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketItems.map(item => (
                <div key={item.id} className="bg-white rounded-[2.5rem] border-2 border-stone-100 shadow-md overflow-hidden flex flex-col group hover:shadow-2xl hover:translate-y-[-5px] transition-all duration-700">
                  <div className="h-44 bg-stone-50 flex items-center justify-center relative overflow-hidden group-hover:bg-amber-50 transition-colors duration-1000">
                     <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-2 rounded-2xl font-black text-xl text-emerald-600 shadow-lg border-2 border-emerald-50 italic leading-none">€{item.price.toFixed(0)}</div>
                     <ShoppingBag size={56} className="text-stone-200 opacity-50 group-hover:scale-125 transition-all duration-1000" />
                  </div>
                  <div className="p-6 flex flex-col flex-1 border-t border-stone-50">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 italic leading-none">{item.sellerName}</p>
                    <h4 className="text-2xl font-black text-stone-900 tracking-tighter mb-6 uppercase group-hover:text-amber-600 transition-colors duration-500 leading-none">{item.name}</h4>
                    <div className="flex justify-between items-center mb-6 bg-stone-50 p-4 rounded-2xl border-2 border-white shadow-inner">
                       <span className="text-[10px] font-black text-stone-600 uppercase italic tracking-widest">STOCK</span>
                       <span className="font-black text-stone-900 text-lg uppercase tracking-tight leading-none">{item.quantity} <span className="text-xs text-stone-500 font-bold uppercase">{item.unit}</span></span>
                    </div>
                    {item.contactPhone ? (
                       <a href={`https://wa.me/39${item.contactPhone}?text=Salve ${item.sellerName}, vorrei acquistare ${item.name} via AgriPro.`} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(37,211,102,0.3)] flex items-center justify-center gap-4 hover:bg-[#1da851] hover:scale-105 transition-all active:scale-95 shadow-xl shadow-emerald-100 border-b-8 border-[#1DA851]"><MessageCircle size={24}/> WhatsApp</a>
                    ) : (
                       <a href={`mailto:${item.contactEmail}`} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 flex items-center justify-center gap-4 hover:scale-105 transition-all active:scale-95 border-b-8 border-blue-800 shadow-xl"><Mail size={24}/> Invia Email</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. DINASTIA */}
        {activeTab === 'dinastia' && (
          <div className="bg-white p-8 rounded-3xl border shadow-sm animate-in fade-in overflow-x-auto custom-scrollbar">
            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-2"><Network className="text-emerald-500"/> Albero Genealogico</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {animals.filter(a => !a.dam && !a.sire).map(root => (
                <div key={root.id} className="bg-stone-50 p-4 rounded-3xl border-2 border-white shadow-inner min-w-[280px]">
                  <DynastyBranch animal={root} allAnimals={animals} />
                </div>
              ))}
              {animals.length === 0 && <p className="text-stone-300 font-black italic uppercase text-center py-20 border-2 border-dashed rounded-3xl col-span-full">Nessun dato registrato.</p>}
            </div>
          </div>
        )}

        {/* 9. PARTI (BIRTHS) */}
        {activeTab === 'births' && userRole === 'farmer' && (
          <div className="bg-white p-8 rounded-3xl border shadow-xl max-w-lg mx-auto animate-in zoom-in-95">
             <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-amber-700 mb-8 flex items-center gap-4 shadow-lg shadow-amber-50">
               <Baby size={48} strokeWidth={1.5} className="animate-pulse" />
               <p className="text-[10px] font-black italic uppercase tracking-tighter leading-relaxed text-amber-950 uppercase tracking-widest">Registrazione Nascite</p>
             </div>
             <div className="space-y-6">
                <input className="w-full p-3 bg-stone-50 rounded-xl font-black text-sm shadow-inner border-none uppercase" placeholder="Codice Madre" value={newBirth.idCode} onChange={e=>setNewBirth({...newBirth, idCode:e.target.value})} />
                <div className="flex gap-2">
                  <input type="number" min="1" max="20" className="flex-1 p-3 bg-stone-50 rounded-xl font-black text-sm shadow-inner border-none" placeholder="N. Nati" value={newBirth.count} onChange={e=>setNewBirth({...newBirth, count:Number(e.target.value)})} />
                  <select className="flex-1 p-3 bg-stone-50 rounded-xl font-bold text-[10px] border-none shadow-inner uppercase" value={newBirth.species} onChange={e=>setNewBirth({...newBirth, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                </div>
                <input type="date" className="w-full p-3 bg-stone-50 rounded-xl font-bold text-sm shadow-inner border-none text-emerald-700 font-black uppercase tracking-widest" value={newBirth.birthDate} onChange={e=>setNewBirth({...newBirth, birthDate:e.target.value})} />
                <button onClick={handleSaveBirth} className="w-full bg-emerald-950 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">Registra Ora</button>
             </div>
          </div>
        )}

      </main>
    </div>
  );
}
