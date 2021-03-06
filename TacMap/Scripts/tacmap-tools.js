﻿var DrawStates =
{
  Started: 0,
  Inprogress: 1,
  Completed: 2
}

var DrawTools =
{
  Pencil: 0,
  Line: 1,
  Text: 2,
  Rect: 3,
  Oval: 4,
  Erase: 5,
}

function DrawObject() {
}

var tools = {};

//---------------------------------------------------------------------------------------------------------------------
tools.pencil = function () {
  var tool = this;
  this.started = false;
  var drawObject = new DrawObject();
  drawObject.Tool = DrawTools.Pencil;
  this.mousedown = function (ev) {
    tool.started = true;
    drawObject.StartX = ev.canvasX;
    drawObject.StartY = ev.canvasY;
  };

  this.mousemove = function (ev) {
    if (tool.started) {
      drawObject.CurrentX = ev.canvasX;
      drawObject.CurrentY = ev.canvasY;
      drawObject.Size = document.getElementById("brushSizeSlider").value;
      drawObject.Col = document.getElementById("brushColourPicker").value;
      renderer.DrawToolToServer(drawObject);
      // Store this point to start the next time
      drawObject.StartX = ev.canvasX;
      drawObject.StartY = ev.canvasY;
    }
    // Always draw the creation tool outline too - even if we're drawing
    {
      drawObject.CurrentX = ev.canvasX;
      drawObject.CurrentY = ev.canvasY;
      drawObject.Size = document.getElementById("brushSizeSlider").value;
      renderer.DrawCreationTool(drawObject);
    }
  };

  // This is called when you release the mouse button.
  this.mouseup = function (ev) {
    if (tool.started) {
      drawObject.CurrentX = ev.canvasX;
      drawObject.CurrentY = ev.canvasY;
      drawObject.Size = document.getElementById("brushSizeSlider").value;
      drawObject.Col = document.getElementById("brushColourPicker").value;
      renderer.DrawToolToServer(drawObject);
      tool.started = false;
    }
  };
};

//---------------------------------------------------------------------------------------------------------------------
tools.rect = function () {
  var tool = this;
  var drawObject = new DrawObject();
  drawObject.Tool = DrawTools.Rect;
  this.started = false;

  this.mousedown = function (ev) {
    drawObject.StartX = ev.canvasX;
    drawObject.StartY = ev.canvasY;
    drawObject.Col = document.getElementById("brushColourPicker").value;
    tool.started = true;
  };

  this.mousemove = function (ev) {
    if (!tool.started) {
      return;
    }
    drawObject.CurrentX = ev.canvasX;
    drawObject.CurrentY = ev.canvasY;
    renderer.DrawCreationTool(drawObject);
  };

  this.mouseup = function (ev) {
    if (tool.started) {
      drawObject.CurrentX = ev.canvasX;
      drawObject.CurrentY = ev.canvasY;
      renderer.DrawToolToServer(drawObject);
      tool.started = false;
    }
  };
};

//---------------------------------------------------------------------------------------------------------------------
tools.line = function () {
  var tool = this;
  var drawObject = new DrawObject();
  drawObject.Tool = DrawTools.Line;
  this.started = false;

  this.mousedown = function (ev) {
    drawObject.StartX = ev.canvasX;
    drawObject.StartY = ev.canvasY;
    drawObject.Col = document.getElementById("brushColourPicker").value;
    tool.started = true;
  };

  this.mousemove = function (ev) {
    if (!tool.started) {
      return;
    }
    drawObject.CurrentX = ev.canvasX;
    drawObject.CurrentY = ev.canvasY;
    renderer.DrawCreationTool(drawObject);
  };

  this.mouseup = function (ev) {
    if (tool.started) {
      drawObject.CurrentX = ev.canvasX;
      drawObject.CurrentY = ev.canvasY;
      renderer.DrawToolToServer(drawObject);
      tool.started = false;
    }
  };
};

//---------------------------------------------------------------------------------------------------------------------
tools.text = function () {
  var tool = this;
  this.started = false;
  var drawObject = new DrawObject();
  drawObject.Tool = DrawTools.Text;
  this.mousedown = function (ev) {

    if (!tool.started) {
      tool.started = true;
      drawObject.StartX = ev.canvasX;
      drawObject.StartY = ev.canvasY;
      drawObject.Col = document.getElementById("brushColourPicker").value;
      var text_to_add = prompt('Enter the text:', ' ', 'Add Text');
      drawObject.Text = "";
      drawObject.Text = text_to_add;
      if (text_to_add.length < 1) {
        tool.started = false;
        return;
      }

      renderer.DrawCreationTool(drawObject);
      tool.started = false;
      return true;
    }
  };

  this.mousemove = function (ev) {
    if (!tool.started) {
      return;
    }
  };

  this.mouseup = function (ev) {
    if (tool.started) {
      tool.mousemove(ev);
      tool.started = false;
      return true;
    }
  };
}

