# Pergaminos: borrador de Mariano (2026-11-07)

Copia textual de la lista que pasó Mariano para charlar. Es ampliable: van a aparecer ideas al probar.
Lo que se decida queda en `DisenoV2.md` (sección 7).

---

- armas especiales: shuriken, bomba, boomerang. Tiene municion limitada, pueden usarse cierta cantidad de veces en cada nivel. La municion se recarga al comienzo del siguiente nivel. Pueden aparecer mas de una vez. Si un player agarra la misma arma de nuevo la muncion se suma a la que ya tenia. Si agarra otra arma entonces pierde la que tenia y su tope de municion. La proxima vez que vuelva a agarrar esta arma lo hara con el minimo de municion. (sugerencia de notras armas?). Por defecto las armas pueden rebotar contra el escenario una cantidad de veces y al siguiente golpe seran destruidas.
- Movimientos especiales: dash, doble salto, rebote en pared, caida pesada, Boulder (este no esta implementado). Son acumulativos, es decir que un nuevo movimiento especial no reemplaza a los anteriores. Agarrar un movimiento especial por segunda vez es posible, en ese caso para ese player computa como "siguiente nivel". Si ambos players tienen 2 niveles del movimiento especial ese pergamino ya no aparecera como opcion.

## PERGAMINOS POSITIVOS (revisada el 2026-11-07, con a quién afecta)

- tus proyectiles rebotan 1 vez mas (puede aparecer de manera ilimitada y es acumulativo)(afecta a quien lo agarra)
- doble salto (afecta a quien lo agarra)
- doble salto nivel 2 (el segundo salto crea una plataforma fantasma tocable por todas las entidades y que desaparece despues de unos segundos)(afecta a quien lo agarra)
- dash (afecta a quien lo agarra)
- dash nivel 2 (parry durante el dash)(afecta a quien lo agarra)
- heavy drop (si ambos players lo tienen no aparece)(afecta a quien lo agarra)
- heavy drop nivel 2 (al golpear una superficie emitimos 2 bolas de fuego como las del tile de fuego pero celestes y que solo dañan a los enemigos)(afecta a quien lo agarra)
- Wall jump (afecta a quien lo agarra)
- wall jump nivel 2 (durante el wall jump sos intocable, pero no para el fantasma)(afecta a quien lo agarra)
- Boulder (no implementado aun). Si timeas perfectamente un salto al tocar el piso entras en un roll que daña a todos a tu paso. si no lo timeas perfectamente, pero "casi" el personaje aterriza (combina con una mecanica no implementada de "caer de muy alto")(afecta a quien lo agarra)
- boulder nivel 2 (loe enemigos afectados salen disparados como proyectiles)(afecta a quien lo agarra)
- 1 vida extra (se puede obtener muchas veces pero la chance es baja y cada vez que se agarra una la chance baja mas)(afecta a quien lo agarra)
- el parry impulsa objetos con mas fuerza durante un tiempo (si ambos players lo tienen no aparece)(afecta a quien lo agarra)
- 1 segundo mas en el reloj (se puede obtener muchas veces pero al llegar a un tiempo maximo de timer estos positivos ya no apareceran) (nunca aparece combinado con "un segundo menos")(no importa quien lo agarra)
- shuriken. municion 7 cada nivel. 0 rebotes. se destruye en el ultimo rebote (afecta a quien lo agarra)
- boomerang. municion 5 por nivel. 2 rebotes. se destruye en el ultimo rebote (afecta a quien lo agarra)
- bomba. municion: 3 por nivel. 1 rebote. explota por tiempo. La explosion impulsa objetos convirtiendolos en proyectiles (afecta a quien lo agarra)
- escudo temporal. podes sobrevivir a la muerte 1 vez (inmatable)(pero no al fantasma de fin de tiempo de nivel)(afecta a quien lo agarra)
- los enemigos pierden la furia despues de un tiempo (Si algun player lo tiene no aparece) (no imporat quien lo agarra)
- Imán de Talismanes (o absorción por proximidad) (si ambos players lo tienen no aparece) (afecta a quien lo agarra)
- Hay una pequeña probabilidad de que usar un arma especial no gaste municion cuando se dispara (si ambos players lo tienen no aparece)(afecta a quien lo agarra)
- pisar tiles trampa los transforma en tile impasable de piedra (Si ambos player lo tienen no aparece)(afecta a quien lo agarra)
- al morir el jugador spwanea una bomba (si ambos players lo tiene no aparece)(afecta a quien lo agarra)
- timear el salto al pisar un enemigo nos permite saltar mucho mas alto (si ambos players lo tienen no aparece)(entiendo que pisar ahora ocurre de manera automatica y hace un salto normal)(afecta a quien lo agarra)
- hacer parry de un proyectil puede cargar +1 a municion solo por este nivel (20% probabilidad) (si ambos players lo tienen no aparece)(afecta a quien lo agarra)

## PERGAMINOS NEGATIVOS

