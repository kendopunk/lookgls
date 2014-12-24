/**
 * @class
 * @author Mark Fehrenbacher
 * @memberOf App.view.portal
 * @description IP information data grid panel
 */
Ext.define('App.view.portal.IPDataGridPanel', {
	extend: 'Ext.grid.GridPanel',
	alias: 'widget.ipDataGridPanel',
	
	requires: [
		'App.model.IPDataGridModel'
	],
	
	plain: true,
	
	initComponent: function() {
		var me = this;
		
		me.baseData = [],
			me.dataFeedOnCls = 'icon-datafeed',
			me.dataAppend = false,
			me.dataFeedOffCls = 'icon-stop',
			me.dataFeedRunning = false,
			me.eventRelay = Ext.create('App.util.MessageBus');
			
		//////////////////////////////////////////////////
		// subscribe to the map being rendered
		//////////////////////////////////////////////////
		me.eventRelay.subscribe('mapRendered', me.initFeed, me);
		
		//////////////////////////////////////////////////
		// store
		//////////////////////////////////////////////////
		me.store = Ext.create('Ext.data.Store', {
			model: 'App.model.IPDataGridModel',
			data: [],
			sorters: [{
				property: 'trojanCount',
				direction: 'DESC'
			}, {
				property: 'botCount',
				direction: 'DESC'
			}, {
				property: 'spamCount',
				direction: 'DESC'
			}],
			proxy: {
				type: 'memory'
			}
		});
		
		//////////////////////////////////////////////////
		// columns
		//////////////////////////////////////////////////
		me.columns = [{
			header: 'Owner',
			dataIndex: 'owner',
			width: 200
		}, {
			header: 'Trojans',
			dataIndex: 'trojanCount',
			renderer: me.countRenderer
		}, {
			header: 'Bots',
			dataIndex: 'botCount',
			renderer: me.countRenderer
		}, {
			header: 'Spam',
			dataIndex: 'spamCount',
			renderer: me.countRenderer
		}, {
			header: 'FTP Servers',
			dataIndex: 'ftpServerCount',
			renderer: me.countRenderer
		}, {
			header: 'Mail Servers',
			dataIndex: 'mailServerCount',
			renderer: me.countRenderer
		}, {
			header: 'Web Servers',
			dataIndex: 'webServerCount',
			renderer: me.countRenderer
		}]
		
		//////////////////////////////////////////////////
		// data feed task
		//////////////////////////////////////////////////
		me.dataFeedTask = {
			run: function() {
				me.genData();
			},
			interval: 5000,
			scope: me
		};
		
		//////////////////////////////////////////////////
		// toolbar components
		//////////////////////////////////////////////////
		me.feedButton = Ext.create('Ext.button.Button', {
			text: 'IP Data Feed',
			disabled: true,
			iconCls: me.dataFeedOffCls,
			handler: function(btn, evt) {
				me.dataFeedHandler();
			},
			scope: me
		});
		
		me.feedStatus = Ext.create('Ext.toolbar.TextItem', {
			text: '',
			disabled: true
		});
		
		me.clearButton = Ext.create('Ext.button.Button', {
			disabled: true,
			text: 'Clear Data / Reset',
			iconCls: 'icon-refresh',
			handler: function() {
				Ext.MessageBox.confirm('Clear all data?', 
					'This action cannot be undone.',
					function(btn, text) {
						if(btn == 'yes') {
							me.clearAllData();
						}
					}, 
				me);
			},
			scope: me
		});
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [
				{xtype: 'tbspacer', width: 10},
				me.feedButton,
				{xtype: 'tbspacer', width: 5},
				me.feedStatus,
				'->',
				me.clearButton,
				{xtype: 'tbspacer', width: 20}
			]
		}];
		
		me.callParent(arguments);
	},
	
	/**
	 * @function
	 * @description Start the feed for the first time
	 */
	initFeed: function() {
		var me = this;
		
		me.feedButton.setIconCls(me.dataFeedOnCls);
		me.feedStatus.setText('RUNNING');
		
		Ext.Ajax.request({
			url: 'data/data.json',
			method: 'GET',
			success: function(response) {
				var resp = Ext.decode(response.responseText);
				
				me.getStore().loadRawData(me.buildThreatData(resp.threatData), false);
				
				// add to map
				me.eventRelay.publish('addIpDataToMap', resp.threatData);
			},
			callback: function() {
				setTimeout(function() {
					Ext.TaskManager.start(me.dataFeedTask);
					
					me.feedButton.setDisabled(false);
					me.feedStatus.setDisabled(false);
					me.clearButton.setDisabled(false);
					me.dataFeedRunning = true;
				}, 5000, me);
			},
			scope: me
		});
	},
	
	/**
 	 * @function
 	 * @description Take data in the raw JSON format and make it
 	 * consumable by the grid
 	 */
	buildThreatData: function(dat) {
		var me = this;
			
		// base data empty
		if(me.baseData.length == 0) {
			Ext.each(Ext.Array.sort(Ext.Array.unique(Ext.Array.map(dat, function(d) {
				return d.owner;
			}))), function(item) {
				me.baseData.push({
					owner: item,
					botCount: 0,
					spamCount: 0,
					trojanCount: 0,
					mailServerCount: 0,
					ftpServerCount: 0,
					webServerCount: 0
				});
			}, me);
		}
		
		Ext.each(me.baseData, function(r) {
			Ext.each(dat, function(d) {
				r.botCount += me.countVirus(d, 'Bot', r.owner);
				r.spamCount += me.countVirus(d, 'Spam', r.owner);
				r.trojanCount += me.countVirus(d, 'Trojan', r.owner);
				r.mailServerCount += me.countServer(d, 'mail server', r.owner);
				r.webServerCount += me.countServer(d, 'web server', r.owner);
				r.ftpServerCount += me.countServer(d, 'ftp server', r.owner);
			});
		}, me);
		
		return Ext.Array.sort(me.baseData, function(o1, o2) {
			return o1.owner > o2.owner ? 1 : -1;
		});
	},
	
	/**
 	 * @function
 	 * @description Count the number of viruses in a record (owner match)
 	 */
	countVirus: function(data, virusType, owner) {
		if(data.owner === owner) {
			var count = 0;
			var virusTarget = Ext.Array.map(Ext.Array.filter(App.util.Global.stub.viruses, function(v) {
				return v.type === virusType
			}), function(m) {
				return m.name;
			});
			
			Ext.each(virusTarget, function(vt) {
				if(data.virus.indexOf(vt) >= 0) {
					count++;
				}
			});
			
			return count;
		}
		return 0;
	},
	
	/**
	 * @function
	 * @description Count the number of servers in a record (owner match)
	 */
	countServer: function(data, serverType, owner) {
		if(data.serverFunction === serverType && data.owner === owner) {
			return 1;
		}
		return 0;
	},
	
	/**
	 * @function
	 * @description Toggle data feed on/off
	 */
	dataFeedHandler: function() {
		var me = this;
		
		if(me.dataFeedRunning) {
			me.feedButton.setIconCls(me.dataFeedOffCls);
			me.feedStatus.setText('STOPPED');
			Ext.TaskManager.stop(me.dataFeedTask);
		} else {
			me.feedButton.setIconCls(me.dataFeedOnCls);
			me.feedStatus.setText('RUNNING');
			Ext.TaskManager.start(me.dataFeedTask);
		}
		
		me.dataFeedRunning = !me.dataFeedRunning;
	},
	
	/**
 	 * @function
 	 * @description Generate random IP data with random viruses, random server type
 	 * random owner and random long/lat
 	 */
	genData: function() {
		var me = this,
			ret = [],
			vArrLen = App.util.Global.stub.viruses.length;
			
		for(var i=0; i<2; i++) {
		
			// try to pluck random number of viruses
			var numViruses = Math.floor(Math.random() * vArrLen) + 1, vdat = [];
			for(var j=0; j<=numViruses; j++) {
				vdat.push(App.util.Global.stub.viruses[Math.floor(Math.random() * vArrLen)].name);
			}
		
			ret.push({
				ip: App.util.Global.ip.longToIp(
					App.util.Global.ip.genRandomLongIp()
				),
				virus: Ext.Array.sort(Ext.Array.unique(vdat)),
				owner: App.util.Global.stub.owners[Math.floor(Math.random() * App.util.Global.stub.owners.length)].fullName,
				serverFunction: App.util.Global.stub.serverFunctions[Math.floor(Math.random() * App.util.Global.stub.serverFunctions.length)].name,
				latitude: App.util.Global.ip.genRandomLatitude(),
				longitude: App.util.Global.ip.genRandomLongitude()
			});
		}

		me.getStore().removeAll();
		
		var gridThreatData = me.buildThreatData(ret);
		me.getStore().loadRawData(gridThreatData, false);
		
		// add to map
		me.eventRelay.publish('addIpDataToMap', ret);
		
		// notify chart
		me.eventRelay.publish('ipStoreDataChange', gridThreatData);
	},
	
	/**
 	 * @function
 	 * @description Clear all the data and start fresh
 	 */
 	clearAllData: function() {
	 	var me = this;
	 	
	 	// step 1....stop the data feed
		if(me.dataFeedRunning) {
			me.feedButton.setDisabled(true);
			me.feedButton.setIconCls(me.dataFeedOffCls);
			me.feedStatus.setText('STOPPED');
			Ext.TaskManager.stop(me.dataFeedTask);
			me.dataFeedRunning = false;
		}
		
		// step 2...clear the store and reload with -0- values
		var existingStoreData = Ext.Array.map(me.getStore().getRange(), function(rng) {
			return rng.data;
		}, me);
		Ext.each(existingStoreData, function(esd) {
			esd.botCount = 0;
			esd.spamCount = 0;
			esd.trojanCount = 0;
			esd.mailServerCount = 0;
			esd.ftpServerCount = 0;
			esd.webServerCount = 0;
		});
		me.getStore().loadRawData(existingStoreData, false);
		
		// step 3...reset baseData
		me.baseData = Ext.Array.map(App.util.Global.stub.owners, function(o) {
			return {
				owner: o.fullName,
				botCount: 0,
				spamCount: 0,
				trojanCount: 0,
				mailServerCount: 0,
				ftpServerCount: 0,
				webServerCount: 0
			};
		});

		// step 4...event relay to map and chart
		me.eventRelay.publish('clearAllData', true);
		
		// step 5...start the feed again
		setTimeout(function() {
			me.feedButton.setDisabled(false);
			me.feedButton.setIconCls(me.dataFeedOnCls);
			me.feedStatus.setText('RUNNING');
			Ext.TaskManager.start(me.dataFeedTask);
			me.dataFeedRunning = true;
		}, 1500, me);
 	
 	},
 	
	// @util renderer
	countRenderer: function(value) {
		return Ext.util.Format.number(value, '0,000');
	}
});