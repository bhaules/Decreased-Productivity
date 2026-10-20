// (c) Andrew
// Icon by dunedhel: http://dunedhel.deviantart.com/
// Supporting functions by AdThwart - T. Joseph
// MV3 migration: use chrome.storage.local instead of localStorage/getBackgroundPage

var version = chrome.runtime.getManifest().version;
var error = false;
var oldglobalstate = false;
var settingnames = [];

// Storage helpers
function storageGet(key, callback) {
	chrome.storage.local.get(key, function(items) {
		callback(items[key]);
	});
}
function storageSet(obj) {
	chrome.storage.local.set(obj);
}
function storageGetAll(callback) {
	chrome.storage.local.get(null, callback);
}

document.addEventListener('DOMContentLoaded', function () {
	$("#tabs").tabs();
	$("#o1").slider({min: 0, max: 1, step: 0.05, slide: function(event, ui) { $("#opacity1").val(ui.value); opacitytest(); }, stop: function(event, ui) { 
		if (ui.value == 0) $("#collapseimageblock").show();
		else $("#collapseimageblock").hide();
		saveOptions();
	}});
	$("#o2").slider({min: 0, max: 1, step: 0.05, slide: function(event, ui) { $("#opacity2").val(ui.value); opacitytest(); }, stop: function(event, ui) { saveOptions(); }});
	loadOptions();
	colorPickLoad("s_bg");
	colorPickLoad("s_text");
	colorPickLoad("s_link");
	colorPickLoad("s_table");
	$(".i18_save, .i18_savecolours").click(saveOptions);
	$(".i18_revertcolours").click(revertColours);
	$(".i18_addwhitelist").click(function() { addList(0); });
	$(".i18_addblacklist").click(function() { addList(1); });
	$(".i18_dpoptions").click(function() { location.href='options.html'; });
	$(".i18_clear").click(function() {
		if ($(this).parent().find('strong').hasClass('i18_whitelist')) {
			listclear(0);
		} else {
			listclear(1);
		}
	});
	$("#enable, #enableToggle, #enableStickiness, #disableFavicons, #hidePageTitles, #showUnderline, #collapseimage, #removeBold, #showContext, #showIcon, #showUpdateNotifications").click(saveOptions);
	$("#iconTitle, #customcss").blur(saveOptions);
	$("#s_bg, #s_text, #s_link, #s_table").keyup(updateDemo);
	$("#global").click(function() {
		saveOptions();
	});
	$("#opacity1").blur(function() {
		intValidate(this, 0.05);
		if (this.value == 0) $("#collapseimageblock").show();
		else $("#collapseimageblock").hide();
		opacitytest();
	});
	$("#opacity2").blur(function() {
		intValidate(this, 0.5);
		opacitytest();
	});
	$("#maxwidth, #maxheight").blur(function() {
		intValidate(this);
	});
	$("#pageTitleText").blur(pageTitleValidation);
	$("#font").change(function() {
		updateDemo();
	});
	// Hotkey
	var listener;
	var listener2;
	var keysettings = {
		is_solitary    : true,
		is_unordered    : true,
		is_exclusive    : true,
		prevent_repeat  : true, 
		is_sequence  : false,
		is_counting  : false
	};
	listener = new window.keypress.Listener($("#hotkey"), keysettings);
	listener.register_many(combos);
	listener2 = new window.keypress.Listener($("#paranoidhotkey"), keysettings);
	listener2.register_many(combos);
	$("#hotkeyrecord").click(function() {
		$("#hotkeyrecord").val(chrome.i18n.getMessage("hotkey_set"));
		$("#hotkey").removeAttr('disabled').select().focus();
	});
	$("#paranoidhotkeyrecord").click(function() {
		$("#paranoidhotkeyrecord").val(chrome.i18n.getMessage("hotkey_set"));
		$("#paranoidhotkey").removeAttr('disabled').select().focus();
	});
	//
	$("#iconType").change(function() {
		$("#sampleicon").attr('src', '../img/addressicon/'+$(this).val()+'.png');
	});
	$("#fontsize").change(fontsizeValidation);
	$("#newPages, #sfwmode, #font, #iconType").change(saveOptions);
	$("#s_preset").change(function() {
		stylePreset($(this).val());
	});
	$("#settingsall").click(settingsall);
	$("#importsettings").click(settingsImport);
	$("#savetxt").click(downloadtxt);
	$(".i18_close").click(closeOptions);
});
function keyhandle(keypressed) {
	keypressed = keypressed.toUpperCase();
	if ($("#hotkey").attr('disabled')) {
		if (keypressed != $("#hotkey").val()) {
			$("#paranoidhotkey").val(keypressed).attr('disabled', 'true');
			$("#paranoidhotkeyrecord").val(chrome.i18n.getMessage("hotkey_record"));
			saveOptions();
		}
	} else {
		if (keypressed != $("#paranoidhotkey").val()) {
			$("#hotkey").val(keypressed).attr('disabled', 'true');
			$("#hotkeyrecord").val(chrome.i18n.getMessage("hotkey_record"));
			saveOptions();
		}
	}
}
function loadCheckbox(id, val) {
	document.getElementById(id).checked = typeof val == "undefined" ? false : val == "true";
}

