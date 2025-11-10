
import React, { useState } from 'react';
import { Transaction, PaymentMethod, Event } from '../types';
import { CreditCardIcon, BanknotesIcon, ChevronDownIcon, CalendarDaysIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface OrdersViewProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  activeEvent: Event | undefined;
}

const OrdersView: React.FC<OrdersViewProps> = ({ transactions, setTransactions, activeEvent }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingTransaction, setCancellingTransaction] = useState<Transaction | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(currentId => (currentId === id ? null : id));
  };
  
  const handleConfirmCancel = () => {
    if (!cancellingTransaction) return;
    setTransactions(prev =>
      prev.map(tx =>
        tx.id === cancellingTransaction.id
          ? { ...tx, status: 'CANCELLED' }
          : tx
      )
    );
    setCancellingTransaction(null);
  };

  const reversedTransactions = [...transactions].reverse();

  if (!activeEvent) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <CalendarDaysIcon className="h-16 w-16 text-gray-600 mb-4"/>
            <h2 className="text-2xl font-bold text-white">Keine Veranstaltung aktiv</h2>
            <p className="text-gray-400 mt-2">Wählen Sie eine Veranstaltung aus, um die Bestellungen anzuzeigen.</p>
        </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">Keine Bestellungen vorhanden</h2>
        <p className="text-gray-400 mt-2">Für die Veranstaltung "{activeEvent.name}" wurden noch keine Bestellungen abgeschlossen.</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-white mb-6">Bestellübersicht für "{activeEvent.name}"</h1>
        {reversedTransactions.map((t) => {
          const isExpanded = expandedId === t.id;
          const isCancelled = t.status === 'CANCELLED';

          return (
            <div key={t.id} className={`bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-opacity ${isCancelled ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1">
                    {t.paymentMethod === PaymentMethod.CARD ? (
                      <CreditCardIcon className="h-6 w-6 text-blue-400 flex-shrink-0" />
                    ) : (
                      <BanknotesIcon className="h-6 w-6 text-green-400 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-bold text-lg text-white ${isCancelled ? 'line-through' : ''}`}>
                        {t.total.toFixed(2)} €
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(t.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    {isCancelled && (
                         <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-900/70 text-red-300">
                            STORNIERT
                        </span>
                    )}
                    <span className={`hidden sm:inline-block px-3 py-1 text-xs font-semibold rounded-full ${t.paymentMethod === PaymentMethod.CARD ? 'bg-blue-900/50 text-blue-300' : 'bg-green-900/50 text-green-300'}`}>
                        {t.paymentMethod}
                    </span>
                    <button 
                        onClick={() => setCancellingTransaction(t)}
                        disabled={isCancelled}
                        className="p-2 text-gray-400 hover:text-red-400 disabled:text-gray-600 disabled:cursor-not-allowed"
                        aria-label="Bestellung stornieren"
                    >
                        <XCircleIcon className="h-6 w-6"/>
                    </button>
                    <button
                        onClick={() => toggleExpand(t.id)}
                        disabled={isCancelled}
                        className="p-2 text-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed"
                        aria-label="Details anzeigen"
                    >
                      <ChevronDownIcon
                        className={`h-6 w-6 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`}
                      />
                    </button>
                  </div>
              </div>
              {isExpanded && !isCancelled && (
                <div className="bg-gray-800/50 px-4 pb-4 pt-2 border-t border-gray-700">
                  <h4 className="font-semibold text-gray-300 mb-2">Bestellte Artikel:</h4>
                  <ul className="space-y-2">
                    {t.items.map((item) => (
                      <li key={item.productId} className="flex justify-between items-center text-gray-300">
                        <span>{item.quantity} x {item.name}</span>
                        <span>{(item.quantity * item.price).toFixed(2)} €</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Cancellation Confirmation Modal */}
      {cancellingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-6 w-full max-w-sm text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Bestellung stornieren?</h2>
            <p className="text-gray-300 mb-4">
              Möchten Sie die Bestellung über <span className="font-bold text-white">{cancellingTransaction.total.toFixed(2)} €</span> wirklich stornieren? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setCancellingTransaction(null)}
                className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Abbrechen
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                Stornieren
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrdersView;