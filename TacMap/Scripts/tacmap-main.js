// There is a 'transientViewportCanvas' which gets cleared and redrawn as the user drags around with the mouse. when the drawing is complete this then gets baked into the canvas fo rthe current layer
// The layers all get baked into the final 'output' or 'viewport' canvas which is transformed correctly depending on user view params.

var tacMapHub;
var tool;

var drawObjectsCollection = [];

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
    if (bgImg.width == 0 || bgImg.height == 0)
    {
      // Image doesn't exist so default to an empty image
      bgImg.width = 256;
      bgImg.height = 256;
    }

    renderer = new Renderer(bgImg);
  }
  bgImg.src = "/Images/backgrounds/" + $("#groupName").val() + "/background.jpg"

  $("#userName").val("");
  $("#dialog-form").dialog({ autoOpen: false, width: 350, modal: true, closeOnEscape: false });
  $("#dialog-form").dialog("open");
  $("#name").keypress(function (e) {
    if (e && e.keyCode == 13) {
      $("#btnJoin").click();
    }
  });

  SelectTool('line');
  // Start the flashing
  toggleBG1();
});

//---------------------------------------------------------------------------------------------------------------------
function SelectTool(toolName) {
  if (toolName == "pan")
  {
    tool = panTool;
  }
  else if (toolName == "zoom") {
    tool = zoomTool;
  }
  else if (toolName == "erase") {
    tool = eraseTool;
  }
  else if (tools[toolName]) {
    tool = new tools[toolName]();
  }

  if (toolName == "line" || toolName == "rect" || toolName == "erase")
    transientViewportCanvas.style.cursor = "crosshair";
  else if (toolName == "select")
    transientViewportCanvas.style.cursor = "default";
  else if (toolName == "text")
    transientViewportCanvas.style.cursor = "text";
  else if (toolName == "pan")
    transientViewportCanvas.style.cursor = "move";
  else if (toolName == "zoom")
    transientViewportCanvas.style.cursor = "nw-resize";

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

  if (toolName == "pan")
    $("#imgpan").attr({ src: "/images/pan.png", border: "1px" });
  else
    $("#imgpan").attr({ src: "/images/pan_dim.png", border: "0px" });

  if (toolName == "zoom")
    $("#imgzoom").attr({ src: "/images/zoom.png", border: "1px" });
  else
    $("#imgzoom").attr({ src: "/images/zoom_dim.png", border: "0px" });

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

      tacMapHub = $.connection.tacMapHub;
      tacMapHub.client.handleDraw = function (message, sessnId, name) {
        var sessId = $('#sessinId').val();
        // Only draw things from other sessions, we handle our own drawing locally
        if (sessId != sessnId) {
          $("#divStatus").html("");

          $("#divStatus").html("<i>" + name + " drawing...</i>")
          var drawObjectCollection = jQuery.parseJSON(message)
          for (var i = 0; i < drawObjectCollection.length; i++) {
            // Don't need to sync this to server, as it has come from the server
            renderer.DrawTool(drawObjectCollection[i]);
          }
        }
      };

      tacMapHub.client.chatJoined = function (name) {
        $("#divMessage").append("<span><i> <b>" + name + " joined. <br/></b></i></span>");
        $("#dialog-form").dialog("close");
      }

      tacMapHub.client.chat = function (name, message) {
        $("#divMessage").append("<span>" + name + ": " + message + "</span><br/>");
        var objDiv = document.getElementById("divMessage");
        objDiv.scrollTop = objDiv.scrollHeight;
      };

      var sendMessage = function () {
        tacMapHub.sendChat($(".chat-message").val(), $("#groupName").val(), $("#userName").val());
      };

      $.connection.hub.start().done(function () {
        tacMapHub.server.joinGroup($("#groupName").val()).done(function () { tacMapHub.server.joinChat($("#userName").val(), $("#groupName").val()); });
      });

      $("#btnSend").click(
      function () {
        var message = $("#txtMessage").val();
        var message = $.trim(message);
        if (message.length > 0) {
          tacMapHub.server.sendChat(message, $("#groupName").val(), $("#userName").val());
          $("#txtMessage").val("");
        }
      }
      );

    }
  });
}
