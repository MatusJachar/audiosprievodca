#!/usr/bin/env python3
"""Fix legends structure - create ONE stop with 4 sub-legends"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path
from datetime import datetime
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def fix_legends():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("=" * 70)
    print("FIXING LEGENDS STRUCTURE")
    print("=" * 70)
    
    # Delete old stops 14-17
    print("\nRemoving old legend stops 14-17...")
    result = await db.tour_stops.delete_many({"stop_number": {"$gte": 14}})
    print(f"  ✓ Deleted {result.deleted_count} stops")
    
    # Create new structure with sub-legends
    legends_stop = {
        "id": str(uuid.uuid4()),
        "stop_number": 14,
        "image_base64": None,
        "content": {
            "en": {
                "title": "Legends of Spiš Castle",
                "description": "The ancient walls of Spiš Castle hold many legends passed down through generations. Here are four of the most famous tales that bring the castle's rich history to life."
            },
            "pl": {
                "title": "Legendy zamku Spiskim",
                "description": "Starożytne mury zamku Spiskim kryją wiele legend przekazywanych z pokolenia na pokolenie. Oto cztery najbardziej znane opowieści, które ożywiają bogatą historię zamku."
            },
            "de": {
                "title": "Legenden der Zipser Burg",
                "description": "Die alten Mauern der Zipser Burg bergen viele Legenden, die über Generationen weitergegeben wurden. Hier sind vier der berühmtesten Geschichten, die die reiche Geschichte der Burg zum Leben erwecken."
            },
            "hu": {
                "title": "A Szepesi vár legendái",
                "description": "A Szepesi vár ősi falai sok legendát rejtenek, amelyeket generációkon át adtak tovább. Itt van négy leghíresebb mese, amelyek életre keltik a vár gazdag történelmét."
            },
            "sk": {
                "title": "Legendy Spišského hradu",
                "description": "Starobylé múry Spišského hradu uchovávajú mnoho legiend odovzdávaných z generácie na generáciu. Tu sú štyri najznámejšie príbehy, ktoré oživujú bohatú históriu hradu."
            },
            "ru": {
                "title": "Легенды Спишского Града",
                "description": "Древние стены Спишского Града хранят множество легенд, передаваемых из поколения в поколение. Вот четыре самых известных истории, которые оживляют богатую историю замка."
            }
        },
        "legends": [
            {
                "id": str(uuid.uuid4()),
                "order": 1,
                "content": {
                    "en": {
                        "title": "Legend of the Tatar Princess Šad",
                        "description": "In the troubled times of Béla IV, the Spiš Duke Koloman lived in Spiš Castle. In 1241, Tatar hordes broke through the Russian Gates in the Carpathians and invaded the kingdom. Koloman immediately went to help his royal brother Béla. The day of destruction came, and the Tatar Khan Sheyban camped with his army near Spiš. Watching the battle was his beautiful daughter Šad. During the conflict, Mikuláš, son of the Spiš count, captured the princess and brought her to the castle. A ransom was negotiated - the Tatars would leave Spiš in exchange for the princess's return. But Mikuláš and Šad fell in love. When she was freed, they escaped together back to Spiš. At their wedding, a Tatar arrow struck Šad in the heart - a wedding gift from her father, Khan Sheyban. Mikuláš buried her in Tatar clothing where they first met."
                    },
                    "pl": {
                        "title": "Legenda o tatarskiej księżniczce Šad",
                        "description": "W niespokojnych czasach Béli IV, książę Spiski Koloman mieszkał na zamku Spiskim. W 1241 roku tatarskie hordy przebiły się przez Bramy Ruskie w Karpatach i najechały królestwo. Koloman natychmiast udał się na pomoc swojemu królewskiemu bratu Béli. Nadszedł dzień zniszczenia, a tatarski chan Szejban rozbił obóz ze swoją armią w pobliżu Spisza. Obserwowała bitwę jego piękna córka Šad. Podczas konfliktu Mikuláš, syn hrabiego Spisskiego, schwytał księżniczkę i przywiózł ją na zamek. Wynegocjowano okup - Tatarzy opuszczą Spisz w zamian za zwrot księżniczki. Ale Mikuláš i Šad zakochali się w sobie. Kiedy została uwolniona, uciekli razem z powrotem do Spisza. Na ich weselu tatarska strzała ugodziła Šad w serce - prezent ślubny od jej ojca, chana Szeybana. Mikuláš pochował ją w tatarskim stroju tam, gdzie się po raz pierwszy spotkali."
                    },
                    "de": {
                        "title": "Legende von der Tatarenprinzessin Šad",
                        "description": "In den unruhigen Zeiten von Béla IV. lebte der Zipser Herzog Koloman auf der Zipser Burg. 1241 brachen tatarische Horden durch die Russischen Tore in den Karpaten ein und überfielen das Königreich. Koloman eilte sofort seinem königlichen Bruder Béla zu Hilfe. Der Tag der Zerstörung kam, und der tatarische Khan Sheyban schlug mit seiner Armee in der Nähe von Zips sein Lager auf. Seine schöne Tochter Šad beobachtete die Schlacht. Während des Konflikts nahm Mikuláš, der Sohn des Zipser Grafen, die Prinzessin gefangen und brachte sie zur Burg. Es wurde ein Lösegeld ausgehandelt - die Tataren würden Zips im Austausch für die Rückkehr der Prinzessin verlassen. Aber Mikuláš und Šad verliebten sich. Als sie befreit wurde, flohen sie zusammen zurück nach Zips. Bei ihrer Hochzeit traf ein tatarischer Pfeil Šad ins Herz - ein Hochzeitsgeschenk von ihrem Vater, Khan Sheyban. Mikuláš begrub sie in tatarischer Kleidung, wo sie sich zum ersten Mal trafen."
                    },
                    "hu": {
                        "title": "A tatár hercegnő, Šad legendája",
                        "description": "IV. Béla zaklatott idejében Koloman szepesi herceg a Szepesi várban élt. 1241-ben tatár hordák törtek át a Kárpátok orosz kapuin és megszállták az országot. Koloman azonnal testvére, Béla király segítségére sietett. Eljött a pusztulás napja, és Sejbán tatár kán hadseregével a Szepes közelében táborozott. Gyönyörű lánya, Šad figyelte a csatát. A konfliktus során Mikuláš, a szepesi gróf fia elfogta a hercegnőt és a várba vitte. Váltságdíjat tárgyaltak - a tatárok elhagyják Szepest a hercegnő visszaadása fejében. De Mikuláš és Šad egymásba szerettek. Amikor kiszabadult, együtt menekültek vissza Szepesbe. Esküvőjükön egy tatár nyíl Šad szívébe fúródott - nászajándék apjától, Sejbán kántól. Mikuláš tatár ruhában temette el ott, ahol először találkoztak."
                    },
                    "sk": {
                        "title": "Legenda o tatárskej princeznej Šad",
                        "description": "V nepokojných časoch Belu IV. žil na Spišskom hrade spišský vojvoda Koloman. V roku 1241 tatárske hordy prerazili cez Rusínsku bránu v Karpatoch a vpadli do krajiny. Koloman sa okamžite ponáhľal na pomoc svojmu kráľovskému bratovi Belovi. Prišiel deň skazy a tatársky chán Šejban sa utáboril so svojím vojskom neďaleko Spiša. Jeho krásna dcéra Šad sledovala bitku. Počas konfliktu Mikuláš, syn spišského grófa, zajal princeznú a priviedol ju na hrad. Vyjednali výkupné - Tatári opustia Spiš výmenou za návrat princeznej. Ale Mikuláš a Šad sa zaľúbili. Keď bola oslobodená, utiekli spolu späť na Spiš. Na ich svadbe tatársky šíp zasiahol Šad do srdca - svadobný dar od jej otca, chána Šejbana. Mikuláš ju pochoval v tatárskom odeve tam, kde sa prvýkrát stretli."
                    },
                    "ru": {
                        "title": "Легенда о татарской принцессе Шад",
                        "description": "В смутные времена Белы IV спишский герцог Коломан жил в Спишском Граде. В 1241 году татарские орды прорвали Русские ворота в Карпатах и вторглись в королевство. Коломан немедленно отправился на помощь своему королевскому брату Беле. Настал день разрушения, и татарский хан Шейбан разбил лагерь со своим войском близ Спиша. Его прекрасная дочь Шад наблюдала за битвой. Во время конфликта Микулаш, сын спишского графа, захватил принцессу и привёз её в замок. Был договорён выкуп - татары покинут Спиш в обмен на возвращение принцессы. Но Микулаш и Шад полюбили друг друга. Когда её освободили, они вместе бежали обратно в Спиш. На их свадьбе татарская стрела поразила Шад в сердце - свадебный подарок от её отца, хана Шейбана. Микулаш похоронил её в татарской одежде там, где они впервые встретились."
                    }
                },
                "audio": {}
            },
            {
                "id": str(uuid.uuid4()),
                "order": 2,
                "content": {
                    "en": {
                        "title": "Legend of Knight Šaršek",
                        "description": "In 1543, the castle owner Alexius Turzo died. A robber knight named Šaršek from Košice wanted to take advantage of the ownerless castle and capture it. He made a deal with part of the garrison to lower a rope at night so his men could climb up. But the soldiers betrayed him to the castle captain, who prepared for the robbers. When Šaršek was almost at the window, he realized his plan was discovered. A soldier cut the rope and Šaršek fell. During the fight, a fire broke out and the powder room exploded, destroying much of the castle. The garrison won, and the robbers were hanged. Spiš Castle again proved its reputation as a powerful and impregnable fortress."
                    },
                    "pl": {
                        "title": "Legenda o rycerzu Šaršeku",
                        "description": "W 1543 roku zmarł właściciel zamku Aleksy Turzo. Rycerz-rozbójnik o imieniu Šaršek z Koszyc chciał wykorzystać zamek bez właściciela i go zdobyć. Zawarł umowę z częścią garnizonu, aby w nocy spuścili linę, aby jego ludzie mogli wspiąć się na górę. Ale żołnierze zdradzili go kapitanowi zamku, który przygotował się na rozbójników. Kiedy Šaršek był prawie przy oknie, zdał sobie sprawę, że jego plan został odkryty. Żołnierz przeciął linę i Šaršek spadł. Podczas walki wybuchł pożar i eksplodowała komora prochowa, niszcząc znaczną część zamku. Garnizon zwyciężył, a rozbójnicy zostali powieszeni. Zamek Spiski ponownie udowodnił swoją reputację potężnej i nie do zdobycia twierdzy."
                    },
                    "de": {
                        "title": "Legende vom Ritter Šaršek",
                        "description": "1543 starb der Burgbesitzer Alexius Turzo. Ein Raubritter namens Šaršek aus Košice wollte die herrenlose Burg ausnutzen und erobern. Er vereinbarte mit einem Teil der Besatzung, nachts ein Seil herunterzulassen, damit seine Männer hinaufklettern konnten. Aber die Soldaten verrieten ihn dem Burghauptmann, der sich auf die Räuber vorbereitete. Als Šaršek fast am Fenster war, erkannte er, dass sein Plan entdeckt wurde. Ein Soldat schnitt das Seil durch und Šaršek fiel. Während des Kampfes brach ein Feuer aus und die Pulverkammer explodierte, wobei ein Großteil der Burg zerstört wurde. Die Besatzung gewann, und die Räuber wurden gehängt. Die Zipser Burg bewies erneut ihren Ruf als mächtige und uneinnehmbare Festung."
                    },
                    "hu": {
                        "title": "Šaršek lovag legendája",
                        "description": "1543-ban meghalt a vár tulajdonosa, Alexius Turzo. Egy Šaršek nevű haramiavitéz Kassáról ki akarta használni a gazda nélküli várat és elfoglalni azt. Megállapodott a helyőrség egy részével, hogy éjjel leeresztenek egy kötelet, hogy emberei felmászhassanak. De a katonák elárulták a várkapitánynak, aki felkészült a rablókra. Amikor Šaršek majdnem az ablaknál volt, rájött, hogy terve kiderült. Egy katona elvágta a kötelet és Šaršek lezuhant. A harc során tűz ütött ki és felrobbant a lőporraktár, elpusztítva a vár nagy részét. A helyőrség győzött, a rablókat pedig felakasztották. A Szepesi vár ismét bebizonyította hírnevét, mint hatalmas és bevehetetlen erőd."
                    },
                    "sk": {
                        "title": "Legenda o rytierovi Šaršekovi",
                        "description": "V roku 1543 zomrel majiteľ hradu Alexius Turzo. Zbojnícky rytier menom Šaršek z Košíc chcel využiť hrad bez majiteľa a dobyť ho. Dohodol sa s časťou posádky, že v noci spustia lano, aby jeho muži mohli vyliezť hore. Ale vojaci ho prezradili hradnému kapitánovi, ktorý sa na zbojníkov pripravil. Keď bol Šaršek takmer pri okne, zistil, že jeho plán bol odhalený. Vojak preťal lano a Šaršek spadol. Počas boja vypukol požiar a výbuchol prach, ktorý zničil veľkú časť hradu. Posádka zvíťazila a zbojníkov obesili. Spišský hrad opäť dokázal svoju povesť mocnej a nedobytnej pevnosti."
                    },
                    "ru": {
                        "title": "Легенда о рыцаре Шаршеке",
                        "description": "В 1543 году умер владелец замка Алексей Турзо. Рыцарь-разбойник по имени Шаршек из Кошиц хотел воспользоваться замком без хозяина и захватить его. Он договорился с частью гарнизона, что ночью спустят верёвку, чтобы его люди могли забраться наверх. Но солдаты выдали его капитану замка, который приготовился к грабителям. Когда Шаршек был почти у окна, он понял, что его план раскрыт. Солдат перерезал верёвку, и Шаршек упал. Во время боя вспыхнул пожар и взорвалась пороховая комната, разрушив большую часть замка. Гарнизон победил, а грабителей повесили. Спишский град снова доказал свою репутацию мощной и неприступной крепости."
                    }
                },
                "audio": {}
            },
            {
                "id": str(uuid.uuid4()),
                "order": 3,
                "content": {
                    "en": {
                        "title": "Legend of Beautiful Hedwig",
                        "description": "Long ago, the powerful lord Philip from the Brězovice family lived in Spiš Castle with his beautiful wife Louise and daughter Barborka. After Louise died, Philip devoted himself to his daughter and hunting. During a hunt, he accidentally shot a boy - the son of Polish nobleman Jursky, who swore revenge. While Philip was hunting, Jursky besieged the castle to kidnap Barborka. His plan involved sending a disguised minstrel who enchanted Philip's sister Hedwig, who was caring for Barborka. The minstrel opened a secret door, and the enemy kidnapped Barborka. When Philip returned and learned what happened, he blamed Hedwig, who had already gone mad with guilt. Philip rode to Poland and rescued Barborka, but when they returned, Hedwig - believing Barborka was dead - had already jumped from the tower in despair."
                    },
                    "pl": {
                        "title": "Legenda o pięknej Jadwidze",
                        "description": "Dawno temu potężny pan Filip z rodziny Brězovice mieszkał na zamku Spiskim ze swoją piękną żoną Ludwiką i córką Barborką. Po śmierci Ludwiki Filip poświęcił się córce i polowaniu. Podczas polowania przypadkowo zastrzelił chłopca - syna polskiego szlachcica Jurskiego, który przysiągł zemstę. Podczas gdy Filip polował, Jurski oblegał zamek, aby porwać Barborkę. Jego plan polegał na wysłaniu przebranego minstrela, który zaczarował siostrę Filipa, Jadwigę, opiekującą się Barborką. Minstrel otworzył tajne drzwi i wróg porwał Barborkę. Kiedy Filip wrócił i dowiedział się, co się stało, obwinił Jadwigę, która już oszalała z poczucia winy. Filip pojechał do Polski i uratował Barborkę, ale kiedy wrócili, Jadwiga - wierząc, że Barborka nie żyje - już skoczyła z wieży w rozpaczy."
                    },
                    "de": {
                        "title": "Legende von der schönen Hedwig",
                        "description": "Vor langer Zeit lebte der mächtige Herr Philip aus der Familie Brězovice auf der Zipser Burg mit seiner schönen Frau Louise und Tochter Barborka. Nach Louises Tod widmete sich Philip seiner Tochter und der Jagd. Während einer Jagd erschoss er versehentlich einen Jungen - den Sohn des polnischen Adligen Jursky, der Rache schwor. Während Philip jagte, belagerte Jursky die Burg, um Barborka zu entführen. Sein Plan bestand darin, einen verkleideten Minnesänger zu schicken, der Philips Schwester Hedwig verzauberte, die sich um Barborka kümmerte. Der Minnesänger öffnete eine geheime Tür und der Feind entführte Barborka. Als Philip zurückkehrte und erfuhr, was geschah, beschuldigte er Hedwig, die bereits vor Schuld wahnsinnig geworden war. Philip ritt nach Polen und rettete Barborka, aber als sie zurückkehrten, war Hedwig - in der Annahme, Barborka sei tot - bereits aus Verzweiflung vom Turm gesprungen."
                    },
                    "hu": {
                        "title": "Szép Hedvig legendája",
                        "description": "Régen a hatalmas Fülöp úr a Brězovice családból a Szepesi várban élt gyönyörű feleségével, Louisával és lányával, Barborkával. Louise halála után Fülöp a lányának és a vadászatnak szentelte magát. Egy vadászat során véletlenül lelőtt egy fiút - Jursky lengyel nemes fiát, aki bosszút esküdött. Míg Fülöp vadászott, Jursky ostrom alá vette a várat, hogy elrabold Barborkát. Terve szerint egy álruhás énekmondót küldött, aki elbűvölte Fülöp nővérét, Hedviget, aki Barborkára vigyázott. Az énekmondó kinyitott egy titkos ajtót, és az ellenség elrabolta Barborkát. Amikor Fülöp visszatért és megtudta, mi történt, Hedviget hibáztatta, aki már megőrült a bűntudattól. Fülöp Lengyelországba lovagolt és megmentette Barborkát, de amikor visszatértek, Hedvig - azt hívén, hogy Barborka meghalt - kétségbeesésében már leugrott a toronyból."
                    },
                    "sk": {
                        "title": "Legenda o krásnej Hedvige",
                        "description": "Dávno žil mocný pán Filip z rodiny Brězovice na Spišskom hrade so svojou krásnou manželkou Louisou a dcérou Barborkou. Po smrti Louisy sa Filip venoval dcére a poľovaniu. Počas poľovačky náhodne zastrelil chlapca - syna poľského šľachtica Jurského, ktorý prisahal pomstu. Zatiaľ čo Filip poľoval, Jurský obliehal hrad, aby uniesol Barborku. Jeho plán spočíval v poslaní prezlečeného piesnikára, ktorý očaril Filipovu sestru Hedvigu, ktorá sa starala o Barborku. Piesnikár otvoril tajné dvere a nepriateľ uniesol Barborku. Keď sa Filip vrátil a dozvedel sa, čo sa stalo, obvinil Hedvigu, ktorá už zbláznila z pocitu viny. Filip odišiel do Poľska a zachránil Barborku, ale keď sa vrátili, Hedviga - v domnení, že Barborka je mŕtva - už v zúfalstve skočila z veže."
                    },
                    "ru": {
                        "title": "Легенда о прекрасной Ядвиге",
                        "description": "Давным-давно могущественный пан Филипп из рода брёзовицких панов жил в Спишском Граде со своей прекрасной женой Луизой и дочерью Барборкой. После смерти Луизы Филипп посвятил себя дочери и охоте. Во время охоты он случайно застрелил мальчика - сына польского шляхтича Юрского, который поклялся отомстить. Пока Филипп охотился, Юрский осадил замок, чтобы похитить Барборку. Его план заключался в отправке переодетого менестреля, который очаровал сестру Филиппа Ядвигу, ухаживавшую за Барборкой. Менестрель открыл тайную дверь, и враг похитил Барборку. Когда Филипп вернулся и узнал, что случилось, он обвинил Ядвигу, которая уже обезумела от чувства вины. Филипп поскакал в Польшу и спас Барборку, но когда они вернулись, Ядвига - полагая, что Барборка мертва - уже спрыгнула с башни в отчаянии."
                    }
                },
                "audio": {}
            },
            {
                "id": str(uuid.uuid4()),
                "order": 4,
                "content": {
                    "en": {
                        "title": "Legend of the White Lady",
                        "description": "The most famous ghost of Spiš Castle is the White Lady. According to legend, she was a noblewoman who lived in the castle centuries ago. She fell in love with a commoner, which was forbidden. When her family discovered their secret love, they locked her in the tower and her beloved was executed. She died of a broken heart, and her spirit has wandered the castle ever since, searching for her lost love. Visitors and guards have reported seeing a woman in a white dress walking through the castle walls at night, especially near the tower and the Romanesque palace. Some say she appears before important events or disasters. She is not considered dangerous, but rather a sad spirit eternally seeking what was taken from her in life."
                    },
                    "pl": {
                        "title": "Legenda o Białej Damie",
                        "description": "Najsłynniejszym duchem zamku Spiskim jest Biała Dama. Według legendy była szlachcianką, która mieszkała w zamku wieki temu. Zakochała się w pospolitym człowieku, co było zabronione. Kiedy jej rodzina odkryła ich tajemną miłość, zamknęli ją w wieży, a jej ukochanego stracono. Zmarła ze złamanego serca, a jej duch od tamtej pory wędruje po zamku, szukając utraconej miłości. Odwiedzający i strażnicy zgłaszali widzenie kobiety w białej sukni przechodzącej przez mury zamku w nocy, szczególnie w pobliżu wieży i pałacu romańskiego. Niektórzy mówią, że pojawia się przed ważnymi wydarzeniami lub katastrofami. Nie jest uważana za niebezpieczną, ale raczej za smutnego ducha wiecznie poszukującego tego, co zostało jej odebrane w życiu."
                    },
                    "de": {
                        "title": "Legende von der Weißen Frau",
                        "description": "Der berühmteste Geist der Zipser Burg ist die Weiße Frau. Der Legende nach war sie eine Adlige, die vor Jahrhunderten auf der Burg lebte. Sie verliebte sich in einen Bürgerlichen, was verboten war. Als ihre Familie ihre geheime Liebe entdeckte, sperrten sie sie in den Turm und ihr Geliebter wurde hingerichtet. Sie starb an gebrochenem Herzen, und ihr Geist wandert seitdem durch die Burg und sucht ihre verlorene Liebe. Besucher und Wächter haben berichtet, dass sie nachts eine Frau in einem weißen Kleid durch die Burgmauern gehen sahen, besonders in der Nähe des Turms und des romanischen Palastes. Einige sagen, sie erscheint vor wichtigen Ereignissen oder Katastrophen. Sie gilt nicht als gefährlich, sondern eher als trauriger Geist, der ewig nach dem sucht, was ihr im Leben genommen wurde."
                    },
                    "hu": {
                        "title": "A Fehér Asszony legendája",
                        "description": "A Szepesi vár leghíresebb szelleme a Fehér Asszony. A legenda szerint évszázadokkal ezelőtt egy nemesasszony volt, aki a várban élt. Beleszeretett egy közemberbe, ami tiltott volt. Amikor családja felfedezte titkos szerelmüket, bezárták a toronyba, kedvesét pedig kivégezték. Meghalt a szívfájdalomtól, és szelleme azóta is a várban kóborol, elveszett szerelmét keresve. Látogatók és őrök arról számoltak be, hogy egy fehér ruhás nőt láttak éjszaka a vár falain áthaladni, különösen a torony és a román palota közelében. Egyesek szerint fontos események vagy katasztrófák előtt jelenik meg. Nem tekintik veszélyesnek, inkább szomorú szellemnek, aki örökké azt keresi, amit elvettek tőle az életben."
                    },
                    "sk": {
                        "title": "Legenda o Bielej pani",
                        "description": "Najslávnejším duchom Spišského hradu je Biela pani. Podľa legendy bola šľachtičnou, ktorá žila na hrade pred storočiami. Zamilovala sa do prostého človeka, čo bolo zakázané. Keď jej rodina objavila ich tajnú lásku, zamkli ju do veže a jej milovaný bol popravený. Zomrela zo zlomeného srdca a jej duch odvtedy blúdi po hrade a hľadá svoju stratenú lásku. Návštevníci a strážcovia hlásili, že v noci videli ženu v bielych šatách prechádzať hradbami hradu, najmä v blízkosti veže a románskeho paláca. Niektorí hovoria, že sa objavuje pred dôležitými udalosťami alebo katastrofami. Nie je považovaná za nebezpečnú, ale skôr za smutného ducha večne hľadajúceho to, čo jej bolo vzaté v živote."
                    },
                    "ru": {
                        "title": "Легенда о Белой Даме",
                        "description": "Самым знаменитым призраком Спишского Града является Белая Дама. По легенде, она была дворянкой, которая жила в замке столетия назад. Она влюбилась в простолюдина, что было запрещено. Когда её семья обнаружила их тайную любовь, они заперли её в башне, а её возлюбленного казнили. Она умерла от разбитого сердца, и её дух с тех пор бродит по замку в поисках утраченной любви. Посетители и охранники сообщали, что видели женщину в белом платье, проходящую сквозь стены замка ночью, особенно возле башни и романского дворца. Некоторые говорят, что она появляется перед важными событиями или бедствиями. Её не считают опасной, скорее это печальный дух, вечно ищущий то, что было отнято у неё при жизни."
                    }
                },
                "audio": {}
            }
        ],
        "audio": {},
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert the new legends stop
    print("\nCreating new Legends stop with 4 sub-legends...")
    await db.tour_stops.insert_one(legends_stop)
    print("  ✓ Created stop #14: Legends of Spiš Castle")
    print("    └─ Contains 4 sub-legends")
    
    print("\n" + "=" * 70)
    print("LEGENDS STRUCTURE FIXED!")
    print("=" * 70)
    
    # Verify
    total_stops = await db.tour_stops.count_documents({})
    print(f"\nTotal tour stops in database: {total_stops}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_legends())
