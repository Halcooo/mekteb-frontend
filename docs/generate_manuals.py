"""Build the two illustrated manuals from verified local QA screenshots.

Requires reportlab and Pillow. Run from any directory; outputs are in output/pdf.
Screenshots remain unchanged; crops are applied only to the PDF layout.
"""
from pathlib import Path
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf'
OUT.mkdir(parents=True, exist_ok=True)
FONT = Path('C:/Windows/Fonts')
pdfmetrics.registerFont(TTFont('UI', str(FONT / 'segoeui.ttf')))
pdfmetrics.registerFont(TTFont('UIBold', str(FONT / 'segoeuib.ttf')))
pdfmetrics.registerFontFamily('UI', normal='UI', bold='UIBold')
W, H = A4
M, CW = 44, W - 88
GREEN, INK, MUTED = '#22694f', '#233d32', '#60766a'


class Manual:
    def __init__(self, filename, label, pages):
        self.c = canvas.Canvas(str(OUT / filename), pagesize=A4)
        self.c.setTitle(label)
        self.c.setAuthor('Mekteb E-dnevnik')
        self.label, self.pages, self.n = label, pages, 0

    def p(self, text, y, x=M, w=CW, size=10.5, color=INK, bold=False, leading=None):
        style = ParagraphStyle('body', fontName='UIBold' if bold else 'UI', fontSize=size,
                               leading=leading or size * 1.45, textColor=colors.HexColor(color))
        para = Paragraph(text, style)
        _, height = para.wrap(w, H)
        if y < H-45 and y + height > H - 47:
            raise ValueError(f'Text overflow on page {self.n}: {text[:80]}')
        para.drawOn(self.c, x, H-y-height)
        return y + height

    def page(self, title, subtitle, section):
        if self.n:
            self.c.showPage()
        self.n += 1
        c = self.c
        c.setFillColor(colors.HexColor(GREEN))
        c.rect(0, H-8, W, 8, fill=1, stroke=0)
        self.p('MEKTEB PAZARIĆ  /  E-DNEVNIK', 27, size=8, color=GREEN, bold=True)
        self.p(section.upper(), 27, x=365, w=186, size=8, color=MUTED)
        self.p(title, 58, size=25, bold=True, leading=29)
        self.p(subtitle, 94, size=10, color=MUTED)
        c.setStrokeColor(colors.HexColor('#dbe7df'))
        c.line(M, 43, W-M, 43)
        self.p('27.10.2026.  •  Slike s izmišljenim testnim podacima', H-34, size=7.5, color=MUTED)
        self.p(f'{self.n} / {self.pages}', H-34, x=W-79, w=40, size=8, color=MUTED)

    def heading(self, text, y, x=M, w=CW):
        return self.p(text, y, x, w, size=13, color=GREEN, bold=True) + 7

    def step(self, number, title, body, y, x=M, w=CW, size=10.5):
        end = self.p(f'<b>{number}. {title}</b><br/>{body}', y, x, w, size=size)
        return end + 11

    def box(self, text, y, x=M, w=CW, size=10):
        style = ParagraphStyle('box', fontName='UI', fontSize=size, leading=size*1.45,
                               textColor=colors.HexColor(INK))
        para = Paragraph(text, style)
        _, ht = para.wrap(w-24, H)
        if y+ht+24 > H-47:
            raise ValueError(f'Box overflow page {self.n}')
        self.c.setFillColor(colors.HexColor('#edf5ef'))
        self.c.roundRect(x, H-y-ht-24, w, ht+24, 9, fill=1, stroke=0)
        para.drawOn(self.c, x+12, H-y-ht-12)
        return y+ht+36

    def shot(self, name, y, w=CW, x=M, crop=None, caption=None):
        im = Image.open(ROOT/'docs'/'images'/name).convert('RGB')
        if crop:
            im = im.crop(crop)
        ht = w*im.height/im.width
        if y+ht > H-55:
            raise ValueError(f'Image overflow page {self.n}: {name}')
        self.c.setStrokeColor(colors.HexColor('#d6e2da'))
        self.c.setLineWidth(.6)
        self.c.rect(x-1, H-y-ht-1, w+2, ht+2, fill=0, stroke=1)
        self.c.drawImage(ImageReader(im), x, H-y-ht, width=w, height=ht)
        end = y+ht+7
        if caption:
            end = self.p(caption, end, x, w, size=8, color=MUTED)+10
        return end

    def finish(self):
        assert self.n == self.pages, (self.n, self.pages)
        self.c.save()


