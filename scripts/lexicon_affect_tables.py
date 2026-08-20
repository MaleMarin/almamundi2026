"""Tablas afectivas originales AlmaMundi. No copian NRC ni Warriner."""

# category -> (v, a, d)
CAT = {
    "joy": (0.86, 0.76, 0.62),
    "love": (0.88, 0.58, 0.50),
    "sad": (0.22, 0.38, 0.28),
    "anger": (0.18, 0.86, 0.70),
    "fear": (0.16, 0.82, 0.22),
    "disgust": (0.18, 0.70, 0.38),
    "calm": (0.74, 0.14, 0.48),
    "pos": (0.78, 0.48, 0.60),
    "neg": (0.26, 0.50, 0.38),
    "kin_warm": (0.80, 0.46, 0.52),
    "child": (0.74, 0.56, 0.40),
    "elder": (0.70, 0.30, 0.44),
    "body": (0.54, 0.40, 0.48),
    "pain": (0.24, 0.64, 0.30),
    "food": (0.76, 0.42, 0.52),
    "home": (0.72, 0.32, 0.54),
    "work": (0.50, 0.52, 0.60),
    "money": (0.58, 0.54, 0.62),
    "death": (0.08, 0.74, 0.20),
    "violence": (0.10, 0.88, 0.68),
    "nature": (0.70, 0.30, 0.50),
    "storm": (0.40, 0.78, 0.42),
    "celeb": (0.86, 0.82, 0.66),
    "migr": (0.42, 0.58, 0.38),
    "school": (0.62, 0.46, 0.54),
    "religion": (0.66, 0.44, 0.56),
    "sex": (0.64, 0.76, 0.48),
    "alcohol": (0.56, 0.64, 0.50),
    "sickness": (0.24, 0.52, 0.30),
    "friend": (0.80, 0.52, 0.56),
    "slang_pos": (0.82, 0.62, 0.58),
    "slang_kid": (0.72, 0.54, 0.42),
    "slang_work": (0.48, 0.54, 0.58),
    "slang_place": (0.50, 0.46, 0.44),
    "time": (0.52, 0.34, 0.50),
    "motion": (0.54, 0.58, 0.52),
    "think": (0.54, 0.40, 0.56),
    "speech": (0.56, 0.50, 0.54),
    "number": (0.50, 0.28, 0.50),
    "greet": (0.72, 0.46, 0.52),
    "sorry": (0.36, 0.42, 0.32),
    "swear": (0.20, 0.82, 0.52),
    "insult": (0.22, 0.74, 0.48),
    "please": (0.68, 0.40, 0.44),
    "life": (0.78, 0.50, 0.54),
    "need": (0.46, 0.60, 0.42),
    "can": (0.56, 0.50, 0.72),
    "help": (0.64, 0.58, 0.48),
    "ok": (0.70, 0.42, 0.56),
    "true": (0.66, 0.40, 0.58),
    "name": (0.54, 0.32, 0.52),
    "func2": (0.50, 0.26, 0.50),
}

