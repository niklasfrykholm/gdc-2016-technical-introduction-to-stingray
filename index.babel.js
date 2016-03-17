"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

window.state = window.state || {};
state.aspectRatio = state.aspectRatio || 16 / 9;
state.currentSlide = state.currentSlide || 0;
state.view = state.view || "slide";
state.isPlaying = typeof state.isPlaying == "undefined" ? true : state.isPlaying;
state.darkStyle = typeof state.darkStyle == "undefined" ? true : state.darkStyle;

// Applies the `style` object to the DOM `element`. Special keys:
// - `text`: Create a text node inside with value text.
// - `html`: Use value as innerHTML for node.
// - `attributes`: Apply supplied table as node attributes.
function applyStyle(e, style) {
    for (var k in style) {
        var v = style[k];
        if (k == "text") e.appendChild(document.createTextNode(v));else if (k == "html") e.innerHTML = v;else if (k == "attributes") {
            for (var a in v) {
                e[a] = v[a];
            }
        } else e.style[k] = v;
    }
}

// Create a DOM element with style(s) from arguments.
function e(tag) {
    var e = document.createElement(tag);

    for (var _len = arguments.length, styles = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        styles[_key - 1] = arguments[_key];
    }

    styles.forEach(function (style) {
        return applyStyle(e, style);
    });
    return e;
}

// Return true if we should play animations
function isPlaying() {
    return state.isPlaying && state.view == "slide";
}

// Render DOM for current state. This is called every time state changes.
function render() {
    var body = document.getElementsByTagName("body")[0];
    applyStyle(body, { margin: "0px", padding: "0px", backgroundColor: "#ccc",
        fontFamily: "arial, sans-serif",
        color: state.darkStyle ? "#fff" : "#000" });
    while (body.lastChild) {
        body.removeChild(body.lastChild);
    }var addDiv = function addDiv(body, arg) {
        return body.appendChild(e("div", { backgroundColor: "#fff", position: "absolute",
            overflow: "hidden", fontSize: arg.width / 32 }, arg));
    };

    var centerDiv = function centerDiv(body) {
        var r = state.aspectRatio;
        var win = { w: window.innerWidth, h: window.innerHeight };
        var sz = win.w / r > win.h ? { w: win.h * r, h: win.h } : { w: win.w, h: win.w / r };
        return addDiv(body, { height: sz.h, width: sz.w, top: (win.h - sz.h) / 2, left: (win.w - sz.w) / 2 });
    };

    var showHelp = function showHelp(body) {
        var w = window.innerWidth;
        var keyboardShortcuts = "<h1>Keyboard Shortcuts</h1>\n            <dl>\n                <dt>&lt;Left&gt; <span style=\"color: #fff\">or</span> k</dt>       <dd>: Previous slide</dd>\n                <dt>&lt;Right&gt; <span style=\"color: #fff\">or</span> j</dt>      <dd>: Next slide</dd>\n                <dt>&lt;space&gt;</dt>      <dd>: Toggle animations</dd>\n                <dt>m</dt>                  <dd>: Toggle aspect ratio (16:9/3:4)</dd>\n                <dt>v</dt>                  <dd>: Toggle view (slides/list)</dd>\n                <dt>t</dt>                  <dd>: Toggle style (dark/light)</dd>\n                <dt>r</dt>                  <dd>: Force reload</dd>\n                <dt>h <span style=\"color: #fff\">or</span> ?</dt>             <dd>: Toggle help</dd>\n            </dl>\n\n            <p>Made in <a href=\"https://github.com/niklasfrykholm/nfslides\" style=\"color: #99f\">nfslides</a></p>\n            ";
        var div = e("div", { html: keyboardShortcuts, fontSize: 13,
            width: 300, left: w - 400, top: 50, backgroundColor: "#000", color: "#fff", padding: 20,
            opacity: 0.8, borderRadius: "10px", position: "fixed" });
        [].forEach.call(div.getElementsByTagName("h1"), function (e) {
            return applyStyle(e, { marginBottom: "1em",
                fontSize: 15, borderBottomStyle: "solid", borderBottomWidth: "1px", paddingBottom: "0.5em" });
        });
        [].forEach.call(div.getElementsByTagName("dt"), function (e) {
            return applyStyle(e, { color: "#ff0", width: 100,
                float: "left", clear: "left", lineHeight: "2em", textAlign: "right", marginRight: "0.5em" });
        });
        [].forEach.call(div.getElementsByTagName("dd"), function (e) {
            return applyStyle(e, { lineHeight: "2em" });
        });
        body.appendChild(div);
    };

    state.canReload = true;
    state.currentSlide = Math.max(0, Math.min(state.currentSlide, slides.length - 1));
    for (var i = 0; i < slides.length; ++i) {
        slides[i].slideNumber = i + 1;
    }if (window.orientation !== undefined) state.view = Math.abs(window.orientation) === 90 ? "slide" : "list";

    var slide = null;
    var root = e("div", {});
    if (state.view == "list") {
        var w = 300 * state.aspectRatio,
            h = 300;
        var x = 0,
            y = 0;

        var _loop = function _loop(_i) {
            var div = addDiv(root, { left: x, top: y, width: w, height: h });
            (slides[_i].template || defaultTemplate)(div, slides[_i]);
            x += w + 10;
            if (x + w + 10 > window.innerWidth) {
                x = 0;y += h + 10;
            }
            div.onmousedown = function () {
                state.currentSlide = _i;state.view = "slide";render();
            };
        };

        for (var _i = 0; _i < slides.length; ++_i) {
            _loop(_i);
        }
    } else {
        slide = slides[state.currentSlide];
        (slide.template || defaultTemplate)(centerDiv(root), slide);
    }
    body.appendChild(root);

    if (state.showHelp) showHelp(body);

    body.onresize = render;
    body.onorientationchange = render;
    body.onkeydown = function (evt) {
        if (evt.keyCode == 37) state.currentSlide--;else if (evt.keyCode == 39) state.currentSlide++;else if (slide && slide.onkeydown) return slide.onkeydown(evt);else return;
        render();
    };
    body.onkeyup = function (evt) {
        if (slide && slide.onkeyup) return slide.onkeyup(evt);
    };
    body.onkeypress = function (evt) {
        var s = String.fromCharCode(evt.which || evt.keyCode);
        if (s == "m") state.aspectRatio = state.aspectRatio > 14 / 9 ? 12 / 9 : 16 / 9;else if (s == "v") state.view = state.view == "list" ? "slide" : "list";else if (s == "t") state.darkStyle = !state.darkStyle;else if (s == "?" || s == "h") state.showHelp = !state.showHelp;else if (s == " ") {
            state.isPlaying = !state.isPlaying;
        } else if (s == "k") state.currentSlide--;else if (s == "j") state.currentSlide++;else if (s == "r") {
            _require("index.js");window.setTimeout(render, 200);return;
        } else if (slide && slide.onkeypress) return slide.onkeypress(evt);else return;
        render();
    };
    body.ontouchend = function (evt) {
        if (evt.changedTouches[0].clientX > window.innerWidth / 2.0) state.currentSlide++;else state.currentSlide--;
        render();
    };
}

function _require(src) {
    var head = document.getElementsByTagName("head")[0];
    head.removeChild(head.appendChild(e("script", { attributes: { src: src + "?" + performance.now(), charset: "UTF-8" } })));
}

function reload() {
    if (!state.canReload) return;
    _require("index.js");
    render();
}

window.onload = render;
if (state.interval) window.clearInterval(state.interval);
if (window.location.href.startsWith("file://")) state.interval = window.setInterval(reload, 500);

// ------------------------------------------------------------
// Slide templates
// ------------------------------------------------------------

var baseStyle = { position: "absolute", overflow: "hidden", width: "100%", height: "100%" };

