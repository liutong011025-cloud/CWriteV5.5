/* eslint-disable react/no-unknown-property */
"use client"

import * as THREE from "three"
import { memo, ReactNode, useEffect, useRef, useState } from "react"
import { Canvas, createPortal, useFrame, useThree, ThreeElements } from "@react-three/fiber"
import { MeshTransmissionMaterial, Scroll, ScrollControls, useFBO, useGLTF } from "@react-three/drei"
import { easing } from "maath"

type Mode = "lens" | "bar" | "cube"
type ModeProps = Record<string, unknown>

interface NavItem {
  label: string
  link: string
}

interface FluidGlassProps {
  mode?: Mode
  lensProps?: ModeProps
  barProps?: ModeProps
  cubeProps?: ModeProps
  scale?: number
  ior?: number
  thickness?: number
  transmission?: number
  roughness?: number
  chromaticAberration?: number
  anisotropy?: number
}

type MeshProps = ThreeElements["mesh"]

interface ModeWrapperProps extends MeshProps {
  children?: ReactNode
  glb: string
  geometryKey: string
  lockToBottom?: boolean
  followPointer?: boolean
  modeProps?: ModeProps
}

function LensSimple({ modeProps = {}, ...props }: { modeProps?: ModeProps } & MeshProps) {
  const ref = useRef<THREE.Mesh>(null!)
  const ringRef = useRef<THREE.Mesh>(null!)
  const mouseRef = useRef({ x: 0, y: 0 })
  const { viewport, camera } = useThree()
  const { scale, ior, thickness, anisotropy, chromaticAberration, transmission, roughness, ...extraMat } =
    modeProps as {
      scale?: number
      ior?: number
      thickness?: number
      anisotropy?: number
      chromaticAberration?: number
      transmission?: number
      roughness?: number
      [key: string]: unknown
    }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [])

  useFrame((state, delta) => {
    const v = viewport.getCurrentViewport(camera, [0, 0, 15])
    const nx = (mouseRef.current.x / window.innerWidth) * 2 - 1
    const ny = -((mouseRef.current.y / window.innerHeight) * 2 - 1)
    const destX = (nx * v.width) / 2
    const destY = (ny * v.height) / 2
    easing.damp3(ref.current.position, [destX, destY, 15], 0.15, delta)
    if (ringRef.current) {
      ringRef.current.position.x = ref.current.position.x
      ringRef.current.position.y = ref.current.position.y
      ringRef.current.position.z = 15.03
    }
  })

  return (
    <group {...props}>
      <mesh ref={ref} scale={scale ?? 0.25} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.42, 0.42, 0.2, 96]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.45}
          transmission={transmission ?? 1}
          roughness={roughness ?? 0.03}
          thickness={thickness ?? 1.8}
          ior={ior ?? 1.15}
          reflectivity={1}
          clearcoat={1}
          clearcoatRoughness={0}
          color="#dff3ff"
          attenuationColor="#ffffff"
          attenuationDistance={0.35}
          {...(typeof extraMat === "object" && extraMat !== null ? extraMat : {})}
        />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.44, 0.5, 96]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.28} />
      </mesh>
    </group>
  )
}

