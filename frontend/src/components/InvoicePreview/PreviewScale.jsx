import { useEffect, useRef, useState } from 'react';

const SHEET_WIDTH = 794;

export function PreviewScale({ children }) {
  const wrapRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 640px)').matches);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      if (window.matchMedia('(max-width: 640px)').matches) {
        setScale(1);
        return;
      }
      const avail = el.clientWidth - 16;
      const s = Math.min(1, avail / SHEET_WIDTH);
      setScale(s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const [sheetHeight, setSheetHeight] = useState(1100);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSheetHeight(el.offsetHeight));
    ro.observe(el);
    setSheetHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div ref={wrapRef} className="preview-scale" style={{ overflow: 'hidden', width: '100%' }}>
      <div
        className="preview-scale-inner"
        style={{
          width: isMobile ? '100%' : SHEET_WIDTH,
          transform: !isMobile && scale < 1 ? `scale(${scale})` : 'none',
          transformOrigin: 'top left',
          height: !isMobile && scale < 1 ? Math.ceil(sheetHeight * scale) : 'auto'
        }}
      >
        <div ref={innerRef} style={{ width: isMobile ? '100%' : SHEET_WIDTH }}>
          {children}
        </div>
      </div>
    </div>
  );
}