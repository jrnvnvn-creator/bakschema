import React, { useState, useEffect } from "react";

const TYPES = {
  beide:    { label: "Beide",    ink: "#8C7B63", tint: "#EDE7DB", node: "#8C7B63" },
  boule:    { label: "Boules",   ink: "#B15511", tint: "#F5E6D2", node: "#B15511" },
  volkoren: { label: "Volkoren", ink: "#6B4A2B", tint: "#E7DBC9", node: "#6B4A2B" },
  pita:     { label: "Pita's",   ink: "#C0872E", tint: "#F2E6C8", node: "#C0872E" },
  worst:    { label: "Worstenb.", ink: "#9E3B2E", tint: "#F1D9D3", node: "#9E3B2E" },
  focaccia: { label: "Focaccia", ink: "#5F7A2C", tint: "#E7ECD4", node: "#5F7A2C" },
};

const WEEKDAYS = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Meelsamenstelling per eenheid (g); water komt uit de hydratatie
const PER_BOULE    = { t65: 300, manitoba: 75, spelt: 50, rogge: 25, zout: 10 };
const PER_VK       = { volkoren: 300, manitoba: 100, spelt: 50, zout: 10 };
const PER_FOCACCIA = { tipo: 300, manitoba: 100, semolina: 100, doughOlie: 30, honing: 7, zout: 10, pekelWater: 40, pekelOlie: 30 };
const PER_PITA     = { t65: 50, manitoba: 10, olie: 2, zout: 1 };
const PER_WORST    = { bloem: 50, melk: 18, ei: 6, boter: 5, suiker: 3, zout: 1, levain: 10 }; // per broodje; verrijkt deeg
const FLOUR = { boule: 450, volkoren: 450, focaccia: 500, pita: 60 };
const BASS  = { boule: 0.07, volkoren: 0.10, focaccia: 0.24, pita: 0.05 }; // aandeel water als bassinage (achterhouden)

const levBoule = (nights) => (nights === 2 ? 60 : 90);
const levFoc   = (nights) => (nights === 2 ? 65 : 100);
const levPita  = (nights) => (nights === 2 ? 8 : 11);

const REF_TEMP = 22;
const PROOF_FOC_BASE = 190;
const PROOF_BOULE_BASE = 105;
const BULK_BASE = 135;

const waterSplit = (flour, hyd, bassFrac) => {
  const total = Math.round((flour * hyd) / 100);
  const bass = Math.round(total * bassFrac);
  return { total, bass, auto: total - bass };
};

