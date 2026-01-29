/* eslint-disable react/no-unknown-property */
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas, extend, useFrame } from "@react-three/fiber"
import { Environment, Lightformer } from "@react-three/drei"
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  RigidBodyProps,
  useRopeJoint,
  useSphericalJoint,
} from "@react-three/rapier"
import { MeshLineGeometry, MeshLineMaterial } from "meshline"
import * as THREE from "three"

extend({ MeshLineGeometry, MeshLineMaterial })

interface LanyardCardProps {
  label: string
  onPulled?: () => void
}

interface BandProps {
  maxSpeed?: number
  minSpeed?: number
  isMobile?: boolean
  onPulled?: () => void
}

function Band({ maxSpeed = 50, minSpeed = 0, isMobile = false, onPulled }: BandProps) {
  const band = useRef<any>(null)
  const fixed = useRef<any>(null)
  const j1 = useRef<any>(null)
  const j2 = useRef<any>(null)
  const j3 = useRef<any>(null)
  const card = useRef<any>(null)

  const vec = new THREE.Vector3()
  const ang = new THREE.Vector3()
  const rot = new THREE.Vector3()
  const dir = new THREE.Vector3()

  const segmentProps: any = {
    type: "dynamic" as RigidBodyProps["type"],
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4,
  }

  // 使用一个简单的白色纹理，如果 lanyard.png 不存在也不会报错
  // 创建一个简单的白色纹理作为绳子纹理
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    // 创建简单的条纹纹理
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 64, 64)
    ctx.fillStyle = '#f0f0f0'
    for (let i = 0; i < 64; i += 4) {
      ctx.fillRect(0, i, 64, 2)
    }
    return new THREE.CanvasTexture(canvas)
  }, [])
  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]),
  )
  const [dragged, drag] = useState<false | THREE.Vector3>(false)
  const [hovered, hover] = useState(false)
  const dragStartY = useRef<number | null>(null)

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1])
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0],
  ])

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? "grabbing" : "grab"
      return () => {
        document.body.style.cursor = "auto"
      }
    }
  }, [hovered, dragged])

  useFrame((state: any, delta: number) => {
    if (dragged && typeof dragged !== "boolean") {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      ;[card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp())
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      })
    }
    if (fixed.current) {
      ;[j1, j2].forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation())
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())))
        ref.current.lerped.lerped = ref.current.lerped.lerped || ref.current.lerped
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)),
        )
      })
      curve.points[0].copy(j3.current.translation())
      curve.points[1].copy(j2.current.lerped)
      curve.points[2].copy(j1.current.lerped)
      curve.points[3].copy(fixed.current.translation())
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32))
      ang.copy(card.current.angvel())
      rot.copy(card.current.rotation())
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z })
    }
  })

  curve.curveType = "chordal"
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type={"fixed" as RigidBodyProps["type"]} />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps} type={"dynamic" as RigidBodyProps["type"]}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps} type={"dynamic" as RigidBodyProps["type"]}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps} type={"dynamic" as RigidBodyProps["type"]}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? ("kinematicPosition" as RigidBodyProps["type"]) : ("dynamic" as RigidBodyProps["type"])}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={1.8}
            position={[0, -1.1, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e: any) => {
              e.target.releasePointerCapture(e.pointerId)
              // 检查是否向下拉了一段距离，如果是就触发回调
              if (dragStartY.current !== null && typeof onPulled === "function") {
                const deltaY = e.clientY - dragStartY.current
                if (deltaY > 40) {
                  onPulled()
                }
              }
              drag(false)
              dragStartY.current = null
            }}
            onPointerDown={(e: any) => {
              e.target.setPointerCapture(e.pointerId)
              dragStartY.current = e.clientY
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            }}
          >
            {/* 简单的矩形卡片代替 GLB 模型 */}
            <mesh>
              <boxGeometry args={[1.2, 1.6, 0.08]} />
              <meshStandardMaterial color="#f9fafb" metalness={0.2} roughness={0.6} />
            </mesh>
            {/* 小夹子 */}
            <mesh position={[0, 0.9, 0]}>
              <boxGeometry args={[0.4, 0.2, 0.1]} />
              <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        {/* @ts-ignore - provided by meshline's extend */}
        <meshLineGeometry />
        {/* @ts-ignore - provided by meshline's extend */}
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={texture}
          repeat={[-4, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  )
}

export default function LanyardCard({ label, onPulled }: LanyardCardProps) {
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== "undefined" && window.innerWidth < 768)

  useEffect(() => {
    const handleResize = (): void => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-20 h-24">
        <Canvas
          camera={{ position: [0, 0, 30], fov: 20 }}
          dpr={[1, isMobile ? 1.5 : 2]}
          gl={{ alpha: true }}
          onCreated={({ gl }: any) => gl.setClearColor(new THREE.Color(0x000000), 0)}
        >
          <ambientLight intensity={Math.PI * 0.6} />
          <Physics gravity={[0, -40, 0]} timeStep={isMobile ? 1 / 30 : 1 / 60}>
            <Band isMobile={isMobile} onPulled={onPulled} />
          </Physics>
          <Environment blur={0.75}>
            <Lightformer
              intensity={2}
              color="white"
              position={[0, -1, 5]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={3}
              color="white"
              position={[-1, -1, 1]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={3}
              color="white"
              position={[1, 1, 1]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={10}
              color="white"
              position={[-10, 0, 14]}
              rotation={[0, Math.PI / 2, Math.PI / 3]}
              scale={[100, 10, 1]}
            />
          </Environment>
        </Canvas>
      </div>
      <div className="mt-1 text-[11px] md:text-xs font-bold text-purple-100 text-center leading-tight">
        {label}
      </div>
    </div>
  )
}

