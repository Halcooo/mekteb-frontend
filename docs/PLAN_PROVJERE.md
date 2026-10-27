# Plan provjere funkcionalnosti i izrade uputstava

Datum plana: **27.10.2026.**
Status: **lokalna provjera izvršena; rezultati i ispravke su u evidenciji; faza F na fizičkim telefonima čeka HTTPS okruženje i uređaje**.

Cilj je proći sve postojeće funkcionalnosti od korisničkog ekrana do baze, ispraviti potvrđene greške i iz provjerenih koraka napraviti slikovna uputstva. Raniji testovi i pregledi su polazna osnova, a ne dokaz da je svaka stavka ovog plana već prošla. Rezultati ove runde vodit će se u [evidenciji provjere](REZULTATI_PROVJERE.md).

## 1. Dogovorene uloge

Efendija obavlja svakodnevni rad koristeći **administratorski račun**. Vlasnik projekta ima **drugi, zaseban administratorski račun**. Postojeća implementacija podržava više administratora; posebna uloga `superadmin` nije implementirana. U ovoj fazi zadržavamo postojeće ovlasti.

| Korisnik / uloga | Šta se provjerava |
|---|---|
| Efendija — `admin` | Svi učenici i razgovori, evidencija prisustva, novosti i slike, uređivanje učenika, povezivanje roditelja i moderiranje poruka. |
| Vlasnik — drugi `admin` | Isti pristup učenicima, prisustvu, novostima i razgovorima, uz odvojen račun i sesije. Provjeriti istovremeni rad s efendijom. |
| Dodatni učitelj — `teacher` | Postojeći pristup učenicima i svim razgovorima; uređivanje vlastitih poruka. Unos prisustva i uređivanje novosti trenutno nisu dopušteni ovoj ulozi. |
| Roditelj — `parent` | Povezivanje vlastite djece ključem, njihovo prisustvo i razgovori, vlastiti profil i obavijesti. |
| Stari roditeljski račun — `user` | Provjeriti kompatibilnost s istim ograničenjima pristupa djeci kao za roditelja. |
| Posjetilac | Javne novosti i slike te prijava/registracija; za ostalo je potrebna prijava. |

Administratorski pristup svim razgovorima ne znači pristup tuđim lozinkama, sesijama ili ličnom sandučiću obavijesti. Ti podaci ostaju vezani za vlasnika računa. Računi za stvarnu upotrebu pripremaju se zasebno preko postojećeg administrativnog postupka, s različitim korisničkim imenima i email adresama.

## 2. Redoslijed rada

| Faza | Rad | Rezultat prije prelaska dalje |
|---|---|---|
| A — početno stanje | Zabilježiti verzije, stanje izvornog koda, migracije i postojeće testove; pokrenuti osnovne provjere. | Ponovljiva početna osnova i popis eventualnih početnih grešaka. |
| B — izolovano okruženje | Pripremiti posebnu testnu MySQL instancu, izmišljene račune, učenike, prisustvo, novosti i razgovore. | Potvrđeni testni port i putanja baze; aplikacija koristi isključivo testne podatke. |
| C — korisnički tokovi | Proći matricu iz odjeljka 4 kroz ekran, API i trajno spremljene podatke. Istovremeno prikupljati slike i korake za uputstva. | Za svaki scenario evidentiran očekivani i stvarni rezultat. |
| D — greške i ponovna provjera | Potvrditi uzrok svake greške, ispraviti je, ponoviti pogođene scenarije i povezane provjere. | Dokaz da je greška otklonjena; uputstva i slike odgovaraju konačnom ponašanju. |
| E — uputstva i završni pregled | Složiti detaljno uputstvo za efendiju/učitelja i kratko za roditelje; provjeriti svaki korak s odgovarajućim računom. | Uputstva sa stvarnim slikama provjerenog interfejsa, README i završni izvještaj. |
| F — provjera na HTTPS okruženju i telefonima | Provjeriti stvarne kolačiće, proxy, WebSocket, instalaciju aplikacije i push na Androidu i iPhoneu. | Zasebno zabilježena stvarna dostava ili konkretan razlog zašto nije potvrđena. |

