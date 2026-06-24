export function Chip({ bg, children, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 9px', borderRadius: 6,
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 500,
      color: '#fff', whiteSpace: 'nowrap', background: bg, ...style,
    }}>
      {children}
    </span>
  );
}
