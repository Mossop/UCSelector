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
 *      Dave Townsend <dtownsend@oxymoronical.com>.
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
 */

var UpdateChannels = {
  changeChannel: function() {
    var name = "ChannelSelect:Wizard";
    var uri = "chrome://channels/content/select.xul";

    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                       .getService(Components.interfaces.nsIWindowMediator);
    var win = wm.getMostRecentWindow(name);
    if (win) {
      win.focus();
    }
    else {
      var openFeatures = "chrome,centerscreen,dialog=no,resizable=no,titlebar,toolbar=no";
      var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                         .getService(Components.interfaces.nsIWindowWatcher);
      var win = ww.openWindow(null, uri, "", openFeatures, null);
    }
    window.close();
  },

  pageShow: function() {
    var channelService = Components.classes["@oxymoronical.com/update/updatechannelservice;1"]
                                   .getService(Components.interfaces.ucsIUpdateChannelService);
    var sbs = Components.classes["@mozilla.org/intl/stringbundle;1"]
                        .getService(Components.interfaces.nsIStringBundleService);
    var brand = sbs.createBundle("chrome://branding/locale/brand.properties");
    var bundle = sbs.createBundle("chrome://channels/locale/channels.properties");
    var channel = channelService.currentChannel;

    var text = bundle.formatStringFromName("selectedChannel.label",
                                           [brand.GetStringFromName("brandShortName"), channel.id], 2);

    var desc = document.getElementById("selectedChannel");
    desc.textContent = text;
  }
};

for each (let pane in ["noupdatesfound", "noupdatesautoenabled", "noupdatesautodisabled"]) {
  var element = document.getElementById(pane);
  if (element)
    element.addEventListener("pageshow", function() { UpdateChannels.pageShow() }, false);
}
