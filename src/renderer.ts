export class CanvasRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(canvasId: string) {
    const el = document.getElementById(canvasId);
    if (!el || !(el instanceof HTMLCanvasElement)) {
      throw new Error(`Canvas with ID ${canvasId} not found`);
    }
    this.canvas = el;
    this.ctx = this.canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
    
    // Initial resize
    this.resize();
    
    // Bind resize event
    window.addEventListener('resize', this.resize.bind(this));
  }

  private resize() {
    // Handle high DPI displays for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    // We use innerWidth / innerHeight because the canvas container is fixed 100vw/100vh
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }

  // Mimics CSS object-fit: cover
  draw(img: HTMLImageElement) {
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    
    // Clear canvas
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, w, h);

    const imageRatio = img.width / img.height;
    const canvasRatio = w / h;

    let drawWidth = w;
    let drawHeight = h;
    let offsetX = 0;
    let offsetY = 0;

    if (imageRatio > canvasRatio) {
      // Image is wider than canvas
      drawHeight = h;
      drawWidth = img.width * (h / img.height);
      offsetX = (w - drawWidth) / 2;
    } else {
      // Image is taller than canvas
      drawWidth = w;
      drawHeight = img.height * (w / img.width);
      offsetY = (h - drawHeight) / 2;
    }

    this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }
}