function renderMarkdown(md) {
    var unindent = function unindent(s) {
        s = s.replace(/^\s*\n/, ""); // Remove initial blank lines
        var indent = s.match(/^\s*/)[0];
        var matchIndent = new RegExp("^" + indent, "mg");
        return s.replace(matchIndent, "");
    };

    if (typeof marked === "undefined") {
        _require("marked.min.js");
        window.setTimeout(function () {
            setupSlides();render();
        }, 50);
        return "<h1>Loading Markdown...</h1>";
    }

    return marked(unindent(md));
}

function addPlayButton(div) {
    div.appendChild(e("div", { position: "absolute", width: "100%",
        text: "►", textAlign: "center",
        color: "#fff", top: "40%", fontSize: "2em" }));
}

function addElements(div, arg) {
    var background = arg.noBackground ? "none" : arg.caption && arg.captionStyle == "black" ? "none" : state.darkStyle ? "autodesk" : arg.caption ? "black" : "none";

    if (background == "autodesk") {
        div.appendChild(e("div", baseStyle, { width: "100%", height: "100%",
            backgroundImage: "url('img/autodesk-background.jpg')", backgroundSize: "cover",
            backgroundPosition: "center", backgroundRepeat: "no-repeat" }));

        if (!arg.imageUrl) {
            div.appendChild(e("div", baseStyle, { backgroundColor: "#fff",
                top: "93%", height: "10%" }));
            div.appendChild(e("div", baseStyle, { width: "13%", height: "7%",
                top: "93%", left: "86%",
                backgroundImage: "url('img/autodesk.png')", backgroundSize: "contain",
                backgroundPosition: "center", backgroundRepeat: "no-repeat" }));
            div.appendChild(e("div", baseStyle, { width: "30%", height: "7%",
                top: "95.5%", left: "2%", color: "#777", fontSize: "0.4em",
                html: "© 2016 Autodesk" }));
        }
    } else if (background == "black") div.style.backgroundColor = "#000";

    if (arg.color) div.style.color = arg.color;
    if (arg.imageUrl) div.appendChild(e("div", baseStyle, { width: "100%", height: "100%",
        backgroundImage: "url('" + arg.imageUrl + "')", backgroundSize: "contain",
        backgroundPosition: "center", backgroundRepeat: "no-repeat" }));
    if (arg.video) {
        var video = arg.video;
        if (isPlaying()) {
            var player = video.youtubeId ? e("object", baseStyle, { attributes: { data: "http://www.youtube.com/embed/" + video.youtubeId + "?autoplay=1&showinfo=0&controls=0" } }) : e("video", baseStyle, { attributes: { src: video.src, autoplay: true, loop: true } });
            div.appendChild(player);
            state.canReload = false;
        } else {
            if (video.youtubeId && !video.thumbnailSrc) video.thumbnailSrc = "http://img.youtube.com/vi/" + video.youtubeId + "/0.jpg";
            if (video.thumbnailSrc) div.appendChild(e("div", baseStyle, {
                backgroundImage: "url('" + video.thumbnailSrc + "')", backgroundSize: "cover",
                backgroundPosition: "center", backgroundRepeat: "no-repeat" }));
            addPlayButton(div);
        }
    }
    if (arg.canvas) {
        (function () {
            var sz = [div.style.width, div.style.height].map(function (e) {
                return parseFloat(e);
            });
            var w = sz[0],
                h = sz[1];
            var canvas = div.appendChild(e("canvas", baseStyle, { attributes: { width: w, height: h } }));
            var ctx = canvas.getContext("2d");
            ctx.translate(w / 2, h / 2);
            ctx.scale(h / 2000, h / 2000);
            if (arg.canvas(ctx, 0) == "animate") {
                if (isPlaying()) {
                    (function () {
                        var start = Date.now();
                        var animate = function animate() {
                            if (document.getElementsByTagName("canvas")[0] != canvas) return;
                            arg.canvas(ctx, (Date.now() - start) / 1000.0);
                            window.requestAnimationFrame(animate);
                        };
                        window.requestAnimationFrame(animate);
                        state.canReload = false;
                    })();
                } else addPlayButton(div);
            }
        })();
    }
    if (arg.title) div.appendChild(e("div", baseStyle, { fontSize: "2em",
        top: "30%", textAlign: "center", html: arg.title }));
    if (arg.subtitle) div.appendChild(e("div", baseStyle, { fontSize: "1em",
        top: "70%", textAlign: "center", html: arg.subtitle }));
    if (arg.h1) div.appendChild(e("div", baseStyle, { fontSize: "1.5em",
        top: "10%", textAlign: "center", html: arg.h1 }));
    if (arg.ul) {
        var c = e("div", baseStyle, { left: "5%", width: "90%", top: "20%" });
        c.appendChild(e("ul", { html: arg.ul }));
        div.appendChild(c);
    }
    if (arg.markdown) arg.html = renderMarkdown(arg.markdown);
    if (arg.html) div.appendChild(e("div", baseStyle, { left: "5%", width: "90%", top: "10%", html: arg.html }));
    if (arg.caption) div.appendChild(e("div", baseStyle, { fontSize: "1em",
        top: "90%", textAlign: "center", html: arg.caption,
        color: arg.captionStyle == "black" ? "#000" : "#fff",
        textShadow: arg.captionStyle == "black" ? "0px 0px 20px #fff" : "0px 0px 20px #000" }));

    [].forEach.call(div.getElementsByTagName("h1"), function (e) {
        return applyStyle(e, {
            textAlign: "left", fontSize: "1.3em", marginTop: 0, fontWeight: "bold" });
    });
    [].forEach.call(div.getElementsByTagName("li"), function (e) {
        return applyStyle(e, { marginBottom: "0.4em",
            marginTop: "0.4em" });
    });
    [].forEach.call(div.getElementsByTagName("pre"), function (e) {
        return applyStyle(e, { fontSize: "0.8em" });
    });
}

