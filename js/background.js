// (c) Andrew
// Icon by dunedhel: http://dunedhel.deviantart.com/
// Supporting functions by AdThwart - T. Joseph
// MV3 migration: service worker, chrome.storage.local, chrome.scripting, chrome.action

var version = chrome.runtime.getManifest().version;
var cloakedTabs = [];
var uncloakedTabs = [];
var contextLoaded = false;
var dpicon = 'coffee';
var dptitle = 'Decreased Productivity';
var blackList = [];
var whiteList = [];

// Storage helpers — wraps chrome.storage.local behind a simple synchronous-like cache
// We keep an in-memory copy (settings) and load it once on startup.
var settings = {};

function storageGet(key) {
	return settings[key];
}
function storageSet(obj) {
	Object.assign(settings, obj);
	chrome.storage.local.set(obj);
}

// ----- Supporting Functions

function enabled(tab, dpcloakindex) {
	var dpdomaincheck = domainCheck(extractDomainFromURL(tab.url));
	if (dpcloakindex === undefined) dpcloakindex = cloakedTabs.indexOf(tab.windowId+"|"+tab.id);
	if ((settings["enable"] == "true" || dpdomaincheck == '1') && dpdomaincheck != '0' && (settings["global"] == "true" || (settings["global"] == "false" && (dpcloakindex != -1 || settings["newPages"] == "Cloak" || dpdomaincheck == '1')))) return 'true';
	return 'false';
}
function domainCheck(domain) {
	if (!domain) return '-1';
	if (in_array(domain, whiteList) == '1') return '0';
	if (in_array(domain, blackList) == '1') return '1';
	return '-1';
}
function in_array(needle, haystack) {
	if (!haystack || !needle) return false;
	if (binarySearch(haystack, needle) != -1) return '1';
	if (needle.indexOf('www.') == 0) {
		if (binarySearch(haystack, needle.substring(4)) != -1) return '1';
	}
	for (var i in haystack) {
		if (haystack[i].indexOf("*") == -1 && haystack[i].indexOf("?") == -1) continue;
		if (new RegExp('^(?:www\\.|^)(?:'+haystack[i].replace(/\./g, '\\.').replace(/^\[/, '\\[').replace(/\]$/, '\\]').replace(/\?/g, '.').replace(/\*/g, '[^.]+')+')').test(needle)) return '1';
	}
	return false;
}
function binarySearch(list, item) {
    var min = 0;
    var max = list.length - 1;
    var guess;
	var bitwise = (max <= 2147483647) ? true : false;
	if (bitwise) {
		while (min <= max) {
			guess = (min + max) >> 1;
			if (list[guess] === item) { return guess; }
			else {
				if (list[guess] < item) { min = guess + 1; }
				else { max = guess - 1; }
			}
		}
	} else {
		while (min <= max) {
			guess = Math.floor((min + max) / 2);
			if (list[guess] === item) { return guess; }
			else {
				if (list[guess] < item) { min = guess + 1; }
				else { max = guess - 1; }
			}
		}
	}
    return -1;
}
function extractDomainFromURL(url) {
	if (!url) return "";
	if (url.indexOf("://") != -1) url = url.substr(url.indexOf("://") + 3);
	if (url.indexOf("/") != -1) url = url.substr(0, url.indexOf("/"));
	if (url.indexOf("@") != -1) url = url.substr(url.indexOf("@") + 1);
	if (url.match(/^(?:\[[A-Fa-f0-9:.]+\])(:[0-9]+)?$/g)) {
		if (url.indexOf("]:") != -1) return url.substr(0, url.indexOf("]:")+1);
		return url;
	}
	if (url.indexOf(":") > 0) url = url.substr(0, url.indexOf(":"));
	return url;
}
function domainHandler(domain, action) {
	var tempWhitelist = Array.isArray(settings['whiteList']) ? settings['whiteList'].slice() : JSON.parse(settings['whiteList'] || '[]');
	var tempBlacklist = Array.isArray(settings['blackList']) ? settings['blackList'].slice() : JSON.parse(settings['blackList'] || '[]');

	// Remove domain from whitelist and blacklist
	var pos = tempWhitelist.indexOf(domain);
	if (pos>-1) tempWhitelist.splice(pos,1);
	pos = tempBlacklist.indexOf(domain);
	if (pos>-1) tempBlacklist.splice(pos,1);

	switch(action) {
		case 0:	// Whitelist
			tempWhitelist.push(domain);
			break;
		case 1:	// Blacklist
			tempBlacklist.push(domain);
			break;
		case 2:	// Remove
			break;
	}

	storageSet({ 'blackList': JSON.stringify(tempBlacklist), 'whiteList': JSON.stringify(tempWhitelist) });
	blackList = tempBlacklist.sort();
	whiteList = tempWhitelist.sort();
	return false;
}
// ----- Options
function optionExists(opt) {
	return (typeof settings[opt] != "undefined");
}
function defaultOptionValue(opt, val) {
	if (!optionExists(opt)) settings[opt] = val;
}
function setDefaultOptions() {
	defaultOptionValue("version", version);
	defaultOptionValue("enable", "true");
	defaultOptionValue("enableToggle", "true");
	defaultOptionValue("hotkey", "CTRL F12");
	defaultOptionValue("paranoidhotkey", "ALT P");
	defaultOptionValue("global", "false");
	defaultOptionValue("newPages", "Uncloak");
	defaultOptionValue("sfwmode", "SFW");
	defaultOptionValue("savedsfwmode", "");
	defaultOptionValue("opacity1", "0.05");
	defaultOptionValue("opacity2", "0.5");
	defaultOptionValue("collapseimage", "false");
	defaultOptionValue("showIcon", "true");
	defaultOptionValue("iconType", "coffee");
	defaultOptionValue("iconTitle", "Decreased Productivity");
	defaultOptionValue("disableFavicons", "false");
	defaultOptionValue("hidePageTitles", "false");
	defaultOptionValue("pageTitleText", "Google Chrome");
	defaultOptionValue("enableStickiness", "false");
	defaultOptionValue("maxwidth", "0");
	defaultOptionValue("maxheight", "0");
	defaultOptionValue("showContext", "true");
	defaultOptionValue("showUnderline", "true");
	defaultOptionValue("removeBold", "false");
	defaultOptionValue("showUpdateNotifications", "true");
	defaultOptionValue("font", "Arial");
	defaultOptionValue("customfont", "");
	defaultOptionValue("fontsize", "12");
	defaultOptionValue("s_bg", "FFFFFF");
	defaultOptionValue("s_link", "000099");
	defaultOptionValue("s_table", "cccccc");
	defaultOptionValue("s_text", "000000");
	defaultOptionValue("customcss", "");
	// fix hotkey shortcut if in old format (if using + as separator instead of space)
	if (settings["hotkey"] && settings["hotkey"].indexOf('+') != -1) {
		settings["hotkey"] = settings["hotkey"].replace(/\+$/, "APLUSA").replace(/\+/g, " ").replace(/APLUSA/, "+");
	}
	// delete old option if exists
	if (optionExists("globalEnable")) delete settings["globalEnable"];
	// delete old option if exists
	if (optionExists("style")) delete settings["style"];
	// set SFW Level to SFW (for new change in v0.46.3)
	if (settings["sfwmode"] == "true") settings["sfwmode"] = "SFW";
	if (!optionExists("blackList")) settings['blackList'] = JSON.stringify([]);
	if (!optionExists("whiteList")) settings['whiteList'] = JSON.stringify([]);
	// Persist all defaults
	chrome.storage.local.set(settings);
}

