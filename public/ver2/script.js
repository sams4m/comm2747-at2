import { drawStar } from "/drawStar.js";
import { colours } from "./colour.js";
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
  70,
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

// set up orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ----------------------------------------------------------------------- //
// sound
const audioContext = new AudioContext();
// suspend until click
audioContext.suspend();
// volume controls
const gainNode = audioContext.createGain();
// audio
const audioE = new Audio("/weird.wav");
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

// ----------------------------------------------------------------------- //
// SHADER MATERIAL
const shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0.0 },
  },
  vertexShader: `
   uniform float u_time;
   varying vec3 vNormal;
   varying vec3 vPosition;
   
         void main() {
           vNormal = normal;
   
           // Animate the vertices
           vec3 newPosition = position;
           float displacement = sin(position.y * 18.0 + u_time * 2.0) * 0.1;
           newPosition += normal * displacement;
   
           vPosition = newPosition;
           gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
         }
   
   `,
  fragmentShader: `
   uniform float u_time;
   varying vec3 vNormal;
   varying vec3 vPosition;
   
         void main() {
           // Create a color based on the position and normal
           // multiplying vpos and vec3 makes the pattern and phases more intense
           // creating a moire effect
           vec3 color = 1.0 + 1.5 * sin(u_time * vPosition * 2.0 * vec3(0, 5, 4));
           // vec3 color = 1.0 - (((u_time % 9) % 1) + vPosition + vec3(0, 5, 4));
   
   
           // Add some shading based on the normals
           float lighting = dot(normalize(vNormal), normalize(vec3(1.0, 1.0, 1.0)));
           lighting = 0.1 + lighting * 0.5;
   
           gl_FragColor = vec4(color * lighting, 1.0);
         }
   
   `,
  side: THREE.DoubleSide,
});

// ----------------------------------------------------------------------- //
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

    // Configure star oscillation
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

  // create plane
  //   const geometry = new THREE.PlaneGeometry(1.6, 0.9);
  //   const mesh = new THREE.Mesh(geometry, shaderMaterial);
  //   scene.add(mesh);

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
    // going through consecutive particles in array
    for (let b = 0; b < particleArr.length; b++) {
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
  // BACKGROUND STYLE
  // clearing previous frame
  //   ctx.clearRect(0, 0, innerWidth, innerHeight);
  //   //ctx.fillStyle = "rgb(255 141 161)";
  //   ctx.fillStyle = "#7252DC";
  //   ctx.fillRect(0, 0, innerWidth, innerHeight);

  // Rotate three.js scene
  if (mesh) {
    mesh.rotation.x += 0.005;
    mesh.rotation.y += 0.01;
  }

  // shader update
  shaderMaterial.uniforms.u_time.value = clock.getElapsedTime();
  // render scene
  renderer.render(scene, camera);

  // update orbit controls
  controls.update();

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

// mouse out event
// particles stop trying to interact with mouse when it leaves canvas
window.addEventListener("mouseout", function (mouse_event) {
  mouse.x = undefined;
  mouse.y = undefined;
});

// new var to hold new colour index
let newColi;
cnv.addEventListener("click", function cnvClicked() {
  console.log("screen clicked");
  // COLOUR
  // change colour index
  coli = coliRandomiser();
  console.log(coli);

  // SOUND
  if (audioContext.state == "suspended") {
    audioContext.resume();
  } else {
    audioE.play();
    let soundRatio = mouse.x / cnv.width;

    gainNode.gain.value = soundRatio;
  }
});

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