function loadElement(id, val) {
	if (typeof val !== "undefined") $("#"+id).val(val);
}

function saveCheckbox(id, obj) {
	obj[id] = document.getElementById(id).checked ? "true" : "false";
}

function saveElement(id, obj) {
	obj[id] = $("#"+id).val();
}
function closeOptions() {
	window.open('', '_self', '');window.close();
}
function settingsall() {
	selectAll('settingsexport');
}
function selectAll(id) {
	$("#"+id).select();
}
function i18load() {
	$("#title").html("Decreased Productivity v"+version);
	$(".i18_default").html(chrome.i18n.getMessage("default"));
	$(".i18_enable").html(chrome.i18n.getMessage("enable"));
	$(".i18_enabled").html(chrome.i18n.getMessage("enabled"));
	$(".i18_disabled").html(chrome.i18n.getMessage("disabled"));
	$(".i18_globalmode").html(chrome.i18n.getMessage("globalmode"));
	$(".i18_globalmode2").html(chrome.i18n.getMessage("globalmode2"));
	$(".i18_globalmode3").html(chrome.i18n.getMessage("globalmode3"));
	$(".i18_cloak").html(chrome.i18n.getMessage("cloak"));
	$(".i18_uncloak").html(chrome.i18n.getMessage("uncloak"));
	$(".i18_level").html(chrome.i18n.getMessage("level"));
	$(".i18_paranoid").html(chrome.i18n.getMessage("paranoid"));
	$(".i18_sfw0").html(chrome.i18n.getMessage("sfw0"));
	$(".i18_sfw1").html(chrome.i18n.getMessage("sfw1"));
	$(".i18_sfw2").html(chrome.i18n.getMessage("sfw2"));
	$(".i18_nsfw").html(chrome.i18n.getMessage("nsfw"));
	$(".i18_toggle").html(chrome.i18n.getMessage("toggle"));
	$(".i18_toggle2").html(chrome.i18n.getMessage("toggle2"));
	$(".i18_toggle_hotkey").html(chrome.i18n.getMessage("hotkey"));
	$(".i18_toggle_paranoidhotkey").html(chrome.i18n.getMessage("paranoidhotkey"));
	$(".i18_hotkey_record").val(chrome.i18n.getMessage("hotkey_record"));
	$(".i18_opacity").html(chrome.i18n.getMessage("opacity"));
	$(".i18_collapseimage").html(chrome.i18n.getMessage("collapseimage"));
	$(".i18_opacity2").html(chrome.i18n.getMessage("opacity2"));
	$(".i18_unhovered").html(chrome.i18n.getMessage("unhovered"));
	$(".i18_hovered").html(chrome.i18n.getMessage("hovered"));
	$(".i18_stickiness").html(chrome.i18n.getMessage("stickiness"));
	$(".i18_stickiness2").html(chrome.i18n.getMessage("stickiness2"));
	$(".i18_favicons").html(chrome.i18n.getMessage("favicons"));
	$(".i18_hidetitles").html(chrome.i18n.getMessage("hidetitles"));
	$(".i18_showimages").html(chrome.i18n.getMessage("showimages"));
	$(".i18_showimages2").html(chrome.i18n.getMessage("showimages2"));
	$(".i18_showunderline").html(chrome.i18n.getMessage("showunderline"));
	$(".i18_removebold").html(chrome.i18n.getMessage("removebold"));
	$(".i18_showcontext").html(chrome.i18n.getMessage("showcontext"));
	$(".i18_showcontext2").html(chrome.i18n.getMessage("showcontext2"));
	$(".i18_showicon").html(chrome.i18n.getMessage("showicon"));
	$(".i18_showicon2").html(chrome.i18n.getMessage("showicon2"));
	$(".i18_showicon_type").html(chrome.i18n.getMessage("showicon_type"));
	$(".i18_showicon_type2").html(chrome.i18n.getMessage("showicon_type2"));
	$(".i18_showicon_title").html(chrome.i18n.getMessage("showicon_title"));
	$(".i18_showupdate").html(chrome.i18n.getMessage("showupdate"));
	$(".i18_showupdate2").html(chrome.i18n.getMessage("showupdate2"));
	$(".i18_font").html(chrome.i18n.getMessage("font"));
	$(".i18_customfont").html(chrome.i18n.getMessage("customfont"));
	$(".i18_fontsize").html(chrome.i18n.getMessage("fontsize"));
	$(".i18_color").html(chrome.i18n.getMessage("color"));
	$(".i18_colorpresets").html(chrome.i18n.getMessage("colorpresets"));
	$(".i18_colorpresetselect").html('-- '+chrome.i18n.getMessage("colorpresetselect")+' --');
	$(".i18_colorbackground").html(chrome.i18n.getMessage("colorbackground"));
	$(".i18_colortext").html(chrome.i18n.getMessage("colortext"));
	$(".i18_colorlink").html(chrome.i18n.getMessage("colorlink"));
	$(".i18_colortable").html(chrome.i18n.getMessage("colortable"));
	$(".i18_c1").html(chrome.i18n.getMessage("white")+' - '+chrome.i18n.getMessage("blue"));
	$(".i18_c2").html(chrome.i18n.getMessage("white")+' - '+chrome.i18n.getMessage("gray"));
	$(".i18_c3").html(chrome.i18n.getMessage("gray")+' - '+chrome.i18n.getMessage("blue"));
	$(".i18_c4").html(chrome.i18n.getMessage("lightred")+' - '+chrome.i18n.getMessage("paleblue"));
	$(".i18_c5").html(chrome.i18n.getMessage("darkbrown")+' - '+chrome.i18n.getMessage("offwhite"));
	$(".i18_c6").html(chrome.i18n.getMessage("black")+' - '+chrome.i18n.getMessage("blue"));
	$(".i18_c7").html(chrome.i18n.getMessage("black")+' - '+chrome.i18n.getMessage("green"));
	$(".i18_c8").html(chrome.i18n.getMessage("black")+' - '+chrome.i18n.getMessage("red"));
	$(".i18_c9").html(chrome.i18n.getMessage("black")+' - '+chrome.i18n.getMessage("pink"));
	$(".i18_c10").html(chrome.i18n.getMessage("white")+' - '+chrome.i18n.getMessage("green"));
	$(".i18_demo").html(chrome.i18n.getMessage("demo"));
	$(".i18_test1").html(chrome.i18n.getMessage("test1"));
	$(".i18_test2").html(chrome.i18n.getMessage("test2"));
	$(".i18_savecolours").val(chrome.i18n.getMessage("savecolours"));
	$(".i18_revertcolours").val(chrome.i18n.getMessage("revertcolours"));
	$(".i18_domain").html(chrome.i18n.getMessage("domain"));
	$(".i18_addwhitelist").val("+ "+chrome.i18n.getMessage("whitelist"));
	$(".i18_addblacklist").val("+ "+chrome.i18n.getMessage("blacklist"));
	$(".i18_whitelist").html(chrome.i18n.getMessage("whitelist"));
	$(".i18_blacklist").html(chrome.i18n.getMessage("blacklist"));
	$(".i18_clear").html(chrome.i18n.getMessage("clear"));
	$(".i18_save").val(chrome.i18n.getMessage("save"));
	$(".i18_close").val(chrome.i18n.getMessage("close"));
	$(".i18_people").html(chrome.i18n.getMessage("people"));
	$(".i18_translators").html(chrome.i18n.getMessage("translators"));
	$(".i18_help").html(chrome.i18n.getMessage("help"));
	$(".i18_support").html(chrome.i18n.getMessage("support"));
	$("#customcssdesc").html(chrome.i18n.getMessage("customcss"));
	$(".i18_supportimg").attr({alt: chrome.i18n.getMessage("support"), title:  chrome.i18n.getMessage("support")});
}
function loadOptions() {
	document.title = chrome.i18n.getMessage("dpoptions");
	i18load();
	storageGetAll(function(items) {
		oldglobalstate = items["global"] || "false";
		loadCheckbox("enable", items["enable"]);
		loadCheckbox("global", items["global"]);
		loadCheckbox("enableToggle", items["enableToggle"]);
		loadElement("hotkey", items["hotkey"]);
		loadElement("paranoidhotkey", items["paranoidhotkey"]);
		if ($("#hotkey").val()) $("#hotkey").val($("#hotkey").val().toUpperCase());
		if ($("#paranoidhotkey").val()) $("#paranoidhotkey").val($("#paranoidhotkey").val().toUpperCase());
		loadElement("newPages", items["newPages"]);
		loadElement("sfwmode", items["sfwmode"]);
		loadElement("opacity1", items["opacity1"]);
		loadElement("opacity2", items["opacity2"]);
		loadCheckbox("collapseimage", items["collapseimage"]);
		loadCheckbox("showIcon", items["showIcon"]);
		loadElement("iconType", items["iconType"]);
		loadElement("iconTitle", items["iconTitle"]);
		loadCheckbox("disableFavicons", items["disableFavicons"]);
		loadCheckbox("hidePageTitles", items["hidePageTitles"]);
		loadElement("pageTitleText", items["pageTitleText"]);
		loadElement("maxwidth", items["maxwidth"]);
		loadElement("maxheight", items["maxheight"]);
		loadCheckbox("enableStickiness", items["enableStickiness"]);
		loadCheckbox("showContext", items["showContext"]);
		loadCheckbox("showUnderline", items["showUnderline"]);
		loadCheckbox("removeBold", items["removeBold"]);
		loadCheckbox("showUpdateNotifications", items["showUpdateNotifications"]);
		loadElement("font", items["font"]);
		loadElement("customfont", items["customfont"]);
		loadElement("fontsize", items["fontsize"]);
		loadElement("s_text", items["s_text"]);
		loadElement("s_bg", items["s_bg"]);
		loadElement("s_table", items["s_table"]);
		loadElement("s_link", items["s_link"]);
		if ($('#global').is(':checked')) $("#newPagesRow").css('display', 'none');
		if ($('#showIcon').is(':checked')) $(".discreeticonrow").show();
		if ($('#enableToggle').is(':checked')) $("#hotkeyrow, #paranoidhotkeyrow").show();
		$("#sampleicon").attr('src', '../img/addressicon/'+$('#iconType').val()+'.png');
		if (!$('#hidePageTitles').is(':checked')) $("#pageTitle").css('display', 'none');
		if ($('#opacity1').val() == 0) $("#collapseimageblock").css('display', 'block');
		if ($('#sfwmode').val() == 'SFW' || $('#sfwmode').val() == 'SFW1' || $('#sfwmode').val() == 'SFW2') $("#opacityrow").show();
		if ($('#font').val() == '-Custom-') {
			if ($("#customfont").val()) $("#customfontrow").show();
			else {
				$('#font').val('Arial');
				$("#customfontrow").hide();
			}
		}
		loadElement("customcss", items["customcss"]);
		listUpdate();
		opacitytest();
		updateDemo();
	});
}
function isValidColor(hex) { 
	var strPattern = /^[0-9a-f]{3,6}$/i; 
	return strPattern.test(hex); 
}

