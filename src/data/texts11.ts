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
    path: 'pushkin/pushkin_kapitanskaya_dochka.txt',
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
  {
  id: 'arno_divo',
  author: 'С. И. Арно',
  title: 'Диво',
  file: 'divo.txt',
  path: 'arno/arno_divo.txt',
  subdir: 'Арно',
  

  characters: [
    { id: 'maksim', name: 'Максим', patronymic: 'Иванович',
      role: 'сорокавосьмилетний холостяк, работник заводоуправления',
      anchor: 'вперялся',
      action: 'подглядывает в щель запертых ворот на «диво», знакомится с Борисом и, увидев в окне кормление слабоумного, молча уходит' },
    { id: 'boris', name: 'Борис', role: 'высокий молодой человек, другой любитель смотреть в щель ворот',
      anchor: 'испакостится',
      action: 'знакомится с Максимом Ивановичем у ворот, называет его «дедулей» и заставляет заглянуть в освещённое окно, где кормят слабоумного' },
    { id: 'idiot', role: 'слабоумный, которого кормят у освещённого окна', acts: false },
    { id: 'zhenshchina', role: 'женщина в чёрном платке, ухаживающая за слабоумным', acts: false },
    { id: 'podruzhka', role: 'девушка, которую Борис приводил к воротам', acts: false },
  ],

  phrases: [
    { quote: 'Настроение исключительно поднимается, радость, успокоенность какая-то охватывает...', speakerId: 'maksim' },
    { quote: 'Вот же вы какое словцо подобрали! Я, бывает...', speakerId: 'maksim' },
    { quote: 'А во дворике... дорожки, деревья, статуя...', speakerId: 'maksim' },
    { quote: 'Настроение испакостится, сюда загляну. Не-е-т, думаю, жизнь прекрасна!', speakerId: 'boris' },
    { quote: 'Вот, думаю, дедуля! Тоже вроде меня - духовный извращенец.', speakerId: 'boris', aboutId: 'maksim' },
    { quote: 'Теперь ты полюбуйся, потешь свое старческое тщеславие.', speakerId: 'boris' },
    { quote: 'У вас, Максим Потапович, со зрением, видать, что-то стряслось', speakerId: 'boris', aboutId: 'maksim' },
    { quote: 'Вы внимательнее приглядитесь, он же в соплях весь.', speakerId: 'boris' },
    { quote: 'Вот у меня дедуля знакомый есть, так он жить без этого не может', speakerId: 'boris', aboutId: 'maksim' },
  ],

  hooks: [
    { word: 'стосвечовой', rare: true, leadsTo: 'maksim' },        // A
    { word: 'облупившихся', rare: true, leadsTo: 'maksim' },       // A
    { word: 'самоедством', rare: true, leadsTo: 'boris' },         // A
    { word: 'заводоуправления', rare: true, leadsTo: 'maksim' },   // B
    { word: 'крадучись', rare: true, leadsTo: 'maksim' },          // B
    { word: 'окоченел', rare: true, leadsTo: 'maksim' },           // B
    { word: 'конфузливо', rare: true, leadsTo: 'maksim' },         // B
    { word: 'недомогал', rare: true, leadsTo: 'maksim' },          // B
    { word: 'переврав', rare: true, leadsTo: 'boris' },            // B
    { word: 'похохатывал', rare: true, leadsTo: 'boris' },         // B
    { word: 'хохотнув', rare: true, leadsTo: 'boris' },            // B
    { word: 'фамильярно', rare: true, leadsTo: 'boris' },          // B
    { word: 'развязно', rare: true, leadsTo: 'boris' },            // B
  ],

  relations: [
    { fromId: 'boris', kind: 'случайный знакомый', targetName: 'Максим Иванович' },
    { fromId: 'maksim', kind: 'случайный знакомый', targetName: 'Борис' },
  ],

  situations: [
    { id: 'arno_divo_s1',
      text: 'Когда створки ворот захлопнулись, пожилой наблюдатель в испуге шарахнулся в сторону и ненароком задел локтем высокого соседа.',
      anchor: 'шарахнулся', answerId: 'maksim' },                   // B
    { id: 'arno_divo_s2',
      text: 'К сорока восьми годам этот человек не обзавёлся семьёй, потому что воздерживался от любых шагов, способных испортить его покойное существование.',
      anchor: 'воздерживался', answerId: 'maksim' },                // B
    { id: 'arno_divo_s3',
      text: 'Вернувшись пешком, он сел во дворе своего дома на скамью, зажал рот ладонью, и всё его тело стало меленько вздрагивать от смеха.',
      anchor: 'меленько', answerId: 'maksim' },                    // A
    { id: 'arno_divo_s4',
      text: 'Этот высокий парень рассказывал, что приводил к воротам подружку, а та брезгливо отозвалась об увиденном, за что он обругал её дурой.',
      anchor: 'подружку', answerId: 'boris' },                     // B
    { id: 'arno_divo_s5',
      text: 'Подтолкнув пожилого знакомого к воротам, высокий парень издевательски мягко спросил, не видит ли тот, кто сидит у окошка.',
      anchor: 'издевательски', answerId: 'boris' },                // B
  ],
},

{
  id: 'arno_mirazhi',
  author: 'С. И. Арно',
  title: 'Миражи',
  file: 'mirazhi.txt',
  path: 'arno/arno_mirazhi.txt',
  subdir: 'Арно',
  

  characters: [
    { id: 'seregin', surname: 'Серегин', role: 'старший сержант милиции',
      anchor: 'вцепенение',
      action: 'ночью с улыбкой уговаривает приезжего повернуть назад, угрожая задержанием, а позже ждёт его в гостинице, возвращает деньги и объясняет, что храм с синими куполами — склад' },
    { id: 'sashka', name: 'Сашка', role: 'рыжий соседский мальчик лет девяти',
      anchor: 'нахалюга',
      action: 'вымогает у приезжего семь рублей, угрожая поднять крик, и приводит его в комнату соседа' },
    { id: 'rasskazchik', role: 'командированный, идущий ночью к храму с голубыми куполами', acts: false },
    { id: 'odekolonshchik', role: 'небритый сосед Сашки, работающий на одеколонной фабрике', acts: false },
    { id: 'starukha', role: 'старуха с мешком, зазывающая постояльцев на ночлег', acts: false },
    { id: 'kosoglazyj', role: 'худой сутулый косоглазый глухой прохожий', acts: false },
  ],

  phrases: [
    { quote: 'Ночью гулять хорошо, ночью воздух чище. Правда?', speakerId: 'seregin' },
    { quote: 'Вам, гражданин, гулять-то все равно в какую сторону, так вы гуляйте обратно. Договорились?', speakerId: 'seregin' },
    { quote: 'вы человек, по всему видно, приезжий, документиков-то, небось, с собой не захватили?', speakerId: 'seregin' },
    { quote: 'Просят вас по-хорошему, идите назад. Так вы артачитесь.', speakerId: 'seregin' },
    { quote: 'Так это не храм никакой. Склад это. Склад готовой продукции.', speakerId: 'seregin' },
    { quote: 'Завод пиломатериалов арендует помещение. Привозят, знаете, продукцию, сгружают, а потом по базам...', speakerId: 'seregin' },
    { quote: 'Дайте десять рублей, а то вас в тюрьму посадят...', speakerId: 'sashka' },
    { quote: 'А если вы ругаться будете, - невозмутимо перебил нахалюга, - я орать начну.', speakerId: 'sashka' },
    { quote: 'Эх, знали бы вы, дядя, как меня это мучает', speakerId: 'sashka' },
    { quote: 'Он меня с кровати спихивает и на улицу выгоняет, чтобы я деньги ему добыл.', speakerId: 'sashka' },
    { quote: 'Только вы не говорите, что я вас привел, а то он меня убьет... Вы только припугните...', speakerId: 'sashka' },
    { quote: 'Он и вас обманул?! - воскликнул рыжий. - Я-то думал, вы умнее.', speakerId: 'sashka' },
  ],

  hooks: [
    { word: 'нахалюга', rare: true, leadsTo: 'sashka' },           // A
    { word: 'рассверипел', rare: true, leadsTo: 'sashka' },        // A (опечатка автора)
    { word: 'вцепенение', rare: true, leadsTo: 'seregin' },        // A (опечатка автора)
    { word: 'объегорил', rare: true, leadsTo: 'sashka' },          // A
    { word: 'облапошил', rare: true, leadsTo: 'sashka' },          // A
    { word: 'шуруя', rare: true, leadsTo: 'sashka' },              // A
    { word: 'курчавой', rare: true, leadsTo: 'seregin' },          // B
    { word: 'веснушчатое', rare: true, leadsTo: 'seregin' },       // B
    { word: 'артачитесь', rare: true, leadsTo: 'seregin' },        // B
    { word: 'благосклонно', rare: true, leadsTo: 'seregin' },      // B
    { word: 'немигающими', rare: true, leadsTo: 'seregin' },       // B
    { word: 'раздольной', rare: true, leadsTo: 'seregin' },        // B
    { word: 'скоропостижного', rare: true, leadsTo: 'seregin' },   // B
    { word: 'умиротворенный', rare: true, leadsTo: 'seregin' },    // B
    { word: 'взъерошенными', rare: true, leadsTo: 'sashka' },      // B
    { word: 'конопатые', rare: true, leadsTo: 'sashka' },          // B
    { word: 'сосунок', rare: true, leadsTo: 'sashka' },            // B
    { word: 'спихивает', rare: true, leadsTo: 'sashka' },          // B
    { word: 'вопрошающе', rare: true, leadsTo: 'sashka' },         // B
  ],

  relations: [],

  situations: [
    { id: 'arno_mirazhi_s1',
      text: 'В гостинице человек в форме удивил приезжего, объяснив, что величественное здание с синими куполами — вовсе не церковь, а помещение, которое арендует завод пиломатериалов.',
      anchor: 'пиломатериалов', answerId: 'seregin' },             // A
    { id: 'arno_mirazhi_s2',
      text: 'Хозяин комнаты с тахтой, увидев гостя, расхохотался и заметил, что соседский пройдоха и его объегорил.',
      anchor: 'объегорил', answerId: 'sashka' },                   // A
    { id: 'arno_mirazhi_s3',
      text: 'Сосредоточенно шуруя пальцем в носу, малец потребовал у прохожего деньги и пригрозил, что поднимет крик и обвинит его в попытке насилия.',
      anchor: 'шуруя', answerId: 'sashka' },                       // A
    { id: 'arno_mirazhi_s4',
      text: 'Получив семь рублей, мальчишка с тяжёлым вздохом заявил, что деньги якобы нужны его отцу на опохмелку, а иначе тот расправится с ним.',
      anchor: 'опохмелку', answerId: 'sashka' },                   // B
    { id: 'arno_mirazhi_s5',
      text: 'Запыхавшийся усатый человек в форме, с курчавой чёлкой из-под фуражки, сначала ласково уговаривал ночного гуляку повернуть назад, а потом пригрозил задержать его и положил ладонь на рацию.',
      anchor: 'курчавой', answerId: 'seregin' },                   // B
    { id: 'arno_mirazhi_s6',
      text: 'В холле гостиницы человек в форме спал в кресле, вытянув ноги, а когда его потрепали по плечу, мигом вскочил и, поднеся руку к козырьку, отрапортовал о своём звании.',
      anchor: 'козырьку', answerId: 'seregin' },                   // B
    { id: 'arno_mirazhi_s7',
      text: 'Среди ночной улицы рыжий мальчик лет девяти, с взъерошенными волосами и пальцем в ноздре, поинтересовался у прохожего, не видел ли тот его мячик.',
      anchor: 'взъерошенными', answerId: 'sashka' },               // B
  ],
},

