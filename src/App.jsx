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
    unit: "plaat", useHyd: true, flour: 500, hyd: 74, bass: 0.24, levain: 100, levainMulti: 65, max: 4,
    ing: [{ name: "tipo 00", g: 300 }, { name: "manitoba", g: 100 }, { name: "semolina", g: 100 }, { name: "olijfolie (deeg)", g: 30 }, { name: "honing", g: 7 }, { name: "zout", g: 10 }, { name: "pekel: water", g: 40 }, { name: "pekel: olijfolie", g: 30 }],
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
    unit: "boule", useHyd: true, flour: 450, hyd: 78, bass: 0.07, levain: 90, levainMulti: 60, max: 8,
    ing: [{ name: "T65", g: 300 }, { name: "manitoba", g: 75 }, { name: "spelt", g: 50 }, { name: "rogge", g: 25 }, { name: "zout", g: 10 }],
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
    unit: "boule", useHyd: true, flour: 450, hyd: 82, bass: 0.10, levain: 90, levainMulti: 60, max: 4,
    ing: [{ name: "volkoren", g: 300 }, { name: "manitoba", g: 100 }, { name: "spelt", g: 50 }, { name: "zout", g: 10 }],
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
    unit: "stuk", useHyd: true, flour: 60, hyd: 65, bass: 0.05, levain: 11, levainMulti: 8, max: 12,
    ing: [{ name: "T65", g: 50 }, { name: "manitoba", g: 10 }, { name: "olijfolie", g: 2 }, { name: "zout", g: 1 }],
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
    unit: "stuk", useHyd: false, flour: 50, hyd: 0, bass: 0, levain: 10, levainMulti: 7, max: 12,
    ing: [{ name: "bloem", g: 50 }, { name: "melk", g: 18 }, { name: "ei", g: 6 }, { name: "boter", g: 5 }, { name: "suiker", g: 3 }, { name: "zout", g: 1 }],
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
];

const OVEN_STEP = { id: "oven", title: "Oven voorverwarmen", act: "device", shared: true,
  note: "Dutch oven of steen mee opwarmen (~45–60 min).",
  detail: "Verwarm de oven mét de gietijzeren pan of baksteen 45–60 min voor. Die massa moet écht gloeiend heet zijn — dat geeft de ovenveer. Steamoven: zet 100 % stoom klaar voor de eerste fase." };