Izrada plana ne mijenja hosting ni postojeću bazu. Lokalna provjera ne zamjenjuje fazu F. Ako za stvarne telefone ili HTTPS okruženje nedostaje pristup, ta se provjera označava kao neizvršena, uz navedeni razlog.

## 3. Testni podaci i okruženja

- Odvojeni računi: efendija-admin, vlasnik-admin, učitelj, roditelj A, roditelj B i stari roditeljski račun.
- Najmanje 120 izmišljenih učenika u više razreda, radi provjere stranica u listama i razgovorima. Uključiti duga imena, č/ć/š/đ/ž, prestupnu godinu i učenika bez roditeljske veze.
- Roditelj s više djece, dva roditelja povezana s istim djetetom i dijete koje pripada samo drugom roditelju.
- Razgovori bez poruka, s nepročitanim porukama, s više od 100 poruka, odgovorima, izmjenama i obrisanim porukama. Za učitelja/efendiju otvoriti 15–20 razgovora.
- Prisustvo s različitim statusima, više datuma i danom bez zapisa. Novosti bez slika, s jednom slikom i s više slika.
- Desktop, tablet i mobilni prikazi, uključujući širine 360, 390 i 430 px; bosanski i engleski interfejs. Za završnu fazu i fizički Android/iPhone.
- Namjerno izazvani gubitak veze, istek sesije, prekid WebSocketa i greška pri spremanju. Duge rokove isteka simulirati kontrolisanim testnim podacima/vremenom.

Sve izmjene i brisanja u lokalnim scenarijima rade se nad izmišljenim podacima. Testovi slanja koriste zamjenski push transport do zasebnog testa na vlastitim testnim uređajima. Slike za uputstva ne sadrže stvarne podatke djece, lozinke, tokene ni privatnu konfiguraciju.

## 4. Matrica funkcionalnosti

Svaki red je grupa scenarija. Pri izvršavanju se pojedinačni slučajevi označavaju nastavkom, npr. `CHAT-02.1`. Negativne scenarije provjeriti i direktnim API zahtjevom, ne samo skrivenim dugmetom.

