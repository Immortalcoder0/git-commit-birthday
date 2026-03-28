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

// --- Initial Birthday Wrap Logic ---
document.body.style.overflow = 'hidden';
const wrap = document.getElementById('birthday-wrap');
const wrapLeft = document.querySelector('.wrap-left');
const wrapRight = document.querySelector('.wrap-right');
const ribbon = document.querySelector('.birthday-ribbon');

if (wrap && wrapLeft && wrapRight && ribbon) {
  wrap.addEventListener('click', () => {
    const tl = gsap.timeline({
      onComplete: () => {
        wrap.style.display = 'none';
        document.body.style.overflow = 'auto';
        ScrollTrigger.refresh();
      }
    });

    // Animate the ribbon out first
    tl.to(ribbon, { 
      opacity: 0, 
      scale: 1.5, 
      rotate: 5,
      duration: 1, 
      ease: "power2.in" 
    });

    // Tear effect: Slide halves apart
    tl.to(wrapLeft, { 
      xPercent: -100, 
      rotate: -10, 
      duration: 2.5, 
      ease: "power2.inOut" 
    }, "-=0.5");

    tl.to(wrapRight, { 
      xPercent: 100, 
      rotate: 10, 
      duration: 2.5, 
      ease: "power2.inOut" 
    }, "<");

    // Fade the entire container at the very end just in case
    tl.to(wrap, { opacity: 0, duration: 0.5 }, "-=0.5");
  });
}

const galleryData: GalleryItem[] = [
  { year: "2011", img: "/pics/2011.jpeg", orientation: "portrait" }, // Initial pass
  { year: "2014", img: "/pics/2014.jpeg", orientation: "landscape" }, // Loop 1
  { year: "2015", img: "/pics/2015.jpeg", orientation: "portrait" }, // Loop 2
  { year: "2017", img: "/pics/2017.jpeg", orientation: "portrait" }, // Loop 3
  { year: "2022", img: "/pics/2022.jpeg", orientation: "landscape-4-3" }, // Loop 4
  { year: "2023", img: "/pics/2023.jpeg", orientation: "landscape" }, // Loop 5
  { year: "2025", img: "/pics/2025.jpeg", orientation: "portrait" }, // Loop 6
  { year: "2026", img: "/pics/2026.jpeg", img2: "/pics/2026_2.jpeg", isDual: true, orientation: "portrait" }, // Final Pass
];

type GalleryItem = {
  year: string;
  img: string;
  img2?: string;
  isDual?: boolean;
  orientation: 'portrait' | 'landscape' | 'landscape-4-3';
};

function updateGallery(index: number) {
  const data = galleryData[index];
  const yearEl = document.getElementById('gallery-year');
  const container = document.getElementById('gallery-container');
  const photoBox1 = document.getElementById('gallery-photo-box');
  const photoBox2 = document.getElementById('gallery-photo-box-2');

  if (yearEl) yearEl.innerText = data.year;

  if (container && photoBox1 && photoBox2) {
    // Reset classes and apply orientation
    container.className = 'gallery-photo-container';
    container.classList.add(`is-${data.orientation}`);
    
    if (data.isDual) {
      container.classList.add('is-dual');
      photoBox2.style.display = 'block';
      photoBox1.style.setProperty('--photo-url', `url('${data.img}')`);
      photoBox2.style.setProperty('--photo-url', `url('${data.img2}')`);
    } else {
      photoBox2.style.display = 'none';
      photoBox1.style.setProperty('--photo-url', `url('${data.img}')`);
    }
  }
}

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

// Preload the alternate stop image
const stopImg = new Image();
stopImg.src = '/frames/stop_1.png';

// Create a master timeline instead of a single tween so we can insert pauses
const masterTl = gsap.timeline({
  scrollTrigger: {
    trigger: "body",
    start: "top top",
    end: () => "+=" + (2530 * 40), // Adjusted for 6 loops + final gallery extension
    scrub: 2.5, 
    pin: "#scroll-content"
  },
  onUpdate: () => {
    // Safely clamp the calculated frame to 0-959 incase of bounce scroll
    let currentFrame = Math.round(playhead.frame);
    currentFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, currentFrame));
    
    preloader.updateWindow(currentFrame);
    
    // If we are exactly at the pause frame, draw the HD stop_1.png image ONLY if it actually loaded successfully
    if (currentFrame === 192 && stopImg.complete && stopImg.naturalWidth > 0) {
      renderer.draw(stopImg);
      return; // Skip normal renderer
    }
    
    const img = preloader.getFrame(currentFrame);
    if (img && img.complete && img.naturalWidth > 0) {
      renderer.draw(img);
    } else {
      // Robust fallback logic ensuring the image bitmap really exists
      let fallbackImg = null;
      for (let i = 1; i < 20; i++) {
        const prev = preloader.getFrame(currentFrame - i);
        const next = preloader.getFrame(currentFrame + i);
        
        fallbackImg = (prev && prev.complete && prev.naturalWidth > 0) ? prev : 
                      (next && next.complete && next.naturalWidth > 0 ? next : null);
        if (fallbackImg) break;
      }
      if (fallbackImg) {
        renderer.draw(fallbackImg);
      }
    }
  }
});