const cloneLib = (lib) => JSON.parse(JSON.stringify(lib));
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
        if (typeof window !== "undefined" && window.storage) {
          const r = await window.storage.get(STORAGE_KEY, false);
          if (r && r.value) {
            const v = JSON.parse(r.value);
            if (Array.isArray(v.library) && v.library.length) setLibrary(v.library);
            if (v.counts) setCounts(v.counts);
            if (v.done) setDone(v.done);
            if (v.temp) setTemp(v.temp);
            if (typeof v.startDayIdx === "number") setStartDayIdx(v.startDayIdx);
            if (typeof v.bakeDayIdx === "number") setBakeDayIdx(v.bakeDayIdx);
            if (v.startStr) setStartStr(v.startStr);
            if (v.bakeStr) setBakeStr(v.bakeStr);
            if (typeof v.bundle === "boolean") setBundle(v.bundle);
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
        if (typeof window !== "undefined" && window.storage) {
          await window.storage.set(STORAGE_KEY, JSON.stringify({ library, counts, done, temp, startDayIdx, bakeDayIdx, startStr, bakeStr, bundle, sessions, foldT }), false);
        }
      } catch (e) {}
    })();
  }, [library, counts, done, temp, startDayIdx, bakeDayIdx, startStr, bakeStr, bundle, sessions, foldT, loaded]);

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

  const chainTimes = (t, which) => {
    const out = []; let acc = 0;
    (t[which] || []).forEach((st) => { out.push({ st, off: acc }); acc += st.bake ? (st.dur || 30) : g(st); });
    return out;
  };

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

  // bakstappen sequentieel (één oven)
  const readies = active.map((t) => {
    const chain = chainTimes(t, "bakeSteps");
    const bakeIdx = chain.findIndex((x) => x.st.bake);
    if (bakeIdx < 0) return null;
    return { id: t.id, ready: chain[bakeIdx].off + (shifts[t.id] || 0), dur: chain[bakeIdx].st.dur || 30, stepId: chain[bakeIdx].st.id };
  }).filter(Boolean).sort((a, b) => a.ready - b.ready);
  const seq = {}; let cursor = null;
  readies.forEach((r) => { const st = cursor == null ? r.ready : Math.max(r.ready, cursor); seq[r.id] = st; cursor = st + r.dur; });
  const finishOff = cursor;
  const laneFinish = {};
  readies.forEach((r) => { laneFinish[r.id] = fmt(bakeStart + seq[r.id] + r.dur); });
  const earliestOven = readies.length ? Math.min(...readies.map((r) => seq[r.id])) : null;

  const offOf = (t, which, stepId) => {
    const chain = chainTimes(t, which);
    const hit = chain.find((x) => x.st.id === stepId);
    if (!hit) return 0;
    if (which === "bakeSteps") {
      if (hit.st.bake) return seq[t.id] != null ? seq[t.id] : hit.off + (shifts[t.id] || 0);
      return hit.off + (shifts[t.id] || 0);
    }
    return hit.off;
  };

  const lastStartOff = Math.max(0, ...active.map((t) => { const c = chainTimes(t, "startSteps"); return c.length ? c[c.length - 1].off : 0; }));
  const coldBulk = (1440 - (startMin + lastStartOff)) + (nights - 1) * 1440 + bakeStart;
  const bulkH = Math.floor(coldBulk / 60), bulkM = coldBulk % 60;
  const bulkLabel = `${bulkH} u${bulkM ? " " + bulkM + " min" : ""}`;
  const finishTime = finishOff != null ? fmt(bakeStart + finishOff) : null;
  const levOf = (t) => (nights >= 2 ? (t.levainMulti || t.levain) : t.levain);

  // voortgang
  const instanceKeys = [];
  shown.forEach((t) => {
    (t.startSteps || []).forEach((st) => instanceKeys.push(`${t.id}:${st.id}`));
    (t.bakeSteps || []).forEach((st) => instanceKeys.push(`${t.id}:${st.id}`));
  });
  if (readies.length) instanceKeys.push("oven");
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
  const toggleInfo = (key) => setOpenInfo((o) => ({ ...o, [key]: !o[key] }));

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

  // ── ingrediënten ────────────────────────────────────────────────────
  const ingLines = (t) => {
    const n = counts[t.id] || 0;
    const lines = t.ing.map((x) => `${x.name}: ${Math.round(x.g * n)} g`);
    if (t.useHyd) {
      const water = Math.round((t.flour * t.hyd / 100) * n);
      const bass = Math.round(water * (t.bass || 0));
      lines.push(`water (autolyse): ${water - bass} g`);
      if (bass > 0) lines.push(`bassinage: ${bass} g`);
    }
    lines.push(`levain: ${Math.round(levOf(t) * n)} g`);
    return lines;
  };

  const Stepper = ({ label, value, set, min, max, ink }) => (
    <div className="stepper">
      <button onClick={() => set(Math.max(min, value - 1))} disabled={value <= min}>−</button>
      <span className="num" style={{ color: ink }}>{value}</span>
      <button onClick={() => set(Math.min(max, value + 1))} disabled={value >= max}>+</button>
    </div>
  );

  const renderCard = (t, which, st) => {
    const key = `${t.id}:${st.id}`;
    const isDone = !!done[key];
    const isOpen = !!openInfo[key];
    const isStart = which === "startSteps";
    const at = (isStart ? startMin : bakeStart) + offOf(t, which, st.id);
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
          {isOpen && ingLines(t).length > 0 && st.act === "mix" && <ul className="ing">{ingLines(t).map((l, i) => <li key={i}>{l}</li>)}</ul>}
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

  const renderOven = () => {
    const key = "oven";
    const isDone = !!done[key];
    const isOpen = !!openInfo[key];
    const at = bakeStart + (earliestOven != null ? earliestOven - 60 : 0);
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
          <div className="title">{OVEN_STEP.title}</div>
          {isOpen && <div className="note">{OVEN_STEP.note}</div>}
          {isOpen && <div className="detail" style={{ background: "#EDE7DB", borderColor: "#8C7B63" }}>{OVEN_STEP.detail}</div>}
        </div>
      </div>
    );
  };

  const renderDay = (which, label, sub, dayIdx) => {
    if (!shown.length) return null;
    const lanes = shown.filter((t) => (t[which] || []).length > 0);
    if (!lanes.length) return null;
    const nLanes = lanes.length;
    const laneMode = nLanes >= 1;
    const isBake = which === "bakeSteps";

    const events = [];
    lanes.forEach((t, ci) => {
      const chain = t[which] || [];
      chain.forEach((st, i) => {
        const off = offOf(t, which, st.id);
        events.push({ time: off, col: ci + 1, kind: "step", t, st });
        const nx = chain[i + 1];
        if (nx) { const gap = offOf(t, which, nx.id) - off; if (gap >= 15) events.push({ time: off + 0.5, col: ci + 1, kind: "wait", gap }); }
      });
    });
    if (isBake && earliestOven != null) events.push({ time: earliestOven - 60, full: true, kind: "oven" });
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
    lanes.forEach((t) => (t[which] || []).forEach((st) => dayKeys.push(`${t.id}:${st.id}`)));
    if (isBake && readies.length) dayKeys.push("oven");
    const dayAllDone = dayKeys.length > 0 && dayKeys.every((kk) => done[kk]);
    const collapsed = dayAllDone && !!collapsedDays[which];

    return (
      <section className="day">
        <div className={"dayhead" + (dayAllDone ? " isdone" : "")}
          onClick={dayAllDone ? () => setCollapsedDays((c) => ({ ...c, [which]: !c[which] })) : undefined}
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
                if (e.kind === "oven") return <div key={idx} className="sharedwrap" style={{ gridColumn: "1 / -1", gridRow: e.row }}>{renderOven()}</div>;
                if (e.kind === "wait") return <div key={idx} className="lanewaitrow" style={{ gridColumn: e.col, gridRow: e.row }}><span className="lanewaitpill"><ClockIcon />{fmtDur(e.gap)}</span></div>;
                const open = !!openInfo[`${e.t.id}:${e.st.id}`];
                return <div key={idx} style={{ gridColumn: open ? "1 / -1" : e.col, gridRow: e.row, zIndex: open ? 6 : 1, minWidth: 0 }}>{renderCard(e.t, which, e.st)}</div>;
              })}
              {isBake && lanes.map((t, i) => laneFinish[t.id] ? (
                <div key={"lf" + t.id} className="lanefinish" style={{ gridColumn: i + 1, gridRow: finishRow, color: t.ink }}>✓ klaar {laneFinish[t.id]}</div>
              ) : null)}
              {!isBake && (
                <div className="lanewaitrow full" style={{ gridColumn: "1 / -1", gridRow: finishRow }}>
                  <span className="lanewaitpill big"><ClockIcon />{bulkLabel} koude bulk → bakdag</span>
                </div>
              )}
              {isBake && finishTime && (
                <div className="eatrow" style={{ gridColumn: "1 / -1", gridRow: eatRow }}>Eet smakelijk!<span className="eatsub">alles klaar om {finishTime}</span></div>
              )}
            </div>
          </>
        )}
      </section>
    );
  };

  const editing = library.find((t) => t.id === editId);
  const unselected = library.filter((t) => !(counts[t.id] > 0));

  return (
    <div className="wrap">
      <style>{CSS}</style>

      <header className="head">
        <h1>Bakschema</h1>
        <p className="lede">
          Start <b>{cap(WEEKDAYS[startDayIdx])} {fmt(startMin)}</b> · koude bulk ~{bulkLabel}
          {finishTime && <> · klaar <b>{cap(WEEKDAYS[bakeDayIdx])} ~{finishTime}</b></>}
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
        <div className="libpanel">
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

              <div className="subhead">Ingrediënten per stuk</div>
              {editing.ing.map((x, i) => (
                <div key={i} className="ingrow">
                  <input className="inp" value={x.name} onChange={(e) => upIng(editing.id, i, { name: e.target.value })} />
                  <input className="inp narrow" type="number" value={x.g} onChange={(e) => upIng(editing.id, i, { g: Number(e.target.value) })} />
                  <button className="minibtn danger" onClick={() => delIng(editing.id, i)}>×</button>
                </div>
              ))}
              <button className="minibtn" onClick={() => addIng(editing.id)}>+ Ingrediënt</button>

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
      <div className="controls">
        <div className="ctlbar">
          <span className="ctlbarlabel">Instellingen</span>
          <button className="resetbtn" onClick={resetAll}>↺ Reset velden</button>
        </div>

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
        <div className="ingpanel">
          {active.length === 0 && <p className="hint">Nog geen deeg gekozen.</p>}
          {active.map((t) => (
            <div key={t.id} className="ingblock">
              <div className="ingtitle" style={{ color: t.ink }}>{t.label} — {counts[t.id]}× </div>
              <ul className="ing">{ingLines(t).map((l, i) => <li key={i}>{l}</li>)}</ul>
            </div>
          ))}
        </div>
      )}

      {showLog && (
        <div className="logpanel">
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
        <div className="legendpanel">
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

      {renderDay("startSteps", "start", "MENGEN → KOELKAST", startDayIdx)}
      {renderDay("bakeSteps", "bake", "VORMEN → BAKKEN", bakeDayIdx)}
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
.ctlbar { flex-basis:100%; display:flex; align-items:center; justify-content:space-between; }
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
