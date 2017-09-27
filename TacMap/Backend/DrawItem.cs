using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TacMap.Backend
{
  public class DrawItem
  {
    public enum Tools
    {
      Pencil = 0,
      Line = 1,
      Text = 2,
      Rect = 3,
      Oval = 4,
      Erase = 5,
    };

    public enum DrawStates
    {
      Started = 0,
      Inprogress = 1,
      Completed = 2
    }

    public Tools Tool { get; set; }
    public DrawStates DrawState { get; set; }
    public int StartX { get; set; }
    public int StartY { get; set; }
    public int CurrentX { get; set; }
    public int CurrentY { get; set; }

    public static IList<DrawItem> FromJson(string json)
    {
      return JsonConvert.DeserializeObject<List<DrawItem>>(json);
    }

    public static string ToJson(IList<DrawItem> drawItems)
    {
      return JsonConvert.SerializeObject(drawItems);
    }
  }
}