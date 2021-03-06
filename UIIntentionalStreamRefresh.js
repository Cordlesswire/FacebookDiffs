if (window.CavalryLogger) {
    CavalryLogger.start_js([ "qNptX" ]);
}

var Live = {
    logAll: false,
    startup: function() {
        Live.startup = bagofholding;
        Arbiter.subscribe(PresenceMessage.getArbiterMessageType("live"), Live.handleMessage.bind(Live));
    },
    lookupLiveNode: function(b, a) {
        var c = DOM.scry(document.body, ".live_" + b + "_" + a);
        c.forEach(function(e) {
            if (DataStore.get(e, "seqnum") === undefined) {
                var d = JSON.parse(e.getAttribute("data-live"));
                DataStore.set(e, "seqnum", d.seq);
            }
        });
        return c;
    },
    handleMessage: function(f, b) {
        var d = b.obj;
        var c = d.fbid;
        var a = d.assoc;
        var e = this.lookupLiveNode(c, a);
        if (!e) return false;
        e.forEach(function(l) {
            var k = {
                getRelativeTo: function() {
                    return l;
                }
            };
            if (d.expseq) {
                var i = DataStore.get(l, "seqnum");
                var g = DataStore.get(l, "message_buffer");
                if (g === undefined) {
                    g = {};
                    DataStore.set(l, "message_buffer", g);
                }
                var h = {
                    obj: d
                };
                g[d.expseq] = h;
                if (d.expseq != i) {
                    Live.log("mismatch", d.fbid, d.expseq, i);
                    return false;
                }
                while (true) {
                    i = DataStore.get(l, "seqnum");
                    var j = g[i];
                    if (j) {
                        Live._applyUpdates(j.obj.updates, k);
                        Live.log("seqmatch", d.fbid, "exp", d.expseq, "cur", i);
                        delete g[i];
                    } else break;
                }
            } else Live._applyUpdates(d.updates, k);
        });
    },
    _applyUpdates: function(c, b) {
        try {
            $A(c).each(function(d) {
                (new Function(d)).apply(b);
            });
        } catch (a) {}
    },
    log: function() {
        if (Live.logAll) {
            var a = $A(arguments).join(":");
            (new AsyncSignal("/common/scribe_endpoint.php", {
                c: "live_sequence",
                m: a
            })).send();
        }
    }
};

var LiveTimer = {
    restart: function(a) {
        this.serverTime = a;
        this.localStartTime = (new Date).getTime() / 1e3;
        this.updateTimeStamps();
    },
    updateTimeStamps: function() {
        LiveTimer.timestamps = DOM.scry(document.body, "abbr.livetimestamp");
        LiveTimer.startLoop(2e4);
    },
    addTimeStamps: function(a) {
        if (!a || !LiveTimer.timestamps) return;
        var c = DOM.scry(a, "abbr.livetimestamp");
        for (var b = 0; b < c.length; ++b) LiveTimer.timestamps.push(c[b]);
        LiveTimer.startLoop(0);
    },
    startLoop: function(a) {
        this.stop();
        this.timeout = setTimeout(function() {
            LiveTimer.loop();
        }, a);
    },
    stop: function() {
        clearTimeout(this.timeout);
    },
    updateNode: function(a, b) {
        LiveTimer.updateNode = ua.ie() < 7 ? function(c, d) {
            c.nextSibling.nodeValue = d;
        } : function(c, d) {
            c.firstChild.nodeValue = d;
        };
        LiveTimer.updateNode(a, b);
    },
    loop: function(d) {
        if (d) LiveTimer.updateTimeStamps();
        var c = Math.floor((new Date).getTime() / 1e3 - LiveTimer.localStartTime);
        var a = -1;
        LiveTimer.timestamps && LiveTimer.timestamps.each(function(g) {
            var f = +(new Date(g.getAttribute("data-date"))) / 1e3;
            var e = LiveTimer.renderRelativeTime(LiveTimer.serverTime + c, f);
            if (e.text) LiveTimer.updateNode(g, e.text);
            if (e.next != -1 && (e.next < a || a == -1)) a = e.next;
        });
        if (a != -1) {
            var b = Math.max(2e4, a * 1e3);
            LiveTimer.timeout = setTimeout(function() {
                LiveTimer.loop();
            }, b);
        }
    },
    renderRelativeTime: function(c, d) {
        var e = {
            text: "",
            next: -1
        };
        if (c - d > 12 * 3600 || (new Date(c * 1e3)).getDay() != (new Date(d * 1e3)).getDay()) return e;
        var f = c - d, b = Math.floor(f / 60), a = Math.floor(b / 60);
        if (b < 1) {
            e.text = _tx("il y a quelques secondes");
            e.next = 60 - f % 60;
            return e;
        }
        if (a < 1) {
            if (b == 1) {
                e.text = _tx("il y a environ une minute");
            } else e.text = _tx("Il y a {number} minutes", {
                number: b
            });
            e.next = 60 - f % 60;
            return e;
        }
        if (a != 11) e.next = 3600 - f % 3600;
        if (a == 1) {
            e.text = _tx("Il y a environ une heure");
            return e;
        }
        e.text = _tx("Il y a {number} heures", {
            number: a
        });
        return e;
    }
};

