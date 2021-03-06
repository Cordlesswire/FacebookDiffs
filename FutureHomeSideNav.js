if (window.CavalryLogger) {
    CavalryLogger.start_js([ "gnJN7" ]);
}

var ConnectDialog = {
    newInstance: function(i, o, f, e, g, a, k, l, j, n, h) {
        var b = new Dialog;
        var m = (new AsyncRequest).setURI("/ajax/profile/connect.php").setData({
            dialog: 1,
            profile_id: i,
            source: o,
            pymk_score: k,
            pymk_source: l,
            pymk_page: j,
            show_confirmation_optout: n,
            precheck_confirmation_optout: h
        }).setFinallyHandler(function() {
            var p = b.getButtonElement("connect");
            if (p) p.focus();
        });
        for (var d in a) m.setContextData(d, a[d]);
        b.setAsync(m);
        var c = {
            ondone_func: f,
            ondone_data: e,
            ondone_reload: g,
            pymk_score: k,
            pymk_source: l,
            pymk_page: j
        };
        ConnectDialog.prepare(b, c);
        return b;
    },
    prepare: function(a, b) {
        copy_properties(a, b || {});
        a.setCloseHandler(ConnectDialog.deleteInstance);
        ConnectDialog.setInstance(a);
    },
    deleteInstance: function() {
        delete ConnectDialog.instance;
    },
    setInstance: function(a) {
        ConnectDialog.instance = a;
    },
    getInstance: function() {
        return ConnectDialog.instance;
    }
};

var NewHigh = {
    reset: function() {
        this.initialized = false;
    },
    ensureInitialized: function() {
        if (this.initialized) return;
        this.button = DOM.scry(document.body, "a.stream_header_button")[0];
        this.composer = DOM.scry(document.body, "div.UIComposer")[0];
        this.buttonArea = DOM.scry(this.composer, "div.UIComposer_ButtonArea")[0];
        this.initialized = true;
    },
    showComposer: function(a) {
        this.ensureInitialized();
        if (this.composer) {
            CSS.show(this.composer);
            UIComposer.focusInstance(this.composer.id);
            var b = UIComposer.getInstance(this.composer.id);
            b && b.loadAttachment(parseInt(a, 10));
        }
        this.button && CSS.hide(this.button);
    },
    hideComposer: function(b) {
        this.ensureInitialized();
        if (this.composer) {
            var a = UIComposer.getInstance(this.composer.id);
            if (!b) {
                a && a.initialized && a.blur();
                CSS.hide(this.composer);
                this.button && CSS.show(this.button);
            } else {
                a && a.initialized && a.loadAttachment(0);
                CSS.show(this.composer);
                this.buttonArea && CSS.hide(this.buttonArea);
            }
        }
    }
};

var Base64 = function() {
    var c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    function d(e) {
        e = e.charCodeAt(0) << 16 | e.charCodeAt(1) << 8 | e.charCodeAt(2);
        return String.fromCharCode(c.charCodeAt(e >>> 18), c.charCodeAt(e >>> 12 & 63), c.charCodeAt(e >>> 6 & 63), c.charCodeAt(e & 63));
    }
    var a = ">___?456789:;<=_______" + " \b\t\n\f\r" + "______ !\"#$%&'()*+,-./0123";
    function b(e) {
        e = a.charCodeAt(e.charCodeAt(0) - 43) << 18 | a.charCodeAt(e.charCodeAt(1) - 43) << 12 | a.charCodeAt(e.charCodeAt(2) - 43) << 6 | a.charCodeAt(e.charCodeAt(3) - 43);
        return String.fromCharCode(e >>> 16, e >>> 8 & 255, e & 255);
    }
    return {
        encode: function(f) {
            f = unescape(encodeURI(f));
            var e = (f.length + 2) % 3;
            f = (f + "  ".slice(e)).replace(/[\s\S]{3}/g, d);
            return f.slice(0, f.length + e - 2) + "==".slice(e);
        },
        decode: function(g) {
            g = g.replace(/[^A-Za-z0-9+\/]/g, "");
            var f = g.length + 3 & 3, e;
            g = (g + "AAA".slice(f)).replace(/..../g, b);
            g = g.slice(0, g.length + f - 3);
            try {
                return decodeURIComponent(escape(g));
            } catch (e) {
                throw new Error("Not valid UTF-8");
            }
        },
        encodeObject: function(e) {
            return Base64.encode(JSON.stringify(e));
        },
        decodeObject: function(e) {
            return JSON.parse(Base64.decode(e));
        },
        encodeNums: function(e) {
            return String.fromCharCode.apply(String, e.map(function(f) {
                return c.charCodeAt((f | -(f > 63)) & -(f > 0) & 63);
            }));
        }
    };
}();

function FutureHomeSideNav() {
    this.parent.construct(this);
}

Class.extend(FutureHomeSideNav, "FutureSideNav");

