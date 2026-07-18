import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import type { AppEnv } from "../types";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

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

export const parseImageUpload = async (c: Context<AppEnv>): Promise<ParsedImage> => {
  // Cheap pre-check via Content-Length so we 413 before buffering the body.
  const claimed = Number(c.req.header("content-length") ?? 0);
  if (claimed > MAX_IMAGE_BYTES) {
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