function defaultTemplate(div, arg) {
    addElements(div, arg);
}

function autoStyle(div, arg) {
    addElements(div, arg);

    var img = div.getElementsByTagName("img")[0];
    if (img && img.className === "background") {
        var url = img.src;
        img.parentNode.removeChild(img);
        var bg = [].filter.call(div.getElementsByTagName("div"), function (d) {
            return d.style.backgroundImage;
        })[0];
        if (bg) bg.style.backgroundImage = "url('" + url + "')";
    } else if (img) {
        var h1 = div.getElementsByTagName("h1")[0];
        var captionStyle = "white";
        if (img.alt.indexOf("#black") != -1) captionStyle = "black";

        while (div.lastChild) {
            div.removeChild(div.lastChild);
        }return addElements(div, { imageUrl: img.src, caption: h1.innerHTML,
            captionStyle: captionStyle, slideNumber: arg.slideNumber });
    }

    var h2 = div.getElementsByTagName("h2")[0];
    if (h2) {
        var h1 = div.getElementsByTagName("h1")[0];
        while (div.lastChild) {
            div.removeChild(div.lastChild);
        }return addElements(div, { title: h1.innerHTML, subtitle: h2.innerHTML, slideNumber: arg.slideNumber });
    }
}

function makeSlides(html) {
    return html.split("<h1").slice(1).map(function (h) {
        return "<h1" + h;
    }).map(function (h) {
        return { template: autoStyle, html: h };
    });
}

// ------------------------------------------------------------
// Slides
// ------------------------------------------------------------

