const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav-links");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (menuButton && navigation) {
    const closeMenu = () => {
        menuButton.setAttribute("aria-expanded", "false");
        navigation.classList.remove("is-open");
    };

    menuButton.addEventListener("click", () => {
        const isOpen = menuButton.getAttribute("aria-expanded") === "true";
        menuButton.setAttribute("aria-expanded", String(!isOpen));
        navigation.classList.toggle("is-open", !isOpen);
    });

    navigation.addEventListener("click", (event) => {
        if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) closeMenu();
    });
}

document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
});

const progressBar = document.createElement("div");
progressBar.className = "scroll-progress";
progressBar.setAttribute("aria-hidden", "true");
document.body.append(progressBar);

let scrollFrame = 0;
const updateScrollProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
    scrollFrame = 0;
};

window.addEventListener("scroll", () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollProgress);
}, { passive: true });
updateScrollProgress();

const revealElements = document.querySelectorAll("[data-reveal]");
revealElements.forEach((element, index) => {
    element.style.setProperty("--reveal-delay", `${(index % 3) * 70}ms`);
});

if (reducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12 }
    );

    revealElements.forEach((element) => observer.observe(element));
}

if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
    let pointerFrame = 0;
    let pointerX = window.innerWidth * 0.8;
    let pointerY = window.innerHeight * 0.12;

    window.addEventListener("pointermove", (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;

        if (!pointerFrame) {
            pointerFrame = requestAnimationFrame(() => {
                document.body.style.setProperty("--pointer-x", `${pointerX}px`);
                document.body.style.setProperty("--pointer-y", `${pointerY}px`);
                pointerFrame = 0;
            });
        }
    }, { passive: true });

    const tiltElements = document.querySelectorAll(".value-card, .skill-group, .cert-card, .contact-card:not(.primary)");
    tiltElements.forEach((element) => {
        element.classList.add("tilt-surface");

        element.addEventListener("pointermove", (event) => {
            const bounds = element.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width - 0.5;
            const y = (event.clientY - bounds.top) / bounds.height - 0.5;
            element.style.setProperty("--tilt-x", `${y * -5}deg`);
            element.style.setProperty("--tilt-y", `${x * 5}deg`);
        });

        element.addEventListener("pointerleave", () => {
            element.style.setProperty("--tilt-x", "0deg");
            element.style.setProperty("--tilt-y", "0deg");
        });
    });

    const canvas = document.createElement("canvas");
    canvas.className = "network-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);

    const context = canvas.getContext("2d");
    const particles = [];
    const pointer = { x: -1000, y: -1000 };
    let width = 0;
    let height = 0;
    let pixelRatio = 1;

    const resizeCanvas = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const targetCount = Math.min(54, Math.max(24, Math.floor((width * height) / 25000)));
        while (particles.length < targetCount) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.22,
                vy: (Math.random() - 0.5) * 0.22,
                radius: Math.random() * 1.2 + 0.5
            });
        }
        particles.length = targetCount;
    };

    window.addEventListener("resize", resizeCanvas, { passive: true });
    window.addEventListener("pointermove", (event) => {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", () => {
        pointer.x = -1000;
        pointer.y = -1000;
    });

    const drawNetwork = () => {
        context.clearRect(0, 0, width, height);

        particles.forEach((particle, index) => {
            const pointerDx = particle.x - pointer.x;
            const pointerDy = particle.y - pointer.y;
            const pointerDistance = Math.hypot(pointerDx, pointerDy);

            if (pointerDistance < 120 && pointerDistance > 0) {
                particle.x += (pointerDx / pointerDistance) * 0.35;
                particle.y += (pointerDy / pointerDistance) * 0.35;
            }

            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x < -10) particle.x = width + 10;
            if (particle.x > width + 10) particle.x = -10;
            if (particle.y < -10) particle.y = height + 10;
            if (particle.y > height + 10) particle.y = -10;

            context.beginPath();
            context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            context.fillStyle = "rgba(141, 247, 193, 0.6)";
            context.fill();

            for (let next = index + 1; next < particles.length; next += 1) {
                const other = particles[next];
                const dx = particle.x - other.x;
                const dy = particle.y - other.y;
                const distance = Math.hypot(dx, dy);

                if (distance < 125) {
                    context.beginPath();
                    context.moveTo(particle.x, particle.y);
                    context.lineTo(other.x, other.y);
                    context.strokeStyle = `rgba(141, 247, 193, ${(1 - distance / 125) * 0.18})`;
                    context.lineWidth = 0.7;
                    context.stroke();
                }
            }
        });

        requestAnimationFrame(drawNetwork);
    };

    resizeCanvas();
    drawNetwork();
}
