// Recognition : Alvin George, KPMG

// TODO: Clean up cruft
// There is a 'transientViewportCanvas' which gets cleared and redrawn as the user drags around with the mouse. when the drawing is complete this then gets baked into the canvas fo rthe current layer
// The layers all get baked into the final 'whiteboard' canvas (canvaso - canvasoutput? need renaming) which is transformed correctly depending on user view params.

var whiteboardHub;
var tool_default = 'line';

var tool;

var drawObjectsCollection = [];

//---------------------------------------------------------------------------------------------------------------------
function DrawCreationTool(drawObject) {
  // TODO: Instead we should store a list of 'immediate mode objects' from all clients and then have a (60Hz?) interval to update it.

  // Clear the creation context first
  transientWorkingContext.clearRect(0, 0, transientWorkingCanvas.width, transientWorkingCanvas.height);

  var ctx = transientWorkingContext;

  if (drawObject.Tool == DrawTools.Line) {
    ctx.beginPath();
    ctx.moveTo(drawObject.StartX, drawObject.StartY);
    ctx.lineTo(drawObject.CurrentX, drawObject.CurrentY);
    ctx.stroke();
  }
  else if (drawObject.Tool == DrawTools.Pencil) {
    // TODO - we apply the eraser and pencil immediately - the creation tool should be a chose of the brush used
  }
  else if (drawObject.Tool == DrawTools.Text) {
    ctx.clearRect(0, 0, transientViewportCanvas.width, transientViewportCanvas.height);
    ctx.save();
    ctx.font = 'normal 16px Calibri';
    ctx.fillStyle = "blue";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(drawObject.Text, drawObject.StartX, drawObject.StartY);
    ctx.restore();
  }
  else if (drawObject.Tool == DrawTools.Erase) {
    // TODO - we apply the eraser and pencil immediately - the creation tool should be a chose of the brush used
  }
  else if (drawObject.Tool == DrawTools.Rect) {
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

//---------------------------------------------------------------------------------------------------------------------
function DrawTool(drawObject, dontSyncToServer) {

  // TODO: Clear the transient canvas now we're comitting the shape to permanent. All fixed when reimplemented to store a list of transient shapes and redraw it when it changes.

  var ctx = layerContext;

  if (drawObject.Tool == DrawTools.Line) {
    ctx.beginPath();
    ctx.moveTo(drawObject.StartX, drawObject.StartY);
    ctx.lineTo(drawObject.CurrentX, drawObject.CurrentY);
    ctx.stroke();
    ctx.closePath();
  }
  else if (drawObject.Tool == DrawTools.Pencil) {
    ctx.beginPath();
    ctx.moveTo(drawObject.StartX, drawObject.StartY);
    ctx.lineTo(drawObject.CurrentX, drawObject.CurrentY);
    ctx.strokeStyle = '#ff0000';
    ctx.stroke();
  }
  else if (drawObject.Tool == DrawTools.Text) {
    ctx.clearRect(0, 0, transientViewportCanvas.width, transientViewportCanvas.height);
    ctx.save();
    ctx.font = 'normal 16px Calibri';
    ctx.fillStyle = "blue";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(drawObject.Text, drawObject.StartX, drawObject.StartY);
    ctx.restore();
  }
  else if (drawObject.Tool == DrawTools.Erase) {
    transientViewportContext.fillStyle = "#FFFFFF";
    transientViewportContext.fillRect(drawObject.StartX, drawObject.StartY, 10, 10);
    transientViewportContext.restore();
  }
  else if (drawObject.Tool == DrawTools.Rect) {
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
  renderer.updateViewport();

  // Send the current state of the tool to the server so all clients can see it
  // Consider pencil: will we get message spam?
  if (!dontSyncToServer)
  {
    drawObjectsCollection = [];
    drawObjectsCollection.push(drawObject);
    var message = JSON.stringify(drawObjectsCollection);
    whiteboardHub.server.sendDraw(message, $("#sessinId").val(), $("#groupName").val(), $("#userName").val());
  }
}

//---------------------------------------------------------------------------------------------------------------------
function toggleBG1() {
  setTimeout(function () { $('#divShare').css("background-color", "silver"); toggleBG2() }, 800);
}
//---------------------------------------------------------------------------------------------------------------------
function toggleBG2() {
  setTimeout(function () { $('#divShare').css("background-color", "#C8C8C8"); toggleBG1() }, 800);
}

//---------------------------------------------------------------------------------------------------------------------
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

//---------------------------------------------------------------------------------------------------------------------
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


//---------------------------------------------------------------------------------------------------------------------
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

//---------------------------------------------------------------------------------------------------------------------
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
            // Don't need to sync this to server, as it has come from the server
            DrawTool(drawObjectCollection[i], true);
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
