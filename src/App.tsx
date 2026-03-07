import React, { useState, useEffect } from 'react';
import {
  PawPrint, CalendarDays, TrendingUp, Network, Baby, Trash2,
  PlusCircle, LogOut, Lock, Menu, X, Search, LayoutDashboard,
  History, Package, Edit2, CheckCircle2,
  MinusCircle, Activity, ListChecks, Wallet,
  ArrowUpRight, ArrowDownLeft, Ghost, UserPlus, Stethoscope, 
  UploadCloud, AlertTriangle, FileDown, Store, ShoppingBag, 
  MessageCircle, Mail, Bot, Info, Send, Save, ArrowRightLeft, Plus
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, where, getDocs, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setDoc, getDoc, orderBy, limit } from "firebase/firestore";
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

// --- INTERFACCE ---
type Species = 'Maiali' | 'Cavalli' | 'Mucche' | 'Galline' | 'Oche';
interface Animal { 
  id: string; 
  name: string; 
  species: Species; 
  notes: string; 
  sire?: string; 
  dam?: string; 
  birthDate?: string; 
  ownerId: string; 
}
interface Transaction { id: string; type: 'Entrata' | 'Uscita'; amount: number; desc: string; species: Species; date: string; ownerId: string; }
interface Task { id: string; text: string; done: boolean; dueDate?: string; ownerId: string; }
interface Product { id: string; name: string; quantity: number; unit: string; ownerId: string; }
interface StockLog { id: string; productName: string; change: number; date: string; ownerId: string; }
interface MarketItem { id: string; name: string; price: number; quantity: number; unit: string; sellerId: string; sellerName: string; contactEmail: string; contactPhone: string; createdAt: string; }

