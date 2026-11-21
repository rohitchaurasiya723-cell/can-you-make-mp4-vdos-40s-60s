/**
 * High-Definition MP4 Video Generator (40s - 60s)
 * Powered by @napi-rs/canvas, Procedural Web Audio Synth, and FFmpeg (H.264/AAC).
 */
const { createCanvas } = require('@napi-rs/canvas');
const ffmpeg = require('ffmpeg-static');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { generateTrack } = require('./generate-audio');

// Config
const WIDTH = 720;
const HEIGHT = 1280;
const FPS = 30;

// Particle system helper
class Particle {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.reset();
  }
  reset() {
    this.x = Math.random() * this.w;
    this.y = this.h + Math.random() * 50;
    this.vy = -(1.5 + Math.random() * 2.5);
    this.vx = (Math.random() - 0.5) * 1.2;
    this.size = 1.5 + Math.random() * 3.5;
    this.alpha = 0.2 + Math.random() * 0.7;
    this.hue = Math.random() > 0.5 ? 185 : 280; // cyan or magenta
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.y < -10) this.reset();
  }
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue}, 100%, 70%, ${this.alpha})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = `hsla(${this.hue}, 100%, 50%, 0.8)`;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

async function renderVideo(options = {}) {
  const duration = options.duration || 45;
  const outputPath = options.outputPath || path.join(__dirname, 'public', 'sample_45s.mp4');
  const tempAudioPath = path.join(__dirname, 'assets', `temp_audio_${Date.now()}.wav`);

  console.log(`\n========================================`);
  console.log(`🎬 Generating ${duration}s MP4 Video`);
  console.log(`📐 Resolution: ${WIDTH}x${HEIGHT} (9:16 Vertical)`);
  console.log(`⚡ Framerate: ${FPS} fps (Total frames: ${duration * FPS})`);
  console.log(`📁 Destination: ${outputPath}`);
  console.log(`========================================\n`);

  // Ensure output directories exist
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const audioDir = path.dirname(tempAudioPath);
  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

  // 1. Generate audio track
  console.log('🎵 Synthesizing procedural stereo soundtrack...');
  const audioBuffer = generateTrack(duration);
  fs.writeFileSync(tempAudioPath, audioBuffer);
  console.log('✓ Audio ready.');

  // 2. Set up FFmpeg spawn process
  const ffmpegArgs = [
    '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-s', `${WIDTH}x${HEIGHT}`,
    '-pix_fmt', 'rgba',
    '-r', FPS.toString(),
    '-i', '-',
    '-i', tempAudioPath,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'fast',
    '-crf', '21',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-movflags', '+faststart',
    '-shortest',
    outputPath
  ];

  const proc = spawn(ffmpeg, ffmpegArgs);

  proc.stderr.on('data', data => {
    // Debug if needed
  });

  const totalFrames = duration * FPS;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Initialize particles
  const particles = Array.from({ length: 45 }, () => new Particle(WIDTH, HEIGHT));

  // Helper: wait for drain
  function writeFrame(buf) {
    return new Promise(resolve => {
      if (!proc.stdin.write(buf)) {
        proc.stdin.once('drain', resolve);
      } else {
        process.nextTick(resolve);
      }
    });
  }

  // Draw scene function
  function renderFrame(frameIndex) {
    const t = frameIndex / FPS;
    const progress = frameIndex / totalFrames;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#060913');
    bgGrad.addColorStop(0.5, '#0b1329');
    bgGrad.addColorStop(1, '#05070e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Glowing background orbs
    const orb1X = WIDTH * 0.3 + Math.sin(t * 0.8) * 60;
    const orb1Y = HEIGHT * 0.35 + Math.cos(t * 0.6) * 80;
    const orb1 = ctx.createRadialGradient(orb1X, orb1Y, 10, orb1X, orb1Y, 260);
    orb1.addColorStop(0, 'rgba(0, 242, 254, 0.18)');
    orb1.addColorStop(1, 'rgba(0, 242, 254, 0)');
    ctx.fillStyle = orb1;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const orb2X = WIDTH * 0.7 + Math.cos(t * 0.7) * 70;
    const orb2Y = HEIGHT * 0.65 + Math.sin(t * 0.5) * 80;
    const orb2 = ctx.createRadialGradient(orb2X, orb2Y, 10, orb2X, orb2Y, 280);
    orb2.addColorStop(0, 'rgba(157, 78, 221, 0.2)');
    orb2.addColorStop(1, 'rgba(157, 78, 221, 0)');
    ctx.fillStyle = orb2;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Perspective floor grid lines
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.12)';
    ctx.lineWidth = 1;
    const horizonY = HEIGHT * 0.82;
    for (let x = -WIDTH; x < WIDTH * 2; x += 60) {
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2, horizonY);
      ctx.lineTo(x + (t * 20 % 60), HEIGHT);
      ctx.stroke();
    }
    for (let y = horizonY; y <= HEIGHT; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }

    // Update and draw particles
    particles.forEach(p => {
      p.update();
      p.draw(ctx);
    });

    // Top Header: System Badge & Timecode
    ctx.save();
    // Pill badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    roundRect(ctx, 40, 50, 360, 44, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pulse dot
    ctx.beginPath();
    ctx.arc(62, 72, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#00f2fe';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f2fe';
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('AI VIDEO STUDIO • 60 FPS', 80, 78);

    // Timecode badge
    const curSec = Math.floor(t);
    const timeStr = `00:${curSec < 10 ? '0' : ''}${curSec} / 00:${duration}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    roundRect(ctx, WIDTH - 180, 50, 140, 44, 22);
    ctx.fill();
    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(timeStr, WIDTH - 110, 78);

    // Master Timeline Progress Bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(40, 110, WIDTH - 80, 5);
    const gradProg = ctx.createLinearGradient(40, 0, WIDTH - 80, 0);
    gradProg.addColorStop(0, '#00f2fe');
    gradProg.addColorStop(0.5, '#9d4edd');
    gradProg.addColorStop(1, '#ff007f');
    ctx.fillStyle = gradProg;
    ctx.fillRect(40, 110, (WIDTH - 80) * progress, 5);
    ctx.restore();

    // Content Scenes:
    // Scene 1: 0 - 11s (The Hook)
    // Scene 2: 11 - 23s (Retention & Sweet Spot)
    // Scene 3: 23 - 35s (Pipeline & Visualizer)
    // Scene 4: 35 - 45s (Call to Action)
    if (t < 11) {
      renderScene1(ctx, t, 11);
    } else if (t < 23) {
      renderScene2(ctx, t - 11, 12);
    } else if (t < 35) {
      renderScene3(ctx, t - 23, 12);
    } else {
      renderScene4(ctx, t - 35, duration - 35);
    }

    // Bottom Audio Visualizer waveform bars
    ctx.save();
    const barCount = 28;
    const barWidth = 14;
    const gap = 8;
    const startX = (WIDTH - (barCount * (barWidth + gap) - gap)) / 2;
    const visualizerY = HEIGHT - 90;

    for (let b = 0; b < barCount; b++) {
      const beatFreq = 2.0;
      const barHeight = 12 + Math.abs(Math.sin(t * 8 + b * 0.45)) * 38 * (0.6 + 0.4 * Math.sin(t * beatFreq));
      const bx = startX + b * (barWidth + gap);
      const by = visualizerY - barHeight / 2;

      const barGrad = ctx.createLinearGradient(0, by, 0, by + barHeight);
      barGrad.addColorStop(0, '#00f2fe');
      barGrad.addColorStop(1, '#9d4edd');
      ctx.fillStyle = barGrad;
      roundRect(ctx, bx, by, barWidth, barHeight, 6);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('H.264 • STEREO AAC • PROCEDURAL AUDIO • 1080p READY', WIDTH / 2, HEIGHT - 35);
    ctx.restore();
  }

  // Scene 1: The Hook
  function renderScene1(ctx, localT, sceneDur) {
    ctx.save();
    const enterAlpha = Math.min(1, localT * 2);
    const exitAlpha = localT > sceneDur - 1 ? (sceneDur - localT) : 1;
    ctx.globalAlpha = enterAlpha * exitAlpha;

    // Glowing Central Ring
    const centerX = WIDTH / 2;
    const centerY = HEIGHT * 0.35;
    const ringRadius = 110 + Math.sin(localT * 3) * 6;

    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#00f2fe';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner icon / badge
    ctx.beginPath();
    ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
    const innerGrad = ctx.createLinearGradient(centerX - 80, centerY - 80, centerX + 80, centerY + 80);
    innerGrad.addColorStop(0, 'rgba(0, 242, 254, 0.3)');
    innerGrad.addColorStop(1, 'rgba(157, 78, 221, 0.4)');
    ctx.fillStyle = innerGrad;
    ctx.fill();

    // Center icon text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MP4', centerX, centerY + 14);

    // Pill Tag
    ctx.fillStyle = '#ff007f';
    roundRect(ctx, centerX - 90, HEIGHT * 0.48, 180, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('QUESTION ANSWERED', centerX, HEIGHT * 0.48 + 24);

    // Headline
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px sans-serif';
    ctx.fillText('Can You Make', centerX, HEIGHT * 0.57);

    const gradText = ctx.createLinearGradient(100, 0, 620, 0);
    gradText.addColorStop(0, '#00f2fe');
    gradText.addColorStop(1, '#ff007f');
    ctx.fillStyle = gradText;
    ctx.fillText('40s - 60s Videos?', centerX, HEIGHT * 0.63);

    // Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = '22px sans-serif';
    ctx.fillText('Yes! Complete with Motion & Sound', centerX, HEIGHT * 0.69);

    // 3 Feature Badges
    const features = ['✓ High-Def MP4', '✓ Custom Beats', '✓ 100% Code-Driven'];
    const badgeW = 200;
    features.forEach((feat, idx) => {
      const bx = 50 + idx * 215;
      const by = HEIGHT * 0.74;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      roundRect(ctx, bx, by, badgeW, 44, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(feat, bx + badgeW / 2, by + 28);
    });

    ctx.restore();
  }

  // Scene 2: The Sweet Spot & Retention
  function renderScene2(ctx, localT, sceneDur) {
    ctx.save();
    const enterAlpha = Math.min(1, localT * 2);
    const exitAlpha = localT > sceneDur - 1 ? (sceneDur - localT) : 1;
    ctx.globalAlpha = enterAlpha * exitAlpha;

    const centerX = WIDTH / 2;

    // Category Tag
    ctx.fillStyle = '#9d4edd';
    roundRect(ctx, centerX - 100, HEIGHT * 0.17, 200, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VIRAL RETENTION', centerX, HEIGHT * 0.17 + 24);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('The 40s - 60s', centerX, HEIGHT * 0.25);
    const gradText = ctx.createLinearGradient(100, 0, 620, 0);
    gradText.addColorStop(0, '#00f2fe');
    gradText.addColorStop(1, '#ffc837');
    ctx.fillStyle = gradText;
    ctx.fillText('Sweet Spot', centerX, HEIGHT * 0.305);

    // Stat Cards
    const cards = [
      { num: '+380%', label: 'Longer Watch Time', sub: 'Optimized for TikTok & Reels' },
      { num: '2.4x', label: 'Algorithmic Boost', sub: 'Exceeds 30s threshold' },
      { num: '1080p', label: 'Universal Delivery', sub: 'Native H.264 MP4 compatibility' }
    ];

    cards.forEach((card, idx) => {
      const cardY = HEIGHT * 0.36 + idx * 145;
      const animProgress = Math.min(1, Math.max(0, (localT - idx * 0.3) * 2));

      ctx.save();
      ctx.translate(0, (1 - animProgress) * 30);
      ctx.globalAlpha = (enterAlpha * exitAlpha) * animProgress;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      roundRect(ctx, 50, cardY, WIDTH - 100, 125, 18);
      ctx.fill();
      ctx.strokeStyle = idx === 0 ? '#00f2fe' : (idx === 1 ? '#ff007f' : '#ffd166');
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Number
      ctx.fillStyle = idx === 0 ? '#00f2fe' : (idx === 1 ? '#ff007f' : '#ffd166');
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(card.num, 80, cardY + 58);

      // Label & Sub
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(card.label, 230, cardY + 48);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px sans-serif';
      ctx.fillText(card.sub, 230, cardY + 80);

      ctx.restore();
    });

    ctx.restore();
  }

  // Scene 3: How It Works & Pipeline
  function renderScene3(ctx, localT, sceneDur) {
    ctx.save();
    const enterAlpha = Math.min(1, localT * 2);
    const exitAlpha = localT > sceneDur - 1 ? (sceneDur - localT) : 1;
    ctx.globalAlpha = enterAlpha * exitAlpha;

    const centerX = WIDTH / 2;

    // Category Tag
    ctx.fillStyle = '#00f2fe';
    roundRect(ctx, centerX - 110, HEIGHT * 0.17, 220, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#090d16';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AUTOMATED ENGINE', centerX, HEIGHT * 0.17 + 24);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('How Antigravity', centerX, HEIGHT * 0.25);
    ctx.fillStyle = '#00f2fe';
    ctx.fillText('Builds Every Video', centerX, HEIGHT * 0.305);

    // Steps
    const steps = [
      { step: '01', title: 'Script & Timing', desc: 'Precise scene markers for 40-60s pacing' },
      { step: '02', title: 'Dynamic Graphics', desc: 'Procedural particles, typography & motion' },
      { step: '03', title: 'Soundtrack Synth', desc: '124 BPM electronic chords & drum beats' },
      { step: '04', title: 'FFmpeg H.264 Pipe', desc: 'Instant encoding ready for Instagram/YT' }
    ];

    steps.forEach((st, idx) => {
      const stepY = HEIGHT * 0.36 + idx * 105;
      const stepAnim = Math.min(1, Math.max(0, (localT - idx * 0.25) * 2));

      ctx.save();
      ctx.translate(0, (1 - stepAnim) * 20);
      ctx.globalAlpha = (enterAlpha * exitAlpha) * stepAnim;

      // Circle node
      ctx.beginPath();
      ctx.arc(90, stepY + 35, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#9d4edd';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(st.step, 90, stepY + 42);

      // Card
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      roundRect(ctx, 130, stepY, WIDTH - 180, 72, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(st.title, 150, stepY + 30);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px sans-serif';
      ctx.fillText(st.desc, 150, stepY + 54);

      ctx.restore();
    });

    ctx.restore();
  }

  // Scene 4: Call to Action & Studio Launch
  function renderScene4(ctx, localT, sceneDur) {
    ctx.save();
    const enterAlpha = Math.min(1, localT * 2);
    ctx.globalAlpha = enterAlpha;

    const centerX = WIDTH / 2;

    // Pulsing Countdown or Launch
    const remaining = Math.max(0, sceneDur - localT);
    const countNum = Math.ceil(remaining);

    // Glowing circle
    ctx.beginPath();
    ctx.arc(centerX, HEIGHT * 0.32, 90, 0, Math.PI * 2);
    const gradCircle = ctx.createLinearGradient(centerX - 90, HEIGHT * 0.32 - 90, centerX + 90, HEIGHT * 0.32 + 90);
    gradCircle.addColorStop(0, '#ff007f');
    gradCircle.addColorStop(1, '#00f2fe');
    ctx.fillStyle = gradCircle;
    ctx.shadowBlur = 35;
    ctx.shadowColor = '#ff007f';
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▶ PLAY', centerX, HEIGHT * 0.32 + 18);

    // Main text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('Create Your Video', centerX, HEIGHT * 0.49);

    const gradSub = ctx.createLinearGradient(100, 0, 620, 0);
    gradSub.addColorStop(0, '#00f2fe');
    gradSub.addColorStop(1, '#ffd166');
    ctx.fillStyle = gradSub;
    ctx.fillText('In the Web Studio', centerX, HEIGHT * 0.545);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '20px sans-serif';
    ctx.fillText('Customize scenes, music & export directly', centerX, HEIGHT * 0.60);

    // Big interactive button visual
    const btnW = 440;
    const btnH = 68;
    const btnX = (WIDTH - btnW) / 2;
    const btnY = HEIGHT * 0.65;

    const btnGrad = ctx.createLinearGradient(btnX, 0, btnX + btnW, 0);
    btnGrad.addColorStop(0, '#00f2fe');
    btnGrad.addColorStop(0.5, '#9d4edd');
    btnGrad.addColorStop(1, '#ff007f');
    ctx.fillStyle = btnGrad;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00f2fe';
    roundRect(ctx, btnX, btnY, btnW, btnH, 34);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('OPEN VIDEO STUDIO', centerX, btnY + 43);

    // Brand tag
    ctx.fillStyle = '#64748b';
    ctx.font = '16px sans-serif';
    ctx.fillText('Antigravity Autonomous Studio • 2026', centerX, HEIGHT * 0.76);

    ctx.restore();
  }

  // Rounded rectangle path helper
  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // 3. Render and pipe all frames to FFmpeg
  console.log(`🚀 Rendering ${totalFrames} frames...`);
  const startTime = Date.now();
  let lastReport = Date.now();

  for (let f = 0; f < totalFrames; f++) {
    renderFrame(f);
    const imgData = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
    await writeFrame(imgData);

    if (Date.now() - lastReport > 2500 || f === totalFrames - 1) {
      const pct = Math.floor((f / totalFrames) * 100);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const fpsReal = ((f + 1) / ((Date.now() - startTime) / 1000)).toFixed(1);
      console.log(`[Frame ${f + 1}/${totalFrames}] ${pct}% done (${elapsed}s elapsed, ~${fpsReal} fps)`);
      lastReport = Date.now();
    }
  }

  // Close stdin and wait for FFmpeg to finish writing file
  proc.stdin.end();

  await new Promise((resolve, reject) => {
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with error code ${code}`));
    });
  });

  // Clean up temp audio
  if (fs.existsSync(tempAudioPath)) {
    fs.unlinkSync(tempAudioPath);
  }

  const stat = fs.statSync(outputPath);
  const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n🎉 SUCCESS! Generated MP4 video:`);
  console.log(`   File: ${outputPath}`);
  console.log(`   Size: ${sizeMb} MB`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Time Taken: ${totalElapsed}s\n`);

  return { outputPath, sizeMb, duration };
}

if (require.main === module) {
  const duration = parseInt(process.argv[2], 10) || 45;
  const out = process.argv[3] || path.join(__dirname, 'public', 'sample_45s.mp4');
  renderVideo({ duration, outputPath: out }).catch(err => {
    console.error('Render error:', err);
    process.exit(1);
  });
}

module.exports = { renderVideo };
