export const normalizeHomeDomainUrl = (homeDomain: string): URL => {
  let _homeDomain = homeDomain;

  // default localhost to http instead of https
  if (_homeDomain.includes("localhost")) {
    _homeDomain = _homeDomain.startsWith("http")
      ? _homeDomain
      : `http://${_homeDomain}`;
  } else {
    _homeDomain = _homeDomain.startsWith("http")
      ? _homeDomain
      : `https://${_homeDomain}`;
  }

  return new URL(_homeDomain.replace(/\/$/, ""));
};
