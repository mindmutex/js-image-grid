(function ($) {
	'use strict';
	function ImageGrid(element, options) {
		this.element = element;
		this.options = options;
		this.children = [];
		this.checkstates = {};
				
		this.create();
	}
	
	ImageGrid.prototype.setContentWidth = function() {
		// the extra -1 is for safety, sometimes there is a glitch that causes the images to wrap scrollbar appears. 
		this.containerWidth = this.element.width() - this.options.margin * 2 - 1;
	};

	ImageGrid.prototype.create = function() {
		var self = this;
		$(window).on('resize', function(){
			self._invalidate();
		});
		
		this.element
			.on('mouseover', 'li', function(e){
				$(e.currentTarget).addClass('active');
			}).on('mouseout', 'li', function(e) {
				$(e.currentTarget).removeClass('active');
			});
		
		if (this.options.checkable) {
			this.element.on('click', 'a', $.proxy(this.handleClicks, this));
		}
		this._invalidate();
	};
	
	ImageGrid.prototype._invalidate = function() {
		this.children = this.element.find(this.options.selector).css('visibility', 'hidden');
		this.setContentWidth();
		
		if (this.children.attr('style')) {
			this.children.removeAttr('style')
				.find('img')
					.removeAttr('style')
					.end()
				.height(this.options.defaultHeight);					
		}		
		
		// preload all images, make sure width is set for all images.
		// chrome requires listening on load event.
		var images = this.children.find('img'), readyImages = 0;
		for (var i = 0; i < images.length; i++) {
			var image = $(images[i]).height(this.options.defaultHeight);
			if (image.width() !== 0) {
				readyImages++;
			}
		}
		
		if (readyImages === images.length) {
			this.draw();
		} else {
			var self = this, timeout;
			images.load(function(){
				clearTimeout(timeout);
				timeout = setTimeout(function(){
					// check if all images have been loaded.
					var hasLoaded = 0;
					for (var i = 0; i < images.length; i++) {
						var image = $(images[i]).height(self.options.defaultHeight);
						if (image.width() !== 0) {
							hasLoaded++;
						}
					}
					if (hasLoaded === images.length) {
						timeout = setTimeout(function() {
							self._invalidate();	
						}, 100);
					}	
				}, 100);
			});
		}		
	};
	
	ImageGrid.prototype.handleClicks = function(e) {
		e.preventDefault();
		
		var target = e.currentTarget, index = this.element.find('a').index(target);
		if (this.checkstates[index]) {
			delete this.checkstates[index];
			this.updateCheckStates();
		
			this.element.trigger('unchecked', [target, this._value()]);
		} else {
			if (this.options.single) {
				this.checkstates = {};
			}
			this.checkstates[index] = target;
			this.updateCheckStates();
			this.element.trigger('checked', [target, this._value()]);
		}
	};
	
	ImageGrid.prototype.updateCheckStates = function() {
		var anchors = this.element.find('a');
		for (var i = 0; i < anchors.size(); i++) {
			var anchor = $(anchors[i]), isChecked = this.checkstates[anchors.index(anchor)];
			anchor.parent()[isChecked ? 'addClass' : 'removeClass']('state-checked');
		}
	};
	
	ImageGrid.prototype._value = function() {
		return $.map(this.checkstates, function(){
			return arguments[0];
		});		
	};
	
	ImageGrid.prototype._clear = function() {
		this.checkstates = {};
		this.updateCheckStates();
	};	
	
	ImageGrid.prototype.draw = function() {
		this.element.css('visibility', 'visible');
		
		var row = 0, children = [];
		for (var i = 0; i < this.children.length; i++) {
			var column = $(this.children[i]), width = column.outerWidth(true);
			if (row + width >= this.containerWidth) {
				this.drawRow(children, row);
				
				children = [];
				row = 0;
			}
			children.push(column);
			row += width;
		}
		
		if (this.options.adjustLastRow && children.length > 0) {
			this.drawRow(children, row);
		}
	};
	
	ImageGrid.prototype.drawRow = function(children, row) {
		// calculate what is the difference between items and how much padding should 
		// be added to each picture.
		var diff = Math.max(0, this.containerWidth - row), add = diff / children.length;
		
		// the addition will be floored and appended to 
		// last element in children.
		var overlap = 0; 
		
		// these heights are assigned to images, use these to figure out 
		// the minimum width for column.
		var minHeight = this.options.maxHeight;
		
		for (var c = 0; c < children.length; c++) {
			var child = children[c], childWidth = child.width() + add;
			 
			overlap += childWidth - Math.floor(childWidth);
			childWidth = Math.floor(childWidth);
			
			// adds the overlap to the last item in children array.
			if (c + 1 === children.length) {
				childWidth += Math.floor(overlap);
			}
			
			var aspectRatio = childWidth / child.width();
			var childHeight = Math.ceil(child.height() * aspectRatio);
			
			child.width(childWidth);
			child.find('img').height(childHeight);
			
			// adjust minimum height to be set for children in row.
			minHeight = Math.min(childHeight, minHeight);
		}
		
		// adjust height for children in row.
		for (c = 0; c < children.length; c++) {
			children[c].height(minHeight);
		}
	};	
	
	// default options for plugin
	var defaultOptions  = {
		selector: 'li',
		checkable: true,
		single: true,
		defaultHeight: 100, 
		maxHeight: 500, 
		margin: 2, 
		adjustLastRow: false
	};
	
	var pluginName = 'imageGrid';
	$.fn[pluginName] = function(options) {
		var retValue = this;
		
		this.each(function() {
			var element = $(this);
			if (!element.data(pluginName)) {
				// initialize a new instance of plugin
				options = $.extend({}, defaultOptions, options || {});
				element.data(pluginName, 
					new ImageGrid(element, options));
				
			} else if (typeof options === 'string') {
				// attempt to call a function in plugin that where 
				// the name starts with underscore.
				var fnName = '_' + options;
				var layout = element.data(pluginName);
				
				if ($.isFunction(layout[fnName])) {
					retValue = layout[fnName]([].slice.call(arguments, 1));	
				}
			}
		});
		
		return retValue;
	};	
})(jQuery);