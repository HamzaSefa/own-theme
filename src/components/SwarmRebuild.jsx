import { useEffect, useRef, useState } from "react";

const colors = ["#ff5c8a", "#56d5ff", "#ffd166", "#8cff7a", "#c79bff", "#ff9d55", "#55f0c1", "#ff78d1"];
const cursorCount = 6;
const tileStagger = 85;
const tileRevealDuration = 220;
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function makeTiles(width, height) {
  const columns = Math.max(3, Math.min(8, Math.round(width / 145)));
  const rows = Math.max(2, Math.min(6, Math.round(height / 105)));
  const tiles = Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const left = Math.round((column * width) / columns);
    const top = Math.round((row * height) / rows);
    const right = Math.round(((column + 1) * width) / columns);
    const bottom = Math.round(((row + 1) * height) / rows);
    return { x: left, y: top, width: right - left, height: bottom - top };
  });

  for (let index = tiles.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [tiles[index], tiles[swapIndex]] = [tiles[swapIndex], tiles[index]];
  }
  return tiles;
}

function ease(value) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function cursorPosition(index, elapsed, tiles, width, height) {
  if (!tiles.length) return { x: 0, y: 0 };
  const cycle = elapsed / 540 + index * (tiles.length / cursorCount);
  const targetIndex = ((Math.floor(cycle) % tiles.length) + tiles.length) % tiles.length;
  const from = tiles[targetIndex];
  const to = tiles[(targetIndex + 1) % tiles.length];
  const progress = ease(cycle - Math.floor(cycle));
  const fromX = from.x + from.width / 2;
  const fromY = from.y + from.height / 2;
  const toX = to.x + to.width / 2;
  const toY = to.y + to.height / 2;
  const sway = Math.sin(elapsed / 120 + index * 1.7) * 9;
  return {
    x: Math.max(3, Math.min(width - 3, fromX + (toX - fromX) * progress + sway)),
    y: Math.max(3, Math.min(height - 3, fromY + (toY - fromY) * progress + Math.cos(elapsed / 145 + index) * 8)),
  };
}

function drawPointer(context, x, y, color) {
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + 2, y + 13);
  context.lineTo(x + 5, y + 9);
  context.lineTo(x + 10, y + 15);
  context.lineTo(x + 13, y + 12);
  context.lineTo(x + 8, y + 7);
  context.lineTo(x + 13, y + 6);
  context.closePath();
  context.fillStyle = color;
  context.fill();
  context.strokeStyle = "rgba(5, 9, 8, .9)";
  context.lineWidth = 1.5;
  context.stroke();
}

