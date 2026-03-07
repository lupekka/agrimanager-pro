import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
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

  // STATI GESTITI AL 100% DAL CLOUD
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

  // --- SINCRONIZZAZIONE DI TUTTE LE SEZIONI ---
  useEffect(() => {
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

  // --- FUNZIONI CLOUD (Elimina e Aggiorna) ---
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
  // -------------------------------------------

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

  const completedTasks = tasks.filter(
    (t) => t.done && t.text.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const groupedTasks = completedTasks.reduce((acc, task) => {
    acc[task.date] = acc[task.date] || [];
    acc[task.date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="min-h-screen flex bg-stone-50">
      <aside className="w-64 bg-emerald-900 text-emerald-50 p-6">
        <h1 className="text-2xl font-bold mb-10">AgriManage Pro</h1>
        <nav className="space-y-2">
          {[
            { id: "inventory", label: "Inventario", icon: PawPrint },
            { id: "births", label: "Registro Parti", icon: Baby },
            { id: "production", label: "Produzione", icon: Milk },
            { id: "genealogy", label: "Genealogia", icon: TreeDeciduous },
            { id: "finance", label: "Economia", icon: TrendingUp },
            { id: "tasks", label: "Attività", icon: CalendarDays },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 w-full p-3 rounded-lg ${
                activeTab === item.id
                  ? "bg-emerald-700"
                  : "hover:bg-emerald-800"
              }`}
            >
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        {activeTab === "inventory" && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <h3 className="font-bold mb-4">Registra Nuovo Capo</h3>
              <div className="flex gap-4">
                <input
                  placeholder="Nome/ID"
                  className="border p-2 rounded flex-1"
                  value={newAnimal.name}
                  onChange={(e) =>
                    setNewAnimal({ ...newAnimal, name: e.target.value })
                  }
                />
                <input
                  type="date"
                  className="border p-2 rounded"
                  value={newAnimal.birthDate}
                  onChange={(e) =>
                    setNewAnimal({ ...newAnimal, birthDate: e.target.value })
                  }
                />
                <select
                  className="border p-2 rounded"
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
                    });
                    setNewAnimal({
                      name: "",
                      species: "Maiali",
                      birthDate: "",
                    });
                  }}
                  className="bg-emerald-600 text-white px-4 py-2 rounded"
                >
                  Salva
                </button>
              </div>
            </div>
            {speciesList.map((species) => (
              <div key={species}>
                <h3 className="text-xl font-bold text-emerald-900 mb-4">
                  {species} ({getCount(species)})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {animals
                    .filter((a) => a.species === species)
                    .map((a) => (
                      <div
                        key={a.id}
                        className="bg-white p-4 rounded-lg border shadow-sm"
                      >
                        {editingId === a.id ? (
                          <div className="space-y-2">
                            <input
                              className="border p-1 w-full"
                              value={editData.name}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  name: e.target.value,
                                })
                              }
                            />
                            <textarea
                              className="border p-1 w-full text-xs"
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
                              className="bg-emerald-600 text-white px-2 py-1 rounded text-xs"
                            >
                              Salva
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold">
                                {a.name}{" "}
                                {a.quantity && a.quantity > 1
                                  ? `(x${a.quantity})`
                                  : ""}
                              </h4>
                              <p className="text-xs text-stone-500">
                                Nato il: {a.birthDate || "N/D"}
                              </p>
                              <p className="text-xs italic mt-1">{a.notes}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingId(a.id);
                                  setEditData({ name: a.name, notes: a.notes });
                                }}
                                className="text-stone-400"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => deleteFromCloud("animals", a.id)}
                                className="text-red-400"
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
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <h3 className="font-bold mb-4">Registra Parto</h3>
              <div className="flex gap-4">
                <input
                  placeholder="Codice ID Madre/Cucciolata"
                  className="border p-2 rounded"
                  value={newBirth.idCode}
                  onChange={(e) =>
                    setNewBirth({ ...newBirth, idCode: e.target.value })
                  }
                />
                <input
                  type="number"
                  className="border p-2 rounded w-16"
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
                  className="border p-2 rounded"
                  value={newBirth.birthDate}
                  onChange={(e) =>
                    setNewBirth({ ...newBirth, birthDate: e.target.value })
                  }
                />
                <select
                  className="border p-2 rounded"
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
                    // 1. Salva il record del parto
                    await addDoc(collection(db, "births"), {
                      animalName: newBirth.idCode,
                      species: newBirth.species,
                      date: new Date().toLocaleDateString(),
                      offspringCount: newBirth.count,
                      birthDate: newBirth.birthDate,
                    });
                    // 2. Aggiunge i nuovi cuccioli all'inventario animali in automatico
                    await addDoc(collection(db, "animals"), {
                      name: `Cuccioli di ${newBirth.idCode}`,
                      species: newBirth.species,
                      notes: "Nati in azienda",
                      birthDate: newBirth.birthDate,
                      quantity: newBirth.count,
                    });

                    setNewBirth({
                      idCode: "",
                      species: "Maiali",
                      count: 1,
                      birthDate: "",
                    });
                  }}
                  className="bg-emerald-600 text-white px-4 py-2 rounded"
                >
                  Registra
                </button>
              </div>
            </div>
            {births.map((b) => (
              <div
                key={b.id}
                className="bg-white p-4 border-b flex justify-between"
              >
                {b.date}: {b.animalName} ({b.species}, {b.offspringCount} nati
                il {b.birthDate}){" "}
                <button
                  onClick={() => deleteFromCloud("births", b.id)}
                  className="text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "production" && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <h3 className="font-bold mb-4">Registra Produzione</h3>
              <div className="flex gap-4">
                <input
                  placeholder="Prodotto (es. Latte, Uova)"
                  className="border p-2 rounded flex-1"
                  value={newProd.item}
                  onChange={(e) =>
                    setNewProd({ ...newProd, item: e.target.value })
                  }
                />
                <input
                  type="number"
                  className="border p-2 rounded w-20"
                  value={newProd.quantity}
                  onChange={(e) =>
                    setNewProd({
                      ...newProd,
                      quantity: parseInt(e.target.value),
                    })
                  }
                />
                <select
                  className="border p-2 rounded"
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

                <button
                  onClick={async () => {
                    if (!newProd.item) return;
                    await addDoc(collection(db, "production"), {
                      ...newProd,
                      date: new Date().toLocaleDateString(),
                    });
                    setNewProd({ item: "", quantity: 1, species: "Maiali" });
                  }}
                  className="bg-emerald-600 text-white px-4 py-2 rounded"
                >
                  Salva
                </button>
              </div>
            </div>
            {production.map((p) => (
              <div
                key={p.id}
                className="bg-white p-4 border-b flex justify-between"
              >
                {p.date}: {p.quantity} {p.item} ({p.species}){" "}
                <button
                  onClick={() => deleteFromCloud("production", p.id)}
                  className="text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "genealogy" && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            <h3 className="font-bold mb-4">Albero Genealogico (Cavalli)</h3>
            {animals
              .filter((a) => a.species === "Cavalli")
              .map((a) => (
                <div
                  key={a.id}
                  className="p-4 border-b flex justify-between items-center"
                >
                  <div>
                    <strong>{a.name}</strong>
                    <p className="text-xs text-stone-500">
                      Padre: {a.sire || "N/D"} | Madre: {a.dam || "N/D"}
                    </p>
                  </div>
                  {editingId === a.id ? (
                    <div className="flex gap-2">
                      <input
                        placeholder="Padre"
                        className="border p-1 w-20"
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
                        className="border p-1 w-20"
                        value={editParents.dam}
                        onChange={(e) =>
                          setEditParents({
                            ...editParents,
                            dam: e.target.value,
                          })
                        }
                      />
                      <button onClick={() => saveParentsEdit(a.id)}>
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
                      className="text-xs bg-stone-100 px-2 py-1 rounded"
                    >
                      Modifica
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}

        {activeTab === "finance" && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <h3 className="font-bold mb-4">Registra Transazione</h3>
              <div className="flex gap-4">
                <input
                  placeholder="Descrizione spesa/ricavo"
                  className="border p-2 rounded flex-1"
                  value={newTrans.desc}
                  onChange={(e) =>
                    setNewTrans({ ...newTrans, desc: e.target.value })
                  }
                />
                <input
                  type="number"
                  className="border p-2 rounded w-24"
                  value={newTrans.amount}
                  onChange={(e) =>
                    setNewTrans({
                      ...newTrans,
                      amount: parseInt(e.target.value),
                    })
                  }
                />
                <select
                  className="border p-2 rounded"
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
                <select
                  className="border p-2 rounded"
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
                  className="bg-emerald-600 text-white px-4 py-2 rounded"
                >
                  Salva
                </button>
              </div>
            </div>
            {speciesList.map((species) => (
              <div key={species}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-emerald-900">
                    {species}
                  </h3>
                  <span
                    className={`font-bold ${
                      getBalance(species) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    Bilancio: {getBalance(species)}€
                  </span>
                </div>
                {transactions
                  .filter((t) => t.species === species)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="bg-white p-4 border-b flex justify-between"
                    >
                      {t.desc}: {t.type === "Entrata" ? "+" : "-"}
                      {t.amount}€{" "}
                      <button
                        onClick={() => deleteFromCloud("transactions", t.id)}
                        className="text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <h3 className="font-bold mb-4">Attività Quotidiane</h3>
              <div className="flex gap-2 mb-4">
                <input
                  className="border p-2 rounded flex-1"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Cosa c'è da fare oggi?..."
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
                  className="bg-emerald-600 text-white px-4 py-2 rounded"
                >
                  <Plus size={20} />
                </button>
              </div>
              {tasks
                .filter((t) => !t.done)
                .map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-2 border-b"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={() => toggleTaskCloud(t)}
                      />
                      <span>{t.text}</span>
                    </div>
                    <button
                      onClick={() => deleteFromCloud("tasks", t.id)}
                      className="text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <History size={20} /> Storico Attività
                </h3>
                <div className="relative">
                  <Search
                    className="absolute left-2 top-2.5 text-stone-400"
                    size={16}
                  />
                  <input
                    className="border pl-8 p-2 rounded"
                    placeholder="Cerca storico..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              {Object.entries(groupedTasks).map(([date, dailyTasks]) => (
                <div key={date} className="mb-4">
                  <h4 className="font-semibold text-emerald-800 border-b">
                    {date}
                  </h4>
                  {dailyTasks.map((t) => (
                    <p key={t.id} className="text-sm text-stone-600 py-1">
                      • {t.text}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
