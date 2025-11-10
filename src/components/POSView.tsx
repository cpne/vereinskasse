import React, { useState, useMemo, useEffect } from 'react';
import { Product, Category, OrderItem, Transaction, PaymentMethod, Event } from '../types';
import { PlusIcon, MinusIcon, TrashIcon, CreditCardIcon, BanknotesIcon, PhotoIcon, CalendarDaysIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../hooks/useTheme';

interface POSViewProps {
  categories: Category[];
  products: Product[];
  addTransaction: (transaction: Transaction) => void;
  activeEvent: Event | undefined;
}

const POSView: React.FC<POSViewProps> = ({ categories, products, addTransaction, activeEvent }) => {
  const { isDarkMode } = useTheme();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    if (categories.length > 0 && !activeCategoryId) {
        setActiveCategoryId(categories[0].id);
    } else if (categories.length > 0 && !categories.some(c => c.id === activeCategoryId)) {
        setActiveCategoryId(categories[0].id);
    } else if (categories.length === 0) {
        setActiveCategoryId(null);
    }
  }, [categories, activeCategoryId]);


  const filteredProducts = useMemo(() => {
    if (!activeCategoryId) return products;
    return products.filter((p) => p.categoryId === activeCategoryId);
  }, [products, activeCategoryId]);

  const addToOrder = (product: Product) => {
    setOrder((currentOrder) => {
      const existingItem = currentOrder.find((item) => item.productId === product.id);
      if (existingItem) {
        return currentOrder.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentOrder, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, amount: number) => {
    setOrder((currentOrder) => {
      const updatedOrder = currentOrder.map((item) =>
        item.productId === productId ? { ...item, quantity: item.quantity + amount } : item
      );
      return updatedOrder.filter(item => item.quantity > 0);
    });
  };

  const removeFromOrder = (productId: string) => {
    setOrder(currentOrder => currentOrder.filter(item => item.productId !== productId));
  };

  const total = useMemo(() => {
    return order.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [order]);

  const initiateCheckout = (paymentMethod: PaymentMethod) => {
    if (order.length === 0) return;
    setPendingPaymentMethod(paymentMethod);
    setIsConfirming(true);
  };

  const confirmCheckout = () => {
    if (!pendingPaymentMethod || order.length === 0 || !activeEvent) return;
    const newTransaction: Transaction = {
      id: new Date().toISOString(),
      items: order,
      total,
      paymentMethod: pendingPaymentMethod,
      date: new Date().toISOString(),
      eventId: activeEvent.id,
      status: 'COMPLETED',
    };
    addTransaction(newTransaction);
    setOrder([]);
    setIsConfirming(false);
    setPendingPaymentMethod(null);
  };
  
  const cancelCheckout = () => {
    setIsConfirming(false);
    setPendingPaymentMethod(null);
  }
  
  if (!activeEvent) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <CalendarDaysIcon className={`h-16 w-16 mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}/>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Keine Veranstaltung aktiv</h2>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bitte wählen Sie eine aktive Veranstaltung in den Einstellungen oder legen Sie eine neue in der Verwaltung an.</p>
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 relative">
      {/* Product Selection */}
      <div className={`flex-1 flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden`}>
        <div className={`flex-shrink-0 p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
                  activeCategoryId === cat.id 
                    ? 'bg-indigo-600 text-white' 
                    : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToOrder(product)}
                  className={`${isDarkMode ? 'bg-gray-700 hover:bg-indigo-500' : 'bg-gray-100 hover:bg-indigo-100'} rounded-lg text-center transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 overflow-hidden flex flex-col justify-start`}
                >
                  {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-24 object-cover" />
                  ) : (
                      <div className={`w-full h-24 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} flex items-center justify-center`}>
                          <PhotoIcon className={`h-10 w-10 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}/>
                      </div>
                  )}
                  <div className="p-2 flex flex-col flex-grow justify-center">
                      <span className={`font-bold text-md break-words ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</span>
                      <span className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{product.price.toFixed(2)} €</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Für diese Veranstaltung wurden keine Produkte zugewiesen.</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className={`w-full md:w-1/3 lg:w-1/4 flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg`}>
        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Bestellung</h2>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {order.length === 0 ? (
            <p className={`text-center mt-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Keine Artikel in der Bestellung.</p>
          ) : (
            order.map((item) => (
              <div key={item.productId} className={`flex items-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} p-2 rounded-md`}>
                <div className="flex-1">
                  <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.price.toFixed(2)} €</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => updateQuantity(item.productId, -1)} className={`p-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded-full text-white hover:bg-red-500`}><MinusIcon className="h-4 w-4" /></button>
                  <span className={`w-6 text-center font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className={`p-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded-full text-white hover:bg-green-500`}><PlusIcon className="h-4 w-4" /></button>
                </div>
                 <button onClick={() => removeFromOrder(item.productId)} className={`ml-3 p-1 ${isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-500'}`}><TrashIcon className="h-5 w-5"/></button>
              </div>
            ))
          )}
        </div>
        <div className={`flex-shrink-0 p-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} space-y-4`}>
          <div className={`flex justify-between items-center text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <span>Total:</span>
            <span>{total.toFixed(2)} €</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => initiateCheckout(PaymentMethod.CASH)}
              disabled={order.length === 0}
              className="flex items-center justify-center gap-2 w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-colors hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <BanknotesIcon className="h-6 w-6" />
              Bar
            </button>
            <button
              onClick={() => initiateCheckout(PaymentMethod.CARD)}
              disabled={order.length === 0}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-colors hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <CreditCardIcon className="h-6 w-6" />
              Karte
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirming && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 rounded-lg">
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-2xl p-6 w-full max-w-sm text-center`}>
            <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Bestätigen</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              Möchten Sie die Bestellung über <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{total.toFixed(2)} €</span> mit <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{pendingPaymentMethod}</span> wirklich abschließen?
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={cancelCheckout}
                className={`px-6 py-2 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                  isDarkMode
                    ? 'bg-gray-600 text-white hover:bg-gray-500 focus:ring-gray-400'
                    : 'bg-gray-300 text-gray-900 hover:bg-gray-400 focus:ring-gray-400'
                }`}
              >
                Abbrechen
              </button>
              <button
                onClick={confirmCheckout}
                className={`px-6 py-2 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                  pendingPaymentMethod === PaymentMethod.CASH
                    ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400'
                }`}
              >
                Bestätigen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSView;

