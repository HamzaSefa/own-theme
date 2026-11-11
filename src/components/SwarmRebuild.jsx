import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const colors = ["#ff5c8a", "#56d5ff", "#ffd166", "#8cff7a", "#c79bff", "#ff9d55", "#55f0c1", "#ff78d1"];
const cursorCount = 6;
const tileStagger = 65;
const tileRevealDuration = 260;
const mediaSelector = "[data-swarm-media]";
const maxConcurrentAnimations = 3;
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
  return {
    x: Math.max(3, Math.min(width - 3, fromX + (toX - fromX) * progress + Math.sin(elapsed / 120 + index * 1.7) * 9)),
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

function getMediaKey(media) {
  if (media instanceof HTMLImageElement) {
    const sources = [...(media.closest("picture")?.querySelectorAll("source") || [])]
      .map((source) => `${source.getAttribute("srcset") || ""}|${source.getAttribute("media") || ""}|${source.getAttribute("type") || ""}`)
      .join(",");
    return `${media.getAttribute("src") || ""}|${media.getAttribute("srcset") || ""}|${sources}`;
  }
  if (media instanceof HTMLVideoElement) {
    const sources = [...media.querySelectorAll("source")].map((source) => `${source.src}|${source.type}`).join(",");
    return `${media.getAttribute("src") || ""}|${sources}|${media.getAttribute("poster") || ""}`;
  }
  return media.getAttribute("style") || "";
}

function isMediaReady(media) {
  if (media instanceof HTMLImageElement) return media.complete && media.naturalWidth > 0;
  if (media instanceof HTMLVideoElement) {
    return Boolean(media.getAttribute("poster") || media.getAttribute("src") || media.querySelector("source"))
      || media.readyState >= 2;
  }
  return media.hasAttribute("data-swarm-media");
}

function createOverlay(media, onFinish) {
  const isVideo = media instanceof HTMLVideoElement;
  const style = getComputedStyle(media);
  const host = document.createElement("div");
  host.className = "swarm-auto-layer";
  host.setAttribute("aria-hidden", "true");
  host.style.position = "absolute";
  host.style.zIndex = style.zIndex === "auto" ? "1" : style.zIndex;
  host.style.borderRadius = isVideo
    ? `${style.borderTopLeftRadius} ${style.borderTopRightRadius} 0 0`
    : style.borderRadius;
  host.style.pointerEvents = "none";
  host.style.overflow = "hidden";

  const maskCanvas = document.createElement("canvas");
  const cursorCanvas = document.createElement("canvas");
  maskCanvas.className = "swarm-mask-canvas";
  cursorCanvas.className = "swarm-cursor-canvas";
  host.append(maskCanvas, cursorCanvas);

  const maskContext = maskCanvas.getContext("2d");
  const cursorContext = cursorCanvas.getContext("2d");
  if (!maskContext || !cursorContext) {
    console.error("Swarm Rebuild could not initialize its canvases.");
    return null;
  }

  const containingBlock = media.offsetParent || document.body;
  containingBlock.append(host);
  let frameId = 0;
  let startedAt = performance.now();
  let width = 0;
  let height = 0;
  let tiles = [];
  let revealedCount = 0;
  let disposed = false;

  function resize() {
    const bounds = media.getBoundingClientRect();
    const inset = isVideo ? Math.min(48, bounds.height * 0.25) : 0;
    width = Math.max(0, bounds.width);
    height = Math.max(0, bounds.height - inset);
    if (!width || !height) return;

    const containingBounds = containingBlock.getBoundingClientRect();
    host.style.left = `${bounds.left - containingBounds.left + containingBlock.scrollLeft - containingBlock.clientLeft}px`;
    host.style.top = `${bounds.top - containingBounds.top + containingBlock.scrollTop - containingBlock.clientTop}px`;
    host.style.width = `${width}px`;
    host.style.height = `${height}px`;

    const scale = Math.min(window.devicePixelRatio || 1, 2);
    [maskCanvas, cursorCanvas].forEach((canvas) => {
      canvas.width = Math.ceil(width * scale);
      canvas.height = Math.ceil(height * scale);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.getContext("2d")?.setTransform(scale, 0, 0, scale, 0, 0);
    });

    const elapsed = Math.max(0, performance.now() - startedAt);
    tiles = makeTiles(width, height);
    revealedCount = Math.min(tiles.length, Math.max(0, Math.floor((elapsed - tileRevealDuration) / tileStagger) + 1));
    maskContext.fillStyle = "#0b100f";
    maskContext.fillRect(0, 0, width, height);
    for (let index = 0; index < revealedCount; index += 1) {
      const tile = tiles[index];
      maskContext.clearRect(tile.x, tile.y, tile.width, tile.height);
    }
  }

  function draw(now) {
    if (disposed) return;
    if (!width || !height || !tiles.length) {
      resize();
      frameId = requestAnimationFrame(draw);
      return;
    }

    const elapsed = Math.max(0, now - startedAt);
    while (revealedCount < tiles.length && elapsed >= revealedCount * tileStagger + tileRevealDuration) {
      const tile = tiles[revealedCount];
      maskContext.clearRect(tile.x, tile.y, tile.width, tile.height);
      revealedCount += 1;
    }

    cursorContext.clearRect(0, 0, width, height);
    tiles.forEach((tile, index) => {
      const tileAge = elapsed - index * tileStagger;
      if (tileAge < 0 || tileAge >= tileRevealDuration) return;
      const progress = tileAge / tileRevealDuration;
      const inset = 2 + (1 - progress) * 5;
      cursorContext.globalAlpha = 1 - progress * 0.62;
      cursorContext.strokeStyle = colors[index % colors.length];
      cursorContext.lineWidth = 1.5;
      cursorContext.strokeRect(tile.x + inset, tile.y + inset, Math.max(1, tile.width - inset * 2), Math.max(1, tile.height - inset * 2));
      cursorContext.globalAlpha = 1;
    });

    for (let index = 0; index < cursorCount; index += 1) {
      const color = colors[index % colors.length];
      const point = cursorPosition(index, elapsed, tiles, width, height);
      cursorContext.beginPath();
      for (let trail = 5; trail >= 0; trail -= 1) {
        const previous = cursorPosition(index, Math.max(0, elapsed - trail * 28), tiles, width, height);
        if (trail === 5) cursorContext.moveTo(previous.x, previous.y);
        else cursorContext.lineTo(previous.x, previous.y);
      }
      cursorContext.strokeStyle = color;
      cursorContext.globalAlpha = 0.12;
      cursorContext.lineWidth = 2;
      cursorContext.stroke();
      cursorContext.globalAlpha = 1;
      drawPointer(cursorContext, point.x, point.y, color);
    }

    const totalDuration = (tiles.length - 1) * tileStagger + tileRevealDuration;
    if (elapsed >= totalDuration) {
      dispose();
      onFinish();
      return;
    }
    resizePosition();
    frameId = requestAnimationFrame(draw);
  }

  function resizePosition() {
    const bounds = media.getBoundingClientRect();
    const containingBounds = containingBlock.getBoundingClientRect();
    host.style.left = `${bounds.left - containingBounds.left + containingBlock.scrollLeft - containingBlock.clientLeft}px`;
    host.style.top = `${bounds.top - containingBounds.top + containingBlock.scrollTop - containingBlock.clientTop}px`;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frameId);
    observer?.disconnect();
    window.removeEventListener("resize", resize);
    host.remove();
  }

  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
  if (observer) observer.observe(media);
  else window.addEventListener("resize", resize);
  resize();
  frameId = requestAnimationFrame(draw);
  return dispose;
}

