Ext.Loader.setConfig({
	enabled: true
});

Ext.application({
	name: 'App',
	
	appFolder: 'app',
	
	enableQuickTips: true,
	
	controllers: [
		'Application'
	],
	
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
			width: Math.floor(Ext.getBody().getViewSize().width * .6),
			height: Math.floor(Ext.getBody().getViewSize().height * .8)
		});
			
		me.vizPanel = Ext.create('App.view.portal.StackedBarPanel', {
			width: Math.floor(Ext.getBody().getViewSize().width * .4),
			height: Math.floor(Ext.getBody().getViewSize().height * .8)
		});
			
		me.gridPanel = Ext.create('App.view.portal.IPDataGridPanel', {
			colspan: 2,
			width: Ext.getBody().getViewSize().width,
			height: Math.floor(Ext.getBody().getViewSize().height * .2)
		});
		
		Ext.create('Ext.container.Viewport', {		
			layout: {
				type: 'table',
				columns: 2
			},
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
