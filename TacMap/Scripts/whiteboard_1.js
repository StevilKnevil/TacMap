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
          renderer.updateLayer();
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
          renderer.updateLayer();
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
        renderer.updateLayer();
        break;

    }


  }
  else if (drawObject.Tool == DrawTools.Erase) {

    switch (drawObject.DrawState) {

      case DrawStates.Started:
        toolContext.fillStyle = "#FFFFFF";
        toolContext.fillRect(drawObject.StartX, drawObject.StartY, 10, 10);
        toolContext.restore();
        renderer.updateLayer();
        //toolContext.clearRect(drawObject.StartX, drawObject.StartY, 5, 5);
        break;
      case DrawStates.Inprogress:
      case DrawStates.Completed:
        toolContext.fillStyle = "#FFFFFF";
        toolContext.fillRect(drawObject.CurrentX, drawObject.CurrentY, 10, 10);
        toolContext.restore();
        renderer.updateLayer();
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
          renderer.updateLayer();
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



function ev_canvas(ev) {
  var iebody = (document.compatMode && document.compatMode != "BackCompat") ? document.documentElement : document.body

  var dsocleft = document.all ? iebody.scrollLeft : pageXOffset
  var dsoctop = document.all ? iebody.scrollTop : pageYOffset
  var appname = window.navigator.appName;

  try {
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


    // LMB
    // TODO: need a way of sending mouseUp to the tool, without looking at button. How does this fit with using RMB and MMB for specific tools? 
    // At the moment all tools get the mouse mouse move when no button is down - giving them all a chance to cancel. Far from ideal!
    // should we temporarily change 'current tool'? maybe that's OK, if we store the previous tool? The toolbar could evenupdate to show that tool.
    // Have a 'tool' base class with an 'exit' function that cleans itself up ok.
    // Imaging if you sragged out of canvas and then selected a new tool? The old one must close gracefully.
    if (ev.buttons == 1 || ev.buttons == 0) {
      // Call the event handler of the tool.
      var func = tool[ev.type];

      if (func) {
        func(ev);
      }
    }
    
    // RMB
    if (ev.buttons == 2 || ev.buttons == 0) {
      // Call the event handler of the tool.
      var func = eraseTool[ev.type];

      if (func) {
        func(ev);
      }
    }

    // MMB
    // TODO: Add a panning tool (and ultimately a zoom tool - handle that normally, and have special case code for middle mouse button. c.f. right mouse for erase.
    if (ev.buttons == 4 || ev.buttons == 0) {
      // Call the event handler of the tool.
      var func = panTool[ev.type];

      if (func) {
        func(ev);
      }
      // Avoid scolling the page - TODO This doesn't work
      //return false;
    }

    // mouse wheel for zoom
    if (ev.type == "wheel")
    {
      zoomTool[ev.type](ev);
      return false;
    }
  }
  catch (err) {
    alert(err.message);
  }
}


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