{
  id: 'arno_orfografiya',
  author: 'С. И. Арно',
  title: 'Орфография',
  file: 'orfografiya.txt',
  path: 'arno/arno_orfografiya.txt',
  subdir: 'Арно',
  

  characters: [
    { id: 'georgij_ivanovich', name: 'Георгий', patronymic: 'Иванович',
      role: 'пенсионер, бывший работник райкома, убеждённый атеист',
      anchor: 'политанекдотцами',
      action: 'десять лет удит рыбу в Обводном канале, ловит единственную выжившую там рыбку, радуется своей победе, а вскоре умирает: его находят в окне собственной комнаты' },
    { id: 'boris', name: 'Борис',
      role: 'бывший работник морга («упаковщик»), массажист',
      anchor: 'беломорканала',
      action: 'уходит из морга ради живых клиентов, делает массаж соседям и клиентам кооператива, после смерти соседа запирается в его комнате, где до утра слышен ритмичный скрип, а затем возвращается работать с покойниками' },
    { id: 'konstantin_petrovich', name: 'Константин', patronymic: 'Петрович',
      role: 'учитель пения, классный руководитель 5 «б»',
      anchor: 'архатроп',
      action: 'теряет зуб в троллейбусе, идёт к родителям Вовки-американца, попадает на жестокий массаж, возвращает забытый орфографический словарь и встречает на лестнице Колю' },
    { id: 'mariya_nikolaevna', name: 'Мария', patronymic: 'Николаевна',
      role: 'пожилая соседка по коммунальной квартире',
      anchor: 'вежды',
      action: 'любит чай и засыпает на стуле, в троллейбусе выбивает учителю зуб, потом пугает его вставной челюстью и обнаруживает тело умершего Георгия Ивановича' },
    { id: 'vovka_amerikanec', name: 'Вовка-американец',
      role: 'школьник из 5 «б», сын Коли',
      anchor: 'оболтусом',
      action: 'носит за поясом нож, грубит и угрожает соседям; по словам Марии Николаевны, подкладывает ей в стол ампутированные конечности' },
    { id: 'kolya', name: 'Коля',
      role: 'сосед-алкоголик, уроженец Нью-Йорка, учившийся в Кембридже',
      anchor: 'безнесмена',
      action: 'ночует на лестнице, читает учителю стихи и сонет Шекспира, а в конце перестаёт пить и часами слушает стену церкви' },
    { id: 'alkogolina', name: 'Алкоголина',
      role: 'дочь покойного алкоголика, знакомая Бориса',
      anchor: 'бледновата',
      action: 'знакомится с Борисом в морге, заставляет его таскать сумку с кирпичами и бросает его, потому что плечи у него не стали шире' },
    { id: 'petya', name: 'Петя',
      role: '«Петя с живодерни», клиент, которого Борису нашёл бывший одноклассник', acts: false },
    { id: 'iosif', name: 'Иосиф', patronymic: 'Виссарионович',
      role: 'портрет вождя на стене в комнате Георгия Ивановича', acts: false },
    { id: 'filimon', name: 'Филимон',
      role: 'рыжий кот Марии Николаевны', acts: false },
    { id: 'fedor', name: 'Федор',
      role: 'мужчина из молодости Марии Николаевны, щекотавший ей пятки', acts: false },
  ],

  phrases: [
    { quote: 'Когда же вы, Георгий Иванович, согласитесь на оживляющий массаж?', speakerId: 'boris', aboutId: 'georgij_ivanovich' },
    { quote: 'Опять твой папаша лежит, дорогу преграждая', speakerId: 'georgij_ivanovich', aboutId: 'kolya' },
    { quote: 'Я тебе, старая сволочь, вызову! Стекол в суп накидаю', speakerId: 'vovka_amerikanec', aboutId: 'georgij_ivanovich' },
    { quote: 'Я и тебя посажу, если со старыми людьми будешь так разговаривать.', speakerId: 'mariya_nikolaevna', aboutId: 'vovka_amerikanec' },
    { quote: 'Бескультурный ты человек. Никакой культуры нет. Так ведь со взрослыми не разговаривают.', speakerId: 'mariya_nikolaevna', aboutId: 'vovka_amerikanec' },
    { quote: 'Чего вы, Георгий Иванович, на рожон лезете? Делать вам нечего, пили б чай спокойно', speakerId: 'boris', aboutId: 'georgij_ivanovich' },
    { quote: 'Иди ты... Пьянь проклятая... управы на вас нет.', speakerId: 'georgij_ivanovich', aboutId: 'kolya' },
    { quote: 'Разрешите, я пройду, вы мне дорогу загораживаете', speakerId: 'konstantin_petrovich', aboutId: 'kolya' },
    { quote: 'Вот и жизнь наша - орфографический словарь: однообразна, скучна, бессмысленна.', speakerId: 'kolya' },
    { quote: 'А куда ты, читатель, стопы свои направляешь?', speakerId: 'kolya', aboutId: 'konstantin_petrovich' },
    { quote: 'Не нравится мне ее сыпь. Посмотрите, у нее сыпь на бедрах.', speakerId: 'alkogolina' },
    { quote: 'А у вас за две недели ничуточки плечи в ширине не прибавили.', speakerId: 'alkogolina', aboutId: 'boris' },
    { quote: 'Да Георгия Ивановича, помер ведь сегодня, в комнате у себя стынет.', speakerId: 'mariya_nikolaevna', aboutId: 'georgij_ivanovich' },
    { quote: 'Я его бескультурного на помойке застукала, он там конечности по пятницам собирал, поганец', speakerId: 'mariya_nikolaevna', aboutId: 'vovka_amerikanec' },
    { quote: 'Жри, жри, я тебя потом зарежу, мне премию дадут: за каждого кооператора давать будут.', speakerId: 'vovka_amerikanec', aboutId: 'boris' },
    { quote: 'Ну где у тебя бабки-то лежат? Смотрю ты совсем хорош...', speakerId: 'boris', aboutId: 'konstantin_petrovich' },
  ],

  hooks: [
    { word: 'безнесмена', rare: true, leadsTo: 'kolya' },                 // A
    { word: 'внутриизносившегося', rare: true, leadsTo: 'georgij_ivanovich' }, // A
    { word: 'глядений', rare: true, leadsTo: 'georgij_ivanovich' },       // A
    { word: 'Разновеличие', rare: true, leadsTo: 'georgij_ivanovich' },   // A
    { word: 'разноногости', rare: true, leadsTo: 'georgij_ivanovich' },   // A
    { word: 'политанекдотцами', rare: true, leadsTo: 'georgij_ivanovich' }, // A
    { word: 'обескрещенным', rare: true, leadsTo: 'georgij_ivanovich' },  // A
    { word: 'окостенелой', rare: true, leadsTo: 'georgij_ivanovich' },    // A
    { word: 'вежды', rare: true, leadsTo: 'mariya_nikolaevna' },          // A
    { word: 'клоцанье', rare: true, leadsTo: 'mariya_nikolaevna' },       // A
    { word: 'Клоцнув', rare: true, leadsTo: 'mariya_nikolaevna' },        // A
    { word: 'стыришь', rare: true, leadsTo: 'mariya_nikolaevna' },        // A
    { word: 'покедова', rare: true, leadsTo: 'mariya_nikolaevna' },       // A
    { word: 'фуфловые', rare: true, leadsTo: 'mariya_nikolaevna' },       // A
    { word: 'смылила', rare: true, leadsTo: 'mariya_nikolaevna' },        // A
    { word: 'высмаркиваясь', rare: true, leadsTo: 'mariya_nikolaevna' },  // A
    { word: 'залапанного', rare: true, leadsTo: 'mariya_nikolaevna' },    // A
    { word: 'бескультурщик', rare: true, leadsTo: 'vovka_amerikanec' },   // A
    { word: 'бандюга', rare: true, leadsTo: 'vovka_amerikanec' },         // A
    { word: 'неулежчивый', rare: true, leadsTo: 'boris' },                // A
    { word: 'изгалялся', rare: true, leadsTo: 'boris' },                  // A
    { word: 'марафета', rare: true, leadsTo: 'boris' },                   // A
    { word: 'бюллетенил', rare: true, leadsTo: 'boris' },                 // A
    { word: 'разбодяжки', rare: true, leadsTo: 'kolya' },                 // A
    { word: 'архатроп', rare: true, leadsTo: 'konstantin_petrovich' },    // A
    { word: 'археозойский', rare: true, leadsTo: 'konstantin_petrovich' }, // A
    { word: 'исколупанный', rare: true, leadsTo: 'konstantin_petrovich' }, // A
    { word: 'закоулист', rare: true, leadsTo: 'konstantin_petrovich' },   // A
    { word: 'преспокойненько', rare: true, leadsTo: 'konstantin_petrovich' }, // A
    { word: 'бледновата', rare: true, leadsTo: 'alkogolina' },            // A
    { word: 'задиристое', rare: true, leadsTo: 'alkogolina' },            // A
    { word: 'ничуточки', rare: true, leadsTo: 'alkogolina' },             // A
    { word: 'широкоплечих', rare: true, leadsTo: 'alkogolina' },          // B
    { word: 'дерматологу', rare: true, leadsTo: 'alkogolina' },           // B
    { word: 'оболтусом', rare: true, leadsTo: 'vovka_amerikanec' },       // B
    { word: 'балбеса', rare: true, leadsTo: 'vovka_amerikanec' },         // B
    { word: 'обледенелые', rare: true, leadsTo: 'boris' },                // B
    { word: 'беломорканала', rare: true, leadsTo: 'boris' },              // B
    { word: 'тужился', rare: true, leadsTo: 'boris' },                    // B
    { word: 'табуреточку', rare: true, leadsTo: 'georgij_ivanovich' },    // B
    { word: 'каменюкой', rare: true, leadsTo: 'georgij_ivanovich' },      // B
    { word: 'горемыка', rare: true, leadsTo: 'georgij_ivanovich' },       // B
    { word: 'затыльник', rare: true, leadsTo: 'kolya' },                  // B
    { word: 'артачиться', rare: true, leadsTo: 'konstantin_petrovich' },  // B
    { word: 'мужичонка', rare: true, leadsTo: 'fedor' },                  // B
    { word: 'усыпальницу', rare: true, leadsTo: 'filimon' },              // B
    { word: 'ништяк', rare: true, leadsTo: 'mariya_nikolaevna' },         // B
  ],

  relations: [
    { fromId: 'kolya', kind: 'отец', targetName: 'Вовка-американец' },
    { fromId: 'mariya_nikolaevna', kind: 'хозяйка', targetName: 'Филимон' },
    { fromId: 'vovka_amerikanec', kind: 'ученик', targetName: 'Константин Петрович' },
    { fromId: 'boris', kind: 'сосед', targetName: 'Мария Николаевна' },
  ],

  situations: [
    { id: 'arno_orfografiya_s1',
      text: 'Пенсионер-атеист годами сидит у загрязнённого канала ради единственной выжившей рыбки; в день её поимки он с рассвета раскрывает табуреточку и ёрзает, ожидая клёва.',
      anchor: 'табуреточку', answerId: 'georgij_ivanovich' },                   // B
    { id: 'arno_orfografiya_s2',
      text: 'Работник морга, привыкший наводить покойникам марафета, записывается на курсы массажа и начинает тренироваться на умерших.',
      anchor: 'марафета', answerId: 'boris' },                                  // A
    { id: 'arno_orfografiya_s3',
      text: 'Старушка в тесной комнате сначала пугает гостя-учителя новой вставной челюстью, а на прощание бросает ему «покедова» и уверяет, что зуб ему высадила не со злости.',
      anchor: 'покедова', answerId: 'mariya_nikolaevna' },                      // A
    { id: 'arno_orfografiya_s4',
      text: 'Школьный учитель, которому выбили зуб в троллейбусе, на перемене читает словарь и доходит до слова «археозойский».',
      anchor: 'археозойский', answerId: 'konstantin_petrovich' },               // A
    { id: 'arno_orfografiya_s5',
      text: 'Школьник из пятого «б», живущий в коммуналке с отцом-пьяницей, носит за поясом нож и грубит соседям; в тексте о нём сказано слово «бандюга».',
      anchor: 'бандюга', answerId: 'vovka_amerikanec' },                        // A
    { id: 'arno_orfografiya_s6',
      text: 'Девушка, с которой Борис познакомился в морге, заставила его две недели таскать сумку с кирпичами, а расставаясь, заметила, что его плечи не стали шире ни на «ничуточки».',
      anchor: 'ничуточки', answerId: 'alkogolina' },                            // A
    { id: 'arno_orfografiya_s7',
      text: 'Сосед, сидящий на лестнице, выхватывает у учителя словарь, называет жизнь словарём и, возвращая книгу, грозит фингалом «для разбодяжки» однообразия.',
      anchor: 'разбодяжки', answerId: 'kolya' },                                // A
    { id: 'arno_orfografiya_s8',
      text: 'Застрявший в окне покойник застыл с руками, воздетыми к «обескрещенным» куполам церкви, а ночью к нему заходит массажист.',
      anchor: 'обескрещенным', answerId: 'georgij_ivanovich' },                 // A
  ],
},

