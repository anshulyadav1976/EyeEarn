"use client";

import { useEffect, useRef } from "react";

type Point = [number, number];
type Spark = { x: number; y: number; vx: number; vy: number; life: number };

export default function BurningWick() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let points: Point[] = [];
    let sparks: Spark[] = [];
    let progress = 0;
    let frame = 0;
    let dpr = 1;
    let last = performance.now();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const buildPath = () => {
      const inset = 11;
      const radius = 16;
      const left = inset;
      const top = inset;
      const right = innerWidth - inset;
      const bottom = innerHeight - inset;
      const next: Point[] = [];
      const line = (ax: number, ay: number, bx: number, by: number) => {
        const steps = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) / 4));
        for (let index = 0; index < steps; index += 1) {
          const t = index / steps;
          next.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
        }
      };
      const arc = (cx: number, cy: number, from: number, to: number) => {
        for (let index = 0; index < 14; index += 1) {
          const angle = from + (to - from) * (index / 14);
          next.push([
            cx + Math.cos(angle) * radius,
            cy + Math.sin(angle) * radius,
          ]);
        }
      };
      line(left + radius, top, right - radius, top);
      arc(right - radius, top + radius, -Math.PI / 2, 0);
      line(right, top + radius, right, bottom - radius);
      arc(right - radius, bottom - radius, 0, Math.PI / 2);
      line(right - radius, bottom, left + radius, bottom);
      arc(left + radius, bottom - radius, Math.PI / 2, Math.PI);
      line(left, bottom - radius, left, top + radius);
      arc(left + radius, top + radius, Math.PI, Math.PI * 1.5);
      points = next;
    };

    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.floor(innerWidth * dpr);
      canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      buildPath();
    };

    const at = (index: number) =>
      points[
        ((Math.floor(index) % points.length) + points.length) % points.length
      ];

    const drawStatic = () => {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!points.length) return;
      const point = points[Math.floor(points.length * 0.02)];
      context.shadowColor = "rgba(255,31,107,0.55)";
      context.shadowBlur = 18;
      context.fillStyle = "rgba(255,77,141,0.55)";
      context.beginPath();
      context.arc(point[0], point[1], 3.3, 0, Math.PI * 2);
      context.fill();
    };

    const draw = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      progress = (progress + dt / 8000) % 1;
      if (!points.length || !Number.isFinite(progress)) {
        progress = 0;
        frame = requestAnimationFrame(draw);
        return;
      }

      const head = progress * points.length;
      const tailLength = Math.max(36, Math.floor(points.length * 0.085));
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.lineCap = "round";

      for (let k = tailLength; k > 0; k -= 1) {
        const start = at(head - k);
        const end = at(head - k + 1);
        const f = 1 - k / tailLength;
        const alpha = Math.pow(f, 2.1) * 0.95;
        context.strokeStyle =
          f > 0.82
            ? `rgba(255,234,242,${alpha})`
            : f > 0.6
              ? `rgba(255,77,141,${alpha})`
              : f > 0.3
                ? `rgba(255,31,107,${alpha * 0.9})`
                : `rgba(196,18,91,${alpha * 0.8})`;
        context.lineWidth = 0.9 + f * 3.9;
        context.shadowColor = "rgba(255,31,107,0.55)";
        context.shadowBlur = 10 + f * 10;
        context.beginPath();
        context.moveTo(start[0], start[1]);
        context.lineTo(end[0], end[1]);
        context.stroke();
      }

      const point = at(head);
      context.shadowColor = "rgba(255,31,107,0.55)";
      context.shadowBlur = 22;
      context.fillStyle = "rgba(255,248,250,0.98)";
      context.beginPath();
      context.arc(point[0], point[1], 3.3, 0, Math.PI * 2);
      context.fill();

      if (sparks.length < 40 && Math.random() < 0.55)
        sparks.push({
          x: point[0],
          y: point[1],
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          life: 1,
        });
      context.shadowBlur = 0;
      sparks = sparks.filter((spark) => {
        spark.life -= dt / 400;
        spark.x += spark.vx * dt * 0.06;
        spark.y += spark.vy * dt * 0.06;
        if (spark.life <= 0) return false;
        context.fillStyle = `rgba(255,77,141,${spark.life * 0.8})`;
        context.beginPath();
        context.arc(spark.x, spark.y, 1.05 * spark.life + 0.3, 0, Math.PI * 2);
        context.fill();
        return true;
      });
      frame = requestAnimationFrame(draw);
    };

    const resize = () => {
      size();
      if (reduced) drawStatic();
    };
    size();
    addEventListener("resize", resize);
    if (reduced) drawStatic();
    else frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 90, pointerEvents: "none" }}
    />
  );
}
