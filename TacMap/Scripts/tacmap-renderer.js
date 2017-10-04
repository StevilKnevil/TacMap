// TODO: Avoid this being a global, will need passing to the tools so they can trigger an update though?
var renderer;

// We have a:

// Full size canvases:
// workingCanvas: that is full size and holds the background image and the other layers are composited into. This is finally copied (tiled) onto the output viewport canvas
// layerCanvas(es): Hold the drawing information for each layer and is composited into the workeingCanvas during render
// transientWorkingCanvas: holds the 'immeidate mode' rendering that can be quickly updated. This is finally copied (tiled) onto the transient output viewport canvas

// Output canvases or 'viewports'. Have pan and zoom.
// viewportCanvas: Displays the contents with appropriate pan and zoom
// transientViewportContext: Displays the 'immediate mode' rendering.

// TODO: Hide these in the renderer
var transientViewportCanvas, transientViewportContext, viewportCanvas, viewportContext, layerCanvas, layerContext;
var workingCanvas, workingContext, transientWorkingCanvas, transientWorkingContext;

var Renderer = function(bgImg)
{
  ///////////
  // Public
  ///////////

  this.backgroundImage = bgImg;

  // Add the current contents of the tool canvas to the specified layer
  this.updateViewport = function() {

    // Composite the layers onto the background image, then copy that onto the output canvas, finally, clear the background canvas with the image
    workingContext.drawImage(this.backgroundImage, 0, 0);

    // Copy the layer onto the background
    workingContext.drawImage(layerCanvas, 0, 0);

    // Now update the main output canvas
    viewportContext.clearRect(0, 0, viewportCanvas.width, viewportCanvas.height);

    // Calculate an aspectFactor such that we take a section of the source image such that it fits the dest viewport without scaling
    var aspectFactor = workingCanvas.width / viewportCanvas.height;
    // Helper calcs
    var src = {
      width: workingCanvas.width,
      height: workingCanvas.height,
      zoomedWidth: zoomTool.zoom * workingCanvas.width,
      zoomedHeight: zoomTool.zoom * workingCanvas.height,
    }

    // Now duplicate the end result to get tiling
    viewportContext.drawImage(workingCanvas,
      -panTool.panX - src.width, -panTool.panY - src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    viewportContext.drawImage(workingCanvas,
      -panTool.panX - src.width, -panTool.panY - 0, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    viewportContext.drawImage(workingCanvas,
      -panTool.panX - src.width, -panTool.panY + src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);

    viewportContext.drawImage(workingCanvas,
      -panTool.panX - 0, -panTool.panY - src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    viewportContext.drawImage(workingCanvas,
      -panTool.panX - 0, -panTool.panY - 0, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    viewportContext.drawImage(workingCanvas,
      -panTool.panX - 0, -panTool.panY + src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);

    viewportContext.drawImage(workingCanvas,
      -panTool.panX + src.width, -panTool.panY - src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    viewportContext.drawImage(workingCanvas,
      -panTool.panX + src.width, -panTool.panY - 0, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    viewportContext.drawImage(workingCanvas,
      -panTool.panX + src.width, -panTool.panY + src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);

    /*
    // copy the generated content (with tiling)
    viewportContext.clearRect(-viewportCanvas.width, -viewportCanvas.height, viewportCanvas.width * 3, viewportCanvas.height * 3);
    viewportContext.setTransform(1, 0, 0, 1, panTool.panX, panTool.panY);

    viewportContext.drawImage(layerCanvas, -viewportCanvas.width, -viewportCanvas.height);
    viewportContext.drawImage(layerCanvas, 0, -viewportCanvas.height);
    viewportContext.drawImage(layerCanvas, viewportCanvas.width, -viewportCanvas.height);
    viewportContext.drawImage(layerCanvas, -viewportCanvas.width, 0);
    viewportContext.drawImage(layerCanvas, 0, 0);
    viewportContext.drawImage(layerCanvas, viewportCanvas.width, 0);
    viewportContext.drawImage(layerCanvas, -viewportCanvas.width, viewportCanvas.height);
    viewportContext.drawImage(layerCanvas, 0, viewportCanvas.height);
    viewportContext.drawImage(layerCanvas, viewportCanvas.width, viewportCanvas.height);
    */
  };

  // Add the current contents of the tool canvas to the specified layer
  this.updateTransientViewport = function () {

    // Clear the output canvas
    transientViewportContext.clearRect(0, 0, transientViewportCanvas.width, transientViewportCanvas.height);

    // Calculate an aspectFactor such that we take a section of the source image such that it fits the dest viewport without scaling
    var aspectFactor = transientWorkingCanvas.width / viewportCanvas.height;
    // Helper calcs
    var src = {
      width: transientWorkingCanvas.width,
      height: transientWorkingCanvas.height,
      zoomedWidth: zoomTool.zoom * transientWorkingCanvas.width,
      zoomedHeight: zoomTool.zoom * transientWorkingCanvas.height,
    }

    // Now duplicate the end result to get tiling
    transientViewportContext.drawImage(transientWorkingCanvas,
      -panTool.panX - src.width, -panTool.panY - src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    transientViewportContext.drawImage(transientWorkingCanvas,
      -panTool.panX - src.width, -panTool.panY - 0, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    transientViewportContext.drawImage(transientWorkingCanvas,
      -panTool.panX - src.width, -panTool.panY + src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);

    transientViewportContext.drawImage(transientWorkingCanvas,
      -panTool.panX - 0, -panTool.panY - src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    transientViewportContext.drawImage(transientWorkingCanvas,
      -panTool.panX - 0, -panTool.panY - 0, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    transientViewportContext.drawImage(transientWorkingCanvas,
      -panTool.panX - 0, -panTool.panY + src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);

    transientViewportContext.drawImage(transientWorkingCanvas,
      -panTool.panX + src.width, -panTool.panY - src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    transientViewportContext.drawImage(transientWorkingCanvas,
      -panTool.panX + src.width, -panTool.panY - 0, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    transientViewportContext.drawImage(transientWorkingCanvas,
      -panTool.panX + src.width, -panTool.panY + src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
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

      // Work out the mouse position in canvas space
      ev.canvasX = Math.round((ev._x * zoomTool.zoom) - panTool.panX);
      ev.canvasY = Math.round((ev._y * zoomTool.zoom) - panTool.panY);
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
    else if (ev.buttons == 2 || ev.buttons == 0) {
      // Call the event handler of the tool.
      var func = eraseTool[ev.type];

      if (func) {
        needsRedraw |= func(ev);
      }
    }

    // MMB
    // TODO: Add a panning tool (and ultimately a zoom tool - handle that normally, and have special case code for middle mouse button. c.f. right mouse for erase.
    else if (ev.buttons == 4 || ev.buttons == 0) {
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
      theRenderer.updateViewport();
    }

  }

  var init = function (bgImg) {


    // Set up the output canvas
    {
      viewportCanvas = document.getElementById('whiteBoard');
      viewportCanvas.width = 700;
      viewportCanvas.height = 400;
      // Get the 2D canvas context.
      viewportContext = viewportCanvas.getContext('2d');
    }

    var container = viewportCanvas.parentNode;

    // Add the 'immediate mode' output canvas.
    {
      transientViewportCanvas = document.createElement('canvas');
      transientViewportCanvas.id = 'transientViewportCanvas';
      transientViewportCanvas.width = viewportCanvas.width;
      transientViewportCanvas.height = viewportCanvas.height;
      transientViewportContext = transientViewportCanvas.getContext('2d');
      container.appendChild(transientViewportCanvas);
    }

    // Set up the working canvas to hold the overall imagecanvas that holds the real overall image
    {
      //workingCanvas = document.getElementById('debugCanvas');
      workingCanvas = document.createElement('canvas');
      workingCanvas.width = bgImg.width;
      workingCanvas.height = bgImg.height;
      workingContext = workingCanvas.getContext("2d");
      //workingContext.drawImage(bgImg, 0, 0);
    }

    // Add the layer canvases that hold the drawing for each layer
    {
      layerCanvas = document.createElement('canvas');
      layerCanvas.width = viewportCanvas.width;
      layerCanvas.height = viewportCanvas.height;
      // Don't need to append because we don't need to see it
      //container.appendChild(layerCanvas);

      layerContext = layerCanvas.getContext('2d');
    }

    // Set up the working canvas to hold the overall imagecanvas that holds the real overall image
    {
      transientWorkingCanvas = document.getElementById('debugCanvas');
      //transientWorkingCanvas = document.createElement('canvas');
      transientWorkingCanvas.width = bgImg.width;
      transientWorkingCanvas.height = bgImg.height;
      transientWorkingContext = transientWorkingCanvas.getContext("2d");
    }

    // Attach the mousedown, mousemove and mouseup event listeners.
    transientViewportCanvas.addEventListener('mousedown', onMouse, false);
    transientViewportCanvas.addEventListener('mousemove', onMouse, false);
    transientViewportCanvas.addEventListener('mouseup', onMouse, false);
    transientViewportCanvas.addEventListener('mouseout', onMouse, false);
    transientViewportCanvas.addEventListener("wheel", onMouse, false);
    // Supress the context menu
    transientViewportCanvas.oncontextmenu = function () { return false; }
  };

  // Constructor
  init(bgImg);
}
