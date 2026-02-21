# Domácí Rozpočet - Správce Rodinných Financí

Chrome Extension (Manifest V3) pro komplexní správu rodinného rozpočtu s cílem pomoci rodině uniknout z "krysího závodu" (Rat Race).

## Architektura

```
Domaci-rozpocet/
├── extension/          # Chrome Extension (React + TypeScript + Tailwind)
│   ├── src/
│   │   ├── components/  # React komponenty
│   │   ├── contexts/    # React Context (Auth, Theme, Data)
│   │   ├── pages/       # Stránky aplikace
│   │   ├── services/    # API a Firebase služby
│   │   ├── types/       # TypeScript definice
│   │   ├── utils/       # Utility funkce
│   │   └── styles/      # Tailwind CSS
│   ├── public/          # HTML šablony, ikony
│   ├── manifest.json    # Chrome Extension Manifest V3
│   └── webpack.config.js
├── backend/             # Node.js API server
│   ├── src/
│   │   ├── routes/      # Express API routes
│   │   ├── services/    # Business logic (email, automation, reports)
│   │   ├── middleware/  # Auth middleware
│   │   ├── models/      # Database layer
│   │   └── seed.js      # Testovací data
│   └── uploads/         # Nahrané PDF smlouvy
```

## Funkce

### Dashboard
- **Rat Race Metr** - kruhový ukazatel (Pasivní příjmy / Výdaje x 100)
- Přehledové karty (Příjmy, Výdaje, Zbývá)
- AI Widget s proaktivními radami
- Graf rozložení výdajů (donut chart)

### Výdaje
- Kompletní evidence s 10 kategoriemi a 30+ podkategoriemi
- **WellMall rozdělení** - slider pro % Rodina / % WellMall
- Napojení na členy rodiny, vozidla, mazlíčky
- Sledování smluv a fixací

### Příjmy
- Aktivní příjmy (platy)
- Pasivní příjmy (dividendy, pronájmy)
- Progress bar pokrytí výdajů pasivními příjmy

### Kalendář
- Měsíční mřížka s událostmi
- Automatické značky splatností
- Panel blížících se expirací (< 90 dní)

### AI Finanční Poradce
- Chat rozhraní pro finanční dotazy
- Rychlé otázky
- Připraveno na OpenAI/Gemini API integraci

### Administrace (/admin)
- Statistiky systému
- Správa registrovaných rodin
- Globální kategorie
- AI Prompt Management

### Popup (Rychlý přístup)
- Mini přehled Rat Race metru
- Rychlé přidání výdaje

## Automatizace

1. **Kontrola expirací** - denně v 8:00, alert při < 90 dnech
2. **Detekce překrývajících se předplatných** - Netflix + HBO notifikace
3. **WellMall měsíční report** - PDF každého 1. v měsíci
4. **Emailové šablony** - expirace smluv, měsíční shrnutí

## Spuštění

### Backend
```bash
cd backend
npm install
npm run dev     # Development server na portu 3001
npm run seed    # Naplnění testovacími daty
```

### Extension
```bash
cd extension
npm install
npm run dev     # Webpack watch mode
npm run build   # Production build
```

### Načtení do Chrome
1. Otevřít chrome://extensions/
2. Zapnout "Režim pro vývojáře"
3. "Načíst rozbalené rozšíření" a vybrat extension/dist/

## Testovací účty

| Role | Email | Heslo |
|------|-------|-------|
| Uživatel | rodina@test.cz | Heslo123 |
| Admin | admin@wellmall.cz | AdminStart2026 |

### Seed data (Rodina Novákovi)
- Příjmy: 85 000 Kč aktivní + 5 000 Kč pasivní
- Hypotéka: 22 000 Kč (fixace do 15.6.2028)
- Elektřina ČEZ: 3 500 Kč (WellMall: 2 000 Kč)
- 4 vozidla, 4 mazlíčci, 4 členové rodiny
- 30+ výdajových položek

## Technologie

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, JWT auth
- **Databáze**: In-memory (dev) / Firebase Firestore (prod)
- **Email**: Nodemailer (SendGrid ready)
- **AI**: OpenAI API ready (fallback lokální odpovědi)
- **Storage**: Multer (dev) / Firebase Storage (prod)
- **Design**: Neumorphic, Dark Mode, Inter font
