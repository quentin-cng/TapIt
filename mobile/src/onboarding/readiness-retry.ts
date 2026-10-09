type ReadinessError = {
  code?: string;
  message?: string;
} | null;

export const READINESS_JWT_RETRY_DELAYS_MS = [250, 750] as const;

export function isJwtIssuedAtFutureError(error: ReadinessError) {
  return (
    error?.code === "PGRST303" &&
    error.message?.trim().toLowerCase() === "jwt issued at future"
  );
}
