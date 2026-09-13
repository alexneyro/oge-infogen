// Правило трансформации текстов: либо transformCode над каноническим русским текстом, либо хелперы от transformDir, но не оба сразу.

import { Dir } from './types';
import { TransformId, transformDir, transformCode } from './transform';
import { SNAKE_SEGMENTS } from './field';

export function sideWord(d: Dir): 'ниже' | 'выше' | 'левее' | 'правее' {
  switch (d) {
    case 'down':
      return 'ниже';
    case 'up':
      return 'выше';
    case 'left':
      return 'левее';
    case 'right':
      return 'правее';
  }
}

export function oppositeDir(d: Dir): Dir {
  switch (d) {
    case 'up':
      return 'down';
    case 'down':
      return 'up';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
  }
}

export function moveWord(d: Dir): 'вверх' | 'вниз' | 'влево' | 'вправо' {
  switch (d) {
    case 'up':
      return 'вверх';
    case 'down':
      return 'вниз';
    case 'left':
      return 'влево';
    case 'right':
      return 'вправо';
  }
}

export function condWord(d: Dir): 'сверху' | 'снизу' | 'слева' | 'справа' {
  switch (d) {
    case 'up':
      return 'сверху';
    case 'down':
      return 'снизу';
    case 'left':
      return 'слева';
    case 'right':
      return 'справа';
  }
}

export function axisNom(d: Dir): 'горизонтальная' | 'вертикальная' {
  return d === 'up' || d === 'down' ? 'горизонтальная' : 'вертикальная';
}

export function axisGen(d: Dir): 'горизонтальной' | 'вертикальной' {
  return d === 'up' || d === 'down' ? 'горизонтальной' : 'вертикальной';
}

export function axisPluralIns(d: Dir): 'горизонтальными' | 'вертикальными' {
  return d === 'up' || d === 'down' ? 'горизонтальными' : 'вертикальными';
}

export function axisAdjIns(d: Dir): 'вертикальным' | 'горизонтальным' {
  return d === 'right' || d === 'left' ? 'вертикальным' : 'горизонтальным';
}

export function axisAdjGenPl(d: Dir): 'вертикальных' | 'горизонтальных' {
  return d === 'right' || d === 'left' ? 'вертикальных' : 'горизонтальных';
}

export function axisAdjPl(d: Dir): 'вертикальными' | 'горизонтальными' {
  return d === 'right' || d === 'left' ? 'вертикальными' : 'горизонтальными';
}

export function endGen(d: Dir): 'левого' | 'правого' | 'верхнего' | 'нижнего' {
  switch (d) {
    case 'left':
      return 'левого';
    case 'right':
      return 'правого';
    case 'down':
      return 'нижнего';
    case 'up':
      return 'верхнего';
  }
}

export const endWord = endGen;

export function endNom(d: Dir): 'левый' | 'правый' | 'верхний' | 'нижний' {
  switch (d) {
    case 'left':
      return 'левый';
    case 'right':
      return 'правый';
    case 'down':
      return 'нижний';
    case 'up':
      return 'верхний';
  }
}

export function endIns(d: Dir): 'левым' | 'правым' | 'верхним' | 'нижним' {
  switch (d) {
    case 'left':
      return 'левым';
    case 'right':
      return 'правым';
    case 'down':
      return 'нижним';
    case 'up':
      return 'верхним';
  }
}

export function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dirPairWord(dRise: Dir, dStep: Dir): string {
  const dirToStr = (d: Dir) => {
    switch (d) {
      case 'up':
        return 'вверх';
      case 'down':
        return 'вниз';
      case 'left':
        return 'влево';
      case 'right':
        return 'вправо';
    }
  };
  return `${dirToStr(dRise)} и ${dirToStr(dStep)}`;
}

export function startLevelWord(dStartLevel: Dir): 'верхней' | 'нижней' | 'левой' | 'правой' {
  switch (dStartLevel) {
    case 'down':
      return 'нижней';
    case 'up':
      return 'верхней';
    case 'left':
      return 'левой';
    case 'right':
      return 'правой';
  }
}

export const startStepPosWord = startLevelWord;
export const wallAdjGen = startLevelWord;

// Семейство 1: hwall-gap
export function hwallGapUnderLeftStatement(t: TransformId): string {
  const dWall = transformDir('down', t);
  const dAlong = transformDir('left', t);
  const dStart = transformDir('left', t);
  return `На бесконечном поле есть ${axisNom(dWall)} стена. Длина стены неизвестна. В стене есть ровно один проход, точное место прохода и его ширина неизвестны. Робот находится в клетке, расположенной непосредственно ${sideWord(dWall)} ${axisGen(dWall)} стены у её ${endWord(dStart)} конца. Напишите алгоритм, закрашивающий все клетки, расположенные непосредственно ${sideWord(dWall)} ${axisGen(dWall)} стены ${sideWord(dAlong)} прохода. Робот должен закрасить только клетки, удовлетворяющие данному условию.`;
}

export function dirFromRobotWord(d: Dir): 'справа' | 'слева' | 'сверху' | 'снизу' {
  switch (d) {
    case 'right':
      return 'справа';
    case 'left':
      return 'слева';
    case 'up':
      return 'сверху';
    case 'down':
      return 'снизу';
  }
}

export function moveVerbImperative(d: Dir): string {
  switch (d) {
    case 'right':
      return 'шагните вправо';
    case 'left':
      return 'шагните влево';
    case 'up':
      return 'поднимитесь вверх';
    case 'down':
      return 'спуститесь вниз';
  }
}

export function riseVerbImperative(d: Dir): string {
  switch (d) {
    case 'up':
      return 'поднимитесь';
    case 'down':
      return 'спуститесь';
    case 'right':
      return 'шагните вправо';
    case 'left':
      return 'шагните влево';
  }
}

