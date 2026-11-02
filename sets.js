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

// ---------- общие экраны наборов ----------
// «Изучение»: верх карточки (top) задаёт набор; ниже — перевод, два примера с озвучкой, «Знаю» / «Выучить»
function setStudy(app, { cls, top, onTop, exs = 2 }) {
  const i = curI(), all = lessonIds(run.n), k = all.indexOf(i) + 1, unit = curSet().acc || curSet().unit[0];   // «Знаю глагол», «Знаю идиому»
  const hide = S.set.hideRu;
  const exHTML = (e, r, n) => `<div class="ex"><div class="en">${hl(e)}</div>
    <div class="sline"><button class="spk" data-sayex="${n}" aria-label="Произнести пример">${I.spk}</button></div><div class="ruex">${hl(r)}</div></div>`;
  app.classList.add('fit');
  app.innerHTML = `<div class="xfit"><div class="xhead"><button class="back" id="xback" aria-label="Назад">${I.back}</button>
      <button class="trtog ${hide ? 'on' : ''}" id="trtog" aria-pressed="${hide}"><span class="sw"></span>Скрывать перевод</button>
      <button class="mute ${S.set.auto ? 'on' : ''}" id="auto" aria-label="Автоозвучка">${S.set.auto ? I.spk : I.mute}</button></div>
    <div class="pbar"><span class="seg ok" style="left:0;width:${k / all.length * 100}%"></span><span class="cnt">${k}</span><span class="tot">${all.length}</span></div>
    <div class="xbody study setcard ${cls} ${hide ? 'hide-tr' : ''}" id="study">${top}
      <div class="ru"><span class="tr">${esc(ru(i))}</span><button class="peek" id="peek">Показать перевод</button></div>
      <div class="ex-box">${exHTML(W[i][3], W[i][4], 1)}${exs > 1 ? exHTML(W[i][9], W[i][10], 2) : ''}</div>
      <div class="big-btns"><button class="bbtn teal" id="know">Знаю ${unit}</button><button class="bbtn lime" id="learn">Выучить ${unit}</button></div></div></div>`;
  $('#xback').onclick = exitRun;
  $('#study').onclick = e => {
    if (onTop && onTop(e)) return;
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
// «Запоминание»: задание (top) и 4 варианта; подсказка убирает 2 неверных
function setMemo(app, { top, opts, ok, say, silent }) {
  const i = curI();
  let hinted = false, answered = false;
  app.innerHTML = header('Запоминание', i) + pbar() + `<div class="xbody">${top}
    ${tools(i, false)}
    <div class="opts" id="opts">${opts.map(v => `<button class="opt" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div></div>`;
  bindCommon(i);
  $('#snd').onclick = say;
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
  if (S.set.auto && !silent) say();   // автоозвучка — как в «Запоминании» основного курса
}

// карточка глагола: три формы с озвучкой каждой
function irrStudy(app) {
  const i = curI(), f = W[i][8], ip = W[i][2].split(' · ');
  setStudy(app, {
    cls: 'irr',
    top: `<div class="forms">${f.map((w, n) => `<button class="form" data-f="${n}"><small>${n + 1}</small><b>${esc(w)}</b><span>${esc(ip[n] || '')}</span><i>${FORM_TAG[n]}</i></button>`).join('')}</div>`,
    onTop: e => { const b = e.target.closest('[data-f]'); if (b) { speak(f[+b.dataset.f].replace('/', ', ')); return true; } },
  });
  // длинные формы (understood) — мельче шрифт, чтобы слово не переносилось
  $$('.form b').forEach(el => { let fs = 28; while (el.scrollWidth > el.clientWidth + 1 && fs > 13) el.style.fontSize = --fs + 'px'; });
}
// «2-я форма от go?» — went / goed / gone / goes; у «cut — cut — cut» спрашиваем 2-ю или 3-ю наугад
function irrMemo(app) {
  const i = curI();
  if (run.ask === undefined || run.askI !== i) { run.askI = i; run.ask = Math.random() < 0.5 ? 1 : 2; }
  const k = run.ask;
  setMemo(app, {
    top: `<div class="bigword">${esc(form(i, 0))}</div><div class="ipa">${esc(ru(i))}</div><div class="ask">${FORM_NAME[k]}?</div>`,
    opts: irrOptions(i, k), ok: form(i, k), say: () => speak(form(i, 0)),
  });
}

// ---------- предлоги: 40 значений, уроки по 5 ----------
// сначала место, движение и прочие — от самых частых к редким, в конце — время (уроки 10–12).
// Для каждого — схема: коробка и шарик (место и движение) или шкала времени.
const PREP_SRC = `
in|в, внутри|ɪn|in|The keys are [in] the box.|Ключи [в] коробке.|There is milk [in] the fridge.|[В] холодильнике есть молоко.
to|в, к (куда)|tu|to|I go [to] school every day.|Я хожу [в] школу каждый день.|Come [to] me.|Иди [ко] мне.
for|для|fɔr|forwho|This gift is [for] you.|Этот подарок [для] тебя.|I bought flowers [for] my mum.|Я купил цветы [для] мамы.
with|с (вместе)|wɪð|with|I went to the cinema [with] my sister.|Я ходил в кино [с] сестрой.|Do you want coffee [with] milk?|Хочешь кофе [с] молоком?
on|на (поверхности)|ɑn|on|The book is [on] the table.|Книга [на] столе.|There's a picture [on] the wall.|[На] стене висит картина.
at|у, в, на (в точке)|æt|at|I'm [at] the bus stop.|Я [на] остановке.|Meet me [at] the station.|Встретимся [на] вокзале.
from|из, от|frʌm|from|I'm [from] Russia.|Я [из] России.|I got a letter [from] my friend.|Я получил письмо [от] друга.
about|о, про|əˈbaʊt|about|Tell me [about] your trip.|Расскажи мне [о] своей поездке.|This book is [about] love.|Эта книга [про] любовь.
into|в (внутрь)|ˈɪntu|into|He jumped [into] the water.|Он прыгнул [в] воду.|Put the milk [into] the fridge.|Поставь молоко [в] холодильник.
like|как, похожий на|laɪk|like|She sings [like] a bird.|Она поёт [как] птица.|You look [like] your father.|Ты [похож на] своего отца.
through|сквозь, через|θru|through|We walked [through] the forest.|Мы шли [через] лес.|The light came [through] the window.|Свет проникал [сквозь] окно.
over|через, над (движение)|ˈoʊvər|over|The dog jumped [over] the fence.|Собака перепрыгнула [через] забор.|A plane flew [over] our house.|Самолёт пролетел [над] нашим домом.
between|между|bɪˈtwin|between|The shop is [between] the bank and the school.|Магазин [между] банком и школой.|Sit [between] us.|Садись [между] нами.
out of|из (наружу)|ˈaʊt əv|outof|She ran [out of] the room.|Она выбежала [из] комнаты.|Take the cake [out of] the oven.|Достань торт [из] духовки.
against|против|əˈɡɛnst|versus|We played [against] a strong team.|Мы играли [против] сильной команды.|Are you for or [against] the plan?|Ты за или [против] этого плана?
without|без|wɪˈðaʊt|without|I can't live [without] music.|Я не могу жить [без] музыки.|Coffee [without] sugar, please.|Кофе [без] сахара, пожалуйста.
under|под|ˈʌndər|under|The cat is [under] the bed.|Кошка [под] кроватью.|I found my phone [under] the sofa.|Я нашёл телефон [под] диваном.
around|вокруг|əˈraʊnd|around|The Earth goes [around] the Sun.|Земля вращается [вокруг] Солнца.|We sat [around] the fire.|Мы сидели [вокруг] костра.
among|среди (многих)|əˈmʌŋ|among|The house is [among] the trees.|Дом [среди] деревьев.|She was [among] the best students.|Она была [среди] лучших студентов.
behind|позади, за|bɪˈhaɪnd|behind|The car is [behind] the house.|Машина [за] домом.|Someone is standing [behind] you.|[Позади] тебя кто-то стоит.
across|через (на другую сторону)|əˈkrɔs|across|We swam [across] the river.|Мы переплыли [через] реку.|Walk [across] the bridge.|Перейди [через] мост.
towards|по направлению к|təˈwɔrdz|towards|He walked [towards] the door.|Он пошёл [к] двери.|The dog ran [towards] me.|Собака побежала [ко] мне.
above|над, выше|əˈbʌv|above|A lamp hangs [above] the table.|[Над] столом висит лампа.|We flew [above] the clouds.|Мы летели [над] облаками.
near|недалеко от, около|nɪr|near|I live [near] the park.|Я живу [недалеко от] парка.|Is there a bank [near] here?|Здесь [поблизости] есть банк?
along|вдоль, по|əˈlɔŋ|along|We walked [along] the beach.|Мы гуляли [вдоль] пляжа.|Go [along] this street.|Идите [по] этой улице.
inside|внутри|ɪnˈsaɪd|inside|The children are playing [inside] the house.|Дети играют [внутри] дома.|It's warm [inside].|[Внутри] тепло.
outside|снаружи, за пределами|ˌaʊtˈsaɪd|outside|There's a taxi [outside] the hotel.|[У] отеля, на улице, стоит такси.|The dog sleeps [outside] the house.|Собака спит [снаружи], не в доме.
by|на (о транспорте)|baɪ|bybus|I go to work [by] bus.|Я езжу на работу [на] автобусе.|They travelled [by] train.|Они путешествовали [на] поезде.
below|ниже, под (уровнем)|bɪˈloʊ|below|The fish swim [below] the surface.|Рыбы плавают [под] поверхностью воды.|The temperature is [below] zero.|Температура [ниже] нуля.
onto|на (движение)|ˈɑntu|onto|The cat jumped [onto] the table.|Кошка запрыгнула [на] стол.|He climbed [onto] the roof.|Он залез [на] крышу.
off|с (поверхности)|ɔf|off|The cup fell [off] the table.|Чашка упала [со] стола.|Get [off] the bus at the next stop.|Выйди [из] автобуса на следующей остановке.
up|вверх по, на|ʌp|up|We walked [up] the hill.|Мы поднялись [на] холм.|The cat ran [up] the tree.|Кошка взбежала [на] дерево.
down|вниз по, с|daʊn|down|The ball rolled [down] the hill.|Мяч скатился [с] холма.|Go [down] the stairs.|Спуститесь [по] лестнице.
past|мимо|pæst|past|She walked [past] me.|Она прошла [мимо] меня.|Drive [past] the church and turn left.|Проезжайте [мимо] церкви и поверните налево.
next to|рядом с, вплотную|ˈnɛkst tu|nextto|Sit [next to] me.|Сядь [рядом со] мной.|The bank is [next to] the café.|Банк [рядом с] кафе.
in front of|перед|ɪn ˈfrʌnt əv|front|Don't stand [in front of] the TV.|Не стой [перед] телевизором.|We met [in front of] the cinema.|Мы встретились [перед] кинотеатром.
opposite|напротив|ˈɑpəzɪt|opposite|The pharmacy is [opposite] the bank.|Аптека [напротив] банка.|She sat [opposite] me.|Она села [напротив] меня.
except|кроме|ɪkˈsɛpt|except|Everyone came [except] Tom.|Пришли все, [кроме] Тома.|I eat everything [except] fish.|Я ем всё, [кроме] рыбы.
despite|несмотря на|dɪˈspaɪt|despite|We went out [despite] the rain.|Мы вышли [несмотря на] дождь.|[Despite] the cold, she wore a dress.|[Несмотря на] холод, она надела платье.
beyond|за, по ту сторону|biˈjɑnd|beyond|There is a village [beyond] the hills.|[За] холмами есть деревня.|The town is just [beyond] the bridge.|Город сразу [за] мостом.
instead of|вместо|ɪnˈstɛd əv|instead|I'll have tea [instead of] coffee.|Я буду чай [вместо] кофе.|She went [instead of] me.|Она пошла [вместо] меня.
away from|прочь от, подальше от|əˈweɪ frəm|away|Keep [away from] the fire!|Держись [подальше от] огня!|He walked [away from] the house.|Он ушёл [прочь от] дома.
on top of|на самом верху, поверх|ɑn ˈtɑp əv|ontop|The cat is sleeping [on top of] the fridge.|Кошка спит [на] холодильнике.|Put this book [on top of] the others.|Положи эту книгу [поверх] остальных.
ahead of|впереди|əˈhɛd əv|ahead|She was running [ahead of] me.|Она бежала [впереди] меня.|We have a long day [ahead of] us.|[Впереди] у нас долгий день.
far from|далеко от|ˈfɑr frəm|farfrom|We live [far from] the city centre.|Мы живём [далеко от] центра города.|The station isn't [far from] here.|Вокзал не [далеко] отсюда.
at|в (момент времени)|æt|t_at|The film starts [at] 7 o'clock.|Фильм начинается [в] 7 часов.|I'll see you [at] noon.|Увидимся [в] полдень.
on|в (день, дата)|ɑn|t_on|My birthday is [on] Monday.|Мой день рождения [в] понедельник.|The shop is closed [on] Sundays.|Магазин закрыт [по] воскресеньям.
in|в (месяц, год, период)|ɪn|t_in|I was born [in] July.|Я родился [в] июле.|We moved here [in] 2020.|Мы переехали сюда [в] 2020 году.
before|до, перед|bɪˈfɔr|t_before|Wash your hands [before] dinner.|Мой руки [перед] ужином.|Come home [before] ten.|Приходи домой [до] десяти.
after|после|ˈæftər|t_after|Let's go for a walk [after] lunch.|Пойдём гулять [после] обеда.|Call me [after] work.|Позвони мне [после] работы.
for|в течение, на (срок)|fɔr|t_for|I lived there [for] two years.|Я жил там [в течение] двух лет.|We're going away [for] a week.|Мы уезжаем [на] неделю.
since|с (и до сих пор)|sɪns|t_since|I've lived here [since] 2015.|Я живу здесь [с] 2015 года.|She has been waiting [since] morning.|Она ждёт [с] утра.
during|во время|ˈdʊrɪŋ|t_during|Don't talk [during] the film.|Не разговаривай [во время] фильма.|He slept [during] the lesson.|Он спал [во время] урока.
until|до (какого-то момента)|ənˈtɪl|t_until|Wait [until] six.|Подожди [до] шести.|The shop is open [until] 9 pm.|Магазин открыт [до] 9 вечера.
by|к (не позже)|baɪ|t_by|Finish it [by] Friday.|Закончи это [к] пятнице.|I'll be home [by] 8.|Я буду дома [к] 8 часам.
from|с (о времени: с … до)|frʌm|t_from|I work [from] 9 to 5.|Я работаю [с] 9 до 5.|The shop is open [from] Monday to Friday.|Магазин открыт [с] понедельника по пятницу.
around|около (о времени)|əˈraʊnd|t_around|Let's meet [around] six.|Давай встретимся [около] шести.|I'll be back [around] noon.|Я вернусь [около] полудня.
within|в течение, не позже чем через|wɪˈðɪn|t_within|I'll answer [within] a week.|Я отвечу [в течение] недели.|The parcel will arrive [within] two days.|Посылка придёт [в течение] двух дней.
throughout|на протяжении всего|θruˈaʊt|t_throughout|It rained [throughout] the day.|Дождь шёл [на протяжении всего] дня.|The shop is open [throughout] the year.|Магазин работает [на протяжении всего] года.
past|после (о времени: ten past…)|pæst|t_past|It's ten [past] six.|Сейчас десять минут [седьмого].|We left at half [past] eight.|Мы ушли [в половине] девятого.
`;

const PREP = PREP_SRC.trim().split('\n').map(s => {
  const [p, r, ip, sch, e1, r1, e2, r2] = s.split('|');
  return [p, r, ip, e1, r1, 0, 'p', [], null, e2, r2, sch];
});

// схемы: виды сбоку (коробка и шарик), сверху (дорога, река, дом) и шкала времени
const SC = { ball: '#f0592b', blue: '#5b8db8', arr: '#2c6a8c', g: '#b9c0c5', water: '#cfe3ef', road: '#e1e5e8', asph: '#a7b0b6', no: '#d2334a' };
const box = (x, y, s = 1, op = 1) => {
  const w = 56 * s, h = 46 * s, d = 14 * s;
  return `<polygon points="${x},${y} ${x + d},${y - d} ${x + w + d},${y - d} ${x + w},${y}" fill="#e6e9eb" stroke="#9aa3a9" stroke-width="1.5"/>
  <polygon points="${x + w},${y} ${x + w + d},${y - d} ${x + w + d},${y + h - d} ${x + w},${y + h}" fill="#c9cfd3" stroke="#9aa3a9" stroke-width="1.5"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#d7dcdf" fill-opacity="${op}" stroke="#9aa3a9" stroke-width="1.5"/>`;
};
const boxDash = (x, y, s = 1) => box(x, y, s, .55).replace(/fill="#e6e9eb"|fill="#c9cfd3"/g, 'fill="#d7dcdf" fill-opacity=".55"').replace(/stroke-width="1.5"/g, 'stroke-width="2" stroke-dasharray="5 4"');
const ball = (x, y, r = 11) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${SC.ball}"/>`;
const bball = (x, y, r = 11) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${SC.blue}"/>`;   // второй шарик — другого цвета
const cross = (x, y, d = 12) => `<path d="M${x - d},${y - d} L${x + d},${y + d} M${x + d},${y - d} L${x - d},${y + d}" stroke="${SC.no}" stroke-width="3.5" stroke-linecap="round"/>`;
const roadH = (y, h = 30) => `<rect x="0" y="${y}" width="160" height="${h}" fill="${SC.asph}"/><line x1="0" y1="${y + 2}" x2="160" y2="${y + 2}" stroke="#fff" stroke-width="2"/><line x1="0" y1="${y + h - 2}" x2="160" y2="${y + h - 2}" stroke="#fff" stroke-width="2"/><line x1="0" y1="${y + h / 2}" x2="160" y2="${y + h / 2}" stroke="#fff" stroke-width="2.5" stroke-dasharray="10 7"/>`;
const roadV = (x, w = 48) => `<rect x="${x}" y="0" width="${w}" height="128" fill="${SC.asph}"/><line x1="${x + 2}" y1="0" x2="${x + 2}" y2="128" stroke="#fff" stroke-width="2"/><line x1="${x + w - 2}" y1="0" x2="${x + w - 2}" y2="128" stroke="#fff" stroke-width="2"/><line x1="${x + w / 2}" y1="0" x2="${x + w / 2}" y2="128" stroke="#fff" stroke-width="2.5" stroke-dasharray="10 7"/>`;
const zebra = (x, w, y, h) => Array.from({ length: Math.floor(h / 8) }, (_, k) => `<rect x="${x + 4}" y="${y + k * 8}" width="${w - 8}" height="4" fill="#fff"/>`).join('');
const gball = (x, y, r = 10) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${SC.g}"/>`;
const ghost = (x, y, r = 11) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${SC.ball}" stroke-width="2" stroke-dasharray="3 3"/>`;
const ground = `<line x1="6" y1="118" x2="154" y2="118" stroke="${SC.g}" stroke-width="2"/>`;
const arrow = (d, dash) => `<path d="${d}" fill="none" stroke="${SC.arr}" stroke-width="3" ${dash ? 'stroke-dasharray="6 5"' : ''} marker-end="url(#MK)"/>`;
const topBox = (x, y, w = 40, h = 30) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#d7dcdf" stroke="#9aa3a9" stroke-width="1.5"/>`;
const tline = `<line x1="10" y1="80" x2="150" y2="80" stroke="${SC.g}" stroke-width="3"/>` + [30, 55, 80, 105, 130].map(x => `<line x1="${x}" y1="74" x2="${x}" y2="86" stroke="${SC.g}" stroke-width="2"/>`).join('');
const lbl = (x, t, c = '#555', y = 108) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="15" fill="${c}" font-family="Roboto Condensed, sans-serif">${t}</text>`;
const mark = (x, t) => `<line x1="${x}" y1="58" x2="${x}" y2="92" stroke="${SC.arr}" stroke-width="3"/>` + lbl(x, t, SC.arr);
const slope = `<path d="M10,118 L150,30 L150,118 Z" fill="#e6e9eb" stroke="#9aa3a9" stroke-width="1.5"/>`;
const SCHEMES = {
  in: ground + ball(73, 96) + boxDash(45, 72),
  on: ground + box(45, 72) + ball(80, 57),
  under: ground + box(45, 40) + ball(73, 107),
  above: ground + box(45, 72) + ball(80, 18),
  nextto: ground + box(30, 72) + ball(112, 107),
  between: ground + box(8, 72, .8) + box(100, 72, .8) + ball(80, 107),
  behind: ground + ball(80, 60, 14) + boxDash(45, 72) + arrow('M22,112 Q12,30 62,50', true),   // шарик за коробкой — выглядывает над ней, стрелка «заходит» за коробку
  front: ground + box(45, 64) + ball(68, 108, 13),
  near: ground + box(12, 72) + ball(140, 107),
  opposite: roadH(52, 32) + topBox(60, 10) + `<rect x="52" y="90" width="56" height="34" rx="6" fill="${SC.ball}" fill-opacity=".1" stroke="${SC.ball}" stroke-width="2" stroke-dasharray="5 4"/>` + ball(80, 107),
  into: ground + ball(18, 50) + box(55, 72, 1, 0) + arrow('M30,54 Q70,40 82,92', true) + box(55, 72, 1, .45),
  outof: ground + box(30, 72, 1, .45) + arrow('M58,92 Q80,40 118,56', true) + ball(132, 60),
  onto: ground + box(55, 72) + ghost(90, 47) + ball(16, 107) + arrow('M24,96 Q40,30 78,44', true),
  off: ground + box(20, 72) + ghost(55, 47) + arrow('M66,42 Q118,30 126,90', true) + ball(134, 107),
  through: ground + arrow('M10,95 L150,95', true) + box(52, 72, 1, .55) + ball(18, 95, 9),
  across: roadV(56) + zebra(56, 48, 48, 32) + ghost(18, 64, 9) + arrow('M28,64 L134,64', true) + ball(144, 64, 9),
  along: roadH(76, 32) + ghost(14, 92, 9) + arrow('M24,92 L134,92', true) + ball(146, 92, 9),
  around: ground + `<ellipse cx="80" cy="88" rx="62" ry="30" fill="none" stroke="${SC.arr}" stroke-width="3" stroke-dasharray="6 5"/>` + box(52, 76, .9) + ball(140, 88, 9) + arrow('M126,62 L134,70'),
  over: ground + box(52, 72) + ghost(14, 108, 9) + arrow('M22,98 Q80,-24 138,98', true) + ball(146, 108, 9),
  past: roadH(70, 32) + topBox(60, 24) + ghost(14, 86, 9) + arrow('M24,86 L136,86', true) + ball(148, 86, 9),
  up: slope + ghost(30, 96, 9) + arrow('M42,86 L108,45', true) + ball(124, 38, 9),
  down: slope + ghost(128, 36, 9) + arrow('M116,48 L44,92', true) + ball(26, 100, 9),
  towards: roadH(96, 26) + box(104, 64, .8) + ball(18, 109, 10) + arrow('M32,109 L66,109'),
  from: ground + box(8, 72) + arrow('M54,100 L124,100') + ball(138, 100),
  to: ground + ball(14, 100) + arrow('M26,100 L90,100') + box(96, 72),
  at: `<circle cx="80" cy="66" r="44" fill="none" stroke="${SC.g}" stroke-width="2"/><circle cx="80" cy="66" r="26" fill="none" stroke="${SC.g}" stroke-width="2"/>` + ball(80, 66),
  among: gball(26, 104) + gball(134, 104) + gball(44, 62) + gball(116, 62) + gball(80, 30) + gball(58, 106) + gball(102, 106) + ball(80, 80, 11),
  outside: `<rect x="18" y="20" width="84" height="84" rx="4" fill="#eef0f1" stroke="#9aa3a9" stroke-width="3"/>` + ball(132, 62),
  below: `<rect x="0" y="62" width="160" height="66" fill="${SC.water}"/><line x1="0" y1="62" x2="160" y2="62" stroke="${SC.arr}" stroke-width="2"/>` + box(56, 50, .6) + ball(80, 100),
  inside: `<rect x="30" y="20" width="100" height="88" rx="4" fill="#eef0f1" stroke="#9aa3a9" stroke-width="3"/><path d="M70,108 L90,108" stroke="#eef0f1" stroke-width="4"/>` + ball(80, 64),
  ontop: ground + box(52, 90, .6) + box(52, 62, .6) + box(52, 34, .6) + ball(74, 15, 9),
  farfrom: ground + box(8, 72, .8) + `<path d="M70,96 L130,96" stroke="${SC.arr}" stroke-width="2.5" stroke-dasharray="5 4" marker-start="url(#MK)" marker-end="url(#MK)"/>` + ball(146, 107, 9),
  ahead: roadH(78, 32) + arrow('M24,62 L136,62') + bball(52, 94, 11) + ball(112, 94, 11),
  beyond: ground + bball(18, 108, 9) + `<polygon points="52,118 64,62 104,46 92,104" fill="#c9cfd3" fill-opacity=".9" stroke="#9aa3a9" stroke-width="2"/>` + ball(134, 92, 9),
  away: ground + box(8, 72) + ghost(90, 107, 9) + arrow('M102,107 L130,107') + ball(146, 107, 9),
  bybus: ground + `<rect x="24" y="44" width="112" height="58" rx="10" fill="${SC.blue}"/>` + [36, 64, 92].map(x => `<rect x="${x}" y="54" width="22" height="18" rx="3" fill="#fff"/>`).join('') + `<rect x="120" y="54" width="10" height="30" rx="2" fill="#fff"/><circle cx="52" cy="106" r="10" fill="#444"/><circle cx="110" cy="106" r="10" fill="#444"/>` + ball(75, 64, 7),
  despite: ground + `<path d="M30,44 a16,16 0 0 1 22,-22 a20,20 0 0 1 36,-4 a16,16 0 0 1 22,26 Z" fill="#8a96a0"/><path d="M74,46 L64,66 L76,66 L66,88" fill="none" stroke="#f5c400" stroke-width="4" stroke-linejoin="round"/>` + ball(40, 107) + arrow('M56,107 L136,107'),
  versus: arrow('M10,72 L38,72') + bball(62, 72, 17) + ball(98, 72, 17) + arrow('M150,72 L122,72') + `<path d="M80,44 V52 M68,48 L72,54 M92,48 L88,54 M80,100 V92 M68,96 L72,90 M92,96 L88,90" stroke="${SC.arr}" stroke-width="2.5" stroke-linecap="round"/>`,
  with: ground + `<ellipse cx="80" cy="102" rx="42" ry="22" fill="none" stroke="${SC.arr}" stroke-width="2" stroke-dasharray="5 4"/>` + bball(66, 105, 13) + ball(94, 105, 13),
  without: ground + bball(56, 105, 13) + ghost(98, 105, 13) + cross(98, 105, 14),
  about: `<path d="M24,14 H136 a10,10 0 0 1 10,10 V70 a10,10 0 0 1 -10,10 H58 L36,100 L40,80 H24 a10,10 0 0 1 -10,-10 V24 a10,10 0 0 1 10,-10 Z" fill="#fff" stroke="${SC.arr}" stroke-width="2.5"/>` + box(62, 46, .5) + bball(30, 114, 10),
  forwho: ground + box(14, 78, .9) + `<line x1="39" y1="78" x2="39" y2="119" stroke="${SC.ball}" stroke-width="5"/><line x1="14" y1="98" x2="64" y2="98" stroke="${SC.ball}" stroke-width="5"/><path d="M39,66 q-14,-14 -2,-16 q6,0 2,16 q4,-16 10,-16 q12,2 -10,16" fill="none" stroke="${SC.ball}" stroke-width="3"/>` + arrow('M88,100 L118,100') + ball(138, 104, 14),
  like: ball(42, 70, 18) + `<text x="80" y="82" text-anchor="middle" font-size="34" font-weight="700" fill="${SC.arr}" font-family="Roboto Condensed, sans-serif">=</text>` + ball(118, 70, 18),
  except: [22, 52, 82, 138].map(x => bball(x, 70, 12)).join('') + ball(110, 70, 12) + cross(110, 70, 15),
  instead: ghost(56, 92, 14).replace(SC.ball, SC.blue) + cross(56, 92, 13) + ball(124, 92, 14) + arrow('M112,74 Q92,34 66,70'),
  t_at: tline + ball(80, 80, 9) + lbl(80, '7:00'),
  t_on: tline + `<rect x="58" y="68" width="44" height="24" rx="5" fill="${SC.ball}" fill-opacity=".85"/>` + lbl(80, 'Monday'),
  t_in: tline + `<rect x="18" y="68" width="124" height="24" rx="6" fill="${SC.ball}" fill-opacity=".55"/>` + lbl(80, 'July'),
  t_before: tline + mark(105, 'dinner') + ball(60, 80, 9),
  t_after: tline + mark(55, 'lunch') + ball(100, 80, 9),
  t_for: tline + `<path d="M40,56 L120,56" stroke="${SC.arr}" stroke-width="3" marker-end="url(#MK)" marker-start="url(#MK)"/>` + `<rect x="40" y="72" width="80" height="16" rx="4" fill="${SC.ball}" fill-opacity=".55"/>` + lbl(80, 'two years'),
  t_since: tline + ball(40, 80, 8) + arrow('M48,58 L140,58') + lbl(40, '2015') + lbl(136, 'now', SC.arr),
  t_until: tline + `<rect x="18" y="72" width="102" height="16" rx="4" fill="${SC.ball}" fill-opacity=".4"/>` + arrow('M20,58 L112,58') + mark(120, 'six'),
  t_during: tline + `<rect x="30" y="68" width="100" height="24" rx="6" fill="${SC.arr}" fill-opacity=".2"/>` + ball(80, 80, 9) + lbl(80, 'the film'),
  t_around: tline + `<rect x="62" y="70" width="36" height="20" rx="10" fill="${SC.ball}" fill-opacity=".25"/>` + ball(80, 80, 8) + lbl(80, '~ six'),
  t_within: tline + `<path d="M30,52 V60 H130 V52" fill="none" stroke="${SC.arr}" stroke-width="2.5"/>` + mark(30, 'now') + mark(130, 'week') + ball(98, 80, 9),
  t_throughout: tline + [16, 40, 64, 88, 112, 136].map(x => ball(x, 80, 6)).join('') + `<path d="M12,56 L148,56" stroke="${SC.arr}" stroke-width="3" marker-start="url(#MK)" marker-end="url(#MK)"/>` + lbl(80, 'the whole day'),
  t_from: tline + `<rect x="30" y="72" width="100" height="16" rx="4" fill="${SC.ball}" fill-opacity=".55"/>` + mark(30, '9:00') + mark(130, '5:00'),
  t_past: `<circle cx="80" cy="64" r="50" fill="#fff" stroke="#9aa3a9" stroke-width="3"/>` + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(k => { const a = k * Math.PI / 6; return `<line x1="${80 + 44 * Math.sin(a)}" y1="${64 - 44 * Math.cos(a)}" x2="${80 + 50 * Math.sin(a)}" y2="${64 - 50 * Math.cos(a)}" stroke="#9aa3a9" stroke-width="2"/>`; }).join('') + `<path d="M80,64 L80,26 A38,38 0 0 1 113,45 Z" fill="${SC.ball}" fill-opacity=".35"/><line x1="80" y1="64" x2="80" y2="38" stroke="${SC.arr}" stroke-width="5" stroke-linecap="round"/><line x1="80" y1="64" x2="115" y2="44" stroke="${SC.ball}" stroke-width="3.5" stroke-linecap="round"/><circle cx="80" cy="64" r="4" fill="${SC.arr}"/>`,
  t_by: tline + ball(82, 80, 9) + `<path d="M77,80 l4,4 l7,-8" fill="none" stroke="#fff" stroke-width="2.5"/>` + mark(122, 'Friday') + `<path d="M122,58 L140,64 L122,70 Z" fill="${SC.arr}"/>`,
};
let scN = 0;   // у каждой схемы свой id наконечника стрелки — их бывает несколько на экране
const scheme = (i, w, h) => {
  const id = 'mk' + (++scN);
  return `<svg class="scheme" viewBox="0 0 160 128" width="${w}" height="${h}" aria-hidden="true"><defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${SC.arr}"/></marker></defs>${SCHEMES[W[i][11]].replace(/MK/g, id)}</svg>`;
};
const isTime = i => W[i][11].startsWith('t_');
// фраза с пропуском: «The cat is ___ the bed.»
const gap = s => esc(s).replace(/\[(.+?)\]/, '<span class="gap">&nbsp;</span>').replace(/[\[\]]/g, '');
// неверные варианты: другие предлоги того же рода (время — к времени), сначала из этого урока и соседних;
// у одинаковых предлогов (in — место и время) вариант не повторяется; to/towards и under/below — не вместе
const PREP_APART = [['to', 'towards'], ['under', 'below'], ['near', 'next to'], ['from', 'away from'], ['in', 'inside'], ['near', 'far from']];
function prepOptions(i) {
  const ok = en(i), out = [ok];
  const apart = v => PREP_APART.some(g => g.includes(v) && g.includes(ok));
  const pool = range(0, W.length).filter(j => isTime(j) === isTime(i)).sort((a, b) => Math.abs(lessonOf(a) - lessonOf(i)) - Math.abs(lessonOf(b) - lessonOf(i)) || Math.random() - .5);
  for (const j of pool) { const v = en(j); if (out.length < 4 && !out.includes(v) && !apart(v)) out.push(v); }
  return shuffle(out);
}
function prepStudy(app) {
  const i = curI();
  setStudy(app, {
    cls: 'prep',
    top: `<div class="sch">${scheme(i, 180, 144)}</div><div class="pword"><b>${esc(en(i))}</b><span class="ipa gray">[${esc(W[i][2])}]</span>
      <button class="spk" id="say" aria-label="Произнести">${I.spk}</button></div>`,
    onTop: e => { if (e.target.closest('#say')) { sayWord(i); return true; } },
  });
  const b = $('.pword b'), box = $('.pword');   // «in front of» — мельче, в одну строку
  let fs = 44; while (box.scrollWidth > box.clientWidth + 1 && fs > 22) b.style.fontSize = --fs + 'px';
}
function prepMemo(app) {
  const i = curI();
  setMemo(app, {
    top: `<div class="ask pask">Какой предлог на схеме?</div><div class="sch msch">${scheme(i, 190, 152)}</div>`,
    // озвучить нечего: звук предлога или фразы выдал бы ответ — он прозвучит после выбора
    opts: prepOptions(i), ok: en(i), silent: true, say: () => toast('Предлог прозвучит после ответа'),
  });
}


// ---------- фразовые глаголы: 100 самых частых ----------
// уроки по частице (up, out, off, on, down, back/away, in/over…), 1–2 главных значения, два примера
const PV_SRC = `
get up|вставать (с постели)|I [get up] at seven every day.|Я [встаю] в семь каждый день.|She [got up] early to catch the train.|Она [встала] рано, чтобы успеть на поезд.
give up|бросать; сдаваться|He [gave up] smoking last year.|В прошлом году он [бросил] курить.|Don't [give up]!|Не [сдавайся]!
pick up|поднимать; забирать|Can you [pick up] the kids from school?|Можешь [забрать] детей из школы?|She [picked up] the phone.|Она [подняла] трубку.
look up|искать (в словаре, сети)|[Look up] this word in the dictionary.|[Посмотри] это слово в словаре.|I [looked up] the address online.|Я [нашёл] адрес в интернете.
make up|выдумывать; мириться|He [made up] an excuse.|Он [придумал] отговорку.|They argued but [made up] the next day.|Они поссорились, но на следующий день [помирились].
wake up|просыпаться; будить|I [woke up] at six.|Я [проснулся] в шесть.|Please [wake up], it's late!|[Просыпайся], уже поздно!
set up|основывать; настраивать|She [set up] her own company.|Она [основала] свою компанию.|Can you help me [set up] the printer?|Поможешь [настроить] принтер?
grow up|вырастать, взрослеть|I [grew up] in a small town.|Я [вырос] в маленьком городе.|What do you want to be when you [grow up]?|Кем ты хочешь стать, когда [вырастешь]?
turn up|появляться; делать громче|He [turned up] late as usual.|Он, как обычно, [явился] поздно.|Can you [turn up] the music?|Можешь [сделать погромче] музыку?
end up|в итоге оказаться|We [ended up] in a small café.|[В итоге] мы [оказались] в маленьком кафе.|If you don't study, you'll [end up] failing.|Если не будешь учиться, [в итоге] провалишься.
come up with|придумывать|She [came up with] a great idea.|Она [придумала] отличную идею.|We need to [come up with] a plan.|Нам нужно [придумать] план.
take up|начинать заниматься (хобби)|I [took up] yoga last year.|В прошлом году я [начал заниматься] йогой.|He [took up] the guitar at forty.|Он [взялся] за гитару в сорок лет.
put up with|терпеть, мириться|I can't [put up with] this noise.|Я не могу [терпеть] этот шум.|She [puts up with] his bad jokes.|Она [мирится] с его плохими шутками.
break up|расставаться|They [broke up] last month.|Они [расстались] в прошлом месяце.|Why did you [break up] with him?|Почему ты [рассталась] с ним?
show up|приходить, появляться|Only five people [showed up].|[Пришли] всего пять человек.|He didn't [show up] for work.|Он не [явился] на работу.
bring up|воспитывать; заводить разговор|She [brought up] three children alone.|Она одна [вырастила] троих детей.|Don't [bring up] politics at dinner.|Не [заводи] разговор о политике за ужином.
catch up|догонять; наверстать|Go ahead, I'll [catch up] with you.|Иди, я тебя [догоню].|I need to [catch up] on my work.|Мне нужно [наверстать] работу.
hurry up|торопиться|[Hurry up], we're late!|[Поторопись], мы опаздываем!|Tell him to [hurry up].|Скажи ему, чтобы [поторопился].
cheer up|подбодрить; не унывать|[Cheer up]! It's not so bad.|[Не унывай]! Всё не так плохо.|A good film will [cheer up] anyone.|Хороший фильм [поднимет настроение] кому угодно.
speak up|говорить громче; высказываться|Could you [speak up], please?|Не могли бы вы [говорить погромче]?|Don't be afraid to [speak up].|Не бойся [высказываться].
find out|узнавать, выяснять|I [found out] the truth.|Я [узнал] правду.|Let's [find out] what happened.|Давай [выясним], что случилось.
go out|выходить куда-то; гаснуть|Let's [go out] tonight.|Давай [сходим куда-нибудь] вечером.|The lights [went out].|Свет [погас].
work out|тренироваться; найти решение|I [work out] three times a week.|Я [тренируюсь] три раза в неделю.|We'll [work out] a solution.|Мы [найдём] решение.
figure out|понять, разобраться|I can't [figure out] this map.|Не могу [разобраться] в этой карте.|She [figured out] the answer.|Она [догадалась], какой ответ.
carry out|выполнять, проводить|They [carried out] an experiment.|Они [провели] эксперимент.|The plan was [carried out] perfectly.|План был [выполнен] идеально.
point out|указывать, отмечать|She [pointed out] my mistake.|Она [указала] на мою ошибку.|He [pointed out] that it was late.|Он [заметил], что уже поздно.
run out of|закончиться (о запасах)|We've [run out of] milk.|У нас [закончилось] молоко.|I'm [running out of] time.|У меня [заканчивается] время.
turn out|оказаться|The film [turned out] to be boring.|Фильм [оказался] скучным.|It [turned out] that he was right.|[Оказалось], что он был прав.
check out|выписаться; заценить|We [checked out] of the hotel at noon.|Мы [выехали] из отеля в полдень.|[Check out] this new song!|[Зацени] эту новую песню!
hang out|проводить время, тусоваться|We [hang out] at the park after school.|После школы мы [тусуемся] в парке.|Do you want to [hang out] this weekend?|Хочешь [встретиться] на выходных?
take off|взлетать; снимать (одежду)|The plane [took off] on time.|Самолёт [взлетел] вовремя.|[Take off] your shoes, please.|[Сними] обувь, пожалуйста.
turn off|выключать|[Turn off] the light, please.|[Выключи] свет, пожалуйста.|Did you [turn off] the oven?|Ты [выключил] духовку?
put off|откладывать|Don't [put off] until tomorrow what you can do today.|Не [откладывай] на завтра то, что можно сделать сегодня.|The meeting was [put off] till Friday.|Собрание [перенесли] на пятницу.
set off|отправляться (в путь)|We [set off] early in the morning.|Мы [отправились] рано утром.|When do you [set off]?|Когда вы [выезжаете]?
get off|выходить (из транспорта)|[Get off] the bus at the next stop.|[Выйди] из автобуса на следующей остановке.|We [got off] the train in Paris.|Мы [сошли] с поезда в Париже.
show off|хвастаться|He likes to [show off] his new car.|Он любит [хвастаться] новой машиной.|Stop [showing off]!|Хватит [выпендриваться]!
call off|отменять|They [called off] the match because of rain.|Матч [отменили] из-за дождя.|The wedding was [called off].|Свадьбу [отменили].
pay off|окупаться; выплатить|Hard work always [pays off].|Упорный труд всегда [окупается].|I've finally [paid off] my loan.|Я наконец [выплатил] кредит.
go off|звенеть (о будильнике); взрываться|My alarm [went off] at six.|Мой будильник [зазвонил] в шесть.|The bomb didn't [go off].|Бомба не [взорвалась].
drop off|завозить, подвозить|Can you [drop off] the kids at school?|Можешь [завезти] детей в школу?|She [dropped off] the parcel at the post office.|Она [занесла] посылку на почту.
turn on|включать|[Turn on] the TV.|[Включи] телевизор.|He [turned on] the light.|Он [включил] свет.
put on|надевать|[Put on] your coat, it's cold.|[Надень] пальто, холодно.|She [put on] her glasses.|Она [надела] очки.
go on|продолжать; происходить|[Go on], I'm listening.|[Продолжай], я слушаю.|What's [going on] here?|Что здесь [происходит]?
carry on|продолжать|[Carry on] with your work.|[Продолжайте] работать.|They [carried on] talking.|Они [продолжили] разговаривать.
get on with|ладить с; продолжать|I [get on with] my neighbours.|Я [лажу] с соседями.|Let's [get on with] the lesson.|Давайте [продолжим] урок.
hold on|подождать (минутку)|[Hold on], I'll get a pen.|[Подожди], я возьму ручку.|[Hold on] a second, please.|[Подождите] секунду, пожалуйста.
come on|давай!, ну же!|[Come on], we'll be late!|[Давай], мы опоздаем!|[Come on], you can do it!|[Ну же], у тебя получится!
take on|брать на себя; нанимать|She [took on] too much work.|Она [взяла на себя] слишком много работы.|The company is [taking on] new staff.|Компания [набирает] новых сотрудников.
try on|примерять|Can I [try on] this jacket?|Можно [примерить] эту куртку?|She [tried on] five dresses.|Она [примерила] пять платьев.
keep on|продолжать (упорно)|He [kept on] talking.|Он всё [продолжал] говорить.|[Keep on] trying!|[Продолжай] пытаться!
sit down|садиться|Please [sit down].|[Садитесь], пожалуйста.|She [sat down] next to me.|Она [села] рядом со мной.
slow down|замедляться|[Slow down], you're driving too fast!|[Сбавь скорость], ты едешь слишком быстро!|The economy is [slowing down].|Экономика [замедляется].
turn down|отказывать; делать тише|She [turned down] the job offer.|Она [отказалась] от предложения о работе.|Please [turn down] the music.|[Сделай потише] музыку, пожалуйста.
break down|ломаться (о технике)|Our car [broke down] on the way.|Наша машина [сломалась] по дороге.|The talks [broke down].|Переговоры [сорвались].
calm down|успокаиваться|[Calm down], everything is fine.|[Успокойся], всё в порядке.|It took him an hour to [calm down].|Ему понадобился час, чтобы [успокоиться].
let down|подводить|I felt [let down] by my friends.|Друзья меня [подвели].|Please don't [let down] the people who trust you.|Пожалуйста, не [подводи] тех, кто тебе доверяет.
write down|записывать|[Write down] my phone number.|[Запиши] мой номер телефона.|I [wrote down] everything he said.|Я [записал] всё, что он сказал.
cut down on|сокращать (потребление)|I'm trying to [cut down on] sugar.|Я стараюсь [есть меньше] сахара.|You should [cut down on] coffee.|Тебе стоит [пить меньше] кофе.
settle down|остепениться; обустроиться|They got married and [settled down].|Они поженились и [остепенились].|It took us a month to [settle down] in the new city.|Нам понадобился месяц, чтобы [обустроиться] в новом городе.
look down on|смотреть свысока|He [looks down on] people without money.|Он [смотрит свысока] на людей без денег.|Don't [look down on] others.|Не [смотри свысока] на других.
come back|возвращаться|When will you [come back]?|Когда ты [вернёшься]?|He [came back] from London.|Он [вернулся] из Лондона.
give back|возвращать (вещь)|Please [give back] the book you borrowed.|Пожалуйста, [верни] книгу, которую брал.|I'll [give back] the money tomorrow.|Я [верну] деньги завтра.
call back|перезванивать|Can you [call back] in an hour?|Можете [перезвонить] через час?|She never [called back].|Она так и не [перезвонила].
get back|вернуться; получить обратно|We [got back] home at midnight.|Мы [вернулись] домой в полночь.|Did you [get back] your money?|Тебе [вернули] деньги?
look back|оглядываться (на прошлое)|[Looking back], I was happy then.|[Оглядываясь назад], понимаю: я был тогда счастлив.|Don't [look back]!|Не [оглядывайся]!
go away|уходить, уезжать|[Go away]! I'm busy.|[Уходи]! Я занят.|We're [going away] for the weekend.|Мы [уезжаем] на выходные.
give away|отдавать (даром), раздавать|She [gave away] her old clothes.|Она [отдала] свою старую одежду.|They're [giving away] free tickets.|Они [раздают] бесплатные билеты.
put away|убирать (на место)|[Put away] your toys.|[Убери] свои игрушки.|She [put away] the dishes.|Она [убрала] посуду.
throw away|выбрасывать|Don't [throw away] the receipt.|Не [выбрасывай] чек.|I [threw away] my old shoes.|Я [выбросил] старые туфли.
run away|убегать|The dog [ran away].|Собака [убежала].|Don't [run away] from your problems.|Не [убегай] от проблем.
come in|входить|[Come in], please!|[Входите], пожалуйста!|She [came in] without knocking.|Она [вошла] без стука.
get in|садиться (в машину); проникать|[Get in], I'll drive you home.|[Садись], я отвезу тебя домой.|How did the thief [get in]?|Как вор [проник] внутрь?
fill in|заполнять (анкету)|Please [fill in] this form.|Пожалуйста, [заполните] эту анкету.|I [filled in] the application.|Я [заполнил] заявление.
check in|регистрироваться, заселяться|We [checked in] at the hotel at three.|Мы [заселились] в отель в три часа.|You must [check in] two hours before the flight.|Нужно [зарегистрироваться] за два часа до вылета.
give in|уступать, поддаваться|He finally [gave in] and said yes.|В конце концов он [уступил] и согласился.|Never [give in] to fear.|Никогда не [поддавайся] страху.
break into|вламываться|Someone [broke into] our house.|Кто-то [вломился] в наш дом.|Thieves [broke into] the car.|Воры [взломали] машину.
run into|случайно встретить; столкнуться|I [ran into] an old friend yesterday.|Вчера я [случайно встретил] старого друга.|We [ran into] some problems.|Мы [столкнулись] с проблемами.
look into|изучать, разбираться|The police are [looking into] the case.|Полиция [расследует] это дело.|I'll [look into] it.|Я [разберусь] с этим.
get over|оправиться, пережить|It took her months to [get over] the illness.|Ей понадобились месяцы, чтобы [оправиться] от болезни.|You'll [get over] it.|Ты это [переживёшь].
think over|обдумывать|Let me [think over] your offer.|Дай мне [обдумать] твоё предложение.|I need time to [think over] the plan.|Мне нужно время, чтобы [обдумать] план.
look after|присматривать, заботиться|Can you [look after] my cat?|Можешь [присмотреть] за моей кошкой?|She [looks after] her old parents.|Она [заботится] о пожилых родителях.
look for|искать|I'm [looking for] my keys.|Я [ищу] ключи.|What are you [looking for]?|Что ты [ищешь]?
look forward to|ждать с нетерпением|I'm [looking forward to] the holidays.|Я [с нетерпением жду] каникул.|We [look forward to] seeing you.|Мы [с нетерпением ждём] встречи с вами.
come across|случайно найти, наткнуться|I [came across] an old photo.|Я [случайно нашёл] старое фото.|Have you ever [come across] this word?|Тебе [попадалось] это слово?
go through|пережить; просмотреть|She [went through] a hard time.|Она [пережила] трудные времена.|Let's [go through] the plan again.|Давай ещё раз [пройдёмся] по плану.
get through|дозвониться; справиться|I couldn't [get through] to him.|Я не смог до него [дозвониться].|We'll [get through] this together.|Мы [справимся] с этим вместе.
turn around|поворачиваться|[Turn around] and look at me.|[Повернись] и посмотри на меня.|He [turned around] and left.|Он [развернулся] и ушёл.
take after|быть похожим (на родителя)|She [takes after] her mother.|Она [похожа] на маму.|Who do you [take after]?|На кого ты [похож]?
stand for|означать; терпеть|What does "UN" [stand for]?|Что [означает] «ООН»?|I won't [stand for] this!|Я этого не [потерплю]!
deal with|иметь дело; разобраться|I'll [deal with] the problem.|Я [разберусь] с проблемой.|She [deals with] customers all day.|Она весь день [имеет дело] с клиентами.
get along|ладить|Do you [get along] with your sister?|Ты [ладишь] с сестрой?|We [get along] well.|Мы хорошо [ладим].
fall apart|разваливаться|My old shoes are [falling apart].|Мои старые туфли [разваливаются].|The plan [fell apart].|План [развалился].
hand in|сдавать (работу)|[Hand in] your homework on Monday.|[Сдайте] домашнее задание в понедельник.|He [handed in] his notice.|Он [подал] заявление об уходе.
pass away|скончаться|His grandfather [passed away] last year.|Его дедушка [скончался] в прошлом году.|She [passed away] peacefully.|Она [ушла из жизни] спокойно.
keep up with|не отставать, успевать|I can't [keep up with] you!|Я не [успеваю] за тобой!|It's hard to [keep up with] the news.|Трудно [следить] за новостями.
count on|рассчитывать на|You can [count on] me.|Ты можешь [рассчитывать] на меня.|Don't [count on] good weather.|Не [рассчитывай] на хорошую погоду.
look out|осторожно!, берегись|[Look out]! A car!|[Осторожно]! Машина!|[Look out] for pickpockets.|[Остерегайтесь] карманников.
take over|подменить; взять под контроль|Can you [take over] while I'm away?|Можешь [подменить] меня, пока меня нет?|A big company [took over] the shop.|Крупная компания [купила] этот магазин.
get by|сводить концы с концами; обходиться|We [get by] on one salary.|Мы [живём] на одну зарплату.|I [get by] with my English.|Мне [хватает] моего английского.
mess up|испортить, напортачить|I [messed up] the exam.|Я [завалил] экзамен.|Don't [mess up] my hair!|Не [порть] мне причёску!`;

const PV = PV_SRC.trim().split('\n').map(s => {
  const [p, r, e1, r1, e2, r2] = s.split('|');
  return [p, r, '', e1, r1, 0, 'pv', [], null, e2, r2];
});
const pvVerb = i => en(i).split(' ')[0], pvPart = i => en(i).split(' ').slice(1).join(' ');
const pvRu = i => ru(i).split(';')[0];   // в парах — первое значение, чтобы помещалось
// «Запоминание»: варианты перевода — сначала у глаголов с той же частицей или тем же глаголом (их и путают)
function pvOptions(i) {
  const out = [ru(i)];
  const near = shuffle(range(0, W.length).filter(j => j !== i && (pvPart(j) === pvPart(i) || pvVerb(j) === pvVerb(i))));
  for (const j of near.concat(shuffle(range(0, W.length)))) if (out.length < 4 && !out.includes(ru(j))) out.push(ru(j));
  return shuffle(out);
}
// «Написание»: в примере видна только форма глагола, частицу нужно собрать: «She came ___ a great idea.»
function pvCloze(i) {
  const m = /\[(.+?)\]/.exec(W[i][3]), shown = m[1].split(' ')[0];
  return esc(W[i][3].slice(0, m.index) + shown + ' ').replace(/[\[\]]/g, '') + '<span class="gap">&nbsp;</span>' + esc(W[i][3].slice(m.index + m[0].length)).replace(/[\[\]]/g, '');
}
const pvBig = i => `${esc(pvVerb(i))} <em>${esc(pvPart(i))}</em>`;
function pvStudy(app) {
  const i = curI();
  setStudy(app, {
    cls: 'pv',
    top: `<div class="pword pvword"><b>${pvBig(i)}</b><button class="spk" id="say" aria-label="Произнести">${I.spk}</button></div>`,
    onTop: e => { if (e.target.closest('#say')) { sayWord(i); return true; } },
  });
  const b = $('.pword b'), box = $('.pword');
  let fs = 48; b.style.fontSize = fs + 'px'; while (box.scrollWidth > box.clientWidth + 1 && fs > 24) b.style.fontSize = --fs + 'px';
}
function pvMemo(app) {
  const i = curI();
  setMemo(app, { top: `<div class="bigword pvbig">${pvBig(i)}</div>`, opts: pvOptions(i), ok: ru(i), say: () => sayWord(i) });
}


// ---------- идиомы: 100 популярных ----------
// уроки по темам; у каждой — значение, дословный перевод, русский аналог, пример; [слово] — ключевое, его вписывают в заданиях
const ID_SRC = `
once in a blue [moon]|очень редко|однажды при голубой луне|раз в сто лет|I only see him [once in a blue moon].|Я вижу его [раз в сто лет].
in the [nick] of time|как раз вовремя|в зарубку времени|в последнюю минуту|We arrived [in the nick of time].|Мы приехали [в последнюю минуту].
better late than [never]|лучше поздно, чем никогда|лучше поздно, чем никогда|лучше поздно, чем никогда|You finally called! Well, [better late than never].|Наконец-то позвонил! Что ж, [лучше поздно, чем никогда].
call it a [day]|закончить на сегодня|назвать это днём|на сегодня хватит|I'm tired, let's [call it a day].|Я устал, [на сегодня хватит].
the time of your [life]|лучшее время в жизни|время твоей жизни|незабываемое время|We had [the time of our lives] in Italy.|В Италии мы [провели незабываемое время].
around the [corner]|скоро, не за горами|за углом|на носу|Summer is just [around the corner].|Лето уже [на носу].
time [flies]|время летит|время летит|время летит незаметно|[Time flies] when you're having fun.|Когда весело, [время летит незаметно].
at the drop of a [hat]|сразу, не раздумывая|при падении шляпы|в два счёта|He'd help you [at the drop of a hat].|Он поможет тебе [не раздумывая].
on the [spot]|сразу, на месте|на месте|не сходя с места|They hired him [on the spot].|Его взяли на работу [не сходя с места].
from [scratch]|с нуля|от черты|с нуля|I built the website [from scratch].|Я сделал сайт [с нуля].
cost an arm and a [leg]|стоить целое состояние|стоить руку и ногу|стоить бешеных денег|This car [cost an arm and a leg].|Эта машина [стоила бешеных денег].
break the [bank]|стоить слишком дорого|сломать банк|влететь в копеечку|A cup of coffee won't [break the bank].|Чашка кофе [не разорит].
make ends [meet]|сводить концы с концами|соединить концы|сводить концы с концами|It's hard to [make ends meet] on one salary.|На одну зарплату трудно [сводить концы с концами].
money doesn't grow on [trees]|деньги не растут на деревьях|деньги не растут на деревьях|деньги с неба не падают|Turn off the lights — [money doesn't grow on trees]!|Выключай свет — [деньги с неба не падают]!
on a [shoestring]|почти без денег|на шнурке|на копейки|They travelled [on a shoestring].|Они путешествовали [на копейки].
pay through the [nose]|сильно переплатить|платить через нос|заплатить втридорога|We [paid through the nose] for the tickets.|Мы [заплатили втридорога] за билеты.
save for a rainy [day]|копить на чёрный день|копить на дождливый день|на чёрный день|I [save] a little money [for a rainy day].|Я откладываю немного денег [на чёрный день].
tighten your [belt]|экономить|затянуть ремень|затянуть пояс|We have to [tighten our belts] this year.|В этом году нам придётся [затянуть пояса].
bring home the [bacon]|зарабатывать на жизнь|приносить домой бекон|кормить семью|She's the one who [brings home the bacon].|Именно она [кормит семью].
in the [red]|в долгах, в минусе|в красном|в минусе|The company is [in the red].|Компания [в минусе].
get the [ball] rolling|начать дело|запустить мяч|сдвинуть с мёртвой точки|Let's [get the ball rolling].|Давайте [начнём].
back to the drawing [board]|начать всё сначала|назад к чертёжной доске|начать с чистого листа|The plan failed, so it's [back to the drawing board].|План провалился — [начинаем с чистого листа].
cut [corners]|халтурить, экономить на качестве|срезать углы|работать спустя рукава|Don't [cut corners] on safety.|Не [экономь] на безопасности.
burn the midnight [oil]|работать допоздна|жечь полуночное масло|сидеть до ночи|I [burned the midnight oil] before the exam.|Перед экзаменом я [сидел до ночи].
hit the [books]|засесть за учёбу|ударить книги|грызть гранит науки|I have to [hit the books] tonight.|Сегодня мне нужно [засесть за учёбу].
learn the [ropes]|освоиться, изучить азы|выучить верёвки|войти в курс дела|It took me a month to [learn the ropes].|Мне понадобился месяц, чтобы [войти в курс дела].
think outside the [box]|мыслить нестандартно|думать вне коробки|мыслить нестандартно|We need to [think outside the box].|Нам нужно [мыслить нестандартно].
on the same [page]|понимать друг друга|на одной странице|на одной волне|Are we all [on the same page]?|Мы все [на одной волне]?
pull your [weight]|делать свою часть работы|тянуть свой вес|тянуть свою лямку|Everyone must [pull their weight].|Каждый должен [тянуть свою лямку].
the ball is in your [court]|теперь решать тебе|мяч на твоей стороне|теперь ход за тобой|I've made my offer — [the ball is in your court].|Я сделал предложение — [теперь ход за тобой].
over the [moon]|очень счастлив|над луной|на седьмом небе|She was [over the moon] about the news.|Она была [на седьмом небе] от этой новости.
on cloud [nine]|безмерно счастлив|на облаке номер девять|на седьмом небе от счастья|He's been [on cloud nine] since the wedding.|Со свадьбы он [на седьмом небе от счастья].
under the [weather]|неважно себя чувствовать|под погодой|расклеиться|I'm feeling [under the weather] today.|Сегодня я [неважно себя чувствую].
butterflies in my [stomach]|волнение, мандраж|бабочки в животе|поджилки трясутся|I had [butterflies in my stomach] before the interview.|Перед собеседованием у меня [тряслись поджилки].
get cold [feet]|струсить в последний момент|получить холодные ноги|пойти на попятную|He [got cold feet] and cancelled the wedding.|Он [струсил] и отменил свадьбу.
keep your [chin] up|не унывать|держи подбородок выше|выше нос!|[Keep your chin up]! Things will get better.|[Выше нос]! Всё наладится.
lose your [temper]|выйти из себя|потерять самообладание|выйти из себя|He [lost his temper] and started shouting.|Он [вышел из себя] и начал кричать.
blow off [steam]|выпустить пар|выдуть пар|выпустить пар|I go running to [blow off steam].|Я бегаю, чтобы [выпустить пар].
down in the [dumps]|в унынии|внизу в свалках|повесить нос|Why are you [down in the dumps]?|Почему ты [повесил нос]?
scared [stiff]|напуган до смерти|напуган до окоченения|душа в пятки ушла|I was [scared stiff] when the lights went out.|Когда погас свет, [душа у меня ушла в пятки].
a piece of [cake]|проще простого|кусок торта|проще пареной репы|The test was [a piece of cake].|Тест был [проще пареной репы].
easier said than [done]|легче сказать, чем сделать|легче сказано, чем сделано|легко сказать|Quit smoking? [Easier said than done].|Бросить курить? [Легко сказать].
hit the [nail] on the head|попасть в точку|ударить гвоздь по шляпке|попасть в точку|You've [hit the nail on the head].|Ты [попал в точку].
break a [leg]|удачи!|сломай ногу|ни пуха ни пера|[Break a leg] tonight!|[Ни пуха ни пера] сегодня!
the last [straw]|последняя капля|последняя соломинка|последняя капля|His lie was [the last straw].|Его ложь стала [последней каплей].
a blessing in [disguise]|нет худа без добра|благословение в маскировке|не было бы счастья, да несчастье помогло|Losing that job was [a blessing in disguise].|Потеря той работы — [нет худа без добра].
in hot [water]|в неприятностях|в горячей воде|влипнуть|He's [in hot water] with his boss.|У него [неприятности] с начальником.
bite off more than you can [chew]|взяться за непосильное|откусить больше, чем можешь прожевать|замахнуться не по силам|I [bit off more than I could chew].|Я [взялся за непосильное].
beat around the [bush]|ходить вокруг да около|бить вокруг куста|ходить вокруг да около|Stop [beating around the bush]!|Хватит [ходить вокруг да около]!
the best of both [worlds]|все преимущества сразу|лучшее из обоих миров|и волки сыты, и овцы целы|Working from home gives me [the best of both worlds].|Работа из дома даёт мне [все преимущества сразу].
break the [ice]|разрядить обстановку|сломать лёд|растопить лёд|He told a joke to [break the ice].|Он пошутил, чтобы [растопить лёд].
spill the [beans]|выдать секрет|рассыпать бобы|проболтаться|Who [spilled the beans]?|Кто [проболтался]?
let the cat out of the [bag]|случайно выдать секрет|выпустить кошку из мешка|проговориться|She [let the cat out of the bag] about the party.|Она [проговорилась] о вечеринке.
see eye to [eye]|сходиться во мнениях|видеть глаз в глаз|смотреть в одну сторону|We don't always [see eye to eye].|Мы не всегда [сходимся во мнениях].
in the same [boat]|в одинаковом положении|в одной лодке|в одной лодке|Don't worry, we're all [in the same boat].|Не переживай, мы все [в одной лодке].
get on my [nerves]|раздражать|попадать на нервы|действовать на нервы|This noise [gets on my nerves].|Этот шум [действует мне на нервы].
give the cold [shoulder]|холодно встретить, игнорировать|дать холодное плечо|встретить холодно|She [gave me the cold shoulder].|Она [встретила меня холодно].
a [pain] in the neck|сплошная морока, зануда|боль в шее|как кость в горле|My neighbour is [a pain in the neck].|Мой сосед — [сплошная морока].
talk behind your [back]|сплетничать за спиной|говорить за спиной|говорить за глаза|Don't [talk behind her back].|Не [говори] о ней [за глаза].
pull your [leg]|разыгрывать, подшучивать|тянуть за ногу|морочить голову|Relax, I'm just [pulling your leg].|Расслабься, я тебя просто [разыгрываю].
the apple of my [eye]|самый любимый человек|яблоко моего глаза|свет в окошке|His daughter is [the apple of his eye].|Дочь для него — [свет в окошке].
a couch [potato]|лежебока|диванная картошка|лежебока|Don't be [a couch potato], go outside!|Не будь [лежебокой], иди погуляй!
sell like hot [cakes]|раскупаться мгновенно|продаваться как горячие пирожки|разлетаться как горячие пирожки|The new phones are [selling like hot cakes].|Новые телефоны [разлетаются как горячие пирожки].
not my cup of [tea]|не по душе|не моя чашка чая|не моё|Football is [not my cup of tea].|Футбол — [не моё].
in a [nutshell]|в двух словах|в ореховой скорлупе|короче говоря|[In a nutshell], we need more time.|[Короче говоря], нам нужно больше времени.
with a pinch of [salt]|скептически|со щепоткой соли|делить на десять|Take his stories [with a pinch of salt].|Его рассказы [дели на десять].
cry over spilt [milk]|жалеть о непоправимом|плакать над пролитым молоком|после драки кулаками не машут|It's no use [crying over spilt milk].|[После драки кулаками не машут].
the icing on the [cake]|приятное дополнение|глазурь на торте|вишенка на торте|The sunny weather was [the icing on the cake].|Солнечная погода стала [вишенкой на торте].
bread and [butter]|основной заработок|хлеб и масло|хлеб насущный|Teaching is my [bread and butter].|Преподавание — мой [хлеб насущный].
go [bananas]|сойти с ума, взбеситься|стать бананами|с ума сойти|The fans [went bananas] when he scored.|Болельщики [сошли с ума], когда он забил.
rain cats and [dogs]|лить как из ведра|дождь кошками и собаками|льёт как из ведра|It's [raining cats and dogs].|[Льёт как из ведра].
kill two birds with one [stone]|сделать два дела сразу|убить двух птиц одним камнем|убить двух зайцев|I'll [kill two birds with one stone].|Я [убью двух зайцев].
the elephant in the [room]|проблема, о которой молчат|слон в комнате|слона-то я и не приметил|Nobody talked about [the elephant in the room].|Никто не говорил о [главной проблеме].
when pigs [fly]|никогда|когда свиньи полетят|когда рак на горе свистнет|He'll clean his room [when pigs fly].|Он уберёт в комнате, [когда рак на горе свистнет].
hold your [horses]|не спеши, погоди|придержи лошадей|не гони лошадей|[Hold your horses]! Let me finish.|[Не гони лошадей]! Дай договорить.
a little bird [told] me|я слышал от кого-то|маленькая птичка сказала мне|сорока на хвосте принесла|[A little bird told me] you're getting married.|[Сорока на хвосте принесла], что ты женишься.
smell a [rat]|чуять подвох|чуять крысу|чуять неладное|I [smell a rat].|Я [чую подвох].
let sleeping dogs [lie]|не ворошить прошлое|дай спящим собакам лежать|не буди лихо, пока оно тихо|Don't ask him about it — [let sleeping dogs lie].|Не спрашивай его об этом — [не буди лихо].
like a fish out of [water]|не в своей тарелке|как рыба без воды|не в своей тарелке|I felt [like a fish out of water] at the party.|На вечеринке я чувствовал себя [не в своей тарелке].
the lion's [share]|львиная доля|доля льва|львиная доля|He gets [the lion's share] of the profit.|Ему достаётся [львиная доля] прибыли.
keep an [eye] on|присматривать|держать глаз на|не спускать глаз|Can you [keep an eye on] my bag?|Можешь [присмотреть] за моей сумкой?
by [heart]|наизусть|сердцем|наизусть|I know this poem [by heart].|Я знаю это стихотворение [наизусть].
on the tip of my [tongue]|вертится на языке|на кончике языка|вертится на языке|His name is [on the tip of my tongue].|Его имя [вертится у меня на языке].
give me a [hand]|помочь|дать мне руку|протянуть руку помощи|Can you [give me a hand]?|Можешь [мне помочь]?
face the [music]|отвечать за последствия|встретить музыку лицом|держать ответ|Sooner or later you'll have to [face the music].|Рано или поздно придётся [держать ответ].
head over [heels]|по уши (влюбиться)|голова через пятки|по уши|He fell [head over heels] in love.|Он влюбился [по уши].
all [ears]|весь внимание|все уши|весь внимание|Go on, I'm [all ears].|Продолжай, я [весь внимание].
turn a blind [eye]|закрывать глаза (на что-то)|повернуть слепой глаз|смотреть сквозь пальцы|The teacher [turned a blind eye] to it.|Учитель [закрыл на это глаза].
my lips are [sealed]|никому не скажу|мои губы запечатаны|я — могила|Don't worry, [my lips are sealed].|Не волнуйся, [я — могила].
get it off my [chest]|выговориться|снять это с груди|облегчить душу|I need to [get this off my chest].|Мне нужно [облегчить душу].
up in the [air]|не решено, под вопросом|в воздухе|вилами по воде писано|Our plans are still [up in the air].|Наши планы пока [под вопросом].
once bitten, twice [shy]|после неудачи становятся осторожнее|однажды укушенный, дважды робок|обжёгшись на молоке, дуешь на воду|After that scam I'm careful — [once bitten, twice shy].|После того обмана я осторожен — [обжёгшись на молоке, дуешь на воду].
actions speak louder than [words]|дела важнее слов|действия говорят громче слов|судят не по словам, а по делам|Don't promise — [actions speak louder than words].|Не обещай — [судят по делам, а не по словам].
the tip of the [iceberg]|лишь малая часть проблемы|верхушка айсберга|верхушка айсберга|These problems are just [the tip of the iceberg].|Эти проблемы — лишь [верхушка айсберга].
get out of [hand]|выйти из-под контроля|выйти из руки|выйти из-под контроля|The party [got out of hand].|Вечеринка [вышла из-под контроля].
the [sky] is the limit|нет предела возможностям|небо — предел|всё в твоих руках|With your talent, [the sky is the limit].|С твоим талантом [для тебя нет ничего невозможного].
a [storm] in a teacup|много шума из ничего|буря в чайной чашке|буря в стакане воды|Their argument was [a storm in a teacup].|Их ссора — [буря в стакане воды].
go the extra [mile]|сделать больше, чем нужно|пройти лишнюю милю|из кожи вон лезть|She always [goes the extra mile] for her clients.|Ради клиентов она всегда [делает больше, чем нужно].
speak of the [devil]|лёгок на помине|говоря о дьяволе|лёгок на помине|[Speak of the devil]! Here he is.|[Лёгок на помине]! Вот и он.
no pain, no [gain]|без труда ничего не добиться|нет боли — нет выгоды|без труда не выловишь и рыбку из пруда|Training is hard, but [no pain, no gain].|Тренироваться тяжело, но [без труда не выловишь и рыбку из пруда].`;

const IDI = ID_SRC.trim().split('\n').map(s => {
  const [p, r, lit, an, e, er] = s.split('|');
  return [p.replace(/[\[\]]/g, ''), r, '', e, er, 0, 'id', [], null, an, lit, /\[(.+?)\]/.exec(p)[1]];
});
const idKey = i => W[i][11];
// идиома с пропуском ключевого слова: «break the ___»
const idGap = i => esc(en(i)).replace(new RegExp(`\\b${idKey(i)}\\b`), '<span class="gap">&nbsp;</span>');
function idOptions(i) {
  const out = [ru(i)], near = shuffle(lessonIds(lessonOf(i))).concat(shuffle(range(0, W.length)));
  for (const j of near) if (out.length < 4 && !out.includes(ru(j))) out.push(ru(j));
  return shuffle(out);
}
function idStudy(app) {
  const i = curI(), an = W[i][9], lit = W[i][10];
  setStudy(app, {
    cls: 'idm', exs: 1,
    top: `<div class="pword idword"><b>${esc(en(i))}</b><button class="spk" id="say" aria-label="Произнести">${I.spk}</button></div>
      <div class="lit">дословно: «${esc(lit)}»</div>`,
    onTop: e => { if (e.target.closest('#say')) { sayWord(i); return true; } },
  });
  // русский аналог — под значением, если отличается
  if (an !== ru(i)) $('.study .ru').insertAdjacentHTML('afterend', `<div class="analog"><span>по-русски:</span> ${esc(an)}</div>`);
}
function idMemo(app) {
  const i = curI();
  setMemo(app, { top: `<div class="bigword idbig">${esc(en(i))}</div>`, opts: idOptions(i), ok: ru(i), say: () => sayWord(i) });
}
// «Написание»: собрать идиому из слов-плиток по значению
function idWords(app) {
  const i = curI(), words = en(i).split(' ');
  const tiles = shuffle(words);
  let pos = 0, wrong = 0, hintsHere = 0, done = false;
  app.innerHTML = header('Написание', i) + pbar() + `<div class="xbody">
    <div class="bigword ru idru">${esc(ru(i))}</div><div class="ask">соберите идиому</div>
    <div class="wslots" id="ws">${words.map((_, k) => `<span class="ws ${k ? '' : 'cur'}"></span>`).join('')}</div>
    ${tools(i, true)}
    <div class="wtiles" id="wt">${tiles.map((w, k) => `<button class="tile wt" data-t="${k}">${esc(w)}</button>`).join('')}</div></div>`;
  bindCommon(i);
  $('#snd').onclick = () => { S.set.auto = !S.set.auto; save(); const s = $('#snd'); s.classList.toggle('off', !S.set.auto); s.querySelector('.tb').innerHTML = S.set.auto ? I.spk : I.mute; };
  const slots = $$('#ws .ws');
  const place = (cls, tile) => {
    slots[pos].textContent = words[pos]; slots[pos].classList.remove('cur'); slots[pos].classList.add('on'); if (cls) slots[pos].classList.add(cls);
    const t = tile || $$('#wt .wt').find(t => !t.classList.contains('used') && tiles[+t.dataset.t] === words[pos]);
    if (t) t.classList.add('used');
    pos++; if (pos < words.length) slots[pos].classList.add('cur');
  };
  const finish = failed => {
    done = true;
    if (failed) while (pos < words.length) { slots[pos].textContent = words[pos]; slots[pos].classList.add('on', 'fail'); slots[pos].classList.remove('cur'); pos++; }
    const pts = failed ? 0 : Math.max(0, STAGE_PTS - wrong - hintsHere), ok = pts > 0;
    commit(i, pts, ok, wrong, hintsHere > 0);
    setTimeout(() => answerSheet(i, ok), 350);
  };
  const press = t => {
    if (done || !t || t.classList.contains('used')) return;
    if (tiles[+t.dataset.t] === words[pos]) { place(null, t); sfx(true); if (pos === words.length) finish(false); }
    else {
      wrong++; sfx(false); t.classList.add('bad', 'shake'); setTimeout(() => t.classList.remove('bad', 'shake'), 400);
      if (wrong + hintsHere >= STAGE_PTS) finish(true);
    }
  };
  const h = $('#hint');
  if (h) h.onclick = () => {
    if (done || !run.hints) return;
    useHint(h); hintsHere++; place('hint');
    if (wrong + hintsHere >= STAGE_PTS) finish(true); else if (pos === words.length) finish(false);
  };
  bindTaps($('#wt'), '.wt', press);
  onKey = e => { const n = +e.key; if (n >= 1 && n <= tiles.length) press($$('#wt .wt')[n - 1]); };
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
  prep: {
    name: 'Предлоги', tab: 'Предлоги', title: 'Предлоги', per: 5, ver: 2,
    sub: '60 значений в картинках-схемах', note: 'in, on, under, through… — место, движение и время',
    unit: ['предлог', 'предлога', 'предлогов'], items: PREP,
    study: prepStudy, memo: prepMemo,
    matchCap: 'Соедините схему с предлогом',
    matchSilent: true, matchL: i => en(i), matchR: i => en(i), matchLHtml: i => scheme(i, 100, 80), matchRow: 86,
    // «Аудирование»: услышать фразу и собрать пропущенный предлог; «Написание»: по схеме и переводу;
    // «Закрепление» и мини-тест: фраза с пропуском и перевод — напечатать предлог
    target: i => en(i),
    listen: i => speak(plain(W[i][3]), S.set.rate * 0.75),   // фразу — медленнее обычного, чтобы расслышать предлог
    prompt: (i, key) => key === 'audio' ? `<div class="listen-cap">Прослушайте фразу и соберите предлог</div><button class="listen" id="listen" aria-label="Прослушать">${I.spk}</button>`
      : key === 'write' ? `<div class="sch small">${scheme(i, 160, 128)}</div><div class="ask pru">${esc(ru(i))}</div>`
      : `<div class="cloze">${gap(W[i][3])}</div><div class="cloze-ru">${hl(W[i][4])}</div>`,
  },
  pv: {
    name: 'Фразовые глаголы', tab: 'Фразовые глаголы', title: 'Фразовые глаголы',
    sub: '100 самых частых в английском', note: 'give up, find out, look after… — по частицам',
    unit: ['глагол', 'глагола', 'глаголов'], items: PV,
    study: pvStudy, memo: pvMemo,
    matchCap: 'Соедините глагол с переводом',
    matchL: i => en(i), matchR: i => pvRu(i),
    // «Аудирование»: услышать и собрать весь глагол; «Написание»: собрать частицу в примере;
    // «Закрепление» и мини-тест: по переводу напечатать весь глагол
    target: (i, key) => key === 'write' ? pvPart(i) : en(i),
    prompt: (i, key) => key === 'audio' ? `<div class="listen-cap">Прослушайте и соберите глагол</div><button class="listen" id="listen" aria-label="Прослушать">${I.spk}</button>`
      : key === 'write' ? `<div class="cloze">${pvCloze(i)}</div><div class="cloze-ru">${hl(W[i][4])}</div>`
      : `<div class="bigword ru">${esc(ru(i))}</div>`,
  },
  idioms: {
    name: 'Идиомы', tab: 'Идиомы', title: 'Идиомы',
    sub: '100 популярных выражений', note: 'break the ice, piece of cake… — значение и русский аналог',
    unit: ['идиома', 'идиомы', 'идиом'], acc: 'идиому', items: IDI,
    study: idStudy, memo: idMemo, custom: { write: idWords },
    matchCap: 'Соедините идиому со значением',
    matchL: i => en(i), matchR: i => ru(i),
    // «Аудирование»: услышать идиому и вписать пропущенное слово; «Закрепление» и мини-тест: по значению вписать слово
    target: i => idKey(i),
    prompt: (i, key) => key === 'audio' ? `<div class="listen-cap">Прослушайте и впишите пропущенное слово</div><button class="listen" id="listen" aria-label="Прослушать">${I.spk}</button><div class="cloze idgap">${idGap(i)}</div>`
      : `<div class="bigword ru idru">${esc(ru(i))}</div><div class="cloze idgap">${idGap(i)}</div>`,
  },
};