def teacher():
    d = Manual('Uputstvo-za-efendiju.pdf', 'Uputstvo za efendiju - Mekteb E-dnevnik', 8)
    d.page('Uputstvo za efendiju', 'Svakodnevni rad s administratorskim računom', '01 / Početak')
    y = d.box('Efendija i vlasnik koriste <b>dva odvojena admin računa</b>. Oba vide sve učenike i razgovore. Svaki račun ima svoje prijave i obavijesti.', 131)
    left, right = 238, 244
    y1 = d.heading('Prijava i meni', y)
    y1 = d.step(1, 'Otvorite aplikaciju', 'Koristite adresu koju vam je dao vlasnik projekta. Izaberite <b>Prijava</b>.', y1, w=left)
    y1 = d.step(2, 'Unesite svoje podatke', 'Upišite korisničko ime i lozinku, pa pritisnite <b>Prijavi se</b>. Registracija služi roditeljima; admin račun priprema vlasnik.', y1, w=left)
    y1 = d.step(3, 'Izaberite radnju', '<b>Učenici</b>: podaci i ključevi.<br/><b>Prisustvo</b>: dnevna evidencija.<br/><b>Poruke</b>: svi razgovori.<br/><b>Početna</b>: javne novosti.', y1, w=left)
    d.shot('efendija/01-prijava.png', y+20, w=right, x=307, crop=(450,240,900,715), caption='Prijavljujete se svojim računom, bez dijeljenja lozinke.')
    y = max(y1, y+320)+18
    y = d.heading('Na telefonu', y)
    y = d.p('Tri vodoravne crte otvaraju meni. Zvono prikazuje obavijesti, BS/EN mijenja jezik, a kružić s inicijalima otvara profil i odjavu. Datumi ostaju u obliku <b>27.10.2026.</b>', y)
    d.box('Ovo uputstvo prati provjerenu lokalnu verziju od 27.10.2026. Prikazana imena, ključevi i objave služe obuci. Ne koriste se za stvarnu prijavu. Dodatni korisnik s ulogom <b>teacher</b> ima učenike i razgovore; nema unos prisustva ni uređivanje novosti.', y+18)

    d.page('Učenici i roditeljski ključevi', 'Unos učenika i povezivanje porodice', '02 / Učenici')
    y = d.shot('efendija/02-ucenici-kljuc.png', 133, crop=(90,100,1270,485), caption='Pretraga izdvaja učenika; u redu su datum rođenja, razred, ključ i povezani roditelji.')
    y = d.step(1, 'Pronađite ili dodajte učenika', 'U meniju <b>Učenici</b> pretražite ime, prezime ili razred. Ako učenik još nije unesen, izaberite <b>Dodaj učenika</b>.', y)
    y = d.step(2, 'Popunite obavezna polja', 'Unesite ime, prezime, datum rođenja i razred. U kalendaru koristite strelice za mjesec/godinu, pa izaberite dan. Pritisnite <b>Stvori učenika</b>.', y)
    yi = y+3
    d.shot('efendija/03-novi-ucenik.png', yi, w=252, crop=(420,20,940,440))
    yy = d.heading('Ključ za roditelje', yi+2, x=314, w=237)
    yy = d.p('Kliknite ključ uz učenika da ga kopirate. Dostavite ga odgovarajućem roditelju privatnim putem. Roditelj ga unosi u svoj panel.', yy, x=314, w=237)
    yy = d.p('Više roditelja može povezati isto dijete. Polje <b>Ime roditelja</b> prikazuje povezane osobe. Broj roditelja se ne upisuje ručno.', yy+12, x=314, w=237)
    y = max(yy, yi+211)+18
    d.box('<b>Ispravke:</b> koristite <b>Uredi</b>, zatim sačuvajte. Za promjenu razreda uređujte postojeći zapis. <b>Obriši</b> uklanja učenika i povezanu evidenciju; prije potvrde provjerite ime i potrebu za brisanjem.', y)

    d.page('Evidencija prisustva', 'Prvo datum, zatim učenik i njegov status', '03 / Prisustvo')
    y = d.shot('efendija/04-prisustvo.png', 132, crop=(90,95,1250,680), caption='Dnevni sažetak obuhvata sve učenike, uključujući one bez unesene evidencije.')
    y = d.step(1, 'Provjerite odabrani datum', 'Otvorite <b>Prisustvo</b>. Datum na vrhu određuje dan koji mijenjate. Po potrebi pronađite učenika pretragom.', y)
    y = d.step(2, 'Izaberite stvarni status', '<b>Prisutan</b> - pohađa nastavu; <b>Odsutan</b> - izostao; <b>Kasni</b> - došao sa zakašnjenjem; <b>Opravdano</b> - opravdan izostanak. Promjena se automatski sprema; sačekajte završetak prije nove izmjene.', y)
    y = d.box('<b>Nije uneseno</b> znači da evidencija za taj dan ne postoji. To nije odsustvo. Dnevna stopa računa prisutne i zakašnjele prema ukupnom broju učenika; roditeljska stopa koristi evidentirane dane tog djeteta.', y, size=9.5)
    y = d.shot('efendija/05-greska-spremanja.png', y, crop=(90,150,1250,250), caption='Crveno upozorenje znači da promjena nije potvrđena kao sačuvana.')
    d.p('Ako vidite grešku, provjerite vezu i pritisnite <b>Osvježi</b>. Provjerite prikazani status, pa ponovite izmjenu ako je potrebna. Ne računajte neuspjeli pokušaj kao unos.', y, size=10)

    d.page('Više otvorenih razgovora', 'Rad s mnogo učenika u jednom centru poruka', '04 / Razgovori')
    y = d.shot('efendija/06-razgovori.png', 133, caption='Provjeren rad s 20 otvorenih razgovora. Broj uz traku označava koliko je kartica otvoreno.')
    y = d.step(1, 'Pronađite učenika', 'Otvorite <b>Poruke</b>. Lijevo pretražujte učenike ili izaberite <b>Nepročitani</b>. Dugme <b>Učitaj još razgovora</b> prikazuje narednu stranicu.', y)
    y = d.step(2, 'Prebacujte se karticama', 'Otvaranje učenika dodaje karticu iznad razgovora. Aktivna kartica se dovodi u vidljivi dio trake. Ako ih ima mnogo, traku pomjerajte vodoravno.', y)
    y = d.step(3, 'Zatvorite ono što je završeno', 'Znak <b>×</b> uz ime zatvara samo karticu. Razgovor ostaje sačuvan i ponovo ga možete otvoriti iz liste.', y)
    d.box('<b>Nacrti:</b> nedovršeni tekst čuva se odvojeno za svakog učenika tokom prebacivanja razgovora u tom tabu preglednika. Nacrti se ne spremaju trajno; osvježavanje stranice ili odjava ih uklanja.', y, size=9.5)

    d.page('Slanje, odgovori i uređivanje', 'Provjerite ime učenika prije svake poruke', '05 / Poruke')
    y = d.shot('efendija/07-odgovor.png', 133, crop=(355,180,1340,875), w=432, x=81, caption='Odgovor citira odabranu poruku. Tekst u polju još nije poslan.')
    y = d.step(1, 'Napišite i pošaljite', 'Polje prima do <b>2000 znakova</b>. Kliknite <b>Pošalji</b> ili koristite <b>Ctrl + Enter</b>. Poslana poruka pojavljuje se u historiji. Kod greške ponovite slanje ponuđenim dugmetom.', y, size=10)
    y = d.step(2, 'Odgovorite ili ispravite', 'Meni <b>•••</b> uz poruku nudi <b>Odgovori</b>, <b>Uredi</b> i dostupno brisanje. Uređivanje završite sa <b>Sačuvaj</b>. Administrator može moderirati i tuđe poruke; roditelj uređuje samo svoje.', y, size=10)
    y = d.p('<b>Historija i dnevni komentari:</b> dugme <b>Učitaj starije poruke</b> dohvaća prethodnu historiju. <b>Dodaj komentar</b> na prisustvu otvara dnevni prikaz za učenika; u centru <b>Poruke</b> vidite razgovor kroz sve datume.', y, size=10)
    d.p('Razgovor vide osoblje i svi roditelji povezani s tim učenikom. Trenutna verzija podržava tekstualne poruke; prilaganje datoteka u chat nije dostupno.', y+10, size=9.5, color=MUTED)

    d.page('Novosti i slike', 'Objave s početne stranice dostupne su i posjetiocima', '06 / Objave')
    d.shot('efendija/08-novost.png', 137, w=278, crop=(425,20,940,855), caption='Forma za uređivanje postojeće novosti sa slikom.')
    y = d.step(1, 'Kreirajte novost', 'Na <b>Početnoj</b> izaberite <b>Dodaj novost</b>. Unesite naslov i sadržaj.', 140, x=344, w=207, size=10)
    y = d.step(2, 'Dodajte slike', 'Dozvoljeno je najviše <b>5 slika ukupno po objavi</b>, do <b>5 MB po slici</b>. Podržani su PNG, JPG/JPEG, GIF i WebP.', y, x=344, w=207, size=10)
    y = d.step(3, 'Sačuvajte i provjerite', 'Pritisnite <b>Sačuvaj</b>. Sačekajte zatvaranje forme, pa provjerite tekst i slike na kartici objave.', y, x=344, w=207, size=10)
    y = d.step(4, 'Naknadne ispravke', 'Dugme s olovkom otvara uređivanje. Uz postojeću sliku je dugme za uklanjanje; brisanje novosti ima posebnu potvrdu.', y, x=344, w=207, size=10)
    y = max(y, 625)
    y = d.box('<b>Ako slika ne prođe:</b> forma navodi da je tekst već sačuvan. Ponovite <b>Sačuvaj</b> u istoj formi; aplikacija koristi postojeću objavu i neće ponovo kreirati njen tekst.', y, size=9.5)
    d.p('Objavljujte sadržaj namijenjen javnosti. Privatne informacije o djetetu šaljite u razgovoru za tog učenika.', y, size=10)

    d.page('Obavijesti u aplikaciji i na telefonu', 'Postavke se uključuju na svakom uređaju posebno', '07 / Obavijesti')
    y = d.shot('efendija/09-obavijesti.png', 132, crop=(420,240,950,665), w=345, x=125, caption='Postavke se otvaraju iz Poruke → Postavke obavijesti ili iz profila.')
    y = d.step(1, 'Zvono u aplikaciji', 'Zvono otvara vaš sandučić. Nepročitane stavke imaju oznaku. Izaberite obavijest da otvorite odgovarajući razgovor. <b>Označi sve kao pročitano</b> vrijedi samo za vaš račun.', y)
    y = d.step(2, 'Android', 'Otvorite aplikaciju u podržanom pregledniku. Prijavite se, otvorite postavke obavijesti i pritisnite <b>Uključi obavijesti</b>. Dozvolite obavijesti u upitu preglednika.', y)
    y = d.step(3, 'iPhone ili iPad', 'U Safariju otvorite meni dijeljenja i izaberite <b>Add to Home Screen / Dodaj na početni ekran</b>. Ako postoji opcija <b>Open as Web App</b>, ostavite je uključenu. Otvorite aplikaciju preko nove ikone, prijavite se i uključite obavijesti. Potreban je iOS/iPadOS 16.4 ili noviji.', y)
    y = d.box('Za obavijesti izvan otvorene aplikacije trebaju HTTPS adresa, uključena serverska dostava, internet i dozvola uređaja. Na zaključanom ekranu prikazuje se opća obavijest bez sadržaja poruke i podataka djeteta. <b>Stvarna dostava na telefon čeka završnu probu na hostingu.</b>', y, size=9.2)
    d.p('Izvori za korake uređaja: <link href="https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios" color="#22694f">Apple: web aplikacija na početnom ekranu</link>; <link href="https://webkit.org/blog/13878/" color="#22694f">WebKit: Web Push od iOS 16.4</link>; <link href="https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API" color="#22694f">MDN: HTTPS i service worker</link>. Provjereno 27.10.2026.', y, size=7.5)

    d.page('Profil i svakodnevna rutina', 'Lični račun, uredna evidencija i provjera problema', '08 / Završetak rada')
    y = d.shot('efendija/10-profil.png', 132, crop=(185,100,840,780), w=270, caption='Profil s ličnim podacima i odjavom svih uređaja.')
    yy = d.heading('Profil i odjava', 137, x=340, w=211)
    yy = d.p('Otvorite inicijale → <b>Profil</b>. Možete promijeniti ime i prezime, pa sačuvati. Korisničko ime, email i uloga nisu polja za samostalnu izmjenu.', yy, x=340, w=211)
    yy = d.p('<b>Odjava</b> završava rad na trenutnom uređaju. <b>Odjavi sve uređaje</b> u profilu završava sve vaše prijave, uključujući ovu. Drugi administrator ostaje prijavljen svojim računom.', yy+14, x=340, w=211)
    yy = d.heading('Prije završetka dana', yy+23, x=340, w=211)
    yy = d.p('Provjerite datum prisustva i preostalo <b>Nije uneseno</b>. Pregledajte nepročitane razgovore. Provjerite javne objave nakon izmjene. Odjavite se na zajedničkom računaru.', yy, x=340, w=211)
    y = max(y, yy)+12
    y = d.heading('Ako nešto ne radi', y)
    y = d.p('Kod greške sačekajte oporavak veze i koristite <b>Pokušaj ponovo</b> ili <b>Osvježi</b>. Ako je sesija istekla, prijavite se ponovo. Kod neuspjele odjave pratite upozorenje i ponovite opoziv sesije kada se veza vrati.', y, size=10)
    d.box('Vlasniku projekta prijavite: ekran i radnju, datum/vrijeme, uređaj/preglednik te tačan tekst greške. Ne šaljite lozinku. Za izgubljenu lozinku ili administrativne promjene obratite se vlasniku; samostalni oporavak lozinke trenutno nije dostupan.', y+14, size=9.5)
    d.finish()