export function riseVerbInfinitive(d: Dir): string {
  switch (d) {
    case 'up':
      return 'подняться';
    case 'down':
      return 'спуститься';
    case 'right':
      return 'шагнуть вправо';
    case 'left':
      return 'шагнуть влево';
  }
}

export function hwallGapUnderLeftHint(t: TransformId): string {
  return transformCode(
    'Двигайтесь вправо вдоль стены, закрашивая клетки на каждом шаге. Остановитесь, как только стена сверху закончится.',
    t
  );
}

export function hwallGapOnlyStatement(t: TransformId): string {
  const dWall = transformDir('down', t);
  const dStart = transformDir('left', t);
  return `На бесконечном поле есть ${axisNom(dWall)} стена. Длина стены неизвестна. В стене есть ровно один проход, точное место прохода и его ширина неизвестны. Робот находится в клетке, расположенной непосредственно ${sideWord(dWall)} ${axisGen(dWall)} стены у её ${endWord(dStart)} конца. Напишите алгоритм, закрашивающий только клетки прохода в ${axisGen(dWall)} стене. Робот должен закрасить только клетки, удовлетворяющие данному условию.`;
}

export function hwallGapOnlyHint(t: TransformId): string {
  return transformCode(
    'Сначала пройдите вправо вдоль стены до места, где она обрывается, ничего не закрашивая. Затем закрашивайте клетки, пока стена сверху не появится снова.',
    t
  );
}

export function hwallGapBothSidesLeftStatement(t: TransformId): string {
  const dWall = transformDir('down', t);
  const dOppWall = transformDir('up', t);
  const dAlong = transformDir('left', t);
  const dStart = transformDir('left', t);
  return `На бесконечном поле есть ${axisNom(dWall)} стена. Длина стены неизвестна. В стене есть ровно один проход, точное место прохода и его ширина неизвестны. Робот находится в клетке, расположенной непосредственно ${sideWord(dWall)} ${axisGen(dWall)} стены у её ${endWord(dStart)} конца. Напишите алгоритм, закрашивающий все клетки, расположенные непосредственно ${sideWord(dWall)} ${axisGen(dWall)} стены ${sideWord(dAlong)} прохода, а также все клетки, расположенные непосредственно ${sideWord(dOppWall)} ${axisGen(dWall)} стены ${sideWord(dAlong)} прохода. Робот должен пройти через проход и закрасить только указанные клетки.`;
}

export function hwallGapBothSidesLeftHint(t: TransformId): string {
  return transformCode(
    'Сначала пройдите вправо вдоль стены, закрашивая клетки до прохода. Затем перейдите через проход вверх и двигайтесь влево с противоположной стороны стены, закрашивая клетки, пока снизу есть стена.',
    t
  );
}

export function hwallGapAboveLeftStatement(t: TransformId): string {
  const dWall = transformDir('down', t);
  const dOppWall = transformDir('up', t);
  const dAlong = transformDir('left', t);
  const dStart = transformDir('left', t);
  return `На бесконечном поле есть ${axisNom(dWall)} стена. Длина стены неизвестна. В стене есть ровно один проход, точное место прохода и его ширина неизвестны. Робот находится в клетке, расположенной непосредственно ${sideWord(dWall)} ${axisGen(dWall)} стены у её ${endWord(dStart)} конца. Напишите алгоритм, закрашивающий все клетки, расположенные непосредственно ${sideWord(dOppWall)} ${axisGen(dWall)} стены ${sideWord(dAlong)} прохода. Клетки ${sideWord(dWall)} стены должны остаться незакрашенными.`;
}

export function hwallGapAboveLeftHint(t: TransformId): string {
  return transformCode(
    'Обогните край стены с торца (шаг влево, вверх и вправо). Затем двигайтесь вправо, закрашивая клетки с противоположной стороны стены, пока стена снизу не закончится.',
    t
  );
}

// Семейство hwall-gap-mid
export function hwallGapMidUnderToGapStatement(t: TransformId): string {
  const dWall = transformDir('down', t);
  const dAlong = transformDir('right', t);
  return `На бесконечном поле есть ${axisNom(dWall)} стена. Длина стены неизвестна. В стене есть ровно один проход, точное место прохода и его ширина неизвестны. Робот находится в клетке, расположенной непосредственно ${sideWord(dWall)} ${axisGen(dWall)} стены. Проход находится ${dirFromRobotWord(dAlong)} от Робота. Напишите алгоритм, закрашивающий все клетки, расположенные непосредственно ${sideWord(dWall)} ${axisGen(dWall)} стены от Робота до прохода. Проход должен остаться незакрашенным.`;
}

export function hwallGapMidUnderToGapHint(t: TransformId): string {
  return transformCode(
    'Двигайтесь вправо вдоль стены, закрашивая клетки на каждом шаге. Остановитесь, как только стена сверху закончится.',
    t
  );
}

export function hwallGapMidGapOnlyStatement(t: TransformId): string {
  const dWall = transformDir('down', t);
  const dAlong = transformDir('right', t);
  return `На бесконечном поле есть ${axisNom(dWall)} стена. Длина стены неизвестна. В стене есть ровно один проход, точное место прохода и его ширина неизвестны. Робот находится в клетке, расположенной непосредственно ${sideWord(dWall)} ${axisGen(dWall)} стены. Проход находится ${dirFromRobotWord(dAlong)} от Робота. Напишите алгоритм, закрашивающий только клетки прохода в ${axisGen(dWall)} стене. Все остальные клетки должны остаться незакрашенными.`;
}

