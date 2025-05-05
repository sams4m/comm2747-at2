// setting up canvas
const cnv = document.getElementById(`canvas`);
cnv.width = window.innerWidth;
cnv.height = window.innerHeight;

const ctx = cnv.getContext(`2d`);

class drawStar {
  constructor(cx, cy, r1, r2, n) {
    // original x coord
    this.cx = cx;
    // original y coord
    this.cy = cy;
    // new x coord
    this.x = cx;
    // new y coord
    this.y = cy;
    // new inner radius
    this.nR1 = r1;
    // new outer radius
    this.nR2 = r2;
    // current inner radius
    this.r1 = r1;
    // current outer radius
    this.r2 = r2;
    // number of points
    this.n = n;

    // maths
    // starting angle
    this.rot = (Math.PI / 2) * 3;
    // angle between each point
    this.step = Math.PI / n;

    // oscillation par
    // minimum scale factor (50%)
    this.minScale = 0.5;
    // maximum scale factor (150%)
    this.maxScale = 1.5;
    // oscillations per second
    this.freq = 0.5;

    // track start time from when star is created in ms
    this.startT = Date.now();
  }

  // FUNC: TRIANGLE WAVE (0 to 1)
  calcWave() {
    // real elapsed time; seconds
    const elapsedT = (Date.now() - this.startT) / 1000;
    // period = time to create one cycle
    const period = 1 / this.freq;
    // normalized val of time along triangle wave
    const t = (elapsedT % period) / period;
    // If t < 0.5 (first half of the cycle): t * 2 (create line from 0 to 1)
    // If t ≥ 0.5 (second half of the cycle): 2 * (1 - t) (create line from 1 down to 0)
    return t < 0.5 ? 2 * t : 2 * (1 - t);
  }

  draw() {
    ctx.beginPath();
    // reset rotation angle for each draw
    this.rot = (Math.PI / 2) * 3;

    // move to starting star point
    ctx.moveTo(this.cx, this.cy - this.r2);
    // keep repeating process until n points (full circle )
    for (let i = 0; i < this.n; i++) {
      // new x , y; next inner corner
      this.x = this.cx + Math.cos(this.rot) * this.r2;
      this.y = this.cy + Math.sin(this.rot) * this.r2;
      ctx.lineTo(this.x, this.y);
      // moving angle along
      this.rot += this.step;

      // new x, y; next outer point
      this.x = this.cx + Math.cos(this.rot) * this.r1;
      this.y = this.cy + Math.sin(this.rot) * this.r1;
      ctx.lineTo(this.x, this.y);
      this.rot += this.step;
    }
    // closing up star
    ctx.lineTo(this.cx, this.cy - this.r2);
    ctx.closePath();

    // fill star
    ctx.fill();
  }

  update() {
    // Calculate the scale factor using triangle wave
    const sig = this.calcWave();
    const scaleF = this.minScale + sig * (this.maxScale - this.minScale);

    // Apply scale to radii
    this.r1 = this.nR1 * scaleF;
    this.r2 = this.nR2 * scaleF;

    this.draw();
  }

  // Method to change oscillation par
  setOscillation(minScale, maxScale, frequency) {
    this.minScale = minScale;
    this.maxScale = maxScale;
    this.freq = frequency;
  }
}

export { drawStar };
