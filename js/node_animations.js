import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";
import { n as nodeSettings, N, f as getCustomNodeColors } from "./chunks/color-manager-CtPq5NfG.js";
function createNodeState() {
  return {
    isRunning: false,
    phase: 0,
    particlePhase: 0,
    lastFrame: performance.now(),
    lastRAFTime: 0,
    animationFrame: null,
    totalTime: 0,
    speedMultiplier: 1,
    staticPhase: Math.PI / 4,
    forceUpdate: false,
    forceRedraw: false,
    lastRenderState: null,
    nodeEffects: /* @__PURE__ */ new Map(),
    isAnimating: false,
    frameSkipCount: 0,
    maxFrameSkips: 3,
    lastAnimStyle: null,
    particlePool: /* @__PURE__ */ new Map(),
    activeParticles: /* @__PURE__ */ new Set(),
    playCompletionAnimation: false,
    completionPhase: 0,
    completingNodes: /* @__PURE__ */ new Set(),
    disabledCompletionNodes: /* @__PURE__ */ new Set(),
    primaryCompletionNode: null
  };
}
function validateHexColor(color) {
  if (!color || typeof color !== "string") return null;
  const normalized = color.startsWith("#") ? color : `#${color}`;
  if (!/^#[0-9A-Fa-f]{6}$/i.test(normalized)) return null;
  return normalized.toLowerCase();
}
const HEX_RGB_CACHE = /* @__PURE__ */ new Map();
const MAX_CACHE_SIZE = 1e3;
function hexToRgb(hex) {
  if (HEX_RGB_CACHE.has(hex)) {
    const cached = HEX_RGB_CACHE.get(hex);
    return cached ? { ...cached } : null;
  }
  const validated = validateHexColor(hex);
  let result = null;
  if (validated) {
    result = {
      r: parseInt(validated.slice(1, 3), 16),
      g: parseInt(validated.slice(3, 5), 16),
      b: parseInt(validated.slice(5, 7), 16)
    };
  }
  if (HEX_RGB_CACHE.size >= MAX_CACHE_SIZE) {
    HEX_RGB_CACHE.clear();
  }
  HEX_RGB_CACHE.set(hex, result);
  return result ? { ...result } : null;
}
function withAlpha(color, alpha) {
  const validAlpha = Math.max(0, Math.min(1, alpha));
  if (!color) {
    return `rgba(0, 255, 255, ${validAlpha})`;
  }
  if (typeof color === "string" && color.startsWith("#")) {
    const rgb = hexToRgb(color);
    if (rgb) {
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${validAlpha})`;
    }
    return `rgba(0, 255, 255, ${validAlpha})`;
  }
  if (typeof color === "string" && color.startsWith("hsl(")) {
    return color.replace(/hsl\((.*)\)/, `hsla($1, ${validAlpha})`);
  }
  if (typeof color === "string" && color.startsWith("hsla(")) {
    return color.replace(/hsla\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `hsla($1,$2,$3, ${validAlpha})`);
  }
  if (typeof color === "string" && color.startsWith("rgba(")) {
    return color.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `rgba($1,$2,$3, ${validAlpha})`);
  }
  return color;
}
function isEffectivelyStatic(params) {
  return params.isStaticMode || params.isPaused;
}
function calculateGlowRadius(node, quality) {
  return Math.max(node.size[0], node.size[1]) * (0.5 + quality.quality * 0.1) * quality.animationSize;
}
function calculateParticlePosition(index, particleCount, particleTime, orbitRadius, settings) {
  const { particleSpeed, particleIntensity, isStatic, phase, quality } = settings;
  const particleOffset = index * (Math.PI * 2 / particleCount);
  const individualSpeed = isStatic ? 1 : (0.5 + Math.sin(index) * 0.25) * particleIntensity * particleSpeed;
  const particlePhase = isStatic ? phase + particleOffset : particleTime * individualSpeed + particleOffset;
  const dynamicOrbit = orbitRadius * (0.8 + Math.sin(isStatic ? phase + index : particleTime * 0.2 * particleSpeed + index) * 0.25 + Math.cos(isStatic ? phase + index * 0.7 : particleTime * 0.3 * particleSpeed + index * 0.7) * 0.25);
  const angle = particlePhase + index * Math.PI * 2 / particleCount;
  const randomFactor = quality > 1 ? 12 : 6;
  const torusEffect = particleIntensity * 2;
  const orbitOffset = Math.sin(particleTime * 0.3 * particleSpeed + index) * torusEffect;
  const jitterX = isStatic ? 0 : Math.sin(particleTime * 3 * particleSpeed + index) * 1.2 * particleIntensity + Math.cos(particleTime * 2 * particleSpeed + index * 0.5) * 0.5 * particleIntensity;
  const jitterY = isStatic ? 0 : Math.cos(particleTime * 2.5 * particleSpeed + index) * 1.2 * particleIntensity + Math.sin(particleTime * 1.5 * particleSpeed + index * 0.7) * 0.5 * particleIntensity;
  const verticalOffset = -dynamicOrbit * 0.3;
  const x = Math.cos(angle) * (dynamicOrbit + orbitOffset) + Math.sin(isStatic ? phase + index : particleTime * 0.2 * particleSpeed + index) * randomFactor + jitterX;
  const y = Math.sin(angle) * (dynamicOrbit + orbitOffset) + verticalOffset + Math.cos(isStatic ? phase + index : particleTime * 0.15 * particleSpeed + index) * randomFactor + jitterY;
  const sizeFactor = isStatic ? 1 : 0.7 + Math.sin(particleTime * 0.5 * particleSpeed + index) * 0.4 + Math.random() * 0.3;
  return { x, y, sizeFactor };
}
function calculateBlinkFactor(index, particleTime, particleSpeed, isStatic) {
  if (isStatic) return 0.8;
  const blinkOffset = Math.abs(Math.sin(index * 12.9898) * 43758.5453 % (2 * Math.PI));
  const blinkSpeed = 1.2 + Math.sin(index * 0.7) * 0.6;
  return 0.4 + 0.8 * Math.pow(Math.sin(particleTime * blinkSpeed * particleSpeed + blinkOffset), 2);
}
function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
function drawHoverOutline(ctx, node, settings) {
  if (!settings.colors.showHover) return;
  if (!node.selected && !node.mouseOver) return;
  const { hoverColor } = settings.colors;
  const { glowIntensity } = settings.quality;
  const outlineGlowSize = 15 * glowIntensity;
  ctx.save();
  ctx.shadowColor = withAlpha(hoverColor, 0.5);
  ctx.shadowBlur = node.selected ? outlineGlowSize * 1.5 : outlineGlowSize;
  ctx.strokeStyle = withAlpha(hoverColor, 0.7);
  ctx.lineWidth = 2;
  ctx.strokeRect(-node.size[0] / 2, -node.size[1] / 2, node.size[0], node.size[1]);
  ctx.restore();
}
function drawParticles(ctx, node, settings, particleTime, getParticleColor2) {
  const { particles, quality, animation } = settings;
  if (!particles.showParticles) return;
  const isStatic = isEffectivelyStatic(animation);
  const glowRadius = calculateGlowRadius(node, quality);
  const baseParticleCount = 8 + quality.quality * 2;
  const particleCount = Math.floor(baseParticleCount * particles.density);
  for (let i = 0; i < particleCount; i++) {
    const position = calculateParticlePosition(i, particleCount, particleTime, glowRadius, {
      particleSpeed: particles.speed,
      particleIntensity: particles.intensity,
      isStatic,
      phase: animation.phase,
      quality: quality.quality
    });
    const baseParticleSize = (4 + quality.quality) * quality.animationSize * particles.size;
    const particleSize = baseParticleSize * position.sizeFactor;
    const particleColor = getParticleColor2(i, particleTime * particles.speed, particleCount);
    const particleGlow = ctx.createRadialGradient(
      position.x,
      position.y,
      0,
      position.x,
      position.y,
      particleSize * 2
    );
    particleGlow.addColorStop(0, withAlpha(particleColor, 0.8 * particles.glowIntensity));
    particleGlow.addColorStop(0.4, withAlpha(particleColor, 0.4 * particles.glowIntensity));
    particleGlow.addColorStop(1, withAlpha(particleColor, 0));
    const blinkFactor = calculateBlinkFactor(i, particleTime, particles.speed, isStatic);
    const particleAlpha = Math.min(blinkFactor, 1) * particles.glowIntensity;
    ctx.beginPath();
    ctx.arc(position.x, position.y, particleSize * 2, 0, Math.PI * 2);
    ctx.fillStyle = particleGlow;
    ctx.globalAlpha = particleAlpha * 0.8;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(position.x, position.y, particleSize * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = particleColor;
    ctx.globalAlpha = Math.min(particleAlpha * 1.5, 1);
    ctx.fill();
  }
}
function gentlePulse(ctx, node, settings, particleTime, getParticleColor2) {
  const isStatic = isEffectivelyStatic(settings.animation);
  const glowRadius = calculateGlowRadius(node, settings.quality);
  const { primary, secondary, accent } = settings.colors;
  const { glowIntensity, quality } = settings.quality;
  const { phase, direction, animSpeed, intensity } = settings.animation;
  const breathePhase = isStatic ? phase : phase * 0.375 * direction * animSpeed;
  const breatheScale = Math.pow(Math.sin(breathePhase), 2);
  const modifiedIntensity = intensity * 0.75;
  const pulseScale = 0.4 + 0.4 * breatheScale * modifiedIntensity;
  ctx.save();
  ctx.translate(node.size[0] / 2, node.size[1] / 2);
  drawHoverOutline(ctx, node, settings);
  const innerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius * pulseScale);
  const innerAlpha = 0.2 * glowIntensity * (0.5 + breatheScale * 0.5);
  innerGlow.addColorStop(0, withAlpha("#ffffff", Math.min(innerAlpha + 0.15, 1)));
  innerGlow.addColorStop(0.3, withAlpha(primary, innerAlpha));
  innerGlow.addColorStop(0.7, withAlpha(secondary, innerAlpha * 0.6));
  innerGlow.addColorStop(1, withAlpha(accent, 0));
  const outerGlow = ctx.createRadialGradient(
    0,
    0,
    glowRadius * 0.6 * pulseScale,
    0,
    0,
    glowRadius * (1.2 + glowIntensity * 0.4) * pulseScale
  );
  const outerAlpha = 0.1 * glowIntensity * (0.5 + breatheScale * 0.5);
  outerGlow.addColorStop(0, withAlpha(secondary, outerAlpha));
  outerGlow.addColorStop(0.6, withAlpha(accent, outerAlpha * 0.5));
  outerGlow.addColorStop(1, withAlpha(accent, 0));
  ctx.beginPath();
  ctx.arc(0, 0, glowRadius * pulseScale, 0, Math.PI * 2);
  ctx.fillStyle = innerGlow;
  ctx.globalAlpha = Math.min(0.2 + Math.abs(breatheScale) * 0.3 + glowIntensity * 0.2, 1);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, glowRadius * (1.2 + glowIntensity * 0.4) * pulseScale, 0, Math.PI * 2);
  ctx.fillStyle = outerGlow;
  ctx.globalAlpha = Math.min(0.15 + Math.abs(breatheScale) * 0.2 + glowIntensity * 0.15, 1);
  ctx.fill();
  if (quality > 1) {
    ctx.shadowColor = withAlpha(secondary, 0.3);
    ctx.shadowBlur = 10 * glowIntensity * (quality * 0.5);
  }
  drawParticles(ctx, node, settings, particleTime, getParticleColor2);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.restore();
}
function neonNexus(ctx, node, settings, particleTime, getParticleColor2) {
  const isStatic = isEffectivelyStatic(settings.animation);
  const { primary, secondary, accent } = settings.colors;
  const { glowIntensity, animationSize } = settings.quality;
  const { phase, direction, intensity } = settings.animation;
  const rectWidth = node.size[0];
  const rectHeight = node.size[1];
  const radius = Math.min(rectWidth, rectHeight) * 0.08;
  const baseLineWidth = Math.max(rectWidth, rectHeight) * 75e-4 * animationSize;
  const hologramDepth = 3;
  const gridSize = Math.min(rectWidth, rectHeight) * 0.4 * animationSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "transparent";
  for (let i = 0; i < hologramDepth; i++) {
    ctx.save();
    ctx.globalAlpha = 0.2 - i * 0.05;
    ctx.strokeStyle = `hsl(${i * 60 % 360}, 80%, 75%)`;
    ctx.lineWidth = baseLineWidth * 0.4;
    roundedRect(ctx, -i * 2, -i * 2, rectWidth + i * 4, rectHeight + i * 4, radius + i);
    ctx.stroke();
    ctx.restore();
  }
  const neonFlicker = isStatic ? 1 : 0.95 + 0.05 * Math.sin(phase * 0.3 * direction);
  const layers = 4;
  for (let i = 0; i < layers; i++) {
    ctx.save();
    ctx.lineWidth = baseLineWidth * (1 + i * 0.3);
    const layerColor = i === 0 ? primary : i === 1 ? secondary : i === 2 ? accent : "rgba(255, 255, 255, 0.4)";
    ctx.strokeStyle = layerColor;
    ctx.shadowColor = layerColor;
    ctx.shadowBlur = (i + 1) * 12 * intensity * glowIntensity;
    const baseOpacity = 0.95 - i * 0.15;
    ctx.globalAlpha = isStatic ? baseOpacity : baseOpacity * neonFlicker;
    roundedRect(ctx, 0, 0, rectWidth, rectHeight, radius);
    ctx.stroke();
    if (i === 0) {
      ctx.globalAlpha = isStatic ? 0.3 : 0.3 * neonFlicker;
      ctx.lineWidth = baseLineWidth * 0.8;
      ctx.shadowBlur = 20 * intensity * glowIntensity;
      roundedRect(ctx, 0, 0, rectWidth, rectHeight, radius);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (!isStatic) {
    ctx.save();
    const scanY = rectHeight * (Math.sin(phase * 2) * 0.5 + 0.5);
    const scanLineGradient = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
    scanLineGradient.addColorStop(0, "rgba(255,255,255,0)");
    scanLineGradient.addColorStop(0.5, "rgba(255,255,255,0.5)");
    scanLineGradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = scanLineGradient;
    ctx.fillRect(0, scanY - 10, rectWidth, 20);
    ctx.restore();
  }
  if (settings.particles.showParticles) {
    const particleSz = settings.particles.size;
    const particleGlowInt = settings.particles.glowIntensity;
    const particleCount = 40 + Math.floor(30);
    for (let i = 0; i < particleCount; i++) {
      ctx.save();
      const col = i % 5;
      const row = Math.floor(i / 5);
      const gridSpacing = gridSize / 4;
      const x = (col - 2) * gridSpacing + Math.cos(phase + col) * 2;
      const y = (row - 2) * gridSpacing + Math.sin(phase + row) * 2;
      const baseSize = 2 * particleSz;
      const sizeVariation = baseSize * 0.3;
      const particleSize = baseSize + Math.sin(phase * 2 + i) * sizeVariation;
      const rotation = phase + i * Math.PI / 8;
      const alpha = (0.4 + Math.sin(phase * 3 + i) * 0.2) * particleGlowInt;
      const particleColor = getParticleColor2(i, particleTime * settings.particles.speed, particleCount);
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillStyle = particleColor;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = particleColor;
      ctx.shadowBlur = 5 * particleGlowInt;
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const angle = s * Math.PI / 3 + phase;
        const currentSize = particleSize * (0.8 + Math.sin(phase * 5 + s) * 0.2);
        ctx.lineTo(Math.cos(angle) * currentSize, Math.sin(angle) * currentSize);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.strokeStyle = primary;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.2 * settings.particles.glowIntensity;
    ctx.setLineDash([5, 3]);
    ctx.lineDashOffset = phase * 10;
    const verticalCenter = rectHeight / 5;
    const leftOffset = -gridSize * 0.5;
    for (let i = -1; i <= 1; i += 0.5) {
      ctx.beginPath();
      ctx.moveTo(leftOffset + i * gridSize, verticalCenter - gridSize);
      ctx.lineTo(leftOffset + i * gridSize, verticalCenter + gridSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(leftOffset - gridSize, verticalCenter + i * gridSize);
      ctx.lineTo(leftOffset + gridSize, verticalCenter + i * gridSize);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (node.selected || node.mouseOver) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const pulse = 0.5 + 0.5 * Math.sin(phase * 3);
    const pulseGradient = ctx.createRadialGradient(
      rectWidth / 2,
      rectHeight / 2,
      0,
      rectWidth / 2,
      rectHeight / 2,
      Math.max(rectWidth, rectHeight) * 0.7
    );
    pulseGradient.addColorStop(0, `rgba(255,255,255,${0.15 * pulse})`);
    pulseGradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = pulseGradient;
    roundedRect(ctx, 0, 0, rectWidth, rectHeight, radius);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * pulse})`;
    ctx.lineWidth = baseLineWidth * 2;
    ctx.shadowColor = `rgba(255,255,255,${0.5 * pulse})`;
    ctx.shadowBlur = 15 * intensity;
    roundedRect(ctx, 0, 0, rectWidth, rectHeight, radius);
    ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "source-over";
}
function cosmicRipple(ctx, node, settings, particleTime, getParticleColor2) {
  const { primary, secondary, accent } = settings.colors;
  const { glowIntensity, animationSize } = settings.quality;
  const { phase, direction, intensity } = settings.animation;
  const centerX = node.size[0] / 2;
  const centerY = node.size[1] / 2;
  const rings = 5;
  const maxRadius = Math.max(1, Math.min(node.size[0], node.size[1]) * 0.7 * animationSize);
  const rippleSpeed = 0.8;
  const scaledTime = phase;
  for (let i = 0; i < rings; i++) {
    const ripplePhase = (scaledTime * rippleSpeed - i * 0.2) % 1;
    const ringRadius = Math.max(5, maxRadius * ripplePhase);
    if (ringRadius > 5 && ringRadius < maxRadius) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      const gradient = ctx.createLinearGradient(
        centerX - ringRadius,
        centerY,
        centerX + ringRadius,
        centerY
      );
      const alpha = Math.max(0, 1 - ripplePhase);
      gradient.addColorStop(0, withAlpha(secondary, alpha * 0.8));
      gradient.addColorStop(0.5, withAlpha(primary, alpha));
      gradient.addColorStop(1, withAlpha(accent, alpha * 0.8));
      ctx.strokeStyle = gradient;
      ctx.lineWidth = Math.max(1, 3 * intensity * (1 - ripplePhase));
      ctx.shadowColor = withAlpha(secondary, 0.5);
      ctx.shadowBlur = Math.max(2, 15 * (1 - ripplePhase) * glowIntensity);
      ctx.stroke();
    }
  }
  if (settings.particles.showParticles) {
    const pIntensity = settings.particles.intensity;
    const pDensity = settings.particles.density;
    const pSize = settings.particles.size;
    const pGlow = settings.particles.glowIntensity;
    const pSpeed = settings.particles.speed;
    const baseParticleCount = Math.min(100, 30 + Math.floor(pIntensity * 20));
    const particleCount = Math.floor(baseParticleCount * pDensity);
    const coronaRadius = Math.max(1, Math.max(node.size[0], node.size[1]) * 0.7);
    for (let i = 0; i < particleCount; i++) {
      ctx.save();
      const angle = i / particleCount * Math.PI * 2 + particleTime * pSpeed * direction;
      const spread = Math.max(0.1, 0.8 + Math.sin(particleTime * 0.5 + i) * 0.2 * pIntensity);
      const x = Math.cos(angle) * coronaRadius * spread + centerX;
      const y = Math.sin(angle) * coronaRadius * spread + centerY;
      const baseSize = 2 * pSize;
      const size = Math.max(1, baseSize + Math.sin(particleTime * 1.5 + i) * 1.5 * pIntensity);
      const particleColor = getParticleColor2(i, particleTime, particleCount);
      const trailSize = Math.max(1, size * 2);
      const trailGradient = ctx.createRadialGradient(x, y, 0, x, y, trailSize);
      trailGradient.addColorStop(0, withAlpha(particleColor, 0.7 * pGlow));
      trailGradient.addColorStop(1, withAlpha(particleColor, 0));
      ctx.fillStyle = trailGradient;
      ctx.shadowColor = withAlpha(particleColor, pGlow * 0.5);
      ctx.shadowBlur = 10 * pGlow;
      ctx.beginPath();
      ctx.arc(x, y, trailSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = withAlpha(particleColor, 0.7);
      ctx.shadowColor = withAlpha(particleColor, pGlow);
      ctx.shadowBlur = 15 * pGlow;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}
function flowerOfLife(ctx, node, settings, particleTime, getParticleColor2) {
  const { primary, secondary, accent } = settings.colors;
  const { glowIntensity, quality, animationSize } = settings.quality;
  const { phase, intensity } = settings.animation;
  const centerX = node.size[0] / 2;
  const centerY = node.size[1] / 2;
  const baseRadius = Math.min(node.size[0], node.size[1]) * 0.056 * intensity * animationSize;
  const layers = Math.max(2, Math.floor(quality * 2));
  const rotationSpeed = 0.2;
  const pulseSpeed = 1.5;
  ctx.save();
  const rotation = phase * rotationSpeed;
  const pulse = 0.8 + Math.sin(phase * pulseSpeed) * 0.2;
  const patternPoints = [{ x: centerX, y: centerY }];
  for (let layer = 1; layer <= layers; layer++) {
    const numCircles = layer * 6;
    const layerRadius = baseRadius * 2;
    for (let i = 0; i < numCircles; i++) {
      const angle = i / numCircles * Math.PI * 2 + rotation;
      const x = centerX + Math.cos(angle) * layerRadius * layer;
      const y = centerY + Math.sin(angle) * layerRadius * layer;
      patternPoints.push({ x, y, layer, index: i });
    }
  }
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius * pulse, 0, Math.PI * 2);
  ctx.strokeStyle = primary;
  ctx.lineWidth = 2;
  ctx.shadowColor = primary;
  ctx.shadowBlur = 15 * intensity * glowIntensity;
  ctx.stroke();
  for (let i = 1; i < patternPoints.length; i++) {
    const point = patternPoints[i];
    const layer = point.layer;
    const index = point.index;
    if (i > 1 && index > 0) {
      const prevPoint = patternPoints[i - 1];
      ctx.beginPath();
      ctx.moveTo(prevPoint.x, prevPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.strokeStyle = secondary;
      ctx.globalAlpha = 0.3 * pulse;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(point.x, point.y, baseRadius * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = index % 2 === 0 ? secondary : accent;
    ctx.globalAlpha = 1 - layer / (layers + 1);
    ctx.stroke();
  }
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = i / 6 * Math.PI * 2 + rotation;
    const x = centerX + Math.cos(angle) * baseRadius * layers * 2;
    const y = centerY + Math.sin(angle) * baseRadius * layers * 2;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = primary;
  ctx.globalAlpha = 0.3;
  ctx.stroke();
  const coreGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    baseRadius * 2
  );
  coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.5 * pulse})`);
  coreGradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.2 * pulse})`);
  coreGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = coreGradient;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius * 2, 0, Math.PI * 2);
  ctx.fill();
  if (settings.particles.showParticles) {
    const pDensity = settings.particles.density;
    const pIntensity = settings.particles.intensity;
    const pSize = settings.particles.size;
    const pGlow = settings.particles.glowIntensity;
    const pSpeed = settings.particles.speed;
    patternPoints.forEach((point, pi) => {
      const particleCount = Math.floor(5 * pDensity * pIntensity);
      for (let p = 0; p < particleCount; p++) {
        const particleAngle = p / particleCount * Math.PI * 2 + particleTime * 2 * pIntensity;
        const px = point.x + Math.cos(particleAngle) * (baseRadius * 0.5 * pIntensity);
        const py = point.y + Math.sin(particleAngle) * (baseRadius * 0.5 * pIntensity);
        const particleColor = getParticleColor2(
          pi * particleCount + p,
          particleTime * pSpeed,
          patternPoints.length * particleCount
        );
        const dotSize = Math.max(0.5, 1.5 * pSize * (0.8 + Math.sin(particleTime * 3 + p) * 0.2));
        ctx.beginPath();
        ctx.arc(px, py, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.shadowColor = withAlpha(particleColor, pGlow);
        ctx.shadowBlur = 5 * pGlow;
        ctx.globalAlpha = 0.6 * pGlow;
        ctx.fill();
      }
    });
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
function getNodeEffect(style) {
  switch (style) {
    case 1:
      return gentlePulse;
    case 2:
      return neonNexus;
    case 3:
      return cosmicRipple;
    case 4:
      return flowerOfLife;
    default:
      return gentlePulse;
  }
}
function hexToRGB(hex) {
  const validated = validateHexColor(hex) || "#00ffff";
  return [
    parseInt(validated.slice(1, 3), 16),
    parseInt(validated.slice(3, 5), 16),
    parseInt(validated.slice(5, 7), 16)
  ];
}
function drawAnimatedText(ctx, text, x, y, phase) {
  const textAnimEnabled = N.textAnimationEnabled;
  if (!textAnimEnabled) return;
  const baseColor = N.textColor;
  const style = N.textStyle;
  const size = N.textSize;
  const glow = N.textGlow;
  const letterSpacing = N.textLetterSpacing;
  const offsetY = N.textPositionY;
  const offsetX = N.textPositionX;
  const rotationRadius = N.textRotationRadius;
  const rotationAngle = N.textRotationAngle;
  let finalX = x + offsetX;
  let finalY = y + offsetY;
  if (rotationRadius > 0) {
    const orbitAngle = phase * 2;
    finalX += Math.cos(orbitAngle) * rotationRadius;
    finalY += Math.sin(orbitAngle) * rotationRadius;
  }
  const [r, g, b] = hexToRGB(baseColor);
  ctx.save();
  ctx.font = `${size}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (rotationAngle !== 0) {
    ctx.translate(finalX, finalY);
    ctx.rotate(rotationAngle * Math.PI / 180);
    ctx.translate(-finalX, -finalY);
  }
  const drawText = (tx, ty, fillStyle) => {
    ctx.fillStyle = fillStyle;
    if (letterSpacing === 0) {
      ctx.fillText(text, tx, ty);
    } else {
      const spaced = text.split("").join(" ".repeat(Math.max(1, Math.floor(Math.abs(letterSpacing) * 2))));
      ctx.fillText(spaced, tx, ty);
    }
  };
  try {
    switch (style) {
      case "neon": {
        const pulseIntensity = 0.7 + Math.sin(phase * 3) * 0.3;
        const neonAlpha = 0.8 * glow * pulseIntensity;
        ctx.shadowColor = `rgba(${r},${g},${b},${neonAlpha * 0.5})`;
        ctx.shadowBlur = 20 * glow;
        drawText(finalX, finalY, `rgba(${r},${g},${b},${neonAlpha * 0.3})`);
        ctx.shadowBlur = 10 * glow;
        drawText(finalX, finalY, `rgba(${r},${g},${b},${neonAlpha * 0.6})`);
        ctx.shadowBlur = 5 * glow;
        drawText(finalX, finalY, `rgb(${r},${g},${b})`);
        ctx.shadowBlur = 3;
        ctx.globalAlpha = 0.5 * pulseIntensity;
        drawText(finalX, finalY, "#ffffff");
        break;
      }
      case "cyberpunk": {
        const glitchOffset = Math.sin(phase * 10) * 2;
        const glitchAlpha = 0.7 * glow;
        const glitchColors = [
          { r: 255, g: 0, b: 128, o: 0.7 },
          { r: 0, g: 255, b: 255, o: 0.7 },
          { r: 255, g: 255, b: 0, o: 0.5 }
        ];
        glitchColors.forEach((c, i) => {
          const off = glitchOffset * (i - 1);
          ctx.shadowColor = `rgba(${c.r},${c.g},${c.b},${glitchAlpha})`;
          ctx.shadowBlur = 5 * glow;
          drawText(finalX + off, finalY, `rgba(${c.r},${c.g},${c.b},${c.o})`);
        });
        ctx.shadowColor = `rgba(${r},${g},${b},${glitchAlpha})`;
        ctx.shadowBlur = 10 * glow;
        drawText(finalX, finalY, baseColor);
        break;
      }
      case "retro": {
        const scanOff = Math.sin(phase * 5) * 0.5;
        drawText(finalX - 1, finalY + scanOff, "rgba(255,0,0,0.5)");
        drawText(finalX + 1, finalY - scanOff, "rgba(0,255,255,0.5)");
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 3 * glow;
        drawText(finalX, finalY, baseColor);
        break;
      }
      case "pulse": {
        const simplePulse = 0.5 + Math.sin(phase * 2) * 0.5;
        ctx.globalAlpha = 0.8 + simplePulse * 0.2;
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 10 * glow * simplePulse;
        drawText(finalX, finalY, baseColor);
        break;
      }
      case "minimal": {
        const fadeAlpha = 0.7 + Math.sin(phase * 2) * 0.3;
        ctx.globalAlpha = fadeAlpha;
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 3 * glow;
        drawText(finalX, finalY, baseColor);
        ctx.beginPath();
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = fadeAlpha * 0.5;
        const textWidth = ctx.measureText(text).width * (1 + letterSpacing * 0.1);
        ctx.moveTo(finalX - textWidth / 2, finalY + 10);
        ctx.lineTo(finalX + textWidth / 2, finalY + 10);
        ctx.stroke();
        break;
      }
      default:
        drawText(finalX, finalY, baseColor);
    }
  } catch {
    drawText(finalX, finalY, baseColor);
  }
  ctx.restore();
}
function getParticleColor(index, time, _count) {
  const particleColorMode = N.particleColorMode;
  const colors = getCustomNodeColors();
  switch (particleColorMode) {
    case "rainbow":
      return `hsl(${(index * 30 + time * 50) % 360}, 90%, 75%)`;
    case "complementary": {
      const validColor = validateHexColor(colors.accent);
      if (validColor) {
        const r2 = parseInt(validColor.slice(1, 3), 16) / 255;
        const g2 = parseInt(validColor.slice(3, 5), 16) / 255;
        const b2 = parseInt(validColor.slice(5, 7), 16) / 255;
        const max = Math.max(r2, g2, b2), min = Math.min(r2, g2, b2);
        let h = 0;
        const s = max === min ? 0 : (max - min) / (2 * ((max + min) / 2 > 0.5 ? 2 - max - min : max + min));
        const l = (max + min) / 2;
        if (max !== min) {
          const d = max - min;
          if (max === r2) h = (g2 - b2) / d + (g2 < b2 ? 6 : 0);
          else if (max === g2) h = (b2 - r2) / d + 2;
          else h = (r2 - g2) / d + 4;
          h = h / 6 * 360;
        }
        return `hsl(${(h + 180) % 360}, ${s * 100}%, ${l * 100}%)`;
      }
      return colors.accent;
    }
    case "energy":
      return `hsl(${(time * 100 + index * 20) % 360}, 90%, 75%)`;
    case "quantum": {
      const qp = (time * 2 + index * 0.1) % 1;
      return `hsl(${280 + qp * 80}, 90%, ${60 + Math.sin(time * 5) * 20}%)`;
    }
    case "aurora": {
      const ap = (time * 3 + index * 0.2) % 1;
      return `hsl(${120 + ap * 60}, ${80 + Math.sin(time * 3) * 20}%, ${70 + Math.sin(time * 4) * 20}%)`;
    }
    default: {
      const customParticle = N.colorParticle;
      return validateHexColor(customParticle) || colors.accent;
    }
  }
}
const ext = {
  name: "enhanced.node.animations",
  settings: nodeSettings,
  async setup() {
    const state = createNodeState();
    const Timing = {
      smoothDelta: 0,
      lastTime: performance.now(),
      update() {
        const now = performance.now();
        const raw = Math.min((now - this.lastTime) / 1e3, 1 / 30);
        this.lastTime = now;
        this.smoothDelta = this.smoothDelta * 0.9 + raw * 0.1;
        return this.smoothDelta;
      }
    };
    const ParticleController = {
      phase: 0,
      lastUpdate: 0,
      update(currentTime, delta) {
        const dir = N.direction;
        const speed = Math.max(0.01, N.particleSpeed);
        if (currentTime - this.lastUpdate >= 16) {
          const phaseStep = 2 * Math.PI / 15 * delta * speed;
          this.phase += phaseStep * dir;
          this.lastUpdate = currentTime;
        }
        return this.phase;
      }
    };
    api.addEventListener("status", ({ detail }) => {
      state.isRunning = detail?.exec_info?.queue_remaining > 0;
    });
    function renderLoop(timestamp) {
      const animStyle = N.animate;
      const pauseDuringRender = N.pauseDuringRender;
      const isRendering = state.isRunning;
      const showParticles = N.particleShow;
      const delta = Timing.update();
      state.totalTime = (state.totalTime || 0) + delta;
      ParticleController.update(timestamp, delta);
      const paused = isRendering && pauseDuringRender;
      if (animStyle > 0 && !paused) {
        const speed = N.animationSpeed;
        const direction = N.direction;
        const isStaticMode = N.staticMode;
        if (!isStaticMode) {
          state.phase += 2 * Math.PI / 15 * delta * speed * direction;
        }
      }
      if (animStyle > 0 || showParticles) {
        app.graph?.setDirtyCanvas(true, false);
      }
      requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);
    const originalDrawNode = LGraphCanvas.prototype.drawNode;
    LGraphCanvas.prototype.drawNode = function(node, ctx) {
      const animStyle = N.animate;
      const animEnabled = N.animationsEnabled;
      const showParticles = N.particleShow;
      if (animStyle > 0 && animEnabled) {
        const colors = getCustomNodeColors();
        const isStaticMode = N.staticMode;
        const glowIntensity = N.glow;
        const animGlow = N.animationGlow;
        const quality = N.quality;
        const animSize = N.animationSize;
        const intensity = N.intensity;
        const direction = N.direction;
        const animSpeed = N.animationSpeed;
        const particleDensity = N.particleDensity;
        const particleSpeed = N.particleSpeed;
        const particleIntensity = N.particleIntensity;
        const particleSize = N.particleSize;
        const particleGlow = N.particleGlow;
        const showGlow = N.glowShow;
        const hoverColor = N.colorHover;
        const showHover = N.colorHoverShow;
        const effect = getNodeEffect(animStyle);
        if (effect) {
          ctx.save();
          try {
            effect(
              ctx,
              node,
              {
                animation: {
                  phase: state.phase,
                  intensity: intensity * animGlow,
                  direction,
                  animSpeed,
                  isStaticMode,
                  isPaused: false
                },
                quality: {
                  quality,
                  animationSize: animSize,
                  glowIntensity: showGlow ? glowIntensity : 0
                },
                particles: {
                  showParticles,
                  density: particleDensity,
                  speed: particleSpeed,
                  intensity: particleIntensity,
                  size: particleSize,
                  glowIntensity: particleGlow
                },
                colors: {
                  primary: colors.primary,
                  secondary: colors.secondary,
                  accent: colors.accent,
                  hoverColor,
                  showHover
                }
              },
              ParticleController.phase,
              getParticleColor
            );
          } catch (e) {
            console.warn("[EnhancedNodes] Effect error:", e);
          }
          ctx.restore();
        }
      } else if (showParticles) {
        const colors = getCustomNodeColors();
        const particleDensity = N.particleDensity;
        const particleSpeed = N.particleSpeed;
        const particleIntensity = N.particleIntensity;
        const particleSize = N.particleSize;
        const particleGlow = N.particleGlow;
        const quality = N.quality;
        const animSize = N.animationSize;
        const direction = N.direction;
        ctx.save();
        ctx.translate(node.size[0] / 2, node.size[1] / 2);
        try {
          drawParticles(
            ctx,
            node,
            {
              animation: {
                phase: state.phase,
                intensity: 1,
                direction,
                animSpeed: 1,
                isStaticMode: false,
                isPaused: false
              },
              quality: {
                quality,
                animationSize: animSize,
                glowIntensity: 0
              },
              particles: {
                showParticles: true,
                density: particleDensity,
                speed: particleSpeed,
                intensity: particleIntensity,
                size: particleSize,
                glowIntensity: particleGlow
              },
              colors: {
                primary: colors.primary,
                secondary: colors.secondary,
                accent: colors.accent,
                hoverColor: "#00ff15",
                showHover: false
              }
            },
            ParticleController.phase,
            getParticleColor
          );
        } catch (e) {
          console.warn("[EnhancedNodes] Particle error:", e);
        }
        ctx.restore();
      }
      originalDrawNode.call(this, node, ctx);
      if (N.textAnimationEnabled && node.title) {
        ctx.save();
        drawAnimatedText(
          ctx,
          node.title,
          node.size[0] / 2,
          -15,
          state.phase
        );
        ctx.restore();
      }
    };
    const originalDrawNodeShape = LGraphCanvas.prototype.drawNodeShape;
    if (originalDrawNodeShape) {
      LGraphCanvas.prototype.drawNodeShape = function(node, ctx, ...args) {
        originalDrawNodeShape.call(this, node, ctx, ...args);
        const showHover = N.colorHoverShow;
        const animStyle = N.animate;
        if (showHover && animStyle > 0 && (node.mouseOver || this.selected_nodes && this.selected_nodes[node.id])) {
          const hoverColor = N.colorHover;
          const glowIntensity = N.glow;
          const outlineGlowSize = 15 * glowIntensity;
          ctx.save();
          ctx.shadowColor = withAlpha(hoverColor, 0.5);
          ctx.shadowBlur = node.mouseOver ? outlineGlowSize : outlineGlowSize * 1.5;
          ctx.strokeStyle = withAlpha(hoverColor, 0.7);
          ctx.lineWidth = 2;
          const shape = node._shape || "box";
          if (shape === "round" || shape === "card") {
            const radius = node.constructor?.slot_start_y ? 8 : 4;
            ctx.beginPath();
            ctx.roundRect(0, 0, node.size[0], node.size[1], radius);
            ctx.stroke();
          } else {
            ctx.strokeRect(0, 0, node.size[0], node.size[1]);
          }
          ctx.restore();
        }
      };
    }
    console.log("[EnhancedNodes] Extension registered with full animation pipeline.");
  }
};
app.registerExtension(ext);
//# sourceMappingURL=node_animations.js.map
