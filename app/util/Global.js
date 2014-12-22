/**
 * @class
 * @memberOf App.util
 * @description Global static and utility functions
 */
Ext.define('App.util.Global', {
	statics: {
		
		ip: {
			genRandomLongIp: function() {
				var min = 1677721600, max = 4294967295;
				return Math.floor(Math.random() * (max-min+1) + min);
			},
			
			// -90 to 90
			genRandomLatitude: function() {
				// 80 instead of 90
				var num = (Math.random()*80).toFixed(3);
				if(Math.random() > .5) {
					return num * -1;
				}
				return num;
			},
			
			// -180 to 180
			genRandomLongitude: function() {
				// 170 instead of 180
				var num = (Math.random()*170).toFixed(3);
				if(Math.random() > .5) {
					return num * -1;
				}
				return num;
			
			},
			
			longToIp: function(num) {
				var part1 = num & 255;
				var part2 = ((num >> 8) & 255);
				var part3 = ((num >> 16) & 255);
				var part4 = ((num >> 24) & 255);
				
				return part4 + "." + part3 + "." + part2 + "." + part1;
			}
		},
		
		stub: {
			owners: [{
				fullName: 'TMQ Financial',
				shortName: 'TMQ'
			}, {
				fullName: 'Anderson Services',
				shortName: 'Anderson'
			}],
			
			serverFunctions: [{
				name: 'mail server',
				shortName: 'Mail',
				color: '#FFCC33'
			}, {
				name: 'web server',
				shortName: 'Web',
				color: '#6495ED'
			}, {
				name: 'ftp server',
				shortName: 'FTP',
				color: '#C71585'
			}],
			
			viruses: [{
				name: 'APT1',
				type: 'Bot'
			}, {
				name: 'Botnet',
				type: 'Bot',
			}, {
				name: 'Spam',
				type: 'Spam',
			}, {
				name: 'StealCreds',
				type: 'Trojan'
			}]
		},
	
		sortUtils: {
			dynamicSort: function(property) {
				return function(obj1, obj2) {
					return obj1[property] > obj2[property] ? 1 : obj1[property] < obj2[property] ? -1 : 0;
				}
			},
			dynamicMultiSort: function() {
				/*
				* save the arguments object as it will be overwritten
				* note that arguments object is an array-like object
				* consisting of the names of the properties to sort by
				*/
				var props = arguments;
				return function(obj1, obj2) {
					var i=0, result=0, numberOfProperties = props.length;
					
					/* try getting a different result from 0 (equal)
					* as long as we have extra properties to compare
					*/
					while(result === 0 && i < numberOfProperties) {
						result = App.util.Global.sortUtils.dynamicSort(props[i])(obj1, obj2);
						i++;
					}
					
					return result;
				}
			}
		},
		
		svg: {
			decimalTickFormat: function(d) {
				return Ext.util.Format.number(d, '0,000.0');
			},
			
			numberTickFormat: function(d) {
				return Ext.util.Format.number(d, '0,000');
			},
			
			percentTickFormat: function(d) {
				return Ext.util.Format.number(d, '0,000.0') + '%';
			},
			
			colorSchemes: [{
				name: 'Default',
				palette: 'default'
			}, {
				name: 'Earthy',
				palette: '20b'
			}, {
				name: 'Paired',
				palette: 'paired'
			}, {
				name: 'Gradient Blue',
				palette: 'gradient_blue'
			}, {
				name: 'Gradient Red',
				palette: 'gradient_red'
			}]
		},
		
		// lighten or darken a hex color
	    // @param color (with #)
	    // @param percent integer 0-100 (negative = darken)
	    // @return newColor
	    hexLightenDarken: function(color, percent) {
	    
	    	if(color[0] === '#') {
		    	color = color.substring(1);
		    }
	    
	    	var num = parseInt(color,16),
	    		amt = Math.round(2.55 * percent),
	    		R = (num >> 16) + amt,
	    		B = (num >> 8 & 0x00FF) + amt,
	    		G = (num & 0x0000FF) + amt;
	    		
	    		return (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
	    }
	}
});