function UIIntentionalStreamRefresh(a, b) {
    copy_properties(this, {
        isAutoRefreshing: false,
        lastRefresh: (new Date).getTime()
    });
    UIIntentionalStreamRefresh.instance = this;
    this.setAutoRefreshConfig(a);
    this.updateConfigHandler = Arbiter.subscribe(UIIntentionalStreamMessage.UPDATE_AUTOREFRESH_CONFIG, this.updateAutoRefreshConfig.bind(this));
    this.updateRefreshTimeHandler = Arbiter.subscribe(UIIntentionalStreamMessage.UPDATE_LAST_REFRESH_TIME, this.updateLastRefreshTime.bind(this));
    onleaveRegister(this.unload.bind(this));
    this.userActivity();
    this.uaToken = UserActivity.subscribe(this.userActivity.bind(this));
    this.autoRefreshInterval = setInterval(this.checkAutoPageRefresh.bind(this), this.checkAutoRefreshTimeInterval);
    this.activeRefreshInterval = setInterval(this.checkActiveRefresh.bind(this), this.checkActiveRefreshTimeInterval);
    this.enableAutoRefresh(b);
    Arbiter.subscribe(UIIntentionalStreamMessage.UPDATE_STREAM, LiveTimer.loop.bind(LiveTimer, true));
    Arbiter.subscribe(UIIntentionalStreamMessage.REFRESH_STREAM, LiveTimer.loop.bind(LiveTimer, true));
    if (this.usePresence) UIIntentionalStreamRefresh.presenceRegister();
}

copy_properties(UIIntentionalStreamRefresh, {
    _presenceInit: false,
    DISABLE_AUTOREFRESH_TIME: 4 * 60 * 1e3,
    CHECK_AUTOREFRESH_INTERVAL: 5 * 60 * 1e3,
    AUTOREFRESH_INACTIVE_TIME: 30 * 60 * 1e3,
    HIGHLIGHTS_OVERRIDE_TIME: 360 * 60 * 1e3,
    CHECK_ACTIVE_REFRESH_TIME: 5 * 60 * 1e3,
    ACTIVE_REFRESH_TIME: 30 * 1e3
});

UIIntentionalStreamRefresh.presenceRegister = function() {
    if (UIIntentionalStreamRefresh._presenceInit) return true;
    Arbiter.subscribe(PresenceMessage.getArbiterMessageType("feedpub"), UIIntentionalStreamRefresh.handleNewStoryMessage);
    UIIntentionalStreamRefresh._presenceInit = true;
};

UIIntentionalStreamRefresh.prototype.updateAutoRefreshConfig = function(b, a) {
    if (b == UIIntentionalStreamMessage.UPDATE_AUTOREFRESH_CONFIG) this.setAutoRefreshConfig(a);
};

