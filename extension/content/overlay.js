Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://gre/modules/NetUtil.jsm");

var OCAUMenu = {
		
	pluginVersion: 102, // Only really used for the cache file version

	url: "http://www.overclockers.com.au/",
	forum: "http://forums.overclockers.com.au/",
	forumpage: "forumdisplay.php?f=",
	
	forums: new Array(),

	makeLink: function(type, label, link) {
		var item;
		item = document.createElement(type);
		item.setAttribute('label', label);
		if (link) {
				item.link = link;
				item.addEventListener('click', OCAUMenu.openLinkEvent, false);
		}
		return(item);
	},

	makeMenuItem: function(label, link) {
		return(this.makeLink('menuitem', label, link));
	},

	makeMenu: function(label) {
		return(this.makeLink('menu', label));
	},

	generateMenu: function(menu, menustruct) {
		var item, itemid, temp, tempPopup;
		for (itemid in menustruct) {
			item = menustruct[itemid];
			if (item.sub != undefined) {
				/* Has submenus */
				temp = this.makeLink('menu', item.name, this.forum + this.forumpage + item.number);
				tempPopup = document.createElement('menupopup');
				this.generateMenu(tempPopup, item.sub);
				temp.appendChild(tempPopup);
			} else {
				/* Normal link */
				temp = this.makeLink('menuitem', item.name, this.forum + this.forumpage + item.number);
			}
			menu.appendChild(temp);
		}
	},
	
	buildMenu: function() {
		var newmenu = document.createElement('menupopup');
		
		/* Heading section, basic links */
		newmenu.appendChild(this.makeMenuItem('Overclockers - Main Page', this.url));
		newmenu.appendChild(this.makeMenuItem('Overclockers - Forums', this.forum));
		newmenu.appendChild(this.makeMenuItem('Overclockers - Search Forums', this.forum + 'search.php'));
		newmenu.appendChild(document.createElement('menuseparator'));
		
		// Dynamic menu DOM build
		this.generateMenu(newmenu, this.forums);
		newmenu.appendChild(document.createElement('menuseparator'));
		
		/* User specific */
		var userMenu = this.makeMenu('User Control Panel');
		var userPopup = document.createElement('menupopup');
		userPopup.appendChild(this.makeMenuItem('User CP', this.forum + 'usercp.php'));
		userPopup.appendChild(this.makeMenuItem('List Private Messages', this.forum + 'private.php'));
		userPopup.appendChild(this.makeMenuItem('List Subscriptions', this.forum + 'subscription.php?do=viewsubscription'));
		userMenu.appendChild(userPopup);
		newmenu.appendChild(userMenu);
		
		return newmenu;
	},
	
	setupMenus: function() {
		// Replace the default menu
		var menuElem = document.getElementById('ocau-menu');
		if (menuElem) {
			menuElem.replaceChild(this.buildMenu(), menuElem.firstChild);
		}
		var button = document.getElementById('ocau-button');
		if (button) {
			button.replaceChild(this.buildMenu(), button.firstChild);
		}
	},
	
	log: function(message) {
		var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
				.getService(Components.interfaces.nsIConsoleService);
		consoleService.logStringMessage("OCAUMenu: " + message);
	},
	
	init: function() {

		if (!this.initialized) {
			OCAUMenu.log("OCAUMenu initializing...")
			this.setupMenus();

			this.cacheFile = FileUtils.getFile('ProfD', ['ocauMenu.cache']);
			try {
				// TODO: this might race here, something to keep in mind
				this.readFile(this.cacheFile, OCAUMenu.loadFile);
			} catch (e) {
				OCAUMenu.log("Couldn't fetch ocauMenu.cache: " + e.name + " - " + e.message);
				this.doHTTPRequest();
			}
		}
	},
	
	loadFile: function(inputStream, result) {
		if (Components.isSuccessCode(result)) {
			var data = JSON.parse(NetUtil.readInputStreamToString(inputStream, inputStream.available()));
			if (data) {
				OCAUMenu.log("File loaded okay");
				if (data.version && data.version == OCAUMenu.pluginVersion) { // Don't load if the cache version is different
					data.lastUpdated = new Date(data.lastUpdated);
					var aWeekAgo = new Date();
					aWeekAgo.setDate(aWeekAgo.getDate()-7);
					if (data.lastUpdated > aWeekAgo) {
						OCAUMenu.log("Using data from file");
						OCAUMenu.forums = data.forums;
						OCAUMenu.setupMenus.apply(OCAUMenu);
						OCAUMenu.initialized = true;
						return;
					}
				}
			}
		}
		OCAUMenu.doHTTPRequest.apply(OCAUMenu);
	},
	
	doHTTPRequest: function() {
		OCAUMenu.log("Sending HTTP Request");
		this.request = new XMLHttpRequest();
		this.request.open('GET', this.forum + 'index.php', true);
		this.request.onreadystatechange = OCAUMenu.updateMenu;
		this.request.send();
		this.initialized = true;
	},
	
	/*
	 * Callbacks below, unknown reference objects, beware pirates, etc
	 */
	updateMenu: function() {
		// All this code is pretty specific to OCAU and probably VB3, so is likely to break elsewhere or on changes
		// This is a XMLHttpRequest callback, so this isn't our object
		if (OCAUMenu.request.readyState == 4 && (OCAUMenu.request.status == 200 || OCAUMenu.request.status == 0)) {
			OCAUMenu.log("Loaded data from HTTP - " + OCAUMenu.request.status);
			/*  Forums have 3 main types
			*	- Categories
			*	- Forums
			*	- Subforums
			*/
			var text = OCAUMenu.request.responseText;
			
			text = text.match(/.*<a href="forumdisplay.php?.*<\/a>/g); // Find the forum lines we're interested in
			
			var newForums = new Array();
			var category = null;
			var forum = null;
			for (var lineNum = 0; lineNum < text.length; ++lineNum) {
				// Categories are the plainest looking
				// Forums have <strong> around their names
				// Subforums are chucked in on a single line
				// Check in reverse order makes it easy
				if (text[lineNum].match(/<strong>Sub-Forums<\/strong>:/)) {
					if (typeof(forum.sub) == "undefined") { forum.sub = new Array(); }
					var subs = text[lineNum].match(/f=[0-9]*">.*?<\/a>/g);
					for (var i = 0; i < subs.length; ++i) {
						var cur = subs[i].match(/f=([0-9]*)">(.*)<\/a>/);
						var name = cur[2].replace(/&amp;/gi, "&");
						var number = cur[1];
						forum.sub.push({ name: name, number: number });
					}
				} else {
					var cur = text[lineNum].match(/f=([0-9]*)">(<strong>)?(.*?)(<\/strong>)?<\/a>/);
					if (cur) { // We have a forum! (ignore other forumdisplay.php links without a forum)
						var name = cur[3].replace(/&amp;/gi, "&");
						var number = cur[1];
						if (!cur[2]) { // Is a category (doesn't have <strong> tag
							if (category) { // We had a category
								if (forum) { // And a forum in the category
									category.sub.push(forum);
									forum = null;	
								}
								newForums.push(category); 
							}
							category = { name: name, number: number };
						} else { // Is a forum
							if (typeof(category.sub) == "undefined") { category.sub = new Array(); }
							if (forum) {
								category.sub.push(forum);
							}
							forum = { name: name, number: number };
						}
					}
				}

			}
			// Push the last forum and category into the new menu
			if (forum) {
				category.sub.push(forum);
				forum = null;
			}
			if (category) {
				newForums.push(category);
				category = null;
			}
			
			OCAUMenu.log("Parsed data, updating!");
			
			OCAUMenu.forums = newForums;
			
			// Update the DOM elements
			OCAUMenu.setupMenus.apply(OCAUMenu);
			
			try {
				OCAUMenu.log("Writing to cache");
				var now = new Date();
				OCAUMenu.writeFile(OCAUMenu.cacheFile, JSON.stringify({ forums: OCAUMenu.forums, lastUpdated: now.getTime(), version: OCAUMenu.pluginVersion }));
			} catch (e) {
				OCAUMenu.log("Couldn't write to file: " + e.name + " - " + e.message);
			}
		}
	},
	
	readFile: function(file, callback) {
		NetUtil.asyncFetch(file, callback);
	},
	
	writeFile: function(file, inString) {
		var ostream = FileUtils.openSafeFileOutputStream(file);
		var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
			createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
		converter.charset = "UTF-8";
		var istream = converter.convertToInputStream(inString);
		NetUtil.asyncCopy(istream, ostream);
	},

	onLoad: function() {
		OCAUMenu.init.apply(OCAUMenu);
	},

	openLinkEvent: function(event) {
			var link = event.target.link;
			if (event.button != 0) {
				getBrowser().addTab(link);
			} else {
				loadURI(link);
				if (event.target.nodeName == 'menu') {
					closeMenus(event.target.parentNode);
				}
			}
			if (event.target.nodeName == 'menuitem') {
				event.stopPropagation();
			}
	}
};

window.addEventListener("DOMContentLoaded", OCAUMenu.onLoad, false);
window.addEventListener("aftercustomization", OCAUMenu.onLoad, false);

