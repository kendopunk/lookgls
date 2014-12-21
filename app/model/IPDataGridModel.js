/**
 * @class
 * @author Mark Fehrenbacher
 * @description IP data grid model
 */
Ext.define('App.model.IPDataGridModel', {
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'id', type: 'number'},
		{name: 'owner', type: 'string'},
		{name: 'ip', type: 'number'},
		{name: 'virus'},
		{name: 'longitude', type: 'number'},
		{name: 'latitude', type: 'number'},
		{name: 'ipFunction', type: 'string'}
	]
});