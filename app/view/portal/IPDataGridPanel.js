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
			proxy: {
				type: 'memory'
			}
		});
		
		//////////////////////////////////////////////////
		// columns
		//////////////////////////////////////////////////
		me.columns = [{
			header: 'IP',
			dataIndex: 'ip'
		}];
		
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
	
	initFeed: function() {
		var me = this;
		
		me.feedButton.setDisabled(false);
		me.feedStatus.setDisabled(false);
		
		me.dataFeedHandler();
		
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
		} else {
			me.feedButton.setIconCls(me.dataFeedOnCls);
			me.feedStatus.setText('RUNNING');
		}
		
		me.dataFeedRunning = !me.dataFeedRunning;
	}
});