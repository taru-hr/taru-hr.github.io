'use strict';

// element toggle function
const elementToggleFunc = function (elem) {
  if (elem) elem.classList.toggle("active");
};


// ===========================
// Sidebar
// ===========================

const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

if (sidebarBtn && sidebar) {
  sidebarBtn.addEventListener("click", function () {
    elementToggleFunc(sidebar);
  });
}


// ===========================
// Custom Select (Portfolio)
// ===========================

const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");
const filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function (selectedValue) {

  for (let i = 0; i < filterItems.length; i++) {

    if (selectedValue === "all") {
      filterItems[i].classList.add("active");
    } else if (selectedValue === filterItems[i].dataset.category) {
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }

  }

};

if (select) {
  select.addEventListener("click", function () {
    elementToggleFunc(this);
  });
}

if (selectItems.length && selectValue) {

  for (let i = 0; i < selectItems.length; i++) {

    selectItems[i].addEventListener("click", function () {

      const selectedValue = this.innerText.toLowerCase();

      selectValue.innerText = this.innerText;

      if (select) {
        elementToggleFunc(select);
      }

      filterFunc(selectedValue);

    });

  }

}

if (filterBtn.length && selectValue) {

  let lastClickedBtn = filterBtn[0];

  for (let i = 0; i < filterBtn.length; i++) {

    filterBtn[i].addEventListener("click", function () {

      const selectedValue = this.innerText.toLowerCase();

      selectValue.innerText = this.innerText;

      filterFunc(selectedValue);

      if (lastClickedBtn) {
        lastClickedBtn.classList.remove("active");
      }

      this.classList.add("active");
      lastClickedBtn = this;

    });

  }

}


// ===========================
// Contact Form
// ===========================

const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

if (form && formBtn) {

  for (let i = 0; i < formInputs.length; i++) {

    formInputs[i].addEventListener("input", function () {

      if (form.checkValidity()) {
        formBtn.removeAttribute("disabled");
      } else {
        formBtn.setAttribute("disabled", "");
      }

    });

  }

}


// ===========================
// Page Navigation
// ===========================

const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

for (let i = 0; i < navigationLinks.length; i++) {

  navigationLinks[i].addEventListener("click", function () {

    const selectedPage = this.innerText.trim().toLowerCase();

    for (let j = 0; j < pages.length; j++) {

      if (selectedPage === pages[j].dataset.page) {

        pages[j].classList.add("active");
        navigationLinks[j].classList.add("active");
        window.scrollTo(0, 0);

      } else {

        pages[j].classList.remove("active");
        navigationLinks[j].classList.remove("active");

      }

    }

  });

}