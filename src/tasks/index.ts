import { TaskModule } from '../types';
import { task1 } from './task1';
import { task2 } from './task2';
import { task3 } from './task3';
import { task4 } from './task4';
import { task5 } from './task5';
import { task6 } from './task6';
import { task7 } from './task7';
import { task8 } from './task8';
import { task9 } from './task9';
import { task10 } from './task10';
import { task11 } from './task11';
import { task12 } from './task12';
import { task13 } from './task13';
import { task14 } from './task14';
import { task15 } from './task15';
import { task16 } from './task16';

/**
 * Registry of all 16 OGE Informatics task modules.
 * This file allows easy plug-and-play adding/editing of any individual task module.
 */
export const OGE_TASKS: TaskModule[] = [
  task1,
  task2,
  task3,
  task4,
  task5,
  task6,
  task7,
  task8,
  task9,
  task10,
  task11,
  task12,
  task13,
  task14,
  task15,
  task16,
];

export { runTests16 } from './task16';
export function getTaskById(id: number): TaskModule | undefined {
  return OGE_TASKS.find(t => t.id === id);
}
