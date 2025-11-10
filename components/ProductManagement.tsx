
import React, { useState } from 'react';
import { Category, Product, Event, Transaction, BackupData } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, CalendarDaysIcon, XMarkIcon, ListBulletIcon } from '@heroicons/react/24/outline';

interface ProductManagementProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  activeEventId: string | null;
  setActiveEventId: React.Dispatch<React.SetStateAction<string | null>>;
  eventProducts: Record<string, string[]>;
  setEventProducts: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const ProductAssignmentModal: React.FC<{
    event: Event;
    allProducts: Product[];
    eventProducts: string[];
    onSave: (productIds: string[]) => void;
    onClose: () => void;
}> = ({ event, allProducts, eventProducts: initialEventProducts, onSave, onClose }) => {
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set(initialEventProducts));

    const handleToggleProduct = (productId: string) => {
        setSelectedProductIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };
    
    const handleSave = () => {
        onSave(Array.from(selectedProductIds));
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Produkte für "{event.name}" zuweisen</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </header>
                <main className="p-6 overflow-y-auto">
                    <div className="space-y-2">
                        {allProducts.map(product => (
                            <label key={product.id} className="flex items-center bg-gray-700 p-3 rounded-md cursor-pointer hover:bg-gray-600">
                                <input
                                    type="checkbox"
                                    checked={selectedProductIds.has(product.id)}
                                    onChange={() => handleToggleProduct(product.id)}
                                    className="h-5 w-5 rounded bg-gray-900 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="ml-4 font-semibold text-white">{product.name}</span>
                                <span className="ml-auto text-gray-400">{product.price.toFixed(2)} €</span>
                            </label>
                        ))}
                    </div>
                </main>
                <footer className="p-4 border-t border-gray-700 text-right">
                    <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg">
                        Speichern
                    </button>
                </footer>
            </div>
        </div>
    );
};


