"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { crackle, heartbeat, roar } from "../audio";
import { promptFor, useGame } from "../state/gameStore";
import { useSettings } from "../state/settingsStore";
import { awakeningClock, awakeningElapsed, TIMELINE } from "./awakening";
import { findInteractId, interactables } from "./Interactable";
import { COLLIDERS, PLAYER, ROOM, TABLE } from "./layout";
import { playerState } from "./playerState";
import { stormState } from "./stormState";

const MOVE_KEYS: Record<string, "f" | "b" | "l" | "r"> = {
  KeyW: "f",
  ArrowUp: "f",
  KeyS: "b",
  ArrowDown: "b",
  KeyA: "l",
  ArrowLeft: "l",
  KeyD: "r",
  ArrowRight: "r",
};

const MOUSE_SENSITIVITY = 0.0022;
const WHEEL_SENSITIVITY = 0.0016;
const LINE_HEIGHT_PX = 16;
const PITCH_LIMIT = 1.45;
/** Without pointer capture, holding the cursor near the left or right edge keeps turning. */
const EDGE_ZONE = 0.07;
const EDGE_TURN_SPEED = 1.9;
const EDGE_BAND_TOP = 0.15;
const EDGE_BAND_BOTTOM = 0.92;

const NO_KEYS = { f: false, b: false, l: false, r: false, run: false };

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
}

function blocked(x: number, z: number): boolean {
  const r = PLAYER.radius;
  if (x < ROOM.minX + r + 0.3 || x > ROOM.maxX - r - 0.3 || z < ROOM.minZ + r + 0.3 || z > ROOM.maxZ - r - 0.1) return true;
  for (const [minX, maxX, minZ, maxZ] of COLLIDERS) {
    const cx = Math.max(minX, Math.min(x, maxX));
    const cz = Math.max(minZ, Math.min(z, maxZ));
    if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return true;
  }
  return false;
}