UIIntentionalStreamRefresh.prototype.updateLastRefreshTime = function(a) {
    if (a == UIIntentionalStreamMessage.UPDATE_LAST_REFRESH_TIME) this.lastRefresh = (new Date).getTime();
};

UIIntentionalStreamRefresh.prototype.setAutoRefreshConfig = function(a) {
    a = a || {};
    var b = 24 * 60 * 60 * 1e3;
    if (!this.storyInterval) this.storyInterval = coalesce(a.story_interval, null);
    this.allowAutoRefresh = coalesce(a.allow_auto_refresh, false);
    this.inactiveThreshold = coalesce(a.inactive_threshold, 0);
    this.activeRefreshTime = coalesce(a.fast_refresh_rate, b);
    this.inactiveRefreshTime = coalesce(a.slow_refresh_rate, b);
    this.allowPolling = coalesce(a.allow_polling, false);
    this.refreshFactor = coalesce(a.refresh_factor, 10);
    this.minRefreshInterval = coalesce(a.min_refresh_interval, 60 * 1e3);
    this.usePresence = coalesce(a.use_presence, false);
    this.activeRefresh = coalesce(a.active_refresh, false);
    this.checkActiveRefreshTimeInterval = coalesce(a.check_active_refresh_interval, UIIntentionalStreamRefresh.CHECK_ACTIVE_REFRESH_TIME);
    this.activeRefreshTimeInterval = coalesce(a.active_refresh_interval, UIIntentionalStreamRefresh.ACTIVE_REFRESH_TIME);
    this.disableAutoRefreshTime = coalesce(a.disable_autorefresh_time, UIIntentionalStreamRefresh.DISABLE_AUTOREFRESH_TIME);
    this.checkAutoRefreshTimeInterval = coalesce(a.check_autorefresh_time_interval, UIIntentionalStreamRefresh.CHECK_AUTOREFRESH_INTERVAL);
    this.autoRefreshInactiveTime = coalesce(a.autorefresh_inactive_time, UIIntentionalStreamRefresh.AUTOREFRESH_INACTIVE_TIME);
    this.highlightsOverrideTime = coalesce(a.highlights_override_time, UIIntentionalStreamRefresh.HIGHLIGHTS_OVERRIDE_TIME);
    return this;
};

UIIntentionalStreamRefresh.prototype.unload = function() {
    this.enableAutoRefresh(false);
    this.cleanupRefreshInterval();
    UserActivity.unsubscribe(this.uaToken);
    this.updateConfigHandler && Arbiter.unsubscribe(this.updateConfigHandler);
    this.updateRefreshTimeHandler && Arbiter.unsubscribe(this.updateRefreshTimeHandler);
};

UIIntentionalStreamRefresh.prototype.userActivity = function() {
    var a = this.isInactive();
    this.lastActivity = (new Date).getTime();
    this.isAutoRefreshing = true;
    if (a && this.canAutoRefresh()) this.runAutoRefresh();
    return true;
};

UIIntentionalStreamRefresh.prototype.isInactive = function() {
    return this.getMSSinceLastActivity() > this.inactiveThreshold;
};

UIIntentionalStreamRefresh.prototype.getMSSinceLastActivity = function() {
    return (new Date).getTime() - this.lastActivity;
};

UIIntentionalStreamRefresh.prototype.getMSSinceLastRefresh = function() {
    return (new Date).getTime() - this.lastRefresh;
};

UIIntentionalStreamRefresh.prototype.getRefreshInterval = function() {
    if (this.isInactive()) {
        return this.inactiveRefreshTime;
    } else if (this.storyInterval != null) {
        var a = this.storyInterval * this.refreshFactor;
        return Math.max(a, this.activeRefreshTime);
    } else return this.activeRefreshTime;
};

UIIntentionalStreamRefresh.prototype.canAutoRefresh = function() {
    return this.isAutoRefreshing && this.allowAutoRefresh;
};

UIIntentionalStreamRefresh.handleNewStoryMessage = function(b, a) {
    if (b != PresenceMessage.getArbiterMessageType("feedpub")) return;
    Arbiter.inform(UIIntentionalStreamMessage.UPDATE_STREAM);
};

