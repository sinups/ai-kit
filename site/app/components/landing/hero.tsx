"use client";

import type { PointerEvent } from "react";
import Link from "next/link";
import { useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { IconArrowUpRight } from "@tabler/icons-react";
import { GitHubIcon } from "@/app/components/github-icon";
import { REPO_URL } from "@/app/lib/site";
import { FloatingTiles } from "./floating-tiles";
import { InstallCommand } from "./install-command";
import { ProductPreview } from "./product-preview";
import classes from "./landing.module.css";

const rise =
  "animate-in fade-in slide-in-from-bottom-4 fill-mode-both animation-duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:animate-none";

const SPRING = { stiffness: 60, damping: 18, mass: 0.6 };

export function Hero() {
  const reduceMotion = useReducedMotion();
  const pointerX = useSpring(useMotionValue(0), SPRING);
  const pointerY = useSpring(useMotionValue(0), SPRING);

  const follow = (event: PointerEvent<HTMLElement>) => {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const reset = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden"
      onPointerMove={follow}
      onPointerLeave={reset}
    >
      <div className={classes.grid} aria-hidden="true" />
      <div className="relative">
        <FloatingTiles pointerX={pointerX} pointerY={pointerY} />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pt-24 text-center sm:px-6 lg:pt-28">
          <h1
            id="hero-title"
            className="text-balance text-[clamp(2.625rem,7.4vw,5.5rem)] font-medium leading-[1.02] tracking-[-0.045em] text-foreground"
          >
            <span className={`${rise} inline-block`}>The open-source</span>
            <br />
            <span className={`${rise} inline-block delay-[90ms]`}>UI kit for</span>
            <br />
            <span className={`${rise} inline-block delay-[180ms]`}>agent products.</span>
          </h1>
          <p
            className={`${rise} delay-300 mt-6 max-w-[40rem] text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg`}
          >
            Chat, tool calls, diff review, sessions, MCP, agents, skills and
            permissions. React components on Mantine that follow your theme.
          </p>
          <div className={`${rise} delay-[400ms] mt-9 flex flex-col items-center gap-5`}>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
              <Link
                href="/docs/installation"
                className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-[15px] font-medium text-background shadow-[0_8px_24px_-12px_rgb(0_0_0/0.5)] transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0"
              >
                Get started
              </Link>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <GitHubIcon className="size-4" />
                View on GitHub
                <IconArrowUpRight
                  className="size-3.5 opacity-60 transition-[transform,opacity] duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </a>
            </div>
            <InstallCommand />
            <p className="text-balance text-[13px] text-muted-foreground/80">
              MIT licensed. Peer dependencies are listed in the{" "}
              <Link
                href="/docs/installation"
                className="text-muted-foreground underline decoration-muted-foreground/40 underline-offset-[3px] transition-colors hover:text-foreground hover:decoration-foreground"
              >
                installation guide
              </Link>
              .
            </p>
          </div>
        </div>
        <div className={`${rise} delay-[520ms] relative mx-auto mt-16 max-w-[1240px] px-3 pb-20 sm:mt-20 sm:px-6 sm:pb-28`}>
          <div className={classes.glow} aria-hidden="true" />
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
