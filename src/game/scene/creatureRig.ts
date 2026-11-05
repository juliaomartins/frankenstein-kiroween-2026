import * as THREE from "three";

export interface RigPose {
  armsDown: number;
  reach: number;
  sit: number;
  headYaw: number;
  twitch: number;
}

interface BoneRest {
  bone: THREE.Bone;
  rest: THREE.Quaternion;
  parentRest: THREE.Quaternion;
  parentRestInv: THREE.Quaternion;
}

export interface CreatureRig {
  up: THREE.Vector3;
  forward: THREE.Vector3;
  left: THREE.Vector3;
  armL: BoneRest[];
  armR: BoneRest[];
  handL: BoneRest[];
  handR: BoneRest[];
  spine: BoneRest[];
  neck: BoneRest[];
  armDirL: THREE.Vector3;
  armDirR: THREE.Vector3;
}

const BONE_PATTERNS = {
  pelvis: /^pelvis/i,
  head: /^head/i,
  neck: /^neck_01/i,
  upperarmL: /^upperarm_l(?!.*twist)/i,
  upperarmR: /^upperarm_r(?!.*twist)/i,
  handL: /^hand_l/i,
  handR: /^hand_r/i,
  spine: [/^spine_01/i, /^spine_02/i, /^spine_03/i],
};

const ARMS_DOWN_ANGLE = THREE.MathUtils.degToRad(78);
const REACH_ANGLE = THREE.MathUtils.degToRad(85);
const SIT_ANGLE_PER_SPINE = THREE.MathUtils.degToRad(27);
const TWITCH_ANGLE = THREE.MathUtils.degToRad(12);

function findBones(root: THREE.Object3D): THREE.Bone[] {
  const bones: THREE.Bone[] = [];
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) bones.push(o as THREE.Bone);
  });
  return bones;
}

function pick(bones: THREE.Bone[], pattern: RegExp): THREE.Bone | null {
  return bones.find((b) => pattern.test(b.name)) ?? null;
}

function restAll(bones: THREE.Bone[], pattern: RegExp, spaceInv: THREE.Matrix4): BoneRest[] {
  return bones
    .filter((b) => pattern.test(b.name))
    .map((b) => restOf(b, spaceInv))
    .filter((r): r is BoneRest => r !== null);
}

function positionIn(space: THREE.Matrix4, object: THREE.Object3D): THREE.Vector3 {
  return new THREE.Vector3().setFromMatrixPosition(object.matrixWorld).applyMatrix4(space);
}

function restOf(bone: THREE.Bone | null, spaceInv: THREE.Matrix4): BoneRest | null {
  if (!bone || !bone.parent) return null;
  const parentMatrix = new THREE.Matrix4().multiplyMatrices(spaceInv, bone.parent.matrixWorld);
  const parentRest = new THREE.Quaternion();
  parentMatrix.decompose(new THREE.Vector3(), parentRest, new THREE.Vector3());
  return { bone, rest: bone.quaternion.clone(), parentRest, parentRestInv: parentRest.clone().invert() };
}

/**
 * Reads the model's own skeleton to find which way it faces. Every bone whose name matches is driven,
 * because some exports split one character across several skeletons with identical bone names.
 * Works for Unreal-mannequin style rigs (pelvis, spine_0x, upperarm_l/r, hand_l/r, neck_01, head).
 */
