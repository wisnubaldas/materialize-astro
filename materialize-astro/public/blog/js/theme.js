// js Document



(function($) {
    "use strict";

      //-------------- Click event to scroll to top
      $(window).on('scroll', function (){
        if ($(this).scrollTop() > 200) {
          $('.scroll-top').fadeIn();
        } else {
          $('.scroll-top').fadeOut();
        }
      });
      $('.scroll-top').on('click', function() {
        $('html, body').animate({scrollTop : 0});
        return false;
      });

      // --------------------- Add .active class to current navigation based on URL
      var pgurl = window.location.href.substr(window.location.href.lastIndexOf("/")+1);
      $(".navbar-nav > li  a").each(function(){
      if($(this).attr("href") == pgurl || $(this).attr("href") == '' )
      $(this).addClass("active");
      // $(this).parent("li").addClass("active");
      })

      // ---------------------------- Select Dropdown
      if($(".nice-select").length) {
        $('.nice-select').niceSelect();
      }

        // ----------------------------- Counter Function
        var timer = $('.counter');
        if(timer.length) {
          $('.counter').counterUp({
            delay: 10,
            time: 1200,
          });
        }

        // ------------------------ Navigation Scroll
        $(window).on('scroll', function (){   
          var sticky = $('.sticky-menu'),
          scroll = $(window).scrollTop();
          if (scroll >= 300) sticky.addClass('fixed');
          else sticky.removeClass('fixed');

        });


      // -------------------- Remove Placeholder When Focus Or Click
        $("input,textarea").each( function(){
            $(this).data('holder',$(this).attr('placeholder'));
            $(this).on('focusin', function() {
                $(this).attr('placeholder','');
            });
            $(this).on('focusout', function() {
                $(this).attr('placeholder',$(this).data('holder'));
            });     
        });

        // ---------------------------- Date Picker
        if($("#datepicker").length) {
          $( "#datepicker" ).datepicker();
        }

        // ------------------------ Product Quantity Selector
        if ($(".product-value").length) {
          $('.value-increase').on('click', function () {
            var $qty = $(this).closest('ul').find('.product-value');
            var currentVal = parseInt($qty.val());
            if (!isNaN(currentVal)) {
              $qty.val(currentVal + 1);
            }
          });
          $('.value-decrease').on('click', function () {
            var $qty = $(this).closest('ul').find('.product-value');
            var currentVal = parseInt($qty.val());
            if (!isNaN(currentVal) && currentVal > 1) {
              $qty.val(currentVal - 1);
            }
          });
        }


        // ------------------------ Feedback Slider Two
      if($(".banner-slider").length) {
        $('.banner-slider').slick({
            dots: false,
            arrows: false,
            lazyLoad: 'ondemand',
            centerPadding: '0px',
            slidesToShow: 1,
            slidesToScroll: 1,
            centerMode: true,
            fade: true,
            autoplay: true,
            autoplaySpeed: 4000,
            focusOnSelect: true,
            pauseOnHover: false,
          });

          $('.banner-slider').slickAnimation();
      }



        // ------------------------ Ribon Slider One
        if($(".rib-slider").length) {
          $('.rib-slider').slick({
              dots: false,
              arrows: false,
              lazyLoad: 'ondemand',
              centerPadding: '0px',
              slidesToShow: 11,
              slidesToScroll: 1,
              autoplay: true,
              autoplaySpeed: 0,
              speed: 5000,
              cssEase: 'linear',
              responsive: [
                {
                  breakpoint: 1600,
                  settings: {
                    slidesToShow: 9
                  }
                },
                {
                  breakpoint: 1200,
                  settings: {
                    slidesToShow: 8
                  }
                },
                {
                  breakpoint: 992,
                  settings: {
                    slidesToShow: 5
                  }
                },
                {
                  breakpoint: 576,
                  settings: {
                    slidesToShow: 3
                  }
                }
              ]
            });
        }




      // ------------------------ Service Slider One
      if($(".service-slider-one").length) {
        $('.service-slider-one').slick({
            dots: false,
            arrows: true,
            prevArrow: $('.prev_a'),
            nextArrow: $('.next_a'),
            lazyLoad: 'ondemand',
            centerPadding: '0px',
            slidesToShow: 3,
            slidesToScroll: 1,
            centerMode: true,
            autoplay: true,
            autoplaySpeed: 3000,
            responsive: [
              {
                breakpoint: 992,
                settings: {
                  slidesToShow: 2
                }
              },
              {
                breakpoint: 768,
                settings: {
                  slidesToShow: 1
                }
              }
            ]
          });
      }


      // ------------------------ Project Slider One
      if($(".project-slider-one").length) {
        $('.project-slider-one').slick({
            dots: false,
            arrows: true,
            prevArrow: $('.prev_b'),
            nextArrow: $('.next_b'),
            lazyLoad: 'ondemand',
            centerPadding: '0px',
            slidesToShow: 4,
            slidesToScroll: 1,
            centerMode: true,
            autoplay: true,
            autoplaySpeed: 3000,
            responsive: [
              {
                breakpoint: 1400,
                settings: {
                  slidesToShow: 3
                }
              },
              {
                breakpoint: 992,
                settings: {
                  slidesToShow: 2
                }
              },
              {
                breakpoint: 768,
                settings: {
                  slidesToShow: 1
                }
              }
            ]
          });
      }


      // ------------------------ Feedback Slider One
      if($(".feedback-slider-one").length) {
        $('.feedback-slider-one').slick({
            dots: true,
            arrows: false,
            lazyLoad: 'ondemand',
            centerPadding: '0px',
            slidesToShow: 1,
            slidesToScroll: 1,
            centerMode: true,
            fade: true,
            autoplay: true,
            autoplaySpeed: 3000,
          });
      }

      // ------------------------ Feedback Slider Two
      if($(".feedback-slider-two").length) {
        $('.feedback-slider-two').slick({
            dots: true,
            arrows: true,
            prevArrow: $('.prev_c'),
            nextArrow: $('.next_c'),
            lazyLoad: 'ondemand',
            centerPadding: '0px',
            slidesToShow: 2,
            slidesToScroll: 1,
            centerMode: true,
            autoplay: true,
            autoplaySpeed: 3000,
            responsive: [
              {
                breakpoint: 992,
                settings: {
                  slidesToShow: 1
                }
              }
            ]
          });
      }


        // --------------------------------- Contact Form
          // init the validator
          // validator files are included in the download package
          // otherwise download from http://1000hz.github.io/bootstrap-validator

          if($("#contact-form").length) {
            $('#contact-form').validator();
            // when the form is submitted
            $('#contact-form').on('submit', function (e) {

                // if the validator does not prevent form submit
                if (!e.isDefaultPrevented()) {
                    var url = "inc/contact.php";

                    // POST values in the background the the script URL
                    $.ajax({
                        type: "POST",
                        url: url,
                        data: $(this).serialize(),
                        success: function (data)
                        {
                            // data = JSON object that contact.php returns

                            // we recieve the type of the message: success x danger and apply it to the
                            var messageAlert = 'alert-' + data.type;
                            var messageText = data.message;

                            // let's compose Bootstrap alert box HTML
                            var alertBox = '<div class="alert ' + messageAlert + ' alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' + messageText + '</div>';

                            // If we have messageAlert and messageText
                            if (messageAlert && messageText) {
                                // inject the alert to .messages div in our form
                                $('#contact-form').find('.messages').html(alertBox);
                                // empty the form
                                $('#contact-form')[0].reset();
                            }
                        }
                    });
                    return false;
                }
            });
          }


          // ------------------------------- Scroll Animation
          var sall = $ ("[data-sal]");
          if(sall.length) {
            sal({
              threshold: 0.01,
            });
          }

$(window).on ('load', function (){ // makes sure the whole site is loaded

// -------------------- Site Preloader
        $('#ctn-preloader').fadeOut(); // will first fade out the loading animation
        $('#preloader').delay(350).fadeOut('slow'); // will fade out the white DIV that covers the website.
        $('body').delay(350).css({'overflow':'visible'});




        
// ------------------------------------- Fancybox
        var fancy = $ ("[data-fancybox]");
        if(fancy.length) {
          Fancybox.bind("[data-fancybox]", {
            // Your custom options
          });
        }




    });  //End On Load Function


})(jQuery);