// Recognition : Alvin George, KPMG

// TODO: Clean up cruft
// There is a 'toolCanvas' which gets cleared and redrawn as the user drags around with the mouse. when the drawing is complete this then gets baked into the canvas fo rthe current layer
// The layers all get baked into the final 'whiteboard' canvas (canvaso - canvasOutput? need renaming) which is transformed correctly depending on user view params.


var DrawState =
{
  Started: 0,
  Inprogress: 1,
  Completed: 2
}
var DrawTool =
{
  Pencil: 0,
  Line: 1,
  Text: 2,
  Rect: 3,
  Oval: 4,
  Erase: 5,
}
var whiteboardHub;
var tool_default = 'line';
var toolCanvas, toolContext, canvaso, contexto, compositingCanvas, compositingContext;

var tool;
var WIDTH;
var HEIGHT;
var INTERVAL = 20;

var mx, my;
var URL = window.webkitURL || window.URL;

var selectedLineWidth = 5;


var drawObjectsCollection = [];
var drawPlaybackCollection = [];

// TODO ultimately shouldn't need these
var eraseTool = new tools.erase();
var panTool = new tools.pan();



function DrawIt(drawObject, syncServer) {


  if (drawObject.Tool == DrawTool.Line) {
    switch (drawObject.currentState) {
      case DrawState.Inprogress:
      case DrawState.Completed:
        // TODO: when completed, draw this to the current layer context and clear the 'working' or 'tool' context
        toolContext.clearRect(0, 0, toolCanvas.width, toolCanvas.height);
        toolContext.beginPath();
        toolContext.moveTo(drawObject.StartX, drawObject.StartY);
        toolContext.lineTo(drawObject.CurrentX, drawObject.CurrentY);
        toolContext.stroke();
        toolContext.closePath();
        if (drawObject.currentState == DrawState.Completed) {
          updatecanvas();
        }
        break;
    }
  }
  else if (drawObject.Tool == DrawTool.Pencil) {

    switch (drawObject.currentState) {
      case DrawState.Started:
        toolContext.beginPath();
        toolContext.moveTo(drawObject.StartX, drawObject.StartY);
        break;
      case DrawState.Inprogress:
      case DrawState.Completed:
        toolContext.lineTo(drawObject.CurrentX, drawObject.CurrentY);
        toolContext.stroke();
        if (drawObject.currentState == DrawState.Completed) {
          updatecanvas();
        }
        break;
    }
  }
  else if (drawObject.Tool == DrawTool.Text) {
    switch (drawObject.currentState) {
      case DrawState.Started:
        toolContext.clearRect(0, 0, toolCanvas.width, toolCanvas.height);
        clear(toolContext);
        toolContext.save();
        toolContext.font = 'normal 16px Calibri';
        toolContext.fillStyle = "blue";
        toolContext.textAlign = "left";
        toolContext.textBaseline = "bottom";
        toolContext.fillText(drawObject.Text, drawObject.StartX, drawObject.StartY);
        toolContext.restore();
        updatecanvas();
        break;

    }


  }
  else if (drawObject.Tool == DrawTool.Erase) {

    switch (drawObject.currentState) {

      case DrawState.Started:
        toolContext.fillStyle = "#FFFFFF";
        toolContext.fillRect(drawObject.StartX, drawObject.StartY, 10, 10);
        toolContext.restore();
        updatecanvas();
        //toolContext.clearRect(drawObject.StartX, drawObject.StartY, 5, 5);
        break;
      case DrawState.Inprogress:
      case DrawState.Completed:
        toolContext.fillStyle = "#FFFFFF";
        toolContext.fillRect(drawObject.CurrentX, drawObject.CurrentY, 10, 10);
        toolContext.restore();
        updatecanvas();
        // toolContext.clearRect(drawObject.CurrentX, drawObject.CurrentY, 5, 5);
        break;
    }


  }
  else if (drawObject.Tool == DrawTool.Rect) {

    switch (drawObject.currentState) {
      case DrawState.Inprogress:
      case DrawState.Completed:
        var x = Math.min(drawObject.CurrentX, drawObject.StartX),
                y = Math.min(drawObject.CurrentY, drawObject.StartY),
                w = Math.abs(drawObject.CurrentX - drawObject.StartX),
                h = Math.abs(drawObject.CurrentY - drawObject.StartY);

        toolContext.clearRect(0, 0, toolCanvas.width, toolCanvas.height);

        if (!w || !h) {
          return;
        }

        toolContext.strokeRect(x, y, w, h);
        if (drawObject.currentState == DrawState.Completed) {
          updatecanvas();
        }
        break;
    }

  }

  // Send the current state of the tool to the server so all clients can see it, but don't do it for pencil as that should only get sent on completion to avoid message spam
  // TODO: Only bother sending on completion for all tools?
  if (syncServer && drawObject.Tool != DrawTool.Pencil) {

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
function DrawObject() {
}
function UpdatePlayback(drawObject) {
  if (drawPlaybackCollection.length > 1000) {
    drawPlaybackCollection = [];
    alert("Playback cache is cleared due to more than 1000 items");
  }
  drawPlaybackCollection.push(drawObject);
}
function Clear() {
  canvaso.hieght = toolCanvas.hieght;
  canvaso.width = toolCanvas.width;
}
function Playback() {
  if (drawPlaybackCollection.length == 0) {
    alert("No drawing to play"); return;
  }
  canvaso.hieght = toolCanvas.hieght;
  canvaso.width = toolCanvas.width;


  for (var i = 0; i < drawPlaybackCollection.length; i++) {
    var drawObject = drawPlaybackCollection[i];
    setTimeout(function () { DrawIt(drawObject, false, false); }, 3000);
  }
  drawPlaybackCollection = [];
}
$(document).ready(function () {

  JoinHub();
  $("#userName").val("");
  $("#dialog-form").dialog({ autoOpen: false, width: 350, modal: true, closeOnEscape: false });
  $("#dialog-form").dialog("open");
  $("#name").keypress(function (e) {
    if (e && e.keyCode == 13) {
      $("#btnJoin").click();
    }
  });

  try {

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
    // suppress right click menu
    /*
    canvaso.oncontextmenu = function () {
      alert('right click');   
      return false;
    }*/

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

    // Activate the default tool.
    SelectTool(tool_default);

    // Attach the mousedown, mousemove and mouseup event listeners.
    toolCanvas.addEventListener('mousedown', ev_canvas, false);
    toolCanvas.addEventListener('mousemove', ev_canvas, false);
    toolCanvas.addEventListener('mouseup', ev_canvas, false);
    toolCanvas.addEventListener('mouseout', ev_canvas, false);
    toolCanvas.addEventListener("wheel", ev_canvas, false);
    // Supress the context menu
    toolCanvas.oncontextmenu = function () { return false; }

    toolContext.clearRect(0, 0, toolCanvas.width, toolCanvas.height);
    toggleBG1();
  }
  catch (err) {
    alert(err.message);
  }

});

function clear(c) {
  c.clearRect(0, 0, WIDTH, HEIGHT);
}

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
    // Handle mouse wheel for zoom
    //var wheelDelta = Math.max(-1, Math.min(1, (ev.wheelDelta || -ev.detail)));
    if (ev.buttons == 4 || ev.buttons == 0) {
      // Call the event handler of the tool.
      var func = panTool[ev.type];

      if (func) {
        func(ev);
      }
    }
    
  }
  catch (err) {
    alert(err.message);
  }
}

