export interface FileNamesByCategory {
  documents: string[];
  tables: string[];
  images: string[];
  audio: string[];
  video: string[];
  presentations: string[];
  archives: string[];
  programs: string[];
  webpages: string[];
  universal: string[];
}

export const FILE_NAMES: FileNamesByCategory = {
  documents: [
    'soobshenie', 'tezisy', 'plan', 'otzyv', 'recenziya', 'harakteristika',
    'avtobiografiya', 'protokol', 'akt', 'prikaz', 'ustav', 'polozhenie',
    'pamyatka', 'metodichka', 'posobie', 'zadachnik', 'hrestomatiya', 'roman',
    'povest', 'rasskaz', 'skazka', 'stihi', 'poema', 'basnya', 'pyesa',
    'scenariy', 'perevod', 'annotaciya', 'kursovaya', 'obyavlenie'
  ],
  tables: [
    'vedomost', 'zhurnal', 'reestr', 'otchetnost', 'raschet', 'balans',
    'zarplata', 'tarify', 'normy', 'izmereniya', 'opyty', 'rezultaty',
    'bally', 'reyting', 'tablo', 'inventar', 'sklad', 'zakazy',
    'prodazhi', 'dohody', 'rashody', 'plateji', 'nalogi', 'kredit',
    'vklady', 'kursy', 'valuta', 'pogoda', 'temperatura', 'osadki'
  ],
  images: [
    'natyurmort', 'akvarel', 'eskiz', 'nabrosok', 'grafika', 'freska',
    'mozaika', 'vitrazh', 'illyustraciya', 'komiks', 'karikatura', 'fon',
    'tekstura', 'uzor', 'ornament', 'flag', 'emblema', 'znachok',
    'marka', 'afisha', 'bilet', 'diplom', 'gramota', 'sertifikat',
    'vizitka', 'kalendar', 'panorama', 'kadr', 'oblozhka', 'fotografiya'
  ],
  audio: [
    'polka', 'mazurka', 'etyud', 'prelyudiya', 'nokturn', 'fuga',
    'ariya', 'hor', 'duet', 'kvartet', 'orkestr', 'ansambl',
    'folk', 'dzhaz', 'blyuz', 'rok', 'rep', 'klassika',
    'shanson', 'chastushki', 'zvuki', 'shum', 'signal', 'zvonok',
    'budilnik', 'fanfary', 'serenada', 'kantata', 'opera', 'eho'
  ],
  video: [
    'kinofilm', 'serial', 'seriya', 'epizod', 'peredacha', 'novosti',
    'spektakl', 'balet', 'myuzikl', 'shou', 'anons', 'montazh',
    'semka', 'hronika', 'letopis', 'svadba', 'yubiley', 'utrennik',
    'vypusknoy', 'sorevnovaniya', 'zabeg', 'gonka', 'ralli', 'trenirovka',
    'masterklass', 'eksperiment', 'vebinar', 'safari', 'zoopark', 'feyerverk'
  ],
  presentations: [
    'vystavka', 'muzey', 'portfolio', 'biznesplan', 'startap', 'obuchenie',
    'kurs', 'trening', 'soveshchanie', 'sobranie', 'lineyka', 'kvest',
    'voda', 'vozduh', 'vulkany', 'dinozavry', 'pticy', 'nasekomye',
    'griby', 'derevya', 'okean', 'pustynya', 'arktika', 'egipet',
    'rim', 'greciya', 'professii', 'zdorove', 'bezopasnost', 'etiket'
  ],
  archives: [
    'proekty', 'fotki', 'snimki', 'zapisi', 'pesni', 'filmy',
    'knigi', 'uchebniki', 'referaty', 'prezentacii', 'tablicy', 'shablony',
    'ikonki', 'shrifty', 'kartinki', 'treki', 'albom', 'podborka',
    'izbrannoe', 'starye', 'novoe', 'obshee', 'rabota', 'ucheba',
    'lichnoe', 'semeynoe', 'otpusk', 'hranilishche', 'distributiv', 'komplekt'
  ],
  programs: [
    'antivirus', 'arhivator', 'brauzer', 'pleer', 'bloknot', 'emulyator',
    'kompilyator', 'otladchik', 'tester', 'skript', 'modul', 'biblioteka',
    'patch', 'utilita', 'lancher', 'menedzher', 'monitor', 'diagnostika',
    'ochistka', 'defragment', 'sinhro', 'labirint', 'tetris', 'arkanoid',
    'shashki', 'sudoku', 'pazl', 'simulyator', 'trenazher', 'golovolomka'
  ],
  webpages: [
    'default', 'login', 'signup', 'search', 'help', 'faq',
    'support', 'download', 'gallery', 'price', 'order', 'cart',
    'payment', 'delivery', 'reviews', 'feedback', 'sitemap', 'archive',
    'tags', 'category', 'product', 'service', 'team', 'career',
    'vacancy', 'partners', 'license', 'privacy', 'terms', 'admin'
  ],
  universal: [
    'sneg', 'dozhd', 'groza', 'raduga', 'tuman', 'veter',
    'ozero', 'reka', 'vodopad', 'ostrov', 'plyazh', 'pole',
    'lug', 'step', 'tayga', 'bereza', 'dub', 'roza',
    'tyulpan', 'romashka', 'yagody', 'yablonya', 'kotenok', 'shchenok',
    'loshad', 'delfin', 'tigr', 'medved', 'orel', 'babochka'
  ]
};

