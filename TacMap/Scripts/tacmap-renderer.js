var renderer;

// TODO: Hide these in the renderer
var toolCanvas, toolContext, canvaso, contexto, compositingCanvas, compositingContext;
var backgroundCanvas;

var Renderer = function(bgImg)
{

  try {

    // Set up the canvas that holds the real overall image
    {
      backgroundCanvas = document.getElementById('background');
      backgroundCanvas.width = bgImg.width;
      backgroundCanvas.height = bgImg.height;
      backgroundCanvas.getContext("2d").drawImage(bgImg, 0, 0);
    }

    canvaso = document.getElementById('whiteBoard');
    if (!canvaso) {
      alert('Error: Cannot find the imageView canvas element!');
      return;
    }

    if (!canvaso.getContext) {
      alert('Error: no canvas.getContext!');
      return;
    }
    canvaso.width = 700;
    canvaso.height = 400;

    // Get the 2D canvas context.
    contexto = canvaso.getContext('2d');
    if (!contexto) {
      alert('Error: failed to getContext!');
      return;
    }

    // Add the temporary canvas.
    var container = canvaso.parentNode;

    toolCanvas = document.createElement('canvas');
    if (!toolCanvas) {
      alert('Error: Cannot create a new canvas element!');
      return;
    }

    toolCanvas.id = 'toolCanvas';
    toolCanvas.width = canvaso.width;
    toolCanvas.height = canvaso.height;
    container.appendChild(toolCanvas);

    toolContext = toolCanvas.getContext('2d');

    compositingCanvas = document.createElement('canvas');
    if (!compositingCanvas) {
      alert('Error: Cannot create a new canvas element!');
      return;
    }

    compositingCanvas.id = 'compositingCanvas';
    compositingCanvas.width = canvaso.width;
    compositingCanvas.height = canvaso.height;
    //container.appendChild(compositingCanvas);

    compositingContext = compositingCanvas.getContext('2d');

    // Attach the mousedown, mousemove and mouseup event listeners.
    toolCanvas.addEventListener('mousedown', ev_canvas, false);
    toolCanvas.addEventListener('mousemove', ev_canvas, false);
    toolCanvas.addEventListener('mouseup', ev_canvas, false);
    toolCanvas.addEventListener('mouseout', ev_canvas, false);
    toolCanvas.addEventListener("wheel", ev_canvas, false);
    // Supress the context menu
    toolCanvas.oncontextmenu = function () { return false; }

    toolContext.clearRect(0, 0, toolCanvas.width, toolCanvas.height);
  }
  catch (err) {
    alert(err.message);
  }
  
  return {
    width: bgImg.width,
    height: bgImg.height,

    // Add the current contents of the tool canvas to the specified layer
    updateLayer: function(layerIndex) {

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
    },

  }
}
