if (window.AOS) {
window.AOS.init({
duration:900,
once:true
});
}

const form = document.getElementById("registerForm");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const navAnchors = document.querySelectorAll(".nav-links a");
const sections = document.querySelectorAll("section[id]");
const progressBar = document.querySelector(".scroll-progress");
const backToTopButton = document.querySelector(".back-to-top");
const cards = document.querySelectorAll(".interactive-card");
const countdown = document.getElementById("countdown");
const formMessage = document.getElementById("formMessage");
const whatsappJoinLink = document.getElementById("whatsappJoinLink");
const departmentToggles = document.querySelectorAll(".department-toggle");
const sermonZoomableImages = document.querySelectorAll(".sermon-zoomable");
const galleryMoreButtons = document.querySelectorAll(".gallery-more-button");
const imageLightbox = document.querySelector(".image-lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxPrev = document.querySelector(".lightbox-prev");
const lightboxNext = document.querySelector(".lightbox-next");

if (form) {
form.addEventListener("submit", async function (e) {
e.preventDefault();

const submitButton = form.querySelector("button[type='submit']");
const formData = new FormData(form);
const payload = {
fullName: String(formData.get("fullName") || "").trim(),
age: Number(formData.get("age")),
school: String(formData.get("school") || "").trim(),
phoneNumber: String(formData.get("phoneNumber") || "").trim(),
email: String(formData.get("email") || "").trim()
};

if (formMessage) {
formMessage.textContent = "";
formMessage.className = "form-message";
}

submitButton.disabled = true;
submitButton.classList.add("is-loading");
submitButton.textContent = "Submitting...";

try {
if (window.location.protocol === "file:") {
throw new Error("Please open this website through the Node server, not by double-clicking the HTML file. Run start-server.bat or use 'node server.js' first.");
}

const response = await fetch("/api/register", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify(payload)
});

const result = await response.json();

if (!response.ok) {
throw new Error(result.message || "Registration failed.");
}

if (formMessage) {
formMessage.textContent = result.message;
formMessage.classList.add("success");
}

if (whatsappJoinLink) {
whatsappJoinLink.classList.remove("is-hidden");
}
form.reset();
} catch (error) {
if (formMessage) {
const fallbackMessage = "Could not submit the form. Start the Node server with start-server.bat or 'node server.js', then open http://localhost:3000.";
formMessage.textContent = error.message || fallbackMessage;
formMessage.classList.add("error");
}
} finally {
submitButton.disabled = false;
submitButton.classList.remove("is-loading");
submitButton.textContent = "Register";
}
});
}

if (navToggle && navLinks) {
navToggle.addEventListener("click", function () {
const isOpen = navLinks.classList.toggle("open");
navToggle.setAttribute("aria-expanded", String(isOpen));
});
}

navAnchors.forEach(function (anchor) {
anchor.addEventListener("click", function () {
if (navLinks) {
navLinks.classList.remove("open");
}
if (navToggle) {
navToggle.setAttribute("aria-expanded", "false");
}
});
});

const updateActiveSection = function () {
let currentId = "";

sections.forEach(function (section) {
const top = window.scrollY;
const offset = section.offsetTop - 140;
const height = section.offsetHeight;

if (top >= offset && top < offset + height) {
currentId = section.id;
}
});

navAnchors.forEach(function (anchor) {
const isActive = anchor.getAttribute("href") === "#" + currentId;
anchor.classList.toggle("active", isActive);
});
};

const updateScrollUi = function () {
const scrollTop = window.scrollY;
const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

if (progressBar) {
progressBar.style.width = progress + "%";
}

if (backToTopButton) {
backToTopButton.classList.toggle("visible", scrollTop > 420);
}

updateActiveSection();
};

window.addEventListener("scroll", updateScrollUi);
window.addEventListener("load", updateScrollUi);

if (backToTopButton) {
backToTopButton.addEventListener("click", function () {
window.scrollTo({ top: 0, behavior: "smooth" });
});
}

cards.forEach(function (card) {
card.addEventListener("mousemove", function (event) {
if (window.innerWidth <= 900) {
return;
}

const rect = card.getBoundingClientRect();
const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 10;

card.style.transform = "perspective(900px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg) translateY(-6px)";
});

card.addEventListener("mouseleave", function () {
card.style.transform = "";
});
});