//---------------------------------------------------------------------------------------------------------------------
tools.erase = function (ev) {

  var tool = this;
  this.started = false;
  var drawObject = new DrawObject();
  drawObject.Tool = DrawTools.Erase;
  this.mousedown = function (ev) {
    tool.started = true;
    drawObject.StartX = ev.canvasX;
    drawObject.StartY = ev.canvasY;
  };
  this.mousemove = function (ev) {
    if (tool.started) {
      drawObject.CurrentX = ev.canvasX;
      drawObject.CurrentY = ev.canvasY;
      drawObject.Size = document.getElementById("brushSizeSlider").value;
      renderer.DrawToolToServer(drawObject);
      // Store this point to start the next time
      drawObject.StartX = ev.canvasX;
      drawObject.StartY = ev.canvasY;
    }
    // Always draw the creation tool outline too - even if we're drawing
    {
      drawObject.CurrentX = ev.canvasX;
      drawObject.CurrentY = ev.canvasY;
      drawObject.Size = document.getElementById("brushSizeSlider").value;
      renderer.DrawCreationTool(drawObject);
    }
  };
  this.mouseup = function (ev) {
    drawObject.StartX = ev.canvasX;
    drawObject.StartY = ev.canvasY;
    renderer.DrawToolToServer(drawObject);
    tool.started = false;
  }
};


//---------------------------------------------------------------------------------------------------------------------
tools.pan = function (ev) {

  var tool = this;
  this.started = false;
  this.panX = 0;
  this.panY = 0;

  this.mousedown = function (ev) {
    tool.started = true;
  };
  this.mousemove = function (ev) {
    if (!tool.started) {
      return;
    }
    tool.panX += ev.movementX;
    tool.panY += ev.movementY;

    tool.clampPan();

    return true;
  };

  this.mouseup = function (ev) {
    tool.started = false;
  }

  this.clampPan = function()
  {
    if (tool.panX > renderer.backgroundImage.width * zoomTool.zoom)
      tool.panX -= renderer.backgroundImage.width * zoomTool.zoom;
    if (tool.panX < 0)
      tool.panX += renderer.backgroundImage.width * zoomTool.zoom;

    if (tool.panY > renderer.backgroundImage.height * zoomTool.zoom)
      tool.panY -= renderer.backgroundImage.height * zoomTool.zoom;
    if (tool.panY < 0)
      tool.panY += renderer.backgroundImage.height * zoomTool.zoom;
  }
};

//---------------------------------------------------------------------------------------------------------------------
tools.zoom = function (ev) {

  var tool = this;
  this.zoom = 1;

  this.mousedown = function (ev) {
    tool.started = true;
  };
  this.mousemove = function (ev) {
    if (tool.started) {
    }
  };

  this.mouseup = function (ev) {
    tool.started = false;
  }

  this.wheel = function (ev) {
    var zoomSpeed = 10;
    var oldZoom = tool.zoom;
    tool.zoom += ev.wheelDelta / (120 * zoomSpeed);

    tool.clampZoom();

    // Adjust the pan so that we zoom around centre of view
    panTool.panX -= (ev.canvasX * (tool.zoom - oldZoom))
    panTool.panY -= (ev.canvasY * (tool.zoom - oldZoom))
    panTool.clampPan();
    return true;
  };

  this.clampZoom = function()
  {
    // Clamp
    var dim1;
    var dim2;
    if (viewportCanvas.width / workingCanvas.width < viewportCanvas.height / workingCanvas.height) {
      dim1 = viewportCanvas.height;
      dim2 = workingCanvas.height;
    } else {
      dim1 = viewportCanvas.width;
      dim2 = workingCanvas.width;
    }

    var minZoom = dim1 / (dim2 * 2); // TODO: clamp so that 2x bgSize fits inside viewport
    var maxZoom = 5;
    tool.zoom = Math.min(maxZoom, Math.max(minZoom, this.zoom));
  }
};

//---------------------------------------------------------------------------------------------------------------------
// TODO ultimately shouldn't need these
var eraseTool = new tools.erase();
var panTool = new tools.pan();
var zoomTool = new tools.zoom();