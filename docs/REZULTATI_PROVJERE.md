# Rezultati funkcionalne provjere - 27.10.2026.

Plan: [PLAN_PROVJERE.md](PLAN_PROVJERE.md). **Lokalna runda je završena.** Potvrđene greške su ispravljene i ponovo provjerene. Fizički Android/iPhone, stvarna push dostava i produkcijski hosting nisu dio uspješno završenih lokalnih provjera.

## Okruženje i pouzdanost dokaza

- Windows, Node.js 22.14.0, MySQL 8.0.43; kalendar Europe/Sarajevo i datum 27.10.2026.
- Dva repozitorija s lokalnim izmjenama: backend osnovni commit `c7888e4`, frontend `308ccc7`. Ovo je provjera radne kopije, ne objavljenog izdanja ili neizmijenjenih osnovnih commitova.
- Zaseban `mysqld --no-defaults`, samo 127.0.0.1:49404, označen direktorij i provjeren stvarni datadir. Svaki test stvara svoju nasumično imenovanu bazu. Postojeći servis MySQL80 i produkcijska konfiguracija nisu korišteni.
- Izmišljeni računi: dva administratora, teacher, dva roditelja i stari user račun. Osnova ima 120 učenika, zajedničko dijete dva roditelja, 106 poruka za historiju jednog razgovora i po 120 obavijesti za osoblje. UI provjera je dodala 121. učenika.
- UI: Codex in-app browser, desktop 1366 × 900 i mobilni viewport 390 × 844. Mobilni viewport nije fizički telefon. Slike su iz stvarnog lokalnog interfejsa; nisu dizajnerske makete.
- API testovi provjeravaju HTTP odgovore i spremljene podatke; jedinični testovi koriste zamjene zavisnosti. Push transport u integracijskoj provjeri je zamjenski pošiljalac, bez slanja prema uređajima. UI fixture ne pokreće push sender.

## Završne automatske provjere

| Provjera | Rezultat | Obuhvat / dokaz |
|---|---|---|
| Backend `npm test` | 108/108 prošlo | Prijava, autorizacija, sesije, validacije, komentari, obavijesti i push sigurnost |
| Backend `npm run typecheck`, `npm run build` | Prošlo | Izvor i testni tipovi, kompilacija |
| Backend `npm run test:functional` | 18/18 prošlo | 17 funkcionalnih grupa + nadređeni test, stvarni HTTP i MySQL; [JSON izvještaj](qa-http-results.json) |
| Backend `npm run test:integration` | Prošlo | 7 migracija, usvajanje sheme, oporavak parcijalnog DDL-a, trajne sesije, konkurentni chat, rollback i push red |
| `node --import tsx scripts/qa-backup.cjs` | Prošlo | Baza kopirana i vraćena u novu praznu bazu; svaki red svih 14 tabela identičan; [JSON izvještaj](qa-backup-results.json) |
| Frontend `npm test` | 42/42 prošlo | Sesije i utrke odgovora, nacrti, cursor historija, service worker, prevodi, datumi i procenti |
| Frontend `npm run lint`, `npm run build` | Prošlo | TypeScript i produkcijski Vite build; ostaje upozorenje o veličini JS paketa oko 660 kB prije gzip-a |
| PDF generisanje i pregled | Prošlo | 8 + 2 stranice, sve renderovane Popplerom i vizuelno pregledane; provjeren tekst i bosanska slova |

`qa-http-initial.json` čuva početne neuspjehe iz funkcionalne runde. Konačni rezultat je `qa-http-results.json`. Neuspjesi nastali zbog pogrešno napisanog testa nisu tretirani kao greške proizvoda: ispravljeni su nazivi DTO polja, očekivana struktura odgovora i očekivane ovlasti kompatibilne rute za komentare.

## Matrica prema planu

Status „prošlo lokalno” odnosi se samo na navedenu metodu i slučajeve. Ne tvrdi da su isprobane sve moguće kombinacije preglednika, prekida veze i operativnih sistema.

