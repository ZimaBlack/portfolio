"""Beats originales para los videos de prueba de Colorada.

Sintetizados desde cero con numpy (sin samples ni melodías de terceros): libres de copyright.
Cada beat dura exactamente lo que su video y cae en compases enteros:
  01 · 96 BPM, 16 pulsos = 10,000 s (La menor)
  02 · 96 BPM, 16 pulsos = 10,000 s (Do mayor, más juguetón)
  03 · 8 pulsos en 5,9167 s (≈ 81 BPM), loop continuo con un arpegio que sube mientras cambia el color del pelo
Uso: python3 make_beats.py <carpeta de salida>   (escribe beat-01.wav, beat-02.wav y beat-03.wav)
"""
import sys, wave
import numpy as np

SR = 44100
rng = np.random.default_rng(7)
mtof = lambda m: 440.0 * 2 ** ((m - 69) / 12)


def kick(vol=1.0):
    n = int(.34 * SR); t = np.arange(n) / SR
    f = 46 + 120 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * vol


def clap(vol=1.0):
    n = int(.22 * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n); x = np.diff(x, prepend=0)          # ruido con graves recortados
    bursts = sum(np.exp(-np.clip(t - d, 0, None) * 38) * (t >= d) for d in (0, .011, .022))
    return x * bursts * np.exp(-t * 14) * .42 * vol


def hat(vol=1.0, open_=False):
    n = int((.16 if open_ else .05) * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n); x = np.diff(x, prepend=0); x = np.diff(x, prepend=0)
    return x * np.exp(-t * (22 if open_ else 95)) * .22 * vol


def crash(dur=1.1, vol=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n); x = np.diff(x, prepend=0)
    return x * np.exp(-t * 4.2) * .25 * vol


def saw(freq, n, harmonics):
    t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * freq * k * t) / k for k in range(1, harmonics + 1)) * (2 / np.pi)


def bass(midi, dur, vol=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(midi)
    x = np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * 2 * f * t)
    return x * np.minimum(1, t * 120) * np.exp(-t * 3.2) * .55 * vol


def pluck(midi, dur=.35, vol=1.0, bright=4):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(midi)
    x = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.3 * np.exp(-t * (7 + 6 * k)) for k in range(1, bright + 1))
    return x * .5 * vol


def pad(midis, dur, vol=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = sum(saw(mtof(m) * d, n, 5) for m in midis for d in (1.0, 1.004))
    env = np.minimum(1, t / .35) * np.minimum(1, (dur - t) / .4)
    return x * env * .06 * vol


def add(buf, snd, at, g=1.0):
    i = int(at * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(snd)); buf[i:j] += snd[:j - i] * g


def finish(buf, path, peak=.85):
    buf = np.tanh(buf * 1.25)                      # saturación suave
    buf *= peak / max(1e-6, np.abs(buf).max())
    fade = int(.012 * SR); buf[:fade] *= np.linspace(0, 1, fade); buf[-fade:] *= np.linspace(1, 0, fade)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((buf * 32767).astype(np.int16).tobytes())


def song(progression, bpm, bars, kick_steps, clap_steps, hat16=False, bass_steps=(0, 3, 6, 8, 10, 12, 14), fills=(), lead=None, hits=(0, 3)):
    spb = 60 / bpm; step = spb / 4; bar = spb * 4
    buf = np.zeros(int(round(bars * bar * SR)))
    for b in range(bars):
        root, chord = progression[b % len(progression)]
        t0 = b * bar
        add(buf, pad([c + 12 for c in chord], bar, 1.0), t0)
        for s in range(16):
            t = t0 + s * step
            if s in kick_steps: add(buf, kick(), t)
            if s in clap_steps: add(buf, clap(), t)
            if hat16 or s % 2 == 0: add(buf, hat(.55 if s % 4 else .85, open_=(s % 8 == 6)), t, 1.0)
            if s in bass_steps: add(buf, bass(root + (12 if s in (6, 14) else 0), step * 2.2), t)
            arp = chord[[0, 1, 2, 1][s % 4]] + 12
            if s % 2 == 0: add(buf, pluck(arp + 12, .3, .5), t)
        if b in hits: add(buf, crash(), t0, .9); add(buf, kick(1.2), t0)
        for (bb, s0) in fills:
            if bb == b:
                for k in range(s0, 16): add(buf, clap(.7), t0 + k * step)
    if lead:
        for (at, midi, d) in lead: add(buf, pluck(midi, d, .8, 5), at)
    return buf


def main(out):
    # 01 · La menor: Am – F – C – G
    am = [(45, [57, 60, 64]), (41, [53, 57, 60]), (48, [55, 60, 64]), (43, [55, 59, 62])]
    b1 = song(am, 96, 4, kick_steps=(0, 6, 8, 11), clap_steps=(4, 12), hits=(0, 3))
    finish(b1, f'{out}/beat-01.wav')
    # 02 · Do mayor, más juguetón y con redoble antes de «caos»: C – G – Am – F
    cm = [(48, [60, 64, 67]), (43, [55, 59, 62]), (45, [57, 60, 64]), (41, [53, 57, 60])]
    b2 = song(cm, 96, 4, kick_steps=(0, 4, 8, 12), clap_steps=(4, 12), hat16=True, bass_steps=(0, 2, 6, 8, 10, 14), fills=((1, 12),), hits=(0, 2, 3))
    finish(b2, f'{out}/beat-02.wav')
    # 03 · loop de 8 pulsos: arpegio ascendente (pentatónica menor) sobre Am9 → Fmaj7
    dur = 5.916667; spb = dur / 8; step = spb / 4
    b3 = np.zeros(int(round(dur * SR)))
    add(b3, pad([57, 60, 64, 71], spb * 4), 0); add(b3, pad([53, 57, 60, 64], spb * 4), spb * 4)
    scale = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 81, 79, 76, 72]
    for i, m in enumerate(scale): add(b3, pluck(m, .42, .75, 5), i * spb / 2)
    for beat in range(8):
        t = beat * spb
        if beat % 4 == 0: add(b3, kick(.9), t); add(b3, bass(45 if beat == 0 else 41, spb * 2.5), t)
        if beat in (2, 6): add(b3, clap(.8), t)
        add(b3, hat(.7), t); add(b3, hat(.45, open_=(beat % 2 == 1)), t + spb / 2)
    finish(b3, f'{out}/beat-03.wav')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
