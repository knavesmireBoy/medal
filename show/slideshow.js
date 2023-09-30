/*jslint es6:true*/

(function() {
  "use strict";

  /*
  var x = partial(invoke, gtEq);
  console.log(x(...[22,22]));
  //console.log(x.apply(null,[22,5]));
  */

/*
  function composeES5() {
    for (var _len = arguments.length, fns = new Array(_len), _key = 0; _key < _len; _key++) {
      fns[_key] = arguments[_key];
    }
    return fns.reduce(function(f, g) {
      //anon is the iteratee
      return function anon() {
        //expects arguments to first function
        return f(g.apply(void 0, arguments)); //SETS THE NEW f AND g
      };
    });
  }

  function negate(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  }

  function getPredicate(cond, predicate) {
    return predicate(getResult(cond)) ? predicate : negate(predicate);
  }

  function clone(node) {
    return node.parentNode.parentNode.appendChild(node.parentNode.cloneNode(true));
  }
  */

  function always(arg){
    return function(){
      return arg;
    };
  }
  function validateProperty(o, p) {
    return o & o[p];
  }
  function equals (a, b) {
    return a === b;
  }

  function getter(o, p) {
    return o[p];
  }

  function caller (v, o, p) {
    return o[p](v);
  }
  function add (a, b) {
    return a + b;
  }
  function subtract (a, b) {
    return a - b;
  }

  function allEqual(arr) {
    return arr.every(val => val === arr[0]);
  }

  function noOp() {
    return function() {};
  }

  function existy(x) {
    return x != null;
  }

  function isFunction(func) {
    return func && {}.toString.call(func) === '[object Function]';
  }

  function getResult(arg) {
    return isFunction(arg) ? arg() : arg;
  }

  function doWhen(cond, action) {
    if (getResult(cond)) {
      return action();
    } else {
      return undefined;
    }
  }

  function curryFactory(i, defer) {
    let once = {
        imm: (f) => (arg) => f(arg),
        defer: (f) => (arg) => () => f(arg)
      },
      twice = {
        imm: (f) => (arg1) => (arg2) => f(arg2, arg1),
        defer: (f) => (arg1) => (arg2) => () => f(arg2, arg1)
      },
      thrice = {
        imm: (f) => (arg1) => (arg2) => (arg3) => f(arg3, arg2, arg1),
        defer: (f) => (arg1) => (arg2) => (arg3) => () => f(arg3, arg2, arg1),
      },
      quart = {
        imm: (f) => (arg1) => (arg2) => (arg3) => (arg4) => f(arg4, arg3, arg2, arg1),
        defer: (f) => (arg1) => (arg2) => (arg3) => (arg4) => () => f(arg4, arg3, arg2, arg1)
      },
      coll = [once, twice, thrice, quart],
      ret = coll[i];
    return ret && defer ? ret.defer : ret ? ret.imm : function() {};
  }

  function attrMap(el, map, style) {
    for (let [k, v] of map) {
      if (Array.isArray(v)) {
        v.forEach(prop => {
          attrMap(el, prop, true);
        });
        break;
      }
      if (k.match(/^te?xt$/)) {
        el.innerHTML = v;
        continue;
      }
      if (!style) {
        el.setAttribute(k, v);
      } else {
        el.style.setProperty(k, v);
      }
    }
    return el;
  }
  /* EXPECTS VALUE BEFORE KEY ON RIGHT CURRY*/
  function doMap(el, v, k) {
    var arg = v instanceof Map ? v : new Map([
      [k, v]
    ]);
    return attrMap(getResult(el), arg);
  }

  function invoke(f, ...args) {
    return f.apply(null, args.map(getResult));
  }

  function lazyVal(v, el, k) {
    return invoke(doMap, el, v, k);
  }

  function cat(first, ...rest) {
    if (existy(first)) {
      return first.concat.apply(first, rest);
    } else {
      return [];
    }
  }

  function construct(head, ...tail) {
    return head && cat([head], tail);
  }

  function dispatch(...funcs) {
    var size = funcs.length;
    return function(tgt, ...rest) {
      var ret,
        fn;
      for (fn of funcs) {
        try {
          ret = fn.apply(null, construct(tgt, rest));
          if (existy(ret)) {
            return ret;
          }
        } finally {
          noOp();
        }
      }
      return ret;
    };
  }

  function searcher(obj, ary) {
    /*noticed an issue with parentNode where on supply of an element, the initial value for reduce is the parent
    but THAT parent would get set on the second iteration to ITS parent so. When array has just one item reduce not really required*/
    if (ary && ary[1]) {
      return ary.reduce((acc, cur) => {
        return acc[cur] ? acc[cur] : acc;
      }, obj[ary[0]]);
    }
    return ary[0] ? obj[ary[0]] : obj;
  }
  //note a function that ignores any state of x or y will return the first element if true and last if false
  function best(fun, coll) {
    return [...coll].reduce((champ, contender) => fun(champ, contender) ? champ : contender);
  }

  //simple version that simply expects the remainder of the arguments on the second call
  function partial(func, ...args) {
    return function(...rest) {
      return func.apply(null, args.concat(rest));
    }
  }

  function getNextElement(node) {
    if (node && node.nodeType === 1) {
      return node;
    }
    if (node && node.nextSibling) {
      return getNextElement(node.nextSibling);
    }
    return null;
  }

  function cloneNode(node, bool) {
    var deep = existy(bool) ? bool : false;
    return node.cloneNode(deep);
  }

  function validateRemove(node) {
    return node && node.parentNode;
  }

  function removeElement(node) {
    return node.parentNode.removeChild(node);
  }

  function loadImage(url, id) {
    return new Promise((resolve, reject) => {
      //remove then append to produce a fresh promise
      let img = $(id).firstChild;
      //img = removeElement(img);
      //$(id).appendChild(img);
      img.addEventListener('load', e => resolve(img));
      img.addEventListener('error', () => {
        reject(new Error(`Failed to load image's URL: ${url()}`));
      });
      img.src = doParse(url());
    });
  }

  class Group {
    constructor() {
      this.members = [];
    }
    add(value) {
      if (!this.has(value)) {
        this.members.push(value);
      }
    }
    delete(value) {
      this.members = this.members.filter(v => v !== value);
    }
    has(value) {
      return this.members.includes(value);
    }
    static from(collection) {
      let group = new Group;
      for (let value of collection) {
        group.add(value);
      }
      return group;
    }
  }
  class LoopIterator {

    constructor(group) {
      this.group = group;
      this.position = 0;
      this.rev = false;
    }
    next(flag) {
      if (!flag && this.rev) {
        return this.previous(true);
      }
      this.position++;
      this.position = this.position % this.group.members.length;
      let result = {
        value: this.group.members[this.position],
        index: this.position
      };
      return result;
    }
    previous(flag) {
      if (!this.rev || flag) {
        this.group.members = this.group.members.reverse();
        this.position = this.group.members.length - 1 - (this.position);
        this.position = this.position % this.group.members.length;
        this.rev = !this.rev;
        return this.next(this.rev);
      } else {
        return this.next(this.rev);
      }
    }

    play() {
      return this.next(true).value;
    }
    find(tgt) {
      this.position = this.group.members.findIndex(m => m === tgt);
      let result = {
        value: this.group.members[this.position],
        index: this.position
      };
      return result;
    }
  }
  //https://medium.com/@dtipson/creating-an-es6ish-compose-in-javascript-ac580b95104a
  const eventing = function(type, fn, el, actions = ['preventDefault']) {

      function preventer(wrapped, actions, e) {
        actions.forEach(a => e[a]());
        return wrapped(e);
      }
      fn = fn.wrap(preventer, actions);

      el = getResult(el);

      return {
        render: function() {
          el.addEventListener(type, fn, false);
          return this;
        },
        unrender: function() {
          el.removeEventListener(type, fn, false);
          return this;
        }
      };
    },
    compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args))),
    //https://tech.mybuilder.com/partial-application-currying-and-composition-using-javascript-es6/
    curryLeft = (fn, ...args) => {
      let _curry = (args) => args.length < fn.length ? (..._args) => _curry([...args, ..._args]) : fn(...args);
      return _curry(args);
    },
    curryLeftDefer = (fn, ...args) => {
      let _curry = (args) => args.length < fn.length ? (..._args) => _curry([...args, ..._args]) : fn(...args);
      return () => _curry(args);
    },
    greaterOrEqual = partial(invoke, (a, b) => a >= b),
    gtEq = curryLeft((a, b) => a >= b),
    doAlt = actions => actions.reverse()[0](),
    defer_once = curryFactory(0, true),
    twice = curryFactory(1),
    twicedefer = curryFactory(1, true),
    thrice = curryFactory(2),
    thricedefer = curryFactory(2, true),
    quart = curryFactory(3),
    driller = twice(searcher),
    zero = twice(getter)(0),
    setter = thrice((v, o, p) => {
      o[p] = v;
    }),
    defercall = thricedefer(caller),
    parser = thrice((o, v, p) => o[p](v))('match')(/[^\/]+\.(jpg|png)$/),
    divideBy = twice((a, b) => a / b),
    $ = thrice(caller)('getElementById')(document),
    $q = thrice(caller)('querySelector')(document),
    $$ = thricedefer(caller)('getElementById')(document),
    enable = document.body.classList.add.bind(document.body.classList),
    disable = document.body.classList.remove.bind(document.body.classList),
    lcsp = curryLeftDefer(enable, 'lscp'),
    ptrt = curryLeftDefer(disable, 'lscp'),
    target = twice(getter)('target'),
    text_target = twice(getter)('innerHTML'),
    node_target = twice(getter)('nodeName'),
    text_from_target = thrice((e, s, g) => s(g(e)))(target)(text_target),
    node_from_target = thrice((e, s, g) => s(g(e)))(target)(node_target),
    getChild = compose(getNextElement, driller(['firstChild'])),
    getNewElement = dispatch(document.createElement.bind(document), twice(cloneNode)(true), document.createDocumentFragment.bind(document)),
    setAnchor = (function(render) {
      return function(anchor, refnode, strategy) {
        return compose(partial(partial(invoke, render), anchor, refnode), strategy);
      };
    }((anc, ref, el) => anc.insertBefore(el, ref))),
    append = function(flag) {
      if (flag) {
        return thricedefer(setAnchor)(getNewElement)(null);
      }
      return thrice(setAnchor)(getNewElement)(null);
    },
    insert = function(flag) {
      if (flag) {
        return function(ref, anc) {
          return thricedefer(setAnchor)(getNewElement)(ref)(anc);
        };
      }
      return function(ref, anc) {
        return thrice(setAnchor)(getNewElement)(ref)(anc);
      };
    },
    anCr = append(),
    anCrIn = insert(),
    removeNodeOnComplete = removeElement.wrap(function(f, node) {
      if (validateRemove(node)) {
        return f(node);
      }
    }),
    locator = function(forward, back) {
      var getLoc = (function(div, subtract, isGreaterEq) {
        var getThreshold = compose(div, subtract);
        return function(e) {
          var box = e.target.getBoundingClientRect(),
            res = isGreaterEq(partial(subtract, e.clientX, box.left), partial(getThreshold, box.right, box.left));
          //return e.clientX-box.left > (box.right-box.left)/2;
          return res;
        };
      }(divideBy(2), subtract, greaterOrEqual));

      return function(e) {
        return best(function(agg) {
          return agg[0](e);
        }, [
          [getLoc, forward],
          [always(true), back]
        ]);
      };
    },
    //myconsole = thrice(caller)('log')(console),
    doParse = compose(zero, parser),
    setCap = compose(quart((o, v, k, p) => o[p](k, v))('slice')(0)(-4), decodeURIComponent, doParse),
    setCaption = setCap.wrap(function(f, str) {
      var res = f(str);
      return res.match(/^Is\s.+/i) ? res + '?' : res;
    }),
    imgs = [...document.images].slice(0, -1), //kitchener
    gallery = document.querySelector('.gallery'),
    getSlideChild = compose(getChild, $$('slide')),
    getBaseChild = compose(getChild, $$('base')),
    getImgSrc = compose(driller(['src']), getBaseChild),
    buttons_cb = (str) => {
      var el = anCr($('controls'))('button');
      [
        ["innerHTML", str],
        ["id", str]
      ].forEach(([k, v]) => el[k] = v);
      return el;
    },
    close_cb = function(ancr) {
      return ancr;
      //return compose(thrice(doMap)('class')('contain'), thrice(doMap)('src')('poppy.png'), anCr(ancr))('img');
    },
    close_aside = function() {
      return compose(thrice(doMap)('id')('close'), anCrIn(gallery, document.querySelector('main')))('aside');
    },
    films = new LoopIterator(Group.from(imgs.map(img => img.src))),
    setindex = thrice(caller)('find')(films),
    nextcaller = thricedefer((v, o, p) => o[p]()[v])('next')(films)('value'),
    prevcaller = thricedefer((v, o, p) => o[p]()[v])('previous')(films)('value'),
    showtime = curryLeftDefer(enable, 'showtime'),
    playtime = curryLeftDefer(enable, 'inplay'),
    exitplay = curryLeftDefer(disable, 'inplay'),
    exitshow = curryLeftDefer(disable, 'showtime'),
    setCaptionOn = compose(thrice(lazyVal)('txt')($$('caption')), setCaption),
    setCaptionOnWrap = setCaptionOn.wrap((f, img) => {
      f(img.src);
      return img;
    }),
    observers = [thrice(lazyVal)('txt')($$('caption')), thrice(lazyVal)('href')($$('base'))],
    publish = defercall('forEach')(observers)(function(ptl, i) {
      var val = i ? getImgSrc() : compose(setCaption, getImgSrc);
      return ptl(val);
    }),
    orient = function(l, p) {
      return function(img) {
        best(partial(gtEq, getResult(img).clientWidth, getResult(img).clientHeight), [l, p])();
        return img.src;
      };
    },
    loader = function(caller, id) {
      return loadImage(caller, id).catch(error => console.error(error));
    },
    locate = eventing('click', function(e) {
      locator(twicedefer(loader)('base')(nextcaller), twicedefer(loader)('base')(prevcaller))(e)[1]();
      orient(lcsp, ptrt)(e.target);
      publish();
    }, gallery),
    doOpacity = function(flag) {
      var style,
        slide = $('slide'),
        val;
      if (slide) {
        val = flag ? 1 : recur.i / 100;
        style = new Map([
          ['opacity', val]
        ]);
        doMap(slide, new Map([
          ['style', [style]]
        ]));
      }
    },

    recur = (function(l, p) {

      function doBase() {
        loader(films.play.bind(films), 'base').then(paint).then(setPlayer);
      }

      function doSlide() {
        loader(compose(driller(['src']), getChild, $$('base')), 'slide').then(setCaptionOnWrap).then(doFormat);
      }

      function doRecur() {
        player.inc();
        recur.t = window.requestAnimationFrame(recur);
      }

      var doFormat = (img) => best(partial(gtEq, img.width, img.height), [l, p])(),
        test = function() {
          return [getBaseChild(), getSlideChild()].map((img) => img.width > img.height);
        },
        paint = function(str) {
          var coll = test(),
            bool = coll[0] === coll[1],
            m = bool ? 'remove' : 'add';
          document.body.classList[m]('swap');
          return !bool;
        },
        playmaker = (function() {
          var fadeOut = {
              validate: () => recur.i <= -81,
              inc: () => recur.i -= 1,
              reset: () => {
                doSlide();
                setPlayer(document.body.classList.contains('swap'));
              }
            },
            fadeIn = {
              validate: () => recur.i >= 300,
              inc: () => recur.i += 1,
              reset: () => {
                doBase();
              }
            },
            fade = {
              validate: () => recur.i <= -1,
              inc: () => recur.i -= 1,
              reset: () => {
                recur.i = 360;
                doSlide();
                doOpacity();
                doBase();
              }
            },
            actions = [fadeIn, fadeOut];
          return function(flag) {
            return flag ? actions.reverse()[0] : fade;
          };
        })(),
        setPlayer = function(arg) {
          player = playmaker(arg);
          recur();
        },
        player = playmaker();
      return function() {
        if (!recur.t) { //initial
          //swap next image into base because initial pic is a duplicate
          //loader(films.play.bind(films), 'base');
        }
        if (player.validate()) {
          player.reset();
        } else {
          doOpacity();
          doRecur();
        }
      };
    }(lcsp, ptrt)),

    clear = function(flag) {
      doOpacity(flag);
      window.cancelAnimationFrame(recur.t);
      recur.t = null;
    },
    machBase = function(source, target) {
      return new Promise((resolve, reject) => {
        var el = anCr($q('.gallery'))('a'),
          img = anCr(el)('img'),
          ptL = partial(doMap, el);
        [
          ['href', doParse(source.src)],
          ['id', target]
        ].forEach(([k, v]) => ptL(v, k));
        img.addEventListener('load', e => resolve(img));
        img.src = doParse(el.href);
      });
    },
    factory = function() {
      let playbutton = thricedefer(doMap)('txt')('play')($('play')),
        pausebutton = thricedefer(doMap)('txt')('pause')($('play')),
        removePause = compose(removeNodeOnComplete, $$('pause')),
        removeSlide = compose(removeNodeOnComplete, $$('slide')),
        removal = defercall('forEach')([removePause, removeSlide])(getResult),
        doButton = defer_once(doAlt)([playbutton, pausebutton]),
        doSlide = defer_once(doAlt)([clear, recur]),
        doDisplay = defer_once(doAlt)([playtime]),
        machSlide = function(source, target) {
          return new Promise((resolve, reject) => {
            var el = anCr($q('.gallery'))('a'),
              img = anCr(el)('img'),
              ptL = partial(doMap, el);
            [
              ['href', doParse($(source).href)],
              ['id', target]
            ].forEach(([k, v]) => ptL(v, k));
            img.addEventListener('load', e => resolve(img));
            img.src = doParse(el.href);
          });
        },
        machPause = function(src) {
          return new Promise((resolve, reject) => {
            var el = anCr($q('.gallery'))('a'),
              img = anCr(el)('img'),
              ptL = partial(doMap, el),
              styleAttrs = new Map([
                ["opacity", .5]
              ]);
            [
              ['id', 'pause'],
              ['style', [styleAttrs]]
            ].forEach(([k, v]) => ptL(v, k));

            img.addEventListener('load', e => resolve(img));
            img.src = doParse(src);
            img.id = "pauser";
          });
        },
        unpauser = function() {
          machPause('pause.png').then(el => {
            eventing('click', invoke_player, el).render();
          });
        },
        doPause = defer_once(doAlt)([partial(doWhen, $$('slide'), unpauser), removePause]),
        setOrient = partial(orient(lcsp, ptrt), $$('base')),
        relocate = curryLeftDefer(caller, null, locate, 'render'),
        doReLocate = curryLeftDefer(doWhen, $$('slide'), relocate),
        invoke_player = defercall('forEach')([doSlide, doButton, doDisplay, doPause])(getResult),
        next_driver = defercall('forEach')([defer_once(clear)(true), twicedefer(loader)('base')(nextcaller), playbutton('play'), exitplay, doReLocate, setOrient, publish, removal])(getResult),
        prev_driver = defercall('forEach')([defer_once(clear)(true), twicedefer(loader)('base')(prevcaller), playbutton('play'), exitplay, doReLocate, setOrient, publish, removal])(getResult),
        pauser = function() {
          if (!$('slide')) {
            machSlide('base', 'slide').then(el => {
              eventing('click', invoke_player, el).render();
              locate.unrender();
            });
          }
        },
        COR = function(predicate, action) {
          return {
            setSuccessor: function(s) {
              this.successor = s;
            },
            handle: function() {
              if (predicate.apply(this, arguments)) {
                return action.apply(this, arguments);
              } else if (this.successor) {
                return this.successor.handle.apply(this.successor, arguments);
              }
            },
            validate: function(str) {
              if (document.querySelector('.inplay') && recur.t && predicate(str)) {
                //return fresh instance on exiting slideshow IF in play mode
                return factory();
              }
              return this;
            }
          };
        },
        mynext = COR(partial(invoke, equals, 'next'), next_driver),
        myprev = COR(partial(invoke, equals, 'previous'), prev_driver),
        listen,
        myplayer = COR(function() {
          pauser();
          return true;
        }, invoke_player);
      myplayer.validate = function() {
        return this;
      };
      mynext.setSuccessor(myprev);
      myprev.setSuccessor(myplayer);
      recur.i = 50;//slide is clone of base initially, so fade can start
      return mynext;
    },
    setup = eventing('click', function(e) {
      if (!node_from_target(e).match(/img/i)) {
        return;
      }
      compose(setindex, driller(['target', 'src']))(e);
      compose(thrice(doMap)('id')('caption'), anCr(document.querySelector('main')))('aside');
      compose(thrice(doMap)('id')('controls'), anCr(document.querySelector('main')))('section');
      machBase(e.target, 'base').then(orient(lcsp, ptrt)).then((v) => thrice(doMap)('txt')(setCaption(v))($$('caption'))).then(showtime);

      let buttons = ['previous', 'play', 'next'].map(buttons_cb),
        chain = factory(),
        controls = eventing('click', function(e) {
          let str = text_from_target(e),
            node = node_from_target(e);
          if (node.match(/button/i)) {
            //!!REPLACE the original chain reference, validate will return either the original or brand new instance
            chain = chain.validate(str);
            chain.handle(str);
          }
        }, $('controls')),
        exit = eventing('click', function(e) {
          chain = chain.validate('next');
          chain.handle('next');
          exitshow();
          [this, $('caption'), $('controls'), $('base'), $('slide')].forEach(removeNodeOnComplete);
          locate.unrender();
          setup.render();
        }, compose(close_cb, close_aside));

      //listeners...
      [controls, exit, locate].forEach(o => o.render());
      setup.unrender();
    }, gallery);

  setup.render();
}());
