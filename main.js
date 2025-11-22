import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import backgroundUrl from "assets/texture_background_carina.png";
import beamUrl from "assets/texture_beam.png";

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  (window.innerWidth - 300) / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth - 300, window.innerHeight);
document.getElementById("container").appendChild(renderer.domElement);

camera.position.z = 20;

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- Textures ---
const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load(backgroundUrl);
const beamTexture = textureLoader.load(beamUrl);
// --- Background ---
const backgroundSphere = new THREE.Mesh(
  new THREE.SphereGeometry(500, 64, 64),
  new THREE.MeshBasicMaterial({
    map: backgroundTexture,
    side: THREE.BackSide,
  })
);
scene.add(backgroundSphere);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// --- Objects ---
const pulsarGeometry = new THREE.SphereGeometry(1.5, 32, 32);
const pulsarMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const pulsar = new THREE.Mesh(pulsarGeometry, pulsarMaterial);
scene.add(pulsar);

const companionGeometry = new THREE.SphereGeometry(1, 32, 32);
const companionMaterial = new THREE.MeshPhongMaterial({ color: 0x8888ff });
const companion = new THREE.Mesh(companionGeometry, companionMaterial);
scene.add(companion);

const beamGeometry = new THREE.ConeGeometry(0.5, 10, 32);
beamGeometry.translate(0, 5, 0); // Move pivot to the base
const beamMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  map: beamTexture,
  transparent: true,
  opacity: 0.5,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
});
const beam1 = new THREE.Mesh(beamGeometry, beamMaterial);
const beam2 = new THREE.Mesh(beamGeometry, beamMaterial);
beam2.rotation.z = Math.PI; // Opposite direction
const beamGroup = new THREE.Group();
beamGroup.add(beam1);
beamGroup.add(beam2);
pulsar.add(beamGroup); // Attach beams to pulsar

// --- Simulation Parameters ---
const params = {
  pulsarMass: 1.4,
  companionMass: 0.8,
  orbitalInclination: 90,
  pulsarSpinFrequency: 1,
  beamConeAngle: 20,
  beamInclination: 45,
  timeSpeed: 1.0,
  totalMass: 2.2,
  pulsarRadius: 0,
  companionRadius: 0,
};

function updateRadii() {
  params.totalMass = params.pulsarMass + params.companionMass;
  const distance = 10; // Semi-major axis (for visualization)
  params.pulsarRadius = distance * (params.companionMass / params.totalMass);
  params.companionRadius = distance * (params.pulsarMass / params.totalMass);
}
updateRadii();

// --- UI Binding ---
const uiElements = {
  pulsarMass: document.getElementById("pulsarMass"),
  companionMass: document.getElementById("companionMass"),
  orbitalInclination: document.getElementById("orbitalInclination"),
  pulsarSpinFrequency: document.getElementById("pulsarSpinFrequency"),
  beamConeAngle: document.getElementById("beamConeAngle"),
  beamInclination: document.getElementById("beamInclination"),
  timeSpeed: document.getElementById("timeSpeed"),
};

const uiValues = {
  pulsarMassValue: document.getElementById("pulsarMassValue"),
  companionMassValue: document.getElementById("companionMassValue"),
  orbitalInclinationValue: document.getElementById("orbitalInclinationValue"),
  pulsarSpinFrequencyValue: document.getElementById("pulsarSpinFrequencyValue"),
  beamConeAngleValue: document.getElementById("beamConeAngleValue"),
  beamInclinationValue: document.getElementById("beamInclinationValue"),
  timeSpeedValue: document.getElementById("timeSpeedValue"),
};

for (const key in uiElements) {
  uiElements[key].addEventListener("input", (event) => {
    params[key] = parseFloat(event.target.value);
    uiValues[key + "Value"].textContent = event.target.value;
    if (key === "pulsarMass" || key === "companionMass") {
      updateRadii();
    }
    if (key === "beamConeAngle") {
      const scale = Math.tan(THREE.MathUtils.degToRad(params.beamConeAngle));
      beam1.scale.set(scale, 1, scale);
      beam2.scale.set(scale, 1, scale);
    }
    if (key === "beamInclination") {
      beamGroup.rotation.z = THREE.MathUtils.degToRad(params.beamInclination);
    }
  });
}
// Initial UI setup
for (const key in uiElements) {
  uiValues[key + "Value"].textContent = uiElements[key].value;
}
beamGroup.rotation.z = THREE.MathUtils.degToRad(params.beamInclination);
const initialScale = Math.tan(THREE.MathUtils.degToRad(params.beamConeAngle));
beam1.scale.set(initialScale, 1, initialScale);
beam2.scale.set(initialScale, 1, initialScale);

// --- Animation Loop ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime() * params.timeSpeed;

  // Orbital Motion
  const orbitalPeriod =
    2 * Math.PI * Math.sqrt(Math.pow(10, 3) / params.totalMass);
  const angle = (elapsedTime / orbitalPeriod) * 2 * Math.PI;

  pulsar.position.x = -params.pulsarRadius * Math.cos(angle);
  pulsar.position.y =
    -params.pulsarRadius *
    Math.sin(angle) *
    Math.sin(THREE.MathUtils.degToRad(params.orbitalInclination));
  pulsar.position.z =
    params.pulsarRadius *
    Math.sin(angle) *
    Math.cos(THREE.MathUtils.degToRad(params.orbitalInclination));

  companion.position.x = params.companionRadius * Math.cos(angle);
  companion.position.y =
    params.companionRadius *
    Math.sin(angle) *
    Math.sin(THREE.MathUtils.degToRad(params.orbitalInclination));
  companion.position.z =
    -params.companionRadius *
    Math.sin(angle) *
    Math.cos(THREE.MathUtils.degToRad(params.orbitalInclination));

  // Pulsar Spin
  pulsar.rotation.y += params.pulsarSpinFrequency * delta * 2 * Math.PI;

  controls.update();
  renderer.render(scene, camera);
}

animate();

// --- Resize Handler ---
window.addEventListener("resize", () => {
  camera.aspect = (window.innerWidth - 300) / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth - 300, window.innerHeight);
});