{
  id: 'arno_tochka',
  author: 'С. И. Арно',
  title: 'Точка',
  file: 'tochka.txt',
  path: 'arno/arno_tochka.txt',
  subdir: 'Арно',
  

  characters: [
    { id: 'davydov', surname: 'Давыдов', role: 'бомбист, живёт с матерью на последнем этаже',
      anchor: 'перхотью',
      action: 'взрывает имущество, которое считает нажитым незаконно, вместе с ветераном отыскивает оружие, соглашается взорвать «последнюю бомбу» в подвале дома напротив и поджигает бикфордов шнур' },
    { id: 'tihon', name: 'Тихон', patronymic: 'Федорович', role: 'ветеран и инвалид войны на протезе, бывший взрывник с экстрасенсорным чутьём',
      anchor: 'сызмальства',
      action: 'помогает Давыдову находить боеприпасы, ищет «главную Точку» планеты, объявляет, что нашёл её в доме напротив, и уговаривает взорвать там последнюю бомбу' },
    { id: 'bocman', name: 'Боцман', role: 'бандит, сосед по лестнице',
      anchor: 'звероподобный',
      action: 'ездит на блестящей машине, служит в шайке бандитов, а во время недельных «запоев» читает всё подряд и плачет над грустными книгами' },
    { id: 'marina', name: 'Марина', role: 'жена Боцмана, живёт на одной лестнице с Давыдовым',
      anchor: 'обворожительного',
      action: 'ухаживает за мужем во время его запоев, отпрашивает его с работы и бегает в магазин за книжками' },
    { id: 'edik', name: 'Эдик', role: 'писатель, кочегар, сосед Давыдова по квартире',
      anchor: 'трудноисчислима',
      action: 'пишет рассказы, которые не печатают, воспитывает себе читателя в Боцмане, а в финале пишет на бумаге слово «ТОЧКА»' },
    { id: 'mat_davydova', role: 'старенькая слепая и глухая мать Давыдова', acts: false },
  ],

  phrases: [
    { quote: 'Пожарищем тянет. Никак запалил чего, сынок?', speakerId: 'mat_davydova', aboutId: 'davydov' },
    { quote: 'Я ж ее, родимую, на Дальнем Востоке искал, а она тут. Вон, в доме напротив.', speakerId: 'tihon' },
    { quote: 'Мы ведь можем с тобой планету обновить, понимаешь?', speakerId: 'tihon' },
    { quote: 'Нужно только разрушить этот грязный мир. И все начнется сначала.', speakerId: 'tihon' },
    { quote: 'Для этого нужно только взорвать последнюю бомбу. Понимаешь?', speakerId: 'tihon' },
    { quote: 'если на этой Точке взорвать бомбу большой мощности, то Точка эта откроется и всосет, как пылесос, всю кожу планеты', speakerId: 'tihon' },
    { quote: 'Народ сейчас только детективную да легкую литературу читает. Ты, Боцман, читатель новой формации.', speakerId: 'edik', aboutId: 'bocman' },
    { quote: 'Только в загадочной России мог появиться такой всеядный читатель. Ты читатель будущего.', speakerId: 'edik', aboutId: 'bocman' },
  ],

  hooks: [
    { word: 'максал', rare: true, leadsTo: 'bocman' },                    // A
    { word: 'неразвращенный', rare: true, leadsTo: 'bocman' },            // A
    { word: 'Потера', rare: true, leadsTo: 'bocman' },                    // A
    { word: 'распоследнем', rare: true, leadsTo: 'davydov' },             // A
    { word: 'довольствии', rare: true, leadsTo: 'davydov' },              // A
    { word: 'слепенькой', rare: true, leadsTo: 'davydov' },               // A
    { word: 'Пожарищем', rare: true, leadsTo: 'davydov' },                // A
    { word: 'трудноисчислима', rare: true, leadsTo: 'edik' },             // A
    { word: 'взрывпакетом', rare: true, leadsTo: 'tihon' },               // A
    { word: 'недоразрушенный', rare: true, leadsTo: 'tihon' },            // A
    { word: 'страстишку', rare: true, leadsTo: 'tihon' },                 // A
    { word: 'Синявинские', rare: true, leadsTo: 'tihon' },                // A
    { word: 'всосет', rare: true, leadsTo: 'tihon' },                     // A
    { word: 'Муху-Цокотуху', rare: true, leadsTo: 'bocman' },             // B
    { word: 'Курочкой', rare: true, leadsTo: 'bocman' },                  // B
    { word: 'слюнявя', rare: true, leadsTo: 'bocman' },                   // B
    { word: 'отъедался', rare: true, leadsTo: 'bocman' },                 // B
    { word: 'звероподобный', rare: true, leadsTo: 'bocman' },             // B
    { word: 'кистень', rare: true, leadsTo: 'bocman' },                   // B
    { word: 'сапожок', rare: true, leadsTo: 'bocman' },                   // B
    { word: 'гаишнику', rare: true, leadsTo: 'bocman' },                  // B
    { word: 'наводчиком', rare: true, leadsTo: 'bocman' },                // B
    { word: 'всеядный', rare: true, leadsTo: 'bocman' },                  // B
    { word: 'формации', rare: true, leadsTo: 'bocman' },                  // B
    { word: 'сызмальства', rare: true, leadsTo: 'tihon' },                // B
    { word: 'протезе', rare: true, leadsTo: 'tihon' },                    // B
    { word: 'осипший', rare: true, leadsTo: 'tihon' },                    // B
    { word: 'бомбочки', rare: true, leadsTo: 'tihon' },                   // B
    { word: 'следопыты', rare: true, leadsTo: 'tihon' },                  // B
    { word: 'ивовую', rare: true, leadsTo: 'tihon' },                     // B
    { word: 'экстрасенсорные', rare: true, leadsTo: 'tihon' },            // B
    { word: 'обворожительного', rare: true, leadsTo: 'marina' },          // B
    { word: 'отпрашивала', rare: true, leadsTo: 'marina' },               // B
    { word: 'перхотью', rare: true, leadsTo: 'davydov' },                 // B
    { word: 'прыщавая', rare: true, leadsTo: 'davydov' },                 // B
    { word: 'бескровной', rare: true, leadsTo: 'davydov' },               // B
    { word: 'самолично', rare: true, leadsTo: 'davydov' },                // B
    { word: 'безвылазно', rare: true, leadsTo: 'davydov' },               // B
    { word: 'кочегаров-писателей', rare: true, leadsTo: 'edik' },         // B
    { word: 'опусы', rare: true, leadsTo: 'edik' },                       // B
  ],

  relations: [
    { fromId: 'davydov', kind: 'напарник', targetName: 'Тихон Федорович' },
    { fromId: 'marina', kind: 'жена', targetName: 'Боцман' },
    { fromId: 'edik', kind: 'сосед по квартире', targetName: 'Давыдов' },
    { fromId: 'tihon', kind: 'поклонник', targetName: 'Марина' },
    { fromId: 'bocman', kind: 'читатель', targetName: 'Эдик' },
  ],

  situations: [
    { id: 'arno_tochka_s1',
      text: 'Бывший взрывник под конец войны из-за собственной неосторожности со взрывпакетом лишился ноги, зато у него открылась способность чувствовать сквозь стены и видеть то, чего не видят другие.',
      anchor: 'взрывпакетом', answerId: 'tihon' },                        // A
    { id: 'arno_tochka_s2',
      text: 'Про бандита сказано, что права он купил, а каждому инспектору просто максал, сколько нужно, и поэтому жил спокойно.',
      anchor: 'максал', answerId: 'bocman' },                             // A
    { id: 'arno_tochka_s3',
      text: 'Ветеран, явившийся с утра в орденах, уверяет напарника, что главное место на планете найдено в доме напротив: если взорвать там очень мощную бомбу, оно, по его теории, всосет оболочку Земли.',
      anchor: 'всосет', answerId: 'tihon' },                              // A
    { id: 'arno_tochka_s4',
      text: 'Бандит в дни недельного «запоя» питается лишь водой и хлебом и читает всё, что попадётся, — от «Братьев Карамазовых» до детских книжек, слюнявя страницы, а над грустным концом плачет навзрыд.',
      anchor: 'слюнявя', answerId: 'bocman' },                            // B
    { id: 'arno_tochka_s5',
      text: 'Писатель, сидящий в подвальной котельной, безуспешно носит издателям новые опусы, подозревает всемирный заговор и воспитывает себе читателя из бандита.',
      anchor: 'опусы', answerId: 'edik' },                                // B
    { id: 'arno_tochka_s6',
      text: 'Подрывник уничтожает чужое имущество, но не людей, и, несмотря на уговоры напарника-ветерана, придерживается бескровной линии.',
      anchor: 'бескровной', answerId: 'davydov' },                        // B
    { id: 'arno_tochka_s7',
      text: 'Жена бандита в дни недельных запоев мужа отпрашивала его с работы, ухаживала за ним и бегала в магазин за книжками.',
      anchor: 'отпрашивала', answerId: 'marina' },                        // B
    { id: 'arno_tochka_s8',
      text: 'Ветеран-инвалид вывозит напарника за город на болота, где копают чёрные следопыты, и, бормоча и вертя в руке ивовую ветку, указывает место, где на третий раз откапывается бомба.',
      anchor: 'ивовую', answerId: 'tihon' },                              // B
  ],
},

