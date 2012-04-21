var AddressBook = Ember.Application.create();

Ember.Handlebars.registerHelper('delButton', function(id) {
    id = Ember.getPath(this, id);
    return new Ember.Handlebars.SafeString('<a href="#" onclick="del(' + id + 
        ')" class="btn btn-danger" id="del' + id + '"><i class="icon-remove icon-white"></i> Delete</a>');
});

Ember.Handlebars.registerHelper('editButton', function(id) {
    id = Ember.getPath(this, id);
    return new Ember.Handlebars.SafeString('<a href="#" onclick="edit(' + id + 
        ')" class="btn btn-primary" id="ed' + id + '"><i class="icon-arrow-right icon-white"></i> Edit</a>');
});

AddressBook.contacts = [];

AddressBook.Contact = DM.Object.extend({
    nicedate: function() {
        var d = this.get('birthdate');
        if (!(d instanceof Date)) {
            d = new Date(d);
            this.set('birthdate', d);
        }
        return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
    }.property('birthdate'),
    
    mailto: function() {
        return 'mailto:' + this.get('email');
    }.property('email'),
    
    twitUrl: function() {
        return 'https://twitter.com/#!/' + this.get('twitter');
    }.property('twitter'),

    age: function() {
        var d = this.get('birthdate');
        if (!(d instanceof Date)) {
            d = new Date(d);
            this.set('birthdate', d);
        }
        var now = new Date();
        var age = now.getFullYear() - d.getFullYear();
        return (d.getMonth() < now.getMonth()) ? age : (d.getMonth() > now.getMonth() ?
            age - 1 : age - (d.getDate() > now.getDate()));
    }.property('birthdate'),
});

AddressBook.Contact.reopenClass({
    create: function(o) {
        o.birthdate = new Date(o.birthdate);
        return this._super(o);
    }
});

AddressBook.contactView = Ember.View.create({
    contacts: AddressBook.contacts,
    templateName: 'contact-display'
});

$(window).ready(function() {
    AddressBook.contactView.appendTo('#clist');
    $('#new').submit(function() {
        var birth = new Date($('#byear').val(), $('#bmonth').val() - 1, $('#bday').val());
        var contact = {
            firstName: $('#fname').val(),
            lastName: $('#lname').val(),
            twitter: $('#twit').val(),
            email: $('#mail').val(),
            birthdate: birth,
            phone: {
                homePhone: $('#hphone').val(),
                workPhone: $('#wphone').val(),
                mobilePhone: $('#mphone').val()        
            }
        };
        AddressBook.contacts.addObject(AddressBook.Contact.create(contact));
        return false;
    });
    
    $('#updateButton').click(function() {
        var birth = new Date($('#byear').val(), $('#bmonth').val() - 1, $('#bday').val());
        var id = parseInt($('#cid').val());
        var contact = {
            _clientId: id,
            firstName: $('#fname').val(),
            lastName: $('#lname').val(),
            twitter: $('#twit').val(),
            email: $('#mail').val(),
            birthdate: birth,
            phone: {
                homePhone: $('#hphone').val(),
                workPhone: $('#wphone').val(),
                mobilePhone: $('#mphone').val()        
            }
        };
        AddressBook.contacts.update(id, function(obj) {
            for (var k in contact) {
                obj.set(k, contact[k]);
            }
        });
        return false;
    });
});

$(racer.ready(function(model) {
    console.log('Racer ready received');
    DM.linkCollection(AddressBook.contacts, 'contacts', model, AddressBook.Contact);
}));

function del(id) {
    id = (typeof id == 'string') ? parseInt(id) : id;
    var obj = AddressBook.contacts.findProperty('_clientId', id);
    AddressBook.contacts.removeObject(obj);
    return false;
}

function edit(id) {
    id = (typeof id == 'string') ? parseInt(id) : id;
    var obj = AddressBook.contacts.findProperty('_clientId', id);
    $('#cid').val(id);
    $('#fname').val(obj.get('firstName'));
    $('#lname').val(obj.get('lastName'));
    $('#byear').val(obj.get('birthdate').getFullYear());
    $('#bmonth').val(obj.get('birthdate').getMonth() + 1);
    $('#bday').val(obj.get('birthdate').getDate());
    $('#twit').val(obj.get('twitter'));
    $('#mail').val(obj.get('email'));
    $('#hphone').val(obj.getPath('phone.homePhone'));
    $('#mphone').val(obj.getPath('phone.mobilePhone'));
    $('#wphone').val(obj.getPath('phone.workPhone'));
    return false;
}

(function() {
  racer.init(this.init);
  delete this.init;
})();
