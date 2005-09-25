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
 * The Original Code is Update Channel Selector.
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
  currentChannel: null,
  defaultPrefs: null,
  datasource: null,
  channelPrefsFile: null,
  
  onLoad: function()
  {
    var em = Components.classes["@mozilla.org/extensions/manager;1"]
                        .getService(Components.interfaces.nsIExtensionManager);
    var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"]
                        .getService(Components.interfaces.nsIRDFService);
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                        .getService(Components.interfaces.nsIIOService);
    var fph = ioService.getProtocolHandler("file").QueryInterface(Components.interfaces.nsIFileProtocolHandler);

    var updates = Components.classes["@mozilla.org/updates/update-service;1"]
                        .getService(Components.interfaces.nsIApplicationUpdateService);

    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefService);
    UpdateChannels.defaultPrefs = prefService.getDefaultBranch(null);

    var directoryService = Components.classes["@mozilla.org/file/directory_service;1"].
										getService(Components.interfaces.nsIProperties);
										
	  UpdateChannels.channelPrefsFile = directoryService.get("XCurProcD",Components.interfaces.nsIFile);
    UpdateChannels.channelPrefsFile.append("defaults");
    UpdateChannels.channelPrefsFile.append("pref");
    UpdateChannels.channelPrefsFile.append("channel-prefs.js");

    if (UpdateChannels.channelPrefsFile.isWritable() && updates.canUpdate)
    {
      document.documentElement.goTo("choosechannel");
      var channel = null;
      try
      {
        UpdateChannels.currentChannel = UpdateChannels.defaultPrefs.getCharPref("app.update.channel");
      }
      catch (e)
      {
        UpdateChannels.currentChannel = "default";
      }
  
      var extensionID = "updatechannel@blueprintit.co.uk";
      var installLocation = em.getInstallLocation(extensionID);
      var rdffile = installLocation.getItemFile(extensionID, "channels.rdf");
      var rdfuri = fph.getURLSpecFromFile(rdffile);
      
      UpdateChannels.datasource = rdfService.GetDataSourceBlocking(rdfuri);
      var list = document.getElementById("channelList");
      var crdf = list.database.QueryInterface(Components.interfaces.nsIRDFCompositeDataSource);
      crdf.AddDataSource(UpdateChannels.datasource);
      list.builder.rebuild();
      
      var channelnode = rdfService.GetLiteral(UpdateChannels.currentChannel);
      var idprop = rdfService.GetResource("http://mossop.blueprintit.co.uk/updatechannel#id");
      var res = UpdateChannels.datasource.GetSource(idprop,channelnode,true);
      
      var selected = document.getElementById(res.Value);
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
    else
    {
      document.documentElement.canAdvance=false;
    }
  },
  
  onFinish: function()
  {
    var updates = Components.classes["@mozilla.org/updates/update-service;1"]
                        .getService(Components.interfaces.nsIApplicationUpdateService);
    var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"]
                        .getService(Components.interfaces.nsIRDFService);

    var idprop = rdfService.GetResource("http://mossop.blueprintit.co.uk/updatechannel#id");
    
    var list = document.getElementById("channelList");     
    var res = list.selectedItem.resource;
    var result = UpdateChannels.datasource.GetTarget(res,idprop,true).QueryInterface(Components.interfaces.nsIRDFLiteral);
    
    try
    {
      var channel=result.Value;
      var line = "pref(\"app.update.channel\", \""+channel+"\");\n";

      var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                       .createInstance(Components.interfaces.nsIFileOutputStream);

      foStream.init(UpdateChannels.channelPrefsFile, 0x02 | 0x08 | 0x20, UpdateChannels.channelPrefsFile.permissions, 0); // write, create, truncate
      foStream.write(line, line.length);
      foStream.close();

      UpdateChannels.defaultPrefs.setCharPref("app.update.channel",channel);
      
      if (updates.isDownloading)
        updates.pauseDownload();
        
      var launch = document.getElementById("launchUpdate");
      if (launch.checked)
      {
        var prompter = Components.classes["@mozilla.org/updates/update-prompt;1"]
                                  .createInstance(Components.interfaces.nsIUpdatePrompt);
        prompter.checkForUpdates();
      }
    }
    catch (e)
    {
    }
  },
  
  /*fetchChannelDetails: function(channel)
  {
    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService);
    var defaults = prefService.getDefaultBranch(null);
    prefService=prefService.QueryInterface(Components.interfaces.nsIPrefBranch);

    // Use the override URL if specified.
    var url = null;
    
    try
    {
      url=prefService.getPref("getCharPref", "app.update.url.override");
    }
    catch (e)
    {
    }
    
    // Otherwise, construct the update URL from component parts.
    if (!url)
    {
      try
      {
        url = defaults.getCharPref("app.update.url");
      }
      catch (e)
      {
      }
    }
    
    if (url && url != "")
    {
      var locale = null;
      try
      {
        return prefService.getComplexValue("general.useragent.locale",
                                    Components.interfaces.nsIPrefLocalizedString).data;
      }
      catch (e)
      {
        locale = prefService.getCharPref("general.useragent.locale");
      }
 
  		var gApp = Components.classes['@mozilla.org/xre/app-info;1']
  		                .getService(Components.interfaces.nsIXULAppInfo)
                      .QueryInterface(Components.interfaces.nsIXULRuntime);
                      
      url = url.replace(/%PRODUCT%/g, gApp.name);
      url = url.replace(/%VERSION%/g, gApp.version);
      url = url.replace(/%BUILD_ID%/g, "0000000000");
      url = url.replace(/%BUILD_TARGET%/g, gApp.OS + "_" + gApp.XPCOMABI);
      url = url.replace(/%LOCALE%/g, locale);
      url = url.replace(/%CHANNEL%/g, channel);
      url = url.replace(/\+/g, "%2B");
    }
    dump(url+"\n");
    req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.onreadystatechange = function (aEvt)
    {
      if (req.readyState == 4)
      {
        if(req.status == 200)
          dump(req.responseText+"\n");
        else
          dump("Error loading page\n");
      }
    };
    req.send(null); 
  },*/
  
  checkDownloadState: function()
  {
    var updates = Components.classes["@mozilla.org/updates/update-service;1"]
                        .getService(Components.interfaces.nsIApplicationUpdateService);
    var warning = document.getElementById("downloading");
    warning.hidden=!updates.isDownloading;
  },
  
  channelSelected: function()
  {
    var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"]
                        .getService(Components.interfaces.nsIRDFService);

    var descprop = rdfService.GetResource("http://mossop.blueprintit.co.uk/updatechannel#description");
    var idprop = rdfService.GetResource("http://mossop.blueprintit.co.uk/updatechannel#id");
    
    var list = document.getElementById("channelList");
    var desc = document.getElementById("channelDescription");
    
    var res = list.selectedItem.resource;
    var result = UpdateChannels.datasource.GetTarget(res,descprop,true);
    var id = UpdateChannels.datasource.GetTarget(res,idprop,true).QueryInterface(Components.interfaces.nsIRDFLiteral);
    
    var text = null;
    if (result)
    {
      result=result.QueryInterface(Components.interfaces.nsIRDFLiteral);
      text=result.Value;
    }
    else
    {
      text="No description.";
    }
    document.documentElement.canAdvance=(id.Value != UpdateChannels.currentChannel)
    //UpdateChannels.fetchChannelDetails(id.Value);
     
    while (desc.firstChild)
    {
      desc.removeChild(desc.firstChild);
    }
    desc.appendChild(document.createTextNode(text));
  }
};
