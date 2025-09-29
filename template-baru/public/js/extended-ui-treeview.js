/**
 * Treeview (jquery)
 */

'use strict';

$(function () {
  var theme = $('html').attr('data-bs-theme') === 'dark' ? 'default-dark' : 'default',
    basicTree = $('#jstree-basic'),
    customIconsTree = $('#jstree-custom-icons'),
    contextMenu = $('#jstree-context-menu'),
    dragDrop = $('#jstree-drag-drop'),
    checkboxTree = $('#jstree-checkbox'),
    ajaxTree = $('#jstree-ajax');

  // Basic
  // --------------------------------------------------------------------
  if (basicTree.length) {
    basicTree.jstree({
      core: {
        themes: {
          name: theme
        }
      }
    });
  }

  // Custom Icons
  // --------------------------------------------------------------------
  if (customIconsTree.length) {
    customIconsTree.jstree({
      core: {
        themes: {
          name: theme
        },
        data: [
          {
            text: 'css',
            children: [
              {
                text: 'app.css',
                type: 'css'
              },
              {
                text: 'style.css',
                type: 'css'
              }
            ]
          },
          {
            text: 'img',
            state: {
              opened: true
            },
            children: [
              {
                text: 'bg.jpg',
                type: 'img'
              },
              {
                text: 'logo.png',
                type: 'img'
              },
              {
                text: 'avatar.png',
                type: 'img'
              }
            ]
          },
          {
            text: 'js',
            state: {
              opened: true
            },
            children: [
              {
                text: 'jquery.js',
                type: 'js'
              },
              {
                text: 'app.js',
                type: 'js'
              }
            ]
          },
          {
            text: 'index.html',
            type: 'html'
          },
          {
            text: 'page-one.html',
            type: 'html'
          },
          {
            text: 'page-two.html',
            type: 'html'
          }
        ]
      },
      plugins: ['types'],
      types: {
        default: {
          icon: 'icon-base ri ri-folder-3-line icon-18px bg-warning'
        },
        html: {
          icon: 'icon-base ri ri-html5-fill icon-18px bg-danger'
        },
        css: {
          icon: 'icon-base ri ri-css3-fill icon-18px bg-info'
        },
        img: {
          icon: 'icon-base ri ri-image-fill icon-18px bg-success'
        },
        js: {
          icon: 'icon-base ri ri-javascript-line icon-18px bg-warning'
        }
      }
    });
  }

  // Context Menu
  // --------------------------------------------------------------------
  if (contextMenu.length) {
    contextMenu.jstree({
      core: {
        themes: {
          name: theme
        },
        check_callback: true,
        data: [
          {
            text: 'css',
            children: [
              {
                text: 'app.css',
                type: 'css'
              },
              {
                text: 'style.css',
                type: 'css'
              }
            ]
          },
          {
            text: 'img',
            state: {
              opened: true
            },
            children: [
              {
                text: 'bg.jpg',
                type: 'img'
              },
              {
                text: 'logo.png',
                type: 'img'
              },
              {
                text: 'avatar.png',
                type: 'img'
              }
            ]
          },
          {
            text: 'js',
            state: {
              opened: true
            },
            children: [
              {
                text: 'jquery.js',
                type: 'js'
              },
              {
                text: 'app.js',
                type: 'js'
              }
            ]
          },
          {
            text: 'index.html',
            type: 'html'
          },
          {
            text: 'page-one.html',
            type: 'html'
          },
          {
            text: 'page-two.html',
            type: 'html'
          }
        ]
      },
      plugins: ['types', 'contextmenu'],
      types: {
        default: {
          icon: 'icon-base ri ri-folder-3-line icon-18px bg-warning'
        },
        html: {
          icon: 'icon-base ri ri-html5-fill icon-18px bg-danger'
        },
        css: {
          icon: 'icon-base ri ri-css3-fill icon-18px bg-info'
        },
        img: {
          icon: 'icon-base ri ri-image-fill icon-18px bg-success'
        },
        js: {
          icon: 'icon-base ri ri-javascript-line icon-18px bg-warning'
        }
      }
    });
  }

  // Drag Drop
  // --------------------------------------------------------------------
  if (dragDrop.length) {
    dragDrop.jstree({
      core: {
        themes: {
          name: theme
        },
        check_callback: true,
        data: [
          {
            text: 'css',
            children: [
              {
                text: 'app.css',
                type: 'css'
              },
              {
                text: 'style.css',
                type: 'css'
              }
            ]
          },
          {
            text: 'img',
            state: {
              opened: true
            },
            children: [
              {
                text: 'bg.jpg',
                type: 'img'
              },
              {
                text: 'logo.png',
                type: 'img'
              },
              {
                text: 'avatar.png',
                type: 'img'
              }
            ]
          },
          {
            text: 'js',
            state: {
              opened: true
            },
            children: [
              {
                text: 'jquery.js',
                type: 'js'
              },
              {
                text: 'app.js',
                type: 'js'
              }
            ]
          },
          {
            text: 'index.html',
            type: 'html'
          },
          {
            text: 'page-one.html',
            type: 'html'
          },
          {
            text: 'page-two.html',
            type: 'html'
          }
        ]
      },
      plugins: ['types', 'dnd'],
      types: {
        default: {
          icon: 'icon-base ri ri-folder-3-line icon-18px bg-warning'
        },
        html: {
          icon: 'icon-base ri ri-html5-fill icon-18px bg-danger'
        },
        css: {
          icon: 'icon-base ri ri-css3-fill icon-18px bg-info'
        },
        img: {
          icon: 'icon-base ri ri-image-fill icon-18px bg-success'
        },
        js: {
          icon: 'icon-base ri ri-javascript-line icon-18px bg-warning'
        }
      }
    });
  }

  // Checkbox
  // --------------------------------------------------------------------
  if (checkboxTree.length) {
    checkboxTree.jstree({
      core: {
        themes: {
          name: theme
        },
        data: [
          {
            text: 'css',
            children: [
              {
                text: 'app.css',
                type: 'css'
              },
              {
                text: 'style.css',
                type: 'css'
              }
            ]
          },
          {
            text: 'img',
            state: {
              opened: true
            },
            children: [
              {
                text: 'bg.jpg',
                type: 'img'
              },
              {
                text: 'logo.png',
                type: 'img'
              },
              {
                text: 'avatar.png',
                type: 'img'
              }
            ]
          },
          {
            text: 'js',
            state: {
              opened: true
            },
            children: [
              {
                text: 'jquery.js',
                type: 'js'
              },
              {
                text: 'app.js',
                type: 'js'
              }
            ]
          },
          {
            text: 'index.html',
            type: 'html'
          },
          {
            text: 'page-one.html',
            type: 'html'
          },
          {
            text: 'page-two.html',
            type: 'html'
          }
        ]
      },
      plugins: ['types', 'checkbox', 'wholerow'],
      types: {
        default: {
          icon: 'icon-base ri ri-folder-3-line icon-18px bg-warning'
        },
        html: {
          icon: 'icon-base ri ri-html5-fill icon-18px bg-danger'
        },
        css: {
          icon: 'icon-base ri ri-css3-fill icon-18px bg-info'
        },
        img: {
          icon: 'icon-base ri ri-image-fill icon-18px bg-success'
        },
        js: {
          icon: 'icon-base ri ri-javascript-line icon-18px bg-warning'
        }
      }
    });
  }

  // Ajax Example
  // --------------------------------------------------------------------
  if (ajaxTree.length) {
    ajaxTree.jstree({
      core: {
        themes: {
          name: theme
        },
        data: {
          url: assetsPath + 'json/jstree-data.json',
          dataType: 'json',
          data: function (node) {
            return {
              id: node.id
            };
          }
        }
      },
      plugins: ['types', 'state'],
      types: {
        default: {
          icon: 'icon-base ri ri-folder-3-line icon-18px bg-warning'
        },
        html: {
          icon: 'icon-base ri ri-html5-fill icon-18px bg-danger'
        },
        css: {
          icon: 'icon-base ri ri-css3-fill icon-18px bg-info'
        },
        img: {
          icon: 'icon-base ri ri-image-fill icon-18px bg-success'
        },
        js: {
          icon: 'icon-base ri ri-javascript-line icon-18px bg-warning'
        }
      }
    });
  }
});
