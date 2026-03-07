import React, { useState, useEffect } from 'react';
import {
  PawPrint, CalendarDays, TrendingUp, Network, Baby, Trash2,
  PlusCircle, LogOut, Menu, X, DollarSign, Search,
  History, Package, Edit2, CheckCircle2,
  MinusCircle, PieChart, Activity, ListChecks, Wallet,
  ArrowUpRight, ArrowDownLeft, Ghost
} from 'lucide-react';

// Firebase
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  getDocs
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User
} from "firebase/auth";

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

// ────────────────────────────────────────────────
// TIPI
// ────────────────────────────────────────────────
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

interface BirthRecord {
  id: string;
  animalName: string;   // forse da rivedere naming
  species: Species;
  date: string;
  offspringCount: number;
  birthDate: string;
  ownerId: string;
}

interface Transaction {
  id: string;
  type: 'Entrata' | 'Uscita';
  amount: number;
  desc: string;
  species: Species;
  date: string;
  ownerId: string;
}

interface Task {
  id: string;
  text: string;
  done: boolean;
  dateCompleted?: string;
  ownerId: string;
}

interface Product {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  ownerId: string;
}

// ────────────────────────────────────────────────
// Componente Dinastia
// ────────────────────────────────────────────────
const DynastyBranch = ({
  animal,
  allAnimals,
  level = 0
}: {
  animal: Animal;
  allAnimals: Animal[];
  level?: number;
}) => {
  const children = allAnimals.filter(
    a => a.sire === animal.id || a.dam === animal.id
  );

  return (
    <div className={level > 0 ? "ml-6 border-l-2 border-emerald-100 mt-2" : "mt-2"}>
      <div
        className={`flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border ${
          level === 0
            ? 'border-l-4 border-emerald-600'
            : 'border-gray-100 ml-2'
        }`}
      >
        <div className="flex flex-col">
          <span className="font-bold text-gray-800">{animal.name || '??'}</span>
          <span className="text-[10px] text-gray-400 uppercase font-black">
            Gen. {level} • {animal.species}
          </span>
        </div>
      </div>

      {children.map(child => (
        <DynastyBranch
          key={child.id}
          animal={child}
          allAnimals={allAnimals}
          level={level + 1}
        />
      ))}
    </div>
  );
};