export function Player() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const keys = useRef({ ...NO_KEYS });
  const look = useRef(playerState.look);
  const velocity = useRef(new THREE.Vector3());
  const cursor = useRef({ x: 0, y: 0, known: false, inside: false });
  const raycaster = useMemo(() => {
    const r = new THREE.Raycaster();
    r.far = PLAYER.reach;
    return r;
  }, []);
  const frame = useRef(0);
  const cinematicStage = useRef<string | null>(null);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const tmpQ = useMemo(() => new THREE.Quaternion(), []);
  const tmpM = useMemo(() => new THREE.Matrix4(), []);
  const v = useMemo(
    () => ({ input: new THREE.Vector2(), forward: new THREE.Vector3(), right: new THREE.Vector3(), desired: new THREE.Vector3(), center: new THREE.Vector2(0, 0) }),
    [],
  );

  useEffect(() => {
    camera.position.set(...PLAYER.start);
    camera.rotation.order = "YXZ";
    const canvas = gl.domElement;
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__lab = { store: useGame, camera, gl, scene, look: look.current };
    }

    const turn = (dx: number, dy: number) => {
      const sens = MOUSE_SENSITIVITY * useSettings.getState().sensitivity;
      look.current.yaw -= dx * sens;
      look.current.pitch = THREE.MathUtils.clamp(look.current.pitch - dy * sens, -PITCH_LIMIT, PITCH_LIMIT);
    };
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if (down && isTyping(e.target)) return;
      const move = MOVE_KEYS[e.code];
      if (move) {
        keys.current[move] = down;
        if (e.code.startsWith("Arrow") && useGame.getState().phase === "playing") e.preventDefault();
      }
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.current.run = down;
    };
    const keyDown = onKey(true);
    const keyUp = onKey(false);

    const lookActive = () => {
      const s = useGame.getState();
      return s.phase === "playing" && s.panel === null;
    };
    const onMouse = (e: MouseEvent) => {
      if (document.pointerLockElement === canvas) {
        turn(e.movementX, e.movementY);
        return;
      }
      const c = cursor.current;
      if (c.known && lookActive()) turn(e.clientX - c.x, e.clientY - c.y);
      c.x = e.clientX;
      c.y = e.clientY;
      c.known = true;
      c.inside = true;
    };
    const onLeave = () => {
      cursor.current.inside = false;
      cursor.current.known = false;
    };
    const onPointerDown = (e: PointerEvent) => {
      const s = useGame.getState();
      if (e.button !== 0 || !lookActive() || document.pointerLockElement === canvas) return;
      const req = canvas.requestPointerLock() as unknown as Promise<void> | undefined;
      req?.catch?.(() => s.setPointerLockFailed(true));
    };
    const onWheel = (e: WheelEvent) => {
      const s = useGame.getState();
      if (e.ctrlKey || s.phase !== "playing" || s.panel !== null) return;
      e.preventDefault();
      const scale = e.deltaMode === 1 ? LINE_HEIGHT_PX : 1;
      const sens = WHEEL_SENSITIVITY * useSettings.getState().sensitivity;
      look.current.yaw -= e.deltaX * scale * sens;
      look.current.pitch = THREE.MathUtils.clamp(look.current.pitch - e.deltaY * scale * sens, -PITCH_LIMIT, PITCH_LIMIT);
    };
    const onLockChange = () => {
      useGame.getState().setPointerLocked(document.pointerLockElement === canvas);
      cursor.current.known = false;
    };
    const onLockError = () => useGame.getState().setPointerLockFailed(true);
    const onBlur = () => {
      keys.current = { ...NO_KEYS };
      onLeave();
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("mousemove", onMouse);
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onBlur);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("pointerlockerror", onLockError);

    const unsub = useGame.subscribe((s, prev) => {
      if ((s.panel !== null && prev.panel === null) || (s.phase !== "playing" && prev.phase === "playing")) {
        if (document.pointerLockElement) document.exitPointerLock();
        keys.current = { ...NO_KEYS };
      }
      if (s.phase === "playing" && prev.phase !== "playing") {
        camera.position.set(...PLAYER.start);
        look.current.yaw = 0;
        look.current.pitch = -0.05;
        awakeningClock.start = -1;
        cinematicStage.current = null;
        stormState.awakenSurge = 0;
      }
    });

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("mousemove", onMouse);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("wheel", onWheel);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("pointerlockerror", onLockError);
      unsub();
    };
  }, [camera, gl, scene]);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useGame.getState();

    if (s.phase === "awakening" || s.phase === "ending") {
      direct(clock.elapsedTime, dt);
      return;
    }

    const active = s.phase === "playing" && s.panel === null;
    const k = keys.current;
    const input = v.input.set((k.r ? 1 : 0) - (k.l ? 1 : 0), (k.f ? 1 : 0) - (k.b ? 1 : 0));
    if (!active) input.set(0, 0);
    if (input.lengthSq() > 1) input.normalize();

    const c = cursor.current;
    if (active && c.inside && document.pointerLockElement !== gl.domElement) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const zone = w * EDGE_ZONE;
      if (c.y > h * EDGE_BAND_TOP && c.y < h * EDGE_BAND_BOTTOM) {
        const push = c.x < zone ? 1 - c.x / zone : c.x > w - zone ? -(1 - (w - c.x) / zone) : 0;
        look.current.yaw += push * EDGE_TURN_SPEED * useSettings.getState().sensitivity * dt;
      }
    }

    const yaw = look.current.yaw;
    const speed = k.run ? PLAYER.runSpeed : PLAYER.walkSpeed;
    v.forward.set(-Math.sin(yaw), 0, -Math.cos(yaw)).multiplyScalar(input.y * speed);
    v.right.set(Math.cos(yaw), 0, -Math.sin(yaw)).multiplyScalar(input.x * speed);
    v.desired.copy(v.forward).add(v.right);
    velocity.current.lerp(v.desired, 1 - Math.exp(-dt * 10));

    const bx = camera.position.x;
    const bz = camera.position.z;
    const nx = camera.position.x + velocity.current.x * dt;
    if (!blocked(nx, camera.position.z)) camera.position.x = nx;
    else velocity.current.x = 0;
    const nz = camera.position.z + velocity.current.z * dt;
    if (!blocked(camera.position.x, nz)) camera.position.z = nz;
    else velocity.current.z = 0;

    const moved = Math.hypot(camera.position.x - bx, camera.position.z - bz);
    if (moved > 0) s.addDistance(moved);
    playerState.speed = moved / Math.max(dt, 1e-4);
    playerState.bob += moved * 2.4;
    camera.position.y = PLAYER.eyeHeight + (playerState.speed > 0.1 ? Math.sin(playerState.bob * 2) * 0.025 : 0);

    camera.rotation.set(look.current.pitch, look.current.yaw, 0, "YXZ");

    frame.current++;
    if (frame.current % 2 === 0) {
      if (!active) {
        s.setHovered(null);
      } else {
        raycaster.setFromCamera(v.center, camera);
        const hits = raycaster.intersectObjects([...interactables], true);
        const hit = hits.find((h) => h.object.visible);
        const id = hit ? findInteractId(hit.object) : null;
        s.setHovered(id ? promptFor(id) : null);
      }
    }
  });

  function direct(now: number, dt: number) {
    if (awakeningClock.start < 0) {
      awakeningClock.start = now;
      crackle(1.2, 0.35);
    }
    const s = useGame.getState();
    const t = awakeningElapsed(now);
    const good = s.ending?.kind === "good";

    stormState.awakenSurge = t < TIMELINE.surgeEnd ? 1 - t / TIMELINE.surgeEnd / 1.5 : 0;
    if (t < TIMELINE.surgeEnd) stormState.flash = Math.max(stormState.flash, Math.random() < 0.08 ? 1 : 0);

    const stage = t < TIMELINE.surgeEnd ? "surge" : t < TIMELINE.stirEnd ? "stir" : good ? "peace" : t < TIMELINE.riseEnd - 0.9 ? "rise" : "attack";
    if (stage !== cinematicStage.current) {
      cinematicStage.current = stage;
      s.setCinematic(stage as "surge" | "stir" | "peace" | "rise" | "attack");
      if (stage === "stir") heartbeat();
      if (stage === "rise") roar();
      if (stage === "attack") {
        roar();
        stormState.flash = 1;
      }
    }

    if (s.phase === "awakening" && t > (good ? TIMELINE.goodEnd : TIMELINE.badEnd)) s.finishAwakening();

    lookTarget.set(TABLE.x + (good ? 0.5 : 0.3), TABLE.height + (t > TIMELINE.stirEnd ? 0.75 : 0.25), TABLE.z);
    if (!good && t > TIMELINE.riseEnd - 0.9) lookTarget.y = 1.55;
    tmpM.lookAt(camera.position, lookTarget, camera.up);
    tmpQ.setFromRotationMatrix(tmpM);
    camera.quaternion.slerp(tmpQ, 1 - Math.exp(-dt * (t > TIMELINE.riseEnd - 0.9 && !good ? 8 : 2)));

    const shakeAmt = t < TIMELINE.surgeEnd ? 0.012 : !good && t > TIMELINE.riseEnd - 0.9 ? 0.03 : 0;
    const fall = !good && t > TIMELINE.attackEnd ? Math.min(1.2, (t - TIMELINE.attackEnd) * 2.5) : 0;
    camera.position.y = PLAYER.eyeHeight - fall + (Math.random() - 0.5) * shakeAmt;
  }

  return null;
}