FutureHomeSideNav.prototype = {
    init: function() {
        this.parent.init.apply(this, arguments);
        this.ajaxPipe = true;
        this.seeAllEndpoint = "/ajax/home/generic.php";
        this.typeSections = {
            favorites: "pinnedNav",
            apps: "appsNav",
            groups: "groupsNav",
            pages: "pagesNav",
            lists: "listsNav",
            connect_apps: "connectNav"
        };
        this.switchingFromTitanFixedFrame = false;
        this._arbiterSubscriptions.push(Arbiter.subscribe("titan_fixed_frame_changed", this.handleFixedFrameChanged.bind(this)), Arbiter.subscribe(NavigationMessage.NAVIGATION_FAVORITE_UPDATE, this.updateFavorite.bind(this)), Arbiter.subscribe(NavigationMessage.NAVIGATION_FIRST_RESPONSE, this.navigationFirstResponse.bind(this)));
        this._ensureHover("homeSideNav");
    },
    initMoreLink: function(a) {
        this._eventHandlers.push(Event.listen(a, "click", this._showMoreSections.bind(this, a)));
    },
    _showMoreSections: function(b) {
        var a = DOM.scry(this.root, "div.belowThreshold");
        CSS.hide(b);
        a.forEach(function(c) {
            CSS.removeClass(c, "belowThreshold");
        });
    },
    handleFixedFrameChanged: function(c, a) {
        if (a) {
            var b = function(d, e) {
                UIPagelet.loadFromEndpoint(d, e, {
                    fixed_frame: a
                });
            };
            b("PinnedNavigationPagelet", "pagelet_pinned_nav");
            b("BookmarkNavigationPagelet", "pagelet_bookmark_nav");
        } else this.switchingFromTitanFixedFrame = true;
    },
    handlePageTransition: function(a) {
        if (this.switchingFromTitanFixedFrame) {
            this.switchingFromTitanFixedFrame = false;
            return false;
        } else return this.parent.handlePageTransition(a);
    },
    _initSection: function(a) {
        var d = this.parent._initSection(a);
        for (var e in this.typeSections) {
            var c = this.typeSections[e];
            if (d.id == c) {
                var b = DOM.scry(d.node, "div.navHeader")[0];
                if (b) {
                    var f = "/bookmarks/(" + e + ")(/)?";
                    d.seeall = this._initItem({
                        node: b,
                        id: d.id,
                        endpoint: this.seeAllEndpoint,
                        key: [ "bookmarks" ],
                        path: [ {
                            regex: f
                        } ]
                    });
                }
            }
        }
        return d;
    },
    _constructItem: function(a, b) {
        return new FutureHomeSideNavItem(a, b);
    },
    _constructSection: function(a) {
        return new FutureHomeSideNavSection(a);
    },
    getSection: function(a) {
        return this.typeSections[a] && this.sections[this.typeSections[a]];
    },
    _getItemForKey: function(a) {
        var b = this.parent._getItemForKey("nf");
        if (b && b.matchKey(a)) {
            return b;
        } else return this.parent._getItemForKey(a);
    },
    _isCurrentPath: function(a) {
        return a.getDomain() === this.uri.getDomain() && (a.getPath() === "/" || a.getPath() === "/home.php");
    },
    _handleMenuClick: function(c, a, b, event) {
        if (CSS.hasClass(b, "favorite")) {
            Arbiter.inform(NavigationMessage.NAVIGATION_FAVORITE_UPDATE, {
                key: a.numericKey,
                favorite: !c.equals(this.getSection("favorites"))
            });
        } else this.parent._handleMenuClick(c, a, b, event);
    },
    removeItemByKey: function(a) {
        Arbiter.inform(NavigationMessage.NAVIGATION_ITEM_REMOVED, a);
        this.parent.removeItemByKey(a);
    },
    toggleItemByKey: function(b, d) {
        var c = this.getNodeForKey(b);
        if (!d) {
            Arbiter.inform(NavigationMessage.NAVIGATION_ITEM_HIDDEN, b);
            c && CSS.hide(c);
            var a = this._getItemForKey(b);
            this.getSection(a.type).refresh();
        } else c && CSS.show(c);
    },
    removeItem: function(a) {
        var b = this.getSection(a.type);
        this.parent.removeItem(a);
        b.refresh();
    },
    updateFavorite: function(g, b) {
        var f = this._findItem(function(h) {
            return h.matchKey(b.key) && h.canFavorite();
        });
        var d = this.getSection("favorites");
        var a = bagofholding;
        var c = b.favorite ? d.addEndpoint : d.removeEndpoint;
        if (!f) {
            if (b.favorite) {
                a = function() {
                    UIPagelet.loadFromEndpoint("PinnedNavigationPagelet", "pagelet_pinned_nav");
                };
            } else a = function() {
                UIPagelet.loadFromEndpoint("BookmarkNavigationPagelet", "pagelet_bookmark_nav");
            };
        } else {
            var e = this.getSection(f.type);
            if (b.favorite) {
                CSS.show(f.node);
                this.moveItem(d, f);
                f.showFavorite();
            } else {
                this.moveItem(e, f);
                f.hideFavorite();
            }
            e.refresh();
            d.refresh();
            b.key = f.numericKey;
        }
        (new AsyncRequest).setURI(c).setData({
            id: b.key
        }).setHandler(a).send();
    },
    _doPageTransition: function(a, c) {
        this._unloadStreams();
        var b = this.parent._doPageTransition(a, c);
        if (b && (a.type == "groups" || a.type == "lists")) a.setCount(0);
        return b;
    },
    _unloadStreams: function() {
        var a = UIIntentionalStream && UIIntentionalStream.instances;
        var b = [ "nile", "global", "friends", "blade" ];
        a && b.forEach(function(c) {
            a[c] && a[c].unload();
        });
    },
    navigationFirstResponse: function() {
        this.setSelected(this.loading);
    }
};

function FutureHomeSideNavSection(a) {
    this.parent.construct(this, a);
    this.editEndpoint = "/ajax/bookmark/edit/";
    this.addEndpoint = "/ajax/bookmark/add/";
    this.removeEndpoint = "/ajax/bookmark/delete/";
}

Class.extend(FutureHomeSideNavSection, "FutureSideNavSection");

