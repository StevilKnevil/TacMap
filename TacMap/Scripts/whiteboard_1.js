// Recognition : Alvin George, KPMG

// TODO: Clean up cruft
// There is a 'transientViewportCanvas' which gets cleared and redrawn as the user drags around with the mouse. when the drawing is complete this then gets baked into the canvas fo rthe current layer
// The layers all get baked into the final 'whiteboard' canvas (canvaso - canvasoutput? need renaming) which is transformed correctly depending on user view params.

var whiteboardHub;
var tool_default = 'line';

var tool;

var drawObjectsCollection = [];

function DrawIt(drawObject, syncServer) {

  if (drawObject.Tool == DrawTools.Line) {
    switch (drawObject.DrawState) {
      case DrawStates.Inprogress:
      case DrawStates.Completed:
        // TODO: when completed, draw this to the current layer context and clear the 'working' or 'tool' context
        transientViewportContext.clearRect(0, 0, transientViewportCanvas.width, transientViewportCanvas.height);
        transientViewportContext.beginPath();
        transientViewportContext.moveTo(drawObject.StartX, drawObject.StartY);
        transientViewportContext.lineTo(drawObject.CurrentX, drawObject.CurrentY);
        transientViewportContext.stroke();
        transientViewportContext.closePath();
        if (drawObject.DrawState == DrawStates.Completed) {
          renderer.updateViewport();
        }
        break;
    }
  }
  else if (drawObject.Tool == DrawTools.Pencil) {

    switch (drawObject.DrawState) {
      case DrawStates.Started:
        transientViewportContext.beginPath();
        transientViewportContext.moveTo(drawObject.StartX, drawObject.StartY);
        break;
      case DrawStates.Inprogress:
      case DrawStates.Completed:
        transientViewportContext.lineTo(drawObject.CurrentX, drawObject.CurrentY);
        transientViewportContext.stroke();
        if (drawObject.DrawState == DrawStates.Completed) {
          renderer.updateViewport();
        }
        break;
    }
  }
  else if (drawObject.Tool == DrawTools.Text) {
    switch (drawObject.DrawState) {
      case DrawStates.Started:
        transientViewportContext.clearRect(0, 0, transientViewportCanvas.width, transientViewportCanvas.height);
        transientViewportContext.save();
        transientViewportContext.font = 'normal 16px Calibri';
        transientViewportContext.fillStyle = "blue";
        transientViewportContext.textAlign = "left";
        transientViewportContext.textBaseline = "bottom";
        transientViewportContext.fillText(drawObject.Text, drawObject.StartX, drawObject.StartY);
        transientViewportContext.restore();
        renderer.updateViewport();
        break;

    }


  }
  else if (drawObject.Tool == DrawTools.Erase) {

    switch (drawObject.DrawState) {

      case DrawStates.Started:
        transientViewportContext.save();
        transientViewportContext.fillStyle = "#FFFFFFFF";
        transientViewportContext.globalCompositeOperation = "destination-out";
        transientViewportContext.fillRect(drawObject.StartX, drawObject.StartY, 10, 10);
        transientViewportContext.restore();
        renderer.updateViewport();
        //transientViewportContext.clearRect(drawObject.StartX, drawObject.StartY, 5, 5);
        break;
      case DrawStates.Inprogress:
      case DrawStates.Completed:
        transientViewportContext.save();
        transientViewportContext.fillStyle = "#FFFFFFFF";
        transientViewportContext.globalCompositeOperation = "destination-out";
        transientViewportContext.fillRect(drawObject.CurrentX, drawObject.CurrentY, 10, 10);
        transientViewportContext.restore();
        renderer.updateViewport();
        // transientViewportContext.clearRect(drawObject.CurrentX, drawObject.CurrentY, 5, 5);
        break;
    }


  }
  else if (drawObject.Tool == DrawTools.Rect) {

    switch (drawObject.DrawState) {
      case DrawStates.Inprogress:
      case DrawStates.Completed:
        var x = Math.min(drawObject.CurrentX, drawObject.StartX),
                y = Math.min(drawObject.CurrentY, drawObject.StartY),
                w = Math.abs(drawObject.CurrentX - drawObject.StartX),
                h = Math.abs(drawObject.CurrentY - drawObject.StartY);

        transientViewportContext.clearRect(0, 0, transientViewportCanvas.width, transientViewportCanvas.height);

        if (!w || !h) {
          return;
        }

        transientViewportContext.strokeRect(x, y, w, h);
        if (drawObject.DrawState == DrawStates.Completed) {
          renderer.updateViewport();
        }
        break;
    }

  }

  /*
  else if (drawObject.Tool == DrawTools.Pan) {
    transientViewportContext.clearRect(0, 0, transientViewportCanvas.width, transientViewportCanvas.height);
    transientViewportContext.fillText(panTool.panX, 10, 10); // TODO: Stretch layers to match background
    transientViewportContext.fillText(panTool.panY, 30, 10); // TODO: Stretch layers to match background
  }
  */

  // Send the current state of the tool to the server so all clients can see it, but don't do it for pencil as that should only get sent on completion to avoid message spam
  // TODO: Only bother sending on completion for all tools?
  if (syncServer && drawObject.Tool != DrawTools.Pencil) {

    drawObjectsCollection = [];
    drawObjectsCollection.push(drawObject);
    var message = JSON.stringify(drawObjectsCollection);
    whiteboardHub.server.sendDraw(message, $("#sessinId").val(), $("#groupName").val(), $("#userName").val());
  }
}

