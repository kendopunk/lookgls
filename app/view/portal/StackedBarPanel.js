/**
 * @class
 * @author Mark Fehrenbacher
 * @memberOf App.view.portal
 * @description Rendering panel for stacked bar chart
 */
Ext.define('App.view.portal.StackedBarPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.stackedBar',
	
	requires: [
		'App.util.d3.ReusableStackedBar'
	],
	
	plain: true,
	
	initComponent: function() {
		var me = this;
		
		me.btnHighlightCss = 'btn-highlight-peachpuff',
			me.canvasHeight,
			me.canvasReady = false,
			me.canvasWidth,
			me.currentView = 'ov',
			me.currentScale = 'absolute',
			me.eventRelay = Ext.create('App.util.MessageBus'),
			me.panelId = null,
			me.stackedBarChart = null;
			
		////////////////////////////////////////
		// data index lookups / mappers
		////////////////////////////////////////	
		me.virusMapper = [{
			index: 'botCount',
			label: 'BOTS'
		}, {
			index: 'trojanCount',
			label: 'TROJANS'
		}, {
			index: 'spamCount',
			label: 'SPAM'
		}];
		
		me.serverMapper = [{
			index: 'ftpServerCount',
			label: 'FTP'
		}, {
			index: 'mailServerCount',
			label: 'MAIL'
		}, {
			index: 'webServerCount',
			label: 'WEB'
		}];
			
		////////////////////////////////////////
		// subscriptions
		////////////////////////////////////////
		me.eventRelay.subscribe('ipStoreDataChange', me.ipStoreDataChange, me);
		me.eventRelay.subscribe('clearAllData', me.clearAllData, me);
		
		////////////////////////////////////////
		// tick functions
		////////////////////////////////////////
		me.tickFunctions = {
			absolute: function(d) {
				return Ext.util.Format.number(d, '0,000');
			},
			pct: function(d) {
				return Ext.util.Format.number(d, '0') + '%';
			}
		};
		
		////////////////////////////////////////
		// label functions
		////////////////////////////////////////
		me.labelFunctions = {
			absolute: function(d, i) {
				if(d.y == 0) { return ''; }
				return Ext.util.Format.number(d.y, '0,000');
			},
			pct: function(d, i) {
				if(d.y == 0) { return ''; }
				return Ext.util.Format.number(d.y, '0.0') + '%';
			}
		};
		
		////////////////////////////////////////
		// tooltip functions
		////////////////////////////////////////
		me.tooltipFunctions = {
			absolute: function(d, i) {
				return '<b>' + d.category + '</b><br>'
					+ Ext.util.Format.number(d.y, '0,000');
			},
			pct: function(d, i) {
				return '<b>' + d.category + '</b><br>'
					+ Ext.util.Format.number(d.y, '0.00') + '%';
			}
		};
		
		////////////////////////////////////////
		// toolbar components
		////////////////////////////////////////
		me.viewCombo = Ext.create('Ext.form.field.ComboBox', {
			disabled: true,
			store: Ext.create('Ext.data.Store', {
				fields: ['display', 'value', 'palette'],
				data: [
					{display: 'Owner->Virus', value: 'ov', palette: 'custom'},
					{display: 'Owner->Server', value: 'os', palette: 'server'}
				]
			}),
			displayField: 'display',
			valueField: 'value',
			editable: false,
			queryMode: 'local',
			triggerAction: 'all',
			width: 125,
			listWidth: 125,
			value: me.currentView,
			listeners: {
				select: function(combo, records) {
					var gr = me.up().down('grid');
					
					me.stackedBarChart.setColorPalette(records[0].data.palette);
					
					if(gr !== undefined) {
						var storeData = Ext.clone(gr.getStore().getRange());
						
						if(storeData.length > 0) {
							me.currentView = combo.getValue();
							
							me.stackedBarChart.setGraphData(
								me.normalizeData(
									Ext.Array.map(storeData, function(rng) {
										return rng.data;
									})
								)
							);
							
							me.stackedBarChart.draw();
						}
					}
				},
				scope: me
			}
		});
		
		me.absoluteButton = Ext.create('Ext.button.Button', {
			text: 'Absolute',
			metric: 'absolute',
			cls: me.btnHighlightCss,
			handler: me.scaleHandler,
			scope: me
		});
		
		me.pctButton = Ext.create('Ext.button.Button', {
			text: 'Percent',
			metric: 'pct',
			handler: me.scaleHandler,
			scope: me
		});
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [
				{xtype: 'tbtext', text: '<b>View:</b>'},
				me.viewCombo,
				'->',
				{xtype: 'tbtext', text: '<b>Scale:</b>'},
				me.absoluteButton,
				'-',
				me.pctButton,
				{xtype: 'tbspacer', width: 3}
			]
		}];
		
		me.on('afterrender', me.initCanvas, me);

		me.callParent(arguments);
	},
	
	/**
 	 * @function
 	 * @description Initialize the stacked bar chart drawing space
 	 */
 	initCanvas: function() {
 		var me = this;
 		
 		me.getEl().mask('Loading...');
 		
	 	// initialize SVG, width, height
 		me.canvasWidth = parseInt(me.body.dom.offsetWidth * .98),
	 		me.canvasHeight = parseInt(me.body.dom.offsetHeight * .98),
 			me.panelId = '#' + me.body.id;
 			
	 	me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight);
	 		
	 	me.canvasReady = true;
	 		
	 	me.stackedBarChart = Ext.create('App.util.d3.ReusableStackedBar', {
			svg: me.svg,
			canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			colorScale: d3.scale.category20(),
			panelId: me.panelId,
			chartFlex: 3,
			chartTitle: 'Threat Data',
			graphData: [],
			legendFlex: 1,
			margins: {
				top: 40,
				right: 15,
				bottom: 40,
				left: 65
			},
			showLabels: true,
			showLegend: true,
			labelFunction: me.labelFunctions[me.currentScale],
			tooltipFunction: me.tooltipFunctions[me.currentScale],
			yTickFormat: me.tickFunctions[me.currentScale]
		});
		
		// need access to functions in the grid panel
		var gr = me.up().down('grid');
		
		Ext.Ajax.request({
			url: 'data/data.json',
			method: 'GET',
			success: function(response) {
			
				var resp = Ext.decode(response.responseText), baseData = [];
				
				// base data
				Ext.each(Ext.Array.sort(Ext.Array.unique(Ext.Array.map(resp.threatData, function(d) {
					return d.owner;
				}))), function(item) {
					baseData.push({
						owner: item,
						botCount: 0,
						spamCount: 0,
						trojanCount: 0,
						mailServerCount: 0,
						ftpServerCount: 0,
						webServerCount: 0
					});
				});
				
				// sum up values
				Ext.each(baseData, function(bd) {
					Ext.each(resp.threatData, function(td) {
						bd.botCount += gr.countVirus(td, 'Bot', bd.owner);
						bd.spamCount += gr.countVirus(td, 'Spam', bd.owner);
						bd.trojanCount += gr.countVirus(td, 'Trojan', bd.owner);
						bd.mailServerCount += gr.countServer(td, 'mail server', bd.owner);
						bd.webServerCount += gr.countServer(td, 'web server', bd.owner);
						bd.ftpServerCount += gr.countServer(td, 'ftp server', bd.owner);
					});
				});
				
				me.stackedBarChart.setGraphData(me.normalizeData(baseData));
				if(me.stackedBarChart.chartInitialized) {
					me.stackedBarChart.draw();
				} else {
					me.stackedBarChart.initChart().draw();
				}
			},
			callback: function() {
				me.viewCombo.setDisabled(false);
				me.getEl().unmask();
			},
			scope: me
		});
 	},
	
	/**
 	 * @function
 	 * @description Listen for change to the grid store
 	 */
	ipStoreDataChange: function(dat) {
		var me = this;
		
		if(!me.canvasReady) { return; }
		
		me.viewCombo.setDisabled(true);
		
		// take raw IP store data and change
		// to chart-consumable format
		var formattedData = me.normalizeData(dat);

		me.stackedBarChart.setGraphData(formattedData);
		if(me.stackedBarChart.chartInitialized) {
			me.stackedBarChart.draw();
		} else {
			me.stackedBarChart.initChart().draw();
		}
		
		me.viewCombo.setDisabled(false);
	},
	
	/**
 	 * @function
 	 */
	normalizeData: function(dat) {
		var me = this,
			ret = [];
		
		////////////////////////////////////////
		// owner -> server
		////////////////////////////////////////
		if(me.currentView == 'os') {
			Ext.each(me.serverMapper, function(sm) {
				var obj = {
					category: sm.label,
					values: []
				};
			
				Ext.each(dat, function(d) {
					obj.values.push({
						id: d.owner,
						category: sm.label,
						y: d[sm.index]
					});
				});
			
				ret.push(obj);
			}, me);
		}
		////////////////////////////////////////
		// owner -> virus
		////////////////////////////////////////
		else {
			Ext.each(me.virusMapper, function(vm) {
				var obj = {
					category: vm.label,
					values: []
				};
			
				Ext.each(dat, function(d) {
					obj.values.push({
						id: d.owner,
						category: vm.label,
						y: d[vm.index]
					});
				});
			
				ret.push(obj);
			}, me);
		}
		
		////////////////////////////////////////
		// sort by owner before final adjustments
		////////////////////////////////////////
		
		if(me.currentScale == 'pct') {
			return me.normalizePercent(ret);
		}
		return ret;
	},
	
	normalizePercent: function(normalizedData) {
		var me = this,
			idTotals = [],
			uniqueIds = [];
		
		// retrieve unique ID values from the first array
	  	Ext.each(normalizedData[0].values, function(obj) {
	  		uniqueIds.push(obj.id);
	  		idTotals.push(0);
	  	});
	  	
	  	// run through the data and sum up totals per ID
	  	for(var i=0; i<normalizedData.length; i++) {
		  	var plucked = Ext.pluck(normalizedData[i].values, 'y'),
		  		j = 0;
			
			plucked.map(function(el) {
				idTotals[j] += el;
				j++;
			});
		}
		
		// now, run through the normalized data again and calculate
		// percentage
		Ext.each(normalizedData, function(obj) {
			var ind = 0;
			
			Ext.each(obj.values, function(item) {
				item.y = (item.y/idTotals[ind] * 100);
				ind++;
			});
		});
		
		return normalizedData;
   	},
	
	/**
 	 * @function
 	 * @description Adjusting the scale
 	 */
	scaleHandler: function(btn, evt) {
		var me = this;
		
		// adjust chart scale params
		me.currentScale = btn.metric;
		me.stackedBarChart.setYTickFormat(me.tickFunctions[btn.metric]);
		me.stackedBarChart.setLabelFunction(me.labelFunctions[btn.metric]);
		me.stackedBarChart.setTooltipFunction(me.tooltipFunctions[btn.metric]);
		
		// highlight / unhighlight
		if(btn.metric == 'pct') {
			me.pctButton.addCls(me.btnHighlightCss);
			me.absoluteButton.removeCls(me.btnHighlightCss);
		} else {
			me.absoluteButton.addCls(me.btnHighlightCss);
			me.pctButton.removeCls(me.btnHighlightCss);
		}
		
		var gr = me.up().down('grid');
					
		if(gr !== undefined) {
			var storeData = Ext.clone(gr.getStore().getRange());
			
			me.stackedBarChart.setGraphData(
				me.normalizeData(
					Ext.Array.map(storeData, function(rng) {
						return rng.data;
					})
				)
			);
			me.stackedBarChart.draw();
		}
	},
	
	/**
	 * @function
	 * @description Clear all data from the stacked bar chart...actually
	 * we're resetting all the y / y0 properties to zero
	 */
	clearAllData: function() {
		var me = this;
		
		var gd = Ext.clone(me.stackedBarChart.graphData);
		Ext.each(gd, function(d) {
			Ext.each(d.values, function(dv) {
				dv.y = 0;
				dv.y0 = 0;
			});
		});
		
		me.stackedBarChart.setGraphData(gd);
		me.stackedBarChart.draw();
	}
});