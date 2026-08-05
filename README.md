# Bakschema (PWA)

Interactief zuurdesem-bakschema als installeerbare web-app (Vite + React + PWA).
Voortgang en instellingen worden lokaal bewaard via `localStorage`.

## Lokaal draaien
```bash
npm install
npm run dev
```
Open de URL die Vite toont (meestal http://localhost:5173).

## Productie-build testen
```bash
npm run build
npm run preview
```

## Online zetten (gratis)
1. Zet deze map in een GitHub-repo (of sleep de map naar Netlify Drop).
2. Koppel de repo aan **Vercel** of **Netlify**.
   - Build command: `npm run build`
   - Output directory: `dist`
3. Je krijgt een https-URL.

## Op je iPhone installeren
1. Open de URL in **Safari**.
2. Deelknop → **"Zet op beginscherm"**.
3. De app opent nu schermvullend en werkt offline.

## Homey-temperatuur
De temperatuur vul je handmatig in (schuif "Warme rijs"). Een echte live-koppeling
met Homey vergt een eigen backend/Flow en valt buiten deze app.
