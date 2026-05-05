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
  for (const x of waterTypes) {
    await db.query("INSERT IGNORE INTO water_types (name) VALUES (?)", [x]);
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

  const extraAnglers = [
    "Peter Hlbočan",
    "Lucia Brežná",
    "Tomáš Štíhly",
    "Eva Kapustová",
    "Martin Sumár",
    "Zuzana Pstruhová",
    "Andrej Lososiar",
    "Katarína Plotická",
  ];
  for (const name of extraAnglers) {
    const slug = name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.]/g, "");
    await db.query(
      "INSERT IGNORE INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)",
      [name, `${slug}@tichavoda.sk`, userPass, 0],
    );
  }

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

  const [allUserRows] = await db.query<any[]>("SELECT id FROM users WHERE isAdmin = 0");
  const allUserIds: number[] = allUserRows.map((r: any) => r.id as number);

  const [wt] = await db.query<any[]>("SELECT id, name FROM water_types");
  const wtMap = new Map<string, number>(wt.map((r: any) => [r.name, r.id as number]));

  console.log("→ Čistím demo dáta revírov, úlovkov a obľúbených…");
  await db.query("DELETE FROM favorites");
  await db.query("DELETE FROM catches");
  await db.query("DELETE FROM fishing_spots");
  await db.query("DELETE FROM addresses");

  console.log("→ Sejem revíry…");
  const spots = [
    {
      name: "Liptovská Mara",
      desc: "Najväčšia priehrada na Slovensku. Jediný slovenský revír v svetovom atlase, známy šťukou, zubáčom a vetrom, ktorý mení hladinu na malé more.",
      type: "Priehrada",
      region: "Slovensko",
      city: "Liptovský Mikuláš",
      lat: 49.0928,
      lon: 19.5061,
      author: jozefId,
      image: "/images/uploads/spots/liptovska-mara.png",
    },
    {
      name: "Gaula River",
      desc: "Nórska lososová rieka južne od Trondheimu. Patrí medzi najznámejšie európske miesta pre lov atlantského lososa na mušku.",
      type: "Rieka",
      region: "Nórsko",
      city: "Trøndelag",
      lat: 63.2,
      lon: 10.3,
      author: mariaId,
      image: "/images/uploads/spots/norsko-gaula-river.png",
    },
    {
      name: "Amazon Basin",
      desc: "Najväčší riečny systém sveta. Tropický sladkovodný labyrint s arapaimou, pávím ostriežom, piraíbou a extrémnou druhovou pestrosťou.",
      type: "Rieka",
      region: "Brazília",
      city: "Manaus",
      lat: -3.5,
      lon: -60.0,
      author: jozefId,
      image: "/images/uploads/spots/brazilia-amazon-basin.png",
    },
    {
      name: "Tongariro River",
      desc: "Novozélandská pstruhová legenda pri jazere Taupō. Čistá voda, prudké prúdy a celoročný lov dúhových a potočných pstruhov.",
      type: "Rieka",
      region: "Nový Zéland",
      city: "Turangi",
      lat: -39.0,
      lon: 175.8,
      author: mariaId,
      image: "/images/uploads/spots/novy-zeland-tongariro-river.png",
    },
    {
      name: "Campbell River",
      desc: "Kanadská lososová klasika na Vancouver Island. Preslávená ťahmi chinooka, coho a steelheada, často nazývaná Salmon Capital of the World.",
      type: "Rieka",
      region: "Kanada",
      city: "British Columbia",
      lat: 50.0,
      lon: -125.2,
      author: jozefId,
      image: "/images/uploads/spots/kanada-campbell-river.png",
    },
    {
      name: "Madison River",
      desc: "Montanská muškárska ikona so stabilným prúdom a divokými pstruhmi. Rieka je známa ako jeden z najlepších trout streamov v USA.",
      type: "Rieka",
      region: "USA",
      city: "Montana",
      lat: 44.9,
      lon: -111.5,
      author: mariaId,
      image: "/images/uploads/spots/usa-madison-river.png",
    },
    {
      name: "Lake Victoria",
      desc: "Najväčšie tropické jazero sveta. Východoafrický rybársky gigant známy nílskym ostriežom, tilapiou a obrovskou komerčnou aj športovou hodnotou.",
      type: "Jazero",
      region: "Keňa / Tanzánia / Uganda",
      city: "Kisumu",
      lat: -0.8,
      lon: 33.2,
      author: jozefId,
      image: "/images/uploads/spots/vychodna-afrika-lake-victoria.png",
    },
    {
      name: "Lake Baikal",
      desc: "Najhlbšie jazero sveta a sibírska ikona. Priezračná voda, omul, lipeň, šťuka a unikátny ekosystém s endemickými druhmi.",
      type: "Jazero",
      region: "Rusko",
      city: "Irkutská oblasť",
      lat: 53.5,
      lon: 108.2,
      author: mariaId,
      image: "/images/uploads/spots/rusko-lake-baikal.png",
    },
    {
      name: "Three Gorges Reservoir",
      desc: "Obrovská priehradná nádrž na rieke Jang-c’-ťiang. Rozsiahly sladkovodný systém s kaprami, sumcami a mandarínskou rybou.",
      type: "Priehrada",
      region: "Čína",
      city: "Hubei",
      lat: 30.8,
      lon: 111.0,
      author: jozefId,
      image: "/images/uploads/spots/cina-three-gorges-reservoir.png",
    },
    {
      name: "Lake Mead",
      desc: "Legendárna americká priehradná nádrž pri Hoover Dam. Známa lovom pruhovaných ostriežov, largemouth bassov a sumcov v púštnej krajine.",
      type: "Priehrada",
      region: "USA",
      city: "Nevada / Arizona",
      lat: 36.1,
      lon: -114.4,
      author: mariaId,
      image: "/images/uploads/spots/usa-lake-mead.png",
    },
    {
      name: "Nile River",
      desc: "Jedna z najznámejších riek sveta. Historická tepna severovýchodnej Afriky s nílskym ostriežom, sumcami a tigerfish v horných úsekoch.",
      type: "Rieka",
      region: "Egypt",
      city: "Luxor",
      lat: 26.8,
      lon: 30.8,
      author: jozefId,
      image: "/images/uploads/spots/egypt-nile-river.png",
    },
    {
      name: "Río Grande",
      desc: "Patagónska rieka preslávená veľkými morskými pstruhmi. Drsná krajina, vietor a životné úlovky na južnom konci Argentíny.",
      type: "Rieka",
      region: "Argentína",
      city: "Tierra del Fuego",
      lat: -53.8,
      lon: -67.7,
      author: mariaId,
      image: "/images/uploads/spots/argentina-rio-grande.png",
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
    { spot: "Gaula River", user: mariaId, sp: "Atlantic salmon", w: 12.6, l: 104, r: 5, c: "Muška v studenom prúde, prudký výpad po zábere." },
    { spot: "Amazon Basin", user: jozefId, sp: "Arapaima", w: 86.0, l: 214, r: 5, c: "Obrovská ryba v tichej lagúne pri zatopenom lese." },
    { spot: "Tongariro River", user: mariaId, sp: "Rainbow trout", w: 3.4, l: 61, r: 5, c: "Čistá voda, rýchly drift a tvrdý záber v prúde." },
    { spot: "Campbell River", user: jozefId, sp: "Chinook salmon", w: 24.5, l: 126, r: 5, c: "Losos sa držal pri hrane prúdu, boj trval skoro pol hodiny." },
    { spot: "Madison River", user: mariaId, sp: "Brown trout", w: 2.7, l: 57, r: 4, c: "Suchá muška počas večerného rojenia." },
    { spot: "Lake Victoria", user: jozefId, sp: "Nile perch", w: 38.0, l: 142, r: 5, c: "Ťažký ťah z hlbšej vody pri ostrovnom zlome." },
    { spot: "Lake Baikal", user: mariaId, sp: "Omul", w: 1.6, l: 45, r: 4, c: "Ľadovo čistá voda, jemný záber pri kamennom brehu." },
    { spot: "Three Gorges Reservoir", user: jozefId, sp: "Carp", w: 14.3, l: 88, r: 4, c: "Nočný kapor z tichej zátoky nádrže." },
    { spot: "Lake Mead", user: mariaId, sp: "Striped bass", w: 9.1, l: 82, r: 5, c: "Tvrdý útok pri skalnatom výbežku." },
    { spot: "Nile River", user: jozefId, sp: "Nile perch", w: 31.5, l: 133, r: 5, c: "Silný záber za súmraku, veľká ryba z hlbiny." },
    { spot: "Río Grande", user: mariaId, sp: "Sea trout", w: 9.8, l: 89, r: 5, c: "Patagónsky vietor, ťažká šnúra a životný morský pstruh." },
  ];

  for (const c of catches) {
    const spotId = sample(c.spot);
    if (!spotId) continue;
    await db.query(
      "INSERT INTO catches (spot_id, user_id, species, weight_kg, length_cm, rating, comment) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [spotId, c.user, c.sp, c.w, c.l, c.r, c.c],
    );
  }

  console.log("→ Doplňujem úlovky tak, aby každý revír mal aspoň 5 záznamov…");
  const speciesBySpot: Record<string, string[]> = {
    "Liptovská Mara": ["Šťuka severná", "Zubáč obyčajný", "Kapor", "Jalec hlavatý", "Pleskáč"],
    "Gaula River": ["Atlantic salmon", "Sea trout", "Brown trout", "Grayling"],
    "Amazon Basin": ["Peacock bass", "Arapaima", "Piraíba", "Tambaqui", "Pirarucu"],
    "Tongariro River": ["Rainbow trout", "Brown trout"],
    "Campbell River": ["Chinook salmon", "Steelhead", "Coho salmon", "Pink salmon"],
    "Madison River": ["Brown trout", "Rainbow trout", "Cutthroat trout"],
    "Lake Victoria": ["Nile perch", "Tilapia", "Catfish"],
    "Lake Baikal": ["Omul", "Grayling", "Pike", "Sturgeon"],
    "Three Gorges Reservoir": ["Carp", "Catfish", "Mandarin fish", "Black carp"],
    "Lake Mead": ["Striped bass", "Largemouth bass", "Catfish", "Crappie"],
    "Nile River": ["Nile perch", "Tigerfish", "Catfish", "Vundu"],
    "Río Grande": ["Sea trout", "Brown trout", "Steelhead"],
  };
  const fillerComments = [
    "Pokojné popoludnie, voda číra, záber po dlhom čakaní.",
    "Vetrisko z hôr, ale ryba zabrala tesne pred zotmením.",
    "Dlhý drift, jemná muška, krásny boj.",
    "Skoro ráno, hmla na vode, prudký ťah na šnúre.",
    "Tichá zátoka, kotvička v koreňoch, šťastný únik a opätovný záber.",
    "Po búrke sa ryba rozbehla, hodina trpezlivosti.",
    "Nočný lov, len mesiac a praskot ohňa na brehu.",
    "Klasické miesto pri starom móle, overený trik.",
    "Záber tesne pri brehu, takmer som ho prehliadol.",
  ];
  const [allSpotRows] = await db.query<any[]>("SELECT id, name FROM fishing_spots");
  for (const row of allSpotRows) {
    const [existingRows] = await db.query<any[]>(
      "SELECT COUNT(*) AS n FROM catches WHERE spot_id = ?",
      [row.id],
    );
    let have = Number(existingRows[0].n);
    const speciesList = speciesBySpot[row.name as string] || ["Šťuka severná", "Kapor", "Sumec"];
    let i = 0;
    while (have < 5) {
      const userId = allUserIds[(row.id + have + i) % allUserIds.length];
      const sp = speciesList[(have + i) % speciesList.length];
      const w = Number((1 + ((row.id * 7 + have * 3 + i) % 90) / 5).toFixed(1));
      const l = 35 + ((row.id * 11 + have * 5 + i) % 110);
      const r = 3 + ((row.id + have + i) % 3);
      const c = fillerComments[(row.id + have + i) % fillerComments.length];
      await db.query(
        "INSERT INTO catches (spot_id, user_id, species, weight_kg, length_cm, rating, comment) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [row.id, userId, sp, w, l, r, c],
      );
      have += 1;
      i += 1;
    }
  }

  console.log("→ Sejem obľúbené revíry…");
  const targetFavorites = 36;
  const seenFav = new Set<string>();
  let favIter = 0;
  while (seenFav.size < targetFavorites && favIter < targetFavorites * 6) {
    const u = allUserIds[favIter % allUserIds.length];
    const s = allSpotRows[(favIter * 5 + 3) % allSpotRows.length].id as number;
    const key = `${u}-${s}`;
    favIter += 1;
    if (seenFav.has(key)) continue;
    seenFav.add(key);
    await db.query(
      "INSERT IGNORE INTO favorites (user_id, spot_id) VALUES (?, ?)",
      [u, s],
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