| Scenarij | Status | Izvršena provjera i stvarni rezultat |
|---|---|---|
| AUTH-01 registracija | Prošlo lokalno | HTTP: validna registracija daje parent i uz pokušaj slanja role=admin; neispravan unos i pogrešna lozinka odbijeni. UI obrazac pregledan. |
| AUTH-02 prijava/odjava | Prošlo lokalno | UI admin i parent, izlazak i povratak na prijavu; HTTP opoziv, odjava svih uređaja, testovi kasnih odgovora i prekida veze. |
| AUTH-03 trajne sesije | Prošlo lokalno | Prijava preživljava reload; MySQL provjerava rotaciju, apsolutno isticanje, hash podatke, opoziv i trajnost. |
| AUTH-04 više tabova/utrke | Prošlo u automatizaciji | Frontend testovi simuliraju konkurentne tabove i zakašnjele odgovore; MySQL testira konkurentni replay. Stvarni HTTPS cookie/CORS test na hostingu još slijedi. |
| ACL-01 prava | Prošlo lokalno | HTTP i sigurnosni testovi: anonimni i nedovoljne uloge odbijeni; roditelj ne može dobiti tuđe dijete, razgovor, obavijest ili sesiju. |
| ADM-01 dva administratora | Prošlo lokalno | Oba admina i teacher vide svih 120 razgovora kroz 3 stranice. Oba admina vide novu poruku. Konkurentno prisustvo daje jedan zapis. Obavijesti i sesije ostaju lične. |
| PROF-01 profil | Prošlo lokalno | UI profil i odjava; HTTP izmjena vlastitog imena/prezimena, zaštita uloge/emaila i tuđeg profila, odgovor bez password polja. |
| STU-01 lista/pretraga | Prošlo lokalno | HTTP stranice, statistika, razred, roditelj i ime s dijakritikom; UI pretraga Amine i prikaz povezanih roditelja. |
| STU-02 učenik CRUD/datumi | Prošlo lokalno | HTTP create/update/delete, 29.02.2016. bez pomjeranja, odbijen 30.02.; UI unos Zejne i kalendar 12.04.2015. |
| STU-03 ključevi/legacy veza | Prošlo lokalno | HTTP validan ključ povezuje dijete; roditeljski DTO ne otkriva ključ. Staff prikazuje stvarne parent_students veze, kompatibilnost starog parent_id ostaje. |
| PAR-01 povezivanje | Prošlo lokalno | HTTP zajedničko dijete, novo povezivanje/odspajanje i trenutni gubitak pristupa; user kompatibilnost. UI roditelj vidi svoju djecu, pogrešan format ključa daje jasnu grešku. |
| PAR-02 roditeljsko prisustvo | Prošlo lokalno | HTTP zabrana tuđeg djeteta i ispravni sažeci; UI mobilni modal s datumima, stvarnim statusima i 60,0%. Izmišljeni medicinski razlozi uklonjeni. |
| ATT-01 unos po datumu | Prošlo lokalno | HTTP 4 statusa, upsert, filteri i brisanje. UI promjena → sačuvano stanje; simulirani 503 → upozorenje i prethodni status, ponovni pokušaj uspijeva. |
| ATT-02 zbir/bulk | Prošlo lokalno | HTTP neuneseni odvojeni od odsutnih, tačan procenat, konkurentni upsert i rollback cijelog bulk zahtjeva. UI pretraga 121. učenika; 26.10.2026. prikazuje 121 neunesen, 0 odsutnih. |
| NOTE-01 dnevni komentari | Prošlo lokalno | HTTP liste, thread, staff original i roditeljski odgovor kroz kompatibilnu rutu; roditeljski original na toj staroj ruti ostaje odbijen. UI roditeljski dnevni komentari i odabir datuma. Novi Poruke centar dozvoljava roditelju početak razgovora. |
| NEWS-01 javni pregled | Prošlo lokalno | HTTP javne novosti, author filter, lista slika i posluživanje slike. UI početna i postojeća slika nakon ponovnog pokušaja. |
| NEWS-02 uređivanje/slike | Prošlo lokalno | HTTP CRUD, djelimični update, numerički ID, lažni PNG, nepostojeća novost, 5 slika i odbijena 6.; nema zaostalih datoteka poslije neuspjeha/brisanja. UI prekid upload-a zadržava formu i retry ne pravi duplu novost; slika učitana i vidljiva i u edit formi. |
| CHAT-01 mnogo razgovora | Prošlo lokalno | UI otvoreno 20 kartica, aktivna kartica vidljiva, prebacivanje vraća zaseban nacrt. API 120 razgovora kroz 3 stranice, bez duplih ID-eva. |
| CHAT-02 slanje | Prošlo lokalno | UI admin Ctrl+Enter i roditeljski Pošalji daju poruku u historiji. HTTP isti UUID vraća isti zapis; različit sadržaj s istim UUID odbijen. MySQL testira istovremene zahtjeve. |
| CHAT-03 historija/odgovori | Prošlo lokalno | Dvije cursor stranice po 50 bez preklapanja, stabilnost uz nove poruke; UI citirani odgovor, API thread i kompatibilni dnevni zapisi. |
| CHAT-04 uređivanje/brisanje | Prošlo lokalno | UI uređena vlastita poruka s oznakom uređeno; HTTP author/admin pravila, moderacija drugog admina i soft-delete bez starog sadržaja. |
| CHAT-05 čitanje/socket | Prošlo lokalno, ograničen obuhvat | UI čitanje smanjuje broj obavijesti, otvaranje ciljane poruke; HTTP throughId; automatizacija autentikacije i opoziva socket sesije. Dugotrajan prekid/reconnect na mobilnoj mreži nije fizički isproban. |
| NOT-01 sandučić | Prošlo lokalno | HTTP vlasništvo, filter, pojedinačno/sve pročitano i broj; UI zvono na telefonu otvara ciljanu Amininu poruku. Neuspjeli read zahtjev ne mijenja lokalno stanje lažno. |
| PUSH-01 postavke | Prošlo lokalno, bez stvarne pretplate | UI prikazuje postavke i iPhone korake; HTTP konfiguracija i odbijanje neispravnog odredišta. Uključivanje dozvole/pretplate na fizičkom uređaju čeka fazu F. |
| PUSH-02 red dostave | Prošlo sa zamjenskim transportom | Stvarni MySQL: atomarnost s porukom, leases, ponovni pokušaji, opozvana sesija, provider410 cleanup, generičan sadržaj i read/soft-delete ponašanje. |
| PUSH-03 zatvoren telefon | Čeka uslov | Potrebni HTTPS testno okruženje i fizički Android + iPhone; vidi završnu listu ispod. Nije potvrđena stvarna isporuka. |
| API-01 rute | Prošlo lokalno | Funkcionalni JSON bilježi metode/putanje; obuhvaćene registrirane grupe, validni/nevalidni identifikatori, health i 404. Autorizacija dodatno pokrivena unit testovima. |
| UX-01 prevodi/datumi | Prošlo lokalno | Paritet svih BS/EN ključeva i interpolacija; oblici množine, datum isti u oba jezika; timezone/DST/leap i month navigation testovi. UI BS→EN→BS i datumi 27.10.2026.; procenti sa zarezom. |
| UX-02 mobilni prikaz/pristupačnost | Prošlo za provjerene prikaze | Desktop i 390 px: meni, roditeljske kartice, razgovor, modal prisustva i obavijesti; imenovani radio unosi. Stvarne tastature telefona, čitači ekrana, svi breakpointi i svi preglednici nisu potpuno provjereni. |
| OPS-01 migracije/oporavak | Prošlo lokalno | Prazna baza + svih 7 migracija, repeat up, status bez pisanja, schema adoption, checksums, partial-DDL recovery. DB-only dump/restore svih 14 tabela. Produkcijska nadogradnja, image backup i automatizovani hosting backup još slijede. |