export const EXTENSIONS: Record<keyof FileNamesByCategory, string[]> = {
  documents: ['doc', 'docx', 'txt', 'rtf', 'pdf', 'odt', 'djvu', 'fb2', 'epub'],
  tables: ['xls', 'xlsx', 'csv', 'ods', 'xlsm', 'dbf'],
  images: ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'tif', 'tiff', 'svg', 'ico', 'psd'],
  audio: ['mp3', 'wav', 'wma', 'ogg', 'flac', 'mid', 'midi', 'aac', 'm4a'],
  video: ['avi', 'mp4', 'mov', 'mkv', 'wmv', 'mpg', 'mpeg', 'flv', '3gp'],
  presentations: ['ppt', 'pptx', 'odp', 'pps', 'ppsx'],
  archives: ['zip', 'rar', '7z', 'tar', 'gz', 'arj', 'iso', 'cab'],
  programs: ['exe', 'com', 'msi', 'bat', 'cmd', 'py', 'cpp', 'pas', 'bas', 'java', 'dll', 'apk'],
  webpages: ['htm', 'html', 'php', 'asp', 'aspx', 'xml', 'css', 'js'],
  universal: ['txt', 'pdf', 'doc', 'docx', 'zip', 'jpg', 'png', 'htm', 'html']
};

export const SITES: string[] = [
  'school', 'shkola', 'gimnaziya', 'licey', 'kolledzh', 'universitet', 'institut', 'akademiya', 'kafedra', 'student',
  'abiturient', 'ucheba', 'obrazovanie', 'urok', 'znanie', 'prosveshchenie', 'uchitel', 'pedsovet', 'klass', 'vypusk',
  'olimpiada', 'repetitor', 'kursy', 'diplom', 'ege', 'oge', 'nauka', 'metodist', 'shkola12', 'licey5',
  'novosti', 'vesti', 'gazeta', 'zhurnal', 'radio', 'telekanal', 'press', 'media', 'inform', 'izvestiya',
  'vestnik', 'kurier', 'hronika', 'reporter', 'efir', 'kanal', 'regiontv', 'novosti24', 'infoportal', 'presscentr',
  'muzey', 'teatr', 'kino', 'filarmoniya', 'opera', 'balet', 'galereya', 'vystavka', 'biblioteka', 'arhiv',
  'kultura', 'iskusstvo', 'hudozhnik', 'artist', 'festival', 'koncert', 'cirk', 'planetariy', 'ermitazh', 'tretyakovka',
  'kosmos', 'astro', 'planeta', 'priroda', 'ekologiya', 'geologiya', 'biologiya', 'himiya', 'fizika', 'meteo',
  'pogoda', 'okean', 'zapovednik', 'zoopark', 'akvarium', 'botanika', 'arheologiya', 'observatoriya', 'laboratoriya', 'institutran',
  'sport', 'futbol', 'hokkey', 'basket', 'tennis', 'shahmaty', 'fitnes', 'stadion', 'olimp', 'chempion',
  'sportklub', 'turnir', 'basseyn', 'lyzhi', 'velo', 'atletika', 'match', 'arena', 'dinamo', 'sparta',
  'gorod', 'region', 'oblast', 'sever', 'yug', 'vostok', 'zapad', 'sibir', 'ural', 'altay',
  'baykal', 'volga', 'kavkaz', 'kamchatka', 'kareliya', 'stolica', 'kray', 'poselok', 'rayon', 'zemlya',
  'magazin', 'market', 'shop', 'torg', 'tovar', 'zakaz', 'dostavka', 'apteka', 'knigi', 'mebel',
  'tehnika', 'produkty', 'remont', 'stroy', 'avto', 'moto', 'turizm', 'otel', 'kafe', 'restoran',
  'bank', 'pochta', 'svyaz', 'telekom', 'provider', 'hosting', 'servis', 'master', 'salon', 'agentstvo',
  'comp', 'computer', 'soft', 'program', 'code', 'web', 'net', 'site', 'server', 'data',
  'info', 'cloud', 'robot', 'chip', 'byte', 'pixel', 'digital', 'online', 'portal', 'sistema',
  'mir', 'svet', 'zvezda', 'raduga', 'orbita', 'vektor', 'gorizont', 'kompas', 'most', 'mayak',
  'parus', 'feniks', 'alfa', 'omega', 'delta', 'sputnik', 'rassvet', 'istok', 'rodnik', 'prostor'
];

