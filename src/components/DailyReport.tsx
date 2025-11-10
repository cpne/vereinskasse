import React, { useMemo } from 'react';
import { Transaction, PaymentMethod, Product, Category, Event } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarDaysIcon, DocumentArrowDownIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTheme } from '../hooks/useTheme';

interface DailyReportProps {
  transactions: Transaction[];
  products: Product[];
  categories: Category[];
  activeEvent: Event | undefined;
}

const DailyReport: React.FC<DailyReportProps> = ({ transactions, products, categories, activeEvent }) => {
  const { isDarkMode } = useTheme();
  
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
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
      <h3 className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium uppercase`}>{title}</h3>
      <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        {isCurrency ? `${value.toFixed(2)} €` : value}
      </p>
    </div>
  );

  const createPDFDocument = (): jsPDF => {
    if (!activeEvent) throw new Error('No active event');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Header with gradient effect (simulated with colored box)
    doc.setFillColor(99, 102, 241); // Indigo
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Vereins-Kasse', margin, 25);
    
    // Subtitle
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Verkaufsbericht', margin, 35);
    
    // Event Info
    doc.setFontSize(12);
    doc.text(`Veranstaltung: ${activeEvent.name}`, margin, 45);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    yPosition = 60;

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const reportDate = new Date().toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Erstellt am: ${reportDate}`, pageWidth - margin, yPosition, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    yPosition += 15;

    // Summary Statistics
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Zusammenfassung', margin, yPosition);
    yPosition += 10;

    // Summary Table
    autoTable(doc, {
      startY: yPosition,
      head: [['Kennzahl', 'Wert']],
      body: [
        ['Gesamtumsatz', `${reportData.totalRevenue.toFixed(2)} €`],
        ['Bar-Umsatz', `${reportData.cashRevenue.toFixed(2)} €`],
        ['Karten-Umsatz', `${reportData.cardRevenue.toFixed(2)} €`],
        ['Anzahl Transaktionen', reportData.totalTransactions.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 11, cellPadding: 5 },
      margin: { left: margin, right: margin },
    });
    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Product Sales Table
    if (reportData.productSales.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Umsatz pro Produkt', margin, yPosition);
      yPosition += 10;

      const productTableData = reportData.productSales.map(sale => [
        sale.name,
        sale.quantity.toString(),
        `${sale.revenue.toFixed(2)} €`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Produkt', 'Menge', 'Umsatz']],
        body: productTableData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 40, halign: 'center' },
          2: { cellWidth: 50, halign: 'right' },
        },
      });
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Category Sales Table
    if (reportData.categorySales.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Umsatz pro Kategorie', margin, yPosition);
      yPosition += 10;

      const categoryTableData = reportData.categorySales.map(sale => [
        sale.name,
        `${sale.revenue.toFixed(2)} €`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Kategorie', 'Umsatz']],
        body: categoryTableData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 50, halign: 'right' },
        },
      });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    const pageWidthFinal = doc.internal.pageSize.getWidth();
    const pageHeightFinal = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Seite ${i} von ${totalPages}`,
        pageWidthFinal / 2,
        pageHeightFinal - 10,
        { align: 'center' }
      );
    }

    return doc;
  };

  const generatePDF = () => {
    if (!activeEvent) return;

    try {
      const doc = createPDFDocument();
      const fileName = `Verkaufsbericht_${activeEvent.name}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Fehler beim Generieren des PDFs:', error);
      alert('Fehler beim Generieren des PDFs. Bitte versuchen Sie es erneut.');
    }
  };

  const sendEmail = () => {
    if (!activeEvent) return;

    try {
      // Generate PDF and download it
      const doc = createPDFDocument();
      const fileName = `Verkaufsbericht_${activeEvent.name}_${new Date().toISOString().split('T')[0]}.pdf`;
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);

      // Create email body with detailed report summary
      let emailBody = `Verkaufsbericht für ${activeEvent.name}\n\n`;
      emailBody += `Datum: ${new Date().toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}\n\n`;
      emailBody += `ZUSAMMENFASSUNG:\n`;
      emailBody += `- Gesamtumsatz: ${reportData.totalRevenue.toFixed(2)} €\n`;
      emailBody += `- Bar-Umsatz: ${reportData.cashRevenue.toFixed(2)} €\n`;
      emailBody += `- Karten-Umsatz: ${reportData.cardRevenue.toFixed(2)} €\n`;
      emailBody += `- Anzahl Transaktionen: ${reportData.totalTransactions}\n\n`;

      if (reportData.productSales.length > 0) {
        emailBody += `UMSATZ PRO PRODUKT:\n`;
        reportData.productSales.forEach(sale => {
          emailBody += `- ${sale.name}: ${sale.quantity}x = ${sale.revenue.toFixed(2)} €\n`;
        });
        emailBody += `\n`;
      }

      if (reportData.categorySales.length > 0) {
        emailBody += `UMSATZ PRO KATEGORIE:\n`;
        reportData.categorySales.forEach(sale => {
          emailBody += `- ${sale.name}: ${sale.revenue.toFixed(2)} €\n`;
        });
        emailBody += `\n`;
      }

      emailBody += `\nHINWEIS: Bitte fügen Sie das heruntergeladene PDF-Dokument ("${fileName}") als Anhang zu dieser E-Mail hinzu.\n\n`;
      emailBody += `---\n`;
      emailBody += `Dieser Bericht wurde von der Vereins-Kasse App erstellt.`;

      // Open email client after a short delay to allow PDF download to start
      setTimeout(() => {
        const subject = encodeURIComponent(`Verkaufsbericht: ${activeEvent.name}`);
        const body = encodeURIComponent(emailBody);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      }, 500);
    } catch (error) {
      console.error('Fehler beim Versenden der E-Mail:', error);
      alert('Fehler beim Versenden der E-Mail. Bitte versuchen Sie es erneut.');
    }
  };

  if (!activeEvent) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <CalendarDaysIcon className={`h-16 w-16 mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}/>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Keine Veranstaltung aktiv</h2>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Wählen Sie eine Veranstaltung in den Einstellungen aus, um den Bericht anzuzeigen.</p>
        </div>
    );
  }

  if (transactions.length === 0) {
    return (
        <div className="text-center py-20">
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Keine Daten für den Bericht</h2>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Für die Veranstaltung "{activeEvent.name}" wurden noch keine Verkäufe getätigt.</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Bericht für {activeEvent.name}</h1>
        <div className="flex gap-3">
          <button
            onClick={generatePDF}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              isDarkMode
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            PDF exportieren
          </button>
          <button
            onClick={sendEmail}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <EnvelopeIcon className="h-5 w-5" />
            Per E-Mail senden
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Gesamtumsatz" value={reportData.totalRevenue} />
        <StatCard title="Bar-Umsatz" value={reportData.cashRevenue} />
        <StatCard title="Karten-Umsatz" value={reportData.cardRevenue} />
        <StatCard title="Transaktionen" value={reportData.totalTransactions} isCurrency={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Umsatz pro Produkt</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.productSales.slice(0, 10)} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#4A5568" : "#E5E7EB"} />
              <XAxis dataKey="name" stroke={isDarkMode ? "#A0AEC0" : "#6B7280"} />
              <YAxis stroke={isDarkMode ? "#A0AEC0" : "#6B7280"} unit="€" />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#1A202C' : '#FFFFFF', 
                  border: isDarkMode ? '1px solid #4A5568' : '1px solid #E5E7EB',
                  color: isDarkMode ? '#E2E8F0' : '#111827'
                }}
                labelStyle={{ color: isDarkMode ? '#E2E8F0' : '#111827' }}
              />
              <Legend wrapperStyle={{ color: isDarkMode ? '#E2E8F0' : '#111827' }}/>
              <Bar dataKey="revenue" fill="#6366F1" name="Umsatz" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Umsatz pro Kategorie</h2>
           <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.categorySales} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#4A5568" : "#E5E7EB"} />
              <XAxis dataKey="name" stroke={isDarkMode ? "#A0AEC0" : "#6B7280"} />
              <YAxis stroke={isDarkMode ? "#A0AEC0" : "#6B7280"} unit="€" />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#1A202C' : '#FFFFFF', 
                  border: isDarkMode ? '1px solid #4A5568' : '1px solid #E5E7EB',
                  color: isDarkMode ? '#E2E8F0' : '#111827'
                }}
                labelStyle={{ color: isDarkMode ? '#E2E8F0' : '#111827' }}
              />
              <Legend wrapperStyle={{ color: isDarkMode ? '#E2E8F0' : '#111827' }}/>
              <Bar dataKey="revenue" fill="#8B5CF6" name="Umsatz" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DailyReport;

