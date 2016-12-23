const St = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Soup = imports.gi.Soup;

const ALISchemaIndicator = Lang.Class({
    Name: 'SchemaIndicator',
    Extends: PanelMenu.Button,

    destroy: function() {
        this.parent();
    },

    _init: function() {
        this.parent(0.0, 'SchemaIndicator', false);

        let hbox = new St.BoxLayout({
            style_class: 'panel-status-menu-box'
        });

        this.icon = new St.Icon({
            icon_name: 'today',
            style_class: 'system-status-icon'
        });
        hbox.add_child(this.icon);
        this.actor.add_actor(hbox);

        this.actor.connect ("button-press-event", Lang.bind(this, this._clickHandler));

        this._initMenu();
        this._loadSchool();
    },

    _initMenu: function() {
        this.loading = new PopupMenu.PopupMenuItem("Loading..");
        this.menu.addMenuItem(this.loading);
    },

    _loadSchool: function() {

        let week = this.getWeekNumber();
        let day = this.getDay();

        let url = "https://jobb.matstoms.se/ali/api/getjson.php?week="+String(week)+"&scid=89920&clid=na15c&getweek=0&day="+String(day);

        let request = Soup.Message.new('GET', url);
        let session = new Soup.SessionAsync();
        session.queue_message(request, Lang.bind(this, function(session, response) {
            if (response) {
                if (response.status_code == 200) {

                    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

                    this.menu.removeAll();
                    this.menu.addMenuItem(new PopupMenu.PopupMenuItem(days[day]));
                    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

                    content = JSON.parse(response.response_body.data);
                    lessons = content.lessons;

                    for (var i = 0; i != lessons.length; i++) {
                        this.menu.addMenuItem(new PopupMenu.PopupMenuItem(lessons[i].start + " - " + lessons[i].end + " : " + lessons[i].info));
                    }
                }
            }
        }));
    },

    _clickHandler: function() {
        this.menu.removeAll();
        this._initMenu();
        this._loadSchool();
    },

    getWeekNumber: function() {

        let d = new Date();
        d.setHours(0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        var yearStart = new Date(d.getFullYear(), 0, 1);
        var weekNo = (Math.ceil((((d - yearStart) / 86400000) + 1) / 7))-1;

        return weekNo;
    },

    getDay: function() {

        let d = new Date();
        return d.getDay();
    }
})

let schema, button;

function init(extensionMeta) {

    let theme = imports.gi.Gtk.IconTheme.get_default();
    theme.append_search_path(extensionMeta.path + "/icons");
}

function enable() {
    schema = new ALISchemaIndicator;
    Main.panel.addToStatusArea("ali-schema", schema);
}

function disable() {
    schema.destroy();
}
