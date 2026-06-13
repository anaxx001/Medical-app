interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
}

/**
 * Reusable empty-state placeholder shown when a list has no items.
 */
export default function EmptyState({ emoji, title, description }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "360px",
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
        padding: "40px",
        textAlign: "center",
        gap: "16px",
      }}
    >
      <div style={{ fontSize: "56px" }}>{emoji}</div>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "18px",
          color: "var(--text)",
          margin: 0,
        }}
      >
        {title}
      </h2>
      {description && (
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            maxWidth: "280px",
            margin: 0,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