## Potvrđeni nalazi i ispravke

| Nalaz i reprodukcija | Uticaj | Ispravka i ponovna provjera |
|---|---|---|
| MySQL DATE je pretvaran u timestamp: rođendan 29.02.2016. izlazio kao prethodni datum u UTC-u | Visok - pogrešan datum | dateStrings samo za DATE; HTTP tačno vraća 2016-02-29; frontend timezone/DST testovi i UI kalendar |
| Neuneseni učenici ulazili u odsutne; SQL SUM stringovi davali nemoguće procente | Visok - netačna evidencija/statistika | Eksplicitni odsutni i unrecordedCount; Number konverzija i nule. HTTP 3 odsutna/108 neunesenih, 60%; UI 121 neunesen na praznom danu |
| Prisustvo učitavalo samo prvih 100 učenika | Visok - dio učenika nije dostupan | Učitavanje svih API stranica; UI pronalazi novog 121. učenika |
| Dva admina mogli se sudariti pri prvom unosu; bulk mogao ostaviti djelimične izmjene | Visok - greške i djelimični podaci | Atomski upsert i transakcija; dva istovremena HTTP zahtjeva isti ID, loš kasniji bulk red vraća sve promjene |
| Nakon HTTP 503 radio/status izgledao sačuvan | Visok - lažna potvrda unosa | UI mijenja status tek nakon sačuvanog odgovora/refetcha; ručno ponovljen 503, prethodni status ostaje, retry uspješan |
| Roditelj dobijao izmišljene medicinske razloge; mobilna tabela preširoka; nepostojeće ikone | Srednji | Uklonjeni izmišljeni razlozi, kartice na telefonu, Bootstrap ikone; pregled mobilnog modala i panela |
| Staff prikaz roditelja koristio samo stari parent_id; unos tražio legacy ID | Srednji | Imena stvarnih parent_students veza, eksplicitni DTO i uklonjena legacy ID polja iz UI-ja; HTTP dva roditelja i UI imena |
| News partial update gubio nepromijenjen sadržaj; upload vraćao objekat umjesto numeričkog ID-a | Srednji | Stroga validacija/definisana polja, normalizovan ID; HTTP provjera zadržanog teksta i tipa ID-a |
| Upload nije pouzdano ograničavao zbir slika niti čistio neuspjehe/obrisanu novost | Srednji | Raster tip/potpis, zaključan red novosti, najviše 5 ukupno, atomska metadata i cleanup. HTTP fake/missing/sixth/delete i provjera direktorija bez orphan datoteka |
| Forma novosti nestajala prije slike; retry mogao kreirati novu objavu; hardkodirane putanje slika | Srednji | Zadržavanje forme, sačuvan news ID, lokalizovane greške, ispravan API base, onemogućen izlaz dok traje slanje; ručni prekid/upload retry i edit preview |
| Nepregledna traka uz mnogo razgovora i zbir samo trenutno učitane stranice | Srednji | Aktivna kartica automatski vidljiva; uklonjen zavaravajući djelimični zbir, pojedinačni brojevi i globalno zvono ostaju; 20 kartica + odvojeni nacrti |
| Procenti nisu dosljedno pratili BS zarez; roditeljski opis govorio 10 dana umjesto zapisa | Nizak | formatPercent za SQL brojeve/stringove, 42. frontend test i ispravan naziv posljednjih 10 evidencija; UI 60,0% |
| Neuspjeli mark-read lokalno označavao pročitano; disable push blokiran uz isključenu server konfiguraciju | Nizak | Read stanje tek nakon uspješnog zahtjeva; već postojeća pretplata može se isključiti nezavisno od mogućnosti nove pretplate. Fizička provjera push postavki ostaje u fazi F. |

