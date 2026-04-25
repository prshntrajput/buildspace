export class AppError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, "FORBIDDEN", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, "CONFLICT", 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, "RATE_LIMIT", 429);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message = "External service error") {
    super(`${service}: ${message}`, "EXTERNAL_SERVICE_ERROR", 502);
  }
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

export function handleError(e: unknown): { ok: false; code: string; message: string } {
  if (e instanceof AppError) {
    return { ok: false, code: e.code, message: e.message };
  }
  // Surface the first Zod validation issue as a readable message
  if (
    e instanceof Error &&
    e.constructor.name === "ZodError" &&
    "errors" in e &&
    Array.isArray((e as { errors: { message: string }[] }).errors)
  ) {
    const first = (e as { errors: { message: string }[] }).errors[0];
    return { ok: false, code: "VALIDATION_ERROR", message: first?.message ?? "Validation failed" };
  }
  if (e instanceof Error) {
    return { ok: false, code: "INTERNAL_ERROR", message: "An unexpected error occurred" };
  }
  return { ok: false, code: "UNKNOWN_ERROR", message: "Unknown error" };
}

export function errorResponse(e: unknown): Response {
  if (e instanceof AppError) {
    return Response.json({ ok: false, code: e.code, message: e.message }, { status: e.status });
  }
  return Response.json(
    { ok: false, code: "INTERNAL_ERROR", message: "Internal server error" },
    { status: 500 }
  );
}