const STEPS = [
  { id: "s1",  cluster: "start", type: "beide",    title: "Autolyse — degen apart",
    note: "Mengen tot geen droge bloem. Focaccia bewust natter. 45–90 min (volkoren mag langer).",
    detail: "Alleen meel + water — nog géén zout of levain. Het meel verzadigt en enzymen starten de glutenvorming vanzelf, zodat je later minder hoeft te kneden en het deeg soepeler rekt. Ruw mengen tot er geen droge bloem meer zit; niet kneden. Hou een deel van het water achter voor later (bassinage). Volkoren profiteert van een langere autolyse (60–120 min) omdat de zemelen tijd nodig hebben om water op te nemen." },
  { id: "s2",  cluster: "start", type: "beide",    title: "Levain + zout + restwater inwerken",
    note: "Knijpen en vouwen tot homogeen.",
    detail: "Check eerst je levain: verdubbeld en koepelend, of doet de float-test. Werk de levain er met natte handen door via de pincer-methode tot opgenomen. Dan pas zout + laatste water — in delen toevoegen (bassinage) zodat het deeg het opneemt.\n\nInvloed van de hoeveelheid levain (inoculatie): meer levain = snellere rijs en mildere smaak, maar eerder overproof; minder levain = tragere, complexere en zuurdere rijs met minder kans op overproof bij lange/koude bulk. Ruwweg: half zoveel levain ≈ dubbele rijstijd. Daarom verlaagt dit schema de levain automatisch bij 2 nachten." },
  { id: "s3",  cluster: "start", type: "beide", title: "Bulk + stretch & folds",
    note: "Coil folds voor de natte focaccia. Laatste ~⅓ van de bulk ongestoord laten rijzen. Deeg luchtig laten aanvoelen.",
    detail: "Doel: kracht en gluten opbouwen en gas invangen. Boules/volkoren — stretch & fold: pak één kant, rek omhoog, vouw over het midden; draai de kom 90° en herhaal ×4 per set. Focaccia — coil fold (voor nat deeg): til het midden op tot de uiteinden loskomen en onder zichzelf rollen, draai 90°, herhaal. Natte handen voorkomen plakken.\n\nBij de focaccia werk je nu ook de olijfolie in — voeg 'm toe tijdens de eerste fold, in delen, tot opgenomen. Te vroeg toevoegen remt de glutenvorming. Aan het eind licht koepelend met wat bubbels — ~20–30 % gerezen is genoeg, de échte bulk gebeurt straks koud." },
  { id: "s4",  cluster: "start", type: "beide",    title: "In de koelkast — koude bulk",
    note: "Boules/volkoren als bulkmassa in tub. Focaccia in afgedekte geoliede bak.",
    detail: "Koude bulk = fermentatie vertraagd bij 4–6 °C. Dit bouwt smaak en zuur op én geeft je flexibiliteit om te vormen wanneer het uitkomt. In de koeling rijst het nog ~30–50 %. Kouder = trager en minder zuur, iets warmer = meer zuur. Bij 2 nachten (~41 u) zet je de koelkast liever op 3–4 °C en gebruik je minder levain — dat doet dit schema automatisch. Tip bij hoge zomerhitte: kort de warme bulk vóór de koelkast wat in, anders is het deeg al te ver voor het koud gaat." },

  { id: "w1",  cluster: "start", type: "worst", title: "Deeg kneden + verrijken",
    note: "Kneed tot glutenvenster; boter er ná de eerste ontwikkeling in.",
    detail: "Worstenbroodjes zijn een verrijkt deeg — kneden i.p.v. autolyse/folds. Meng bloem, melk, ei, suiker, zout en levain en kneed tot een soepel, samenhangend deeg. Werk dan de zachte boter er in delen door en kneed verder tot een glutenvenster (deeg dat je dun kunt uitrekken zonder te scheuren). Verrijkt deeg wil goed ontwikkeld zijn — dat geeft een pluizige kruim. Het deeg is kneedbaar en zacht, niet nat." },
  { id: "w2",  cluster: "start", type: "worst", title: "Bulk",
    note: "1–2 keer vouwen in het eerste uur. Tot ~30–50 % gerezen.",
    detail: "Laat het deeg bulken; geef in het eerste uur 1–2 lichte vouwen voor wat extra kracht. Verrijkt zuurdesem rijst trager dan gist én trager dan je lean broodjes door de boter — verwacht dus een rustiger volume vóór de koeling. ~30–50 % groei is genoeg voordat het koud gaat." },
  { id: "w3",  cluster: "start", type: "worst", title: "In de koelkast — koude bulk",
    note: "Afgesloten tub. Koud wordt het lekker stevig en makkelijk te vormen.",
    detail: "Koude nachtrijs: naast smaak en planning is dit voor verrijkt deeg extra fijn, want koud is de boter stevig en het deeg strak — veel makkelijker om straks de worst in te rollen. Afgesloten tub zodat het niet uitdroogt." },

  { id: "s5",  cluster: "bake", type: "focaccia", title: "Focaccia uit koeling → geoliede plaat",
    note: "Uitrekken, afdekken op een warme plek. Fluffy laten worden. Nog niet dimpelen.",
    detail: "Kantel het deeg voorzichtig uit de bak op een royaal geoliede plaat — niet ontgassen. Trek het zachtjes richting de hoeken; springt het terug, laat het dan 20 min rusten en herhaal. Laat het afgedekt op een warme plek tot het luchtig, bubbelig en verdubbeld in de plaat staat. Te koud of onderrezen de oven in = compact en taai. Pas dimpelen als het écht gevuld en fluffy is." },
  { id: "s6",  cluster: "bake", type: "boule",    title: "Boules uit koeling",
    note: "30–45 min op kamertemp bijkomen. Koud deeg vormt makkelijk.",
    detail: "Koud deeg is stugger en juist daardoor makkelijker strak te vormen — laat het dus niet te warm worden voor je begint. 30–45 min laten bijkomen zodat het niet ijskoud de bank op gaat. Geldt voor zowel de witte als de volkoren boules. Ondertussen werkblad, deegsteker en banneton klaarleggen." },
  { id: "s7",  cluster: "bake", type: "boule",    title: "Verdelen + voorvormen",
    note: "Bankrust 20–30 min.",
    detail: "Stort het deeg op een licht bebloemd werkblad en verdeel in gelijke stukken (weeg ze voor gelijke broden; houd wit en volkoren gescheiden). Voorvormen = losjes tot een ronde bal vouwen met net genoeg spanning zodat het bolt — nog niet strak. Naad onder, dan 20–30 min bankrust, onafgedekt, zodat de buitenkant licht opdroogt." },
  { id: "s8",  cluster: "bake", type: "boule",    title: "Eindvorm → banneton (naad boven)",
    note: "Kamertemp. Poke-test: veert traag terug = rijp.",
    detail: "Boule vormen: draai de voorgevormde bal om (gladde kant onder). Vouw de vier randen strak naar het midden en druk aan, draai dan om zodat de naad onder ligt. Spanning opbouwen: sleep de bal met beide handen of de deegsteker in kleine draaiende bewegingen naar je toe over het (nauwelijks bebloemde) blad — de onderkant 'pakt' het werkblad en trekt de bovenhuid strak en glad. Scheurt hij? Te veel spanning of een te droge huid. Glijdt hij weg? Te veel bloem eronder. Volkoren voelt door de zemelen iets minder elastisch — wees wat zachter. Leg met de naad BOVEN in een met rijstebloem bestoven banneton. Poke-test: veert ~¾ langzaam terug = rijp." },
  { id: "s9",  cluster: "bake", type: "beide",    title: "Oven voorverwarmen 250 °C",
    note: "Dutch oven of steamoven mee opwarmen (~45–60 min).",
    detail: "Verwarm de oven mét de gietijzeren pan of baksteen 45–60 min voor op 250 °C. Die massa moet écht gloeiend heet zijn — dat geeft de ovenveer. Steamoven: zet 100 % stoom klaar voor de eerste fase." },
  { id: "s10", cluster: "bake", type: "focaccia", title: "Focaccia dimpelen + pekel + topping",
    note: "Vingers tot de bodem. 15–20 min rusten.",
    detail: "Klop de pekel los (water + olijfolie + snuf zout, hoeveelheden hierboven) en giet die over het gerezen deeg. Dimpel dan met je vingertoppen recht naar beneden tot op de bodem — dit maakt de kuiltjes en breekt te grote bubbels. Stevig, maar ontgas niet volledig. Druk je topping erin en laat 15–20 min rusten." },
  { id: "s11", cluster: "bake", type: "boule",    title: "Boules bakken", bake: true,
    note: "20 min dicht/stoom @240 °C → 20–25 min open @225 °C. Kern ~96 °C.",
    detail: "Kantel de boule uit de banneton op bakpapier en scoor met een scheermesje onder ~45°, één besliste snede. Dutch oven: deksel dicht 20 min @240 °C, dan deksel eraf 20–25 min @225 °C tot diep goudbruin. Steamoven: 100 % stoom de eerste ~15–20 min, daarna droog afbakken op Hetelucht plus ~220 °C. Volkoren bakt iets donkerder en heeft vaak 5 min langer nodig. Gaar bij kern ~96 °C. Volledig laten afkoelen (min. 1 u) voor je snijdt." },
  { id: "s12", cluster: "bake", type: "focaccia", title: "Focaccia bakken", bake: true,
    note: "Hetelucht plus, 220–230 °C, 25–30 min. Geen stoom. Lauw serveren.",
    detail: "Droog bakken op Hetelucht plus, 220–230 °C, 25–30 min tot goudbruin; onderin of op een voorverwarmde steen voor een krokante bodem. Geen stoom — dat werkt de knapperige korst juist tegen. Uit de oven: meteen extra olijfolie + zeezout, dan uit de plaat op een rooster." },

  { id: "pp",  cluster: "bake", type: "pita", title: "Steen/plaat op max voorverwarmen",
    note: "275–290 °C, minstens 45 min. Of een droge gietijzeren pan op het fornuis.",
    detail: "Pita's leven van hitte. Verwarm een baksteen of staal op de hoogste ovenstand (275–290 °C) minstens 45 min voor, of gebruik een droge gietijzeren koekenpan op hoog vuur. Hoe heter de plaat, hoe explosiever de stoom binnenin het deeg de pocket opblaast. Geen stoom in de oven nodig — dit is droog en heet." },
  { id: "p1",  cluster: "bake", type: "pita", title: "Pita's uit koeling",
    note: "~40 min op kamertemp laten komen.",
    detail: "Haal het deeg uit de koeling en laat het ~40 min op kamertemp komen; koud deeg veert te veel terug bij het uitrollen. Ondertussen de plaat/steen voorverwarmen en je werkblad klaarmaken met minimale bloem." },
  { id: "p2",  cluster: "bake", type: "pita", title: "Verdelen in bollen + opbollen",
    note: "Weeg voor gelijke dikte (~110 g). Daarna bolrust.",
    detail: "Verdeel in gelijke stukken (weeg ~110 g/stuk) en bol strak op. Gelijke bollen = gelijke dikte = gelijkmatig puffen. Leg ze afgedekt weg voor de bolrust: dit ontspant het gluten zodat je straks kunt uitrollen zonder dat het deeg terugkrimpt. Overslaan = pita's die niet mooi rond blijven en slecht puffen." },
  { id: "p3",  cluster: "bake", type: "pita", title: "Uitrollen tot lappen ~4–5 mm",
    note: "Gelijkmatig, minimale bloem, geen dikke rand.",
    detail: "Rol elke bol uit tot een ronde lap van ~4–5 mm, overal even dik en zonder dikke rand — een ongelijke dikte puft ongelijk. Rol op een kaal of nauwelijks bebloemd blad; overtollige bloem isoleert het deeg en remt het puffen. Draai de lap tussendoor een kwartslag voor een ronde vorm." },
  { id: "p4",  cluster: "bake", type: "pita", title: "Uitgerold laten rusten",
    note: "10–15 min onder een doek.",
    detail: "Laat de uitgerolde lappen 10–15 min rusten onder een theedoek. Meteen bakken laat ze krimpen en slecht puffen; deze korte rust laat het gluten weer ontspannen zodat ze in de oven in één keer opblazen." },
  { id: "p5",  cluster: "bake", type: "pita", title: "Pita's bakken", bake: true,
    note: "~1–2 min per kant op de hete plaat; puft op in ~30–60 sec.",
    detail: "Leg de lappen op de gloeihete plaat/steen. Ze puffen binnen ~30–60 sec op tot een ballon; keer na ~1–1,5 min en bak de andere kant nog ~1 min. Niet te lang, anders worden ze hard en buigen ze niet meer. Wikkel ze meteen in een theedoek — dat houdt het stoom vast en maakt ze zacht en buigzaam terwijl de rest bakt. Puffen ze niet? Meestal te dik uitgerold, te veel bloem, of de plaat niet heet genoeg." },

  { id: "w4",  cluster: "bake", type: "worst", title: "Deeg uit koeling",
    note: "~40 min op kamertemp laten komen.",
    detail: "Haal het deeg uit de koeling en laat het ~40 min bijkomen — koud vormt makkelijk, maar iets te koud rolt stroef. Verwarm alvast de oven voor op 200 °C (start hiermee tijdens de narijs)." },
  { id: "w5",  cluster: "bake", type: "worst", title: "Verdelen + vullen",
    note: "Uitrollen tot reepjes, vulling erin, naad onder.",
    detail: "Verdeel het deeg in gelijke stukken en rol elk uit tot een reep. Leg de vulling naar keuze erop en rol strak in, met de naad onder zodat ze tijdens het bakken niet openvallen. Druk de uiteinden licht dicht. Leg ze met wat ruimte op een met bakpapier beklede plaat." },
  { id: "w6",  cluster: "bake", type: "worst", title: "Narijzen",
    note: "Tot luchtig en duidelijk gerezen. Oven voorverwarmen op 200 °C.",
    detail: "Laat de broodjes afgedekt narijzen tot ze luchtig en zichtbaar gerezen zijn (poke-test: veert traag terug). Verrijkt zuurdesem is traag, dus reken op ruimere narijstijd dan bij gistdeeg — geduld hier voorkomt compacte broodjes. Verwarm intussen de oven voor op 200 °C." },
  { id: "w7",  cluster: "bake", type: "worst", title: "Eiwash + bakken", bake: true,
    note: "Bestrijken met ei · 200 °C · 18–22 min goudbruin.",
    detail: "Bestrijk de broodjes met losgeklopt ei voor een glanzende, goudbruine korst. Bak op ~200 °C, 18–22 min tot diep goudbruin — bewust lager dan je lean broodjes, want ei en suiker kleuren snel. Even laten afkoelen op een rooster; de vulling is heet. Ze vriezen goed in." },
];