| ID | Funkcionalnost i scenariji | Očekivani rezultat / dokaz |
|---|---|---|
| AUTH-01 | Registracija; prazna polja, email, duplikati, dužina lozinke i znakovi s kvačicama; pokušaj slanja administratorske uloge. | Ispravna registracija daje roditeljski račun; neispravni zahtjevi ne stvaraju korisnika niti povišene ovlasti. |
| AUTH-02 | Prijava, pogrešni podaci, odjava, ponovno otvaranje aplikacije i direktan link do razgovora. | Tačan račun i odredište; nakon odjave privatni podaci nisu dostupni. |
| AUTH-03 | Obnova prijave nakon osvježavanja stranice; istek pristupnog tokena; rotacija i ponovno korištenje potrošenog refresh podatka; apsolutni istek sesije. | Prijava se pravilno obnavlja ili traži novu prijavu; opozvana sesija se ne vraća. |
| AUTH-04 | Dva taba, dva različita računa, spori odgovori, odjava bez mreže i ponovni pokušaj; odjava svih uređaja. | Nema miješanja podataka računa niti lažne potvrde neuspješne odjave. |
| ACL-01 | Svaka stranica i zaštićena API operacija za sve uloge; pristup tuđem djetetu, profilu, poruci, obavijesti i sesiji. | Ovlasti iz odjeljka 1 provode se na serveru. Roditelj ne dobija tuđe podatke ni pozivne ključeve. |
| ADM-01 | Dva administratora istovremeno otvaraju sve učenike i razgovore; vlasnik vidi učenika i poruku koje je dodao efendija. | Oba računa imaju dogovoreni pristup, odvojene sesije i vlastite obavijesti. Provjeriti i kako se prikazuju konkurentne izmjene. |
| PROF-01 | Pregled profila, izmjena imena/prezimena, odustajanje, prazne vrijednosti i greška spremanja. | Sačuvani podaci odgovaraju prikazu; email, uloga i lozinka ne mogu se promijeniti kroz obrazac imena. |
| STU-01 | Lista učenika, pretraga s kvačicama, prazni rezultati, više stranica i pretraga nakon zadnje stranice. | Tačni učenici, brojevi i stranice, bez preskočenih ili ponovljenih rezultata. |
| STU-02 | Dodavanje, uređivanje i brisanje testnog učenika; odustajanje; neispravni datumi, obavezna polja i razred. | Promjene ostaju nakon ponovnog učitavanja; neuspjeh se jasno prikazuje. Provjeriti posljedice brisanja na povezane podatke. |
| STU-03 | Generisani roditeljski ključ, kopiranje, odbijen pristup clipboardu i povezivanje roditelja tim ključem. | Ključ odgovara pravom učeniku, a uspjeh kopiranja se prikazuje samo kad uspije. Provjeriti razliku između starog `parentId` polja i veze u `parent_students`. |
| PAR-01 | Prvo povezivanje djeteta, više djece, dva roditelja istog djeteta, pogrešan/ponovljen ključ i prekid veze. | Tačne veze bez duplikata; nakon prekida veze prestaje pristup odgovarajućem razgovoru, evidenciji i obavijestima. |
| PAR-02 | Roditeljski pregled prisustva, zbirni pokazatelji, posljednji zapisi, prazno stanje i nedostupna mreža. | Podaci odgovaraju stvarno spremljenom prisustvu isključivo povezane djece. |
| ATT-01 | Efendija/admin bira datum, mijenja svaki status, brzo mijenja status više puta i ponovo učitava stranicu. | Posljednje uspješno spremljeno stanje ostaje; nema duplog zapisa za učenika i datum. Neuspješno spremanje se ne predstavlja kao uspješno. |
| ATT-02 | Dnevni i razredni sažeci, statistika učenika, dan bez evidencije i izmjena ranijeg dana; masovni unos i brisanje kroz postojeći API. | Brojevi i procenti imaju provjerljiv obračun. Razlikovati neuneseno stanje od stvarno zabilježenog odsustva. |
| NOTE-01 | Dnevne bilješke iz prisustva, prikaz starijih komentara, odgovori i njihov odnos s novim chatom. | Ista poruka ima dosljedan sadržaj, učenika i datum kroz oba prikaza; nema dupliranja obavijesti. |
| NEWS-01 | Javne novosti, učitavanje narednih objava, prazno stanje, duži tekst i galerija. | Objave i slike rade i bez prijave, na lokalnom/testnom URL-u i bez oslanjanja na pogrešan fiksni produkcijski URL. |
| NEWS-02 | Administrator dodaje, uređuje i briše novost/sliku; odustaje; bira previše slika, preveliku ili nedopuštenu datoteku; prekid uploada. | Ovlasti, granice i poruke su dosljedne na ekranu i serveru. Nema neprimijećenog djelimičnog spremanja ili preostalih datoteka. |
| CHAT-01 | Pretraga i filter nepročitanih, više od 50 razgovora i 15–20 otvorenih kartica; aktivan razgovor dok dolaze poruke drugdje. | Pregledna lista, tačni brojevi i stabilan izbor; svaki razgovor čuva svoj nacrt. Provjeriti zatvaranje kartice i povratak s mobilnog razgovora na listu. |
| CHAT-02 | Obje strane započinju razgovor; slanje dugmetom i Ctrl/Command+Enter; prazna/granična poruka; dvostruki klik i ponovni pokušaj poslije izgubljenog odgovora. | Jedna potvrđena poruka po pokušaju s istim identifikatorom; jasan status kad dostava nije potvrđena; nema zamjene učenika ili autora. |
| CHAT-03 | Starije stranice historije, citirani odgovori, odgovor na raniji datum i otvaranje konkretne poruke iz obavijesti. | Tačan redoslijed bez duplikata i preskakanja; citat ostaje u istom razgovoru i originalnom datumu. |
| CHAT-04 | Uređivanje vlastite poruke, odustajanje, brisanje poruke s odgovorima i administratorska moderacija. | Prava autora/administratora su tačna; obrisani tekst se ne vraća kroz API, citat ili obavijest; odgovori ostaju. |
| CHAT-05 | Oznake nepročitanih, skrol dalje od dna, skriven tab, novi dolazni tekst, prekid i ponovna veza WebSocketa. | Čitanje prati učitani/vidljivi raspon, brojevi se usklađuju i rezervno osvježavanje radi. Nema izmišljenih oznaka online/pročitano od druge osobe. |
| NOT-01 | Zvono, lista, filter, jedna/sve pročitane obavijesti, greška API-ja i otvaranje obrisane ili tuđe obavijesti. | Tačan lični sandučić, broj i odredište; neuspjela promjena ima vidljiv oporavak. |
| PUSH-01 | Uključivanje/isključivanje na uređaju, odbijena dozvola, nepodržan preglednik, nedostupna konfiguracija i BS/EN jezik. | Dozvola se traži svjesnom radnjom; postavke i jezik odgovaraju prikazu; obavijest je bez podataka djeteta i sadržaja razgovora. |
| PUSH-02 | Transakcija poruka–obavijest–red; greške dostave, ponovni pokušaji, istek, dva radnika, prestala pretplata i opozvana sesija. | Nema izgubljenog ili pogrešno adresiranog posla. Provjeriti da pročitana/obrisana poruka i prekinuta roditeljska veza zaustavljaju čekajuću dostavu. |
| PUSH-03 | Android i iPhone: aplikacija otvorena/zatvorena, zaključan ekran, dodir obavijesti, odjava i drugi račun. | Fizički potvrđena dostava i otvaranje pravog razgovora na HTTPS okruženju; rezultat se vodi odvojeno od simuliranih testova. |
| API-01 | Preostale API rute: pretrage/statistike učenika, filteri prisustva/komentara, lista korisnika za admina, vlastite sesije, zdravstvena provjera i slike. | Svaka registrovana ruta mapirana je na pozitivan/negativan slučaj; nepostojeći ID, loš upit i nedostupna baza imaju primjeren odgovor. |
| UX-01 | BS/EN, poruke uspjeha/greške, množine, datumi, rođendani, prestupne godine i promjena vremenske zone. | Datumi svuda `27.10.2026.`, vrijeme `14:30`, i na engleskom. Nema sirovih ključeva prevoda, pomjerenog dana ili nevažećeg datuma. |
| UX-02 | Desktop, tablet, mali telefon, rotacija, duža imena, tastatura i fokus, modal, skrol i povećan tekst. | Važne radnje i polje za poruku ostaju dostupni; nema slučajnog horizontalnog skrola ili skrivenih kontrola. |
| OPS-01 | Čista baza, postojeća shema, migracije do 006, ponovno pokretanje, neuspjela migracija, obnova testne kopije i gašenje servisa. | Trajni podaci ostaju; status sheme je jasan; postupak oporavka je provjeren. Pregledati konfiguraciju hostinga, backup, upload direktorij i čišćenje starih redova. |

