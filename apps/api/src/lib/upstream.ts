const DEFAULT_TIMEOUT_MS = 15_000;

export class UpstreamResponseTooLargeError extends Error {
  constructor(readonly maxBytes: number) {
    super(`Upstream response exceeded ${maxBytes} bytes`);
    this.name = "UpstreamResponseTooLargeError";
  }
}

/** Apply a deadline to an outbound request without replacing a caller's signal. */
export const fetchWithTimeout = (
  fetcher: typeof fetch,
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> => {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = init.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;

  return fetcher(input, {
    ...init,
    signal,
  });
};

/** Release an upstream response body that the caller intentionally will not read. */
export const cancelResponseBody = async (response: Response): Promise<void> => {
  await response.body?.cancel();
};

/** Read a small upstream body while enforcing the cap on streamed bytes. */
export const readLimitedText = async (
  response: Response,
  maxBytes: number,
): Promise<string> => {
  const declaredLength = response.headers.get("Content-Length");
  if (declaredLength !== null) {
    const bytes = Number(declaredLength);
    if (Number.isFinite(bytes) && bytes > maxBytes) {
      throw new UpstreamResponseTooLargeError(maxBytes);
    }
  }

  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    if (bytesRead > maxBytes) {
      await reader.cancel("response too large");
      throw new UpstreamResponseTooLargeError(maxBytes);
    }
    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
};

export const readLimitedJson = async (
  response: Response,
  maxBytes: number,
): Promise<unknown> => JSON.parse(await readLimitedText(response, maxBytes));