{
  id: 'arno_yastvo',
  author: 'С. И. Арно',
  title: 'Яство',
  file: 'yastvo.txt',
  path: 'arno/arno_yastvo.txt',
  subdir: 'Арно',
  

  characters: [
    { id: 'nikolaj', name: 'Николай', role: 'сосед рассказчика по площадке, мужчина лет сорока',
      anchor: 'синеватый',
      action: 'часто заходит к рассказчику и говорит о невесте, которая должна прилететь; накануне Рождества вешается, а позже предстаёт перед рассказчиком в его квартире' },
    { id: 'elizaveta', name: 'Елизавета', patronymic: 'Васильевна', role: 'соседка с нижнего этажа, у которой высшее юридическое образование',
      anchor: 'осиновым',
      action: 'пугает рассказчика рассказами о кладбище под домом, на поминках говорит про кошку и осиновый кол, а накануне Рождества заводит петуха' },
    { id: 'rasskazchik', role: 'рассказчик, автор письма в газету', acts: false },
    { id: 'nevesta', role: 'женщина, назвавшаяся невестой Николая', acts: false },
    { id: 'mertvec', role: 'покойник со свиным рылом, стоящий у двери в подвале', acts: false },
  ],

  phrases: [
    { quote: 'Через него, когда он на столе лежал, кошка перепрыгнула.', speakerId: 'elizaveta', aboutId: 'nikolaj' },
    { quote: 'Надо был его осиновым колом... Перед похоронами...', speakerId: 'elizaveta', aboutId: 'nikolaj' },
    { quote: 'Бросьте вы, Елизавета Васильевна, - возражал я, - у вас ведь высшее юридическое образование', speakerId: 'rasskazchik', aboutId: 'elizaveta' },
    { quote: 'Я невеста вашего соседа Николая, - сказала она. - Я только что прилетела, а его нет.', speakerId: 'nevesta', aboutId: 'nikolaj' },
    { quote: 'Откройте, пожалуйста, - донесся приятный женский голос.', speakerId: 'nevesta' },
    { quote: 'А ты и есть яство, - вдруг пробормотал мертвец, от двери бросив на меня равнодушный взгляд.', speakerId: 'mertvec', aboutId: 'rasskazchik' },
    { quote: 'Надеюсь, Ваша газета надавит на Московский райисполком, и мне улучшат жилищные условия', speakerId: 'rasskazchik' },
  ],

  hooks: [
    { word: 'упомнил', rare: true, leadsTo: 'nikolaj' },          // A
    { word: 'зашикали', rare: true, leadsTo: 'nikolaj' },         // B
    { word: 'синеватый', rare: true, leadsTo: 'nikolaj' },        // B
    { word: 'обреченное', rare: true, leadsTo: 'nikolaj' },       // B
    { word: 'гвалт', rare: true, leadsTo: 'nikolaj' },            // B
    { word: 'осиновым', rare: true, leadsTo: 'elizaveta' },       // B
    { word: 'подкараулив', rare: true, leadsTo: 'elizaveta' },    // B
    { word: 'доверительно', rare: true, leadsTo: 'elizaveta' },   // B
    { word: 'поманила', rare: true, leadsTo: 'elizaveta' },       // B
    { word: 'озираясь', rare: true, leadsTo: 'elizaveta' },       // B
    { word: 'примерещился', rare: true, leadsTo: 'elizaveta' },   // B
    { word: 'юридическое', rare: true, leadsTo: 'elizaveta' },    // B
  ],

  relations: [
    { fromId: 'nikolaj', kind: 'сосед', targetName: 'Елизавета Васильевна' },
    { fromId: 'elizaveta', kind: 'соседка', targetName: 'Николай' },
  ],

  situations: [
    { id: 'arno_yastvo_s1',
      text: 'Сосед рассказчика по площадке, в чьём лице было что-то странное и обреченное, часто говорил о невесте, которая должна прилететь, а через год накануне Рождества покончил с собой.',
      anchor: 'обреченное', answerId: 'nikolaj' },                 // B
    { id: 'arno_yastvo_s2',
      text: 'Когда в квартиру пришла женщина, назвавшаяся невестой соседа, из комнаты на рассказчика с вытянутыми руками двинулся бледный умерший сосед, а глаза его излучали синеватый свет.',
      anchor: 'синеватый', answerId: 'nikolaj' },                  // B
    { id: 'arno_yastvo_s3',
      text: 'Соседка с нижнего этажа, подкараулив рассказчика на лестнице, шёпотом пугала его, что дом стоит на месте бывшего кладбища и что в подвале живёт нечистая сила.',
      anchor: 'подкараулив', answerId: 'elizaveta' },              // B
    { id: 'arno_yastvo_s4',
      text: 'После поминок соседка отозвала рассказчика в сторону и, озираясь, сообщила, что через лежавшего на столе покойника перепрыгнула кошка и что на него следовало применить кол из осины.',
      anchor: 'озираясь', answerId: 'elizaveta' },                 // B
  ],
},
{
  id: 'afanasyev_princessa_i_chudovishche',
  author: 'Р. С. Афанасьев',
  title: 'Принцесса и Чудовище (фрагмент)',
  file: 'princessa_i_chudovishche.txt',
  path: 'afanasyev/afanasyev_princessa_i_chudovishche.txt',
  subdir: 'Афанасьев',
  

  characters: [
    { id: 'bertar', name: 'Бертар', surname: 'Борфейм',
      role: 'герцог Северных Гор, второй сын короля Гриенора',
      anchor: 'Гриенора',
      action: 'едет в тяжёлом экипаже по горной дороге к столице и просит племянницу рассказать ему историю, чтобы скоротать путь' },
    { id: 'vellanor', name: 'Вэлланор', surname: 'Борфейм',
      role: 'племянница герцога, будущая жена короля Ривастана',
      anchor: 'Неприбранные',
      action: 'едет с дядей в столицу и рассказывает ему древнее сказание о воине, захватившем гномье княжество' },
    { id: 'geordor', name: 'Геордор',
      role: 'король Ривастана',
      anchor: 'кудесник',
      action: 'в опочивальне ждёт приезда невесты, выслушивает тревожные вести советника и приказывает отправить навстречу ей графа Сигмона' },
    { id: 'ermin', name: 'Эрмин', surname: 'Де Грилл',
      role: 'граф, друг и советник короля',
      anchor: 'птах',
      action: 'предупреждает короля, что кто-то настраивает толпу против невесты, и отправляет Сигмона навстречу ей' },
    { id: 'sigmon', name: 'Сигмон', surname: 'Ла Тойя',
      role: 'граф, королевский гонец, тайный подручный советника',
      anchor: 'брыжи',
      action: 'на приёме следит за двумя юношами и предотвращает их дуэль на берегу реки, притворившись неуклюжим и упав на спину' },
    { id: 'evetta', name: 'Эветта', surname: 'Брок',
      role: 'графиня, вдова, хозяйка приёмов',
      anchor: 'клавесина',
      action: 'устраивает в своём особняке на берегу реки приёмы, на которые собирается столичная знать' },
    { id: 'farel', name: 'Фарел', surname: 'Верони',
      role: 'единственный сын графа Верони, юный щёголь',
      anchor: 'завзятым',
      action: 'выходит ночью на поляну над рекой, чтобы драться с Лавеном, но после падения Сигмона смеётся и уходит с ним в танцевальный зал' },
    { id: 'laven', name: 'Лавен', surname: 'Летто',
      role: 'младший из отпрысков лорда Летто',
      anchor: 'отпрысков',
      action: 'выходит на поляну к реке драться с Фарелом, выхватывает клинок на вмешавшегося Сигмона, смеётся над его падением и уходит; позже находят труп, опознанный как Лавен Летто' },
    { id: 'kord', name: 'Корд', surname: 'Демистон',
      role: 'капитан городской стражи Рива',
      anchor: 'прачечную',
      action: 'ночью разбирает бумаги в кабинете дозорной башни, а услышав от вестового о найденном трупе, запирает кабинет и спускается по лестнице' },
    { id: 'grienor', name: 'Гриенор', surname: 'Борфейм', role: 'король, отец Бертара', acts: false },
    { id: 'tarlin', name: 'Тарлин', role: 'старший брат Бертара, отец Вэлланор', acts: false },
    { id: 'talar', name: 'Талар', surname: 'Бофрейм', role: 'герой древней легенды', acts: false },
    { id: 'vog', name: 'Вог', role: 'мастер, поставщик свечей королевского двора Тарима', acts: false },
    { id: 'teofis', name: 'Теофис', role: 'глава коллегии магов, покинувшей королевство', acts: false },
    { id: 'darion', name: 'Дарион', role: 'молодой маг, предан королю', acts: false },
    { id: 'brok', name: 'Брок', role: 'покойный муж Эветты, смотритель королевских залов', acts: false },
    { id: 'goran', name: 'Горан', role: 'второй капитан стражи, делит кабинет с Кордом', acts: false },
    { id: 'saven', name: 'Савен', role: 'человек из прежней службы Корда в Ташаме', acts: false },
    { id: 'zimer', name: 'Зимер', role: 'лейтенант стражи', acts: false },
    { id: 'vestovoy', role: 'юный вестовой стражи', acts: false },
  ],

  phrases: [
    { quote: 'Иди сюда, поговори со стариком. Проклятая дорога не дает мне заснуть.', speakerId: 'bertar' },
    { quote: 'Дядюшка, вы опять назвали меня принцессой', speakerId: 'vellanor' },
    { quote: 'Это долг королевской семьи - заботиться о королевстве.', speakerId: 'bertar' },
    { quote: 'Я чувствую себя лет на двадцать моложе.', speakerId: 'geordor' },
    { quote: 'У меня еще есть шанс ярко вспыхнуть перед закатом.', speakerId: 'geordor' },
    { quote: 'Вэлланор Борфейм скоро будет здесь, и я должен встретить ее как подобает королю', speakerId: 'geordor', aboutId: 'vellanor' },
    { quote: 'Теофис окончательно потерял чувство меры, и взбаламутил всю свою магическую братию.', speakerId: 'geordor', aboutId: 'teofis' },
    { quote: 'Зато остался Дарион, - этот юнец, из которого вырастет настоящий маг', speakerId: 'geordor', aboutId: 'darion' },
    { quote: 'Плевать на все придворные дела, пусть займется настоящей работой.', speakerId: 'geordor', aboutId: 'sigmon' },
    { quote: 'Пусть вырежет хоть все восточное герцогство', speakerId: 'geordor', aboutId: 'sigmon' },
    { quote: 'Многим не нравиться то, что ты собрался обзавестись наследником.', speakerId: 'ermin' },
    { quote: 'Толпу явно кто-то настраивает против принцессы.', speakerId: 'ermin', aboutId: 'vellanor' },
    { quote: 'Если что-то пойдет не так, то ему будет проще вырезать целый город', speakerId: 'ermin', aboutId: 'sigmon' },
    { quote: 'Подумайте, в какое положение вы ставите хозяйку дома.', speakerId: 'sigmon', aboutId: 'evetta' },
    { quote: 'Попрошу выплатить ставку королевского шута', speakerId: 'sigmon' },
    { quote: 'Вечер испорчен, так попробуем наверстать упущенное в танцевальном зале.', speakerId: 'farel' },
    { quote: 'Это не ваше дело и не лезьте в него, проклятый шпик!', speakerId: 'laven' },
    { quote: 'Лейтенант Зимер докладывает о происшествии!', speakerId: 'vestovoy', aboutId: 'zimer' },
  ],

  hooks: [
    { word: 'Бофрейме', rare: true, leadsTo: 'vellanor' },        // A
    { word: 'Дарелена', rare: true, leadsTo: 'sigmon' },          // A
    { word: 'вертелами', rare: true, leadsTo: 'sigmon' },         // A
    { word: 'брыжи', rare: true, leadsTo: 'sigmon' },             // A
    { word: 'Гриенора', rare: true, leadsTo: 'bertar' },          // A
    { word: 'Вога', rare: true, leadsTo: 'bertar' },              // A
    { word: 'Сеговаров', rare: true, leadsTo: 'geordor' },        // A
    { word: 'самострел', rare: true, leadsTo: 'geordor' },        // A
    { word: 'Ташаме', rare: true, leadsTo: 'kord' },              // A
    { word: 'баламутит', rare: true, leadsTo: 'ermin' },          // A
    { word: 'Веселая Вдова', rare: true, leadsTo: 'evetta' },     // A
    { word: 'клавесина', rare: true, leadsTo: 'evetta' },         // A
    { word: 'цирюльником', rare: true, leadsTo: 'geordor' },      // B
    { word: 'кудесник', rare: true, leadsTo: 'geordor' },         // B
    { word: 'вертеп', rare: true, leadsTo: 'geordor' },           // B
    { word: 'птах', rare: true, leadsTo: 'ermin' },               // B
    { word: 'сердцеед', rare: true, leadsTo: 'farel' },           // B
    { word: 'завзятым', rare: true, leadsTo: 'farel' },           // B
    { word: 'потасовками', rare: true, leadsTo: 'laven' },        // B
    { word: 'отпрысков', rare: true, leadsTo: 'laven' },          // B
    { word: 'интрижках', rare: true, leadsTo: 'evetta' },         // B
    { word: 'прачечную', rare: true, leadsTo: 'kord' },           // B
    { word: 'прачек', rare: true, leadsTo: 'kord' },              // B
    { word: 'отрапортовал', rare: true, leadsTo: 'kord' },        // B
    { word: 'горных белок', rare: true, leadsTo: 'vellanor' },    // B
  ],

  relations: [
    { fromId: 'vellanor', kind: 'племянница', targetName: 'Бертар Борфейм' },
    { fromId: 'bertar', kind: 'сын', targetName: 'Гриенора Борфейма' },
    { fromId: 'geordor', kind: 'жених', targetName: 'Вэлланор Борфейм' },
    { fromId: 'ermin', kind: 'друг и советник', targetName: 'Геордор' },
    { fromId: 'sigmon', kind: 'подчинённый', targetName: 'Эрмин Де Грилл' },
    { fromId: 'kord', kind: 'напарник по кабинету', targetName: 'Горан' },
  ],

  situations: [
    { id: 'princessa_i_chudovishche_s1',
      text: 'После стычки в саду графу с трудом удаётся унять дрожь в руках: притворяться шутом тому, кого прозвали мясником Дарелена, нелегко.',
      anchor: 'Дарелена', answerId: 'sigmon' },                  // A
    { id: 'princessa_i_chudovishche_s2',
      text: 'Скучающий на приёме столичный шпик, которого все принимают за провинциального неудачника, наблюдает за модниками, чьи тонкие клинки простой люд прозвал вертелами.',
      anchor: 'вертелами', answerId: 'sigmon' },                 // A
    { id: 'princessa_i_chudovishche_s3',
      text: 'Советник докладывает королю, что кто-то баламутит толпу, настраивая её против будущей королевы из Тарима, и опасается провокаций.',
      anchor: 'баламутит', answerId: 'ermin' },                  // A
    { id: 'princessa_i_chudovishche_s4',
      text: 'Перед сном король прячет руку под подушку, где лежит самострел, заряженный отравленными иглами: холодная рукоять успокаивает его лучше снотворных зелий.',
      anchor: 'самострел', answerId: 'geordor' },                // A
    { id: 'princessa_i_chudovishche_s5',
      text: 'Чтобы скоротать путь, девушка рассказывает дяде древнее сказание об одиноком воине Бофрейме, захватившем гномье княжество.',
      anchor: 'Бофрейме', answerId: 'vellanor' },                // A
    { id: 'princessa_i_chudovishche_s6',
      text: 'Дорожный фонарь освещает экипаж герцога свечой от придворного мастера Вога, но герцог считает такой свет лишь тусклым огоньком посреди тьмы.',
      anchor: 'Вога', answerId: 'bertar' },                      // A
    { id: 'princessa_i_chudovishche_s7',
      text: 'Король отказывается снова подниматься в тесную башенную комнату для тайных разговоров и дарит её советнику, предлагая устроить там вертеп.',
      anchor: 'вертеп', answerId: 'geordor' },                   // B
    { id: 'princessa_i_chudovishche_s8',
      text: 'Король с бородой, подстриженной цирюльником, любуется в зеркале своим профилем и спрашивает друга, годен ли ещё в женихи.',
      anchor: 'цирюльником', answerId: 'geordor' },              // B
    { id: 'princessa_i_chudovishche_s9',
      text: 'Единственный сын графа, светловолосый щёголь шестнадцати лет, уже прославился как сердцеед; ночью он выходит на поляну над рекой драться с сыном богатого лорда, но дело кончается смехом.',
      anchor: 'сердцеед', answerId: 'farel' },                   // B
    { id: 'princessa_i_chudovishche_s10',
      text: 'Широкоплечий силач, младший сын одного из богатейших лордов, известный потасовками в тавернах, выхватывает узкий клинок против незваного свидетеля стычки, а потом хохочет вместе с соперником.',
      anchor: 'потасовками', answerId: 'laven' },               // B
    { id: 'princessa_i_chudovishche_s11',
      text: 'Графиня, потерявшая немолодого мужа пять лет назад и охотно принимающая у себя столичную знать, осведомлена обо всех тайных интрижках.',
      anchor: 'интрижках', answerId: 'evetta' },                 // B
    { id: 'princessa_i_chudovishche_s12',
      text: 'Ночью начальник стражи никак не может свести счёт за стирку формы и мельком подозревает, что кто-то из прачек позарился на штаны стражника.',
      anchor: 'прачек', answerId: 'kord' },                      // B
    { id: 'princessa_i_chudovishche_s13',
      text: 'Под утро в башню стражи прибежал запыхавшийся шестнадцатилетний вестовой и, отдышавшись, отрапортовал капитану, что после приёма в особняке найден труп молодого дворянина.',
      anchor: 'отрапортовал', answerId: 'kord' },               // B
  ],
},