Svaku UI radnju uporediti s odgovorom API-ja i spremljenim podacima gdje je to potrebno. Za rute bez korisničkog ekrana rezultat se označava kao API provjera; ne navode se kao dostupne radnje u uputstvu.

## 5. Automatizovane provjere

Na početku nove runde, poslije potvrđenih ispravki i prije završne predaje koristiti postojeće komande u odgovarajućem repozitoriju:

| Repozitorij | Komande | Šta potvrđuju |
|---|---|---|
| Backend | `npm run typecheck`, `npm test`, `npm run build` | Tipovi, postojeće provjere autentifikacije/ovlasti/migracija/chata/pusha i kompilacija. |
| Backend, odvojena testna MySQL instanca | `npm run test:integration` uz propisane testne varijable i oznaku instance | Stvarne SQL transakcije, migracije, sesije i red dostave. |
| Frontend | `npm test`, `npm run lint`, `npm run build` | Sesije, chat, servisni radnik, prevodi, datumi, stil koda i kompilacija. |

Ponavljati pogođene provjere nakon izmjene. Nova testiranja pisati za potvrđene greške i važne rubne slučajeve. Ručni scenariji i testovi s pravim telefonima imaju zasebne rezultate: zeleni automatizovani testovi sami ne zatvaraju cijelu matricu.

## 6. Kako nastaju slike i uputstva

Tok rada je: **provjeri korak → zapiši stvarni rezultat → snimi čisti ekran → napiši uputu → ponovi s odgovarajućom ulogom**. Kad se interfejs promijeni tokom popravke, zamijeniti povezane slike i korake.