# lang -> category -> words
WORDS = {
    "es": {
        "joy": "alegria alegre feliz felicidad risa reir sonrisa contento contenta gozo jubilo dicha divertido diversion fiesta reir rei reiamos reia reiste reimos celebrar celebracion aplauso aplaudir triunfo triunfar exito exitoso",
        "love": "amor amar amo amas ama amamos aman amaba amado amada querido querida querer quiero quieres quiere queremos cariño carino ternura tierno enamorar enamorado enamorada pasion romance novio novia pareja",
        "sad": "triste tristeza pena llorar llanto lagrima lagrimas lloro llore lloraba melancolia pesar afliccion desconsuelo sollozo sollozar",
        "anger": "odio odiar rabia furia ira enojo enojado bronca rabioso furioso molesto molestar gritar pelea pelear golpear insulto insultar",
        "fear": "miedo temor terror panico susto asustado asustada temer temia aterrorizado horror horripilante recelo",
        "disgust": "asco asqueroso asquerosa repugnante sucio sucia podrido podrida vomito vomitar nauseas hediondo",
        "calm": "paz calma sosiego sereno serena tranquilo tranquila tranquilidad descanso descansar silencio silencioso quieto quieta suave",
        "pos": "bueno buena buenos buenas bien mejor mejorando excelente hermoso hermosa lindo linda bonito bonita rico rica fuerte valiente libre sano sana limpio limpia nuevo nueva grande grandioso importante cierto verdadera verdadero posible facil amable generoso honesto justo gusto gusta gustaria encanta suerte genial increible perfecto maravilloso agradable placer honor libertad salud ganas bienvenido bienvenida alegro alegra",
        "neg": "malo mala malos malas mal peor peor feo fea pobre pobres debil debiles dificil sucio sucia falso falsa injusto cruel horrible terrible pesimo grave grave grave error error problema problemas",
        "kin_warm": "familia familiar madre mama mami mamaíta padre papa papi papito hijo hija hijos hijas hermano hermana hermanos hermanas abuelo abuela abuelos abuelas tio tia primos prima nieto nieta suegro suegra yerno nuera padrino madrina",
        "child": "nino nina ninos ninas infancia ninez bebe bebes cuna juguete juguetes escuela escolar recreo nana panal chupete",
        "elder": "viejo vieja anciano anciana vejez canas arrugas abuelito abuelita nona nono tata yaya",
        "body": "cuerpo mano manos cara cabeza corazon piel ojos ojo boca brazo brazos pierna piernas pie pies espalda hombro sangre hueso huesos",
        "pain": "dolor doler duele dolia herida herido sangre sangrar golpe golpear fiebre enfermo enfermedad cancer tumor cicatriz",
        "food": "comida comer comi comio comemos pan leche arroz sopa fruta carne pollo pescado huevo queso cafe te chocolate maiz tortilla atole mole tamal taco arepa empanada asado mate",
        "home": "casa hogar cuarto cama cocina puerta ventana techo piso patio jardin familia vecino vecina barrio",
        "work": "trabajo trabajar trabaje trabajo oficio empleo salario sueldo jefe jefa oficina fabrica campo cosecha hacer hace haces hacemos hacen hice hizo hiciste haciendo hacerlo tener tengo tienes tiene tenemos tienen tenia tuve tenido",
        "money": "dinero plata pago pagar cobro cobrar rico pobre deuda prestar prestamo banco",
        "death": "muerte morir murio muerto muerta funeral entierro tumba cementerio cadaver fallecer fallecio luto duelo viudo viuda asesinado asesinada asesina asesinar mortal mortales",
        "violence": "guerra batalla combate matar mato mataron asesinato asesino violencia violento golpe arma pistola bomba",
        "nature": "agua rio mar oceano lago bosque montana valle tierra cielo sol luna estrella arbol flores flor jardin",
        "storm": "tormenta huracan terremoto inundacion sequia viento fuerte rayo trueno tempestad",
        "celeb": "fiesta carnaval baile bailar musica cancion cantar boda casamiento navidad pascua cumpleanos celebrar festival parada",
        "migr": "viaje viajar migrar inmigrante emigrante frontera aduana exilio refugio refugiado maleta pasaporte despedida adios retorno volver volvi",
        "school": "escuela maestro maestra profesor profesora alumno alumna clase aula libro lápiz lapiz estudiar estudio universidad",
        "religion": "dios fe iglesia rezar rezo santo santa virgen milagro alma espiritu cielo infierno pecar pecado",
        "sex": "sexo sexual deseo desear beso besar caricia desnudo desnuda cama pareja intimidad",
        "alcohol": "alcohol vino cerveza borracho borracha cantina bar trago tequila pulque chicha",
        "sickness": "enfermo enferma enfermedad hospital medico medica enfermera clinica fiebre tos virus epidemia",
        "friend": "amigo amiga amigos amigas amistad compañero companero compañera vecino vecina comunidad",
        "slang_pos": "bacan chevere tuanis chido padre neta chimba bacano filete copado masa irado dahora legal suave",
        "slang_kid": "pololo polola guagua pibe piba chamaco chamaca chamo chama cipote patojo morro chavo cabro nene wawa escuincle carajito guri moleque pickney",
        "slang_work": "laburo chamba jale pega trampo brete camello changa jornal",
        "slang_place": "pobla villa micro bondi colectivo combi pesero conventillo cite jato depto pieza",
        "time": "tiempo hora dia dias mes meses año ano año semana hoy ayer mañana manana noche madrugada tarde siempre nunca ahora",
        "motion": "ir voy vas va vamos van irse venir viene vino llegar llegue llegar salir sali entrar camina caminar correr corrio fui fue iba vete adelante vuelta volver vuelve volvi",
        "think": "pensar pienso pensaba pensar pense pensé saber se sabe sabia creer creo creia crees recordar recuerdo memoria olvidar olvido entiende entiendo",
        "speech": "hablar hablo dijo decir conte contar palabra voz idioma lengua llamar llamo preguntar pregunta responder dice dices digo dije dijiste diciendo oye mira miren dime dile",
        "number": "uno dos tres cuatro cinco seis siete ocho nueve diez cien mil millon primero segundo tercero",
        "greet": "hola hey hi buenos salud olá ola adios chao hasta luego bienvenido bienvenida",
        "sorry": "siento lamento perdon perdón disculpa disculpe perdoname perdoname culpa lo siento",
        "swear": "mierda maldita maldito carajo diablos diablo demonios joder hostia coño cono",
        "insult": "idiota estupido estúpido tonto tonta loco loca imbécil imbecil imbécil imbécil imbécil culo perra imbécil",
        "please": "favor porfavor por favor please porfa",
        "life": "vida vivir vivo viva vidas viviendo vivido",
        "need": "necesito necesita necesitan necesitamos necesitas preciso precisa precisamos hacer falta falta",
        "can": "puedo puede puedes podemos pueden podria podría podrias poder capaz",
        "help": "ayuda ayudar ayudo ayude cuidado salvá salvar salvo socorro",
        "ok": "vale ok okay bien listo sale sale genial perfecto increible increíble maravilloso excelente",
        "true": "verdad cierto claro razon razón seguro segura acuerdo",
        "name": "nombre señor senor señora senora señorita chica chico chicos chicas muchacho muchacha esposa marido nino niño niña nina",
        "func2": "asi así vez veces ni poco tal pues mientras casi hacia aunque igual algunos algunas muchos muchas ningun ninguna ningun ningun ningun ningun ningun alguna algun algún cualquier cualquiera todavia todavía aun aún mio mía mia contigo conmigo usted ustedes",
    },
    "pt": {
        "joy": "alegria alegre feliz felicidade riso rir sorriso contente gozo jubilo festa celebrar celebracao aplauso triunfo sucesso",
        "love": "amor amar amo ama amamos amava amado amada querido querida querer quero carinho ternura namorar apaixonado paixao romance namorado namorada casal",
        "sad": "triste tristeza pena chorar choro lagrima lagrimas chorava melancolia pesar soluco",
        "anger": "odio odiar raiva furia ira bravo gritar briga brigar bater insulto",
        "fear": "medo temor terror panico susto assustado temer horror",
        "disgust": "nojo nojento repugnante sujo podre vomito vomitar",
        "calm": "paz calma sossego sereno tranquilo tranquilidade descanso silencio quieto suave",
        "pos": "bom boa bons boas bem melhor excelente lindo linda bonito bonita rico rica forte valente livre sadio limpo novo nova grande importante certo verdadeiro possivel facil amavel honesto justo",
        "neg": "mau ma maus mas mal pior feio feia pobre fraco dificil sujo falso injusto cruel horrivel terrivel erro problema",
        "kin_warm": "familia familiar mae mamae pai papai filho filha filhos filhas irmao irma irmaos avo tios tia primos prima neto neta sogro sogra genro nora padrinho madrinha mae",
        "child": "crianca criancas infancia bebe bebes berco brinquedo escola recreio nana fralda chupeta",
        "elder": "velho velha idoso idosa velhice cabelos brancos rugas vo vo nona nono",
        "body": "corpo mao maos cara cabeca coracao pele olhos olho boca braco perna pe costas ombro sangue osso",
        "pain": "dor doer dói doi ferida ferido sangue sangrar golpe febre doente doenca cancer tumor cicatriz",
        "food": "comida comer comi comeu pao leite arroz sopa fruta carne frango peixe ovo queijo cafe cha chocolate milho tortilla tamale churrasco chimarrao",
        "home": "casa lar quarto cama cozinha porta janela teto chao patio jardim vizinho bairro",
        "work": "trabalho trabalhar trabalhei oficio emprego salario chefe escritorio fabrica campo colheita",
        "money": "dinheiro grana pago pagar cobro cobrar rico pobre divida emprestar banco",
        "death": "morte morrer morreu morto morta funeral enterro tumba cemiterio cadaver falecer luto viuvo viuva",
        "violence": "guerra batalha combate matar matou assassinato assassino violencia violento golpe arma pistola bomba",
        "nature": "agua rio mar oceano lago floresta montanha vale terra ceu sol lua estrela arvore flores flor jardim",
        "storm": "tempestade furacao terremoto enchente seca vento raio trovao",
        "celeb": "festa carnaval danca dancar musica cancao cantar casamento natal pascoa aniversario celebrar festival desfile",
        "migr": "viagem viajar migrar imigrante emigrante fronteira alfandega exilio refugio refugiado mala passaporte despedida adeus retorno voltar voltei",
        "school": "escola mestre professora professor aluno aluna aula livro lapis estudar estudo universidade",
        "religion": "deus fe igreja rezar santo santa virgem milagre alma espirito ceu inferno pecar pecado",
        "sex": "sexo sexual desejo desejar beijo beijar caricia nu nua cama casal intimidade",
        "alcohol": "alcool vinho cerveja bebado bebada bar gole cachaca pinga",
        "sickness": "doente doenca hospital medico medica enfermeira clinica febre tosse virus epidemia",
        "friend": "amigo amiga amigos amigas amizade companheiro companheira vizinho comunidade",
        "slang_pos": "bacan chevere tuanis dahora massa irado legal suave bacano chimba",
        "slang_kid": "moleque guri pia guria pibe chamaco chamo crianca nene pickney",
        "slang_work": "trampo laburo chamba expediente jornal",
        "slang_place": "quebrada favela morro bondinho van lotacao cortico kitnet",
        "time": "tempo hora dia dias mes meses ano semana hoje ontem amanha noite madrugada tarde sempre nunca agora",
        "motion": "ir vou vai vamos foram vir vem veio chegar cheguei sair saí entrar caminhar correr correu",
        "think": "pensar penso pensava saber sei sabe sabia crer creio lembrar lembro memoria esquecer esqueci",
        "speech": "falar falo disse dizer contei contar palavra voz idioma lingua chamar chamou perguntar pergunta responder",
        "number": "um dois tres quatro cinco seis sete oito nove dez cem mil milhao primeiro segundo terceiro",
        "greet": "ola olá oi hello adeus tchau ate logo bemvindo bemvinda",
        "sorry": "desculpa desculpe sinto lamento perdao perdão desculpa me",
        "swear": "merda caralho porra diabos diabo",
        "insult": "idiota estupido tonto tonta louco louca imbecil cu",
        "please": "favor por favor please",
        "life": "vida viver vivo viva vidas vivendo",
        "need": "preciso precisa precisamos precisas necessidade falta",
        "can": "posso pode podes podemos podem poderia poder capaz",
        "help": "ajuda ajudar ajudo cuidado salvar socorro",
        "ok": "ok okay bem pronto optimo ótimo perfeito incrivel maravilhoso excelente",
        "true": "verdade certo claro razao razão certeza acordo",
        "name": "nome senhor senhora moça moço rapaz rapariga marido esposa menino menina",
        "func2": "isso sim ao voce você tens assim ainda vez nem alguma pelo essa esse pois pela qualquer disso num dela ca cá meus va vá daqui seus aos embora numa si deles duas enquanto desta neste estes for teus disto nisso deste nesta",
    },
    "en": {
        "joy": "joy joyful happy happiness laugh laughing smile smiling glad delight delight party celebrate celebration applause triumph success",
        "love": "love loving loved dear darling affection tenderness romance boyfriend girlfriend couple passion lover lovers beloved",
        "sad": "sad sadness sorrow cry crying tear tears wept melancholy grief",
        "anger": "hate hatred rage fury anger angry shout fight punch insult",
        "fear": "fear terror panic scare scared afraid horror dread",
        "disgust": "disgust disgusting filthy rotten vomit nauseous",
        "calm": "peace calm serenity serene quiet quiet rest silence still soft",
        "pos": "good better best excellent beautiful pretty lovely rich strong brave free healthy clean new big important true possible easy kind generous honest fair",
        "neg": "bad worse worst ugly poor weak difficult dirty false unfair cruel horrible terrible error problem",
        "kin_warm": "family mother mom mum mama father dad papa son daughter brother sister grandfather grandmother uncle aunt cousin nephew niece grandson granddaughter",
        "child": "child children childhood kid kids baby babies crib toy school recess lullaby diaper",
        "elder": "old elderly aging gray wrinkle grandma grandpa granny",
        "body": "body hand hands face head heart skin eyes eye mouth arm arms leg legs foot feet back shoulder blood bone",
        "pain": "pain painful hurt hurting wound wounded blood bleed hit fever sick illness cancer tumor scar",
        "food": "food eat ate eaten bread milk rice soup fruit meat chicken fish egg cheese coffee tea chocolate corn tortilla stew barbecue",
        "home": "house home room bed kitchen door window roof floor yard garden neighbor neighborhood",
        "work": "work working worked job employment wage salary boss office factory field harvest",
        "money": "money pay paid rich poor debt lend loan bank cash",
        "death": "death die died dead dying funeral burial grave cemetery corpse widow",
        "violence": "war battle combat kill killed murder murderer violence violent hit weapon gun bomb",
        "nature": "water river sea ocean lake forest mountain valley land sky sun moon star tree flowers flower garden",
        "storm": "storm hurricane earthquake flood drought wind lightning thunder tempest",
        "celeb": "party carnival dance dancing music song sing wedding christmas easter birthday celebrate festival parade",
        "migr": "travel trip migrate immigrant emigrant border customs exile refuge refugee suitcase passport farewell goodbye return returned",
        "school": "school teacher professor student class classroom book pencil study university",
        "religion": "god faith church pray saint holy miracle soul spirit heaven hell sin",
        "sex": "sex sexual desire kiss kissing caress naked bed couple intimacy",
        "alcohol": "alcohol wine beer drunk bar drink tequila rum",
        "sickness": "sick illness hospital doctor nurse clinic fever cough virus epidemic",
        "friend": "friend friends friendship companion neighbor community",
        "slang_pos": "bacan chevere tuanis chido irie cool awesome",
        "slang_kid": "pickney pibe chamaco chamo guagua kid child",
        "slang_work": "laburo chamba gig shift",
        "slang_place": "barrio villa micro bodega yard",
        "time": "time hour day days month months year week today yesterday tomorrow night dawn evening always never now",
        "motion": "go going went come came arrive arrived leave left enter walk walking run ran",
        "think": "think thought know knew believe believed remember memory forget forgot",
        "speech": "speak spoke say said tell told word voice language call called ask asked answer",
        "number": "one two three four five six seven eight nine ten hundred thousand million first second third",
        "greet": "hi hello hey hiya yo bye goodbye welcome",
        "sorry": "sorry excuse apology apologise apologize",
        "swear": "damn hell crap bloody",
        "insult": "stupid idiot crazy fool dumb jerk",
        "please": "please kindly",
        "life": "life live living alive lives",
        "need": "need needs needed needing wanna gotta",
        "can": "can could able",
        "help": "help helping helped save saving care",
        "ok": "ok okay well yeah yes great nice fine wow cool",
        "true": "true truth sure right really actually",
        "name": "name sir mr mrs lady girl guy guys boy boys men women wife husband",
        "func2": "don ll ve didn isn wasn won doesn aren ain haven couldn re like get let gonna something anything everything nothing someone anyone everyone somebody anybody everybody else own such though against quite anyway whatever",
    },
}

