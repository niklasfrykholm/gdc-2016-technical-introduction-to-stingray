"use strict";

window.state = window.state || {};
state.aspectRatio = state.aspectRatio || (16/9);
state.currentSlide = state.currentSlide || 0;
state.view = state.view || "slide";
state.isPlaying = typeof state.isPlaying == "undefined" ? true : state.isPlaying;
state.darkStyle = typeof state.darkStyle == "undefined" ? true : state.darkStyle;

// Applies the `style` object to the DOM `element`. Special keys:
// - `text`: Create a text node inside with value text.
// - `html`: Use value as innerHTML for node.
// - `attributes`: Apply supplied table as node attributes.
function applyStyle(e, style)
{
    for (let k in style) {
        const v = style[k];
        if (k == "text")        e.appendChild(document.createTextNode(v));
        else if (k == "html")   e.innerHTML = v;
        else if (k == "attributes") {for (let a in v) e[a] = v[a];}
        else                    e.style[k] = v;
    }
}

// Create a DOM element with style(s) from arguments.
function e(tag, ...styles)
{
    const e = document.createElement(tag);
    styles.forEach(style => applyStyle(e, style));
    return e;
}

// Return true if we should play animations
function isPlaying()
{
    return state.isPlaying && state.view == "slide";
}

// Render DOM for current state. This is called every time state changes.
function render()
{
    const body = document.getElementsByTagName("body")[0];
    applyStyle(body, {margin: "0px", padding: "0px", backgroundColor: "#ccc",
        fontFamily: "arial, sans-serif",
        color: state.darkStyle ? "#fff" : "#000"});
    while (body.lastChild) body.removeChild(body.lastChild);

    const addDiv = function(body, arg)
    {
        return body.appendChild( e("div", {backgroundColor: "#fff", position: "absolute",
            overflow: "hidden", fontSize: arg.width/32}, arg) );
    };

    const centerDiv = function(body)
    {
        const r = state.aspectRatio;
        const win = {w: window.innerWidth, h: window.innerHeight};
        const sz = win.w / r > win.h ? {w: win.h * r, h: win.h} : {w: win.w, h: win.w / r};
        return addDiv(body, {height: sz.h, width: sz.w, top: (win.h - sz.h)/2, left: (win.w - sz.w)/2});
    };

    const showHelp = function(body)
    {
        const w = window.innerWidth;
        const keyboardShortcuts =
            `<h1>Keyboard Shortcuts</h1>
            <dl>
                <dt>&lt;Left&gt; <span style="color: #fff">or</span> k</dt>       <dd>: Previous slide</dd>
                <dt>&lt;Right&gt; <span style="color: #fff">or</span> j</dt>      <dd>: Next slide</dd>
                <dt>&lt;space&gt;</dt>      <dd>: Toggle animations</dd>
                <dt>m</dt>                  <dd>: Toggle aspect ratio (16:9/3:4)</dd>
                <dt>v</dt>                  <dd>: Toggle view (slides/list)</dd>
                <dt>t</dt>                  <dd>: Toggle style (dark/light)</dd>
                <dt>r</dt>                  <dd>: Force reload</dd>
                <dt>h <span style="color: #fff">or</span> ?</dt>             <dd>: Toggle help</dd>
            </dl>

            <p>Made in <a href="https://github.com/niklasfrykholm/nfslides" style="color: #99f">nfslides</a></p>
            `;
        const div = e("div", {html: keyboardShortcuts, fontSize: 13,
            width: 300, left: w-400, top: 50, backgroundColor: "#000", color: "#fff", padding: 20,
            opacity: 0.8, borderRadius: "10px", position: "fixed"});
        [].forEach.call(div.getElementsByTagName("h1"), e => applyStyle(e, {marginBottom: "1em",
            fontSize: 15, borderBottomStyle: "solid", borderBottomWidth: "1px", paddingBottom: "0.5em"}));
        [].forEach.call(div.getElementsByTagName("dt"), e => applyStyle(e, {color: "#ff0", width: 100,
            float: "left", clear: "left", lineHeight: "2em", textAlign: "right", marginRight: "0.5em"}));
        [].forEach.call(div.getElementsByTagName("dd"), e => applyStyle(e, {lineHeight: "2em"}));
        body.appendChild(div);
    };

    state.canReload = true;
    state.currentSlide = Math.max(0, Math.min(state.currentSlide, slides.length-1));
    for (let i=0; i<slides.length; ++i)
        slides[i].slideNumber = i+1;
    if (window.orientation !== undefined)
        state.view = Math.abs(window.orientation) === 90 ? "slide" : "list";

    let slide = null;
    const root = e("div", {});
    if (state.view == "list") {
        const w = 300 * state.aspectRatio, h = 300;
        let x = 0, y = 0;
        for (let i=0; i<slides.length; ++i) {
            const div = addDiv(root, {left: x, top: y, width: w, height: h});
            (slides[i].template || defaultTemplate)(div, slides[i]);
            x += w + 10;
            if (x + w + 10 > window.innerWidth)
                {x=0; y += h + 10;}
            div.onmousedown = () => {state.currentSlide = i; state.view = "slide"; render();};
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
        if (evt.keyCode == 37)          state.currentSlide--;
        else if (evt.keyCode == 39)     state.currentSlide++;
        else if (slide && slide.onkeydown) return slide.onkeydown(evt);
        else return;
        render();
    };
    body.onkeyup = function (evt) {
        if (slide && slide.onkeyup) return slide.onkeyup(evt);
    };
    body.onkeypress = function (evt) {
        const s = String.fromCharCode(evt.which || evt.keyCode)
        if (s == "m")                   state.aspectRatio = state.aspectRatio > 14/9 ? 12/9 : 16/9;
        else if (s == "v")              state.view = state.view == "list" ? "slide" : "list";
        else if (s == "t")              state.darkStyle = !state.darkStyle;
        else if (s == "?" || s == "h")  state.showHelp = !state.showHelp;
        else if (s == " ")              {state.isPlaying = !state.isPlaying;}
        else if (s == "k")              state.currentSlide--;
        else if (s == "j")              state.currentSlide++;
        else if (s == "r")              {require("index.js"); window.setTimeout(render, 200); return;}
        else if (slide && slide.onkeypress) return slide.onkeypress(evt)
        else return;
        render();
    };
    body.ontouchend = function (evt) {
        if (evt.changedTouches[0].clientX > (window.innerWidth/2.0)) state.currentSlide++;
        else state.currentSlide--;
        render();
    };
}

function require(src)
{
    const head = document.getElementsByTagName("head")[0];
    head.removeChild(head.appendChild(e("script",
        {attributes: {src: `${src}?${performance.now()}`, charset: "UTF-8"}})));
}

function reload()
{
    if (!state.canReload) return;
    require("index.js");
    render();
}

window.onload = render;
if (state.interval) window.clearInterval(state.interval);
if (window.location.href.startsWith("file://"))
    state.interval = window.setInterval(reload, 500);

// ------------------------------------------------------------
// Slide templates
// ------------------------------------------------------------

var baseStyle = {position: "absolute", overflow: "hidden", width: "100%", height: "100%"};

function renderMarkdown(md)
{
    const unindent = function(s) {
        s = s.replace(/^\s*\n/, ""); // Remove initial blank lines
        const indent = s.match(/^\s*/)[0];
        const matchIndent = new RegExp(`^${indent}`, "mg");
        return s.replace(matchIndent, "");
    };

    if (typeof marked === "undefined") {
        require("marked.min.js");
        window.setTimeout(() => {setupSlides(); render();}, 50);
        return "<h1>Loading Markdown...</h1>";
    }

    return marked(unindent(md));
}

function addPlayButton(div)
{
    div.appendChild( e("div", {position: "absolute", width: "100%",
        text: "►", textAlign: "center",
        color: "#fff", top: "40%", fontSize: "2em"}) );
}

function addElements(div, arg)
{
    const background =
        arg.noBackground ? "none" :
        arg.caption && arg.captionStyle == "black" ? "none" :
        state.darkStyle ? "autodesk" :
        arg.caption ? "black" : "none";

    if (background == "autodesk") {
        div.appendChild( e("div", baseStyle, {width: "100%", height: "100%",
            backgroundImage: `url('img/autodesk-background.jpg')`, backgroundSize: "cover",
            backgroundPosition: "center", backgroundRepeat: "no-repeat"}));

        if (!arg.imageUrl) {
            div.appendChild( e("div", baseStyle, {backgroundColor: "#fff",
                top: "93%", height: "10%"}));
            div.appendChild( e("div", baseStyle, {width: "13%", height: "7%",
                top: "93%", left: "86%",
                backgroundImage: `url('img/autodesk.png')`, backgroundSize: "contain",
                backgroundPosition: "center", backgroundRepeat: "no-repeat"}));
            div.appendChild( e("div", baseStyle, {width: "30%", height: "7%",
                top: "95.5%", left: "2%", color: "#777", fontSize: "0.4em",
                html: "© 2016 Autodesk"}));
        }
    } else if (background == "black")
        div.style.backgroundColor = "#000";

    if (arg.color)
        div.style.color = arg.color;
    if (arg.imageUrl)
        div.appendChild( e("div", baseStyle, {width: "100%", height: "100%",
            backgroundImage: `url('${arg.imageUrl}')`, backgroundSize: "contain",
            backgroundPosition: "center", backgroundRepeat: "no-repeat"}));
    if (arg.video) {
        const video = arg.video;
        if (isPlaying()) {
            const player = video.youtubeId
                ? e("object", baseStyle, {attributes: {data: `http://www.youtube.com/embed/${video.youtubeId}?autoplay=1&showinfo=0&controls=0`}})
                : e("video", baseStyle, {attributes: {src: video.src, autoplay: true, loop: true}}) ;
            div.appendChild(player);
            state.canReload = false;
        } else {
            if (video.youtubeId && !video.thumbnailSrc)
                video.thumbnailSrc = `http://img.youtube.com/vi/${video.youtubeId}/0.jpg`;
            if (video.thumbnailSrc)
                div.appendChild( e("div", baseStyle, {
                    backgroundImage: `url('${video.thumbnailSrc}')`, backgroundSize: "cover",
                    backgroundPosition: "center", backgroundRepeat: "no-repeat"}));
            addPlayButton(div);
        }
    }
    if (arg.canvas) {
        const sz = [div.style.width, div.style.height].map(e => parseFloat(e));
        const w = sz[0], h = sz[1];
        const canvas = div.appendChild(e("canvas", baseStyle, {attributes: {width:w, height:h}}));
        const ctx = canvas.getContext("2d");
        ctx.translate(w/2, h/2);
        ctx.scale(h/2000, h/2000);
        if (arg.canvas(ctx, 0) == "animate") {
            if (isPlaying()) {
                const start = Date.now();
                const animate = function() {
                    if (document.getElementsByTagName("canvas")[0] != canvas) return;
                    arg.canvas(ctx, (Date.now() - start)/1000.0);
                    window.requestAnimationFrame(animate);
                };
                window.requestAnimationFrame(animate);
                state.canReload = false;
            } else
                addPlayButton(div);
        }
    }
    if (arg.title)
        div.appendChild( e("div", baseStyle, {fontSize: "2em",
            top: "30%", textAlign: "center", html: arg.title}) );
    if (arg.subtitle)
        div.appendChild( e("div", baseStyle, {fontSize: "1em",
            top: "70%", textAlign: "center", html: arg.subtitle}) );
    if (arg.h1)
        div.appendChild( e("div", baseStyle, {fontSize: "1.5em",
            top: "10%", textAlign: "center", html: arg.h1} ));
    if (arg.ul) {
        const c = e("div", baseStyle, {left: "5%", width: "90%", top: "20%"});
        c.appendChild( e("ul", {html: arg.ul}) );
        div.appendChild(c);
    }
    if (arg.markdown)
        arg.html = renderMarkdown(arg.markdown);
    if (arg.html)
        div.appendChild( e("div", baseStyle, {left: "5%", width: "90%", top: "10%", html: arg.html}) );
    if (arg.caption)
        div.appendChild( e("div", baseStyle, {fontSize: "1em",
            top: "90%", textAlign: "center", html: arg.caption,
            color: arg.captionStyle == "black" ? "#000" : "#fff",
            textShadow: arg.captionStyle == "black" ? "0px 0px 20px #fff" : "0px 0px 20px #000"} ));

    [].forEach.call(div.getElementsByTagName("h1"), e => applyStyle(e, {
        textAlign: "left", fontSize: "1.3em", marginTop: 0, fontWeight: "bold"}));
    [].forEach.call(div.getElementsByTagName("li"), e => applyStyle(e, {marginBottom: "0.4em",
        marginTop: "0.4em"}));
    [].forEach.call(div.getElementsByTagName("pre"), e => applyStyle(e, {fontSize: "0.8em"}));
}

function defaultTemplate(div, arg)
{
    addElements(div, arg);
}

function autoStyle(div, arg)
{
    addElements(div, arg);

    var img = div.getElementsByTagName("img")[0];
    if (img && img.className === "background") {
        var url = img.src;
        img.parentNode.removeChild(img);
        var bg = [].filter.call(div.getElementsByTagName("div"), d => d.style.backgroundImage)[0];
        if (bg)
            bg.style.backgroundImage = `url('${url}')`;

    } else if (img) {
        var h1 = div.getElementsByTagName("h1")[0];
        let captionStyle = "white";
        if (img.alt.indexOf("#black") != -1)
            captionStyle = "black";

        while (div.lastChild) div.removeChild(div.lastChild);
        return addElements(div, {imageUrl: img.src, caption: h1.innerHTML,
            captionStyle: captionStyle, slideNumber: arg.slideNumber});
    }

    var h2 = div.getElementsByTagName("h2")[0];
    if (h2) {
        var h1 = div.getElementsByTagName("h1")[0];
        while (div.lastChild) div.removeChild(div.lastChild);
        return addElements(div, {title: h1.innerHTML, subtitle: h2.innerHTML, slideNumber: arg.slideNumber});
    }
}

function makeSlides(html)
{
    return html.split("<h1").slice(1)
        .map(h => "<h1" + h)
        .map(h => {return {template: autoStyle, html: h}});
}

// ------------------------------------------------------------
// Slides
// ------------------------------------------------------------

function imageComparison(div, arg)
{
    div.backgroundColor = "#000";
    div.id = "player";

    var b = div.appendChild(e("div", baseStyle, {
        backgroundImage: `url('${arg.imgB}')`, backgroundSize: `auto ${div.style.height}`,
        backgroundRepeat: "no-repeat"}));
    var aw = div.appendChild(e("div", baseStyle, {width: "50%", borderRight: "3px solid white"}));
    var a = aw.appendChild(e("div", baseStyle, {
        backgroundImage: `url('${arg.imgA}')`, backgroundSize: `auto ${div.style.height}`,
        backgroundRepeat: "no-repeat"}));

    b.appendChild( e("div", baseStyle, {fontSize: "1em",
        top: "1em", left: "-1em", textAlign: "right", html: arg.captionB, color: "#fff",
        textShadow: "0px 0px 20px #000", overflow: "visible"} ));
    a.appendChild( e("div", baseStyle, {fontSize: "1em",
        top: "1em", left: "1em", textAlign: "left", html: arg.captionA, color: "#fff",
        textShadow: "0px 0px 20px #000", overflow: "visible", width: div.style.width} ));

    if (isPlaying()) {
        const start = Date.now();
        const animate = function() {
            if (document.getElementById("player") != div) return;
            var split = Math.sin((Date.now() - start)/1000) * 40 + 50;
            aw.style.width = `${split}%`;
            window.requestAnimationFrame(animate);
        };
        window.requestAnimationFrame(animate);
        state.canReload = false;
    } else
        addPlayButton(div);

    if (arg.caption) {
        div.appendChild( e("div", baseStyle, {fontSize: "1em",
            top: "90%", textAlign: "center", html: arg.caption,
            color: arg.captionStyle == "black" ? "#000" : "#fff",
            textShadow: arg.captionStyle == "black" ? "0px 0px 20px #fff" : "0px 0px 20px #000"} ));
    }
}

function engine(div, arg)
{
    arg.noBackground = true;
    let img = div.appendChild( e("img", baseStyle) );
    img.src = arg.placeholder;

    addElements(div, arg);

    function toInt32(a, b, c, d) {
        return (d << 24) | (c << 16) | (b << 8) | a;
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
            header:header,
            colorBuffer: colorBuffer
        };
    }

    if (!isPlaying()) {
        addPlayButton(div);
        return;
    }

    let guid = "GUID-" + Math.random();
    const animate = function() {
        if (document.getElementsByTagName("img")[0] != img) {
            vp.onclose = null;
            vp.close();
        } else {
            vp.send(JSON.stringify({
                msg: 0, // Request frame
                id: guid, // GUID
                type: 3, // STREAMED_COMPRESSED
                handle: 1,
                options: {quality: 90, dctMethod: 1}, // JDCT_IFAST
            }));
            window.requestAnimationFrame(animate);
        }
    };

    var vp = new WebSocket(arg.viewportProvider)
    vp.binaryType = "arraybuffer";
    vp.onclose = (e) => {
        state.isPlaying = false;
        render();
    };
    vp.onopen = (e) => {
        window.requestAnimationFrame(animate);
    };
    vp.onmessage = (e) => {
        if (e.data === "Frame not ready") {return;}
        var frameBuffer = new Uint8Array(e.data);
        var frame = _getFrameData(frameBuffer);
        var blob = new Blob([frame.colorBuffer], {type: 'image/jpeg'});
        var url = URL.createObjectURL(blob);
        img.src = url;
        if (state.lastUrl)
            URL.revokeObjectURL(state.lastUrl);
        state.lastUrl = url;
    };

    var cs = new WebSocket(arg.consoleServer);
    cs.binaryType = "arraybuffer";
    let input = {move: {x: 0, y: 0, z: 0}, pan: {x: 0, y: 0, z: 0}};
    let m = input.move;
    let p = input.pan;
    let down = {};
    const lua = function (s) {
        cs.send(JSON.stringify({type: "script", script: s}));
    };
    let sendInput = function() {
        lua(`Sample.Character.external_input = {move = Vector3Box(${m.x},${m.y},${m.z}),
            pan = Vector3Box(${p.x}, ${p.y}, ${p.z})}`);
    };
    if (!arg.onkeydown) {
        arg.onkeydown = function(evt) {
            const s = String.fromCharCode(evt.which || evt.keyCode);
            if (down[s]) return;
            down[s] = true;
            if (s == "D") m.x += 1.0;
            else if (s == "A") m.x -= 1.0;
            else if (s == "W") m.y += 1.0;
            else if (s == "S") m.y -= 1.0;

            else if (s == "Q") p.x -= 1.0;
            else if (s == "E") p.x += 1.0;
            sendInput();
        };
        arg.onkeyup = function(evt) {
            const s = String.fromCharCode(evt.which || evt.keyCode);
            if (!down[s]) return;
            down[s] = false;
            if (s == "D") m.x -= 1.0;
            else if (s == "A") m.x += 1.0;
            else if (s == "W") m.y -= 1.0;
            else if (s == "S") m.y += 1.0;

            else if (s == "Q") p.x += 1.0;
            else if (s == "E") p.x -= 1.0;
            sendInput();
        };
    }

    state.canReload = false;
}