// Part 1: Scroll normally from frame 0 to frame 192
masterTl.to(playhead, {
  frame: 192,
  snap: "frame",
  ease: 'none',
  duration: 192 // Proportional time mapping
});

// Part 2: The Grand Pause at frame 192 
// We fade the boxes in, hold them, then fade them out. 
// Adding labels helps organize the timeline.
masterTl.addLabel("pauseStart")
  .to(".interactive-boxes", { autoAlpha: 1, duration: 10 }, "pauseStart")
  .to(".interactive-boxes", { autoAlpha: 0, duration: 10 }, "pauseStart+=50"); // Wait 50 units before fading out

// Part 3: Scroll from 192 up to the gallery start (345)
masterTl.to(playhead, {
  frame: 345,
  snap: "frame",
  ease: 'none',
  duration: 345 - 192
}, "pauseStart+=70");

// Add Gallery Overlay for Initial Pass (345 to 420)
// This starts at frame 345 time
masterTl.add(() => updateGallery(0), ">"); 
masterTl.to(".gallery-overlay", { autoAlpha: 1, duration: 20 }, ">");
masterTl.to(playhead, {
  frame: 420,
  snap: "frame",
  ease: 'none',
  duration: 150 // Slowed down significantly (was effectively 75)
}, "<");
masterTl.to(".gallery-overlay", { autoAlpha: 0, duration: 20 }, ">");

// Continue to 540 after gallery
masterTl.to(playhead, {
  frame: 540,
  snap: "frame",
  ease: 'none',
  duration: 540 - 420
}, ">");

// Part 4: THE LOOP (Repeat frames 400 to 540 six times)
for (let i = 0; i < 6; i++) {
  const iterationIndex = i + 1;

  // Jump back to 400 instantly
  masterTl.set(playhead, { frame: 400 }, ">");
  
  // Gallery Overlay for this loop (400 to 420)
  masterTl.add(() => updateGallery(iterationIndex), ">");
  masterTl.to(".gallery-overlay", { autoAlpha: 1, duration: 20 }, ">");
  masterTl.to(playhead, {
    frame: 420,
    snap: "frame",
    ease: 'none',
    duration: 100 // Slower progress during loop overlay
  }, "<");
  masterTl.to(".gallery-overlay", { autoAlpha: 0, duration: 20 }, ">");

  // Final part of loop animate to 540 again
  masterTl.to(playhead, {
    frame: 540,
    snap: "frame",
    ease: 'none',
    duration: 540 - 420
  }, ">");
}

// Part 5: Final Gallery Pass (Starts right before the end of the 6th loop)
// The playhead is at 540 right now. Start the fade-in slightly before 540.
masterTl.add(() => updateGallery(7), "-=20");
masterTl.to(".gallery-overlay", { autoAlpha: 1, duration: 20 }, "-=20");

// Animate playhead from 540 to 580 slowly, extending the gallery's scroll space
masterTl.to(playhead, {
  frame: 580,
  snap: "frame",
  ease: 'none',
  duration: 150 // Slowed down significantly for maximum scroll space
}, ">");

// Fade out the gallery overlay
masterTl.to(".gallery-overlay", { autoAlpha: 0, duration: 20 }, ">");

// Part 6: Final run to the end of the video
masterTl.to(playhead, {
  frame: TOTAL_FRAMES - 1,
  snap: "frame",
  ease: 'none',
  duration: TOTAL_FRAMES - 1 - 580
}, ">");

// Final CTA Fade In at the very end
masterTl.to(".final-cta", { 
  autoAlpha: 1, 
  duration: 40,
  ease: "power2.out",
  onStart: () => {
    document.querySelector('.final-cta')?.classList.add('show');
  }
}, ">-20");

masterTl.from(".cta-wrapper", {
  scale: 0.5,
  duration: 40,
  ease: "back.out(1.7)"
}, "<");

