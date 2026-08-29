"use client";

import { useEffect, useRef } from "react";
import styles from "./page.module.css";

const words = ["RUN", "DRIVE", "WALK", "FLY", "RIDE", "SAIL"];

export default function MotionHeadline() {
  const wordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const word = wordRef.current;
    if (!word || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let index = 0;
    let timer = 0;
    let stopped = false;

    const tick = () => {
      timer = window.setTimeout(() => {
        if (stopped) return;
        const next = words[(index + 1) % words.length];
        word.getAnimations().forEach((animation) => animation.cancel());
        word.animate(
          [
            { transform: "translate(0,0) skewX(0deg)", opacity: 1 },
            {
              transform: "translate(-2px,1px) skewX(-3deg)",
              opacity: 0.82,
              offset: 0.2,
            },
            {
              transform: "translate(3px,-1px) skewX(2deg)",
              opacity: 1,
              offset: 0.42,
            },
            {
              transform: "translate(-1px,1px) skewX(-1.5deg)",
              opacity: 0.74,
              offset: 0.62,
            },
            {
              transform: "translate(2px,0) skewX(1.5deg)",
              opacity: 1,
              offset: 0.82,
            },
            { transform: "translate(0,0) skewX(0deg)", opacity: 1 },
          ],
          { duration: 300, easing: "steps(7, end)" },
        );

        timer = window.setTimeout(() => {
          word.getAnimations().forEach((animation) => animation.cancel());
          const exit = word.animate(
            [
              { transform: "translateY(0)", filter: "blur(0)", opacity: 1 },
              {
                transform: "translateY(105%)",
                filter: "blur(6px)",
                opacity: 0,
              },
            ],
            {
              duration: 220,
              easing: "cubic-bezier(.4,0,.9,.4)",
              fill: "forwards",
            },
          );
          exit.onfinish = () => {
            if (stopped) return;
            index = (index + 1) % words.length;
            word.textContent = next;
            word.animate(
              [
                {
                  transform: "translateY(-105%)",
                  filter: "blur(6px)",
                  opacity: 0,
                },
                {
                  transform: "translateY(0)",
                  filter: "blur(0)",
                  opacity: 1,
                },
              ],
              {
                duration: 230,
                easing: "cubic-bezier(.15,.8,.25,1)",
                fill: "forwards",
              },
            );
            tick();
          };
        }, 300);
      }, 2500);
    };

    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
      word.getAnimations().forEach((animation) => animation.cancel());
    };
  }, []);

  return (
    <h1 className={styles.heroTitle}>
      <span className={styles.wordSlot}>
        <span ref={wordRef} className={styles.motionWord}>
          RUN
        </span>
      </span>
      <span className={styles.earnLine}>AND EARN</span>
    </h1>
  );
}