function DrawCreationTool(drawObject) {
  // TODO: Instead we should store a list of 'immediate mode objects' from all clients and then have a (60Hz?) interval to update it.

  // Clear the creation context first
  transientWorkingContext.clearRect(0, 0, transientWorkingCanvas.width, transientWorkingCanvas.height);

  var ctx = transientWorkingContext;

  /*
  if (drawObject.Tool == DrawTools.Line) {
    switch (drawObject.DrawState) {
      case DrawStates.Inprogress:
      case DrawStates.Completed:
        ctx.beginPath();
        ctx.moveTo(drawObject.StartX, drawObject.StartY);
        ctx.lineTo(drawObject.CurrentX, drawObject.CurrentY);
        ctx.stroke();
        ctx.closePath();
        break;
    }
  }
  else if (drawObject.Tool == DrawTools.Pencil) {

    switch (drawObject.DrawState) {
      case DrawStates.Started:
        ctx.beginPath();
        ctx.moveTo(drawObject.StartX, drawObject.StartY);
        break;
      case DrawStates.Inprogress:
      case DrawStates.Completed:
        ctx.lineTo(drawObject.CurrentX, drawObject.CurrentY);
        ctx.stroke();
        if (drawObject.DrawState == DrawStates.Completed) {
          renderer.updateViewport();
        }
        break;
    }
  }
  else if (drawObject.Tool == DrawTools.Text) {
    switch (drawObject.DrawState) {
      case DrawStates.Started:
        ctx.clearRect(0, 0, transientViewportCanvas.width, transientViewportCanvas.height);
        ctx.save();
        ctx.font = 'normal 16px Calibri';
        ctx.fillStyle = "blue";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(drawObject.Text, drawObject.StartX, drawObject.StartY);
        ctx.restore();
        renderer.updateViewport();
        break;

    }


  }
  else if (drawObject.Tool == DrawTools.Erase) {

    switch (drawObject.DrawState) {

      case DrawStates.Started:
        transientViewportContext.fillStyle = "#FFFFFF";
        transientViewportContext.fillRect(drawObject.StartX, drawObject.StartY, 10, 10);
        transientViewportContext.restore();
        renderer.updateViewport();
        break;
      case DrawStates.Inprogress:
      case DrawStates.Completed:
        transientViewportContext.fillStyle = "#FFFFFF";
        transientViewportContext.fillRect(drawObject.CurrentX, drawObject.CurrentY, 10, 10);
        transientViewportContext.restore();
        renderer.updateViewport();
        break;
    }


  }
  

  else */if (drawObject.Tool == DrawTools.Rect) {
    var x = Math.min(drawObject.CurrentX, drawObject.StartX),
            y = Math.min(drawObject.CurrentY, drawObject.StartY),
            w = Math.abs(drawObject.CurrentX - drawObject.StartX),
            h = Math.abs(drawObject.CurrentY - drawObject.StartY);

    if (!w || !h) {
      return;
    }

    ctx.strokeRect(x, y, w, h);
  }

  // update the output image
  renderer.updateTransientViewport();
}

