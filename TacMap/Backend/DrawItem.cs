using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Drawing;
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

    public Tools Tool { get; set; }
    public int StartX { get; set; }
    public int StartY { get; set; }
    public int CurrentX { get; set; }
    public int CurrentY { get; set; }
    public int Size { get; set; }
    [JsonConverter(typeof(HTMLColourPropertyConverter))]
    public Color Col { get; set; }

    public static IList<DrawItem> FromJson(string json)
    {
      return JsonConvert.DeserializeObject<List<DrawItem>>(json);
    }

    public static string ToJson(IList<DrawItem> drawItems)
    {
      return JsonConvert.SerializeObject(drawItems);
    }
  }

  internal class HTMLColourPropertyConverter : JsonConverter
  {
    public override bool CanConvert(Type objectType)
    {
      // this converter can be applied to any type
      return true;
    }

    public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
    {
      if (objectType != typeof(Color))
      {
        throw new ArgumentException();
      }

      return System.Drawing.ColorTranslator.FromHtml(reader.Value.ToString());
    }

    public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
    {
      if (value == null)
      {
        serializer.Serialize(writer, null);
        return;
      }

      if (!(value is Color))
      {
        throw new ArgumentException();
      }

      writer.WriteValue(System.Drawing.ColorTranslator.ToHtml((Color)value));
    }
  }
}