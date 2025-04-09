import { app } from './init.mjs';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const db = getFirestore(app);
const auth = getAuth();

document.addEventListener("DOMContentLoaded", () => {
    // Wait for navbar to be loaded
    setTimeout(() => {
        const buttons = document.querySelectorAll(".nav-btn");
        const currentPage = window.location.pathname.split("/").pop();

        buttons.forEach(button => {
            const path = button.getAttribute("data-page");

            if (path === currentPage ||
                (path === "stats/stats.html" && window.location.pathname.includes("/stats/"))) {
                button.classList.add("active");
            }

            button.addEventListener("click", () => {
                const isInStats = window.location.pathname.includes("/stats/");
                const targetPath = isInStats && !path.includes("stats") ? `../${path}` : path;
                window.location.href = targetPath;
            });
        });
    }, 100); // Small delay to ensure navbar is loaded
});

// Placeholder to prevent layout shift and re-render issues
const accountabilityPlaceholder = document.createElement("li");
accountabilityPlaceholder.id = "Accountability";
document.querySelector(".navbar ul").appendChild(accountabilityPlaceholder);

// Monitor auth state and update navbar accordingly
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const accountabilityExists = !!document.querySelector("#Accountability button");

                if (userData.privacy === "private") {
                    if (accountabilityExists) {
                        removeNavButton("Accountability");
                    }
                } else {
                    if (!accountabilityExists) {
                        addNavButton("Accountability", "accountability.html");
                    }
                }
            } else {
                console.log("No user document found in Firestore.");
            }
        } catch (error) {
            console.error("Error fetching user document: ", error);
        }
    } else {
        removeNavButton("Accountability");
    }
});

// Function to add a button to the navbar in the placeholder
function addNavButton(text, page) {
    const navList = document.querySelector('.navbar ul');
    let placeholder = document.getElementById(text);

    if (!placeholder) {
        placeholder = document.createElement("li");
        placeholder.id = text;
        navList.appendChild(placeholder);
    }

    placeholder.innerHTML = `<button class="nav-btn" data-page="${page}">${text}</button>`;
    placeholder.querySelector("button").addEventListener('click', () => {
        window.location.href = page;
    });
}

// Function to remove a button from the navbar
function removeNavButton(id) {
    const listItem = document.getElementById(id);
    if (listItem) {
        listItem.innerHTML = ""; // Clear content instead of full removal
    }
}