function autodeskTitle(div, arg)
{
    // 15, 27, 18, 13

    let common = {textAlign: "left", left: "7%",
        color: state.darkStyle ? "#fff" : "#000"};

    if (state.darkStyle) {
        div.appendChild( e("div", baseStyle, {width: "100%", height: "100%",
            backgroundImage: `url('img/stingray.jpg')`, backgroundSize: "cover",
            backgroundPosition: "center", backgroundRepeat: "no-repeat"}));
        div.appendChild( e("div", baseStyle, {backgroundColor: "#fff",
            top: "93%", height: "10%"}));
        div.appendChild( e("div", baseStyle, {width: "13%", height: "7%",
            top: "93%", left: "86%",
            backgroundImage: `url('img/autodesk.png')`, backgroundSize: "contain",
            backgroundPosition: "center", backgroundRepeat: "no-repeat"}));
    }

    if (arg.event)
        div.appendChild( e("div", baseStyle, common,
        {fontSize: "0.8em", top: "50%", html: arg.event}) );
    if (arg.title)
        div.appendChild( e("div", baseStyle, common,
            {fontSize: "1.4em", top: "56%", html: arg.title, fontWeight: "bold"}) );
    if (arg.presenterName)
        div.appendChild( e("div", baseStyle, common,
            {fontSize: "1em", top: "76%", html: arg.presenterName}) );
    if (arg.presenterTitle)
        div.appendChild( e("div", baseStyle, common,
            {fontSize: "0.6em", top: "84%", textAlign: "left", html: arg.presenterTitle}) );
    if (arg.helpText)
        div.appendChild( e("div", baseStyle, common,
            {fontSize: "0.4em", left: "-1em", top: "88%", textAlign: "right", html: arg.helpText}) );
}

