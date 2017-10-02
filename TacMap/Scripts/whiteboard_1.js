// Recognition : Alvin George, KPMG

// TODO: Clean up cruft
// There is a 'toolCanvas' which gets cleared and redrawn as the user drags around with the mouse. when the drawing is complete this then gets baked into the canvas fo rthe current layer
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
        toolContext.clearRect(0, 0, toolCanvas.width, toolCanvas.height);
        toolContext.beginPath();
        toolContext.moveTo(drawObject.StartX, drawObject.StartY);
        toolContext.lineTo(drawObject.CurrentX, drawObject.CurrentY);
        toolContext.stroke();
        toolContext.closePath();
        if (drawObject.DrawState == DrawStates.Completed) {
          renderer.doRender();
        }
        break;
    }
  }
  else if (drawObject.Tool == DrawTools.Pencil) {

    switch (drawObject.DrawState) {
      case DrawStates.Started:
        toolContext.beginPath();
        toolContext.moveTo(drawObject.StartX, drawObject.StartY);
        break;
      case DrawStates.Inprogress:
      case DrawStates.Completed:
        toolContext.lineTo(drawObject.CurrentX, drawObject.CurrentY);
        toolContext.stroke();
        if (drawObject.DrawState == DrawStates.Completed) {
          renderer.doRender();
        }
        break;
    }
  }
  else if (drawObject.Tool == DrawTools.Text) {
    switch (drawObject.DrawState) {
      case DrawStates.Started:
        toolContext.clearRect(0, 0, toolCanvas.width, toolCanvas.height);
        toolContext.save();
        toolContext.font = 'normal 16px Calibri';
        toolContext.fillStyle = "blue";
        toolContext.textAlign = "left";
        toolContext.textBaseline = "bottom";
        toolContext.fillText(drawObject.Text, drawObject.StartX, drawObject.StartY);
        toolContext.restore();
        renderer.doRender();
        break;

    }


  }
  else if (drawObject.Tool == DrawTools.Erase) {

    switch (drawObject.DrawState) {

      case DrawStates.Started:
        toolContext.fillStyle = "#FFFFFF";
        toolContext.fillRect(drawObject.StartX, drawObject.StartY, 10, 10);
        toolContext.restore();
        renderer.doRender();
        //toolContext.clearRect(drawObject.StartX, drawObject.StartY, 5, 5);
        break;
      case DrawStates.Inprogress:
      case DrawStates.Completed:
        toolContext.fillStyle = "#FFFFFF";
        toolContext.fillRect(drawObject.CurrentX, drawObject.CurrentY, 10, 10);
        toolContext.restore();
        renderer.doRender();
        // toolContext.clearRect(drawObject.CurrentX, drawObject.CurrentY, 5, 5);
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

        toolContext.clearRect(0, 0, toolCanvas.width, toolCanvas.height);

        if (!w || !h) {
          return;
        }

        toolContext.strokeRect(x, y, w, h);
        if (drawObject.DrawState == DrawStates.Completed) {
          renderer.doRender();
        }
        break;
    }

  }

  /*
  else if (drawObject.Tool == DrawTools.Pan) {
    toolContext.clearRect(0, 0, toolCanvas.width, toolCanvas.height);
    toolContext.fillText(panTool.panX, 10, 10); // TODO: Stretch layers to match background
    toolContext.fillText(panTool.panY, 30, 10); // TODO: Stretch layers to match background
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

  // Clear the creation context first
  toolContext.clearRect(0, 0, toolCanvas.width, toolCanvas.height);

  var ctx = toolContext;

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
          renderer.doRender();
        }
        break;
    }
  }
  else if (drawObject.Tool == DrawTools.Text) {
    switch (drawObject.DrawState) {
      case DrawStates.Started:
        ctx.clearRect(0, 0, toolCanvas.width, toolCanvas.height);
        ctx.save();
        ctx.font = 'normal 16px Calibri';
        ctx.fillStyle = "blue";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(drawObject.Text, drawObject.StartX, drawObject.StartY);
        ctx.restore();
        renderer.doRender();
        break;

    }


  }
  else if (drawObject.Tool == DrawTools.Erase) {

    switch (drawObject.DrawState) {

      case DrawStates.Started:
        toolContext.fillStyle = "#FFFFFF";
        toolContext.fillRect(drawObject.StartX, drawObject.StartY, 10, 10);
        toolContext.restore();
        renderer.doRender();
        break;
      case DrawStates.Inprogress:
      case DrawStates.Completed:
        toolContext.fillStyle = "#FFFFFF";
        toolContext.fillRect(drawObject.CurrentX, drawObject.CurrentY, 10, 10);
        toolContext.restore();
        renderer.doRender();
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

}

function DrawTool(drawObject) {

  var ctx = layerContext;

  /*
  if (drawObject.Tool == DrawTools.Line) {
    switch (drawObject.DrawState) {
      case DrawStates.Inprogress:
      case DrawStates.Completed:
        // TODO: when completed, draw this to the current layer context and clear the 'working' or 'tool' context
        toolContext.clearRect(0, 0, toolCanvas.width, toolCanvas.height);
        toolContext.beginPath();
        toolContext.moveTo(drawObject.StartX, drawObject.StartY);
        toolContext.lineTo(drawObject.CurrentX, drawObject.CurrentY);
        toolContext.stroke();
        toolContext.closePath();
        if (drawObject.DrawState == DrawStates.Completed) {
          renderer.doRender();
        }
        break;
    }
  }
  else if (drawObject.Tool == DrawTools.Pencil) {

    switch (drawObject.DrawState) {
      case DrawStates.Started:
        toolContext.beginPath();
        toolContext.moveTo(drawObject.StartX, drawObject.StartY);
        break;
      case DrawStates.Inprogress:
      case DrawStates.Completed:
        toolContext.lineTo(drawObject.CurrentX, drawObject.CurrentY);
        toolContext.stroke();
        if (drawObject.DrawState == DrawStates.Completed) {
          renderer.doRender();
        }
        break;
    }
  }
  else if (drawObject.Tool == DrawTools.Text) {
    switch (drawObject.DrawState) {
      case DrawStates.Started:
        toolContext.clearRect(0, 0, toolCanvas.width, toolCanvas.height);
        toolContext.save();
        toolContext.font = 'normal 16px Calibri';
        toolContext.fillStyle = "blue";
        toolContext.textAlign = "left";
        toolContext.textBaseline = "bottom";
        toolContext.fillText(drawObject.Text, drawObject.StartX, drawObject.StartY);
        toolContext.restore();
        renderer.doRender();
        break;

    }


  }
  else if (drawObject.Tool == DrawTools.Erase) {

    switch (drawObject.DrawState) {

      case DrawStates.Started:
        toolContext.fillStyle = "#FFFFFF";
        toolContext.fillRect(drawObject.StartX, drawObject.StartY, 10, 10);
        toolContext.restore();
        renderer.doRender();
        break;
      case DrawStates.Inprogress:
      case DrawStates.Completed:
        toolContext.fillStyle = "#FFFFFF";
        toolContext.fillRect(drawObject.CurrentX, drawObject.CurrentY, 10, 10);
        toolContext.restore();
        renderer.doRender();
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
  renderer.doRender();

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
    canvaso.style.cursor = "crosshair";
  else if (toolName == "select")
    canvaso.style.cursor = "default";
  else if (toolName == "text")
    canvaso.style.cursor = "text";

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
