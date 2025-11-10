import React from 'react';
import { Event, BackupData, Category, Product, Transaction } from '../types';
import { MoonIcon, SunIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

interface SettingsViewProps {
  events: Event[];
  activeEventId: string | null;
  setActiveEventId: React.Dispatch<React.SetStateAction<string | null>>;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  onExportData: () => void;
  onImportData: (data: BackupData) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  events,
  activeEventId,
  setActiveEventId,
  isDarkMode,
  setIsDarkMode,
  onExportData,
  onImportData,
}) => {
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
                onImportData(data);
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
      <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Einstellungen</h1>

      {/* Veranstaltungsauswahl */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Veranstaltung</h2>
        <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Wählen Sie die aktive Veranstaltung aus, für die Verkäufe erfasst werden sollen.
        </p>
        <select
          value={activeEventId ?? ''}
          onChange={e => setActiveEventId(e.target.value || null)}
          className={`w-full ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} rounded-md px-4 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          aria-label="Aktive Veranstaltung auswählen"
        >
          <option value="">Keine Veranstaltung aktiv</option>
          {events.map(event => (
            <option key={event.id} value={event.id}>
              {event.name} ({new Date(event.date).toLocaleDateString('de-DE')})
            </option>
          ))}
        </select>
        {activeEventId && (
          <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Aktive Veranstaltung: <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {events.find(e => e.id === activeEventId)?.name}
            </span>
          </p>
        )}
      </div>

      {/* Design-Einstellungen */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Design</h2>
        <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Wählen Sie zwischen hellem und dunklem Design.
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDarkMode ? (
              <MoonIcon className="h-6 w-6 text-indigo-400" />
            ) : (
              <SunIcon className="h-6 w-6 text-yellow-500" />
            )}
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {isDarkMode ? 'Dunkles Design' : 'Helles Design'}
            </span>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
            role="switch"
            aria-checked={isDarkMode}
            aria-label="Design-Modus umschalten"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDarkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {isDarkMode
            ? 'Das dunkle Design ist aktiviert und reduziert die Belastung der Augen bei wenig Licht.'
            : 'Das helle Design ist aktiviert und bietet bessere Lesbarkeit bei Tageslicht.'}
        </p>
      </div>

      {/* Backup & Export */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Daten-Export & -Import</h2>
        <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Erstellen Sie eine Sicherungskopie aller Daten (Kategorien, Produkte, Transaktionen, Veranstaltungen) oder stellen Sie Daten aus einer Backup-Datei wieder her.
        </p>
        
        {/* Export */}
        <div className="mb-6">
          <button
            onClick={onExportData}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${
              isDarkMode
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Backup-Datei herunterladen
          </button>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Erstellen Sie eine Sicherungskopie aller Daten.
          </p>
        </div>

        {/* Import */}
        <div className="border-t pt-6" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
          <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Hier können Sie die Daten aus einer Backup-Datei wiederherstellen.
            <br />
            <strong className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}>Achtung:</strong> Der Import überschreibt alle aktuell in der App gespeicherten Daten unwiderruflich.
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
              className={`inline-flex items-center gap-2 cursor-pointer px-4 py-3 rounded-lg font-semibold transition-colors ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              Backup-Datei importieren
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;

