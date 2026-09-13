export interface AppTheme {
  id: string;
  name: string;
  emoji: string;
  accentClass: string;
  bgGradient: string;
  cardStyle: string;
  vocabulary: {
    characters: string[];
    items: string[];
    locations: string[];
    actions: string[];
  };
}

export const OGE_THEMES: AppTheme[] = [
  {
    id: 'standard',
    name: 'Стандартная (ОГЭ)',
    emoji: '📝',
    accentClass: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-200',
    bgGradient: 'from-slate-50 to-slate-100',
    cardStyle: 'border-slate-200/80 bg-white shadow-xl shadow-slate-200/50',
    vocabulary: {
      characters: ['Пользователь', 'Ученик', 'Администратор', 'Программист', 'Робот'],
      items: ['файл', 'символ', 'байт', 'сервер', 'компьютер', 'диск', 'запись', 'код'],
      locations: ['класс', 'архив', 'база данных', 'локальная сеть', 'интернет'],
      actions: ['передает', 'кодирует', 'форматирует', 'вычисляет', 'архивирует']
    }
  },
  {
    id: 'space',
    name: 'Космос',
    emoji: '🚀',
    accentClass: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-indigo-200',
    bgGradient: 'from-slate-900 via-indigo-950 to-slate-900 text-white',
    cardStyle: 'border-indigo-500/10 bg-slate-900/90 text-slate-100 shadow-2xl shadow-indigo-950/50 backdrop-blur-md',
    vocabulary: {
      characters: ['Капитан Гагарин', 'Астронавт Марк', 'Инопланетянин Кронос', 'Бортовой ИИ', 'Навигатор Стелла'],
      items: ['метеорит', 'скафандр', 'лазерный передатчик', 'черная дыра', 'марсоход', 'звездная карта', 'квантовый чип'],
      locations: ['станция Мир-2', 'сектор Гамма', 'туманность Андромеды', 'поверхность Марса', 'орбита Сатурна'],
      actions: ['телепортирует', 'пеленгует', 'сканирует', 'запускает', 'орбитирует']
    }
  },
  {
    id: 'potter',
    name: 'Гарри Поттер',
    emoji: '⚡',
    accentClass: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-amber-200',
    bgGradient: 'from-amber-950 via-stone-900 to-amber-950 text-amber-50',
    cardStyle: 'border-amber-500/10 bg-amber-950/70 text-amber-50 shadow-2xl shadow-stone-950/85 backdrop-blur-md',
    vocabulary: {
      characters: ['Гарри Поттер', 'Гермиона', 'Рон Уизли', 'Профессор Дамблдор', 'Северус Снейп', 'Добби'],
      items: ['волшебная палочка', 'Философский камень', 'карта Мародеров', 'зелье удачи', 'Золотой Снитч', 'маховик времени'],
      locations: ['Хогвартс', 'Косой переулок', 'Кабинет зельеварения', 'Тайная комната', 'Запретный лес'],
      actions: ['колдует', 'трансфигурирует', 'левитирует', 'варит зелье', 'разгадывает заклинание']
    }
  },
  {
    id: 'minecraft',
    name: 'Майнкрафт',
    emoji: '🟩',
    accentClass: 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-green-200',
    bgGradient: 'from-lime-950 via-neutral-900 to-emerald-950 text-lime-50',
    cardStyle: 'border-lime-500/10 bg-neutral-950/80 text-lime-50 shadow-2xl shadow-black/80 backdrop-blur-md',
    vocabulary: {
      characters: ['Стив', 'Алекс', 'Крипер', 'Эндермен', 'Житель', 'Железный Голем'],
      items: ['алмазная кирка', 'красный камень (редстоун)', 'ведро лавы', 'золотое яблоко', 'спавнер мобов', 'обсидиан'],
      locations: ['Нижний мир (Ад)', 'Мир Края', 'шахта глубинного сланца', 'деревня жителей', 'грибной биом'],
      actions: ['крафтит', 'добывает', 'строит ферму', 'взрывает', 'выращивает']
    }
  },
  {
    id: 'cars',
    name: 'Автомобили',
    emoji: '🏎️',
    accentClass: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-rose-200',
    bgGradient: 'from-stone-900 via-zinc-800 to-stone-900 text-zinc-50',
    cardStyle: 'border-rose-500/10 bg-zinc-900/95 text-zinc-100 shadow-2xl shadow-black/60 backdrop-blur-md',
    vocabulary: {
      characters: ['Гонщик Шумахер', 'Инженер Макс', 'Шеф-механик', 'Автопилот Тесла', 'Маршал гонки'],
      items: ['двигатель V8', 'активный спойлер', 'гоночный болид', 'комплект шин сликов', 'гаечный ключ', 'секундомер'],
      locations: ['гоночная трасса Монца', 'автомастерская', 'пит-лейн', 'испытательный полигон', 'аэродинамическая труба'],
      actions: ['разгоняет', 'дрифтует', 'тюнингует', 'тормозит', 'проходит круг']
    }
  }
];
