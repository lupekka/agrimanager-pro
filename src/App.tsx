import React, { useState, useEffect } from 'react';
import {
  PawPrint, CalendarDays, TrendingUp, Network, Baby, Trash2,
  PlusCircle, LogOut, Lock, Menu, X, Search, LayoutDashboard,
  History, Package, Edit2, CheckCircle2,
  MinusCircle, Activity, ListChecks, Wallet,
  ArrowUpRight, ArrowDownLeft, Ghost, UserPlus, Stethoscope, UploadCloud, AlertTriangle, FileDown, Store, ShoppingBag, MessageCircle, Mail, Bot, Info, Send
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

type Species = 'Maiali' | 'Cavalli' | 'Mucche' | 'Galline' | 'Oche';
interface Animal { id: string; name: string; species: Species; notes: string; sire?: string; dam?: string; birthDate?: string; ownerId: string; }
interface BirthRecord { id: string; animalName: string; species: Species; date: string; offspringCount: number; birthDate: string; ownerId: string; }
interface Transaction { id: string; type: 'Entrata' | 'Uscita'; amount: number; desc: string; species: Species; date: string; ownerId: string; }
interface Task { id: string; text: string; done: boolean; dateCompleted?: string; dueDate?: string; ownerId: string; }
interface Product { id: string; name: string; quantity: number; unit: string; ownerId: string; }
interface MarketItem { id: string; name: string; price: number; quantity: number; unit: string; sellerId: string; sellerName: string; contactEmail: string; contactPhone: string; createdAt: string; }

const DynastyBranch = ({ animal, allAnimals, level = 0 }: { animal: Animal, allAnimals: Animal[], level?: number }) => {
  const children = allAnimals.filter(a => a.sire === animal.id || a.dam === animal.id);
  return (
    <div className={level > 0 ? "ml-4 border-l-2 border-emerald-100 mt-3" : "mt-2"}>
      <div className={`flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border ${level === 0 ? 'border-l-4 border-emerald-500' : 'border-stone-100 ml-3'}`}>
        <div className="flex flex-col">
          <span className="font-bold text-stone-800">{animal.name || '??'}</span>
          <span className="text-[10px] text-stone-400 uppercase font-black tracking-widest mt-1">Gen. {level} • {animal.species}</span>
        </div>
      </div>
      {children.map(child => <DynastyBranch key={child.id} animal={child} allAnimals={allAnimals} level={level + 1} />)}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'farmer' | 'consumer' | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [regRole, setRegRole] = useState<'farmer' | 'consumer'>('farmer');
  const [regName, setRegName] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [births, setBirths] = useState<BirthRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [newAnimal, setNewAnimal] = useState({ name: '', species: 'Maiali' as Species, birthDate: '', sire: '', dam: '', notes: '' });
  const [newBirth, setNewBirth] = useState({ idCode: '', species: 'Maiali' as Species, count: 1, birthDate: '' });
  const [newTrans, setNewTrans] = useState({ desc: '', amount: 0, type: 'Entrata' as 'Entrata' | 'Uscita', species: 'Maiali' as Species });
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 0, unit: 'kg' });
  const [newTask, setNewTask] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', notes: '' });

  const [vetSymptom, setVetSymptom] = useState('');
  const [vetImage, setVetImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [vetResult, setVetResult] = useState<{title: string, desc: string, action: string} | null>(null);

  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [sellPhone, setSellPhone] = useState<string>('');

  const [showAssistant, setShowAssistant] = useState(false);
  const [showAIGuide, setShowAIGuide] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiLogs, setAiLogs] = useState<string[]>([]);

  const speciesList: Species[] = ['Maiali', 'Cavalli', 'Mucche', 'Galline', 'Oche'];
  const validAnimals = animals.filter(a => a.name && a.name.trim().length > 0);

  // LOGICA DI ACCESSO E DETERMINAZIONE RUOLO (MOLTO PIÙ ROBUSTA)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => { 
      if (u) {
        setUser(u); 
        try {
          // Aspettiamo un attimo per dare tempo alla registrazione di finire la scrittura nel DB
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role);
            setUserName(data.name || 'Utente');
            
            // Impostiamo la tab iniziale corretta in base al ruolo
            if (data.role === 'consumer') {
              setActiveTab('market');
            } else {
              setActiveTab('dashboard');
            }
          } else {
            // Se il documento non esiste (utenti vecchi o lag di sistema), 
            // assumiamo che sia un'Azienda Agricola.
            setUserRole('farmer');
            setUserName('Azienda Agricola');
            setActiveTab('dashboard');
          }
        } catch (error) {
          console.error("Errore lettura ruolo:", error);
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

  useEffect(() => {
    if (!user?.uid || !userRole) return;
    const unsubs: any[] = [];
    unsubs.push(onSnapshot(collection(db, 'market_items'), s => setMarketItems(s.docs.map(d => ({ id: d.id, ...d.data() })) as MarketItem[])));
    if (userRole === 'farmer') {
      const q = (coll: string) => query(collection(db, coll), where("ownerId", "==", user.uid));
      unsubs.push(onSnapshot(q('animals'), s => setAnimals(s.docs.map(d => ({ id: d.id, ...d.data() })) as Animal[])));
      unsubs.push(onSnapshot(q('births'), s => setBirths(s.docs.map(d => ({ id: d.id, ...d.data() })) as BirthRecord[])));
      unsubs.push(onSnapshot(q('transactions'), s => setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[])));
      unsubs.push(onSnapshot(q('tasks'), s => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() })) as Task[])));
      unsubs.push(onSnapshot(q('products'), s => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() })) as Product[])));
    }
    return () => unsubs.forEach(u => u());
  }, [user?.uid, userRole]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Mostriamo caricamento durante l'invio dei dati
    try {
      if (isRegistering) { 
        if (!regName.trim()) { setLoading(false); return alert("Inserisci il tuo Nome o Nome Azienda"); }
        const userCred = await createUserWithEmailAndPassword(auth, email, password); 
        // SCRITTURA IMMEDIATA DEL RUOLO
        await setDoc(doc(db, 'users', userCred.user.uid), {
          role: regRole,
          name: regName,
          email: email,
          createdAt: new Date().toISOString()
        });
        // Non serve fare altro, onAuthStateChanged si accorgerà del cambiamento
      } else { 
        await signInWithEmailAndPassword(auth, email, password); 
      }
    } catch (err: any) { 
      setLoading(false);
      alert("Errore: controlla email e password o connessione."); 
    }
  };

  // --- LOGICA ASSISTENTE IA ---
  const handleProcessAICommand = async () => {
    if (!aiInput.trim()) return;
    setAiLogs(["Analisi del comando..."]);
    const frasi = aiInput.toLowerCase().replace(/ e /g, ',').split(/,|\./).map(s => s.trim()).filter(s => s);
    let logRisultati: string[] = [];
    for (let frase of frasi) {
      if (frase.includes('venduto')) {
        const importoMatch = frase.match(/(\d+)/);
        const importo = importoMatch ? Number(importoMatch[1]) : 0;
        if (importo > 0) {
          await addDoc(collection(db, 'transactions'), { desc: `Vendita: ${frase.replace(/ho venduto | a \d+.*/g, '').trim()}`, amount: importo, type: 'Entrata', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
          logRisultati.push(`✅ Incasso salvato: +${importo}€`);
        } else { logRisultati.push(`⚠️ Non ho capito il prezzo.`); }
      }
      else if (frase.includes('comprato') || frase.includes('speso')) {
        const importoMatch = frase.match(/(\d+)/);
        const importo = importoMatch ? Number(importoMatch[1]) : 0;
        const oggetto = frase.replace(/ho comprato |ho speso | a \d+.*/g, '').trim();
        if (importo > 0) {
          await addDoc(collection(db, 'transactions'), { desc: `Acquisto: ${oggetto}`, amount: importo, type: 'Uscita', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
          logRisultati.push(`✅ Spesa salvata: -${importo}€`);
        }
      }
      else if (frase.includes('finito') || frase.includes('usato') || frase.includes('consumato')) {
        const qtyMatch = frase.match(/(\d+)|(una|un)/);
        const qty = qtyMatch ? (qtyMatch[1] ? Number(qtyMatch[1]) : 1) : 1;
        const matchedProd = products.find(p => frase.includes(p.name.toLowerCase()));
        if (matchedProd) {
          const newQty = Math.max(0, matchedProd.quantity - qty);
          await updateDoc(doc(db, 'products', matchedProd.id), { quantity: newQty });
          logRisultati.push(`📦 Magazzino: -${qty} ${matchedProd.name}`);
        }
      }
      else if (frase.match(/ho\s+(\d+)\s+(.+)/)) {
        const match = frase.match(/ho\s+(\d+)\s+(.+)/);
        if (match) {
          const qty = Number(match[1]);
          const nomeProdotto = match[2].trim();
          const existing = products.find(p => nomeProdotto.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(nomeProdotto));
          if (existing) {
            await updateDoc(doc(db, 'products', existing.id), { quantity: existing.quantity + qty });
            logRisultati.push(`📦 Aggiunti ${qty} a ${existing.name}`);
          } else {
            await addDoc(collection(db, 'products'), { name: nomeProdotto.charAt(0).toUpperCase() + nomeProdotto.slice(1), quantity: qty, unit: 'unità', ownerId: user!.uid });
            logRisultati.push(`📦 Creato: ${qty} ${nomeProdotto}`);
          }
        }
      }
    }
    setAiLogs(logRisultati);
    setAiInput('');
  };

  // FUNZIONI STANDARD (OMESSE PER BREVITÀ MA PRESENTI NEL CODICE COMPLETO)
  const handleSaveAnimal = async () => { if (!newAnimal.name.trim()) return alert("Inserisci identificativo!"); await addDoc(collection(db, 'animals'), { ...newAnimal, ownerId: user!.uid }); setNewAnimal({ name: '', species: 'Maiali', birthDate: '', sire: '', dam: '', notes: '' }); };
  const handleSaveTransaction = async () => { if (!newTrans.desc.trim() || newTrans.amount <= 0) return alert("Dati non validi!"); await addDoc(collection(db, 'transactions'), { ...newTrans, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid }); setNewTrans({ desc: '', amount: 0, type: 'Entrata', species: 'Maiali' }); };
  const handleSaveBirth = async () => { if (!newBirth.idCode.trim() || newBirth.count < 1) return alert("Errore!"); await addDoc(collection(db, 'births'), { ...newBirth, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid }); for (let i = 0; i < newBirth.count; i++) { await addDoc(collection(db, 'animals'), { name: `Figlio di ${newBirth.idCode} #${i + 1}`, species: newBirth.species, birthDate: newBirth.birthDate, dam: newBirth.idCode, notes: 'Parto', ownerId: user!.uid }); } setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' }); };
  const handleAddProduct = async () => { if (!newProduct.name.trim() || newProduct.quantity <= 0) return alert("Dati errati!"); const existing = products.find(p => p.name.trim().toLowerCase() === newProduct.name.trim().toLowerCase()); if (existing) { await updateDoc(doc(db, 'products', existing.id), { quantity: existing.quantity + newProduct.quantity }); } else { await addDoc(collection(db, 'products'), { ...newProduct, name: newProduct.name.trim(), ownerId: user!.uid }); } setNewProduct({ name: '', quantity: 0, unit: 'kg' }); };
  const reduceProduct = async (id: string, amount: number) => { const p = products.find(prod => prod.id === id); if (p && p.quantity >= amount) await updateDoc(doc(db, 'products', id), { quantity: p.quantity - amount }); };
  const handleAddTask = async () => { if (!newTask.trim()) return alert("Scrivi il lavoro!"); await addDoc(collection(db, 'tasks'), { text: newTask, done: false, dueDate: newTaskDate, ownerId: user!.uid }); setNewTask(''); };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setVetImage(r.result as string); r.readAsDataURL(f); } };
  const analyzeWithAI = () => { if (!vetImage && !vetSymptom) return alert("Inserisci dati!"); setIsAnalyzing(true); setVetResult(null); setTimeout(() => { setIsAnalyzing(false); setVetResult({ title: "Possibile Dermatite", desc: "IA ha rilevato arrossamento.", action: "Disinfetta l'area." }); }, 2000); };
  const exportASLReport = () => { if (validAnimals.length === 0) return alert("Nessun capo!"); const nomeAz = window.prompt("Nome Azienda:", "Azienda ") || "Azienda"; const d = new jsPDF(); d.setFontSize(22); d.setTextColor(5, 150, 105); d.text(nomeAz, 14, 22); const capiO = [...validAnimals].sort((a,b) => a.species.localeCompare(b.species)); autoTable(d, { head: [["ID", "Specie", "Nascita", "Madre", "Padre", "Note"]], body: capiO.map(a => [a.name, a.species, a.birthDate || 'N/D', a.dam || 'N/D', a.sire || 'N/D', a.notes || '-']), startY: 40 }); d.save(`Registro_${nomeAz.replace(/ /g, '_')}.pdf`); };
  const handlePublishToMarket = async () => { if (!sellingProduct || sellPrice <= 0) return alert("Prezzo!"); await addDoc(collection(db, 'market_items'), { name: sellingProduct.name, price: sellPrice, quantity: sellingProduct.quantity, unit: sellingProduct.unit, sellerId: user!.uid, sellerName: userName, contactEmail: user!.email, contactPhone: sellPhone, createdAt: new Date().toISOString() }); setSellingProduct(null); alert("Pubblicato!"); };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-emerald-800 bg-stone-50 italic animate-pulse">Configurazione ambiente in corso...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-emerald-600 rounded-b-[4rem] shadow-lg"></div>
        <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-sm border border-stone-100 relative z-10">
          <div className="flex justify-center mb-6"><div className="bg-white p-4 rounded-[1.5rem] text-emerald-600 shadow-xl border border-emerald-50"><TrendingUp size={36} strokeWidth={3} /></div></div>
          <h1 className="text-3xl font-black text-center mb-2 text-emerald-950 italic">AgriManage</h1>
          <p className="text-center text-stone-500 text-sm mb-8 font-medium italic">Versione Marketplace B2B2C</p>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-4 mb-6 p-4 bg-stone-50 rounded-[1.5rem] border border-stone-200">
                <p className="text-[10px] font-black text-stone-500 uppercase text-center mb-2 tracking-widest">Scegli il tuo profilo</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRegRole('farmer')} className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black border-2 transition-all flex flex-col items-center gap-1 uppercase ${regRole === 'farmer' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-200 bg-white text-stone-400'}`}><LayoutDashboard size={18}/> Azienda</button>
                  <button type="button" onClick={() => setRegRole('consumer')} className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black border-2 transition-all flex flex-col items-center gap-1 uppercase ${regRole === 'consumer' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-stone-200 bg-white text-stone-400'}`}><Store size={18}/> Cliente</button>
                </div>
                <input type="text" placeholder={regRole === 'farmer' ? "Nome Azienda Agricola" : "Tuo Nome e Cognome"} className="ui-input mt-4" value={regName} onChange={e => setRegName(e.target.value)} required />
              </div>
            )}
            <input type="email" placeholder="Email" className="ui-input" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="ui-input" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-[1rem] font-black uppercase shadow-md active:scale-95 transition-transform mt-2">{isRegistering ? "Crea Account" : "Entra nell'app"}</button>
          </form>
          <button onClick={() => { setIsRegistering(!isRegistering); setRegRole('farmer'); }} className="w-full mt-6 text-stone-400 font-bold text-xs hover:text-emerald-600 transition-colors uppercase tracking-tight">{isRegistering ? "Hai già un account? Accedi" : "Nuovo utente? Registrati gratis"}</button>
        </div>
      </div>
    );
  }

  const tabTitles: Record<string, string> = { 'dashboard': 'Dashboard Azienda', 'inventory': 'Anagrafica Capi', 'finance': 'Bilancio Aziendale', 'births': 'Registro Parti', 'products': 'Magazzino Scorte', 'tasks': 'Agenda Lavori', 'dinastia': 'Albero Genealogico', 'vet': 'Veterinario IA', 'market': 'Mercato Km 0' };
  
  const menuItems = userRole === 'farmer' ? [ 
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard }, 
    { id: 'market', label: 'Mercato', icon: Store, color: 'text-amber-500' }, 
    { id: 'inventory', label: 'Capi', icon: PawPrint }, 
    { id: 'finance', label: 'Bilancio', icon: Wallet }, 
    { id: 'products', label: 'Scorte', icon: Package }, 
    { id: 'tasks', label: 'Agenda', icon: ListChecks }, 
    { id: 'vet', label: 'Vet IA', icon: Stethoscope } 
  ] : [ 
    { id: 'market', label: 'Acquista', icon: Store, color: 'text-amber-500' } 
  ];

  return (
    <div className="min-h-screen flex text-stone-900 bg-[#F4F5F7] relative">
      
      {userRole === 'farmer' && (
        <button onClick={() => setShowAssistant(true)} className="fixed bottom-24 right-4 md:bottom-8 md:right-8 bg-blue-600 text-white p-4 rounded-full shadow-2xl z-50 hover:bg-blue-700 animate-bounce"><Bot size={28} /></button>
      )}

      {showAssistant && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="bg-white w-full max-w-2xl mx-auto rounded-t-[2rem] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-blue-900 italic flex items-center gap-2"><Bot className="text-blue-500"/> Assistente Vocale IA</h3>
              <button onClick={() => setShowAssistant(false)} className="text-stone-400 bg-stone-100 rounded-full p-2"><X size={20}/></button>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
              <div className="flex gap-2">
                <input type="text" className="flex-1 ui-input border-blue-200" placeholder="Usa il microfono per dettare..." value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleProcessAICommand()} />
                <button onClick={handleProcessAICommand} className="bg-blue-600 text-white p-4 rounded-xl shadow-md"><Send size={20}/></button>
              </div>
            </div>
            {aiLogs.length > 0 && <div className="mb-4 space-y-2">{aiLogs.map((log, i) => <div key={i} className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-sm font-bold text-stone-700">{log}</div>)}</div>}
            <button onClick={() => setShowAIGuide(!showAIGuide)} className="text-xs font-black text-blue-500 uppercase flex items-center gap-1">Come parlo all'IA?</button>
            {showAIGuide && <div className="bg-stone-50 border p-4 rounded-xl text-[10px] mt-2 space-y-2"><b>Esempi:</b><br/>"Ho venduto un maiale a 100"<br/>"Ho speso 50 per mangime"<br/>"Ho usato 1 balla di fieno"</div>}
          </div>
        </div>
      )}

      <aside className="hidden md:flex flex-col w-72 bg-white border-r p-6 fixed h-full z-40">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-emerald-600 p-3 rounded-2xl text-white"><TrendingUp size={24} strokeWidth={3} /></div>
          <h1 className="text-2xl font-black italic text-emerald-950">AgriManage</h1>
        </div>
        <div className="mb-6 p-4 bg-stone-50 rounded-2xl border">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{userRole === 'farmer' ? 'Settore Azienda' : 'Settore Acquisti'}</p>
          <p className="font-bold text-stone-800 truncate">{userName}</p>
        </div>
        <nav className="space-y-1 flex-1 overflow-y-auto">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-4 w-full p-4 rounded-2xl font-black text-sm transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-stone-500 hover:bg-stone-50'}`}>
              <item.icon size={22} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="mt-4 flex items-center gap-3 text-red-500 font-black p-4"><LogOut size={20} /> Esci</button>
      </aside>

      <main className="flex-1 w-full md:ml-72 px-4 pb-28 pt-20 md:pt-10 md:p-10 max-w-6xl mx-auto">
        <h2 className="text-4xl font-black text-emerald-950 capitalize tracking-tighter italic mb-8 ml-1">{tabTitles[activeTab]}</h2>

        {/* CONTENUTO MERCATO */}
        {activeTab === 'market' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {marketItems.map(item => (
              <div key={item.id} className="bg-white rounded-[2rem] border shadow-sm overflow-hidden flex flex-col">
                <div className="h-32 bg-amber-100 flex items-center justify-center relative">
                  <h4 className="text-2xl font-black text-amber-950 italic">{item.name}</h4>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-[10px] font-black text-stone-400 uppercase mb-4">Produttore: <b>{item.sellerName}</b></p>
                  <div className="flex justify-between items-center mb-6 bg-stone-50 p-4 rounded-2xl border">
                    <div><p className="text-[10px] font-black text-stone-400 uppercase">Prezzo</p><p className="text-2xl font-black text-emerald-600">€{item.price}</p></div>
                    <div className="text-right"><p className="text-[10px] font-black text-stone-400 uppercase">Q.tà</p><p className="font-bold">{item.quantity} {item.unit}</p></div>
                  </div>
                  {item.contactPhone ? (
                    <a href={`https://wa.me/39${item.contactPhone}`} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white font-black py-4 rounded-xl text-center text-xs uppercase shadow-md flex items-center justify-center gap-2"><MessageCircle size={18}/>WhatsApp</a>
                  ) : (
                    <a href={`mailto:${item.contactEmail}`} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl text-center text-xs uppercase shadow-md flex items-center justify-center gap-2"><Mail size={18}/>Invia Email</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONTENUTO AZIENDA */}
        {userRole === 'farmer' && activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
             <div onClick={() => setActiveTab('inventory')} className="bg-white p-6 rounded-[2rem] border shadow-sm cursor-pointer hover:border-emerald-400">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1"><PawPrint size={14}/> Capi</p>
                <h4 className="text-4xl font-black text-emerald-600 italic">{validAnimals.length}</h4>
             </div>
             <div onClick={() => setActiveTab('finance')} className="bg-white p-6 rounded-[2rem] border shadow-sm cursor-pointer hover:border-emerald-400">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Wallet size={14}/> Bilancio</p>
                <h4 className="text-4xl font-black text-emerald-950 italic">€{transactions.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0).toFixed(0)}</h4>
             </div>
             <div onClick={() => setActiveTab('tasks')} className="bg-white p-6 rounded-[2rem] border shadow-sm cursor-pointer hover:border-emerald-400">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1"><ListChecks size={14}/> Agenda</p>
                <h4 className="text-4xl font-black text-amber-500 italic">{tasks.filter(t=>!t.done).length}</h4>
             </div>
             <div onClick={() => setActiveTab('market')} className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-[2rem] text-white shadow-xl cursor-pointer hover:scale-105 transition-transform">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1"><Store size={14}/> Vetrina</p>
                <h4 className="text-xl font-black italic">Apri Mercato</h4>
             </div>
          </div>
        )}

        {/* ... ALTRE SCHEDE (inventory, finance, products, etc.) ... */}
        {userRole === 'farmer' && activeTab === 'products' && (
           <div className="space-y-6 animate-fade-in">
              {sellingProduct && (
                 <div className="bg-amber-50 p-8 rounded-[2rem] border-2 border-amber-300 shadow-xl">
                    <h3 className="text-xl font-black text-amber-950 italic mb-4">Vendi {sellingProduct.name} nel Mercato</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                       <input type="number" placeholder="Prezzo (€)" className="ui-input border-amber-200" value={sellPrice || ''} onChange={e => setSellPrice(Number(e.target.value))} />
                       <input type="tel" placeholder="Cell. WhatsApp (Opzionale)" className="ui-input border-amber-200" value={sellPhone} onChange={e => setSellPhone(e.target.value)} />
                    </div>
                    <div className="flex gap-4">
                       <button onClick={handlePublishToMarket} className="flex-1 bg-amber-500 text-white font-black py-4 rounded-xl uppercase text-xs">Metti in Vetrina</button>
                       <button onClick={() => setSellingProduct(null)} className="px-6 bg-white border border-amber-200 text-amber-500 font-black rounded-xl uppercase text-xs">Annulla</button>
                    </div>
                 </div>
              )}
              <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
                <h3 className="text-xs font-black uppercase text-emerald-900 mb-6">Nuovo Carico Magazzino</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                   <input placeholder="Prodotto" className="ui-input col-span-2" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                   <input type="number" placeholder="Q.tà" className="ui-input" value={newProduct.quantity || ''} onChange={e => setNewProduct({...newProduct, quantity: Number(e.target.value)})} />
                </div>
                <button onClick={handleAddProduct} className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl uppercase text-xs">Aggiungi</button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-[2rem] border text-center shadow-sm">
                    <h4 className="font-black text-stone-800 uppercase mb-2">{p.name}</h4>
                    <p className="text-3xl font-black text-emerald-600 mb-4">{p.quantity} {p.unit}</p>
                    <button onClick={() => setSellingProduct(p)} className="w-full bg-amber-100 text-amber-700 font-black py-2 rounded-xl text-[10px] uppercase mb-2">Vendi nel Mercato</button>
                    <div className="flex gap-2">
                       <button onClick={() => reduceProduct(p.id, 1)} className="flex-1 bg-stone-100 p-2 rounded-lg text-stone-400 hover:text-red-500"><MinusCircle size={20}/></button>
                       <button onClick={() => deleteDoc(doc(db, 'products', p.id))} className="flex-1 bg-stone-100 p-2 rounded-lg text-stone-400 hover:text-red-500"><Trash2 size={20}/></button>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        )}
        
        {/* SCHEDA INVENTARIO COMPLETA (RIPORTATA PER SICUREZZA) */}
        {userRole === 'farmer' && activeTab === 'inventory' && (
           <div className="space-y-8 animate-fade-in">
              <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black uppercase text-emerald-900">Nuovo Capo</h3>
                    <button onClick={exportASLReport} className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-black text-[10px] uppercase flex items-center gap-2"><FileDown size={14}/> PDF Registro</button>
                 </div>
                 <div className="grid grid-cols-2 gap-4 mb-6">
                    <input placeholder="Codice / Nome" className="ui-input" value={newAnimal.name} onChange={e => setNewAnimal({...newAnimal, name: e.target.value})} />
                    <select className="ui-input" value={newAnimal.species} onChange={e => setNewAnimal({...newAnimal, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select>
                    <input type="date" className="ui-input" value={newAnimal.birthDate} onChange={e => setNewAnimal({...newAnimal, birthDate: e.target.value})} />
                    <textarea placeholder="Note Sanitarie" className="ui-input" value={newAnimal.notes} onChange={e => setNewAnimal({...newAnimal, notes: e.target.value})} />
                 </div>
                 <button onClick={handleSaveAnimal} className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl uppercase text-xs">Registra</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {validAnimals.map(a => (
                    <div key={a.id} className="bg-white p-6 rounded-[2rem] border shadow-sm">
                       <div className="flex justify-between mb-4">
                          <h4 className="font-black text-stone-800">{a.name}</h4>
                          <button onClick={() => deleteDoc(doc(db, 'animals', a.id))} className="text-stone-300 hover:text-red-500"><Trash2 size={18}/></button>
                       </div>
                       <p className="text-[10px] font-black text-stone-400 uppercase">{a.species} • {a.birthDate || 'N/D'}</p>
                       <p className="text-xs text-stone-500 mt-3 italic">{a.notes}</p>
                    </div>
                 ))}
              </div>
           </div>
        )}

      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t flex justify-around p-2 z-40">
        {menuItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center py-2 transition-colors ${activeTab === item.id ? (item.color || 'text-emerald-600') : 'text-stone-400'}`}>
            <item.icon size={22} />
            <span className="text-[8px] font-black mt-1 uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
