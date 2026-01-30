#!/usr/bin/env python3
"""
Add Spanish and Chinese content to all tour stops and legends
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Complete Spanish content for all 13 stops
SPANISH_STOPS = {
    1: {
        "title": "Bienvenidos",
        "description": """Bienvenidos a uno de los complejos de castillos más grandes de Europa. Bienvenidos al monumento más imponente, con su arquitectura excepcional, ejemplo de la evolución constructiva de los castillos en diferentes periodos estilísticos. Bienvenidos al Castillo de Spiš, que ha experimentado una transformación gradual: de castillo real a residencia nobiliaria y, finalmente, a fortaleza militar. O, si lo prefieren, a la inversa: de fortaleza militar blindada a castillo real y, finalmente, a residencia nobiliaria privada. Les invito a avanzar hacia el centro de este patio, donde se encuentran las tiendas de campaña. Allí, a la derecha, bajo el muro, hay una fotografía panorámica de todo el complejo del castillo. Les ruego que tengan cuidado al caminar, ya que hay piedras que sobresalen y el suelo está resbaladizo tanto en la acera como dentro de la torre. Gracias."""
    },
    2: {
        "title": "Fotografía del frente del castillo",
        "description": """La colina del castillo ya estaba habitada en la prehistoria y el Neolítico. Se han realizado investigaciones arqueológicas en la colina durante varios años. Los hallazgos de cerámica de paredes delgadas y vasijas decoradas con acanaladuras verticales, así como los de monedas y otros objetos, confirman el próspero asentamiento de las tribus celtas de Kotín y Dacios, además de las culturas Baden y Bukovohorská, que comerciaban con vidrio volcánico y obsidiana, principalmente de Zemplín, con la que fabricaban herramientas. Eran excelentes alfareros y artesanos. En resumen, el castro de Spišský vrch ha servido como centro administrativo y económico de esta región desde tiempos inmemoriales.

Aquí se ubicaba una extensa área fortificada, cuyo núcleo era la Acrópolis en la colina, protegida por fortificaciones. Más abajo, en las laderas, se extendía el segundo anillo exterior fortificado del castro.

Uno de los edificios más notables era el Santuario de Kett, una especie de lugar de culto. Los celtas producían y procesaban hierro, y la acuñación de monedas también era importante para ellos. Acuñaban sus propias monedas de plata, así como de cobre y bronce. Las monedas de plata de Spiš encontradas aquí por primera vez merecen atención. Este tipo de moneda representa un caballo con crin radiante. Este motivo sirvió de modelo para el geoglifo moderno en la parte frontal de la ladera, obra de Andrew Rogers.

La etapa románica puede considerarse el inicio de la construcción del castillo en el siglo XII, cuando el territorio ya formaba parte integral del Reino de Hungría. En aquel entonces, el territorio estaba dividido en unidades administrativas, condados reales, y uno de ellos era el condado de Spiš.

La historia del castillo real comenzó durante el reinado del rey Bela III, a finales del siglo XII, con la construcción de una gran torre de observación cilíndrica residencial, el Donžon, en la cima de un afloramiento rocoso. Esta torre servía para administrar el territorio de las Tierras Altas Austriacas y controlar el condado de Spiš.

Supuestamente, debido a movimientos tectónicos en el subsuelo y probablemente a deficiencias constructivas, la primera torre se derrumbó. Fue reemplazada por la actual torre bergrit, que se puede visitar.

En 1221, el castillo se convirtió en la sede de Kolomán de Galicia, de la dinastía real Árpád, y poco a poco comenzó a transformarse en residencia. Al borde del acantilado rocoso, en el lugar mejor protegido, se construyó un palacio románico de dos plantas, que representa el monumento más valioso de todo el complejo. Entre los elementos distintivos del palacio destacan las ventanas pareadas con columnas centrales decorativas."""
    },
    3: {
        "title": "En la maqueta del castillo",
        "description": """En esta sala se pueden ver bocetos que muestran que la historia del Castillo de Spiš comenzó con la construcción de una única torre defensiva en lo alto de la acrópolis o acantilado de piedra y culminó como se muestra en la maqueta del Castillo de Spiš, que representa el estado final del complejo a principios del siglo XVIII, cuando aún estaba habitado y tenía tejados. La maqueta del complejo residencial de 132 habitaciones fue creada por Adolph Stephanie, a quien Vidor Csáky invitó a Spiš para examinar el castillo."""
    },
    4: {
        "title": "En la cocina",
        "description": """El componente básico de la dieta era la carne. Se consumían carnes tradicionales como aves, res, cerdo o caza. Todos comían carne; la principal diferencia radicaba en que la nobleza siempre podía permitirse carne fresca, mientras que la gente común buscaba comer de la forma más económica posible, por lo que prefería el cerdo. Lo que no consumían de inmediato, lo conservaban de diversas maneras para que durara el mayor tiempo posible. Los métodos más comunes de conservación eran el ahumado, el salado y el secado.

