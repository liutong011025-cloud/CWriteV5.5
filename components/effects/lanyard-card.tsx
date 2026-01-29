/* eslint-disable react/no-unknown-property */
"use client"

import { useEffect, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Environment, Lightformer } from "@react-three/drei"
import * as THREE from "three"

interface LanyardCardProps {
  label: string
  onPulled?: () => void
}

function HangingCard({ onPulled }: { onPulled?: () => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const dragStartY = useRef<number | null>(null)

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = pressed ? "grabbing" : "grab"
      return () => {
        document.body.style.cursor = "auto"
      }
    }
  }, [hovered, pressed])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    const swing = Math.sin(t * 1.2) * 0.18
    const bob = Math.sin(t * 2.0) * 0.05
    groupRef.current.rotation.z = swing
    groupRef.current.position.y = -0.3 + (pressed ? -0.2 : 0) + bob
  })

  return (
    <group
      ref={groupRef}
      position={[0, 0, 0]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => {
        setHovered(false)
        setPressed(false)
      }}
      onPointerDown={(e: any) => {
        setPressed(true)
        dragStartY.current = e.clientY
      }}
      onPointerUp={(e: any) => {
        setPressed(false)
        if (dragStartY.current !== null && typeof onPulled === "function") {
          const deltaY = e.clientY - dragStartY.current
          if (deltaY > 40) {
            onPulled()
          }
        }
        dragStartY.current = null
      }}
    >
      {/* 绳子 */}
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[0.08, 2.0, 0.08]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.1} roughness={0.6} />
      </mesh>

      {/* 小夹子 */}
      <mesh position={[0, 0.1, 0.02]}>
        <boxGeometry args={[0.4, 0.18, 0.12]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 卡片本体 */}
      <mesh position={[0, -0.7, 0]}>
        <boxGeometry args={[1.2, 1.6, 0.08]} />
        <meshStandardMaterial color="#f9fafb" metalness={0.2} roughness={0.6} />
      </mesh>
    </group>
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
          camera={{ position: [0, 0, 6], fov: 28 }}
          dpr={[1, isMobile ? 1.5 : 2]}
          gl={{ alpha: true }}
          onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), 0)}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[3, 4, 5]} intensity={0.8} />
          <HangingCard onPulled={onPulled} />
          <Environment blur={0.6}>
            <Lightformer
              intensity={2}
              color="white"
              position={[0, -1, 5]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={2.5}
              color="white"
              position={[2, 2, 2]}
              rotation={[0, 0, 0]}
              scale={[50, 0.1, 1]}
            />
