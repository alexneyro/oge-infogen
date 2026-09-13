export interface Character {
  id: string;
  name?: string;
  surname?: string;
  patronymic?: string;
  role: string;
  action?: string;
  acts?: boolean;
  anchor?: string;
}

export interface Phrase {
  quote: string;
  speakerId: string;
  aboutId?: string;
}

export interface Situation {
  id: string;
  text: string;
  anchor: string;
  answerId: string;
}

export interface Hook {
  word: string;
  rare: boolean;
  leadsTo: string;
  isName?: boolean;
}

export interface Relation {
  fromId: string;
  kind: string;
  targetName: string;
  acceptedAnswers?: string[];
}

export interface Work {
  id: string;
  author: string;
  title: string;
  file: string;      // имя .txt файла
  displayName?: string; // наглядное имя файла для zip
  /**
   * Путь к файлу на сервере относительно public/texts/ (только латиница и подчёркивания, например: 'chehov/chehov_hameleon.txt').
   * Используется для физической загрузки файла через fetch.
   */
  path: string;
  /**
   * Имя папки внутри формируемого ZIP-архива (кириллица, фамилия автора, например: 'Чехов').
   * Эту структуру видит ученик при распаковке архива.
   */
  subdir: string;
  isStub?: boolean;
  characters: Character[];
  phrases: Phrase[];
  hooks: Hook[];
  relations: Relation[];
  situations?: Situation[];
}

