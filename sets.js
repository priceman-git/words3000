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
function setStudy(app, { cls, top, onTop }) {
  const i = curI(), all = lessonIds(run.n), k = all.indexOf(i) + 1, unit = curSet().unit[0];
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
      <div class="ex-box">${exHTML(W[i][3], W[i][4], 1)}${exHTML(W[i][9], W[i][10], 2)}</div>
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
function setMemo(app, { top, opts, ok, say }) {
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
// в уроке — предлоги, которые легко перепутать: место, движение, направление, время.
// Для каждого — схема: коробка и шарик (место и движение) или шкала времени.
const PREP_SRC = `
in|в, внутри|ɪn|in|The keys are [in] the box.|Ключи [в] коробке.|There is milk [in] the fridge.|[В] холодильнике есть молоко.
on|на (поверхности)|ɑn|on|The book is [on] the table.|Книга [на] столе.|There's a picture [on] the wall.|[На] стене висит картина.
under|под|ˈʌndər|under|The cat is [under] the bed.|Кошка [под] кроватью.|I found my phone [under] the sofa.|Я нашёл телефон [под] диваном.
above|над, выше|əˈbʌv|above|A lamp hangs [above] the table.|[Над] столом висит лампа.|We flew [above] the clouds.|Мы летели [над] облаками.
next to|рядом с, вплотную|ˈnɛkst tu|nextto|Sit [next to] me.|Сядь [рядом со] мной.|The bank is [next to] the café.|Банк [рядом с] кафе.
between|между|bɪˈtwin|between|The shop is [between] the bank and the school.|Магазин [между] банком и школой.|Sit [between] us.|Садись [между] нами.
behind|позади, за|bɪˈhaɪnd|behind|The car is [behind] the house.|Машина [за] домом.|Someone is standing [behind] you.|[Позади] тебя кто-то стоит.
in front of|перед|ɪn ˈfrʌnt əv|front|Don't stand [in front of] the TV.|Не стой [перед] телевизором.|We met [in front of] the cinema.|Мы встретились [перед] кинотеатром.
near|недалеко от, около|nɪr|near|I live [near] the park.|Я живу [недалеко от] парка.|Is there a bank [near] here?|Здесь [поблизости] есть банк?
opposite|напротив|ˈɑpəzɪt|opposite|The pharmacy is [opposite] the bank.|Аптека [напротив] банка.|She sat [opposite] me.|Она села [напротив] меня.
into|в (внутрь)|ˈɪntu|into|He jumped [into] the water.|Он прыгнул [в] воду.|Put the milk [into] the fridge.|Поставь молоко [в] холодильник.
out of|из (наружу)|ˈaʊt əv|outof|She ran [out of] the room.|Она выбежала [из] комнаты.|Take the cake [out of] the oven.|Достань торт [из] духовки.
onto|на (движение)|ˈɑntu|onto|The cat jumped [onto] the table.|Кошка запрыгнула [на] стол.|He climbed [onto] the roof.|Он залез [на] крышу.
off|с (поверхности)|ɔf|off|The cup fell [off] the table.|Чашка упала [со] стола.|Get [off] the bus at the next stop.|Выйди [из] автобуса на следующей остановке.
through|сквозь, через|θru|through|We walked [through] the forest.|Мы шли [через] лес.|The light came [through] the window.|Свет проникал [сквозь] окно.
across|через (на другую сторону)|əˈkrɔs|across|We swam [across] the river.|Мы переплыли [через] реку.|Walk [across] the bridge.|Перейди [через] мост.
along|вдоль, по|əˈlɔŋ|along|We walked [along] the beach.|Мы гуляли [вдоль] пляжа.|Go [along] this street.|Идите [по] этой улице.
around|вокруг|əˈraʊnd|around|The Earth goes [around] the Sun.|Земля вращается [вокруг] Солнца.|We sat [around] the fire.|Мы сидели [вокруг] костра.
over|через, над (движение)|ˈoʊvər|over|The dog jumped [over] the fence.|Собака перепрыгнула [через] забор.|A plane flew [over] our house.|Самолёт пролетел [над] нашим домом.
past|мимо|pæst|past|She walked [past] me.|Она прошла [мимо] меня.|Drive [past] the church and turn left.|Проезжайте [мимо] церкви и поверните налево.
up|вверх по, на|ʌp|up|We walked [up] the hill.|Мы поднялись [на] холм.|The cat ran [up] the tree.|Кошка взбежала [на] дерево.
down|вниз по, с|daʊn|down|The ball rolled [down] the hill.|Мяч скатился [с] холма.|Go [down] the stairs.|Спуститесь [по] лестнице.
towards|по направлению к|təˈwɔrdz|towards|He walked [towards] the door.|Он пошёл [к] двери.|The dog ran [towards] me.|Собака побежала [ко] мне.
from|из, от|frʌm|from|I'm [from] Russia.|Я [из] России.|I got a letter [from] my friend.|Я получил письмо [от] друга.
to|в, к (куда)|tu|to|I go [to] school every day.|Я хожу [в] школу каждый день.|Come [to] me.|Иди [ко] мне.
at|у, в, на (в точке)|æt|at|I'm [at] the bus stop.|Я [на] остановке.|Meet me [at] the station.|Встретимся [на] вокзале.
among|среди (многих)|əˈmʌŋ|among|The house is [among] the trees.|Дом [среди] деревьев.|She was [among] the best students.|Она была [среди] лучших студентов.
against|к, о (опираясь)|əˈɡɛnst|against|The bike is [against] the wall.|Велосипед прислонён [к] стене.|Don't lean [against] the door.|Не облокачивайся [на] дверь.
outside|снаружи, за пределами|ˌaʊtˈsaɪd|outside|There's a taxi [outside] the hotel.|[У] отеля, на улице, стоит такси.|The dog sleeps [outside] the house.|Собака спит [снаружи], не в доме.
below|ниже, под (уровнем)|bɪˈloʊ|below|The fish swim [below] the surface.|Рыбы плавают [под] поверхностью воды.|The temperature is [below] zero.|Температура [ниже] нуля.
at|в (момент времени)|æt|t_at|The film starts [at] 7 o'clock.|Фильм начинается [в] 7 часов.|I'll see you [at] noon.|Увидимся [в] полдень.
on|в (день, дата)|ɑn|t_on|My birthday is [on] Monday.|Мой день рождения [в] понедельник.|The shop is closed [on] Sundays.|Магазин закрыт [по] воскресеньям.
in|в (месяц, год, период)|ɪn|t_in|I was born [in] July.|Я родился [в] июле.|We moved here [in] 2020.|Мы переехали сюда [в] 2020 году.
before|до, перед|bɪˈfɔr|t_before|Wash your hands [before] dinner.|Мой руки [перед] ужином.|Come home [before] ten.|Приходи домой [до] десяти.
after|после|ˈæftər|t_after|Let's go for a walk [after] lunch.|Пойдём гулять [после] обеда.|Call me [after] work.|Позвони мне [после] работы.
for|в течение, на (срок)|fɔr|t_for|I lived there [for] two years.|Я жил там [в течение] двух лет.|We're going away [for] a week.|Мы уезжаем [на] неделю.
since|с (и до сих пор)|sɪns|t_since|I've lived here [since] 2015.|Я живу здесь [с] 2015 года.|She has been waiting [since] morning.|Она ждёт [с] утра.
during|во время|ˈdʊrɪŋ|t_during|Don't talk [during] the film.|Не разговаривай [во время] фильма.|He slept [during] the lesson.|Он спал [во время] урока.
until|до (какого-то момента)|ənˈtɪl|t_until|Wait [until] six.|Подожди [до] шести.|The shop is open [until] 9 pm.|Магазин открыт [до] 9 вечера.
by|к (не позже)|baɪ|t_by|Finish it [by] Friday.|Закончи это [к] пятнице.|I'll be home [by] 8.|Я буду дома [к] 8 часам.`;

const PREP = PREP_SRC.trim().split('\n').map(s => {
  const [p, r, ip, sch, e1, r1, e2, r2] = s.split('|');
  return [p, r, ip, e1, r1, 0, 'p', [], null, e2, r2, sch];
});

// схемы: виды сбоку (коробка и шарик), сверху (дорога, река, дом) и шкала времени
const SC = { ball: '#f0592b', arr: '#2c6a8c', g: '#b9c0c5', water: '#cfe3ef', road: '#e1e5e8' };
const box = (x, y, s = 1, op = 1) => {
  const w = 56 * s, h = 46 * s, d = 14 * s;
  return `<polygon points="${x},${y} ${x + d},${y - d} ${x + w + d},${y - d} ${x + w},${y}" fill="#e6e9eb" stroke="#9aa3a9" stroke-width="1.5"/>
  <polygon points="${x + w},${y} ${x + w + d},${y - d} ${x + w + d},${y + h - d} ${x + w},${y + h}" fill="#c9cfd3" stroke="#9aa3a9" stroke-width="1.5"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#d7dcdf" fill-opacity="${op}" stroke="#9aa3a9" stroke-width="1.5"/>`;
};
const boxDash = (x, y, s = 1) => box(x, y, s, .55).replace(/fill="#e6e9eb"|fill="#c9cfd3"/g, 'fill="#d7dcdf" fill-opacity=".55"').replace(/stroke-width="1.5"/g, 'stroke-width="2" stroke-dasharray="5 4"');
const ball = (x, y, r = 11) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${SC.ball}"/>`;
const ghost = (x, y, r = 11) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${SC.ball}" stroke-width="2" stroke-dasharray="3 3"/>`;
const ground = `<line x1="6" y1="118" x2="154" y2="118" stroke="${SC.g}" stroke-width="2"/>`;
const arrow = (d, dash) => `<path d="${d}" fill="none" stroke="${SC.arr}" stroke-width="3" ${dash ? 'stroke-dasharray="6 5"' : ''} marker-end="url(#MK)"/>`;
const topBox = (x, y, w = 40, h = 30) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#d7dcdf" stroke="#9aa3a9" stroke-width="1.5"/>`;
const tline = `<line x1="10" y1="80" x2="150" y2="80" stroke="${SC.g}" stroke-width="3"/>` + [30, 55, 80, 105, 130].map(x => `<line x1="${x}" y1="74" x2="${x}" y2="86" stroke="${SC.g}" stroke-width="2"/>`).join('');
const lbl = (x, t, c = '#555', y = 108) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="15" fill="${c}" font-family="Roboto Condensed, sans-serif">${t}</text>`;
const mark = (x, t) => `<line x1="${x}" y1="58" x2="${x}" y2="92" stroke="${SC.arr}" stroke-width="3"/>` + lbl(x, t, SC.arr);
const slope = `<path d="M10,118 L150,30 L150,118 Z" fill="#e6e9eb" stroke="#9aa3a9" stroke-width="1.5"/>`;
const SCHEMES = {
  in: ground + box(45, 72, 1, 0) + ball(73, 100) + box(45, 72, 1, .45),
  on: ground + box(45, 72) + ball(80, 47),
  under: ground + box(45, 40) + ball(73, 107),
  above: ground + box(45, 72) + ball(80, 18),
  nextto: ground + box(30, 72) + ball(112, 107),
  between: ground + box(8, 72, .8) + box(100, 72, .8) + ball(80, 107),
  behind: ground + ball(82, 62, 13) + boxDash(40, 72),
  front: ground + box(45, 64) + ball(68, 108, 13),
  near: ground + box(12, 72) + ball(140, 107),
  opposite: `<rect x="0" y="54" width="160" height="28" fill="${SC.road}"/><line x1="0" y1="68" x2="160" y2="68" stroke="#fff" stroke-width="2" stroke-dasharray="8 6"/>` + topBox(60, 12) + ball(80, 106),
  into: ground + ball(18, 50) + box(55, 72, 1, 0) + arrow('M30,54 Q70,40 82,92', true) + box(55, 72, 1, .45),
  outof: ground + box(30, 72, 1, .45) + arrow('M58,92 Q80,40 118,56', true) + ball(132, 60),
  onto: ground + box(55, 72) + ghost(90, 47) + ball(16, 107) + arrow('M24,96 Q40,30 78,44', true),
  off: ground + box(20, 72) + ghost(55, 47) + arrow('M66,42 Q118,30 126,90', true) + ball(134, 107),
  through: ground + arrow('M10,95 L150,95', true) + box(52, 72, 1, .55) + ball(18, 95, 9),
  across: `<rect x="58" y="0" width="44" height="128" fill="${SC.water}"/>` + ghost(16, 64, 9) + arrow('M26,64 L136,64', true) + ball(146, 64, 9),
  along: `<rect x="0" y="78" width="160" height="26" fill="${SC.road}"/>` + ghost(14, 91, 9) + arrow('M24,91 L134,91', true) + ball(146, 91, 9),
  around: ground + `<ellipse cx="80" cy="88" rx="62" ry="30" fill="none" stroke="${SC.arr}" stroke-width="3" stroke-dasharray="6 5"/>` + box(52, 76, .9) + ball(140, 88, 9) + arrow('M126,62 L134,70'),
  over: ground + box(52, 72) + ghost(14, 108, 9) + arrow('M22,98 Q80,-24 138,98', true) + ball(146, 108, 9),
  past: topBox(60, 22) + ghost(14, 82, 9) + arrow('M24,82 L136,82', true) + ball(148, 82, 9),
  up: slope + ghost(30, 96, 9) + arrow('M42,86 L108,45', true) + ball(124, 38, 9),
  down: slope + ghost(128, 36, 9) + arrow('M116,48 L44,92', true) + ball(26, 100, 9),
  towards: ground + ball(16, 107) + arrow('M30,107 L66,107') + box(98, 72),
  from: ground + box(8, 72) + arrow('M84,100 L124,100') + ball(138, 100),
  to: ground + ball(14, 100) + arrow('M26,100 L90,100') + box(96, 72),
  at: `<circle cx="80" cy="66" r="44" fill="none" stroke="${SC.g}" stroke-width="2"/><circle cx="80" cy="66" r="26" fill="none" stroke="${SC.g}" stroke-width="2"/>` + ball(80, 66),
  among: box(8, 96, .5) + box(112, 96, .5) + box(28, 54, .5) + box(94, 54, .5) + box(60, 24, .5) + ball(80, 86, 9),
  against: ground + `<rect x="106" y="16" width="16" height="102" fill="#c9cfd3" stroke="#9aa3a9" stroke-width="1.5"/><line x1="46" y1="116" x2="104" y2="34" stroke="${SC.ball}" stroke-width="8" stroke-linecap="round"/>`,
  outside: `<rect x="18" y="20" width="84" height="84" rx="4" fill="#eef0f1" stroke="#9aa3a9" stroke-width="3"/>` + ball(132, 62),
  below: `<rect x="0" y="62" width="160" height="66" fill="${SC.water}"/><line x1="0" y1="62" x2="160" y2="62" stroke="${SC.arr}" stroke-width="2"/>` + box(56, 50, .6) + ball(80, 100),
  t_at: tline + ball(80, 80, 9) + lbl(80, '7:00'),
  t_on: tline + `<rect x="58" y="68" width="44" height="24" rx="5" fill="${SC.ball}" fill-opacity=".85"/>` + lbl(80, 'Monday'),
  t_in: tline + `<rect x="18" y="68" width="124" height="24" rx="6" fill="${SC.ball}" fill-opacity=".55"/>` + lbl(80, 'July'),
  t_before: tline + mark(105, 'dinner') + ball(60, 80, 9),
  t_after: tline + mark(55, 'lunch') + ball(100, 80, 9),
  t_for: tline + `<path d="M40,56 L120,56" stroke="${SC.arr}" stroke-width="3" marker-end="url(#MK)" marker-start="url(#MK)"/>` + `<rect x="40" y="72" width="80" height="16" rx="4" fill="${SC.ball}" fill-opacity=".55"/>` + lbl(80, 'two years'),
  t_since: tline + ball(40, 80, 8) + arrow('M48,58 L140,58') + lbl(40, '2015') + lbl(136, 'now', SC.arr),
  t_until: tline + `<rect x="18" y="72" width="102" height="16" rx="4" fill="${SC.ball}" fill-opacity=".4"/>` + arrow('M20,58 L112,58') + mark(120, 'six'),
  t_during: tline + `<rect x="30" y="68" width="100" height="24" rx="6" fill="${SC.arr}" fill-opacity=".2"/>` + ball(80, 80, 9) + lbl(80, 'the film'),
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
const PREP_APART = [['to', 'towards'], ['under', 'below'], ['near', 'next to']];
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
    top: `<div class="sch">${scheme(i, 240, 192)}</div><div class="pword"><b>${esc(en(i))}</b><span class="ipa gray">[${esc(W[i][2])}]</span>
      <button class="spk" id="say" aria-label="Произнести">${I.spk}</button></div>`,
    onTop: e => { if (e.target.closest('#say')) { sayWord(i); return true; } },
  });
  const b = $('.pword b'), box = $('.pword');   // «in front of» — мельче, в одну строку
  let fs = 44; while (box.scrollWidth > box.clientWidth + 1 && fs > 22) b.style.fontSize = --fs + 'px';
}
function prepMemo(app) {
  const i = curI();
  setMemo(app, {
    top: `<div class="ask">Какой предлог на схеме?</div><div class="sch">${scheme(i, 220, 176)}</div>`,
    opts: prepOptions(i), ok: en(i), say: () => speak(plain(W[i][3])),
  });
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
    name: 'Предлоги', tab: 'Предлоги', title: 'Предлоги', per: 5,
    sub: '40 значений в картинках-схемах', note: 'in, on, under, through… — место, движение и время',
    unit: ['предлог', 'предлога', 'предлогов'], items: PREP,
    study: prepStudy, memo: prepMemo,
    matchCap: 'Соедините схему с предлогом',
    matchL: i => en(i), matchR: i => en(i), matchLHtml: i => scheme(i, 120, 96), matchRow: 104,
    // «Аудирование»: услышать фразу и собрать пропущенный предлог; «Написание»: по схеме и переводу;
    // «Закрепление» и мини-тест: фраза с пропуском и перевод — напечатать предлог
    target: i => en(i),
    // лишние буквы из другого предлога урока: in → I N + O N T O
    extra: i => {
      const w = en(i).replace(/ /g, ''), other = shuffle(lessonIds(lessonOf(i)).filter(j => en(j) !== en(i)))[0];
      return w.length >= 7 || other === undefined ? '' : en(other).replace(/ /g, '').slice(0, Math.max(3, 7 - w.length));
    },
    listen: i => speak(plain(W[i][3])),
    prompt: (i, key) => key === 'audio' ? `<div class="listen-cap">Прослушайте фразу и соберите предлог</div><button class="listen" id="listen" aria-label="Прослушать">${I.spk}</button>`
      : key === 'write' ? `<div class="sch small">${scheme(i, 150, 120)}</div><div class="ask">${esc(ru(i))}</div>`
      : `<div class="cloze">${gap(W[i][3])}</div><div class="cloze-ru">${hl(W[i][4])}</div>`,
  },
};
