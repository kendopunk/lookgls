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
			me.worldMapRendered = false,
			me.rawData = null;
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [{
				xtype: 'tbtext',
				text: 'FOO'
			}]
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
			tooltipFunction: function(d, i) {
				return d.properties.name;
			}
		});
		
		me.worldMap.initChart();
	},
	
	/**
 	 * @function
 	 */
	panelReady: function() {
		var me = this;
		
		me.eventRelay.publish('mapRendered', true);
		
		
		/*Ext.Ajax.request({
			url: 'data/population_metrics.json',
			method: 'GET',
			success: function(response, options) {
				var resp = Ext.decode(response.responseText);
				me.rawData = resp;
				me.renderMetricOverlay();
			},
			callback: function() {
				me.metricCombo.setDisabled(false);
			},
			scope: me
		});*/
	},
	
	/**
	 * @function
	 * @description Colorize/revert relevant paths.
	 */
	renderMetricOverlay: function() {
		var me = this;
		
		var currentMetric = me.currentMetric,
			dat = me.rawData.data[currentMetric],
			map = dat.map(function(d) { return d.country; });
		
		var opacityScale = d3.scale.linear()
			.domain([
				d3.min(dat, function(d) { return d.value;}),
				d3.max(dat, function(d) { return d.value;})
			])
			.range([.3, 1]);
			
		var countrySelection = me.worldMap.gPath.selectAll('.country');
		
		////////////////////////////////////////
		// "go" countries (color on)
		////////////////////////////////////////
		var go = countrySelection.filter(function(e, j) {
			return map.indexOf(e.properties.name) >= 0;
		});
		
		// add "active" class
		go.classed('active', true);
		
		go.transition()
			.duration(250)
			.style('fill', me.currentColor)
			.style('opacity', function(d, i) {
				var op;
				
				var rating = dat.forEach(function(item) {
					if(item.country == d.properties.name) {
						op = opacityScale(item.value);
					}
				});
				
				return op || .2;
			});
			
		go.call(d3.helper.tooltip().text(function(d, i) {
			var match = dat.filter(function(e, j) {
				return e.country == d.properties.name;
			});
			if(match.length > 0) {
				if(currentMetric == 'population') {
					return '<b>' + match[0].country + '</b><br>'
						+ Ext.util.Format.number(match[0].value, '0,000');
				} else if(currentMetric == 'populationGrowth') {
					return '<b>' + match[0].country + '</b><br>'
						+ Ext.util.Format.number(match[0].value, '0,000.00')
						+ '%';
				} else {
					return '<b>' + match[0].country + '</b><br>'
						+ Ext.util.Format.number(match[0].value, '0,000.00');
				}
			}
			return d.properties.name;
		}));
		
		////////////////////////////////////////
		// "no go" countries" (color off)
		////////////////////////////////////////
		var nogo = countrySelection.filter(function(e, j) {
			return map.indexOf(e.properties.name) < 0;
		});
		
		// remove "active" class
		//nogo.classed('active', false);
		
		nogo.style('fill', me.worldMap.countryDefaults.fill)
			.classed('active', false)
			.style('opacity', 1);
		
		nogo.call(d3.helper.tooltip().text(me.worldMap.tooltipFunction));
	}
});