function saveOptions() {
	updateDemo();
	if (!$('#enable').is(':checked') && !$('#global').is(':checked')) {
		$('#enable').prop('checked', true);
	}
	if ($('#global').is(':checked')) $("#newPagesRow").css('display', 'none');
	else $("#newPagesRow").css('display', 'block');
	if ($('#enableToggle').is(':checked')) $("#hotkeyrow, #paranoidhotkeyrow").show();
	else $("#hotkeyrow, #paranoidhotkeyrow").hide();
	if ($('#hidePageTitles').is(':checked')) $("#pageTitle").css('display', 'block');
	else $("#pageTitle").css('display', 'none');
	if ($('#sfwmode').val() == 'SFW' || $('#sfwmode').val() == 'SFW1' || $('#sfwmode').val() == 'SFW2') $("#opacityrow").fadeIn("fast");
	else $("#opacityrow").hide();
	if ($('#font').val() == '-Custom-') $("#customfontrow").show();
	else $("#customfontrow").hide();
	if (!$("#hotkey").val()) $("#hotkey").val('CTRL F12');
	if (!$("#paranoidhotkey").val()) $("#paranoidhotkey").val('ALT P');

	var obj = {};
	saveCheckbox("enable", obj);
	saveCheckbox("global", obj);
	saveCheckbox("enableToggle", obj);
	saveElement("hotkey", obj);
	saveElement("paranoidhotkey", obj);
	saveElement("opacity1", obj);
	saveElement("opacity2", obj);
	saveCheckbox("collapseimage", obj);
	saveElement("newPages", obj);
	saveElement("sfwmode", obj);
	saveCheckbox("showIcon", obj);
	saveElement("iconType", obj);
	saveElement("iconTitle", obj);
	saveCheckbox("disableFavicons", obj);
	saveCheckbox("hidePageTitles", obj);
	saveElement("pageTitleText", obj);
	saveElement("maxwidth", obj);
	saveElement("maxheight", obj);
	saveCheckbox("enableStickiness", obj);
	saveCheckbox("showContext", obj);
	saveCheckbox("showUnderline", obj);
	saveCheckbox("removeBold", obj);
	saveCheckbox("showUpdateNotifications", obj);
	saveElement("font", obj);
	saveElement("customfont", obj);
	saveElement("fontsize", obj);

	if ($('#showIcon').is(':checked')) {
		$(".discreeticonrow").show();
	} else $(".discreeticonrow").hide();

	if (isValidColor($('#s_text').val()) && isValidColor($('#s_bg').val()) && isValidColor($('#s_table').val()) && isValidColor($('#s_link').val())) {
		saveElement("s_text", obj);
		saveElement("s_bg", obj);
		saveElement("s_table", obj);
		saveElement("s_link", obj);
	} else {
		error = true;
	}
	$("#customcss").val($("#customcss").val().replace(/\s*<([^>]+)>\s*/ig, ""));
	saveElement("customcss", obj);

	// Save to storage, then notify background to apply changes
	chrome.storage.local.set(obj, function() {
		chrome.runtime.sendMessage({reqtype: "options-saved", prevglobal: oldglobalstate});
		oldglobalstate = obj["global"];
		updateExport();
		if (!error) notification(chrome.i18n.getMessage("saved"));
		else notification(chrome.i18n.getMessage("invalidcolour"));
		error = false;
	});
}