function imageComparison(div, arg) {
    div.backgroundColor = "#000";
    div.id = "player";

    var b = div.appendChild(e("div", baseStyle, {
        backgroundImage: "url('" + arg.imgB + "')", backgroundSize: "auto " + div.style.height,
        backgroundRepeat: "no-repeat" }));
    var aw = div.appendChild(e("div", baseStyle, { width: "50%", borderRight: "3px solid white" }));
    var a = aw.appendChild(e("div", baseStyle, {
        backgroundImage: "url('" + arg.imgA + "')", backgroundSize: "auto " + div.style.height,
        backgroundRepeat: "no-repeat" }));

    b.appendChild(e("div", baseStyle, { fontSize: "1em",
        top: "1em", left: "-1em", textAlign: "right", html: arg.captionB, color: "#fff",
        textShadow: "0px 0px 20px #000", overflow: "visible" }));
    a.appendChild(e("div", baseStyle, { fontSize: "1em",
        top: "1em", left: "1em", textAlign: "left", html: arg.captionA, color: "#fff",
        textShadow: "0px 0px 20px #000", overflow: "visible", width: div.style.width }));

    if (isPlaying()) {
        (function () {
            var start = Date.now();
            var animate = function animate() {
                if (document.getElementById("player") != div) return;
                var split = Math.sin((Date.now() - start) / 1000) * 40 + 50;
                aw.style.width = split + "%";
                window.requestAnimationFrame(animate);
            };
            window.requestAnimationFrame(animate);
            state.canReload = false;
        })();
    } else addPlayButton(div);

    if (arg.caption) {
        div.appendChild(e("div", baseStyle, { fontSize: "1em",
            top: "90%", textAlign: "center", html: arg.caption,
            color: arg.captionStyle == "black" ? "#000" : "#fff",
            textShadow: arg.captionStyle == "black" ? "0px 0px 20px #fff" : "0px 0px 20px #000" }));
    }
}

function engine(div, arg) {
    arg.noBackground = true;
    var img = div.appendChild(e("img", baseStyle));
    img.src = arg.placeholder;

    addElements(div, arg);

    function toInt32(a, b, c, d) {
        return d << 24 | c << 16 | b << 8 | a;
    }

    function _getFrameHeader(frameBuffer) {
        return {
            size: toInt32(frameBuffer[0], frameBuffer[1], frameBuffer[2], frameBuffer[3]),
            width: toInt32(frameBuffer[4], frameBuffer[5], frameBuffer[6], frameBuffer[7]),
            height: toInt32(frameBuffer[8], frameBuffer[9], frameBuffer[10], frameBuffer[11]),
            bpp: toInt32(frameBuffer[12], frameBuffer[13], frameBuffer[14], frameBuffer[15]),
            colorBufferSize: toInt32(frameBuffer[16], frameBuffer[17], frameBuffer[18], frameBuffer[19]),
            compressedColorBufferSize: toInt32(frameBuffer[20], frameBuffer[21], frameBuffer[22], frameBuffer[23]),
            depthBufferSize: toInt32(frameBuffer[24], frameBuffer[25], frameBuffer[26], frameBuffer[27])
        };
    }

    function _getFrameData(frameBuffer) {
        var header = _getFrameHeader(frameBuffer);
        var colorBuffer = frameBuffer.subarray(header.size);
        return {
            header: header,
            colorBuffer: colorBuffer
        };
    }

    if (!isPlaying()) {
        addPlayButton(div);
        return;
    }

    var guid = "GUID-" + Math.random();
    var animate = function animate() {
        if (document.getElementsByTagName("img")[0] != img) {
            vp.onclose = null;
            vp.close();
        } else {
            vp.send(JSON.stringify({
                msg: 0, // Request frame
                id: guid, // GUID
                type: 3, // STREAMED_COMPRESSED
                handle: 1,
                options: { quality: 90, dctMethod: 1 } }));
            // JDCT_IFAST
            window.requestAnimationFrame(animate);
        }
    };

    var vp = new WebSocket(arg.viewportProvider);
    vp.binaryType = "arraybuffer";
    vp.onclose = function (e) {
        state.isPlaying = false;
        render();
    };
    vp.onopen = function (e) {
        window.requestAnimationFrame(animate);
    };
    vp.onmessage = function (e) {
        if (e.data === "Frame not ready") {
            return;
        }
        var frameBuffer = new Uint8Array(e.data);
        var frame = _getFrameData(frameBuffer);
        var blob = new Blob([frame.colorBuffer], { type: 'image/jpeg' });
        var url = URL.createObjectURL(blob);
        img.src = url;
        if (state.lastUrl) URL.revokeObjectURL(state.lastUrl);
        state.lastUrl = url;
    };

    var cs = new WebSocket(arg.consoleServer);
    cs.binaryType = "arraybuffer";
    var input = { move: { x: 0, y: 0, z: 0 }, pan: { x: 0, y: 0, z: 0 } };
    var m = input.move;
    var p = input.pan;
    var down = {};
    var lua = function lua(s) {
        cs.send(JSON.stringify({ type: "script", script: s }));
    };
    var sendInput = function sendInput() {
        lua("Sample.Character.external_input = {move = Vector3Box(" + m.x + "," + m.y + "," + m.z + "),\n            pan = Vector3Box(" + p.x + ", " + p.y + ", " + p.z + ")}");
    };
    if (!arg.onkeydown) {
        arg.onkeydown = function (evt) {
            var s = String.fromCharCode(evt.which || evt.keyCode);
            if (down[s]) return;
            down[s] = true;
            if (s == "D") m.x += 1.0;else if (s == "A") m.x -= 1.0;else if (s == "W") m.y += 1.0;else if (s == "S") m.y -= 1.0;else if (s == "Q") p.x -= 1.0;else if (s == "E") p.x += 1.0;
            sendInput();
        };
        arg.onkeyup = function (evt) {
            var s = String.fromCharCode(evt.which || evt.keyCode);
            if (!down[s]) return;
            down[s] = false;
            if (s == "D") m.x -= 1.0;else if (s == "A") m.x += 1.0;else if (s == "W") m.y -= 1.0;else if (s == "S") m.y += 1.0;else if (s == "Q") p.x += 1.0;else if (s == "E") p.x -= 1.0;
            sendInput();
        };
    }

    state.canReload = false;
}

