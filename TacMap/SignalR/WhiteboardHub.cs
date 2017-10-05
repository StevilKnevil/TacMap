using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR.Hubs;
using System.Threading.Tasks;
using System.Data.SqlClient;

namespace TacMap.SignalR
{
  /// <summary>
  /// 
  /// </summary>
  [HubName("whiteboardHub")]
  public class WhiteboardHub : Hub
  {
    /// <summary>
    /// 
    /// </summary>
    private Dictionary<string, SqlConnection> sqlConnectionLookup = new Dictionary<string, SqlConnection>();

    /// <summary>
    /// 
    /// </summary>
    /// <param name="conn"></param>
    /// <param name="tableName"></param>
    /// <returns></returns>
    private bool checkTableExists(SqlConnection conn, string tableName)
    {
      // https://stackoverflow.com/questions/464474/check-if-a-sql-table-exists
      bool exists = false;
      try
      {
        // ANSI SQL way.  Works in PostgreSQL, MSSQL, MySQL.  
        using (var cmd = new SqlCommand(
          "select case when exists((select * from information_schema.tables where table_name = '" + tableName + "')) then 1 else 0 end"))
        {
          conn.Open();
          cmd.Connection = conn;
          exists = (int)cmd.ExecuteScalar() == 1;
          conn.Close();
        }
      }
      catch
      {
        exists = false;
      }
      return exists;
    }

    /// <summary>
    /// 
    /// </summary>
    /// <param name="groupName"></param>
    /// <returns></returns>
    private SqlConnection ensureDBConnection(string groupName)
    {
      // Ensure that groupName is correctly formatted
      System.Text.RegularExpressions.Regex r = new System.Text.RegularExpressions.Regex("^[a-zA-Z0-9]*$");
      if (!r.IsMatch(groupName))
      {
        throw new ArgumentException("Only alpha-numeirc characters allowed");
      }

      if (!sqlConnectionLookup.ContainsKey(groupName))
      {
        // pass all the info so far.
        string connStr = System.Web.Configuration.WebConfigurationManager.ConnectionStrings["LocalDrawItemsDB"].ConnectionString;

        // TODO: before connecting make sure the DB exists:
        // https://stackoverflow.com/questions/2232227/check-if-database-exists-before-creating
        var newConnection = new SqlConnection(connStr);

        // See if the table exists for this (and create if not)
        {
          if (!checkTableExists(newConnection, groupName))
          {
            // Create the db
            // https://stackoverflow.com/questions/9015142/creating-a-database-programmatically-in-sql-server
            string createCommandStr = @"CREATE TABLE {0} (" +
                "[Tool] TINYINT NOT NULL, " +
                "[StartX] SMALLINT NOT NULL, " +
                "[StartY] SMALLINT NOT NULL, " +
                "[EndX] SMALLINT NOT NULL, " +
                "[EndY] SMALLINT NOT NULL" +
                ");";
            using (var createCommand = new SqlCommand(String.Format(createCommandStr, groupName)))
            {
              newConnection.Open();
              createCommand.Connection = newConnection;
              createCommand.ExecuteNonQuery();
              newConnection.Close();
            }
          }
        }

        // TODO: Dispose of these on shutdown
        sqlConnectionLookup[groupName] = newConnection;
      }
      return sqlConnectionLookup[groupName];
    }

    /// <summary>
    /// 
    /// </summary>
    public WhiteboardHub()
    {
    }

    /// <summary>
    /// 
    /// </summary>
    /// <param name="groupName"></param>
    public void JoinGroup(string groupName)
    {
      System.Text.RegularExpressions.Regex r = new System.Text.RegularExpressions.Regex("^[a-zA-Z0-9]*$");
      if (!r.IsMatch(groupName))
      {
        throw new ArgumentException("Only alpha-numeirc characters allowed");
      }

      // Add the connection
      Groups.Add(Context.ConnectionId, groupName);

      // Send all the history of drawn objects to the new client to make sure it's up to date.
      List<Backend.DrawItem> drawItems = new List<Backend.DrawItem>();

      using (var sqlConnection = ensureDBConnection(groupName))
      {
        sqlConnection.Open();
        string cmdString = "SELECT * FROM {0};";
        using (var sqlCommand = new SqlCommand(String.Format(cmdString, groupName), sqlConnection))
        {
          SqlDataReader reader = sqlCommand.ExecuteReader();
          while (reader.Read())
          {
            Backend.DrawItem di = new Backend.DrawItem();
            di.Tool = (Backend.DrawItem.Tools)Convert.ToInt32(reader["Tool"]);
            di.StartX = Convert.ToInt32(reader["StartX"]);
            di.StartY = Convert.ToInt32(reader["StartY"]);
            di.CurrentX = Convert.ToInt32(reader["EndX"]);
            di.CurrentY = Convert.ToInt32(reader["EndY"]);
            di.DrawState = Backend.DrawItem.DrawStates.Completed; // all data ion teh DB is completed (i.e. state 2)

            drawItems.Add(di);
          }
          // TODO: Close the reader
        }
        sqlConnection.Close();
      }

      string json = Backend.DrawItem.ToJson(drawItems);
      // Consider having a seperate function for server historic data calls?
      Clients.Caller.HandleDraw(json, "<no session>", "Server");
    }

    /// <summary>
    /// 
    /// </summary>
    /// <param name="name"></param>
    /// <param name="groupName"></param>
    public void JoinChat(string name, string groupName)
    {
      Clients.Group(groupName).ChatJoined(name);
    }

    /// <summary>
    /// 
    /// </summary>
    /// <param name="drawObject"></param>
    /// <param name="sessionId"></param>
    /// <param name="groupName"></param>
    /// <param name="name"></param>
    public void SendDraw(string drawObject, string sessionId, string groupName, string name)
    {
      // Ensure that groupName is correctly formatted
      System.Text.RegularExpressions.Regex r = new System.Text.RegularExpressions.Regex("^[a-zA-Z0-9]*$");
      if (!r.IsMatch(groupName))
      {
        throw new ArgumentException("Only alpha-numeirc characters allowed");
      }

      IList<Backend.DrawItem> diList = Backend.DrawItem.FromJson(drawObject);
      foreach(var di in diList)
      {
        if (di.DrawState == Backend.DrawItem.DrawStates.Completed)
        {
          SqlConnection sqlCon = ensureDBConnection(groupName);
          sqlCon.Open();
          var insertCommand = "INSERT INTO {0} (Tool, StartX, StartY, EndX, EndY) VALUES(@tool, @startX, @startY, @endX, @endY)";
          using (var cmd = new SqlCommand(String.Format(insertCommand, groupName), sqlCon))
          {
            cmd.Parameters.AddWithValue("@tool", di.Tool);
            cmd.Parameters.AddWithValue("@startX", di.StartX);
            cmd.Parameters.AddWithValue("@startY", di.StartY);
            cmd.Parameters.AddWithValue("@endX", di.CurrentX);
            cmd.Parameters.AddWithValue("@endY", di.CurrentY);
            cmd.ExecuteNonQuery();
          }
          sqlCon.Close();
        }
      }

      // Pass the string onto other clients
      Clients.Group(groupName).HandleDraw(drawObject, sessionId, name);
    }

    /// <summary>
    /// 
    /// </summary>
    /// <param name="message"></param>
    /// <param name="groupName"></param>
    /// <param name="name"></param>
    public void SendChat(string message, string groupName, string name)
    {
      Clients.Group(groupName).Chat(name, message);
    }


  }
}