// Infinite Animation: Moving Pink Highlight (Robust Searchlight Mask)
// This rotates a white wedge in the mask counter-clockwise to reveal the pink layer
// --- Story Finale Logic ---
const yesBtn = document.getElementById("final-yes-btn");
const storyOverlay = document.getElementById("story-overlay");
const storyText = document.getElementById("story-text");
const clickPrompt = document.getElementById("click-prompt");
const storyFooter = document.getElementById("story-footer");
const sitDownBtn = document.getElementById("sit-down-btn");

let storyStep = 0;
const storySegments = [
  "Everything vanished behind the pressure of his palm, and suddenly the air felt thicker, alive with the fragrance of blooming tulips, rose and jasmine and the raw, metallic tang of rain-soaked soil. You let him steer you through the darkness until he gave a gentle nudge",
  "'Careful now,' he murmured, guiding your shoulders down until the solid edge of the chair met the back of your knees, 'just take a seat."
];

function typeWriter(text: string, element: HTMLElement, speed: number = 40) {
  element.innerHTML = "";
  let i = 0;
  return new Promise<void>((resolve) => {
    function type() {
      if (i < text.length) {
        element.innerHTML += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else {
        resolve();
      }
    }
    type();
  });
}

async function advanceStory() {
  if (storyStep === 0) {
    storyStep = 1;
    clickPrompt?.classList.add("hidden");
    await typeWriter(storySegments[0], storyText as HTMLElement);
    clickPrompt?.classList.remove("hidden");
    
    // Listen for next click anywhere on overlay
    const nextClick = () => {
      storyOverlay?.removeEventListener("click", nextClick);
      advanceStory();
    };
    storyOverlay?.addEventListener("click", nextClick);
  } else if (storyStep === 1) {
    storyStep = 2;
    clickPrompt?.classList.add("hidden");
    await typeWriter(storySegments[1], storyText as HTMLElement);
    storyFooter?.classList.remove("hidden");
  }
}

yesBtn?.addEventListener("click", () => {
  // 1. Instant Black Screen
  gsap.to(".final-cta", { opacity: 0, duration: 0.5, onComplete: () => {
    document.querySelector(".final-cta")?.classList.add("hidden");
  }});
  
  storyOverlay?.classList.remove("hidden");
  gsap.fromTo(storyOverlay, { opacity: 0 }, { opacity: 1, duration: 1 });

  // 2. After 2 seconds, start narration
  gsap.delayedCall(2, () => {
    advanceStory();
  });
});

// "Sit Down" final action: EYE REVEAL & BLOWOUT INTERACTION
sitDownBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  
  const finalScene = document.getElementById("final-scene");
  const burningVideo = document.getElementById("burning-video") as HTMLVideoElement;
  
  // 1. Transition story to final scene
  gsap.to(storyOverlay, { opacity: 0, duration: 1.5, onComplete: () => {
    storyOverlay?.classList.add("hidden");
  }});

  finalScene?.classList.remove("hidden");
  burningVideo.play();

  // 2. "Opening Eyes" Animation
  const tl = gsap.timeline();
  tl.to(".eyelid.top", { height: 0, duration: 3, ease: "power2.inOut" }, 0.5)
    .to(".eyelid.bottom", { height: 0, duration: 3, ease: "power2.inOut" }, 0.5)
    .to(".burning-video", { filter: "blur(0px)", duration: 4, ease: "power1.inOut", onComplete: () => {
      // 3. Init Blowout interaction based on device
      initBlowoutInteraction();
    } }, 0.5);
});

// Blowout Logic
function triggerBlowout() {
  const blowoutBtn = document.getElementById("blowout-btn");
  if (blowoutBtn) knockout(blowoutBtn);

  const burningVideo = document.getElementById("burning-video");
  const blowoutVideo = document.getElementById("blowout-video") as HTMLVideoElement;

  blowoutVideo.classList.remove("hidden");
  
  const startFinalTransition = () => {
    const finalPic = document.getElementById("final-pic");
    finalPic?.classList.remove("hidden");
    
    gsap.to(finalPic, { opacity: 1, duration: 2, ease: "power2.inOut", onComplete: () => {
      startFinalNarration();
    }});
  };

  // Wait for the short blowout clip to finish, then crossfade to the final picture
  blowoutVideo.addEventListener('ended', startFinalTransition, { once: true });
  
  // Robust Fallback: if video fails to play or is missing, just transition
  blowoutVideo.onerror = startFinalTransition;

  blowoutVideo.play().catch(() => {
    console.warn("Blowout video failed to play, skipping to final picture.");
    startFinalTransition();
  });

  gsap.to(burningVideo, { opacity: 0, duration: 0.5 });
  gsap.to(blowoutVideo, { opacity: 1, duration: 0.5 });
}