{
  id: 'afanasyev_klevyj_kot',
  author: 'Р. С. Афанасьев',
  title: 'Клевый кот',
  file: 'klevyj_kot.txt',
  path: 'afanasyev/afanasyev_klevyj_kot.txt',
  subdir: 'Афанасьев',
  

  characters: [
    { id: 'kuzmich', name: 'Иван', patronymic: 'Кузьмич', surname: 'Гаркулев',
      role: 'пенсионер, живущий один в однокомнатной квартире',
      anchor: 'череззаборным',
      action: 'подбирает белого кота, находит деньги, ходит с котом к метро, где прохожие дают на корм, и соглашается сняться в рекламе' },
    { id: 'krim', name: 'Крим',
      role: 'белый кот с чёрным «галстуком» на шее',
      anchor: 'галстучек',
      action: 'приносит хозяину деньги, а в финале оказывается котом из другого мира и рассказывает подруге, как вернулся домой через врата' },
    { id: 'semenych', name: 'Егор', patronymic: 'Семенович', surname: 'Мальштейн',
      role: 'школьный учитель физики и изобретатель, сосед Кузьмича',
      anchor: 'Реникса',
      action: 'выслушивает историю о найденных деньгах, советует проверить её опытом, а позже, по рассказу кота, строит кошачьи врата' },
    { id: 'mashka', name: 'Машка',
      role: 'девица лет тридцати из второго подъезда',
      anchor: 'смазлива',
      action: 'видит кота у ларька и отдаёт старику сотню на корм' },
    { id: 'petrovsky', name: 'Леон', patronymic: 'Мастроянович', surname: 'Петровский',
      role: 'режиссёр',
      anchor: 'молодчик',
      action: 'увидев драку у ларьков, восхищается котом и предлагает пенсионеру сняться в рекламе кошачьего корма' },
    { id: 'komar', name: 'Комар',
      role: 'парень в спортивном костюме из компании налётчиков',
      anchor: 'навар',
      action: 'вместе с двумя подельниками нападает на старика у ларька и требует выручку' },
    { id: 'mira', name: 'Мира',
      role: 'кошка, подруга Крима',
      anchor: 'старазами',
      action: 'слушает рассказ Крима о его путешествии и радуется ящику с валерьянкой' },
    { id: 'doch', role: 'дочь Кузьмича, живущая на севере', acts: false },
    { id: 'patrulny', role: 'патрульный милиционер, давший коту сотню', acts: false },
    { id: 'sisima', name: 'Сисима', role: 'знакомый Крима, которому тот собирается звонить', acts: false },
    { id: 'torch', name: 'Торч', role: 'знакомый Крима, которому тот собирается звонить', acts: false },
  ],

  phrases: [
    { quote: 'Ну заходи, бродяга - сказал он. - Пошли в гости.', speakerId: 'kuzmich', aboutId: 'krim' },
    { quote: 'Дядь Вань, вы его хоть кормите? Впрочем, куда там... Погодите...', speakerId: 'mashka', aboutId: 'kuzmich' },
    { quote: 'Вот - сказала она протягивая деньги Гаркулеву - купите ему Вискас! Или что там еще...', speakerId: 'mashka', aboutId: 'krim' },
    { quote: 'Берите, берите - настаивала она - Покормите котика.', speakerId: 'mashka', aboutId: 'krim' },
    { quote: 'Тут без науки никак. Нужен этот, мать его растак, научный анализ...', speakerId: 'kuzmich' },
    { quote: 'Кот тут совершенно не при чем. Это тебе только кажется...', speakerId: 'semenych', aboutId: 'krim' },
    { quote: 'Появление этого кота могло нарушить тонкие причинно-следственные связи и привести к данному эффекту.', speakerId: 'semenych', aboutId: 'krim' },
    { quote: 'замечательный у тебя Кот. Очень правильный кот. Чудесный кот! Береги его...', speakerId: 'semenych', aboutId: 'krim' },
    { quote: 'Иди говорю на улицу и проверь, найдутся ли еще деньги.', speakerId: 'semenych', aboutId: 'kuzmich' },
    { quote: 'Гони навар, дедуля - насмешливо сказал тот, что был в костюме.', speakerId: 'komar', aboutId: 'kuzmich' },
    { quote: 'Какой замечательный кот! - Продолжал восхищаться незнакомец.', speakerId: 'petrovsky', aboutId: 'krim' },
    { quote: 'Вы не хотели бы сняться в рекламе? Все будет очень пристойно - ролик про кошачий корм.', speakerId: 'petrovsky', aboutId: 'kuzmich' },
    { quote: 'Но как же ты вернулся? Я беспокоилась о тебе, ведь заклинание работает только в одну сторону...', speakerId: 'mira', aboutId: 'krim' },
    { quote: 'Мне ничего не стоило внушить ему принципиальную схему кошачьих врат.', speakerId: 'krim', aboutId: 'semenych' },
    { quote: 'Врата работают только один раз. После того как я сквозь них прошел, больше они не запустятся.', speakerId: 'krim' },
  ],

  hooks: [
    { word: 'череззаборным', rare: true, leadsTo: 'kuzmich' },       // A
    { word: 'комунналка', rare: true, leadsTo: 'kuzmich' },          // A
    { word: 'яишню', rare: true, leadsTo: 'kuzmich' },               // A
    { word: 'дешовке', rare: true, leadsTo: 'kuzmich' },             // A
    { word: 'пробованого', rare: true, leadsTo: 'kuzmich' },         // A
    { word: 'забарахлившем', rare: true, leadsTo: 'kuzmich' },       // A
    { word: 'нужон', rare: true, leadsTo: 'kuzmich' },               // A
    { word: 'Реникса', rare: true, leadsTo: 'semenych' },            // A
    { word: 'Нонсес', rare: true, leadsTo: 'semenych' },             // A
    { word: 'тянуще', rare: true, leadsTo: 'semenych' },             // A
    { word: 'чурачился', rare: true, leadsTo: 'semenych' },          // A
    { word: 'галстучек', rare: true, leadsTo: 'krim' },              // A
    { word: 'мякнувшего', rare: true, leadsTo: 'krim' },             // A
    { word: 'забалансировал', rare: true, leadsTo: 'krim' },         // A
    { word: 'Сисиме', rare: true, leadsTo: 'krim' },                 // A
    { word: 'Торчу', rare: true, leadsTo: 'krim' },                  // A
    { word: 'Одноглазому', rare: true, leadsTo: 'krim' },            // A
    { word: 'Мирармена', rare: true, leadsTo: 'mira' },              // A
    { word: 'старазами', rare: true, leadsTo: 'mira' },              // A
    { word: 'Тифа', rare: true, leadsTo: 'mira' },                   // A
    { word: 'слаба на передок', rare: true, leadsTo: 'mashka' },     // A
    { word: 'шепеляво', rare: true, leadsTo: 'kuzmich' },            // B
    { word: 'попрошайкой', rare: true, leadsTo: 'kuzmich' },         // B
    { word: 'волчьей ягоды', rare: true, leadsTo: 'kuzmich' },       // B
    { word: 'Изыди', rare: true, leadsTo: 'semenych' },              // B
    { word: 'проставится', rare: true, leadsTo: 'semenych' },        // B
    { word: 'нобелевку', rare: true, leadsTo: 'semenych' },          // B
    { word: 'ромбик', rare: true, leadsTo: 'krim' },                 // B
    { word: 'котяре', rare: true, leadsTo: 'krim' },                 // B
    { word: 'валерьянкой', rare: true, leadsTo: 'krim' },            // B
    { word: 'кошара', rare: true, leadsTo: 'mashka' },               // B
    { word: 'писклявый', rare: true, leadsTo: 'mashka' },            // B
    { word: 'смазлива', rare: true, leadsTo: 'mashka' },             // B
    { word: 'зацокала', rare: true, leadsTo: 'mashka' },             // B
    { word: 'типаж', rare: true, leadsTo: 'petrovsky' },             // B
    { word: 'молодчик', rare: true, leadsTo: 'petrovsky' },          // B
  ],

  relations: [
    { fromId: 'semenych', kind: 'сосед', targetName: 'Иван Кузьмич' },
    { fromId: 'kuzmich', kind: 'сосед', targetName: 'Мальштейн' },
    { fromId: 'mashka', kind: 'соседка', targetName: 'Дядь Вань' },
    { fromId: 'krim', kind: 'подруга', targetName: 'Мира' },
    { fromId: 'mira', kind: 'друг', targetName: 'Крим' },
  ],

  situations: [
    { id: 'klevyj_kot_s1',
      text: 'Потянувшись погладить бродячего кота у подъезда, старик прихватывает поясницу, валится в кусты и награждает животное череззаборным ругательством, а потом видит перед самым носом сотенную купюру.',
      anchor: 'череззаборным', answerId: 'kuzmich' },                 // A
    { id: 'klevyj_kot_s2',
      text: 'Выслушав рассказ о находках денег, школьный физик сперва отмахивается словом Реникса, а потом, налив по второй, допускает, что появление кота могло нарушить какие-то тонкие связи причин и следствий.',
      anchor: 'Реникса', answerId: 'semenych' },                      // A
    { id: 'klevyj_kot_s3',
      text: 'Красавица-кошка, возлежащая на алой подушке в жилетке, украшенной синими старазами, просит друга продолжить рассказ о его путешествии.',
      anchor: 'старазами', answerId: 'mira' },                        // A
    { id: 'klevyj_kot_s4',
      text: 'Вырвавшись из рук старика и обрадовавшись очередной находке, белый кот сам взбирается ему на плечо и, когда тот выпрямился, забалансировал там, щекоча хвостом нос.',
      anchor: 'забалансировал', answerId: 'krim' },                    // A
    { id: 'klevyj_kot_s5',
      text: 'Накрашенная девица из второго подъезда, худая как вобла, суёт старику в руку сотню на корм коту и краснеет, запнувшись на полуслове.',
      anchor: 'вобла', answerId: 'mashka' },                          // B
    { id: 'klevyj_kot_s6',
      text: 'У ларька налётчик в спортивном костюме требует с пенсионера навар, но напарник в кожанке предлагает вместо денег просто забрать кота.',
      anchor: 'навар', answerId: 'komar' },                           // B
    { id: 'klevyj_kot_s7',
      text: 'Бледный худой человек, наблюдавший за арестом налётчиков, восхищается котом, говорит старику, что тот подходит ему как типаж, и зовёт сняться в ролике.',
      anchor: 'типаж', answerId: 'petrovsky' },                       // B
    { id: 'klevyj_kot_s8',
      text: 'Когда питомец гостя, спрыгнув на стол, опрокидывает пустые колбочки, хозяин квартиры-лаборатории с воплем «Изыди!» бросается ловить его, а листы бумаги разлетаются по полу.',
      anchor: 'Изыди', answerId: 'semenych' },                        // B
    { id: 'klevyj_kot_s9',
      text: 'Уходя с недопитой бутылкой, пенсионер не жалеет остатка: знает, что хозяин, если выпьет его один, всё равно проставится.',
      anchor: 'проставится', answerId: 'semenych' },                  // B
    { id: 'klevyj_kot_s10',
      text: 'Окружённый стайкой первокурсниц у метро, пенсионер с котом на руках приходит в себя, когда девчонки уже убежали, а в руках у него оказываются смятые десятки.',
      anchor: 'первокурсниц', answerId: 'kuzmich' },                  // B
    { id: 'klevyj_kot_s11',
      text: 'В финале кот открывает перед подругой решётчатую дверцу ящика, забитого пузырьками с валерьянкой, и та бросается ему на шею.',
      anchor: 'валерьянкой', answerId: 'krim' },                      // B
    { id: 'klevyj_kot_s12',
      text: 'Получивший пенсию старик, которому денег хватит лишь на макароны через день, хмуро бредёт мимо кустов волчьей ягоды, не обращая внимания на осенние краски.',
      anchor: 'волчьей', answerId: 'kuzmich' },                       // B
  ],
},

