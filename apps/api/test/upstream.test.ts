import { describe, expect, it, vi } from "vitest";

import {
  cancelResponseBody,
  fetchWithTimeout,
  readLimitedJson,
  readLimitedText,
  UpstreamResponseTooLargeError,
} from "../src/lib/upstream";

describe("upstream response safeguards", () => {
  it("adds a timeout signal to outbound requests", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ ok: true }));

    await fetchWithTimeout(fetcher, "https://example.test/data");

    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("combines a caller-provided abort signal with the deadline", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("ok"));
    const controller = new AbortController();

    await fetchWithTimeout(fetcher, "https://example.test/data", {
      signal: controller.signal,
    });

    const signal = fetcher.mock.calls[0][1]?.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal).not.toBe(controller.signal);
    controller.abort();
    expect(signal?.aborted).toBe(true);
  });

  it("cancels response bodies that will not be consumed", async () => {
    const cancel = vi.fn();
    const response = new Response(new ReadableStream({ cancel }));

    await cancelResponseBody(response);

    expect(cancel).toHaveBeenCalledOnce();
  });

  it("parses JSON below the byte cap", async () => {
    await expect(
      readLimitedJson(Response.json({ status: "ok" }), 1_000),
    ).resolves.toEqual({ status: "ok" });
  });

  it("rejects a declared body larger than the cap", async () => {
    const response = new Response("small", {
      headers: { "Content-Length": "1000" },
    });

    await expect(readLimitedText(response, 100)).rejects.toBeInstanceOf(
      UpstreamResponseTooLargeError,
    );
  });

  it("rejects streamed bytes larger than the cap without a length header", async () => {
    const response = new Response("1234567890");

    await expect(readLimitedText(response, 5)).rejects.toBeInstanceOf(
      UpstreamResponseTooLargeError,
    );
  });
});