export const ZONES: string[] = [
  'ru', 'com', 'net', 'org', 'edu', 'info', 'biz', 'su', 'gov', 'pro',
  'name', 'mil', 'int', 'by', 'kz', 'ua', 'am', 'ge', 'uz', 'md',
  'de', 'fr', 'uk', 'it', 'es', 'pl', 'fi', 'se', 'no', 'cz',
  'nl', 'be', 'at', 'ch', 'us', 'ca', 'au', 'jp', 'cn', 'kr',
  'in', 'br', 'tr', 'gr', 'eg', 'online', 'site', 'shop', 'store', 'tech',
  'club', 'space', 'cloud', 'media', 'news', 'art', 'life', 'blog', 'wiki', 'team',
  'school', 'agency', 'studio', 'design', 'top', 'xyz', 'museum', 'travel', 'aero', 'coop',
  'jobs', 'mobi', 'tv', 'fm', 'cc', 'io'
];

export const PROTOCOLS: string[] = [
  'http', 'https', 'ftp', 'file', 'sftp', 'ftps', 'smb', 'telnet', 'ssh'
];

export const DIRS: string[] = [
  'files', 'docs', 'images', 'img', 'pics', 'photo', 'video', 'audio', 'music', 'media',
  'downloads', 'upload', 'data', 'archive', 'backup', 'public', 'private', 'user', 'users', 'admin',
  'temp', 'content', 'static', 'assets', 'pages', 'news', 'blog', 'catalog', 'shop', 'store',
  'help', 'about', 'info', 'lib', 'src', 'bin', 'cgi', 'forum', 'gallery', 'test',
  'dokumenty', 'doklady', 'referaty', 'konspekty', 'uroki', 'lekcii', 'zadaniya', 'testy', 'uchebniki', 'metodika',
  'biblioteka', 'chitalka', 'arhiv', 'spravka', 'blanki', 'obrazcy', 'otchety', 'prikazy', 'raspisanie', 'foto',
  'fotoalbom', 'kartinki', 'risunki', 'galereya', 'oboi', 'ikonki', 'portrety', 'peyzazhi', 'priroda', 'zhivotnye',
  'cvety', 'kosmos', 'gorod', 'puteshestviya', 'prazdniki', 'vypusknoy', 'shkola', 'sport', 'muzyka', 'pesni',
  'treki', 'albomy', 'klipy', 'filmy', 'multfilmy', 'kino', 'koncerty', 'zapisi', 'radio', 'podkasty',
  'zvuki', 'melodii', 'videouroki', 'hronika', 'sorevnovaniya', 'proekty', 'portfolio', 'kollekcii', 'materialy', 'resursy',
  'programmy', 'soft', 'igry', 'shablony', 'shrifty', 'karty', 'shemy', 'chertezhi', 'tablicy', 'raschety',
  'kabinet', 'klass9', 'kafedra', 'otdel', 'filial'
];

export const DIRS_DATED: string[] = [
  'arhiv2023', 'arhiv2024', 'god2025', 'yanvar', 'fevral', 'mart', 'aprel', 'may',
  'iyun', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr', 'zima', 'vesna', 'leto', 'osen',
  'kvartal1', 'semestr2'
];

