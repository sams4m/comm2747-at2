import { drawStar } from "/drawStar.js";
import { colours } from "./colour.js";
import { shaderMaterial } from "./shader.js";
import * as THREE from "/three.js";
import { OrbitControls } from "/OrbitControls.js";

// document styling
document.body.style.margin = 0;
document.body.style.overflow = `hidden`;

// setting up canvas
const cnv = document.getElementById(`canvas`);
cnv.width = window.innerWidth;
cnv.height = window.innerHeight;

const ctx = cnv.getContext(`2d`);

// Set up scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7252dc);
const camera = new THREE.PerspectiveCamera(
  50,
  cnv.width / cnv.height,
  0.01,
  10
);
camera.position.z = 2;
const renderer = new THREE.WebGLRenderer({ antialias: true });
const clock = new THREE.Clock();

// Setup renderer
// size of renderer
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// styling
renderer.domElement.style.position = "absolute";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.zIndex = "-1";

// ----------------------------------------------------------------------- //
// sound
const audioContext = new AudioContext();
// suspend until click
audioContext.suspend();
// volume controls
const gainNode = audioContext.createGain();
// audio
const audioE = new Audio("weird.wav");
audioE.load();
const source = audioContext.createMediaElementSource(audioE);
// connect audio element to gain node
source.connect(gainNode);
// Connect Gain Node to Destination
gainNode.connect(audioContext.destination);
// preset value ; set at 50%
gainNode.gain.value = 0.5;

// ----------------------------------------------------------------------- //
// GLOBAL VARS
let particleArr = [],
  coli = 0,
  mesh;

// global glitch vars
// set default as not glitching
let globalGlitchEvent = false;
// glitch in 10-25 seconds
let nextGlobalGlitchTime =
  clock.getElapsedTime() * 1000 + (Math.random() * 15000 + 10000);
// initialise end time = 0
let globalGlitchEndTime = 0;

// MOUSE OBJ; tracks mouse x, y coord
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

// ----------------------------------------------------------------------- //
// CLASS: PARTICLE
class Particle {
  constructor(x, y, dirX, dirY, size, npoint) {
    // movement related properties
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

    // glitch related properties
    // set initial state to false
    this.isGlitching = false;
    // set initial time using Three.js clock
    const startTime = clock.getElapsedTime() * 1000;
    // set first glitch to happen between 2 - 10 seconds from now
    this.nextGlitchTime = startTime + (Math.random() * (60000 - 2000) + 2000);
    // defined when glitching starts
    this.glitchEndTime = 0;

    // star particle
    // number of points on star
    this.n = npoint;
    this.starParticle = new drawStar(
      this.x,
      this.y,
      this.size - 2,
      this.size + 7,
      this.n
    );

    // star oscillation
    // setOscillation(minScale 0.7,
    // maxScale random val between 2.5 and 3, frequency)
    this.starParticle.setOscillation(
      0.7,
      Math.random() * (3 - 2.5) + 2.5,
      0.2 + Math.random() * 0.6
    );
  }

  // method to draw an individual particle
  draw() {
    // only draw if not glitching
    if (!this.isGlitching) {
      // colour
      let colour = "#" + colours[coli];
      ctx.fillStyle = colour;

      // Update star position to match particle
      this.starParticle.cx = this.x;
      this.starParticle.cy = this.y;

      // calling update
      this.starParticle.update();
    }
  }

  // METHOD: glitch effect
  glitchHandle() {
    // get current time in ms
    const currentTime = clock.getElapsedTime() * 1000;

    // if currently glitching
    if (this.isGlitching) {
      // check if glitch duration is over by comparing timestamps
      // if more than duration (end time)
      if (currentTime > this.glitchEndTime) {
        // glitch = false
        this.isGlitching = false;
        // set next glitch time in 2 - 10 seconds
        this.nextGlitchTime =
          currentTime + (Math.random() * (60000 - 2000) + 2000);
      }
    }
    // if not glitching - check if time to glitch
    // if current time stamp is greater than next glitch time
    // means should be glitching
    else if (currentTime > this.nextGlitchTime) {
      this.isGlitching = true;
      // set glitch end time; random between 2 - 10 seconds
      this.glitchEndTime =
        currentTime + (Math.random() * (60000 - 2000) + 2000);
    }
  }