{
  id: 'afanasyev_kotenok',
  author: 'Р. С. Афанасьев',
  title: 'Котёнок',
  file: 'kotenok.txt',
  path: 'afanasyev/afanasyev_kotenok.txt',
  subdir: 'Афанасьев',
  

  characters: [
    { id: 'artur', name: 'Артур', role: 'котёнок из клана Меченых, ученик Ланселота',
      anchor: 'наискосок',
      action: 'уходит из родного подвала с чёрным котом-наставником, учится у него, а после его гибели ослепляет убившего его пса' },
    { id: 'lanselot', name: 'Ланселот', role: 'чёрный кот, рыцарь клана Черных, наставник Артура',
      anchor: 'вертнулся',
      action: 'забирает Артура из подвала, учит его и погибает в схватке с огромным псом' },
    { id: 'merlin', name: 'Мерлин', role: 'чёрный маг, дальний родственник Ланселота',
      anchor: 'потрескивала',
      action: 'приходит на чердак и рассказывает Артуру о мире, врагах и друзьях котов' },
    { id: 'karl', name: 'Карл', role: 'легендарный чёрный маг из рассказа Мерлина', acts: false },
    { id: 'mama', role: 'мать Артура', acts: false },
    { id: 'otec', role: 'отец Артура', acts: false },
  ],

  phrases: [
    { quote: 'и я поведу тебя в мир. Утром я приду за тобой, когда огненный шар коснется земли.', speakerId: 'lanselot' },
    { quote: 'Ты пойдешь с этим бойцом из клана Черных и оставишь свой дом.', speakerId: 'mama', aboutId: 'lanselot' },
    { quote: 'Прыгай, котенок! - повторил гость, не оборачиваясь.', speakerId: 'lanselot' },
    { quote: 'Я - боец! - с обидой крикнул я, рванувшись к цели.', speakerId: 'artur' },
    { quote: 'Артур! - крикнул мне мой наставник, спустившийся с дерева. - Не уходи далеко, скоро пойдем домой.', speakerId: 'lanselot' },
  ],

  hooks: [
    { word: 'Меченых', rare: true, leadsTo: 'artur' },        // A
    { word: 'Белоусых', rare: true, leadsTo: 'lanselot' },    // A
    { word: 'пятерней', rare: true, leadsTo: 'artur' },       // B
    { word: 'встопорщил', rare: true, leadsTo: 'artur' },     // B
    { word: 'шкирку', rare: true, leadsTo: 'lanselot' },      // B
    { word: 'загаженному', rare: true, leadsTo: 'merlin' },   // B
    { word: 'отщепенцев', rare: true, leadsTo: 'merlin' },    // B
    { word: 'пресмыкаются', rare: true, leadsTo: 'merlin' },  // B
  ],

  relations: [
    { fromId: 'lanselot', kind: 'наставник', targetName: 'Артур' },
    { fromId: 'merlin', kind: 'дальний родственник', targetName: 'Лансу' },
  ],

  situations: [
    { id: 'afanasyev_kotenok_s1',
      text: 'Незнакомый чёрный кот церемонно присел рядом с матерью котёнка, обернув лапы хвостом, — так, как подобало бы вести себя воспитанному кавалеру.',
      anchor: 'кавалеру', answerId: 'lanselot' },                       // B
    { id: 'afanasyev_kotenok_s2',
      text: 'Забравшись на камень, малыш закрутился на месте, стараясь выполнить любимый боевой приём своего учителя — «Юлу».',
      anchor: 'Юлу', answerId: 'artur' },                              // A
    { id: 'afanasyev_kotenok_s3',
      text: 'Вечером на чердак пришёл дальний родственник наставника — маленький чёрный колдун с огромными жёлтыми глазами, чья шерсть слегка искрилась от разрядов.',
      anchor: 'разрядов', answerId: 'merlin' },                        // B
    { id: 'afanasyev_kotenok_s4',
      text: 'Серый котёнок важно вскинул мордочку, чтобы показать матери родовую отметину, давшую имя всему его клану.',
      anchor: 'отметину', answerId: 'artur' },                         // B
    { id: 'afanasyev_kotenok_s5',
      text: 'Когда огромный пёс, убивший наставника, клацнул челюстями, юный кот метнулся вбок, встал на задние лапы и ударами лап ослепил зверя, отомстив за учителя.',
      anchor: 'клацнул', answerId: 'artur' },                         // B
    { id: 'afanasyev_kotenok_s6',
      text: 'В схватке с огромным псом чёрный кот ловко запрыгнул ему на загривок и вонзил когти в уши.',
      anchor: 'загривок', answerId: 'lanselot' },                      // B
  ],
},

