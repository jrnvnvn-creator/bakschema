import React, { useState, useEffect, useRef } from "react";

const WEEKDAYS = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round15 = (m) => Math.round(m / 15) * 15;
const two = (n) => String(n).padStart(2, "0");
const fmt = (m) => `${two(Math.floor((((m % 1440) + 1440) % 1440) / 60))}:${two(Math.round(m) % 60)}`;
const fmtDur = (m) => { const h = Math.floor(m / 60), mm = Math.round(m % 60); return h ? `${h} u${mm ? " " + mm + " min" : ""}` : `${mm} min`; };
const fmtClock = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return two(Math.floor(s / 60)) + ":" + two(s % 60); };
const parseT = (s) => { const [h, m] = String(s).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const seasonTemp = () => { const m = new Date().getMonth(); if (m === 11 || m <= 1) return 18; if (m >= 2 && m <= 4) return 20; if (m >= 5 && m <= 7) return 26; return 20; };
const fmtDate = (iso) => { try { return new Date(iso).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return iso; } };
const uid = () => "t" + Math.random().toString(36).slice(2, 8);

const REF_TEMP = 22;
const STORAGE_KEY = "desem-bake-v5";
const store = {
  get(key) { try { const raw = localStorage.getItem(key); return raw ? { value: raw } : null; } catch (e) { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) {} },
};
const LIB_VERSION = 9;

const ACT_META = { take: "Uit de koeling / bijkomen", mix: "Mengen / kneden", fold: "Vouwen (folds)", fridge: "Koelkast (koude bulk)", rest: "Rijzen / wachten", shape: "Vormen", device: "Apparaat aan", bake: "Bakken" };
const ACT_COLOR = { take: "#C58A5A", mix: "#B0863A", fold: "#7E6BB0", fridge: "#3E9BC0", rest: "#9A8F7E", shape: "#6E8F3A", device: "#5B6E8A", bake: "#D64530" };
const ACT_LEGEND = ["take", "mix", "fold", "fridge", "rest", "shape", "device", "bake"];

function ActIcon({ a }) {
  const c = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    take: <path d="M14 14.76V5a2 2 0 1 0-4 0v9.76a4 4 0 1 0 4 0z" />,
    mix: <><path d="M4 11h16" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M15 11l2-6" /></>,
    fold: <><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
    fridge: <><path d="M12 2v20" /><path d="M2 12h20" /><path d="M5 5l14 14" /><path d="M19 5L5 19" /></>,
    rest: <><path d="M6 2h12" /><path d="M6 22h12" /><path d="M6 2c0 4 3 6 6 10 3-4 6-6 6-10" /><path d="M6 22c0-4 3-6 6-10 3 4 6 6 6 10" /></>,
    shape: <><circle cx="12" cy="12" r="5" /><path d="M4 8V5a1 1 0 0 1 1-1h3" /><path d="M20 8V5a1 1 0 0 0-1-1h-3" /><path d="M4 16v3a1 1 0 0 0 1 1h3" /><path d="M20 16v3a1 1 0 0 1-1 1h-3" /></>,
    device: <><path d="M12 2v10" /><path d="M18.4 6.6a9 9 0 1 1-12.8 0" /></>,
    bake: <path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3.5 2.5-5C10 9 11 7 12 3z" />,
  };
  return <svg viewBox="0 0 24 24" width="21" height="21" {...c}>{paths[a] || paths.take}</svg>;
}
const ClockIcon = () => <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "-2px", marginRight: "5px" }}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;

// ── Fabrieksbibliotheek ────────────────────────────────────────────────
const LEAN_START = [
  { id: "s1", title: "Autolyse", act: "mix", gap: 75, scale: false,
    note: "Mengen tot geen droge bloem. 45–90 min (volkoren mag langer).",
    detail: "Alleen meel + water — nog géén zout of levain. Het meel verzadigt en enzymen starten de glutenvorming vanzelf, zodat je later minder hoeft te kneden. Ruw mengen tot er geen droge bloem meer zit; niet kneden. Hou een deel van het water achter voor later (bassinage)." },
  { id: "s2", title: "Levain + zout + restwater", act: "mix", gap: 15, scale: false,
    note: "Knijpen en vouwen tot homogeen.",
    detail: "Check eerst je levain: verdubbeld en koepelend, of doet de float-test. Werk de levain er met natte handen door via de pincer-methode tot opgenomen. Dan pas zout + laatste water — in delen toevoegen (bassinage).\n\nMeer levain = snellere rijs en mildere smaak; minder levain = tragere, complexere en zuurdere rijs. Ruwweg: half zoveel levain ≈ dubbele rijstijd. Daarom verlaagt dit schema de levain automatisch bij meerdere nachten." },
  { id: "s3", title: "Bulk + stretch & folds", act: "fold", gap: 120, scale: true,
    note: "Laatste ~⅓ van de bulk ongestoord laten rijzen.",
    detail: "Doel: kracht en gluten opbouwen en gas invangen. Stretch & fold: pak één kant, rek omhoog, vouw over het midden; draai de kom 90° en herhaal ×4 per set. Nat deeg: coil fold — til het midden op tot de uiteinden loskomen en onder zichzelf rollen. Aan het eind licht koepelend, ~20–30 % gerezen is genoeg." },
  { id: "s4", title: "In de koelkast — koude bulk", act: "fridge", gap: 0, scale: false,
    note: "Als bulkmassa in een afgesloten tub.",
    detail: "Koude bulk = fermentatie vertraagd bij 4–6 °C. Dit bouwt smaak en zuur op én geeft flexibiliteit om te vormen wanneer het uitkomt. In de koeling rijst het nog ~30–50 %. Kouder = trager en minder zuur. Bij 2+ nachten liever 3–4 °C en minder levain — dat doet dit schema automatisch." },
];