Slike čuvati u dokumentacijskom direktoriju, organizovane po ulozi i oznaci scenarija, uz kratak opis radnje. Zabilježiti verziju aplikacije, datum, veličinu prikaza i testni račun/ulogu bez lozinke. Koristiti stvarne snimke aplikacije s izmišljenim podacima. Postojeće slike iz prethodnog pregleda služe kao referenca dok nisu potvrđene u ovoj rundi.

Za svaki glavni tok snimiti početni ekran, ključnu radnju i vidljiv uspjeh. Za greške snimiti problem i provjereni način oporavka. Tokom rada u chatu pokazivati reprezentativne slike i nalaze; sve preostale slike organizovati uz uputstva.

### Detaljno uputstvo za efendiju / učitelja

Primarno uputstvo odnosi se na efendiju koji koristi `admin` račun. Isti koraci odgovaraju vlasnikovom administratorskom računu.

1. Prijava, odjava i osnovna navigacija na računaru i telefonu.
2. Učenici: pronalaženje, dodavanje, izmjena, roditeljski ključ i objašnjenje posljedica brisanja.
3. Prisustvo: izbor datuma, statusi, spremanje, pregled sažetka i ispravka ranijeg unosa.
4. Razgovori: lista i nepročitani, više otvorenih razgovora, nacrti, slanje, citiranje, uređivanje i brisanje.
5. Dnevne bilješke i odnos s razgovorom o učeniku.
6. Novosti i slike: objava, pregled, izmjena i brisanje.
7. Obavijesti u aplikaciji i uključivanje obavijesti na telefonu.
8. Profil, odjava svih uređaja i postupak kad nema veze ili spremanje nije potvrđeno.
9. Kratka rutina prije i poslije nastave, sastavljena iz provjerenih radnji.

Na početku jasno navesti ulogu računa. Ako se vodič koristi za dodatnog korisnika s ulogom `teacher`, posebno označiti njegova ograničenja; naziv zanimanja „učitelj“ sam po sebi ne daje administratorske ovlasti.

### Kratko uputstvo za roditelje

Cilj je **1–2 stranice**, sa nekoliko jasnih slika i kratkim koracima:

1. Registracija/prijava i povezivanje djeteta ključem koji daje efendija.
2. Pregled vlastite djece i njihovog prisustva.
3. Otvaranje razgovora, slanje poruke i odgovaranje.
4. Zvono i obavijesti na telefonu, s kratkom zasebnom napomenom za Android i iPhone.
5. Profil, odjava i kome se obratiti ako ključ ili prijava ne rade.

Uputstva su pripremljena na bosanskom, s nazivima dugmadi iz aplikacije: detaljni PDF za efendiju (8 stranica) i kratki PDF za roditelje (2 stranice). Na naknadni zahtjev korisnika isporuka je PDF. Ne navoditi nedostupne mogućnosti poput obnove lozinke ili slanja priloga u chatu kao da postoje.

## 7. Evidencija grešaka i kriterij završetka

Statusi su: **nije započeto**, **u toku**, **prošlo**, **greška**, **čeka uslov** i **nije primjenjivo**. Uz „čeka uslov“ navesti šta nedostaje, npr. stvarni iPhone ili HTTPS testno okruženje.

Svaki nalaz sadrži oznaku scenarija, ulogu, korake, očekivani/stvarni rezultat, ozbiljnost, sliku ili testni dokaz i rezultat ponovne provjere. Otvoreni problem se ne označava riješenim samo zato što je opisan u README-u.

Provjera je spremna za predaju kada:

- Svaka grupa ima izvršene slučajeve ili jasan razlog neizvršavanja; postoji popis preostalih ograničenja.
- Nema otvorene kritične greške u pristupu podacima, trajnom spremanju, prijavi ili pogrešnom adresiranju poruka.
- Potvrđene ispravke su ponovo provjerene; relevantni testovi, lint, tipovi i build prolaze.
- Dva administratorska računa imaju dogovoreni pristup, a roditelji vide samo povezanu djecu.
- Oba uputstva su prošla provjeru korak po korak i imaju ažurne, čitljive slike.
- README opisuje stvarno stanje i pokretanje; privremeno okruženje i izmišljeni podaci su očišćeni, a potrebni dokazi sačuvani.
- Stvarna push dostava ima vlastiti rezultat. Bez faze F ne tvrdi se da je zatvorena aplikacija na fizičkom telefonu potpuno provjerena.
