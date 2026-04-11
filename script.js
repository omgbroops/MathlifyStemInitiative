const topNav = document.querySelector(".top-nav");
const navToggle = document.querySelector(".nav-toggle");
const mobileMenu = document.querySelector("#mobile-menu");
const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll("a") : [];

function handleScrollState() {
  if (!topNav) return;
  const isScrolled = window.scrollY > 10;
  topNav.classList.toggle("scrolled", isScrolled);
}

function setMobileMenu(open) {
  if (!navToggle || !mobileMenu) return;
  navToggle.setAttribute("aria-expanded", String(open));
  mobileMenu.classList.toggle("open", open);
}

if (navToggle && mobileMenu) {
  navToggle.addEventListener("click", () => {
    const open = navToggle.getAttribute("aria-expanded") === "true";
    setMobileMenu(!open);
  });

  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => setMobileMenu(false));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) setMobileMenu(false);
  });
}

window.addEventListener("scroll", handleScrollState, { passive: true });
handleScrollState();

const revealItems = document.querySelectorAll(".reveal");
if (revealItems.length) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));
}

const glowCards = document.querySelectorAll("[data-glow]");
glowCards.forEach((card) => {
  card.addEventListener("mousemove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    card.style.setProperty("--mx", `${x}px`);
    card.style.setProperty("--my", `${y}px`);
  });

  card.addEventListener("mouseleave", () => {
    card.style.setProperty("--mx", "50%");
    card.style.setProperty("--my", "50%");
  });
});

const heroVisual = document.querySelector(".hero-visual");
const kitBoard = document.querySelector(".kit-board");
const supportsFinePointer = window.matchMedia("(pointer: fine)").matches;

if (heroVisual && kitBoard && supportsFinePointer) {
  heroVisual.addEventListener("mousemove", (event) => {
    const rect = heroVisual.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 7;
    const rotateX = (0.5 - py) * 6;

    kitBoard.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
    kitBoard.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
  });

  heroVisual.addEventListener("mouseleave", () => {
    kitBoard.style.setProperty("--ry", "0deg");
    kitBoard.style.setProperty("--rx", "0deg");
  });
}

const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = contactForm.querySelector("#name").value.trim();
    const email = contactForm.querySelector("#email").value.trim();
    const message = contactForm.querySelector("#message").value.trim();

    if (!name || !email || !message) {
      formStatus.textContent = "Please fill in all fields before sending.";
      return;
    }

    const subject = `Mathlify STEM Initiative Inquiry - ${name}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      "Message:",
      message
    ].join("\n");

    formStatus.textContent = "Opening your email app...";
    window.location.href = `mailto:mathlifyofficial@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
