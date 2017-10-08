﻿// TODO: Avoid this being a global, will need passing to the tools so they can trigger an update though?
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

//---------------------------------------------------------------------------------------------------------------------
var Renderer = function (bgImg)
{
  ///////////
  // Public
  ///////////

  //---------------------------------------------------------------------------------------------------------------------
  this.backgroundImage = bgImg;

  //---------------------------------------------------------------------------------------------------------------------
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

  };

  //---------------------------------------------------------------------------------------------------------------------
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

  //---------------------------------------------------------------------------------------------------------------------
  this.DrawCreationTool = function (drawObject) {
    // TODO: Instead we should store a list of 'immediate mode objects' from all clients and then have a (60Hz?) interval to update it.

    // Clear the creation context first
    transientWorkingContext.clearRect(0, 0, transientWorkingCanvas.width, transientWorkingCanvas.height);

    var ctx = transientWorkingContext;
    ctx.save();

    if (drawObject.Tool == DrawTools.Line) {
      ctx.beginPath();
      drawTiled(function () {
        ctx.moveTo(drawObject.StartX, drawObject.StartY);
        ctx.lineTo(drawObject.CurrentX, drawObject.CurrentY);
      }, ctx);
      ctx.stroke();
    }
    else if (drawObject.Tool == DrawTools.Pencil) {
      // draw a circle to indicate where drawing will happen
      var radius = drawObject.Size;
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000000';
      drawTiled(function () {
        ctx.beginPath();
        ctx.arc(drawObject.CurrentX, drawObject.CurrentY, radius, 0, 2 * Math.PI, false);
        ctx.stroke();
      }, ctx);

    }
    else if (drawObject.Tool == DrawTools.Text) {
      ctx.font = 'normal 16px Calibri';
      ctx.fillStyle = '#000000';
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      drawTiled(function () {
        ctx.fillText(drawObject.Text, drawObject.StartX, drawObject.StartY);
      }, ctx);
    }
    else if (drawObject.Tool == DrawTools.Erase) {
      var radius = drawObject.Size;
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000000';
      drawTiled(function () {
        ctx.beginPath();
        ctx.arc(drawObject.CurrentX, drawObject.CurrentY, radius, 0, 2 * Math.PI, false);
        ctx.stroke();
      }, ctx);
    }
    else if (drawObject.Tool == DrawTools.Rect) {
      var x = Math.min(drawObject.CurrentX, drawObject.StartX);
      var y = Math.min(drawObject.CurrentY, drawObject.StartY);
      var w = Math.abs(drawObject.CurrentX - drawObject.StartX);
      var h = Math.abs(drawObject.CurrentY - drawObject.StartY);

      if (!w || !h) {
        return;
      }

      drawTiled(function () {
        ctx.strokeRect(x, y, w, h);
      }, ctx);
    }

    ctx.restore();

    // update the output image
    renderer.updateTransientViewport();
  }

  //---------------------------------------------------------------------------------------------------------------------
  this.DrawTool = function (drawObject) {

    // TODO: Clear the transient canvas now we're comitting the shape to permanent. All fixed when reimplemented to store a list of transient shapes and redraw it when it changes.

    var ctx = layerContext;
    ctx.save();

    if (drawObject.Tool == DrawTools.Line) {
      ctx.strokeStyle = drawObject.Col;
      ctx.beginPath();
      drawTiled(function () {
        ctx.moveTo(drawObject.StartX, drawObject.StartY);
        ctx.lineTo(drawObject.CurrentX, drawObject.CurrentY);
      }, ctx);
      ctx.stroke();
    }
    else if (drawObject.Tool == DrawTools.Pencil) {
      var radius = drawObject.Size;
      ctx.fillStyle = drawObject.Col;
      drawTiled(function () {
        ctx.beginPath();
        ctx.arc(drawObject.CurrentX, drawObject.CurrentY, radius, 0, 2 * Math.PI, false);
        ctx.fill();
      }, ctx);
    }
    else if (drawObject.Tool == DrawTools.Text) {
      ctx.font = 'normal 16px Calibri';
      ctx.fillStyle = drawObject.Col;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      drawTiled(function () {
        ctx.fillText(drawObject.Text, drawObject.StartX, drawObject.StartY);
      }, ctx);
    }
    else if (drawObject.Tool == DrawTools.Erase) {
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.globalCompositeOperation = "destination-out";
      var radius = drawObject.Size;
      drawTiled(function () {
        ctx.beginPath();
        ctx.arc(drawObject.CurrentX, drawObject.CurrentY, radius, 0, 2 * Math.PI, false);
        ctx.fill();
      }, ctx)

    }
    else if (drawObject.Tool == DrawTools.Rect) {
      ctx.strokeStyle = drawObject.Col;
      var x = Math.min(drawObject.CurrentX, drawObject.StartX);
      var y = Math.min(drawObject.CurrentY, drawObject.StartY);
      var w = Math.abs(drawObject.CurrentX - drawObject.StartX);
      var h = Math.abs(drawObject.CurrentY - drawObject.StartY);

      if (!w || !h) {
        return;
      }

      drawTiled(function () {
        ctx.strokeRect(x, y, w, h);
      }, ctx);
    }

    ctx.restore();

    // update the output image
    renderer.updateViewport();
  }

  //---------------------------------------------------------------------------------------------------------------------
  this.DrawToolToServer = function (drawObject) {
    theRenderer.DrawTool(drawObject);

    // Send the current state of the tool to the server so all clients can see it
    // Consider pencil: will we get message spam?
    drawObjectsCollection = [];
    drawObjectsCollection.push(drawObject);
    var message = JSON.stringify(drawObjectsCollection);
    whiteboardHub.server.sendDraw(message, $("#sessinId").val(), $("#groupName").val(), $("#userName").val());
  }

  ///////////
  // Private
  ///////////
  //---------------------------------------------------------------------------------------------------------------------
  // store 'this' so we can use it in the event handlers
  var theRenderer = this;

  //---------------------------------------------------------------------------------------------------------------------
  var onMouse = function (ev) {
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
        needsRedraw |= func(ev);
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

  //---------------------------------------------------------------------------------------------------------------------
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
      workingCanvas = document.createElement('canvas');
      workingCanvas.width = bgImg.width;
      workingCanvas.height = bgImg.height;
      workingContext = workingCanvas.getContext("2d");

      // Append, but hide the canvas so we can use it for debugging if we need to
      workingCanvas.style = "display:none";
      container.appendChild(workingCanvas);
    }

    // Add the layer canvases that hold the drawing for each layer
    {
      layerCanvas = document.createElement('canvas');
      layerCanvas.width = workingCanvas.width;
      layerCanvas.height = workingCanvas.height;
      layerContext = layerCanvas.getContext('2d');

      // Append, but hide the canvas so we can use it for debugging if we need to
      layerCanvas.style = "display:none";
      container.appendChild(layerCanvas);
    }

    // Set up the working canvas to hold the overall imagecanvas that holds the real overall image
    {
      transientWorkingCanvas = document.createElement('canvas');
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

  var drawTiled = function (drawingFunc, ctx) {
    var width = ctx.canvas.width;
    var height = ctx.canvas.height;
    ctx.translate(-width, -height);
    drawingFunc();
    ctx.translate(width, 0);
    drawingFunc();
    ctx.translate(width, 0);
    drawingFunc();
    ctx.translate(-2 * width, height);
    drawingFunc();
    ctx.translate(width, 0);
    drawingFunc();
    ctx.translate(width, 0);
    drawingFunc();
    ctx.translate(-2 * width, height);
    drawingFunc();
    ctx.translate(width, 0);
    drawingFunc();
    ctx.translate(width, 0);
    drawingFunc();
  };

  // Invoke the initialisation
  init(bgImg);
}