export default function SwarmRebuild() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const records = new WeakMap();
    const activeRecords = new Set();
    const completedRecords = new Set();
    const queue = [];
    let activeCount = 0;
    let stopped = false;
    let completedScrollFrame = 0;
    const motionPreference = window.matchMedia(reducedMotionQuery);

    function releaseSlot(record) {
      if (!record.hasSlot) return;
      record.hasSlot = false;
      activeCount = Math.max(0, activeCount - 1);
    }

    function removeRecord(media, record) {
      if (record.timer) clearTimeout(record.timer);
      record.timer = 0;
      record.cancelAnimation?.();
      record.cancelAnimation = null;
      releaseSlot(record);
      record.listeners.forEach(([event, listener]) => media.removeEventListener(event, listener));
      record.listeners = [];
      intersectionObserver?.unobserve(media);
      activeRecords.delete(record);
      completedRecords.delete(record);
      if (records.get(media) === record) records.delete(media);
    }

    function finish(media, record) {
      record.cancelAnimation = null;
      record.status = "done";
      releaseSlot(record);
      completedRecords.add(record);
      pump();
    }

    function maybeQueue(media, record) {
      if (stopped || !media.isConnected || records.get(media) !== record || record.status !== "waiting" || !record.inViewport) return;
      if (motionPreference.matches) {
        record.status = "skipped";
        return;
      }
      if (!isMediaReady(media) || !media.getBoundingClientRect().width || !media.getBoundingClientRect().height) return;
      record.status = "queued";
      queue.push({ media, record });
      pump();
    }

    function pump() {
      while (!stopped && activeCount < maxConcurrentAnimations && queue.length) {
        const { media, record } = queue.shift();
        if (!media.isConnected || records.get(media) !== record || record.status !== "queued") continue;
        activeCount += 1;
        record.hasSlot = true;
        record.status = "delayed";
        record.timer = window.setTimeout(() => {
          record.timer = 0;
          if (stopped || !media.isConnected || records.get(media) !== record) {
            releaseSlot(record);
            pump();
            return;
          }
          record.status = "running";
          record.cancelAnimation = createOverlay(media, () => finish(media, record));
          if (!record.cancelAnimation) {
            record.status = "error";
            releaseSlot(record);
            pump();
          }
        }, 90 + Math.random() * 230);
      }
    }

    function refresh(media) {
      if (!media.isConnected) return;
      const key = getMediaKey(media);
      const existing = records.get(media);
      if (existing?.key === key) {
        maybeQueue(media, existing);
        return;
      }
      if (existing) removeRecord(media, existing);

      const record = { media, key, status: "waiting", inViewport: false, hasSlot: false, timer: 0, cancelAnimation: null, listeners: [] };
      records.set(media, record);
      activeRecords.add(record);
      const onMediaEvent = () => refresh(media);
      const events = media instanceof HTMLImageElement
        ? ["load", "error"]
        : media instanceof HTMLVideoElement
          ? ["loadeddata", "canplay", "loadedmetadata", "error"]
          : [];
      events.forEach((event) => {
        media.addEventListener(event, onMediaEvent);
        record.listeners.push([event, onMediaEvent]);
      });

      if (motionPreference.matches) {
        record.status = "skipped";
      } else {
        intersectionObserver?.observe(media);
        if (!intersectionObserver) {
          record.inViewport = isInViewport(media);
          maybeQueue(media, record);
        }
      }
    }

    function scan(root) {
      if (root instanceof Element && root.matches(mediaSelector)) refresh(root);
      root.querySelectorAll?.(mediaSelector).forEach(refresh);
    }

    function cleanRemoved(root) {
      if (root instanceof Element && root.matches(mediaSelector)) {
        const record = records.get(root);
        if (record) removeRecord(root, record);
      }
      root.querySelectorAll?.(mediaSelector).forEach((media) => {
        const record = records.get(media);
        if (record) removeRecord(media, record);
      });
    }

    const intersectionObserver = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const record = records.get(entry.target);
          if (!record) return;
          if (entry.isIntersecting) {
            record.inViewport = true;
            if (record.status === "done" || record.status === "error") {
              record.status = "waiting";
              completedRecords.delete(record);
            }
            maybeQueue(entry.target, record);
          } else {
            record.inViewport = false;
            if (record.status === "queued") record.status = "waiting";
            if (record.status === "delayed") {
              clearTimeout(record.timer);
              record.timer = 0;
              record.status = "waiting";
              releaseSlot(record);
              pump();
            }
          }
        });
      }, { rootMargin: "120px" });

    function isInViewport(media) {
      const bounds = media.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0
        && bounds.bottom >= 0 && bounds.right >= 0
        && bounds.top <= window.innerHeight && bounds.left <= window.innerWidth;
    }

    function updateViewportFallback() {
      activeRecords.forEach((record) => {
        const visible = isInViewport(record.media);
        if (visible && !record.inViewport) {
          record.inViewport = true;
          if (record.status === "done" || record.status === "error") record.status = "waiting";
          maybeQueue(record.media, record);
        } else if (!visible && record.inViewport) {
          record.inViewport = false;
          if (record.status === "queued") record.status = "waiting";
          if (record.status === "delayed") {
            clearTimeout(record.timer);
            record.timer = 0;
            record.status = "waiting";
            releaseSlot(record);
            pump();
          }
        }
      });
    }

    function updateCompletedMediaOnScroll() {
      if (completedScrollFrame || stopped) return;
      completedScrollFrame = requestAnimationFrame(() => {
        completedScrollFrame = 0;
        completedRecords.forEach((record) => {
          const visible = isInViewport(record.media);
          if (!visible) {
            record.inViewport = false;
          } else if (!record.inViewport) {
            record.inViewport = true;
            record.status = "waiting";
            completedRecords.delete(record);
            maybeQueue(record.media, record);
          }
        });
      });
    }

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.target instanceof Element) {
          if (mutation.target.matches(mediaSelector)) refresh(mutation.target);
          const video = mutation.target.closest("video");
          if (video) refresh(video);
          const image = mutation.target.closest("picture")?.querySelector("img");
          if (image) refresh(image);
        }
        if (mutation.type === "childList" && mutation.target instanceof Element) {
          const video = mutation.target.closest("video");
          if (video) refresh(video);
          const image = mutation.target.closest("picture")?.querySelector("img");
          if (image) refresh(image);
        }
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) scan(node);
        });
        mutation.removedNodes.forEach((node) => {
          if (node instanceof Element && !node.isConnected) cleanRemoved(node);
        });
      });
    });
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset", "poster", "style", "data-swarm-media"],
    });

    function onMotionChange(event) {
      if (event.matches) {
        activeRecords.forEach((record) => {
          record.status = "skipped";
          completedRecords.delete(record);
          record.cancelAnimation?.();
          record.cancelAnimation = null;
          if (record.timer) clearTimeout(record.timer);
          record.timer = 0;
          releaseSlot(record);
          activeRecords.add(record);
        });
        queue.length = 0;
        pump();
        return;
      }
      activeRecords.forEach((record) => {
        const { media } = record;
        if (media && record.status === "skipped") {
          removeRecord(media, record);
          refresh(media);
        }
      });
      scan(document.body);
    }

    if (motionPreference.addEventListener) motionPreference.addEventListener("change", onMotionChange);
    else motionPreference.addListener(onMotionChange);
    window.addEventListener("scroll", updateCompletedMediaOnScroll, { passive: true });
    if (!intersectionObserver) {
      window.addEventListener("scroll", updateViewportFallback, true);
      window.addEventListener("resize", updateViewportFallback);
    }
    scan(document.body);

    return () => {
      stopped = true;
      mutationObserver.disconnect();
      intersectionObserver?.disconnect();
      if (motionPreference.removeEventListener) motionPreference.removeEventListener("change", onMotionChange);
      else motionPreference.removeListener(onMotionChange);
      window.removeEventListener("scroll", updateCompletedMediaOnScroll);
      cancelAnimationFrame(completedScrollFrame);
      if (!intersectionObserver) {
        window.removeEventListener("scroll", updateViewportFallback, true);
        window.removeEventListener("resize", updateViewportFallback);
      }
      activeRecords.forEach((record) => {
        const { media } = record;
        if (media) removeRecord(media, record);
      });
      queue.length = 0;
    };
  }, [pathname, search]);

  return null;
}