const ModeWrapper = memo(function ModeWrapper({
  children,
  glb,
  geometryKey,
  lockToBottom = false,
  followPointer = true,
  modeProps = {},
  ...props
}: ModeWrapperProps) {
  const ref = useRef<THREE.Mesh>(null!)
  const { nodes } = useGLTF(glb)
  const buffer = useFBO()
  const { viewport: vp } = useThree()
  const [scene] = useState<THREE.Scene>(() => new THREE.Scene())
  const geoWidthRef = useRef<number>(1)

  useEffect(() => {
    const geo = (nodes[geometryKey] as THREE.Mesh)?.geometry
    if (!geo) return
    geo.computeBoundingBox()
    geoWidthRef.current = geo.boundingBox ? geo.boundingBox.max.x - geo.boundingBox.min.x || 1 : 1
  }, [nodes, geometryKey])

  useFrame((state, delta) => {
    const { gl, viewport, pointer, camera } = state
    const v = viewport.getCurrentViewport(camera, [0, 0, 15])

    const destX = followPointer ? (pointer.x * v.width) / 2 : 0
    const destY = lockToBottom ? -v.height / 2 + 0.2 : followPointer ? (pointer.y * v.height) / 2 : 0
    easing.damp3(ref.current.position, [destX, destY, 15], 0.15, delta)

    if ((modeProps as { scale?: number }).scale == null) {
      const maxWorld = v.width * 0.9
      const desired = maxWorld / geoWidthRef.current
      ref.current.scale.setScalar(Math.min(0.15, desired))
    }

    gl.setRenderTarget(buffer)
    gl.render(scene, camera)
    gl.setRenderTarget(null)
    gl.setClearColor(0x5227ff, 1)
  })

  const { scale, ior, thickness, anisotropy, chromaticAberration, transmission, roughness, ...extraMat } =
    modeProps as {
      scale?: number
      ior?: number
      thickness?: number
      anisotropy?: number
      chromaticAberration?: number
      transmission?: number
      roughness?: number
      [key: string]: unknown
    }

  return (
    <>
      {createPortal(children, scene)}
      <mesh scale={[vp.width, vp.height, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={buffer.texture} transparent />
      </mesh>
      <mesh ref={ref} scale={scale ?? 0.15} rotation-x={Math.PI / 2} geometry={(nodes[geometryKey] as THREE.Mesh)?.geometry} {...props}>
        <MeshTransmissionMaterial
          buffer={buffer.texture}
          ior={ior ?? 1.15}
          thickness={thickness ?? 5}
          anisotropy={anisotropy ?? 0.01}
          chromaticAberration={chromaticAberration ?? 0.1}
          transmission={transmission ?? 1}
          roughness={roughness ?? 0}
          {...(typeof extraMat === "object" && extraMat !== null ? extraMat : {})}
        />
      </mesh>
    </>
  )
})

function Lens({ modeProps, ...p }: { modeProps?: ModeProps } & MeshProps) {
  return <LensSimple modeProps={modeProps} {...p} />
}

function Cube({ modeProps, ...p }: { modeProps?: ModeProps } & MeshProps) {
  return <ModeWrapper glb="/assets/3d/cube.glb" geometryKey="Cube" followPointer modeProps={modeProps} {...p} />
}

function Bar({ modeProps = {}, ...p }: { modeProps?: ModeProps } & MeshProps) {
  const defaultMat = {
    transmission: 1,
    roughness: 0,
    thickness: 10,
    ior: 1.15,
    color: "#ffffff",
    attenuationColor: "#ffffff",
    attenuationDistance: 0.25,
  }

  return (
    <ModeWrapper
      glb="/assets/3d/bar.glb"
      geometryKey="Cube"
      lockToBottom
      followPointer={false}
      modeProps={{ ...defaultMat, ...modeProps }}
      {...p}
    />
  )
}

function EmptyScrollContent() {
  return null
}

export default function FluidGlass({
  mode = "lens",
  lensProps = {},
  barProps = {},
  cubeProps = {},
  scale,
  ior,
  thickness,
  transmission,
  roughness,
  chromaticAberration,
  anisotropy,
}: FluidGlassProps) {
  const Wrapper = mode === "bar" ? Bar : mode === "cube" ? Cube : Lens
  const rawOverrides = mode === "bar" ? barProps : mode === "cube" ? cubeProps : lensProps
  const {
    navItems = [
      { label: "Home", link: "" },
      { label: "About", link: "" },
      { label: "Contact", link: "" },
    ],
    ...modeProps
  } = rawOverrides as { navItems?: NavItem[] } & ModeProps

  const mergedModeProps: ModeProps = {
    ...modeProps,
    ...(scale !== undefined ? { scale } : {}),
    ...(ior !== undefined ? { ior } : {}),
    ...(thickness !== undefined ? { thickness } : {}),
    ...(transmission !== undefined ? { transmission } : {}),
    ...(roughness !== undefined ? { roughness } : {}),
    ...(chromaticAberration !== undefined ? { chromaticAberration } : {}),
    ...(anisotropy !== undefined ? { anisotropy } : {}),
  }

  void navItems

  return (
    <Canvas
      camera={{ position: [0, 0, 20], fov: 15 }}
      gl={{ alpha: true, antialias: true }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[2, 3, 8]} intensity={0.8} />
      <pointLight position={[-3, -2, 10]} intensity={0.6} />
      <ScrollControls damping={0.2} pages={1} distance={0.2}>
        <Wrapper modeProps={mergedModeProps}>
          <Scroll>
            <EmptyScrollContent />
          </Scroll>
          <Scroll html />
        </Wrapper>
      </ScrollControls>
    </Canvas>
  )
}
