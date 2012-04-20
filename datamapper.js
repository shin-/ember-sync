/**
 * Interface allowing easy two-way binding between Ember objects and a racer model.
 * Copyright 2012 DotCloud Inc (Joffrey Fuhrer <joffrey@dotcloud.com>))
 *
 * This project is free software released under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */


/**
 * DataMapper object. Contains all useful methods dedicated to
 * map a Racer model to Ember objects. Changes are propagated both ways.
 */
var DM = {
    _idCount: 0,
    /**
     * @private
     * Ctor to Ember.EnumerableObserver that is used to propagate changes from
     * an Ember.Enumerable to the racer model.
     */
    _observer: function(racerPath, racerModel) {
        this.enumerableWillChange = function(coll, removed, added) {

            if (removed.length === 0) {
                return;
            }
            if (removed.length === 1 && added.length === 1 && removed[0] === added[0]) {
                // Update, will be handled by enumerableDidChange
                return;
            }

            var modelColl = racerModel.get(racerPath);

            for (var i = removed.length - 1; i >= 0; i--) {
                var id = removed.objectAt(i).get('_id');
                for (var j = modelColl.length - 1; j >= 0; j--) {
                    if (modelColl[j]._id == id) {
                        racerModel.pass('ignore').remove(racerPath, j);
                        break;
                    }
                }
            }
        };
        
        this.enumerableDidChange = function(coll, removed, added) {
            if (added.length === 0) {
                return;
            }

            var modelColl = racerModel.get(racerPath);
            if (removed === null && added.length === 1) {
                // Update
                var id = added.objectAt(0).get('_id');
                for (var i = modelColl.length - 1; i >= 0; i--) {
                    if (modelColl[i]._id == id) {
                        racerModel.pass('ignore').set(racerPath + '.' + i, 
                            added.objectAt(0).getJSON());
                        return;
                    }
                }
            }

            for (var i = added.length - 1; i >= 0; i--) {
                var clientId = ++DM._idCount,
                    obj = added.objectAt(i);
                obj.set('_id', clientId);
                racerModel.pass('ignore').push(racerPath, obj.getJSON());
            }
        }
    },
    /**
     * @private
     * Synchronize initial model with the corresponding _empty_ 
     * Ember collection
     */
    _initColl: function(emColl, racerPath, racerModel, type) {
        if (emColl.length !== 0) {
            throw 'You can not link a non-empty collection.'
        }
        var racerColl = racerModel.get(racerPath);
        if (!racerColl || racerColl.length <= 0) return;
        for (var i = 0, l = racerColl.length; i < l; i++) {
            racerColl[i]._id = ++this._idCount;
            emColl.pushObject(type.create(racerColl[i]));
        }
    },
    /**
     * Map an Ember collection (array or custom class) to a racer path.
     * @param emColl Ember collection that should be synchronized
     * @param racerPath Racer path that directs to the collection that should be mapped
     * @param racerModel racer.model object
     * @param type Ember class for the objects represented in the collection. Defaults
     * to DM.Object
     */
    linkCollection: function(emColl, racerPath, racerModel, type) {
        type = type || DM.Object;
        type = (typeof type == 'string' ? eval(type) : type);
        this._initColl(emColl, racerPath, racerModel, type);

        // Observe Ember collection to propagate Ember --> Racer model
        emColl.addEnumerableObserver(new this._observer(racerPath, racerModel));

        // Add listeners to model changes in racer to propagate 
        // Racer --> Ember collection
        racerModel.on('set', racerPath + '.*', 
            function(index, obj, out, isLocal, passed) {
                if (passed == 'ignore') return;
                // This should not evaluate to true ever.
                if (obj._id == null && obj._id !== 0) return;
                var item = emColl.findProperty('_id', obj._id);
                // Since we don't use update() the enumerable observer won't be fired.
                // This behavior is desired.
                item && item.setProperties(obj);
            });
        
        racerModel.on('push', racerPath, function(obj, out, isLocal, passed) {
            if (passed == 'ignore') return;
            obj._id = ++DM._idCount;
            emColl.addObject(type.create(obj), true);
        });
        
        racerModel.on('remove', racerPath, 
            function(index, num, removed, isLocal, passed) {
                if (passed == 'ignore') return;
                for (var i = removed.length - 1; i >= 0; i--) {
                    var obj = removed[i];
                    if (obj._id == null && obj._id !== 0) continue;
                    var item = emColl.findProperty('_id', removed[i]._id);
                    emColl.removeObject(item, true);
                }
            });
    },
    /**
     * Map a single Ember object to a Racer path.
     * @param emObject Address to the Ember object that should be synchronized
     * @param racerPath Racer path that directs to the object that should be mapped
     * @param racerModel racer.model object
     * @param attrs List of attributes that should be observed for changes.
     * @param type Ember class for the synchronized object. Defaults
     * to DM.Object
     */
    linkObject: function(emObject, racerPath, racerModel, attrs, type) {
        type = type || DM.Object;
        type = (typeof type == 'string' ? eval(type) : type);
        emObject = type.create(racerModel.get(racerPath));
        racerModel.on('set', racerPath, function(obj, out, isLocal, passed) {
            if (passed == 'ignore') return;
            emObject.setProperties(obj);
        });

        for (var i = attrs.length - 1; i >= 0; i--) {
            emObject.addObserver(attrs[i], null, function(sender, key, value, rev) {
                var obj = emObject.getJSON();
                obj[key] = value;
                racerModel.pass('ignore').set(racerPath, obj);
            });
        }
    }
}