REGIONAL_VAD = {
    "pololo": (0.78, 0.62, 0.50),
    "polola": (0.78, 0.62, 0.50),
    "pololear": (0.76, 0.60, 0.48),
    "guagua": (0.74, 0.56, 0.38),  # niño (Andes/Chile); ver NOTES
    "pibe": (0.70, 0.52, 0.46),
    "piba": (0.70, 0.52, 0.46),
    "chamaco": (0.72, 0.54, 0.42),
    "chamaca": (0.72, 0.54, 0.42),
    "chamo": (0.70, 0.58, 0.48),
    "chama": (0.70, 0.58, 0.48),
    "cipote": (0.68, 0.52, 0.44),
    "cipota": (0.68, 0.52, 0.44),
    "patojo": (0.70, 0.50, 0.42),
    "patoja": (0.70, 0.50, 0.42),
    "parce": (0.76, 0.55, 0.52),
    "parcero": (0.76, 0.55, 0.52),
    "parcera": (0.76, 0.55, 0.52),
    "mae": (0.64, 0.50, 0.50),
    "cuate": (0.76, 0.50, 0.52),
    "cuata": (0.76, 0.50, 0.52),
    "laburo": (0.48, 0.54, 0.58),
    "laburar": (0.48, 0.54, 0.58),
    "plata": (0.58, 0.52, 0.60),
    "bacan": (0.82, 0.64, 0.62),
    "chevere": (0.84, 0.66, 0.60),
    "tuanis": (0.84, 0.62, 0.58),
    "micro": (0.50, 0.46, 0.48),
    "pobla": (0.46, 0.48, 0.40),
    "nona": (0.80, 0.36, 0.44),
    "nono": (0.80, 0.36, 0.44),
    "chamba": (0.50, 0.54, 0.58),
    "jale": (0.50, 0.54, 0.56),
    "pega": (0.50, 0.52, 0.56),
    "chido": (0.82, 0.60, 0.58),
    "neta": (0.70, 0.48, 0.55),
    "chimba": (0.84, 0.68, 0.60),
    "bondi": (0.50, 0.48, 0.48),
    "guita": (0.56, 0.52, 0.58),
    "mango": (0.56, 0.50, 0.56),
    "pisto": (0.56, 0.52, 0.58),
    "weon": (0.48, 0.58, 0.50),
    "carrete": (0.80, 0.78, 0.58),
    "moleque": (0.70, 0.60, 0.44),
    "guri": (0.72, 0.54, 0.42),
    "parca": (0.76, 0.55, 0.52),
    "trampo": (0.48, 0.54, 0.58),
    "grana": (0.58, 0.52, 0.60),
    "dahora": (0.84, 0.64, 0.60),
    "pickney": (0.74, 0.56, 0.40),
    "irie": (0.86, 0.50, 0.58),
    "liming": (0.78, 0.58, 0.52),
    "asere": (0.76, 0.58, 0.54),
    "yuma": (0.48, 0.50, 0.52),
}