Entre las delicias más populares de nuestros antepasados ​​se encontraban las gachas de cereales, preparadas como plato principal o como acompañamiento de platos de carne. La cocina húngara de la Edad Media era conocida en toda Europa por sus sabores especiados y sabrosos."""
    },
    5: {
        "title": "En la terraza inferior",
        "description": """En las paredes se pueden ver fotografías que explican por qué toda esta zona fue inscrita en la Lista del Patrimonio Mundial Cultural y Natural de la UNESCO en 1993, junto con la iglesia gótica temprana del Espíritu Santo en Žehra. El Castillo de Spiš constituye el centro de esta singular área y durante muchos años fue el centro del poder secular en Spiš."""
    },
    6: {
        "title": "En el patio románico",
        "description": """Se ha entrado por la puerta de entrada, la puerta románica más antigua, y se está en un lugar asociado con la invasión de los tártaros, el primer registro escrito del castillo, y también con el Capítulo de Spiš.

Esta parte del castillo se construyó después de 1241, año en que los mongoles, también llamados tártaros, invadieron Hungría y saquearon toda la campiña circundante. El capítulo de Spiš, residencia del preboste, también fue saqueado y destruido. Los enemigos no lograron conquistar el castillo de Spiš, probablemente debido a su construcción en piedra, pero la devastación y el incendio de las aldeas causaron estragos tras su partida."""
    },
    7: {
        "title": "En la terraza superior",
        "description": """El Castillo de Spiš se alza sobre una roca de travertino a 634 m sobre el nivel del mar. Desde allí se domina una amplia panorámica de los alrededores. Las murallas casi perpendiculares de la colina convirtieron este lugar en uno de los castillos mejor protegidos e inaccesibles del país.

Desde este mirador se divisa casi la mitad de las montañas eslovacas. De derecha a izquierda, se pueden observar los Montes Branisko, los Montes Metálicos Eslovacos, los Bajos Tatras, el Pico Kriváň, los Altos Tatras y los Montes Levoča."""
    },
    8: {
        "title": "Patio inferior",
        "description": """Desde aquí se disfruta de una hermosa vista del patio inferior, construido a mediados del siglo XV. En la esquina izquierda del patio se pueden observar los cimientos de piedra de los restos de un santuario celta.

