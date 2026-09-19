import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

const SECTION_LABELS: Record<string, string> = {
  components: "Components",
  docs: "Docs",
  "use-cases": "Use cases",
  "getting-started": "Getting started",
  "test-agent": "Test agent",
};

async function loadFont(fileName: string): Promise<ArrayBuffer | null> {
  try {
    const filePath = path.join(process.cwd(), "public", "fonts", fileName);
    const buffer = await readFile(filePath);
    return buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;
  } catch (error) {
    console.error(`Failed to load OG font "${fileName}":`, error);
    return null;
  }
}

const geistSemiBold = loadFont("Geist-SemiBold.ttf");
const geistRegular = loadFont("Geist-Regular.ttf");
const geistMedium = loadFont("Geist-Medium.ttf");

export type OgEyebrow =
  | "COMPONENT"
  | "DOCUMENTATION"
  | "USE CASE"
  | "GETTING STARTED"
  | "LIVE DEMO";

export async function generateAgentElementsOg({
  title,
  description = "",
  section = "",
  eyebrow = "DOCUMENTATION",
}: {
  title: string;
  description?: string;
  section?: string;
  eyebrow?: OgEyebrow;
}) {
  const [semiBoldFont, regularFont, mediumFont] = await Promise.all([
    geistSemiBold,
    geistRegular,
    geistMedium,
  ]);
  const fonts = [
    regularFont
      ? {
          name: "Geist",
          data: regularFont,
          weight: 400 as const,
          style: "normal" as const,
        }
      : null,
    mediumFont
      ? {
          name: "Geist",
          data: mediumFont,
          weight: 500 as const,
          style: "normal" as const,
        }
      : null,
    semiBoldFont
      ? {
          name: "Geist",
          data: semiBoldFont,
          weight: 600 as const,
          style: "normal" as const,
        }
      : null,
  ].filter((font) => font !== null);

  const sectionLabel = SECTION_LABELS[section] || section;

  const dashedLineSvg = `data:image/svg+xml,${encodeURIComponent(
    `<svg width="1200" height="1" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="0.5" x2="1200" y2="0.5" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4 6" stroke-linecap="round"/></svg>`,
  )}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#09090b",
          color: "white",
          fontFamily: "Geist",
          position: "relative",
        }}
      >
        {/* Left hairline */}
        <div
          style={{
            position: "absolute",
            left: 48,
            top: 0,
            bottom: 0,
            width: 1,
            background: "rgba(255,255,255,0.06)",
          }}
        />
        {/* Right hairline */}
        <div
          style={{
            position: "absolute",
            right: 48,
            top: 0,
            bottom: 0,
            width: 1,
            background: "rgba(255,255,255,0.06)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            padding: "0 49px",
          }}
        >
          {/* Nav row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "24px 32px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.15A.5.5 0 0 1 5 18.75V16a2.5 2.5 0 0 1-1-2v-8.5Z" />
                <path d="M8.5 9.5h7" />
                <path d="M8.5 12.5h4" />
              </svg>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                }}
              >
                AI UI Kit
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.25)" }}>
                AI UI Kit
              </span>
              {sectionLabel ? (
                <>
                  <span style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
                  <span>{sectionLabel}</span>
                </>
              ) : null}
            </div>
          </div>

          {/* Dashed divider (top) */}
          <div
            style={{
              display: "flex",
              width: "100%",
              height: 1,
              backgroundImage: `url("${dashedLineSvg}")`,
              backgroundRepeat: "repeat-x",
              backgroundSize: "100% 1px",
            }}
          />

          {/* Main content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
              padding: "0 32px",
              gap: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontWeight: 500,
                color: "rgba(255,255,255,0.25)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="rgba(255,255,255,0.25)"
              >
                <rect x="0" y="0" width="10" height="2" />
                <rect x="0" y="4" width="10" height="2" />
                <rect x="0" y="8" width="10" height="2" />
              </svg>
              {eyebrow}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 52,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                maxWidth: "80%",
              }}
            >
              {title}
            </div>

            {description && (
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.4,
                  maxWidth: "70%",
                }}
              >
                {description.length > 130
                  ? description.slice(0, 130) + "..."
                  : description}
              </div>
            )}
          </div>

          {/* Dashed divider (bottom) */}
          <div
            style={{
              display: "flex",
              width: "100%",
              height: 1,
              backgroundImage: `url("${dashedLineSvg}")`,
              backgroundRepeat: "repeat-x",
              backgroundSize: "100% 1px",
            }}
          />

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 32px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 13,
                fontWeight: 400,
                color: "rgba(255,255,255,0.25)",
              }}
            >
              @sinups/ai-kit
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 500,
                color: "rgba(255,255,255,0.4)",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "5px 14px",
              }}
            >
              AI UI Kit
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
    },
  );
}
