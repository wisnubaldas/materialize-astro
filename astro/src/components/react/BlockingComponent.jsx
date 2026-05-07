import { Icon } from '@iconify-icon/react';

export default function BlockingComponent({ message = 'Loading...' }) {
  return (
    <>
      <div className="block-ui">
        <Icon icon="line-md:cloud-alt-upload-twotone-loop" width="40" height="40" />
        <h5>{message}</h5>
      </div>
      {/* === CSS langsung di dalam komponen === */}
      <style>{`
        /* Buat file: src/scss/block-ui.css */
        .ns-block-ui-overlay {
          background-color: rgba(var(--bs-dark-rgb), 0.5);
          backdrop-filter: blur(2px);
          z-index: 1050;
        }

        .ns-block-ui-message {
          color: var(--bs-primary);
          font-family: "Quicksand", var(--bs-body-font-family);
          font-size: 1.1rem;
          font-weight: 500;
          text-align: center;
        }
      `}</style>
    </>
  );
}