const ProductManagement: React.FC<ProductManagementProps> = (props) => {
  const { categories, setCategories, products, setProducts, events, setEvents, activeEventId, setActiveEventId, eventProducts, setEventProducts, setTransactions } = props;

  // Component State
  const [newCategory, setNewCategory] = useState('');
  const [newProduct, setNewProduct] = useState<{name: string; price: string; categoryId: string; image?: string}>({ name: '', price: '', categoryId: '', image: undefined });
  const [newEvent, setNewEvent] = useState({ name: '', date: '' });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [managingEvent, setManagingEvent] = useState<Event | null>(null);


  // Category Handlers
  const handleAddCategory = () => {
    if (newCategory.trim() === '') return;
    if (editingCategory) {
      setCategories(cats => cats.map(c => c.id === editingCategory.id ? { ...c, name: newCategory } : c));
      setEditingCategory(null);
    } else {
      setCategories(cats => [...cats, { id: Date.now().toString(), name: newCategory }]);
    }
    setNewCategory('');
  };

  const handleDeleteCategory = (id: string) => {
    if(window.confirm('Möchten Sie diese Kategorie wirklich löschen? Alle zugehörigen Produkte werden ebenfalls entfernt.')) {
      setCategories(cats => cats.filter(c => c.id !== id));
      setProducts(prods => prods.filter(p => p.categoryId !== id));
    }
  };

  // Product Handlers
  const handleAddProduct = () => {
    if (newProduct.name.trim() === '' || !newProduct.price || !newProduct.categoryId) return;
    const price = parseFloat(newProduct.price);
    if (isNaN(price)) return;
    
    if(editingProduct) {
        setProducts(prods => prods.map(p => p.id === editingProduct.id ? {...editingProduct, name: newProduct.name, price, categoryId: newProduct.categoryId, image: newProduct.image} : p));
        setEditingProduct(null);
    } else {
        setProducts(prods => [...prods, { id: Date.now().toString(), name: newProduct.name, price, categoryId: newProduct.categoryId, image: newProduct.image }]);
    }
    setNewProduct({ name: '', price: '', categoryId: categories[0]?.id || '', image: undefined });
  };
  
  const handleDeleteProduct = (id: string) => {
    setProducts(prods => prods.filter(p => p.id !== id));
  };
  
  // Event Handlers
  const handleAddEvent = () => {
      if(newEvent.name.trim() === '' || newEvent.date.trim() === '') return;
      const newEventObject = { id: Date.now().toString(), ...newEvent };
      setEvents(evs => [...evs, newEventObject]);
      setEventProducts(ep => ({...ep, [newEventObject.id]: []}));
      setNewEvent({ name: '', date: ''});
  };

  const handleDeleteEvent = (id: string) => {
      if(window.confirm('Möchten Sie diese Veranstaltung wirklich löschen? Alle zugehörigen Verkaufsdaten werden ebenfalls entfernt (aber nicht die Produkte selbst).')) {
          setEvents(evs => evs.filter(e => e.id !== id));
          if(activeEventId === id) {
              setActiveEventId(null);
          }
          const newEventProducts = {...eventProducts};
          delete newEventProducts[id];
          setEventProducts(newEventProducts);
          // Note: Transactions are not deleted here, they are just orphaned. A real app might handle this differently.
      }
  };

  const handleUpdateEventProducts = (event: Event, productIds: string[]) => {
      setEventProducts(ep => ({
          ...ep,
          [event.id]: productIds,
      }));
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert('Das Bild ist zu groß. Bitte wählen Sie ein Bild, das kleiner als 2MB ist.');
            return;
        }
        try {
            const base64 = await fileToBase64(file);
            setNewProduct({ ...newProduct, image: base64 });
        } catch (error) {
            console.error("Fehler bei der Konvertierung der Datei in Base64", error);
            alert('Fehler beim Verarbeiten des Bildes.');
        }
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("File could not be read as text");

            const data: BackupData = JSON.parse(text);

            if (!data.categories || !data.products || !data.events || !data.transactions || data.eventProducts === undefined || data.activeEventId === undefined) {
                throw new Error("Ungültige Backup-Datei. Wichtige Felder fehlen.");
            }

            if (window.confirm("Möchten Sie wirklich die Daten aus der Datei importieren? Alle aktuellen Daten in der App werden unwiderruflich überschrieben!")) {
                setCategories(data.categories);
                setProducts(data.products);
                setEvents(data.events);
                setTransactions(data.transactions);
                setActiveEventId(data.activeEventId);
                setEventProducts(data.eventProducts);

                alert("Daten erfolgreich importiert. Die App wird neu geladen, um die Änderungen zu übernehmen.");
                window.location.reload();
            }
        } catch (error) {
            console.error("Fehler beim Importieren der Daten:", error);
            alert(`Fehler beim Import: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {managingEvent && (
        <ProductAssignmentModal 
            event={managingEvent}
            allProducts={products}
            eventProducts={eventProducts[managingEvent.id] || []}
            onSave={(productIds) => handleUpdateEventProducts(managingEvent, productIds)}
            onClose={() => setManagingEvent(null)}
        />
      )}

      {/* Event Management */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><CalendarDaysIcon className="h-6 w-6"/>Veranstaltungen verwalten</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input type="text" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} placeholder="Name der Veranstaltung" className="md:col-span-2 bg-gray-700 rounded-md px-3 py-2"/>
          <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="bg-gray-700 rounded-md px-3 py-2"/>
        </div>
        <button onClick={handleAddEvent} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
            <PlusIcon className="h-5 w-5" /> Veranstaltung hinzufügen
        </button>
        <ul className="space-y-2 mt-6">
            {events.map(event => (
                <li key={event.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-700 p-3 rounded-md gap-2">
                    <div>
                        <span className="font-semibold">{event.name}</span>
                        <span className="text-gray-400 ml-2 text-sm">{new Date(event.date).toLocaleDateString('de-DE')}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => setManagingEvent(event)} className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1"><ListBulletIcon className="h-4 w-4"/>Produkte</button>
                        <button onClick={() => setActiveEventId(event.id)} disabled={activeEventId === event.id} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed">Aktivieren</button>
                        <button onClick={() => handleDeleteEvent(event.id)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="h-5 w-5"/></button>
                    </div>
                </li>
            ))}
        </ul>
      </div>

      {/* Category Management */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Stamm-Kategorien</h2>
        <div className="flex gap-4 mb-4">
          <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Neue Kategorie" className="flex-grow bg-gray-700 rounded-md px-3 py-2"/>
          <button onClick={handleAddCategory} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
            <PlusIcon className="h-5 w-5" /> {editingCategory ? 'Speichern' : 'Hinzufügen'}
          </button>
        </div>
        <ul className="space-y-2">
          {categories.map(cat => (
            <li key={cat.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-md">
              <span>{cat.name}</span>
              <div className="space-x-2">
                <button onClick={() => { setEditingCategory(cat); setNewCategory(cat.name);}} className="p-2 text-gray-400 hover:text-yellow-400"><PencilIcon className="h-5 w-5"/></button>
                <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="h-5 w-5"/></button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Product Management */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Stamm-Produkte</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
          <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Produktname" className="md:col-span-2 bg-gray-700 rounded-md px-3 py-2" />
          <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="Preis (€)" className="bg-gray-700 rounded-md px-3 py-2" />
          <select value={newProduct.categoryId} onChange={e => setNewProduct({...newProduct, categoryId: e.target.value})} className="bg-gray-700 rounded-md px-3 py-2">
            <option value="">Kategorie wählen</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Produktbild</label>
            <div className="flex items-center gap-4">
                {newProduct.image && <img src={newProduct.image} alt="Vorschau" className="h-16 w-16 rounded-md object-cover"/>}
                <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-gray-200 hover:file:bg-gray-500"/>
                {newProduct.image && <button onClick={() => setNewProduct({...newProduct, image: undefined})} className="p-2 text-red-500 hover:text-red-400"><TrashIcon className="h-5 w-5"/></button>}
            </div>
          </div>
        </div>
        <button onClick={handleAddProduct} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
          <PlusIcon className="h-5 w-5" /> {editingProduct ? 'Produkt speichern' : 'Produkt hinzufügen'}
        </button>
        <ul className="space-y-2 mt-6">
          {products.map(prod => (
            <li key={prod.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-md">
              <div className="flex items-center gap-4">
                {prod.image ? <img src={prod.image} alt={prod.name} className="h-10 w-10 rounded-md object-cover flex-shrink-0" /> : <div className="h-10 w-10 rounded-md bg-gray-600 flex-shrink-0"></div>}
                <div>
                    <span className="font-semibold">{prod.name}</span>
                    <span className="text-gray-400 ml-2">{prod.price.toFixed(2)} €</span>
                    <span className="text-sm text-indigo-400 ml-2 block">({categories.find(c=>c.id === prod.categoryId)?.name || 'N/A'})</span>
                </div>
              </div>
              <div className="space-x-2">
                <button onClick={() => { setEditingProduct(prod); setNewProduct({ name: prod.name, price: prod.price.toString(), categoryId: prod.categoryId, image: prod.image });}} className="p-2 text-gray-400 hover:text-yellow-400"><PencilIcon className="h-5 w-5"/></button>
                <button onClick={() => handleDeleteProduct(prod.id)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="h-5 w-5"/></button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Data Import/Export */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Daten-Export & -Import</h2>
        <p className="text-gray-400 mb-4">
            Hier können Sie die Daten aus einer Backup-Datei wiederherstellen. Der Export (Backup speichern) erfolgt über das Download-Symbol in der Kopfleiste.
            <br />
            <strong className="text-yellow-400">Achtung:</strong> Der Import überschreibt alle aktuell in der App gespeicherten Daten unwiderruflich.
        </p>
        <div>
            <input
                type="file"
                id="import-file-input"
                className="hidden"
                accept=".json"
                onChange={handleImportData}
            />
            <label 
                htmlFor="import-file-input"
                className="inline-block cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                Backup-Datei importieren
            </label>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;