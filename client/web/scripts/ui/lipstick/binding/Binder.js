// Generated by CoffeeScript 1.2.1-pre

define([], function() {
  var Bindings;
  if (!$.event.special.destroyed) {
    $.event.special.destroyed = {
      remove: function(o) {
        if (o.handler) return o.handler();
      }
    };
  }
  return Bindings = (function() {

    Bindings.name = 'Bindings';

    function Bindings(opts) {
      var _this = this;
      this.model = opts.model;
      this.$el = opts.el instanceof $ ? opts.el : $(opts.el);
      $el.bind("destroyed", function() {
        return _this.dispose();
      });
      this._bind(opts.mapping);
    }

    Bindings.prototype.dispose = function() {
      return this.model.off(null, null, this);
    };

    Bindings.prototype.on = function() {};

    Bindings.prototype._bind = function(mapping) {
      var $target, binding, selector, _results;
      _results = [];
      for (selector in mapping) {
        binding = mapping[selector];
        $target = this.$el.find(selector);
        _results.push(this._applyBinding($target, binding));
      }
      return _results;
    };

    Bindings.prototype._applyBinding = function($target, binding) {};

    return Bindings;

  })();
});

/*
	"attribute selector": "fieldName"  (where attribute is some jquery func: text, val, css, addClass, removeClass, etc.)
	well what if we want one func on true and another on false.. that is a common use case...

	alternative:
		"selector": 
			fn: "jQuery fn to apply"  (what about ender and so on?)
			field: "model field name"
			# optional funcs to apply with certain values
			fn_false:
			fn_missing:

	How should / could we handle computed properties?
	How do we know what properties a func will depend on?
		1. We can specify it in the mapping..
		2. We can use wizardry (error prone)
		3. We can run the function and see what "gets" it calls...
		  The gets that are called then obviously make up our computed property
			if the func has side effects then that is a non-starter
			add the stipulation that it can't had side effects?  It is a getter anyway...
*/

