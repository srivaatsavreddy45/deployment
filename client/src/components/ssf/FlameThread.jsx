import { useEffect, useRef } from "react";

export default function FlameThread() {
  const pathRef = useRef(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    function sizePath() {
      const h = document.body.scrollHeight;
      path.setAttribute("d", `M1,0 L1,${h}`);
      const len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      update();
    }
    function update() {
      const len = path.getTotalLength();
      const scrollable = document.body.scrollHeight - window.innerHeight;
      const scrolled = scrollable > 0 ? window.scrollY / scrollable : 0;
      path.style.strokeDashoffset = len - len * Math.min(scrolled, 1);
    }
    sizePath();
    window.addEventListener("resize", sizePath);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("resize", sizePath);
      window.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div className="ssf-flame-thread" aria-hidden="true">
      <svg width="2" height="100%" preserveAspectRatio="none">
        <path ref={pathRef} className="ssf-flame-path" d="M1,0 L1,4000" />
      </svg>
    </div>
  );
}
