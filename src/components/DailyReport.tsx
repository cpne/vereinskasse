import React, { useMemo } from 'react';
import { Transaction, PaymentMethod, Product, Category, Event } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarDaysIcon } from '@heroicons/react/24/solid';

interface DailyReportProps {
  transactions: Transaction[];
  products: Product[];
  categories: Category[];
  activeEvent: Event | undefined;
}

const DailyReport: React.FC<DailyReportProps> = ({ transactions, products, categories, activeEvent }) => {
  const reportData = useMemo(() => {
    // Report is now based on transactions passed in, which are pre-filtered by event
    const todaysTransactions = transactions;

    const totalRevenue = todaysTransactions.reduce((sum, t) => sum + t.total, 0);
    const cashRevenue = todaysTransactions
      .filter(t => t.paymentMethod === PaymentMethod.CASH)
      .reduce((sum, t) => sum + t.total, 0);
    const cardRevenue = todaysTransactions
      .filter(t => t.paymentMethod === PaymentMethod.CARD)
      .reduce((sum, t) => sum + t.total, 0);

    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    todaysTransactions.forEach(t => {
      t.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });

    const categorySales: { [key: string]: { name: string; revenue: number } } = {};
    Object.values(productSales).forEach(sale => {
        const product = products.find(p => p.name === sale.name);
        if (product) {
            const category = categories.find(c => c.id === product.categoryId);
            if (category) {
                if(!categorySales[category.id]) {
                    categorySales[category.id] = { name: category.name, revenue: 0 };
                }
                categorySales[category.id].revenue += sale.revenue;
            }
        }
    });

    const sortedProductSales = Object.values(productSales).sort((a, b) => b.revenue - a.revenue);
    const sortedCategorySales = Object.values(categorySales).sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      cashRevenue,
      cardRevenue,
      totalTransactions: todaysTransactions.length,
      productSales: sortedProductSales,
      categorySales: sortedCategorySales
    };
  }, [transactions, products, categories]);
  
  const StatCard = ({ title, value, isCurrency = true }: { title: string; value: number, isCurrency?: boolean }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-gray-400 text-sm font-medium uppercase">{title}</h3>
      <p className="text-3xl font-bold text-white mt-2">
        {isCurrency ? `${value.toFixed(2)} €` : value}
      </p>
    </div>
  );

  if (!activeEvent) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <CalendarDaysIcon className="h-16 w-16 text-gray-600 mb-4"/>
            <h2 className="text-2xl font-bold text-white">Keine Veranstaltung aktiv</h2>
            <p className="text-gray-400 mt-2">Wählen Sie eine Veranstaltung in den Einstellungen aus, um den Bericht anzuzeigen.</p>
        </div>
    );
  }

  if (transactions.length === 0) {
    return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-white">Keine Daten für den Bericht</h2>
            <p className="text-gray-400 mt-2">Für die Veranstaltung "{activeEvent.name}" wurden noch keine Verkäufe getätigt.</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Bericht für {activeEvent.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Gesamtumsatz" value={reportData.totalRevenue} />
        <StatCard title="Bar-Umsatz" value={reportData.cashRevenue} />
        <StatCard title="Karten-Umsatz" value={reportData.cardRevenue} />
        <StatCard title="Transaktionen" value={reportData.totalTransactions} isCurrency={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Umsatz pro Produkt</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.productSales.slice(0, 10)} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis dataKey="name" stroke="#A0AEC0" />
              <YAxis stroke="#A0AEC0" unit="€" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }}
                labelStyle={{ color: '#E2E8F0' }}
              />
              <Legend wrapperStyle={{ color: '#E2E8F0' }}/>
              <Bar dataKey="revenue" fill="#6366F1" name="Umsatz" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Umsatz pro Kategorie</h2>
           <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.categorySales} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis dataKey="name" stroke="#A0AEC0" />
              <YAxis stroke="#A0AEC0" unit="€" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }}
                labelStyle={{ color: '#E2E8F0' }}
              />
              <Legend wrapperStyle={{ color: '#E2E8F0' }}/>
              <Bar dataKey="revenue" fill="#8B5CF6" name="Umsatz" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DailyReport;

