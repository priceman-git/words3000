/* Дополнительные наборы: вкладки на главном экране рядом со «Словами».
   У каждого набора свои уроки по 10, свой прогресс, повторение через 24 часа и «Мои слова».
   Движок уроков общий (app.js): набор подменяет список W и, где нужно, задания этапов.
   Строка элемента — как в words.js: [en, ru, ipa, пример, перевод примера, 0, 'v', [], формы, пример 2, перевод 2]. */

// ---------- неправильные глаголы: 100 самых частых ----------
// уроки по образцу форм: 1 — все три формы одинаковые (cut — cut — cut), 2–6 — вторая и третья совпадают
// (buy — bought — bought), 7–10 — все разные (go — went — gone); внутри — по частотности
const IRR_SRC = `
put|put|put|класть, ставить|pʊt · pʊt · pʊt|I [put] the keys on the table.|Я [положил] ключи на стол.|Where have you [put] my phone?|Куда ты [положил] мой телефон?
set|set|set|ставить, устанавливать|sɛt · sɛt · sɛt|She [set] the alarm for six.|Она [поставила] будильник на шесть.|The date has been [set].|Дата уже [назначена].
let|let|let|позволять, пускать|lɛt · lɛt · lɛt|Dad [let] me drive his car.|Папа [разрешил] мне водить его машину.|They haven't [let] us in yet.|Нас ещё не [пустили].
cut|cut|cut|резать|kʌt · kʌt · kʌt|I [cut] my finger yesterday.|Вчера я [порезал] палец.|Have you [cut] the bread?|Ты [нарезал] хлеб?
hit|hit|hit|ударять, попадать|hɪt · hɪt · hɪt|The ball [hit] the window.|Мяч [попал] в окно.|The storm has [hit] the coast.|Шторм [обрушился] на побережье.
cost|cost|cost|стоить|kɔst · kɔst · kɔst|The ticket [cost] ten dollars.|Билет [стоил] десять долларов.|The repairs have [cost] us a lot.|Ремонт [обошёлся] нам дорого.
shut|shut|shut|закрывать|ʃʌt · ʃʌt · ʃʌt|He [shut] the door quietly.|Он тихо [закрыл] дверь.|The shop has [shut] for the day.|Магазин уже [закрылся] на сегодня.
hurt|hurt|hurt|ранить, причинять боль|hɜrt · hɜrt · hɜrt|I [hurt] my leg playing football.|Я [повредил] ногу, играя в футбол.|Nobody was [hurt] in the accident.|Никто не [пострадал] в аварии.
spread|spread|spread|распространять, намазывать|sprɛd · sprɛd · sprɛd|She [spread] butter on the toast.|Она [намазала] масло на тост.|The news has [spread] quickly.|Новость быстро [разлетелась].
quit|quit|quit|бросать, уходить|kwɪt · kwɪt · kwɪt|He [quit] his job last year.|В прошлом году он [уволился] с работы.|I have [quit] smoking.|Я [бросил] курить.
have|had|had|иметь|hæv · hæd · hæd|We [had] a great time.|Мы отлично [провели] время.|I've [had] this bike for years.|Этот велосипед [у меня] уже много лет.
say|said|said|сказать, говорить|seɪ · sɛd · sɛd|She [said] nothing.|Она ничего не [сказала].|Have you [said] thank you?|Ты [сказал] спасибо?
make|made|made|делать, создавать|meɪk · meɪd · meɪd|I [made] a cake for her birthday.|Я [испёк] торт на её день рождения.|This table is [made] of wood.|Этот стол [сделан] из дерева.
get|got|got/gotten|получать, становиться|ɡɛt · ɡɑt · ɡɑt (ˈɡɑtən)|I [got] your letter.|Я [получил] твоё письмо.|It has [got] colder.|[Стало] холоднее.
find|found|found|находить|faɪnd · faʊnd · faʊnd|I [found] a wallet in the street.|Я [нашёл] кошелёк на улице.|Have you [found] your keys?|Ты [нашёл] свои ключи?
tell|told|told|рассказывать, сообщать|tɛl · toʊld · toʊld|He [told] me a funny story.|Он [рассказал] мне смешную историю.|I've [told] you a hundred times!|Я [говорил] тебе сто раз!
feel|felt|felt|чувствовать|fil · fɛlt · fɛlt|I [felt] tired after work.|После работы я [чувствовал] усталость.|I have never [felt] so happy.|Я никогда не [чувствовал] себя таким счастливым.
leave|left|left|уходить, оставлять|liv · lɛft · lɛft|The train [left] at nine.|Поезд [ушёл] в девять.|I've [left] my bag at home.|Я [оставил] сумку дома.
keep|kept|kept|хранить, держать|kip · kɛpt · kɛpt|She [kept] all his letters.|Она [хранила] все его письма.|He has [kept] his promise.|Он [сдержал] обещание.
hold|held|held|держать, проводить|hoʊld · hɛld · hɛld|He [held] her hand.|Он [держал] её за руку.|The meeting was [held] on Monday.|Собрание было [проведено] в понедельник.
think|thought|thought|думать|θɪŋk · θɔt · θɔt|I [thought] you were at home.|Я [думал], ты дома.|Have you [thought] about it?|Ты [подумал] об этом?
bring|brought|brought|приносить|brɪŋ · brɔt · brɔt|She [brought] me some flowers.|Она [принесла] мне цветы.|What have you [brought]?|Что ты [принёс]?
buy|bought|bought|покупать|baɪ · bɔt · bɔt|We [bought] a new car.|Мы [купили] новую машину.|I've just [bought] the tickets.|Я только что [купил] билеты.
catch|caught|caught|ловить|kætʃ · kɔt · kɔt|The cat [caught] a mouse.|Кошка [поймала] мышь.|The police have [caught] the thief.|Полиция [поймала] вора.
teach|taught|taught|учить, преподавать|titʃ · tɔt · tɔt|My mother [taught] me to swim.|Мама [научила] меня плавать.|She has [taught] English for ten years.|Она [преподаёт] английский десять лет.
fight|fought|fought|бороться, драться|faɪt · fɔt · fɔt|The two boys [fought] in the yard.|Два мальчика [подрались] во дворе.|They have [fought] for their rights.|Они [боролись] за свои права.
seek|sought|sought|искать, стремиться|sik · sɔt · sɔt|He [sought] advice from a lawyer.|Он [обратился] за советом к юристу.|The police have [sought] witnesses.|Полиция [искала] свидетелей.
stand|stood|stood|стоять|stænd · stʊd · stʊd|We [stood] in the rain for an hour.|Мы час [стояли] под дождём.|This house has [stood] here for a century.|Этот дом [стоит] здесь уже сто лет.
understand|understood|understood|понимать|ˌʌndərˈstænd · ˌʌndərˈstʊd · ˌʌndərˈstʊd|I [understood] every word.|Я [понял] каждое слово.|Have you [understood] the task?|Вы [поняли] задание?
hear|heard|heard|слышать|hɪr · hɜrd · hɜrd|I [heard] a strange noise.|Я [услышал] странный шум.|Have you [heard] the news?|Ты [слышал] новость?
lose|lost|lost|терять, проигрывать|luz · lɔst · lɔst|Our team [lost] the game.|Наша команда [проиграла] матч.|I've [lost] my glasses.|Я [потерял] очки.
meet|met|met|встречать, знакомиться|mit · mɛt · mɛt|I [met] her at a party.|Я [познакомился] с ней на вечеринке.|Have we [met] before?|Мы раньше [встречались]?
pay|paid|paid|платить|peɪ · peɪd · peɪd|I [paid] for the coffee.|Я [заплатил] за кофе.|Have you [paid] the bill?|Ты [оплатил] счёт?
sit|sat|sat|сидеть|sɪt · sæt · sæt|We [sat] by the fire.|Мы [сидели] у костра.|He has [sat] here all day.|Он [сидит] здесь весь день.
build|built|built|строить|bɪld · bɪlt · bɪlt|They [built] a house by the lake.|Они [построили] дом у озера.|The bridge was [built] in 1990.|Мост был [построен] в 1990 году.
send|sent|sent|отправлять|sɛnd · sɛnt · sɛnt|I [sent] you an email.|Я [отправил] тебе письмо.|The parcel has been [sent].|Посылка [отправлена].
spend|spent|spent|тратить, проводить (время)|spɛnd · spɛnt · spɛnt|We [spent] the summer by the sea.|Мы [провели] лето на море.|I've [spent] all my money.|Я [потратил] все деньги.
lend|lent|lent|одалживать (кому-то)|lɛnd · lɛnt · lɛnt|She [lent] me her umbrella.|Она [одолжила] мне свой зонт.|I've [lent] my car to a friend.|Я [одолжил] машину другу.
bend|bent|bent|сгибать, наклоняться|bɛnd · bɛnt · bɛnt|He [bent] down to tie his shoe.|Он [наклонился], чтобы завязать шнурок.|The fork is [bent].|Вилка [погнута].
lead|led|led|вести, руководить|lid · lɛd · lɛd|She [led] us to the exit.|Она [вывела] нас к выходу.|This road has [led] us nowhere.|Эта дорога нас никуда не [привела].
sell|sold|sold|продавать|sɛl · soʊld · soʊld|He [sold] his old bike.|Он [продал] свой старый велосипед.|All the tickets have been [sold].|Все билеты [проданы].
win|won|won|побеждать, выигрывать|wɪn · wʌn · wʌn|Our team [won] the cup.|Наша команда [выиграла] кубок.|She has [won] a prize.|Она [выиграла] приз.
sleep|slept|slept|спать|slip · slɛpt · slɛpt|I [slept] badly last night.|Этой ночью я плохо [спал].|Have you [slept] at all?|Ты вообще [спал]?
read|read|read|читать|rid · rɛd · rɛd|I [read] this book last year.|Я [прочитал] эту книгу в прошлом году.|Have you [read] the news today?|Ты [читал] сегодня новости?
feed|fed|fed|кормить|fid · fɛd · fɛd|She [fed] the cat this morning.|Утром она [покормила] кошку.|Has the baby been [fed]?|Ребёнка [покормили]?
mean|meant|meant|значить, иметь в виду|min · mɛnt · mɛnt|Sorry, I [meant] Tuesday.|Простите, я [имел в виду] вторник.|I've always [meant] to call you.|Я всё [собирался] тебе позвонить.
deal|dealt|dealt|иметь дело, справляться|dil · dɛlt · dɛlt|She [dealt] with the problem quickly.|Она быстро [справилась] с проблемой.|Have you [dealt] with this before?|Ты [имел дело] с этим раньше?
sweep|swept|swept|подметать|swip · swɛpt · swɛpt|He [swept] the floor.|Он [подмёл] пол.|The yard has been [swept].|Двор [подметён].
bleed|bled|bled|кровоточить|blid · blɛd · blɛd|His nose [bled] for ten minutes.|У него десять минут [шла] кровь из носа.|The wound has [bled] a lot.|Рана сильно [кровоточила].
hang|hung|hung|вешать, висеть|hæŋ · hʌŋ · hʌŋ|I [hung] my coat on the hook.|Я [повесил] пальто на крючок.|The picture has [hung] there for years.|Картина [висит] там много лет.
stick|stuck|stuck|приклеивать, застревать|stɪk · stʌk · stʌk|She [stuck] a photo on the wall.|Она [приклеила] фото на стену.|We are [stuck] in traffic.|Мы [застряли] в пробке.
shoot|shot|shot|стрелять, снимать (фильм)|ʃut · ʃɑt · ʃɑt|He [shot] at the target and missed.|Он [выстрелил] в мишень и промахнулся.|The film was [shot] in Italy.|Фильм был [снят] в Италии.
lay|laid|laid|класть, накрывать (стол)|leɪ · leɪd · leɪd|She [laid] the baby on the bed.|Она [положила] малыша на кровать.|The table has been [laid] for dinner.|Стол [накрыт] к ужину.
light|lit|lit|зажигать, освещать|laɪt · lɪt · lɪt|He [lit] a candle.|Он [зажёг] свечу.|The room was [lit] by a lamp.|Комната была [освещена] лампой.
dig|dug|dug|копать|dɪɡ · dʌɡ · dʌɡ|The dog [dug] a hole in the garden.|Собака [выкопала] яму в саду.|They have [dug] a well.|Они [выкопали] колодец.
shine|shone|shone|светить, сиять|ʃaɪn · ʃoʊn · ʃoʊn|The sun [shone] all day.|Солнце [светило] весь день.|The stars have [shone] for billions of years.|Звёзды [светят] миллиарды лет.
swing|swung|swung|качать(ся), размахивать|swɪŋ · swʌŋ · swʌŋ|The door [swung] open.|Дверь [распахнулась].|His mood has [swung] again.|Его настроение снова [переменилось].
strike|struck|struck|ударять, бить|straɪk · strʌk · strʌk|The clock [struck] twelve.|Часы [пробили] двенадцать.|The tree was [struck] by lightning.|В дерево [ударила] молния.
spin|spun|spun|крутить(ся), прясть|spɪn · spʌn · spʌn|The wheel [spun] faster and faster.|Колесо [крутилось] всё быстрее.|The spider has [spun] a web.|Паук [сплёл] паутину.
slide|slid|slid|скользить, съезжать|slaɪd · slɪd · slɪd|The kids [slid] down the hill.|Дети [скатились] с горки.|The price has [slid] again.|Цена снова [поползла] вниз.
be|was/were|been|быть|bi · wʌz / wɜr · bɪn|I [was] at home yesterday.|Вчера я [был] дома.|Have you ever [been] to London?|Ты когда-нибудь [был] в Лондоне?
do|did|done|делать|du · dɪd · dʌn|I [did] my homework.|Я [сделал] домашнее задание.|Have you [done] it yet?|Ты уже [сделал] это?
go|went|gone|идти, ехать|ɡoʊ · wɛnt · ɡɔn|We [went] to the cinema.|Мы [ходили] в кино.|She has [gone] home.|Она [ушла] домой.
see|saw|seen|видеть|si · sɔ · sin|I [saw] him yesterday.|Я [видел] его вчера.|Have you [seen] this film?|Ты [видел] этот фильм?
know|knew|known|знать|noʊ · nu · noʊn|I [knew] the answer.|Я [знал] ответ.|I've [known] her for years.|Я [знаю] её много лет.
take|took|taken|брать|teɪk · tʊk · ˈteɪkən|I [took] a taxi to the airport.|Я [взял] такси до аэропорта.|Someone has [taken] my pen.|Кто-то [взял] мою ручку.
come|came|come|приходить|kʌm · keɪm · kʌm|He [came] home late.|Он [пришёл] домой поздно.|Spring has [come].|[Пришла] весна.
give|gave|given|давать|ɡɪv · ɡeɪv · ˈɡɪvən|She [gave] me a book.|Она [дала] мне книгу.|I've [given] him my number.|Я [дал] ему свой номер.
become|became|become|становиться|bɪˈkʌm · bɪˈkeɪm · bɪˈkʌm|He [became] a doctor.|Он [стал] врачом.|It has [become] a habit.|Это [стало] привычкой.
run|ran|run|бежать|rʌn · ræn · rʌn|I [ran] to the bus stop.|Я [побежал] к остановке.|She has [run] a marathon.|Она [пробежала] марафон.
begin|began|begun|начинать|bɪˈɡɪn · bɪˈɡæn · bɪˈɡʌn|The film [began] at eight.|Фильм [начался] в восемь.|It has [begun] to rain.|[Начался] дождь.
write|wrote|written|писать|raɪt · roʊt · ˈrɪtən|I [wrote] her a letter.|Я [написал] ей письмо.|The book was [written] in 1950.|Книга была [написана] в 1950 году.
speak|spoke|spoken|говорить|spik · spoʊk · ˈspoʊkən|He [spoke] very quietly.|Он [говорил] очень тихо.|English is [spoken] here.|Здесь [говорят] по-английски.
eat|ate|eaten|есть, кушать|it · eɪt · ˈitən|We [ate] pizza for dinner.|На ужин мы [ели] пиццу.|Have you [eaten] yet?|Ты уже [поел]?
drink|drank|drunk|пить|drɪŋk · dræŋk · drʌŋk|She [drank] a glass of water.|Она [выпила] стакан воды.|I've [drunk] too much coffee.|Я [выпил] слишком много кофе.
drive|drove|driven|водить, ехать (за рулём)|draɪv · droʊv · ˈdrɪvən|He [drove] to work.|Он [поехал] на работу на машине.|Have you ever [driven] a truck?|Ты когда-нибудь [водил] грузовик?
fall|fell|fallen|падать|fɔl · fɛl · ˈfɔlən|I [fell] off my bike.|Я [упал] с велосипеда.|Prices have [fallen].|Цены [упали].
fly|flew|flown|летать|flaɪ · flu · floʊn|We [flew] to Paris.|Мы [полетели] в Париж.|Have you ever [flown] business class?|Ты когда-нибудь [летал] бизнес-классом?
forget|forgot|forgotten|забывать|fərˈɡɛt · fərˈɡɑt · fərˈɡɑtən|I [forgot] his name.|Я [забыл] его имя.|Have you [forgotten] me?|Ты меня [забыл]?
grow|grew|grown|расти, выращивать|ɡroʊ · ɡru · ɡroʊn|She [grew] up in a village.|Она [выросла] в деревне.|You have [grown] so much!|Как ты [вырос]!
choose|chose|chosen|выбирать|tʃuz · tʃoʊz · ˈtʃoʊzən|I [chose] the red dress.|Я [выбрала] красное платье.|Have you [chosen] a gift?|Ты [выбрал] подарок?
break|broke|broken|ломать, разбивать|breɪk · broʊk · ˈbroʊkən|He [broke] a cup.|Он [разбил] чашку.|The window has been [broken].|Окно [разбито].
wear|wore|worn|носить (одежду)|wɛr · wɔr · wɔrn|She [wore] a blue dress.|На ней [было] синее платье.|These shoes have been [worn] only once.|Эти туфли [надевали] только раз.
throw|threw|thrown|бросать|θroʊ · θru · θroʊn|He [threw] the ball to me.|Он [бросил] мне мяч.|I've [thrown] away my old shoes.|Я [выбросил] старые туфли.
show|showed|shown|показывать|ʃoʊ · ʃoʊd · ʃoʊn|She [showed] me her photos.|Она [показала] мне свои фото.|The film was [shown] on TV.|Фильм [показали] по телевизору.
ride|rode|ridden|ездить (верхом, на велосипеде)|raɪd · roʊd · ˈrɪdən|We [rode] our bikes to the park.|Мы [поехали] в парк на велосипедах.|Have you ever [ridden] a horse?|Ты когда-нибудь [ездил] на лошади?
rise|rose|risen|подниматься, вставать|raɪz · roʊz · ˈrɪzən|The sun [rose] at six.|Солнце [взошло] в шесть.|Prices have [risen] again.|Цены снова [выросли].
sing|sang|sung|петь|sɪŋ · sæŋ · sʌŋ|She [sang] a beautiful song.|Она [спела] красивую песню.|Have you ever [sung] on stage?|Ты когда-нибудь [пел] на сцене?
swim|swam|swum|плавать|swɪm · swæm · swʌm|We [swam] in the lake.|Мы [плавали] в озере.|I have never [swum] in the ocean.|Я никогда не [плавал] в океане.
steal|stole|stolen|красть|stil · stoʊl · ˈstoʊlən|Someone [stole] my bike.|Кто-то [украл] мой велосипед.|My wallet has been [stolen]!|У меня [украли] кошелёк!
hide|hid|hidden|прятать(ся)|haɪd · hɪd · ˈhɪdən|The children [hid] behind the tree.|Дети [спрятались] за деревом.|Where have you [hidden] the keys?|Куда ты [спрятал] ключи?
bite|bit|bitten|кусать|baɪt · bɪt · ˈbɪtən|The dog [bit] the postman.|Собака [укусила] почтальона.|I've been [bitten] by a mosquito.|Меня [укусил] комар.
shake|shook|shaken|трясти|ʃeɪk · ʃʊk · ˈʃeɪkən|He [shook] my hand.|Он [пожал] мне руку.|She was [shaken] by the news.|Она была [потрясена] новостью.
draw|drew|drawn|рисовать|drɔ · dru · drɔn|My son [drew] a cat.|Мой сын [нарисовал] кошку.|Have you [drawn] the map?|Ты [нарисовал] карту?
freeze|froze|frozen|замерзать, замораживать|friz · froʊz · ˈfroʊzən|The lake [froze] in December.|Озеро [замёрзло] в декабре.|The river has [frozen].|Река [замёрзла].
forgive|forgave|forgiven|прощать|fərˈɡɪv · fərˈɡeɪv · fərˈɡɪvən|She [forgave] him.|Она [простила] его.|Have you [forgiven] me?|Ты меня [простил]?
ring|rang|rung|звонить, звенеть|rɪŋ · ræŋ · rʌŋ|The phone [rang] twice.|Телефон [зазвонил] дважды.|Has the bell [rung]?|Звонок уже [прозвенел]?
wake|woke|woken|будить, просыпаться|weɪk · woʊk · ˈwoʊkən|I [woke] up at seven.|Я [проснулся] в семь.|The noise has [woken] the baby.|Шум [разбудил] ребёнка.
lie|lay|lain|лежать|laɪ · leɪ · leɪn|She [lay] on the sofa all evening.|Весь вечер она [лежала] на диване.|The letter has [lain] on the desk for a week.|Письмо [лежит] на столе уже неделю.
blow|blew|blown|дуть|bloʊ · blu · bloʊn|The wind [blew] all night.|Ветер [дул] всю ночь.|The storm has [blown] the roof off.|Буря [сорвала] крышу.`;

