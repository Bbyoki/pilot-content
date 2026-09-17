import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      radius: number;
      speedY: number;
      opacity: number;
      fadeSpeed: number;
      pulseSpeed: number;
      pulseDir: number;
    }> = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Generate initial particles
    const particleCount = Math.min(window.innerWidth < 768 ? 20 : 45, 50);
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 1.5 + 0.5,
        speedY: -(Math.random() * 0.15 + 0.05),
        opacity: Math.random() * 0.5 + 0.1,
        fadeSpeed: Math.random() * 0.005 + 0.001,
        pulseSpeed: Math.random() * 0.01 + 0.005,
        pulseDir: Math.random() > 0.5 ? 1 : -1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        // Render tiny, elegant circular glowing dots
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 182, 212, ${p.opacity})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow for next draws

        // Move particle upwards
        p.y += p.speedY;

        // Subtly pulsate opacity
        p.opacity += p.pulseSpeed * p.pulseDir;
        if (p.opacity > 0.6) {
          p.pulseDir = -1;
        } else if (p.opacity < 0.1) {
          p.pulseDir = 1;
        }

        // Loop particle to bottom if it moves off-screen
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-brand-deep">
      {/* Dynamic star/tech particles Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-80" />

      {/* Large Glowing Ambient Blobs drifting with custom timings */}
      <motion.div
        animate={{
          x: [0, 80, -50, 0],
          y: [0, -100, 60, 0],
          scale: [1, 1.15, 0.85, 1],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-[-10%] left-[10%] w-[35rem] h-[35rem] rounded-full bg-brand-cyan/8 filter blur-[150px]"
      />

      <motion.div
        animate={{
          x: [0, -100, 60, 0],
          y: [0, 80, -70, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-[-15%] right-[5%] w-[40rem] h-[40rem] rounded-full bg-brand-electric/6 filter blur-[180px]"
      />

      <motion.div
        animate={{
          x: [0, 60, -90, 0],
          y: [0, 90, -50, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-[40%] right-[15%] w-[25rem] h-[25rem] rounded-full bg-purple-500/5 filter blur-[130px]"
      />

      {/* CSS-based faint extra glows mapping Vercel-like style */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[40rem] ambient-gradient opacity-60" />
    </div>
  );
}
