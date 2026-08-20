import { ImageResponse } from "next/og";

export const alt = "AVLIX — AVL rotation puzzle";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#efe4cc",
          color: "#1c1510",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#8a5a22",
          }}
        >
          Workshop No. 1
          <span>Tree shapes only</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 148,
              lineHeight: 0.85,
              letterSpacing: "-0.05em",
              fontWeight: 650,
            }}
          >
            AVLIX
          </div>
          <div
            style={{
              fontSize: 32,
              lineHeight: 1.35,
              color: "#4a3c32",
              maxWidth: 820,
            }}
          >
            A Rubik’s cube for binary trees. Rotate until every node is AVL-balanced.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 18,
            fontSize: 22,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#2f5a3c",
          }}
        >
          <span>Campaign</span>
          <span>·</span>
          <span>Tutorial</span>
          <span>·</span>
          <span>Free Play</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