FutureHomeSideNavSection.prototype = {
    refresh: function() {
        var b = DOM.scry(this.node, "li.sideNavItem");
        var a = DOM.scry(this.node, "div.actionLinks");
        var c = b.length && !CSS.hasClass(b[0], "hidden_elem");
        CSS.conditionShow(DOM.find(this.node, "div.navHeader"), c);
        a.length && CSS.conditionShow(a[0], c);
    }
};

function FutureHomeSideNavItem(a, b) {
    this.parent.construct(this, a, b);
}

Class.extend(FutureHomeSideNavItem, "FutureSideNavItem");

FutureHomeSideNavItem.prototype = {
    canFavorite: function() {
        return !!this._getFavoriteLabel();
    },
    showFavorite: function() {
        DOM.setContent(this._getFavoriteLabel(), _tx("Retirer des favoris"));
    },
    hideFavorite: function() {
        DOM.setContent(this._getFavoriteLabel(), _tx("Ajouter aux favoris"));
    },
    _getFavoriteLabel: function() {
        return DOM.scry(this.node, "li.favorite span.itemLabel")[0];
    }
};

var HomeNavController = {
    init: function() {
        Arbiter.subscribe(PresenceMessage.getArbiterMessageType("nav_update_counts"), this._updateCounts.bind(this));
    },
    updateCounts: function(b) {
        for (var a = 0; a < b.length; a++) Arbiter.inform(NavigationMessage.NAVIGATION_COUNT_UPDATE, b[a]);
    },
    expandGroups: function() {
        var a = ge("groupSideNavWrapper");
        if (a) {
            CSS.addClass(a, "expandedMode");
            CSS.hide(DOM.find($("moreGroupsLink"), ".count"));
            (new AsyncRequest("/ajax/groups/navigation/more_link/more_link.php")).setMethod("post").setReadOnly(false).send();
        }
    },
    collapseGroups: function() {
        var a = ge("groupSideNavWrapper");
        if (a) CSS.removeClass(a, "expandedMode");
    },
    expandApps: function() {
        var a = ge("bookmarks_menu");
        if (a) CSS.addClass(a, "expandedMode");
    },
    collapseApps: function() {
        var a = ge("bookmarks_menu");
        if (a) CSS.removeClass(a, "expandedMode");
    },
    _lastSeenKey: null,
    resetGroupsAndApps: function(a) {
        a = a || null;
        if (!a || !a.selected_key || a.selected_key != this._lastSeenKey) {
            this.collapseGroups();
            this.collapseApps();
            if (ge("groupSideNavWrapper")) UIPagelet.loadFromEndpoint("GroupsNavigationPagelet", "pagelet_groups_nav", a);
        }
        this._lastSeenKey = a && a.selected_key ? a.selected_key : null;
    },
    addSection: function(a, c, b, d) {
        if (window.SideNav) {
            SideNav.getInstance().addEndpoints(a);
            SideNav.getInstance().updateCloseButtons(c, b);
            SideNav.getInstance().addToURLMap(d || {});
        }
    },
    _groupIDs: [],
    initGroupCounts: function(a, b) {
        this._groupIDs = a;
        if (a && a.length > 0) Arbiter.subscribe(PresenceMessage.getArbiterMessageType("group_nav_update"), this._updateGroupCounts.bind(this));
    },
    _refreshGroupCounts: function(a) {
        (new AsyncRequest).setURI("/ajax/groups/navigation/update_counts/update_counts.php").setData({
            group_ids: a,
            nav_group_ids: this._groupIDs
        }).setMethod("post").send();
    },
    _updateGroupCounts: function(event, a) {
        this._refreshGroupCounts([ a.obj.group_id ]);
    },
    _updateCounts: function(event, a) {
        this.updateCounts(a.obj.items);
    }
};

var UIIntentionalStreamMessage = {
    INITIALIZE_COMPLETE: "UIIntentionalStream/initializeComplete",
    SET_AUTO_INSERT: "UIIntentionalStream/setAutoInsert",
    UPDATE_STREAM: "UIIntentionalStreamRefresh/updateStream",
    REFRESH_STREAM: "UIIntentionalStreamRefresh/refreshStream",
    UPDATE_AUTOREFRESH_CONFIG: "UIIntentionalStream/updateAutoRefreshConfig",
    UPDATE_HTML_CONTENT: "UIIntentionalStream/updateHtmlContent",
    UPDATE_LAST_REFRESH_TIME: "UIIntentionalStream/updateLastRefreshTime",
    INSERT_STORIES: "UIIntentionalStream/updateLastRefreshTime"
};

function UIIntentionalStream(j, e, h, i, c, m, n, d, g, b, f, a, k, l) {
    if (!j) throw new Error("UIIntentionalStream instantiated with no root.");
    copy_properties(this, {
        id: j.id,
        root: j,
        instanceName: e,
        newest: h,
        oldest: i,
        oldestMR: i,
        firstLoadIDs: d,
        shouldShowHidden: false,
        defaultFilter: c,
        currentFilterKey: b,
        sourceType: m,
        streamStoryCount: n,
        maxUnseenStoryCount: g,
        lastSeenTime: f,
        hasPendingRefresh: false,
        pauseAutoInsert: false,
        unseenStoryCount: 0,
        streamHeader: ge("pagelet_stream_header"),
        error: DOM.scry(j, "div.UIIntentionalStream_Error")[0],
        pager: DOM.scry(j, "div.uiMorePager")[0],
        filterNullState: DOM.scry(j, "div.friendListFilterNullState")[0],
        streamContent: DOM.find(j, ".UIIntentionalStream_Content"),
        requestNum: 0,
        scrollLoadCount: 1,
        maxScrollLoadCount: 1,
        boulderFeed: a,
        scrollPosition: k,
        shouldRenderCount: l,
        scrollListener: null,
        conowingoCount: 0
    });
    this.setUpStreamHeader();
    if (this.streamStoryCount > 0) this.updateLiveFeedCount(this.streamStoryCount);
    onleaveRegister(this.unload.bind(this));
    if (!UIIntentionalStream.instances) UIIntentionalStream.instances = {};
    UIIntentionalStream.instances[e] = this;
    UIIntentionalStream.instance = this;
    this.setupAutoInsert();
    this.setupSubscriptions();
    this.highlightsBlockData = {};
    Arbiter.inform(UIIntentionalStreamMessage.INITIALIZE_COMPLETE, {}, Arbiter.BEHAVIOR_PERSISTENT);
}

