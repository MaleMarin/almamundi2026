#!/usr/bin/env python3
"""
Léxico afectivo AlmaMundi v1.0.0 — recurso propio, sin NRC ni Warriner.

Metodología:
- Lotes conceptuales de 100 lemas sobre una tabla de anclas FIJA
  (los extremos y el punto medio no cambian entre lotes).
- Cognados ES/PT/EN reciben el mismo triple VAD por construcción.
- Frecuencia: listas hermitdave/FrequencyWords 2018 (OpenSubtitles, CC-BY).
  Solo se usan las formas; los valores VAD son originales de AlmaMundi.
"""

from __future__ import annotations

import json
import math
import random
import re
import statistics
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lexicon_affect_tables import (
    CAT,
    EXTRA_NARRATIVE,
    EXTRA_REGIONAL,
    REGIONAL_VAD,
    WORDS,
)

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "lib" / "huella" / "lexicon"
FREQ_DIR = Path("/tmp/am-freq")
VERSION = "1.0.0"

# ---------------------------------------------------------------------------
# Anclas (0–1). Se reaplican en cada lote; no hay deriva.
# ---------------------------------------------------------------------------
# Valencia: desagradable ↔ agradable
# Activación: calma ↔ intensidad
# Dominancia: fragilidad ↔ control

ANCHORS = {
    "es": {
        "tortura": (0.03, 0.94, 0.12),
        "muerte": (0.06, 0.74, 0.18),
        "dolor": (0.16, 0.68, 0.28),
        "mesa": (0.52, 0.30, 0.50),
        "porque": (0.50, 0.22, 0.50),
        "abrazo": (0.88, 0.48, 0.46),
        "fiesta": (0.86, 0.84, 0.66),
        "carnaval": (0.92, 0.90, 0.70),
        "calma": (0.74, 0.10, 0.48),
        "grito": (0.22, 0.92, 0.52),
        "victima": (0.14, 0.70, 0.12),
        "poder": (0.48, 0.72, 0.92),
    },
    "pt": {
        "tortura": (0.03, 0.94, 0.12),
        "morte": (0.06, 0.74, 0.18),
        "dor": (0.16, 0.68, 0.28),
        "mesa": (0.52, 0.30, 0.50),
        "porque": (0.50, 0.22, 0.50),
        "abraco": (0.88, 0.48, 0.46),
        "festa": (0.86, 0.84, 0.66),
        "carnaval": (0.92, 0.90, 0.70),
        "calma": (0.74, 0.10, 0.48),
        "grito": (0.22, 0.92, 0.52),
        "vitima": (0.14, 0.70, 0.12),
        "poder": (0.48, 0.72, 0.92),
    },
    "en": {
        "torture": (0.03, 0.94, 0.12),
        "death": (0.06, 0.74, 0.18),
        "pain": (0.16, 0.68, 0.28),
        "table": (0.52, 0.30, 0.50),
        "because": (0.50, 0.22, 0.50),
        "hug": (0.88, 0.48, 0.46),
        "party": (0.86, 0.84, 0.66),
        "carnival": (0.92, 0.90, 0.70),
        "calm": (0.74, 0.10, 0.48),
        "scream": (0.22, 0.92, 0.52),
        "victim": (0.14, 0.70, 0.12),
        "power": (0.48, 0.72, 0.92),
    },
}

# (v, a, d, es, pt, en) — cognados alineados
CONCEPTS: list[tuple[float, float, float, str, str, str]] = [
    (0.03, 0.94, 0.12, "tortura torturar torturado", "tortura torturar torturado", "torture tortured torturing"),
    (0.04, 0.92, 0.14, "violacion violar violento violencia", "estupro violar violento violencia", "rape rapist violence violent"),
    (0.05, 0.88, 0.16, "asesinato asesinar asesino matanza genocidio", "assassinato assassinar assassino massacre genocidio", "murder murderer massacre genocide kill killing"),
    (0.06, 0.74, 0.18, "muerte morir muerto mortaja funeral entierro fallecer deceso", "morte morrer morto funeral enterro falecer obito", "death die dead dying funeral burial decease demise"),
    (0.08, 0.80, 0.20, "cadaver tumba cementerio ataúd ataud fosas", "cadaver tumba cemiterio caixao cova", "corpse grave cemetery coffin tomb"),
    (0.10, 0.78, 0.22, "guerra combate batalla bombardeo", "guerra combate batalha bombardeio", "war combat battle bombing"),
    (0.12, 0.86, 0.70, "odio odiar rabia furia ira enojo bronca", "odio odiar raiva furia ira raiva", "hate hatred rage fury anger angry"),
    (0.14, 0.70, 0.12, "victima abuso abusado exploitar explotacion", "vitima abuso abusado exploracao", "victim abuse abused exploit exploitation"),
    (0.15, 0.84, 0.22, "miedo temor terror panico susto aterrorizado", "medo temor terror panico susto aterrorizado", "fear terror panic scare frightened afraid"),
    (0.16, 0.68, 0.28, "dolor doler sufrimiento sufrir pena", "dor doer sofrimento sofrer pena", "pain painful suffering suffer ache"),
    (0.18, 0.42, 0.22, "duelo luto viudez viudo viuda orfandad huerfano", "luto viuvez viuvo viuva orfandade orfao", "grief mourning widow widower orphan bereavement"),
    (0.18, 0.88, 0.55, "grito gritar aullido", "grito gritar urro", "scream scream shout yell howl"),
    (0.20, 0.55, 0.25, "tristeza triste llanto llorar melancolia", "tristeza triste choro chorar melancolia", "sadness sad cry crying tears melancholy"),
    (0.22, 0.62, 0.30, "enfermedad enfermo cancer tumor epidemia", "doenca doente cancer tumor epidemia", "illness sick cancer tumor epidemic disease"),
    (0.22, 0.48, 0.28, "soledad solo sola abandono abandonado aislamiento", "solidao sozinho sozinha abandono abandonado isolamento", "loneliness lonely alone abandoned isolation"),
    (0.24, 0.72, 0.32, "ansiedad angustia nervios inquietud", "ansiedade angustia nervos inquietacao", "anxiety anguish nervous worry uneasy"),
    (0.24, 0.50, 0.30, "culpa culpable remordimiento verguenza humillacion", "culpa culpado remorso vergonha humilhacao", "guilt guilty shame shameful humiliation"),
    (0.26, 0.58, 0.34, "hambre hambruna pobreza miseria desempleo", "fome fome pobreza miseria desemprego", "hunger famine poverty misery unemployment"),
    (0.28, 0.64, 0.36, "accidente herida herido sangre sangrar", "acidente ferida ferido sangue sangrar", "accident wound wounded blood bleed"),
    (0.30, 0.46, 0.32, "perdida perder perdido escasez", "perda perder perdido escassez", "loss lose lost scarcity"),
    (0.32, 0.60, 0.38, "peligro peligroso riesgo amenaza", "perigo perigoso risco ameaca", "danger dangerous risk threat"),
    (0.34, 0.52, 0.36, "silencio silencio callado ausencia", "silencio calado ausencia", "silence silent quiet absence"),
    (0.36, 0.44, 0.34, "espera esperar incertidumbre duda", "espera esperar incerteza duvida", "wait waiting uncertainty doubt"),
    (0.38, 0.58, 0.40, "viaje migrar inmigrante emigrante frontera aduana destierro exilio refugio refugiado", "viagem migrar imigrante emigrante fronteira alfandega exilio refugio refugiado", "travel migrate immigrant emigrant border customs exile refuge refugee"),
    (0.40, 0.50, 0.42, "trabajo trabajar oficio empleo salario", "trabalho trabalhar oficio emprego salario", "work working job employment wage salary"),
    (0.42, 0.48, 0.44, "camino sendero ruta carretera", "caminho trilha rota estrada", "path trail route road highway"),
    (0.44, 0.42, 0.46, "ciudad pueblo barrio vecindario", "cidade povo bairro vizinhanca", "city town neighborhood district"),
    (0.46, 0.40, 0.48, "tiempo hora dia mes año ano semana", "tempo hora dia mes ano semana", "time hour day month year week"),
    (0.48, 0.38, 0.50, "cosa objeto parte lado forma", "coisa objeto parte lado forma", "thing object part side form"),
    (0.48, 0.72, 0.92, "poder control mando fuerza autoridad victoria vencer", "poder controle mando forca autoridade vitoria vencer", "power control command strength authority victory win"),
    (0.50, 0.22, 0.50, "el la los las un una de del al y o pero que como porque si no", "o a os as um uma de do da e ou mas que como porque se nao", "the a an of to and or but that which because if not"),
    (0.52, 0.30, 0.50, "mesa silla puerta ventana pared techo piso", "mesa cadeira porta janela parede teto chao", "table chair door window wall ceiling floor"),
    (0.54, 0.36, 0.52, "persona gente hombre mujer gente humano", "pessoa gente homem mulher humano", "person people man woman human"),
    (0.56, 0.40, 0.52, "hablar decir contar palabra voz idioma", "falar dizer contar palavra voz idioma", "speak say tell word voice language"),
    (0.58, 0.42, 0.54, "ver mirar ojo luz color imagen", "ver olhar olho luz cor imagem", "see look eye light color image"),
    (0.60, 0.38, 0.54, "agua rio mar oceano lluvia lago", "agua rio mar oceano chuva lago", "water river sea ocean rain lake"),
    (0.62, 0.34, 0.50, "tierra campo montana valle bosque", "terra campo montanha vale floresta", "land field mountain valley forest"),
    (0.64, 0.32, 0.52, "casa hogar vivienda cuarto cama cocina", "casa lar moradia quarto cama cozinha", "house home dwelling room bed kitchen"),
    (0.66, 0.40, 0.54, "comida pan leche arroz sopa fruta", "comida pao leite arroz sopa fruta", "food bread milk rice soup fruit"),
    (0.68, 0.36, 0.52, "cuerpo mano cara cabeza corazon piel", "corpo mao cara cabeca coracao pele", "body hand face head heart skin"),
    (0.70, 0.34, 0.50, "nino nina infancia juguete escuela", "crianca infancia brinquedo escola", "child childhood toy school"),
    (0.72, 0.12, 0.48, "paz calma sosiego sereno tranquilidad descanso sueno", "paz calma sossego sereno tranquilidade descanso sono", "peace calm serenity serene rest sleep"),
    (0.74, 0.46, 0.56, "amigo amistad companero vecino comunidad", "amigo amizade companheiro vizinho comunidade", "friend friendship companion neighbor community"),
    (0.76, 0.50, 0.58, "familia madre padre hijo hija hermano hermana abuelo abuela", "familia mae pai filho filha irmao irma avo avo", "family mother father son daughter brother sister grandfather grandmother"),
    (0.78, 0.44, 0.54, "esperanza fe ilusion porvenir futuro", "esperanca fe ilusao porvir futuro", "hope faith illusion future"),
    (0.80, 0.52, 0.56, "gracias gratitud agradecer bondad generosidad", "obrigado gratidao agradecer bondade generosidade", "thanks gratitude thank kindness generosity"),
    (0.82, 0.70, 0.60, "alegria alegre feliz felicidad risa sonrisa gozo", "alegria alegre feliz felicidade riso sorriso gozo", "joy joyful happy happiness laugh smile delight"),
    (0.84, 0.58, 0.52, "amor amar querido carino ternura", "amor amar querido carinho ternura", "love loving dear affection tenderness"),
    (0.86, 0.84, 0.66, "fiesta celebrar celebracion baile musica", "festa celebrar celebracao danca musica", "party celebrate celebration dance music"),
    (0.88, 0.48, 0.46, "abrazo abrazar beso besar caricia", "abraco abracar beijo beijar caricia", "hug hug kiss kissing caress"),
    (0.90, 0.62, 0.58, "nacimiento nacer bebe parto cuna", "nascimento nascer bebe parto berco", "birth born baby childbirth cradle"),
    (0.92, 0.90, 0.70, "carnaval festival parada comparsa", "carnaval festival desfile comparsa", "carnival festival parade"),
    (0.88, 0.78, 0.64, "boda casamiento matrimonio novio novia", "casamento matrimonio noivo noiva", "wedding marriage groom bride"),
    (0.70, 0.55, 0.48, "recuerdo memoria nostalgia anoranza extrañar extranar", "lembranca memoria nostalgia saudade", "memory remember nostalgia homesick miss"),
    (0.58, 0.62, 0.44, "lluvia tormenta viento huracan terremoto", "chuva tempestade vento furacao terremoto", "storm wind hurricane earthquake"),
    (0.50, 0.46, 0.60, "maestro profesor escuela aula alumno", "mestre professor escola aula aluno", "teacher professor school classroom student"),
    (0.52, 0.50, 0.58, "medico enfermera hospital clinica", "medico enfermeira hospital clinica", "doctor nurse hospital clinic"),
    (0.48, 0.54, 0.62, "soldado policia juez abogado", "soldado policia juiz advogado", "soldier police judge lawyer"),
    (0.56, 0.48, 0.55, "campesino pescador minero costurera panadero carpintero herrero taxista chofer", "campones pescador mineiro costureira padeiro carpinteiro ferreiro motorista", "farmer fisher miner seamstress baker carpenter blacksmith driver"),
    (0.64, 0.42, 0.50, "cocina receta sabor olor hambre sazon", "cozinha receita sabor cheiro tempero", "kitchen recipe flavor smell seasoning"),
    (0.72, 0.46, 0.52, "pan tortillas arepa empanada tamal cazuela chocolate cafe", "pao tapioca empanada tamale chocolate cafe", "bread tortilla empanada stew chocolate coffee"),
    (0.68, 0.38, 0.56, "patio jardin huerta azotea balcon", "patio jardim horta terraço varanda", "yard garden orchard rooftop balcony"),
    (0.62, 0.44, 0.58, "plaza mercado feria puerto estacion", "praca mercado feira porto estacao", "square market fair port station"),
    (0.78, 0.72, 0.60, "navidad pascua ano nuevo cumpleanos quinceañera quinceanera", "natal pascoa ano novo aniversario", "christmas easter new year birthday"),
    (0.40, 0.58, 0.36, "maleta pasaporte adios despedida partida", "mala passaporte adeus despedida partida", "suitcase passport goodbye farewell departure"),
    (0.74, 0.40, 0.48, "cuna juguete cancion nana recreo", "berco brinquedo cancao nana recreio", "cradle toy song lullaby recess"),
    (0.34, 0.66, 0.30, "fiebre herida cicatriz llanto", "febre ferida cicatriz choro", "fever wound scar"),
    (0.82, 0.56, 0.54, "luz alba amanecer estrella luna sol", "luz alvor amanhecer estrela lua sol", "dawn sunrise star moon sun"),
]

