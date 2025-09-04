/**
 *  Pages Authentication
 */

"use strict";
import { formValidation } from "@form-validation/bundle/popular";
import { Bootstrap5 } from "@form-validation/plugin-bootstrap5";
import { Trigger } from "@form-validation/plugin-trigger";
import { SubmitButton } from "@form-validation/plugin-submit-button";
import { DefaultSubmit } from "@form-validation/plugin-default-submit";
import { AutoFocus } from "@form-validation/plugin-auto-focus";
import $ from "./ajax-setup";
import Swal from 'sweetalert2'
const formAuthentication = document.querySelector("#formAuthentication");

document.addEventListener("DOMContentLoaded", function (e) {
  (function () {
    // Form validation for Add new record
    if (formAuthentication) {
      const fv = formValidation(formAuthentication, {
        fields: {
          username: {
            validators: {
              notEmpty: {
                message: "Please enter username",
              },
              stringLength: {
                min: 6,
                message: "Username must be more than 6 characters",
              },
            },
          },
          email: {
            validators: {
              notEmpty: {
                message: "Please enter your email",
              },
              emailAddress: {
                message: "Please enter valid email address",
              },
            },
          },
          username: {
            validators: {
              notEmpty: {
                message: "Please enter email / username",
              },
              stringLength: {
                min: 6,
                message: "Username must be more than 6 characters",
              },
            },
          },
          password: {
            validators: {
              notEmpty: {
                message: "Please enter your password",
              },
              stringLength: {
                min: 6,
                message: "Password must be more than 6 characters",
              },
            },
          },
          "confirm-password": {
            validators: {
              notEmpty: {
                message: "Please confirm password",
              },
              identical: {
                compare: function () {
                  return formAuthentication.querySelector('[name="password"]')
                    .value;
                },
                message: "The password and its confirm are not the same",
              },
              stringLength: {
                min: 6,
                message: "Password must be more than 6 characters",
              },
            },
          },
          terms: {
            validators: {
              notEmpty: {
                message: "Please agree terms & conditions",
              },
            },
          },
        },
        plugins: {
          trigger: new Trigger(),
          bootstrap5: new Bootstrap5({
            eleValidClass: "",
            rowSelector: ".mb-3",
          }),
          submitButton: new SubmitButton(),
          // defaultSubmit: new DefaultSubmit(),
          autoFocus: new AutoFocus(),
        },
        init: (instance) => {
          instance.on("plugins.message.placed", function (e) {
            if (e.element.parentElement.classList.contains("input-group")) {
              e.element.parentElement.insertAdjacentElement(
                "afterend",
                e.messageElement
              );
            }
          });
        },
      });
      // console.log(fv);
      fv.on("core.form.valid", function (e) {
        const email = formAuthentication.username.value;
        const password = formAuthentication.password.value;
        $.ajax({
          url:
            backend_path +
            "/auth/login",
          type: "POST",
          contentType: "application/json",
          dataType: "json",
          data: JSON.stringify({
            email: email,
            password: password
          }),
          success: function (result) {
            // simpan token ke cookie (expires 1 hari)
            document.cookie = `auth_token=${result.access_token}; path=/; max-age=86400; SameSite=Lax`;
            localStorage.setItem("access_token", result.access_token);
            // ambil redirect dari query param
              const params = new URLSearchParams(window.location.search);
              const redirectUrl = params.get("redirect") || "/";
              // redirect user ke halaman terakhir / default dashboard
              window.location.href = redirectUrl;
          },
          error: function (xhr, status, error) {
            Swal.fire({
              title: 'Error!',
              text: xhr.responseText,
              icon: 'error',
              customClass: {
                confirmButton: 'btn btn-primary waves-effect waves-light'
              },
              buttonsStyling: false
            });
            try {
              const json = JSON.parse(xhr.responseText);        // parse ke JSON
              console.error("Error JSON:", json);
            } catch (e) {
              console.log(xhr.responseText)
              console.error("Bukan JSON:", xhr.responseText);
            }
          },
        });
      });
    }

    //  Two Steps Verification
    const numeralMask = document.querySelectorAll(".numeral-mask");

    // Verification masking
    if (numeralMask.length) {
      numeralMask.forEach((e) => {
        new Cleave(e, {
          numeral: true,
        });
      });
    }
  })();
});

