import * as THREE from "/build/three.module.js";
import { OrbitControls } from "/OrbitControls.js";

const div = document.getElementById("canvas");
const width = div.parentNode.scrollWidth;
const height = (width * 9) / 16;

// Basic three.js setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x102b53);
const camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 10);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
div.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

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

// create a torus knot
const geometry = new THREE.TorusKnotGeometry(5, 4.7, 41, 15, 14, 4);
const mesh = new THREE.Mesh(geometry, shaderMaterial);
scene.add(mesh);

// add light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// animation loop
renderer.setAnimationLoop((time) => {
  shaderMaterial.uniforms.u_time.value = time * 0.001;
  controls.update();
  renderer.render(scene, camera);
});