UIIntentionalStream.prototype.subscribeToComposerPublish = function() {
    this.subscriptions.push(Arbiter.subscribe("composer/publish", function(event, a) {
        if (a.streamStory) this.addComposerContent(a.streamStory, 500);
    }.bind(this)));
};

UIIntentionalStream.prototype.setupSubscriptions = function() {
    this.subscriptions = [];
    this.subscribeToComposerPublish();
    this.subscriptions.push(Arbiter.subscribe(UIIntentionalStreamMessage.UPDATE_STREAM, this.updateStream.bind(this)));
    this.subscriptions.push(Arbiter.subscribe(UIIntentionalStreamMessage.REFRESH_STREAM, this.refreshStream.bind(this)));
    if (this.boulderFeed) {
        this.scrollListener = Event.listen(window, "scroll", this.checkScroll.bind(this));
        this.checkScroll();
    }
};

UIIntentionalStream.prototype.tearDownSubscriptions = function() {
    if (!this.subscriptions) return;
    this.subscriptions.forEach(Arbiter.unsubscribe);
    this.subscriptions = null;
    if (this.scrollListener) {
        this.scrollListener.remove();
        this.scrollListener = null;
    }
};

UIIntentionalStream.prototype.unload = function() {
    this.tearDownSubscriptions();
    UIIntentionalStream.instance = null;
    UIIntentionalStream.instances[this.instanceName] = null;
    this.clearScrollLoader(true);
    window.disableScrollLoad = null;
    UIIntentionalStreamRefresh.instance && UIIntentionalStreamRefresh.instance.unload();
};

UIIntentionalStream.getInstance = function(a) {
    return UIIntentionalStream.instances[a];
};

UIIntentionalStream.prototype._getUpdateInsertType = function() {
    if (this.isOnNewHighlights() && (!this.boulderFeed || this.shouldRenderCount)) return UIIntentionalStream.REFRESH_COUNT;
    return UIIntentionalStream.REFRESH_PREPEND;
};

UIIntentionalStream.prototype.updateStream = function(a) {
    if (a != UIIntentionalStreamMessage.UPDATE_STREAM || this.hasPendingRefresh || this.isAutoRefreshPaused()) return;
    this.loadNewer({
        showLoader: false,
        ignoreSelf: true,
        insertType: this._getUpdateInsertType()
    });
};

UIIntentionalStream.prototype.clearScrollLoader = function(a) {
    if (this.currentScrollListener) {
        this.currentScrollListener.remove();
        this.currentScrollListener = null;
    }
    if (a || this.scrollLoadCount >= this.maxScrollLoadCount) window.disableScrollLoad = true;
};

UIIntentionalStream.prototype.loadOlderPosts = function(b) {
    var a = {
        filter: this.getCurrentFilterKey(),
        oldest: this.oldest,
        oldestMR: this.oldestMR,
        last_seen_time: this.lastSeenTime,
        scroll_count: this.scrollLoadCount,
        scroll_position: this.scrollPosition,
        position_data: this.highlightsBlockData
    };
    a = merge(a, b);
    this.loadWithParams(a);
};

UIIntentionalStream.prototype.loadWithParams = function(a) {
    var b = DOM.scry(this.root, "div.fbStreamPager.hasMorePosts")[0];
    if (b) {
        if (CSS.hasClass(b, "async_saving")) return;
        CSS.addClass(b, "async_saving");
    }
    UIPagelet.loadFromEndpoint("/pagelet/home/morestories.php", "home_stream", a, {
        usePipe: true,
        replayable: true,
        append: true
    });
};

UIIntentionalStream.prototype.setScrollLoadCount = function(a) {
    this.maxScrollLoadCount = a;
};

UIIntentionalStream.prototype.loadMoreOnScroll = function(b, a, c) {
    if (window.disableScrollLoad) return;
    var e = function() {
        if (window.disableScrollLoad) return;
        if (window.ArbiterMonitor) {
            var h = user_action(null, "scroll", null, "FORCE", {
                gt: {
                    ua_id: "stream:scroll:auto"
                }
            });
            ArbiterMonitor.initUA(h);
        }
        var g = {
            delay_load_count: a
        };
        if (this.scrollLoadCount == 1 && this.firstLoadIDs && this.firstLoadIDs.length > 0) g = merge(g, {
            first_load_ids: this.firstLoadIDs,
            show_hidden: this.shouldShowHidden,
            query_time: c
        });
        this.loadOlderPosts(g);
    }.bind(this);
    var f = DOM.scry(this.root, "ul.uiStream li.genericStreamStory");
    if (!f.length) return;
    var d = f[f.length - b - 1];
    if (d) {
        this.currentScrollListener = new OnVisible(d, e, null, 0, {
            detect_speed: this.scrollLoadCount > 1
        });
    } else e();
};

