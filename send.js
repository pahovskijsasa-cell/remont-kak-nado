"use strict";

// Сайт размещён на GitHub Pages, поэтому реальная отправка на сервер здесь не
// выполняется. После успешной валидации показываем состояние отправки и
// переходим на страницу «Спасибо» оригинального сайта.
const THANKYOU_URL = "https://remont-kaknado.ru/thankyou.php";
const SUBMIT_DELAY_MS = 800;

document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("submit", function (event) {
    const form = event.target;
    if (!form || !form.classList.contains("form-submit")) return;

    event.preventDefault();

    const phoneInput = form.querySelector('input[type="tel"]');
    if (phoneInput && !validatePhoneNumber(phoneInput)) {
      alert("Пожалуйста, введите полный номер телефона (+7 (XXX) XXX-XX-XX)");
      phoneInput.focus();
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Защита от повторного клика, пока идёт «отправка».
    if (form.dataset.submitting === "1") return;
    form.dataset.submitting = "1";

    const btnSubmit = form.querySelector('button[type="submit"]');
    setSubmitLoading(btnSubmit);
    form.classList.add("_sending");

    window.setTimeout(function () {
      form.reset();
      window.location.href = THANKYOU_URL;
    }, SUBMIT_DELAY_MS);
  });

  function getInputsNumbersValue(input) {
    return input.value.replace(/\D/g, "");
  }

  // Российский номер должен содержать 11 цифр (включая код страны).
  function validatePhoneNumber(input) {
    return getInputsNumbersValue(input).length === 11;
  }

  function setSubmitLoading(el) {
    if (!el) return;
    if (el.tagName === "INPUT") {
      el.value = "Отправка формы...";
    } else {
      el.innerHTML = "Отправка формы...";
    }
    el.disabled = true;
  }
});
