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
          "email-username": {
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

          defaultSubmit: new DefaultSubmit(),
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

$("#login").on("click", function (a) {
  const sss = $("#formAuthentication").serializeArray();
  console.log(sss);
});