export default function SwarmRebuild({ label = "media", video = false }) {
  const layerRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const swarmCanvasRef = useRef(null);
  const [phase, setPhase] = useState("idle");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (phase !== "running") return undefined;

    const layer = layerRef.current;
    const maskCanvas = maskCanvasRef.current;
    const swarmCanvas = swarmCanvasRef.current;
    const maskContext = maskCanvas?.getContext("2d");
    const swarmContext = swarmCanvas?.getContext("2d");
    if (!layer || !maskCanvas || !swarmCanvas || !maskContext || !swarmContext) {
      throw new Error(`The ${label} rebuild effect could not initialize its canvas.`);
    }

    let frameId = 0;
    let startedAt = 0;
    let width = 0;
    let height = 0;
    let tiles = [];
    let revealedCount = 0;

    function resize() {
      const bounds = layer.getBoundingClientRect();
      const bottomInset = video ? 48 : 0;
      width = Math.max(0, bounds.width);
      height = Math.max(0, bounds.height - bottomInset);
      if (!width || !height) return;

      const scale = Math.min(window.devicePixelRatio || 1, 2);
      [maskCanvas, swarmCanvas].forEach((canvas) => {
        canvas.width = Math.ceil(width * scale);
        canvas.height = Math.ceil(height * scale);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.getContext("2d")?.setTransform(scale, 0, 0, scale, 0, 0);
      });

      tiles = makeTiles(width, height);
      revealedCount = 0;
      maskContext.fillStyle = "#0b100f";
      maskContext.fillRect(0, 0, width, height);
      startedAt = performance.now();
    }

    function draw(now) {
      if (!width || !height || !tiles.length) {
        frameId = requestAnimationFrame(draw);
        return;
      }

      const elapsed = Math.max(0, now - startedAt);
      while (
        revealedCount < tiles.length
        && elapsed >= revealedCount * tileStagger + tileRevealDuration
      ) {
        const tile = tiles[revealedCount];
        maskContext.clearRect(tile.x, tile.y, tile.width, tile.height);
        revealedCount += 1;
      }

      swarmContext.clearRect(0, 0, width, height);
      tiles.forEach((tile, index) => {
        const tileStart = index * tileStagger;
        const tileAge = elapsed - tileStart;
        if (tileAge < 0 || tileAge >= tileRevealDuration) return;

        const progress = tileAge / tileRevealDuration;
        const inset = 2 + (1 - progress) * 5;
        swarmContext.globalAlpha = 1 - progress * 0.62;
        swarmContext.strokeStyle = colors[index % colors.length];
        swarmContext.lineWidth = 1.5;
        swarmContext.strokeRect(
          tile.x + inset,
          tile.y + inset,
          Math.max(1, tile.width - inset * 2),
          Math.max(1, tile.height - inset * 2),
        );
        swarmContext.globalAlpha = 1;
      });

      for (let index = 0; index < cursorCount; index += 1) {
        const color = colors[index % colors.length];
        const point = cursorPosition(index, elapsed, tiles, width, height);
        swarmContext.beginPath();
        for (let trail = 5; trail >= 0; trail -= 1) {
          const previous = cursorPosition(index, Math.max(0, elapsed - trail * 28), tiles, width, height);
          if (trail === 5) swarmContext.moveTo(previous.x, previous.y);
          else swarmContext.lineTo(previous.x, previous.y);
        }
        swarmContext.strokeStyle = color;
        swarmContext.globalAlpha = 0.12;
        swarmContext.lineWidth = 2;
        swarmContext.stroke();
        swarmContext.globalAlpha = 1;
        drawPointer(swarmContext, point.x, point.y, color);
      }

      const totalDuration = (tiles.length - 1) * tileStagger + tileRevealDuration;
      if (elapsed >= totalDuration) {
        swarmContext.clearRect(0, 0, width, height);
        setPhase("done");
        setStatus(`${label} rebuilt.`);
        return;
      }
      frameId = requestAnimationFrame(draw);
    }

    const observer = new ResizeObserver(() => {
      resize();
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(draw);
    });
    observer.observe(layer);
    resize();
    frameId = requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [label, phase, video]);

  function start() {
    if (window.matchMedia(reducedMotionQuery).matches) {
      setPhase("skipped");
      setStatus(`Animation skipped for ${label} because reduced motion is enabled.`);
      return;
    }
    if (typeof ResizeObserver === "undefined") {
      setPhase("unavailable");
      setStatus(`The ${label} rebuild effect is unavailable because resize observation is not supported.`);
      return;
    }
    if (!document.createElement("canvas").getContext("2d")) {
      setPhase("unavailable");
      setStatus(`The ${label} rebuild effect is unavailable because canvas is not supported.`);
      return;
    }
    setStatus(`Rebuilding ${label}.`);
    setPhase("running");
  }

  function exit() {
    setPhase("idle");
    setStatus("");
  }

  const showCanvases = phase === "running" || phase === "done";

  return (
    <div
      className={`swarm-rebuild-layer${video ? " swarm-rebuild-video" : ""}`}
      ref={layerRef}
      aria-label={`${label} rebuild effect`}
    >
      {showCanvases && (
        <div className="swarm-canvas-stack" aria-hidden="true">
          <canvas className="swarm-mask-canvas" ref={maskCanvasRef} />
          <canvas className="swarm-cursor-canvas" ref={swarmCanvasRef} />
        </div>
      )}
      <div className="swarm-rebuild-controls">
        {phase === "idle" && <button type="button" className="swarm-rebuild-button" onClick={start}>Rebuild</button>}
        {phase === "running" && <button type="button" className="swarm-rebuild-button" onClick={exit}>Exit</button>}
        {phase === "done" && (
          <>
            <button type="button" className="swarm-rebuild-button" onClick={start}>Replay</button>
            <button type="button" className="swarm-rebuild-button" onClick={exit}>Exit</button>
          </>
        )}
        {phase === "skipped" && (
          <>
            <span className="swarm-rebuild-note">Reduced motion</span>
            <button type="button" className="swarm-rebuild-button" onClick={exit}>Exit</button>
          </>
        )}
        {phase === "unavailable" && (
          <>
            <span className="swarm-rebuild-note">Effect unavailable</span>
            <button type="button" className="swarm-rebuild-button" onClick={exit}>Exit</button>
          </>
        )}
      </div>
      <span className="swarm-sr-only" role="status" aria-live="polite">{status}</span>
    </div>
  );
}
