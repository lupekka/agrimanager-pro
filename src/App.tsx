import React, { useState, useEffect } from "react";
import {
  PawPrint,
  CalendarDays,
  TrendingUp,
  TreeDeciduous,
  Baby,
  Milk,
  Save,
  Edit2,
  Trash2,
  Plus,
  History,
  Search,
  Menu,
  X,
  DollarSign,
  PlusCircle,
} from "lucide-react";

// --- CONFIGURAZIONE CLOUD COMPLETA ---
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD6ZxCO6BvGLKfsF235GSsLh-7GQm84Vdk",
  authDomain: "agrimanager-pro-e3cf7.firebaseapp.com",
  projectId: "agrimanager-pro-e3cf7",
  storageBucket: "agrimanager-pro-e3cf7.firebasestorage.app",
  messagingSenderId: "415553695665",
  appId: "1:415553695665:web:6e9ddd9f5241424afad790",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// -------------------------------------

type Species = "Maiali" | "Cavalli" | "Mucche" | "Galline" | "Oche";

interface Animal {
  id: string;
  name: string;
  species: Species;
  notes: string;
  sire?: string;
  dam?: string;
  birthDate?: string;
  quantity?: number;
}
interface BirthRecord {
  id: string;
  animalName: string;
  species: Species;
  date: string;
  offspringCount: number;
  birthDate: string;
}
interface Production {
  id: string;
  item: string;
  quantity: number;
  date: string;
  species: Species;
}
interface Transaction {
  id: string;
  type: "Entrata" | "Uscita";
  amount: number;
  desc: string;
  species: Species;
  date: string;
}
interface Task {
  id: string;
  text: string;
  done: boolean;
  date: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [births, setBirths] = useState<BirthRecord[]>([]);
  const [production, setProduction] = useState<Production[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [newTask, setNewTask] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [newAnimal, setNewAnimal] = useState({
    name: "",
    species: "Maiali" as Species,
    birthDate: "",
  });
  const [newBirth, setNewBirth] = useState({
    idCode: "",
    species: "Maiali" as Species,
    count: 1,
    birthDate: "",
  });
  const [newProd, setNewProd] = useState({
    item: "",
    quantity: 1,
    species: "Maiali" as Species,
  });
  const [newTrans, setNewTrans] = useState({
    desc: "",
    amount: 0,
    type: "Entrata" as "Entrata" | "Uscita",
    species: "Maiali" as Species,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: "", notes: "" });
  const [editParents, setEditParents] = useState({ sire: "", dam: "" });

  const speciesList: Species[] = [
    "Maiali",
    "Cavalli",
    "Mucche",
    "Galline",
    "Oche",
  ];

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    document.body.style.fontFamily = "'Inter', sans-serif";

    const unsubAnimals = onSnapshot(collection(db, "animals"), (snap) =>
      setAnimals(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Animal[])
    );
    const unsubBirths = onSnapshot(collection(db, "births"), (snap) =>
      setBirths(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as BirthRecord[]
      )
    );
    const unsubProd = onSnapshot(collection(db, "production"), (snap) =>
      setProduction(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Production[]
      )
    );
    const unsubTrans = onSnapshot(collection(db, "transactions"), (snap) =>
      setTransactions(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Transaction[]
      )
    );
    const unsubTasks = onSnapshot(collection(db, "tasks"), (snap) =>
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[])
    );

