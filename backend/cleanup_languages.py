"""
Clean up languages - keep only EN, PL, DE, HU, SK
Remove RU, ES, ZH
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

# Polish text content for all 13 stops
POLISH_CONTENT = {
    1: {"title": "Witamy", "description": "Witamy w jednym z największych kompleksów zamkowych w Europie. Witamy w imponującej budowli o wyjątkowej architekturze, która jest przykładem rozwoju budownictwa zamkowego w różnych epokach stylowych. Witamy na zamku Spiš, który z biegiem czasu przekształcił się z królewskiego zamku przez rezydencję szlachecką w twierdzę wojskową."},
    2: {"title": "Przed zamkiem", "description": "Wzgórze zamkowe było zamieszkane już w czasach prehistorycznych i neolicie. Od wielu lat prowadzone są tu badania archeologiczne. Znaleziska cienkościennej ceramiki i zdobionych naczyń z pionowymi rowkami, a także monet i innych obiektów potwierdzają bogate osadnictwo celtyckich plemion Kotínów i Daków oraz kultur badeńskiej i bukowohorskiej."},
    3: {"title": "Przy makiecie zamku", "description": "W tym pomieszczeniu zobaczą Państwo szkice i rysunki pokazujące, jak historia zamku Spiš rozpoczęła się od budowy pojedynczej wieży obronnej na akropolu zamku, na skale, oraz jak przedstawiono w makiecie zamku Spiš, pokazującej stan kompleksu na początku XVIII wieku, kiedy był jeszcze zamieszkany i zadaszony."},
    4: {"title": "W kuchni", "description": "Mięso było głównym składnikiem diety. Spożywano tradycyjne rodzaje mięsa, takie jak drób, wołowina, wieprzowina czy dziczyzna. Wszyscy jedli mięso, główna różnica polegała na tym, że szlachta zawsze mogła sobie pozwolić na świeże mięso, podczas gdy zwykli ludzie chcieli jeść jak najtaniej, dlatego preferowali wieprzowinę."},
    5: {"title": "Na dolnym tarasie", "description": "Na ścianach wiszą fotografie ilustrujące, dlaczego cały ten obszar został wpisany na Listę Światowego Dziedzictwa UNESCO w 1993 roku wraz z wczesnogotyckim kościołem Ducha Świętego w Žehrze. Zamek Spiš stanowi oczywiście centrum tego wyjątkowego obszaru i przez wiele lat był centrum świeckiej władzy na Spiszu."},
    6: {"title": "Na romańskim dziedzińcu", "description": "Weszli Państwo przez bramę przeciwpowodziową, najstarszą romańską bramę, i znajdują się w miejscu związanym z najazdem Tatarów, pierwszą pisemną wzmianką o zamku oraz kapitułą spiską. Tutaj można bardzo dobrze zobaczyć rozbudowę zamku. Przed Państwem wznosi się skała lub trawertynowa skała, na której spoczywają pozostałości pałacu."},
    7: {"title": "Na górnym tarasie", "description": "Zamek Spiš góruje na trawertynowej skale na wysokości 634 m n.p.m. Stąd rozciąga się doskonały widok na całą szeroką okolicę. Niemal pionowe ściany skalne wzgórza uczyniły to miejsce jednym z najlepiej chronionych i najtrudniej dostępnych zamków w kraju."},
    8: {"title": "Dolny dziedziniec", "description": "Stąd roztacza się piękny widok na cały dolny dziedziniec, który został zbudowany w połowie XV wieku. W lewym rogu dziedzińca widoczne są kamienne fundamenty pozostałości celtyckiej świątyni. Powstanie dolnego dziedzińca wiąże się z imieniem czeskiego katolickiego szlachcica Jana Jiskry z Brandýsa."},
    9: {"title": "Komora tortur", "description": "Komora tortur była dawniej integralną częścią systemu sądownictwa. Uważano ją za całkowicie normalną i legalną metodę uzyskania zeznania lub przyznania się oskarżonego. Często więzień był tak przerażony, gdy tylko został wprowadzony do komory tortur i zobaczył kata z narzędziami tortur, że wolał przyznać się 'dobrowolnie'."},
    10: {"title": "W pałacu Zapolskiego", "description": "Przeszli Państwo przez drugą romańską bramę, minęli pozostałości bastionu i mury obronne z różnymi strzelnicami. Dalej przeszli obok pięknie odnowionego domu kapitana, aż stanęli przed bramą Turzova. Znajdujemy się w miejscach, gdzie zaczęto pisać historię zamku Spiš."},
    11: {"title": "Wieża", "description": "Obecna, 19-metrowa wieża zamkowa została zbudowana wraz z pałacem pośrodku już ufortyfikowanej akropolu w miejsce starej. Dlatego nie musiała już być zamieszkana i służyła jedynie jako ostatnie miejsce obrony zamku. Nazywano ją także Nebojsa. Zbudował ją książę Koloman, syn króla Andrzeja II."},
    12: {"title": "Pałac romański", "description": "Ten arkadowy korytarz, który służy jako jedyne wejście do późnogotyckiej kaplicy św. Elżbiety Węgierskiej oraz jako muzeum broni i zbroi, jest powodem, dla którego niektóre pomieszczenia wewnętrzne nie są dostępne. Na samej północy skalistego płaskowyżu wznosi się masywny, kwadratowy budynek. Jest to trzypiętrowy pałac romański."},
    13: {"title": "Z okna", "description": "Z tego miejsca roztacza się piękny widok na krajobraz i dziedzińce. Bezpośrednio pod nami znajduje się romański dziedziniec. Dzięki budowie licznych dziedzińców zamek osiągnął monumentalną wielkość o powierzchni ponad 41 000 metrów kwadratowych. Ostatnie zmiany budowlane przeprowadzili Csákyowie."}
}

def main():
    print("\n" + "="*70)
    print("CLEANING UP LANGUAGES - KEEPING ONLY EN, PL, DE, HU, SK")
    print("="*70)
    
    stops = list(tour_stops_collection.find().sort('stop_number', 1))
    
    for stop in stops:
        stop_id = stop['_id']
        stop_num = stop['stop_number']
        
        print(f"\nStop {stop_num}:")
        
        # Add Polish text content
        if stop_num in POLISH_CONTENT:
            print("  ✓ Adding Polish text")
            tour_stops_collection.update_one(
                {'_id': stop_id},
                {'$set': {
                    'content.pl': POLISH_CONTENT[stop_num]
                }}
            )
        
        # Remove Russian, Spanish, Chinese (text + audio)
        print("  ✓ Removing RU, ES, ZH")
        tour_stops_collection.update_one(
            {'_id': stop_id},
            {'$unset': {
                'content.ru': '',
                'content.es': '',
                'content.zh': '',
                'audio.ru': '',
                'audio.es': '',
                'audio.zh': ''
            }}
        )
    
    print("\n" + "="*70)
    print("CLEANUP COMPLETE!")
    print("Active languages: EN, PL, DE, HU, SK")
    print("="*70)
    
    # Verify
    print("\nVerification:")
    for stop in tour_stops_collection.find().sort('stop_number', 1):
        num = stop['stop_number']
        content_langs = list(stop['content'].keys())
        audio_langs = list(stop.get('audio', {}).keys())
        print(f"Stop {num:2d}: Content={content_langs}, Audio={audio_langs}")

if __name__ == "__main__":
    main()
