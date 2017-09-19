// Author : Alvin George, KPMG


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
    Rect :3,
    Oval :4,
    Erase: 5,
}
var whiteboardHub;
var tool_default = 'line';
var canvas, context, canvaso, contexto;

var tools = {};
var tool;
var WIDTH;
var HEIGHT;
var INTERVAL = 20;

var mx, my; 
var URL = window.webkitURL || window.URL; 

var selectedLineWidth = 5;

//$('#divShare').css("background-color","gray");
toggleBG1();
function toggleBG1()
{

setTimeout(function() {$('#divShare').css("background-color","silver"); toggleBG2()  },800);
}
function toggleBG2()
{
setTimeout(function() {$('#divShare').css("background-color","#C8C8C8"); toggleBG1()  },800);

}
var drawObjectsCollection = [];
var drawPlaybackCollection=[];
function DrawIt(drawObject, syncServer) {

   
    if (drawObject.Tool == DrawTool.Line) {
        switch (drawObject.currentState) {
            case DrawState.Inprogress:
            case DrawState.Completed:
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.beginPath();
                context.moveTo(drawObject.StartX, drawObject.StartY);
                context.lineTo(drawObject.CurrentX, drawObject.CurrentY);
                context.stroke();
                context.closePath();
                if (drawObject.currentState == DrawState.Completed) {
                    updatecanvas();
                }
                break;
        }
    }
    else if (drawObject.Tool == DrawTool.Pencil) {

        switch (drawObject.currentState) {
            case DrawState.Started:
                context.beginPath();
                context.moveTo(drawObject.StartX, drawObject.StartY);
                break;
            case DrawState.Inprogress:
            case DrawState.Completed:
                context.lineTo(drawObject.CurrentX, drawObject.CurrentY);
                context.stroke();
                if (drawObject.currentState == DrawState.Completed) {
                    updatecanvas();
                }
                break;
        }
    }
    else if (drawObject.Tool == DrawTool.Text) {
        switch (drawObject.currentState) {
            case DrawState.Started:
                context.clearRect(0, 0, canvas.width, canvas.height);
                clear(context);
                context.save();
                context.font = 'normal 16px Calibri';
                context.fillStyle = "blue";
                context.textAlign = "left";
                context.textBaseline = "bottom";
                context.fillText(drawObject.Text, drawObject.StartX, drawObject.StartY);
                context.restore();
                updatecanvas();
                break;

        }
        

    }
    else if (drawObject.Tool == DrawTool.Erase) {

        
                context.fillStyle = "#FFFFFF";
                context.fillRect(drawObject.CurrentX, drawObject.CurrentY, 10, 10);
                context.restore();
                updatecanvas();               
        

        
    }
    else if (drawObject.Tool == DrawTool.Rect) 
    {

    switch (drawObject.currentState) {
            case DrawState.Inprogress:
            case DrawState.Completed:
            var x = Math.min(drawObject.CurrentX, drawObject.StartX),
                    y = Math.min(drawObject.CurrentY, drawObject.StartY),
                    w = Math.abs(drawObject.CurrentX - drawObject.StartX),
                    h = Math.abs(drawObject.CurrentY - drawObject.StartY);

            context.clearRect(0, 0, canvas.width, canvas.height);

                if (!w || !h) {
                    return;
                }

                context.strokeRect(x, y, w, h);
                 if (drawObject.currentState == DrawState.Completed) {
                        updatecanvas();
                    }
                break;
            }
       
    }

//    if (syncServer && drawObject.Tool != DrawTool.Pencil) {

//        drawObjectsCollection = [];
//        drawObjectsCollection.push(drawObject);
//        var message = JSON.stringify(drawObjectsCollection);
//        whiteboardHub.server.sendDraw(message, $("#sessinId").val(),$("#groupName").val(),$("#userName").val());
//    }
}
function DrawObject() {
}
function UpdatePlayback(drawObject)
{
        if(drawPlaybackCollection.length > 1000)
        {
          drawPlaybackCollection=[];
            alert("Playback cache is cleared due to more than 1000 items");
        }
 drawPlaybackCollection.push(drawObject);
 }
 function Clear()
 {
  canvaso.hieght=canvas.hieght;
 canvaso.width=canvas.width;
 }
 function Playback()
 {
  if(drawPlaybackCollection.length==0) 
  {
  alert("No drawing to play"); return;
  }
 canvaso.hieght=canvas.hieght;
 canvaso.width=canvas.width;


        for (var i = 0; i < drawPlaybackCollection.length; i++) {
         var drawObject=drawPlaybackCollection[i];
         setTimeout( function() { DrawIt(drawObject,false,false);}, 3000);
}
   drawPlaybackCollection=[];
 }
