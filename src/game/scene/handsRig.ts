import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

interface HandSource {
  scene: THREE.Object3D;
  animations: THREE.AnimationClip[];
}

/** The uploaded file holds two skin variants of the same right hand; this is the lighter one. */
const VARIANT_ROOT = "GLOBAL_MAIN_CONTROL_R";
const VARIANT_PREFIX = /^GLOBAL_MAIN_CONTROL_/;
/** Times in the take: open relaxed hand, and a closed grip. */
const IDLE_TIME = 2.0;
const GRIP_TIME = 8.0;
/** Wrist-to-fingertip length on screen, in metres. */
const HAND_LENGTH = 0.235;

const TARGET_FINGERS = new THREE.Vector3(0, 0, -1);
const TARGET_THUMB = new THREE.Vector3(-1, 0, 0);
const TARGET_BACK = new THREE.Vector3(0, 1, 0);

interface PoseSample {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

export interface HandRig {
  holder: THREE.Group;
  objects: THREE.Object3D[];
  idle: PoseSample[];
  grip: PoseSample[];
}

function findIn(root: THREE.Object3D, pattern: RegExp): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  root.traverse((o) => {
    if (!found && pattern.test(o.name)) found = o;
  });
  return found;
}

function worldIn(spaceInv: THREE.Matrix4, o: THREE.Object3D): THREE.Vector3 {
  return new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).applyMatrix4(spaceInv);
}

function sample(objects: THREE.Object3D[]): PoseSample[] {
  return objects.map((o) => ({ position: o.position.clone(), quaternion: o.quaternion.clone() }));
}

function applySample(objects: THREE.Object3D[], s: PoseSample[]) {
  objects.forEach((o, i) => {
    o.position.copy(s[i].position);
    o.quaternion.copy(s[i].quaternion);
  });
}

/**
 * Builds one first-person hand from the rigged right-hand GLB.
 * The hand is oriented from its own bones (fingers forward, palm down) and mirrored for the left side.
 */
export function buildHandRig(gltf: HandSource, side: 1 | -1): HandRig | null {
  const scene = cloneSkinned(gltf.scene);
  const variant = scene.getObjectByName(VARIANT_ROOT);
  const clip = gltf.animations[0];
  if (!variant || !clip) return null;
  scene.traverse((o) => {
    if (o !== variant && VARIANT_PREFIX.test(o.name)) o.visible = false;
  });

  const objects: THREE.Object3D[] = [];
  scene.traverse((o) => objects.push(o));
  const mixer = new THREE.AnimationMixer(scene);
  const action = mixer.clipAction(clip);
  action.play();
  action.time = GRIP_TIME;
  mixer.update(0);
  const grip = sample(objects);
  action.time = IDLE_TIME;
  mixer.update(0);
  const idle = sample(objects);
  action.stop();
  mixer.uncacheRoot(scene);
  applySample(objects, idle);
  scene.updateMatrixWorld(true);

  const palm = findIn(variant, /^HANDPALM_joint/);
  const middleBase = findIn(variant, /^MIDDLE_F_BASE_joint/);
  const middleTip = findIn(variant, /^MIDDLE_F_UP_TOP_joint/);
  const thumbBase = findIn(variant, /^THUMB_BASE_joint/);
  const wrist = findIn(variant, /^Root_joint/);
  if (!palm || !middleBase || !middleTip || !thumbBase) return null;

  const spaceInv = scene.matrixWorld.clone().invert();
  const palmPos = worldIn(spaceInv, palm);
  const wristPos = wrist ? worldIn(spaceInv, wrist) : palmPos;
  const fingers = worldIn(spaceInv, middleBase).sub(palmPos).normalize();
  const thumb = worldIn(spaceInv, thumbBase).sub(palmPos);
  thumb.sub(fingers.clone().multiplyScalar(thumb.dot(fingers))).normalize();
  const back = new THREE.Vector3().crossVectors(fingers, thumb).normalize();

  const source = new THREE.Matrix4().makeBasis(fingers, thumb, back);
  const target = new THREE.Matrix4().makeBasis(TARGET_FINGERS, TARGET_THUMB, TARGET_BACK);
  const rotation = new THREE.Quaternion().setFromRotationMatrix(target).multiply(new THREE.Quaternion().setFromRotationMatrix(source).invert());

  const length = worldIn(spaceInv, middleTip).distanceTo(wristPos);
  const scale = HAND_LENGTH / Math.max(length, 1e-6);

  const inner = new THREE.Group();
  inner.add(scene);
  inner.quaternion.copy(rotation);
  inner.scale.setScalar(scale);
  inner.position.copy(palmPos.clone().multiplyScalar(scale).applyQuaternion(rotation).negate());

  const holder = new THREE.Group();
  holder.add(inner);
  if (side < 0) holder.scale.x = -1;

  scene.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.frustumCulled = false;
      o.castShadow = false;
      o.receiveShadow = false;
    }
  });

  return { holder, objects, idle, grip };
}

export function applyHandGrip(rig: HandRig, grip: number) {
  const k = THREE.MathUtils.clamp(grip, 0, 1);
  rig.objects.forEach((o, i) => {
    o.position.lerpVectors(rig.idle[i].position, rig.grip[i].position, k);
    o.quaternion.slerpQuaternions(rig.idle[i].quaternion, rig.grip[i].quaternion, k);
  });
}