const DEFAULT_LIBRARY = [
  {
    id: "focaccia", label: "Focaccia", ink: "#5F7A2C", tint: "#E7ECD4", node: "#5F7A2C",
    coldIdeal: 14, retard: false, bakeTemp: 230, unit: "plaat", useHyd: true, flour: 500, hyd: 74, bass: 0.24, levain: 100, levainMulti: 65, max: 4,
    waterPhase: "s1", bassPhase: "s2", levainPhase: "s2",
    ing: [
      { name: "tipo 00", g: 300, group: "Bloem/meel", phase: "s1" },
      { name: "manitoba", g: 100, group: "Bloem/meel", phase: "s1" },
      { name: "semolina", g: 100, group: "Bloem/meel", phase: "s1" },
      { name: "honing", g: 7, group: "Zoet", phase: "s2" },
      { name: "zout", g: 10, group: "Zout", phase: "s2" },
      { name: "olijfolie (deeg)", g: 30, group: "Vet", phase: "s3" },
      { name: "water", g: 40, group: "Pekel", phase: "f2" },
      { name: "olijfolie", g: 30, group: "Pekel", phase: "f2" },
      { name: "zout", g: 2, group: "Pekel", phase: "f2" },
    ],
    startSteps: LEAN_START,
    bakeSteps: [
      { id: "f1", title: "Uit koeling → geoliede plaat", act: "take", gap: 190, scale: true,
        note: "Uitrekken, afdekken op een warme plek. Nog niet dimpelen.",
        detail: "Kantel het deeg voorzichtig uit de bak op een royaal geoliede plaat — niet ontgassen. Trek het zachtjes richting de hoeken; springt het terug, laat het 20 min rusten en herhaal. Laat het afgedekt op een warme plek tot het luchtig, bubbelig en verdubbeld in de plaat staat." },
      { id: "f2", title: "Dimpelen + pekel + topping", act: "shape", gap: 25, scale: false,
        note: "Vingers tot de bodem. 15–20 min rusten.",
        detail: "Klop de pekel los (water + olijfolie + snuf zout) en giet die over het gerezen deeg. Dimpel met je vingertoppen recht naar beneden tot op de bodem. Stevig, maar ontgas niet volledig. Druk je topping erin en laat 15–20 min rusten." },
      { id: "f3", title: "Focaccia bakken", act: "bake", bake: true, dur: 30,
        note: "Hetelucht plus, 220–230 °C, 25–30 min. Geen stoom.",
        detail: "Droog bakken op Hetelucht plus, 220–230 °C, 25–30 min tot goudbruin; onderin of op een voorverwarmde steen voor een krokante bodem. Geen stoom — dat werkt de knapperige korst tegen. Uit de oven: meteen extra olijfolie + zeezout." },
    ],
  },
  {
    id: "boule", label: "Boules", ink: "#B15511", tint: "#F5E6D2", node: "#B15511",
    coldIdeal: 16, retard: true, bakeTemp: 250, unit: "boule", useHyd: true, flour: 450, hyd: 78, bass: 0.07, levain: 90, levainMulti: 60, max: 8,
    waterPhase: "s1", bassPhase: "s2", levainPhase: "s2",
    ing: [
      { name: "T65", g: 300, group: "Bloem/meel", phase: "s1" },
      { name: "manitoba", g: 75, group: "Bloem/meel", phase: "s1" },
      { name: "spelt", g: 50, group: "Bloem/meel", phase: "s1" },
      { name: "rogge", g: 25, group: "Bloem/meel", phase: "s1" },
      { name: "zout", g: 10, group: "Zout", phase: "s2" },
    ],
    startSteps: LEAN_START,
    bakeSteps: [
      { id: "b1", title: "Uit koeling", act: "take", gap: 45, scale: false,
        note: "30–45 min op kamertemp bijkomen. Koud deeg vormt makkelijk.",
        detail: "Koud deeg is stugger en juist daardoor makkelijker strak te vormen — laat het niet te warm worden. Ondertussen werkblad, deegsteker en banneton klaarleggen." },
      { id: "b2", title: "Verdelen + voorvormen", act: "shape", gap: 30, scale: false,
        note: "Bankrust 20–30 min.",
        detail: "Stort het deeg op een licht bebloemd werkblad en verdeel in gelijke stukken (weeg ze). Voorvormen = losjes tot een ronde bal vouwen met net genoeg spanning zodat het bolt — nog niet strak. Naad onder, dan 20–30 min bankrust, onafgedekt." },
      { id: "b3", title: "Eindvorm → banneton (naad boven)", act: "shape", gap: 105, scale: true,
        note: "Kamertemp. Poke-test: veert traag terug = rijp.",
        detail: "Draai de voorgevormde bal om (gladde kant onder). Vouw de vier randen strak naar het midden, draai om zodat de naad onder ligt. Spanning opbouwen: sleep de bal in kleine draaiende bewegingen over het nauwelijks bebloemde blad — de onderkant pakt en trekt de bovenhuid strak. Scheurt hij? Te veel spanning. Glijdt hij weg? Te veel bloem. Leg met de naad BOVEN in een met rijstebloem bestoven banneton." },
      { id: "b4", title: "Boules bakken", act: "bake", bake: true, dur: 45,
        note: "20 min dicht/stoom @240 °C → 20–25 min open @225 °C. Kern ~96 °C.",
        detail: "Kantel de boule uit de banneton op bakpapier en scoor met een scheermesje onder ~45°, één besliste snede. Dutch oven: deksel dicht 20 min @240 °C, dan deksel eraf 20–25 min @225 °C. Steamoven: 100 % stoom de eerste ~15–20 min, daarna droog op Hetelucht plus ~220 °C. Gaar bij kern ~96 °C. Volledig laten afkoelen (min. 1 u)." },
    ],
  },
  {
    id: "volkoren", label: "Volkoren", ink: "#6B4A2B", tint: "#E7DBC9", node: "#6B4A2B",
    coldIdeal: 16, retard: true, bakeTemp: 250, unit: "boule", useHyd: true, flour: 450, hyd: 82, bass: 0.10, levain: 90, levainMulti: 60, max: 4,
    waterPhase: "s1", bassPhase: "s2", levainPhase: "s2",
    ing: [
      { name: "volkoren", g: 300, group: "Bloem/meel", phase: "s1" },
      { name: "manitoba", g: 100, group: "Bloem/meel", phase: "s1" },
      { name: "spelt", g: 50, group: "Bloem/meel", phase: "s1" },
      { name: "zout", g: 10, group: "Zout", phase: "s2" },
    ],
    startSteps: LEAN_START,
    bakeSteps: [
      { id: "v1", title: "Uit koeling", act: "take", gap: 45, scale: false,
        note: "30–45 min op kamertemp bijkomen.",
        detail: "Zemelen maken het deeg minder elastisch; koud vormt het makkelijker. Laat 30–45 min bijkomen en leg banneton en deegsteker klaar." },
      { id: "v2", title: "Verdelen + voorvormen", act: "shape", gap: 30, scale: false,
        note: "Bankrust 20–30 min.",
        detail: "Verdeel in gelijke stukken en vorm losjes voor. Volkoren voelt door de zemelen minder rekbaar — werk wat zachter en forceer geen spanning." },
      { id: "v3", title: "Eindvorm → banneton (naad boven)", act: "shape", gap: 105, scale: true,
        note: "Poke-test: veert traag terug = rijp.",
        detail: "Vorm strak maar zacht; volkoren scheurt eerder dan wit deeg. Naad boven in een met rijstebloem bestoven banneton. Volkoren rijst wat trager en compacter — laat 'm niet te ver gaan." },
      { id: "v4", title: "Volkoren bakken", act: "bake", bake: true, dur: 45,
        note: "Als de boules; bakt donkerder, vaak ~5 min langer.",
        detail: "Scoor en bak als de witte boules. Volkoren kleurt sneller en heeft meestal 5 min extra nodig; kern ~96 °C. Bakt prima samen met de boules in dezelfde ovensessie." },
    ],
  },
  {
    id: "pita", label: "Pita's", ink: "#C0872E", tint: "#F2E6C8", node: "#C0872E",
    coldIdeal: 14, retard: false, bakeTemp: 290, unit: "stuk", useHyd: true, flour: 60, hyd: 65, bass: 0.05, levain: 11, levainMulti: 8, max: 12,
    waterPhase: "s1", bassPhase: "s2", levainPhase: "s2",
    ing: [
      { name: "T65", g: 50, group: "Bloem/meel", phase: "s1" },
      { name: "manitoba", g: 10, group: "Bloem/meel", phase: "s1" },
      { name: "zout", g: 1, group: "Zout", phase: "s2" },
      { name: "olijfolie", g: 2, group: "Vet", phase: "s2" },
    ],
    startSteps: LEAN_START,
    bakeSteps: [
      { id: "p1", title: "Uit koeling", act: "take", gap: 40, scale: false,
        note: "~40 min op kamertemp. Steen/plaat vast op max voorverwarmen (275–290 °C).",
        detail: "Koud deeg veert te veel terug bij het uitrollen. Verwarm ondertussen een baksteen of staal op de hoogste ovenstand minstens 45 min voor, of gebruik een droge gietijzeren pan op hoog vuur. Hoe heter de plaat, hoe explosiever de pocket opblaast." },
      { id: "p2", title: "Verdelen + opbollen", act: "shape", gap: 45, scale: true,
        note: "Weeg voor gelijke dikte (~110 g). Daarna bolrust.",
        detail: "Verdeel in gelijke stukken en bol strak op. Gelijke bollen = gelijke dikte = gelijkmatig puffen. Afgedekt wegleggen voor de bolrust; dit ontspant het gluten zodat je kunt uitrollen zonder terugkrimpen." },
      { id: "p3", title: "Uitrollen tot lappen ~4–5 mm", act: "shape", gap: 15, scale: false,
        note: "Gelijkmatig, minimale bloem, geen dikke rand.",
        detail: "Rol elke bol uit tot een ronde lap van ~4–5 mm, overal even dik. Overtollige bloem isoleert het deeg en remt het puffen. Draai de lap tussendoor een kwartslag." },
      { id: "p4", title: "Uitgerold laten rusten", act: "rest", gap: 10, scale: false,
        note: "10–15 min onder een doek.",
        detail: "Meteen bakken laat ze krimpen en slecht puffen; deze korte rust laat het gluten ontspannen zodat ze in één keer opblazen." },
      { id: "p5", title: "Pita's bakken", act: "bake", bake: true, dur: 15,
        note: "~1–2 min per kant; puft op in ~30–60 sec.",
        detail: "Leg de lappen op de gloeihete plaat. Ze puffen binnen ~30–60 sec op; keer na ~1–1,5 min en bak nog ~1 min. Wikkel ze meteen in een theedoek — dat houdt stoom vast en maakt ze zacht. Puffen ze niet? Te dik uitgerold, te veel bloem, of de plaat niet heet genoeg." },
    ],
  },
  {
    id: "worst", label: "Worstenbroodjes", ink: "#9E3B2E", tint: "#F1D9D3", node: "#9E3B2E",
    coldIdeal: 14, retard: false, bakeTemp: 200, unit: "stuk", useHyd: false, flour: 50, hyd: 0, bass: 0, levain: 10, levainMulti: 7, max: 12,
    waterPhase: null, bassPhase: null, levainPhase: "w1",
    ing: [
      { name: "bloem", g: 50, group: "Bloem/meel", phase: "w1" },
      { name: "melk", g: 18, group: "Zuivel/ei", phase: "w1" },
      { name: "ei", g: 6, group: "Zuivel/ei", phase: "w1" },
      { name: "suiker", g: 3, group: "Zoet", phase: "w1" },
      { name: "zout", g: 1, group: "Zout", phase: "w1" },
      { name: "boter", g: 5, group: "Vet", phase: "w1" },
    ],
    startSteps: [
      { id: "w1", title: "Deeg kneden + verrijken", act: "mix", gap: 45, scale: false,
        note: "Kneed tot glutenvenster; boter er ná de eerste ontwikkeling in.",
        detail: "Verrijkt deeg — kneden i.p.v. autolyse/folds. Meng bloem, melk, ei, suiker, zout en levain en kneed tot een soepel deeg. Werk dan de zachte boter er in delen door en kneed tot een glutenvenster. Goed ontwikkeld deeg geeft een pluizige kruim." },
      { id: "w2", title: "Bulk", act: "fold", gap: 135, scale: true,
        note: "1–2 keer vouwen in het eerste uur. Tot ~30–50 % gerezen.",
        detail: "Geef in het eerste uur 1–2 lichte vouwen voor extra kracht. Verrijkt zuurdesem rijst trager door de boter — verwacht een rustiger volume vóór de koeling." },
      { id: "w3", title: "In de koelkast — koude bulk", act: "fridge", gap: 0, scale: false,
        note: "Afgesloten tub. Koud wordt het stevig en makkelijk te vormen.",
        detail: "Naast smaak en planning is dit voor verrijkt deeg extra fijn: koud is de boter stevig en het deeg strak — veel makkelijker om de worst in te rollen." },
    ],
    bakeSteps: [
      { id: "w4", title: "Deeg uit koeling", act: "take", gap: 45, scale: false,
        note: "~40 min op kamertemp laten komen.",
        detail: "Koud vormt makkelijk, maar te koud rolt stroef. Verwarm de oven alvast voor op 200 °C tijdens de narijs." },
      { id: "w5", title: "Verdelen + vullen", act: "shape", gap: 30, scale: false,
        note: "Uitrollen tot reepjes, vulling erin, naad onder.",
        detail: "Verdeel in gelijke stukken en rol elk uit tot een reep. Vulling erop, strak inrollen met de naad onder zodat ze niet openvallen. Uiteinden licht dichtdrukken." },
      { id: "w6", title: "Narijzen", act: "rest", gap: 120, scale: true,
        note: "Tot luchtig en duidelijk gerezen. Oven voor op 200 °C.",
        detail: "Laat afgedekt narijzen tot luchtig en zichtbaar gerezen (poke-test: veert traag terug). Verrijkt zuurdesem is traag — geduld voorkomt compacte broodjes." },
      { id: "w7", title: "Eiwash + bakken", act: "bake", bake: true, dur: 30,
        note: "Bestrijken met ei · 200 °C · 18–22 min goudbruin.",
        detail: "Bestrijk met losgeklopt ei voor een glanzende korst. Bak op ~200 °C, 18–22 min — bewust lager dan lean brood, want ei en suiker kleuren snel. Ze vriezen goed in." },
    ],
  },
  {
    id: "babka", label: "Babka", ink: "#7A4458", tint: "#EFDCE2", node: "#7A4458",
    coldIdeal: 14, retard: false, bakeTemp: 175, unit: "blik", useHyd: false, flour: 310, hyd: 0, bass: 0, levain: 138, levainMulti: 95, max: 3,
    waterPhase: null, bassPhase: null, levainPhase: "k1",
    ing: [
      { name: "patentbloem (11–12% eiwit)", g: 310, group: "Bloem/meel", phase: "k1" },
      { name: "volle melk (koud)", g: 107, group: "Zuivel/ei", phase: "k1" },
      { name: "ei (~2 stuks, koud)", g: 107, group: "Zuivel/ei", phase: "k1" },
      { name: "fijne kristalsuiker", g: 29, group: "Zoet", phase: "k1" },
      { name: "zout", g: 8, group: "Zout", phase: "k1" },
      { name: "roomboter (kamertemp)", g: 100, group: "Vet", phase: "k1" },
      { name: "donkerbruine basterdsuiker", g: 200, group: "Vulling", phase: "k4" },
      { name: "roomboter, gesmolten", g: 70, group: "Vulling", phase: "k4" },
      { name: "bloem", g: 15, group: "Vulling", phase: "k4" },
      { name: "kaneel", g: 8, group: "Vulling", phase: "k4" },
      { name: "zout", g: 1, group: "Vulling", phase: "k4" },
      { name: "ei (eiwash)", g: 55, group: "Afwerking", phase: "k8" },
      { name: "melk (eiwash)", g: 15, group: "Afwerking", phase: "k8" },
      { name: "suiker (siroop)", g: 52, group: "Afwerking", phase: "k8" },
      { name: "water (siroop)", g: 59, group: "Afwerking", phase: "k8" },
    ],
    startSteps: [
      { id: "k1", title: "Deeg mixen + boter inwerken", act: "mix", gap: 30, scale: false,
        note: "Mixer, deeghaak. Halve suiker vooraf, rest later. Boter pat voor pat.",
        detail: "Bloem, melk, ei, de hélft van de suiker, zout en levain in de kom. Kort mengen tot alles is opgenomen, dan 10 min onafgedekt laten staan.\n\nDaarna op middelhoog kneden tot het deeg van de kom loslaat (op een KitchenAid op stand 2 duurt dat in de praktijk een stuk langer dan 5 min — reken op 15–20 min). Laat nu de rest van de suiker er langzaam bij lopen en kneed tot het deeg weer samenkomt.\n\nVoeg de boter toe in klontjes van ~1 cm, telkens pas de volgende als de vorige is opgenomen. Kneed door tot het deeg glad wordt en bijna het vliesje haalt. Streef naar een deegtemperatuur van 24 °C." },
      { id: "k2", title: "Warme bulk + 2× stretch & fold", act: "fold", gap: 120, scale: true,
        note: "23–24 °C. Vouwen na 30 en 60 min, daarna met rust laten.",
        detail: "Twee sets vouwen is genoeg — verrijkt deeg heeft vooral kneedkracht nodig, niet veel vouwen. Na de tweede set afgedekt laten staan.\n\nAan het eind moet het deeg iets gerezen, bol en glad zijn. Zie je helemaal niets gebeuren, geef het dan 30–60 min extra voordat het de koeling in gaat." },
      { id: "k3", title: "In de koelkast — koude bulk", act: "fridge", gap: 0, scale: false,
        note: "Afgedekt, nacht in de koeling. Koud deeg is cruciaal voor het uitrollen.",
        detail: "De koeling doet hier twee dingen: smaakopbouw én het stevig maken van de boter. Warm babka-deeg is vrijwel niet uit te rollen en te vullen — koud wel.\n\nVeel rijs zie je 's nachts niet, dat is normaal. Langer dan 12 uur mag prima; tot ~20 uur blijft het goed." },
    ],
    bakeSteps: [
      { id: "k4", title: "Vulling maken + deeg uit koeling", act: "take", gap: 15, scale: false,
        note: "In een pannetje zachtjes verwarmen tot het vloeibaar en smeerbaar is.",
        detail: "Maak de vulling vóórdat het deeg uit de koeling komt. Alles in een pannetje en op laag vuur verwarmen tot de suiker nat glanst en het geheel soepel en smeerbaar wordt — koud geroerd blijft het een korrelige, kruimelige massa die je niet uitgesmeerd krijgt.\n\nLaat 'm iets afkoelen tot de dikte van zachte pindakaas: te warm smelt hij in het koude deeg en loopt uit de rol.\n\nChocoladevariant (in plaats van kaneel): 110 g suiker, 75 g boter, 70 g pure chocolade, 25 g cacao. Smelt de boter, haal van het vuur, roer suiker en chocolade erdoor tot glad, dan de cacao." },
      { id: "k5", title: "Uitrollen + vullen + oprollen", act: "shape", gap: 15, scale: false,
        note: "Rechthoek ~25 × 30 cm. Strak oprollen vanaf de korte zijde.",
        detail: "Stort het koude deeg op een bebloemd blad en rol uit tot een rechthoek van ongeveer 25 × 30 cm, korte zijde naar je toe. Wil je meer laagjes en minder dikke vullingsaders: rol langer uit, tot ~25 × 60 cm.\n\nSmeer de vulling uit en houd ~2,5 cm vrij aan de verste korte zijde. Rol vanaf je toe naar strak op en trek bij elke slag het deeg aan — losjes oprollen geeft holtes in de vlecht." },
      { id: "k6", title: "15 min de vriezer in", act: "rest", gap: 15, scale: false,
        note: "Rol op een bakplaat, 15 min vriezer. Niet overslaan.",
        detail: "Dit is de stap die het verschil maakt tussen netjes vlechten en een plakkende bende. Door de korte vriesbeurt stolt de boter in de vulling en snijdt de rol schoon door." },
      { id: "k7", title: "Snijden + vlechten → blik", act: "shape", gap: 210, scale: true,
        note: "Rol in de lengte doorsnijden, vlechten, in beboterd blik met bakpapier.",
        detail: "Snijd de rol met een scherp mes in de lengte volledig door, zodat de laagjes open liggen. Knijp de twee bovenkanten aan elkaar en vlecht de strengen om elkaar, snijkant zoveel mogelijk naar boven. Onderaan weer samenknijpen.\n\nLeg bakpapier in het blik met twee 'oren' over de lange zijden — daarmee til je de babka er na het bakken uit. Blik ~23 × 10 × 10 cm (Pullman) of een standaard broodblik van ~21 × 11 cm.\n\nNarijzen op ~26 °C tot het deeg tot ongeveer 1 cm onder de rand staat. Reken op 3,5–4 uur; koud uit de koeling kan het langer duren. Te ver laten gaan zakt na het bakken in." },
      { id: "k8", title: "Eiwash + bakken", act: "bake", bake: true, dur: 45,
        note: "175 °C boven-/onderwarmte · 40–50 min · kern 93 °C. Daarna siroop.",
        detail: "Oven voorverwarmen op 175 °C, rooster in het midden, géén hetelucht — bij hetelucht kleurt de suiker te snel voor de kern gaar is. Zet het blik op een met bakpapier beklede bakplaat; er lekt gegarandeerd suiker uit.\n\nBestrijk met losgeklopt ei + melk en bak 40–50 min tot de kern 93 °C is. Kleurt hij te snel in de laatste 10 min, dek dan losjes af met folie of zak 10 °C.\n\nMaak ondertussen de siroop: suiker en water zachtjes verwarmen tot de suiker volledig is opgelost. Na het bakken de korte zijden losmaken met een spatel, dun insmeren met siroop, precies 10 min in het blik laten staan en er dán uittillen — langer wachten maakt hem vastplakken." },
    ],
  },
  {
    id: "grieksepita", label: "Griekse pita", ink: "#2E6F8E", tint: "#D9E7EF", node: "#2E6F8E",
    coldIdeal: 14, retard: false, bakeTemp: 0, oven: false, unit: "stuk", useHyd: true, flour: 60, hyd: 52, bass: 0.05, levain: 12, levainMulti: 9, max: 12,
    waterPhase: "s1", bassPhase: "s2", levainPhase: "s2",
    ing: [
      { name: "T65 / patentbloem", g: 55, group: "Bloem/meel", phase: "s1" },
      { name: "manitoba", g: 5, group: "Bloem/meel", phase: "s1" },
      { name: "Griekse yoghurt (vol)", g: 12, group: "Zuivel/ei", phase: "s2" },
      { name: "zout", g: 1.2, group: "Zout", phase: "s2" },
      { name: "olijfolie", g: 4, group: "Vet", phase: "s2" },
      { name: "olijfolie (bakken/insmeren)", g: 3, group: "Afwerking", phase: "gp4" },
    ],
    startSteps: LEAN_START,
    bakeSteps: [
      { id: "gp1", title: "Uit koeling", act: "take", gap: 45, scale: false,
        note: "~45 min op kamertemp. Koud deeg krimpt terug bij het uitrollen.",
        detail: "Anders dan de pocket-pita wil deze geen gloeiende steen: hij bakt in een pan. Laat het deeg dus rustig op temperatuur komen en zet alvast een zware koekenpan of gietijzeren plaat klaar." },
      { id: "gp2", title: "Verdelen + opbollen", act: "shape", gap: 45, scale: true,
        note: "~110 g per stuk, strak opbollen. Daarna bolrust onder een doek.",
        detail: "Weeg gelijke stukken en bol strak op. De bolrust ontspant het gluten; sla 'm niet over, anders krimpt de lap bij elke haal van de deegroller terug." },
      { id: "gp3", title: "Uitrollen tot ~5 mm", act: "shape", gap: 15, scale: false,
        note: "Dikker dan pocket-pita — dat is precies de bedoeling.",
        detail: "Rol uit tot ovalen of ronde lappen van ongeveer 5 mm, iets dikker dan een pocket-pita. Je wílt hier géén holle pocket: dik genoeg houden en niet te heet bakken zorgt dat hij zacht en vouwbaar blijft in plaats van op te blazen." },
      { id: "gp4", title: "Bakken in de pan", act: "bake", bake: true, dur: 15,
        note: "Droge pan op middelhoog · 1–2 min per kant · daarna insmeren met olijfolie.",
        detail: "Bak in een droge, goed hete maar niet gloeiende pan (middelhoog): ~1,5 min tot er blaasjes en bruine vlekken komen, dan omdraaien en nog ~1 min. Te heet = pocket en een droge pita; te koel = taai.\n\nSmeer ze direct uit de pan in met olijfolie en stapel ze onder een theedoek — dat stoomt ze zacht en soepel. Zo blijven ze goed rollen om gyros of souvlaki." },
    ],
  },
  {
    id: "pinsa", label: "Pinsa", ink: "#A8681C", tint: "#F3E4CC", node: "#A8681C",
    coldIdeal: 48, retard: true, bakeTemp: 300, unit: "pinsa", useHyd: true, flour: 140, hyd: 80, bass: 0.20, levain: 28, levainMulti: 18, max: 6,
    waterPhase: "s1", bassPhase: "s2", levainPhase: "s2",
    ing: [
      { name: "tipo 0 / manitoba", g: 110, group: "Bloem/meel", phase: "s1" },
      { name: "rijstebloem", g: 15, group: "Bloem/meel", phase: "s1" },
      { name: "sojabloem", g: 15, group: "Bloem/meel", phase: "s1" },
      { name: "zout", g: 3, group: "Zout", phase: "s2" },
      { name: "olijfolie", g: 5, group: "Vet", phase: "s3" },
      { name: "rijstebloem / semola (uitrekken)", g: 10, group: "Afwerking", phase: "pn3" },
    ],
    startSteps: LEAN_START,
    bakeSteps: [
      { id: "pn1", title: "Uit koeling", act: "take", gap: 120, scale: true,
        note: "2 uur op kamertemp. Pinsa-deeg moet écht ontspannen zijn.",
        detail: "Pinsa heeft een lange, koude rijs nodig — 24 uur is het minimum, 48–72 uur geeft duidelijk meer smaak en een beter verteerbaar deeg. Zet je bakdag dus gerust twee of drie dagen na de startdag.\n\nLaat het deeg daarna volledig op kamertemperatuur komen; koud uitrekken scheurt." },
      { id: "pn2", title: "Verdelen + bollen (panetti)", act: "shape", gap: 120, scale: true,
        note: "~280 g per stuk, losjes bollen. Daarna afgedekt laten ontspannen.",
        detail: "Verdeel in stukken van ongeveer 280 g en bol losjes op — niet strak, je wilt de luchtbellen bewaren. Leg ze afgedekt in geoliede bakjes (appretto) tot ze week en bubbelig aanvoelen." },
      { id: "pn3", preBake: true, title: "Uitrekken op rijstebloem", act: "shape", gap: 15, scale: false,
        note: "Ovaal ~30 cm, met de vingertoppen. Niet rollen.",
        detail: "Bestuif royaal met rijstebloem of semola en druk het deeg met je vingertoppen uit tot een langwerpig ovaal van ~30 cm — de klassieke pinsa-vorm. Gebruik géén deegroller: die jaagt de lucht eruit en je verliest de luchtige, alveolaire kruim die pinsa z'n naam geeft.\n\nVeeg overtollige bloem eraf voordat hij de oven in gaat." },
      { id: "pn4", title: "Voorbakken + beleggen + afbakken", act: "bake", bake: true, dur: 15,
        note: "Steen op max (280–300 °C). Blanco 4–5 min, beleggen, nog 3–5 min.",
        detail: "Pinsa bakt in twee fases: eerst de kale bodem 4–5 min op een gloeiend hete steen of staal tot hij stevig is en licht kleurt. Haal 'm eruit, beleg met saus, kaas en topping, en bak nog 3–5 min af tot de randen diep gekleurd zijn.\n\nDie voorbak is wat pinsa krokant-van-buiten en luchtig-van-binnen maakt: bij 80% hydratatie wordt een in één keer belegde bodem week. Oven zo heet mogelijk — 280–300 °C, steen minstens 45 min voorverwarmen." },
    ],
  },
  {
    id: "ciabatta", label: "Ciabatta", ink: "#7A8B5C", tint: "#E6EBDC", node: "#7A8B5C",
    coldIdeal: 14, retard: true, bakeTemp: 250, unit: "stuk", useHyd: true, flour: 200, hyd: 85, bass: 0.15, levain: 40, levainMulti: 26, max: 6,
    waterPhase: "s1", bassPhase: "s2", levainPhase: "s2",
    ing: [
      { name: "tarwebloem / tipo 0", g: 160, group: "Bloem/meel", phase: "s1" },
      { name: "manitoba", g: 40, group: "Bloem/meel", phase: "s1" },
      { name: "zout", g: 4, group: "Zout", phase: "s2" },
      { name: "semola / bloem (werkblad)", g: 20, group: "Afwerking", phase: "cb2" },
    ],
    startSteps: LEAN_START,
    bakeSteps: [
      { id: "cb1", title: "Uit koeling", act: "take", gap: 60, scale: false,
        note: "~1 uur bijkomen. Niet ontgassen — de bellen zijn het hele punt.",
        detail: "Ciabatta is bewust nat (85%) en de kruim moet grof en onregelmatig worden. Behandel het deeg vanaf nu zo zacht mogelijk: elke keer dat je het plat drukt, verlies je precies waar je op gewacht hebt." },
      { id: "cb2", title: "Storten + verdelen", act: "shape", gap: 45, scale: true,
        note: "Royaal bebloemd blad. Rechthoek trekken, in repen snijden. Niet vormen.",
        detail: "Kantel het deeg voorzichtig uit de bak op een royaal met semola bestoven blad — laat de zwaartekracht het werk doen. Trek het losjes tot een rechthoek en snijd met een deegsteker in repen (de klassieke 'pantoffel'-vorm).\n\nEr wordt hier niet gevormd en niet opgebold. Hooguit de uiteinden iets instoppen. Laat de repen onafgedekt op het bebloemde blad rusten." },
      { id: "cb3", preBake: true, title: "Omdraaien op bakpapier", act: "shape", gap: 15, scale: false,
        note: "Met twee handen optillen, omdraaien, licht uitrekken.",
        detail: "Til elke reep met beide handen op onder de uiteinden, draai 'm om (de onderkant wordt de bovenkant) en leg 'm op bakpapier. Trek 'm daarbij iets uit in de lengte. Deze draai is wat ciabatta z'n karakteristieke grillige bovenkant geeft." },
      { id: "cb4", title: "Ciabatta bakken", act: "bake", bake: true, dur: 30,
        note: "250 °C met stoom 15 min → 230 °C droog 10–15 min. Niet scoren.",
        detail: "Steen of staal voorverwarmen op 250 °C. Schuif de ciabatta erop met flink stoom (Miele: 100 % stoom) de eerste 15 min, dan droog verder op 230 °C tot diep goudbruin, 10–15 min.\n\nNiet scoren — ciabatta scheurt vanzelf open waar hij wil. Kern ~97 °C. Volledig laten afkoelen voor je snijdt, anders klapt de natte kruim dicht." },
    ],
  },
  {
    id: "baguette", label: "Baguette", ink: "#4F6D8F", tint: "#DCE5EE", node: "#4F6D8F",
    coldIdeal: 14, retard: true, bakeTemp: 250, unit: "stuk", useHyd: true, flour: 180, hyd: 72, bass: 0.08, levain: 36, levainMulti: 24, max: 6,
    waterPhase: "s1", bassPhase: "s2", levainPhase: "s2",
    ing: [
      { name: "T65", g: 180, group: "Bloem/meel", phase: "s1" },
      { name: "zout", g: 3.5, group: "Zout", phase: "s2" },
      { name: "bloem (couche)", g: 15, group: "Afwerking", phase: "bg3" },
    ],
    startSteps: LEAN_START,
    bakeSteps: [
      { id: "bg1", title: "Uit koeling", act: "take", gap: 45, scale: false,
        note: "~45 min bijkomen. Koud deeg laat zich strakker vormen.",
        detail: "Leg alvast je couche (linnen doek) klaar met flink bloem erin, plus een plank of omgekeerde bakplaat om straks over te zetten. Baguette draait volledig om spanning opbouwen: koel deeg helpt daarbij." },
      { id: "bg2", title: "Verdelen + voorvormen", act: "shape", gap: 30, scale: false,
        note: "~350 g per stuk. Losse cilinder, naad onder. Bankrust 20–30 min.",
        detail: "Verdeel in gelijke stukken en vouw elk losjes tot een korte cilinder — nog niet strak. Deze voorvorm bepaalt of de eindvorm gelijkmatig wordt; een scheve cilinder geeft een scheve baguette.\n\nBankrust onafgedekt, naad onder." },
      { id: "bg3", title: "Eindvorm → couche", act: "shape", gap: 75, scale: true,
        note: "Oprollen in 3 stappen, dan uitrollen tot ~40–45 cm. Naad onder in de couche.",
        detail: "Druk de cilinder uit tot een rechthoek, vouw de bovenste derde naar het midden en druk aan; vouw dan dubbel over de volle lengte en sluit de naad met de muis van je hand. Rol vervolgens met beide handen uit vanuit het midden naar buiten tot ~40–45 cm — of zo lang als je oven aankan.\n\nLeg ze met de naad ónder in de couche, met een plooi stof ertussen zodat ze elkaar niet raken. Narijs tot ze week aanvoelen maar nog veerkracht hebben; te ver = geen oor bij het scoren." },
      { id: "bg4", title: "Scoren + bakken", act: "bake", bake: true, dur: 30,
        note: "250 °C met stoom 13 min → 230 °C droog 12–15 min.",
        detail: "Rol de baguettes van de couche op een plank en schuif ze op bakpapier. Scoren: mesje bijna plat (20–30°), 3–5 overlappende sneden in de lengte-as, niet dwars — dat is het verschil tussen een oor en een barst.\n\nSteen op 250 °C, flink stoom (Miele: 100 %) de eerste 13 min, daarna droog op 230 °C 12–15 min tot diep gekleurd. Laatste 5 min de deur op een kier voor een knappende korst." },
    ],
  },
  {
    id: "shokupan", label: "Shokupan", ink: "#C2897A", tint: "#F5E3DE", node: "#C2897A",
    coldIdeal: 14, retard: false, bakeTemp: 190, unit: "blik", useHyd: false, flour: 300, hyd: 0, bass: 0, levain: 90, levainMulti: 60, max: 3,
    waterPhase: null, bassPhase: null, levainPhase: "sk2",
    ing: [
      { name: "bloem (tangzhong)", g: 20, group: "Bloem/meel", phase: "sk1" },
      { name: "volle melk (tangzhong)", g: 100, group: "Zuivel/ei", phase: "sk1" },
      { name: "patentbloem / manitoba", g: 280, group: "Bloem/meel", phase: "sk2" },
      { name: "volle melk", g: 90, group: "Zuivel/ei", phase: "sk2" },
      { name: "suiker", g: 30, group: "Zoet", phase: "sk2" },
      { name: "zout", g: 6, group: "Zout", phase: "sk2" },
      { name: "roomboter (kamertemp)", g: 30, group: "Vet", phase: "sk2" },
      { name: "melk (bestrijken)", g: 10, group: "Afwerking", phase: "sk7" },
    ],
    startSteps: [
      { id: "sk1", title: "Tangzhong koken + afkoelen", act: "mix", gap: 30, scale: false,
        note: "Bloem + melk op laag vuur tot puddingdikte (~65 °C). Volledig laten afkoelen.",
        detail: "Roer de bloem door de koude melk tot er geen klontjes zijn, dan op laag vuur onder voortdurend roeren tot het indikt als pudding en de garde sporen trekt — rond 65 °C. Dat duurt 2–3 min.\n\nDe tangzhong verstijfselt het zetmeel, waardoor het deeg veel meer vocht vasthoudt. Dát maakt shokupan wattig zacht en houdt 'm dagen vers. Afdekken met folie op het oppervlak en volledig laten afkoelen — warm toevoegen doodt je levain." },
      { id: "sk2", title: "Deeg mixen + boter inwerken", act: "mix", gap: 30, scale: false,
        note: "Kneden tot volledig glutenvenster. Boter pas ná de eerste ontwikkeling.",
        detail: "Alles behalve de boter in de kom, inclusief de afgekoelde tangzhong. Kneed tot een samenhangend deeg, voeg dan de zachte boter in stukjes toe en kneed door.\n\nShokupan is het enige brood op deze lijst waar je écht een volledig glutenvenster wilt: dun uitgerekt deeg waar je doorheen kunt kijken zonder dat het scheurt. Minder dan dat geeft een grove in plaats van wattige kruim. Reken op 15–25 min in de machine." },
      { id: "sk3", title: "Bulk", act: "fold", gap: 150, scale: true,
        note: "Eén set vouwen na 45 min. Tot ~50 % gerezen.",
        detail: "Verrijkt melkdeeg rijst traag. Eén lichte set vouwen in het eerste uur is genoeg; daarna met rust laten tot het duidelijk gegroeid en bol is." },
      { id: "sk4", title: "In de koelkast — koude bulk", act: "fridge", gap: 0, scale: false,
        note: "Afgedekt. Koud deeg rolt veel netter op tot de rollen.",
        detail: "Naast smaak maakt de koeling het deeg stevig genoeg om strak op te rollen. Warm shokupan-deeg plakt en rekt uit, koud rolt het als een droom." },
    ],
    bakeSteps: [
      { id: "sk5", title: "Uit koeling", act: "take", gap: 45, scale: false,
        note: "~45 min bijkomen. Blik invetten.",
        detail: "Blik ~21 × 10 cm (standaard busbrood) of een Pullman van 23 × 10 × 10 cm. Invetten of met bakpapier bekleden. Wil je de strakke rechthoek, bak dan mét deksel." },
      { id: "sk6", title: "Verdelen + oprollen → blik", act: "shape", gap: 240, scale: true,
        note: "3 stukken, elk uitrollen en oprollen. Rollen náást elkaar in het blik.",
        detail: "Verdeel in 3 gelijke stukken. Rol elk uit tot een ovaal, vouw de lange zijden naar het midden tot een reep, en rol die strak op als een rolletje. Leg de drie rolletjes met de naad onder náást elkaar in het blik — die structuur geeft de karakteristieke pluk-kruim.\n\nNarijzen tot het deeg ongeveer 1 cm onder de rand staat (zonder deksel) of het blik voor ~80 % vult (met deksel). Reken op 3,5–4,5 uur; verrijkt zuurdesem is traag. Te ver = ingezakte top." },
      { id: "sk7", title: "Shokupan bakken", act: "bake", bake: true, dur: 40,
        note: "190 °C · 32–38 min · kern 91 °C. Met deksel: 200 °C.",
        detail: "Bestrijk met melk (zonder deksel) en bak op 190 °C boven-/onderwarmte 32–38 min tot diep goudbruin, kern ~91 °C. Met deksel: 200 °C, geen bestrijking.\n\nMeteen uit het blik op een rooster — in het blik laten staan maakt de zijkanten vochtig en laat 'm inzakken. Pas snijden als hij volledig koud is." },
    ],
  },
  {
    id: "burgerbol", label: "Hamburgerbollen", ink: "#A3764A", tint: "#EFE2D2", node: "#A3764A",
    coldIdeal: 14, retard: false, bakeTemp: 190, unit: "stuk", useHyd: false, flour: 50, hyd: 0, bass: 0, levain: 15, levainMulti: 10, max: 12,
    waterPhase: null, bassPhase: null, levainPhase: "hb1",
    ing: [
      { name: "patentbloem", g: 50, group: "Bloem/meel", phase: "hb1" },
      { name: "volle melk", g: 22, group: "Zuivel/ei", phase: "hb1" },
      { name: "ei", g: 5, group: "Zuivel/ei", phase: "hb1" },
      { name: "suiker", g: 3.5, group: "Zoet", phase: "hb1" },
      { name: "zout", g: 1, group: "Zout", phase: "hb1" },
      { name: "roomboter (kamertemp)", g: 5, group: "Vet", phase: "hb1" },
      { name: "ei (eiwash)", g: 5, group: "Afwerking", phase: "hb6" },
      { name: "sesamzaad", g: 1.5, group: "Afwerking", phase: "hb6" },
    ],
    startSteps: [
      { id: "hb1", title: "Deeg mixen + boter inwerken", act: "mix", gap: 30, scale: false,
        note: "Zelfde deegfamilie als shokupan, zonder tangzhong. Kneden tot glutenvenster.",
        detail: "Alles behalve de boter mengen en kneden tot een soepel deeg, dan de zachte boter in stukjes erdoor en doorkneden tot een glutenvenster.\n\nWil je nóg zachtere bollen die langer vers blijven: maak eerst een tangzhong van 10 g bloem + 50 g melk per 6 bollen (koken tot puddingdikte, afkoelen) en trek die hoeveelheden van de bloem en melk in het recept af." },
      { id: "hb2", title: "Bulk", act: "fold", gap: 135, scale: true,
        note: "1–2 lichte vouwen in het eerste uur. Tot ~50 % gerezen.",
        detail: "Geef in het eerste uur een of twee lichte vouwen voor extra kracht, daarna met rust laten tot het deeg duidelijk luchtiger en boller is." },
      { id: "hb3", title: "In de koelkast — koude bulk", act: "fridge", gap: 0, scale: false,
        note: "Afgesloten tub. Koud bollen ze veel strakker op.",
        detail: "De koeling bouwt smaak op én maakt de boter stevig, zodat je de bollen strak kunt opbollen zonder dat het deeg uitrekt." },
    ],
    bakeSteps: [
      { id: "hb4", title: "Uit koeling", act: "take", gap: 45, scale: false,
        note: "~45 min bijkomen.",
        detail: "Laat het deeg niet te warm worden: koud opbollen geeft een strakkere bol die mooier rond blijft in plaats van uit te zakken." },
      { id: "hb5", title: "Verdelen + opbollen", act: "shape", gap: 150, scale: true,
        note: "~100 g per stuk, strak opbollen. Ruim uit elkaar op de plaat.",
        detail: "Weeg gelijke stukken (~100 g) en bol strak op met de hand of de deegsteker — spanning op de huid houdt ze rond tijdens de rijs.\n\nLeg ze met 6–8 cm ruimte op een met bakpapier beklede plaat. Wil je de klassieke platte burgerbol: druk ze na de helft van de narijs licht plat met je handpalm.\n\nNarijzen tot ze duidelijk gezwollen zijn en bij een lichte druk traag terugveren — 2,5–3,5 uur." },
      { id: "hb6", title: "Eiwash + sesam", act: "shape", gap: 10, scale: false,
        note: "Losgeklopt ei met een snuf zout, dun opbrengen. Dan sesam.",
        detail: "Klop het ei los met een snufje zout (dat maakt het vloeibaarder en geeft een gelijkmatiger glans). Dun opbrengen met een kwast — plassen ei in de naden bakken donker aan. Strooi direct daarna het sesamzaad erop zodat het blijft plakken." },
      { id: "hb7", title: "Bollen bakken", act: "bake", bake: true, dur: 20,
        note: "190 °C · 15–18 min · kern 91 °C. Geen stoom.",
        detail: "Bak op 190 °C boven-/onderwarmte, 15–18 min tot goudbruin, kern ~91 °C. Geen stoom en niet heter: ei en suiker kleuren snel, en je wilt een zachte korst, geen knapperige.\n\nAfkoelen op een rooster. Ze vriezen uitstekend in — halveer ze vóór het invriezen, dan kun je ze zo uit de vriezer roosteren." },
    ],
  },
  {
    id: "naan", label: "Naan", ink: "#8E6BA8", tint: "#E8DFF0", node: "#8E6BA8",
    coldIdeal: 14, retard: false, bakeTemp: 0, oven: false, unit: "stuk", useHyd: false, flour: 70, hyd: 0, bass: 0, levain: 14, levainMulti: 9, max: 12,
    waterPhase: null, bassPhase: null, levainPhase: "na1",
    ing: [
      { name: "patentbloem", g: 70, group: "Bloem/meel", phase: "na1" },
      { name: "volle yoghurt", g: 25, group: "Zuivel/ei", phase: "na1" },
      { name: "volle melk", g: 15, group: "Zuivel/ei", phase: "na1" },
      { name: "suiker", g: 2, group: "Zoet", phase: "na1" },
      { name: "zout", g: 1.5, group: "Zout", phase: "na1" },
      { name: "ghee / gesmolten boter", g: 5, group: "Vet", phase: "na1" },
      { name: "boter (knoflookboter)", g: 8, group: "Afwerking", phase: "na7" },
      { name: "knoflook + koriander", g: 3, group: "Afwerking", phase: "na7" },
    ],
    startSteps: [
      { id: "na1", title: "Deeg mixen", act: "mix", gap: 30, scale: false,
        note: "Zacht, licht plakkerig deeg. Kneden tot glad, ~8 min.",
        detail: "Yoghurt is hier het geheim: het zuur verzacht het gluten en geeft naan die kenmerkende malse, taaie beet. Meng alles tot een zacht, licht plakkerig deeg en kneed tot glad — je hoeft géén volledig glutenvenster.\n\nTe stevig deeg geeft droge, crackerachtige naan. Hij mag aan je handen blijven hangen." },
      { id: "na2", title: "Bulk", act: "fold", gap: 120, scale: true,
        note: "Eén set vouwen na 45 min. Tot ~50 % gerezen.",
        detail: "Eén lichte set vouwen is genoeg; naan hoeft geen grote kracht. Laat het daarna rusten tot het zichtbaar luchtig is." },
      { id: "na3", title: "In de koelkast — koude bulk", act: "fridge", gap: 0, scale: false,
        note: "Afgedekt. Koude rijs geeft duidelijk meer smaak.",
        detail: "De koude nacht doet voor naan hetzelfde als voor je boules: diepere smaak en flexibele planning. Het deeg wordt ook steviger en daardoor makkelijker uit te rollen." },
    ],
    bakeSteps: [
      { id: "na4", title: "Uit koeling", act: "take", gap: 45, scale: false,
        note: "~45 min bijkomen. Gietijzeren pan of plaat klaarzetten.",
        detail: "Naan wil een gloeiend hete, droge pan — gietijzer of een zware koekenpan. Zet die alvast op het vuur; hij moet écht heet zijn voordat de eerste erin gaat." },
      { id: "na5", title: "Verdelen + bollen", act: "shape", gap: 45, scale: true,
        note: "~130 g per stuk, bollen. Daarna bolrust onder een doek.",
        detail: "Verdeel in gelijke stukken en bol op. De bolrust ontspant het gluten zodat je straks kunt uitrollen zonder terugkrimpen." },
      { id: "na6", title: "Uitrollen tot druppelvorm", act: "shape", gap: 15, scale: false,
        note: "~5 mm dik, ovaal/druppel. Eén kant mag bevochtigd worden.",
        detail: "Rol uit tot een ovaal of druppelvorm van ~5 mm. Dikker dan een tortilla, dunner dan een pita.\n\nTandoor-truc voor thuis: maak één kant licht vochtig met water en leg die kant in de pan — hij plakt vast en de bovenkant blaast dan explosief op, net als tegen de wand van een tandoor." },
      { id: "na7", title: "Bakken in de pan", act: "bake", bake: true, dur: 15,
        note: "Gloeiend hete droge pan · 1–2 min per kant · knoflookboter erop.",
        detail: "Leg de naan in de gloeiend hete droge pan. Binnen een minuut komen er grote bellen; draai 'm om zodra de onderkant zwarte blaren heeft en bak de andere kant ~1 min. Die geblakerde plekken zijn gewenst — dat is het tandoor-effect.\n\nMeteen uit de pan insmeren met gesmolten boter waarin je knoflook hebt verwarmd, en bestrooien met koriander. Stapelen onder een theedoek houdt ze zacht." },
    ],
  },
  {
    id: "pizza", label: "Pizza napoletana", ink: "#C0392B", tint: "#F6DCD8", node: "#C0392B",
    coldIdeal: 30, retard: true, bakeTemp: 300, unit: "bol", useHyd: true, flour: 150, hyd: 63, bass: 0.05, levain: 30, levainMulti: 20, max: 8,
    waterPhase: "s1", bassPhase: "s2", levainPhase: "s2",
    ing: [
      { name: "tipo 00 (pizzabloem)", g: 150, group: "Bloem/meel", phase: "s1" },
      { name: "zout", g: 4, group: "Zout", phase: "s2" },
      { name: "olijfolie (optioneel)", g: 3, group: "Vet", phase: "s3" },
      { name: "semola (uitrekken)", g: 10, group: "Afwerking", phase: "pz3" },
    ],
    startSteps: LEAN_START,
    bakeSteps: [
      { id: "pz1", title: "Uit koeling", act: "take", gap: 90, scale: true,
        note: "1,5–2 uur op kamertemp. Koud deeg scheurt bij het uitrekken.",
        detail: "Napoletana wil 24–48 uur koude rijs; plan de bakdag dus een of twee dagen na de startdag. Laat het deeg daarna volledig op temperatuur komen — koud uitrekken scheurt de bodem." },
      { id: "pz2", title: "Verdelen + bollen (panetti)", act: "shape", gap: 150, scale: true,
        note: "~280 g per bol, strak bollen. Afgedekt laten ontspannen.",
        detail: "Weeg bollen van ongeveer 280 g en bol ze strak op — strakker dan bij pinsa, want napoletana leeft van een gespannen huid die de cornicione omhoog duwt.\n\nLeg ze met ruimte in een afgedekte bak (of losse bakjes) en laat ze ontspannen tot ze week zijn en licht uitgevloeid. Dit is de 'appretto'." },
      { id: "pz3", preBake: true, title: "Uitrekken op semola", act: "shape", gap: 15, scale: false,
        note: "Vanuit het midden naar buiten duwen. Rand van 1,5–2 cm vrijlaten.",
        detail: "Leg de bol in de semola en druk met je vingertoppen vanuit het midden naar buiten, waarbij je de buitenste 1,5–2 cm volledig met rust laat: dáár zit de lucht die straks de cornicione wordt.\n\nGeen deegroller — die perst alle gas eruit en je houdt een cracker over. Til de schijf op de rug van je handen en draai 'm rond om uit te rekken tot ~30 cm.\n\nBeleg snel en spaarzaam: een natte, zwaar belegde pizza plakt aan de schep en wordt week in het midden." },
      { id: "pz4", title: "Pizza bakken", act: "bake", bake: true, dur: 15,
        note: "Steen op max (280–300 °C) + grill · 4–6 min. Pizzaoven: 450 °C, 90 sec.",
        detail: "Echte napoletana bakt in 60–90 sec op 450–480 °C. Dat haalt een huishoudoven niet, dus de thuistruc: steen of staal minstens 45 min op de hoogste stand (280–300 °C) voorverwarmen, de steen hoog in de oven plaatsen en de laatste minuten de grill aanzetten. Reken op 4–6 min.\n\nHeb je een Ooni/Roccbox: 450 °C, 90 sec, halverwege draaien. Mozzarella fior di latte eerst even uitlekken, anders wordt het midden soepig." },
    ],
  },
  {
    id: "pretzel", label: "Pretzels", ink: "#4A5240", tint: "#E0E3DA", node: "#4A5240",
    coldIdeal: 14, retard: true, bakeTemp: 220, unit: "stuk", useHyd: true, flour: 100, hyd: 58, bass: 0.05, levain: 20, levainMulti: 13, max: 12,
    waterPhase: "pr1", bassPhase: "pr1", levainPhase: "pr1",
    ing: [
      { name: "patentbloem / T65", g: 100, group: "Bloem/meel", phase: "pr1" },
      { name: "zout", g: 2, group: "Zout", phase: "pr1" },
      { name: "roomboter (zacht)", g: 5, group: "Vet", phase: "pr1" },
      { name: "water (loogbad)", g: 100, group: "Afwerking", phase: "pr6" },
      { name: "natriumhydroxide (food grade, 4%)", g: 4, group: "Afwerking", phase: "pr6" },
      { name: "grof zeezout", g: 2, group: "Afwerking", phase: "pr6" },
    ],
    startSteps: [
      { id: "pr1", title: "Deeg kneden", act: "mix", gap: 45, scale: false,
        note: "Stevig, bijna droog deeg (58%). Kneden tot glad, ~10 min.",
        detail: "Pretzeldeeg is bewust stug — veel steviger dan je gewend bent. Dat moet: een slap deeg laat zich niet tot strakke strengen rollen en de knoop vervloeit tijdens de rijs.\n\nAlles tegelijk kneden, boter inbegrepen. Het deeg voelt eerst korrelig en wordt na een minuut of tien glad en elastisch. Blijft het kruimelen: hooguit 5 g water per stuk extra." },
      { id: "pr2", title: "Bulk", act: "fold", gap: 90, scale: true,
        note: "Eén set vouwen. Slechts ~30 % rijs — niet verder.",
        detail: "Pretzels willen géén luchtige kruim maar een dichte, taaie. Houd de bulk kort en laat het deeg hooguit een derde groeien. Over-gefermenteerd pretzeldeeg geeft bleke, slappe knopen die hun vorm verliezen in het loogbad." },
      { id: "pr3", title: "In de koelkast — koude bulk", act: "fridge", gap: 0, scale: false,
        note: "Afgedekt. Koud deeg is essentieel voor het loogbad.",
        detail: "Twee redenen: smaak, en stevigheid. Een koude, licht uitgedroogde buitenkant neemt het loog gelijkmatig op en houdt de knoopvorm vast. Laat de pretzels later zelfs bewust onafgedekt in de koeling staan zodat het oppervlak droog aanvoelt." },
    ],
    bakeSteps: [
      { id: "pr4", title: "Uit koeling", act: "take", gap: 30, scale: false,
        note: "Kort, ~30 min. Het deeg mag koel blijven.",
        detail: "Anders dan bij de meeste broden wil je dit deeg niet warm hebben. Koel rolt het strakker en houdt het z'n vorm." },
      { id: "pr5", title: "Rollen + knopen", act: "shape", gap: 45, scale: true,
        note: "Streng van ~50 cm, dikke buik, dunne uiteinden. Daarna onafgedekt in de koeling.",
        detail: "Rol elk stuk uit tot een streng van ~50 cm: dik in het midden, dun naar de uiteinden toe. Leg 'm als een U, draai de uiteinden twee keer om elkaar en klap de twist terug op de buik. Druk de puntjes stevig aan.\n\nLeg de knopen daarna 30–45 min onafgedekt in de koelkast. Dat drogende velletje is wat straks het diepbruine, glanzende loogoppervlak geeft — sla het niet over." },
      { id: "pr6", preBake: true, title: "Loogbad + zout", act: "mix", gap: 10, scale: false,
        note: "4% natronloog, 20–30 sec per stuk. Handschoenen en bril op.",
        detail: "VEILIGHEID: natriumhydroxide is bijtend. Nitril handschoenen en een veiligheidsbril, altijd loog ín water strooien (nooit andersom), en gebruik een RVS of kunststof kom — géén aluminium, dat reageert heftig. Houd azijn bij de hand om spatten te neutraliseren. In de oven ontleedt het loog volledig; het eindproduct is veilig.\n\nDompel elke pretzel 20–30 sec onder, laat uitlekken en leg op bakpapier. Snijd de dikke buik in met een scherp mesje en bestrooi met grof zeezout.\n\nVeilig alternatief: bak 100 g baksoda 1 uur op 150 °C (dat zet het om in sterker natriumcarbonaat) en los dat op in 1 liter kokend water. Werkt minder diep, maar prima bruin." },
      { id: "pr7", title: "Pretzels bakken", act: "bake", bake: true, dur: 25,
        note: "220 °C · 15–18 min · geen stoom. Direct uit het bad de oven in.",
        detail: "Bak meteen na het loogbad op 220 °C boven-/onderwarmte, 15–18 min tot diep mahoniebruin. Géén stoom — dat maakt het loogoppervlak dof in plaats van glanzend.\n\nPretzels zijn op hun best binnen een paar uur; daarna wordt het zoutige oppervlak vochtig. Invriezen en kort opwarmen werkt goed." },
    ],
  },
];

