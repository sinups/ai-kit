"use client";

import type { CSSProperties, ComponentType } from "react";
import {
  motion,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  IconGitCompare,
  IconLayoutSidebarRight,
  IconMessageCircle,
  IconPlug,
  IconRobot,
  IconShieldCheck,
  IconTerminal2,
  IconWand,
  type IconProps,
} from "@tabler/icons-react";
import classes from "./landing.module.css";

type Tile = {
  id: string;
  icon: ComponentType<IconProps>;
  tint: string;
  row: "top" | "side";
  wide?: boolean;
  x: string;
  y: number;
  size: number;
  mobileX?: string;
  rotate: number;
  depth: number;
  delay: number;
  duration: number;
  drift: [number, number];
};

const TILES: Tile[] = [
  { id: "chat", icon: IconMessageCircle, tint: "blue", row: "top", x: "max(-560px, -37vw)", y: 132, size: 92, mobileX: "-36vw", rotate: -8, depth: 1.2, delay: 0.38, duration: 10.5, drift: [4, -12] },
  { id: "terminal", icon: IconTerminal2, tint: "gray", row: "top", x: "max(-320px, -21vw)", y: 8, size: 60, mobileX: "-12vw", rotate: 6, depth: 0.6, delay: 0.62, duration: 8.5, drift: [2, -8] },
  { id: "mcp", icon: IconPlug, tint: "violet", row: "top", x: "min(320px, 21vw)", y: 8, size: 60, mobileX: "12vw", rotate: -5, depth: 0.6, delay: 0.58, duration: 9.8, drift: [-2, -9] },
  { id: "diff", icon: IconGitCompare, tint: "teal", row: "top", x: "min(560px, 37vw)", y: 132, size: 92, mobileX: "36vw", rotate: 7, depth: 1.2, delay: 0.46, duration: 9.2, drift: [-4, -10] },
  { id: "agents", icon: IconRobot, tint: "orange", row: "side", x: "max(-460px, -31vw)", y: 400, size: 76, rotate: 4, depth: 0.9, delay: 0.54, duration: 11.5, drift: [3, -9] },
  { id: "permissions", icon: IconShieldCheck, tint: "cyan", row: "side", x: "min(460px, 31vw)", y: 400, size: 76, rotate: -5, depth: 0.9, delay: 0.7, duration: 7.8, drift: [-3, -11] },
  { id: "skills", icon: IconWand, tint: "pink", row: "side", wide: true, x: "max(-620px, -43vw)", y: 290, size: 56, rotate: -6, depth: 0.7, delay: 0.8, duration: 9, drift: [2, -7] },
  { id: "layout", icon: IconLayoutSidebarRight, tint: "indigo", row: "side", wide: true, x: "min(620px, 43vw)", y: 290, size: 56, rotate: 5, depth: 0.7, delay: 0.86, duration: 10, drift: [-2, -8] },
];

type FloatingTilesProps = {
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
};

export function FloatingTiles({ pointerX, pointerY }: FloatingTilesProps) {
  return (
    <div className={classes.field} aria-hidden="true">
      {TILES.map((tile) => (
        <FloatingTile key={tile.id} tile={tile} pointerX={pointerX} pointerY={pointerY} />
      ))}
    </div>
  );
}

function FloatingTile({ tile, pointerX, pointerY }: FloatingTilesProps & { tile: Tile }) {
  const reduceMotion = useReducedMotion();
  const x = useTransform(pointerX, (value) => value * 36 * tile.depth);
  const y = useTransform(pointerY, (value) => value * 28 * tile.depth);
  const Icon = tile.icon;

  const style = {
    "--lx": tile.x,
    "--ly": `${tile.y}px`,
    "--ls": `${tile.size}px`,
    "--mx": tile.mobileX ?? "0px",
    "--tint": `var(--mantine-color-${tile.tint}-6)`,
    "--dur": `${tile.duration}s`,
    "--delay": `${tile.delay + 1}s`,
    "--dx": `${tile.drift[0]}px`,
    "--dy": `${tile.drift[1]}px`,
  } as CSSProperties;

  return (
    <motion.span
      className={classes.mark}
      data-row={tile.row}
      data-wide={tile.wide || undefined}
      style={{ ...style, x: reduceMotion ? 0 : x, y: reduceMotion ? 0 : y }}
    >
      <motion.span
        className="block size-full"
        initial={
          reduceMotion
            ? { rotate: tile.rotate }
            : { opacity: 0, scale: 0.6, rotate: tile.rotate + 24 }
        }
        animate={{ opacity: 1, scale: 1, rotate: tile.rotate }}
        transition={{ duration: 1, delay: reduceMotion ? 0 : tile.delay, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <span className={classes.card}>
          <Icon stroke={1.6} />
        </span>
      </motion.span>
    </motion.span>
  );
}
