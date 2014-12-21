/**
 * @class
 * @author Mark Fehrenbacher
 * @description IP data grid model
 */
Ext.define('App.model.IPDataGridModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'owner', type: 'string'},
		{name: 'botCount', type: 'number'},
		{name: 'spamCount', type: 'number'},
		{name: 'trojanCount', type: 'number'},
		{name: 'mailServerCount', type: 'number'},
		{name: 'ftpServerCount', type: 'number'},
		{name: 'webServerCount', type: 'number'}
	]
});