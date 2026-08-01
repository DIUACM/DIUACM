import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import type { AppEnv } from "../types";

// Blog assets can be larger than profile/event images (short clips, PDFs), so
// this cap is higher than MAX_IMAGE_BYTES. Kept modest because the Worker
// buffers the whole body in memory to validate and store it.
export const MAX_ASSET_BYTES = 25 * 1024 * 1024; // 25 MB

// Multipart framing (boundary lines, part headers) sits on top of the file
// bytes, so allow some slack over the asset limit itself.
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

export type AssetKind = "image" | "video" | "file";

type Signature = {
  kind: AssetKind;
  contentType: string;
  ext: string;
  test: (head: Uint8Array) => boolean;
};

// Recognised by magic bytes (never the client-supplied content-type). Anything
// not matched here is stored as a generic downloadable "file".
const SIGNATURES: Signature[] = [
  {
    kind: "image",
    contentType: "image/png",
    ext: "png",
    test: (h) => h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4e && h[3] === 0x47,
  },
  {
    kind: "image",
    contentType: "image/jpeg",
    ext: "jpg",
    test: (h) => h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff,
  },
  {
    kind: "image",
    contentType: "image/gif",
    ext: "gif",
    test: (h) => h[0] === 0x47 && h[1] === 0x49 && h[2] === 0x46 && h[3] === 0x38,
  },
  {
    kind: "image",
    contentType: "image/webp",
    ext: "webp",
    // RIFF....WEBP
    test: (h) =>
      h[0] === 0x52 &&
      h[1] === 0x49 &&
      h[2] === 0x46 &&
      h[3] === 0x46 &&
      h[8] === 0x57 &&
      h[9] === 0x45 &&
      h[10] === 0x42 &&
      h[11] === 0x50,
  },
  {
    kind: "video",
    contentType: "video/mp4",
    ext: "mp4",
    // ....ftyp  (ISO base media / MP4)
    test: (h) => h[4] === 0x66 && h[5] === 0x74 && h[6] === 0x79 && h[7] === 0x70,
  },
  {
    kind: "video",
    contentType: "video/webm",
    ext: "webm",
    // EBML header (Matroska / WebM)
    test: (h) => h[0] === 0x1a && h[1] === 0x45 && h[2] === 0xdf && h[3] === 0xa3,
  },
  {
    kind: "file",
    contentType: "application/pdf",
    ext: "pdf",
    test: (h) => h[0] === 0x25 && h[1] === 0x50 && h[2] === 0x44 && h[3] === 0x46,
  },
];

const EXT_FROM_NAME = /\.([a-z0-9]{1,8})$/i;

export type ParsedAsset = {
  buffer: ArrayBuffer;
  kind: AssetKind;
  contentType: string;
  ext: string;
  filename: string;
};

/**
 * Parse a multipart upload (field name "file") for a blog asset. Images and
 * common videos/PDFs are detected by magic bytes; everything else is accepted
 * as a generic downloadable file. Objects are always served with a strict
 * sandbox CSP + nosniff, either by the Worker fallback route or the production
 * R2 hostname's response-header rule, so a mislabelled type can't run.
 */
export const parseAssetUpload = async (c: Context<AppEnv>): Promise<ParsedAsset> => {
  const claimedHeader = c.req.header("content-length");
  if (!claimedHeader) {
    throw new HTTPException(411, { message: "Content-Length header is required" });
  }
  const claimed = Number(claimedHeader);
  if (!Number.isFinite(claimed) || claimed > MAX_ASSET_BYTES + MULTIPART_OVERHEAD_BYTES) {
    throw new HTTPException(413, {
      message: `file exceeds limit of ${MAX_ASSET_BYTES} bytes`,
    });
  }

  const body = await c.req.parseBody();
  const file = body["file"];
  if (!(file instanceof File)) {
    throw new HTTPException(400, {
      message: 'file is required (multipart field name: "file")',
    });
  }
  if (file.size === 0) {
    throw new HTTPException(400, { message: "file is empty" });
  }
  if (file.size > MAX_ASSET_BYTES) {
    throw new HTTPException(413, {
      message: `file exceeds limit of ${MAX_ASSET_BYTES} bytes`,
    });
  }

  const buffer = await file.arrayBuffer();
  const head = new Uint8Array(buffer.slice(0, 12));
  const match = SIGNATURES.find((s) => s.test(head));

  // Sanitise the original name to a short, safe basename for display/URLs.
  const rawName = typeof file.name === "string" ? file.name : "file";
  const filename =
    rawName
      .split(/[\\/]/)
      .pop()
      ?.replace(/[^\w.\- ]+/g, "_")
      .slice(0, 120) || "file";
  const nameExt = filename.match(EXT_FROM_NAME)?.[1]?.toLowerCase();

  if (match) {
    return {
      buffer,
      kind: match.kind,
      contentType: match.contentType,
      ext: match.ext,
      filename,
    };
  }

  // Unrecognised: store as a generic download. Keep the name's extension for
  // the key, but never trust the client content-type for serving.
  return {
    buffer,
    kind: "file",
    contentType: "application/octet-stream",
    ext: nameExt && /^[a-z0-9]{1,8}$/.test(nameExt) ? nameExt : "bin",
    filename,
  };
};
