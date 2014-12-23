/**
 * @class
 * @author Mark Fehrenbacher
 * @memberOf App.view.portal
 * @description World map rendering panel
 */
Ext.define('App.view.portal.WorldMapPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.worldMapPanel',
	
	requires: [
		'App.util.d3.ReusableWorldMap'
	],
	
	plain: true,
	
	initComponent: function() {
		var me = this;
		
		me.eventRelay = Ext.create('App.util.MessageBus'),
			me.mousingOver = false,
			me.rawData = [],
			me.svg = null;
			
		//////////////////////////////////////////////////
		// subscribe to IP data generation
		//////////////////////////////////////////////////
		me.eventRelay.subscribe('addIpDataToMap', me.renderIpData, me);
		
		//////////////////////////////////////////////////
		// toolbar components
		//////////////////////////////////////////////////
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [
				{xtype: 'tbtext', text: '<b>Map</b>'}
			]
		}];
		
		me.on('afterrender', me.initCanvas, me);
		
		me.callParent(arguments);
	},
	
	/**
 	 * @function
 	 */
	initCanvas: function() {
		var me = this;
		me.canvasWidth = me.width,
			me.canvasHeight = me.height,
			me.panelId = '#' + me.body.id;

		// init SVG
		me.svg = d3.select(me.panelId)
			.append('svg')
			.attr('width', me.canvasWidth)
			.attr('height', me.canvasHeight);
			
		me.worldMap = Ext.create('App.util.d3.ReusableWorldMap', {
			panel: me,
			svg: me.svg,
			canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			eventRelay: me.eventRelay,
			tooltipFunction: function(d, i) {
				return d.properties.name;
			}
		});
		
		me.worldMap.initChart();
	},
	
	/**
 	 * @function
 	 * @description Utility method to indicate map has been fully rendered
 	 */
	panelReady: function() {
		var me = this;
		
		me.eventRelay.publish('mapRendered', true);
	},
	
	/**
 	 * @function
 	 */
	renderIpData: function(dat) {
		var me = this;
	
		Ext.each(dat, function(d) {
			me.rawData.push(d);
			
			me.svg.append('circle')
				.datum(d)
				.attr('cx', function(d) {
					return me.worldMap.getMapCoords(d.longitude, d.latitude)[0];
				})
				.attr('cy', function(d) {
					return me.worldMap.getMapCoords(d.longitude, d.latitude)[1];
				})
				.on('mouseover', function() {
					me.mousingOver = true;
				})
				.on('mouseout', function() {
					me.mousingOver = false;
				})
				.attr('r', 4)
				//.style('stroke', 'black')
				//.style('stroke-width', .75)
				.style('fill', function(d) {
					return Ext.Array.filter(App.util.Global.stub.serverFunctions, function(sf) {
						return sf.name == d.serverFunction;
					})[0].color;
				});
		}, me);
		
		// conflicts with active tooltipDiv
		if(!me.mousingOver) {
			me.svg.selectAll('circle').call(d3.helper.tooltip().text(function(d, i) {
				return '<b>' + d.ip + '</b><br>'
					+ d.owner + '<br>'
					+ d.serverFunction + '<br>'
					+ d.latitude + '/' + d.longitude + '<br>'
					+ '['
					+ Ext.Array.sort(d.virus).join(', ')
					+ ']';
			}));
		}
	}
});