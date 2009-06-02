# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is Update Channel Selector.
#
# The Initial Developer of the Original Code is
#      Dave Townsend <dtownsend@oxymoronical.com>.
#
# Portions created by the Initial Developer are Copyright (C) 2008
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****
#
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

const PREF_APP_UPDATE_CHANNEL = "app.update.channel";

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function UpdateChannelService() {
}

UpdateChannelService.prototype = {
  channel: null,
  channels: null,
  prefBranch: null,

  init: function() {
    this.channel = "default";

    var prefs = Cc["@mozilla.org/preferences-service;1"].
                getService(Ci.nsIPrefService);
    this.prefBranch = prefs.getBranch("extensions.updatechannel.")
                           .QueryInterface(Ci.nsIPrefBranch2);
    this.prefBranch.addObserver("", this, false);
    var defaults = prefs.getDefaultBranch(null);
    try {
      this.channel = this.prefBranch.getCharPref("channel");
      defaults.setCharPref(PREF_APP_UPDATE_CHANNEL, this.channel);
    }
    catch (e) {
      try {
        this.channel = defaults.getCharPref(PREF_APP_UPDATE_CHANNEL);
      }
      catch (e) { }
      this.prefBranch.setCharPref("channel", this.channel);
    }
  },

  loadChannels: function() {
    if (this.channels)
      return;

    var json = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
    var ioservice = Cc["@mozilla.org/network/io-service;1"].
                    getService(Ci.nsIIOService);
    var channel = ioservice.newChannel("chrome://channels/locale/channels.js", "UTF-8", null);
    this.channels = json.decodeFromStream(channel.open(), -1);
  },

  // ucsIUpdateChannelService implementation
  get currentChannel() {
    this.loadChannels();
    return this.getUpdateChannel(this.channel);
  },
  
  set currentChannel(val) {
    this.prefBranch.setCharPref("channel", val.id);
  },

  getUpdateChannel: function(id) {
    for (var i = 0; i < this.channels.length; i++) {
      if (this.channels[i].id == id)
        return this.channels[i];
    }
    return null;
  },

  getUpdateChannels: function(countRef) {
    this.loadChannels();

    countRef.value = this.channels.length;
    return this.channels;
  },

  // nsIObserver implementation
  observe: function(subject, topic, data) {
    switch (topic) {
      case "app-startup":
        var os = Cc["@mozilla.org/observer-service;1"].
                 getService(Ci.nsIObserverService);
        os.addObserver(this, "profile-after-change", false);
        os.addObserver(this, "quit-application", false);
        break;
      case "profile-after-change":
        this.init();
        break;
      case "nsPref:changed":
        switch (data) {
          case "channel":
            var defaults = Cc["@mozilla.org/preferences-service;1"].
                           getService(Ci.nsIPrefService).
                           getDefaultBranch(null);
            this.channel = this.prefBranch.getCharPref(data);
            defaults.setCharPref(PREF_APP_UPDATE_CHANNEL, this.channel);
            break;
        }
        break;
      case "quit-application":
        os = Cc["@mozilla.org/observer-service;1"].
             getService(Ci.nsIObserverService);
        os.removeObserver(this, "profile-after-change");
        os.removeObserver(this, "quit-application");
        this.prefBranch.removeObserver("", this);
        break;
    }
  },

  classDescription: "Update Channel Service",
  contractID: "@oxymoronical.com/update/updatechannelservice;1",
  classID: Components.ID("{55935bac-b715-4b59-9f69-d66dce03509d}"),
  QueryInterface: XPCOMUtils.generateQI([Ci.ucsIUpdateChannelService, Ci.nsIObserver]),
  _xpcom_categories: [{
    category: "app-startup",
    service: true
  }]
}

function NSGetModule(compMgr, fileSpec) {
  return XPCOMUtils.generateModule([UpdateChannelService]);
}