## Uputstva i slike

- [PDF za efendiju - 8 stranica](../output/pdf/Uputstvo-za-efendiju.pdf): admin uloga, prijava, učenici/ključevi, prisustvo i greške, više razgovora, nacrti, citiranje/uređivanje, dnevni komentari, novosti/slike, obavijesti, profil i dnevna rutina.
- [PDF za roditelje - 2 stranice](../output/pdf/Kratko-uputstvo-za-roditelje.pdf): registracija, ključ, prisustvo, chat, obavijesti, Android/iPhone, odjava i pomoć.
- Originalni snimci: [images/efendija](images/efendija) i [images/roditelji](images/roditelji). Svi podaci su izmišljeni. PDF izvor: [generate_manuals.py](generate_manuals.py).
- Renderovani su svi finalni listovi, provjereni rubovi/slike/tekst i bosanska slova. Nisu prikazane stvarne lozinke, tokeni niti privatni učenički podaci.

## Šta još treba prije stvarne upotrebe

1. Na HTTPS testnom hostingu provjeriti stvarne cookie zastavice/putanju, CORS/CSRF, reverse proxy WebSocket i produkcijsku konfiguraciju baze/migracija/VAPID-a. Stvarni admin računi pripremaju se odvojeno.
2. Android: omogućiti obavijesti, zatvoriti aplikaciju i zaključati telefon; s drugog računa poslati poruku. Provjeriti dostavu, opći sadržaj, dodir i tačan razgovor, odjavu i prekid veze s djetetom.
3. iPhone/iPad: dodavanje na Home Screen, pokretanje preko ikone i dozvola, zatim isti test. Provjeriti i odbijenu dozvolu, ponovno uključivanje te postavke Focus/baterije.
4. Na stvarnom telefonu provjeriti virtualnu tastaturu, scroll, orijentaciju i reconnect poslije gubitka mreže; dodatno Safari/Chrome i čitač ekrana. Viewport simulacija ove detalje ne potvrđuje.
5. Uspostaviti automatsku zaštićenu kopiju baze, upload slika i konfiguracije te probu oporavka na odabranom hostingu. Lokalna proba baze nije dokaz da hosting backup radi.
6. Po potrebi optimizovati veličinu frontend paketa i ponovo izmjeriti učitavanje na sporijem telefonu. Trenutno upozorenje ne sprečava build.

## Završna ocjena i čišćenje

Za provjerene lokalne scenarije nema otvorenih potvrđenih kritičnih grešaka; popravljene su stvarne greške podataka i povratnih informacija u UI-ju. Projekat je spreman za kontrolisanu probu na HTTPS testnom hostingu. Nije potvrđena potpuna produkcijska spremnost niti stvarna push dostava na zatvoren telefon.

Privremeni preview i Vite su ugašeni. Prije gašenja MySQL-a ponovo su provjereni marker, stvarni datadir i port; preostale su samo sistemske baze. Izolovana instanca je uredno ugašena i njen direktorij uklonjen. Potvrđeno je da portovi 49404, 5507 i 5177 više nemaju listenere, a postojeći servis MySQL80 ostaje Running. Testni browser tab je zatvoren i viewport vraćen na podrazumijevani. Dokazi i PDF-ovi ostaju u repozitoriju. Nema objave na hosting niti promjene produkcijske baze.