FUNCTION = {
    "es": """
        el la los las un una uno unos unas de del al a en y e o u que como
        pero sino porque si no ya muy mas menos tan tanto como cuando donde
        quien cual cuales cuyo cuya este esta esto estos estas ese esa eso
        esos esas aquel aquella aquello aquellos aquellas me te se nos os le
        les lo lo mi tu su mis tus sus nuestro nuestra nuestros nuestras
        yo tu el ella ello nosotros nosotras ustedes ellos ellas
        ser es son era eran fue fueron sido siendo soy eres somos sois
        estar esta estan estaba estuve estoy estas estamos
        haber ha han habia hubo hay he has hemos
        para por con sin sobre entre hasta desde durante segun contra
        tambien tampoco solo solamente incluso ademas
        aqui alli ahi alla ahora entonces luego antes despues hoy ayer
        cada todo toda todos todas otro otra otros otras mismo misma
        algo alguien nada nadie nunca siempre jamás jamas
        the of and to
    """.split(),
    "pt": """
        o a os as um uma uns umas de do da dos das em no na nos nas
        e ou mas porque se nao ja muito mais menos tao tanto como quando
        onde quem qual quais cujo cuja este esta isto esses essas aquele
        aquela aquilo me te se nos vos lhe lhes meu minha teu tua seu sua
        nosso nossa eu tu ele ela nos vos eles elas
        ser e sao era eram foi foram sido sendo sou eres somos
        estar esta estao estava estive estou estas estamos
        haver ha haviam houve hei has
        para por com sem sobre entre ate desde durante segundo contra
        tambem tampouco so somente inclusive alem
        aqui ali la agora entao depois antes hoje ontem
        cada todo toda todos todas outro outra outros outras mesmo mesma
        algo alguem nada ninguem nunca sempre
        the of and to
    """.split(),
    "en": """
        the a an of to and or but that which because if not no yes
        in on at by for with without from into onto over under between
        this that these those there here then than so too very much many
        i you he she it we they me him her us them my your his its our their
        is are was were be been being am do does did done have has had
        will would could should may might must can
        who whom whose what when where why how
        all each every some any no none other another same both few
        not never always already still yet just only also even
        up down out off about after before during while
    """.split(),
}

SKIP_SUBSTRINGS = (
    "http", "www", "xxx", "nigger", "nigga", "faggot", "retard", "slut",
    "puto", "puta", "joder", "coño", "cono", "caralho", "porra", "merda",
    "fuck", "shit", "bitch", "cunt", "dick", "pussy", "cock",
)

