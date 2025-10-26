"use client"

import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  twinkle: number
}

export default function StarrySky() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Initialize stars
    const initStars = () => {
      const stars: Star[] = []
      const numStars = 200

      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speed: Math.random() * 0.5 + 0.1,
          opacity: Math.random() * 0.8 + 0.2,
          twinkle: Math.random() * Math.PI * 2
        })
      }

      starsRef.current = stars
    }

    initStars()

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw stars
      starsRef.current.forEach((star) => {
        // Update star position
        star.y += star.speed
        if (star.y > canvas.height) {
          star.y = 0
          star.x = Math.random() * canvas.width
        }

        // Update twinkle
        star.twinkle += 0.02
        const twinkleOpacity = star.opacity * (0.5 + 0.5 * Math.sin(star.twinkle))

        // Draw star
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity})`
        ctx.fill()

        // Add glow effect
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity * 0.3})`
        ctx.fill()

        // Add shooting star effect (random)
        if (Math.random() < 0.001) {
          ctx.beginPath()
          ctx.moveTo(star.x, star.y)
          ctx.lineTo(star.x - 50, star.y - 50)
          ctx.strokeStyle = `rgba(255, 255, 255, ${twinkleOpacity})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      })

      // Draw nebula clouds
      const time = Date.now() * 0.0001
      for (let i = 0; i < 3; i++) {
        const x = (Math.sin(time + i) * 0.3 + 0.5) * canvas.width
        const y = (Math.cos(time + i * 0.7) * 0.3 + 0.5) * canvas.height
        const radius = 100 + Math.sin(time * 2 + i) * 20

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        gradient.addColorStop(0, `rgba(100, 150, 255, 0.1)`)
        gradient.addColorStop(0.5, `rgba(100, 150, 255, 0.05)`)
        gradient.addColorStop(1, 'rgba(100, 150, 255, 0)')

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)' }}
    />
  )
}