export function hwallGapMidGapOnlyHint(t: TransformId): string {
  return transformCode(
    'Сначала пройдите вправо вдоль стены до места, где она обрывается, ничего не закрашивая. Затем закрашивайте клетки, пока стена сверху не появится снова.',
    t
  );
}

// Семейство hwall-cross
export function hwallCrossStatement(t: TransformId): string {
  const dWall = transformDir('down', t);
  const dOppWall = transformDir('up', t);
  const dGap = transformDir('right', t);
  return `На бесконечном поле есть ${axisNom(dWall)} стена. Длина стены неизвестна. В стене есть ровно один проход, точное место прохода и его ширина неизвестны. Робот находится в клетке, расположенной непосредственно ${sideWord(dWall)} ${axisGen(dWall)} стены, не у её конца и не рядом с проходом. Проход находится ${dirFromRobotWord(dGap)} от Робота. Напишите алгоритм, закрашивающий все клетки, расположенные непосредственно ${sideWord(dOppWall)} ${axisGen(dWall)} стены от прохода до её дальнего конца. Все остальные клетки должны остаться незакрашенными.`;
}

export function hwallCrossHint(t: TransformId): string {
  return transformCode(
    'Двигайтесь вправо вдоль стены до прохода. Перейдите через проход вверх на противоположную сторону стены. Затем двигайтесь вправо, закрашивая клетки вдоль стены до её конца.',
    t
  );
}

export function hwallCrossNearStatement(t: TransformId): string {
  const dWall = transformDir('down', t);
  const dOppWall = transformDir('up', t);
  const dGap = transformDir('right', t);
  return `На бесконечном поле есть ${axisNom(dWall)} стена. Длина стены неизвестна. В стене есть ровно один проход, точное место прохода и его ширина неизвестны. Робот находится в клетке, расположенной непосредственно ${sideWord(dWall)} ${axisGen(dWall)} стены, не у её конца и не рядом с проходом. Проход находится ${dirFromRobotWord(dGap)} от Робота. Напишите алгоритм, закрашивающий все клетки, расположенные непосредственно ${sideWord(dOppWall)} ${axisGen(dWall)} стены на участке от прохода до её ближнего конца (со стороны стартовой позиции Робота). Все остальные клетки (включая клетки за проходом у дальнего конца) должны остаться незакрашенными.`;
}

export function hwallCrossNearHint(t: TransformId): string {
  return transformCode(
    'Двигайтесь вправо вдоль стены до прохода. Перейдите через проход вверх на противоположную сторону стены. Затем поверните назад и двигайтесь влево, закрашивая клетки вдоль стены до её ближнего конца.',
    t
  );
}

// Семейство 2: corner-gap
export function cornerGapUnderCornerStatement(t: TransformId): string {
  const dWall1 = transformDir('down', t);
  const dWall2 = transformDir('left', t);
  const dAlong1 = transformDir('right', t);
  const dStart1 = transformDir('left', t);
  return `На бесконечном поле есть ${axisNom(dWall1)} и ${axisNom(dWall2)} стены. ${capitalize(endNom(dAlong1))} конец ${axisGen(dWall1)} стены соединён с ${endIns(transformDir('up', t))} концом ${axisGen(dWall2)} стены. Длины стен неизвестны. В ${axisGen(dWall1)} стене есть ровно один проход, точное место прохода и его ширина неизвестны. Робот находится в клетке, расположенной непосредственно ${sideWord(dWall1)} ${axisGen(dWall1)} стены у её ${endWord(dStart1)} конца. Напишите алгоритм, закрашивающий все клетки, расположенные непосредственно ${sideWord(dWall1)} ${axisGen(dWall1)} стены и ${sideWord(dWall2)} ${axisGen(dWall2)} стены. Проход должен остаться незакрашенным.`;
}

export function cornerGapUnderCornerHint(t: TransformId): string {
  return transformCode(
    'Пройдите вправо до второй стены, закрашивая клетки только при наличии стены сверху. У угла поверните и двигайтесь вниз, закрашивая все клетки вдоль второй стены.',
    t
  );
}

export function cornerGapOnlyStatement(t: TransformId): string {
  const dWall1 = transformDir('down', t);
  const dWall2 = transformDir('left', t);
  const dAlong1 = transformDir('right', t);
  const dStart1 = transformDir('left', t);
  return `На бесконечном поле есть ${axisNom(dWall1)} и ${axisNom(dWall2)} стены. ${capitalize(endNom(dAlong1))} конец ${axisGen(dWall1)} стены соединён с ${endIns(transformDir('up', t))} концом ${axisGen(dWall2)} стены. Длины стен неизвестны. В ${axisGen(dWall1)} стене есть ровно один проход, точное место прохода и его ширина неизвестны. Робот находится в клетке, расположенной непосредственно ${sideWord(dWall1)} ${axisGen(dWall1)} стены у её ${endWord(dStart1)} конца. Напишите алгоритм, закрашивающий только клетки прохода в ${axisGen(dWall1)} стене. Все остальные клетки должны остаться незакрашенными.`;
}

export function cornerGapOnlyHint(t: TransformId): string {
  return transformCode(
    'Пройдите вправо вдоль стены до прохода, ничего не закрашивая. Затем закрашивайте клетки, пока стена сверху не появится снова.',
    t
  );
}

