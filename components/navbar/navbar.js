import { app } from '../../init.mjs';
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// Initialize Firebase services properly by importing the initialized app
const db = getFirestore(app); // Use the imported app
const auth = getAuth(app); // Use the imported app

class Navbar {
    static async init() {
        try {
            // First create the basic navbar structure
            this.createNavbarStructure();
            // Then set the active page
            this.setActivePage();
            // Then check user privacy and update navbar accordingly
            this.checkUserPrivacyAndUpdateNavbar();
            // Check if user is an admin and update navbar
            this.checkIfUserIsAdmin();

            console.log("Navbar initialized successfully");
        } catch (error) {
            console.error("Error initializing navbar:", error);
        }
    }

    static createNavbarStructure() {
        // Create the navbar directly rather than fetching an HTML file
        const navbar = document.createElement('nav');
        navbar.className = 'navbar';

        const ul = document.createElement('ul');

        // Define all standard navbar links
        const links = [
            { href: '/home.html', text: 'Home', dataPage: 'home' },
            { href: '/journalPage.html', text: 'Habits', dataPage: 'habits' },
            { href: '/stats/stats.html', text: 'Stats', dataPage: 'stats' },
            { href: '/profile.html', text: 'Profile', dataPage: 'profile' }
        ];

        // Create and append each link
        links.forEach(link => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = link.href;
            a.className = 'nav-btn';
            a.setAttribute('data-page', link.dataPage);
            a.textContent = link.text;
            li.appendChild(a);
            ul.appendChild(li);
        });

        navbar.appendChild(ul);

        // Remove any existing navbar to avoid duplicates
        const oldNavbar = document.querySelector('.navbar');
        if (oldNavbar) oldNavbar.remove();

        // Insert the navbar at the beginning of the body
        document.body.insertAdjacentElement('afterbegin', navbar);
    }

    static setActivePage() {
        const currentPath = window.location.pathname;
        const navButtons = document.querySelectorAll('.nav-btn');

        navButtons.forEach(btn => {
            const btnPath = btn.getAttribute('href');
            // Check if the button path is in the current URL path
            if (btnPath && currentPath.includes(btnPath)) {
                btn.classList.add('active');
            }
            // Special case for root path redirecting to home
            else if ((currentPath === '/' || currentPath === '/index.html') &&
                    btnPath === '/home.html') {
                btn.classList.add('active');
            }
        });
    }

    static checkUserPrivacyAndUpdateNavbar() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userRef = doc(db, "users", user.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        const userPrivacy = userData.privacy;

                        if (userPrivacy === "public") {
                            this.addAccountabilityLink();
                        } else {
                            this.removeAccountabilityLink();
                        }
                    }
                } catch (error) {
                    console.error("Error checking user privacy:", error);
                }
            } else {
                this.removeAccountabilityLink();
            }
        });
    }

    static addAccountabilityLink() {
        const navbarList = document.querySelector('.navbar ul');
        if (!navbarList) return;

        // Only add the accountability link if it doesn't already exist
        if (!navbarList.querySelector('[data-page="accountability"]')) {
            const li = document.createElement('li');
            li.id = "accountability-nav-item";

            const a = document.createElement('a');
            a.href = "/accountability.html";
            a.className = "nav-btn";
            a.setAttribute("data-page", "accountability");
            a.textContent = "Accountability";

            li.appendChild(a);
            navbarList.appendChild(li);
            console.log("Accountability link added to navbar");
        }
    }

    static removeAccountabilityLink() {
        const accountabilityLink = document.querySelector('[data-page="accountability"]');
        if (accountabilityLink) {
            const parentLi = accountabilityLink.closest('li');
            if (parentLi) {
                parentLi.remove();
                console.log("Accountability link removed from navbar");
            }
        }
    }

    static checkIfUserIsAdmin() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userRef = doc(db, "users", user.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        // Check if user has an admin field that's true
                        if (userData.isAdmin === true) {
                            this.addAdminLink();
                        } else {
                            this.removeAdminLink();
                        }
                    }
                } catch (error) {
                    console.error("Error checking admin status:", error);
                }
            } else {
                // Remove admin link if user is not logged in
                this.removeAdminLink();
            }
        });
    }

    static addAdminLink() {
        const navbarList = document.querySelector('.navbar ul');
        if (!navbarList) return;

        // Only add the admin link if it doesn't already exist
        if (!navbarList.querySelector('[data-page="admin"]')) {
            const li = document.createElement('li');
            li.id = "admin-nav-item";

            const a = document.createElement('a');
            a.href = "/admin.html";
            a.className = "nav-btn";
            a.setAttribute("data-page", "admin");
            a.textContent = "Admin";

            li.appendChild(a);
            navbarList.appendChild(li);
            console.log("Admin link added to navbar");
        }
    }

    static removeAdminLink() {
        const adminLink = document.querySelector('[data-page="admin"]');
        if (adminLink) {
            const parentLi = adminLink.closest('li');
            if (parentLi) {
                parentLi.remove();
                console.log("Admin link removed from navbar");
            }
        }
    }
}

// Initialize the navbar when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => Navbar.init());

// Export the Navbar class for use in other files
export { Navbar };