function DrawTool(drawObject) {

  // TODO: Clear the transient canvas now we're comitting the shape to permanent. All fixed when reimplemented to store a list of transient shapes and redraw it when it changes.

  var ctx = layerContext;

  /*
  if (drawObject.Tool == DrawTools.Line) {
    switch (drawObject.DrawState) {
      case DrawStates.Inprogress:
      case DrawStates.Completed:
        // TODO: when completed, draw this to the current layer context and clear the 'working' or 'tool' context
        transientViewportContext.clearRect(0, 0, transientViewportCanvas.width, transientViewportCanvas.height);
        transientViewportContext.beginPath();
        transientViewportContext.moveTo(drawObject.StartX, drawObject.StartY);
        transientViewportContext.lineTo(drawObject.CurrentX, drawObject.CurrentY);
        transientViewportContext.stroke();
        transientViewportContext.closePath();
        if (drawObject.DrawState == DrawStates.Completed) {
          renderer.updateViewport();
        }
        break;
    }
  }
  else if (drawObject.Tool == DrawTools.Pencil) {

    switch (drawObject.DrawState) {
      case DrawStates.Started:
        transientViewportContext.beginPath();
        transientViewportContext.moveTo(drawObject.StartX, drawObject.StartY);
        break;
      case DrawStates.Inprogress:
      case DrawStates.Completed:
        transientViewportContext.lineTo(drawObject.CurrentX, drawObject.CurrentY);
        transientViewportContext.stroke();
        if (drawObject.DrawState == DrawStates.Completed) {
          renderer.updateViewport();
        }
        break;
    }
  }
  else if (drawObject.Tool == DrawTools.Text) {
    switch (drawObject.DrawState) {
      case DrawStates.Started:
        transientViewportContext.clearRect(0, 0, transientViewportCanvas.width, transientViewportCanvas.height);
        transientViewportContext.save();
        transientViewportContext.font = 'normal 16px Calibri';
        transientViewportContext.fillStyle = "blue";
        transientViewportContext.textAlign = "left";
        transientViewportContext.textBaseline = "bottom";
        transientViewportContext.fillText(drawObject.Text, drawObject.StartX, drawObject.StartY);
        transientViewportContext.restore();
        renderer.updateViewport();
        break;

    }


  }
  else if (drawObject.Tool == DrawTools.Erase) {

    switch (drawObject.DrawState) {

      case DrawStates.Started:
        transientViewportContext.fillStyle = "#FFFFFF";
        transientViewportContext.fillRect(drawObject.StartX, drawObject.StartY, 10, 10);
        transientViewportContext.restore();
        renderer.updateViewport();
        break;
      case DrawStates.Inprogress:
      case DrawStates.Completed:
        transientViewportContext.fillStyle = "#FFFFFF";
        transientViewportContext.fillRect(drawObject.CurrentX, drawObject.CurrentY, 10, 10);
        transientViewportContext.restore();
        renderer.updateViewport();
        break;
    }


  }
  else*/ if (drawObject.Tool == DrawTools.Rect) {

    var x = Math.min(drawObject.CurrentX, drawObject.StartX),
            y = Math.min(drawObject.CurrentY, drawObject.StartY),
            w = Math.abs(drawObject.CurrentX - drawObject.StartX),
            h = Math.abs(drawObject.CurrentY - drawObject.StartY);

    if (!w || !h) {
      return;
    }

    // Draw to the layer
    ctx.strokeRect(x, y, w, h);
  }

  // update the output image
  renderer.updateViewport();

  // Send the current state of the tool to the server so all clients can see it
  // Consider pencil: will we get message spam?
  {
    drawObjectsCollection = [];
    drawObjectsCollection.push(drawObject);
    var message = JSON.stringify(drawObjectsCollection);
    whiteboardHub.server.sendDraw(message, $("#sessinId").val(), $("#groupName").val(), $("#userName").val());
  }
}

function toggleBG1() {
  setTimeout(function () { $('#divShare').css("background-color", "silver"); toggleBG2() }, 800);
}
function toggleBG2() {
  setTimeout(function () { $('#divShare').css("background-color", "#C8C8C8"); toggleBG1() }, 800);
}

