/**
 * Root Suspense boundary — shown while the public-facing pages load.
 * Classical design: ivory background, Cormorant Garamond heading, neutral indicator.
 */
export default function RootLoading() {
  return (
    <div
      className="cl-root"
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontFamily: "var(--font-heading, var(--font-cormorant))",
            fontSize: "clamp(22px, 4vw, 32px)",
            color: "var(--color-text)",
            letterSpacing: "0.04em",
            marginBottom: "0.5rem",
          }}
        >
          D&amp;G Realtors
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "var(--color-neutral-500)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Loading&hellip;
        </p>
      </div>
    </div>
  )
}
