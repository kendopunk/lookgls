/**
 * @class
 * @author Mark Fehrenbacher
 * @memberOf App.view.portal
 * @description IP information data grid panel
 */
Ext.define('App.view.portal.IPDataGridPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.ipDataGridPanel',
	title: 'IP Data',
	
	initComponent: function() {
		var me = this;
		
		me.callParent(arguments);
	}
});