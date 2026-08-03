import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import type { AppEnv } from "../types";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MiB

type Format = {
  contentType: string;
  ext: "png" | "jpg" | "gif" | "webp";
  test: (head: Uint8Array) => boolean;
};

// Validate by magic bytes, not the client-supplied content-type / filename.
const FORMATS: Format[] = [
  {
    contentType: "image/png",
    ext: "png",
    test: (h) => h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4e && h[3] === 0x47,
  },
  {
    contentType: "image/jpeg",
    ext: "jpg",
    test: (h) => h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff,
  },
  {
    contentType: "image/gif",
    ext: "gif",
    test: (h) => h[0] === 0x47 && h[1] === 0x49 && h[2] === 0x46 && h[3] === 0x38,
  },
  {
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
];

export type ParsedImage = {
  buffer: ArrayBuffer;
  contentType: string;
  ext: Format["ext"];
};

// Multipart framing (boundary lines, part headers, other fields) sits on top
// of the file bytes, so allow some slack over the image limit itself.
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

export const parseImageUpload = async (c: Context<AppEnv>): Promise<ParsedImage> => {
  // Reject before buffering the body: require a Content-Length and 413 when it
  // exceeds the limit. Browsers and HTTP clients always send it for multipart
  // uploads; its absence means a chunked request we'd otherwise buffer blindly.
  const claimedHeader = c.req.header("content-length");
  if (!claimedHeader) {
    throw new HTTPException(411, { message: "Content-Length header is required" });
  }
  const claimed = Number(claimedHeader);
  if (!Number.isFinite(claimed) || claimed > MAX_IMAGE_BYTES + MULTIPART_OVERHEAD_BYTES) {
    throw new HTTPException(413, {
      message: `image exceeds limit of ${MAX_IMAGE_BYTES} bytes`,
    });
  }
  const body = await c.req.parseBody();
  const file = body["image"];
  if (!(file instanceof File)) {
    throw new HTTPException(400, {
      message: 'image file is required (multipart field name: "image")',
    });
  }
  if (file.size === 0) {
    throw new HTTPException(400, { message: "image file is empty" });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new HTTPException(413, {
      message: `image exceeds limit of ${MAX_IMAGE_BYTES} bytes`,
    });
  }
  const buffer = await file.arrayBuffer();
  const head = new Uint8Array(buffer.slice(0, 12));
  const match = FORMATS.find((f) => f.test(head));
  if (!match) {
    throw new HTTPException(400, {
      message: "image must be a PNG, JPEG, GIF, or WebP",
    });
  }
  return { buffer, contentType: match.contentType, ext: match.ext };
};