/**
 * Class DM.Object
 * Subclass Ember.Object so we can keep track of an object's properties
 * Overridden methods: create, set, setProperties, toggleProperty, incrementProperty,
 *                      reopen
 * Created methods: attributes, getJSON
 *
 * assertion failed: Reopening already instantiated classes is not supported. 
 * We plan to support this in the future.
 */
DM.Object = Ember.Object.extend({
    _attributes: {},

    set: function(key, value) {
        var result = this._super(key, value);
        this._attributes[key] = true;
        return result;
    },
    
    setProperties: function(hash, silent) {
        var result = this._super(hash);
        for (var k in hash) {
            this._attributes[k] = true;
        }
        return result;
    },
    
    toggleProperty: function(key) {
        var result = this._super(key);
        this._attributes[key] = true;
        return result;
    },
    
    incrementProperty: function(key, incr) {
        var result = this._super(key, incr);
        this._attributes[key] = true;
        return result;
    },

    attributes: function() {
        var res = [];
        for (var k in this._attributes) {
            res.push(k);
        }
        return res;
    },

    getJSON: function() {
        return this.getProperties.apply(this, this.attributes());
    },
    
    reopen: function() {
        for (var k = arguments.length - 1; k >= 0; k--) {
            for (var k2 in arguments[k]) {
                if (!(arguments[k][k2] instanceof Ember.ComputedProperty)) {
                    this._attributes[k2] = true;
                }
            }
        }
        return this._super.apply(this, arguments);
    }
});

DM.Object.reopenClass({
    create: function() {
        var _attributes = {};
        for (var k = arguments.length - 1; k >= 0; k--) {
            for (var k2 in arguments[k]) {
                if (!(arguments[k][k2] instanceof Ember.ComputedProperty)) {
                    // We emulate a basic set using JS Hash's keys
                    _attributes[k2] = true;
                }
            }
        }
        var result = this._super.apply(this, arguments);
        result._attributes = _attributes;
        return result;
    }
});
/**
 * Modify Ember.Enumerable to add an update() method that allows to make changes to
 * one item in the Enumerable and notify the change to observers.
 */
Ember.Enumerable.reopen({
    update: function(obj, f) {
        if (typeof obj !== "object") {
            obj = this.findProperty('_id', obj);
        }
        if (!obj) {
            return;
        }

        this.enumerableContentWillChange([obj], [obj]);
        if (typeof f === "function") {
            f(obj);
        } else {
            throw "Second parameter of update must be a function";
        }
        this.enumerableContentDidChange(-1, [obj], [obj]);
    }
});

/**
 * Overriding addObject and removeObject in Ember.MutableArray to add a
 * "silent" param. If silent evaluates to true, observers will not be 
 * notified of the change.
 * /!\ If you are using a custom Enumerable class, addObject and removeObject
 * should replicate this behavior.
 */
Ember.MutableArray.reopen({
    removeObject: function(obj, silent) {
        var doNothing = function() {},
            will = this.enumerableContentWillChange,
            did = this.enumerableContentDidChange;
        if (silent) {
            this.enumerableContentWillChange = doNothing;
            this.enumerableContentDidChange = doNothing;
        }
        this._super(obj);

        this.enumerableContentWillChange = will;
        this.enumerableContentDidChange = did;
    },
    
    addObject: function(obj, silent) {
        var doNothing = function() {},
            will = this.enumerableContentWillChange,
            did = this.enumerableContentDidChange;
        if (silent) {
            this.enumerableContentWillChange = doNothing;
            this.enumerableContentDidChange = doNothing;
        }
        this._super(obj);

        this.enumerableContentWillChange = will;
        this.enumerableContentDidChange = did;
    }
});

var ArrayAugmentMixin = Ember.Mixin.create({
    update: function(obj, f) {
        if (typeof obj !== "object") {
            obj = this.findProperty('_id', obj);
        }
        if (!obj) {
            return;
        }

        this.enumerableContentWillChange([obj], [obj]);
        if (typeof f === "function") {
            f(obj);
        } else {
            throw "Second parameter of update must be a function";
        }
        this.enumerableContentDidChange(-1, [obj], [obj]);
    },

    removeObject: function(obj, silent) {
        var doNothing = function() {},
            will = this.enumerableContentWillChange,
            did = this.enumerableContentDidChange;
        if (silent) {
            this.enumerableContentWillChange = doNothing;
            this.enumerableContentDidChange = doNothing;
        }
        this._super(obj);

        this.enumerableContentWillChange = will;
        this.enumerableContentDidChange = did;
    },
    
    addObject: function(obj, silent) {
        var doNothing = function() {},
            will = this.enumerableContentWillChange,
            did = this.enumerableContentDidChange;
        if (silent) {
            this.enumerableContentWillChange = doNothing;
            this.enumerableContentDidChange = doNothing;
        }
        this._super(obj);

        this.enumerableContentWillChange = will;
        this.enumerableContentDidChange = did;
    }
});

ArrayAugmentMixin.apply(Array.prototype);