function autodeskTitle(div, arg) {
    // 15, 27, 18, 13

    var common = { textAlign: "left", left: "7%",
        color: state.darkStyle ? "#fff" : "#000" };

    if (state.darkStyle) {
        div.appendChild(e("div", baseStyle, { width: "100%", height: "100%",
            backgroundImage: "url('img/stingray.jpg')", backgroundSize: "cover",
            backgroundPosition: "center", backgroundRepeat: "no-repeat" }));
        div.appendChild(e("div", baseStyle, { backgroundColor: "#fff",
            top: "93%", height: "10%" }));
        div.appendChild(e("div", baseStyle, { width: "13%", height: "7%",
            top: "93%", left: "86%",
            backgroundImage: "url('img/autodesk.png')", backgroundSize: "contain",
            backgroundPosition: "center", backgroundRepeat: "no-repeat" }));
    }

    if (arg.event) div.appendChild(e("div", baseStyle, common, { fontSize: "0.8em", top: "50%", html: arg.event }));
    if (arg.title) div.appendChild(e("div", baseStyle, common, { fontSize: "1.4em", top: "56%", html: arg.title, fontWeight: "bold" }));
    if (arg.presenterName) div.appendChild(e("div", baseStyle, common, { fontSize: "1em", top: "76%", html: arg.presenterName }));
    if (arg.presenterTitle) div.appendChild(e("div", baseStyle, common, { fontSize: "0.6em", top: "84%", textAlign: "left", html: arg.presenterTitle }));
    if (arg.helpText) div.appendChild(e("div", baseStyle, common, { fontSize: "0.4em", left: "-1em", top: "88%", textAlign: "right", html: arg.helpText }));
}

