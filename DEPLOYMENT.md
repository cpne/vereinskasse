# Deployment und Update-Anleitung

## Wichtige Hinweise für Updates

### Service Worker Version erhöhen

**WICHTIG:** Bei jeder Änderung der App oder des Service Workers muss die Service Worker Version erhöht werden!

1. Öffne `public/sw.js`
2. Erhöhe die `SW_VERSION` Konstante:
   ```javascript
   const SW_VERSION = '4'; // Von '3' auf '4' erhöhen (oder nächste Nummer)
   ```
3. Die Version sollte bei jedem Deployment erhöht werden, damit die App bei allen Nutzern aktualisiert wird

### Deployment-Workflow

1. **Code-Änderungen vornehmen**
   - Änderungen am Source-Code in `src/` vornehmen
   - Bei Änderungen am Service Worker: Version in `public/sw.js` erhöhen

2. **Build ausführen**
   ```bash
   npm run build
   ```

3. **Gebaute Dateien ins Root kopieren**
   ```bash
   rm -rf assets logo.svg manifest.json sw.js
   cp dist/index.html index.html
   cp -r dist/assets .
   cp dist/logo.svg .
   cp dist/manifest.json .
   cp dist/sw.js .
   ```

4. **Änderungen committen und pushen**
   ```bash
   git add -A
   git commit -m "Beschreibung der Änderungen"
   git push origin main
   ```

5. **GitHub Pages**
   - GitHub Pages lädt automatisch die neuen Dateien
   - Die App wird bei allen Nutzern automatisch aktualisiert (siehe Update-Mechanismus unten)

## Update-Mechanismus

### Wie funktioniert die automatische Aktualisierung?

Die App aktualisiert sich automatisch bei allen Nutzern (auch wenn die App auf dem Home-Bildschirm installiert ist):

1. **Update-Prüfung:**
   - Beim Laden der App: sofortige Prüfung auf Updates
   - Regelmäßig: alle 60 Sekunden
   - Beim erneuten Öffnen der App

2. **Automatische Aktivierung:**
   - Neuer Service Worker wird automatisch installiert
   - Die Seite lädt automatisch neu, damit der neue Service Worker aktiv wird
   - Alte Caches werden automatisch gelöscht

3. **Cache-Strategie:**
   - **Network First** für HTML/JS: immer die neueste Version vom Server
   - **Cache First** für statische Assets: schneller Zugriff
   - Alte Caches werden automatisch entfernt

### Timing

- Updates werden meist innerhalb von **1-2 Minuten** erkannt
- Wenn die App geöffnet ist: automatisches Neuladen nach Erkennung
- Wenn die App geschlossen ist: Update beim nächsten Öffnen

## Service Worker Struktur

- **Datei:** `public/sw.js`
- **Version:** Wird über `SW_VERSION` Konstante gesteuert
- **Cache-Name:** `vereinskasse-cache-v{SW_VERSION}`
- **Base-Pfad:** `/vereinskasse/`

## Testing

### Service Worker testen

1. Öffne die App im Browser
2. Öffne DevTools → Application → Service Workers
3. Prüfe, ob der Service Worker aktiv ist
4. Prüfe die Cache-Version im Storage → Cache Storage

### Update testen

1. Erhöhe die Service Worker Version
2. Baue die App neu (`npm run build`)
3. Kopiere die Dateien ins Root
4. Committe und pushe
5. Warte 1-2 Minuten
6. Die App sollte automatisch neu laden

## Troubleshooting

### App aktualisiert sich nicht?

1. Prüfe, ob die Service Worker Version erhöht wurde
2. Prüfe, ob die neuen Dateien gepusht wurden
3. Prüfe die Browser-Console auf Fehler
4. Prüfe in DevTools → Application → Service Workers, ob ein neuer Service Worker wartet
5. Manuell: Service Worker in DevTools deaktivieren und neu aktivieren

### Cache-Probleme?

1. Alte Caches werden automatisch gelöscht, wenn die Version erhöht wird
2. Bei Problemen: Service Worker in DevTools deaktivieren
3. Cache Storage in DevTools manuell leeren

## GitHub Pages Konfiguration

- **Repository:** https://github.com/cpne/vereinskasse
- **Branch:** `main`
- **Folder:** `/` (root)
- **URL:** https://cpne.github.io/vereinskasse/

## Entwicklungs-Workflow

Für lokale Entwicklung:
```bash
npm run dev
```

Die Entwicklungs-`index.html` verwendet `/src/index.tsx` und wird von Vite automatisch transformiert.

Für Produktion:
- Die gebaute `index.html` aus `dist/` wird ins Root kopiert
- Diese verwendet die gebauten Assets aus `/vereinskasse/assets/`

## Wichtige Dateien

- `public/sw.js` - Service Worker (Version hier erhöhen!)
- `src/index.tsx` - Service Worker Registrierung
- `vite.config.ts` - Build-Konfiguration (base: '/vereinskasse/')
- `public/manifest.json` - PWA Manifest
- `index.html` - Entwicklungs-HTML (wird von Vite transformiert)

