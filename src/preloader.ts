export class FramePreloader {
  totalFrames: number;
  framePath: (index: number) => string;
  cache: Map<number, HTMLImageElement> = new Map();
  loading: Set<number> = new Set();
  
  // Keep around 200 frames in memory (100 ahead, 100 behind)
  windowSize = 100;
  stickyFrames: Set<number> = new Set();

  constructor(totalFrames: number, framePath: (index: number) => string) {
    this.totalFrames = totalFrames;
    this.framePath = framePath;
    
    // Always keep the absolute start and end frames in memory to prevent black screen flickers
    this.stickyFrames.add(0);
    this.stickyFrames.add(totalFrames - 1);
    
    // Preload them immediately
    this.loadFrame(0);
    this.loadFrame(totalFrames - 1);
  }

  // Called on every scroll tick or regularly to update the window
  updateWindow(currentFrame: number) {
    const start = Math.max(0, currentFrame - this.windowSize);
    const end = Math.min(this.totalFrames - 1, currentFrame + this.windowSize);

    // Evict frames outside the window (unless they are sticky)
    for (const [index, img] of this.cache.entries()) {
      if (!this.stickyFrames.has(index) && (index < start || index > end)) {
        this.cache.delete(index);
        img.src = ''; 
      }
    }

    // Start loading new frames in the window
    for (let i = start; i <= end; i++) {
      if (!this.cache.has(i) && !this.loading.has(i)) {
        this.loadFrame(i);
      }
    }
  }

  private loadFrame(index: number) {
    this.loading.add(index);
    const img = new Image();
    
    img.onload = () => {
      this.cache.set(index, img);
      this.loading.delete(index);
    };
    
    img.onerror = () => {
      this.loading.delete(index);
    };

    img.src = this.framePath(index);
  }

  getFrame(index: number): HTMLImageElement | undefined {
    return this.cache.get(index);
  }
}