function getMouse(e) {
  var element = canvaso, offsetX = 0, offsetY = 0;

  if (element.offsetParent) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  // Add padding and border style widths to offset
  offsetX += stylePaddingLeft;
  offsetY += stylePaddingTop;

  offsetX += styleBorderLeft;
  offsetY += styleBorderTop;

  mx = e.pageX - offsetX;
  my = e.pageY - offsetY;

  mx = e._x;
  my = e._y;
}


function updatecanvas() {
  // TODO: background image size
  compositingContext.clearRect(0, 0, compositingCanvas.width, compositingCanvas.height);

  // Draw a background
  var img = new Image;
  img.src = "/images/pencil_dim.png";
  // TODO make sure that the images is loaded, ideally use the onLoad() function for the document element (hidden?)
  var w = img.width;
  var h = img.height;
  compositingContext.drawImage(img, 0, 0, w, h);

  // Shouldn't do anything with the tool context here, as this is an overlay that will be baked in when tool is finished.
  compositingContext.drawImage(toolCanvas, 0, 0, toolCanvas.width, toolCanvas.height); // TODO: Stretch layers to match background

  compositingContext.fillText(panTool.panX, 10, 10); // TODO: Stretch layers to match background
  compositingContext.fillText(panTool.panY, 30, 10); // TODO: Stretch layers to match background

  // copy the generated content (with tiling)
  contexto.clearRect(-canvaso.width, -canvaso.height, canvaso.width * 3, canvaso.height * 3);
  contexto.setTransform(1, 0, 0, 1, panTool.panX, panTool.panY);

  contexto.drawImage(compositingCanvas, 0, 0);
  contexto.drawImage(compositingCanvas, -canvaso.width, -canvaso.height);
  contexto.drawImage(compositingCanvas, 0, -canvaso.height);
  contexto.drawImage(compositingCanvas, canvaso.width, -canvaso.height);
  contexto.drawImage(compositingCanvas, -canvaso.width, 0);
  contexto.drawImage(compositingCanvas, 0, 0);
  contexto.drawImage(compositingCanvas, canvaso.width, 0);
  contexto.drawImage(compositingCanvas, -canvaso.width, canvaso.height);
  contexto.drawImage(compositingCanvas, 0, canvaso.height);
  contexto.drawImage(compositingCanvas, canvaso.width, canvaso.height);

  // Clear the temporary canvas
  contexto.drawImage(compositingCanvas, 0, 0); // TODO: Stretch layers to match background
  toolContext.clearRect(0, 0, toolCanvas.width, toolCanvas.height);
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

function fireEvent(element, event) {
  var evt;
  if (document.createEventObject) {
    // dispatch for IE
    evt = document.createEventObject();
    return element.fireEvent('on' + event, evt)
  }
  else {
    // dispatch for firefox + others
    evt = document.createEvent("HTMLEvents");
    evt.initEvent(event, true, true); // event type,bubbling,cancelable
    return !element.dispatchEvent(evt);
  }
}

function UpdateCanvas() {
  var file_UploadImg = document.getElementById("fileUploadImg");
  LoadImageIntoCanvas(URL.createObjectURL(file_UploadImg.files[0]));
}

function LoadImageIntoCanvas(bgImageUrl) {

  var image_View = document.getElementById("imageView");
  var ctx = image_View.getContext("2d");

  var img = new Image();
  img.onload = function () {
    image_View.width = img.width;
    image_View.height = img.height;
    WIDTH = img.width;
    HEIGHT = img.height;
    ctx.clearRect(0, 0, image_View.width, image_View.height);
    ctx.drawImage(img, 1, 1, img.width, img.height);
  }
  img.src = bgImageUrl;

  // Activate the default tool.
  SelectTool(tool_default);
}

function getAbsolutePosition(e) {
  var curleft = curtop = 0;
  if (e.offsetParent) {
    curleft = e.offsetLeft;
    curtop = e.offsetTop;
    while (e = e.offsetParent) {
      curleft += e.offsetLeft;
      curtop += e.offsetTop;
    }
  }
  return [curleft, curtop];
}

function SaveDrawings() {


  var img = canvaso.toDataURL("image/png");
  WindowObject = window.open('', "PrintPaintBrush", "toolbars=no,scrollbars=yes,status=no,resizable=no");
  WindowObject.document.open();
  WindowObject.document.writeln('<img src="' + img + '"/>');
  WindowObject.document.close();
  WindowObject.focus();

}







var drawobjects = [];


function JoinHub() {


  $("#btnJoin").click(function () {

    var name = $("#name").val();
    var name = $.trim(name);

    if (name.length > 0) {
      $("#userName").val(name);



      whiteboardHub = $.connection.whiteboardHub;
      whiteboardHub.client.handleDraw = function (message, sessnId, name) {
        var sessId = $('#sessinId').val();
        if (sessId != sessnId) {
          $("#divStatus").html("");

          $("#divStatus").html("<i>" + name + " drawing...</i>")
          var drawObjectCollection = jQuery.parseJSON(message)
          for (var i = 0; i < drawObjectCollection.length; i++) {
            DrawIt(drawObjectCollection[i], false);
            if (drawObjectCollection[i].currentState) {
              if (drawObjectCollection[i].currentState == DrawState.Completed) {
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
