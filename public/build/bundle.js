
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.3' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* public\Moduls\Box.svelte generated by Svelte v3.46.3 */

    const file$3 = "public\\Moduls\\Box.svelte";

    // (114:8) {:else}
    function create_else_block_1$1(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			i.textContent = "volume_off";
    			attr_dev(i, "class", "material-icons");
    			set_style(i, "font-size", "30px");
    			add_location(i, file$3, 114, 12, 3105);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(114:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (112:8) {#if audio}
    function create_if_block_1$2(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			i.textContent = "volume_up";
    			attr_dev(i, "class", "material-icons");
    			set_style(i, "font-size", "30px");
    			add_location(i, file$3, 112, 12, 3010);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(112:8) {#if audio}",
    		ctx
    	});

    	return block;
    }

    // (130:8) {:else}
    function create_else_block$2(ctx) {
    	let h1;
    	let h1_intro;
    	let h1_outro;
    	let current;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			add_location(h1, file$3, 130, 12, 3730);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			h1.innerHTML = /*instruction*/ ctx[0];
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*instruction*/ 1) h1.innerHTML = /*instruction*/ ctx[0];		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (h1_outro) h1_outro.end(1);
    				h1_intro = create_in_transition(h1, fade$2, {});
    				h1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (h1_intro) h1_intro.invalidate();
    			h1_outro = create_out_transition(h1, fade$2, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching && h1_outro) h1_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(130:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (126:8) {#if !started}
    function create_if_block$3(ctx) {
    	let button;
    	let i;
    	let button_intro;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			i = element("i");
    			i.textContent = "play_arrow";
    			attr_dev(i, "class", "material-icons");
    			add_location(i, file$3, 127, 16, 3636);
    			attr_dev(button, "id", "start-btn");
    			add_location(button, file$3, 126, 12, 3555);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, i);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[11], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (!button_intro) {
    				add_render_callback(() => {
    					button_intro = create_in_transition(button, fade$2, {});
    					button_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(126:8) {#if !started}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let button0;
    	let i;
    	let t1;
    	let button1;
    	let t2;
    	let div;
    	let h2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let img;
    	let img_src_value;
    	let t7;
    	let current_block_type_index;
    	let if_block1;
    	let div_intro;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*audio*/ ctx[4]) return create_if_block_1$2;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	const if_block_creators = [create_if_block$3, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (!/*started*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			button0 = element("button");
    			i = element("i");
    			i.textContent = "chevron_left";
    			t1 = space();
    			button1 = element("button");
    			if_block0.c();
    			t2 = space();
    			div = element("div");
    			h2 = element("h2");
    			t3 = text("Round: ");
    			t4 = text(/*round*/ ctx[1]);
    			t5 = text(" / 3");
    			t6 = space();
    			img = element("img");
    			t7 = space();
    			if_block1.c();
    			attr_dev(i, "class", "material-icons");
    			set_style(i, "font-size", "38px");
    			add_location(i, file$3, 107, 8, 2828);
    			attr_dev(button0, "id", "home-btn");
    			add_location(button0, file$3, 106, 4, 2761);
    			attr_dev(button1, "id", "mute-btn");
    			add_location(button1, file$3, 110, 4, 2918);
    			attr_dev(h2, "id", "round-display");
    			add_location(h2, file$3, 118, 8, 3250);
    			attr_dev(img, "id", "box");
    			if (!src_url_equal(img.src, img_src_value = "/Rectangle.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Visualization of the box breathing pattern that animates depending on the status");
    			set_style(img, "height", /*height*/ ctx[3] + "%");
    			attr_dev(img, "class", "svelte-xftf7i");
    			add_location(img, file$3, 119, 8, 3306);
    			attr_dev(div, "class", "boxbreathing svelte-xftf7i");
    			add_location(div, file$3, 117, 4, 3206);
    			add_location(main, file$3, 105, 0, 2749);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, button0);
    			append_dev(button0, i);
    			append_dev(main, t1);
    			append_dev(main, button1);
    			if_block0.m(button1, null);
    			append_dev(main, t2);
    			append_dev(main, div);
    			append_dev(div, h2);
    			append_dev(h2, t3);
    			append_dev(h2, t4);
    			append_dev(h2, t5);
    			append_dev(div, t6);
    			append_dev(div, img);
    			append_dev(div, t7);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[9], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button1, null);
    				}
    			}

    			if (!current || dirty & /*round*/ 2) set_data_dev(t4, /*round*/ ctx[1]);

    			if (!current || dirty & /*height*/ 8) {
    				set_style(img, "height", /*height*/ ctx[3] + "%");
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade$2, {});
    					div_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block0.d();
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function fade$2(node, { delay = 0, duration = 400 }) {
    	const o = +getComputedStyle(node).opacity;

    	return {
    		delay,
    		duration,
    		css: t => `opacity: ${t * o}`
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Box', slots, []);
    	let { show } = $$props;

    	/*----audio*/
    	let inhaleAudio = new Audio("./media/Inhale.mp3");

    	let exhaleAudio = new Audio("./media/Exhale.mp3");
    	let boxtimer = "";
    	let boxAnimation = "";
    	let instruction = "Inhale <br> for 4";
    	let countdown = 4;
    	let cycle = 0;
    	let round = 1;
    	let started = false;
    	let height = 30;
    	let inhale = 0;

    	function returnToLanding() {
    		$$invalidate(8, show = 0);
    		clearInterval(boxtimer);
    		clearInterval(boxAnimation);
    		inhaleAudio.pause();
    		exhaleAudio.pause();
    	}

    	function startSession() {
    		$$invalidate(2, started = true);
    		boxbreathing();
    	}

    	function boxbreathing() {
    		boxtimer = setInterval(
    			() => {
    				++cycle;
    				if (cycle == 1) playAudio(0);
    				if (cycle == 9) playAudio(1);

    				if (cycle == 16) {
    					cycle = 0;
    					$$invalidate(1, round++, round);
    				} else if (cycle <= 4) {
    					inhale = 1;
    					$$invalidate(0, instruction = "Inhale <br> for " + countdown--);
    				} else if (cycle > 4 && cycle <= 8 || cycle > 12 && cycle < 15) {
    					inhale = 0;
    					$$invalidate(0, instruction = "Hold it");
    				} else if (cycle > 8 && cycle < 13) {
    					inhale = -1;
    					$$invalidate(0, instruction = "Exhale <br> for " + countdown--);
    				}

    				if (round > 3) {
    					$$invalidate(1, round = 3);
    					clearInterval(boxtimer);
    					clearInterval(boxAnimation);
    					$$invalidate(0, instruction = "Well <br> done");
    					setTimeout(reset, 4000);
    				}

    				if (countdown == 0) countdown = 4;
    			},
    			1000
    		);

    		boxAnimation = setInterval(
    			() => {
    				if (inhale > 0) {
    					$$invalidate(3, height += 0.025);
    				} else if (inhale < 0) {
    					$$invalidate(3, height -= 0.025);
    				}
    			},
    			7
    		);
    	}

    	function reset() {
    		$$invalidate(2, started = false);
    		$$invalidate(1, round = 1);
    		$$invalidate(0, instruction = "");
    	}

    	// 0 = inhale || 1 = exhale
    	function playAudio(variant) {
    		if (audio) {
    			if (variant == 0) inhaleAudio.play();
    			if (variant == 1) exhaleAudio.play();
    		}
    	}

    	let audio = true;

    	function audioController() {
    		$$invalidate(4, audio = !audio);

    		if (!audio) {
    			inhaleAudio.pause();
    			exhaleAudio.pause();
    		}
    	}

    	const writable_props = ['show'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Box> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => returnToLanding();
    	const click_handler_1 = () => audioController();
    	const click_handler_2 = () => startSession();

    	$$self.$$set = $$props => {
    		if ('show' in $$props) $$invalidate(8, show = $$props.show);
    	};

    	$$self.$capture_state = () => ({
    		show,
    		inhaleAudio,
    		exhaleAudio,
    		boxtimer,
    		boxAnimation,
    		instruction,
    		countdown,
    		cycle,
    		round,
    		started,
    		height,
    		inhale,
    		returnToLanding,
    		startSession,
    		boxbreathing,
    		reset,
    		playAudio,
    		fade: fade$2,
    		audio,
    		audioController
    	});

    	$$self.$inject_state = $$props => {
    		if ('show' in $$props) $$invalidate(8, show = $$props.show);
    		if ('inhaleAudio' in $$props) inhaleAudio = $$props.inhaleAudio;
    		if ('exhaleAudio' in $$props) exhaleAudio = $$props.exhaleAudio;
    		if ('boxtimer' in $$props) boxtimer = $$props.boxtimer;
    		if ('boxAnimation' in $$props) boxAnimation = $$props.boxAnimation;
    		if ('instruction' in $$props) $$invalidate(0, instruction = $$props.instruction);
    		if ('countdown' in $$props) countdown = $$props.countdown;
    		if ('cycle' in $$props) cycle = $$props.cycle;
    		if ('round' in $$props) $$invalidate(1, round = $$props.round);
    		if ('started' in $$props) $$invalidate(2, started = $$props.started);
    		if ('height' in $$props) $$invalidate(3, height = $$props.height);
    		if ('inhale' in $$props) inhale = $$props.inhale;
    		if ('audio' in $$props) $$invalidate(4, audio = $$props.audio);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		instruction,
    		round,
    		started,
    		height,
    		audio,
    		returnToLanding,
    		startSession,
    		audioController,
    		show,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Box extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { show: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Box",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*show*/ ctx[8] === undefined && !('show' in props)) {
    			console.warn("<Box> was created without expected prop 'show'");
    		}
    	}

    	get show() {
    		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* public\Moduls\Landing.svelte generated by Svelte v3.46.3 */

    const file$2 = "public\\Moduls\\Landing.svelte";

    // (75:12) {:else}
    function create_else_block$1(ctx) {
    	let section;
    	let h3;
    	let t1;
    	let pre;
    	let section_intro;

    	const block = {
    		c: function create() {
    			section = element("section");
    			h3 = element("h3");
    			h3.textContent = "Equal breathing";
    			t1 = space();
    			pre = element("pre");
    			pre.textContent = "Is a breathing pattern that has the same set count during the in- and exhale.\r\n                        For example 4-4.\r\n                        It can help to bring back focus on one's breathing and therefore enhance awareness of bodily sensations.";
    			add_location(h3, file$2, 76, 20, 2255);
    			attr_dev(pre, "class", "svelte-2z0cqz");
    			add_location(pre, file$2, 77, 20, 2301);
    			attr_dev(section, "class", "explanation svelte-2z0cqz");
    			add_location(section, file$2, 75, 16, 2196);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h3);
    			append_dev(section, t1);
    			append_dev(section, pre);
    		},
    		i: function intro(local) {
    			if (!section_intro) {
    				add_render_callback(() => {
    					section_intro = create_in_transition(section, fade$1, {});
    					section_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(75:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (64:12) {#if explain}
    function create_if_block$2(ctx) {
    	let section;
    	let h3;
    	let t1;
    	let pre;
    	let section_intro;

    	const block = {
    		c: function create() {
    			section = element("section");
    			h3 = element("h3");
    			h3.textContent = "Box breathing";
    			t1 = space();
    			pre = element("pre");
    			pre.textContent = "Is a breathing pattern that can help to reduce stress or enhance focus by calming the mind and nervous system.\r\n\r\n            You inhale, hold the breath, exhale and hold the breath again for the same amount of time.\r\n            For example 4-4-4-4. \r\n            When this pattern is visualized, it looks like a box.";
    			add_location(h3, file$2, 65, 20, 1727);
    			attr_dev(pre, "class", "svelte-2z0cqz");
    			add_location(pre, file$2, 66, 20, 1771);
    			attr_dev(section, "class", "explanation svelte-2z0cqz");
    			add_location(section, file$2, 64, 16, 1668);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h3);
    			append_dev(section, t1);
    			append_dev(section, pre);
    		},
    		i: function intro(local) {
    			if (!section_intro) {
    				add_render_callback(() => {
    					section_intro = create_in_transition(section, fade$1, {});
    					section_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(64:12) {#if explain}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let div2;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let p;
    	let t2;
    	let button0;
    	let h30;
    	let button0_class_value;
    	let t4;
    	let hr;
    	let t5;
    	let button1;
    	let h31;
    	let button1_class_value;
    	let t7;
    	let div1;
    	let t8;
    	let button2;
    	let div2_intro;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*explain*/ ctx[1]) return create_if_block$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "Choose from the following:";
    			t2 = space();
    			button0 = element("button");
    			h30 = element("h3");
    			h30.textContent = "Box breathing";
    			t4 = space();
    			hr = element("hr");
    			t5 = space();
    			button1 = element("button");
    			h31 = element("h3");
    			h31.textContent = "Equal breathing";
    			t7 = space();
    			div1 = element("div");
    			if_block.c();
    			t8 = space();
    			button2 = element("button");
    			button2.textContent = "Start";
    			attr_dev(img, "id", "logo");
    			if (!src_url_equal(img.src, img_src_value = "./media/BreathingLogo400.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Logo of application showing a windy icon in a circle");
    			attr_dev(img, "class", "svelte-2z0cqz");
    			add_location(img, file$2, 39, 8, 835);
    			add_location(p, file$2, 45, 12, 1041);
    			add_location(h30, file$2, 51, 16, 1261);

    			attr_dev(button0, "class", button0_class_value = "" + (null_to_empty(/*current*/ ctx[0] === "box"
    			? "selection-btn"
    			: "unselected") + " svelte-2z0cqz"));

    			add_location(button0, file$2, 47, 12, 1090);
    			attr_dev(hr, "class", "svelte-2z0cqz");
    			add_location(hr, file$2, 53, 12, 1320);
    			add_location(h31, file$2, 58, 16, 1513);

    			attr_dev(button1, "class", button1_class_value = "" + (null_to_empty(/*current*/ ctx[0] === "equal"
    			? "selection-btn"
    			: "unselected") + " svelte-2z0cqz"));

    			add_location(button1, file$2, 54, 12, 1340);
    			attr_dev(div0, "class", "selection svelte-2z0cqz");
    			add_location(div0, file$2, 44, 8, 1004);
    			attr_dev(div1, "class", "explanation-container svelte-2z0cqz");
    			add_location(div1, file$2, 62, 8, 1588);
    			attr_dev(button2, "id", "jumpto-btn");
    			attr_dev(button2, "class", "svelte-2z0cqz");
    			add_location(button2, file$2, 85, 8, 2683);
    			attr_dev(div2, "class", "landing-container svelte-2z0cqz");
    			add_location(div2, file$2, 38, 4, 786);
    			attr_dev(main, "class", "svelte-2z0cqz");
    			add_location(main, file$2, 37, 0, 774);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, img);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			append_dev(div0, p);
    			append_dev(div0, t2);
    			append_dev(div0, button0);
    			append_dev(button0, h30);
    			append_dev(div0, t4);
    			append_dev(div0, hr);
    			append_dev(div0, t5);
    			append_dev(div0, button1);
    			append_dev(button1, h31);
    			append_dev(div2, t7);
    			append_dev(div2, div1);
    			if_block.m(div1, null);
    			append_dev(div2, t8);
    			append_dev(div2, button2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[6], false, false, false),
    					listen_dev(button2, "click", /*StartExercise*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*current*/ 1 && button0_class_value !== (button0_class_value = "" + (null_to_empty(/*current*/ ctx[0] === "box"
    			? "selection-btn"
    			: "unselected") + " svelte-2z0cqz"))) {
    				attr_dev(button0, "class", button0_class_value);
    			}

    			if (dirty & /*current*/ 1 && button1_class_value !== (button1_class_value = "" + (null_to_empty(/*current*/ ctx[0] === "equal"
    			? "selection-btn"
    			: "unselected") + " svelte-2z0cqz"))) {
    				attr_dev(button1, "class", button1_class_value);
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);

    			if (!div2_intro) {
    				add_render_callback(() => {
    					div2_intro = create_in_transition(div2, fade$1, {});
    					div2_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function fade$1(node, { delay = 0, duration = 400 }) {
    	const o = +getComputedStyle(node).opacity;

    	return {
    		delay,
    		duration,
    		css: t => `opacity: ${t * o}`
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Landing', slots, []);
    	let { show } = $$props;
    	let current = "box";
    	let explain = true;

    	//0 = box b. 1 = equal b.
    	function switchExplanation(explanation) {
    		if (explanation == 0) {
    			$$invalidate(1, explain = true);
    			$$invalidate(0, current = "box");
    		}

    		if (explanation == 1) {
    			$$invalidate(1, explain = false);
    			$$invalidate(0, current = "equal");
    		}
    	}

    	function StartExercise() {
    		if (explain) {
    			$$invalidate(4, show = 1);
    		} else {
    			$$invalidate(4, show = 2);
    		}
    	}

    	const writable_props = ['show'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Landing> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => switchExplanation(0);
    	const click_handler_1 = () => switchExplanation(1);

    	$$self.$$set = $$props => {
    		if ('show' in $$props) $$invalidate(4, show = $$props.show);
    	};

    	$$self.$capture_state = () => ({
    		show,
    		current,
    		explain,
    		switchExplanation,
    		StartExercise,
    		fade: fade$1
    	});

    	$$self.$inject_state = $$props => {
    		if ('show' in $$props) $$invalidate(4, show = $$props.show);
    		if ('current' in $$props) $$invalidate(0, current = $$props.current);
    		if ('explain' in $$props) $$invalidate(1, explain = $$props.explain);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		current,
    		explain,
    		switchExplanation,
    		StartExercise,
    		show,
    		click_handler,
    		click_handler_1
    	];
    }

    class Landing extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { show: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Landing",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*show*/ ctx[4] === undefined && !('show' in props)) {
    			console.warn("<Landing> was created without expected prop 'show'");
    		}
    	}

    	get show() {
    		throw new Error("<Landing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<Landing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* public\Moduls\Equal.svelte generated by Svelte v3.46.3 */

    const { console: console_1 } = globals;
    const file$1 = "public\\Moduls\\Equal.svelte";

    // (118:8) {:else}
    function create_else_block_1(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			i.textContent = "volume_off";
    			attr_dev(i, "class", "material-icons");
    			set_style(i, "font-size", "30px");
    			add_location(i, file$1, 118, 12, 3072);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(118:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (116:8) {#if audio}
    function create_if_block_1$1(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			i.textContent = "volume_up";
    			attr_dev(i, "class", "material-icons");
    			set_style(i, "font-size", "30px");
    			add_location(i, file$1, 116, 12, 2977);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(116:8) {#if audio}",
    		ctx
    	});

    	return block;
    }

    // (128:8) {:else}
    function create_else_block(ctx) {
    	let h1;
    	let t;
    	let h1_intro;
    	let h1_outro;
    	let current;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t = text(/*instruction*/ ctx[0]);
    			add_location(h1, file$1, 128, 12, 3478);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*instruction*/ 1) set_data_dev(t, /*instruction*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (h1_outro) h1_outro.end(1);
    				h1_intro = create_in_transition(h1, fade, {});
    				h1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (h1_intro) h1_intro.invalidate();
    			h1_outro = create_out_transition(h1, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching && h1_outro) h1_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(128:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (124:8) {#if !started}
    function create_if_block$1(ctx) {
    	let button;
    	let i;
    	let button_intro;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			i = element("i");
    			i.textContent = "play_arrow";
    			attr_dev(i, "class", "material-icons");
    			add_location(i, file$1, 125, 16, 3384);
    			attr_dev(button, "id", "start-btn");
    			add_location(button, file$1, 124, 12, 3303);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, i);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[11], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (!button_intro) {
    				add_render_callback(() => {
    					button_intro = create_in_transition(button, fade, {});
    					button_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(124:8) {#if !started}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let button0;
    	let i;
    	let t1;
    	let button1;
    	let t2;
    	let div;
    	let h2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let current_block_type_index;
    	let if_block1;
    	let t7;
    	let hr;
    	let div_intro;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*audio*/ ctx[4]) return create_if_block_1$1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (!/*started*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			button0 = element("button");
    			i = element("i");
    			i.textContent = "chevron_left";
    			t1 = space();
    			button1 = element("button");
    			if_block0.c();
    			t2 = space();
    			div = element("div");
    			h2 = element("h2");
    			t3 = text("Round: ");
    			t4 = text(/*round*/ ctx[1]);
    			t5 = text(" / 5");
    			t6 = space();
    			if_block1.c();
    			t7 = space();
    			hr = element("hr");
    			attr_dev(i, "class", "material-icons");
    			set_style(i, "font-size", "38px");
    			add_location(i, file$1, 111, 8, 2795);
    			attr_dev(button0, "id", "home-btn");
    			add_location(button0, file$1, 110, 4, 2728);
    			attr_dev(button1, "id", "mute-btn");
    			add_location(button1, file$1, 114, 4, 2885);
    			attr_dev(h2, "id", "round-display");
    			add_location(h2, file$1, 122, 8, 3219);
    			set_style(hr, "width", /*width*/ ctx[3] + "%");
    			attr_dev(hr, "class", "svelte-656hx2");
    			add_location(hr, file$1, 130, 8, 3542);
    			attr_dev(div, "class", "equalbreathing svelte-656hx2");
    			add_location(div, file$1, 121, 4, 3173);
    			add_location(main, file$1, 109, 0, 2716);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, button0);
    			append_dev(button0, i);
    			append_dev(main, t1);
    			append_dev(main, button1);
    			if_block0.m(button1, null);
    			append_dev(main, t2);
    			append_dev(main, div);
    			append_dev(div, h2);
    			append_dev(h2, t3);
    			append_dev(h2, t4);
    			append_dev(h2, t5);
    			append_dev(div, t6);
    			if_blocks[current_block_type_index].m(div, null);
    			append_dev(div, t7);
    			append_dev(div, hr);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[9], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button1, null);
    				}
    			}

    			if (!current || dirty & /*round*/ 2) set_data_dev(t4, /*round*/ ctx[1]);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div, t7);
    			}

    			if (!current || dirty & /*width*/ 8) {
    				set_style(hr, "width", /*width*/ ctx[3] + "%");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade, {});
    					div_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block0.d();
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function fade(node, { delay = 0, duration = 400 }) {
    	const o = +getComputedStyle(node).opacity;

    	return {
    		delay,
    		duration,
    		css: t => `opacity: ${t * o}`
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Equal', slots, []);
    	let { show } = $$props;

    	/*----audio*/
    	let inhaleAudio = new Audio("./media/Inhale.mp3");

    	let exhaleAudio = new Audio("./media/Exhale.mp3");
    	let boxtimer;
    	let boxAnimation;
    	let instruction = "Inhale for 4";
    	let countdown = 4;
    	let cycle = 0;
    	let round = 1;
    	let started = false;
    	let width = 24;
    	let inhale = 0;

    	function returnToLanding() {
    		$$invalidate(8, show = 0);
    		clearInterval(boxtimer);
    		clearInterval(boxAnimation);
    		inhaleAudio.pause();
    		exhaleAudio.pause();
    	}

    	function startSession() {
    		$$invalidate(1, round = 0);
    		$$invalidate(2, started = true);
    		equalbreathing();
    	}

    	function equalbreathing() {
    		boxtimer = setInterval(
    			() => {
    				++cycle;

    				if (cycle == 9) {
    					inhale = 0;
    					cycle = 1;
    					$$invalidate(1, round++, round);
    				}

    				if (round > 5) {
    					$$invalidate(1, round = 5);
    					$$invalidate(0, instruction = "Well done");
    					setTimeout(reset, 4000);
    					$$invalidate(3, width = 24);
    					clearInterval(boxtimer);
    					clearInterval(boxAnimation);
    					inhale = 0;
    					cycle = 0;
    					return;
    				}

    				if (cycle <= 4) {
    					inhale = 1;
    					$$invalidate(0, instruction = "Inhale for " + countdown--);
    				} else if (cycle > 4 && cycle <= 8) {
    					inhale = -1;
    					$$invalidate(0, instruction = "Exhale for " + countdown--);
    				}

    				if (cycle == 1) playAudio(0);
    				if (cycle == 5) playAudio(1);
    				if (countdown == 0) countdown = 4;
    			},
    			1000
    		);

    		boxAnimation = setInterval(
    			() => {
    				if (inhale > 0) {
    					$$invalidate(3, width += 0.04);
    				} else if (inhale < 0) {
    					$$invalidate(3, width -= 0.04);
    				}
    			},
    			10
    		);
    	}

    	function reset() {
    		$$invalidate(2, started = false);
    		$$invalidate(1, round = 1);
    		$$invalidate(0, instruction = "");
    	}

    	// 0 = inhale || 1 = exhale
    	function playAudio(variant) {
    		if (audio) {
    			if (variant == 0) inhaleAudio.play();
    			if (variant == 1) exhaleAudio.play();
    		}
    	}

    	let audio = true;

    	function audioController() {
    		$$invalidate(4, audio = !audio);
    		console.log(audio);

    		if (!audio) {
    			inhaleAudio.pause();
    			exhaleAudio.pause();
    		}
    	}

    	const writable_props = ['show'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Equal> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => returnToLanding();
    	const click_handler_1 = () => audioController();
    	const click_handler_2 = () => startSession();

    	$$self.$$set = $$props => {
    		if ('show' in $$props) $$invalidate(8, show = $$props.show);
    	};

    	$$self.$capture_state = () => ({
    		show,
    		inhaleAudio,
    		exhaleAudio,
    		boxtimer,
    		boxAnimation,
    		instruction,
    		countdown,
    		cycle,
    		round,
    		started,
    		width,
    		inhale,
    		returnToLanding,
    		startSession,
    		equalbreathing,
    		reset,
    		playAudio,
    		fade,
    		audio,
    		audioController
    	});

    	$$self.$inject_state = $$props => {
    		if ('show' in $$props) $$invalidate(8, show = $$props.show);
    		if ('inhaleAudio' in $$props) inhaleAudio = $$props.inhaleAudio;
    		if ('exhaleAudio' in $$props) exhaleAudio = $$props.exhaleAudio;
    		if ('boxtimer' in $$props) boxtimer = $$props.boxtimer;
    		if ('boxAnimation' in $$props) boxAnimation = $$props.boxAnimation;
    		if ('instruction' in $$props) $$invalidate(0, instruction = $$props.instruction);
    		if ('countdown' in $$props) countdown = $$props.countdown;
    		if ('cycle' in $$props) cycle = $$props.cycle;
    		if ('round' in $$props) $$invalidate(1, round = $$props.round);
    		if ('started' in $$props) $$invalidate(2, started = $$props.started);
    		if ('width' in $$props) $$invalidate(3, width = $$props.width);
    		if ('inhale' in $$props) inhale = $$props.inhale;
    		if ('audio' in $$props) $$invalidate(4, audio = $$props.audio);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		instruction,
    		round,
    		started,
    		width,
    		audio,
    		returnToLanding,
    		startSession,
    		audioController,
    		show,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Equal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { show: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Equal",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*show*/ ctx[8] === undefined && !('show' in props)) {
    			console_1.warn("<Equal> was created without expected prop 'show'");
    		}
    	}

    	get show() {
    		throw new Error("<Equal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<Equal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.46.3 */
    const file = "src\\App.svelte";

    // (20:21) 
    function create_if_block_2(ctx) {
    	let equal;
    	let updating_show;
    	let current;

    	function equal_show_binding(value) {
    		/*equal_show_binding*/ ctx[3](value);
    	}

    	let equal_props = {};

    	if (/*show*/ ctx[0] !== void 0) {
    		equal_props.show = /*show*/ ctx[0];
    	}

    	equal = new Equal({ props: equal_props, $$inline: true });
    	binding_callbacks.push(() => bind(equal, 'show', equal_show_binding));

    	const block = {
    		c: function create() {
    			create_component(equal.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(equal, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const equal_changes = {};

    			if (!updating_show && dirty & /*show*/ 1) {
    				updating_show = true;
    				equal_changes.show = /*show*/ ctx[0];
    				add_flush_callback(() => updating_show = false);
    			}

    			equal.$set(equal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(equal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(equal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(equal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(20:21) ",
    		ctx
    	});

    	return block;
    }

    // (18:21) 
    function create_if_block_1(ctx) {
    	let box;
    	let updating_show;
    	let current;

    	function box_show_binding(value) {
    		/*box_show_binding*/ ctx[2](value);
    	}

    	let box_props = {};

    	if (/*show*/ ctx[0] !== void 0) {
    		box_props.show = /*show*/ ctx[0];
    	}

    	box = new Box({ props: box_props, $$inline: true });
    	binding_callbacks.push(() => bind(box, 'show', box_show_binding));

    	const block = {
    		c: function create() {
    			create_component(box.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(box, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const box_changes = {};

    			if (!updating_show && dirty & /*show*/ 1) {
    				updating_show = true;
    				box_changes.show = /*show*/ ctx[0];
    				add_flush_callback(() => updating_show = false);
    			}

    			box.$set(box_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(box, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(18:21) ",
    		ctx
    	});

    	return block;
    }

    // (16:1) {#if show == 0}
    function create_if_block(ctx) {
    	let landing;
    	let updating_show;
    	let current;

    	function landing_show_binding(value) {
    		/*landing_show_binding*/ ctx[1](value);
    	}

    	let landing_props = {};

    	if (/*show*/ ctx[0] !== void 0) {
    		landing_props.show = /*show*/ ctx[0];
    	}

    	landing = new Landing({ props: landing_props, $$inline: true });
    	binding_callbacks.push(() => bind(landing, 'show', landing_show_binding));

    	const block = {
    		c: function create() {
    			create_component(landing.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(landing, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const landing_changes = {};

    			if (!updating_show && dirty & /*show*/ 1) {
    				updating_show = true;
    				landing_changes.show = /*show*/ ctx[0];
    				add_flush_callback(() => updating_show = false);
    			}

    			landing.$set(landing_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(landing.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(landing.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(landing, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(16:1) {#if show == 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let link;
    	let t;
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*show*/ ctx[0] == 0) return 0;
    		if (/*show*/ ctx[0] == 1) return 1;
    		if (/*show*/ ctx[0] == 2) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			link = element("link");
    			t = space();
    			main = element("main");
    			if (if_block) if_block.c();
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://fonts.googleapis.com/icon?family=Material+Icons");
    			add_location(link, file, 8, 1, 206);
    			attr_dev(main, "class", "svelte-105ulig");
    			add_location(main, file, 14, 0, 316);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t, anchor);
    			insert_dev(target, main, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(main);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let show = 0;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function landing_show_binding(value) {
    		show = value;
    		$$invalidate(0, show);
    	}

    	function box_show_binding(value) {
    		show = value;
    		$$invalidate(0, show);
    	}

    	function equal_show_binding(value) {
    		show = value;
    		$$invalidate(0, show);
    	}

    	$$self.$capture_state = () => ({ Box, Landing, Equal, show });

    	$$self.$inject_state = $$props => {
    		if ('show' in $$props) $$invalidate(0, show = $$props.show);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [show, landing_show_binding, box_show_binding, equal_show_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
