/**
 * Admin Suspense boundary — shown while admin route segments load.
 * Matches the desk aesthetic: neutral-200 background, ivory card, kicker-style label.
 */
export default function AdminLoading() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "var(--color-neutral-200)",
      }}
    >
      <div
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-divider)",
          borderRadius: "var(--cl-radius-lg, 12px)",
          boxShadow: "var(--shadow-sm)",
          padding: "2.5rem 3rem",
          textAlign: "center",
          minWidth: "180px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-heading, var(--font-cormorant))",
            fontSize: "20px",
            color: "var(--color-text)",
            marginBottom: "0.5rem",
          }}
        >
          D&amp;G Realtors
        </p>
        <p
          style={{
            fontSize: "11.5px",
            color: "var(--color-neutral-500)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Loading&hellip;
        </p>
      </div>
    </div>
  )
}
