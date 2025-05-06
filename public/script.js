// ----------------------------------------------------------------------- //
// IMPORTS
import { drawStar } from "/drawStar.js";
import { colours } from "./colour.js";
import { shaderMaterial } from "./shader.js";
import * as THREE from "/three.js";

// ----------------------------------------------------------------------- //
// SET UP
// document styling
document.body.style.margin = 0;
document.body.style.overflow = `hidden`;

// setting up canvas
const cnv = document.getElementById(`canvas`);
// setting canvas width + height to window width + height
cnv.width = window.innerWidth;
cnv.height = window.innerHeight;

// getting the 2d context to draw on
const ctx = cnv.getContext(`2d`);

// setting up 3D scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7252dc);
const camera = new THREE.PerspectiveCamera(
  50,
  cnv.width / cnv.height,
  0.01,
  10
);
camera.position.z = 2;
// declaring time stamp
const clock = new THREE.Clock();

// Setup renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
// size of renderer
renderer.setSize(window.innerWidth, window.innerHeight);
// adding renderer to dom
document.body.appendChild(renderer.domElement);

// renderer styling
renderer.domElement.style.position = "absolute";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.zIndex = "-1";

// ----------------------------------------------------------------------- //
// SOUND
const audioContext = new AudioContext();
// suspend until click
audioContext.suspend();

// define an async click handler function
async function initAudio() {
  // wait for audio context to resume
  await audioContext.resume();
  // play audio element
  audioE.play();
  // set looping to true
  audioE.loop = true;
}

// volume controls
const gainNode = audioContext.createGain();
// audio element
const audioE = new Audio("weird.wav");
// pre load sound immediatly
audioE.load();
// declare source var
const source = audioContext.createMediaElementSource(audioE);
// connect audio element to gain node
source.connect(gainNode);
// Connect Gain Node to Destination
gainNode.connect(audioContext.destination);
// preset value ; set at 50%
gainNode.gain.value = 0.5;

// amplitude modulation variables
let modulationStartTime = 0;
// 1 / random value between 2-7 Hz frequency
const modulationFrequency = (1 / Math.random()) * (7 - 2 + 2);

// TOGGLE SOUND
// define a sound status var
let soundStatus = false;

// toggle sound function
function toggleSound() {
  // if sound status value is off
  if (soundStatus === false) {
    // modulation start time
    modulationStartTime = audioContext.currentTime;

    // set the value to true
    soundStatus = true;

    let soundRatio = mouse.x / cnv.width;

    gainNode.gain.value = gainNode.gain.value * soundRatio;

    // start amplitude modulation
    modulateAmplitude();
  }
  // if sound status value is on
  else if (soundStatus === true) {
    // set the value to false
    soundStatus = false;
  }
}

// anonymous function click handler
cnv.onclick = () => {
  // if the audio context is still suspended
  // resume the audio context first
  if (audioContext.state != "running") initAudio();

  // then call the toggle sound function
  toggleSound();
};

// function to apply amplitude modulation
function modulateAmplitude() {
  // declaring time now when function called
  const now = audioContext.currentTime;
  // calculating elapsed time
  const elapsedTime = now - modulationStartTime;

  // modulation - creates values between 0 and 1
  // starting from the middle 0.5
  // sin produces a wave between -1 and 1
  // therefore * 0.5 to make it -0.5 to 0.5
  // +0.5 makes ot 0 to 1
  // angle = 2 * Math.PI * modulationFrequency * elapsedTime
  // 2 * Math.PI = full circle
  // modulationFrequecy = 1/24 means we complete a cycle every 24 s
  // elapsedTime = time since we started oscillation
  const modulation =
    0.5 + 0.5 * Math.sin(2 * Math.PI * modulationFrequency * elapsedTime);

  // apply to gain (with base amplitude of 0.2)
  gainNode.gain.value = 0.2 * modulation;

  // next modulation update
  if (soundStatus === true) {
    requestAnimationFrame(modulateAmplitude);
  } else {
    gainNode.gain.value = 0;
  }
}

// ----------------------------------------------------------------------- //
// GLOBAL VARS
// declaring vars for: particle array, colour index, mesh, glitch colour index
let particleArr = [],
  coli = 0,
  mesh,
  glitchCol;

