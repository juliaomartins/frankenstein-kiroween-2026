"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Group, Object3D } from "three";

export const interactables = new Set<Object3D>();

export function findInteractId(object: Object3D | null): string | null {
  let o: Object3D | null = object;
  while (o) {
    if (typeof o.userData.interactId === "string") return o.userData.interactId;
    o = o.parent;
  }
  return null;
}

interface Props {
  id: string;
  children: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  visible?: boolean;
}

export function Interactable({ id, children, position, rotation, visible = true }: Props) {
  const ref = useRef<Group>(null);

  useEffect(() => {
    const group = ref.current;
    if (!group || !visible) return;
    group.userData.interactId = id;
    interactables.add(group);
    return () => {
      interactables.delete(group);
    };
  }, [id, visible]);

  return (
    <group ref={ref} position={position} rotation={rotation} visible={visible}>
      {children}
    </group>
  );
}
