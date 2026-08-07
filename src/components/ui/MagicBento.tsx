"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import styles from "./MagicBento.module.css";

type GsapTween = { kill: () => void };
type GsapApi = {
  killTweensOf: (target: unknown) => void;
  to: (target: unknown, vars: Record<string, unknown>) => GsapTween;
  fromTo: (target: unknown, fromVars: Record<string, unknown>, toVars: Record<string, unknown>) => GsapTween;
};

export type MagicBentoItem = {
  id: string;
  title: string;
  href: string;
  label?: string;
  icon?: ReactNode;
  value?: string;
  disabled?: boolean;
};

export type MagicBentoProps = {
  items: MagicBentoItem[];
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  glowColor?: string;
  disableAnimations?: boolean;
  cardSize?: "hub" | "index";
};

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = "222, 59, 67";

const clearDynamicNodes = (root: HTMLElement) => {
  root.querySelectorAll<HTMLElement>("[data-magic-bento-dynamic]").forEach((node) => node.remove());
};

export default function MagicBento({
  items,
  textAutoHide = true,
  enableStars = false,
  enableSpotlight = false,
  enableBorderGlow = false,
  enableTilt = false,
  enableMagnetism = false,
  clickEffect = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  disableAnimations = false,
  cardSize = "hub",
}: MagicBentoProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [supportsHover, setSupportsHover] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => {
      setPrefersReducedMotion(motionQuery.matches);
      setSupportsHover(hoverQuery.matches);
    };

    update();
    motionQuery.addEventListener("change", update);
    hoverQuery.addEventListener("change", update);
    return () => {
      motionQuery.removeEventListener("change", update);
      hoverQuery.removeEventListener("change", update);
    };
  }, []);

  const shouldDisableAnimations = disableAnimations || !supportsHover || prefersReducedMotion;

  useEffect(() => {
    const grid = gridRef.current;
    const section = sectionRef.current;
    if (!grid || !section) return;

    const cards = Array.from(grid.querySelectorAll<HTMLElement>("[data-magic-bento-card]"));
    const requiresGsap = enableStars || enableSpotlight || enableTilt || enableMagnetism || clickEffect;
    let gsapApi: GsapApi | null = null;
    let active = true;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const dynamicNodes = new Set<HTMLElement>();
    const tweens: GsapTween[] = [];
    const cardBounds = new Map<HTMLElement, DOMRect>();
    let sectionBounds: DOMRect | null = null;
    let boundsFrame = 0;
    const enterHandlers = new Map<HTMLElement, () => void>();
    const leaveHandlers = new Map<HTMLElement, () => void>();
    let spotlight: HTMLDivElement | null = null;

    const refreshBounds = () => {
      sectionBounds = section.getBoundingClientRect();
      cards.forEach((card) => cardBounds.set(card, card.getBoundingClientRect()));
    };
    const scheduleBoundsRefresh = () => {
      if (boundsFrame) return;
      boundsFrame = requestAnimationFrame(() => {
        boundsFrame = 0;
        refreshBounds();
      });
    };
    refreshBounds();
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleBoundsRefresh);
    resizeObserver?.observe(section);
    cards.forEach((card) => resizeObserver?.observe(card));

    const createSpotlight = () => {
      if (!gsapApi || !active || !enableSpotlight || shouldDisableAnimations || spotlight) return;
      spotlight = document.createElement("div");
      spotlight.className = styles.spotlight;
      spotlight.dataset.magicBentoDynamic = "true";
      spotlight.style.setProperty("--glow-color", glowColor);
      document.body.appendChild(spotlight);
      dynamicNodes.add(spotlight);
    };

    if (requiresGsap) {
      void import("gsap").then(({ gsap }) => {
        if (!active) return;
        gsapApi = gsap as unknown as GsapApi;
        createSpotlight();
      });
    }

    const killTween = (target: HTMLElement) => {
      gsapApi?.killTweensOf(target);
    };

    const clearParticles = (card: HTMLElement) => {
      card.querySelectorAll<HTMLElement>(`.${styles.particle}`).forEach((particle) => {
        gsapApi?.killTweensOf(particle);
        dynamicNodes.delete(particle);
        particle.remove();
      });
    };

    const animateParticles = (card: HTMLElement) => {
      if (!enableStars || shouldDisableAnimations) return;
      const rect = card.getBoundingClientRect();
      for (let index = 0; index < particleCount; index += 1) {
        const timeout = setTimeout(() => {
          if (!card.matches(":hover") || !grid.isConnected) return;
          const particle = document.createElement("span");
          particle.className = styles.particle;
          particle.dataset.magicBentoDynamic = "true";
          particle.style.left = `${Math.random() * rect.width}px`;
          particle.style.top = `${Math.random() * rect.height}px`;
          card.appendChild(particle);
          dynamicNodes.add(particle);
          gsapApi?.fromTo(particle, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" });
          gsapApi?.to(particle, {
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            rotation: Math.random() * 360,
            duration: 2 + Math.random() * 2,
            ease: "none",
            repeat: -1,
            yoyo: true,
          });
          gsapApi?.to(particle, { opacity: 0.3, duration: 1.5, ease: "power2.inOut", repeat: -1, yoyo: true });
        }, index * 100);
        timeouts.push(timeout);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (shouldDisableAnimations) return;
      const rect = sectionBounds;
      if (!rect) return;
      const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) return;

      cards.forEach((card) => {
        const cardRect = cardBounds.get(card);
        if (!cardRect) return;
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance = Math.max(0, Math.hypot(event.clientX - centerX, event.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2);
        const proximity = spotlightRadius * 0.5;
        const fadeDistance = spotlightRadius * 0.75;
        const intensity = distance <= proximity ? 1 : distance <= fadeDistance ? (fadeDistance - distance) / (fadeDistance - proximity) : 0;
        const relativeX = ((event.clientX - cardRect.left) / cardRect.width) * 100;
        const relativeY = ((event.clientY - cardRect.top) / cardRect.height) * 100;
        card.style.setProperty("--glow-x", `${relativeX}%`);
        card.style.setProperty("--glow-y", `${relativeY}%`);
        card.style.setProperty("--glow-intensity", intensity.toString());
        card.style.setProperty("--glow-radius", `${spotlightRadius}px`);

        if (enableTilt || enableMagnetism) {
          const x = event.clientX - cardRect.left - cardRect.width / 2;
          const y = event.clientY - cardRect.top - cardRect.height / 2;
          const tween = gsapApi?.to(card, {
            rotateX: enableTilt ? (y / (cardRect.height / 2)) * -10 : 0,
            rotateY: enableTilt ? (x / (cardRect.width / 2)) * 10 : 0,
            x: enableMagnetism ? x * 0.05 : 0,
            y: enableMagnetism ? y * 0.05 : 0,
            duration: 0.1,
            ease: "power2.out",
            transformPerspective: 1000,
          });
          if (tween) tweens.push(tween);
        }
      });

      if (spotlight && enableSpotlight) {
        spotlight.style.left = `${event.clientX}px`;
        spotlight.style.top = `${event.clientY}px`;
        gsapApi?.to(spotlight, { opacity: 0.8, duration: 0.2, ease: "power2.out" });
      }
    };

    const handleMouseLeave = () => {
      cards.forEach((card) => {
        card.style.setProperty("--glow-intensity", "0");
        clearParticles(card);
        killTween(card);
        gsapApi?.to(card, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.3, ease: "power2.out" });
      });
      if (spotlight) gsapApi?.to(spotlight, { opacity: 0, duration: 0.3, ease: "power2.out" });
    };

    const handleClick = (event: MouseEvent) => {
      if (!clickEffect || shouldDisableAnimations) return;
      const card = (event.target as HTMLElement).closest<HTMLElement>("[data-magic-bento-card]");
      if (!card || card.dataset.disabled === "true") return;
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const maxDistance = Math.max(Math.hypot(x, y), Math.hypot(x - rect.width, y), Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height));
      const ripple = document.createElement("span");
      ripple.className = styles.particle;
      ripple.dataset.magicBentoDynamic = "true";
      ripple.style.width = `${maxDistance * 2}px`;
      ripple.style.height = `${maxDistance * 2}px`;
      ripple.style.left = `${x - maxDistance}px`;
      ripple.style.top = `${y - maxDistance}px`;
      ripple.style.borderRadius = "50%";
      ripple.style.background = `radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%)`;
      card.appendChild(ripple);
      dynamicNodes.add(ripple);
      gsapApi?.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.8, ease: "power2.out", onComplete: () => { dynamicNodes.delete(ripple); ripple.remove(); } });
    };

    cards.forEach((card) => {
      card.style.setProperty("--glow-color", glowColor);
      const handleMouseEnter = () => animateParticles(card);
      const handleCardLeave = () => clearParticles(card);
      enterHandlers.set(card, handleMouseEnter);
      leaveHandlers.set(card, handleCardLeave);
      card.addEventListener("mouseenter", handleMouseEnter);
      card.addEventListener("mouseleave", handleCardLeave);
    });
    grid.addEventListener("mousemove", handleMouseMove);
    grid.addEventListener("mouseleave", handleMouseLeave);
    grid.addEventListener("click", handleClick);

    return () => {
      active = false;
      resizeObserver?.disconnect();
      if (boundsFrame) cancelAnimationFrame(boundsFrame);
      timeouts.forEach(clearTimeout);
      grid.removeEventListener("mousemove", handleMouseMove);
      grid.removeEventListener("mouseleave", handleMouseLeave);
      grid.removeEventListener("click", handleClick);
      cards.forEach((card) => {
        const handleMouseEnter = enterHandlers.get(card);
        const handleCardLeave = leaveHandlers.get(card);
        if (handleMouseEnter) card.removeEventListener("mouseenter", handleMouseEnter);
        if (handleCardLeave) card.removeEventListener("mouseleave", handleCardLeave);
        clearParticles(card);
        killTween(card);
      });
      gsapApi?.killTweensOf(cards);
      dynamicNodes.forEach((node) => node.remove());
      clearDynamicNodes(grid);
      if (spotlight) {
        gsapApi?.killTweensOf(spotlight);
        spotlight.remove();
      }
      tweens.forEach((tween) => tween.kill());
    };
  }, [clickEffect, enableMagnetism, enableSpotlight, enableStars, enableTilt, glowColor, items, particleCount, shouldDisableAnimations, spotlightRadius]);

  const cardClass = (item: MagicBentoItem) => [
    styles.magicBentoCard,
    textAutoHide ? styles.textAutoHide : "",
    enableBorderGlow ? styles.borderGlow : "",
    cardSize === "hub" ? styles.hubCard : styles.indexCard,
    item.disabled ? styles.disabled : "",
  ].filter(Boolean).join(" ");

  return (
    <section ref={sectionRef} className={styles.section} aria-label="Pins Hub modules">
      <div ref={gridRef} className={styles.cardGrid}>
        {items.map((item) => {
          const content = (
            <>
              <div className={styles.cardHeader}>
                {item.icon ? <span className={styles.cardIcon} aria-hidden="true">{item.icon}</span> : <span />}
              </div>
              <div className={styles.cardContent}>
                {item.label?.trim() ? <span className={styles.cardLabel}>{item.label}</span> : null}
                <h2 className={styles.cardTitle}>{item.title}</h2>
                {item.value ? <span className={styles.cardValue}>{item.value}</span> : null}
              </div>
            </>
          );
          const props = {
            className: cardClass(item),
            style: { "--glow-color": glowColor } as CSSProperties,
            "data-magic-bento-card": "true",
            "data-disabled": item.disabled ? "true" : "false",
          };

          return item.disabled ? <div key={item.id} {...props}>{content}</div> : <Link key={item.id} href={item.href} {...props}>{content}</Link>;
        })}
      </div>
    </section>
  );
}