    return () => {
      unsubAnimals();
      unsubBirths();
      unsubProd();
      unsubTrans();
      unsubTasks();
    };
  }, []);

  const deleteFromCloud = async (collectionName: string, id: string) => {
    await deleteDoc(doc(db, collectionName, id));
  };
  const toggleTaskCloud = async (task: Task) => {
    await updateDoc(doc(db, "tasks", task.id), {
      done: !task.done,
      date: new Date().toLocaleDateString(),
    });
  };
  const saveAnimalEdit = async (id: string) => {
    await updateDoc(doc(db, "animals", id), {
      name: editData.name,
      notes: editData.notes,
    });
    setEditingId(null);
  };
  const saveParentsEdit = async (id: string) => {
    await updateDoc(doc(db, "animals", id), {
      sire: editParents.sire,
      dam: editParents.dam,
    });
    setEditingId(null);
  };

  const getBalance = (species: Species) =>
    transactions
      .filter((t) => t.species === species)
      .reduce(
        (acc, t) => acc + (t.type === "Entrata" ? t.amount : -t.amount),
        0
      );
  const getCount = (species: Species) =>
    animals
      .filter((a) => a.species === species)
      .reduce((acc, a) => acc + (a.quantity || 1), 0);

  const groupedTasks = tasks
    .filter(
      (t) => t.done && t.text.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .reduce((acc, task) => {
      acc[task.date] = acc[task.date] || [];
      acc[task.date].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const navItems = [
    { id: "inventory", label: "Inventario Capi", icon: PawPrint },
    { id: "births", label: "Registro Parti", icon: Baby },
    { id: "production", label: "Produzione", icon: Milk },
    { id: "genealogy", label: "Genealogia", icon: TreeDeciduous },
    { id: "finance", label: "Economia", icon: TrendingUp },
    { id: "tasks", label: "Attività", icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-stone-100/50 text-stone-900 overflow-hidden antialiased">
      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden bg-white border-b border-stone-200 p-4 flex justify-between items-center z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-inner">
            <DollarSign size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-emerald-950">
            AgriManage <span className="text-emerald-600">Pro</span>
          </h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700"
        >
          <Menu size={24} />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-emerald-950/40 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-white md:border-r border-stone-200 p-6 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex justify-between items-center mb-10 pb-2 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg shadow-emerald-200">
              <DollarSign size={24} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tighter text-emerald-950">
              AgriManage<span className="text-emerald-600">Pro</span>
            </h1>
          </div>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-stone-100 text-stone-500"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3.5 w-full p-3.5 rounded-xl font-medium transition-all duration-150 ${
                activeTab === item.id
                  ? "bg-emerald-50 text-emerald-700 shadow-inner"
                  : "text-stone-700 hover:bg-stone-100 hover:text-emerald-800"
              }`}
            >
              <item.icon
                size={22}
                className={`${
                  activeTab === item.id ? "text-emerald-600" : "text-stone-400"
                }`}
              />
              <span className="text-base">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-stone-100 text-center text-xs text-stone-400">
          © 2026 AgriManage Pro v2.5
        </div>
      </aside>

      {/* --- CONTENUTO --- */}
      <main className="flex-1 p-4 md:p-10 h-[calc(100vh-69px)] md:h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200">
        <div className="mb-8 pb-4 border-b border-stone-200">
          <p className="text-sm font-medium text-emerald-600">
            Gestione Azienda Agricola
          </p>
          <h2 className="text-4xl font-extrabold tracking-tighter text-emerald-950">
            {navItems.find((i) => i.id === activeTab)?.label}
          </h2>
        </div>

        {activeTab === "inventory" && (
          <div className="space-y-10">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <PlusCircle className="text-emerald-500" size={24} />
                <h3 className="text-xl font-bold text-emerald-950">
                  Registra un nuovo capo
                </h3>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  placeholder="Codice o Nome Capo"
                  className="ui-input flex-1"
                  value={newAnimal.name}
                  onChange={(e) =>
                    setNewAnimal({ ...newAnimal, name: e.target.value })
                  }
                />
                <input
                  type="date"
                  className="ui-input md:w-48"
                  value={newAnimal.birthDate}
                  onChange={(e) =>
                    setNewAnimal({ ...newAnimal, birthDate: e.target.value })
                  }
                />
                <select
                  className="ui-input md:w-48"
                  value={newAnimal.species}
                  onChange={(e) =>
                    setNewAnimal({
                      ...newAnimal,
                      species: e.target.value as Species,
                    })
                  }
                >
                  {speciesList.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    if (!newAnimal.name) return;
                    await addDoc(collection(db, "animals"), {
                      ...newAnimal,
                      notes: "",
                      quantity: 1,
                      sire: "",
                      dam: "",
                    });
                    setNewAnimal({
                      name: "",
                      species: "Maiali",
                      birthDate: "",
                    });
                  }}
                  className="ui-button-primary"
                >
                  Aggiungi Capo
                </button>
              </div>
            </div>

            {speciesList.map((species) => (
              <div key={species}>
                <div className="flex justify-between items-center mb-5 pb-2 border-b border-stone-200/70">
                  <h3 className="text-2xl font-extrabold text-emerald-950 tracking-tight">
                    {species}
                  </h3>
                  <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm shadow-inner">
                    {getCount(species)} capi
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {animals
                    .filter((a) => a.species === species)
                    .map((a) => (
                      <div
                        key={a.id}
                        className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:border-emerald-100 hover:shadow-lg transition-all duration-200 group relative"
                      >
                        {editingId === a.id ? (
                          <div className="space-y-3">
                            <input
                              className="ui-input w-full"
                              value={editData.name}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  name: e.target.value,
                                })
                              }
                            />
                            <textarea
                              className="ui-input w-full text-sm h-20 resize-none"
                              value={editData.notes}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  notes: e.target.value,
                                })
                              }
                              placeholder="Note..."
                            />
                            <button
                              onClick={() => saveAnimalEdit(a.id)}
                              className="ui-button-primary w-full py-2"
                            >
                              Salva
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-xl font-bold text-emerald-950 truncate flex-1 pr-2">
                                {a.name}
                              </h4>
                              {a.quantity && a.quantity > 1 && (
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                                  x{a.quantity}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-stone-500 space-y-1 mb-4">
                              <p className="flex items-center gap-1.5">
                                <CalendarDays
                                  size={14}
                                  className="text-stone-400"
                                />{" "}
                                Nato il:{" "}
                                <span className="font-medium text-stone-700">
                                  {a.birthDate || "N/D"}
                                </span>
                              </p>
                              {a.notes && (
                                <p className="text-xs italic bg-stone-50 p-2.5 rounded-lg border border-stone-100 text-stone-600 mt-2">
                                  {a.notes}
                                </p>
                              )}
                            </div>
                            <div className="absolute top-4 right-4 flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingId(a.id);
                                  setEditData({ name: a.name, notes: a.notes });
                                }}
                                className="p-1.5 rounded-lg bg-stone-100 hover:bg-emerald-100 text-stone-500 hover:text-emerald-700 transition"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => deleteFromCloud("animals", a.id)}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-700 transition"
                              >
                                <Trash2 size={16} />
                              </button>
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

        {activeTab === "births" && (
          <div className="space-y-8">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <PlusCircle className="text-emerald-500" size={24} />
                <h3 className="text-xl font-bold text-emerald-950">
                  Registra parto
                </h3>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  placeholder="Codice Madre"
                  className="ui-input flex-1"
                  value={newBirth.idCode}
                  onChange={(e) =>
                    setNewBirth({ ...newBirth, idCode: e.target.value })
                  }
                />
                <div className="flex gap-4">
                  <input
                    type="number"
                    placeholder="N°"
                    className="ui-input w-20"
                    value={newBirth.count}
                    onChange={(e) =>
                      setNewBirth({
                        ...newBirth,
                        count: parseInt(e.target.value),
                      })
                    }
                  />
                  <input
                    type="date"
                    className="ui-input flex-1 md:w-44"
                    value={newBirth.birthDate}
                    onChange={(e) =>
                      setNewBirth({ ...newBirth, birthDate: e.target.value })
                    }
                  />
                </div>
                <select
                  className="ui-input md:w-44"
                  value={newBirth.species}
                  onChange={(e) =>
                    setNewBirth({
                      ...newBirth,
                      species: e.target.value as Species,
                    })
                  }
                >
                  {speciesList.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    if (!newBirth.idCode) return;
                    await addDoc(collection(db, "births"), {
                      animalName: newBirth.idCode,
                      species: newBirth.species,
                      date: new Date().toLocaleDateString(),
                      offspringCount: newBirth.count,
                      birthDate: newBirth.birthDate,
                    });
                    await addDoc(collection(db, "animals"), {
                      name: `Cuccioli di ${newBirth.idCode}`,
                      species: newBirth.species,
                      notes: "Nati in azienda",
                      birthDate: newBirth.birthDate,
                      quantity: newBirth.count,
                      sire: "",
                      dam: "",
                    });
                    setNewBirth({
                      idCode: "",
                      species: "Maiali",
                      count: 1,
                      birthDate: "",
                    });
                  }}
                  className="ui-button-primary"
                >
                  Registra
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm divide-y divide-stone-100">
              {births.map((b) => (
                <div
                  key={b.id}
                  className="p-5 flex flex-col md:flex-row md:justify-between gap-3 group hover:bg-emerald-50/30 transition"
                >
                  <div>
                    <p className="font-bold text-emerald-950 text-lg">
                      {b.animalName}{" "}
                      <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 ml-1">
                        {b.species}
                      </span>
                    </p>
                    <p className="text-sm text-stone-500 flex items-center gap-1.5 mt-1">
                      <Baby size={16} className="text-emerald-500" />{" "}
                      <span className="font-bold text-emerald-700">
                        {b.offspringCount} nati
                      </span>{" "}
                      il {b.birthDate}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteFromCloud("births", b.id)}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-700 transition self-end md:self-center md:opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "production" && (
          <div className="space-y-8">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <PlusCircle className="text-emerald-500" size={24} />
                <h3 className="text-xl font-bold text-emerald-950">
                  Produzione giornaliera
                </h3>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  placeholder="Prodotto"
                  className="ui-input flex-1"
                  value={newProd.item}
                  onChange={(e) =>
                    setNewProd({ ...newProd, item: e.target.value })
                  }
                />
                <div className="flex gap-4">
                  <input
                    type="number"
                    placeholder="Q.tà"
                    className="ui-input w-28"
                    value={newProd.quantity}
                    onChange={(e) =>
                      setNewProd({
                        ...newProd,
                        quantity: parseInt(e.target.value),
                      })
                    }
                  />
                  <select
                    className="ui-input flex-1 md:w-44"
                    value={newProd.species}
                    onChange={(e) =>
                      setNewProd({
                        ...newProd,
                        species: e.target.value as Species,
                      })
                    }
                  >
                    {speciesList.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={async () => {
                    if (!newProd.item) return;
                    await addDoc(collection(db, "production"), {
                      ...newProd,
                      date: new Date().toLocaleDateString(),
                    });
                    setNewProd({ item: "", quantity: 1, species: "Maiali" });
                  }}
                  className="ui-button-primary"
                >
                  Salva
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm divide-y divide-stone-100">
              {production.map((p) => (
                <div
                  key={p.id}
                  className="p-5 flex justify-between items-center hover:bg-emerald-50/30 transition group"
                >
                  <div>
                    <p className="font-bold text-emerald-950 text-lg">
                      {p.item}{" "}
                      <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 ml-1">
                        {p.species}
                      </span>
                    </p>
                    <p className="text-sm text-stone-500 flex items-center gap-1.5 mt-1">
                      <Milk size={16} className="text-emerald-500" />{" "}
                      <span className="font-bold text-emerald-700 text-base">
                        {p.quantity} unità
                      </span>{" "}
                      il {p.date}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteFromCloud("production", p.id)}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-700 transition md:opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "genealogy" && (
          <div className="space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
            <h3 className="text-2xl font-bold text-emerald-950 mb-6 flex items-center gap-2">
              <TreeDeciduous className="text-emerald-600" /> Albero Genealogico
              (Cavalli)
            </h3>
            {animals
              .filter((a) => a.species === "Cavalli")
              .map((a) => (
                <div
                  key={a.id}
                  className="p-5 bg-stone-50 rounded-xl border border-stone-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4 hover:border-emerald-100 transition"
                >
                  <div>
                    <strong className="text-lg text-emerald-950">
                      {a.name}
                    </strong>
                    <p className="text-sm text-stone-500 mt-1">
                      Padre:{" "}
                      <span className="font-medium text-stone-700">
                        {a.sire || "N/D"}
                      </span>{" "}
                      | Madre:{" "}
                      <span className="font-medium text-stone-700">
                        {a.dam || "N/D"}
                      </span>
                    </p>
                  </div>
                  {editingId === a.id ? (
                    <div className="flex gap-2 w-full md:w-auto">
                      <input
                        placeholder="Padre"
                        className="ui-input flex-1 md:w-32 py-1.5 text-sm"
                        value={editParents.sire}
                        onChange={(e) =>
                          setEditParents({
                            ...editParents,
                            sire: e.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Madre"
                        className="ui-input flex-1 md:w-32 py-1.5 text-sm"
                        value={editParents.dam}
                        onChange={(e) =>
                          setEditParents({
                            ...editParents,
                            dam: e.target.value,
                          })
                        }
                      />
                      <button
                        onClick={() => saveParentsEdit(a.id)}
                        className="p-2 bg-emerald-600 rounded-lg text-white hover:bg-emerald-700"
                      >
                        <Save size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(a.id);
                        setEditParents({
                          sire: a.sire || "",
                          dam: a.dam || "",
                        });
                      }}
                      className="ui-button-secondary py-1.5 px-4 text-sm"
                    >
                      Modifica Genitori
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}

        {activeTab === "finance" && (
          <div className="space-y-10">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <PlusCircle className="text-emerald-500" size={24} />
                <h3 className="text-xl font-bold text-emerald-950">
                  Nuova transazione
                </h3>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  placeholder="Descrizione"
                  className="ui-input flex-1"
                  value={newTrans.desc}
                  onChange={(e) =>
                    setNewTrans({ ...newTrans, desc: e.target.value })
                  }
                />
                <div className="flex gap-4">
                  <div className="relative flex-1 md:w-32">
                    <DollarSign
                      size={16}
                      className="absolute left-3 top-3.5 text-stone-400"
                    />
                    <input
                      type="number"
                      placeholder="Importo"
                      className="ui-input w-full pl-9"
                      value={newTrans.amount}
                      onChange={(e) =>
                        setNewTrans({
                          ...newTrans,
                          amount: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <select
                    className="ui-input flex-1 md:w-36"
                    value={newTrans.type}
                    onChange={(e) =>
                      setNewTrans({
                        ...newTrans,
                        type: e.target.value as "Entrata" | "Uscita",
                      })
                    }
                  >
                    <option>Entrata</option>
                    <option>Uscita</option>
                  </select>
                </div>
                <select
                  className="ui-input md:w-44"
                  value={newTrans.species}
                  onChange={(e) =>
                    setNewTrans({
                      ...newTrans,
                      species: e.target.value as Species,
                    })
                  }
                >
                  {speciesList.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    if (!newTrans.desc) return;
                    await addDoc(collection(db, "transactions"), {
                      ...newTrans,
                      date: new Date().toLocaleDateString(),
                    });
                    setNewTrans({
                      desc: "",
                      amount: 0,
                      type: "Entrata",
                      species: "Maiali",
                    });
                  }}
                  className="ui-button-primary"
                >
                  Salva
                </button>
              </div>
            </div>

            {speciesList.map((species) => (
              <div key={species}>
                <div className="flex justify-between items-center mb-5 pb-2 border-b border-stone-200/70">
                  <h3 className="text-2xl font-extrabold text-emerald-950 tracking-tight">
                    {species}
                  </h3>
                  <div className="text-right">
                    <p className="text-xs text-stone-400 font-medium">
                      Bilancio
                    </p>
                    <span
                      className={`font-bold text-lg ${
                        getBalance(species) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(getBalance(species))}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm divide-y divide-stone-100">
                  {transactions
                    .filter((t) => t.species === species)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="p-5 flex justify-between items-center hover:bg-stone-50/50 transition group"
                      >
                        <div>
                          <p className="font-semibold text-stone-800 text-base">
                            {t.desc}
                          </p>
                          <p className="text-xs text-stone-400 mt-1">
                            {t.date}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-bold text-base px-3 py-1 rounded-lg ${
                              t.type === "Entrata"
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {t.type === "Entrata" ? "+" : "-"}
                            {formatCurrency(t.amount)}
                          </span>
                          <button
                            onClick={() =>
                              deleteFromCloud("transactions", t.id)
                            }
                            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-700 transition md:opacity-0 group-hover:opacity-100 shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-10 items-start">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
              <h3 className="text-2xl font-bold text-emerald-950 mb-6 flex items-center gap-2.5">
                <CalendarDays className="text-emerald-600" /> Da fare oggi
              </h3>
              <div className="flex flex-col md:flex-row gap-3 mb-6 pb-6 border-b border-stone-100">
                <input
                  className="ui-input flex-1 py-2.5"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Nuova attività..."
                />
                <button
                  onClick={async () => {
                    if (newTask) {
                      await addDoc(collection(db, "tasks"), {
                        text: newTask,
                        done: false,
                        date: "",
                      });
                      setNewTask("");
                    }
                  }}
                  className="ui-button-primary py-2.5 flex justify-center items-center gap-2"
                >
                  <PlusCircle size={20} /> Aggiungi
                </button>
              </div>
              <div className="space-y-1">
                {tasks
                  .filter((t) => !t.done)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-emerald-50/50 transition group"
                    >
                      <div className="flex items-center gap-3.5">
                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-emerald-600 cursor-pointer"
                          checked={t.done}
                          onChange={() => toggleTaskCloud(t)}
                        />
                        <span className="text-base text-stone-800 font-medium">
                          {t.text}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteFromCloud("tasks", t.id)}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-700 transition md:opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 pb-2 border-b border-stone-100">
                <h3 className="text-xl font-bold flex items-center gap-2.5 text-stone-700">
                  <History size={20} className="text-stone-400" /> Storico
                  Completate
                </h3>
                <div className="relative">
                  <Search
                    className="absolute left-3.5 top-3 text-stone-400"
                    size={18}
                  />
                  <input
                    className="ui-input pl-11 py-2 text-sm w-full md:w-auto"
                    placeholder="Cerca..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-100">
                {Object.entries(groupedTasks).map(([date, dailyTasks]) => (
                  <div key={date}>
                    <h4 className="font-bold text-emerald-900 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-100 mb-2.5 flex justify-between items-center text-sm">
                      {date}
                    </h4>
                    <div className="space-y-1.5 pl-1">
                      {dailyTasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between group/history py-1"
                        >
                          <p className="text-sm text-stone-600 flex items-center gap-2">
                            •{" "}
                            <span className="line-through text-stone-400">
                              {t.text}
                            </span>
                          </p>
                          <button
                            onClick={() => deleteFromCloud("tasks", t.id)}
                            className="p-1.5 rounded-md bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-700 transition opacity-0 group-hover/history:opacity-100 md:opacity-100 shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
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