UIIntentionalStream.prototype.updateTimeRange = function(a, b) {
    if (!this.newest || this.newest < a) this.newest = a;
    if (!this.oldest || b && b < this.oldest) this.oldest = b;
};

UIIntentionalStream.prototype.updateOldestMR = function(a) {
    if (!this.oldestMR || a < this.oldestMR) this.oldestMR = a;
};

UIIntentionalStream.prototype.getID = function() {
    return this.id;
};

UIIntentionalStream.prototype.showPositioned = function(a, c, b) {
    if (c == UIIntentionalStream.REFRESH_APPEND) {
        DOM.appendContent(this.root, a);
    } else if (c == UIIntentionalStream.REFRESH_PREPEND) {
        DOM.prependContent(this.root, a);
    } else if (c == UIIntentionalStream.REFRESH_EXPAND) DOM.insertAfter($(b.expandStoryID), a);
    CSS.setStyle(a, "display", "block");
    if (a.src) a.src = a.src;
};

UIIntentionalStream.prototype.getCurrentFilterKey = function() {
    if (this.currentFilterKey) return this.currentFilterKey;
    var a = this.getCurrentParams();
    if (a && a.filter) {
        this.currentFilterKey = a.filter;
    } else if (this.defaultFilter) this.currentFilterKey = this.defaultFilter;
    return this.currentFilterKey;
};

UIIntentionalStream.prototype.resetFilterKey = function(a) {
    this.currentFilterKey = a;
};

UIIntentionalStream.prototype.loadOlder = function(a) {
    a = a || {};
    if (!this.oldest) return;
    var b = this.getCurrentParams();
    b.oldest = this.oldest;
    this.refresh(UIIntentionalStream.REFRESH_APPEND, b, a);
    return this;
};

UIIntentionalStream.prototype.loadNewer = function(b) {
    if (!this.newest) return;
    b = b || {};
    var a = this.getCurrentParams();
    a.newest = this.newest;
    if (b.ignoreSelf) a.ignore_self = true;
    a.load_newer = true;
    var c = coalesce(b.insertType, UIIntentionalStream.REFRESH_PREPEND);
    this.refresh(c, a, b);
    return this;
};

UIIntentionalStream.prototype.expandRecentStories = function() {
    if (!this.shouldRenderCount) return;
    this.shouldRenderCount = false;
    var c = DOM.find($("pagelet_home_stream"), "div.fbStreamRecentStoriesContainer");
    var b = this.removeHeader();
    CSS.addClass(c.firstChild, "uiStreamFirstStory");
    DOM.prependContent(c, b);
    CSS.show(c);
    var a = this.getCurrentParams();
    a.newest = this.newest;
    a.active_mode = true;
    var d = DOM.find($("pagelet_home_stream"), "div.fbStreamRecentStoriesPager");
    if (this.conowingoCount == c.childNodes.length - 1) {
        CSS.hide(d);
        this.shiftPrefetchStories();
    } else {
        CSS.addClass(d, "async_saving");
        if (this.conowingoCount > 20) a.replace_pager = true;
    }
    this.refresh(UIIntentionalStream.REFRESH_BUBBLE, a, {});
};

UIIntentionalStream.prototype.showRecentStoriesPager = function(a) {
    animation(a).from("opacity", 0).to("opacity", 1).show().ondone(function() {
        Arbiter.inform("reflow");
    }).go();
};

UIIntentionalStream.prototype.shiftPrefetchStories = function() {
    var a = DOM.find($("pagelet_home_stream"), "div.fbStreamRecentStoriesContainer");
    DOM.prependContent(this.streamContent, $A(a.childNodes));
    Arbiter.inform("reflow");
};

UIIntentionalStream.prototype.checkScroll = function() {
    if (this.scrollListener && Vector2.getScrollPosition().y > 0) {
        var a = ge("highlight_header");
        (new AsyncSignal("ajax/feed/scroll_detect.php", {
            hasHeader: !!a
        })).send();
        this.scrollListener.remove();
        this.scrollListener = null;
    }
};

UIIntentionalStream.prototype.getCurrentParams = function() {
    var a = {};
    var b = URI.getMostRecentURI().getQueryData();
    if (b.sk) b.filter = b.sk;
    var c = this.getValidParams();
    if (c) {
        c.forEach(function(d) {
            a[d] = b[d];
        });
    } else a = b;
    return a;
};

UIIntentionalStream.prototype.setHomeFilter = function(a) {
    this._homeFilter = a;
};

UIIntentionalStream.prototype.setHomeFilterLoading = function(a) {
    if (this._homeFilter) this._homeFilter.setLoading(a);
};

UIIntentionalStream.prototype.updateBlockData = function(a) {
    this.highlightsBlockData = a;
};

UIIntentionalStream.prototype.setConowingoCount = function(a) {
    this.conowingoCount = a;
};

UIIntentionalStream.prototype.updateRecentStoryCount = function(b) {
    this.conowingoCount = b;
    if (this.conowingoCount && this.boulderFeed) {
        var c = DOM.find($("pagelet_home_stream"), "div.fbStreamRecentStoriesPager");
        var d = DOM.find(c, "span.fbStreamRecentStoriesText");
        var a;
        if (this.conowingoCount == 1) {
            a = _tx("AFFICHER {count} NOUVELLE ACTUALITÉ", {
                count: b
            });
        } else if (b <= 100) {
            a = _tx("SEE {count} NEW STORIES", {
                count: b
            });
        } else a = _tx("Afficher 100+ nouvelles actualités");
        d.innerText = a;
        if (CSS.hasClass(c, "hidden_elem")) this.showRecentStoriesPager(c);
    }
};