function setupSlides() {
    window.slides = [{
        template: autodeskTitle,
        event: "GDC 2016",
        title: "Technical Introduction to the<br>Stingray Game Engine",
        presenterName: "Niklas Frykholm @niklasfrykholm",
        presenterTitle: "System Architect",
        helpText: "Press <span style=\"color: #ff0\">h</span> for help"
    }].concat(_toConsumableArray(makeSlides(renderMarkdown("\n# The Stingray Philosophy\n\n> What are the core technical values behind Stingray, and how have those values\n> guided the development of the engine?\n\n# Stingray\n\n![](img/editor.jpg)\n\n# Stingray Quick Background\n\n<img class=\"background\" src=\"img/autodesk-background-games.jpg\"/>\n\n* Multiplatform game engine\n    * Windows, XB1, PS4, Android, iOS, etc\n* Generic: no special game types\n* Created by me and Tobias Persson in 2009\n* Purchased by Autodesk in 2014\n\n# Stingray's Technical Vision\n\n* Data-Driven\n* Lightweight\n* Quick Iterations\n* High Performance\n\n# Philosophy #1: Data-Driven\n\n> Engine behaviors should not be hard-written in code. Instead they should\n> be controlled by data files that can be changed to produce different\n> behavior.\n\n# Why?\n\n* Flexibility\n* Don't lock the engine into specific use patterns\n* Adapt to each game's and platform's specific needs\n* Radical rapid prototyping\n\n# Making the Engine Data-Driven\n\n* *Everything* controlled through JSON files\n    * Human readable\n    * Mergeable\n* No game specific concepts in the engine:\n    * Weapons, characters, inventory only exist in the gameplay layer\n\n# Making the Engine Data-Driven (2)\n\n* Generic, reusable mechanisms instead of hard-coded:\n    * NO: Foot step animation links to sound\n    * YES: Generic animation trigger support\n    * NO: Special \"blend shape\" curves\n    * YES: Arbitrary curves can feed other systems\n* Don't limit the user!\n\n# Example: Streaming\n\n* Different games can have different streaming needs:\n    * Open world: 2D grid\n    * Racing: Along track\n    * RPG: Specific events & enemies\n* Generic mechanism:\n    * Put resources in packages\n    * User controls stream in/out of packages\n\n# Key Component: Scripting\n\n* Gameplay can be written in Lua\n* Allows code to be treated as data\n* Complexity can be moved from the engine code to the gameplay code\n\n# Key Component: Flow\n\n![](img/flow.png)\n\n# Key Component: Flow\n\n* Extend the benefits of scripting to non-programmers:\n    * Artists, level designers\n* Data-driven:\n    * Extensible from C or Lua\n\n# Being Radically Data-Driven\n\n* At every step, work to make the engine more data-driven\n* Example: Renderer\n    * Entire pipe is configurable\n    * Layers, shaders, post-effects, etc\n    * Switch between forward or deferred rendering\n\n# Benefits: Different Games Running in the Same Engine\n\n![](img/games.jpg)\n    "))), [{ template: imageComparison,
        captionA: "Android",
        captionB: "PC",
        imgA: "img/hamilton-android.jpg",
        imgB: "img/hamilton-pc.jpg",
        caption: "Benefits: Same Game Running on Different Platforms"
    }], _toConsumableArray(makeSlides(renderMarkdown("\n# Not Locked to a Domain\n\n* Engine can be used for other purposes\n\n# Architecture & Manufacturing\n\n![](img/expo.jpg)\n\n# Architecture & Manufacturing\n\n![](img/archviz.jpg)\n\n# Philosophy #2: Lightweight\n\n> The engine source code should be as small and simple as possible.\n\n# Why?\n\n* Code is not an asset, code is a liability\n* Smaller and simpler code is easier to:\n    * Understand\n    * Improve\n    * Extend\n\n# Keeping an Engine Light-Weight\n\n* Lots of people want to add \"just one more thing\"\n* The price of simplicity is eternal vigilance\n    * Remove code and simplify systems\n* Total source code in core engine: ~400 000 lines\n\n# Key Component: Plugin System\n\n* Allows the engine to be extended with DLLs\n* Lets us add functionality without bloating the engine\n* Both internally and externally\n    * HumanIK, Oculus, Navigation, Morph Target, Scaleform, SteamVR, Wwise\n* C ABI interface: Plugins can be written in any language\n\n# Not Just About Size\n\n* More important is conceptual simplicity\n* Minimize dependencies between components\n\n<img src=\"img/spaghetti.png\" class=\"background\"/>\n\n# Conceptual Simplicity: Just Say No\n\n* No boost, no STL, no exceptions\n* No deep inheritance hierarchies\n* No global serialization or reference counting\n* No magic macros\n\n# Saying Yes\n\n* Limited set of core data structures and concepts:\n    * Focused on data layout and data flow\n* Use established standards when they are simple:\n    * YES: JSON, Web sockets, Lua\n    * NO: XML, Corba, PHP\n\n# Only Five Basic Collection Classes\n\n* Array\n* Vector\n* HashSet\n* HashMap\n* Deque\n\n# Strings\n\n* String *input* is always `const char *`\n* When you need a dynamically growing string (rarely):\n\n```\nstruct DynamicString {\n    Array<char> buffer;\n    const char *c_str() {\n        b.push_back(0);\n        b.pop_back();\n        return b.begin();\n    }\n};\n```\n\n# Benefits\n\n* Less effort required to understand the code\n* Faster to fix bugs, improve performance, ...\n* Customers have a decent chance of understanding the code:\n    * Finding root cause of issues\n    * Extending with their own functionality\n* Combining simple things makes cool things possible\n\n    "))), [{
        template: engine,
        viewportProvider: "ws://localhost:15500",
        consoleServer: "ws://localhost:14100",
        placeholder: "img/engine-placeholder.png",
        caption: "Benefits: Engine running inside slideshow"
    }, {
        color: "#fff",
        template: engine,
        viewportProvider: "ws://localhost:15500",
        consoleServer: "ws://localhost:14100",
        placeholder: "img/engine-placeholder.png",
        markdown: "\n            # Wait, what now?\n\n            * This presentation is a JavaScript program (~500 lines)\n            * Stingray has a web socket interface\n            * The presentation uses Stingray's built-in screen capture technology to capture\n                rendered frames\n        "
    }], _toConsumableArray(makeSlides(renderMarkdown("\n# Philosophies Working Together\n\n* Data-Driven:\n    * Allows the code to be simpler, because complexities can\n      be moved to the data layer\n\n# Philosophy #3: Quick Iterations\n\n> When you change something, you should be able to see the effects of that\n> change immediately, on the actual hardware where your final game will run.\n\n# Why?\n\n* Immediate interaction leads to higher quality\n* Everybody should be aware of the real status of the project:\n    * How does it look?\n    * How does it play?\n\n# Making Quick Iterations Possible\n\n* Hot-reload support in *all* systems, on *all* platforms\n* Reduce the time required for compiling and reloading:\n    * Incremental\n    * Avoid touching disk\n    * ~100 ms\n\n# Gameplay\n\n* All types of code can be hot reloaded while a game is playing:\n    * Lua\n    * Flow\n    * Plug-ins\n* On any target platform\n\n# Benefits: Editor Linking\n\n![#black](img/editor-linking.png)\n\n# Philosophies Working Together\n\n* Data-Driven:\n    * Since *everything* is data-driven, *everything* can be hot-reloaded,\n      including code and render configurations\n* Lightweight:\n    * Simple code leads to fast compile times (< 1 minute) which leads to\n      quick iterations over engine code\n\n# Philosophy #4: High Performance\n\n> The engine should not compromise on performance.\n\n# Why?\n\n* Game engine technology is *about* performance\n\n# Making High Performance Possible\n\n* Don't abstract away the nature of the hardware\n    * Instead: provide multiple paths\n* Avoid hidden costs: only pay for what you use\n* Cache performance: data-oriented programming\n* Multithreading\n* Profile friendly coding, update systems, not objects\n\n# Philosophies Working Together\n\n* Data-Driven:\n    * Engine can be configured to take advantage of each platform's strength\n* Lightweight:\n    * Simplicity in code and data flows leads to code that is easier to\n      parallelize and optimize\n\n# Philosophies Working Together (2)\n\n* Quick Iterations:\n    * Users are always aware of real hardware performance and can experiment\n      quickly with optimizations\n\n# Conclusion\n\n> A strong technical vision has kept the engine on track and opened up new\n> ideas that we did not originally think possible.\n\n# Questions?\n\n## Reach me at: @niklasfrykholm\n\n    "))));
}

setupSlides();