// Семейство 3: fipi-classic
export function fipiClassicUnderCornerGapsStatement(t: TransformId): string {
  const dWall1 = transformDir('down', t);
  const dWall2 = transformDir('left', t);
  const dAlong1 = transformDir('right', t);
  const dStart1 = transformDir('left', t);
  return `На бесконечном поле есть ${axisNom(dWall1)} и ${axisNom(dWall2)} стены. ${capitalize(endNom(dAlong1))} конец ${axisGen(dWall1)} стены соединён с ${endIns(transformDir('up', t))} концом ${axisGen(dWall2)} стены. Длины стен неизвестны. В каждой стене есть ровно один проход, точные места проходов и их ширина неизвестны. Робот находится в клетке, расположенной непосредственно ${sideWord(dWall1)} ${axisGen(dWall1)} стены у её ${endWord(dStart1)} конца. Напишите алгоритм, закрашивающий все клетки, расположенные непосредственно ${sideWord(dWall1)} ${axisGen(dWall1)} стены и ${sideWord(dWall2)} ${axisGen(dWall2)} стены. Проходы должны остаться незакрашенными.`;
}

export function fipiClassicUnderCornerGapsHint(t: TransformId): string {
  return transformCode(
    'Двигайтесь вправо до угла, закрашивая клетки только при наличии стены сверху. Затем поверните и идите вниз, закрашивая клетки только там, где справа есть стена.',
    t
  );
}

export function fipiClassicGapsOnlyStatement(t: TransformId): string {
  const dWall1 = transformDir('down', t);
  const dWall2 = transformDir('left', t);
  const dAlong1 = transformDir('right', t);
  const dStart1 = transformDir('left', t);
  return `На бесконечном поле есть ${axisNom(dWall1)} и ${axisNom(dWall2)} стены. ${capitalize(endNom(dAlong1))} конец ${axisGen(dWall1)} стены соединён с ${endIns(transformDir('up', t))} концом ${axisGen(dWall2)} стены. Длины стен неизвестны. В каждой стене есть ровно один проход, точные места проходов и их ширина неизвестны. Робот находится в клетке, расположенной непосредственно ${sideWord(dWall1)} ${axisGen(dWall1)} стены у её ${endWord(dStart1)} конца. Напишите алгоритм, закрашивающий только клетки обоих проходов. Все остальные клетки должны остаться незакрашенными.`;
}

export function fipiClassicGapsOnlyHint(t: TransformId): string {
  return transformCode(
    'Пройдите вправо до первого прохода, закрасьте его клетки и дойдите до угла. Затем поверните вниз, дойдите до второго прохода и закрасьте его клетки.',
    t
  );
}

// Семейство 4: stairs
export function stairsAllStepsStatement(t: TransformId): string {
  const dStep = transformDir('right', t);
  const dRise = transformDir('up', t);
  const dStartStep = transformDir('left', t);
  const dStartLevel = transformDir('down', t);
  return `На бесконечном поле есть лестница, ведущая ${dirPairWord(dRise, dStep)}. Количество ступеней и ширина каждой ступени неизвестны, высота каждой ступени равна одной клетке. Робот находится на ${startStepPosWord(dStartStep)} клетке ${startLevelWord(dStartLevel)} ступени. Напишите алгоритм, закрашивающий все клетки, расположенные непосредственно на ступенях лестницы. Робот должен закрасить только клетки, удовлетворяющие данному условию.`;
}

export function stairsAllStepsHint(t: TransformId): string {
  const dStep = transformDir('right', t);
  const dRise = transformDir('up', t);
  return `Идите по ступени ${moveWord(dStep)}, закрашивая клетки, пока не упрётесь в уступ. Затем ${riseVerbImperative(dRise)} и ${moveVerbImperative(dStep)} на следующую ступень, повторяя это до конца лестницы.`;
}

export function stairsStepCornersStatement(t: TransformId): string {
  const dStep = transformDir('right', t);
  const dRise = transformDir('up', t);
  const dStartStep = transformDir('left', t);
  const dStartLevel = transformDir('down', t);
  return `На бесконечном поле есть лестница, ведущая ${dirPairWord(dRise, dStep)}. Количество ступеней и ширина каждой ступени неизвестны, высота каждой ступени равна одной клетке. Робот находится на ${startStepPosWord(dStartStep)} клетке ${startLevelWord(dStartLevel)} ступени. Напишите алгоритм, закрашивающий только крайние клетки ступеней перед ${axisAdjIns(dStep)} уступом. Клетки на последней ступени закрашивать не нужно.`;
}

export function stairsStepCornersHint(t: TransformId): string {
  const dStep = transformDir('right', t);
  const dRise = transformDir('up', t);
  return `Идите по ступени ${moveWord(dStep)} без закрашивания до уступа. Закрасьте клетку перед уступом, затем ${riseVerbImperative(dRise)} и ${moveVerbImperative(dStep)} на следующую ступень.`;
}

// Семейство 5: room
export function roomPerimeterStatement(_t: TransformId): string {
  return 'На бесконечном поле есть прямоугольная комната, огороженная со всех сторон стенами. Размеры комнаты неизвестны, выходов из неё нет. Робот находится где-то внутри комнаты, его точное положение неизвестно. Напишите алгоритм, закрашивающий все клетки, примыкающие к стенам комнаты изнутри, то есть весь внутренний периметр. Клетки в середине комнаты закрашивать нельзя.';
}

export function roomPerimeterHint(t: TransformId): string {
  return transformCode(
    'Сначала перейдите в заведомо известный угол, двигаясь до упора влево и вниз. Затем обойдите комнату по периметру вдоль стен, закрашивая каждую примыкающую клетку.',
    t
  );
}

export function roomCornersStatement(_t: TransformId): string {
  return 'На бесконечном поле есть прямоугольная комната, огороженная со всех сторон стенами. Размеры комнаты неизвестны, выходов из неё нет. Робот находится где-то внутри комнаты, его точное положение неизвестно. Напишите алгоритм, закрашивающий только четыре угловые клетки комнаты. Остальные клетки должны остаться незакрашенными.';
}