// ----- Context Menu Setup
function setupContextMenus() {
	chrome.contextMenus.removeAll(function() {
		chrome.contextMenus.create({"id": "whitelistdomain", "title": chrome.i18n.getMessage("whitelistdomain"), "contexts": ['action','page_action']});
		chrome.contextMenus.create({"id": "blacklistdomain", "title": chrome.i18n.getMessage("blacklistdomain"), "contexts": ['action','page_action']});
		chrome.contextMenus.create({"id": "removelist", "title": chrome.i18n.getMessage("removelist"), "contexts": ['action','page_action']});
		dpContext();
	});
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(function(info, tab) {
	if (info.menuItemId === "whitelistdomain") {
		if (!tab || tab.url.substring(0, 4) != 'http') return;
		domainHandler(extractDomainFromURL(tab.url), 0);
		if (settings["enable"] == "true") magician('false', tab.id);
	} else if (info.menuItemId === "blacklistdomain") {
		if (!tab || tab.url.substring(0, 4) != 'http') return;
		domainHandler(extractDomainFromURL(tab.url), 1);
		if (settings["enable"] == "true") magician('true', tab.id);
	} else if (info.menuItemId === "removelist") {
		if (!tab || tab.url.substring(0, 4) != 'http') return;
		domainHandler(extractDomainFromURL(tab.url), 2);
		if (settings["enable"] == "true") {
			var flag = 'false';
			if (settings['newPages'] == 'Cloak' || settings['global'] == 'true') flag = 'true';
			magician(flag, tab.id);
		}
	} else if (info.menuItemId === "opensafely") {
		newCloak(info, tab);
	}
});

// Called by clicking on the context menu item
function newCloak(info, tab) {
	// Enable cloaking (in case its been disabled) and open the link in a new tab
	settings["enable"] = "true";
	storageSet({"enable": "true"});
	// If it's an image, load the "src" attribute
	if (info.mediaType) chrome.tabs.create({'url': info.srcUrl}, function(tab){ cloakedTabs.push(tab.windowId+"|"+tab.id);recursiveCloak('true', settings["global"], tab.id); });
	// Else, it's a normal link, so load the linkUrl.
	else chrome.tabs.create({'url': info.linkUrl}, function(tab){ cloakedTabs.push(tab.windowId+"|"+tab.id);recursiveCloak('true', settings["global"], tab.id); });
}
// Add context menu item that shows only if you right-click on links/images.
function dpContext() {
	if (settings["showContext"] == 'true' && !contextLoaded) {
		chrome.contextMenus.create({"id": "opensafely", "title": chrome.i18n.getMessage("opensafely"), "contexts": ['link', 'image']});
		contextLoaded = true;
	}
}
// ----- Main Functions
function checkChrome(url) {
	if (!url || url.substring(0, 6) == 'chrome') return true;
	return false;
}
function hotkeyChange() {
	chrome.windows.getAll({"populate":true}, function(windows) {
		windows.map(function(window) {
			window.tabs.map(function(tab) {
				if (!checkChrome(tab.url)) {
					chrome.scripting.executeScript({
						target: { tabId: tab.id, allFrames: true },
						func: function(enableToggle, hotkey, paranoidhotkey) {
							hotkeySet(enableToggle, hotkey, paranoidhotkey);
						},
						args: [settings["enableToggle"], settings["hotkey"], settings["paranoidhotkey"]]
					}).catch(function(){});
				}
			});
		});
	});
}
function optionsSaveTrigger(prevglob, newglob) {
	var enable = settings["enable"];
	var global = newglob;
	if (prevglob == 'true' && newglob == 'false') {
		global = 'true';
		enable = 'false';
	}
	if (global == 'false') {
		for (var i=cloakedTabs.length-1; i>=0; --i) {
			magician(enable, parseInt(cloakedTabs[i].split("|")[1]));
		}
		if (enable == 'false') cloakedTabs = [];
	} else recursiveCloak(enable, global);
}
function recursiveCloak(enable, global, tabId) {
	if (global == 'true') {
		chrome.windows.getAll({"populate":true}, function(windows) {
			windows.map(function(window) {
				window.tabs.map(function(tab) {
					if (!checkChrome(tab.url)) {
						var enabletemp = enable;
						var dpdomaincheck = domainCheck(extractDomainFromURL(tab.url));
						// Ensure whitelisted or blacklisted tabs stay as they are
						if (enabletemp == 'true' && dpdomaincheck == '0') enabletemp = 'false';
						else if (enabletemp == 'false' && dpdomaincheck == '1') enabletemp = 'true';
						magician(enabletemp, tab.id);
						var dpTabId = tab.windowId+"|"+tab.id;
						var dpcloakindex = cloakedTabs.indexOf(dpTabId);
						var dpuncloakindex = uncloakedTabs.indexOf(dpTabId);
						if (enabletemp == 'false') {
							if (dpuncloakindex == -1) uncloakedTabs.push(dpTabId);
							if (dpcloakindex != -1) cloakedTabs.splice(dpcloakindex, 1);
						} else {
							if (dpcloakindex == -1) cloakedTabs.push(dpTabId);
							if (dpuncloakindex != -1) uncloakedTabs.splice(dpuncloakindex, 1);
						}
					}
				});
			});
		});
	} else {
		if (tabId) magician(enable, tabId);
	}
}
function magician(enable, tabId) {
	if (enable == 'true') {
		var disableFavicons = settings["disableFavicons"] == 'true';
		var hidePageTitles  = settings["hidePageTitles"]  == 'true';
		var pageTitle       = settings["pageTitleText"] || '';
		chrome.scripting.executeScript({
			target: { tabId: tabId, allFrames: true },
			func: function(disableFavicons, hidePageTitles, pageTitle) {
				if (typeof init === 'function') init();
				if (disableFavicons) { if (typeof faviconblank === 'function') faviconblank(); }
				else { if (typeof faviconrestore === 'function') faviconrestore(); }
				if (hidePageTitles) {
					if (typeof replaceTitle === 'function') replaceTitle(pageTitle);
					if (typeof titleBind   === 'function') titleBind(pageTitle);
				} else {
					if (typeof titleRestore === 'function') titleRestore();
				}
			},
			args: [disableFavicons, hidePageTitles, pageTitle]
		}).catch(function(){});
	} else {
		chrome.scripting.executeScript({
			target: { tabId: tabId, allFrames: true },
			func: function() { if (typeof removeCss === 'function') removeCss(); }
		}).catch(function(){});
	}
	// In MV3, chrome.action is always visible; just update icon and title per-tab
	var iconName = (enable == 'true') ? dpicon : dpicon+'-disabled';
	chrome.action.setIcon({path: 'img/addressicon/'+iconName+'.png', tabId: tabId}).catch(function(){});
	chrome.action.setTitle({title: dptitle, tabId: tabId});
}
function dpHandle(tab) {
	if (checkChrome(tab.url)) return;
	if (settings["global"] == "true" && domainCheck(extractDomainFromURL(tab.url)) != 1) {
		if (settings["enable"] == "true") {
			recursiveCloak('false', 'true');
			settings["enable"] = "false";
			storageSet({"enable": "false"});
		} else {
			recursiveCloak('true', 'true');
			settings["enable"] = "true";
			storageSet({"enable": "true"});
		}
	} else {
		var dpTabId = tab.windowId+"|"+tab.id;
		var dpcloakindex = cloakedTabs.indexOf(dpTabId);
		var dpuncloakindex = uncloakedTabs.indexOf(dpTabId);
		settings["enable"] = "true";
		storageSet({"enable": "true"});
		if (dpcloakindex != -1) {
			magician('false', tab.id);
			if (dpuncloakindex == -1) uncloakedTabs.push(dpTabId);
			cloakedTabs.splice(dpcloakindex, 1);
		} else {
			magician('true', tab.id);
			cloakedTabs.push(dpTabId);
			if (dpuncloakindex != -1) uncloakedTabs.splice(dpuncloakindex, 1);
		}
	}
}
function setDPIcon() {
	dpicon = settings["iconType"] || 'coffee';
	dptitle = settings["iconTitle"] || 'Decreased Productivity';
	// Update the default icon for all future tabs
	chrome.action.setIcon({path: {
		"16": "img/addressicon/"+dpicon+".png",
		"32": "img/addressicon/"+dpicon+".png"
	}}).catch(function(){});
	chrome.action.setTitle({title: dptitle});
	// Update per-tab icons for already-open tabs
	chrome.windows.getAll({"populate":true}, function(windows) {
		windows.map(function(window) {
			window.tabs.map(function(tab) {
				var iconName = (cloakedTabs.indexOf(tab.windowId+"|"+tab.id) != -1) ? dpicon : dpicon+"-disabled";
				chrome.action.setIcon({path: "img/addressicon/"+iconName+".png", tabId: tab.id}).catch(function(){});
				chrome.action.setTitle({title: dptitle, tabId: tab.id});
			});
		});
	});
}
function initLists() {
	try {
		blackList = JSON.parse(settings['blackList'] || '[]').sort();
		whiteList = JSON.parse(settings['whiteList'] || '[]').sort();
	} catch(e) {
		blackList = [];
		whiteList = [];
	}
}
// ----- Request library to support content script communication
chrome.tabs.onUpdated.addListener(function(tabid, changeinfo, tab) {
	if (changeinfo.status == "loading") {
		var dpTabId = tab.windowId+"|"+tabid;
		var dpcloakindex = cloakedTabs.indexOf(dpTabId);
		var enable = enabled(tab, dpcloakindex);
		var iconName = (enable == "true") ? dpicon : dpicon+"-disabled";
		chrome.action.setIcon({path: "img/addressicon/"+iconName+".png", tabId: tabid}).catch(function(){});
		chrome.action.setTitle({title: dptitle, tabId: tabid});
		if (checkChrome(tab.url)) return;
		var dpuncloakindex = uncloakedTabs.indexOf(dpTabId);
		if (enable == "true") {
			magician('true', tabid);
			if (settings["global"] == "false" && settings["enable"] == "false") {
				settings["enable"] = "true";
				storageSet({"enable": "true"});
			}
			if (dpcloakindex == -1) cloakedTabs.push(dpTabId);
			if (dpuncloakindex != -1) uncloakedTabs.splice(dpuncloakindex, 1);
		} else {
			if (settings["enableStickiness"] == "true") {
				if (tab.openerTabId) {
					if (cloakedTabs.indexOf(tab.windowId+"|"+tab.openerTabId) != -1 && dpuncloakindex == -1) {
						if (domainCheck(extractDomainFromURL(tab.url)) != '0') {
							magician('true', tabid);
							cloakedTabs.push(dpTabId);
							return;
						}
					}
					if (dpuncloakindex == -1) uncloakedTabs.push(dpTabId);
					if (dpcloakindex != -1) cloakedTabs.splice(dpcloakindex, 1);
				} else {
					chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
						if (tabs[0] && tabs[0].windowId == tab.windowId && cloakedTabs.indexOf(tabs[0].windowId+"|"+tabs[0].id) != -1 && dpuncloakindex == -1) {
							if (domainCheck(extractDomainFromURL(tab.url)) != '0') {
								magician('true', tabid);
								cloakedTabs.push(dpTabId);
								return;
							}
						}
						if (dpuncloakindex == -1) uncloakedTabs.push(dpTabId);
						if (dpcloakindex != -1) cloakedTabs.splice(dpcloakindex, 1);
					});
				}
			}
		}
	}
});
chrome.tabs.onRemoved.addListener(function(tabid, windowInfo) {
	var dpTabId = windowInfo.windowId+"|"+tabid;
	var dpcloakindex = cloakedTabs.indexOf(dpTabId);
	var dpuncloakindex = uncloakedTabs.indexOf(dpTabId);
	if (dpcloakindex != -1) cloakedTabs.splice(dpcloakindex, 1);
	if (dpuncloakindex != -1) uncloakedTabs.splice(dpuncloakindex, 1);
});

