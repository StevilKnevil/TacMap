using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR.Hubs;
using System.Threading.Tasks;
using System.Data.SqlClient;

namespace TacMap.SignalR
{
  [HubName("whiteboardHub")]
  public class WhiteboardHub : Hub
  {
    Dictionary<string, SqlConnection> sqlConnectionLookup = new Dictionary<string, SqlConnection>();

    public SqlConnection EnsureDBConnection(string groupName)
    {
      if (!sqlConnectionLookup.ContainsKey(groupName))
      {
        // pass all the info so far.
        string dataSource = @"(localdb)\MSSQLLocalDB";
        string connStr = string.Format(@"Data Source={0};Initial Catalog={1};Integrated Security=True;Connect Timeout=30;Encrypt=False;TrustServerCertificate=True;ApplicationIntent=ReadWrite;MultiSubnetFailover=False",
          dataSource, groupName);

        // TODO: before connecting make sure the DB exists:
        // https://stackoverflow.com/questions/2232227/check-if-database-exists-before-creating

        // See if it exists (and create if not)
        {
          // TODO create a new connection to master.dbo.sysdatabases
          using (var cmd = new SqlCommand($"SELECT db_id('@dbName')"))
          {
            cmd.Parameters.AddWithValue("@dbName", "groupName");
            conn.Open();
            if (cmd.ExecuteScalar() == DBNull.Value)
            {
              // Create the db
              // https://stackoverflow.com/questions/9015142/creating-a-database-programmatically-in-sql-server
              string createCommandStr = @"CREATE TABLE @dbName (
                [Tool] TINYINT NOT NULL, 
                [StartX] SMALLINT NOT NULL, 
                [StartY] SMALLINT NOT NULL, 
                [EndX] SMALLINT NOT NULL, 
                [EndY] SMALLINT NOT NULL
            );";
              using (var createCommand = new SqlCommand(createCommandStr))
              {
                createCommand.Parameters.AddWithValue("@dbName", "groupName");
                createCommand.ExecuteNonQuery();
              }
              conn.Close();
            }
          }
        }

        // TODO: Dispose of these on shutdown
        var newConnection = new SqlConnection(connStr);
        sqlConnectionLookup[groupName] = newConnection;
      }
      return sqlConnectionLookup[groupName];
    }

    public WhiteboardHub()
    {
    }

    public void JoinGroup(string groupName)
    {
      Groups.Add(Context.ConnectionId, groupName);
    }
    public void JoinChat(string name, string groupName)
    {
      Clients.Group(groupName).ChatJoined(name);
    }

    public void SendDraw(string drawObject, string sessionId, string groupName, string name)
    {
      Backend.DrawItem di = Backend.DrawItem.FromJson(drawObject);

      /*
CREATE TABLE [dbo].[drawItems] (
    [Tool] TINYINT NOT NULL, 
    [StartX] SMALLINT NOT NULL, 
    [StartY] SMALLINT NOT NULL, 
    [EndX] SMALLINT NOT NULL, 
    [EndY] SMALLINT NOT NULL
);
       */
      if (di.DrawState == Backend.DrawItem.DrawStates.Completed)
      {
        SqlConnection sqlCon = EnsureDBConnection(groupName);
        sqlCon.Open();
        var insertCommand = "INSERT INTO dbo.drawItems (Tool) VALUES(@item)";
        using (var cmd = new SqlCommand(insertCommand, sqlCon))
        {
          cmd.Parameters.AddWithValue("@item", "frist");
          cmd.ExecuteNonQuery();
        }
        sqlCon.Close();
      }

      Clients.Group(groupName).HandleDraw(drawObject, sessionId, name);
    }

    public void SendChat(string message, string groupName, string name)
    {
      Clients.Group(groupName).Chat(name, message);
    }


  }
}