def parent():
    d = Manual('Kratko-uputstvo-za-roditelje.pdf', 'Kratko uputstvo za roditelje - Mekteb E-dnevnik', 2)
    d.page('Kratko uputstvo za roditelje', 'Prijava, djeca i pregled prisustva', '01 / Prvi koraci')
    y = d.box('Možete pratiti javne novosti, povezati svoju djecu, vidjeti njihovo prisustvo i razgovarati s efendijom. Pristup privatnim podacima dobijate povezivanjem preko ključa učenika.', 132, size=10)
    x2, col = 310, 241
    yl = d.step(1, 'Otvorite svoj račun', 'Na adresi aplikacije izaberite <b>Prijava</b>. Ako nemate račun, otvorite <b>Registrirajte se ovdje</b>. Unesite ime, prezime, email, korisničko ime i lozinku te potvrdu lozinke. Lozinka treba imati najmanje 12 znakova.', y, w=col, size=10)
    yl = d.step(2, 'Povežite dijete', 'Otvorite <b>Roditeljski panel</b>. Unesite ključ koji vam je dao efendija i pritisnite <b>Poveži</b>. Ponovite za svako dijete. Svoj račun zadržavate i kada povezujete više djece.', yl, w=col, size=10)
    yl = d.shot('roditelji/02-povezivanje.png', yl, w=col, crop=(8,90,382,355), caption='Primjer ključa služi obuci. Unesite ključ koji ste vi dobili.')
    d.box('Ako ključ ne radi, provjerite slova, brojeve i crtice. Za ispravan ključ obratite se efendiji. Nemojte unositi tuđi ključ niti ga javno dijeliti.', yl, w=col, size=9.5)
    yr = d.heading('3. Pogledajte prisustvo', y, x=x2, w=col)
    yr = d.p('U kartici djeteta izaberite <b>Pogledaj prisustvo</b>. Vidite sažetak i posljednjih 10 evidentiranih dolazaka/izostanaka. Roditelj ne mijenja evidenciju.', yr, x=x2, w=col, size=10)
    yr = d.shot('roditelji/03-prisustvo.png', yr+12, x=x2+24, w=193, crop=(0,0,390,802), caption='Datumi su dan.mjesec.godina. Stopa uključuje prisutne i zakašnjele evidentirane dane.')
    d.page('Poruke i obavijesti', 'Razgovor za svako dijete na jednom mjestu', '02 / Svakodnevno')
    y = d.p('Na telefonu otvorite meni s tri crte → <b>Poruke</b>. Izaberite dijete, napišite tekst i pritisnite <b>Pošalji</b>. Strelica gore lijevo vraća vas na listu razgovora.', 132, size=10)
    yi = y+14
    d.shot('roditelji/04-razgovor.png', yi, w=194, caption='Poruka je poslana tek kada se pojavi u historiji razgovora.')
    xx, ww = 264, 287
    yy = d.heading('Odgovori i ispravke', yi, x=xx, w=ww)
    yy = d.p('Meni <b>•••</b> uz poruku nudi odgovor na određenu poruku. Svoje poruke možete urediti ili obrisati. Razgovor vide osoblje i svi roditelji povezani s tim djetetom.', yy, x=xx, w=ww, size=10)
    yy = d.heading('Obavijesti', yy+13, x=xx, w=ww)
    yy = d.p('Zvono prikazuje obavijesti unutar aplikacije. Dodir obavijesti otvara razgovor. Za obavijesti kada je aplikacija zatvorena otvorite <b>Poruke → Postavke obavijesti</b> ili svoj profil.', yy, x=xx, w=ww, size=10)
    yy = d.shot('roditelji/07-postavke.png', yy+10, x=xx, w=ww, crop=(8,265,382,580))
    yy = d.p('<b>Android:</b> izaberite <b>Uključi obavijesti</b> i prihvatite dozvolu preglednika.<br/><b>iPhone/iPad:</b> Safari → dijeljenje → <b>Add to Home Screen</b>. Ostavite <b>Open as Web App</b> uključeno ako je ponuđeno. Otvorite preko nove ikone, prijavite se i uključite obavijesti. Potreban je iOS/iPadOS 16.4 ili noviji.', yy, x=xx, w=ww, size=9.5)
    y = max(yi+450, yy)+13
    y = d.box('<b>Ako obavijest ne stiže:</b> provjerite internet, dozvole obavijesti i postavke telefona. Potrebna je HTTPS aplikacija s uključenom dostavom; završna proba stvarne dostave na telefon još slijedi. Poruke i dalje možete provjeriti u aplikaciji.', y, size=9.2)
    y = d.p('<b>Siguran završetak:</b> u meniju s inicijalima izaberite <b>Odjava</b>, posebno na zajedničkom uređaju. Za lozinku, ključ ili problem s evidencijom obratite se efendiji. Ne šaljite lozinku.', y, size=9.5)
    d.p('Koraci za iPhone: <link href="https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios" color="#22694f">Apple upute za web aplikacije</link> i <link href="https://webkit.org/blog/13878/" color="#22694f">WebKit Web Push</link>, provjereno 27.10.2026.', y+8, size=7.5)
    d.finish()


if __name__ == '__main__':
    teacher()
    parent()
    print('Created 2 PDF manuals in', OUT)
