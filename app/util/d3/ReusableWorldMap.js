/**
 * @class
 * @author Mark Fehrenbacher
 * @memberOf App.util.d3
 * @description Configurable world map class
 */
Ext.define('App.util.d3.ReusableWorldMap', {
	
	/**
	 * The primary SVG element.  Must be set outside the class and
	 * and passed as a configuration item
	 */
	svg: null,
	
	canvasHeight: 500,
	canvasWidth: 500,
	centered: null,
	chartInitialized: false,
	circleData: [],
	countryDefaults: {
		fill: '#BBB',
		fillOver: '#DEB887',	// 999
		stroke: 'none',
		strokeWidth: 1,
		strokeOver: 'white'
	},
	eventRelay: null,
	gPath: null,
	graticule: d3.geo.graticule(),
	mapCircleRadius: 4,
	panel: null,
	path: null,
	projection: null,
	tooltipFunction: function(d, i) { return d.country;},
	topo: null,
	topoUrl: 'data/geo/world-topo-min.json',
	zoom: null,
	
	/**
 	 * constructor
 	 */
	constructor: function(config) {
		var me = this;
		Ext.merge(me, config);
	},
	
	/**
	 * @function
	 * @memberOf App.util.d3.ReusableWorldMap
	 * @description Initialize chart components
	 */
	initChart: function() {
		var me = this;
		
		me.projection = d3.geo.mercator()
			.translate([me.canvasWidth/2, me.canvasHeight/2])
			.scale(me.canvasWidth / 2 / Math.PI);
		
		me.path = d3.geo.path().projection(me.projection);
		
		me.gPath = me.svg.append('svg:g');
		
		me.gLegend = me.svg.append('svg:g');
		
		me.zoom = d3.behavior.zoom()
			.scaleExtent([1, 9])
			.on('zoomstart', function() {
				// console.log('map zoom start...');
			})
			.on('zoomend', function() {
				// console.log('map zoom end...');
				
				// adjust circle radius after zooming is finished
				me.svg.selectAll('circle')
					.attr('r', function() {
						return me.mapCircleRadius / me.zoom.scale();
					})
					.style('stroke', function() {
						return me.zoom.scale() > 1 ? 'none' : '#555555';
					});
			})
			.on('zoom', function() {
				var t = d3.event.translate,
					s = d3.event.scale,
					zscale = s,
					h = Math.floor(me.canvasHeight/4),
					width = me.canvasWidth,
					height = me.canvasHeight;
		
				// calculate translate directives
				t[0] = Math.min(
					(width/height) * (s - 1), 
					Math.max(width * (1-s), t[0])
				);
				t[1] = Math.min(
					h * (s-1) + h * s,
					Math.max(height  * (1-s) - h * s, t[1])
				);
				
				// zoom, scale map, scale circles
				me.zoom.translate(t);
				me.gPath.attr('transform', 'translate(' + t  + ')scale(' + s + ')');
				me.svg.selectAll('circle').attr('transform', 'translate(' + t  + ')scale(' + s + ')');
			}, me);
			
		me.svg.call(me.zoom);
			
		me.panelMask(true);
		
		// query topo data
		Ext.Ajax.request({
			url: me.topoUrl,
			method: 'GET',
			success: function(response, options) {
				var resp = Ext.decode(response.responseText);
				
				me.topo = topojson.feature(resp, resp.objects.countries).features;
			},
			callback: function() {
				me.renderMap();
				me.renderLegend();
				me.panelMask(false);
			},
			scope: me
		});
	},
	
	/**
	 * @function
	 * @memberOf App.util.d3.ReusableWorldMap
	 * @description Draw the map
	 */
	renderMap: function() {
		var me = this;
			
		me.gPath.append('path')
			.datum(me.graticule)
			.attr('class', 'graticule')
			.attr('d', me.path);
			
		me.gPath.append('path')
			.datum({
				type: 'LineString',
				coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]
			})
			.attr('class', 'equator')
			.attr('d', me.path);
			
		var countrySelection = me.gPath.selectAll('.country')
			.data(me.topo);
		
		countrySelection.enter()
			.append('path')
			.attr('class', 'country')
			.attr('d', me.path)
			.attr('id', function(d, i) {
				return d.id;
			})
			.style('fill', me.countryDefaults.fill)
			.style('stroke', me.countryDefaults.stroke)
			.style('stroke-width', me.countryDefaults.strokeWidth)
			.on('mouseover', function(d, i) {
				var el = d3.select(this);
				
				if(el.attr('class') == 'country') {
					el.style('stroke', me.countryDefaults.strokeOver)
						.style('fill', me.countryDefaults.fillOver);
				}
			})
			.on('mouseout', function(d, i) {
				var el = d3.select(this);
				
				if(el.attr('class') == 'country') {
					el.style('stroke', me.countryDefaults.stroke)
						.style('fill', me.countryDefaults.fill);
				}
			});
		
		countrySelection.call(d3.helper.tooltip().text(me.tooltipFunction));
		
		me.panelReady();
	},
	
	/**
	 * @function
	 * @description Render static, unchanging legend bottom left
 	 */
	renderLegend: function() {
		var me = this,
			defaultYPos = 25;
		
		////////////////////////////////////////
	 	// LEGEND RECTANGLES
	 	////////////////////////////////////////
	 	me.gLegend.selectAll('rect')
		 	.data(App.util.Global.stub.serverFunctions)
		 	.enter()
		 	.append('rect')
		 	.attr('x', function(d, i) {
		 		return 25 + (i*60);
			 })
			.attr('y', defaultYPos)
			.attr('width', 7)
			.attr('height', 7)
			.style('fill', function(d) {
				return d.color;
			});
			
		////////////////////////////////////////
	 	// LEGEND TEXT
	 	////////////////////////////////////////
	 	me.gLegend.selectAll('text')
		 	.data(App.util.Global.stub.serverFunctions)
		 	.enter()
		 	.append('text')
		 	.attr('x', function(d, i) {
		 		return 25 + (i*60) + 12;
			 })
			.attr('y', defaultYPos + 8)
			.attr('class', 'tinyText')
			.text(function(d) {
				return d.shortName;
			});
	},
	
	/**
	 * @function
	 * @memberOf App.util.d3.ReusableWorldMap
	 * @description Control the parent container mask/unmask
	 */
	panelMask: function(bool) {
		var me = this;
		
		if(me.panel) {
			if(bool) { me.panel.getEl().mask('Loading...'); return; }
			me.panel.getEl().unmask();
		}
	},
	
	/**
	 * @function
	 * @memberOf App.util.d3.ReusableWorldMap
	 * @description Notify the parent panel that the map has been rendered
	 */
	panelReady: function() {
		var me = this;
		
		if(me.panel) {
			try {
				me.panel.panelReady();
			} catch (err) {
				; // pass
			}
		}
	},
	
	/**
 	 * @function
 	 * @description Given a longitude and latitude, return
 	 * x/y coords based on projection
 	 */
	getMapCoords: function(long, lat) {
		return this.projection([long, lat]);
	},
	
	/**
	 * 
	 * GETTERS
	 *
	 */
	getTooltipFunction: function() {
		var me = this;
		return me.tooltipFunction;
	},
	
	/**
	 * 
	 * SETTERS
	 *
	 */
	setTooltipFunction: function(fn) {
		var me = this;
		me.tooltipFunction = fn;
	}
});