{
  id: 'afanasyev_oduvanchiki',
  author: 'Р. С. Афанасьев',
  title: 'Одуванчики',
  file: 'oduvanchiki.txt',
  path: 'afanasyev/afanasyev_oduvanchiki.txt',
  subdir: 'Афанасьев',
  

  characters: [
    { id: 'sergej', name: 'Сергей', role: 'бывший студент и грузчик, которого каждую весну преследуют одуванчики',
      anchor: 'корвалола',
      action: 'готовится к ночному приходу цветов, отбивается от них ножом и приходит в себя привязанным в больничной палате' },
    { id: 'oduvanchiki', role: 'цветы с золотыми глазами, приходящие к Сергею по ночам', acts: false },
    { id: 'psihiatr', role: 'новый психиатр, положивший Сергея на обследование', acts: false },
    { id: 'pop', role: 'подвыпивший священник районной церкви', acts: false },
    { id: 'medsestra', role: 'медсестра, нашедшая под утро пустую койку', acts: false },
  ],

  phrases: [],

  hooks: [
    { word: 'уставивший', rare: true, leadsTo: 'sergej' },       // A (опечатка автора)
    { word: 'пореза', rare: true, leadsTo: 'sergej' },           // A (опечатка автора)
    { word: 'расплавившимся', rare: true, leadsTo: 'sergej' },   // A
    { word: 'побелку', rare: true, leadsTo: 'sergej' },          // B
    { word: 'уклоняется', rare: true, leadsTo: 'sergej' },       // B
    { word: 'канцелярский', rare: true, leadsTo: 'sergej' },     // B
    { word: 'чиркнул', rare: true, leadsTo: 'sergej' },          // B
  ],

  relations: [],

  situations: [
    { id: 'afanasyev_oduvanchiki_s1',
      text: 'Каждую весну у парня обостряется болезнь, и ему снова приходится идти в диспансер за успокоительными таблетками.',
      anchor: 'диспансер', answerId: 'sergej' },                    // B
    { id: 'afanasyev_oduvanchiki_s2',
      text: 'В полной темноте к его кровати подбирались светящиеся цветы и шептали что-то непонятное, похожее на заклинанья, а он отгонял их взглядом.',
      anchor: 'заклинанья', answerId: 'sergej' },                   // A
    { id: 'afanasyev_oduvanchiki_s3',
      text: 'Очнувшись в пустой комнате, парень обнаружил, что накрепко пристёгнут к кровати ремнями, и тихо заплакал.',
      anchor: 'ремнями', answerId: 'sergej' },                      // B
    { id: 'afanasyev_oduvanchiki_s4',
      text: 'Вычитав в книге, что металл защищает от нечисти, он разложил вокруг кровати ножи.',
      anchor: 'нечисти', answerId: 'sergej' },                      // B
    { id: 'afanasyev_oduvanchiki_s5',
      text: 'Дрожащей рукой он зажёг свечу, но её свет вырвал из мрака лишь кровать да часть тумбочки, а потом она, как всегда, погасла.',
      anchor: 'тумбочки', answerId: 'sergej' },                    // B
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
