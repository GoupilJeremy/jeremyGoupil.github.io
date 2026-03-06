import * as THREE from 'three'

/**
 * Generates a deep-space starfield as a Three.js Points object.
 * Stars are distributed on a large sphere to simulate an infinite backdrop.
 */
export class ParticleSystem {
  constructor(count = 8000, radius = 900) {
    this.count = count
    this.radius = radius
    this.mesh = this._build()
  }

  _build() {
    const positions = new Float32Array(this.count * 3)
    const colors = new Float32Array(this.count * 3)
    const sizes = new Float32Array(this.count)

    const color = new THREE.Color()

    for (let i = 0; i < this.count; i++) {
      // Uniform distribution on sphere surface
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = this.radius * (0.7 + Math.random() * 0.3)

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      // Star color palette: white, blue-white, yellow-white, orange-red
      const palette = [
        { h: 0.62, s: 0.05, l: 0.95 }, // blue-white
        { h: 0.0,  s: 0.0,  l: 1.0  }, // pure white
        { h: 0.12, s: 0.3,  l: 0.85 }, // yellow-white
        { h: 0.05, s: 0.6,  l: 0.7  }, // orange-red (rare)
      ]
      const pick = palette[Math.floor(Math.random() * palette.length)]
      const dimFactor = 0.3 + Math.random() * 0.7
      color.setHSL(pick.h, pick.s, pick.l * dimFactor)
      colors[i * 3]     = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      sizes[i] = 0.4 + Math.random() * 1.8
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.ShaderMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: /* glsl */`
        attribute float size;
        varying vec3 vColor;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          // Subtle twinkle via size oscillation
          float twinkle = 1.0 + 0.15 * sin(uTime * 2.0 + position.x * 0.01);
          gl_PointSize = size * uPixelRatio * twinkle * (350.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */`
        varying vec3 vColor;

        void main() {
          // Soft circular disc with glow falloff
          float dist = length(gl_PointCoord - 0.5) * 2.0;
          if (dist > 1.0) discard;
          float alpha = 1.0 - smoothstep(0.3, 1.0, dist);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
    })

    return new THREE.Points(geometry, material)
  }

  update(elapsedTime) {
    this.mesh.material.uniforms.uTime.value = elapsedTime
  }

  addTo(scene) {
    scene.add(this.mesh)
    return this
  }
}