function knockout(el: HTMLElement) {
  gsap.to(el, { opacity: 0, duration: 0.5, onComplete: () => el.classList.add("hidden") });
}

function initBlowoutInteraction() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    initMicDetection();
  } else {
    // Show Desktop Button
    const blowoutBtn = document.getElementById("blowout-btn");
    blowoutBtn?.classList.remove("hidden");
    blowoutBtn?.addEventListener("click", triggerBlowout);
  }
}

async function initMicDetection() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // @ts-ignore - Prefix for older Safari
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let blowCounter = 0;

    function checkVolume() {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      let average = sum / bufferLength;

      // Threshold tuning (50 is generally decent for a puff of air directly to phone mic)
      if (average > 60) {
        blowCounter++;
        if (blowCounter > 15) { // Needs sustained input for approx 250ms (~15 frames at 60fps)
          triggerBlowout();
          // Clean up hardware access
          stream.getTracks().forEach(track => track.stop());
          return; // Stop the loop
        }
      } else {
        blowCounter = Math.max(0, blowCounter - 1);
      }
      requestAnimationFrame(checkVolume);
    }
    
    checkVolume(); // Start loop
  } catch (err) {
    console.warn("Microphone access denied or failed. Falling back to button.", err);
    // Fallback if mic is blocked on mobile
    const blowoutBtn = document.getElementById("blowout-btn");
    blowoutBtn?.classList.remove("hidden");
    blowoutBtn?.addEventListener("click", triggerBlowout);
  }
}

// --- Frame 192: Enhanced Box Interaction ---
const boxOverlay = document.getElementById("box-overlay");
const overlayImg = document.getElementById("overlay-img") as HTMLImageElement;
const overlayText = document.getElementById("overlay-text");
const overlayContent = document.querySelector(".overlay-content") as HTMLElement;
const overlayClose = document.querySelector(".overlay-close");
const overlayMusic = document.getElementById("overlay-music");

const songSelection = document.getElementById("song-selection");
const iframeContainer = document.getElementById("iframe-container");
const playerFrameWrapper = document.getElementById("player-frame-wrapper");
const backToSongsBtn = document.getElementById("back-to-songs");

let currentActiveBox = 0;
let overlayStep = 1; // 1: Cover, 2: Reveal
let currentZoom = 1;

const boxContentMap: any = {
  1: { type: 'img', src: '/pics/bday.png' },
  2: { type: 'img', src: '/pics/Wish.png' },
  3: { type: 'music' }, // Integrated Music Player
  4: { type: 'img', src: '/pics/last.png' }
};

function resetMusicView() {
  if (songSelection && iframeContainer && playerFrameWrapper) {
    songSelection.classList.remove("hidden");
    iframeContainer.classList.add("hidden");
    playerFrameWrapper.innerHTML = ''; // Destroy iframe to stop audio
  }
}

function updateZoom() {
  if (overlayImg && overlayStep === 2 && boxContentMap[currentActiveBox].type === 'img') {
    if (currentZoom === 1) {
      gsap.to(overlayImg, { scale: 1, x: 0, y: 0, duration: 0.4, ease: "power2.out" });
    } else {
      gsap.to(overlayImg, { scale: currentZoom, duration: 0.4, ease: "power2.out" });
    }
  }
}

function handleOverlayMouseMove(e: MouseEvent) {
  if (currentZoom > 1 && overlayImg && overlayStep === 2 && boxContentMap[currentActiveBox].type === 'img') {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    // Calculate offset from center (-0.5 to 0.5)
    const offsetX = (clientX / innerWidth) - 0.5;
    const offsetY = (clientY / innerHeight) - 0.5;
    
    // Move the image in the opposite direction of the mouse to simulate panning the view
    // The multiplier controls the "pan strength"
    const panStrength = 150 * currentZoom; 
    gsap.to(overlayImg, {
      x: -offsetX * panStrength,
      y: -offsetY * panStrength,
      duration: 0.2,
      ease: "power1.out"
    });
  }
}

function openBox(boxNum: number) {
  currentActiveBox = boxNum;
  overlayStep = 1;
  currentZoom = 1;
  updateZoom();
  resetMusicView();

  // Reset to cover
  overlayImg.src = "/pics/cover.png";
  overlayImg.classList.remove("hidden");
  overlayText?.classList.add("hidden");
  overlayMusic?.classList.add("hidden");

  boxOverlay?.classList.remove("hidden");
  setTimeout(() => boxOverlay?.classList.add("show"), 10);
}

