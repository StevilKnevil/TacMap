var DrawStates =
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

tools.pencil = function () {
  var tool = this;
  this.started = false;
  drawObjectsCollection = [];
  this.mousedown = function (ev) {
    var drawObject = new DrawObject();
    drawObject.Tool = DrawTools.Pencil;
    tool.started = true;
    drawObject.DrawState = DrawStates.Started;
    drawObject.StartX = ev._x;
    drawObject.StartY = ev._y;
    DrawIt(drawObject, true);
    drawObjectsCollection.push(drawObject);
  };

  this.mousemove = function (ev) {
    if (tool.started) {
      var drawObject = new DrawObject();
      drawObject.Tool = DrawTools.Pencil;
      drawObject.DrawState = DrawState.Inprogress;
      drawObject.CurrentX = ev._x;
      drawObject.CurrentY = ev._y;
      DrawIt(drawObject, true);
      drawObjectsCollection.push(drawObject);
    }
  };

  // This is called when you release the mouse button.
  this.mouseup = function (ev) {
    if (tool.started) {
      var drawObject = new DrawObject();
      drawObject.Tool = DrawTools.Pencil;
      tool.started = false;
      drawObject.DrawState = DrawStates.Completed;
      drawObject.CurrentX = ev._x;
      drawObject.CurrentY = ev._y;
      DrawIt(drawObject, true);
      drawObjectsCollection.push(drawObject);
      var message = JSON.stringify(drawObjectsCollection);
      whiteboardHub.server.sendDraw(message, $("#sessinId").val(), $("#groupName").val(), $("#userName").val());

    }
  };
  /*
  this.mouseout = function (ev) {
    if (tool.started) {
      var message = JSON.stringify(drawObjectsCollection);
      whiteboardHub.server.sendDraw(message, $("#sessinId").val(), $("#groupName").val(), $("#userName").val());
    }
    tool.started = false;

  }
  */
};

tools.rect = function () {
  var tool = this;
  var drawObject = new DrawObject();
  drawObject.Tool = DrawTools.Rect;
  this.started = false;

  this.mousedown = function (ev) {
    drawObject.DrawState = DrawStates.Started;
    drawObject.StartX = ev._x;
    drawObject.StartY = ev._y;
    tool.started = true;
  };

  this.mousemove = function (ev) {
    if (!tool.started) {
      return;
    }
    drawObject.DrawState = DrawStates.Inprogress;
    drawObject.CurrentX = ev._x;
    drawObject.CurrentY = ev._y;
    DrawIt(drawObject, true);
  };

  this.mouseup = function (ev) {
    if (tool.started) {
      drawObject.DrawState = DrawStates.Completed;
      drawObject.CurrentX = ev._x;
      drawObject.CurrentY = ev._y;
      DrawIt(drawObject, true);
      tool.started = false;

    }
  };
};

tools.line = function () {
  var tool = this;
  var drawObject = new DrawObject();
  drawObject.Tool = DrawTools.Line;
  this.started = false;

  this.mousedown = function (ev) {
    drawObject.DrawState = DrawStates.Started;
    drawObject.StartX = ev._x;
    drawObject.StartY = ev._y;
    tool.started = true;
  };

  this.mousemove = function (ev) {
    if (!tool.started) {
      return;
    }
    drawObject.DrawState = DrawStates.Inprogress;
    drawObject.CurrentX = ev._x;
    drawObject.CurrentY = ev._y;
    DrawIt(drawObject, true);
  };

  this.mouseup = function (ev) {
    if (tool.started) {
      drawObject.DrawState = DrawStates.Completed;
      drawObject.CurrentX = ev._x;
      drawObject.CurrentY = ev._y;
      DrawIt(drawObject, true);
      tool.started = false;
    }
  };
};

tools.text = function () {
  var tool = this;
  this.started = false;
  var drawObject = new DrawObject();
  drawObject.Tool = DrawTools.Text;
  this.mousedown = function (ev) {

    if (!tool.started) {
      tool.started = true;
      drawObject.DrawState = DrawStates.Started;
      drawObject.StartX = ev._x;
      drawObject.StartY = ev._y;
      var text_to_add = prompt('Enter the text:', ' ', 'Add Text');
      drawObject.Text = "";
      drawObject.Text = text_to_add;
      if (text_to_add.length < 1) {
        tool.started = false;
        return;
      }

      DrawIt(drawObject, true);
      tool.started = false;
      updatecanvas();
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
      updatecanvas();
    }
  };
}

tools.erase = function (ev) {

  var tool = this;
  this.started = false;
  var drawObject = new DrawObject();
  drawObject.Tool = DrawTools.Erase;
  this.mousedown = function (ev) {
    tool.started = true;
    drawObject.DrawState = DrawStates.Started;
    drawObject.StartX = ev._x;
    drawObject.StartY = ev._y;
    DrawIt(drawObject, true);
  };
  this.mousemove = function (ev) {
    if (!tool.started) {
      return;
    }
    drawObject.DrawState = DrawStates.Inprogress;
    drawObject.CurrentX = ev._x;
    drawObject.CurrentY = ev._y;
    DrawIt(drawObject, true);
  };
  this.mouseup = function (ev) {
    drawObject.DrawState = DrawStates.Completed;
    drawObject.CurrentX = ev._x;
    drawObject.CurrentY = ev._y;
    DrawIt(drawObject, true);
    tool.started = false;
  }
};


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
    tool.panX += ev.movementX * zoomTool.zoom;
    tool.panY += ev.movementY * zoomTool.zoom;

    if (tool.panX > backgroundCanvas.width)
      tool.panX -= backgroundCanvas.width;
    if (tool.panX < 0)
      tool.panX += backgroundCanvas.width;

    if (tool.panY > backgroundCanvas.height)
      tool.panY -= backgroundCanvas.height;
    if (tool.panY < 0)
      tool.panY += backgroundCanvas.height;

    updatecanvas();
  };
  this.mouseup = function (ev) {
    tool.started = false;
  }
};

tools.zoom = function (ev) {

  var tool = this;
  this.zoom = 1;

  this.wheel = function (ev) {
    var zoomSpeed = 10;
    this.zoom += ev.wheelDelta / (120 * zoomSpeed);
    // Clamp
    var minZoom = 0.1;
    var maxZoom = 10;
    this.zoom = Math.min(maxZoom, Math.max(minZoom, this.zoom));
    updatecanvas();
  };
};

// TODO ultimately shouldn't need these
var eraseTool = new tools.erase();
var panTool = new tools.pan();
var zoomTool = new tools.zoom();