export function roomCornersHint(t: TransformId): string {
  return transformCode(
    'Перейдите в первый угол, двигаясь до упора влево и вниз, и закрасьте его. Затем обходите стены комнаты от угла к углу, закрашивая только угловые клетки.',
    t
  );
}

// Семейство 6: corridor
export function corridorAllStatement(t: TransformId): string {
  const dWall = transformDir('up', t);
  const dStart = transformDir('left', t);
  const posWord = startStepPosWord(dStart);
  return `На бесконечном поле есть коридор, образованный двумя параллельными ${axisPluralIns(dWall)} стенами. Длина коридора неизвестна. Робот находится в ${posWord} клетке коридора. Напишите алгоритм, закрашивающий все клетки внутри коридора. Все остальные клетки должны остаться незакрашенными.`;
}

export function corridorAllHint(t: TransformId): string {
  return transformCode(
    'Двигайтесь вправо вдоль коридора, закрашивая каждую клетку, пока не дойдёте до стены в конце коридора.',
    t
  );
}

export function corridorEndsStatement(t: TransformId): string {
  const dWall = transformDir('up', t);
  const dStart = transformDir('left', t);
  const posWord = startStepPosWord(dStart);
  return `На бесконечном поле есть коридор, образованный двумя параллельными ${axisPluralIns(dWall)} стенами. Длина коридора неизвестна. Робот находится в ${posWord} клетке коридора. Напишите алгоритм, закрашивающий только первую и последнюю клетки коридора. Все остальные клетки должны остаться незакрашенными.`;
}

export function corridorEndsHint(t: TransformId): string {
  return transformCode(
    'Закрасьте первую клетку, затем пройдите без закрашивания вправо до стены в конце коридора и закрасьте последнюю клетку.',
    t
  );
}

// Семейство corridor-mid
export function corridorMidBothEndsStatement(t: TransformId): string {
  const dWall = transformDir('up', t);
  return `На бесконечном поле есть коридор, образованный двумя параллельными ${axisPluralIns(dWall)} стенами. Длина коридора неизвестна. Робот находится внутри коридора, не у его концов. Напишите алгоритм, закрашивающий только первую и последнюю (крайние) клетки коридора. Все остальные клетки должны остаться незакрашенными.`;
}

export function corridorMidBothEndsHint(t: TransformId): string {
  return transformCode(
    'Пройдите без закрашивания влево до стены и закрасьте крайнюю клетку. Затем пройдите без закрашивания вправо до противоположной стены и закрасьте вторую крайнюю клетку.',
    t
  );
}

export function corridorMidAllFromMidStatement(t: TransformId): string {
  const dWall = transformDir('up', t);
  return `Робот находится внутри коридора из ${axisPluralIns(dWall)} стен, не у его концов. Длина коридора неизвестна. Напишите алгоритм, закрашивающий все клетки коридора от одного конца до другого.`;
}

export function corridorMidAllFromMidHint(t: TransformId): string {
  return transformCode(
    'Пройдите без закрашивания влево до стены у одного конца коридора. Затем двигайтесь вправо к противоположному концу коридора, закрашивая каждую клетку.',
    t
  );
}

// Семейство 7: multi-gap-wall
export function multiGapWallUnderGapsStatement(t: TransformId): string {
  const dWall = transformDir('down', t);
  const dStart = transformDir('left', t);
  const dAlong = transformDir('right', t);
  return `На бесконечном поле есть ${axisNom(dWall)} стена. Длина стены неизвестна. В стене есть несколько проходов; количество проходов, их ширина и расположение неизвестны. Ни один проход не касается концов стены. У ${endGen(dAlong)} конца стены находится перпендикулярная ${axisNom(dAlong)} стена, ограничивающая движение. Робот находится в клетке, расположенной непосредственно ${sideWord(dWall)} ${axisGen(dWall)} стены у её ${endWord(dStart)} конца. Напишите алгоритм, закрашивающий все клетки, расположенные непосредственно ${sideWord(dWall)} проходов в стене. Клетки под сплошными участками стены должны остаться незакрашенными.`;
}

export function multiGapWallUnderGapsHint(t: TransformId): string {
  return transformCode(
    'Пройдите вдоль стены до ограничителя с помощью цикла «нц пока справа свободно». На каждом шаге проверяйте условие «если не сверху стена»: если проход — закрашивайте клетку, затем делайте шаг вправо.',
    t
  );
}

export function multiGapWallUnderWallStatement(t: TransformId): string {
  const dWall = transformDir('down', t);
  const dStart = transformDir('left', t);
  const dAlong = transformDir('right', t);
  return `На бесконечном поле есть ${axisNom(dWall)} стена. Длина стены неизвестна. В стене есть несколько проходов; количество проходов, их ширина и расположение неизвестны. Ни один проход не касается концов стены. У ${endGen(dAlong)} конца стены находится перпендикулярная ${axisNom(dAlong)} стена, ограничивающая движение. Робот находится в клетке, расположенной непосредственно ${sideWord(dWall)} ${axisGen(dWall)} стены у её ${endWord(dStart)} конца. Напишите алгоритм, закрашивающий все клетки, расположенные непосредственно ${sideWord(dWall)} сплошных участков стены. Клетки под проходами должны остаться незакрашенными.`;
}

export function multiGapWallUnderWallHint(t: TransformId): string {
  return transformCode(
    'Пройдите вдоль стены до ограничителя с помощью цикла «нц пока справа свободно». На каждом шаге проверяйте условие «если сверху стена»: если сплошной участок — закрашивайте клетку, затем делайте шаг вправо. Не забудьте закрасить последнюю клетку перед ограничителем после выхода из цикла.',
    t
  );
}

