import { db, ensureSchema } from "../config/db";
import { hashPassword } from "../util/hash";

async function seed() {
  console.log("→ Vytváram schému…");
  await ensureSchema();

  console.log("→ Sejem typy vôd…");
  const waterTypes = [
    "Rieka",
    "Jazero",
    "Priehrada",
    "Rybník",
    "Potok",
    "More",
  ];
  for (const name of waterTypes) {
    await db.query("INSERT IGNORE INTO water_types (name) VALUES (?)", [name]);
  }

  console.log("→ Sejem používateľov…");
  const adminPass = hashPassword("Admin123");
  const userPass = hashPassword("Rybar123");
  await db.query(
    "INSERT IGNORE INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)",
    ["Admin Tichej Vody", "admin@tichavoda.sk", adminPass, 1],
  );
  await db.query(
    "INSERT IGNORE INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)",
    ["Jozef Mrázik", "jozef@tichavoda.sk", userPass, 0],
  );
  await db.query(
    "INSERT IGNORE INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)",
    ["Mária Vodárska", "maria@tichavoda.sk", userPass, 0],
  );

  const [adminRows] = await db.query<any[]>("SELECT id FROM users WHERE email = ?", [
    "admin@tichavoda.sk",
  ]);
  const [jozefRows] = await db.query<any[]>("SELECT id FROM users WHERE email = ?", [
    "jozef@tichavoda.sk",
  ]);
  const [mariaRows] = await db.query<any[]>("SELECT id FROM users WHERE email = ?", [
    "maria@tichavoda.sk",
  ]);
  const adminId = adminRows[0].id as number;
  const jozefId = jozefRows[0].id as number;
  const mariaId = mariaRows[0].id as number;

  const [wt] = await db.query<any[]>("SELECT id, name FROM water_types");
  const wtMap = new Map<string, number>(wt.map((r: any) => [r.name, r.id as number]));

  const [existing] = await db.query<any[]>("SELECT COUNT(*) AS c FROM fishing_spots");
  if (existing[0].c > 0) {
    console.log("→ Revíri už existujú, preskakujem.");
    await db.end();
    return;
  }

  console.log("→ Sejem revíry…");
  const spots = [
    {
      name: "Liptovská Mara",
      desc: "Najväčšia priehrada na Slovensku. Domov rekordných šťúk a zubáčov, s vetrom čo formuje vlny ako rieka v inom svete. Pristup z hrádze pri Liptovskom Mikuláši.",
      type: "Priehrada",
      region: "Žilinský kraj",
      city: "Liptovský Mikuláš",
      lat: 49.0928,
      lon: 19.5061,
      author: jozefId,
      image: "/images/uploads/spots/liptovska-mara.png",
    },
    {
      name: "Oravská priehrada",
      desc: "Tichá voda obklopená lesmi. Ranné hmly, kde sa zubáč ráno hýbe ako tieň. Lipy, smrekovce, vôňa živice. Z móla pri Námestove sa dá loviť aj na plavák.",
      type: "Priehrada",
      region: "Žilinský kraj",
      city: "Námestovo",
      lat: 49.4076,
      lon: 19.5089,
      author: mariaId,
      image: "/images/uploads/spots/oravska-priehrada.png",
    },
    {
      name: "Dunaj — Bratislava (Devín)",
      desc: "Veľká voda, veľké ryby. Sumce nad sto kilo, kapry ako prasiatka. Vyžaduje rešpekt a ťažší výstroj. Ideálny zaberajúci úsek od Devína po Karloveské rameno.",
      type: "Rieka",
      region: "Bratislavský kraj",
      city: "Bratislava",
      lat: 48.1737,
      lon: 16.9794,
      author: jozefId,
      image: "/images/uploads/spots/dunaj-devin.png",
    },
    {
      name: "Váh — Žilina",
      desc: "Pstruh dúhový a hlavátka v hornom toku. V meste pekné prielety pri vlnoreze. Vyžaduje topánky s dobrou prilnavosťou — kamene sú zradné.",
      type: "Rieka",
      region: "Žilinský kraj",
      city: "Žilina",
      lat: 49.2235,
      lon: 18.7394,
      author: mariaId,
      image: "/images/uploads/spots/vah-zilina.png",
    },
    {
      name: "Zemplínska Šírava",
      desc: "Slovenské more. Teplá voda v lete, výborné kapry a sumce. Veterná lokalita — voľte miesto za vetrom. Pri Vinianskom kameni býva v auguste húf zubáčov.",
      type: "Priehrada",
      region: "Košický kraj",
      city: "Michalovce",
      lat: 48.8154,
      lon: 21.9756,
      author: jozefId,
      image: "/images/uploads/spots/zemplinska-sirava.png",
    },
    {
      name: "Domaša",
      desc: "Druhá najväčšia priehrada. Tichý kus prírody, ideálny pre dlhé stojánky. Šťuka v zátokách pri vyústení potokov. Spoľahlivý úspech na rybku 8–12 cm.",
      type: "Priehrada",
      region: "Prešovský kraj",
      city: "Vranov nad Topľou",
      lat: 49.0578,
      lon: 21.6225,
      author: mariaId,
      image: "/images/uploads/spots/domasa.png",
    },
    {
      name: "Sĺňava",
      desc: "Priehrada na Váhu pri Piešťanoch. Vlnitá voda, čisté brehy, ľahká dostupnosť. Známa zubáčmi v jesennom období a kaprami pri sútoku s Hornou Stredou.",
      type: "Priehrada",
      region: "Trnavský kraj",
      city: "Piešťany",
      lat: 48.5853,
      lon: 17.8281,
      author: jozefId,
      image: "/images/uploads/spots/slnava.png",
    },
    {
      name: "Hron — Banská Bystrica",
      desc: "Pstruhárska klasika. Ráno je voda priezračná ako sklo. Pstruh potočný berie na živú aj na umelú mušku. Najlepší úsek nad Šálkovou.",
      type: "Rieka",
      region: "Banskobystrický kraj",
      city: "Banská Bystrica",
      lat: 48.7359,
      lon: 19.1463,
      author: mariaId,
      image: "/images/uploads/spots/hron-banska-bystrica.png",
    },
    {
      name: "Rybník Tona",
      desc: "Malý komorný rybník schovaný za železničnou traťou. Domáce kapry, karasy, červené plotice. Ideálne pre začiatočníkov a deti.",
      type: "Rybník",
      region: "Trenčiansky kraj",
      city: "Trenčín",
      lat: 48.8945,
      lon: 18.0445,
      author: jozefId,
      image: "/images/uploads/spots/rybnik-tona.png",
    },
    {
      name: "Potok Revúca",
      desc: "Horský pstruhársky potok. Studená čistá voda, kamenisté dno. Vyžaduje brodenie a pokoj. Pstruhárske revíry s množstvom úkrytov pod brehom.",
      type: "Potok",
      region: "Žilinský kraj",
      city: "Ružomberok",
      lat: 49.0833,
      lon: 19.3,
      author: mariaId,
      image: "/images/uploads/spots/potok-revuca.png",
    },
    {
      name: "Ružín",
      desc: "Horská priehrada s mimoriadnou hĺbkou. Sumce nad 80 kg, šťuky, zubáče. Členitý breh — nájdete si svoj kút.",
      type: "Priehrada",
      region: "Košický kraj",
      city: "Košice-okolie",
      lat: 48.8542,
      lon: 21.0844,
      author: jozefId,
      image: "/images/uploads/spots/ruzin.png",
    },
    {
      name: "Jazero Senec — Slnečné jazerá",
      desc: "Mestské jazerá s prístupnými brehmi. Kapor, amur, šťuka. Ideálne pre večerné lovenie po práci.",
      type: "Jazero",
      region: "Bratislavský kraj",
      city: "Senec",
      lat: 48.2197,
      lon: 17.4006,
      author: mariaId,
      image: "/images/uploads/spots/slnecne-jazera.png",
    },
  ];

  for (const s of spots) {
    const [r] = await db.query<any>(
      "INSERT INTO addresses (region, city, gps_lat, gps_lon) VALUES (?, ?, ?, ?)",
      [s.region, s.city, s.lat, s.lon],
    );
    const addressId = r.insertId;
    await db.query(
      "INSERT INTO fishing_spots (name, description, water_type_id, address_id, image_location, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [s.name, s.desc, wtMap.get(s.type), addressId, s.image, s.author],
    );
  }

  console.log("→ Sejem úlovky…");
  const [spotRows] = await db.query<any[]>("SELECT id, name FROM fishing_spots");
  const sample = (spotName: string) => spotRows.find((r: any) => r.name === spotName)?.id as number;

  const catches = [
    { spot: "Liptovská Mara", user: jozefId, sp: "Šťuka severná", w: 8.4, l: 92, r: 5, c: "Brala na rybku, ranná hmla. Boj 12 minút." },
    { spot: "Liptovská Mara", user: mariaId, sp: "Zubáč obyčajný", w: 4.2, l: 78, r: 4, c: "Tesne pred západom slnka." },
    { spot: "Oravská priehrada", user: mariaId, sp: "Šťuka severná", w: 6.1, l: 85, r: 5, c: "Z móla, na červený twister." },
    { spot: "Dunaj — Bratislava (Devín)", user: jozefId, sp: "Sumec veľký", w: 42.5, l: 198, r: 5, c: "45 minút boja. Aj sused rybár pomohol s podberákom." },
    { spot: "Domaša", user: mariaId, sp: "Kapor obyčajný", w: 11.2, l: 82, r: 5, c: "Ráno o piatej, nočná návnada." },
    { spot: "Hron — Banská Bystrica", user: jozefId, sp: "Pstruh potočný", w: 1.8, l: 48, r: 4, c: "Mušia muška. Voda krištálová." },
    { spot: "Sĺňava", user: mariaId, sp: "Zubáč obyčajný", w: 3.5, l: 71, r: 4, c: "Z brehu, na živú plotku." },
    { spot: "Zemplínska Šírava", user: jozefId, sp: "Sumec veľký", w: 28.0, l: 165, r: 5, c: "Z lode, hĺbka 8 m." },
    { spot: "Rybník Tona", user: mariaId, sp: "Kapor obyčajný", w: 4.5, l: 56, r: 3, c: "Výborné na fotku s deťmi." },
    { spot: "Ružín", user: jozefId, sp: "Šťuka severná", w: 9.7, l: 96, r: 5, c: "Spinning, ranná zóna." },
  ];

  for (const c of catches) {
    const spotId = sample(c.spot);
    if (!spotId) continue;
    await db.query(
      "INSERT INTO catches (spot_id, user_id, species, weight_kg, length_cm, rating, comment) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [spotId, c.user, c.sp, c.w, c.l, c.r, c.c],
    );
  }

  console.log("✦ Hotovo.");
  console.log("  Admin: admin@tichavoda.sk / Admin123");
  console.log("  User:  jozef@tichavoda.sk / Rybar123");
  await db.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