UIIntentionalStream.prototype.updateRenderedStories = function(b) {
    if (this.boulderFeed && this.shouldRenderCount) {
        var a = DOM.find($("pagelet_home_stream"), "div.fbStreamRecentStoriesContainer");
        DOM.setContent(a, HTML(b));
    }
};

UIIntentionalStream.prototype.scrollToOrLoadRecentStories = function() {
    if (this.scrollToRecentStories()) {
        (new AsyncSignal("ajax/feed/scroll_link.php", {})).send();
    } else {
        DOMScroll.scrollTo(ge("pagelet_stream_pager"));
        this.loadOlderPosts({
            impatient_mode: true,
            max_stories: 10
        });
    }
};

UIIntentionalStream.prototype.scrollToRecentStories = function() {
    var a = ge("recent_header");
    if (a) {
        DOMScroll.scrollTo(a, true, false, Vector2.getViewportDimensions().y - 50);
        return true;
    } else return false;
};

UIIntentionalStream.prototype.scrollToTopStories = function() {
    DOMScroll.scrollTo(ge("highlight_header"), true, true);
};

UIIntentionalStream.prototype.refresh = function(k, a, g) {
    Arbiter.inform(UIIntentionalStreamMessage.UPDATE_LAST_REFRESH_TIME);
    this.currentFilterKey = a.filter;
    if (a.filter == UIIntentionalStream.FEED_FILTER_KEY_DUAL_NEWS_FEED) {
        this.currentFilterKey = this.defaultFilter;
    } else if (a.filter == UIIntentionalStream.FEED_FILTER_KEY_NEW_HIGHLIGHTS || a.filter === UIIntentionalStream.FEED_FILTER_KEY_NEWS_FEED) this.defaultFilter = this.currentFilterKey;
    g = g || {};
    var i = ++this.requestNum;
    var j = coalesce(g.showLoader, true);
    var e = this.instanceName;
    var d = function(l) {
        UIIntentionalStream.getInstance(e).handleResponse(i, k, l, g);
    };
    var b = function(l) {
        UIIntentionalStream.getInstance(e).handleError(i, k, l, g);
    };
    var c = function(l) {
        UIIntentionalStream.getInstance(e).handleFinally(k, a.filter, l);
    };
    if (!(a.request_type = k)) a.request_type = "none";
    if (a.filter) {
        g.show_hidden = a.show_hidden ? a.show_hidden : false;
    } else g.show_hidden = this.shouldShowHidden;
    var f = true;
    if (a.newest) f = false;
    a = copy_properties(this.getCurrentParams(), a);
    this.hasPendingRefresh = true;
    var h;
    if (k == UIIntentionalStream.REFRESH_APPEND && j) h = this.pager;
    (new AsyncRequest).setURI(this.getEndpoint()).setReadOnly(true).setOption("retries", 0).setMethod(this.getRefreshMethod()).setData(a).setReplayable(f).setHandler(d).setStatusElement(h).setErrorHandler(b).setFinallyHandler(c).send();
    if (k == UIIntentionalStream.REFRESH_TRANSITION) {
        hide(this.pager);
        this.clearScrollLoader(true);
        this.oldest = this.newest = null;
    }
    if (j) this.setHomeFilterLoading(true);
};

UIIntentionalStream.prototype.addComposerContent = function(a, b) {
    if (this.boulderFeed && this.isOnNewsFeedFilter()) {
        CSS.addClass(a, "uiStreamBoulderHighlight");
    } else CSS.removeClass(a, "uiStreamBoulderStyle");
    this.addContentPrepend(a, b);
};

UIIntentionalStream.prototype.addContentPrepend = function(a, b) {
    if (a.length) {
        $A(a).reverse().forEach(function(h) {
            this.addContentPrepend(h, b);
        }.bind(this));
        return;
    }
    var d;
    var f = Vector2.getScrollPosition().y;
    var c = Vector2.getElementPosition(this.streamContent).y;
    var g = this.scrollOnPrepend && f >= c;
    if (g) {
        var e = function(h) {
            var i = DOM.find(h, "^li.uiStreamStory");
            if (!i) return;
            DataStore.set(i, "origHeight", i.offsetHeight);
            Event.listen(h, "load", function() {
                var j = DataStore.get(i, "origHeight");
                if (i.offsetHeight != j) {
                    window.scrollBy(0, i.offsetHeight - j);
                    DataStore.set(i, "origHeight", i.offsetHeight);
                }
            });
        };
        d = animation.insert.curry(this.streamContent, a, function(i, h) {
            this.prependAfterHeader(h);
            Arbiter.inform("reflow");
            window.scrollBy(0, h.offsetHeight);
            DOM.scry(h, "img").forEach(e);
        }.bind(this));
    } else d = function() {
        CSS.setStyle(a, "opacity", 0);
        this.prependAfterHeader(a);
        Arbiter.inform("reflow");
        animation(a).from("opacity", 0).to("opacity", 1).duration(400).go();
    }.bind(this);
    if (b) {
        setTimeout(d, b);
    } else d();
};

UIIntentionalStream.prototype.prependAfterHeader = function(b) {
    var a = this.removeHeader();
    if (a) {
        DOM.prependContent(this.streamContent, a);
        CSS.addClass(b, "uiStreamFirstStory");
        DOM.insertAfter(a, b);
    } else DOM.prependContent(this.streamContent, b);
};