const OVEN_STEP = { id: "oven", title: "Oven voorverwarmen", act: "device", shared: true,
  note: "Mét Dutch oven of steen, 45–60 min. Daarna per baksel laten zakken.",
  detail: "Verwarm één keer voor op de hoogste temperatuur die je die dag nodig hebt, mét de gietijzeren pan of baksteen erin — 45–60 min. Die massa moet écht gloeiend heet zijn; dat geeft de ovenveer.\n\nDe baksels staan daarna op volgorde van heet naar koud, zodat je de oven alleen maar hoeft te láten zakken. Afkoelen gaat trager dan opwarmen: zet 'm een paar minuten voor het volgende baksel alvast lager en zet de deur kort open om het laatste stuk te overbruggen.\n\nSteamoven: zet 100 % stoom klaar voor de eerste fase van de lean broden." };

const cloneLib = (lib) => JSON.parse(JSON.stringify(lib));

// Oudere opslag kende nog geen groepen/stap-koppeling: overnemen uit de standaard.
const GUESS_GROUP = (name) => {
  const n = String(name).toLowerCase();
  if (/(bloem|meel|tipo|manitoba|semolina|spelt|rogge|t65|volkoren)/.test(n)) return "Bloem/meel";
  if (/pekel/.test(n)) return "Pekel";
  if (/(water)/.test(n)) return "Water";
  if (/(zout)/.test(n)) return "Zout";
  if (/(olie|boter|vet)/.test(n)) return "Vet";
  if (/(suiker|honing)/.test(n)) return "Zoet";
  if (/(melk|ei|yoghurt)/.test(n)) return "Zuivel/ei";
  return "Overig";
};
const addMissing = (lib) => {
  const have = new Set((lib || []).map((t) => t.id));
  const added = DEFAULT_LIBRARY.filter((d) => !have.has(d.id)).map((d) => cloneLib([d])[0]);
  return added.length ? [...(lib || []), ...added] : (lib || []);
};
const migrateLib = (lib) => {
  // Bestaande types bijwerken: standaardrecepten terug naar de nieuwste versie,
  // zelfgemaakte types behouden en aanvullen met groep + stapkoppeling.
  const kept = (lib || []).map((t) => {
    const def = DEFAULT_LIBRARY.find((d) => d.id === t.id);
    if (def) return cloneLib([def])[0];
    const first = (t.startSteps && t.startSteps[0] && t.startSteps[0].id) || null;
    return {
      ...t,
      coldIdeal: t.coldIdeal || 16,
      bakeTemp: t.bakeTemp || 220,
      waterPhase: t.waterPhase || first, bassPhase: t.bassPhase || first, levainPhase: t.levainPhase || first,
      ing: (t.ing || []).map((x) => ({
        ...x,
        name: String(x.name).replace(/^pekel:\s*/i, ""),
        group: x.group || GUESS_GROUP(x.name),
        phase: x.phase || first,
      })),
    };
  });
  return addMissing(kept);
};
const FOLDS = 4;

