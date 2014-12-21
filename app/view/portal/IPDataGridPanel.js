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
	viewConfig: {
		autoFill: true
	},
	
	initComponent: function() {
		var me = this;
		
		me.dataFeedOnCls = 'icon-datafeed',
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
				property: 'id',
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
			header: 'ID',
			dataIndex: 'id',
			flex: 1
		}, {
			header: 'IP',
			dataIndex: 'ip',
			flex: 1
		}, {
			header: 'Owner',
			dataIndex: 'owner',
			flex: 2
		}, {
			header: 'Function',
			dataIndex: 'ipFunction',
			flex: 1
		}, {
			header: 'Virus(es)',
			dataIndex: 'virus',
			flex: 2,
			renderer: function(v) {
				return Ext.Array.sort(v).join(', ');
			}
		}, {
			header: 'Long.',
			dataIndex: 'longitude',
			flex: 1
		}, {
			header: 'Lat.',
			dataIndex: 'latitude',
			flex: 1
		}];
		
		//////////////////////////////////////////////////
		// data feed task
		//////////////////////////////////////////////////
		me.dataFeedTask = {
			run: function(append) {
				me.genData(append);
			},
			interval: 5000,
			scope: me
		};
		
		/*function intToIP(int) {
    var part1 = int & 255;
    var part2 = ((int >> 8) & 255);
    var part3 = ((int >> 16) & 255);
    var part4 = ((int >> 24) & 255);

    return part4 + "." + part3 + "." + part2 + "." + part1;
}*/
		
		//////////////////////////////////////////////////
		// toolbar components
		//////////////////////////////////////////////////
		me.feedButton = Ext.create('Ext.button.Button', {
			text: 'Data Feed',
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
		
		me.feedButton.setDisabled(false);
		me.feedStatus.setDisabled(false);
		me.feedButton.setIconCls(me.dataFeedOnCls);
		me.feedStatus.setText('RUNNING');
		
		//Ext.TaskManager.start(me.dataFeedTask);
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
			//Ext.TaskManager.stop(me.dataFeedTask);
		} else {
			me.feedButton.setIconCls(me.dataFeedOnCls);
			me.feedStatus.setText('RUNNING');
			//Ext.TaskManager.start(me.dataFeedTask);
		}
		
		me.dataFeedRunning = !me.dataFeedRunning;
	},
	
	genData: function(append) {
		var me = this,
			theId;
			
			
			
		
		if(me.getStore().getRange().length == 0) {
			theId = 0;
		} else {
			theId = Ext.Array.max(Ext.Array.map(me.getStore().getRange(), function(rec) {
				return rec.data.id;
			})) + 1;
		}
		
		var dat = [{
			id: theId,
			owner: 'Anderson',
			ip: 2390483,
			virus: ['z', 'b', 'a', 'd'],
			longitude: 100,
			latitude: 100,
			ipFunction: 'mailserver'
		}];
		
		//me.getStore().loadRawData(dat, append);
		
		
		
		
	}
});