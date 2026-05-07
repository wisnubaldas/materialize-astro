import { Icon } from '@iconify-icon/react';
import { useEffect } from 'react';

export default function BackdropLoader({ active = false, message = 'Loading...' }) {
  // Disable scroll body ketika backdrop aktif
  useEffect(() => {
    if (active) {
      // simpan nilai sebelumnya kalau ada custom overflow
      const prevOverflow = document.body.style.overflow;
      document.body.dataset.prevOverflow = prevOverflow;
      document.body.style.overflow = 'hidden';
    } else {
      // restore overflow sebelumnya
      if (document.body.dataset.prevOverflow !== undefined) {
        document.body.style.overflow = document.body.dataset.prevOverflow;
        delete document.body.dataset.prevOverflow;
      } else {
        document.body.style.overflow = '';
      }
    }

    // cleanup kalau komponen di-unmount masih active
    return () => {
      if (document.body.dataset?.prevOverflow !== undefined) {
        document.body.style.overflow = document.body.dataset.prevOverflow;
        delete document.body.dataset.prevOverflow;
      } else {
        document.body.style.overflow = '';
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <div style={backdropStyle}>
      <div style={panelStyle}>
        <Icon icon="svg-spinners:blocks-shuffle-3" width="96" height="96" style={iconStyle} />
        <div style={textStyle}>{message}</div>
      </div>
    </div>
  );
}

// ==== inline style objects ====
const backdropStyle = {
  position: 'fixed',
  inset: 0, // shorthand top/right/bottom/left = 0
  backgroundColor: 'rgba(0,0,0,0.5)',
  zIndex: 2000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(2px)', // sedikit efek frost, opsional
};

const panelStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  backgroundColor: '#f7f7f900',
  color: '#bcf5cc',
  borderRadius: '1rem',
  padding: '1.5rem 2rem',
  minWidth: '200px',
  //   boxShadow: '0 1rem 3rem rgba(0,0,0,.175)',
  //   border: '1px solid rgba(0,0,0,.05)',
};

const iconStyle = {
  display: 'block',
  marginBottom: '0.75rem',
};

const textStyle = {
  fontSize: '1.5rem',
  fontWeight: 500,
  color: 'rgb(249, 255, 253)',
};
