(function($) {
	module('jQuery#imgGrid', {
		setup: function() {
			this.list = $('ul');
		}
	});
	test('Supports chainable', function() {
		expect(1);
		strictEqual(this.list.imageGrid(), this.list, 'should be chainable');
	});
	test('New instance', function() {
		expect(1);
		ok(!!this.list.imageGrid().data('imageGrid'), 'should have instance in data');
	});
}(jQuery));
