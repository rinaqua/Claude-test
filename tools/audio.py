"""Web Aqua 30秒CM用サウンドトラック(音楽+SE)をすべて合成で生成する。

外部音源は使わない。映像(cm/cm.js)のタイミングに合わせた 120BPM / Dメジャー。
出力: output/web-aqua-cm-audio.wav (48kHz / 16bit / stereo / 30.0s)
"""
import os
import wave

import numpy as np
from scipy.signal import butter, lfilter, sosfilt

SR = 48000
DUR = 30.0
N = int(SR * DUR)
BEAT = 0.5
GRID0 = 3.5  # 小節の起点(ドラムイン)
rng = np.random.default_rng(1)

L = np.zeros(N)
R = np.zeros(N)
send = np.zeros(N)  # リバーブ送り(モノラル)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(sig, t, gain=1.0, pan=0.0, rev=0.0):
    i0 = int(round(t * SR))
    if i0 >= N:
        return
    if i0 < 0:
        sig = sig[-i0:]
        i0 = 0
    sig = sig[: N - i0]
    lg = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
    rg = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
    L[i0:i0 + len(sig)] += sig * gain * lg
    R[i0:i0 + len(sig)] += sig * gain * rg
    if rev:
        send[i0:i0 + len(sig)] += sig * gain * rev


def tt(d):
    return np.arange(int(d * SR)) / SR


def lp(x, fc, order=2):
    sos = butter(order, min(fc, SR / 2 - 100) / (SR / 2), 'low', output='sos')
    return sosfilt(sos, x)


def hp(x, fc, order=2):
    sos = butter(order, fc / (SR / 2), 'high', output='sos')
    return sosfilt(sos, x)


def bp(x, lo, hi, order=2):
    sos = butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band', output='sos')
    return sosfilt(sos, x)


def saw(f, t, phase=0.0):
    return 2 * ((f * t + phase) % 1.0) - 1


# ------------------------------------------------------------------ 音色
def kick(d=0.45):
    t = tt(d)
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 300) * 0.35
    return np.tanh((body + click) * 1.6) * 0.9


def clap(d=0.3):
    t = tt(d)
    n = bp(rng.standard_normal(len(t)), 900, 5200)
    env = np.exp(-t * 22)
    for k in (0.008, 0.017):
        env += np.where(t > k, 0.5 * np.exp(-(t - k) * 60), 0) * (t < k + 0.02)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.3
    return (n * env + tone) * 0.55


def hat(d=0.07, open_=False):
    t = tt(0.25 if open_ else d)
    n = hp(rng.standard_normal(len(t)), 7500)
    return n * np.exp(-t * (14 if open_ else 70)) * 0.28


def pluck(m, d=0.6, bright=1.0):
    t = tt(d)
    f = midi(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 12) * bright \
        + 0.12 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 20)
    return s * np.exp(-t * 7) * (1 - np.exp(-t * 900)) * 0.3


def bass_note(m, d):
    t = tt(d)
    f = midi(m)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.tanh(3 * np.sin(2 * np.pi * f * t))
    env = (1 - np.exp(-t * 300)) * np.exp(-t * 3.0)
    env *= np.clip((d - t) / 0.02, 0, 1)
    return s * env * 0.55


def pad_chord(notes, d, cutoff=1800, att=0.25, rel=0.6):
    t = tt(d + rel)
    s = np.zeros(len(t))
    for m in notes:
        for det in (-0.09, 0.0, 0.1):
            s += saw(midi(m) * 2 ** (det / 12), t, rng.random())
    s = lp(s / (len(notes) * 3), cutoff, 2)
    env = np.clip(t / att, 0, 1) * np.where(t < d, 1.0, np.exp(-(t - d) / (rel / 3)))
    return s * env * 0.5


def riser(d, f0=180, f1=3200):
    t = tt(d)
    k = t / d
    n = rng.standard_normal(len(t))
    # 周波数が上昇するバンドパス風ノイズ(ブロック処理)
    out = np.zeros(len(t))
    blk = 2048
    for i in range(0, len(t), blk):
        kk = k[i]
        fc = f0 * (f1 / f0) ** kk
        seg = bp(n[i:i + blk], fc * 0.7, min(fc * 1.4, SR / 2 - 200), 1)
        out[i:i + blk] = seg
    f = f0 * (f1 / f0) ** k
    tone = np.sin(2 * np.pi * np.cumsum(f * 0.5) / SR) * 0.15
    return (out + tone) * k ** 2.2 * 0.6


def whoosh(d=0.6):
    t = tt(d)
    n = rng.standard_normal(len(t))
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    out = np.zeros(len(t))
    blk = 1024
    for i in range(0, len(t), blk):
        fc = 400 + 3800 * np.sin(np.pi * i / len(t))
        out[i:i + blk] = bp(n[i:i + blk], fc * 0.6, fc * 1.6, 1)
    return out * env * 0.5


