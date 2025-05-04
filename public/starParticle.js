import { drawStar } from "/drawStar.js";

const cnv = document.getElementById(`canvas`);
cnv.width = window.innerWidth;
cnv.height = window.innerHeight;

// CLASS: PARTICLE
class Particle {
  constructor(x, y, dirX, dirY, size, npoint) {
    // x coordinate
    this.x = x;
    // y coordinate
    this.y = y;
    // velocity along x
    this.dirX = dirX;
    // velocity along y
    this.dirY = dirY;
    // particle size
    this.size = size;
    // number of points on star
    this.n = npoint;

    // star particle
    this.starParticle = new drawStar(
      this.x,
      this.y,
      this.size - 2,
      this.size + 7,
      this.n
    );

    // Configure star oscillation (customize as needed)
    this.starParticle.setOscillation(
      0.7,
      Math.random() * (3 - 2.5) + 2.5,
      0.2 + Math.random() * 0.6
    );
  }

  // method to draw an individual particle
  draw() {
    // colour
    let colour = "#" + colours[coli];
    ctx.fillStyle = colour;

    // Update star position to match particle
    this.starParticle.cx = this.x;
    this.starParticle.cy = this.y;

    this.starParticle.update();
  }

  // check particle pos, mouse pos, move the particle and draw
  update() {
    // check particle is still within canvas
    if (this.x > cnv.width || this.x < 0) {
      // turn direction around
      this.dirX = -this.dirX;
    }
    if (this.y > cnv.height || this.y < 0) {
      // turn direction around
      this.dirY = -this.dirY;
    }

    // check for collision detection between mouse & particles
    // circle collision
    // ref: https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection

    // checking distance between mouse & particle center point
    let dx = mouse.x - this.x;
    let dy = mouse.y - this.y;

    // a^2 + b^2 = c^2
    let dist = Math.sqrt(dx * dx + dy * dy);

    // checking that particle is far enough from edge of cvs
    // or it'll get stuck
    if (dist < mouse.radius + this.size) {
      // allowing buffer area of particle size (this.size) * 10
      // if mouse is left of particle
      if (mouse.x < this.x && this.x < cnv.width - this.size * 10) {
        // move particle to the right
        this.x += 10;
      }
      // if mouse is right of particle
      if (mouse.x > this.x && this.x > this.size * 10) {
        // move particle to the left
        this.x -= 10;
      }
      // if mouse is above particle
      if (mouse.y < this.y && this.y < cnv.height - this.size * 10) {
        // move particle down
        this.y += 10;
      }
      // if mouse is under particle
      if (mouse.y > this.y && this.y > this.size * 10) {
        // move particle up
        this.x -= 10;
      }
    }
    // moving all the other particles that aren't colliding along too
    this.x += this.dirX;
    this.y += this.dirY;
    // calling draw method to update;
    this.draw();
  }
}

export { Particle };