const IRR = IRR_SRC.trim().split('\n').map(s => {
  const [b, p2, p3, r, ip, e1, r1, e2, r2] = s.split('|');
  return [b, r, ip, e1, r1, 0, 'v', [], [b, p2, p3], e2, r2];
});

// формы для упражнений: из «was/were», «got/gotten» берём первую
const form = (i, k) => W[i][8][k].split('/')[0];
const FORM_TAG = ['инфинитив', 'Past Simple', 'Past Participle'];
const FORM_NAME = ['1-я форма', '2-я форма (Past Simple)', '3-я форма (Past Participle)'];

// правдоподобные ошибки: «правильное» окончание -ed (goed, cutted), путаница 2-й и 3-й формы, формы похожих глаголов урока
function regularEd(b) {
  if (/e$/.test(b)) return b + 'd';
  if (/[^aeiou]y$/.test(b)) return b.slice(0, -1) + 'ied';
  if (/^[^aeiou]*[aeiou][bdgkmnprt]$/.test(b)) return b + b.slice(-1) + 'ed';
  return b + 'ed';
}
function irrOptions(i, k) {
  const ok = form(i, k), b = form(i, 0), out = [ok];
  const add = v => { if (v && !out.includes(v) && out.length < 4) out.push(v); };
  add(form(i, 3 - k)); if (b.length > 2) add(regularEd(b));   // «bed» от be — настоящее слово, не берём
  const near = shuffle(range(0, W.length).filter(j => j !== i && lessonOf(j) === lessonOf(i)));
  for (const j of near) { const v = form(j, k); if (v.slice(-2) === ok.slice(-2) && v.length > 2) add(v); }
  if (k === 2) add(ok.endsWith('en') ? ok.slice(0, -1) : form(i, 1) + 'en');
  add(ok + (/e$/.test(ok) ? 'd' : 'ed')); add(b + 's');
  return shuffle(out);
}

