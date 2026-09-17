import fs from "node:fs";
import path from "node:path";
import { PACKAGE_NAME } from "@/app/lib/site";

type PackageJson = {
  version: string;
  peerDependencies?: Record<string, string>;
};

const manifest = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "../package/package.json"), "utf8"),
) as PackageJson;

export const PACKAGE_VERSION = manifest.version;

export const PEER_DEPENDENCIES: Array<{ name: string; range: string }> = Object.entries(
  manifest.peerDependencies ?? {},
).map(([name, range]) => ({ name, range }));

/** Peers a user installs next to the package; react and react-dom are already in the app */
export const INSTALL_COMMAND = `npm install ${[
  PACKAGE_NAME,
  ...PEER_DEPENDENCIES.map((peer) => peer.name).filter((name) => !name.startsWith("react")),
].join(" ")}`;
