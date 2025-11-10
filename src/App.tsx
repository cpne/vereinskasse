import React, { useState, useMemo } from 'react';
import { Product, Category, Transaction, Event, BackupData } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import ProductManagement from './components/ProductManagement';
import POSView from './components/POSView';
import DailyReport from './components/DailyReport';
import OrdersView from './components/OrdersView';
import { ShoppingCartIcon, Cog6ToothIcon, ChartBarIcon, ClipboardDocumentListIcon, CalendarDaysIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

type View = 'pos' | 'admin' | 'report' | 'orders';

interface NavButtonProps {
  activeView: View;
  targetView: View;
  setView: React.Dispatch<React.SetStateAction<View>>;
  children: React.ReactNode;
  icon: React.ElementType;
}

const NavButton: React.FC<NavButtonProps> = ({ activeView, targetView, setView, children, icon: Icon }) => (
  <button
    onClick={() => setView(targetView)}
    className={`flex flex-col items-center justify-center text-center px-4 py-2 rounded-md transition-colors duration-200 ${
      activeView === targetView
        ? 'bg-indigo-600 text-white shadow-lg'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`}
  >
    <Icon className="h-6 w-6 mb-1" />
    <span className="text-xs font-medium">{children}</span>
  </button>
);

const App: React.FC = () => {
  const [view, setView] = useState<View>('pos');
  
  const [categories, setCategories] = useLocalStorage<Category[]>('pos-categories', [
    { id: '1', name: 'Getränke' },
    { id: '2', name: 'Speisen' },
  ]);

  const [products, setProducts] = useLocalStorage<Product[]>('pos-products', [
    { id: '101', name: 'Wasser', price: 2.00, categoryId: '1' },
    { id: '102', name: 'Cola', price: 2.50, categoryId: '1' },
    { id: '103', name: 'Bier', price: 3.50, categoryId: '1' },
    { id: '201', name: 'Wurst', price: 4.00, categoryId: '2' },
    { id: '202', name: 'Pommes', price: 3.00, categoryId: '2' },
  ]);
  
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('pos-transactions', []);
  const [events, setEvents] = useLocalStorage<Event[]>('pos-events', []);
  const [activeEventId, setActiveEventId] = useLocalStorage<string | null>('pos-active-event-id', null);
  const [eventProducts, setEventProducts] = useLocalStorage<Record<string, string[]>>('pos-event-products', {});

  const activeEvent = useMemo(() => events.find(e => e.id === activeEventId), [events, activeEventId]);

  const { productsForEvent, categoriesForEvent } = useMemo(() => {
    if (!activeEventId || !eventProducts[activeEventId]) {
      return { productsForEvent: [], categoriesForEvent: [] };
    }
    const productIdsForEvent = new Set(eventProducts[activeEventId]);
    const productsForEvent = products.filter(p => productIdsForEvent.has(p.id));
    const categoryIdsInEvent = new Set(productsForEvent.map(p => p.categoryId));
    const categoriesForEvent = categories.filter(c => categoryIdsInEvent.has(c.id));
    return { productsForEvent, categoriesForEvent };
  }, [activeEventId, eventProducts, products, categories]);

  const transactionsForEvent = useMemo(() => {
    if (!activeEventId) return [];
    return transactions.filter(t => t.eventId === activeEventId);
  }, [activeEventId, transactions]);

  const completedTransactionsForEvent = useMemo(() => {
    return transactionsForEvent.filter(t => t.status !== 'CANCELLED');
  }, [transactionsForEvent]);

  const handleExportData = () => {
    const backupData: BackupData = {
      categories,
      products,
      transactions,
      events,
      activeEventId,
      eventProducts,
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `vereinskasse-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderView = () => {
    switch (view) {
      case 'admin':
        return (
          <ProductManagement
            categories={categories}
            setCategories={setCategories}
            products={products}
            setProducts={setProducts}
            events={events}
            setEvents={setEvents}
            activeEventId={activeEventId}
            setActiveEventId={setActiveEventId}
            eventProducts={eventProducts}
            setEventProducts={setEventProducts}
            setTransactions={setTransactions}
          />
        );
      case 'report':
        return <DailyReport transactions={completedTransactionsForEvent} products={products} categories={categories} activeEvent={activeEvent} />;
      case 'orders':
        return <OrdersView transactions={transactionsForEvent} setTransactions={setTransactions} activeEvent={activeEvent} />;
      case 'pos':
      default:
        return (
          <POSView
            categories={categoriesForEvent}
            products={productsForEvent}
            addTransaction={(t) => setTransactions((prev) => [...prev, t])}
            activeEvent={activeEvent}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <header className="flex-shrink-0 bg-gray-800 shadow-md z-10">
        <nav className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-2 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex-shrink-0 flex items-center gap-2 text-white">
                <CalendarDaysIcon className="h-6 w-6 text-indigo-400"/>
                <select 
                    value={activeEventId ?? ''} 
                    onChange={e => setActiveEventId(e.target.value || null)}
                    className="bg-gray-700 text-white rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Select Active Event"
                >
                    <option value="">Keine Veranstaltung aktiv</option>
                    {events.map(event => (
                        <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                </select>
                <button
                    onClick={handleExportData}
                    className="p-2 ml-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                    title="Daten exportieren (Backup)"
                    aria-label="Daten exportieren (Backup)"
                >
                    <ArrowDownTrayIcon className="h-6 w-6" />
                </button>
            </div>
            <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg">
                <NavButton activeView={view} targetView="pos" setView={setView} icon={ShoppingCartIcon}>Kasse</NavButton>
                <NavButton activeView={view} targetView="orders" setView={setView} icon={ClipboardDocumentListIcon}>Bestellungen</NavButton>
                <NavButton activeView={view} targetView="admin" setView={setView} icon={Cog6ToothIcon}>Verwaltung</NavButton>
                <NavButton activeView={view} targetView="report" setView={setView} icon={ChartBarIcon}>Bericht</NavButton>
            </div>
        </nav>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;

