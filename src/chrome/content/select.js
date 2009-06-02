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

const Cc = Components.classes;
const Ci = Components.interfaces;

var gChannelService = null;
var gUpdates = null;

function onLoad() {
  gUpdates = Cc["@mozilla.org/updates/update-service;1"].
             getService(Ci.nsIApplicationUpdateService);
  gChannelService = Cc["@oxymoronical.com/update/updatechannelservice;1"].
                    getService(Ci.ucsIUpdateChannelService);

  if (!gUpdates.canUpdate) {
    document.documentElement.canAdvance=false;
    return;
  }

  document.documentElement.goTo("choosechannel");
  channelSelected();
}

function onFinish() {
  var list = document.getElementById("channelList");
  gChannelService.currentChannel = list.selectedChannel;

  var launch = document.getElementById("launchUpdate");
  if (launch.checked) {
    var prompter = Cc["@mozilla.org/updates/update-prompt;1"].
                   createInstance(Ci.nsIUpdatePrompt);
    prompter.checkForUpdates();
  }
}

function checkDownloadState() {
  var warning = document.getElementById("downloading");
  warning.hidden = !gUpdates.isDownloading;
}

function channelSelected() {
  var list = document.getElementById("channelList");
  var channel = list.selectedChannel;
  var desc = document.getElementById("channelDescription");
  desc.textContent = channel.description;

  document.documentElement.canAdvance = (channel != gChannelService.currentChannel);
}
