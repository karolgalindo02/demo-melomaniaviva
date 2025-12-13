// Hamburger Menu Controller

class HamburgerMenu {
  isOpen = false;
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    const btn = document.getElementById("hamburgerBtn");
    const overlay = document.getElementById("menuOverlay");
    const closeBtn = document.getElementById("closeMenuBtn");

    if (btn) {
      btn.addEventListener("click", () => this.toggle());
    }

    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          this.close();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close());
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    const btn = document.getElementById("hamburgerBtn");
    const menu = document.getElementById("mobileMenu");
    const overlay = document.getElementById("menuOverlay");

    if (btn) btn.setAttribute("aria-pressed", "true");
    if (menu) {
      menu.classList.remove("translate-x-full");
      menu.classList.add("translate-x-0");
    }
    if (overlay) {
      overlay.classList.remove("hidden");
    }

    document.body.style.overflow = "hidden";
  }

  close() {
    this.isOpen = false;
    const btn = document.getElementById("hamburgerBtn");
    const menu = document.getElementById("mobileMenu");
    const overlay = document.getElementById("menuOverlay");

    if (btn) btn.setAttribute("aria-pressed", "false");
    if (menu) {
      menu.classList.remove("translate-x-0");
      menu.classList.add("translate-x-full");
    }
    if (overlay) {
      overlay.classList.add("hidden");
    }

    document.body.style.overflow = "";
  }
}

// Initialize hamburger menu
let hamburgerMenu;
document.addEventListener("DOMContentLoaded", () => {
  hamburgerMenu = new HamburgerMenu();
  globalThis.hamburgerMenu = hamburgerMenu;
});