export const MAIL_DOMAINS: string[] = [
  'mail.ru', 'yandex.ru', 'ya.ru', 'gmail.com', 'rambler.ru', 'list.ru', 'inbox.ru', 'bk.ru',
  'internet.ru', 'mail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com',
  'aol.com', 'proton.me', 'gmx.net', 'tut.by', 'ukr.net', 'school.ru', 'shkola.ru', 'gimnaziya.ru',
  'licey.ru', 'kolledzh.ru', 'universitet.ru', 'institut.ru', 'kafedra.ru', 'dekanat.ru', 'biblioteka.ru',
  'muzey.ru', 'teatr.ru', 'zavod.ru', 'fabrika.ru', 'firma.ru', 'kompaniya.ru', 'office.ru',
  'korporaciya.ru', 'holding.ru', 'agentstvo.ru', 'redakciya.ru', 'gazeta.ru', 'bank.ru', 'klinika.ru',
  'apteka.ru', 'magazin.ru', 'market.ru', 'servis.ru', 'studio.ru', 'klub.ru'
];

export const MAIL_LOGINS: string[] = [
  'info', 'mail', 'post', 'box', 'admin', 'office', 'direktor', 'sekretar', 'priemnaya',
  'buhgalteriya', 'otdelkadrov', 'support', 'help', 'contact', 'zakaz', 'sales', 'press',
  'webmaster', 'student', 'uchitel'
];

export const INTRO_TEMPLATES_URL: string[] = [
  'Доступ к файлу {file}, находящемуся на сервере {server}, осуществляется по протоколу {protocol}.',
  'Файл {file} расположен на сервере {server}, доступ к нему выполняется по протоколу {protocol}.',
  'На сервере {server} размещён файл {file}, доступ к которому осуществляется по протоколу {protocol}.',
  'Файл {file} хранится на сервере {server} и доступен по протоколу {protocol}.'
];

export const INTRO_TEMPLATES_MAIL: string[] = [
  'Почтовый ящик {login} находится на сервере {server}.',
  'На сервере {server} зарегистрирован почтовый ящик {login}.',
  'Электронный почтовый ящик {login} расположен на сервере {server}.',
  'Пользователь завёл почтовый ящик {login} на сервере {server}.'
];

export const MOVE_TEMPLATES: string[] = [
  'Файл {file} перенесли из корневого каталога сервера {server} в подкаталог {dir}. Доступ к файлу осуществляется по протоколу {protocol}.',
  'Файл {file} перенесли из каталога {dir1} в каталог {dir2} на том же сервере {server}. Доступ к файлу осуществляется по протоколу {protocol}.',
  'На сервере {server} создали каталог {dir} и переместили в него файл {file}. Доступ к файлу осуществляется по протоколу {protocol}.',
  'Сайт перенесли на новый сервер {server}, и файл {file} теперь хранится в каталоге {dir}. Доступ к новому адресу выполняется по протоколу {protocol}.',
  'Файл {file} на сервере {server} переместили из подкаталога {dir2}, находившегося в каталоге {dir1}, на один уровень выше — в каталог {dir1}. Доступ к файлу осуществляется по протоколу {protocol}.',
  'Каталог {dir1} на сервере {server}, в котором находился файл {file}, переименовали в {dir2}. Доступ к обновлённому адресу выполняется по протоколу {protocol}.',
  'В каталоге {dir1} сервера {server} создали подкаталог {dir2} и переместили в него файл {file}. Доступ к файлу осуществляется по протоколу {protocol}.',
  'Файл {file} переместили из корневого каталога сервера {server} в каталог {dir2}, вложенный в каталог {dir1}. Доступ к новому адресу осуществляется по протоколу {protocol}.',
  'Файл {file} находился в каталоге {dir1} на сервере {server}, но после реорганизации его перенесли в корневой каталог этого же сервера. Доступ к файлу осуществляется по протоколу {protocol}.',
  'Протокол доступа к файлу {file} на сервере {server} в каталоге {dir} изменили на {protocol}.',
  'Файл {file} выложили на веб-узел {server} в каталог {dir}. Доступ к размещённому файлу осуществляется по протоколу {protocol}.',
  'Хостинг-провайдер обновил структуру сайта: файл {file} перенесён в подкаталог {dir2} каталога {dir1} на веб-узле {server}. Доступ к нему осуществляется по протоколу {protocol}.',
  'Файл {file} выложили на веб-узел {server} в каталог {dir1}. Доступ к новому адресу выполняется по протоколу {protocol}.',
  'На хостинге домена {server} создали раздел {dir2}, куда переместили файл {file}. Доступ к объекту осуществляется по протоколу {protocol}.'
];