// GLOBAL GLITCH
// set default as not glitching
let globalGlitchEvent = false;
// initialise glitch in 10-25 seconds
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
  radius: (cnv.height / 170) * (cnv.width / 170),
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
    // calling class to create a new iteration of star
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
      // if more than end time means glitch period ended
      if (currentTime > this.glitchEndTime) {
        // glitch = false
        this.isGlitching = false;
        // set next glitch time in 2 - 10 seconds
        this.nextGlitchTime =
          currentTime + (Math.random() * (60000 - 2000) + 2000);
        // set a new x and y coord within canvas with 5px boundary
        this.x = Math.random() * (cnv.width - 5 - 5 + 5);
        this.y = Math.random() * (cnv.height - 5 - 5 + 5);
      }
    }
    // if not glitching - check if time to glitch
    // if current time stamp is greater than next glitch time
    // means should be glitching
    else if (currentTime > this.nextGlitchTime) {
      this.isGlitching = true;
      // set glitch to randomly end in 2 - 6 seconds
      this.glitchEndTime =
        currentTime + (Math.random() * (60000 - 2000) + 2000);
    }
  }

  // check glitch status, particle pos, mouse pos, move the particle and draw
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
// INITIALISE
function init() {
  // number of particles
  let numOf = (cnv.height * cnv.width) / 7000;

  // loop to create values to create instaces of Particle to push into array
  // till num of particles reached
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

  // BACKGROUND
  // create a torus knot
  const geometry = new THREE.TorusKnotGeometry(5, 3, 40, 15, 14, 4);
  // Clear scene of previous meshes if filled
  if (mesh) scene.remove(mesh);
  // create new instance of mesh with torus knot and shader
  mesh = new THREE.Mesh(geometry, shaderMaterial);
  // add the mesh to scene
  scene.add(mesh);

  // add light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
}

// ----------------------------------------------------------------------- //
// ANIMATION LOOP
function animate() {
  // call to check global glitch
  globalGlitchHandle();

  // if global glitch is active
  if (globalGlitchEvent === true) {
    // screen colour
    // clearing rect frame
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    // colour
    ctx.fillStyle = "#" + colours[glitchCol];
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
  mouse.radius = (cnv.height / 170) * (cnv.width / 170);

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
cnv.addEventListener("click", function cnvClicked() {
  console.log("screen clicked");
  // COLOUR
  // change colour index
  coli = coliRandomiser(coli);
  console.log(coli);

  // GLITCH (20% CHANCE)
  if (Math.random() < 0.2 && !globalGlitchEvent) {
    console.log("glitch is true");
    // start glitch
    globalGlitchEvent = true;
    // setting random background colour
    glitchCol = coliRandomiser(glitchCol);
    console.log(glitchCol);
    // set a random end time between 500-1500ms
    globalGlitchEndTime =
      clock.getElapsedTime() * 1000 + (Math.random() * (1500 - 500) + 500);
  }
});

// ----------------------------------------------------------------------- //
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

      // clear 2d ctx
      ctx.clearRect(0, 0, innerWidth, innerHeight);

      // re-initialize everything
      init();

      // Set next global glitch time - random val between 15-30 seconds
      nextGlobalGlitchTime =
        currentTime + (Math.random() * (30000 - 15000) + 15000);
    }
  }
  // if not in a global glitch state
  // check if current time is more than next glitch time
  // meaning it should be glitching
  else if (currentTime > nextGlobalGlitchTime) {
    console.log("global glitch true");
    // set glitch event to true
    globalGlitchEvent = true;

    // setting random background colour
    glitchCol = coliRandomiser(glitchCol);
    console.log(glitchCol);

    // set a random end time between 500ms-2s
    globalGlitchEndTime = currentTime + (Math.random() * (2000 - 500) + 500);
  }
}

// ----------------------------------------------------------------------- //
// FUNC: RANDOM COLOUR INDEX
function coliRandomiser(i) {
  // compute random colour index
  // new var to hold new colour index
  let newColi = Math.floor(Math.random() * colours.length);

  // if the new random index == the current index number
  // call the function again to get a new random index number
  // that is different
  if (newColi == i) {
    console.log("call recursive");
    return coliRandomiser(i);
  } else {
    // return new random index
    //newCol= r;
    return newColi;
  }
}
