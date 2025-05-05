import * as THREE from "/three.js";

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

export { shaderMaterial };
