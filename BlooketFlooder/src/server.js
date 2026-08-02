import { createServer } from 'http';
import { Server } from 'socket.io';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cookieV2 from './common/cookieV2.js';
import betaJoin from './beta/join.js';
import legacyJoin from './legacy/join.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const httpServer = createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(readFileSync(join(__dirname, '../public/index.html')));
    } else { res.writeHead(404); res.end('Not found'); }
});
const io = new Server(httpServer, { cors: { origin: '*' } });
io.on('connection', (socket) => {
    socket.on('flood', async ({ pin, name, count, mode }) => {
        if (!pin || !name || !count) return socket.emit('error', 'Missing fields');
        const botCount = Math.min(Math.max(parseInt(count) || 1, 1), 100);
        socket.emit('status', { type: 'info', msg: '⟳ Getting Cloudflare bypass cookies...' });
        let ok = 0, fail = 0;
        try {
            if (mode === 'legacy') {
                const checkUrl = 'https://www.blooket.com/join?pin=' + pin;
                const cf = await cookieV2(checkUrl, 'legacy1');
                if (!cf.cookies) return socket.emit('status', { type: 'err', msg: '✗ Failed to get cookies. Valid PIN?' });
                socket.emit('status', { type: 'info', msg: '⟳ Flooding ' + botCount + ' bots...' });
                for (let i = 1; i <= botCount; i++) {
                    const botName = botCount === 1 ? name : name + i;
                    await legacyJoin(cf.redirectUrl, pin, botName, (r) => {
                        const s = r === 2;
                        s ? ok++ : fail++;
                        socket.emit('bot-result', { name: botName, success: s });
                        socket.emit('status', { type: 'info', msg: '⟳ ' + ok + ' joined, ' + fail + ' failed...' });
                    });
                    await new Promise(r => setTimeout(r, 100));
                }
            } else {
                const playUrl = 'https://play.blooket.com/play?id=' + pin;
                const cf = await cookieV2(playUrl, 'beta');
                if (cf.incorrectType) return socket.emit('status', { type: 'warn', msg: '⚠ This is a legacy game. Switch to Legacy mode.' });
                if (!cf.cookies || !cf.actionKey) return socket.emit('status', { type: 'err', msg: '✗ Failed to get cookies. Valid PIN?' });
                socket.emit('status', { type: 'info', msg: '⟳ Flooding ' + botCount + ' bots...' });
                const config = { pin, name };
                for (let i = 1; i <= botCount; i++) {
                    const result = await betaJoin(config, cf, i);
                    const s = result === 2;
                    const botName = name + (i == 1 ? '' : i);
                    s ? ok++ : fail++;
                    socket.emit('bot-result', { name: botName, success: s });
                    socket.emit('status', { type: 'info', msg: '⟳ ' + ok + ' joined, ' + fail + ' failed...' });
                    await new Promise(r => setTimeout(r, 100));
                }
            }
        } catch (err) {
            socket.emit('status', { type: 'err', msg: '✗ ' + (err?.message || String(err)) });
        }
        const type = fail === 0 ? 'ok' : ok === 0 ? 'err' : 'warn';
        socket.emit('flood-done', { ok, fail });
        socket.emit('status', { type, msg: '✓ Done — ' + ok + ' joined, ' + fail + ' failed' });
    });
});
httpServer.listen(PORT, () => console.log('✅ BlooketBot → http://localhost:' + PORT));
