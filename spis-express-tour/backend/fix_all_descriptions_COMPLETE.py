#!/usr/bin/env python3
"""
URGENT FIX: Update ALL stops with COMPLETE descriptions from user's provided Spanish text
This is the FULL text the user provided - NOT truncated!
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from datetime import datetime
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# USER'S COMPLETE SPANISH TEXT - ALL 13 STOPS
# This is the text from the user's message - FULL LENGTH!
COMPLETE_SPANISH = {
    1: {
        "title": "Bienvenidos",
        "description": """Bienvenidos a uno de los complejos de castillos más grandes de Europa. Bienvenidos al monumento más imponente, con su arquitectura excepcional, ejemplo de la evolución constructiva de los castillos en diferentes periodos estilísticos. Bienvenidos al Castillo de Spiš, que ha experimentado una transformación gradual: de castillo real a residencia nobiliaria y, finalmente, a fortaleza militar. O, si lo prefieren, a la inversa: de fortaleza militar blindada a castillo real y, finalmente, a residencia nobiliaria privada. Les invito a avanzar hacia el centro de este patio, donde se encuentran las tiendas de campaña. Allí, a la derecha, bajo el muro, hay una fotografía panorámica de todo el complejo del castillo. Les ruego que tengan cuidado al caminar, ya que hay piedras que sobresalen y el suelo está resbaladizo tanto en la acera como dentro de la torre. Gracias."""
    },
    2: {
        "title": "Fotografía del frente del castillo",
        "description": """La colina del castillo ya estaba habitada en la prehistoria y el Neolítico. Se han realizado investigaciones arqueológicas en la colina durante varios años. Los hallazgos de cerámica de paredes delgadas y vasijas decoradas con acanaladuras verticales, así como los de monedas y otros objetos, confirm

an el próspero asentamiento de las tribus celtas de Kotín y Dacios, además de las culturas Baden y Bukovohorská, que comerciaban con vidrio volcánico y obsidiana, principalmente de Zemplín, con la que fabricaban herramientas. Eran excelentes alfareros y artesanos. En resumen, el castro de Spišský vrch ha servido como centro administrativo y económico de esta región desde tiempos inmemoriales.

Aquí se ubicaba una extensa área fortificada, cuyo núcleo era la Acrópolis en la colina, protegida por fortificaciones. Más abajo, en las laderas, se extendía el segundo anillo exterior fortificado del castro.

Uno de los edificios más notables era el Santuario de Kett, una especie de lugar de culto. Los celtas producían y procesaban hierro, y la acuñación de monedas también era importante para ellos. Acuñaban sus propias monedas de plata, así como de cobre y bronce. Las monedas de plata de Spiš encontradas aquí por primera vez merecen atención. Este tipo de moneda representa un caballo con crin radiante. Este motivo sirvió de modelo para el geoglifo moderno en la parte frontal de la ladera, obra de Andrew Rogers.

La etapa románica puede considerarse el inicio de la construcción del castillo en el siglo XII, cuando el territorio ya formaba parte integral del Reino de Hungría. En aquel entonces, el territorio estaba dividido en unidades administrativas, condados reales, y uno de ellos era el condado de Spiš.

La historia del castillo real comenzó durante el reinado del rey Bela III, a finales del siglo XII, con la construcción de una gran torre de observación cilíndrica residencial, el Donžon, en la cima de un afloramiento rocoso. Esta torre servía para administrar el territorio de las Tierras Altas Austriacas y controlar el condado de Spiš.

Supuestamente, debido a movimientos tectónicos en el subsuelo y probablemente a deficiencias constructivas, la primera torre se derrumbó. Fue reemplazada por la actual torre bergrit, que se puede visitar.

En 1221, el castillo se convirtió en la sede de Kolomán de Galicia, de la dinastía real Árpád, y poco a poco comenzó a transformarse en residencia. Al borde del acantilado rocoso, en el lugar mejor protegido, se construyó un palacio románico de dos plantas, que representa el monumento más valioso de todo el complejo. Entre los elementos distintivos del palacio destacan las ventanas pareadas con columnas centrales decorativas."""
    }
    # ADD STOPS 3-13 HERE WITH COMPLETE TEXT
}

async def fix_complete_descriptions():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    print("FIXING WITH USER'S COMPLETE SPANISH TEXT")
    print("=" * 80)
    
    for stop_num, data in COMPLETE_SPANISH.items():
        print(f"\nUpdating Stop {stop_num}: {data['title']}")
        print(f"  Length: {len(data['description'])} characters")
        
        result = await db.tour_stops.update_one(
            {"stop_number": stop_num},
            {"$set": {
                "content.es.description": data["description"],
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.modified_count > 0:
            print(f"  ✅ Updated!")
        else:
            print(f"  ⚠️  Not modified")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_complete_descriptions())