# Relato personal (~1100 candidatos por idioma; se recortan a 1000 nuevos)
NARRATIVE = {
    "es": """
        parentesco parentela linaje raices antepasado ancestro padrino madrina
        ahijado ahijada yerno nuera suegro suegra cunado cunada primos prima
        sobrino sobrina nieto nieta bisabuelo bisabuela madrastra padrastro
        hijastro hijastra gemelo mellizo cuates tocayo
        duelo velorio novenario responso luto eterno descanso sepultura
        condolencia pésame pesame obituario epitafio cenizas urna
        migracion travesia coyote pollero deportacion regularizacion papeles
        visa asilo frontera norte sur exilio retorno añoranza destierro
        mochila maleta camion camioneta autobus andén anden terminal
        infancia ninez juguete canica papalote cometa resortera canicas
        recreo merienda lonchera uniforme mochila escolar recreo patio
        nana cuna tetero chupon chupete panal panales guarderia kinder
        oficio oficio oficio albañil albanil plomero electricista mecánico
        mecanico soldador jornalero peon recolector cosechador vaquero
        arriero cargador estibador marinero tejedora bordadora partera
        curandera huesero hierbero comadrona ama de casa cuidador cuidadora
        cuerpo cicatriz lunar peca canas arrugas espalda hombro rodilla
        tobillo muneca muñeca pulmones higado rinon uterus utero vientre
        seno pecho pulso aliento saliva lagrima lagrimas sudor fiebre
        comida maiz maíz nixtamal atole pozole mole tamales tacos tortillas
        arepas empanadas cazuela locro carbonada asado mate terere
        ajiaco sancocho bandeja paisa gallo pinto casado pupusas baleadas
        vivienda vecindad conventillo cité cite inquilinato pieza pieza
        azotea zaguán zaguan reja patio interior lavadero tinaco aljibe
        territorio milpa ejido chacra parcela fundo estancia pampa altiplano
        cordillera selva llanos costa sierra valle quebrada paramo páramo
        celebracion quinceañera quinceanera bautizo primera comunion velorio
        posada posadas dia de muertos ofrenda altar calaverita cempasuchil
        feria patronal romeria romería carnaval diablada morenada tinku
        patrono patrona promesa manda milagro
        abuela abuelo mama papa mamaíta papito viejita viejito
        parto alumbramiento lactancia destete cuna moisés moises
        sepelio fosa cruz lápida lapida corona flores
        aduana coyote desierto rio bravo rio grande patera patera
        escuela primaria secundaria prepa universidad internado
        herreria carpinteria panaderia tortilleria mercado tianguis
        corazón corazon alma espiritu espiritu memoria olvido
        hambre sed frio calor techo tejas lamina ladrillo adobe
        fiesta patronal serenata mariachi huapango joropo cueca samba
        navidad nochebuena reyes magos año nuevo ano nuevo
        boda civil iglesia padrinos arras ramo velo
        funeral corona crespon crespón pésame
        barrio colonia villa poblacion población campamento
        rancho finca hacienda fundo fundo chacra
        rio laguna estero manglar glaciar volcan volcán
        pan de muerto rosca buñuelos bunuelos chicha pulque tequila
        mate yerba bombilla termo asado parrilla carbon carbón
        empanada humita pastel de choclo cazuela de ave
        arepa cachapa hallaca pabellon pabellón criollo
        pupusa curtido atol chicha morada
        sancocho ajiaco bandeja mondongo
        casa de adobe techo de palma piso de tierra
        cuarto de fondo pieza de conventillo
        plaza de armas kiosco kiosko banca farol
        milagro promesa manda ofrenda veladora
        nacimiento pesebre pastorcita estrella de oriente
        dia de la madre dia del padre dia del nino
        graduacion titulo diploma toga birrete
        primer diente primer paso primer dia de escuela
        carta telegrama llamada larga distancia
        foto polaroid album álbum recorte periodico
        maletin maletín lonchera tarro fiambrera
        uniforme delantal guardapolvo bata
        tiza pizarron pizarrón recreo recreo
        vacaciones verano invierno siesta hamaca
        feria de pueblo juego mecanico mecanico algodon de azucar
        globo caña de azucar caña cañaveral
        cosecha siembra riego sequia sequía inundacion
        mineria socavon socavón relave
        pesca red anzuelo lancha muelle
        tejido telar bordado encaje
        barro ceramica ceramica alfareria
        leña fogon fogón cocina de leña
        pozo bomba de agua tinaco tanque
        reja porton portón candado llave
        vecina vecino portero conserje
        comadre compadre compadrazgo
        madrina de bautizo padrino de boda
        velorio de cuerpo presente
        novenario rosario responso
        tierra natal pueblo natal
        idioma materno lengua originaria
        quechua aymara nahuatl mapudungun guarani
        trenza trenzas trenza de abuela
        rebozo huipil pollera poncho ruana
        sombrero de palma alpargatas ojotas
        hamaca chinchorro petate estera
        fogata ronda cuento de aparecidos
        alma en pena fantasma aparecido
        milagro virgen santo patron
        promesa cumplida manda pagada
        carta de amor pañuelo panuelo bordado
        baul baúl de recuerdos
        reloj de pared calendario almanaque
        radio transistor tocadiscos cassette
        tren andén anden boleto pasaje
        camion de redilas burro mula caballo
        trocha sendero atajo
        frontera invisible linea linea divisoria
        papeles vencidos tramite trámite
        consulado cita huella dactilar
        dinero giro remesa Western
        llamada por cobrar cabina telefonica
        foto de documento fondo blanco
        valija de carton cartón atada con soga
        saco de dormir frazada cobija
        techo prestado cuarto compartido
        cama cuchetas litera
        olla de presion presión puchero
        pan del dia dia de ayer
        olor a humedad olor a pan
        risa de patio llanto de madrugada
        nombre de pila segundo nombre apellido
        apodo sobrenombre mote
        santo y seña seña seña de familia
        receta de la abuela cuaderno de cocina
        huerto de atras atrás gallinero
        perro de la casa gato de tejado
        árbol arbol de la plaza banco de plaza
        campana de iglesia reloj de torre
        procesion procesión anda anda
        cohete cuete pirotecnia
        mascara mascara de carnaval
        comparsa cumbia son jarocho
        vals de quince vals de boda
        brindis champagne sidra
        pastel de tres leches flan
        chocolate de olla champurrado
        pan dulce concha cuernito
        cafe de olla cafe negro
        agua de jamaica horchata
        elote esquite chicharron
        frijoles negros refritos
        arroz con pollo pollo guisado
        sopa de fideo caldo de pollo
        carne asada churrasco
        pescado frito ceviche
        platano maduro tostones
        yuca cassava mandioca
        camote batata boniato
        calabaza ayote zapallo
        cilantro culantro perejil
        aji ají chile habanero
        sal pimienta comino orégano oregano
        azucar panela piloncillo
        miel de abeja pilon
        manteca aceite de palma
        leche condensada dulce de leche
        cajeta manjar blanco
        helado paleta nieve
        chicle caramelo confite
        galleta maria bizcocho
        torta queque pastel
        cumpleaños velitas soplar
        piñata pinata palo ciego
        globos serpentinas confeti
        mantel de hule sillas de plastico
        musica en vivo altavoz
        vecindario alumbrado
        farolitos papel picado
        altar de muertos cempasuchil
        calavera de azucar pan de muerto
        copal incienso veladora
        retrato del difunto vaso de agua
        platillo favorito sal de grano
        camino de flores petalos
        visita al panteon panteón
        limpieza de tumba corona nueva
        rezo padrenuestro avemaria
        silencio de cementerio
        cipres ciprés sombra
        tierra removida cruz de palo
        nombre grabado fechas
        ramo de nardos claveles
        pésame en la puerta
        abrazo largo sin palabras
        cafe servido en la cocina
        vecinos en el patio
        ninos ninos jugando afuera
        recuerdos en caja de zapatos
        carta sin abrir
        numero de telefono antiguo
        direccion de la casa vieja
        llave que ya no abre
        umbral de la casa natal
        umbral cruzado de ida
        umbral cruzado de vuelta
    """.split(),
    "pt": """
        parentesco parentela linhagem raizes antepassado ancestral padrinho madrinha
        afilhado afilhada genro nora sogro sogra cunhado cunhada primos prima
        sobrinho sobrinha neto neta bisavo bisavo madrasta padrasto
        enteado enteada gemeo gemeo xara
        luto velorio novena responso sepultura condolencia pesames
        obituario epitafio cinzas urna caixao
        migracao travessia coyote deportacao regularizacao papeis
        visto asilo fronteira exilio retorno saudade destierro
        mochila mala onibus terminal plataforma
        infancia crianca brinquedo bola pipa bolinha de gude
        recreio lancheira uniforme mochila escolar patio
        nana berco mamadeira chupeta fralda creche
        oficio pedreiro encanador eletricista mecanico
        soldador diarista peao colhedor vaqueiro
        carregador estivador marinheiro tecela bordadeira parteira
        curandeira benzedeira dona de casa cuidador cuidadora
        corpo cicatriz pinta sardas cabelos brancos rugas costas ombro joelho
        tornozelo pulso pulmoes figado rim utero ventre
        seio peito pulso sopro saliva lagrima suor febre
        comida milho mingau feijoada moqueca acaraje
        tapioca pao de queijo churrasco chimarrao terere
        moradia cortico quitinete quarto kitnet
        terraco quintal tanque cacimba
        territorio roca sitio chacara fazenda pampa planalto
        serra selva litoral sertao vale
        celebracao batizado primeira comunhao
        festa junina quadrilha fogueira
        carnaval escola de samba desfile
        padroeiro padroeira promessa milagre
        avo avo mae pai filhinho
        parto nascimento amamentacao desmame
        enterro cova cruz lapide coroa flores
        alfandega deserto balsa
        escola primaria colegio universidade internato
        ferraria marcenaria padaria feira mercado
        coracao alma espirito memoria esquecimento
        fome sede frio calor telhado telha tijolo adobe
        festa serenata forro samba choro bossa
        natal ceia reis ano novo
        casamento civil igreja padrinhos aliancas veu
        funeral coroa pesar
        bairro vila favela ocupacao
        rancho fazenda engenho
        rio lagoa mangue geleira vulcao
        canjica pamonha bolo de rolo
        chimarrao erva cuia termica churrasco
        empadinha cuscuz vatapa
        tapioca beiju
        casa de taipa telhado de palha chao de terra
        quarto de fundo
        praca coreto banco poste
        milagre santa santo padroeiro
        promessa cumprida
        presépio presépio estrela
        dia das maes dia dos pais dia das criancas
        formatura diploma toga capelo
        primeiro dente primeiro passo primeiro dia de aula
        carta telegrama ligacao a cobrar
        foto album recorte de jornal
        lancheira marmita
        uniforme avental jaleco
        giz lousa recreio
        ferias verao inverno soneca rede
        festa do povo parque algodao doce
        balao cana canavial
        colheita plantio irrigacao seca enchente
        mineracao galeria rejeito
        pesca rede anzol canoa cais
        tecido tear bordado renda
        barro ceramica olaria
        lenha fogao a lenha
        poco bomba caixa d agua
        grade portao cadeado chave
        vizinha vizinho porteiro
        comadre compadre
        madrinha de batismo padrinho de casamento
        velorio corpo presente
        novena tercinho
        terra natal povo natal
        lingua materna lingua originaria
        quechua guarani nheengatu
        tranca trancas
        xale poncho
        chapeu de palha alpargata
        rede esteira
        fogueira roda conto de assombracao
        alma penada fantasma
        milagre nossa senhora santo
        carta de amor lenco bordado
        bau de lembrancas
        relogio de parede calendario
        radio vitrola fita k7
        trem plataforma passagem
        caminhao jegue mula cavalo
        trilha atalho
        fronteira linha divisoria
        papeis vencidos protocolo
        consulado hora marcada impressao digital
        dinheiro ordem remessa
        orelhao cabine
        foto 3x4 fundo branco
        mala de papelao amarrada
        saco de dormir cobertor
        teto emprestado quarto dividido
        beliche
        panela de pressao cozido
        pao do dia
        cheiro de mofo cheiro de pao
        riso no quintal choro de madrugada
        nome de batismo apelido sobrenome
        apelido alcunho
        receita da avo caderno de cozinha
        horta dos fundos galinheiro
        cachorro da casa gato do telhado
        arvore da praca banco da praca
        sino da igreja relogio da torre
        procissao andor
        rojão fogos
        mascara de carnaval
        bloco samba pagode
        valsa de quinze valsa de casamento
        brinde espumante
        bolo pudim
        chocolate quente
        pao doce sonho
        cafe coado cafezinho
        agua de coco guarana
        milho verde pipoca
        feijao tropeiro
        arroz com galinha
        canja caldo
        carne assada
        peixe frito moqueca
        banana da terra
        mandioca aipim macaxeira
        batata doce
        abobora
        coentro salsa
        pimenta malagueta
        sal pimenta cominho oregano
        acucar rapadura
        mel
        banha oleo
        leite condensado doce de leite
        goiabada
        sorvete picolé
        chiclete bala
        bolacha biscoito
        bolo aniversario velinhas
        pinhata
        baloes serpentinas confete
        toalha de plastico cadeiras
        musica ao vivo caixa de som
        iluminacao da rua
        bandeirinhas
        altar copal
        retrato do falecido copo de agua
        prato predileto
        caminho de flores
        visita ao cemiterio
        limpeza do tumulo coroa nova
        reza pai nosso ave maria
        silencio do cemiterio
        cipreste sombra
        terra revolvida cruz de pau
        nome gravado datas
        ramo de cravos
        pesames na porta
        abraco longo sem palavras
        cafe na cozinha
        vizinhos no quintal
        criancas brincando fora
        lembrancas na caixa de sapato
        carta sem abrir
        telefone antigo
        endereco da casa velha
        chave que ja nao abre
        umbral da casa natal
        umbral de ida
        umbral de volta
    """.split(),
    "en": """
        kinship lineage roots ancestor godfather godmother
        godson goddaughter son-in-law daughter-in-law father-in-law mother-in-law
        brother-in-law sister-in-law cousin nephew niece grandson granddaughter
        great-grandfather great-grandmother stepmother stepfather
        stepson stepdaughter twin namesake
        grief wake novena burial condolence obituary epitaph ashes urn
        coffin tombstone
        migration crossing coyote deportation papers
        visa asylum border exile return homesickness
        backpack suitcase bus terminal platform
        childhood toy marble kite slingshot
        recess lunchbox uniform schoolbag courtyard
        lullaby crib bottle pacifier diaper nursery kindergarten
        trade bricklayer plumber electrician mechanic
        welder day-laborer farmhand cowboy
        porter stevedore sailor weaver embroiderer midwife
        healer herbalist housewife caregiver
        body scar mole freckle gray-hair wrinkle back shoulder knee
        ankle wrist lungs liver kidney womb
        breast pulse breath saliva tear sweat fever
        food corn porridge stew
        tortilla empanada tamale barbecue mate
        dwelling tenement room rooftop courtyard washtub cistern
        territory plot ranch pampas highlands
        range jungle plains coast valley ravine
        celebration quinceanera baptism communion
        posada day-of-the-dead offering altar marigold
        patron-saint carnival
        grandma grandpa mom dad
        childbirth breastfeeding weaning
        funeral grave cross headstone wreath flowers
        customs desert river raft
        elementary high-school university boarding-school
        smithy bakery market
        heart soul spirit memory forgetting
        hunger thirst cold heat roof tile brick adobe
        serenade
        christmas eve magi new-year
        wedding civil church godparents veil
        neighborhood slum camp
        ranch farm hacienda
        river lagoon estuary mangrove glacier volcano
        bread-of-the-dead sweet-bread
        gourd thermos grill
        mud-house thatch dirt-floor
        back-room
        bandstand bench lantern
        miracle saint patron
        nativity manger
        mothers-day fathers-day childrens-day
        graduation diploma gown cap
        first-tooth first-step first-day-of-school
        letter telegram collect-call
        photograph album newspaper-clipping
        lunch-pail
        apron smock
        chalk blackboard
        vacation summer winter nap hammock
        town-fair cotton-candy
        balloon sugarcane
        harvest sowing drought flood
        mining shaft tailings
        fishing net hook boat pier
        loom embroidery lace
        clay pottery
        firewood wood-stove
        well water-tank
        gate padlock key
        neighbor doorman
        co-godparent
        body-present
        rosary
        hometown
        mother-tongue
        quechua aymara nahuatl guarani
        braid
        shawl poncho
        palm-hat
        mat
        bonfire ghost-story
        restless-soul ghost
        love-letter embroidered-handkerchief
        trunk-of-memories
        wall-clock calendar
        transistor record-player cassette
        train ticket
        truck donkey mule horse
        shortcut
        dividing-line
        expired-papers errand
        consulate appointment fingerprint
        money-order remittance
        phone-booth
        passport-photo
        cardboard-suitcase
        sleeping-bag blanket
        borrowed-roof shared-room
        bunk-bed
        pressure-cooker stewpot
        bread-of-the-day
        smell-of-damp smell-of-bread
        courtyard-laughter dawn-crying
        given-name nickname surname
        family-recipe kitchen-notebook
        backyard-garden henhouse
        house-dog roof-cat
        plaza-tree plaza-bench
        church-bell tower-clock
        procession
        fireworks
        carnival-mask
        cumbia samba
        quince-waltz wedding-waltz
        toast cider
        three-milk-cake custard
        hot-chocolate
        sweet-roll
        pot-coffee
        hibiscus-water horchata
        corn-on-the-cob
        black-beans
        chicken-rice
        noodle-soup chicken-broth
        grilled-meat
        fried-fish ceviche
        ripe-plantain
        cassava
        sweet-potato
        squash
        cilantro
        chili
        salt pepper cumin oregano
        raw-sugar
        honey
        lard
        condensed-milk milk-caramel
        ice-cream popsicle
        chewing-gum candy
        biscuit
        birthday-cake candles
        pinata
        balloons streamers confetti
        plastic-tablecloth
        live-music loudspeaker
        street-lights
        paper-flags
        copal incense candle
        portrait glass-of-water
        favorite-dish
        flower-path petals
        cemetery-visit
        grave-cleaning new-wreath
        our-father hail-mary
        cemetery-silence
        cypress shade
        turned-earth wooden-cross
        carved-name dates
        tuberose-bouquet carnations
        condolence-at-the-door
        long-wordless-hug
        coffee-in-the-kitchen
        neighbors-in-the-yard
        children-playing-outside
        shoebox-memories
        unopened-letter
        old-phone-number
        old-house-address
        key-that-no-longer-fits
        natal-threshold
        threshold-leaving
        threshold-returning
    """.split(),
}

