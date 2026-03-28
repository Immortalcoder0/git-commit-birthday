export class FramePreloader {
  totalFrames: number;
  framePath: (index: number) => string;
  cache: Map<number, HTMLImageElement> = new Map();
  loading: Set<number> = new Set();
  
  // Keep only around 150 frames in memory at a time
  // 75 ahead, 75 behind the current frame
  windowSize = 75;

  constructor(totalFrames: number, framePath: (index: number) => string) {
    this.totalFrames = totalFrames;
    this.framePath = framePath;
  }

  // Called on every scroll tick or regularly to update the window
  updateWindow(currentFrame: number) {
    const start = Math.max(0, currentFrame - this.windowSize);
    const end = Math.min(this.totalFrames - 1, currentFrame + this.windowSize);

    // Evict frames outside the window to free memory
    for (const [index, img] of this.cache.entries()) {
      if (index < start || index > end) {
        // Remove from cache to allow garbage collection
        this.cache.delete(index);
        // Setting src to empty string helps some browsers release memory instantly
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