$(document).ready(function () {
$("#userName").val("");
    JoinHub();
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

        // Get the 2D canvas context.
        contexto = canvaso.getContext('2d');
        if (!contexto) {
            alert('Error: failed to getContext!');
            return;
        }

        // Add the temporary canvas.
        var container = canvaso.parentNode;
//        container.style.width = 750 + "px";
//        container.style.height = 450 + "px";

        canvas = document.createElement('canvas');
        if (!canvas) {
            alert('Error: Cannot create a new canvas element!');
            return;
        }

        canvas.id = 'imageTemp';
        canvas.width = canvaso.width;
        canvas.height = canvaso.height;
        container.appendChild(canvas);

        context = canvas.getContext('2d');

        // Activate the default tool.
        SelectTool(tool_default);

        // Attach the mousedown, mousemove and mouseup event listeners.
        canvas.addEventListener('mousedown', ev_canvas, false);
        canvas.addEventListener('mousemove', ev_canvas, false);
        canvas.addEventListener('mouseup', ev_canvas, false);
        canvas.addEventListener('mouseout', ev_canvas, false);
        context.clearRect(0, 0, canvas.width, canvas.height);

    }
    catch (err) {
        alert(err.message);
    }

});

function clear(c) {
    c.clearRect(0, 0, WIDTH, HEIGHT);
}

function ev_canvas(ev) {
var iebody=(document.compatMode && document.compatMode != "BackCompat")? document.documentElement : document.body

var dsocleft=document.all? iebody.scrollLeft : pageXOffset
var dsoctop=document.all? iebody.scrollTop : pageYOffset
var appname=window.navigator.appName;
    try {
        if (ev.layerX || ev.layerX == 0) {  // Firefox
            ev._x = ev.layerX;
            if('Netscape'==appname)
            ev._y = ev.layerY;
            else
            ev._y = ev.layerY-dsoctop;

        } else if (ev.offsetX || ev.offsetX == 0) { // Opera
            ev._x = ev.offsetX;
            ev._y = ev.offsetY-dsoctop;
        }

        // Call the event handler of the tool.
        var func = tool[ev.type];

        if (func) {
            func(ev);
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
    contexto.drawImage(canvas, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
}

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
            whiteboardHub.server.sendDraw(message, $("#sessinId").val(),$("#groupName").val(),$("#userName").val());

        }
    };
    this.mouseout = function (ev) {
        if (tool.started) {
            var message = JSON.stringify(drawObjectsCollection);
            whiteboardHub.server.sendDraw(message, $("#sessinId").val(),$("#groupName").val(),$("#userName").val());
        }
        tool.started = false; 

    }
};

tools.rect = function () {
    var tool = this;
    var drawObject = new DrawObject();
    drawObject.Tool = DrawTool.Rect;
    this.started = false;
     drawObjectsCollection = [];
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
        drawObjectsCollection.push(drawObject);
    };

    this.mouseup = function (ev) {
        if (tool.started) {
           drawObject.currentState = DrawState.Completed;
            drawObject.CurrentX = ev._x;
            drawObject.CurrentY = ev._y;
            DrawIt(drawObject, true);
            drawObjectsCollection.push(drawObject);
            tool.started = false;
             var message = JSON.stringify(drawObjectsCollection);
            whiteboardHub.server.sendDraw(message, $("#sessinId").val(),$("#groupName").val(),$("#userName").val());
            
        }
    };
};

tools.line = function () {
    var tool = this;
    var drawObject = new DrawObject();
    drawObject.Tool = DrawTool.Line;
    this.started = false;
    drawObjectsCollection=[];
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
        drawObjectsCollection.push(drawObject);
    };

    this.mouseup = function (ev) {
        if (tool.started) {
            drawObject.currentState = DrawState.Completed;
            drawObject.CurrentX = ev._x;
            drawObject.CurrentY = ev._y;
            DrawIt(drawObject,true);  
            drawObjectsCollection.push(drawObject);         
            tool.started = false;
             var message = JSON.stringify(drawObjectsCollection);
            whiteboardHub.server.sendDraw(message, $("#sessinId").val(),$("#groupName").val(),$("#userName").val());
        }
    };
};