UIIntentionalStreamRefresh.prototype.cancelUpdate = function() {
    if (this.updateTask) {
        clearTimeout(this.updateTask);
        this.updateTask = null;
    }
};

UIIntentionalStreamRefresh.prototype.runUpdatePoll = function() {
    this.updateTask = null;
    if (this.canAutoRefresh()) this.runAutoRefresh();
};

UIIntentionalStreamRefresh.prototype.runAutoRefresh = function() {
    var a = 50;
    if (this.getMSSinceLastRefresh() >= this.minRefreshInterval - a) Arbiter.inform(UIIntentionalStreamMessage.UPDATE_STREAM);
    this.schedulePoll(this.getRefreshInterval());
};

UIIntentionalStreamRefresh.prototype.schedulePoll = function(a) {
    this.cancelUpdate();
    if (this.allowPolling) this.updateTask = setTimeout(this.runUpdatePoll.bind(this), a);
};

UIIntentionalStreamRefresh.prototype.enableAutoRefresh = function(b, c) {
    this.isAutoRefreshing = b;
    if (b) {
        var a = c ? 0 : this.getRefreshInterval();
        this.schedulePoll(a);
    } else this.cancelUpdate();
};

UIIntentionalStreamRefresh.prototype.checkAutoPageRefresh = function() {
    if (!this.allowAutoRefresh) return;
    if (this.isAutoRefreshing && this.getMSSinceLastActivity() > this.disableAutoRefreshTime) this.isAutoRefreshing = false;
    if (this.getMSSinceLastRefresh() < this.autoRefreshInactiveTime) return;
    var a = this.getMSSinceLastActivity();
    if (a > this.autoRefreshInactiveTime) {
        var b = a > this.highlightsOverrideTime;
        Arbiter.inform(UIIntentionalStreamMessage.REFRESH_STREAM, {
            shouldOverride: b
        });
    }
};

UIIntentionalStreamRefresh.prototype.checkActiveRefresh = function() {
    if (!this.allowAutoRefresh) return;
    if (this.getMSSinceLastRefresh() < this.activeRefreshTimeInterval) return;
    if (this.getMSSinceLastActivity() < this.activeRefreshTimeInterval) Arbiter.inform(UIIntentionalStreamMessage.UPDATE_STREAM);
};

UIIntentionalStreamRefresh.prototype.cleanupRefreshInterval = function() {
    if (this.autoRefreshInterval) {
        clearInterval(this.autoRefreshInterval);
        this.autoRefreshInterval = null;
    }
};

function tz_calculate(f) {
    var a = new Date;
    var b = a.getTimezoneOffset() / 30;
    var e = a.getTime() / 1e3;
    var d = Math.round((f - e) / 1800);
    var c = Math.round(b + d) % 48;
    if (c == 0) {
        return 0;
    } else if (c > 24) {
        c -= Math.ceil(c / 48) * 48;
    } else if (c < -28) c += Math.ceil(c / -48) * 48;
    return c * 30;
}

function tz_autoset(d, c) {
    if (!d || undefined == c) return;
    if (window.tz_autoset.calculated) return;
    window.tz_autoset.calculated = true;
    var b = -tz_calculate(d);
    if (b != c) {
        var a = "/ajax/autoset_timezone_ajax.php";
        (new AsyncRequest).setURI(a).setData({
            gmt_off: b
        }).setErrorHandler(bagofholding).setTransportErrorHandler(bagofholding).setOption("suppressErrorAlerts", true).send();
    }
}

function ufi_add_ft_hidden_node(c) {
    if (c.link_data) return;
    var a = collect_data_attrib(c, "ft");
    if (count(a)) {
        var b = $N("input", {
            type: "hidden",
            name: "link_data",
            value: JSON.stringify(a)
        });
        c.appendChild(b);
    }
}

function ufi_add_all_link_data() {
    Bootloader.loadComponents("dom-collect", function() {
        DOM.scry(document.body, "form.commentable_item").forEach(ufi_add_ft_hidden_node);
    });
}