La creación del patio inferior está ligada al nombre del noble católico checo Ján Jiskra de Brandýs, quien llegó a Hungría en tiempos turbulentos, cuando estalló la guerra civil."""
    },
    9: {
        "title": "Cámara de tortura",
        "description": """La cámara de tortura, que antiguamente formaba parte integral del sistema judicial, se consideraba un método completamente normal y legal para que un juez obtuviera el testimonio o la confesión del acusado. Era común que un prisionero se aterrorizara al ser llevado a la cámara y ver al verdugo preparando los instrumentos que usaría contra él, prefiriendo confesar "voluntariamente"."""
    },
    10: {
        "title": "En el Palacio de Zapolski",
        "description": """Atravesaste la segunda puerta románica, pasando junto a los restos de un bastión y murallas con aspilleras de diversos tipos. Nos encontramos en los lugares donde comenzó a escribirse la historia del Castillo de Spiš. Probablemente te encuentres en la cocina de los palacios occidentales originales de Zapolské, de estilo renacentista."""
    },
    11: {
        "title": "Torre",
        "description": """La actual torre del castillo, de 19 metros de altura, se construyó en el centro de la acrópolis ya fortificada, en lugar de la antigua, junto con el palacio. Por lo tanto, ya no era necesaria su habitabilidad; servía únicamente como último bastión de defensa del castillo y también se la conocía como Nebojsa. Fue construida por el hijo del rey Andrés II, el duque Koloman."""
    },
    12: {
        "title": "Palacio Románico",
        "description": """Este corredor porticado, que sirve de única entrada a la capilla gótica tardía de Santa Isabel de Hungría y alberga un museo de armas y armaduras, es la razón por la que algunos espacios interiores están cerrados. Al fondo, en la parte más septentrional de la meseta rocosa, se alza un imponente edificio cuadrado: un palacio románico de tres plantas. Es uno de los cuatro palacios románticos de carácter secular que se conservan en el mundo."""
    },
    13: {
        "title": "Desde la ventana",
        "description": """Desde la ventana se disfruta de una hermosa vista del campo y los patios. Con la construcción de todos los patios, el castillo adquirió sus dimensiones monumentales, con una superficie de más de 41.000 metros cuadrados. Los Csáky llevaron a cabo las últimas modificaciones."""
    }
}

# Spanish legends
SPANISH_LEGENDS = [
    {
        "order": 1,
        "title": "El monje valiente y la muchacha",
        "description": """Hoy nadie sabe quién era la muchacha, de dónde venía ni qué hacía en el castillo de Spiš. Lo único que se conserva es que vivió allí al mismo tiempo que Štefan Zápoľský, y que tras su muerte fue enterrada en la capilla recién terminada del capítulo de Spiš. Se dice que para expulsar al demonio que la había saqueado y arruinado."""
    },
    {
        "order": 2,
        "title": "El valiente caballero Roland",
        "description": """En verdad, así suele suceder en la vida y en la historia: dos eventos aparentemente inconexos ocurren, pero con el tiempo resulta que fueron el comienzo de un drama inesperado. Esto sucedió hace mucho tiempo, cuando apenas se escribían las primeras páginas de la historia de Spiš: el príncipe Boleslav de Cracovia decidió casar a su hija Ana, y el caballero de Spiš, Roland, se alzó contra el rey húngaro."""
    },
    {
        "order": 3,
        "title": "El fantasma del Castillo de Spiš",
        "description": """El župan de Spiš se enemistó con el señor del Castillo de Nedec. ¡Ojalá hubiera sido así! El señor de Nedec le tendió una emboscada mientras cazaba, ¡y el župan mató a su hijo en defensa propia! Desde luego, no pudo haberle dado al señor de Nedec en un punto más sensible. Por eso juró de inmediato una terrible venganza."""
    },
    {
        "order": 4,
        "title": "La Princesa Gitana",
        "description": """Debió de suceder hace mucho tiempo, cuando Segismundo, el futuro emperador, primero conquistó a la princesa húngara María mediante la guerra, y luego el trono húngaro… Un día, llegaron a Spišské Podhradie unos gitanos en carromatos. Por aquel entonces, los gitanos vagaban libremente por el país sin tener residencia fija en ningún lugar."""
    }
]

async def add_spanish_content():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("=" * 80)
    print("ADDING SPANISH CONTENT TO TOUR STOPS AND LEGENDS")
    print("=" * 80)
    
    # Add Spanish to numbered stops
    print("\n[1/2] Adding Spanish content to 13 numbered tour stops...")
    for stop_num, spanish_content in SPANISH_STOPS.items():
        print(f"\n  Stop {stop_num}: {spanish_content['title']}")
        
        result = await db.tour_stops.update_one(
            {"stop_number": stop_num},
            {"$set": {
                "content.es.title": spanish_content["title"],
                "content.es.description": spanish_content["description"],
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.modified_count > 0:
            desc_len = len(spanish_content["description"])
            print(f"    ✓ Updated! ({desc_len} characters)")
        else:
            print(f"    ⚠️  Not modified")
    
    # Add Spanish to Legends stop
    print("\n[2/2] Adding Spanish content to Legends stop...")
    legends_stop = await db.tour_stops.find_one({"stop_name": "Legends"})
    
    if legends_stop:
        # Update main legends stop description
        result = await db.tour_stops.update_one(
            {"stop_name": "Legends"},
            {"$set": {
                "content.es.title": "Leyendas del Castillo de Spiš",
                "content.es.description": "Las antiguas murallas del Castillo de Spiš guardan muchas leyendas transmitidas de generación en generación. Aquí hay cuatro de los cuentos más famosos que resuenan a través de los siglos.",
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Update each legend with Spanish content
        legends = legends_stop.get('legends', [])
        for i, legend in enumerate(legends):
            if i < len(SPANISH_LEGENDS):
                legend['content']['es'] = {
                    "title": SPANISH_LEGENDS[i]['title'],
                    "description": SPANISH_LEGENDS[i]['description']
                }
        
        # Save updated legends
        result = await db.tour_stops.update_one(
            {"stop_name": "Legends"},
            {"$set": {
                "legends": legends,
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.modified_count > 0:
            print(f"  ✓ Updated Legends stop with Spanish content for {len(SPANISH_LEGENDS)} legends")
        else:
            print(f"  ⚠️  Legends not modified")
    else:
        print("  ❌ Legends stop not found!")
    
    # Verification
    print("\n" + "=" * 80)
    print("VERIFICATION")
    print("=" * 80)
    
    # Check Spanish content
    stops_with_spanish = await db.tour_stops.count_documents({"content.es": {"$exists": True}})
    print(f"\n✓ Tour stops with Spanish content: {stops_with_spanish}")
    
    # Check Legends
    legends_stop = await db.tour_stops.find_one({"stop_name": "Legends"})
    if legends_stop and 'es' in legends_stop.get('content', {}):
        print(f"✓ Legends stop has Spanish content")
        legends_with_spanish = sum(1 for leg in legends_stop.get('legends', []) if 'es' in leg.get('content', {}))
        print(f"✓ {legends_with_spanish} legends have Spanish content")
    
    print("\n" + "=" * 80)
    print("SPANISH CONTENT ADDED SUCCESSFULLY!")
    print("=" * 80)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_spanish_content())
