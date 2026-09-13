import { Task13TableSrc } from '../task13data';

export const TASK13_TABLES_L3: Task13TableSrc[] = [
  // --- УРОВЕНЬ 3 ---
{
  id: 'table-l3-1',
  level: 3,
  tags: ['химия', 'география'],
  titleRow: 'Элементы, названные в честь мест на карте',
  headerGroups: [{ label: 'Температуры', columnIds: ['melting', 'boiling'] }],
  objectColumnLabel: 'Элемент',
  rows: [
    { id: 'germanium', label: 'Германий' },
    { id: 'polonium', label: 'Полоний' },
    { id: 'francium', label: 'Франций' },
    { id: 'americium', label: 'Америций' },
    { id: 'californium', label: 'Калифорний' },
    { id: 'scandium', label: 'Скандий' },
    { id: 'ruthenium', label: 'Рутений' },
    { id: 'europium', label: 'Европий' },
    { id: 'hafnium', label: 'Гафний' },
    { id: 'yttrium', label: 'Иттрий' },
    { id: 'rhenium', label: 'Рений' }
  ],
  columns: [
    {
      id: 'symbol', label: 'Символ',
      align: 'center', kind: 'text',
      values: { germanium: 'Ge', polonium: 'Po', francium: 'Fr',
                americium: 'Am', californium: 'Cf', scandium: 'Sc',
                ruthenium: 'Ru', europium: 'Eu', hafnium: 'Hf',
                yttrium: 'Y', rhenium: 'Re' }
    },
    {
      id: 'number', label: 'Номер',
      align: 'center', kind: 'number',
      values: { germanium: 32, polonium: 84, francium: 87, americium: 95,
                californium: 98, scandium: 21, ruthenium: 44, europium: 63,
                hafnium: 72, yttrium: 39, rhenium: 75 }
    },
    {
      id: 'year', label: 'Год открытия',
      align: 'center', kind: 'number',
      values: { germanium: 1886, polonium: 1898, francium: 1939,
                americium: 1944, californium: 1950, scandium: 1879,
                ruthenium: 1844, europium: 1901, hafnium: 1923,
                yttrium: 1794, rhenium: 1925 }
    },
    {
      id: 'honor', label: 'В честь чего',
      align: 'left', kind: 'text',
      values: { germanium: 'Германия', polonium: 'Польша', francium: 'Франция',
                americium: 'Америка', californium: 'Калифорния',
                scandium: 'Скандинавия', ruthenium: 'Россия',
                europium: 'Европа', hafnium: 'Копенгаген',
                yttrium: 'Село Иттербю', rhenium: 'Рейн' }
    },
    {
      id: 'melting', label: 'Плавление', unit: '°C',
      align: 'center', kind: 'number',
      values: { germanium: 938, polonium: 254, francium: 27, americium: 1176,
                californium: 900, scandium: 1541, ruthenium: 2334,
                europium: 822, hafnium: 2233, yttrium: 1526, rhenium: 3186 }
    },
    {
      id: 'boiling', label: 'Кипение', unit: '°C',
      align: 'center', kind: 'number',
      values: { germanium: 2833, polonium: 962, francium: 677,
                americium: 2011, californium: 1470, scandium: 2836,
                ruthenium: 4150, europium: 1529, hafnium: 4603,
                yttrium: 3336, rhenium: 5596 }
    },
    {
      id: 'density', label: 'Плотность', unit: 'г/см³',
      align: 'center', kind: 'number',
      values: { germanium: 5.3, polonium: 9.2, francium: 1.9, americium: 12,
                californium: 15.1, scandium: 3, ruthenium: 12.4, europium: 5.2,
                hafnium: 13.3, yttrium: 4.5, rhenium: 21 }
    },
    {
      id: 'mining', label: 'Добыча в мире', unit: 'т в год',
      align: 'center', kind: 'number',
      values: {
        germanium: { min: 100, max: 180, step: 20 },
        polonium: 0,
        francium: 0,
        americium: 0,
        californium: 0,
        scandium: { min: 10, max: 30, step: 5 },
        ruthenium: { min: 20, max: 40, step: 5 },
        europium: 400,
        hafnium: { min: 60, max: 100, step: 10 },
        yttrium: 9000,
        rhenium: 60
      }
    }
  ]
},
{
  id: 'table-l3-2',
  level: 3,
  tags: ['информатика', 'языки'],
  titleRow: 'Языки программирования и их долгая жизнь',
  headerGroups: [{ label: 'Годы', columnIds: ['created', 'standard'] }],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Язык',
  rows: [
    { id: 'fortran', label: 'Fortran' },
    { id: 'lisp', label: 'Lisp' },
    { id: 'c', label: 'C' },
    { id: 'pascal', label: 'Pascal' },
    { id: 'cpp', label: 'C++' },
    { id: 'python', label: 'Python' },
    { id: 'java', label: 'Java' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'php', label: 'PHP' },
    { id: 'go', label: 'Go' },
    { id: 'rust', label: 'Rust' }
  ],
  columns: [
    {
      id: 'author', label: 'Создатель',
      align: 'left', kind: 'text',
      values: { fortran: 'Джон Бэкус', lisp: 'Джон Маккарти',
                c: 'Деннис Ритчи', pascal: 'Никлаус Вирт',
                cpp: 'Бьёрн Страуструп', python: 'Гвидо ван Россум',
                java: 'Джеймс Гослинг', javascript: 'Брендан Эйх',
                php: 'Расмус Лердорф', go: 'Команда Google',
                rust: 'Грейдон Хоар' }
    },
    {
      id: 'created', label: 'Появился',
      align: 'center', kind: 'number',
      values: { fortran: 1957, lisp: 1958, c: 1972, pascal: 1970, cpp: 1985,
                python: 1991, java: 1995, javascript: 1995, php: 1995,
                go: 2009, rust: 2010 }
    },
    {
      id: 'standard', label: 'Свежая версия',
      align: 'center', kind: 'number',
      values: { fortran: 2023, lisp: 1994, c: 2024, pascal: 1990, cpp: 2023,
                python: 2024, java: 2025, javascript: 2024, php: 2024,
                go: 2024, rust: 2024 }
    },
    {
      id: 'keywords', label: 'Ключевых слов',
      align: 'center', kind: 'number',
      values: { fortran: 40, lisp: 25, c: 32, pascal: 35, cpp: 97, python: 35,
                java: 51, javascript: 38, php: 67, go: 25, rust: 39 }
    },
    {
      id: 'typing', label: 'Типизация',
      align: 'center', kind: 'text',
      values: { fortran: 'Статическая', lisp: 'Динамическая',
                c: 'Статическая', pascal: 'Статическая', cpp: 'Статическая',
                python: 'Динамическая', java: 'Статическая',
                javascript: 'Динамическая', php: 'Динамическая',
                go: 'Статическая', rust: 'Статическая' }
    },
    {
      id: 'run', label: 'Как исполняется',
      align: 'center', kind: 'text',
      values: { fortran: 'Компилируется', lisp: 'Интерпретируется',
                c: 'Компилируется', pascal: 'Компилируется',
                cpp: 'Компилируется', python: 'Интерпретируется',
                java: 'В байт-код', javascript: 'Интерпретируется',
                php: 'Интерпретируется', go: 'Компилируется',
                rust: 'Компилируется' }
    },
    {
      id: 'rank', label: 'Место в рейтинге',
      align: 'center', kind: 'number',
      values: {
        fortran: { min: 8, max: 20, step: 3 },
        lisp: { min: 25, max: 45, step: 5 },
        c: 3,
        pascal: { min: 12, max: 28, step: 4 },
        cpp: 2,
        python: 1,
        java: 4,
        javascript: 6,
        php: { min: 10, max: 18, step: 2 },
        go: 7,
        rust: { min: 12, max: 24, step: 3 }
      }
    },
    {
      id: 'jobs', label: 'Вакансий за месяц', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        fortran: 20,
        lisp: 15,
        c: { min: 400, max: 800, step: 100 },
        pascal: 30,
        cpp: { min: 700, max: 1300, step: 150 },
        python: { min: 1500, max: 2500, step: 250 },
        java: 2000,
        javascript: { min: 1200, max: 2000, step: 200 },
        php: 600,
        go: 500,
        rust: { min: 150, max: 350, step: 50 }
      }
    }
  ]
},
{
  id: 'table-l3-3',
  level: 3,
  tags: ['астрономия', 'техника'],
  titleRow: 'Крупнейшие оптические телескопы Земли',
  headerGroups: [{ label: 'Ночей в году', columnIds: ['clear', 'used'] }],
  objectColumnLabel: 'Телескоп',
  rows: [
    { id: 'keck', label: 'Кек I' },
    { id: 'vlt', label: 'VLT' },
    { id: 'subaru', label: 'Субару' },
    { id: 'gtc', label: 'Большой Канарский' },
    { id: 'het', label: 'Хобби — Эберли' },
    { id: 'bta', label: 'БТА' },
    { id: 'magellan', label: 'Магеллан' },
    { id: 'gemini', label: 'Джемини Север' },
    { id: 'lbt', label: 'Большой бинокулярный' },
    { id: 'hale', label: 'Телескоп Хейла' },
    { id: 'elt', label: 'ELT' }
  ],
  columns: [
    {
      id: 'place', label: 'Где стоит',
      align: 'left', kind: 'text',
      values: { keck: 'Гавайи', vlt: 'Чили', subaru: 'Гавайи',
                gtc: 'Канары', het: 'Техас', bta: 'Кавказ', magellan: 'Чили',
                gemini: 'Гавайи', lbt: 'Аризона', hale: 'Калифорния',
                elt: 'Чили' }
    },
    {
      id: 'mirror', label: 'Диаметр зеркала', unit: 'м',
      align: 'center', kind: 'number',
      values: { keck: 10, vlt: 8.2, subaru: 8.2, gtc: 10.4, het: 9.2, bta: 6,
                magellan: 6.5, gemini: 8.1, lbt: 8.4, hale: 5, elt: 39 }
    },
    {
      id: 'segments', label: 'Сегментов зеркала',
      align: 'center', kind: 'number',
      values: { keck: 36, vlt: 1, subaru: 1, gtc: 36, het: 91, bta: 1,
                magellan: 1, gemini: 1, lbt: 2, hale: 1, elt: 798 }
    },
    {
      id: 'altitude', label: 'Высота над морем', unit: 'м',
      align: 'center', kind: 'number',
      values: { keck: 4145, vlt: 2635, subaru: 4139, gtc: 2267, het: 2026,
                bta: 2070, magellan: 2380, gemini: 4213, lbt: 3221,
                hale: 1713, elt: 3046 }
    },
    {
      id: 'opened', label: 'Год открытия',
      align: 'center', kind: 'number',
      values: { keck: 1993, vlt: 1998, subaru: 1999, gtc: 2009, het: 1997,
                bta: 1975, magellan: 2000, gemini: 1999, lbt: 2005,
                hale: 1948, elt: 2029 }
    },
    {
      id: 'clear', label: 'Ясных', unit: 'ночей',
      align: 'center', kind: 'number',
      values: {
        keck: { min: 250, max: 310, step: 15 },
        vlt: { min: 300, max: 340, step: 10 },
        subaru: 270,
        gtc: 240,
        het: { min: 180, max: 240, step: 15 },
        bta: 150,
        magellan: 300,
        gemini: 265,
        lbt: { min: 220, max: 280, step: 15 },
        hale: 200,
        elt: 320
      }
    },
    {
      id: 'used', label: 'Заняты', unit: 'ночей',
      align: 'center', kind: 'number',
      values: { keck: 300, vlt: 330, subaru: 280, gtc: 250, het: 220, bta: 200,
                magellan: 310, gemini: 290, lbt: 260, hale: 240, elt: 330 }
    },
    {
      id: 'requests', label: 'Заявок на время', unit: 'шт.',
      align: 'center', kind: 'number',
      values: {
        keck: { min: 600, max: 1000, step: 100 },
        vlt: { min: 800, max: 1400, step: 150 },
        subaru: 500,
        gtc: 350,
        het: 200,
        bta: { min: 80, max: 200, step: 30 },
        magellan: 300,
        gemini: 450,
        lbt: { min: 150, max: 350, step: 50 },
        hale: 180,
        elt: 900
      }
    }
  ]
},
{
  id: 'table-l3-4',
  level: 3,
  tags: ['техника', 'тоннели'],
  titleRow: 'Длинные тоннели: под горами и под водой',
  headerGroups: [{ label: 'Длина', columnIds: ['total', 'underwater'] }],
  objectColumnLabel: 'Тоннель',
  rows: [
    { id: 'gotthard', label: 'Готардский базисный' },
    { id: 'lotschberg', label: 'Лёчбергский базисный' },
    { id: 'seikan', label: 'Сэйкан' },
    { id: 'channel', label: 'Ла-Манш' },
    { id: 'guadarrama', label: 'Гуадаррама' },
    { id: 'laerdal', label: 'Лердальский' },
    { id: 'simplon', label: 'Симплонский' },
    { id: 'yamate', label: 'Ямате' },
    { id: 'severomuysky', label: 'Северомуйский' },
    { id: 'marmaray', label: 'Мармарай' },
    { id: 'lefortovo', label: 'Лефортовский' }
  ],
  columns: [
    {
      id: 'country', label: 'Страна',
      align: 'left', kind: 'text',
      values: { gotthard: 'Швейцария', lotschberg: 'Швейцария',
                seikan: 'Япония', channel: 'Франция и Англия',
                guadarrama: 'Испания', laerdal: 'Норвегия',
                simplon: 'Швейцария и Италия', yamate: 'Япония',
                severomuysky: 'Россия', marmaray: 'Турция',
                lefortovo: 'Россия' }
    },
    {
      id: 'total', label: 'Всего', unit: 'км',
      align: 'center', kind: 'number',
      values: { gotthard: 57.1, lotschberg: 34.6, seikan: 53.9, channel: 50.5,
                guadarrama: 28.4, laerdal: 24.5, simplon: 19.8, yamate: 18.2,
                severomuysky: 15.3, marmaray: 13.6, lefortovo: 3.2 }
    },
    {
      id: 'underwater', label: 'Под водой', unit: 'км',
      align: 'center', kind: 'number',
      values: { gotthard: 0, lotschberg: 0, seikan: 23.3, channel: 37.9,
                guadarrama: 0, laerdal: 0, simplon: 0, yamate: 0,
                severomuysky: 0, marmaray: 1.4, lefortovo: 0 }
    },
    {
      id: 'opened', label: 'Год открытия',
      align: 'center', kind: 'number',
      values: { gotthard: 2016, lotschberg: 2007, seikan: 1988, channel: 1994,
                guadarrama: 2007, laerdal: 2000, simplon: 1906, yamate: 2007,
                severomuysky: 2003, marmaray: 2013, lefortovo: 2003 }
    },
    {
      id: 'kind', label: 'Для чего',
      align: 'center', kind: 'text',
      values: { gotthard: 'Поезда', lotschberg: 'Поезда', seikan: 'Поезда',
                channel: 'Поезда', guadarrama: 'Поезда', laerdal: 'Машины',
                simplon: 'Поезда', yamate: 'Машины', severomuysky: 'Поезда',
                marmaray: 'Поезда', lefortovo: 'Машины' }
    },
    {
      id: 'tubes', label: 'Число труб',
      align: 'center', kind: 'number',
      values: { gotthard: 2, lotschberg: 2, seikan: 1, channel: 3,
                guadarrama: 2, laerdal: 1, simplon: 2, yamate: 2,
                severomuysky: 1, marmaray: 2, lefortovo: 1 }
    },
    {
      id: 'cover', label: 'Толща над сводом', unit: 'м',
      align: 'center', kind: 'number',
      values: { gotthard: 2300, lotschberg: 1800, seikan: 240, channel: 75,
                guadarrama: 992, laerdal: 1400, simplon: 2135, yamate: 40,
                severomuysky: 1500, marmaray: 60, lefortovo: 30 }
    },
    {
      id: 'traffic', label: 'Проходит за сутки', unit: 'ед.',
      align: 'center', kind: 'number',
      values: {
        gotthard: { min: 200, max: 320, step: 30 },
        lotschberg: 110,
        seikan: { min: 30, max: 70, step: 10 },
        channel: 400,
        guadarrama: 60,
        laerdal: { min: 800, max: 2000, step: 300 },
        simplon: 70,
        yamate: { min: 40000, max: 80000, step: 10000 },
        severomuysky: 16,
        marmaray: 300,
        lefortovo: { min: 30000, max: 70000, step: 10000 }
      }
    }
  ]
},
{
  id: 'table-l3-5',
  level: 3,
  tags: ['история', 'астрономия'],
  titleRow: 'Древние сооружения, следившие за небом',
  headerGroups: [{ label: 'Размеры', columnIds: ['height', 'width'] }],
  objectColumnLabel: 'Сооружение',
  rows: [
    { id: 'stonehenge', label: 'Стоунхендж' },
    { id: 'goseck', label: 'Гозекский круг' },
    { id: 'newgrange', label: 'Ньюгрейндж' },
    { id: 'caracol', label: 'Эль-Караколь' },
    { id: 'intihuatana', label: 'Интиуатана' },
    { id: 'abusimbel', label: 'Абу-Симбел' },
    { id: 'jantar', label: 'Джантар-Мантар' },
    { id: 'ulugbek', label: 'Обсерватория Улугбека' },
    { id: 'nabta', label: 'Набта-Плая' },
    { id: 'arkaim', label: 'Аркаим' },
    { id: 'chankillo', label: 'Чанкильо' }
  ],
  columns: [
    {
      id: 'country', label: 'Страна',
      align: 'left', kind: 'text',
      values: { stonehenge: 'Англия', goseck: 'Германия', newgrange: 'Ирландия',
                caracol: 'Мексика', intihuatana: 'Перу', abusimbel: 'Египет',
                jantar: 'Индия', ulugbek: 'Узбекистан', nabta: 'Египет',
                arkaim: 'Россия', chankillo: 'Перу' }
    },
    {
      id: 'age', label: 'Построено',
      align: 'center', kind: 'text',
      values: { stonehenge: '2500 до н. э.', goseck: '4900 до н. э.',
                newgrange: '3200 до н. э.', caracol: '900 н. э.',
                intihuatana: '1450 н. э.', abusimbel: '1264 до н. э.',
                jantar: '1734 н. э.', ulugbek: '1420 н. э.',
                nabta: '4800 до н. э.', arkaim: '1700 до н. э.',
                chankillo: '300 до н. э.' }
    },
    {
      id: 'height', label: 'Высота', unit: 'м',
      align: 'center', kind: 'number',
      values: { stonehenge: 5, goseck: 2, newgrange: 12, caracol: 13,
                intihuatana: 2, abusimbel: 30, jantar: 27, ulugbek: 30,
                nabta: 3, arkaim: 5, chankillo: 6 }
    },
    {
      id: 'width', label: 'Поперечник', unit: 'м',
      align: 'center', kind: 'number',
      values: { stonehenge: 33, goseck: 75, newgrange: 85, caracol: 16,
                intihuatana: 3, abusimbel: 38, jantar: 45, ulugbek: 48,
                nabta: 30, arkaim: 170, chankillo: 300 }
    },
    {
      id: 'marks', label: 'Что отмечает',
      align: 'left', kind: 'text',
      values: { stonehenge: 'Летнее солнцестояние', goseck: 'Зимнее солнцестояние',
                newgrange: 'Зимнее солнцестояние', caracol: 'Движение Венеры',
                intihuatana: 'Равноденствие', abusimbel: 'Два дня в году',
                jantar: 'Время и высоту светил', ulugbek: 'Положение звёзд',
                nabta: 'Летнее солнцестояние', arkaim: 'Восходы Луны',
                chankillo: 'Все дни года' }
    },
    {
      id: 'material', label: 'Материал',
      align: 'center', kind: 'text',
      values: { stonehenge: 'Камень', goseck: 'Дерево', newgrange: 'Камень',
                caracol: 'Известняк', intihuatana: 'Гранит',
                abusimbel: 'Скала', jantar: 'Камень и мрамор',
                ulugbek: 'Кирпич', nabta: 'Камень', arkaim: 'Дерево и грунт',
                chankillo: 'Камень' }
    },
    {
      id: 'studied', label: 'Год изучения',
      align: 'center', kind: 'number',
      values: { stonehenge: 1963, goseck: 1991, newgrange: 1967, caracol: 1975,
                intihuatana: 1911, abusimbel: 1817, jantar: 1901,
                ulugbek: 1908, nabta: 1974, arkaim: 1987, chankillo: 2007 }
    },
    {
      id: 'tourists', label: 'Посетителей за год', unit: 'тыс. чел.',
      align: 'center', kind: 'number',
      values: {
        stonehenge: { min: 1000, max: 1600, step: 150 },
        goseck: 30,
        newgrange: { min: 150, max: 250, step: 25 },
        caracol: 2500,
        intihuatana: 1500,
        abusimbel: { min: 200, max: 400, step: 50 },
        jantar: 800,
        ulugbek: { min: 100, max: 300, step: 50 },
        nabta: 5,
        arkaim: { min: 30, max: 90, step: 15 },
        chankillo: 20
      }
    }
  ]
},
{
  id: 'table-l3-6',
  level: 3,
  tags: ['космос', 'география'],
  titleRow: 'Космодромы мира и их широта',
  headerGroups: [{ label: 'Пуски', columnIds: ['peryear', 'total'] }],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Космодром',
  rows: [
    { id: 'baikonur', label: 'Байконур' },
    { id: 'vostochny', label: 'Восточный' },
    { id: 'plesetsk', label: 'Плесецк' },
    { id: 'canaveral', label: 'Мыс Канаверал' },
    { id: 'vandenberg', label: 'Ванденберг' },
    { id: 'kourou', label: 'Куру' },
    { id: 'jiuquan', label: 'Цзюцюань' },
    { id: 'wenchang', label: 'Вэньчан' },
    { id: 'sriharikota', label: 'Шрихарикота' },
    { id: 'tanegashima', label: 'Танэгасима' },
    { id: 'mahia', label: 'Махиа' }
  ],
  columns: [
    {
      id: 'country', label: 'Страна',
      align: 'left', kind: 'text',
      values: { baikonur: 'Казахстан', vostochny: 'Россия', plesetsk: 'Россия',
                canaveral: 'США', vandenberg: 'США', kourou: 'Гвиана',
                jiuquan: 'Китай', wenchang: 'Китай', sriharikota: 'Индия',
                tanegashima: 'Япония', mahia: 'Новая Зеландия' }
    },
    {
      id: 'latitude', label: 'Широта', unit: '°',
      align: 'center', kind: 'number',
      values: { baikonur: 45.9, vostochny: 51.9, plesetsk: 62.9,
                canaveral: 28.5, vandenberg: 34.7, kourou: 5.2, jiuquan: 40.9,
                wenchang: 19.6, sriharikota: 13.7, tanegashima: 30.4,
                mahia: 39.3 }
    },
    {
      id: 'first', label: 'Первый пуск',
      align: 'center', kind: 'number',
      values: { baikonur: 1957, vostochny: 2016, plesetsk: 1966,
                canaveral: 1950, vandenberg: 1959, kourou: 1968,
                jiuquan: 1970, wenchang: 2016, sriharikota: 1979,
                tanegashima: 1975, mahia: 2017 }
    },
    {
      id: 'pads', label: 'Стартовых площадок',
      align: 'center', kind: 'number',
      values: { baikonur: 9, vostochny: 2, plesetsk: 6, canaveral: 8,
                vandenberg: 5, kourou: 3, jiuquan: 4, wenchang: 2,
                sriharikota: 2, tanegashima: 2, mahia: 2 }
    },
    {
      id: 'peryear', label: 'За год', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        baikonur: { min: 8, max: 20, step: 3 },
        vostochny: { min: 2, max: 10, step: 2 },
        plesetsk: 7,
        canaveral: { min: 40, max: 80, step: 10 },
        vandenberg: { min: 15, max: 35, step: 5 },
        kourou: 6,
        jiuquan: 20,
        wenchang: 9,
        sriharikota: 7,
        tanegashima: 4,
        mahia: { min: 6, max: 18, step: 3 }
      }
    },
    {
      id: 'total', label: 'Всего', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        baikonur: { min: 4800, max: 5600, step: 200 },
        vostochny: 20,
        plesetsk: { min: 1600, max: 2000, step: 100 },
        canaveral: 1000,
        vandenberg: { min: 700, max: 900, step: 50 },
        kourou: 320,
        jiuquan: 260,
        wenchang: 40,
        sriharikota: 95,
        tanegashima: 80,
        mahia: 60
      }
    },
    {
      id: 'ocean', label: 'Куда падают ступени',
      align: 'left', kind: 'text',
      values: { baikonur: 'Степь', vostochny: 'Тайга и океан',
                plesetsk: 'Тундра', canaveral: 'Атлантика',
                vandenberg: 'Тихий океан', kourou: 'Атлантика',
                jiuquan: 'Пустыня', wenchang: 'Море',
                sriharikota: 'Индийский океан', tanegashima: 'Тихий океан',
                mahia: 'Тихий океан' }
    },
    {
      id: 'city', label: 'До ближайшего города', unit: 'км',
      align: 'center', kind: 'number',
      values: { baikonur: 30, vostochny: 45, plesetsk: 40, canaveral: 60,
                vandenberg: 20, kourou: 15, jiuquan: 210, wenchang: 60,
                sriharikota: 80, tanegashima: 10, mahia: 60 }
    }
  ]
},
{
  id: 'table-l3-7',
  level: 3,
  tags: ['география', 'полярное'],
  titleRow: 'Полярные станции: кто зимует на краю света',
  headerGroups: [{ label: 'Средняя температура', columnIds: ['january', 'july'] }],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Станция',
  rows: [
    { id: 'vostok', label: 'Восток' },
    { id: 'amundsen', label: 'Амундсен — Скотт' },
    { id: 'mcmurdo', label: 'Мак-Мёрдо' },
    { id: 'concordia', label: 'Конкордия' },
    { id: 'mirny', label: 'Мирный' },
    { id: 'progress', label: 'Прогресс' },
    { id: 'bellingshausen', label: 'Беллинсгаузен' },
    { id: 'neumayer', label: 'Ноймайер III' },
    { id: 'halley', label: 'Халли VI' },
    { id: 'nyalesund', label: 'Ню-Олесунн' },
    { id: 'barneo', label: 'Барнео' }
  ],
  columns: [
    {
      id: 'country', label: 'Чья станция',
      align: 'left', kind: 'text',
      values: { vostok: 'Россия', amundsen: 'США', mcmurdo: 'США',
                concordia: 'Франция и Италия', mirny: 'Россия',
                progress: 'Россия', bellingshausen: 'Россия',
                neumayer: 'Германия', halley: 'Англия', nyalesund: 'Норвегия',
                barneo: 'Россия' }
    },
    {
      id: 'founded', label: 'Год основания',
      align: 'center', kind: 'number',
      values: { vostok: 1957, amundsen: 1956, mcmurdo: 1956, concordia: 2005,
                mirny: 1956, progress: 1988, bellingshausen: 1968,
                neumayer: 2009, halley: 1956, nyalesund: 1968, barneo: 2002 }
    },
    {
      id: 'altitude', label: 'Высота над морем', unit: 'м',
      align: 'center', kind: 'number',
      values: { vostok: 3488, amundsen: 2835, mcmurdo: 10, concordia: 3233,
                mirny: 35, progress: 15, bellingshausen: 16, neumayer: 40,
                halley: 30, nyalesund: 8, barneo: 2 }
    },
    {
      id: 'january', label: 'В январе', unit: '°C',
      align: 'center', kind: 'number',
      values: { vostok: -32, amundsen: -28, mcmurdo: -3, concordia: -30,
                mirny: -2, progress: 0, bellingshausen: 1, neumayer: -3,
                halley: -5, nyalesund: -12, barneo: -30 }
    },
    {
      id: 'july', label: 'В июле', unit: '°C',
      align: 'center', kind: 'number',
      values: { vostok: -67, amundsen: -60, mcmurdo: -27, concordia: -65,
                mirny: -18, progress: -16, bellingshausen: -7, neumayer: -25,
                halley: -29, nyalesund: 5, barneo: 0 }
    },
    {
      id: 'winter', label: 'Зимовщиков', unit: 'чел.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        vostok: { min: 12, max: 24, step: 3 },
        amundsen: { min: 40, max: 60, step: 5 },
        mcmurdo: 150,
        concordia: 13,
        mirny: { min: 15, max: 35, step: 5 },
        progress: 25,
        bellingshausen: 10,
        neumayer: 9,
        halley: 0,
        nyalesund: 35,
        barneo: 0
      }
    },
    {
      id: 'summer', label: 'Летом', unit: 'чел.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        vostok: 30,
        amundsen: 150,
        mcmurdo: { min: 800, max: 1200, step: 100 },
        concordia: 60,
        mirny: 60,
        progress: { min: 60, max: 140, step: 20 },
        bellingshausen: 40,
        neumayer: 50,
        halley: { min: 40, max: 80, step: 10 },
        nyalesund: 180,
        barneo: 100
      }
    },
    {
      id: 'topole', label: 'До полюса', unit: 'км',
      align: 'center', kind: 'number',
      values: { vostok: 1260, amundsen: 0, mcmurdo: 1350, concordia: 1100,
                mirny: 2000, progress: 2100, bellingshausen: 3000,
                neumayer: 1900, halley: 1600, nyalesund: 1230, barneo: 100 }
    }
  ]
},
{
  id: 'table-l3-8',
  level: 3,
  tags: ['геология', 'космос'],
  titleRow: 'Следы космических ударов на Земле',
  headerGroups: [{ label: 'Размеры', columnIds: ['crater', 'body'] }],
  objectColumnLabel: 'Кратер',
  rows: [
    { id: 'vredefort', label: 'Вредефорт' },
    { id: 'chicxulub', label: 'Чиксулуб' },
    { id: 'sudbury', label: 'Садбери' },
    { id: 'popigai', label: 'Попигай' },
    { id: 'manicouagan', label: 'Маникуаган' },
    { id: 'acraman', label: 'Акраман' },
    { id: 'chesapeake', label: 'Чесапикский' },
    { id: 'puchezh', label: 'Пучеж-Катунки' },
    { id: 'kara', label: 'Карский' },
    { id: 'ries', label: 'Рис' },
    { id: 'barringer', label: 'Бэрринджер' }
  ],
  columns: [
    {
      id: 'country', label: 'Страна',
      align: 'left', kind: 'text',
      values: { vredefort: 'ЮАР', chicxulub: 'Мексика', sudbury: 'Канада',
                popigai: 'Россия', manicouagan: 'Канада', acraman: 'Австралия',
                chesapeake: 'США', puchezh: 'Россия', kara: 'Россия',
                ries: 'Германия', barringer: 'США' }
    },
    {
      id: 'crater', label: 'Кратер', unit: 'км',
      align: 'center', kind: 'number',
      values: { vredefort: 160, chicxulub: 180, sudbury: 130, popigai: 100,
                manicouagan: 100, acraman: 90, chesapeake: 85, puchezh: 80,
                kara: 65, ries: 24, barringer: 1.2 }
    },
    {
      id: 'body', label: 'Упавшее тело', unit: 'км',
      align: 'center', kind: 'number',
      values: { vredefort: 12, chicxulub: 12, sudbury: 10, popigai: 7,
                manicouagan: 5, acraman: 4, chesapeake: 3, puchezh: 3,
                kara: 3, ries: 1.5, barringer: 0.05 }
    },
    {
      id: 'age', label: 'Возраст', unit: 'млн лет',
      align: 'center', kind: 'number',
      values: { vredefort: 2023, chicxulub: 66, sudbury: 1849, popigai: 35,
                manicouagan: 214, acraman: 580, chesapeake: 35, puchezh: 196,
                kara: 70, ries: 15, barringer: 0.05 }
    },
    {
      id: 'now', label: 'Что там сейчас',
      align: 'left', kind: 'text',
      values: { vredefort: 'Холмы и кольцо', chicxulub: 'Дно залива',
                sudbury: 'Рудники', popigai: 'Тундра',
                manicouagan: 'Кольцевое озеро', acraman: 'Солёное озеро',
                chesapeake: 'Устье реки', puchezh: 'Равнина',
                kara: 'Тундра', ries: 'Городок в чаше',
                barringer: 'Музей и воронка' }
    },
    {
      id: 'recognized', label: 'Признан ударным',
      align: 'center', kind: 'number',
      values: { vredefort: 1961, chicxulub: 1991, sudbury: 1964, popigai: 1970,
                manicouagan: 1965, acraman: 1986, chesapeake: 1994,
                puchezh: 1965, kara: 1970, ries: 1960, barringer: 1903 }
    },
    {
      id: 'mineral', label: 'Что нашли',
      align: 'center', kind: 'text',
      values: { vredefort: 'Золото рядом', chicxulub: 'Слой иридия',
                sudbury: 'Никель', popigai: 'Алмазы',
                manicouagan: 'Расплав пород', acraman: 'Осколки в глине',
                chesapeake: 'Солёная вода', puchezh: 'Брекчия',
                kara: 'Алмазы', ries: 'Стекло', barringer: 'Куски железа' }
    },
    {
      id: 'visitors', label: 'Туристов за год', unit: 'тыс. чел.',
      align: 'center', kind: 'number',
      values: {
        vredefort: { min: 20, max: 60, step: 10 },
        chicxulub: 5,
        sudbury: { min: 80, max: 160, step: 20 },
        popigai: 0,
        manicouagan: 15,
        acraman: 1,
        chesapeake: 30,
        puchezh: 2,
        kara: 0,
        ries: { min: 100, max: 200, step: 25 },
        barringer: { min: 200, max: 400, step: 50 }
      }
    }
  ]
},
{
  id: 'table-l3-9',
  level: 3,
  tags: ['химия', 'техника'],
  titleRow: 'Сплавы: что смешали и что получилось',
  headerGroups: [{ label: 'Состав', columnIds: ['sharebase', 'shareadd'] }],
  objectColumnLabel: 'Сплав',
  rows: [
    { id: 'bronze', label: 'Бронза' },
    { id: 'brass', label: 'Латунь' },
    { id: 'steel', label: 'Сталь' },
    { id: 'castiron', label: 'Чугун' },
    { id: 'stainless', label: 'Нержавеющая сталь' },
    { id: 'duralumin', label: 'Дюралюминий' },
    { id: 'cupronickel', label: 'Мельхиор' },
    { id: 'solder', label: 'Припой' },
    { id: 'pobedit', label: 'Победит' },
    { id: 'nichrome', label: 'Нихром' },
    { id: 'electrum', label: 'Электрум' }
  ],
  columns: [
    {
      id: 'base', label: 'Основа',
      align: 'center', kind: 'text',
      values: { bronze: 'Медь', brass: 'Медь', steel: 'Железо',
                castiron: 'Железо', stainless: 'Железо',
                duralumin: 'Алюминий', cupronickel: 'Медь', solder: 'Олово',
                pobedit: 'Вольфрам', nichrome: 'Никель', electrum: 'Золото' }
    },
    {
      id: 'sharebase', label: 'Основа', unit: '%',
      align: 'center', kind: 'number',
      values: { bronze: 88, brass: 65, steel: 99, castiron: 96, stainless: 74,
                duralumin: 94, cupronickel: 80, solder: 60, pobedit: 90,
                nichrome: 80, electrum: 70 }
    },
    {
      id: 'shareadd', label: 'Добавка', unit: '%',
      align: 'center', kind: 'number',
      values: { bronze: 12, brass: 35, steel: 1, castiron: 4, stainless: 18,
                duralumin: 4, cupronickel: 20, solder: 40, pobedit: 10,
                nichrome: 20, electrum: 30 }
    },
    {
      id: 'additive', label: 'Что добавили',
      align: 'center', kind: 'text',
      values: { bronze: 'Олово', brass: 'Цинк', steel: 'Углерод',
                castiron: 'Углерод', stainless: 'Хром', duralumin: 'Медь',
                cupronickel: 'Никель', solder: 'Свинец', pobedit: 'Кобальт',
                nichrome: 'Хром', electrum: 'Серебро' }
    },
    {
      id: 'melting', label: 'Плавление', unit: '°C',
      align: 'center', kind: 'number',
      values: { bronze: 950, brass: 900, steel: 1500, castiron: 1200,
                stainless: 1450, duralumin: 650, cupronickel: 1170,
                solder: 190, pobedit: 2800, nichrome: 1400, electrum: 1000 }
    },
    {
      id: 'density', label: 'Плотность', unit: 'г/см³',
      align: 'center', kind: 'number',
      values: { bronze: 8.8, brass: 8.5, steel: 7.9, castiron: 7.2,
                stainless: 7.9, duralumin: 2.8, cupronickel: 8.9, solder: 8.5,
                pobedit: 15, nichrome: 8.4, electrum: 15 }
    },
    {
      id: 'price', label: 'Цена', unit: 'руб. за кг',
      align: 'center', kind: 'number',
      values: {
        bronze: { min: 700, max: 1300, step: 150 },
        brass: { min: 500, max: 900, step: 100 },
        steel: 80,
        castiron: 60,
        stainless: { min: 300, max: 700, step: 100 },
        duralumin: 400,
        cupronickel: 1500,
        solder: { min: 2000, max: 4000, step: 500 },
        pobedit: 9000,
        nichrome: { min: 2500, max: 4500, step: 500 },
        electrum: 4000000
      }
    },
    {
      id: 'use', label: 'Где применяют',
      align: 'left', kind: 'text',
      values: { bronze: 'Колокола', brass: 'Сантехника', steel: 'Каркасы',
                castiron: 'Трубы и плиты', stainless: 'Посуда',
                duralumin: 'Самолёты', cupronickel: 'Монеты', solder: 'Пайка',
                pobedit: 'Свёрла', nichrome: 'Спирали', electrum: 'Монеты' }
    }
  ]
},
{
  id: 'table-l3-10',
  level: 3,
  tags: ['космос', 'марс'],
  titleRow: 'Аппараты, севшие на поверхность Марса',
  headerGroups: [{ label: 'Массы', columnIds: ['mass', 'payload'] }],
  objectColumnLabel: 'Аппарат',
  rows: [
    { id: 'mars3', label: 'Марс-3' },
    { id: 'viking1', label: 'Викинг-1' },
    { id: 'sojourner', label: 'Соджорнер' },
    { id: 'spirit', label: 'Спирит' },
    { id: 'opportunity', label: 'Оппортьюнити' },
    { id: 'phoenix', label: 'Феникс' },
    { id: 'curiosity', label: 'Кьюриосити' },
    { id: 'insight', label: 'Инсайт' },
    { id: 'perseverance', label: 'Персеверанс' },
    { id: 'ingenuity', label: 'Индженьюити' },
    { id: 'zhurong', label: 'Чжужун' }
  ],
  columns: [
    {
      id: 'country', label: 'Страна',
      align: 'left', kind: 'text',
      values: { mars3: 'СССР', viking1: 'США', sojourner: 'США',
                spirit: 'США', opportunity: 'США', phoenix: 'США',
                curiosity: 'США', insight: 'США', perseverance: 'США',
                ingenuity: 'США', zhurong: 'Китай' }
    },
    {
      id: 'landing', label: 'Год посадки',
      align: 'center', kind: 'number',
      values: { mars3: 1971, viking1: 1976, sojourner: 1997, spirit: 2004,
                opportunity: 2004, phoenix: 2008, curiosity: 2012,
                insight: 2018, perseverance: 2021, ingenuity: 2021,
                zhurong: 2021 }
    },
    {
      id: 'mass', label: 'Аппарат', unit: 'кг',
      align: 'center', kind: 'number',
      values: { mars3: 358, viking1: 572, sojourner: 10.6, spirit: 174,
                opportunity: 174, phoenix: 350, curiosity: 899, insight: 358,
                perseverance: 1025, ingenuity: 1.8, zhurong: 240 }
    },
    {
      id: 'payload', label: 'Приборы', unit: 'кг',
      align: 'center', kind: 'number',
      values: { mars3: 30, viking1: 91, sojourner: 2, spirit: 9,
                opportunity: 9, phoenix: 55, curiosity: 75, insight: 50,
                perseverance: 59, ingenuity: 0.3, zhurong: 20 }
    },
    {
      id: 'moves', label: 'Способ передвижения',
      align: 'center', kind: 'text',
      values: { mars3: 'Неподвижен', viking1: 'Неподвижен',
                sojourner: 'Колёса', spirit: 'Колёса', opportunity: 'Колёса',
                phoenix: 'Неподвижен', curiosity: 'Колёса',
                insight: 'Неподвижен', perseverance: 'Колёса',
                ingenuity: 'Винты', zhurong: 'Колёса' }
    },
    {
      id: 'distance', label: 'Пройдено', unit: 'км',
      align: 'center', kind: 'number',
      values: { mars3: 0, viking1: 0, sojourner: 0.1, spirit: 7.7,
                opportunity: 45.2, phoenix: 0, curiosity: 34, insight: 0,
                perseverance: 30, ingenuity: 30, zhurong: 2 }
    },
    {
      id: 'sols', label: 'Проработал', unit: 'суток',
      align: 'center', kind: 'number',
      values: {
        mars3: 0,
        viking1: { min: 2000, max: 2400, step: 100 },
        sojourner: 83,
        spirit: 2210,
        opportunity: { min: 4800, max: 5200, step: 100 },
        phoenix: 157,
        curiosity: { min: 4400, max: 5200, step: 200 },
        insight: 1440,
        perseverance: { min: 1400, max: 1800, step: 100 },
        ingenuity: 1000,
        zhurong: 358
      }
    },
    {
      id: 'power', label: 'Питание',
      align: 'center', kind: 'text',
      values: { mars3: 'Батареи', viking1: 'Изотопное', sojourner: 'Солнечное',
                spirit: 'Солнечное', opportunity: 'Солнечное',
                phoenix: 'Солнечное', curiosity: 'Изотопное',
                insight: 'Солнечное', perseverance: 'Изотопное',
                ingenuity: 'Солнечное', zhurong: 'Солнечное' }
    }
  ]
},
{
  id: 'table-l3-11',
    level: 3,
    tags: ['география', 'спелеология'],
    titleRow: 'Самые глубокие пещеры мира',
    objectColumnLabel: 'Пещера',
    rows: [
      { id: 'veryovkina', label: 'Верёвкина' },
      { id: 'krubera', label: 'Крубера-Воронья' },
      { id: 'sarma', label: 'Сарма' },
      { id: 'snezhnaya', label: 'Снежная' },
      { id: 'lamprecht', label: 'Лампрехтсофен' },
      { id: 'mirolda', label: 'Мирольда' },
      { id: 'jeanbernard', label: 'Жан-Бернар' },
      { id: 'torca', label: 'Торка-дель-Серро' },
      { id: 'cornisa', label: 'Сима-де-ла-Корниса' },
      { id: 'huautla', label: 'Уаутла' },
      { id: 'berger', label: 'Гуфр Берже' }
    ],
    columns: [
      {
        id: 'country', label: 'Страна', align: 'left', kind: 'text',
        values: {
          veryovkina: 'Абхазия', krubera: 'Абхазия', sarma: 'Абхазия', snezhnaya: 'Абхазия',
          lamprecht: 'Австрия', mirolda: 'Франция', jeanbernard: 'Франция',
          torca: 'Испания', cornisa: 'Испания', huautla: 'Мексика', berger: 'Франция'
        }
      },
      {
        id: 'depth', label: 'Глубина', unit: 'м', align: 'center', kind: 'number',
        values: {
          veryovkina: 2212, krubera: 2199, sarma: 1830, snezhnaya: 1760, lamprecht: 1735,
          mirolda: 1733, jeanbernard: 1602, torca: 1589, cornisa: 1507, huautla: 1560, berger: 1271
        }
      },
      {
        id: 'length', label: 'Длина ходов', unit: 'м', align: 'center', kind: 'number',
        values: {
          veryovkina: 17500, krubera: 23000, sarma: 6370, snezhnaya: 24080, lamprecht: 60000,
          mirolda: 13000, jeanbernard: 20536, torca: 8000, cornisa: 6000, huautla: 89000, berger: 32000
        }
      },
      {
        id: 'year', label: 'Начало изучения', unit: 'год', align: 'center', kind: 'number',
        values: {
          veryovkina: 1968, krubera: 1960, sarma: 1990, snezhnaya: 1971, lamprecht: 1964,
          mirolda: 1971, jeanbernard: 1963, torca: 1980, cornisa: 1998, huautla: 1965, berger: 1953
        }
      },
      {
        id: 'temp', label: 'Температура', unit: '°C', align: 'center', kind: 'number',
        values: {
          veryovkina: 5, krubera: 6, sarma: 5, snezhnaya: 4, lamprecht: 5, mirolda: 4,
          jeanbernard: 4, torca: 7, cornisa: 7, huautla: 12, berger: 5
        }
      },
      {
        id: 'descent', label: 'Спуск до дна', unit: 'сут', align: 'center', kind: 'number',
        values: {
          veryovkina: { min: 10, max: 20, step: 2 }, krubera: 14, sarma: 9, snezhnaya: 12,
          lamprecht: 8, mirolda: 7, jeanbernard: 6, torca: 5, cornisa: 5, huautla: 11, berger: 4
        }
      },
      {
        id: 'trips', label: 'Экспедиций за год', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          veryovkina: { min: 2, max: 6, step: 1 }, krubera: 4, sarma: 2, snezhnaya: 3,
          lamprecht: { min: 4, max: 12, step: 2 }, mirolda: 2, jeanbernard: 3,
          torca: 2, cornisa: 2, huautla: 3, berger: 3
        }
      },
      {
        id: 'massif', label: 'Массив', align: 'left', kind: 'text',
        values: {
          veryovkina: 'Арабика', krubera: 'Арабика', sarma: 'Арабика', snezhnaya: 'Бзыбский',
          lamprecht: 'Леоганг', mirolda: 'Криу', jeanbernard: 'Фоли',
          torca: 'Пикос-де-Эуропа', cornisa: 'Пикос-де-Эуропа', huautla: 'Сьерра-Масатека',
          berger: 'Веркор'
        }
      }
    ],
    headerGroups: [{ label: 'Размеры пещеры', columnIds: ['depth', 'length'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-12',
    level: 3,
    tags: ['география', 'океан'],
    titleRow: 'Глубоководные жёлоба Мирового океана',
    objectColumnLabel: 'Жёлоб',
    rows: [
      { id: 'mariana', label: 'Марианский' },
      { id: 'tonga', label: 'Тонга' },
      { id: 'philippine', label: 'Филиппинский' },
      { id: 'kermadec', label: 'Кермадек' },
      { id: 'izu', label: 'Идзу-Бонинский' },
      { id: 'kuril', label: 'Курило-Камчатский' },
      { id: 'puertorico', label: 'Пуэрто-Рико' },
      { id: 'sandwich', label: 'Южно-Сандвичев' },
      { id: 'peruchile', label: 'Перуанско-Чилийский' },
      { id: 'aleut', label: 'Алеутский' },
      { id: 'sunda', label: 'Зондский' }
    ],
    columns: [
      {
        id: 'ocean', label: 'Океан', align: 'left', kind: 'text',
        values: {
          mariana: 'Тихий', tonga: 'Тихий', philippine: 'Тихий', kermadec: 'Тихий',
          izu: 'Тихий', kuril: 'Тихий', puertorico: 'Атлантический', sandwich: 'Атлантический',
          peruchile: 'Тихий', aleut: 'Тихий', sunda: 'Индийский'
        }
      },
      {
        id: 'length', label: 'Длина', unit: 'км', align: 'center', kind: 'number',
        values: {
          mariana: 2550, tonga: 1375, philippine: 1320, kermadec: 1200, izu: 1030, kuril: 2170,
          puertorico: 1754, sandwich: 965, peruchile: 5900, aleut: 3400, sunda: 4000
        }
      },
      {
        id: 'width', label: 'Ширина', unit: 'км', align: 'center', kind: 'number',
        values: {
          mariana: 69, tonga: 55, philippine: 30, kermadec: 60, izu: 45, kuril: 59,
          puertorico: 97, sandwich: 90, peruchile: 100, aleut: 50, sunda: 80
        }
      },
      {
        id: 'depth', label: 'Наибольшая глубина', unit: 'м', align: 'center', kind: 'number',
        values: {
          mariana: 10984, tonga: 10820, philippine: 10540, kermadec: 10047, izu: 9810, kuril: 9717,
          puertorico: 8742, sandwich: 8264, peruchile: 8065, aleut: 7679, sunda: 7290
        }
      },
      {
        id: 'pressure', label: 'Давление у дна', unit: 'МПа', align: 'center', kind: 'number',
        values: {
          mariana: 111, tonga: 109, philippine: 106, kermadec: 101, izu: 99, kuril: 98,
          puertorico: 88, sandwich: 83, peruchile: 81, aleut: 77, sunda: 73
        }
      },
      {
        id: 'firstyear', label: 'Первый промер', unit: 'год', align: 'center', kind: 'number',
        values: {
          mariana: 1875, tonga: 1952, philippine: 1951, kermadec: 1953, izu: 1959, kuril: 1949,
          puertorico: 1939, sandwich: 1926, peruchile: 1958, aleut: 1948, sunda: 1906
        }
      },
      {
        id: 'dives', label: 'Погружений за год', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          mariana: { min: 4, max: 12, step: 2 }, tonga: { min: 1, max: 5, step: 1 }, philippine: 2,
          kermadec: { min: 1, max: 5, step: 1 }, izu: 3, kuril: 2, puertorico: 2, sandwich: 1,
          peruchile: 2, aleut: 1, sunda: 2
        }
      },
      {
        id: 'plate', label: 'Плита сверху', align: 'left', kind: 'text',
        values: {
          mariana: 'Филиппинская', tonga: 'Индо-Австралийская', philippine: 'Филиппинская',
          kermadec: 'Индо-Австралийская', izu: 'Филиппинская', kuril: 'Охотская',
          puertorico: 'Карибская', sandwich: 'Сандвичева', peruchile: 'Южноамериканская',
          aleut: 'Североамериканская', sunda: 'Зондская'
        }
      }
    ],
    headerGroups: [{ label: 'Размеры жёлоба, км', columnIds: ['length', 'width'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-13',
    level: 3,
    tags: ['техника', 'арктика'],
    titleRow: 'Атомные ледоколы российского флота',
    objectColumnLabel: 'Ледокол',
    rows: [
      { id: 'lenin', label: '«Ленин»' },
      { id: 'arktika75', label: '«Арктика» (1975)' },
      { id: 'sibir77', label: '«Сибирь» (1977)' },
      { id: 'rossiya', label: '«Россия»' },
      { id: 'taimyr', label: '«Таймыр»' },
      { id: 'vaygach', label: '«Вайгач»' },
      { id: 'yamal', label: '«Ямал»' },
      { id: 'pobeda', label: '«50 лет Победы»' },
      { id: 'arktika20', label: '«Арктика» (2020)' },
      { id: 'sibir22', label: '«Сибирь» (2022)' },
      { id: 'ural', label: '«Урал»' }
    ],
    columns: [
      {
        id: 'year', label: 'Введён в строй', unit: 'год', align: 'center', kind: 'number',
        values: {
          lenin: 1959, arktika75: 1975, sibir77: 1977, rossiya: 1985, taimyr: 1989, vaygach: 1990,
          yamal: 1992, pobeda: 2007, arktika20: 2020, sibir22: 2022, ural: 2022
        }
      },
      {
        id: 'length', label: 'Длина', unit: 'м', align: 'center', kind: 'number',
        values: {
          lenin: 134, arktika75: 148, sibir77: 148, rossiya: 150, taimyr: 151.8, vaygach: 151.8,
          yamal: 150, pobeda: 159.6, arktika20: 173.3, sibir22: 173.3, ural: 173.3
        }
      },
      {
        id: 'width', label: 'Ширина', unit: 'м', align: 'center', kind: 'number',
        values: {
          lenin: 27.6, arktika75: 30, sibir77: 30, rossiya: 30, taimyr: 29.2, vaygach: 29.2,
          yamal: 30, pobeda: 30, arktika20: 34, sibir22: 34, ural: 34
        }
      },
      {
        id: 'power', label: 'Мощность', unit: 'МВт', align: 'center', kind: 'number',
        values: {
          lenin: 32.4, arktika75: 54, sibir77: 54, rossiya: 54, taimyr: 35, vaygach: 35,
          yamal: 54, pobeda: 54, arktika20: 60, sibir22: 60, ural: 60
        }
      },
      {
        id: 'ice', label: 'Толщина льда', unit: 'м', align: 'center', kind: 'number',
        values: {
          lenin: 2, arktika75: 2.3, sibir77: 2.3, rossiya: 2.3, taimyr: 1.8, vaygach: 1.8,
          yamal: 2.3, pobeda: 2.8, arktika20: 2.8, sibir22: 2.8, ural: 2.8
        }
      },
      {
        id: 'crew', label: 'Экипаж', unit: 'чел.', align: 'center', kind: 'number', total: 'sum',
        values: {
          lenin: 243, arktika75: 150, sibir77: 150, rossiya: 145, taimyr: 120, vaygach: 120,
          yamal: 138, pobeda: 138, arktika20: 54, sibir22: 54, ural: 54
        }
      },
      {
        id: 'voyages', label: 'Рейсов за год', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          lenin: 0, arktika75: 0, sibir77: 0, rossiya: 0, taimyr: 6, vaygach: 6,
          yamal: { min: 4, max: 12, step: 2 }, pobeda: { min: 5, max: 10, step: 1 },
          arktika20: { min: 4, max: 12, step: 2 }, sibir22: 8, ural: 8
        }
      },
      {
        id: 'status', label: 'Состояние', align: 'left', kind: 'text',
        values: {
          lenin: 'Музей', arktika75: 'Списан', sibir77: 'Списан', rossiya: 'Списан',
          taimyr: 'В строю', vaygach: 'В строю', yamal: 'В строю', pobeda: 'В строю',
          arktika20: 'В строю', sibir22: 'В строю', ural: 'В строю'
        }
      }
    ],
    headerGroups: [{ label: 'Размеры корпуса, м', columnIds: ['length', 'width'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-14',
    level: 3,
    tags: ['география', 'транспорт'],
    titleRow: 'Судоходные каналы: длина, шлюзы, глубина',
    objectColumnLabel: 'Канал',
    rows: [
      { id: 'suez', label: 'Суэцкий' },
      { id: 'panama', label: 'Панамский' },
      { id: 'kiel', label: 'Кильский' },
      { id: 'corinth', label: 'Коринфский' },
      { id: 'volgadon', label: 'Волго-Донской' },
      { id: 'bbk', label: 'Беломорско-Балтийский' },
      { id: 'rmd', label: 'Рейн — Майн — Дунай' },
      { id: 'gota', label: 'Гёта-канал' },
      { id: 'caledonian', label: 'Каледонский' },
      { id: 'saimaa', label: 'Сайменский' },
      { id: 'erie', label: 'Эри' }
    ],
    columns: [
      {
        id: 'country', label: 'Страна', align: 'left', kind: 'text',
        values: {
          suez: 'Египет', panama: 'Панама', kiel: 'Германия', corinth: 'Греция',
          volgadon: 'Россия', bbk: 'Россия', rmd: 'Германия', gota: 'Швеция',
          caledonian: 'Великобритания', saimaa: 'Финляндия', erie: 'США'
        }
      },
      {
        id: 'opened', label: 'Открыт', unit: 'год', align: 'center', kind: 'number',
        values: {
          suez: 1869, panama: 1914, kiel: 1895, corinth: 1893, volgadon: 1952, bbk: 1933,
          rmd: 1992, gota: 1832, caledonian: 1822, saimaa: 1856, erie: 1825
        }
      },
      {
        id: 'length', label: 'Длина', unit: 'км', align: 'center', kind: 'number',
        values: {
          suez: 193.3, panama: 81.6, kiel: 98.6, corinth: 6.3, volgadon: 101, bbk: 227,
          rmd: 171, gota: 190, caledonian: 97, saimaa: 43, erie: 584
        }
      },
      {
        id: 'depth', label: 'Глубина хода', unit: 'м', align: 'center', kind: 'number',
        values: {
          suez: 24, panama: 18.3, kiel: 11, corinth: 8, volgadon: 4, bbk: 4,
          rmd: 4, gota: 3, caledonian: 4.9, saimaa: 5.2, erie: 3.7
        }
      },
      {
        id: 'draft', label: 'Осадка судна', unit: 'м', align: 'center', kind: 'number',
        values: {
          suez: 20.1, panama: 15.2, kiel: 9.5, corinth: 7.3, volgadon: 3.5, bbk: 3.5,
          rmd: 2.7, gota: 2.8, caledonian: 4.1, saimaa: 4.35, erie: 3
        }
      },
      {
        id: 'locks', label: 'Шлюзы', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          suez: 0, panama: 12, kiel: 4, corinth: 0, volgadon: 13, bbk: 19,
          rmd: 16, gota: 58, caledonian: 29, saimaa: 8, erie: 34
        }
      },
      {
        id: 'time', label: 'Время прохода', unit: 'ч', align: 'center', kind: 'number',
        values: {
          suez: 14, panama: 10, kiel: 8, corinth: 1, volgadon: 11, bbk: 60,
          rmd: 20, gota: 96, caledonian: 24, saimaa: 8, erie: 120
        }
      },
      {
        id: 'ships', label: 'Судов за год', unit: 'тыс. шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          suez: { min: 18, max: 26, step: 2 }, panama: 14, kiel: { min: 26, max: 34, step: 2 },
          corinth: { min: 8, max: 12, step: 1 }, volgadon: 5, bbk: 3, rmd: 6, gota: 3,
          caledonian: 3, saimaa: 2, erie: 2
        }
      }
    ],
    headerGroups: [{ label: 'Под килем, м', columnIds: ['depth', 'draft'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-15',
    level: 3,
    tags: ['энергетика', 'техника'],
    titleRow: 'Крупнейшие гидроэлектростанции мира',
    objectColumnLabel: 'ГЭС',
    rows: [
      { id: 'sanxia', label: 'Санься' },
      { id: 'baihetan', label: 'Байхэтань' },
      { id: 'itaipu', label: 'Итайпу' },
      { id: 'xiluodu', label: 'Силоду' },
      { id: 'belomonte', label: 'Белу-Монти' },
      { id: 'guri', label: 'Гури' },
      { id: 'tucurui', label: 'Тукуруи' },
      { id: 'grandcoulee', label: 'Гранд-Кули' },
      { id: 'sayano', label: 'Саяно-Шушенская' },
      { id: 'krasnoyarsk', label: 'Красноярская' },
      { id: 'bratsk', label: 'Братская' }
    ],
    columns: [
      {
        id: 'country', label: 'Страна', align: 'left', kind: 'text',
        values: {
          sanxia: 'Китай', baihetan: 'Китай', itaipu: 'Бразилия', xiluodu: 'Китай',
          belomonte: 'Бразилия', guri: 'Венесуэла', tucurui: 'Бразилия', grandcoulee: 'США',
          sayano: 'Россия', krasnoyarsk: 'Россия', bratsk: 'Россия'
        }
      },
      {
        id: 'year', label: 'Пуск', unit: 'год', align: 'center', kind: 'number',
        values: {
          sanxia: 2012, baihetan: 2022, itaipu: 1984, xiluodu: 2014, belomonte: 2019, guri: 1986,
          tucurui: 1984, grandcoulee: 1942, sayano: 1985, krasnoyarsk: 1972, bratsk: 1967
        }
      },
      {
        id: 'power', label: 'Мощность', unit: 'МВт', align: 'center', kind: 'number', total: 'sum',
        values: {
          sanxia: 22500, baihetan: 16000, itaipu: 14000, xiluodu: 13860, belomonte: 11233,
          guri: 10235, tucurui: 8370, grandcoulee: 6809, sayano: 6400, krasnoyarsk: 6000, bratsk: 4500
        }
      },
      {
        id: 'damheight', label: 'Высота плотины', unit: 'м', align: 'center', kind: 'number',
        values: {
          sanxia: 181, baihetan: 289, itaipu: 196, xiluodu: 286, belomonte: 90, guri: 162,
          tucurui: 78, grandcoulee: 168, sayano: 245, krasnoyarsk: 124, bratsk: 125
        }
      },
      {
        id: 'damlength', label: 'Длина плотины', unit: 'м', align: 'center', kind: 'number',
        values: {
          sanxia: 2335, baihetan: 709, itaipu: 7919, xiluodu: 700, belomonte: 3545, guri: 7426,
          tucurui: 12500, grandcoulee: 1592, sayano: 1074, krasnoyarsk: 1065, bratsk: 1430
        }
      },
      {
        id: 'units', label: 'Гидроагрегаты', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          sanxia: 34, baihetan: 16, itaipu: 20, xiluodu: 18, belomonte: 24, guri: 20,
          tucurui: 25, grandcoulee: 33, sayano: 10, krasnoyarsk: 12, bratsk: 18
        }
      },
      {
        id: 'output', label: 'Выработка за год', unit: 'млрд кВт·ч', align: 'center', kind: 'number', total: 'sum',
        values: {
          sanxia: { min: 95, max: 115, step: 5 }, baihetan: 62, itaipu: { min: 70, max: 90, step: 5 },
          xiluodu: 55, belomonte: 39, guri: 47, tucurui: 21, grandcoulee: 20,
          sayano: { min: 20, max: 28, step: 2 }, krasnoyarsk: 18, bratsk: 22
        }
      },
      {
        id: 'type', label: 'Тип плотины', align: 'left', kind: 'text',
        values: {
          sanxia: 'Гравитационная', baihetan: 'Арочная', itaipu: 'Контрфорсная', xiluodu: 'Арочная',
          belomonte: 'Насыпная', guri: 'Гравитационная', tucurui: 'Насыпная',
          grandcoulee: 'Гравитационная', sayano: 'Арочно-гравитац.', krasnoyarsk: 'Гравитационная',
          bratsk: 'Гравитационная'
        }
      }
    ],
    headerGroups: [{ label: 'Плотина, м', columnIds: ['damheight', 'damlength'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-16',
    level: 3,
    tags: ['физика', 'техника'],
    titleRow: 'Ускорители частиц: кольца и энергии',
    objectColumnLabel: 'Ускоритель',
    rows: [
      { id: 'lhc', label: 'БАК' },
      { id: 'lep', label: 'LEP' },
      { id: 'tevatron', label: 'Тэватрон' },
      { id: 'sps', label: 'SPS' },
      { id: 'hera', label: 'HERA' },
      { id: 'rhic', label: 'RHIC' },
      { id: 'kekb', label: 'SuperKEKB' },
      { id: 'u70', label: 'У-70' },
      { id: 'nuclotron', label: 'Нуклотрон' },
      { id: 'nica', label: 'NICA' },
      { id: 'sibir2', label: '«Сибирь-2»' }
    ],
    columns: [
      {
        id: 'country', label: 'Страна', align: 'left', kind: 'text',
        values: {
          lhc: 'Швейцария', lep: 'Швейцария', tevatron: 'США', sps: 'Швейцария', hera: 'Германия',
          rhic: 'США', kekb: 'Япония', u70: 'Россия', nuclotron: 'Россия', nica: 'Россия',
          sibir2: 'Россия'
        }
      },
      {
        id: 'year', label: 'Пуск', unit: 'год', align: 'center', kind: 'number',
        values: {
          lhc: 2008, lep: 1989, tevatron: 1983, sps: 1976, hera: 1992, rhic: 2000,
          kekb: 2018, u70: 1967, nuclotron: 1993, nica: 2025, sibir2: 1999
        }
      },
      {
        id: 'perimeter', label: 'Периметр кольца', unit: 'м', align: 'center', kind: 'number',
        values: {
          lhc: 26659, lep: 26659, tevatron: 6280, sps: 6912, hera: 6336, rhic: 3834,
          kekb: 3016, u70: 1483, nuclotron: 252, nica: 503, sibir2: 124
        }
      },
      {
        id: 'depth', label: 'Глубина залегания', unit: 'м', align: 'center', kind: 'number',
        values: {
          lhc: 100, lep: 100, tevatron: 8, sps: 40, hera: 20, rhic: 4,
          kekb: 11, u70: 6, nuclotron: 0, nica: 0, sibir2: 0
        }
      },
      {
        id: 'energy', label: 'Энергия пучка', unit: 'ГэВ', align: 'center', kind: 'number',
        values: {
          lhc: 6800, lep: 104, tevatron: 980, sps: 450, hera: 920, rhic: 100,
          kekb: 7, u70: 70, nuclotron: 6, nica: 4.5, sibir2: 2.5
        }
      },
      {
        id: 'magnets', label: 'Поворотных магнитов', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          lhc: 1232, lep: 3304, tevatron: 774, sps: 744, hera: 422, rhic: 396,
          kekb: 450, u70: 120, nuclotron: 96, nica: 80, sibir2: 24
        }
      },
      {
        id: 'works', label: 'Работает', align: 'center', kind: 'text',
        values: {
          lhc: 'Да', lep: 'Нет', tevatron: 'Нет', sps: 'Да', hera: 'Нет', rhic: 'Да',
          kekb: 'Да', u70: 'Да', nuclotron: 'Да', nica: 'Да', sibir2: 'Да'
        }
      },
      {
        id: 'experiments', label: 'Экспериментов за год', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          lhc: { min: 6, max: 14, step: 2 }, lep: 0, tevatron: 0, sps: { min: 4, max: 12, step: 2 },
          hera: 0, rhic: { min: 3, max: 7, step: 1 }, kekb: 3, u70: 5, nuclotron: 4, nica: 2, sibir2: 6
        }
      }
    ],
    headerGroups: [{ label: 'Геометрия, м', columnIds: ['perimeter', 'depth'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-17',
    level: 3,
    tags: ['биология', 'ботаника'],
    titleRow: 'Деревья-долгожители планеты',
    objectColumnLabel: 'Дерево',
    rows: [
      { id: 'methuselah', label: 'Мафусаил' },
      { id: 'tjikko', label: 'Старый Тикко' },
      { id: 'abarkuh', label: 'Сарв-е Абарку' },
      { id: 'llangernyw', label: 'Тис Льянгернив' },
      { id: 'fortingall', label: 'Фортингэльский тис' },
      { id: 'tule', label: 'Дерево Туле' },
      { id: 'sherman', label: 'Генерал Шерман' },
      { id: 'hyperion', label: 'Гиперион' },
      { id: 'bodhi', label: 'Джая Шри Маха Бодхи' },
      { id: 'pando', label: 'Пандо' },
      { id: 'stelmuze', label: 'Стелмужский дуб' }
    ],
    columns: [
      {
        id: 'species', label: 'Вид', align: 'left', kind: 'text',
        values: {
          methuselah: 'Сосна остистая', tjikko: 'Ель обыкновенная', abarkuh: 'Кипарис',
          llangernyw: 'Тис ягодный', fortingall: 'Тис ягодный', tule: 'Таксодиум',
          sherman: 'Секвойядендрон', hyperion: 'Секвойя', bodhi: 'Фикус священный',
          pando: 'Осина', stelmuze: 'Дуб черешчатый'
        }
      },
      {
        id: 'country', label: 'Страна', align: 'left', kind: 'text',
        values: {
          methuselah: 'США', tjikko: 'Швеция', abarkuh: 'Иран', llangernyw: 'Великобритания',
          fortingall: 'Великобритания', tule: 'Мексика', sherman: 'США', hyperion: 'США',
          bodhi: 'Шри-Ланка', pando: 'США', stelmuze: 'Литва'
        }
      },
      {
        id: 'age', label: 'Возраст', unit: 'лет', align: 'center', kind: 'number',
        values: {
          methuselah: 4855, tjikko: 9560, abarkuh: 4500, llangernyw: 4000, fortingall: 2500,
          tule: 1500, sherman: 2500, hyperion: 700, bodhi: 2300, pando: 14000, stelmuze: 1500
        }
      },
      {
        id: 'height', label: 'Высота', unit: 'м', align: 'center', kind: 'number',
        values: {
          methuselah: 12, tjikko: 5, abarkuh: 25, llangernyw: 11, fortingall: 5, tule: 35,
          sherman: 84, hyperion: 116, bodhi: 22, pando: 24, stelmuze: 23
        }
      },
      {
        id: 'girth', label: 'Обхват ствола', unit: 'м', align: 'center', kind: 'number',
        values: {
          methuselah: 11, tjikko: 1, abarkuh: 18, llangernyw: 11, fortingall: 16, tule: 42,
          sherman: 31, hyperion: 14, bodhi: 7, pando: 2, stelmuze: 13
        }
      },
      {
        id: 'kind', label: 'Ствол', align: 'center', kind: 'text',
        values: {
          methuselah: 'Одно дерево', tjikko: 'Клон', abarkuh: 'Одно дерево',
          llangernyw: 'Одно дерево', fortingall: 'Одно дерево', tule: 'Одно дерево',
          sherman: 'Одно дерево', hyperion: 'Одно дерево', bodhi: 'Одно дерево',
          pando: 'Клон', stelmuze: 'Одно дерево'
        }
      },
      {
        id: 'protection', label: 'Охрана', align: 'left', kind: 'text',
        values: {
          methuselah: 'Нацлес', tjikko: 'Нацпарк', abarkuh: 'Памятник природы',
          llangernyw: 'Церковный двор', fortingall: 'Церковный двор', tule: 'Храмовый сад',
          sherman: 'Нацпарк', hyperion: 'Нацпарк', bodhi: 'Храмовый сад',
          pando: 'Нацлес', stelmuze: 'Памятник природы'
        }
      },
      {
        id: 'visitors', label: 'Посетителей за год', unit: 'тыс. чел.', align: 'center', kind: 'number', total: 'sum',
        values: {
          methuselah: { min: 20, max: 60, step: 10 }, tjikko: { min: 5, max: 25, step: 5 },
          abarkuh: 100, llangernyw: 15, fortingall: 10, tule: 300,
          sherman: { min: 400, max: 800, step: 100 }, hyperion: 0, bodhi: 2000, pando: 40,
          stelmuze: 25
        }
      }
    ],
    headerGroups: [{ label: 'Размеры дерева, м', columnIds: ['height', 'girth'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-18',
    level: 3,
    tags: ['география', 'море'],
    titleRow: 'Маяки: высота башни и дальность огня',
    objectColumnLabel: 'Маяк',
    rows: [
      { id: 'jeddah', label: 'Джидда' },
      { id: 'yokohama', label: 'Иокогама' },
      { id: 'vierge', label: 'Иль-Вьерж' },
      { id: 'gatteville', label: 'Гаттвиль' },
      { id: 'cordouan', label: 'Кордуан' },
      { id: 'lanterna', label: 'Ланterna' },
      { id: 'hatteras', label: 'Кейп-Хаттерас' },
      { id: 'osinovets', label: 'Осиновецкий' },
      { id: 'storozhno', label: 'Стороженский' },
      { id: 'khersones', label: 'Херсонесский' },
      { id: 'aniva', label: 'Анива' }
    ],
    columns: [
      {
        id: 'country', label: 'Страна', align: 'left', kind: 'text',
        values: {
          jeddah: 'Саудовская Аравия', yokohama: 'Япония', vierge: 'Франция',
          gatteville: 'Франция', cordouan: 'Франция', lanterna: 'Италия', hatteras: 'США',
          osinovets: 'Россия', storozhno: 'Россия', khersones: 'Россия', aniva: 'Россия'
        }
      },
      {
        id: 'year', label: 'Построен', unit: 'год', align: 'center', kind: 'number',
        values: {
          jeddah: 1990, yokohama: 1961, vierge: 1902, gatteville: 1835, cordouan: 1611,
          lanterna: 1543, hatteras: 1870, osinovets: 1910, storozhno: 1911, khersones: 1816,
          aniva: 1939
        }
      },
      {
        id: 'tower', label: 'Высота башни', unit: 'м', align: 'center', kind: 'number',
        values: {
          jeddah: 133, yokohama: 106, vierge: 83, gatteville: 75, cordouan: 68, lanterna: 76,
          hatteras: 64, osinovets: 70, storozhno: 71, khersones: 36, aniva: 31
        }
      },
      {
        id: 'focal', label: 'Высота огня', unit: 'м', align: 'center', kind: 'number',
        values: {
          jeddah: 133, yokohama: 100, vierge: 77, gatteville: 71, cordouan: 60, lanterna: 117,
          hatteras: 58, osinovets: 74, storozhno: 74, khersones: 46, aniva: 40
        }
      },
      {
        id: 'range', label: 'Дальность огня', unit: 'мор. миль', align: 'center', kind: 'number',
        values: {
          jeddah: 25, yokohama: 18, vierge: 27, gatteville: 25, cordouan: 22, lanterna: 25,
          hatteras: 20, osinovets: 22, storozhno: 21, khersones: 16, aniva: 17
        }
      },
      {
        id: 'material', label: 'Материал', align: 'left', kind: 'text',
        values: {
          jeddah: 'Бетон', yokohama: 'Сталь', vierge: 'Кирпич', gatteville: 'Гранит',
          cordouan: 'Камень', lanterna: 'Камень', hatteras: 'Кирпич', osinovets: 'Кирпич',
          storozhno: 'Кирпич', khersones: 'Камень', aniva: 'Бетон'
        }
      },
      {
        id: 'works', label: 'Действует', align: 'center', kind: 'text',
        values: {
          jeddah: 'Да', yokohama: 'Нет', vierge: 'Да', gatteville: 'Да', cordouan: 'Да',
          lanterna: 'Да', hatteras: 'Да', osinovets: 'Да', storozhno: 'Да', khersones: 'Да',
          aniva: 'Нет'
        }
      },
      {
        id: 'tours', label: 'Экскурсий за месяц', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          jeddah: 0, yokohama: { min: 20, max: 60, step: 10 }, vierge: { min: 4, max: 12, step: 2 },
          gatteville: 12, cordouan: 15, lanterna: 20, hatteras: { min: 10, max: 30, step: 5 },
          osinovets: 2, storozhno: 2, khersones: 3, aniva: 4
        }
      }
    ],
    headerGroups: [{ label: 'Высоты, м', columnIds: ['tower', 'focal'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-19',
    level: 3,
    tags: ['транспорт', 'география'],
    titleRow: 'Самые длинные железнодорожные маршруты',
    objectColumnLabel: 'Маршрут',
    rows: [
      { id: 'transsib', label: 'Транссиб' },
      { id: 'bam', label: 'БАМ' },
      { id: 'mospek', label: 'Москва — Пекин' },
      { id: 'canadian', label: '«Канадиан»' },
      { id: 'vivek', label: 'Vivek Express' },
      { id: 'lhasa', label: 'Пекин — Лхаса' },
      { id: 'ghan', label: '«Ган»' },
      { id: 'indpac', label: '«Индиан Пасифик»' },
      { id: 'zephyr', label: '«Калифорния Зефир»' },
      { id: 'shkun', label: 'Шанхай — Куньмин' },
      { id: 'bergen', label: 'Осло — Берген' }
    ],
    columns: [
      {
        id: 'country', label: 'Страна', align: 'left', kind: 'text',
        values: {
          transsib: 'Россия', bam: 'Россия', mospek: 'Россия — Китай', canadian: 'Канада',
          vivek: 'Индия', lhasa: 'Китай', ghan: 'Австралия', indpac: 'Австралия',
          zephyr: 'США', shkun: 'Китай', bergen: 'Норвегия'
        }
      },
      {
        id: 'length', label: 'Длина маршрута', unit: 'км', align: 'center', kind: 'number',
        values: {
          transsib: 9288, bam: 4287, mospek: 8984, canadian: 4466, vivek: 4234, lhasa: 3757,
          ghan: 2979, indpac: 4352, zephyr: 3924, shkun: 2252, bergen: 371
        }
      },
      {
        id: 'time', label: 'Время в пути', unit: 'ч', align: 'center', kind: 'number',
        values: {
          transsib: 146, bam: 68, mospek: 142, canadian: 97, vivek: 80, lhasa: 40,
          ghan: 54, indpac: 65, zephyr: 51, shkun: 11, bergen: 7
        }
      },
      {
        id: 'avgspeed', label: 'Средняя скорость', unit: 'км/ч', align: 'center', kind: 'number',
        values: {
          transsib: 64, bam: 63, mospek: 63, canadian: 46, vivek: 53, lhasa: 94,
          ghan: 55, indpac: 67, zephyr: 77, shkun: 205, bergen: 53
        }
      },
      {
        id: 'maxspeed', label: 'Наибольшая скорость', unit: 'км/ч', align: 'center', kind: 'number',
        values: {
          transsib: 140, bam: 90, mospek: 120, canadian: 100, vivek: 110, lhasa: 120,
          ghan: 115, indpac: 115, zephyr: 127, shkun: 350, bergen: 130
        }
      },
      {
        id: 'opened', label: 'Маршрут открыт', unit: 'год', align: 'center', kind: 'number',
        values: {
          transsib: 1916, bam: 1984, mospek: 1954, canadian: 1955, vivek: 2011, lhasa: 2006,
          ghan: 2004, indpac: 1970, zephyr: 1949, shkun: 2016, bergen: 1909
        }
      },
      {
        id: 'zones', label: 'Часовых поясов', unit: 'шт.', align: 'center', kind: 'number',
        values: {
          transsib: 7, bam: 4, mospek: 5, canadian: 4, vivek: 1, lhasa: 1,
          ghan: 1, indpac: 3, zephyr: 3, shkun: 1, bergen: 1
        }
      },
      {
        id: 'trains', label: 'Рейсов в неделю', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          transsib: { min: 4, max: 12, step: 2 }, bam: 3, mospek: 1, canadian: 2, vivek: 1,
          lhasa: 7, ghan: 1, indpac: 2, zephyr: 7,
          shkun: { min: 20, max: 40, step: 5 }, bergen: { min: 20, max: 28, step: 2 }
        }
      }
    ],
    headerGroups: [{ label: 'Скорость, км/ч', columnIds: ['avgspeed', 'maxspeed'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-20',
    level: 3,
    tags: ['история', 'техника'],
    titleRow: 'Самые тяжёлые колокола мира',
    objectColumnLabel: 'Колокол',
    rows: [
      { id: 'tsar', label: 'Царь-колокол' },
      { id: 'happiness', label: 'Колокол Счастья' },
      { id: 'mingun', label: 'Мингунский' },
      { id: 'lavra', label: 'Царь-колокол Лавры' },
      { id: 'uspensky', label: 'Успенский' },
      { id: 'yongle', label: 'Колокол Юнлэ' },
      { id: 'peace', label: 'Колокол Мира' },
      { id: 'sysoy', label: 'Сысой' },
      { id: 'pummerin', label: 'Пуммерин' },
      { id: 'petersglocke', label: 'Святой Пётр' },
      { id: 'bigben', label: 'Биг-Бен' }
    ],
    columns: [
      {
        id: 'country', label: 'Страна', align: 'left', kind: 'text',
        values: {
          tsar: 'Россия', happiness: 'Китай', mingun: 'Мьянма', lavra: 'Россия',
          uspensky: 'Россия', yongle: 'Китай', peace: 'США', sysoy: 'Россия',
          pummerin: 'Австрия', petersglocke: 'Германия', bigben: 'Великобритания'
        }
      },
      {
        id: 'city', label: 'Город', align: 'left', kind: 'text',
        values: {
          tsar: 'Москва', happiness: 'Пиндиншань', mingun: 'Мингун', lavra: 'Сергиев Посад',
          uspensky: 'Москва', yongle: 'Пекин', peace: 'Ньюпорт', sysoy: 'Ростов',
          pummerin: 'Вена', petersglocke: 'Кёльн', bigben: 'Лондон'
        }
      },
      {
        id: 'year', label: 'Год отливки', unit: 'год', align: 'center', kind: 'number',
        values: {
          tsar: 1735, happiness: 2000, mingun: 1810, lavra: 2004, uspensky: 1819, yongle: 1420,
          peace: 1999, sysoy: 1688, pummerin: 1951, petersglocke: 1923, bigben: 1858
        }
      },
      {
        id: 'mass', label: 'Масса', unit: 'т', align: 'center', kind: 'number', total: 'sum',
        values: {
          tsar: 202, happiness: 116, mingun: 90, lavra: 72, uspensky: 65, yongle: 47,
          peace: 30, sysoy: 32, pummerin: 21, petersglocke: 24, bigben: 14
        }
      },
      {
        id: 'height', label: 'Высота', unit: 'м', align: 'center', kind: 'number',
        values: {
          tsar: 6.14, happiness: 8.1, mingun: 3.7, lavra: 4.55, uspensky: 4.2, yongle: 6.75,
          peace: 3.7, sysoy: 3.4, pummerin: 3.14, petersglocke: 3.2, bigben: 2.2
        }
      },
      {
        id: 'diameter', label: 'Диаметр', unit: 'м', align: 'center', kind: 'number',
        values: {
          tsar: 6.6, happiness: 5.1, mingun: 4.95, lavra: 4.42, uspensky: 4.2, yongle: 3.3,
          peace: 3.7, sysoy: 3.6, pummerin: 3.14, petersglocke: 3.22, bigben: 2.7
        }
      },
      {
        id: 'rings', label: 'Звонит', align: 'center', kind: 'text',
        values: {
          tsar: 'Нет', happiness: 'Да', mingun: 'Да', lavra: 'Да', uspensky: 'Да', yongle: 'Да',
          peace: 'Да', sysoy: 'Да', pummerin: 'Да', petersglocke: 'Да', bigben: 'Да'
        }
      },
      {
        id: 'days', label: 'Дней звона в году', unit: 'дн.', align: 'center', kind: 'number',
        values: {
          tsar: 0, happiness: 30, mingun: { min: 200, max: 300, step: 25 },
          lavra: { min: 60, max: 140, step: 20 }, uspensky: 40, yongle: 10, peace: 365,
          sysoy: { min: 80, max: 160, step: 20 }, pummerin: 12, petersglocke: 30, bigben: 360
        }
      }
    ],
    headerGroups: [{ label: 'Размеры, м', columnIds: ['height', 'diameter'] }],
    totalsRow: { label: 'Итого' }
  },
  {
    id: 'table-l3-21',
    level: 3,
    tags: ['химия', 'климат'],
    titleRow: 'Парниковые газы: сила и время жизни',
    objectColumnLabel: 'Газ',
    rows: [
      { id: 'co2', label: 'Углекислый газ' },
      { id: 'ch4', label: 'Метан' },
      { id: 'n2o', label: 'Закись азота' },
      { id: 'sf6', label: 'Гексафторид серы' },
      { id: 'cf4', label: 'Тетрафторметан' },
      { id: 'c2f6', label: 'Гексафторэтан' },
      { id: 'hfc134a', label: 'Фреон R-134a' },
      { id: 'hfc23', label: 'Фреон R-23' },
      { id: 'cfc11', label: 'Фреон R-11' },
      { id: 'cfc12', label: 'Фреон R-12' },
      { id: 'o3', label: 'Озон приземный' }
    ],
    columns: [
      {
        id: 'formula', label: 'Формула', align: 'center', kind: 'text',
        values: {
          co2: 'CO₂', ch4: 'CH₄', n2o: 'N₂O', sf6: 'SF₆', cf4: 'CF₄', c2f6: 'C₂F₆',
          hfc134a: 'CH₂FCF₃', hfc23: 'CHF₃', cfc11: 'CCl₃F', cfc12: 'CCl₂F₂', o3: 'O₃'
        }
      },
      {
        id: 'gwp20', label: 'ПГП за 20 лет', align: 'center', kind: 'number',
        values: {
          co2: 1, ch4: 82.5, n2o: 273, sf6: 18300, cf4: 5300, c2f6: 8940,
          hfc134a: 4140, hfc23: 12400, cfc11: 8320, cfc12: 10800, o3: 0
        }
      },
      {
        id: 'gwp100', label: 'ПГП за 100 лет', align: 'center', kind: 'number',
        values: {
          co2: 1, ch4: 29.8, n2o: 273, sf6: 25200, cf4: 7380, c2f6: 12400,
          hfc134a: 1530, hfc23: 14600, cfc11: 6226, cfc12: 10200, o3: 0
        }
      },
      {
        id: 'lifetime', label: 'Время жизни', unit: 'лет', align: 'center', kind: 'number',
        values: {
          co2: 300, ch4: 11.8, n2o: 109, sf6: 3200, cf4: 50000, c2f6: 10000,
          hfc134a: 14, hfc23: 228, cfc11: 52, cfc12: 102, o3: 0
        }
      },
      {
        id: 'conc', label: 'Содержание', unit: 'ppb', align: 'center', kind: 'number',
        values: {
          co2: 422000, ch4: 1930, n2o: 337, sf6: 0.0115, cf4: 0.089, c2f6: 0.005,
          hfc134a: 0.13, hfc23: 0.038, cfc11: 0.22, cfc12: 0.49, o3: 35
        }
      },
      {
        id: 'share', label: 'Вклад в нагрев', unit: '%', align: 'center', kind: 'number',
        values: {
          co2: 66, ch4: 16, n2o: 6, sf6: 0.2, cf4: 0.1, c2f6: 0.1,
          hfc134a: 0.5, hfc23: 0.2, cfc11: 1.5, cfc12: 3, o3: 5
        }
      },
      {
        id: 'source', label: 'Главный источник', align: 'left', kind: 'text',
        values: {
          co2: 'Сжигание топлива', ch4: 'Скот и болота', n2o: 'Удобрения',
          sf6: 'Электрощиты', cf4: 'Выплавка алюминия', c2f6: 'Микроэлектроника',
          hfc134a: 'Холодильники', hfc23: 'Побочный продукт', cfc11: 'Старые пены',
          cfc12: 'Старая техника', o3: 'Выхлопные газы'
        }
      },
      {
        id: 'checks', label: 'Замеров за месяц', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          co2: { min: 40, max: 80, step: 10 }, ch4: { min: 20, max: 60, step: 10 }, n2o: 24,
          sf6: 8, cf4: 6, c2f6: 6, hfc134a: 12, hfc23: 6, cfc11: 10, cfc12: 10,
          o3: { min: 15, max: 35, step: 5 }
        }
      }
    ],
    headerGroups: [{ label: 'Потенциал нагрева (ПГП)', columnIds: ['gwp20', 'gwp100'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-22',
    level: 3,
    tags: ['геология', 'химия'],
    titleRow: 'Шкала Мооса и настоящая твёрдость',
    objectColumnLabel: 'Минерал',
    rows: [
      { id: 'talc', label: 'Тальк' },
      { id: 'gypsum', label: 'Гипс' },
      { id: 'calcite', label: 'Кальцит' },
      { id: 'fluorite', label: 'Флюорит' },
      { id: 'apatite', label: 'Апатит' },
      { id: 'orthoclase', label: 'Ортоклаз' },
      { id: 'pyrite', label: 'Пирит' },
      { id: 'quartz', label: 'Кварц' },
      { id: 'topaz', label: 'Топаз' },
      { id: 'corundum', label: 'Корунд' },
      { id: 'diamond', label: 'Алмаз' }
    ],
    columns: [
      {
        id: 'formula', label: 'Формула', align: 'center', kind: 'text',
        values: {
          talc: 'Mg₃Si₄O₁₀(OH)₂', gypsum: 'CaSO₄·2H₂O', calcite: 'CaCO₃', fluorite: 'CaF₂',
          apatite: 'Ca₅(PO₄)₃F', orthoclase: 'KAlSi₃O₈', pyrite: 'FeS₂', quartz: 'SiO₂',
          topaz: 'Al₂SiO₄F₂', corundum: 'Al₂O₃', diamond: 'C'
        }
      },
      {
        id: 'mohs', label: 'Твёрдость по Моосу', align: 'center', kind: 'number',
        values: {
          talc: 1, gypsum: 2, calcite: 3, fluorite: 4, apatite: 5, orthoclase: 6,
          pyrite: 6.3, quartz: 7, topaz: 8, corundum: 9, diamond: 10
        }
      },
      {
        id: 'vickers', label: 'Твёрдость по Виккерсу', unit: 'ГПа', align: 'center', kind: 'number',
        values: {
          talc: 0.03, gypsum: 0.4, calcite: 1.4, fluorite: 1.9, apatite: 5.4, orthoclase: 6.2,
          pyrite: 8, quartz: 12, topaz: 14, corundum: 20, diamond: 100
        }
      },
      {
        id: 'density', label: 'Плотность', unit: 'г/см³', align: 'center', kind: 'number',
        values: {
          talc: 2.75, gypsum: 2.32, calcite: 2.71, fluorite: 3.18, apatite: 3.2,
          orthoclase: 2.56, pyrite: 5.01, quartz: 2.65, topaz: 3.55, corundum: 4.02, diamond: 3.51
        }
      },
      {
        id: 'melting', label: 'Температура плавления', unit: '°C', align: 'center', kind: 'number',
        values: {
          talc: 1500, gypsum: 1450, calcite: 1339, fluorite: 1418, apatite: 1660,
          orthoclase: 1150, pyrite: 1188, quartz: 1713, topaz: 1650, corundum: 2054, diamond: 3550
        }
      },
      {
        id: 'system', label: 'Сингония', align: 'left', kind: 'text',
        values: {
          talc: 'Моноклинная', gypsum: 'Моноклинная', calcite: 'Тригональная',
          fluorite: 'Кубическая', apatite: 'Гексагональная', orthoclase: 'Моноклинная',
          pyrite: 'Кубическая', quartz: 'Тригональная', topaz: 'Ромбическая',
          corundum: 'Тригональная', diamond: 'Кубическая'
        }
      },
      {
        id: 'use', label: 'Где применяют', align: 'left', kind: 'text',
        values: {
          talc: 'Присыпка', gypsum: 'Строительство', calcite: 'Цемент', fluorite: 'Оптика',
          apatite: 'Удобрения', orthoclase: 'Фарфор', pyrite: 'Серная кислота',
          quartz: 'Стекло', topaz: 'Ювелирное дело', corundum: 'Абразивы', diamond: 'Резка камня'
        }
      },
      {
        id: 'samples', label: 'Образцов в кабинете', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          talc: { min: 4, max: 12, step: 2 }, gypsum: { min: 6, max: 18, step: 3 }, calcite: 10,
          fluorite: 6, apatite: 4, orthoclase: 5, pyrite: 7, quartz: { min: 10, max: 30, step: 5 },
          topaz: 2, corundum: 3, diamond: 1
        }
      }
    ],
    headerGroups: [{ label: 'Две шкалы твёрдости', columnIds: ['mohs', 'vickers'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-23',
    level: 3,
    tags: ['физика', 'звук'],
    titleRow: 'Как быстро звук идёт сквозь вещество',
    objectColumnLabel: 'Среда',
    rows: [
      { id: 'air', label: 'Воздух' },
      { id: 'helium', label: 'Гелий' },
      { id: 'water', label: 'Вода' },
      { id: 'ice', label: 'Лёд' },
      { id: 'pine', label: 'Сосна вдоль волокон' },
      { id: 'plexi', label: 'Оргстекло' },
      { id: 'concrete', label: 'Бетон' },
      { id: 'granite', label: 'Гранит' },
      { id: 'glass', label: 'Стекло' },
      { id: 'steel', label: 'Сталь' },
      { id: 'lead', label: 'Свинец' }
    ],
    columns: [
      {
        id: 'state', label: 'Состояние', align: 'left', kind: 'text',
        values: {
          air: 'Газ', helium: 'Газ', water: 'Жидкость', ice: 'Твёрдое', pine: 'Твёрдое',
          plexi: 'Твёрдое', concrete: 'Твёрдое', granite: 'Твёрдое', glass: 'Твёрдое',
          steel: 'Твёрдое', lead: 'Твёрдое'
        }
      },
      {
        id: 'clong', label: 'Продольная волна c∥', unit: 'м/с', align: 'center', kind: 'number',
        values: {
          air: 331, helium: 965, water: 1500, ice: 3200, pine: 5000, plexi: 2700,
          concrete: 4500, granite: 5400, glass: 5600, steel: 5900, lead: 2160
        }
      },
      {
        id: 'ctrans', label: 'Поперечная волна c⊥', unit: 'м/с', align: 'center', kind: 'number',
        values: {
          air: 0, helium: 0, water: 0, ice: 1600, pine: 1400, plexi: 1330,
          concrete: 2600, granite: 3000, glass: 3400, steel: 3230, lead: 700
        }
      },
      {
        id: 'density', label: 'Плотность', unit: 'кг/м³', align: 'center', kind: 'number',
        values: {
          air: 1.29, helium: 0.18, water: 1000, ice: 917, pine: 520, plexi: 1180,
          concrete: 2300, granite: 2700, glass: 2500, steel: 7800, lead: 11340
        }
      },
      {
        id: 'young', label: 'Модуль Юнга', unit: 'ГПа', align: 'center', kind: 'number',
        values: {
          air: 0, helium: 0, water: 0, ice: 9, pine: 11, plexi: 3,
          concrete: 30, granite: 50, glass: 70, steel: 210, lead: 16
        }
      },
      {
        id: 'temp', label: 'Температура опыта', unit: '°C', align: 'center', kind: 'number',
        values: {
          air: 0, helium: 0, water: 20, ice: -10, pine: 20, plexi: 20,
          concrete: 20, granite: 20, glass: 20, steel: 20, lead: 20
        }
      },
      {
        id: 'usage', label: 'Где важно', align: 'left', kind: 'text',
        values: {
          air: 'Акустика зала', helium: 'Голос водолаза', water: 'Эхолот', ice: 'Ледовая разведка',
          pine: 'Скрипки', plexi: 'Линзы датчиков', concrete: 'Поиск трещин',
          granite: 'Сейсморазведка', glass: 'Контроль стекла', steel: 'Дефектоскопия',
          lead: 'Защита от шума'
        }
      },
      {
        id: 'tests', label: 'Проб измерено', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          air: 12, helium: 4, water: { min: 10, max: 30, step: 5 }, ice: 8, pine: 6, plexi: 5,
          concrete: { min: 20, max: 60, step: 10 }, granite: 14, glass: 9,
          steel: { min: 30, max: 70, step: 10 }, lead: 3
        }
      }
    ],
    headerGroups: [{ label: 'Скорость волн, м/с', columnIds: ['clong', 'ctrans'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-24',
    level: 3,
    tags: ['физика', 'химия'],
    titleRow: 'Радиоактивные изотопы на службе у человека',
    objectColumnLabel: 'Изотоп',
    rows: [
      { id: 'pm147', label: 'Прометий-147' },
      { id: 'fe55', label: 'Железо-55' },
      { id: 'co60', label: 'Кобальт-60' },
      { id: 'h3', label: 'Тритий' },
      { id: 'pb210', label: 'Свинец-210' },
      { id: 'sr90', label: 'Стронций-90' },
      { id: 'cs137', label: 'Цезий-137' },
      { id: 'am241', label: 'Америций-241' },
      { id: 'ra226', label: 'Радий-226' },
      { id: 'c14', label: 'Углерод-14' },
      { id: 'pu239', label: 'Плутоний-239' }
    ],
    columns: [
      {
        id: 'symbol', label: 'Обозначение', align: 'center', kind: 'text',
        values: {
          pm147: '¹⁴⁷Pm', fe55: '⁵⁵Fe', co60: '⁶⁰Co', h3: '³H', pb210: '²¹⁰Pb', sr90: '⁹⁰Sr',
          cs137: '¹³⁷Cs', am241: '²⁴¹Am', ra226: '²²⁶Ra', c14: '¹⁴C', pu239: '²³⁹Pu'
        }
      },
      {
        id: 'protons', label: 'Протонов', align: 'center', kind: 'number',
        values: {
          pm147: 61, fe55: 26, co60: 27, h3: 1, pb210: 82, sr90: 38,
          cs137: 55, am241: 95, ra226: 88, c14: 6, pu239: 94
        }
      },
      {
        id: 'neutrons', label: 'Нейтронов', align: 'center', kind: 'number',
        values: {
          pm147: 86, fe55: 29, co60: 33, h3: 2, pb210: 128, sr90: 52,
          cs137: 82, am241: 146, ra226: 138, c14: 8, pu239: 145
        }
      },
      {
        id: 'halflife', label: 'Период полураспада', unit: 'лет', align: 'center', kind: 'number',
        values: {
          pm147: 2.6, fe55: 2.7, co60: 5.3, h3: 12.3, pb210: 22.2, sr90: 28.8,
          cs137: 30.1, am241: 432.6, ra226: 1600, c14: 5700, pu239: 24110
        }
      },
      {
        id: 'radiation', label: 'Излучение', align: 'center', kind: 'text',
        values: {
          pm147: 'β⁻', fe55: 'Захват e⁻', co60: 'β⁻ и γ', h3: 'β⁻', pb210: 'β⁻', sr90: 'β⁻',
          cs137: 'β⁻ и γ', am241: 'α и γ', ra226: 'α', c14: 'β⁻', pu239: 'α'
        }
      },
      {
        id: 'energy', label: 'Энергия распада', unit: 'МэВ', align: 'center', kind: 'number',
        values: {
          pm147: 0.2, fe55: 0.2, co60: 2.8, h3: 0.02, pb210: 0.1, sr90: 0.5,
          cs137: 1.2, am241: 5.6, ra226: 4.9, c14: 0.2, pu239: 5.2
        }
      },
      {
        id: 'use', label: 'Применение', align: 'left', kind: 'text',
        values: {
          pm147: 'Светящиеся метки', fe55: 'Анализ сплавов', co60: 'Стерилизация',
          h3: 'Подсветка стрелок', pb210: 'Датировка ила', sr90: 'Толщиномеры',
          cs137: 'Плотномеры', am241: 'Датчики дыма', ra226: 'Музейные образцы',
          c14: 'Датировка находок', pu239: 'Ядерное топливо'
        }
      },
      {
        id: 'sources', label: 'Источников в лаб.', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          pm147: 2, fe55: { min: 4, max: 12, step: 2 }, co60: 3, h3: { min: 5, max: 25, step: 5 },
          pb210: 2, sr90: 6, cs137: { min: 4, max: 16, step: 3 }, am241: 9, ra226: 1, c14: 4, pu239: 0
        }
      }
    ],
    headerGroups: [{ label: 'Состав ядра', columnIds: ['protons', 'neutrons'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-25',
    level: 3,
    tags: ['физика', 'оптика'],
    titleRow: 'От инфракрасного к ультрафиолету',
    objectColumnLabel: 'Излучение',
    rows: [
      { id: 'nir', label: 'Ближний ИК' },
      { id: 'deepred', label: 'Тёмно-красный' },
      { id: 'red', label: 'Красный' },
      { id: 'orange', label: 'Оранжевый' },
      { id: 'yellow', label: 'Жёлтый' },
      { id: 'green', label: 'Зелёный' },
      { id: 'cyan', label: 'Голубой' },
      { id: 'blue', label: 'Синий' },
      { id: 'violet', label: 'Фиолетовый' },
      { id: 'uva', label: 'Ультрафиолет A' },
      { id: 'uvc', label: 'Ультрафиолет C' }
    ],
    columns: [
      {
        id: 'wavelength', label: 'Длина волны λ', unit: 'нм', align: 'center', kind: 'number',
        values: {
          nir: 1000, deepred: 750, red: 700, orange: 610, yellow: 580, green: 530,
          cyan: 490, blue: 460, violet: 410, uva: 350, uvc: 250
        }
      },
      {
        id: 'frequency', label: 'Частота ν', unit: 'ТГц', align: 'center', kind: 'number',
        values: {
          nir: 300, deepred: 400, red: 428, orange: 492, yellow: 517, green: 566,
          cyan: 612, blue: 652, violet: 732, uva: 857, uvc: 1200
        }
      },
      {
        id: 'energy', label: 'Энергия фотона', unit: 'эВ', align: 'center', kind: 'number',
        values: {
          nir: 1.2, deepred: 1.7, red: 1.8, orange: 2, yellow: 2.1, green: 2.3,
          cyan: 2.5, blue: 2.7, violet: 3, uva: 3.5, uvc: 5
        }
      },
      {
        id: 'visible', label: 'Виден глазом', align: 'center', kind: 'text',
        values: {
          nir: 'Нет', deepred: 'Едва', red: 'Да', orange: 'Да', yellow: 'Да', green: 'Да',
          cyan: 'Да', blue: 'Да', violet: 'Едва', uva: 'Нет', uvc: 'Нет'
        }
      },
      {
        id: 'sensitivity', label: 'Чувствительность глаза', unit: '%', align: 'center', kind: 'number',
        values: {
          nir: 0, deepred: 1, red: 4, orange: 50, yellow: 87, green: 100,
          cyan: 61, blue: 6, violet: 1, uva: 0, uvc: 0
        }
      },
      {
        id: 'glass', label: 'Проходит стекло', align: 'center', kind: 'text',
        values: {
          nir: 'Да', deepred: 'Да', red: 'Да', orange: 'Да', yellow: 'Да', green: 'Да',
          cyan: 'Да', blue: 'Да', violet: 'Да', uva: 'Частично', uvc: 'Нет'
        }
      },
      {
        id: 'use', label: 'Где встречается', align: 'left', kind: 'text',
        values: {
          nir: 'Пульт телевизора', deepred: 'Досветка растений', red: 'Лазерная указка',
          orange: 'Фонари шоссе', yellow: 'Пламя натрия', green: 'Зелень листвы',
          cyan: 'Экраны мониторов', blue: 'Светодиоды', violet: 'Проверка купюр',
          uva: 'Загар', uvc: 'Обеззараживание'
        }
      },
      {
        id: 'lamps', label: 'Ламп в кабинете', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          nir: 2, deepred: 3, red: { min: 4, max: 12, step: 2 }, orange: 2, yellow: 3,
          green: { min: 5, max: 15, step: 5 }, cyan: 2, blue: 6, violet: 2, uva: 3,
          uvc: { min: 1, max: 5, step: 1 }
        }
      }
    ],
    headerGroups: [{ label: 'Волна и её частота', columnIds: ['wavelength', 'frequency'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-26',
    level: 3,
    tags: ['география', 'море'],
    titleRow: 'Солёность морей и что из неё следует',
    objectColumnLabel: 'Море',
    rows: [
      { id: 'baltic', label: 'Балтийское' },
      { id: 'azov', label: 'Азовское' },
      { id: 'caspian', label: 'Каспийское' },
      { id: 'black', label: 'Чёрное' },
      { id: 'white', label: 'Белое' },
      { id: 'okhotsk', label: 'Охотское' },
      { id: 'japan', label: 'Японское' },
      { id: 'barents', label: 'Баренцево' },
      { id: 'north', label: 'Северное' },
      { id: 'mediterranean', label: 'Средиземное' },
      { id: 'red', label: 'Красное' }
    ],
    columns: [
      {
        id: 'ocean', label: 'Бассейн', align: 'left', kind: 'text',
        values: {
          baltic: 'Атлантический', azov: 'Атлантический', caspian: 'Бессточное',
          black: 'Атлантический', white: 'Северный Ледовитый', okhotsk: 'Тихий',
          japan: 'Тихий', barents: 'Северный Ледовитый', north: 'Атлантический',
          mediterranean: 'Атлантический', red: 'Индийский'
        }
      },
      {
        id: 'salinity', label: 'Солёность', unit: '‰', align: 'center', kind: 'number',
        values: {
          baltic: 7, azov: 11, caspian: 12.8, black: 18, white: 26, okhotsk: 32,
          japan: 34, barents: 35, north: 35, mediterranean: 38, red: 42
        }
      },
      {
        id: 'density', label: 'Плотность воды', unit: 'кг/м³', align: 'center', kind: 'number',
        values: {
          baltic: 1005, azov: 1008, caspian: 1010, black: 1013, white: 1020, okhotsk: 1025,
          japan: 1026, barents: 1027, north: 1027, mediterranean: 1029, red: 1031
        }
      },
      {
        id: 'freeze', label: 'Замерзает при', unit: '°C', align: 'center', kind: 'number',
        values: {
          baltic: -0.4, azov: -0.6, caspian: -0.7, black: -1, white: -1.4, okhotsk: -1.7,
          japan: -1.8, barents: -1.9, north: -1.9, mediterranean: -2.1, red: -2.3
        }
      },
      {
        id: 'area', label: 'Площадь', unit: 'тыс. км²', align: 'center', kind: 'number',
        values: {
          baltic: 415, azov: 39, caspian: 371, black: 422, white: 90, okhotsk: 1603,
          japan: 1062, barents: 1424, north: 750, mediterranean: 2500, red: 450
        }
      },
      {
        id: 'depth', label: 'Наибольшая глубина', unit: 'м', align: 'center', kind: 'number',
        values: {
          baltic: 470, azov: 13.5, caspian: 1025, black: 2210, white: 343, okhotsk: 3521,
          japan: 3742, barents: 600, north: 725, mediterranean: 5121, red: 3040
        }
      },
      {
        id: 'august', label: 'Вода в августе', unit: '°C', align: 'center', kind: 'number',
        values: {
          baltic: 17, azov: 25, caspian: 26, black: 24, white: 12, okhotsk: 10,
          japan: 22, barents: 8, north: 17, mediterranean: 26, red: 30
        }
      },
      {
        id: 'probes', label: 'Проб за месяц', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          baltic: { min: 20, max: 60, step: 10 }, azov: 15, caspian: 18, black: { min: 25, max: 45, step: 5 },
          white: 10, okhotsk: 12, japan: 14, barents: 16, north: { min: 30, max: 70, step: 10 },
          mediterranean: 22, red: 9
        }
      }
    ],
    headerGroups: [{ label: 'Свойства воды', columnIds: ['salinity', 'density'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-27',
    level: 3,
    tags: ['физика', 'история техники'],
    titleRow: 'Часы: как росла точность времени',
    objectColumnLabel: 'Прибор',
    rows: [
      { id: 'sundial', label: 'Солнечные часы' },
      { id: 'sandglass', label: 'Песочные часы' },
      { id: 'pendulum', label: 'Маятниковые часы' },
      { id: 'chronometer', label: 'Морской хронометр' },
      { id: 'shortt', label: 'Часы Шортта' },
      { id: 'quartz', label: 'Кварцевые часы' },
      { id: 'ammonia', label: 'Аммиачные часы' },
      { id: 'nbs1', label: 'Цезиевые NBS-1' },
      { id: 'fountain', label: 'Цезиевый фонтан' },
      { id: 'maser', label: 'Водородный мазер' },
      { id: 'strontium', label: 'Стронциевые часы' }
    ],
    columns: [
      {
        id: 'year', label: 'Год появления', align: 'center', kind: 'number',
        values: {
          sundial: -1500, sandglass: 1330, pendulum: 1656, chronometer: 1761, shortt: 1921,
          quartz: 1927, ammonia: 1949, nbs1: 1952, fountain: 1995, maser: 1960, strontium: 2014
        }
      },
      {
        id: 'exponent', label: 'Точность 10⁻ⁿ, число n', align: 'center', kind: 'number',
        values: {
          sundial: 3, sandglass: 2, pendulum: 5, chronometer: 6, shortt: 8, quartz: 9,
          ammonia: 8, nbs1: 10, fountain: 16, maser: 15, strontium: 18
        }
      },
      {
        id: 'drift', label: 'Уход за сутки', unit: 'мс', align: 'center', kind: 'number',
        values: {
          sundial: 86400, sandglass: 864000, pendulum: 864, chronometer: 86, shortt: 0.9,
          quartz: 0.09, ammonia: 0.9, nbs1: 0.009, fountain: 0.0001, maser: 0.001, strontium: 0.0001
        }
      },
      {
        id: 'height', label: 'Высота прибора', unit: 'см', align: 'center', kind: 'number',
        values: {
          sundial: 120, sandglass: 20, pendulum: 200, chronometer: 18, shortt: 190, quartz: 3,
          ammonia: 180, nbs1: 200, fountain: 250, maser: 130, strontium: 200
        }
      },
      {
        id: 'mass', label: 'Масса прибора', unit: 'кг', align: 'center', kind: 'number',
        values: {
          sundial: 300, sandglass: 1, pendulum: 40, chronometer: 3, shortt: 60, quartz: 0.1,
          ammonia: 200, nbs1: 400, fountain: 800, maser: 250, strontium: 1000
        }
      },
      {
        id: 'power', label: 'Потребление', unit: 'Вт', align: 'center', kind: 'number',
        values: {
          sundial: 0, sandglass: 0, pendulum: 0, chronometer: 0, shortt: 5, quartz: 0.001,
          ammonia: 300, nbs1: 500, fountain: 1500, maser: 400, strontium: 4000
        }
      },
      {
        id: 'basis', label: 'Что отмеряет ход', align: 'left', kind: 'text',
        values: {
          sundial: 'Тень Солнца', sandglass: 'Струя песка', pendulum: 'Качание маятника',
          chronometer: 'Пружина и баланс', shortt: 'Два маятника', quartz: 'Кристалл кварца',
          ammonia: 'Молекула NH₃', nbs1: 'Атом ¹³³Cs', fountain: 'Атом ¹³³Cs',
          maser: 'Атом ¹H', strontium: 'Атом ⁸⁷Sr'
        }
      },
      {
        id: 'units', label: 'Действующих в мире', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          sundial: { min: 200, max: 600, step: 100 }, sandglass: { min: 100, max: 500, step: 100 },
          pendulum: 400, chronometer: 150, shortt: 20, quartz: 900, ammonia: 2, nbs1: 1,
          fountain: { min: 10, max: 30, step: 5 }, maser: 60, strontium: 12
        }
      }
    ],
    headerGroups: [{ label: 'Точность хода', columnIds: ['exponent', 'drift'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-28',
    level: 3,
    tags: ['космос', 'химия'],
    titleRow: 'Чем заправляют ракеты',
    objectColumnLabel: 'Топливная пара',
    rows: [
      { id: 'powder', label: 'Чёрный порох' },
      { id: 'peroxide', label: 'Перекись водорода' },
      { id: 'hydrazine', label: 'Гидразин' },
      { id: 'solid', label: 'Твёрдотопливная смесь' },
      { id: 'kerosene', label: 'Керосин и кислород' },
      { id: 'udmh', label: 'НДМГ и тетроксид' },
      { id: 'methane', label: 'Метан и кислород' },
      { id: 'alcohol', label: 'Спирт и кислород' },
      { id: 'hydrogen', label: 'Водород и кислород' },
      { id: 'nuclear', label: 'Ядерный подогрев H₂' },
      { id: 'xenon', label: 'Ксенон в двигателе' }
    ],
    columns: [
      {
        id: 'formula', label: 'Горючее', align: 'center', kind: 'text',
        values: {
          powder: 'KNO₃ и C', peroxide: 'H₂O₂', hydrazine: 'N₂H₄', solid: 'Al и NH₄ClO₄',
          kerosene: 'RP-1 и O₂', udmh: 'C₂H₈N₂ и N₂O₄', methane: 'CH₄ и O₂',
          alcohol: 'C₂H₅OH и O₂', hydrogen: 'H₂ и O₂', nuclear: 'H₂', xenon: 'Xe'
        }
      },
      {
        id: 'impulse', label: 'Удельный импульс', unit: 'с', align: 'center', kind: 'number',
        values: {
          powder: 80, peroxide: 160, hydrazine: 230, solid: 268, kerosene: 338, udmh: 333,
          methane: 380, alcohol: 255, hydrogen: 452, nuclear: 850, xenon: 3000
        }
      },
      {
        id: 'thrust', label: 'Тяга двигателя', unit: 'кН', align: 'center', kind: 'number',
        values: {
          powder: 1, peroxide: 5, hydrazine: 0.5, solid: 12500, kerosene: 4152, udmh: 1750,
          methane: 2300, alcohol: 250, hydrogen: 2279, nuclear: 246, xenon: 0.2
        }
      },
      {
        id: 'density', label: 'Плотность топлива', unit: 'г/см³', align: 'center', kind: 'number',
        values: {
          powder: 1.6, peroxide: 1.4, hydrazine: 1, solid: 1.8, kerosene: 1, udmh: 1.2,
          methane: 0.8, alcohol: 1, hydrogen: 0.4, nuclear: 0.1, xenon: 1.6
        }
      },
      {
        id: 'chamber', label: 'Температура в камере', unit: '°C', align: 'center', kind: 'number',
        values: {
          powder: 2000, peroxide: 750, hydrazine: 900, solid: 3300, kerosene: 3600, udmh: 3400,
          methane: 3500, alcohol: 3000, hydrogen: 3300, nuclear: 2500, xenon: 0
        }
      },
      {
        id: 'first', label: 'Первый полёт', unit: 'год', align: 'center', kind: 'number',
        values: {
          powder: 1232, peroxide: 1949, hydrazine: 1962, solid: 1960, kerosene: 1957, udmh: 1965,
          methane: 2023, alcohol: 1942, hydrogen: 1963, nuclear: 0, xenon: 1964
        }
      },
      {
        id: 'storage', label: 'Хранение', align: 'left', kind: 'text',
        values: {
          powder: 'Годами', peroxide: 'Месяцами', hydrazine: 'Годами', solid: 'Годами',
          kerosene: 'Часами', udmh: 'Годами', methane: 'Сутками', alcohol: 'Часами',
          hydrogen: 'Часами', nuclear: 'Часами', xenon: 'Годами'
        }
      },
      {
        id: 'launches', label: 'Пусков за год', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          powder: 0, peroxide: 0, hydrazine: { min: 20, max: 60, step: 10 }, solid: 30,
          kerosene: { min: 80, max: 160, step: 20 }, udmh: 25, methane: { min: 5, max: 25, step: 5 },
          alcohol: 0, hydrogen: 12, nuclear: 0, xenon: 8
        }
      }
    ],
    headerGroups: [{ label: 'Работа двигателя', columnIds: ['impulse', 'thrust'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-29',
    level: 3,
    tags: ['химия', 'быт'],
    titleRow: 'Кислотность привычных жидкостей',
    objectColumnLabel: 'Жидкость',
    rows: [
      { id: 'gastric', label: 'Желудочный сок' },
      { id: 'lemon', label: 'Лимонный сок' },
      { id: 'vinegar', label: 'Уксус столовый' },
      { id: 'cola', label: 'Газировка' },
      { id: 'tomato', label: 'Томатный сок' },
      { id: 'coffee', label: 'Кофе' },
      { id: 'milk', label: 'Молоко' },
      { id: 'water', label: 'Чистая вода' },
      { id: 'blood', label: 'Кровь' },
      { id: 'seawater', label: 'Морская вода' },
      { id: 'soap', label: 'Мыльный раствор' }
    ],
    columns: [
      {
        id: 'ph', label: 'Показатель pH', align: 'center', kind: 'number',
        values: {
          gastric: 1.5, lemon: 2.4, vinegar: 2.9, cola: 3.4, tomato: 4.1, coffee: 5,
          milk: 6.7, water: 7, blood: 7.4, seawater: 8.1, soap: 10
        }
      },
      {
        id: 'hplus', label: 'Ионы H⁺, 10⁻ⁿ моль/л', align: 'center', kind: 'number',
        values: {
          gastric: 2, lemon: 2, vinegar: 3, cola: 3, tomato: 4, coffee: 5,
          milk: 7, water: 7, blood: 7, seawater: 8, soap: 10
        }
      },
      {
        id: 'medium', label: 'Среда', align: 'center', kind: 'text',
        values: {
          gastric: 'Кислая', lemon: 'Кислая', vinegar: 'Кислая', cola: 'Кислая',
          tomato: 'Кислая', coffee: 'Слабокислая', milk: 'Слабокислая',
          water: 'Нейтральная', blood: 'Слабощелочная', seawater: 'Слабощелочная',
          soap: 'Щелочная'
        }
      },
      {
        id: 'litmus', label: 'Цвет лакмуса', align: 'center', kind: 'text',
        values: {
          gastric: 'Красный', lemon: 'Красный', vinegar: 'Красный', cola: 'Красный',
          tomato: 'Красный', coffee: 'Розовый', milk: 'Розовый', water: 'Фиолетовый',
          blood: 'Фиолетовый', seawater: 'Синеватый', soap: 'Синий'
        }
      },
      {
        id: 'acid', label: 'Главная кислота', align: 'left', kind: 'text',
        values: {
          gastric: 'HCl', lemon: 'Лимонная', vinegar: 'CH₃COOH', cola: 'H₃PO₄',
          tomato: 'Яблочная', coffee: 'Хлорогеновая', milk: 'Молочная', water: 'Нет',
          blood: 'H₂CO₃', seawater: 'H₂CO₃', soap: 'Нет'
        }
      },
      {
        id: 'enamel', label: 'Вредно для эмали', align: 'center', kind: 'text',
        values: {
          gastric: 'Да', lemon: 'Да', vinegar: 'Да', cola: 'Да', tomato: 'Умеренно',
          coffee: 'Умеренно', milk: 'Нет', water: 'Нет', blood: 'Нет', seawater: 'Нет',
          soap: 'Нет'
        }
      },
      {
        id: 'temp', label: 'Температура пробы', unit: '°C', align: 'center', kind: 'number',
        values: {
          gastric: 37, lemon: 20, vinegar: 20, cola: 8, tomato: 20, coffee: 60,
          milk: 5, water: 25, blood: 37, seawater: 15, soap: 40
        }
      },
      {
        id: 'volume', label: 'Взято на опыт', unit: 'мл', align: 'center', kind: 'number', total: 'sum',
        values: {
          gastric: 5, lemon: { min: 20, max: 60, step: 10 }, vinegar: 25, cola: { min: 50, max: 150, step: 25 },
          tomato: 40, coffee: 30, milk: { min: 30, max: 70, step: 10 }, water: 100,
          blood: 2, seawater: 50, soap: 60
        }
      }
    ],
    headerGroups: [{ label: 'Кислотность раствора', columnIds: ['ph', 'hplus'] }],
    totalsRow: { label: 'Итого' }
  },

  {
    id: 'table-l3-30',
    level: 3,
    tags: ['техника', 'энергия'],
    titleRow: 'КПД двигателей и преобразователей',
    objectColumnLabel: 'Устройство',
    rows: [
      { id: 'steam', label: 'Паровая машина' },
      { id: 'petrol', label: 'Бензиновый ДВС' },
      { id: 'jet', label: 'Турбореактивный' },
      { id: 'gasturbine', label: 'Газовая турбина' },
      { id: 'diesel', label: 'Дизель судовой' },
      { id: 'steamturbine', label: 'Паровая турбина' },
      { id: 'solar', label: 'Солнечная панель' },
      { id: 'fuelcell', label: 'Топливный элемент' },
      { id: 'wind', label: 'Ветрогенератор' },
      { id: 'hydro', label: 'Гидротурбина' },
      { id: 'electric', label: 'Электродвигатель' }
    ],
    columns: [
      {
        id: 'efficiency', label: 'КПД', unit: '%', align: 'center', kind: 'number',
        values: {
          steam: 8, petrol: 25, jet: 30, gasturbine: 38, diesel: 50, steamturbine: 42,
          solar: 22, fuelcell: 60, wind: 45, hydro: 92, electric: 95
        }
      },
      {
        id: 'losses', label: 'Потери', unit: '%', align: 'center', kind: 'number',
        values: {
          steam: 92, petrol: 75, jet: 70, gasturbine: 62, diesel: 50, steamturbine: 58,
          solar: 78, fuelcell: 40, wind: 55, hydro: 8, electric: 5
        }
      },
      {
        id: 'power', label: 'Типичная мощность', unit: 'кВт', align: 'center', kind: 'number',
        values: {
          steam: 40, petrol: 90, jet: 30000, gasturbine: 150000, diesel: 80000,
          steamturbine: 500000, solar: 0.4, fuelcell: 100, wind: 3000, hydro: 200000,
          electric: 15
        }
      },
      {
        id: 'temp', label: 'Рабочая температура', unit: '°C', align: 'center', kind: 'number',
        values: {
          steam: 180, petrol: 2200, jet: 1600, gasturbine: 1400, diesel: 1800,
          steamturbine: 560, solar: 45, fuelcell: 80, wind: 20, hydro: 15, electric: 90
        }
      },
      {
        id: 'year', label: 'Год появления', align: 'center', kind: 'number',
        values: {
          steam: 1712, petrol: 1876, jet: 1939, gasturbine: 1939, diesel: 1897,
          steamturbine: 1884, solar: 1954, fuelcell: 1839, wind: 1887, hydro: 1878,
          electric: 1834
        }
      },
      {
        id: 'fuel', label: 'Источник энергии', align: 'left', kind: 'text',
        values: {
          steam: 'Уголь', petrol: 'Бензин', jet: 'Керосин', gasturbine: 'Природный газ',
          diesel: 'Мазут', steamturbine: 'Пар', solar: 'Свет', fuelcell: 'Водород',
          wind: 'Ветер', hydro: 'Напор воды', electric: 'Электросеть'
        }
      },
      {
        id: 'co2', label: 'Выброс CO₂', unit: 'г/кВт·ч', align: 'center', kind: 'number',
        values: {
          steam: 1100, petrol: 820, jet: 780, gasturbine: 490, diesel: 650,
          steamturbine: 820, solar: 45, fuelcell: 0, wind: 11, hydro: 24, electric: 0
        }
      },
      {
        id: 'units', label: 'Установок на объекте', unit: 'шт.', align: 'center', kind: 'number', total: 'sum',
        values: {
          steam: 1, petrol: { min: 10, max: 30, step: 5 }, jet: 4, gasturbine: 3, diesel: 2,
          steamturbine: 2, solar: { min: 100, max: 500, step: 100 }, fuelcell: 5,
          wind: { min: 10, max: 50, step: 10 }, hydro: 6, electric: 40
        }
      }
    ],
    headerGroups: [{ label: 'Баланс энергии, %', columnIds: ['efficiency', 'losses'] }],
    totalsRow: { label: 'Итого' }
  }
];
