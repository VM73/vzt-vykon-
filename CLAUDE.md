# Vzduchový výkon VZT

Mobilní PWA pro servisní techniky VZT: vzduchový výkon z rychlosti v potrubí, z tlaku a k-faktoru, cílová rychlost, rekuperace, souhrn přívod/odvod.

## Zadání
- Kdo: Vladan a kolegové (repo je veřejné). Jen telefony – Android a iPhone.
- Kde běží: https://vm73.github.io/vzt-vykon-/ (GitHub Pages), bez backendu, offline přes service worker.
- Hotovo když: výpočty sedí na známých příkladech a appka jde přidat na plochu s vlastní ikonou.

## Stack a nasazení
- `index.html` (vše v jednom), `sw.js` (cache `vzt-vykon-vN`), `manifest.webmanifest`, ikony `icon-180.png`, `icon-512.png`.
- Přesunuto z artefaktu claude.ai kvůli ikoně na ploše; v artefaktu nefungovaly mailto, sdílení ani WhatsApp – nevracet.
- Nasazení: soubory do kořene repa; při změně zvýšit `CACHE` v `sw.js`.

## Vzorce a jednotky (blok `// <calc>` … `// </calc>` v index.html)
- **Výkon vždy m³/h, průtok vždy m³/s.** k-faktor je bezrozměrný.
- Plocha potrubí [m²]: kruh π·(d/1000)²/4, obdélník (a/1000)·(b/1000), rozměry v mm.
- Výkon z potrubí: V = v · A · 3600 [m³/h].
- Z tlaku: q = (1/k)·√Δp [m³/s]; výkon = q · 3600 [m³/h]. (Ne k·√Δp!)
- Cílová rychlost: v = V / (A · 3600) [m/s].
- Rekuperace (t1 venkovní, t2 přívod za rekuperátorem, t3 odváděný, t4 odpadní): η = (t2−t1)/(t3−t1)·100; odpadní strana (t3−t4)/(t3−t1)·100.
- Rosný bod a měrná vlhkost: Magnus (17,625; 243,04).
- Ohřívač: P [kW] = V · 1,2 · 1,005 · Δt / 3600.
- Vícebodové měření: průměr, min, max; prázdná pole se přeskočí. Desetinná čárka i tečka.

## Pravidla
- **Dopad na náklady a limity:** u každé úpravy předem zvážit a v souhrnu oznámit dopad na Claude (tokeny), GitHub (Actions minuty, Pages), Supabase (DB, Storage, Edge Functions – free tier), OpenAI/Anthropic API (cena za volání). Když se nic nemění, napsat „bez dopadu“.
- Nejjednodušší řešení, měnit jen nutné; nové obrazovky přes společnou komponentu, ne kopie markupu.
- UI česky, iOS vzhled, od 320 px.
- Odeslání souhrnu jen: Kopírovat text, Kopírovat předmět, Uložit do souboru.
- Ikony: rodina pracovních appek (#4a8fd4 → #2c5f94), motiv ventilátor.

## Testy
- Výpočty z bloku `<calc>` v Node na známých vstupech (každý vzorec min. 2 příklady).
- Playwright: iPhone 13, Pixel 7, 320 / 390 px.

## Stav
- Menu: Výpočet na potrubí, Výpočet z tlaku (k-faktor), Cílová rychlost, Rekuperátor, Souhrn a odeslání.

## Otevřené otázky
- Chybí `?debug=1` a viditelné číslo verze (pravidlo pro všechny appky) – doplnit při příští úpravě.
- Testy výpočtů v repu zatím nejsou.

## Neměnit
- Vzorce a jednotky výše bez výslovného potvrzení.