  // check particle pos, mouse pos, move the particle and draw
  update() {
    // call glitch handle method
    this.glitchHandle();

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

// ----------------------------------------------------------------------- //
// INIT: RANDOMISE VALUES FOR PARTICLES
function init() {
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

    // particle movement speed between -0.5 and 0.5
    let dirX = Math.random() * (1 + 0.5) - 0.5;
    let dirY = Math.random() * (1 + 0.5) - 0.5;

    // number of points on star
    // random value between 7 and 15
    let n = Math.random() * (15 - 7) + 7;

    // pushing a new instance of Particle with the above defined values
    // into particle array
    particleArr.push(new Particle(x, y, dirX, dirY, size, n));
  }

  // // create a torus knot
  const geometry = new THREE.TorusKnotGeometry(5, 3, 40, 15, 14, 4);
  mesh = new THREE.Mesh(geometry, shaderMaterial);
  // Clear scene of previous meshes
  if (mesh) scene.remove(mesh);
  scene.add(mesh);

  // add light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
}

// FUNC: CONNECT
// checking if particles are close enough to connect
function connect() {
  let opacityVal = 0.7;
  // go through every particle
  for (let a = 0; a < particleArr.length; a++) {
    // if star is glitching skip
    if (particleArr[a].isGlitching) continue;
    // going through consecutive particles in array
    for (let b = 0; b < particleArr.length; b++) {
      // if star is glitching skip
      if (particleArr[b].isGlitching) continue;
      let dist =
        (particleArr[a].x - particleArr[b].x) *
          (particleArr[a].x - particleArr[b].x) +
        (particleArr[a].y - particleArr[b].y) *
          (particleArr[a].y - particleArr[b].y);

      // the smaller the number, the longer the lines,
      // the more particles connected
      if (dist < (cnv.width / 2) * (cnv.height / 2)) {
        opacityVal = 0.7 - dist / 9000;
        ctx.strokeStyle = "rgba(51, 65, 57," + opacityVal + ")";
        ctx.lineWidth = 1;
        //console.log(ctx.lineWidth);
        ctx.beginPath();
        ctx.moveTo(particleArr[a].x, particleArr[a].y);
        ctx.lineTo(particleArr[b].x, particleArr[b].y);
        ctx.stroke();
      }
    }
  }
}

// ----------------------------------------------------------------------- //

// ANIMATION LOOP
function animate() {
  // call to check global glitch
  globalGlitchHandle();

  // if global glitch is active
  if (globalGlitchEvent === true) {
    // setting background as random colour
    const i = Math.floor(Math.random() * colours.length);
    // clearing rect frame
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    // colour
    ctx.fillStyle = colours[i];
    // draw rect
    ctx.fillRect(0, 0, innerWidth, innerHeight);
  }

  // Rotate three.js scene
  if (mesh) {
    mesh.rotation.x += 0.005;
    mesh.rotation.y += 0.01;
  }

  // updating uniform var in shader with the elapsed time of animation
  shaderMaterial.uniforms.u_time.value = clock.getElapsedTime();
  // render scene
  renderer.render(scene, camera);

  // update each star particle
  particleArr.forEach((e) => {
    e.update();
  });

  // call the connect func to draw lines
  connect();

  requestAnimationFrame(animate);
}

// call init fill array with randomised particles
init();
// call animate
animate();

// ----------------------------------------------------------------------- //
// web responsive
onresize = () => {
  cnv.width = innerWidth;
  cnv.height = innerHeight;
  mouse.radius = (cnv.height / 200) * (cnv.width / 200);

  // Update renderer and camera
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  init();
};

// ----------------------------------------------------------------------- //
// mouse out event
// particles stop trying to interact with mouse when it leaves canvas
window.addEventListener("mouseout", function (mouse_event) {
  mouse.x = undefined;
  mouse.y = undefined;
});

// ----------------------------------------------------------------------- //
// CLICK EVENT HANDLER
// new var to hold new colour index
let newColi;
cnv.addEventListener("click", function cnvClicked() {
  console.log("screen clicked");
  // COLOUR
  // change colour index
  coli = coliRandomiser();
  console.log(coli);

  // GLITCH (20% CHANCE)

  if (Math.random() < 0.2 && !globalGlitchEvent) {
    // start glitch
    globalGlitchEvent = true;
    // set a random end time between 500-1500ms
    globalGlitchEndTime =
      clock.getElapsedTime() * 1000 + (Math.random() * (1500 - 500) + 500);
  }

  // SOUND
  if (audioContext.state == "suspended") {
    audioContext.resume();
  } else {
    audioE.play();
    let soundRatio = mouse.x / cnv.width;

    gainNode.gain.value = soundRatio;
  }
});

// ----------------------------------------------------------------------- //
// FUNC: RANDOM COLOUR INDEX
function coliRandomiser() {
  // compute random colour index
  newColi = Math.floor(Math.random() * colours.length);

  // if the new random index == the current index number
  // call the function again to get a new random index number
  // that is different
  if (newColi == coli) {
    console.log("call recursive");
    return coliRandomiser();
  } else {
    // return new random index
    //randCol= r;
    return newColi;
  }
}

// ----------------------------------------------------------------------- //
// FUNC: GLOBAL ANIMATION GLITCH HANDLE
function globalGlitchHandle() {
  // get current time in ms
  const currentTime = clock.getElapsedTime() * 1000;

  // If glitch is active
  if (globalGlitchEvent === true) {
    // check if glitch should end
    // if current time is greater than end time
    if (currentTime > globalGlitchEndTime) {
      // set glitch to false
      globalGlitchEvent = false;

      // restart the animation
      console.log("restarting animation");

      // clear particle array
      particleArr = [];

      // Clear scene
      if (mesh) scene.remove(mesh);

      // re-initialize everything
      init();

      // updating uniform var in shader with the elapsed time of animation
      shaderMaterial.uniforms.u_time.value = clock.getElapsedTime();
      // render scene
      renderer.render(scene, camera);

      // Set next global glitch time - random val between 30-90 seconds
      nextGlobalGlitchTime =
        currentTime + (Math.random() * (90000 - 30000) + 30000);
    }
  }
  // if not in a global glitch state
  // check if current time is more than next glitch time
  // meaning it should be glitching
  else if (currentTime > nextGlobalGlitchTime) {
    console.log("global glitch true");
    // set glitch event to true
    globalGlitchEvent = true;

    // set a random end time between 500-1500ms
    globalGlitchEndTime = currentTime + (Math.random() * (1500 - 500) + 500);
  }
}