// ----- Message handlers
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.reqtype === "get-enabled") {
		var dpTabId = sender.tab.windowId+"|"+sender.tab.id;
		var dpcloakindex = cloakedTabs.indexOf(dpTabId);
		var enable = enabled(sender.tab, dpcloakindex);
		if (enable == 'true' && dpcloakindex == -1) cloakedTabs.push(dpTabId);
		sendResponse({enable: enable, background: settings["s_bg"], favicon: settings["disableFavicons"], hidePageTitles: settings["hidePageTitles"], pageTitleText: settings["pageTitleText"], enableToggle: settings["enableToggle"], hotkey: settings["hotkey"], paranoidhotkey: settings["paranoidhotkey"]});
	} else if (request.reqtype === "toggle") {
		if (settings["savedsfwmode"] != "") {
			settings["sfwmode"] = settings["savedsfwmode"];
			settings["savedsfwmode"] = "";
			storageSet({"sfwmode": settings["sfwmode"], "savedsfwmode": ""});
			if (settings["global"] == "true") recursiveCloak('true', 'true');
			else {
				magician('true', sender.tab.id);
				var dpTabId = sender.tab.windowId+"|"+sender.tab.id;
				var dpuncloakindex = uncloakedTabs.indexOf(dpTabId);
				if (dpuncloakindex != -1) uncloakedTabs.splice(dpuncloakindex, 1);
				if (cloakedTabs.indexOf(dpTabId) == -1) cloakedTabs.push(dpTabId);
			}
			settings["enable"] = "true";
			storageSet({"enable": "true"});
		} else {
			dpHandle(sender.tab);
		}
		sendResponse({});
	} else if (request.reqtype === "toggleparanoid") {
		if (settings["savedsfwmode"] == "") {
			settings["savedsfwmode"] = settings["sfwmode"];
			settings["sfwmode"] = "Paranoid";
			storageSet({"savedsfwmode": settings["savedsfwmode"], "sfwmode": "Paranoid"});
			if (settings["global"] == "true") recursiveCloak('true', 'true');
			else {
				magician('true', sender.tab.id);
				var dpTabId = sender.tab.windowId+"|"+sender.tab.id;
				var dpuncloakindex = uncloakedTabs.indexOf(dpTabId);
				if (dpuncloakindex != -1) uncloakedTabs.splice(dpuncloakindex, 1);
				if (cloakedTabs.indexOf(dpTabId) == -1) cloakedTabs.push(dpTabId);
			}
			settings["enable"] = "true";
			storageSet({"enable": "true"});
		} else {
			settings["sfwmode"] = settings["savedsfwmode"];
			settings["savedsfwmode"] = "";
			storageSet({"sfwmode": settings["sfwmode"], "savedsfwmode": ""});
			dpHandle(sender.tab);
		}
		sendResponse({});
	} else if (request.reqtype === "get-settings") {
		var fontface;
		if (settings["font"] == '-Custom-') {
			if (settings["customfont"]) fontface = settings["customfont"];
			else fontface = 'Arial';
		} else fontface = settings["font"];
		var enable;
		if (settings["global"] == "false") enable = 'true';
		else enable = enabled(sender.tab);
		sendResponse({enable: enable, sfwmode: settings["sfwmode"], font: fontface, fontsize: settings["fontsize"], underline: settings["showUnderline"], background: settings["s_bg"], text: settings["s_text"], table: settings["s_table"], link: settings["s_link"], bold: settings["removeBold"], opacity1: settings["opacity1"], opacity2: settings["opacity2"], collapseimage: settings["collapseimage"], maxheight: settings["maxheight"], maxwidth: settings["maxwidth"], customcss: settings["customcss"]});
	} else if (request.reqtype === "options-saved") {
		// Options page signals a save; reload our settings cache
		chrome.storage.local.get(null, function(items) {
			Object.assign(settings, items);
			initLists();
			setDPIcon();
			optionsSaveTrigger(request.prevglobal, settings["global"]);
			hotkeyChange();
		});
		sendResponse({});
	} else if (request.reqtype === "domain-handler") {
		domainHandler(request.domain, request.action);
		sendResponse({});
	} else if (request.reqtype === "init-lists") {
		initLists();
		sendResponse({});
	} else {
		sendResponse({});
	}
	return true; // Keep channel open for async responses
});

// ----- If action icon is clicked, either enable or disable the cloak
chrome.action.onClicked.addListener(function(tab) {
	dpHandle(tab);
});

// ----- Startup: load storage then initialize
// onInstalled fires on fresh install and updates; the storage.get below handles service worker restarts.
chrome.runtime.onInstalled.addListener(function() {
	chrome.storage.local.get(null, function(items) {
		Object.assign(settings, items);
		setDefaultOptions();
		initLists();
		setDPIcon();
		setupContextMenus();
		if ((!settings["version"] || settings["version"] != version) && settings["showUpdateNotifications"] == 'true') {
			//chrome.tabs.create({ url: chrome.runtime.getURL('updated.html'), active: false }); - minor update
			settings["version"] = version;
			storageSet({"version": version});
		}
	});
});

// Service worker wake-up (not a fresh install — context menus already exist, skip re-creating them)
chrome.storage.local.get(null, function(items) {
	Object.assign(settings, items);
	setDefaultOptions();
	initLists();
	setDPIcon();
});

chrome.runtime.onUpdateAvailable.addListener(function (details) {
	// an update is available, but wait until user restarts their browser
});