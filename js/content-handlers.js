
var contentHandlers = [
  // Unsupported Sites --------------------------------------------------------
  {
    match: function(url) {
      return config.unsupportedSites.some(function(site) {
        return (typeof site == "string" && url.startsWith(site)) || (site instanceof RegExp && site.test(url));
      })
    },
    validate: function() {
      throw new Error(JSON.stringify({code: "error_page_unreadable"}));
    }
  },

  // PDF file:// --------------------------------------------------------------
  {
    match: function(url) {
      return /^file:.*\.pdf$/i.test(url.split("?")[0]);
    },
    validate: function(tab) {
      throw new Error(JSON.stringify({code: "error_upload_pdf", tabId: tab.id}));
    }
  },

  // file:// ------------------------------------------------------------------
  {
    match: function(url) {
      return /^file:/.test(url);
    },
    validate: function() {
      return new Promise(function(fulfill) {
        brapi.extension.isAllowedFileSchemeAccess(fulfill);
      })
      .then(function(allowed) {
        if (!allowed) throw new Error(JSON.stringify({code: "error_file_access"}));
      })
    }
  },

  // Google Play Books ---------------------------------------------------------
  {
    match: function(url) {
      return /^https:\/\/play.google.com\/books\/reader/.test(url) || /^https:\/\/books.google.com\/ebooks\/app#reader/.test(url);
    },
    validate: function() {
      var perms = {
        permissions: ["webNavigation"],
        origins: ["https://books.googleusercontent.com/"]
      }
      return hasPermissions(perms)
        .then(function(has) {
          if (!has) throw new Error(JSON.stringify({code: "error_add_permissions", perms: perms}));
        })
    },
    getFrameId: function(frames) {
      var frame = frames.find(function(frame) {
        return frame.url.startsWith("https://books.googleusercontent.com/");
      })
      return frame && frame.frameId;
    },
    extraScripts: ["js/content/google-play-book.js"]
  },

  // OneDrive Doc -----------------------------------------------------------
  {
    match: function(url, title) {
      return url.startsWith("https://onedrive.live.com/edit.aspx") && title.includes(".docx");
    },
    validate: function() {
      var perms = {
        permissions: ["webNavigation"],
        origins: ["https://word-edit.officeapps.live.com/"]
      }
      return hasPermissions(perms)
        .then(function(has) {
          if (!has) throw new Error(JSON.stringify({code: "error_add_permissions", perms: perms}));
        })
    },
    getFrameId: function(frames) {
      var frame = frames.find(function(frame) {
        return frame.url.startsWith("https://word-edit.officeapps.live.com/");
      })
      return frame && frame.frameId;
    },
    extraScripts: ["js/content/onedrive-doc.js"]
  },

  // Chegg NEW --------------------------------------------------------------
  {
    match: function(url) {
      return /^https:\/\/www\.chegg\.com\/reader\//.test(url);
    },
    validate: function() {
      var perms = {
        permissions: ["webNavigation"],
        origins: ["https://ereader-web-viewer.chegg.com/"]
      }
      return hasPermissions(perms)
        .then(function(has) {
          if (!has) throw new Error(JSON.stringify({code: "error_add_permissions", perms: perms}));
        })
    },
    getFrameId: function(frames) {
      var frame = frames.find(function(frame) {
        return frame.url.startsWith("https://ereader-web-viewer.chegg.com/");
      })
      return frame && frame.frameId;
    },
    extraScripts: ["js/content/chegg-book.js"]
  },

  // VitalSource/Chegg ---------------------------------------------------------
  {
    match: function(url) {
      return /^https:\/\/\w+\.vitalsource\.com\/(#|reader)\/books\//.test(url) ||
        /^https:\/\/\w+\.chegg\.com\/(#|reader)\/books\//.test(url)
    },
    validate: function() {
      var perms = {
        permissions: ["webNavigation"],
        origins: ["https://jigsaw.vitalsource.com/", "https://jigsaw.chegg.com/"]
      }
      return hasPermissions(perms)
        .then(function(has) {
          if (!has) throw new Error(JSON.stringify({code: "error_add_permissions", perms: perms}));
        })
    },
    getTexts: function(tab) {
      function tryGetFrame(millis) {
        return getAllFrames(tab.id)
          .then(function(frames) {
            return frames.find(function(frame) {return frame.frameId && frame.parentFrameId});
          })
          .then(function(frame) {
            if (!frame && millis > 0) return waitMillis(500).then(tryGetFrame.bind(null, millis-500));
            else return frame;
          })
      }
      return tryGetFrame(5000)
        .then(function(frame) {
          if (frame) return getFrameTexts(tab.id, frame.frameId, ["js/jquery-3.1.1.min.js", "js/messaging.js", "js/content/vitalsource-book.js"]);
          else return null;
        })
    },
    extraScripts: ["js/content/vitalsource-book.js"]
  },

  // Liberty University ---------------------------------------------------------
  {
    match: function(url) {
      return url.startsWith("https://luoa.instructure.com/courses/")
    },
    validate: function() {
      var perms = {
        permissions: ["webNavigation"],
        origins: ["https://luoa-content.s3.amazonaws.com/"]
      }
      return hasPermissions(perms)
        .then(function(has) {
          if (!has) throw new Error(JSON.stringify({code: "error_add_permissions", perms: perms}))
        })
    },
    getFrameId: function(frames) {
      var frame = frames.find(function(frame) {
        return frame.url && frame.url.startsWith("https://luoa-content.s3.amazonaws.com/")
      })
      return frame && frame.frameId
    }
  },

  // EPUBReader ---------------------------------------------------------------
  {
    match: function(url) {
      return /^chrome-extension:\/\/jhhclmfgfllimlhabjkgkeebkbiadflb\/reader.html/.test(url);
    },
    validate: function() {
    },
    connect: function() {
      function call(method) {
        return new Promise(function(fulfill) {
          brapi.runtime.sendMessage("jhhclmfgfllimlhabjkgkeebkbiadflb", {name: method}, fulfill);
        })
      }
      function parseXhtml(xml) {
        var dom = new DOMParser().parseFromString(xml, "text/xml");
        var nodes = dom.body.querySelectorAll("h1, h2, h3, h4, h5, h6, p");
        return Array.prototype.slice.call(nodes)
          .map(function(node) {
            return node.innerText && node.innerText.trim().replace(/\r?\n/g, " ");
          })
          .filter(function(text) {
            return text;
          })
      }
      var currentPage = 0;
      peer = {
        invoke: function(method, index) {
          if (method == "getCurrentIndex") return Promise.resolve(currentPage);
          else if (method == "getTexts") {
            var promise = Promise.resolve({success: true, paged: true});
            for (; currentPage<index; currentPage++) promise = promise.then(call.bind(null, "pageForward"));
            for (; currentPage>index; currentPage--) promise = promise.then(call.bind(null, "pageBackward"));
            return promise
              .then(function(res) {
                if (!res.success) throw new Error("Failed to flip EPUB page");
                return res.paged ? call("getPageText") : {success: true, text: null};
              })
              .then(function(res) {
                if (!res.success) throw new Error("Failed to get EPUB text");
                return res.text && parseXhtml(res.text);
              })
          }
          else return Promise.reject(new Error("Bad method"));
        },
        disconnect: function() {}
      }
      return call("getDocumentInfo")
        .then(extraAction(function(res) {
          if (!res.success) throw new Error("Failed to get EPUB document info");
          if (res.lang && !/^[a-z][a-z](-[A-Z][A-Z])?$/.test(res.lang)) res.lang = null;
          if (res.lang) res.detectedLang = res.lang;   //prevent lang detection
        }))
    }
  },

  // LibbyApp ---------------------------------------------------------------
  {
    match: function(url) {
      return url.startsWith("https://libbyapp.com/open/")
    },
    validate: function() {
      var perms = {
        permissions: ["webNavigation"],
        origins: ["https://*.read.libbyapp.com/"]
      }
      return hasPermissions(perms)
        .then(function(has) {
          if (!has) throw new Error(JSON.stringify({code: "error_add_permissions", perms: perms}))
        })
    },
    getFrameId: function(frames) {
      var frame = frames.find(function(frame) {
        return frame.url && new URL(frame.url).hostname.endsWith(".read.libbyapp.com")
      })
      return frame && frame.frameId
    },
    extraScripts: ["js/content/libbyapp.js"]
  },

  // default -------------------------------------------------------------------
  {
    match: function() {
      return true;
    },
    validate: function() {
    }
  }
]