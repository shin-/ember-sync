Datamapper
==========

Mapping Ember.js objects to a Racer model. Modifications are handled back and forth once 
the bindings are declared.

Racer: https://github.com/codeparty/racer

Ember: https://github.com/emberjs/ember.js

Two main methods:

### DM.linkCollection
Map an Ember collection (array or custom class) to a racer path.

`DM.linkCollection(emColl, racerPath, racerModel, [type])`

* emColl Ember collection that should be synchronized
* racerPath Racer path that directs to the collection that should be mapped
* racerModel racer.model object
* type Ember class for the objects represented in the collection. Defaults to DM.Object

### DM.linkObject
Map a single Ember object to a Racer path.

`DM.linkObject(emObject, racerPath, racerModel, attrs, type)`

* emObject Address to the Ember object that should be synchronized
* racerPath Racer path that directs to the object that should be mapped
* racerModel racer.model object
* attrs List of attributes that should be observed for changes.
* type Ember class for the synchronized object. Defaults to DM.Object.


Your model classes are required to extend DM.Object instead of Ember.Object.

Collections can be represented using the Ember Array. If you're using a custom collection type, make sure it implements Ember.MutableEnumerable and that addObject and removeObject have a "silent" param. If silent evaluates to true, observers should not be notified of the change.