const STORAGE_KEY = "desem-bake-v4";
const store = {
  get(key) { try { const raw = localStorage.getItem(key); return raw ? { value: raw } : null; } catch (e) { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) {} },
};
const DAY_START = 510, DAY_END = 1380;
const parseT = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
const fmt = (min) => {
  const mm = ((Math.round(min) % 1440) + 1440) % 1440;
  return String(Math.floor(mm / 60)).padStart(2, "0") + ":" + String(mm % 60).padStart(2, "0");
};
const fmtDur = (mins) => {
  const m5 = Math.round(mins / 5) * 5, h = Math.floor(m5 / 60), mm = m5 % 60;
  if (h === 0) return `${mm} min`;
  if (mm === 0) return `${h} u`;
  return `${h} u ${mm} min`;
};
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function BakeSchedule() {
  const [boules, setBoules] = useState(2);
  const [volkoren, setVolkoren] = useState(0);
  const [pitas, setPitas] = useState(0);
  const [worst, setWorst] = useState(0);
  const [focaccias, setFocaccias] = useState(1);
  const [hydBoule, setHydBoule] = useState(78);
  const [hydVk, setHydVk] = useState(82);
  const [hydFoc, setHydFoc] = useState(74);
  const [hydPita, setHydPita] = useState(65);
  const [startDayIdx, setStartDayIdx] = useState(5);
  const [nights, setNights] = useState(1);
  const [startStr, setStartStr] = useState("13:00");
  const [temp, setTemp] = useState(25); // startwaarde ~ keuken BG (Homey)
  const [done, setDone] = useState({});
  const [openInfo, setOpenInfo] = useState({});
  const [filter, setFilter] = useState("alles");
  const [loaded, setLoaded] = useState(false);
  const [showIng, setShowIng] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (typeof window !== "undefined") {
          const r = store.get(STORAGE_KEY, false);
          if (r && r.value) {
            const v = JSON.parse(r.value);
            if (v.done) setDone(v.done);
            if (typeof v.boules === "number") setBoules(v.boules);
            if (typeof v.volkoren === "number") setVolkoren(v.volkoren);
            if (typeof v.pitas === "number") setPitas(v.pitas);
            if (typeof v.worst === "number") setWorst(v.worst);
            if (typeof v.focaccias === "number") setFocaccias(v.focaccias);
            if (v.hydBoule) setHydBoule(v.hydBoule);
            if (v.hydVk) setHydVk(v.hydVk);
            if (v.hydFoc) setHydFoc(v.hydFoc);
            if (v.hydPita) setHydPita(v.hydPita);
            if (typeof v.startDayIdx === "number") setStartDayIdx(v.startDayIdx);
            if (v.nights) setNights(v.nights);
            if (v.startStr) setStartStr(v.startStr);
            if (v.temp) setTemp(v.temp);
          }
        }
      } catch (e) {}
      finally { setLoaded(true); }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        if (typeof window !== "undefined") {
          store.set(STORAGE_KEY, JSON.stringify({ done, boules, volkoren, pitas, worst, focaccias, hydBoule, hydVk, hydFoc, hydPita, startDayIdx, nights, startStr, temp }), false);
        }
      } catch (e) {}
    })();
  }, [done, boules, volkoren, pitas, worst, focaccias, hydBoule, hydVk, hydFoc, hydPita, startDayIdx, nights, startStr, temp, loaded]);

  const toggle = (id) => setDone((d) => ({ ...d, [id]: !d[id] }));
  const toggleInfo = (id) => setOpenInfo((o) => ({ ...o, [id]: !o[id] }));
  const reset = () => setDone({});

  const b = boules, vk = volkoren, p = pitas, w = worst, f = focaccias;
  const lb = levBoule(nights), lf = levFoc(nights), lp = levPita(nights);
  const boulesActive = b > 0 || vk > 0;
  const leanActive = b > 0 || vk > 0 || p > 0 || f > 0;

  const wB = waterSplit(FLOUR.boule, hydBoule, BASS.boule);
  const wV = waterSplit(FLOUR.volkoren, hydVk, BASS.volkoren);
  const wF = waterSplit(FLOUR.focaccia, hydFoc, BASS.focaccia);
  const wP = waterSplit(FLOUR.pita, hydPita, BASS.pita);

  const bakeDayIdx = (startDayIdx + nights) % 7;
  const startDayName = WEEKDAYS[startDayIdx];
  const bakeDayName = WEEKDAYS[bakeDayIdx];

  const k = clamp(Math.pow(2, (REF_TEMP - temp) / 8), 0.6, 1.8);
  const pFoc = Math.round(PROOF_FOC_BASE * k);
  const pBoule = Math.round(PROOF_BOULE_BASE * k);
  const dBulk = Math.round(BULK_BASE * k);
  const foldEvery = clamp(Math.round((dBulk / 4) / 5) * 5, 20, 60);
  const ballRest = Math.round(45 * k); // pita bolrust
  const worstProof = Math.round(120 * k); // narijs verrijkt deeg

  const startOff = { s1: 0, s2: 75, s3: 90, s4: 75 + dBulk, w1: 0, w2: 45, w3: 45 + dBulk };
  const bakeOff = {
    s5: 0, s6: 30, s7: 75, s8: 105, s9: 105 + pBoule - 60, s10: pFoc, s11: 105 + pBoule, s12: pFoc + 25,
    pp: 5 + ballRest, p1: 0, p2: 40, p3: 40 + ballRest, p4: 50 + ballRest, p5: 65 + ballRest,
    w4: 0, w5: 45, w6: 75, w7: 75 + worstProof,
  };
  const getOff = (s) => (s.cluster === "start" ? startOff[s.id] : bakeOff[s.id]);

  const startMin = parseT(startStr);
  const s4Min = startMin + startOff.s4;
  const bakeUnclamped = startMin - 210;
  const bakeStart = Math.max(bakeUnclamped, DAY_START);
  const coldBulk = (1440 - s4Min) + (nights - 1) * 1440 + bakeStart;
  const bulkH = Math.floor(coldBulk / 60), bulkM = coldBulk % 60;
  const bulkLabel = `${bulkH} u${bulkM ? " " + bulkM + " min" : ""}`;
  const bakeTimes = [];
  if (boulesActive) bakeTimes.push(bakeOff.s11);
  if (f > 0) bakeTimes.push(bakeOff.s12);
  if (p > 0) bakeTimes.push(bakeOff.p5);
  if (w > 0) bakeTimes.push(bakeOff.w7);
  const bakeLabel = fmt(bakeStart + (bakeTimes.length ? Math.max(...bakeTimes) : bakeOff.s11));

  const warnEarly = startMin < DAY_START;
  const warnLate = s4Min > DAY_END;
  const bulkExtended = bakeUnclamped < DAY_START;

  const timeLabel = (s) => {
    const anchor = s.cluster === "start" ? startMin : bakeStart;
    const t = anchor + getOff(s);
    if (s.id === "s3") return fmt(t) + "–" + fmt(startMin + startOff.s4);
    return fmt(t);
  };

  const ingFor = (id) => {
    const P = PER_BOULE, V = PER_VK, Q = PER_FOCACCIA, PI = PER_PITA, W = PER_WORST;
    if (id === "s1") {
      const out = [];
      if (b > 0) out.push(`Boules: ${450 * b} g meel (${P.t65 * b} T65 · ${P.manitoba * b} manitoba · ${P.spelt * b} spelt · ${P.rogge * b} rogge) + ${wB.auto * b} g water`);
      if (vk > 0) out.push(`Volkoren: ${450 * vk} g meel (${V.volkoren * vk} volkoren · ${V.manitoba * vk} manitoba · ${V.spelt * vk} spelt) + ${wV.auto * vk} g water`);
      if (p > 0) out.push(`Pita's: ${60 * p} g meel (${PI.t65 * p} T65 · ${PI.manitoba * p} manitoba) + ${wP.auto * p} g water`);
      if (f > 0) out.push(`Focaccia: ${500 * f} g meel (${Q.tipo * f} tipo 00 · ${Q.manitoba * f} manitoba · ${Q.semolina * f} semolina) + ${wF.auto * f} g water (¾)`);
      return out;
    }
    if (id === "s2") {
      const out = [];
      if (b > 0) out.push(`Boules: +${lb * b} levain · +${P.zout * b} zout · +${wB.bass * b} water`);
      if (vk > 0) out.push(`Volkoren: +${lb * vk} levain · +${V.zout * vk} zout · +${wV.bass * vk} water`);
      if (p > 0) out.push(`Pita's: +${lp * p} levain · +${PI.zout * p} zout · +${wP.bass * p} water · +${PI.olie * p} olijfolie (optioneel)`);
      if (f > 0) out.push(`Focaccia: +${lf * f} levain · +${Q.zout * f} zout · +${wF.bass * f} water · +${Q.honing * f} honing (optioneel, los op in het water)`);
      return out;
    }
    if (id === "w1") return [
      `${W.bloem * w} g bloem · ${W.melk * w} g melk · ${W.ei * w} g ei · ${W.suiker * w} g suiker · ${W.zout * w} g zout · ${W.levain * w} levain`,
      `${W.boter * w} g boter — ná de eerste kneed erin`,
    ];
    if (id === "w5") return [`${w}× vulling naar keuze`];
    if (id === "w7") return ["1 ei losgeklopt, om te bestrijken"];
    if (id === "s3" && f > 0) return [`Focaccia: +${Q.doughOlie * f} g olijfolie (tijdens de 1e fold inwerken)`];
    if (id === "s5")  return ["olijfolie voor de plaat"];
    if (id === "s8")  return ["rijstebloem tegen plakken"];
    if (id === "s10") return [`pekel: ${Q.pekelWater * f} g water + ${Q.pekelOlie * f} g olijfolie + snuf zout`, "topping: tomaat / rozemarijn / olijven"];
    if (id === "s12") return ["afmaken: olijfolie + zeezout"];
    return [];
  };

  const proofFor = (id) => {
    if (id === "s3") return `Warme bulk ~${fmtDur(dBulk)} bij ${temp} °C · 3–4 folds, elke ~${foldEvery} min`;
    if (id === "s5") return `Warme rijs ~${fmtDur(pFoc)} bij ${temp} °C — tot fluffy/verdubbeld`;
    if (id === "s8") return `Eindrijs ~${fmtDur(pBoule)} bij ${temp} °C`;
    if (id === "p2") return `Bolrust ~${fmtDur(ballRest)} bij ${temp} °C — tot ontspannen`;
    if (id === "w6") return `Narijs ~${fmtDur(worstProof)} bij ${temp} °C — verrijkt deeg, geduld`;
    return null;
  };

  const countOK = (s) => {
    if (s.id === "s9") return boulesActive || f > 0;
    if (s.type === "boule") return boulesActive;
    if (s.type === "focaccia") return f > 0;
    if (s.type === "pita") return p > 0;
    if (s.type === "worst") return w > 0;
    return leanActive; // beide (lean autolyse-stappen)
  };
  const chipOn = { alles: true, boule: b > 0, volkoren: vk > 0, pita: p > 0, worst: w > 0, focaccia: f > 0 };
  const effFilter = chipOn[filter] === false ? "alles" : filter;
  const matches = (s) => {
    if (effFilter === "alles") return true;
    if (effFilter === "worst") return s.type === "worst";
    if (s.type === "beide") return true;
    if (effFilter === "focaccia") return s.type === "focaccia";
    if (effFilter === "pita") return s.type === "pita";
    return s.type === "boule"; // boule of volkoren delen de boule-stappen
  };

  const activeSteps = STEPS.filter(countOK);
  const total = activeSteps.length;
  const doneCount = activeSteps.filter((s) => done[s.id]).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const levainTotal = lb * (b + vk) + lp * p + PER_WORST.levain * w + lf * f;

  const chips = [
    { k: "alles", label: "Alles", on: true },
    { k: "boule", label: "Boules", on: b > 0 },
    { k: "volkoren", label: "Volkoren", on: vk > 0 },
    { k: "pita", label: "Pita's", on: p > 0 },
    { k: "worst", label: "Worstenb.", on: w > 0 },
    { k: "focaccia", label: "Focaccia", on: f > 0 },
  ];
  const DAYS = [
    { key: "start", label: cap(startDayName), sub: "autolyse → koude bulk" },
    { key: "bake",  label: cap(bakeDayName),  sub: "vormen → bakken" },
  ];
  const PRESETS = [["Winter", 18], ["Kamer", 22], ["Zomer", 26]];

  const Stepper = ({ label, value, set, min, max, ink }) => (
    <div className="ctl">
      <span className="ctllabel">{label}</span>
      <div className="stepper">
        <button onClick={() => set(Math.max(min, value - 1))} disabled={value <= min} aria-label="min">−</button>
        <span className="num" style={{ color: ink }}>{value}</span>
        <button onClick={() => set(Math.min(max, value + 1))} disabled={value >= max} aria-label="plus">+</button>
      </div>
    </div>
  );

  const HydCtl = ({ label, v, set, ink }) => (
    <div className="hyd">
      <span className="hydlabel" style={{ color: ink }}>{label}</span>
      <div className="hydstep">
        <button onClick={() => set(Math.max(60, v - 1))} disabled={v <= 60} aria-label="min">−</button>
        <span className="hydval">{v}%</span>
        <button onClick={() => set(Math.min(90, v + 1))} disabled={v >= 90} aria-label="plus">+</button>
      </div>
    </div>
  );

  return (
    <div className="wrap">
      <style>{css}</style>

      <header className="head">
        <div className="eyebrow">Desem-weekend · brood + focaccia</div>
        <h1>Bakschema</h1>
        <p className="lede">
          Start <b>{cap(startDayName)} {fmt(startMin)}</b> · koude bulk ~{bulkLabel} · bakken <b>{cap(bakeDayName)} ~{bakeLabel}</b>
        </p>

        <div className="controls">
          <Stepper label="Boules" value={boules} set={setBoules} min={0} max={8} ink={TYPES.boule.ink} />
          <Stepper label="Volkoren" value={volkoren} set={setVolkoren} min={0} max={4} ink={TYPES.volkoren.ink} />
          <Stepper label="Pita's" value={pitas} set={setPitas} min={0} max={12} ink={TYPES.pita.ink} />
          <Stepper label="Worstenb." value={worst} set={setWorst} min={0} max={12} ink={TYPES.worst.ink} />
          <Stepper label="Focaccia's" value={focaccias} set={setFocaccias} min={0} max={4} ink={TYPES.focaccia.ink} />
          <div className="ctl">
            <span className="ctllabel">Startdag</span>
            <select className="select" value={startDayIdx} onChange={(e) => setStartDayIdx(Number(e.target.value))}>
              {WEEKDAYS.map((d, i) => <option key={i} value={i}>{cap(d)}</option>)}
            </select>
          </div>
          <div className="ctl">
            <span className="ctllabel">Starttijd</span>
            <input className="timeinput" type="time" value={startStr} min="08:30" max="19:30" step="300"
                   onChange={(e) => e.target.value && setStartStr(e.target.value)} />
          </div>
          <div className="ctl ctlwide">
            <span className="ctllabel">Bakdag</span>
            <div className="seg">
              {[1, 2].map((n) => {
                const idx = (startDayIdx + n) % 7;
                return (
                  <button key={n} className={"segbtn" + (nights === n ? " on" : "")} onClick={() => setNights(n)}>
                    {cap(WEEKDAYS[idx])}<small>{n} nacht{n > 1 ? "en" : ""}</small>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="ctl ctlwide">
            <span className="ctllabel">Warme rijs — omgevingstemp · <b style={{ color: TYPES.boule.ink }}>{temp} °C</b></span>
            <input className="temprange" type="range" min="15" max="30" step="1" value={temp}
                   onChange={(e) => setTemp(Number(e.target.value))} />
            <div className="presets">
              {PRESETS.map(([lab, val]) => (
                <button key={lab} className={"preset" + (temp === val ? " on" : "")} onClick={() => setTemp(val)}>{lab} {val}°</button>
              ))}
            </div>
          </div>
          {(b > 0 || vk > 0 || p > 0 || f > 0) && (
            <div className="ctl ctlwide">
              <span className="ctllabel">Hydratatie</span>
              <div className="hydrow">
                {b > 0 && <HydCtl label="Boules" v={hydBoule} set={setHydBoule} ink={TYPES.boule.ink} />}
                {vk > 0 && <HydCtl label="Volkoren" v={hydVk} set={setHydVk} ink={TYPES.volkoren.ink} />}
                {p > 0 && <HydCtl label="Pita's" v={hydPita} set={setHydPita} ink={TYPES.pita.ink} />}
                {f > 0 && <HydCtl label="Focaccia" v={hydFoc} set={setHydFoc} ink={TYPES.focaccia.ink} />}
              </div>
            </div>
          )}
        </div>
        <p className="constraint">Stappen tussen 08:30–23:00 · koude bulk schuift mee ({nights} nacht{nights > 1 ? "en" : ""}) · warme-rijs- en hydratatie-instellingen rekenen automatisch door.</p>

        {(warnEarly || warnLate || bulkExtended) && (
          <div className="warn">
            {warnEarly && <div>Start ligt vóór 08:30 — kies 08:30 of later.</div>}
            {warnLate && <div>De koelkast-stap valt ná 23:00 — kies een vroegere start (of hogere temp verkort de warme bulk).</div>}
            {!warnLate && bulkExtended && <div>Koude bulk verlengd tot {bulkLabel} zodat je op de bakdag niet vóór 08:30 hoeft te starten.</div>}
          </div>
        )}
        {nights === 2 && (
          <div className="info">
            2 nachten koud (~{bulkLabel}) = flink zuurder. Levain automatisch verlaagd (boules/volkoren {lb} g, focaccia {lf} g/stuk) — zet de koelkast op 3–4 °C.
          </div>
        )}

        <div className="progress">
          <div className="bar"><span style={{ width: `${pct}%` }} /></div>
          <div className="pmeta">
            <span>{doneCount}/{total} stappen</span>
            <button className="reset" onClick={reset} disabled={doneCount === 0}>Reset</button>
          </div>
        </div>

        <div className="chips">
          {chips.map((c) => {
            const active = effFilter === c.k;
            const t = TYPES[c.k];
            return (
              <button key={c.k} className={"chip" + (active ? " on" : "")} disabled={!c.on}
                onClick={() => setFilter(c.k)}
                style={active && t ? { background: t.ink, borderColor: t.ink, color: "#fff" } : {}}>
                {c.k !== "alles" && <span className="dot" style={{ background: TYPES[c.k].node }} />}
                {c.label}
              </button>
            );
          })}
        </div>
        {(effFilter === "boule" || effFilter === "volkoren") && b > 0 && vk > 0 && (
          <p className="hint"><span className="dot" style={{ background: TYPES.boule.node }} /> Witte en volkoren boules delen dezelfde vorm-/bakstappen.</p>
        )}
        {effFilter !== "alles" && (
          <p className="hint"><span className="dot" style={{ background: TYPES.beide.node }} /> Gedeelde stappen horen ook bij dit brood.</p>
        )}

        <button className="ingtoggle" onClick={() => setShowIng((v) => !v)}>{showIng ? "− " : "+ "}Ingrediënten</button>
        {showIng && (
          <div className="ingpanel">
            {b > 0 && (
              <div className="ingcol" style={{ borderColor: TYPES.boule.ink }}>
                <h3 style={{ color: TYPES.boule.ink }}>{b} {b === 1 ? "boule" : "boules"} — {450 * b} g meel</h3>
                <p>{PER_BOULE.t65 * b} T65 · {PER_BOULE.manitoba * b} manitoba · {PER_BOULE.spelt * b} spelt · {PER_BOULE.rogge * b} rogge</p>
                <p>{wB.total * b} g water ({hydBoule} %, {wB.bass * b} g achterhouden) · {lb * b} levain · {PER_BOULE.zout * b} zout</p>
              </div>
            )}
            {vk > 0 && (
              <div className="ingcol" style={{ borderColor: TYPES.volkoren.ink }}>
                <h3 style={{ color: TYPES.volkoren.ink }}>{vk} volkoren {vk === 1 ? "boule" : "boules"} — {450 * vk} g meel</h3>
                <p>{PER_VK.volkoren * vk} volkoren · {PER_VK.manitoba * vk} manitoba · {PER_VK.spelt * vk} spelt</p>
                <p>{wV.total * vk} g water ({hydVk} %, {wV.bass * vk} g achterhouden) · {lb * vk} levain · {PER_VK.zout * vk} zout</p>
              </div>
            )}
            {p > 0 && (
              <div className="ingcol" style={{ borderColor: TYPES.pita.ink }}>
                <h3 style={{ color: TYPES.pita.ink }}>{p} pita{p > 1 ? "'s" : ""} — {60 * p} g meel</h3>
                <p>{PER_PITA.t65 * p} T65 · {PER_PITA.manitoba * p} manitoba</p>
                <p>{wP.total * p} g water ({hydPita} %) · {lp * p} levain · {PER_PITA.olie * p} olijfolie (opt.) · {PER_PITA.zout * p} zout</p>
              </div>
            )}
            {w > 0 && (
              <div className="ingcol" style={{ borderColor: TYPES.worst.ink }}>
                <h3 style={{ color: TYPES.worst.ink }}>{w} worstenbroodje{w > 1 ? "s" : ""}</h3>
                <p>{PER_WORST.bloem * w} bloem · {PER_WORST.melk * w} melk · {PER_WORST.ei * w} ei · {PER_WORST.boter * w} boter · {PER_WORST.suiker * w} suiker · {PER_WORST.zout * w} zout</p>
                <p>{PER_WORST.levain * w} levain · {w}× vulling · 1 ei (eiwash)</p>
              </div>
            )}
            {f > 0 && (
              <div className="ingcol" style={{ borderColor: TYPES.focaccia.ink }}>
                <h3 style={{ color: TYPES.focaccia.ink }}>{f} focaccia{f > 1 ? "'s" : ""} — {500 * f} g meel</h3>
                <p>{PER_FOCACCIA.tipo * f} tipo 00 · {PER_FOCACCIA.manitoba * f} manitoba · {PER_FOCACCIA.semolina * f} semolina</p>
                <p>{wF.total * f} g water ({hydFoc} %) · {lf * f} levain · {PER_FOCACCIA.doughOlie * f} olijfolie (deeg) · {PER_FOCACCIA.honing * f} honing (opt.) · {PER_FOCACCIA.zout * f} zout</p>
                <p style={{ color: "var(--muted)" }}>+ olie voor plaat · pekel · afwerking</p>
              </div>
            )}
            <p className="ingfoot">Levain nodig: {levainTotal} g totaal — check dat je genoeg actief hebt.</p>
          </div>
        )}
      </header>

      {DAYS.map((day) => {
        const daySteps = STEPS.filter((s) => s.cluster === day.key && countOK(s) && matches(s))
          .sort((a, b2) => getOff(a) - getOff(b2));
        if (daySteps.length === 0) return null;
        return (
          <section key={day.key} className="day">
            <div className="dayhead">
              <span className="dayname">{day.label}</span>
              <span className="daysub">{day.sub}</span>
            </div>
            <div className="track">
              {daySteps.map((s) => {
                const t = TYPES[s.type];
                const isDone = !!done[s.id];
                const isOpen = !!openInfo[s.id];
                const ing = ingFor(s.id);
                const proof = proofFor(s.id);
                return (
                  <div key={s.id}
                    className={"card" + (isDone ? " done" : "") + (s.bake ? " bake" : "")}
                    role="button" tabIndex={0} aria-pressed={isDone}
                    onClick={() => toggle(s.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(s.id); } }}
                    style={{ "--ink": t.ink, "--tint": t.tint }}>
                    <span className="node" style={{ borderColor: t.node, background: isDone ? t.node : "transparent" }}>
                      {isDone && <span className="tick">✓</span>}
                    </span>
                    <span className="rail" style={{ background: t.node }} />
                    <button className={"infobtn" + (isOpen ? " open" : "")}
                      onClick={(e) => { e.stopPropagation(); toggleInfo(s.id); }}
                      aria-label={isOpen ? "Verberg uitleg" : "Toon uitleg"} aria-expanded={isOpen}
                      style={isOpen ? { background: t.ink, borderColor: t.ink, color: "#fff" } : { color: t.ink, borderColor: t.ink }}>i</button>
                    <div className="body">
                      <div className="cardtop">
                        <span className="time">{timeLabel(s)}</span>
                        <span className="badge" style={{ background: t.tint, color: t.ink }}>{t.label}</span>
                        {s.bake && <span className="ovenlabel">in de oven</span>}
                      </div>
                      <div className="title">{s.title}</div>
                      {ing.length > 0 && <ul className="ing">{ing.map((i, k2) => <li key={k2}>{i}</li>)}</ul>}
                      {s.note && <div className="note">{s.note}</div>}
                      {proof && <div className="proofline" style={{ background: t.tint, color: t.ink }}>{proof}</div>}
                      {isOpen && s.detail && <div className="detail" style={{ background: t.tint, borderColor: t.node }}>{s.detail}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <footer className="foot">Tik een stap aan om af te vinken · ⓘ voor uitleg en tips</footer>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
* { box-sizing:border-box; }
.wrap { --paper:#F5EFE2; --card:#FCFAF4; --ink:#2A211A; --muted:#6E6155; --line:#E4DBC9;
  background:var(--paper); color:var(--ink); font-family:'Inter',system-ui,sans-serif; min-height:100%;
  padding:22px 16px 48px; max-width:660px; margin:0 auto; -webkit-font-smoothing:antialiased; }
.head { margin-bottom:8px; }
.eyebrow { font-family:'Space Mono',monospace; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); margin-bottom:8px; }
h1 { font-family:'Fraunces',serif; font-weight:600; font-size:40px; line-height:.98; margin:0 0 8px; letter-spacing:-.01em; }
.lede { margin:0 0 16px; color:var(--muted); font-size:14px; line-height:1.5; }
.lede b { color:var(--ink); }

.controls { display:flex; flex-wrap:wrap; gap:10px 12px; background:var(--card); border:1px solid var(--line); border-radius:14px; padding:12px; }
.ctl { display:flex; flex-direction:column; gap:6px; flex:1 1 auto; min-width:96px; }
.ctlwide { flex-basis:100%; }
.ctllabel { font-family:'Space Mono',monospace; font-size:10.5px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); }
.ctllabel b { font-family:'Fraunces',serif; font-size:13px; }
.stepper { display:flex; align-items:center; gap:4px; }
.stepper button { width:32px; height:34px; border-radius:9px; border:1px solid var(--line); background:var(--paper); font-size:18px; line-height:1; color:var(--ink); cursor:pointer; font-family:inherit; }
.stepper button:disabled { opacity:.3; cursor:default; }
.stepper button:active:not(:disabled) { transform:scale(.92); }
.num { font-family:'Fraunces',serif; font-weight:600; font-size:20px; min-width:26px; text-align:center; }
.select, .timeinput { font-family:'Space Mono',monospace; font-size:15px; font-weight:700; color:var(--ink); border:1px solid var(--line); background:var(--paper); border-radius:9px; padding:6px 8px; height:34px; width:100%; }
.select { font-family:'Inter',sans-serif; font-weight:600; font-size:14px; }
.seg { display:flex; gap:6px; }
.segbtn { flex:1; display:flex; flex-direction:column; align-items:center; gap:1px; padding:6px 4px; border:1px solid var(--line); background:var(--paper); border-radius:9px; cursor:pointer; font:inherit; font-weight:600; font-size:13.5px; color:var(--ink); }
.segbtn small { font-family:'Space Mono',monospace; font-weight:400; font-size:9.5px; letter-spacing:.04em; text-transform:uppercase; color:var(--muted); }
.segbtn.on { background:var(--ink); border-color:var(--ink); color:#fff; }
.segbtn.on small { color:#E5DCCB; }
.segbtn:active { transform:scale(.97); }
.temprange { width:100%; accent-color:#B15511; height:24px; }
.presets { display:flex; gap:6px; margin-top:2px; }
.preset { flex:1; padding:5px 6px; border:1px solid var(--line); background:var(--paper); border-radius:8px; cursor:pointer; font:inherit; font-size:12px; font-weight:600; color:var(--ink); }
.preset.on { background:#B15511; border-color:#B15511; color:#fff; }
.preset:active { transform:scale(.97); }
.hydrow { display:flex; flex-wrap:wrap; gap:8px; }
.hyd { display:flex; flex-direction:column; gap:4px; flex:1 1 auto; min-width:96px; }
.hydlabel { font-size:12px; font-weight:600; }
.hydstep { display:flex; align-items:center; gap:4px; }
.hydstep button { width:30px; height:32px; border-radius:8px; border:1px solid var(--line); background:var(--paper); font-size:17px; line-height:1; color:var(--ink); cursor:pointer; font-family:inherit; }
.hydstep button:disabled { opacity:.3; cursor:default; }
.hydstep button:active:not(:disabled) { transform:scale(.92); }
.hydval { font-family:'Space Mono',monospace; font-weight:700; font-size:14px; min-width:44px; text-align:center; }

.constraint { font-size:12px; color:var(--muted); margin:8px 2px 4px; line-height:1.4; }
.warn { background:#FBEEE0; border:1px solid #E4B183; border-radius:11px; padding:9px 12px; margin:6px 0 4px; font-size:12.5px; line-height:1.45; color:#8A4B12; }
.warn div + div { margin-top:3px; }
.info { background:#EAEFDB; border:1px solid #B7C58A; border-radius:11px; padding:9px 12px; margin:6px 0 4px; font-size:12.5px; line-height:1.45; color:#4C5E20; }

.progress { margin:14px 0 16px; }
.bar { height:8px; background:var(--line); border-radius:20px; overflow:hidden; }
.bar span { display:block; height:100%; border-radius:20px; background:linear-gradient(90deg,#B15511,#5F7A2C); transition:width .35s ease; }
.pmeta { display:flex; justify-content:space-between; align-items:center; margin-top:7px; font-family:'Space Mono',monospace; font-size:12px; color:var(--muted); }
.reset { font:inherit; border:none; background:none; color:var(--muted); text-decoration:underline; cursor:pointer; padding:4px; }
.reset:disabled { opacity:.35; cursor:default; text-decoration:none; }

.chips { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px; }
.chip { font:inherit; font-size:13.5px; font-weight:500; display:inline-flex; align-items:center; gap:7px; padding:7px 13px; border-radius:20px; border:1px solid var(--line); background:var(--card); color:var(--ink); cursor:pointer; transition:transform .08s ease; }
.chip:disabled { opacity:.35; cursor:default; }
.chip:active:not(:disabled) { transform:scale(.96); }
.dot { width:9px; height:9px; border-radius:50%; display:inline-block; flex:none; }
.hint { display:flex; align-items:center; gap:7px; font-size:12.5px; color:var(--muted); margin:2px 0 8px; }

.ingtoggle { font:inherit; font-family:'Space Mono',monospace; font-size:12px; background:none; border:none; color:var(--muted); cursor:pointer; padding:6px 0; text-transform:uppercase; letter-spacing:.08em; }
.ingpanel { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:14px; margin:4px 0 10px; }
.ingcol { border-left:3px solid; padding-left:12px; margin-bottom:12px; }
.ingcol:last-of-type { margin-bottom:6px; }
.ingcol h3 { font-family:'Fraunces',serif; font-size:16px; margin:0 0 4px; font-weight:600; }
.ingcol p { margin:2px 0; font-size:13px; color:var(--ink); line-height:1.4; }
.ingfoot { font-size:12px; color:var(--muted); font-style:italic; margin:8px 0 0; }

.day { margin-top:22px; }
.dayhead { display:flex; align-items:baseline; gap:10px; margin-bottom:12px; padding-left:2px; }
.dayname { font-family:'Fraunces',serif; font-size:22px; font-weight:600; }
.daysub { font-family:'Space Mono',monospace; font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); }

.track { position:relative; display:flex; flex-direction:column; gap:12px; }
.card { position:relative; text-align:left; width:100%; display:block; padding:13px 46px 14px 40px; background:var(--card); border:1px solid var(--line); border-radius:14px; cursor:pointer; font:inherit; color:var(--ink); transition:opacity .2s ease, transform .08s ease, box-shadow .2s ease; }
.card:active { transform:scale(.992); }
.card:focus-visible { outline:2px solid var(--ink); outline-offset:2px; }
.card.done { opacity:.5; }
.rail { position:absolute; left:17px; top:34px; bottom:-12px; width:2px; opacity:.4; }
.track .card:last-child .rail { display:none; }
.node { position:absolute; left:11px; top:15px; width:15px; height:15px; border-radius:50%; border:2px solid; background:transparent; display:flex; align-items:center; justify-content:center; z-index:1; }
.tick { color:#fff; font-size:9px; line-height:1; font-weight:700; }
.infobtn { position:absolute; top:12px; right:12px; z-index:2; width:24px; height:24px; border-radius:50%; border:1.5px solid; background:var(--card); font-family:'Fraunces',serif; font-style:italic; font-weight:600; font-size:14px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:transform .08s ease; }
.infobtn:active { transform:scale(.9); }
.infobtn:focus-visible { outline:2px solid var(--ink); outline-offset:2px; }
.cardtop { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px; }
.time { font-family:'Space Mono',monospace; font-size:13px; font-weight:700; color:var(--ink); }
.badge { font-size:10.5px; font-weight:600; letter-spacing:.03em; padding:2px 8px; border-radius:20px; }
.ovenlabel { font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:.08em; color:#fff; background:#C2410C; padding:2px 8px; border-radius:20px; }
.title { font-family:'Fraunces',serif; font-size:16.5px; font-weight:600; line-height:1.2; margin-bottom:4px; }
.ing { margin:5px 0 4px; padding:0; list-style:none; }
.ing li { font-size:13px; color:var(--ink); padding-left:12px; position:relative; line-height:1.4; }
.ing li::before { content:"·"; position:absolute; left:2px; color:var(--muted); }
.note { font-size:13px; color:var(--muted); line-height:1.45; }
.proofline { margin-top:7px; display:inline-block; font-family:'Space Mono',monospace; font-size:11.5px; font-weight:700; padding:3px 9px; border-radius:7px; }
.detail { margin-top:10px; padding:11px 13px; border-radius:10px; border-left:3px solid; font-size:13px; line-height:1.55; color:var(--ink); white-space:pre-line; }
.card.bake { border-color:#E8B98C; box-shadow:0 1px 0 #E8B98C, 0 6px 18px -10px rgba(194,65,12,.5); background:linear-gradient(180deg,#FDF3EA,var(--card)); }
.foot { margin-top:26px; text-align:center; font-size:12px; color:var(--muted); font-family:'Space Mono',monospace; letter-spacing:.02em; }
@media (prefers-reduced-motion: reduce) { * { transition:none !important; } }
`;