UIIntentionalStream.prototype.removeHeader = function() {
    var a = ge("stream_movable_header");
    if (a) {
        if (a.parentNode != this.streamContent) return null;
        var b = a.nextSibling;
        CSS.removeClass(b, "uiStreamFirstStory");
        DOM.remove(a);
        CSS.show(a);
    }
    return a;
};

UIIntentionalStream.prototype.updateHeaderCounts = function(a) {
    var b = a.highlight;
    if (b) {
        var c = DOM.scry(this.streamContent, "#highlight_header .uiStreamHeaderTextLeft");
        if (c.length == 1) {
            var d;
            if (b == 1) {
                d = _tx("Nouvelle actualité à la une", {
                    count: b
                });
            } else if (b < 20) {
                d = _tx("TOP STORIES SINCE YOUR LAST VISIT ({count})", {
                    count: b
                });
            } else d = _tx("Actualités à la une depuis votre dernière visite");
            c[0].innerHTML = d;
        }
    }
    var e = a.recent;
    if (e) {
        var f = DOM.scry(this.streamContent, "#highlight_header .uiStreamHeaderTextRight");
        if (f.length == 1) {
            var g;
            if (e == 1) {
                g = _tx("{count} MORE RECENT STORY", {
                    count: e
                });
            } else if (e < 100) {
                g = _tx("{count} MORE RECENT STORIES", {
                    count: e
                });
            } else g = _tx("100+ MORE RECENT STORIES");
            f[0].innerHTML = g;
        }
    }
};

UIIntentionalStream.prototype.addContentAppend = function(a) {
    DOM.appendContent(this.streamContent, a);
};

UIIntentionalStream.getStoriesByAssoc = function(a) {
    return DOM.scry(UIIntentionalStream.instance.root, "div.aid_" + a);
};

UIIntentionalStream.prototype.handleResponse = function(d, g, e, b) {
    b = b || {};
    var c = e.getPayload();
    this.filterNullState && DOM.remove(this.filterNullState);
    if (is_empty(c)) return;
    if (c.streamHeader && this.streamHeader) {
        DOM.setContent(this.streamHeader, HTML(c.streamHeader));
        if (this.isOnNewsFeedFilter()) this.setUpStreamHeader();
        NewHigh.reset();
    }
    if (c.autoRefreshConfig) Arbiter.inform(UIIntentionalStreamMessage.UPDATE_AUTOREFRESH_CONFIG, c.autoRefreshConfig);
    this.setHomeFilterLoading(false);
    if (g == UIIntentionalStream.REFRESH_EXPAND) {
        var f = DOM.find($(b.expandStoryID), "div.UIIntentionalStory_CollapsedStories");
        CSS.hide(f);
        CSS.removeClass(f, "UIIntentionalStory_CollapsedStoriesLoading");
    }
    if (this.error) hide(this.error);
    if (d != this.requestNum) return;
    if ("show_hidden" in b) this.shouldShowHidden = b.show_hidden;
    if ("newestStoryTime" in c && c.newestStoryTime > this.newest) this.newest = c.newestStoryTime;
    if ("oldestStoryTime" in c && (!this.oldest || c.oldestStoryTime < this.oldest)) this.oldest = c.oldestStoryTime;
    if ("streamStoryCount" in c) this.updateLiveFeedCount(c.streamStoryCount);
    if (!c.html) {
        if (g == UIIntentionalStream.REFRESH_BUBBLE) this.shiftPrefetchStories();
    } else {
        var a = HTML(c.html).getNodes();
        switch (g) {
          case UIIntentionalStream.REFRESH_COUNT:
            if (this.boulderFeed && this.shouldRenderCount && c.conowingoCount) {
                this.updateRecentStoryCount(c.conowingoCount);
                if ("conowingoHTML" in c) this.updateRenderedStories(c.conowingoHTML);
            } else if (c.storyCount && !this.boulderFeed) this.updateLiveFeedCount(c.storyCount, true);
            break;
          case UIIntentionalStream.REFRESH_BUBBLE:
            if (c.replaceCurrentStories) {
                DOM.empty(this.streamContent);
                this.scrollPosition = c.scrollPosition;
                this.oldest = c.oldest;
                this.highlightsBlockData = {
                    is_highlight: false,
                    highlight_blocks: 0,
                    nonhighlight_blocks: 1
                };
            }
            this.addContentPrepend(a);
            this.shiftPrefetchStories();
            break;
          case UIIntentionalStream.REFRESH_PREPEND:
            this.addContentPrepend(a);
            break;
          case UIIntentionalStream.REFRESH_APPEND:
            this.addContentAppend(a);
            this.clearScrollLoader(true);
            break;
          case UIIntentionalStream.REFRESH_TRANSITION:
            DOM.setContent(this.streamContent, a);
            if (!b.noScroll) DOMScroll.scrollTo(new Vector2(0, 0, "document"), false);
            break;
          case UIIntentionalStream.REFRESH_EXPAND:
            DOM.insertAfter($(b.expandStoryID), a);
            break;
          case UIIntentionalStream.DELAYED_STREAM:
            this.addContentAppend(a);
            break;
        }
        Arbiter.inform(UIIntentionalStreamMessage.UPDATE_HTML_CONTENT);
    }
};

UIIntentionalStream.prototype.updateLiveFeedCount = function(c, b) {
    var d = this.unseenStoryCount == 0 || !b;
    if (b) {
        this.unseenStoryCount += c;
    } else this.unseenStoryCount = c;
    if (this.unseenStoryCount > 0 && this.liveFeedCount) {
        var a = "";
        if (this.unseenStoryCount > this.maxUnseenStoryCount) {
            a = this.maxUnseenStoryCount + "+";
        } else a = this.unseenStoryCount.toString();
        DOM.setContent(this.liveFeedCount, HTML(a));
        if (d) CSS.show(this.liveFeedBubble);
    }
};

