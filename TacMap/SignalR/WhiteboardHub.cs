﻿using System;
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

    public SqlConnection EnsureDBConnection(string groupName)
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
        string dbName = "drawItems";
        string dataSource = @"(localdb)\MSSQLLocalDB";
        string connStr = string.Format(@"Data Source={0};Initial Catalog={1};Integrated Security=True;Connect Timeout=30;Encrypt=False;TrustServerCertificate=True;ApplicationIntent=ReadWrite;MultiSubnetFailover=False",
          dataSource, dbName);

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
      // Ensure that groupName is correctly formatted
      System.Text.RegularExpressions.Regex r = new System.Text.RegularExpressions.Regex("^[a-zA-Z0-9]*$");
      if (!r.IsMatch(groupName))
      {
        throw new ArgumentException("Only alpha-numeirc characters allowed");
      }

      Backend.DrawItem di = Backend.DrawItem.FromJson(drawObject);

      if (di.DrawState == Backend.DrawItem.DrawStates.Completed)
      {
        SqlConnection sqlCon = EnsureDBConnection(groupName);
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

      Clients.Group(groupName).HandleDraw(drawObject, sessionId, name);
    }

    public void SendChat(string message, string groupName, string name)
    {
      Clients.Group(groupName).Chat(name, message);
    }


  }
}