# Términos extra de relato / regional, pensados para NO estar en el top 3500.
EXTRA_NARRATIVE = {
    "es": """
        tatarabuelo tatarabuela consuegra concunado concunada ahijada madrinazgo
        velacion responso novena capilla ardiente camposanto osario columbario
        coyotaje pollero deportado indocumentado regularizado tramitador gestoria
        papalote resortera canica yoyo trompo balero cuna moisés moisés
        tetero chupon guardapolvo pizarron tiza recreo merienda lonchera
        huesero yerbero comadrona partera curandera sobador
        jornalero peonada vendimiador zafrero henequenero chiclero
        tinaco aljibe pila lavadero tendedero azotea zaguán zaguan
        milpa ejidal chinampa camellon camellón terrazas andeneria
        cempasuchil copal veladora calaverita papelpicado ofrendario
        quinceanera vals quince arras ramo velo toca
        huipil rebozo quexquemetl faja chumpi ojotas ushutas
        locro humita carbonada cazuela pastelchoclo puchero
        areperia pupuseria taqueria fonda piqueteadero chicheria
        conventillo inquilinato cité cite piezafrente
        palafito jacal choza rancho de palma techo de lamina
        diablada morenada tinku caporales saya huayno
        mapudungun nahuatl quechua aymara guarani totonaco zapoteco
        compadrazgo comadrazgo parentela consanguinidad
        sepelio inhumacion exhumacion osamenta
        andeneria bofedal paramo puneno altiplanico
        temazcal temazcales temazcalera
        milagrito exvoto retablo nicho hornacina
        serenata mariachi jarocho son huapango jarana
        chicha morada tesguino pulque tlachiquero
        panalera pañalera cuna colecho porteo
        primeradiente primerpaso cartillavacunacion
        telegrama cartaacertada llamada porcobrar
        baulderecuerdos caja de zapatos album familiar
        llavechatarra candadoviejo umbral natal
    """.split(),
    "pt": """
        tataravo tataravo consogra concunhado afilhada
        velorio capela ardente ossario columbario
        coyote deportado indocumentado despachante
        pipa bolinhadegude ioiô pião berco
        mamadeira chupeta avental lousa giz lancheria
        benzedeira parteira curandeira
        boiafria diarista cortador de cana seringueiro
        caixa dagua cacimba tanque lavadouro
        roca de toco terra preta varzea igarape
        copal veladora ofrenda
        debutante quinze anos aliancas veu
        poncho chale chapeu de palha alpargata
        moqueca vatapa acaraje tacaca tucupi jambu
        cortico quitinete kitnet quarto de fundo
        palafita casa de taipa chao de terra
        escola de samba bloco afoxe maracatu
        nheengatu tukano macuxi yanomami
        compadrio parentela
        sepultamento inumacao exumacao
        banhado pantanal restinga
        exvoto retablo nicho
        serenata chorinho forro baião
        cachaça pinga alambique
        fraldario colo colecho
        primeiro dente primeiro passo cartao de vacina
        telegrama ligacao a cobrar
        bau de lembrancas caixa de sapato album
        chave velha umbral natal
    """.split(),
    "en": """
        great-great-grandfather co-mother-in-law goddaughterhood
        chapel-of-rest ossuary columbarium
        coyote-guide undocumented fixer
        kite slingshot spinning-top crib
        feeding-bottle pacifier chalkboard lunch-pail
        bonesetter herbal-healer midwife
        cane-cutter rubber-tapper day-wages
        rooftop-tank cistern washtub clotheslines
        raised-field chinampa andean-terrace
        marigold-flower copal-resin offering-altar
        quinceanera-waltz wedding-coins veil
        huipil rebozo sash leather-sandals
        humita corn-pie stewpot
        pupusa-shop taco-stand chicha-house
        tenement-room courtyard-house
        stilt-house adobe-hut palm-thatch tin-roof
        devil-dance morenada tinku
        mapudungun nahuatl quechua aymara guarani
        co-parenthood blood-kin
        interment exhumation
        peat-bog high-moor
        sweat-lodge
        votive-offering niche
        serenade son-jarocho
        pulque-maker corn-beer
        diaper-bag babywearing
        first-tooth vaccination-card
        collect-call telegram
        memory-trunk shoebox-album
        rusted-key birth-threshold
    """.split(),
}

