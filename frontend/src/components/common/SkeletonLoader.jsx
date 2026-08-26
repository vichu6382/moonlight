import { motion } from 'framer-motion';

export function SkeletonLoader({ rows = 3, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton-pulse"
          style={{
            height: '16px',
            marginBottom: i < rows - 1 ? '12px' : 0,
            width: `${70 + (i * 7) % 30}%`,
          }}
        />
      ))}
    </motion.div>
  );
}

export function SkeletonCard({ count = 4 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.05 }}
          className="skeleton-pulse"
          style={{ height: '100px' }}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ cols = 5, rows = 5 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="skeleton-pulse"
            style={{ height: '14px', flex: i === 0 ? 2 : 1 }}
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="skeleton-pulse"
              style={{ height: '14px', flex: j === 0 ? 2 : 1 }}
            />
          ))}
        </div>
      ))}
    </motion.div>
  );
}
