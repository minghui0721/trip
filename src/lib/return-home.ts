const key = "return-home";

// The trip list is already on this phone. Back can restore it instead of asking again.
export function markReturnHome() {
  sessionStorage.setItem(key, "1");
}

export function takeReturnHome() {
  if (sessionStorage.getItem(key) !== "1") return false;
  sessionStorage.removeItem(key);
  return true;
}
