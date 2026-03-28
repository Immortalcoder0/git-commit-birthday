import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FramePreloader } from './preloader';
import { CanvasRenderer } from './renderer';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 960; // Configured based on user specs
// Frame path format assumes frames are in public/frames/ named frame_0001.webp etc.
// Adjust this function based on the actual file naming!
const getFramePath = (index: number) => {
  // Add 1 because GSAP animates from 0-959 but files are 0001-0960
  const paddedIndex = (index + 1).toString().padStart(4, '0');
  return `/frames/frame_${paddedIndex}.webp`;
};

const preloader = new FramePreloader(TOTAL_FRAMES, getFramePath);
const renderer = new CanvasRenderer('hero-lightpass');

// Object to hold the current frame index for GSAP to animate
const playhead = { frame: 0 };

// Initial window populate
preloader.updateWindow(0);

// Try to render the first frame as soon as it loads
const checkFirstFrame = setInterval(() => {
  const initialImg = preloader.getFrame(0);
  if (initialImg && initialImg.complete) {
    renderer.draw(initialImg);
    clearInterval(checkFirstFrame);
  }
}, 50);

// Create the overall timeline scrubbing for the frames
gsap.to(playhead, {
  frame: TOTAL_FRAMES - 1,
  snap: "frame", // ensure frame is an integer
  ease: 'none',
  scrollTrigger: {
    trigger: "body",
    start: "top top",
    end: () => "+=" + (TOTAL_FRAMES * 40), // e.g. 38,400px of extreme scrolling distance
    scrub: 2.5, // 2.5s smoothing effect - makes scrolling feel heavier
    pin: "#scroll-content", // Pin the text container in place!
    onUpdate: () => {
      // Called roughly 60FPS while scrubbing
      const currentFrame = Math.round(playhead.frame);
      
      // Update memory window (load ahead, dump behind)
      preloader.updateWindow(currentFrame);
      
      // Get the frame and draw it
      const img = preloader.getFrame(currentFrame);
      if (img && img.complete) {
        renderer.draw(img);
      } else {
        // Fallback: if the exact frame isn't loaded yet, try to find the nearest loaded frame
        // This prevents the screen from going black if the user scrolls too fast.
        let fallbackImg = null;
        for (let i = 1; i < 15; i++) {
          fallbackImg = preloader.getFrame(currentFrame - i) || preloader.getFrame(currentFrame + i);
          if (fallbackImg && fallbackImg.complete) break;
        }
        if (fallbackImg) renderer.draw(fallbackImg);
      }
    }
  }
});

// Syncing HTML overlays to the absolute body timeline
// Step 1 disappears quickly
gsap.to(".step-1", {
  opacity: 0,
  y: -50,
  ease: "power1.inOut",
  scrollTrigger: {
    trigger: "body",
    start: "top top", 
    end: () => "+=" + (TOTAL_FRAMES * 4), // Fades out over the first 4x frames of scrolling
    scrub: true
  }
});

// Step 2 appears midway
gsap.fromTo(".step-2", 
  { opacity: 0, scale: 0.9, y: 50 }, 
  {
    opacity: 1, 
    scale: 1, 
    y: 0,
    ease: "power2.out",
    scrollTrigger: {
      trigger: "body",
      start: () => "+=" + (TOTAL_FRAMES * 13), // Starts appearing at 33% progress
      end: () => "+=" + (TOTAL_FRAMES * 17), 
      scrub: true
    }
  }
);
gsap.to(".step-2", {
  opacity: 0,
  y: -50,
  ease: "power1.inOut",
  scrollTrigger: {
    trigger: "body",
    start: () => "+=" + (TOTAL_FRAMES * 24), // Disappears around 60% progress
    end: () => "+=" + (TOTAL_FRAMES * 28), 
    scrub: true
  }
});

// Step 3 appears near the end
gsap.fromTo(".step-3", 
  { opacity: 0, y: 50 }, 
  {
    opacity: 1, 
    y: 0, 
    ease: "power2.out",
    scrollTrigger: {
      trigger: "body",
      start: () => "+=" + (TOTAL_FRAMES * 32), // Appears at 80% progress
      end: () => "+=" + (TOTAL_FRAMES * 36), 
      scrub: true
    }
  }
);