function opacitytest() {
	$("#o1").slider("option", "value", $("#opacity1").val());
	$("#o2").slider("option", "value", $("#opacity2").val());
	$(".sampleimage").css({"opacity": $("#opacity1").val()});
	$(".sampleimage").hover(
		function () {
			$(this).css("opacity", $("#opacity2").val());
		}, 
		function () {
			$(this).css("opacity", $("#opacity1").val());
		}
	);
}	

function intValidate(elm, val) {
	if (!is_int(elm.value)) {
		notification(chrome.i18n.getMessage("invalidnumber"));
		elm.value = val;
	}
	else saveOptions();
}

function is_int(value){ 
	if(value != '' && !isNaN(value)) return true;
	else return false;
}	

function pageTitleValidation() {
	if ($.trim($("#pageTitleText").val()) == '') $("#pageTitleText").val('Google Chrome');
	else saveOptions();
}

function fontsizeValidation() {
	if (!is_int($.trim($("#fontsize").val()))) $("#fontsize").val('12');
	updateDemo();
}

function notification(msg) {
	$('#message').html(msg).stop().fadeIn("slow").delay(2000).fadeOut("slow");
}
function truncText(str) {
	if (str.length > 16) return str.substr(0, 16)+'...';
	return str;
}
function updateDemo() {
	if ($('#disableFavicons').is(':checked')) $("#demo_favicon").attr('style','visibility: hidden');
	else $("#demo_favicon").removeAttr('style');
	if ($('#hidePageTitles').is(':checked')) $("#demo_title").text(truncText($("#pageTitleText").val()));	
	else $("#demo_title").text(chrome.i18n.getMessage("demo")+' Page');
	$("#demo_content").css('backgroundColor', $("#s_bg").val());
	$("#t_link").css('color', $("#s_link").val());
	$("#test table").css('border', "1px solid #" + $("#s_table").val());
	$("#t_table, #demo_content h1").css('color', $("#s_text").val());
	if ($("#font").val() == '-Custom-' && $("#customfont").val()) {
		$("#t_table, #demo_content h1").css({'font-family': $("#customfont").val(), 'font-size': $("#fontsize").val()});
	} else if ($("#font").val() != '-Unchanged-' && $("#font").val() != '-Custom-') {
		$("#t_table, #demo_content h1").css({'font-family': $("#font").val(), 'font-size': $("#fontsize").val()});
	} else {	
		$("#t_table, #demo_content h1").css({'font-family': 'Arial, sans-serif', 'font-size': '12px'});
	}
	if ($('#hidePageTitles').is(':checked')) $("#t_link").css('textDecoration', 'underline');
	if ($('#removeBold').is(':checked')) $("#demo_content h1").css('font-weight', 'normal');
	else  $("#demo_content h1").css('font-weight', 'bold');
	if ($('#showUnderline').is(':checked')) $("#t_link").css('textDecoration', 'underline');
	else $("#t_link").css('textDecoration', 'none');
	if ($("#sfwmode").val() == 'Paranoid') $(".sampleimage").attr('style','visibility: hidden');
	else if ($("#sfwmode").val() == 'NSFW') $(".sampleimage").attr('style','visibility: visible; opacity: 1 !important;').off();
	else opacitytest();
}