// Семейство multi-gap-wall-barrier
export function multiGapWallBarrierUnderGapsStatement(t: TransformId): string {
  const dWall = transformDir('down', t);
  const dStart = transformDir('left', t);
  const dAlong = transformDir('right', t);
  return `На бесконечном поле есть ${axisNom(dWall)} стена. Длина стены неизвестна. В стене есть несколько проходов; количество проходов, их ширина и расположение неизвестны. Ни один проход не касается концов стены. На пути Робота расположена перпендикулярная перегородка неизвестной длины, примыкающая к стене ${condWord(dWall)}. У ${endGen(dAlong)} конца стены находится перпендикулярная стена, ограничивающая движение. Робот находится в клетке, расположенной непосредственно ${sideWord(dWall)} ${axisGen(dWall)} стены у её ${endWord(dStart)} конца. Напишите алгоритм, закрашивающий все клетки, расположенные непосредственно ${sideWord(dWall)} проходов в стене. Клетки под сплошными участками стены должны остаться незакрашенными.`;
}

export function multiGapWallBarrierUnderGapsHint(t: TransformId): string {
  return transformCode(
    'Используйте внешний цикл «нц пока сверху стена» для прохождения всей стены. Внутри используйте цикл «нц пока справа свободно» с проверкой «если не сверху стена» для закрашивания проходов. Обход перегородки выполняйте так: «пока справа стена» двигайтесь вниз, сделайте шаг вправо, двигайтесь вверх, а затем «пока сверху свободно и слева стена» двигайтесь к стене.',
    t
  );
}

export function multiGapWallBarrierUnderWallStatement(t: TransformId): string {
  const dWall = transformDir('down', t);
  const dStart = transformDir('left', t);
  const dAlong = transformDir('right', t);
  return `На бесконечном поле есть ${axisNom(dWall)} стена. Длина стены неизвестна. В стене есть несколько проходов; количество проходов, их ширина и расположение неизвестны. Ни один проход не касается концов стены. На пути Робота расположена перпендикулярная перегородка неизвестной длины, примыкающая к стене ${condWord(dWall)}. У ${endGen(dAlong)} конца стены находится перпендикулярная стена, ограничивающая движение. Робот находится в клетке, расположенной непосредственно ${sideWord(dWall)} ${axisGen(dWall)} стены у её ${endWord(dStart)} конца. Напишите алгоритм, закрашивающий все клетки, расположенные непосредственно ${sideWord(dWall)} сплошных участков стены. Клетки под проходами должны остаться незакрашенными.`;
}

export function multiGapWallBarrierUnderWallHint(t: TransformId): string {
  return transformCode(
    'Используйте внешний цикл «нц пока сверху стена» для прохождения всей стены. Внутри используйте цикл «нц пока справа свободно» с проверкой «если сверху стена» для закрашивания сплошных участков. Не забудьте закрасить последнюю клетку перед перегородкой или ограничителем. Обход перегородки выполняйте так: «пока справа стена» двигайтесь вниз, сделайте шаг вправо, двигайтесь вверх, а затем «пока сверху свободно и слева стена» двигайтесь к стене.',
    t
  );
}

// Семейство snake-wall
export function snakeWallMarkedSidesStatement(t: TransformId): string {
  const side1 = sideWord(transformDir(SNAKE_SEGMENTS[0].paintSide, t));
  const side2 = sideWord(transformDir(SNAKE_SEGMENTS[1].paintSide, t));
  const side4 = sideWord(transformDir(SNAKE_SEGMENTS[3].paintSide, t));
  const side5 = sideWord(transformDir(SNAKE_SEGMENTS[4].paintSide, t));
  return `На бесконечном поле расположена ломаная стена из пяти последовательных отрезков. Форма стены и начальное положение Робота показаны на рисунке; длины отрезков неизвестны и могут отличаться от изображённых, но каждый отрезок не короче двух клеток. Напишите алгоритм, закрашивающий клетки у отрезков стены: первого — ${side1}, второго — ${side2}, четвёртого — ${side4}, пятого — ${side5}. Вдоль третьего отрезка клетки закрашивать не нужно. Клетка на стыке двух закрашиваемых отрезков закрашивается один раз.`;
}

export function snakeWallMarkedSidesHint(t: TransformId): string {
  return transformCode(
    'Последовательно пройдите 5 циклов вдоль каждого из пяти отрезков стены: закрашивайте клетки вдоль 1-го, 2-го, 4-го и 5-го отрезков, а 3-й отрезок пройдите без закрашивания.',
    t
  );
}

export function snakeWallAllSidesStatement(t: TransformId): string {
  const side1 = sideWord(transformDir(SNAKE_SEGMENTS[0].paintSide, t));
  const side2 = sideWord(transformDir(SNAKE_SEGMENTS[1].paintSide, t));
  const side3 = sideWord(transformDir(SNAKE_SEGMENTS[2].paintSide, t));
  const side4 = sideWord(transformDir(SNAKE_SEGMENTS[3].paintSide, t));
  const side5 = sideWord(transformDir(SNAKE_SEGMENTS[4].paintSide, t));
  return `На бесконечном поле расположена ломаная стена из пяти последовательных отрезков. Форма стены и начальное положение Робота показаны на рисунке; длины отрезков неизвестны и могут отличаться от изображённых, но каждый отрезок не короче двух клеток. Напишите алгоритм, закрашивающий клетки у всех пяти отрезков стены: первого — ${side1}, второго — ${side2}, третьего — ${side3}, четвёртого — ${side4}, пятого — ${side5}. Клетка на стыке двух закрашиваемых отрезков закрашивается один раз.`;
}

export function snakeWallAllSidesHint(t: TransformId): string {
  return transformCode(
    'Последовательно пройдите 5 циклов вдоль каждого из пяти отрезков стены, закрашивая клетки вдоль всех пяти отрезков.',
    t
  );
}

