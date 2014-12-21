Ext.Loader.setConfig({
	enabled: true
});

Ext.application({
	name: 'App',
	
	appFolder: 'app',
	
	enableQuickTips: true,
	
	/* controllers: [
		'Application'
	], */
	
	requires: [
		'Ext.container.Viewport',
		'App.util.Global',
		'App.util.MessageBus',
		'App.util.GridRenderers',
		'App.view.portal.WorldMapPanel',
		'App.view.portal.StackedBarPanel',
		'App.view.portal.IPDataGridPanel'
	],
	
	launch: function() {
		Ext.tip.QuickTipManager.init();
		
		/** scope **/
		var me = this;
		
		me.mapPanel = Ext.create('App.view.portal.WorldMapPanel', {
			region: 'west',
			width: Math.floor(Ext.getBody().getViewSize().width * .65),
			height: Math.floor(Ext.getBody().getViewSize().height * .7)
		});
			
		me.vizPanel = Ext.create('App.view.portal.StackedBarPanel', {
			region: 'center',
			calculatedWidth: Math.floor(Ext.getBody().getViewSize().width * .35),
			calculatedHeight: Math.floor(Ext.getBody().getViewSize().height * .7)
		});
			
		me.gridPanel = Ext.create('App.view.portal.IPDataGridPanel', {
			region: 'south',
			height: Math.floor(Ext.getBody().getViewSize().height * .3)
		});
		
		Ext.create('Ext.container.Viewport', {		
			layout: 'border',
			items: [
				me.mapPanel,
				me.vizPanel,
				me.gridPanel
			]
		});
		
		if(Ext.get('page-loader')) {
			Ext.get('page-loader').remove();
		}
	}
});
