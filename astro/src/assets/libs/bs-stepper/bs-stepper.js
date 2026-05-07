class Stepper {
  constructor(element, options = {}) {
    this._element = element;
    this._options = { linear: true, ...options };
    this._steps = Array.from(this._element.querySelectorAll('.step'));
    this._currentIndex = this._steps.findIndex((step) => step.classList.contains('active'));
    if (this._currentIndex < 0) {
      this._currentIndex = 0;
    }
    this._bindStepTriggers();
    this._show(this._currentIndex, false);
  }

  _bindStepTriggers() {
    const triggers = this._element.querySelectorAll('.step-trigger');
    triggers.forEach((trigger, index) => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        if (this._options.linear && index > this._currentIndex) {
          return;
        }
        this._show(index);
      });
    });
  }

  _getContent(step) {
    const target = step?.getAttribute('data-target') || step?.dataset?.target;
    if (!target) {
      return null;
    }
    return this._element.querySelector(target);
  }

  _dispatchShowEvent(toIndex, fromIndex) {
    const detail = { indexStep: toIndex, to: toIndex, from: fromIndex };
    const event = new CustomEvent('show.bs-stepper', { detail, bubbles: true });
    this._element.dispatchEvent(event);
  }

  _show(index, dispatch = true) {
    if (!this._steps.length) {
      return;
    }

    const nextIndex = Math.max(0, Math.min(index, this._steps.length - 1));
    const prevIndex = this._currentIndex;

    this._steps.forEach((step) => step.classList.remove('active'));
    const nextStep = this._steps[nextIndex];
    nextStep?.classList.add('active');

    const contents = this._element.querySelectorAll('.bs-stepper-content .content');
    contents.forEach((content) => content.classList.remove('active'));
    const targetContent = nextStep ? this._getContent(nextStep) : null;
    targetContent?.classList.add('active');

    this._currentIndex = nextIndex;

    if (dispatch) {
      this._dispatchShowEvent(nextIndex, prevIndex);
    }
  }

  next() {
    this._show(this._currentIndex + 1);
  }

  previous() {
    this._show(this._currentIndex - 1);
  }
}

const bsStepper = document.querySelectorAll('.bs-stepper');

// Adds crossed class
bsStepper.forEach((el) => {
  el.addEventListener('show.bs-stepper', function (event) {
    var index = event.detail.indexStep;
    var numberOfSteps = el.querySelectorAll('.line').length;
    var line = el.querySelectorAll('.step');

    // The first for loop is for increasing the steps,
    // the second is for turning them off when going back
    // and the third with the if statement because the last line
    // can't seem to turn off when I press the first item. ¯\_(ツ)_/¯

    for (let i = 0; i < index; i++) {
      line[i].classList.add('crossed');

      for (let j = index; j < numberOfSteps; j++) {
        line[j].classList.remove('crossed');
      }
    }
    if (event.detail.to == 0) {
      for (let k = index; k < numberOfSteps; k++) {
        line[k].classList.remove('crossed');
      }
      line[0].classList.remove('crossed');
    }
  });
});

try {
  window.Stepper = Stepper;
} catch (e) {}

export { Stepper };