export function buildCreatureRig(scene: THREE.Object3D): CreatureRig | null {
  scene.updateMatrixWorld(true);
  const bones = findBones(scene);
  const pelvis = pick(bones, BONE_PATTERNS.pelvis);
  const head = pick(bones, BONE_PATTERNS.head);
  const upperarmL = pick(bones, BONE_PATTERNS.upperarmL);
  const upperarmR = pick(bones, BONE_PATTERNS.upperarmR);
  const handL = pick(bones, BONE_PATTERNS.handL);
  const handR = pick(bones, BONE_PATTERNS.handR);
  if (!pelvis || !head || !upperarmL || !upperarmR || !handL || !handR) return null;

  const spaceInv = scene.matrixWorld.clone().invert();
  const up = positionIn(spaceInv, head).sub(positionIn(spaceInv, pelvis)).normalize();
  const armDirL = positionIn(spaceInv, handL).sub(positionIn(spaceInv, upperarmL)).normalize();
  const armDirR = positionIn(spaceInv, handR).sub(positionIn(spaceInv, upperarmR)).normalize();
  const left = armDirL.clone().sub(armDirR).normalize();
  left.sub(up.clone().multiplyScalar(left.dot(up))).normalize();
  const forward = new THREE.Vector3().crossVectors(left, up).normalize();

  return {
    up,
    forward,
    left,
    armL: restAll(bones, BONE_PATTERNS.upperarmL, spaceInv),
    armR: restAll(bones, BONE_PATTERNS.upperarmR, spaceInv),
    handL: restAll(bones, BONE_PATTERNS.handL, spaceInv),
    handR: restAll(bones, BONE_PATTERNS.handR, spaceInv),
    spine: BONE_PATTERNS.spine.flatMap((p) => restAll(bones, p, spaceInv)),
    neck: restAll(bones, BONE_PATTERNS.neck, spaceInv),
    armDirL,
    armDirR,
  };
}

/** Rotation that lays the model on its back with its head along +X, matching the table. */
export function lyingOrientation(rig: CreatureRig): THREE.Quaternion {
  const basis = new THREE.Matrix4().makeBasis(rig.up, rig.forward, new THREE.Vector3().crossVectors(rig.up, rig.forward));
  return new THREE.Quaternion().setFromRotationMatrix(basis).invert();
}

const tmpA = new THREE.Quaternion();
const tmpB = new THREE.Quaternion();
const tmpAxis = new THREE.Vector3();

function rotateInModelSpace(targets: BoneRest[], delta: THREE.Quaternion) {
  for (const target of targets) {
    tmpA.copy(target.parentRestInv).multiply(delta).multiply(target.parentRest);
    target.bone.quaternion.copy(tmpA).multiply(target.rest);
  }
}

function axisAngle(from: THREE.Vector3, to: THREE.Vector3, angle: number, out: THREE.Quaternion) {
  tmpAxis.crossVectors(from, to);
  if (tmpAxis.lengthSq() < 1e-8) return out.identity();
  return out.setFromAxisAngle(tmpAxis.normalize(), angle);
}

const down = new THREE.Vector3();
const armDown = new THREE.Quaternion();
const armReach = new THREE.Quaternion();
const spineQ = new THREE.Quaternion();
const neckQ = new THREE.Quaternion();
const handQ = new THREE.Quaternion();
const sideAxis = new THREE.Vector3();

export function applyRigPose(rig: CreatureRig, pose: RigPose) {
  down.copy(rig.up).negate();
  for (const [arm, dir] of [
    [rig.armL, rig.armDirL],
    [rig.armR, rig.armDirR],
  ] as const) {
    axisAngle(dir, down, ARMS_DOWN_ANGLE * pose.armsDown, armDown);
    axisAngle(dir, rig.forward, REACH_ANGLE, armReach);
    tmpB.copy(armDown).slerp(armReach, pose.reach);
    rotateInModelSpace(arm, tmpB);
  }

  sideAxis.crossVectors(rig.up, rig.forward).normalize();
  spineQ.setFromAxisAngle(sideAxis, SIT_ANGLE_PER_SPINE * pose.sit);
  rotateInModelSpace(rig.spine, spineQ);

  neckQ.setFromAxisAngle(rig.up, pose.headYaw);
  rotateInModelSpace(rig.neck, neckQ);

  handQ.setFromAxisAngle(rig.forward, TWITCH_ANGLE * pose.twitch);
  rotateInModelSpace(rig.handL, handQ);
  handQ.setFromAxisAngle(rig.forward, -TWITCH_ANGLE * pose.twitch);
  rotateInModelSpace(rig.handR, handQ);
}