function setupSlides()
{
    window.slides = [
    {
        template: autodeskTitle,
        event: "GDC 2016",
        title: "Technical Introduction to the<br>Stingray Game Engine",
        presenterName: "Niklas Frykholm @niklasfrykholm",
        presenterTitle: "System Architect",
        helpText: `Press <span style="color: #ff0">h</span> for help`
    },
    ...makeSlides(renderMarkdown(`
# The Stingray Philosophy

> What are the core technical values behind Stingray, and how have those values
> guided the development of the engine?

# Stingray

![](img/editor.jpg)

# Stingray Quick Background

<img class="background" src="img/autodesk-background-games.jpg"/>

* Multiplatform game engine
    * Windows, XB1, PS4, Android, iOS, etc
* Generic: no special game types
* Created by me and Tobias Persson in 2009
* Purchased by Autodesk in 2014

# Stingray's Technical Vision

* Data-Driven
* Lightweight
* Quick Iterations
* High Performance

# Philosophy #1: Data-Driven

> Engine behaviors should not be hard-written in code. Instead they should
> be controlled by data files that can be changed to produce different
> behavior.

# Why?

* Flexibility
* Don't lock the engine into specific use patterns
* Adapt to each game's and platform's specific needs
* Radical rapid prototyping

# Making the Engine Data-Driven

* *Everything* controlled through JSON files
    * Human readable
    * Mergeable
* No game specific concepts in the engine:
    * Weapons, characters, inventory only exist in the gameplay layer

# Making the Engine Data-Driven (2)

* Generic, reusable mechanisms instead of hard-coded:
    * NO: Foot step animation links to sound
    * YES: Generic animation trigger support
    * NO: Special "blend shape" curves
    * YES: Arbitrary curves can feed other systems
* Don't limit the user!

# Example: Streaming

* Different games can have different streaming needs:
    * Open world: 2D grid
    * Racing: Along track
    * RPG: Specific events & enemies
* Generic mechanism:
    * Put resources in packages
    * User controls stream in/out of packages

# Key Component: Scripting

* Gameplay can be written in Lua
* Allows code to be treated as data
* Complexity can be moved from the engine code to the gameplay code

# Key Component: Flow

![](img/flow.png)

# Key Component: Flow

* Extend the benefits of scripting to non-programmers:
    * Artists, level designers
* Data-driven:
    * Extensible from C or Lua

# Being Radically Data-Driven

* At every step, work to make the engine more data-driven
* Example: Renderer
    * Entire pipe is configurable
    * Layers, shaders, post-effects, etc
    * Switch between forward or deferred rendering

# Benefits: Different Games Running in the Same Engine

![](img/games.jpg)
    `)),
    {template: imageComparison,
        captionA: "Android",
        captionB: "PC",
        imgA: "img/hamilton-android.jpg",
        imgB: "img/hamilton-pc.jpg",
        caption: "Benefits: Same Game Running on Different Platforms"
    },
    ...makeSlides(renderMarkdown(`
# Not Locked to a Domain

* Engine can be used for other purposes

# Architecture & Manufacturing

![](img/expo.jpg)

# Architecture & Manufacturing

![](img/archviz.jpg)

# Philosophy #2: Lightweight

> The engine source code should be as small and simple as possible.

# Why?

* Code is not an asset, code is a liability
* Smaller and simpler code is easier to:
    * Understand
    * Improve
    * Extend

# Keeping an Engine Light-Weight

* Lots of people want to add "just one more thing"
* The price of simplicity is eternal vigilance
    * Remove code and simplify systems
* Total source code in core engine: ~400 000 lines

# Key Component: Plugin System

* Allows the engine to be extended with DLLs
* Lets us add functionality without bloating the engine
* Both internally and externally
    * HumanIK, Oculus, Navigation, Morph Target, Scaleform, SteamVR, Wwise
* C ABI interface: Plugins can be written in any language

# Not Just About Size

* More important is conceptual simplicity
* Minimize dependencies between components

<img src="img/spaghetti.png" class="background"/>

# Conceptual Simplicity: Just Say No

* No boost, no STL, no exceptions
* No deep inheritance hierarchies
* No global serialization or reference counting
* No magic macros

# Saying Yes

* Limited set of core data structures and concepts:
    * Focused on data layout and data flow
* Use established standards when they are simple:
    * YES: JSON, Web sockets, Lua
    * NO: XML, Corba, PHP

# Only Five Basic Collection Classes

* Array
* Vector
* HashSet
* HashMap
* Deque

# Strings

* String *input* is always \`const char *\`
* When you need a dynamically growing string (rarely):

\`\`\`
struct DynamicString {
    Array<char> buffer;
    const char *c_str() {
        b.push_back(0);
        b.pop_back();
        return b.begin();
    }
};
\`\`\`

# Benefits

* Less effort required to understand the code
* Faster to fix bugs, improve performance, ...
* Customers have a decent chance of understanding the code:
    * Finding root cause of issues
    * Extending with their own functionality
* Combining simple things makes cool things possible

    `)),
    {
        template: engine,
        viewportProvider: "ws://localhost:15500",
        consoleServer: "ws://localhost:14100",
        placeholder: "img/engine-placeholder.png",
        caption: "Benefits: Engine running inside slideshow",
    },
    {
        color: "#fff",
        template: engine,
        viewportProvider: "ws://localhost:15500",
        consoleServer: "ws://localhost:14100",
        placeholder: "img/engine-placeholder.png",
        markdown: `
            # Wait, what now?

            * This presentation is a JavaScript program (~500 lines)
            * Stingray has a web socket interface
            * The presentation uses Stingray's built-in screen capture technology to capture
                rendered frames
        `
    },
    ...makeSlides(renderMarkdown(`
# Philosophies Working Together

* Data-Driven:
    * Allows the code to be simpler, because complexities can
      be moved to the data layer

# Philosophy #3: Quick Iterations

> When you change something, you should be able to see the effects of that
> change immediately, on the actual hardware where your final game will run.

# Why?

* Immediate interaction leads to higher quality
* Everybody should be aware of the real status of the project:
    * How does it look?
    * How does it play?

# Making Quick Iterations Possible

* Hot-reload support in *all* systems, on *all* platforms
* Reduce the time required for compiling and reloading:
    * Incremental
    * Avoid touching disk
    * ~100 ms

# Gameplay

* All types of code can be hot reloaded while a game is playing:
    * Lua
    * Flow
    * Plug-ins
* On any target platform

# Benefits: Editor Linking

![#black](img/editor-linking.png)

# Philosophies Working Together

* Data-Driven:
    * Since *everything* is data-driven, *everything* can be hot-reloaded,
      including code and render configurations
* Lightweight:
    * Simple code leads to fast compile times (< 1 minute) which leads to
      quick iterations over engine code

# Philosophy #4: High Performance

> The engine should not compromise on performance.

# Why?

* Game engine technology is *about* performance

# Making High Performance Possible

* Don't abstract away the nature of the hardware
    * Instead: provide multiple paths
* Avoid hidden costs: only pay for what you use
* Cache performance: data-oriented programming
* Multithreading
* Profile friendly coding, update systems, not objects

# Philosophies Working Together

* Data-Driven:
    * Engine can be configured to take advantage of each platform's strength
* Lightweight:
    * Simplicity in code and data flows leads to code that is easier to
      parallelize and optimize

# Philosophies Working Together (2)

* Quick Iterations:
    * Users are always aware of real hardware performance and can experiment
      quickly with optimizations

# Conclusion

> A strong technical vision has kept the engine on track and opened up new
> ideas that we did not originally think possible.

# Questions?

## Reach me at: @niklasfrykholm

    `)),
]
}

setupSlides();
