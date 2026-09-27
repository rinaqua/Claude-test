// 使い方:
//   node tools/render.cjs                 … 900フレームを書き出して output/web-aqua-cm-30s.mp4 を生成
//   node tools/render.cjs --stills 1,5.5  … 指定秒のスチルを frames/still-*.png に書き出す
const path = require('path');
const fs = require('fs');
const { spawn, execFileSync } = require('child_process');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const ROOT = path.resolve(__dirname, '..');
const FPS = 30, DUR = 30, FRAMES = FPS * DUR;
const OUT_DIR = path.join(ROOT, 'output');
const ffmpeg = process.env.FFMPEG || (() => {
  try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim(); }
  catch { return 'ffmpeg'; }
})();

(async () => {
  const args = process.argv.slice(2);
  const stillsIdx = args.indexOf('--stills');
  const browser = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? undefined : undefined });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.error('[pageerror]', e));
  await page.goto('file://' + path.join(ROOT, 'cm/index.html') + '?render');
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const canvas = await page.$('#cv');

  if (stillsIdx >= 0) {
    const times = args[stillsIdx + 1].split(',').map(Number);
    fs.mkdirSync(path.join(ROOT, 'frames'), { recursive: true });
    for (const t of times) {
      await page.evaluate(t => window.drawFrame(t), t);
      await canvas.screenshot({ path: path.join(ROOT, 'frames', `still-${t.toFixed(2)}.png`) });
      console.log('still', t);
    }
    await browser.close();
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const wav = path.join(OUT_DIR, 'web-aqua-cm-audio.wav');
  const mp4 = path.join(OUT_DIR, 'web-aqua-cm-30s.mp4');
  const ffArgs = ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-'];
  if (fs.existsSync(wav)) ffArgs.push('-i', wav);
  ffArgs.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-movflags', '+faststart', '-r', String(FPS));
  if (fs.existsSync(wav)) ffArgs.push('-c:a', 'aac', '-b:a', '256k', '-shortest');
  ffArgs.push(mp4);
  const ff = spawn(ffmpeg, ffArgs, { stdio: ['pipe', 'ignore', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < FRAMES; f++) {
    const t = f / FPS;
    await page.evaluate(t => window.drawFrame(t), t);
    const buf = await canvas.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 60 === 0) console.log(`frame ${f}/${FRAMES}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('wrote', mp4);
})();