export default function BakeSchedule() {
  const [library, setLibrary] = useState(() => cloneLib(DEFAULT_LIBRARY));
  const [counts, setCounts] = useState({ boule: 2, focaccia: 1 });
  const [temp, setTemp] = useState(seasonTemp());
  const [startDayIdx, setStartDayIdx] = useState(5);
  const [startStr, setStartStr] = useState("13:00");
  const [bakeDayIdx, setBakeDayIdx] = useState(6);
  const [bakeStr, setBakeStr] = useState("09:00");
  const [bundle, setBundle] = useState(true);
  const [showCtl, setShowCtl] = useState(true);
  const [coldMode, setColdMode] = useState("bulk");     // bulk | narijs
  const [startMode, setStartMode] = useState("tegelijk"); // tegelijk | optimaal
  const [done, setDone] = useState({});
  const [openInfo, setOpenInfo] = useState({});
  const [collapsedDays, setCollapsedDays] = useState({});
  const [filter, setFilter] = useState("alles");
  const [showIng, setShowIng] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showLib, setShowLib] = useState(false);
  const [editId, setEditId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [sessionNotes, setSessionNotes] = useState({});
  const [savedFlash, setSavedFlash] = useState(false);
  const [copied, setCopied] = useState(false);
  const [foldT, setFoldT] = useState({ started: false, currentFold: 1, target: null, phase: "idle" });
  const [nowTs, setNowTs] = useState(Date.now());
  const [loaded, setLoaded] = useState(false);
  const promptedRef = useRef(false);

  // scherm aan houden
  useEffect(() => {
    let lock = null;
    const req = async () => { try { if (navigator.wakeLock) lock = await navigator.wakeLock.request("screen"); } catch (e) {} };
    req();
    const onVis = () => { if (document.visibilityState === "visible") req(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); try { lock && lock.release(); } catch (e) {} };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (typeof window !== "undefined") {
          const r = store.get(STORAGE_KEY, false);
          if (r && r.value) {
            const v = JSON.parse(r.value);
            if (Array.isArray(v.library) && v.library.length) {
              if (v.libVersion === LIB_VERSION) setLibrary(addMissing(v.library));
              else setLibrary(migrateLib(v.library));
            }
            if (v.counts) setCounts(v.counts);
            if (v.done) setDone(v.done);
            if (v.temp) setTemp(v.temp);
            if (typeof v.startDayIdx === "number") setStartDayIdx(v.startDayIdx);
            if (typeof v.bakeDayIdx === "number") setBakeDayIdx(v.bakeDayIdx);
            if (v.startStr) setStartStr(v.startStr);
            if (v.bakeStr) setBakeStr(v.bakeStr);
            if (typeof v.bundle === "boolean") setBundle(v.bundle);
            if (v.coldMode) setColdMode(v.coldMode);
            if (v.startMode) setStartMode(v.startMode === "optimaal" ? "bakdag" : v.startMode);
            if (typeof v.showCtl === "boolean") setShowCtl(v.showCtl);
            if (Array.isArray(v.sessions)) setSessions(v.sessions);
            if (v.foldT) setFoldT(v.foldT);
          }
        }
      } catch (e) {} finally { setLoaded(true); }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        if (typeof window !== "undefined") {
          store.set(STORAGE_KEY, JSON.stringify({ libVersion: LIB_VERSION, library, counts, done, temp, startDayIdx, bakeDayIdx, startStr, bakeStr, bundle, coldMode, startMode, showCtl, sessions, foldT }), false);
        }
      } catch (e) {}
    })();
  }, [library, counts, done, temp, startDayIdx, bakeDayIdx, startStr, bakeStr, bundle, coldMode, startMode, showCtl, sessions, foldT, loaded]);

  useEffect(() => { if (foldT.phase !== "waiting") return; const id = setInterval(() => setNowTs(Date.now()), 250); return () => clearInterval(id); }, [foldT.phase]);
  useEffect(() => {
    if (foldT.phase === "waiting" && foldT.target && nowTs >= foldT.target) {
      setFoldT((t) => ({ ...t, phase: "due" }));
      try { if (navigator.vibrate) navigator.vibrate(250); } catch (e) {}
    }
  }, [nowTs, foldT.phase, foldT.target]);

  // ── planning ────────────────────────────────────────────────────────
  const dayGap = (((bakeDayIdx - startDayIdx) % 7) + 7) % 7;
  const nights = dayGap === 0 ? 1 : dayGap;
  const k = clamp(Math.pow(2, (REF_TEMP - temp) / 8), 0.6, 1.8);
  const g = (st) => (st.scale ? round15((st.gap || 0) * k) : (st.gap || 0));

  const active = library.filter((t) => (counts[t.id] || 0) > 0);
  const visible = (t) => filter === "alles" || filter === t.id;
  const shown = active.filter(visible);

  const chainOf = (steps) => {
    const out = []; let acc = 0;
    (steps || []).forEach((st) => { out.push({ st, off: acc }); acc += st.bake ? (st.dur || 30) : g(st); });
    return out;
  };

  // Koude fase: tijdens de bulk (standaard) of ná het vormen (retarderen).
  // Bij retarderen verhuizen de vormstappen naar dag 1 en gaat het gevormde
  // deeg de koeling in; op de bakdag blijft alleen de oven over.
  const splitOf = {};
  active.forEach((t) => {
    const ss = t.startSteps || [], bs = t.bakeSteps || [];
    if (coldMode !== "narijs" || t.retard !== true) { splitOf[t.id] = { pre: ss, post: bs, retarded: false }; return; }
    const fi = ss.findIndex((s) => s.act === "fridge");
    const warm = fi >= 0 ? ss.slice(0, fi) : ss.slice();
    const fridge = fi >= 0 ? ss[fi] : null;
    const bi = bs.findIndex((s) => s.bake);
    const ti = bs.findIndex((s) => s.act === "take");
    const mid = bs.slice(ti >= 0 ? ti + 1 : 0, bi < 0 ? bs.length : bi);
    const moved = mid.filter((s) => !s.preBake).map((s, i, arr) => (i === arr.length - 1 ? { ...s, gap: 0 } : s));
    const stay = mid.filter((s) => s.preBake);
    const post = [...stay, ...(bi >= 0 ? bs.slice(bi) : [])];
    splitOf[t.id] = { pre: [...warm, ...moved, ...(fridge ? [fridge] : [])], post, retarded: true };
  });
  const preOf = (t) => (splitOf[t.id] ? splitOf[t.id].pre : (t.startSteps || []));
  const postOf = (t) => (splitOf[t.id] ? splitOf[t.id].post : (t.bakeSteps || []));
  const chainTimes = (t, which) => chainOf(which === "startSteps" ? preOf(t) : postOf(t));

  // bundelen: hele keten schuift, max ±30 min
  const shifts = {};
  {
    const taken = new Set();
    active.forEach((t, i) => {
      const times = chainTimes(t, "bakeSteps").map((x) => x.off);
      if (!bundle || i === 0) shifts[t.id] = 0;
      else {
        let best = 0, bestScore = -1;
        [0, -15, 15, -30, 30].forEach((s) => {
          const sh = times.map((v) => v + s);
          if (sh.some((v) => v < 0)) return;
          const sc = sh.filter((v) => taken.has(v)).length;
          if (sc > bestScore) { bestScore = sc; best = s; }
        });
        shifts[t.id] = best;
      }
      times.forEach((v) => taken.add(v + shifts[t.id]));
    });
  }

  const startMin = round15(parseT(startStr));
  const bakeStart = round15(parseT(bakeStr));

  // ── Planning op een absolute tijdas ──────────────────────────────────
  // Dag 0 is de ankerdag. sAbs = start van de voorbereidingsketen,
  // pAbs = start van de bakdag-keten. Welke dag vastligt hangt af van
  // startMode: "tegelijk" (start én bakdag vast), "bakdag" (alles bakt op
  // één dag, voorbereiden verspreid) of "startdag" (alles op één dag
  // voorbereiden, bakken verspreid).
  const warmTotalOf = (t) => { const c = chainTimes(t, "startSteps"); return c.length ? c[c.length - 1].off : 0; };
  const postTotalOf = (t) => { const c = chainTimes(t, "bakeSteps"); if (!c.length) return 0; const l = c[c.length - 1]; return l.off + (l.st.bake ? (l.st.dur || 30) : 0); };
  const coldIdealOf = (t) => (t.coldIdeal || 16) * 60;
  const optimal = startMode === "bakdag" || startMode === "startdag";

  const sAbs = {}, pAbs = {};
  let anchorWeekday = startDayIdx;
  if (startMode === "startdag") {
    active.forEach((t) => {
      sAbs[t.id] = startMin;
      const raw = startMin + warmTotalOf(t) + coldIdealOf(t);
      let d = Math.floor(raw / 1440); let mod = round15(raw % 1440);
      const latest = Math.max(420, Math.min(1140, 1290 - postTotalOf(t))); // uiterlijk ~21:30 klaar
      if (mod < 420) mod = 420;    // niet vóór 07:00 uit de koeling
      if (mod > latest) mod = latest;
      pAbs[t.id] = d * 1440 + mod;
    });
  } else if (startMode === "bakdag") {
    const db = {};
    active.forEach((t) => { db[t.id] = Math.max(1, Math.ceil((coldIdealOf(t) + warmTotalOf(t) - bakeStart) / 1440)); });
    const D = active.length ? Math.max(...active.map((t) => db[t.id])) : Math.max(1, dayGap);
    anchorWeekday = (((bakeDayIdx - D) % 7) + 7) % 7;
    active.forEach((t) => {
      const warm = warmTotalOf(t);
      let mod = round15(bakeStart - coldIdealOf(t) - warm + db[t.id] * 1440);
      if (mod < 480) mod = 480;                                 // niet vóór 08:00 beginnen
      if (mod + warm > 1380) mod = Math.max(480, 1380 - warm);  // en vóór 23:00 de koeling in
      sAbs[t.id] = (D - db[t.id]) * 1440 + mod;
      pAbs[t.id] = D * 1440 + bakeStart;
    });
  } else {
    const D = Math.max(1, dayGap);
    active.forEach((t) => { sAbs[t.id] = startMin; pAbs[t.id] = D * 1440 + bakeStart; });
  }
  const wd = (d) => (((anchorWeekday + d) % 7) + 7) % 7;
  const startDayNum = (t) => Math.floor((sAbs[t.id] || 0) / 1440);
  const bakeDayNum = (t) => Math.floor((pAbs[t.id] || 0) / 1440);

  // Bakstappen. Pan-baksels (naan, Griekse pita) bezetten de oven niet en
  // lopen door. Ovenbaksels gaan per bakdag één voor één, strikt van heet
  // naar koud: één keer voorverwarmen op de hoogste stand, daarna zakken.
  const bakeJobs = active.map((t) => {
    const chain = chainTimes(t, "bakeSteps");
    const bi = chain.findIndex((x) => x.st.bake);
    if (bi < 0) return null;
    return { id: t.id, label: t.label, off: chain[bi].off + (shifts[t.id] || 0),
             dur: chain[bi].st.dur || 30, temp: t.bakeTemp || 220, oven: t.oven !== false };
  }).filter(Boolean);

  const bakeAbs = {}; let forcedWait = 0;
  {
    const byDay = {};
    bakeJobs.forEach((j) => { const d = bakeDayNum({ id: j.id }); (byDay[d] = byDay[d] || []).push(j); });
    Object.keys(byDay).forEach((dk) => {
      const group = byDay[dk];
      group.filter((j) => !j.oven).forEach((j) => { bakeAbs[j.id] = pAbs[j.id] + j.off; });
      const ov = group.filter((j) => j.oven)
        .sort((a, b) => b.temp - a.temp || (pAbs[a.id] + a.off) - (pAbs[b.id] + b.off));
      let cur = null;
      ov.forEach((j) => {
        const ready = pAbs[j.id] + j.off;
        if (cur == null) { bakeAbs[j.id] = ready; cur = ready + j.dur; return; }
        if (optimal) { const delta = Math.max(0, cur - ready); pAbs[j.id] += delta; bakeAbs[j.id] = ready + delta; }
        else { bakeAbs[j.id] = Math.max(ready, cur); forcedWait = Math.max(forcedWait, bakeAbs[j.id] - ready); }
        cur = bakeAbs[j.id] + j.dur;
      });
    });
  }

  const ovenInfo = {};
  Array.from(new Set(bakeJobs.map((j) => bakeDayNum({ id: j.id })))).forEach((d) => {
    const all = bakeJobs.filter((j) => bakeDayNum({ id: j.id }) === d);
    const ov = all.filter((j) => j.oven);
    ovenInfo[d] = {
      earliest: ov.length ? Math.min(...ov.map((j) => bakeAbs[j.id])) : null,
      peak: ov.length ? Math.max(...ov.map((j) => j.temp)) : null,
      order: ov.slice().sort((a, b) => bakeAbs[a.id] - bakeAbs[b.id])
               .map((j) => `${fmt(bakeAbs[j.id])} · ${j.label} · ${j.temp} °C`),
      finish: all.length ? Math.max(...all.map((j) => bakeAbs[j.id] + j.dur)) : null,
    };
  });
  const laneFinish = {};
  bakeJobs.forEach((j) => { laneFinish[j.id] = fmt(bakeAbs[j.id] + j.dur); });
  const lastFinish = bakeJobs.length ? Math.max(...bakeJobs.map((j) => bakeAbs[j.id] + j.dur)) : null;
  const finishTime = lastFinish != null ? fmt(lastFinish) : null;
  const finishWd = lastFinish != null ? wd(Math.floor(lastFinish / 1440)) : bakeDayIdx;
  const readies = bakeJobs.filter((j) => j.oven);

  const offOf = (t, which, stepId) => {
    const chain = chainTimes(t, which);
    const hit = chain.find((x) => x.st.id === stepId);
    if (!hit) return 0;
    if (which === "bakeSteps") {
      if (hit.st.bake) return bakeAbs[t.id] != null ? bakeAbs[t.id] - pAbs[t.id] : hit.off + (shifts[t.id] || 0);
      return hit.off + (shifts[t.id] || 0);
    }
    return hit.off;
  };
  const baseAbsOf = (t, isBake) => (isBake ? pAbs[t.id] : sAbs[t.id]) || 0;

  const coldOf = (t) => (pAbs[t.id] || 0) - ((sAbs[t.id] || 0) + warmTotalOf(t));
  const coldBulk = active.length ? Math.max(...active.map(coldOf)) : (Math.max(1, dayGap) * 1440 + bakeStart - startMin);
  const bulkH = Math.floor(coldBulk / 60), bulkM = coldBulk % 60;
  const bulkLabel = `${bulkH} u${bulkM ? " " + bulkM + " min" : ""}`;
  const levOf = (t) => (coldOf(t) >= 1800 ? (t.levainMulti || t.levain) : t.levain);

  // voortgang
  const instanceKeys = [];
  shown.forEach((t) => {
    preOf(t).forEach((st) => instanceKeys.push(`${t.id}:${st.id}`));
    postOf(t).forEach((st) => instanceKeys.push(`${t.id}:${st.id}`));
  });
  Object.keys(ovenInfo).forEach((d) => { if (ovenInfo[d].earliest != null) instanceKeys.push("oven" + d); });
  const total = instanceKeys.length;
  const doneCount = instanceKeys.filter((kk) => done[kk]).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const allDone = total > 0 && doneCount === total;
  useEffect(() => { if (allDone && !promptedRef.current) { setShowSavePanel(true); promptedRef.current = true; } if (!allDone) promptedRef.current = false; }, [allDone]);

  const toggle = (key) => {
    const will = !done[key];
    setDone((d) => ({ ...d, [key]: !d[key] }));
    if (will) setOpenInfo((o) => { if (!o[key]) return o; const n = { ...o }; delete n[key]; return n; });
  };
  const toggleInfo = (key) => setOpenInfo((o) => (o[key] ? {} : { [key]: true }));

  const foldEvery = clamp(round15((active.find((t) => (t.startSteps || []).some((s) => s.act === "fold")) ? g((active.find((t) => (t.startSteps || []).some((s) => s.act === "fold")).startSteps.find((s) => s.act === "fold"))) : 120) / FOLDS), 15, 60);
  const startFolds = () => setFoldT({ started: true, currentFold: 1, target: null, phase: "due" });
  const foldDone = () => setFoldT((t) => t.currentFold >= FOLDS ? { ...t, phase: "done", target: null } : { ...t, currentFold: t.currentFold + 1, target: Date.now() + foldEvery * 60000, phase: "waiting" });
  const resetFolds = () => setFoldT({ started: false, currentFold: 1, target: null, phase: "idle" });

  const resetAll = () => { setCounts({}); setTemp(seasonTemp()); setDone({}); resetFolds(); setShowSavePanel(false); setSessionNotes({}); promptedRef.current = false; };
  const saveSession = () => {
    setSessions((arr) => [{ id: Date.now(), savedAt: new Date().toISOString(),
      counts: { ...counts }, temp, nights,
      hyd: Object.fromEntries(active.map((t) => [t.id, t.hyd])),
      labels: Object.fromEntries(active.map((t) => [t.id, t.label])),
      notes: { ...sessionNotes } }, ...arr]);
    setShowSavePanel(false); setSessionNotes({}); setSavedFlash(true); setTimeout(() => setSavedFlash(false), 2600);
  };

  const stepLines = () => {
    const out = [];
    shown.forEach((t) => {
      (t.startSteps || []).forEach((st) => out.push(`${cap(WEEKDAYS[startDayIdx])} ${fmt(startMin + offOf(t, "startSteps", st.id))} | ${t.label} — ${st.title}`));
      (t.bakeSteps || []).forEach((st) => out.push(`${cap(WEEKDAYS[bakeDayIdx])} ${fmt(bakeStart + offOf(t, "bakeSteps", st.id))} | ${t.label} — ${st.title}`));
    });
    return out.sort();
  };
  const sendToReminders = () => { try { window.location.href = "shortcuts://run-shortcut?name=" + encodeURIComponent("Bakschema naar Herinneringen") + "&input=text&text=" + encodeURIComponent(stepLines().join("\n")); } catch (e) {} };
  const copySteps = () => {
    const payload = stepLines().join("\n");
    try {
      if (navigator.clipboard) navigator.clipboard.writeText(payload);
      else { const ta = document.createElement("textarea"); ta.value = payload; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); }
      setCopied(true); setTimeout(() => setCopied(false), 2200);
    } catch (e) {}
  };

  // ── bibliotheek-bewerkingen ─────────────────────────────────────────
  const upType = (id, patch) => setLibrary((lib) => lib.map((t) => t.id === id ? { ...t, ...patch } : t));
  const upStep = (id, which, sid, patch) => setLibrary((lib) => lib.map((t) => t.id !== id ? t : { ...t, [which]: t[which].map((s) => s.id === sid ? { ...s, ...patch } : s) }));
  const addStep = (id, which) => setLibrary((lib) => lib.map((t) => t.id !== id ? t : { ...t, [which]: [...t[which], { id: uid(), title: "Nieuwe stap", act: "rest", gap: 30, scale: false, note: "" }] }));
  const delStep = (id, which, sid) => setLibrary((lib) => lib.map((t) => t.id !== id ? t : { ...t, [which]: t[which].filter((s) => s.id !== sid) }));
  const moveStep = (id, which, idx, dir) => setLibrary((lib) => lib.map((t) => {
    if (t.id !== id) return t;
    const arr = [...t[which]]; const j = idx + dir;
    if (j < 0 || j >= arr.length) return t;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    return { ...t, [which]: arr };
  }));
  const upIng = (id, i, patch) => setLibrary((lib) => lib.map((t) => t.id !== id ? t : { ...t, ing: t.ing.map((x, j) => j === i ? { ...x, ...patch } : x) }));
  const addIng = (id) => setLibrary((lib) => lib.map((t) => t.id !== id ? t : { ...t, ing: [...t.ing, { name: "nieuw", g: 0 }] }));
  const delIng = (id, i) => setLibrary((lib) => lib.map((t) => t.id !== id ? t : { ...t, ing: t.ing.filter((x, j) => j !== i) }));
  const addType = (copyFrom) => {
    const src = library.find((t) => t.id === copyFrom) || library[0];
    const nid = uid();
    setLibrary((lib) => [...lib, { ...cloneLib([src])[0], id: nid, label: "Nieuw type", startSteps: cloneLib([src])[0].startSteps, bakeSteps: cloneLib([src])[0].bakeSteps }]);
    setEditId(nid); setShowLib(true);
  };
  const delType = (id) => { setLibrary((lib) => lib.filter((t) => t.id !== id)); setCounts((c) => { const n = { ...c }; delete n[id]; return n; }); setEditId(null); };
  const resetType = (id) => {
    const def = DEFAULT_LIBRARY.find((t) => t.id === id);
    if (!def) return;
    setLibrary((lib) => lib.map((t) => t.id === id ? cloneLib([def])[0] : t));
  };
  const resetLibrary = () => setLibrary(cloneLib(DEFAULT_LIBRARY));
  const isDefault = (id) => DEFAULT_LIBRARY.some((t) => t.id === id);

  // ── ingrediënten: per stap, gegroepeerd ─────────────────────────────
  const GROUP_ORDER = ["Bloem/meel", "Water", "Levain", "Zout", "Vet", "Zoet", "Zuivel/ei", "Pekel", "Vulling", "Afwerking", "Overig"];
  const chainAll = (t) => [...(t.startSteps || []), ...(t.bakeSteps || [])];
  const allIng = (t) => {
    const n = counts[t.id] || 0;
    const rows = t.ing.map((x) => ({ name: x.name, g: Math.round(x.g * n), group: x.group || "Overig", phase: x.phase }));
    if (t.useHyd) {
      const water = Math.round((t.flour * t.hyd / 100) * n);
      const bass = Math.round(water * (t.bass || 0));
      rows.push({ name: "water", g: water - bass, group: "Water", phase: t.waterPhase });
      if (bass > 0) rows.push({ name: "bassinage-water", g: bass, group: "Water", phase: t.bassPhase });
    }
    rows.push({ name: "levain", g: Math.round(levOf(t) * n), group: "Levain", phase: t.levainPhase });
    return rows.filter((r) => r.g > 0);
  };
  const groupRows = (rows) => {
    const map = {};
    rows.forEach((r) => { (map[r.group] = map[r.group] || []).push(r); });
    return Object.keys(map)
      .sort((a, b) => (GROUP_ORDER.indexOf(a) + 99 * (GROUP_ORDER.indexOf(a) < 0)) - (GROUP_ORDER.indexOf(b) + 99 * (GROUP_ORDER.indexOf(b) < 0)))
      .map((gname) => ({ group: gname, total: map[gname].reduce((s, r) => s + r.g, 0), items: map[gname] }));
  };
  const ingForStep = (t, stepId) => groupRows(allIng(t).filter((r) => r.phase === stepId));
  const carryFor = (t, stepId) => {
    const chain = chainAll(t);
    const idx = chain.findIndex((s) => s.id === stepId);
    if (idx <= 0) return null;
    const before = chain.slice(0, idx);
    const rows = allIng(t).filter((r) => before.some((s) => s.id === r.phase));
    if (!rows.length) return null;
    const prev = [...before].reverse().find((s) => allIng(t).some((r) => r.phase === s.id));
    return { title: prev ? prev.title : "vorige stappen", total: rows.reduce((s, r) => s + r.g, 0) };
  };

  const levainTotal = active.reduce((s, t) => s + Math.round(levOf(t) * (counts[t.id] || 0)), 0);
  const levainKeep = 60;
  const feedEach = Math.ceil((levainTotal + levainKeep) / 3 / 5) * 5;
  const peakMin = round15(clamp(330 * k, 180, 720));
  const levainStepAt = (() => {
    const t = active.find((x) => x.levainPhase && chainAll(x).some((s) => s.id === x.levainPhase));
    if (!t) return null;
    const inStart = (t.startSteps || []).some((s) => s.id === t.levainPhase);
    return (inStart ? startMin : bakeStart) + offOf(t, inStart ? "startSteps" : "bakeSteps", t.levainPhase);
  })();
  const feedAt = levainStepAt != null ? levainStepAt - peakMin : null;

  const Stepper = ({ label, value, set, min, max, ink }) => (
    <div className="stepper">
      <button onClick={() => set(Math.max(min, value - 1))} disabled={value <= min}>−</button>
      <span className="num" style={{ color: ink }}>{value}</span>
      <button onClick={() => set(Math.min(max, value + 1))} disabled={value >= max}>+</button>
    </div>
  );

  const renderCard = (t, which, st, atOverride) => {
    const key = `${t.id}:${st.id}`;
    const isDone = !!done[key];
    const isOpen = !!openInfo[key];
    const isStart = which === "startSteps";
    const at = atOverride != null ? atOverride : baseAbsOf(t, !isStart) + offOf(t, which, st.id);
    const act = st.bake ? "bake" : st.act;
    return (
      <div className={"card" + (isDone ? " done" : "") + (st.bake ? " bake" : "") + (isOpen ? " open" : "")}
        role="button" tabIndex={0} aria-pressed={isDone}
        onClick={() => toggle(key)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(key); } }}
        style={{ "--ink": t.ink, "--tint": t.tint }}>
        <span className="node" style={{ color: isDone ? "var(--muted)" : ACT_COLOR[act] }}>
          {isDone ? <span className="donedot" /> : <ActIcon a={act} />}
        </span>
        <button className={"infobtn" + (isOpen ? " open" : "")}
          onClick={(e) => { e.stopPropagation(); if (isDone) toggle(key); else toggleInfo(key); }}
          aria-label={isDone ? "Vink uit" : "Toon uitleg"} aria-expanded={isOpen}
          style={isOpen ? { background: t.ink, borderColor: t.ink, color: "#fff" } : { color: t.ink, borderColor: t.ink }}>i</button>
        <div className="body">
          <div className="cardtop">
            <span className="time">{fmt(at)}</span>
            <span className="badge" style={{ background: t.tint, color: t.ink }}>{t.label}</span>
            {st.bake && <span className="ovenlabel">in de oven</span>}
          </div>
          <div className="title">{st.title}</div>
          {isOpen && st.note && <div className="note">{st.note}</div>}
          {isOpen && (() => {
            const groups = ingForStep(t, st.id);
            const carry = carryFor(t, st.id);
            if (!groups.length && !carry) return null;
            return (
              <div className="ingtree">
                {carry && groups.length > 0 && (
                  <div className="ggroup carry"><span className="gname">uit “{carry.title}”</span><span className="gtot">{carry.total} g</span></div>
                )}
                {groups.map((gr) => (
                  <div key={gr.group} className="ggroup">
                    <div className="ghead"><span className="gname">{gr.group}</span><span className="gtot">{gr.total} g</span></div>
                    <ul className="glist">{gr.items.map((it, i) => <li key={i}><span>{it.name}</span><span>{it.g} g</span></li>)}</ul>
                  </div>
                ))}
              </div>
            );
          })()}
          {st.act === "fold" && (isOpen || foldT.started) && (
            <div className="ftwrap" onClick={(e) => e.stopPropagation()}>
              {!foldT.started && <button className="ftbtn" onClick={startFolds}>Start folds — elke ~{foldEvery} min</button>}
              {foldT.started && (
                <>
                  <div className="ftdots">
                    {Array.from({ length: FOLDS }).map((_, i) => {
                      const dn = foldT.phase === "done" ? true : i < foldT.currentFold - 1;
                      const cur = foldT.phase !== "done" && i === foldT.currentFold - 1;
                      return <span key={i} className={"fdot" + (dn ? " done" : "") + (cur ? " cur" : "")} />;
                    })}
                  </div>
                  {foldT.phase === "waiting" && (
                    <div className="ftrun">
                      <div className="ftcount">{fmtClock(Math.max(0, foldT.target - nowTs))}</div>
                      <div className="ftlabel">tot fold {foldT.currentFold}</div>
                      <button className="ftghost" onClick={resetFolds}>stop</button>
                    </div>
                  )}
                  {foldT.phase === "due" && (
                    <div className="ftdue">
                      <div className="ftduetitle">Fold {foldT.currentFold} — nu vouwen</div>
                      <button className="ftbtn" onClick={foldDone}>Gedaan ✓</button>
                      <button className="ftghost" onClick={resetFolds}>stop</button>
                    </div>
                  )}
                  {foldT.phase === "done" && (
                    <div className="ftdonebox">
                      <div className="ftdonetitle">Alle {FOLDS} folds gedaan ✓</div>
                      <button className="ftghost" onClick={resetFolds}>reset</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {isOpen && st.detail && <div className="detail" style={{ background: t.tint, borderColor: t.node }}>{st.detail}</div>}
        </div>
      </div>
    );
  };

  const renderOven = (d) => {
    const key = "oven" + d;
    const isDone = !!done[key];
    const isOpen = !!openInfo[key];
    const info = ovenInfo[d] || {};
    const at = (info.earliest != null ? info.earliest : 0) - 60;
    return (
      <div className={"card" + (isDone ? " done" : "") + (isOpen ? " open" : "")}
        role="button" tabIndex={0} onClick={() => toggle(key)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(key); } }}
        style={{ "--ink": "#8C7B63", "--tint": "#EDE7DB" }}>
        <span className="node" style={{ color: isDone ? "var(--muted)" : ACT_COLOR.device }}>
          {isDone ? <span className="donedot" /> : <ActIcon a="device" />}
        </span>
        <button className="infobtn" onClick={(e) => { e.stopPropagation(); if (isDone) toggle(key); else toggleInfo(key); }}
          style={isOpen ? { background: "#8C7B63", borderColor: "#8C7B63", color: "#fff" } : { color: "#8C7B63", borderColor: "#8C7B63" }}>i</button>
        <div className="body">
          <div className="cardtop">
            <span className="time">{fmt(at)}</span>
            <span className="badge" style={{ background: "#EDE7DB", color: "#8C7B63" }}>Alle</span>
          </div>
          <div className="title">{OVEN_STEP.title}{info.peak ? ` ${info.peak} °C` : ""}</div>
          {isOpen && <div className="note">{OVEN_STEP.note}</div>}
          {isOpen && (info.order || []).length > 1 && (
            <div className="ingtree">
              <div className="ggroup">
                <div className="ghead"><span className="gname">Ovenvolgorde — heet naar koud</span></div>
                <ul className="glist">{info.order.map((l, i) => <li key={i}><span>{l}</span></li>)}</ul>
              </div>
            </div>
          )}
          {isOpen && <div className="detail" style={{ background: "#EDE7DB", borderColor: "#8C7B63" }}>{OVEN_STEP.detail}</div>}
        </div>
      </div>
    );
  };

  const renderDay = (which, sub, dayIdx, sectionKey, laneList, dayNum) => {
    if (!shown.length) return null;
    const lanes = laneList || shown.filter((t) => (which === "startSteps" ? preOf(t) : postOf(t)).length > 0);
    if (!lanes.length) return null;
    const nLanes = lanes.length;
    const isBake = which === "bakeSteps";
    const info = (isBake && dayNum != null) ? (ovenInfo[dayNum] || {}) : {};
    const baseOf = (t) => baseAbsOf(t, isBake);

    const events = [];
    lanes.forEach((t, ci) => {
      const chain = isBake ? postOf(t) : preOf(t);
      const base = baseOf(t);
      chain.forEach((st, i) => {
        const at = base + offOf(t, which, st.id);
        events.push({ time: at, col: ci + 1, kind: "step", t, st, at });
        const nx = chain[i + 1];
        if (nx) { const gap = (base + offOf(t, which, nx.id)) - at; if (gap >= 15) events.push({ time: at + 0.5, col: ci + 1, kind: "wait", gap }); }
      });
    });
    if (isBake && info.earliest != null) events.push({ time: info.earliest - 60, full: true, kind: "oven" });
    events.sort((a, b) => a.time - b.time);

    const placed = []; let row = 1, i2 = 0;
    while (i2 < events.length) {
      const t0 = events[i2].time; const grp = [];
      while (i2 < events.length && events[i2].time === t0) { grp.push(events[i2]); i2++; }
      grp.filter((e) => e.full).forEach((e) => { row += 1; placed.push({ ...e, row }); });
      const rest = grp.filter((e) => !e.full);
      if (rest.length) { row += 1; rest.forEach((e) => placed.push({ ...e, row })); }
    }
    const finishRow = row + 1, eatRow = row + 2;

    const dayKeys = [];
    lanes.forEach((t) => (isBake ? postOf(t) : preOf(t)).forEach((st) => dayKeys.push(`${t.id}:${st.id}`)));
    if (isBake && info.earliest != null) dayKeys.push("oven" + dayNum);
    const dayAllDone = dayKeys.length > 0 && dayKeys.every((kk) => done[kk]);
    const sk = sectionKey || which;
    const collapsed = dayAllDone && !!collapsedDays[sk];

    return (
      <section className="day" key={sk}>
        <div className={"dayhead" + (dayAllDone ? " isdone" : "")}
          onClick={dayAllDone ? () => setCollapsedDays((c) => ({ ...c, [sk]: !c[sk] })) : undefined}
          role={dayAllDone ? "button" : undefined} tabIndex={dayAllDone ? 0 : undefined}>
          <span className="dayname">{cap(WEEKDAYS[dayIdx])}</span>
          <span className="daysub">{sub}</span>
          {dayAllDone && <span className="daydone">{collapsed ? "voltooid ✓ · toon" : "voltooid ✓ · verberg"}</span>}
        </div>
        {!collapsed && (
          <>
            <div className="laneheads" style={{ gridTemplateColumns: `repeat(${nLanes}, 1fr)` }}>
              {lanes.map((t) => <div key={t.id} className="lanehead" style={{ color: t.ink, borderColor: t.node }}>{t.label}</div>)}
            </div>
            <div className="daylanes" style={{ gridTemplateColumns: `repeat(${nLanes}, 1fr)` }}>
              {lanes.map((t, i) => <span key={"sp" + t.id} className="colspine" style={{ gridColumn: i + 1, gridRow: `1 / ${finishRow + 1}`, color: t.node }} />)}
              {placed.map((e, idx) => {
                if (e.kind === "oven") return <div key={idx} className="sharedwrap" style={{ gridColumn: "1 / -1", gridRow: e.row }}>{renderOven(dayNum)}</div>;
                if (e.kind === "wait") return <div key={idx} className="lanewaitrow" style={{ gridColumn: e.col, gridRow: e.row }}><span className="lanewaitpill"><ClockIcon />{fmtDur(e.gap)}</span></div>;
                const open = !!openInfo[`${e.t.id}:${e.st.id}`];
                return <div key={idx} style={{ gridColumn: open ? "1 / -1" : e.col, gridRow: e.row, zIndex: open ? 6 : 1, minWidth: 0 }}>{renderCard(e.t, which, e.st, e.at)}</div>;
              })}
              {isBake && lanes.map((t, i) => laneFinish[t.id] ? (
                <div key={"lf" + t.id} className="lanefinish" style={{ gridColumn: i + 1, gridRow: finishRow, color: t.ink }}>✓ klaar {laneFinish[t.id]}</div>
              ) : null)}
              {!isBake && lanes.map((t, i) => (
                <div key={"cold" + t.id} className="lanewaitrow koud" style={{ gridColumn: i + 1, gridRow: finishRow }}>
                  <span className="lanewaitpill big"><ClockIcon />{fmtDur(coldOf(t))} koud</span>
                </div>
              ))}
              {isBake && info.finish != null && (
                <div className="eatrow" style={{ gridColumn: "1 / -1", gridRow: eatRow }}>Eet smakelijk!<span className="eatsub">klaar om {fmt(info.finish)}</span></div>
              )}
            </div>
          </>
        )}
      </section>
    );
  };

  const editing = library.find((t) => t.id === editId);
  const unselected = library.filter((t) => !(counts[t.id] > 0));

  const anyOpen = Object.keys(openInfo).some((kk) => openInfo[kk]);

  return (
    <div className="wrap">
      <style>{CSS}</style>
      {(anyOpen || showIng || showLog || showLegend || showLib) && (
        <div className="scrim" onClick={() => { setOpenInfo({}); setShowIng(false); setShowLog(false); setShowLegend(false); setShowLib(false); }} />
      )}

      <header className="head">
        <h1>Bakschema</h1>
        <p className="lede">
          Start <b>{cap(WEEKDAYS[startDayIdx])} {fmt(startMin)}</b> · koude bulk ~{bulkLabel}
          {finishTime && <> · klaar <b>{cap(WEEKDAYS[finishWd])} ~{finishTime}</b></>}
        </p>
      </header>

      {/* ── Bibliotheek ─────────────────────────────────────────── */}
      <div className="libbar">
        <button className={"tabbtn wide" + (showLib ? " on" : "")} onClick={() => setShowLib((v) => !v)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h5v16H4zM11 4h4v16h-4zM17 5l3 15" /></svg>
          Bibliotheek <span className="tabcount">{library.length}</span>
        </button>
      </div>

      {showLib && (
        <div className="libpanel elevated">
          {!editing && (
            <>
              <div className="libhead">
                <span>Deegsoorten</span>
                <button className="minibtn" onClick={resetLibrary}>↺ Alles terug naar standaard</button>
              </div>
              {library.map((t) => (
                <div key={t.id} className="librow">
                  <span className="libdot" style={{ background: t.node }} />
                  <span className="libname">{t.label}</span>
                  <span className="libmeta">{t.ing.length} ingr. · {(t.startSteps || []).length + (t.bakeSteps || []).length} stappen{t.useHyd ? ` · ${t.hyd}%` : ""}</span>
                  <button className="minibtn" onClick={() => setEditId(t.id)}>Bewerk</button>
                </div>
              ))}
              <div className="libadd">
                <span className="ctllabel">Nieuw type — stappen overnemen van</span>
                <div className="libaddrow">
                  <select className="select" defaultValue={library[0] && library[0].id} id="copysrc">
                    {library.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <button className="minibtn solid" onClick={() => { const el = document.getElementById("copysrc"); addType(el ? el.value : library[0].id); }}>+ Toevoegen</button>
                </div>
              </div>
            </>
          )}

          {editing && (
            <div className="editor">
              <div className="libhead">
                <button className="minibtn" onClick={() => setEditId(null)}>← Terug</button>
                <div className="editacts">
                  {isDefault(editing.id) && <button className="minibtn" onClick={() => resetType(editing.id)}>↺ Standaard</button>}
                  {!isDefault(editing.id) && <button className="minibtn danger" onClick={() => delType(editing.id)}>Verwijder</button>}
                </div>
              </div>

              <label className="fld"><span>Naam</span>
                <input className="inp" value={editing.label} onChange={(e) => upType(editing.id, { label: e.target.value })} />
              </label>
              <div className="fldrow">
                <label className="fld"><span>Meel per stuk (g)</span>
                  <input className="inp" type="number" value={editing.flour} onChange={(e) => upType(editing.id, { flour: Number(e.target.value) })} />
                </label>
                <label className="fld"><span>Hydratatie (%)</span>
                  <input className="inp" type="number" value={editing.hyd} disabled={!editing.useHyd} onChange={(e) => upType(editing.id, { hyd: Number(e.target.value) })} />
                </label>
                <label className="fld"><span>Levain (g)</span>
                  <input className="inp" type="number" value={editing.levain} onChange={(e) => upType(editing.id, { levain: Number(e.target.value) })} />
                </label>
              </div>

              <div className="subhead">Ingrediënten per stuk — groep &amp; bij welke stap</div>
              {editing.ing.map((x, i) => (
                <div key={i} className="ingedit">
                  <div className="ingeditrow">
                    <input className="inp" value={x.name} onChange={(e) => upIng(editing.id, i, { name: e.target.value })} />
                    <input className="inp narrow" type="number" value={x.g} onChange={(e) => upIng(editing.id, i, { g: Number(e.target.value) })} />
                    <button className="minibtn danger" onClick={() => delIng(editing.id, i)}>×</button>
                  </div>
                  <div className="ingeditrow">
                    <select className="select small" value={x.group || "Overig"} onChange={(e) => upIng(editing.id, i, { group: e.target.value })}>
                      {GROUP_ORDER.map((gn) => <option key={gn} value={gn}>{gn}</option>)}
                    </select>
                    <select className="select small" value={x.phase || ""} onChange={(e) => upIng(editing.id, i, { phase: e.target.value })}>
                      <option value="">— bij welke stap —</option>
                      {chainAll(editing).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              <button className="minibtn" onClick={() => addIng(editing.id)}>+ Ingrediënt</button>
              {editing.useHyd && (
                <div className="fldrow" style={{ marginTop: "10px" }}>
                  <label className="fld"><span>Water bij stap</span>
                    <select className="select small" value={editing.waterPhase || ""} onChange={(e) => upType(editing.id, { waterPhase: e.target.value })}>
                      {chainAll(editing).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </label>
                  <label className="fld"><span>Bassinage bij stap</span>
                    <select className="select small" value={editing.bassPhase || ""} onChange={(e) => upType(editing.id, { bassPhase: e.target.value })}>
                      {chainAll(editing).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </label>
                  <label className="fld"><span>Levain bij stap</span>
                    <select className="select small" value={editing.levainPhase || ""} onChange={(e) => upType(editing.id, { levainPhase: e.target.value })}>
                      {chainAll(editing).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </label>
                </div>
              )}

              {["startSteps", "bakeSteps"].map((which) => (
                <div key={which}>
                  <div className="subhead">{which === "startSteps" ? "Stappen — startdag" : "Stappen — bakdag"}</div>
                  {(editing[which] || []).map((st, i) => (
                    <div key={st.id} className="steprow">
                      <div className="steprowtop">
                        <input className="inp" value={st.title} onChange={(e) => upStep(editing.id, which, st.id, { title: e.target.value })} />
                        <button className="minibtn" onClick={() => moveStep(editing.id, which, i, -1)}>↑</button>
                        <button className="minibtn" onClick={() => moveStep(editing.id, which, i, 1)}>↓</button>
                        <button className="minibtn danger" onClick={() => delStep(editing.id, which, st.id)}>×</button>
                      </div>
                      <div className="steprowbot">
                        <select className="select small" value={st.bake ? "bake" : st.act} onChange={(e) => upStep(editing.id, which, st.id, e.target.value === "bake" ? { act: "bake", bake: true, dur: st.dur || 30 } : { act: e.target.value, bake: false })}>
                          {Object.keys(ACT_META).map((a) => <option key={a} value={a}>{ACT_META[a]}</option>)}
                        </select>
                        {st.bake ? (
                          <label className="mini"><span>baktijd</span><input className="inp narrow" type="number" value={st.dur || 30} onChange={(e) => upStep(editing.id, which, st.id, { dur: Number(e.target.value) })} /></label>
                        ) : (
                          <>
                            <label className="mini"><span>daarna (min)</span><input className="inp narrow" type="number" value={st.gap || 0} onChange={(e) => upStep(editing.id, which, st.id, { gap: Number(e.target.value) })} /></label>
                            <label className="mini chk"><input type="checkbox" checked={!!st.scale} onChange={(e) => upStep(editing.id, which, st.id, { scale: e.target.checked })} /><span>temp.</span></label>
                          </>
                        )}
                      </div>
                      <textarea className="inp area" rows={2} placeholder="korte notitie…" value={st.note || ""} onChange={(e) => upStep(editing.id, which, st.id, { note: e.target.value })} />
                    </div>
                  ))}
                  <button className="minibtn" onClick={() => addStep(editing.id, which)}>+ Stap</button>
                </div>
              ))}
              <p className="hint">“daarna (min)” = de tijd tot de vólgende stap. Vink <b>temp.</b> aan als die tijd met de temperatuur mee moet rekenen (rijs- en bulktijden).</p>
            </div>
          )}
        </div>
      )}

      {/* ── Instellingen ───────────────────────────────────────── */}
      <div className={"controls" + (showCtl ? "" : " folded")}>
        <div className="ctlbar" role="button" tabIndex={0}
          onClick={() => setShowCtl((v) => !v)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowCtl((v) => !v); } }}>
          <span className="ctlchev">{showCtl ? "▾" : "▸"}</span>
          <span className="ctlbarlabel">Instellingen</span>
          {showCtl && <button className="resetbtn" onClick={(e) => { e.stopPropagation(); resetAll(); }}>↺ Reset velden</button>}
        </div>

        {!showCtl && (
          <div className="ctlsummary" onClick={() => setShowCtl(true)}>
            {active.length === 0 ? <span className="sumline">Nog niets gekozen — tik om te openen</span> : (
              <>
                <span className="sumchips">
                  {active.map((t) => (
                    <span key={t.id} className="sumchip" style={{ background: t.tint, color: t.ink }}>{counts[t.id]}× {t.label}</span>
                  ))}
                </span>
                <span className="sumline">
                  {temp} °C · {bulkLabel} koud · {startMode === "tegelijk" ? "alles tegelijk" : startMode === "bakdag" ? "één bakdag" : "één startdag"}
                  {coldMode === "narijs" ? " · koud na vormen" : ""}
                </span>
              </>
            )}
          </div>
        )}

        {active.length === 0 && <p className="hint">Nog niets gekozen — voeg hieronder een deegsoort toe.</p>}
        {active.map((t) => (
          <div key={t.id} className="selrow">
            <span className="libdot" style={{ background: t.node }} />
            <span className="selname">{t.label}</span>
            {t.useHyd && (
              <span className="selhyd">
                <button className="minibtn" onClick={() => upType(t.id, { hyd: Math.max(50, t.hyd - 1) })}>−</button>
                {t.hyd}%
                <button className="minibtn" onClick={() => upType(t.id, { hyd: Math.min(95, t.hyd + 1) })}>+</button>
              </span>
            )}
            <Stepper label={t.label} value={counts[t.id] || 0} set={(v) => setCounts((c) => ({ ...c, [t.id]: v }))} min={0} max={t.max || 12} ink={t.ink} />
          </div>
        ))}
        {unselected.length > 0 && (
          <div className="ctl ctlwide">
            <span className="ctllabel">Type toevoegen</span>
            <select className="select" value="" onChange={(e) => { if (e.target.value) setCounts((c) => ({ ...c, [e.target.value]: 1 })); }}>
              <option value="">Kies uit bibliotheek…</option>
              {unselected.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        )}

        <div className="ctl daycol">
          <span className="ctllabel">Startdag</span>
          <div className="daytime">
            <select className="select" value={startDayIdx} onChange={(e) => setStartDayIdx(Number(e.target.value))}>
              {WEEKDAYS.map((d, i) => <option key={i} value={i}>{cap(d)}</option>)}
            </select>
            <input className="timeinput" type="time" value={startStr} step="900" onChange={(e) => e.target.value && setStartStr(e.target.value)} />
          </div>
        </div>
        <div className="ctl daycol">
          <span className="ctllabel">Bakdag</span>
          <div className="daytime">
            <select className="select" value={bakeDayIdx} onChange={(e) => setBakeDayIdx(Number(e.target.value))}>
              {WEEKDAYS.map((d, i) => <option key={i} value={i}>{cap(d)}</option>)}
            </select>
            <input className="timeinput" type="time" value={bakeStr} step="900" onChange={(e) => e.target.value && setBakeStr(e.target.value)} />
          </div>
        </div>

        <div className="ctl ctlwide">
          <span className="ctllabel">Warme rijs — omgevingstemp · <b>{temp} °C</b></span>
          <input className="temprange" type="range" min="15" max="30" step="1" value={temp} onChange={(e) => setTemp(Number(e.target.value))} />
          <div className="presets">
            {[["Winter", 18], ["Kamer", 22], ["Zomer", 26]].map(([lab, val]) => (
              <button key={lab} className={"preset" + (temp === val ? " on" : "")} onClick={() => setTemp(val)}>{lab} {val}°</button>
            ))}
          </div>
        </div>

        <div className="ctl ctlwide">
          <span className="ctllabel">Koude fase</span>
          <div className="seg">
            <button className={"segbtn" + (coldMode === "bulk" ? " on" : "")} onClick={() => setColdMode("bulk")}>
              Tijdens de bulk<small>vormen op de bakdag</small>
            </button>
            <button className={"segbtn" + (coldMode === "narijs" ? " on" : "")} onClick={() => setColdMode("narijs")}>
              Na het vormen<small>bakdag = alleen oven</small>
            </button>
          </div>
          {coldMode === "narijs" && active.some((t) => t.retard !== true) && (
            <span className="ctlhint">Niet mogelijk voor {active.filter((t) => t.retard !== true).map((t) => t.label).join(", ")} — verrijkt en plat deeg wil een warme narijs. Die houden hun eigen schema.</span>
          )}
        </div>
        <div className="ctl ctlwide">
          <span className="ctllabel">Planning</span>
          <div className="seg seg3">
            <button className={"segbtn" + (startMode === "tegelijk" ? " on" : "")} onClick={() => setStartMode("tegelijk")}>
              Alles tegelijk<small>1 startdag · 1 bakdag</small>
            </button>
            <button className={"segbtn" + (startMode === "bakdag" ? " on" : "")} onClick={() => setStartMode("bakdag")}>
              Eén bakdag<small>rijstijd optimaal</small>
            </button>
            <button className={"segbtn" + (startMode === "startdag" ? " on" : "")} onClick={() => setStartMode("startdag")}>
              Eén startdag<small>rijstijd optimaal</small>
            </button>
          </div>
          {optimal && active.length > 0 && (
            <span className="ctlhint">
              {active.map((t) => `${t.label}: ${cap(WEEKDAYS[wd(startDayNum(t))])} ${fmt(sAbs[t.id])} → bakken ${cap(WEEKDAYS[wd(bakeDayNum(t))])} · ${fmtDur(coldOf(t))} koud`).join(" · ")}
            </span>
          )}
        </div>
        <div className="ctl ctlwide">
          <span className="ctllabel">Taken bundelen</span>
          <button className={"notifbtn" + (bundle ? " on" : "")} onClick={() => setBundle((v) => !v)}>
            {bundle ? "Aan — stappen samengevoegd tot momenten" : "Uit — elk deeg volgt z'n eigen tijden"}
          </button>
        </div>
        <div className="ctl ctlwide">
          <span className="ctllabel">Herinneringen</span>
          <button className="notifbtn" onClick={sendToReminders}>Zet stappen in Herinneringen</button>
          <button className="notifbtn sub" onClick={copySteps}>{copied ? "Gekopieerd ✓" : "Kopieer stappenlijst"}</button>
        </div>
      </div>

      {nights >= 2 && (
        <div className="info">{nights} nachten koud (~{bulkLabel}) = flink zuurder. Levain automatisch verlaagd — zet de koelkast op 3–4 °C.</div>
      )}
      {dayGap === 0 && <div className="warn">Bakdag is gelijk aan de startdag — kies een latere bakdag voor een koude bulk overnacht.</div>}
      {forcedWait >= 45 && (
        <div className="warn">
          De oven gaat van heet naar koud, waardoor een baksel {fmtDur(forcedWait)} moet wachten tot de oven vrij is — risico op overrijzen.
          Zet <b>Planning</b> op “één bakdag”, dan schuift dat deeg mee en staat het niet te wachten.
        </div>
      )}

      <div className="progress">
        <div className="bar"><span style={{ width: `${pct}%` }} /></div>
        <div className="pmeta">
          <span>{doneCount}/{total} stappen</span>
          <button className="reset" onClick={() => setDone({})} disabled={doneCount === 0}>Vinkjes wissen</button>
        </div>
      </div>

      {savedFlash && <div className="savedflash">Sessie opgeslagen in het logboek ✓</div>}

      {showSavePanel && (
        <div className="savepanel">
          <div className="savetitle">Baksessie voltooid — opslaan?</div>
          {active.map((t) => (
            <div key={t.id} className="savefield">
              <label style={{ color: t.ink }}>{t.label} — {counts[t.id]}×</label>
              <textarea rows={2} placeholder="Resultaat / opmerkingen…" value={sessionNotes[t.id] || ""} onChange={(e) => setSessionNotes((n) => ({ ...n, [t.id]: e.target.value }))} />
            </div>
          ))}
          <div className="saverow">
            <button className="primary2" onClick={saveSession} disabled={!active.length}>Sessie opslaan</button>
            <button className="ghost2" onClick={() => setShowSavePanel(false)}>Later</button>
          </div>
        </div>
      )}

      {active.length > 1 && (
        <div className="filters">
          <button className={"chip" + (filter === "alles" ? " on" : "")} onClick={() => setFilter("alles")}>Alles</button>
          {active.map((t) => (
            <button key={t.id} className={"chip" + (filter === t.id ? " on" : "")} onClick={() => setFilter(t.id)}
              style={filter === t.id ? { background: t.ink, borderColor: t.ink, color: "#fff" } : { color: t.ink, borderColor: t.node }}>{t.label}</button>
          ))}
        </div>
      )}

      <div className="tabrow">
        <button className={"tabbtn" + (showIng ? " on" : "")} onClick={() => setShowIng((v) => !v)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11h18" /><path d="M4 11a8 8 0 0 0 16 0" /><path d="M12 11c0-4 2-6 4-7" /></svg>
          Ingrediënten
        </button>
        <button className={"tabbtn" + (showLog ? " on" : "")} onClick={() => setShowLog((v) => !v)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z" /><path d="M8 7h8M8 11h8" /></svg>
          Logboek <span className="tabcount">{sessions.length}</span>
        </button>
        <button className={"tabbtn" + (showLegend ? " on" : "")} onClick={() => setShowLegend((v) => !v)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>
          Legenda
        </button>
      </div>

      {showIng && (
        <div className="ingpanel elevated">
          {active.length === 0 && <p className="hint">Nog geen deeg gekozen.</p>}
          {levainTotal > 0 && (
            <div className="levbox">
              <div className="levtop"><span className="levlabel">Levain totaal</span><span className="levbig">{levainTotal} g</span></div>
              <p className="levtext">
                Voed <b>{feedEach} g</b> starter met <b>{feedEach} g</b> water en <b>{feedEach} g</b> bloem (1:1:1) → ~{feedEach * 3} g.
                Dat is {levainTotal} g voor het deeg plus ~{levainKeep} g om terug te zetten in de koelkast.
              </p>
              {feedAt != null && (
                <p className="levtext">
                  Voeden rond <b>{fmt(feedAt)}</b> — bij {temp} °C piekt 1:1:1 in ~{fmtDur(peakMin)}, en om <b>{fmt(levainStepAt)}</b> gaat de levain in het deeg.
                  {feedAt < 0 && <> Dat valt de avond ervóór.</>}
                </p>
              )}
            </div>
          )}
          {active.map((t) => (
            <div key={t.id} className="typeblock" style={{ background: t.tint, borderColor: t.node }}>
              <div className="typetop">
                <span className="typename" style={{ color: t.ink }}>{t.label}</span>
                <span className="typecount" style={{ color: t.ink }}>{counts[t.id]}×</span>
              </div>
              <div className="ingtree">
                {groupRows(allIng(t)).map((gr) => (
                  <div key={gr.group} className="ggroup">
                    <div className="ghead"><span className="gname">{gr.group}</span><span className="gtot">{gr.total} g</span></div>
                    <ul className="glist">{gr.items.map((it, i) => <li key={i}><span>{it.name}</span><span>{it.g} g</span></li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showLog && (
        <div className="logpanel elevated">
          {sessions.length === 0 && <p className="logempty">Nog geen sessies opgeslagen.</p>}
          {sessions.map((s) => (
            <div key={s.id} className="logitem">
              <div className="logtop">
                <span className="logdate">{fmtDate(s.savedAt)}</span>
                <button className="logdel" onClick={() => setSessions((arr) => arr.filter((x) => x.id !== s.id))}>×</button>
              </div>
              <div className="logsummary">{Object.entries(s.counts || {}).filter(([, n]) => n > 0).map(([kk, n]) => `${n}× ${(s.labels && s.labels[kk]) || kk}`).join(" · ") || "—"}</div>
              <div className="logmeta">{s.temp} °C · {s.nights} nacht{s.nights > 1 ? "en" : ""}</div>
              {Object.entries(s.notes || {}).filter(([, v]) => v).map(([kk, v]) => (
                <div key={kk} className="lognote"><b>{(s.labels && s.labels[kk]) || kk}:</b> {v}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      {showLegend && (
        <div className="legendpanel elevated">
          <div className="legcol">
            <div className="leghead">Handelingen</div>
            {ACT_LEGEND.map((a) => <div key={a} className="legrow"><span className="legicon" style={{ color: ACT_COLOR[a] }}><ActIcon a={a} /></span>{ACT_META[a]}</div>)}
          </div>
          <div className="legcol">
            <div className="leghead">Deegsoorten</div>
            {library.map((t) => <div key={t.id} className="legrow"><span className="legdot" style={{ background: t.node }} />{t.label}</div>)}
          </div>
        </div>
      )}

      {(() => {
        const groups = {};
        shown.filter((t) => preOf(t).length).forEach((t) => {
          const d = startDayNum(t);
          (groups[d] = groups[d] || []).push(t);
        });
        const days = Object.keys(groups).map(Number).sort((a, b) => a - b);
        const sub = coldMode === "narijs" ? "MENGEN → VORMEN → KOELKAST" : "MENGEN → KOELKAST";
        return days.map((d) => renderDay("startSteps", sub, wd(d), "pre" + d, groups[d], d));
      })()}
      {(() => {
        const groups = {};
        shown.filter((t) => postOf(t).length).forEach((t) => {
          const d = bakeDayNum(t);
          (groups[d] = groups[d] || []).push(t);
        });
        const days = Object.keys(groups).map(Number).sort((a, b) => a - b);
        const sub = coldMode === "narijs" ? "UIT DE KOELING → OVEN" : "VORMEN → BAKKEN";
        return days.map((d) => renderDay("bakeSteps", sub, wd(d), "post" + d, groups[d], d));
      })()}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
* { box-sizing:border-box; }
.wrap { --paper:#F5EFE2; --card:#FCFAF4; --ink:#2A211A; --muted:#6E6155; --line:#E4DBC9;
  background:var(--paper); color:var(--ink); font-family:'Inter',system-ui,sans-serif; min-height:100%;
  padding:20px 14px 60px; max-width:900px; margin:0 auto; -webkit-font-smoothing:antialiased; }
h1 { font-family:'Fraunces',serif; font-weight:600; font-size:30px; margin:0 0 4px; letter-spacing:-.01em; }
.lede { font-size:13.5px; color:var(--muted); margin:0 0 14px; line-height:1.5; }
.hint { font-size:12px; color:var(--muted); line-height:1.5; margin:6px 2px; }

.libbar { margin-bottom:10px; }
.libpanel { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:14px; margin-bottom:14px; }
.libhead { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px; font-family:'Space Mono',monospace; font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
.librow { display:flex; align-items:center; gap:9px; padding:8px 0; border-bottom:1px solid var(--line); }
.librow:last-of-type { border-bottom:none; }
.libdot { width:12px; height:12px; border-radius:50%; flex:none; }
.libname { font-weight:600; font-size:14px; }
.libmeta { font-family:'Space Mono',monospace; font-size:10.5px; color:var(--muted); margin-left:auto; }
.libadd { margin-top:12px; padding-top:12px; border-top:1px dashed var(--line); }
.libaddrow { display:flex; gap:8px; margin-top:6px; }
.minibtn { font:inherit; font-size:12px; font-weight:600; color:var(--ink); background:var(--paper); border:1px solid var(--line); border-radius:8px; padding:5px 10px; cursor:pointer; }
.minibtn.solid { background:#B15511; border-color:#B15511; color:#fff; }
.minibtn.danger { color:#9E3B2E; }
.editacts { display:flex; gap:6px; }
.fld { display:flex; flex-direction:column; gap:4px; margin-bottom:9px; flex:1; }
.fld > span { font-family:'Space Mono',monospace; font-size:10px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); }
.fldrow { display:flex; gap:8px; }
.inp { font:inherit; font-size:14px; color:var(--ink); background:var(--paper); border:1px solid var(--line); border-radius:8px; padding:7px 9px; width:100%; }
.inp.narrow { width:78px; }
.inp.area { margin-top:6px; font-size:12.5px; resize:vertical; }
.subhead { font-family:'Space Mono',monospace; font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin:14px 0 7px; }
.ingrow { display:flex; gap:6px; margin-bottom:6px; }
.steprow { border:1px solid var(--line); border-radius:10px; padding:9px; margin-bottom:8px; background:var(--paper); }
.steprowtop { display:flex; gap:6px; align-items:center; }
.steprowbot { display:flex; gap:8px; align-items:center; margin-top:7px; flex-wrap:wrap; }
.mini { display:flex; align-items:center; gap:5px; font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase; color:var(--muted); }
.mini.chk { gap:4px; }
.select, .timeinput { font-family:'Space Mono',monospace; font-size:15px; font-weight:700; color:var(--ink); border:1px solid var(--line); background:var(--paper); border-radius:9px; padding:6px 8px; height:34px; width:100%; }
.select.small { font-size:12px; font-weight:400; font-family:'Inter',sans-serif; height:30px; width:auto; flex:1; min-width:120px; }

.controls { display:flex; flex-wrap:wrap; gap:10px 12px; background:var(--card); border:1px solid var(--line); border-radius:14px; padding:12px; }
.ctlbar { flex-basis:100%; display:flex; align-items:center; gap:8px; cursor:pointer; user-select:none; }
.ctlbar .resetbtn { margin-left:auto; }
.ctlchev { font-size:11px; color:var(--muted); width:10px; }
.controls.folded { gap:8px; }
.controls.folded > *:not(.ctlbar):not(.ctlsummary) { display:none; }
.ctlsummary { flex-basis:100%; display:flex; flex-direction:column; gap:6px; cursor:pointer; }
.sumchips { display:flex; flex-wrap:wrap; gap:6px; }
.sumchip { font-size:12px; font-weight:700; padding:3px 9px; border-radius:20px; }
.sumline { font-family:'Space Mono',monospace; font-size:11px; color:var(--muted); line-height:1.5; }
.ctlbarlabel { font-family:'Space Mono',monospace; font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); }
.resetbtn { font:inherit; font-size:12.5px; font-weight:600; color:var(--muted); background:var(--paper); border:1px solid var(--line); border-radius:20px; padding:5px 12px; cursor:pointer; }
.selrow { flex-basis:100%; display:flex; align-items:center; gap:9px; padding:6px 0; border-bottom:1px solid var(--line); }
.selname { font-weight:600; font-size:14px; }
.selhyd { margin-left:auto; display:flex; align-items:center; gap:6px; font-family:'Space Mono',monospace; font-size:12px; color:var(--muted); }
.ctl { display:flex; flex-direction:column; gap:6px; }
.ctlwide, .daycol { flex-basis:100%; }
.ctllabel { font-family:'Space Mono',monospace; font-size:10.5px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); }
.daytime { display:flex; gap:8px; }
.daytime .select { flex:1 1 60%; }
.daytime .timeinput { flex:1 1 40%; min-width:100px; }
.stepper { display:flex; align-items:center; gap:6px; margin-left:auto; }
.stepper button { width:32px; height:32px; border-radius:8px; border:1px solid var(--line); background:var(--paper); font-size:17px; color:var(--ink); cursor:pointer; }
.stepper button:disabled { opacity:.3; }
.num { font-family:'Fraunces',serif; font-weight:600; font-size:18px; min-width:26px; text-align:center; }
.temprange { width:100%; accent-color:#B15511; }
.presets { display:flex; gap:6px; }
.preset { font:inherit; font-size:11.5px; color:var(--muted); background:var(--paper); border:1px solid var(--line); border-radius:20px; padding:4px 10px; cursor:pointer; }
.preset.on { background:var(--ink); border-color:var(--ink); color:#fff; }
.notifbtn { width:100%; font:inherit; font-size:13px; font-weight:600; color:var(--ink); background:var(--paper); border:1px solid var(--line); border-radius:10px; padding:9px; cursor:pointer; }
.notifbtn.on { background:#EAEFDB; border-color:#B7C58A; color:#4C5E20; }
.notifbtn.sub { margin-top:6px; font-size:12.5px; font-weight:500; color:var(--muted); }

.info { background:#EDE7DB; border:1px solid var(--line); border-radius:11px; padding:10px 12px; font-size:12.5px; line-height:1.5; margin-top:12px; }
.warn { background:#F7E3D3; border:1px solid #E4B183; border-radius:11px; padding:10px 12px; font-size:12.5px; line-height:1.5; margin-top:12px; }
.progress { margin:14px 0 12px; }
.bar { height:6px; background:var(--line); border-radius:20px; overflow:hidden; }
.bar span { display:block; height:100%; background:#B15511; border-radius:20px; transition:width .3s ease; }
.pmeta { display:flex; justify-content:space-between; align-items:center; margin-top:6px; font-family:'Space Mono',monospace; font-size:11px; color:var(--muted); }
.reset { font:inherit; font-size:11px; color:var(--muted); background:none; border:none; cursor:pointer; text-decoration:underline; }
.savedflash { background:#EAEFDB; border:1px solid #B7C58A; color:#4C5E20; border-radius:11px; padding:9px 12px; margin-bottom:12px; font-size:13px; font-weight:600; }
.savepanel { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:14px; margin-bottom:14px; }
.savetitle { font-family:'Fraunces',serif; font-weight:600; font-size:18px; margin-bottom:10px; }
.savefield { display:flex; flex-direction:column; gap:4px; margin-bottom:10px; }
.savefield label { font-size:12px; font-weight:700; }
.savefield textarea { font:inherit; font-size:13px; background:var(--paper); border:1px solid var(--line); border-radius:9px; padding:8px; width:100%; }
.saverow { display:flex; gap:8px; }
.primary2 { flex:1; border:none; border-radius:10px; background:#B15511; color:#fff; font:inherit; font-weight:600; font-size:14px; padding:11px; cursor:pointer; }
.ghost2 { border:1px solid var(--line); border-radius:10px; background:transparent; color:var(--muted); font:inherit; font-size:13px; padding:11px 16px; cursor:pointer; }

.filters { display:flex; gap:7px; flex-wrap:wrap; margin:12px 0 8px; }
.chip { font:inherit; font-size:12.5px; font-weight:600; background:var(--card); border:1px solid var(--line); color:var(--muted); border-radius:20px; padding:5px 13px; cursor:pointer; }
.chip.on { background:var(--ink); border-color:var(--ink); color:#fff; }
.tabrow { display:flex; gap:8px; margin:8px 0; flex-wrap:wrap; }
.tabbtn { flex:1; min-width:110px; display:inline-flex; align-items:center; justify-content:center; gap:7px; font:inherit; font-size:13px; font-weight:600; color:var(--ink); background:var(--card); border:1px solid var(--line); border-radius:11px; padding:9px 10px; cursor:pointer; }
.tabbtn.wide { width:100%; }
.tabbtn.on { background:var(--ink); border-color:var(--ink); color:#fff; }
.tabcount { font-family:'Space Mono',monospace; font-size:11px; background:var(--line); color:var(--ink); border-radius:20px; padding:1px 7px; }
.tabbtn.on .tabcount { background:rgba(255,255,255,.25); color:#fff; }
.ingpanel, .logpanel, .legendpanel { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:13px; margin:4px 0 10px; }
.legendpanel { display:flex; gap:16px; flex-wrap:wrap; }
.legcol { flex:1; min-width:160px; }
.leghead { font-family:'Space Mono',monospace; font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin-bottom:8px; }
.legrow { display:flex; align-items:center; gap:9px; font-size:13px; margin-bottom:6px; }
.legicon { width:22px; height:22px; display:flex; align-items:center; justify-content:center; flex:none; }
.legdot { width:12px; height:12px; border-radius:50%; flex:none; }
.ingblock { margin-bottom:12px; }
.ingtitle { font-family:'Fraunces',serif; font-weight:600; font-size:15px; margin-bottom:4px; }
.ing { margin:4px 0 0; padding-left:16px; font-size:13px; color:var(--muted); line-height:1.6; }
.ingtree { margin-top:8px; }
.ggroup { margin-bottom:8px; }
.ggroup.carry { display:flex; justify-content:space-between; align-items:center; background:var(--paper); border:1px dashed var(--line); border-radius:8px; padding:6px 10px; font-size:12.5px; color:var(--muted); }
.ggroup.carry .gname { font-style:italic; }
.ghead { display:flex; justify-content:space-between; align-items:baseline; border-bottom:1px solid var(--line); padding-bottom:3px; }
.gname { font-family:'Space Mono',monospace; font-size:10.5px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); }
.gtot { font-family:'Space Mono',monospace; font-size:12px; font-weight:700; color:var(--ink); }
.glist { list-style:none; margin:4px 0 0; padding:0; }
.glist li { display:flex; justify-content:space-between; font-size:13px; line-height:1.7; color:var(--ink); }
.glist li span:last-child { font-family:'Space Mono',monospace; font-size:12px; color:var(--muted); }
.levbox { background:#F5E6D2; border:1px solid #E4B183; border-radius:12px; padding:12px; margin-bottom:14px; }
.levtop { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px; }
.levlabel { font-family:'Space Mono',monospace; font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:#8a5a2b; }
.levbig { font-family:'Fraunces',serif; font-weight:600; font-size:24px; color:#B15511; }
.levtext { font-size:12.5px; line-height:1.55; color:var(--ink); margin:4px 0 0; }
.ingedit { border:1px solid var(--line); border-radius:10px; padding:8px; margin-bottom:7px; background:var(--paper); }
.scrim { position:fixed; inset:0; z-index:5; background:rgba(245,239,226,.45); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); }
.elevated { position:relative; z-index:6; box-shadow:0 14px 40px -16px rgba(42,33,26,.45); }
.typeblock { border:1px solid; border-radius:12px; padding:12px; margin-bottom:12px; }
.typetop { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px; }
.typename { font-family:'Fraunces',serif; font-weight:600; font-size:17px; }
.typecount { font-family:'Space Mono',monospace; font-size:13px; font-weight:700; }
.typeblock .ghead { border-bottom-color:rgba(42,33,26,.15); }
.typeblock .gtot, .typeblock .glist li { color:var(--ink); }
.ingeditrow { display:flex; gap:6px; margin-bottom:6px; }
.ingeditrow:last-child { margin-bottom:0; }
.logempty { font-size:12.5px; color:var(--muted); font-style:italic; }
.logitem { border-left:3px solid var(--line); padding:2px 0 8px 12px; margin-bottom:10px; }
.logtop { display:flex; justify-content:space-between; align-items:center; }
.logdate { font-family:'Space Mono',monospace; font-size:11px; text-transform:uppercase; color:var(--muted); }
.logdel { border:none; background:none; color:var(--muted); font-size:18px; cursor:pointer; }
.logsummary { font-family:'Fraunces',serif; font-weight:600; font-size:15px; margin:2px 0; }
.logmeta { font-family:'Space Mono',monospace; font-size:11px; color:var(--muted); }
.lognote { font-size:13px; line-height:1.45; margin-top:3px; }

.day { margin-top:22px; }
.dayhead { display:flex; align-items:baseline; gap:10px; margin-bottom:10px; padding-left:2px; }
.dayhead.isdone { cursor:pointer; }
.dayname { font-family:'Fraunces',serif; font-weight:600; font-size:23px; }
.daysub { font-family:'Space Mono',monospace; font-size:10.5px; letter-spacing:.1em; color:var(--muted); }
.daydone { font-family:'Space Mono',monospace; font-size:11px; font-weight:700; text-transform:uppercase; color:#5F7A2C; margin-left:auto; }
.laneheads { display:grid; gap:12px; margin-bottom:6px; }
.lanehead { font-family:'Space Mono',monospace; font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; text-align:center; padding:6px 4px; border:1px solid; border-radius:9px; background:var(--card); }
.daylanes { display:grid; column-gap:12px; row-gap:10px; align-items:start; position:relative; }
.daylanes > * { min-width:0; }
.daylanes .body { overflow-wrap:anywhere; }
.colspine { border-left:2px solid; margin-left:19px; opacity:.5; border-radius:2px; z-index:0; align-self:stretch; position:relative; }
.colspine::before, .colspine::after { content:""; position:absolute; left:-5px; width:8px; height:8px; border-radius:50%; background:currentColor; }
.colspine::before { top:-3px; } .colspine::after { bottom:-3px; }
.card { position:relative; text-align:left; width:100%; display:block; padding:0 0 0 42px; background:transparent; border:none; cursor:pointer; font:inherit; color:var(--ink); transition:opacity .2s ease; z-index:1; }
.card.done { opacity:.32; }
.card.open { z-index:6; }
.card.open .body { box-shadow:0 10px 28px -12px rgba(42,33,26,.4); }
.body { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:12px 44px 13px 15px; }
.card.bake .body { border-color:#E8B98C; background:linear-gradient(180deg,#FDF3EA,var(--card)); }
.node { position:absolute; left:5px; top:11px; width:30px; height:30px; border-radius:50%; background:var(--paper); display:flex; align-items:center; justify-content:center; z-index:2; }
.donedot { width:16px; height:16px; border-radius:50%; background:var(--muted); }
.infobtn { position:absolute; top:10px; right:10px; z-index:3; width:27px; height:27px; border-radius:8px; border:1px solid; background:var(--card); font-family:'Inter',sans-serif; font-style:normal; font-weight:700; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
.cardtop { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px; }
.time { font-family:'Space Mono',monospace; font-weight:700; font-size:14px; }
.badge { font-size:10.5px; font-weight:700; padding:2px 8px; border-radius:20px; }
.ovenlabel { font-family:'Space Mono',monospace; font-size:9.5px; text-transform:uppercase; letter-spacing:.06em; background:#D64530; color:#fff; padding:2px 7px; border-radius:20px; }
.title { font-family:'Fraunces',serif; font-weight:600; font-size:16px; line-height:1.3; }
.note { font-size:13px; color:var(--muted); line-height:1.5; margin-top:5px; }
.detail { margin-top:8px; padding:10px 11px; border-left:3px solid; border-radius:8px; font-size:12.5px; line-height:1.6; white-space:pre-line; }
.lanewaitrow { position:relative; z-index:1; padding-left:42px; }
.lanewaitrow::before { content:""; position:absolute; left:15px; top:50%; transform:translateY(-50%); width:9px; height:9px; border-radius:50%; background:var(--paper); border:2px solid var(--line); }
.lanewaitrow.full { display:flex; justify-content:center; padding-left:0; }
.lanewaitrow.full::before { display:none; }
.lanewaitpill { display:inline-flex; align-items:center; font-family:'Space Mono',monospace; font-size:11px; color:var(--muted); background:var(--paper); border:1px dashed var(--line); border-radius:20px; padding:3px 10px; }
.lanewaitpill.big { font-weight:700; color:var(--ink); border-style:solid; background:var(--card); }
.lanewaitrow.koud { display:flex; justify-content:center; padding-left:0; }
.lanewaitrow.koud::before { display:none; }
.seg { display:flex; gap:6px; }
.seg3 .segbtn { font-size:12px; padding:8px 4px; }
.seg3 .segbtn small { font-size:9px; }
.segbtn { flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; font:inherit; font-size:13px; font-weight:600; color:var(--ink); background:var(--paper); border:1px solid var(--line); border-radius:10px; padding:8px 6px; cursor:pointer; line-height:1.25; }
.segbtn small { font-family:'Space Mono',monospace; font-size:9.5px; font-weight:400; letter-spacing:.03em; text-transform:uppercase; color:var(--muted); }
.segbtn.on { background:var(--ink); border-color:var(--ink); color:#fff; }
.segbtn.on small { color:rgba(255,255,255,.7); }
.lanefinish { font-family:'Space Mono',monospace; font-size:11px; font-weight:700; text-align:center; padding:5px 4px; border-radius:8px; background:var(--card); border:1px solid var(--line); }
.eatrow { display:flex; flex-direction:column; align-items:center; font-family:'Fraunces',serif; font-weight:600; font-size:20px; padding:16px 0 4px; }
.eatsub { font-family:'Space Mono',monospace; font-weight:400; font-size:11px; text-transform:uppercase; color:var(--muted); margin-top:3px; }
.ftwrap { margin-top:10px; border-top:1px dashed var(--line); padding-top:10px; }
.ftbtn { width:100%; border:none; border-radius:10px; background:#B15511; color:#fff; font:inherit; font-weight:600; font-size:13px; padding:10px; cursor:pointer; margin-bottom:6px; }
.ftghost { width:100%; border:1px solid var(--line); border-radius:9px; background:transparent; color:var(--muted); font:inherit; font-size:12px; padding:7px; cursor:pointer; }
.ftdots { display:flex; gap:7px; margin-bottom:10px; }
.fdot { width:13px; height:13px; border-radius:50%; border:2px solid #8C7B63; }
.fdot.done { background:#8C7B63; }
.fdot.cur { border-color:#B15511; box-shadow:0 0 0 3px rgba(177,85,17,.18); }
.ftrun, .ftdue, .ftdonebox { text-align:center; }
.ftcount { font-family:'Space Mono',monospace; font-weight:700; font-size:34px; }
.ftlabel { font-family:'Space Mono',monospace; font-size:11px; text-transform:uppercase; color:var(--muted); margin:4px 0 8px; }
.ftduetitle, .ftdonetitle { font-family:'Fraunces',serif; font-weight:600; font-size:18px; color:#B15511; margin-bottom:8px; }
.ftdonetitle { color:#5F7A2C; }
@media (max-width:520px){ .lanehead { font-size:9.5px; } .title { font-size:15px; } }
`;
