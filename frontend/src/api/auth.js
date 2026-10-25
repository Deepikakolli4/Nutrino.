export function logout() {
  localStorage.removeItem("nourish_token");
  localStorage.removeItem("nourish_user");
  window.location.replace("/login");
}