function stylePreset(s) {
	if (s) {
		var bg='FFFFFF';
		var text='000000';
		var link='000099';
		var table='cccccc';
		// Specific style colours
		switch (s)
		{
			case 'White - Gray':
				text='AAAAAA';
				link='AAAAAA';
				table='AAAAAA';
				break;
			case 'White - Green':
				link='008000';
				break;
			case 'Gray - Blue':
				bg='EEEEEE';
				break;
			case 'Light Red - Pale Blue':
				bg='FFEEE3';
				text='555';
				link='7F75AA';
				break;
			case 'Black - Blue':
				bg='000000';
				text='FFFFFF';
				link='36F';
				table='333333';
				break;
			case 'Dark Brown - Off-White':
				bg='2c2c2c';
				text='e5e9a8';
				link='5cb0cc';
				table='7f7f7f';
				break;
			case 'Black - Green':
				bg='000000';
				text='FFFFFF';
				link='00FF00';
				table='333333';
				break;
			case 'Black - Red':
				bg='000000';
				text='FFFFFF';
				link='FF0000';
				table='333333';
				break;
			case 'Black - Pink':
				bg='000000';
				text='FFFFFF';
				link='FF1CAE';
				table='333333';
				break;
		}
		$('#s_bg').val(bg);
		$('#s_text').val(text);
		$('#s_link').val(link);
		$('#s_table').val(table);
		updateDemo();
	}
}