EXTRA_REGIONAL = {
    "es": """
        chingón chingon chingona guey wey no manches a poco
        chale gacho fresa naco naca banda morra jefa patrona
        camión camioneta combi pesero metrobus trolebus
        tianguis tiendita changarro abarrotes pulquería pulqueria
        órales chido padrísimo padrisimo que padre
        cipotes pisto bolo chero chera chivo tunco
        maje pisto cabal salvadoreñismo
        wila brete chante pulpería tuanis mae diay
        pura vida playo
        parcero llave cucho china tinto onces rumba
        berraquera parcera catorce
        jeva jevo burda sifrino conchale vaina arepera
        fuacata chamo pana
        asere yuma camello botella consorte paladar ponina
        habano guajiro oriental pinareño
        quilombo fiaca morfar puchero bondi laburante changa
        chabon chabón piberio mango luca gamba
        weona altiro fome once palta jato carretear
        filete copado luca gamba pieza cite
        ñaño ñana causa pata huevón palta jato
        chacra fundo estancia pampa altiplano
        cantegril villa miseria asentamiento toma
        piqueteadero fonda merendero botillería boliche
        bio bio persa feria libre galería pulga rastro
        baratillo todoacien
    """.split(),
    "pt": """
        molecada pivete maloqueiro quebrada
        cafezinho paonachapa padoca boteco resenha
        bufunfa bagulho parada deboa treta
        bah tche capaz tri barbaresco prenda
        carioquice paulistice mineirice
        nordestino paraiba sertanejo caipira caboclo
        ribeirinho quilombola caiçara jangadeiro
        boia-fria diarista
        neguinho crioulo sarara galego
        zé povinho fulano ciclano beltrano
        véi coroa gurizada panelinha
        ficante ficada pegacao paquera cantada
        amasio amasia
        boteco botequim padoca quitanda mercearia
        birosca camelô flanelinha carroceiro
        jegue capivara tatu tamandua preguica
        acai cupuacu guarana seringueiro
        palafita igarape pororoca
        calçadão quiosque sunga canga
        saveiro jangada trapiche
        sururu moqueca caldeirada pirao
        farinha dagua beiju polvilho
        queijo coalho queijo minas canastra
        pingado cafezinho chimarrao terere
        acaraje abara vatapa caruru xinxin
        bobo de camarao tacaca tucupi jambu
        pamonha canjica quentao pacoca
        pe de moleque rapadura quindim brigadeiro
        bolo de rolo cartola souza leao
    """.split(),
    "en": """
        nuyorican chicano tejano garifuna raizal
        patois yard bredren sistren walk-good
        rum-shop jerk callaloo roti doubles
        saltfish ackee dumpling sorrel mauby
        sea-bath river-come-down
        soon-come wine-up fete jouvert
        pretty-mas sailor-mas pan-yard
        steelpan soca calypso dembow dancehall
        ventanita colada cortadito cafe-con-leche
        pernil pastelitos maduros
        bodega corner-store domino-table
        ranchera norteno banda corrido vallenato
        bachata merengue
        calling-card phone-card
        care-package barrel send-for
        stateside back-home the-island
        undocumented overstay sanctuary
        night-shift two-jobs money-home
        english-class code-switch
        church-spanish sunday-service
        sweet-sixteen potluck dish-to-pass
        rice-and-beans
        latino latina afro-latino
        quinceanera-party
        green-card naturalization oath
        first-apartment roommate
        western-union remittance
        frontera border-town
        rio-grande desert-crossing
        spanglish
        irie pickney liming lime
        big-people small-people
        hurricane-season
        diaspora home-country
        papers status raid detention
    """.split(),
}
