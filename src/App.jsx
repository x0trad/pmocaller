import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Grip,
  ImagePlus,
  RefreshCcw,
  UserRound
} from "lucide-react";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import barBmSrc from "./assets/bar_bm.png";
import barEngSrc from "./assets/bar_eng.png";

const STAGE_WIDTH = 1350;
const STAGE_HEIGHT = 900;
const MOBILE_PREVIEW_MAX_WIDTH = 390;
const CALL_BAR_HEIGHT = 76;
const CALL_CARD_WIDTH = 600;
const CALL_CARD_HEIGHT = 112;

const initialLayout = {
  group: { x: 710, y: 625 }
};

const CALL_BAR_TEMPLATES = {
  bm: {
    label: "Panggilan Telefon",
    src: barBmSrc
  },
  eng: {
    label: "Phone Call",
    src: barEngSrc
  }
};

const defaultState = {
  barTemplate: "bm",
  callerName: "Christopher Luxon",
  callerTitle: "Perdana Menteri New Zealand",
  barColor: "#28c84e",
  cardTint: "#081026",
  cardOpacity: 0.82,
  cardOffsetX: 2,
  cardOffsetY: 19,
  backgroundSrc: "",
  avatarSrc: createPlaceholderAvatar()
};

export default function App() {
  const [form, setForm] = useState(defaultState);
  const [layout, setLayout] = useState(initialLayout);
  const [isExporting, setIsExporting] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(MOBILE_PREVIEW_MAX_WIDTH);
  const selectedBarText = getBarTemplateText(form.barTemplate);

  const stageWrapRef = useRef(null);
  const stageRef = useRef(null);
  const backgroundRef = useRef(null);
  const avatarRef = useRef(null);
  const barImageRef = useRef(null);

  useEffect(() => {
    const element = stageWrapRef.current;
    if (!element) {
      return;
    }

    const updatePreviewWidth = () => {
      const nextWidth = Math.min(
        MOBILE_PREVIEW_MAX_WIDTH,
        Math.max(260, element.clientWidth)
      );
      setPreviewWidth(nextWidth);
    };

    updatePreviewWidth();

    const observer = new ResizeObserver(updatePreviewWidth);
    observer.observe(element);
    window.addEventListener("resize", updatePreviewWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePreviewWidth);
    };
  }, []);

  const previewScale = previewWidth / STAGE_WIDTH;
  const previewHeight = STAGE_HEIGHT * previewScale;
  const stageStyles = useMemo(
    () => ({
      width: STAGE_WIDTH,
      height: STAGE_HEIGHT,
      transform: `scale(${previewScale})`,
      transformOrigin: "top left"
    }),
    [previewScale]
  );

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleFile = (event, key) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateField(key, String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const resetLayout = () => {
    setLayout(initialLayout);
  };

  const exportGraphic = async () => {
    setIsExporting(true);

    try {
      await Promise.all([
        ensureImageReady(backgroundRef.current),
        ensureImageReady(avatarRef.current),
        ensureImageReady(barImageRef.current)
      ]);
      submitExportForm({
        barTemplate: form.barTemplate,
        callerName: form.callerName,
        callerTitle: form.callerTitle,
        cardTint: form.cardTint,
        cardOpacity: form.cardOpacity,
        cardOffsetX: form.cardOffsetX,
        cardOffsetY: form.cardOffsetY,
        backgroundSrc: form.backgroundSrc,
        avatarSrc: form.avatarSrc,
        groupX: layout.group.x,
        groupY: layout.group.y
      });
    } finally {
      setTimeout(() => setIsExporting(false), 400);
    }
  };

  return (
    <main className="min-h-screen px-4 py-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:flex-row lg:items-start">
        <section className="order-1 flex-1 lg:order-1">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-balance text-xl">
                    Mobile preview
                  </CardTitle>
                  <CardDescription>
                    The preview scales to fit your phone screen cleanly. Export
                    still comes out at 1350 x 900.
                  </CardDescription>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {STAGE_WIDTH} x {STAGE_HEIGHT}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-3 shadow-inner shadow-black/20">
                <div ref={stageWrapRef} className="mx-auto w-full max-w-[390px]">
                  <div
                    className="relative mx-auto overflow-hidden rounded-[32px] border border-white/10 bg-black/40 p-2 shadow-2xl shadow-black/40"
                    style={{ width: previewWidth }}
                  >
                    <div
                      className="pointer-events-none absolute inset-x-1 top-1 z-20 mx-auto h-6 w-28 rounded-b-2xl bg-black/80"
                      aria-hidden="true"
                    />
                    <div
                      className="relative mx-auto"
                      style={{ height: previewHeight }}
                    >
                      <div
                        ref={stageRef}
                        className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-amber-800 via-slate-800 to-sky-900 select-none"
                        style={stageStyles}
                      >
                        {form.backgroundSrc ? (
                          <img
                            ref={backgroundRef}
                            src={form.backgroundSrc}
                            alt="Background"
                            className="absolute inset-0 h-full w-full object-cover"
                            draggable="false"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_20%),linear-gradient(160deg,rgba(10,25,48,0.72),rgba(10,25,48,0.18)),linear-gradient(120deg,#7a5132_0%,#253f66_100%)]" />
                        )}

                        <DraggableOverlay
                          position={layout.group}
                          onPositionChange={(next) =>
                            setLayout((current) => ({ ...current, group: next }))
                          }
                          stageRef={stageRef}
                          bounds={getCallGroupBounds(
                            form.barTemplate,
                            form.cardOffsetX,
                            form.cardOffsetY
                          )}
                        >
                          <div className="flex flex-col items-start">
                            <div
                              className="rounded-[22px] shadow-2xl"
                              style={{ boxShadow: "0 18px 34px rgba(40, 200, 78, 0.28)" }}
                            >
                              <img
                                ref={barImageRef}
                                src={getBarTemplateAsset(form.barTemplate)}
                                alt={selectedBarText}
                                className="block h-auto w-full max-w-none"
                                draggable="false"
                              />
                            </div>
                            <div
                              className="relative flex items-center gap-[18px]"
                              style={{
                                marginLeft: form.cardOffsetX,
                                marginTop: form.cardOffsetY
                              }}
                            >
                              <div className="relative h-[112px] w-[112px] overflow-hidden rounded-[24px] border-4 border-emerald-400/55 bg-slate-700 shadow-2xl">
                                <img
                                  ref={avatarRef}
                                  src={form.avatarSrc}
                                  alt="Caller"
                                  className="h-full w-full object-cover"
                                  draggable="false"
                                />
                              </div>
                              <div
                                className="min-w-0 rounded-[24px] px-[34px] py-[22px] text-white shadow-2xl"
                                style={{
                                  width: 470,
                                  background: `linear-gradient(135deg, ${hexToRgba(
                                    form.cardTint,
                                    Math.min(form.cardOpacity + 0.12, 1)
                                  )}, ${hexToRgba(form.cardTint, form.cardOpacity)})`
                                }}
                              >
                                <div className="truncate text-[30px] leading-none font-extrabold tracking-[-0.04em]">
                                  {form.callerName || "Caller Name"}
                                </div>
                                <div className="mt-2 truncate text-lg text-white/90">
                                  {form.callerTitle || "Caller title"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </DraggableOverlay>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="order-2 w-full shrink-0 lg:order-2 lg:max-w-sm">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Panggilan Telefon</CardTitle>
                <CardDescription>
                  Rebuilt with shadcn-style components and tuned for mobile-first
                  editing.
                </CardDescription>
              </CardHeader>
            </Card>

            <EditorSection
              icon={<ImagePlus className="h-4 w-4" />}
              title="Images"
              description="Swap the reusable assets here."
            >
              <Field label="Background photo" htmlFor="backgroundUpload">
                <Input
                  id="backgroundUpload"
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleFile(event, "backgroundSrc")}
                />
              </Field>
              <Field label="Caller photo" htmlFor="avatarUpload">
                <Input
                  id="avatarUpload"
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleFile(event, "avatarSrc")}
                />
              </Field>
            </EditorSection>

            <EditorSection
              icon={<UserRound className="h-4 w-4" />}
              title="Copy"
              description="Keep this short so it stays clean on export."
            >
              <Field label="Bar template">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={form.barTemplate === "bm" ? "default" : "outline"}
                    onClick={() => updateField("barTemplate", "bm")}
                  >
                    BM
                  </Button>
                  <Button
                    type="button"
                    variant={form.barTemplate === "eng" ? "default" : "outline"}
                    onClick={() => updateField("barTemplate", "eng")}
                  >
                    ENG
                  </Button>
                </div>
                <p className="text-sm text-slate-400">
                  Active text: <span className="text-slate-200">{selectedBarText}</span>
                </p>
              </Field>
              <Field label="Caller name" htmlFor="callerName">
                <Input
                  id="callerName"
                  value={form.callerName}
                  onChange={(event) => updateField("callerName", event.target.value)}
                />
              </Field>
              <Field label="Caller subtitle" htmlFor="callerTitle">
                <Input
                  id="callerTitle"
                  value={form.callerTitle}
                  onChange={(event) => updateField("callerTitle", event.target.value)}
                />
              </Field>
            </EditorSection>

            <EditorSection
              icon={<Grip className="h-4 w-4" />}
              title="Layout"
              description="Move the bar and caller card together, then tune the spacing between them."
            >
              <Field
                label={`Card horizontal margin ${form.cardOffsetX}px`}
                htmlFor="cardOffsetX"
              >
                <input
                  id="cardOffsetX"
                  type="range"
                  min="-120"
                  max="240"
                  step="1"
                  value={form.cardOffsetX}
                  onChange={(event) =>
                    updateField("cardOffsetX", Number(event.target.value))
                  }
                  className="h-2 w-full cursor-pointer accent-emerald-400"
                />
              </Field>
              <Field
                label={`Card vertical margin ${form.cardOffsetY}px`}
                htmlFor="cardOffsetY"
              >
                <input
                  id="cardOffsetY"
                  type="range"
                  min="0"
                  max="120"
                  step="1"
                  value={form.cardOffsetY}
                  onChange={(event) =>
                    updateField("cardOffsetY", Number(event.target.value))
                  }
                  className="h-2 w-full cursor-pointer accent-emerald-400"
                />
              </Field>
            </EditorSection>

            <EditorSection
              icon={<Grip className="h-4 w-4" />}
              title="Style"
              description="These controls affect both preview and export."
            >
              <Field label="Card tint" htmlFor="cardTint">
                <Input
                  id="cardTint"
                  type="color"
                  value={form.cardTint}
                  className="h-12 p-1"
                  onChange={(event) => updateField("cardTint", event.target.value)}
                />
              </Field>
              <Field
                label={`Card opacity ${form.cardOpacity.toFixed(2)}`}
                htmlFor="cardOpacity"
              >
                <input
                  id="cardOpacity"
                  type="range"
                  min="0.55"
                  max="1"
                  step="0.01"
                  value={form.cardOpacity}
                  onChange={(event) =>
                    updateField("cardOpacity", Number(event.target.value))
                  }
                  className="h-2 w-full cursor-pointer accent-emerald-400"
                />
              </Field>
            </EditorSection>

            <Card>
              <CardContent className="flex gap-3 p-4">
                <Button variant="outline" className="flex-1" onClick={resetLayout}>
                  <RefreshCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button className="flex-1" onClick={exportGraphic} disabled={isExporting}>
                  <Download className="h-4 w-4" />
                  {isExporting ? "Exporting..." : "Export PNG"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </main>
  );
}

