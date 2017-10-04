// TODO: Avoid this being a global, will need passing to the tools so they can trigger an update though?
var renderer;

// TODO: Hide these in the renderer
var toolCanvas, toolContext, outputCanvas, outputContext, layerCanvas, layerContext;
var workingCanvas, workingContext;

var Renderer = function(bgImg)
{
  ///////////
  // Public
  ///////////

  this.backgroundImage = bgImg;

  // Add the current contents of the tool canvas to the specified layer
  this.doRender = function() {

    // Composite the layers onto the background image, then copy that onto the output canvas, finally, clear the background canvas with the image
    workingContext.drawImage(this.backgroundImage, 0, 0);

    // Copy the layer onto the background
    workingContext.drawImage(layerCanvas, 0, 0);

    // Now update the main output canvas
    outputContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

    // Calculate an aspectFactor such that we take a section of the source image such that it fits the dest viewport without scaling
    var aspectFactor = workingCanvas.width / outputCanvas.height;
    // Helper calcs
    var src = {
      width: workingCanvas.width,
      height: workingCanvas.height,
      zoomedWidth: zoomTool.zoom * workingCanvas.width,
      zoomedHeight: zoomTool.zoom * workingCanvas.height,
    }

    // Now duplicate the end result to get tiling
    outputContext.drawImage(workingCanvas,
      -panTool.panX - src.width, -panTool.panY - src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    outputContext.drawImage(workingCanvas,
      -panTool.panX - src.width, -panTool.panY - 0, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    outputContext.drawImage(workingCanvas,
      -panTool.panX - src.width, -panTool.panY + src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);

    outputContext.drawImage(workingCanvas,
      -panTool.panX - 0, -panTool.panY - src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    outputContext.drawImage(workingCanvas,
      -panTool.panX - 0, -panTool.panY - 0, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    outputContext.drawImage(workingCanvas,
      -panTool.panX - 0, -panTool.panY + src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);

    outputContext.drawImage(workingCanvas,
      -panTool.panX + src.width, -panTool.panY - src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    outputContext.drawImage(workingCanvas,
      -panTool.panX + src.width, -panTool.panY - 0, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);
    outputContext.drawImage(workingCanvas,
      -panTool.panX + src.width, -panTool.panY + src.height, src.zoomedWidth, src.zoomedHeight,
      0, 0, src.width, src.height);

    /*
    // copy the generated content (with tiling)
    outputContext.clearRect(-outputCanvas.width, -outputCanvas.height, outputCanvas.width * 3, outputCanvas.height * 3);
    outputContext.setTransform(1, 0, 0, 1, panTool.panX, panTool.panY);

    outputContext.drawImage(layerCanvas, -outputCanvas.width, -outputCanvas.height);
    outputContext.drawImage(layerCanvas, 0, -outputCanvas.height);
    outputContext.drawImage(layerCanvas, outputCanvas.width, -outputCanvas.height);
    outputContext.drawImage(layerCanvas, -outputCanvas.width, 0);
    outputContext.drawImage(layerCanvas, 0, 0);
    outputContext.drawImage(layerCanvas, outputCanvas.width, 0);
    outputContext.drawImage(layerCanvas, -outputCanvas.width, outputCanvas.height);
    outputContext.drawImage(layerCanvas, 0, outputCanvas.height);
    outputContext.drawImage(layerCanvas, outputCanvas.width, outputCanvas.height);
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
      theRenderer.doRender();
    }

  }

  var init = function (bgImg) {
    // Set up the canvas that holds the real overall image
    {
      workingCanvas = document.getElementById('background');
      workingCanvas.width = bgImg.width;
      workingCanvas.height = bgImg.height;
      workingContext = workingCanvas.getContext("2d");
      workingContext.drawImage(bgImg, 0, 0);
    }

    // Set up the output canvas
    {
      outputCanvas = document.getElementById('whiteBoard');
      outputCanvas.width = 700;
      outputCanvas.height = 400;
      // Get the 2D canvas context.
      outputContext = outputCanvas.getContext('2d');
    }

    var container = outputCanvas.parentNode;

    // Add the temporary tool canvas.
    {
      toolCanvas = document.createElement('canvas');
      toolCanvas.id = 'toolCanvas';
      toolCanvas.width = outputCanvas.width;
      toolCanvas.height = outputCanvas.height;
      toolContext = toolCanvas.getContext('2d');
      container.appendChild(toolCanvas);
    }

    // Add the layer canvases
    {
      layerCanvas = document.createElement('canvas');
      layerCanvas.id = 'layerCanvas';
      layerCanvas.width = outputCanvas.width;
      layerCanvas.height = outputCanvas.height;
      // Don't need to append because we don't need to see it
      //container.appendChild(layerCanvas);

      layerContext = layerCanvas.getContext('2d');
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