export const WORKS: Work[] = [
  // А. П. Чехов — «Хамелеон»
  {
    id: 'chehov_hameleon',
    author: 'А. П. Чехов',
    title: 'Хамелеон',
    file: 'chehov_hameleon.txt',
    displayName: 'Хамелеон.txt',
    path: 'chehov/chehov_hameleon.txt',
    subdir: 'Чехов',
    characters: [
      { id: 'ochumelov', surname: 'Очумелов', role: 'полицейский надзиратель', action: 'проводит разбирательство из-за укушенного пальца и несколько раз меняет мнение о собаке', acts: true, anchor: 'Очумелов' },
      { id: 'hryukin', surname: 'Хрюкин', role: 'золотых дел мастер', action: 'жалуется на укус собаки и показывает толпе окровавленный палец', acts: true, anchor: 'Хрюкин' },
      { id: 'eldyrin', surname: 'Елдырин', role: 'городовой', action: 'сопровождает надзирателя и подаёт-снимает с него пальто', acts: true, anchor: 'Елдырин' },
      { id: 'prohor', name: 'Прохор', role: 'генеральский повар', action: 'отказывается признать собаку своей и уводит её', acts: true, anchor: 'Прохор' },
      { id: 'zhigalov', surname: 'Жигалов', role: 'генерал', action: 'в тексте только упоминается как возможный хозяин собаки', acts: false },
      { id: 'vladimir', name: 'Владимир', patronymic: 'Иваныч', role: 'брат генерала', action: 'приехал погостить, ему принадлежит собака', acts: false },
    ],
    phrases: [
      { quote: 'Я ему покажу Кузькину мать!..', speakerId: 'ochumelov' },
      { quote: 'У меня у самого брат в жандармах... ежели хотите знать...', speakerId: 'hryukin' },
      { quote: 'У генерала таких нет. У него всё больше легавые...', speakerId: 'eldyrin', aboutId: 'zhigalov' },
      { quote: 'Этаких у нас отродясь не бывало!', speakerId: 'prohor' },
    ],
    hooks: [
      { word: 'Очумелов', rare: true, leadsTo: 'ochumelov', isName: true },
      { word: 'Елдырин', rare: true, leadsTo: 'eldyrin', isName: true },
      { word: 'цуцык', rare: true, leadsTo: 'ochumelov', isName: false },
      { word: 'Жигалова', rare: true, leadsTo: 'zhigalov', isName: true },
    ],
    relations: [
      { fromId: 'vladimir', kind: 'брат', targetName: 'Жигалов', acceptedAnswers: ['Жигалова', 'Жигалов'] },
    ],
    situations: [
      {
        id: 'hameleon_sit_1',
        anchor: 'конфискованным',
        text: 'Городовой следует через базарную площадь позади надзирателя и несёт решето с конфискованным крыжовником.',
        answerId: 'eldyrin',
      },
      {
        id: 'hameleon_sit_2',
        anchor: 'окровавленный палец',
        text: 'Пострадавший ремесленник поднимает вверх окровавленный палец и требует компенсации от хозяина собаки.',
        answerId: 'hryukin',
      },
    ],
  },
  // А. П. Чехов — «Толстый и тонкий»

  {
    id: 'chehov_tolstyi_i_tonkiy',
    author: 'А. П. Чехов',
    title: 'Толстый и тонкий',
    file: 'chehov_tolstyi_i_tonkiy.txt',
    displayName: 'Толстый и тонкий.txt',
    path: 'chehov/chehov_tolstyi_i_tonkiy.txt',
    subdir: 'Чехов',
    characters: [
      { id: 'misha', name: 'Миша',
        role: 'тайный советник',
        action: 'дослужился до высокого чина и имеет две звезды',
        acts: true,
        anchor: 'Миша' },
      { id: 'porfiriy', name: 'Порфирий',
        role: 'коллежский асессор, столоначальник',
        action: 'делает из дерева портсигары и продаёт по рублю за штуку',
        acts: true,
        anchor: 'Порфирий' },
      { id: 'nafanail', name: 'Нафанаил',
        role: 'ученик III класса, сын',
        action: 'вытягивается во фрунт, шаркает ногой и роняет фуражку',
        acts: true,
        anchor: 'Нафанаил' },
      { id: 'luiza', name: 'Луиза',
        role: 'жена, лютеранка',
        action: 'даёт уроки музыки, стоит с длинным подбородком за спиной мужа',
        acts: true,
        anchor: 'Луиза' },
    ],
    phrases: [
      { quote: 'Ты ли это? Голубчик мой! Сколько зим, сколько лет!', speakerId: 'misha', aboutId: 'porfiriy' },
      { quote: 'Я уже до тайного дослужился... Две звезды имею.', speakerId: 'misha' },
      { quote: 'я портсигары приватно из дерева делаю', speakerId: 'porfiriy' },
      { quote: 'Тебя дразнили Геростратом за то, что ты казенную книжку папироской прожег', speakerId: 'porfiriy', aboutId: 'misha' },
    ],
    hooks: [
      { word: 'Геростратом', rare: true, leadsTo: 'misha', isName: false },
      { word: 'хересом', rare: true, leadsTo: 'misha', isName: false },
      { word: 'Эфиальтом', rare: true, leadsTo: 'porfiriy', isName: false },
      { word: 'столоначальником', rare: true, leadsTo: 'porfiriy', isName: false },
      { word: 'лютеранка', rare: true, leadsTo: 'luiza', isName: false },
    ],
    relations: [
      { fromId: 'misha', kind: 'друг детства', targetName: 'Порфирий' },
      { fromId: 'porfiriy', kind: 'друг детства', targetName: 'Миша' },
    ],
    situations: [
      {
        id: 'tolstyi_sit_1',
        anchor: 'кофейной гущей',
        text: 'Встретив школьного товарища на вокзале, чиновник замечает, что от собеседника пахнет кофейной гущей и табаком.',
        answerId: 'porfiriy',
      },
      {
        id: 'tolstyi_sit_2',
        anchor: 'две звезды',
        text: 'В ходе разговора старый друг признаётся, что уже дослужился до чина тайного советника и имеет две звезды.',
        answerId: 'misha',
      },
    ],
  },

  // А. П. Чехов — «Смерть чиновника»

  {
    id: 'chehov_smert_chinovnika',
    author: 'А. П. Чехов',
    title: 'Смерть чиновника',
    file: 'chehov_smert_chinovnika.txt',
    displayName: 'Смерть чиновника.txt',
    path: 'chehov/chehov_smert_chinovnika.txt',
    subdir: 'Чехов',
    characters: [
      { id: 'chervyakov', name: 'Иван', patronymic: 'Дмитрич', surname: 'Червяков',
        role: 'экзекутор',
        action: 'чихнул в театре и потом четыре раза ходит извиняться',
        acts: true,
        anchor: 'Червяков' },
      { id: 'brizzhalov', surname: 'Бризжалов',
        role: 'статский генерал по ведомству путей сообщения',
        action: 'вытирает перчаткой лысину и шею, а под конец топает ногами и гонит просителя',
        acts: true,
        anchor: 'Бризжалов' },
      { id: 'zhena',
        role: 'жена чиновника',
        action: 'советует мужу ещё раз сходить и извиниться',
        acts: false },
    ],
    phrases: [
      { quote: 'Ах, полноте... Я уж забыл, а вы всё о том же!', speakerId: 'brizzhalov', aboutId: 'chervyakov' },
      { quote: 'Да вы просто смеетесь, милостисдарь!', speakerId: 'brizzhalov', aboutId: 'chervyakov' },
      { quote: 'а смеяться я и не думал. Смею ли я смеяться?', speakerId: 'chervyakov' },
    ],
    hooks: [
      { word: 'Червяков', rare: true, leadsTo: 'chervyakov', isName: true },
      { word: 'экзекутор', rare: true, leadsTo: 'chervyakov', isName: false },
      { word: 'вицмундир', rare: true, leadsTo: 'chervyakov', isName: false },
      { word: 'Корневильские', rare: true, leadsTo: 'chervyakov', isName: false },
      { word: 'Бризжалова', rare: true, leadsTo: 'brizzhalov', isName: true },
      { word: 'милостисдарь', rare: true, leadsTo: 'brizzhalov', isName: false },
      { word: 'фанфароном', rare: true, leadsTo: 'brizzhalov', isName: false },
    ],
    relations: [],
    situations: [
      {
        id: 'smert_sit_1',
        anchor: 'бинокль',
        text: 'Во время спектакля в театре мелкий чиновник с удовольствием глядел в бинокль на сцену, пока неожиданно не чихнул.',
        answerId: 'chervyakov',
      },
      {
        id: 'smert_sit_2',
        anchor: 'лысину',
        text: 'Старичок генерал сидел в первом ряду кресел и вытирал лысину перчаткой после неприятного происшествия.',
        answerId: 'brizzhalov',
      },
    ],
  },

  // А. П. Чехов — «Злоумышленник»

  {
    id: 'chehov_zloumyshlennik',
    author: 'А. П. Чехов',
    title: 'Злоумышленник',
    file: 'chehov_zloumyshlennik.txt',
    displayName: 'Злоумышленник.txt',
    path: 'chehov/chehov_zloumyshlennik.txt',
    subdir: 'Чехов',
    characters: [
      { id: 'denis', name: 'Денис', surname: 'Григорьев',
        role: 'мужик, обвиняемый',
        action: 'отвинчивал гайку с рельсов, чтобы сделать грузило для рыбной ловли',
        acts: true,
        anchor: 'Денис' },
      { id: 'sledovatel',
        role: 'судебный следователь',
        action: 'ведёт допрос и постановляет взять обвиняемого под стражу',
        acts: false },
      { id: 'akinfov', name: 'Иван', patronymic: 'Семенов', surname: 'Акинфов',
        role: 'железнодорожный сторож',
        acts: false },
      { id: 'mitrofan', name: 'Митрофан', surname: 'Петров',
        role: 'мужик, делает невода на продажу',
        acts: false },
    ],
    phrases: [
      { quote: 'Мы из гаек грузила делаем...', speakerId: 'denis' },
      { quote: 'Лучше гайки и не найтить... И тяжелая, и дыра есть.', speakerId: 'denis' },
      { quote: 'Ты еще про шилишпера расскажи!', speakerId: 'sledovatel', aboutId: 'denis' },
      { quote: 'Нет. Я должен взять тебя под стражу и отослать в тюрьму.', speakerId: 'sledovatel', aboutId: 'denis' },
    ],
    hooks: [
      { word: 'пестрядинной', rare: true, leadsTo: 'denis', isName: false },
      { word: 'выполозка', rare: true, leadsTo: 'denis', isName: false },
      { word: 'Климовские', rare: true, leadsTo: 'denis', isName: false },
      { word: 'шилишпер', rare: true, leadsTo: 'denis', isName: false },
      { word: 'Акинфов', rare: true, leadsTo: 'akinfov', isName: true },
    ],
    relations: [
      { fromId: 'denis', kind: 'брат', targetName: 'Кузьма Григорьев' },
    ],
    situations: [
      {
        id: 'zloumyshlennik_sit_1',
        anchor: 'латаных портах',
        text: 'Крестьянин в пестрядинной рубахе и латаных портах простодушно объясняет на допросе, зачем ему понадобилась железнодорожная деталь.',
        answerId: 'denis',
      },
    ],
  },

  // А. П. Чехов — «Лошадиная фамилия»

  {
    id: 'chehov_loshadinaya_familiya',
    author: 'А. П. Чехов',
    title: 'Лошадиная фамилия',
    file: 'chehov_loshadinaya_familiya.txt',
    displayName: 'Лошадиная фамилия.txt',
    path: 'chehov/chehov_loshadinaya_familiya.txt',
    subdir: 'Чехов',
    characters: [
      { id: 'buldeev', surname: 'Булдеев',
        role: 'отставной генерал-майор',
        action: 'мучается зубной болью и сперва отказывается рвать зуб',
        acts: true,
        anchor: 'Булдеев' },
      { id: 'ivan_evseich', name: 'Иван', patronymic: 'Евсеич',
        role: 'приказчик',
        action: 'советует лечиться заговором и не может вспомнить фамилию знахаря',
        acts: true,
        anchor: 'Евсеич' },
      { id: 'ovsov', name: 'Яков', patronymic: 'Васильич', surname: 'Овсов',
        role: 'акцизный, заговаривает зубы',
        acts: false },
      { id: 'doctor',
        role: 'доктор',
        action: 'прописывает хину, потом рвёт зуб и спрашивает про овёс',
        acts: false },
    ],
    phrases: [
      { quote: 'Ты вот не веришь в заговоры, а я на себе испытала.', speakerId: 'buldeev' },
      { quote: 'Не могу ли я, голубчик, купить у вас четвертей пять овса?', speakerId: 'doctor', aboutId: 'buldeev' },
      { quote: 'Овсов! Овсов фамилия акцизного!', speakerId: 'ivan_evseich', aboutId: 'ovsov' },
      { quote: 'Не нужно мне теперь твоей лошадиной фамилии!', speakerId: 'buldeev', aboutId: 'ivan_evseich' },
    ],
    hooks: [
      { word: 'Булдеева', rare: true, leadsTo: 'buldeev', isName: true },
      { word: 'скипидар', rare: true, leadsTo: 'buldeev', isName: false },
      { word: 'Евсеич', rare: true, leadsTo: 'ivan_evseich', isName: true },
      { word: 'Овсов', rare: true, leadsTo: 'ovsov', isName: true },
      { word: 'акцизный', rare: true, leadsTo: 'ovsov', isName: false },
      { word: 'Саратове', rare: true, leadsTo: 'ovsov', isName: false },
    ],
    relations: [
      { fromId: 'ivan_evseich', kind: 'приказчик', targetName: 'Булдеев' },
    ],
    situations: [
      {
        id: 'loshadinaya_sit_1',
        anchor: 'табачную копоть',
        text: 'Страдая от невыносимой зубной боли, отставной генерал прикладывал к десне табачную копоть и полоскал рот коньяком.',
        answerId: 'buldeev',
      },
    ],
  },

  // А. С. Пушкин — «Капитанская дочка»
  {
    id: 'pushkin_kapitanskaya_dochka',
    author: 'А. С. Пушкин',
    title: 'Капитанская дочка',
    file: 'kapitanskaya_dochka.txt',
    displayName: 'Капитанская_дочка.txt',
    path: 'pushkin/kapitanskaya_dochka.txt',
    subdir: 'Пушкин',
    isStub: true,
    characters: [
      { id: 'grinev', surname: 'Гринев', name: 'Пётр', role: 'дворянин и офицер', action: 'дарит вожатому заячий тулуп во время бурана', acts: true },
      { id: 'savelich', surname: 'Савелич', name: 'Архип', role: 'стремянный и дядька', action: 'бережливо ведёт учёт барского имущества', acts: true },
      { id: 'shvabrin', surname: 'Швабрин', name: 'Алексей', role: 'офицер', action: 'вызывает сослуживца на дуэль из-за стихов', acts: true },
      { id: 'masha', surname: 'Миронова', name: 'Марья', role: 'дочь коменданта', action: 'едет в Царское Село просить императрицу за жениха', acts: true },
      { id: 'pugachev', surname: 'Пугачев', name: 'Емельян', role: 'предводитель бунта', action: 'помиловал офицера за давний подарок', acts: true },
      { id: 'mironov', surname: 'Миронов', name: 'Иван', role: 'комендант Белогорской крепости', action: 'руководит обороной крепости от бунтовщиков', acts: true },
    ],
    phrases: [
      { quote: 'Береги платье снову, а честь смолоду.', speakerId: 'grinev' },
      { quote: 'Казнить так казнить, жаловать так жаловать.', speakerId: 'pugachev' },
    ],
    hooks: [
      { word: 'Гринев', rare: true, leadsTo: 'grinev', isName: true },
      { word: 'заячий тулуп', rare: true, leadsTo: 'grinev', isName: false },
      { word: 'Белогорская', rare: true, leadsTo: 'mironov', isName: false },
      { word: 'ординарец', rare: true, leadsTo: 'savelich', isName: false },
    ],
    relations: [
      { fromId: 'savelich', kind: 'дядька', targetName: 'Пётр Гринев' },
      { fromId: 'masha', kind: 'дочь', targetName: 'капитан Миронов' },
    ],
  },

  // Заглушки для тестирования L2 / L3
  {
    id: 'testov_laboratornyy_zhurnal',
    author: 'Иван Тестов',
    title: 'Лабораторный журнал',
    file: 'testov_laboratornyy_zhurnal.txt',
    displayName: 'Лабораторный_журнал.txt',
    path: 'testov/testov_laboratornyy_zhurnal.txt',
    subdir: 'Тестов',
    isStub: true,
    characters: [
      { id: 'kolba', surname: 'Колбочкин', name: 'Сергей', role: 'лаборант', action: 'случайно пролил фиолетовый реактив на чертёж', acts: true },
      { id: 'profe', surname: 'Пробиркин', name: 'Анатолий', role: 'профессор', action: 'ищет потерянные очки и строит гипотезу', acts: true },
    ],
    phrases: [
      { quote: 'Фиолетовый реактив нельзя смешивать с озоном!', speakerId: 'profe' },
      { quote: 'Я же просто проверял температуру колбы...', speakerId: 'kolba' },
    ],
    hooks: [
      { word: 'фиолетовый реактив', rare: true, leadsTo: 'kolba', isName: false },
      { word: 'озон', rare: true, leadsTo: 'profe', isName: false },
    ],
    relations: [
      { fromId: 'kolba', kind: 'ассистент', targetName: 'Анатолий Пробиркин' },
    ],
  },
  {
    id: 'probnikov_tayna_mayaka',
    author: 'Пётр Пробников',
    title: 'Тайна старого маяка',
    file: 'probnikov_tayna_mayaka.txt',
    displayName: 'Тайна_старого_маяка.txt',
    path: 'probnikov/probnikov_tayna_mayaka.txt',
    subdir: 'Пробников',
    isStub: true,
    characters: [
      { id: 'smotritel', surname: 'Маяков', name: 'Григорий', role: 'смотритель маяка', action: 'зажигает старинный латунный фонарь во время шторма', acts: true },
      { id: 'yunga', name: 'Венька', role: 'молодой юнга', action: 'замечает загадочный силуэт парусника в тумане', acts: true },
    ],
    phrases: [
      { quote: 'Латунный фонарь никогда не подводил моряков!', speakerId: 'smotritel' },
      { quote: 'Смотрите, на горизонте видны вспышки!', speakerId: 'yunga' },
    ],
    hooks: [
      { word: 'латунный фонарь', rare: true, leadsTo: 'smotritel', isName: false },
      { word: 'парусник', rare: true, leadsTo: 'yunga', isName: false },
    ],
    relations: [
      { fromId: 'yunga', kind: 'помощник', targetName: 'Григорий Маяков' },
    ],
  },
  {
    id: 'zadachnikov_zabytyy_kompas',
    author: 'Василий Задачников',
    title: 'Забытый компас',
    file: 'zadachnikov_zabytyy_kompas.txt',
    displayName: 'Забытый_компас.txt',
    path: 'zadachnikov/zadachnikov_zabytyy_kompas.txt',
    subdir: 'Задачников',
    isStub: true,
    characters: [
      { id: 'kapitan', surname: 'Компасов', name: 'Аркадий', role: 'капитан шхуны', action: 'ищет медный компас в старом сундуке', acts: true },
      { id: 'sturman', surname: 'Штурвалов', name: 'Борис', role: 'штурман', action: 'прокладывает курс по звёздам', acts: true },
    ],
    phrases: [
      { quote: 'Медный компас указывал на север даже в шторм', speakerId: 'kapitan' },
    ],
    hooks: [
      { word: 'медный компас', rare: true, leadsTo: 'kapitan', isName: false },
      { word: 'карта звездного неба', rare: true, leadsTo: 'sturman', isName: false },
    ],
    relations: [
      { fromId: 'sturman', kind: 'подчинённый', targetName: 'Аркадий Компасов' },
    ],
  },
  {
    id: 'algoritmov_kosmicheskaya_stanciya',
    author: 'Николай Алгоритмов',
    title: 'Космическая станция',
    file: 'algoritmov_kosmicheskaya_stanciya.txt',
    displayName: 'Космическая_станция.txt',
    path: 'algoritmov/algoritmov_kosmicheskaya_stanciya.txt',
    subdir: 'Алгоритмов',
    isStub: true,
    characters: [
      { id: 'inzhener', surname: 'Винтиков', name: 'Вадим', role: 'бортинженер', action: 'чинит квантовый генератор в силовом отсеке', acts: true },
      { id: 'pilot', surname: 'Звёздный', name: 'Тимур', role: 'пилот челнока', action: 'запрашивает посадку на астероид', acts: true },
    ],
    phrases: [
      { quote: 'Квантовый генератор требует перезагрузки', speakerId: 'inzhener' },
    ],
    hooks: [
      { word: 'квантовый генератор', rare: true, leadsTo: 'inzhener', isName: false },
      { word: 'челнок', rare: true, leadsTo: 'pilot', isName: false },
    ],
    relations: [
      { fromId: 'inzhener', kind: 'коллега', targetName: 'Тимур Звёздный' },
    ],
  }
];