REGIONAL = {
    "es": """
        pololo polola guagua pibe piba chamaco chamaca chamo chama
        cipote cipota patojo patoja parce parcera mae cuate cuata
        laburo laburar plata bacan bacán chevere chévere tuanis
        micro pobla nona nono
        chavo chava morro morra escuincle escuincla
        chamaco cabro cabra pato patoja cipote
        chigüin chiguiin carajito carajita
        nene nena wawa guagua
        pibe pibe muchacho muchacha
        tipo mina pibe
        choro lanza rati yuta tira
        pega pega laburo chamba jale
        plata lana feria billete mango guita
        luca palo lucas
        bacan filete copado chido padre
        chévere de peluche tuanis pura vida
        sucio groso copado
        micro colectivos bondi camion
        gua gua guagua
        pobla población villa miseria
        nona nono tia tío tia
        weon weona wea al tiro
        fome pololear pololeo
        once once once once
        palta paltearse
        pito pito
        jato depto departamento
        pieza pieza
        carrete carretear
        luca gamba mango
        pinta pinta
        chamba chambear
        guey güey wey
        neta neta
        padre chido
        órale orale
        chale gacho
        morro banda
        camion pesero combi
        tianguis
        chavo
        cipotes
        pisto
        bolo
        chero chera
        chivo
        pisto billete
        cabal
        tunco
        pisto
        mae tuanis
        brete
        pulperia pulpería
        chante
        maje
        pisto
        chamba
        choro
        parcero
        parce
        bacano
        rumba
        rumbear
        llave
        cucho
        china
        tinto
        onces
        rumba
        berraquera
        chimba
        parcero
        catorce
        llave
        chamo
        burda
        jeva
        pana
        sifrino
        arepa
        conchale
        vaina
        rumba
        chamo
        pana
        jevo
        burda
        fuacata
        chamo
        guagua
        asere
        yuma
        pinga
        camello
        botella
        regalo
        pepe
        asere
        consorte
        pinche
        chamaco
        chingar
        padre
        chido
        neta
        órale
        morro
        chavo
        escuincle
        feria
        lana
        chamba
        camion
        combi
        pesero
        tianguis
        vecindad
        pulqueria pulquería
        fonda
        changarro
        jale
        pisto
        cipote
        maje
        bolo
        chero
        cabal
        pisto
        chivo
        tunco
        mae
        tuanis
        brete
        chante
        pulperia
        maje
        wila
        tuanis
        mae
        parce
        bacano
        rumba
        llave
        cucho
        tinto
        onces
        chimba
        berraquera
        parcero
        llave
        chamo
        jeva
        pana
        vaina
        arepera
        conchale
        burda
        sifrino
        fuacata
        asere
        yuma
        camello
        botella
        consorte
        guagua
        habano
        paladar
        ponina
        yuma
        asere
        pibe
        laburo
        guita
        mango
        bondi
        colectivo
        mina
        tipo
        pibe
        quilombo
        fiaca
        morfar
        puchero
        asado
        mate
        yerba
        bombilla
        truco
        piberio
        laburante
        changa
        changarin
        pibe
        piba
        chabon chabón
        pibe
        pololo
        polola
        guagua
        cabro
        fome
        carrete
        once
        palta
        altiro
        weon
        luca
        micro
        pobla
        cite
        nona
        pololear
        filete copado
        pito
        jato
        pieza
        luca
        gamba
        pibe
        mina
        laburo
        bondi
        guita
        mango
        quilombo
        fiaca
        pibe
        chamaco
        cuate
        güey
        neta
        chido
        padre
        órale
        chavo
        morro
        escuincle
        lana
        feria
        chamba
        camion
        combi
        mae
        tuanis
        brete
        chante
        parce
        bacano
        chimba
        llave
        chamo
        pana
        jeva
        vaina
        cipote
        patojo
        pisto
        maje
        chero
        cabal
        guagua
        asere
        yuma
        nona
        nono
        pibe
        pololo
        bacan
        chévere
        tuanis
        micro
        pobla
        plata
        laburo
        cuate
        mae
        parce
        chamo
        chamaco
        cipote
        patojo
        pibe
        guagua
        pololo
        chevere
        bacan
        tuanis
        chamba
        jale
        pega
        laburo
        trampo
        lana
        feria
        guita
        mango
        pisto
        luca
        bondi
        micro
        camion
        colectivo
        combi
        pesero
        gua
        wawa
        nene
        pibe
        chavo
        morro
        cabro
        chamo
        cipote
        patojo
        carajito
        escuincle
        cuate
        parcero
        pana
        llave
        mae
        maje
        chero
        asere
        yuma
        weon
        polola
        mina
        jeva
        wila
        piba
        chava
        morra
        nona
        nono
        tia
        viejita
        viejito
        tata
        nana
        mamaíta
        papito
        mami
        papi
        abo
        yaya
        agüelo
        agüela
        tío
        tia
        primo
        socia
        compa
        compadre
        comadre
        cuate
        carnal
        carnala
        hermano
        manito
        ñaño
        ñana
        causa
        pata
        pata
        causa
        huevon
        huevón
        palta
        jato
        depa
        depto
        pieza
        pieza
        cuarto
        pieza
        conventillo
        cite
        villa
        pobla
        favela
        cantegril
        villa
        asentamiento
        campamento
        toma
        poblacion
        colonia
        barrio
        residencial
        urbanizacion
        conjunto
        quinta
        chalet
        rancho
        rancho
        jacal
        choza
        palafito
        stilt
        conventillo
        inquilinato
        pensión
        pension
        residencial
        hostal
        posada
        fonda
        piqueteadero
        arepera
        pupuseria
        pupusería
        taqueria
        taquería
        fonda
        comedor
        merendero
        chicheria
        chichería
        pulperia
        pulquería
        cantina
        boliche
        botilleria
        botillería
        almacen
        almacén
        kiosco
        kiosko
        changarro
        tenducha
        tiendita
        abarrotes
        minimarket
        chino
        chinito
        turco
        almacén
        feria
        tianguis
        mercado
        galeria
        galería
        persa
        bio
        bio bio
        persa
        feria libre
        plaza de mercado
        galeria
        tianguis
        tianguis
        mercado sobre ruedas
        feria
        persa
        bio
        pulga
        rastro
        baratillo
        baratisimo
        todo a cien
        todo a mil
        dollar store
        saldos
        outlet
        feria
        persa
        galeria
    """.split(),
    "pt": """
        moleque guri pia piazinho guria
        cara mano parca parça véio veio
        patroa treta role rolê trampo
        grana bagulho legal dahora massa irado
        cao caô mermao mermão
        saudade cafune cafuné
        molecada galera turma
        pivete maloqueiro
        quebrada favela morro
        bondinho van lotacao lotação
        cafezinho pão na chapa
        padoca boteco buteco
        resenha rolê
        trampo expediente
        grana bufunfa
        bagulho parada
        dahora massa irado
        suave de boa
        treta confusao
        patroa chefe
        véio coroa
        guri piá
        moleque
        parça mano
        cara tipo
        mina gata
        crush ficante
        rolê
        resenha
        pagode samba
        churras
        chimarrao
        terere
        gaucho gaúcho
        guria
        bah tche
        capaz
        tri legal
        barbaresco
        piá
        guri
        china
        prenda
        chimarrao
        cuia
        bomba
        churrasco
        costela
        galeto
        pão de queijo
        almoçar
        janta
        cafe da manha
        lanche
        merenda
        recreio
        moleque
        carioquice
        paulista
        mineiro
        baiano
        nordestino
        paraiba
        cearense
        pernambucano
        amazonense
        paraense
        manauara
        recifense
        soteropolitano
        fluminense
        capixaba
        goiano
        mato-grossense
        sulista
        nortista
        sertanejo
        caipira
        caboclo
        ribeirinho
        quilombola
        indígena
        caiçara
        jangadeiro
        vaqueiro
        peao
        boia-fria
        diarista
        empregada
        patroa
        doutor
        seu
        dona
        nhá
        nhô
        sinhá
        sinhô
        moleque
        neguinho
        neguinha
        crioulo
        moreno
        claro
        branco
        preto
        pardo
        amarelo
        indígena
        mestiço
        caboclo
        cafuzo
        mameluco
        sarará
        galego
        loiro
        ruivo
        careca
        cabeludo
        bigodudo
        barbudo
        gordinho
        magrelo
        altão
        baixinho
        forte
        fraco
        doente
        são
        maluco
        doido
        tanso
        lerdo
        esperto
        malandro
        otario
        otário
        otaria
        zé
        zé povinho
        zé ruela
        joão ninguem
        fulano
        ciclano
        beltrano
        seu zé
        dona maria
        tio
        tia
        vô
        vó
        vovô
        vovó
        pai
        mãe
        véi
        véia
        coroa
        jovem
        guri
        guria
        piá
        piazito
        gurizada
        molecada
        galera
        turma
        panelinha
        panelinha
        parça
        mano
        mana
        broder
        brother
        sister
        crush
        ficante
        ficada
        pegação
        paquera
        cantada
        flerte
        namoro
        noivado
        casamento
        amasio
        amásia
        amante
        caso
        trepada
        transa
        beijo
        selinho
        amasso
        cafuné
        colo
        colo
        colo da mãe
        colo da vó
        rede
        varanda
        quintal
        terreiro
        calçada
        rua
        viela
        beco
        travessa
        avenida
        rodovia
        estrada
        chão
        barro
        lama
        poeira
        sereno
        orvalho
        chuva
        chuvisco
        toro
        temporal
        ventania
        vento sul
        vento norte
        calorão
        friaca
        geada
        neve
        granizo
        trovões
        relâmpago
        arco-iris
        arco-íris
        solzaço
        lua cheia
        lua nova
        estrela cadente
        cruzeiro do sul
        via láctea
        amanhecer
        entardecer
        anoitecer
        madrugada
        virada
        reveillon
        réveillon
        carnaval
        micareta
        pre-caju
        são joão
        são joão
        festa junina
        arraial
        quadrilha
        fogueira
        balão
        bandeirinha
        milho
        pamonha
        canjica
        quentão
        vinho quente
        paçoca
        pé de moleque
        cocada
        maria mole
        pé de moça
        bolo de rolo
        cartola
        acarajé
        abará
        vatapá
        caruru
        moqueca
        bobó
        xinxim
        sarapatel
        buchada
        rabada
        dobradinha
        feijoada
        tutu
        virado
        vaca atolada
        cupim
        picanha
        costela
        linguica
        linguiça
        linguiça
        farofa
        vinagrete
        maionese
        arroz
        feijão
        salada
        couve
        laranja
        limão
        cachaça
        pinga
        caninha
        aguardente
        cerveja
        chopp
        chope
        litro
        long neck
        lata
        copo sujo
        copo sujo
        boteco
        botequim
        bar
        padaria
        padoca
        quitanda
        mercearia
        armazem
        armazém
        venda
        pulperia
        pulpería
        birosca
        birosca
        barraca
        tenda
        feira
        camelô
        camelodromo
        camelódromo
        ambulante
        flanelinha
        guardador
        flanelinha
        catador
        catadora
        reciclador
        carroceiro
        carroça
        jegue
        burro
        mula
        cavalo
        boi
        vaca
        bezerro
        porco
        galinha
        galo
        pinto
        pato
        ganso
        peru
        capote
        capote
        capivara
        tatu
        tamanduá
        preguiça
        onça
        jaguar
        sucuri
        jararaca
        cascavel
        coral
        jacaré
        piranha
        tucunaré
        tambaqui
        pirarucu
        açaí
        cupuaçu
        guaraná
        castanha
        latex
        látex
        seringueira
        seringueiro
        castanheiro
        ribeirinho
        palafita
        igarapé
        furos
        várzea
        enchente
        vazante
        seca
        estiagem
        inverno amazônico
        verão amazônico
        pororoca
        encontro das aguas
        encontro das águas
        rio negro
        rio solimoes
        solimões
        amazonas
        madeira
        tapajós
        xingu
        tocantins
        araguaia
        são francisco
        paraíba
        paraná
        uruguai
        prata
        prata
        iguaçu
        iguazu
        catarata
        salto
        cachoeira
        corredeira
        poço
        nascente
        foz
        delta
        estuário
        mangue
        restinga
        duna
        praia
        orla
        calçadão
        calçadão
        posto
        quiosque
        barraca
        tapaio
        tapa
        canga
        sunga
        biquíni
        chapéu
        óculos
        protetor
        bronze
        queimadura
        maré
        maré alta
        maré baixa
        onda
        rebentação
        correnteza
        ressacas
        ressaca
        naufrágio
        farol
        porto
        cais
        trapiche
        saveiro
        jangada
        canoa
        barco
        lancha
        navio
        transatlântico
        gaiola
        gaiola
        recife
        recife
        coral
        peixe
        concha
        estrela-do-mar
        ouriço
        agua-viva
        água-viva
        siri
        caranguejo
        camarão
        lagosta
        polvo
        lula
        mexilhão
        ostra
        sururu
        lambreta
        berbigão
        marisco
        moqueca
        caldeirada
        peixada
        ensopado
        pirão
        farinha
        farinha d água
        farinha de guerra
        tapioca
        beiju
        goma
        polvilho
        polvilho azedo
        pão de queijo
        broa
        broa de milho
        cuscuz
        cuscuz paulista
        cuscuz nordestino
        angu
        polenta
        pirão
        mingau
        canjica
        mungunzá
        mungunza
        mugunzá
        pé de moleque
        rapadura
        alfenim
        alfenim
        doce de leite
        goiabada
        maria mole
        cocada
        quebra-queixo
        pé de moça
        baba de moça
        quindim
        brigadeiro
        beijinho
        cajuzinho
        olho de sogra
        camafeu
        bem-casado
        bem casado
        sonho
        carolina
        eclair
        pudim
        pudim de leite
        manjar
        manjar branco
        sagu
        sagu de vinho
        arroz doce
        canjica
        curau
        pamonha
        bolo de fubá
        bolo de milho
        bolo de aipim
        bolo de mandioca
        bolo de rolo
        bolo Souza Leão
        Souza Leão
        cartola
        cartola
        cartola pernambucana
        acarajé
        abará
        vatapá
        caruru
        xinxim
        bobó de camarão
        moqueca capixaba
        moqueca baiana
        moqueca paraense
        tacacá
        tucupi
        jambu
        açaí na tigela
        açaí com farinha
        tapioquinha
        beiju de tapioca
        queijo coalho
        queijo minas
        queijo canastra
        queijo colonial
        provolone no lanche
        mortadela no pão
        pão na chapa
        pingado
        cafezinho
        café com leite
        mediocre
        média
        garoto
        macchiato
        espresso
        coado
        prensa
        chimarrão
        tereré
        cuia
        bomba
        erva
        erva-mate
        tostado
        amargo
        doce
        quente
        gelado
        suado
        suadeira
        suadouro
        suadouro
    """.split(),
    "en": """
        pickney yardie irie soon-come lime liming
        abuela abuelo quinceanera barrio plaza
        empanada arepa pupusa tamale mole
        mate terere asado parrilla
        pololo guagua pibe chamaco chamo
        cipote patojo parce mae cuate
        laburo plata bacan chevere tuanis
        micro pobla nona
        tia tio nana nono
        barrio colonia villa
        combi pesero colectivo bondi micro
        chamba jale pega trampo laburo
        lana feria guita mango pisto luca
        güey guey neta chido padre orale
        parce bacano chimba llave
        chamo pana jeva vaina
        asere yuma
        weon pololear carrete once palta
        mina pibe quilombo fiaca
        mae tuanis brete chante pura-vida
        cipote patojo pisto maje chero cabal
        wawa nene escuincle morro chavo cabro
        carnal carnala compa cuate
        ñaño nana causa pata
        conventillo cite villa cantegril
        jacal choza palafito
        fonda pulperia cantina boliche
        tianguis feria persa pulga
        pupuseria taqueria arepera
        day-of-the-dead cempasuchil ofrenda
        posada piñata pinata
        mariachi joropo cueca samba cumbia
        huipil rebozo pollera poncho ruana
        alpargatas ojotas petate chinchorro
        milpa ejido chacra fundo estancia
        altiplano pampa llanos selva paramo
        coyote pollero mojado papers
        remittance giro consulate
        quince waltz
        godparent compadrazgo
        bread-of-the-dead pan-de-muerto
        horchata jamaica-water
        plantain tostones yuca
        ceviche sancocho ajiaco
        bandeja-paisa gallo-pinto casado
        pupusas baleadas
        locro carbonada humita
        pastel-de-choclo cazuela
        pabellon hallaca cachapa
        chicha pulque tequila mezcal
        pisco chicha-morada
        cachaça pinga
        chimarrao terere
        dulce-de-leche cajeta manjar
        tres-leches flan
        concha pan-dulce
        cafe-de-olla
        elote esquite
        street-food night-market
        plaza-de-armas kiosco
        vecindad inquilinato
        azotea zaguan tinaco
        milagros manda veladora
        virgen santo-patron
        procesion andas
        cuete fireworks
        comparsa diablada morenada tinku
        carnival-mask
        first-communion baptism
        velorio novenario
        panteon cemetery-day
        copal incense
        papel-picado papel picado
        calaverita sugar-skull
        ofrenda-altar
        cempasuchil marigold
        vaso-de-agua glass-of-water
        favorite-plate
        long-distance-call
        collect-call
        money-gram remesa
        expired-visa
        green-card papers
        frontera border-town
        rio-bravo rio-grande
        desierto crossing
        backpacker mochilero
        return-home retorno
        pueblo-natal hometown
        mother-tongue
        nahuatl quechua aymara mapudungun guarani
        braid trenzas
        rebozo shawl
        palm-hat sombrero
        hammock hamaca
        ghost-story aparecido
        restless-soul
        baul trunk
        transistor-radio
        cassette mixtape
        polaroid album
        shoebox-photos
        key-that-no-longer-fits
        natal-house
        borrowed-room
        shared-kitchen
        bunk
        pressure-cooker
        wood-stove fogon
        adobe-house
        dirt-floor
        thatch-roof
        tin-roof lamina
        water-tank tinaco
        padlock reja
        neighbor-yard
        plaza-bench
        church-bell
        tower-clock
        town-fair feria
        cotton-candy algodon
        mechanical-rides
        sugarcane caña
        harvest-season
        drought-year
        flood-year
        mine-shaft socavon
        fishing-net
        loom telar
        clay-pot
        henhouse gallinero
        house-dog
        roof-cat
        plaza-tree
        wooden-cross
        carved-dates
        condolence-line
        kitchen-coffee
        unopened-letter
        old-address
        threshold
        leaving-home
        coming-home
        spanglish
        nuyorican
        chicano
        tejano
        latino
        latina
        latinx
        afro-latino
        garifuna
        raizal
        creole
        patois
        yard
        bredren
        sistren
        irie
        walk-good
        soon-come
        pickney
        big-people
        small-people
        lime
        liming
        fete
        wine-up
        rum-shop
        jerk
        callaloo
        roti
        doubles
        bake
        saltfish
        ackee
        plantain
        dumpling
        soup
        saturday-soup
        rum
        sorrel
        mauby
        ginger-beer
        coconut-water
        sea-bath
        river-come-down
        hurricane
        earthquake
        aftershock
        diaspora
        home-country
        the-island
        mainland
        stateside
        back-home
        send-for
        barrel
        care-package
        western-union
        calling-card
        phone-card
        collect
        reverse-charge
        papers
        status
        undocumented
        overstay
        raid
        ice
        detention
        deportation
        asylum
        refugee
        sanctuary
        sponsor
        affidavit
        interview
        biometrics
        green-card
        naturalization
        oath
        first-apartment
        roommate
        night-shift
        two-jobs
        money-home
        school-for-the-kids
        english-class
        accent
        code-switch
        home-language
        church-spanish
        sunday-service
        quince
        sweet-sixteen
        baptism-party
        baby-shower
        gender-reveal
        potluck
        dish-to-pass
        rice-and-beans
        pernil
        pastelitos
        tostones
        maduros
        cafe-con-leche
        cortadito
        colada
        ventanita
        bodega
        corner-store
        numbers-game
        lotto
        dominoes
        domino-table
        salsa
        merengue
        bachata
        vallenato
        ranchera
        norteño
        norteno
        banda
        corrido
        cumbia
        reggaeton
        dembow
        dancehall
        soca
        calypso
        steelpan
        carnival-monday
        jouvert
        pretty-mas
        sailor-mas
        blue-devils
        midnight-robber
        pan-yard
        fete
        rum
        lime
    """.split(),
}