// ────────────────────────────────────────────────
// APP PRINCIPALE
// ────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [births, setBirths] = useState<BirthRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [newAnimal, setNewAnimal] = useState({
    name: '',
    species: 'Maiali' as Species,
    birthDate: '',
    sire: '',
    dam: '',
    notes: ''
  });

  const [newBirth, setNewBirth] = useState({
    idCode: '',
    species: 'Maiali' as Species,
    count: 1,
    birthDate: ''
  });

  const [newTrans, setNewTrans] = useState({
    desc: '',
    amount: 0,
    type: 'Entrata' as 'Entrata' | 'Uscita',
    species: 'Maiali' as Species
  });

  const [newProduct, setNewProduct] = useState({
    name: '',
    quantity: 0,
    unit: 'kg'
  });

  const [newTask, setNewTask] = useState('');
  const [searchTask, setSearchTask] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', notes: '' });

  const speciesList: Species[] = ['Maiali', 'Cavalli', 'Mucche', 'Galline', 'Oche'];

  // ─── Calcolo capi validi ───────────────────────────────
  const validAnimals = animals.filter(
    a => a.id && a.name?.trim() && a.name.trim().length > 0
  );
  const ghostAnimalsCount = animals.length - validAnimals.length;

  // ─── Auth listener ─────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ─── Data listeners ────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const q = (coll: string) =>
      query(collection(db, coll), where("ownerId", "==", user.uid));

    const unsubscribers = [
      onSnapshot(q('animals'), snap =>
        setAnimals(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Animal[])
      ),
      onSnapshot(q('births'), snap =>
        setBirths(snap.docs.map(d => ({ id: d.id, ...d.data() })) as BirthRecord[])
      ),
      onSnapshot(q('transactions'), snap =>
        setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[])
      ),
      onSnapshot(q('tasks'), snap =>
        setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Task[])
      ),
      onSnapshot(q('products'), snap =>
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[])
      )
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [user?.uid]);

  // ─── Pulizia record vuoti ──────────────────────────────
  const cleanGhostAnimals = async () => {
    if (!user?.uid) return;

    const qGhost = query(
      collection(db, 'animals'),
      where("ownerId", "==", user.uid)
    );
    const snap = await getDocs(qGhost);

    const promises = snap.docs
      .filter(d => !d.data().name?.trim())
      .map(d => deleteDoc(doc(db, 'animals', d.id)));

    await Promise.all(promises);
    alert("Pulizia completata");
  };

  // ─── Aggiungi nascita + figli ──────────────────────────
  const handleSaveBirth = async () => {
    if (!newBirth.idCode.trim() || newBirth.count < 1) {
      alert("Inserire codice madre e numero nati valido");
      return;
    }

    try {
      await addDoc(collection(db, 'births'), {
        ...newBirth,
        date: new Date().toLocaleDateString('it-IT'),
        offspringCount: newBirth.count,
        ownerId: user!.uid
      });

      for (let i = 0; i < newBirth.count; i++) {
        await addDoc(collection(db, 'animals'), {
          name: `Figlio di ${newBirth.idCode.trim()} #${i + 1}`,
          species: newBirth.species,
          birthDate: newBirth.birthDate || '',
          dam: newBirth.idCode.trim(),
          notes: `Nato il ${newBirth.birthDate || '??'} - Parto auto`,
          ownerId: user!.uid
        });
      }

      setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' });
    } catch (err) {
      console.error(err);
      alert("Errore durante il salvataggio del parto");
    }
  };

  // ─── Aggiungi / aggiorna prodotto ──────────────────────
  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || newProduct.quantity <= 0) return;

    const nameLower = newProduct.name.trim().toLowerCase();
    const existing = products.find(
      p => p.name.trim().toLowerCase() === nameLower
    );

    try {
      if (existing) {
        await updateDoc(doc(db, 'products', existing.id), {
          quantity: existing.quantity + newProduct.quantity
        });
      } else {
        await addDoc(collection(db, 'products'), {
          ...newProduct,
          ownerId: user!.uid
        });
      }
      setNewProduct({ name: '', quantity: 0, unit: 'kg' });
    } catch (err) {
      console.error(err);
      alert("Errore salvataggio prodotto");
    }
  };

  const reduceProduct = async (id: string, amount: number) => {
    const prod = products.find(p => p.id === id);
    if (!prod || prod.quantity < amount) return;

    try {
      await updateDoc(doc(db, 'products', id), {
        quantity: prod.quantity - amount
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-emerald-800 bg-stone-50 italic animate-pulse">
        AGRIMANAGE PRO...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md">
          <h1 className="text-4xl font-black text-center mb-10 text-emerald-950 italic">
            AgriManage Pro
          </h1>
          <form
            onSubmit={async e => {
              e.preventDefault();
              try {
                await signInWithEmailAndPassword(auth, email, password);
              } catch (err) {
                alert("Credenziali non valide");
              }
            }}
            className="space-y-4"
          >
            <input
              type="email"
              placeholder="Email"
              className="ui-input w-full border p-4 rounded-2xl"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="ui-input w-full border p-4 rounded-2xl"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white p-5 rounded-2xl font-black uppercase"
            >
              Entra
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  // RENDER PRINCIPALE
  // ────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8F9FA] text-stone-900 font-sans">
      <style>{`
        .ui-input {
          background: white;
          padding: 0.85rem 1.25rem;
          border-radius: 1rem;
          border: 1.5px solid #E9ECEF;
          outline: none;
          transition: 0.3s;
          font-weight: 600;
        }
        .ui-input:focus {
          border-color: #059669;
          box-shadow: 0 0 0 4px #D1FAE5;
        }
      `}</style>

      {/* SIDEBAR */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-80 bg-white border-r border-stone-100 p-8 flex flex-col transform transition-transform duration-500 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg shadow-emerald-100">
            <TrendingUp size={24} strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-black italic text-emerald-950">AgriManage</h1>
          <button className="md:hidden ml-auto p-2" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto">
          {[
            { id: 'inventory', label: 'Inventario Capi', icon: PawPrint },
            { id: 'births', label: 'Registro Parti', icon: Baby },
            { id: 'dinastia', label: 'Dinastia e Sangue', icon: Network },
            { id: 'products', label: 'Scorte Magazzino', icon: Package },
            { id: 'finance', label: 'Bilancio Economico', icon: Wallet },
            { id: 'tasks', label: 'Agenda Lavori', icon: ListChecks }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-4 w-full p-4 rounded-2xl font-bold text-sm transition-all ${
                activeTab === item.id
                  ? 'bg-emerald-600 text-white shadow-xl scale-[1.02]'
                  : 'text-stone-400 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              <item.icon size={20} strokeWidth={activeTab === item.id ? 3 : 2} />
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => signOut(auth)}
          className="mt-8 flex items-center gap-2 text-red-500 font-black p-4 hover:bg-red-50 rounded-2xl transition-all"
        >
          <LogOut size={16} /> Esci
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-14 h-screen overflow-y-auto scroll-smooth">
        {/* DASHBOARD CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 text-center">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">
              Capi Effettivi
            </p>
            <h4 className="text-3xl font-black text-emerald-600 italic">{validAnimals.length}</h4>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 text-center">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">
              Saldo Netto
            </p>
            <h4 className="text-3xl font-black text-stone-800 italic">
              €{transactions
                .reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0)
                .toFixed(0)}
            </h4>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 text-center">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">
              Compiti
            </p>
            <h4 className="text-3xl font-black text-amber-500 italic">
              {tasks.filter(t => !t.done).length}
            </h4>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 text-center">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">
              Prodotti
            </p>
            <h4 className="text-3xl font-black text-blue-500 italic">{products.length}</h4>
          </div>
        </div>

        {ghostAnimalsCount > 0 && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3 text-amber-700 font-bold">
              <Ghost size={20} />
              <span>
                Dati sporchi rilevati ({ghostAnimalsCount}). Clicca per pulire:
              </span>
            </div>
            <button
              onClick={cleanGhostAnimals}
              className="bg-amber-600 text-white px-4 py-2 rounded-xl font-bold uppercase text-[10px]"
            >
              Pulisci
            </button>
          </div>
        )}

        <div className="mb-10 flex justify-between items-center">
          <h2 className="text-5xl font-black text-emerald-950 capitalize tracking-tighter italic grow">
            {activeTab}
          </h2>
          <div
            className="md:hidden bg-emerald-600 p-2 rounded-xl text-white shadow-lg cursor-pointer"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </div>
        </div>

        {/* =================== TABS =================== */}

        {activeTab === 'inventory' && (
          <div className="space-y-12">
            {/* FORM NUOVO CAPO */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-stone-100 shadow-xl">
              <h3 className="text-xs font-black mb-8 text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                <PlusCircle size={20} className="text-emerald-500" /> Nuova Anagrafica
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <input
                  placeholder="Codice Capo"
                  className="ui-input w-full"
                  value={newAnimal.name}
                  onChange={e => setNewAnimal({ ...newAnimal, name: e.target.value })}
                />
                <select
                  className="ui-input w-full"
                  value={newAnimal.species}
                  onChange={e =>
                    setNewAnimal({ ...newAnimal, species: e.target.value as Species })
                  }
                >
                  {speciesList.map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <input
                  type="date"
                  className="ui-input w-full"
                  value={newAnimal.birthDate}
                  onChange={e => setNewAnimal({ ...newAnimal, birthDate: e.target.value })}
                />
              </div>

              <textarea
                placeholder="Note sanitarie..."
                className="ui-input w-full h-24 resize-none mb-8"
                value={newAnimal.notes}
                onChange={e => setNewAnimal({ ...newAnimal, notes: e.target.value })}
              />

              <button
                onClick={async () => {
                  if (!newAnimal.name.trim()) return;
                  try {
                    await addDoc(collection(db, 'animals'), {
                      ...newAnimal,
                      ownerId: user.uid
                    });
                    setNewAnimal({
                      name: '',
                      species: 'Maiali',
                      birthDate: '',
                      sire: '',
                      dam: '',
                      notes: ''
                    });
                  } catch (err) {
                    alert("Errore durante il salvataggio");
                  }
                }}
                className="bg-emerald-600 text-white font-black rounded-2xl py-5 px-12 shadow-lg hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs"
              >
                Salva
              </button>
            </div>

            {/* LISTA CAPI per specie */}
            {speciesList.map(species => {
              const capi = validAnimals.filter(a => a.species === species);
              if (capi.length === 0) return null;

              return (
                <div key={species} className="space-y-6">
                  <h3 className="text-3xl font-black text-emerald-950 uppercase italic tracking-tighter border-b pb-2">
                    {species} ({capi.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {capi.map(a => (
                      <div
                        key={a.id}
                        className="bg-white p-8 rounded-[2rem] border border-stone-100 relative group shadow-sm hover:shadow-xl transition-all"
                      >
                        {editingId === a.id ? (
                          <div className="space-y-4">
                            <input
                              className="ui-input w-full font-bold"
                              value={editData.name}
                              onChange={e => setEditData({ ...editData, name: e.target.value })}
                            />
                            <textarea
                              className="ui-input w-full text-xs h-24 resize-none"
                              value={editData.notes}
                              onChange={e => setEditData({ ...editData, notes: e.target.value })}
                            />
                            <button
                              onClick={async () => {
                                await updateDoc(doc(db, 'animals', a.id), {
                                  name: editData.name,
                                  notes: editData.notes
                                });
                                setEditingId(null);
                              }}
                              className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase"
                            >
                              Salva
                            </button>
                          </div>
                        ) : (
                          <>
                            <h4 className="text-2xl font-black text-stone-800 tracking-tight">
                              {a.name}
                            </h4>
                            <p className="text-[10px] text-stone-400 font-black uppercase mb-4 flex items-center gap-2">
                              <CalendarDays size={14} /> Nato: {a.birthDate || 'N/D'}
                            </p>
                            {a.notes && (
                              <div className="mt-4 p-4 bg-stone-50 rounded-2xl text-xs text-stone-500 italic border-l-4 border-emerald-500 leading-relaxed">
                                {a.notes}
                              </div>
                            )}
                            <div className="absolute top-4 right-4 flex gap-2 md:opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => {
                                  setEditingId(a.id);
                                  setEditData({ name: a.name, notes: a.notes });
                                }}
                                className="bg-stone-100 text-stone-400 p-2 rounded-xl hover:text-emerald-600"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm("Eliminare definitivamente?"))
                                    deleteDoc(doc(db, 'animals', a.id));
                                }}
                                className="bg-stone-100 text-stone-400 p-2 rounded-xl hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
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

        {activeTab === 'finance' && (
          <div className="space-y-12">
            {speciesList.map(s => {
              const specTrans = transactions.filter(t => t.species === s);
              const balance = specTrans.reduce(
                (acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount),
                0
              );

              return (
                <div key={s} className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-2xl font-black italic uppercase">{s}</h4>
                    <span
                      className={`text-3xl font-black ${
                        balance >= 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      € {balance.toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {specTrans
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map(t => (
                        <div
                          key={t.id}
                          className="p-5 flex justify-between items-center hover:bg-stone-50 transition group rounded-xl"
                        >
                          <div className="flex items-center gap-4">
                            <div className={t.type === 'Entrata' ? 'text-emerald-500' : 'text-red-500'}>
                              {t.type === 'Entrata' ? (
                                <ArrowUpRight size={18} />
                              ) : (
                                <ArrowDownLeft size={18} />
                              )}
                            </div>
                            <span className="font-bold text-stone-700">
                              {t.desc} ({t.date})
                            </span>
                          </div>
                          <div className="flex items-center gap-6">
                            <span
                              className={`font-black text-lg ${
                                t.type === 'Entrata' ? 'text-emerald-600' : 'text-red-500'
                              }`}
                            >
                              €{t.amount.toFixed(2)}
                            </span>
                            <button
                              onClick={async () => {
                                if (window.confirm("Cancellare transazione?"))
                                  await deleteDoc(doc(db, 'transactions', t.id));
                              }}
                              className="text-stone-300 hover:text-red-600 p-2 rounded-xl transition-colors md:opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}

            {/* FORM NUOVA TRANSAZIONE */}
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input
                  placeholder="Causale"
                  className="ui-input md:col-span-2"
                  value={newTrans.desc}
                  onChange={e => setNewTrans({ ...newTrans, desc: e.target.value })}
                />
                <input
                  placeholder="€"
                  type="number"
                  min="0"
                  step="0.01"
                  className="ui-input"
                  value={newTrans.amount || ''}
                  onChange={e =>
                    setNewTrans({ ...newTrans, amount: Number(e.target.value) || 0 })
                  }
                />
                <select
                  className="ui-input font-black"
                  value={newTrans.type}
                  onChange={e =>
                    setNewTrans({ ...newTrans, type: e.target.value as 'Entrata' | 'Uscita' })
                  }
                >
                  <option>Entrata</option>
                  <option>Uscita</option>
                </select>
                <select
                  className="ui-input"
                  value={newTrans.species}
                  onChange={e =>
                    setNewTrans({ ...newTrans, species: e.target.value as Species })
                  }
                >
                  {speciesList.map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={async () => {
                  if (!newTrans.desc.trim() || newTrans.amount <= 0) return;
                  try {
                    await addDoc(collection(db, 'transactions'), {
                      ...newTrans,
                      date: new Date().toLocaleDateString('it-IT'),
                      ownerId: user.uid
                    });
                    setNewTrans({ desc: '', amount: 0, type: 'Entrata', species: 'Maiali' });
                  } catch (err) {
                    alert("Errore salvataggio movimento");
                  }
                }}
                className="mt-6 bg-emerald-600 text-white font-black rounded-2xl py-4 px-12 shadow-lg hover:bg-emerald-700 uppercase tracking-widest text-[10px]"
              >
                Aggiungi
              </button>
            </div>
          </div>
        )}

        {activeTab === 'births' && (
          <div className="bg-white p-10 rounded-[2.5rem] border shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-900 mb-8">
              Registra Parto
            </h3>

            <div className="flex flex-col md:flex-row gap-6 items-end">
              <div className="flex-1 w-full">
                <label className="text-[10px] font-black text-stone-400 mb-2 block uppercase">
                  Madre
                </label>
                <input
                  className="ui-input w-full"
                  value={newBirth.idCode}
                  onChange={e => setNewBirth({ ...newBirth, idCode: e.target.value })}
                />
              </div>

              <div className="w-full md:w-24">
                <label className="text-[10px] font-black text-stone-400 mb-2 block uppercase">
                  Nati
                </label>
                <input
                  type="number"
                  min="1"
                  className="ui-input w-full text-center"
                  value={newBirth.count}
                  onChange={e =>
                    setNewBirth({ ...newBirth, count: Number(e.target.value) || 1 })
                  }
                />
              </div>

              <div className="w-full md:w-48">
                <label className="text-[10px] font-black text-stone-400 mb-2 block uppercase">
                  Data
                </label>
                <input
                  type="date"
                  className="ui-input w-full"
                  value={newBirth.birthDate}
                  onChange={e => setNewBirth({ ...newBirth, birthDate: e.target.value })}
                />
              </div>

              <button
                onClick={handleSaveBirth}
                className="bg-emerald-600 text-white px-10 h-14 rounded-2xl font-black shadow-lg"
              >
                Salva e Crea
              </button>
            </div>
          </div>
        )}

        {activeTab === 'dinastia' && (
          <div className="space-y-12">
            {speciesList.map(species => {
              const founders = validAnimals.filter(
                a => a.species === species && !a.sire && !a.dam
              );
              if (founders.length === 0) return null;

              return (
                <div
                  key={species}
                  className="bg-white p-10 rounded-[3rem] border shadow-xl relative overflow-hidden"
                >
                  <h3 className="text-4xl font-black text-emerald-950 mb-10 border-b pb-6 uppercase italic tracking-tighter">
                    {species}
                  </h3>
                  <div className="relative z-10">
                    {founders.map(founder => (
                      <div key={founder.id} className="mb-10 last:mb-0">
                        <DynastyBranch animal={founder} allAnimals={validAnimals} level={0} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-10">
            {/* FORM NUOVO PRODOTTO */}
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-xl">
              <h3 className="text-xl font-black mb-8 italic">Magazzino</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  placeholder="Prodotto"
                  className="ui-input"
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                />
                <input
                  placeholder="Q.tà"
                  type="number"
                  min="0"
                  className="ui-input"
                  value={newProduct.quantity || ''}
                  onChange={e =>
                    setNewProduct({ ...newProduct, quantity: Number(e.target.value) || 0 })
                  }
                />
                <select
                  className="ui-input"
                  value={newProduct.unit}
                  onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })}
                >
                  <option>kg</option>
                  <option>litri</option>
                  <option>unità</option>
                </select>
                <button
                  onClick={handleAddProduct}
                  className="bg-emerald-600 text-white font-black rounded-2xl py-4 shadow-lg hover:bg-emerald-700 transition-all text-xs uppercase tracking-widest"
                >
                  Carica
                </button>
              </div>
            </div>

            {/* LISTA PRODOTTI */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {products.map(p => (
                <div
                  key={p.id}
                  className="bg-white p-8 rounded-[2rem] border border-stone-100 text-center shadow-sm relative group hover:border-emerald-200 transition-all"
                >
                  <div className="bg-emerald-50 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-emerald-600 mx-auto mb-6">
                    <Package size={32} />
                  </div>
                  <h4 className="font-black text-stone-800 uppercase tracking-tight text-xl mb-2">
                    {p.name}
                  </h4>
                  <div className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-full text-2xl font-black mb-6">
                    {p.quantity} <span className="text-xs uppercase font-bold">{p.unit}</span>
                  </div>
                  <div className="flex gap-2 justify-center pt-6 border-t border-stone-50">
                    <button
                      onClick={() => reduceProduct(p.id, 1)}
                      className="p-3 bg-stone-50 text-stone-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <MinusCircle size={24} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Eliminare prodotto?"))
                          deleteDoc(doc(db, 'products', p.id));
                      }}
                      className="p-3 bg-stone-50 text-stone-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab "tasks" non implementata nel codice originale → lasciato vuoto */}
      </main>
    </div>
  );
}
