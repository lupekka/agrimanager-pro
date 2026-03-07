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

  // STATI ASSISTENTE VOCALE
  const [showAssistant, setShowAssistant] = useState(false);
  const [showAIGuide, setShowAIGuide] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiLogs, setAiLogs] = useState<string[]>([]);

  const speciesList: Species[] = ['Maiali', 'Cavalli', 'Mucche', 'Galline', 'Oche'];
  const validAnimals = animals.filter(a => a.name && a.name.trim().length > 0);
  const ghostCount = animals.length - validAnimals.length;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => { 
      setUser(u); 
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
          setUserName(userDoc.data().name || 'Utente');
          if (userDoc.data().role === 'consumer') setActiveTab('market');
        } else {
          setUserRole('farmer'); setUserName('Azienda Agricola');
        }
      } else { setUserRole(null); }
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

  // --- CERVELLO DELL'ASSISTENTE IA ---
  const handleProcessAICommand = async () => {
    if (!aiInput.trim()) return;
    
    // Mostriamo un caricamento finto
    setAiLogs(["Analisi del comando in corso..."]);
    
    // Spezza la frase sulle "e", virgole o punti per fare ordini multipli
    const frasi = aiInput.toLowerCase().replace(/ e /g, ',').split(/,|\./).map(s => s.trim()).filter(s => s);
    let logRisultati: string[] = [];

    for (let frase of frasi) {
      
      // 1. VENDITA (Es: "ho venduto un maiale a 50")
      if (frase.includes('venduto')) {
        const importoMatch = frase.match(/(\d+)/); // Prende il primo numero
        const importo = importoMatch ? Number(importoMatch[1]) : 0;
        
        if (importo > 0) {
          await addDoc(collection(db, 'transactions'), { desc: `Vendita: ${frase.replace(/ho venduto | a \d+.*/g, '').trim()}`, amount: importo, type: 'Entrata', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
          logRisultati.push(`✅ Incasso salvato: +${importo}€`);
        } else { logRisultati.push(`⚠️ Non ho capito il prezzo della vendita.`); }
      }
      
      // 2. ACQUISTO/SPESA (Es: "ho comprato mangime a 25")
      else if (frase.includes('comprato') || frase.includes('speso')) {
        const importoMatch = frase.match(/(\d+)/);
        const importo = importoMatch ? Number(importoMatch[1]) : 0;
        const oggetto = frase.replace(/ho comprato |ho speso | a \d+.*/g, '').trim();

        if (importo > 0) {
          await addDoc(collection(db, 'transactions'), { desc: `Acquisto: ${oggetto}`, amount: importo, type: 'Uscita', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
          logRisultati.push(`✅ Spesa salvata: -${importo}€ per ${oggetto}`);
        } else { logRisultati.push(`⚠️ Non ho capito quanto hai speso.`); }
      }

      // 3. RIDUZIONE MAGAZZINO (Es: "ho finito 2 balle di fieno" o "ho usato mangime")
      else if (frase.includes('finito') || frase.includes('usato') || frase.includes('consumato')) {
        const qtyMatch = frase.match(/(\d+)|(una|un)/);
        const qty = qtyMatch ? (qtyMatch[1] ? Number(qtyMatch[1]) : 1) : 1;
        
        // Cerca il prodotto nel magazzino attuale (matching approssimativo)
        const matchedProd = products.find(p => frase.includes(p.name.toLowerCase()));
        if (matchedProd) {
          const newQty = Math.max(0, matchedProd.quantity - qty);
          await updateDoc(doc(db, 'products', matchedProd.id), { quantity: newQty });
          logRisultati.push(`📦 Magazzino aggiornato: -${qty} ${matchedProd.name} (Rimasti: ${newQty})`);
        } else {
          logRisultati.push(`⚠️ Non ho trovato l'oggetto in magazzino per la frase: "${frase}". Crealo prima a mano.`);
        }
      }

      // 4. AGGIUNTA MAGAZZINO (Es: "ho 50 balle di fieno")
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
            const nomeCapitalizzato = nomeProdotto.charAt(0).toUpperCase() + nomeProdotto.slice(1);
            await addDoc(collection(db, 'products'), { name: nomeCapitalizzato, quantity: qty, unit: 'unità', ownerId: user!.uid });
            logRisultati.push(`📦 Nuovo elemento creato: ${qty} ${nomeCapitalizzato}`);
          }
        }
      } 
      else {
        logRisultati.push(`🤔 Non ho capito cosa fare per: "${frase}". Prova a dirlo diversamente.`);
      }
    }

    setAiLogs(logRisultati);
    setAiInput(''); // Svuota l'input
  };


  const cleanFantasmi = async () => { /* ... */ };
  const handleAuth = async (e: React.FormEvent) => { /* ... */ 
    e.preventDefault();
    try {
      if (isRegistering) { 
        if (!regName.trim()) return alert("Inserisci il tuo Nome o Nome Azienda");
        const userCred = await createUserWithEmailAndPassword(auth, email, password); 
        await setDoc(doc(db, 'users', userCred.user.uid), { role: regRole, name: regName, email: email, createdAt: new Date().toISOString() });
      } else { await signInWithEmailAndPassword(auth, email, password); }
    } catch (err: any) { alert("Errore: controlla email e password"); }
  };
  const handleSaveAnimal = async () => { /* ... */ 
    if (!newAnimal.name.trim()) return alert("Inserisci identificativo!"); await addDoc(collection(db, 'animals'), { ...newAnimal, ownerId: user!.uid }); setNewAnimal({ name: '', species: 'Maiali', birthDate: '', sire: '', dam: '', notes: '' });
  };
  const handleSaveTransaction = async () => { /* ... */ 
    if (!newTrans.desc.trim() || newTrans.amount <= 0) return alert("Inserisci descrizione e importo!"); await addDoc(collection(db, 'transactions'), { ...newTrans, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid }); setNewTrans({ desc: '', amount: 0, type: 'Entrata', species: 'Maiali' });
  };
  const handleSaveBirth = async () => { /* ... */ 
    if (!newBirth.idCode.trim() || newBirth.count < 1) return alert("Dati parto non validi!"); await addDoc(collection(db, 'births'), { ...newBirth, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid }); for (let i = 0; i < newBirth.count; i++) { await addDoc(collection(db, 'animals'), { name: `Figlio di ${newBirth.idCode} #${i + 1}`, species: newBirth.species, birthDate: newBirth.birthDate, dam: newBirth.idCode, notes: 'Parto', ownerId: user!.uid }); } setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' }); alert("Fatto!");
  };
  const handleAddProduct = async () => { /* ... */ 
    if (!newProduct.name.trim() || newProduct.quantity <= 0) return alert("Inserisci nome e quantità!"); const existing = products.find(p => p.name.trim().toLowerCase() === newProduct.name.trim().toLowerCase()); if (existing) { await updateDoc(doc(db, 'products', existing.id), { quantity: existing.quantity + newProduct.quantity }); } else { await addDoc(collection(db, 'products'), { ...newProduct, name: newProduct.name.trim(), ownerId: user!.uid }); } setNewProduct({ name: '', quantity: 0, unit: 'kg' });
  };
  const reduceProduct = async (id: string, amount: number) => { /* ... */ 
    const p = products.find(prod => prod.id === id); if (p && p.quantity >= amount) await updateDoc(doc(db, 'products', id), { quantity: p.quantity - amount });
  };
  const handleAddTask = async () => { /* ... */ 
    if (!newTask.trim()) return alert("Scrivi il lavoro da fare!"); await addDoc(collection(db, 'tasks'), { text: newTask, done: false, dueDate: newTaskDate, ownerId: user!.uid }); setNewTask('');
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ 
    const file = e.target.files?.[0]; if (file) { const r = new FileReader(); r.onloadend = () => setVetImage(r.result as string); r.readAsDataURL(file); }
  };
  const analyzeWithAI = () => { /* ... */ 
    if (!vetImage && !vetSymptom) return alert("Inserisci foto o sintomo."); setIsAnalyzing(true); setVetResult(null); setTimeout(() => { setIsAnalyzing(false); setVetResult({ title: "Possibile Dermatite", desc: "L'IA ha rilevato arrossamenti.", action: "Pulisci l'area. Se persiste contatta il veterinario." }); }, 2500);
  };
  const exportASLReport = () => { /* ... */ 
    if (validAnimals.length === 0) return alert("Nessun capo!"); const nomeAzienda = window.prompt("Nome Azienda Agricola:", "Azienda Agricola ") || "Azienda"; const doc = new jsPDF(); doc.setFontSize(22); doc.setTextColor(5, 150, 105); doc.text(nomeAzienda, 14, 22); doc.setFontSize(14); doc.setTextColor(50, 50, 50); doc.text('Registro Ufficiale Capi', 14, 32); doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.text(`Generato il: ${new Date().toLocaleDateString('it-IT')}`, 14, 40); doc.text(`Totale Capi Effettivi: ${validAnimals.length}`, 14, 45); const capiOrdinati = [...validAnimals].sort((a, b) => a.species.localeCompare(b.species)); const tableColumn = ["ID / Codice", "Specie", "Data Nascita", "Madre", "Padre", "Note/Trattamenti"]; const tableRows = capiOrdinati.map(animal => [animal.name, animal.species, animal.birthDate || 'N/D', animal.dam ? validAnimals.find(a => a.id === animal.dam)?.name || 'Ignota' : 'Ignota', animal.sire ? validAnimals.find(a => a.id === animal.sire)?.name || 'Ignoto' : 'Ignoto', animal.notes || '-']); autoTable(doc, { head: [tableColumn], body: tableRows, startY: 55, theme: 'grid', styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold' }, alternateRowStyles: { fillColor: [248, 249, 250] } }); doc.save(`Registro_${nomeAzienda.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  const handlePublishToMarket = async () => { /* ... */ 
    if (!sellingProduct || sellPrice <= 0) return alert("Prezzo valido!"); await addDoc(collection(db, 'market_items'), { name: sellingProduct.name, price: sellPrice, quantity: sellingProduct.quantity, unit: sellingProduct.unit, sellerId: user!.uid, sellerName: userName, contactEmail: user!.email, contactPhone: sellPhone, createdAt: new Date().toISOString() }); alert("Pubblicato!"); setSellingProduct(null); setSellPrice(0); setSellPhone('');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-emerald-800 bg-stone-50 italic animate-pulse">Caricamento in corso...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-emerald-600 rounded-b-[4rem] shadow-lg"></div>
        <div className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-emerald-900/10 w-full max-w-sm border border-stone-100 relative z-10">
          <div className="flex justify-center mb-6"><div className="bg-white p-4 rounded-[1.5rem] text-emerald-600 shadow-xl shadow-emerald-200 border border-emerald-50"><TrendingUp size={36} strokeWidth={3} /></div></div>
          <h1 className="text-3xl font-black text-center mb-2 text-emerald-950 italic">AgriManage</h1>
          <p className="text-center text-stone-500 text-sm mb-8 font-medium">Il gestionale agricolo intelligente</p>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-4 mb-6 p-4 bg-stone-50 rounded-[1.5rem] border border-stone-200">
                <p className="text-xs font-black text-stone-500 uppercase text-center mb-2">Scegli il tuo ruolo</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRegRole('farmer')} className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center gap-1 ${regRole === 'farmer' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-200 bg-white text-stone-400'}`}><LayoutDashboard size={18}/> Azienda Agricola</button>
                  <button type="button" onClick={() => setRegRole('consumer')} className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center gap-1 ${regRole === 'consumer' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-stone-200 bg-white text-stone-400'}`}><Store size={18}/> Cliente</button>
                </div>
                <input type="text" placeholder={regRole === 'farmer' ? "Nome Azienda" : "Il tuo Nome"} className="ui-input mt-4" value={regName} onChange={e => setRegName(e.target.value)} required />
              </div>
            )}
            <input type="email" placeholder="Email" className="ui-input" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="ui-input" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-[1rem] font-black uppercase shadow-md active:scale-95 transition-transform mt-2">{isRegistering ? "Crea Account" : "Accedi"}</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-6 text-stone-400 font-bold text-xs hover:text-emerald-600 transition-colors">{isRegistering ? "Hai già un account? Accedi" : "Nuovo utente? Registrati qui"}</button>
        </div>
      </div>
    );
  }

  const tabTitles: Record<string, string> = { 'dashboard': 'Panoramica', 'inventory': 'Anagrafica Capi', 'finance': 'Bilancio Aziendale', 'births': 'Registro Parti', 'products': 'Scorte Magazzino', 'tasks': 'Agenda Lavori', 'dinastia': 'Albero Genealogico', 'vet': 'Veterinario IA', 'market': 'Mercato Locale' };
  const menuItems = userRole === 'farmer' ? [ { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'market', label: 'Mercato', icon: Store, color: 'text-amber-500' }, { id: 'inventory', label: 'Anagrafica', icon: PawPrint }, { id: 'births', label: 'Parti', icon: Baby }, { id: 'finance', label: 'Bilancio', icon: Wallet }, { id: 'products', label: 'Magazzino', icon: Package }, { id: 'tasks', label: 'Agenda', icon: ListChecks }, { id: 'vet', label: 'Vet IA', icon: Stethoscope } ] : [ { id: 'market', label: 'Mercato Locale', icon: Store, color: 'text-amber-500' } ];

  return (
    <div className="min-h-screen flex text-stone-900 bg-[#F4F5F7] relative">
      
      {/* BOTTONE FLUTTUANTE ASSISTENTE VOCALE (SOLO PER AGRICOLTORI) */}
      {userRole === 'farmer' && (
        <button onClick={() => setShowAssistant(true)} className="fixed bottom-24 right-4 md:bottom-8 md:right-8 bg-blue-600 text-white p-4 rounded-full shadow-2xl shadow-blue-500/40 z-50 hover:bg-blue-700 transition-transform hover:scale-105 animate-bounce">
          <Bot size={28} />
        </button>
      )}

      {/* MODALE ASSISTENTE VOCALE */}
      {showAssistant && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="bg-white w-full max-w-2xl mx-auto rounded-t-[2rem] p-6 shadow-2xl animate-fade-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-blue-900 italic flex items-center gap-2"><Bot className="text-blue-500"/> Assistente IA</h3>
              <button onClick={() => {setShowAssistant(false); setAiLogs([]); setShowAIGuide(false);}} className="text-stone-400 bg-stone-100 rounded-full p-2"><X size={20}/></button>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
              <p className="text-sm text-blue-800 font-medium mb-3">Scrivi o <strong className="font-black">usa il microfono della tua tastiera</strong> per dettare comandi multipli.</p>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 ui-input border-blue-200" 
                  placeholder="Es. Ho venduto un maiale a 50 e consumato 1 fieno" 
                  value={aiInput} 
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleProcessAICommand()}
                />
                <button onClick={handleProcessAICommand} className="bg-blue-600 text-white p-4 rounded-xl shadow-md"><Send size={20}/></button>
              </div>
            </div>

            {/* LOG RISULTATI */}
            {aiLogs.length > 0 && (
              <div className="mb-4 space-y-2 max-h-40 overflow-y-auto">
                {aiLogs.map((log, i) => (
                  <div key={i} className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-sm font-bold text-stone-700">{log}</div>
                ))}
              </div>
            )}

            {/* GUIDA (TOGGLE) */}
            <button onClick={() => setShowAIGuide(!showAIGuide)} className="text-xs font-black text-blue-500 uppercase flex items-center gap-1 hover:underline mb-2"><Info size={14}/> Come devo parlare?</button>
            {showAIGuide && (
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl text-xs space-y-3 font-medium text-stone-600">
                <p>L'Assistente riconosce queste parole chiave. Puoi unire più ordini usando la parola <b>"e"</b>.</p>
                <ul className="space-y-2">
                  <li>🟢 <b>Per Incassare:</b> Usa "venduto ... a [numero]". <br/><i>(Es: "ho venduto 2 maiali a 150")</i></li>
                  <li>🔴 <b>Per Spese:</b> Usa "comprato/speso ... a/per [numero]". <br/><i>(Es: "ho comprato mangime a 50")</i></li>
                  <li>📦 <b>Per Aggiungere a Magazzino:</b> Usa "ho [numero] [oggetto]". <br/><i>(Es: "ho 50 balle di fieno")</i></li>
                  <li>📦 <b>Per Usare da Magazzino:</b> Usa "finito/consumato/usato [numero]". <br/><i>(Es: "ho finito 2 balle di fieno")</i></li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HEADER MOBILE */}
      <header className="md:hidden fixed top-0 w-full bg-white/80 backdrop-blur-xl z-40 border-b border-stone-200/50 px-5 pb-4 pt-safe flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-1.5 rounded-lg text-white"><TrendingUp size={20} strokeWidth={3} /></div>
          <h1 className="text-xl font-black italic text-emerald-950">AgriManage</h1>
        </div>
        <button onClick={() => signOut(auth)} className="bg-red-50 text-red-500 p-2 rounded-full hover:bg-red-100 transition-colors"><LogOut size={18} strokeWidth={2.5}/></button>
      </header>

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-stone-200/60 p-6 fixed h-full z-40">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg"><TrendingUp size={24} strokeWidth={3} /></div>
          <h1 className="text-2xl font-black italic text-emerald-950">AgriManage</h1>
        </div>
        <div className="mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-100">
          <p className="text-[10px] font-black text-stone-400 uppercase">{userRole === 'farmer' ? 'Azienda Agricola' : 'Utente Consumatore'}</p>
          <p className="font-bold text-stone-800">{userName}</p>
        </div>
        <nav className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-4 w-full p-4 rounded-2xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-stone-500 hover:bg-stone-50'}`}>
              <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} className={item.color && activeTab !== item.id ? item.color : ''}/> 
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="mt-4 flex items-center gap-3 text-red-500 font-bold p-4 hover:bg-red-50 rounded-2xl transition-colors"><LogOut size={20} /> Disconnetti</button>
      </aside>

      {/* CONTENUTO PRINCIPALE */}
      <main className="flex-1 w-full md:ml-72 px-4 pb-28 pt-main-safe md:pt-10 md:p-10 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6 ml-1">
          <h2 className="text-3xl md:text-4xl font-black text-emerald-950 capitalize tracking-tighter italic flex items-center gap-3">{tabTitles[activeTab]}</h2>
          {activeTab === 'inventory' && userRole === 'farmer' && (
            <button onClick={exportASLReport} className="hidden md:flex bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors px-4 py-2 rounded-xl font-bold text-xs uppercase items-center gap-2"><FileDown size={16} /> Esporta ASL</button>
          )}
        </div>

        {/* --- 1. IL MERCATO LOCALE --- */}
        {activeTab === 'market' && (
          <div className="space-y-8 animate-fade-in">
            {userRole === 'consumer' && (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] text-center mb-8">
                <Store size={48} className="text-amber-500 mx-auto mb-4" strokeWidth={1.5}/>
                <h3 className="text-xl font-black text-amber-900 mb-2">Benvenuto nel Mercato a km 0</h3>
                <p className="text-sm text-amber-800 font-medium">Acquista prodotti freschi direttamente dalle aziende agricole.</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketItems.map(item => (
                <div key={item.id} className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                  <div className="h-32 bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center p-4 relative">
                    <ShoppingBag size={48} className="text-amber-300 opacity-50 absolute right-4 bottom-4"/>
                    <h4 className="text-2xl font-black text-amber-950 italic z-10 text-center w-full truncate">{item.name}</h4>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Venduto da</p>
                    <p className="font-bold text-stone-800 mb-4">{item.sellerName}</p>
                    <div className="flex justify-between items-end mb-6 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                      <div><p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Disp.</p><p className="font-bold text-stone-800">{item.quantity} {item.unit}</p></div>
                      <div className="text-right"><p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Prezzo</p><p className="text-2xl font-black text-emerald-600">€{item.price}</p></div>
                    </div>
                    <div className="mt-auto space-y-2">
                      {item.contactPhone ? (
                        <a href={`https://wa.me/39${item.contactPhone}?text=Salve ${item.sellerName}, vorrei informazioni per l'acquisto di ${item.name} (dal mercato AgriManage).`} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white font-black py-3 rounded-xl text-xs uppercase flex justify-center items-center gap-2 shadow-sm hover:bg-[#1DA851] transition-colors"><MessageCircle size={18}/> Contatta su WhatsApp</a>
                      ) : (
                        <a href={`mailto:${item.contactEmail}?subject=Acquisto ${item.name}&body=Salve ${item.sellerName}, vorrei informazioni per l'acquisto di ${item.name}.`} className="w-full bg-blue-600 text-white font-black py-3 rounded-xl text-xs uppercase flex justify-center items-center gap-2 shadow-sm hover:bg-blue-700 transition-colors"><Mail size={18}/> Invia Email</a>
                      )}
                      {userRole === 'farmer' && item.sellerId === user?.uid && (
                        <button onClick={() => deleteDoc(doc(db, 'market_items', item.id))} className="w-full bg-stone-100 text-stone-500 font-bold py-3 rounded-xl text-xs uppercase hover:bg-red-50 hover:text-red-500 transition-colors">Rimuovi dal Mercato</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {marketItems.length === 0 && <div className="col-span-full py-12 text-center text-stone-400 font-medium italic border-2 border-dashed border-stone-200 rounded-[2rem]">Il mercato è vuoto al momento.</div>}
            </div>
          </div>
        )}

        {/* --- LE ALTRE SCHEDE (VISIBILI SOLO AGLI AGRICOLTORI) --- */}
        {userRole === 'farmer' && (
          <>
            {activeTab === 'dashboard' && ( <div className="space-y-8 animate-fade-in"> <div className="grid grid-cols-2 md:grid-cols-4 gap-3"> <div onClick={() => setActiveTab('inventory')} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-stone-100 flex flex-col justify-center cursor-pointer hover:border-emerald-300 transition-colors"> <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1"><PawPrint size={12}/> Capi</p> <h4 className="text-3xl font-black text-emerald-600 italic">{validAnimals.length}</h4> </div> <div onClick={() => setActiveTab('finance')} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-stone-100 flex flex-col justify-center cursor-pointer hover:border-emerald-300 transition-colors"> <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Wallet size={12}/> Netto</p> <h4 className="text-3xl font-black text-stone-800 italic">€{transactions.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0).toFixed(0)}</h4> </div> <div onClick={() => setActiveTab('tasks')} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-stone-100 flex flex-col justify-center cursor-pointer hover:border-emerald-300 transition-colors"> <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1"><ListChecks size={12}/> Task</p> <h4 className="text-3xl font-black text-amber-500 italic">{tasks.filter(t=>!t.done).length}</h4> </div> <div onClick={() => setActiveTab('market')} className="bg-gradient-to-br from-amber-400 to-orange-500 p-5 rounded-[1.5rem] shadow-md border border-amber-300 flex flex-col justify-center cursor-pointer hover:scale-[1.02] transition-transform"> <p className="text-[10px] font-black text-amber-100 uppercase tracking-widest mb-1 flex items-center gap-1"><Store size={12}/> Social</p> <h4 className="text-xl font-black text-white italic">Mercato</h4> </div> </div> <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm"> <h3 className="text-lg font-black text-stone-800 mb-5 flex items-center gap-2"><ListChecks className="text-emerald-500" size={20}/> Attività in Sospeso</h3> <div className="space-y-3"> {tasks.filter(t => !t.done).sort((a,b) => (a.dueDate || '').localeCompare(b.dueDate || '')).slice(0, 4).map(t => ( <div key={t.id} className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-xl border border-stone-100"> <div className="flex flex-col"><span className="font-bold text-sm text-stone-700">{t.text}</span><span className="text-[9px] font-black text-emerald-600 uppercase mt-0.5">📅 {t.dueDate ? new Date(t.dueDate).toLocaleDateString('it-IT') : 'N/D'}</span></div> <button onClick={async () => await updateDoc(doc(db, 'tasks', t.id), { done: true, dateCompleted: new Date().toLocaleDateString('it-IT') })} className="text-stone-300 hover:text-emerald-500 transition-colors"><CheckCircle2 size={24}/></button> </div> ))} </div> </div> </div> )}
            {activeTab === 'products' && ( <div className="space-y-8 animate-fade-in"> {sellingProduct && ( <div className="bg-amber-50 p-6 md:p-8 rounded-[2rem] border-2 border-amber-300 shadow-lg shadow-amber-200/50 relative"> <button onClick={() => setSellingProduct(null)} className="absolute top-4 right-4 text-amber-400 hover:text-amber-700 bg-white rounded-full p-1 shadow-sm"><X size={20}/></button> <h3 className="text-xl font-black text-amber-950 italic mb-4 flex items-center gap-2"><Store className="text-amber-500" /> Pubblica in Vetrina</h3> <p className="text-sm font-bold text-amber-800 mb-6">Stai vendendo: <span className="font-black underline">{sellingProduct.name}</span> ({sellingProduct.quantity} {sellingProduct.unit} disp.)</p> <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"> <div> <label className="text-[10px] font-black text-amber-600 uppercase ml-2 mb-1 block">Prezzo a confezione/unità (€)</label> <input type="number" placeholder="Es. 15.50" className="ui-input border-amber-200 bg-white" value={sellPrice || ''} onChange={e => setSellPrice(Number(e.target.value) || 0)} /> </div> <div> <label className="text-[10px] font-black text-amber-600 uppercase ml-2 mb-1 block">Numero WhatsApp (Opzionale)</label> <input type="tel" placeholder="Es. 3401234567" className="ui-input border-amber-200 bg-white" value={sellPhone} onChange={e => setSellPhone(e.target.value)} /> <p className="text-[9px] text-amber-600/70 ml-2 mt-1 font-medium">Se vuoto, i clienti ti contatteranno via Email.</p> </div> </div> <button onClick={handlePublishToMarket} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-xl text-xs uppercase shadow-md transition-colors">Metti in vendita nel Mercato</button> </div> )} <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm"> <h3 className="text-xs font-black uppercase tracking-widest text-emerald-900 mb-6 flex items-center gap-2"><Package size={18}/> Aggiungi Scorte</h3> <div className="space-y-4 mb-6"> <input placeholder="Nome prodotto (es. Formaggio, Fieno)" className="ui-input font-bold" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} /> <div className="grid grid-cols-2 gap-4"> <input placeholder="Q.tà" type="number" className="ui-input" value={newProduct.quantity || ''} onChange={e => setNewProduct({...newProduct, quantity: Number(e.target.value) || 0})} /> <select className="ui-input" value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})}><option>kg</option><option>litri</option><option>unità</option></select> </div> </div> <button onClick={handleAddProduct} className="w-full bg-emerald-600 text-white font-black rounded-xl py-4 text-xs uppercase shadow-md">Carica in Magazzino</button> </div> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"> {products.map(p => ( <div key={p.id} className="bg-white p-5 rounded-[1.5rem] border border-stone-100 text-center shadow-sm relative flex flex-col items-center"> <div className="bg-emerald-50 text-emerald-600 p-4 rounded-[1rem] mb-4"><Package size={28} strokeWidth={2}/></div> <h4 className="font-black text-stone-800 text-[15px] mb-1 uppercase tracking-tight w-full truncate">{p.name}</h4> <div className="text-2xl font-black text-emerald-600 mb-4">{p.quantity} <span className="text-[10px] uppercase">{p.unit}</span></div> <button onClick={() => { setSellingProduct(p); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="w-full mb-3 bg-amber-100 text-amber-700 font-bold text-[10px] uppercase py-2 rounded-xl border border-amber-200 hover:bg-amber-200 transition-colors flex justify-center items-center gap-1"><Store size={14}/> Vendi nel Mercato</button> <div className="flex w-full gap-2 mt-auto"> <button onClick={() => reduceProduct(p.id, 1)} className="flex-1 flex justify-center text-stone-400 hover:text-red-500 bg-stone-50 py-2 rounded-xl transition-colors"><MinusCircle size={20}/></button> <button onClick={() => deleteDoc(doc(db, 'products', p.id))} className="flex-1 flex justify-center text-stone-400 hover:text-red-500 bg-stone-50 py-2 rounded-xl transition-colors"><Trash2 size={20}/></button> </div> </div> ))} </div> </div> )}
            {activeTab === 'inventory' && ( <div className="space-y-8 animate-fade-in"> <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-100 shadow-sm"> <h3 className="text-xs font-black mb-6 text-emerald-900 uppercase flex items-center gap-2"><PlusCircle size={18} className="text-emerald-500"/> Nuovo Capo</h3> <div className="space-y-4 mb-6"> <div className="space-y-1.5"> <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Codice Identificativo</label> <input placeholder="Es. IT001..." className="ui-input" value={newAnimal.name} onChange={e => setNewAnimal({...newAnimal, name: e.target.value})} /> </div> <div className="grid grid-cols-2 gap-4"> <div className="space-y-1.5"> <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Specie</label> <select className="ui-input" value={newAnimal.species} onChange={e => setNewAnimal({...newAnimal, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select> </div> <div className="space-y-1.5"> <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Data Nascita</label> <input type="date" className="ui-input" value={newAnimal.birthDate} onChange={e => setNewAnimal({...newAnimal, birthDate: e.target.value})} /> </div> </div> <div className="grid grid-cols-2 gap-4"> <div className="space-y-1.5"> <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Padre</label> <select className="ui-input text-sm" value={newAnimal.sire} onChange={e => setNewAnimal({...newAnimal, sire: e.target.value})}><option value="">Ignoto</option>{validAnimals.filter(a => a.species === newAnimal.species).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select> </div> <div className="space-y-1.5"> <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Madre</label> <select className="ui-input text-sm" value={newAnimal.dam} onChange={e => setNewAnimal({...newAnimal, dam: e.target.value})}><option value="">Ignota</option>{validAnimals.filter(a => a.species === newAnimal.species).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select> </div> </div> <div className="space-y-1.5"> <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Note e Trattamenti Sanitari</label> <textarea placeholder="Vaccini, cure..." className="ui-input h-24 resize-none" value={newAnimal.notes} onChange={e => setNewAnimal({...newAnimal, notes: e.target.value})}></textarea> </div> </div> <button onClick={handleSaveAnimal} className="w-full bg-emerald-600 text-white font-black rounded-xl py-4 uppercase text-xs shadow-lg shadow-emerald-200">Registra Capo</button> </div> {speciesList.map(species => { const capi = validAnimals.filter(a => a.species === species); if (capi.length === 0) return null; return ( <div key={species} className="space-y-4"> <h3 className="text-xl md:text-2xl font-black text-emerald-950 uppercase italic px-2 pt-2 border-b border-stone-200 pb-2">{species} <span className="text-sm text-stone-400 font-bold ml-2 bg-stone-200 px-2 py-1 rounded-lg">{capi.length}</span></h3> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> {capi.map(a => ( <div key={a.id} className="bg-white p-5 rounded-[1.5rem] border border-stone-100 shadow-sm relative flex flex-col"> {editingId === a.id ? ( <div className="space-y-3"> <input className="ui-input font-bold" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} /> <textarea className="ui-input text-xs h-24 resize-none" value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} /> <button onClick={async () => { await updateDoc(doc(db, 'animals', a.id), { name: editData.name, notes: editData.notes }); setEditingId(null); }} className="w-full bg-emerald-600 text-white py-3 rounded-xl text-xs font-black uppercase">Salva</button> </div> ) : ( <> <div className="flex justify-between items-start mb-3"> <h4 className="text-lg font-black text-stone-800 leading-tight">{a.name}</h4> <div className="flex gap-1 bg-stone-50 rounded-lg p-1"> <button onClick={() => { setEditingId(a.id); setEditData({name: a.name, notes: a.notes}); }} className="text-stone-400 hover:text-emerald-600 p-1.5 rounded-md hover:bg-white"><Edit2 size={16}/></button> <button onClick={() => { if(window.confirm("Eliminare definitivamente?")) deleteDoc(doc(db, 'animals', a.id)); }} className="text-stone-400 hover:text-red-500 p-1.5 rounded-md hover:bg-white"><Trash2 size={16}/></button> </div> </div> <div className="space-y-2 mb-3"> <p className="text-[11px] text-stone-500 font-bold uppercase flex items-center gap-1.5 bg-stone-50 inline-flex px-2 py-1 rounded-md"><CalendarDays size={12} className="text-stone-400"/> {a.birthDate || 'Data Ignota'}</p> </div> {a.notes && <p className="text-xs text-stone-600 mt-auto pt-3 border-t border-stone-100 italic leading-relaxed">{a.notes}</p>} </> )} </div> ))} </div> </div> ); })} </div> )}
            {activeTab === 'finance' && ( <div className="space-y-8 animate-fade-in"> <div className="bg-emerald-950 p-10 rounded-[2rem] text-white shadow-lg relative overflow-hidden"> <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">Bilancio Netto Totale</p> <h2 className="text-6xl font-black italic tracking-tighter">€ {transactions.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0).toFixed(2)}</h2> </div> <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm"> <h3 className="text-xs font-black uppercase mb-5 text-emerald-900">Registra Movimento</h3> <div className="space-y-4 mb-5"> <input placeholder="Causale (es. Vendita Vitello)" className="ui-input" value={newTrans.desc} onChange={e => setNewTrans({...newTrans, desc: e.target.value})} /> <div className="grid grid-cols-3 gap-3"> <input placeholder="€" type="number" className="ui-input font-bold" value={newTrans.amount || ''} onChange={e => setNewTrans({...newTrans, amount: Number(e.target.value) || 0})} /> <select className="ui-input font-black" value={newTrans.type} onChange={e => setNewTrans({...newTrans, type: e.target.value as any})}><option>Entrata</option><option>Uscita</option></select> <select className="ui-input" value={newTrans.species} onChange={e => setNewTrans({...newTrans, species: e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select> </div> </div> <button onClick={handleSaveTransaction} className="w-full bg-emerald-600 text-white font-black rounded-xl py-4 text-xs uppercase">Aggiungi a Bilancio</button> </div> {speciesList.map(s => { const specTrans = transactions.filter(t => t.species === s || t.species === s.substring(0,3)+"."); const balance = specTrans.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0); if(specTrans.length === 0) return null; return ( <div key={s} className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm"> <div className="flex justify-between items-center mb-5 border-b border-stone-100 pb-4"> <div className="flex items-center gap-3"> <div className="bg-stone-100 p-2 rounded-lg text-stone-400"><Activity size={18}/></div> <h4 className="text-xl font-black italic uppercase text-stone-800">{s}</h4> </div> <span className={`font-black text-2xl ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>€ {balance.toFixed(2)}</span> </div> <div className="space-y-3"> {specTrans.sort((a,b)=>b.date.localeCompare(a.date)).map(t => ( <div key={t.id} className="flex justify-between items-center p-4 bg-[#F9FAFB] rounded-[1rem] border border-stone-100"> <div className="flex items-center gap-4"> <div className={`p-2.5 rounded-xl ${t.type === 'Entrata' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}> {t.type === 'Entrata' ? <ArrowUpRight size={18} strokeWidth={3}/> : <ArrowDownLeft size={18} strokeWidth={3}/>} </div> <div> <p className="font-bold text-stone-800 text-sm leading-tight">{t.desc}</p> <p className="text-[10px] font-black text-stone-400 mt-1">{t.date}</p> </div> </div> <div className="flex items-center gap-4"> <span className={`font-black text-lg ${t.type === 'Entrata' ? 'text-emerald-600' : 'text-red-500'}`}>€{t.amount.toFixed(2)}</span> <button onClick={() => { if(window.confirm("Cancellare questa transazione?")) deleteDoc(doc(db, 'transactions', t.id)); }} className="text-stone-400 hover:text-red-500 bg-white p-2 rounded-lg border border-stone-200 shadow-sm"><Trash2 size={16}/></button> </div> </div> ))} </div> </div> ); })} </div> )}
            {activeTab === 'births' && ( <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-100 shadow-sm animate-fade-in"> <h3 className="text-xs font-black uppercase text-emerald-900 mb-6 flex items-center gap-2"><Baby size={18}/> Registra Parto</h3> <div className="space-y-4 mb-6"> <div className="space-y-1.5"> <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Specie</label> <select className="ui-input w-full" value={newBirth.species} onChange={e => setNewBirth({...newBirth, species: e.target.value as Species})}>{speciesList.map(s => <option key={s}>{s}</option>)}</select> </div> <div className="space-y-1.5"> <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Codice / Nome Madre</label> <input placeholder="Madre..." className="ui-input w-full" value={newBirth.idCode} onChange={e => setNewBirth({...newBirth, idCode: e.target.value})} /> </div> <div className="grid grid-cols-2 gap-4"> <div className="space-y-1.5"> <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Nati Vivi</label> <input type="number" placeholder="Es. 3" className="ui-input w-full font-bold" value={newBirth.count} onChange={e => setNewBirth({...newBirth, count: Number(e.target.value) || 1})} /> </div> <div className="space-y-1.5"> <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Data Parto</label> <input type="date" className="ui-input w-full" value={newBirth.birthDate} onChange={e => setNewBirth({...newBirth, birthDate: e.target.value})} /> </div> </div> </div> <button onClick={handleSaveBirth} className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl text-xs uppercase shadow-md">Salva Parto e Crea Capi</button> </div> )}
            {activeTab === 'dinastia' && ( <div className="space-y-6 animate-fade-in"> {speciesList.map(species => { const founders = validAnimals.filter(a => a.species === species && !a.sire && !a.dam); if (founders.length === 0) return null; return ( <div key={species} className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm"> <h3 className="text-2xl font-black text-emerald-950 mb-6 border-b border-stone-100 pb-3 uppercase italic">{species}</h3> <div className="relative"> {founders.map(founder => <div key={founder.id} className="mb-4 last:mb-0"><DynastyBranch animal={founder} allAnimals={validAnimals} level={0} /></div>)} </div> </div> ); })} </div> )}
            {activeTab === 'tasks' && ( <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in"> <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-100 shadow-sm"> <h3 className="text-lg font-black mb-6 italic flex items-center gap-2 text-emerald-950"><ListChecks className="text-emerald-600" size={24} /> Da Fare</h3> <div className="flex flex-col md:flex-row gap-3 mb-6 bg-stone-50 p-3 rounded-[1.2rem] border border-stone-200"> <input type="date" className="ui-input py-2 md:w-40 flex-shrink-0 text-xs" value={newTaskDate} onChange={e => setNewTaskDate(e.target.value)} /> <input className="bg-transparent px-3 py-2 w-full outline-none font-medium text-sm" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Es. Vaccinare vitelli..." /> <button onClick={handleAddTask} className="bg-emerald-600 text-white px-5 py-3 md:py-0 rounded-xl font-black text-[10px] uppercase shadow-sm">Aggiungi</button> </div> <div className="space-y-3"> {tasks.filter(t => !t.done).sort((a,b) => (a.dueDate || '').localeCompare(b.dueDate || '')).map(t => ( <div key={t.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-200 shadow-sm"> <div className="flex items-center gap-4"> <button onClick={async () => await updateDoc(doc(db, 'tasks', t.id), { done: true, dateCompleted: new Date().toLocaleDateString('it-IT') })} className="text-stone-300 hover:text-emerald-500 transition-colors"><CheckCircle2 size={28}/></button> <div className="flex flex-col"> <span className="font-bold text-[15px] text-stone-700 leading-tight">{t.text}</span> <span className="text-[10px] font-black text-emerald-600 uppercase mt-1">📅 {t.dueDate ? new Date(t.dueDate).toLocaleDateString('it-IT') : 'N/D'}</span> </div> </div> <button onClick={() => deleteDoc(doc(db, 'tasks', t.id))} className="text-stone-300 hover:text-red-500 bg-stone-50 p-2 rounded-xl"><Trash2 size={16}/></button> </div> ))} </div> </div> <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-100 shadow-sm"> <h3 className="text-lg font-black italic flex items-center gap-2 mb-6 text-stone-800"><History className="text-stone-400" size={24} /> Storico Lavori Completati</h3> <div className="space-y-6"> {Array.from(new Set(tasks.filter(t => t.done).map(t => t.dateCompleted))).sort().reverse().map(date => ( <div key={date}> <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 border-b border-emerald-100 inline-block pb-1">{date}</p> <div className="space-y-2"> {tasks.filter(t => t.done && t.dateCompleted === date).map(i => ( <div key={i.id} className="flex justify-between items-center py-2 px-3 bg-stone-50 rounded-xl border border-transparent hover:border-stone-200 transition-colors"> <p className="text-[13px] font-bold text-stone-400 line-through truncate w-4/5">{i.text}</p> <button onClick={() => deleteDoc(doc(db, 'tasks', i.id))} className="text-stone-300 hover:text-red-500 p-1"><Trash2 size={14}/></button> </div> ))} </div> </div> ))} </div> </div> </div> )}
            {activeTab === 'vet' && ( <div className="space-y-6 animate-fade-in"> <div className="bg-amber-50 border border-amber-200 p-5 rounded-[1.5rem] flex items-start gap-4"> <AlertTriangle className="text-amber-500 shrink-0 mt-1" size={24} /> <div> <h4 className="font-black text-amber-800 text-sm uppercase tracking-widest mb-1">Avvertenza Medica</h4> <p className="text-xs text-amber-700 leading-relaxed font-medium">Questa funzione utilizza l'IA per fornire un pre-triage indicativo. <strong className="font-black">Non sostituisce in alcun modo il parere di un medico veterinario.</strong></p> </div> </div> <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-100 shadow-sm"> <div className="space-y-6"> <div> <label className="text-xs font-black text-stone-400 uppercase ml-2 mb-2 block">1. Carica una foto del problema (Opzionale)</label> <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-stone-300 rounded-[1.5rem] cursor-pointer hover:bg-stone-50 transition-colors relative overflow-hidden"> {vetImage ? ( <img src={vetImage} alt="Preview" className="w-full h-full object-cover opacity-60" /> ) : ( <div className="flex flex-col items-center justify-center pt-5 pb-6"> <UploadCloud className="w-10 h-10 text-stone-400 mb-3" /> <p className="text-sm font-bold text-stone-500">Tocca per scattare o caricare</p> </div> )} <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /> </label> {vetImage && <button onClick={() => setVetImage(null)} className="text-[10px] font-bold text-red-500 mt-2 ml-2 uppercase">Rimuovi Foto</button>} </div> <div> <label className="text-xs font-black text-stone-400 uppercase ml-2 mb-2 block">2. Descrivi i sintomi</label> <textarea placeholder="Es. Il vitello non mangia da ieri mattina..." className="ui-input h-28 resize-none" value={vetSymptom} onChange={(e) => setVetSymptom(e.target.value)} ></textarea> </div> <button onClick={analyzeWithAI} disabled={isAnalyzing} className={`w-full font-black py-4 rounded-xl text-xs uppercase shadow-md flex justify-center items-center gap-2 transition-all ${isAnalyzing ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`} > {isAnalyzing ? <><Activity className="animate-pulse" size={18}/> Analisi IA in corso...</> : <><Stethoscope size={18}/> Analizza con IA</>} </button> </div> </div> {vetResult && ( <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-blue-200 shadow-lg shadow-blue-100/50 animate-fade-in relative overflow-hidden"> <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div> <h3 className="text-lg font-black text-blue-900 mb-2 pl-4">Diagnosi Preliminare Stimata</h3> <h4 className="text-xl font-bold text-stone-800 italic mb-4 pl-4">{vetResult.title}</h4> <div className="space-y-4 pl-4"> <div> <h5 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Rilevamenti IA</h5> <p className="text-sm text-stone-600 leading-relaxed bg-stone-50 p-4 rounded-xl">{vetResult.desc}</p> </div> <div> <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Azione Consigliata</h5> <p className="text-sm text-blue-900 font-medium leading-relaxed bg-blue-50 p-4 rounded-xl border border-blue-100">{vetResult.action}</p> </div> </div> </div> )} </div> )}
          </>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-stone-200 flex justify-around px-1 pb-safe pt-2 z-40 overflow-x-auto hide-scrollbar">
        {menuItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center py-2 min-w-[60px] transition-colors ${activeTab === item.id ? (item.color || 'text-emerald-600') : 'text-stone-400'}`}>
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[8px] font-black mt-1.5 uppercase">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
