export function setupSidebar(messages) {
  const phone = window.matchMedia("(max-width: 720px)");
  const openButton = document.getElementById("sidebarOpen");
  const panelButton = document.getElementById("sidebarClose");
  const scrim = document.getElementById("sidebarScrim");
  let desktopCollapsed = false;
  let mobileOpen = false;

  const render = () => {
    const drawerOpen = phone.matches && mobileOpen;
    document.body.classList.toggle("sidebar-collapsed", desktopCollapsed);
    document.body.classList.toggle("sidebar-open", drawerOpen);
    scrim.hidden = !drawerOpen;
    openButton.setAttribute("aria-expanded", String(drawerOpen));
    panelButton.setAttribute("aria-expanded", String(phone.matches ? drawerOpen : !desktopCollapsed));
    const label = phone.matches
      ? messages.closeNavigation
      : desktopCollapsed
        ? messages.expandNavigation
        : messages.collapseNavigation;
    panelButton.setAttribute("aria-label", label);
    panelButton.title = label;
  };

  const closeMobileSidebar = () => {
    const wasOpen = mobileOpen;
    mobileOpen = false;
    render();
    if (wasOpen) openButton.focus();
  };

  openButton.addEventListener("click", () => {
    mobileOpen = true;
    render();
    panelButton.focus();
  });
  panelButton.addEventListener("click", () => {
    if (phone.matches) {
      closeMobileSidebar();
    } else {
      desktopCollapsed = !desktopCollapsed;
      render();
    }
  });
  scrim.addEventListener("click", closeMobileSidebar);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileOpen) {
      event.preventDefault();
      closeMobileSidebar();
    }
  });
  phone.addEventListener("change", () => {
    mobileOpen = false;
    render();
    if (document.activeElement === openButton && !phone.matches) panelButton.focus();
  });
  render();

  return closeMobileSidebar;
}