// Componente DynastyBranch
const DynastyBranch = ({ animal, allAnimals, level = 0 }: { animal: Animal, allAnimals: Animal[], level?: number }) => {
  const father = allAnimals.find(a => a.name === animal.sire || a.id === animal.sire);
  const mother = allAnimals.find(a => a.name === animal.dam || a.id === animal.dam);
  const children = allAnimals.filter(a => a.dam === animal.name || a.sire === animal.name || a.dam === animal.id || a.sire === animal.id);
  
  return (
    <div className={level > 0 ? "ml-4 border-l-2 border-stone-300 pl-4 mt-2" : ""}>
      <div className={`p-3 rounded-xl border bg-white mb-2 shadow-sm ${level === 0 ? 'border-l-4 border-l-emerald-600' : ''}`}>
        <p className="font-bold text-stone-900 text-sm uppercase">{animal.name}</p>
        <p className="text-[10px] text-stone-600 font-bold uppercase">{animal.species}</p>
        {(father || mother) && (
          <div className="mt-2 text-[9px] bg-stone-50 p-1.5 rounded-lg">
            {father && <p className="text-stone-700">👨 Padre: <span className="font-bold">{father.name}</span></p>}
            {mother && <p className="text-stone-700">👩 Madre: <span className="font-bold">{mother.name}</span></p>}
          </div>
        )}
        <p className="text-[8px] text-stone-400 font-bold uppercase mt-1">Generazione {level}</p>
      </div>
      {children.length > 0 && (
        <div className="mt-1">
          <p className="text-[8px] font-bold text-emerald-600 uppercase mb-1 ml-2">FIGLI ({children.length})</p>
          {children.map(child => <DynastyBranch key={child.id} animal={child} allAnimals={allAnimals} level={level + 1} />)}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [showAssistant, setShowAssistant] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'farmer' | 'consumer' | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRegistering, setIsRegistering] = useState(false);

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
  const [editSire, setEditSire] = useState('');
  const [editDam, setEditDam] = useState('');

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
    if (!newAnimal.name.trim()) return alert("Codice animale richiesto.");
    await addDoc(collection(db, 'animals'), { 
      ...newAnimal, 
      ownerId: user!.uid,
      createdAt: new Date().toISOString()
    });
    setNewAnimal({ name: '', species: 'Maiali', birthDate: '', sire: '', dam: '', notes: '' });
    alert("Animale registrato!");
  };

  const handleUpdateAnimal = async (id: string) => {
    const updates: any = {};
    if (editNote !== undefined) updates.notes = editNote;
    if (editSire !== undefined) updates.sire = editSire;
    if (editDam !== undefined) updates.dam = editDam;
    await updateDoc(doc(db, 'animals', id), updates);
    setEditingAnimalId(null);
    alert("Dati aggiornati!");
  };

  const handleSaveTransaction = async () => {
    if (newTrans.amount <= 0 || !newTrans.desc) return alert("Inserisci tutti i dati.");
    await addDoc(collection(db, 'transactions'), { ...newTrans, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    setNewTrans({ desc: '', amount: 0, type: 'Entrata', species: 'Maiali' });
    alert("Movimento registrato!");
  };

  const handleModifyProduct = async (p: Product, amount: number, isAddition: boolean) => {
    const newQty = isAddition ? p.quantity + amount : Math.max(0, p.quantity - amount);
    await updateDoc(doc(db, 'products', p.id), { quantity: newQty });
    await addDoc(collection(db, 'stock_logs'), { productName: p.name, change: isAddition ? amount : -amount, date: new Date().toLocaleString('it-IT'), ownerId: user!.uid });
  };

  const handlePublishToMarket = async () => {
    if (!sellingProduct || sellPrice <= 0) return alert("Inserisci prezzo valido.");
    try {
      await addDoc(collection(db, 'market_items'), { 
        name: sellingProduct.name, price: Number(sellPrice), quantity: sellingProduct.quantity, unit: sellingProduct.unit, 
        sellerId: user!.uid, sellerName: userName || user!.email || 'Azienda Agricola', 
        contactEmail: user!.email || '', contactPhone: sellPhone, createdAt: new Date().toISOString() 
      });
      await deleteDoc(doc(db, 'products', sellingProduct.id));
      setSellingProduct(null);
      alert("Prodotto pubblicato!");
    } catch (e) { alert("Errore: verifica i dati."); }
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
    setTimeout(() => setAiLogs([]), 5000);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.quantity <= 0) return alert("Inserisci nome e quantità");
    const existing = products.find(p => p.name.toLowerCase() === newProduct.name.toLowerCase());
    if (existing) { await updateDoc(doc(db, 'products', existing.id), { quantity: existing.quantity + newProduct.quantity }); }
    else { await addDoc(collection(db, 'products'), { ...newProduct, ownerId: user!.uid }); }
    setNewProduct({ name: '', quantity: 0, unit: 'kg' });
    alert("Prodotto aggiunto!");
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return alert("Inserisci una descrizione");
    await addDoc(collection(db, 'tasks'), { text: newTask, done: false, dueDate: newTaskDate, ownerId: user!.uid });
    setNewTask('');
    alert("Attività aggiunta!");
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
    const d = new jsPDF(); 
    const n = window.prompt("Nome Azienda:") || "Azienda";
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
      if (!mother) return alert("Madre non trovata.");
      
      for (let i = 0; i < newBirth.count; i++) {
        const birthDate = new Date(newBirth.birthDate);
        const defaultName = `${newBirth.species.substring(0, 3)}-${birthDate.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
        const customName = prompt(`Nome per il capo n.${i + 1}:`, defaultName) || defaultName;
        
        await addDoc(collection(db, 'animals'), {
          name: customName,
          species: newBirth.species,
          birthDate: newBirth.birthDate,
          dam: mother.name,
          notes: 'Nato in azienda',
          ownerId: user!.uid
        });
      }
      
      setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' });
      alert(`${newBirth.count} nuovi capi registrati!`);
    } catch (error) {
      alert("Errore durante la registrazione.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-emerald-800 bg-stone-50">Caricamento...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm border">
          <h1 className="text-2xl font-black text-center mb-6 text-emerald-950 italic uppercase tracking-tighter">AgriManage Pro</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border">
                <input placeholder="Nome o azienda" className="w-full p-3 rounded-xl border text-sm" value={regName} onChange={e => setRegName(e.target.value)} required />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRegRole('farmer')} className={`flex-1 p-2 rounded-xl text-[10px] font-bold border transition-all ${regRole === 'farmer' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-stone-600'}`}>AZIENDA</button>
                  <button type="button" onClick={() => setRegRole('consumer')} className={`flex-1 p-2 rounded-xl text-[10px] font-bold border transition-all ${regRole === 'consumer' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-stone-600'}`}>CLIENTE</button>
                </div>
              </div>
            )}
            <input type="email" placeholder="Email" className="w-full p-3 rounded-xl border text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="w-full p-3 rounded-xl border text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-700 text-white py-3 rounded-xl font-bold uppercase shadow-lg active:scale-95">{isRegistering ? "Registrati" : "Accedi"}</button>
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-xs font-bold text-stone-600 uppercase mt-4 text-center underline">{isRegistering ? "Hai già un account?" : "Non hai un account?"}</button>
          </form>
        </div>
      </div>
    );
  }

  const menuItems = userRole === 'farmer' ? [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventario', icon: PawPrint },
    { id: 'births', label: 'Nascite', icon: Baby },
    { id: 'finance', label: 'Finanze', icon: Wallet },
    { id: 'products', label: 'Magazzino', icon: Package },
    { id: 'tasks', label: 'Attività', icon: ListChecks },
    { id: 'dinastia', label: 'Genealogia', icon: Network },
    { id: 'vet', label: 'Veterinario', icon: Stethoscope },
    { id: 'market', label: 'Mercato', icon: Store }
  ] : [{ id: 'market', label: 'Acquista', icon: ShoppingBag }];

  const totalIncome = transactions.filter(t => t.type === 'Entrata').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Uscita').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row relative text-stone-900 font-sans overflow-x-hidden">
      
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

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t flex justify-around p-2 z-50 shadow-lg overflow-x-auto hide-scrollbar">
        {menuItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center min-w-[65px] p-2 transition-colors ${activeTab === item.id ? 'text-emerald-600' : 'text-stone-500'}`}>
            <item.icon size={22} />
            <span className="text-[9px] font-bold uppercase mt-1">{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 pt-safe">
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
            <h3 className="text-blue-900 font-bold text-xs uppercase mb-3 flex items-center gap-2 italic"><Bot size={16}/> Comandi Vocali</h3>
            <div className="flex gap-2">
              <input className="flex-1 p-2 bg-stone-50 border-none rounded-xl text-sm font-bold" placeholder="Es: Venduto maiale a 100€" value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleAICommand()} />
              <button onClick={handleAICommand} className="bg-blue-600 text-white px-5 rounded-xl font-bold text-xs shadow-md">Invia</button>
            </div>
            {aiLogs.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{aiLogs.map((l, i) => <span key={i} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-bold animate-in zoom-in">{l}</span>)}</div>}
          </div>
        )}

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && userRole === 'farmer' && (
          <div className="space-y-4">
            <div className="bg-stone-900 p-6 rounded-3xl text-white shadow-xl text-center">
              <p className="text-[10px] font-black text-emerald-400 uppercase mb-1 tracking-widest italic">Bilancio Aziendale</p>
              <h3 className="text-4xl font-black">€ {(totalIncome - totalExpense).toFixed(0)}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div onClick={()=>setActiveTab('inventory')} className="bg-emerald-600 p-4 rounded-2xl text-white shadow-lg cursor-pointer">
                <p className="text-[9px] font-bold uppercase opacity-70">Animali</p>
                <h4 className="text-2xl font-black italic">{animals.length}</h4>
              </div>
              <div onClick={()=>setActiveTab('tasks')} className="bg-white p-4 rounded-2xl border shadow-sm cursor-pointer hover:border-emerald-300">
                <p className="text-[9px] font-bold text-stone-600 uppercase">Attività</p>
                <h4 className="text-2xl font-black text-stone-900 italic">{tasks.filter(t=>!t.done).length}</h4>
              </div>
              <div onClick={()=>setActiveTab('products')} className="bg-white p-4 rounded-2xl border shadow-sm cursor-pointer hover:border-emerald-300">
                <p className="text-[9px] font-bold text-stone-600 uppercase">Prodotti</p>
                <h4 className="text-2xl font-black text-stone-900 italic">{products.length}</h4>
              </div>
              <div onClick={()=>setActiveTab('finance')} className="bg-white p-4 rounded-2xl border shadow-sm cursor-pointer hover:border-emerald-300">
                <p className="text-[9px] font-bold text-stone-600 uppercase">Transazioni</p>
                <h4 className="text-2xl font-black text-stone-900 italic">{transactions.length}</h4>
              </div>
            </div>
          </div>
        )}

        {/* INVENTARIO */}
        {activeTab === 'inventory' && userRole === 'farmer' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-[10px] font-black text-stone-600 uppercase">Nuovo Animale</h3>
                <button onClick={exportASLReport} className="text-[9px] font-bold bg-stone-900 text-white px-3 py-1 rounded-lg uppercase shadow-md">PDF</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input placeholder="Nome/Codice *" className="p-3 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner" value={newAnimal.name} onChange={e=>setNewAnimal({...newAnimal, name:e.target.value})} />
                <select className="p-3 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner uppercase" value={newAnimal.species} onChange={e=>setNewAnimal({...newAnimal, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                <input type="date" className="p-3 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner" value={newAnimal.birthDate} onChange={e=>setNewAnimal({...newAnimal, birthDate:e.target.value})} />
                <input placeholder="Padre" className="p-3 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner" value={newAnimal.sire} onChange={e=>setNewAnimal({...newAnimal, sire:e.target.value})} />
                <input placeholder="Madre" className="p-3 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner" value={newAnimal.dam} onChange={e=>setNewAnimal({...newAnimal, dam:e.target.value})} />
                <input placeholder="Note" className="p-3 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner" value={newAnimal.notes} onChange={e=>setNewAnimal({...newAnimal, notes:e.target.value})} />
                <button onClick={handleSaveAnimal} className="bg-emerald-600 text-white font-bold rounded-lg py-3 text-xs uppercase col-span-full shadow-md active:scale-95">Salva</button>
              </div>
            </div>

            {speciesList.map(specie => {
              const capi = animals.filter(a => a.species === specie);
              if (capi.length === 0) return null;
              return (
                <div key={specie} className="space-y-2">
                  <h4 className="text-xs font-black text-emerald-800 uppercase px-1 italic border-l-4 border-emerald-500 pl-2">{specie} ({capi.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {capi.map(a => {
                      const fatherName = a.sire ? (animals.find(anim => anim.id === a.sire || anim.name === a.sire)?.name || a.sire) : null;
                      const motherName = a.dam ? (animals.find(anim => anim.id === a.dam || anim.name === a.dam)?.name || a.dam) : null;
                      return (
                        <div key={a.id} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm relative group hover:border-emerald-500 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-black text-stone-800 uppercase text-sm">{a.name}</h4>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingAnimalId(a.id); setEditNote(a.notes || ''); setEditSire(a.sire || ''); setEditDam(a.dam || ''); }} className="text-stone-600 hover:text-emerald-500"><Edit2 size={16}/></button>
                              <button onClick={() => { if (confirm(`Eliminare ${a.name}?`)) { deleteDoc(doc(db, 'animals', a.id)); } }} className="text-stone-600 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                          </div>
                          {editingAnimalId === a.id ? (
                            <div className="mt-2 space-y-2">
                              <input placeholder="Padre" className="w-full p-2 bg-stone-50 rounded-lg text-[10px] border-none font-bold shadow-inner" value={editSire} onChange={e => setEditSire(e.target.value)} />
                              <input placeholder="Madre" className="w-full p-2 bg-stone-50 rounded-lg text-[10px] border-none font-bold shadow-inner" value={editDam} onChange={e => setEditDam(e.target.value)} />
                              <textarea className="w-full p-2 bg-stone-50 rounded-lg text-[10px] border-none font-bold italic shadow-inner" value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="Note" />
                              <button onClick={() => handleUpdateAnimal(a.id)} className="w-full bg-emerald-600 text-white py-1.5 rounded-lg text-[9px] font-black uppercase">Salva</button>
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 gap-1 text-[9px] mb-2">
                                {fatherName && <div className="bg-blue-50 p-1 rounded"><span className="text-blue-700 font-bold">👨 Padre:</span> <span className="ml-1 font-black">{fatherName}</span></div>}
                                {motherName && <div className="bg-pink-50 p-1 rounded"><span className="text-pink-700 font-bold">👩 Madre:</span> <span className="ml-1 font-black">{motherName}</span></div>}
                              </div>
                              <p className="text-[9px] text-stone-600 font-bold mb-2 italic uppercase">{a.birthDate || 'N/D'}</p>
                              <p className="text-[10px] text-stone-700 bg-stone-50 p-2 rounded-lg italic">{a.notes || 'Nessuna nota'}</p>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FINANCE */}
        {activeTab === 'finance' && userRole === 'farmer' && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="bg-white p-4 rounded-2xl
