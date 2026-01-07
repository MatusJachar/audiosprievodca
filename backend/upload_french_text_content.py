#!/usr/bin/env python3
"""
Script to upload French text content (titles and descriptions) for tour stops
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', 'test_database')
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
tour_stops_collection = db['tour_stops']

# French content data
FRENCH_CONTENT = {
    1: {
        "title": "Bienvenue",
        "description": "Bienvenue dans l'un des plus grands ensembles castraux d'Europe. Bienvenue au plus grand monument d'architecture exceptionnelle, témoin de l'évolution de la construction castrale à travers différentes périodes stylistiques. Bienvenue au château de Spiš, qui a connu une transformation progressive : château royal, résidence noble, puis forteresse militaire. Ou inversement, si vous préférez, forteresse fortifiée, château royal, puis résidence noble privée. Je vous invite tout d'abord à vous diriger vers le centre de cette cour, jusqu'aux tentes. Sur votre droite, sous le mur, se trouve une photographie panoramique de l'ensemble du château. Attention où vous mettez les pieds : des pierres dépassent et le sol est glissant, aussi bien sur le trottoir qu'à l'intérieur de la tour. Merci."
    },
    2: {
        "title": "Photos devant le château",
        "description": "La colline du château était déjà habitée à la Préhistoire et au Néolithique. Des fouilles archéologiques y sont menées depuis plusieurs années. La découverte de poteries à parois fines et de vases décorés de rainures verticales, ainsi que de pièces de monnaie et d'objets divers, confirme la présence importante de tribus celtes des cultures de Kotín et dace, ainsi que des cultures de Baden et de Bukovohorská. Ces tribus commerçaient le verre volcanique et l'obsidienne, notamment de Zemplín, qu'elles utilisaient pour fabriquer des outils. Elles étaient d'excellents potiers et artisans. En résumé, le site fortifié de Spišský vrch a servi de centre administratif et économique à cette région depuis des temps immémoriaux.\n\nIl comprenait une vaste zone fortifiée, dont le cœur était l'acropole perchée sur la colline et protégée par des fortifications. Plus bas sur les pentes de la colline s'étendait une seconde enceinte fortifiée extérieure.\n\nL'un des édifices les plus remarquables était le sanctuaire Kett, une sorte de lieu de culte. Les Celtes produisaient et travaillaient le fer, et la frappe de monnaie était également une activité importante pour eux. Ils frappaient leurs propres pièces d'argent, ainsi que des pièces de cuivre et de bronze. Les pièces d'argent de Spiš, découvertes ici pour la première fois, méritent une attention particulière. Ce type de pièce représente un cheval à la crinière rayonnante. Ce motif a servi de modèle au géoglyphe moderne situé à l'avant du versant, œuvre d'Andrew Rogers.\n\nLa période romane correspond aux débuts de la construction du château au XIIe siècle, alors que le territoire faisait déjà partie intégrante du royaume de Hongrie. À cette époque, le territoire était divisé en unités administratives, les comtés royaux, dont le comté de Spiš.\n\nL'histoire du château royal commence sous le règne du roi Béla III, à la fin du XIIe siècle, avec la construction d'une grande tour d'observation cylindrique résidentielle, le Donžon, au sommet d'un éperon rocheux. Cette tour servait à administrer le territoire des Hauts Plateaux autrichiens et à contrôler le comté de Spiš.\n\nLa première tour s'est effondrée, vraisemblablement en raison de mouvements tectoniques dans le sous-sol et probablement aussi de défauts de structure. Elle a été remplacée par l'actuelle tour en bergrite, ouverte à la visite.\n\nEn 1221, le château devint la résidence de Koloman de Galicie, de la dynastie royale des Árpád, et se transforma peu à peu en demeure. À flanc de falaise, à l'endroit le mieux protégé, fut construit un palais roman à deux étages, qui constitue le monument le plus précieux de tout le complexe castral. Parmi les éléments caractéristiques du palais figurent des fenêtres jumelées à colonnes centrales ornementées.\n\nÀ mesure que le château s'agrandissait, chaque nouvelle construction devait être entourée de murs et dotée d'un système de défense. Nombreux sont les visiteurs qui s'interrogent sur la présence exclusive de murs. La raison est simple : la défense était une priorité lors de toute construction. C'est pourquoi on fortifiait le château avec des murs, ce qui explique également la structure du complexe et l'apparition des cours intérieures. En résumé, le château supérieur a été construit au XIIe siècle. Le château extérieur roman date du XIIIe siècle, tandis que la cour intermédiaire, où vous vous trouvez actuellement, a été édifiée dans la seconde moitié du XIVe siècle, sous le règne de Louis le Grand. La cour inférieure, quant à elle, date du XVe siècle. Elle est donc considérée comme la plus récente du complexe castral.\n\nComme par le passé, le château supérieur était la demeure de la noblesse, tandis que les cours, principalement dédiées à l'artisanat et à l'économie, abritaient les domestiques et les soldats. Ces derniers vivaient pour la plupart dans de petites maisons en bois entourées de remparts. Certaines d'entre elles ont été construites par les familles Thurz et Csáky lors de reconstructions ultérieures du château, leur donnant approximativement leur forme actuelle. Au centre de cette cour se trouvait également la maison du capitaine du château, dont vous découvrez les vestiges. La photo devant vous présente une description des différents éléments d'intérêt. Nombre d'entre vous ont certainement remarqué plusieurs colonnes de pierre isolées en venant du parking. Vous vous êtes certainement demandé ce que c'est. Ce sont les vestiges d'une palissade défensive du XVIIe siècle, une sorte d'enceinte autour de la maison. C'était la première ligne de défense, remplie de bois, mais rien n'a été conservé dans ce château : tout a brûlé, pourri ou été volé, puisque nous sommes à Spiš. Derrière se trouvait un fossé sec. Des pieux de bois acérés étaient fixés à son fond, le rendant infranchissable. On accédait à la porte principale fortifiée, percée d'embrasures de canons, par un pont-levis. Vient ensuite la porte d'entrée, qui intégrait plusieurs éléments défensifs. Juste en dessous de son entrée se trouvait l'entrée.\n\nIl y avait autrefois une fosse aux loups de quatre mètres de profondeur, aux parois verticales, au fond de laquelle étaient solidement fixés des pieux de bois acérés. Ainsi, quiconque tombait dans la fosse ou était poussé hors de celle-ci par la porte en bois, actionnée par les gardes à l'aide d'un treuil depuis le premier étage, ne survivait certainement pas. On peut donc parler d'un système de défense quasi infranchissable.\n\nSi vous vous demandez pourquoi personne ne se trouve à la seconde entrée, la réponse est simple : c'était le point le plus vulnérable du château, l'endroit d'où l'on accédait facilement au complexe. La pente abrupte est impressionnante, certes, mais il vous a fallu moins de 10 minutes à chacun d'entre vous pour rejoindre la billetterie depuis le parking, alors que si vous étiez venus de Spišské Podhradie, cela vous aurait pris au moins 45 minutes. Vous auriez été bien plus épuisés, et les soldats gardant les quais auraient eu tout le temps de se préparer et d'élaborer un plan pour vous neutraliser ou vous éliminer. Il est à noter que la cour inférieure fut créée ultérieurement et que l'on accédait à la cour intermédiaire à l'emplacement actuel de l'entrée de la cour inférieure. La porte était protégée par un fossé sec et une barbacane fortifiée en forme de fer à cheval ou de J, mais ce système perdit sa raison d'être au XVe siècle et, devenu inutile, fut muré et le fossé comblé de terre. L'entrée principale demeura la porte par laquelle vous pénétrez aujourd'hui dans le château. Je vous invite à ne pas vous attarder et à gravir lentement la montagne. Plus vous monterez le sentier de travertin, plus vous vous enfoncerez dans une époque ancienne riche en secrets et en mystères. Poursuivez votre chemin tranquillement et tournez à droite devant la porte romane, où une maquette vous permettra de mieux apprécier l'aspect du château de Spiš et de ses toitures avant l'incendie. Arrêtez-vous ensuite sur la terrasse en face, où des photographies illustrent les raisons de l'inscription de ce site au patrimoine mondial de l'UNESCO. Vous y trouverez également une exposition consacrée aux cuisines du château. Attention où vous mettez les pieds, le sol est glissant. Merci."
    },
    # I'll continue with the rest in the next part due to length...
}

def upload_french_content():
    """Upload French titles and descriptions for tour stops"""
    
    print("🇫🇷 French Text Content Upload Script")
    print("=" * 50)
    
    # First, let me get all the content properly formatted
    # I'll create a comprehensive dictionary with all stops and legends
    
    print("Uploading French content for tour stops and legends...")
    print("This will update the 'content' field in the database to add French translations")
    print()
    
    uploaded_count = 0
    error_count = 0
    
    # For now, let me test with Stop 1
    try:
        stop = tour_stops_collection.find_one({'stop_number': 1})
        if stop:
            print(f"Found Stop 1: {stop.get('id')}")
            print(f"Current content languages: {list(stop.get('content', {}).keys())}")
            
            # Update with French content
            tour_stops_collection.update_one(
                {'stop_number': 1},
                {'$set': {
                    'content.fr': {
                        'title': FRENCH_CONTENT[1]['title'],
                        'description': FRENCH_CONTENT[1]['description']
                    }
                }}
            )
            print("✅ Stop 1 updated with French content")
            uploaded_count += 1
        else:
            print("❌ Stop 1 not found")
            error_count += 1
            
    except Exception as e:
        print(f"❌ Error: {e}")
        error_count += 1
    
    print("\n" + "=" * 50)
    print(f"Test completed: {uploaded_count} uploaded, {error_count} errors")
    
if __name__ == "__main__":
    upload_french_content()
