using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR.Hubs;
using System.Threading.Tasks;

namespace OnlineWhiteBoard_4.SignalR
{
    [HubName("whiteboardHub")]
    public class WhiteboardHub : Hub
    {
        public void JoinGroup( string groupName)
        {

             Groups.Add(Context.ConnectionId, groupName);
            

        }
        public void JoinChat(string name, string groupName)
        {

           
            Clients.Group(groupName).ChatJoined(name);

        }

        public void SendDraw(string drawObject, string sessionId, string groupName,string name)
        {
            Clients.Group(groupName).HandleDraw(drawObject, sessionId, name);
        }

        public void SendChat( string message, string groupName,string name)
        {
            Clients.Group(groupName).Chat(name, message);
        }

        
    }
}