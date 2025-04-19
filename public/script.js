// document styling
document.body.style.margin = 0;
document.body.style.overflow = `hidden`;

// setting up canvas
const cnv = document.getElementById(`canvas`);
cnv.width = window.innerWidth;
cnv.height = window.innerHeight;

const ctx = cnv.getContext(`2d`);

// vars
let particleArr;

// grab mouse position
let mouse = {
  x: null,
  y: null,
  // the radius will give the particles an area around the
  // mouse which they interact/react with
  radius: (cnv.height / 200) * (cnv.width / 200),
};

// event listener will fire every time the mouse moves and
// fills the mouse object
window.addEventListener("mousemove", function (event) {
  mouse.x = event.x;
  mouse.y = event.y;
});

// CREATE PARTICLE CLASS
class Particle {
  constructor(x, y, dirX, dirY, size, colour, opacityCol) {
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
    // particle colour
    this.colour = colour;
  }

  // method to draw an individual particle
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
    ctx.fillStyle = "rgb(243, 249, 210)";
    //console.log(ctx.fillStyle);
    ctx.fill();
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

    if (dist < mouse.radius + this.size) {
      // checking that particle is far enough from edge of cvs
      // or it'll get stuck
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

// FUNC TO RANDOMISE VALUES FOR PARTICLES
function init() {
  particleArr = [];
  // number of particles
  let numOf = (cnv.height * cnv.width) / 8000;

  for (let i = 0; i < numOf; i++) {
    // size of particle = random val between 1 & 5
    let size = Math.random() * (5 - 1) + 1;
    // x coord = random value between 0 and cnv width
    // with size * 2 as buffer so it doesn't get stuck
    let x =
      Math.random() * (cnv.width - size * 2 - (0 + size * 2)) + 0 + size * 2;
    let y =
      Math.random() * (cnv.height - size * 2 - (0 + size * 2)) + 0 + size * 2;

    // particle movement speed between -2.5 and 1.5
    let dirX = Math.random() * (1.5 + 2.5) - 2.5;
    let dirY = Math.random() * (1.5 + 2.5) - 2.5;

    // randomising alpha value
    let opacityCol = Math.random() * (0.9 - 0.4) + 0.4;
    // colour
    let colour = "rgb(243, 249, 210," + opacityCol + ")";

    // pushing a new instance of Particle with the above defined values
    // into particle array
    particleArr.push(new Particle(x, y, dirX, dirY, size, colour));
  }
}

// checking if particles are close enough to connect
function connect() {
  let opacityVal = 0.7;
  // go through every particle
  for (let a = 0; a < particleArr.length; a++) {
    // going through consecutive particles in array
    for (let b = 0; b < particleArr.length; b++) {
      let dist =
        (particleArr[a].x - particleArr[b].x) *
          (particleArr[a].x - particleArr[b].x) +
        (particleArr[a].y - particleArr[b].y) *
          (particleArr[a].y - particleArr[b].y);

      // the smaller the number, the longer the lines,
      // the more particles connected
      if (dist < (cnv.width / 5) * (cnv.height / 5)) {
        opacityVal = 0.7 - dist / 5000;
        ctx.strokeStyle = "rgba(51, 65, 57," + opacityVal + ")";
        let sig = calcSignal();
        ctx.lineWidth = 1 * sig;
        //console.log(ctx.lineWidth);
        ctx.beginPath();
        ctx.moveTo(particleArr[a].x, particleArr[a].y);
        ctx.lineTo(particleArr[b].x, particleArr[b].y);
        ctx.stroke();
      }
    }
  }
}

// ANIMATION LOOP
function animate() {
  requestAnimationFrame(animate);
  // clearing previous frame
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  //ctx.fillStyle = "rgb(255 141 161)";
  ctx.fillStyle = "rgb(183, 93, 105)";
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  // call update method for each individula particle
  for (let i = 0; i < particleArr.length; i++) {
    particleArr[i].update();
  }
  connect();
}

// call init fill array with randomised particles
init();
// call animate
animate();

function calcSignal() {
  const t = 1 / 1000;
  const p = (t / 9) % 1;

  // calculate triangle wave signal
  let sig = 1 - Math.abs(p * 2 - 1) * 2;

  // exponentiate signal
  sig = sig ** (1 / 3);

  return sig;
}

// web responsive
onresize = () => {
  cnv.width = innerWidth;
  cnv.height = innerHeight;
  mouse.radius = (cnv.height / 200) * (cnv.width / 200);
  init();
};

// mouse out event
// particles stop trying to interact with mouse when it leaves canvas
window.addEventListener("mouseout", function () {
  mouse.x = undefined;
  mouse.y = undefined;
});
