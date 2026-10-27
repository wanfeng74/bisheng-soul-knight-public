#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
《笔上元气骑士》音频生成器（Python 3 + numpy，零其它依赖）。

生成 ui/assets/sounds/*.wav：
  - bgm_lobby / bgm_dungeon / bgm_boss：15~24 秒可循环 8-bit 风格 BGM，
    16kHz 单声道 16bit PCM；循环点做了 4ms 淡入淡出，无爆音。
  - 17 个 SFX：shot/shot_heavy/hit/hurt/pickup/reload/heal/win/lose/slash/
    skill/coin/chest/portal/boss_roar/explode/dash，0.05~0.8 秒，峰值归一化不削波。

设计说明：
  - 纯 numpy 波形合成：方波/三角波/正弦/噪声 + 包络 + 简易鼓组，即"芯片音乐"。
  - 所有随机噪声都用固定 seed，脚本可重复运行，输出逐字节一致。
  - 体积预算：16kHz*2byte = 32KB/s，三首 BGM 共约 52s ≈ 1.66MB，
    SFX 共约 6s ≈ 0.19MB，合计 < 2.5MB。

用法：
  python tools/gen-audio.py
  （DSH 内置解释器：C:\\Users\\wangh\\.dsh\\dsh-runtimes\\dsh-next-primary-runtime\\dependencies\\python\\python.exe）
"""
import os
import sys
import wave

import numpy as np

SR = 16000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'ui', 'assets', 'sounds')

SIZE_BUDGET = 2.5 * 1024 * 1024  # 2.5MB


# ----------------------------------------------------------------------------
# 基础工具
# ----------------------------------------------------------------------------
def midi_hz(m):
    """MIDI 音高 -> 频率（A4=440）。"""
    return 440.0 * (2.0 ** ((float(m) - 69.0) / 12.0))


def t_axis(n):
    return np.arange(n, dtype=np.float64) / SR


def env_exp(n, attack=0.004, decay=0.25):
    """拨弦类包络：线性短起音 + 指数衰减，末端趋近 0。"""
    t = t_axis(n)
    a = np.clip(t / max(attack, 1e-6), 0.0, 1.0)
    return a * np.exp(-t / max(decay, 1e-6))


def env_adsr(n, a=0.005, d=0.05, s=0.6, r=0.06):
    """标准 ADSR，保证尾端为 0，避免拼接爆音。"""
    t = t_axis(n)
    dur = n / SR
    env = np.zeros(n, dtype=np.float64)
    ai = max(int(a * SR), 1)
    di = max(int(d * SR), 1)
    ri = max(int(r * SR), 1)
    si = max(n - ai - di - ri, 1)
    idx = 0
    env[0:ai] = np.linspace(0.0, 1.0, ai, endpoint=False)
    idx = ai
    seg = min(di, n - idx)
    if seg > 0:
        env[idx:idx + seg] = np.linspace(1.0, s, seg, endpoint=False)
        idx += seg
    seg = min(si, n - idx)
    if seg > 0:
        env[idx:idx + seg] = s
        idx += seg
    seg = n - idx
    if seg > 0:
        env[idx:] = np.linspace(s if idx > 0 else 0.0, 0.0, seg)
    return env


def osc_square(n, f, duty=0.5, phase0=0.0, vibrato=0.0, vib_hz=5.5):
    t = t_axis(n)
    freq = np.full(n, float(f))
    if vibrato > 0:
        freq = freq * (1.0 + vibrato * np.sin(2.0 * np.pi * vib_hz * t))
    ph = (np.cumsum(freq) / SR + phase0) % 1.0
    return np.where(ph < duty, 1.0, -1.0)


def osc_tri(n, f, phase0=0.0):
    t = t_axis(n)
    ph = (f * t + phase0) % 1.0
    return 2.0 * np.abs(2.0 * ph - 1.0) - 1.0


def osc_sine(n, f, phase0=0.0):
    t = t_axis(n)
    return np.sin(2.0 * np.pi * f * t + phase0)


def osc_saw(n, f):
    t = t_axis(n)
    return 2.0 * ((f * t) % 1.0) - 1.0


_rng = np.random.default_rng(20261026)


def noise(n, seed=None):
    rng = np.random.default_rng(20261026 if seed is None else seed)
    return rng.uniform(-1.0, 1.0, n)


def add_at(buf, start_sample, wave_arr, gain=1.0):
    """把一段波形叠加到缓冲区（越界部分截断）。"""
    if buf is None or wave_arr is None or len(wave_arr) == 0:
        return
    if start_sample < 0:
        skip = -start_sample
        if skip >= len(wave_arr):
            return
        wave_arr = wave_arr[skip:]
        start_sample = 0
    if start_sample >= len(buf):
        return
    end = min(len(buf), start_sample + len(wave_arr))
    buf[start_sample:end] += wave_arr[:end - start_sample] * gain


def to_int16(samples, peak=0.9, fade_ms=2.0):
    """归一化到给定峰值并做首尾淡入淡出（避免点击声 / 削波）。"""
    x = np.asarray(samples, dtype=np.float64)
    x = x - np.mean(x)
    m = float(np.max(np.abs(x)))
    if m > 1e-9:
        x = x / m
    x = x * float(peak)
    n = len(x)
    fm = max(int(SR * fade_ms / 1000.0), 1)
    if n > fm * 2:
        x[:fm] *= np.linspace(0.0, 1.0, fm)
        x[-fm:] *= np.linspace(1.0, 0.0, fm)
    return np.clip(x, -1.0, 1.0)


def write_wav(name, samples):
    path = os.path.join(OUT_DIR, name + '.wav')
    pcm = (np.clip(samples, -1.0, 1.0) * 32767.0).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return path


# ----------------------------------------------------------------------------
# 鼓组（芯片音乐三件套）
# ----------------------------------------------------------------------------
def drum_kick(n=None, strong=True):
    n = n or int(0.13 * SR)
    t = t_axis(n)
    f = 150.0 * np.exp(-t * 26.0) + 46.0
    ph = np.cumsum(2.0 * np.pi * f / SR)
    body = np.sin(ph) * env_exp(n, 0.001, 0.055)
    click = noise(n, 11) * env_exp(n, 0.0005, 0.004) * 0.25
    return (body + click) * (1.0 if strong else 0.7)


def drum_snare(n=None):
    n = n or int(0.12 * SR)
    t = t_axis(n)
    body = np.sin(2.0 * np.pi * 185.0 * t) * env_exp(n, 0.001, 0.028) * 0.5
    nz = noise(n, 12) - np.roll(noise(n, 12), 1)  # 简易高通
    nz = nz * env_exp(n, 0.001, 0.045) * 0.5
    return body + nz


def drum_hat(n=None, open_hat=False):
    n = n or int((0.06 if open_hat else 0.03) * SR)
    nz = noise(n, 13) - np.roll(noise(n, 13), 1)
    return nz * env_exp(n, 0.0005, 0.018 if open_hat else 0.008) * 0.5


# ----------------------------------------------------------------------------
# 通用 BGM 渲染
# ----------------------------------------------------------------------------
QUALITY = {
    'maj': [0, 4, 7],
    'min': [0, 3, 7],
    'dom': [0, 4, 7, 10],
}


def render_bgm(bpm, bars, chords, melody, style, seed=1):
    """
    bpm        : 速度
    bars       : 小节数（4/4）
    chords     : 每小节一个 (root_midi, 'maj'|'min'|'dom')
    melody     : [(beat, midi, dur_beats), ...]，绝对拍号
    style      : 'lobby' | 'dungeon' | 'boss'
    返回 (float 波形, 时长秒)
    """
    beats_per_bar = 4
    total_beats = bars * beats_per_bar
    beat_sec = 60.0 / bpm
    dur = total_beats * beat_sec
    n = int(round(dur * SR))
    buf = np.zeros(n, dtype=np.float64)

    def at(beat):
        return int(round(beat * beat_sec * SR))

    def note_len(beats):
        return max(int(round(beats * beat_sec * SR)), 8)

    # ---- 1. 和弦铺底：三角波琶音 ----
    pad_step = 1.0 if style != 'boss' else 0.5  # boss 用八分音符更急促
    arp_vol = 0.14 if style == 'lobby' else 0.12
    for bar in range(bars):
        root, qual = chords[bar % len(chords)]
        tones = [root + iv for iv in QUALITY[qual]]
        steps = int(beats_per_bar / pad_step)
        for s in range(steps):
            beat = bar * beats_per_bar + s * pad_step
            tone = tones[s % len(tones)] + 12
            ln = note_len(pad_step * 0.95)
            wave_ = osc_tri(ln, midi_hz(tone)) * env_exp(ln, 0.004, 0.16) * arp_vol
            add_at(buf, at(beat), wave_)

    # ---- 2. 贝斯 ----
    bass_vol = 0.22 if style != 'boss' else 0.26
    for bar in range(bars):
        root, qual = chords[bar % len(chords)]
        if style == 'boss':
            for s in range(8):
                beat = bar * 4 + s * 0.5
                m = root - 24 + (12 if s % 2 == 1 else 0)
                ln = note_len(0.45)
                w = osc_square(ln, midi_hz(m), 0.35) * env_exp(ln, 0.003, 0.11) * bass_vol
                add_at(buf, at(beat), w)
        else:
            for s in range(4):
                beat = bar * 4 + s
                m = root - 24
                if s == 2:
                    m += 7
                ln = note_len(0.9)
                w = osc_tri(ln, midi_hz(m)) * env_exp(ln, 0.004, 0.20) * bass_vol
                add_at(buf, at(beat), w)

    # ---- 3. 主旋律 ----
    lead_duty = 0.5 if style == 'lobby' else 0.25
    lead_vol = 0.24 if style == 'lobby' else 0.22
    for (beat, m, d) in melody:
        ln = note_len(d * 0.92)
        w = osc_square(ln, midi_hz(m), lead_duty, vibrato=0.004 if style == 'lobby' else 0.007)
        w = w * env_adsr(ln, 0.004, 0.05, 0.55, 0.03) * lead_vol
        add_at(buf, at(beat), w)

    # ---- 4. 鼓组 ----
    if style == 'lobby':
        for bar in range(bars):
            for beat in (0, 2):
                add_at(buf, at(bar * 4 + beat), drum_kick() * 0.5)
            for beat in (1, 3):
                add_at(buf, at(bar * 4 + beat), drum_snare() * 0.32)
            for s in range(8):
                add_at(buf, at(bar * 4 + s * 0.5), drum_hat() * (0.16 if s % 2 else 0.10))
    elif style == 'dungeon':
        for bar in range(bars):
            add_at(buf, at(bar * 4), drum_kick() * 0.55)
            add_at(buf, at(bar * 4 + 2.5), drum_kick(strong=False) * 0.34)
            add_at(buf, at(bar * 4 + 2), drum_snare() * 0.34)
            for s in range(8):
                add_at(buf, at(bar * 4 + s * 0.5), drum_hat() * (0.12 if s % 2 else 0.07))
    else:  # boss
        for bar in range(bars):
            for beat in (0, 1, 2, 3):
                add_at(buf, at(bar * 4 + beat), drum_kick(strong=(beat % 2 == 0)) * 0.52)
            add_at(buf, at(bar * 4 + 2), drum_snare() * 0.42)
            add_at(buf, at(bar * 4 + 3.5), drum_snare() * 0.30)
            for s in range(16):
                g = 0.15 if s % 2 == 0 else 0.09
                add_at(buf, at(bar * 4 + s * 0.25), drum_hat() * g)
            # 每个乐句最后一小节加落地通鼓
            if bar % 4 == 3:
                add_at(buf, at(bar * 4 + 3.0), drum_snare() * 0.34)

    # ---- 5. 归一化 / 循环点处理 ----
    x = buf / max(np.max(np.abs(buf)), 1e-9)
    x = x * 0.86
    # 循环点：两端各 4ms 线性淡入/淡出，保证首尾为零、拼接无爆音
    fm = int(0.004 * SR)
    x[:fm] *= np.linspace(0.0, 1.0, fm)
    x[-fm:] *= np.linspace(1.0, 0.0, fm)
    return x, dur


def bgm_lobby():
    """大厅：C 大调明亮欢快，112 BPM，8 小节 ≈ 17.1s。"""
    chords = [(60, 'maj'), (60, 'maj'), (57, 'min'), (57, 'min'),
              (53, 'maj'), (53, 'maj'), (55, 'maj'), (55, 'maj')]
    melody = [
        (0, 72, 0.5), (0.5, 76, 0.5), (1, 79, 0.5), (1.5, 76, 0.5), (2, 74, 1), (3, 72, 1),
        (4, 74, 0.5), (4.5, 76, 0.5), (5, 74, 0.5), (5.5, 72, 0.5), (6, 69, 1.8),
        (8, 72, 0.5), (8.5, 76, 0.5), (9, 81, 0.5), (9.5, 79, 0.5), (10, 76, 1), (11, 72, 1),
        (12, 74, 0.5), (12.5, 76, 0.5), (13, 77, 1), (14, 76, 0.8), (15, 72, 0.8),
        (16, 79, 0.5), (16.5, 76, 0.5), (17, 72, 0.5), (17.5, 76, 0.5), (18, 79, 1), (19, 81, 1),
        (20, 79, 0.5), (20.5, 76, 0.5), (21, 74, 0.5), (21.5, 72, 0.5), (22, 74, 1.8),
        (24, 72, 0.5), (24.5, 74, 0.5), (25, 76, 0.5), (25.5, 77, 0.5), (26, 79, 1), (27, 81, 1),
        (28, 79, 0.5), (28.5, 76, 0.5), (29, 74, 0.5), (29.5, 72, 0.5), (30, 72, 1.5),
    ]
    return render_bgm(112, 8, chords, melody, 'lobby')


def bgm_dungeon():
    """地牢：A 小调暗色探索，124 BPM，8 小节 ≈ 15.5s。"""
    chords = [(57, 'min'), (57, 'min'), (53, 'maj'), (53, 'maj'),
              (50, 'min'), (50, 'min'), (52, 'maj'), (52, 'maj')]
    melody = [
        (0, 69, 0.9), (1, 72, 0.9), (2, 76, 0.9), (3, 74, 0.9),
        (4, 72, 1.8), (6, 69, 1.8),
        (8, 65, 0.9), (9, 69, 0.9), (10, 72, 0.9), (11, 71, 0.9),
        (12, 69, 1.8), (14, 64, 1.8),
        (16, 69, 0.9), (17, 72, 0.9), (18, 77, 0.9), (19, 76, 0.9),
        (20, 72, 1.8), (22, 69, 1.8),
        (24, 71, 0.9), (25, 72, 0.9), (26, 74, 0.9), (27, 76, 0.9),
        (28, 74, 1.8), (30, 71, 1.8),
    ]
    return render_bgm(124, 8, chords, melody, 'dungeon')


def bgm_boss():
    """Boss：D 小调高压，150 BPM，12 小节 ≈ 19.2s。"""
    chords = [(50, 'min'), (50, 'min'), (50, 'min'),
              (46, 'maj'), (46, 'maj'), (46, 'maj'),
              (43, 'min'), (43, 'min'), (43, 'min'),
              (45, 'maj'), (45, 'maj'), (45, 'maj')]
    melody = []
    # 固定 riff：每 2 小节一句，共 6 句
    riff_a = [(0, 62, 0.45), (0.5, 62, 0.45), (1, 65, 0.45), (1.5, 69, 0.45),
              (2, 74, 0.9), (3, 72, 0.45), (3.5, 69, 0.45)]
    riff_b = [(0, 70, 0.45), (0.5, 69, 0.45), (1, 65, 0.45), (1.5, 62, 0.45),
              (2, 65, 0.9), (3, 67, 0.9)]
    riff_c = [(0, 74, 0.45), (0.5, 77, 0.45), (1, 81, 0.45), (1.5, 79, 0.45),
              (2, 74, 0.9), (3, 72, 0.9)]
    for i in range(6):
        base = i * 8
        riff = riff_a if i % 3 == 0 else (riff_b if i % 3 == 1 else riff_c)
        for (b, m, d) in riff:
            melody.append((base + b, m - (2 if i >= 3 else 0), d))
    return render_bgm(150, 12, chords, melody, 'boss')


# ----------------------------------------------------------------------------
# SFX
# ----------------------------------------------------------------------------
def sfx_shot():
    n = int(0.09 * SR)
    t = t_axis(n)
    f = 900.0 * np.exp(-t * 30.0) + 150.0
    ph = np.cumsum(2.0 * np.pi * f / SR)
    body = np.sign(np.sin(ph)) * 0.65 + np.sin(2.0 * ph) * 0.2
    body *= env_exp(n, 0.0008, 0.030)
    click = noise(n, 21) * env_exp(n, 0.0004, 0.006) * 0.35
    return to_int16(body + click, 0.9)


def sfx_shot_heavy():
    n = int(0.22 * SR)
    t = t_axis(n)
    f = 420.0 * np.exp(-t * 16.0) + 60.0
    ph = np.cumsum(2.0 * np.pi * f / SR)
    body = np.sign(np.sin(ph)) * 0.7
    body *= env_exp(n, 0.001, 0.07)
    rumble = noise(n, 22) * env_exp(n, 0.002, 0.09) * 0.5
    sub = np.sin(2.0 * np.pi * 55.0 * t) * env_exp(n, 0.002, 0.10) * 0.35
    return to_int16(body + rumble + sub, 0.92)


def sfx_hit():
    n = int(0.09 * SR)
    t = t_axis(n)
    click = noise(n, 23) * env_exp(n, 0.0005, 0.012) * 0.8
    thump = np.sin(2.0 * np.pi * 190.0 * t) * env_exp(n, 0.001, 0.035) * 0.55
    return to_int16(click + thump, 0.95)


def sfx_hurt():
    n = int(0.28 * SR)
    t = t_axis(n)
    f = 420.0 * np.exp(-t * 5.0) + 90.0
    ph = np.cumsum(2.0 * np.pi * f / SR)
    body = (2.0 * ((ph / (2.0 * np.pi)) % 1.0) - 1.0) * 0.6
    body *= env_adsr(n, 0.003, 0.03, 0.5, 0.09)
    grit = noise(n, 24) * env_exp(n, 0.002, 0.05) * 0.25
    return to_int16(body + grit, 0.9)


def sfx_pickup():
    n = int(0.18 * SR)
    out = np.zeros(n)
    for i, m in enumerate((84, 91)):
        ln = int(n * 0.5)
        w = osc_square(ln, midi_hz(m), 0.25) * env_exp(ln, 0.002, 0.045)
        add_at(out, int(i * n * 0.35), w, 0.5)
    return to_int16(out, 0.9)


def sfx_reload():
    n = int(0.30 * SR)
    out = np.zeros(n)
    for i, pos in enumerate((0.0, 0.13, 0.23)):
        ln = int(0.035 * SR)
        click = noise(ln, 30 + i) * env_exp(ln, 0.0004, 0.010)
        tone = osc_square(ln, midi_hz(70 + i * 5), 0.4) * env_exp(ln, 0.0008, 0.012) * 0.4
        add_at(out, int(pos * SR), click + tone, 0.7)
    return to_int16(out, 0.85)


def sfx_heal():
    n = int(0.45 * SR)
    out = np.zeros(n)
    for i, m in enumerate((72, 76, 79, 84)):
        ln = int(0.16 * SR)
        w = osc_tri(ln, midi_hz(m)) * env_exp(ln, 0.004, 0.07)
        add_at(out, int(i * 0.075 * SR), w, 0.45)
    return to_int16(out, 0.85)


def sfx_win():
    n = int(0.70 * SR)
    out = np.zeros(n)
    seq = [(0.00, 72), (0.11, 76), (0.22, 79), (0.33, 84), (0.46, 88)]
    for i, (pos, m) in enumerate(seq):
        ln = int(0.22 * SR)
        w = osc_square(ln, midi_hz(m), 0.35) * env_exp(ln, 0.003, 0.09)
        add_at(out, int(pos * SR), w, 0.42)
        w2 = osc_tri(ln, midi_hz(m - 12)) * env_exp(ln, 0.003, 0.09)
        add_at(out, int(pos * SR), w2, 0.22)
    return to_int16(out, 0.9)


def sfx_lose():
    n = int(0.75 * SR)
    out = np.zeros(n)
    seq = [(0.00, 72), (0.16, 68), (0.32, 63), (0.50, 56)]
    for i, (pos, m) in enumerate(seq):
        ln = int(0.30 * SR)
        w = osc_square(ln, midi_hz(m), 0.45) * env_adsr(ln, 0.004, 0.05, 0.4, 0.08)
        add_at(out, int(pos * SR), w, 0.42)
    return to_int16(out, 0.9)


def sfx_slash():
    n = int(0.14 * SR)
    nz = noise(n, 34) - np.roll(noise(n, 34), 1)
    t = t_axis(n)
    sweep = np.sin(2.0 * np.pi * (600.0 + 2400.0 * t) * t) * 0.25
    return to_int16((nz * env_exp(n, 0.002, 0.045) + sweep * env_exp(n, 0.001, 0.02)), 0.9)


def sfx_skill():
    n = int(0.35 * SR)
    t = t_axis(n)
    f = 200.0 + 1100.0 * (t / (n / SR)) ** 1.6
    ph = np.cumsum(2.0 * np.pi * f / SR)
    body = np.sign(np.sin(ph)) * 0.45 + np.sin(2.0 * ph) * 0.2
    body *= env_adsr(n, 0.01, 0.05, 0.7, 0.08)
    shimmer = np.sin(2.0 * np.pi * 1700.0 * t) * env_exp(n, 0.02, 0.12) * 0.15
    return to_int16(body + shimmer, 0.88)


def sfx_coin():
    n = int(0.13 * SR)
    out = np.zeros(n)
    for i, m in enumerate((96, 103)):
        ln = int(0.055 * SR)
        w = osc_square(ln, midi_hz(m), 0.2) * env_exp(ln, 0.001, 0.018)
        add_at(out, int(i * 0.05 * SR), w, 0.6)
    return to_int16(out, 0.9)


def sfx_chest():
    n = int(0.45 * SR)
    out = np.zeros(n)
    # 木头吱呀（低频噪声 + 滑动音高）
    t = t_axis(n)
    creak = noise(n, 40) * 0.25
    creak = creak * env_exp(n, 0.01, 0.10)
    add_at(out, 0, creak, 0.6)
    for i, m in enumerate((79, 83, 88, 91)):
        ln = int(0.10 * SR)
        w = osc_square(ln, midi_hz(m), 0.25) * env_exp(ln, 0.002, 0.04)
        add_at(out, int((0.14 + i * 0.055) * SR), w, 0.4)
    return to_int16(out, 0.9)


def sfx_portal():
    n = int(0.60 * SR)
    t = t_axis(n)
    f = 160.0 + 480.0 * (t / (n / SR)) ** 0.7
    ph = np.cumsum(2.0 * np.pi * f / SR)
    body = np.sin(ph) * 0.5 + np.sin(2.01 * ph) * 0.18 + np.sin(3.02 * ph) * 0.1
    body *= env_adsr(n, 0.05, 0.1, 0.65, 0.15)
    air = noise(n, 41) * 0.12 * env_adsr(n, 0.08, 0.1, 0.4, 0.15)
    return to_int16(body + air, 0.88)


def sfx_boss_roar():
    n = int(0.80 * SR)
    t = t_axis(n)
    f = 72.0 + 18.0 * np.sin(2.0 * np.pi * 5.0 * t) + 22.0 * np.exp(-t * 1.2)
    ph = np.cumsum(2.0 * np.pi * f / SR)
    growl = np.sign(np.sin(ph)) * 0.45
    growl += np.sin(2.0 * ph) * 0.2
    growl *= env_adsr(n, 0.03, 0.08, 0.75, 0.22)
    grit = noise(n, 42) * env_adsr(n, 0.02, 0.10, 0.5, 0.2) * 0.45
    return to_int16(growl + grit, 0.95)


def sfx_explode():
    n = int(0.65 * SR)
    t = t_axis(n)
    nz = noise(n, 43) * env_exp(n, 0.002, 0.16)
    # 简易低通：滑动平均
    k = 8
    kern = np.ones(k) / k
    low = np.convolve(noise(n, 44), kern, mode='same') * env_exp(n, 0.004, 0.20)
    boom = np.sin(2.0 * np.pi * (90.0 * np.exp(-t * 4.0) + 38.0) * t) * env_exp(n, 0.002, 0.14) * 0.7
    return to_int16(nz * 0.55 + low * 1.2 + boom, 0.95)


def sfx_dash():
    n = int(0.22 * SR)
    t = t_axis(n)
    nz = noise(n, 45)
    # 简易带通：差分后再平滑
    hp = nz - np.roll(nz, 1)
    k = 6
    bp = np.convolve(hp, np.ones(k) / k, mode='same')
    env = np.exp(-((t - 0.06) ** 2) / (2.0 * 0.045 ** 2))
    return to_int16(bp * env * 1.4, 0.85)


SFX = [
    ('shot', sfx_shot),
    ('shot_heavy', sfx_shot_heavy),
    ('hit', sfx_hit),
    ('hurt', sfx_hurt),
    ('pickup', sfx_pickup),
    ('reload', sfx_reload),
    ('heal', sfx_heal),
    ('win', sfx_win),
    ('lose', sfx_lose),
    ('slash', sfx_slash),
    ('skill', sfx_skill),
    ('coin', sfx_coin),
    ('chest', sfx_chest),
    ('portal', sfx_portal),
    ('boss_roar', sfx_boss_roar),
    ('explode', sfx_explode),
    ('dash', sfx_dash),
]


# ----------------------------------------------------------------------------
# 主流程
# ----------------------------------------------------------------------------
def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    written = []
    total_bytes = 0

    print('采样率 {0}Hz / 单声道 / 16bit PCM'.format(SR))
    print('输出目录:', OUT_DIR)
    print('')

    bgms = [
        ('bgm_lobby', bgm_lobby),
        ('bgm_dungeon', bgm_dungeon),
        ('bgm_boss', bgm_boss),
    ]
    for name, fn in bgms:
        samples, dur = fn()
        if not (15.0 <= dur <= 24.0):
            raise SystemExit('[FAIL] {0} 时长 {1:.2f}s 不在 15~24s'.format(name, dur))
        path = write_wav(name, samples)
        size = os.path.getsize(path)
        total_bytes += size
        written.append((name, dur, size))
        print('  BGM  {0:14s} {1:6.2f}s  {2:8d} B'.format(name, dur, size))

    print('')
    for name, fn in SFX:
        samples = fn()
        dur = len(samples) / SR
        if not (0.05 <= dur <= 0.80):
            raise SystemExit('[FAIL] {0} 时长 {1:.3f}s 不在 0.05~0.8s'.format(name, dur))
        path = write_wav(name, samples)
        size = os.path.getsize(path)
        total_bytes += size
        written.append((name, dur, size))
        print('  SFX  {0:14s} {1:6.3f}s  {2:8d} B'.format(name, dur, size))

    print('')
    print('=== 音频生成完成 ===')
    print('文件数: {0}（BGM 3 + SFX {1}）'.format(len(written), len(SFX)))
    print('总体积: {0:.2f} MB ({1} B) / 预算 2.5MB'.format(total_bytes / 1024.0 / 1024.0, total_bytes))
    if total_bytes >= SIZE_BUDGET:
        raise SystemExit('[FAIL] 音频总体积超出 2.5MB 预算')
    print('预算检查: OK')
    return 0


if __name__ == '__main__':
    sys.exit(main())