// Семейство stairs-turn
export function stairsTurnAllStepsStatement(t: TransformId): string {
  const dFar = transformDir('right', t);
  return `На бесконечном поле есть двухмаршевая лестница (спуск и подъём). Высота и ширина каждой ступени равны одной клетке. Количество ступеней на спуске и на подъёме неизвестно. Робот находится на самой ${startLevelWord(transformDir('up', t))} ступени спуска. У ${endGen(dFar)} конца лестницы расположена ${axisNom(dFar)} стена, ограничивающая движение. Напишите алгоритм, закрашивающий все клетки, расположенные непосредственно на ступенях лестницы (включая площадку между спуском и подъёмом).`;
}

export function stairsTurnAllStepsHint(t: TransformId): string {
  return transformCode(
    'Сначала двигайтесь по ступеням вправо и вниз, закрашивая клетки, пока справа есть свободный путь. Затем двигайтесь по ступеням вверх и вправо, закрашивая клетки на каждом шаге, пока не достигнете конца лестницы.',
    t
  );
}

export function stairsTurnAscentOnlyStatement(t: TransformId): string {
  const dFar = transformDir('right', t);
  return `На бесконечном поле есть двухмаршевая лестница (спуск и подъём). Высота и ширина каждой ступени равны одной клетке. Количество ступеней на спуске и на подъёме неизвестно. Робот находится на самой ${startLevelWord(transformDir('up', t))} ступени спуска. У ${endGen(dFar)} конца лестницы расположена ${axisNom(dFar)} стена, ограничивающая движение. Напишите алгоритм, закрашивающий все клетки, расположенные непосредственно на ступенях подъёма (включая площадку между спуском и подъёмом). Клетки на ступенях спуска должны остаться незакрашенными.`;
}

export function stairsTurnAscentOnlyHint(t: TransformId): string {
  return transformCode(
    'Двигайтесь без закрашивания по ступеням вправо и вниз, пока путь вправо не преградит уступ. Затем двигайтесь по ступеням подъёма вверх и вправо, закрашивая клетки на каждой ступени (начиная с площадки).',
    t
  );
}

// Семейство stairs-turn-var
export function stairsTurnVarAllStepsStatement(t: TransformId): string {
  const dFar = transformDir('right', t);
  return `На бесконечном поле есть двухмаршевая лестница (спуск и подъём) с переменной высотой ступеней. Ширина каждой ступени равна одной клетке, а высота может составлять от 1 до нескольких клеток. Количество ступеней неизвестно. Робот находится на самой ${startLevelWord(transformDir('up', t))} ступени спуска. У ${endGen(dFar)} конца лестницы расположена ${axisNom(dFar)} стена, ограничивающая движение. Напишите алгоритм, закрашивающий опорные клетки всех ступеней спуска и подъёма (включая площадку между ними).`;
}

export function stairsTurnVarAllStepsHint(t: TransformId): string {
  return transformCode(
    'Используйте вложенные циклы: на спуске двигайтесь вниз до стены под ступенью и закрашивайте клетку, затем делайте шаг вправо. На подъёме двигайтесь вверх вдоль уступа циклом, пока справа есть стена, затем закрашивайте и переходите на следующую ступень.',
    t
  );
}

export function stairsTurnVarStepCornersStatement(t: TransformId): string {
  const dFar = transformDir('right', t);
  return `На бесконечном поле есть двухмаршевая лестница (спуск и подъём) с переменной высотой ступеней. Ширина каждой ступени равна одной клетке, а высота может составлять от 1 до нескольких клеток. Количество ступеней неизвестно. Робот находится на самой ${startLevelWord(transformDir('up', t))} ступени спуска. У ${endGen(dFar)} конца лестницы расположена ${axisNom(dFar)} стена, ограничивающая движение. Напишите алгоритм, закрашивающий только угловые клетки ступеней у основания ${axisAdjGenPl(dFar)} уступов.`;
}

export function stairsTurnVarStepCornersHint(t: TransformId): string {
  const d1 = transformDir('down', t);
  const d2 = transformDir('up', t);
  const dFar = transformDir('right', t);
  const v1 = riseVerbImperative(d1);
  const v2 = riseVerbImperative(d2);
  return `${capitalize(v1)} по ступеням и ${v2} по ним, закрашивая только клетки, непосредственно примыкающие к ${axisAdjIns(dFar)} стенам уступов.`;
}

export function stairsTurnVarAscentOnlyStatement(t: TransformId): string {
  const dFar = transformDir('right', t);
  return `На бесконечном поле есть двухмаршевая лестница (спуск и подъём) с переменной высотой ступеней. Ширина каждой ступени равна одной клетке, а высота может составлять от 1 до нескольких клеток. Количество ступеней неизвестно. Робот находится на самой ${startLevelWord(transformDir('up', t))} ступени спуска. У ${endGen(dFar)} конца лестницы расположена ${axisNom(dFar)} стена, ограничивающая движение. Напишите алгоритм, закрашивающий опорные клетки всех ступеней подъёма (включая площадку между спуском и подъёмом). Клетки ступеней спуска закрашивать не нужно.`;
}

export function stairsTurnVarAscentOnlyHint(t: TransformId): string {
  return transformCode(
    'Двигайтесь без закрашивания по ступеням спуска до площадки. Затем с помощью вложенного цикла двигайтесь по ступеням подъёма, закрашивая опорные клетки каждой ступени (начиная с площадки).',
    t
  );
}

