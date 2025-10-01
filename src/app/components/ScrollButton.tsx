"use client";

type ScrollButtonProps = {
  targetId: string;
  duration?: number;
  children: React.ReactNode;
  className?: string;
};

const smoothScrollTo = (targetId: string, duration = 1000) => {
  const target = document.getElementById(targetId);
  if (!target) return;

  const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let startTime: number | null = null;

  const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  };

  const animation = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) requestAnimationFrame(animation);
  };

  requestAnimationFrame(animation);
};

export default function ScrollButton({ targetId, duration = 1000, children, className }: ScrollButtonProps) {
  return (
    <button
      onClick={() => smoothScrollTo(targetId, duration)}
      className={className}
    >
      {children}
    </button>
  );
}
