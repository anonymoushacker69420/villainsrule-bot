import enquirer from 'enquirer';

import { bold, orange, purple, red, yellow } from './common/color.js';

console.log(bold(yellow('BlooketFlooder Pro')));

if (typeof Bun === 'undefined') {
    console.error(red('❌ this script requires bun (https://bun.sh) to bypass cloudflare antibot'));
    process.exit(1);
}

console.log(purple('✨ this is the formerly private version with:'));
console.log(purple('  - 100% cloudflare bypass (no popup windows)'));
console.log(purple('  - instant join'));
console.log(purple('  - 60-70% less resources used\n'));

if (!process.env.PROXY) console.log(orange('⚠️  use a proxy for faster botting! see the README for more info\n'));

import('./legacy/index.js');
