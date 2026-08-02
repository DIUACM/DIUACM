type LogFields = Record<string, unknown>;

const errorFields = (cause: unknown): LogFields =>
  cause instanceof Error
    ? { errorName: cause.name, errorMessage: cause.message }
    : { errorMessage: String(cause) };

export const logInfo = (event: string, fields: LogFields = {}): void => {
  console.log({ event, ...fields });
};

export const logWarn = (event: string, fields: LogFields = {}): void => {
  console.warn({ event, ...fields });
};

export const logError = (
  event: string,
  cause: unknown,
  fields: LogFields = {},
): void => {
  console.error({ event, ...fields, ...errorFields(cause) });
};
