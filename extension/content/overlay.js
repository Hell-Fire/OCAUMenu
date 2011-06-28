var OCAU = {

	url: "http://www.overclockers.com.au/",
	forum: "http://forums.overclockers.com.au/",
	forumpage: "forumdisplay.php?f=",
	
	forums: [

		{ name: "General Topics", number: 5, sub: [
			{ name: "Newbie Lounge", number: 6 },
			{ name: "Overclocking and Hardware", number: 7 },
			{ name: "Troubleshooting Help", number: 8}
		] },

		{ name: "Specific Hardware Topics", number: 13, sub: [
			{ name: "Modding", number: 23, sub: [
				{ name:  "Worklogs and PCDB Entry Discussion", number: 52 }
			] },
			{ name: "Electronics", number: 73 },
			{ name: "PC Audio", number: 50 },
			{ name: "Extreme Cooling", number: 24 },
			{ name: "Business and Enterprise Computing", number: 25 },
			{ name: "Networking, Telephony and Internet", number: 26 },
			{ name: "Video Cards and Monitors", number: 32 },
			{ name: "Storage and Backup", number: 44 },
			{ name: "Memory", number: 68 },
			{ name: "Portable and Small Form Factor", number: 58 }
		] },

		{ name: "Manufacturer-specific Forums", number: 51, sub: [
			{ name: "Intel Hardware", number: 21 },
			{ name: "AMD Hardware", number: 22 },
			{ name: "VIA Hardware", number: 28 },
			{ name: "Apple Hardware and Software", number: 63 }
		] },

		{ name: "Software Topics", number: 38, sub: [
			{ name: "Windows Operating Systems", number: 39 },
			{ name: "Other Operating Systems", number: 40 },
			{ name: "Graphics and Programming", number: 41 },
			{ name: "Games", number: 42 },
			{ name: "General Software", number: 9 }
		] },

		{ name: "Other Topics", number: 10, sub: [
			{ name: "Motoring", number: 12, sub: [
				{ name: "Technical", number: 55 },
				{ name: "Worklogs", number: 53 },
				{ name: "Marketplace", number: 71 },
				{ name: "What/Where Should I Buy", number: 82 }

			] },
			{ name: "Geek Food", number: 30, sub: [
				{ name: "Geek Recipes", number: 65 },
				{ name: "Geek Grog", number: 72 }
			] },
			{ name: "Current Events and Serious Discussion", number: 31 },
			{ name: "Career, Education and Finance", number: 60 },
			{ name: "Lifestyle", number: 76 },
			{ name: "Entertainment (TV, Movies, Music, Books, etc)", number: 49 },
			{ name: "Musicians", number: 74, sub: [
				{ name: "Marketplace", number: 81 },
			] },
			{ name: "Sport, Fitness and Health", number: 45, sub: [
				{ name: "Journals", number: 56 },
				{ name: "Major Sporting Events", number: 57 }
			] },
			{ name: "Photography", number: 48, sub: [
				{ name: "The Gallery", number: 64 },
				{ name: "Marketplace", number: 70 }
			] },
			{ name: "Audio Visual", number: 11 },
			{ name: "Mobile Phones", number: 46 },
			{ name: "Game Consoles", number: 61, sub: [
				{ name: "Microsoft Consoles", number: 79 },
				{ name: "Nintendo Consoles", number: 80 },
				{ name: "Sony Consoles", number: 78 }
			] },
			{ name: "Pets and Animals", number: 67 },
			{ name: "Other Toys", number: 27 },
			{ name: "Science", number: 75 }
		] },

		{ name: "Shop and Swap", number: 14, sub: [
			{ name: "For Sale - PC Related", number: 15 },
			{ name: "For Sale - Non PC-Related", number: 77 },
			{ name: "Wanted to Buy", number: 16 },
			{ name: "Price Check", number: 33 },
			{ name: "What/Where Should I Buy?", number: 18 },
			{ name: "Sponsor Specials", number: 54 }
		] },

		{ name: "OCAU Community", number: 1, sub: [
			{ name: "Site Discussion", number: 3, sub: [
				{ name: "OCAU Podcast Discussion", number: 66 }
			] },
			{ name: "News", number: 34 },
			{ name: "Team OCAU - Distributed Computing", number: 29 },
			{ name: "The Pub", number: 4 },
			{ name: "The Pool Room", number: 47 },
			{ name: "TEST FORUM", number: 17 }
		] }
			
	],

	makeLink: function(type, label, link) {
		var item;
		item = document.createElement(type);
		item.setAttribute('label', label);
		if (link) {
				item.link = link;
				item.addEventListener('click', OCAU.openLinkEvent, false);
		}
		return(item);
	},

	makeMenuItem: function(label, link) {
		return(OCAU.makeLink('menuitem', label, link));
	},

	makeMenu: function(label) {
		return(OCAU.makeLink('menu', label));
	},

	generateMenu: function(menu, menustruct) {
		var item, itemid, temp, tempPopup;
		for (itemid in menustruct) {
			item = menustruct[itemid];
			if (item.sub != undefined) {
				/* Has submenus */
				temp = this.makeLink('menu', item.name, this.forum + this.forumpage + item.number);
				tempPopup = document.createElement('menupopup');
				OCAU.generateMenu(tempPopup, item.sub);
				temp.appendChild(tempPopup);
			} else {
				/* Normal link */
				temp = this.makeLink('menuitem', item.name, this.forum + this.forumpage + item.number);
			}
			menu.appendChild(temp);
		}
	},

	onLoad: function() {
		makeMenuItem = this.makeMenuItem;
		makeMenu = this.makeMenu;
		makeLink = this.makeLink;

		forums = this.forums;
		menu = document.getElementById('ocau-menu');
		newmenu = document.createElement('menupopup');

		/* Heading section, basic links */
		newmenu.appendChild(makeMenuItem('Overclockers - Main Page', this.url));
		newmenu.appendChild(makeMenuItem('Overclockers - Forums', this.forum));
		newmenu.appendChild(makeMenuItem('Overclockers - Search Forums', this.forum + 'search.php'));
		newmenu.appendChild(document.createElement('menuseparator'));

		OCAU.generateMenu(newmenu, forums);

		/* User specific */
		newmenu.appendChild(document.createElement('menuseparator'));
		userMenu = makeMenu('User Control Panel');
		userPopup = document.createElement('menupopup');
		userPopup.appendChild(makeMenuItem('User CP', this.forum + 'usercp.php'));
		userPopup.appendChild(makeMenuItem('List Private Messages', this.forum + 'private.php'));
		userPopup.appendChild(makeMenuItem('List Subscriptions', this.forum + 'subscription.php?do=viewsubscription'));
		userMenu.appendChild(userPopup);
		newmenu.appendChild(userMenu);

		menu.replaceChild(newmenu, menu.firstChild);

		this.initialized = true;
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

window.addEventListener("load", function(e) { OCAU.onLoad(e); }, false); 

