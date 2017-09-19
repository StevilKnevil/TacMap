using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Microsoft.AspNet.SignalR;
using OnlineWhiteBoard_4.SignalR;

namespace OnlineWhiteBoard_4.Controllers
{
    public class HomeController : Controller
    {

        public ActionResult Index(string p )
        {
            ViewData["IsNewGroup"] = false;
            if (string.IsNullOrWhiteSpace(p))
            {


                Guid g = Guid.NewGuid();
                p = Convert.ToBase64String(g.ToByteArray());
                p = p.Replace("=", "");
                p = p.Replace("+", "");
                ViewData["IsNewGroup"] = true;
                ViewData["url"] = Request.Url.AbsoluteUri.ToString() + "?p=" + p;
            }
            else
            {
                ViewData["url"] = Request.Url.AbsoluteUri.ToString();
            }

            ViewData["GroupName"] = p;
            ViewBag.GroupName = p;
           
            
            return View();
        }
      
        public ActionResult About()
        {
            ViewBag.Message = "Your app description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
        public ActionResult Whiteboard()
        {
            return View();
        }
    }
}
