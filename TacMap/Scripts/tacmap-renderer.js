// TODO: Avoid this being a global, will need passing to the tools so they can trigger an update though?
var renderer;

// TODO: Hide these in the renderer
var toolCanvas, toolContext, canvaso, contexto, compositingCanvas, compositingContext;
var backgroundCanvas;

var Renderer = function(bgImg)
{
  ///////////
  // Public
  ///////////

  // Now construct and return the renderer object
  this.width = bgImg.width;
  this.height = bgImg.height;

  // Add the current contents of the tool canvas to the specified layer
  this.updateLayer = function (layerIndex) {

    // Bake the drawing into the layer and clear the tool context
    //compositingContext.rect(0, 0, compositingCanvas.width, compositingCanvas.height);
    //compositingContext.clip();

    // Composite into the layer (tiled)
    // TODO: Handle zoom
    compositingContext.setTransform(1, 0, 0, 1, -panTool.panX, -panTool.panY);
    compositingContext.drawImage(toolCanvas, -toolCanvas.width, -toolCanvas.height);
    compositingContext.drawImage(toolCanvas, -toolCanvas.width, 0);
    compositingContext.drawImage(toolCanvas, -toolCanvas.width, toolCanvas.height);
    compositingContext.drawImage(toolCanvas, 0, -toolCanvas.height);
    compositingContext.drawImage(toolCanvas, 0, 0);
    compositingContext.drawImage(toolCanvas, 0, toolCanvas.height);
    compositingContext.drawImage(toolCanvas, toolCanvas.width, -toolCanvas.height);
    compositingContext.drawImage(toolCanvas, toolCanvas.width, 0);
    compositingContext.drawImage(toolCanvas, toolCanvas.width, toolCanvas.height);

    // And clear the tool context now we have added it to the layer
    toolContext.clearRect(0, 0, toolCanvas.width, toolCanvas.height);

    // Now update the main output canvas
    contexto.clearRect(0, 0, canvaso.width, canvaso.height);

    // Maintain aspect ratio
    // Calculate an aspectFactor such that we take a section of the source image such that it fits the dest viewport without scaling
    var aspectFactor = backgroundCanvas.width / canvaso.height;

    // Now duplicate the end result to get tiling
    contexto.drawImage(backgroundCanvas,
      -panTool.panX - backgroundCanvas.width, -panTool.panY - backgroundCanvas.height, zoomTool.zoom * backgroundCanvas.width, zoomTool.zoom * backgroundCanvas.height,
      0, 0, canvaso.width, canvaso.height * aspectFactor);
    contexto.drawImage(backgroundCanvas,
      -panTool.panX - backgroundCanvas.width, -panTool.panY - 0, zoomTool.zoom * backgroundCanvas.width, zoomTool.zoom * backgroundCanvas.height,
      0, 0, canvaso.width, canvaso.height * aspectFactor);
    contexto.drawImage(backgroundCanvas,
      -panTool.panX - backgroundCanvas.width, -panTool.panY + backgroundCanvas.height, zoomTool.zoom * backgroundCanvas.width, zoomTool.zoom * backgroundCanvas.height,
      0, 0, canvaso.width, canvaso.height * aspectFactor);

    contexto.drawImage(backgroundCanvas,
      -panTool.panX - 0, -panTool.panY - backgroundCanvas.height, zoomTool.zoom * backgroundCanvas.width, zoomTool.zoom * backgroundCanvas.height,
      0, 0, canvaso.width, canvaso.height * aspectFactor);
    contexto.drawImage(backgroundCanvas,
      -panTool.panX - 0, -panTool.panY - 0, zoomTool.zoom * backgroundCanvas.width, zoomTool.zoom * backgroundCanvas.height,
      0, 0, canvaso.width, canvaso.height * aspectFactor);
    contexto.drawImage(backgroundCanvas,
      -panTool.panX - 0, -panTool.panY + backgroundCanvas.height, zoomTool.zoom * backgroundCanvas.width, zoomTool.zoom * backgroundCanvas.height,
      0, 0, canvaso.width, canvaso.height * aspectFactor);

    contexto.drawImage(backgroundCanvas,
      -panTool.panX + backgroundCanvas.width, -panTool.panY - backgroundCanvas.height, zoomTool.zoom * backgroundCanvas.width, zoomTool.zoom * backgroundCanvas.height,
      0, 0, canvaso.width, canvaso.height * aspectFactor);
    contexto.drawImage(backgroundCanvas,
      -panTool.panX + backgroundCanvas.width, -panTool.panY - 0, zoomTool.zoom * backgroundCanvas.width, zoomTool.zoom * backgroundCanvas.height,
      0, 0, canvaso.width, canvaso.height * aspectFactor);
    contexto.drawImage(backgroundCanvas,
      -panTool.panX + backgroundCanvas.width, -panTool.panY + backgroundCanvas.height, zoomTool.zoom * backgroundCanvas.width, zoomTool.zoom * backgroundCanvas.height,
      0, 0, canvaso.width, canvaso.height * aspectFactor);

    /*
    // copy the generated content (with tiling)
    contexto.clearRect(-canvaso.width, -canvaso.height, canvaso.width * 3, canvaso.height * 3);
    contexto.setTransform(1, 0, 0, 1, panTool.panX, panTool.panY);

    contexto.drawImage(compositingCanvas, -canvaso.width, -canvaso.height);
    contexto.drawImage(compositingCanvas, 0, -canvaso.height);
    contexto.drawImage(compositingCanvas, canvaso.width, -canvaso.height);
    contexto.drawImage(compositingCanvas, -canvaso.width, 0);
    contexto.drawImage(compositingCanvas, 0, 0);
    contexto.drawImage(compositingCanvas, canvaso.width, 0);
    contexto.drawImage(compositingCanvas, -canvaso.width, canvaso.height);
    contexto.drawImage(compositingCanvas, 0, canvaso.height);
    contexto.drawImage(compositingCanvas, canvaso.width, canvaso.height);
    */
  };

  ///////////
  // Private
  ///////////
  // store 'this' so we can use it in the event handlers
  var theRenderer = this;
  onMouse = function(ev) {
    // Normalise the event
    {
      var iebody = (document.compatMode && document.compatMode != "BackCompat") ? document.documentElement : document.body

      var dsocleft = document.all ? iebody.scrollLeft : pageXOffset
      var dsoctop = document.all ? iebody.scrollTop : pageYOffset
      var appname = window.navigator.appName;

      if (ev.layerX || ev.layerX == 0) {  // Firefox
        ev._x = ev.layerX;
        if ('Netscape' == appname)
          ev._y = ev.layerY;
        else
          ev._y = ev.layerY - dsoctop;

      } else if (ev.offsetX || ev.offsetX == 0) { // Opera
        ev._x = ev.offsetX;
        ev._y = ev.offsetY - dsoctop;
      }

      ev.wheelDelta = Math.max(-1, Math.min(1, (ev.wheelDelta || -ev.detail)));
    }

    var needsRedraw = false;
    // LMB
    // TODO: need a way of sending mouseUp to the tool, without looking at button. How does this fit with using RMB and MMB for specific tools? 
    // At the moment all tools get the mouse mouse move when no button is down - giving them all a chance to cancel. Far from ideal!
    // should we temporarily change 'current tool'? maybe that's OK, if we store the previous tool? The toolbar could evenupdate to show that tool.
    // Have a 'tool' base class with an 'exit' function that cleans itself up ok.
    // Imaging if you dragged out of canvas and then selected a new tool? The old one must close gracefully.
    if (ev.buttons == 1 || ev.buttons == 0) {
      // Call the event handler of the tool.
      var func = tool[ev.type];

      if (func) {
        func(ev);
      }
    }

    // RMB
    if (ev.buttons == 2 || ev.buttons == 0) {
      // Call the event handler of the tool.
      var func = eraseTool[ev.type];

      if (func) {
        needsRedraw |= func(ev);
      }
    }

    // MMB
    // TODO: Add a panning tool (and ultimately a zoom tool - handle that normally, and have special case code for middle mouse button. c.f. right mouse for erase.
    if (ev.buttons == 4 || ev.buttons == 0) {
      // Call the event handler of the tool.
      var func = panTool[ev.type];

      if (func) {
        needsRedraw |= func(ev);
      }
    }

    // mouse wheel for zoom
    if (ev.type == "wheel") {
      needsRedraw |= zoomTool[ev.type](ev);
    }

    if (needsRedraw)
    {
      theRenderer.updateLayer();
    }

  }

  var init = function (bgImg) {
    // Set up the canvas that holds the real overall image
    {
      backgroundCanvas = document.getElementById('background');
      backgroundCanvas.width = bgImg.width;
      backgroundCanvas.height = bgImg.height;
      backgroundCanvas.getContext("2d").drawImage(bgImg, 0, 0);
    }

    // Set up the output canvas
    {
      canvaso = document.getElementById('whiteBoard');
      canvaso.width = 700;
      canvaso.height = 400;
      // Get the 2D canvas context.
      contexto = canvaso.getContext('2d');
    }

    var container = canvaso.parentNode;

    // Add the temporary tool canvas.
    {
      toolCanvas = document.createElement('canvas');
      toolCanvas.id = 'toolCanvas';
      toolCanvas.width = canvaso.width;
      toolCanvas.height = canvaso.height;
      toolContext = toolCanvas.getContext('2d');
      container.appendChild(toolCanvas);
    }

    // Add the layer canvases
    {
      compositingCanvas = document.createElement('canvas');
      compositingCanvas.id = 'compositingCanvas';
      compositingCanvas.width = canvaso.width;
      compositingCanvas.height = canvaso.height;
      // Don't need to append because we don't need to see it
      //container.appendChild(compositingCanvas);

      compositingContext = compositingCanvas.getContext('2d');
    }

    // Attach the mousedown, mousemove and mouseup event listeners.
    toolCanvas.addEventListener('mousedown', onMouse, false);
    toolCanvas.addEventListener('mousemove', onMouse, false);
    toolCanvas.addEventListener('mouseup', onMouse, false);
    toolCanvas.addEventListener('mouseout', onMouse, false);
    toolCanvas.addEventListener("wheel", onMouse, false);
    // Supress the context menu
    toolCanvas.oncontextmenu = function () { return false; }
  };

  // Constructor
  init(bgImg);
}
