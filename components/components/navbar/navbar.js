class Navbar {
    static async init() {
        await this.loadNavbar();
        this.setActivePage();
    }

    static async loadNavbar() {
        try {
            const response = await fetch('/components/navbar/navbar.html');
            const html = await response.text();

            // Insert navbar at the start of body
            document.body.insertAdjacentHTML('afterbegin', html);
        } catch (error) {
            console.error('Error loading navbar:', error);
        }
    }

    static setActivePage() {
        const currentPath = window.location.pathname;
        const navButtons = document.querySelectorAll('.nav-btn');

        navButtons.forEach(btn => {
            const btnPath = btn.getAttribute('href');
            if (currentPath.includes(btnPath)) {
                btn.classList.add('active');
            }
        });
    }
}

// Initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => Navbar.init());
