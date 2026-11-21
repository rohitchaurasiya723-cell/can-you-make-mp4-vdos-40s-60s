# 🎬 40s – 60s MP4 Video Studio & Generator

> Automated High-Definition MP4 Video Creation Engine for TikTok, Instagram Reels, and YouTube Shorts.

## 🌟 Can You Make 40s - 60s MP4 Videos?
**YES!** This project provides everything you need to create, customize, and export professional **40-second to 60-second MP4 videos**:
- **Pre-generated 45-Second Sample Video**: `sample_45s.mp4` (720x1280 • H.264 • 30 FPS • 124 BPM AAC stereo soundtrack)
- **Live In-Browser Video Studio**: Customize scenes, change color themes, preview with live procedural audio, and export MP4/WebM directly from your phone or browser
- **CLI / Backend Automation Script**: Generate hundreds of videos programmatically using Node.js and FFmpeg.

---

## 🚀 Live Web Preview
Open the live studio in your browser:
👉 **[View Live Site](https://antigravity.luch.dev/site/320ec274-2c1d-47d8-8b6f-6b49c62431f4/9bcbf8a577f25ea359d516e4/)**

---

## 📱 Why 40s – 60s is the Sweet Spot
1. **Algorithmic Boost**: Social platforms (TikTok, Instagram Reels, YouTube Shorts) reward videos that keep viewers engaged beyond the 30-second mark.
2. **Complete Story Arc**: Allows a structured 4-part narrative:
   - **Scene 1 (0–10s)**: High-retention visual Hook
   - **Scene 2 (10–22s)**: Value delivery & key stats
   - **Scene 3 (22–35s)**: Deep dive / feature showcase
   - **Scene 4 (35–45s/60s)**: Strong Call-To-Action & countdown
3. **Universal Compatibility**: Encoded with H.264 High Profile and AAC audio plus `-movflags +faststart` for instant playback on iOS Safari, Android, WhatsApp, and QuickTime.

---

## 🛠️ Command-Line Generation

### Prerequisites
- Node.js 18+

### Install Dependencies
```bash
npm install
```

### Generate a 45-second Video
```bash
node generate-video.js 45 public/my_video_45s.mp4
```

### Generate a 60-second Video
```bash
node generate-video.js 60 public/my_video_60s.mp4
```

---

## 📊 Technical Specs
- **Video Codec**: H.264 (libx264)
- **Audio Codec**: AAC stereo (192 kbps, 44.1 kHz)
- **Resolution**: 720x1280 (Vertical 9:16 portrait)
- **Framerate**: 30 FPS (1,350 frames for 45s, 1,800 frames for 60s)
- **Streaming**: `-movflags +faststart` atom placement
