import { createServer } from '../src/index.js';
import resources from './resources.json' assert { type: 'json' };

export const { start } = createServer(resources);

start(3333);
