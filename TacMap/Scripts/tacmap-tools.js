var tools = {};

tools.pencil = function () {
  var tool = this;
  this.started = false;
  drawObjectsCollection = [];
  this.mousedown = function (ev) {
    var drawObject = new DrawObject();
    drawObject.Tool = DrawTool.Pencil;
    tool.started = true;
    drawObject.currentState = DrawState.Started;
    drawObject.StartX = ev._x;
    drawObject.StartY = ev._y;
    DrawIt(drawObject, true);
    drawObjectsCollection.push(drawObject);
  };

  this.mousemove = function (ev) {
    if (tool.started) {
      var drawObject = new DrawObject();
      drawObject.Tool = DrawTool.Pencil;
      drawObject.currentState = DrawState.Inprogress;
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
      drawObject.Tool = DrawTool.Pencil;
      tool.started = false;
      drawObject.currentState = DrawState.Completed;
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
  drawObject.Tool = DrawTool.Rect;
  this.started = false;

  this.mousedown = function (ev) {
    drawObject.currentState = DrawState.Started;
    drawObject.StartX = ev._x;
    drawObject.StartY = ev._y;
    tool.started = true;
  };

  this.mousemove = function (ev) {
    if (!tool.started) {
      return;
    }
    drawObject.currentState = DrawState.Inprogress;
    drawObject.CurrentX = ev._x;
    drawObject.CurrentY = ev._y;
    DrawIt(drawObject, true);
  };

  this.mouseup = function (ev) {
    if (tool.started) {
      drawObject.currentState = DrawState.Completed;
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
  drawObject.Tool = DrawTool.Line;
  this.started = false;

  this.mousedown = function (ev) {
    drawObject.currentState = DrawState.Started;
    drawObject.StartX = ev._x;
    drawObject.StartY = ev._y;
    tool.started = true;
  };

  this.mousemove = function (ev) {
    if (!tool.started) {
      return;
    }
    drawObject.currentState = DrawState.Inprogress;
    drawObject.CurrentX = ev._x;
    drawObject.CurrentY = ev._y;
    DrawIt(drawObject, true);
  };

  this.mouseup = function (ev) {
    if (tool.started) {
      drawObject.currentState = DrawState.Completed;
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
  drawObject.Tool = DrawTool.Text;
  this.mousedown = function (ev) {

    if (!tool.started) {
      tool.started = true;
      drawObject.currentState = DrawState.Started;
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
  drawObject.Tool = DrawTool.Erase;
  this.mousedown = function (ev) {
    tool.started = true;
    drawObject.currentState = DrawState.Started;
    drawObject.StartX = ev._x;
    drawObject.StartY = ev._y;
    DrawIt(drawObject, true);
  };
  this.mousemove = function (ev) {
    if (!tool.started) {
      return;
    }
    drawObject.currentState = DrawState.Inprogress;
    drawObject.CurrentX = ev._x;
    drawObject.CurrentY = ev._y;
    DrawIt(drawObject, true);
  };
  this.mouseup = function (ev) {
    drawObject.currentState = DrawState.Completed;
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
    tool.panX += ev.movementX;
    tool.panY += ev.movementY;
    updatecanvas();
  };
  this.mouseup = function (ev) {
    tool.started = false;
  }
};

