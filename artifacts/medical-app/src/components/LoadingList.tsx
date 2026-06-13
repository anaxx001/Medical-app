interface LoadingListProps {
  count?: number;
  height?: string;
}

/**
 * Placeholder skeleton list shown while content is loading.
 */
export default function LoadingList({ count = 3, height = "100px" }: LoadingListProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height,
            borderRadius: "var(--radius)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  );
}
