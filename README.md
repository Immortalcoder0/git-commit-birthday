# 🎂 git-commit-birthday

> A hyper-cinematic, scroll-linked birthday experience built with Vite, TypeScript, and GSAP.

---

## ✨ What is this?

A hand-crafted web experience that tells a story through **960 WebP frames** driven by the user's scroll. It unfolds like a film — year by year — and ends with a fully immersive interactive finale.

Think: Apple product page × a personal love letter.

---

## 🎬 Experience Flow

| Stage | Description |
|---|---|
| 🎁 **Gift Wrap Intro** | A full-screen birthday wrap covers the viewport. Click it to trigger a cinematic paper-tear reveal. |
| 🎞️ **Scroll-Driven Film** | 960 WebP frames play in perfect sync with the scroll, rendering at 60FPS via Canvas. |
| 🖼️ **Photo Gallery** | Year-labeled portrait/landscape photos appear at specific scroll positions (2011 → 2026). |
| 📦 **Interactive Station** | Frame 192 pauses the film. 4 interactive boxes unlock surprise content. |
| 🎵 **Music Player** | Box 3 opens an embedded music player with 2 curated songs, playing in audio mode. |
| 💥 **Blowout Finale** | Desktop users blow out candles (button). Mobile users literally **blow into their mic**. |
| 💬 **Final Narration** | A 5-step typewriter dialogue plays over the final scene. |

---

## 🛠️ Tech Stack

- **[Vite](https://vitejs.dev/)** — blazing-fast dev server and bundler  
- **TypeScript** — strict typing throughout  
- **[GSAP](https://gsap.com/) + ScrollTrigger** — frame-perfect scroll animation  
- **Canvas 2D API** — high-performance frame rendering  
- **Sliding Window Preloader** — keeps ~150 frames in memory at any time, preventing OOM crashes  
- **Web Audio API** — microphone-based blow detection on mobile  

---

## 📁 Project Structure

```
git-commit-birthday/
├── public/
│   ├── frames/       # 960 WebP animation frames (gitignored)
│   ├── pics/         # Photo assets (gitignored)
│   └── fonts/        # Custom Grained-Demo typeface
├── src/
│   ├── main.ts       # Master timeline, all interaction logic
│   ├── preloader.ts  # Sliding-window frame cache
│   ├── renderer.ts   # Canvas 2D draw engine
│   └── style.css     # All styles, glassmorphism, animations
└── index.html        # DOM structure
```

> **Note:** `public/frames/` and `public/pics/` are excluded from this repo. Deploy locally using the Vercel CLI (`vercel --prod`) to include assets.

---

## 🚀 Running Locally

```powershell
npm install
npm run dev
```

> Requires the `public/frames/` and `public/pics/` asset folders to be present locally.

---

## 🌐 Deployment

Assets are deployed directly via **Vercel CLI** (not GitHub Actions) to keep personal photos off version control.

```powershell
vercel --prod
```

---

## 🎨 Design Highlights

- Custom **Grained-Demo** typeface throughout
- Glassmorphic overlays with backdrop blur
- Paper-tear reveal animation using dual `clip-path` polygons
- Mouse-following zoom & pan on interactive content
- Embedded iframe music player with audio-mode YouTube API hack

---

## 🔒 Privacy

All personal photos and animation frames are stored solely on Vercel's CDN and are **not committed to this repository**.

---

*Made with way too much love and GSAP. 🖤*