tools.text = function () {
    var tool = this;
    this.started = false;
    var drawObject = new DrawObject();
    drawObject.Tool = DrawTool.Text;
    drawObjectsCollection=[];
    this.mousedown = function (ev) {

        if (!tool.started) {
            tool.started = true;
            drawObject.currentState = DrawState.Started;
            drawObject.StartX = ev._x;
            drawObject.StartY = ev._y;
            var text_to_add = prompt('Enter the text:', ' ', 'Add Text');
            drawObject.Text = "";
            drawObject.Text = text_to_add;
            if(text_to_add.length<1)
            {
            tool.started = false;
            return;
            }
             
            DrawIt(drawObject, true);
            drawObjectsCollection.push(drawObject);
             var message = JSON.stringify(drawObjectsCollection);
            whiteboardHub.server.sendDraw(message, $("#sessinId").val(),$("#groupName").val(),$("#userName").val());
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
    drawObjectsCollection=[];
    this.mousedown = function (ev) {
        tool.started = true;
        drawObject.currentState = DrawState.Started;
        drawObject.CurrentX = ev._x;
        drawObject.CurrentY = ev._y;
        DrawIt(drawObject,true);
        drawObjectsCollection.push(drawObject);
         var message = JSON.stringify(drawObjectsCollection);
            whiteboardHub.server.sendDraw(message, $("#sessinId").val(),$("#groupName").val(),$("#userName").val());
    };
    this.mousemove = function (ev) {
        if (!tool.started) {
            return;
        }
        drawObject.currentState = DrawState.Inprogress;
        drawObject.CurrentX = ev._x;
        drawObject.CurrentY = ev._y;
        DrawIt(drawObject,true);
        drawObjectsCollection.push(drawObject);
         var message = JSON.stringify(drawObjectsCollection);
            whiteboardHub.server.sendDraw(message, $("#sessinId").val(),$("#groupName").val(),$("#userName").val());
    };
    this.mouseup = function (ev) {
        drawObject.currentState = DrawState.Completed;
        drawObject.CurrentX = ev._x;
        drawObject.CurrentY = ev._y;
        DrawIt(drawObject,true);
        drawObjectsCollection.push(drawObject);
         var message = JSON.stringify(drawObjectsCollection);
            whiteboardHub.server.sendDraw(message, $("#sessinId").val(),$("#groupName").val(),$("#userName").val());
        tool.started = false;
    }
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
function ChangeIcons(toolName)
{

 if(toolName=="line")
  $("#imgline").attr({src:"/images/line.png", border:"1px" });
 else
  $("#imgline").attr({src:"/images/line_dim.png",border:"0px" });

  if(toolName=="pencil")
    $("#imgpencil").attr({src:"/images/pencil.png",border:"1px" });
  else
    $("#imgpencil").attr({src:"/images/pencil_dim.png",border:"0px" });

     if(toolName=="rect")
    $("#imgrect").attr({src:"/images/rect.png",border:"1px" });
  else
    $("#imgrect").attr({src:"/images/rect_dim.png",border:"0px" });

     if(toolName=="erase")
    $("#imgerase").attr({src:"/images/erase.png",border:"1px" });
  else
    $("#imgerase").attr({src:"/images/erase_dim.png", border:"0px" });

    
     if(toolName=="text")
    $("#imgtext").attr({src:"/images/text.png",border:"1px" });
  else
    $("#imgtext").attr({src:"/images/text_dim.png" ,border:"0px"});
 
 

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


function JoinHub()
{
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

            $("#divStatus").html("<i>"+name +" drawing...</i>")
            var drawObjectCollection = jQuery.parseJSON(message)
            for (var i = 0; i < drawObjectCollection.length; i++) {
                DrawIt(drawObjectCollection[i], false);
                if(drawObjectCollection[i].currentState)
                {
                if(drawObjectCollection[i].currentState==DrawState.Completed)
                {
                     $("#divStatus").html("<i>"+name +" drawing completing...</i>")
                     $("#divStatus").html("");
                }
                }
            }
        }
       


    };
    whiteboardHub.client.chatJoined = function(name)       {         
          $("#divMessage").append("<span><i> <b>"+ name+ " joined. <br/></b></i></span>");
       }
     whiteboardHub.client.chat = function (name,message) {
      $("#divMessage").append("<span>"+ name+ ": "+ message+ "</span><br/>");     
            var objDiv = document.getElementById("divMessage");
            objDiv.scrollTop = objDiv.scrollHeight;       
        };
        var sendMessage = function() {
        whiteboardHub.sendChat($(".chat-message").val(),$("#groupName").val(), $("#userName").val());
    };


    $.connection.hub.start().done(function(){ 
    whiteboardHub.server.joinGroup($("#groupName").val()).done(function () {  whiteboardHub.server.joinChat($("#userName").val(),$("#groupName").val()); }) ;
    });

     $("#btnSend").click(
     function ()
     {
       var message = $("#txtMessage").val();
       var message=$.trim(message);
       if(message.length>0)
       {
        whiteboardHub.server.sendChat(message,$("#groupName").val(),$("#userName").val());
        $("#txtMessage").val("");
       }
     }
     );
       $("#dialog-form").dialog("close");
 }
});
}