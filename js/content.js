
var brapi = (typeof chrome != 'undefined') ? chrome : (typeof browser != 'undefined' ? browser : {});

(function() {
  var port = brapi.runtime.connect({name: "ReadAloudContentScript"});
  var peer = new RpcPeer(new ExtensionMessagingPeer(port));
  peer.onInvoke = function(method) {
    var args = Array.prototype.slice.call(arguments, 1);
    var handlers = {
      getCurrentIndex: getCurrentIndex,
      getTexts: getTexts,
      haha: haha
    }
    if (handlers[method]) return handlers[method].apply(handlers, args);
    else console.error("Unknown method", method);
  }
  $(function() {
    peer.invoke("onReady", getInfo());
  })

  function getInfo() {
    return {
      url: location.href,
      title: document.title,
      lang: getLang(),
      requireJs: getRequireJs()
    }
  }

  function getLang() {
    var lang = document.documentElement.lang || $("html").attr("xml:lang");
    if (lang) lang = lang.split(",",1)[0].replace(/_/g, '-');
    if (lang == "en" || lang == "en-US") lang = null;    //foreign language pages often erronenously declare lang="en"
    return lang;
  }

  function getRequireJs() {
    if (typeof readAloudDoc != "undefined") return null;
    if (location.hostname == "docs.google.com") {
      if (/^\/presentation\/d\//.test(location.pathname)) return ["js/content/google-slides.js"];
      else if ($(".kix-appview-editor").length) return ["js/content/googleDocsUtil.js", "js/content/google-doc.js"];
      else if ($(".drive-viewer-paginated-scrollable").length) return ["js/content/google-drive-doc.js"];
      else return ["js/content/html-doc.js"];
    }
    else if (location.hostname == "drive.google.com") {
      if ($(".drive-viewer-paginated-scrollable").length) return ["js/content/google-drive-doc.js"];
      else return ["js/content/google-drive-preview.js"];
    }
    else if (/^read\.amazon\./.test(location.hostname)) return ["js/content/kindle-book.js"];
    else if (location.hostname.endsWith(".khanacademy.org")) return ["js/content/khan-academy.js"];
    else if (location.hostname == "www.ixl.com") return ["js/content/ixl.js"];
    else if (location.pathname.match(/pdf-upload\.html$/) || location.pathname.match(/\.pdf$/) || $("embed[type='application/pdf']").length) return ["js/content/pdf-doc.js"];
    else return ["js/content/html-doc.js"];
  }

  function getCurrentIndex() {
    if (getSelectedText()) return -100;
    else return readAloudDoc.getCurrentIndex();
  }

  function haha() {
    return Promise.resolve(readAloudDoc.haha());
  }

  function getTexts(index, quietly) {
    if (index < 0) {
      if (index == -100) return getSelectedText().split(paragraphSplitter);
      else return null;
    }
    else {
      return Promise.resolve(readAloudDoc.getTexts(index, quietly))
        .then(function(texts) {
          if (texts && Array.isArray(texts)) {
            texts = texts.map(removeLinks);
            // if (!quietly) console.log(texts.join("\n\n"));
          }
            texts.shift();
            let i;
            const removed_after_i = texts.findIndex((text) => text.includes("[Đăng ký dịch]"))
            if(removed_after_i !== -1){
                texts.length = removed_after_i;
            }

          for (i = 0; i < texts.length; i++) {
            texts[i] = texts[i]
                .replaceAll("＊", "")
                // .replaceAll("＋", "")
                .replaceAll("*", "")
                // .replaceAll("=", "")
                .replaceAll("“…”", "")
                .replaceAll("“….”", "")
                .replaceAll("~", "")
                .replaceAll("Lv.", "Level ")
                .replaceAll("ϊếŧ", "iết")
                .replaceAll("<", "")
                .replaceAll(">", "")
                .replaceAll("…", "")
                .replaceAll("#uk", "uck")
                .replaceAll("#k", "uck")
                .replaceAll("#t", "hit")
                .replaceAll("nevolved-", "nevolved ")
                .replaceAll("bachngocsach.com", "")
                .replaceAll("Bachngocsach.com", "")
                .replaceAll('. . .', "")
                // .replaceAll("TP", " TP")
                // .replaceAll("PT", " PT")
                // .replaceAll(" Lv ", " Level ")
                .replaceAll("-ssi", " si")
                .replaceAll("???", "")
                .replaceAll("○", "")
                .replaceAll("●", "")
                .replaceAll("_______________________________________________________________", "")
                .replaceAll("Translator: VALIANT", "")
                .replaceAll("<<", "")
                .replaceAll(">>", "")
                .replaceAll("_____________________", "")
                .replaceAll(" LV ", " Level ")
                .replaceAll("lightno", "")
                .replaceAll("velpub.c", "")
                .replaceAll("....", "")
                .replaceAll("___", "")
                .replaceAll("---", "")
                .replaceAll("T.r.u.y.ệtruyenfull.vn", "")
                .replaceAll("T.r.u.y.e.n.y.y", "")
                .replaceAll("Bạn đang đọc truyện được lấy tại", "")
                .replaceAll("chấm cơm", "")
                .replaceAll("Bạn đang đọc truyện tại", "")
                .replaceAll("Truyện FULL", "")
                .replaceAll("www.Truyện FULL", "")
                .replaceAll("Mark Witt ( Mã Khả Duy Đặc)", "Mark Witt")
                .replaceAll("Mã Khả Duy Đặc", "Mark Witt")
                .replaceAll("@#$%^&", "")
                .replaceAll("TruyệnFULL.vn", "")
                .replaceAll("www.", "")
                .replaceAll("Nguồn: this URL", "")
                .replaceAll("this URL", "")

                .replaceAll("more_novel", "")
                .replaceAll("New_chapters", "")
                .replaceAll("current_novel", "")
                .replaceAll("discover_new novels", "")
                .replaceAll("novel_reading", "")
                .replaceAll("better_reading", "")
                .replaceAll("better_user", "")
                .replaceAll("latest_episodes", "")
                .replaceAll("This_content", "")
                .replaceAll("can_find", "")
                .replaceAll("this_content", "")
                .replaceAll("this_chapter", "")
                .replaceAll("this_content", "")
                .replaceAll("platform_for", "")
                .replaceAll("advanced_reading", "")
                .replaceAll("novel_chapters", "")
                .replaceAll("published_here", "")
                .replaceAll("Ô...ô...ô...n...g!", "Ông ông!")
                .replaceAll("Truyện được dịch bởi: NTm.Group. Nếu bạn yêu thích truyện này có thể ủng hộ tác giả thay lời cảm ơn.", "")
                .replaceAll("Ủng Hộ Linh Thạch Tại Đây", "")
                .replaceAll("nhockd255", "")
            ;
          }
          return texts;
        })
    }
  }

  function getSelectedText() {
    return window.getSelection().toString().trim();
  }

  function removeLinks(text) {
    return text.replace(/https?:\/\/\S+/g, "this URL.");
  }
})()


//helpers --------------------------

var paragraphSplitter = /(?:\s*\r?\n\s*){2,}/;

function getInnerText(elem) {
  var text = elem.innerText;
  return text ? text.trim() : "";
}

function isNotEmpty(text) {
  return text;
}

function fixParagraphs(texts) {
  var out = [];
  var para = "";
  for (var i=0; i<texts.length; i++) {
    if (!texts[i]) {
      if (para) {
        out.push(para);
        para = "";
      }
      continue;
    }
    if (para) {
      if (/-$/.test(para)) para = para.substr(0, para.length-1);
      else para += " ";
    }
    para += texts[i].replace(/-\r?\n/g, "");
    if (texts[i].match(/[.!?:)"'\u2019\u201d]$/)) {
      out.push(para);
      para = "";
    }
  }
  if (para) out.push(para);
  return out;
}

function tryGetTexts(getTexts, millis) {
  return waitMillis(500)
    .then(getTexts)
    .then(function(texts) {
      if (texts && !texts.length && millis-500 > 0) return tryGetTexts(getTexts, millis-500);
      else return texts;
    })
}

function waitMillis(millis) {
  return new Promise(function(fulfill) {
    setTimeout(fulfill, millis);
  })
}

function loadPageScript(url) {
  if (!$("head").length) $("<head>").prependTo("html");
  $.ajax({
    dataType: "script",
    cache: true,
    url: url
  });
}

function simulateMouseEvent(element, eventName, coordX, coordY) {
  element.dispatchEvent(new MouseEvent(eventName, {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: coordX,
    clientY: coordY,
    button: 0
  }));
}

function simulateClick(elementToClick) {
  var box = elementToClick.getBoundingClientRect(),
      coordX = box.left + (box.right - box.left) / 2,
      coordY = box.top + (box.bottom - box.top) / 2;
  simulateMouseEvent (elementToClick, "mousedown", coordX, coordY);
  simulateMouseEvent (elementToClick, "mouseup", coordX, coordY);
  simulateMouseEvent (elementToClick, "click", coordX, coordY);
}

function getSettings(names) {
  return new Promise(function(fulfill) {
    brapi.storage.local.get(names, fulfill);
  });
}

function updateSettings(items) {
  return new Promise(function(fulfill) {
    brapi.storage.local.set(items, fulfill);
  });
}
