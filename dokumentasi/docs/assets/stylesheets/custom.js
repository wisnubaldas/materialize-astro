// Custom JavaScript for TPSOnline Docs

document.addEventListener("DOMContentLoaded", function () {
    console.log("📘 TPSOnline Docs loaded successfully");

    // Highlight external links
    document.querySelectorAll("a[href^='http']").forEach(link => {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener");
    });

    // Example: Add floating button for quick scroll to top
    const button = document.createElement("button");
    button.textContent = "↑";
    button.id = "scrollTopBtn";
    button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    border: none;
    background-color: #1976d2;
    color: white;
    font-size: 18px;
    padding: 8px 12px;
    border-radius: 50%;
    cursor: pointer;
    display: none;
    z-index: 1000;
  `;
    document.body.appendChild(button);

    window.addEventListener("scroll", () => {
        button.style.display = window.scrollY > 400 ? "block" : "none";
    });

    button.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
});
