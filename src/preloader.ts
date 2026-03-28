export class FramePreloader {
  totalFrames: number;
  framePath: (index: number) => string;
  cache: Map<number, HTMLImageElement> = new Map();
  loading: Set<number> = new Set();
  
  // High-priority caching window (immediate scroll vicinity)
  windowSize = 150; 
  stickyFrames: Set<number> = new Set();

  private backgroundPointer = 0;
  private maxBackgroundConcurrency = 3;
  private lastWindowFrame = -1;

  constructor(totalFrames: number, framePath: (index: number) => string) {
    this.totalFrames = totalFrames;
    this.framePath = framePath;
    
    // Always keep the absolute start and end frames
    this.stickyFrames.add(0);
    this.stickyFrames.add(totalFrames - 1);
    
    // Priority load start and end
    this.loadFrame(0);
    this.loadFrame(totalFrames - 1);

    // Initial buffer: Load the first 60 frames immediately for a smooth start
    for (let i = 1; i < 60; i++) {
       this.loadFrame(i);
    }

    // Kick off background preloading with a slight delay to allow UI to breathe
    setTimeout(() => this.backgroundFill(), 2000);
  }

  // Sequentially fills the cache in the background
  private async backgroundFill() {
    while (this.backgroundPointer < this.totalFrames) {
      if (this.loading.size < this.maxBackgroundConcurrency && !this.cache.has(this.backgroundPointer)) {
        this.loadFrame(this.backgroundPointer);
        this.backgroundPointer++;
      }
      // Wait a tiny bit between checks to not block the main thread
      await new Promise(r => setTimeout(r, 50));
    }
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
