export class FramePreloader {
  totalFrames: number;
  framePath: (index: number) => string;
  cache: Map<number, HTMLImageElement> = new Map();
  loading: Set<number> = new Set();
  
  // High-priority caching window (immediate scroll vicinity)
  windowSize = 120; 
  stickyFrames: Set<number> = new Set();

  private backgroundPointer = 0;
  private maxBackgroundConcurrency = 1; // Strict limit to prevent saturation
  private lastWindowFrame = -1;
  private isBackgroundActive = false;

  constructor(totalFrames: number, framePath: (index: number) => string) {
    this.totalFrames = totalFrames;
    this.framePath = framePath;
    
    // Always keep the absolute start and end frames
    this.stickyFrames.add(0);
    this.stickyFrames.add(totalFrames - 1);
    
    // Priority load start and end
    this.loadFrame(0);
    this.loadFrame(totalFrames - 1);

    // Load initial 30 frames for immediate start
    for (let i = 1; i < 30; i++) {
       this.loadFrame(i);
    }
  }

  // Starts the background preloading process (call this after intro)
  startBackgroundPreload() {
    if (this.isBackgroundActive) return;
    this.isBackgroundActive = true;
    this.backgroundFill();
  }

  // Sequentially fills the cache in the background using requestIdleCallback
  private backgroundFill() {
    const fill = () => {
      if (!this.isBackgroundActive) return;

      if (this.loading.size < this.maxBackgroundConcurrency && this.backgroundPointer < this.totalFrames) {
        if (!this.cache.has(this.backgroundPointer)) {
          this.loadFrame(this.backgroundPointer);
        }
        this.backgroundPointer++;
      }

      if (this.backgroundPointer < this.totalFrames) {
        // Use requestIdleCallback if available, fallback to a healthy delay
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(fill, { timeout: 2000 });
        } else {
          setTimeout(fill, 200);
        }
      }
    };

    fill();
  }

  // Called on every scroll tick or regularly to update the window
  updateWindow(currentFrame: number) {
    if (currentFrame === this.lastWindowFrame) return;
    this.lastWindowFrame = currentFrame;

    const start = Math.max(0, currentFrame - this.windowSize);
    const end = Math.min(this.totalFrames - 1, currentFrame + this.windowSize);

    // Evict frames outside the window (unless they are sticky or too far future)
    for (const [index, img] of this.cache.entries()) {
      if (!this.stickyFrames.has(index) && (index < start || index > end)) {
        // Only evict if we are constrained? Actually for simplicity keep the sliding window
        this.cache.delete(index);
        img.src = ''; 
      }
    }

    // High priority: Load frames in the current window immediately
    for (let i = start; i <= end; i++) {
      if (!this.cache.has(i) && !this.loading.has(i)) {
        this.loadFrame(i);
      }
    }
  }

  private loadFrame(index: number) {
    if (this.cache.has(index) || this.loading.has(index)) return;

    this.loading.add(index);
    const img = new Image();
    
    img.onload = () => {
      this.cache.set(index, img);
      this.loading.delete(index);
    };
    
    img.onerror = () => {
      console.warn(`Failed to lead frame ${index}`);
      this.loading.delete(index);
    };

    img.src = this.framePath(index);
  }

  getFrame(index: number): HTMLImageElement | undefined {
    return this.cache.get(index);
  }
}