$(document).ready(function () {

  JoinHub();

  // Load the background Image
  // Draw a background
  var bgImg = new Image;
  bgImg.onload = function ()
  {
    // Extract the background image and store it.
    renderer = new Renderer(bgImg);
    // Activate the default tool.
    SelectTool(tool_default);
    toggleBG1();
  }
  bgImg.src = "/Images/backgrounds/testgroup/background.jpg"

  $("#userName").val("");
  $("#dialog-form").dialog({ autoOpen: false, width: 350, modal: true, closeOnEscape: false });
  $("#dialog-form").dialog("open");
  $("#name").keypress(function (e) {
    if (e && e.keyCode == 13) {
      $("#btnJoin").click();
    }
  });
});

function SelectTool(toolName) {
  if (tools[toolName]) {
    tool = new tools[toolName]();
  }

  if (toolName == "line" || toolName == "curve" || toolName == "measure")
    viewportCanvas.style.cursor = "crosshair";
  else if (toolName == "select")
    viewportCanvas.style.cursor = "default";
  else if (toolName == "text")
    viewportCanvas.style.cursor = "text";

  ChangeIcons(toolName);
}


function ChangeIcons(toolName) {

  if (toolName == "line")
    $("#imgline").attr({ src: "/images/line.png", border: "1px" });
  else
    $("#imgline").attr({ src: "/images/line_dim.png", border: "0px" });

  if (toolName == "pencil")
    $("#imgpencil").attr({ src: "/images/pencil.png", border: "1px" });
  else
    $("#imgpencil").attr({ src: "/images/pencil_dim.png", border: "0px" });

  if (toolName == "rect")
    $("#imgrect").attr({ src: "/images/rect.png", border: "1px" });
  else
    $("#imgrect").attr({ src: "/images/rect_dim.png", border: "0px" });

  if (toolName == "erase")
    $("#imgerase").attr({ src: "/images/erase.png", border: "1px" });
  else
    $("#imgerase").attr({ src: "/images/erase_dim.png", border: "0px" });


  if (toolName == "text")
    $("#imgtext").attr({ src: "/images/text.png", border: "1px" });
  else
    $("#imgtext").attr({ src: "/images/text_dim.png", border: "0px" });
}

function JoinHub() {


  $("#btnJoin").click(function () {

    var name = $("#name").val();
    var name = $.trim(name);

    if (name.length > 0) {
      $("#userName").val(name);



      whiteboardHub = $.connection.whiteboardHub;
      whiteboardHub.client.handleDraw = function (message, sessnId, name) {
        var sessId = $('#sessinId').val();
        // Only draw things from other sessions, we handle our own drawing locally
        if (sessId != sessnId) {
          $("#divStatus").html("");

          $("#divStatus").html("<i>" + name + " drawing...</i>")
          var drawObjectCollection = jQuery.parseJSON(message)
          for (var i = 0; i < drawObjectCollection.length; i++) {
            DrawIt(drawObjectCollection[i], false);
            if (drawObjectCollection[i].DrawState) {
              if (drawObjectCollection[i].DrawState == DrawStates.Completed) {
                $("#divStatus").html("<i>" + name + " drawing completing...</i>")
                $("#divStatus").html("");
              }
            }
          }
        }



      };
      whiteboardHub.client.chatJoined = function (name) {
        $("#divMessage").append("<span><i> <b>" + name + " joined. <br/></b></i></span>");
        $("#dialog-form").dialog("close");
      }
      whiteboardHub.client.chat = function (name, message) {
        $("#divMessage").append("<span>" + name + ": " + message + "</span><br/>");
        var objDiv = document.getElementById("divMessage");
        objDiv.scrollTop = objDiv.scrollHeight;
      };
      var sendMessage = function () {
        whiteboardHub.sendChat($(".chat-message").val(), $("#groupName").val(), $("#userName").val());
      };


      $.connection.hub.start().done(function () {
        whiteboardHub.server.joinGroup($("#groupName").val()).done(function () { whiteboardHub.server.joinChat($("#userName").val(), $("#groupName").val()); });
      });

      $("#btnSend").click(
      function () {
        var message = $("#txtMessage").val();
        var message = $.trim(message);
        if (message.length > 0) {
          whiteboardHub.server.sendChat(message, $("#groupName").val(), $("#userName").val());
          $("#txtMessage").val("");
        }
      }
      );

    }
  });
}
