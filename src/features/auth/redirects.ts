const invitationPath = /^\/invite\/[a-f0-9]{64}$/;

export function authCallbackPath(value: string): string {
  return invitationPath.test(value) ? value : "/dashboard";
}

export function authPageHref(page: "/login" | "/register", callbackUrl: string): string {
  const safePath = authCallbackPath(callbackUrl);
  return safePath === "/dashboard" ? page : `${page}?callbackUrl=${encodeURIComponent(safePath)}`;
}