// карточка «Изучение»: три формы с озвучкой каждой, перевод, два примера (прошедшее и причастие)
function irrStudy(app) {
  const i = curI(), all = lessonIds(run.n), k = all.indexOf(i) + 1, f = W[i][8], ip = W[i][2].split(' · ');
  const hide = S.set.hideRu;
  const exHTML = (e, r, n) => `<div class="ex"><div class="en">${hl(e)}</div>
    <div class="sline"><button class="spk" data-sayex="${n}" aria-label="Произнести пример">${I.spk}</button></div><div class="ruex">${hl(r)}</div></div>`;
  app.classList.add('fit');
  app.innerHTML = `<div class="xfit"><div class="xhead"><button class="back" id="xback" aria-label="Назад">${I.back}</button>
      <button class="trtog ${hide ? 'on' : ''}" id="trtog" aria-pressed="${hide}"><span class="sw"></span>Скрывать перевод</button>
      <button class="mute ${S.set.auto ? 'on' : ''}" id="auto" aria-label="Автоозвучка">${S.set.auto ? I.spk : I.mute}</button></div>
    <div class="pbar"><span class="seg ok" style="left:0;width:${k / all.length * 100}%"></span><span class="cnt">${k}</span><span class="tot">${all.length}</span></div>
    <div class="xbody study irr ${hide ? 'hide-tr' : ''}" id="study">
      <div class="forms">${f.map((w, n) => `<button class="form" data-f="${n}"><small>${n + 1}</small><b>${esc(w)}</b><span>${esc(ip[n] || '')}</span><i>${FORM_TAG[n]}</i></button>`).join('')}</div>
      <div class="ru"><span class="tr">${esc(ru(i))}</span><button class="peek" id="peek">Показать перевод</button></div>
      <div class="ex-box">${exHTML(W[i][3], W[i][4], 1)}${exHTML(W[i][9], W[i][10], 2)}</div>
      <div class="big-btns"><button class="bbtn teal" id="know">Знаю глагол</button><button class="bbtn lime" id="learn">Выучить глагол</button></div></div></div>`;
  // длинные формы (understood) — мельче шрифт, чтобы слово не переносилось
  $$('.form b').forEach(el => { let fs = 28; while (el.scrollWidth > el.clientWidth + 1 && fs > 13) el.style.fontSize = --fs + 'px'; });
  $('#xback').onclick = exitRun;
  $('#study').onclick = e => {
    const b = e.target.closest('[data-f]'); if (b) return speak(f[+b.dataset.f].replace('/', ', '));
    const x = e.target.closest('[data-sayex]'); if (x) speak(plain(W[i][x.dataset.sayex === '1' ? 3 : 9]));
  };
  $('#auto').onclick = () => { S.set.auto = !S.set.auto; save(); const b = $('#auto'); b.classList.toggle('on', S.set.auto); b.innerHTML = S.set.auto ? I.spk : I.mute; };
  const decide = d => { L(run.n).dec[i] = d; if (d === 'k') wmut(i).learned = 1; bumpDay(); save(); nextWord(); };
  const reveal = () => $('#study').classList.remove('hide-tr');
  $('#peek').onclick = reveal;
  $('#trtog').onclick = () => {
    S.set.hideRu = !S.set.hideRu; save();
    $('#study').classList.toggle('hide-tr', S.set.hideRu);
    $('#trtog').classList.toggle('on', S.set.hideRu); $('#trtog').setAttribute('aria-pressed', S.set.hideRu);
  };
  $('#know').onclick = () => decide('k');
  $('#learn').onclick = () => decide('l');
  onKey = e => {
    if (e.key === 'ArrowLeft') decide('k'); else if (e.key === 'ArrowRight' || e.key === 'Enter') decide('l');
    else if (e.key === ' ') { e.preventDefault(); reveal(); }
  };
  if (S.set.auto) sayWord(i);
}

