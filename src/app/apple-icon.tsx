import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #146448 0%, #0C3B2E 100%)",
        }}
      >
        <div
          style={{
            width: 118,
            height: 118,
            borderRadius: 999,
            background: "#F4F1E6",
            border: "6px solid #E2B34A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              background: "#10231C",
              clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
