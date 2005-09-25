/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Nightly Tester Tools.
 *
 * The Initial Developer of the Original Code is
 *      Dave Townsend <dave.townsend@blueprintit.co.uk>.
 *
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK *****
 *
 * $HeadURL$
 * $LastChangedBy$
 * $Date$
 * $Revision$
 *
 */

var UpdateChannels = 
{
  changeChannel: function()
  {
    var directoryService = Components.classes["@mozilla.org/file/directory_service;1"].
										getService(Components.interfaces.nsIProperties);
	  file = directoryService.get("XCurProcD",Components.interfaces.nsIFile);
    file.append("defaults");
    file.append("pref");
    file.append("channel-prefs.js");
    if (file.isWritable())
    {
      var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"]
                          .getService(Components.interfaces.nsIRDFService);
  
      var idprop = rdfService.GetResource("http://mossop.blueprintit.co.uk/updatechannel#id");
      
      var list = document.getElementById("channelList");     
      var ds = list.database;
      var res = list.selectedItem.resource;
      var result = ds.GetTarget(res,idprop,true);
      
      var channel = null;
      try
      {
        result=result.QueryInterface(Components.interfaces.nsIRDFLiteral);
        channel=result.Value;
        var line = "pref(\"app.update.channel\", \""+channel+"\");\n";

        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                         .createInstance(Components.interfaces.nsIFileOutputStream);

        foStream.init(file, 0x02 | 0x08 | 0x20, file.permissions, 0); // write, create, truncate
        foStream.write(line, line.length);
        foStream.close();

        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService);
        prefs.resetPrefs();
      }
      catch (e)
      {
      }
    }
  },
  
  channelSelected: function()
  {
    var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"]
                        .getService(Components.interfaces.nsIRDFService);

    var descprop = rdfService.GetResource("http://mossop.blueprintit.co.uk/updatechannel#description");
    
    var list = document.getElementById("channelList");
    var desc = document.getElementById("channelDescription");
    
    var ds = list.database;
    var res = list.selectedItem.resource;
    var result = ds.GetTarget(res,descprop,true);
    
    var text = null;
    try
    {
      result=result.QueryInterface(Components.interfaces.nsIRDFLiteral);
      text=result.Value;
    }
    catch (e)
    {
      text="No description";
    }
    
    while (desc.firstChild)
    {
      desc.removeChild(desc.firstChild);
    }
    desc.appendChild(document.createTextNode(text));
  },
  
  setupWindow: function()
  {
    var em = Components.classes["@mozilla.org/extensions/manager;1"]
                        .getService(Components.interfaces.nsIExtensionManager);
    var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"]
                        .getService(Components.interfaces.nsIRDFService);
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                        .getService(Components.interfaces.nsIIOService);
    var fph = ioService.getProtocolHandler("file").QueryInterface(Components.interfaces.nsIFileProtocolHandler);
    var defaults = Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService).getDefaultBranch(null);

    var extensionID = "updatechannel@blueprintit.co.uk";
    var installLocation = em.getInstallLocation(extensionID);
    var rdffile = installLocation.getItemFile(extensionID, "channels.rdf");
    var rdfuri = fph.getURLSpecFromFile(rdffile);
    
    var ds = rdfService.GetDataSourceBlocking(rdfuri);
    var list = document.getElementById("channelList");
    var crdf = list.database.QueryInterface(Components.interfaces.nsIRDFCompositeDataSource);
    crdf.AddDataSource(ds);
    list.builder.rebuild();
    
    var channel;
    try
    {
      channel = defaults.getCharPref("app.update.channel");
    }
    catch (e)
    {
      channel = "default";
    }
    
    var selected = document.getElementById("urn:blueprintit:updatechannel:"+channel);
    if (!selected && channel!="default")
    {
      selected = document.getElementById("urn:blueprintit:updatechannel:default");
    }
    
    if (selected)
    {
      list.selectedItem=selected;
      UpdateChannels.channelSelected();
    }
    else
    {
      alert("Bad channel: "+channel);
    }
  }
};

window.addEventListener("load",UpdateChannels.setupWindow,false);
