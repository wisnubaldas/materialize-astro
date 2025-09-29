/* Template Name: Starty - Multipurpose HTML Template
   Author: Shreethemes
   E-mail: shreethemes@gmail.com
   Created: August 2021
   Version: v1.2.0
   Updated: February 2021
   File Description: Main JS file of the template
*/

/*********************************/
/*         INDEX                 */
/*================================
 *     01.  Loader               *
 *     02.  Toggle Menus         *
 *     03.  Active Menu          *
 *     04.  Clickable Menu       *
 *     05.  Back to top          *
 *     06.  Feather icon         *
 *     06.  DD Menu              *
 *     06.  Active Sidebar Menu  *
 ================================*/
var themeDark = false;
// membuat inisial menu
document.addEventListener("DOMContentLoaded", function () {
  const menuList = document.querySelector("#main-menu");
  if (!menuList) return; // Keluar jika menu tidak ditemukan

  const menuLinks = menuList.querySelectorAll("a");
  const minWidth = 1402;

  const menuData = [
    { text: `Home`, initial: "home-md-twotone" },
    { text: "About Us", initial: "briefcase-twotone" },
    { text: "Our Expertise", initial: "brake-alert-twotone" },
    { text: "Our Network", initial: "telegram" },
    { text: "Facilities", initial: "beer-twotone-loop" },
    { text: "Tracking", initial: "compass-twotone" },
    { text: "Contact", initial: "phone-incoming-twotone" },
  ];

  function updateMenuText() {
    if (window.innerWidth < minWidth) {
      // Ganti teks dengan inisial
      menuLinks.forEach((link, index) => {
        if (menuData[index]) {
          const d = "#363535ff";
          const l = "#f1f1f1ff";
          const icon = menuData[index].initial;
          const x = `<iconify-icon
              icon="line-md:${icon}"
              width="24"
              height="24"
              style="color: ${themeDark ? l : d}"></iconify-icon>`;
          link.innerHTML = x;
        }
      });
    } else {
      // Kembalikan teks ke aslinya
      menuLinks.forEach((link, index) => {
        if (menuData[index]) {
          link.textContent = menuData[index].text;
        }
      });
    }
  }

  // Jalankan fungsi saat halaman dimuat
  updateMenuText();

  // Jalankan fungsi saat ukuran jendela diubah
  window.addEventListener("resize", updateMenuText);
});

window.addEventListener("load", fn, false);

//  window.onload = function loader() {
function fn() {
  // Preloader
  if (document.getElementById("preloader")) {
    setTimeout(() => {
      document.getElementById("preloader").style.visibility = "hidden";
      document.getElementById("preloader").style.opacity = "0";
    }, 350);
  }
  // Menus
  activateMenu();
}

//Menu
// Toggle menu
function toggleMenu() {
  document.getElementById("isToggle").classList.toggle("open");
  var isOpen = document.getElementById("navigation");
  if (isOpen.style.display === "block") {
    isOpen.style.display = "none";
  } else {
    isOpen.style.display = "block";
  }
}

//Menu Active
function getClosest(elem, selector) {
  // Element.matches() polyfill
  if (!Element.prototype.matches) {
    Element.prototype.matches =
      Element.prototype.matchesSelector ||
      Element.prototype.mozMatchesSelector ||
      Element.prototype.msMatchesSelector ||
      Element.prototype.oMatchesSelector ||
      Element.prototype.webkitMatchesSelector ||
      function (s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s),
          i = matches.length;
        while (--i >= 0 && matches.item(i) !== this) { }
        return i > -1;
      };
  }

  // Get the closest matching element
  for (; elem && elem !== document; elem = elem.parentNode) {
    if (elem.matches(selector)) return elem;
  }
  return null;
}

function activateMenu() {
  var menuItems = document.getElementsByClassName("sub-menu-item");
  if (menuItems) {
    var matchingMenuItem = null;
    for (var idx = 0; idx < menuItems.length; idx++) {
      if (menuItems[idx].href === window.location.href) {
        matchingMenuItem = menuItems[idx];
      }
    }

    if (matchingMenuItem) {
      matchingMenuItem.classList.add("active");
      var immediateParent = getClosest(matchingMenuItem, "li");
      if (immediateParent) {
        immediateParent.classList.add("active");
      }

      var parent = getClosest(matchingMenuItem, ".parent-menu-item");
      if (parent) {
        parent.classList.add("active");
        var parentMenuitem = parent.querySelector(".menu-item");
        if (parentMenuitem) {
          parentMenuitem.classList.add("active");
        }
        var parentOfParent = getClosest(parent, ".parent-parent-menu-item");
        if (parentOfParent) {
          parentOfParent.classList.add("active");
        }
      } else {
        var parentOfParent = getClosest(
          matchingMenuItem,
          ".parent-parent-menu-item"
        );
        if (parentOfParent) {
          parentOfParent.classList.add("active");
        }
      }
    }
  }
}

// Clickable Menu
if (document.getElementById("navigation")) {
  var elements = document
    .getElementById("navigation")
    .getElementsByTagName("a");
  for (var i = 0, len = elements.length; i < len; i++) {
    elements[i].onclick = function (elem) {
      if (elem.target.getAttribute("href") === "javascript:void(0)") {
        var submenu = elem.target.nextElementSibling.nextElementSibling;
        submenu.classList.toggle("open");
      }
    };
  }
}

// Menu sticky
function windowScroll() {
  const navbar = document.getElementById("topnav");
  if (navbar != null) {
    if (
      document.body.scrollTop >= 50 ||
      document.documentElement.scrollTop >= 50
    ) {
      navbar.classList.add("nav-sticky");
    } else {
      navbar.classList.remove("nav-sticky");
    }
  }
}

window.addEventListener("scroll", (ev) => {
  ev.preventDefault();
  windowScroll();
});

// back-to-top
var mybutton = document.getElementById("back-to-top");
window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  if (mybutton != null) {
    if (
      document.body.scrollTop > 500 ||
      document.documentElement.scrollTop > 500
    ) {
      mybutton.style.display = "block";
    } else {
      mybutton.style.display = "none";
    }
  }
}

function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

//ACtive Sidebar
(function () {
  var current = location.pathname.substring(
    location.pathname.lastIndexOf("/") + 1
  );
  if (current === "") return;
  var menuItems = document.querySelectorAll(".sidebar-nav a");
  for (var i = 0, len = menuItems.length; i < len; i++) {
    if (menuItems[i].getAttribute("href").indexOf(current) !== -1) {
      menuItems[i].parentElement.className += " active";
    }
  }
})();

//Feather icon
feather.replace();

// dd-menu
var ddmenu = document.getElementsByClassName("dd-menu");
for (var i = 0, len = ddmenu.length; i < len; i++) {
  ddmenu[i].onclick = function (elem) {
    elem.stopPropagation();
  };
}

//Tooltip
var tooltipTriggerList = [].slice.call(
  document.querySelectorAll('[data-bs-toggle="tooltip"]')
);
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl);
});

//small menu
try {
  var spy = new Gumshoe("#navmenu-nav a");
} catch (err) { }
