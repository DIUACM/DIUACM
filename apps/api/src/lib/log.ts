type LogFields = Record<string, unknown>;

const errorFields = (cause: unknown): LogFields =>
  cause instanceof Error
    ? { errorName: cause.name, errorMessage: cause.message }
    : { errorMessage: String(cause) };

export const logInfo = (event: string, fields: LogFields = {}): void => {
  console.log(JSON.stringify({ event, ...fields }));
};

export const logWarn = (event: string, fields: LogFields = {}): void => {
  console.warn(JSON.stringify({ event, ...fields }));
};

export const logError = (
  event: string,
  cause: unknown,
  fields: LogFields = {},
): void => {
  console.error(JSON.stringify({ event, ...fields, ...errorFields(cause) }));
};
