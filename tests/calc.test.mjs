// Testy výpočtů z bloku // <calc> … // </calc> v index.html.
// Spuštění: node --test tests/
// Funkce se berou přímo z index.html – testuje se skutečný kód appky, ne kopie.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
const sw = readFileSync(new URL("sw.js", root), "utf8");

const m = html.match(/\/\/ <calc>([\s\S]*?)\/\/ <\/calc>/);
if (!m) throw new Error("Blok // <calc> … // </calc> v index.html nenalezen");
const NAMES = ["parseNum", "ductArea", "ductFlow", "fanFlow", "targetVelocity", "rangeOf", "meanOf",
  "parsePoints", "parseTemp", "recupEfficiency", "exhaustEfficiency", "supplyTemp", "exhaustTemp",
  "dewPoint", "humidityRatio", "heaterPower", "requiredEfficiency"];
const c = new Function(m[1] + "\nreturn {" + NAMES.join(",") + "};")();

function near(actual, expected, tol = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= tol, `očekáváno ${expected} ± ${tol}, vyšlo ${actual}`);
}

test("plocha potrubí [m²]: kruh π·(d/1000)²/4, obdélník a·b", () => {
  near(c.ductArea("round", 200), 0.0314159, 1e-6);
  near(c.ductArea("round", 315), 0.0779311, 1e-6);
  near(c.ductArea("rect", 500, 300), 0.15);
  near(c.ductArea("rect", 1000, 1000), 1);
});

test("výkon z potrubí V = v·A·3600 [m³/h]", () => {
  near(c.ductFlow(5, c.ductArea("round", 200)), 565.487, 1e-3);
  near(c.ductFlow(3, c.ductArea("rect", 500, 300)), 1620);
  near(c.ductFlow(1, 1), 3600);
});

test("z tlaku q = (1/k)·√Δp [m³/s], výkon = q·3600 [m³/h]", () => {
  near(c.fanFlow(10, 400), 2);
  near(c.fanFlow(10, 400) * 3600, 7200);
  near(c.fanFlow(2, 64), 4);
  near(c.fanFlow(2, 64) * 3600, 14400);
  near(c.fanFlow(5, 0), 0);
});

test("cílová rychlost v = V/(A·3600) [m/s]", () => {
  near(c.targetVelocity(1620, 0.15), 3);
  near(c.targetVelocity(565.487, c.ductArea("round", 200)), 5, 1e-5);
  near(c.targetVelocity(3600, 1), 1);
});

test("rekuperace – přívodní strana η = (t2−t1)/(t3−t1)·100", () => {
  near(c.recupEfficiency(-5, 15, 22), 74.0741, 1e-4);
  near(c.recupEfficiency(0, 16, 20), 80);
});

test("rekuperace – odpadní strana (t3−t4)/(t3−t1)·100", () => {
  near(c.exhaustEfficiency(-5, 22, 2), 74.0741, 1e-4);
  near(c.exhaustEfficiency(0, 20, 4), 80);
});

test("rekuperace – zpětný výpočet teplot z účinnosti", () => {
  near(c.supplyTemp(80, 0, 20), 16);
  near(c.supplyTemp(50, -10, 20), 5);
  near(c.exhaustTemp(80, 0, 20), 4);
  near(c.exhaustTemp(50, -10, 20), 5);
});

test("potřebná účinnost (bez ohřívače)", () => {
  near(c.requiredEfficiency(16, 0, 20), 80);
  near(c.requiredEfficiency(18, -5, 22), 85.1852, 1e-4);
});

test("rosný bod (Magnus 17,625; 243,04)", () => {
  near(c.dewPoint(20, 50), 9.26, 0.01);
  near(c.dewPoint(10, 100), 10, 1e-9);   // při 100 % RH je rosný bod roven teplotě
  near(c.dewPoint(25, 60), 16.69, 0.01);
});

test("měrná vlhkost [kg/kg]", () => {
  near(c.humidityRatio(20, 50) * 1000, 7.25, 0.01);   // ≈ 7,3 g/kg
  near(c.humidityRatio(20, 0), 0);
  near(c.humidityRatio(0, 100) * 1000, 3.77, 0.01);
});

test("ohřívač P = V·1,2·1,005·Δt/3600 [kW]", () => {
  near(c.heaterPower(1000, 10), 3.35);
  near(c.heaterPower(3600, 1), 1.206);
  near(c.heaterPower(500, 0), 0);
});

test("čtení čísel: desetinná čárka i tečka, prázdné, neplatné", () => {
  assert.deepEqual(c.parseNum("3,5"), { s: "ok", v: 3.5 });
  assert.deepEqual(c.parseNum(" 3.5 "), { s: "ok", v: 3.5 });
  assert.deepEqual(c.parseNum("1 250"), { s: "ok", v: 1250 });
  assert.deepEqual(c.parseNum(""), { s: "empty" });
  assert.equal(c.parseNum("abc").s, "invalid");
  assert.equal(c.parseNum("-3").s, "invalid");   // rychlost/rozměr nesmí být záporné
  assert.equal(c.parseNum(".").s, "invalid");
});

test("čtení teplot: záporné i typografické mínus", () => {
  assert.deepEqual(c.parseTemp("-5,5"), { s: "ok", v: -5.5 });
  assert.deepEqual(c.parseTemp("−12"), { s: "ok", v: -12 });
  assert.deepEqual(c.parseTemp("22.4"), { s: "ok", v: 22.4 });
  assert.deepEqual(c.parseTemp("-"), { s: "empty" });
  assert.equal(c.parseTemp("1-2").s, "invalid");
});

test("vícebodové měření: průměr, min, max, prázdná pole se přeskočí", () => {
  const p = c.parsePoints(["2,5", "", "3.5", " ", "3"]);
  assert.deepEqual(p.vals, [2.5, 3.5, 3]);
  assert.equal(p.bad, false);
  near(c.meanOf(p.vals), 3);
  assert.deepEqual(c.rangeOf(p.vals), { min: 2.5, max: 3.5 });

  const q = c.parsePoints(["4", "x", "6"]);
  assert.equal(q.bad, true);
  assert.deepEqual(q.vals, [4, 6]);
  near(c.meanOf([4, 6]), 5);
  assert.deepEqual(c.rangeOf([4, 6]), { min: 4, max: 6 });
});

test("číslo verze v appce = číslo v CACHE v sw.js", () => {
  const appVer = html.match(/id="verze">Verze (\d+)</);
  const swVer = sw.match(/const CACHE = "vzt-vykon-v(\d+)"/);
  assert.ok(appVer, "v index.html chybí <p id=\"verze\">Verze N</p>");
  assert.ok(swVer, "v sw.js chybí const CACHE = \"vzt-vykon-vN\"");
  assert.equal(appVer[1], swVer[1]);
});