function EditorSection({ icon, title, description, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-emerald-300">
            {icon}
          </span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function DraggableOverlay({
  position,
  onPositionChange,
  stageRef,
  bounds = null,
  children
}) {
  const ref = useRef(null);
  const dragRef = useRef(null);

  const handlePointerDown = (event) => {
    const element = ref.current;
    const stage = stageRef.current;

    if (!element || !stage) {
      return;
    }

    const rect = element.getBoundingClientRect();
    dragRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };

    element.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const element = ref.current;
    const stage = stageRef.current;
    const drag = dragRef.current;

    if (!element || !stage || !drag) {
      return;
    }

    const stageRect = stage.getBoundingClientRect();
    const scaleX = stageRect.width / STAGE_WIDTH;
    const scaleY = stageRect.height / STAGE_HEIGHT;

    const boundsWidth = bounds?.width ?? element.offsetWidth;
    const boundsHeight = bounds?.height ?? element.offsetHeight;
    const anchorOffsetX = bounds?.anchorOffsetX ?? 0;

    const nextX = clamp(
      (event.clientX - stageRect.left - drag.offsetX) / scaleX,
      -anchorOffsetX,
      STAGE_WIDTH - boundsWidth - anchorOffsetX
    );
    const nextY = clamp(
      (event.clientY - stageRect.top - drag.offsetY) / scaleY,
      0,
      STAGE_HEIGHT - boundsHeight
    );

    onPositionChange({ x: nextX, y: nextY });
  };

  const handlePointerUp = (event) => {
    const element = ref.current;
    dragRef.current = null;

    if (element && event.pointerId !== undefined) {
      element.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute cursor-grab touch-none active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ left: position.x, top: position.y }}
    >
      {children}
    </div>
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const bigint = Number.parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getBarMetrics(barImage, text) {
  const content = text || CALL_BAR_TEMPLATES.bm.label;
  return {
    content,
    width: barImage?.naturalWidth || barImage?.width || 387,
    height: barImage?.naturalHeight || barImage?.height || CALL_BAR_HEIGHT
  };
}

function getEstimatedBarWidth(template) {
  return template === "eng" ? 343 : 387;
}

function getCallGroupBounds(template, cardOffsetX, cardOffsetY) {
  const barWidth = getEstimatedBarWidth(template);
  const minX = Math.min(0, cardOffsetX);
  const maxX = Math.max(barWidth, cardOffsetX + CALL_CARD_WIDTH);

  return {
    width: maxX - minX,
    height: CALL_BAR_HEIGHT + cardOffsetY + CALL_CARD_HEIGHT,
    anchorOffsetX: minX
  };
}

function drawBackground(ctx, image) {
  ctx.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

  if (image?.src && image.naturalWidth > 0) {
    drawCoverImage(ctx, image, 0, 0, STAGE_WIDTH, STAGE_HEIGHT);
    return;
  }

  const gradient = ctx.createLinearGradient(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
  gradient.addColorStop(0, "#7a5132");
  gradient.addColorStop(1, "#253f66");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

  const overlay = ctx.createLinearGradient(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
  overlay.addColorStop(0, "rgba(10, 25, 48, 0.5)");
  overlay.addColorStop(1, "rgba(10, 25, 48, 0.12)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
}

function drawCallGroup(ctx, position, barText, form, avatarImage) {
  const barMetrics = getBarMetrics(barImage, barText);
  const cardPosition = {
    x: position.x + form.cardOffsetX,
    y: position.y + barMetrics.height + form.cardOffsetY
  };

  drawBar(ctx, position, barMetrics, barImage);
  drawCallerCard(ctx, cardPosition, form, avatarImage);
}

function drawBar(ctx, position, metrics, barImage) {
  if (!barImage) {
    return;
  }

  ctx.save();
  ctx.shadowColor = "rgba(40, 200, 78, 0.28)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;
  ctx.drawImage(barImage, position.x, position.y, metrics.width, metrics.height);
  ctx.restore();
}

function drawCallerCard(ctx, position, form, avatarImage) {
  const avatarSize = 112;
  const avatarRadius = 24;
  const cardX = position.x + avatarSize - 2;
  const cardY = position.y + 10;
  const cardWidth = 470;
  const cardHeight = 106;

  ctx.save();
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 24);
  const gradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
  gradient.addColorStop(0, hexToRgba(form.cardTint, Math.min(form.cardOpacity + 0.12, 1)));
  gradient.addColorStop(1, hexToRgba(form.cardTint, form.cardOpacity));
  ctx.fillStyle = gradient;
  ctx.shadowColor = "rgba(3, 8, 24, 0.26)";
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 16;
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, position.x, position.y, avatarSize, avatarSize, avatarRadius);
  ctx.clip();
  drawCoverImage(ctx, avatarImage, position.x, position.y, avatarSize, avatarSize);
  ctx.restore();

  ctx.save();
  roundRect(ctx, position.x + 2, position.y + 2, avatarSize - 4, avatarSize - 4, avatarRadius - 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(52, 211, 153, 0.65)";
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "top";
  ctx.font = "800 30px Inter, Segoe UI, sans-serif";
  drawSingleLineText(ctx, form.callerName || "Caller Name", cardX + 34, cardY + 22, 405);
  ctx.font = "400 18px Inter, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  drawSingleLineText(ctx, form.callerTitle || "Caller title", cardX + 34, cardY + 63, 405);
  ctx.restore();
}

function drawSingleLineText(ctx, text, x, y, maxWidth) {
  let finalText = text;
  while (ctx.measureText(finalText).width > maxWidth && finalText.length > 1) {
    finalText = `${finalText.slice(0, -2)}…`;
  }
  ctx.fillText(finalText, x, y);
}

function drawCoverImage(ctx, image, dx, dy, dWidth, dHeight) {
  const sourceWidth = image?.naturalWidth || image?.width;
  const sourceHeight = image?.naturalHeight || image?.height;

  if (!sourceWidth || !sourceHeight) {
    return;
  }

  const sourceRatio = sourceWidth / sourceHeight;
  const destRatio = dWidth / dHeight;
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceRatio > destRatio) {
    sw = sourceHeight * destRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / destRatio;
    sy = (sourceHeight - sh) / 2;
  }

  ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dWidth, dHeight);
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

async function ensureImageReady(image) {
  if (!image?.src) {
    return;
  }

  if (image.complete && image.naturalWidth > 0) {
    return;
  }

  if (typeof image.decode === "function") {
    try {
      await image.decode();
      return;
    } catch {
      return;
    }
  }

  await new Promise((resolve) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", resolve, { once: true });
  });
}

function submitExportForm(payload) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/api/export";
  form.target = "_blank";
  form.style.display = "none";

  Object.entries(payload).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value ?? "");
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

function createPlaceholderAvatar() {
  return (
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#dbe7ff"/>
            <stop offset="100%" stop-color="#8ba5ff"/>
          </linearGradient>
        </defs>
        <rect width="256" height="256" rx="42" fill="url(#g)"/>
        <circle cx="128" cy="94" r="48" fill="#f8fbff"/>
        <path d="M59 219c18-34 48-52 69-52s51 18 69 52" fill="#f8fbff"/>
      </svg>
    `)
  );
}

function getBarTemplateText(template) {
  return CALL_BAR_TEMPLATES[template]?.label ?? CALL_BAR_TEMPLATES.bm.label;
}

function getBarTemplateAsset(template) {
  return CALL_BAR_TEMPLATES[template]?.src ?? CALL_BAR_TEMPLATES.bm.src;
}
