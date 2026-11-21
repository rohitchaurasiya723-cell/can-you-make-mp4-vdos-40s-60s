/**
 * Procedural Audio Synthesizer for 40-60s Videos
 * Generates high quality electronic / synthwave background music in 16-bit 44.1kHz stereo WAV.
 */
const fs = require('fs');

function generateTrack(durationSec = 45, sampleRate = 44100) {
  const numSamples = Math.floor(durationSec * sampleRate);
  const numChannels = 2;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // WAV RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  const bpm = 124;
  const beatSec = 60 / bpm; // ~0.4838s
  const barSec = beatSec * 4; // ~1.935s

  // Chords progression: Am, F, C, G
  const chordFrequencies = [
    [110.0, 220.0, 261.63, 329.63, 440.0], // Am
    [87.31, 174.61, 220.0, 261.63, 349.23], // F
    [65.41, 130.81, 164.81, 196.0, 261.63], // C
    [98.0, 196.0, 246.94, 293.66, 392.0]    // G
  ];

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Master volume envelope (fade in 1s, fade out last 2s)
    let masterEnv = 1.0;
    if (t < 1.0) masterEnv = t;
    if (t > durationSec - 2.5) masterEnv = Math.max(0, (durationSec - t) / 2.5);

    // Current chord in progression
    const totalBars = t / barSec;
    const chordIndex = Math.floor(totalBars) % 4;
    const currentChord = chordFrequencies[chordIndex];
    const beatInBar = (t % barSec) / beatSec;
    const beatFraction = (t % beatSec) / beatSec;

    // 1. Kick Drum (Beats 0, 1, 2, 3)
    const kickTime = t % beatSec;
    let kick = 0;
    if (kickTime < 0.25) {
      const pitch = 140 * Math.exp(-kickTime * 30);
      const amp = Math.exp(-kickTime * 14);
      kick = Math.sin(2 * Math.PI * pitch * kickTime) * amp * 0.7;
    }

    // 2. Hi-Hat (Every 16th note, accented on upbeats)
    const sixteenth = beatSec / 4;
    const hatTime = t % sixteenth;
    let hat = 0;
    if (hatTime < 0.05) {
      const noise = (Math.random() * 2 - 1);
      const hatAmp = Math.exp(-hatTime * 80);
      hat = noise * hatAmp * 0.18;
    }

    // 3. Snare / Clap on beats 2 and 4
    let snare = 0;
    const snareHit1 = Math.abs(t - (Math.floor(t / barSec) * barSec + beatSec * 1));
    const snareHit2 = Math.abs(t - (Math.floor(t / barSec) * barSec + beatSec * 3));
    const minSnare = Math.min(snareHit1, snareHit2);
    if (minSnare < 0.2) {
      const tone = Math.sin(2 * Math.PI * 180 * minSnare) * Math.exp(-minSnare * 20);
      const noise = (Math.random() * 2 - 1) * Math.exp(-minSnare * 15);
      snare = (tone * 0.3 + noise * 0.7) * 0.35;
    }

    // 4. Bass synth (808 style pitch)
    const bassNote = currentChord[0];
    const bassTime = t % (beatSec / 2);
    const bassEnv = Math.exp(-bassTime * 5);
    const bass = (Math.sin(2 * Math.PI * bassNote * t) + 0.3 * Math.sin(2 * Math.PI * bassNote * 2 * t)) * bassEnv * 0.32;

    // 5. Ambient Pad / Chords
    let pad = 0;
    for (let c = 1; c < currentChord.length; c++) {
      const freq = currentChord[c];
      const detune = Math.sin(t * 0.5 + c) * 1.5;
      pad += Math.sin(2 * Math.PI * (freq + detune) * t);
    }
    pad = (pad / currentChord.length) * 0.18;

    // 6. Arpeggio lead (16th notes dancing through chord notes)
    const arpStep = Math.floor((t % barSec) / (beatSec / 2)) % currentChord.length;
    const arpFreq = currentChord[arpStep] * 2;
    const arpTime = t % (beatSec / 2);
    const arpEnv = Math.exp(-arpTime * 8);
    const arp = Math.sin(2 * Math.PI * arpFreq * t) * arpEnv * 0.14;

    // 7. Transition Risers (before 10s, 22s, 34s scene switches)
    let riser = 0;
    const sceneMarkers = [10.0, 22.0, 34.0];
    for (const marker of sceneMarkers) {
      const dist = marker - t;
      if (dist > 0 && dist < 1.8) {
        const progress = 1.0 - (dist / 1.8);
        const pitch = 200 + Math.pow(progress, 3) * 1200;
        const noise = (Math.random() * 2 - 1) * 0.15 * progress;
        const tone = Math.sin(2 * Math.PI * pitch * t) * 0.2 * progress;
        riser += (tone + noise);
      }
    }

    // Mix stereo
    const monoMix = (kick + snare + hat + bass + pad + arp + riser) * masterEnv;
    const panOffset = Math.sin(t * 1.5) * 0.15;
    let left = monoMix * (0.9 - panOffset);
    let right = monoMix * (0.9 + panOffset);

    // Soft clip / limiter
    left = Math.max(-0.95, Math.min(0.95, left));
    right = Math.max(-0.95, Math.min(0.95, right));

    const leftInt = Math.floor(left * 32767);
    const rightInt = Math.floor(right * 32767);

    buffer.writeInt16LE(leftInt, offset);
    buffer.writeInt16LE(rightInt, offset + 2);
    offset += 4;
  }

  return buffer;
}

if (require.main === module) {
  const duration = parseFloat(process.argv[2]) || 45;
  const outputPath = process.argv[3] || 'assets/soundtrack.wav';
  console.log(`Generating ${duration}s electronic soundtrack...`);
  const wavBuffer = generateTrack(duration);
  fs.writeFileSync(outputPath, wavBuffer);
  console.log(`Saved soundtrack to ${outputPath} (${(wavBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
}

module.exports = { generateTrack };