// Семейство rect-outside
export function rectOutsideAroundWallStatement(t: TransformId): string {
  const dWall = transformDir('up', t);
  const dAlong = transformDir('right', t);
  return `На бесконечном поле расположена прямоугольная комната. Размеры комнаты неизвестны. В ${wallAdjGen(dWall)} стене есть проход. Робот находится снаружи у угла комнаты. Напишите алгоритм, закрашивающий все клетки снаружи вдоль стены от угла ${moveWord(dAlong)} до прохода. Проход и остальные клетки закрашивать не нужно.`;
}

export function rectOutsideAroundWallHint(t: TransformId): string {
  const dWall = transformDir('down', t);
  const dAlong = transformDir('right', t);
  return `Двигайтесь ${moveWord(dAlong)} вдоль стены, закрашивая каждую клетку, пока не дойдёте до прохода (когда ${dirFromRobotWord(dWall)} станет свободно).`;
}

export function rectOutsideAroundCornerToGapStatement(t: TransformId): string {
  const dWall1 = transformDir('up', t);
  const dAlong1 = transformDir('right', t);
  const dWall2 = transformDir('right', t);
  const dAlong2 = transformDir('down', t);
  return `На бесконечном поле расположена прямоугольная комната. Размеры комнаты неизвестны. В ${wallAdjGen(dWall2)} стене, смежной с ${wallAdjGen(dWall1)} стеной, есть проход. Робот находится снаружи у угла комнаты. Напишите алгоритм, закрашивающий клетки снаружи вдоль первой стены (${moveWord(dAlong1)}) до угла, огибающий угол и продолжающий закрашивание вдоль второй стены (${moveWord(dAlong2)}) до прохода.`;
}

export function rectOutsideAroundCornerToGapHint(t: TransformId): string {
  const dWall1 = transformDir('down', t);
  const dAlong1 = transformDir('right', t);
  const dWall2 = transformDir('right', t);
  const dAlong2 = transformDir('down', t);
  return `Пройдите с закрашиванием ${moveWord(dAlong1)} вдоль первой стены до угла (пока ${dirFromRobotWord(dWall1)} стена). Сделайте шаг ${moveWord(dAlong2)} за угол и продолжите движение с закрашиванием ${moveWord(dAlong2)} вдоль второй стены до прохода (пока ${dirFromRobotWord(dWall2)} стена).`;
}

export function rectOutsideOuterCornersStatement(t: TransformId): string {
  const dAlong1 = transformDir('right', t);
  const dAlong2 = transformDir('down', t);
  const dAlong3 = transformDir('left', t);
  return `На бесконечном поле расположена прямоугольная комната без проходов. Размеры комнаты неизвестны. Робот находится снаружи у угла комнаты. Напишите алгоритм, который огибает комнату снаружи по периметру (сначала ${moveWord(dAlong1)}, затем ${moveWord(dAlong2)}, затем ${moveWord(dAlong3)}) и закрашивает ровно четыре внешние угловые клетки — по одной клетке перед каждым поворотом за угол (включая начальную клетку). Все остальные клетки должны остаться незакрашенными.`;
}

export function rectOutsideOuterCornersHint(t: TransformId): string {
  const dWall1 = transformDir('down', t);
  const dAlong1 = transformDir('right', t);
  const dWall2 = transformDir('left', t);
  const dAlong2 = transformDir('down', t);
  const dWall3 = transformDir('up', t);
  const dAlong3 = transformDir('left', t);
  return `Закрасьте стартовую клетку. Пройдите ${moveWord(dAlong1)} до угла (пока ${dirFromRobotWord(dWall1)} стена) и закрасьте вторую угловую клетку. Пройдите ${moveWord(dAlong2)} до следующего угла (пока ${dirFromRobotWord(dWall2)} стена) и закрасьте третью угловую клетку. Пройдите ${moveWord(dAlong3)} до четвёртого угла (пока ${dirFromRobotWord(dWall3)} стена) и закрасьте четвёртую угловую клетку.`;
}

// Семейство room-gap
export function roomGapPerimeterNoGapStatement(_t: TransformId): string {
  return 'На бесконечном поле есть прямоугольная комната, огороженная со всех сторон стенами. Размеры комнаты неизвестны. В одной из стен есть проход шириной 1–2 клетки, его точное положение неизвестно (проход находится не в углу). Робот находится где-то внутри комнаты, его точное положение неизвестно. Напишите алгоритм, закрашивающий все клетки, примыкающие к стенам комнаты изнутри (весь внутренний периметр), за исключением клеток напротив прохода. Клетки напротив прохода и клетки в середине комнаты должны остаться незакрашенными.';
}

export function roomGapPerimeterNoGapHint(t: TransformId): string {
  return transformCode(
    'Сначала перейдите в один из углов комнаты (до упора влево и вниз). Затем обойдите периметр вдоль стен. На каждом шаге проверяйте наличие стены сбоку: закрашивайте клетку, только если сбоку есть стена. Проход обходите, оставляя его незакрашенным.',
    t
  );
}

export function roomGapGapOnlyStatement(_t: TransformId): string {
  return 'На бесконечном поле есть прямоугольная комната, огороженная со всех сторон стенами. Размеры комнаты неизвестны. В одной из стен есть проход шириной 1–2 клетки, его точное положение неизвестно (проход находится не в углу). Робот находится где-то внутри комнаты, его точное положение неизвестно. Напишите алгоритм, закрашивающий только клетки, расположенные непосредственно напротив прохода. Все остальные клетки комнаты должны остаться незакрашенными.';
}

export function roomGapGapOnlyHint(t: TransformId): string {
  return transformCode(
    'Сначала перейдите в один из углов комнаты (до упора влево и вниз). Затем обойдите периметр вдоль стен. На каждом шаге проверяйте наличие стены сбоку: закрашивайте клетку, только если сбоку НЕТ стены (то есть напротив прохода).',
    t
  );
}

