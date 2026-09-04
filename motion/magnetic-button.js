(() => {
  "use strict";

  const SELECTOR = '[data-motion-target~="magnetic-button"]';
  const LABEL_SELECTOR = ":scope > .magnetic-button__label";
  const FINE_POINTER = window.matchMedia("(hover: hover) and (pointer: fine)");
  const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");

  const INFLUENCE_RADIUS = 36;
  const MAX_OFFSET = 8;
  const LABEL_DEPTH = 0.4;
  const FOLLOW_RATE = 0.24;
  const RETURN_DURATION = 480;
  const REST_EPSILON = 0.01;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  class MagneticButton {
    constructor(element) {
      this.element = element;
      this.label = element.querySelector(LABEL_SELECTOR);
      this.x = 0;
      this.y = 0;
      this.targetX = 0;
      this.targetY = 0;
      this.returnX = 0;
      this.returnY = 0;
      this.returnStartedAt = 0;
      this.frame = 0;
      this.state = "idle";
      this.tick = this.tick.bind(this);
    }

    update(pointerX, pointerY) {
      const transformedRect = this.element.getBoundingClientRect();
      const left = transformedRect.left - this.x;
      const top = transformedRect.top - this.y;
      const right = left + transformedRect.width;
      const bottom = top + transformedRect.height;
      const outsideX = Math.max(left - pointerX, 0, pointerX - right);
      const outsideY = Math.max(top - pointerY, 0, pointerY - bottom);
      const distance = Math.hypot(outsideX, outsideY);

      if (distance > INFLUENCE_RADIUS) {
        this.leave();
        return;
      }

      const strength = 1 - distance / INFLUENCE_RADIUS;
      const centerX = left + transformedRect.width / 2;
      const centerY = top + transformedRect.height / 2;

      this.targetX = clamp((pointerX - centerX) * 0.12 * strength, -MAX_OFFSET, MAX_OFFSET);
      this.targetY = clamp((pointerY - centerY) * 0.12 * strength, -MAX_OFFSET, MAX_OFFSET);
      this.state = "attract";
      this.schedule();
    }

    leave() {
      if (this.state !== "attract") return;

      this.returnX = this.x;
      this.returnY = this.y;
      this.returnStartedAt = performance.now();
      this.state = "return";
      this.schedule();
    }

    schedule() {
      if (!this.frame) this.frame = requestAnimationFrame(this.tick);
    }

    render() {
      this.element.style.transform = `translate3d(${this.x.toFixed(3)}px, ${this.y.toFixed(3)}px, 0)`;

      if (this.label) {
        const labelX = this.x * LABEL_DEPTH;
        const labelY = this.y * LABEL_DEPTH;
        this.label.style.transform = `translate3d(${labelX.toFixed(3)}px, ${labelY.toFixed(3)}px, 0)`;
      }
    }

    tick(timestamp) {
      this.frame = 0;

      if (this.state === "attract") {
        this.x += (this.targetX - this.x) * FOLLOW_RATE;
        this.y += (this.targetY - this.y) * FOLLOW_RATE;
        this.render();

        if (Math.abs(this.targetX - this.x) > REST_EPSILON || Math.abs(this.targetY - this.y) > REST_EPSILON) {
          this.schedule();
        }
        return;
      }

      if (this.state === "return") {
        const progress = clamp((timestamp - this.returnStartedAt) / RETURN_DURATION, 0, 1);
        const shifted = progress - 1;
        const overshoot = 0.75;
        const eased = 1 + (overshoot + 1) * shifted ** 3 + overshoot * shifted ** 2;
        const remaining = 1 - eased;

        this.x = this.returnX * remaining;
        this.y = this.returnY * remaining;
        this.render();

        if (progress < 1) {
          this.schedule();
        } else {
          this.reset();
        }
      }
    }

    reset() {
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.state = "idle";
      this.x = 0;
      this.y = 0;
      this.targetX = 0;
      this.targetY = 0;
      this.element.style.removeProperty("transform");
      this.label?.style.removeProperty("transform");
    }
  }

  const buttons = Array.from(document.querySelectorAll(SELECTOR), (element) => new MagneticButton(element));
  let enabled = false;

  const onPointerMove = (event) => {
    if (event.pointerType === "touch") return;
    buttons.forEach((button) => button.update(event.clientX, event.clientY));
  };

  const onPointerLeave = () => {
    buttons.forEach((button) => button.leave());
  };

  const setEnabled = () => {
    const shouldEnable = FINE_POINTER.matches && !REDUCED_MOTION.matches;
    if (shouldEnable === enabled) return;

    enabled = shouldEnable;
    if (enabled) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
    } else {
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      buttons.forEach((button) => button.reset());
    }
  };

  FINE_POINTER.addEventListener("change", setEnabled);
  REDUCED_MOTION.addEventListener("change", setEnabled);
  setEnabled();
})();