departmentToggles.forEach(function (toggle) {
toggle.addEventListener("click", function () {
const description = toggle.previousElementSibling;
const isExpanded = description.classList.toggle("expanded");

toggle.setAttribute("aria-expanded", String(isExpanded));
toggle.textContent = isExpanded ? "Show Less" : "Read More";
});
});

if (countdown) {
const nextServiceDate = new Date();
nextServiceDate.setHours(9, 0, 0, 0);
const daysUntilSunday = (7 - nextServiceDate.getDay()) % 7;
nextServiceDate.setDate(nextServiceDate.getDate() + daysUntilSunday);

if (daysUntilSunday === 0 && new Date().getHours() >= 9) {
nextServiceDate.setDate(nextServiceDate.getDate() + 7);
}

const updateCountdown = function () {
const now = new Date();
const diff = nextServiceDate - now;

if (diff <= 0) {
countdown.textContent = "We're live now. See you in service!";
return;
}

const days = Math.floor(diff / (1000 * 60 * 60 * 24));
const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
const minutes = Math.floor((diff / (1000 * 60)) % 60);

countdown.textContent = "Next Sunday service starts in " + days + "d " + hours + "h " + minutes + "m";
};

updateCountdown();
setInterval(updateCountdown, 60000);
}

if (imageLightbox && lightboxImage && lightboxClose && sermonZoomableImages.length) {
let activeGallery = [];
let activeIndex = 0;

const renderLightboxImage = function () {
const activeImage = activeGallery[activeIndex];

if (!activeImage) {
return;
}

lightboxImage.src = activeImage.src;
lightboxImage.alt = activeImage.alt;

if (lightboxPrev && lightboxNext) {
const hasMultipleImages = activeGallery.length > 1;
lightboxPrev.disabled = !hasMultipleImages;
lightboxNext.disabled = !hasMultipleImages;
lightboxPrev.classList.toggle("is-hidden", !hasMultipleImages);
lightboxNext.classList.toggle("is-hidden", !hasMultipleImages);
}
};

const closeLightbox = function () {
imageLightbox.classList.remove("open");
imageLightbox.setAttribute("aria-hidden", "true");
lightboxImage.src = "";
lightboxImage.alt = "";
document.body.style.overflow = "";
};

const openLightbox = function (gallery, index) {
activeGallery = gallery;
activeIndex = index;
renderLightboxImage();
imageLightbox.classList.add("open");
imageLightbox.setAttribute("aria-hidden", "false");
document.body.style.overflow = "hidden";
};

const moveLightbox = function (direction) {
if (activeGallery.length <= 1) {
return;
}

activeIndex = (activeIndex + direction + activeGallery.length) % activeGallery.length;
renderLightboxImage();
};

sermonZoomableImages.forEach(function (image) {
image.addEventListener("click", function () {
const zoomGroup = image.closest(".sermon-topic-card, .zoom-gallery");
const gallery = zoomGroup ? Array.from(zoomGroup.querySelectorAll(".sermon-zoomable")) : [image];
const index = gallery.indexOf(image);
openLightbox(gallery, index === -1 ? 0 : index);
});
});

galleryMoreButtons.forEach(function (button) {
button.addEventListener("click", function () {
const zoomGroup = button.closest(".zoom-gallery");

if (!zoomGroup) {
return;
}

const gallery = Array.from(zoomGroup.querySelectorAll(".sermon-zoomable"));
const firstHiddenImage = zoomGroup.querySelector(".gallery-hidden-thumb");
const hiddenIndex = gallery.indexOf(firstHiddenImage);

openLightbox(gallery, hiddenIndex === -1 ? 0 : hiddenIndex);
});
});

lightboxClose.addEventListener("click", closeLightbox);

if (lightboxPrev) {
lightboxPrev.addEventListener("click", function (event) {
event.stopPropagation();
moveLightbox(-1);
});
}

if (lightboxNext) {
lightboxNext.addEventListener("click", function (event) {
event.stopPropagation();
moveLightbox(1);
});
}

imageLightbox.addEventListener("click", function (event) {
if (event.target === imageLightbox) {
closeLightbox();
}
});

window.addEventListener("keydown", function (event) {
if (event.key === "Escape" && imageLightbox.classList.contains("open")) {
closeLightbox();
}

if (event.key === "ArrowLeft" && imageLightbox.classList.contains("open")) {
moveLightbox(-1);
}

if (event.key === "ArrowRight" && imageLightbox.classList.contains("open")) {
moveLightbox(1);
}
});
}