// <!-- modified from KB SSL Enforcer: https://code.google.com/p/kbsslenforcer/
function addList(type) {
	var domain = $('#url').val();
	domain = domain.toLowerCase();
	
	if (!domain.match(/^(?:[\-\w\*\?]+(\.['\-\w\*\?]+)*|((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})|\[[A-Fa-f0-9:.]+\])?$/g)) {
		$('#listMsg').html(chrome.i18n.getMessage("invaliddomain")).stop().fadeIn("slow").delay(2000).fadeOut("slow");
	} else {
		chrome.runtime.sendMessage({reqtype: "domain-handler", domain: domain, action: type}, function() {
			$('#url').val('');
			$('#listMsg').html([chrome.i18n.getMessage("whitelisted"),chrome.i18n.getMessage("blacklisted")][type]+' '+domain+'.').stop().fadeIn("slow").delay(2000).fadeOut("slow");
			listUpdate();
			$('#url').focus();
		});
	}
	return false;
}
function domainRemover(domain) {
	chrome.runtime.sendMessage({reqtype: "domain-handler", domain: domain, action: 2}, function() {
		listUpdate();
	});
	return false;
}
function listUpdate() {
	chrome.storage.local.get(['whiteList','blackList'], function(items) {
		var whiteList = JSON.parse(items['whiteList'] || '[]');
		var blackList = JSON.parse(items['blackList'] || '[]');
		
		var whitelistCompiled = '';
		if(whiteList.length==0) whitelistCompiled = '['+chrome.i18n.getMessage("empty")+']';
		else {
			whiteList.sort();
			for(var i in whiteList) whitelistCompiled += '<div class="listentry">'+whiteList[i]+' <a href="javascript:;" style="color:#f00;float:right;" rel="'+whiteList[i]+'" class="domainRemover">X</a></div>';
		}
		var blacklistCompiled = '';
		if (blackList.length==0) blacklistCompiled = '['+chrome.i18n.getMessage("empty")+']';
		else {
			blackList.sort();
			for(var i in blackList) blacklistCompiled += '<div class="listentry">'+blackList[i]+' <a href="javascript:;" style="color:#f00;float:right;" rel="'+blackList[i]+'" class="domainRemover">X</a></div>';
		}
		$('#whitelist').html(whitelistCompiled);
		$('#blacklist').html(blacklistCompiled);
		$(".domainRemover").off('click');
		$(".domainRemover").click(function() { domainRemover($(this).attr('rel'));});
		updateExport();
	});
}
function listclear(type) {
	if (confirm([chrome.i18n.getMessage("removefromwhitelist"),chrome.i18n.getMessage("removefromblacklist")][type]+'?')) {
		var key = ['whiteList','blackList'][type];
		var obj = {};
		obj[key] = JSON.stringify([]);
		chrome.storage.local.set(obj, function() {
			chrome.runtime.sendMessage({reqtype: "init-lists"});
			listUpdate();
		});
	}
	return false;
}
// from KB SSL Enforcer: https://code.google.com/p/kbsslenforcer/ -->

function revertColours(s) {
	chrome.storage.local.get(['s_bg','s_text','s_link','s_table'], function(items) {
		$('#s_bg').val(items['s_bg']);
		$('#s_text').val(items['s_text']);
		$('#s_link').val(items['s_link']);
		$('#s_table').val(items['s_table']);
		updateDemo();
	});
}

function colorPickLoad(id) {
	$('#'+id).ColorPicker({
		onBeforeShow: function () {
			$(this).ColorPickerSetColor(this.value);
		},
		onChange: function (hsb, hex, rgb) {
			$('#'+id).val(hex);
			updateDemo();
		}
	});
}

function downloadtxt() {
	var textToWrite = $("#settingsexport").val();
	var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
	var fileNameToSaveAs = "dp-settings-"+new Date().toJSON()+".txt";
	var downloadLink = document.createElement("a");
	downloadLink.download = fileNameToSaveAs;
	downloadLink.innerHTML = "Download File";
	downloadLink.href = URL.createObjectURL(textFileAsBlob);
	downloadLink.click();
	downloadLink.remove();
}
function updateExport() {
	chrome.storage.local.get(null, function(items) {
		$("#settingsexport").val("");
		settingnames = [];
		for (var i in items) {
			if (items.hasOwnProperty(i)) {
				if (i != "version") {
					settingnames.push(i);
					var val = (typeof items[i] === 'string') ? items[i] : JSON.stringify(items[i]);
					$("#settingsexport").val($("#settingsexport").val()+i+"|"+val.replace(/(?:\r\n|\r|\n)/g, ' ')+"\n");
				}
			}
		}
		$("#settingsexport").val($("#settingsexport").val().slice(0,-1));
	});
}
function settingsImport() {
	var importError = "";
	var settings_text = $("#settingsimport").val().split("\n");
	if ($.trim($("#settingsimport").val()) == "") {
		notification(chrome.i18n.getMessage("pastesettings"));
		return false;
	}
	var importObj = {};
	if (settings_text.length > 0) {
		$.each(settings_text, function(i, v) {
			if ($.trim(v) != "") {
				var settingentry = $.trim(v).split("|");
				if (settingnames.indexOf($.trim(settingentry[0])) != -1) {
					if ($.trim(settingentry[0]) == 'whiteList' || $.trim(settingentry[0]) == 'blackList') {
						var listarray = $.trim(settingentry[1]).replace(/(\[|\]|")/g,"").split(",");
						if ($.trim(settingentry[0]) == 'whiteList' && listarray.toString() != '') importObj['whiteList'] = JSON.stringify(listarray);
						else if ($.trim(settingentry[0]) == 'blackList' && listarray.toString() != '') importObj['blackList'] = JSON.stringify(listarray);
					} else {
						importObj[$.trim(settingentry[0])] = $.trim(settingentry[1]);
					}
				} else {
					importError += $.trim(settingentry[0])+", ";
				}
			}
		});
	}
	chrome.storage.local.set(importObj, function() {
		loadOptions();
		if (!importError) {
			notification(chrome.i18n.getMessage("importsuccessoptions"));
			$("#settingsimport").val("");
		} else {
			notification(chrome.i18n.getMessage("importsuccesscond")+importError.slice(0, -2));
		}
	});
}
