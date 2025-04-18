import c2 from "https://esm.sh/c2.js";
import THREE from "https://cdn.jsdelivr.net/npm/three@0.175.0/+esm";

document.body.style.margin = 0;
document.body.style.overflow = `hidden`;

// SET UP
// renderer, scene and camera
const container = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({ antialias: true });
// resize();
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#cccccc");

const camera = new THREE.PerspectiveCamera(
  75,
  renderer.domElement.width / renderer.domElement.height,
  0.1,
  1000
);
camera.position.z = 100;

let random = new c2.Random();

// -------------------------------------------------
// Custom shader material
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
          vec3 color = 1.0 + 0.5 * sin(u_time * vPosition * vec3(0, 5, 4));
          // vec3 color = 1.0 - (((u_time % 9) % 1) + vPosition + vec3(0, 5, 4));
  
  
          // Add some shading based on the normals
          float lighting = dot(normalize(vNormal), normalize(vec3(1.0, 1.0, 1.0)));
          lighting = 0.1 + lighting * 0.5;
  
          gl_FragColor = vec4(color * lighting, 1.0);
        }
  
  `,
  side: THREE.DoubleSide,
});

class Agent extends c2.Point {
  constructor() {
    let x = random.next(renderer.width);
    let y = random.next(renderer.height);
    super(x, y);

    this.vx = random.next(-2, 2);
    this.vy = random.next(-2, 2);

    // Create a small sphere for each agent
    const geometry = new THREE.SphereGeometry(2, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0x333333 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(
      this.x - renderer.domElement.width / 2,
      renderer.domElement.height / 2 - this.y,
      0
    );
    scene.add(this.mesh);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0) {
      this.x = 0;
      this.vx *= -1;
    } else if (this.x > renderer.width) {
      this.x = renderer.width;
      this.vx *= -1;
    }
    if (this.y < 0) {
      this.y = 0;
      this.vy *= -1;
    } else if (this.y > renderer.height) {
      this.y = renderer.height;
      this.vy *= -1;
    }
    // Update the mesh position
    this.mesh.position.set(
      this.x - renderer.domElement.width / 2,
      renderer.domElement.height / 2 - this.y,
      0
    );
  }
}

// Create agents
const agents = new Array(20);
for (let i = 0; i < agents.length; i++) {
  agents[i] = new Agent();
}

// Create triangulation visualization with shader material
function updateTriangulation() {
  // Clear any existing triangulation meshes
  scene.children.forEach((child) => {
    if (child.userData.isTriangle) {
      scene.remove(child);
    }
  });

  // Get agent positions
  const points = agents.map((agent) => new THREE.Vector2(agent.x, agent.y));

  // Use Three.js Delaunay triangulation (if available) or implement your own
  // For simplicity, let's create some basic triangles based on agent positions
  for (let i = 0; i < agents.length - 2; i += 3) {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      agents[i].x - renderer.domElement.width / 2,
      renderer.domElement.height / 2 - agents[i].y,
      0,
      agents[i + 1].x - renderer.domElement.width / 2,
      renderer.domElement.height / 2 - agents[i + 1].y,
      0,
      agents[i + 2].x - renderer.domElement.width / 2,
      renderer.domElement.height / 2 - agents[i + 2].y,
      0,
    ]);

    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

    const triangleMesh = new THREE.Mesh(geometry, shaderMaterial);
    triangleMesh.userData.isTriangle = true;
    scene.add(triangleMesh);
  }
}

// Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  // Update shader uniform
  shaderMaterial.uniforms.time.value = elapsedTime;

  // Update agents
  agents.forEach((agent) => agent.update());

  // Update triangulation
  updateTriangulation();

  // Render scene
  renderer.render(scene, camera);
}

animate();

// function resize() {
//   const parent = container.parentNode || document.body;
//   const width = parent.clientWidth;
//   const height = (parent.clientWidth / 16) * 9;

//   renderer.setSize(width, height);
//   camera.aspect = width / height;
//   camera.updateProjectionMatrix();

//   // Update shader resolution uniform
//   if (
//     shaderMaterial &&
//     shaderMaterial.uniforms &&
//     shaderMaterial.uniforms.resolution
//   ) {
//     shaderMaterial.uniforms.resolution.value.set(width, height);
//   }
// }
