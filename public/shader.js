// COMM2747 Creative Coding Assignment 2
// Written by: Samantha Lugay
// Student Number: s4087814
// ----------------------------------------------------------------------- //
import * as THREE from "/three.js";

// SHADER MATERIAL
// ShaderMaterial object to allow custom GLSL shaders to be applied to 3D objects
const shaderMaterial = new THREE.ShaderMaterial({
  // uniform: var that get passed from js to shaders
  // declare u time initialised at 0 for animation
  uniforms: {
    u_time: { value: 0.0 },
  },
  // vertexShader: manipulating the vertices of the 3D geometry
  vertexShader: `
    // declare time var that will be updated from js
   uniform float u_time;
   // declare var to pass the normal vector to the fragment shader
   varying vec3 vNormal;
   // declare var to pass the modified position to the fragment shader
   varying vec3 vPosition;
   
         void main() {
         // Copy vertex normal to the varying var
           vNormal = normal;
   
           // animate the vertices
           // start at original vertex pos
           vec3 newPosition = position;
           // creating wave effect
           float displacement = sin(position.y * 18.0 + u_time * 2.0) * 0.1;
           // displaces vertices along their normal 
           newPosition += normal * displacement;
   
           // update vposition 
           vPosition = newPosition;
           // transforms object from 3d obj space to 2d screen
           gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
         }
   
   `,
  // fragmentShader: coloring each pixel/fragment
  fragmentShader: `
  // declare time var that will be updated from js
   uniform float u_time;
   // receives value from vertex shader 
   varying vec3 vNormal;
   varying vec3 vPosition;
   
         void main() {
           // create a color based on the position and normal
           // multiplying vpos and vec3 makes the pattern and phases more intense
           // creating a moire effect
            // vec3(R,G,B) 
           vec3 color = 1.0 + 1.5 * sin(u_time * vPosition * 2.0 * vec3(0, 5, 4));  
   
           // Add some shading based on the normals
           // dot product between the norm and light direction vector (1,1,1)
           float lighting = dot(normalize(vNormal), normalize(vec3(1.0, 1.0, 1.0)));
           // adjusts lighting = 0.1 + scale/2
           lighting = 0.1 + lighting * 0.5;
   
           // sets the final pixel color
           gl_FragColor = vec4(color * lighting, 1.0);
         }
   
   `,
  side: THREE.DoubleSide,
});

export { shaderMaterial };
