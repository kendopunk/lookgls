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
		// event relay subscriptions
		//////////////////////////////////////////////////
		me.eventRelay.subscribe('mapRendered', me.initFeed, me);
		
		//////////////////////////////////////////////////
		// store
		//////////////////////////////////////////////////
		me.store = Ext.create('Ext.data.Store', {
			model: 'App.model.IPDataGridModel',
			data: [],
			sorters: {
				property: 'timestamp',
				direction: 'DESC'
			},
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
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [
				{xtype: 'tbspacer', width: 5},
				me.feedButton,
				{xtype: 'tbspacer', width: 5},
				me.feedStatus
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
		
		me.loadFreshData();
	},
	
	loadFreshData: function() {
		var me = this;
		
		Ext.Ajax.request({
			url: 'data/data.json',
			method: 'GET',
			success: function(response) {
				var resp = Ext.decode(response.responseText);
				
				me.getStore().loadRawData(me.normalizeThreatData(resp.threatData), false);
			},
			callback: function() {
				setTimeout(function() {
					Ext.TaskManager.start(me.dataFeedTask);
					
					// enable the buttons here
					
					me.feedButton.setDisabled(false);
		
		
		me.feedStatus.setDisabled(false);
		
		me.dataFeedRunning = true;
		
		
				}, 5000, me);
			},
			scope: me
		});
	},
	
	normalizeThreatData: function(dat) {
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
		
		return me.baseData;
	},
	
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
 	 * @description Generate random IP data
 	 */
	genData: function() {
		var me = this,
			ret = [];
			
		for(var i=0; i<2; i++) {
			ret.push({
				ip: '192.168.1.1',
				virus: ['APT1'],
				owner: App.util.Global.stub.owners[Math.floor(Math.random() * App.util.Global.stub.owners.length)].fullName,
				serverFunction: App.util.Global.stub.ipFunctions[Math.floor(Math.random() * App.util.Global.stub.ipFunctions.length)].name
			});
		}
		
		me.getStore().removeAll();
		me.getStore().loadRawData(me.normalizeThreatData(ret), false);
		
		
		
	},
	
	countRenderer: function(value) {
		return Ext.util.Format.number(value, '0,000');
	}
});