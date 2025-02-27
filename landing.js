document.addEventListener("DOMContentLoaded", function () {
    const elements = document.querySelectorAll(".fade-in");

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible"); // Show the element
                } else {
                    entry.target.classList.remove("visible"); // Hide when out of view
                }
            });
        },
        { threshold: 0.2 } // Trigger when 20% of the element is visible
    );

    elements.forEach((el) => observer.observe(el));
});