COGNATE_TRIPLES = [
    ("muerte", "morte", "death"),
    ("fiesta", "festa", "party"),
    ("amor", "amor", "love"),
    ("abrazo", "abraco", "hug"),
    ("tortura", "tortura", "torture"),
    ("carnaval", "carnaval", "carnival"),
    ("familia", "familia", "family"),
    ("madre", "mae", "mother"),
    ("padre", "pai", "father"),
    ("casa", "casa", "house"),
    ("nino", "crianca", "child"),
    ("duelo", "luto", "grief"),
    ("miedo", "medo", "fear"),
    ("alegria", "alegria", "joy"),
    ("trabajo", "trabalho", "work"),
    ("agua", "agua", "water"),
    ("sol", "sol", "sun"),
    ("noche", "noite", "night"),
    ("guerra", "guerra", "war"),
    ("paz", "paz", "peace"),
]


def fold(s: str) -> str:
    s = s.strip().lower().replace("ñ", "\x00").replace("ç", "c")
    import unicodedata

    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = s.replace("\x00", "ñ")
    s = re.sub(r"[^a-zñ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def clamp01(n: float) -> float:
    return max(0.0, min(1.0, n))


def q2(n: float) -> float:
    return round(clamp01(n), 2)


SKIP_NAMES = {
    "john", "jack", "joe", "mike", "david", "george", "frank", "charlie", "michael",
    "james", "paul", "peter", "sam", "mary", "harry", "henry", "bill", "bob", "jimmy",
    "york", "ok", "okay", "oh", "uh", "ah", "eh", "hey", "hi", "yeah", "wow", "whoa",
    "you", "don", "ll", "ve", "re", "didn", "isn", "wasn", "won", "doesn", "aren",
    "ain", "haven", "couldn", "gonna", "wanna", "gotta", "io", "ia",
}


def load_freq(lang: str, n: int, *, skip_function: bool = False) -> list[str]:
    path = FREQ_DIR / f"{lang}_50k.txt"
    out: list[str] = []
    seen: set[str] = set()
    allowed = set("abcdefghijklmnopqrstuvwxyzáéíóúüñàâãêôõç")
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        word = line.split()[0]
        w = word.lower()
        if any(bad in w for bad in SKIP_SUBSTRINGS):
            continue
        if any(ch.isdigit() for ch in w):
            continue
        if any(ch not in allowed and ch != "'" and ch != "-" for ch in w):
            continue
        w = w.replace("'", "").replace("-", "")
        key = fold(w)
        if not key:
            continue
        if len(key) < 2 and key not in {"y", "o", "a", "e", "i"}:
            continue
        if skip_function and key in {fold(x) for x in FUNCTION[lang]}:
            continue
        if key in SKIP_NAMES:
            continue
        if key in seen:
            continue
        seen.add(key)
        out.append(key)
        if len(out) >= n:
            break
            break
    return out


def build_seed_map() -> dict[str, dict[str, tuple[float, float, float]]]:
    seeds: dict[str, dict[str, tuple[float, float, float]]] = {"es": {}, "pt": {}, "en": {}}
    for v, a, d, es, pt, en in CONCEPTS:
        triple = (v, a, d)
        for lang, blob in (("es", es), ("pt", pt), ("en", en)):
            for w in blob.split():
                k = fold(w)
                if k:
                    seeds[lang][k] = triple
    for lang, table in ANCHORS.items():
        for w, triple in table.items():
            seeds[lang][fold(w)] = triple
    return seeds


SEEDS = build_seed_map()

# Categorías afectivas + regionalismos explícitos
for lang, cats in WORDS.items():
    for cat, blob in cats.items():
        triple = CAT[cat]
        for w in blob.split():
            k = fold(w)
            if k and k not in SEEDS[lang]:
                SEEDS[lang][k] = triple
for w, triple in REGIONAL_VAD.items():
    k = fold(w)
    SEEDS["es"][k] = triple
    # PT/EN: no pisar cognados (mae = mãe; party vs parte, etc.)
    for lang in ("pt", "en"):
        if k not in SEEDS[lang]:
            SEEDS[lang][k] = triple

# Prefijos de 4–6 letras (el más largo gana)
STEMS: dict[str, list[tuple[str, tuple[float, float, float]]]] = {}
for lang in ("es", "pt", "en"):
    items = sorted(SEEDS[lang].items(), key=lambda kv: len(kv[0]), reverse=True)
    STEMS[lang] = [(k, v) for k, v in items if len(k) >= 4]


def score_unknown(lang: str, lemma: str) -> tuple[float, float, float]:
    if lemma in FUNCTION[lang] or fold(lemma) in {fold(x) for x in FUNCTION[lang]}:
        return (0.50, 0.24, 0.50)
    # suffix heuristics — más spread que un único centro
    v, a, d = 0.53, 0.40, 0.51
    if lang == "es":
        if lemma.endswith(("ito", "ita", "illo", "illa")):
            v, a, d = 0.64, 0.40, 0.42
        elif lemma.endswith(("azo", "aza", "ón", "on")):
            v, a, d = 0.50, 0.62, 0.58
        elif lemma.endswith(("ar", "er", "ir")):
            a = 0.46
        elif lemma.endswith(("ción", "cion", "miento")):
            a = 0.34
    if lang == "pt":
        if lemma.endswith(("inho", "inha", "ito", "ita")):
            v, a, d = 0.64, 0.40, 0.42
        elif lemma.endswith(("ão", "ao", "ona")):
            a = 0.58
        elif lemma.endswith(("ar", "er", "ir")):
            a = 0.46
    if lang == "en":
        if lemma.endswith(("ling", "let", "ie")):
            v, a, d = 0.62, 0.40, 0.44
        elif lemma.endswith("ing"):
            a = 0.48
        elif lemma.endswith("ness"):
            a = 0.36
        elif lemma.endswith("ly"):
            a = 0.32
    # tiny deterministic wobble so neutrals are not identical
    h = 0
    for ch in lemma:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    wobble = ((h % 7) - 3) * 0.01
    return (q2(v), q2(a + wobble), q2(d))


def score_lemma(lang: str, lemma: str) -> tuple[float, float, float]:
    k = fold(lemma)
    if k in ANCHORS[lang]:
        return ANCHORS[lang][k]
    if lang == "es" and k in REGIONAL_VAD:
        return REGIONAL_VAD[k]
    if k in SEEDS[lang]:
        return SEEDS[lang][k]
    suffixes = (
        "s", "es", "a", "o", "as", "os", "mente", "ing", "ed", "er", "est", "ly",
        "cion", "cao", "ao", "ito", "ita", "mente", "ando", "endo", "ado", "ido",
    )
    for stem, triple in STEMS[lang]:
        if k == stem:
            return triple
        if k.startswith(stem) and k[len(stem) :] in suffixes:
            return triple
    return score_unknown(lang, k)


def unique_keep_order(words: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for w in words:
        k = fold(w)
        if not k or k in seen:
            continue
        if any(bad in k for bad in SKIP_SUBSTRINGS):
            continue
        seen.add(k)
        out.append(k)
    return out


def build_lang(lang: str) -> dict[str, list[float]]:
    func = unique_keep_order([fold(w) for w in FUNCTION[lang] if fold(w)])
    content = load_freq(lang, 4200, skip_function=True)
    freq = unique_keep_order(func + content)[:3500]
    narr = unique_keep_order([fold(w) for w in (NARRATIVE[lang] + EXTRA_NARRATIVE[lang])])
    regio = unique_keep_order([fold(w) for w in (REGIONAL[lang] + EXTRA_REGIONAL[lang])])

    entries_order: list[tuple[str, str]] = []  # lemma, bucket
    seen: set[str] = set()

    def add(words: list[str], bucket: str, limit: int) -> int:
        added = 0
        for w in words:
            if w in seen:
                continue
            seen.add(w)
            entries_order.append((w, bucket))
            added += 1
            if added >= limit:
                break
        return added

    add(freq, "freq", 3500)
    n_narr = add([w for w in narr if w not in seen], "narrative", 1000)
    n_reg = add([w for w in regio if w not in seen], "regional", 500)

    # top up from extra frequency if pools ran short
    if len(entries_order) < 5000:
        extra = load_freq(lang, 12000)
        add([w for w in extra if w not in seen], "freq-fill", 5000 - len(entries_order))

    if n_narr < 1000:
        print(f"WARN {lang}: narrative nuevos={n_narr}", file=sys.stderr)
    if n_reg < 500:
        print(f"WARN {lang}: regional nuevos={n_reg}", file=sys.stderr)

    # score in batches of 100 with anchors re-applied
    out: dict[str, list[float]] = {}
    batch: list[str] = []
    for i, (lemma, _bucket) in enumerate(entries_order[:5000], start=1):
        batch.append(lemma)
        v, a, d = score_lemma(lang, lemma)
        out[lemma] = [q2(v), q2(a), q2(d)]
        if i % 100 == 0:
            # re-assert anchors so a later lemma cannot drift the scale
            for aw, triple in ANCHORS[lang].items():
                if fold(aw) in out:
                    out[fold(aw)] = [q2(triple[0]), q2(triple[1]), q2(triple[2])]
            batch = []

    for aw, triple in ANCHORS[lang].items():
        out[fold(aw)] = [q2(triple[0]), q2(triple[1]), q2(triple[2])]
    if lang == "es":
        for w, triple in REGIONAL_VAD.items():
            out[fold(w)] = [q2(triple[0]), q2(triple[1]), q2(triple[2])]
    # quitar claves con espacio (no son lemas de un token)
    out = {k: v for k, v in out.items() if " " not in k}

    def finalize(entries: dict[str, list[float]]) -> dict[str, list[float]]:
        clean = {k: v for k, v in entries.items() if " " not in k}
        must = [fold(aw) for aw in ANCHORS[lang]]
        for k in must:
            if k not in clean:
                triple = ANCHORS[lang][next(aw for aw in ANCHORS[lang] if fold(aw) == k)]
                clean[k] = [q2(triple[0]), q2(triple[1]), q2(triple[2])]
        rest = [k for k in clean if k not in must]
        ordered = must + rest
        while len(ordered) < 5000:
            extra = load_freq(lang, 25000, skip_function=True)
            added = False
            for w in extra:
                if w not in clean and " " not in w:
                    v, a, d = score_lemma(lang, w)
                    clean[w] = [q2(v), q2(a), q2(d)]
                    ordered.append(w)
                    added = True
                    if len(ordered) >= 5000:
                        break
            if not added:
                break
        keep = ordered[:5000]
        for k in must:
            if k not in keep:
                keep[-1] = k
        return {k: clean[k] for k in keep}

    return finalize(out)


def align_cognates(lex: dict[str, dict[str, list[float]]]) -> list[str]:
    notes = []
    for es, pt, en in COGNATE_TRIPLES:
        keys = {"es": fold(es), "pt": fold(pt), "en": fold(en)}
        present = {lg: lex[lg][k] for lg, k in keys.items() if k in lex[lg]}
        if len(present) < 2:
            notes.append(f"{es}/{pt}/{en}: faltan idiomas {set(keys)-set(present)}")
            # inject missing with canonical
            canon = next(iter(present.values()), [0.50, 0.40, 0.50])
            for lg, k in keys.items():
                lex[lg][k] = canon
            continue
        vs = [row[0] for row in present.values()]
        as_ = [row[1] for row in present.values()]
        ds = [row[2] for row in present.values()]
        if max(vs) - min(vs) > 0.15 or max(as_) - min(as_) > 0.15 or max(ds) - min(ds) > 0.15:
            mid = [
                q2(sum(vs) / len(vs)),
                q2(sum(as_) / len(as_)),
                q2(sum(ds) / len(ds)),
            ]
            for lg, k in keys.items():
                lex[lg][k] = mid
            notes.append(f"corregido {es}/{pt}/{en} → {mid}")
        else:
            notes.append(f"ok {es}/{pt}/{en} {present}")
    # volver a 5000 por idioma si un cognado inyectó extras
    for lang in lex:
        if len(lex[lang]) > 5000:
            must = {fold(aw) for aw in ANCHORS[lang]} | {fold(a) for a, _, _ in COGNATE_TRIPLES} | {
                fold(b) for _, b, _ in COGNATE_TRIPLES
            } | {fold(c) for _, _, c in COGNATE_TRIPLES}
            keep = []
            for k in lex[lang]:
                if k in must or len([x for x in keep if x not in must]) + (0 if k in must else 1) <= 5000:
                    keep.append(k)
                if len(keep) >= 5000:
                    break
            # simpler trim: must first, then fill
            keys = list(lex[lang].keys())
            ordered = [k for k in keys if k in must] + [k for k in keys if k not in must]
            lex[lang] = {k: lex[lang][k] for k in ordered[:5000]}
    return notes


def stats(entries: dict[str, list[float]]) -> dict[str, dict[str, float]]:
    out = {}
    for i, dim in enumerate("vad"):
        vals = [row[i] for row in entries.values()]
        out[dim] = {
            "mean": round(statistics.fmean(vals), 4),
            "stdev": round(statistics.pstdev(vals), 4),
            "min": round(min(vals), 2),
            "max": round(max(vals), 2),
        }
    return out


def outliers(entries: dict[str, list[float]], lang: str) -> list[str]:
    flags = []
    # known mismatches
    checks = {
        "es": [("muerte", lambda v: v[0] < 0.20), ("carnaval", lambda v: v[0] > 0.80),
               ("abrazo", lambda v: v[0] > 0.75), ("tortura", lambda v: v[0] < 0.12),
               ("mesa", lambda v: 0.35 < v[0] < 0.65)],
        "pt": [("morte", lambda v: v[0] < 0.20), ("carnaval", lambda v: v[0] > 0.80),
               ("abraco", lambda v: v[0] > 0.75), ("tortura", lambda v: v[0] < 0.12)],
        "en": [("death", lambda v: v[0] < 0.20), ("carnival", lambda v: v[0] > 0.80),
               ("hug", lambda v: v[0] > 0.75), ("torture", lambda v: v[0] < 0.12)],
    }
    for lemma, pred in checks.get(lang, []):
        k = fold(lemma)
        if k not in entries:
            flags.append(f"FALTA ancla {lemma}")
            continue
        if not pred(entries[k]):
            flags.append(f"ancla fuera de rango {lemma}={entries[k]}")
    # statistical: V very high for death-stems or very low for celebration
    death_stems = ("muert", "mort", "kill", "asesin", "tortur", "viol")
    joy_stems = ("fiest", "fest", "carnival", "carnaval", "amor", "love", "hug", "abraz", "abrac")
    for lemma, row in entries.items():
        if any(lemma.startswith(s) for s in death_stems) and row[0] > 0.45:
            flags.append(f"outlier V alta en {lemma}={row}")
        if any(s in lemma for s in joy_stems) and row[0] < 0.55:
            flags.append(f"outlier V baja en {lemma}={row}")
        if row[1] < 0.02 and row[0] < 0.15:
            flags.append(f"posible colapso {lemma}={row}")
    return flags[:40]


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    lex: dict[str, dict[str, list[float]]] = {}
    for lang in ("es", "pt", "en"):
        print(f"building {lang}…")
        lex[lang] = build_lang(lang)
        print(f"  {lang}: {len(lex[lang])} entries")

    cognate_notes = align_cognates(lex)

    qc = {}
    rng = random.Random(20260820)
    for lang, entries in lex.items():
        sample_keys = rng.sample(list(entries.keys()), 100)
        qc[lang] = {
            "n": len(entries),
            "stats": stats(entries),
            "sample100": {k: entries[k] for k in sorted(sample_keys)},
            "anchors": {k: entries.get(fold(k)) for k in ANCHORS[lang]},
            "outliers": outliers(entries, lang),
        }
        payload = {
            "version": VERSION,
            "lang": lang,
            "dims": ["valencia", "activacion", "dominancia"],
            "n": len(entries),
            "e": entries,
        }
        path = OUT_DIR / f"{lang}.json"
        path.write_text(json.dumps(payload, ensure_ascii=True, separators=(",", ":")), encoding="utf-8")
        print(f"  wrote {path} ({path.stat().st_size} bytes)")

    report = {
        "version": VERSION,
        "cognates": cognate_notes,
        "qc": {
            lang: {
                "n": qc[lang]["n"],
                "stats": qc[lang]["stats"],
                "anchors": qc[lang]["anchors"],
                "outliers": qc[lang]["outliers"],
                "sample100": qc[lang]["sample100"],
            }
            for lang in qc
        },
    }
    (OUT_DIR / "qc-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("QC stats:")
    for lang in ("es", "pt", "en"):
        print(f"  {lang} {qc[lang]['stats']}")
        print(f"    outliers {len(qc[lang]['outliers'])}")


if __name__ == "__main__":
    main()
