"""
Add professional Slovak content to all 13 tour stops
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', 'test_database')
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
tour_stops_collection = db['tour_stops']

# Professional Slovak content for all 13 stops
SLOVAK_CONTENT = {
    1: {
        "title": "Vitajte",
        "description": "Vitajte v jednom z najväčších hradných areálov v Európe. Vitajte v najrozsiahlejšej pamiatke so svojou výnimočnou architektúrou, ktorá je príkladom stavebného vývoja hradu v rôznych slohových obdobiach.Vitajte na Spišskom hrade, ktorý prešiel od postupnej premeny od   kráľovského hradu, cez šľachtické sídlo, až po vojenskú pevnosť. Alebo aj opačne ak chcete od vojenskej obrnenej pevnosti cez kráľovský hrad až po súkromné šľachtické sídlo. Najpr vás poprosím, aby ste sa presunuli ďalej do stredu tohto nádvoria k stanom, kde sa v pravo, pod múrom nachádza fotografia celého hradného komplexu z vyšky. Taktiež vás všetkých poprosím dávajte pozor pod nohy pretože vytŕčajú kamene a na chodníku sa šmýka tak aj ako aj vo vnútri veže. Ďakujem."
    },
    2: {
        "title": "Pri fotografií",
        "description": "Hradný kopec bol osídlení už v praveku a v neolite. Niekoľko rokov na kopci prebiehali archeologické výskumy. Nálezy tenkostennéj keramiky a zdobenych nádob zo zvyslím žliabkovaním, tak ako aj nalezy mincí a predmetov potvrdzujú bohaté osídlenie keltskými kmeňmi Kotínov a Dákov tiež Bádenskú a Bukovohorskú kultúru obchodujúcu so sopečným sklom  obsidiánom pochádzajúcim prevažne zo Zemplína, ktory využívali na vyrobu nástrojov. Boli to výborný hrnčiari a remeselníci. Jednoducho hradisko na Spišskom vrchu plnilo funkciu správneho a hospodárskeho centra tohto regiónu od nepamäti."
    },
    3: {
        "title": "Pri Makete",
        "description": "V tejto miestnosti možete vidiet načrty kresieb poukazujúcich, ,že pribeh Spišského hradu začal s výstavbou jednej obrannej veže na vrchole hradnej akropoly alebo kamennom útese a skončil ako ukazuje Model Spišského hradu znázorňujúci konečny stav komplexu začiatkom 18. storočia, kedy bol ešte obývaný a mal strechy. Model rezidenčného komplexu zo 132 komnatami vytvoril Adolph Stephanie, ktorého Vidor Csáky pozval na Spiš, aby skúmal hrad."
    },
    4: {
        "title": "Kuchyňa",
        "description": "Základnou zložkou stravy bolo mäso. Konzumovali sa tradičné druhy mäsa ako hydina, hovädzie či bravčové alebo divina. Mäso jedli všetci, základný rozdiel bol len v tom, že šľachta si mohla dovoliť mäso vždy čerstvé, zatiaľ čo poddaní sa chceli najesť čo najlacnejšie, preto uprednostňovali predovšetkým bravčové mäso. To, čo naraz nezjedli sa snažili tiež rôznym spôsobom uchovať, aby im vydržalo čo najdlhšie. Najbežnejším spôsobom uchovávania potravín bolo údenie, nasolenie a sušenie."
    },
    5: {
        "title": "Na dolnej terase",
        "description": "Na stenách môžme vidieť fotografie vyjadrujúce, prečo toto celé územie bolo v roku 1993 zapísané do zoznamu svetového kultúrneho a prírodného dedičstva UNESCO spolu s ranogotickým kostolíkom sv. Ducha v Žehre. Samozrejme Spišský hrad tvorí centrum tohto jedinečného územia a dlhé roky bol centrom svetskej moci na Spiši. V roku 2009 bola pripísaná do zoznamu aj Levoča, kde môžete obdivovať veľkolepý oltár od majstra Pavla a nádherné sochy v kostole sv.Jakuba v centre mesta, kde sa nachádza aj známa radnica. Prevažne všetko z fotografií je vidieť z tejto terasy aj naživo."
    },
    6: {
        "title": "Na románskom predhradí",
        "description": "Vstupili ste cez povodnu najstaršiu románasku bránu a stojite na mieste, ktoré je spojené s vpádom Tatárov, prvou pisomnou zmiekou o hrade ale i so Spišskou kapitulou. Tu je veľmi dobre vidieť expanziu hradu. Keď sa pozriete pred seba vidíte kamenné bralo alebo traventínovy útes, na ktorom stoja pozostatky paláca, takže keď sa pozeráte, tak dokážete vidiet, že stojíte pred hradom alebo pod hradom, avšak, ak sa otočíte za sebou, uvidíte hradby, takže ste súčast komplexu."
    },
    7: {
        "title": "Na Hornej terase",
        "description": "Spišský hrad stojí na vrchole travertínovej skaly v nadmorskej výške 634 m n. m. Odkial sa dá veľmi dobre kontrolovať celé široké okolie. Takmer kolmé steny vrchu robili z tohto miesta jeden z najlepšie chránených a najneprístupnejších hradov v krajine. V minulosti prebiehali pod hradným kopcom dve významné obchodné cesty."
    },
    8: {
        "title": "Dolné Nádvorie",
        "description": "Odtiaľto je nádherný výhľad na celé dolné nádvorie vybudované v polovici 15. storočia, kde v ľavom rohu nádvoria možete vidiet kamenné základy pozostatkov keltskej svätyne. Vznik dolného nádvoria je spätý s menom českého katolíckeho šľachtica Jána Jiskru z Brandýsa, ktorý sa k nám dostal v pohnutých časoch, kedy v Uhorsku vypukla občianska vojna."
    },
    9: {
        "title": "Mučiareň",
        "description": "Mučiarne, ktorá bola v minulosti neoddeliteľnou súčasťou súdneho systému. Bolo považované za úplne normálny a legálny spôsob, ako mohol sudca získať od obvineného svedectvo alebo priznanie. Bežným javom bývalo, že už v okamihu, keď väzňa priviezli do mučiarne a on videl, ako si tu kat rozkladá nástroje, ktoré na ňom chce použiť, dostal taký veľký strach, že sa radšej dobrovoľne priznal."
    },
    10: {
        "title": "V Zapolských Paláci",
        "description": "Prešli ste druhou Románskou bránou okolo pozostatkov bastiónu a hradieb s rôznymi druhmi strieľni. Ďalej ste pokračovali okolo krásne zrekonštruovaného kapitánskeho domu a ocitli ste sa pred Turzovo bránou, cez ktorú panstvo vchádzalo do residencii na hornom hrade po drev enej rampe zhotovenej z kresaného drreva. Nachádzame sa na miestach, kde sa začínala písať história Spišského hradu."
    },
    11: {
        "title": "Veža",
        "description": "Súčasná 19 metrová hradná veža bola uprostred už opevnenej akropoly postavená namiesto starej spolu s palácom. Preto už nemusela byť obytná, slúžila len ako miesto poslednej obrany na hrade a nazývali ju aj Nebojsa. Dal ju vystavať syn kráľa Ondreja II., vojvoda Koloman."
    },
    12: {
        "title": "Románsky palác",
        "description": "Táto arkádova chodba, sluziaca ako jediny vchod do neskorogotickej kaplnky sv. Alžbety Uhorskej a ako muzeum zbrani a brnenia je dôvodom prečo sú niektore vnútorne priestory zatvorené.Vzadu v najsevernejšej časti skalnatej plošiny môžete vidieť mohutnú hranatú budovu. Je to trojposchodovy románsky palác."
    },
    13: {
        "title": "Z okna paláca",
        "description": "Na tomto mieste je krasny výhľad na krajinu a nádvoria. Priamo pod nami je románske predhradie.. Postavením všetkyh nádvorí dostal hrad svoje monumentálne rozmery s rozlohou viac ako 41 tisíc metrov štvorcových. Csákyovci uskutočnili posledné stavebné úpravy."
    }
}

def main():
    print("\n" + "="*70)
    print("ADDING PROFESSIONAL SLOVAK CONTENT")
    print("="*70)
    
    stops = list(tour_stops_collection.find().sort('stop_number', 1))
    
    for stop in stops:
        stop_num = stop['stop_number']
        stop_id = stop['_id']
        
        if stop_num in SLOVAK_CONTENT:
            sk_data = SLOVAK_CONTENT[stop_num]
            print(f"\nStop {stop_num}: {sk_data['title']}")
            print(f"  ✓ Adding Slovak text...")
            
            tour_stops_collection.update_one(
                {'_id': stop_id},
                {'$set': {
                    'content.sk': {
                        'title': sk_data['title'],
                        'description': sk_data['description']
                    }
                }}
            )
            print(f"  ✓ Saved!")
    
    print("\n" + "="*70)
    print("SLOVAK CONTENT COMPLETE!")
    print("="*70)
    
    # Verify
    print("\nVerification - Stop 1:")
    stop1 = tour_stops_collection.find_one({'stop_number': 1})
    print(f"  SK Title: {stop1['content']['sk']['title']}")
    print(f"  SK Desc: {stop1['content']['sk']['description'][:100]}...")

if __name__ == "__main__":
    main()
