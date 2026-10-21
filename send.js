"use strict";

// Включить (true) или выключить (false) цели и ClientID Яндекс.Метрики
const YANDEX_METRIKA_ENABLED = false;

document.addEventListener("DOMContentLoaded", function () {
  const UTM_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ];

  function readUtmFromUrl() {
    const params = new URLSearchParams(window.location.search || "");
    const utm = {};
    UTM_KEYS.forEach((k) => {
      const v = params.get(k);
      if (v !== null && v !== "") utm[k] = v;
    });
    return utm;
  }

  function readUtmFromSessionStorage() {
    const utm = {};
    UTM_KEYS.forEach((k) => {
      const v = sessionStorage.getItem(k);
      if (v !== null && v !== "") utm[k] = v;
    });
    return utm;
  }

  function persistUtmToSessionStorage(utm) {
    if (!utm) return;
    UTM_KEYS.forEach((k) => {
      if (utm[k]) sessionStorage.setItem(k, utm[k]);
    });
  }

  function getUtmForSubmit() {
    const fromUrl = readUtmFromUrl();
    persistUtmToSessionStorage(fromUrl);
    return { ...readUtmFromSessionStorage(), ...fromUrl };
  }

  // Сохраняем UTM при заходе на страницу, чтобы они не терялись
  // если пользователь потом переходит по сайту без query-параметров.
  persistUtmToSessionStorage(readUtmFromUrl());

  document.addEventListener("submit", function (event) {
    event.preventDefault();
    let isValid = true;
    const form = event.target; // <- вот она, форма
    const phoneInput = form.querySelector('input[type="tel"]');
    if (phoneInput && !validatePhoneNumber(phoneInput)) {
      isValid = false;
      alert("Пожалуйста, введите полный номер телефона (+7 (XXX) XXX-XX-XX)");
      return;
    }

    if (!isValid) return;

    formSend(event);
    // Звпускаем скрипт обработчика
    async function formSend(event) {
      event.preventDefault();
      if (YANDEX_METRIKA_ENABLED) {
        ym(88648559, "reachGoal", "ssf_new");
      }

      let error = formValidate(form);

      if (error !== 0) {
        alert("Заполните обязалельные поля");
        return;
      }

      const btnSubmit = form.querySelector('button[type="submit"]');
      const originalButtonText = getSubmitText(btnSubmit);
      setSubmitLoading(btnSubmit);
      console.log("error", error);
      form.classList.add("_sending");

      let ymClientId = null;
      if (YANDEX_METRIKA_ENABLED) {
        try {
          ymClientId = await new Promise((resolve) => {
            ym(100236255, "getClientID", function (clientID) {
              resolve(clientID);
            });
            setTimeout(() => resolve(null), 500);
          });
          console.log("YM ClientID получен:", ymClientId);
        } catch (e) {
          console.error("Ошибка получения ClientID", e);
        }
      }

      let formData = new FormData(form);

      // Генерируем токен для защиты от повторной отправки
      const newToken =
        Date.now().toString(36) + Math.random().toString(36).substr(2);
      formData.append("newToken", newToken);
      // formData.append('image', formImage.files[0]);

      const utm = getUtmForSubmit();
      UTM_KEYS.forEach((k) => {
        if (utm[k]) formData.append(k, utm[k]);
      });

      if (ymClientId) {
        formData.append("ym_client_id", ymClientId);
      }

      try {
        let response = await fetch("/sendmail.php", {
          method: "POST",
          body: formData,
        });
        let result = null;
        try {
          result = await response.json();
        } catch (e) {
          console.error("Некорректный JSON от сервера", e);
        }
        if (response.ok) {
          if (result && result.status === "success") {
            form.reset();
            setTimeout(function () {
              window.location.href = "/thankyou.php";
            }, 1 * 1000);
          } else {
            alert(
              (result && result.message) ||
                "Произошла ошибка при отправке формы",
            );
            // Возвращаем кнопку в исходное состояние
            resetSubmit(btnSubmit, originalButtonText);
          }
        } else {
          // Ошибка HTTP запроса
          alert((result && result.message) || "Ошибка сервера");
          resetSubmit(btnSubmit, originalButtonText);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        alert("Произошла ошибка при отправке. Попробуйте позже.");
        resetSubmit(btnSubmit, originalButtonText);
      } finally {
        form.classList.remove("_sending");
      }
    }
    function getInputsNumbersValue(input) {
      return input.value.replace(/\D/g, "");
    }

    // Валидация номера телефона
    function validatePhoneNumber(input) {
      const inputNumbersValue = getInputsNumbersValue(input);
      // Российский номер должен содержать 11 цифр (включая код страны)
      return inputNumbersValue.length === 11;
    }
    function formValidate(form) {
      let error = 0;
      let formRequired = form.querySelectorAll("._required");
      deleteErrorClassOnInputs(formRequired);
      for (let index = 0; index < formRequired.length; index++) {
        const input = formRequired[index];
        if (
          input.getAttribute("type") === "checkbox" &&
          input.checked === false
        ) {
          formAddError(input);
          error++;
        } else {
          if (input.value === "") {
            formAddError(input);
            error++;
          }
        }
      }
      return error;
    }
    function deleteErrorClassOnInputs(inputs) {
      inputs.forEach((input) => formRemoveError(input));
    }
    function formAddError(input) {
      console.log("input", input);
      input.parentElement.classList.add("_error");
      input.classList.add("_error");
    }
    function formRemoveError(input) {
      input.parentElement.classList.remove("_error");
      input.classList.remove("_error");
    }
    function getSubmitText(el) {
      if (!el) return "";
      if (el.tagName === "INPUT") return el.value ?? "";
      return el.innerHTML ?? "";
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
    function resetSubmit(el, originalText) {
      if (!el) return;
      if (el.tagName === "INPUT") {
        el.value = originalText;
      } else {
        el.innerHTML = originalText;
      }
      el.disabled = false;
    }
    if (document.getElementById("formImage")) {
      //Получаем инпут file в переменную
      const formImage = document.getElementById("formImage");
      //Получаем див для превью в переменную
      const formPreview = document.getElementById("formPreview");
      // Слушаем изменения в инпуте file
      formImage.addEventListener("change", () => {
        uploadFile(formImage.files[0]);
      });
      function uploadFile(file) {
        //проверяем тип файла
        if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
          alert("разрешены только изображения");
          formImage.value = "";
          return;
        }
        //проверка размера файла (<2мб)
        if (file.size > 2 * 1024 * 1024) {
          alert("Файл должен быть менее 2Мб");
          return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
          formPreview.innerHTML = `<img src="${e.target.result}" alt="Фото">`;
        };
        reader.onerror = function (e) {
          alert("Ошибка");
        };
        reader.readAsDataURL(file);
      }
    }
  });
});
