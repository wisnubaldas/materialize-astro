import Popper from '@popperjs/core/dist/umd/popper.min';

// Required to enable animations on dropdowns/tooltips/popovers
// Popper.Defaults.modifiers.computeStyle.gpuAcceleration = false
if (typeof window !== 'undefined') {
  try {
    window.Popper = Popper;
  } catch (e) {
    console.error(e);
  }
}

export { Popper };
