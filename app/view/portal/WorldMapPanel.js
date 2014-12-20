/**
 * @class
 * @author Mark Fehrenbacher
 * @memberOf App.view.portal
 * @description World map rendering panel
 */
Ext.define('App.view.portal.WorldMapPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.worldMapPanel',
	
	plain: true,
	
	initComponent: function() {
		var me = this;
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top'
		}];
		
		me.callParent(arguments);
	}
});