// «Запоминание»: «2-я форма от go?» — went / goed / gone / goes; у «cut — cut — cut» спрашиваем 2-ю или 3-ю наугад
function irrMemo(app) {
  const i = curI();
  if (run.ask === undefined || run.askI !== i) { run.askI = i; run.ask = Math.random() < 0.5 ? 1 : 2; }
  const k = run.ask, ok = form(i, k), opts = irrOptions(i, k);
  let hinted = false, answered = false;
  app.innerHTML = header('Запоминание', i) + pbar() + `<div class="xbody">
    <div class="bigword">${esc(form(i, 0))}</div><div class="ipa">${esc(ru(i))}</div>
    <div class="ask">${FORM_NAME[k]}?</div>
    ${tools(i, false)}
    <div class="opts" id="opts">${opts.map(v => `<button class="opt" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div></div>`;
  bindCommon(i);
  $('#snd').onclick = () => speak(form(i, 0));
  const h = $('#hint');
  if (h) h.onclick = () => {
    if (hinted || !run.hints || answered) return;
    hinted = true; useHint(h);
    opts.filter(v => v !== ok).slice(0, 2).forEach(v => $(`.opt[data-v="${v}"]`).classList.add('gone'));
  };
  const choose = b => {
    if (!b || answered || b.classList.contains('gone')) return;
    answered = true; $('#opts').classList.add('lock');
    const good = b.dataset.v === ok;
    b.classList.add(good ? 'ok' : 'bad');
    if (!good) $(`.opt[data-v="${ok}"]`).classList.add('ok');
    commit(i, good ? STAGE_PTS - (hinted ? 1 : 0) : 0, good, good ? 0 : 1, hinted);
    setTimeout(() => answerSheet(i, good), 350);
  };
  $('#opts').onclick = e => choose(e.target.closest('.opt'));
  onKey = e => { const n = +e.key; if (n >= 1 && n <= 4) choose($$('.opt')[n - 1]); };
}

window.SETS = {
  irr: {
    name: 'Неправильные глаголы', tab: 'Неправильные глаголы', title: 'Неправильные глаголы',
    sub: '100 самых частых в английском', note: 'go — went — gone: три формы, примеры и озвучка',
    unit: ['глагол', 'глагола', 'глаголов'], items: IRR,
    study: irrStudy, memo: irrMemo,
    matchCap: 'Соедините глагол с его формами',
    matchL: i => form(i, 0), matchR: i => W[i][8].slice(1).join(' · '),
    // этапы с буквами: «Аудирование» — услышать три формы и собрать 2-ю и 3-ю; «Написание» — то же по 1-й форме;
    // «Закрепление» и мини-тест — по переводу напечатать все три
    target: (i, key) => (key === 'fix' ? [0, 1, 2] : [1, 2]).map(k => form(i, k)).join(' '),
    prompt: (i, key) => key === 'audio' ? `<div class="listen-cap">Соберите 2-ю и 3-ю формы</div><button class="listen" id="listen" aria-label="Прослушать">${I.spk}</button>`
      : key === 'write' ? `<div class="bigword">${esc(form(i, 0))}</div><div class="ask">${esc(ru(i))} · 2-я и 3-я формы</div>`
      : `<div class="bigword ru">${esc(ru(i))}</div><div class="ask">все три формы</div>`,
  },
};
