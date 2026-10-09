const localDevelopmentOrigin = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;

export function isAllowedClientOrigin(origin, { clientUrl, isProd }) {
  if (!origin || origin === clientUrl) return true;
  return !isProd && localDevelopmentOrigin.test(origin);
}
