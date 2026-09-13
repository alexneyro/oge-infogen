import { Task13TableSrc } from '../task13data';

export const TASK13_TABLES_L1: Task13TableSrc[] = [
  // --- УРОВЕНЬ 1 ---
{
  id: 'table-l1-1',
  level: 1,
  tags: ['космос'],
  objectColumnLabel: 'Планета',
  rows: [
    { id: 'mercury', label: 'Меркурий' },
    { id: 'venus', label: 'Венера' },
    { id: 'earth', label: 'Земля' },
    { id: 'mars', label: 'Марс' },
    { id: 'jupiter', label: 'Юпитер' },
    { id: 'saturn', label: 'Сатурн' },
    { id: 'uranus', label: 'Уран' },
    { id: 'neptune', label: 'Нептун' }
  ],
  columns: [
    {
      id: 'distance', label: 'Расстояние от Солнца', unit: 'млн км',
      align: 'center', kind: 'number',
      values: { mercury: 58, venus: 108, earth: 150, mars: 228,
                jupiter: 778, saturn: 1432, uranus: 2867, neptune: 4515 }
    },
    {
      id: 'diameter', label: 'Диаметр', unit: 'км',
      align: 'center', kind: 'number',
      values: { mercury: 4879, venus: 12104, earth: 12742, mars: 6779,
                jupiter: 139820, saturn: 116460, uranus: 50724, neptune: 49244 }
    },
    {
      id: 'year', label: 'Год', unit: 'земных суток',
      align: 'center', kind: 'number',
      values: { mercury: 88, venus: 225, earth: 365, mars: 687,
                jupiter: 4333, saturn: 10759, uranus: 30687, neptune: 60190 }
    },
    {
      id: 'day', label: 'Сутки', unit: 'ч',
      align: 'center', kind: 'number',
      values: { mercury: 1408, venus: 5832, earth: 24, mars: 24.7,
                jupiter: 9.9, saturn: 10.7, uranus: 17.2, neptune: 16.1 }
    },
    {
      id: 'temp', label: 'Средняя температура', unit: '°C',
      align: 'center', kind: 'number',
      values: { mercury: 167, venus: 464, earth: 15, mars: -63,
                jupiter: -108, saturn: -139, uranus: -195, neptune: -201 }
    }
  ]
},
{
  id: 'table-l1-2',
  level: 1,
  tags: ['география', 'озёра'],
  objectColumnLabel: 'Озеро',
  rows: [
    { id: 'caspian', label: 'Каспийское' },
    { id: 'superior', label: 'Верхнее' },
    { id: 'victoria', label: 'Виктория' },
    { id: 'huron', label: 'Гурон' },
    { id: 'michigan', label: 'Мичиган' },
    { id: 'tanganyika', label: 'Танганьика' },
    { id: 'baikal', label: 'Байкал' },
    { id: 'bear', label: 'Большое Медвежье' }
  ],
  columns: [
    {
      id: 'area', label: 'Площадь', unit: 'тыс. км²',
      align: 'center', kind: 'number',
      values: { caspian: 371, superior: 82.1, victoria: 68.9, huron: 59.6,
                michigan: 58, tanganyika: 32.9, baikal: 31.7, bear: 31.1 }
    },
    {
      id: 'depth', label: 'Наибольшая глубина', unit: 'м',
      align: 'center', kind: 'number',
      values: { caspian: 1025, superior: 406, victoria: 84, huron: 229,
                michigan: 281, tanganyika: 1470, baikal: 1642, bear: 446 }
    },
    {
      id: 'volume', label: 'Объём воды', unit: 'тыс. км³',
      align: 'center', kind: 'number',
      values: { caspian: 78.2, superior: 12.1, victoria: 2.8, huron: 3.5,
                michigan: 4.9, tanganyika: 18.9, baikal: 23.6, bear: 2.2 }
    },
    {
      id: 'height', label: 'Высота над морем', unit: 'м',
      align: 'center', kind: 'number',
      values: { caspian: -28, superior: 183, victoria: 1134, huron: 176,
                michigan: 176, tanganyika: 773, baikal: 456, bear: 156 }
    },
    {
      id: 'continent', label: 'Часть света',
      align: 'left', kind: 'text',
      values: { caspian: 'Евразия', superior: 'Северная Америка',
                victoria: 'Африка', huron: 'Северная Америка',
                michigan: 'Северная Америка', tanganyika: 'Африка',
                baikal: 'Евразия', bear: 'Северная Америка' }
    }
  ]
},
{
  id: 'table-l1-3',
  level: 1,
  tags: ['школа', 'кружки'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Кружок',
  rows: [
    { id: 'robots', label: 'Робототехника' },
    { id: 'chess', label: 'Шахматы' },
    { id: 'choir', label: 'Хор' },
    { id: 'theatre', label: 'Театральная студия' },
    { id: 'volley', label: 'Волейбол' },
    { id: 'chem', label: 'Юный химик' },
    { id: 'photo', label: 'Фотокружок' },
    { id: 'code', label: 'Программирование' }
  ],
  columns: [
    {
      id: 'members', label: 'Участники', unit: 'чел.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        robots: { min: 10, max: 18, step: 2 },
        chess: 14,
        choir: { min: 20, max: 32, step: 3 },
        theatre: 16,
        volley: { min: 12, max: 20, step: 2 },
        chem: 11,
        photo: 9,
        code: 15
      }
    },
    {
      id: 'lessons', label: 'Занятий в неделю',
      align: 'center', kind: 'number',
      values: { robots: 2, chess: 2, choir: 3, theatre: 2,
                volley: 3, chem: 1, photo: 1, code: 2 }
    },
    {
      id: 'duration', label: 'Длительность', unit: 'мин',
      align: 'center', kind: 'number',
      values: { robots: 90, chess: 60, choir: 45, theatre: 90,
                volley: 60, chem: 90, photo: 60, code: 90 }
    },
    {
      id: 'room', label: 'Кабинет',
      align: 'center', kind: 'text',
      values: { robots: '214', chess: '105', choir: 'Актовый зал',
                theatre: 'Актовый зал', volley: 'Спортзал', chem: '308',
                photo: '112', code: '215' }
    },
    {
      id: 'grades', label: 'Классы',
      align: 'center', kind: 'text',
      values: { robots: '5–9', chess: '2–11', choir: '1–7', theatre: '5–11',
                volley: '6–11', chem: '8–11', photo: '7–11', code: '7–11' }
    }
  ]
},
{
  id: 'table-l1-4',
  level: 1,
  tags: ['животные', 'собаки'],
  objectColumnLabel: 'Порода',
  rows: [
    { id: 'shepherd', label: 'Немецкая овчарка' },
    { id: 'labrador', label: 'Лабрадор-ретривер' },
    { id: 'dachshund', label: 'Такса' },
    { id: 'chihuahua', label: 'Чихуахуа' },
    { id: 'husky', label: 'Сибирский хаски' },
    { id: 'beagle', label: 'Бигль' },
    { id: 'rottweiler', label: 'Ротвейлер' },
    { id: 'corgi', label: 'Вельш-корги пемброк' }
  ],
  columns: [
    {
      id: 'height', label: 'Рост в холке', unit: 'см',
      align: 'center', kind: 'number',
      values: { shepherd: 60, labrador: 57, dachshund: 22, chihuahua: 20,
                husky: 55, beagle: 38, rottweiler: 63, corgi: 27 }
    },
    {
      id: 'weight', label: 'Масса', unit: 'кг',
      align: 'center', kind: 'number',
      values: { shepherd: 34, labrador: 32, dachshund: 9, chihuahua: 2,
                husky: 23, beagle: 11, rottweiler: 50, corgi: 12 }
    },
    {
      id: 'lifespan', label: 'Срок жизни', unit: 'лет',
      align: 'center', kind: 'number',
      values: { shepherd: 11, labrador: 12, dachshund: 13, chihuahua: 15,
                husky: 13, beagle: 13, rottweiler: 9, corgi: 13 }
    },
    {
      id: 'puppies', label: 'Щенков в помёте',
      align: 'center', kind: 'number',
      values: {
        shepherd: { min: 5, max: 9, step: 1 },
        labrador: { min: 6, max: 10, step: 1 },
        dachshund: 4,
        chihuahua: 3,
        husky: 6,
        beagle: 6,
        rottweiler: { min: 6, max: 10, step: 1 },
        corgi: 7
      }
    },
    {
      id: 'origin', label: 'Родина породы',
      align: 'left', kind: 'text',
      values: { shepherd: 'Германия', labrador: 'Канада', dachshund: 'Германия',
                chihuahua: 'Мексика', husky: 'Россия', beagle: 'Англия',
                rottweiler: 'Германия', corgi: 'Уэльс' }
    }
  ]
},
{
  id: 'table-l1-5',
  level: 1,
  tags: ['животные', 'рекорды'],
  objectColumnLabel: 'Животное',
  rows: [
    { id: 'cheetah', label: 'Гепард' },
    { id: 'falcon', label: 'Сапсан' },
    { id: 'pronghorn', label: 'Вилорог' },
    { id: 'lion', label: 'Лев' },
    { id: 'hare', label: 'Заяц-русак' },
    { id: 'sailfish', label: 'Парусник' },
    { id: 'orca', label: 'Косатка' },
    { id: 'kangaroo', label: 'Серый кенгуру' }
  ],
  columns: [
    {
      id: 'speed', label: 'Скорость', unit: 'км/ч',
      align: 'center', kind: 'number',
      values: { cheetah: 120, falcon: 350, pronghorn: 88, lion: 80,
                hare: 70, sailfish: 100, orca: 55, kangaroo: 65 }
    },
    {
      id: 'length', label: 'Длина тела', unit: 'см',
      align: 'center', kind: 'number',
      values: { cheetah: 130, falcon: 45, pronghorn: 140, lion: 190,
                hare: 60, sailfish: 300, orca: 700, kangaroo: 130 }
    },
    {
      id: 'env', label: 'Среда',
      align: 'center', kind: 'text',
      values: { cheetah: 'Суша', falcon: 'Воздух', pronghorn: 'Суша',
                lion: 'Суша', hare: 'Суша', sailfish: 'Вода',
                orca: 'Вода', kangaroo: 'Суша' }
    },
    {
      id: 'lifespan', label: 'Срок жизни', unit: 'лет',
      align: 'center', kind: 'number',
      values: {
        cheetah: { min: 10, max: 14, step: 1 },
        falcon: 15,
        pronghorn: 10,
        lion: { min: 12, max: 20, step: 2 },
        hare: 8,
        sailfish: 10,
        orca: { min: 30, max: 50, step: 5 },
        kangaroo: 18
      }
    },
    {
      id: 'range', label: 'Где обитает',
      align: 'left', kind: 'text',
      values: { cheetah: 'Африка', falcon: 'Все материки',
                pronghorn: 'Северная Америка', lion: 'Африка',
                hare: 'Евразия', sailfish: 'Тёплые моря',
                orca: 'Все океаны', kangaroo: 'Австралия' }
    }
  ]
},
{
  id: 'table-l1-6',
  level: 1,
  tags: ['география', 'страны'],
  objectColumnLabel: 'Страна',
  rows: [
    { id: 'russia', label: 'Россия' },
    { id: 'canada', label: 'Канада' },
    { id: 'china', label: 'Китай' },
    { id: 'brazil', label: 'Бразилия' },
    { id: 'australia', label: 'Австралия' },
    { id: 'india', label: 'Индия' },
    { id: 'argentina', label: 'Аргентина' },
    { id: 'kazakhstan', label: 'Казахстан' }
  ],
  columns: [
    {
      id: 'area', label: 'Площадь', unit: 'тыс. км²',
      align: 'center', kind: 'number',
      values: { russia: 17098, canada: 9985, china: 9597, brazil: 8516,
                australia: 7692, india: 3287, argentina: 2780, kazakhstan: 2725 }
    },
    {
      id: 'population', label: 'Население', unit: 'млн чел.',
      align: 'center', kind: 'number',
      values: { russia: 146, canada: 41, china: 1408, brazil: 213,
                australia: 27, india: 1450, argentina: 46, kazakhstan: 20 }
    },
    {
      id: 'capital', label: 'Столица',
      align: 'left', kind: 'text',
      values: { russia: 'Москва', canada: 'Оттава', china: 'Пекин',
                brazil: 'Бразилиа', australia: 'Канберра', india: 'Нью-Дели',
                argentina: 'Буэнос-Айрес', kazakhstan: 'Астана' }
    },
    {
      id: 'currency', label: 'Валюта',
      align: 'left', kind: 'text',
      values: { russia: 'Рубль', canada: 'Доллар', china: 'Юань',
                brazil: 'Реал', australia: 'Доллар', india: 'Рупия',
                argentina: 'Песо', kazakhstan: 'Тенге' }
    },
    {
      id: 'zones', label: 'Часовых поясов',
      align: 'center', kind: 'number',
      values: { russia: 11, canada: 6, china: 1, brazil: 4,
                australia: 3, india: 1, argentina: 1, kazakhstan: 1 }
    }
  ]
},
{
  id: 'table-l1-7',
  level: 1,
  tags: ['еда', 'школа'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Блюдо',
  rows: [
    { id: 'kasha', label: 'Каша гречневая' },
    { id: 'soup', label: 'Суп куриный' },
    { id: 'cutlet', label: 'Котлета' },
    { id: 'puree', label: 'Пюре картофельное' },
    { id: 'salad', label: 'Салат овощной' },
    { id: 'compote', label: 'Компот' },
    { id: 'bun', label: 'Булочка' },
    { id: 'tea', label: 'Чай с сахаром' }
  ],
  columns: [
    {
      id: 'mass', label: 'Масса порции', unit: 'г',
      align: 'center', kind: 'number',
      values: { kasha: 200, soup: 250, cutlet: 100, puree: 180,
                salad: 100, compote: 200, bun: 80, tea: 200 }
    },
    {
      id: 'calories', label: 'Калорийность', unit: 'ккал',
      align: 'center', kind: 'number',
      values: { kasha: 250, soup: 180, cutlet: 260, puree: 190,
                salad: 70, compote: 90, bun: 250, tea: 45 }
    },
    {
      id: 'price', label: 'Цена', unit: 'руб.',
      align: 'center', kind: 'number',
      values: { kasha: 60, soup: 80, cutlet: 95, puree: 55,
                salad: 45, compote: 30, bun: 40, tea: 20 }
    },
    {
      id: 'sold', label: 'Продано за день', unit: 'порций',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        kasha: { min: 40, max: 80, step: 10 },
        soup: 45,
        cutlet: 70,
        puree: 65,
        salad: 40,
        compote: { min: 100, max: 180, step: 20 },
        bun: { min: 60, max: 120, step: 15 },
        tea: 120
      }
    },
    {
      id: 'shift', label: 'Смена',
      align: 'center', kind: 'text',
      values: { kasha: 'Первая', soup: 'Вторая', cutlet: 'Вторая',
                puree: 'Вторая', salad: 'Обе', compote: 'Обе',
                bun: 'Первая', tea: 'Обе' }
    }
  ]
},
{
  id: 'table-l1-8',
  level: 1,
  tags: ['музыка', 'инструменты'],
  objectColumnLabel: 'Инструмент',
  rows: [
    { id: 'guitar', label: 'Гитара' },
    { id: 'violin', label: 'Скрипка' },
    { id: 'cello', label: 'Виолончель' },
    { id: 'bass', label: 'Контрабас' },
    { id: 'harp', label: 'Арфа' },
    { id: 'balalaika', label: 'Балалайка' },
    { id: 'domra', label: 'Домра' },
    { id: 'banjo', label: 'Банджо' }
  ],
  columns: [
    {
      id: 'strings', label: 'Число струн',
      align: 'center', kind: 'number',
      values: { guitar: 6, violin: 4, cello: 4, bass: 4,
                harp: 47, balalaika: 3, domra: 3, banjo: 5 }
    },
    {
      id: 'length', label: 'Высота', unit: 'см',
      align: 'center', kind: 'number',
      values: { guitar: 100, violin: 60, cello: 120, bass: 180,
                harp: 180, balalaika: 70, domra: 65, banjo: 90 }
    },
    {
      id: 'weight', label: 'Масса', unit: 'кг',
      align: 'center', kind: 'number',
      values: { guitar: 2, violin: 0.4, cello: 3, bass: 10,
                harp: 35, balalaika: 1, domra: 1, banjo: 3 }
    },
    {
      id: 'group', label: 'Группа',
      align: 'left', kind: 'text',
      values: { guitar: 'Щипковые', violin: 'Смычковые', cello: 'Смычковые',
                bass: 'Смычковые', harp: 'Щипковые', balalaika: 'Щипковые',
                domra: 'Щипковые', banjo: 'Щипковые' }
    },
    {
      id: 'origin', label: 'Откуда родом',
      align: 'left', kind: 'text',
      values: { guitar: 'Испания', violin: 'Италия', cello: 'Италия',
                bass: 'Италия', harp: 'Древний Египет', balalaika: 'Россия',
                domra: 'Россия', banjo: 'США' }
    }
  ]
},
{
  id: 'table-l1-9',
  level: 1,
  tags: ['библиотека', 'книги'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Раздел',
  rows: [
    { id: 'sf', label: 'Фантастика' },
    { id: 'adventure', label: 'Приключения' },
    { id: 'detective', label: 'Детективы' },
    { id: 'poetry', label: 'Поэзия' },
    { id: 'history', label: 'Историческая проза' },
    { id: 'encyclopedia', label: 'Энциклопедии' },
    { id: 'comics', label: 'Комиксы' },
    { id: 'nature', label: 'Книги о природе' }
  ],
  columns: [
    {
      id: 'books', label: 'Книг в разделе', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        sf: { min: 240, max: 400, step: 40 },
        adventure: 310,
        detective: 260,
        poetry: 180,
        history: 220,
        encyclopedia: 150,
        comics: { min: 60, max: 140, step: 20 },
        nature: 200
      }
    },
    {
      id: 'issued', label: 'Выдано за месяц', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        sf: 85,
        adventure: 70,
        detective: { min: 30, max: 70, step: 10 },
        poetry: { min: 5, max: 25, step: 5 },
        history: 25,
        encyclopedia: 40,
        comics: 95,
        nature: 45
      }
    },
    {
      id: 'pages', label: 'Средний объём', unit: 'стр.',
      align: 'center', kind: 'number',
      values: { sf: 320, adventure: 280, detective: 300, poetry: 140,
                history: 420, encyclopedia: 260, comics: 90, nature: 180 }
    },
    {
      id: 'shelf', label: 'Стеллаж',
      align: 'center', kind: 'text',
      values: { sf: 'А1', adventure: 'А2', detective: 'Б1', poetry: 'Б2',
                history: 'В1', encyclopedia: 'В2', comics: 'Г1', nature: 'Г2' }
    },
    {
      id: 'age', label: 'Возраст читателя',
      align: 'center', kind: 'text',
      values: { sf: '12+', adventure: '10+', detective: '14+', poetry: '12+',
                history: '14+', encyclopedia: '8+', comics: '6+', nature: '8+' }
    }
  ]
},
{
  id: 'table-l1-10',
  level: 1,
  tags: ['спорт'],
  objectColumnLabel: 'Вид спорта',
  rows: [
    { id: 'football', label: 'Футбол' },
    { id: 'basketball', label: 'Баскетбол' },
    { id: 'volleyball', label: 'Волейбол' },
    { id: 'handball', label: 'Гандбол' },
    { id: 'hockey', label: 'Хоккей с шайбой' },
    { id: 'waterpolo', label: 'Водное поло' },
    { id: 'rugby', label: 'Регби' },
    { id: 'beach', label: 'Пляжный волейбол' }
  ],
  columns: [
    {
      id: 'players', label: 'Игроков в команде',
      align: 'center', kind: 'number',
      values: { football: 11, basketball: 5, volleyball: 6, handball: 7,
                hockey: 6, waterpolo: 7, rugby: 15, beach: 2 }
    },
    {
      id: 'periods', label: 'Периодов в матче',
      align: 'center', kind: 'number',
      values: { football: 2, basketball: 4, volleyball: 5, handball: 2,
                hockey: 3, waterpolo: 4, rugby: 2, beach: 3 }
    },
    {
      id: 'fieldLength', label: 'Длина площадки', unit: 'м',
      align: 'center', kind: 'number',
      values: { football: 105, basketball: 28, volleyball: 18, handball: 40,
                hockey: 60, waterpolo: 30, rugby: 100, beach: 16 }
    },
    {
      id: 'fieldWidth', label: 'Ширина площадки', unit: 'м',
      align: 'center', kind: 'number',
      values: { football: 68, basketball: 15, volleyball: 9, handball: 20,
                hockey: 30, waterpolo: 20, rugby: 70, beach: 8 }
    },
    {
      id: 'ball', label: 'Масса снаряда', unit: 'г',
      align: 'center', kind: 'number',
      values: { football: 430, basketball: 600, volleyball: 270, handball: 450,
                hockey: 165, waterpolo: 420, rugby: 440, beach: 270 }
    }
  ]
},
{
  id: 'table-l1-11',
  level: 1,
  tags: ['география', 'реки'],
  objectColumnLabel: 'Река',
  rows: [
    { id: 'nile', label: 'Нил' },
    { id: 'amazon', label: 'Амазонка' },
    { id: 'yangtze', label: 'Янцзы' },
    { id: 'mississippi', label: 'Миссисипи' },
    { id: 'huanghe', label: 'Хуанхэ' },
    { id: 'ob', label: 'Обь' },
    { id: 'lena', label: 'Лена' },
    { id: 'volga', label: 'Волга' }
  ],
  columns: [
    {
      id: 'length', label: 'Длина', unit: 'км',
      align: 'center', kind: 'number',
      values: { nile: 6650, amazon: 6400, yangtze: 6300, mississippi: 3770,
                huanghe: 5464, ob: 3650, lena: 4400, volga: 3530 }
    },
    {
      id: 'basin', label: 'Площадь бассейна', unit: 'тыс. км²',
      align: 'center', kind: 'number',
      values: { nile: 3349, amazon: 7180, yangtze: 1808, mississippi: 3220,
                huanghe: 752, ob: 2990, lena: 2490, volga: 1360 }
    },
    {
      id: 'flow', label: 'Расход воды', unit: 'м³/с',
      align: 'center', kind: 'number',
      values: { nile: 2830, amazon: 209000, yangtze: 31900, mississippi: 16200,
                huanghe: 2110, ob: 12500, lena: 17100, volga: 8060 }
    },
    {
      id: 'continent', label: 'Материк',
      align: 'left', kind: 'text',
      values: { nile: 'Африка', amazon: 'Южная Америка', yangtze: 'Евразия',
                mississippi: 'Северная Америка', huanghe: 'Евразия',
                ob: 'Евразия', lena: 'Евразия', volga: 'Евразия' }
    },
    {
      id: 'mouth', label: 'Куда впадает',
      align: 'left', kind: 'text',
      values: { nile: 'Средиземное море', amazon: 'Атлантический океан',
                yangtze: 'Восточно-Китайское', mississippi: 'Мексиканский залив',
                huanghe: 'Жёлтое море', ob: 'Карское море',
                lena: 'Море Лаптевых', volga: 'Каспийское море' }
    }
  ]
},
{
  id: 'table-l1-12',
  level: 1,
  tags: ['биология', 'деревья'],
  objectColumnLabel: 'Дерево',
  rows: [
    { id: 'oak', label: 'Дуб черешчатый' },
    { id: 'birch', label: 'Берёза повислая' },
    { id: 'pine', label: 'Сосна обыкновенная' },
    { id: 'spruce', label: 'Ель европейская' },
    { id: 'linden', label: 'Липа мелколистная' },
    { id: 'larch', label: 'Лиственница сибирская' },
    { id: 'maple', label: 'Клён остролистный' },
    { id: 'sequoia', label: 'Секвойя вечнозелёная' }
  ],
  columns: [
    {
      id: 'height', label: 'Обычная высота', unit: 'м',
      align: 'center', kind: 'number',
      values: { oak: 40, birch: 30, pine: 40, spruce: 50,
                linden: 30, larch: 45, maple: 30, sequoia: 110 }
    },
    {
      id: 'trunk', label: 'Диаметр ствола', unit: 'м',
      align: 'center', kind: 'number',
      values: { oak: 1.5, birch: 0.8, pine: 1, spruce: 1.2,
                linden: 1, larch: 1, maple: 1, sequoia: 7 }
    },
    {
      id: 'lifespan', label: 'Срок жизни', unit: 'лет',
      align: 'center', kind: 'number',
      values: {
        oak: { min: 300, max: 500, step: 50 },
        birch: 120,
        pine: { min: 200, max: 400, step: 50 },
        spruce: 300,
        linden: 400,
        larch: { min: 400, max: 600, step: 50 },
        maple: 200,
        sequoia: 2000
      }
    },
    {
      id: 'kind', label: 'Тип',
      align: 'center', kind: 'text',
      values: { oak: 'Лиственное', birch: 'Лиственное', pine: 'Хвойное',
                spruce: 'Хвойное', linden: 'Лиственное', larch: 'Хвойное',
                maple: 'Лиственное', sequoia: 'Хвойное' }
    },
    {
      id: 'range', label: 'Где растёт',
      align: 'left', kind: 'text',
      values: { oak: 'Европа', birch: 'Евразия', pine: 'Евразия',
                spruce: 'Европа', linden: 'Европа', larch: 'Сибирь',
                maple: 'Европа', sequoia: 'Калифорния' }
    }
  ]
},
{
  id: 'table-l1-13',
  level: 1,
  tags: ['игры', 'техника'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Приставка',
  rows: [
    { id: 'nes', label: 'NES' },
    { id: 'megadrive', label: 'Sega Mega Drive' },
    { id: 'gameboy', label: 'Game Boy' },
    { id: 'ps2', label: 'PlayStation 2' },
    { id: 'wii', label: 'Nintendo Wii' },
    { id: 'x360', label: 'Xbox 360' },
    { id: 'ps4', label: 'PlayStation 4' },
    { id: 'switch', label: 'Nintendo Switch' }
  ],
  columns: [
    {
      id: 'year', label: 'Год выхода',
      align: 'center', kind: 'number',
      values: { nes: 1983, megadrive: 1988, gameboy: 1989, ps2: 2000,
                wii: 2006, x360: 2005, ps4: 2013, switch: 2017 }
    },
    {
      id: 'sold', label: 'Продано', unit: 'млн шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: { nes: 62, megadrive: 31, gameboy: 119, ps2: 160,
                wii: 102, x360: 84, ps4: 117, switch: 152 }
    },
    {
      id: 'maker', label: 'Производитель',
      align: 'left', kind: 'text',
      values: { nes: 'Nintendo', megadrive: 'Sega', gameboy: 'Nintendo',
                ps2: 'Sony', wii: 'Nintendo', x360: 'Microsoft',
                ps4: 'Sony', switch: 'Nintendo' }
    },
    {
      id: 'media', label: 'Носитель игр',
      align: 'center', kind: 'text',
      values: { nes: 'Картридж', megadrive: 'Картридж', gameboy: 'Картридж',
                ps2: 'Диск', wii: 'Диск', x360: 'Диск',
                ps4: 'Диск', switch: 'Карта' }
    },
    {
      id: 'type', label: 'Тип',
      align: 'center', kind: 'text',
      values: { nes: 'Домашняя', megadrive: 'Домашняя', gameboy: 'Портативная',
                ps2: 'Домашняя', wii: 'Домашняя', x360: 'Домашняя',
                ps4: 'Домашняя', switch: 'Гибридная' }
    }
  ]
},
{
  id: 'table-l1-14',
  level: 1,
  tags: ['химия', 'металлы'],
  objectColumnLabel: 'Металл',
  rows: [
    { id: 'iron', label: 'Железо' },
    { id: 'aluminium', label: 'Алюминий' },
    { id: 'copper', label: 'Медь' },
    { id: 'gold', label: 'Золото' },
    { id: 'silver', label: 'Серебро' },
    { id: 'lead', label: 'Свинец' },
    { id: 'tin', label: 'Олово' },
    { id: 'titanium', label: 'Титан' }
  ],
  columns: [
    {
      id: 'symbol', label: 'Обозначение',
      align: 'center', kind: 'text',
      values: { iron: 'Fe', aluminium: 'Al', copper: 'Cu', gold: 'Au',
                silver: 'Ag', lead: 'Pb', tin: 'Sn', titanium: 'Ti' }
    },
    {
      id: 'number', label: 'Номер в таблице',
      align: 'center', kind: 'number',
      values: { iron: 26, aluminium: 13, copper: 29, gold: 79,
                silver: 47, lead: 82, tin: 50, titanium: 22 }
    },
    {
      id: 'density', label: 'Плотность', unit: 'г/см³',
      align: 'center', kind: 'number',
      values: { iron: 7.9, aluminium: 2.7, copper: 9, gold: 19.3,
                silver: 10.5, lead: 11.3, tin: 7.3, titanium: 4.5 }
    },
    {
      id: 'melting', label: 'Температура плавления', unit: '°C',
      align: 'center', kind: 'number',
      values: { iron: 1538, aluminium: 660, copper: 1085, gold: 1064,
                silver: 962, lead: 327, tin: 232, titanium: 1668 }
    },
    {
      id: 'boiling', label: 'Температура кипения', unit: '°C',
      align: 'center', kind: 'number',
      values: { iron: 2861, aluminium: 2519, copper: 2562, gold: 2856,
                silver: 2162, lead: 1749, tin: 2602, titanium: 3287 }
    }
  ]
},
{
  id: 'table-l1-15',
  level: 1,
  tags: ['география', 'климат'],
  objectColumnLabel: 'Город',
  rows: [
    { id: 'moscow', label: 'Москва' },
    { id: 'spb', label: 'Санкт-Петербург' },
    { id: 'sochi', label: 'Сочи' },
    { id: 'yakutsk', label: 'Якутск' },
    { id: 'vladivostok', label: 'Владивосток' },
    { id: 'ekb', label: 'Екатеринбург' },
    { id: 'murmansk', label: 'Мурманск' },
    { id: 'volgograd', label: 'Волгоград' }
  ],
  columns: [
    {
      id: 'january', label: 'Средняя в январе', unit: '°C',
      align: 'center', kind: 'number',
      values: { moscow: -6.2, spb: -5.5, sochi: 6.3, yakutsk: -38.6,
                vladivostok: -11.6, ekb: -12.6, murmansk: -9.8, volgograd: -6.5 }
    },
    {
      id: 'july', label: 'Средняя в июле', unit: '°C',
      align: 'center', kind: 'number',
      values: { moscow: 19.7, spb: 19, sochi: 23.7, yakutsk: 19.5,
                vladivostok: 19.9, ekb: 19, murmansk: 13.8, volgograd: 24.2 }
    },
    {
      id: 'rain', label: 'Осадки за год', unit: 'мм',
      align: 'center', kind: 'number',
      values: {
        moscow: { min: 620, max: 780, step: 40 },
        spb: 660,
        sochi: 1700,
        yakutsk: 237,
        vladivostok: 840,
        ekb: { min: 480, max: 600, step: 30 },
        murmansk: 500,
        volgograd: 420
      }
    },
    {
      id: 'population', label: 'Население', unit: 'тыс. чел.',
      align: 'center', kind: 'number',
      values: { moscow: 13100, spb: 5600, sochi: 460, yakutsk: 360,
                vladivostok: 600, ekb: 1540, murmansk: 270, volgograd: 1000 }
    },
    {
      id: 'zone', label: 'Часовой пояс',
      align: 'center', kind: 'text',
      values: { moscow: 'UTC+3', spb: 'UTC+3', sochi: 'UTC+3', yakutsk: 'UTC+9',
                vladivostok: 'UTC+10', ekb: 'UTC+5', murmansk: 'UTC+3',
                volgograd: 'UTC+3' }
    }
  ]
},
{
  id: 'table-l1-16',
  level: 1,
  tags: ['магазин', 'школа'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Товар',
  rows: [
    { id: 'notebook12', label: 'Тетрадь 12 листов' },
    { id: 'notebook48', label: 'Тетрадь 48 листов' },
    { id: 'pen', label: 'Ручка шариковая' },
    { id: 'pencil', label: 'Карандаш простой' },
    { id: 'ruler', label: 'Линейка 20 см' },
    { id: 'eraser', label: 'Ластик' },
    { id: 'folder', label: 'Папка для тетрадей' },
    { id: 'markers', label: 'Фломастеры' }
  ],
  columns: [
    {
      id: 'price', label: 'Цена', unit: 'руб.',
      align: 'center', kind: 'number',
      values: { notebook12: 18, notebook48: 55, pen: 35, pencil: 20,
                ruler: 40, eraser: 25, folder: 120, markers: 210 }
    },
    {
      id: 'sold', label: 'Продано за неделю', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        notebook12: { min: 200, max: 360, step: 40 },
        notebook48: 140,
        pen: { min: 90, max: 170, step: 20 },
        pencil: 110,
        ruler: 45,
        eraser: { min: 60, max: 120, step: 15 },
        folder: 30,
        markers: 25
      }
    },
    {
      id: 'stock', label: 'Остаток на складе', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        notebook12: 640,
        notebook48: 380,
        pen: 420,
        pencil: { min: 200, max: 400, step: 50 },
        ruler: 150,
        eraser: 260,
        folder: 90,
        markers: 70
      }
    },
    {
      id: 'pack', label: 'В упаковке', unit: 'шт.',
      align: 'center', kind: 'number',
      values: { notebook12: 20, notebook48: 10, pen: 50, pencil: 12,
                ruler: 25, eraser: 30, folder: 5, markers: 1 }
    },
    {
      id: 'shelf', label: 'Витрина',
      align: 'center', kind: 'text',
      values: { notebook12: 'А', notebook48: 'А', pen: 'Б', pencil: 'Б',
                ruler: 'В', eraser: 'Б', folder: 'Г', markers: 'В' }
    }
  ]
},
{
  id: 'table-l1-17',
  level: 1,
  tags: ['техника', 'мосты'],
  objectColumnLabel: 'Мост',
  rows: [
    { id: 'akashi', label: 'Акаси-Кайкё' },
    { id: 'golden', label: 'Золотые Ворота' },
    { id: 'belt', label: 'Большой Бельт' },
    { id: 'russky', label: 'Русский мост' },
    { id: 'millau', label: 'Виадук Мийо' },
    { id: 'brooklyn', label: 'Бруклинский мост' },
    { id: 'zhivopisny', label: 'Живописный мост' },
    { id: 'crimea', label: 'Крымский мост' }
  ],
  columns: [
    {
      id: 'span', label: 'Главный пролёт', unit: 'м',
      align: 'center', kind: 'number',
      values: { akashi: 1991, golden: 1280, belt: 1624, russky: 1104,
                millau: 342, brooklyn: 486, zhivopisny: 409, crimea: 227 }
    },
    {
      id: 'length', label: 'Общая длина', unit: 'м',
      align: 'center', kind: 'number',
      values: { akashi: 3911, golden: 2737, belt: 6790, russky: 1886,
                millau: 2460, brooklyn: 1825, zhivopisny: 1460, crimea: 19000 }
    },
    {
      id: 'year', label: 'Год открытия',
      align: 'center', kind: 'number',
      values: { akashi: 1998, golden: 1937, belt: 1998, russky: 2012,
                millau: 2004, brooklyn: 1883, zhivopisny: 2007, crimea: 2018 }
    },
    {
      id: 'type', label: 'Тип',
      align: 'center', kind: 'text',
      values: { akashi: 'Висячий', golden: 'Висячий', belt: 'Висячий',
                russky: 'Вантовый', millau: 'Вантовый', brooklyn: 'Висячий',
                zhivopisny: 'Вантовый', crimea: 'Балочный' }
    },
    {
      id: 'country', label: 'Страна',
      align: 'left', kind: 'text',
      values: { akashi: 'Япония', golden: 'США', belt: 'Дания',
                russky: 'Россия', millau: 'Франция', brooklyn: 'США',
                zhivopisny: 'Россия', crimea: 'Россия' }
    }
  ]
},
{
  id: 'table-l1-18',
  level: 1,
  tags: ['еда', 'биология'],
  objectColumnLabel: 'Продукт',
  rows: [
    { id: 'currant', label: 'Чёрная смородина' },
    { id: 'kiwi', label: 'Киви' },
    { id: 'orange', label: 'Апельсин' },
    { id: 'strawberry', label: 'Клубника' },
    { id: 'lemon', label: 'Лимон' },
    { id: 'raspberry', label: 'Малина' },
    { id: 'apple', label: 'Яблоко' },
    { id: 'banana', label: 'Банан' }
  ],
  columns: [
    {
      id: 'vitc', label: 'Витамин C', unit: 'мг на 100 г',
      align: 'center', kind: 'number',
      values: { currant: 200, kiwi: 92, orange: 60, strawberry: 60,
                lemon: 40, raspberry: 25, apple: 10, banana: 9 }
    },
    {
      id: 'calories', label: 'Калорийность', unit: 'ккал',
      align: 'center', kind: 'number',
      values: { currant: 44, kiwi: 61, orange: 47, strawberry: 33,
                lemon: 29, raspberry: 52, apple: 52, banana: 89 }
    },
    {
      id: 'water', label: 'Доля воды', unit: '%',
      align: 'center', kind: 'number',
      values: { currant: 83, kiwi: 83, orange: 87, strawberry: 91,
                lemon: 89, raspberry: 86, apple: 86, banana: 75 }
    },
    {
      id: 'season', label: 'Сезон в России',
      align: 'center', kind: 'text',
      values: { currant: 'Июль', kiwi: 'Круглый год', orange: 'Зима',
                strawberry: 'Июнь', lemon: 'Круглый год', raspberry: 'Июль',
                apple: 'Август', banana: 'Круглый год' }
    },
    {
      id: 'kind', label: 'Группа',
      align: 'center', kind: 'text',
      values: { currant: 'Ягода', kiwi: 'Фрукт', orange: 'Цитрус',
                strawberry: 'Ягода', lemon: 'Цитрус', raspberry: 'Ягода',
                apple: 'Фрукт', banana: 'Фрукт' }
    }
  ]
},
{
  id: 'table-l1-19',
  level: 1,
  tags: ['транспорт', 'города'],
  objectColumnLabel: 'Метрополитен',
  rows: [
    { id: 'london', label: 'Лондон' },
    { id: 'newyork', label: 'Нью-Йорк' },
    { id: 'paris', label: 'Париж' },
    { id: 'tokyo', label: 'Токио' },
    { id: 'moscow', label: 'Москва' },
    { id: 'spb', label: 'Санкт-Петербург' },
    { id: 'beijing', label: 'Пекин' },
    { id: 'kazan', label: 'Казань' }
  ],
  columns: [
    {
      id: 'opened', label: 'Год открытия',
      align: 'center', kind: 'number',
      values: { london: 1863, newyork: 1904, paris: 1900, tokyo: 1927,
                moscow: 1935, spb: 1955, beijing: 1969, kazan: 2005 }
    },
    {
      id: 'lines', label: 'Число линий',
      align: 'center', kind: 'number',
      values: { london: 11, newyork: 28, paris: 16, tokyo: 9,
                moscow: 14, spb: 5, beijing: 27, kazan: 1 }
    },
    {
      id: 'stations', label: 'Число станций',
      align: 'center', kind: 'number',
      values: { london: 272, newyork: 472, paris: 308, tokyo: 180,
                moscow: 263, spb: 72, beijing: 523, kazan: 11 }
    },
    {
      id: 'length', label: 'Длина линий', unit: 'км',
      align: 'center', kind: 'number',
      values: { london: 402, newyork: 380, paris: 226, tokyo: 195,
                moscow: 466, spb: 125, beijing: 836, kazan: 17 }
    },
    {
      id: 'passengers', label: 'Поездок за год', unit: 'млн',
      align: 'center', kind: 'number',
      values: {
        london: { min: 1000, max: 1400, step: 100 },
        newyork: 1150,
        paris: 1500,
        tokyo: 2500,
        moscow: { min: 2200, max: 2600, step: 100 },
        spb: 650,
        beijing: { min: 2800, max: 3600, step: 200 },
        kazan: 30
      }
    }
  ]
},
{
  id: 'table-l1-20',
  level: 1,
  tags: ['игры', 'досуг'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Игра',
  rows: [
    { id: 'chess', label: 'Шахматы' },
    { id: 'checkers', label: 'Шашки' },
    { id: 'go', label: 'Го' },
    { id: 'backgammon', label: 'Нарды' },
    { id: 'monopoly', label: 'Монополия' },
    { id: 'jenga', label: 'Дженга' },
    { id: 'uno', label: 'Уно' },
    { id: 'scrabble', label: 'Скрэббл' }
  ],
  columns: [
    {
      id: 'players', label: 'Игроков',
      align: 'center', kind: 'text',
      values: { chess: '2', checkers: '2', go: '2', backgammon: '2',
                monopoly: '2–8', jenga: '1–8', uno: '2–10', scrabble: '2–4' }
    },
    {
      id: 'time', label: 'Партия', unit: 'мин',
      align: 'center', kind: 'number',
      values: { chess: 60, checkers: 30, go: 90, backgammon: 30,
                monopoly: 120, jenga: 15, uno: 20, scrabble: 60 }
    },
    {
      id: 'pieces', label: 'Элементов в наборе',
      align: 'center', kind: 'number',
      values: { chess: 32, checkers: 24, go: 361, backgammon: 30,
                monopoly: 140, jenga: 54, uno: 108, scrabble: 100 }
    },
    {
      id: 'rented', label: 'Выдано за неделю', unit: 'раз',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        chess: { min: 20, max: 44, step: 6 },
        checkers: 18,
        go: 6,
        backgammon: 12,
        monopoly: { min: 15, max: 35, step: 5 },
        jenga: 26,
        uno: { min: 30, max: 54, step: 6 },
        scrabble: 9
      }
    },
    {
      id: 'age', label: 'С какого возраста',
      align: 'center', kind: 'text',
      values: { chess: '6+', checkers: '5+', go: '8+', backgammon: '7+',
                monopoly: '8+', jenga: '6+', uno: '6+', scrabble: '10+' }
    }
  ]
},
{
  id: 'table-l1-21',
  level: 1,
  tags: ['кино', 'досуг'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Фильм',
  rows: [
    { id: 'penguins', label: '«Пингвины у моря»' },
    { id: 'road', label: '«Дорога домой»' },
    { id: 'star', label: '«Звёздный причал»' },
    { id: 'forest', label: '«Тайна старого леса»' },
    { id: 'city', label: '«Город без карты»' },
    { id: 'race', label: '«Последний заезд»' },
    { id: 'letter', label: '«Письмо из зимы»' },
    { id: 'robot', label: '«Робот и я»' }
  ],
  columns: [
    {
      id: 'duration', label: 'Продолжительность', unit: 'мин',
      align: 'center', kind: 'number',
      values: { penguins: 88, road: 104, star: 137, forest: 96,
                city: 112, race: 125, letter: 99, robot: 91 }
    },
    {
      id: 'rating', label: 'Возраст',
      align: 'center', kind: 'text',
      values: { penguins: '0+', road: '6+', star: '12+', forest: '6+',
                city: '16+', race: '12+', letter: '12+', robot: '0+' }
    },
    {
      id: 'price', label: 'Цена билета', unit: 'руб.',
      align: 'center', kind: 'number',
      values: { penguins: 250, road: 300, star: 450, forest: 280,
                city: 350, race: 400, letter: 300, robot: 250 }
    },
    {
      id: 'tickets', label: 'Продано билетов', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        penguins: { min: 60, max: 140, step: 20 },
        road: 95,
        star: { min: 120, max: 220, step: 25 },
        forest: 80,
        city: { min: 40, max: 100, step: 15 },
        race: 130,
        letter: 55,
        robot: { min: 70, max: 150, step: 20 }
      }
    },
    {
      id: 'hall', label: 'Зал',
      align: 'center', kind: 'text',
      values: { penguins: 'Малый', road: 'Второй', star: 'Большой',
                forest: 'Малый', city: 'Второй', race: 'Большой',
                letter: 'Второй', robot: 'Малый' }
    }
  ]
},
{
  id: 'table-l1-22',
  level: 1,
  tags: ['зоопарк', 'животные'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Обитатель',
  rows: [
    { id: 'elephant', label: 'Слон индийский' },
    { id: 'giraffe', label: 'Жираф' },
    { id: 'tiger', label: 'Амурский тигр' },
    { id: 'bear', label: 'Бурый медведь' },
    { id: 'zebra', label: 'Зебра' },
    { id: 'penguin', label: 'Пингвин Гумбольдта' },
    { id: 'camel', label: 'Верблюд двугорбый' },
    { id: 'lemur', label: 'Кошачий лемур' }
  ],
  columns: [
    {
      id: 'weight', label: 'Масса', unit: 'кг',
      align: 'center', kind: 'number',
      values: { elephant: 4000, giraffe: 900, tiger: 200, bear: 300,
                zebra: 350, penguin: 4, camel: 600, lemur: 3 }
    },
    {
      id: 'food', label: 'Корма в сутки', unit: 'кг',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        elephant: { min: 150, max: 250, step: 25 },
        giraffe: { min: 30, max: 55, step: 5 },
        tiger: 9,
        bear: { min: 12, max: 24, step: 3 },
        zebra: 15,
        penguin: 1,
        camel: 20,
        lemur: 1
      }
    },
    {
      id: 'lifespan', label: 'Срок жизни', unit: 'лет',
      align: 'center', kind: 'number',
      values: { elephant: 60, giraffe: 25, tiger: 18, bear: 30,
                zebra: 25, penguin: 20, camel: 40, lemur: 18 }
    },
    {
      id: 'area', label: 'Площадь вольера', unit: 'м²',
      align: 'center', kind: 'number', total: 'sum',
      values: { elephant: 1200, giraffe: 800, tiger: 600, bear: 500,
                zebra: 700, penguin: 200, camel: 650, lemur: 150 }
    },
    {
      id: 'origin', label: 'Родина',
      align: 'left', kind: 'text',
      values: { elephant: 'Южная Азия', giraffe: 'Африка', tiger: 'Дальний Восток',
                bear: 'Евразия', zebra: 'Африка', penguin: 'Южная Америка',
                camel: 'Центральная Азия', lemur: 'Мадагаскар' }
    }
  ]
},
{
  id: 'table-l1-23',
  level: 1,
  tags: ['туризм', 'спорт'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Маршрут',
  rows: [
    { id: 'lake', label: 'К Синему озеру' },
    { id: 'ridge', label: 'Хребет Каменный' },
    { id: 'falls', label: 'Три водопада' },
    { id: 'cave', label: 'Пещерный круг' },
    { id: 'meadow', label: 'Луговая тропа' },
    { id: 'pass', label: 'Северный перевал' },
    { id: 'river', label: 'Вдоль реки' },
    { id: 'pine', label: 'Сосновый бор' }
  ],
  columns: [
    {
      id: 'length', label: 'Длина', unit: 'км',
      align: 'center', kind: 'number', total: 'sum',
      values: { lake: 18, ridge: 42, falls: 27, cave: 12,
                meadow: 9, pass: 55, river: 31, pine: 15 }
    },
    {
      id: 'days', label: 'Дней в пути',
      align: 'center', kind: 'number',
      values: { lake: 2, ridge: 4, falls: 3, cave: 1,
                meadow: 1, pass: 5, river: 3, pine: 2 }
    },
    {
      id: 'top', label: 'Высшая точка', unit: 'м',
      align: 'center', kind: 'number',
      values: { lake: 620, ridge: 1450, falls: 890, cave: 410,
                meadow: 300, pass: 1780, river: 350, pine: 480 }
    },
    {
      id: 'level', label: 'Сложность',
      align: 'center', kind: 'text',
      values: { lake: 'Лёгкая', ridge: 'Высокая', falls: 'Средняя',
                cave: 'Лёгкая', meadow: 'Лёгкая', pass: 'Высокая',
                river: 'Средняя', pine: 'Лёгкая' }
    },
    {
      id: 'group', label: 'Записалось', unit: 'чел.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        lake: { min: 12, max: 24, step: 3 },
        ridge: 8,
        falls: { min: 10, max: 22, step: 3 },
        cave: 20,
        meadow: { min: 16, max: 32, step: 4 },
        pass: 6,
        river: 14,
        pine: { min: 15, max: 27, step: 3 }
      }
    }
  ]
},
{
  id: 'table-l1-24',
  level: 1,
  tags: ['погода', 'наблюдения'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'День',
  rows: [
    { id: 'mon', label: 'Понедельник' },
    { id: 'tue', label: 'Вторник' },
    { id: 'wed', label: 'Среда' },
    { id: 'thu', label: 'Четверг' },
    { id: 'fri', label: 'Пятница' },
    { id: 'sat', label: 'Суббота' },
    { id: 'sun', label: 'Воскресенье' },
    { id: 'mon2', label: 'Понедельник (2-я нед.)' }
  ],
  columns: [
    {
      id: 'day', label: 'Днём', unit: '°C',
      align: 'center', kind: 'number',
      values: { mon: 14, tue: 17, wed: 19, thu: 21,
                fri: 16, sat: 12, sun: 15, mon2: 18 }
    },
    {
      id: 'night', label: 'Ночью', unit: '°C',
      align: 'center', kind: 'number',
      values: { mon: 6, tue: 8, wed: 11, thu: 12,
                fri: 9, sat: 4, sun: 5, mon2: 10 }
    },
    {
      id: 'rain', label: 'Осадки', unit: 'мм',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        mon: { min: 0, max: 8, step: 2 },
        tue: 0,
        wed: { min: 2, max: 14, step: 3 },
        thu: 0,
        fri: { min: 5, max: 25, step: 5 },
        sat: 12,
        sun: { min: 0, max: 10, step: 2 },
        mon2: 3
      }
    },
    {
      id: 'wind', label: 'Ветер', unit: 'м/с',
      align: 'center', kind: 'number',
      values: { mon: 3, tue: 2, wed: 5, thu: 4,
                fri: 7, sat: 9, sun: 6, mon2: 3 }
    },
    {
      id: 'sky', label: 'Облачность',
      align: 'center', kind: 'text',
      values: { mon: 'Переменная', tue: 'Ясно', wed: 'Пасмурно',
                thu: 'Ясно', fri: 'Пасмурно', sat: 'Пасмурно',
                sun: 'Переменная', mon2: 'Ясно' }
    }
  ]
},
{
  id: 'table-l1-25',
  level: 1,
  tags: ['биология', 'огород'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Культура',
  rows: [
    { id: 'radish', label: 'Редис' },
    { id: 'cucumber', label: 'Огурец' },
    { id: 'tomato', label: 'Томат' },
    { id: 'carrot', label: 'Морковь' },
    { id: 'beet', label: 'Свёкла' },
    { id: 'pumpkin', label: 'Тыква' },
    { id: 'pepper', label: 'Перец сладкий' },
    { id: 'dill', label: 'Укроп' }
  ],
  columns: [
    {
      id: 'ripening', label: 'Срок созревания', unit: 'дней',
      align: 'center', kind: 'number',
      values: { radish: 25, cucumber: 50, tomato: 100, carrot: 90,
                beet: 100, pumpkin: 120, pepper: 110, dill: 40 }
    },
    {
      id: 'depth', label: 'Глубина посева', unit: 'см',
      align: 'center', kind: 'number',
      values: { radish: 2, cucumber: 3, tomato: 1, carrot: 2,
                beet: 3, pumpkin: 5, pepper: 1, dill: 1.5 }
    },
    {
      id: 'height', label: 'Высота растения', unit: 'см',
      align: 'center', kind: 'number',
      values: { radish: 20, cucumber: 200, tomato: 150, carrot: 40,
                beet: 45, pumpkin: 300, pepper: 70, dill: 90 }
    },
    {
      id: 'harvest', label: 'Урожай с грядки', unit: 'кг',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        radish: { min: 4, max: 12, step: 2 },
        cucumber: { min: 20, max: 45, step: 5 },
        tomato: 30,
        carrot: { min: 15, max: 35, step: 5 },
        beet: 22,
        pumpkin: { min: 25, max: 55, step: 6 },
        pepper: 12,
        dill: 3
      }
    },
    {
      id: 'water', label: 'Полив', unit: 'раз в неделю',
      align: 'center', kind: 'number',
      values: { radish: 3, cucumber: 4, tomato: 2, carrot: 2,
                beet: 2, pumpkin: 1, pepper: 3, dill: 3 }
    }
  ]
},
{
  id: 'table-l1-26',
  level: 1,
  tags: ['транспорт', 'прокат'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Модель',
  rows: [
    { id: 'city', label: 'Городской' },
    { id: 'mountain', label: 'Горный' },
    { id: 'road', label: 'Шоссейный' },
    { id: 'folding', label: 'Складной' },
    { id: 'kids', label: 'Детский' },
    { id: 'tandem', label: 'Тандем' },
    { id: 'electric', label: 'Электровелосипед' },
    { id: 'scooter', label: 'Самокат' }
  ],
  columns: [
    {
      id: 'price', label: 'Цена часа', unit: 'руб.',
      align: 'center', kind: 'number',
      values: { city: 200, mountain: 300, road: 350, folding: 250,
                kids: 150, tandem: 450, electric: 500, scooter: 180 }
    },
    {
      id: 'weight', label: 'Масса', unit: 'кг',
      align: 'center', kind: 'number',
      values: { city: 14, mountain: 13, road: 9, folding: 12,
                kids: 8, tandem: 22, electric: 24, scooter: 7 }
    },
    {
      id: 'gears', label: 'Число передач',
      align: 'center', kind: 'number',
      values: { city: 7, mountain: 21, road: 18, folding: 6,
                kids: 1, tandem: 14, electric: 8, scooter: 1 }
    },
    {
      id: 'rented', label: 'Выдано за день', unit: 'раз',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        city: { min: 20, max: 44, step: 6 },
        mountain: { min: 10, max: 26, step: 4 },
        road: 8,
        folding: 12,
        kids: { min: 14, max: 30, step: 4 },
        tandem: 4,
        electric: { min: 16, max: 32, step: 4 },
        scooter: 25
      }
    },
    {
      id: 'available', label: 'Есть в парке', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: { city: 30, mountain: 18, road: 6, folding: 10,
                kids: 20, tandem: 3, electric: 12, scooter: 24 }
    }
  ]
},
{
  id: 'table-l1-27',
  level: 1,
  tags: ['транспорт', 'авиация'],
  objectColumnLabel: 'Аэропорт',
  rows: [
    { id: 'svo', label: 'Шереметьево' },
    { id: 'dme', label: 'Домодедово' },
    { id: 'led', label: 'Пулково' },
    { id: 'svx', label: 'Кольцово' },
    { id: 'ovb', label: 'Толмачёво' },
    { id: 'aer', label: 'Сочи' },
    { id: 'kzn', label: 'Казань' },
    { id: 'vvo', label: 'Владивосток' }
  ],
  columns: [
    {
      id: 'code', label: 'Код',
      align: 'center', kind: 'text',
      values: { svo: 'SVO', dme: 'DME', led: 'LED', svx: 'SVX',
                ovb: 'OVB', aer: 'AER', kzn: 'KZN', vvo: 'VVO' }
    },
    {
      id: 'city', label: 'Город',
      align: 'left', kind: 'text',
      values: { svo: 'Москва', dme: 'Москва', led: 'Санкт-Петербург',
                svx: 'Екатеринбург', ovb: 'Новосибирск', aer: 'Сочи',
                kzn: 'Казань', vvo: 'Владивосток' }
    },
    {
      id: 'runways', label: 'Взлётных полос',
      align: 'center', kind: 'number',
      values: { svo: 3, dme: 2, led: 2, svx: 2,
                ovb: 2, aer: 1, kzn: 2, vvo: 2 }
    },
    {
      id: 'passengers', label: 'Пассажиров за год', unit: 'млн',
      align: 'center', kind: 'number',
      values: {
        svo: { min: 30, max: 50, step: 5 },
        dme: { min: 15, max: 30, step: 3 },
        led: { min: 16, max: 24, step: 2 },
        svx: 6,
        ovb: { min: 6, max: 10, step: 1 },
        aer: 12,
        kzn: 4,
        vvo: 3
      }
    },
    {
      id: 'zone', label: 'Часовой пояс',
      align: 'center', kind: 'text',
      values: { svo: 'UTC+3', dme: 'UTC+3', led: 'UTC+3', svx: 'UTC+5',
                ovb: 'UTC+7', aer: 'UTC+3', kzn: 'UTC+3', vvo: 'UTC+10' }
    }
  ]
},
{
  id: 'table-l1-28',
  level: 1,
  tags: ['еда', 'кафе'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Мороженое',
  rows: [
    { id: 'vanilla', label: 'Ванильное' },
    { id: 'chocolate', label: 'Шоколадное' },
    { id: 'strawberry', label: 'Клубничное' },
    { id: 'pistachio', label: 'Фисташковое' },
    { id: 'lemon', label: 'Лимонный сорбет' },
    { id: 'caramel', label: 'Солёная карамель' },
    { id: 'mint', label: 'Мятное' },
    { id: 'berry', label: 'Лесная ягода' }
  ],
  columns: [
    {
      id: 'price', label: 'Цена шарика', unit: 'руб.',
      align: 'center', kind: 'number',
      values: { vanilla: 90, chocolate: 100, strawberry: 100, pistachio: 150,
                lemon: 80, caramel: 120, mint: 95, berry: 110 }
    },
    {
      id: 'calories', label: 'Калорийность', unit: 'ккал на 100 г',
      align: 'center', kind: 'number',
      values: { vanilla: 200, chocolate: 230, strawberry: 190, pistachio: 250,
                lemon: 120, caramel: 240, mint: 210, berry: 180 }
    },
    {
      id: 'milk', label: 'Доля молока', unit: '%',
      align: 'center', kind: 'number',
      values: { vanilla: 60, chocolate: 55, strawberry: 50, pistachio: 55,
                lemon: 0, caramel: 58, mint: 52, berry: 45 }
    },
    {
      id: 'sold', label: 'Продано шариков', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        vanilla: { min: 80, max: 160, step: 20 },
        chocolate: { min: 100, max: 180, step: 20 },
        strawberry: 95,
        pistachio: { min: 20, max: 60, step: 10 },
        lemon: 40,
        caramel: { min: 60, max: 120, step: 15 },
        mint: 35,
        berry: 70
      }
    },
    {
      id: 'topping', label: 'Топпинг',
      align: 'center', kind: 'text',
      values: { vanilla: 'Карамель', chocolate: 'Орехи', strawberry: 'Джем',
                pistachio: 'Орехи', lemon: 'Мята', caramel: 'Карамель',
                mint: 'Шоколад', berry: 'Джем' }
    }
  ]
},
{
  id: 'table-l1-29',
  level: 1,
  tags: ['космос', 'техника'],
  objectColumnLabel: 'Ракета',
  rows: [
    { id: 'soyuz', label: 'Союз-2.1а' },
    { id: 'proton', label: 'Протон-М' },
    { id: 'angara', label: 'Ангара-А5' },
    { id: 'falcon', label: 'Falcon 9' },
    { id: 'ariane', label: 'Ariane 5' },
    { id: 'atlas', label: 'Atlas V' },
    { id: 'saturn', label: 'Сатурн-5' },
    { id: 'electron', label: 'Electron' }
  ],
  columns: [
    {
      id: 'height', label: 'Высота', unit: 'м',
      align: 'center', kind: 'number',
      values: { soyuz: 46.3, proton: 58.2, angara: 55.4, falcon: 70,
                ariane: 53, atlas: 58, saturn: 110.6, electron: 18 }
    },
    {
      id: 'mass', label: 'Стартовая масса', unit: 'т',
      align: 'center', kind: 'number',
      values: { soyuz: 312, proton: 705, angara: 773, falcon: 549,
                ariane: 777, atlas: 590, saturn: 2965, electron: 13 }
    },
    {
      id: 'payload', label: 'Груз на орбиту', unit: 'т',
      align: 'center', kind: 'number',
      values: { soyuz: 7, proton: 23, angara: 24.5, falcon: 22.8,
                ariane: 20, atlas: 18.8, saturn: 140, electron: 0.3 }
    },
    {
      id: 'first', label: 'Первый пуск',
      align: 'center', kind: 'number',
      values: { soyuz: 2004, proton: 2001, angara: 2014, falcon: 2010,
                ariane: 1996, atlas: 2002, saturn: 1967, electron: 2017 }
    },
    {
      id: 'country', label: 'Разработчик',
      align: 'left', kind: 'text',
      values: { soyuz: 'Россия', proton: 'Россия', angara: 'Россия',
                falcon: 'США', ariane: 'Европа', atlas: 'США',
                saturn: 'США', electron: 'США' }
    }
  ]
},
{
  id: 'table-l1-30',
  level: 1,
  tags: ['школа', 'олимпиада'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Предмет',
  rows: [
    { id: 'math', label: 'Математика' },
    { id: 'russian', label: 'Русский язык' },
    { id: 'physics', label: 'Физика' },
    { id: 'chemistry', label: 'Химия' },
    { id: 'biology', label: 'Биология' },
    { id: 'history', label: 'История' },
    { id: 'informatics', label: 'Информатика' },
    { id: 'geography', label: 'География' }
  ],
  columns: [
    {
      id: 'participants', label: 'Участников', unit: 'чел.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        math: { min: 60, max: 120, step: 15 },
        russian: { min: 70, max: 130, step: 15 },
        physics: 45,
        chemistry: { min: 20, max: 44, step: 6 },
        biology: 52,
        history: { min: 30, max: 60, step: 6 },
        informatics: 38,
        geography: 41
      }
    },
    {
      id: 'winners', label: 'Прошли на район', unit: 'чел.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        math: 14,
        russian: { min: 8, max: 20, step: 3 },
        physics: 9,
        chemistry: 5,
        biology: { min: 6, max: 18, step: 3 },
        history: 7,
        informatics: { min: 4, max: 12, step: 2 },
        geography: 6
      }
    },
    {
      id: 'tasks', label: 'Заданий в туре',
      align: 'center', kind: 'number',
      values: { math: 8, russian: 12, physics: 6, chemistry: 7,
                biology: 20, history: 15, informatics: 5, geography: 18 }
    },
    {
      id: 'time', label: 'Длительность тура', unit: 'мин',
      align: 'center', kind: 'number',
      values: { math: 180, russian: 120, physics: 180, chemistry: 150,
                biology: 120, history: 120, informatics: 240, geography: 135 }
    },
    {
      id: 'grades', label: 'Классы',
      align: 'center', kind: 'text',
      values: { math: '5–11', russian: '5–11', physics: '7–11', chemistry: '8–11',
                biology: '6–11', history: '6–11', informatics: '7–11',
                geography: '6–11' }
    }
  ]
},
{
  id: 'table-l1-31',
  level: 1,
  tags: ['музей', 'досуг'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Зал',
  rows: [
    { id: 'ancient', label: 'Древний мир' },
    { id: 'nature', label: 'Природа края' },
    { id: 'space', label: 'Космонавтика' },
    { id: 'art', label: 'Живопись XIX века' },
    { id: 'tech', label: 'Старая техника' },
    { id: 'coins', label: 'Монеты и медали' },
    { id: 'costume', label: 'Народный костюм' },
    { id: 'war', label: 'Военная история' }
  ],
  columns: [
    {
      id: 'items', label: 'Экспонатов', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        ancient: { min: 120, max: 220, step: 25 },
        nature: 340,
        space: { min: 60, max: 140, step: 20 },
        art: 95,
        tech: { min: 40, max: 100, step: 15 },
        coins: 1200,
        costume: 180,
        war: { min: 200, max: 360, step: 40 }
      }
    },
    {
      id: 'area', label: 'Площадь зала', unit: 'м²',
      align: 'center', kind: 'number', total: 'sum',
      values: { ancient: 180, nature: 240, space: 200, art: 160,
                tech: 300, coins: 90, costume: 120, war: 260 }
    },
    {
      id: 'visitors', label: 'Посетителей за день', unit: 'чел.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        ancient: 85,
        nature: { min: 100, max: 200, step: 25 },
        space: { min: 120, max: 240, step: 30 },
        art: 60,
        tech: 95,
        coins: { min: 20, max: 60, step: 10 },
        costume: 45,
        war: 110
      }
    },
    {
      id: 'floor', label: 'Этаж',
      align: 'center', kind: 'number',
      values: { ancient: 1, nature: 1, space: 2, art: 3,
                tech: 1, coins: 3, costume: 2, war: 2 }
    },
    {
      id: 'tour', label: 'Экскурсия', unit: 'мин',
      align: 'center', kind: 'number',
      values: { ancient: 40, nature: 30, space: 45, art: 50,
                tech: 35, coins: 25, costume: 30, war: 45 }
    }
  ]
},
{
  id: 'table-l1-32',
  level: 1,
  tags: ['техника', 'быт'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Прибор',
  rows: [
    { id: 'kettle', label: 'Электрочайник' },
    { id: 'fridge', label: 'Холодильник' },
    { id: 'washer', label: 'Стиральная машина' },
    { id: 'microwave', label: 'Микроволновая печь' },
    { id: 'tv', label: 'Телевизор' },
    { id: 'laptop', label: 'Ноутбук' },
    { id: 'lamp', label: 'Светодиодная лампа' },
    { id: 'iron', label: 'Утюг' }
  ],
  columns: [
    {
      id: 'power', label: 'Мощность', unit: 'Вт',
      align: 'center', kind: 'number', total: 'sum',
      values: { kettle: 2200, fridge: 150, washer: 2000, microwave: 800,
                tv: 100, laptop: 65, lamp: 9, iron: 1800 }
    },
    {
      id: 'hours', label: 'Работа в сутки', unit: 'ч',
      align: 'center', kind: 'number',
      values: { kettle: 0.3, fridge: 8, washer: 1, microwave: 0.2,
                tv: 4, laptop: 6, lamp: 5, iron: 0.5 }
    },
    {
      id: 'energy', label: 'Расход за месяц', unit: 'кВт·ч',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        kettle: { min: 12, max: 28, step: 4 },
        fridge: { min: 30, max: 50, step: 5 },
        washer: 20,
        microwave: 6,
        tv: { min: 8, max: 20, step: 3 },
        laptop: 12,
        lamp: 2,
        iron: { min: 15, max: 35, step: 5 }
      }
    },
    {
      id: 'life', label: 'Срок службы', unit: 'лет',
      align: 'center', kind: 'number',
      values: { kettle: 4, fridge: 15, washer: 10, microwave: 8,
                tv: 9, laptop: 6, lamp: 12, iron: 7 }
    },
    {
      id: 'room', label: 'Где стоит',
      align: 'left', kind: 'text',
      values: { kettle: 'Кухня', fridge: 'Кухня', washer: 'Ванная',
                microwave: 'Кухня', tv: 'Гостиная', laptop: 'Комната',
                lamp: 'Везде', iron: 'Комната' }
    }
  ]
},
{
  id: 'table-l1-33',
  level: 1,
  tags: ['история', 'города'],
  objectColumnLabel: 'Город',
  rows: [
    { id: 'novgorod', label: 'Великий Новгород' },
    { id: 'pskov', label: 'Псков' },
    { id: 'vladimir', label: 'Владимир' },
    { id: 'suzdal', label: 'Суздаль' },
    { id: 'yaroslavl', label: 'Ярославль' },
    { id: 'kazan', label: 'Казань' },
    { id: 'tobolsk', label: 'Тобольск' },
    { id: 'derbent', label: 'Дербент' }
  ],
  columns: [
    {
      id: 'founded', label: 'Первое упоминание', unit: 'год',
      align: 'center', kind: 'number',
      values: { novgorod: 859, pskov: 903, vladimir: 1108, suzdal: 1024,
                yaroslavl: 1010, kazan: 1005, tobolsk: 1587, derbent: 438 }
    },
    {
      id: 'population', label: 'Население', unit: 'тыс. чел.',
      align: 'center', kind: 'number',
      values: { novgorod: 224, pskov: 193, vladimir: 348, suzdal: 9,
                yaroslavl: 577, kazan: 1314, tobolsk: 98, derbent: 125 }
    },
    {
      id: 'distance', label: 'Расстояние до Москвы', unit: 'км',
      align: 'center', kind: 'number',
      values: { novgorod: 530, pskov: 730, vladimir: 180, suzdal: 220,
                yaroslavl: 265, kazan: 720, tobolsk: 2100, derbent: 1900 }
    },
    {
      id: 'river', label: 'Река',
      align: 'left', kind: 'text',
      values: { novgorod: 'Волхов', pskov: 'Великая', vladimir: 'Клязьма',
                suzdal: 'Каменка', yaroslavl: 'Волга', kazan: 'Волга',
                tobolsk: 'Иртыш', derbent: 'Каспий' }
    },
    {
      id: 'tourists', label: 'Туристов за год', unit: 'тыс. чел.',
      align: 'center', kind: 'number',
      values: {
        novgorod: { min: 300, max: 500, step: 50 },
        pskov: { min: 250, max: 450, step: 50 },
        vladimir: 800,
        suzdal: { min: 1000, max: 1600, step: 150 },
        yaroslavl: 700,
        kazan: 3500,
        tobolsk: { min: 150, max: 350, step: 50 },
        derbent: 400
      }
    }
  ]
},
{
  id: 'table-l1-34',
  level: 1,
  tags: ['спорт', 'плавание'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Заплыв',
  rows: [
    { id: 'free50', label: 'Вольный стиль, 50 м' },
    { id: 'free100', label: 'Вольный стиль, 100 м' },
    { id: 'free400', label: 'Вольный стиль, 400 м' },
    { id: 'back100', label: 'На спине, 100 м' },
    { id: 'breast100', label: 'Брасс, 100 м' },
    { id: 'fly100', label: 'Баттерфляй, 100 м' },
    { id: 'medley200', label: 'Комплекс, 200 м' },
    { id: 'relay', label: 'Эстафета 4×100 м' }
  ],
  columns: [
    {
      id: 'distance', label: 'Дистанция', unit: 'м',
      align: 'center', kind: 'number',
      values: { free50: 50, free100: 100, free400: 400, back100: 100,
                breast100: 100, fly100: 100, medley200: 200, relay: 400 }
    },
    {
      id: 'best', label: 'Лучший результат', unit: 'с',
      align: 'center', kind: 'number',
      values: { free50: 26.4, free100: 58.2, free400: 268, back100: 65.1,
                breast100: 71.8, fly100: 63.4, medley200: 148, relay: 240 }
    },
    {
      id: 'entries', label: 'Заявок', unit: 'чел.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        free50: { min: 24, max: 48, step: 6 },
        free100: { min: 20, max: 40, step: 5 },
        free400: 12,
        back100: 16,
        breast100: { min: 14, max: 30, step: 4 },
        fly100: 10,
        medley200: 8,
        relay: { min: 8, max: 20, step: 3 }
      }
    },
    {
      id: 'heats', label: 'Заплывов',
      align: 'center', kind: 'number',
      values: { free50: 6, free100: 5, free400: 2, back100: 2,
                breast100: 4, fly100: 2, medley200: 1, relay: 3 }
    },
    {
      id: 'age', label: 'Возрастная группа',
      align: 'center', kind: 'text',
      values: { free50: '12–14', free100: '12–14', free400: '15–17',
                back100: '12–14', breast100: '15–17', fly100: '15–17',
                medley200: '15–17', relay: '12–17' }
    }
  ]
},
{
  id: 'table-l1-35',
  level: 1,
  tags: ['биология', 'птицы'],
  objectColumnLabel: 'Птица',
  rows: [
    { id: 'sparrow', label: 'Воробей' },
    { id: 'crow', label: 'Ворона серая' },
    { id: 'swallow', label: 'Ласточка' },
    { id: 'owl', label: 'Филин' },
    { id: 'swan', label: 'Лебедь-шипун' },
    { id: 'stork', label: 'Белый аист' },
    { id: 'hummingbird', label: 'Колибри-пчёлка' },
    { id: 'ostrich', label: 'Страус' }
  ],
  columns: [
    {
      id: 'weight', label: 'Масса', unit: 'г',
      align: 'center', kind: 'number',
      values: { sparrow: 30, crow: 500, swallow: 20, owl: 3000,
                swan: 11000, stork: 3500, hummingbird: 2, ostrich: 120000 }
    },
    {
      id: 'wingspan', label: 'Размах крыльев', unit: 'см',
      align: 'center', kind: 'number',
      values: { sparrow: 25, crow: 100, swallow: 33, owl: 180,
                swan: 230, stork: 200, hummingbird: 7, ostrich: 200 }
    },
    {
      id: 'eggs', label: 'Яиц в кладке',
      align: 'center', kind: 'number',
      values: {
        sparrow: { min: 4, max: 8, step: 1 },
        crow: 5,
        swallow: { min: 3, max: 7, step: 1 },
        owl: 3,
        swan: { min: 5, max: 9, step: 1 },
        stork: 4,
        hummingbird: 2,
        ostrich: { min: 6, max: 14, step: 2 }
      }
    },
    {
      id: 'flies', label: 'Летает',
      align: 'center', kind: 'text',
      values: { sparrow: 'Да', crow: 'Да', swallow: 'Да', owl: 'Да',
                swan: 'Да', stork: 'Да', hummingbird: 'Да', ostrich: 'Нет' }
    },
    {
      id: 'winter', label: 'Зимовка',
      align: 'left', kind: 'text',
      values: { sparrow: 'Остаётся', crow: 'Остаётся', swallow: 'Африка',
                owl: 'Остаётся', swan: 'Юг Европы', stork: 'Африка',
                hummingbird: 'Куба', ostrich: 'Африка' }
    }
  ]
},
{
  id: 'table-l1-36',
  level: 1,
  tags: ['информатика', 'быт'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Файл',
  rows: [
    { id: 'photo', label: 'Фотография' },
    { id: 'song', label: 'Песня' },
    { id: 'doc', label: 'Реферат' },
    { id: 'movie', label: 'Фильм' },
    { id: 'presentation', label: 'Презентация' },
    { id: 'game', label: 'Игра' },
    { id: 'book', label: 'Электронная книга' },
    { id: 'archive', label: 'Архив с проектом' }
  ],
  columns: [
    {
      id: 'size', label: 'Размер', unit: 'МБ',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        photo: { min: 3, max: 11, step: 2 },
        song: 8,
        doc: 1,
        movie: { min: 1200, max: 2800, step: 400 },
        presentation: { min: 10, max: 30, step: 5 },
        game: 15000,
        book: 2,
        archive: { min: 40, max: 100, step: 15 }
      }
    },
    {
      id: 'format', label: 'Формат',
      align: 'center', kind: 'text',
      values: { photo: 'JPG', song: 'MP3', doc: 'DOCX', movie: 'MKV',
                presentation: 'PPTX', game: 'EXE', book: 'FB2', archive: 'ZIP' }
    },
    {
      id: 'copies', label: 'Файлов в папке', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        photo: { min: 200, max: 600, step: 50 },
        song: 340,
        doc: 25,
        movie: 12,
        presentation: 18,
        game: 6,
        book: { min: 40, max: 120, step: 20 },
        archive: 9
      }
    },
    {
      id: 'time', label: 'Загрузка по сети', unit: 'с',
      align: 'center', kind: 'number',
      values: { photo: 2, song: 5, doc: 1, movie: 900,
                presentation: 12, game: 4500, book: 1, archive: 40 }
    },
    {
      id: 'program', label: 'Чем открыть',
      align: 'left', kind: 'text',
      values: { photo: 'Просмотрщик', song: 'Плеер', doc: 'Редактор',
                movie: 'Плеер', presentation: 'Редактор', game: 'Не нужно',
                book: 'Читалка', archive: 'Архиватор' }
    }
  ]
},
{
  id: 'table-l1-37',
  level: 1,
  tags: ['география', 'горы'],
  objectColumnLabel: 'Вершина',
  rows: [
    { id: 'everest', label: 'Эверест' },
    { id: 'k2', label: 'Чогори (K2)' },
    { id: 'elbrus', label: 'Эльбрус' },
    { id: 'kilimanjaro', label: 'Килиманджаро' },
    { id: 'denali', label: 'Денали' },
    { id: 'aconcagua', label: 'Аконкагуа' },
    { id: 'montblanc', label: 'Монблан' },
    { id: 'fuji', label: 'Фудзияма' }
  ],
  columns: [
    {
      id: 'height', label: 'Высота', unit: 'м',
      align: 'center', kind: 'number',
      values: { everest: 8849, k2: 8611, elbrus: 5642, kilimanjaro: 5895,
                denali: 6190, aconcagua: 6961, montblanc: 4808, fuji: 3776 }
    },
    {
      id: 'firstclimb', label: 'Первое восхождение', unit: 'год',
      align: 'center', kind: 'number',
      values: { everest: 1953, k2: 1954, elbrus: 1829, kilimanjaro: 1889,
                denali: 1913, aconcagua: 1897, montblanc: 1786, fuji: 663 }
    },
    {
      id: 'continent', label: 'Материк',
      align: 'left', kind: 'text',
      values: { everest: 'Евразия', k2: 'Евразия', elbrus: 'Евразия',
                kilimanjaro: 'Африка', denali: 'Северная Америка',
                aconcagua: 'Южная Америка', montblanc: 'Евразия',
                fuji: 'Евразия' }
    },
    {
      id: 'days', label: 'Дней на восхождение',
      align: 'center', kind: 'number',
      values: { everest: 60, k2: 60, elbrus: 8, kilimanjaro: 7,
                denali: 20, aconcagua: 18, montblanc: 3, fuji: 1 }
    },
    {
      id: 'climbers', label: 'Восходителей за год', unit: 'чел.',
      align: 'center', kind: 'number',
      values: {
        everest: { min: 500, max: 900, step: 100 },
        k2: { min: 20, max: 100, step: 20 },
        elbrus: 5000,
        kilimanjaro: { min: 30000, max: 50000, step: 5000 },
        denali: 1100,
        aconcagua: 3500,
        montblanc: { min: 15000, max: 25000, step: 2500 },
        fuji: 200000
      }
    }
  ]
},
{
  id: 'table-l1-38',
  level: 1,
  tags: ['еда', 'напитки'],
  objectColumnLabel: 'Напиток',
  rows: [
    { id: 'espresso', label: 'Эспрессо' },
    { id: 'americano', label: 'Американо' },
    { id: 'blacktea', label: 'Чёрный чай' },
    { id: 'greentea', label: 'Зелёный чай' },
    { id: 'cocoa', label: 'Какао' },
    { id: 'cola', label: 'Кола' },
    { id: 'juice', label: 'Апельсиновый сок' },
    { id: 'milk', label: 'Молоко' }
  ],
  columns: [
    {
      id: 'volume', label: 'Объём порции', unit: 'мл',
      align: 'center', kind: 'number',
      values: { espresso: 30, americano: 180, blacktea: 200, greentea: 200,
                cocoa: 200, cola: 330, juice: 250, milk: 200 }
    },
    {
      id: 'caffeine', label: 'Кофеин', unit: 'мг',
      align: 'center', kind: 'number',
      values: { espresso: 63, americano: 95, blacktea: 47, greentea: 28,
                cocoa: 5, cola: 34, juice: 0, milk: 0 }
    },
    {
      id: 'calories', label: 'Калорийность', unit: 'ккал',
      align: 'center', kind: 'number',
      values: { espresso: 2, americano: 5, blacktea: 2, greentea: 2,
                cocoa: 140, cola: 139, juice: 112, milk: 122 }
    },
    {
      id: 'sugar', label: 'Сахар', unit: 'г',
      align: 'center', kind: 'number',
      values: { espresso: 0, americano: 0, blacktea: 0, greentea: 0,
                cocoa: 20, cola: 35, juice: 21, milk: 10 }
    },
    {
      id: 'sold', label: 'Заказов за смену', unit: 'шт.',
      align: 'center', kind: 'number',
      values: {
        espresso: { min: 30, max: 70, step: 10 },
        americano: { min: 60, max: 120, step: 15 },
        blacktea: 55,
        greentea: 30,
        cocoa: { min: 15, max: 45, step: 6 },
        cola: 40,
        juice: { min: 20, max: 52, step: 8 },
        milk: 18
      }
    }
  ]
},
{
  id: 'table-l1-39',
  level: 1,
  tags: ['история', 'изобретения'],
  objectColumnLabel: 'Изобретение',
  rows: [
    { id: 'press', label: 'Печатный станок' },
    { id: 'telescope', label: 'Телескоп' },
    { id: 'steam', label: 'Паровая машина' },
    { id: 'telegraph', label: 'Телеграф' },
    { id: 'phone', label: 'Телефон' },
    { id: 'radio', label: 'Радио' },
    { id: 'plane', label: 'Самолёт' },
    { id: 'computer', label: 'ЭВМ' }
  ],
  columns: [
    {
      id: 'year', label: 'Год',
      align: 'center', kind: 'number',
      values: { press: 1450, telescope: 1608, steam: 1769, telegraph: 1837,
                phone: 1876, radio: 1895, plane: 1903, computer: 1946 }
    },
    {
      id: 'century', label: 'Век',
      align: 'center', kind: 'text',
      values: { press: 'XV', telescope: 'XVII', steam: 'XVIII', telegraph: 'XIX',
                phone: 'XIX', radio: 'XIX', plane: 'XX', computer: 'XX' }
    },
    {
      id: 'country', label: 'Страна',
      align: 'left', kind: 'text',
      values: { press: 'Германия', telescope: 'Нидерланды', steam: 'Англия',
                telegraph: 'США', phone: 'США', radio: 'Россия',
                plane: 'США', computer: 'США' }
    },
    {
      id: 'field', label: 'Область',
      align: 'left', kind: 'text',
      values: { press: 'Книгопечатание', telescope: 'Астрономия',
                steam: 'Энергетика', telegraph: 'Связь', phone: 'Связь',
                radio: 'Связь', plane: 'Транспорт', computer: 'Вычисления' }
    },
    {
      id: 'gap', label: 'Лет до наших дней',
      align: 'center', kind: 'number',
      values: { press: 575, telescope: 417, steam: 256, telegraph: 188,
                phone: 149, radio: 130, plane: 122, computer: 79 }
    }
  ]
},
{
  id: 'table-l1-40',
  level: 1,
  tags: ['школа', 'класс'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Класс',
  rows: [
    { id: 'a5', label: '5 «А»' },
    { id: 'b5', label: '5 «Б»' },
    { id: 'a6', label: '6 «А»' },
    { id: 'b6', label: '6 «Б»' },
    { id: 'a7', label: '7 «А»' },
    { id: 'b7', label: '7 «Б»' },
    { id: 'a8', label: '8 «А»' },
    { id: 'b8', label: '8 «Б»' }
  ],
  columns: [
    {
      id: 'pupils', label: 'Учеников', unit: 'чел.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        a5: { min: 24, max: 32, step: 2 },
        b5: 27,
        a6: { min: 22, max: 30, step: 2 },
        b6: 25,
        a7: 29,
        b7: { min: 20, max: 28, step: 2 },
        a8: 26,
        b8: { min: 23, max: 31, step: 2 }
      }
    },
    {
      id: 'lessons', label: 'Уроков в неделю',
      align: 'center', kind: 'number',
      values: { a5: 29, b5: 29, a6: 30, b6: 30,
                a7: 32, b7: 32, a8: 33, b8: 33 }
    },
    {
      id: 'room', label: 'Кабинет',
      align: 'center', kind: 'text',
      values: { a5: '104', b5: '105', a6: '201', b6: '202',
                a7: '210', b7: '211', a8: '304', b8: '305' }
    },
    {
      id: 'trips', label: 'Поездок за год',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        a5: 4,
        b5: { min: 2, max: 6, step: 1 },
        a6: 5,
        b6: 3,
        a7: { min: 3, max: 7, step: 1 },
        b7: 4,
        a8: { min: 1, max: 5, step: 1 },
        b8: 6
      }
    },
    {
      id: 'shift', label: 'Смена',
      align: 'center', kind: 'text',
      values: { a5: 'Первая', b5: 'Первая', a6: 'Вторая', b6: 'Вторая',
                a7: 'Первая', b7: 'Первая', a8: 'Первая', b8: 'Вторая' }
    }
  ]
},
{
  id: 'table-l1-41',
  level: 1,
  tags: ['биология', 'море'],
  objectColumnLabel: 'Обитатель',
  rows: [
    { id: 'bluewhale', label: 'Синий кит' },
    { id: 'dolphin', label: 'Афалина' },
    { id: 'whiteshark', label: 'Белая акула' },
    { id: 'octopus', label: 'Осьминог' },
    { id: 'turtle', label: 'Морская черепаха' },
    { id: 'jellyfish', label: 'Медуза-цианея' },
    { id: 'seahorse', label: 'Морской конёк' },
    { id: 'walrus', label: 'Морж' }
  ],
  columns: [
    {
      id: 'length', label: 'Длина тела', unit: 'м',
      align: 'center', kind: 'number',
      values: { bluewhale: 30, dolphin: 3, whiteshark: 5, octopus: 1,
                turtle: 1.5, jellyfish: 2, seahorse: 0.2, walrus: 3.5 }
    },
    {
      id: 'weight', label: 'Масса', unit: 'кг',
      align: 'center', kind: 'number',
      values: { bluewhale: 150000, dolphin: 300, whiteshark: 1100, octopus: 15,
                turtle: 160, jellyfish: 200, seahorse: 0.2, walrus: 1200 }
    },
    {
      id: 'depth', label: 'Глубина обитания', unit: 'м',
      align: 'center', kind: 'number',
      values: { bluewhale: 100, dolphin: 300, whiteshark: 1200, octopus: 200,
                turtle: 300, jellyfish: 20, seahorse: 15, walrus: 80 }
    },
    {
      id: 'lifespan', label: 'Срок жизни', unit: 'лет',
      align: 'center', kind: 'number',
      values: {
        bluewhale: { min: 70, max: 90, step: 5 },
        dolphin: { min: 30, max: 50, step: 5 },
        whiteshark: 70,
        octopus: 3,
        turtle: { min: 50, max: 80, step: 10 },
        jellyfish: 1,
        seahorse: 4,
        walrus: { min: 30, max: 40, step: 2 }
      }
    },
    {
      id: 'food', label: 'Чем питается',
      align: 'left', kind: 'text',
      values: { bluewhale: 'Планктон', dolphin: 'Рыба', whiteshark: 'Тюлени',
                octopus: 'Крабы', turtle: 'Водоросли', jellyfish: 'Планктон',
                seahorse: 'Рачки', walrus: 'Моллюски' }
    }
  ]
},
{
  id: 'table-l1-42',
  level: 1,
  tags: ['экология', 'мусор'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Материал',
  rows: [
    { id: 'paper', label: 'Бумага' },
    { id: 'glass', label: 'Стекло' },
    { id: 'plastic', label: 'Пластик' },
    { id: 'metal', label: 'Металл' },
    { id: 'food', label: 'Пищевые отходы' },
    { id: 'textile', label: 'Текстиль' },
    { id: 'battery', label: 'Батарейки' },
    { id: 'wood', label: 'Дерево' }
  ],
  columns: [
    {
      id: 'decay', label: 'Срок разложения', unit: 'лет',
      align: 'center', kind: 'number',
      values: { paper: 2, glass: 1000, plastic: 450, metal: 100,
                food: 1, textile: 30, battery: 110, wood: 10 }
    },
    {
      id: 'collected', label: 'Собрано за месяц', unit: 'кг',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        paper: { min: 200, max: 400, step: 40 },
        glass: { min: 150, max: 350, step: 40 },
        plastic: 280,
        metal: 90,
        food: { min: 300, max: 600, step: 60 },
        textile: 60,
        battery: { min: 4, max: 20, step: 4 },
        wood: 120
      }
    },
    {
      id: 'share', label: 'Доля в мусоре', unit: '%',
      align: 'center', kind: 'number',
      values: { paper: 25, glass: 10, plastic: 20, metal: 5,
                food: 30, textile: 5, battery: 1, wood: 4 }
    },
    {
      id: 'recyclable', label: 'Переработка',
      align: 'center', kind: 'text',
      values: { paper: 'Да', glass: 'Да', plastic: 'Частично', metal: 'Да',
                food: 'Компост', textile: 'Частично', battery: 'Особая',
                wood: 'Да' }
    },
    {
      id: 'container', label: 'Цвет бака',
      align: 'center', kind: 'text',
      values: { paper: 'Синий', glass: 'Зелёный', plastic: 'Жёлтый',
                metal: 'Серый', food: 'Коричневый', textile: 'Оранжевый',
                battery: 'Красный', wood: 'Серый' }
    }
  ]
},
{
  id: 'table-l1-43',
  level: 1,
  tags: ['литература', 'книги'],
  objectColumnLabel: 'Произведение',
  rows: [
    { id: 'captain', label: '«Капитанская дочка»' },
    { id: 'revizor', label: '«Ревизор»' },
    { id: 'mumu', label: '«Муму»' },
    { id: 'hero', label: '«Герой нашего времени»' },
    { id: 'detstvo', label: '«Детство»' },
    { id: 'kashtanka', label: '«Каштанка»' },
    { id: 'shinel', label: '«Шинель»' },
    { id: 'gorky', label: '«Старуха Изергиль»' }
  ],
  columns: [
    {
      id: 'author', label: 'Автор',
      align: 'left', kind: 'text',
      values: { captain: 'А. Пушкин', revizor: 'Н. Гоголь', mumu: 'И. Тургенев',
                hero: 'М. Лермонтов', detstvo: 'Л. Толстой', kashtanka: 'А. Чехов',
                shinel: 'Н. Гоголь', gorky: 'М. Горький' }
    },
    {
      id: 'year', label: 'Год издания',
      align: 'center', kind: 'number',
      values: { captain: 1836, revizor: 1836, mumu: 1854, hero: 1840,
                detstvo: 1852, kashtanka: 1887, shinel: 1842, gorky: 1895 }
    },
    {
      id: 'genre', label: 'Жанр',
      align: 'center', kind: 'text',
      values: { captain: 'Роман', revizor: 'Комедия', mumu: 'Рассказ',
                hero: 'Роман', detstvo: 'Повесть', kashtanka: 'Рассказ',
                shinel: 'Повесть', gorky: 'Рассказ' }
    },
    {
      id: 'pages', label: 'Объём', unit: 'стр.',
      align: 'center', kind: 'number',
      values: { captain: 160, revizor: 96, mumu: 32, hero: 224,
                detstvo: 128, kashtanka: 24, shinel: 48, gorky: 40 }
    },
    {
      id: 'grade', label: 'Класс по программе',
      align: 'center', kind: 'number',
      values: { captain: 8, revizor: 8, mumu: 5, hero: 9,
                detstvo: 7, kashtanka: 5, shinel: 8, gorky: 7 }
    }
  ]
},
{
  id: 'table-l1-44',
  level: 1,
  tags: ['техника', 'связь'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Тариф',
  rows: [
    { id: 'start', label: '«Старт»' },
    { id: 'talk', label: '«Разговор»' },
    { id: 'net', label: '«Только интернет»' },
    { id: 'family', label: '«Семейный»' },
    { id: 'travel', label: '«Путешествие»' },
    { id: 'student', label: '«Студент»' },
    { id: 'max', label: '«Максимум»' },
    { id: 'watch', label: '«Для часов»' }
  ],
  columns: [
    {
      id: 'price', label: 'Абонплата', unit: 'руб. в месяц',
      align: 'center', kind: 'number',
      values: { start: 300, talk: 450, net: 400, family: 900,
                travel: 700, student: 250, max: 1200, watch: 150 }
    },
    {
      id: 'minutes', label: 'Минут', unit: 'мин',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        start: { min: 200, max: 400, step: 50 },
        talk: { min: 600, max: 1000, step: 100 },
        net: 50,
        family: 800,
        travel: 500,
        student: { min: 150, max: 350, step: 50 },
        max: 2000,
        watch: 100
      }
    },
    {
      id: 'traffic', label: 'Интернет', unit: 'ГБ',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        start: 10,
        talk: 8,
        net: { min: 30, max: 70, step: 10 },
        family: { min: 40, max: 80, step: 10 },
        travel: 25,
        student: { min: 12, max: 28, step: 4 },
        max: 100,
        watch: 3
      }
    },
    {
      id: 'sms', label: 'SMS', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: { start: 50, talk: 100, net: 0, family: 200,
                travel: 100, student: 50, max: 500, watch: 20 }
    },
    {
      id: 'sims', label: 'Симкарт в тарифе',
      align: 'center', kind: 'number',
      values: { start: 1, talk: 1, net: 1, family: 4,
                travel: 1, student: 1, max: 2, watch: 1 }
    }
  ]
},
{
  id: 'table-l1-45',
  level: 1,
  tags: ['история', 'древний мир'],
  objectColumnLabel: 'Сооружение',
  rows: [
    { id: 'pyramid', label: 'Пирамида Хеопса' },
    { id: 'colossus', label: 'Колосс Родосский' },
    { id: 'lighthouse', label: 'Александрийский маяк' },
    { id: 'colosseum', label: 'Колизей' },
    { id: 'parthenon', label: 'Парфенон' },
    { id: 'greatwall', label: 'Великая Китайская стена' },
    { id: 'stonehenge', label: 'Стоунхендж' },
    { id: 'petra', label: 'Петра' }
  ],
  columns: [
    {
      id: 'built', label: 'Построено',
      align: 'center', kind: 'text',
      values: { pyramid: '2560 до н. э.', colossus: '280 до н. э.',
                lighthouse: '280 до н. э.', colosseum: '80 н. э.',
                parthenon: '438 до н. э.', greatwall: 'III в. до н. э.',
                stonehenge: '2500 до н. э.', petra: 'I в. до н. э.' }
    },
    {
      id: 'height', label: 'Высота', unit: 'м',
      align: 'center', kind: 'number',
      values: { pyramid: 139, colossus: 33, lighthouse: 120, colosseum: 48,
                parthenon: 14, greatwall: 8, stonehenge: 5, petra: 40 }
    },
    {
      id: 'country', label: 'Страна',
      align: 'left', kind: 'text',
      values: { pyramid: 'Египет', colossus: 'Греция', lighthouse: 'Египет',
                colosseum: 'Италия', parthenon: 'Греция', greatwall: 'Китай',
                stonehenge: 'Англия', petra: 'Иордания' }
    },
    {
      id: 'survived', label: 'Сохранилось',
      align: 'center', kind: 'text',
      values: { pyramid: 'Да', colossus: 'Нет', lighthouse: 'Нет',
                colosseum: 'Частично', parthenon: 'Частично', greatwall: 'Да',
                stonehenge: 'Частично', petra: 'Да' }
    },
    {
      id: 'visitors', label: 'Туристов за год', unit: 'тыс. чел.',
      align: 'center', kind: 'number',
      values: {
        pyramid: { min: 3000, max: 5000, step: 500 },
        colossus: 0,
        lighthouse: 0,
        colosseum: { min: 6000, max: 8000, step: 500 },
        parthenon: 3000,
        greatwall: { min: 8000, max: 12000, step: 1000 },
        stonehenge: 1300,
        petra: { min: 500, max: 1100, step: 100 }
      }
    }
  ]
},
{
  id: 'table-l1-46',
  level: 1,
  tags: ['физика', 'быт'],
  objectColumnLabel: 'Вещество',
  rows: [
    { id: 'water', label: 'Вода' },
    { id: 'ice', label: 'Лёд' },
    { id: 'oil', label: 'Подсолнечное масло' },
    { id: 'milk', label: 'Молоко' },
    { id: 'honey', label: 'Мёд' },
    { id: 'alcohol', label: 'Спирт' },
    { id: 'mercury', label: 'Ртуть' },
    { id: 'air', label: 'Воздух' }
  ],
  columns: [
    {
      id: 'density', label: 'Плотность', unit: 'кг/м³',
      align: 'center', kind: 'number',
      values: { water: 1000, ice: 917, oil: 920, milk: 1030,
                honey: 1420, alcohol: 789, mercury: 13546, air: 1.2 }
    },
    {
      id: 'freezing', label: 'Температура замерзания', unit: '°C',
      align: 'center', kind: 'number',
      values: { water: 0, ice: 0, oil: -16, milk: -0.5,
                honey: -36, alcohol: -114, mercury: -39, air: -213 }
    },
    {
      id: 'boiling', label: 'Температура кипения', unit: '°C',
      align: 'center', kind: 'number',
      values: { water: 100, ice: 100, oil: 227, milk: 100,
                honey: 160, alcohol: 78, mercury: 357, air: -194 }
    },
    {
      id: 'state', label: 'Состояние при 20 °C',
      align: 'center', kind: 'text',
      values: { water: 'Жидкое', ice: 'Твёрдое', oil: 'Жидкое', milk: 'Жидкое',
                honey: 'Жидкое', alcohol: 'Жидкое', mercury: 'Жидкое',
                air: 'Газ' }
    },
    {
      id: 'floats', label: 'Плавает в воде',
      align: 'center', kind: 'text',
      values: { water: '—', ice: 'Да', oil: 'Да', milk: 'Нет',
                honey: 'Нет', alcohol: 'Да', mercury: 'Нет', air: 'Да' }
    }
  ]
},
{
  id: 'table-l1-47',
  level: 1,
  tags: ['спорт', 'олимпиада'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Страна',
  rows: [
    { id: 'usa', label: 'США' },
    { id: 'china', label: 'Китай' },
    { id: 'japan', label: 'Япония' },
    { id: 'australia', label: 'Австралия' },
    { id: 'france', label: 'Франция' },
    { id: 'italy', label: 'Италия' },
    { id: 'germany', label: 'Германия' },
    { id: 'korea', label: 'Республика Корея' }
  ],
  columns: [
    {
      id: 'gold', label: 'Золото', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        usa: { min: 30, max: 46, step: 4 },
        china: { min: 28, max: 44, step: 4 },
        japan: 20,
        australia: 18,
        france: { min: 12, max: 24, step: 3 },
        italy: 12,
        germany: { min: 8, max: 20, step: 3 },
        korea: 13
      }
    },
    {
      id: 'silver', label: 'Серебро', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        usa: 41,
        china: { min: 20, max: 32, step: 3 },
        japan: 12,
        australia: { min: 14, max: 26, step: 3 },
        france: 26,
        italy: 13,
        germany: 13,
        korea: { min: 6, max: 14, step: 2 }
      }
    },
    {
      id: 'bronze', label: 'Бронза', unit: 'шт.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        usa: 42,
        china: 24,
        japan: { min: 10, max: 22, step: 3 },
        australia: 14,
        france: 22,
        italy: { min: 12, max: 24, step: 3 },
        germany: 8,
        korea: 10
      }
    },
    {
      id: 'athletes', label: 'Спортсменов', unit: 'чел.',
      align: 'center', kind: 'number', total: 'sum',
      values: { usa: 594, china: 388, japan: 403, australia: 460,
                france: 573, italy: 402, germany: 428, korea: 143 }
    },
    {
      id: 'continent', label: 'Часть света',
      align: 'left', kind: 'text',
      values: { usa: 'Северная Америка', china: 'Азия', japan: 'Азия',
                australia: 'Австралия', france: 'Европа', italy: 'Европа',
                germany: 'Европа', korea: 'Азия' }
    }
  ]
},
{
  id: 'table-l1-48',
  level: 1,
  tags: ['биология', 'насекомые'],
  objectColumnLabel: 'Насекомое',
  rows: [
    { id: 'bee', label: 'Медоносная пчела' },
    { id: 'ant', label: 'Рыжий муравей' },
    { id: 'dragonfly', label: 'Стрекоза' },
    { id: 'butterfly', label: 'Махаон' },
    { id: 'beetle', label: 'Жук-олень' },
    { id: 'mosquito', label: 'Комар' },
    { id: 'grasshopper', label: 'Кузнечик' },
    { id: 'ladybug', label: 'Божья коровка' }
  ],
  columns: [
    {
      id: 'size', label: 'Длина тела', unit: 'мм',
      align: 'center', kind: 'number',
      values: { bee: 14, ant: 9, dragonfly: 50, butterfly: 40,
                beetle: 75, mosquito: 6, grasshopper: 35, ladybug: 7 }
    },
    {
      id: 'wingbeats', label: 'Взмахов крыльев', unit: 'в секунду',
      align: 'center', kind: 'number',
      values: { bee: 230, ant: 0, dragonfly: 35, butterfly: 9,
                beetle: 50, mosquito: 600, grasshopper: 20, ladybug: 85 }
    },
    {
      id: 'speed', label: 'Скорость полёта', unit: 'км/ч',
      align: 'center', kind: 'number',
      values: { bee: 25, ant: 0, dragonfly: 55, butterfly: 20,
                beetle: 8, mosquito: 3, grasshopper: 12, ladybug: 24 }
    },
    {
      id: 'life', label: 'Срок жизни', unit: 'суток',
      align: 'center', kind: 'number',
      values: {
        bee: { min: 30, max: 50, step: 5 },
        ant: 365,
        dragonfly: { min: 30, max: 90, step: 15 },
        butterfly: 20,
        beetle: 60,
        mosquito: { min: 10, max: 30, step: 5 },
        grasshopper: 90,
        ladybug: { min: 200, max: 400, step: 50 }
      }
    },
    {
      id: 'food', label: 'Питание',
      align: 'left', kind: 'text',
      values: { bee: 'Нектар', ant: 'Всеядный', dragonfly: 'Насекомые',
                butterfly: 'Нектар', beetle: 'Сок деревьев', mosquito: 'Нектар',
                grasshopper: 'Растения', ladybug: 'Тля' }
    }
  ]
},
{
  id: 'table-l1-49',
  level: 1,
  tags: ['геометрия', 'математика'],
  objectColumnLabel: 'Фигура',
  rows: [
    { id: 'triangle', label: 'Треугольник' },
    { id: 'square', label: 'Квадрат' },
    { id: 'rectangle', label: 'Прямоугольник' },
    { id: 'pentagon', label: 'Пятиугольник' },
    { id: 'hexagon', label: 'Шестиугольник' },
    { id: 'octagon', label: 'Восьмиугольник' },
    { id: 'rhombus', label: 'Ромб' },
    { id: 'trapezoid', label: 'Трапеция' }
  ],
  columns: [
    {
      id: 'sides', label: 'Число сторон',
      align: 'center', kind: 'number',
      values: { triangle: 3, square: 4, rectangle: 4, pentagon: 5,
                hexagon: 6, octagon: 8, rhombus: 4, trapezoid: 4 }
    },
    {
      id: 'angles', label: 'Сумма углов', unit: '°',
      align: 'center', kind: 'number',
      values: { triangle: 180, square: 360, rectangle: 360, pentagon: 540,
                hexagon: 720, octagon: 1080, rhombus: 360, trapezoid: 360 }
    },
    {
      id: 'diagonals', label: 'Число диагоналей',
      align: 'center', kind: 'number',
      values: { triangle: 0, square: 2, rectangle: 2, pentagon: 5,
                hexagon: 9, octagon: 20, rhombus: 2, trapezoid: 2 }
    },
    {
      id: 'symmetry', label: 'Осей симметрии',
      align: 'center', kind: 'number',
      values: { triangle: 3, square: 4, rectangle: 2, pentagon: 5,
                hexagon: 6, octagon: 8, rhombus: 2, trapezoid: 0 }
    },
    {
      id: 'equal', label: 'Все стороны равны',
      align: 'center', kind: 'text',
      values: { triangle: 'Да', square: 'Да', rectangle: 'Нет', pentagon: 'Да',
                hexagon: 'Да', octagon: 'Да', rhombus: 'Да', trapezoid: 'Нет' }
    }
  ]
},
{
  id: 'table-l1-50',
  level: 1,
  tags: ['лагерь', 'досуг'],
  totalsRow: { label: 'Итого' },
  objectColumnLabel: 'Отряд',
  rows: [
    { id: 'first', label: 'Первый' },
    { id: 'second', label: 'Второй' },
    { id: 'third', label: 'Третий' },
    { id: 'fourth', label: 'Четвёртый' },
    { id: 'fifth', label: 'Пятый' },
    { id: 'sixth', label: 'Шестой' },
    { id: 'seventh', label: 'Седьмой' },
    { id: 'eighth', label: 'Восьмой' }
  ],
  columns: [
    {
      id: 'kids', label: 'Детей в отряде', unit: 'чел.',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        first: { min: 18, max: 26, step: 2 },
        second: 22,
        third: { min: 20, max: 28, step: 2 },
        fourth: 25,
        fifth: { min: 16, max: 24, step: 2 },
        sixth: 21,
        seventh: 24,
        eighth: { min: 14, max: 22, step: 2 }
      }
    },
    {
      id: 'age', label: 'Возраст', unit: 'лет',
      align: 'center', kind: 'text',
      values: { first: '15–16', second: '14–15', third: '13–14', fourth: '12–13',
                fifth: '11–12', sixth: '10–11', seventh: '9–10', eighth: '7–8' }
    },
    {
      id: 'building', label: 'Корпус',
      align: 'center', kind: 'number',
      values: { first: 1, second: 1, third: 2, fourth: 2,
                fifth: 3, sixth: 3, seventh: 4, eighth: 4 }
    },
    {
      id: 'points', label: 'Очков в спартакиаде',
      align: 'center', kind: 'number', total: 'sum',
      values: {
        first: 48,
        second: { min: 30, max: 54, step: 6 },
        third: 41,
        fourth: { min: 24, max: 48, step: 6 },
        fifth: 33,
        sixth: 29,
        seventh: { min: 12, max: 36, step: 6 },
        eighth: 18
      }
    },
    {
      id: 'lights', label: 'Отбой',
      align: 'center', kind: 'text',
      values: { first: '23:00', second: '22:30', third: '22:30', fourth: '22:00',
                fifth: '22:00', sixth: '21:30', seventh: '21:30', eighth: '21:00' }
    }
  ]
}

];