- proyectiles enemigos rebotan 1 vez mas (puede aparecer de manera ilimitada y es acumulativo)(no importa quien lo agarra)
- 1 segundo menos en el timer (se puede obtener muchas veces pero al llegar a un tiempo minimo de timer estos negativos ya no apareceran) (nunca aparece combinado con "un segundo mas")(no importa quien lo agarra)
- pisar enemigos los enfurece (si ambos players lo tienen no aparece)(Afecta a quien lo agarra)
- enemigos enfurecidos contagian a otros al tocarlos (Si algun player lo tiene no aparece)(no importa quien lo agarra)
- el primer enemigo en spawnear en cada nivel es invulnerable hasta recibir daño (Si algun player lo tiene no aparece)(no importa quien lo agarra)
- algunas veces en vez de spawnear una moneda spawnea una mina de tierra que solo afecta a los jugadores (es vulnerable a proyectiles y no desespawnea al pasar a la fase de caceria)(Si algun player lo tiene no aparece)(no importa quien lo agarra)
- algunas veces en vez de spawnear una moneda spawnea una bomba especial que solo afecta a jugadores y explota por tiempo (es vulnerable a proyectiles y no desespawnea al pasar a la fase de caceria) (Si algun player lo tiene no aparece)(no importa quien lo agarra)
- fuego amigo (Si algun player lo tiene no aparece) (afecta a ambos players)(no importa quien lo agarra)
- los enemigos enfurecidos explotan al morir (Si algun player lo tiene no aparece)(no importa quien lo agarra)
- en pantalla de selección de pergaminos, los efectos negativos estarán ocultos durante 3 segundos. (Si algun player lo tiene no aparece)(no importa quien lo agarra)
- un proyectil enemigo que se destruye deja caer una bola de fuego como las que emite el tile de fuego (Si algun player lo tiene no aparece)(no importa quien lo agarra)
- un tile impasable al azar se convierte en un tile trampa (solo pueden ser tiles que no tenga otro tile arriba, no esten offscreen ni sean parte de las paredes laterales) (es acumulativo hasta un maximo de 5 veces entre ambos players, luego ya no aparece) (no importa quien lo agarra)
- La llama amarilla (la generada por las bolas de fuego de los tiles de fuego) tiene posibilidades de espawnear una bola de fuego al extiguirse (Si algun player lo tiene no aparece)(no importa quien lo agarra)
- En la pantalla de selección entre niveles, uno de los 3 pergaminos aparece tachado con una cadena durante los primeros 5 segundos (Si algun player lo tiene no aparece)(no importa quien lo agarra)
- En la pantalla de selección de pergaminos, los efectos positivos no se pueden leer despues de los primeros 3 segundos. (Si algun player lo tiene no aparece)(no importa quien lo agarra)
- cada vez que cualquier entidad toque un tile de trampa, otro tile de trampa reemplazara a un tile impasable adyancente (solo pueden ser tiles que no tenga otro tile arriba, no esten offscreen ni sean parte de las paredes laterales)(no importa quien lo agarra)
- cada vez que se espawnee una bola de fuego amarilla hay un 20% de probabilidades de espawnear otra mas (Si algun player lo tiene no aparece)(no importa quien lo agarra)
- Tu fantasma aumenta de velocidad al doble de lo normal (Si ambos players lo tienen no aparece)(afecta a quien lo agarra)
- las monedas se vuelven rojas a medida que pierden valor (Si algun player lo tiene no aparece)(no importa quien lo agarra)

## Preguntas

- el rebote en los enemigos es automatico ahora?
- hay posbilidades de que algun elemento (enemigo, talisman, moneda) salga de pantalla por una explosion y quede fuera de alcance generando un soft lock?
- Sombra: Aparece un "clon de sombra" que imita tus movimientos con 1 segundo de retraso; si te toca, te stunea. (me interesa explorar esta idea mas adelante, puede haber una variante negativa/positiva)

## Aclaración sobre explosiones, fuego amigo y generación de proyectiles

- empujar un objeto (de la forma que fuese) lo convierte en un proyectil que por defecto afectan al otro equipo (los equipos son players/enemigos). es importante determinar "quien empujo", el proyectil creado tendra un color u otro dependiendo de esto
- el color de un proyectil indica a quienes afecta y como.
  - azules: las tiran los players, afectan al equipo enemigos
  - rojas: las tiran los enemigos y afectan al equipo playes
  - las bombas negras afectan a ambos equipos por igual (incluido a quien lanzó el proyectil)
- el pergamino "fuego amigo" elimina efectivamente el concepto de equipos. todos los proyectiles son de color negro (por defecto) y afectan a todos.

## Sugerencias

- cuando un enemigo entra en pantalla deberia ser intocable (intocable no daña, manipula ni afecta a otras entidades). de ese modo cuando "ingresan" al jeugo no te pueden dañar de manera injusta
- quizas sea mejor no pintar las monedas de rojo, se confunden mucho con los enemigos, podriamos simplemente "animarlas" para que se vayan deteriorando pero no cambie de color. entonces podriamos hacer que eso sea un pergamino negativo (que se vuelvan rojas con cada rebote), es decir, con el pergamino funcionarian como ahora (en adicion a la animacion de deterrioro/resquebrajamiento)
