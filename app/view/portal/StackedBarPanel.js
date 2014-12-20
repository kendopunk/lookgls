/**
 * @class
 * @author Mark Fehrenbacher
 * @memberOf App.view.portal
 * @description Rendering panel for stacked bar chart
 */
Ext.define('App.view.portal.StackedBarPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.stackedBar',
	
	plain: true,
	
	initComponent: function() {
		var me = this;
		
		me.callParent(arguments);
	}
});