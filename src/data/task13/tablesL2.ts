import { Task13TableSrc } from '../task13data';

export const TASK13_TABLES_L2: Task13TableSrc[] = [
  // --- УРОВЕНЬ 2 ---
  {
  id: 'table-l2-1',
  level: 2,
  tags: ['космос', 'техника'],
  titleRow: 'Аппараты, покинувшие окрестности Земли',
  objectColumnLabel: 'Аппарат',
  rows: [
    { id: 'voyager1', label: 'Вояджер-1' },
    { id: 'voyager2', label: 'Вояджер-2' },
    { id: 'pioneer10', label: 'Пионер-10' },
    { id: 'newhorizons', label: 'Новые горизонты' },
    { id: 'cassini', label: 'Кассини' },
    { id: 'juno', label: 'Юнона' },
    { id: 'curiosity', label: 'Кьюриосити' },
    { id: 'parker', label: 'Паркер' },
    { id: 'rosetta', label: 'Розетта' },
    { id: 'hayabusa2', label: 'Хаябуса-2' }
  ],
  columns: [
    {
      id: 'launch', label: 'Год запуска',
      align: 'center', kind: 'number',
      values: { voyager1: 1977, voyager2: 1977, pioneer10: 1972, newhorizons: 2006,
                cassini: 1997, juno: 2011, curiosity: 2011, parker: 2018,
                rosetta: 2004, hayabusa2: 2014 }
    },
    {
      id: 'mass', label: 'Масса при запуске', unit: 'кг',
      align: 'center', kind: 'number',
      values: { voyager1: 825, voyager2: 825, pioneer10: 258, newhorizons: 478,
                cassini: 5712, juno: 3625, curiosity: 899, parker: 685,
                rosetta: 3000, hayabusa2: 609 }
    },
    {
      id: 'target', label: 'Цель полёта',
      align: 'left', kind: 'text',
      values: { voyager1: 'Юпитер и Сатурн', voyager2: 'Планеты-гиганты',
                pioneer10: 'Юпитер', newhorizons: 'Плутон', cassini: 'Сатурн',
                juno: 'Юпитер', curiosity: 'Марс', parker: 'Солнце',
                rosetta: 'Комета', hayabusa2: 'Астероид' }
    },
    {
      id: 'speed', label: 'Скорость', unit: 'км/с',
      align: 'center', kind: 'number',
      values: { voyager1: 17, voyager2: 15.4, pioneer10: 12, newhorizons: 14,
                cassini: 11, juno: 25, curiosity: 6, parker: 190,
                rosetta: 10, hayabusa2: 9 }
    },
    {
      id: 'power', label: 'Источник энергии',
      align: 'center', kind: 'text',
      values: { voyager1: 'Изотопный', voyager2: 'Изотопный', pioneer10: 'Изотопный',
                newhorizons: 'Изотопный', cassini: 'Изотопный', juno: 'Солнечный',
                curiosity: 'Изотопный', parker: 'Солнечный', rosetta: 'Солнечный',
                hayabusa2: 'Солнечный' }
    },
    {
      id: 'active', label: 'Работает сейчас',
      align: 'center', kind: 'text',
      values: { voyager1: 'Да', voyager2: 'Да', pioneer10: 'Нет',
                newhorizons: 'Да', cassini: 'Нет', juno: 'Да',
                curiosity: 'Да', parker: 'Да', rosetta: 'Нет', hayabusa2: 'Да' }
    }
  ]
},
{
  id: 'table-l2-2',
  level: 2,
  tags: ['языки', 'мир'],
  titleRow: 'Языки мира: носители, письменность, распространение',
  objectColumnLabel: 'Язык',
  rows: [
    { id: 'chinese', label: 'Китайский' },
    { id: 'english', label: 'Английский' },
    { id: 'hindi', label: 'Хинди' },
    { id: 'spanish', label: 'Испанский' },
    { id: 'arabic', label: 'Арабский' },
    { id: 'russian', label: 'Русский' },
    { id: 'portuguese', label: 'Португальский' },
    { id: 'japanese', label: 'Японский' },
    { id: 'german', label: 'Немецкий' },
    { id: 'korean', label: 'Корейский' }
  ],
  columns: [
    {
      id: 'native', label: 'Носителей', unit: 'млн чел.',
      align: 'center', kind: 'number',
      values: { chinese: 940, english: 380, hindi: 345, spanish: 485,
                arabic: 280, russian: 150, portuguese: 236, japanese: 123,
                german: 76, korean: 82 }
    },
    {
      id: 'letters', label: 'Знаков в алфавите',
      align: 'center', kind: 'number',
      values: { chinese: 50000, english: 26, hindi: 46, spanish: 27,
                arabic: 28, russian: 33, portuguese: 26, japanese: 46,
                german: 30, korean: 24 }
    },
    {
      id: 'direction', label: 'Направление письма',
      align: 'center', kind: 'text',
      values: { chinese: 'Слева направо', english: 'Слева направо',
                hindi: 'Слева направо', spanish: 'Слева направо',
                arabic: 'Справа налево', russian: 'Слева направо',
                portuguese: 'Слева направо', japanese: 'Слева направо',
                german: 'Слева направо', korean: 'Слева направо' }
    },
    {
      id: 'countries', label: 'Стран с этим языком',
      align: 'center', kind: 'number',
      values: { chinese: 5, english: 67, hindi: 2, spanish: 21,
                arabic: 25, russian: 5, portuguese: 9, japanese: 1,
                german: 6, korean: 2 }
    },
    {
      id: 'family', label: 'Семья',
      align: 'left', kind: 'text',
      values: { chinese: 'Сино-тибетская', english: 'Индоевропейская',
                hindi: 'Индоевропейская', spanish: 'Индоевропейская',
                arabic: 'Семитская', russian: 'Индоевропейская',
                portuguese: 'Индоевропейская', japanese: 'Японская',
                german: 'Индоевропейская', korean: 'Корейская' }
    },
    {
      id: 'learners', label: 'Изучают в школе', unit: 'тыс. чел.',
      align: 'center', kind: 'number',
      values: {
        chinese: { min: 40, max: 120, step: 20 },
        english: { min: 800, max: 1400, step: 100 },
        hindi: 5,
        spanish: { min: 60, max: 140, step: 20 },
        arabic: 15,
        russian: 900,
        portuguese: 8,
        japanese: { min: 10, max: 50, step: 8 },
        german: { min: 150, max: 350, step: 40 },
        korean: 25
      }
    }
  ]
},
{
  id: 'table-l2-3',
  level: 2,
  tags: ['биология', 'сон'],
  titleRow: 'Сколько спят разные животные',
  objectColumnLabel: 'Животное',
  rows: [
    { id: 'koala', label: 'Коала' },
    { id: 'bat', label: 'Летучая мышь' },
    { id: 'cat', label: 'Домашняя кошка' },
    { id: 'human', label: 'Человек' },
    { id: 'dolphin', label: 'Дельфин' },
    { id: 'elephant', label: 'Слон' },
    { id: 'giraffe', label: 'Жираф' },
    { id: 'horse', label: 'Лошадь' },
    { id: 'sloth', label: 'Ленивец' },
    { id: 'penguin', label: 'Пингвин' }
  ],
  columns: [
    {
      id: 'sleep', label: 'Сон в сутки', unit: 'ч',
      align: 'center', kind: 'number',
      values: { koala: 20, bat: 19, cat: 15, human: 8, dolphin: 10,
                elephant: 4, giraffe: 2, horse: 3, sloth: 15, penguin: 11 }
    },
    {
      id: 'position', label: 'Поза сна',
      align: 'center', kind: 'text',
      values: { koala: 'Сидя', bat: 'Вниз головой', cat: 'Лёжа', human: 'Лёжа',
                dolphin: 'В движении', elephant: 'Стоя', giraffe: 'Стоя',
                horse: 'Стоя', sloth: 'Вися', penguin: 'Стоя' }
    },
    {
      id: 'brain', label: 'Спит полмозга',
      align: 'center', kind: 'text',
      values: { koala: 'Нет', bat: 'Нет', cat: 'Нет', human: 'Нет',
                dolphin: 'Да', elephant: 'Нет', giraffe: 'Нет', horse: 'Нет',
                sloth: 'Нет', penguin: 'Да' }
    },
    {
      id: 'dreams', label: 'Фаза снов', unit: 'мин',
      align: 'center', kind: 'number',
      values: { koala: 30, bat: 110, cat: 200, human: 100, dolphin: 20,
                elephant: 60, giraffe: 25, horse: 40, sloth: 90, penguin: 45 }
    },
    {
      id: 'weight', label: 'Масса', unit: 'кг',
      align: 'center', kind: 'number',
      values: { koala: 12, bat: 0.03, cat: 4, human: 70, dolphin: 200,
                elephant: 5000, giraffe: 1200, horse: 500, sloth: 6, penguin: 25 }
    },
    {
      id: 'awake', label: 'Активен',
      align: 'center', kind: 'text',
      values: { koala: 'Ночью', bat: 'Ночью', cat: 'В сумерках', human: 'Днём',
                dolphin: 'Круглосуточно', elephant: 'Днём', giraffe: 'Днём',
                horse: 'Днём', sloth: 'Ночью', penguin: 'Днём' }
    }
  ]
},
{
  id: 'table-l2-4',
  level: 2,
  tags: ['информатика', 'история'],
  titleRow: 'Носители информации: от перфокарты до облака',
  objectColumnLabel: 'Носитель',
  rows: [
    { id: 'punchcard', label: 'Перфокарта' },
    { id: 'tape', label: 'Магнитная лента' },
    { id: 'floppy5', label: 'Дискета 5,25″' },
    { id: 'floppy3', label: 'Дискета 3,5″' },
    { id: 'cd', label: 'Компакт-диск' },
    { id: 'dvd', label: 'DVD' },
    { id: 'bluray', label: 'Blu-ray' },
    { id: 'flash', label: 'Флешка' },
    { id: 'hdd', label: 'Жёсткий диск' },
    { id: 'ssd', label: 'Твёрдотельный диск' }
  ],
  columns: [
    {
      id: 'year', label: 'Год появления',
      align: 'center', kind: 'number',
      values: { punchcard: 1890, tape: 1951, floppy5: 1976, floppy3: 1983,
                cd: 1982, dvd: 1996, bluray: 2006, flash: 2000,
                hdd: 1956, ssd: 1991 }
    },
    {
      id: 'capacity', label: 'Ёмкость', unit: 'МБ',
      align: 'center', kind: 'number',
      values: { punchcard: 0.0001, tape: 5, floppy5: 1.2, floppy3: 1.44,
                cd: 700, dvd: 4700, bluray: 25000, flash: 64000,
                hdd: 4000000, ssd: 2000000 }
    },
    {
      id: 'diameter', label: 'Размер', unit: 'см',
      align: 'center', kind: 'number',
      values: { punchcard: 19, tape: 27, floppy5: 13, floppy3: 9,
                cd: 12, dvd: 12, bluray: 12, flash: 6, hdd: 10, ssd: 8 }
    },
    {
      id: 'reusable', label: 'Перезапись',
      align: 'center', kind: 'text',
      values: { punchcard: 'Нет', tape: 'Да', floppy5: 'Да', floppy3: 'Да',
                cd: 'Частично', dvd: 'Частично', bluray: 'Частично',
                flash: 'Да', hdd: 'Да', ssd: 'Да' }
    },
    {
      id: 'life', label: 'Срок хранения', unit: 'лет',
      align: 'center', kind: 'number',
      values: { punchcard: 100, tape: 30, floppy5: 10, floppy3: 10,
                cd: 20, dvd: 25, bluray: 30, flash: 10, hdd: 7, ssd: 10 }
    },
    {
      id: 'inuse', label: 'Используется',
      align: 'center', kind: 'text',
      values: { punchcard: 'Нет', tape: 'В архивах', floppy5: 'Нет',
                floppy3: 'Нет', cd: 'Редко', dvd: 'Редко', bluray: 'Да',
                flash: 'Да', hdd: 'Да', ssd: 'Да' }
    }
  ]
},
{
  id: 'table-l2-5',
  level: 2,
  tags: ['еда', 'страны'],
  titleRow: 'Хлеб разных народов',
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Изделие',
  rows: [
    { id: 'baguette', label: 'Багет' },
    { id: 'lavash', label: 'Лаваш' },
    { id: 'ciabatta', label: 'Чиабатта' },
    { id: 'bagel', label: 'Бейгл' },
    { id: 'tortilla', label: 'Тортилья' },
    { id: 'naan', label: 'Наан' },
    { id: 'borodinsky', label: 'Бородинский' },
    { id: 'pretzel', label: 'Крендель' },
    { id: 'focaccia', label: 'Фокачча' },
    { id: 'pita', label: 'Пита' }
  ],
  columns: [
    {
      id: 'country', label: 'Страна',
      align: 'left', kind: 'text',
      values: { baguette: 'Франция', lavash: 'Армения', ciabatta: 'Италия',
                bagel: 'Польша', tortilla: 'Мексика', naan: 'Индия',
                borodinsky: 'Россия', pretzel: 'Германия', focaccia: 'Италия',
                pita: 'Греция' }
    },
    {
      id: 'weight', label: 'Масса', unit: 'г',
      align: 'center', kind: 'number',
      values: { baguette: 250, lavash: 200, ciabatta: 400, bagel: 100,
                tortilla: 40, naan: 130, borodinsky: 700, pretzel: 120,
                focaccia: 500, pita: 80 }
    },
    {
      id: 'flour', label: 'Мука',
      align: 'center', kind: 'text',
      values: { baguette: 'Пшеничная', lavash: 'Пшеничная', ciabatta: 'Пшеничная',
                bagel: 'Пшеничная', tortilla: 'Кукурузная', naan: 'Пшеничная',
                borodinsky: 'Ржаная', pretzel: 'Пшеничная', focaccia: 'Пшеничная',
                pita: 'Пшеничная' }
    },
    {
      id: 'baking', label: 'Выпечка', unit: 'мин',
      align: 'center', kind: 'number',
      values: { baguette: 25, lavash: 2, ciabatta: 30, bagel: 20,
                tortilla: 1, naan: 4, borodinsky: 55, pretzel: 15,
                focaccia: 25, pita: 6 }
    },
    {
      id: 'temp', label: 'Температура печи', unit: '°C',
      align: 'center', kind: 'number',
      values: { baguette: 240, lavash: 350, ciabatta: 230, bagel: 220,
                tortilla: 260, naan: 300, borodinsky: 200, pretzel: 200,
                focaccia: 220, pita: 280 }
    },
    {
      id: 'sold', label: 'Продано за день', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        baguette: { min: 40, max: 80, step: 10 },
        lavash: { min: 30, max: 70, step: 10 },
        ciabatta: 25,
        bagel: { min: 20, max: 60, step: 8 },
        tortilla: 90,
        naan: 18,
        borodinsky: { min: 50, max: 110, step: 15 },
        pretzel: 22,
        focaccia: 16,
        pita: { min: 35, max: 75, step: 10 }
      }
    }
  ]
},
{
  id: 'table-l2-6',
  level: 2,
  tags: ['игры', 'киберспорт'],
  titleRow: 'Дисциплины школьной лиги по видеоиграм',
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Дисциплина',
  rows: [
    { id: 'strategy', label: 'Стратегия' },
    { id: 'shooter', label: 'Командный шутер' },
    { id: 'racing', label: 'Гонки' },
    { id: 'football', label: 'Футбольный симулятор' },
    { id: 'puzzle', label: 'Головоломки' },
    { id: 'fighting', label: 'Файтинг' },
    { id: 'platformer', label: 'Платформер' },
    { id: 'cards', label: 'Карточная игра' },
    { id: 'rhythm', label: 'Ритм-игра' },
    { id: 'sandbox', label: 'Песочница' }
  ],
  columns: [
    {
      id: 'teamsize', label: 'Игроков в команде',
      align: 'center', kind: 'number',
      values: { strategy: 1, shooter: 5, racing: 1, football: 2, puzzle: 1,
                fighting: 1, platformer: 1, cards: 1, rhythm: 1, sandbox: 4 }
    },
    {
      id: 'match', label: 'Длина матча', unit: 'мин',
      align: 'center', kind: 'number',
      values: { strategy: 35, shooter: 40, racing: 12, football: 20, puzzle: 10,
                fighting: 8, platformer: 15, cards: 25, rhythm: 6, sandbox: 60 }
    },
    {
      id: 'teams', label: 'Команд заявлено',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        strategy: { min: 8, max: 20, step: 3 },
        shooter: { min: 12, max: 28, step: 4 },
        racing: 16,
        football: { min: 10, max: 22, step: 3 },
        puzzle: 24,
        fighting: 18,
        platformer: { min: 6, max: 18, step: 3 },
        cards: 14,
        rhythm: 9,
        sandbox: { min: 5, max: 13, step: 2 }
      }
    },
    {
      id: 'age', label: 'Возраст',
      align: 'center', kind: 'text',
      values: { strategy: '12+', shooter: '14+', racing: '6+', football: '6+',
                puzzle: '6+', fighting: '12+', platformer: '6+', cards: '10+',
                rhythm: '6+', sandbox: '6+' }
    },
    {
      id: 'device', label: 'Платформа',
      align: 'center', kind: 'text',
      values: { strategy: 'Компьютер', shooter: 'Компьютер', racing: 'Приставка',
                football: 'Приставка', puzzle: 'Телефон', fighting: 'Приставка',
                platformer: 'Приставка', cards: 'Телефон', rhythm: 'Телефон',
                sandbox: 'Компьютер' }
    },
    {
      id: 'prize', label: 'Призовой фонд', unit: 'тыс. руб.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        strategy: 30,
        shooter: { min: 40, max: 80, step: 10 },
        racing: 20,
        football: 25,
        puzzle: { min: 10, max: 30, step: 5 },
        fighting: 15,
        platformer: 12,
        cards: { min: 8, max: 24, step: 4 },
        rhythm: 10,
        sandbox: 18
      }
    }
  ]
},
{
  id: 'table-l2-7',
  level: 2,
  tags: ['география', 'острова'],
  titleRow: 'Крупнейшие острова планеты',
  objectColumnLabel: 'Остров',
  rows: [
    { id: 'greenland', label: 'Гренландия' },
    { id: 'newguinea', label: 'Новая Гвинея' },
    { id: 'borneo', label: 'Калимантан' },
    { id: 'madagascar', label: 'Мадагаскар' },
    { id: 'baffin', label: 'Баффинова Земля' },
    { id: 'sumatra', label: 'Суматра' },
    { id: 'honshu', label: 'Хонсю' },
    { id: 'britain', label: 'Великобритания' },
    { id: 'sakhalin', label: 'Сахалин' },
    { id: 'iceland', label: 'Исландия' }
  ],
  columns: [
    {
      id: 'area', label: 'Площадь', unit: 'тыс. км²',
      align: 'center', kind: 'number',
      values: { greenland: 2166, newguinea: 786, borneo: 743, madagascar: 587,
                baffin: 507, sumatra: 473, honshu: 228, britain: 209,
                sakhalin: 76, iceland: 103 }
    },
    {
      id: 'population', label: 'Население', unit: 'тыс. чел.',
      align: 'center', kind: 'number',
      values: { greenland: 56, newguinea: 14000, borneo: 23000, madagascar: 30000,
                baffin: 13, sumatra: 59000, honshu: 104000, britain: 61000,
                sakhalin: 460, iceland: 390 }
    },
    {
      id: 'ocean', label: 'Океан',
      align: 'center', kind: 'text',
      values: { greenland: 'Северный Ледовитый', newguinea: 'Тихий',
                borneo: 'Тихий', madagascar: 'Индийский',
                baffin: 'Северный Ледовитый', sumatra: 'Индийский',
                honshu: 'Тихий', britain: 'Атлантический',
                sakhalin: 'Тихий', iceland: 'Атлантический' }
    },
    {
      id: 'top', label: 'Высшая точка', unit: 'м',
      align: 'center', kind: 'number',
      values: { greenland: 3694, newguinea: 4884, borneo: 4095, madagascar: 2876,
                baffin: 2147, sumatra: 3805, honshu: 3776, britain: 1345,
                sakhalin: 1609, iceland: 2110 }
    },
    {
      id: 'states', label: 'Государств на острове',
      align: 'center', kind: 'number',
      values: { greenland: 1, newguinea: 2, borneo: 3, madagascar: 1,
                baffin: 1, sumatra: 1, honshu: 1, britain: 1,
                sakhalin: 1, iceland: 1 }
    },
    {
      id: 'volcanoes', label: 'Действующих вулканов',
      align: 'center', kind: 'number',
      values: {
        greenland: 0,
        newguinea: { min: 10, max: 26, step: 4 },
        borneo: 0,
        madagascar: 0,
        baffin: 0,
        sumatra: { min: 20, max: 40, step: 5 },
        honshu: { min: 30, max: 50, step: 5 },
        britain: 0,
        sakhalin: 0,
        iceland: { min: 25, max: 45, step: 5 }
      }
    }
  ]
},
{
  id: 'table-l2-8',
  level: 2,
  tags: ['театр', 'культура'],
  titleRow: 'Репертуар школьного театра на сезон',
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Спектакль',
  rows: [
    { id: 'snowqueen', label: '«Снежная королева»' },
    { id: 'malenkiy', label: '«Маленький принц»' },
    { id: 'twelve', label: '«Двенадцать месяцев»' },
    { id: 'revizor', label: '«Ревизор»' },
    { id: 'alice', label: '«Алиса в Стране чудес»' },
    { id: 'mio', label: '«Мио, мой Мио»' },
    { id: 'tom', label: '«Том Сойер»' },
    { id: 'scarlet', label: '«Алые паруса»' },
    { id: 'blue', label: '«Синяя птица»' },
    { id: 'oz', label: '«Волшебник Изумрудного города»' }
  ],
  columns: [
    {
      id: 'duration', label: 'Длительность', unit: 'мин',
      align: 'center', kind: 'number',
      values: { snowqueen: 95, malenkiy: 80, twelve: 110, revizor: 140,
                alice: 100, mio: 90, tom: 105, scarlet: 120, blue: 85, oz: 115 }
    },
    {
      id: 'actors', label: 'Занято актёров',
      align: 'center', kind: 'number',
      values: { snowqueen: 18, malenkiy: 8, twelve: 24, revizor: 15,
                alice: 20, mio: 12, tom: 16, scarlet: 14, blue: 22, oz: 19 }
    },
    {
      id: 'costumes', label: 'Костюмов', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        snowqueen: { min: 20, max: 40, step: 5 },
        malenkiy: 10,
        twelve: { min: 25, max: 45, step: 5 },
        revizor: 18,
        alice: { min: 22, max: 42, step: 5 },
        mio: 14,
        tom: 17,
        scarlet: 16,
        blue: { min: 24, max: 48, step: 6 },
        oz: 21
      }
    },
    {
      id: 'shows', label: 'Показов за сезон',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        snowqueen: { min: 8, max: 20, step: 3 },
        malenkiy: 6,
        twelve: { min: 5, max: 13, step: 2 },
        revizor: 4,
        alice: 9,
        mio: 5,
        tom: { min: 4, max: 12, step: 2 },
        scarlet: 7,
        blue: 6,
        oz: { min: 10, max: 22, step: 3 }
      }
    },
    {
      id: 'age', label: 'Зрителям',
      align: 'center', kind: 'text',
      values: { snowqueen: '6+', malenkiy: '10+', twelve: '6+', revizor: '12+',
                alice: '6+', mio: '8+', tom: '8+', scarlet: '12+',
                blue: '6+', oz: '6+' }
    },
    {
      id: 'stage', label: 'Площадка',
      align: 'center', kind: 'text',
      values: { snowqueen: 'Большая сцена', malenkiy: 'Малая сцена',
                twelve: 'Большая сцена', revizor: 'Большая сцена',
                alice: 'Большая сцена', mio: 'Малая сцена',
                tom: 'Малая сцена', scarlet: 'Большая сцена',
                blue: 'Большая сцена', oz: 'Большая сцена' }
    }
  ]
},
{
  id: 'table-l2-9',
  level: 2,
  tags: ['химия', 'газы'],
  titleRow: 'Из чего состоит воздух и что с ним делают',
  objectColumnLabel: 'Газ',
  rows: [
    { id: 'nitrogen', label: 'Азот' },
    { id: 'oxygen', label: 'Кислород' },
    { id: 'argon', label: 'Аргон' },
    { id: 'co2', label: 'Углекислый газ' },
    { id: 'neon', label: 'Неон' },
    { id: 'helium', label: 'Гелий' },
    { id: 'methane', label: 'Метан' },
    { id: 'krypton', label: 'Криптон' },
    { id: 'hydrogen', label: 'Водород' },
    { id: 'ozone', label: 'Озон' }
  ],
  columns: [
    {
      id: 'formula', label: 'Формула',
      align: 'center', kind: 'text',
      values: { nitrogen: 'N₂', oxygen: 'O₂', argon: 'Ar', co2: 'CO₂',
                neon: 'Ne', helium: 'He', methane: 'CH₄', krypton: 'Kr',
                hydrogen: 'H₂', ozone: 'O₃' }
    },
    {
      id: 'share', label: 'Доля в воздухе', unit: '%',
      align: 'center', kind: 'number',
      values: { nitrogen: 78.08, oxygen: 20.95, argon: 0.93, co2: 0.04,
                neon: 0.0018, helium: 0.0005, methane: 0.0002, krypton: 0.0001,
                hydrogen: 0.00005, ozone: 0.000007 }
    },
    {
      id: 'boiling', label: 'Температура кипения', unit: '°C',
      align: 'center', kind: 'number',
      values: { nitrogen: -196, oxygen: -183, argon: -186, co2: -78,
                neon: -246, helium: -269, methane: -162, krypton: -153,
                hydrogen: -253, ozone: -112 }
    },
    {
      id: 'density', label: 'Плотность', unit: 'г/л',
      align: 'center', kind: 'number',
      values: { nitrogen: 1.25, oxygen: 1.43, argon: 1.78, co2: 1.98,
                neon: 0.9, helium: 0.18, methane: 0.72, krypton: 3.75,
                hydrogen: 0.09, ozone: 2.14 }
    },
    {
      id: 'discovered', label: 'Год открытия',
      align: 'center', kind: 'number',
      values: { nitrogen: 1772, oxygen: 1774, argon: 1894, co2: 1754,
                neon: 1898, helium: 1868, methane: 1776, krypton: 1898,
                hydrogen: 1766, ozone: 1840 }
    },
    {
      id: 'use', label: 'Где применяют',
      align: 'left', kind: 'text',
      values: { nitrogen: 'Удобрения', oxygen: 'Медицина', argon: 'Сварка',
                co2: 'Газировка', neon: 'Реклама', helium: 'Шары',
                methane: 'Топливо', krypton: 'Лампы', hydrogen: 'Топливо',
                ozone: 'Очистка воды' }
    }
  ]
},
{
  id: 'table-l2-10',
  level: 2,
  tags: ['экономика', 'быт'],
  titleRow: 'Сколько стоит одно и то же в разные годы',
  objectColumnLabel: 'Товар',
  rows: [
    { id: 'bread', label: 'Батон хлеба' },
    { id: 'milk', label: 'Литр молока' },
    { id: 'egg', label: 'Десяток яиц' },
    { id: 'ticket', label: 'Билет в метро' },
    { id: 'notebook', label: 'Тетрадь' },
    { id: 'icecream', label: 'Мороженое' },
    { id: 'cinema', label: 'Билет в кино' },
    { id: 'haircut', label: 'Стрижка' },
    { id: 'stamp', label: 'Почтовая марка' },
    { id: 'newspaper', label: 'Газета' }
  ],
  columns: [
    {
      id: 'y2000', label: 'Цена в 2000 г.', unit: 'руб.',
      align: 'center', kind: 'number',
      values: { bread: 6, milk: 9, egg: 15, ticket: 4, notebook: 2,
                icecream: 7, cinema: 40, haircut: 50, stamp: 2, newspaper: 4 }
    },
    {
      id: 'y2010', label: 'Цена в 2010 г.', unit: 'руб.',
      align: 'center', kind: 'number',
      values: { bread: 20, milk: 32, egg: 38, ticket: 26, notebook: 8,
                icecream: 25, cinema: 200, haircut: 300, stamp: 10,
                newspaper: 15 }
    },
    {
      id: 'y2025', label: 'Цена в 2025 г.', unit: 'руб.',
      align: 'center', kind: 'number',
      values: {
        bread: { min: 45, max: 75, step: 6 },
        milk: { min: 80, max: 120, step: 8 },
        egg: 130,
        ticket: 70,
        notebook: { min: 15, max: 35, step: 4 },
        icecream: 90,
        cinema: { min: 300, max: 500, step: 40 },
        haircut: 900,
        stamp: 35,
        newspaper: { min: 40, max: 80, step: 8 }
      }
    },
    {
      id: 'growth', label: 'Рост за 25 лет', unit: 'раз',
      align: 'center', kind: 'number',
      values: { bread: 10, milk: 11, egg: 9, ticket: 17, notebook: 12,
                icecream: 13, cinema: 10, haircut: 18, stamp: 17,
                newspaper: 15 }
    },
    {
      id: 'group', label: 'Категория',
      align: 'center', kind: 'text',
      values: { bread: 'Продукты', milk: 'Продукты', egg: 'Продукты',
                ticket: 'Транспорт', notebook: 'Канцелярия',
                icecream: 'Продукты', cinema: 'Досуг', haircut: 'Услуги',
                stamp: 'Услуги', newspaper: 'Пресса' }
    },
    {
      id: 'unit', label: 'За что цена',
      align: 'center', kind: 'text',
      values: { bread: 'За штуку', milk: 'За литр', egg: 'За десяток',
                ticket: 'За поездку', notebook: 'За штуку', icecream: 'За штуку',
                cinema: 'За сеанс', haircut: 'За визит', stamp: 'За штуку',
                newspaper: 'За номер' }
    }
  ]
},
{
  id: 'table-l2-11',
  level: 2,
  tags: ['биология', 'рекорды'],
  titleRow: 'Долгожители живой природы',
  objectColumnLabel: 'Вид',
  rows: [
    { id: 'clam', label: 'Исландская циприна' },
    { id: 'shark', label: 'Гренландская акула' },
    { id: 'tortoise', label: 'Гигантская черепаха' },
    { id: 'whale', label: 'Гренландский кит' },
    { id: 'carp', label: 'Карп кои' },
    { id: 'parrot', label: 'Какаду' },
    { id: 'urchin', label: 'Красный морской ёж' },
    { id: 'sturgeon', label: 'Белуга' },
    { id: 'lobster', label: 'Американский омар' },
    { id: 'batlong', label: 'Ночница Брандта' }
  ],
  columns: [
    {
      id: 'maxage', label: 'Рекорд возраста', unit: 'лет',
      align: 'center', kind: 'number',
      values: { clam: 507, shark: 392, tortoise: 255, whale: 211, carp: 226,
                parrot: 83, urchin: 200, sturgeon: 118, lobster: 140, batlong: 41 }
    },
    {
      id: 'usual', label: 'Обычная жизнь', unit: 'лет',
      align: 'center', kind: 'number',
      values: {
        clam: { min: 200, max: 400, step: 50 },
        shark: { min: 200, max: 300, step: 25 },
        tortoise: 100,
        whale: { min: 100, max: 180, step: 20 },
        carp: 40,
        parrot: 60,
        urchin: { min: 50, max: 150, step: 25 },
        sturgeon: 55,
        lobster: 50,
        batlong: 20
      }
    },
    {
      id: 'weight', label: 'Масса взрослого', unit: 'кг',
      align: 'center', kind: 'number',
      values: { clam: 0.1, shark: 900, tortoise: 250, whale: 80000, carp: 10,
                parrot: 0.9, urchin: 0.5, sturgeon: 1000, lobster: 9,
                batlong: 0.008 }
    },
    {
      id: 'env', label: 'Среда обитания',
      align: 'center', kind: 'text',
      values: { clam: 'Море', shark: 'Море', tortoise: 'Суша', whale: 'Море',
                carp: 'Пресная вода', parrot: 'Суша', urchin: 'Море',
                sturgeon: 'Пресная вода', lobster: 'Море', batlong: 'Суша' }
    },
    {
      id: 'howage', label: 'Как считают возраст',
      align: 'left', kind: 'text',
      values: { clam: 'Кольца раковины', shark: 'Хрусталик глаза',
                tortoise: 'Записи людей', whale: 'Белок глаза',
                carp: 'Чешуя', parrot: 'Записи людей', urchin: 'Изотопы',
                sturgeon: 'Срез плавника', lobster: 'Глазной стебелёк',
                batlong: 'Кольцевание' }
    },
    {
      id: 'protected', label: 'Под охраной',
      align: 'center', kind: 'text',
      values: { clam: 'Нет', shark: 'Да', tortoise: 'Да', whale: 'Да',
                carp: 'Нет', parrot: 'Да', urchin: 'Нет', sturgeon: 'Да',
                lobster: 'Нет', batlong: 'Да' }
    }
  ]
},
{
  id: 'table-l2-12',
  level: 2,
  tags: ['история', 'письменность'],
  titleRow: 'Системы письма и их судьба',
  objectColumnLabel: 'Письменность',
  rows: [
    { id: 'cuneiform', label: 'Клинопись' },
    { id: 'hieroglyphs', label: 'Египетские иероглифы' },
    { id: 'phoenician', label: 'Финикийское письмо' },
    { id: 'greek', label: 'Греческий алфавит' },
    { id: 'latin', label: 'Латиница' },
    { id: 'cyrillic', label: 'Кириллица' },
    { id: 'runes', label: 'Руны' },
    { id: 'linearb', label: 'Линейное письмо Б' },
    { id: 'maya', label: 'Письмо майя' },
    { id: 'birchbark', label: 'Берестяные грамоты' }
  ],
  columns: [
    {
      id: 'appeared', label: 'Появилась',
      align: 'center', kind: 'text',
      values: { cuneiform: '3200 до н. э.', hieroglyphs: '3100 до н. э.',
                phoenician: '1050 до н. э.', greek: '800 до н. э.',
                latin: '700 до н. э.', cyrillic: '900 н. э.',
                runes: '150 н. э.', linearb: '1450 до н. э.',
                maya: '300 до н. э.', birchbark: '1000 н. э.' }
    },
    {
      id: 'signs', label: 'Число знаков',
      align: 'center', kind: 'number',
      values: { cuneiform: 600, hieroglyphs: 700, phoenician: 22, greek: 24,
                latin: 26, cyrillic: 43, runes: 24, linearb: 87,
                maya: 800, birchbark: 43 }
    },
    {
      id: 'material', label: 'На чём писали',
      align: 'left', kind: 'text',
      values: { cuneiform: 'Глина', hieroglyphs: 'Папирус', phoenician: 'Папирус',
                greek: 'Пергамент', latin: 'Камень', cyrillic: 'Пергамент',
                runes: 'Камень', linearb: 'Глина', maya: 'Кора',
                birchbark: 'Береста' }
    },
    {
      id: 'deciphered', label: 'Год расшифровки',
      align: 'center', kind: 'number',
      values: { cuneiform: 1857, hieroglyphs: 1822, phoenician: 1758, greek: 0,
                latin: 0, cyrillic: 0, runes: 1865, linearb: 1952,
                maya: 1980, birchbark: 1951 }
    },
    {
      id: 'alive', label: 'Используется',
      align: 'center', kind: 'text',
      values: { cuneiform: 'Нет', hieroglyphs: 'Нет', phoenician: 'Нет',
                greek: 'Да', latin: 'Да', cyrillic: 'Да', runes: 'Нет',
                linearb: 'Нет', maya: 'Нет', birchbark: 'Нет' }
    },
    {
      id: 'found', label: 'Найдено памятников', unit: 'шт.',
      align: 'center', kind: 'number',
      values: {
        cuneiform: { min: 300000, max: 500000, step: 50000 },
        hieroglyphs: 30000,
        phoenician: { min: 8000, max: 16000, step: 2000 },
        greek: 100000,
        latin: 300000,
        cyrillic: 60000,
        runes: { min: 5000, max: 9000, step: 1000 },
        linearb: 5000,
        maya: 15000,
        birchbark: { min: 1000, max: 1400, step: 100 }
      }
    }
  ]
},
{
  id: 'table-l2-13',
  level: 2,
  tags: ['спорт', 'снаряды'],
  titleRow: 'Мячи и снаряды: масса, размер, правила',
  objectColumnLabel: 'Снаряд',
  rows: [
    { id: 'pingpong', label: 'Шарик для настольного тенниса' },
    { id: 'golf', label: 'Мяч для гольфа' },
    { id: 'tennis', label: 'Теннисный мяч' },
    { id: 'baseball', label: 'Бейсбольный мяч' },
    { id: 'football', label: 'Футбольный мяч' },
    { id: 'basketball', label: 'Баскетбольный мяч' },
    { id: 'shot', label: 'Ядро для толкания' },
    { id: 'shuttlecock', label: 'Волан' },
    { id: 'puck', label: 'Хоккейная шайба' },
    { id: 'bowling', label: 'Шар для боулинга' }
  ],
  columns: [
    {
      id: 'mass', label: 'Масса', unit: 'г',
      align: 'center', kind: 'number',
      values: { pingpong: 2.7, golf: 46, tennis: 58, baseball: 145,
                football: 430, basketball: 600, shot: 7260, shuttlecock: 5,
                puck: 165, bowling: 7000 }
    },
    {
      id: 'diameter', label: 'Диаметр', unit: 'мм',
      align: 'center', kind: 'number',
      values: { pingpong: 40, golf: 43, tennis: 67, baseball: 74,
                football: 220, basketball: 240, shot: 120, shuttlecock: 65,
                puck: 76, bowling: 218 }
    },
    {
      id: 'speed', label: 'Рекорд скорости', unit: 'км/ч',
      align: 'center', kind: 'number',
      values: { pingpong: 112, golf: 349, tennis: 263, baseball: 170,
                football: 211, basketball: 100, shot: 50, shuttlecock: 565,
                puck: 183, bowling: 40 }
    },
    {
      id: 'material', label: 'Материал',
      align: 'left', kind: 'text',
      values: { pingpong: 'Пластик', golf: 'Полимер', tennis: 'Резина и войлок',
                baseball: 'Кожа', football: 'Синтетика', basketball: 'Кожа',
                shot: 'Сталь', shuttlecock: 'Перья', puck: 'Резина',
                bowling: 'Полимер' }
    },
    {
      id: 'players', label: 'Игроков на площадке',
      align: 'center', kind: 'number',
      values: { pingpong: 2, golf: 1, tennis: 2, baseball: 18, football: 22,
                basketball: 10, shot: 1, shuttlecock: 2, puck: 12, bowling: 1 }
    },
    {
      id: 'inventory', label: 'Есть в школе', unit: 'шт.',
      align: 'center', kind: 'number',
      values: {
        pingpong: { min: 20, max: 60, step: 10 },
        golf: 0,
        tennis: { min: 10, max: 30, step: 5 },
        baseball: 4,
        football: { min: 8, max: 20, step: 3 },
        basketball: { min: 10, max: 26, step: 4 },
        shot: 6,
        shuttlecock: 40,
        puck: 12,
        bowling: 0
      }
    }
  ]
},
{
  id: 'table-l2-14',
  level: 2,
  tags: ['география', 'пустыни'],
  titleRow: 'Пустыни мира: жара, песок и рекорды',
  objectColumnLabel: 'Пустыня',
  rows: [
    { id: 'sahara', label: 'Сахара' },
    { id: 'arabian', label: 'Аравийская' },
    { id: 'gobi', label: 'Гоби' },
    { id: 'kalahari', label: 'Калахари' },
    { id: 'atacama', label: 'Атакама' },
    { id: 'namib', label: 'Намиб' },
    { id: 'karakum', label: 'Каракумы' },
    { id: 'mojave', label: 'Мохаве' },
    { id: 'victoria', label: 'Большая Виктория' },
    { id: 'antarctic', label: 'Антарктическая' }
  ],
  columns: [
    {
      id: 'area', label: 'Площадь', unit: 'тыс. км²',
      align: 'center', kind: 'number',
      values: { sahara: 9200, arabian: 2330, gobi: 1300, kalahari: 900,
                atacama: 105, namib: 81, karakum: 350, mojave: 124,
                victoria: 348, antarctic: 13800 }
    },
    {
      id: 'maxtemp', label: 'Рекорд жары', unit: '°C',
      align: 'center', kind: 'number',
      values: { sahara: 58, arabian: 54, gobi: 45, kalahari: 45, atacama: 40,
                namib: 48, karakum: 50, mojave: 57, victoria: 50, antarctic: 20 }
    },
    {
      id: 'rain', label: 'Осадки за год', unit: 'мм',
      align: 'center', kind: 'number',
      values: { sahara: 25, arabian: 100, gobi: 194, kalahari: 250, atacama: 1,
                namib: 10, karakum: 150, mojave: 130, victoria: 200,
                antarctic: 50 }
    },
    {
      id: 'type', label: 'Тип',
      align: 'center', kind: 'text',
      values: { sahara: 'Тропическая', arabian: 'Тропическая',
                gobi: 'Холодная', kalahari: 'Тропическая',
                atacama: 'Береговая', namib: 'Береговая',
                karakum: 'Умеренная', mojave: 'Субтропическая',
                victoria: 'Тропическая', antarctic: 'Ледяная' }
    },
    {
      id: 'continent', label: 'Материк',
      align: 'left', kind: 'text',
      values: { sahara: 'Африка', arabian: 'Евразия', gobi: 'Евразия',
                kalahari: 'Африка', atacama: 'Южная Америка', namib: 'Африка',
                karakum: 'Евразия', mojave: 'Северная Америка',
                victoria: 'Австралия', antarctic: 'Антарктида' }
    },
    {
      id: 'dunes', label: 'Высота дюн', unit: 'м',
      align: 'center', kind: 'number',
      values: {
        sahara: { min: 150, max: 250, step: 25 },
        arabian: 250,
        gobi: { min: 100, max: 300, step: 50 },
        kalahari: 60,
        atacama: 40,
        namib: { min: 250, max: 350, step: 25 },
        karakum: 90,
        mojave: { min: 100, max: 200, step: 25 },
        victoria: 40,
        antarctic: 0
      }
    }
  ]
},
{
  id: 'table-l2-15',
  level: 2,
  tags: ['техника', 'скорость'],
  titleRow: 'Рекорды скорости на суше, воде и в воздухе',
  objectColumnLabel: 'Аппарат',
  rows: [
    { id: 'thrustssc', label: 'Thrust SSC' },
    { id: 'bloodhound', label: 'Bloodhound LSR' },
    { id: 'maglev', label: 'Поезд на магнитной подушке' },
    { id: 'sapsan', label: 'Сапсан' },
    { id: 'blackbird', label: 'SR-71' },
    { id: 'concorde', label: 'Конкорд' },
    { id: 'x15', label: 'X-15' },
    { id: 'spiritaus', label: 'Spirit of Australia' },
    { id: 'bike', label: 'Велосипед за обтекателем' },
    { id: 'skydiver', label: 'Прыжок из стратосферы' }
  ],
  columns: [
    {
      id: 'speed', label: 'Скорость', unit: 'км/ч',
      align: 'center', kind: 'number',
      values: { thrustssc: 1228, bloodhound: 1010, maglev: 603, sapsan: 291,
                blackbird: 3530, concorde: 2179, x15: 7274, spiritaus: 511,
                bike: 296, skydiver: 1358 }
    },
    {
      id: 'year', label: 'Год рекорда',
      align: 'center', kind: 'number',
      values: { thrustssc: 1997, bloodhound: 2019, maglev: 2015, sapsan: 2009,
                blackbird: 1976, concorde: 1996, x15: 1967, spiritaus: 1978,
                bike: 2018, skydiver: 2012 }
    },
    {
      id: 'env', label: 'Среда',
      align: 'center', kind: 'text',
      values: { thrustssc: 'Суша', bloodhound: 'Суша', maglev: 'Рельсы',
                sapsan: 'Рельсы', blackbird: 'Воздух', concorde: 'Воздух',
                x15: 'Воздух', spiritaus: 'Вода', bike: 'Суша',
                skydiver: 'Воздух' }
    },
    {
      id: 'crew', label: 'Экипаж', unit: 'чел.',
      align: 'center', kind: 'number',
      values: { thrustssc: 1, bloodhound: 1, maglev: 2, sapsan: 3,
                blackbird: 2, concorde: 3, x15: 1, spiritaus: 1,
                bike: 1, skydiver: 1 }
    },
    {
      id: 'engine', label: 'Двигатель',
      align: 'left', kind: 'text',
      values: { thrustssc: 'Реактивный', bloodhound: 'Реактивный',
                maglev: 'Электрический', sapsan: 'Электрический',
                blackbird: 'Реактивный', concorde: 'Реактивный',
                x15: 'Ракетный', spiritaus: 'Реактивный',
                bike: 'Мускульный', skydiver: 'Без двигателя' }
    },
    {
      id: 'passengers', label: 'Мест для пассажиров',
      align: 'center', kind: 'number',
      values: { thrustssc: 0, bloodhound: 0, maglev: 800, sapsan: 600,
                blackbird: 0, concorde: 100, x15: 0, spiritaus: 0,
                bike: 0, skydiver: 0 }
    }
  ]
},
{
  id: 'table-l2-16',
  level: 2,
  tags: ['музыка', 'культура'],
  titleRow: 'Инструменты симфонического оркестра',
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Инструмент',
  rows: [
    { id: 'violin', label: 'Скрипка' },
    { id: 'viola', label: 'Альт' },
    { id: 'cello', label: 'Виолончель' },
    { id: 'bass', label: 'Контрабас' },
    { id: 'flute', label: 'Флейта' },
    { id: 'oboe', label: 'Гобой' },
    { id: 'clarinet', label: 'Кларнет' },
    { id: 'trumpet', label: 'Труба' },
    { id: 'timpani', label: 'Литавры' },
    { id: 'harp', label: 'Арфа' }
  ],
  columns: [
    {
      id: 'group', label: 'Группа',
      align: 'left', kind: 'text',
      values: { violin: 'Струнные', viola: 'Струнные', cello: 'Струнные',
                bass: 'Струнные', flute: 'Деревянные', oboe: 'Деревянные',
                clarinet: 'Деревянные', trumpet: 'Медные',
                timpani: 'Ударные', harp: 'Струнные' }
    },
    {
      id: 'count', label: 'В оркестре', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        violin: { min: 24, max: 36, step: 3 },
        viola: { min: 8, max: 16, step: 2 },
        cello: 10,
        bass: 8,
        flute: { min: 2, max: 6, step: 1 },
        oboe: 3,
        clarinet: 3,
        trumpet: { min: 2, max: 6, step: 1 },
        timpani: 4,
        harp: 2
      }
    },
    {
      id: 'range', label: 'Нижняя нота', unit: 'Гц',
      align: 'center', kind: 'number',
      values: { violin: 196, viola: 131, cello: 65, bass: 41, flute: 262,
                oboe: 233, clarinet: 147, trumpet: 165, timpani: 87, harp: 33 }
    },
    {
      id: 'material', label: 'Основной материал',
      align: 'center', kind: 'text',
      values: { violin: 'Дерево', viola: 'Дерево', cello: 'Дерево',
                bass: 'Дерево', flute: 'Металл', oboe: 'Дерево',
                clarinet: 'Дерево', trumpet: 'Латунь', timpani: 'Медь',
                harp: 'Дерево' }
    },
    {
      id: 'learn', label: 'Лет обучения',
      align: 'center', kind: 'number',
      values: { violin: 7, viola: 7, cello: 7, bass: 5, flute: 5, oboe: 6,
                clarinet: 5, trumpet: 5, timpani: 4, harp: 8 }
    },
    {
      id: 'price', label: 'Учебный инструмент', unit: 'тыс. руб.',
      align: 'center', kind: 'number',
      values: {
        violin: { min: 15, max: 45, step: 6 },
        viola: 30,
        cello: { min: 40, max: 100, step: 12 },
        bass: 120,
        flute: { min: 20, max: 60, step: 8 },
        oboe: 90,
        clarinet: 35,
        trumpet: { min: 25, max: 65, step: 8 },
        timpani: 250,
        harp: 400
      }
    }
  ]
},
{
  id: 'table-l2-17',
  level: 2,
  tags: ['физика', 'свет'],
  titleRow: 'Источники света: от свечи до лазера',
  objectColumnLabel: 'Источник',
  rows: [
    { id: 'candle', label: 'Свеча' },
    { id: 'kerosene', label: 'Керосиновая лампа' },
    { id: 'bulb', label: 'Лампа накаливания' },
    { id: 'halogen', label: 'Галогенная лампа' },
    { id: 'fluorescent', label: 'Люминесцентная лампа' },
    { id: 'led', label: 'Светодиод' },
    { id: 'sodium', label: 'Натриевая лампа' },
    { id: 'firefly', label: 'Светлячок' },
    { id: 'laser', label: 'Лазерная указка' },
    { id: 'screen', label: 'Экран телефона' }
  ],
  columns: [
    {
      id: 'power', label: 'Мощность', unit: 'Вт',
      align: 'center', kind: 'number',
      values: { candle: 40, kerosene: 100, bulb: 60, halogen: 50,
                fluorescent: 15, led: 9, sodium: 250, firefly: 0.001,
                laser: 0.005, screen: 2 }
    },
    {
      id: 'lumens', label: 'Световой поток', unit: 'лм',
      align: 'center', kind: 'number',
      values: { candle: 12, kerosene: 100, bulb: 700, halogen: 900,
                fluorescent: 900, led: 900, sodium: 33000, firefly: 0.02,
                laser: 0.5, screen: 60 }
    },
    {
      id: 'efficiency', label: 'Отдача', unit: 'лм/Вт',
      align: 'center', kind: 'number',
      values: { candle: 0.3, kerosene: 1, bulb: 12, halogen: 18,
                fluorescent: 60, led: 100, sodium: 130, firefly: 20,
                laser: 100, screen: 30 }
    },
    {
      id: 'temp', label: 'Цветовая температура', unit: 'К',
      align: 'center', kind: 'number',
      values: { candle: 1900, kerosene: 2000, bulb: 2700, halogen: 3000,
                fluorescent: 4000, led: 4500, sodium: 2100, firefly: 5000,
                laser: 5300, screen: 6500 }
    },
    {
      id: 'life', label: 'Срок службы', unit: 'ч',
      align: 'center', kind: 'number',
      values: { candle: 6, kerosene: 30, bulb: 1000, halogen: 2000,
                fluorescent: 10000, led: 30000, sodium: 24000, firefly: 100,
                laser: 5000, screen: 20000 }
    },
    {
      id: 'year', label: 'Год появления',
      align: 'center', kind: 'number',
      values: { candle: -3000, kerosene: 1853, bulb: 1879, halogen: 1959,
                fluorescent: 1938, led: 1962, sodium: 1932, firefly: 0,
                laser: 1960, screen: 1987 }
    }
  ]
},
{
  id: 'table-l2-18',
  level: 2,
  tags: ['биология', 'грибы'],
  titleRow: 'Грибы леса: съедобные, ядовитые и полезные',
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Гриб',
  rows: [
    { id: 'porcini', label: 'Белый гриб' },
    { id: 'chanterelle', label: 'Лисичка' },
    { id: 'boletus', label: 'Подберёзовик' },
    { id: 'honey', label: 'Опёнок осенний' },
    { id: 'champignon', label: 'Шампиньон' },
    { id: 'flyagaric', label: 'Мухомор красный' },
    { id: 'deathcap', label: 'Бледная поганка' },
    { id: 'morel', label: 'Сморчок' },
    { id: 'truffle', label: 'Трюфель' },
    { id: 'oyster', label: 'Вёшенка' }
  ],
  columns: [
    {
      id: 'edible', label: 'Съедобность',
      align: 'center', kind: 'text',
      values: { porcini: 'Съедобный', chanterelle: 'Съедобный',
                boletus: 'Съедобный', honey: 'Условно съедобный',
                champignon: 'Съедобный', flyagaric: 'Ядовитый',
                deathcap: 'Смертельно ядовит', morel: 'Условно съедобный',
                truffle: 'Съедобный', oyster: 'Съедобный' }
    },
    {
      id: 'capsize', label: 'Диаметр шляпки', unit: 'см',
      align: 'center', kind: 'number',
      values: { porcini: 20, chanterelle: 8, boletus: 12, honey: 10,
                champignon: 9, flyagaric: 18, deathcap: 11, morel: 7,
                truffle: 6, oyster: 15 }
    },
    {
      id: 'season', label: 'Сезон',
      align: 'center', kind: 'text',
      values: { porcini: 'Июль–октябрь', chanterelle: 'Июнь–октябрь',
                boletus: 'Июнь–сентябрь', honey: 'Август–ноябрь',
                champignon: 'Май–октябрь', flyagaric: 'Август–октябрь',
                deathcap: 'Июль–октябрь', morel: 'Апрель–май',
                truffle: 'Осень', oyster: 'Сентябрь–ноябрь' }
    },
    {
      id: 'where', label: 'Где растёт',
      align: 'left', kind: 'text',
      values: { porcini: 'У сосны и дуба', chanterelle: 'Хвойный лес',
                boletus: 'У берёзы', honey: 'На пнях', champignon: 'На лугу',
                flyagaric: 'У берёзы', deathcap: 'Лиственный лес',
                morel: 'Опушки', truffle: 'Под землёй', oyster: 'На стволах' }
    },
    {
      id: 'protein', label: 'Белок', unit: 'г на 100 г',
      align: 'center', kind: 'number',
      values: { porcini: 3.7, chanterelle: 1.5, boletus: 2.3, honey: 2.2,
                champignon: 4.3, flyagaric: 2, deathcap: 2, morel: 3.1,
                truffle: 6, oyster: 3.3 }
    },
    {
      id: 'collected', label: 'Собрано за поход', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        porcini: { min: 4, max: 16, step: 3 },
        chanterelle: { min: 20, max: 60, step: 10 },
        boletus: 12,
        honey: { min: 30, max: 90, step: 15 },
        champignon: 8,
        flyagaric: 5,
        deathcap: 2,
        morel: { min: 3, max: 11, step: 2 },
        truffle: 0,
        oyster: 14
      }
    }
  ]
},
{
  id: 'table-l2-19',
  level: 2,
  tags: ['информатика', 'интернет'],
  titleRow: 'Сколько весит минута в интернете',
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Действие',
  rows: [
    { id: 'text', label: 'Переписка в чате' },
    { id: 'photo', label: 'Отправка фотографии' },
    { id: 'music', label: 'Прослушивание музыки' },
    { id: 'video480', label: 'Видео 480p' },
    { id: 'video1080', label: 'Видео 1080p' },
    { id: 'video4k', label: 'Видео 4K' },
    { id: 'call', label: 'Голосовой звонок' },
    { id: 'videocall', label: 'Видеозвонок' },
    { id: 'game', label: 'Онлайн-игра' },
    { id: 'map', label: 'Навигатор' }
  ],
  columns: [
    {
      id: 'traffic', label: 'Трафик за минуту', unit: 'МБ',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        text: 1,
        photo: 3,
        music: 1,
        video480: 8,
        video1080: 25,
        video4k: { min: 80, max: 160, step: 20 },
        call: 1,
        videocall: { min: 5, max: 25, step: 5 },
        game: { min: 1, max: 5, step: 1 },
        map: 2
      }
    },
    {
      id: 'speed', label: 'Нужная скорость', unit: 'Мбит/с',
      align: 'center', kind: 'number',
      values: { text: 0.1, photo: 1, music: 0.3, video480: 1.5,
                video1080: 5, video4k: 25, call: 0.1, videocall: 2,
                game: 3, map: 0.5 }
    },
    {
      id: 'delay', label: 'Допустимая задержка', unit: 'мс',
      align: 'center', kind: 'number',
      values: { text: 2000, photo: 3000, music: 1000, video480: 2000,
                video1080: 2000, video4k: 2000, call: 150, videocall: 150,
                game: 50, map: 1000 }
    },
    {
      id: 'battery', label: 'Расход батареи', unit: '% в час',
      align: 'center', kind: 'number',
      values: { text: 3, photo: 5, music: 4, video480: 12, video1080: 18,
                video4k: 28, call: 6, videocall: 22, game: 30, map: 20 }
    },
    {
      id: 'offline', label: 'Работает без сети',
      align: 'center', kind: 'text',
      values: { text: 'Нет', photo: 'Нет', music: 'Частично', video480: 'Частично',
                video1080: 'Частично', video4k: 'Нет', call: 'Нет',
                videocall: 'Нет', game: 'Частично', map: 'Частично' }
    },
    {
      id: 'minutes', label: 'Минут в день', unit: 'мин',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        text: { min: 40, max: 100, step: 15 },
        photo: 10,
        music: { min: 30, max: 90, step: 15 },
        video480: 25,
        video1080: { min: 40, max: 100, step: 15 },
        video4k: 15,
        call: 20,
        videocall: { min: 10, max: 40, step: 6 },
        game: 45,
        map: 18
      }
    }
  ]
},
{
  id: 'table-l2-20',
  level: 2,
  tags: ['история', 'деньги'],
  titleRow: 'Чем расплачивались вместо монет',
  objectColumnLabel: 'Деньги',
  rows: [
    { id: 'cowrie', label: 'Раковины каури' },
    { id: 'salt', label: 'Соль' },
    { id: 'pepper', label: 'Перец' },
    { id: 'cacao', label: 'Какао-бобы' },
    { id: 'fur', label: 'Шкурки куницы' },
    { id: 'rai', label: 'Каменные диски раи' },
    { id: 'tea', label: 'Чайные плитки' },
    { id: 'cattle', label: 'Скот' },
    { id: 'wampum', label: 'Вампум' },
    { id: 'iron', label: 'Железные прутья' }
  ],
  columns: [
    {
      id: 'region', label: 'Где ходили',
      align: 'left', kind: 'text',
      values: { cowrie: 'Африка и Азия', salt: 'Африка', pepper: 'Европа',
                cacao: 'Мезоамерика', fur: 'Русь', rai: 'Остров Яп',
                tea: 'Сибирь и Китай', cattle: 'Древний мир',
                wampum: 'Северная Америка', iron: 'Африка' }
    },
    {
      id: 'period', label: 'Когда',
      align: 'center', kind: 'text',
      values: { cowrie: 'До XIX в.', salt: 'Средние века', pepper: 'Средние века',
                cacao: 'XIV–XVI вв.', fur: 'IX–XV вв.', rai: 'До XX в.',
                tea: 'XVII–XIX вв.', cattle: 'Древность',
                wampum: 'XVII в.', iron: 'XIX в.' }
    },
    {
      id: 'weight', label: 'Масса единицы', unit: 'г',
      align: 'center', kind: 'number',
      values: { cowrie: 2, salt: 500, pepper: 10, cacao: 1, fur: 200,
                rai: 400000, tea: 1500, cattle: 400000, wampum: 5, iron: 800 }
    },
    {
      id: 'durability', label: 'Долго хранится',
      align: 'center', kind: 'text',
      values: { cowrie: 'Да', salt: 'Да', pepper: 'Да', cacao: 'Нет',
                fur: 'Нет', rai: 'Да', tea: 'Да', cattle: 'Нет',
                wampum: 'Да', iron: 'Да' }
    },
    {
      id: 'divisible', label: 'Делится на части',
      align: 'center', kind: 'text',
      values: { cowrie: 'Нет', salt: 'Да', pepper: 'Да', cacao: 'Да',
                fur: 'Нет', rai: 'Нет', tea: 'Да', cattle: 'Нет',
                wampum: 'Да', iron: 'Нет' }
    },
    {
      id: 'value', label: 'Стоило единиц товара',
      align: 'center', kind: 'number',
      values: {
        cowrie: 1,
        salt: { min: 20, max: 60, step: 10 },
        pepper: { min: 30, max: 90, step: 15 },
        cacao: 3,
        fur: { min: 100, max: 300, step: 50 },
        rai: 5000,
        tea: { min: 40, max: 120, step: 20 },
        cattle: 2000,
        wampum: 2,
        iron: 50
      }
    }
  ]
},
{
  id: 'table-l2-21',
  level: 2,
  tags: ['биология', 'яды'],
  titleRow: 'Ядовитые животные и их оружие',
  objectColumnLabel: 'Животное',
  rows: [
    { id: 'boxjelly', label: 'Кубомедуза' },
    { id: 'taipan', label: 'Тайпан' },
    { id: 'blueoctopus', label: 'Синекольчатый осьминог' },
    { id: 'stonefish', label: 'Бородавчатка' },
    { id: 'scorpion', label: 'Жёлтый скорпион' },
    { id: 'blackwidow', label: 'Чёрная вдова' },
    { id: 'cone', label: 'Улитка конус' },
    { id: 'frog', label: 'Листолаз ужасный' },
    { id: 'viper', label: 'Гадюка обыкновенная' },
    { id: 'platypus', label: 'Утконос' }
  ],
  columns: [
    {
      id: 'size', label: 'Размер', unit: 'см',
      align: 'center', kind: 'number',
      values: { boxjelly: 30, taipan: 250, blueoctopus: 12, stonefish: 40,
                scorpion: 10, blackwidow: 2, cone: 15, frog: 5,
                viper: 65, platypus: 50 }
    },
    {
      id: 'lethal', label: 'Смертельная доза', unit: 'мг',
      align: 'center', kind: 'number',
      values: { boxjelly: 0.04, taipan: 1, blueoctopus: 0.5, stonefish: 18,
                scorpion: 5, blackwidow: 1.5, cone: 0.1, frog: 0.2,
                viper: 40, platypus: 100 }
    },
    {
      id: 'delivery', label: 'Способ',
      align: 'center', kind: 'text',
      values: { boxjelly: 'Стрекательные', taipan: 'Укус',
                blueoctopus: 'Укус', stonefish: 'Шипы', scorpion: 'Жало',
                blackwidow: 'Укус', cone: 'Гарпун', frog: 'Кожа',
                viper: 'Укус', platypus: 'Шпора' }
    },
    {
      id: 'antidote', label: 'Есть противоядие',
      align: 'center', kind: 'text',
      values: { boxjelly: 'Да', taipan: 'Да', blueoctopus: 'Нет',
                stonefish: 'Да', scorpion: 'Да', blackwidow: 'Да',
                cone: 'Нет', frog: 'Нет', viper: 'Да', platypus: 'Нет' }
    },
    {
      id: 'habitat', label: 'Где живёт',
      align: 'left', kind: 'text',
      values: { boxjelly: 'Австралия', taipan: 'Австралия',
                blueoctopus: 'Тихий океан', stonefish: 'Индийский океан',
                scorpion: 'Северная Африка', blackwidow: 'Америка',
                cone: 'Коралловые рифы', frog: 'Колумбия',
                viper: 'Европа', platypus: 'Австралия' }
    },
    {
      id: 'cases', label: 'Случаев в год', unit: 'шт.',
      align: 'center', kind: 'number',
      values: {
        boxjelly: { min: 20, max: 100, step: 20 },
        taipan: { min: 5, max: 25, step: 5 },
        blueoctopus: 3,
        stonefish: { min: 100, max: 300, step: 50 },
        scorpion: 4000,
        blackwidow: { min: 1000, max: 3000, step: 500 },
        cone: 30,
        frog: 1,
        viper: { min: 200, max: 600, step: 100 },
        platypus: 2
      }
    }
  ]
},
{
  id: 'table-l2-22',
  level: 2,
  tags: ['космос', 'спутники'],
  titleRow: 'Луны Солнечной системы',
  objectColumnLabel: 'Спутник',
  rows: [
    { id: 'moon', label: 'Луна' },
    { id: 'ganymede', label: 'Ганимед' },
    { id: 'titan', label: 'Титан' },
    { id: 'io', label: 'Ио' },
    { id: 'europa', label: 'Европа' },
    { id: 'enceladus', label: 'Энцелад' },
    { id: 'triton', label: 'Тритон' },
    { id: 'phobos', label: 'Фобос' },
    { id: 'charon', label: 'Харон' },
    { id: 'mimas', label: 'Мимас' }
  ],
  columns: [
    {
      id: 'planet', label: 'Планета',
      align: 'center', kind: 'text',
      values: { moon: 'Земля', ganymede: 'Юпитер', titan: 'Сатурн',
                io: 'Юпитер', europa: 'Юпитер', enceladus: 'Сатурн',
                triton: 'Нептун', phobos: 'Марс', charon: 'Плутон',
                mimas: 'Сатурн' }
    },
    {
      id: 'diameter', label: 'Диаметр', unit: 'км',
      align: 'center', kind: 'number',
      values: { moon: 3475, ganymede: 5268, titan: 5150, io: 3643,
                europa: 3122, enceladus: 504, triton: 2707, phobos: 22,
                charon: 1212, mimas: 396 }
    },
    {
      id: 'period', label: 'Оборот вокруг планеты', unit: 'суток',
      align: 'center', kind: 'number',
      values: { moon: 27.3, ganymede: 7.2, titan: 16, io: 1.8, europa: 3.6,
                enceladus: 1.4, triton: 5.9, phobos: 0.3, charon: 6.4,
                mimas: 0.9 }
    },
    {
      id: 'atmosphere', label: 'Атмосфера',
      align: 'center', kind: 'text',
      values: { moon: 'Нет', ganymede: 'Следы', titan: 'Плотная', io: 'Следы',
                europa: 'Следы', enceladus: 'Следы', triton: 'Разрежённая',
                phobos: 'Нет', charon: 'Нет', mimas: 'Нет' }
    },
    {
      id: 'discovered', label: 'Год открытия',
      align: 'center', kind: 'number',
      values: { moon: 0, ganymede: 1610, titan: 1655, io: 1610, europa: 1610,
                enceladus: 1789, triton: 1846, phobos: 1877, charon: 1978,
                mimas: 1789 }
    },
    {
      id: 'features', label: 'Чем известен',
      align: 'left', kind: 'text',
      values: { moon: 'Люди были там', ganymede: 'Самый большой',
                titan: 'Метановые озёра', io: 'Вулканы',
                europa: 'Океан подо льдом', enceladus: 'Гейзеры',
                triton: 'Обратное вращение', phobos: 'Падает на Марс',
                charon: 'Почти двойная', mimas: 'Огромный кратер' }
    }
  ]
},
{
  id: 'table-l2-23',
  level: 2,
  tags: ['спорт', 'необычное'],
  titleRow: 'Чемпионаты мира, о которых мало кто слышал',
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Состязание',
  rows: [
    { id: 'wife', label: 'Перенос жены' },
    { id: 'chessboxing', label: 'Шахбокс' },
    { id: 'bog', label: 'Плавание в болоте' },
    { id: 'toe', label: 'Борьба пальцами ног' },
    { id: 'cheese', label: 'Погоня за сыром' },
    { id: 'airguitar', label: 'Воздушная гитара' },
    { id: 'sauna', label: 'Метание сапога' },
    { id: 'stone', label: 'Блинчики по воде' },
    { id: 'sandcastle', label: 'Замки из песка' },
    { id: 'worm', label: 'Приманивание червей' }
  ],
  columns: [
    {
      id: 'country', label: 'Родина',
      align: 'left', kind: 'text',
      values: { wife: 'Финляндия', chessboxing: 'Нидерланды',
                bog: 'Уэльс', toe: 'Англия', cheese: 'Англия',
                airguitar: 'Финляндия', sauna: 'Финляндия',
                stone: 'Шотландия', sandcastle: 'США', worm: 'Англия' }
    },
    {
      id: 'since', label: 'Проводится с',
      align: 'center', kind: 'number',
      values: { wife: 1992, chessboxing: 2003, bog: 1976, toe: 1974,
                cheese: 1826, airguitar: 1996, sauna: 1975, stone: 1983,
                sandcastle: 1962, worm: 1980 }
    },
    {
      id: 'duration', label: 'Длительность', unit: 'мин',
      align: 'center', kind: 'number',
      values: { wife: 2, chessboxing: 45, bog: 3, toe: 5, cheese: 1,
                airguitar: 2, sauna: 1, stone: 10, sandcastle: 180, worm: 30 }
    },
    {
      id: 'participants', label: 'Участников', unit: 'чел.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        wife: { min: 40, max: 80, step: 10 },
        chessboxing: { min: 16, max: 40, step: 6 },
        bog: 200,
        toe: { min: 30, max: 70, step: 10 },
        cheese: 100,
        airguitar: { min: 12, max: 32, step: 5 },
        sauna: 150,
        stone: { min: 60, max: 140, step: 20 },
        sandcastle: 80,
        worm: 45
      }
    },
    {
      id: 'record', label: 'Рекорд',
      align: 'center', kind: 'text',
      values: { wife: '55,5 с', chessboxing: '11 раундов', bog: '1 мин 18 с',
                toe: '3 титула', cheese: '22 победы', airguitar: '2 титула',
                sauna: '68 м', stone: '121 отскок', sandcastle: '21 м',
                worm: '567 червей' }
    },
    {
      id: 'prize', label: 'Приз',
      align: 'left', kind: 'text',
      values: { wife: 'Вес жены в пиве', chessboxing: 'Пояс',
                bog: 'Денежный приз', toe: 'Кубок', cheese: 'Головка сыра',
                airguitar: 'Гитара', sauna: 'Сапоги', stone: 'Медаль',
                sandcastle: 'Денежный приз', worm: 'Кубок' }
    }
  ]
},
{
  id: 'table-l2-24',
  level: 2,
  tags: ['химия', 'быт'],
  titleRow: 'Что происходит на кухне с точки зрения химии',
  objectColumnLabel: 'Процесс',
  rows: [
    { id: 'boiling', label: 'Кипячение воды' },
    { id: 'frying', label: 'Жарка мяса' },
    { id: 'baking', label: 'Подъём теста' },
    { id: 'caramel', label: 'Карамелизация сахара' },
    { id: 'yogurt', label: 'Сквашивание молока' },
    { id: 'pickling', label: 'Засолка огурцов' },
    { id: 'freezing', label: 'Заморозка ягод' },
    { id: 'whipping', label: 'Взбивание белков' },
    { id: 'smoking', label: 'Копчение рыбы' },
    { id: 'brewing', label: 'Заваривание чая' }
  ],
  columns: [
    {
      id: 'temp', label: 'Температура', unit: '°C',
      align: 'center', kind: 'number',
      values: { boiling: 100, frying: 180, baking: 200, caramel: 160,
                yogurt: 40, pickling: 20, freezing: -18, whipping: 20,
                smoking: 90, brewing: 95 }
    },
    {
      id: 'time', label: 'Время', unit: 'мин',
      align: 'center', kind: 'number',
      values: {
        boiling: 5,
        frying: { min: 10, max: 30, step: 5 },
        baking: { min: 30, max: 70, step: 10 },
        caramel: 8,
        yogurt: { min: 300, max: 600, step: 60 },
        pickling: 4320,
        freezing: 180,
        whipping: { min: 3, max: 11, step: 2 },
        smoking: { min: 60, max: 180, step: 30 },
        brewing: 5
      }
    },
    {
      id: 'reversible', label: 'Обратимо',
      align: 'center', kind: 'text',
      values: { boiling: 'Да', frying: 'Нет', baking: 'Нет', caramel: 'Нет',
                yogurt: 'Нет', pickling: 'Нет', freezing: 'Да',
                whipping: 'Частично', smoking: 'Нет', brewing: 'Нет' }
    },
    {
      id: 'kind', label: 'Тип превращения',
      align: 'center', kind: 'text',
      values: { boiling: 'Физическое', frying: 'Химическое',
                baking: 'Биологическое', caramel: 'Химическое',
                yogurt: 'Биологическое', pickling: 'Биологическое',
                freezing: 'Физическое', whipping: 'Физическое',
                smoking: 'Химическое', brewing: 'Физическое' }
    },
    {
      id: 'agent', label: 'Что действует',
      align: 'left', kind: 'text',
      values: { boiling: 'Тепло', frying: 'Тепло', baking: 'Дрожжи',
                caramel: 'Тепло', yogurt: 'Бактерии', pickling: 'Соль',
                freezing: 'Холод', whipping: 'Воздух', smoking: 'Дым',
                brewing: 'Вода' }
    },
    {
      id: 'energy', label: 'Расход энергии', unit: 'кВт·ч',
      align: 'center', kind: 'number',
      values: {
        boiling: 0.2,
        frying: { min: 0.3, max: 0.9, step: 0.15 },
        baking: { min: 0.8, max: 1.6, step: 0.2 },
        caramel: 0.2,
        yogurt: 0.1,
        pickling: 0,
        freezing: { min: 0.4, max: 1.2, step: 0.2 },
        whipping: 0.05,
        smoking: 1.5,
        brewing: 0.1
      }
    }
  ]
},
{
  id: 'table-l2-25',
  level: 2,
  tags: ['география', 'вода'],
  titleRow: 'Водопады: высота, мощь, известность',
  objectColumnLabel: 'Водопад',
  rows: [
    { id: 'angel', label: 'Анхель' },
    { id: 'tugela', label: 'Тугела' },
    { id: 'niagara', label: 'Ниагарский' },
    { id: 'victoria', label: 'Виктория' },
    { id: 'iguazu', label: 'Игуасу' },
    { id: 'kivach', label: 'Кивач' },
    { id: 'sutherland', label: 'Сазерленд' },
    { id: 'yosemite', label: 'Йосемити' },
    { id: 'boyoma', label: 'Бойома' },
    { id: 'gullfoss', label: 'Гюдльфосс' }
  ],
  columns: [
    {
      id: 'height', label: 'Высота', unit: 'м',
      align: 'center', kind: 'number',
      values: { angel: 979, tugela: 948, niagara: 51, victoria: 108,
                iguazu: 82, kivach: 10.7, sutherland: 580, yosemite: 739,
                boyoma: 61, gullfoss: 32 }
    },
    {
      id: 'width', label: 'Ширина', unit: 'м',
      align: 'center', kind: 'number',
      values: { angel: 150, tugela: 15, niagara: 1203, victoria: 1708,
                iguazu: 2700, kivach: 30, sutherland: 20, yosemite: 30,
                boyoma: 1300, gullfoss: 20 }
    },
    {
      id: 'flow', label: 'Расход воды', unit: 'м³/с',
      align: 'center', kind: 'number',
      values: {
        angel: 14,
        tugela: 8,
        niagara: { min: 2000, max: 2800, step: 200 },
        victoria: { min: 1000, max: 1800, step: 200 },
        iguazu: { min: 1500, max: 2300, step: 200 },
        kivach: 66,
        sutherland: 12,
        yosemite: 6,
        boyoma: { min: 15000, max: 19000, step: 1000 },
        gullfoss: 140
      }
    },
    {
      id: 'country', label: 'Страна',
      align: 'left', kind: 'text',
      values: { angel: 'Венесуэла', tugela: 'ЮАР', niagara: 'США и Канада',
                victoria: 'Замбия', iguazu: 'Аргентина', kivach: 'Россия',
                sutherland: 'Новая Зеландия', yosemite: 'США',
                boyoma: 'Конго', gullfoss: 'Исландия' }
    },
    {
      id: 'steps', label: 'Число ступеней',
      align: 'center', kind: 'number',
      values: { angel: 1, tugela: 5, niagara: 1, victoria: 1, iguazu: 275,
                kivach: 4, sutherland: 3, yosemite: 3, boyoma: 7, gullfoss: 2 }
    },
    {
      id: 'tourists', label: 'Посетителей за год', unit: 'тыс. чел.',
      align: 'center', kind: 'number',
      values: {
        angel: { min: 40, max: 120, step: 20 },
        tugela: 30,
        niagara: { min: 8000, max: 14000, step: 1000 },
        victoria: { min: 300, max: 700, step: 100 },
        iguazu: 1500,
        kivach: { min: 100, max: 200, step: 25 },
        sutherland: 50,
        yosemite: 4000,
        boyoma: 5,
        gullfoss: 700
      }
    }
  ]
},
{
  id: 'table-l2-26',
  level: 2,
  tags: ['техника', 'роботы'],
  titleRow: 'Роботы на работе',
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Робот',
  rows: [
    { id: 'vacuum', label: 'Робот-пылесос' },
    { id: 'arm', label: 'Промышленный манипулятор' },
    { id: 'rover', label: 'Марсоход' },
    { id: 'drone', label: 'Квадрокоптер' },
    { id: 'surgeon', label: 'Хирургический робот' },
    { id: 'delivery', label: 'Робот-доставщик' },
    { id: 'underwater', label: 'Подводный аппарат' },
    { id: 'humanoid', label: 'Человекоподобный робот' },
    { id: 'milking', label: 'Доильный робот' },
    { id: 'rescue', label: 'Спасательный робот' }
  ],
  columns: [
    {
      id: 'mass', label: 'Масса', unit: 'кг',
      align: 'center', kind: 'number',
      values: { vacuum: 4, arm: 250, rover: 899, drone: 2, surgeon: 550,
                delivery: 50, underwater: 1500, humanoid: 80, milking: 900,
                rescue: 120 }
    },
    {
      id: 'work', label: 'Время работы', unit: 'ч',
      align: 'center', kind: 'number',
      values: {
        vacuum: { min: 1, max: 3, step: 0.5 },
        arm: 24,
        rover: 24,
        drone: { min: 0.4, max: 1.2, step: 0.2 },
        surgeon: 12,
        delivery: { min: 6, max: 14, step: 2 },
        underwater: 8,
        humanoid: { min: 2, max: 6, step: 1 },
        milking: 24,
        rescue: 4
      }
    },
    {
      id: 'autonomy', label: 'Самостоятельность',
      align: 'center', kind: 'text',
      values: { vacuum: 'Полная', arm: 'По программе', rover: 'Частичная',
                drone: 'Частичная', surgeon: 'Управляется', delivery: 'Полная',
                underwater: 'Управляется', humanoid: 'Частичная',
                milking: 'Полная', rescue: 'Управляется' }
    },
    {
      id: 'where', label: 'Где применяют',
      align: 'left', kind: 'text',
      values: { vacuum: 'Квартира', arm: 'Завод', rover: 'Другая планета',
                drone: 'Небо', surgeon: 'Больница', delivery: 'Улица',
                underwater: 'Океан', humanoid: 'Выставки', milking: 'Ферма',
                rescue: 'Завалы' }
    },
    {
      id: 'sensors', label: 'Число датчиков',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        vacuum: { min: 8, max: 20, step: 3 },
        arm: 12,
        rover: { min: 40, max: 80, step: 10 },
        drone: 10,
        surgeon: 30,
        delivery: { min: 15, max: 35, step: 5 },
        underwater: 25,
        humanoid: { min: 30, max: 70, step: 10 },
        milking: 18,
        rescue: 22
      }
    },
    {
      id: 'year', label: 'Год появления',
      align: 'center', kind: 'number',
      values: { vacuum: 2002, arm: 1961, rover: 1997, drone: 2010,
                surgeon: 2000, delivery: 2016, underwater: 1960,
                humanoid: 2000, milking: 1992, rescue: 2001 }
    }
  ]
},
{
  id: 'table-l2-27',
  level: 2,
  tags: ['биология', 'миграции'],
  titleRow: 'Кто и куда летит, плывёт и бежит',
  objectColumnLabel: 'Путешественник',
  rows: [
    { id: 'tern', label: 'Полярная крачка' },
    { id: 'monarch', label: 'Бабочка монарх' },
    { id: 'salmon', label: 'Лосось' },
    { id: 'wildebeest', label: 'Антилопа гну' },
    { id: 'humpback', label: 'Горбатый кит' },
    { id: 'godwit', label: 'Малый веретенник' },
    { id: 'eel', label: 'Речной угорь' },
    { id: 'caribou', label: 'Северный олень' },
    { id: 'turtle', label: 'Кожистая черепаха' },
    { id: 'dragonfly', label: 'Стрекоза-глобетроттер' }
  ],
  columns: [
    {
      id: 'distance', label: 'Путь за год', unit: 'км',
      align: 'center', kind: 'number',
      values: { tern: 70000, monarch: 4800, salmon: 3000, wildebeest: 1800,
                humpback: 8000, godwit: 12000, eel: 6000, caribou: 5000,
                turtle: 16000, dragonfly: 18000 }
    },
    {
      id: 'speed', label: 'Скорость', unit: 'км/ч',
      align: 'center', kind: 'number',
      values: { tern: 40, monarch: 20, salmon: 12, wildebeest: 50,
                humpback: 8, godwit: 60, eel: 3, caribou: 40,
                turtle: 3, dragonfly: 30 }
    },
    {
      id: 'way', label: 'Как перемещается',
      align: 'center', kind: 'text',
      values: { tern: 'Летит', monarch: 'Летит', salmon: 'Плывёт',
                wildebeest: 'Бежит', humpback: 'Плывёт', godwit: 'Летит',
                eel: 'Плывёт', caribou: 'Бежит', turtle: 'Плывёт',
                dragonfly: 'Летит' }
    },
    {
      id: 'nonstop', label: 'Без остановок', unit: 'км',
      align: 'center', kind: 'number',
      values: { tern: 2000, monarch: 500, salmon: 300, wildebeest: 100,
                humpback: 4000, godwit: 13000, eel: 1000, caribou: 60,
                turtle: 5000, dragonfly: 3500 }
    },
    {
      id: 'why', label: 'Зачем',
      align: 'left', kind: 'text',
      values: { tern: 'За летом', monarch: 'Зимовка', salmon: 'Нерест',
                wildebeest: 'За травой', humpback: 'Рождение детёнышей',
                godwit: 'Зимовка', eel: 'Нерест', caribou: 'За кормом',
                turtle: 'Кладка яиц', dragonfly: 'За дождями' }
    },
    {
      id: 'group', label: 'В стае', unit: 'особей',
      align: 'center', kind: 'number',
      values: {
        tern: { min: 100, max: 500, step: 100 },
        monarch: { min: 10000, max: 50000, step: 10000 },
        salmon: 5000,
        wildebeest: { min: 200000, max: 600000, step: 100000 },
        humpback: 12,
        godwit: { min: 50, max: 250, step: 50 },
        eel: 3000,
        caribou: { min: 20000, max: 100000, step: 20000 },
        turtle: 1,
        dragonfly: 2000
      }
    }
  ]
},
{
  id: 'table-l2-28',
  level: 2,
  tags: ['история', 'катастрофы'],
  titleRow: 'Извержения, изменившие ход событий',
  objectColumnLabel: 'Вулкан',
  rows: [
    { id: 'vesuvius', label: 'Везувий' },
    { id: 'tambora', label: 'Тамбора' },
    { id: 'krakatoa', label: 'Кракатау' },
    { id: 'pelee', label: 'Монтань-Пеле' },
    { id: 'santorini', label: 'Санторин' },
    { id: 'pinatubo', label: 'Пинатубо' },
    { id: 'laki', label: 'Лаки' },
    { id: 'sthelens', label: 'Сент-Хеленс' },
    { id: 'eyja', label: 'Эйяфьядлайёкюдль' },
    { id: 'tonga', label: 'Хунга-Тонга' }
  ],
  columns: [
    {
      id: 'year', label: 'Год',
      align: 'center', kind: 'text',
      values: { vesuvius: '79 н. э.', tambora: '1815', krakatoa: '1883',
                pelee: '1902', santorini: '1600 до н. э.', pinatubo: '1991',
                laki: '1783', sthelens: '1980', eyja: '2010', tonga: '2022' }
    },
    {
      id: 'vei', label: 'Сила по шкале',
      align: 'center', kind: 'number',
      values: { vesuvius: 5, tambora: 7, krakatoa: 6, pelee: 4, santorini: 7,
                pinatubo: 6, laki: 6, sthelens: 5, eyja: 4, tonga: 6 }
    },
    {
      id: 'material', label: 'Выброшено', unit: 'км³',
      align: 'center', kind: 'number',
      values: { vesuvius: 4, tambora: 100, krakatoa: 21, pelee: 0.5,
                santorini: 60, pinatubo: 10, laki: 15, sthelens: 1,
                eyja: 0.3, tonga: 6 }
    },
    {
      id: 'country', label: 'Страна',
      align: 'left', kind: 'text',
      values: { vesuvius: 'Италия', tambora: 'Индонезия', krakatoa: 'Индонезия',
                pelee: 'Мартиника', santorini: 'Греция', pinatubo: 'Филиппины',
                laki: 'Исландия', sthelens: 'США', eyja: 'Исландия',
                tonga: 'Тонга' }
    },
    {
      id: 'cooling', label: 'Похолодание', unit: '°C',
      align: 'center', kind: 'number',
      values: { vesuvius: 0, tambora: 0.5, krakatoa: 0.4, pelee: 0,
                santorini: 0.3, pinatubo: 0.5, laki: 1.3, sthelens: 0,
                eyja: 0, tonga: 0.1 }
    },
    {
      id: 'consequence', label: 'Последствие',
      align: 'left', kind: 'text',
      values: { vesuvius: 'Погибли Помпеи', tambora: 'Год без лета',
                krakatoa: 'Слышно за 4800 км', pelee: 'Город стёрт',
                santorini: 'Упала цивилизация', pinatubo: 'Эвакуация',
                laki: 'Голод в Европе', sthelens: 'Срезана вершина',
                eyja: 'Стоп авиации', tonga: 'Волна в океанах' }
    }
  ]
},
{
  id: 'table-l2-29',
  level: 2,
  tags: ['школа', 'экзамены'],
  titleRow: 'Итоги пробного экзамена по параллели',
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Предмет',
  rows: [
    { id: 'russian', label: 'Русский язык' },
    { id: 'math', label: 'Математика' },
    { id: 'physics', label: 'Физика' },
    { id: 'informatics', label: 'Информатика' },
    { id: 'biology', label: 'Биология' },
    { id: 'chemistry', label: 'Химия' },
    { id: 'history', label: 'История' },
    { id: 'social', label: 'Обществознание' },
    { id: 'english', label: 'Английский язык' },
    { id: 'geography', label: 'География' }
  ],
  columns: [
    {
      id: 'wrote', label: 'Писали работу', unit: 'чел.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        russian: { min: 100, max: 140, step: 10 },
        math: { min: 100, max: 140, step: 10 },
        physics: 34,
        informatics: { min: 40, max: 72, step: 8 },
        biology: 41,
        chemistry: { min: 16, max: 32, step: 4 },
        history: 22,
        social: { min: 50, max: 90, step: 10 },
        english: 28,
        geography: 37
      }
    },
    {
      id: 'maxscore', label: 'Максимум баллов',
      align: 'center', kind: 'number',
      values: { russian: 33, math: 31, physics: 45, informatics: 19,
                biology: 48, chemistry: 40, history: 37, social: 37,
                english: 68, geography: 31 }
    },
    {
      id: 'average', label: 'Средний балл',
      align: 'center', kind: 'number',
      values: { russian: 26.4, math: 18.2, physics: 24.5, informatics: 12.8,
                biology: 29.1, chemistry: 22.6, history: 20.3, social: 23.7,
                english: 44.2, geography: 19.8 }
    },
    {
      id: 'fives', label: 'Отличных работ', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        russian: { min: 20, max: 44, step: 6 },
        math: 15,
        physics: { min: 4, max: 12, step: 2 },
        informatics: 11,
        biology: { min: 6, max: 18, step: 3 },
        chemistry: 5,
        history: 4,
        social: { min: 8, max: 24, step: 4 },
        english: 9,
        geography: 7
      }
    },
    {
      id: 'time', label: 'Длительность', unit: 'мин',
      align: 'center', kind: 'number',
      values: { russian: 235, math: 235, physics: 180, informatics: 150,
                biology: 180, chemistry: 180, history: 180, social: 180,
                english: 120, geography: 150 }
    },
    {
      id: 'form', label: 'Форма работы',
      align: 'center', kind: 'text',
      values: { russian: 'Письменная', math: 'Письменная', physics: 'С опытом',
                informatics: 'За компьютером', biology: 'Письменная',
                chemistry: 'С опытом', history: 'Письменная',
                social: 'Письменная', english: 'С устной частью',
                geography: 'Письменная' }
    }
  ]
},
{
  id: 'table-l2-30',
  level: 2,
  tags: ['архитектура', 'города'],
  titleRow: 'Самые высокие здания и что внутри',
  objectColumnLabel: 'Здание',
  rows: [
    { id: 'burj', label: 'Бурдж-Халифа' },
    { id: 'merdeka', label: 'Мердека 118' },
    { id: 'shanghai', label: 'Шанхайская башня' },
    { id: 'clock', label: 'Часовая башня Мекки' },
    { id: 'ping', label: 'Пинань' },
    { id: 'lotte', label: 'Лотте Тауэр' },
    { id: 'wtc', label: 'Всемирный торговый центр' },
    { id: 'lakhta', label: 'Лахта-центр' },
    { id: 'federation', label: 'Башня «Восток»' },
    { id: 'empire', label: 'Эмпайр-стейт-билдинг' }
  ],
  columns: [
    {
      id: 'height', label: 'Высота', unit: 'м',
      align: 'center', kind: 'number',
      values: { burj: 828, merdeka: 679, shanghai: 632, clock: 601, ping: 599,
                lotte: 555, wtc: 541, lakhta: 462, federation: 374, empire: 443 }
    },
    {
      id: 'floors', label: 'Этажей',
      align: 'center', kind: 'number',
      values: { burj: 163, merdeka: 118, shanghai: 128, clock: 120, ping: 115,
                lotte: 123, wtc: 94, lakhta: 87, federation: 95, empire: 102 }
    },
    {
      id: 'year', label: 'Год открытия',
      align: 'center', kind: 'number',
      values: { burj: 2010, merdeka: 2023, shanghai: 2015, clock: 2012,
                ping: 2017, lotte: 2017, wtc: 2014, lakhta: 2019,
                federation: 2017, empire: 1931 }
    },
    {
      id: 'city', label: 'Город',
      align: 'left', kind: 'text',
      values: { burj: 'Дубай', merdeka: 'Куала-Лумпур', shanghai: 'Шанхай',
                clock: 'Мекка', ping: 'Шэньчжэнь', lotte: 'Сеул',
                wtc: 'Нью-Йорк', lakhta: 'Санкт-Петербург',
                federation: 'Москва', empire: 'Нью-Йорк' }
    },
    {
      id: 'lifts', label: 'Лифтов', unit: 'шт.',
      align: 'center', kind: 'number',
      values: {
        burj: { min: 50, max: 70, step: 5 },
        merdeka: { min: 80, max: 100, step: 5 },
        shanghai: 106,
        clock: 40,
        ping: { min: 30, max: 50, step: 5 },
        lotte: 61,
        wtc: 71,
        lakhta: { min: 90, max: 110, step: 5 },
        federation: 68,
        empire: 73
      }
    },
    {
      id: 'liftspeed', label: 'Скорость лифта', unit: 'м/с',
      align: 'center', kind: 'number',
      values: { burj: 10, merdeka: 8, shanghai: 20.5, clock: 6, ping: 10,
                lotte: 10, wtc: 11, lakhta: 8, federation: 7, empire: 6 }
    }
  ]
},
{
  id: 'table-l2-31',
  level: 2,
  tags: ['биология', 'зрение'],
  titleRow: 'Как разные глаза видят мир',
  objectColumnLabel: 'Существо',
  rows: [
    { id: 'human', label: 'Человек' },
    { id: 'eagle', label: 'Орёл' },
    { id: 'cat', label: 'Кошка' },
    { id: 'mantis', label: 'Рак-богомол' },
    { id: 'dragonfly', label: 'Стрекоза' },
    { id: 'chameleon', label: 'Хамелеон' },
    { id: 'dog', label: 'Собака' },
    { id: 'owl', label: 'Сова' },
    { id: 'bee', label: 'Пчела' },
    { id: 'mole', label: 'Крот' }
  ],
  columns: [
    {
      id: 'colors', label: 'Типов рецепторов',
      align: 'center', kind: 'number',
      values: { human: 3, eagle: 4, cat: 2, mantis: 12, dragonfly: 5,
                chameleon: 4, dog: 2, owl: 1, bee: 3, mole: 1 }
    },
    {
      id: 'view', label: 'Угол обзора', unit: '°',
      align: 'center', kind: 'number',
      values: { human: 180, eagle: 340, cat: 200, mantis: 360, dragonfly: 360,
                chameleon: 342, dog: 250, owl: 110, bee: 300, mole: 30 }
    },
    {
      id: 'sharpness', label: 'Острота против человека', unit: 'раз',
      align: 'center', kind: 'number',
      values: { human: 1, eagle: 5, cat: 0.2, mantis: 0.1, dragonfly: 0.1,
                chameleon: 0.5, dog: 0.4, owl: 0.9, bee: 0.02, mole: 0.01 }
    },
    {
      id: 'night', label: 'Видит в темноте',
      align: 'center', kind: 'text',
      values: { human: 'Плохо', eagle: 'Плохо', cat: 'Отлично', mantis: 'Средне',
                dragonfly: 'Плохо', chameleon: 'Плохо', dog: 'Хорошо',
                owl: 'Отлично', bee: 'Плохо', mole: 'Не видит' }
    },
    {
      id: 'uv', label: 'Видит ультрафиолет',
      align: 'center', kind: 'text',
      values: { human: 'Нет', eagle: 'Да', cat: 'Немного', mantis: 'Да',
                dragonfly: 'Да', chameleon: 'Да', dog: 'Немного', owl: 'Нет',
                bee: 'Да', mole: 'Нет' }
    },
    {
      id: 'frames', label: 'Кадров в секунду',
      align: 'center', kind: 'number',
      values: {
        human: { min: 50, max: 70, step: 5 },
        eagle: 130,
        cat: { min: 55, max: 75, step: 5 },
        mantis: 90,
        dragonfly: { min: 200, max: 300, step: 25 },
        chameleon: 60,
        dog: { min: 70, max: 90, step: 5 },
        owl: 65,
        bee: { min: 250, max: 350, step: 25 },
        mole: 20
      }
    }
  ]
},
{
  id: 'table-l2-32',
  level: 2,
  tags: ['история', 'корабли'],
  titleRow: 'Корабли, которые вошли в историю',
  objectColumnLabel: 'Корабль',
  rows: [
    { id: 'santamaria', label: '«Санта-Мария»' },
    { id: 'victoria', label: '«Виктория»' },
    { id: 'endeavour', label: '«Индевор»' },
    { id: 'beagle', label: '«Бигль»' },
    { id: 'vostok', label: '«Восток»' },
    { id: 'titanic', label: '«Титаник»' },
    { id: 'fram', label: '«Фрам»' },
    { id: 'aurora', label: '«Аврора»' },
    { id: 'nautilus', label: '«Наутилус»' },
    { id: 'lenin', label: '«Ленин»' }
  ],
  columns: [
    {
      id: 'year', label: 'Год постройки',
      align: 'center', kind: 'number',
      values: { santamaria: 1460, victoria: 1519, endeavour: 1764, beagle: 1820,
                vostok: 1818, titanic: 1911, fram: 1892, aurora: 1900,
                nautilus: 1954, lenin: 1957 }
    },
    {
      id: 'length', label: 'Длина', unit: 'м',
      align: 'center', kind: 'number',
      values: { santamaria: 25, victoria: 27, endeavour: 32, beagle: 27,
                vostok: 40, titanic: 269, fram: 39, aurora: 127,
                nautilus: 98, lenin: 134 }
    },
    {
      id: 'crew', label: 'Экипаж', unit: 'чел.',
      align: 'center', kind: 'number',
      values: { santamaria: 40, victoria: 18, endeavour: 94, beagle: 74,
                vostok: 117, titanic: 900, fram: 13, aurora: 570,
                nautilus: 105, lenin: 243 }
    },
    {
      id: 'power', label: 'Движитель',
      align: 'center', kind: 'text',
      values: { santamaria: 'Паруса', victoria: 'Паруса', endeavour: 'Паруса',
                beagle: 'Паруса', vostok: 'Паруса', titanic: 'Пар',
                fram: 'Паруса и пар', aurora: 'Пар', nautilus: 'Атом',
                lenin: 'Атом' }
    },
    {
      id: 'fame', label: 'Чем знаменит',
      align: 'left', kind: 'text',
      values: { santamaria: 'Путь в Америку', victoria: 'Кругосветка',
                endeavour: 'Открыл Австралию', beagle: 'Возил Дарвина',
                vostok: 'Нашёл Антарктиду', titanic: 'Столкнулся с айсбергом',
                fram: 'Дрейф во льдах', aurora: 'Выстрел 1917 года',
                nautilus: 'Прошёл под полюсом', lenin: 'Первый атомоход' }
    },
    {
      id: 'years', label: 'Лет в строю',
      align: 'center', kind: 'number',
      values: {
        santamaria: 1,
        victoria: { min: 8, max: 16, step: 2 },
        endeavour: { min: 10, max: 18, step: 2 },
        beagle: 50,
        vostok: 10,
        titanic: 1,
        fram: { min: 20, max: 40, step: 5 },
        aurora: 40,
        nautilus: { min: 20, max: 32, step: 3 },
        lenin: 30
      }
    }
  ]
},
{
  id: 'table-l2-33',
  level: 2,
  tags: ['математика', 'головоломки'],
  titleRow: 'Знаменитые головоломки и их числа',
  objectColumnLabel: 'Головоломка',
  rows: [
    { id: 'rubik', label: 'Кубик Рубика' },
    { id: 'sudoku', label: 'Судоку' },
    { id: 'fifteen', label: 'Пятнашки' },
    { id: 'hanoi', label: 'Ханойская башня' },
    { id: 'tangram', label: 'Танграм' },
    { id: 'nonogram', label: 'Японский кроссворд' },
    { id: 'maze', label: 'Лабиринт' },
    { id: 'pentomino', label: 'Пентамино' },
    { id: 'soma', label: 'Куб сома' },
    { id: 'nim', label: 'Ним' }
  ],
  columns: [
    {
      id: 'pieces', label: 'Элементов',
      align: 'center', kind: 'number',
      values: { rubik: 26, sudoku: 81, fifteen: 15, hanoi: 8, tangram: 7,
                nonogram: 400, maze: 1, pentomino: 12, soma: 7, nim: 12 }
    },
    {
      id: 'invented', label: 'Год появления',
      align: 'center', kind: 'number',
      values: { rubik: 1974, sudoku: 1979, fifteen: 1878, hanoi: 1883,
                tangram: 1800, nonogram: 1987, maze: 1900, pentomino: 1907,
                soma: 1933, nim: 1901 }
    },
    {
      id: 'solutions', label: 'Число вариантов',
      align: 'center', kind: 'text',
      values: { rubik: '4,3·10¹⁹', sudoku: '6,7·10²¹', fifteen: '1,0·10¹³',
                hanoi: '255 ходов', tangram: '6 500 фигур', nonogram: 'Одно',
                maze: 'Одно', pentomino: '2 339 укладок', soma: '240 сборок',
                nim: 'Есть стратегия' }
    },
    {
      id: 'minmoves', label: 'Минимум ходов',
      align: 'center', kind: 'number',
      values: { rubik: 20, sudoku: 51, fifteen: 80, hanoi: 255, tangram: 7,
                nonogram: 400, maze: 40, pentomino: 12, soma: 7, nim: 3 }
    },
    {
      id: 'record', label: 'Мировой рекорд', unit: 'с',
      align: 'center', kind: 'number',
      values: { rubik: 3.1, sudoku: 60, fifteen: 12, hanoi: 30, tangram: 45,
                nonogram: 900, maze: 20, pentomino: 120, soma: 25, nim: 5 }
    },
    {
      id: 'inclub', label: 'Наборов в кружке', unit: 'шт.',
      align: 'center', kind: 'number',
      values: {
        rubik: { min: 15, max: 35, step: 5 },
        sudoku: 40,
        fifteen: { min: 10, max: 26, step: 4 },
        hanoi: 8,
        tangram: { min: 12, max: 28, step: 4 },
        nonogram: 30,
        maze: 20,
        pentomino: { min: 6, max: 18, step: 3 },
        soma: 10,
        nim: 5
      }
    }
  ]
},
{
  id: 'table-l2-34',
  level: 2,
  tags: ['экология', 'энергия'],
  titleRow: 'Откуда берётся электричество',
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Источник',
  rows: [
    { id: 'coal', label: 'Уголь' },
    { id: 'gas', label: 'Природный газ' },
    { id: 'nuclear', label: 'Атом' },
    { id: 'hydro', label: 'Вода' },
    { id: 'wind', label: 'Ветер' },
    { id: 'solar', label: 'Солнце' },
    { id: 'geothermal', label: 'Тепло Земли' },
    { id: 'biomass', label: 'Биомасса' },
    { id: 'tidal', label: 'Приливы' },
    { id: 'diesel', label: 'Дизель' }
  ],
  columns: [
    {
      id: 'share', label: 'Доля в мире', unit: '%',
      align: 'center', kind: 'number',
      values: { coal: 35, gas: 23, nuclear: 9, hydro: 15, wind: 8, solar: 6,
                geothermal: 0.5, biomass: 2, tidal: 0.01, diesel: 1 }
    },
    {
      id: 'co2', label: 'Выброс CO₂', unit: 'г на кВт·ч',
      align: 'center', kind: 'number',
      values: { coal: 820, gas: 490, nuclear: 12, hydro: 24, wind: 11,
                solar: 45, geothermal: 38, biomass: 230, tidal: 20,
                diesel: 650 }
    },
    {
      id: 'station', label: 'Мощность станции', unit: 'МВт',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        coal: { min: 1000, max: 3000, step: 400 },
        gas: { min: 400, max: 1200, step: 200 },
        nuclear: 4000,
        hydro: { min: 1000, max: 5000, step: 800 },
        wind: 200,
        solar: { min: 50, max: 250, step: 40 },
        geothermal: 80,
        biomass: 40,
        tidal: 250,
        diesel: 10
      }
    },
    {
      id: 'buildtime', label: 'Стройка', unit: 'лет',
      align: 'center', kind: 'number',
      values: { coal: 4, gas: 3, nuclear: 9, hydro: 8, wind: 2, solar: 1,
                geothermal: 5, biomass: 2, tidal: 6, diesel: 1 }
    },
    {
      id: 'renewable', label: 'Возобновляемый',
      align: 'center', kind: 'text',
      values: { coal: 'Нет', gas: 'Нет', nuclear: 'Нет', hydro: 'Да',
                wind: 'Да', solar: 'Да', geothermal: 'Да', biomass: 'Да',
                tidal: 'Да', diesel: 'Нет' }
    },
    {
      id: 'weather', label: 'Зависит от погоды',
      align: 'center', kind: 'text',
      values: { coal: 'Нет', gas: 'Нет', nuclear: 'Нет', hydro: 'Да',
                wind: 'Да', solar: 'Да', geothermal: 'Нет', biomass: 'Нет',
                tidal: 'Нет', diesel: 'Нет' }
    }
  ]
},
{
  id: 'table-l2-35',
  level: 2,
  tags: ['культура', 'праздники'],
  titleRow: 'Новый год в разных странах',
  objectColumnLabel: 'Страна',
  rows: [
    { id: 'russia', label: 'Россия' },
    { id: 'china', label: 'Китай' },
    { id: 'iran', label: 'Иран' },
    { id: 'thailand', label: 'Таиланд' },
    { id: 'ethiopia', label: 'Эфиопия' },
    { id: 'india', label: 'Индия' },
    { id: 'israel', label: 'Израиль' },
    { id: 'japan', label: 'Япония' },
    { id: 'scotland', label: 'Шотландия' },
    { id: 'mexico', label: 'Мексика' }
  ],
  columns: [
    {
      id: 'date', label: 'Когда встречают',
      align: 'center', kind: 'text',
      values: { russia: '1 января', china: 'Январь–февраль', iran: '21 марта',
                thailand: '13 апреля', ethiopia: '11 сентября',
                india: 'Октябрь–ноябрь', israel: 'Сентябрь', japan: '1 января',
                scotland: '1 января', mexico: '1 января' }
    },
    {
      id: 'calendar', label: 'Календарь',
      align: 'center', kind: 'text',
      values: { russia: 'Солнечный', china: 'Лунный', iran: 'Солнечный',
                thailand: 'Лунный', ethiopia: 'Солнечный', india: 'Лунный',
                israel: 'Лунный', japan: 'Солнечный', scotland: 'Солнечный',
                mexico: 'Солнечный' }
    },
    {
      id: 'days', label: 'Выходных', unit: 'дней',
      align: 'center', kind: 'number',
      values: { russia: 8, china: 7, iran: 13, thailand: 3, ethiopia: 1,
                india: 2, israel: 2, japan: 3, scotland: 2, mexico: 1 }
    },
    {
      id: 'symbol', label: 'Главный символ',
      align: 'left', kind: 'text',
      values: { russia: 'Ёлка', china: 'Дракон', iran: 'Проросшая зелень',
                thailand: 'Вода', ethiopia: 'Костёр', india: 'Огоньки',
                israel: 'Мёд и яблоки', japan: 'Колокол',
                scotland: 'Первый гость', mexico: 'Виноград' }
    },
    {
      id: 'food', label: 'Праздничное блюдо',
      align: 'left', kind: 'text',
      values: { russia: 'Салат', china: 'Пельмени', iran: 'Плов с рыбой',
                thailand: 'Карри', ethiopia: 'Инджера', india: 'Сладости',
                israel: 'Яблоки в мёде', japan: 'Гречневая лапша',
                scotland: 'Хаггис', mexico: 'Тамале' }
    },
    {
      id: 'fireworks', label: 'Салютов за ночь', unit: 'тыс. шт.',
      align: 'center', kind: 'number',
      values: {
        russia: { min: 200, max: 400, step: 50 },
        china: { min: 800, max: 1600, step: 200 },
        iran: 100,
        thailand: 150,
        ethiopia: 5,
        india: { min: 400, max: 800, step: 100 },
        israel: 20,
        japan: 60,
        scotland: { min: 30, max: 70, step: 10 },
        mexico: 250
      }
    }
  ]
},
{
  id: 'table-l2-36',
  level: 2,
  tags: ['физика', 'звук'],
  titleRow: 'Громкость привычных звуков',
  objectColumnLabel: 'Звук',
  rows: [
    { id: 'leaves', label: 'Шелест листьев' },
    { id: 'whisper', label: 'Шёпот' },
    { id: 'speech', label: 'Разговор' },
    { id: 'vacuum', label: 'Пылесос' },
    { id: 'traffic', label: 'Поток машин' },
    { id: 'concert', label: 'Рок-концерт' },
    { id: 'jet', label: 'Взлёт самолёта' },
    { id: 'thunder', label: 'Гром' },
    { id: 'whale', label: 'Крик синего кита' },
    { id: 'shrimp', label: 'Щелчок рака-щелкуна' }
  ],
  columns: [
    {
      id: 'level', label: 'Уровень', unit: 'дБ',
      align: 'center', kind: 'number',
      values: { leaves: 10, whisper: 30, speech: 60, vacuum: 75, traffic: 85,
                concert: 110, jet: 140, thunder: 120, whale: 188, shrimp: 200 }
    },
    {
      id: 'distance', label: 'Расстояние замера', unit: 'м',
      align: 'center', kind: 'number',
      values: { leaves: 1, whisper: 1, speech: 1, vacuum: 1, traffic: 10,
                concert: 5, jet: 50, thunder: 1000, whale: 1, shrimp: 1 }
    },
    {
      id: 'safe', label: 'Безопасное время',
      align: 'center', kind: 'text',
      values: { leaves: 'Всегда', whisper: 'Всегда', speech: 'Всегда',
                vacuum: 'Часы', traffic: 'Часы', concert: 'Минуты',
                jet: 'Секунды', thunder: 'Секунды', whale: 'Под водой',
                shrimp: 'Под водой' }
    },
    {
      id: 'freq', label: 'Основная частота', unit: 'Гц',
      align: 'center', kind: 'number',
      values: { leaves: 4000, whisper: 2000, speech: 500, vacuum: 1000,
                traffic: 300, concert: 200, jet: 400, thunder: 50,
                whale: 15, shrimp: 5000 }
    },
    {
      id: 'audible', label: 'Слышен человеку',
      align: 'center', kind: 'text',
      values: { leaves: 'Да', whisper: 'Да', speech: 'Да', vacuum: 'Да',
                traffic: 'Да', concert: 'Да', jet: 'Да', thunder: 'Да',
                whale: 'Едва', shrimp: 'Да' }
    },
    {
      id: 'measurements', label: 'Замеров сделано', unit: 'шт.',
      align: 'center', kind: 'number',
      values: {
        leaves: { min: 5, max: 25, step: 5 },
        whisper: 12,
        speech: { min: 20, max: 60, step: 10 },
        vacuum: 8,
        traffic: { min: 30, max: 70, step: 10 },
        concert: 4,
        jet: { min: 6, max: 18, step: 3 },
        thunder: 9,
        whale: 3,
        shrimp: 2
      }
    }
  ]
},
{
  id: 'table-l2-37',
  level: 2,
  tags: ['биология', 'растения'],
  titleRow: 'Растения-рекордсмены',
  objectColumnLabel: 'Растение',
  rows: [
    { id: 'bamboo', label: 'Бамбук' },
    { id: 'rafflesia', label: 'Раффлезия' },
    { id: 'victoria', label: 'Виктория амазонская' },
    { id: 'wolffia', label: 'Вольфия' },
    { id: 'baobab', label: 'Баобаб' },
    { id: 'welwitschia', label: 'Вельвичия' },
    { id: 'venus', label: 'Венерина мухоловка' },
    { id: 'titanarum', label: 'Аморфофаллус' },
    { id: 'sequoia', label: 'Секвойядендрон' },
    { id: 'lotus', label: 'Лотос' }
  ],
  columns: [
    {
      id: 'record', label: 'В чём рекорд',
      align: 'left', kind: 'text',
      values: { bamboo: 'Скорость роста', rafflesia: 'Размер цветка',
                victoria: 'Размер листа', wolffia: 'Самое малое',
                baobab: 'Толщина ствола', welwitschia: 'Два листа на век',
                venus: 'Ловит насекомых', titanarum: 'Запах',
                sequoia: 'Объём древесины', lotus: 'Всхожесть семян' }
    },
    {
      id: 'size', label: 'Размер', unit: 'см',
      align: 'center', kind: 'number',
      values: { bamboo: 3000, rafflesia: 106, victoria: 300, wolffia: 0.1,
                baobab: 1500, welwitschia: 400, venus: 15, titanarum: 300,
                sequoia: 8500, lotus: 150 }
    },
    {
      id: 'growth', label: 'Прирост в сутки', unit: 'см',
      align: 'center', kind: 'number',
      values: { bamboo: 91, rafflesia: 1, victoria: 5, wolffia: 0.05,
                baobab: 0.1, welwitschia: 0.04, venus: 0.2, titanarum: 10,
                sequoia: 0.2, lotus: 3 }
    },
    {
      id: 'lifespan', label: 'Срок жизни', unit: 'лет',
      align: 'center', kind: 'number',
      values: { bamboo: 60, rafflesia: 1, victoria: 1, wolffia: 1, baobab: 1500,
                welwitschia: 1500, venus: 20, titanarum: 40, sequoia: 3000,
                lotus: 5 }
    },
    {
      id: 'where', label: 'Родина',
      align: 'left', kind: 'text',
      values: { bamboo: 'Азия', rafflesia: 'Суматра', victoria: 'Амазония',
                wolffia: 'Повсюду', baobab: 'Африка', welwitschia: 'Намиб',
                venus: 'США', titanarum: 'Суматра', sequoia: 'Калифорния',
                lotus: 'Азия' }
    },
    {
      id: 'ingarden', label: 'В ботаническом саду', unit: 'экз.',
      align: 'center', kind: 'number',
      values: {
        bamboo: { min: 20, max: 60, step: 10 },
        rafflesia: 0,
        victoria: { min: 2, max: 10, step: 2 },
        wolffia: 100,
        baobab: 1,
        welwitschia: 2,
        venus: { min: 10, max: 30, step: 5 },
        titanarum: 1,
        sequoia: { min: 3, max: 11, step: 2 },
        lotus: 25
      }
    }
  ]
},
{
  id: 'table-l2-38',
  level: 2,
  tags: ['информатика', 'шифры'],
  titleRow: 'Шифры от древности до наших дней',
  objectColumnLabel: 'Шифр',
  rows: [
    { id: 'caesar', label: 'Шифр Цезаря' },
    { id: 'scytale', label: 'Скитала' },
    { id: 'vigenere', label: 'Шифр Виженера' },
    { id: 'morse', label: 'Азбука Морзе' },
    { id: 'enigma', label: 'Энигма' },
    { id: 'onetime', label: 'Одноразовый блокнот' },
    { id: 'rsa', label: 'RSA' },
    { id: 'aes', label: 'AES' },
    { id: 'braille', label: 'Шрифт Брайля' },
    { id: 'semaphore', label: 'Флажковый семафор' }
  ],
  columns: [
    {
      id: 'year', label: 'Появился',
      align: 'center', kind: 'text',
      values: { caesar: '50 до н. э.', scytale: '500 до н. э.',
                vigenere: '1553', morse: '1838', enigma: '1918',
                onetime: '1917', rsa: '1977', aes: '2001',
                braille: '1824', semaphore: '1866' }
    },
    {
      id: 'keys', label: 'Число ключей',
      align: 'center', kind: 'text',
      values: { caesar: '25', scytale: 'Десятки', vigenere: 'Миллионы',
                morse: 'Нет ключа', enigma: '1,6·10²⁰', onetime: 'Бесконечно',
                rsa: '2²⁰⁴⁸', aes: '2²⁵⁶', braille: 'Нет ключа',
                semaphore: 'Нет ключа' }
    },
    {
      id: 'symbols', label: 'Знаков в системе',
      align: 'center', kind: 'number',
      values: { caesar: 26, scytale: 26, vigenere: 26, morse: 36, enigma: 26,
                onetime: 26, rsa: 2, aes: 2, braille: 63, semaphore: 29 }
    },
    {
      id: 'broken', label: 'Взломан',
      align: 'center', kind: 'text',
      values: { caesar: 'Да', scytale: 'Да', vigenere: 'Да', morse: 'Не шифр',
                enigma: 'Да', onetime: 'Нет', rsa: 'Нет', aes: 'Нет',
                braille: 'Не шифр', semaphore: 'Не шифр' }
    },
    {
      id: 'use', label: 'Где применяли',
      align: 'left', kind: 'text',
      values: { caesar: 'Донесения', scytale: 'Спарта', vigenere: 'Дипломатия',
                morse: 'Телеграф', enigma: 'Флот', onetime: 'Разведка',
                rsa: 'Интернет', aes: 'Шифрование дисков',
                braille: 'Книги', semaphore: 'Флот' }
    },
    {
      id: 'speed', label: 'Знаков в минуту',
      align: 'center', kind: 'number',
      values: {
        caesar: { min: 20, max: 60, step: 10 },
        scytale: 40,
        vigenere: { min: 10, max: 30, step: 5 },
        morse: { min: 60, max: 140, step: 20 },
        enigma: 25,
        onetime: 15,
        rsa: 100000,
        aes: 1000000,
        braille: { min: 80, max: 160, step: 20 },
        semaphore: 30
      }
    }
  ]
},
{
  id: 'table-l2-39',
  level: 2,
  tags: ['спорт', 'зима'],
  titleRow: 'Зимние виды спорта: инвентарь и трассы',
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Вид спорта',
  rows: [
    { id: 'biathlon', label: 'Биатлон' },
    { id: 'skijump', label: 'Прыжки с трамплина' },
    { id: 'bobsleigh', label: 'Бобслей' },
    { id: 'curling', label: 'Кёрлинг' },
    { id: 'figure', label: 'Фигурное катание' },
    { id: 'speedskating', label: 'Конькобежный спорт' },
    { id: 'snowboard', label: 'Сноуборд' },
    { id: 'luge', label: 'Санный спорт' },
    { id: 'skeleton', label: 'Скелетон' },
    { id: 'crosscountry', label: 'Лыжные гонки' }
  ],
  columns: [
    {
      id: 'track', label: 'Длина трассы', unit: 'м',
      align: 'center', kind: 'number',
      values: { biathlon: 20000, skijump: 130, bobsleigh: 1500, curling: 45,
                figure: 60, speedskating: 400, snowboard: 1200, luge: 1300,
                skeleton: 1300, crosscountry: 50000 }
    },
    {
      id: 'speed', label: 'Скорость', unit: 'км/ч',
      align: 'center', kind: 'number',
      values: { biathlon: 25, skijump: 95, bobsleigh: 150, curling: 3,
                figure: 20, speedskating: 60, snowboard: 100, luge: 140,
                skeleton: 130, crosscountry: 30 }
    },
    {
      id: 'equipment', label: 'Масса снаряжения', unit: 'кг',
      align: 'center', kind: 'number',
      values: { biathlon: 5.5, skijump: 4, bobsleigh: 170, curling: 20,
                figure: 3, speedskating: 2, snowboard: 5, luge: 23,
                skeleton: 43, crosscountry: 2 }
    },
    {
      id: 'athletes', label: 'Спортсменов в школе', unit: 'чел.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        biathlon: { min: 20, max: 44, step: 6 },
        skijump: 6,
        bobsleigh: 4,
        curling: { min: 12, max: 28, step: 4 },
        figure: { min: 30, max: 70, step: 10 },
        speedskating: 18,
        snowboard: { min: 15, max: 35, step: 5 },
        luge: 5,
        skeleton: 3,
        crosscountry: { min: 40, max: 80, step: 10 }
      }
    },
    {
      id: 'olympic', label: 'В программе Игр с',
      align: 'center', kind: 'number',
      values: { biathlon: 1960, skijump: 1924, bobsleigh: 1924, curling: 1998,
                figure: 1908, speedskating: 1924, snowboard: 1998,
                luge: 1964, skeleton: 1928, crosscountry: 1924 }
    },
    {
      id: 'temp', label: 'Нужен мороз', unit: '°C',
      align: 'center', kind: 'number',
      values: { biathlon: -5, skijump: -3, bobsleigh: -8, curling: -5,
                figure: -4, speedskating: -6, snowboard: -3, luge: -8,
                skeleton: -8, crosscountry: -5 }
    }
  ]
},
{
  id: 'table-l2-40',
  level: 2,
  tags: ['техника', 'мелочи'],
  titleRow: 'Вещи, придуманные случайно',
  objectColumnLabel: 'Изобретение',
  rows: [
    { id: 'velcro', label: 'Липучка' },
    { id: 'microwave', label: 'Микроволновка' },
    { id: 'penicillin', label: 'Пенициллин' },
    { id: 'postit', label: 'Клейкие листочки' },
    { id: 'teflon', label: 'Тефлон' },
    { id: 'icecream', label: 'Мороженое на палочке' },
    { id: 'saccharin', label: 'Сахарозаменитель' },
    { id: 'vulcan', label: 'Резина' },
    { id: 'safetyglass', label: 'Триплекс' },
    { id: 'slinky', label: 'Пружинка-слинки' }
  ],
  columns: [
    {
      id: 'year', label: 'Год',
      align: 'center', kind: 'number',
      values: { velcro: 1941, microwave: 1945, penicillin: 1928, postit: 1968,
                teflon: 1938, icecream: 1905, saccharin: 1879, vulcan: 1839,
                safetyglass: 1903, slinky: 1943 }
    },
    {
      id: 'cause', label: 'Что натолкнуло',
      align: 'left', kind: 'text',
      values: { velcro: 'Репейник на собаке', microwave: 'Растаявший батончик',
                penicillin: 'Плесень в чашке', postit: 'Слабый клей',
                teflon: 'Осадок в баллоне', icecream: 'Забытый стакан',
                saccharin: 'Немытые руки', vulcan: 'Пролитая смесь',
                safetyglass: 'Упавшая колба', slinky: 'Упавшая пружина' }
    },
    {
      id: 'country', label: 'Страна',
      align: 'left', kind: 'text',
      values: { velcro: 'Швейцария', microwave: 'США', penicillin: 'Англия',
                postit: 'США', teflon: 'США', icecream: 'США',
                saccharin: 'США', vulcan: 'США', safetyglass: 'Франция',
                slinky: 'США' }
    },
    {
      id: 'topatent', label: 'Лет до патента',
      align: 'center', kind: 'number',
      values: { velcro: 14, microwave: 5, penicillin: 12, postit: 12,
                teflon: 3, icecream: 18, saccharin: 5, vulcan: 5,
                safetyglass: 6, slinky: 4 }
    },
    {
      id: 'usenow', label: 'Используется',
      align: 'center', kind: 'text',
      values: { velcro: 'Повсюду', microwave: 'Повсюду', penicillin: 'Медицина',
                postit: 'Офис', teflon: 'Посуда', icecream: 'Еда',
                saccharin: 'Еда', vulcan: 'Шины', safetyglass: 'Автомобили',
                slinky: 'Игрушка' }
    },
    {
      id: 'production', label: 'Выпуск за год', unit: 'млн шт.',
      align: 'center', kind: 'number',
      values: {
        velcro: { min: 400, max: 800, step: 100 },
        microwave: { min: 50, max: 90, step: 10 },
        penicillin: 200,
        postit: { min: 3000, max: 7000, step: 1000 },
        teflon: 150,
        icecream: { min: 8000, max: 16000, step: 2000 },
        saccharin: 100,
        vulcan: { min: 1500, max: 2500, step: 250 },
        safetyglass: 300,
        slinky: 3
      }
    }
  ]
},
{
  id: 'table-l2-41',
  level: 2,
  tags: ['биология', 'сердце'],
  titleRow: 'Пульс, кровь и размеры сердца',
  objectColumnLabel: 'Существо',
  rows: [
    { id: 'shrew', label: 'Бурозубка' },
    { id: 'mouse', label: 'Мышь' },
    { id: 'hummingbird', label: 'Колибри' },
    { id: 'cat', label: 'Кошка' },
    { id: 'human', label: 'Человек' },
    { id: 'horse', label: 'Лошадь' },
    { id: 'elephant', label: 'Слон' },
    { id: 'giraffe', label: 'Жираф' },
    { id: 'whale', label: 'Синий кит' },
    { id: 'tortoise', label: 'Черепаха' }
  ],
  columns: [
    {
      id: 'pulse', label: 'Пульс в покое', unit: 'уд/мин',
      align: 'center', kind: 'number',
      values: { shrew: 800, mouse: 600, hummingbird: 500, cat: 150, human: 70,
                horse: 40, elephant: 30, giraffe: 65, whale: 8, tortoise: 6 }
    },
    {
      id: 'heart', label: 'Масса сердца', unit: 'г',
      align: 'center', kind: 'number',
      values: { shrew: 0.1, mouse: 0.15, hummingbird: 0.2, cat: 20, human: 300,
                horse: 4500, elephant: 20000, giraffe: 11000, whale: 180000,
                tortoise: 15 }
    },
    {
      id: 'blood', label: 'Объём крови', unit: 'л',
      align: 'center', kind: 'number',
      values: { shrew: 0.001, mouse: 0.002, hummingbird: 0.001, cat: 0.25,
                human: 5, horse: 40, elephant: 260, giraffe: 60, whale: 8000,
                tortoise: 0.3 }
    },
    {
      id: 'pressure', label: 'Верхнее давление', unit: 'мм рт. ст.',
      align: 'center', kind: 'number',
      values: { shrew: 140, mouse: 120, hummingbird: 150, cat: 130, human: 120,
                horse: 110, elephant: 150, giraffe: 280, whale: 100,
                tortoise: 40 }
    },
    {
      id: 'lifespan', label: 'Срок жизни', unit: 'лет',
      align: 'center', kind: 'number',
      values: { shrew: 1.5, mouse: 3, hummingbird: 8, cat: 15, human: 75,
                horse: 28, elephant: 60, giraffe: 25, whale: 85, tortoise: 120 }
    },
    {
      id: 'beats', label: 'Ударов за жизнь', unit: 'млрд',
      align: 'center', kind: 'number',
      values: {
        shrew: { min: 0.5, max: 1.1, step: 0.15 },
        mouse: 0.9,
        hummingbird: { min: 1.5, max: 2.7, step: 0.3 },
        cat: 1.2,
        human: { min: 2.4, max: 3.2, step: 0.2 },
        horse: 0.6,
        elephant: { min: 0.8, max: 1.2, step: 0.1 },
        giraffe: 0.9,
        whale: 0.4,
        tortoise: 0.4
      }
    }
  ]
},
{
  id: 'table-l2-42',
  level: 2,
  tags: ['история', 'олимпиады'],
  titleRow: 'Летние Олимпиады: города и цифры',
  objectColumnLabel: 'Игры',
  rows: [
    { id: 'athens1896', label: 'Афины, 1896' },
    { id: 'paris1924', label: 'Париж, 1924' },
    { id: 'berlin1936', label: 'Берлин, 1936' },
    { id: 'melbourne1956', label: 'Мельбурн, 1956' },
    { id: 'moscow1980', label: 'Москва, 1980' },
    { id: 'seoul1988', label: 'Сеул, 1988' },
    { id: 'sydney2000', label: 'Сидней, 2000' },
    { id: 'beijing2008', label: 'Пекин, 2008' },
    { id: 'rio2016', label: 'Рио-де-Жанейро, 2016' },
    { id: 'tokyo2020', label: 'Токио, 2020' }
  ],
  columns: [
    {
      id: 'countries', label: 'Стран-участниц',
      align: 'center', kind: 'number',
      values: { athens1896: 14, paris1924: 44, berlin1936: 49,
                melbourne1956: 72, moscow1980: 80, seoul1988: 159,
                sydney2000: 199, beijing2008: 204, rio2016: 207,
                tokyo2020: 205 }
    },
    {
      id: 'athletes', label: 'Спортсменов', unit: 'чел.',
      align: 'center', kind: 'number',
      values: { athens1896: 241, paris1924: 3089, berlin1936: 3963,
                melbourne1956: 3314, moscow1980: 5179, seoul1988: 8391,
                sydney2000: 10651, beijing2008: 10942, rio2016: 11238,
                tokyo2020: 11420 }
    },
    {
      id: 'sports', label: 'Видов спорта',
      align: 'center', kind: 'number',
      values: { athens1896: 9, paris1924: 17, berlin1936: 19,
                melbourne1956: 17, moscow1980: 21, seoul1988: 23,
                sydney2000: 28, beijing2008: 28, rio2016: 28, tokyo2020: 33 }
    },
    {
      id: 'women', label: 'Доля женщин', unit: '%',
      align: 'center', kind: 'number',
      values: { athens1896: 0, paris1924: 4, berlin1936: 8, melbourne1956: 13,
                moscow1980: 22, seoul1988: 26, sydney2000: 38, beijing2008: 42,
                rio2016: 45, tokyo2020: 49 }
    },
    {
      id: 'continent', label: 'Часть света',
      align: 'left', kind: 'text',
      values: { athens1896: 'Европа', paris1924: 'Европа', berlin1936: 'Европа',
                melbourne1956: 'Австралия', moscow1980: 'Европа',
                seoul1988: 'Азия', sydney2000: 'Австралия',
                beijing2008: 'Азия', rio2016: 'Южная Америка',
                tokyo2020: 'Азия' }
    },
    {
      id: 'tickets', label: 'Продано билетов', unit: 'млн шт.',
      align: 'center', kind: 'number',
      values: {
        athens1896: 0.1,
        paris1924: 0.6,
        berlin1936: { min: 3, max: 5, step: 0.5 },
        melbourne1956: 1.5,
        moscow1980: { min: 4, max: 6, step: 0.5 },
        seoul1988: 3.3,
        sydney2000: { min: 6, max: 8, step: 0.5 },
        beijing2008: 6.5,
        rio2016: { min: 5, max: 7, step: 0.5 },
        tokyo2020: 0
      }
    }
  ]
},
{
  id: 'table-l2-43',
  level: 2,
  tags: ['еда', 'специи'],
  titleRow: 'Специи: откуда родом и что стоят',
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Специя',
  rows: [
    { id: 'saffron', label: 'Шафран' },
    { id: 'vanilla', label: 'Ваниль' },
    { id: 'cardamom', label: 'Кардамон' },
    { id: 'pepper', label: 'Чёрный перец' },
    { id: 'cinnamon', label: 'Корица' },
    { id: 'cloves', label: 'Гвоздика' },
    { id: 'ginger', label: 'Имбирь' },
    { id: 'nutmeg', label: 'Мускатный орех' },
    { id: 'paprika', label: 'Паприка' },
    { id: 'turmeric', label: 'Куркума' }
  ],
  columns: [
    {
      id: 'origin', label: 'Родина',
      align: 'left', kind: 'text',
      values: { saffron: 'Иран', vanilla: 'Мексика', cardamom: 'Индия',
                pepper: 'Индия', cinnamon: 'Шри-Ланка', cloves: 'Молуккские о-ва',
                ginger: 'Юго-Восточная Азия', nutmeg: 'Молуккские о-ва',
                paprika: 'Венгрия', turmeric: 'Индия' }
    },
    {
      id: 'part', label: 'Часть растения',
      align: 'center', kind: 'text',
      values: { saffron: 'Рыльца цветка', vanilla: 'Стручок', cardamom: 'Семена',
                pepper: 'Плоды', cinnamon: 'Кора', cloves: 'Бутоны',
                ginger: 'Корень', nutmeg: 'Семя', paprika: 'Плоды',
                turmeric: 'Корень' }
    },
    {
      id: 'price', label: 'Цена', unit: 'руб. за кг',
      align: 'center', kind: 'number',
      values: { saffron: 400000, vanilla: 60000, cardamom: 6000, pepper: 1200,
                cinnamon: 900, cloves: 2000, ginger: 400, nutmeg: 3000,
                paprika: 700, turmeric: 600 }
    },
    {
      id: 'flowers', label: 'Цветков на 1 г',
      align: 'center', kind: 'number',
      values: { saffron: 150, vanilla: 3, cardamom: 20, pepper: 30,
                cinnamon: 0, cloves: 60, ginger: 0, nutmeg: 1, paprika: 4,
                turmeric: 0 }
    },
    {
      id: 'used', label: 'Расход в столовой', unit: 'г в месяц',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        saffron: { min: 2, max: 10, step: 2 },
        vanilla: { min: 20, max: 60, step: 10 },
        cardamom: 80,
        pepper: { min: 400, max: 800, step: 100 },
        cinnamon: 300,
        cloves: { min: 40, max: 120, step: 20 },
        ginger: 500,
        nutmeg: 60,
        paprika: { min: 300, max: 700, step: 100 },
        turmeric: 250
      }
    },
    {
      id: 'shelf', label: 'Срок хранения', unit: 'мес.',
      align: 'center', kind: 'number',
      values: { saffron: 24, vanilla: 36, cardamom: 12, pepper: 36,
                cinnamon: 24, cloves: 24, ginger: 12, nutmeg: 24,
                paprika: 18, turmeric: 24 }
    }
  ]
},
{
  id: 'table-l2-44',
  level: 2,
  tags: ['география', 'границы'],
  titleRow: 'Необычные государственные границы',
  objectColumnLabel: 'Граница',
  rows: [
    { id: 'ruskaz', label: 'Россия — Казахстан' },
    { id: 'usacan', label: 'США — Канада' },
    { id: 'vatican', label: 'Ватикан — Италия' },
    { id: 'norsweden', label: 'Норвегия — Швеция' },
    { id: 'baarle', label: 'Бельгия — Нидерланды' },
    { id: 'chile', label: 'Чили — Аргентина' },
    { id: 'monaco', label: 'Монако — Франция' },
    { id: 'lesotho', label: 'Лесото — ЮАР' },
    { id: 'sanmarino', label: 'Сан-Марино — Италия' },
    { id: 'gibraltar', label: 'Гибралтар — Испания' }
  ],
  columns: [
    {
      id: 'length', label: 'Длина', unit: 'км',
      align: 'center', kind: 'number',
      values: { ruskaz: 7599, usacan: 8891, vatican: 3.2, norsweden: 1619,
                baarle: 5, chile: 5308, monaco: 5.5, lesotho: 909,
                sanmarino: 39, gibraltar: 1.2 }
    },
    {
      id: 'checkpoints', label: 'Пунктов пропуска',
      align: 'center', kind: 'number',
      values: {
        ruskaz: { min: 40, max: 80, step: 10 },
        usacan: { min: 100, max: 140, step: 10 },
        vatican: 0,
        norsweden: 0,
        baarle: 0,
        chile: { min: 20, max: 50, step: 6 },
        monaco: 0,
        lesotho: { min: 10, max: 22, step: 3 },
        sanmarino: 0,
        gibraltar: 1
      }
    },
    {
      id: 'oddity', label: 'Чем необычна',
      align: 'left', kind: 'text',
      values: { ruskaz: 'Самая длинная сухопутная', usacan: 'Прямая по параллели',
                vatican: 'Вокруг города', norsweden: 'Открыта в лесу',
                baarle: 'Дома надвое', chile: 'Идёт по горам',
                monaco: 'Окружает страну', lesotho: 'Страна внутри страны',
                sanmarino: 'Древняя республика',
                gibraltar: 'Проходит по полосе' }
    },
    {
      id: 'enclaves', label: 'Анклавов', unit: 'шт.',
      align: 'center', kind: 'number',
      values: { ruskaz: 0, usacan: 5, vatican: 0, norsweden: 0, baarle: 30,
                chile: 0, monaco: 0, lesotho: 0, sanmarino: 0, gibraltar: 0 }
    },
    {
      id: 'visa', label: 'Нужна виза',
      align: 'center', kind: 'text',
      values: { ruskaz: 'Нет', usacan: 'Да', vatican: 'Нет', norsweden: 'Нет',
                baarle: 'Нет', chile: 'Нет', monaco: 'Нет', lesotho: 'Да',
                sanmarino: 'Нет', gibraltar: 'Да' }
    },
    {
      id: 'crossings', label: 'Переходов за день', unit: 'тыс. чел.',
      align: 'center', kind: 'number',
      values: {
        ruskaz: { min: 20, max: 60, step: 10 },
        usacan: { min: 200, max: 400, step: 50 },
        vatican: 60,
        norsweden: { min: 10, max: 30, step: 5 },
        baarle: 8,
        chile: 15,
        monaco: { min: 40, max: 80, step: 10 },
        lesotho: 12,
        sanmarino: 9,
        gibraltar: 30
      }
    }
  ]
},
{
  id: 'table-l2-45',
  level: 2,
  tags: ['физика', 'холод'],
  titleRow: 'Самые холодные места и вещи',
  objectColumnLabel: 'Объект',
  rows: [
    { id: 'vostok', label: 'Станция Восток' },
    { id: 'oymyakon', label: 'Оймякон' },
    { id: 'freezer', label: 'Морозильник' },
    { id: 'dryice', label: 'Сухой лёд' },
    { id: 'nitrogen', label: 'Жидкий азот' },
    { id: 'moon', label: 'Кратеры Луны' },
    { id: 'pluto', label: 'Плутон' },
    { id: 'space', label: 'Межзвёздный газ' },
    { id: 'boomerang', label: 'Туманность Бумеранг' },
    { id: 'lab', label: 'Лабораторный рекорд' }
  ],
  columns: [
    {
      id: 'temp', label: 'Температура', unit: '°C',
      align: 'center', kind: 'number',
      values: { vostok: -89.2, oymyakon: -67.7, freezer: -18, dryice: -78.5,
                nitrogen: -196, moon: -248, pluto: -229, space: -270.4,
                boomerang: -272.15, lab: -273.149 }
    },
    {
      id: 'kelvin', label: 'По шкале Кельвина', unit: 'К',
      align: 'center', kind: 'number',
      values: { vostok: 184, oymyakon: 205, freezer: 255, dryice: 195,
                nitrogen: 77, moon: 25, pluto: 44, space: 2.7,
                boomerang: 1, lab: 0.000000001 }
    },
    {
      id: 'natural', label: 'Природное',
      align: 'center', kind: 'text',
      values: { vostok: 'Да', oymyakon: 'Да', freezer: 'Нет', dryice: 'Нет',
                nitrogen: 'Нет', moon: 'Да', pluto: 'Да', space: 'Да',
                boomerang: 'Да', lab: 'Нет' }
    },
    {
      id: 'where', label: 'Где находится',
      align: 'left', kind: 'text',
      values: { vostok: 'Антарктида', oymyakon: 'Якутия', freezer: 'Кухня',
                dryice: 'Лаборатория', nitrogen: 'Лаборатория',
                moon: 'Южный полюс Луны', pluto: 'Пояс Койпера',
                space: 'Везде', boomerang: 'Созвездие Центавра',
                lab: 'Лаборатория' }
    },
    {
      id: 'year', label: 'Год замера',
      align: 'center', kind: 'number',
      values: { vostok: 1983, oymyakon: 1933, freezer: 1930, dryice: 1835,
                nitrogen: 1883, moon: 2009, pluto: 2015, space: 1965,
                boomerang: 1995, lab: 2021 }
    },
    {
      id: 'people', label: 'Живут ли там люди',
      align: 'center', kind: 'text',
      values: { vostok: 'Зимовщики', oymyakon: 'Село', freezer: 'Нет',
                dryice: 'Нет', nitrogen: 'Нет', moon: 'Нет', pluto: 'Нет',
                space: 'Нет', boomerang: 'Нет', lab: 'Нет' }
    }
  ]
},
{
  id: 'table-l2-46',
  level: 2,
  tags: ['культура', 'кино'],
  titleRow: 'Как снимали известные эффекты',
  objectColumnLabel: 'Приём',
  rows: [
    { id: 'stopmotion', label: 'Покадровая анимация' },
    { id: 'greenscreen', label: 'Зелёный экран' },
    { id: 'miniature', label: 'Миниатюры' },
    { id: 'motioncapture', label: 'Захват движения' },
    { id: 'matte', label: 'Дорисовка фона' },
    { id: 'practical', label: 'Механические куклы' },
    { id: 'bullettime', label: 'Съёмка вокруг объекта' },
    { id: 'cgi', label: 'Компьютерная графика' },
    { id: 'forcedperspective', label: 'Игра с перспективой' },
    { id: 'drone', label: 'Съёмка с дрона' }
  ],
  columns: [
    {
      id: 'first', label: 'Первое применение',
      align: 'center', kind: 'number',
      values: { stopmotion: 1898, greenscreen: 1940, miniature: 1902,
                motioncapture: 1983, matte: 1907, practical: 1933,
                bullettime: 1999, cgi: 1973, forcedperspective: 1922,
                drone: 2010 }
    },
    {
      id: 'cost', label: 'Стоимость минуты', unit: 'тыс. руб.',
      align: 'center', kind: 'number',
      values: {
        stopmotion: { min: 300, max: 700, step: 100 },
        greenscreen: 150,
        miniature: { min: 400, max: 1200, step: 200 },
        motioncapture: 800,
        matte: 200,
        practical: { min: 500, max: 1500, step: 250 },
        bullettime: 2000,
        cgi: { min: 1000, max: 3000, step: 500 },
        forcedperspective: 50,
        drone: { min: 60, max: 180, step: 30 }
      }
    },
    {
      id: 'time', label: 'Время на минуту', unit: 'дней',
      align: 'center', kind: 'number',
      values: { stopmotion: 30, greenscreen: 2, miniature: 14, motioncapture: 5,
                matte: 7, practical: 20, bullettime: 10, cgi: 25,
                forcedperspective: 1, drone: 1 }
    },
    {
      id: 'people', label: 'Человек в группе',
      align: 'center', kind: 'number',
      values: { stopmotion: 12, greenscreen: 20, miniature: 25,
                motioncapture: 30, matte: 6, practical: 18, bullettime: 40,
                cgi: 80, forcedperspective: 8, drone: 4 }
    },
    {
      id: 'digital', label: 'Нужен компьютер',
      align: 'center', kind: 'text',
      values: { stopmotion: 'Нет', greenscreen: 'Да', miniature: 'Нет',
                motioncapture: 'Да', matte: 'Частично', practical: 'Нет',
                bullettime: 'Да', cgi: 'Да', forcedperspective: 'Нет',
                drone: 'Частично' }
    },
    {
      id: 'usenow', label: 'Применяют сегодня',
      align: 'center', kind: 'text',
      values: { stopmotion: 'Редко', greenscreen: 'Часто', miniature: 'Редко',
                motioncapture: 'Часто', matte: 'Редко', practical: 'Иногда',
                bullettime: 'Иногда', cgi: 'Постоянно',
                forcedperspective: 'Иногда', drone: 'Часто' }
    }
  ]
},
{
  id: 'table-l2-47',
  level: 2,
  tags: ['биология', 'кости'],
  titleRow: 'Скелет человека в числах',
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Отдел скелета',
  rows: [
    { id: 'skull', label: 'Череп' },
    { id: 'spine', label: 'Позвоночник' },
    { id: 'ribs', label: 'Рёбра и грудина' },
    { id: 'shoulder', label: 'Плечевой пояс' },
    { id: 'arm', label: 'Свободная рука' },
    { id: 'hand', label: 'Кисть' },
    { id: 'pelvis', label: 'Таз' },
    { id: 'leg', label: 'Свободная нога' },
    { id: 'foot', label: 'Стопа' },
    { id: 'ear', label: 'Слуховые косточки' }
  ],
  columns: [
    {
      id: 'bones', label: 'Костей', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: { skull: 29, spine: 26, ribs: 25, shoulder: 4, arm: 6,
                hand: 54, pelvis: 2, leg: 8, foot: 52, ear: 6 }
    },
    {
      id: 'longest', label: 'Самая длинная кость', unit: 'см',
      align: 'center', kind: 'number',
      values: { skull: 12, spine: 5, ribs: 24, shoulder: 15, arm: 36,
                hand: 8, pelvis: 20, leg: 48, foot: 7, ear: 0.3 }
    },
    {
      id: 'joints', label: 'Суставов', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: { skull: 2, spine: 25, ribs: 24, shoulder: 4, arm: 3,
                hand: 36, pelvis: 3, leg: 4, foot: 33, ear: 2 }
    },
    {
      id: 'fractures', label: 'Доля переломов', unit: '%',
      align: 'center', kind: 'number',
      values: { skull: 3, spine: 6, ribs: 10, shoulder: 5, arm: 18,
                hand: 22, pelvis: 2, leg: 20, foot: 14, ear: 0 }
    },
    {
      id: 'healing', label: 'Срастание', unit: 'недель',
      align: 'center', kind: 'number',
      values: { skull: 8, spine: 12, ribs: 5, shoulder: 6, arm: 8,
                hand: 4, pelvis: 12, leg: 14, foot: 6, ear: 0 }
    },
    {
      id: 'growth', label: 'Растёт до', unit: 'лет',
      align: 'center', kind: 'number',
      values: { skull: 20, spine: 25, ribs: 22, shoulder: 21, arm: 20,
                hand: 18, pelvis: 25, leg: 19, foot: 17, ear: 1 }
    }
  ]
},
{
  id: 'table-l2-48',
  level: 2,
  tags: ['информатика', 'игры'],
  titleRow: 'Игры, которые обыграли человека',
  objectColumnLabel: 'Игра',
  rows: [
    { id: 'checkers', label: 'Шашки' },
    { id: 'chess', label: 'Шахматы' },
    { id: 'go', label: 'Го' },
    { id: 'backgammon', label: 'Нарды' },
    { id: 'othello', label: 'Реверси' },
    { id: 'poker', label: 'Покер' },
    { id: 'jeopardy', label: 'Викторина' },
    { id: 'starcraft', label: 'Стратегия в реальном времени' },
    { id: 'dota', label: 'Командная онлайн-игра' },
    { id: 'crossword', label: 'Кроссворд' }
  ],
  columns: [
    {
      id: 'year', label: 'Год победы машины',
      align: 'center', kind: 'number',
      values: { checkers: 1994, chess: 1997, go: 2016, backgammon: 1979,
                othello: 1997, poker: 2017, jeopardy: 2011, starcraft: 2019,
                dota: 2019, crossword: 2021 }
    },
    {
      id: 'positions', label: 'Число позиций',
      align: 'center', kind: 'text',
      values: { checkers: '5·10²⁰', chess: '10⁴⁴', go: '10¹⁷⁰',
                backgammon: '10²⁰', othello: '10²⁸', poker: '10¹⁶⁰',
                jeopardy: 'Не считается', starcraft: '10²⁷⁰',
                dota: '10³⁰⁰', crossword: '10¹⁰' }
    },
    {
      id: 'branching', label: 'Ходов в позиции',
      align: 'center', kind: 'number',
      values: { checkers: 8, chess: 35, go: 250, backgammon: 420, othello: 10,
                poker: 3, jeopardy: 1, starcraft: 1000, dota: 1000,
                crossword: 5 }
    },
    {
      id: 'solved', label: 'Просчитана до конца',
      align: 'center', kind: 'text',
      values: { checkers: 'Да', chess: 'Нет', go: 'Нет', backgammon: 'Нет',
                othello: 'Да', poker: 'Частично', jeopardy: 'Нет',
                starcraft: 'Нет', dota: 'Нет', crossword: 'Нет' }
    },
    {
      id: 'method', label: 'Как выиграла',
      align: 'left', kind: 'text',
      values: { checkers: 'Полный перебор', chess: 'Перебор и оценка',
                go: 'Обучение на партиях', backgammon: 'Нейросеть',
                othello: 'Перебор', poker: 'Теория игр',
                jeopardy: 'Поиск по базе', starcraft: 'Обучение с подкреплением',
                dota: 'Самообучение', crossword: 'Поиск по базе' }
    },
    {
      id: 'games', label: 'Партий на обучение', unit: 'млн',
      align: 'center', kind: 'number',
      values: {
        checkers: 0,
        chess: { min: 40, max: 120, step: 20 },
        go: { min: 20, max: 60, step: 10 },
        backgammon: 1.5,
        othello: 0,
        poker: { min: 8, max: 24, step: 4 },
        jeopardy: 0,
        starcraft: { min: 100, max: 300, step: 50 },
        dota: 200,
        crossword: 0
      }
    }
  ]
},
{
  id: 'table-l2-49',
  level: 2,
  tags: ['география', 'подземное'],
  titleRow: 'Что находится под землёй',
  objectColumnLabel: 'Объект',
  rows: [
    { id: 'kola', label: 'Кольская скважина' },
    { id: 'mponeng', label: 'Шахта Мпоненг' },
    { id: 'veryovkina', label: 'Пещера Верёвкина' },
    { id: 'metro', label: 'Станция «Арсенальная»' },
    { id: 'lhc', label: 'Большой коллайдер' },
    { id: 'seed', label: 'Хранилище семян' },
    { id: 'catacombs', label: 'Парижские катакомбы' },
    { id: 'derinkuyu', label: 'Город Деринкую' },
    { id: 'gotthard', label: 'Готардский тоннель' },
    { id: 'observatory', label: 'Подземная обсерватория' }
  ],
  columns: [
    {
      id: 'depth', label: 'Глубина', unit: 'м',
      align: 'center', kind: 'number',
      values: { kola: 12262, mponeng: 4000, veryovkina: 2212, metro: 105.5,
                lhc: 175, seed: 130, catacombs: 20, derinkuyu: 85,
                gotthard: 2300, observatory: 1400 }
    },
    {
      id: 'year', label: 'Год создания',
      align: 'center', kind: 'number',
      values: { kola: 1970, mponeng: 1986, veryovkina: 1968, metro: 1960,
                lhc: 2008, seed: 2008, catacombs: 1786, derinkuyu: -800,
                gotthard: 2016, observatory: 1965 }
    },
    {
      id: 'purpose', label: 'Зачем',
      align: 'left', kind: 'text',
      values: { kola: 'Изучение коры', mponeng: 'Добыча золота',
                veryovkina: 'Природная полость', metro: 'Перевозка людей',
                lhc: 'Опыты с частицами', seed: 'Хранение семян',
                catacombs: 'Кладбище', derinkuyu: 'Укрытие',
                gotthard: 'Проезд поездов', observatory: 'Поиск нейтрино' }
    },
    {
      id: 'temp', label: 'Температура внизу', unit: '°C',
      align: 'center', kind: 'number',
      values: { kola: 220, mponeng: 66, veryovkina: 7, metro: 14, lhc: 20,
                seed: -18, catacombs: 14, derinkuyu: 13, gotthard: 45,
                observatory: 30 }
    },
    {
      id: 'access', label: 'Можно посетить',
      align: 'center', kind: 'text',
      values: { kola: 'Нет', mponeng: 'Нет', veryovkina: 'Только спелеологам',
                metro: 'Да', lhc: 'По записи', seed: 'Нет', catacombs: 'Да',
                derinkuyu: 'Да', gotthard: 'На поезде', observatory: 'По записи' }
    },
    {
      id: 'visitors', label: 'Людей внизу за день', unit: 'чел.',
      align: 'center', kind: 'number',
      values: {
        kola: 0,
        mponeng: { min: 2000, max: 4000, step: 500 },
        veryovkina: 2,
        metro: { min: 20000, max: 60000, step: 10000 },
        lhc: { min: 100, max: 300, step: 50 },
        seed: 1,
        catacombs: { min: 400, max: 1200, step: 200 },
        derinkuyu: 800,
        gotthard: 25000,
        observatory: 40
      }
    }
  ]
},
{
  id: 'table-l2-50',
  level: 2,
  tags: ['школа', 'проект'],
  titleRow: 'Итоги школьной ярмарки проектов',
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Проект',
  rows: [
    { id: 'greenhouse', label: 'Умная теплица' },
    { id: 'weather', label: 'Школьная метеостанция' },
    { id: 'app', label: 'Приложение с расписанием' },
    { id: 'rocket', label: 'Модель ракеты' },
    { id: 'museum', label: 'Виртуальный музей' },
    { id: 'sorter', label: 'Сортировщик мусора' },
    { id: 'newspaper', label: 'Школьная газета' },
    { id: 'sundial', label: 'Солнечные часы' },
    { id: 'hydroponics', label: 'Гидропоника на окне' },
    { id: 'quadcopter', label: 'Самодельный квадрокоптер' }
  ],
  columns: [
    {
      id: 'team', label: 'Участников', unit: 'чел.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        greenhouse: { min: 3, max: 7, step: 1 },
        weather: 4,
        app: { min: 2, max: 6, step: 1 },
        rocket: 5,
        museum: { min: 4, max: 10, step: 1 },
        sorter: 6,
        newspaper: { min: 6, max: 14, step: 2 },
        sundial: 2,
        hydroponics: 3,
        quadcopter: { min: 2, max: 8, step: 1 }
      }
    },
    {
      id: 'weeks', label: 'Работали', unit: 'недель',
      align: 'center', kind: 'number',
      values: { greenhouse: 14, weather: 10, app: 8, rocket: 6, museum: 12,
                sorter: 16, newspaper: 30, sundial: 3, hydroponics: 9,
                quadcopter: 20 }
    },
    {
      id: 'cost', label: 'Затраты', unit: 'руб.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        greenhouse: { min: 4000, max: 9000, step: 1000 },
        weather: 6000,
        app: 0,
        rocket: { min: 1500, max: 4500, step: 500 },
        museum: 500,
        sorter: { min: 7000, max: 15000, step: 2000 },
        newspaper: 3000,
        sundial: 800,
        hydroponics: { min: 2000, max: 5000, step: 600 },
        quadcopter: 12000
      }
    },
    {
      id: 'votes', label: 'Голосов зрителей', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        greenhouse: 72,
        weather: { min: 40, max: 88, step: 8 },
        app: 95,
        rocket: { min: 60, max: 120, step: 10 },
        museum: 48,
        sorter: 81,
        newspaper: { min: 30, max: 70, step: 8 },
        sundial: 25,
        hydroponics: 39,
        quadcopter: { min: 80, max: 140, step: 10 }
      }
    },
    {
      id: 'field', label: 'Направление',
      align: 'center', kind: 'text',
      values: { greenhouse: 'Биология', weather: 'Физика',
                app: 'Информатика', rocket: 'Физика', museum: 'История',
                sorter: 'Экология', newspaper: 'Словесность',
                sundial: 'Астрономия', hydroponics: 'Биология',
                quadcopter: 'Техника' }
    },
    {
      id: 'grade', label: 'Класс авторов',
      align: 'center', kind: 'text',
      values: { greenhouse: '8–9', weather: '7–8', app: '9–11', rocket: '6–7',
                museum: '8–10', sorter: '9–11', newspaper: '5–11',
                sundial: '5–6', hydroponics: '6–8', quadcopter: '9–11' }
    }
  ]
}

];
