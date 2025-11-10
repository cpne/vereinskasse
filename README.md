# Vereins-Kasse

Eine einfache Kassen-App für Vereine, optimiert für die Offline-Nutzung auf Tablets.

## 🚀 Schnellstart

### Lokale Entwicklung

**Voraussetzungen:** Node.js

1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

2. App starten:
   ```bash
   npm run dev
   ```

3. App im Browser öffnen:
   ```
   http://localhost:3000
   ```

## 📦 Deployment

**WICHTIG:** Für Deployment-Anweisungen und Update-Prozess siehe [DEPLOYMENT.md](./DEPLOYMENT.md)

### Kurzfassung

1. Code-Änderungen vornehmen
2. Service Worker Version in `public/sw.js` erhöhen (bei Änderungen)
3. Build ausführen: `npm run build`
4. Gebaute Dateien ins Root kopieren
5. Committen und pushen: `git push origin main`

Siehe [DEPLOYMENT.md](./DEPLOYMENT.md) für detaillierte Anweisungen.

## 🔄 Updates

Die App aktualisiert sich automatisch bei allen Nutzern:
- Service Worker Version muss bei jedem Update erhöht werden
- Updates werden automatisch erkannt und aktiviert
- Alte Caches werden automatisch gelöscht

Siehe [DEPLOYMENT.md](./DEPLOYMENT.md) für Details zum Update-Mechanismus.

## 🌐 GitHub Pages

- **Repository:** https://github.com/cpne/vereinskasse
- **Live:** https://cpne.github.io/vereinskasse/

## 📱 PWA Features

- Offline-Funktionalität
- Installierbar auf Home-Bildschirm
- Automatische Updates
- Service Worker für Caching

## 🛠️ Technologie-Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Service Worker (PWA)

## 📄 Lizenz

Dieses Projekt ist für den internen Gebrauch bestimmt.
