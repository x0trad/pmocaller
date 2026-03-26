import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const STAGE_WIDTH = 1350;
const STAGE_HEIGHT = 900;
const CALL_BAR_HEIGHT = 76;

const BAR_FILE = "bar_icon.png";

const placeholderAvatar =
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
  `);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const rawBody = await readRawBody(req);
    const params = new URLSearchParams(rawBody);
    const payload = normalizePayload(params);

    const barPath = path.join(process.cwd(), "src", "assets", BAR_FILE);
    const barBuffer = await fs.readFile(barPath);
    const barMeta = await sharp(barBuffer).metadata();

    const backgroundBuffer = payload.backgroundSrc
      ? dataUrlToBuffer(payload.backgroundSrc)
      : null;
    const avatarBuffer = dataUrlToBuffer(payload.avatarSrc || placeholderAvatar);

    const background = backgroundBuffer
      ? await sharp(backgroundBuffer)
          .resize(STAGE_WIDTH, STAGE_HEIGHT, { fit: "cover", position: "centre" })
          .png()
          .toBuffer()
      : await sharp({
          create: {
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            channels: 4,
            background: "#20334f"
          }
        })
          .composite([
            {
              input: Buffer.from(buildBackgroundSvg()),
              top: 0,
              left: 0
            }
          ])
          .png()
          .toBuffer();

    const avatarDataUrl = toDataUrl(avatarBuffer, payload.avatarSrc || placeholderAvatar);
    const barDataUrl = toDataUrl(barBuffer, `data:image/png;base64,${barBuffer.toString("base64")}`);
    const overlaySvg = buildOverlaySvg({
      ...payload,
      avatarDataUrl,
      barDataUrl,
      barWidth: barMeta.width || 387,
      barHeight: barMeta.height || CALL_BAR_HEIGHT
    });

    const output = await sharp(background)
      .composite([
        {
          input: Buffer.from(overlaySvg),
          top: 0,
          left: 0
        }
      ])
      .png()
      .toBuffer();

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="panggilan-telefon.png"'
    );
    res.status(200).send(output);
  } catch (error) {
    res.status(500).json({
      error: "Export failed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

function normalizePayload(params) {
  return {
    callerName: params.get("callerName") || "Caller Name",
    callerTitle: params.get("callerTitle") || "Caller title",
    cardTint: params.get("cardTint") || "#081026",
    cardOpacity: Number(params.get("cardOpacity") || "0.82"),
    cardOffsetX: Number(params.get("cardOffsetX") || "2"),
    cardOffsetY: Number(params.get("cardOffsetY") || "19"),
    backgroundSrc: params.get("backgroundSrc") || "",
    avatarSrc: params.get("avatarSrc") || placeholderAvatar,
    groupX: Number(params.get("groupX") || "710"),
    groupY: Number(params.get("groupY") || "625")
  };
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function dataUrlToBuffer(dataUrl) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid data URL");
  }
  return Buffer.from(match[2], "base64");
}

function toDataUrl(buffer, original) {
  const mime = original.startsWith("data:")
    ? original.slice(5, original.indexOf(";"))
    : "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function buildBackgroundSvg() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${STAGE_WIDTH}" height="${STAGE_HEIGHT}" viewBox="0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}">
      <defs>
        <linearGradient id="base" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#7a5132" />
          <stop offset="100%" stop-color="#253f66" />
        </linearGradient>
        <linearGradient id="overlay" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0a1930" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#0a1930" stop-opacity="0.12" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#base)" />
      <rect width="100%" height="100%" fill="url(#overlay)" />
    </svg>
  `;
}

function buildOverlaySvg(payload) {
  const cardX = payload.groupX + payload.cardOffsetX;
  const cardY = payload.groupY + payload.barHeight + payload.cardOffsetY;
  const cardBodyX = cardX + 110;
  const tint = hexToRgb(payload.cardTint);
  const title = escapeXml(payload.callerTitle);
  const name = escapeXml(payload.callerName);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${STAGE_WIDTH}" height="${STAGE_HEIGHT}" viewBox="0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}">
      <defs>
        <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgb(${tint.r}, ${tint.g}, ${tint.b})" stop-opacity="${Math.min(payload.cardOpacity + 0.12, 1)}" />
          <stop offset="100%" stop-color="rgb(${tint.r}, ${tint.g}, ${tint.b})" stop-opacity="${payload.cardOpacity}" />
        </linearGradient>
        <clipPath id="avatarClip">
          <rect x="${cardX}" y="${cardY}" width="112" height="112" rx="24" ry="24"/>
        </clipPath>
      </defs>

      <image href="${payload.barDataUrl}" x="${payload.groupX}" y="${payload.groupY}" width="${payload.barWidth}" height="${payload.barHeight}" />

      <rect x="${cardBodyX}" y="${cardY + 10}" width="470" height="106" rx="24" ry="24" fill="url(#cardGradient)" />
      <image href="${payload.avatarDataUrl}" x="${cardX}" y="${cardY}" width="112" height="112" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)" />
      <rect x="${cardX + 2}" y="${cardY + 2}" width="108" height="108" rx="22" ry="22" fill="none" stroke="rgb(52,211,153)" stroke-opacity="0.65" stroke-width="4" />

      <text x="${cardBodyX + 34}" y="${cardY + 54}" fill="#ffffff" font-family="Inter, Segoe UI, sans-serif" font-size="30" font-weight="800">${name}</text>
      <text x="${cardBodyX + 34}" y="${cardY + 93}" fill="rgb(255,255,255)" fill-opacity="0.92" font-family="Inter, Segoe UI, sans-serif" font-size="18" font-weight="400">${title}</text>
    </svg>
  `;
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

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