def impact(d=2.5):
    t = tt(d)
    f = 30 + 70 * np.exp(-t * 6)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    noise = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 7) * 0.5
    return np.tanh((boom + noise) * 1.4) * 0.9


def drop():
    t = tt(1.2)
    f = 1300 * np.exp(-t * 9) + 620
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    s += 0.4 * np.sin(2 * np.pi * 2 * np.cumsum(f) / SR) * np.exp(-t * 18)
    return s * 0.5


def blip(f=880, d=0.09):
    t = tt(d)
    ff = f * (1 + 0.5 * t / d)
    return np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t * 40) * 0.25


def click():
    t = tt(0.02)
    return hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 350) * 0.35


def shimmer(d=2.5):
    t = tt(d)
    s = np.zeros(len(t))
    for m in (86, 90, 93, 98):
        s += np.sin(2 * np.pi * midi(m) * t + rng.random() * 6) * np.exp(-t * 1.6)
    return s * 0.06 * (1 - np.exp(-t * 60))


# ------------------------------------------------------------------ 楽曲
CH = {
    'D': ([50, 54, 57, 62, 66], 38),
    'A': ([49, 52, 57, 61, 64], 33),
    'Bm': ([50, 54, 59, 62, 66], 35),
    'G': ([50, 55, 59, 62, 67], 31),
}
prog_ = [('G', 0.0, 3.5)]
seq = ['D', 'A', 'Bm', 'G'] * 3
for i, c in enumerate(seq):
    s = GRID0 + i * 2
    if s >= 26.5:
        break
    prog_.append((c, s, min(s + 2, 26.5)))
prog_.append(('D', 26.5, 30.0))

# パッド
for c, s, e in prog_:
    notes, _ = CH[c]
    cut = 900 if s < 3.5 else (1500 if s < 23 else 1100)
    if s >= 26.5:
        cut = 2400
    add(pad_chord(notes, e - s, cutoff=cut, att=0.6 if s == 0 else 0.08, rel=0.5 if s < 26.5 else 1.0),
        s, gain=(1.0 if s < 3.5 else 0.55 if s < 23 else 0.95 if s < 26.5 else 1.2), rev=0.35)

# サイドチェイン用のキック時刻
kicks = [GRID0 + i * BEAT for i in range(int((23.0 - GRID0) / BEAT))]

# ベース(8分)
for c, s, e in prog_:
    if s < GRID0 or s >= 23:
        continue
    _, root = CH[c]
    k = s
    j = 0
    while k < e - 1e-6 and k < 23:
        m = root + (12 if j % 4 == 3 else 0)
        add(bass_note(m, 0.23 if j % 2 else 0.2), k, gain=0.9 if j % 2 else 0.55)
        k += 0.25
        j += 1

# アルペジオ(16分)
def arp_section(t0, t1, gain, octave=12, bright=1.0):
    for c, s, e in prog_:
        notes, _ = CH[c]
        k = max(s, t0)
        # 16分グリッドに合わせる
        k = GRID0 + np.ceil((k - GRID0) / 0.125 - 1e-6) * 0.125
        pat = [0, 2, 3, 4, 2, 3, 1, 4]
        while k < min(e, t1) - 1e-6:
            idx = int(round((k - GRID0) / 0.125)) % len(pat)
            m = notes[pat[idx]] + octave
            pan = -0.45 if idx % 2 else 0.45
            add(pluck(m, 0.4, bright), k, gain=gain, pan=pan, rev=0.4)
            k += 0.125


arp_section(0.9, 3.5, 0.5)
arp_section(3.5, 23.0, 0.16)
arp_section(23.0, 26.5, 0.55)
# エンディング: ゆっくりしたベル
for i, m in enumerate([74, 78, 81, 86, 90]):
    add(pluck(m, 1.6, 0.6), 26.62 + i * 0.12, gain=0.5, pan=(-0.5 + i * 0.25), rev=0.7)

# ドラム
for i, k in enumerate(kicks):
    add(kick(), k, gain=0.95)
    if i % 2 == 1:
        add(clap(), k, gain=0.6, rev=0.25)
    add(hat(), k + 0.25, gain=0.8, pan=0.25)
    if k >= 11.5:
        add(hat(0.04), k + 0.125, gain=0.35, pan=-0.3)
        add(hat(0.04), k + 0.375, gain=0.35, pan=-0.3)
    if i % 8 == 7:
        add(hat(open_=True), k + 0.25, gain=0.6, pan=0.3)
# フィル(スネアロール)
for k in np.arange(22.0, 23.0, 0.125):
    add(clap(0.15), k, gain=0.25 + 0.35 * (k - 22.0), rev=0.2)

# サイドチェイン(パッド/アルペジオの呼吸感)
duck = np.ones(N)
tv = np.arange(N) / SR
for k in kicks:
    i0 = int(k * SR)
    seg = tv[i0:i0 + int(0.4 * SR)] - k
    duck[i0:i0 + len(seg)] = np.minimum(duck[i0:i0 + len(seg)], 1 - 0.55 * np.exp(-seg / 0.09))
