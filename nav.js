




document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".nav-btn");
    const currentPage = window.location.pathname.split("/").pop();

    buttons.forEach(button => {
        if (button.getAttribute("data-page") === currentPage) {
            button.classList.add("active");
        }
        
        // Add click event to navigate
        button.addEventListener("click", () => {
            window.location.href = button.getAttribute("data-page");
        });
    });
});
