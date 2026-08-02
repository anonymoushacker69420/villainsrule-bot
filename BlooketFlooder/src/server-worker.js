import cookieV2 from './common/cookieV2.js';
import betaJoin from './beta/join.js';
import legacyJoin from './legacy/join.js';

const pin = process.env.FLOOD_PIN;
const name = process.env.FLOOD_NAME;
const count = parseInt(process.env.FLOOD_COUNT || '1');
const mode = process.env.FLOOD_MODE || 'beta';

if (!pin || !name) {
  console.log(JSON.stringify({ type: 'status', data: { type: 'err', msg: '✗ No PIN or name provided' } }));
  process.exit(1);
}

const log = (type, data) => console.log(JSON.stringify({ type, data }));

let ok = 0, fail = 0;

try {
  if (mode === 'legacy') {
    const cf = await cookieV2('https://www.blooket.com/join?pin=' + pin, 'legacy1');
    if (!cf.cookies) { log('status', { type: 'err', msg: '✗ Failed to get cookies. Valid PIN?' }); process.exit(1); }
    log('status', { type: 'info', msg: '⟳ Flooding ' + count + ' bots...' });
    for (let i = 1; i <= count; i++) {
      const botName = count === 1 ? name : name + i;
      await legacyJoin(cf.redirectUrl, pin, botName, (r) => {
        const s = r === 2; s ? ok++ : fail++;
        log('bot-result', { name: botName, success: s });
        log('status', { type: 'info', msg: '⟳ ' + ok + ' joined, ' + fail + ' failed...' });
      });
      await new Promise(r => setTimeout(r, 100));
    }
  } else {
    const cf = await cookieV2('https://play.blooket.com/play?id=' + pin, 'beta');
    if (cf.incorrectType) { log('status', { type: 'warn', msg: '⚠ Legacy game detected. Switch to Legacy mode.' }); process.exit(1); }
    if (!cf.cookies || !cf.actionKey) { log('status', { type: 'err', msg: '✗ Failed to get cookies. Valid PIN?' }); process.exit(1); }
    log('status', { type: 'info', msg: '⟳ Flooding ' + count + ' bots...' });
    for (let i = 1; i <= count; i++) {
      const result = await betaJoin({ pin, name }, cf, i);
      const s = result === 2;
      const botName = name + (i === 1 ? '' : i);
      s ? ok++ : fail++;
      log('bot-result', { name: botName, success: s });
      log('status', { type: 'info', msg: '⟳ ' + ok + ' joined, ' + fail + ' failed...' });
      await new Promise(r => setTimeout(r, 100));
    }
  }
} catch (err) {
  log('status', { type: 'err', msg: '✗ ' + (err?.message || String(err)) });
}

log('done', { ok, fail });