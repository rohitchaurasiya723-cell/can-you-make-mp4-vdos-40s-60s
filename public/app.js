/**
 * MP4 Video Studio Client Application
 * Features:
 * - High-definition HTML5 video player with chapter markers
 * - Real-time HTML5 2D Canvas video renderer with particle physics & themes
 * - Web Audio API procedural synthesizer for live playback & export
 * - Client-side MediaRecorder video export (MP4/WebM)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Tab Navigation
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const demoVideo = document.getElementById('demoVideo');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');

      // Pause demo video if leaving player tab
      if (targetId !== 'tab-player' && demoVideo && !demoVideo.paused) {
        demoVideo.pause();
      }
    });
  });

  // 2. Demo Video Player Scene Markers
  const chapterBtns = document.querySelectorAll('.chip-btn');
  chapterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const seekTime = parseFloat(btn.getAttribute('data-seek'));
      if (demoVideo) {
        demoVideo.currentTime = seekTime;
        demoVideo.play().catch(() => {});
      }
    });
  });

  // 3. Interactive Video Studio State
  const state = {
    duration: 45,
    currentTime: 0,
    isPlaying: false,
    theme: 'cyberpunk',
    soundtrack: 'synthwave',
    aspect: '9:16',
    isRecording: false,
    text: {
      s1Hook: 'Unlock AI Video Generation',
      s1Sub: 'Create 40s - 60s MP4s in Seconds',
      s2Title: 'Built For Maximum Reach',
      s2Stat: '+400% Retention on Reels & Shorts',
      s3Title: 'Automated Code Pipeline',
      s3Detail: 'Zero Manual Editing Required',
      s4Cta: 'Start Creating Today',
      s4Handle: '@YourBrandName • Follow For More'
    }
  };

  // Color themes
  const THEMES = {
    cyberpunk: {
      bg1: '#060913',
      bg2: '#0b1329',
      primary: '#00f2fe',
      secondary: '#9d4edd',
      accent: '#ff007f',
      glow1: 'rgba(0, 242, 254, 0.22)',
      glow2: 'rgba(157, 78, 221, 0.22)'
    },
    sunset: {
      bg1: '#12070e',
      bg2: '#280c1b',
      primary: '#ff9e00',
      secondary: '#ff0054',
      accent: '#ffd166',
      glow1: 'rgba(255, 158, 0, 0.25)',
      glow2: 'rgba(255, 0, 84, 0.25)'
    },
    emerald: {
      bg1: '#04120f',
      bg2: '#06261f',
      primary: '#10b981',
      secondary: '#06b6d4',
      accent: '#a7f3d0',
      glow1: 'rgba(16, 185, 129, 0.25)',
      glow2: 'rgba(6, 182, 212, 0.25)'
    },
    midnight: {
      bg1: '#090817',
      bg2: '#161233',
      primary: '#8b5cf6',
      secondary: '#ec4899',
      accent: '#c084fc',
      glow1: 'rgba(139, 92, 246, 0.25)',
      glow2: 'rgba(236, 72, 153, 0.25)'
    }
  };

  // Canvas elements
  const canvas = document.getElementById('studioCanvas');
  const ctx = canvas.getContext('2d');
  const WIDTH = 720;
  const HEIGHT = 1280;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const timelineSlider = document.getElementById('timelineSlider');
  const canvasTimecode = document.getElementById('canvasTimecode');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const playPauseIcon = document.getElementById('playPauseIcon');
  const restartBtn = document.getElementById('restartBtn');

  // Input bindings
  ['s1Hook', 's1Sub', 's2Title', 's2Stat', 's3Title', 's3Detail', 's4Cta', 's4Handle'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => {
        state.text[id] = e.target.value;
        if (!state.isPlaying) render();
      });
    }
  });

  // Duration buttons
  const durationBtns = document.querySelectorAll('.duration-selector .btn-toggle');
  durationBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      durationBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.duration = parseInt(btn.getAttribute('data-duration'), 10);
      timelineSlider.max = state.duration;
      if (state.currentTime > state.duration) state.currentTime = 0;
      updateTimecode();
      render();
    });
  });

  // Theme buttons
  const themeBtns = document.querySelectorAll('.theme-selector .theme-pill');
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.theme = btn.getAttribute('data-theme');
      render();
    });
  });

  // Soundtrack radio
  const soundtrackRadios = document.querySelectorAll('input[name="soundtrack"]');
  soundtrackRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.soundtrack = e.target.value;
    });
  });

  // Particles
  const particles = Array.from({ length: 45 }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    vy: -(1.5 + Math.random() * 2.5),
    vx: (Math.random() - 0.5) * 1.2,
    size: 2 + Math.random() * 3,
    alpha: 0.2 + Math.random() * 0.7
  }));

  function updateParticles() {
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) {
        p.y = HEIGHT + 20;
        p.x = Math.random() * WIDTH;
      }
    });
  }

  // Web Audio Context for live synthesized sound
  let audioCtx = null;
  let masterGain = null;
  let audioInterval = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSynthNote(freq, type = 'sine', duration = 0.25, gainVal = 0.15) {
    if (!audioCtx || state.soundtrack === 'none') return;
    try {
      const osc = audioCtx.createOscillator();
      const noteGain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      noteGain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  function playKick() {
    if (!audioCtx || state.soundtrack === 'none') return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(140, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, audioCtx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.7, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.22);
    } catch (e) {}
  }

  // Helper: rounded rectangle
  function roundRect(c, x, y, width, height, radius) {
    c.beginPath();
    c.moveTo(x + radius, y);
    c.lineTo(x + width - radius, y);
    c.quadraticCurveTo(x + width, y, x + width, y + radius);
    c.lineTo(x + width, y + height - radius);
    c.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    c.lineTo(x + radius, y + height);
    c.quadraticCurveTo(x, y + height, x, y + height - radius);
    c.lineTo(x, y + radius);
    c.quadraticCurveTo(x, y, x + radius, y);
    c.closePath();
  }

  // Main Render Function
  function render() {
    const theme = THEMES[state.theme] || THEMES.cyberpunk;
    const t = state.currentTime;
    const progress = Math.min(1, t / state.duration);

    // Background Gradient
    const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bg.addColorStop(0, theme.bg1);
    bg.addColorStop(0.5, theme.bg2);
    bg.addColorStop(1, theme.bg1);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Background Glowing Orbs
    const orb1X = WIDTH * 0.3 + Math.sin(t * 0.8) * 60;
    const orb1Y = HEIGHT * 0.35 + Math.cos(t * 0.6) * 80;
    const orb1 = ctx.createRadialGradient(orb1X, orb1Y, 10, orb1X, orb1Y, 260);
    orb1.addColorStop(0, theme.glow1);
    orb1.addColorStop(1, 'transparent');
    ctx.fillStyle = orb1;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const orb2X = WIDTH * 0.7 + Math.cos(t * 0.7) * 70;
    const orb2Y = HEIGHT * 0.65 + Math.sin(t * 0.5) * 80;
    const orb2 = ctx.createRadialGradient(orb2X, orb2Y, 10, orb2X, orb2Y, 280);
    orb2.addColorStop(0, theme.glow2);
    orb2.addColorStop(1, 'transparent');
    ctx.fillStyle = orb2;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Floor Perspective Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    const horizonY = HEIGHT * 0.82;
    for (let x = -WIDTH; x < WIDTH * 2; x += 60) {
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2, horizonY);
      ctx.lineTo(x + ((t * 25) % 60), HEIGHT);
      ctx.stroke();
    }
    for (let y = horizonY; y <= HEIGHT; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }

    // Particles
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = theme.primary;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Header Badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    roundRect(ctx, 40, 50, 360, 44, 22);
    ctx.fill();
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(62, 72, 6, 0, Math.PI * 2);
    ctx.fillStyle = theme.primary;
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('AI VIDEO STUDIO • 60 FPS', 80, 78);

    // Timecode
    const curSec = Math.floor(t);
    const timeStr = `00:${curSec < 10 ? '0' : ''}${curSec} / 00:${state.duration}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    roundRect(ctx, WIDTH - 180, 50, 140, 44, 22);
    ctx.fill();
    ctx.fillStyle = theme.primary;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(timeStr, WIDTH - 110, 78);

    // Progress bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(40, 110, WIDTH - 80, 5);
    const progGrad = ctx.createLinearGradient(40, 0, WIDTH - 80, 0);
    progGrad.addColorStop(0, theme.primary);
    progGrad.addColorStop(1, theme.accent);
    ctx.fillStyle = progGrad;
    ctx.fillRect(40, 110, (WIDTH - 80) * progress, 5);

    // Scenes (Divided proportionally based on state.duration)
    const s1End = state.duration * 0.25;
    const s2End = state.duration * 0.52;
    const s3End = state.duration * 0.78;

    if (t < s1End) {
      renderStudioScene1(t, s1End, theme);
    } else if (t < s2End) {
      renderStudioScene2(t - s1End, s2End - s1End, theme);
    } else if (t < s3End) {
      renderStudioScene3(t - s2End, s3End - s2End, theme);
    } else {
      renderStudioScene4(t - s3End, state.duration - s3End, theme);
    }

    // Audio Visualizer waveform bars at bottom
    const barCount = 28;
    const barWidth = 14;
    const gap = 8;
    const startX = (WIDTH - (barCount * (barWidth + gap) - gap)) / 2;
    const visualizerY = HEIGHT - 90;

    for (let b = 0; b < barCount; b++) {
      const barHeight = 12 + Math.abs(Math.sin(t * 8 + b * 0.45)) * 36;
      const bx = startX + b * (barWidth + gap);
      const by = visualizerY - barHeight / 2;

      const barGrad = ctx.createLinearGradient(0, by, 0, by + barHeight);
      barGrad.addColorStop(0, theme.primary);
      barGrad.addColorStop(1, theme.secondary);
      ctx.fillStyle = barGrad;
      roundRect(ctx, bx, by, barWidth, barHeight, 6);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('H.264 • STEREO AAC • 40s - 60s SWEET SPOT', WIDTH / 2, HEIGHT - 35);
  }

  // Studio Scenes
  function renderStudioScene1(localT, dur, theme) {
    const alpha = Math.min(1, localT * 2) * (localT > dur - 0.8 ? (dur - localT) / 0.8 : 1);
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);

    const centerX = WIDTH / 2;
    const centerY = HEIGHT * 0.35;

    // Glowing Central Ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, 110 + Math.sin(localT * 3) * 6, 0, Math.PI * 2);
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MP4', centerX, centerY + 14);

    // Pill
    ctx.fillStyle = theme.accent;
    roundRect(ctx, centerX - 90, HEIGHT * 0.48, 180, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('SCENE 1: THE HOOK', centerX, HEIGHT * 0.48 + 24);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(state.text.s1Hook, centerX, HEIGHT * 0.58);

    ctx.fillStyle = theme.primary;
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(state.text.s1Sub, centerX, HEIGHT * 0.65);

    ctx.restore();
  }

  function renderStudioScene2(localT, dur, theme) {
    const alpha = Math.min(1, localT * 2) * (localT > dur - 0.8 ? (dur - localT) / 0.8 : 1);
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);

    const centerX = WIDTH / 2;

    ctx.fillStyle = theme.secondary;
    roundRect(ctx, centerX - 100, HEIGHT * 0.2, 200, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCENE 2: VALUE', centerX, HEIGHT * 0.2 + 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(state.text.s2Title, centerX, HEIGHT * 0.3);

    // Big Card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    roundRect(ctx, 60, HEIGHT * 0.38, WIDTH - 120, 220, 20);
    ctx.fill();
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('+380%', centerX, HEIGHT * 0.47);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(state.text.s2Stat, centerX, HEIGHT * 0.53);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px sans-serif';
    ctx.fillText('Optimized for TikTok, Reels & YouTube Shorts', centerX, HEIGHT * 0.58);

    ctx.restore();
  }

  function renderStudioScene3(localT, dur, theme) {
    const alpha = Math.min(1, localT * 2) * (localT > dur - 0.8 ? (dur - localT) / 0.8 : 1);
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);

    const centerX = WIDTH / 2;

    ctx.fillStyle = theme.primary;
    roundRect(ctx, centerX - 100, HEIGHT * 0.2, 200, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#060913';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCENE 3: PIPELINE', centerX, HEIGHT * 0.2 + 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(state.text.s3Title, centerX, HEIGHT * 0.3);

    ctx.fillStyle = theme.primary;
    ctx.font = '22px sans-serif';
    ctx.fillText(state.text.s3Detail, centerX, HEIGHT * 0.36);

    const steps = ['1. Code-Driven Scenes', '2. Dynamic Audio Beats', '3. H.264 Fast-Start Mux'];
    steps.forEach((st, idx) => {
      const sy = HEIGHT * 0.44 + idx * 80;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      roundRect(ctx, 80, sy, WIDTH - 160, 60, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(st, centerX, sy + 38);
    });

    ctx.restore();
  }

  function renderStudioScene4(localT, dur, theme) {
    const alpha = Math.min(1, localT * 2);
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);

    const centerX = WIDTH / 2;

    ctx.beginPath();
    ctx.arc(centerX, HEIGHT * 0.35, 80, 0, Math.PI * 2);
    ctx.fillStyle = theme.accent;
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▶', centerX, HEIGHT * 0.35 + 16);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(state.text.s4Cta, centerX, HEIGHT * 0.52);

    ctx.fillStyle = theme.primary;
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(state.text.s4Handle, centerX, HEIGHT * 0.58);

    ctx.restore();
  }

  function updateTimecode() {
    const curSec = Math.floor(state.currentTime);
    canvasTimecode.textContent = `00:${curSec < 10 ? '0' : ''}${curSec} / 00:${state.duration}`;
  }

  // Animation Loop
  let lastFrameTime = performance.now();
  let lastBeatSec = -1;

  function loop(now) {
    const delta = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    if (state.isPlaying) {
      state.currentTime += delta;
      if (state.currentTime >= state.duration) {
        state.currentTime = 0;
      }
      timelineSlider.value = state.currentTime;
      updateTimecode();
      updateParticles();

      // Trigger audio beat every 0.48s (124 bpm)
      const currentBeat = Math.floor(state.currentTime / 0.4838);
      if (currentBeat !== lastBeatSec) {
        lastBeatSec = currentBeat;
        if (state.soundtrack === 'synthwave') {
          playKick();
          const chordFreqs = [220, 261.6, 329.6, 440];
          playSynthNote(chordFreqs[currentBeat % 4], 'sawtooth', 0.18, 0.12);
        } else if (state.soundtrack === 'ambient') {
          playSynthNote(196 + (currentBeat % 3) * 40, 'sine', 0.6, 0.1);
        }
      }
    }

    render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  // Transport control listeners
  playPauseBtn.addEventListener('click', () => {
    initAudio();
    state.isPlaying = !state.isPlaying;
    playPauseIcon.textContent = state.isPlaying ? '⏸' : '▶';
  });

  restartBtn.addEventListener('click', () => {
    state.currentTime = 0;
    timelineSlider.value = 0;
    updateTimecode();
    render();
  });

  timelineSlider.addEventListener('input', (e) => {
    state.currentTime = parseFloat(e.target.value);
    updateTimecode();
    render();
  });

  // 4. Video Export in Browser (MediaRecorder)
  const recordExportBtn = document.getElementById('recordExportBtn');
  const exportProgressWrap = document.getElementById('exportProgressWrap');
  const exportProgressBar = document.getElementById('exportProgressBar');
  const exportPercentText = document.getElementById('exportPercentText');
  const exportBtnText = document.getElementById('exportBtnText');

  recordExportBtn.addEventListener('click', async () => {
    if (state.isRecording) return;
    initAudio();

    // Determine supported mime type
    let mimeType = 'video/webm;codecs=vp9';
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
      mimeType = 'video/mp4;codecs=avc1';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      mimeType = 'video/webm;codecs=vp8';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
    }

    state.isRecording = true;
    recordExportBtn.disabled = true;
    exportProgressWrap.classList.remove('hidden');
    exportBtnText.textContent = 'Recording Video...';

    // Capture canvas stream
    const canvasStream = canvas.captureStream(30);

    // If audio is available, add audio track
    let combinedStream = canvasStream;
    let audioDest = null;
    if (audioCtx && masterGain) {
      audioDest = audioCtx.createMediaStreamDestination();
      masterGain.connect(audioDest);
      const audioTrack = audioDest.stream.getAudioTracks()[0];
      if (audioTrack) {
        combinedStream.addTrack(audioTrack);
      }
    }

    const chunks = [];
    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 2500000 // 2.5 Mbps
    });

    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const a = document.createElement('a');
      a.href = url;
      a.download = `custom_video_${state.duration}s.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      state.isRecording = false;
      state.isPlaying = false;
      playPauseIcon.textContent = '▶';
      recordExportBtn.disabled = false;
      exportBtnText.textContent = 'Export & Download Video';
      exportProgressWrap.classList.add('hidden');
    };

    // Reset playhead and start recording
    state.currentTime = 0;
    state.isPlaying = true;
    playPauseIcon.textContent = '⏸';
    recorder.start(500);

    const recordStartTime = performance.now();
    const exportInterval = setInterval(() => {
      const progress = Math.min(100, Math.floor((state.currentTime / state.duration) * 100));
      exportProgressBar.style.width = `${progress}%`;
      exportPercentText.textContent = `${progress}%`;

      if (state.currentTime >= state.duration) {
        clearInterval(exportInterval);
        recorder.stop();
        if (audioDest && masterGain) {
          try { masterGain.disconnect(audioDest); } catch (e) {}
        }
      }
    }, 100);
  });
});
