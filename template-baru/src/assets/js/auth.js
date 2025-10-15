/**
 *  Pages Authentication
 */
// #ts-nocheck
"use strict";
let fv;
let formAuthentication;
const backend_path = (() => {
    let fallbackOrigin = '';
    try {
        if (typeof window !== 'undefined') {
            if (window.apiPath) {
                return window.apiPath;
            }
            if (window.location?.origin) {
                fallbackOrigin = window.location.origin;
            }
        }
    } catch (e) { }
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_BACKEND_PATH) {
            return import.meta.env.PUBLIC_BACKEND_PATH;
        }
    } catch (e) { }
    return fallbackOrigin;
})();

const buildBackendUrl = (path) => {
    if (!backend_path) {
        return path;
    }
    const trimmedBase = backend_path.replace(/\/+$/, '');
    const trimmedPath = path.replace(/^\/+/, '');
    return `${trimmedBase}/${trimmedPath}`;
};

const resolveRedirectUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const fallback = '/admin';
    const redirectParam = params.get('redirect');

    if (!redirectParam) {
        return fallback;
    }

    try {
        const candidate = new URL(redirectParam, window.location.origin);
        if (candidate.origin !== window.location.origin) {
            return fallback;
        }
        const normalizedPath = candidate.pathname || fallback;
        return `${normalizedPath}${candidate.search}${candidate.hash}` || fallback;
    } catch (e) {
        if (redirectParam.startsWith('/')) {
            return redirectParam;
        }
        return fallback;
    }
};
document.addEventListener('DOMContentLoaded', function () {
    // Bersihkan state login hanya untuk token, jangan hapus semua storage
    try { localStorage.removeItem('access_token'); } catch (e) { }
    try { document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'; } catch (e) { }
    (() => {
        formAuthentication = document.querySelector('#formAuthentication');
        // Form validation for Add new record
        if (formAuthentication && typeof FormValidation !== 'undefined') {
            fv = FormValidation.formValidation(formAuthentication, {
                fields: {
                    username: {
                        validators: {
                            notEmpty: {
                                message: 'Please enter username'
                            },
                            stringLength: {
                                min: 6,
                                message: 'Username must be more than 6 characters'
                            }
                        }
                    },
                    email: {
                        validators: {
                            notEmpty: {
                                message: 'Please enter your email'
                            },
                            emailAddress: {
                                message: 'Please enter a valid email address'
                            }
                        }
                    },
                    'email-username': {
                        validators: {
                            notEmpty: {
                                message: 'Please enter email / username'
                            },
                            stringLength: {
                                min: 6,
                                message: 'Username must be more than 6 characters'
                            }
                        }
                    },
                    password: {
                        validators: {
                            notEmpty: {
                                message: 'Please enter your password'
                            },
                            stringLength: {
                                min: 6,
                                message: 'Password must be more than 6 characters'
                            }
                        }
                    },
                    'confirm-password': {
                        validators: {
                            notEmpty: {
                                message: 'Please confirm password'
                            },
                            identical: {
                                compare: () => formAuthentication.querySelector('[name="password"]').value,
                                message: 'The password and its confirmation do not match'
                            },
                            stringLength: {
                                min: 6,
                                message: 'Password must be more than 6 characters'
                            }
                        }
                    },
                    terms: {
                        validators: {
                            notEmpty: {
                                message: 'Please agree to terms & conditions'
                            }
                        }
                    }
                },
                plugins: {
                    trigger: new FormValidation.plugins.Trigger(),
                    bootstrap5: new FormValidation.plugins.Bootstrap5({
                        eleValidClass: '',
                        rowSelector: '.form-control-validation'
                    }),
                    submitButton: new FormValidation.plugins.SubmitButton(),
                    defaultSubmit: new FormValidation.plugins.DefaultSubmit(),
                    autoFocus: new FormValidation.plugins.AutoFocus()
                },
                init: instance => {
                    instance.on('plugins.message.placed', e => {
                        if (e.element.parentElement.classList.contains('input-group')) {
                            e.element.parentElement.insertAdjacentElement('afterend', e.messageElement);
                        }
                    });
                }
            });
            $('#login').on('click', function () {
                const email = formAuthentication.username.value;
                const password = formAuthentication.password.value;
                alert(buildBackendUrl('/auth/login'))
                $.ajax({
                    url: buildBackendUrl('/auth/login'),
                    type: 'POST',
                    contentType: 'application/json',
                    dataType: 'json',
                    xhrFields: {
                        withCredentials: true // <--- WAJIB agar browser simpan cookie dari server
                    },
                    data: JSON.stringify({
                        email: email,
                        password: password
                    }),
                    success: function (result) {
                        // simpan token ke cookie (expires 1 hari) dan localStorage untuk kompatibilitas
                        if (result && result.access_token) {
                            try { localStorage.setItem('access_token', result.access_token); } catch (e) { }
                            try {
                                const days = 1; const maxAge = Math.floor(days * 24 * 60 * 60);
                                document.cookie = `access_token=${encodeURIComponent(result.access_token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
                            } catch (e) { }
                        }
                        // ambil redirect dari query param
                        const redirectUrl = resolveRedirectUrl();
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
                            const json = JSON.parse(xhr.responseText); // parse ke JSON
                            console.error('Error JSON:', json);
                        } catch (e) {
                            // window.location.href = '/auth/login/';
                            //   console.log(xhr.responseText);
                            console.log(xhr.statusText);
                            console.error('Bukan JSON:', xhr.responseText);
                        }
                    }
                });
            });
            // console.log(formAuthentication);
            // fv.on('core.form.valid', function (e) {});
        }
        // submit form

        // Two Steps Verification for numeral input mask
        const numeralMaskElements = document.querySelectorAll('.numeral-mask');

        // Format function for numeral mask
        const formatNumeral = value => value.replace(/\D/g, ''); // Only keep digits

        if (numeralMaskElements.length > 0) {
            numeralMaskElements.forEach(numeralMaskEl => {
                numeralMaskEl.addEventListener('input', event => {
                    numeralMaskEl.value = formatNumeral(event.target.value);
                });
            });
        }
    })();
});
