import React, { useState, useEffect } from 'react';
import {
  PawPrint, CalendarDays, TrendingUp, Network, Baby, Trash2,
  PlusCircle, LogOut, Lock, Menu, X, Search, LayoutDashboard,
  History, Package, Edit2, CheckCircle2,
  MinusCircle, Activity, ListChecks, Wallet,
  ArrowUpRight, ArrowDownLeft, Ghost, UserPlus, Stethoscope, 
  UploadCloud, AlertTriangle, FileDown, Store, ShoppingBag, 
  MessageCircle, Mail, Bot, Info, Send, Save
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
interface Transaction { id: string; type: 'Entrata' | 'Uscita'; amount: number; desc: string; species: Species; date: string; ownerId: string; }
interface Task { id: string; text: string; done: boolean; dueDate?: string; ownerId: string; }
interface Product { id: string; name: string; quantity: number; unit: string; ownerId: string; }
interface MarketItem { id: string; name: string; price: number; quantity: number; unit: string; sellerId: string; sellerName: string; contactEmail: string; contactPhone: string; createdAt: string; }

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'farmer' | 'consumer' | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRegistering, setIsRegistering] = useState(false);

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regRole, setRegRole] = useState<'farmer' | 'consumer'>('farmer');
  const [regName, setRegName] = useState('');
  
  const [newAnimal, setNewAnimal] = useState({ name: '', species: 'Maiali' as Species, birthDate: '', dam: '', notes: '' });
  const [editingAnimalId, setEditingAnimalId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');

  const [newBirth, setNewBirth] = useState({ idCode: '', species: 'Maiali' as Species, count: 1, birthDate: '' });
  const [newTrans, setNewTrans] = useState({ desc: '', amount: 0, type: 'Entrata' as any, species: 'Maiali' as Species });
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 0, unit: 'kg' });
  
  const [newTask, setNewTask] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

  const [showAssistant, setShowAssistant] = useState(false);
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
        } catch (e) { setUserRole('farmer'); }
      } else { setUser(null); setUserRole(null); }
      setLoading(false);
    });
    return () => unsub();
  }, []);

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        const uc = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', uc.user.uid), { role: regRole, name: regName, email });
      } else { await signInWithEmailAndPassword(auth, email, password); }
    } catch (e) { alert("Errore credenziali."); setLoading(false); }
  };

  const handleSaveAnimal = async () => {
    if (!newAnimal.name.trim()) return alert("Codice obbligatorio.");
    await addDoc(collection(db, 'animals'), { ...newAnimal, ownerId: user!.uid });
    setNewAnimal({ name: '', species: 'Maiali', birthDate: '', dam: '', notes: '' });
  };

  const handleUpdateNotes = async (id: string) => {
    await updateDoc(doc(db, 'animals', id), { notes: editNote });
    setEditingAnimalId(null);
    setEditNote('');
  };

  const handleSaveBirth = async () => {
    if (!newBirth.idCode.trim()) return alert("Codice madre richiesto.");
    await addDoc(collection(db, 'births'), { ...newBirth, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    for (let i = 0; i < newBirth.count; i++) {
      await addDoc(collection(db, 'animals'), { name: `NATO_${newBirth.idCode}_${Math.floor(Math.random()*1000)}`, species: newBirth.species, birthDate: newBirth.birthDate, dam: newBirth.idCode, notes: 'Nascita registrata', ownerId: user!.uid });
    }
    setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' });
  };

  const handleSaveTransaction = async () => {
    if (newTrans.amount <= 0 || !newTrans.desc) return alert("Inserisci dati.");
    await addDoc(collection(db, 'transactions'), { ...newTrans, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    setNewTrans({ desc: '', amount: 0, type: 'Entrata', species: 'Maiali' });
  };

  const handlePublishToMarket = async () => {
    if (!sellingProduct || sellPrice <= 0) return alert("Prezzo non valido.");
    try {
      await addDoc(collection(db, 'market_items'), { 
        name: sellingProduct.name, price: Number(sellPrice), quantity: sellingProduct.quantity, unit: sellingProduct.unit, 
        sellerId: user!.uid, sellerName: userName, contactEmail: user!.email, contactPhone: sellPhone, createdAt: new Date().toISOString() 
      });
      await deleteDoc(doc(db, 'products', sellingProduct.id));
      setSellingProduct(null);
      alert("Pubblicato!");
    } catch (e) { alert("Errore invio dati."); }
  };

  const handleAICommand = async () => {
    const frasi = aiInput.toLowerCase().split(/ e |,|\./).filter(s => s.trim());
    let logs = [];
    for (let f of frasi) {
      const num = f.match(/(\d+)/)?.[1];
      if (f.includes('venduto') && num) {
        await addDoc(collection(db, 'transactions'), { desc: `IA: ${f}`, amount: Number(num), type: 'Entrata', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        logs.push(`✅ Entrata: ${num}€`);
      } else if (f.includes('speso') && num) {
        await addDoc(collection(db, 'transactions'), { desc: `IA: ${f}`, amount: Number(num), type: 'Uscita', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        logs.push(`✅ Uscita: ${num}€`);
      }
    }
    setAiLogs(logs); setAiInput('');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-emerald-800">Sincronizzazione Cloud...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm border">
          <h1 className="text-2xl font-black text-center mb-6 text-emerald-900 italic">AgriManage Pro</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border">
                <input placeholder="Tuo Nome o Azienda" className="w-full p-3 rounded-xl border text-sm" value={regName} onChange={e => setRegName(e.target.value)} required />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRegRole('farmer')} className={`flex-1 p-2 rounded-xl text-[10px] font-bold border transition-all ${regRole === 'farmer' ? 'bg-emerald-600 text-white' : 'bg-white text-stone-400'}`}>AZIENDA</button>
                  <button type="button" onClick={() => setRegRole('consumer')} className={`flex-1 p-2 rounded-xl text-[10px] font-bold border transition-all ${regRole === 'consumer' ? 'bg-amber-500 text-white' : 'bg-white text-stone-400'}`}>CLIENTE</button>
                </div>
              </div>
            )}
            <input type="email" placeholder="Email" className="w-full p-3 rounded-xl border text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="w-full p-3 rounded-xl border text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-700 text-white py-3 rounded-xl font-bold uppercase">{isRegistering ? "Crea Account" : "Entra"}</button>
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-xs font-bold text-stone-400 uppercase mt-4 text-center underline">{isRegistering ? "Accedi" : "Registrati"}</button>
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
    { id: 'vet', label: 'Vet IA', icon: Stethoscope },
    { id: 'market', label: 'Mercato', icon: Store }
  ] : [{ id: 'market', label: 'Acquista', icon: ShoppingBag }];

  const totalIncome = transactions.filter(t => t.type === 'Entrata').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Uscita').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row relative text-stone-900">
      
      {userRole === 'farmer' && (
        <button onClick={() => setShowAssistant(!showAssistant)} className="fixed bottom-20 right-4 md:bottom-8 md:right-8 bg-blue-600 text-white p-4 rounded-full shadow-2xl z-[100] animate-bounce">
          <Bot size={24} />
        </button>
      )}

      <aside className="hidden md:flex flex-col w-64 bg-white border-r p-6 fixed h-full shadow-sm z-40">
        <h1 className="text-xl font-black mb-8 text-emerald-900 italic uppercase">AgriPro</h1>
        <nav className="space-y-1 flex-1">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="mt-4 flex items-center gap-2 text-red-500 font-bold p-2 text-xs uppercase"><LogOut size={18} /> Esci</button>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t flex justify-around p-2 z-50 shadow-lg">
        {menuItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center p-2 ${activeTab === item.id ? 'text-emerald-600' : 'text-stone-400'}`}>
            <item.icon size={22} />
            <span className="text-[9px] font-bold uppercase mt-1">{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 md:ml-64 p-4 md:p-10 pb-24">
        
        {showAssistant && (
          <div className="mb-6 bg-white p-5 rounded-2xl border-2 border-blue-100 shadow-xl animate-in slide-in-from-top-4">
            <h3 className="text-blue-900 font-bold text-xs uppercase mb-3 flex items-center gap-2"><Bot size={16}/> Assistente Vocale</h3>
            <div className="flex gap-2">
              <input className="flex-1 p-3 bg-blue-50 border-none rounded-xl text-sm font-bold" placeholder="Es: Venduto maiale a 100€" value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleAICommand()} />
              <button onClick={handleAICommand} className="bg-blue-600 text-white px-5 rounded-xl font-bold text-xs">OK</button>
            </div>
            {aiLogs.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{aiLogs.map((l, i) => <span key={i} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-bold">{l}</span>)}</div>}
          </div>
        )}

        {activeTab === 'dashboard' && userRole === 'farmer' && (
          <div className="space-y-6">
            <div className="bg-stone-900 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
               <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Saldo Netto</p>
                    <h3 className="text-5xl font-black italic">€ {(totalIncome - totalExpense).toFixed(0)}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-emerald-400/50 uppercase">Rendimento Mensale</p>
                    <p className="text-lg font-bold text-emerald-400">+12%</p>
                  </div>
               </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white p-5 rounded-3xl border shadow-sm flex flex-col items-center">
                  <PawPrint className="text-emerald-600 mb-2" size={24}/>
                  <p className="text-[10px] font-bold text-stone-400 uppercase">Capi</p>
                  <h4 className="text-2xl font-black">{animals.length}</h4>
               </div>
               <div className="bg-white p-5 rounded-3xl border shadow-sm flex flex-col items-center">
                  <ArrowUpRight className="text-emerald-500 mb-2" size={24}/>
                  <p className="text-[10px] font-bold text-stone-400 uppercase">Entrate</p>
                  <h4 className="text-2xl font-black text-emerald-600">€{totalIncome}</h4>
               </div>
               <div className="bg-white p-5 rounded-3xl border shadow-sm flex flex-col items-center">
                  <ArrowDownLeft className="text-red-500 mb-2" size={24}/>
                  <p className="text-[10px] font-bold text-stone-400 uppercase">Uscite</p>
                  <h4 className="text-2xl font-black text-red-500">€{totalExpense}</h4>
               </div>
               <div className="bg-white p-5 rounded-3xl border shadow-sm flex flex-col items-center">
                  <ListChecks className="text-amber-500 mb-2" size={24}/>
                  <p className="text-[10px] font-bold text-stone-400 uppercase">Lavori</p>
                  <h4 className="text-2xl font-black">{tasks.filter(t=>!t.done).length}</h4>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && userRole === 'farmer' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3">
              <input placeholder="Codice Capo" className="p-3 bg-stone-50 rounded-xl text-sm border-none shadow-inner uppercase" value={newAnimal.name} onChange={e=>setNewAnimal({...newAnimal, name:e.target.value})} />
              <select className="p-3 bg-stone-50 rounded-xl text-sm border-none shadow-inner" value={newAnimal.species} onChange={e=>setNewAnimal({...newAnimal, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
              <input type="date" className="p-3 bg-stone-50 rounded-xl text-sm border-none shadow-inner" value={newAnimal.birthDate} onChange={e=>setNewAnimal({...newAnimal, birthDate:e.target.value})} />
              <input placeholder="Note iniziali" className="p-3 bg-stone-50 rounded-xl text-sm border-none shadow-inner" value={newAnimal.notes} onChange={e=>setNewAnimal({...newAnimal, notes:e.target.value})} />
              <button onClick={handleSaveAnimal} className="bg-emerald-600 text-white font-bold rounded-xl py-3 text-xs uppercase shadow-lg">Registra</button>
            </div>

            {speciesList.map(specie => {
              const capi = animals.filter(a => a.species === specie);
              if (capi.length === 0) return null;
              return (
                <div key={specie} className="space-y-3">
                  <h4 className="text-sm font-black text-emerald-800 uppercase px-2 italic">{specie}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {capi.map(a => (
                      <div key={a.id} className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm relative group">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-stone-800 uppercase">{a.name}</h4>
                          <div className="flex gap-1">
                             <button onClick={() => { setEditingAnimalId(a.id); setEditNote(a.notes || ''); }} className="text-stone-300 hover:text-emerald-500 transition-colors"><Edit2 size={16}/></button>
                             <button onClick={()=>deleteDoc(doc(db,'animals',a.id))} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                          </div>
                        </div>
                        {editingAnimalId === a.id ? (
                           <div className="space-y-2 mt-2">
                              <textarea className="w-full p-3 bg-stone-50 rounded-xl text-xs border-none shadow-inner h-20" value={editNote} onChange={e=>setEditNote(e.target.value)} placeholder="Aggiorna note sanitarie o trattamenti..."></textarea>
                              <button onClick={()=>handleUpdateNotes(a.id)} className="w-full bg-emerald-600 text-white py-2 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-1"><Save size={12}/> Salva Note</button>
                           </div>
                        ) : (
                           <>
                             <p className="text-[10px] text-stone-400 font-bold mb-3 italic">{a.birthDate || 'N/D'}</p>
                             <p className="text-[11px] text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100 italic leading-relaxed">
                                {a.notes || "Nessuna nota presente."}
                             </p>
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

        {activeTab === 'finance' && userRole === 'farmer' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3">
              <input placeholder="Causale" className="p-3 bg-stone-50 rounded-xl font-bold text-sm border-none shadow-inner col-span-1 md:col-span-2 uppercase" value={newTrans.desc} onChange={e=>setNewTrans({...newTrans, desc:e.target.value})} />
              <input type="number" placeholder="€" className="p-3 bg-stone-50 rounded-xl font-bold text-sm border-none shadow-inner" value={newTrans.amount || ''} onChange={e=>setNewTrans({...newTrans, amount:Number(e.target.value)})} />
              <select className={`p-3 rounded-xl font-bold text-xs border-none shadow-sm uppercase ${newTrans.type === 'Entrata' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`} value={newTrans.type} onChange={e=>setNewTrans({...newTrans, type:e.target.value as any})}>
                  <option value="Entrata">📈 Entrata</option>
                  <option value="Uscita">📉 Uscita</option>
              </select>
              <select className="p-3 bg-stone-50 rounded-xl font-bold text-xs shadow-inner border-none uppercase" value={newTrans.species} onChange={e=>setNewTrans({...newTrans, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
              <button onClick={handleSaveTransaction} className="bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase shadow-md col-span-full py-4 mt-2">Registra Transazione</button>
            </div>
            
            {speciesList.map(specie => {
              const transSpecie = transactions.filter(t => t.species === specie);
              if (transSpecie.length === 0) return null;
              const subtotal = transSpecie.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0);
              return (
                <div key={specie} className="space-y-2">
                  <div className="flex justify-between items-center px-4 py-1 bg-stone-100 rounded-xl border-l-4 border-emerald-500 shadow-sm">
                    <h4 className="text-xs font-black text-stone-500 uppercase italic leading-none">{specie}</h4>
                    <span className={`text-[12px] font-black italic ${subtotal >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>Saldo: €{subtotal}</span>
                  </div>
                  <div className="space-y-2">
                    {transSpecie.map(t => (
                      <div key={t.id} className="bg-white p-4 rounded-xl border border-stone-100 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-4">
                           <div className={`p-2.5 rounded-xl ${t.type==='Entrata' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{t.type==='Entrata' ? <ArrowUpRight size={18}/> : <ArrowDownLeft size={18}/>}</div>
                           <div><p className="font-bold text-xs text-stone-800 uppercase leading-none mb-1">{t.desc}</p><p className="text-[9px] font-bold text-stone-300 uppercase tracking-widest">{t.date}</p></div>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className={`font-black text-sm italic ${t.type==='Entrata' ? 'text-emerald-600' : 'text-red-500'}`}>{t.type==='Entrata' ? '+' : '-'}€{t.amount}</span>
                           <button onClick={()=>deleteDoc(doc(db,'transactions',t.id))} className="p-2 text-stone-100 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'products' && userRole === 'farmer' && (
          <div className="space-y-8 animate-in fade-in">
            {sellingProduct && (
              <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-300 shadow-2xl animate-in zoom-in-95 max-w-lg mx-auto mb-10 relative overflow-hidden">
                <h3 className="text-xl font-black text-amber-950 italic mb-6 uppercase flex items-center gap-4 leading-none"><ShoppingBag size={24} className="text-amber-500"/> Metti in Vetrina: {sellingProduct.name}</h3>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-amber-600 ml-4 uppercase tracking-widest italic">Prezzo (€)</label>
                    <input type="number" className="w-full p-4 rounded-2xl border-none shadow-md font-black text-lg text-emerald-600 bg-white" placeholder="0.00" onChange={e=>setSellPrice(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-amber-600 ml-4 uppercase tracking-widest italic">WhatsApp</label>
                    <input className="w-full p-4 rounded-2xl border-none shadow-md font-black text-sm bg-white uppercase" placeholder="340..." onChange={e=>setSellPhone(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={handlePublishToMarket} className="flex-1 bg-amber-500 text-white font-bold py-4 rounded-xl uppercase text-xs tracking-widest shadow-lg active:scale-95">Conferma e Pubblica</button>
                  <button onClick={()=>setSellingProduct(null)} className="px-10 bg-white text-amber-500 font-bold rounded-xl border-2 border-amber-200 text-[10px] uppercase">Annulla</button>
                </div>
              </div>
            )}
            <div className="bg-white p-6 rounded-3xl border shadow-sm relative overflow-hidden border-t-4 border-emerald-600">
              <h3 className="text-[10px] font-black uppercase text-stone-400 mb-6 tracking-widest flex items-center gap-2 italic"><Package className="text-emerald-500" size={16}/> Gestione Magazzino Fisico</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input placeholder="Articolo (Fieno, Mais...)" className="p-3 bg-stone-50 rounded-xl font-bold text-sm border-none shadow-inner uppercase" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name:e.target.value})} />
                <div className="flex gap-2">
                  <input type="number" placeholder="QTY" className="flex-1 p-3 bg-stone-50 rounded-xl font-bold text-sm border-none shadow-inner" value={newProduct.quantity || ''} onChange={e=>setNewProduct({...newProduct, quantity:Number(e.target.value)})} />
                  <select className="p-3 bg-stone-50 rounded-xl font-bold border-none shadow-inner text-[10px] uppercase italic tracking-widest" value={newProduct.unit} onChange={e=>setNewProduct({...newProduct, unit:e.target.value})}><option>kg</option><option>balle</option><option>unità</option></select>
                </div>
                <button onClick={handleAddProduct} className="bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs shadow-md active:scale-95">Carica</button>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm text-center flex flex-col group hover:border-emerald-200 transition-all duration-500">
                  <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform shadow-inner"><Package size={28}/></div>
                  <h4 className="font-bold text-stone-900 uppercase text-[9px] mb-1 tracking-widest italic leading-none">{p.name}</h4>
                  <p className="text-4xl font-black text-emerald-600 italic tracking-tighter mb-4 leading-none">{p.quantity} <span className="text-[10px] uppercase not-italic opacity-30 tracking-[0.3em] block mt-1">{p.unit}</span></p>
                  <button onClick={()=>setSellingProduct(p)} className="w-full bg-amber-100 text-amber-700 font-bold py-3 rounded-xl text-[9px] uppercase tracking-widest mb-3 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2 border-2 border-amber-200 shadow-lg"><Store size={14}/> Vendi Km 0</button>
                  <button onClick={()=>deleteDoc(doc(db,'products',p.id))} className="text-stone-200 hover:text-red-500 transition-colors mt-auto pt-4 border-t"><Trash2 size={16} className="mx-auto"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'vet' && userRole === 'farmer' && (
          <div className="bg-white p-8 rounded-[3rem] border shadow-2xl max-w-2xl mx-auto animate-in zoom-in-95 mx-auto relative overflow-hidden">
            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white mb-10 flex items-center gap-6 shadow-2xl shadow-blue-200 group">
               <Stethoscope size={64} strokeWidth={1} className="group-hover:rotate-12 transition-transform duration-700" />
               <div className="relative z-10">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-1">Diagnosi IA</h3>
                  <p className="text-blue-50 font-bold opacity-80 text-xs leading-relaxed italic max-w-lg tracking-tight">Triage istantaneo clinico veterinario 2026.</p>
               </div>
            </div>

            <div className="space-y-6 mb-10">
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest italic ml-4">Allegato Fotografico</p>
                    <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-stone-200 rounded-[2.5rem] cursor-pointer hover:bg-stone-50 hover:border-blue-400 transition-all relative overflow-hidden bg-stone-50 shadow-inner">
                        {vetImage ? (
                            <img src={vetImage} alt="Analisi IA" className="w-full h-full object-cover animate-in fade-in" />
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                <UploadCloud size={48} strokeWidth={1} className="text-stone-300 mb-4" />
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Scatta una foto o carica file</p>
                            </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    {vetImage && <button onClick={()=>setVetImage(null)} className="text-[9px] font-black text-red-500 uppercase ml-4 underline">Cancella Foto</button>}
                </div>

                <div className="space-y-2">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest italic ml-4">Sintomi & Comportamento</p>
                    <textarea className="w-full p-8 bg-stone-50 border-none rounded-[3rem] font-bold text-stone-800 text-lg h-56 shadow-inner italic placeholder:text-stone-300 focus:ring-4 focus:ring-blue-100 transition-all leading-snug" placeholder="Descrivi il problema (es: vitello IT02 naso asciutto)..." value={vetSymptom} onChange={e=>setVetSymptom(e.target.value)}></textarea>
                </div>
            </div>

            <button onClick={()=>{setIsAnalyzing(true); setTimeout(()=>{setVetResult({title:"Esito Diagnostico IA", desc:"Il quadro clinico e visivo suggerisce una possibile infiammazione respiratoria acuta.", action:"ISOLARE IL CAPO E CONTATTARE IL VETERINARIO DI ZONA URGENTEMENTE"}); setIsAnalyzing(false);},3000)}} className="w-full bg-stone-950 text-white py-8 rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-6 hover:bg-blue-600 transition-all shadow-2xl active:scale-95">
              {isAnalyzing ? <><Activity className="animate-spin" size={28}/> Neural Sync...</> : <><Bot size={36}/> Analizza</>}
            </button>

            {vetResult && (
              <div className="mt-16 p-10 bg-emerald-50 border-4 border-emerald-100 rounded-[3.5rem] animate-in slide-in-from-bottom-12 duration-700">
                 <div className="flex items-center gap-6 mb-6">
                    <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-xl shadow-emerald-200"><AlertTriangle size={32} /></div>
                    <h4 className="text-2xl font-black uppercase text-emerald-950 tracking-tighter italic leading-none">{vetResult.title}</h4>
                 </div>
                 <p className="text-emerald-800 font-bold text-lg mb-8 italic leading-relaxed">"{vetResult.desc}"</p>
                 <div className="bg-emerald-600 text-white p-6 rounded-2xl text-center text-xs font-black uppercase tracking-[0.3em] shadow-2xl border-t-8 border-emerald-500">{vetResult.action}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'market' && (
          <div className="space-y-16 animate-in slide-in-from-bottom-12 duration-1000">
            <div className="bg-amber-500 p-12 md:p-20 rounded-[4rem] text-white shadow-[0_50px_100px_rgba(245,158,11,0.2)] relative overflow-hidden group">
               <ShoppingBag size={300} className="absolute -bottom-16 -right-16 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-[10s]" />
               <div className="relative z-10 max-w-2xl text-center md:text-left mx-auto md:mx-0">
                 <h3 className="text-5xl font-black italic tracking-tighter uppercase mb-4 leading-none">Market Km 0</h3>
                 <p className="text-amber-50 font-black text-xl leading-relaxed opacity-95 italic tracking-tighter">Sostieni l'agricoltura locale. Filiera corta 2026.</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {marketItems.map(item => (
                <div key={item.id} className="bg-white rounded-[3.5rem] border-2 border-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col group hover:shadow-2xl hover:translate-y-[-10px] transition-all duration-700">
                  <div className="h-60 bg-stone-50 flex items-center justify-center relative overflow-hidden group-hover:bg-amber-50 transition-colors duration-1000 shadow-inner">
                     <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-3xl px-5 py-2.5 rounded-[1.5rem] font-black text-2xl text-emerald-600 shadow-2xl border-2 border-emerald-50 group-hover:scale-110 transition-transform z-20 italic">€{item.price.toFixed(0)}</div>
                     <ShoppingBag size={80} className="text-stone-100 opacity-50 transition-all duration-1000 group-hover:scale-[1.8]" />
                  </div>
                  <div className="p-10 flex flex-col flex-1 relative">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-3 italic">{item.sellerName}</p>
                    <h4 className="text-3xl font-black text-stone-950 tracking-tighter mb-8 leading-[0.85] uppercase group-hover:text-amber-600 transition-colors duration-500">{item.name}</h4>
                    <div className="flex justify-between items-center mb-10 bg-stone-50 p-6 rounded-3xl border-2 border-white shadow-inner">
                       <span className="text-[11px] font-black text-stone-400 uppercase italic tracking-widest leading-none">Disponibile</span>
                       <span className="font-black text-stone-900 text-xl uppercase tracking-tighter leading-none">{item.quantity} <span className="text-xs text-stone-300 font-bold">{item.unit}</span></span>
                    </div>
                    {item.contactPhone ? (
                       <a href={`https://wa.me/39${item.contactPhone}?text=Salve ${item.sellerName}, vorrei ordinare ${item.name} visto su AgriManage.`} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-4 hover:scale-105 transition-all active:scale-95"><MessageCircle size={24}/> WhatsApp</a>
                    ) : (
                       <a href={`mailto:${item.contactEmail}`} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 hover:scale-105 transition-all active:scale-95"><Mail size={24}/> Email Order</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && userRole === 'farmer' && (
          <div className="max-w-xl space-y-6 animate-in slide-in-from-left-6 mx-auto">
            <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-5">
               <h3 className="text-[11px] font-black uppercase text-stone-400 mb-2 tracking-widest italic flex items-center gap-3 leading-none"><CalendarDays className="text-emerald-600" size={18}/> Programmazione Lavori</h3>
               <div className="flex flex-col md:flex-row gap-2">
                 <input className="flex-1 p-3 bg-stone-50 border-none rounded-xl font-bold text-sm shadow-inner" placeholder="Cosa devi segnare?" value={newTask} onChange={e=>setNewTask(e.target.value)} />
                 <input type="date" className="p-3 bg-stone-50 border-none rounded-xl font-bold text-xs uppercase text-emerald-700 shadow-inner" value={newTaskDate} onChange={e=>setNewTaskDate(e.target.value)} />
                 <button onClick={handleAddTask} className="bg-emerald-600 text-white px-8 rounded-xl font-bold text-xs uppercase shadow-md active:scale-95">OK</button>
               </div>
               <div className="relative group">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
                  <input className="w-full p-3 pl-10 bg-stone-100 border-none rounded-xl font-bold text-xs uppercase italic shadow-inner tracking-widest shadow-stone-200 placeholder:text-stone-300" placeholder="Filtra attività salvate..." value={taskSearch} onChange={e=>setTaskSearch(e.target.value)} />
               </div>
            </div>
            <div className="space-y-3">
              {tasks.filter(t => t.text.toLowerCase().includes(taskSearch.toLowerCase()))
                .sort((a,b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
                .map(t => (
                <div key={t.id} className={`bg-white p-5 rounded-3xl border-2 flex justify-between items-center transition-all ${t.done ? 'opacity-30 grayscale' : 'shadow-sm border-white hover:border-emerald-500 group border-l-8 border-l-emerald-600'}`}>
                  <div>
                    <p className={`text-base font-black tracking-tight leading-none mb-2 uppercase ${t.done ? 'line-through text-stone-400' : 'text-stone-900'}`}>{t.text}</p>
                    <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest italic">Scadenza: <span className="text-emerald-600">{t.dueDate || 'N/D'}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>updateDoc(doc(db,'tasks',t.id),{done:!t.done})} className={`p-3 rounded-2xl shadow-sm transition-all ${t.done ? 'bg-stone-200 text-stone-500' : 'bg-emerald-50 text-emerald-600'}`}><CheckCircle2 size={24}/></button>
                    <button onClick={()=>deleteDoc(doc(db,'tasks',t.id))} className="p-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95"><Trash2 size={24}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'dinastia' && (
          <div className="bg-white p-8 rounded-3xl border shadow-sm animate-in fade-in overflow-x-auto">
            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-2"><Network className="text-emerald-500"/> Albero Genealogico</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {animals.filter(a => !a.dam && !a.sire).map(root => (
                <div key={root.id} className="bg-stone-50 p-6 rounded-3xl border-2 border-white shadow-inner min-w-[300px]">
                  <DynastyBranch animal={root} allAnimals={animals} />
                </div>
              ))}
              {animals.length === 0 && <p className="text-stone-200 font-black italic uppercase text-center py-20 border-2 border-dashed rounded-3xl col-span-full">Nessun dato registrato.</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