L *= duck
R *= duck
send *= duck

# ------------------------------------------------------------------ SE
add(drop(), 0.62, gain=0.9, rev=0.9)
add(shimmer(2.8), 0.62, gain=1.0, rev=0.6)
add(impact(1.4) * 0.35, 0.62, gain=0.6)
add(riser(1.6), 1.9, gain=0.8, rev=0.3)
add(impact(), 3.5, gain=0.95, rev=0.4)
for tc in (3.5, 7.5, 15.0):
    add(whoosh(0.8), tc - 0.5, gain=0.9, pan=0.0, rev=0.3)
add(whoosh(0.5), 11.5 - 0.35, gain=0.8, rev=0.2)
add(whoosh(0.9), 19.0 - 0.1, gain=0.7, rev=0.3)
# 検索バー
add(blip(660, 0.12), 3.55, gain=0.8, rev=0.3)
q = 11
for i in range(q):
    add(click(), 3.9 + i * (1.05 / q), gain=0.9, pan=0.2)
add(blip(1320, 0.1), 5.0, gain=0.9, rev=0.3)
add(whoosh(0.45), 5.1, gain=0.7)
# S3 スラム
add(impact(0.8) * 0.5, 7.7, gain=0.6, pan=-0.4)
add(impact(0.8) * 0.5, 8.1, gain=0.6, pan=0.4)
add(riser(0.75, 300, 5000), 9.45, gain=0.5)
add(impact(), 10.2, gain=0.9, rev=0.5)
add(shimmer(1.5), 10.55, gain=0.8, rev=0.5)
# S4 タイル
for i in range(6):
    add(blip(740 + i * 90, 0.08), 11.85 + i * 0.12, gain=0.6, pan=-0.5 + (i % 3) * 0.5, rev=0.25)
# S5 1Day
for i, t0 in enumerate([15.55, 15.8, 16.05, 16.25, 16.45, 16.59, 16.73, 16.95]):
    add(blip(560 + i * 60, 0.07), t0, gain=0.45, pan=0.5, rev=0.2)
add(click() * 1.4, 17.8, gain=1.0)
add(impact(0.9) * 0.6, 17.8, gain=0.7, rev=0.4)
add(shimmer(1.8), 17.82, gain=1.0, rev=0.5)
# S6 タイムライン
for i in range(4):
    add(blip(880 + i * 110, 0.1), 19.25 + i * 0.36, gain=0.7, pan=-0.6 + i * 0.4, rev=0.3)
add(riser(0.5, 400, 4000), 20.75, gain=0.4)
add(impact(1.2) * 0.7, 21.25, gain=0.8, rev=0.4)
# S7 → S8
add(riser(1.8, 150, 4200), 24.7, gain=0.9, rev=0.3)
add(impact(3.0), 26.5, gain=1.0, rev=0.5)
add(shimmer(3.2), 26.5, gain=1.3, rev=0.7)
add(drop(), 26.5, gain=0.6, rev=0.9)

# ------------------------------------------------------------------ リバーブ(Schroeder)
def reverb(x):
    out = np.zeros_like(x)
    for dms, g in ((29.7, 0.83), (37.1, 0.81), (41.1, 0.79), (43.7, 0.77)):
        D = int(SR * dms / 1000)
        a = np.zeros(D + 1)
        a[0] = 1
        a[D] = -g
        out += lfilter([1.0], a, x)
    for dms, g in ((5.0, 0.7), (1.7, 0.7)):
        D = int(SR * dms / 1000)
        b = np.zeros(D + 1)
        b[0] = -g
        b[D] = 1
        a = np.zeros(D + 1)
        a[0] = 1
        a[D] = -g
        out = lfilter(b, a, out)
    return lp(out, 6000) * 0.25


wet = reverb(send)
# 左右で少しずらしてステレオ感
dly = int(0.011 * SR)
L += wet
R += np.concatenate([np.zeros(dly), wet[:-dly]])

# ------------------------------------------------------------------ マスター
mix = np.stack([L, R], axis=1)
mix = hp(mix.T, 28).T
peak = np.max(np.abs(mix))
mix = mix / peak * 1.7
mix = np.tanh(mix) * 0.95
fade = np.ones(N)
fade[: int(0.01 * SR)] = np.linspace(0, 1, int(0.01 * SR))
fs = int(28.6 * SR)
fade[fs:] = np.linspace(1, 0, N - fs) ** 1.5
mix *= fade[:, None]

os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'output'), exist_ok=True)
path = os.path.join(os.path.dirname(__file__), '..', 'output', 'web-aqua-cm-audio.wav')
pcm = (np.clip(mix, -1, 1) * 32767).astype('<i2')
with wave.open(path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('wrote', os.path.abspath(path), f'{N / SR:.2f}s')
