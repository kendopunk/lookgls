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
		fillOver: '#999',
		stroke: 'none',
		strokeWidth: 1,
		strokeOver: 'white'
	},
	eventRelay: null,
	gPath: null,
	graticule: d3.geo.graticule(),
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
		
		me.zoom = d3.behavior.zoom()
			.scaleExtent([1, 9])
			.on('zoomstart', function() {
				// console.log('map zoom start...');
			})
			.on('zoomend', function() {
				// console.log('map zoom end...');
				console.log('ZOOM END!');
				
				me.svg.selectAll('circle').attr('r', function(d) {
					return 3 / me.zoom.scale();
				});
				
				//var circ = me.svg.selectAll('circle');
				///circ.attr('r', 3/1.64);
				
				//var coords = d3.mouse(this);
				//console.debug(coords);
				

				
				// 204 and 265 for dayton
				// 162 and 132...new Dayton @ 1.64
				
				// 257 and 487 on falkland islands
				
			

				/*var lat = 39.290385, long = -76.612189;
				//console.log(me.projection([long, lat]));
				
				var theScale = me.zoom.scale();


				var temp = d3.geo.mercator().translate(me.zoom.translate()).scale(me.zoom.scale());
				//console.log(temp([long, lat]));
				
				me.svg.selectAll('circle')
					.attr('transform', function(d) {
						var ln = temp([long, lat])[0];
						var lt = temp([long, lat])[1];
						
						///console.log('translating...' + ln + ' / ' + lt);
						///console.log(d3.event.scale);
						return 'translate(' + ln + ',' + lt + ')';
						
					});*/
					
					/*
					
					So, simply multiplying by
d3.event.scale fixes this issue:


					As translate is specified in pixels, it should be consistent with the
pixel-space translation vector of d3.behavior.zoom.  I'm not sure how
easy it is to do zooming as well though, I'll need to get back to you on
that!  I imagine you could do this by taking d3.event.scale and
multiplying it by your initial projection scale value to get the new
projection scale value, and everything should stay consistent.*/
					
				/*me.svg.append('circle')
					.datum([1])
					.attr('cx', function(d) {
						var ln = temp([long, lat])[0];
						console.log(ln);
						return ln;
					})
					.attr('cy', function(d) {
						var lt = temp([long, lat])[1];
						console.log(lt);
						return lt;
					})
					.attr('r', 4)
					.style('fill', 'blue');*/
					
					/*me.svg.append('circle')
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
				.style('stroke', 'black')
				.style('stroke-width', .75)
				.style('fill', function(d) {
					return Ext.Array.filter(App.util.Global.stub.serverFunctions, function(sf) {
						return sf.name == d.serverFunction;
					})[0].color;
				});*/

				// https://groups.google.com/forum/#!msg/d3-js/pvovPbU5tmo/lmS86nF_C-EJ

			})
			.on('zoom', function() {
				var t = d3.event.translate,
					s = d3.event.scale,
					zscale = s,
					h = Math.floor(me.canvasHeight/4),
					width = me.canvasWidth,
					height = me.canvasHeight;
					
				//console.log('zoom, scale: ' + d3.event.scale);
		
				t[0] = Math.min(
					(width/height) * (s - 1), 
					Math.max(width * (1-s), t[0])
				);
				t[1] = Math.min(
					h * (s-1) + h * s,
					Math.max(height  * (1-s) - h * s, t[1])
				);
				
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
			.datum(me.gPathraticule)
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
		
		/*var data = [{
		"ip": "10.223.75.86",
		"virus": ["APT1", "Botnet"],
		"owner": "TMQ Financial",
		"serverFunction": "web server",
		"latitude": 39.290385,
		"longitude": -76.612189
	}];
		me.svg.selectAll('circle')
			.data(data)
			.enter()
			.append('circle')
			.attr('cx', function(d) {
				return me.projection([d.longitude, d.latitude])[0];
			})
			.attr('cy', function(d) {
				return me.projection([d.longitude, d.latitude])[1];
			})
			.attr('r', 5)
			.style('fill', '#CC3300');*/
		
		if(me.panel) {
			try {
				me.panel.panelReady();
			} catch (err) {
				; // pass
			}
		}
	},
	
	getMapCoords: function(long, lat) {
		var temp = this.projection([long, lat]);
		
		console.debug(temp);
		return temp;
		
		// 204 and 265 for dayton
		// 110 and 113 

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