function closeBox() {
  boxOverlay?.classList.remove("show");
  setTimeout(() => boxOverlay?.classList.add("hidden"), 500);
  currentZoom = 1;
  updateZoom();
  resetMusicView();
}

function advanceBoxOverlay() {
  if (overlayStep === 1) {
    // Step 1 -> 2: Reveal
    overlayStep = 2;
    const content = boxContentMap[currentActiveBox];
    
    if (content.type === 'img') {
      overlayImg.src = content.src;
      overlayImg.classList.remove("hidden");
      overlayText?.classList.add("hidden");
      overlayMusic?.classList.add("hidden");
    } else if (content.type === 'music') {
      overlayImg.classList.add("hidden");
      overlayText?.classList.add("hidden");
      overlayMusic?.classList.remove("hidden");
    } else {
      overlayImg.classList.add("hidden");
      overlayMusic?.classList.add("hidden");
      if (overlayText) {
        overlayText.innerHTML = content.content;
        overlayText.classList.remove("hidden");
      }
    }
    gsap.fromTo(overlayContent, { opacity: 0.5 }, { opacity: 1, duration: 0.5, ease: "power2.out" });
  } else if (overlayStep === 2 && boxContentMap[currentActiveBox].type === 'img') {
    // Step 2: Toggle Zoom (Only applies to images)
    currentZoom = (currentZoom === 1) ? 2.2 : 1;
    updateZoom();
  }
}

// Attach listeners
for (let i = 1; i <= 4; i++) {
  document.getElementById(`box-${i}`)?.addEventListener("click", (e) => {
    e.stopPropagation();
    openBox(i);
  });
}

// Iframe Music Player Logic
document.querySelectorAll('.song-card').forEach((card) => {
  card.addEventListener("click", (e) => {
    e.stopPropagation();
    const vid = (card as HTMLElement).dataset.vid;
    if (vid && songSelection && iframeContainer && playerFrameWrapper) {
      songSelection.classList.add("hidden");
      iframeContainer.classList.remove("hidden");
      playerFrameWrapper.innerHTML = `<iframe src="https://funk-volume-changer.vercel.app/?v=${vid}&mode=audio" allow="autoplay; encrypted-media"></iframe>`;
    }
  });
});

backToSongsBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  resetMusicView();
});

overlayContent?.addEventListener("click", (e) => {
  // Prevent click-to-zoom if clicking inside iframe or back button
  if ((e.target as HTMLElement).closest('#iframe-container')) return;
  e.stopPropagation();
  advanceBoxOverlay();
});

boxOverlay?.addEventListener("mousemove", (e) => {
  handleOverlayMouseMove(e as MouseEvent);
});

overlayClose?.addEventListener("click", (e) => {
  e.stopPropagation();
  closeBox();
});

// --- Final Narration Logic (Birthday Surprise) ---
const finalDialogues = [
  "Happy birthday My beloved lady",
  "It is Birthday of my special one, that's you. I cant explain how excited I really am for u to see this.",
  "Today i should have been with u , celebrating the day, but I couldn't so to make your day special ... This was a small gift from me...",
  "I wanted to give u something no one had ever thought of giving u ... sooo i thought of this, also to make this more special, i included me 😘",
  "Happy Birthday Darling  🩷 ❤️ ❤️ 💖 🫂"
];

let finalStepIndex = 0;
let isTypingFinal = false;

async function startFinalNarration() {
  const speechBubble = document.getElementById("final-speech-bubble");
  const speechText = document.getElementById("final-speech-text");
  
  if (!speechBubble || !speechText) return;

  speechBubble.classList.remove("hidden");
  
  // Initial entrance of bubble
  gsap.fromTo(speechBubble, 
    { opacity: 0, y: 30, scale: 0.8 }, 
    { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: "back.out(1.7)" }
  );

  const advance = async () => {
    if (isTypingFinal || finalStepIndex >= finalDialogues.length) return;
    
    isTypingFinal = true;
    await typeWriter(finalDialogues[finalStepIndex], speechText, 50);
    isTypingFinal = false;
    finalStepIndex++;

    if (finalStepIndex === finalDialogues.length) {
      // Show the "Read the letters" button
      const readLettersBtn = document.getElementById("read-letters-btn");
      readLettersBtn?.classList.remove("hidden");
      gsap.fromTo(readLettersBtn, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, delay: 1 });
    }
  };

  // Click on the entire final scene to advance
  const finalScene = document.getElementById("final-scene");
  finalScene?.addEventListener("click", (e) => {
    e.stopPropagation();
    advance();
  });

  // Start first dialogue automatically
  advance();
}

