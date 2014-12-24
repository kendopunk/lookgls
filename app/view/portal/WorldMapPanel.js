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
			me.svg = null,
			me.serverVisibility = Ext.Array.map(App.util.Global.stub.serverFunctions, function(sf) {
				return sf.name;
			}),
			me.worldMap = null;
			
		//////////////////////////////////////////////////
		// subscribe to IP data generation
		//////////////////////////////////////////////////
		me.eventRelay.subscribe('addIpDataToMap', me.renderIpData, me);
		me.eventRelay.subscribe('clearAllData', me.clearAllData, me);
		
		//////////////////////////////////////////////////
		// toolbar components
		//////////////////////////////////////////////////
		var serverButtons = [];
		Ext.each(App.util.Global.stub.serverFunctions, function(sf) {
			serverButtons.push({
				xtype: 'button',
				iconCls: 'icon-tick',
				text: sf.shortName,
				serverFunction: sf.name,
				status: 'on',
				handler: me.serverButtonHandler,
				scope: me
			}, {
				xtype: 'tbspacer',
				width: 10
			});
		}, me);
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [
				{xtype: 'tbspacer', width: 10},
				serverButtons
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
			mapCircleRadius: me.mapCircleRadius,
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
				.attr('r', me.mapCircleRadius)
				.style('stroke', '#555555')
				.style('stroke-width', .75)
				.style('visibility', function(d, i) {
					return me.serverVisibility.indexOf(d.serverFunction) >= 0 ? 'visible' : 'hidden';
				})
				.style('fill', function(d) {
					return Ext.Array.filter(App.util.Global.stub.serverFunctions, function(sf) {
						return sf.name == d.serverFunction;
					})[0].color;
				});
		}, me);
		
		// conflicts with active tooltipDiv
		if(!me.mousingOver) {
			me.svg.selectAll('circle').call(d3.helper.tooltip().text(function(d, i) {
				return '<span style="color:#EEEEEE;font-weight:bold">' + d.ip + '</span><br>'
					+ '<span style="color:#FFCC33;font-weight:bold">' + d.location + '</span><br>'
					+ d.owner + ' ' + d.serverFunction + '<br>'
					+ Ext.util.Format.number(d.latitude, '0.000')
					+ '/'
					+ Ext.util.Format.number(d.longitude, '0,000')
					+ '<br>['
					+ Ext.Array.sort(d.virus).join(', ')
					+ ']';
			}));
		}
	},
	
	/**
 	 * @function
 	 * @description Handle clicks on the server buttons in the toolbar
 	 * to show / hide the circles corresponding to the type
 	 */
	serverButtonHandler: function(btn, evt) {
		var me = this, visibility;
		
		if(btn.status == 'on') {
			btn.setIconCls('icon-delete');
			btn.status = 'off';
			visibility = 'hidden';
			me.serverVisibility = Ext.Array.remove(me.serverVisibility, btn.serverFunction);
		} else {
			btn.setIconCls('icon-tick');
			btn.status = 'on';
			visibility = 'visible';
			me.serverVisibility.push(btn.serverFunction);
		}
		
		// show / hide
		me.svg.selectAll('circle')
			.filter(function(e, j) {
				return e.serverFunction == btn.serverFunction;
			})
			.style('visibility', visibility);
	},
	
	/**
 	 * get a random longitude, latitude and location name
 	 * so WE CAN AVOID THE WATER !!!!!
 	 */
	getRandomLongLatLocation: function() {
		var me = this;
		
		var randomFeature = me.worldMap.topo[Math.floor(Math.random() * 240) + 1];
		var arr = Ext.Array.flatten(randomFeature.geometry.coordinates[0]);
		
		if(arr.length >= 2) {
			var randomIndex = Math.floor(Math.random() * arr.length/2) * 2;
			return {
				location: randomFeature.properties.name,
				long: arr[randomIndex],
				lat: arr[randomIndex+1]
			};
		} else {
			return {
				location: 'Unknown',
				long: 0,
				lat: 0
			};
		}
	},

	/**
	 * @function
	 * @description Clear all circles from the chart
	 */
	clearAllData: function() {
		var me = this;
		
		me.svg.selectAll('circle').remove();
	}
});