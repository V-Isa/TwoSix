(function () {
function TwoSixExtension () {
	this.register();
	};

TwoSixExtension.prototype = {
	urlsList : {
		main : 'http://26.netslova.ru/',
		editorbriefcase : 'http://26.netslova.ru/Current',
		guestbook : 'http://26.netslova.ru/Guestbook',
		addt : 'http://26.netslova.ru/Add',
		search : 'http://26.netslova.ru/Search'
		},
	g_tsTimerId: -1,
	g_tsWSChangesRefreshInterval: 60*1000*15,
	g_tsTCountToShow : -1,
	g_tsLastTotalTCount : '?',
	g_tsLastCurrentMonthTCount : '?',
	g_tsGBHasNewMessages : false,
	g_tsEBcMonthTopic : '',
	g_tsDoNotGetTwoSixWSChangesImmediately : false,
	g_tsUseNameAndEMailOnlyFromPrefernces : false,
	g_tsAName : '',
	g_tsAEMail : '',
	g_tsUrlNameToOpenWhenMainButtonIsClicked : 'main',
	g_tsObserver : null,
	g_tsLastVisibility : false,
	g_tsUIControlsHaveCommands : false,
	g_tsXHRequest : null,
	
	register : function () {
		this.utils.log('TwoSix: register() has been started.');
		var self = this;
		this.converterEngine.parObj = this;
		
		this.g_tsXHRequest = new XMLHttpRequest();
		this.g_tsXHRequest.onreadystatechange = function() {
			self.utils.log('TwoSix: g_tsXHRequest.onreadystatechange() has been started.');
			if (self.g_tsXHRequest.readyState == 4) {
				if (self.g_tsXHRequest.status == 200) {
					if (self.g_tsXHRequest.responseText) {
						var result = self.GetDataByParsingHTML(self.g_tsXHRequest.responseText);
						if(result[0] != null) {
							self.SetToolTipText(result[0][1],result[0][2]);
							var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('extensions.twosix.');
							var pLastTCount = prefs.getIntPref('last-t-count');
							if ((pLastTCount > -1) && (result[0][1] > -1)) {
								if(result[0][1] >= pLastTCount) {
									self.g_tsTCountToShow = result[0][1] - pLastTCount;
									}
								else {
									prefs.setIntPref('last-t-count', result[0][1]);
									self.g_tsTCountToShow = 0;
									}
								}
							else {
								if (result[0][1] > -1) {
									self.g_tsTCountToShow = result[0][1];
									}
								else {
									if (pLastTCount > -1) {
										prefs.setIntPref('last-t-count',-1);
										self.g_tsTCountToShow = 0;
										}
									else {
										prefs.setIntPref('last-t-count',-1);
										self.g_tsTCountToShow = 0;
										}
									}
								}
							}
						else {
							self.utils.log('TwoSix: couldn\'t get result[0].');
							}
						if(result[1] == 0) {
							self.g_tsGBHasNewMessages = false;
							}
						else {
							if(result[1] == 1) {
								self.g_tsGBHasNewMessages = true;
								}
							}
						if(result[2] != null) {
							self.g_tsEBcMonthTopic = result[2][1];
							}
						else {
							self.g_tsEBcMonthTopic = '';
							}
						self.FormAndShowWSChangesInformation();
						self.g_tsTimerId = window.setTimeout(function() {self.GetTwoSixWSChanges();}, self.g_tsWSChangesRefreshInterval, self);
						self.utils.log('TwoSix: timer has been started.');
						return;
						}
					else {
						self.utils.log('TwoSix: couldn\'t get g_tsXHRequest.responseText.');
						self.g_tsTimerId = window.setTimeout(function() {self.GetTwoSixWSChanges();}, 60*1000*1, self);
						self.utils.log('TwoSix: timer has been started.');
						}
					}
				else {
					self.utils.log('TwoSix: g_tsXHRequest.status is not 200.');
					self.g_tsTimerId = window.setTimeout(function() {self.GetTwoSixWSChanges();}, 60*1000*1, self);
					self.utils.log('TwoSix: timer has been started.');
					}
				}
			else {
				self.utils.log('TwoSix: g_tsXHRequest.readyState is not 4.');
				}
			self.utils.log('TwoSix: g_tsXHRequest.onreadystatechange() has been finished');
			return;
			};
		
		this.g_tsXHRequest.onerror = function() {
			self.utils.log('TwoSix: g_tsXHRequest.onerror() has been started');
			self.g_tsTimerId = window.setTimeout(function() {self.GetTwoSixWSChanges();}, 60*1000*1, self);
			self.utils.log('TwoSix: timer has been started.');
			self.utils.log('TwoSix: g_tsXHRequest.onerror() has been finished');
			return;
			};
		
		this.GetUrlNumberAndSetUrlNameToOpenWhenMainButtonIsClicked();
		
		//this.SetToolTipText('?','?');
		//this.GetAndShowAuthoursNameEMail();
		this.GetAndSetWSChangesRefreshInterval(false);
		
		function observerObj() {
			this.register();
			};
		observerObj.prototype = {
			observe: function(subject, topic, data) {
				//self.utils.log('TwoSix: observe() has been started.');
				if (topic == 'cookie-changed') {
					//self.utils.log('TwoSix: cookie-changed has occurred.');
					var cookie = Components.interfaces.nsICookie2;
					if (cookie && subject.QueryInterface) {
						cookie = subject.QueryInterface(cookie);
						if (cookie) {
							if(cookie.host == '26.netslova.ru') {
								switch(cookie.name) {
									case 'Tank_Name':
										self.utils.log('TwoSix: cookie-changed has occurred, Tank_Name has been modified.');
										self.GetAndShowAuthoursNameEMail();
									break;
									case 'Tank_Mail':
										self.utils.log('TwoSix: cookie-changed has occurred, Tank_Mail has been modified.');
										self.GetAndShowAuthoursNameEMail();
									break;
									case 'Tank_LastGB':
										self.utils.log('TwoSix: cookie-changed has occurred, Tank_LastGB has been modified.');
										if(self.g_tsLastVisibility) {
											if(self.g_tsTimerId != -1) {
												window.clearTimeout(self.g_tsTimerId);
												self.g_tsTimerId = -1;
												self.utils.log('TwoSix: timer has been stopped.');
												}
											self.GetTwoSixWSChanges();
											}
									break;
									}
								}
							}
						}
					}
				else {
					if (topic == 'nsPref:changed') {
						//self.utils.log('TwoSix: nsPref:changed has occurred.');
						switch(data) {
							case 'extensions.twosix.url-number-to-open-when-main-button-is-clicked':
								self.utils.log('TwoSix: nsPref:changed has occurred, url-number-to-open-when-main-button-is-clicked has been modified.');
								self.GetUrlNumberAndSetUrlNameToOpenWhenMainButtonIsClicked();
							break;
							case 'extensions.twosix.refresh-interval':
								self.utils.log('TwoSix: refresh-interval has been modified.');
								self.GetAndSetWSChangesRefreshInterval(self.g_tsLastVisibility);
							break;
							case 'extensions.twosix.last-t-count':
								self.utils.log('TwoSix: nsPref:changed has occurred, last-t-count has been modified.');
								if(self.g_tsLastVisibility) {
									if(self.g_tsTimerId != -1) {
										window.clearTimeout(self.g_tsTimerId);
										self.g_tsTimerId = -1;
										self.utils.log('TwoSix: timer has been stopped.');
										}
									}
								if (self.g_tsDoNotGetTwoSixWSChangesImmediately) {
									self.g_tsDoNotGetTwoSixWSChangesImmediately = false;
									if(self.g_tsLastVisibility) {
										self.g_tsTimerId = window.setTimeout(function() {self.GetTwoSixWSChanges();}, self.g_tsWSChangesRefreshInterval, self);
										self.utils.log('TwoSix: timer has been started.');
										}
									}
								else {
									if(self.g_tsLastVisibility) {
										self.GetTwoSixWSChanges();
										}
									}
							break;
							case 'extensions.twosix.use-name-and-email-only-from-prefernces':
								self.utils.log('TwoSix: nsPref:changed has occurred, use-name-and-email-only-from-prefernces has been modified.');
								self.GetAndShowAuthoursNameEMail();
							break;
							case 'extensions.twosix.name':
								self.utils.log('TwoSix: nsPref:changed has occurred, name has been modified.');
								self.GetAndShowAuthoursNameEMail();
							break;
							case 'extensions.twosix.email':
								self.utils.log('TwoSix: nsPref:changed has occurred, email has been modified.');
								self.GetAndShowAuthoursNameEMail();
							break;
							}
						}
					};
				if (topic == 'xul-window-visible' || topic == 'xul-window-destroyed') {
					var bBc = document.getElementById('twosix-ui-browserButton-container');
					var bBcVisibility = false;
					if(bBc) {
						bBcVisibility = true;
						};
					switch (topic) {
						case 'xul-window-visible':
							//self.utils.log('S:' + bBcVisibility + ' ' + self.g_tsLastVisibility);
							if (!self.g_tsLastVisibility&&bBcVisibility) {
								self.g_tsLastVisibility = bBcVisibility;
								self.OnXULShow();
								};
							if(bBcVisibility)
						break;
						case 'xul-window-destroyed':
							//self.utils.log('H:' + bBcVisibility + ' ' + self.g_tsLastVisibility);
							if(!bBcVisibility&&self.g_tsLastVisibility) {
								self.g_tsLastVisibility = bBcVisibility;
								self.OnXULHide();
								};
						break;
						};
					//self.g_tsLastVisibility = bBcVisibility;
					};
				//self.utils.log('TwoSix: observe() has been finished.');
				return;
				},
			observeWPs : function (e) {
				//self.utils.log('TwoSix: observeWPs() has been started.');
				var dV = e.target.defaultView;
				if(dV) {
					var loc = new XPCNativeWrapper(dV, 'location').location;
					if(loc) {
						var href = new XPCNativeWrapper(loc, 'href').href;
						if (href) {
							var dVdoc = dV.document;
							if (dVdoc) {
								if (href.match(/^http:\/\/(?:www\.)?26\.netslova\.ru\/(?:.*)?Current$/i)) {
									self.utils.log('TwoSix: /Current has been loaded.');
									var result = self.GetDataByParsingHTML(dVdoc.documentElement.innerHTML);
									if (result[0] != null) {
										self.SetToolTipText(result[0][1],result[0][2]);
										var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('extensions.twosix.');
										self.g_tsDoNotGetTwoSixWSChangesImmediately = true;
										prefs.setIntPref('last-t-count', result[0][1]);
										self.g_tsTCountToShow = 0;
										self.FormAndShowWSChangesInformation();
										}
									};
								if (href.match(/^http:\/\/(?:www\.)?26\.netslova\.ru\/(?:.*)?Guestbook$/i)) {
									self.utils.log('TwoSix: /Guestbook has been loaded.');
									self.g_tsGBHasNewMessages = false;
									self.FormAndShowWSChangesInformation();
									};
								}
							}
						}
					}
				//self.utils.log('TwoSix: observeWPs() has been finished.');
				return;
				},
			register : function() {
				self.utils.log('TwoSix: observerObj.register() has been started.');
				var observerService = Components.classes['@mozilla.org/observer-service;1'].getService(Components.interfaces.nsIObserverService);
				observerService.addObserver(this, 'cookie-changed', false);
				
				observerService.addObserver(this, 'xul-window-visible', false);
				observerService.addObserver(this, 'xul-window-destroyed', false);
				
				var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch);
				var pbi = prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
				pbi.addObserver('', this.observe, false);
				
				window.addEventListener('DOMContentLoaded', this.observeWPs, true);
				self.utils.log('TwoSix: observerObj.register() has been finished.');
				return;
				},
			unregister : function() {
				self.utils.log('TwoSix: observerObj.unregister() has been started.');
				var observerService = Components.classes['@mozilla.org/observer-service;1'].getService(Components.interfaces.nsIObserverService);
				observerService.removeObserver(this, 'cookie-changed');
				
				observerService.removeObserver(this, 'xul-window-visible', false);
				observerService.removeObserver(this, 'xul-window-destroyed', false);
				
				var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch)
				var pbi = prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
				pbi.removeObserver('', this.observe, false);
				
				window.removeEventListener('DOMContentLoaded', this.observeWPs, true);
				self.utils.log('TwoSix: observerObj.unregister() has been finished.');
				return;
				}
			};
		
		this.g_tsObserver = new observerObj();
		
		window.addEventListener('unload', function() {self.unregister();}, false);
		
		this.utils.log('TwoSix: register() has been finished.');
		},
	
	unregister : function () {
		this.utils.log('TwoSix: unregister() has been started.');
		if (this.g_tsTimerId != -1) {
			window.clearTimeout(this.g_tsTimerId);
			self.g_tsTimerId = -1;
			this.utils.log('TwoSix: timer has been stopped.');
			}
		this.g_tsXHRequest.abort();
		if(this.g_tsObserver) {
			this.g_tsObserver.unregister();
			}
		this.utils.log('TwoSix: unregister() has been finished.');
		return;
		},
	
	OnXULShow : function () {
		this.utils.log('TwoSix: OnXULShow() has been started.');
		var self = this;
		if(!this.g_tsUIControlsHaveCommands) {
			//главная кнопка расширения
			document.getElementById('twosix-ui-browserButton').addEventListener('command', function (e) {
				self.utils.log('TwoSix: twosix-ui-browserButton.oncommand() has been started.');
				self.GoToURL('');
				self.utils.log('TwoSix: twosix-ui-browserButton.oncommand() has been finished.');
				return;
				});
			//обновить информацию
			document.getElementById('twosix-ui-menuItem-refreshInformation').addEventListener('command', function (e) {
				self.utils.log('TwoSix: twosix-ui-menuItem-refreshInformation.oncommand() has been started.');
				e.cancelBubble = true;
				if(self.g_tsTimerId!=-1) {
					window.clearTimeout(self.g_tsTimerId);
					self.g_tsTimerId = -1;
					self.utils.log('TwoSix: timer has been stopped.');
					}
				self.SetTSButtonStyleImage('chrome://twosix/content/icons/anim-button.gif');
				self.GetTwoSixWSChanges();
				self.utils.log('TwoSix: twosix-ui-menuItem-refreshInformation.oncommand() has been finished.');
				return;
				});
			//открыть главную страницу
			document.getElementById('twosix-ui-menuItem-goToMainPage').addEventListener('command',function (e) {
				self.utils.log('TwoSix: twosix-ui-menuItem-goToMainPage.oncommand() has been started.');
				e.cancelBubble = true;
				self.GoToURL('main');
				self.utils.log('TwoSix: twosix-ui-menuItem-goToMainPage.oncommand() has been finished.');
				return;
				});
			//открыть портфель редактора
			document.getElementById('twosix-ui-menuItem-goToEditorBriefcase').addEventListener('command', function (e) {
				self.utils.log('TwoSix: twosix-ui-menuItem-goToEditorBriefcase.oncommand() has been started.');
				e.cancelBubble = true;
				self.GoToURL('editorbriefcase');
				self.utils.log('TwoSix: twosix-ui-menuItem-goToEditorBriefcase.oncommand() has been finished.');
				return;
				});
			//открыть книгу отзывов
			document.getElementById('twosix-ui-menuItem-goToGuestBook').addEventListener('command', function (e) {
				self.utils.log('TwoSix: twosix-ui-menuItem-goToGuestBook.oncommand() has been started.');
				e.cancelBubble = true;
				self.GoToURL('guestbook');
				self.utils.log('TwoSix: twosix-ui-menuItem-goToGuestBook.oncommand() has been finished.');
				return;
				});
			//открыть поиск
			document.getElementById('twosix-ui-menuItem-goToSearchPage').addEventListener('command', function (e) {
				self.utils.log('TwoSix: twosix-ui-menuItem-goToSearchPage.oncommand() has been started.');
				e.cancelBubble = true;
				self.GoToURL('search');
				self.utils.log('TwoSix: twosix-ui-menuItem-goToSearchPage.oncommand() has been finished.');
				return;
				});
			//настройка
			document.getElementById('twosix-ui-menuItem-openOptionsDialog').addEventListener('command', function (e) {
				self.utils.log('TwoSix: twosix-ui-menuItem-openOptionsDialog.oncommand() has been started.');
				e.cancelBubble = true;
				window.openDialog('chrome://twosix/content/options.xul','twosix-ui-options-dialog-window','chrome,dialog,centerscreen,modal,alwaysRaised');
				self.utils.log('TwoSix: twosix-ui-menuItem-openOptionsDialog.oncommand() has been finished.');
				return;
				});
			//добавить танкетку
			document.getElementById('twosix-ui-menuItem-addOneT').addEventListener('command', function (e) {
				self.utils.log('TwoSix: twosix-ui-menuItem-addOneT.oncommand() has been started.');
				e.cancelBubble = true;
				self.GoToURL('addt');
				self.utils.log('TwoSix: twosix-ui-menuItem-addOneT.oncommand() has been finished.');
				return;
				});
			//добавить танкетку с эпиграфом
			document.getElementById('twosix-ui-menuItem-addOneTWithEpigraph').addEventListener('command', function (e) {
				self.utils.log('TwoSix: twosix-ui-menuItem-addOneTWithEpigraph.oncommand() has been started.');
				e.cancelBubble = true;
				if(self.g_tsAName == '') {
					self.utils.log('TwoSix: g_tsAName is not set.');
					alert('Необходимо задать имя автора!');
					}
				else {
					self.GoToURL('addt', '?Add_proc=1&first=1&edit_tank='+(self.g_tsEBcMonthTopic==''?'':'&Cur_Theme='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsEBcMonthTopic)))+'&name='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsAName))+(self.g_tsAName==''?'':'&mail='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsAEMail)))+'&row1=&row2=&count=1&Cycle=%CF%EE%E5%F5%E0%EB%E8');
					};
				self.utils.log('TwoSix: twosix-ui-menuItem-addOneTWithEpigraph.oncommand() has been finished.');
				return;
				});
			//добавить цикл из 2х танкеток
			document.getElementById('twosix-ui-menuItem-addTwoTWithEpigraph').addEventListener('command', function (e) {
				self.utils.log('TwoSix: twosix-ui-menuItem-addTwoTWithEpigraph.oncommand() has been started.');
				e.cancelBubble = true;
				if(self.g_tsAName == '') {
					self.utils.log('TwoSix: g_tsAName is not set.');
					alert('Необходимо задать имя автора!');
					}
				else {
					self.GoToURL('addt', '?Add_proc=1&first=1&edit_tank='+(self.g_tsEBcMonthTopic==''?'':'&Cur_Theme='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsEBcMonthTopic)))+'&name='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsAName))+(self.g_tsAName==''?'':'&mail='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsAEMail)))+'&row1=&row2=&count=2&Cycle=%CF%EE%E5%F5%E0%EB%E8');
					};
				self.utils.log('TwoSix: twosix-ui-menuItem-addTwoTWithEpigraph.oncommand() has been finished.');
				return;
				});
			//добавить цикл из 3х танкеток
			document.getElementById('twosix-ui-menuItem-addThreeTWithEpigraph').addEventListener('command', function (e) {
				self.utils.log('TwoSix: twosix-ui-menuItem-addThreeTWithEpigraph.oncommand() has been started.');
				e.cancelBubble = true;
				if(self.g_tsAName == '') {
					self.utils.log('TwoSix: g_tsAName is not set.');
					alert('Необходимо задать имя автора!');
					}
				else {
					self.GoToURL('addt', '?Add_proc=1&first=1&edit_tank='+(self.g_tsEBcMonthTopic==''?'':'&Cur_Theme='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsEBcMonthTopic)))+'&name='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsAName))+(self.g_tsAName==''?'':'&mail='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsAEMail)))+'&row1=&row2=&count=3&Cycle=%CF%EE%E5%F5%E0%EB%E8');
					};
				self.utils.log('TwoSix: twosix-ui-menuItem-addThreeTWithEpigraph.oncommand() has been finished.');
				return;
				});
			//добавить цикл из 4х танкеток
			document.getElementById('twosix-ui-menuItem-addFourTWithEpigraph').addEventListener('command', function (e) {
				self.utils.log('TwoSix: twosix-ui-menuItem-addFourTWithEpigraph.oncommand() has been started.');
				e.cancelBubble = true;
				if(self.g_tsAName == '') {
					self.utils.log('TwoSix: g_tsAName is not set.');
					alert('Необходимо задать имя автора!');
					}
				else {
					self.GoToURL('addt', '?Add_proc=1&first=1&edit_tank='+(self.g_tsEBcMonthTopic==''?'':'&Cur_Theme='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsEBcMonthTopic)))+'&name='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsAName))+(self.g_tsAName==''?'':'&mail='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsAEMail)))+'&row1=&row2=&count=4&Cycle=%CF%EE%E5%F5%E0%EB%E8');
					};
				self.utils.log('TwoSix: twosix-ui-menuItem-addFourTWithEpigraph.oncommand() has been finished.');
				return;
				});
			//добавить танкетку на тему месяца
			document.getElementById('twosix-ui-menuItem-addMonthTopicOneT').addEventListener('command', function (e) {
				self.utils.log('TwoSix: twosix-ui-menuItem-addMonthTopicOneT.oncommand() has been started.');
				e.cancelBubble = true;
				self.GoToURL('addt','',true);
				self.utils.log('TwoSix: twosix-ui-menuItem-addMonthTopicOneT.oncommand() has been finished.');
				return;
				});
			//добавить танкетку с эпиграфом на тему месяца
			document.getElementById('twosix-ui-menuItem-addMonthTopicOneTWithEpigraph').addEventListener('command', function (e) {
				self.utils.log('TwoSix: twosix-ui-menuItem-addMonthTopicOneTWithEpigraph.oncommand() has been started.');
				e.cancelBubble = true;
				if(self.g_tsAName == '') {
					self.utils.log('TwoSix: g_tsAName is not set.');
					alert('Необходимо задать имя автора!');
					}
				else {
					self.GoToURL('addt', '?Add_proc=1&first=1&edit_tank='+(self.g_tsEBcMonthTopic==''?'':'&Cur_Theme='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsEBcMonthTopic)))+'&name='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsAName))+(self.g_tsAName==''?'':'&mail='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsAEMail)))+'&row1=&row2=&For_Theme=1&count=1&Cycle=%CF%EE%E5%F5%E0%EB%E8');
					};
				self.utils.log('TwoSix: twosix-ui-menuItem-addMonthTopicOneTWithEpigraph.oncommand() has been finished.');
				return;
				});
			//добавить цикл из 2х танкеток на тему месяца
			document.getElementById('twosix-ui-menuItem-addMonthTopicTwoTWithEpigraph').addEventListener('command', function (e) {
				self.utils.log('TwoSix: twosix-ui-menuItem-addMonthTopicTwoTWithEpigraph.oncommand() has been started.');
				e.cancelBubble = true;
				if(self.g_tsAName == '') {
					self.utils.log('TwoSix: g_tsAName is not set.');
					alert('Необходимо задать имя автора!');
					}
				else {
					self.GoToURL('addt', '?Add_proc=1&first=1&edit_tank='+(self.g_tsEBcMonthTopic==''?'':'&Cur_Theme='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsEBcMonthTopic)))+'&name='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsAName))+(self.g_tsAName==''?'':'&mail='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsAEMail)))+'&row1=&row2=&For_Theme=1&count=2&Cycle=%CF%EE%E5%F5%E0%EB%E8');
					};
				self.utils.log('TwoSix: twosix-ui-menuItem-addMonthTopicTwoTWithEpigraph.oncommand() has been finished.');
				return;
				});
			//добавить цикл из 3х танкеток на тему месяца
			document.getElementById('twosix-ui-menuItem-addMonthTopicThreeTWithEpigraph').addEventListener('command', function (e) {
				self.utils.log('TwoSix: twosix-ui-menuItem-addMonthTopicThreeTWithEpigraph.oncommand() has been started.');
				e.cancelBubble = true;
				if(self.g_tsAName == '') {
					self.utils.log('TwoSix: g_tsAName is not set.');
					alert('Необходимо задать имя автора!');
					}
				else {
					self.GoToURL('addt', '?Add_proc=1&first=1&edit_tank='+(self.g_tsEBcMonthTopic==''?'':'&Cur_Theme='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsEBcMonthTopic)))+'&name='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsAName))+(self.g_tsAName==''?'':'&mail='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsAEMail)))+'&row1=&row2=&For_Theme=1&count=3&Cycle=%CF%EE%E5%F5%E0%EB%E8');
					};
				self.utils.log('TwoSix: twosix-ui-menuItem-addMonthTopicThreeTWithEpigraph.oncommand() has been finished.');
				return;
				});
			//добавить цикл из 4х танкеток на тему месяца
			document.getElementById('twosix-ui-menuItem-addMonthTopicFourTWithEpigraph').addEventListener('command', function (e) {
				self.utils.log('TwoSix: twosix-ui-menuItem-addMonthTopicFourTWithEpigraph.oncommand() has been started.');
				e.cancelBubble = true;
				if(self.g_tsAName == '') {
					self.utils.log('TwoSix: g_tsAName is not set.');
					alert('Необходимо задать имя автора!');
					}
				else {
					self.GoToURL('addt', '?Add_proc=1&first=1&edit_tank='+(self.g_tsEBcMonthTopic==''?'':'&Cur_Theme='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsEBcMonthTopic)))+'&name='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsAName))+(self.g_tsAName==''?'':'&mail='+self.converterEngine.convert_to_cp1251(self.converterEngine.urlencode(self.g_tsAEMail)))+'&row1=&row2=&For_Theme=1&count=4&Cycle=%CF%EE%E5%F5%E0%EB%E8');
					};
				self.utils.log('TwoSix: twosix-ui-menuItem-addMonthTopicFourTWithEpigraph.oncommand() has been finished.');
				return;
				});
			this.g_tsUIControlsHaveCommands = true;
			}
		this.SetToolTipText('?','?');
		this.GetAndShowAuthoursNameEMail();
		this.FormAndShowWSChangesInformation();
		this.GetTwoSixWSChanges();
		this.utils.log('TwoSix: OnXULShow() has been finished.');
		return;
		},
	
	OnXULHide : function () {
		this.utils.log('TwoSix: OnXULHide() has been started.');
		if(this.g_tsTimerId != -1) {
			window.clearTimeout(this.g_tsTimerId);
			this.g_tsTimerId = -1;
			this.utils.log('TwoSix: timer has been stopped.');
			}
		this.utils.log('TwoSix: OnXULHide() has been finished.');
		return;
		},
	
	GetUrlNumberAndSetUrlNameToOpenWhenMainButtonIsClicked : function () {
		this.utils.log('TwoSix: GetUrlNumberAndSetUrlNameToOpenWhenMainButtonIsClicked() has been started.');
		var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('extensions.twosix.');
		if(prefs.getPrefType('url-number-to-open-when-main-button-is-clicked') == prefs.PREF_INT) {
			var un = prefs.getIntPref('url-number-to-open-when-main-button-is-clicked');
			switch(un) {
				case 0:
					this.g_tsUrlNameToOpenWhenMainButtonIsClicked = 'main';
				break;
				case 1:
					this.g_tsUrlNameToOpenWhenMainButtonIsClicked = 'editorbriefcase';
				break;
				case 2:
					this.g_tsUrlNameToOpenWhenMainButtonIsClicked = 'guestbook';
				break;
				default:
					this.g_tsUrlNameToOpenWhenMainButtonIsClicked = 'main';
				break;
				}
			}
		else {
			this.utils.log('TwoSix: url-number-to-open-when-main-button-is-clicked is not PREF_INT.');
			}
		this.utils.log('TwoSix: GetUrlNumberAndSetUrlNameToOpenWhenMainButtonIsClicked() has been finished.');
		return;
		},
	
	GetAndSetWSChangesRefreshInterval : function (fl_restart) {
		this.utils.log('TwoSix: GetAndSetWSChangesRefreshInterval() has been started.');
		var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('extensions.twosix.');
		if(prefs.getPrefType('refresh-interval') == prefs.PREF_INT) {
			var ri = prefs.getIntPref('refresh-interval');
			if(ri < 1 || ri > 60) {
				this.utils.log('TwoSix: refresh-interval less 1 or more 60.');
				ri = 15;
				}
			this.g_tsWSChangesRefreshInterval = 60 * 1000 * ri;
			if(fl_restart) {
				if(this.g_tsTimerId != -1) {
					window.clearTimeout(this.g_tsTimerId);
					this.g_tsTimerId = -1;
					this.utils.log('TwoSix: timer has been stopped.');
					};
				this.GetTwoSixWSChanges();
				}
			}
		else {
			this.utils.log('TwoSix: refresh-interval is not PREF_INT.');
			}
		this.utils.log('TwoSix: GetAndSetWSChangesRefreshInterval() has been finished.');
		return;
		},
	
	GetAndShowAuthoursNameEMail : function () {
		this.utils.log('TwoSix: GetAndShowAuthoursNameEMail() has been started.');
		var cM = Components.classes['@mozilla.org/cookiemanager;1'].getService(Components.interfaces.nsICookieManager);
		var csName = '';
		var csEMail = '';
		for (var e = cM.enumerator; e.hasMoreElements();) {
			var cookie = e.getNext().QueryInterface(Components.interfaces.nsICookie);
			if (cookie.host.match(/26\.netslova\.ru/)) {
				if(cookie.path == '/') {
					if (cookie.name == 'Tank_Name') {
						this.utils.log('TwoSix: Tank_Name cookie has been found.');
						csName = cookie.value;
						}
					if (cookie.name == 'Tank_Mail') {
						this.utils.log('TwoSix: Tank_Mail cookie has been found.');
						csEMail = cookie.value;
						}
					}
				}
			}
		if(csName != '') {
			this.g_tsAName = this.converterEngine.urldecode(this.converterEngine.convert_from_cp1251(csName));
			}
		else {
			this.g_tsAName = '';
			}
		if(csEMail != '') {
			this.g_tsAEMail = this.converterEngine.urldecode(this.converterEngine.convert_from_cp1251(csEMail));
			}
		else {
			this.g_tsAEMail = '';
			}

		var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('extensions.twosix.');
		if(prefs.getPrefType('use-name-and-email-only-from-prefernces') == prefs.PREF_BOOL) {
			this.g_tsUseNameAndEMailOnlyFromPrefernces = prefs.getBoolPref('use-name-and-email-only-from-prefernces');
			}
		else {
			this.utils.log('TwoSix: use-name-and-email-only-from-prefernces is not PREF_BOOL.');
			}
		var pName = '';
		var pEMail = '';
		if(prefs.getPrefType('name') == prefs.PREF_STRING) {
			pName = this.converterEngine.getLocalizedPreferenceString(prefs, 'name');
			}
		else {
			this.utils.log('TwoSix: name is not PREF_STRING.');
			}
		if(prefs.getPrefType('email') == prefs.PREF_STRING) {
			pEMail = this.converterEngine.getLocalizedPreferenceString(prefs, 'email');
			}
		else {
			this.utils.log('TwoSix: email is not PREF_STRING.');
			}
		if (this.g_tsUseNameAndEMailOnlyFromPrefernces || this.g_tsAName == '') {
			this.g_tsAName = pName;
			this.g_tsAEMail = pEMail;
			}
		var mi = document.getElementById('twosix-ui-menuItem-addMenuAEInfo');
		var mi2 = document.getElementById('twosix-ui-menuItem-addMonthTopicMenuAEInfo');
		if(mi) {
			if (this.g_tsAName !='' ) {
				mi.setAttribute('label', this.g_tsAName + ' / ' + (this.g_tsAEMail==''?'<E-Mail>':this.g_tsAEMail));
				}
			else {
				mi.setAttribute ('label', '<Автор / E-Mail>');
				}
			}
		else {
			this.utils.log('TwoSix: couldn\'t get twosix-ui-menuItem-addMenuAEInfo.');
			}
		if(mi&&mi2) {
			mi2.setAttribute('label', mi.getAttribute('label'));
			}
		else {
			this.utils.log('TwoSix: couldn\'t get twosix-ui-menuItem-addMenuAEInfo or twosix-ui-menuItem-addMonthTopicMenuAEInfo.');
			}
		this.utils.log('TwoSix: GetAndShowAuthoursNameEMail() has been finished.');
		return;
		},
	
	GoToURL : function (url, pars, fl) {
		this.utils.log('TwoSix: GoToURL() has been started.');
		var self = this;
		
		url = url==''?self.g_tsUrlNameToOpenWhenMainButtonIsClicked:url;
		pars = pars || '';
		fl = fl || false;
		
		if(url in this.urlsList) {
			if(top) {
				var tBrowser = top.document.getElementById('content');
				if(tBrowser) {
					var tab = tBrowser.addTab(this.urlsList[url] + pars);
					if (tab) {
						tBrowser.selectedTab = tab;
						if(fl) {
							var tabBrowser = tBrowser.getBrowserForTab(tab);
							if(tabBrowser) {
								tabBrowser.addEventListener('DOMContentLoaded', self.g_tsGoToURLBrowserTabDOMContentLoadedEventRunAtOnceFunction = function () {
									self.utils.log('TwoSix: g_tsGoToURLBrowserTabDOMContentLoadedEventRunAtOnceFunction() has been started.');
									var inps = tabBrowser.contentDocument.getElementsByTagName('input');
									if (inps) {
										for (var i = 0; i < inps.length; i++) {
											if (inps[i].name == 'For_Theme') {
												inps[i].checked = true;
												};
											};
										}
									tabBrowser.removeEventListener('DOMContentLoaded', self.g_tsGoToURLBrowserTabDOMContentLoadedEventRunAtOnceFunction, true);
									self.utils.log('TwoSix: g_tsGoToURLBrowserTabDOMContentLoadedEventRunAtOnceFunction() has been removed.');
									self.utils.log('TwoSix: g_tsGoToURLBrowserTabDOMContentLoadedEventRunAtOnceFunction() has been finished.');
									return;
									}, true);
								self.utils.log('TwoSix: g_tsGoToURLBrowserTabDOMContentLoadedEventRunAtOnceFunction() has been added.');
								}
							else {
								this.utils.log('TwoSix: couldn\'t get tabBrowser.');
								}
							};
						}
					else {
						this.utils.log('TwoSix: couldn\'t get tab.');
						}
					}
				else {
					this.utils.log('TwoSix: couldn\'t get content.');
					}
				}
			else {
				this.utils.log('TwoSix: couldn\'t get top.');
				}
			}
		else {
			this.utils.log('TwoSix: url is not in urlsList.');
			}
		this.utils.log('TwoSix: GoToURL() has been finished.');
		return;
		},
	
	SetTSButtonStyleImage : function (lSIurlContent) {
		this.utils.log('TwoSix: SetTSButtonStyleImage() has been started.');
		var dsSs = document.styleSheets;
		if(dsSs) {
			var sS;
			var nsS = null;
			for (var i = 0; (i < dsSs.length)&&(nsS == null); i++) {
				sS = document.styleSheets[i];
				if (sS.href == 'chrome://twosix/content/css/main.css') {
					nsS = sS;
					}
				}
			if(nsS != null) {
				var cssRs = nsS.cssRules;
				var cssR;
				var ncssR = null;
				for (i = 0; (i < cssRs.length)&&(ncssR == null); i++) {
					cssR = cssRs[i];
					if (cssR.selectorText == 'toolbar[iconsize="small"] #twosix-ui-browserButton') {
						ncssR = cssR;
						}
					}
				if(ncssR != null) {
					var ncssRS = ncssR.style;
					if (ncssRS) {
						if (lSIurlContent == '') {
							ncssRS.listStyleImage = '';
							}
						else {
							ncssRS.listStyleImage = 'url(' + lSIurlContent + ')';
							}
						}
					}
				else {
					this.utils.log('TwoSix: couldn\'t find cssRule.');
					}
				}
			else {
				this.utils.log('TwoSix: couldn\'t find styleSheer.');
				}
			}
		else {
			this.utils.log('TwoSix: couldn\'t get styleSheets.');
			}
		this.utils.log('TwoSix: SetTSButtonStyleImage() has been finished.');
		return;
		},
	
	FormAndShowWSChangesInformation : function () {
		this.utils.log('TwoSix: FormAndShowWSChangesInformation() has been started.');
		var self = this;
		
		var btn = document.getElementById('twosix-ui-browserButton');
		if (btn) {
			if (this.g_tsTCountToShow > 0) {
				var canvas = document.getElementById('twosix-ui-canvas');
				if(canvas) {
					canvas.setAttribute('width', 16);
					canvas.setAttribute('height', 16);
					var ctx = canvas.getContext('2d');
					if(ctx) {
						ctx.font = 'bold 10px "Arial"';
						var txtW = ctx.measureText('+'+this.g_tsTCountToShow).width;
						var txtH = 9;
						canvas.setAttribute('width', txtW + 18);
						var img = new Image();
						img.onload = function() {
							self.utils.log('TwoSix: img.onload() has been started.');
							ctx.textBaseline = 'top';
							ctx.clearRect(0, 0, canvas.width, canvas.height);
							ctx.drawImage(img, 0, 0, img.width, img.height);
							
							var x = canvas.getAttribute('width') - txtW;
							var y = canvas.getAttribute('height') - txtH;
							
							ctx.fillStyle = 'rgba(255,255,203,1)';
							ctx.fillRect(x - 1, y, txtW + 1, txtH);
							ctx.fillStyle = 'rgba(0,0,0,1)';
							ctx.fillText('+' + self.g_tsTCountToShow, x, y);
							
							self.SetTSButtonStyleImage(canvas.toDataURL('image/png'));
							
							self.utils.log('TwoSix: img.onload() has been finished.');
							return;
							};
						img.src = 'chrome://twosix/content/icons/button'+(this.g_tsGBHasNewMessages?'_w_plus':'')+'.png';
						}
					else {
						this.utils.log('TwoSix: couldn\'t get ctx.');
						}
					}
				else {
					this.utils.log('TwoSix: couldn\'t get twosix-ui-canvas.');
					}
				}
			else {
				this.SetTSButtonStyleImage('chrome://twosix/content/icons/button'+(this.g_tsGBHasNewMessages?'_w_plus':'')+'.png');
				}
				
			var mi = document.getElementById('twosix-ui-menuItem-goToEditorBriefcase');
			if(mi) {
				if(this.g_tsTCountToShow>0) {
					mi.style.listStyleImage = 'url(chrome://twosix/content/icons/big_plus.png)';
					}
				else {
					mi.style.listStyleImage = '';
					}
				}
			else {
				this.utils.log('TwoSix: couldn\'t get twosix-ui-menuItem-goToEditorBriefcase.');
				}
			mi = document.getElementById('twosix-ui-menuItem-goToGuestBook');
			if(mi) {
				if(this.g_tsGBHasNewMessages) {
					mi.style.listStyleImage = 'url(chrome://twosix/content/icons/big_plus.png)';
					}
				else {
					mi.style.listStyleImage = '';
					};
				}
			else {
				this.utils.log('TwoSix: couldn\'t get twosix-ui-menuItem-goToGuestBook.');
				}
			mi = document.getElementById('twosix-ui-menuItem-addMonthTopicMenu');
			var mi2 = document.getElementById('twosix-ui-menuItem-addMonthTopicMenuMTInfo');
			if(mi&&mi2) {
				if(this.g_tsEBcMonthTopic != '') {
					mi.setAttribute('disabled', false);
					mi2.setAttribute('label', this.g_tsEBcMonthTopic);
					}
				else {
					mi.setAttribute('disabled', true);
					mi2.setAttribute('label', '&lt;тема месяца&gt;');
					}
				}
			else {
				this.utils.log('TwoSix: couldn\'t get twosix-ui-menuItem-addMonthTopicMenu or twosix-ui-menuItem-addMonthTopicMenuMTInfo.');
				}
			}
		else {
			this.utils.log('TwoSix: couldn\'t get twosix-ui-browserButton.');
			}
		this.utils.log('TwoSix: FormAndShowWSChangesInformation() has been finished.');
		return;
		},
	
	SetToolTipText : function (cnt1,cnt2) {
		this.utils.log('TwoSix: SetToolTipText() has been started.');
		var btn = document.getElementById('twosix-ui-browserButton');
		var scnt1 = (cnt1 == '?'?this.g_tsLastTotalTCount:cnt1);
		var scnt2 = (cnt2 == '?'?this.g_tsLastCurrentMonthTCount:cnt2);
		var scnt3 = '?';
		if(scnt1!='?') {
			if (scnt1.length >= 3) {
				scnt3 = 1000 - parseInt(scnt1.toString().substring(scnt1.length-3));
				}
			}
		if(btn) {
			btn.setAttribute('tooltiptext', 'Всего текстов\r\nв проекте: ' + scnt1 + '\r\nв текущем месяце: ' + scnt2 + (scnt3!='?'?'\r\nДо юбилейного: ' + scnt3:''));
			}
		else {
			this.utils.log('TwoSix: couldn\'t get twosix-ui-browserButton.');
			}
		this.g_tsLastTotalTCount = scnt1;
		this.g_tsLastCurrentMonthTCount = scnt2;
		this.utils.log('TwoSix: SetToolTipText() has been finished.');
		return;
		},
	
	GetDataByParsingHTML : function (htmlcode) {
		this.utils.log('TwoSix: GetDataByParsingHTML() has been started.');
		var re = new RegExp("Всего\\sтекстов<br>в\\sпроекте:\\s([0-9]+)<br>в\\sтекущем\\sмесяце:\\s([0-9]+)",'ig');
		var re2 = new RegExp("<a\\stitle=\"Есть\\sновые\\sзаписи!\"\\sid=\"GB_lnk\"\\sclass=menu\\shref=Guestbook>Книга\\sотзывов</a>",'ig');
		var re3 = new RegExp("<a\\sid=\"GB_lnk\"\\sclass=menu\\shref=Guestbook>Книга\\sотзывов</a>",'ig');
		var re4 = new RegExp("<h1\\sclass=montheme><small>Тема\\sмесяца:\\s</small>(.*?)<",'ig');
		var result = re.exec(htmlcode);
		var result2 = re2.exec(htmlcode);
		var result3 = re3.exec(htmlcode);
		var result4 = re4.exec(htmlcode);
		this.utils.log('TwoSix: GetDataByParsingHTML() has been finished.');
		return [result,(result2 == null && result3 == null)?-1:(result2 == null?0:1),result4];
		},
	
	GetTwoSixWSChanges : function () {
		this.utils.log('TwoSix: GetTwoSixWSChanges() has been started.');
		
		this.g_tsXHRequest.abort();
		this.g_tsXHRequest.open('GET', this.urlsList['editorbriefcase'], true);
		this.g_tsXHRequest.send(null);
		
		this.utils.log('TwoSix: GetTwoSixWSChanges() has been finished.');
		return;
		},
	
	utils : {
		consoleService : null,
		log : function(msg) {
			var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('extensions.twosix.');
			var wtl;
			if(prefs.getPrefType('write-main-actions-to-log') == prefs.PREF_BOOL) {
				wtl = prefs.getBoolPref('write-main-actions-to-log');
				}
			else {
				wtl = false;
				}
			if(wtl) {
				if (this.consoleService == null) {
					this.consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
					}
				this.consoleService.logStringMessage(msg);
				}
			}
		},
	
	converterEngine : {
		parObj : null,
		
		to_cp1251FunctionArray : {
			'%D0%B0' : '%E0', '%D0%B1' : '%E1', '%D0%B2' : '%E2', '%D0%B3' : '%E3', '%D0%B4' : '%E4',
			'%D0%B5' : '%E5', '%D1%91' : '%B8', '%D0%B6' : '%E6', '%D0%B7' : '%E7', '%D0%B8' : '%E8',
			'%D0%B9' : '%E9', '%D0%BA' : '%EA', '%D0%BB' : '%EB', '%D0%BC' : '%EC', '%D0%BD' : '%ED',
			'%D0%BE' : '%EE', '%D0%BF' : '%EF', '%D1%80' : '%F0', '%D1%81' : '%F1', '%D1%82' : '%F2',
			'%D1%83' : '%F3', '%D1%84' : '%F4', '%D1%85' : '%F5', '%D1%86' : '%F6', '%D1%87' : '%F7',
			'%D1%88' : '%F8', '%D1%89' : '%F9', '%D1%8C' : '%FC', '%D1%8B' : '%FB', '%D1%8A' : '%FA',
			'%D1%8D' : '%FD', '%D1%8E' : '%FE', '%D1%8F' : '%FF', '%D0%90' : '%C0', '%D0%91' : '%C1',
			'%D0%92' : '%C2', '%D0%93' : '%C3', '%D0%94' : '%C4', '%D0%95' : '%C5', '%D0%81' : '%A8',
			'%D0%96' : '%C6', '%D0%97' : '%C7', '%D0%98' : '%C8', '%D0%99' : '%C9', '%D0%9A' : '%CA',
			'%D0%9B' : '%CB', '%D0%9C' : '%CC', '%D0%9D' : '%CD', '%D0%9E' : '%CE', '%D0%9F' : '%CF',
			'%D0%A0' : '%D0', '%D0%A1' : '%D1', '%D0%A2' : '%D2', '%D0%A3' : '%D3', '%D0%A4' : '%D4',
			'%D0%A5' : '%D5', '%D0%A6' : '%D6', '%D0%A7' : '%D7', '%D0%A8' : '%D8', '%D0%A9' : '%D9',
			'%D0%AC' : '%DC', '%D0%AB' : '%DB', '%D0%AA' : '%DA', '%D0%AD' : '%DD', '%D0%AE' : '%DE',
			'%D0%AF' : '%DF'
			},

		from_cp1251FunctionArray : {
			'%E0' : '%D0%B0', '%E1' : '%D0%B1', '%E2' : '%D0%B2', '%E3' : '%D0%B3', '%E4' : '%D0%B4',
			'%E5' : '%D0%B5', '%B8' : '%D1%91', '%E6' : '%D0%B6', '%E7' : '%D0%B7', '%E8' : '%D0%B8',
			'%E9' : '%D0%B9', '%EA' : '%D0%BA', '%EB' : '%D0%BB', '%EC' : '%D0%BC', '%ED' : '%D0%BD',
			'%EE' : '%D0%BE', '%EF' : '%D0%BF', '%F0' : '%D1%80', '%F1' : '%D1%81', '%F2' : '%D1%82',
			'%F3' : '%D1%83', '%F4' : '%D1%84', '%F5' : '%D1%85', '%F6' : '%D1%86', '%F7' : '%D1%87',
			'%F8' : '%D1%88', '%F9' : '%D1%89', '%FC' : '%D1%8C', '%FB' : '%D1%8B', '%FA' : '%D1%8A',
			'%FD' : '%D1%8D', '%FE' : '%D1%8E', '%FF' : '%D1%8F', '%C0' : '%D0%90', '%C1' : '%D0%91',
			'%C2' : '%D0%92', '%C3' : '%D0%93', '%C4' : '%D0%94', '%C5' : '%D0%95', '%A8' : '%D0%81',
			'%C6' : '%D0%96', '%C7' : '%D0%97', '%C8' : '%D0%98', '%C9' : '%D0%99', '%CA' : '%D0%9A',
			'%CB' : '%D0%9B', '%CC' : '%D0%9C', '%CD' : '%D0%9D', '%CE' : '%D0%9E', '%CF' : '%D0%9F',
			'%D0' : '%D0%A0', '%D1' : '%D0%A1', '%D2' : '%D0%A2', '%D3' : '%D0%A3', '%D4' : '%D0%A4',
			'%D5' : '%D0%A5', '%D6' : '%D0%A6', '%D7' : '%D0%A7', '%D8' : '%D0%A8', '%D9' : '%D0%A9',
			'%DC' : '%D0%AC', '%DB' : '%D0%AB', '%DA' : '%D0%AA', '%DD' : '%D0%AD', '%DE' : '%D0%AE',
			'%DF' : '%D0%AF'
			},
		
		convert_to_cp1251 : function (str) {
			this.parObj.utils.log('TwoSix: convert_to_cp1251() has been started.');
			var ret = '';
			var l = str.length;
			var i = 0;
			while (i < l) {
				var f = 0;
				for (var keyVar in this.to_cp1251FunctionArray) {
					if (str.substring(i,i + 6) == keyVar) {
						ret += this.to_cp1251FunctionArray[keyVar];
						i += 6;
						f = 1;
						}
					}
				if (!f) {
					ret += str.substring(i, i + 1);
					i++;
					}
				}
			this.parObj.utils.log('TwoSix: convert_to_cp1251() has been finished.');
			return ret;
			},
		
		convert_from_cp1251 : function (str) {
			this.parObj.utils.log('TwoSix: convert_from_cp1251() has been started.');
			var ret = '';
			var l = str.length;
			var i = 0;
			while (i < l) {
				var f = 0;
				for (var keyVar in this.from_cp1251FunctionArray) {
					if (str.substring(i, i + 3) == keyVar) {
						ret += this.from_cp1251FunctionArray[keyVar];
						i += 3;
						f = 1;
						}
					}
				if (!f) {
					ret += str.substring(i, i + 1);
					i++;
					}
				}
			this.parObj.utils.log('TwoSix: convert_from_cp1251() has been finished.');
			return ret;
			},
		
		urlencode : function (str) {
			this.parObj.utils.log('TwoSix: urlencode() has been started.');
			var ret = (str + '').toString();
			try {
				ret = encodeURIComponent(ret).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
				}
			catch (e) {
				this.parObj.utils.log('TwoSix: couldn\'t run encodeURIComponent() or replace().');
				};
			this.parObj.utils.log('TwoSix: urlencode() has been finished.');
			return ret;
			},
		
		urldecode : function (str) {
			this.parObj.utils.log('TwoSix: urldecode() has been started.');
			var ret = (str + '').toString();
			try {
				ret = decodeURIComponent(ret.replace(/\+/g, '%20'));
				}
			catch (e) {
				this.parObj.utils.log('TwoSix: couldn\'t run decodeURIComponent() or replace().');
				};
			this.parObj.utils.log('TwoSix: urldecode() has been finished.');
			return ret;
			},
		
		setLocalizedPreferenceString : function (prefBranch, key, value) {
			this.parObj.utils.log('TwoSix: setLocalizedPreferenceString() has been started.');
			var localizedStringInterface = Components.interfaces.nsISupportsWString || Components.interfaces.nsISupportsString;
			
			if(localizedStringInterface) {
				var string = (Components.classes['@mozilla.org/supports-wstring;1']) ? Components.classes['@mozilla.org/supports-wstring;1'].createInstance(localizedStringInterface) : Components.classes['@mozilla.org/supports-string;1'].createInstance(localizedStringInterface);
				
				string.data = value;
				prefBranch.setComplexValue(key, localizedStringInterface, string);
				}
			else {
				this.parObj.utils.log('TwoSix: couldn\'t get localizedStringInterface.');
				}
			
			this.parObj.utils.log('TwoSix: setLocalizedPreferenceString() has been finished.');
			return;
			},
		
		getLocalizedPreferenceString : function (prefBranch, key) {
			this.parObj.utils.log('TwoSix: getLocalizedPreferenceString() has been started.');
			var value = prefBranch.getComplexValue(key, Components.interfaces.nsISupportsWString || Components.interfaces.nsISupportsString).data;
			
			this.parObj.utils.log('TwoSix: getLocalizedPreferenceString() has been finished.');
			return value;
			}
		
		},
	};

var twosixextension = new TwoSixExtension();

/*var twosixextension = null;
var g_fDOMContentLoadedEventFunction = null;

//window.addEventListener('load', function(e) {
document.addEventListener('DOMContentLoaded', g_fDOMContentLoadedEventFunction = function(e) {
	document.removeEventListener('DOMContentLoaded', g_fDOMContentLoadedEventFunction, false);
	twosixextension = new TwoSixExtension();
	}, false);*/
}) ();