UIIntentionalStream.prototype.handleError = function(c, f, d, b) {
    if (!d.isReplay() && c != this.requestNum) return;
    this.setHomeFilterLoading(false);
    var a = d.getError();
    if (a == 1357001) AsyncResponse.defaultErrorHandler(d);
    if (f == UIIntentionalStream.REFRESH_EXPAND) {
        var e = DOM.find($(b.expandStoryID), "div.UIIntentionalStory_CollapsedStories");
        CSS.removeClass(e, "UIIntentionalStory_CollapsedStoriesLoading");
    }
    if (!b.delayLoadCount && f != UIIntentionalStream.REFRESH_PREPEND && this.error) CSS.setStyle(this.error, "display", "block");
};

UIIntentionalStream.prototype.handleFinally = function(b, a) {
    if (b == UIIntentionalStream.REFRESH_TRANSITION) {
        PageTransitions.transitionComplete();
        Arbiter.inform(NavigationMessage.NAVIGATION_COMPLETED);
    }
    this.hasPendingRefresh = false;
};

UIIntentionalStream.prototype.getValidParams = function() {
    return UIIntentionalStream.VALID_PARAMS;
};

UIIntentionalStream.prototype.getEndpoint = function() {
    return UIIntentionalStream.ENDPOINT;
};

UIIntentionalStream.prototype.getRefreshMethod = function() {
    return UIIntentionalStream.REFRESH_METHOD;
};

UIIntentionalStream.prototype.isOnNewHighlights = function() {
    var a = this.getCurrentFilterKey();
    return a == UIIntentionalStream.FEED_FILTER_KEY_NEW_HIGHLIGHTS || a == UIIntentionalStream.FEED_FILTER_KEY_DUAL_NEWS_FEED && this.defaultFilter == UIIntentionalStream.FEED_FILTER_KEY_NEW_HIGHLIGHTS;
};

UIIntentionalStream.prototype.isLiveStreamBox = function() {
    var a = this.getCurrentFilterKey();
    return a && a.indexOf(UIIntentionalStream.FEED_FILTER_KEY_LIVE_STREAM_BOX) == 0;
};

UIIntentionalStream.prototype.isOnNewsFeedFilter = function() {
    var a = this.getCurrentFilterKey();
    return a == UIIntentionalStream.FEED_FILTER_KEY_NEWS_FEED || a == UIIntentionalStream.FEED_FILTER_KEY_NEW_HIGHLIGHTS || a == UIIntentionalStream.FEED_FILTER_KEY_DUAL_NEWS_FEED;
};

UIIntentionalStream.prototype.setupAutoInsert = function() {
    Arbiter.subscribe(UIIntentionalStreamMessage.SET_AUTO_INSERT, UIIntentionalStream.setAutoInsert);
};

UIIntentionalStream.setAutoInsert = function(b, a) {
    if (b != UIIntentionalStreamMessage.SET_AUTO_INSERT) return;
    var c = UIIntentionalStream.instance;
    if (c) c.pauseAutoInsert = a.pause;
};

UIIntentionalStream.prototype.isAutoRefreshPaused = function() {
    if (this.isOnNewHighlights() || this.isLiveStreamBox()) return false;
    return this.pauseAutoInsert;
};

UIIntentionalStream.prototype.setUpStreamHeader = function() {
    if (!this.streamHeader) return;
    this.liveFeedBubble = DOM.scry(this.streamHeader, "span.uiBubbleCount")[0];
    if (!this.liveFeedBubble) return;
    this.liveFeedCount = DOM.scry(this.liveFeedBubble, "span.number")[0];
    if (!this.maxUnseenStoryCount) this.maxUnseenStoryCount = UIIntentionalStream.MAX_UNSEEN_STORY_COUNT;
};

UIIntentionalStream.prototype.refreshStream = function(e, a) {
    if (e != UIIntentionalStreamMessage.REFRESH_STREAM) return;
    var c = this.getCurrentFilterKey();
    if (this.isOnNewsFeedFilter() && a.shouldOverride) c = UIIntentionalStream.FEED_FILTER_KEY_NEW_HIGHLIGHTS;
    var f = c == UIIntentionalStream.FEED_FILTER_KEY_NEW_HIGHLIGHTS;
    var b = {
        filter: c
    };
    if (f) b.pending = f;
    var d = {
        filter: c
    };
    a.noScroll && (d.noScroll = 1);
    this.refresh(UIIntentionalStream.REFRESH_TRANSITION, b, d);
};

copy_properties(UIIntentionalStream, {
    ANIMATION_DURATION: 300,
    REFRESH_METHOD: "GET",
    REFRESH_TRANSITION: 1,
    REFRESH_PREPEND: 2,
    REFRESH_APPEND: 3,
    REFRESH_COUNT: 4,
    REFRESH_EXPAND: 5,
    DELAYED_STREAM: 6,
    REFRESH_BUBBLE: 7,
    FEED_FILTER_KEY_FEED_STORY_SUMMARY: "fssum",
    FEED_FILTER_KEY_NEW_HIGHLIGHTS: "h",
    FEED_FILTER_KEY_NEWS_FEED: "lf",
    FEED_FILTER_KEY_DUAL_NEWS_FEED: "nf",
    FEED_FILTER_KEY_LIVE_STREAM_BOX: "pub",
    VALID_PARAMS: [ "filter", "show_hidden" ],
    ENDPOINT: "/ajax/intent.php",
    MAX_UNSEEN_STORY_COUNT: 300
});