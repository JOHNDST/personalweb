import React, { useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, AsciiRenderer, OrbitControls, Stage, Html } from '@react-three/drei'

function Model({ url, ...props }) {
  const { scene } = useGLTF(url)
  const ref = useRef()
  
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.2
    }
  })

  return <primitive ref={ref} object={scene} {...props} />
}

function Loader() {
  return <Html center><div style={{color: 'black', fontFamily: 'monospace'}}>LOADING...</div></Html>
}

function ErrorFallback({ error }) {
    return <Html center><div style={{color: 'red', fontFamily: 'monospace', textAlign: 'center'}}>ERROR LOADING MODEL:<br/>{error.message}</div></Html>
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children; 
  }
}

export default function Project3DView({ modelUrl }) {
  return (
    <div style={{ width: '100%', height: '100%', background: 'white' }}>
      <Canvas>
        <color attach="background" args={['black']} />
        
        <ErrorBoundary>
            <Suspense fallback={<Loader />}>
                <Stage environment="city" intensity={0.5} adjustCamera>
                    <Model url={modelUrl} />
                </Stage>
            </Suspense>
        </ErrorBoundary>
        
        <AsciiRenderer fgColor="black" bgColor="white" resolution={0.25} />
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  )
}
