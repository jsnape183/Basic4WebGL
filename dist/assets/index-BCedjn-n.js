var oO=Object.defineProperty;var cO=(e,t,n)=>t in e?oO(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var Ke=(e,t,n)=>cO(e,typeof t!="symbol"?t+"":t,n);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const l of s)if(l.type==="childList")for(const c of l.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&i(c)}).observe(document,{childList:!0,subtree:!0});function n(s){const l={};return s.integrity&&(l.integrity=s.integrity),s.referrerPolicy&&(l.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?l.credentials="include":s.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function i(s){if(s.ep)return;s.ep=!0;const l=n(s);fetch(s.href,l)}})();function za(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var bp={exports:{}},Fl={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var px;function uO(){if(px)return Fl;px=1;var e=Symbol.for("react.transitional.element"),t=Symbol.for("react.fragment");function n(i,s,l){var c=null;if(l!==void 0&&(c=""+l),s.key!==void 0&&(c=""+s.key),"key"in s){l={};for(var d in s)d!=="key"&&(l[d]=s[d])}else l=s;return s=l.ref,{$$typeof:e,type:i,key:c,ref:s!==void 0?s:null,props:l}}return Fl.Fragment=t,Fl.jsx=n,Fl.jsxs=n,Fl}var hx;function dO(){return hx||(hx=1,bp.exports=uO()),bp.exports}var S=dO(),yp={exports:{}},nt={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var mx;function fO(){if(mx)return nt;mx=1;var e=Symbol.for("react.transitional.element"),t=Symbol.for("react.portal"),n=Symbol.for("react.fragment"),i=Symbol.for("react.strict_mode"),s=Symbol.for("react.profiler"),l=Symbol.for("react.consumer"),c=Symbol.for("react.context"),d=Symbol.for("react.forward_ref"),f=Symbol.for("react.suspense"),p=Symbol.for("react.memo"),m=Symbol.for("react.lazy"),g=Symbol.iterator;function y(x){return x===null||typeof x!="object"?null:(x=g&&x[g]||x["@@iterator"],typeof x=="function"?x:null)}var v={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},_=Object.assign,T={};function N(x,q,U){this.props=x,this.context=q,this.refs=T,this.updater=U||v}N.prototype.isReactComponent={},N.prototype.setState=function(x,q){if(typeof x!="object"&&typeof x!="function"&&x!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,x,q,"setState")},N.prototype.forceUpdate=function(x){this.updater.enqueueForceUpdate(this,x,"forceUpdate")};function C(){}C.prototype=N.prototype;function P(x,q,U){this.props=x,this.context=q,this.refs=T,this.updater=U||v}var k=P.prototype=new C;k.constructor=P,_(k,N.prototype),k.isPureReactComponent=!0;var I=Array.isArray,D={H:null,A:null,T:null,S:null,V:null},M=Object.prototype.hasOwnProperty;function z(x,q,U,R,fe,we){return U=we.ref,{$$typeof:e,type:x,key:q,ref:U!==void 0?U:null,props:we}}function Z(x,q){return z(x.type,q,void 0,void 0,void 0,x.props)}function W(x){return typeof x=="object"&&x!==null&&x.$$typeof===e}function $(x){var q={"=":"=0",":":"=2"};return"$"+x.replace(/[=:]/g,function(U){return q[U]})}var re=/\/+/g;function se(x,q){return typeof x=="object"&&x!==null&&x.key!=null?$(""+x.key):q.toString(36)}function Se(){}function ue(x){switch(x.status){case"fulfilled":return x.value;case"rejected":throw x.reason;default:switch(typeof x.status=="string"?x.then(Se,Se):(x.status="pending",x.then(function(q){x.status==="pending"&&(x.status="fulfilled",x.value=q)},function(q){x.status==="pending"&&(x.status="rejected",x.reason=q)})),x.status){case"fulfilled":return x.value;case"rejected":throw x.reason}}throw x}function V(x,q,U,R,fe){var we=typeof x;(we==="undefined"||we==="boolean")&&(x=null);var be=!1;if(x===null)be=!0;else switch(we){case"bigint":case"string":case"number":be=!0;break;case"object":switch(x.$$typeof){case e:case t:be=!0;break;case m:return be=x._init,V(be(x._payload),q,U,R,fe)}}if(be)return fe=fe(x),be=R===""?"."+se(x,0):R,I(fe)?(U="",be!=null&&(U=be.replace(re,"$&/")+"/"),V(fe,q,U,"",function(at){return at})):fe!=null&&(W(fe)&&(fe=Z(fe,U+(fe.key==null||x&&x.key===fe.key?"":(""+fe.key).replace(re,"$&/")+"/")+be)),q.push(fe)),1;be=0;var ke=R===""?".":R+":";if(I(x))for(var Me=0;Me<x.length;Me++)R=x[Me],we=ke+se(R,Me),be+=V(R,q,U,we,fe);else if(Me=y(x),typeof Me=="function")for(x=Me.call(x),Me=0;!(R=x.next()).done;)R=R.value,we=ke+se(R,Me++),be+=V(R,q,U,we,fe);else if(we==="object"){if(typeof x.then=="function")return V(ue(x),q,U,R,fe);throw q=String(x),Error("Objects are not valid as a React child (found: "+(q==="[object Object]"?"object with keys {"+Object.keys(x).join(", ")+"}":q)+"). If you meant to render a collection of children, use an array instead.")}return be}function B(x,q,U){if(x==null)return x;var R=[],fe=0;return V(x,R,"","",function(we){return q.call(U,we,fe++)}),R}function ee(x){if(x._status===-1){var q=x._result;q=q(),q.then(function(U){(x._status===0||x._status===-1)&&(x._status=1,x._result=U)},function(U){(x._status===0||x._status===-1)&&(x._status=2,x._result=U)}),x._status===-1&&(x._status=0,x._result=q)}if(x._status===1)return x._result.default;throw x._result}var X=typeof reportError=="function"?reportError:function(x){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var q=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof x=="object"&&x!==null&&typeof x.message=="string"?String(x.message):String(x),error:x});if(!window.dispatchEvent(q))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",x);return}console.error(x)};function pe(){}return nt.Children={map:B,forEach:function(x,q,U){B(x,function(){q.apply(this,arguments)},U)},count:function(x){var q=0;return B(x,function(){q++}),q},toArray:function(x){return B(x,function(q){return q})||[]},only:function(x){if(!W(x))throw Error("React.Children.only expected to receive a single React element child.");return x}},nt.Component=N,nt.Fragment=n,nt.Profiler=s,nt.PureComponent=P,nt.StrictMode=i,nt.Suspense=f,nt.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=D,nt.__COMPILER_RUNTIME={__proto__:null,c:function(x){return D.H.useMemoCache(x)}},nt.cache=function(x){return function(){return x.apply(null,arguments)}},nt.cloneElement=function(x,q,U){if(x==null)throw Error("The argument must be a React element, but you passed "+x+".");var R=_({},x.props),fe=x.key,we=void 0;if(q!=null)for(be in q.ref!==void 0&&(we=void 0),q.key!==void 0&&(fe=""+q.key),q)!M.call(q,be)||be==="key"||be==="__self"||be==="__source"||be==="ref"&&q.ref===void 0||(R[be]=q[be]);var be=arguments.length-2;if(be===1)R.children=U;else if(1<be){for(var ke=Array(be),Me=0;Me<be;Me++)ke[Me]=arguments[Me+2];R.children=ke}return z(x.type,fe,void 0,void 0,we,R)},nt.createContext=function(x){return x={$$typeof:c,_currentValue:x,_currentValue2:x,_threadCount:0,Provider:null,Consumer:null},x.Provider=x,x.Consumer={$$typeof:l,_context:x},x},nt.createElement=function(x,q,U){var R,fe={},we=null;if(q!=null)for(R in q.key!==void 0&&(we=""+q.key),q)M.call(q,R)&&R!=="key"&&R!=="__self"&&R!=="__source"&&(fe[R]=q[R]);var be=arguments.length-2;if(be===1)fe.children=U;else if(1<be){for(var ke=Array(be),Me=0;Me<be;Me++)ke[Me]=arguments[Me+2];fe.children=ke}if(x&&x.defaultProps)for(R in be=x.defaultProps,be)fe[R]===void 0&&(fe[R]=be[R]);return z(x,we,void 0,void 0,null,fe)},nt.createRef=function(){return{current:null}},nt.forwardRef=function(x){return{$$typeof:d,render:x}},nt.isValidElement=W,nt.lazy=function(x){return{$$typeof:m,_payload:{_status:-1,_result:x},_init:ee}},nt.memo=function(x,q){return{$$typeof:p,type:x,compare:q===void 0?null:q}},nt.startTransition=function(x){var q=D.T,U={};D.T=U;try{var R=x(),fe=D.S;fe!==null&&fe(U,R),typeof R=="object"&&R!==null&&typeof R.then=="function"&&R.then(pe,X)}catch(we){X(we)}finally{D.T=q}},nt.unstable_useCacheRefresh=function(){return D.H.useCacheRefresh()},nt.use=function(x){return D.H.use(x)},nt.useActionState=function(x,q,U){return D.H.useActionState(x,q,U)},nt.useCallback=function(x,q){return D.H.useCallback(x,q)},nt.useContext=function(x){return D.H.useContext(x)},nt.useDebugValue=function(){},nt.useDeferredValue=function(x,q){return D.H.useDeferredValue(x,q)},nt.useEffect=function(x,q,U){var R=D.H;if(typeof U=="function")throw Error("useEffect CRUD overload is not enabled in this build of React.");return R.useEffect(x,q)},nt.useId=function(){return D.H.useId()},nt.useImperativeHandle=function(x,q,U){return D.H.useImperativeHandle(x,q,U)},nt.useInsertionEffect=function(x,q){return D.H.useInsertionEffect(x,q)},nt.useLayoutEffect=function(x,q){return D.H.useLayoutEffect(x,q)},nt.useMemo=function(x,q){return D.H.useMemo(x,q)},nt.useOptimistic=function(x,q){return D.H.useOptimistic(x,q)},nt.useReducer=function(x,q,U){return D.H.useReducer(x,q,U)},nt.useRef=function(x){return D.H.useRef(x)},nt.useState=function(x){return D.H.useState(x)},nt.useSyncExternalStore=function(x,q,U){return D.H.useSyncExternalStore(x,q,U)},nt.useTransition=function(){return D.H.useTransition()},nt.version="19.1.1",nt}var gx;function Gu(){return gx||(gx=1,yp.exports=fO()),yp.exports}var E=Gu();const Wt=za(E);var vp={exports:{}},Ul={},_p={exports:{}},xp={};/**
 * @license React
 * scheduler.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var bx;function pO(){return bx||(bx=1,(function(e){function t(B,ee){var X=B.length;B.push(ee);e:for(;0<X;){var pe=X-1>>>1,x=B[pe];if(0<s(x,ee))B[pe]=ee,B[X]=x,X=pe;else break e}}function n(B){return B.length===0?null:B[0]}function i(B){if(B.length===0)return null;var ee=B[0],X=B.pop();if(X!==ee){B[0]=X;e:for(var pe=0,x=B.length,q=x>>>1;pe<q;){var U=2*(pe+1)-1,R=B[U],fe=U+1,we=B[fe];if(0>s(R,X))fe<x&&0>s(we,R)?(B[pe]=we,B[fe]=X,pe=fe):(B[pe]=R,B[U]=X,pe=U);else if(fe<x&&0>s(we,X))B[pe]=we,B[fe]=X,pe=fe;else break e}}return ee}function s(B,ee){var X=B.sortIndex-ee.sortIndex;return X!==0?X:B.id-ee.id}if(e.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var l=performance;e.unstable_now=function(){return l.now()}}else{var c=Date,d=c.now();e.unstable_now=function(){return c.now()-d}}var f=[],p=[],m=1,g=null,y=3,v=!1,_=!1,T=!1,N=!1,C=typeof setTimeout=="function"?setTimeout:null,P=typeof clearTimeout=="function"?clearTimeout:null,k=typeof setImmediate<"u"?setImmediate:null;function I(B){for(var ee=n(p);ee!==null;){if(ee.callback===null)i(p);else if(ee.startTime<=B)i(p),ee.sortIndex=ee.expirationTime,t(f,ee);else break;ee=n(p)}}function D(B){if(T=!1,I(B),!_)if(n(f)!==null)_=!0,M||(M=!0,se());else{var ee=n(p);ee!==null&&V(D,ee.startTime-B)}}var M=!1,z=-1,Z=5,W=-1;function $(){return N?!0:!(e.unstable_now()-W<Z)}function re(){if(N=!1,M){var B=e.unstable_now();W=B;var ee=!0;try{e:{_=!1,T&&(T=!1,P(z),z=-1),v=!0;var X=y;try{t:{for(I(B),g=n(f);g!==null&&!(g.expirationTime>B&&$());){var pe=g.callback;if(typeof pe=="function"){g.callback=null,y=g.priorityLevel;var x=pe(g.expirationTime<=B);if(B=e.unstable_now(),typeof x=="function"){g.callback=x,I(B),ee=!0;break t}g===n(f)&&i(f),I(B)}else i(f);g=n(f)}if(g!==null)ee=!0;else{var q=n(p);q!==null&&V(D,q.startTime-B),ee=!1}}break e}finally{g=null,y=X,v=!1}ee=void 0}}finally{ee?se():M=!1}}}var se;if(typeof k=="function")se=function(){k(re)};else if(typeof MessageChannel<"u"){var Se=new MessageChannel,ue=Se.port2;Se.port1.onmessage=re,se=function(){ue.postMessage(null)}}else se=function(){C(re,0)};function V(B,ee){z=C(function(){B(e.unstable_now())},ee)}e.unstable_IdlePriority=5,e.unstable_ImmediatePriority=1,e.unstable_LowPriority=4,e.unstable_NormalPriority=3,e.unstable_Profiling=null,e.unstable_UserBlockingPriority=2,e.unstable_cancelCallback=function(B){B.callback=null},e.unstable_forceFrameRate=function(B){0>B||125<B?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):Z=0<B?Math.floor(1e3/B):5},e.unstable_getCurrentPriorityLevel=function(){return y},e.unstable_next=function(B){switch(y){case 1:case 2:case 3:var ee=3;break;default:ee=y}var X=y;y=ee;try{return B()}finally{y=X}},e.unstable_requestPaint=function(){N=!0},e.unstable_runWithPriority=function(B,ee){switch(B){case 1:case 2:case 3:case 4:case 5:break;default:B=3}var X=y;y=B;try{return ee()}finally{y=X}},e.unstable_scheduleCallback=function(B,ee,X){var pe=e.unstable_now();switch(typeof X=="object"&&X!==null?(X=X.delay,X=typeof X=="number"&&0<X?pe+X:pe):X=pe,B){case 1:var x=-1;break;case 2:x=250;break;case 5:x=1073741823;break;case 4:x=1e4;break;default:x=5e3}return x=X+x,B={id:m++,callback:ee,priorityLevel:B,startTime:X,expirationTime:x,sortIndex:-1},X>pe?(B.sortIndex=X,t(p,B),n(f)===null&&B===n(p)&&(T?(P(z),z=-1):T=!0,V(D,X-pe))):(B.sortIndex=x,t(f,B),_||v||(_=!0,M||(M=!0,se()))),B},e.unstable_shouldYield=$,e.unstable_wrapCallback=function(B){var ee=y;return function(){var X=y;y=ee;try{return B.apply(this,arguments)}finally{y=X}}}})(xp)),xp}var yx;function hO(){return yx||(yx=1,_p.exports=pO()),_p.exports}var wp={exports:{}},An={};/**
 * @license React
 * react-dom.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var vx;function mO(){if(vx)return An;vx=1;var e=Gu();function t(f){var p="https://react.dev/errors/"+f;if(1<arguments.length){p+="?args[]="+encodeURIComponent(arguments[1]);for(var m=2;m<arguments.length;m++)p+="&args[]="+encodeURIComponent(arguments[m])}return"Minified React error #"+f+"; visit "+p+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function n(){}var i={d:{f:n,r:function(){throw Error(t(522))},D:n,C:n,L:n,m:n,X:n,S:n,M:n},p:0,findDOMNode:null},s=Symbol.for("react.portal");function l(f,p,m){var g=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:s,key:g==null?null:""+g,children:f,containerInfo:p,implementation:m}}var c=e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function d(f,p){if(f==="font")return"";if(typeof p=="string")return p==="use-credentials"?p:""}return An.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=i,An.createPortal=function(f,p){var m=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!p||p.nodeType!==1&&p.nodeType!==9&&p.nodeType!==11)throw Error(t(299));return l(f,p,null,m)},An.flushSync=function(f){var p=c.T,m=i.p;try{if(c.T=null,i.p=2,f)return f()}finally{c.T=p,i.p=m,i.d.f()}},An.preconnect=function(f,p){typeof f=="string"&&(p?(p=p.crossOrigin,p=typeof p=="string"?p==="use-credentials"?p:"":void 0):p=null,i.d.C(f,p))},An.prefetchDNS=function(f){typeof f=="string"&&i.d.D(f)},An.preinit=function(f,p){if(typeof f=="string"&&p&&typeof p.as=="string"){var m=p.as,g=d(m,p.crossOrigin),y=typeof p.integrity=="string"?p.integrity:void 0,v=typeof p.fetchPriority=="string"?p.fetchPriority:void 0;m==="style"?i.d.S(f,typeof p.precedence=="string"?p.precedence:void 0,{crossOrigin:g,integrity:y,fetchPriority:v}):m==="script"&&i.d.X(f,{crossOrigin:g,integrity:y,fetchPriority:v,nonce:typeof p.nonce=="string"?p.nonce:void 0})}},An.preinitModule=function(f,p){if(typeof f=="string")if(typeof p=="object"&&p!==null){if(p.as==null||p.as==="script"){var m=d(p.as,p.crossOrigin);i.d.M(f,{crossOrigin:m,integrity:typeof p.integrity=="string"?p.integrity:void 0,nonce:typeof p.nonce=="string"?p.nonce:void 0})}}else p==null&&i.d.M(f)},An.preload=function(f,p){if(typeof f=="string"&&typeof p=="object"&&p!==null&&typeof p.as=="string"){var m=p.as,g=d(m,p.crossOrigin);i.d.L(f,m,{crossOrigin:g,integrity:typeof p.integrity=="string"?p.integrity:void 0,nonce:typeof p.nonce=="string"?p.nonce:void 0,type:typeof p.type=="string"?p.type:void 0,fetchPriority:typeof p.fetchPriority=="string"?p.fetchPriority:void 0,referrerPolicy:typeof p.referrerPolicy=="string"?p.referrerPolicy:void 0,imageSrcSet:typeof p.imageSrcSet=="string"?p.imageSrcSet:void 0,imageSizes:typeof p.imageSizes=="string"?p.imageSizes:void 0,media:typeof p.media=="string"?p.media:void 0})}},An.preloadModule=function(f,p){if(typeof f=="string")if(p){var m=d(p.as,p.crossOrigin);i.d.m(f,{as:typeof p.as=="string"&&p.as!=="script"?p.as:void 0,crossOrigin:m,integrity:typeof p.integrity=="string"?p.integrity:void 0})}else i.d.m(f)},An.requestFormReset=function(f){i.d.r(f)},An.unstable_batchedUpdates=function(f,p){return f(p)},An.useFormState=function(f,p,m){return c.H.useFormState(f,p,m)},An.useFormStatus=function(){return c.H.useHostTransitionStatus()},An.version="19.1.1",An}var _x;function Iw(){if(_x)return wp.exports;_x=1;function e(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(e)}catch(t){console.error(t)}}return e(),wp.exports=mO(),wp.exports}/**
 * @license React
 * react-dom-client.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var xx;function gO(){if(xx)return Ul;xx=1;var e=hO(),t=Gu(),n=Iw();function i(r){var a="https://react.dev/errors/"+r;if(1<arguments.length){a+="?args[]="+encodeURIComponent(arguments[1]);for(var o=2;o<arguments.length;o++)a+="&args[]="+encodeURIComponent(arguments[o])}return"Minified React error #"+r+"; visit "+a+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function s(r){return!(!r||r.nodeType!==1&&r.nodeType!==9&&r.nodeType!==11)}function l(r){var a=r,o=r;if(r.alternate)for(;a.return;)a=a.return;else{r=a;do a=r,(a.flags&4098)!==0&&(o=a.return),r=a.return;while(r)}return a.tag===3?o:null}function c(r){if(r.tag===13){var a=r.memoizedState;if(a===null&&(r=r.alternate,r!==null&&(a=r.memoizedState)),a!==null)return a.dehydrated}return null}function d(r){if(l(r)!==r)throw Error(i(188))}function f(r){var a=r.alternate;if(!a){if(a=l(r),a===null)throw Error(i(188));return a!==r?null:r}for(var o=r,u=a;;){var h=o.return;if(h===null)break;var b=h.alternate;if(b===null){if(u=h.return,u!==null){o=u;continue}break}if(h.child===b.child){for(b=h.child;b;){if(b===o)return d(h),r;if(b===u)return d(h),a;b=b.sibling}throw Error(i(188))}if(o.return!==u.return)o=h,u=b;else{for(var w=!1,O=h.child;O;){if(O===o){w=!0,o=h,u=b;break}if(O===u){w=!0,u=h,o=b;break}O=O.sibling}if(!w){for(O=b.child;O;){if(O===o){w=!0,o=b,u=h;break}if(O===u){w=!0,u=b,o=h;break}O=O.sibling}if(!w)throw Error(i(189))}}if(o.alternate!==u)throw Error(i(190))}if(o.tag!==3)throw Error(i(188));return o.stateNode.current===o?r:a}function p(r){var a=r.tag;if(a===5||a===26||a===27||a===6)return r;for(r=r.child;r!==null;){if(a=p(r),a!==null)return a;r=r.sibling}return null}var m=Object.assign,g=Symbol.for("react.element"),y=Symbol.for("react.transitional.element"),v=Symbol.for("react.portal"),_=Symbol.for("react.fragment"),T=Symbol.for("react.strict_mode"),N=Symbol.for("react.profiler"),C=Symbol.for("react.provider"),P=Symbol.for("react.consumer"),k=Symbol.for("react.context"),I=Symbol.for("react.forward_ref"),D=Symbol.for("react.suspense"),M=Symbol.for("react.suspense_list"),z=Symbol.for("react.memo"),Z=Symbol.for("react.lazy"),W=Symbol.for("react.activity"),$=Symbol.for("react.memo_cache_sentinel"),re=Symbol.iterator;function se(r){return r===null||typeof r!="object"?null:(r=re&&r[re]||r["@@iterator"],typeof r=="function"?r:null)}var Se=Symbol.for("react.client.reference");function ue(r){if(r==null)return null;if(typeof r=="function")return r.$$typeof===Se?null:r.displayName||r.name||null;if(typeof r=="string")return r;switch(r){case _:return"Fragment";case N:return"Profiler";case T:return"StrictMode";case D:return"Suspense";case M:return"SuspenseList";case W:return"Activity"}if(typeof r=="object")switch(r.$$typeof){case v:return"Portal";case k:return(r.displayName||"Context")+".Provider";case P:return(r._context.displayName||"Context")+".Consumer";case I:var a=r.render;return r=r.displayName,r||(r=a.displayName||a.name||"",r=r!==""?"ForwardRef("+r+")":"ForwardRef"),r;case z:return a=r.displayName||null,a!==null?a:ue(r.type)||"Memo";case Z:a=r._payload,r=r._init;try{return ue(r(a))}catch{}}return null}var V=Array.isArray,B=t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,ee=n.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,X={pending:!1,data:null,method:null,action:null},pe=[],x=-1;function q(r){return{current:r}}function U(r){0>x||(r.current=pe[x],pe[x]=null,x--)}function R(r,a){x++,pe[x]=r.current,r.current=a}var fe=q(null),we=q(null),be=q(null),ke=q(null);function Me(r,a){switch(R(be,a),R(we,r),R(fe,null),a.nodeType){case 9:case 11:r=(r=a.documentElement)&&(r=r.namespaceURI)?F_(r):0;break;default:if(r=a.tagName,a=a.namespaceURI)a=F_(a),r=U_(a,r);else switch(r){case"svg":r=1;break;case"math":r=2;break;default:r=0}}U(fe),R(fe,r)}function at(){U(fe),U(we),U(be)}function $e(r){r.memoizedState!==null&&R(ke,r);var a=fe.current,o=U_(a,r.type);a!==o&&(R(we,r),R(fe,o))}function ie(r){we.current===r&&(U(fe),U(we)),ke.current===r&&(U(ke),Ll._currentValue=X)}var ze=Object.prototype.hasOwnProperty,st=e.unstable_scheduleCallback,lt=e.unstable_cancelCallback,Tt=e.unstable_shouldYield,Be=e.unstable_requestPaint,_t=e.unstable_now,Ve=e.unstable_getCurrentPriorityLevel,Ut=e.unstable_ImmediatePriority,Zt=e.unstable_UserBlockingPriority,Et=e.unstable_NormalPriority,Bn=e.unstable_LowPriority,hr=e.unstable_IdlePriority,Fn=e.log,Ci=e.unstable_setDisableYieldValue,ne=null,de=null;function Ae(r){if(typeof Fn=="function"&&Ci(r),de&&typeof de.setStrictMode=="function")try{de.setStrictMode(ne,r)}catch{}}var Ie=Math.clz32?Math.clz32:Un,gt=Math.log,Ht=Math.LN2;function Un(r){return r>>>=0,r===0?32:31-(gt(r)/Ht|0)|0}var mn=256,Mn=4194304;function dn(r){var a=r&42;if(a!==0)return a;switch(r&-r){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return r&4194048;case 4194304:case 8388608:case 16777216:case 33554432:return r&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return r}}function Vt(r,a,o){var u=r.pendingLanes;if(u===0)return 0;var h=0,b=r.suspendedLanes,w=r.pingedLanes;r=r.warmLanes;var O=u&134217727;return O!==0?(u=O&~b,u!==0?h=dn(u):(w&=O,w!==0?h=dn(w):o||(o=O&~r,o!==0&&(h=dn(o))))):(O=u&~b,O!==0?h=dn(O):w!==0?h=dn(w):o||(o=u&~r,o!==0&&(h=dn(o)))),h===0?0:a!==0&&a!==h&&(a&b)===0&&(b=h&-h,o=a&-a,b>=o||b===32&&(o&4194048)!==0)?a:h}function On(r,a){return(r.pendingLanes&~(r.suspendedLanes&~r.pingedLanes)&a)===0}function gn(r,a){switch(r){case 1:case 2:case 4:case 8:case 64:return a+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return a+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function sa(){var r=mn;return mn<<=1,(mn&4194048)===0&&(mn=256),r}function la(){var r=Mn;return Mn<<=1,(Mn&62914560)===0&&(Mn=4194304),r}function oa(r){for(var a=[],o=0;31>o;o++)a.push(r);return a}function Ft(r,a){r.pendingLanes|=a,a!==268435456&&(r.suspendedLanes=0,r.pingedLanes=0,r.warmLanes=0)}function Qt(r,a,o,u,h,b){var w=r.pendingLanes;r.pendingLanes=o,r.suspendedLanes=0,r.pingedLanes=0,r.warmLanes=0,r.expiredLanes&=o,r.entangledLanes&=o,r.errorRecoveryDisabledLanes&=o,r.shellSuspendCounter=0;var O=r.entanglements,L=r.expirationTimes,Y=r.hiddenUpdates;for(o=w&~o;0<o;){var le=31-Ie(o),ce=1<<le;O[le]=0,L[le]=-1;var Q=Y[le];if(Q!==null)for(Y[le]=null,le=0;le<Q.length;le++){var J=Q[le];J!==null&&(J.lane&=-536870913)}o&=~ce}u!==0&&j(r,u,0),b!==0&&h===0&&r.tag!==0&&(r.suspendedLanes|=b&~(w&~a))}function j(r,a,o){r.pendingLanes|=a,r.suspendedLanes&=~a;var u=31-Ie(a);r.entangledLanes|=a,r.entanglements[u]=r.entanglements[u]|1073741824|o&4194090}function ae(r,a){var o=r.entangledLanes|=a;for(r=r.entanglements;o;){var u=31-Ie(o),h=1<<u;h&a|r[u]&a&&(r[u]|=a),o&=~h}}function me(r){switch(r){case 2:r=1;break;case 8:r=4;break;case 32:r=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:r=128;break;case 268435456:r=134217728;break;default:r=0}return r}function De(r){return r&=-r,2<r?8<r?(r&134217727)!==0?32:268435456:8:2}function pt(){var r=ee.p;return r!==0?r:(r=window.event,r===void 0?32:lx(r.type))}function Ot(r,a){var o=ee.p;try{return ee.p=r,a()}finally{ee.p=o}}var _e=Math.random().toString(36).slice(2),ye="__reactFiber$"+_e,Te="__reactProps$"+_e,ht="__reactContainer$"+_e,Rt="__reactEvents$"+_e,Qn="__reactListeners$"+_e,Hn="__reactHandles$"+_e,mr="__reactResources$"+_e,Rr="__reactMarker$"+_e;function ca(r){delete r[ye],delete r[Te],delete r[Rt],delete r[Qn],delete r[Hn]}function Ti(r){var a=r[ye];if(a)return a;for(var o=r.parentNode;o;){if(a=o[ht]||o[ye]){if(o=a.alternate,a.child!==null||o!==null&&o.child!==null)for(r=V_(r);r!==null;){if(o=r[ye])return o;r=V_(r)}return a}r=o,o=r.parentNode}return null}function Oi(r){if(r=r[ye]||r[ht]){var a=r.tag;if(a===5||a===6||a===13||a===26||a===27||a===3)return r}return null}function ua(r){var a=r.tag;if(a===5||a===26||a===27||a===6)return r.stateNode;throw Error(i(33))}function Jr(r){var a=r[mr];return a||(a=r[mr]={hoistableStyles:new Map,hoistableScripts:new Map}),a}function Kt(r){r[Rr]=!0}var No=new Set,Ao={};function ei(r,a){Pn(r,a),Pn(r+"Capture",a)}function Pn(r,a){for(Ao[r]=a,r=0;r<a.length;r++)No.add(a[r])}var Do=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),Vs={},ko={};function bd(r){return ze.call(ko,r)?!0:ze.call(Vs,r)?!1:Do.test(r)?ko[r]=!0:(Vs[r]=!0,!1)}function qa(r,a,o){if(bd(a))if(o===null)r.removeAttribute(a);else{switch(typeof o){case"undefined":case"function":case"symbol":r.removeAttribute(a);return;case"boolean":var u=a.toLowerCase().slice(0,5);if(u!=="data-"&&u!=="aria-"){r.removeAttribute(a);return}}r.setAttribute(a,""+o)}}function ti(r,a,o){if(o===null)r.removeAttribute(a);else{switch(typeof o){case"undefined":case"function":case"symbol":case"boolean":r.removeAttribute(a);return}r.setAttribute(a,""+o)}}function Nr(r,a,o,u){if(u===null)r.removeAttribute(o);else{switch(typeof u){case"undefined":case"function":case"symbol":case"boolean":r.removeAttribute(o);return}r.setAttributeNS(a,o,""+u)}}var ve,Le;function et(r){if(ve===void 0)try{throw Error()}catch(o){var a=o.stack.trim().match(/\n( *(at )?)/);ve=a&&a[1]||"",Le=-1<o.stack.indexOf(`
    at`)?" (<anonymous>)":-1<o.stack.indexOf("@")?"@unknown:0:0":""}return`
`+ve+r+Le}var Nt=!1;function Yt(r,a){if(!r||Nt)return"";Nt=!0;var o=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var u={DetermineComponentFrameRoot:function(){try{if(a){var ce=function(){throw Error()};if(Object.defineProperty(ce.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(ce,[])}catch(J){var Q=J}Reflect.construct(r,[],ce)}else{try{ce.call()}catch(J){Q=J}r.call(ce.prototype)}}else{try{throw Error()}catch(J){Q=J}(ce=r())&&typeof ce.catch=="function"&&ce.catch(function(){})}}catch(J){if(J&&Q&&typeof J.stack=="string")return[J.stack,Q.stack]}return[null,null]}};u.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var h=Object.getOwnPropertyDescriptor(u.DetermineComponentFrameRoot,"name");h&&h.configurable&&Object.defineProperty(u.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var b=u.DetermineComponentFrameRoot(),w=b[0],O=b[1];if(w&&O){var L=w.split(`
`),Y=O.split(`
`);for(h=u=0;u<L.length&&!L[u].includes("DetermineComponentFrameRoot");)u++;for(;h<Y.length&&!Y[h].includes("DetermineComponentFrameRoot");)h++;if(u===L.length||h===Y.length)for(u=L.length-1,h=Y.length-1;1<=u&&0<=h&&L[u]!==Y[h];)h--;for(;1<=u&&0<=h;u--,h--)if(L[u]!==Y[h]){if(u!==1||h!==1)do if(u--,h--,0>h||L[u]!==Y[h]){var le=`
`+L[u].replace(" at new "," at ");return r.displayName&&le.includes("<anonymous>")&&(le=le.replace("<anonymous>",r.displayName)),le}while(1<=u&&0<=h);break}}}finally{Nt=!1,Error.prepareStackTrace=o}return(o=r?r.displayName||r.name:"")?et(o):""}function Jn(r){switch(r.tag){case 26:case 27:case 5:return et(r.type);case 16:return et("Lazy");case 13:return et("Suspense");case 19:return et("SuspenseList");case 0:case 15:return Yt(r.type,!1);case 11:return Yt(r.type.render,!1);case 1:return Yt(r.type,!0);case 31:return et("Activity");default:return""}}function Ar(r){try{var a="";do a+=Jn(r),r=r.return;while(r);return a}catch(o){return`
Error generating stack: `+o.message+`
`+o.stack}}function xn(r){switch(typeof r){case"bigint":case"boolean":case"number":case"string":case"undefined":return r;case"object":return r;default:return""}}function Rn(r){var a=r.type;return(r=r.nodeName)&&r.toLowerCase()==="input"&&(a==="checkbox"||a==="radio")}function gr(r){var a=Rn(r)?"checked":"value",o=Object.getOwnPropertyDescriptor(r.constructor.prototype,a),u=""+r[a];if(!r.hasOwnProperty(a)&&typeof o<"u"&&typeof o.get=="function"&&typeof o.set=="function"){var h=o.get,b=o.set;return Object.defineProperty(r,a,{configurable:!0,get:function(){return h.call(this)},set:function(w){u=""+w,b.call(this,w)}}),Object.defineProperty(r,a,{enumerable:o.enumerable}),{getValue:function(){return u},setValue:function(w){u=""+w},stopTracking:function(){r._valueTracker=null,delete r[a]}}}}function da(r){r._valueTracker||(r._valueTracker=gr(r))}function Ks(r){if(!r)return!1;var a=r._valueTracker;if(!a)return!0;var o=a.getValue(),u="";return r&&(u=Rn(r)?r.checked?"true":"false":r.value),r=u,r!==o?(a.setValue(r),!0):!1}function fa(r){if(r=r||(typeof document<"u"?document:void 0),typeof r>"u")return null;try{return r.activeElement||r.body}catch{return r.body}}var yd=/[\n"\\]/g;function qn(r){return r.replace(yd,function(a){return"\\"+a.charCodeAt(0).toString(16)+" "})}function Ys(r,a,o,u,h,b,w,O){r.name="",w!=null&&typeof w!="function"&&typeof w!="symbol"&&typeof w!="boolean"?r.type=w:r.removeAttribute("type"),a!=null?w==="number"?(a===0&&r.value===""||r.value!=a)&&(r.value=""+xn(a)):r.value!==""+xn(a)&&(r.value=""+xn(a)):w!=="submit"&&w!=="reset"||r.removeAttribute("value"),a!=null?Ri(r,w,xn(a)):o!=null?Ri(r,w,xn(o)):u!=null&&r.removeAttribute("value"),h==null&&b!=null&&(r.defaultChecked=!!b),h!=null&&(r.checked=h&&typeof h!="function"&&typeof h!="symbol"),O!=null&&typeof O!="function"&&typeof O!="symbol"&&typeof O!="boolean"?r.name=""+xn(O):r.removeAttribute("name")}function Mo(r,a,o,u,h,b,w,O){if(b!=null&&typeof b!="function"&&typeof b!="symbol"&&typeof b!="boolean"&&(r.type=b),a!=null||o!=null){if(!(b!=="submit"&&b!=="reset"||a!=null))return;o=o!=null?""+xn(o):"",a=a!=null?""+xn(a):o,O||a===r.value||(r.value=a),r.defaultValue=a}u=u??h,u=typeof u!="function"&&typeof u!="symbol"&&!!u,r.checked=O?r.checked:!!u,r.defaultChecked=!!u,w!=null&&typeof w!="function"&&typeof w!="symbol"&&typeof w!="boolean"&&(r.name=w)}function Ri(r,a,o){a==="number"&&fa(r.ownerDocument)===r||r.defaultValue===""+o||(r.defaultValue=""+o)}function ni(r,a,o,u){if(r=r.options,a){a={};for(var h=0;h<o.length;h++)a["$"+o[h]]=!0;for(o=0;o<r.length;o++)h=a.hasOwnProperty("$"+r[o].value),r[o].selected!==h&&(r[o].selected=h),h&&u&&(r[o].defaultSelected=!0)}else{for(o=""+xn(o),a=null,h=0;h<r.length;h++){if(r[h].value===o){r[h].selected=!0,u&&(r[h].defaultSelected=!0);return}a!==null||r[h].disabled||(a=r[h])}a!==null&&(a.selected=!0)}}function er(r,a,o){if(a!=null&&(a=""+xn(a),a!==r.value&&(r.value=a),o==null)){r.defaultValue!==a&&(r.defaultValue=a);return}r.defaultValue=o!=null?""+xn(o):""}function Po(r,a,o,u){if(a==null){if(u!=null){if(o!=null)throw Error(i(92));if(V(u)){if(1<u.length)throw Error(i(93));u=u[0]}o=u}o==null&&(o=""),a=o}o=xn(a),r.defaultValue=o,u=r.textContent,u===o&&u!==""&&u!==null&&(r.value=u)}function Ur(r,a){if(a){var o=r.firstChild;if(o&&o===r.lastChild&&o.nodeType===3){o.nodeValue=a;return}}r.textContent=a}var Ze=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function Xs(r,a,o){var u=a.indexOf("--")===0;o==null||typeof o=="boolean"||o===""?u?r.setProperty(a,""):a==="float"?r.cssFloat="":r[a]="":u?r.setProperty(a,o):typeof o!="number"||o===0||Ze.has(a)?a==="float"?r.cssFloat=o:r[a]=(""+o).trim():r[a]=o+"px"}function sn(r,a,o){if(a!=null&&typeof a!="object")throw Error(i(62));if(r=r.style,o!=null){for(var u in o)!o.hasOwnProperty(u)||a!=null&&a.hasOwnProperty(u)||(u.indexOf("--")===0?r.setProperty(u,""):u==="float"?r.cssFloat="":r[u]="");for(var h in a)u=a[h],a.hasOwnProperty(h)&&o[h]!==u&&Xs(r,h,u)}else for(var b in a)a.hasOwnProperty(b)&&Xs(r,b,a[b])}function At(r){if(r.indexOf("-")===-1)return!1;switch(r){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var Ga=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),ri=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function Ni(r){return ri.test(""+r)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":r}var pa=null;function Ce(r){return r=r.target||r.srcElement||window,r.correspondingUseElement&&(r=r.correspondingUseElement),r.nodeType===3?r.parentNode:r}var Re=null,Xe=null;function xt(r){var a=Oi(r);if(a&&(r=a.stateNode)){var o=r[Te]||null;e:switch(r=a.stateNode,a.type){case"input":if(Ys(r,o.value,o.defaultValue,o.defaultValue,o.checked,o.defaultChecked,o.type,o.name),a=o.name,o.type==="radio"&&a!=null){for(o=r;o.parentNode;)o=o.parentNode;for(o=o.querySelectorAll('input[name="'+qn(""+a)+'"][type="radio"]'),a=0;a<o.length;a++){var u=o[a];if(u!==r&&u.form===r.form){var h=u[Te]||null;if(!h)throw Error(i(90));Ys(u,h.value,h.defaultValue,h.defaultValue,h.checked,h.defaultChecked,h.type,h.name)}}for(a=0;a<o.length;a++)u=o[a],u.form===r.form&&Ks(u)}break e;case"textarea":er(r,o.value,o.defaultValue);break e;case"select":a=o.value,a!=null&&ni(r,!!o.multiple,a,!1)}}}var ln=!1;function br(r,a,o){if(ln)return r(a,o);ln=!0;try{var u=r(a);return u}finally{if(ln=!1,(Re!==null||Xe!==null)&&(vc(),Re&&(a=Re,r=Xe,Xe=Re=null,xt(a),r)))for(a=0;a<r.length;a++)xt(r[a])}}function ha(r,a){var o=r.stateNode;if(o===null)return null;var u=o[Te]||null;if(u===null)return null;o=u[a];e:switch(a){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(u=!u.disabled)||(r=r.type,u=!(r==="button"||r==="input"||r==="select"||r==="textarea")),r=!u;break e;default:r=!1}if(r)return null;if(o&&typeof o!="function")throw Error(i(231,a,typeof o));return o}var Dr=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),vd=!1;if(Dr)try{var Ws={};Object.defineProperty(Ws,"passive",{get:function(){vd=!0}}),window.addEventListener("test",Ws,Ws),window.removeEventListener("test",Ws,Ws)}catch{vd=!1}var Ai=null,_d=null,Io=null;function Gb(){if(Io)return Io;var r,a=_d,o=a.length,u,h="value"in Ai?Ai.value:Ai.textContent,b=h.length;for(r=0;r<o&&a[r]===h[r];r++);var w=o-r;for(u=1;u<=w&&a[o-u]===h[b-u];u++);return Io=h.slice(r,1<u?1-u:void 0)}function Lo(r){var a=r.keyCode;return"charCode"in r?(r=r.charCode,r===0&&a===13&&(r=13)):r=a,r===10&&(r=13),32<=r||r===13?r:0}function jo(){return!0}function Vb(){return!1}function Gn(r){function a(o,u,h,b,w){this._reactName=o,this._targetInst=h,this.type=u,this.nativeEvent=b,this.target=w,this.currentTarget=null;for(var O in r)r.hasOwnProperty(O)&&(o=r[O],this[O]=o?o(b):b[O]);return this.isDefaultPrevented=(b.defaultPrevented!=null?b.defaultPrevented:b.returnValue===!1)?jo:Vb,this.isPropagationStopped=Vb,this}return m(a.prototype,{preventDefault:function(){this.defaultPrevented=!0;var o=this.nativeEvent;o&&(o.preventDefault?o.preventDefault():typeof o.returnValue!="unknown"&&(o.returnValue=!1),this.isDefaultPrevented=jo)},stopPropagation:function(){var o=this.nativeEvent;o&&(o.stopPropagation?o.stopPropagation():typeof o.cancelBubble!="unknown"&&(o.cancelBubble=!0),this.isPropagationStopped=jo)},persist:function(){},isPersistent:jo}),a}var ma={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(r){return r.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},$o=Gn(ma),Zs=m({},ma,{view:0,detail:0}),oC=Gn(Zs),xd,wd,Qs,zo=m({},Zs,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Sd,button:0,buttons:0,relatedTarget:function(r){return r.relatedTarget===void 0?r.fromElement===r.srcElement?r.toElement:r.fromElement:r.relatedTarget},movementX:function(r){return"movementX"in r?r.movementX:(r!==Qs&&(Qs&&r.type==="mousemove"?(xd=r.screenX-Qs.screenX,wd=r.screenY-Qs.screenY):wd=xd=0,Qs=r),xd)},movementY:function(r){return"movementY"in r?r.movementY:wd}}),Kb=Gn(zo),cC=m({},zo,{dataTransfer:0}),uC=Gn(cC),dC=m({},Zs,{relatedTarget:0}),Ed=Gn(dC),fC=m({},ma,{animationName:0,elapsedTime:0,pseudoElement:0}),pC=Gn(fC),hC=m({},ma,{clipboardData:function(r){return"clipboardData"in r?r.clipboardData:window.clipboardData}}),mC=Gn(hC),gC=m({},ma,{data:0}),Yb=Gn(gC),bC={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},yC={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},vC={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function _C(r){var a=this.nativeEvent;return a.getModifierState?a.getModifierState(r):(r=vC[r])?!!a[r]:!1}function Sd(){return _C}var xC=m({},Zs,{key:function(r){if(r.key){var a=bC[r.key]||r.key;if(a!=="Unidentified")return a}return r.type==="keypress"?(r=Lo(r),r===13?"Enter":String.fromCharCode(r)):r.type==="keydown"||r.type==="keyup"?yC[r.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Sd,charCode:function(r){return r.type==="keypress"?Lo(r):0},keyCode:function(r){return r.type==="keydown"||r.type==="keyup"?r.keyCode:0},which:function(r){return r.type==="keypress"?Lo(r):r.type==="keydown"||r.type==="keyup"?r.keyCode:0}}),wC=Gn(xC),EC=m({},zo,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Xb=Gn(EC),SC=m({},Zs,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Sd}),CC=Gn(SC),TC=m({},ma,{propertyName:0,elapsedTime:0,pseudoElement:0}),OC=Gn(TC),RC=m({},zo,{deltaX:function(r){return"deltaX"in r?r.deltaX:"wheelDeltaX"in r?-r.wheelDeltaX:0},deltaY:function(r){return"deltaY"in r?r.deltaY:"wheelDeltaY"in r?-r.wheelDeltaY:"wheelDelta"in r?-r.wheelDelta:0},deltaZ:0,deltaMode:0}),NC=Gn(RC),AC=m({},ma,{newState:0,oldState:0}),DC=Gn(AC),kC=[9,13,27,32],Cd=Dr&&"CompositionEvent"in window,Js=null;Dr&&"documentMode"in document&&(Js=document.documentMode);var MC=Dr&&"TextEvent"in window&&!Js,Wb=Dr&&(!Cd||Js&&8<Js&&11>=Js),Zb=" ",Qb=!1;function Jb(r,a){switch(r){case"keyup":return kC.indexOf(a.keyCode)!==-1;case"keydown":return a.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function ey(r){return r=r.detail,typeof r=="object"&&"data"in r?r.data:null}var Va=!1;function PC(r,a){switch(r){case"compositionend":return ey(a);case"keypress":return a.which!==32?null:(Qb=!0,Zb);case"textInput":return r=a.data,r===Zb&&Qb?null:r;default:return null}}function IC(r,a){if(Va)return r==="compositionend"||!Cd&&Jb(r,a)?(r=Gb(),Io=_d=Ai=null,Va=!1,r):null;switch(r){case"paste":return null;case"keypress":if(!(a.ctrlKey||a.altKey||a.metaKey)||a.ctrlKey&&a.altKey){if(a.char&&1<a.char.length)return a.char;if(a.which)return String.fromCharCode(a.which)}return null;case"compositionend":return Wb&&a.locale!=="ko"?null:a.data;default:return null}}var LC={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function ty(r){var a=r&&r.nodeName&&r.nodeName.toLowerCase();return a==="input"?!!LC[r.type]:a==="textarea"}function ny(r,a,o,u){Re?Xe?Xe.push(u):Xe=[u]:Re=u,a=Cc(a,"onChange"),0<a.length&&(o=new $o("onChange","change",null,o,u),r.push({event:o,listeners:a}))}var el=null,tl=null;function jC(r){L_(r,0)}function Bo(r){var a=ua(r);if(Ks(a))return r}function ry(r,a){if(r==="change")return a}var iy=!1;if(Dr){var Td;if(Dr){var Od="oninput"in document;if(!Od){var ay=document.createElement("div");ay.setAttribute("oninput","return;"),Od=typeof ay.oninput=="function"}Td=Od}else Td=!1;iy=Td&&(!document.documentMode||9<document.documentMode)}function sy(){el&&(el.detachEvent("onpropertychange",ly),tl=el=null)}function ly(r){if(r.propertyName==="value"&&Bo(tl)){var a=[];ny(a,tl,r,Ce(r)),br(jC,a)}}function $C(r,a,o){r==="focusin"?(sy(),el=a,tl=o,el.attachEvent("onpropertychange",ly)):r==="focusout"&&sy()}function zC(r){if(r==="selectionchange"||r==="keyup"||r==="keydown")return Bo(tl)}function BC(r,a){if(r==="click")return Bo(a)}function FC(r,a){if(r==="input"||r==="change")return Bo(a)}function UC(r,a){return r===a&&(r!==0||1/r===1/a)||r!==r&&a!==a}var tr=typeof Object.is=="function"?Object.is:UC;function nl(r,a){if(tr(r,a))return!0;if(typeof r!="object"||r===null||typeof a!="object"||a===null)return!1;var o=Object.keys(r),u=Object.keys(a);if(o.length!==u.length)return!1;for(u=0;u<o.length;u++){var h=o[u];if(!ze.call(a,h)||!tr(r[h],a[h]))return!1}return!0}function oy(r){for(;r&&r.firstChild;)r=r.firstChild;return r}function cy(r,a){var o=oy(r);r=0;for(var u;o;){if(o.nodeType===3){if(u=r+o.textContent.length,r<=a&&u>=a)return{node:o,offset:a-r};r=u}e:{for(;o;){if(o.nextSibling){o=o.nextSibling;break e}o=o.parentNode}o=void 0}o=oy(o)}}function uy(r,a){return r&&a?r===a?!0:r&&r.nodeType===3?!1:a&&a.nodeType===3?uy(r,a.parentNode):"contains"in r?r.contains(a):r.compareDocumentPosition?!!(r.compareDocumentPosition(a)&16):!1:!1}function dy(r){r=r!=null&&r.ownerDocument!=null&&r.ownerDocument.defaultView!=null?r.ownerDocument.defaultView:window;for(var a=fa(r.document);a instanceof r.HTMLIFrameElement;){try{var o=typeof a.contentWindow.location.href=="string"}catch{o=!1}if(o)r=a.contentWindow;else break;a=fa(r.document)}return a}function Rd(r){var a=r&&r.nodeName&&r.nodeName.toLowerCase();return a&&(a==="input"&&(r.type==="text"||r.type==="search"||r.type==="tel"||r.type==="url"||r.type==="password")||a==="textarea"||r.contentEditable==="true")}var HC=Dr&&"documentMode"in document&&11>=document.documentMode,Ka=null,Nd=null,rl=null,Ad=!1;function fy(r,a,o){var u=o.window===o?o.document:o.nodeType===9?o:o.ownerDocument;Ad||Ka==null||Ka!==fa(u)||(u=Ka,"selectionStart"in u&&Rd(u)?u={start:u.selectionStart,end:u.selectionEnd}:(u=(u.ownerDocument&&u.ownerDocument.defaultView||window).getSelection(),u={anchorNode:u.anchorNode,anchorOffset:u.anchorOffset,focusNode:u.focusNode,focusOffset:u.focusOffset}),rl&&nl(rl,u)||(rl=u,u=Cc(Nd,"onSelect"),0<u.length&&(a=new $o("onSelect","select",null,a,o),r.push({event:a,listeners:u}),a.target=Ka)))}function ga(r,a){var o={};return o[r.toLowerCase()]=a.toLowerCase(),o["Webkit"+r]="webkit"+a,o["Moz"+r]="moz"+a,o}var Ya={animationend:ga("Animation","AnimationEnd"),animationiteration:ga("Animation","AnimationIteration"),animationstart:ga("Animation","AnimationStart"),transitionrun:ga("Transition","TransitionRun"),transitionstart:ga("Transition","TransitionStart"),transitioncancel:ga("Transition","TransitionCancel"),transitionend:ga("Transition","TransitionEnd")},Dd={},py={};Dr&&(py=document.createElement("div").style,"AnimationEvent"in window||(delete Ya.animationend.animation,delete Ya.animationiteration.animation,delete Ya.animationstart.animation),"TransitionEvent"in window||delete Ya.transitionend.transition);function ba(r){if(Dd[r])return Dd[r];if(!Ya[r])return r;var a=Ya[r],o;for(o in a)if(a.hasOwnProperty(o)&&o in py)return Dd[r]=a[o];return r}var hy=ba("animationend"),my=ba("animationiteration"),gy=ba("animationstart"),qC=ba("transitionrun"),GC=ba("transitionstart"),VC=ba("transitioncancel"),by=ba("transitionend"),yy=new Map,kd="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");kd.push("scrollEnd");function kr(r,a){yy.set(r,a),ei(a,[r])}var vy=new WeakMap;function yr(r,a){if(typeof r=="object"&&r!==null){var o=vy.get(r);return o!==void 0?o:(a={value:r,source:a,stack:Ar(a)},vy.set(r,a),a)}return{value:r,source:a,stack:Ar(a)}}var vr=[],Xa=0,Md=0;function Fo(){for(var r=Xa,a=Md=Xa=0;a<r;){var o=vr[a];vr[a++]=null;var u=vr[a];vr[a++]=null;var h=vr[a];vr[a++]=null;var b=vr[a];if(vr[a++]=null,u!==null&&h!==null){var w=u.pending;w===null?h.next=h:(h.next=w.next,w.next=h),u.pending=h}b!==0&&_y(o,h,b)}}function Uo(r,a,o,u){vr[Xa++]=r,vr[Xa++]=a,vr[Xa++]=o,vr[Xa++]=u,Md|=u,r.lanes|=u,r=r.alternate,r!==null&&(r.lanes|=u)}function Pd(r,a,o,u){return Uo(r,a,o,u),Ho(r)}function Wa(r,a){return Uo(r,null,null,a),Ho(r)}function _y(r,a,o){r.lanes|=o;var u=r.alternate;u!==null&&(u.lanes|=o);for(var h=!1,b=r.return;b!==null;)b.childLanes|=o,u=b.alternate,u!==null&&(u.childLanes|=o),b.tag===22&&(r=b.stateNode,r===null||r._visibility&1||(h=!0)),r=b,b=b.return;return r.tag===3?(b=r.stateNode,h&&a!==null&&(h=31-Ie(o),r=b.hiddenUpdates,u=r[h],u===null?r[h]=[a]:u.push(a),a.lane=o|536870912),b):null}function Ho(r){if(50<Rl)throw Rl=0,Ff=null,Error(i(185));for(var a=r.return;a!==null;)r=a,a=r.return;return r.tag===3?r.stateNode:null}var Za={};function KC(r,a,o,u){this.tag=r,this.key=o,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=a,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=u,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function nr(r,a,o,u){return new KC(r,a,o,u)}function Id(r){return r=r.prototype,!(!r||!r.isReactComponent)}function ii(r,a){var o=r.alternate;return o===null?(o=nr(r.tag,a,r.key,r.mode),o.elementType=r.elementType,o.type=r.type,o.stateNode=r.stateNode,o.alternate=r,r.alternate=o):(o.pendingProps=a,o.type=r.type,o.flags=0,o.subtreeFlags=0,o.deletions=null),o.flags=r.flags&65011712,o.childLanes=r.childLanes,o.lanes=r.lanes,o.child=r.child,o.memoizedProps=r.memoizedProps,o.memoizedState=r.memoizedState,o.updateQueue=r.updateQueue,a=r.dependencies,o.dependencies=a===null?null:{lanes:a.lanes,firstContext:a.firstContext},o.sibling=r.sibling,o.index=r.index,o.ref=r.ref,o.refCleanup=r.refCleanup,o}function xy(r,a){r.flags&=65011714;var o=r.alternate;return o===null?(r.childLanes=0,r.lanes=a,r.child=null,r.subtreeFlags=0,r.memoizedProps=null,r.memoizedState=null,r.updateQueue=null,r.dependencies=null,r.stateNode=null):(r.childLanes=o.childLanes,r.lanes=o.lanes,r.child=o.child,r.subtreeFlags=0,r.deletions=null,r.memoizedProps=o.memoizedProps,r.memoizedState=o.memoizedState,r.updateQueue=o.updateQueue,r.type=o.type,a=o.dependencies,r.dependencies=a===null?null:{lanes:a.lanes,firstContext:a.firstContext}),r}function qo(r,a,o,u,h,b){var w=0;if(u=r,typeof r=="function")Id(r)&&(w=1);else if(typeof r=="string")w=XT(r,o,fe.current)?26:r==="html"||r==="head"||r==="body"?27:5;else e:switch(r){case W:return r=nr(31,o,a,h),r.elementType=W,r.lanes=b,r;case _:return ya(o.children,h,b,a);case T:w=8,h|=24;break;case N:return r=nr(12,o,a,h|2),r.elementType=N,r.lanes=b,r;case D:return r=nr(13,o,a,h),r.elementType=D,r.lanes=b,r;case M:return r=nr(19,o,a,h),r.elementType=M,r.lanes=b,r;default:if(typeof r=="object"&&r!==null)switch(r.$$typeof){case C:case k:w=10;break e;case P:w=9;break e;case I:w=11;break e;case z:w=14;break e;case Z:w=16,u=null;break e}w=29,o=Error(i(130,r===null?"null":typeof r,"")),u=null}return a=nr(w,o,a,h),a.elementType=r,a.type=u,a.lanes=b,a}function ya(r,a,o,u){return r=nr(7,r,u,a),r.lanes=o,r}function Ld(r,a,o){return r=nr(6,r,null,a),r.lanes=o,r}function jd(r,a,o){return a=nr(4,r.children!==null?r.children:[],r.key,a),a.lanes=o,a.stateNode={containerInfo:r.containerInfo,pendingChildren:null,implementation:r.implementation},a}var Qa=[],Ja=0,Go=null,Vo=0,_r=[],xr=0,va=null,ai=1,si="";function _a(r,a){Qa[Ja++]=Vo,Qa[Ja++]=Go,Go=r,Vo=a}function wy(r,a,o){_r[xr++]=ai,_r[xr++]=si,_r[xr++]=va,va=r;var u=ai;r=si;var h=32-Ie(u)-1;u&=~(1<<h),o+=1;var b=32-Ie(a)+h;if(30<b){var w=h-h%5;b=(u&(1<<w)-1).toString(32),u>>=w,h-=w,ai=1<<32-Ie(a)+h|o<<h|u,si=b+r}else ai=1<<b|o<<h|u,si=r}function $d(r){r.return!==null&&(_a(r,1),wy(r,1,0))}function zd(r){for(;r===Go;)Go=Qa[--Ja],Qa[Ja]=null,Vo=Qa[--Ja],Qa[Ja]=null;for(;r===va;)va=_r[--xr],_r[xr]=null,si=_r[--xr],_r[xr]=null,ai=_r[--xr],_r[xr]=null}var In=null,Jt=null,St=!1,xa=null,Hr=!1,Bd=Error(i(519));function wa(r){var a=Error(i(418,""));throw sl(yr(a,r)),Bd}function Ey(r){var a=r.stateNode,o=r.type,u=r.memoizedProps;switch(a[ye]=r,a[Te]=u,o){case"dialog":dt("cancel",a),dt("close",a);break;case"iframe":case"object":case"embed":dt("load",a);break;case"video":case"audio":for(o=0;o<Al.length;o++)dt(Al[o],a);break;case"source":dt("error",a);break;case"img":case"image":case"link":dt("error",a),dt("load",a);break;case"details":dt("toggle",a);break;case"input":dt("invalid",a),Mo(a,u.value,u.defaultValue,u.checked,u.defaultChecked,u.type,u.name,!0),da(a);break;case"select":dt("invalid",a);break;case"textarea":dt("invalid",a),Po(a,u.value,u.defaultValue,u.children),da(a)}o=u.children,typeof o!="string"&&typeof o!="number"&&typeof o!="bigint"||a.textContent===""+o||u.suppressHydrationWarning===!0||B_(a.textContent,o)?(u.popover!=null&&(dt("beforetoggle",a),dt("toggle",a)),u.onScroll!=null&&dt("scroll",a),u.onScrollEnd!=null&&dt("scrollend",a),u.onClick!=null&&(a.onclick=Tc),a=!0):a=!1,a||wa(r)}function Sy(r){for(In=r.return;In;)switch(In.tag){case 5:case 13:Hr=!1;return;case 27:case 3:Hr=!0;return;default:In=In.return}}function il(r){if(r!==In)return!1;if(!St)return Sy(r),St=!0,!1;var a=r.tag,o;if((o=a!==3&&a!==27)&&((o=a===5)&&(o=r.type,o=!(o!=="form"&&o!=="button")||rp(r.type,r.memoizedProps)),o=!o),o&&Jt&&wa(r),Sy(r),a===13){if(r=r.memoizedState,r=r!==null?r.dehydrated:null,!r)throw Error(i(317));e:{for(r=r.nextSibling,a=0;r;){if(r.nodeType===8)if(o=r.data,o==="/$"){if(a===0){Jt=Pr(r.nextSibling);break e}a--}else o!=="$"&&o!=="$!"&&o!=="$?"||a++;r=r.nextSibling}Jt=null}}else a===27?(a=Jt,Vi(r.type)?(r=lp,lp=null,Jt=r):Jt=a):Jt=In?Pr(r.stateNode.nextSibling):null;return!0}function al(){Jt=In=null,St=!1}function Cy(){var r=xa;return r!==null&&(Yn===null?Yn=r:Yn.push.apply(Yn,r),xa=null),r}function sl(r){xa===null?xa=[r]:xa.push(r)}var Fd=q(null),Ea=null,li=null;function Di(r,a,o){R(Fd,a._currentValue),a._currentValue=o}function oi(r){r._currentValue=Fd.current,U(Fd)}function Ud(r,a,o){for(;r!==null;){var u=r.alternate;if((r.childLanes&a)!==a?(r.childLanes|=a,u!==null&&(u.childLanes|=a)):u!==null&&(u.childLanes&a)!==a&&(u.childLanes|=a),r===o)break;r=r.return}}function Hd(r,a,o,u){var h=r.child;for(h!==null&&(h.return=r);h!==null;){var b=h.dependencies;if(b!==null){var w=h.child;b=b.firstContext;e:for(;b!==null;){var O=b;b=h;for(var L=0;L<a.length;L++)if(O.context===a[L]){b.lanes|=o,O=b.alternate,O!==null&&(O.lanes|=o),Ud(b.return,o,r),u||(w=null);break e}b=O.next}}else if(h.tag===18){if(w=h.return,w===null)throw Error(i(341));w.lanes|=o,b=w.alternate,b!==null&&(b.lanes|=o),Ud(w,o,r),w=null}else w=h.child;if(w!==null)w.return=h;else for(w=h;w!==null;){if(w===r){w=null;break}if(h=w.sibling,h!==null){h.return=w.return,w=h;break}w=w.return}h=w}}function ll(r,a,o,u){r=null;for(var h=a,b=!1;h!==null;){if(!b){if((h.flags&524288)!==0)b=!0;else if((h.flags&262144)!==0)break}if(h.tag===10){var w=h.alternate;if(w===null)throw Error(i(387));if(w=w.memoizedProps,w!==null){var O=h.type;tr(h.pendingProps.value,w.value)||(r!==null?r.push(O):r=[O])}}else if(h===ke.current){if(w=h.alternate,w===null)throw Error(i(387));w.memoizedState.memoizedState!==h.memoizedState.memoizedState&&(r!==null?r.push(Ll):r=[Ll])}h=h.return}r!==null&&Hd(a,r,o,u),a.flags|=262144}function Ko(r){for(r=r.firstContext;r!==null;){if(!tr(r.context._currentValue,r.memoizedValue))return!0;r=r.next}return!1}function Sa(r){Ea=r,li=null,r=r.dependencies,r!==null&&(r.firstContext=null)}function Nn(r){return Ty(Ea,r)}function Yo(r,a){return Ea===null&&Sa(r),Ty(r,a)}function Ty(r,a){var o=a._currentValue;if(a={context:a,memoizedValue:o,next:null},li===null){if(r===null)throw Error(i(308));li=a,r.dependencies={lanes:0,firstContext:a},r.flags|=524288}else li=li.next=a;return o}var YC=typeof AbortController<"u"?AbortController:function(){var r=[],a=this.signal={aborted:!1,addEventListener:function(o,u){r.push(u)}};this.abort=function(){a.aborted=!0,r.forEach(function(o){return o()})}},XC=e.unstable_scheduleCallback,WC=e.unstable_NormalPriority,fn={$$typeof:k,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function qd(){return{controller:new YC,data:new Map,refCount:0}}function ol(r){r.refCount--,r.refCount===0&&XC(WC,function(){r.controller.abort()})}var cl=null,Gd=0,es=0,ts=null;function ZC(r,a){if(cl===null){var o=cl=[];Gd=0,es=Yf(),ts={status:"pending",value:void 0,then:function(u){o.push(u)}}}return Gd++,a.then(Oy,Oy),a}function Oy(){if(--Gd===0&&cl!==null){ts!==null&&(ts.status="fulfilled");var r=cl;cl=null,es=0,ts=null;for(var a=0;a<r.length;a++)(0,r[a])()}}function QC(r,a){var o=[],u={status:"pending",value:null,reason:null,then:function(h){o.push(h)}};return r.then(function(){u.status="fulfilled",u.value=a;for(var h=0;h<o.length;h++)(0,o[h])(a)},function(h){for(u.status="rejected",u.reason=h,h=0;h<o.length;h++)(0,o[h])(void 0)}),u}var Ry=B.S;B.S=function(r,a){typeof a=="object"&&a!==null&&typeof a.then=="function"&&ZC(r,a),Ry!==null&&Ry(r,a)};var Ca=q(null);function Vd(){var r=Ca.current;return r!==null?r:Bt.pooledCache}function Xo(r,a){a===null?R(Ca,Ca.current):R(Ca,a.pool)}function Ny(){var r=Vd();return r===null?null:{parent:fn._currentValue,pool:r}}var ul=Error(i(460)),Ay=Error(i(474)),Wo=Error(i(542)),Kd={then:function(){}};function Dy(r){return r=r.status,r==="fulfilled"||r==="rejected"}function Zo(){}function ky(r,a,o){switch(o=r[o],o===void 0?r.push(a):o!==a&&(a.then(Zo,Zo),a=o),a.status){case"fulfilled":return a.value;case"rejected":throw r=a.reason,Py(r),r;default:if(typeof a.status=="string")a.then(Zo,Zo);else{if(r=Bt,r!==null&&100<r.shellSuspendCounter)throw Error(i(482));r=a,r.status="pending",r.then(function(u){if(a.status==="pending"){var h=a;h.status="fulfilled",h.value=u}},function(u){if(a.status==="pending"){var h=a;h.status="rejected",h.reason=u}})}switch(a.status){case"fulfilled":return a.value;case"rejected":throw r=a.reason,Py(r),r}throw dl=a,ul}}var dl=null;function My(){if(dl===null)throw Error(i(459));var r=dl;return dl=null,r}function Py(r){if(r===ul||r===Wo)throw Error(i(483))}var ki=!1;function Yd(r){r.updateQueue={baseState:r.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Xd(r,a){r=r.updateQueue,a.updateQueue===r&&(a.updateQueue={baseState:r.baseState,firstBaseUpdate:r.firstBaseUpdate,lastBaseUpdate:r.lastBaseUpdate,shared:r.shared,callbacks:null})}function Mi(r){return{lane:r,tag:0,payload:null,callback:null,next:null}}function Pi(r,a,o){var u=r.updateQueue;if(u===null)return null;if(u=u.shared,(Dt&2)!==0){var h=u.pending;return h===null?a.next=a:(a.next=h.next,h.next=a),u.pending=a,a=Ho(r),_y(r,null,o),a}return Uo(r,u,a,o),Ho(r)}function fl(r,a,o){if(a=a.updateQueue,a!==null&&(a=a.shared,(o&4194048)!==0)){var u=a.lanes;u&=r.pendingLanes,o|=u,a.lanes=o,ae(r,o)}}function Wd(r,a){var o=r.updateQueue,u=r.alternate;if(u!==null&&(u=u.updateQueue,o===u)){var h=null,b=null;if(o=o.firstBaseUpdate,o!==null){do{var w={lane:o.lane,tag:o.tag,payload:o.payload,callback:null,next:null};b===null?h=b=w:b=b.next=w,o=o.next}while(o!==null);b===null?h=b=a:b=b.next=a}else h=b=a;o={baseState:u.baseState,firstBaseUpdate:h,lastBaseUpdate:b,shared:u.shared,callbacks:u.callbacks},r.updateQueue=o;return}r=o.lastBaseUpdate,r===null?o.firstBaseUpdate=a:r.next=a,o.lastBaseUpdate=a}var Zd=!1;function pl(){if(Zd){var r=ts;if(r!==null)throw r}}function hl(r,a,o,u){Zd=!1;var h=r.updateQueue;ki=!1;var b=h.firstBaseUpdate,w=h.lastBaseUpdate,O=h.shared.pending;if(O!==null){h.shared.pending=null;var L=O,Y=L.next;L.next=null,w===null?b=Y:w.next=Y,w=L;var le=r.alternate;le!==null&&(le=le.updateQueue,O=le.lastBaseUpdate,O!==w&&(O===null?le.firstBaseUpdate=Y:O.next=Y,le.lastBaseUpdate=L))}if(b!==null){var ce=h.baseState;w=0,le=Y=L=null,O=b;do{var Q=O.lane&-536870913,J=Q!==O.lane;if(J?(bt&Q)===Q:(u&Q)===Q){Q!==0&&Q===es&&(Zd=!0),le!==null&&(le=le.next={lane:0,tag:O.tag,payload:O.payload,callback:null,next:null});e:{var Ge=r,Ue=O;Q=a;var It=o;switch(Ue.tag){case 1:if(Ge=Ue.payload,typeof Ge=="function"){ce=Ge.call(It,ce,Q);break e}ce=Ge;break e;case 3:Ge.flags=Ge.flags&-65537|128;case 0:if(Ge=Ue.payload,Q=typeof Ge=="function"?Ge.call(It,ce,Q):Ge,Q==null)break e;ce=m({},ce,Q);break e;case 2:ki=!0}}Q=O.callback,Q!==null&&(r.flags|=64,J&&(r.flags|=8192),J=h.callbacks,J===null?h.callbacks=[Q]:J.push(Q))}else J={lane:Q,tag:O.tag,payload:O.payload,callback:O.callback,next:null},le===null?(Y=le=J,L=ce):le=le.next=J,w|=Q;if(O=O.next,O===null){if(O=h.shared.pending,O===null)break;J=O,O=J.next,J.next=null,h.lastBaseUpdate=J,h.shared.pending=null}}while(!0);le===null&&(L=ce),h.baseState=L,h.firstBaseUpdate=Y,h.lastBaseUpdate=le,b===null&&(h.shared.lanes=0),Ui|=w,r.lanes=w,r.memoizedState=ce}}function Iy(r,a){if(typeof r!="function")throw Error(i(191,r));r.call(a)}function Ly(r,a){var o=r.callbacks;if(o!==null)for(r.callbacks=null,r=0;r<o.length;r++)Iy(o[r],a)}var ns=q(null),Qo=q(0);function jy(r,a){r=mi,R(Qo,r),R(ns,a),mi=r|a.baseLanes}function Qd(){R(Qo,mi),R(ns,ns.current)}function Jd(){mi=Qo.current,U(ns),U(Qo)}var Ii=0,ot=null,Mt=null,on=null,Jo=!1,rs=!1,Ta=!1,ec=0,ml=0,is=null,JC=0;function nn(){throw Error(i(321))}function ef(r,a){if(a===null)return!1;for(var o=0;o<a.length&&o<r.length;o++)if(!tr(r[o],a[o]))return!1;return!0}function tf(r,a,o,u,h,b){return Ii=b,ot=a,a.memoizedState=null,a.updateQueue=null,a.lanes=0,B.H=r===null||r.memoizedState===null?_v:xv,Ta=!1,b=o(u,h),Ta=!1,rs&&(b=zy(a,o,u,h)),$y(r),b}function $y(r){B.H=sc;var a=Mt!==null&&Mt.next!==null;if(Ii=0,on=Mt=ot=null,Jo=!1,ml=0,is=null,a)throw Error(i(300));r===null||bn||(r=r.dependencies,r!==null&&Ko(r)&&(bn=!0))}function zy(r,a,o,u){ot=r;var h=0;do{if(rs&&(is=null),ml=0,rs=!1,25<=h)throw Error(i(301));if(h+=1,on=Mt=null,r.updateQueue!=null){var b=r.updateQueue;b.lastEffect=null,b.events=null,b.stores=null,b.memoCache!=null&&(b.memoCache.index=0)}B.H=sT,b=a(o,u)}while(rs);return b}function eT(){var r=B.H,a=r.useState()[0];return a=typeof a.then=="function"?gl(a):a,r=r.useState()[0],(Mt!==null?Mt.memoizedState:null)!==r&&(ot.flags|=1024),a}function nf(){var r=ec!==0;return ec=0,r}function rf(r,a,o){a.updateQueue=r.updateQueue,a.flags&=-2053,r.lanes&=~o}function af(r){if(Jo){for(r=r.memoizedState;r!==null;){var a=r.queue;a!==null&&(a.pending=null),r=r.next}Jo=!1}Ii=0,on=Mt=ot=null,rs=!1,ml=ec=0,is=null}function Vn(){var r={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return on===null?ot.memoizedState=on=r:on=on.next=r,on}function cn(){if(Mt===null){var r=ot.alternate;r=r!==null?r.memoizedState:null}else r=Mt.next;var a=on===null?ot.memoizedState:on.next;if(a!==null)on=a,Mt=r;else{if(r===null)throw ot.alternate===null?Error(i(467)):Error(i(310));Mt=r,r={memoizedState:Mt.memoizedState,baseState:Mt.baseState,baseQueue:Mt.baseQueue,queue:Mt.queue,next:null},on===null?ot.memoizedState=on=r:on=on.next=r}return on}function sf(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function gl(r){var a=ml;return ml+=1,is===null&&(is=[]),r=ky(is,r,a),a=ot,(on===null?a.memoizedState:on.next)===null&&(a=a.alternate,B.H=a===null||a.memoizedState===null?_v:xv),r}function tc(r){if(r!==null&&typeof r=="object"){if(typeof r.then=="function")return gl(r);if(r.$$typeof===k)return Nn(r)}throw Error(i(438,String(r)))}function lf(r){var a=null,o=ot.updateQueue;if(o!==null&&(a=o.memoCache),a==null){var u=ot.alternate;u!==null&&(u=u.updateQueue,u!==null&&(u=u.memoCache,u!=null&&(a={data:u.data.map(function(h){return h.slice()}),index:0})))}if(a==null&&(a={data:[],index:0}),o===null&&(o=sf(),ot.updateQueue=o),o.memoCache=a,o=a.data[a.index],o===void 0)for(o=a.data[a.index]=Array(r),u=0;u<r;u++)o[u]=$;return a.index++,o}function ci(r,a){return typeof a=="function"?a(r):a}function nc(r){var a=cn();return of(a,Mt,r)}function of(r,a,o){var u=r.queue;if(u===null)throw Error(i(311));u.lastRenderedReducer=o;var h=r.baseQueue,b=u.pending;if(b!==null){if(h!==null){var w=h.next;h.next=b.next,b.next=w}a.baseQueue=h=b,u.pending=null}if(b=r.baseState,h===null)r.memoizedState=b;else{a=h.next;var O=w=null,L=null,Y=a,le=!1;do{var ce=Y.lane&-536870913;if(ce!==Y.lane?(bt&ce)===ce:(Ii&ce)===ce){var Q=Y.revertLane;if(Q===0)L!==null&&(L=L.next={lane:0,revertLane:0,action:Y.action,hasEagerState:Y.hasEagerState,eagerState:Y.eagerState,next:null}),ce===es&&(le=!0);else if((Ii&Q)===Q){Y=Y.next,Q===es&&(le=!0);continue}else ce={lane:0,revertLane:Y.revertLane,action:Y.action,hasEagerState:Y.hasEagerState,eagerState:Y.eagerState,next:null},L===null?(O=L=ce,w=b):L=L.next=ce,ot.lanes|=Q,Ui|=Q;ce=Y.action,Ta&&o(b,ce),b=Y.hasEagerState?Y.eagerState:o(b,ce)}else Q={lane:ce,revertLane:Y.revertLane,action:Y.action,hasEagerState:Y.hasEagerState,eagerState:Y.eagerState,next:null},L===null?(O=L=Q,w=b):L=L.next=Q,ot.lanes|=ce,Ui|=ce;Y=Y.next}while(Y!==null&&Y!==a);if(L===null?w=b:L.next=O,!tr(b,r.memoizedState)&&(bn=!0,le&&(o=ts,o!==null)))throw o;r.memoizedState=b,r.baseState=w,r.baseQueue=L,u.lastRenderedState=b}return h===null&&(u.lanes=0),[r.memoizedState,u.dispatch]}function cf(r){var a=cn(),o=a.queue;if(o===null)throw Error(i(311));o.lastRenderedReducer=r;var u=o.dispatch,h=o.pending,b=a.memoizedState;if(h!==null){o.pending=null;var w=h=h.next;do b=r(b,w.action),w=w.next;while(w!==h);tr(b,a.memoizedState)||(bn=!0),a.memoizedState=b,a.baseQueue===null&&(a.baseState=b),o.lastRenderedState=b}return[b,u]}function By(r,a,o){var u=ot,h=cn(),b=St;if(b){if(o===void 0)throw Error(i(407));o=o()}else o=a();var w=!tr((Mt||h).memoizedState,o);w&&(h.memoizedState=o,bn=!0),h=h.queue;var O=Hy.bind(null,u,h,r);if(bl(2048,8,O,[r]),h.getSnapshot!==a||w||on!==null&&on.memoizedState.tag&1){if(u.flags|=2048,as(9,rc(),Uy.bind(null,u,h,o,a),null),Bt===null)throw Error(i(349));b||(Ii&124)!==0||Fy(u,a,o)}return o}function Fy(r,a,o){r.flags|=16384,r={getSnapshot:a,value:o},a=ot.updateQueue,a===null?(a=sf(),ot.updateQueue=a,a.stores=[r]):(o=a.stores,o===null?a.stores=[r]:o.push(r))}function Uy(r,a,o,u){a.value=o,a.getSnapshot=u,qy(a)&&Gy(r)}function Hy(r,a,o){return o(function(){qy(a)&&Gy(r)})}function qy(r){var a=r.getSnapshot;r=r.value;try{var o=a();return!tr(r,o)}catch{return!0}}function Gy(r){var a=Wa(r,2);a!==null&&lr(a,r,2)}function uf(r){var a=Vn();if(typeof r=="function"){var o=r;if(r=o(),Ta){Ae(!0);try{o()}finally{Ae(!1)}}}return a.memoizedState=a.baseState=r,a.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:ci,lastRenderedState:r},a}function Vy(r,a,o,u){return r.baseState=o,of(r,Mt,typeof u=="function"?u:ci)}function tT(r,a,o,u,h){if(ac(r))throw Error(i(485));if(r=a.action,r!==null){var b={payload:h,action:r,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(w){b.listeners.push(w)}};B.T!==null?o(!0):b.isTransition=!1,u(b),o=a.pending,o===null?(b.next=a.pending=b,Ky(a,b)):(b.next=o.next,a.pending=o.next=b)}}function Ky(r,a){var o=a.action,u=a.payload,h=r.state;if(a.isTransition){var b=B.T,w={};B.T=w;try{var O=o(h,u),L=B.S;L!==null&&L(w,O),Yy(r,a,O)}catch(Y){df(r,a,Y)}finally{B.T=b}}else try{b=o(h,u),Yy(r,a,b)}catch(Y){df(r,a,Y)}}function Yy(r,a,o){o!==null&&typeof o=="object"&&typeof o.then=="function"?o.then(function(u){Xy(r,a,u)},function(u){return df(r,a,u)}):Xy(r,a,o)}function Xy(r,a,o){a.status="fulfilled",a.value=o,Wy(a),r.state=o,a=r.pending,a!==null&&(o=a.next,o===a?r.pending=null:(o=o.next,a.next=o,Ky(r,o)))}function df(r,a,o){var u=r.pending;if(r.pending=null,u!==null){u=u.next;do a.status="rejected",a.reason=o,Wy(a),a=a.next;while(a!==u)}r.action=null}function Wy(r){r=r.listeners;for(var a=0;a<r.length;a++)(0,r[a])()}function Zy(r,a){return a}function Qy(r,a){if(St){var o=Bt.formState;if(o!==null){e:{var u=ot;if(St){if(Jt){t:{for(var h=Jt,b=Hr;h.nodeType!==8;){if(!b){h=null;break t}if(h=Pr(h.nextSibling),h===null){h=null;break t}}b=h.data,h=b==="F!"||b==="F"?h:null}if(h){Jt=Pr(h.nextSibling),u=h.data==="F!";break e}}wa(u)}u=!1}u&&(a=o[0])}}return o=Vn(),o.memoizedState=o.baseState=a,u={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Zy,lastRenderedState:a},o.queue=u,o=bv.bind(null,ot,u),u.dispatch=o,u=uf(!1),b=gf.bind(null,ot,!1,u.queue),u=Vn(),h={state:a,dispatch:null,action:r,pending:null},u.queue=h,o=tT.bind(null,ot,h,b,o),h.dispatch=o,u.memoizedState=r,[a,o,!1]}function Jy(r){var a=cn();return ev(a,Mt,r)}function ev(r,a,o){if(a=of(r,a,Zy)[0],r=nc(ci)[0],typeof a=="object"&&a!==null&&typeof a.then=="function")try{var u=gl(a)}catch(w){throw w===ul?Wo:w}else u=a;a=cn();var h=a.queue,b=h.dispatch;return o!==a.memoizedState&&(ot.flags|=2048,as(9,rc(),nT.bind(null,h,o),null)),[u,b,r]}function nT(r,a){r.action=a}function tv(r){var a=cn(),o=Mt;if(o!==null)return ev(a,o,r);cn(),a=a.memoizedState,o=cn();var u=o.queue.dispatch;return o.memoizedState=r,[a,u,!1]}function as(r,a,o,u){return r={tag:r,create:o,deps:u,inst:a,next:null},a=ot.updateQueue,a===null&&(a=sf(),ot.updateQueue=a),o=a.lastEffect,o===null?a.lastEffect=r.next=r:(u=o.next,o.next=r,r.next=u,a.lastEffect=r),r}function rc(){return{destroy:void 0,resource:void 0}}function nv(){return cn().memoizedState}function ic(r,a,o,u){var h=Vn();u=u===void 0?null:u,ot.flags|=r,h.memoizedState=as(1|a,rc(),o,u)}function bl(r,a,o,u){var h=cn();u=u===void 0?null:u;var b=h.memoizedState.inst;Mt!==null&&u!==null&&ef(u,Mt.memoizedState.deps)?h.memoizedState=as(a,b,o,u):(ot.flags|=r,h.memoizedState=as(1|a,b,o,u))}function rv(r,a){ic(8390656,8,r,a)}function iv(r,a){bl(2048,8,r,a)}function av(r,a){return bl(4,2,r,a)}function sv(r,a){return bl(4,4,r,a)}function lv(r,a){if(typeof a=="function"){r=r();var o=a(r);return function(){typeof o=="function"?o():a(null)}}if(a!=null)return r=r(),a.current=r,function(){a.current=null}}function ov(r,a,o){o=o!=null?o.concat([r]):null,bl(4,4,lv.bind(null,a,r),o)}function ff(){}function cv(r,a){var o=cn();a=a===void 0?null:a;var u=o.memoizedState;return a!==null&&ef(a,u[1])?u[0]:(o.memoizedState=[r,a],r)}function uv(r,a){var o=cn();a=a===void 0?null:a;var u=o.memoizedState;if(a!==null&&ef(a,u[1]))return u[0];if(u=r(),Ta){Ae(!0);try{r()}finally{Ae(!1)}}return o.memoizedState=[u,a],u}function pf(r,a,o){return o===void 0||(Ii&1073741824)!==0?r.memoizedState=a:(r.memoizedState=o,r=p_(),ot.lanes|=r,Ui|=r,o)}function dv(r,a,o,u){return tr(o,a)?o:ns.current!==null?(r=pf(r,o,u),tr(r,a)||(bn=!0),r):(Ii&42)===0?(bn=!0,r.memoizedState=o):(r=p_(),ot.lanes|=r,Ui|=r,a)}function fv(r,a,o,u,h){var b=ee.p;ee.p=b!==0&&8>b?b:8;var w=B.T,O={};B.T=O,gf(r,!1,a,o);try{var L=h(),Y=B.S;if(Y!==null&&Y(O,L),L!==null&&typeof L=="object"&&typeof L.then=="function"){var le=QC(L,u);yl(r,a,le,sr(r))}else yl(r,a,u,sr(r))}catch(ce){yl(r,a,{then:function(){},status:"rejected",reason:ce},sr())}finally{ee.p=b,B.T=w}}function rT(){}function hf(r,a,o,u){if(r.tag!==5)throw Error(i(476));var h=pv(r).queue;fv(r,h,a,X,o===null?rT:function(){return hv(r),o(u)})}function pv(r){var a=r.memoizedState;if(a!==null)return a;a={memoizedState:X,baseState:X,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:ci,lastRenderedState:X},next:null};var o={};return a.next={memoizedState:o,baseState:o,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:ci,lastRenderedState:o},next:null},r.memoizedState=a,r=r.alternate,r!==null&&(r.memoizedState=a),a}function hv(r){var a=pv(r).next.queue;yl(r,a,{},sr())}function mf(){return Nn(Ll)}function mv(){return cn().memoizedState}function gv(){return cn().memoizedState}function iT(r){for(var a=r.return;a!==null;){switch(a.tag){case 24:case 3:var o=sr();r=Mi(o);var u=Pi(a,r,o);u!==null&&(lr(u,a,o),fl(u,a,o)),a={cache:qd()},r.payload=a;return}a=a.return}}function aT(r,a,o){var u=sr();o={lane:u,revertLane:0,action:o,hasEagerState:!1,eagerState:null,next:null},ac(r)?yv(a,o):(o=Pd(r,a,o,u),o!==null&&(lr(o,r,u),vv(o,a,u)))}function bv(r,a,o){var u=sr();yl(r,a,o,u)}function yl(r,a,o,u){var h={lane:u,revertLane:0,action:o,hasEagerState:!1,eagerState:null,next:null};if(ac(r))yv(a,h);else{var b=r.alternate;if(r.lanes===0&&(b===null||b.lanes===0)&&(b=a.lastRenderedReducer,b!==null))try{var w=a.lastRenderedState,O=b(w,o);if(h.hasEagerState=!0,h.eagerState=O,tr(O,w))return Uo(r,a,h,0),Bt===null&&Fo(),!1}catch{}finally{}if(o=Pd(r,a,h,u),o!==null)return lr(o,r,u),vv(o,a,u),!0}return!1}function gf(r,a,o,u){if(u={lane:2,revertLane:Yf(),action:u,hasEagerState:!1,eagerState:null,next:null},ac(r)){if(a)throw Error(i(479))}else a=Pd(r,o,u,2),a!==null&&lr(a,r,2)}function ac(r){var a=r.alternate;return r===ot||a!==null&&a===ot}function yv(r,a){rs=Jo=!0;var o=r.pending;o===null?a.next=a:(a.next=o.next,o.next=a),r.pending=a}function vv(r,a,o){if((o&4194048)!==0){var u=a.lanes;u&=r.pendingLanes,o|=u,a.lanes=o,ae(r,o)}}var sc={readContext:Nn,use:tc,useCallback:nn,useContext:nn,useEffect:nn,useImperativeHandle:nn,useLayoutEffect:nn,useInsertionEffect:nn,useMemo:nn,useReducer:nn,useRef:nn,useState:nn,useDebugValue:nn,useDeferredValue:nn,useTransition:nn,useSyncExternalStore:nn,useId:nn,useHostTransitionStatus:nn,useFormState:nn,useActionState:nn,useOptimistic:nn,useMemoCache:nn,useCacheRefresh:nn},_v={readContext:Nn,use:tc,useCallback:function(r,a){return Vn().memoizedState=[r,a===void 0?null:a],r},useContext:Nn,useEffect:rv,useImperativeHandle:function(r,a,o){o=o!=null?o.concat([r]):null,ic(4194308,4,lv.bind(null,a,r),o)},useLayoutEffect:function(r,a){return ic(4194308,4,r,a)},useInsertionEffect:function(r,a){ic(4,2,r,a)},useMemo:function(r,a){var o=Vn();a=a===void 0?null:a;var u=r();if(Ta){Ae(!0);try{r()}finally{Ae(!1)}}return o.memoizedState=[u,a],u},useReducer:function(r,a,o){var u=Vn();if(o!==void 0){var h=o(a);if(Ta){Ae(!0);try{o(a)}finally{Ae(!1)}}}else h=a;return u.memoizedState=u.baseState=h,r={pending:null,lanes:0,dispatch:null,lastRenderedReducer:r,lastRenderedState:h},u.queue=r,r=r.dispatch=aT.bind(null,ot,r),[u.memoizedState,r]},useRef:function(r){var a=Vn();return r={current:r},a.memoizedState=r},useState:function(r){r=uf(r);var a=r.queue,o=bv.bind(null,ot,a);return a.dispatch=o,[r.memoizedState,o]},useDebugValue:ff,useDeferredValue:function(r,a){var o=Vn();return pf(o,r,a)},useTransition:function(){var r=uf(!1);return r=fv.bind(null,ot,r.queue,!0,!1),Vn().memoizedState=r,[!1,r]},useSyncExternalStore:function(r,a,o){var u=ot,h=Vn();if(St){if(o===void 0)throw Error(i(407));o=o()}else{if(o=a(),Bt===null)throw Error(i(349));(bt&124)!==0||Fy(u,a,o)}h.memoizedState=o;var b={value:o,getSnapshot:a};return h.queue=b,rv(Hy.bind(null,u,b,r),[r]),u.flags|=2048,as(9,rc(),Uy.bind(null,u,b,o,a),null),o},useId:function(){var r=Vn(),a=Bt.identifierPrefix;if(St){var o=si,u=ai;o=(u&~(1<<32-Ie(u)-1)).toString(32)+o,a="«"+a+"R"+o,o=ec++,0<o&&(a+="H"+o.toString(32)),a+="»"}else o=JC++,a="«"+a+"r"+o.toString(32)+"»";return r.memoizedState=a},useHostTransitionStatus:mf,useFormState:Qy,useActionState:Qy,useOptimistic:function(r){var a=Vn();a.memoizedState=a.baseState=r;var o={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return a.queue=o,a=gf.bind(null,ot,!0,o),o.dispatch=a,[r,a]},useMemoCache:lf,useCacheRefresh:function(){return Vn().memoizedState=iT.bind(null,ot)}},xv={readContext:Nn,use:tc,useCallback:cv,useContext:Nn,useEffect:iv,useImperativeHandle:ov,useInsertionEffect:av,useLayoutEffect:sv,useMemo:uv,useReducer:nc,useRef:nv,useState:function(){return nc(ci)},useDebugValue:ff,useDeferredValue:function(r,a){var o=cn();return dv(o,Mt.memoizedState,r,a)},useTransition:function(){var r=nc(ci)[0],a=cn().memoizedState;return[typeof r=="boolean"?r:gl(r),a]},useSyncExternalStore:By,useId:mv,useHostTransitionStatus:mf,useFormState:Jy,useActionState:Jy,useOptimistic:function(r,a){var o=cn();return Vy(o,Mt,r,a)},useMemoCache:lf,useCacheRefresh:gv},sT={readContext:Nn,use:tc,useCallback:cv,useContext:Nn,useEffect:iv,useImperativeHandle:ov,useInsertionEffect:av,useLayoutEffect:sv,useMemo:uv,useReducer:cf,useRef:nv,useState:function(){return cf(ci)},useDebugValue:ff,useDeferredValue:function(r,a){var o=cn();return Mt===null?pf(o,r,a):dv(o,Mt.memoizedState,r,a)},useTransition:function(){var r=cf(ci)[0],a=cn().memoizedState;return[typeof r=="boolean"?r:gl(r),a]},useSyncExternalStore:By,useId:mv,useHostTransitionStatus:mf,useFormState:tv,useActionState:tv,useOptimistic:function(r,a){var o=cn();return Mt!==null?Vy(o,Mt,r,a):(o.baseState=r,[r,o.queue.dispatch])},useMemoCache:lf,useCacheRefresh:gv},ss=null,vl=0;function lc(r){var a=vl;return vl+=1,ss===null&&(ss=[]),ky(ss,r,a)}function _l(r,a){a=a.props.ref,r.ref=a!==void 0?a:null}function oc(r,a){throw a.$$typeof===g?Error(i(525)):(r=Object.prototype.toString.call(a),Error(i(31,r==="[object Object]"?"object with keys {"+Object.keys(a).join(", ")+"}":r)))}function wv(r){var a=r._init;return a(r._payload)}function Ev(r){function a(G,F){if(r){var K=G.deletions;K===null?(G.deletions=[F],G.flags|=16):K.push(F)}}function o(G,F){if(!r)return null;for(;F!==null;)a(G,F),F=F.sibling;return null}function u(G){for(var F=new Map;G!==null;)G.key!==null?F.set(G.key,G):F.set(G.index,G),G=G.sibling;return F}function h(G,F){return G=ii(G,F),G.index=0,G.sibling=null,G}function b(G,F,K){return G.index=K,r?(K=G.alternate,K!==null?(K=K.index,K<F?(G.flags|=67108866,F):K):(G.flags|=67108866,F)):(G.flags|=1048576,F)}function w(G){return r&&G.alternate===null&&(G.flags|=67108866),G}function O(G,F,K,oe){return F===null||F.tag!==6?(F=Ld(K,G.mode,oe),F.return=G,F):(F=h(F,K),F.return=G,F)}function L(G,F,K,oe){var Ne=K.type;return Ne===_?le(G,F,K.props.children,oe,K.key):F!==null&&(F.elementType===Ne||typeof Ne=="object"&&Ne!==null&&Ne.$$typeof===Z&&wv(Ne)===F.type)?(F=h(F,K.props),_l(F,K),F.return=G,F):(F=qo(K.type,K.key,K.props,null,G.mode,oe),_l(F,K),F.return=G,F)}function Y(G,F,K,oe){return F===null||F.tag!==4||F.stateNode.containerInfo!==K.containerInfo||F.stateNode.implementation!==K.implementation?(F=jd(K,G.mode,oe),F.return=G,F):(F=h(F,K.children||[]),F.return=G,F)}function le(G,F,K,oe,Ne){return F===null||F.tag!==7?(F=ya(K,G.mode,oe,Ne),F.return=G,F):(F=h(F,K),F.return=G,F)}function ce(G,F,K){if(typeof F=="string"&&F!==""||typeof F=="number"||typeof F=="bigint")return F=Ld(""+F,G.mode,K),F.return=G,F;if(typeof F=="object"&&F!==null){switch(F.$$typeof){case y:return K=qo(F.type,F.key,F.props,null,G.mode,K),_l(K,F),K.return=G,K;case v:return F=jd(F,G.mode,K),F.return=G,F;case Z:var oe=F._init;return F=oe(F._payload),ce(G,F,K)}if(V(F)||se(F))return F=ya(F,G.mode,K,null),F.return=G,F;if(typeof F.then=="function")return ce(G,lc(F),K);if(F.$$typeof===k)return ce(G,Yo(G,F),K);oc(G,F)}return null}function Q(G,F,K,oe){var Ne=F!==null?F.key:null;if(typeof K=="string"&&K!==""||typeof K=="number"||typeof K=="bigint")return Ne!==null?null:O(G,F,""+K,oe);if(typeof K=="object"&&K!==null){switch(K.$$typeof){case y:return K.key===Ne?L(G,F,K,oe):null;case v:return K.key===Ne?Y(G,F,K,oe):null;case Z:return Ne=K._init,K=Ne(K._payload),Q(G,F,K,oe)}if(V(K)||se(K))return Ne!==null?null:le(G,F,K,oe,null);if(typeof K.then=="function")return Q(G,F,lc(K),oe);if(K.$$typeof===k)return Q(G,F,Yo(G,K),oe);oc(G,K)}return null}function J(G,F,K,oe,Ne){if(typeof oe=="string"&&oe!==""||typeof oe=="number"||typeof oe=="bigint")return G=G.get(K)||null,O(F,G,""+oe,Ne);if(typeof oe=="object"&&oe!==null){switch(oe.$$typeof){case y:return G=G.get(oe.key===null?K:oe.key)||null,L(F,G,oe,Ne);case v:return G=G.get(oe.key===null?K:oe.key)||null,Y(F,G,oe,Ne);case Z:var ct=oe._init;return oe=ct(oe._payload),J(G,F,K,oe,Ne)}if(V(oe)||se(oe))return G=G.get(K)||null,le(F,G,oe,Ne,null);if(typeof oe.then=="function")return J(G,F,K,lc(oe),Ne);if(oe.$$typeof===k)return J(G,F,K,Yo(F,oe),Ne);oc(F,oe)}return null}function Ge(G,F,K,oe){for(var Ne=null,ct=null,je=F,He=F=0,vn=null;je!==null&&He<K.length;He++){je.index>He?(vn=je,je=null):vn=je.sibling;var wt=Q(G,je,K[He],oe);if(wt===null){je===null&&(je=vn);break}r&&je&&wt.alternate===null&&a(G,je),F=b(wt,F,He),ct===null?Ne=wt:ct.sibling=wt,ct=wt,je=vn}if(He===K.length)return o(G,je),St&&_a(G,He),Ne;if(je===null){for(;He<K.length;He++)je=ce(G,K[He],oe),je!==null&&(F=b(je,F,He),ct===null?Ne=je:ct.sibling=je,ct=je);return St&&_a(G,He),Ne}for(je=u(je);He<K.length;He++)vn=J(je,G,He,K[He],oe),vn!==null&&(r&&vn.alternate!==null&&je.delete(vn.key===null?He:vn.key),F=b(vn,F,He),ct===null?Ne=vn:ct.sibling=vn,ct=vn);return r&&je.forEach(function(Zi){return a(G,Zi)}),St&&_a(G,He),Ne}function Ue(G,F,K,oe){if(K==null)throw Error(i(151));for(var Ne=null,ct=null,je=F,He=F=0,vn=null,wt=K.next();je!==null&&!wt.done;He++,wt=K.next()){je.index>He?(vn=je,je=null):vn=je.sibling;var Zi=Q(G,je,wt.value,oe);if(Zi===null){je===null&&(je=vn);break}r&&je&&Zi.alternate===null&&a(G,je),F=b(Zi,F,He),ct===null?Ne=Zi:ct.sibling=Zi,ct=Zi,je=vn}if(wt.done)return o(G,je),St&&_a(G,He),Ne;if(je===null){for(;!wt.done;He++,wt=K.next())wt=ce(G,wt.value,oe),wt!==null&&(F=b(wt,F,He),ct===null?Ne=wt:ct.sibling=wt,ct=wt);return St&&_a(G,He),Ne}for(je=u(je);!wt.done;He++,wt=K.next())wt=J(je,G,He,wt.value,oe),wt!==null&&(r&&wt.alternate!==null&&je.delete(wt.key===null?He:wt.key),F=b(wt,F,He),ct===null?Ne=wt:ct.sibling=wt,ct=wt);return r&&je.forEach(function(lO){return a(G,lO)}),St&&_a(G,He),Ne}function It(G,F,K,oe){if(typeof K=="object"&&K!==null&&K.type===_&&K.key===null&&(K=K.props.children),typeof K=="object"&&K!==null){switch(K.$$typeof){case y:e:{for(var Ne=K.key;F!==null;){if(F.key===Ne){if(Ne=K.type,Ne===_){if(F.tag===7){o(G,F.sibling),oe=h(F,K.props.children),oe.return=G,G=oe;break e}}else if(F.elementType===Ne||typeof Ne=="object"&&Ne!==null&&Ne.$$typeof===Z&&wv(Ne)===F.type){o(G,F.sibling),oe=h(F,K.props),_l(oe,K),oe.return=G,G=oe;break e}o(G,F);break}else a(G,F);F=F.sibling}K.type===_?(oe=ya(K.props.children,G.mode,oe,K.key),oe.return=G,G=oe):(oe=qo(K.type,K.key,K.props,null,G.mode,oe),_l(oe,K),oe.return=G,G=oe)}return w(G);case v:e:{for(Ne=K.key;F!==null;){if(F.key===Ne)if(F.tag===4&&F.stateNode.containerInfo===K.containerInfo&&F.stateNode.implementation===K.implementation){o(G,F.sibling),oe=h(F,K.children||[]),oe.return=G,G=oe;break e}else{o(G,F);break}else a(G,F);F=F.sibling}oe=jd(K,G.mode,oe),oe.return=G,G=oe}return w(G);case Z:return Ne=K._init,K=Ne(K._payload),It(G,F,K,oe)}if(V(K))return Ge(G,F,K,oe);if(se(K)){if(Ne=se(K),typeof Ne!="function")throw Error(i(150));return K=Ne.call(K),Ue(G,F,K,oe)}if(typeof K.then=="function")return It(G,F,lc(K),oe);if(K.$$typeof===k)return It(G,F,Yo(G,K),oe);oc(G,K)}return typeof K=="string"&&K!==""||typeof K=="number"||typeof K=="bigint"?(K=""+K,F!==null&&F.tag===6?(o(G,F.sibling),oe=h(F,K),oe.return=G,G=oe):(o(G,F),oe=Ld(K,G.mode,oe),oe.return=G,G=oe),w(G)):o(G,F)}return function(G,F,K,oe){try{vl=0;var Ne=It(G,F,K,oe);return ss=null,Ne}catch(je){if(je===ul||je===Wo)throw je;var ct=nr(29,je,null,G.mode);return ct.lanes=oe,ct.return=G,ct}finally{}}}var ls=Ev(!0),Sv=Ev(!1),wr=q(null),qr=null;function Li(r){var a=r.alternate;R(pn,pn.current&1),R(wr,r),qr===null&&(a===null||ns.current!==null||a.memoizedState!==null)&&(qr=r)}function Cv(r){if(r.tag===22){if(R(pn,pn.current),R(wr,r),qr===null){var a=r.alternate;a!==null&&a.memoizedState!==null&&(qr=r)}}else ji()}function ji(){R(pn,pn.current),R(wr,wr.current)}function ui(r){U(wr),qr===r&&(qr=null),U(pn)}var pn=q(0);function cc(r){for(var a=r;a!==null;){if(a.tag===13){var o=a.memoizedState;if(o!==null&&(o=o.dehydrated,o===null||o.data==="$?"||sp(o)))return a}else if(a.tag===19&&a.memoizedProps.revealOrder!==void 0){if((a.flags&128)!==0)return a}else if(a.child!==null){a.child.return=a,a=a.child;continue}if(a===r)break;for(;a.sibling===null;){if(a.return===null||a.return===r)return null;a=a.return}a.sibling.return=a.return,a=a.sibling}return null}function bf(r,a,o,u){a=r.memoizedState,o=o(u,a),o=o==null?a:m({},a,o),r.memoizedState=o,r.lanes===0&&(r.updateQueue.baseState=o)}var yf={enqueueSetState:function(r,a,o){r=r._reactInternals;var u=sr(),h=Mi(u);h.payload=a,o!=null&&(h.callback=o),a=Pi(r,h,u),a!==null&&(lr(a,r,u),fl(a,r,u))},enqueueReplaceState:function(r,a,o){r=r._reactInternals;var u=sr(),h=Mi(u);h.tag=1,h.payload=a,o!=null&&(h.callback=o),a=Pi(r,h,u),a!==null&&(lr(a,r,u),fl(a,r,u))},enqueueForceUpdate:function(r,a){r=r._reactInternals;var o=sr(),u=Mi(o);u.tag=2,a!=null&&(u.callback=a),a=Pi(r,u,o),a!==null&&(lr(a,r,o),fl(a,r,o))}};function Tv(r,a,o,u,h,b,w){return r=r.stateNode,typeof r.shouldComponentUpdate=="function"?r.shouldComponentUpdate(u,b,w):a.prototype&&a.prototype.isPureReactComponent?!nl(o,u)||!nl(h,b):!0}function Ov(r,a,o,u){r=a.state,typeof a.componentWillReceiveProps=="function"&&a.componentWillReceiveProps(o,u),typeof a.UNSAFE_componentWillReceiveProps=="function"&&a.UNSAFE_componentWillReceiveProps(o,u),a.state!==r&&yf.enqueueReplaceState(a,a.state,null)}function Oa(r,a){var o=a;if("ref"in a){o={};for(var u in a)u!=="ref"&&(o[u]=a[u])}if(r=r.defaultProps){o===a&&(o=m({},o));for(var h in r)o[h]===void 0&&(o[h]=r[h])}return o}var uc=typeof reportError=="function"?reportError:function(r){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var a=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof r=="object"&&r!==null&&typeof r.message=="string"?String(r.message):String(r),error:r});if(!window.dispatchEvent(a))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",r);return}console.error(r)};function Rv(r){uc(r)}function Nv(r){console.error(r)}function Av(r){uc(r)}function dc(r,a){try{var o=r.onUncaughtError;o(a.value,{componentStack:a.stack})}catch(u){setTimeout(function(){throw u})}}function Dv(r,a,o){try{var u=r.onCaughtError;u(o.value,{componentStack:o.stack,errorBoundary:a.tag===1?a.stateNode:null})}catch(h){setTimeout(function(){throw h})}}function vf(r,a,o){return o=Mi(o),o.tag=3,o.payload={element:null},o.callback=function(){dc(r,a)},o}function kv(r){return r=Mi(r),r.tag=3,r}function Mv(r,a,o,u){var h=o.type.getDerivedStateFromError;if(typeof h=="function"){var b=u.value;r.payload=function(){return h(b)},r.callback=function(){Dv(a,o,u)}}var w=o.stateNode;w!==null&&typeof w.componentDidCatch=="function"&&(r.callback=function(){Dv(a,o,u),typeof h!="function"&&(Hi===null?Hi=new Set([this]):Hi.add(this));var O=u.stack;this.componentDidCatch(u.value,{componentStack:O!==null?O:""})})}function lT(r,a,o,u,h){if(o.flags|=32768,u!==null&&typeof u=="object"&&typeof u.then=="function"){if(a=o.alternate,a!==null&&ll(a,o,h,!0),o=wr.current,o!==null){switch(o.tag){case 13:return qr===null?Hf():o.alternate===null&&en===0&&(en=3),o.flags&=-257,o.flags|=65536,o.lanes=h,u===Kd?o.flags|=16384:(a=o.updateQueue,a===null?o.updateQueue=new Set([u]):a.add(u),Gf(r,u,h)),!1;case 22:return o.flags|=65536,u===Kd?o.flags|=16384:(a=o.updateQueue,a===null?(a={transitions:null,markerInstances:null,retryQueue:new Set([u])},o.updateQueue=a):(o=a.retryQueue,o===null?a.retryQueue=new Set([u]):o.add(u)),Gf(r,u,h)),!1}throw Error(i(435,o.tag))}return Gf(r,u,h),Hf(),!1}if(St)return a=wr.current,a!==null?((a.flags&65536)===0&&(a.flags|=256),a.flags|=65536,a.lanes=h,u!==Bd&&(r=Error(i(422),{cause:u}),sl(yr(r,o)))):(u!==Bd&&(a=Error(i(423),{cause:u}),sl(yr(a,o))),r=r.current.alternate,r.flags|=65536,h&=-h,r.lanes|=h,u=yr(u,o),h=vf(r.stateNode,u,h),Wd(r,h),en!==4&&(en=2)),!1;var b=Error(i(520),{cause:u});if(b=yr(b,o),Ol===null?Ol=[b]:Ol.push(b),en!==4&&(en=2),a===null)return!0;u=yr(u,o),o=a;do{switch(o.tag){case 3:return o.flags|=65536,r=h&-h,o.lanes|=r,r=vf(o.stateNode,u,r),Wd(o,r),!1;case 1:if(a=o.type,b=o.stateNode,(o.flags&128)===0&&(typeof a.getDerivedStateFromError=="function"||b!==null&&typeof b.componentDidCatch=="function"&&(Hi===null||!Hi.has(b))))return o.flags|=65536,h&=-h,o.lanes|=h,h=kv(h),Mv(h,r,o,u),Wd(o,h),!1}o=o.return}while(o!==null);return!1}var Pv=Error(i(461)),bn=!1;function wn(r,a,o,u){a.child=r===null?Sv(a,null,o,u):ls(a,r.child,o,u)}function Iv(r,a,o,u,h){o=o.render;var b=a.ref;if("ref"in u){var w={};for(var O in u)O!=="ref"&&(w[O]=u[O])}else w=u;return Sa(a),u=tf(r,a,o,w,b,h),O=nf(),r!==null&&!bn?(rf(r,a,h),di(r,a,h)):(St&&O&&$d(a),a.flags|=1,wn(r,a,u,h),a.child)}function Lv(r,a,o,u,h){if(r===null){var b=o.type;return typeof b=="function"&&!Id(b)&&b.defaultProps===void 0&&o.compare===null?(a.tag=15,a.type=b,jv(r,a,b,u,h)):(r=qo(o.type,null,u,a,a.mode,h),r.ref=a.ref,r.return=a,a.child=r)}if(b=r.child,!Of(r,h)){var w=b.memoizedProps;if(o=o.compare,o=o!==null?o:nl,o(w,u)&&r.ref===a.ref)return di(r,a,h)}return a.flags|=1,r=ii(b,u),r.ref=a.ref,r.return=a,a.child=r}function jv(r,a,o,u,h){if(r!==null){var b=r.memoizedProps;if(nl(b,u)&&r.ref===a.ref)if(bn=!1,a.pendingProps=u=b,Of(r,h))(r.flags&131072)!==0&&(bn=!0);else return a.lanes=r.lanes,di(r,a,h)}return _f(r,a,o,u,h)}function $v(r,a,o){var u=a.pendingProps,h=u.children,b=r!==null?r.memoizedState:null;if(u.mode==="hidden"){if((a.flags&128)!==0){if(u=b!==null?b.baseLanes|o:o,r!==null){for(h=a.child=r.child,b=0;h!==null;)b=b|h.lanes|h.childLanes,h=h.sibling;a.childLanes=b&~u}else a.childLanes=0,a.child=null;return zv(r,a,u,o)}if((o&536870912)!==0)a.memoizedState={baseLanes:0,cachePool:null},r!==null&&Xo(a,b!==null?b.cachePool:null),b!==null?jy(a,b):Qd(),Cv(a);else return a.lanes=a.childLanes=536870912,zv(r,a,b!==null?b.baseLanes|o:o,o)}else b!==null?(Xo(a,b.cachePool),jy(a,b),ji(),a.memoizedState=null):(r!==null&&Xo(a,null),Qd(),ji());return wn(r,a,h,o),a.child}function zv(r,a,o,u){var h=Vd();return h=h===null?null:{parent:fn._currentValue,pool:h},a.memoizedState={baseLanes:o,cachePool:h},r!==null&&Xo(a,null),Qd(),Cv(a),r!==null&&ll(r,a,u,!0),null}function fc(r,a){var o=a.ref;if(o===null)r!==null&&r.ref!==null&&(a.flags|=4194816);else{if(typeof o!="function"&&typeof o!="object")throw Error(i(284));(r===null||r.ref!==o)&&(a.flags|=4194816)}}function _f(r,a,o,u,h){return Sa(a),o=tf(r,a,o,u,void 0,h),u=nf(),r!==null&&!bn?(rf(r,a,h),di(r,a,h)):(St&&u&&$d(a),a.flags|=1,wn(r,a,o,h),a.child)}function Bv(r,a,o,u,h,b){return Sa(a),a.updateQueue=null,o=zy(a,u,o,h),$y(r),u=nf(),r!==null&&!bn?(rf(r,a,b),di(r,a,b)):(St&&u&&$d(a),a.flags|=1,wn(r,a,o,b),a.child)}function Fv(r,a,o,u,h){if(Sa(a),a.stateNode===null){var b=Za,w=o.contextType;typeof w=="object"&&w!==null&&(b=Nn(w)),b=new o(u,b),a.memoizedState=b.state!==null&&b.state!==void 0?b.state:null,b.updater=yf,a.stateNode=b,b._reactInternals=a,b=a.stateNode,b.props=u,b.state=a.memoizedState,b.refs={},Yd(a),w=o.contextType,b.context=typeof w=="object"&&w!==null?Nn(w):Za,b.state=a.memoizedState,w=o.getDerivedStateFromProps,typeof w=="function"&&(bf(a,o,w,u),b.state=a.memoizedState),typeof o.getDerivedStateFromProps=="function"||typeof b.getSnapshotBeforeUpdate=="function"||typeof b.UNSAFE_componentWillMount!="function"&&typeof b.componentWillMount!="function"||(w=b.state,typeof b.componentWillMount=="function"&&b.componentWillMount(),typeof b.UNSAFE_componentWillMount=="function"&&b.UNSAFE_componentWillMount(),w!==b.state&&yf.enqueueReplaceState(b,b.state,null),hl(a,u,b,h),pl(),b.state=a.memoizedState),typeof b.componentDidMount=="function"&&(a.flags|=4194308),u=!0}else if(r===null){b=a.stateNode;var O=a.memoizedProps,L=Oa(o,O);b.props=L;var Y=b.context,le=o.contextType;w=Za,typeof le=="object"&&le!==null&&(w=Nn(le));var ce=o.getDerivedStateFromProps;le=typeof ce=="function"||typeof b.getSnapshotBeforeUpdate=="function",O=a.pendingProps!==O,le||typeof b.UNSAFE_componentWillReceiveProps!="function"&&typeof b.componentWillReceiveProps!="function"||(O||Y!==w)&&Ov(a,b,u,w),ki=!1;var Q=a.memoizedState;b.state=Q,hl(a,u,b,h),pl(),Y=a.memoizedState,O||Q!==Y||ki?(typeof ce=="function"&&(bf(a,o,ce,u),Y=a.memoizedState),(L=ki||Tv(a,o,L,u,Q,Y,w))?(le||typeof b.UNSAFE_componentWillMount!="function"&&typeof b.componentWillMount!="function"||(typeof b.componentWillMount=="function"&&b.componentWillMount(),typeof b.UNSAFE_componentWillMount=="function"&&b.UNSAFE_componentWillMount()),typeof b.componentDidMount=="function"&&(a.flags|=4194308)):(typeof b.componentDidMount=="function"&&(a.flags|=4194308),a.memoizedProps=u,a.memoizedState=Y),b.props=u,b.state=Y,b.context=w,u=L):(typeof b.componentDidMount=="function"&&(a.flags|=4194308),u=!1)}else{b=a.stateNode,Xd(r,a),w=a.memoizedProps,le=Oa(o,w),b.props=le,ce=a.pendingProps,Q=b.context,Y=o.contextType,L=Za,typeof Y=="object"&&Y!==null&&(L=Nn(Y)),O=o.getDerivedStateFromProps,(Y=typeof O=="function"||typeof b.getSnapshotBeforeUpdate=="function")||typeof b.UNSAFE_componentWillReceiveProps!="function"&&typeof b.componentWillReceiveProps!="function"||(w!==ce||Q!==L)&&Ov(a,b,u,L),ki=!1,Q=a.memoizedState,b.state=Q,hl(a,u,b,h),pl();var J=a.memoizedState;w!==ce||Q!==J||ki||r!==null&&r.dependencies!==null&&Ko(r.dependencies)?(typeof O=="function"&&(bf(a,o,O,u),J=a.memoizedState),(le=ki||Tv(a,o,le,u,Q,J,L)||r!==null&&r.dependencies!==null&&Ko(r.dependencies))?(Y||typeof b.UNSAFE_componentWillUpdate!="function"&&typeof b.componentWillUpdate!="function"||(typeof b.componentWillUpdate=="function"&&b.componentWillUpdate(u,J,L),typeof b.UNSAFE_componentWillUpdate=="function"&&b.UNSAFE_componentWillUpdate(u,J,L)),typeof b.componentDidUpdate=="function"&&(a.flags|=4),typeof b.getSnapshotBeforeUpdate=="function"&&(a.flags|=1024)):(typeof b.componentDidUpdate!="function"||w===r.memoizedProps&&Q===r.memoizedState||(a.flags|=4),typeof b.getSnapshotBeforeUpdate!="function"||w===r.memoizedProps&&Q===r.memoizedState||(a.flags|=1024),a.memoizedProps=u,a.memoizedState=J),b.props=u,b.state=J,b.context=L,u=le):(typeof b.componentDidUpdate!="function"||w===r.memoizedProps&&Q===r.memoizedState||(a.flags|=4),typeof b.getSnapshotBeforeUpdate!="function"||w===r.memoizedProps&&Q===r.memoizedState||(a.flags|=1024),u=!1)}return b=u,fc(r,a),u=(a.flags&128)!==0,b||u?(b=a.stateNode,o=u&&typeof o.getDerivedStateFromError!="function"?null:b.render(),a.flags|=1,r!==null&&u?(a.child=ls(a,r.child,null,h),a.child=ls(a,null,o,h)):wn(r,a,o,h),a.memoizedState=b.state,r=a.child):r=di(r,a,h),r}function Uv(r,a,o,u){return al(),a.flags|=256,wn(r,a,o,u),a.child}var xf={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function wf(r){return{baseLanes:r,cachePool:Ny()}}function Ef(r,a,o){return r=r!==null?r.childLanes&~o:0,a&&(r|=Er),r}function Hv(r,a,o){var u=a.pendingProps,h=!1,b=(a.flags&128)!==0,w;if((w=b)||(w=r!==null&&r.memoizedState===null?!1:(pn.current&2)!==0),w&&(h=!0,a.flags&=-129),w=(a.flags&32)!==0,a.flags&=-33,r===null){if(St){if(h?Li(a):ji(),St){var O=Jt,L;if(L=O){e:{for(L=O,O=Hr;L.nodeType!==8;){if(!O){O=null;break e}if(L=Pr(L.nextSibling),L===null){O=null;break e}}O=L}O!==null?(a.memoizedState={dehydrated:O,treeContext:va!==null?{id:ai,overflow:si}:null,retryLane:536870912,hydrationErrors:null},L=nr(18,null,null,0),L.stateNode=O,L.return=a,a.child=L,In=a,Jt=null,L=!0):L=!1}L||wa(a)}if(O=a.memoizedState,O!==null&&(O=O.dehydrated,O!==null))return sp(O)?a.lanes=32:a.lanes=536870912,null;ui(a)}return O=u.children,u=u.fallback,h?(ji(),h=a.mode,O=pc({mode:"hidden",children:O},h),u=ya(u,h,o,null),O.return=a,u.return=a,O.sibling=u,a.child=O,h=a.child,h.memoizedState=wf(o),h.childLanes=Ef(r,w,o),a.memoizedState=xf,u):(Li(a),Sf(a,O))}if(L=r.memoizedState,L!==null&&(O=L.dehydrated,O!==null)){if(b)a.flags&256?(Li(a),a.flags&=-257,a=Cf(r,a,o)):a.memoizedState!==null?(ji(),a.child=r.child,a.flags|=128,a=null):(ji(),h=u.fallback,O=a.mode,u=pc({mode:"visible",children:u.children},O),h=ya(h,O,o,null),h.flags|=2,u.return=a,h.return=a,u.sibling=h,a.child=u,ls(a,r.child,null,o),u=a.child,u.memoizedState=wf(o),u.childLanes=Ef(r,w,o),a.memoizedState=xf,a=h);else if(Li(a),sp(O)){if(w=O.nextSibling&&O.nextSibling.dataset,w)var Y=w.dgst;w=Y,u=Error(i(419)),u.stack="",u.digest=w,sl({value:u,source:null,stack:null}),a=Cf(r,a,o)}else if(bn||ll(r,a,o,!1),w=(o&r.childLanes)!==0,bn||w){if(w=Bt,w!==null&&(u=o&-o,u=(u&42)!==0?1:me(u),u=(u&(w.suspendedLanes|o))!==0?0:u,u!==0&&u!==L.retryLane))throw L.retryLane=u,Wa(r,u),lr(w,r,u),Pv;O.data==="$?"||Hf(),a=Cf(r,a,o)}else O.data==="$?"?(a.flags|=192,a.child=r.child,a=null):(r=L.treeContext,Jt=Pr(O.nextSibling),In=a,St=!0,xa=null,Hr=!1,r!==null&&(_r[xr++]=ai,_r[xr++]=si,_r[xr++]=va,ai=r.id,si=r.overflow,va=a),a=Sf(a,u.children),a.flags|=4096);return a}return h?(ji(),h=u.fallback,O=a.mode,L=r.child,Y=L.sibling,u=ii(L,{mode:"hidden",children:u.children}),u.subtreeFlags=L.subtreeFlags&65011712,Y!==null?h=ii(Y,h):(h=ya(h,O,o,null),h.flags|=2),h.return=a,u.return=a,u.sibling=h,a.child=u,u=h,h=a.child,O=r.child.memoizedState,O===null?O=wf(o):(L=O.cachePool,L!==null?(Y=fn._currentValue,L=L.parent!==Y?{parent:Y,pool:Y}:L):L=Ny(),O={baseLanes:O.baseLanes|o,cachePool:L}),h.memoizedState=O,h.childLanes=Ef(r,w,o),a.memoizedState=xf,u):(Li(a),o=r.child,r=o.sibling,o=ii(o,{mode:"visible",children:u.children}),o.return=a,o.sibling=null,r!==null&&(w=a.deletions,w===null?(a.deletions=[r],a.flags|=16):w.push(r)),a.child=o,a.memoizedState=null,o)}function Sf(r,a){return a=pc({mode:"visible",children:a},r.mode),a.return=r,r.child=a}function pc(r,a){return r=nr(22,r,null,a),r.lanes=0,r.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null},r}function Cf(r,a,o){return ls(a,r.child,null,o),r=Sf(a,a.pendingProps.children),r.flags|=2,a.memoizedState=null,r}function qv(r,a,o){r.lanes|=a;var u=r.alternate;u!==null&&(u.lanes|=a),Ud(r.return,a,o)}function Tf(r,a,o,u,h){var b=r.memoizedState;b===null?r.memoizedState={isBackwards:a,rendering:null,renderingStartTime:0,last:u,tail:o,tailMode:h}:(b.isBackwards=a,b.rendering=null,b.renderingStartTime=0,b.last=u,b.tail=o,b.tailMode=h)}function Gv(r,a,o){var u=a.pendingProps,h=u.revealOrder,b=u.tail;if(wn(r,a,u.children,o),u=pn.current,(u&2)!==0)u=u&1|2,a.flags|=128;else{if(r!==null&&(r.flags&128)!==0)e:for(r=a.child;r!==null;){if(r.tag===13)r.memoizedState!==null&&qv(r,o,a);else if(r.tag===19)qv(r,o,a);else if(r.child!==null){r.child.return=r,r=r.child;continue}if(r===a)break e;for(;r.sibling===null;){if(r.return===null||r.return===a)break e;r=r.return}r.sibling.return=r.return,r=r.sibling}u&=1}switch(R(pn,u),h){case"forwards":for(o=a.child,h=null;o!==null;)r=o.alternate,r!==null&&cc(r)===null&&(h=o),o=o.sibling;o=h,o===null?(h=a.child,a.child=null):(h=o.sibling,o.sibling=null),Tf(a,!1,h,o,b);break;case"backwards":for(o=null,h=a.child,a.child=null;h!==null;){if(r=h.alternate,r!==null&&cc(r)===null){a.child=h;break}r=h.sibling,h.sibling=o,o=h,h=r}Tf(a,!0,o,null,b);break;case"together":Tf(a,!1,null,null,void 0);break;default:a.memoizedState=null}return a.child}function di(r,a,o){if(r!==null&&(a.dependencies=r.dependencies),Ui|=a.lanes,(o&a.childLanes)===0)if(r!==null){if(ll(r,a,o,!1),(o&a.childLanes)===0)return null}else return null;if(r!==null&&a.child!==r.child)throw Error(i(153));if(a.child!==null){for(r=a.child,o=ii(r,r.pendingProps),a.child=o,o.return=a;r.sibling!==null;)r=r.sibling,o=o.sibling=ii(r,r.pendingProps),o.return=a;o.sibling=null}return a.child}function Of(r,a){return(r.lanes&a)!==0?!0:(r=r.dependencies,!!(r!==null&&Ko(r)))}function oT(r,a,o){switch(a.tag){case 3:Me(a,a.stateNode.containerInfo),Di(a,fn,r.memoizedState.cache),al();break;case 27:case 5:$e(a);break;case 4:Me(a,a.stateNode.containerInfo);break;case 10:Di(a,a.type,a.memoizedProps.value);break;case 13:var u=a.memoizedState;if(u!==null)return u.dehydrated!==null?(Li(a),a.flags|=128,null):(o&a.child.childLanes)!==0?Hv(r,a,o):(Li(a),r=di(r,a,o),r!==null?r.sibling:null);Li(a);break;case 19:var h=(r.flags&128)!==0;if(u=(o&a.childLanes)!==0,u||(ll(r,a,o,!1),u=(o&a.childLanes)!==0),h){if(u)return Gv(r,a,o);a.flags|=128}if(h=a.memoizedState,h!==null&&(h.rendering=null,h.tail=null,h.lastEffect=null),R(pn,pn.current),u)break;return null;case 22:case 23:return a.lanes=0,$v(r,a,o);case 24:Di(a,fn,r.memoizedState.cache)}return di(r,a,o)}function Vv(r,a,o){if(r!==null)if(r.memoizedProps!==a.pendingProps)bn=!0;else{if(!Of(r,o)&&(a.flags&128)===0)return bn=!1,oT(r,a,o);bn=(r.flags&131072)!==0}else bn=!1,St&&(a.flags&1048576)!==0&&wy(a,Vo,a.index);switch(a.lanes=0,a.tag){case 16:e:{r=a.pendingProps;var u=a.elementType,h=u._init;if(u=h(u._payload),a.type=u,typeof u=="function")Id(u)?(r=Oa(u,r),a.tag=1,a=Fv(null,a,u,r,o)):(a.tag=0,a=_f(null,a,u,r,o));else{if(u!=null){if(h=u.$$typeof,h===I){a.tag=11,a=Iv(null,a,u,r,o);break e}else if(h===z){a.tag=14,a=Lv(null,a,u,r,o);break e}}throw a=ue(u)||u,Error(i(306,a,""))}}return a;case 0:return _f(r,a,a.type,a.pendingProps,o);case 1:return u=a.type,h=Oa(u,a.pendingProps),Fv(r,a,u,h,o);case 3:e:{if(Me(a,a.stateNode.containerInfo),r===null)throw Error(i(387));u=a.pendingProps;var b=a.memoizedState;h=b.element,Xd(r,a),hl(a,u,null,o);var w=a.memoizedState;if(u=w.cache,Di(a,fn,u),u!==b.cache&&Hd(a,[fn],o,!0),pl(),u=w.element,b.isDehydrated)if(b={element:u,isDehydrated:!1,cache:w.cache},a.updateQueue.baseState=b,a.memoizedState=b,a.flags&256){a=Uv(r,a,u,o);break e}else if(u!==h){h=yr(Error(i(424)),a),sl(h),a=Uv(r,a,u,o);break e}else{switch(r=a.stateNode.containerInfo,r.nodeType){case 9:r=r.body;break;default:r=r.nodeName==="HTML"?r.ownerDocument.body:r}for(Jt=Pr(r.firstChild),In=a,St=!0,xa=null,Hr=!0,o=Sv(a,null,u,o),a.child=o;o;)o.flags=o.flags&-3|4096,o=o.sibling}else{if(al(),u===h){a=di(r,a,o);break e}wn(r,a,u,o)}a=a.child}return a;case 26:return fc(r,a),r===null?(o=W_(a.type,null,a.pendingProps,null))?a.memoizedState=o:St||(o=a.type,r=a.pendingProps,u=Oc(be.current).createElement(o),u[ye]=a,u[Te]=r,Sn(u,o,r),Kt(u),a.stateNode=u):a.memoizedState=W_(a.type,r.memoizedProps,a.pendingProps,r.memoizedState),null;case 27:return $e(a),r===null&&St&&(u=a.stateNode=K_(a.type,a.pendingProps,be.current),In=a,Hr=!0,h=Jt,Vi(a.type)?(lp=h,Jt=Pr(u.firstChild)):Jt=h),wn(r,a,a.pendingProps.children,o),fc(r,a),r===null&&(a.flags|=4194304),a.child;case 5:return r===null&&St&&((h=u=Jt)&&(u=LT(u,a.type,a.pendingProps,Hr),u!==null?(a.stateNode=u,In=a,Jt=Pr(u.firstChild),Hr=!1,h=!0):h=!1),h||wa(a)),$e(a),h=a.type,b=a.pendingProps,w=r!==null?r.memoizedProps:null,u=b.children,rp(h,b)?u=null:w!==null&&rp(h,w)&&(a.flags|=32),a.memoizedState!==null&&(h=tf(r,a,eT,null,null,o),Ll._currentValue=h),fc(r,a),wn(r,a,u,o),a.child;case 6:return r===null&&St&&((r=o=Jt)&&(o=jT(o,a.pendingProps,Hr),o!==null?(a.stateNode=o,In=a,Jt=null,r=!0):r=!1),r||wa(a)),null;case 13:return Hv(r,a,o);case 4:return Me(a,a.stateNode.containerInfo),u=a.pendingProps,r===null?a.child=ls(a,null,u,o):wn(r,a,u,o),a.child;case 11:return Iv(r,a,a.type,a.pendingProps,o);case 7:return wn(r,a,a.pendingProps,o),a.child;case 8:return wn(r,a,a.pendingProps.children,o),a.child;case 12:return wn(r,a,a.pendingProps.children,o),a.child;case 10:return u=a.pendingProps,Di(a,a.type,u.value),wn(r,a,u.children,o),a.child;case 9:return h=a.type._context,u=a.pendingProps.children,Sa(a),h=Nn(h),u=u(h),a.flags|=1,wn(r,a,u,o),a.child;case 14:return Lv(r,a,a.type,a.pendingProps,o);case 15:return jv(r,a,a.type,a.pendingProps,o);case 19:return Gv(r,a,o);case 31:return u=a.pendingProps,o=a.mode,u={mode:u.mode,children:u.children},r===null?(o=pc(u,o),o.ref=a.ref,a.child=o,o.return=a,a=o):(o=ii(r.child,u),o.ref=a.ref,a.child=o,o.return=a,a=o),a;case 22:return $v(r,a,o);case 24:return Sa(a),u=Nn(fn),r===null?(h=Vd(),h===null&&(h=Bt,b=qd(),h.pooledCache=b,b.refCount++,b!==null&&(h.pooledCacheLanes|=o),h=b),a.memoizedState={parent:u,cache:h},Yd(a),Di(a,fn,h)):((r.lanes&o)!==0&&(Xd(r,a),hl(a,null,null,o),pl()),h=r.memoizedState,b=a.memoizedState,h.parent!==u?(h={parent:u,cache:u},a.memoizedState=h,a.lanes===0&&(a.memoizedState=a.updateQueue.baseState=h),Di(a,fn,u)):(u=b.cache,Di(a,fn,u),u!==h.cache&&Hd(a,[fn],o,!0))),wn(r,a,a.pendingProps.children,o),a.child;case 29:throw a.pendingProps}throw Error(i(156,a.tag))}function fi(r){r.flags|=4}function Kv(r,a){if(a.type!=="stylesheet"||(a.state.loading&4)!==0)r.flags&=-16777217;else if(r.flags|=16777216,!tx(a)){if(a=wr.current,a!==null&&((bt&4194048)===bt?qr!==null:(bt&62914560)!==bt&&(bt&536870912)===0||a!==qr))throw dl=Kd,Ay;r.flags|=8192}}function hc(r,a){a!==null&&(r.flags|=4),r.flags&16384&&(a=r.tag!==22?la():536870912,r.lanes|=a,ds|=a)}function xl(r,a){if(!St)switch(r.tailMode){case"hidden":a=r.tail;for(var o=null;a!==null;)a.alternate!==null&&(o=a),a=a.sibling;o===null?r.tail=null:o.sibling=null;break;case"collapsed":o=r.tail;for(var u=null;o!==null;)o.alternate!==null&&(u=o),o=o.sibling;u===null?a||r.tail===null?r.tail=null:r.tail.sibling=null:u.sibling=null}}function Xt(r){var a=r.alternate!==null&&r.alternate.child===r.child,o=0,u=0;if(a)for(var h=r.child;h!==null;)o|=h.lanes|h.childLanes,u|=h.subtreeFlags&65011712,u|=h.flags&65011712,h.return=r,h=h.sibling;else for(h=r.child;h!==null;)o|=h.lanes|h.childLanes,u|=h.subtreeFlags,u|=h.flags,h.return=r,h=h.sibling;return r.subtreeFlags|=u,r.childLanes=o,a}function cT(r,a,o){var u=a.pendingProps;switch(zd(a),a.tag){case 31:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Xt(a),null;case 1:return Xt(a),null;case 3:return o=a.stateNode,u=null,r!==null&&(u=r.memoizedState.cache),a.memoizedState.cache!==u&&(a.flags|=2048),oi(fn),at(),o.pendingContext&&(o.context=o.pendingContext,o.pendingContext=null),(r===null||r.child===null)&&(il(a)?fi(a):r===null||r.memoizedState.isDehydrated&&(a.flags&256)===0||(a.flags|=1024,Cy())),Xt(a),null;case 26:return o=a.memoizedState,r===null?(fi(a),o!==null?(Xt(a),Kv(a,o)):(Xt(a),a.flags&=-16777217)):o?o!==r.memoizedState?(fi(a),Xt(a),Kv(a,o)):(Xt(a),a.flags&=-16777217):(r.memoizedProps!==u&&fi(a),Xt(a),a.flags&=-16777217),null;case 27:ie(a),o=be.current;var h=a.type;if(r!==null&&a.stateNode!=null)r.memoizedProps!==u&&fi(a);else{if(!u){if(a.stateNode===null)throw Error(i(166));return Xt(a),null}r=fe.current,il(a)?Ey(a):(r=K_(h,u,o),a.stateNode=r,fi(a))}return Xt(a),null;case 5:if(ie(a),o=a.type,r!==null&&a.stateNode!=null)r.memoizedProps!==u&&fi(a);else{if(!u){if(a.stateNode===null)throw Error(i(166));return Xt(a),null}if(r=fe.current,il(a))Ey(a);else{switch(h=Oc(be.current),r){case 1:r=h.createElementNS("http://www.w3.org/2000/svg",o);break;case 2:r=h.createElementNS("http://www.w3.org/1998/Math/MathML",o);break;default:switch(o){case"svg":r=h.createElementNS("http://www.w3.org/2000/svg",o);break;case"math":r=h.createElementNS("http://www.w3.org/1998/Math/MathML",o);break;case"script":r=h.createElement("div"),r.innerHTML="<script><\/script>",r=r.removeChild(r.firstChild);break;case"select":r=typeof u.is=="string"?h.createElement("select",{is:u.is}):h.createElement("select"),u.multiple?r.multiple=!0:u.size&&(r.size=u.size);break;default:r=typeof u.is=="string"?h.createElement(o,{is:u.is}):h.createElement(o)}}r[ye]=a,r[Te]=u;e:for(h=a.child;h!==null;){if(h.tag===5||h.tag===6)r.appendChild(h.stateNode);else if(h.tag!==4&&h.tag!==27&&h.child!==null){h.child.return=h,h=h.child;continue}if(h===a)break e;for(;h.sibling===null;){if(h.return===null||h.return===a)break e;h=h.return}h.sibling.return=h.return,h=h.sibling}a.stateNode=r;e:switch(Sn(r,o,u),o){case"button":case"input":case"select":case"textarea":r=!!u.autoFocus;break e;case"img":r=!0;break e;default:r=!1}r&&fi(a)}}return Xt(a),a.flags&=-16777217,null;case 6:if(r&&a.stateNode!=null)r.memoizedProps!==u&&fi(a);else{if(typeof u!="string"&&a.stateNode===null)throw Error(i(166));if(r=be.current,il(a)){if(r=a.stateNode,o=a.memoizedProps,u=null,h=In,h!==null)switch(h.tag){case 27:case 5:u=h.memoizedProps}r[ye]=a,r=!!(r.nodeValue===o||u!==null&&u.suppressHydrationWarning===!0||B_(r.nodeValue,o)),r||wa(a)}else r=Oc(r).createTextNode(u),r[ye]=a,a.stateNode=r}return Xt(a),null;case 13:if(u=a.memoizedState,r===null||r.memoizedState!==null&&r.memoizedState.dehydrated!==null){if(h=il(a),u!==null&&u.dehydrated!==null){if(r===null){if(!h)throw Error(i(318));if(h=a.memoizedState,h=h!==null?h.dehydrated:null,!h)throw Error(i(317));h[ye]=a}else al(),(a.flags&128)===0&&(a.memoizedState=null),a.flags|=4;Xt(a),h=!1}else h=Cy(),r!==null&&r.memoizedState!==null&&(r.memoizedState.hydrationErrors=h),h=!0;if(!h)return a.flags&256?(ui(a),a):(ui(a),null)}if(ui(a),(a.flags&128)!==0)return a.lanes=o,a;if(o=u!==null,r=r!==null&&r.memoizedState!==null,o){u=a.child,h=null,u.alternate!==null&&u.alternate.memoizedState!==null&&u.alternate.memoizedState.cachePool!==null&&(h=u.alternate.memoizedState.cachePool.pool);var b=null;u.memoizedState!==null&&u.memoizedState.cachePool!==null&&(b=u.memoizedState.cachePool.pool),b!==h&&(u.flags|=2048)}return o!==r&&o&&(a.child.flags|=8192),hc(a,a.updateQueue),Xt(a),null;case 4:return at(),r===null&&Qf(a.stateNode.containerInfo),Xt(a),null;case 10:return oi(a.type),Xt(a),null;case 19:if(U(pn),h=a.memoizedState,h===null)return Xt(a),null;if(u=(a.flags&128)!==0,b=h.rendering,b===null)if(u)xl(h,!1);else{if(en!==0||r!==null&&(r.flags&128)!==0)for(r=a.child;r!==null;){if(b=cc(r),b!==null){for(a.flags|=128,xl(h,!1),r=b.updateQueue,a.updateQueue=r,hc(a,r),a.subtreeFlags=0,r=o,o=a.child;o!==null;)xy(o,r),o=o.sibling;return R(pn,pn.current&1|2),a.child}r=r.sibling}h.tail!==null&&_t()>bc&&(a.flags|=128,u=!0,xl(h,!1),a.lanes=4194304)}else{if(!u)if(r=cc(b),r!==null){if(a.flags|=128,u=!0,r=r.updateQueue,a.updateQueue=r,hc(a,r),xl(h,!0),h.tail===null&&h.tailMode==="hidden"&&!b.alternate&&!St)return Xt(a),null}else 2*_t()-h.renderingStartTime>bc&&o!==536870912&&(a.flags|=128,u=!0,xl(h,!1),a.lanes=4194304);h.isBackwards?(b.sibling=a.child,a.child=b):(r=h.last,r!==null?r.sibling=b:a.child=b,h.last=b)}return h.tail!==null?(a=h.tail,h.rendering=a,h.tail=a.sibling,h.renderingStartTime=_t(),a.sibling=null,r=pn.current,R(pn,u?r&1|2:r&1),a):(Xt(a),null);case 22:case 23:return ui(a),Jd(),u=a.memoizedState!==null,r!==null?r.memoizedState!==null!==u&&(a.flags|=8192):u&&(a.flags|=8192),u?(o&536870912)!==0&&(a.flags&128)===0&&(Xt(a),a.subtreeFlags&6&&(a.flags|=8192)):Xt(a),o=a.updateQueue,o!==null&&hc(a,o.retryQueue),o=null,r!==null&&r.memoizedState!==null&&r.memoizedState.cachePool!==null&&(o=r.memoizedState.cachePool.pool),u=null,a.memoizedState!==null&&a.memoizedState.cachePool!==null&&(u=a.memoizedState.cachePool.pool),u!==o&&(a.flags|=2048),r!==null&&U(Ca),null;case 24:return o=null,r!==null&&(o=r.memoizedState.cache),a.memoizedState.cache!==o&&(a.flags|=2048),oi(fn),Xt(a),null;case 25:return null;case 30:return null}throw Error(i(156,a.tag))}function uT(r,a){switch(zd(a),a.tag){case 1:return r=a.flags,r&65536?(a.flags=r&-65537|128,a):null;case 3:return oi(fn),at(),r=a.flags,(r&65536)!==0&&(r&128)===0?(a.flags=r&-65537|128,a):null;case 26:case 27:case 5:return ie(a),null;case 13:if(ui(a),r=a.memoizedState,r!==null&&r.dehydrated!==null){if(a.alternate===null)throw Error(i(340));al()}return r=a.flags,r&65536?(a.flags=r&-65537|128,a):null;case 19:return U(pn),null;case 4:return at(),null;case 10:return oi(a.type),null;case 22:case 23:return ui(a),Jd(),r!==null&&U(Ca),r=a.flags,r&65536?(a.flags=r&-65537|128,a):null;case 24:return oi(fn),null;case 25:return null;default:return null}}function Yv(r,a){switch(zd(a),a.tag){case 3:oi(fn),at();break;case 26:case 27:case 5:ie(a);break;case 4:at();break;case 13:ui(a);break;case 19:U(pn);break;case 10:oi(a.type);break;case 22:case 23:ui(a),Jd(),r!==null&&U(Ca);break;case 24:oi(fn)}}function wl(r,a){try{var o=a.updateQueue,u=o!==null?o.lastEffect:null;if(u!==null){var h=u.next;o=h;do{if((o.tag&r)===r){u=void 0;var b=o.create,w=o.inst;u=b(),w.destroy=u}o=o.next}while(o!==h)}}catch(O){jt(a,a.return,O)}}function $i(r,a,o){try{var u=a.updateQueue,h=u!==null?u.lastEffect:null;if(h!==null){var b=h.next;u=b;do{if((u.tag&r)===r){var w=u.inst,O=w.destroy;if(O!==void 0){w.destroy=void 0,h=a;var L=o,Y=O;try{Y()}catch(le){jt(h,L,le)}}}u=u.next}while(u!==b)}}catch(le){jt(a,a.return,le)}}function Xv(r){var a=r.updateQueue;if(a!==null){var o=r.stateNode;try{Ly(a,o)}catch(u){jt(r,r.return,u)}}}function Wv(r,a,o){o.props=Oa(r.type,r.memoizedProps),o.state=r.memoizedState;try{o.componentWillUnmount()}catch(u){jt(r,a,u)}}function El(r,a){try{var o=r.ref;if(o!==null){switch(r.tag){case 26:case 27:case 5:var u=r.stateNode;break;case 30:u=r.stateNode;break;default:u=r.stateNode}typeof o=="function"?r.refCleanup=o(u):o.current=u}}catch(h){jt(r,a,h)}}function Gr(r,a){var o=r.ref,u=r.refCleanup;if(o!==null)if(typeof u=="function")try{u()}catch(h){jt(r,a,h)}finally{r.refCleanup=null,r=r.alternate,r!=null&&(r.refCleanup=null)}else if(typeof o=="function")try{o(null)}catch(h){jt(r,a,h)}else o.current=null}function Zv(r){var a=r.type,o=r.memoizedProps,u=r.stateNode;try{e:switch(a){case"button":case"input":case"select":case"textarea":o.autoFocus&&u.focus();break e;case"img":o.src?u.src=o.src:o.srcSet&&(u.srcset=o.srcSet)}}catch(h){jt(r,r.return,h)}}function Rf(r,a,o){try{var u=r.stateNode;DT(u,r.type,o,a),u[Te]=a}catch(h){jt(r,r.return,h)}}function Qv(r){return r.tag===5||r.tag===3||r.tag===26||r.tag===27&&Vi(r.type)||r.tag===4}function Nf(r){e:for(;;){for(;r.sibling===null;){if(r.return===null||Qv(r.return))return null;r=r.return}for(r.sibling.return=r.return,r=r.sibling;r.tag!==5&&r.tag!==6&&r.tag!==18;){if(r.tag===27&&Vi(r.type)||r.flags&2||r.child===null||r.tag===4)continue e;r.child.return=r,r=r.child}if(!(r.flags&2))return r.stateNode}}function Af(r,a,o){var u=r.tag;if(u===5||u===6)r=r.stateNode,a?(o.nodeType===9?o.body:o.nodeName==="HTML"?o.ownerDocument.body:o).insertBefore(r,a):(a=o.nodeType===9?o.body:o.nodeName==="HTML"?o.ownerDocument.body:o,a.appendChild(r),o=o._reactRootContainer,o!=null||a.onclick!==null||(a.onclick=Tc));else if(u!==4&&(u===27&&Vi(r.type)&&(o=r.stateNode,a=null),r=r.child,r!==null))for(Af(r,a,o),r=r.sibling;r!==null;)Af(r,a,o),r=r.sibling}function mc(r,a,o){var u=r.tag;if(u===5||u===6)r=r.stateNode,a?o.insertBefore(r,a):o.appendChild(r);else if(u!==4&&(u===27&&Vi(r.type)&&(o=r.stateNode),r=r.child,r!==null))for(mc(r,a,o),r=r.sibling;r!==null;)mc(r,a,o),r=r.sibling}function Jv(r){var a=r.stateNode,o=r.memoizedProps;try{for(var u=r.type,h=a.attributes;h.length;)a.removeAttributeNode(h[0]);Sn(a,u,o),a[ye]=r,a[Te]=o}catch(b){jt(r,r.return,b)}}var pi=!1,rn=!1,Df=!1,e_=typeof WeakSet=="function"?WeakSet:Set,yn=null;function dT(r,a){if(r=r.containerInfo,tp=Mc,r=dy(r),Rd(r)){if("selectionStart"in r)var o={start:r.selectionStart,end:r.selectionEnd};else e:{o=(o=r.ownerDocument)&&o.defaultView||window;var u=o.getSelection&&o.getSelection();if(u&&u.rangeCount!==0){o=u.anchorNode;var h=u.anchorOffset,b=u.focusNode;u=u.focusOffset;try{o.nodeType,b.nodeType}catch{o=null;break e}var w=0,O=-1,L=-1,Y=0,le=0,ce=r,Q=null;t:for(;;){for(var J;ce!==o||h!==0&&ce.nodeType!==3||(O=w+h),ce!==b||u!==0&&ce.nodeType!==3||(L=w+u),ce.nodeType===3&&(w+=ce.nodeValue.length),(J=ce.firstChild)!==null;)Q=ce,ce=J;for(;;){if(ce===r)break t;if(Q===o&&++Y===h&&(O=w),Q===b&&++le===u&&(L=w),(J=ce.nextSibling)!==null)break;ce=Q,Q=ce.parentNode}ce=J}o=O===-1||L===-1?null:{start:O,end:L}}else o=null}o=o||{start:0,end:0}}else o=null;for(np={focusedElem:r,selectionRange:o},Mc=!1,yn=a;yn!==null;)if(a=yn,r=a.child,(a.subtreeFlags&1024)!==0&&r!==null)r.return=a,yn=r;else for(;yn!==null;){switch(a=yn,b=a.alternate,r=a.flags,a.tag){case 0:break;case 11:case 15:break;case 1:if((r&1024)!==0&&b!==null){r=void 0,o=a,h=b.memoizedProps,b=b.memoizedState,u=o.stateNode;try{var Ge=Oa(o.type,h,o.elementType===o.type);r=u.getSnapshotBeforeUpdate(Ge,b),u.__reactInternalSnapshotBeforeUpdate=r}catch(Ue){jt(o,o.return,Ue)}}break;case 3:if((r&1024)!==0){if(r=a.stateNode.containerInfo,o=r.nodeType,o===9)ap(r);else if(o===1)switch(r.nodeName){case"HEAD":case"HTML":case"BODY":ap(r);break;default:r.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;default:if((r&1024)!==0)throw Error(i(163))}if(r=a.sibling,r!==null){r.return=a.return,yn=r;break}yn=a.return}}function t_(r,a,o){var u=o.flags;switch(o.tag){case 0:case 11:case 15:zi(r,o),u&4&&wl(5,o);break;case 1:if(zi(r,o),u&4)if(r=o.stateNode,a===null)try{r.componentDidMount()}catch(w){jt(o,o.return,w)}else{var h=Oa(o.type,a.memoizedProps);a=a.memoizedState;try{r.componentDidUpdate(h,a,r.__reactInternalSnapshotBeforeUpdate)}catch(w){jt(o,o.return,w)}}u&64&&Xv(o),u&512&&El(o,o.return);break;case 3:if(zi(r,o),u&64&&(r=o.updateQueue,r!==null)){if(a=null,o.child!==null)switch(o.child.tag){case 27:case 5:a=o.child.stateNode;break;case 1:a=o.child.stateNode}try{Ly(r,a)}catch(w){jt(o,o.return,w)}}break;case 27:a===null&&u&4&&Jv(o);case 26:case 5:zi(r,o),a===null&&u&4&&Zv(o),u&512&&El(o,o.return);break;case 12:zi(r,o);break;case 13:zi(r,o),u&4&&i_(r,o),u&64&&(r=o.memoizedState,r!==null&&(r=r.dehydrated,r!==null&&(o=_T.bind(null,o),$T(r,o))));break;case 22:if(u=o.memoizedState!==null||pi,!u){a=a!==null&&a.memoizedState!==null||rn,h=pi;var b=rn;pi=u,(rn=a)&&!b?Bi(r,o,(o.subtreeFlags&8772)!==0):zi(r,o),pi=h,rn=b}break;case 30:break;default:zi(r,o)}}function n_(r){var a=r.alternate;a!==null&&(r.alternate=null,n_(a)),r.child=null,r.deletions=null,r.sibling=null,r.tag===5&&(a=r.stateNode,a!==null&&ca(a)),r.stateNode=null,r.return=null,r.dependencies=null,r.memoizedProps=null,r.memoizedState=null,r.pendingProps=null,r.stateNode=null,r.updateQueue=null}var qt=null,Kn=!1;function hi(r,a,o){for(o=o.child;o!==null;)r_(r,a,o),o=o.sibling}function r_(r,a,o){if(de&&typeof de.onCommitFiberUnmount=="function")try{de.onCommitFiberUnmount(ne,o)}catch{}switch(o.tag){case 26:rn||Gr(o,a),hi(r,a,o),o.memoizedState?o.memoizedState.count--:o.stateNode&&(o=o.stateNode,o.parentNode.removeChild(o));break;case 27:rn||Gr(o,a);var u=qt,h=Kn;Vi(o.type)&&(qt=o.stateNode,Kn=!1),hi(r,a,o),kl(o.stateNode),qt=u,Kn=h;break;case 5:rn||Gr(o,a);case 6:if(u=qt,h=Kn,qt=null,hi(r,a,o),qt=u,Kn=h,qt!==null)if(Kn)try{(qt.nodeType===9?qt.body:qt.nodeName==="HTML"?qt.ownerDocument.body:qt).removeChild(o.stateNode)}catch(b){jt(o,a,b)}else try{qt.removeChild(o.stateNode)}catch(b){jt(o,a,b)}break;case 18:qt!==null&&(Kn?(r=qt,G_(r.nodeType===9?r.body:r.nodeName==="HTML"?r.ownerDocument.body:r,o.stateNode),Bl(r)):G_(qt,o.stateNode));break;case 4:u=qt,h=Kn,qt=o.stateNode.containerInfo,Kn=!0,hi(r,a,o),qt=u,Kn=h;break;case 0:case 11:case 14:case 15:rn||$i(2,o,a),rn||$i(4,o,a),hi(r,a,o);break;case 1:rn||(Gr(o,a),u=o.stateNode,typeof u.componentWillUnmount=="function"&&Wv(o,a,u)),hi(r,a,o);break;case 21:hi(r,a,o);break;case 22:rn=(u=rn)||o.memoizedState!==null,hi(r,a,o),rn=u;break;default:hi(r,a,o)}}function i_(r,a){if(a.memoizedState===null&&(r=a.alternate,r!==null&&(r=r.memoizedState,r!==null&&(r=r.dehydrated,r!==null))))try{Bl(r)}catch(o){jt(a,a.return,o)}}function fT(r){switch(r.tag){case 13:case 19:var a=r.stateNode;return a===null&&(a=r.stateNode=new e_),a;case 22:return r=r.stateNode,a=r._retryCache,a===null&&(a=r._retryCache=new e_),a;default:throw Error(i(435,r.tag))}}function kf(r,a){var o=fT(r);a.forEach(function(u){var h=xT.bind(null,r,u);o.has(u)||(o.add(u),u.then(h,h))})}function rr(r,a){var o=a.deletions;if(o!==null)for(var u=0;u<o.length;u++){var h=o[u],b=r,w=a,O=w;e:for(;O!==null;){switch(O.tag){case 27:if(Vi(O.type)){qt=O.stateNode,Kn=!1;break e}break;case 5:qt=O.stateNode,Kn=!1;break e;case 3:case 4:qt=O.stateNode.containerInfo,Kn=!0;break e}O=O.return}if(qt===null)throw Error(i(160));r_(b,w,h),qt=null,Kn=!1,b=h.alternate,b!==null&&(b.return=null),h.return=null}if(a.subtreeFlags&13878)for(a=a.child;a!==null;)a_(a,r),a=a.sibling}var Mr=null;function a_(r,a){var o=r.alternate,u=r.flags;switch(r.tag){case 0:case 11:case 14:case 15:rr(a,r),ir(r),u&4&&($i(3,r,r.return),wl(3,r),$i(5,r,r.return));break;case 1:rr(a,r),ir(r),u&512&&(rn||o===null||Gr(o,o.return)),u&64&&pi&&(r=r.updateQueue,r!==null&&(u=r.callbacks,u!==null&&(o=r.shared.hiddenCallbacks,r.shared.hiddenCallbacks=o===null?u:o.concat(u))));break;case 26:var h=Mr;if(rr(a,r),ir(r),u&512&&(rn||o===null||Gr(o,o.return)),u&4){var b=o!==null?o.memoizedState:null;if(u=r.memoizedState,o===null)if(u===null)if(r.stateNode===null){e:{u=r.type,o=r.memoizedProps,h=h.ownerDocument||h;t:switch(u){case"title":b=h.getElementsByTagName("title")[0],(!b||b[Rr]||b[ye]||b.namespaceURI==="http://www.w3.org/2000/svg"||b.hasAttribute("itemprop"))&&(b=h.createElement(u),h.head.insertBefore(b,h.querySelector("head > title"))),Sn(b,u,o),b[ye]=r,Kt(b),u=b;break e;case"link":var w=J_("link","href",h).get(u+(o.href||""));if(w){for(var O=0;O<w.length;O++)if(b=w[O],b.getAttribute("href")===(o.href==null||o.href===""?null:o.href)&&b.getAttribute("rel")===(o.rel==null?null:o.rel)&&b.getAttribute("title")===(o.title==null?null:o.title)&&b.getAttribute("crossorigin")===(o.crossOrigin==null?null:o.crossOrigin)){w.splice(O,1);break t}}b=h.createElement(u),Sn(b,u,o),h.head.appendChild(b);break;case"meta":if(w=J_("meta","content",h).get(u+(o.content||""))){for(O=0;O<w.length;O++)if(b=w[O],b.getAttribute("content")===(o.content==null?null:""+o.content)&&b.getAttribute("name")===(o.name==null?null:o.name)&&b.getAttribute("property")===(o.property==null?null:o.property)&&b.getAttribute("http-equiv")===(o.httpEquiv==null?null:o.httpEquiv)&&b.getAttribute("charset")===(o.charSet==null?null:o.charSet)){w.splice(O,1);break t}}b=h.createElement(u),Sn(b,u,o),h.head.appendChild(b);break;default:throw Error(i(468,u))}b[ye]=r,Kt(b),u=b}r.stateNode=u}else ex(h,r.type,r.stateNode);else r.stateNode=Q_(h,u,r.memoizedProps);else b!==u?(b===null?o.stateNode!==null&&(o=o.stateNode,o.parentNode.removeChild(o)):b.count--,u===null?ex(h,r.type,r.stateNode):Q_(h,u,r.memoizedProps)):u===null&&r.stateNode!==null&&Rf(r,r.memoizedProps,o.memoizedProps)}break;case 27:rr(a,r),ir(r),u&512&&(rn||o===null||Gr(o,o.return)),o!==null&&u&4&&Rf(r,r.memoizedProps,o.memoizedProps);break;case 5:if(rr(a,r),ir(r),u&512&&(rn||o===null||Gr(o,o.return)),r.flags&32){h=r.stateNode;try{Ur(h,"")}catch(J){jt(r,r.return,J)}}u&4&&r.stateNode!=null&&(h=r.memoizedProps,Rf(r,h,o!==null?o.memoizedProps:h)),u&1024&&(Df=!0);break;case 6:if(rr(a,r),ir(r),u&4){if(r.stateNode===null)throw Error(i(162));u=r.memoizedProps,o=r.stateNode;try{o.nodeValue=u}catch(J){jt(r,r.return,J)}}break;case 3:if(Ac=null,h=Mr,Mr=Rc(a.containerInfo),rr(a,r),Mr=h,ir(r),u&4&&o!==null&&o.memoizedState.isDehydrated)try{Bl(a.containerInfo)}catch(J){jt(r,r.return,J)}Df&&(Df=!1,s_(r));break;case 4:u=Mr,Mr=Rc(r.stateNode.containerInfo),rr(a,r),ir(r),Mr=u;break;case 12:rr(a,r),ir(r);break;case 13:rr(a,r),ir(r),r.child.flags&8192&&r.memoizedState!==null!=(o!==null&&o.memoizedState!==null)&&($f=_t()),u&4&&(u=r.updateQueue,u!==null&&(r.updateQueue=null,kf(r,u)));break;case 22:h=r.memoizedState!==null;var L=o!==null&&o.memoizedState!==null,Y=pi,le=rn;if(pi=Y||h,rn=le||L,rr(a,r),rn=le,pi=Y,ir(r),u&8192)e:for(a=r.stateNode,a._visibility=h?a._visibility&-2:a._visibility|1,h&&(o===null||L||pi||rn||Ra(r)),o=null,a=r;;){if(a.tag===5||a.tag===26){if(o===null){L=o=a;try{if(b=L.stateNode,h)w=b.style,typeof w.setProperty=="function"?w.setProperty("display","none","important"):w.display="none";else{O=L.stateNode;var ce=L.memoizedProps.style,Q=ce!=null&&ce.hasOwnProperty("display")?ce.display:null;O.style.display=Q==null||typeof Q=="boolean"?"":(""+Q).trim()}}catch(J){jt(L,L.return,J)}}}else if(a.tag===6){if(o===null){L=a;try{L.stateNode.nodeValue=h?"":L.memoizedProps}catch(J){jt(L,L.return,J)}}}else if((a.tag!==22&&a.tag!==23||a.memoizedState===null||a===r)&&a.child!==null){a.child.return=a,a=a.child;continue}if(a===r)break e;for(;a.sibling===null;){if(a.return===null||a.return===r)break e;o===a&&(o=null),a=a.return}o===a&&(o=null),a.sibling.return=a.return,a=a.sibling}u&4&&(u=r.updateQueue,u!==null&&(o=u.retryQueue,o!==null&&(u.retryQueue=null,kf(r,o))));break;case 19:rr(a,r),ir(r),u&4&&(u=r.updateQueue,u!==null&&(r.updateQueue=null,kf(r,u)));break;case 30:break;case 21:break;default:rr(a,r),ir(r)}}function ir(r){var a=r.flags;if(a&2){try{for(var o,u=r.return;u!==null;){if(Qv(u)){o=u;break}u=u.return}if(o==null)throw Error(i(160));switch(o.tag){case 27:var h=o.stateNode,b=Nf(r);mc(r,b,h);break;case 5:var w=o.stateNode;o.flags&32&&(Ur(w,""),o.flags&=-33);var O=Nf(r);mc(r,O,w);break;case 3:case 4:var L=o.stateNode.containerInfo,Y=Nf(r);Af(r,Y,L);break;default:throw Error(i(161))}}catch(le){jt(r,r.return,le)}r.flags&=-3}a&4096&&(r.flags&=-4097)}function s_(r){if(r.subtreeFlags&1024)for(r=r.child;r!==null;){var a=r;s_(a),a.tag===5&&a.flags&1024&&a.stateNode.reset(),r=r.sibling}}function zi(r,a){if(a.subtreeFlags&8772)for(a=a.child;a!==null;)t_(r,a.alternate,a),a=a.sibling}function Ra(r){for(r=r.child;r!==null;){var a=r;switch(a.tag){case 0:case 11:case 14:case 15:$i(4,a,a.return),Ra(a);break;case 1:Gr(a,a.return);var o=a.stateNode;typeof o.componentWillUnmount=="function"&&Wv(a,a.return,o),Ra(a);break;case 27:kl(a.stateNode);case 26:case 5:Gr(a,a.return),Ra(a);break;case 22:a.memoizedState===null&&Ra(a);break;case 30:Ra(a);break;default:Ra(a)}r=r.sibling}}function Bi(r,a,o){for(o=o&&(a.subtreeFlags&8772)!==0,a=a.child;a!==null;){var u=a.alternate,h=r,b=a,w=b.flags;switch(b.tag){case 0:case 11:case 15:Bi(h,b,o),wl(4,b);break;case 1:if(Bi(h,b,o),u=b,h=u.stateNode,typeof h.componentDidMount=="function")try{h.componentDidMount()}catch(Y){jt(u,u.return,Y)}if(u=b,h=u.updateQueue,h!==null){var O=u.stateNode;try{var L=h.shared.hiddenCallbacks;if(L!==null)for(h.shared.hiddenCallbacks=null,h=0;h<L.length;h++)Iy(L[h],O)}catch(Y){jt(u,u.return,Y)}}o&&w&64&&Xv(b),El(b,b.return);break;case 27:Jv(b);case 26:case 5:Bi(h,b,o),o&&u===null&&w&4&&Zv(b),El(b,b.return);break;case 12:Bi(h,b,o);break;case 13:Bi(h,b,o),o&&w&4&&i_(h,b);break;case 22:b.memoizedState===null&&Bi(h,b,o),El(b,b.return);break;case 30:break;default:Bi(h,b,o)}a=a.sibling}}function Mf(r,a){var o=null;r!==null&&r.memoizedState!==null&&r.memoizedState.cachePool!==null&&(o=r.memoizedState.cachePool.pool),r=null,a.memoizedState!==null&&a.memoizedState.cachePool!==null&&(r=a.memoizedState.cachePool.pool),r!==o&&(r!=null&&r.refCount++,o!=null&&ol(o))}function Pf(r,a){r=null,a.alternate!==null&&(r=a.alternate.memoizedState.cache),a=a.memoizedState.cache,a!==r&&(a.refCount++,r!=null&&ol(r))}function Vr(r,a,o,u){if(a.subtreeFlags&10256)for(a=a.child;a!==null;)l_(r,a,o,u),a=a.sibling}function l_(r,a,o,u){var h=a.flags;switch(a.tag){case 0:case 11:case 15:Vr(r,a,o,u),h&2048&&wl(9,a);break;case 1:Vr(r,a,o,u);break;case 3:Vr(r,a,o,u),h&2048&&(r=null,a.alternate!==null&&(r=a.alternate.memoizedState.cache),a=a.memoizedState.cache,a!==r&&(a.refCount++,r!=null&&ol(r)));break;case 12:if(h&2048){Vr(r,a,o,u),r=a.stateNode;try{var b=a.memoizedProps,w=b.id,O=b.onPostCommit;typeof O=="function"&&O(w,a.alternate===null?"mount":"update",r.passiveEffectDuration,-0)}catch(L){jt(a,a.return,L)}}else Vr(r,a,o,u);break;case 13:Vr(r,a,o,u);break;case 23:break;case 22:b=a.stateNode,w=a.alternate,a.memoizedState!==null?b._visibility&2?Vr(r,a,o,u):Sl(r,a):b._visibility&2?Vr(r,a,o,u):(b._visibility|=2,os(r,a,o,u,(a.subtreeFlags&10256)!==0)),h&2048&&Mf(w,a);break;case 24:Vr(r,a,o,u),h&2048&&Pf(a.alternate,a);break;default:Vr(r,a,o,u)}}function os(r,a,o,u,h){for(h=h&&(a.subtreeFlags&10256)!==0,a=a.child;a!==null;){var b=r,w=a,O=o,L=u,Y=w.flags;switch(w.tag){case 0:case 11:case 15:os(b,w,O,L,h),wl(8,w);break;case 23:break;case 22:var le=w.stateNode;w.memoizedState!==null?le._visibility&2?os(b,w,O,L,h):Sl(b,w):(le._visibility|=2,os(b,w,O,L,h)),h&&Y&2048&&Mf(w.alternate,w);break;case 24:os(b,w,O,L,h),h&&Y&2048&&Pf(w.alternate,w);break;default:os(b,w,O,L,h)}a=a.sibling}}function Sl(r,a){if(a.subtreeFlags&10256)for(a=a.child;a!==null;){var o=r,u=a,h=u.flags;switch(u.tag){case 22:Sl(o,u),h&2048&&Mf(u.alternate,u);break;case 24:Sl(o,u),h&2048&&Pf(u.alternate,u);break;default:Sl(o,u)}a=a.sibling}}var Cl=8192;function cs(r){if(r.subtreeFlags&Cl)for(r=r.child;r!==null;)o_(r),r=r.sibling}function o_(r){switch(r.tag){case 26:cs(r),r.flags&Cl&&r.memoizedState!==null&&ZT(Mr,r.memoizedState,r.memoizedProps);break;case 5:cs(r);break;case 3:case 4:var a=Mr;Mr=Rc(r.stateNode.containerInfo),cs(r),Mr=a;break;case 22:r.memoizedState===null&&(a=r.alternate,a!==null&&a.memoizedState!==null?(a=Cl,Cl=16777216,cs(r),Cl=a):cs(r));break;default:cs(r)}}function c_(r){var a=r.alternate;if(a!==null&&(r=a.child,r!==null)){a.child=null;do a=r.sibling,r.sibling=null,r=a;while(r!==null)}}function Tl(r){var a=r.deletions;if((r.flags&16)!==0){if(a!==null)for(var o=0;o<a.length;o++){var u=a[o];yn=u,d_(u,r)}c_(r)}if(r.subtreeFlags&10256)for(r=r.child;r!==null;)u_(r),r=r.sibling}function u_(r){switch(r.tag){case 0:case 11:case 15:Tl(r),r.flags&2048&&$i(9,r,r.return);break;case 3:Tl(r);break;case 12:Tl(r);break;case 22:var a=r.stateNode;r.memoizedState!==null&&a._visibility&2&&(r.return===null||r.return.tag!==13)?(a._visibility&=-3,gc(r)):Tl(r);break;default:Tl(r)}}function gc(r){var a=r.deletions;if((r.flags&16)!==0){if(a!==null)for(var o=0;o<a.length;o++){var u=a[o];yn=u,d_(u,r)}c_(r)}for(r=r.child;r!==null;){switch(a=r,a.tag){case 0:case 11:case 15:$i(8,a,a.return),gc(a);break;case 22:o=a.stateNode,o._visibility&2&&(o._visibility&=-3,gc(a));break;default:gc(a)}r=r.sibling}}function d_(r,a){for(;yn!==null;){var o=yn;switch(o.tag){case 0:case 11:case 15:$i(8,o,a);break;case 23:case 22:if(o.memoizedState!==null&&o.memoizedState.cachePool!==null){var u=o.memoizedState.cachePool.pool;u!=null&&u.refCount++}break;case 24:ol(o.memoizedState.cache)}if(u=o.child,u!==null)u.return=o,yn=u;else e:for(o=r;yn!==null;){u=yn;var h=u.sibling,b=u.return;if(n_(u),u===o){yn=null;break e}if(h!==null){h.return=b,yn=h;break e}yn=b}}}var pT={getCacheForType:function(r){var a=Nn(fn),o=a.data.get(r);return o===void 0&&(o=r(),a.data.set(r,o)),o}},hT=typeof WeakMap=="function"?WeakMap:Map,Dt=0,Bt=null,ut=null,bt=0,kt=0,ar=null,Fi=!1,us=!1,If=!1,mi=0,en=0,Ui=0,Na=0,Lf=0,Er=0,ds=0,Ol=null,Yn=null,jf=!1,$f=0,bc=1/0,yc=null,Hi=null,En=0,qi=null,fs=null,ps=0,zf=0,Bf=null,f_=null,Rl=0,Ff=null;function sr(){if((Dt&2)!==0&&bt!==0)return bt&-bt;if(B.T!==null){var r=es;return r!==0?r:Yf()}return pt()}function p_(){Er===0&&(Er=(bt&536870912)===0||St?sa():536870912);var r=wr.current;return r!==null&&(r.flags|=32),Er}function lr(r,a,o){(r===Bt&&(kt===2||kt===9)||r.cancelPendingCommit!==null)&&(hs(r,0),Gi(r,bt,Er,!1)),Ft(r,o),((Dt&2)===0||r!==Bt)&&(r===Bt&&((Dt&2)===0&&(Na|=o),en===4&&Gi(r,bt,Er,!1)),Kr(r))}function h_(r,a,o){if((Dt&6)!==0)throw Error(i(327));var u=!o&&(a&124)===0&&(a&r.expiredLanes)===0||On(r,a),h=u?bT(r,a):qf(r,a,!0),b=u;do{if(h===0){us&&!u&&Gi(r,a,0,!1);break}else{if(o=r.current.alternate,b&&!mT(o)){h=qf(r,a,!1),b=!1;continue}if(h===2){if(b=a,r.errorRecoveryDisabledLanes&b)var w=0;else w=r.pendingLanes&-536870913,w=w!==0?w:w&536870912?536870912:0;if(w!==0){a=w;e:{var O=r;h=Ol;var L=O.current.memoizedState.isDehydrated;if(L&&(hs(O,w).flags|=256),w=qf(O,w,!1),w!==2){if(If&&!L){O.errorRecoveryDisabledLanes|=b,Na|=b,h=4;break e}b=Yn,Yn=h,b!==null&&(Yn===null?Yn=b:Yn.push.apply(Yn,b))}h=w}if(b=!1,h!==2)continue}}if(h===1){hs(r,0),Gi(r,a,0,!0);break}e:{switch(u=r,b=h,b){case 0:case 1:throw Error(i(345));case 4:if((a&4194048)!==a)break;case 6:Gi(u,a,Er,!Fi);break e;case 2:Yn=null;break;case 3:case 5:break;default:throw Error(i(329))}if((a&62914560)===a&&(h=$f+300-_t(),10<h)){if(Gi(u,a,Er,!Fi),Vt(u,0,!0)!==0)break e;u.timeoutHandle=H_(m_.bind(null,u,o,Yn,yc,jf,a,Er,Na,ds,Fi,b,2,-0,0),h);break e}m_(u,o,Yn,yc,jf,a,Er,Na,ds,Fi,b,0,-0,0)}}break}while(!0);Kr(r)}function m_(r,a,o,u,h,b,w,O,L,Y,le,ce,Q,J){if(r.timeoutHandle=-1,ce=a.subtreeFlags,(ce&8192||(ce&16785408)===16785408)&&(Il={stylesheets:null,count:0,unsuspend:WT},o_(a),ce=QT(),ce!==null)){r.cancelPendingCommit=ce(w_.bind(null,r,a,b,o,u,h,w,O,L,le,1,Q,J)),Gi(r,b,w,!Y);return}w_(r,a,b,o,u,h,w,O,L)}function mT(r){for(var a=r;;){var o=a.tag;if((o===0||o===11||o===15)&&a.flags&16384&&(o=a.updateQueue,o!==null&&(o=o.stores,o!==null)))for(var u=0;u<o.length;u++){var h=o[u],b=h.getSnapshot;h=h.value;try{if(!tr(b(),h))return!1}catch{return!1}}if(o=a.child,a.subtreeFlags&16384&&o!==null)o.return=a,a=o;else{if(a===r)break;for(;a.sibling===null;){if(a.return===null||a.return===r)return!0;a=a.return}a.sibling.return=a.return,a=a.sibling}}return!0}function Gi(r,a,o,u){a&=~Lf,a&=~Na,r.suspendedLanes|=a,r.pingedLanes&=~a,u&&(r.warmLanes|=a),u=r.expirationTimes;for(var h=a;0<h;){var b=31-Ie(h),w=1<<b;u[b]=-1,h&=~w}o!==0&&j(r,o,a)}function vc(){return(Dt&6)===0?(Nl(0),!1):!0}function Uf(){if(ut!==null){if(kt===0)var r=ut.return;else r=ut,li=Ea=null,af(r),ss=null,vl=0,r=ut;for(;r!==null;)Yv(r.alternate,r),r=r.return;ut=null}}function hs(r,a){var o=r.timeoutHandle;o!==-1&&(r.timeoutHandle=-1,MT(o)),o=r.cancelPendingCommit,o!==null&&(r.cancelPendingCommit=null,o()),Uf(),Bt=r,ut=o=ii(r.current,null),bt=a,kt=0,ar=null,Fi=!1,us=On(r,a),If=!1,ds=Er=Lf=Na=Ui=en=0,Yn=Ol=null,jf=!1,(a&8)!==0&&(a|=a&32);var u=r.entangledLanes;if(u!==0)for(r=r.entanglements,u&=a;0<u;){var h=31-Ie(u),b=1<<h;a|=r[h],u&=~b}return mi=a,Fo(),o}function g_(r,a){ot=null,B.H=sc,a===ul||a===Wo?(a=My(),kt=3):a===Ay?(a=My(),kt=4):kt=a===Pv?8:a!==null&&typeof a=="object"&&typeof a.then=="function"?6:1,ar=a,ut===null&&(en=1,dc(r,yr(a,r.current)))}function b_(){var r=B.H;return B.H=sc,r===null?sc:r}function y_(){var r=B.A;return B.A=pT,r}function Hf(){en=4,Fi||(bt&4194048)!==bt&&wr.current!==null||(us=!0),(Ui&134217727)===0&&(Na&134217727)===0||Bt===null||Gi(Bt,bt,Er,!1)}function qf(r,a,o){var u=Dt;Dt|=2;var h=b_(),b=y_();(Bt!==r||bt!==a)&&(yc=null,hs(r,a)),a=!1;var w=en;e:do try{if(kt!==0&&ut!==null){var O=ut,L=ar;switch(kt){case 8:Uf(),w=6;break e;case 3:case 2:case 9:case 6:wr.current===null&&(a=!0);var Y=kt;if(kt=0,ar=null,ms(r,O,L,Y),o&&us){w=0;break e}break;default:Y=kt,kt=0,ar=null,ms(r,O,L,Y)}}gT(),w=en;break}catch(le){g_(r,le)}while(!0);return a&&r.shellSuspendCounter++,li=Ea=null,Dt=u,B.H=h,B.A=b,ut===null&&(Bt=null,bt=0,Fo()),w}function gT(){for(;ut!==null;)v_(ut)}function bT(r,a){var o=Dt;Dt|=2;var u=b_(),h=y_();Bt!==r||bt!==a?(yc=null,bc=_t()+500,hs(r,a)):us=On(r,a);e:do try{if(kt!==0&&ut!==null){a=ut;var b=ar;t:switch(kt){case 1:kt=0,ar=null,ms(r,a,b,1);break;case 2:case 9:if(Dy(b)){kt=0,ar=null,__(a);break}a=function(){kt!==2&&kt!==9||Bt!==r||(kt=7),Kr(r)},b.then(a,a);break e;case 3:kt=7;break e;case 4:kt=5;break e;case 7:Dy(b)?(kt=0,ar=null,__(a)):(kt=0,ar=null,ms(r,a,b,7));break;case 5:var w=null;switch(ut.tag){case 26:w=ut.memoizedState;case 5:case 27:var O=ut;if(!w||tx(w)){kt=0,ar=null;var L=O.sibling;if(L!==null)ut=L;else{var Y=O.return;Y!==null?(ut=Y,_c(Y)):ut=null}break t}}kt=0,ar=null,ms(r,a,b,5);break;case 6:kt=0,ar=null,ms(r,a,b,6);break;case 8:Uf(),en=6;break e;default:throw Error(i(462))}}yT();break}catch(le){g_(r,le)}while(!0);return li=Ea=null,B.H=u,B.A=h,Dt=o,ut!==null?0:(Bt=null,bt=0,Fo(),en)}function yT(){for(;ut!==null&&!Tt();)v_(ut)}function v_(r){var a=Vv(r.alternate,r,mi);r.memoizedProps=r.pendingProps,a===null?_c(r):ut=a}function __(r){var a=r,o=a.alternate;switch(a.tag){case 15:case 0:a=Bv(o,a,a.pendingProps,a.type,void 0,bt);break;case 11:a=Bv(o,a,a.pendingProps,a.type.render,a.ref,bt);break;case 5:af(a);default:Yv(o,a),a=ut=xy(a,mi),a=Vv(o,a,mi)}r.memoizedProps=r.pendingProps,a===null?_c(r):ut=a}function ms(r,a,o,u){li=Ea=null,af(a),ss=null,vl=0;var h=a.return;try{if(lT(r,h,a,o,bt)){en=1,dc(r,yr(o,r.current)),ut=null;return}}catch(b){if(h!==null)throw ut=h,b;en=1,dc(r,yr(o,r.current)),ut=null;return}a.flags&32768?(St||u===1?r=!0:us||(bt&536870912)!==0?r=!1:(Fi=r=!0,(u===2||u===9||u===3||u===6)&&(u=wr.current,u!==null&&u.tag===13&&(u.flags|=16384))),x_(a,r)):_c(a)}function _c(r){var a=r;do{if((a.flags&32768)!==0){x_(a,Fi);return}r=a.return;var o=cT(a.alternate,a,mi);if(o!==null){ut=o;return}if(a=a.sibling,a!==null){ut=a;return}ut=a=r}while(a!==null);en===0&&(en=5)}function x_(r,a){do{var o=uT(r.alternate,r);if(o!==null){o.flags&=32767,ut=o;return}if(o=r.return,o!==null&&(o.flags|=32768,o.subtreeFlags=0,o.deletions=null),!a&&(r=r.sibling,r!==null)){ut=r;return}ut=r=o}while(r!==null);en=6,ut=null}function w_(r,a,o,u,h,b,w,O,L){r.cancelPendingCommit=null;do xc();while(En!==0);if((Dt&6)!==0)throw Error(i(327));if(a!==null){if(a===r.current)throw Error(i(177));if(b=a.lanes|a.childLanes,b|=Md,Qt(r,o,b,w,O,L),r===Bt&&(ut=Bt=null,bt=0),fs=a,qi=r,ps=o,zf=b,Bf=h,f_=u,(a.subtreeFlags&10256)!==0||(a.flags&10256)!==0?(r.callbackNode=null,r.callbackPriority=0,wT(Et,function(){return O_(),null})):(r.callbackNode=null,r.callbackPriority=0),u=(a.flags&13878)!==0,(a.subtreeFlags&13878)!==0||u){u=B.T,B.T=null,h=ee.p,ee.p=2,w=Dt,Dt|=4;try{dT(r,a,o)}finally{Dt=w,ee.p=h,B.T=u}}En=1,E_(),S_(),C_()}}function E_(){if(En===1){En=0;var r=qi,a=fs,o=(a.flags&13878)!==0;if((a.subtreeFlags&13878)!==0||o){o=B.T,B.T=null;var u=ee.p;ee.p=2;var h=Dt;Dt|=4;try{a_(a,r);var b=np,w=dy(r.containerInfo),O=b.focusedElem,L=b.selectionRange;if(w!==O&&O&&O.ownerDocument&&uy(O.ownerDocument.documentElement,O)){if(L!==null&&Rd(O)){var Y=L.start,le=L.end;if(le===void 0&&(le=Y),"selectionStart"in O)O.selectionStart=Y,O.selectionEnd=Math.min(le,O.value.length);else{var ce=O.ownerDocument||document,Q=ce&&ce.defaultView||window;if(Q.getSelection){var J=Q.getSelection(),Ge=O.textContent.length,Ue=Math.min(L.start,Ge),It=L.end===void 0?Ue:Math.min(L.end,Ge);!J.extend&&Ue>It&&(w=It,It=Ue,Ue=w);var G=cy(O,Ue),F=cy(O,It);if(G&&F&&(J.rangeCount!==1||J.anchorNode!==G.node||J.anchorOffset!==G.offset||J.focusNode!==F.node||J.focusOffset!==F.offset)){var K=ce.createRange();K.setStart(G.node,G.offset),J.removeAllRanges(),Ue>It?(J.addRange(K),J.extend(F.node,F.offset)):(K.setEnd(F.node,F.offset),J.addRange(K))}}}}for(ce=[],J=O;J=J.parentNode;)J.nodeType===1&&ce.push({element:J,left:J.scrollLeft,top:J.scrollTop});for(typeof O.focus=="function"&&O.focus(),O=0;O<ce.length;O++){var oe=ce[O];oe.element.scrollLeft=oe.left,oe.element.scrollTop=oe.top}}Mc=!!tp,np=tp=null}finally{Dt=h,ee.p=u,B.T=o}}r.current=a,En=2}}function S_(){if(En===2){En=0;var r=qi,a=fs,o=(a.flags&8772)!==0;if((a.subtreeFlags&8772)!==0||o){o=B.T,B.T=null;var u=ee.p;ee.p=2;var h=Dt;Dt|=4;try{t_(r,a.alternate,a)}finally{Dt=h,ee.p=u,B.T=o}}En=3}}function C_(){if(En===4||En===3){En=0,Be();var r=qi,a=fs,o=ps,u=f_;(a.subtreeFlags&10256)!==0||(a.flags&10256)!==0?En=5:(En=0,fs=qi=null,T_(r,r.pendingLanes));var h=r.pendingLanes;if(h===0&&(Hi=null),De(o),a=a.stateNode,de&&typeof de.onCommitFiberRoot=="function")try{de.onCommitFiberRoot(ne,a,void 0,(a.current.flags&128)===128)}catch{}if(u!==null){a=B.T,h=ee.p,ee.p=2,B.T=null;try{for(var b=r.onRecoverableError,w=0;w<u.length;w++){var O=u[w];b(O.value,{componentStack:O.stack})}}finally{B.T=a,ee.p=h}}(ps&3)!==0&&xc(),Kr(r),h=r.pendingLanes,(o&4194090)!==0&&(h&42)!==0?r===Ff?Rl++:(Rl=0,Ff=r):Rl=0,Nl(0)}}function T_(r,a){(r.pooledCacheLanes&=a)===0&&(a=r.pooledCache,a!=null&&(r.pooledCache=null,ol(a)))}function xc(r){return E_(),S_(),C_(),O_()}function O_(){if(En!==5)return!1;var r=qi,a=zf;zf=0;var o=De(ps),u=B.T,h=ee.p;try{ee.p=32>o?32:o,B.T=null,o=Bf,Bf=null;var b=qi,w=ps;if(En=0,fs=qi=null,ps=0,(Dt&6)!==0)throw Error(i(331));var O=Dt;if(Dt|=4,u_(b.current),l_(b,b.current,w,o),Dt=O,Nl(0,!1),de&&typeof de.onPostCommitFiberRoot=="function")try{de.onPostCommitFiberRoot(ne,b)}catch{}return!0}finally{ee.p=h,B.T=u,T_(r,a)}}function R_(r,a,o){a=yr(o,a),a=vf(r.stateNode,a,2),r=Pi(r,a,2),r!==null&&(Ft(r,2),Kr(r))}function jt(r,a,o){if(r.tag===3)R_(r,r,o);else for(;a!==null;){if(a.tag===3){R_(a,r,o);break}else if(a.tag===1){var u=a.stateNode;if(typeof a.type.getDerivedStateFromError=="function"||typeof u.componentDidCatch=="function"&&(Hi===null||!Hi.has(u))){r=yr(o,r),o=kv(2),u=Pi(a,o,2),u!==null&&(Mv(o,u,a,r),Ft(u,2),Kr(u));break}}a=a.return}}function Gf(r,a,o){var u=r.pingCache;if(u===null){u=r.pingCache=new hT;var h=new Set;u.set(a,h)}else h=u.get(a),h===void 0&&(h=new Set,u.set(a,h));h.has(o)||(If=!0,h.add(o),r=vT.bind(null,r,a,o),a.then(r,r))}function vT(r,a,o){var u=r.pingCache;u!==null&&u.delete(a),r.pingedLanes|=r.suspendedLanes&o,r.warmLanes&=~o,Bt===r&&(bt&o)===o&&(en===4||en===3&&(bt&62914560)===bt&&300>_t()-$f?(Dt&2)===0&&hs(r,0):Lf|=o,ds===bt&&(ds=0)),Kr(r)}function N_(r,a){a===0&&(a=la()),r=Wa(r,a),r!==null&&(Ft(r,a),Kr(r))}function _T(r){var a=r.memoizedState,o=0;a!==null&&(o=a.retryLane),N_(r,o)}function xT(r,a){var o=0;switch(r.tag){case 13:var u=r.stateNode,h=r.memoizedState;h!==null&&(o=h.retryLane);break;case 19:u=r.stateNode;break;case 22:u=r.stateNode._retryCache;break;default:throw Error(i(314))}u!==null&&u.delete(a),N_(r,o)}function wT(r,a){return st(r,a)}var wc=null,gs=null,Vf=!1,Ec=!1,Kf=!1,Aa=0;function Kr(r){r!==gs&&r.next===null&&(gs===null?wc=gs=r:gs=gs.next=r),Ec=!0,Vf||(Vf=!0,ST())}function Nl(r,a){if(!Kf&&Ec){Kf=!0;do for(var o=!1,u=wc;u!==null;){if(r!==0){var h=u.pendingLanes;if(h===0)var b=0;else{var w=u.suspendedLanes,O=u.pingedLanes;b=(1<<31-Ie(42|r)+1)-1,b&=h&~(w&~O),b=b&201326741?b&201326741|1:b?b|2:0}b!==0&&(o=!0,M_(u,b))}else b=bt,b=Vt(u,u===Bt?b:0,u.cancelPendingCommit!==null||u.timeoutHandle!==-1),(b&3)===0||On(u,b)||(o=!0,M_(u,b));u=u.next}while(o);Kf=!1}}function ET(){A_()}function A_(){Ec=Vf=!1;var r=0;Aa!==0&&(kT()&&(r=Aa),Aa=0);for(var a=_t(),o=null,u=wc;u!==null;){var h=u.next,b=D_(u,a);b===0?(u.next=null,o===null?wc=h:o.next=h,h===null&&(gs=o)):(o=u,(r!==0||(b&3)!==0)&&(Ec=!0)),u=h}Nl(r)}function D_(r,a){for(var o=r.suspendedLanes,u=r.pingedLanes,h=r.expirationTimes,b=r.pendingLanes&-62914561;0<b;){var w=31-Ie(b),O=1<<w,L=h[w];L===-1?((O&o)===0||(O&u)!==0)&&(h[w]=gn(O,a)):L<=a&&(r.expiredLanes|=O),b&=~O}if(a=Bt,o=bt,o=Vt(r,r===a?o:0,r.cancelPendingCommit!==null||r.timeoutHandle!==-1),u=r.callbackNode,o===0||r===a&&(kt===2||kt===9)||r.cancelPendingCommit!==null)return u!==null&&u!==null&&lt(u),r.callbackNode=null,r.callbackPriority=0;if((o&3)===0||On(r,o)){if(a=o&-o,a===r.callbackPriority)return a;switch(u!==null&&lt(u),De(o)){case 2:case 8:o=Zt;break;case 32:o=Et;break;case 268435456:o=hr;break;default:o=Et}return u=k_.bind(null,r),o=st(o,u),r.callbackPriority=a,r.callbackNode=o,a}return u!==null&&u!==null&&lt(u),r.callbackPriority=2,r.callbackNode=null,2}function k_(r,a){if(En!==0&&En!==5)return r.callbackNode=null,r.callbackPriority=0,null;var o=r.callbackNode;if(xc()&&r.callbackNode!==o)return null;var u=bt;return u=Vt(r,r===Bt?u:0,r.cancelPendingCommit!==null||r.timeoutHandle!==-1),u===0?null:(h_(r,u,a),D_(r,_t()),r.callbackNode!=null&&r.callbackNode===o?k_.bind(null,r):null)}function M_(r,a){if(xc())return null;h_(r,a,!0)}function ST(){PT(function(){(Dt&6)!==0?st(Ut,ET):A_()})}function Yf(){return Aa===0&&(Aa=sa()),Aa}function P_(r){return r==null||typeof r=="symbol"||typeof r=="boolean"?null:typeof r=="function"?r:Ni(""+r)}function I_(r,a){var o=a.ownerDocument.createElement("input");return o.name=a.name,o.value=a.value,r.id&&o.setAttribute("form",r.id),a.parentNode.insertBefore(o,a),r=new FormData(r),o.parentNode.removeChild(o),r}function CT(r,a,o,u,h){if(a==="submit"&&o&&o.stateNode===h){var b=P_((h[Te]||null).action),w=u.submitter;w&&(a=(a=w[Te]||null)?P_(a.formAction):w.getAttribute("formAction"),a!==null&&(b=a,w=null));var O=new $o("action","action",null,u,h);r.push({event:O,listeners:[{instance:null,listener:function(){if(u.defaultPrevented){if(Aa!==0){var L=w?I_(h,w):new FormData(h);hf(o,{pending:!0,data:L,method:h.method,action:b},null,L)}}else typeof b=="function"&&(O.preventDefault(),L=w?I_(h,w):new FormData(h),hf(o,{pending:!0,data:L,method:h.method,action:b},b,L))},currentTarget:h}]})}}for(var Xf=0;Xf<kd.length;Xf++){var Wf=kd[Xf],TT=Wf.toLowerCase(),OT=Wf[0].toUpperCase()+Wf.slice(1);kr(TT,"on"+OT)}kr(hy,"onAnimationEnd"),kr(my,"onAnimationIteration"),kr(gy,"onAnimationStart"),kr("dblclick","onDoubleClick"),kr("focusin","onFocus"),kr("focusout","onBlur"),kr(qC,"onTransitionRun"),kr(GC,"onTransitionStart"),kr(VC,"onTransitionCancel"),kr(by,"onTransitionEnd"),Pn("onMouseEnter",["mouseout","mouseover"]),Pn("onMouseLeave",["mouseout","mouseover"]),Pn("onPointerEnter",["pointerout","pointerover"]),Pn("onPointerLeave",["pointerout","pointerover"]),ei("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),ei("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),ei("onBeforeInput",["compositionend","keypress","textInput","paste"]),ei("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),ei("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),ei("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Al="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),RT=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Al));function L_(r,a){a=(a&4)!==0;for(var o=0;o<r.length;o++){var u=r[o],h=u.event;u=u.listeners;e:{var b=void 0;if(a)for(var w=u.length-1;0<=w;w--){var O=u[w],L=O.instance,Y=O.currentTarget;if(O=O.listener,L!==b&&h.isPropagationStopped())break e;b=O,h.currentTarget=Y;try{b(h)}catch(le){uc(le)}h.currentTarget=null,b=L}else for(w=0;w<u.length;w++){if(O=u[w],L=O.instance,Y=O.currentTarget,O=O.listener,L!==b&&h.isPropagationStopped())break e;b=O,h.currentTarget=Y;try{b(h)}catch(le){uc(le)}h.currentTarget=null,b=L}}}}function dt(r,a){var o=a[Rt];o===void 0&&(o=a[Rt]=new Set);var u=r+"__bubble";o.has(u)||(j_(a,r,2,!1),o.add(u))}function Zf(r,a,o){var u=0;a&&(u|=4),j_(o,r,u,a)}var Sc="_reactListening"+Math.random().toString(36).slice(2);function Qf(r){if(!r[Sc]){r[Sc]=!0,No.forEach(function(o){o!=="selectionchange"&&(RT.has(o)||Zf(o,!1,r),Zf(o,!0,r))});var a=r.nodeType===9?r:r.ownerDocument;a===null||a[Sc]||(a[Sc]=!0,Zf("selectionchange",!1,a))}}function j_(r,a,o,u){switch(lx(a)){case 2:var h=tO;break;case 8:h=nO;break;default:h=fp}o=h.bind(null,a,o,r),h=void 0,!vd||a!=="touchstart"&&a!=="touchmove"&&a!=="wheel"||(h=!0),u?h!==void 0?r.addEventListener(a,o,{capture:!0,passive:h}):r.addEventListener(a,o,!0):h!==void 0?r.addEventListener(a,o,{passive:h}):r.addEventListener(a,o,!1)}function Jf(r,a,o,u,h){var b=u;if((a&1)===0&&(a&2)===0&&u!==null)e:for(;;){if(u===null)return;var w=u.tag;if(w===3||w===4){var O=u.stateNode.containerInfo;if(O===h)break;if(w===4)for(w=u.return;w!==null;){var L=w.tag;if((L===3||L===4)&&w.stateNode.containerInfo===h)return;w=w.return}for(;O!==null;){if(w=Ti(O),w===null)return;if(L=w.tag,L===5||L===6||L===26||L===27){u=b=w;continue e}O=O.parentNode}}u=u.return}br(function(){var Y=b,le=Ce(o),ce=[];e:{var Q=yy.get(r);if(Q!==void 0){var J=$o,Ge=r;switch(r){case"keypress":if(Lo(o)===0)break e;case"keydown":case"keyup":J=wC;break;case"focusin":Ge="focus",J=Ed;break;case"focusout":Ge="blur",J=Ed;break;case"beforeblur":case"afterblur":J=Ed;break;case"click":if(o.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":J=Kb;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":J=uC;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":J=CC;break;case hy:case my:case gy:J=pC;break;case by:J=OC;break;case"scroll":case"scrollend":J=oC;break;case"wheel":J=NC;break;case"copy":case"cut":case"paste":J=mC;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":J=Xb;break;case"toggle":case"beforetoggle":J=DC}var Ue=(a&4)!==0,It=!Ue&&(r==="scroll"||r==="scrollend"),G=Ue?Q!==null?Q+"Capture":null:Q;Ue=[];for(var F=Y,K;F!==null;){var oe=F;if(K=oe.stateNode,oe=oe.tag,oe!==5&&oe!==26&&oe!==27||K===null||G===null||(oe=ha(F,G),oe!=null&&Ue.push(Dl(F,oe,K))),It)break;F=F.return}0<Ue.length&&(Q=new J(Q,Ge,null,o,le),ce.push({event:Q,listeners:Ue}))}}if((a&7)===0){e:{if(Q=r==="mouseover"||r==="pointerover",J=r==="mouseout"||r==="pointerout",Q&&o!==pa&&(Ge=o.relatedTarget||o.fromElement)&&(Ti(Ge)||Ge[ht]))break e;if((J||Q)&&(Q=le.window===le?le:(Q=le.ownerDocument)?Q.defaultView||Q.parentWindow:window,J?(Ge=o.relatedTarget||o.toElement,J=Y,Ge=Ge?Ti(Ge):null,Ge!==null&&(It=l(Ge),Ue=Ge.tag,Ge!==It||Ue!==5&&Ue!==27&&Ue!==6)&&(Ge=null)):(J=null,Ge=Y),J!==Ge)){if(Ue=Kb,oe="onMouseLeave",G="onMouseEnter",F="mouse",(r==="pointerout"||r==="pointerover")&&(Ue=Xb,oe="onPointerLeave",G="onPointerEnter",F="pointer"),It=J==null?Q:ua(J),K=Ge==null?Q:ua(Ge),Q=new Ue(oe,F+"leave",J,o,le),Q.target=It,Q.relatedTarget=K,oe=null,Ti(le)===Y&&(Ue=new Ue(G,F+"enter",Ge,o,le),Ue.target=K,Ue.relatedTarget=It,oe=Ue),It=oe,J&&Ge)t:{for(Ue=J,G=Ge,F=0,K=Ue;K;K=bs(K))F++;for(K=0,oe=G;oe;oe=bs(oe))K++;for(;0<F-K;)Ue=bs(Ue),F--;for(;0<K-F;)G=bs(G),K--;for(;F--;){if(Ue===G||G!==null&&Ue===G.alternate)break t;Ue=bs(Ue),G=bs(G)}Ue=null}else Ue=null;J!==null&&$_(ce,Q,J,Ue,!1),Ge!==null&&It!==null&&$_(ce,It,Ge,Ue,!0)}}e:{if(Q=Y?ua(Y):window,J=Q.nodeName&&Q.nodeName.toLowerCase(),J==="select"||J==="input"&&Q.type==="file")var Ne=ry;else if(ty(Q))if(iy)Ne=FC;else{Ne=zC;var ct=$C}else J=Q.nodeName,!J||J.toLowerCase()!=="input"||Q.type!=="checkbox"&&Q.type!=="radio"?Y&&At(Y.elementType)&&(Ne=ry):Ne=BC;if(Ne&&(Ne=Ne(r,Y))){ny(ce,Ne,o,le);break e}ct&&ct(r,Q,Y),r==="focusout"&&Y&&Q.type==="number"&&Y.memoizedProps.value!=null&&Ri(Q,"number",Q.value)}switch(ct=Y?ua(Y):window,r){case"focusin":(ty(ct)||ct.contentEditable==="true")&&(Ka=ct,Nd=Y,rl=null);break;case"focusout":rl=Nd=Ka=null;break;case"mousedown":Ad=!0;break;case"contextmenu":case"mouseup":case"dragend":Ad=!1,fy(ce,o,le);break;case"selectionchange":if(HC)break;case"keydown":case"keyup":fy(ce,o,le)}var je;if(Cd)e:{switch(r){case"compositionstart":var He="onCompositionStart";break e;case"compositionend":He="onCompositionEnd";break e;case"compositionupdate":He="onCompositionUpdate";break e}He=void 0}else Va?Jb(r,o)&&(He="onCompositionEnd"):r==="keydown"&&o.keyCode===229&&(He="onCompositionStart");He&&(Wb&&o.locale!=="ko"&&(Va||He!=="onCompositionStart"?He==="onCompositionEnd"&&Va&&(je=Gb()):(Ai=le,_d="value"in Ai?Ai.value:Ai.textContent,Va=!0)),ct=Cc(Y,He),0<ct.length&&(He=new Yb(He,r,null,o,le),ce.push({event:He,listeners:ct}),je?He.data=je:(je=ey(o),je!==null&&(He.data=je)))),(je=MC?PC(r,o):IC(r,o))&&(He=Cc(Y,"onBeforeInput"),0<He.length&&(ct=new Yb("onBeforeInput","beforeinput",null,o,le),ce.push({event:ct,listeners:He}),ct.data=je)),CT(ce,r,Y,o,le)}L_(ce,a)})}function Dl(r,a,o){return{instance:r,listener:a,currentTarget:o}}function Cc(r,a){for(var o=a+"Capture",u=[];r!==null;){var h=r,b=h.stateNode;if(h=h.tag,h!==5&&h!==26&&h!==27||b===null||(h=ha(r,o),h!=null&&u.unshift(Dl(r,h,b)),h=ha(r,a),h!=null&&u.push(Dl(r,h,b))),r.tag===3)return u;r=r.return}return[]}function bs(r){if(r===null)return null;do r=r.return;while(r&&r.tag!==5&&r.tag!==27);return r||null}function $_(r,a,o,u,h){for(var b=a._reactName,w=[];o!==null&&o!==u;){var O=o,L=O.alternate,Y=O.stateNode;if(O=O.tag,L!==null&&L===u)break;O!==5&&O!==26&&O!==27||Y===null||(L=Y,h?(Y=ha(o,b),Y!=null&&w.unshift(Dl(o,Y,L))):h||(Y=ha(o,b),Y!=null&&w.push(Dl(o,Y,L)))),o=o.return}w.length!==0&&r.push({event:a,listeners:w})}var NT=/\r\n?/g,AT=/\u0000|\uFFFD/g;function z_(r){return(typeof r=="string"?r:""+r).replace(NT,`
`).replace(AT,"")}function B_(r,a){return a=z_(a),z_(r)===a}function Tc(){}function Pt(r,a,o,u,h,b){switch(o){case"children":typeof u=="string"?a==="body"||a==="textarea"&&u===""||Ur(r,u):(typeof u=="number"||typeof u=="bigint")&&a!=="body"&&Ur(r,""+u);break;case"className":ti(r,"class",u);break;case"tabIndex":ti(r,"tabindex",u);break;case"dir":case"role":case"viewBox":case"width":case"height":ti(r,o,u);break;case"style":sn(r,u,b);break;case"data":if(a!=="object"){ti(r,"data",u);break}case"src":case"href":if(u===""&&(a!=="a"||o!=="href")){r.removeAttribute(o);break}if(u==null||typeof u=="function"||typeof u=="symbol"||typeof u=="boolean"){r.removeAttribute(o);break}u=Ni(""+u),r.setAttribute(o,u);break;case"action":case"formAction":if(typeof u=="function"){r.setAttribute(o,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof b=="function"&&(o==="formAction"?(a!=="input"&&Pt(r,a,"name",h.name,h,null),Pt(r,a,"formEncType",h.formEncType,h,null),Pt(r,a,"formMethod",h.formMethod,h,null),Pt(r,a,"formTarget",h.formTarget,h,null)):(Pt(r,a,"encType",h.encType,h,null),Pt(r,a,"method",h.method,h,null),Pt(r,a,"target",h.target,h,null)));if(u==null||typeof u=="symbol"||typeof u=="boolean"){r.removeAttribute(o);break}u=Ni(""+u),r.setAttribute(o,u);break;case"onClick":u!=null&&(r.onclick=Tc);break;case"onScroll":u!=null&&dt("scroll",r);break;case"onScrollEnd":u!=null&&dt("scrollend",r);break;case"dangerouslySetInnerHTML":if(u!=null){if(typeof u!="object"||!("__html"in u))throw Error(i(61));if(o=u.__html,o!=null){if(h.children!=null)throw Error(i(60));r.innerHTML=o}}break;case"multiple":r.multiple=u&&typeof u!="function"&&typeof u!="symbol";break;case"muted":r.muted=u&&typeof u!="function"&&typeof u!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(u==null||typeof u=="function"||typeof u=="boolean"||typeof u=="symbol"){r.removeAttribute("xlink:href");break}o=Ni(""+u),r.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",o);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":u!=null&&typeof u!="function"&&typeof u!="symbol"?r.setAttribute(o,""+u):r.removeAttribute(o);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":u&&typeof u!="function"&&typeof u!="symbol"?r.setAttribute(o,""):r.removeAttribute(o);break;case"capture":case"download":u===!0?r.setAttribute(o,""):u!==!1&&u!=null&&typeof u!="function"&&typeof u!="symbol"?r.setAttribute(o,u):r.removeAttribute(o);break;case"cols":case"rows":case"size":case"span":u!=null&&typeof u!="function"&&typeof u!="symbol"&&!isNaN(u)&&1<=u?r.setAttribute(o,u):r.removeAttribute(o);break;case"rowSpan":case"start":u==null||typeof u=="function"||typeof u=="symbol"||isNaN(u)?r.removeAttribute(o):r.setAttribute(o,u);break;case"popover":dt("beforetoggle",r),dt("toggle",r),qa(r,"popover",u);break;case"xlinkActuate":Nr(r,"http://www.w3.org/1999/xlink","xlink:actuate",u);break;case"xlinkArcrole":Nr(r,"http://www.w3.org/1999/xlink","xlink:arcrole",u);break;case"xlinkRole":Nr(r,"http://www.w3.org/1999/xlink","xlink:role",u);break;case"xlinkShow":Nr(r,"http://www.w3.org/1999/xlink","xlink:show",u);break;case"xlinkTitle":Nr(r,"http://www.w3.org/1999/xlink","xlink:title",u);break;case"xlinkType":Nr(r,"http://www.w3.org/1999/xlink","xlink:type",u);break;case"xmlBase":Nr(r,"http://www.w3.org/XML/1998/namespace","xml:base",u);break;case"xmlLang":Nr(r,"http://www.w3.org/XML/1998/namespace","xml:lang",u);break;case"xmlSpace":Nr(r,"http://www.w3.org/XML/1998/namespace","xml:space",u);break;case"is":qa(r,"is",u);break;case"innerText":case"textContent":break;default:(!(2<o.length)||o[0]!=="o"&&o[0]!=="O"||o[1]!=="n"&&o[1]!=="N")&&(o=Ga.get(o)||o,qa(r,o,u))}}function ep(r,a,o,u,h,b){switch(o){case"style":sn(r,u,b);break;case"dangerouslySetInnerHTML":if(u!=null){if(typeof u!="object"||!("__html"in u))throw Error(i(61));if(o=u.__html,o!=null){if(h.children!=null)throw Error(i(60));r.innerHTML=o}}break;case"children":typeof u=="string"?Ur(r,u):(typeof u=="number"||typeof u=="bigint")&&Ur(r,""+u);break;case"onScroll":u!=null&&dt("scroll",r);break;case"onScrollEnd":u!=null&&dt("scrollend",r);break;case"onClick":u!=null&&(r.onclick=Tc);break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":break;case"innerText":case"textContent":break;default:if(!Ao.hasOwnProperty(o))e:{if(o[0]==="o"&&o[1]==="n"&&(h=o.endsWith("Capture"),a=o.slice(2,h?o.length-7:void 0),b=r[Te]||null,b=b!=null?b[o]:null,typeof b=="function"&&r.removeEventListener(a,b,h),typeof u=="function")){typeof b!="function"&&b!==null&&(o in r?r[o]=null:r.hasAttribute(o)&&r.removeAttribute(o)),r.addEventListener(a,u,h);break e}o in r?r[o]=u:u===!0?r.setAttribute(o,""):qa(r,o,u)}}}function Sn(r,a,o){switch(a){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":dt("error",r),dt("load",r);var u=!1,h=!1,b;for(b in o)if(o.hasOwnProperty(b)){var w=o[b];if(w!=null)switch(b){case"src":u=!0;break;case"srcSet":h=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(i(137,a));default:Pt(r,a,b,w,o,null)}}h&&Pt(r,a,"srcSet",o.srcSet,o,null),u&&Pt(r,a,"src",o.src,o,null);return;case"input":dt("invalid",r);var O=b=w=h=null,L=null,Y=null;for(u in o)if(o.hasOwnProperty(u)){var le=o[u];if(le!=null)switch(u){case"name":h=le;break;case"type":w=le;break;case"checked":L=le;break;case"defaultChecked":Y=le;break;case"value":b=le;break;case"defaultValue":O=le;break;case"children":case"dangerouslySetInnerHTML":if(le!=null)throw Error(i(137,a));break;default:Pt(r,a,u,le,o,null)}}Mo(r,b,O,L,Y,w,h,!1),da(r);return;case"select":dt("invalid",r),u=w=b=null;for(h in o)if(o.hasOwnProperty(h)&&(O=o[h],O!=null))switch(h){case"value":b=O;break;case"defaultValue":w=O;break;case"multiple":u=O;default:Pt(r,a,h,O,o,null)}a=b,o=w,r.multiple=!!u,a!=null?ni(r,!!u,a,!1):o!=null&&ni(r,!!u,o,!0);return;case"textarea":dt("invalid",r),b=h=u=null;for(w in o)if(o.hasOwnProperty(w)&&(O=o[w],O!=null))switch(w){case"value":u=O;break;case"defaultValue":h=O;break;case"children":b=O;break;case"dangerouslySetInnerHTML":if(O!=null)throw Error(i(91));break;default:Pt(r,a,w,O,o,null)}Po(r,u,h,b),da(r);return;case"option":for(L in o)if(o.hasOwnProperty(L)&&(u=o[L],u!=null))switch(L){case"selected":r.selected=u&&typeof u!="function"&&typeof u!="symbol";break;default:Pt(r,a,L,u,o,null)}return;case"dialog":dt("beforetoggle",r),dt("toggle",r),dt("cancel",r),dt("close",r);break;case"iframe":case"object":dt("load",r);break;case"video":case"audio":for(u=0;u<Al.length;u++)dt(Al[u],r);break;case"image":dt("error",r),dt("load",r);break;case"details":dt("toggle",r);break;case"embed":case"source":case"link":dt("error",r),dt("load",r);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(Y in o)if(o.hasOwnProperty(Y)&&(u=o[Y],u!=null))switch(Y){case"children":case"dangerouslySetInnerHTML":throw Error(i(137,a));default:Pt(r,a,Y,u,o,null)}return;default:if(At(a)){for(le in o)o.hasOwnProperty(le)&&(u=o[le],u!==void 0&&ep(r,a,le,u,o,void 0));return}}for(O in o)o.hasOwnProperty(O)&&(u=o[O],u!=null&&Pt(r,a,O,u,o,null))}function DT(r,a,o,u){switch(a){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var h=null,b=null,w=null,O=null,L=null,Y=null,le=null;for(J in o){var ce=o[J];if(o.hasOwnProperty(J)&&ce!=null)switch(J){case"checked":break;case"value":break;case"defaultValue":L=ce;default:u.hasOwnProperty(J)||Pt(r,a,J,null,u,ce)}}for(var Q in u){var J=u[Q];if(ce=o[Q],u.hasOwnProperty(Q)&&(J!=null||ce!=null))switch(Q){case"type":b=J;break;case"name":h=J;break;case"checked":Y=J;break;case"defaultChecked":le=J;break;case"value":w=J;break;case"defaultValue":O=J;break;case"children":case"dangerouslySetInnerHTML":if(J!=null)throw Error(i(137,a));break;default:J!==ce&&Pt(r,a,Q,J,u,ce)}}Ys(r,w,O,L,Y,le,b,h);return;case"select":J=w=O=Q=null;for(b in o)if(L=o[b],o.hasOwnProperty(b)&&L!=null)switch(b){case"value":break;case"multiple":J=L;default:u.hasOwnProperty(b)||Pt(r,a,b,null,u,L)}for(h in u)if(b=u[h],L=o[h],u.hasOwnProperty(h)&&(b!=null||L!=null))switch(h){case"value":Q=b;break;case"defaultValue":O=b;break;case"multiple":w=b;default:b!==L&&Pt(r,a,h,b,u,L)}a=O,o=w,u=J,Q!=null?ni(r,!!o,Q,!1):!!u!=!!o&&(a!=null?ni(r,!!o,a,!0):ni(r,!!o,o?[]:"",!1));return;case"textarea":J=Q=null;for(O in o)if(h=o[O],o.hasOwnProperty(O)&&h!=null&&!u.hasOwnProperty(O))switch(O){case"value":break;case"children":break;default:Pt(r,a,O,null,u,h)}for(w in u)if(h=u[w],b=o[w],u.hasOwnProperty(w)&&(h!=null||b!=null))switch(w){case"value":Q=h;break;case"defaultValue":J=h;break;case"children":break;case"dangerouslySetInnerHTML":if(h!=null)throw Error(i(91));break;default:h!==b&&Pt(r,a,w,h,u,b)}er(r,Q,J);return;case"option":for(var Ge in o)if(Q=o[Ge],o.hasOwnProperty(Ge)&&Q!=null&&!u.hasOwnProperty(Ge))switch(Ge){case"selected":r.selected=!1;break;default:Pt(r,a,Ge,null,u,Q)}for(L in u)if(Q=u[L],J=o[L],u.hasOwnProperty(L)&&Q!==J&&(Q!=null||J!=null))switch(L){case"selected":r.selected=Q&&typeof Q!="function"&&typeof Q!="symbol";break;default:Pt(r,a,L,Q,u,J)}return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var Ue in o)Q=o[Ue],o.hasOwnProperty(Ue)&&Q!=null&&!u.hasOwnProperty(Ue)&&Pt(r,a,Ue,null,u,Q);for(Y in u)if(Q=u[Y],J=o[Y],u.hasOwnProperty(Y)&&Q!==J&&(Q!=null||J!=null))switch(Y){case"children":case"dangerouslySetInnerHTML":if(Q!=null)throw Error(i(137,a));break;default:Pt(r,a,Y,Q,u,J)}return;default:if(At(a)){for(var It in o)Q=o[It],o.hasOwnProperty(It)&&Q!==void 0&&!u.hasOwnProperty(It)&&ep(r,a,It,void 0,u,Q);for(le in u)Q=u[le],J=o[le],!u.hasOwnProperty(le)||Q===J||Q===void 0&&J===void 0||ep(r,a,le,Q,u,J);return}}for(var G in o)Q=o[G],o.hasOwnProperty(G)&&Q!=null&&!u.hasOwnProperty(G)&&Pt(r,a,G,null,u,Q);for(ce in u)Q=u[ce],J=o[ce],!u.hasOwnProperty(ce)||Q===J||Q==null&&J==null||Pt(r,a,ce,Q,u,J)}var tp=null,np=null;function Oc(r){return r.nodeType===9?r:r.ownerDocument}function F_(r){switch(r){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function U_(r,a){if(r===0)switch(a){case"svg":return 1;case"math":return 2;default:return 0}return r===1&&a==="foreignObject"?0:r}function rp(r,a){return r==="textarea"||r==="noscript"||typeof a.children=="string"||typeof a.children=="number"||typeof a.children=="bigint"||typeof a.dangerouslySetInnerHTML=="object"&&a.dangerouslySetInnerHTML!==null&&a.dangerouslySetInnerHTML.__html!=null}var ip=null;function kT(){var r=window.event;return r&&r.type==="popstate"?r===ip?!1:(ip=r,!0):(ip=null,!1)}var H_=typeof setTimeout=="function"?setTimeout:void 0,MT=typeof clearTimeout=="function"?clearTimeout:void 0,q_=typeof Promise=="function"?Promise:void 0,PT=typeof queueMicrotask=="function"?queueMicrotask:typeof q_<"u"?function(r){return q_.resolve(null).then(r).catch(IT)}:H_;function IT(r){setTimeout(function(){throw r})}function Vi(r){return r==="head"}function G_(r,a){var o=a,u=0,h=0;do{var b=o.nextSibling;if(r.removeChild(o),b&&b.nodeType===8)if(o=b.data,o==="/$"){if(0<u&&8>u){o=u;var w=r.ownerDocument;if(o&1&&kl(w.documentElement),o&2&&kl(w.body),o&4)for(o=w.head,kl(o),w=o.firstChild;w;){var O=w.nextSibling,L=w.nodeName;w[Rr]||L==="SCRIPT"||L==="STYLE"||L==="LINK"&&w.rel.toLowerCase()==="stylesheet"||o.removeChild(w),w=O}}if(h===0){r.removeChild(b),Bl(a);return}h--}else o==="$"||o==="$?"||o==="$!"?h++:u=o.charCodeAt(0)-48;else u=0;o=b}while(o);Bl(a)}function ap(r){var a=r.firstChild;for(a&&a.nodeType===10&&(a=a.nextSibling);a;){var o=a;switch(a=a.nextSibling,o.nodeName){case"HTML":case"HEAD":case"BODY":ap(o),ca(o);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(o.rel.toLowerCase()==="stylesheet")continue}r.removeChild(o)}}function LT(r,a,o,u){for(;r.nodeType===1;){var h=o;if(r.nodeName.toLowerCase()!==a.toLowerCase()){if(!u&&(r.nodeName!=="INPUT"||r.type!=="hidden"))break}else if(u){if(!r[Rr])switch(a){case"meta":if(!r.hasAttribute("itemprop"))break;return r;case"link":if(b=r.getAttribute("rel"),b==="stylesheet"&&r.hasAttribute("data-precedence"))break;if(b!==h.rel||r.getAttribute("href")!==(h.href==null||h.href===""?null:h.href)||r.getAttribute("crossorigin")!==(h.crossOrigin==null?null:h.crossOrigin)||r.getAttribute("title")!==(h.title==null?null:h.title))break;return r;case"style":if(r.hasAttribute("data-precedence"))break;return r;case"script":if(b=r.getAttribute("src"),(b!==(h.src==null?null:h.src)||r.getAttribute("type")!==(h.type==null?null:h.type)||r.getAttribute("crossorigin")!==(h.crossOrigin==null?null:h.crossOrigin))&&b&&r.hasAttribute("async")&&!r.hasAttribute("itemprop"))break;return r;default:return r}}else if(a==="input"&&r.type==="hidden"){var b=h.name==null?null:""+h.name;if(h.type==="hidden"&&r.getAttribute("name")===b)return r}else return r;if(r=Pr(r.nextSibling),r===null)break}return null}function jT(r,a,o){if(a==="")return null;for(;r.nodeType!==3;)if((r.nodeType!==1||r.nodeName!=="INPUT"||r.type!=="hidden")&&!o||(r=Pr(r.nextSibling),r===null))return null;return r}function sp(r){return r.data==="$!"||r.data==="$?"&&r.ownerDocument.readyState==="complete"}function $T(r,a){var o=r.ownerDocument;if(r.data!=="$?"||o.readyState==="complete")a();else{var u=function(){a(),o.removeEventListener("DOMContentLoaded",u)};o.addEventListener("DOMContentLoaded",u),r._reactRetry=u}}function Pr(r){for(;r!=null;r=r.nextSibling){var a=r.nodeType;if(a===1||a===3)break;if(a===8){if(a=r.data,a==="$"||a==="$!"||a==="$?"||a==="F!"||a==="F")break;if(a==="/$")return null}}return r}var lp=null;function V_(r){r=r.previousSibling;for(var a=0;r;){if(r.nodeType===8){var o=r.data;if(o==="$"||o==="$!"||o==="$?"){if(a===0)return r;a--}else o==="/$"&&a++}r=r.previousSibling}return null}function K_(r,a,o){switch(a=Oc(o),r){case"html":if(r=a.documentElement,!r)throw Error(i(452));return r;case"head":if(r=a.head,!r)throw Error(i(453));return r;case"body":if(r=a.body,!r)throw Error(i(454));return r;default:throw Error(i(451))}}function kl(r){for(var a=r.attributes;a.length;)r.removeAttributeNode(a[0]);ca(r)}var Sr=new Map,Y_=new Set;function Rc(r){return typeof r.getRootNode=="function"?r.getRootNode():r.nodeType===9?r:r.ownerDocument}var gi=ee.d;ee.d={f:zT,r:BT,D:FT,C:UT,L:HT,m:qT,X:VT,S:GT,M:KT};function zT(){var r=gi.f(),a=vc();return r||a}function BT(r){var a=Oi(r);a!==null&&a.tag===5&&a.type==="form"?hv(a):gi.r(r)}var ys=typeof document>"u"?null:document;function X_(r,a,o){var u=ys;if(u&&typeof a=="string"&&a){var h=qn(a);h='link[rel="'+r+'"][href="'+h+'"]',typeof o=="string"&&(h+='[crossorigin="'+o+'"]'),Y_.has(h)||(Y_.add(h),r={rel:r,crossOrigin:o,href:a},u.querySelector(h)===null&&(a=u.createElement("link"),Sn(a,"link",r),Kt(a),u.head.appendChild(a)))}}function FT(r){gi.D(r),X_("dns-prefetch",r,null)}function UT(r,a){gi.C(r,a),X_("preconnect",r,a)}function HT(r,a,o){gi.L(r,a,o);var u=ys;if(u&&r&&a){var h='link[rel="preload"][as="'+qn(a)+'"]';a==="image"&&o&&o.imageSrcSet?(h+='[imagesrcset="'+qn(o.imageSrcSet)+'"]',typeof o.imageSizes=="string"&&(h+='[imagesizes="'+qn(o.imageSizes)+'"]')):h+='[href="'+qn(r)+'"]';var b=h;switch(a){case"style":b=vs(r);break;case"script":b=_s(r)}Sr.has(b)||(r=m({rel:"preload",href:a==="image"&&o&&o.imageSrcSet?void 0:r,as:a},o),Sr.set(b,r),u.querySelector(h)!==null||a==="style"&&u.querySelector(Ml(b))||a==="script"&&u.querySelector(Pl(b))||(a=u.createElement("link"),Sn(a,"link",r),Kt(a),u.head.appendChild(a)))}}function qT(r,a){gi.m(r,a);var o=ys;if(o&&r){var u=a&&typeof a.as=="string"?a.as:"script",h='link[rel="modulepreload"][as="'+qn(u)+'"][href="'+qn(r)+'"]',b=h;switch(u){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":b=_s(r)}if(!Sr.has(b)&&(r=m({rel:"modulepreload",href:r},a),Sr.set(b,r),o.querySelector(h)===null)){switch(u){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(o.querySelector(Pl(b)))return}u=o.createElement("link"),Sn(u,"link",r),Kt(u),o.head.appendChild(u)}}}function GT(r,a,o){gi.S(r,a,o);var u=ys;if(u&&r){var h=Jr(u).hoistableStyles,b=vs(r);a=a||"default";var w=h.get(b);if(!w){var O={loading:0,preload:null};if(w=u.querySelector(Ml(b)))O.loading=5;else{r=m({rel:"stylesheet",href:r,"data-precedence":a},o),(o=Sr.get(b))&&op(r,o);var L=w=u.createElement("link");Kt(L),Sn(L,"link",r),L._p=new Promise(function(Y,le){L.onload=Y,L.onerror=le}),L.addEventListener("load",function(){O.loading|=1}),L.addEventListener("error",function(){O.loading|=2}),O.loading|=4,Nc(w,a,u)}w={type:"stylesheet",instance:w,count:1,state:O},h.set(b,w)}}}function VT(r,a){gi.X(r,a);var o=ys;if(o&&r){var u=Jr(o).hoistableScripts,h=_s(r),b=u.get(h);b||(b=o.querySelector(Pl(h)),b||(r=m({src:r,async:!0},a),(a=Sr.get(h))&&cp(r,a),b=o.createElement("script"),Kt(b),Sn(b,"link",r),o.head.appendChild(b)),b={type:"script",instance:b,count:1,state:null},u.set(h,b))}}function KT(r,a){gi.M(r,a);var o=ys;if(o&&r){var u=Jr(o).hoistableScripts,h=_s(r),b=u.get(h);b||(b=o.querySelector(Pl(h)),b||(r=m({src:r,async:!0,type:"module"},a),(a=Sr.get(h))&&cp(r,a),b=o.createElement("script"),Kt(b),Sn(b,"link",r),o.head.appendChild(b)),b={type:"script",instance:b,count:1,state:null},u.set(h,b))}}function W_(r,a,o,u){var h=(h=be.current)?Rc(h):null;if(!h)throw Error(i(446));switch(r){case"meta":case"title":return null;case"style":return typeof o.precedence=="string"&&typeof o.href=="string"?(a=vs(o.href),o=Jr(h).hoistableStyles,u=o.get(a),u||(u={type:"style",instance:null,count:0,state:null},o.set(a,u)),u):{type:"void",instance:null,count:0,state:null};case"link":if(o.rel==="stylesheet"&&typeof o.href=="string"&&typeof o.precedence=="string"){r=vs(o.href);var b=Jr(h).hoistableStyles,w=b.get(r);if(w||(h=h.ownerDocument||h,w={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},b.set(r,w),(b=h.querySelector(Ml(r)))&&!b._p&&(w.instance=b,w.state.loading=5),Sr.has(r)||(o={rel:"preload",as:"style",href:o.href,crossOrigin:o.crossOrigin,integrity:o.integrity,media:o.media,hrefLang:o.hrefLang,referrerPolicy:o.referrerPolicy},Sr.set(r,o),b||YT(h,r,o,w.state))),a&&u===null)throw Error(i(528,""));return w}if(a&&u!==null)throw Error(i(529,""));return null;case"script":return a=o.async,o=o.src,typeof o=="string"&&a&&typeof a!="function"&&typeof a!="symbol"?(a=_s(o),o=Jr(h).hoistableScripts,u=o.get(a),u||(u={type:"script",instance:null,count:0,state:null},o.set(a,u)),u):{type:"void",instance:null,count:0,state:null};default:throw Error(i(444,r))}}function vs(r){return'href="'+qn(r)+'"'}function Ml(r){return'link[rel="stylesheet"]['+r+"]"}function Z_(r){return m({},r,{"data-precedence":r.precedence,precedence:null})}function YT(r,a,o,u){r.querySelector('link[rel="preload"][as="style"]['+a+"]")?u.loading=1:(a=r.createElement("link"),u.preload=a,a.addEventListener("load",function(){return u.loading|=1}),a.addEventListener("error",function(){return u.loading|=2}),Sn(a,"link",o),Kt(a),r.head.appendChild(a))}function _s(r){return'[src="'+qn(r)+'"]'}function Pl(r){return"script[async]"+r}function Q_(r,a,o){if(a.count++,a.instance===null)switch(a.type){case"style":var u=r.querySelector('style[data-href~="'+qn(o.href)+'"]');if(u)return a.instance=u,Kt(u),u;var h=m({},o,{"data-href":o.href,"data-precedence":o.precedence,href:null,precedence:null});return u=(r.ownerDocument||r).createElement("style"),Kt(u),Sn(u,"style",h),Nc(u,o.precedence,r),a.instance=u;case"stylesheet":h=vs(o.href);var b=r.querySelector(Ml(h));if(b)return a.state.loading|=4,a.instance=b,Kt(b),b;u=Z_(o),(h=Sr.get(h))&&op(u,h),b=(r.ownerDocument||r).createElement("link"),Kt(b);var w=b;return w._p=new Promise(function(O,L){w.onload=O,w.onerror=L}),Sn(b,"link",u),a.state.loading|=4,Nc(b,o.precedence,r),a.instance=b;case"script":return b=_s(o.src),(h=r.querySelector(Pl(b)))?(a.instance=h,Kt(h),h):(u=o,(h=Sr.get(b))&&(u=m({},o),cp(u,h)),r=r.ownerDocument||r,h=r.createElement("script"),Kt(h),Sn(h,"link",u),r.head.appendChild(h),a.instance=h);case"void":return null;default:throw Error(i(443,a.type))}else a.type==="stylesheet"&&(a.state.loading&4)===0&&(u=a.instance,a.state.loading|=4,Nc(u,o.precedence,r));return a.instance}function Nc(r,a,o){for(var u=o.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),h=u.length?u[u.length-1]:null,b=h,w=0;w<u.length;w++){var O=u[w];if(O.dataset.precedence===a)b=O;else if(b!==h)break}b?b.parentNode.insertBefore(r,b.nextSibling):(a=o.nodeType===9?o.head:o,a.insertBefore(r,a.firstChild))}function op(r,a){r.crossOrigin==null&&(r.crossOrigin=a.crossOrigin),r.referrerPolicy==null&&(r.referrerPolicy=a.referrerPolicy),r.title==null&&(r.title=a.title)}function cp(r,a){r.crossOrigin==null&&(r.crossOrigin=a.crossOrigin),r.referrerPolicy==null&&(r.referrerPolicy=a.referrerPolicy),r.integrity==null&&(r.integrity=a.integrity)}var Ac=null;function J_(r,a,o){if(Ac===null){var u=new Map,h=Ac=new Map;h.set(o,u)}else h=Ac,u=h.get(o),u||(u=new Map,h.set(o,u));if(u.has(r))return u;for(u.set(r,null),o=o.getElementsByTagName(r),h=0;h<o.length;h++){var b=o[h];if(!(b[Rr]||b[ye]||r==="link"&&b.getAttribute("rel")==="stylesheet")&&b.namespaceURI!=="http://www.w3.org/2000/svg"){var w=b.getAttribute(a)||"";w=r+w;var O=u.get(w);O?O.push(b):u.set(w,[b])}}return u}function ex(r,a,o){r=r.ownerDocument||r,r.head.insertBefore(o,a==="title"?r.querySelector("head > title"):null)}function XT(r,a,o){if(o===1||a.itemProp!=null)return!1;switch(r){case"meta":case"title":return!0;case"style":if(typeof a.precedence!="string"||typeof a.href!="string"||a.href==="")break;return!0;case"link":if(typeof a.rel!="string"||typeof a.href!="string"||a.href===""||a.onLoad||a.onError)break;switch(a.rel){case"stylesheet":return r=a.disabled,typeof a.precedence=="string"&&r==null;default:return!0}case"script":if(a.async&&typeof a.async!="function"&&typeof a.async!="symbol"&&!a.onLoad&&!a.onError&&a.src&&typeof a.src=="string")return!0}return!1}function tx(r){return!(r.type==="stylesheet"&&(r.state.loading&3)===0)}var Il=null;function WT(){}function ZT(r,a,o){if(Il===null)throw Error(i(475));var u=Il;if(a.type==="stylesheet"&&(typeof o.media!="string"||matchMedia(o.media).matches!==!1)&&(a.state.loading&4)===0){if(a.instance===null){var h=vs(o.href),b=r.querySelector(Ml(h));if(b){r=b._p,r!==null&&typeof r=="object"&&typeof r.then=="function"&&(u.count++,u=Dc.bind(u),r.then(u,u)),a.state.loading|=4,a.instance=b,Kt(b);return}b=r.ownerDocument||r,o=Z_(o),(h=Sr.get(h))&&op(o,h),b=b.createElement("link"),Kt(b);var w=b;w._p=new Promise(function(O,L){w.onload=O,w.onerror=L}),Sn(b,"link",o),a.instance=b}u.stylesheets===null&&(u.stylesheets=new Map),u.stylesheets.set(a,r),(r=a.state.preload)&&(a.state.loading&3)===0&&(u.count++,a=Dc.bind(u),r.addEventListener("load",a),r.addEventListener("error",a))}}function QT(){if(Il===null)throw Error(i(475));var r=Il;return r.stylesheets&&r.count===0&&up(r,r.stylesheets),0<r.count?function(a){var o=setTimeout(function(){if(r.stylesheets&&up(r,r.stylesheets),r.unsuspend){var u=r.unsuspend;r.unsuspend=null,u()}},6e4);return r.unsuspend=a,function(){r.unsuspend=null,clearTimeout(o)}}:null}function Dc(){if(this.count--,this.count===0){if(this.stylesheets)up(this,this.stylesheets);else if(this.unsuspend){var r=this.unsuspend;this.unsuspend=null,r()}}}var kc=null;function up(r,a){r.stylesheets=null,r.unsuspend!==null&&(r.count++,kc=new Map,a.forEach(JT,r),kc=null,Dc.call(r))}function JT(r,a){if(!(a.state.loading&4)){var o=kc.get(r);if(o)var u=o.get(null);else{o=new Map,kc.set(r,o);for(var h=r.querySelectorAll("link[data-precedence],style[data-precedence]"),b=0;b<h.length;b++){var w=h[b];(w.nodeName==="LINK"||w.getAttribute("media")!=="not all")&&(o.set(w.dataset.precedence,w),u=w)}u&&o.set(null,u)}h=a.instance,w=h.getAttribute("data-precedence"),b=o.get(w)||u,b===u&&o.set(null,h),o.set(w,h),this.count++,u=Dc.bind(this),h.addEventListener("load",u),h.addEventListener("error",u),b?b.parentNode.insertBefore(h,b.nextSibling):(r=r.nodeType===9?r.head:r,r.insertBefore(h,r.firstChild)),a.state.loading|=4}}var Ll={$$typeof:k,Provider:null,Consumer:null,_currentValue:X,_currentValue2:X,_threadCount:0};function eO(r,a,o,u,h,b,w,O){this.tag=1,this.containerInfo=r,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=oa(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=oa(0),this.hiddenUpdates=oa(null),this.identifierPrefix=u,this.onUncaughtError=h,this.onCaughtError=b,this.onRecoverableError=w,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=O,this.incompleteTransitions=new Map}function nx(r,a,o,u,h,b,w,O,L,Y,le,ce){return r=new eO(r,a,o,w,O,L,Y,ce),a=1,b===!0&&(a|=24),b=nr(3,null,null,a),r.current=b,b.stateNode=r,a=qd(),a.refCount++,r.pooledCache=a,a.refCount++,b.memoizedState={element:u,isDehydrated:o,cache:a},Yd(b),r}function rx(r){return r?(r=Za,r):Za}function ix(r,a,o,u,h,b){h=rx(h),u.context===null?u.context=h:u.pendingContext=h,u=Mi(a),u.payload={element:o},b=b===void 0?null:b,b!==null&&(u.callback=b),o=Pi(r,u,a),o!==null&&(lr(o,r,a),fl(o,r,a))}function ax(r,a){if(r=r.memoizedState,r!==null&&r.dehydrated!==null){var o=r.retryLane;r.retryLane=o!==0&&o<a?o:a}}function dp(r,a){ax(r,a),(r=r.alternate)&&ax(r,a)}function sx(r){if(r.tag===13){var a=Wa(r,67108864);a!==null&&lr(a,r,67108864),dp(r,67108864)}}var Mc=!0;function tO(r,a,o,u){var h=B.T;B.T=null;var b=ee.p;try{ee.p=2,fp(r,a,o,u)}finally{ee.p=b,B.T=h}}function nO(r,a,o,u){var h=B.T;B.T=null;var b=ee.p;try{ee.p=8,fp(r,a,o,u)}finally{ee.p=b,B.T=h}}function fp(r,a,o,u){if(Mc){var h=pp(u);if(h===null)Jf(r,a,u,Pc,o),ox(r,u);else if(iO(h,r,a,o,u))u.stopPropagation();else if(ox(r,u),a&4&&-1<rO.indexOf(r)){for(;h!==null;){var b=Oi(h);if(b!==null)switch(b.tag){case 3:if(b=b.stateNode,b.current.memoizedState.isDehydrated){var w=dn(b.pendingLanes);if(w!==0){var O=b;for(O.pendingLanes|=2,O.entangledLanes|=2;w;){var L=1<<31-Ie(w);O.entanglements[1]|=L,w&=~L}Kr(b),(Dt&6)===0&&(bc=_t()+500,Nl(0))}}break;case 13:O=Wa(b,2),O!==null&&lr(O,b,2),vc(),dp(b,2)}if(b=pp(u),b===null&&Jf(r,a,u,Pc,o),b===h)break;h=b}h!==null&&u.stopPropagation()}else Jf(r,a,u,null,o)}}function pp(r){return r=Ce(r),hp(r)}var Pc=null;function hp(r){if(Pc=null,r=Ti(r),r!==null){var a=l(r);if(a===null)r=null;else{var o=a.tag;if(o===13){if(r=c(a),r!==null)return r;r=null}else if(o===3){if(a.stateNode.current.memoizedState.isDehydrated)return a.tag===3?a.stateNode.containerInfo:null;r=null}else a!==r&&(r=null)}}return Pc=r,null}function lx(r){switch(r){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(Ve()){case Ut:return 2;case Zt:return 8;case Et:case Bn:return 32;case hr:return 268435456;default:return 32}default:return 32}}var mp=!1,Ki=null,Yi=null,Xi=null,jl=new Map,$l=new Map,Wi=[],rO="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function ox(r,a){switch(r){case"focusin":case"focusout":Ki=null;break;case"dragenter":case"dragleave":Yi=null;break;case"mouseover":case"mouseout":Xi=null;break;case"pointerover":case"pointerout":jl.delete(a.pointerId);break;case"gotpointercapture":case"lostpointercapture":$l.delete(a.pointerId)}}function zl(r,a,o,u,h,b){return r===null||r.nativeEvent!==b?(r={blockedOn:a,domEventName:o,eventSystemFlags:u,nativeEvent:b,targetContainers:[h]},a!==null&&(a=Oi(a),a!==null&&sx(a)),r):(r.eventSystemFlags|=u,a=r.targetContainers,h!==null&&a.indexOf(h)===-1&&a.push(h),r)}function iO(r,a,o,u,h){switch(a){case"focusin":return Ki=zl(Ki,r,a,o,u,h),!0;case"dragenter":return Yi=zl(Yi,r,a,o,u,h),!0;case"mouseover":return Xi=zl(Xi,r,a,o,u,h),!0;case"pointerover":var b=h.pointerId;return jl.set(b,zl(jl.get(b)||null,r,a,o,u,h)),!0;case"gotpointercapture":return b=h.pointerId,$l.set(b,zl($l.get(b)||null,r,a,o,u,h)),!0}return!1}function cx(r){var a=Ti(r.target);if(a!==null){var o=l(a);if(o!==null){if(a=o.tag,a===13){if(a=c(o),a!==null){r.blockedOn=a,Ot(r.priority,function(){if(o.tag===13){var u=sr();u=me(u);var h=Wa(o,u);h!==null&&lr(h,o,u),dp(o,u)}});return}}else if(a===3&&o.stateNode.current.memoizedState.isDehydrated){r.blockedOn=o.tag===3?o.stateNode.containerInfo:null;return}}}r.blockedOn=null}function Ic(r){if(r.blockedOn!==null)return!1;for(var a=r.targetContainers;0<a.length;){var o=pp(r.nativeEvent);if(o===null){o=r.nativeEvent;var u=new o.constructor(o.type,o);pa=u,o.target.dispatchEvent(u),pa=null}else return a=Oi(o),a!==null&&sx(a),r.blockedOn=o,!1;a.shift()}return!0}function ux(r,a,o){Ic(r)&&o.delete(a)}function aO(){mp=!1,Ki!==null&&Ic(Ki)&&(Ki=null),Yi!==null&&Ic(Yi)&&(Yi=null),Xi!==null&&Ic(Xi)&&(Xi=null),jl.forEach(ux),$l.forEach(ux)}function Lc(r,a){r.blockedOn===a&&(r.blockedOn=null,mp||(mp=!0,e.unstable_scheduleCallback(e.unstable_NormalPriority,aO)))}var jc=null;function dx(r){jc!==r&&(jc=r,e.unstable_scheduleCallback(e.unstable_NormalPriority,function(){jc===r&&(jc=null);for(var a=0;a<r.length;a+=3){var o=r[a],u=r[a+1],h=r[a+2];if(typeof u!="function"){if(hp(u||o)===null)continue;break}var b=Oi(o);b!==null&&(r.splice(a,3),a-=3,hf(b,{pending:!0,data:h,method:o.method,action:u},u,h))}}))}function Bl(r){function a(L){return Lc(L,r)}Ki!==null&&Lc(Ki,r),Yi!==null&&Lc(Yi,r),Xi!==null&&Lc(Xi,r),jl.forEach(a),$l.forEach(a);for(var o=0;o<Wi.length;o++){var u=Wi[o];u.blockedOn===r&&(u.blockedOn=null)}for(;0<Wi.length&&(o=Wi[0],o.blockedOn===null);)cx(o),o.blockedOn===null&&Wi.shift();if(o=(r.ownerDocument||r).$$reactFormReplay,o!=null)for(u=0;u<o.length;u+=3){var h=o[u],b=o[u+1],w=h[Te]||null;if(typeof b=="function")w||dx(o);else if(w){var O=null;if(b&&b.hasAttribute("formAction")){if(h=b,w=b[Te]||null)O=w.formAction;else if(hp(h)!==null)continue}else O=w.action;typeof O=="function"?o[u+1]=O:(o.splice(u,3),u-=3),dx(o)}}}function gp(r){this._internalRoot=r}$c.prototype.render=gp.prototype.render=function(r){var a=this._internalRoot;if(a===null)throw Error(i(409));var o=a.current,u=sr();ix(o,u,r,a,null,null)},$c.prototype.unmount=gp.prototype.unmount=function(){var r=this._internalRoot;if(r!==null){this._internalRoot=null;var a=r.containerInfo;ix(r.current,2,null,r,null,null),vc(),a[ht]=null}};function $c(r){this._internalRoot=r}$c.prototype.unstable_scheduleHydration=function(r){if(r){var a=pt();r={blockedOn:null,target:r,priority:a};for(var o=0;o<Wi.length&&a!==0&&a<Wi[o].priority;o++);Wi.splice(o,0,r),o===0&&cx(r)}};var fx=t.version;if(fx!=="19.1.1")throw Error(i(527,fx,"19.1.1"));ee.findDOMNode=function(r){var a=r._reactInternals;if(a===void 0)throw typeof r.render=="function"?Error(i(188)):(r=Object.keys(r).join(","),Error(i(268,r)));return r=f(a),r=r!==null?p(r):null,r=r===null?null:r.stateNode,r};var sO={bundleType:0,version:"19.1.1",rendererPackageName:"react-dom",currentDispatcherRef:B,reconcilerVersion:"19.1.1"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var zc=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!zc.isDisabled&&zc.supportsFiber)try{ne=zc.inject(sO),de=zc}catch{}}return Ul.createRoot=function(r,a){if(!s(r))throw Error(i(299));var o=!1,u="",h=Rv,b=Nv,w=Av,O=null;return a!=null&&(a.unstable_strictMode===!0&&(o=!0),a.identifierPrefix!==void 0&&(u=a.identifierPrefix),a.onUncaughtError!==void 0&&(h=a.onUncaughtError),a.onCaughtError!==void 0&&(b=a.onCaughtError),a.onRecoverableError!==void 0&&(w=a.onRecoverableError),a.unstable_transitionCallbacks!==void 0&&(O=a.unstable_transitionCallbacks)),a=nx(r,1,!1,null,null,o,u,h,b,w,O,null),r[ht]=a.current,Qf(r),new gp(a)},Ul.hydrateRoot=function(r,a,o){if(!s(r))throw Error(i(299));var u=!1,h="",b=Rv,w=Nv,O=Av,L=null,Y=null;return o!=null&&(o.unstable_strictMode===!0&&(u=!0),o.identifierPrefix!==void 0&&(h=o.identifierPrefix),o.onUncaughtError!==void 0&&(b=o.onUncaughtError),o.onCaughtError!==void 0&&(w=o.onCaughtError),o.onRecoverableError!==void 0&&(O=o.onRecoverableError),o.unstable_transitionCallbacks!==void 0&&(L=o.unstable_transitionCallbacks),o.formState!==void 0&&(Y=o.formState)),a=nx(r,1,!0,a,o??null,u,h,b,w,O,L,Y),a.context=rx(null),o=a.current,u=sr(),u=me(u),h=Mi(u),h.callback=null,Pi(o,h,u),o=u,a.current.lanes=o,Ft(a,o),Kr(a),r[ht]=a.current,Qf(r),new $c(a)},Ul.version="19.1.1",Ul}var wx;function bO(){if(wx)return vp.exports;wx=1;function e(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(e)}catch(t){console.error(t)}}return e(),vp.exports=gO(),vp.exports}var yO=bO();const vO=za(yO);var Hl={},Ex;function _O(){if(Ex)return Hl;Ex=1,Object.defineProperty(Hl,"__esModule",{value:!0}),Hl.parse=c,Hl.serialize=p;const e=/^[\u0021-\u003A\u003C\u003E-\u007E]+$/,t=/^[\u0021-\u003A\u003C-\u007E]*$/,n=/^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i,i=/^[\u0020-\u003A\u003D-\u007E]*$/,s=Object.prototype.toString,l=(()=>{const y=function(){};return y.prototype=Object.create(null),y})();function c(y,v){const _=new l,T=y.length;if(T<2)return _;const N=(v==null?void 0:v.decode)||m;let C=0;do{const P=y.indexOf("=",C);if(P===-1)break;const k=y.indexOf(";",C),I=k===-1?T:k;if(P>I){C=y.lastIndexOf(";",P-1)+1;continue}const D=d(y,C,P),M=f(y,P,D),z=y.slice(D,M);if(_[z]===void 0){let Z=d(y,P+1,I),W=f(y,I,Z);const $=N(y.slice(Z,W));_[z]=$}C=I+1}while(C<T);return _}function d(y,v,_){do{const T=y.charCodeAt(v);if(T!==32&&T!==9)return v}while(++v<_);return _}function f(y,v,_){for(;v>_;){const T=y.charCodeAt(--v);if(T!==32&&T!==9)return v+1}return _}function p(y,v,_){const T=(_==null?void 0:_.encode)||encodeURIComponent;if(!e.test(y))throw new TypeError(`argument name is invalid: ${y}`);const N=T(v);if(!t.test(N))throw new TypeError(`argument val is invalid: ${v}`);let C=y+"="+N;if(!_)return C;if(_.maxAge!==void 0){if(!Number.isInteger(_.maxAge))throw new TypeError(`option maxAge is invalid: ${_.maxAge}`);C+="; Max-Age="+_.maxAge}if(_.domain){if(!n.test(_.domain))throw new TypeError(`option domain is invalid: ${_.domain}`);C+="; Domain="+_.domain}if(_.path){if(!i.test(_.path))throw new TypeError(`option path is invalid: ${_.path}`);C+="; Path="+_.path}if(_.expires){if(!g(_.expires)||!Number.isFinite(_.expires.valueOf()))throw new TypeError(`option expires is invalid: ${_.expires}`);C+="; Expires="+_.expires.toUTCString()}if(_.httpOnly&&(C+="; HttpOnly"),_.secure&&(C+="; Secure"),_.partitioned&&(C+="; Partitioned"),_.priority)switch(typeof _.priority=="string"?_.priority.toLowerCase():void 0){case"low":C+="; Priority=Low";break;case"medium":C+="; Priority=Medium";break;case"high":C+="; Priority=High";break;default:throw new TypeError(`option priority is invalid: ${_.priority}`)}if(_.sameSite)switch(typeof _.sameSite=="string"?_.sameSite.toLowerCase():_.sameSite){case!0:case"strict":C+="; SameSite=Strict";break;case"lax":C+="; SameSite=Lax";break;case"none":C+="; SameSite=None";break;default:throw new TypeError(`option sameSite is invalid: ${_.sameSite}`)}return C}function m(y){if(y.indexOf("%")===-1)return y;try{return decodeURIComponent(y)}catch{return y}}function g(y){return s.call(y)==="[object Date]"}return Hl}_O();var Sx="popstate";function xO(e={}){function t(i,s){let{pathname:l,search:c,hash:d}=i.location;return fh("",{pathname:l,search:c,hash:d},s.state&&s.state.usr||null,s.state&&s.state.key||"default")}function n(i,s){return typeof s=="string"?s:co(s)}return EO(t,n,null,e)}function Gt(e,t){if(e===!1||e===null||typeof e>"u")throw new Error(t)}function $r(e,t){if(!e){typeof console<"u"&&console.warn(t);try{throw new Error(t)}catch{}}}function wO(){return Math.random().toString(36).substring(2,10)}function Cx(e,t){return{usr:e.state,key:e.key,idx:t}}function fh(e,t,n=null,i){return{pathname:typeof e=="string"?e:e.pathname,search:"",hash:"",...typeof t=="string"?js(t):t,state:n,key:t&&t.key||i||wO()}}function co({pathname:e="/",search:t="",hash:n=""}){return t&&t!=="?"&&(e+=t.charAt(0)==="?"?t:"?"+t),n&&n!=="#"&&(e+=n.charAt(0)==="#"?n:"#"+n),e}function js(e){let t={};if(e){let n=e.indexOf("#");n>=0&&(t.hash=e.substring(n),e=e.substring(0,n));let i=e.indexOf("?");i>=0&&(t.search=e.substring(i),e=e.substring(0,i)),e&&(t.pathname=e)}return t}function EO(e,t,n,i={}){let{window:s=document.defaultView,v5Compat:l=!1}=i,c=s.history,d="POP",f=null,p=m();p==null&&(p=0,c.replaceState({...c.state,idx:p},""));function m(){return(c.state||{idx:null}).idx}function g(){d="POP";let N=m(),C=N==null?null:N-p;p=N,f&&f({action:d,location:T.location,delta:C})}function y(N,C){d="PUSH";let P=fh(T.location,N,C);p=m()+1;let k=Cx(P,p),I=T.createHref(P);try{c.pushState(k,"",I)}catch(D){if(D instanceof DOMException&&D.name==="DataCloneError")throw D;s.location.assign(I)}l&&f&&f({action:d,location:T.location,delta:1})}function v(N,C){d="REPLACE";let P=fh(T.location,N,C);p=m();let k=Cx(P,p),I=T.createHref(P);c.replaceState(k,"",I),l&&f&&f({action:d,location:T.location,delta:0})}function _(N){return SO(N)}let T={get action(){return d},get location(){return e(s,c)},listen(N){if(f)throw new Error("A history only accepts one active listener");return s.addEventListener(Sx,g),f=N,()=>{s.removeEventListener(Sx,g),f=null}},createHref(N){return t(s,N)},createURL:_,encodeLocation(N){let C=_(N);return{pathname:C.pathname,search:C.search,hash:C.hash}},push:y,replace:v,go(N){return c.go(N)}};return T}function SO(e,t=!1){let n="http://localhost";typeof window<"u"&&(n=window.location.origin!=="null"?window.location.origin:window.location.href),Gt(n,"No window.location.(origin|href) available to create URL");let i=typeof e=="string"?e:co(e);return i=i.replace(/ $/,"%20"),!t&&i.startsWith("//")&&(i=n+i),new URL(i,n)}function Lw(e,t,n="/"){return CO(e,t,n,!1)}function CO(e,t,n,i){let s=typeof t=="string"?js(t):t,l=xi(s.pathname||"/",n);if(l==null)return null;let c=jw(e);TO(c);let d=null;for(let f=0;d==null&&f<c.length;++f){let p=jO(l);d=IO(c[f],p,i)}return d}function jw(e,t=[],n=[],i=""){let s=(l,c,d)=>{let f={relativePath:d===void 0?l.path||"":d,caseSensitive:l.caseSensitive===!0,childrenIndex:c,route:l};f.relativePath.startsWith("/")&&(Gt(f.relativePath.startsWith(i),`Absolute route path "${f.relativePath}" nested under path "${i}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`),f.relativePath=f.relativePath.slice(i.length));let p=vi([i,f.relativePath]),m=n.concat(f);l.children&&l.children.length>0&&(Gt(l.index!==!0,`Index routes must not have child routes. Please remove all child routes from route path "${p}".`),jw(l.children,t,m,p)),!(l.path==null&&!l.index)&&t.push({path:p,score:MO(p,l.index),routesMeta:m})};return e.forEach((l,c)=>{var d;if(l.path===""||!((d=l.path)!=null&&d.includes("?")))s(l,c);else for(let f of $w(l.path))s(l,c,f)}),t}function $w(e){let t=e.split("/");if(t.length===0)return[];let[n,...i]=t,s=n.endsWith("?"),l=n.replace(/\?$/,"");if(i.length===0)return s?[l,""]:[l];let c=$w(i.join("/")),d=[];return d.push(...c.map(f=>f===""?l:[l,f].join("/"))),s&&d.push(...c),d.map(f=>e.startsWith("/")&&f===""?"/":f)}function TO(e){e.sort((t,n)=>t.score!==n.score?n.score-t.score:PO(t.routesMeta.map(i=>i.childrenIndex),n.routesMeta.map(i=>i.childrenIndex)))}var OO=/^:[\w-]+$/,RO=3,NO=2,AO=1,DO=10,kO=-2,Tx=e=>e==="*";function MO(e,t){let n=e.split("/"),i=n.length;return n.some(Tx)&&(i+=kO),t&&(i+=NO),n.filter(s=>!Tx(s)).reduce((s,l)=>s+(OO.test(l)?RO:l===""?AO:DO),i)}function PO(e,t){return e.length===t.length&&e.slice(0,-1).every((i,s)=>i===t[s])?e[e.length-1]-t[t.length-1]:0}function IO(e,t,n=!1){let{routesMeta:i}=e,s={},l="/",c=[];for(let d=0;d<i.length;++d){let f=i[d],p=d===i.length-1,m=l==="/"?t:t.slice(l.length)||"/",g=gu({path:f.relativePath,caseSensitive:f.caseSensitive,end:p},m),y=f.route;if(!g&&p&&n&&!i[i.length-1].route.index&&(g=gu({path:f.relativePath,caseSensitive:f.caseSensitive,end:!1},m)),!g)return null;Object.assign(s,g.params),c.push({params:s,pathname:vi([l,g.pathname]),pathnameBase:FO(vi([l,g.pathnameBase])),route:y}),g.pathnameBase!=="/"&&(l=vi([l,g.pathnameBase]))}return c}function gu(e,t){typeof e=="string"&&(e={path:e,caseSensitive:!1,end:!0});let[n,i]=LO(e.path,e.caseSensitive,e.end),s=t.match(n);if(!s)return null;let l=s[0],c=l.replace(/(.)\/+$/,"$1"),d=s.slice(1);return{params:i.reduce((p,{paramName:m,isOptional:g},y)=>{if(m==="*"){let _=d[y]||"";c=l.slice(0,l.length-_.length).replace(/(.)\/+$/,"$1")}const v=d[y];return g&&!v?p[m]=void 0:p[m]=(v||"").replace(/%2F/g,"/"),p},{}),pathname:l,pathnameBase:c,pattern:e}}function LO(e,t=!1,n=!0){$r(e==="*"||!e.endsWith("*")||e.endsWith("/*"),`Route path "${e}" will be treated as if it were "${e.replace(/\*$/,"/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${e.replace(/\*$/,"/*")}".`);let i=[],s="^"+e.replace(/\/*\*?$/,"").replace(/^\/*/,"/").replace(/[\\.*+^${}|()[\]]/g,"\\$&").replace(/\/:([\w-]+)(\?)?/g,(c,d,f)=>(i.push({paramName:d,isOptional:f!=null}),f?"/?([^\\/]+)?":"/([^\\/]+)"));return e.endsWith("*")?(i.push({paramName:"*"}),s+=e==="*"||e==="/*"?"(.*)$":"(?:\\/(.+)|\\/*)$"):n?s+="\\/*$":e!==""&&e!=="/"&&(s+="(?:(?=\\/|$))"),[new RegExp(s,t?void 0:"i"),i]}function jO(e){try{return e.split("/").map(t=>decodeURIComponent(t).replace(/\//g,"%2F")).join("/")}catch(t){return $r(!1,`The URL path "${e}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${t}).`),e}}function xi(e,t){if(t==="/")return e;if(!e.toLowerCase().startsWith(t.toLowerCase()))return null;let n=t.endsWith("/")?t.length-1:t.length,i=e.charAt(n);return i&&i!=="/"?null:e.slice(n)||"/"}function $O(e,t="/"){let{pathname:n,search:i="",hash:s=""}=typeof e=="string"?js(e):e;return{pathname:n?n.startsWith("/")?n:zO(n,t):t,search:UO(i),hash:HO(s)}}function zO(e,t){let n=t.replace(/\/+$/,"").split("/");return e.split("/").forEach(s=>{s===".."?n.length>1&&n.pop():s!=="."&&n.push(s)}),n.length>1?n.join("/"):"/"}function Ep(e,t,n,i){return`Cannot include a '${e}' character in a manually specified \`to.${t}\` field [${JSON.stringify(i)}].  Please separate it out to the \`to.${n}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`}function BO(e){return e.filter((t,n)=>n===0||t.route.path&&t.route.path.length>0)}function Vg(e){let t=BO(e);return t.map((n,i)=>i===t.length-1?n.pathname:n.pathnameBase)}function Kg(e,t,n,i=!1){let s;typeof e=="string"?s=js(e):(s={...e},Gt(!s.pathname||!s.pathname.includes("?"),Ep("?","pathname","search",s)),Gt(!s.pathname||!s.pathname.includes("#"),Ep("#","pathname","hash",s)),Gt(!s.search||!s.search.includes("#"),Ep("#","search","hash",s)));let l=e===""||s.pathname==="",c=l?"/":s.pathname,d;if(c==null)d=n;else{let g=t.length-1;if(!i&&c.startsWith("..")){let y=c.split("/");for(;y[0]==="..";)y.shift(),g-=1;s.pathname=y.join("/")}d=g>=0?t[g]:"/"}let f=$O(s,d),p=c&&c!=="/"&&c.endsWith("/"),m=(l||c===".")&&n.endsWith("/");return!f.pathname.endsWith("/")&&(p||m)&&(f.pathname+="/"),f}var vi=e=>e.join("/").replace(/\/\/+/g,"/"),FO=e=>e.replace(/\/+$/,"").replace(/^\/*/,"/"),UO=e=>!e||e==="?"?"":e.startsWith("?")?e:"?"+e,HO=e=>!e||e==="#"?"":e.startsWith("#")?e:"#"+e;function qO(e){return e!=null&&typeof e.status=="number"&&typeof e.statusText=="string"&&typeof e.internal=="boolean"&&"data"in e}var zw=["POST","PUT","PATCH","DELETE"];new Set(zw);var GO=["GET",...zw];new Set(GO);var $s=E.createContext(null);$s.displayName="DataRouter";var Vu=E.createContext(null);Vu.displayName="DataRouterState";var Bw=E.createContext({isTransitioning:!1});Bw.displayName="ViewTransition";var VO=E.createContext(new Map);VO.displayName="Fetchers";var KO=E.createContext(null);KO.displayName="Await";var Br=E.createContext(null);Br.displayName="Navigation";var yo=E.createContext(null);yo.displayName="Location";var Fr=E.createContext({outlet:null,matches:[],isDataRoute:!1});Fr.displayName="Route";var Yg=E.createContext(null);Yg.displayName="RouteError";function YO(e,{relative:t}={}){Gt(zs(),"useHref() may be used only in the context of a <Router> component.");let{basename:n,navigator:i}=E.useContext(Br),{hash:s,pathname:l,search:c}=vo(e,{relative:t}),d=l;return n!=="/"&&(d=l==="/"?n:vi([n,l])),i.createHref({pathname:d,search:c,hash:s})}function zs(){return E.useContext(yo)!=null}function Ei(){return Gt(zs(),"useLocation() may be used only in the context of a <Router> component."),E.useContext(yo).location}var Fw="You should call navigate() in a React.useEffect(), not when your component is first rendered.";function Uw(e){E.useContext(Br).static||E.useLayoutEffect(e)}function Ku(){let{isDataRoute:e}=E.useContext(Fr);return e?lR():XO()}function XO(){Gt(zs(),"useNavigate() may be used only in the context of a <Router> component.");let e=E.useContext($s),{basename:t,navigator:n}=E.useContext(Br),{matches:i}=E.useContext(Fr),{pathname:s}=Ei(),l=JSON.stringify(Vg(i)),c=E.useRef(!1);return Uw(()=>{c.current=!0}),E.useCallback((f,p={})=>{if($r(c.current,Fw),!c.current)return;if(typeof f=="number"){n.go(f);return}let m=Kg(f,JSON.parse(l),s,p.relative==="path");e==null&&t!=="/"&&(m.pathname=m.pathname==="/"?t:vi([t,m.pathname])),(p.replace?n.replace:n.push)(m,p.state,p)},[t,n,l,s,e])}E.createContext(null);function Xg(){let{matches:e}=E.useContext(Fr),t=e[e.length-1];return t?t.params:{}}function vo(e,{relative:t}={}){let{matches:n}=E.useContext(Fr),{pathname:i}=Ei(),s=JSON.stringify(Vg(n));return E.useMemo(()=>Kg(e,JSON.parse(s),i,t==="path"),[e,s,i,t])}function WO(e,t){return Hw(e,t)}function Hw(e,t,n,i){var P;Gt(zs(),"useRoutes() may be used only in the context of a <Router> component.");let{navigator:s,static:l}=E.useContext(Br),{matches:c}=E.useContext(Fr),d=c[c.length-1],f=d?d.params:{},p=d?d.pathname:"/",m=d?d.pathnameBase:"/",g=d&&d.route;{let k=g&&g.path||"";qw(p,!g||k.endsWith("*")||k.endsWith("*?"),`You rendered descendant <Routes> (or called \`useRoutes()\`) at "${p}" (under <Route path="${k}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${k}"> to <Route path="${k==="/"?"*":`${k}/*`}">.`)}let y=Ei(),v;if(t){let k=typeof t=="string"?js(t):t;Gt(m==="/"||((P=k.pathname)==null?void 0:P.startsWith(m)),`When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${m}" but pathname "${k.pathname}" was given in the \`location\` prop.`),v=k}else v=y;let _=v.pathname||"/",T=_;if(m!=="/"){let k=m.replace(/^\//,"").split("/");T="/"+_.replace(/^\//,"").split("/").slice(k.length).join("/")}let N=!l&&n&&n.matches&&n.matches.length>0?n.matches:Lw(e,{pathname:T});$r(g||N!=null,`No routes matched location "${v.pathname}${v.search}${v.hash}" `),$r(N==null||N[N.length-1].route.element!==void 0||N[N.length-1].route.Component!==void 0||N[N.length-1].route.lazy!==void 0,`Matched leaf route at location "${v.pathname}${v.search}${v.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`);let C=tR(N&&N.map(k=>Object.assign({},k,{params:Object.assign({},f,k.params),pathname:vi([m,s.encodeLocation?s.encodeLocation(k.pathname).pathname:k.pathname]),pathnameBase:k.pathnameBase==="/"?m:vi([m,s.encodeLocation?s.encodeLocation(k.pathnameBase).pathname:k.pathnameBase])})),c,n,i);return t&&C?E.createElement(yo.Provider,{value:{location:{pathname:"/",search:"",hash:"",state:null,key:"default",...v},navigationType:"POP"}},C):C}function ZO(){let e=sR(),t=qO(e)?`${e.status} ${e.statusText}`:e instanceof Error?e.message:JSON.stringify(e),n=e instanceof Error?e.stack:null,i="rgba(200,200,200, 0.5)",s={padding:"0.5rem",backgroundColor:i},l={padding:"2px 4px",backgroundColor:i},c=null;return console.error("Error handled by React Router default ErrorBoundary:",e),c=E.createElement(E.Fragment,null,E.createElement("p",null,"💿 Hey developer 👋"),E.createElement("p",null,"You can provide a way better UX than this when your app throws errors by providing your own ",E.createElement("code",{style:l},"ErrorBoundary")," or"," ",E.createElement("code",{style:l},"errorElement")," prop on your route.")),E.createElement(E.Fragment,null,E.createElement("h2",null,"Unexpected Application Error!"),E.createElement("h3",{style:{fontStyle:"italic"}},t),n?E.createElement("pre",{style:s},n):null,c)}var QO=E.createElement(ZO,null),JO=class extends E.Component{constructor(e){super(e),this.state={location:e.location,revalidation:e.revalidation,error:e.error}}static getDerivedStateFromError(e){return{error:e}}static getDerivedStateFromProps(e,t){return t.location!==e.location||t.revalidation!=="idle"&&e.revalidation==="idle"?{error:e.error,location:e.location,revalidation:e.revalidation}:{error:e.error!==void 0?e.error:t.error,location:t.location,revalidation:e.revalidation||t.revalidation}}componentDidCatch(e,t){console.error("React Router caught the following error during render",e,t)}render(){return this.state.error!==void 0?E.createElement(Fr.Provider,{value:this.props.routeContext},E.createElement(Yg.Provider,{value:this.state.error,children:this.props.component})):this.props.children}};function eR({routeContext:e,match:t,children:n}){let i=E.useContext($s);return i&&i.static&&i.staticContext&&(t.route.errorElement||t.route.ErrorBoundary)&&(i.staticContext._deepestRenderedBoundaryId=t.route.id),E.createElement(Fr.Provider,{value:e},n)}function tR(e,t=[],n=null,i=null){if(e==null){if(!n)return null;if(n.errors)e=n.matches;else if(t.length===0&&!n.initialized&&n.matches.length>0)e=n.matches;else return null}let s=e,l=n==null?void 0:n.errors;if(l!=null){let f=s.findIndex(p=>p.route.id&&(l==null?void 0:l[p.route.id])!==void 0);Gt(f>=0,`Could not find a matching route for errors on route IDs: ${Object.keys(l).join(",")}`),s=s.slice(0,Math.min(s.length,f+1))}let c=!1,d=-1;if(n)for(let f=0;f<s.length;f++){let p=s[f];if((p.route.HydrateFallback||p.route.hydrateFallbackElement)&&(d=f),p.route.id){let{loaderData:m,errors:g}=n,y=p.route.loader&&!m.hasOwnProperty(p.route.id)&&(!g||g[p.route.id]===void 0);if(p.route.lazy||y){c=!0,d>=0?s=s.slice(0,d+1):s=[s[0]];break}}}return s.reduceRight((f,p,m)=>{let g,y=!1,v=null,_=null;n&&(g=l&&p.route.id?l[p.route.id]:void 0,v=p.route.errorElement||QO,c&&(d<0&&m===0?(qw("route-fallback",!1,"No `HydrateFallback` element provided to render during initial hydration"),y=!0,_=null):d===m&&(y=!0,_=p.route.hydrateFallbackElement||null)));let T=t.concat(s.slice(0,m+1)),N=()=>{let C;return g?C=v:y?C=_:p.route.Component?C=E.createElement(p.route.Component,null):p.route.element?C=p.route.element:C=f,E.createElement(eR,{match:p,routeContext:{outlet:f,matches:T,isDataRoute:n!=null},children:C})};return n&&(p.route.ErrorBoundary||p.route.errorElement||m===0)?E.createElement(JO,{location:n.location,revalidation:n.revalidation,component:v,error:g,children:N(),routeContext:{outlet:null,matches:T,isDataRoute:!0}}):N()},null)}function Wg(e){return`${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`}function nR(e){let t=E.useContext($s);return Gt(t,Wg(e)),t}function rR(e){let t=E.useContext(Vu);return Gt(t,Wg(e)),t}function iR(e){let t=E.useContext(Fr);return Gt(t,Wg(e)),t}function Zg(e){let t=iR(e),n=t.matches[t.matches.length-1];return Gt(n.route.id,`${e} can only be used on routes that contain a unique "id"`),n.route.id}function aR(){return Zg("useRouteId")}function sR(){var i;let e=E.useContext(Yg),t=rR("useRouteError"),n=Zg("useRouteError");return e!==void 0?e:(i=t.errors)==null?void 0:i[n]}function lR(){let{router:e}=nR("useNavigate"),t=Zg("useNavigate"),n=E.useRef(!1);return Uw(()=>{n.current=!0}),E.useCallback(async(s,l={})=>{$r(n.current,Fw),n.current&&(typeof s=="number"?e.navigate(s):await e.navigate(s,{fromRouteId:t,...l}))},[e,t])}var Ox={};function qw(e,t,n){!t&&!Ox[e]&&(Ox[e]=!0,$r(!1,n))}E.memo(oR);function oR({routes:e,future:t,state:n}){return Hw(e,void 0,n,t)}function cR({to:e,replace:t,state:n,relative:i}){Gt(zs(),"<Navigate> may be used only in the context of a <Router> component.");let{static:s}=E.useContext(Br);$r(!s,"<Navigate> must not be used on the initial render in a <StaticRouter>. This is a no-op, but you should modify your code so the <Navigate> is only ever rendered in response to some user interaction or state change.");let{matches:l}=E.useContext(Fr),{pathname:c}=Ei(),d=Ku(),f=Kg(e,Vg(l),c,i==="path"),p=JSON.stringify(f);return E.useEffect(()=>{d(JSON.parse(p),{replace:t,state:n,relative:i})},[d,p,i,t,n]),null}function Ts(e){Gt(!1,"A <Route> is only ever to be used as the child of <Routes> element, never rendered directly. Please wrap your <Route> in a <Routes>.")}function uR({basename:e="/",children:t=null,location:n,navigationType:i="POP",navigator:s,static:l=!1}){Gt(!zs(),"You cannot render a <Router> inside another <Router>. You should never have more than one in your app.");let c=e.replace(/^\/*/,"/"),d=E.useMemo(()=>({basename:c,navigator:s,static:l,future:{}}),[c,s,l]);typeof n=="string"&&(n=js(n));let{pathname:f="/",search:p="",hash:m="",state:g=null,key:y="default"}=n,v=E.useMemo(()=>{let _=xi(f,c);return _==null?null:{location:{pathname:_,search:p,hash:m,state:g,key:y},navigationType:i}},[c,f,p,m,g,y,i]);return $r(v!=null,`<Router basename="${c}"> is not able to match the URL "${f}${p}${m}" because it does not start with the basename, so the <Router> won't render anything.`),v==null?null:E.createElement(Br.Provider,{value:d},E.createElement(yo.Provider,{children:t,value:v}))}function dR({children:e,location:t}){return WO(ph(e),t)}function ph(e,t=[]){let n=[];return E.Children.forEach(e,(i,s)=>{if(!E.isValidElement(i))return;let l=[...t,s];if(i.type===E.Fragment){n.push.apply(n,ph(i.props.children,l));return}Gt(i.type===Ts,`[${typeof i.type=="string"?i.type:i.type.name}] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>`),Gt(!i.props.index||!i.props.children,"An index route cannot have child routes.");let c={id:i.props.id||l.join("-"),caseSensitive:i.props.caseSensitive,element:i.props.element,Component:i.props.Component,index:i.props.index,path:i.props.path,loader:i.props.loader,action:i.props.action,hydrateFallbackElement:i.props.hydrateFallbackElement,HydrateFallback:i.props.HydrateFallback,errorElement:i.props.errorElement,ErrorBoundary:i.props.ErrorBoundary,hasErrorBoundary:i.props.hasErrorBoundary===!0||i.props.ErrorBoundary!=null||i.props.errorElement!=null,shouldRevalidate:i.props.shouldRevalidate,handle:i.props.handle,lazy:i.props.lazy};i.props.children&&(c.children=ph(i.props.children,l)),n.push(c)}),n}var lu="get",ou="application/x-www-form-urlencoded";function Yu(e){return e!=null&&typeof e.tagName=="string"}function fR(e){return Yu(e)&&e.tagName.toLowerCase()==="button"}function pR(e){return Yu(e)&&e.tagName.toLowerCase()==="form"}function hR(e){return Yu(e)&&e.tagName.toLowerCase()==="input"}function mR(e){return!!(e.metaKey||e.altKey||e.ctrlKey||e.shiftKey)}function gR(e,t){return e.button===0&&(!t||t==="_self")&&!mR(e)}var Bc=null;function bR(){if(Bc===null)try{new FormData(document.createElement("form"),0),Bc=!1}catch{Bc=!0}return Bc}var yR=new Set(["application/x-www-form-urlencoded","multipart/form-data","text/plain"]);function Sp(e){return e!=null&&!yR.has(e)?($r(!1,`"${e}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${ou}"`),null):e}function vR(e,t){let n,i,s,l,c;if(pR(e)){let d=e.getAttribute("action");i=d?xi(d,t):null,n=e.getAttribute("method")||lu,s=Sp(e.getAttribute("enctype"))||ou,l=new FormData(e)}else if(fR(e)||hR(e)&&(e.type==="submit"||e.type==="image")){let d=e.form;if(d==null)throw new Error('Cannot submit a <button> or <input type="submit"> without a <form>');let f=e.getAttribute("formaction")||d.getAttribute("action");if(i=f?xi(f,t):null,n=e.getAttribute("formmethod")||d.getAttribute("method")||lu,s=Sp(e.getAttribute("formenctype"))||Sp(d.getAttribute("enctype"))||ou,l=new FormData(d,e),!bR()){let{name:p,type:m,value:g}=e;if(m==="image"){let y=p?`${p}.`:"";l.append(`${y}x`,"0"),l.append(`${y}y`,"0")}else p&&l.append(p,g)}}else{if(Yu(e))throw new Error('Cannot submit element that is not <form>, <button>, or <input type="submit|image">');n=lu,i=null,s=ou,c=e}return l&&s==="text/plain"&&(c=l,l=void 0),{action:i,method:n.toLowerCase(),encType:s,formData:l,body:c}}function Qg(e,t){if(e===!1||e===null||typeof e>"u")throw new Error(t)}async function _R(e,t){if(e.id in t)return t[e.id];try{let n=await import(e.module);return t[e.id]=n,n}catch(n){return console.error(`Error loading route module \`${e.module}\`, reloading page...`),console.error(n),window.__reactRouterContext&&window.__reactRouterContext.isSpaMode,window.location.reload(),new Promise(()=>{})}}function xR(e){return e==null?!1:e.href==null?e.rel==="preload"&&typeof e.imageSrcSet=="string"&&typeof e.imageSizes=="string":typeof e.rel=="string"&&typeof e.href=="string"}async function wR(e,t,n){let i=await Promise.all(e.map(async s=>{let l=t.routes[s.route.id];if(l){let c=await _R(l,n);return c.links?c.links():[]}return[]}));return TR(i.flat(1).filter(xR).filter(s=>s.rel==="stylesheet"||s.rel==="preload").map(s=>s.rel==="stylesheet"?{...s,rel:"prefetch",as:"style"}:{...s,rel:"prefetch"}))}function Rx(e,t,n,i,s,l){let c=(f,p)=>n[p]?f.route.id!==n[p].route.id:!0,d=(f,p)=>{var m;return n[p].pathname!==f.pathname||((m=n[p].route.path)==null?void 0:m.endsWith("*"))&&n[p].params["*"]!==f.params["*"]};return l==="assets"?t.filter((f,p)=>c(f,p)||d(f,p)):l==="data"?t.filter((f,p)=>{var g;let m=i.routes[f.route.id];if(!m||!m.hasLoader)return!1;if(c(f,p)||d(f,p))return!0;if(f.route.shouldRevalidate){let y=f.route.shouldRevalidate({currentUrl:new URL(s.pathname+s.search+s.hash,window.origin),currentParams:((g=n[0])==null?void 0:g.params)||{},nextUrl:new URL(e,window.origin),nextParams:f.params,defaultShouldRevalidate:!0});if(typeof y=="boolean")return y}return!0}):[]}function ER(e,t,{includeHydrateFallback:n}={}){return SR(e.map(i=>{let s=t.routes[i.route.id];if(!s)return[];let l=[s.module];return s.clientActionModule&&(l=l.concat(s.clientActionModule)),s.clientLoaderModule&&(l=l.concat(s.clientLoaderModule)),n&&s.hydrateFallbackModule&&(l=l.concat(s.hydrateFallbackModule)),s.imports&&(l=l.concat(s.imports)),l}).flat(1))}function SR(e){return[...new Set(e)]}function CR(e){let t={},n=Object.keys(e).sort();for(let i of n)t[i]=e[i];return t}function TR(e,t){let n=new Set;return new Set(t),e.reduce((i,s)=>{let l=JSON.stringify(CR(s));return n.has(l)||(n.add(l),i.push({key:l,link:s})),i},[])}Object.getOwnPropertyNames(Object.prototype).sort().join("\0");var OR=new Set([100,101,204,205]);function RR(e,t){let n=typeof e=="string"?new URL(e,typeof window>"u"?"server://singlefetch/":window.location.origin):e;return n.pathname==="/"?n.pathname="_root.data":t&&xi(n.pathname,t)==="/"?n.pathname=`${t.replace(/\/$/,"")}/_root.data`:n.pathname=`${n.pathname.replace(/\/$/,"")}.data`,n}function Gw(){let e=E.useContext($s);return Qg(e,"You must render this element inside a <DataRouterContext.Provider> element"),e}function NR(){let e=E.useContext(Vu);return Qg(e,"You must render this element inside a <DataRouterStateContext.Provider> element"),e}var Jg=E.createContext(void 0);Jg.displayName="FrameworkContext";function Vw(){let e=E.useContext(Jg);return Qg(e,"You must render this element inside a <HydratedRouter> element"),e}function AR(e,t){let n=E.useContext(Jg),[i,s]=E.useState(!1),[l,c]=E.useState(!1),{onFocus:d,onBlur:f,onMouseEnter:p,onMouseLeave:m,onTouchStart:g}=t,y=E.useRef(null);E.useEffect(()=>{if(e==="render"&&c(!0),e==="viewport"){let T=C=>{C.forEach(P=>{c(P.isIntersecting)})},N=new IntersectionObserver(T,{threshold:.5});return y.current&&N.observe(y.current),()=>{N.disconnect()}}},[e]),E.useEffect(()=>{if(i){let T=setTimeout(()=>{c(!0)},100);return()=>{clearTimeout(T)}}},[i]);let v=()=>{s(!0)},_=()=>{s(!1),c(!1)};return n?e!=="intent"?[l,y,{}]:[l,y,{onFocus:ql(d,v),onBlur:ql(f,_),onMouseEnter:ql(p,v),onMouseLeave:ql(m,_),onTouchStart:ql(g,v)}]:[!1,y,{}]}function ql(e,t){return n=>{e&&e(n),n.defaultPrevented||t(n)}}function DR({page:e,...t}){let{router:n}=Gw(),i=E.useMemo(()=>Lw(n.routes,e,n.basename),[n.routes,e,n.basename]);return i?E.createElement(MR,{page:e,matches:i,...t}):null}function kR(e){let{manifest:t,routeModules:n}=Vw(),[i,s]=E.useState([]);return E.useEffect(()=>{let l=!1;return wR(e,t,n).then(c=>{l||s(c)}),()=>{l=!0}},[e,t,n]),i}function MR({page:e,matches:t,...n}){let i=Ei(),{manifest:s,routeModules:l}=Vw(),{basename:c}=Gw(),{loaderData:d,matches:f}=NR(),p=E.useMemo(()=>Rx(e,t,f,s,i,"data"),[e,t,f,s,i]),m=E.useMemo(()=>Rx(e,t,f,s,i,"assets"),[e,t,f,s,i]),g=E.useMemo(()=>{if(e===i.pathname+i.search+i.hash)return[];let _=new Set,T=!1;if(t.forEach(C=>{var k;let P=s.routes[C.route.id];!P||!P.hasLoader||(!p.some(I=>I.route.id===C.route.id)&&C.route.id in d&&((k=l[C.route.id])!=null&&k.shouldRevalidate)||P.hasClientLoader?T=!0:_.add(C.route.id))}),_.size===0)return[];let N=RR(e,c);return T&&_.size>0&&N.searchParams.set("_routes",t.filter(C=>_.has(C.route.id)).map(C=>C.route.id).join(",")),[N.pathname+N.search]},[c,d,i,s,p,t,e,l]),y=E.useMemo(()=>ER(m,s),[m,s]),v=kR(m);return E.createElement(E.Fragment,null,g.map(_=>E.createElement("link",{key:_,rel:"prefetch",as:"fetch",href:_,...n})),y.map(_=>E.createElement("link",{key:_,rel:"modulepreload",href:_,...n})),v.map(({key:_,link:T})=>E.createElement("link",{key:_,...T})))}function PR(...e){return t=>{e.forEach(n=>{typeof n=="function"?n(t):n!=null&&(n.current=t)})}}var Kw=typeof window<"u"&&typeof window.document<"u"&&typeof window.document.createElement<"u";try{Kw&&(window.__reactRouterVersion="7.6.0")}catch{}function IR({basename:e,children:t,window:n}){let i=E.useRef();i.current==null&&(i.current=xO({window:n,v5Compat:!0}));let s=i.current,[l,c]=E.useState({action:s.action,location:s.location}),d=E.useCallback(f=>{E.startTransition(()=>c(f))},[c]);return E.useLayoutEffect(()=>s.listen(d),[s,d]),E.createElement(uR,{basename:e,children:t,location:l.location,navigationType:l.action,navigator:s})}var Yw=/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,ra=E.forwardRef(function({onClick:t,discover:n="render",prefetch:i="none",relative:s,reloadDocument:l,replace:c,state:d,target:f,to:p,preventScrollReset:m,viewTransition:g,...y},v){let{basename:_}=E.useContext(Br),T=typeof p=="string"&&Yw.test(p),N,C=!1;if(typeof p=="string"&&T&&(N=p,Kw))try{let W=new URL(window.location.href),$=p.startsWith("//")?new URL(W.protocol+p):new URL(p),re=xi($.pathname,_);$.origin===W.origin&&re!=null?p=re+$.search+$.hash:C=!0}catch{$r(!1,`<Link to="${p}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`)}let P=YO(p,{relative:s}),[k,I,D]=AR(i,y),M=zR(p,{replace:c,state:d,target:f,preventScrollReset:m,relative:s,viewTransition:g});function z(W){t&&t(W),W.defaultPrevented||M(W)}let Z=E.createElement("a",{...y,...D,href:N||P,onClick:C||l?t:z,ref:PR(v,I),target:f,"data-discover":!T&&n==="render"?"true":void 0});return k&&!T?E.createElement(E.Fragment,null,Z,E.createElement(DR,{page:P})):Z});ra.displayName="Link";var LR=E.forwardRef(function({"aria-current":t="page",caseSensitive:n=!1,className:i="",end:s=!1,style:l,to:c,viewTransition:d,children:f,...p},m){let g=vo(c,{relative:p.relative}),y=Ei(),v=E.useContext(Vu),{navigator:_,basename:T}=E.useContext(Br),N=v!=null&&qR(g)&&d===!0,C=_.encodeLocation?_.encodeLocation(g).pathname:g.pathname,P=y.pathname,k=v&&v.navigation&&v.navigation.location?v.navigation.location.pathname:null;n||(P=P.toLowerCase(),k=k?k.toLowerCase():null,C=C.toLowerCase()),k&&T&&(k=xi(k,T)||k);const I=C!=="/"&&C.endsWith("/")?C.length-1:C.length;let D=P===C||!s&&P.startsWith(C)&&P.charAt(I)==="/",M=k!=null&&(k===C||!s&&k.startsWith(C)&&k.charAt(C.length)==="/"),z={isActive:D,isPending:M,isTransitioning:N},Z=D?t:void 0,W;typeof i=="function"?W=i(z):W=[i,D?"active":null,M?"pending":null,N?"transitioning":null].filter(Boolean).join(" ");let $=typeof l=="function"?l(z):l;return E.createElement(ra,{...p,"aria-current":Z,className:W,ref:m,style:$,to:c,viewTransition:d},typeof f=="function"?f(z):f)});LR.displayName="NavLink";var jR=E.forwardRef(({discover:e="render",fetcherKey:t,navigate:n,reloadDocument:i,replace:s,state:l,method:c=lu,action:d,onSubmit:f,relative:p,preventScrollReset:m,viewTransition:g,...y},v)=>{let _=UR(),T=HR(d,{relative:p}),N=c.toLowerCase()==="get"?"get":"post",C=typeof d=="string"&&Yw.test(d),P=k=>{if(f&&f(k),k.defaultPrevented)return;k.preventDefault();let I=k.nativeEvent.submitter,D=(I==null?void 0:I.getAttribute("formmethod"))||c;_(I||k.currentTarget,{fetcherKey:t,method:D,navigate:n,replace:s,state:l,relative:p,preventScrollReset:m,viewTransition:g})};return E.createElement("form",{ref:v,method:N,action:T,onSubmit:i?f:P,...y,"data-discover":!C&&e==="render"?"true":void 0})});jR.displayName="Form";function $R(e){return`${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`}function Xw(e){let t=E.useContext($s);return Gt(t,$R(e)),t}function zR(e,{target:t,replace:n,state:i,preventScrollReset:s,relative:l,viewTransition:c}={}){let d=Ku(),f=Ei(),p=vo(e,{relative:l});return E.useCallback(m=>{if(gR(m,t)){m.preventDefault();let g=n!==void 0?n:co(f)===co(p);d(e,{replace:g,state:i,preventScrollReset:s,relative:l,viewTransition:c})}},[f,d,p,n,i,t,e,s,l,c])}var BR=0,FR=()=>`__${String(++BR)}__`;function UR(){let{router:e}=Xw("useSubmit"),{basename:t}=E.useContext(Br),n=aR();return E.useCallback(async(i,s={})=>{let{action:l,method:c,encType:d,formData:f,body:p}=vR(i,t);if(s.navigate===!1){let m=s.fetcherKey||FR();await e.fetch(m,n,s.action||l,{preventScrollReset:s.preventScrollReset,formData:f,body:p,formMethod:s.method||c,formEncType:s.encType||d,flushSync:s.flushSync})}else await e.navigate(s.action||l,{preventScrollReset:s.preventScrollReset,formData:f,body:p,formMethod:s.method||c,formEncType:s.encType||d,replace:s.replace,state:s.state,fromRouteId:n,flushSync:s.flushSync,viewTransition:s.viewTransition})},[e,t,n])}function HR(e,{relative:t}={}){let{basename:n}=E.useContext(Br),i=E.useContext(Fr);Gt(i,"useFormAction must be used inside a RouteContext");let[s]=i.matches.slice(-1),l={...vo(e||".",{relative:t})},c=Ei();if(e==null){l.search=c.search;let d=new URLSearchParams(l.search),f=d.getAll("index");if(f.some(m=>m==="")){d.delete("index"),f.filter(g=>g).forEach(g=>d.append("index",g));let m=d.toString();l.search=m?`?${m}`:""}}return(!e||e===".")&&s.route.index&&(l.search=l.search?l.search.replace(/^\?/,"?index&"):"?index"),n!=="/"&&(l.pathname=l.pathname==="/"?n:vi([n,l.pathname])),co(l)}function qR(e,t={}){let n=E.useContext(Bw);Gt(n!=null,"`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?");let{basename:i}=Xw("useViewTransitionState"),s=vo(e,{relative:t.relative});if(!n.isTransitioning)return!1;let l=xi(n.currentLocation.pathname,i)||n.currentLocation.pathname,c=xi(n.nextLocation.pathname,i)||n.nextLocation.pathname;return gu(s.pathname,c)!=null||gu(s.pathname,l)!=null}[...OR];var As=Iw();const Lr=za(As);var Cp={exports:{}},Tp={};/**
 * @license React
 * use-sync-external-store-with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Nx;function GR(){if(Nx)return Tp;Nx=1;var e=Gu();function t(f,p){return f===p&&(f!==0||1/f===1/p)||f!==f&&p!==p}var n=typeof Object.is=="function"?Object.is:t,i=e.useSyncExternalStore,s=e.useRef,l=e.useEffect,c=e.useMemo,d=e.useDebugValue;return Tp.useSyncExternalStoreWithSelector=function(f,p,m,g,y){var v=s(null);if(v.current===null){var _={hasValue:!1,value:null};v.current=_}else _=v.current;v=c(function(){function N(D){if(!C){if(C=!0,P=D,D=g(D),y!==void 0&&_.hasValue){var M=_.value;if(y(M,D))return k=M}return k=D}if(M=k,n(P,D))return M;var z=g(D);return y!==void 0&&y(M,z)?(P=D,M):(P=D,k=z)}var C=!1,P,k,I=m===void 0?null:m;return[function(){return N(p())},I===null?void 0:function(){return N(I())}]},[p,m,g,y]);var T=i(f,v[0],v[1]);return l(function(){_.hasValue=!0,_.value=T},[T]),d(T),T},Tp}var Ax;function VR(){return Ax||(Ax=1,Cp.exports=GR()),Cp.exports}var KR=VR();function YR(e){e()}function XR(){let e=null,t=null;return{clear(){e=null,t=null},notify(){YR(()=>{let n=e;for(;n;)n.callback(),n=n.next})},get(){const n=[];let i=e;for(;i;)n.push(i),i=i.next;return n},subscribe(n){let i=!0;const s=t={callback:n,next:null,prev:t};return s.prev?s.prev.next=s:e=s,function(){!i||e===null||(i=!1,s.next?s.next.prev=s.prev:t=s.prev,s.prev?s.prev.next=s.next:e=s.next)}}}}var Dx={notify(){},get:()=>[]};function WR(e,t){let n,i=Dx,s=0,l=!1;function c(T){m();const N=i.subscribe(T);let C=!1;return()=>{C||(C=!0,N(),g())}}function d(){i.notify()}function f(){_.onStateChange&&_.onStateChange()}function p(){return l}function m(){s++,n||(n=e.subscribe(f),i=XR())}function g(){s--,n&&s===0&&(n(),n=void 0,i.clear(),i=Dx)}function y(){l||(l=!0,m())}function v(){l&&(l=!1,g())}const _={addNestedSub:c,notifyNestedSubs:d,handleChangeWrapper:f,isSubscribed:p,trySubscribe:y,tryUnsubscribe:v,getListeners:()=>i};return _}var ZR=()=>typeof window<"u"&&typeof window.document<"u"&&typeof window.document.createElement<"u",QR=ZR(),JR=()=>typeof navigator<"u"&&navigator.product==="ReactNative",eN=JR(),tN=()=>QR||eN?E.useLayoutEffect:E.useEffect,nN=tN(),Op=Symbol.for("react-redux-context"),Rp=typeof globalThis<"u"?globalThis:{};function rN(){if(!E.createContext)return{};const e=Rp[Op]??(Rp[Op]=new Map);let t=e.get(E.createContext);return t||(t=E.createContext(null),e.set(E.createContext,t)),t}var ia=rN();function iN(e){const{children:t,context:n,serverState:i,store:s}=e,l=E.useMemo(()=>{const f=WR(s);return{store:s,subscription:f,getServerState:i?()=>i:void 0}},[s,i]),c=E.useMemo(()=>s.getState(),[s]);nN(()=>{const{subscription:f}=l;return f.onStateChange=f.notifyNestedSubs,f.trySubscribe(),c!==s.getState()&&f.notifyNestedSubs(),()=>{f.tryUnsubscribe(),f.onStateChange=void 0}},[l,c]);const d=n||ia;return E.createElement(d.Provider,{value:l},t)}var aN=iN;function eb(e=ia){return function(){return E.useContext(e)}}var Ww=eb();function Zw(e=ia){const t=e===ia?Ww:eb(e),n=()=>{const{store:i}=t();return i};return Object.assign(n,{withTypes:()=>n}),n}var sN=Zw();function lN(e=ia){const t=e===ia?sN:Zw(e),n=()=>t().dispatch;return Object.assign(n,{withTypes:()=>n}),n}var Or=lN(),oN=(e,t)=>e===t;function cN(e=ia){const t=e===ia?Ww:eb(e),n=(i,s={})=>{const{equalityFn:l=oN}=typeof s=="function"?{equalityFn:s}:s,c=t(),{store:d,subscription:f,getServerState:p}=c;E.useRef(!0);const m=E.useCallback({[i.name](y){return i(y)}}[i.name],[i]),g=KR.useSyncExternalStoreWithSelector(f.addNestedSub,d.getState,p||d.getState,m,l);return E.useDebugValue(g),g};return Object.assign(n,{withTypes:()=>n}),n}var an=cN();function Tn(e){return`Minified Redux error #${e}; visit https://redux.js.org/Errors?code=${e} for the full message or use the non-minified dev environment for full errors. `}var uN=typeof Symbol=="function"&&Symbol.observable||"@@observable",kx=uN,Np=()=>Math.random().toString(36).substring(7).split("").join("."),dN={INIT:`@@redux/INIT${Np()}`,REPLACE:`@@redux/REPLACE${Np()}`,PROBE_UNKNOWN_ACTION:()=>`@@redux/PROBE_UNKNOWN_ACTION${Np()}`},bu=dN;function tb(e){if(typeof e!="object"||e===null)return!1;let t=e;for(;Object.getPrototypeOf(t)!==null;)t=Object.getPrototypeOf(t);return Object.getPrototypeOf(e)===t||Object.getPrototypeOf(e)===null}function nb(e,t,n){if(typeof e!="function")throw new Error(Tn(2));if(typeof t=="function"&&typeof n=="function"||typeof n=="function"&&typeof arguments[3]=="function")throw new Error(Tn(0));if(typeof t=="function"&&typeof n>"u"&&(n=t,t=void 0),typeof n<"u"){if(typeof n!="function")throw new Error(Tn(1));return n(nb)(e,t)}let i=e,s=t,l=new Map,c=l,d=0,f=!1;function p(){c===l&&(c=new Map,l.forEach((N,C)=>{c.set(C,N)}))}function m(){if(f)throw new Error(Tn(3));return s}function g(N){if(typeof N!="function")throw new Error(Tn(4));if(f)throw new Error(Tn(5));let C=!0;p();const P=d++;return c.set(P,N),function(){if(C){if(f)throw new Error(Tn(6));C=!1,p(),c.delete(P),l=null}}}function y(N){if(!tb(N))throw new Error(Tn(7));if(typeof N.type>"u")throw new Error(Tn(8));if(typeof N.type!="string")throw new Error(Tn(17));if(f)throw new Error(Tn(9));try{f=!0,s=i(s,N)}finally{f=!1}return(l=c).forEach(P=>{P()}),N}function v(N){if(typeof N!="function")throw new Error(Tn(10));i=N,y({type:bu.REPLACE})}function _(){const N=g;return{subscribe(C){if(typeof C!="object"||C===null)throw new Error(Tn(11));function P(){const I=C;I.next&&I.next(m())}return P(),{unsubscribe:N(P)}},[kx](){return this}}}return y({type:bu.INIT}),{dispatch:y,subscribe:g,getState:m,replaceReducer:v,[kx]:_}}function fN(e){Object.keys(e).forEach(t=>{const n=e[t];if(typeof n(void 0,{type:bu.INIT})>"u")throw new Error(Tn(12));if(typeof n(void 0,{type:bu.PROBE_UNKNOWN_ACTION()})>"u")throw new Error(Tn(13))})}function Qw(e){const t=Object.keys(e),n={};for(let l=0;l<t.length;l++){const c=t[l];typeof e[c]=="function"&&(n[c]=e[c])}const i=Object.keys(n);let s;try{fN(n)}catch(l){s=l}return function(c={},d){if(s)throw s;let f=!1;const p={};for(let m=0;m<i.length;m++){const g=i[m],y=n[g],v=c[g],_=y(v,d);if(typeof _>"u")throw d&&d.type,new Error(Tn(14));p[g]=_,f=f||_!==v}return f=f||i.length!==Object.keys(c).length,f?p:c}}function yu(...e){return e.length===0?t=>t:e.length===1?e[0]:e.reduce((t,n)=>(...i)=>t(n(...i)))}function pN(...e){return t=>(n,i)=>{const s=t(n,i);let l=()=>{throw new Error(Tn(15))};const c={getState:s.getState,dispatch:(f,...p)=>l(f,...p)},d=e.map(f=>f(c));return l=yu(...d)(s.dispatch),{...s,dispatch:l}}}function hN(e){return tb(e)&&"type"in e&&typeof e.type=="string"}var Jw=Symbol.for("immer-nothing"),Mx=Symbol.for("immer-draftable"),fr=Symbol.for("immer-state");function Ir(e,...t){throw new Error(`[Immer] minified error nr: ${e}. Full error at: https://bit.ly/3cXEKWf`)}var Ps=Object.getPrototypeOf;function Ia(e){return!!e&&!!e[fr]}function wi(e){var t;return e?eE(e)||Array.isArray(e)||!!e[Mx]||!!((t=e.constructor)!=null&&t[Mx])||Wu(e)||Zu(e):!1}var mN=Object.prototype.constructor.toString();function eE(e){if(!e||typeof e!="object")return!1;const t=Ps(e);if(t===null)return!0;const n=Object.hasOwnProperty.call(t,"constructor")&&t.constructor;return n===Object?!0:typeof n=="function"&&Function.toString.call(n)===mN}function vu(e,t){Xu(e)===0?Reflect.ownKeys(e).forEach(n=>{t(n,e[n],e)}):e.forEach((n,i)=>t(i,n,e))}function Xu(e){const t=e[fr];return t?t.type_:Array.isArray(e)?1:Wu(e)?2:Zu(e)?3:0}function hh(e,t){return Xu(e)===2?e.has(t):Object.prototype.hasOwnProperty.call(e,t)}function tE(e,t,n){const i=Xu(e);i===2?e.set(t,n):i===3?e.add(n):e[t]=n}function gN(e,t){return e===t?e!==0||1/e===1/t:e!==e&&t!==t}function Wu(e){return e instanceof Map}function Zu(e){return e instanceof Set}function ka(e){return e.copy_||e.base_}function mh(e,t){if(Wu(e))return new Map(e);if(Zu(e))return new Set(e);if(Array.isArray(e))return Array.prototype.slice.call(e);const n=eE(e);if(t===!0||t==="class_only"&&!n){const i=Object.getOwnPropertyDescriptors(e);delete i[fr];let s=Reflect.ownKeys(i);for(let l=0;l<s.length;l++){const c=s[l],d=i[c];d.writable===!1&&(d.writable=!0,d.configurable=!0),(d.get||d.set)&&(i[c]={configurable:!0,writable:!0,enumerable:d.enumerable,value:e[c]})}return Object.create(Ps(e),i)}else{const i=Ps(e);if(i!==null&&n)return{...e};const s=Object.create(i);return Object.assign(s,e)}}function rb(e,t=!1){return Qu(e)||Ia(e)||!wi(e)||(Xu(e)>1&&(e.set=e.add=e.clear=e.delete=bN),Object.freeze(e),t&&Object.entries(e).forEach(([n,i])=>rb(i,!0))),e}function bN(){Ir(2)}function Qu(e){return Object.isFrozen(e)}var yN={};function La(e){const t=yN[e];return t||Ir(0,e),t}var uo;function nE(){return uo}function vN(e,t){return{drafts_:[],parent_:e,immer_:t,canAutoFreeze_:!0,unfinalizedDrafts_:0}}function Px(e,t){t&&(La("Patches"),e.patches_=[],e.inversePatches_=[],e.patchListener_=t)}function gh(e){bh(e),e.drafts_.forEach(_N),e.drafts_=null}function bh(e){e===uo&&(uo=e.parent_)}function Ix(e){return uo=vN(uo,e)}function _N(e){const t=e[fr];t.type_===0||t.type_===1?t.revoke_():t.revoked_=!0}function Lx(e,t){t.unfinalizedDrafts_=t.drafts_.length;const n=t.drafts_[0];return e!==void 0&&e!==n?(n[fr].modified_&&(gh(t),Ir(4)),wi(e)&&(e=_u(t,e),t.parent_||xu(t,e)),t.patches_&&La("Patches").generateReplacementPatches_(n[fr].base_,e,t.patches_,t.inversePatches_)):e=_u(t,n,[]),gh(t),t.patches_&&t.patchListener_(t.patches_,t.inversePatches_),e!==Jw?e:void 0}function _u(e,t,n){if(Qu(t))return t;const i=t[fr];if(!i)return vu(t,(s,l)=>jx(e,i,t,s,l,n)),t;if(i.scope_!==e)return t;if(!i.modified_)return xu(e,i.base_,!0),i.base_;if(!i.finalized_){i.finalized_=!0,i.scope_.unfinalizedDrafts_--;const s=i.copy_;let l=s,c=!1;i.type_===3&&(l=new Set(s),s.clear(),c=!0),vu(l,(d,f)=>jx(e,i,s,d,f,n,c)),xu(e,s,!1),n&&e.patches_&&La("Patches").generatePatches_(i,n,e.patches_,e.inversePatches_)}return i.copy_}function jx(e,t,n,i,s,l,c){if(Ia(s)){const d=l&&t&&t.type_!==3&&!hh(t.assigned_,i)?l.concat(i):void 0,f=_u(e,s,d);if(tE(n,i,f),Ia(f))e.canAutoFreeze_=!1;else return}else c&&n.add(s);if(wi(s)&&!Qu(s)){if(!e.immer_.autoFreeze_&&e.unfinalizedDrafts_<1)return;_u(e,s),(!t||!t.scope_.parent_)&&typeof i!="symbol"&&Object.prototype.propertyIsEnumerable.call(n,i)&&xu(e,s)}}function xu(e,t,n=!1){!e.parent_&&e.immer_.autoFreeze_&&e.canAutoFreeze_&&rb(t,n)}function xN(e,t){const n=Array.isArray(e),i={type_:n?1:0,scope_:t?t.scope_:nE(),modified_:!1,finalized_:!1,assigned_:{},parent_:t,base_:e,draft_:null,copy_:null,revoke_:null,isManual_:!1};let s=i,l=ib;n&&(s=[i],l=fo);const{revoke:c,proxy:d}=Proxy.revocable(s,l);return i.draft_=d,i.revoke_=c,d}var ib={get(e,t){if(t===fr)return e;const n=ka(e);if(!hh(n,t))return wN(e,n,t);const i=n[t];return e.finalized_||!wi(i)?i:i===Ap(e.base_,t)?(Dp(e),e.copy_[t]=vh(i,e)):i},has(e,t){return t in ka(e)},ownKeys(e){return Reflect.ownKeys(ka(e))},set(e,t,n){const i=rE(ka(e),t);if(i!=null&&i.set)return i.set.call(e.draft_,n),!0;if(!e.modified_){const s=Ap(ka(e),t),l=s==null?void 0:s[fr];if(l&&l.base_===n)return e.copy_[t]=n,e.assigned_[t]=!1,!0;if(gN(n,s)&&(n!==void 0||hh(e.base_,t)))return!0;Dp(e),yh(e)}return e.copy_[t]===n&&(n!==void 0||t in e.copy_)||Number.isNaN(n)&&Number.isNaN(e.copy_[t])||(e.copy_[t]=n,e.assigned_[t]=!0),!0},deleteProperty(e,t){return Ap(e.base_,t)!==void 0||t in e.base_?(e.assigned_[t]=!1,Dp(e),yh(e)):delete e.assigned_[t],e.copy_&&delete e.copy_[t],!0},getOwnPropertyDescriptor(e,t){const n=ka(e),i=Reflect.getOwnPropertyDescriptor(n,t);return i&&{writable:!0,configurable:e.type_!==1||t!=="length",enumerable:i.enumerable,value:n[t]}},defineProperty(){Ir(11)},getPrototypeOf(e){return Ps(e.base_)},setPrototypeOf(){Ir(12)}},fo={};vu(ib,(e,t)=>{fo[e]=function(){return arguments[0]=arguments[0][0],t.apply(this,arguments)}});fo.deleteProperty=function(e,t){return fo.set.call(this,e,t,void 0)};fo.set=function(e,t,n){return ib.set.call(this,e[0],t,n,e[0])};function Ap(e,t){const n=e[fr];return(n?ka(n):e)[t]}function wN(e,t,n){var s;const i=rE(t,n);return i?"value"in i?i.value:(s=i.get)==null?void 0:s.call(e.draft_):void 0}function rE(e,t){if(!(t in e))return;let n=Ps(e);for(;n;){const i=Object.getOwnPropertyDescriptor(n,t);if(i)return i;n=Ps(n)}}function yh(e){e.modified_||(e.modified_=!0,e.parent_&&yh(e.parent_))}function Dp(e){e.copy_||(e.copy_=mh(e.base_,e.scope_.immer_.useStrictShallowCopy_))}var EN=class{constructor(e){this.autoFreeze_=!0,this.useStrictShallowCopy_=!1,this.produce=(t,n,i)=>{if(typeof t=="function"&&typeof n!="function"){const l=n;n=t;const c=this;return function(f=l,...p){return c.produce(f,m=>n.call(this,m,...p))}}typeof n!="function"&&Ir(6),i!==void 0&&typeof i!="function"&&Ir(7);let s;if(wi(t)){const l=Ix(this),c=vh(t,void 0);let d=!0;try{s=n(c),d=!1}finally{d?gh(l):bh(l)}return Px(l,i),Lx(s,l)}else if(!t||typeof t!="object"){if(s=n(t),s===void 0&&(s=t),s===Jw&&(s=void 0),this.autoFreeze_&&rb(s,!0),i){const l=[],c=[];La("Patches").generateReplacementPatches_(t,s,l,c),i(l,c)}return s}else Ir(1,t)},this.produceWithPatches=(t,n)=>{if(typeof t=="function")return(c,...d)=>this.produceWithPatches(c,f=>t(f,...d));let i,s;return[this.produce(t,n,(c,d)=>{i=c,s=d}),i,s]},typeof(e==null?void 0:e.autoFreeze)=="boolean"&&this.setAutoFreeze(e.autoFreeze),typeof(e==null?void 0:e.useStrictShallowCopy)=="boolean"&&this.setUseStrictShallowCopy(e.useStrictShallowCopy)}createDraft(e){wi(e)||Ir(8),Ia(e)&&(e=SN(e));const t=Ix(this),n=vh(e,void 0);return n[fr].isManual_=!0,bh(t),n}finishDraft(e,t){const n=e&&e[fr];(!n||!n.isManual_)&&Ir(9);const{scope_:i}=n;return Px(i,t),Lx(void 0,i)}setAutoFreeze(e){this.autoFreeze_=e}setUseStrictShallowCopy(e){this.useStrictShallowCopy_=e}applyPatches(e,t){let n;for(n=t.length-1;n>=0;n--){const s=t[n];if(s.path.length===0&&s.op==="replace"){e=s.value;break}}n>-1&&(t=t.slice(n+1));const i=La("Patches").applyPatches_;return Ia(e)?i(e,t):this.produce(e,s=>i(s,t))}};function vh(e,t){const n=Wu(e)?La("MapSet").proxyMap_(e,t):Zu(e)?La("MapSet").proxySet_(e,t):xN(e,t);return(t?t.scope_:nE()).drafts_.push(n),n}function SN(e){return Ia(e)||Ir(10,e),iE(e)}function iE(e){if(!wi(e)||Qu(e))return e;const t=e[fr];let n;if(t){if(!t.modified_)return t.base_;t.finalized_=!0,n=mh(e,t.scope_.immer_.useStrictShallowCopy_)}else n=mh(e,!0);return vu(n,(i,s)=>{tE(n,i,iE(s))}),t&&(t.finalized_=!1),n}var pr=new EN,aE=pr.produce;pr.produceWithPatches.bind(pr);pr.setAutoFreeze.bind(pr);pr.setUseStrictShallowCopy.bind(pr);pr.applyPatches.bind(pr);pr.createDraft.bind(pr);pr.finishDraft.bind(pr);function CN(e,t=`expected a function, instead received ${typeof e}`){if(typeof e!="function")throw new TypeError(t)}function TN(e,t=`expected an object, instead received ${typeof e}`){if(typeof e!="object")throw new TypeError(t)}function ON(e,t="expected all items to be functions, instead received the following types: "){if(!e.every(n=>typeof n=="function")){const n=e.map(i=>typeof i=="function"?`function ${i.name||"unnamed"}()`:typeof i).join(", ");throw new TypeError(`${t}[${n}]`)}}var $x=e=>Array.isArray(e)?e:[e];function RN(e){const t=Array.isArray(e[0])?e[0]:e;return ON(t,"createSelector expects all input-selectors to be functions, but received the following types: "),t}function NN(e,t){const n=[],{length:i}=e;for(let s=0;s<i;s++)n.push(e[s].apply(null,t));return n}var AN=class{constructor(e){this.value=e}deref(){return this.value}},DN=typeof WeakRef<"u"?WeakRef:AN,kN=0,zx=1;function Fc(){return{s:kN,v:void 0,o:null,p:null}}function sE(e,t={}){let n=Fc();const{resultEqualityCheck:i}=t;let s,l=0;function c(){var g;let d=n;const{length:f}=arguments;for(let y=0,v=f;y<v;y++){const _=arguments[y];if(typeof _=="function"||typeof _=="object"&&_!==null){let T=d.o;T===null&&(d.o=T=new WeakMap);const N=T.get(_);N===void 0?(d=Fc(),T.set(_,d)):d=N}else{let T=d.p;T===null&&(d.p=T=new Map);const N=T.get(_);N===void 0?(d=Fc(),T.set(_,d)):d=N}}const p=d;let m;if(d.s===zx)m=d.v;else if(m=e.apply(null,arguments),l++,i){const y=((g=s==null?void 0:s.deref)==null?void 0:g.call(s))??s;y!=null&&i(y,m)&&(m=y,l!==0&&l--),s=typeof m=="object"&&m!==null||typeof m=="function"?new DN(m):m}return p.s=zx,p.v=m,m}return c.clearCache=()=>{n=Fc(),c.resetResultsCount()},c.resultsCount=()=>l,c.resetResultsCount=()=>{l=0},c}function MN(e,...t){const n=typeof e=="function"?{memoize:e,memoizeOptions:t}:e,i=(...s)=>{let l=0,c=0,d,f={},p=s.pop();typeof p=="object"&&(f=p,p=s.pop()),CN(p,`createSelector expects an output function after the inputs, but received: [${typeof p}]`);const m={...n,...f},{memoize:g,memoizeOptions:y=[],argsMemoize:v=sE,argsMemoizeOptions:_=[]}=m,T=$x(y),N=$x(_),C=RN(s),P=g(function(){return l++,p.apply(null,arguments)},...T),k=v(function(){c++;const D=NN(C,arguments);return d=P.apply(null,D),d},...N);return Object.assign(k,{resultFunc:p,memoizedResultFunc:P,dependencies:C,dependencyRecomputations:()=>c,resetDependencyRecomputations:()=>{c=0},lastResult:()=>d,recomputations:()=>l,resetRecomputations:()=>{l=0},memoize:g,argsMemoize:v})};return Object.assign(i,{withTypes:()=>i}),i}var _o=MN(sE),PN=Object.assign((e,t=_o)=>{TN(e,`createStructuredSelector expects first argument to be an object where each property is a selector, instead received a ${typeof e}`);const n=Object.keys(e),i=n.map(l=>e[l]);return t(i,(...l)=>l.reduce((c,d,f)=>(c[n[f]]=d,c),{}))},{withTypes:()=>PN});function lE(e){return({dispatch:n,getState:i})=>s=>l=>typeof l=="function"?l(n,i,e):s(l)}var IN=lE(),LN=lE,jN=typeof window<"u"&&window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__?window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__:function(){if(arguments.length!==0)return typeof arguments[0]=="object"?yu:yu.apply(null,arguments)};function Bx(e,t){function n(...i){if(t){let s=t(...i);if(!s)throw new Error(_i(0));return{type:e,payload:s.payload,..."meta"in s&&{meta:s.meta},..."error"in s&&{error:s.error}}}return{type:e,payload:i[0]}}return n.toString=()=>`${e}`,n.type=e,n.match=i=>hN(i)&&i.type===e,n}var oE=class Ql extends Array{constructor(...t){super(...t),Object.setPrototypeOf(this,Ql.prototype)}static get[Symbol.species](){return Ql}concat(...t){return super.concat.apply(this,t)}prepend(...t){return t.length===1&&Array.isArray(t[0])?new Ql(...t[0].concat(this)):new Ql(...t.concat(this))}};function Fx(e){return wi(e)?aE(e,()=>{}):e}function Uc(e,t,n){return e.has(t)?e.get(t):e.set(t,n(t)).get(t)}function $N(e){return typeof e=="boolean"}var zN=()=>function(t){const{thunk:n=!0,immutableCheck:i=!0,serializableCheck:s=!0,actionCreatorCheck:l=!0}=t??{};let c=new oE;return n&&($N(n)?c.push(IN):c.push(LN(n.extraArgument))),c},BN="RTK_autoBatch",Ux=e=>t=>{setTimeout(t,e)},FN=(e={type:"raf"})=>t=>(...n)=>{const i=t(...n);let s=!0,l=!1,c=!1;const d=new Set,f=e.type==="tick"?queueMicrotask:e.type==="raf"?typeof window<"u"&&window.requestAnimationFrame?window.requestAnimationFrame:Ux(10):e.type==="callback"?e.queueNotification:Ux(e.timeout),p=()=>{c=!1,l&&(l=!1,d.forEach(m=>m()))};return Object.assign({},i,{subscribe(m){const g=()=>s&&m(),y=i.subscribe(g);return d.add(m),()=>{y(),d.delete(m)}},dispatch(m){var g;try{return s=!((g=m==null?void 0:m.meta)!=null&&g[BN]),l=!s,l&&(c||(c=!0,f(p))),i.dispatch(m)}finally{s=!0}}})},UN=e=>function(n){const{autoBatch:i=!0}=n??{};let s=new oE(e);return i&&s.push(FN(typeof i=="object"?i:void 0)),s};function HN(e){const t=zN(),{reducer:n=void 0,middleware:i,devTools:s=!0,preloadedState:l=void 0,enhancers:c=void 0}=e||{};let d;if(typeof n=="function")d=n;else if(tb(n))d=Qw(n);else throw new Error(_i(1));let f;typeof i=="function"?f=i(t):f=t();let p=yu;s&&(p=jN({trace:!1,...typeof s=="object"&&s}));const m=pN(...f),g=UN(m);let y=typeof c=="function"?c(g):g();const v=p(...y);return nb(d,l,v)}function cE(e){const t={},n=[];let i;const s={addCase(l,c){const d=typeof l=="string"?l:l.type;if(!d)throw new Error(_i(28));if(d in t)throw new Error(_i(29));return t[d]=c,s},addMatcher(l,c){return n.push({matcher:l,reducer:c}),s},addDefaultCase(l){return i=l,s}};return e(s),[t,n,i]}function qN(e){return typeof e=="function"}function GN(e,t){let[n,i,s]=cE(t),l;if(qN(e))l=()=>Fx(e());else{const d=Fx(e);l=()=>d}function c(d=l(),f){let p=[n[f.type],...i.filter(({matcher:m})=>m(f)).map(({reducer:m})=>m)];return p.filter(m=>!!m).length===0&&(p=[s]),p.reduce((m,g)=>{if(g)if(Ia(m)){const v=g(m,f);return v===void 0?m:v}else{if(wi(m))return aE(m,y=>g(y,f));{const y=g(m,f);if(y===void 0){if(m===null)return m;throw Error("A case reducer on a non-draftable value must not return undefined")}return y}}return m},d)}return c.getInitialState=l,c}var VN=Symbol.for("rtk-slice-createasyncthunk");function KN(e,t){return`${e}/${t}`}function YN({creators:e}={}){var n;const t=(n=e==null?void 0:e.asyncThunk)==null?void 0:n[VN];return function(s){const{name:l,reducerPath:c=l}=s;if(!l)throw new Error(_i(11));const d=(typeof s.reducers=="function"?s.reducers(WN()):s.reducers)||{},f=Object.keys(d),p={sliceCaseReducersByName:{},sliceCaseReducersByType:{},actionCreators:{},sliceMatchers:[]},m={addCase(I,D){const M=typeof I=="string"?I:I.type;if(!M)throw new Error(_i(12));if(M in p.sliceCaseReducersByType)throw new Error(_i(13));return p.sliceCaseReducersByType[M]=D,m},addMatcher(I,D){return p.sliceMatchers.push({matcher:I,reducer:D}),m},exposeAction(I,D){return p.actionCreators[I]=D,m},exposeCaseReducer(I,D){return p.sliceCaseReducersByName[I]=D,m}};f.forEach(I=>{const D=d[I],M={reducerName:I,type:KN(l,I),createNotation:typeof s.reducers=="function"};QN(D)?eA(M,D,m,t):ZN(M,D,m)});function g(){const[I={},D=[],M=void 0]=typeof s.extraReducers=="function"?cE(s.extraReducers):[s.extraReducers],z={...I,...p.sliceCaseReducersByType};return GN(s.initialState,Z=>{for(let W in z)Z.addCase(W,z[W]);for(let W of p.sliceMatchers)Z.addMatcher(W.matcher,W.reducer);for(let W of D)Z.addMatcher(W.matcher,W.reducer);M&&Z.addDefaultCase(M)})}const y=I=>I,v=new Map,_=new WeakMap;let T;function N(I,D){return T||(T=g()),T(I,D)}function C(){return T||(T=g()),T.getInitialState()}function P(I,D=!1){function M(Z){let W=Z[I];return typeof W>"u"&&D&&(W=Uc(_,M,C)),W}function z(Z=y){const W=Uc(v,D,()=>new WeakMap);return Uc(W,Z,()=>{const $={};for(const[re,se]of Object.entries(s.selectors??{}))$[re]=XN(se,Z,()=>Uc(_,Z,C),D);return $})}return{reducerPath:I,getSelectors:z,get selectors(){return z(M)},selectSlice:M}}const k={name:l,reducer:N,actions:p.actionCreators,caseReducers:p.sliceCaseReducersByName,getInitialState:C,...P(c),injectInto(I,{reducerPath:D,...M}={}){const z=D??c;return I.inject({reducerPath:z,reducer:N},M),{...k,...P(z,!0)}}};return k}}function XN(e,t,n,i){function s(l,...c){let d=t(l);return typeof d>"u"&&i&&(d=n()),e(d,...c)}return s.unwrapped=e,s}var Ba=YN();function WN(){function e(t,n){return{_reducerDefinitionType:"asyncThunk",payloadCreator:t,...n}}return e.withTypes=()=>e,{reducer(t){return Object.assign({[t.name](...n){return t(...n)}}[t.name],{_reducerDefinitionType:"reducer"})},preparedReducer(t,n){return{_reducerDefinitionType:"reducerWithPrepare",prepare:t,reducer:n}},asyncThunk:e}}function ZN({type:e,reducerName:t,createNotation:n},i,s){let l,c;if("reducer"in i){if(n&&!JN(i))throw new Error(_i(17));l=i.reducer,c=i.prepare}else l=i;s.addCase(e,l).exposeCaseReducer(t,l).exposeAction(t,c?Bx(e,c):Bx(e))}function QN(e){return e._reducerDefinitionType==="asyncThunk"}function JN(e){return e._reducerDefinitionType==="reducerWithPrepare"}function eA({type:e,reducerName:t},n,i,s){if(!s)throw new Error(_i(18));const{payloadCreator:l,fulfilled:c,pending:d,rejected:f,settled:p,options:m}=n,g=s(e,l,m);i.exposeAction(t,g),c&&i.addCase(g.fulfilled,c),d&&i.addCase(g.pending,d),f&&i.addCase(g.rejected,f),p&&i.addMatcher(g.settled,p),i.exposeCaseReducer(t,{fulfilled:c||Hc,pending:d||Hc,rejected:f||Hc,settled:p||Hc})}function Hc(){}function _i(e){return`Minified Redux Toolkit error #${e}; visit https://redux-toolkit.js.org/Errors?code=${e} for the full message or use the non-minified dev environment for full errors. `}const tA={items:[]},uE=Ba({name:"projects",initialState:tA,reducers:{addProject:(e,t)=>{e.items.push(t.payload)},removeProject:(e,t)=>{e.items=e.items.filter(n=>n.id!==t.payload)},addPackageToProject:(e,t)=>{const n=e.items.find(i=>i.id===t.payload.projectId);n&&(n.packageIds||(n.packageIds=["softcore","softgfx"]),n.packageIds.includes(t.payload.packageId)||n.packageIds.push(t.payload.packageId))},removePackageFromProject:(e,t)=>{const n=e.items.find(i=>i.id===t.payload.projectId);n&&(n.packageIds||(n.packageIds=["softcore","softgfx"]),n.packageIds=n.packageIds.filter(i=>i!==t.payload.packageId))},renameProject:(e,t)=>{const n=e.items.find(i=>i.id===t.payload.projectId);n&&(n.name=t.payload.name)}}}),{addProject:dE,removeProject:nA,addPackageToProject:rA,removePackageFromProject:iA,renameProject:aA}=uE.actions,sA=uE.reducer;function fE(e,t,n){const i=[...e],[s]=i.splice(t,1);return i.splice(n,0,s),i}const lA={byId:{},dirtyFileIds:[],fileOrder:{}};function xs(e,t){return`${e}:${t??"root"}`}const pE=Ba({name:"files",initialState:lA,reducers:{addFile:(e,t)=>{const n={folderId:null,fullName:t.payload.name,...t.payload};e.byId[n.id]=n;const i=xs(n.projectId,n.folderId??null);e.fileOrder[i]||(e.fileOrder[i]=[]),e.fileOrder[i].push(n.id)},updateFile:(e,t)=>{e.byId[t.payload.id]=t.payload,e.dirtyFileIds=[...e.dirtyFileIds.filter(n=>n!==t.payload.id),t.payload.id]},removeFile:(e,t)=>{const n=e.byId[t.payload];if(n){const i=xs(n.projectId,n.folderId??null),s=e.fileOrder[i];s&&(e.fileOrder[i]=s.filter(l=>l!==t.payload))}delete e.byId[t.payload],e.dirtyFileIds=e.dirtyFileIds.filter(i=>i!==t.payload)},clearAllDirty:e=>{e.dirtyFileIds=[]},reorderFiles:(e,t)=>{const{orderKey:n,fromIndex:i,toIndex:s}=t.payload,l=e.fileOrder[n];l&&(e.fileOrder[n]=fE(l,i,s))},setFileFolder:(e,t)=>{const{fileId:n,folderId:i,fullName:s}=t.payload,l=e.byId[n];if(!l)return;const c=xs(l.projectId,l.folderId??null);e.fileOrder[c]&&(e.fileOrder[c]=e.fileOrder[c].filter(f=>f!==n));const d=xs(l.projectId,i??null);e.fileOrder[d]||(e.fileOrder[d]=[]),e.fileOrder[d].push(n),l.folderId=i,l.fullName=s},batchSetFileFolder:(e,t)=>{t.payload.forEach(({id:n,folderId:i,fullName:s})=>{const l=e.byId[n];if(!l)return;const c=xs(l.projectId,l.folderId??null);e.fileOrder[c]&&(e.fileOrder[c]=e.fileOrder[c].filter(f=>f!==n));const d=xs(l.projectId,i??null);e.fileOrder[d]||(e.fileOrder[d]=[]),e.fileOrder[d].push(n),l.folderId=i,l.fullName=s})},batchSetFileFullNames:(e,t)=>{t.payload.forEach(({id:n,fullName:i})=>{const s=e.byId[n];s&&(s.fullName=i)})}}}),{addFile:wu,updateFile:oA,removeFile:hE,clearAllDirty:cA,reorderFiles:uA,setFileFolder:dA,batchSetFileFolder:fA,batchSetFileFullNames:mE}=pE.actions,pA=pE.reducer,hA={byId:{},assetOrder:{}};function ws(e,t){return`${e}:${t??"root"}`}const gE=Ba({name:"assets",initialState:hA,reducers:{addAsset:(e,t)=>{const n={folderId:null,fullName:t.payload.name,...t.payload};e.byId[n.id]=n;const i=ws(n.projectId,n.folderId??null);e.assetOrder[i]||(e.assetOrder[i]=[]),e.assetOrder[i].push(n.id)},updateAsset:(e,t)=>{e.byId[t.payload.id]=t.payload},removeAsset:(e,t)=>{const n=e.byId[t.payload];if(n){const i=ws(n.projectId,n.folderId??null),s=e.assetOrder[i];s&&(e.assetOrder[i]=s.filter(l=>l!==t.payload))}delete e.byId[t.payload]},setAssetFolder:(e,t)=>{const{assetId:n,folderId:i,fullName:s}=t.payload,l=e.byId[n];if(!l)return;const c=ws(l.projectId,l.folderId??null);e.assetOrder[c]&&(e.assetOrder[c]=e.assetOrder[c].filter(f=>f!==n));const d=ws(l.projectId,i??null);e.assetOrder[d]||(e.assetOrder[d]=[]),e.assetOrder[d].push(n),l.folderId=i,l.fullName=s},batchSetAssetFolder:(e,t)=>{t.payload.forEach(({id:n,folderId:i,fullName:s})=>{const l=e.byId[n];if(!l)return;const c=ws(l.projectId,l.folderId??null);e.assetOrder[c]&&(e.assetOrder[c]=e.assetOrder[c].filter(f=>f!==n));const d=ws(l.projectId,i??null);e.assetOrder[d]||(e.assetOrder[d]=[]),e.assetOrder[d].push(n),l.folderId=i,l.fullName=s})},batchSetAssetFullNames:(e,t)=>{t.payload.forEach(({id:n,fullName:i})=>{const s=e.byId[n];s&&(s.fullName=i)})},reorderAssets:(e,t)=>{const{orderKey:n,fromIndex:i,toIndex:s}=t.payload,l=e.assetOrder[n];l&&(e.assetOrder[n]=fE(l,i,s))}}}),{addAsset:Eu,updateAsset:mA,removeAsset:bE,setAssetFolder:gA,batchSetAssetFolder:bA,batchSetAssetFullNames:yE,reorderAssets:yA}=gE.actions,vA=gE.reducer,_A={items:[]},vE=Ba({name:"folders",initialState:_A,reducers:{addFolder:(e,t)=>{e.items.push(t.payload)},removeFolder:(e,t)=>{const n=t.payload,i=e.items.find(s=>s.id===n);i&&(e.items.forEach(s=>{s.parentId===n&&(s.parentId=i.parentId)}),e.items=e.items.filter(s=>s.id!==n))},renameFolder:(e,t)=>{const n=e.items.find(i=>i.id===t.payload.folderId);n&&(n.name=t.payload.name)},moveFolder:(e,t)=>{const n=e.items.find(i=>i.id===t.payload.folderId);n&&(n.parentId=t.payload.parentId)}}}),{addFolder:ab,removeFolder:_E,renameFolder:xA,moveFolder:k7}=vE.actions,wA=vE.reducer,EA={byId:{}},xE=Ba({name:"packages",initialState:EA,reducers:{seedPackages:(e,t)=>{t.payload.forEach(n=>{const i=e.byId[n.id];(!i||i.version!==n.version)&&(e.byId[n.id]=n)})}}}),{seedPackages:SA}=xE.actions,CA=xE.reducer,TA={selectedFileByProject:{}},wE=Ba({name:"ui",initialState:TA,reducers:{selectFile:(e,t)=>{const{projectId:n,fileId:i}=t.payload;e.selectedFileByProject[n]=i},clearProjectSelection:(e,t)=>{delete e.selectedFileByProject[t.payload]}}}),{selectFile:Su,clearProjectSelection:EE}=wE.actions,OA=wE.reducer,RA={logs:[],transpiled:"",isRunning:!1},SE=Ba({name:"session",initialState:RA,reducers:{addLog:(e,t)=>{e.logs.push(t.payload)},clearLogs:e=>{e.logs=[]},setTranspiled:(e,t)=>{e.transpiled=t.payload},setIsRunning:(e,t)=>{e.isRunning=t.payload}}}),{addLog:to,clearLogs:Hx,setTranspiled:kp,setIsRunning:Mp}=SE.actions,NA=SE.reducer;var sb="persist:",lb="persist/FLUSH",Ju="persist/REHYDRATE",ob="persist/PAUSE",cb="persist/PERSIST",ub="persist/PURGE",db="persist/REGISTER",AA=-1;function cu(e){return typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?cu=function(n){return typeof n}:cu=function(n){return n&&typeof Symbol=="function"&&n.constructor===Symbol&&n!==Symbol.prototype?"symbol":typeof n},cu(e)}function qx(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);t&&(i=i.filter(function(s){return Object.getOwnPropertyDescriptor(e,s).enumerable})),n.push.apply(n,i)}return n}function DA(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]!=null?arguments[t]:{};t%2?qx(n,!0).forEach(function(i){kA(e,i,n[i])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):qx(n).forEach(function(i){Object.defineProperty(e,i,Object.getOwnPropertyDescriptor(n,i))})}return e}function kA(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function MA(e,t,n,i){i.debug;var s=DA({},n);return e&&cu(e)==="object"&&Object.keys(e).forEach(function(l){l!=="_persist"&&t[l]===n[l]&&(s[l]=e[l])}),s}function PA(e){var t=e.blacklist||null,n=e.whitelist||null,i=e.transforms||[],s=e.throttle||0,l="".concat(e.keyPrefix!==void 0?e.keyPrefix:sb).concat(e.key),c=e.storage,d;e.serialize===!1?d=function(D){return D}:typeof e.serialize=="function"?d=e.serialize:d=IA;var f=e.writeFailHandler||null,p={},m={},g=[],y=null,v=null,_=function(D){Object.keys(D).forEach(function(M){C(M)&&p[M]!==D[M]&&g.indexOf(M)===-1&&g.push(M)}),Object.keys(p).forEach(function(M){D[M]===void 0&&C(M)&&g.indexOf(M)===-1&&p[M]!==void 0&&g.push(M)}),y===null&&(y=setInterval(T,s)),p=D};function T(){if(g.length===0){y&&clearInterval(y),y=null;return}var I=g.shift(),D=i.reduce(function(M,z){return z.in(M,I,p)},p[I]);if(D!==void 0)try{m[I]=d(D)}catch(M){console.error("redux-persist/createPersistoid: error serializing state",M)}else delete m[I];g.length===0&&N()}function N(){Object.keys(m).forEach(function(I){p[I]===void 0&&delete m[I]}),v=c.setItem(l,d(m)).catch(P)}function C(I){return!(n&&n.indexOf(I)===-1&&I!=="_persist"||t&&t.indexOf(I)!==-1)}function P(I){f&&f(I)}var k=function(){for(;g.length!==0;)T();return v||Promise.resolve()};return{update:_,flush:k}}function IA(e){return JSON.stringify(e)}function LA(e){var t=e.transforms||[],n="".concat(e.keyPrefix!==void 0?e.keyPrefix:sb).concat(e.key),i=e.storage;e.debug;var s;return e.deserialize===!1?s=function(c){return c}:typeof e.deserialize=="function"?s=e.deserialize:s=jA,i.getItem(n).then(function(l){if(l)try{var c={},d=s(l);return Object.keys(d).forEach(function(f){c[f]=t.reduceRight(function(p,m){return m.out(p,f,d)},s(d[f]))}),c}catch(f){throw f}else return})}function jA(e){return JSON.parse(e)}function $A(e){var t=e.storage,n="".concat(e.keyPrefix!==void 0?e.keyPrefix:sb).concat(e.key);return t.removeItem(n,zA)}function zA(e){}function Gx(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);t&&(i=i.filter(function(s){return Object.getOwnPropertyDescriptor(e,s).enumerable})),n.push.apply(n,i)}return n}function bi(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]!=null?arguments[t]:{};t%2?Gx(n,!0).forEach(function(i){BA(e,i,n[i])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):Gx(n).forEach(function(i){Object.defineProperty(e,i,Object.getOwnPropertyDescriptor(n,i))})}return e}function BA(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function FA(e,t){if(e==null)return{};var n=UA(e,t),i,s;if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(s=0;s<l.length;s++)i=l[s],!(t.indexOf(i)>=0)&&Object.prototype.propertyIsEnumerable.call(e,i)&&(n[i]=e[i])}return n}function UA(e,t){if(e==null)return{};var n={},i=Object.keys(e),s,l;for(l=0;l<i.length;l++)s=i[l],!(t.indexOf(s)>=0)&&(n[s]=e[s]);return n}var HA=5e3;function qA(e,t){var n=e.version!==void 0?e.version:AA;e.debug;var i=e.stateReconciler===void 0?MA:e.stateReconciler,s=e.getStoredState||LA,l=e.timeout!==void 0?e.timeout:HA,c=null,d=!1,f=!0,p=function(g){return g._persist.rehydrated&&c&&!f&&c.update(g),g};return function(m,g){var y=m||{},v=y._persist,_=FA(y,["_persist"]),T=_;if(g.type===cb){var N=!1,C=function(Z,W){N||(g.rehydrate(e.key,Z,W),N=!0)};if(l&&setTimeout(function(){!N&&C(void 0,new Error('redux-persist: persist timed out for persist key "'.concat(e.key,'"')))},l),f=!1,c||(c=PA(e)),v)return bi({},t(T,g),{_persist:v});if(typeof g.rehydrate!="function"||typeof g.register!="function")throw new Error("redux-persist: either rehydrate or register is not a function on the PERSIST action. This can happen if the action is being replayed. This is an unexplored use case, please open an issue and we will figure out a resolution.");return g.register(e.key),s(e).then(function(z){var Z=e.migrate||function(W,$){return Promise.resolve(W)};Z(z,n).then(function(W){C(W)},function(W){C(void 0,W)})},function(z){C(void 0,z)}),bi({},t(T,g),{_persist:{version:n,rehydrated:!1}})}else{if(g.type===ub)return d=!0,g.result($A(e)),bi({},t(T,g),{_persist:v});if(g.type===lb)return g.result(c&&c.flush()),bi({},t(T,g),{_persist:v});if(g.type===ob)f=!0;else if(g.type===Ju){if(d)return bi({},T,{_persist:bi({},v,{rehydrated:!0})});if(g.key===e.key){var P=t(T,g),k=g.payload,I=i!==!1&&k!==void 0?i(k,m,P,e):P,D=bi({},I,{_persist:bi({},v,{rehydrated:!0})});return p(D)}}}if(!v)return t(m,g);var M=t(T,g);return M===T?m:p(bi({},M,{_persist:v}))}}function Vx(e){return KA(e)||VA(e)||GA()}function GA(){throw new TypeError("Invalid attempt to spread non-iterable instance")}function VA(e){if(Symbol.iterator in Object(e)||Object.prototype.toString.call(e)==="[object Arguments]")return Array.from(e)}function KA(e){if(Array.isArray(e)){for(var t=0,n=new Array(e.length);t<e.length;t++)n[t]=e[t];return n}}function Kx(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);t&&(i=i.filter(function(s){return Object.getOwnPropertyDescriptor(e,s).enumerable})),n.push.apply(n,i)}return n}function _h(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]!=null?arguments[t]:{};t%2?Kx(n,!0).forEach(function(i){YA(e,i,n[i])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):Kx(n).forEach(function(i){Object.defineProperty(e,i,Object.getOwnPropertyDescriptor(n,i))})}return e}function YA(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var CE={registry:[],bootstrapped:!1},XA=function(){var t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:CE,n=arguments.length>1?arguments[1]:void 0;switch(n.type){case db:return _h({},t,{registry:[].concat(Vx(t.registry),[n.key])});case Ju:var i=t.registry.indexOf(n.key),s=Vx(t.registry);return s.splice(i,1),_h({},t,{registry:s,bootstrapped:s.length===0});default:return t}};function WA(e,t,n){var i=nb(XA,CE,void 0),s=function(f){i.dispatch({type:db,key:f})},l=function(f,p,m){var g={type:Ju,payload:p,err:m,key:f};e.dispatch(g),i.dispatch(g)},c=_h({},i,{purge:function(){var f=[];return e.dispatch({type:ub,result:function(m){f.push(m)}}),Promise.all(f)},flush:function(){var f=[];return e.dispatch({type:lb,result:function(m){f.push(m)}}),Promise.all(f)},pause:function(){e.dispatch({type:ob})},persist:function(){e.dispatch({type:cb,register:s,rehydrate:l})}});return c.persist(),c}function ZA(e,t){var n=arguments.length>2&&arguments[2]!==void 0?arguments[2]:{},i=n.whitelist||null,s=n.blacklist||null;function l(c){return!!(i&&i.indexOf(c)===-1||s&&s.indexOf(c)!==-1)}return{in:function(d,f,p){return!l(f)&&e?e(d,f,p):d},out:function(d,f,p){return!l(f)&&t?t(d,f,p):d}}}var Gl={},qc={},Gc={},Yx;function QA(){if(Yx)return Gc;Yx=1,Gc.__esModule=!0,Gc.default=s;function e(l){return typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?e=function(d){return typeof d}:e=function(d){return d&&typeof Symbol=="function"&&d.constructor===Symbol&&d!==Symbol.prototype?"symbol":typeof d},e(l)}function t(){}var n={getItem:t,setItem:t,removeItem:t};function i(l){if((typeof self>"u"?"undefined":e(self))!=="object"||!(l in self))return!1;try{var c=self[l],d="redux-persist ".concat(l," test");c.setItem(d,"test"),c.getItem(d),c.removeItem(d)}catch{return!1}return!0}function s(l){var c="".concat(l,"Storage");return i(c)?self[c]:n}return Gc}var Xx;function JA(){if(Xx)return qc;Xx=1,qc.__esModule=!0,qc.default=n;var e=t(QA());function t(i){return i&&i.__esModule?i:{default:i}}function n(i){var s=(0,e.default)(i);return{getItem:function(c){return new Promise(function(d,f){d(s.getItem(c))})},setItem:function(c,d){return new Promise(function(f,p){f(s.setItem(c,d))})},removeItem:function(c){return new Promise(function(d,f){d(s.removeItem(c))})}}}return qc}var Wx;function eD(){if(Wx)return Gl;Wx=1,Gl.__esModule=!0,Gl.default=void 0;var e=t(JA());function t(i){return i&&i.__esModule?i:{default:i}}var n=(0,e.default)("local");return Gl.default=n,Gl}var tD=eD();const nD=za(tD),rD=ZA(e=>e,e=>({...e,dirtyFileIds:[]}),{whitelist:["files"]}),iD={key:"softBASIC",storage:nD,blacklist:["session","packages"],transforms:[rD]},aD=Qw({projects:sA,files:pA,assets:vA,folders:wA,ui:OA,session:NA,packages:CA}),sD=qA(iD,aD),TE=HN({reducer:sD,middleware:e=>e({serializableCheck:{ignoredActions:[lb,Ju,ob,cb,ub,db],ignoredPaths:["_persist"]}})}),lD=WA(TE),oD=[{id:"softcore",name:"softCore",version:"1.0.0",isCore:!0,isFirstParty:!0,moduleNames:["math","string","array"]},{id:"softgfx",name:"softGfx",version:"2.2.0",isCore:!1,isFirstParty:!0,moduleNames:["gfx","input","drawing","stage","pen","assetmanager","ObjectTransform","sprite","animatedsprite","text","tilemap"]}],Cn=[];for(let e=0;e<256;++e)Cn.push((e+256).toString(16).slice(1));function cD(e,t=0){return(Cn[e[t+0]]+Cn[e[t+1]]+Cn[e[t+2]]+Cn[e[t+3]]+"-"+Cn[e[t+4]]+Cn[e[t+5]]+"-"+Cn[e[t+6]]+Cn[e[t+7]]+"-"+Cn[e[t+8]]+Cn[e[t+9]]+"-"+Cn[e[t+10]]+Cn[e[t+11]]+Cn[e[t+12]]+Cn[e[t+13]]+Cn[e[t+14]]+Cn[e[t+15]]).toLowerCase()}let Pp;const uD=new Uint8Array(16);function dD(){if(!Pp){if(typeof crypto>"u"||!crypto.getRandomValues)throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");Pp=crypto.getRandomValues.bind(crypto)}return Pp(uD)}const fD=typeof crypto<"u"&&crypto.randomUUID&&crypto.randomUUID.bind(crypto),Zx={randomUUID:fD};function yi(e,t,n){var s;if(Zx.randomUUID&&!e)return Zx.randomUUID();e=e||{};const i=e.random??((s=e.rng)==null?void 0:s.call(e))??dD();if(i.length<16)throw new Error("Random bytes length must be >= 16");return i[6]=i[6]&15|64,i[8]=i[8]&63|128,cD(i)}const pD=e=>t=>{const n=yi(),i=yi();t(dE({id:n,name:e,packageIds:["softcore","softgfx"]})),t(wu({id:i,name:"Main.bas",source:"",projectId:n,folderId:null,fullName:"Main.bas"}))},Qx=e=>(t,n)=>{const i=n();Object.values(i.files.byId).filter(d=>d.projectId===e).forEach(d=>t(hE(d.id))),Object.values(i.assets.byId).filter(d=>d.projectId===e).forEach(d=>t(bE(d.id))),i.folders.items.filter(d=>d.projectId===e).forEach(d=>t(_E(d.id))),t(EE(e)),t(nA(e))};function hD(e,t){const n=t.projects.items.find(f=>f.id===e);if(!n)throw new Error(`Project ${e} not found`);const i=t.folders.items.filter(f=>f.projectId===e).map(({id:f,name:p,parentId:m,section:g})=>({id:f,name:p,parentId:m,section:g})),s=Object.values(t.files.byId).filter(f=>f.projectId===e).map(({id:f,name:p,source:m,folderId:g,fullName:y})=>({id:f,name:p,source:m,folderId:g,fullName:y})),l=Object.values(t.assets.byId).filter(f=>f.projectId===e).map(({id:f,name:p,content:m,folderId:g,fullName:y})=>({id:f,name:p,content:m,folderId:g,fullName:y})),c={};Object.entries(t.files.fileOrder).forEach(([f,p])=>{f.startsWith(`${e}:`)&&(c[f.slice(e.length)]=p)});const d={};return Object.entries(t.assets.assetOrder).forEach(([f,p])=>{f.startsWith(`${e}:`)&&(d[f.slice(e.length)]=p)}),{version:1,project:{name:n.name},folders:i,files:s,assets:l,fileOrder:c,assetOrder:d}}function mD(e,t){const n=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),i=URL.createObjectURL(n),s=document.createElement("a");s.href=i,s.download=t,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(i)}const OE=e=>(t,n)=>{const i=n(),s=i.projects.items.find(c=>c.id===e);if(!s)return;const l=hD(e,i);mD(l,`${s.name}.b4wgl.json`)},Jx=e=>t=>{const n=yi(),i={};e.folders.forEach(f=>{i[f.id]=yi()});const s={};e.files.forEach(f=>{s[f.id]=yi()});const l={};e.assets.forEach(f=>{l[f.id]=yi()}),t(dE({id:n,name:e.project.name,packageIds:["softcore","softgfx"]})),e.folders.forEach(f=>{t(ab({id:i[f.id],name:f.name,projectId:n,parentId:f.parentId?i[f.parentId]??null:null,section:f.section}))});const c=new Set;Object.values(e.fileOrder).forEach(f=>{f.forEach(p=>{const m=e.files.find(g=>g.id===p);m&&(t(wu({id:s[p],name:m.name,source:m.source,projectId:n,folderId:m.folderId?i[m.folderId]??null:null,fullName:m.fullName})),c.add(p))})}),e.files.forEach(f=>{c.has(f.id)||t(wu({id:s[f.id],name:f.name,source:f.source,projectId:n,folderId:f.folderId?i[f.folderId]??null:null,fullName:f.fullName}))});const d=new Set;Object.values(e.assetOrder).forEach(f=>{f.forEach(p=>{const m=e.assets.find(g=>g.id===p);m&&(t(Eu({id:l[p],name:m.name,content:m.content,projectId:n,folderId:m.folderId?i[m.folderId]??null:null,fullName:m.fullName})),d.add(p))})}),e.assets.forEach(f=>{d.has(f.id)||t(Eu({id:l[f.id],name:f.name,content:f.content,projectId:n,folderId:f.folderId?i[f.folderId]??null:null,fullName:f.fullName}))})},ed=e=>{const t=an(i=>i.files.byId),n=an(i=>i.files.fileOrder);return E.useMemo(()=>Object.values(t).filter(s=>s.projectId===e).sort((s,l)=>{const c=`${e}:${s.folderId??"root"}`,d=`${e}:${l.folderId??"root"}`;if(c!==d)return 0;const f=n[c]??[];return f.indexOf(s.id)-f.indexOf(l.id)}),[t,n,e])},gD=(e,t=null)=>an(n=>{const i=`${e}:${t??"root"}`,s=n.assets.assetOrder[i];return!s||s.length===0?Object.values(n.assets.byId).filter(l=>l.projectId===e&&(l.folderId??null)===t):s.map(l=>n.assets.byId[l]).filter(l=>!!l)}),e0=["#5050cc","#7050cc","#3060aa","#6040bb","#4050dd","#5070bb"];function bD(e){const t=e.split("").reduce((n,i)=>n+i.charCodeAt(0),0);return e0[t%e0.length]}const yD=({project:e,onRemove:t})=>{const n=ed(e.id),i=gD(e.id),s=Or(),[l,c]=E.useState(!1),[d,f]=E.useState(""),p=E.useRef(null),[m,g]=E.useState(!1),[y,v]=E.useState(""),_=E.useRef(null),T=()=>{f(""),c(!0)},N=()=>{d===e.name&&(t(e.id),c(!1))};E.useEffect(()=>{l&&setTimeout(()=>{var D;return(D=p.current)==null?void 0:D.focus()},0)},[l]),E.useEffect(()=>{if(!l)return;const D=M=>{M.key==="Escape"&&c(!1)};return document.addEventListener("keydown",D),()=>document.removeEventListener("keydown",D)},[l]);const C=()=>{v(e.name),g(!0)},P=()=>{const D=y.trim();!D||D===e.name||(s(aA({projectId:e.id,name:D})),g(!1))};E.useEffect(()=>{m&&setTimeout(()=>{var D,M;(D=_.current)==null||D.focus(),(M=_.current)==null||M.select()},0)},[m]),E.useEffect(()=>{if(!m)return;const D=M=>{M.key==="Escape"&&g(!1)};return document.addEventListener("keydown",D),()=>document.removeEventListener("keydown",D)},[m]);const k=m?Lr.createPortal(S.jsx("div",{className:"fixed inset-0 bg-black/60 flex items-center justify-center z-50",onClick:D=>{D.target===D.currentTarget&&g(!1)},children:S.jsxs("div",{role:"dialog","aria-modal":"true","aria-labelledby":"rename-project-modal-title",className:"bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl",children:[S.jsx("h2",{id:"rename-project-modal-title",className:"text-ds-text text-lg font-semibold mb-4",children:"Rename project"}),S.jsx("input",{ref:_,type:"text",value:y,onChange:D=>v(D.target.value),onKeyDown:D=>{D.key==="Enter"&&P()},placeholder:"Project name",className:"w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent mb-4"}),S.jsxs("div",{className:"flex justify-end gap-3",children:[S.jsx("button",{onClick:P,disabled:!y.trim()||y.trim()===e.name,className:"bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed",children:"Rename"}),S.jsx("button",{onClick:()=>g(!1),className:"bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition",children:"Cancel"})]})]})}),document.body):null,I=l?Lr.createPortal(S.jsx("div",{className:"fixed inset-0 bg-black/60 flex items-center justify-center z-50",onClick:D=>{D.target===D.currentTarget&&c(!1)},children:S.jsxs("div",{role:"dialog","aria-modal":"true","aria-labelledby":"delete-project-modal-title",className:"bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl",children:[S.jsx("h2",{id:"delete-project-modal-title",className:"text-ds-text text-lg font-semibold mb-2",children:"Delete project"}),S.jsxs("p",{className:"text-ds-text-muted text-sm mb-4",children:["This will permanently delete ",S.jsx("span",{className:"text-ds-text font-medium",children:e.name})," and all its files. Type the project name to confirm."]}),S.jsx("input",{ref:p,type:"text",value:d,onChange:D=>f(D.target.value),onKeyDown:D=>{D.key==="Enter"&&N()},placeholder:e.name,className:"w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-error mb-4"}),S.jsxs("div",{className:"flex justify-end gap-3",children:[S.jsx("button",{onClick:N,disabled:d!==e.name,className:"bg-ds-error text-white text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed",children:"Delete"}),S.jsx("button",{onClick:()=>c(!1),className:"bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition",children:"Cancel"})]})]})}),document.body):null;return S.jsxs(S.Fragment,{children:[k,I,S.jsxs("div",{className:"relative group bg-ds-surface border border-ds-border rounded-xl overflow-hidden hover:border-ds-accent transition-colors",children:[S.jsx("div",{className:"h-1",style:{background:bD(e.id)}}),S.jsxs("div",{className:"p-4",children:[S.jsxs("div",{className:"flex items-center gap-1 mb-1",children:[S.jsx("h3",{className:"font-semibold text-ds-text text-base truncate",children:e.name}),S.jsx("button",{onClick:C,className:"opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-text transition-opacity flex-shrink-0 p-0.5","aria-label":`Rename project ${e.name}`,title:"Rename",children:"✏️"})]}),S.jsxs("p",{className:"text-ds-text-muted text-xs",children:[n.length," ",n.length===1?"file":"files",i.length>0&&S.jsxs(S.Fragment,{children:[" · ",i.length," ",i.length===1?"asset":"assets"]})]}),S.jsxs("div",{className:"flex items-center justify-between mt-4 pt-3 border-t border-ds-border-subtle",children:[S.jsx(ra,{to:`/projects/${e.id}/edit`,className:"text-ds-accent-btn-text bg-ds-accent-btn text-xs font-semibold px-3 py-1.5 rounded hover:opacity-90 transition",children:"Open →"}),S.jsxs("div",{className:"flex items-center gap-3",children:[S.jsx("button",{onClick:()=>s(OE(e.id)),className:"opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-text-muted text-xs transition-opacity","aria-label":`Export project ${e.name}`,children:"Export"}),S.jsx("button",{onClick:T,className:"opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error text-xs transition-opacity","aria-label":`Delete project ${e.name}`,children:"Delete"})]})]})]})]})]})},vD=()=>{const e=an(z=>z.projects.items),t=Or(),[n,i]=E.useState(!1),[s,l]=E.useState(""),c=E.useRef(null),d=E.useRef(null),[f,p]=E.useState(null),[m,g]=E.useState(!1),[y,v]=E.useState(""),_=E.useRef(null),T=()=>{l(""),i(!0)},N=()=>{const z=s.trim();z&&(t(pD(z)),i(!1))},C=z=>{t(Qx(z))},P=z=>{var $;const Z=($=z.target.files)==null?void 0:$[0];if(!d.current||(d.current.value="",!Z))return;const W=new FileReader;W.onload=re=>{var ue;let se;try{se=JSON.parse((ue=re.target)==null?void 0:ue.result)}catch{alert("Invalid file: not valid JSON");return}if(se.version!==1){alert("Unsupported export version");return}e.find(V=>V.name===se.project.name)?(p(se),v(""),g(!0)):t(Jx(se))},W.readAsText(Z)},k=()=>{if(!f||y!==f.project.name)return;const z=e.find(Z=>Z.name===f.project.name);z&&t(Qx(z.id)),t(Jx(f)),g(!1),p(null),v("")},I=()=>{g(!1),p(null),v("")};E.useEffect(()=>{n&&setTimeout(()=>{var z;return(z=c.current)==null?void 0:z.focus()},0)},[n]),E.useEffect(()=>{if(!n)return;const z=Z=>{Z.key==="Escape"&&i(!1)};return document.addEventListener("keydown",z),()=>document.removeEventListener("keydown",z)},[n]),E.useEffect(()=>{m&&setTimeout(()=>{var z;return(z=_.current)==null?void 0:z.focus()},0)},[m]),E.useEffect(()=>{if(!m)return;const z=Z=>{Z.key==="Escape"&&I()};return document.addEventListener("keydown",z),()=>document.removeEventListener("keydown",z)},[m]);const D=n?Lr.createPortal(S.jsx("div",{className:"fixed inset-0 bg-black/60 flex items-center justify-center z-50",onClick:z=>{z.target===z.currentTarget&&i(!1)},children:S.jsxs("div",{role:"dialog","aria-modal":"true","aria-labelledby":"new-project-modal-title",className:"bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl",children:[S.jsx("h2",{id:"new-project-modal-title",className:"text-ds-text text-lg font-semibold mb-4",children:"New project"}),S.jsx("input",{ref:c,type:"text",value:s,onChange:z=>l(z.target.value),onKeyDown:z=>{z.key==="Enter"&&N()},placeholder:"Project name",className:"w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent mb-4"}),S.jsxs("div",{className:"flex justify-end gap-3",children:[S.jsx("button",{onClick:N,disabled:!s.trim(),className:"bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed",children:"Create"}),S.jsx("button",{onClick:()=>i(!1),className:"bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition",children:"Cancel"})]})]})}),document.body):null,M=m&&f?Lr.createPortal(S.jsx("div",{className:"fixed inset-0 bg-black/60 flex items-center justify-center z-50",onClick:z=>{z.target===z.currentTarget&&I()},children:S.jsxs("div",{role:"dialog","aria-modal":"true","aria-labelledby":"import-overwrite-modal-title",className:"bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl",children:[S.jsx("h2",{id:"import-overwrite-modal-title",className:"text-ds-text text-lg font-semibold mb-2",children:"Overwrite project"}),S.jsxs("p",{className:"text-ds-text-muted text-sm mb-4",children:["A project named ",S.jsx("span",{className:"text-ds-text font-medium",children:f.project.name})," already exists. This will replace all its files and assets. Type the project name to confirm."]}),S.jsx("input",{ref:_,type:"text",value:y,onChange:z=>v(z.target.value),onKeyDown:z=>{z.key==="Enter"&&k()},placeholder:f.project.name,className:"w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-error mb-4"}),S.jsxs("div",{className:"flex justify-end gap-3",children:[S.jsx("button",{onClick:k,disabled:y!==f.project.name,className:"bg-ds-error text-white text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed",children:"Import & Overwrite"}),S.jsx("button",{onClick:I,className:"bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition",children:"Cancel"})]})]})}),document.body):null;return S.jsxs(S.Fragment,{children:[D,M,S.jsx("input",{ref:d,type:"file",accept:".json",className:"hidden",onChange:P}),S.jsxs("div",{className:"flex items-center justify-between mb-6",children:[S.jsxs("div",{children:[S.jsx("h1",{className:"text-xl font-bold text-ds-text",children:"My Projects"}),S.jsxs("p",{className:"text-ds-text-muted text-sm mt-0.5",children:[e.length," ",e.length===1?"project":"projects"]})]}),S.jsx("button",{onClick:()=>{var z;return(z=d.current)==null?void 0:z.click()},className:"text-ds-text-dim hover:text-ds-text-muted text-sm transition-colors","aria-label":"Import project",children:"Import"})]}),e.length===0?S.jsxs("div",{className:"flex flex-col items-center justify-center py-24 text-center",children:[S.jsx("div",{className:"text-5xl mb-4 opacity-20",children:"📁"}),S.jsx("p",{className:"text-ds-text-muted mb-4",children:"No projects yet."}),S.jsx("button",{onClick:T,className:"bg-ds-accent-btn text-ds-accent-btn-text text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition",children:"Create your first project"})]}):S.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",children:[e.map(z=>S.jsx(yD,{project:z,onRemove:C},z.id)),S.jsxs("button",{onClick:T,className:"border-2 border-dashed border-ds-border rounded-xl p-4 flex flex-col items-center justify-center min-h-[108px] text-ds-text-dim hover:border-ds-accent hover:text-ds-text-muted transition-colors","aria-label":"Create new project",children:[S.jsx("span",{className:"text-3xl leading-none mb-1",children:"+"}),S.jsx("span",{className:"text-xs",children:"New project"})]})]})]})},_D=()=>S.jsxs("div",{className:"min-h-screen bg-ds-bg text-ds-text",children:[S.jsxs("header",{className:"h-11 px-6 flex items-center justify-between border-b border-ds-border bg-ds-surface",children:[S.jsx("span",{className:"font-bold text-base tracking-wide text-ds-accent-btn-text",children:"softBASIC"}),S.jsx("a",{href:"/docs",target:"_blank",rel:"noopener noreferrer",className:"text-sm text-ds-text-muted hover:text-ds-text transition-colors",children:"Docs"})]}),S.jsx("main",{className:"max-w-5xl mx-auto px-6 py-8",children:S.jsx(vD,{})})]}),xD=e=>an(t=>{const n=Object.values(t.files.byId).filter(l=>l.projectId===e),i=t.ui.selectedFileByProject[e];return n.find(l=>l.id===i)||n[0]});function wD(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function t0(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);t&&(i=i.filter(function(s){return Object.getOwnPropertyDescriptor(e,s).enumerable})),n.push.apply(n,i)}return n}function n0(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]!=null?arguments[t]:{};t%2?t0(Object(n),!0).forEach(function(i){wD(e,i,n[i])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):t0(Object(n)).forEach(function(i){Object.defineProperty(e,i,Object.getOwnPropertyDescriptor(n,i))})}return e}function ED(e,t){if(e==null)return{};var n={},i=Object.keys(e),s,l;for(l=0;l<i.length;l++)s=i[l],!(t.indexOf(s)>=0)&&(n[s]=e[s]);return n}function SD(e,t){if(e==null)return{};var n=ED(e,t),i,s;if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(s=0;s<l.length;s++)i=l[s],!(t.indexOf(i)>=0)&&Object.prototype.propertyIsEnumerable.call(e,i)&&(n[i]=e[i])}return n}function CD(e,t){return TD(e)||OD(e,t)||RD(e,t)||ND()}function TD(e){if(Array.isArray(e))return e}function OD(e,t){if(!(typeof Symbol>"u"||!(Symbol.iterator in Object(e)))){var n=[],i=!0,s=!1,l=void 0;try{for(var c=e[Symbol.iterator](),d;!(i=(d=c.next()).done)&&(n.push(d.value),!(t&&n.length===t));i=!0);}catch(f){s=!0,l=f}finally{try{!i&&c.return!=null&&c.return()}finally{if(s)throw l}}return n}}function RD(e,t){if(e){if(typeof e=="string")return r0(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);if(n==="Object"&&e.constructor&&(n=e.constructor.name),n==="Map"||n==="Set")return Array.from(e);if(n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return r0(e,t)}}function r0(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,i=new Array(t);n<t;n++)i[n]=e[n];return i}function ND(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function AD(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i0(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);t&&(i=i.filter(function(s){return Object.getOwnPropertyDescriptor(e,s).enumerable})),n.push.apply(n,i)}return n}function a0(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]!=null?arguments[t]:{};t%2?i0(Object(n),!0).forEach(function(i){AD(e,i,n[i])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i0(Object(n)).forEach(function(i){Object.defineProperty(e,i,Object.getOwnPropertyDescriptor(n,i))})}return e}function DD(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return function(i){return t.reduceRight(function(s,l){return l(s)},i)}}function Jl(e){return function t(){for(var n=this,i=arguments.length,s=new Array(i),l=0;l<i;l++)s[l]=arguments[l];return s.length>=e.length?e.apply(this,s):function(){for(var c=arguments.length,d=new Array(c),f=0;f<c;f++)d[f]=arguments[f];return t.apply(n,[].concat(s,d))}}}function Cu(e){return{}.toString.call(e).includes("Object")}function kD(e){return!Object.keys(e).length}function po(e){return typeof e=="function"}function MD(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function PD(e,t){return Cu(t)||na("changeType"),Object.keys(t).some(function(n){return!MD(e,n)})&&na("changeField"),t}function ID(e){po(e)||na("selectorType")}function LD(e){po(e)||Cu(e)||na("handlerType"),Cu(e)&&Object.values(e).some(function(t){return!po(t)})&&na("handlersType")}function jD(e){e||na("initialIsRequired"),Cu(e)||na("initialType"),kD(e)&&na("initialContent")}function $D(e,t){throw new Error(e[t]||e.default)}var zD={initialIsRequired:"initial state is required",initialType:"initial state should be an object",initialContent:"initial state shouldn't be an empty object",handlerType:"handler should be an object or a function",handlersType:"all handlers should be a functions",selectorType:"selector should be a function",changeType:"provided value of changes should be an object",changeField:'it seams you want to change a field in the state which is not specified in the "initial" state',default:"an unknown error accured in `state-local` package"},na=Jl($D)(zD),Vc={changes:PD,selector:ID,handler:LD,initial:jD};function BD(e){var t=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};Vc.initial(e),Vc.handler(t);var n={current:e},i=Jl(HD)(n,t),s=Jl(UD)(n),l=Jl(Vc.changes)(e),c=Jl(FD)(n);function d(){var p=arguments.length>0&&arguments[0]!==void 0?arguments[0]:function(m){return m};return Vc.selector(p),p(n.current)}function f(p){DD(i,s,l,c)(p)}return[d,f]}function FD(e,t){return po(t)?t(e.current):t}function UD(e,t){return e.current=a0(a0({},e.current),t),t}function HD(e,t,n){return po(t)?t(e.current):Object.keys(n).forEach(function(i){var s;return(s=t[i])===null||s===void 0?void 0:s.call(t,e.current[i])}),n}var qD={create:BD},GD={paths:{vs:"https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs"}};function VD(e){return function t(){for(var n=this,i=arguments.length,s=new Array(i),l=0;l<i;l++)s[l]=arguments[l];return s.length>=e.length?e.apply(this,s):function(){for(var c=arguments.length,d=new Array(c),f=0;f<c;f++)d[f]=arguments[f];return t.apply(n,[].concat(s,d))}}}function KD(e){return{}.toString.call(e).includes("Object")}function YD(e){return e||s0("configIsRequired"),KD(e)||s0("configType"),e.urls?(XD(),{paths:{vs:e.urls.monacoBase}}):e}function XD(){console.warn(RE.deprecation)}function WD(e,t){throw new Error(e[t]||e.default)}var RE={configIsRequired:"the configuration object is required",configType:"the configuration object should be an object",default:"an unknown error accured in `@monaco-editor/loader` package",deprecation:`Deprecation warning!
    You are using deprecated way of configuration.

    Instead of using
      monaco.config({ urls: { monacoBase: '...' } })
    use
      monaco.config({ paths: { vs: '...' } })

    For more please check the link https://github.com/suren-atoyan/monaco-loader#config
  `},s0=VD(WD)(RE),ZD={config:YD},QD=function(){for(var t=arguments.length,n=new Array(t),i=0;i<t;i++)n[i]=arguments[i];return function(s){return n.reduceRight(function(l,c){return c(l)},s)}};function NE(e,t){return Object.keys(t).forEach(function(n){t[n]instanceof Object&&e[n]&&Object.assign(t[n],NE(e[n],t[n]))}),n0(n0({},e),t)}var JD={type:"cancelation",msg:"operation is manually canceled"};function Ip(e){var t=!1,n=new Promise(function(i,s){e.then(function(l){return t?s(JD):i(l)}),e.catch(s)});return n.cancel=function(){return t=!0},n}var ek=qD.create({config:GD,isInitialized:!1,resolve:null,reject:null,monaco:null}),AE=CD(ek,2),xo=AE[0],td=AE[1];function tk(e){var t=ZD.config(e),n=t.monaco,i=SD(t,["monaco"]);td(function(s){return{config:NE(s.config,i),monaco:n}})}function nk(){var e=xo(function(t){var n=t.monaco,i=t.isInitialized,s=t.resolve;return{monaco:n,isInitialized:i,resolve:s}});if(!e.isInitialized){if(td({isInitialized:!0}),e.monaco)return e.resolve(e.monaco),Ip(Lp);if(window.monaco&&window.monaco.editor)return DE(window.monaco),e.resolve(window.monaco),Ip(Lp);QD(rk,ak)(sk)}return Ip(Lp)}function rk(e){return document.body.appendChild(e)}function ik(e){var t=document.createElement("script");return e&&(t.src=e),t}function ak(e){var t=xo(function(i){var s=i.config,l=i.reject;return{config:s,reject:l}}),n=ik("".concat(t.config.paths.vs,"/loader.js"));return n.onload=function(){return e()},n.onerror=t.reject,n}function sk(){var e=xo(function(n){var i=n.config,s=n.resolve,l=n.reject;return{config:i,resolve:s,reject:l}}),t=window.require;t.config(e.config),t(["vs/editor/editor.main"],function(n){DE(n),e.resolve(n)},function(n){e.reject(n)})}function DE(e){xo().monaco||td({monaco:e})}function lk(){return xo(function(e){var t=e.monaco;return t})}var Lp=new Promise(function(e,t){return td({resolve:e,reject:t})}),Tu={config:tk,init:nk,__getMonacoInstance:lk},ok={wrapper:{display:"flex",position:"relative",textAlign:"initial"},fullWidth:{width:"100%"},hide:{display:"none"}},jp=ok,ck={container:{display:"flex",height:"100%",width:"100%",justifyContent:"center",alignItems:"center"}},uk=ck;function dk({children:e}){return Wt.createElement("div",{style:uk.container},e)}var fk=dk,pk=fk;function hk({width:e,height:t,isEditorReady:n,loading:i,_ref:s,className:l,wrapperProps:c}){return Wt.createElement("section",{style:{...jp.wrapper,width:e,height:t},...c},!n&&Wt.createElement(pk,null,i),Wt.createElement("div",{ref:s,style:{...jp.fullWidth,...!n&&jp.hide},className:l}))}var mk=hk,kE=E.memo(mk);function gk(e){E.useEffect(e,[])}var fb=gk;function bk(e,t,n=!0){let i=E.useRef(!0);E.useEffect(i.current||!n?()=>{i.current=!1}:e,t)}var ur=bk;function no(){}function Ds(e,t,n,i){return yk(e,i)||vk(e,t,n,i)}function yk(e,t){return e.editor.getModel(ME(e,t))}function vk(e,t,n,i){return e.editor.createModel(t,n,i?ME(e,i):void 0)}function ME(e,t){return e.Uri.parse(t)}function _k({original:e,modified:t,language:n,originalLanguage:i,modifiedLanguage:s,originalModelPath:l,modifiedModelPath:c,keepCurrentOriginalModel:d=!1,keepCurrentModifiedModel:f=!1,theme:p="light",loading:m="Loading...",options:g={},height:y="100%",width:v="100%",className:_,wrapperProps:T={},beforeMount:N=no,onMount:C=no}){let[P,k]=E.useState(!1),[I,D]=E.useState(!0),M=E.useRef(null),z=E.useRef(null),Z=E.useRef(null),W=E.useRef(C),$=E.useRef(N),re=E.useRef(!1);fb(()=>{let V=Tu.init();return V.then(B=>(z.current=B)&&D(!1)).catch(B=>(B==null?void 0:B.type)!=="cancelation"&&console.error("Monaco initialization: error:",B)),()=>M.current?ue():V.cancel()}),ur(()=>{if(M.current&&z.current){let V=M.current.getOriginalEditor(),B=Ds(z.current,e||"",i||n||"text",l||"");B!==V.getModel()&&V.setModel(B)}},[l],P),ur(()=>{if(M.current&&z.current){let V=M.current.getModifiedEditor(),B=Ds(z.current,t||"",s||n||"text",c||"");B!==V.getModel()&&V.setModel(B)}},[c],P),ur(()=>{let V=M.current.getModifiedEditor();V.getOption(z.current.editor.EditorOption.readOnly)?V.setValue(t||""):t!==V.getValue()&&(V.executeEdits("",[{range:V.getModel().getFullModelRange(),text:t||"",forceMoveMarkers:!0}]),V.pushUndoStop())},[t],P),ur(()=>{var V,B;(B=(V=M.current)==null?void 0:V.getModel())==null||B.original.setValue(e||"")},[e],P),ur(()=>{let{original:V,modified:B}=M.current.getModel();z.current.editor.setModelLanguage(V,i||n||"text"),z.current.editor.setModelLanguage(B,s||n||"text")},[n,i,s],P),ur(()=>{var V;(V=z.current)==null||V.editor.setTheme(p)},[p],P),ur(()=>{var V;(V=M.current)==null||V.updateOptions(g)},[g],P);let se=E.useCallback(()=>{var ee;if(!z.current)return;$.current(z.current);let V=Ds(z.current,e||"",i||n||"text",l||""),B=Ds(z.current,t||"",s||n||"text",c||"");(ee=M.current)==null||ee.setModel({original:V,modified:B})},[n,t,s,e,i,l,c]),Se=E.useCallback(()=>{var V;!re.current&&Z.current&&(M.current=z.current.editor.createDiffEditor(Z.current,{automaticLayout:!0,...g}),se(),(V=z.current)==null||V.editor.setTheme(p),k(!0),re.current=!0)},[g,p,se]);E.useEffect(()=>{P&&W.current(M.current,z.current)},[P]),E.useEffect(()=>{!I&&!P&&Se()},[I,P,Se]);function ue(){var B,ee,X,pe;let V=(B=M.current)==null?void 0:B.getModel();d||((ee=V==null?void 0:V.original)==null||ee.dispose()),f||((X=V==null?void 0:V.modified)==null||X.dispose()),(pe=M.current)==null||pe.dispose()}return Wt.createElement(kE,{width:v,height:y,isEditorReady:P,loading:m,_ref:Z,className:_,wrapperProps:T})}var xk=_k;E.memo(xk);function wk(){let[e,t]=E.useState(Tu.__getMonacoInstance());return fb(()=>{let n;return e||(n=Tu.init(),n.then(i=>{t(i)})),()=>n==null?void 0:n.cancel()}),e}var Ek=wk;function Sk(e){let t=E.useRef();return E.useEffect(()=>{t.current=e},[e]),t.current}var Ck=Sk,Kc=new Map;function Tk({defaultValue:e,defaultLanguage:t,defaultPath:n,value:i,language:s,path:l,theme:c="light",line:d,loading:f="Loading...",options:p={},overrideServices:m={},saveViewState:g=!0,keepCurrentModel:y=!1,width:v="100%",height:_="100%",className:T,wrapperProps:N={},beforeMount:C=no,onMount:P=no,onChange:k,onValidate:I=no}){let[D,M]=E.useState(!1),[z,Z]=E.useState(!0),W=E.useRef(null),$=E.useRef(null),re=E.useRef(null),se=E.useRef(P),Se=E.useRef(C),ue=E.useRef(),V=E.useRef(i),B=Ck(l),ee=E.useRef(!1),X=E.useRef(!1);fb(()=>{let q=Tu.init();return q.then(U=>(W.current=U)&&Z(!1)).catch(U=>(U==null?void 0:U.type)!=="cancelation"&&console.error("Monaco initialization: error:",U)),()=>$.current?x():q.cancel()}),ur(()=>{var U,R,fe,we;let q=Ds(W.current,e||i||"",t||s||"",l||n||"");q!==((U=$.current)==null?void 0:U.getModel())&&(g&&Kc.set(B,(R=$.current)==null?void 0:R.saveViewState()),(fe=$.current)==null||fe.setModel(q),g&&((we=$.current)==null||we.restoreViewState(Kc.get(l))))},[l],D),ur(()=>{var q;(q=$.current)==null||q.updateOptions(p)},[p],D),ur(()=>{!$.current||i===void 0||($.current.getOption(W.current.editor.EditorOption.readOnly)?$.current.setValue(i):i!==$.current.getValue()&&(X.current=!0,$.current.executeEdits("",[{range:$.current.getModel().getFullModelRange(),text:i,forceMoveMarkers:!0}]),$.current.pushUndoStop(),X.current=!1))},[i],D),ur(()=>{var U,R;let q=(U=$.current)==null?void 0:U.getModel();q&&s&&((R=W.current)==null||R.editor.setModelLanguage(q,s))},[s],D),ur(()=>{var q;d!==void 0&&((q=$.current)==null||q.revealLine(d))},[d],D),ur(()=>{var q;(q=W.current)==null||q.editor.setTheme(c)},[c],D);let pe=E.useCallback(()=>{var q;if(!(!re.current||!W.current)&&!ee.current){Se.current(W.current);let U=l||n,R=Ds(W.current,i||e||"",t||s||"",U||"");$.current=(q=W.current)==null?void 0:q.editor.create(re.current,{model:R,automaticLayout:!0,...p},m),g&&$.current.restoreViewState(Kc.get(U)),W.current.editor.setTheme(c),d!==void 0&&$.current.revealLine(d),M(!0),ee.current=!0}},[e,t,n,i,s,l,p,m,g,c,d]);E.useEffect(()=>{D&&se.current($.current,W.current)},[D]),E.useEffect(()=>{!z&&!D&&pe()},[z,D,pe]),V.current=i,E.useEffect(()=>{var q,U;D&&k&&((q=ue.current)==null||q.dispose(),ue.current=(U=$.current)==null?void 0:U.onDidChangeModelContent(R=>{X.current||k($.current.getValue(),R)}))},[D,k]),E.useEffect(()=>{if(D){let q=W.current.editor.onDidChangeMarkers(U=>{var fe;let R=(fe=$.current.getModel())==null?void 0:fe.uri;if(R&&U.find(we=>we.path===R.path)){let we=W.current.editor.getModelMarkers({resource:R});I==null||I(we)}});return()=>{q==null||q.dispose()}}return()=>{}},[D,I]);function x(){var q,U;(q=ue.current)==null||q.dispose(),y?g&&Kc.set(l,$.current.saveViewState()):(U=$.current.getModel())==null||U.dispose(),$.current.dispose()}return Wt.createElement(kE,{width:v,height:_,isEditorReady:D,loading:f,_ref:re,className:T,wrapperProps:N})}var Ok=Tk,Rk=E.memo(Ok),Nk=Rk;const Ak=["dim","class","as","constructor","endconstructor","endclass","function","return","endfunction","if","endif","while","endwhile","for","next","to","in","do","until","and","or","not","true","false","print","call","self","extends","super"],Dk=["onenter","onupdate","onkeydown","onkeyup","onpointerdown","onpointermove"];function kk(){return{ignoreCase:!0,keywords:Ak,lifecycleEvents:Dk,tokenizer:{root:[[/'.*/,"comment"],[/"[^"]*"/,"string"],[/([0-9]*[.])?[0-9]+/,"number"],[/[A-Za-z_][A-Za-z_$0-9]*/,{cases:{"@keywords":"keyword","@lifecycleEvents":"type.identifier","@default":"identifier"}}],[/<>|>=|<=|[+\-*/=<>]/,"operator"],[/[(),.]/,"delimiter"]]}}}function Mk(){return{comments:{lineComment:"'"},brackets:[["(",")"]],autoClosingPairs:[{open:"(",close:")"},{open:'"',close:'"'}],surroundingPairs:[{open:"(",close:")"},{open:'"',close:'"'}],indentationRules:{increaseIndentPattern:/^\s*(function|if|while|for|do|constructor)\b.*/i,decreaseIndentPattern:/^\s*(endfunction|endif|endwhile|endclass|next|endconstructor|until)\b/i}}}function Pk(){return{base:"vs-dark",inherit:!0,colors:{"editor.background":"#0b0b18","editor.foreground":"#e0e0f0","editor.lineHighlightBackground":"#12122a","editor.selectionBackground":"#3030aa55","editorCursor.foreground":"#6060dd","editorLineNumber.foreground":"#4a4a88","editorLineNumber.activeForeground":"#8888bb","editor.inactiveSelectionBackground":"#1e1e4440","editorIndentGuide.background":"#2a2a55","editorIndentGuide.activeBackground":"#6060dd","scrollbar.shadow":"#0b0b18","scrollbarSlider.background":"#2a2a5566","scrollbarSlider.hoverBackground":"#3030aa88"},rules:[{token:"keyword",foreground:"8080ff",fontStyle:"bold"},{token:"type.identifier",foreground:"cc9933"},{token:"comment",foreground:"4a4a88",fontStyle:"italic"},{token:"string",foreground:"cc8866",fontStyle:"italic"},{token:"number",foreground:"b5cea8"},{token:"operator",foreground:"608b4e"},{token:"delimiter",foreground:"e0e0f0"}]}}const Ik={name:"sprite",constructor:{params:["imagePath"],body:(e,t)=>`_sb.createSprite(${e.imagePath})`,assignTo:"_handle",after:(e,t)=>[`dim transform as ObjectTransform(call("${t._handle}"))`]},methods:[{name:"setAngle",params:["angle"],body:(e,t)=>`_sb.setAngle(${t._handle}, ${e.angle})`},{name:"setAlpha",params:["a"],body:(e,t)=>`_sb.setAlpha(${t._handle}, ${e.a})`}]},Lk={name:"text",constructor:{params:["content","x","y"],body:(e,t)=>`_sb.createText(${e.content}, ${e.x}, ${e.y})`,assignTo:"_handle"},methods:[{name:"setText",params:["content"],body:(e,t)=>`_sb.setText(${t._handle}, ${e.content})`},{name:"setPosition",params:["x","y"],body:(e,t)=>`_sb.setPosition(${t._handle}, ${e.x}, ${e.y})`},{name:"setAlpha",params:["a"],body:(e,t)=>`_sb.setAlpha(${t._handle}, ${e.a})`}]},jk={name:"gfx",functions:[{name:"boxCollide",params:["a","b"],returns:(e,t)=>`_sb.boxCollide(${e.a}, ${e.b})`},{name:"getKeyDown",params:["keycode"],returns:(e,t)=>`_sb.getKeyDown(${e.keycode})`}]},$k={name:"drawing",functions:[{name:"drawLine",params:["x","y","x2","y2"],body:(e,t)=>`_sb.drawLine(${e.x}, ${e.y}, ${e.x2}, ${e.y2})`},{name:"drawRect",params:["x","y","width","height"],body:(e,t)=>`_sb.drawRect(${e.x}, ${e.y}, ${e.width}, ${e.height})`},{name:"drawCircle",params:["x","y","radius"],body:(e,t)=>`_sb.drawCircle(${e.x}, ${e.y}, ${e.radius})`}]},zk={name:"stage",functions:[{name:"add",params:["obj"],body:(e,t)=>`_sb.addToStage(${e.obj})`},{name:"remove",params:["obj"],body:(e,t)=>`_sb.removeFromStage(${e.obj})`},{name:"clear",params:[],body:(e,t)=>"_sb.clear()"}]},Bk={name:"pen",functions:[{name:"setFillColor",params:["r","g","b"],body:(e,t)=>`_sb.setFillColor(${e.r}, ${e.g}, ${e.b})`},{name:"setLineColor",params:["r","g","b"],body:(e,t)=>`_sb.setLineColor(${e.r}, ${e.g}, ${e.b})`}]},Fk={name:"assetmanager",functions:[{name:"loadImage",params:["name"],returns:(e,t)=>`_sb.get(${e.name})`}]},Uk={sprite:{constructor:"Creates a sprite from a named image asset in the project.",setAngle:"Rotates the sprite to the given angle in degrees.",setAlpha:"Sets the sprite opacity. 0.0 = invisible, 1.0 = fully opaque."},text:{constructor:"Creates a text display object with the given content at position (x, y).",setText:"Updates the displayed text string.",setPosition:"Moves the text object to coordinates (x, y).",setAlpha:"Sets the text opacity. 0.0 = invisible, 1.0 = fully opaque."},gfx:{boxCollide:"Returns true if two display objects' bounding boxes overlap.",getKeyDown:'Returns true if the specified key is currently held down. Use key codes such as "ArrowUp", "Space", "KeyA".'},drawing:{drawLine:"Draws a line from (x, y) to (x2, y2) using the current pen style.",drawRect:"Draws a filled rectangle at (x, y) with the given width and height.",drawCircle:"Draws a filled circle centred at (x, y) with the given radius."},stage:{add:"Adds a display object (Sprite or Text) to the visible stage.",remove:"Removes a display object from the stage.",clear:"Removes all display objects from the stage."},pen:{setFillColor:"Sets the fill colour for drawing operations. RGB values are 0–255.",setLineColor:"Sets the stroke colour for drawing operations. RGB values are 0–255."},assetmanager:{loadImage:"Loads an image asset by filename and returns a reference to it."},math:{abs:"Returns the absolute value of n.",acos:"Returns the arccosine of n in radians.",acosh:"Returns the hyperbolic arccosine of n.",asin:"Returns the arcsine of n in radians.",asinh:"Returns the hyperbolic arcsine of n.",atan:"Returns the arctangent of n in radians.",atan2:"Returns the angle in radians between the positive x-axis and the point (n2, n1).",atanh:"Returns the hyperbolic arctangent of n.",cbrt:"Returns the cube root of n.",ceil:"Returns n rounded up to the nearest integer.",cos:"Returns the cosine of n (n in radians).",cosh:"Returns the hyperbolic cosine of n.",euler:"Returns Euler's number e ≈ 2.718.",exp:"Returns e raised to the power n.",floor:"Returns n rounded down to the nearest integer.",log:"Returns the natural logarithm of n.",log2:"Returns the base-2 logarithm of n.",log10:"Returns the base-10 logarithm of n.",pi:"Returns π ≈ 3.14159.",pow:"Returns x raised to the power y.",random:"Returns a random number between 0 (inclusive) and max (exclusive).",round:"Returns n rounded to the nearest integer.",sign:"Returns 1 if n > 0, −1 if n < 0, or 0 if n = 0.",sin:"Returns the sine of n (n in radians).",sinh:"Returns the hyperbolic sine of n.",sqrt:"Returns the square root of n.",tan:"Returns the tangent of n (n in radians).",tanh:"Returns the hyperbolic tangent of n.",trunc:"Returns n with the fractional part removed (rounds toward zero).",val:"Converts a string to a number."},string:{len:"Returns the number of characters in string s.",lcase:"Returns s converted to lowercase.",ucase:"Returns s converted to uppercase.",str:"Converts a number n to its string representation.",substr:"Returns the substring of s from index start to end (exclusive).",split:"Splits string s by delimiter c and returns an array of substrings.",trim:"Returns s with leading and trailing whitespace removed.",padstart:"Pads the beginning of s with character p until the string reaches length n.",padend:"Pads the end of s with character p until the string reaches length n."},array:{arrLength:"Returns the number of elements in array a.",join:"Joins all elements of array a into a string, separated by s."},objecttransform:{setPosition:"Move object to absolute position",x:"Get current X coordinate",y:"Get current Y coordinate"}};function Ye(e,t){var n;return((n=Uk[e])==null?void 0:n[t])??""}function Vl(e){return{kind:"module",methods:e.functions.map(t=>({name:t.name,params:t.params,description:Ye(e.name,t.name),hasReturn:!!t.returns}))}}function l0(e){return{kind:"class",constructorEntry:e.constructor?{name:e.name,params:e.constructor.params,description:Ye(e.name,"constructor"),hasReturn:!1}:void 0,methods:e.methods.map(t=>({name:t.name,params:t.params,description:Ye(e.name,t.name),hasReturn:!!t.returns}))}}const Hk={math:{kind:"module",methods:[{name:"abs",params:["n"],description:Ye("math","abs"),hasReturn:!0},{name:"acos",params:["n"],description:Ye("math","acos"),hasReturn:!0},{name:"acosh",params:["n"],description:Ye("math","acosh"),hasReturn:!0},{name:"asin",params:["n"],description:Ye("math","asin"),hasReturn:!0},{name:"asinh",params:["n"],description:Ye("math","asinh"),hasReturn:!0},{name:"atan",params:["n"],description:Ye("math","atan"),hasReturn:!0},{name:"atan2",params:["n1","n2"],description:Ye("math","atan2"),hasReturn:!0},{name:"atanh",params:["n"],description:Ye("math","atanh"),hasReturn:!0},{name:"cbrt",params:["n"],description:Ye("math","cbrt"),hasReturn:!0},{name:"ceil",params:["n"],description:Ye("math","ceil"),hasReturn:!0},{name:"cos",params:["n"],description:Ye("math","cos"),hasReturn:!0},{name:"cosh",params:["n"],description:Ye("math","cosh"),hasReturn:!0},{name:"euler",params:[],description:Ye("math","euler"),hasReturn:!0},{name:"exp",params:["n"],description:Ye("math","exp"),hasReturn:!0},{name:"floor",params:["n"],description:Ye("math","floor"),hasReturn:!0},{name:"log",params:["n"],description:Ye("math","log"),hasReturn:!0},{name:"log2",params:["n"],description:Ye("math","log2"),hasReturn:!0},{name:"log10",params:["n"],description:Ye("math","log10"),hasReturn:!0},{name:"pi",params:[],description:Ye("math","pi"),hasReturn:!0},{name:"pow",params:["x","y"],description:Ye("math","pow"),hasReturn:!0},{name:"random",params:["max"],description:Ye("math","random"),hasReturn:!0},{name:"round",params:["n"],description:Ye("math","round"),hasReturn:!0},{name:"sign",params:["n"],description:Ye("math","sign"),hasReturn:!0},{name:"sin",params:["n"],description:Ye("math","sin"),hasReturn:!0},{name:"sinh",params:["n"],description:Ye("math","sinh"),hasReturn:!0},{name:"sqrt",params:["n"],description:Ye("math","sqrt"),hasReturn:!0},{name:"tan",params:["n"],description:Ye("math","tan"),hasReturn:!0},{name:"tanh",params:["n"],description:Ye("math","tanh"),hasReturn:!0},{name:"trunc",params:["n"],description:Ye("math","trunc"),hasReturn:!0},{name:"val",params:["s"],description:Ye("math","val"),hasReturn:!0}]},string:{kind:"module",methods:[{name:"len",params:["s"],description:Ye("string","len"),hasReturn:!0},{name:"lcase",params:["s"],description:Ye("string","lcase"),hasReturn:!0},{name:"ucase",params:["s"],description:Ye("string","ucase"),hasReturn:!0},{name:"str",params:["n"],description:Ye("string","str"),hasReturn:!0},{name:"substr",params:["s","start","end"],description:Ye("string","substr"),hasReturn:!0},{name:"split",params:["s","c"],description:Ye("string","split"),hasReturn:!0},{name:"trim",params:["s"],description:Ye("string","trim"),hasReturn:!0},{name:"padstart",params:["s","n","p"],description:Ye("string","padstart"),hasReturn:!0},{name:"padend",params:["s","n","p"],description:Ye("string","padend"),hasReturn:!0}]},array:{kind:"module",methods:[{name:"arrLength",params:["a"],description:Ye("array","arrLength"),hasReturn:!0},{name:"join",params:["a","s"],description:Ye("array","join"),hasReturn:!0}]}},pb={...Hk,sprite:l0(Ik),text:l0(Lk),gfx:Vl(jk),drawing:Vl($k),stage:Vl(zk),pen:Vl(Bk),assetmanager:Vl(Fk),objecttransform:{kind:"class",methods:[{name:"setPosition",params:["x","y"],description:Ye("objecttransform","setPosition"),hasReturn:!1},{name:"x",params:[],description:Ye("objecttransform","x"),hasReturn:!0},{name:"y",params:[],description:Ye("objecttransform","y"),hasReturn:!0}]}};function PE(e){var t;return((t=pb[e.toLowerCase()])==null?void 0:t.methods)??[]}function IE(e,t){return PE(e).find(n=>n.name.toLowerCase()===t.toLowerCase())}function LE(e){var t;return(t=pb[e.toLowerCase()])==null?void 0:t.constructorEntry}function qk(e){return e.toLowerCase()in pb}function Gk(e){const t=e.match(/(\w+)\.$/);return t?t[1].toLowerCase():null}function Vk(e){if(e.params.length===0)return`${e.name}()`;const t=e.params.map((n,i)=>`\${${i+1}:${n}}`).join(", ");return`${e.name}(${t})`}function Kk(e){return e.languages.registerCompletionItemProvider("softBasic",{triggerCharacters:["."],provideCompletionItems(t,n){const s=t.getLineContent(n.lineNumber).substring(0,n.column-1),l=Gk(s);if(!l||!qk(l))return{suggestions:[]};const c=PE(l),d={startLineNumber:n.lineNumber,endLineNumber:n.lineNumber,startColumn:n.column,endColumn:n.column};return{suggestions:c.map(f=>({label:f.name,kind:e.languages.CompletionItemKind.Method,insertText:Vk(f),insertTextRules:e.languages.CompletionItemInsertTextRule.InsertAsSnippet,documentation:f.description,range:d}))}}})}function Yk(e,t){if(e[t.startColumn-2]!==".")return null;const s=e.substring(0,t.startColumn-2).match(/(\w+)$/);return s?{moduleName:s[1].toLowerCase(),methodName:t.word.toLowerCase()}:null}function Xk(e){return e.languages.registerHoverProvider("softBasic",{provideHover(t,n){const i=t.getWordAtPosition(n);if(!i)return null;const s=t.getLineContent(n.lineNumber),l=Yk(s,i);if(l){const d=IE(l.moduleName,l.methodName);return d?{contents:[{value:`**${l.moduleName}.${d.name}(${d.params.join(", ")})**`},{value:d.description}]}:null}const c=LE(i.word.toLowerCase());return c?{contents:[{value:`**${i.word.charAt(0).toUpperCase()+i.word.slice(1).toLowerCase()}(${c.params.join(", ")})**`},{value:c.description}]}:null}})}function Wk(e){let t=0,n=-1,i=0;for(let d=e.length-1;d>=0;d--){const f=e[d];if(f===")")t++;else if(f==="("){if(t===0){n=d;break}t--}else f===","&&t===0&&i++}if(n<0)return null;const s=e.substring(0,n).trimEnd(),l=s.match(/(\w+)\.(\w+)$/);if(l)return{moduleName:l[1].toLowerCase(),methodName:l[2].toLowerCase(),activeParameter:i};const c=s.match(/(\w+)$/);return c?{methodName:c[1].toLowerCase(),activeParameter:i}:null}function Zk(e){return e.languages.registerSignatureHelpProvider("softBasic",{signatureHelpTriggerCharacters:["(",","],provideSignatureHelp(t,n){const s=t.getLineContent(n.lineNumber).substring(0,n.column-1),l=Wk(s);if(!l)return null;let c,d;if(l.moduleName){if(c=IE(l.moduleName,l.methodName),!c)return null;d=`${l.moduleName}.${c.name}(${c.params.join(", ")})`}else{if(c=LE(l.methodName),!c)return null;d=`${l.methodName.charAt(0).toUpperCase()+l.methodName.slice(1)}(${c.params.join(", ")})`}const f=c.params.length>0?Math.min(l.activeParameter,c.params.length-1):0;return{value:{signatures:[{label:d,documentation:c.description,parameters:c.params.map(p=>({label:p}))}],activeSignature:0,activeParameter:f},dispose:()=>{}}}})}const Qk=({file:e,height:t,onChange:n,onCursorChange:i})=>{const s=Ek(),[l,c]=E.useState(!1);E.useEffect(()=>{if(!s)return;s.languages.register({id:"softBasic"});const f=s.languages.setMonarchTokensProvider("softBasic",kk()),p=s.languages.setLanguageConfiguration("softBasic",Mk());s.editor.defineTheme("softBasicTheme",Pk());const m=Kk(s),g=Xk(s),y=Zk(s);return c(!0),()=>{f.dispose(),p.dispose(),m.dispose(),g.dispose(),y.dispose()}},[s]);const d=f=>{f.onDidChangeCursorPosition(p=>{i==null||i(p.position.lineNumber,p.position.column)})};return e?l?S.jsx(Nk,{height:t,defaultValue:"",language:"softBasic",defaultLanguage:"softBasic",theme:"softBasicTheme",value:e.source,options:{fontSize:14,minimap:{enabled:!1},automaticLayout:!0},onChange:n,onMount:d}):null:S.jsx("p",{children:"File not found."})},Jk=`const _sbLifecycle = {\r
  _sbClasses: [],\r
  _sbInstances: [],\r
  _update(delta) {\r
    this._sbClasses.forEach((c) => {\r
      if (c.symbol.onupdate) {\r
        try {\r
          c.symbol.onupdate(delta);\r
        } catch (e) {\r
          _throwError(e);\r
        }\r
      }\r
    });\r
    this._sbInstances.forEach((inst) => {\r
      if (inst.onupdate) {\r
        try {\r
          inst.onupdate(delta);\r
        } catch (e) {\r
          _throwError(e);\r
        }\r
      }\r
    });\r
  },\r
};\r
`,eM=`const _sbInput = {
  _keys: {},
  _mouseX: 0,
  _mouseY: 0,
  _mouseDown: false,
  getKeyDown(keyCode) {
    return Boolean(this._keys[keyCode]);
  },
  registerKey(keyCode, down) {
    this._keys[keyCode] = down;
  },
  getMouseX() {
    return this._mouseX;
  },
  getMouseY() {
    return this._mouseY;
  },
  getMouseDown() {
    return this._mouseDown;
  },
  _initMouse(canvas) {
    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this._mouseX = e.clientX - rect.left;
      this._mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('pointerdown', () => {
      this._mouseDown = true;
    });
    canvas.addEventListener('pointerup', () => {
      this._mouseDown = false;
    });
    canvas.addEventListener('pointercancel', () => {
      this._mouseDown = false;
    });
  },
};
`,tM=`const _sbAssets = (() => {\r
  const _cache = new Map();\r
  let _ready = false;\r
\r
  return {\r
    async preload(manifest) {\r
      manifest.forEach(({ name, src }) =>\r
        PIXI.Assets.add({ alias: name, src })\r
      );\r
      const loads = manifest.map(async ({ name }) => {\r
        const asset = await PIXI.Assets.load(name);\r
        _cache.set(name, asset);\r
      });\r
      await Promise.all(loads);\r
      _ready = true;\r
    },\r
\r
    async preloadFromLocalStorage(projectId) {\r
      const raw = window.localStorage.getItem('persist:softBASIC');\r
      if (!raw) { _ready = true; return; }\r
      let assetsById = {};\r
      try {\r
        const persisted = JSON.parse(raw);\r
        assetsById = JSON.parse(persisted.assets ?? '{}').byId ?? {};\r
      } catch (_) {\r
        _ready = true;\r
        return;\r
      }\r
      const assets = Object.values(assetsById).filter((a) => a.projectId === projectId);\r
      if (assets.length === 0) { _ready = true; return; }\r
      await this.preload(assets.map((a) => ({ name: a.fullName ?? a.name, src: a.content })));\r
    },\r
\r
    isReady() {\r
      return _ready;\r
    },\r
\r
    get(name) {\r
      if (!_cache.has(name)) {\r
        throw Error(\`Asset "\${name}" not found. Make sure the filename is correct and included in your assets.\`);\r
      }\r
      return _cache.get(name);\r
    },\r
\r
    tryGet(name) {\r
      return _cache.get(name);\r
    },\r
  };\r
})();\r
`,nM=`const _sbDrawing = (() => {\r
  const _styles = {\r
    fillColor: 0xffffff,\r
    lineColor: 0xffffff,\r
    lineWidth: 2,\r
  };\r
\r
  function _componentToHex(c) {\r
    const hex = c.toString(16);\r
    return hex.length === 1 ? '0' + hex : hex;\r
  }\r
\r
  return {\r
    setFillColor(r, g, b) {\r
      const hex = _componentToHex(r) + _componentToHex(g) + _componentToHex(b);\r
      _styles.fillColor = parseInt(hex, 16);\r
    },\r
    setLineColor(r, g, b) {\r
      const hex = _componentToHex(r) + _componentToHex(g) + _componentToHex(b);\r
      _styles.lineColor = parseInt(hex, 16);\r
    },\r
    setLineWidth(n) {\r
      _styles.lineWidth = n;\r
    },\r
    drawLine(x, y, x2, y2) {\r
      const obj = new PIXI.Graphics();\r
      obj.moveTo(0, 0).lineTo(x2, y2).stroke({ width: _styles.lineWidth, color: _styles.lineColor });\r
      obj.position.set(x, y);\r
      app.stage.addChild(obj);\r
      return obj;\r
    },\r
    drawRect(x, y, width, height) {\r
      const obj = new PIXI.Graphics();\r
      obj.rect(0, 0, width, height).fill(_styles.fillColor).stroke({ width: _styles.lineWidth, color: _styles.lineColor });\r
      obj.pivot.set(width / 2, height / 2);\r
      obj.position.set(x, y);\r
      app.stage.addChild(obj);\r
      return obj;\r
    },\r
    drawCircle(x, y, radius) {\r
      const obj = new PIXI.Graphics();\r
      obj.circle(0, 0, radius).fill(_styles.fillColor).stroke({ width: _styles.lineWidth, color: _styles.lineColor });\r
      obj.pivot.set(radius / 2, radius / 2);\r
      obj.position.set(x, y);\r
      app.stage.addChild(obj);\r
      return obj;\r
    },\r
  };\r
})();\r
`,rM=`const _sbStage = {\r
  addToStage(obj) {\r
    app.stage.addChild(obj._handle);\r
    if (!_sbLifecycle._sbInstances.includes(obj)) {\r
      _sbLifecycle._sbInstances.push(obj);\r
    }\r
  },\r
  removeFromStage(obj) {\r
    app.stage.removeChild(obj._handle);\r
    _sbLifecycle._sbInstances = _sbLifecycle._sbInstances.filter((i) => i !== obj);\r
  },\r
  clear() {\r
    app.stage.removeChildren();\r
    _sbLifecycle._sbInstances = [];\r
  },\r
  getStageWidth() {\r
    return app.renderer.width;\r
  },\r
  getStageHeight() {\r
    return app.renderer.height;\r
  },\r
  setBackground(r, g, b) {\r
    app.renderer.background.color = (r << 16) | (g << 8) | b;\r
  },\r
};\r
`,iM=`const _sbSprites = {\r
  createSprite(imagePath) {\r
    const texture = _sbAssets.get(imagePath);\r
    return new PIXI.Sprite(texture);\r
  },\r
  setPosition(obj, x, y) {\r
    obj.position.set(x, y);\r
  },\r
  getPositionX(obj) {\r
    return obj.position.x;\r
  },\r
  getPositionY(obj) {\r
    return obj.position.y;\r
  },\r
  setAngle(obj, angle) {\r
    obj.angle = angle;\r
  },\r
  setAlpha(obj, a) {\r
    obj.alpha = a;\r
  },\r
  setScale(obj, sx, sy) {\r
    obj.scale.set(sx, sy);\r
  },\r
  setFlip(obj, h, v) {\r
    obj.scale.x = h ? -Math.abs(obj.scale.x) : Math.abs(obj.scale.x);\r
    obj.scale.y = v ? -Math.abs(obj.scale.y) : Math.abs(obj.scale.y);\r
  },\r
  setVisible(obj, v) {\r
    obj.visible = v;\r
  },\r
  setTexture(obj, path) {\r
    obj.texture = _sbAssets.get(path);\r
  },\r
  getSpriteWidth(obj) {\r
    return obj.width;\r
  },\r
  getSpriteHeight(obj) {\r
    return obj.height;\r
  },\r
  createText(content, x, y) {\r
    const textStyle = new PIXI.TextStyle({\r
      fontFamily: 'Arial',\r
      fontSize: 36,\r
      fontStyle: 'italic',\r
      fontWeight: 'bold',\r
      fill: '#ffffff',\r
      stroke: { color: '#4a1850', width: 5 },\r
      dropShadow: {\r
        color: '#000000',\r
        blur: 4,\r
        angle: Math.PI / 6,\r
        distance: 6,\r
      },\r
      wordWrap: true,\r
      wordWrapWidth: 440,\r
      lineJoin: 'round',\r
    });\r
    const text = new PIXI.Text({ text: content, style: textStyle });\r
    text.x = x;\r
    text.y = y;\r
    return text;\r
  },\r
  setText(obj, text) {\r
    obj.text = text;\r
  },\r
  boxCollide(a, b) {\r
    const ab = a._handle.getBounds();\r
    const bb = b._handle.getBounds();\r
    return (\r
      ab.x + ab.width > bb.x &&\r
      ab.x < bb.x + bb.width &&\r
      ab.y + ab.height > bb.y &&\r
      ab.y < bb.y + bb.height\r
    );\r
  },\r
  setTextStyle(obj, size, r, g, b) {\r
    obj.style.fontSize = size;\r
    obj.style.fill = \`#\${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}\`;\r
  },\r
};\r
`,aM=`const _sbAnimatedSprites = {
  createAnimatedSprite(imagePath, frameW, frameH) {
    const base = _sbAssets.get(imagePath);
    const cols = Math.floor(base.width / frameW);
    const rows = Math.floor(base.height / frameH);
    const frames = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        frames.push(
          new PIXI.Texture({
            source: base.source,
            frame: new PIXI.Rectangle(c * frameW, r * frameH, frameW, frameH),
          })
        );
      }
    }
    const pixi = new PIXI.AnimatedSprite(frames);
    pixi.anchor.set(0.5);
    pixi._allFrames = frames;
    pixi._animations = new Map();
    pixi._sbCurrentAnim = null;
    pixi._sbPlaying = false;
    return pixi;
  },

  addAnim(handle, name, startFrame, endFrame, fps, loop) {
    handle._animations.set(String(name), {
      startFrame: Number(startFrame),
      endFrame:   Number(endFrame),
      fps:        Number(fps),
      loop:       Boolean(loop),
    });
  },

  playAnim(handle, name) {
    const key = String(name);
    const def = handle._animations.get(key);
    if (!def) return;
    handle.textures = handle._allFrames.slice(def.startFrame, def.endFrame + 1);
    handle.animationSpeed = def.fps / 60;
    handle.loop = def.loop;
    handle.onComplete = null;
    handle._sbCurrentAnim = key;
    handle._sbPlaying = true;
    if (!def.loop) {
      handle.onComplete = () => { handle._sbPlaying = false; };
    }
    handle.gotoAndPlay(0);
  },

  isPlayingAnim(handle, name) {
    return (handle._sbCurrentAnim === String(name) && handle._sbPlaying) ? 1 : 0;
  },

  setAnimAngle(handle, angle) {
    handle.angle = Number(angle);
  },

  setAnimAlpha(handle, a) {
    handle.alpha = Number(a);
  },

  setAnimScale(handle, sx, sy) {
    handle.scale.set(Number(sx), Number(sy));
  },

  setAnimFlip(handle, h, v) {
    handle.scale.x = h ? -Math.abs(handle.scale.x) : Math.abs(handle.scale.x);
    handle.scale.y = v ? -Math.abs(handle.scale.y) : Math.abs(handle.scale.y);
  },

  setAnimVisible(handle, v) {
    handle.visible = Boolean(v);
  },

  getAnimWidth(handle) {
    return handle.width;
  },

  getAnimHeight(handle) {
    return handle.height;
  },
};
`,sM=`const _sbTilemaps = {
  createTileMap(tilesetPath, tileW, tileH) {
    tileW = Number(tileW);
    tileH = Number(tileH);
    const base = _sbAssets.get(tilesetPath);
    const cols = Math.floor(base.width / tileW);
    const rows = Math.floor(base.height / tileH);
    const frames = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        frames.push(
          new PIXI.Texture({
            source: base.source,
            frame: new PIXI.Rectangle(c * tileW, r * tileH, tileW, tileH),
          })
        );
      }
    }
    const container = new PIXI.Container();
    container._tileW = tileW;
    container._tileH = tileH;
    container._frames = frames;
    container._map = [];
    return container;
  },

  loadTileMap(handle, jsonPath) {
    const data = _sbAssets.get(jsonPath);
    handle.removeChildren();
    for (let row = 0; row < data.length; row++) {
      for (let col = 0; col < data[row].length; col++) {
        const id = data[row][col];
        if (!id) continue;
        if (id < 1 || id > handle._frames.length) continue;
        const sprite = new PIXI.Sprite(handle._frames[id - 1]);
        sprite.x = col * handle._tileW;
        sprite.y = row * handle._tileH;
        handle.addChild(sprite);
      }
    }
    handle._map = data;
  },

  tileAt(handle, worldX, worldY) {
    // handle.x / handle.y reflect the scroll offset applied by ObjectTransform.setPosition
    const col = Math.floor((Number(worldX) - handle.x) / handle._tileW);
    const row = Math.floor((Number(worldY) - handle.y) / handle._tileH);
    if (row < 0 || row >= handle._map.length) return 0;
    if (col < 0 || col >= (handle._map[0]?.length ?? 0)) return 0;
    return handle._map[row][col] ?? 0;
  },

  tileMapWidthPx(handle) {
    return (handle._map[0]?.length ?? 0) * handle._tileW;
  },

  tileMapHeightPx(handle) {
    return handle._map.length * handle._tileH;
  },
};
`,lM=`const _sb = {
  ..._sbLifecycle,
  ..._sbInput,
  ..._sbAssets,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbSprites,
  ..._sbAnimatedSprites,
  ..._sbTilemaps,
};
`,oM=`<html>
      <head>

      </head>
      <body>
      <script type="text/javascript">
      const _createArrayDim = (sizes, depth) => {
        if (depth === sizes.length - 1)
          return Array.from({length: sizes[depth]}, () => false);
        return Array.from({length: sizes[depth]}, () =>
          _createArrayDim(sizes, depth + 1)
        );
      };
      const _createArray = (sizes) => {
        return _createArrayDim(sizes, 0);
      };
      const _createTypedArrayDim = (sizes, depth, factory) => {
        if (depth === sizes.length - 1)
          return Array.from({length: sizes[depth]}, () => factory());
        return Array.from({length: sizes[depth]}, () =>
          _createTypedArrayDim(sizes, depth + 1, factory)
        );
      };
      const _createTypedArray = (sizes, factory) => {
        return _createTypedArrayDim(sizes, 0, factory);
      };

      const _createDict = () => new Map();
      const _sbDictGet = (map, key) => {
        if (!map.has(key)) throw new Error(\`Dictionary key not found: \${JSON.stringify(key)}\`);
        return map.get(key);
      };
      const _sbRequireInit = (val, label) => {
        if (val == null)
          throw new Error(\`Null reference: '\${label}' has not been initialised. Assign a value with 'new' before accessing members.\`);
        return val;
      };
      const _sbLength   = x          => x instanceof Map ? x.size : x.length;
      const _sbRemove   = (col, k)   => col instanceof Map ? col.delete(k) : col.splice(k, 1);
      const _sbContains = (col, item)=> col instanceof Map ? col.has(item) : col.includes(item);
      const _sbClear    = col        => { if (col instanceof Map) col.clear(); else col.splice(0); };
      const _sbJoin     = (col, sep) => col instanceof Map
        ? Array.from(col.values()).join(sep)
        : col.join(sep);

      const _print = (value) => {
        console.log(value);
        if(typeof value === 'string' || typeof value === 'number'){
          window.parent.postMessage({type:'console.log', message: String(value)});
          return;
        }
        try{
          const json = JSON.stringify(value);
          if(!json){
            window.parent.postMessage({type:'console.log', message:'null'});
            return;
          }
          window.parent.postMessage({type:'console.log', message:json});
        }
        catch{
          window.parent.postMessage({type:'console.log', message:'null'});
        }
      }

      const _throwError = (e)=>{
        window.parent.postMessage({type:'runtimeError', message: e.message});
        throw Error(e.message);
      }

      window.addEventListener('unhandledrejection', (e) => {
        _throwError({ message: e.reason?.message ?? String(e.reason) });
      });

      // Catch synchronous script errors that occur outside the async IIFE
      // (e.g. engine initialisation before app is ready) and surface them in the IDE.
      window.onerror = (_msg, _src, _line, _col, error) => {
        _throwError({ message: error?.message ?? String(_msg) });
        return true;
      };
      <\/script>
      <script src="https://cdn.jsdelivr.net/npm/pixi.js@8.x/dist/pixi.min.js"><\/script>
      <script type="text/javascript">
      var app;
      //\${projectId}
      //\${softBasicGFX}

      (async () => {
        try {
          app = new PIXI.Application();
          await app.init({
            background: '#1099bb',
            resizeTo: window,
            width: 640,
            height: 360,
          });
          app.stage.interactive = true;
          document.body.appendChild(app.canvas);

          // Mouse tracking must be attached after app.canvas exists.
          _sb._initMouse(app.canvas);

          await _sb.preloadFromLocalStorage(_sbProjectId);

          //\${transpiled};

          // Key listeners are registered after the transpiled code so that
          // _sbClasses is populated and onkeydown/onkeyup resolve correctly.
          document.addEventListener('keydown', (e) => {
            _sb.registerKey(e.keyCode, true);
            _sb._sbClasses.forEach((c) => { if (c.symbol.onkeydown) c.symbol.onkeydown(e.keyCode); });
            _sb._sbInstances.forEach((inst) => { if (inst.onkeydown) inst.onkeydown(e.keyCode); });
          });
          document.addEventListener('keyup', (e) => {
            _sb.registerKey(e.keyCode, false);
            _sb._sbClasses.forEach((c) => { if (c.symbol.onkeyup) c.symbol.onkeyup(e.keyCode); });
            _sb._sbInstances.forEach((inst) => { if (inst.onkeyup) inst.onkeyup(e.keyCode); });
          });

          app.ticker.add((ticker) => _sb._update(ticker.deltaTime));

          _sb._sbClasses.forEach((c) => {
            if (c.symbol.onenter) {
              c.symbol.onenter();
            }
          });
        } catch(e) {
          _throwError(e);
        }
      })();
      <\/script>
      </body>
      </html>
`,cM=({transpiled:e,projectId:t,width:n="100%",height:i="100%"})=>S.jsx("div",{style:{width:n,height:i},children:S.jsx("iframe",{style:{width:n,height:i},sandbox:"allow-scripts allow-same-origin",title:"Preview",srcDoc:oM.replace("//${softBasicGFX}",[Jk,eM,tM,nM,rM,iM,aM,sM,lM].join(`
`)).replace("//${transpiled}",e).replace("//${projectId}",`let _sbProjectId = "${t}";`)})}),uM=({transpiled:e,projectId:t})=>S.jsx(cM,{transpiled:e,projectId:t,width:"100%",height:"100%"});class o0 extends Wt.Component{constructor(t){super(t),this.state={hasError:!1}}static getDerivedStateFromError(t){return{hasError:!0,error:t}}componentDidCatch(t,n){console.error("[ErrorBoundary] Caught error:",t,n.componentStack)}render(){var t;return this.state.hasError?this.props.fallback!==void 0?this.props.fallback:S.jsxs("div",{className:"p-4 bg-ds-bg text-ds-error text-sm font-mono",children:[S.jsx("p",{className:"font-bold mb-1",children:"Component error"}),S.jsx("p",{children:(t=this.state.error)==null?void 0:t.message})]}):this.props.children}}var $n=(e=>(e[e.Notice=0]="Notice",e[e.Warning=1]="Warning",e[e.Error=2]="Error",e[e.Output=3]="Output",e))($n||{});const dM=e=>{let t={};return e.forEach((n,i)=>{t[n]=i}),t};function fM(e){let t={};return e.forEach((n,i)=>{t[n]={value:i,name:n}}),t}const A=fM(["EndOfFile","Error","WhiteSpace","Comment","NewLine","SoftNewLine","Number","String","Add","Subtract","Divide","Multiply","OpenParen","CloseParen","OpenBracket","CloseBracket","Equals","NotEquals","GreaterThan","GreaterThanEqualTo","LessThan","LessThanEqualTo","Dot","Print","Call","Variable","Class","Dim","As","Function","Return","EndFunction","Constructor","EndConstructor","EndClass","Comma","BoolTrue","BoolFalse","And","Or","Not","If","Then","Else","ElseIf","EndIf","While","EndWhile","Do","Until","For","Next","To","In","Self","Extends","Super","New"]);A.WhiteSpace.stripped=!0;A.Comment.stripped=!0;const or=(e,t)=>({match:e.substring(0,1)===t,position:1,text:e.substring(0,1)}),$p=(e,t)=>{let n=0;for(;e.substring(n,1)===t;)n++;return{match:n>0,position:n,text:e.substring(0,n)}},Es=(e,t)=>({match:e.length>=t.length&&e.substring(0,t.length).toLowerCase()===t,position:t.length,text:e.substring(0,t.length)}),yt=(e,t)=>{const n=e.match(t);return{match:n&&n.length>0&&n[0]!=="",position:n&&n[0].length,text:n&&n[0]}},pM=[{isMatch:()=>({match:!1,token:A.Error,position:0,text:""})},{isMatch:e=>({...$p(e," "),token:A.WhiteSpace})},{isMatch:e=>({...yt(e,/^(\r\n|\r|\n)/),token:A.NewLine})},{isMatch:e=>({...$p(e,`
`),token:A.NewLine})},{isMatch:e=>({...$p(e,":"),token:A.SoftNewLine})},{isMatch:e=>({...or(e,"+"),token:A.Add})},{isMatch:e=>({...or(e,"-"),token:A.Subtract})},{isMatch:e=>({...or(e,"*"),token:A.Multiply})},{isMatch:e=>({...or(e,"/"),token:A.Divide})},{isMatch:e=>({...or(e,"("),token:A.OpenParen})},{isMatch:e=>({...or(e,")"),token:A.CloseParen})},{isMatch:e=>({...or(e,"["),token:A.OpenBracket})},{isMatch:e=>({...or(e,"]"),token:A.CloseBracket})},{isMatch:e=>({...Es(e,"=="),token:A.Equals})},{isMatch:e=>({...or(e,"="),token:A.Equals})},{isMatch:e=>({...Es(e,"<>"),token:A.NotEquals})},{isMatch:e=>({...Es(e,">="),token:A.GreaterThanEqualTo})},{isMatch:e=>({...or(e,">"),token:A.GreaterThan})},{isMatch:e=>({...Es(e,"<="),token:A.LessThanEqualTo})},{isMatch:e=>({...or(e,"<"),token:A.LessThan})},{isMatch:e=>({...or(e,"."),token:A.Dot})},{isMatch:e=>({...yt(e,/^print(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.Print})},{isMatch:e=>({...yt(e,/^call(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.Call})},{isMatch:e=>({...yt(e,/^dim(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.Dim})},{isMatch:e=>({...yt(e,/^class(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.Class})},{isMatch:e=>({...yt(e,/^as(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.As})},{isMatch:e=>({...yt(e,/^function(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.Function})},{isMatch:e=>({...yt(e,/^return(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.Return})},{isMatch:e=>({...yt(e,/^endfunction(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.EndFunction})},{isMatch:e=>({...yt(e,/^endconstructor(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.EndConstructor})},{isMatch:e=>({...yt(e,/^constructor(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.Constructor})},{isMatch:e=>({...yt(e,/^endclass(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.EndClass})},{isMatch:e=>({...or(e,","),token:A.Comma})},{isMatch:e=>({...Es(e,"true"),token:A.BoolTrue})},{isMatch:e=>({...Es(e,"false"),token:A.BoolFalse})},{isMatch:e=>({...yt(e,/^and(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.And})},{isMatch:e=>({...yt(e,/^or(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.Or})},{isMatch:e=>({...yt(e,/^not(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.Not})},{isMatch:e=>({...yt(e,/^elseif(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.ElseIf})},{isMatch:e=>({...yt(e,/^else(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.Else})},{isMatch:e=>({...yt(e,/^if(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.If})},{isMatch:e=>({...yt(e,/^then(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.Then})},{isMatch:e=>({...yt(e,/^endif(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.EndIf})},{isMatch:e=>({...yt(e,/^while(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.While})},{isMatch:e=>({...yt(e,/^endwhile(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.EndWhile})},{isMatch:e=>({...yt(e,/^for(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.For})},{isMatch:e=>({...yt(e,/^next(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.Next})},{isMatch:e=>({...yt(e,/^in(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.In})},{isMatch:e=>({...yt(e,/^to(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.To})},{isMatch:e=>({...yt(e,/^extends(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.Extends})},{isMatch:e=>({...yt(e,/^self(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.Self})},{isMatch:e=>({...yt(e,/^super(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.Super})},{isMatch:e=>({...yt(e,/^new(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),token:A.New})},{isMatch:e=>({...yt(e,/^'.*/),token:A.Comment})},{isMatch:e=>({...yt(e,/^[+-]?([0-9]*[.])?[0-9]+/i),token:A.Number})},{isMatch:e=>({...yt(e,/^"(.*?)"/),token:A.String})},{isMatch:e=>({...yt(e,/^[A-Za-z_][A-Za-z_$0-9]*/),token:A.Variable})}],hM={tokenResolver:pM,newLineToken:A.NewLine};class mM{constructor(t,n,i){Ke(this,"name");Ke(this,"tree");Ke(this,"symbols");this.name=t,this.tree=n,this.symbols=i}}class gM{constructor(t){Ke(this,"results",[]);Ke(this,"symbolTable");this.results=[],this.symbolTable=t}}const Ou={},he=e=>{if(!Ou[e])throw Error(`Cannot find rule with name ${e}`);return Ou[e]},bM=(e,t)=>{if(Ou[e])throw Error(`Duplicate parse rule ${e} found.`);Ou[e]=t};class rt extends Error{constructor(n,i){super(n);Ke(this,"loc");this.name="CompilationError",this.loc=i}}class eo extends Error{constructor(n,i){super(n);Ke(this,"loc");this.name="SymbolError",this.loc=i}}class yM extends Error{constructor(n){super(`An unexpected error occured with the message ${n.name} "${n.message}"
      Stack Trace ${n==null?void 0:n.stack}}`);Ke(this,"innerError");this.name="UnexpectedError",this.innerError=n}}class zn extends Error{constructor(n,i,s){super(`Semantic Error: Expected type(s) ${n.join(", ")} but got ${i.name}`);Ke(this,"loc");this.name="SemanticTypeError",this.loc=s}}class uu extends Error{constructor(n,i){super(n);Ke(this,"loc");this.name="SemanticError",this.loc=i}}class vM{constructor(t,n,i=!1){Ke(this,"value");Ke(this,"name");Ke(this,"stripped");this.value=t,this.name=n,this.stripped=i}}class jE{constructor(t,n,i,s,l){Ke(this,"token");Ke(this,"text");Ke(this,"line");Ke(this,"col");Ke(this,"filename");this.token=t,this.text=n,this.line=i,this.col=s,this.filename=l}loc(){return{line:this.line,col:this.col,filename:this.filename}}}const _M={token:{name:"EndOfFile",value:0,stripped:!1}},Yc=e=>{const{line:t,col:n,filename:i}=e[e.length-1];return new jE(_M.token,"",t,n,i)};class xM{constructor(t){Ke(this,"tokenPtr",0);Ke(this,"tokens",[]);this.tokenPtr=0,this.tokens=t}prev(){return this.tokenPtr===0?Yc(this.tokens):this.tokens[this.tokenPtr-1]}next(){return this.tokenPtr>=this.tokens.length?Yc(this.tokens):this.tokens[this.tokenPtr+1]}at(t){return t>=this.tokens.length?Yc(this.tokens):this.tokens[t]}current(){return this.tokenPtr>=this.tokens.length?Yc(this.tokens):this.tokens[this.tokenPtr]}advance(){this.tokenPtr++}endOfStream(){return this.tokenPtr>=this.tokens.length}}const $E=e=>{"validate"in e&&typeof e.validate=="function"&&e.validate(),e.children.forEach(t=>{$E(t)})},wM=(e,t,n)=>{const i=new xM(t);try{const s=he("Root").parse(i,n,{name:e});return $E(s),new mM(e,s,n)}catch(s){if(s instanceof yM)throw s;if(s instanceof rt||s instanceof uu||s instanceof zn||s instanceof eo){const l=s;throw l.loc||(l.loc=i.current().loc()),l}throw s}},EM=(e,t)=>{const n=new gM(t);return e.forEach(i=>{n.results.push(wM(i.name,i.tokens,t)),t.clearScope()}),n},c0=(e,t,n)=>{let{tokenResolver:i,newLineToken:s}=n,l=[],c=0,d=1,f=t;for(;f.length>0;){let p={match:!1};for(let m of i){if(p=m.isMatch(f),p.match)break;p={match:!1}}if(!p.match)throw new rt(`Unexpected token ${f.substring(0,1)}`);if(c+=p.position,p.token.value===s.value&&(d++,c=0),l.push(new jE(new vM(p.token.value,p.token.name,p.token.stripped),p.text,d,c,e)),p.position===0)break;f=f.substring(p.position)}return l},SM={lex:(e,t)=>{const n=[];return e.lib&&e.lib.length>0&&e.lib.forEach(i=>{n.push({name:i.name,tokens:c0(i.name,i.source,t).filter(s=>!s.token.stripped)})}),e.files.forEach(i=>{n.push({name:i.name.replace(".bas","").toLowerCase(),tokens:c0(i.name,i.source,t).filter(s=>!s.token.stripped)})}),n}},Ru={},ja=e=>{if(!Ru[e])throw Error(`Cannot find transpiler rule with name ${e}`);return Ru[e]},CM=(e,t)=>{if(Ru[e])throw Error(`Duplicate transpiler rule ${e} found.`);Ru[e]=t};function Pe(e){return function(t){const n=new t;CM(e,n)}}const te=dM(["Empty","Root","Block","Expression","Term","Print","Call","CallTerm","Number","String","Add","Subtract","UMinus","Multiply","Divide","Paren","VariableDim","Dim","Clone","FunctionDecl","FunctionCall","FunctionReturn","FunctionTerm","ModuleTerm","VariableList","ExpressionList","ArrayList","ArrayLookup","Assign","ArrayAssign","And","Or","Not","Relation","Equals","NotEquals","LessThan","GreaterThan","LessThanEqualTo","GreaterThanEqualTo","While","If","For","In","To","Variable","PropertyAssign","PropertyTerm","PropertyMethodCall","PropertyMethodTerm","ConstructorDecl","TypedArrayDim","VariableDimAssign","MultiDim","SuperConstructorCall","SuperMethodCall","SuperMethodTerm","DictionaryDim","DictionaryLookup","DictionaryAssign","NewObject","TypedElementAccess"]);class Ji{constructor(t,n){Ke(this,"name","");Ke(this,"type","");this.name=t,this.type=n}}let nd=class{constructor(t,n,i,s,l){Ke(this,"name","");Ke(this,"type","");Ke(this,"scope");Ke(this,"fullScope","");Ke(this,"dataType");Ke(this,"parentClassName");this.name=t,this.type=n,this.scope=i,this.fullScope=s,this.dataType=l}setType(t){this.type=t}setScopeType(t){this.scope.type=t}isScopedToType(t){return this.scope.type===t}};class TM{constructor(t,n=(i,s)=>i===s){Ke(this,"isMatchingType");Ke(this,"table",[]);Ke(this,"index",new Map);Ke(this,"scopes",[]);Ke(this,"currentScope");Ke(this,"defaultType");this.isMatchingType=n,this.currentScope=new Ji("",""),this.scopes.push({...this.currentScope}),this.defaultType=t}indexKey(t,n,i){return`${t.toLowerCase()}::${n}::${i}`}indexSymbol(t){this.index.set(this.indexKey(t.name,t.scope.name,t.fullScope),t)}getFullScopeName(){return this.scopes.map(n=>n.name).filter(n=>n!=="").join(".")}getScope(){return this.currentScope}getScopeName(){return this.scopes.length===0?"":this.scopes[this.scopes.length-1].name}getScopeType(){return this.scopes.length===0?"":this.scopes[this.scopes.length-1].type}setScope(t,n=""){this.scopes.push(new Ji(t,n)),this.currentScope=this.scopes[this.scopes.length-1]}setCurrentScope(t,n=""){this.scopes.length!==0&&(this.scopes[this.scopes.length-1].name=t,this.scopes[this.scopes.length-1].type=n,this.currentScope.name=t,this.currentScope.type=n)}getScopeDepth(){return this.scopes.length}hasScopeOfType(t){return this.scopes.some(n=>n.type===t)}clearScope(){this.scopes.pop(),this.scopes.length===0&&(this.currentScope=new Ji("",""),this.scopes.push({...this.currentScope})),this.currentScope=this.scopes[this.scopes.length-1]}clone(t,n,i,s=this.currentScope){const l=this.table.filter(d=>d.scope.name===n.name).slice(0),c=this.add(t,i,s,n.dataType);return this.setScope(t),l.forEach(d=>{const f=Object.create(Object.getPrototypeOf(d));Object.assign(f,d),f.scope=new Ji(t,n.type),f.fullScope=this.getFullScopeName(),this.table.push(f),this.indexSymbol(f)}),this.clearScope(),c}addTyped(t){if(this.retrieveSymbol(t.name,t.type,t.scope,t.fullScope))throw new eo(`${t.type} ${t.name} in ${t.scope.name} already exists.`);return this.table.push(t),this.indexSymbol(t),t}add(t,n="Variable",i=this.currentScope,s=this.defaultType){(!i||!(i!=null&&i.name))&&(i=new Ji("",""));const l=this.scopes.map(d=>d.name).filter(d=>d!=="").join(".");if(this.retrieveSymbol(t,n,i,l))throw new eo(`${n} ${t} in ${i.name} already exists.`);const c=new nd(t,n,i,l,s);return this.table.push(c),this.indexSymbol(c),c}retrieveSymbol(t,n="Variable",i=void 0,s=""){const l=t.toLowerCase();if(i!==void 0){const p=this.indexKey(l,i.name,s),m=this.index.get(p);return m&&this.isMatchingType(n,m.type)?m:void 0}const c=this.table.filter(p=>p.name.toLowerCase()===l&&this.isMatchingType(n,p.type)),d=new Map(this.scopes.map((p,m)=>[p.name,m]));return c.reduce((p,m)=>{const g=d.get(m.scope.name);if(g===void 0)return p;if(!p)return m;const y=d.get(p.scope.name);return g>y?m:p},void 0)}get(t,n="Variable",i=void 0,s=""){const l=this.retrieveSymbol(t,n,i,s);if(l)return l;throw new eo(`${n} ${t} ${(i==null?void 0:i.name)!==""?"in "+(i==null?void 0:i.name):""} has not been declared yet.`)}mergeSymbolsIntoScope(t,n){const i=this.table.filter(l=>l.scope.name===n);this.setScope(t);const s=this.getFullScopeName();i.forEach(l=>{if(!this.table.some(d=>d.scope.name===t&&d.name.toLowerCase()===l.name.toLowerCase()&&d.type===l.type)){const d=Object.create(Object.getPrototypeOf(l));Object.assign(d,l),d.scope=new Ji(t,l.scope.type),d.fullScope=s,this.table.push(d),this.indexSymbol(d)}}),this.clearScope()}getInScope(t,n,i){const s=t.toLowerCase(),l=this.table.find(c=>c.name.toLowerCase()===s&&this.isMatchingType(n,c.type)&&c.scope.name===i);if(!l)throw new eo(`${n} ${t} in ${i} has not been declared yet.`);return l}check(t,n,i=void 0,s=""){return this.retrieveSymbol(t,n,i,s)!==void 0}getAll(t="Variable",n=this.currentScope,i){return Object.values(Object.fromEntries(Object.entries(this.table).filter(([,l])=>l.type===t&&l.scope.name===n.name&&(i===void 0||l.fullScope===i))))??new Array}}const Nu={},mt=e=>{if(!Nu[e])throw Error(`Cannot find type with name ${e}`);return Nu[e]},OM=(e,t)=>{if(Nu[e])throw Error(`Duplicate type definition ${e} found.`);Nu[e]=t};class Fa{constructor(t,n=[]){Ke(this,"name");Ke(this,"acceptsTypes");this.name=t,this.acceptsTypes=[this.name,...n]}canAccept(t){return this.name===t.name||this.acceptsTypes.includes(t.name)}}function Bs(e){return function(t){const n=new t;OM(e??t.name,n)}}var RM=Object.getOwnPropertyDescriptor,NM=(e,t,n,i)=>{for(var s=i>1?void 0:i?RM(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let xh=class extends Fa{constructor(){super("Boolean",["Number","String","Variant"])}};xh=NM([Bs("Boolean")],xh);const AM=xh,DM=Object.freeze(Object.defineProperty({__proto__:null,default:AM},Symbol.toStringTag,{value:"Module"}));var kM=Object.getOwnPropertyDescriptor,MM=(e,t,n,i)=>{for(var s=i>1?void 0:i?kM(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let wh=class extends Fa{constructor(){super("Number",["Variant"])}};wh=MM([Bs("Number")],wh);const PM=wh,IM=Object.freeze(Object.defineProperty({__proto__:null,default:PM},Symbol.toStringTag,{value:"Module"}));var LM=Object.getOwnPropertyDescriptor,jM=(e,t,n,i)=>{for(var s=i>1?void 0:i?LM(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Eh=class extends Fa{constructor(t){super("Object",[]);Ke(this,"fullName","");this.fullName=t}objectEquals(t){return this.fullName===t}};Eh=jM([Bs("Object")],Eh);const hb=Eh,$M=Object.freeze(Object.defineProperty({__proto__:null,default:hb},Symbol.toStringTag,{value:"Module"}));var zM=Object.getOwnPropertyDescriptor,BM=(e,t,n,i)=>{for(var s=i>1?void 0:i?zM(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Sh=class extends Fa{constructor(){super("String",["Variant"])}};Sh=BM([Bs("String")],Sh);const FM=Sh,UM=Object.freeze(Object.defineProperty({__proto__:null,default:FM},Symbol.toStringTag,{value:"Module"}));var HM=Object.getOwnPropertyDescriptor,qM=(e,t,n,i)=>{for(var s=i>1?void 0:i?HM(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Ch=class extends Fa{constructor(){super("Variant",[])}canAccept(){return!0}};Ch=qM([Bs("Variant")],Ch);const GM=Ch,VM=Object.freeze(Object.defineProperty({__proto__:null,default:GM},Symbol.toStringTag,{value:"Module"}));var KM=Object.getOwnPropertyDescriptor,YM=(e,t,n,i)=>{for(var s=i>1?void 0:i?KM(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Th=class extends Fa{constructor(){super("Void",[])}};Th=YM([Bs("Void")],Th);const XM=Th,WM=Object.freeze(Object.defineProperty({__proto__:null,default:XM},Symbol.toStringTag,{value:"Module"})),ZM=Object.assign({"./definitions/BooleanType.ts":DM,"./definitions/NumberType.ts":IM,"./definitions/ObjectType.ts":$M,"./definitions/StringType.ts":UM,"./definitions/VariantType.ts":VM,"./definitions/VoidType.ts":WM});delete ZM["./index.ts"];const Je={Boolean:"Boolean",Number:"Number",String:"String",Variant:"Variant"},it={Globals:"",Function:"Function",Class:"Class",Constructor:"Constructor"},Ee={Variable:"Variable",Function:"Function",Array:"Array",Parameter:"Parameter",Module:"Module",Object:"Object",Class:"Class",Dictionary:"Dictionary"};class zE extends nd{constructor(n,i,s,l,c=new Array){super(n,i,s,l,mt(Je.Variant));Ke(this,"parameters");this.parameters=c}}class BE extends nd{constructor(n,i,s,l,c,d=null){super(n,i,s,l,mt(Je.Variant));Ke(this,"dimensions");Ke(this,"classSymbol");this.dimensions=c,this.classSymbol=d}}class FE extends nd{constructor(n,i,s,l,c=null){super(n,i,s,l,mt(Je.Variant));Ke(this,"classSymbol");this.classSymbol=c}}const Oe=(e,t,n)=>ja(e.children[t].type).generate(e.children[t],n),rd=(e,t="",n)=>e.children.map(i=>ja(i.type).generate(i,n)).join(t),tn=e=>e.scope.name===""&&e.scope.type===it.Globals?`_${e.name}`:e.type===Ee.Function?`${e.fullScope}.${e.name}`:e.type===Ee.Parameter?`${e.scope.name}_${e.name}`:e.type===Ee.Object?e.scope.type===it.Function?`${e.scope.name}_${e.name}`:e.scope.type===it.Constructor?`this.${e.name}`:e.scope.type===it.Class?`${e.scope.name}.prototype.${e.name}`:`${e.scope.name}.${e.name}`:e.scope.type===it.Function?`${e.scope.name}_${e.name}`:`${e.scope.name}.${e.name}`,QM=(e,t,n)=>e.data.scope.type===it.Class?`${e.data.fullScope}.prototype.${e.data.name} = function(${t}) {${n}};`:`${e.data.fullScope}.${e.data.name} = (${t}) => {${n}};`,JM=(e,t,n,i)=>{const s=i?` extends ${i}`:"";return`${n?`class ${e.data}${s}{ ${n} }`:`class ${e.data}${s}{}`}
    ${t.join(";")}`};var e2=Object.getOwnPropertyDescriptor,t2=(e,t,n,i)=>{for(var s=i>1?void 0:i?e2(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Oh=class{generate(t,n){const i=Oe(t,0,n),s=Oe(t,1,n);return`${i}+${s}`}};Oh=t2([Pe(te.Add)],Oh);const n2=Oh,r2=Object.freeze(Object.defineProperty({__proto__:null,default:n2},Symbol.toStringTag,{value:"Module"}));var i2=Object.getOwnPropertyDescriptor,a2=(e,t,n,i)=>{for(var s=i>1?void 0:i?i2(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Rh=class{generate(t,n){return`${Oe(t,0,n)} && ${Oe(t,1,n)}`}};Rh=a2([Pe(te.And)],Rh);const s2=Rh,l2=Object.freeze(Object.defineProperty({__proto__:null,default:s2},Symbol.toStringTag,{value:"Module"}));var o2=Object.getOwnPropertyDescriptor,c2=(e,t,n,i)=>{for(var s=i>1?void 0:i?o2(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Nh=class{generate(e,t){const n=rd(e.children[0],"][",t);return`${tn(e.data)}[${n}]=${Oe(e,1,t)};`}};Nh=c2([Pe(te.ArrayAssign)],Nh);const u2=Nh,d2=Object.freeze(Object.defineProperty({__proto__:null,default:u2},Symbol.toStringTag,{value:"Module"}));var f2=Object.getOwnPropertyDescriptor,p2=(e,t,n,i)=>{for(var s=i>1?void 0:i?f2(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Ah=class{generate(t,n){return rd(t,"][",n)}};Ah=p2([Pe(te.ArrayList)],Ah);const h2=Ah,m2=Object.freeze(Object.defineProperty({__proto__:null,default:h2},Symbol.toStringTag,{value:"Module"}));var g2=Object.getOwnPropertyDescriptor,b2=(e,t,n,i)=>{for(var s=i>1?void 0:i?g2(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Dh=class{generate(e,t){return`${tn(e.data)}[${Oe(e,0,t)}]`}};Dh=b2([Pe(te.ArrayLookup)],Dh);const y2=Dh,v2=Object.freeze(Object.defineProperty({__proto__:null,default:y2},Symbol.toStringTag,{value:"Module"}));var _2=Object.getOwnPropertyDescriptor,x2=(e,t,n,i)=>{for(var s=i>1?void 0:i?_2(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let kh=class{generate(e,t){return`${tn(e.data)} = ${Oe(e,0,t)};`}};kh=x2([Pe(te.Assign)],kh);const w2=kh,E2=Object.freeze(Object.defineProperty({__proto__:null,default:w2},Symbol.toStringTag,{value:"Module"}));var S2=Object.getOwnPropertyDescriptor,C2=(e,t,n,i)=>{for(var s=i>1?void 0:i?S2(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Mh=class{generate(t,n){let i="";return t.children.forEach(s=>{i=`${i}${ja(s.type).generate(s,n)}
      `}),i}};Mh=C2([Pe(te.Block)],Mh);const T2=Mh,O2=Object.freeze(Object.defineProperty({__proto__:null,default:T2},Symbol.toStringTag,{value:"Module"}));var R2=Object.getOwnPropertyDescriptor,N2=(e,t,n,i)=>{for(var s=i>1?void 0:i?R2(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Ph=class{generate(e,t){return`${Oe(e,0,t)} == ${Oe(e,1,t)}`}};Ph=N2([Pe(te.Equals)],Ph);const A2=Ph,D2=Object.freeze(Object.defineProperty({__proto__:null,default:A2},Symbol.toStringTag,{value:"Module"}));var k2=Object.getOwnPropertyDescriptor,M2=(e,t,n,i)=>{for(var s=i>1?void 0:i?k2(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Ih=class{generate(e,t){return`${Oe(e,0,t)} >= ${Oe(e,1,t)}`}};Ih=M2([Pe(te.GreaterThanEqualTo)],Ih);const P2=Ih,I2=Object.freeze(Object.defineProperty({__proto__:null,default:P2},Symbol.toStringTag,{value:"Module"}));var L2=Object.getOwnPropertyDescriptor,j2=(e,t,n,i)=>{for(var s=i>1?void 0:i?L2(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Lh=class{generate(e,t){return`${Oe(e,0,t)} > ${Oe(e,1,t)}`}};Lh=j2([Pe(te.GreaterThan)],Lh);const $2=Lh,z2=Object.freeze(Object.defineProperty({__proto__:null,default:$2},Symbol.toStringTag,{value:"Module"}));var B2=Object.getOwnPropertyDescriptor,F2=(e,t,n,i)=>{for(var s=i>1?void 0:i?B2(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let jh=class{generate(e,t){return`${Oe(e,0,t)} <= ${Oe(e,1,t)}`}};jh=F2([Pe(te.LessThanEqualTo)],jh);const U2=jh,H2=Object.freeze(Object.defineProperty({__proto__:null,default:U2},Symbol.toStringTag,{value:"Module"}));var q2=Object.getOwnPropertyDescriptor,G2=(e,t,n,i)=>{for(var s=i>1?void 0:i?q2(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let $h=class{generate(e,t){return`${Oe(e,0,t)} < ${Oe(e,1,t)}`}};$h=G2([Pe(te.LessThan)],$h);const V2=$h,K2=Object.freeze(Object.defineProperty({__proto__:null,default:V2},Symbol.toStringTag,{value:"Module"}));var Y2=Object.getOwnPropertyDescriptor,X2=(e,t,n,i)=>{for(var s=i>1?void 0:i?Y2(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let zh=class{generate(e,t){return`${Oe(e,0,t)} != ${Oe(e,1,t)}`}};zh=X2([Pe(te.NotEquals)],zh);const W2=zh,Z2=Object.freeze(Object.defineProperty({__proto__:null,default:W2},Symbol.toStringTag,{value:"Module"}));var Q2=Object.getOwnPropertyDescriptor,J2=(e,t,n,i)=>{for(var s=i>1?void 0:i?Q2(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Bh=class{generate(t,n){const i=Oe(t,0,n);return i.substring(1,i.length-1)}};Bh=J2([Pe(te.Call)],Bh);const eP=Bh,tP=Object.freeze(Object.defineProperty({__proto__:null,default:eP},Symbol.toStringTag,{value:"Module"}));var nP=Object.getOwnPropertyDescriptor,rP=(e,t,n,i)=>{for(var s=i>1?void 0:i?nP(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Fh=class{generate(e,t){const n=Oe(e,0,t);return n.substring(1,n.length-1)}};Fh=rP([Pe(te.CallTerm)],Fh);const iP=Fh,aP=Object.freeze(Object.defineProperty({__proto__:null,default:iP},Symbol.toStringTag,{value:"Module"}));var sP=Object.getOwnPropertyDescriptor,lP=(e,t,n,i)=>{for(var s=i>1?void 0:i?sP(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Uh=class{generate(e,t){const n=tn(e.data.object),i=e.data.classSymbol.name;if(e.children.length>0){const s=Oe(e,0,t);return`${n} = new ${i}(${s});`}return`${n} = null;`}};Uh=lP([Pe(te.Clone)],Uh);const oP=Uh,cP=Object.freeze(Object.defineProperty({__proto__:null,default:oP},Symbol.toStringTag,{value:"Module"}));var uP=Object.getOwnPropertyDescriptor,dP=(e,t,n,i)=>{for(var s=i>1?void 0:i?uP(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};function UE(e,t){return e.type===t?!0:e.children.some(n=>UE(n,t))}let Hh=class{generate(e,t){const n=Oe(e,0,t),i=Oe(e,1,t),s=e.data.className,l=t?t.retrieveSymbol(s,Ee.Class):void 0,c=!!(l!=null&&l.parentClassName),d=UE(e.children[1],te.SuperConstructorCall);return`constructor(${n}) {${c&&!d?"super();":""}${i}}`}};Hh=dP([Pe(te.ConstructorDecl)],Hh);const fP=Hh,pP=Object.freeze(Object.defineProperty({__proto__:null,default:fP},Symbol.toStringTag,{value:"Module"}));var hP=Object.getOwnPropertyDescriptor,mP=(e,t,n,i)=>{for(var s=i>1?void 0:i?hP(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let qh=class{generate(e,t){return`${tn(e.data)}.set(${Oe(e,0,t)},${Oe(e,1,t)});`}};qh=mP([Pe(te.DictionaryAssign)],qh);const gP=qh,bP=Object.freeze(Object.defineProperty({__proto__:null,default:gP},Symbol.toStringTag,{value:"Module"}));var yP=Object.getOwnPropertyDescriptor,vP=(e,t,n,i)=>{for(var s=i>1?void 0:i?yP(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Gh=class{generate(e,t){const n="_createDict()";return e.data.scope.type===it.Class?`${e.data.scope.name}.prototype.${e.data.name} = ${n};`:e.data.scope.type===it.Function||e.data.scope.type===it.Constructor?`let ${tn(e.data)} = ${n};`:`${tn(e.data)} = ${n};`}};Gh=vP([Pe(te.DictionaryDim)],Gh);const _P=Gh,xP=Object.freeze(Object.defineProperty({__proto__:null,default:_P},Symbol.toStringTag,{value:"Module"}));var wP=Object.getOwnPropertyDescriptor,EP=(e,t,n,i)=>{for(var s=i>1?void 0:i?wP(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Vh=class{generate(e,t){return`_sbDictGet(${tn(e.data)},${Oe(e,0,t)})`}};Vh=EP([Pe(te.DictionaryLookup)],Vh);const SP=Vh,CP=Object.freeze(Object.defineProperty({__proto__:null,default:SP},Symbol.toStringTag,{value:"Module"}));var TP=Object.getOwnPropertyDescriptor,OP=(e,t,n,i)=>{for(var s=i>1?void 0:i?TP(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Kh=class{generate(t,n){const s=`_createArray([${Oe(t,0,n)}])`;return t.data.scope.type===it.Class?`${t.data.scope.name}.prototype.${t.data.name} = ${s};`:t.data.scope.type===it.Function||t.data.scope.type===it.Constructor?`let ${tn(t.data)} = ${s};`:`${tn(t.data)} = ${s};`}};Kh=OP([Pe(te.Dim)],Kh);const RP=Kh,NP=Object.freeze(Object.defineProperty({__proto__:null,default:RP},Symbol.toStringTag,{value:"Module"}));var AP=Object.getOwnPropertyDescriptor,DP=(e,t,n,i)=>{for(var s=i>1?void 0:i?AP(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Yh=class{generate(t,n){const i=Oe(t,0,n),s=Oe(t,1,n);return`${i}/${s}`}};Yh=DP([Pe(te.Divide)],Yh);const kP=Yh,MP=Object.freeze(Object.defineProperty({__proto__:null,default:kP},Symbol.toStringTag,{value:"Module"}));var PP=Object.getOwnPropertyDescriptor,IP=(e,t,n,i)=>{for(var s=i>1?void 0:i?PP(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Xh=class{generate(){return""}};Xh=IP([Pe(te.Empty)],Xh);const LP=Xh,jP=Object.freeze(Object.defineProperty({__proto__:null,default:LP},Symbol.toStringTag,{value:"Module"}));var $P=Object.getOwnPropertyDescriptor,zP=(e,t,n,i)=>{for(var s=i>1?void 0:i?$P(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Wh=class{generate(t,n){return rd(t,",",n)}};Wh=zP([Pe(te.ExpressionList)],Wh);const BP=Wh,FP=Object.freeze(Object.defineProperty({__proto__:null,default:BP},Symbol.toStringTag,{value:"Module"}));var UP=Object.getOwnPropertyDescriptor,HP=(e,t,n,i)=>{for(var s=i>1?void 0:i?UP(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Zh=class{generate(t,n){return Oe(t,0,n)}};Zh=HP([Pe(te.Expression)],Zh);const qP=Zh,GP=Object.freeze(Object.defineProperty({__proto__:null,default:qP},Symbol.toStringTag,{value:"Module"}));var VP=Object.getOwnPropertyDescriptor,KP=(e,t,n,i)=>{for(var s=i>1?void 0:i?VP(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Qh=class{generate(t,n){return`for(${Oe(t,0,n)}){${Oe(t,1,n)}}`}};Qh=KP([Pe(te.For)],Qh);const YP=Qh,XP=Object.freeze(Object.defineProperty({__proto__:null,default:YP},Symbol.toStringTag,{value:"Module"}));var WP=Object.getOwnPropertyDescriptor,ZP=(e,t,n,i)=>{for(var s=i>1?void 0:i?WP(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Jh=class{generate(t,n){return`${tn(t.data)}(${Oe(t,0,n)});`}};Jh=ZP([Pe(te.FunctionCall)],Jh);const QP=Jh,JP=Object.freeze(Object.defineProperty({__proto__:null,default:QP},Symbol.toStringTag,{value:"Module"}));var eI=Object.getOwnPropertyDescriptor,tI=(e,t,n,i)=>{for(var s=i>1?void 0:i?eI(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let em=class{generate(e,t){const n=Oe(e,0,t),i=`
        ${Oe(e,1,t)};`;return QM(e,n,i)}};em=tI([Pe(te.FunctionDecl)],em);const nI=em,rI=Object.freeze(Object.defineProperty({__proto__:null,default:nI},Symbol.toStringTag,{value:"Module"}));var iI=Object.getOwnPropertyDescriptor,aI=(e,t,n,i)=>{for(var s=i>1?void 0:i?iI(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let tm=class{generate(e,t){return e.children.length===0?"return;":`return ${Oe(e,0,t)};`}};tm=aI([Pe(te.FunctionReturn)],tm);const sI=tm,lI=Object.freeze(Object.defineProperty({__proto__:null,default:sI},Symbol.toStringTag,{value:"Module"}));var oI=Object.getOwnPropertyDescriptor,cI=(e,t,n,i)=>{for(var s=i>1?void 0:i?oI(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let nm=class{generate(e,t){return`${tn(e.data)}(${Oe(e,0,t)})`}};nm=cI([Pe(te.FunctionTerm)],nm);const uI=nm,dI=Object.freeze(Object.defineProperty({__proto__:null,default:uI},Symbol.toStringTag,{value:"Module"}));var fI=Object.getOwnPropertyDescriptor,pI=(e,t,n,i)=>{for(var s=i>1?void 0:i?fI(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let rm=class{generate(t,n){const i=Oe(t,0,n),s=Oe(t,1,n);if(t.children.length===2)return`if(${i}){${s}}`;const l=Oe(t,2,n);return t.children[2].type===te.If?`if(${i}){${s}}else ${l}`:`if(${i}){${s}}else{${l}}`}};rm=pI([Pe(te.If)],rm);const hI=rm,mI=Object.freeze(Object.defineProperty({__proto__:null,default:hI},Symbol.toStringTag,{value:"Module"}));var gI=Object.getOwnPropertyDescriptor,bI=(e,t,n,i)=>{for(var s=i>1?void 0:i?gI(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let im=class{generate(e){return`${e.data.var} of ${e.data.iterator}`}};im=bI([Pe(te.In)],im);const yI=im,vI=Object.freeze(Object.defineProperty({__proto__:null,default:yI},Symbol.toStringTag,{value:"Module"}));var _I=Object.getOwnPropertyDescriptor,xI=(e,t,n,i)=>{for(var s=i>1?void 0:i?_I(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let am=class{generate(e,t){return e.children.map(n=>ja(n.type).generate(n,t)).join(`
`)}};am=xI([Pe(te.MultiDim)],am);const wI=am,EI=Object.freeze(Object.defineProperty({__proto__:null,default:wI},Symbol.toStringTag,{value:"Module"}));var SI=Object.getOwnPropertyDescriptor,CI=(e,t,n,i)=>{for(var s=i>1?void 0:i?SI(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let sm=class{generate(t,n){const i=Oe(t,0,n),s=Oe(t,1,n);return`${i}*${s}`}};sm=CI([Pe(te.Multiply)],sm);const TI=sm,OI=Object.freeze(Object.defineProperty({__proto__:null,default:TI},Symbol.toStringTag,{value:"Module"}));var RI=Object.getOwnPropertyDescriptor,NI=(e,t,n,i)=>{for(var s=i>1?void 0:i?RI(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let lm=class{generate(e,t){const n=e.data.classSymbol.name;if(e.children.length>0){const i=Oe(e,0,t);return`new ${n}(${i})`}return`new ${n}()`}};lm=NI([Pe(te.NewObject)],lm);const AI=lm,DI=Object.freeze(Object.defineProperty({__proto__:null,default:AI},Symbol.toStringTag,{value:"Module"}));var kI=Object.getOwnPropertyDescriptor,MI=(e,t,n,i)=>{for(var s=i>1?void 0:i?kI(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let om=class{generate(t,n){return`!(${Oe(t,0,n)})`}};om=MI([Pe(te.Not)],om);const PI=om,II=Object.freeze(Object.defineProperty({__proto__:null,default:PI},Symbol.toStringTag,{value:"Module"}));var LI=Object.getOwnPropertyDescriptor,jI=(e,t,n,i)=>{for(var s=i>1?void 0:i?LI(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let cm=class{generate(t,n){return`${Oe(t,0,n)} || ${Oe(t,1,n)}`}};cm=jI([Pe(te.Or)],cm);const $I=cm,zI=Object.freeze(Object.defineProperty({__proto__:null,default:$I},Symbol.toStringTag,{value:"Module"}));var BI=Object.getOwnPropertyDescriptor,FI=(e,t,n,i)=>{for(var s=i>1?void 0:i?BI(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let um=class{generate(e,t){return`(${Oe(e,0,t)})`}};um=FI([Pe(te.Paren)],um);const UI=um,HI=Object.freeze(Object.defineProperty({__proto__:null,default:UI},Symbol.toStringTag,{value:"Module"}));var qI=Object.getOwnPropertyDescriptor,GI=(e,t,n,i)=>{for(var s=i>1?void 0:i?qI(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let dm=class{generate(t,n){return`_print(${Oe(t,0,n)})`}};dm=GI([Pe(te.Print)],dm);const VI=dm,KI=Object.freeze(Object.defineProperty({__proto__:null,default:VI},Symbol.toStringTag,{value:"Module"}));var YI=Object.getOwnPropertyDescriptor,XI=(e,t,n,i)=>{for(var s=i>1?void 0:i?YI(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let fm=class{generate(e,t){return`${e.data.chain} = ${Oe(e,0,t)};`}};fm=XI([Pe(te.PropertyAssign)],fm);const WI=fm,ZI=Object.freeze(Object.defineProperty({__proto__:null,default:WI},Symbol.toStringTag,{value:"Module"}));var QI=Object.getOwnPropertyDescriptor,JI=(e,t,n,i)=>{for(var s=i>1?void 0:i?QI(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let pm=class{generate(e,t){return`${e.data}(${Oe(e,0,t)});`}};pm=JI([Pe(te.PropertyMethodCall)],pm);const eL=pm,tL=Object.freeze(Object.defineProperty({__proto__:null,default:eL},Symbol.toStringTag,{value:"Module"}));var nL=Object.getOwnPropertyDescriptor,rL=(e,t,n,i)=>{for(var s=i>1?void 0:i?nL(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let hm=class{generate(e,t){return`${e.data}(${Oe(e,0,t)})`}};hm=rL([Pe(te.PropertyMethodTerm)],hm);const iL=hm,aL=Object.freeze(Object.defineProperty({__proto__:null,default:iL},Symbol.toStringTag,{value:"Module"}));var sL=Object.getOwnPropertyDescriptor,lL=(e,t,n,i)=>{for(var s=i>1?void 0:i?sL(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let mm=class{generate(e){return e.data}};mm=lL([Pe(te.PropertyTerm)],mm);const oL=mm,cL=Object.freeze(Object.defineProperty({__proto__:null,default:oL},Symbol.toStringTag,{value:"Module"}));var uL=Object.getOwnPropertyDescriptor,dL=(e,t,n,i)=>{for(var s=i>1?void 0:i?uL(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let gm=class{generate(t,n){return`${Oe(t,0,n)}${t.data==="="?"==":t.data}${Oe(t,1,n)}`}};gm=dL([Pe(te.Relation)],gm);const fL=gm,pL=Object.freeze(Object.defineProperty({__proto__:null,default:fL},Symbol.toStringTag,{value:"Module"}));var hL=Object.getOwnPropertyDescriptor,mL=(e,t,n,i)=>{for(var s=i>1?void 0:i?hL(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let bm=class{generate(t,n){const i=t.children.find(p=>p.type===te.ConstructorDecl),s=i?ja(i.type).generate(i,n):void 0,l=t.children.filter(p=>p.type!==te.ConstructorDecl).map(p=>`${ja(p.type).generate(p,n)}`),c=t.data,d=n==null?void 0:n.retrieveSymbol(c,Ee.Class),f=d==null?void 0:d.parentClassName;return JM(t,l,s,f)}};bm=mL([Pe(te.Root)],bm);const gL=bm,bL=Object.freeze(Object.defineProperty({__proto__:null,default:gL},Symbol.toStringTag,{value:"Module"}));var yL=Object.getOwnPropertyDescriptor,vL=(e,t,n,i)=>{for(var s=i>1?void 0:i?yL(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let ym=class{generate(t,n){const i=Oe(t,0,n),s=Oe(t,1,n);return`${i}-${s}`}};ym=vL([Pe(te.Subtract)],ym);const _L=ym,xL=Object.freeze(Object.defineProperty({__proto__:null,default:_L},Symbol.toStringTag,{value:"Module"}));var wL=Object.getOwnPropertyDescriptor,EL=(e,t,n,i)=>{for(var s=i>1?void 0:i?wL(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let vm=class{generate(e,t){return`super(${Oe(e,0,t)});`}};vm=EL([Pe(te.SuperConstructorCall)],vm);const SL=vm,CL=Object.freeze(Object.defineProperty({__proto__:null,default:SL},Symbol.toStringTag,{value:"Module"}));var TL=Object.getOwnPropertyDescriptor,OL=(e,t,n,i)=>{for(var s=i>1?void 0:i?TL(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let _m=class{generate(e,t){const{parentName:n,methodName:i}=e.data,s=Oe(e,0,t),l=s?`, ${s}`:"";return`${n}.prototype.${i}.call(this${l});`}};_m=OL([Pe(te.SuperMethodCall)],_m);const RL=_m,NL=Object.freeze(Object.defineProperty({__proto__:null,default:RL},Symbol.toStringTag,{value:"Module"}));var AL=Object.getOwnPropertyDescriptor,DL=(e,t,n,i)=>{for(var s=i>1?void 0:i?AL(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let xm=class{generate(e,t){const{parentName:n,methodName:i}=e.data,s=Oe(e,0,t),l=s?`, ${s}`:"";return`${n}.prototype.${i}.call(this${l})`}};xm=DL([Pe(te.SuperMethodTerm)],xm);const kL=xm,ML=Object.freeze(Object.defineProperty({__proto__:null,default:kL},Symbol.toStringTag,{value:"Module"}));var PL=Object.getOwnPropertyDescriptor,IL=(e,t,n,i)=>{for(var s=i>1?void 0:i?PL(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let wm=class{generate(t){return t.data.name?tn(t.data):t.data}};wm=IL([Pe(te.Term)],wm);const LL=wm,jL=Object.freeze(Object.defineProperty({__proto__:null,default:LL},Symbol.toStringTag,{value:"Module"}));var $L=Object.getOwnPropertyDescriptor,zL=(e,t,n,i)=>{for(var s=i>1?void 0:i?$L(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Em=class{generate(e,t){return`${tn(e.data)} = ${Oe(e,0,t)}; ${tn(e.data)} <= ${Oe(e,1,t)}; ${tn(e.data)}++`}};Em=zL([Pe(te.To)],Em);const BL=Em,FL=Object.freeze(Object.defineProperty({__proto__:null,default:BL},Symbol.toStringTag,{value:"Module"}));var UL=Object.getOwnPropertyDescriptor,HL=(e,t,n,i)=>{for(var s=i>1?void 0:i?UL(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Sm=class{generate(e,t){const{arraySymbol:n}=e.data,s=`_createTypedArray([${Oe(e,0,t)}], () => null)`;return n.scope.type===it.Class?`${n.scope.name}.prototype.${n.name} = ${s};`:n.scope.type===it.Function||n.scope.type===it.Constructor?`let ${tn(n)} = ${s};`:`${tn(n)} = ${s};`}};Sm=HL([Pe(te.TypedArrayDim)],Sm);const qL=Sm,GL=Object.freeze(Object.defineProperty({__proto__:null,default:qL},Symbol.toStringTag,{value:"Module"}));var VL=Object.getOwnPropertyDescriptor,KL=(e,t,n,i)=>{for(var s=i>1?void 0:i?VL(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Cm=class{generate(e,t){const{collectionSymbol:n,memberName:i,kind:s,isStatement:l}=e.data,c=n.name,d=tn(n),f=Oe(e,0,t);let p,m;if(s==="array")p=`${d}[${f}]`,m=`${c}(0)`;else{p=`_sbDictGet(${d},${f})`;const y=f.replace(/^"|"$/g,"");m=`${c}[${y}]`}const g=`_sbRequireInit(${p},"${m}")`;if(l){const y=e.children.length>1?Oe(e,1,t):"";return`${g}.${i}(${y});`}if(e.children.length>1){const y=Oe(e,1,t);return`${g}.${i}(${y})`}return`${g}.${i}`}};Cm=KL([Pe(te.TypedElementAccess)],Cm);const YL=Cm,XL=Object.freeze(Object.defineProperty({__proto__:null,default:YL},Symbol.toStringTag,{value:"Module"}));var WL=Object.getOwnPropertyDescriptor,ZL=(e,t,n,i)=>{for(var s=i>1?void 0:i?WL(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Tm=class{generate(e,t){return`-(${Oe(e,0,t)})`}};Tm=ZL([Pe(te.UMinus)],Tm);const QL=Tm,JL=Object.freeze(Object.defineProperty({__proto__:null,default:QL},Symbol.toStringTag,{value:"Module"}));var ej=Object.getOwnPropertyDescriptor,tj=(e,t,n,i)=>{for(var s=i>1?void 0:i?ej(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Om=class{generate(e,t){const n=Oe(e,0,t);return e.data.scope.type===it.Class?`${e.data.scope.name}.prototype.${e.data.name} = ${n};`:e.data.scope.type===it.Function||e.data.scope.type===it.Constructor?`${e.data.scope.name}_${e.data.name} = ${n};`:`${e.data.scope.name}.${e.data.name} = ${n};`}};Om=tj([Pe(te.VariableDimAssign)],Om);const nj=Om,rj=Object.freeze(Object.defineProperty({__proto__:null,default:nj},Symbol.toStringTag,{value:"Module"}));var ij=Object.getOwnPropertyDescriptor,aj=(e,t,n,i)=>{for(var s=i>1?void 0:i?ij(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Rm=class{generate(e){return e.data.scope.type===it.Class?`${e.data.scope.name}.prototype.${e.data.name} = undefined;`:e.data.scope.type===it.Function||e.data.scope.type===it.Constructor?`${e.data.scope.name}_${e.data.name} = undefined;`:`${e.data.scope.name}.${e.data.name} = undefined;`}};Rm=aj([Pe(te.VariableDim)],Rm);const sj=Rm,lj=Object.freeze(Object.defineProperty({__proto__:null,default:sj},Symbol.toStringTag,{value:"Module"}));var oj=Object.getOwnPropertyDescriptor,cj=(e,t,n,i)=>{for(var s=i>1?void 0:i?oj(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Nm=class{generate(t,n){return`${rd(t,",",n)}`}};Nm=cj([Pe(te.VariableList)],Nm);const uj=Nm,dj=Object.freeze(Object.defineProperty({__proto__:null,default:uj},Symbol.toStringTag,{value:"Module"}));var fj=Object.getOwnPropertyDescriptor,pj=(e,t,n,i)=>{for(var s=i>1?void 0:i?fj(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Am=class{generate(t,n){return`while(${Oe(t,0,n)}){${Oe(t,1,n)}}`}};Am=pj([Pe(te.While)],Am);const hj=Am,mj=Object.freeze(Object.defineProperty({__proto__:null,default:hj},Symbol.toStringTag,{value:"Module"})),gj=Object.assign({"./jsRules/ruleSets/AddRule.ts":r2,"./jsRules/ruleSets/AndRule.ts":l2,"./jsRules/ruleSets/ArrayAssignRule.ts":d2,"./jsRules/ruleSets/ArrayListRule.ts":m2,"./jsRules/ruleSets/ArrayLookupRule.ts":v2,"./jsRules/ruleSets/AssignRule.ts":E2,"./jsRules/ruleSets/BlockRule.ts":O2,"./jsRules/ruleSets/BoolEqualRule.ts":D2,"./jsRules/ruleSets/BoolGreaterThanEqualToRule.ts":I2,"./jsRules/ruleSets/BoolGreaterThanRule.ts":z2,"./jsRules/ruleSets/BoolLessThanEqualToRule.ts":H2,"./jsRules/ruleSets/BoolLessThanRule.ts":K2,"./jsRules/ruleSets/BoolNotEqualRule.ts":Z2,"./jsRules/ruleSets/CallRule.ts":tP,"./jsRules/ruleSets/CallTermRule.ts":aP,"./jsRules/ruleSets/CloneRule.ts":cP,"./jsRules/ruleSets/ConstructorDeclRule.ts":pP,"./jsRules/ruleSets/DictionaryAssignRule.ts":bP,"./jsRules/ruleSets/DictionaryDimRule.ts":xP,"./jsRules/ruleSets/DictionaryLookupRule.ts":CP,"./jsRules/ruleSets/DimRule.ts":NP,"./jsRules/ruleSets/DivideRule.ts":MP,"./jsRules/ruleSets/EmptyRule.ts":jP,"./jsRules/ruleSets/ExpressionListRule.ts":FP,"./jsRules/ruleSets/ExpressionRule.ts":GP,"./jsRules/ruleSets/ForRule.ts":XP,"./jsRules/ruleSets/FunctionCallRule.ts":JP,"./jsRules/ruleSets/FunctionDeclRule.ts":rI,"./jsRules/ruleSets/FunctionReturnRule.ts":lI,"./jsRules/ruleSets/FunctionTermRule.ts":dI,"./jsRules/ruleSets/IfRule.ts":mI,"./jsRules/ruleSets/InRule.ts":vI,"./jsRules/ruleSets/MultiDimRule.ts":EI,"./jsRules/ruleSets/MultiplyRule.ts":OI,"./jsRules/ruleSets/NewObjectRule.ts":DI,"./jsRules/ruleSets/NotRule.ts":II,"./jsRules/ruleSets/OrRule.ts":zI,"./jsRules/ruleSets/ParenRule.ts":HI,"./jsRules/ruleSets/PrintRule.ts":KI,"./jsRules/ruleSets/PropertyAssignRule.ts":ZI,"./jsRules/ruleSets/PropertyMethodCallRule.ts":tL,"./jsRules/ruleSets/PropertyMethodTermRule.ts":aL,"./jsRules/ruleSets/PropertyTermRule.ts":cL,"./jsRules/ruleSets/RelationRule.ts":pL,"./jsRules/ruleSets/RootRule.ts":bL,"./jsRules/ruleSets/SubtractRule.ts":xL,"./jsRules/ruleSets/SuperConstructorCallRule.ts":CL,"./jsRules/ruleSets/SuperMethodCallRule.ts":NL,"./jsRules/ruleSets/SuperMethodTermRule.ts":ML,"./jsRules/ruleSets/TermRule.ts":jL,"./jsRules/ruleSets/ToRule.ts":FL,"./jsRules/ruleSets/TypedArrayDimRule.ts":GL,"./jsRules/ruleSets/TypedElementAccessRule.ts":XL,"./jsRules/ruleSets/UMinusRule.ts":JL,"./jsRules/ruleSets/VariableDimAssignRule.ts":rj,"./jsRules/ruleSets/VariableDimRule.ts":lj,"./jsRules/ruleSets/VariableListRule.ts":dj,"./jsRules/ruleSets/WhileRule.ts":mj});delete gj["./index.ts"];const HE=(e,t)=>e===t||e==="Variable"&&t==="Parameter",bj=(e,t)=>{if(t.name!==""||t.type!=="")return"";const n=e.getAll("Variable",t).filter(i=>i.type!==Ee.Parameter).map(i=>`let ${tn(i)} = null`).join(`;
`);return n?`${n};
`:""},yj=e=>`
    _sb._sbClasses = [${e.getAll("Module").map(n=>`{name: "${n.name}", symbol: ${n.name}}`).join(",")}];
  `,u0={nodeTypes:te,symbolRules:bj,isMatchingType:HE,terminationRules:yj};class vj{transpile(t,n,i){let s="";const l=[];return s+=t.results.map(c=>{const d=i.symbolRules(n,new Ji(c.name,"")),f=s.length+d.length,p=ja(c.tree.type).generate(c.tree,n);return c.tree.loc&&l.push({src:c.tree.loc,genStart:f,genLength:p.length}),`${d}${p}`}).join(`
`),s+=`;
`+i.terminationRules(n),s}}const qE=(e,t)=>!!e.find(n=>n.value===t.token.value),_j=(e,t)=>{if(!qE(e,t))throw new rt(`Expected ${e.map(i=>i.name).join()} got ${t.token.name}`)},xe=(e,t)=>Array.isArray(e)?qE(e,t):e.value===t.token.value,xj=(e,t)=>{if(!xe(e,t))throw new rt(`Expected ${e.name} got ${t.token.name}`);return!0},H=(e,t)=>{if(Array.isArray(e)){_j(e,t.current()),t.advance();return}xj(e,t.current()),t.advance()};function We(e){return function(t){const n=new t;bM(e??t.name,n)}}class qe{constructor(t,n,i=new Array,s=new Fa("Unknown")){Ke(this,"type");Ke(this,"data");Ke(this,"children");Ke(this,"dataType");Ke(this,"loc");this.type=t,this.data=n,this.children=Array.isArray(i)?i:[i],this.dataType=s}}class mb extends qe{constructor(t,n,i){super(te.Block,t,n),this.loc=i}}var wj=Object.getOwnPropertyDescriptor,Ej=(e,t,n,i)=>{for(var s=i>1?void 0:i?wj(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Dm=class{parse(e,t,n){const i=e.current().loc(),s=new Array,l=n==null?void 0:n.endTokens;for(;!xe(l,e.current());){const c=he(e.current().token.name).parse(e,t,void 0);c&&s.push(c)}return new mb(null,s,i)}};Dm=Ej([We("Block")],Dm);const Sj=Dm,Cj=Object.freeze(Object.defineProperty({__proto__:null,default:Sj},Symbol.toStringTag,{value:"Module"}));class Tj extends qe{constructor(t,n,i){super(te.Call,t,n),this.loc=i}validate(){if(this.children[0].dataType!=mt(Je.String))throw new zn(mt(Je.String).acceptsTypes,this.children[0].dataType)}}const tt=[A.NewLine,A.EndOfFile,A.SoftNewLine],Oj=[A.String,A.Number,A.Variable],Au=[A.BoolTrue,A.BoolFalse],d0=[A.Equals,A.NotEquals,A.GreaterThan,A.GreaterThanEqualTo,A.LessThan,A.LessThanEqualTo];var Rj=Object.getOwnPropertyDescriptor,Nj=(e,t,n,i)=>{for(var s=i>1?void 0:i?Rj(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let km=class{parse(e,t){const n=e.current().loc();H(A.Call,e),H(A.OpenParen,e);const i=he("BoolExpression").parse(e,t,void 0);return H(A.CloseParen,e),H(tt,e),new Tj(null,i,n)}};km=Nj([We("Call")],km);const Aj=km,Dj=Object.freeze(Object.defineProperty({__proto__:null,default:Aj},Symbol.toStringTag,{value:"Module"}));class id extends qe{constructor(t){super(te.Empty,void 0),this.loc=t}}var kj=Object.getOwnPropertyDescriptor,Mj=(e,t,n,i)=>{for(var s=i>1?void 0:i?kj(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Mm=class{parse(e,t){const n=e.current().loc();if(e.current().line!==1)throw new rt("Class declaration must appear at the top of the file");H(A.Class,e),xe(tt,e.current())&&H(tt,e);const i=t.getScopeName(),s=t.get(i,Ee.Module);if(s.setType(Ee.Class),s.setScopeType(it.Class),t.setCurrentScope(t.getScopeName(),it.Class),xe(A.Extends,e.current())){H(A.Extends,e),H(A.Variable,e);const l=e.prev().text.toLowerCase();if(!t.check(l,Ee.Class))throw new rt(`Class '${l}' has not been declared yet`);const c=t.get(l,Ee.Class);if(c.parentClassName)throw new rt(`'${l}' already extends '${c.parentClassName}' — inheritance cannot be chained`);s.parentClassName=l}return xe(tt,e.current())&&H(tt,e),new id(n)}};Mm=Mj([We("Class")],Mm);const Pj=Mm,Ij=Object.freeze(Object.defineProperty({__proto__:null,default:Pj},Symbol.toStringTag,{value:"Module"}));class Lj extends qe{constructor(t,n,i){super(te.ConstructorDecl,t,n),this.loc=i}}var jj=Object.getOwnPropertyDescriptor,$j=(e,t,n,i)=>{for(var s=i>1?void 0:i?jj(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Pm=class{parse(e,t){const n=e.current().loc();if(t.getScopeType()!==it.Class)throw new rt("Constructor must be declared inside a class");H(A.Constructor,e),H(A.OpenParen,e),t.setScope("constructor",it.Constructor);let i,s;try{i=he("VariableList").parse(e,t,void 0),H(A.CloseParen,e),H(tt,e),s=he("Block").parse(e,t,{endTokens:A.EndConstructor}),H(A.EndConstructor,e)}finally{t.clearScope()}if(H(tt,e),t.check("constructor",Ee.Function))throw new rt("A class may only have one constructor");t.addTyped(new zE("constructor",Ee.Function,t.getScope(),t.getFullScopeName(),[]));const l=t.get(t.getScopeName(),Ee.Class);return l.constructorArgCount=i.children.length,new Lj({className:t.getScopeName()},[i,new mb(null,s,n)],n)}};Pm=$j([We("Constructor")],Pm);const zj=Pm,Bj=Object.freeze(Object.defineProperty({__proto__:null,default:zj},Symbol.toStringTag,{value:"Module"}));class f0 extends qe{constructor(t,n=[],i){super(te.Clone,t,n),this.dataType=t.object.dataType,this.loc=i}}class ks extends qe{constructor(t,n,i){super(te.NewObject,t,n),this.loc=i,t!=null&&t.classSymbol&&(this.dataType=t.classSymbol.dataType)}}class gb extends qe{validate(){var n;const t=this.data;if(!t)throw new rt("Expected Variable for assignment operator");if(!((n=t.dataType)!=null&&n.canAccept(this.children[0].dataType)))throw new zn(this.children[0].dataType.acceptsTypes,this.children[1].dataType)}}class Du extends gb{constructor(t,n,i){super(te.Assign,t,n),this.loc=i}}class Fj extends qe{constructor(t,n){super(te.VariableDim,t,new Array),this.loc=n}}class Uj extends qe{constructor(t,n,i){super(te.VariableDimAssign,t,[n]),this.loc=i}}class Hj extends qe{constructor(t,n,i){super(te.Dim,t,n),this.loc=i}}class qj extends qe{constructor(t,n=[],i){super(te.TypedArrayDim,t,n),this.loc=i}}class Gj extends qe{constructor(t,n){super(te.MultiDim,null,t),this.loc=n}}class Vj extends qe{constructor(t,n){super(te.DictionaryDim,t,[]),this.loc=n}}var Kj=Object.getOwnPropertyDescriptor,Yj=(e,t,n,i)=>{for(var s=i>1?void 0:i?Kj(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};function Xc(e,t,n){const i=e.constructorArgCount;if(i!==void 0&&t!==i)throw new rt(`'${n}' constructor expects ${i} argument${i===1?"":"s"} but got ${t}`)}let Im=class{parse(e,t){const n=e.current().loc();H(A.Dim,e);const i=[];for(i.push(this.parseDeclarator(e,t,i,n));xe(A.Comma,e.current());)H(A.Comma,e),i.push(this.parseDeclarator(e,t,i,n));if(i.length===1){const s=i[0];return(s.type===te.Dim||s.type===te.TypedArrayDim||s.type===te.DictionaryDim)&&H(tt,e),s}return new Gj(i,n)}parseDeclarator(e,t,n,i){H(A.Variable,e);const s=e.prev().text.toLowerCase();if(xe(A.Equals,e.current())){if(H(A.Equals,e),xe(A.New,e.current())){H(A.New,e),H(A.Variable,e);const d=e.prev().text,f=t.get(d,Ee.Class),p=t.clone(s,f,Ee.Object);p.classSymbol=f;let m=f;for(;m.parentClassName;){const y=t.get(m.parentClassName,Ee.Class);t.mergeSymbolsIntoScope(s,m.parentClassName),m=y}let g;if(xe(A.OpenParen,e.current())){const y=he("ExpressionList").parse(e,t,void 0);Xc(f,y.children.length,d),g=new ks({classSymbol:f,className:d},[y],i)}else Xc(f,0,d),g=new ks({classSymbol:f,className:d},[],i);return new Du(p,g,i)}const l=t.add(s,Ee.Variable),c=he("BoolExpression").parse(e,t,void 0);return new Uj(l,c,i)}else if(xe(A.As,e.current())){H(A.As,e),H(A.Variable,e);const l=t.get(e.prev().text,Ee.Class),c=t.clone(s,l,Ee.Object);c.classSymbol=l;let d=l;for(;d.parentClassName;){const f=t.get(d.parentClassName,Ee.Class);t.mergeSymbolsIntoScope(s,d.parentClassName),d=f}if(xe(A.Equals,e.current())){H(A.Equals,e),H(A.New,e),H(A.Variable,e);const f=e.prev().text,p=t.get(f,Ee.Class);if(p.name!==l.name)throw new rt(`Type mismatch: '${s}' is declared as '${l.name}' but 'new ${p.name}' was assigned`);let m;if(xe(A.OpenParen,e.current())){const g=he("ExpressionList").parse(e,t,void 0);Xc(p,g.children.length,f),m=new ks({classSymbol:p,className:f},[g],i)}else Xc(p,0,f),m=new ks({classSymbol:p,className:f},[],i);return new Du(c,m,i)}else if(xe(A.OpenParen,e.current())){const f=he("ExpressionList").parse(e,t,void 0);return new f0({object:c,classSymbol:l},[f],i)}else return new f0({object:c,classSymbol:l},[],i)}else if(xe(A.OpenParen,e.current())){const l=he("ExpressionList").parse(e,t,void 0),c=t.addTyped(new BE(s,Ee.Array,t.getScope(),t.getFullScopeName(),l.children.length));let d;if(xe(A.As,e.current())){H(A.As,e),H(A.Variable,e);const f=t.get(e.prev().text,Ee.Class);if(xe(A.OpenParen,e.current()))throw new rt(`Array declaration cannot include a constructor — declare 'dim ${s}(N) as ${f.name}' and assign each element with '${s}(i) = new ${f.name}(...)'`);c.classSymbol=f,d=new qj({arraySymbol:c,classSymbol:f},[l],i)}else d=new Hj(c,l,i);if(n.length>0||xe(A.Comma,e.current())){const f=l.children.map(p=>p.data!==void 0&&p.data!==null?String(p.data):"?").join(", ");throw new rt(`Array declaration '${s}(${f})' cannot appear in a multi-variable dim — move it to its own line.`)}return d}else if(xe(A.OpenBracket,e.current())){if(H(A.OpenBracket,e),!xe(A.CloseBracket,e.current()))throw new rt(`Dictionary declaration must use empty brackets: 'dim ${s}[]'`);H(A.CloseBracket,e);const l=t.addTyped(new FE(s,Ee.Dictionary,t.getScope(),t.getFullScopeName()));if(xe(A.As,e.current())){H(A.As,e),H(A.Variable,e);const c=t.get(e.prev().text,Ee.Class);l.classSymbol=c}if(n.length>0||xe(A.Comma,e.current()))throw new rt(`Dictionary declaration '${s}[]' cannot appear in a multi-variable dim — move it to its own line.`);return new Vj(l,i)}else{const l=t.add(s,Ee.Variable);return new Fj(l,i)}}};Im=Yj([We("Dim")],Im);const Xj=Im,Wj=Object.freeze(Object.defineProperty({__proto__:null,default:Xj},Symbol.toStringTag,{value:"Module"}));var Zj=Object.getOwnPropertyDescriptor,Qj=(e,t,n,i)=>{for(var s=i>1?void 0:i?Zj(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Lm=class{parse(e,t){const n=e.current().loc();return H(A.EndClass,e),xe(tt,e.current())&&H(tt,e),new id(n)}};Lm=Qj([We("EndClass")],Lm);const Jj=Lm,e$=Object.freeze(Object.defineProperty({__proto__:null,default:Jj},Symbol.toStringTag,{value:"Module"}));class ad extends qe{validate(){var t,n;if(!((t=this.dataType)!=null&&t.canAccept(this.children[0].dataType)))throw new zn(this.dataType.acceptsTypes,this.children[0].dataType,this.loc);if(!((n=this.dataType)!=null&&n.canAccept(this.children[1].dataType)))throw new zn(this.dataType.acceptsTypes,this.children[1].dataType,this.loc)}}class t$ extends ad{constructor(t,n,i){super(te.Add,t,n),this.dataType=n[0].dataType,this.loc=i}}var n$=Object.getOwnPropertyDescriptor,r$=(e,t,n,i)=>{for(var s=i>1?void 0:i?n$(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let jm=class{parse(e,t,n){const i=e.current().loc(),s=n==null?void 0:n.term;H(A.Add,e);const l=he("Term").parse(e,t,void 0);return new t$(null,[s,l],i)}};jm=r$([We("Add")],jm);const i$=jm,a$=Object.freeze(Object.defineProperty({__proto__:null,default:i$},Symbol.toStringTag,{value:"Module"}));class GE extends qe{validate(){var t,n;if(!((t=this.children[0].dataType)!=null&&t.canAccept(mt(Je.Boolean))))throw new zn([Je.Boolean],this.children[0].dataType);if(!((n=this.children[1].dataType)!=null&&n.canAccept(mt(Je.Boolean))))throw new zn([Je.Boolean],this.children[1].dataType)}}class s$ extends GE{constructor(t,n,i){super(te.And,t,n),this.dataType=mt(Je.Boolean),this.loc=i}validate(){var t,n;if(!((t=this.children[0].dataType)!=null&&t.canAccept(this.dataType)))throw new zn([Je.Boolean],this.children[0].dataType);if(!((n=this.children[1].dataType)!=null&&n.canAccept(this.dataType)))throw new zn([Je.Boolean],this.children[1].dataType)}}var l$=Object.getOwnPropertyDescriptor,o$=(e,t,n,i)=>{for(var s=i>1?void 0:i?l$(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let $m=class{parse(e,t,n){const i=e.current().loc(),s=n==null?void 0:n.term;return H(A.And,e),new s$(null,[s,he("BoolTerm").parse(e,t,void 0)],i)}};$m=o$([We("And")],$m);const c$=$m,u$=Object.freeze(Object.defineProperty({__proto__:null,default:c$},Symbol.toStringTag,{value:"Module"}));class d$ extends qe{constructor(t,n,i){super(te.ArrayList,t,n),this.loc=i}}var f$=Object.getOwnPropertyDescriptor,p$=(e,t,n,i)=>{for(var s=i>1?void 0:i?f$(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let zm=class{parse(e,t){const n=e.current().loc();let i=[he("Expression").parse(e,t,void 0)];for(;xe(A.Comma,e.current());)H(A.Comma,e),i.push(he("Expression").parse(e,t,void 0));return new d$(null,i,n)}};zm=p$([We("ArrayList")],zm);const h$=zm,m$=Object.freeze(Object.defineProperty({__proto__:null,default:h$},Symbol.toStringTag,{value:"Module"}));var g$=Object.getOwnPropertyDescriptor,b$=(e,t,n,i)=>{for(var s=i>1?void 0:i?g$(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Bm=class{parse(e,t){let n=he("Not").parse(e,t,void 0);for(;xe([A.And,A.Or],e.current());)switch(e.current().token.value){case A.And.value:n=he("And").parse(e,t,{term:n});break;case A.Or.value:n=he("Or").parse(e,t,{term:n});break;default:return n}return n}};Bm=b$([We("BoolExpression")],Bm);const y$=Bm,v$=Object.freeze(Object.defineProperty({__proto__:null,default:y$},Symbol.toStringTag,{value:"Module"}));class VE extends qe{constructor(t,n){super(te.String,t,[]),this.dataType=mt(Je.Boolean),this.loc=n}}class Ma extends qe{constructor(t,n,i){super(te.Term,t,n),this.dataType=n.dataType,this.loc=i}}var _$=Object.getOwnPropertyDescriptor,x$=(e,t,n,i)=>{for(var s=i>1?void 0:i?_$(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Fm=class{parse(e,t){const n=e.current().loc();return xe(Au,e.current())?(H(Au,e),new Ma(e.prev().text,new VE(e.prev().text,n),n)):he("Relation").parse(e,t,void 0)}};Fm=x$([We("BoolFactor")],Fm);const w$=Fm,E$=Object.freeze(Object.defineProperty({__proto__:null,default:w$},Symbol.toStringTag,{value:"Module"}));var S$=Object.getOwnPropertyDescriptor,C$=(e,t,n,i)=>{for(var s=i>1?void 0:i?S$(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Um=class{parse(e,t){return he("BoolFactor").parse(e,t,void 0)}};Um=C$([We("BoolTerm")],Um);const T$=Um,O$=Object.freeze(Object.defineProperty({__proto__:null,default:T$},Symbol.toStringTag,{value:"Module"}));class R$ extends qe{constructor(t,n,i){super(te.CallTerm,t,n),this.dataType=mt(Je.Variant),this.loc=i}validate(){if(this.children[0].dataType!=mt(Je.String))throw new zn(mt(Je.String).acceptsTypes,this.children[0].dataType)}}var N$=Object.getOwnPropertyDescriptor,A$=(e,t,n,i)=>{for(var s=i>1?void 0:i?N$(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Hm=class{parse(e,t){const n=e.current().loc();H(A.Call,e),H(A.OpenParen,e);const i=he("BoolExpression").parse(e,t,void 0);return H(A.CloseParen,e),new R$(null,i,n)}};Hm=A$([We("CallFactor")],Hm);const D$=Hm,k$=Object.freeze(Object.defineProperty({__proto__:null,default:D$},Symbol.toStringTag,{value:"Module"}));class M$ extends ad{constructor(t,n,i){super(te.Divide,t,n),this.dataType=mt(Je.Number),this.loc=i}}var P$=Object.getOwnPropertyDescriptor,I$=(e,t,n,i)=>{for(var s=i>1?void 0:i?P$(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let qm=class{parse(e,t,n){const i=e.current().loc(),s=n==null?void 0:n.factor;H(A.Divide,e);const l=he("Term").parse(e,t,void 0);return new M$(null,[s,l],i)}};qm=I$([We("Divide")],qm);const L$=qm,j$=Object.freeze(Object.defineProperty({__proto__:null,default:L$},Symbol.toStringTag,{value:"Module"}));class p0 extends qe{constructor(t,n,i){super(te.ExpressionList,t,n),this.loc=i}}var $$=Object.getOwnPropertyDescriptor,z$=(e,t,n,i)=>{for(var s=i>1?void 0:i?$$(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Gm=class{parse(e,t){const n=e.current().loc();if(H(A.OpenParen,e),xe(A.CloseParen,e.current()))return H(A.CloseParen,e),new p0(null,void 0,n);let i=[he("BoolExpression").parse(e,t,void 0)];for(;xe(A.Comma,e.current());)H(A.Comma,e),i.push(he("BoolExpression").parse(e,t,void 0));return H(A.CloseParen,e),new p0(null,i,n)}};Gm=z$([We("ExpressionList")],Gm);const B$=Gm,F$=Object.freeze(Object.defineProperty({__proto__:null,default:B$},Symbol.toStringTag,{value:"Module"}));class KE extends qe{constructor(t,n,i){super(te.Expression,t,n),this.loc=i}}class YE extends qe{constructor(t,n,i){super(te.UMinus,t,n),this.dataType=mt(Je.Number),this.loc=i}}var U$=Object.getOwnPropertyDescriptor,H$=(e,t,n,i)=>{for(var s=i>1?void 0:i?U$(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Vm=class{parse(e,t){let n=null;for(xe([A.Add,A.Subtract],e.current())?(H([A.Add,A.Subtract],e),n=new YE(null,he("Term").parse(e,t,void 0))):n=he("Term").parse(e,t,void 0);xe([A.Add,A.Subtract],e.current());)switch(e.current().token.value){case A.Add.value:n=he("Add").parse(e,t,{term:n});break;case A.Subtract.value:n=he("Subtract").parse(e,t,{term:n});break;default:return new KE(null,n)}return n}};Vm=H$([We("Expression")],Vm);const q$=Vm,G$=Object.freeze(Object.defineProperty({__proto__:null,default:q$},Symbol.toStringTag,{value:"Module"}));class V$ extends qe{constructor(t,n){super(te.Number,t,[]),this.dataType=mt(Je.Number),this.loc=n}}class K$ extends qe{constructor(t,n,i){super(te.Paren,t,n),this.dataType=n.dataType,this.loc=i}}class Y$ extends qe{constructor(t,n){super(te.String,t,[]),this.dataType=mt(Je.String),this.loc=n}}var X$=Object.getOwnPropertyDescriptor,W$=(e,t,n,i)=>{for(var s=i>1?void 0:i?X$(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Km=class{parse(e,t){const n=e.current().loc();if(xe([A.Add,A.Subtract],e.current()))return H([A.Add,A.Subtract],e),new YE(null,he("Factor").parse(e,t,void 0),n);if(xe(A.OpenParen,e.current())){H(A.OpenParen,e);const i=he("BoolExpression").parse(e,t,void 0);return H(A.CloseParen,e),new K$(null,i,n)}if(xe(A.Call,e.current()))return he("CallFactor").parse(e,t,void 0);if(xe(A.Self,e.current()))return he("SelfFactor").parse(e,t,void 0);if(xe(A.Super,e.current()))return he("SuperFactor").parse(e,t,void 0);if(xe(A.New,e.current()))return he("NewObjectFactor").parse(e,t,void 0);if(xe(A.Variable,e.current()))return he("VariableFactor").parse(e,t,void 0);if(xe(Au,e.current()))return H(Au,e),new Ma(e.prev().text,new VE(e.prev().text,n),n);if(!xe(Oj,e.current()))throw new rt(`Expected String, Number, Variable but found ${e.current().text}`);if(xe(A.String,e.current()))return H(A.String,e),new Ma(e.prev().text,new Y$(e.prev().text),n);if(xe(A.Number,e.current()))return H(A.Number,e),new Ma(e.prev().text,new V$(e.prev().text),n);throw new rt(`Expected String or Number but found ${e.current().text}`)}};Km=W$([We("Factor")],Km);const Z$=Km,Q$=Object.freeze(Object.defineProperty({__proto__:null,default:Z$},Symbol.toStringTag,{value:"Module"}));class XE extends qe{validate(){const t=this.data,n=this.children[0].children;if(n.length!==t.parameters.length)throw new uu(`Function ${t.name} expects ${t.parameters.length} arguments, but got ${n.length}.`,this.loc);t!=null&&t.parameters&&t.parameters.forEach((i,s)=>{var d,f,p;const l=(f=(d=i==null?void 0:i.classSymbol)==null?void 0:d.name)==null?void 0:f.toLowerCase();if(!l)return;const c=n[s];if(c){if(c.type===te.NewObject){const m=c.data.classSymbol.name.toLowerCase();if(m!==l)throw new uu(`Type mismatch at argument ${s+1}: parameter '${i.name}' expects '${l}' but got 'new ${m}'`,c.loc)}else if((p=c.data)!=null&&p.classSymbol){const m=c.data.classSymbol.name.toLowerCase();if(m!==l)throw new uu(`Type mismatch at argument ${s+1}: parameter '${i.name}' expects '${l}' but got '${m}'`,c.loc)}}})}}class WE extends XE{constructor(t,n,i){super(te.FunctionTerm,t,n),this.dataType=t.dataType||mt(Je.Variant),this.loc=i}}var J$=Object.getOwnPropertyDescriptor,ez=(e,t,n,i)=>{for(var s=i>1?void 0:i?J$(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Ym=class{parse(e,t,n){const i=e.current().loc(),s=n==null?void 0:n.name,l=he("ExpressionList").parse(e,t,void 0),c=t.get(s,"Function");return new WE(c,l,i)}};Ym=ez([We("FunctionFactor")],Ym);const tz=Ym,nz=Object.freeze(Object.defineProperty({__proto__:null,default:tz},Symbol.toStringTag,{value:"Module"}));var rz=Object.getOwnPropertyDescriptor,iz=(e,t,n,i)=>{for(var s=i>1?void 0:i?rz(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Xm=class{parse(e,t,n){const i=n==null?void 0:n.name;H(A.Dot,e),t.setScope(i);let s;try{H(A.Variable,e);const l=e.prev().text,c=t.getInScope(l,Ee.Function,i),d=he("ExpressionList").parse(e,t,void 0);s=new WE(c,d,e.current().loc())}finally{t.clearScope()}return s}};Xm=iz([We("ModuleFactor")],Xm);const az=Xm,sz=Object.freeze(Object.defineProperty({__proto__:null,default:az},Symbol.toStringTag,{value:"Module"}));class lz extends ad{constructor(t,n,i){super(te.Multiply,t,n),this.dataType=mt(Je.Number),this.loc=i}}var oz=Object.getOwnPropertyDescriptor,cz=(e,t,n,i)=>{for(var s=i>1?void 0:i?oz(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Wm=class{parse(e,t,n){const i=e.current().loc(),s=n==null?void 0:n.factor;H(A.Multiply,e);const l=he("Term").parse(e,t,void 0);return new lz(null,[s,l],i)}};Wm=cz([We("Multiply")],Wm);const uz=Wm,dz=Object.freeze(Object.defineProperty({__proto__:null,default:uz},Symbol.toStringTag,{value:"Module"}));var fz=Object.getOwnPropertyDescriptor,pz=(e,t,n,i)=>{for(var s=i>1?void 0:i?fz(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};function h0(e,t,n){const i=e.constructorArgCount;if(i!==void 0&&t!==i)throw new rt(`'${n}' constructor expects ${i} argument${i===1?"":"s"} but got ${t}`)}let Zm=class{parse(e,t){const n=e.current().loc();H(A.New,e),H(A.Variable,e);const i=e.prev().text,s=t.get(i,Ee.Class);if(xe(A.OpenParen,e.current())){const l=he("ExpressionList").parse(e,t,void 0);return h0(s,l.children.length,i),new ks({classSymbol:s,className:i},[l],n)}return h0(s,0,i),new ks({classSymbol:s,className:i},[],n)}};Zm=pz([We("NewObjectFactor")],Zm);const hz=Zm,mz=Object.freeze(Object.defineProperty({__proto__:null,default:hz},Symbol.toStringTag,{value:"Module"}));class gz extends qe{constructor(t,n,i){super(te.Not,t,n),this.dataType=mt(Je.Boolean),this.loc=i}}var bz=Object.getOwnPropertyDescriptor,yz=(e,t,n,i)=>{for(var s=i>1?void 0:i?bz(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Qm=class{parse(e,t){const n=e.current().loc();return xe(A.Not,e.current())?(H(A.Not,e),new gz(null,he("BoolFactor").parse(e,t,void 0),n)):he("BoolTerm").parse(e,t,void 0)}};Qm=yz([We("Not")],Qm);const vz=Qm,_z=Object.freeze(Object.defineProperty({__proto__:null,default:vz},Symbol.toStringTag,{value:"Module"}));class xz extends GE{constructor(t,n,i){super(te.Or,t,n),this.dataType=mt(Je.Boolean),this.loc=i}}var wz=Object.getOwnPropertyDescriptor,Ez=(e,t,n,i)=>{for(var s=i>1?void 0:i?wz(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Jm=class{parse(e,t,n){const i=e.current().loc(),s=n==null?void 0:n.term;return H(A.Or,e),new xz(null,[s,he("BoolTerm").parse(e,t,void 0)],i)}};Jm=Ez([We("Or")],Jm);const Sz=Jm,Cz=Object.freeze(Object.defineProperty({__proto__:null,default:Sz},Symbol.toStringTag,{value:"Module"}));class ZE extends qe{validate(){if(!this.children[0].dataType.canAccept(this.children[1].dataType))throw new zn(this.children[0].dataType.acceptsTypes,this.children[1].dataType)}}class Tz extends ZE{constructor(t,n,i){super(te.Equals,void 0,[t,n]),this.dataType=mt(Je.Boolean),this.loc=i}}class Oz extends ZE{constructor(t,n,i){super(te.NotEquals,void 0,[t,n]),this.dataType=mt(Je.Boolean),this.loc=i}}const m0=[Je.Number,Je.Variant];class sd extends qe{validate(){if(!m0.includes(this.children[0].dataType.name))throw new zn([Je.Number],this.children[0].dataType);if(!m0.includes(this.children[1].dataType.name))throw new zn([Je.Number],this.children[1].dataType)}}class Rz extends sd{constructor(t,n,i){super(te.GreaterThan,void 0,[t,n]),this.dataType=mt(Je.Boolean),this.loc=i}}class Nz extends sd{constructor(t,n,i){super(te.GreaterThanEqualTo,void 0,[t,n]),this.dataType=mt(Je.Boolean),this.loc=i}}class Az extends sd{constructor(t,n,i){super(te.LessThan,void 0,[t,n]),this.dataType=mt(Je.Boolean),this.loc=i}}class Dz extends sd{constructor(t,n,i){super(te.LessThanEqualTo,void 0,[t,n]),this.dataType=mt(Je.Boolean),this.loc=i}}var kz=Object.getOwnPropertyDescriptor,Mz=(e,t,n,i)=>{for(var s=i>1?void 0:i?kz(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let eg=class{parse(e,t){const n=e.current().loc(),i=he("Expression").parse(e,t,void 0);return xe(d0,e.current())?(H(d0,e),this.getRelationNode(e.prev(),i,he("Expression").parse(e,t,void 0),n)):i}getRelationNode(e,t,n,i){switch(e.token.value){case A.Equals.value:return new Tz(t,n,i);case A.NotEquals.value:return new Oz(t,n,i);case A.GreaterThan.value:return new Rz(t,n,i);case A.GreaterThanEqualTo.value:return new Nz(t,n,i);case A.LessThan.value:return new Az(t,n,i);case A.LessThanEqualTo.value:return new Dz(t,n,i);default:throw new rt(`Expected =, <>, <, >, <= or >= found ${e.token.value}`)}}};eg=Mz([We("Relation")],eg);const Pz=eg,Iz=Object.freeze(Object.defineProperty({__proto__:null,default:Pz},Symbol.toStringTag,{value:"Module"}));class tg extends qe{constructor(t,n,i){super(te.PropertyTerm,t,[]),this.dataType=i??new hb(t),this.loc=n}}class ng extends qe{constructor(t,n,i){super(te.PropertyMethodTerm,t,[n]),this.dataType=mt(Je.Variant),this.loc=i}}function bb(e){if(!e.hasScopeOfType(it.Function)&&!e.hasScopeOfType(it.Constructor))throw new rt("'self' can only be used inside a class method or constructor");const n=e.getFullScopeName().split(".")[0];if(!n||!e.check(n,Ee.Class))throw new rt("'self' can only be used inside a class")}const Lz=Object.freeze(Object.defineProperty({__proto__:null,assertInsideClass:bb},Symbol.toStringTag,{value:"Module"}));var jz=Object.getOwnPropertyDescriptor,$z=(e,t,n,i)=>{for(var s=i>1?void 0:i?jz(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let rg=class{parse(e,t){const n=e.current().loc();if(bb(t),H(A.Self,e),!xe(A.Dot,e.current()))return new tg("this",n);H(A.Dot,e),H(A.Variable,e);const i=e.prev().text.toLowerCase();let s=`this.${i}`;if(xe(A.OpenParen,e.current())){const f=he("ExpressionList").parse(e,t,void 0);return new ng(s,f,n)}for(;xe(A.Dot,e.current());)if(H(A.Dot,e),H(A.Variable,e),s+=`.${e.prev().text.toLowerCase()}`,xe(A.OpenParen,e.current())){const f=he("ExpressionList").parse(e,t,void 0);return new ng(s,f,n)}const l=t.getFullScopeName().split(".")[0];let c,d=l;for(;d!==void 0&&c===void 0;)try{c=t.getInScope(i,Ee.Variable,d).dataType}catch{try{d=t.get(d,Ee.Class).parentClassName}catch{d=void 0}}return new tg(s,n,c)}};rg=$z([We("SelfFactor")],rg);const zz=rg,Bz=Object.freeze(Object.defineProperty({__proto__:null,default:zz},Symbol.toStringTag,{value:"Module"}));class Fz extends ad{constructor(t,n,i){super(te.Subtract,t,n),this.dataType=mt(Je.Number),this.loc=i}}var Uz=Object.getOwnPropertyDescriptor,Hz=(e,t,n,i)=>{for(var s=i>1?void 0:i?Uz(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let ig=class{parse(e,t,n){const i=e.current().loc(),s=n==null?void 0:n.term;H(A.Subtract,e);const l=he("Term").parse(e,t,void 0);return new Fz(null,[s,l],i)}};ig=Hz([We("Subtract")],ig);const qz=ig,Gz=Object.freeze(Object.defineProperty({__proto__:null,default:qz},Symbol.toStringTag,{value:"Module"}));class Vz extends qe{constructor(t,n,i){super(te.SuperMethodTerm,t,[n]),this.loc=i}}var Kz=Object.getOwnPropertyDescriptor,Yz=(e,t,n,i)=>{for(var s=i>1?void 0:i?Kz(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let ag=class{parse(e,t){const n=e.current().loc(),s=t.getFullScopeName().split(".")[0],l=t.getScopeType();if(l!==it.Function&&l!==it.Constructor)throw new rt("'super' can only be used inside a class method or constructor");if(!s||!t.check(s,Ee.Class))throw new rt("'super' can only be used inside a class");const d=t.get(s,Ee.Class).parentClassName;if(!d)throw new rt(`'super' used in class '${s}' which has no parent`);H(A.Super,e),H(A.Dot,e),H(A.Variable,e);const f=e.prev().text.toLowerCase();try{t.getInScope(f,Ee.Function,d)}catch{throw new rt(`'${f}' is not defined on parent class '${d}'`)}const p=he("ExpressionList").parse(e,t,void 0);return new Vz({parentName:d,methodName:f},p,n)}};ag=Yz([We("SuperFactor")],ag);const Xz=ag,Wz=Object.freeze(Object.defineProperty({__proto__:null,default:Xz},Symbol.toStringTag,{value:"Module"}));var Zz=Object.getOwnPropertyDescriptor,Qz=(e,t,n,i)=>{for(var s=i>1?void 0:i?Zz(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let sg=class{parse(e,t){const n=e.current().loc();let i=he("Factor").parse(e,t,void 0);for(;xe([A.Multiply,A.Divide],e.current());)switch(e.current().token.value){case A.Multiply.value:i=he("Multiply").parse(e,t,{factor:i});break;case A.Divide.value:i=he("Divide").parse(e,t,{factor:i});break;default:return new KE(null,i,n)}return i}};sg=Qz([We("Term")],sg);const Jz=sg,eB=Object.freeze(Object.defineProperty({__proto__:null,default:Jz},Symbol.toStringTag,{value:"Module"}));class tB extends qe{constructor(t,n,i){super(te.ArrayLookup,t,n),this.dataType=t.dataType,this.loc=i}}class ta extends qe{constructor(t,n,i){super(te.TypedElementAccess,t,n),this.loc=i}}class nB extends qe{constructor(t,n,i){super(te.DictionaryLookup,t,n),this.loc=i}}class lg extends qe{constructor(t,n){super(te.Variable,t,[]),this.dataType=mt(Je.Variant),this.loc=n}}var rB=Object.getOwnPropertyDescriptor,iB=(e,t,n,i)=>{for(var s=i>1?void 0:i?rB(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};function aB(e,t){if(e.scope.type!==it.Class)return!1;const n=t.getScopeType();return n!==it.Function&&n!==it.Constructor?!1:t.getFullScopeName().startsWith(e.scope.name+".")}let og=class{parse(e,t){const n=e.current().loc();H(A.Variable,e);const i=e.prev().text.toLowerCase();if(t.check(i,Ee.Module))return he("ModuleFactor").parse(e,t,{name:i});if(t.check(i,Ee.Object)){const c=t.get(i,Ee.Object),d=tn(c);if(!xe(A.Dot,e.current()))return new Ma(c,new lg(i),n);H(A.Dot,e),H(A.Variable,e);const f=e.prev().text.toLowerCase();if(xe(A.OpenParen,e.current())){t.setScope(i);let m;try{m=he("FunctionFactor").parse(e,t,{name:f})}finally{t.clearScope()}return m}let p=`${d}.${f}`;for(;xe(A.Dot,e.current());)if(H(A.Dot,e),H(A.Variable,e),p+=`.${e.prev().text.toLowerCase()}`,xe(A.OpenParen,e.current())){const m=he("ExpressionList").parse(e,t,void 0);return new ng(p,m,n)}return new tg(p,n)}if(t.check(i,Ee.Function))return he("FunctionFactor").parse(e,t,{name:i});if(xe(A.OpenBracket,e.current())){const c=t.get(i,Ee.Dictionary);H(A.OpenBracket,e);const d=he("BoolExpression").parse(e,t,void 0);if(H(A.CloseBracket,e),c.classSymbol&&xe(A.Dot,e.current())){H(A.Dot,e),H(A.Variable,e);const f=e.prev().text;if(xe(A.OpenParen,e.current())){const p=he("ExpressionList").parse(e,t,void 0);return new ta({collectionSymbol:c,memberName:f,kind:"dict",isStatement:!1},[d,p],n)}return new ta({collectionSymbol:c,memberName:f,kind:"dict",isStatement:!1},[d],n)}return new nB(c,d,n)}if(!xe(A.OpenParen,e.current())){let c;if(t.check(i,Ee.Array)?c=t.get(i,Ee.Array):t.check(i,Ee.Dictionary)?c=t.get(i,Ee.Dictionary):c=t.get(i),aB(c,t))throw new rt(`'${i}' is a class property — use self.${i}`);return new Ma(c,new lg(i),n)}H(A.OpenParen,e);const s=he("ArrayList").parse(e,t,void 0);H(A.CloseParen,e);const l=t.get(i,Ee.Array);if(l.classSymbol&&xe(A.Dot,e.current())){H(A.Dot,e),H(A.Variable,e);const c=e.prev().text;if(xe(A.OpenParen,e.current())){const d=he("ExpressionList").parse(e,t,void 0);return new ta({collectionSymbol:l,memberName:c,kind:"array",isStatement:!1},[s,d],n)}return new ta({collectionSymbol:l,memberName:c,kind:"array",isStatement:!1},[s],n)}return new tB(l,s,n)}};og=iB([We("VariableFactor")],og);const sB=og,lB=Object.freeze(Object.defineProperty({__proto__:null,default:sB},Symbol.toStringTag,{value:"Module"}));class oB extends qe{constructor(t,n,i){super(te.In,t,n),this.loc=i}}class cB extends qe{constructor(t,n,i){super(te.To,t,n),this.loc=i}}var uB=Object.getOwnPropertyDescriptor,dB=(e,t,n,i)=>{for(var s=i>1?void 0:i?uB(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let cg=class{parse(e,t){const n=e.current().loc();H(A.Variable,e);const i=e.prev().text.toLowerCase(),s=t.getScope(),l=t.getFullScopeName(),c=t.check(i,Ee.Variable,s,l)?t.get(i,Ee.Variable,s,l):t.add(i,Ee.Variable,s,Je.Number);if(xe(A.In,e.current())){H(A.In,e),H(A.Variable,e);const p=e.prev().text;return new oB({var:i,iterator:p},[],n)}H(A.Equals,e);const d=he("BoolExpression").parse(e,t,void 0);H(A.To,e);const f=he("BoolExpression").parse(e,t,void 0);return new cB(c,[d,f],n)}};cg=dB([We("ForExpression")],cg);const fB=cg,pB=Object.freeze(Object.defineProperty({__proto__:null,default:fB},Symbol.toStringTag,{value:"Module"}));class hB extends qe{constructor(t,n,i){super(te.For,t,n),this.loc=i}}var mB=Object.getOwnPropertyDescriptor,gB=(e,t,n,i)=>{for(var s=i>1?void 0:i?mB(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let ug=class{parse(e,t){const n=e.current().loc();H(A.For,e);const i=he("ForExpression").parse(e,t,void 0);H(tt,e);const s=he("Block").parse(e,t,{endTokens:A.Next});return H(A.Next,e),xe(A.Variable,e.current())&&H(A.Variable,e),H(tt,e),new hB(null,[i,s],n)}};ug=gB([We("For")],ug);const bB=ug,yB=Object.freeze(Object.defineProperty({__proto__:null,default:bB},Symbol.toStringTag,{value:"Module"}));class vB extends XE{constructor(t,n,i){super(te.FunctionCall,t,n),this.dataType=t.dataType,this.loc=i}}var _B=Object.getOwnPropertyDescriptor,xB=(e,t,n,i)=>{for(var s=i>1?void 0:i?_B(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let dg=class{parse(e,t,n){const i=e.current().loc(),s=n,l=he("ExpressionList").parse(e,t,void 0);return H(tt,e),new vB(s,l,i)}};dg=xB([We("FunctionCall")],dg);const wB=dg,EB=Object.freeze(Object.defineProperty({__proto__:null,default:wB},Symbol.toStringTag,{value:"Module"}));class SB extends qe{constructor(t,n,i){super(te.FunctionDecl,t,n),this.loc=i}}var CB=Object.getOwnPropertyDescriptor,TB=(e,t,n,i)=>{for(var s=i>1?void 0:i?CB(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let fg=class{parse(e,t){var f;const n=e.current().loc();H(A.Function,e),H(A.Variable,e);const i=e.prev().text.toLowerCase();H(A.OpenParen,e),t.setScope(i,it.Function);let s,l,c;try{s=he("VariableList").parse(e,t,void 0),l=((f=s.data)==null?void 0:f.params)??t.getAll(Ee.Parameter,t.getScope(),t.getFullScopeName()),H(A.CloseParen,e),H(tt,e),c=he("Block").parse(e,t,{endTokens:A.EndFunction}),H(A.EndFunction,e)}finally{t.clearScope()}H(tt,e);const d=t.addTyped(new zE(i,Ee.Function,t.getScope(),t.getFullScopeName(),l));return new SB(d,[s,new mb(null,c,n)],n)}};fg=TB([We("Function")],fg);const OB=fg,RB=Object.freeze(Object.defineProperty({__proto__:null,default:OB},Symbol.toStringTag,{value:"Module"}));class QE extends qe{validate(){if(!mt(Je.Boolean).canAccept(this.children[0].dataType))throw new zn(mt(Je.Boolean).acceptsTypes,this.children[0].dataType,this.loc)}}class zp extends QE{constructor(t,n,i){super(te.If,t,n),this.loc=i}}var NB=Object.getOwnPropertyDescriptor,AB=(e,t,n,i)=>{for(var s=i>1?void 0:i?NB(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};const DB=[A.EndIf,A.Else,A.ElseIf];let pg=class{parse(e,t){const n=e.current().loc();return H(A.If,e),this.parseIfBody(e,t,n)}parseIfBody(e,t,n){const i=he("BoolExpression").parse(e,t,void 0);xe(A.Then,e.current())&&H(A.Then,e),H(tt,e);const s=he("Block").parse(e,t,{endTokens:DB});if(xe(A.ElseIf,e.current())){H(A.ElseIf,e);const l=this.parseIfBody(e,t,e.current().loc());return new zp(null,[i,s,l],n)}if(xe(A.Else,e.current())){H(A.Else,e),H(tt,e);const l=he("Block").parse(e,t,{endTokens:A.EndIf});return H(A.EndIf,e),H(tt,e),new zp(null,[i,s,l],n)}return H(A.EndIf,e),H(tt,e),new zp(null,[i,s],n)}};pg=AB([We("If")],pg);const kB=pg,MB=Object.freeze(Object.defineProperty({__proto__:null,default:kB},Symbol.toStringTag,{value:"Module"}));var PB=Object.getOwnPropertyDescriptor,IB=(e,t,n,i)=>{for(var s=i>1?void 0:i?PB(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let hg=class{parse(e,t,n){const i=n;H(A.Dot,e),t.setScope(i);let s;try{H(A.Variable,e);const l=e.prev().text,c=t.getInScope(l,Ee.Function,i);s=he("FunctionCall").parse(e,t,c)}finally{t.clearScope()}return s}};hg=IB([We("Module")],hg);const LB=hg,jB=Object.freeze(Object.defineProperty({__proto__:null,default:LB},Symbol.toStringTag,{value:"Module"}));var $B=Object.getOwnPropertyDescriptor,zB=(e,t,n,i)=>{for(var s=i>1?void 0:i?$B(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let mg=class{parse(e){const t=e.current().loc();return H(A.NewLine,e),new id(t)}};mg=zB([We("NewLine")],mg);const BB=mg,FB=Object.freeze(Object.defineProperty({__proto__:null,default:BB},Symbol.toStringTag,{value:"Module"}));class yb extends qe{constructor(t,n,i){super(te.PropertyAssign,t,[n]),this.loc=i}}class ku extends qe{constructor(t,n,i){super(te.PropertyMethodCall,t,[n]),this.loc=i}}var UB=Object.getOwnPropertyDescriptor,HB=(e,t,n,i)=>{for(var s=i>1?void 0:i?UB(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let gg=class{parse(e,t,n){const i=e.current().loc(),s=n,l=t.get(s,Ee.Object),c=tn(l);H(A.Dot,e),H(A.Variable,e);const d=e.prev().text.toLowerCase();if(xe(A.OpenParen,e.current())){const m=`${c}.${d}`,g=he("ExpressionList").parse(e,t,void 0);return H(tt,e),new ku(m,g,i)}let f=`${c}.${d}`;for(;xe(A.Dot,e.current());)if(H(A.Dot,e),H(A.Variable,e),f+=`.${e.prev().text.toLowerCase()}`,xe(A.OpenParen,e.current())){const m=he("ExpressionList").parse(e,t,void 0);return H(tt,e),new ku(f,m,i)}H(A.Equals,e);const p=he("BoolExpression").parse(e,t,void 0);return H(tt,e),new yb({chain:f},p,i)}};gg=HB([We("ObjectProperty")],gg);const qB=gg,GB=Object.freeze(Object.defineProperty({__proto__:null,default:qB},Symbol.toStringTag,{value:"Module"}));class VB extends qe{constructor(t,n,i){super(te.Print,t,n),this.loc=i}validate(){if(mt(Je.Variant).canAccept(this.children[0].dataType)===!1)throw new zn([Je.String],this.children[0].dataType,this.loc)}}var KB=Object.getOwnPropertyDescriptor,YB=(e,t,n,i)=>{for(var s=i>1?void 0:i?KB(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let bg=class{parse(e,t){const n=e.current().loc();H(A.Print,e);const i=new VB(null,he("BoolExpression").parse(e,t,void 0),n);return H(tt,e),i}};bg=YB([We("Print")],bg);const XB=bg,WB=Object.freeze(Object.defineProperty({__proto__:null,default:XB},Symbol.toStringTag,{value:"Module"}));class g0 extends qe{constructor(t,n,i){super(te.FunctionReturn,t,n?[n]:[]),n&&(this.dataType=n.dataType),this.loc=i}}var ZB=Object.getOwnPropertyDescriptor,QB=(e,t,n,i)=>{for(var s=i>1?void 0:i?ZB(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let yg=class{parse(e,t){const n=e.current().loc(),i=t.getScopeType();if(i!==it.Function&&i!==it.Constructor)throw new rt("Return statement must be inside a function or constructor");if(H(A.Return,e),xe(tt,e.current()))return H(tt,e),new g0(null,void 0,n);const s=he("BoolExpression").parse(e,t,void 0);return H(tt,e),new g0(null,s,n)}};yg=QB([We("Return")],yg);const JB=yg,e3=Object.freeze(Object.defineProperty({__proto__:null,default:JB},Symbol.toStringTag,{value:"Module"}));class t3 extends qe{constructor(t,n,i){super(te.Root,t,n),this.loc=i}}var n3=Object.getOwnPropertyDescriptor,r3=(e,t,n,i)=>{for(var s=i>1?void 0:i?n3(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let vg=class{parse(e,t,n){const i=n==null?void 0:n.name,s=new Array;t.add(i,Ee.Module,t.getScope(),new hb(`${t.getFullScopeName()}.${i}`)),t.setScope(i);let l;try{for(;!xe(A.EndOfFile,e.current());){const c=he(e.current().token.name).parse(e,t,void 0);c&&s.push(c)}l=new t3(t.getScopeName(),s)}finally{t.clearScope()}return l}};vg=r3([We("Root")],vg);const i3=vg,a3=Object.freeze(Object.defineProperty({__proto__:null,default:i3},Symbol.toStringTag,{value:"Module"}));var s3=Object.getOwnPropertyDescriptor,l3=(e,t,n,i)=>{for(var s=i>1?void 0:i?s3(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let _g=class{parse(e,t){const n=e.current().loc();bb(t),H(A.Self,e),H(A.Dot,e),H(A.Variable,e);let s=`this.${e.prev().text.toLowerCase()}`;if(xe(A.OpenParen,e.current())){const c=he("ExpressionList").parse(e,t,void 0);return H(tt,e),new ku(s,c,n)}for(;xe(A.Dot,e.current());)if(H(A.Dot,e),H(A.Variable,e),s+=`.${e.prev().text.toLowerCase()}`,xe(A.OpenParen,e.current())){const c=he("ExpressionList").parse(e,t,void 0);return H(tt,e),new ku(s,c,n)}H(A.Equals,e);const l=he("BoolExpression").parse(e,t,void 0);return H(tt,e),new yb({chain:s},l,n)}};_g=l3([We("Self")],_g);const o3=_g,c3=Object.freeze(Object.defineProperty({__proto__:null,default:o3},Symbol.toStringTag,{value:"Module"}));var u3=Object.getOwnPropertyDescriptor,d3=(e,t,n,i)=>{for(var s=i>1?void 0:i?u3(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let xg=class{parse(e){const t=e.current().loc();return H(A.SoftNewLine,e),new id(t)}};xg=d3([We("SoftNewLine")],xg);const f3=xg,p3=Object.freeze(Object.defineProperty({__proto__:null,default:f3},Symbol.toStringTag,{value:"Module"}));class h3 extends qe{constructor(t,n,i){super(te.SuperConstructorCall,t,[n]),this.loc=i}}class m3 extends qe{constructor(t,n,i){super(te.SuperMethodCall,t,[n]),this.loc=i}}var g3=Object.getOwnPropertyDescriptor,b3=(e,t,n,i)=>{for(var s=i>1?void 0:i?g3(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let wg=class{parse(e,t){const n=e.current().loc(),s=t.getFullScopeName().split(".")[0];if(!s||!t.check(s,Ee.Class))throw new rt("'super' can only be used inside a class");const c=t.get(s,Ee.Class).parentClassName;if(!c)throw new rt(`'super' used in class '${s}' which has no parent`);if(H(A.Super,e),xe(A.OpenParen,e.current())){if(t.getScopeType()!==it.Constructor)throw new rt("super() can only be called in a constructor");if(t.check("__supercall__",Ee.Variable,t.getScope(),t.getFullScopeName()))throw new rt("super() called more than once in constructor");t.add("__supercall__",Ee.Variable);const f=he("ExpressionList").parse(e,t,void 0);return H(tt,e),new h3({parentName:c},f,n)}if(xe(A.Dot,e.current())){const d=t.getScopeType();if(d!==it.Function&&d!==it.Constructor)throw new rt("'super' can only be used inside a class method or constructor");H(A.Dot,e),H(A.Variable,e);const f=e.prev().text.toLowerCase();try{t.getInScope(f,Ee.Function,c)}catch{throw new rt(`'${f}' is not defined on parent class '${c}'`)}const p=he("ExpressionList").parse(e,t,void 0);return H(tt,e),new m3({parentName:c,methodName:f},p,n)}throw new rt("Expected '(' or '.' after 'super'")}};wg=b3([We("Super")],wg);const y3=wg,v3=Object.freeze(Object.defineProperty({__proto__:null,default:y3},Symbol.toStringTag,{value:"Module"}));class _3 extends qe{constructor(t,n,i){super(te.VariableList,t,n),this.loc=i}}var x3=Object.getOwnPropertyDescriptor,w3=(e,t,n,i)=>{for(var s=i>1?void 0:i?x3(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Eg=class{parse(e,t){const n=e.current().loc(),i=[],s=[];for(;xe(A.Variable,e.current());){H(A.Variable,e);const l=e.prev().text;let c;if(xe(A.OpenParen,e.current())){if(H(A.OpenParen,e),H(A.CloseParen,e),c=t.addTyped(new BE(l,Ee.Array,t.getScope(),t.getFullScopeName(),1)),xe(A.As,e.current())){H(A.As,e),H(A.Variable,e);const d=t.get(e.prev().text,Ee.Class);c.classSymbol=d}}else if(xe(A.OpenBracket,e.current())){if(H(A.OpenBracket,e),H(A.CloseBracket,e),c=t.addTyped(new FE(l,Ee.Dictionary,t.getScope(),t.getFullScopeName())),xe(A.As,e.current())){H(A.As,e),H(A.Variable,e);const d=t.get(e.prev().text,Ee.Class);c.classSymbol=d}}else if(xe(A.As,e.current())){H(A.As,e),H(A.Variable,e);const d=t.get(e.prev().text,Ee.Class);c=t.clone(l,d,Ee.Object),c.classSymbol=d;let f=d;for(;f.parentClassName;)t.mergeSymbolsIntoScope(l,f.parentClassName),f=t.get(f.parentClassName,Ee.Class)}else c=t.add(l,Ee.Parameter);if(c.isParam=!0,s.push(c),i.push(new Ma(c,new lg(l),n)),!xe(A.Comma,e.current()))break;H(A.Comma,e)}return new _3({params:s},i,n)}};Eg=w3([We("VariableList")],Eg);const E3=Eg,S3=Object.freeze(Object.defineProperty({__proto__:null,default:E3},Symbol.toStringTag,{value:"Module"}));class b0 extends gb{constructor(t,n,i){super(te.ArrayAssign,t,n),this.dataType=mt(Je.Variant),this.loc=i}}class C3 extends gb{constructor(t,n,i){super(te.DictionaryAssign,t,n),this.dataType=mt(Je.Variant),this.loc=i}}var T3=Object.getOwnPropertyDescriptor,O3=(e,t,n,i)=>{for(var s=i>1?void 0:i?T3(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};function y0(e,t){if(e.scope.type!==it.Class)return!1;const n=t.getScopeType();return n!==it.Function&&n!==it.Constructor?!1:t.getFullScopeName().startsWith(e.scope.name+".")}let Sg=class{parse(e,t){var d,f,p,m;const n=e.current().loc();H(A.Variable,e);const i=e.prev().text.toLowerCase();if(t.check(i,Ee.Module))return he("Module").parse(e,t,i);if(t.check(i,Ee.Object)){if(xe(A.Dot,e.current()))return he("ObjectProperty").parse(e,t,i);const g=t.get(i,Ee.Object);H(A.Equals,e);const y=he("BoolExpression").parse(e,t,void 0);if(y.type===te.NewObject){const v=(d=g.classSymbol)==null?void 0:d.name,_=y.data.classSymbol.name;if(v&&v!==_)throw new rt(`Type mismatch: '${i}' is typed as '${v}' but 'new ${_}' was assigned`)}return H(tt,e),y0(g,t)?new yb({chain:`this.${i}`},y,n):new Du(g,y,n)}if(t.check(i,Ee.Function)){const g=t.get(i,"Function");return he("FunctionCall").parse(e,t,g)}if(t.check(i,Ee.Dictionary)){const g=t.get(i,Ee.Dictionary);H(A.OpenBracket,e);const y=he("BoolExpression").parse(e,t,void 0);if(H(A.CloseBracket,e),g.classSymbol&&xe(A.Dot,e.current())){H(A.Dot,e),H(A.Variable,e);const _=e.prev().text;if(xe(A.OpenParen,e.current())){const T=he("ExpressionList").parse(e,t,void 0);return H(tt,e),new ta({collectionSymbol:g,memberName:_,kind:"dict",isStatement:!0},[y,T],n)}return H(tt,e),new ta({collectionSymbol:g,memberName:_,kind:"dict",isStatement:!1},[y],n)}H(A.Equals,e);const v=he("BoolExpression").parse(e,t,void 0);if(v.type===te.NewObject){const _=(f=g.classSymbol)==null?void 0:f.name,T=v.data.classSymbol.name;if(_&&_!==T)throw new rt(`Type mismatch: '${i}' holds values of type '${_}' but 'new ${T}' was assigned`)}return H(tt,e),new C3(g,[y,v],n)}if(t.check(i,Ee.Array)){const g=t.get(i,Ee.Array);if(g.classSymbol){const y=he("ExpressionList").parse(e,t,void 0);if(xe(A.Dot,e.current())){H(A.Dot,e),H(A.Variable,e);const _=e.prev().text;if(xe(A.OpenParen,e.current())){const T=he("ExpressionList").parse(e,t,void 0);return H(tt,e),new ta({collectionSymbol:g,memberName:_,kind:"array",isStatement:!0},[y,T],n)}return H(tt,e),new ta({collectionSymbol:g,memberName:_,kind:"array",isStatement:!1},[y],n)}H(A.Equals,e);const v=he("BoolExpression").parse(e,t,void 0);if(v.type===te.NewObject){const _=(p=g.classSymbol)==null?void 0:p.name,T=v.data.classSymbol.name;if(_&&_!==T)throw new rt(`Type mismatch: '${i}' holds elements of type '${_}' but 'new ${T}' was assigned`)}return H(tt,e),new b0(g,[y,v],n)}}if(t.check(i,Ee.Array)||xe(A.OpenParen,e.current())&&t.check(i,Ee.Parameter)){const g=he("ExpressionList").parse(e,t,void 0);H(A.Equals,e);const y=he("BoolExpression").parse(e,t,void 0),v=t.check(i,Ee.Array)?t.get(i,"Array"):t.get(i,Ee.Variable);if(y.type===te.NewObject){const _=(m=v.classSymbol)==null?void 0:m.name,T=y.data.classSymbol.name;if(_&&_!==T)throw new rt(`Type mismatch: '${i}' holds elements of type '${_}' but 'new ${T}' was assigned`)}return H(tt,e),new b0(v,[g,y],n)}const l=t.get(i,Ee.Variable);if(y0(l,t))throw new rt(`'${i}' is a class property — use self.${i}`);H(A.Equals,e);const c=he("BoolExpression").parse(e,t,void 0);if(c.type===te.NewObject)throw new rt(`Cannot assign object to variant variable '${i}'. Declare it as 'dim ${i} as ${c.data.classSymbol.name}'.`);return H(tt,e),new Du(l,c,n)}};Sg=O3([We("Variable")],Sg);const R3=Sg,N3=Object.freeze(Object.defineProperty({__proto__:null,default:R3},Symbol.toStringTag,{value:"Module"}));class A3 extends QE{constructor(t,n,i){super(te.While,t,n),this.loc=i}}var D3=Object.getOwnPropertyDescriptor,k3=(e,t,n,i)=>{for(var s=i>1?void 0:i?D3(t,n):t,l=e.length-1,c;l>=0;l--)(c=e[l])&&(s=c(s)||s);return s};let Cg=class{parse(e,t){const n=e.current().loc();H(A.While,e);const i=he("BoolExpression").parse(e,t,void 0);H(tt,e);const s=he("Block").parse(e,t,{endTokens:A.EndWhile});return H(A.EndWhile,e),H(tt,e),new A3(null,[i,s],n)}};Cg=k3([We("While")],Cg);const M3=Cg,P3=Object.freeze(Object.defineProperty({__proto__:null,default:M3},Symbol.toStringTag,{value:"Module"})),I3=Object.assign({"./rules/BlockRule.ts":Cj,"./rules/CallRule.ts":Dj,"./rules/ClassRule.ts":Ij,"./rules/ConstructorRule.ts":Bj,"./rules/DimRule.ts":Wj,"./rules/EndClassRule.ts":e$,"./rules/Expressions/AddRule.ts":a$,"./rules/Expressions/AndRule.ts":u$,"./rules/Expressions/ArrayListRule.ts":m$,"./rules/Expressions/BoolExpressionRule.ts":v$,"./rules/Expressions/BoolFactorRule.ts":E$,"./rules/Expressions/BoolTermRule.ts":O$,"./rules/Expressions/CallFactorRule.ts":k$,"./rules/Expressions/DivideRule.ts":j$,"./rules/Expressions/ExpressionListRule.ts":F$,"./rules/Expressions/ExpressionRule.ts":G$,"./rules/Expressions/FactorRule.ts":Q$,"./rules/Expressions/FunctionFactorRule.ts":nz,"./rules/Expressions/ModuleFactorRule.ts":sz,"./rules/Expressions/MultiplyRule.ts":dz,"./rules/Expressions/NewObjectFactorRule.ts":mz,"./rules/Expressions/NotRule.ts":_z,"./rules/Expressions/OrRule.ts":Cz,"./rules/Expressions/RelationRule.ts":Iz,"./rules/Expressions/SelfFactorRule.ts":Bz,"./rules/Expressions/SubtractRule.ts":Gz,"./rules/Expressions/SuperFactorRule.ts":Wz,"./rules/Expressions/TermRule.ts":eB,"./rules/Expressions/VariableFactorRule.ts":lB,"./rules/ForExpressionRule.ts":pB,"./rules/ForRule.ts":yB,"./rules/FunctionCallRule.ts":EB,"./rules/FunctionRule.ts":RB,"./rules/IfRule.ts":MB,"./rules/ModuleRule.ts":jB,"./rules/NewLineRule.ts":FB,"./rules/ObjectPropertyRule.ts":GB,"./rules/PrintRule.ts":WB,"./rules/ReturnRule.ts":e3,"./rules/RootRule.ts":a3,"./rules/SelfRule.ts":c3,"./rules/SoftNewLineRule.ts":p3,"./rules/SuperRule.ts":v3,"./rules/VariableListRule.ts":S3,"./rules/VariableRule.ts":N3,"./rules/WhileRule.ts":P3,"./rules/classGuards.ts":Lz});delete I3["./index.ts"];const JE=e=>SM.lex(e,hM),eS=e=>EM(JE(e),new TM(mt(Je.Variant),HE)),L3=e=>{try{const t=new vj,n=eS(e);return{code:u0.symbolRules(n.symbolTable,new Ji("",""))+t.transpile(n,n.symbolTable,u0),diagnostics:[]}}catch(t){const n=t;return{diagnostics:[{message:n.message,severity:"error",loc:n.loc}]}}},j3={lexOnly:JE,parse:eS,transpile:L3},$3=`' Start of Math functions\r
function abs(n):return call("Math.abs(abs_n)"):endfunction\r
function acos(n):return call("Math.acos(acos_n)"):endfunction\r
function acosh(n):return call("Math.acosh(acosh_n)"):endfunction\r
function asin(n):return call("Math.asin(asin_n)"):endfunction\r
function asinh(n):return call("Math.asinh(asinh_n)"):endfunction\r
function atan(n):return call("Math.atan(atan_n)"):endfunction\r
function atan2(n1, n2):return call("Math.atan2(atan2_n1,atan2_n2)"):endfunction\r
function atanh(n):return call("Math.atanh(atanh_n)"):endfunction\r
function cbrt(n):return call("Math.cbrt(cbrt_n)"):endfunction\r
function ceil(n):return call("Math.ceil(ceil_n)"):endfunction\r
function cos(n):return call("Math.cos(cos_n)"):endfunction\r
function cosh(n):return call("Math.cosh(cosh_n)"):endfunction\r
function euler():return call("Math.E"):endfunction\r
function exp(n):return call("Math.exp(exp_n)"):endfunction\r
function floor(n):return call("Math.floor(floor_n)"):endfunction\r
function log(n):return call("Math.log(log_n)"):endfunction\r
function log2(n):return call("Math.log2(log2_n)"):endfunction\r
function log10(n):return call("Math.log10(log10_n)"):endfunction\r
function pi(): return call("Math.PI"):endfunction\r
function pow(x,y):return call("Math.pow(pow_x,pow_y)"):endfunction\r
function random(max):return call("Math.random()*random_max"):endfunction\r
function randomint(max):return call("Math.floor(Math.random()*randomint_max)"):endfunction\r
function min(a, b):return call("Math.min(min_a,min_b)"):endfunction\r
function max(a, b):return call("Math.max(max_a,max_b)"):endfunction\r
function clamp(v, lo, hi):return call("Math.min(Math.max(clamp_v,clamp_lo),clamp_hi)"):endfunction\r
function lerp(a, b, t):return call("lerp_a+(lerp_b-lerp_a)*lerp_t"):endfunction\r
function distance(x1, y1, x2, y2):return call("Math.sqrt(Math.pow(distance_x2-distance_x1,2)+Math.pow(distance_y2-distance_y1,2))"):endfunction\r
function round(n):return call("Math.round(round_n)"):endfunction\r
function sign(n):return call("Math.sign(sign_n)"):endfunction\r
function sin(n):return call("Math.sin(sin_n)"):endfunction\r
function sinh(n):return call("Math.sinh(sinh_n)"):endfunction\r
function sqrt(n):return call("Math.sqrt(sqrt_n)"):endfunction\r
function tan(n):return call("Math.tan(tan_n)"):endfunction\r
function tanh(n):return call("Math.tanh(tanh_n)"):endfunction\r
function trunc(n):return call("Math.trunc(trunc_n)"):endfunction\r
function val(s):return call("Number(val_s)"):endfunction\r
' End of Math functions\r
`,z3=`' Start of string functions\r
function len(s):return call("len_s.length"):endfunction\r
function lcase(s):return call("lcase_s.toLowerCase()"):endfunction\r
function padstart(s, n, p): return call("padstart_s.padStart(padstart_n,padstart_p)"):endfunction\r
function padend(s, n, p): return call("padend_s.padEnd(padend_n,padend_p)"):endfunction\r
function split(s, c): return call("split_s.split(split_c)"):endfunction\r
function str(n):return call("str_n.toString()"):endfunction\r
function substr(s, start, end):return call("substr_s.substring(substr_start,substr_end)"):endfunction\r
function trim(s):return call("trim_s.trim()"):endfunction\r
function ucase(s):return call("ucase_s.toUpperCase()"):endfunction\r
function replace(s, a, b):return call("replace_s.replaceAll(replace_a,replace_b)"):endfunction\r
function contains(s, sub):return call("contains_s.includes(contains_sub)"):endfunction\r
function indexof(s, sub):return call("indexof_s.indexOf(indexof_sub)"):endfunction\r
function char(n):return call("String.fromCharCode(char_n)"):endfunction\r
function asc(s):return call("asc_s.charCodeAt(0)"):endfunction\r
' End of string functions\r
`,B3=`' Start of Array functions
function arrLength(a): return call("arrlength_a.length"):endfunction
function length(col): return call("_sbLength(length_col)"):endfunction
function join(col, sep): return call("_sbJoin(join_col, join_sep)"):endfunction
function push(arr, item): call("push_arr.push(push_item)"):endfunction
function pop(arr): return call("pop_arr.pop()"):endfunction
function contains(col, item): return call("_sbContains(contains_col, contains_item)"):endfunction
function indexOf(arr, item): return call("indexof_arr.indexOf(indexof_item)"):endfunction
function remove(col, key): call("_sbRemove(remove_col, remove_key)"):endfunction
function clear(col): call("_sbClear(clear_col)"):endfunction
' End of Array functions
`,F3=`function boxCollide(a, b)
    return call("_sb.boxCollide(boxcollide_a, boxcollide_b)")
endfunction
`,U3=`function getKeyDown(keycode)
    return call("_sb.getKeyDown(getkeydown_keycode)")
endfunction

function mouseX()
    return call("_sb.getMouseX()")
endfunction

function mouseY()
    return call("_sb.getMouseY()")
endfunction

function mouseDown()
    return call("_sb.getMouseDown()")
endfunction
`,H3=`function drawLine(x, y, x2, y2)\r
    call("_sb.drawLine(drawline_x, drawline_y, drawline_x2, drawline_y2)")\r
endfunction\r
\r
function drawRect(x, y, width, height)\r
    call("_sb.drawRect(drawrect_x, drawrect_y, drawrect_width, drawrect_height)")\r
endfunction\r
\r
function drawCircle(x, y, radius)\r
    call("_sb.drawCircle(drawcircle_x, drawcircle_y, drawcircle_radius)")\r
endfunction`,q3=`function add(obj)\r
    call("_sb.addToStage(add_obj)")\r
endfunction\r
\r
function remove(obj)\r
    call("_sb.removeFromStage(remove_obj)")\r
endfunction\r
\r
function clear()\r
    call("_sb.clear()")\r
endfunction\r
\r
function width()\r
    return call("_sb.getStageWidth()")\r
endfunction\r
\r
function height()\r
    return call("_sb.getStageHeight()")\r
endfunction\r
\r
function setBackground(r, g, b)\r
    call("_sb.setBackground(setbackground_r, setbackground_g, setbackground_b)")\r
endfunction\r
`,G3=`function setFillColor(r, g, b)\r
    call("_sb.setFillColor(setfillcolor_r, setfillcolor_g, setfillcolor_b)")\r
endfunction\r
\r
function setLineColor(r, g, b)\r
    call("_sb.setLineColor(setlinecolor_r, setlinecolor_g, setlinecolor_b)")\r
endfunction\r
\r
function setLineWidth(n)\r
    call("_sb.setLineWidth(setlinewidth_n)")\r
endfunction\r
`,V3=`Class\r
dim _handle\r
\r
Constructor(content, x, y)\r
    self._handle = call("_sb.createText(constructor_content, constructor_x, constructor_y)")\r
EndConstructor\r
\r
function setText(content)\r
    call("_sb.setText(this._handle, settext_content)")\r
endfunction\r
\r
function setPosition(x, y)\r
    call("_sb.setPosition(this._handle, setposition_x, setposition_y)")\r
endfunction\r
\r
function setAlpha(a)\r
    call("_sb.setAlpha(this._handle, setalpha_a)")\r
endfunction\r
\r
function setStyle(size, r, g, b)\r
    call("_sb.setTextStyle(this._handle, setstyle_size, setstyle_r, setstyle_g, setstyle_b)")\r
endfunction\r
\r
EndClass\r
`,K3=`function loadImage(name)\r
    return call("_sb.get(loadimage_name)")\r
endfunction`,Y3=`Class
dim _handle

Constructor(handle)
    self._handle = call("constructor_handle")
EndConstructor

function setPosition(x, y)
    call("_sb.setPosition(this._handle, setposition_x, setposition_y)")
endfunction

function x()
    return call("_sb.getPositionX(this._handle)")
endfunction

function y()
    return call("_sb.getPositionY(this._handle)")
endfunction

EndClass
`,X3=`Class\r
dim _handle\r
\r
Constructor(imagePath)\r
    self._handle = call("_sb.createSprite(constructor_imagePath)")\r
    dim transform as ObjectTransform(call("this._handle"))\r
EndConstructor\r
\r
function setAngle(angle)\r
    call("_sb.setAngle(this._handle, setangle_angle)")\r
endfunction\r
\r
function setAlpha(a)\r
    call("_sb.setAlpha(this._handle, setalpha_a)")\r
endfunction\r
\r
function setScale(sx, sy)\r
    call("_sb.setScale(this._handle, setscale_sx, setscale_sy)")\r
endfunction\r
\r
function setFlip(h, v)\r
    call("_sb.setFlip(this._handle, setflip_h, setflip_v)")\r
endfunction\r
\r
function setVisible(v)\r
    call("_sb.setVisible(this._handle, setvisible_v)")\r
endfunction\r
\r
function setTexture(path)\r
    call("_sb.setTexture(this._handle, settexture_path)")\r
endfunction\r
\r
function width()\r
    return call("_sb.getSpriteWidth(this._handle)")\r
endfunction\r
\r
function height()\r
    return call("_sb.getSpriteHeight(this._handle)")\r
endfunction\r
\r
EndClass\r
`,W3=`Class
dim _handle

Constructor(imagePath, frameW, frameH)
    self._handle = call("_sb.createAnimatedSprite(constructor_imagePath, constructor_frameW, constructor_frameH)")
    dim transform as ObjectTransform(call("this._handle"))
EndConstructor

function addAnim(name, startFrame, endFrame, fps, loop)
    call("_sb.addAnim(this._handle, addanim_name, addanim_startFrame, addanim_endFrame, addanim_fps, addanim_loop)")
endfunction

function play(name)
    call("_sb.playAnim(this._handle, play_name)")
endfunction

function isPlaying(name)
    return call("_sb.isPlayingAnim(this._handle, isplaying_name)")
endfunction

function setAngle(angle)
    call("_sb.setAnimAngle(this._handle, setangle_angle)")
endfunction

function setAlpha(a)
    call("_sb.setAnimAlpha(this._handle, setalpha_a)")
endfunction

function setScale(sx, sy)
    call("_sb.setAnimScale(this._handle, setscale_sx, setscale_sy)")
endfunction

function setFlip(h, v)
    call("_sb.setAnimFlip(this._handle, setflip_h, setflip_v)")
endfunction

function setVisible(v)
    call("_sb.setAnimVisible(this._handle, setvisible_v)")
endfunction

function width()
    return call("_sb.getAnimWidth(this._handle)")
endfunction

function height()
    return call("_sb.getAnimHeight(this._handle)")
endfunction

EndClass
`,Z3=`Class
dim _handle

Constructor(tilesetPath, tileW, tileH)
    self._handle = call("_sb.createTileMap(constructor_tilesetPath, constructor_tileW, constructor_tileH)")
    dim transform as ObjectTransform(call("this._handle"))
EndConstructor

function load(jsonPath)
    call("_sb.loadTileMap(this._handle, load_jsonPath)")
endfunction

function tileAt(x, y)
    return call("_sb.tileAt(this._handle, tileat_x, tileat_y)")
endfunction

function widthPx()
    return call("_sb.tileMapWidthPx(this._handle)")
endfunction

function heightPx()
    return call("_sb.tileMapHeightPx(this._handle)")
endfunction

EndClass
`,Q3={math:$3,string:z3,array:B3,gfx:F3,input:U3,drawing:H3,stage:q3,pen:G3,text:V3,assetmanager:K3,ObjectTransform:Y3,sprite:X3,animatedsprite:W3,tilemap:Z3},J3=["softcore","softgfx"],eF=e=>{const t=an(c=>{const d=c.projects.items.find(f=>f.id===e);return(d==null?void 0:d.packageIds)??J3}),n=an(c=>c.packages.byId),i=ed(e),s=t.flatMap(c=>{const d=n[c];return d?d.moduleNames.map(f=>({name:f,source:Q3[f]??""})).filter(f=>f.source!==""):[]}),l=i.map(c=>({name:c.name,source:c.source}));return{lib:s,files:l}},tF=e=>{const t=Or(),n=eF(e),i=an(c=>c.session.isRunning);return{run:()=>{t(Hx()),t(to({type:$n.Notice,text:"Compiling project..."}));const c=j3.transpile(n);c.diagnostics.length>0?(c.diagnostics.forEach(d=>{const f=d.loc?` (${d.loc.filename}:${d.loc.line}:${d.loc.col})`:"";t(to({type:$n.Error,text:d.message+f}))}),t(Mp(!1)),t(kp(""))):(t(to({type:$n.Notice,text:"Project compiled successfully..."})),t(kp(c.code)),t(Mp(!0)))},stop:()=>{t(Mp(!1)),t(Hx()),t(kp(""))},isRunning:i}};function nF(e){return!!e&&typeof e.type=="string"&&typeof e.message=="string"}const rF=()=>{const e=Or();E.useEffect(()=>{const t=n=>{if(n.origin===window.location.origin&&nF(n.data))switch(n.data.type){case"console.log":e(to({type:$n.Output,text:n.data.message}));break;case"runtimeError":e(to({type:$n.Error,text:n.data.message}));break;default:return}};return window.addEventListener("message",t),()=>window.removeEventListener("message",t)},[e])},iF=()=>{const e=Or(),t=an(n=>n.files.dirtyFileIds);E.useEffect(()=>{if(t.length===0)return;const n=setTimeout(()=>{e(cA())},500);return()=>clearTimeout(n)},[t,e])};function aF(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return E.useMemo(()=>i=>{t.forEach(s=>s(i))},t)}const ld=typeof window<"u"&&typeof window.document<"u"&&typeof window.document.createElement<"u";function Fs(e){const t=Object.prototype.toString.call(e);return t==="[object Window]"||t==="[object global]"}function vb(e){return"nodeType"in e}function Wn(e){var t,n;return e?Fs(e)?e:vb(e)&&(t=(n=e.ownerDocument)==null?void 0:n.defaultView)!=null?t:window:window}function _b(e){const{Document:t}=Wn(e);return e instanceof t}function wo(e){return Fs(e)?!1:e instanceof Wn(e).HTMLElement}function tS(e){return e instanceof Wn(e).SVGElement}function Us(e){return e?Fs(e)?e.document:vb(e)?_b(e)?e:wo(e)||tS(e)?e.ownerDocument:document:document:document}const Zr=ld?E.useLayoutEffect:E.useEffect;function xb(e){const t=E.useRef(e);return Zr(()=>{t.current=e}),E.useCallback(function(){for(var n=arguments.length,i=new Array(n),s=0;s<n;s++)i[s]=arguments[s];return t.current==null?void 0:t.current(...i)},[])}function sF(){const e=E.useRef(null),t=E.useCallback((i,s)=>{e.current=setInterval(i,s)},[]),n=E.useCallback(()=>{e.current!==null&&(clearInterval(e.current),e.current=null)},[]);return[t,n]}function ho(e,t){t===void 0&&(t=[e]);const n=E.useRef(e);return Zr(()=>{n.current!==e&&(n.current=e)},t),n}function Eo(e,t){const n=E.useRef();return E.useMemo(()=>{const i=e(n.current);return n.current=i,i},[...t])}function Mu(e){const t=xb(e),n=E.useRef(null),i=E.useCallback(s=>{s!==n.current&&(t==null||t(s,n.current)),n.current=s},[]);return[n,i]}function Tg(e){const t=E.useRef();return E.useEffect(()=>{t.current=e},[e]),t.current}let Bp={};function So(e,t){return E.useMemo(()=>{if(t)return t;const n=Bp[e]==null?0:Bp[e]+1;return Bp[e]=n,e+"-"+n},[e,t])}function nS(e){return function(t){for(var n=arguments.length,i=new Array(n>1?n-1:0),s=1;s<n;s++)i[s-1]=arguments[s];return i.reduce((l,c)=>{const d=Object.entries(c);for(const[f,p]of d){const m=l[f];m!=null&&(l[f]=m+e*p)}return l},{...t})}}const Ms=nS(1),Pu=nS(-1);function lF(e){return"clientX"in e&&"clientY"in e}function wb(e){if(!e)return!1;const{KeyboardEvent:t}=Wn(e.target);return t&&e instanceof t}function oF(e){if(!e)return!1;const{TouchEvent:t}=Wn(e.target);return t&&e instanceof t}function Og(e){if(oF(e)){if(e.touches&&e.touches.length){const{clientX:t,clientY:n}=e.touches[0];return{x:t,y:n}}else if(e.changedTouches&&e.changedTouches.length){const{clientX:t,clientY:n}=e.changedTouches[0];return{x:t,y:n}}}return lF(e)?{x:e.clientX,y:e.clientY}:null}const Is=Object.freeze({Translate:{toString(e){if(!e)return;const{x:t,y:n}=e;return"translate3d("+(t?Math.round(t):0)+"px, "+(n?Math.round(n):0)+"px, 0)"}},Scale:{toString(e){if(!e)return;const{scaleX:t,scaleY:n}=e;return"scaleX("+t+") scaleY("+n+")"}},Transform:{toString(e){if(e)return[Is.Translate.toString(e),Is.Scale.toString(e)].join(" ")}},Transition:{toString(e){let{property:t,duration:n,easing:i}=e;return t+" "+n+"ms "+i}}}),v0="a,frame,iframe,input:not([type=hidden]):not(:disabled),select:not(:disabled),textarea:not(:disabled),button:not(:disabled),*[tabindex]";function cF(e){return e.matches(v0)?e:e.querySelector(v0)}const uF={display:"none"};function dF(e){let{id:t,value:n}=e;return Wt.createElement("div",{id:t,style:uF},n)}function fF(e){let{id:t,announcement:n,ariaLiveType:i="assertive"}=e;const s={position:"fixed",top:0,left:0,width:1,height:1,margin:-1,border:0,padding:0,overflow:"hidden",clip:"rect(0 0 0 0)",clipPath:"inset(100%)",whiteSpace:"nowrap"};return Wt.createElement("div",{id:t,style:s,role:"status","aria-live":i,"aria-atomic":!0},n)}function pF(){const[e,t]=E.useState("");return{announce:E.useCallback(i=>{i!=null&&t(i)},[]),announcement:e}}const rS=E.createContext(null);function hF(e){const t=E.useContext(rS);E.useEffect(()=>{if(!t)throw new Error("useDndMonitor must be used within a children of <DndContext>");return t(e)},[e,t])}function mF(){const[e]=E.useState(()=>new Set),t=E.useCallback(i=>(e.add(i),()=>e.delete(i)),[e]);return[E.useCallback(i=>{let{type:s,event:l}=i;e.forEach(c=>{var d;return(d=c[s])==null?void 0:d.call(c,l)})},[e]),t]}const gF={draggable:`
    To pick up a draggable item, press the space bar.
    While dragging, use the arrow keys to move the item.
    Press space again to drop the item in its new position, or press escape to cancel.
  `},bF={onDragStart(e){let{active:t}=e;return"Picked up draggable item "+t.id+"."},onDragOver(e){let{active:t,over:n}=e;return n?"Draggable item "+t.id+" was moved over droppable area "+n.id+".":"Draggable item "+t.id+" is no longer over a droppable area."},onDragEnd(e){let{active:t,over:n}=e;return n?"Draggable item "+t.id+" was dropped over droppable area "+n.id:"Draggable item "+t.id+" was dropped."},onDragCancel(e){let{active:t}=e;return"Dragging was cancelled. Draggable item "+t.id+" was dropped."}};function yF(e){let{announcements:t=bF,container:n,hiddenTextDescribedById:i,screenReaderInstructions:s=gF}=e;const{announce:l,announcement:c}=pF(),d=So("DndLiveRegion"),[f,p]=E.useState(!1);if(E.useEffect(()=>{p(!0)},[]),hF(E.useMemo(()=>({onDragStart(g){let{active:y}=g;l(t.onDragStart({active:y}))},onDragMove(g){let{active:y,over:v}=g;t.onDragMove&&l(t.onDragMove({active:y,over:v}))},onDragOver(g){let{active:y,over:v}=g;l(t.onDragOver({active:y,over:v}))},onDragEnd(g){let{active:y,over:v}=g;l(t.onDragEnd({active:y,over:v}))},onDragCancel(g){let{active:y,over:v}=g;l(t.onDragCancel({active:y,over:v}))}}),[l,t])),!f)return null;const m=Wt.createElement(Wt.Fragment,null,Wt.createElement(dF,{id:i,value:s.draggable}),Wt.createElement(fF,{id:d,announcement:c}));return n?As.createPortal(m,n):m}var hn;(function(e){e.DragStart="dragStart",e.DragMove="dragMove",e.DragEnd="dragEnd",e.DragCancel="dragCancel",e.DragOver="dragOver",e.RegisterDroppable="registerDroppable",e.SetDroppableDisabled="setDroppableDisabled",e.UnregisterDroppable="unregisterDroppable"})(hn||(hn={}));function Iu(){}function iS(e,t){return E.useMemo(()=>({sensor:e,options:t??{}}),[e,t])}function aS(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return E.useMemo(()=>[...t].filter(i=>i!=null),[...t])}const zr=Object.freeze({x:0,y:0});function vF(e,t){return Math.sqrt(Math.pow(e.x-t.x,2)+Math.pow(e.y-t.y,2))}function _F(e,t){let{data:{value:n}}=e,{data:{value:i}}=t;return n-i}function xF(e,t){let{data:{value:n}}=e,{data:{value:i}}=t;return i-n}function wF(e,t){if(!e||e.length===0)return null;const[n]=e;return n[t]}function _0(e,t,n){return t===void 0&&(t=e.left),n===void 0&&(n=e.top),{x:t+e.width*.5,y:n+e.height*.5}}const sS=e=>{let{collisionRect:t,droppableRects:n,droppableContainers:i}=e;const s=_0(t,t.left,t.top),l=[];for(const c of i){const{id:d}=c,f=n.get(d);if(f){const p=vF(_0(f),s);l.push({id:d,data:{droppableContainer:c,value:p}})}}return l.sort(_F)};function EF(e,t){const n=Math.max(t.top,e.top),i=Math.max(t.left,e.left),s=Math.min(t.left+t.width,e.left+e.width),l=Math.min(t.top+t.height,e.top+e.height),c=s-i,d=l-n;if(i<s&&n<l){const f=t.width*t.height,p=e.width*e.height,m=c*d,g=m/(f+p-m);return Number(g.toFixed(4))}return 0}const SF=e=>{let{collisionRect:t,droppableRects:n,droppableContainers:i}=e;const s=[];for(const l of i){const{id:c}=l,d=n.get(c);if(d){const f=EF(d,t);f>0&&s.push({id:c,data:{droppableContainer:l,value:f}})}}return s.sort(xF)};function CF(e,t,n){return{...e,scaleX:t&&n?t.width/n.width:1,scaleY:t&&n?t.height/n.height:1}}function lS(e,t){return e&&t?{x:e.left-t.left,y:e.top-t.top}:zr}function TF(e){return function(n){for(var i=arguments.length,s=new Array(i>1?i-1:0),l=1;l<i;l++)s[l-1]=arguments[l];return s.reduce((c,d)=>({...c,top:c.top+e*d.y,bottom:c.bottom+e*d.y,left:c.left+e*d.x,right:c.right+e*d.x}),{...n})}}const OF=TF(1);function RF(e){if(e.startsWith("matrix3d(")){const t=e.slice(9,-1).split(/, /);return{x:+t[12],y:+t[13],scaleX:+t[0],scaleY:+t[5]}}else if(e.startsWith("matrix(")){const t=e.slice(7,-1).split(/, /);return{x:+t[4],y:+t[5],scaleX:+t[0],scaleY:+t[3]}}return null}function NF(e,t,n){const i=RF(t);if(!i)return e;const{scaleX:s,scaleY:l,x:c,y:d}=i,f=e.left-c-(1-s)*parseFloat(n),p=e.top-d-(1-l)*parseFloat(n.slice(n.indexOf(" ")+1)),m=s?e.width/s:e.width,g=l?e.height/l:e.height;return{width:m,height:g,top:p,right:f+m,bottom:p+g,left:f}}const AF={ignoreTransform:!1};function Hs(e,t){t===void 0&&(t=AF);let n=e.getBoundingClientRect();if(t.ignoreTransform){const{transform:p,transformOrigin:m}=Wn(e).getComputedStyle(e);p&&(n=NF(n,p,m))}const{top:i,left:s,width:l,height:c,bottom:d,right:f}=n;return{top:i,left:s,width:l,height:c,bottom:d,right:f}}function x0(e){return Hs(e,{ignoreTransform:!0})}function DF(e){const t=e.innerWidth,n=e.innerHeight;return{top:0,left:0,right:t,bottom:n,width:t,height:n}}function kF(e,t){return t===void 0&&(t=Wn(e).getComputedStyle(e)),t.position==="fixed"}function MF(e,t){t===void 0&&(t=Wn(e).getComputedStyle(e));const n=/(auto|scroll|overlay)/;return["overflow","overflowX","overflowY"].some(s=>{const l=t[s];return typeof l=="string"?n.test(l):!1})}function Eb(e,t){const n=[];function i(s){if(t!=null&&n.length>=t||!s)return n;if(_b(s)&&s.scrollingElement!=null&&!n.includes(s.scrollingElement))return n.push(s.scrollingElement),n;if(!wo(s)||tS(s)||n.includes(s))return n;const l=Wn(e).getComputedStyle(s);return s!==e&&MF(s,l)&&n.push(s),kF(s,l)?n:i(s.parentNode)}return e?i(e):n}function oS(e){const[t]=Eb(e,1);return t??null}function Fp(e){return!ld||!e?null:Fs(e)?e:vb(e)?_b(e)||e===Us(e).scrollingElement?window:wo(e)?e:null:null}function cS(e){return Fs(e)?e.scrollX:e.scrollLeft}function uS(e){return Fs(e)?e.scrollY:e.scrollTop}function Rg(e){return{x:cS(e),y:uS(e)}}var _n;(function(e){e[e.Forward=1]="Forward",e[e.Backward=-1]="Backward"})(_n||(_n={}));function dS(e){return!ld||!e?!1:e===document.scrollingElement}function fS(e){const t={x:0,y:0},n=dS(e)?{height:window.innerHeight,width:window.innerWidth}:{height:e.clientHeight,width:e.clientWidth},i={x:e.scrollWidth-n.width,y:e.scrollHeight-n.height},s=e.scrollTop<=t.y,l=e.scrollLeft<=t.x,c=e.scrollTop>=i.y,d=e.scrollLeft>=i.x;return{isTop:s,isLeft:l,isBottom:c,isRight:d,maxScroll:i,minScroll:t}}const PF={x:.2,y:.2};function IF(e,t,n,i,s){let{top:l,left:c,right:d,bottom:f}=n;i===void 0&&(i=10),s===void 0&&(s=PF);const{isTop:p,isBottom:m,isLeft:g,isRight:y}=fS(e),v={x:0,y:0},_={x:0,y:0},T={height:t.height*s.y,width:t.width*s.x};return!p&&l<=t.top+T.height?(v.y=_n.Backward,_.y=i*Math.abs((t.top+T.height-l)/T.height)):!m&&f>=t.bottom-T.height&&(v.y=_n.Forward,_.y=i*Math.abs((t.bottom-T.height-f)/T.height)),!y&&d>=t.right-T.width?(v.x=_n.Forward,_.x=i*Math.abs((t.right-T.width-d)/T.width)):!g&&c<=t.left+T.width&&(v.x=_n.Backward,_.x=i*Math.abs((t.left+T.width-c)/T.width)),{direction:v,speed:_}}function LF(e){if(e===document.scrollingElement){const{innerWidth:l,innerHeight:c}=window;return{top:0,left:0,right:l,bottom:c,width:l,height:c}}const{top:t,left:n,right:i,bottom:s}=e.getBoundingClientRect();return{top:t,left:n,right:i,bottom:s,width:e.clientWidth,height:e.clientHeight}}function pS(e){return e.reduce((t,n)=>Ms(t,Rg(n)),zr)}function jF(e){return e.reduce((t,n)=>t+cS(n),0)}function $F(e){return e.reduce((t,n)=>t+uS(n),0)}function zF(e,t){if(t===void 0&&(t=Hs),!e)return;const{top:n,left:i,bottom:s,right:l}=t(e);oS(e)&&(s<=0||l<=0||n>=window.innerHeight||i>=window.innerWidth)&&e.scrollIntoView({block:"center",inline:"center"})}const BF=[["x",["left","right"],jF],["y",["top","bottom"],$F]];class Sb{constructor(t,n){this.rect=void 0,this.width=void 0,this.height=void 0,this.top=void 0,this.bottom=void 0,this.right=void 0,this.left=void 0;const i=Eb(n),s=pS(i);this.rect={...t},this.width=t.width,this.height=t.height;for(const[l,c,d]of BF)for(const f of c)Object.defineProperty(this,f,{get:()=>{const p=d(i),m=s[l]-p;return this.rect[f]+m},enumerable:!0});Object.defineProperty(this,"rect",{enumerable:!1})}}class ro{constructor(t){this.target=void 0,this.listeners=[],this.removeAll=()=>{this.listeners.forEach(n=>{var i;return(i=this.target)==null?void 0:i.removeEventListener(...n)})},this.target=t}add(t,n,i){var s;(s=this.target)==null||s.addEventListener(t,n,i),this.listeners.push([t,n,i])}}function FF(e){const{EventTarget:t}=Wn(e);return e instanceof t?e:Us(e)}function Up(e,t){const n=Math.abs(e.x),i=Math.abs(e.y);return typeof t=="number"?Math.sqrt(n**2+i**2)>t:"x"in t&&"y"in t?n>t.x&&i>t.y:"x"in t?n>t.x:"y"in t?i>t.y:!1}var Cr;(function(e){e.Click="click",e.DragStart="dragstart",e.Keydown="keydown",e.ContextMenu="contextmenu",e.Resize="resize",e.SelectionChange="selectionchange",e.VisibilityChange="visibilitychange"})(Cr||(Cr={}));function w0(e){e.preventDefault()}function UF(e){e.stopPropagation()}var Ct;(function(e){e.Space="Space",e.Down="ArrowDown",e.Right="ArrowRight",e.Left="ArrowLeft",e.Up="ArrowUp",e.Esc="Escape",e.Enter="Enter",e.Tab="Tab"})(Ct||(Ct={}));const hS={start:[Ct.Space,Ct.Enter],cancel:[Ct.Esc],end:[Ct.Space,Ct.Enter,Ct.Tab]},HF=(e,t)=>{let{currentCoordinates:n}=t;switch(e.code){case Ct.Right:return{...n,x:n.x+25};case Ct.Left:return{...n,x:n.x-25};case Ct.Down:return{...n,y:n.y+25};case Ct.Up:return{...n,y:n.y-25}}};class mS{constructor(t){this.props=void 0,this.autoScrollEnabled=!1,this.referenceCoordinates=void 0,this.listeners=void 0,this.windowListeners=void 0,this.props=t;const{event:{target:n}}=t;this.props=t,this.listeners=new ro(Us(n)),this.windowListeners=new ro(Wn(n)),this.handleKeyDown=this.handleKeyDown.bind(this),this.handleCancel=this.handleCancel.bind(this),this.attach()}attach(){this.handleStart(),this.windowListeners.add(Cr.Resize,this.handleCancel),this.windowListeners.add(Cr.VisibilityChange,this.handleCancel),setTimeout(()=>this.listeners.add(Cr.Keydown,this.handleKeyDown))}handleStart(){const{activeNode:t,onStart:n}=this.props,i=t.node.current;i&&zF(i),n(zr)}handleKeyDown(t){if(wb(t)){const{active:n,context:i,options:s}=this.props,{keyboardCodes:l=hS,coordinateGetter:c=HF,scrollBehavior:d="smooth"}=s,{code:f}=t;if(l.end.includes(f)){this.handleEnd(t);return}if(l.cancel.includes(f)){this.handleCancel(t);return}const{collisionRect:p}=i.current,m=p?{x:p.left,y:p.top}:zr;this.referenceCoordinates||(this.referenceCoordinates=m);const g=c(t,{active:n,context:i.current,currentCoordinates:m});if(g){const y=Pu(g,m),v={x:0,y:0},{scrollableAncestors:_}=i.current;for(const T of _){const N=t.code,{isTop:C,isRight:P,isLeft:k,isBottom:I,maxScroll:D,minScroll:M}=fS(T),z=LF(T),Z={x:Math.min(N===Ct.Right?z.right-z.width/2:z.right,Math.max(N===Ct.Right?z.left:z.left+z.width/2,g.x)),y:Math.min(N===Ct.Down?z.bottom-z.height/2:z.bottom,Math.max(N===Ct.Down?z.top:z.top+z.height/2,g.y))},W=N===Ct.Right&&!P||N===Ct.Left&&!k,$=N===Ct.Down&&!I||N===Ct.Up&&!C;if(W&&Z.x!==g.x){const re=T.scrollLeft+y.x,se=N===Ct.Right&&re<=D.x||N===Ct.Left&&re>=M.x;if(se&&!y.y){T.scrollTo({left:re,behavior:d});return}se?v.x=T.scrollLeft-re:v.x=N===Ct.Right?T.scrollLeft-D.x:T.scrollLeft-M.x,v.x&&T.scrollBy({left:-v.x,behavior:d});break}else if($&&Z.y!==g.y){const re=T.scrollTop+y.y,se=N===Ct.Down&&re<=D.y||N===Ct.Up&&re>=M.y;if(se&&!y.x){T.scrollTo({top:re,behavior:d});return}se?v.y=T.scrollTop-re:v.y=N===Ct.Down?T.scrollTop-D.y:T.scrollTop-M.y,v.y&&T.scrollBy({top:-v.y,behavior:d});break}}this.handleMove(t,Ms(Pu(g,this.referenceCoordinates),v))}}}handleMove(t,n){const{onMove:i}=this.props;t.preventDefault(),i(n)}handleEnd(t){const{onEnd:n}=this.props;t.preventDefault(),this.detach(),n()}handleCancel(t){const{onCancel:n}=this.props;t.preventDefault(),this.detach(),n()}detach(){this.listeners.removeAll(),this.windowListeners.removeAll()}}mS.activators=[{eventName:"onKeyDown",handler:(e,t,n)=>{let{keyboardCodes:i=hS,onActivation:s}=t,{active:l}=n;const{code:c}=e.nativeEvent;if(i.start.includes(c)){const d=l.activatorNode.current;return d&&e.target!==d?!1:(e.preventDefault(),s==null||s({event:e.nativeEvent}),!0)}return!1}}];function E0(e){return!!(e&&"distance"in e)}function S0(e){return!!(e&&"delay"in e)}class Cb{constructor(t,n,i){var s;i===void 0&&(i=FF(t.event.target)),this.props=void 0,this.events=void 0,this.autoScrollEnabled=!0,this.document=void 0,this.activated=!1,this.initialCoordinates=void 0,this.timeoutId=null,this.listeners=void 0,this.documentListeners=void 0,this.windowListeners=void 0,this.props=t,this.events=n;const{event:l}=t,{target:c}=l;this.props=t,this.events=n,this.document=Us(c),this.documentListeners=new ro(this.document),this.listeners=new ro(i),this.windowListeners=new ro(Wn(c)),this.initialCoordinates=(s=Og(l))!=null?s:zr,this.handleStart=this.handleStart.bind(this),this.handleMove=this.handleMove.bind(this),this.handleEnd=this.handleEnd.bind(this),this.handleCancel=this.handleCancel.bind(this),this.handleKeydown=this.handleKeydown.bind(this),this.removeTextSelection=this.removeTextSelection.bind(this),this.attach()}attach(){const{events:t,props:{options:{activationConstraint:n,bypassActivationConstraint:i}}}=this;if(this.listeners.add(t.move.name,this.handleMove,{passive:!1}),this.listeners.add(t.end.name,this.handleEnd),t.cancel&&this.listeners.add(t.cancel.name,this.handleCancel),this.windowListeners.add(Cr.Resize,this.handleCancel),this.windowListeners.add(Cr.DragStart,w0),this.windowListeners.add(Cr.VisibilityChange,this.handleCancel),this.windowListeners.add(Cr.ContextMenu,w0),this.documentListeners.add(Cr.Keydown,this.handleKeydown),n){if(i!=null&&i({event:this.props.event,activeNode:this.props.activeNode,options:this.props.options}))return this.handleStart();if(S0(n)){this.timeoutId=setTimeout(this.handleStart,n.delay),this.handlePending(n);return}if(E0(n)){this.handlePending(n);return}}this.handleStart()}detach(){this.listeners.removeAll(),this.windowListeners.removeAll(),setTimeout(this.documentListeners.removeAll,50),this.timeoutId!==null&&(clearTimeout(this.timeoutId),this.timeoutId=null)}handlePending(t,n){const{active:i,onPending:s}=this.props;s(i,t,this.initialCoordinates,n)}handleStart(){const{initialCoordinates:t}=this,{onStart:n}=this.props;t&&(this.activated=!0,this.documentListeners.add(Cr.Click,UF,{capture:!0}),this.removeTextSelection(),this.documentListeners.add(Cr.SelectionChange,this.removeTextSelection),n(t))}handleMove(t){var n;const{activated:i,initialCoordinates:s,props:l}=this,{onMove:c,options:{activationConstraint:d}}=l;if(!s)return;const f=(n=Og(t))!=null?n:zr,p=Pu(s,f);if(!i&&d){if(E0(d)){if(d.tolerance!=null&&Up(p,d.tolerance))return this.handleCancel();if(Up(p,d.distance))return this.handleStart()}if(S0(d)&&Up(p,d.tolerance))return this.handleCancel();this.handlePending(d,p);return}t.cancelable&&t.preventDefault(),c(f)}handleEnd(){const{onAbort:t,onEnd:n}=this.props;this.detach(),this.activated||t(this.props.active),n()}handleCancel(){const{onAbort:t,onCancel:n}=this.props;this.detach(),this.activated||t(this.props.active),n()}handleKeydown(t){t.code===Ct.Esc&&this.handleCancel()}removeTextSelection(){var t;(t=this.document.getSelection())==null||t.removeAllRanges()}}const qF={cancel:{name:"pointercancel"},move:{name:"pointermove"},end:{name:"pointerup"}};class od extends Cb{constructor(t){const{event:n}=t,i=Us(n.target);super(t,qF,i)}}od.activators=[{eventName:"onPointerDown",handler:(e,t)=>{let{nativeEvent:n}=e,{onActivation:i}=t;return!n.isPrimary||n.button!==0?!1:(i==null||i({event:n}),!0)}}];const GF={move:{name:"mousemove"},end:{name:"mouseup"}};var Ng;(function(e){e[e.RightClick=2]="RightClick"})(Ng||(Ng={}));class VF extends Cb{constructor(t){super(t,GF,Us(t.event.target))}}VF.activators=[{eventName:"onMouseDown",handler:(e,t)=>{let{nativeEvent:n}=e,{onActivation:i}=t;return n.button===Ng.RightClick?!1:(i==null||i({event:n}),!0)}}];const Hp={cancel:{name:"touchcancel"},move:{name:"touchmove"},end:{name:"touchend"}};class KF extends Cb{constructor(t){super(t,Hp)}static setup(){return window.addEventListener(Hp.move.name,t,{capture:!1,passive:!1}),function(){window.removeEventListener(Hp.move.name,t)};function t(){}}}KF.activators=[{eventName:"onTouchStart",handler:(e,t)=>{let{nativeEvent:n}=e,{onActivation:i}=t;const{touches:s}=n;return s.length>1?!1:(i==null||i({event:n}),!0)}}];var io;(function(e){e[e.Pointer=0]="Pointer",e[e.DraggableRect=1]="DraggableRect"})(io||(io={}));var Lu;(function(e){e[e.TreeOrder=0]="TreeOrder",e[e.ReversedTreeOrder=1]="ReversedTreeOrder"})(Lu||(Lu={}));function YF(e){let{acceleration:t,activator:n=io.Pointer,canScroll:i,draggingRect:s,enabled:l,interval:c=5,order:d=Lu.TreeOrder,pointerCoordinates:f,scrollableAncestors:p,scrollableAncestorRects:m,delta:g,threshold:y}=e;const v=WF({delta:g,disabled:!l}),[_,T]=sF(),N=E.useRef({x:0,y:0}),C=E.useRef({x:0,y:0}),P=E.useMemo(()=>{switch(n){case io.Pointer:return f?{top:f.y,bottom:f.y,left:f.x,right:f.x}:null;case io.DraggableRect:return s}},[n,s,f]),k=E.useRef(null),I=E.useCallback(()=>{const M=k.current;if(!M)return;const z=N.current.x*C.current.x,Z=N.current.y*C.current.y;M.scrollBy(z,Z)},[]),D=E.useMemo(()=>d===Lu.TreeOrder?[...p].reverse():p,[d,p]);E.useEffect(()=>{if(!l||!p.length||!P){T();return}for(const M of D){if((i==null?void 0:i(M))===!1)continue;const z=p.indexOf(M),Z=m[z];if(!Z)continue;const{direction:W,speed:$}=IF(M,Z,P,t,y);for(const re of["x","y"])v[re][W[re]]||($[re]=0,W[re]=0);if($.x>0||$.y>0){T(),k.current=M,_(I,c),N.current=$,C.current=W;return}}N.current={x:0,y:0},C.current={x:0,y:0},T()},[t,I,i,T,l,c,JSON.stringify(P),JSON.stringify(v),_,p,D,m,JSON.stringify(y)])}const XF={x:{[_n.Backward]:!1,[_n.Forward]:!1},y:{[_n.Backward]:!1,[_n.Forward]:!1}};function WF(e){let{delta:t,disabled:n}=e;const i=Tg(t);return Eo(s=>{if(n||!i||!s)return XF;const l={x:Math.sign(t.x-i.x),y:Math.sign(t.y-i.y)};return{x:{[_n.Backward]:s.x[_n.Backward]||l.x===-1,[_n.Forward]:s.x[_n.Forward]||l.x===1},y:{[_n.Backward]:s.y[_n.Backward]||l.y===-1,[_n.Forward]:s.y[_n.Forward]||l.y===1}}},[n,t,i])}function ZF(e,t){const n=t!=null?e.get(t):void 0,i=n?n.node.current:null;return Eo(s=>{var l;return t==null?null:(l=i??s)!=null?l:null},[i,t])}function QF(e,t){return E.useMemo(()=>e.reduce((n,i)=>{const{sensor:s}=i,l=s.activators.map(c=>({eventName:c.eventName,handler:t(c.handler,i)}));return[...n,...l]},[]),[e,t])}var mo;(function(e){e[e.Always=0]="Always",e[e.BeforeDragging=1]="BeforeDragging",e[e.WhileDragging=2]="WhileDragging"})(mo||(mo={}));var Ag;(function(e){e.Optimized="optimized"})(Ag||(Ag={}));const C0=new Map;function JF(e,t){let{dragging:n,dependencies:i,config:s}=t;const[l,c]=E.useState(null),{frequency:d,measure:f,strategy:p}=s,m=E.useRef(e),g=N(),y=ho(g),v=E.useCallback(function(C){C===void 0&&(C=[]),!y.current&&c(P=>P===null?C:P.concat(C.filter(k=>!P.includes(k))))},[y]),_=E.useRef(null),T=Eo(C=>{if(g&&!n)return C0;if(!C||C===C0||m.current!==e||l!=null){const P=new Map;for(let k of e){if(!k)continue;if(l&&l.length>0&&!l.includes(k.id)&&k.rect.current){P.set(k.id,k.rect.current);continue}const I=k.node.current,D=I?new Sb(f(I),I):null;k.rect.current=D,D&&P.set(k.id,D)}return P}return C},[e,l,n,g,f]);return E.useEffect(()=>{m.current=e},[e]),E.useEffect(()=>{g||v()},[n,g]),E.useEffect(()=>{l&&l.length>0&&c(null)},[JSON.stringify(l)]),E.useEffect(()=>{g||typeof d!="number"||_.current!==null||(_.current=setTimeout(()=>{v(),_.current=null},d))},[d,g,v,...i]),{droppableRects:T,measureDroppableContainers:v,measuringScheduled:l!=null};function N(){switch(p){case mo.Always:return!1;case mo.BeforeDragging:return n;default:return!n}}}function gS(e,t){return Eo(n=>e?n||(typeof t=="function"?t(e):e):null,[t,e])}function eU(e,t){return gS(e,t)}function tU(e){let{callback:t,disabled:n}=e;const i=xb(t),s=E.useMemo(()=>{if(n||typeof window>"u"||typeof window.MutationObserver>"u")return;const{MutationObserver:l}=window;return new l(i)},[i,n]);return E.useEffect(()=>()=>s==null?void 0:s.disconnect(),[s]),s}function cd(e){let{callback:t,disabled:n}=e;const i=xb(t),s=E.useMemo(()=>{if(n||typeof window>"u"||typeof window.ResizeObserver>"u")return;const{ResizeObserver:l}=window;return new l(i)},[n]);return E.useEffect(()=>()=>s==null?void 0:s.disconnect(),[s]),s}function nU(e){return new Sb(Hs(e),e)}function T0(e,t,n){t===void 0&&(t=nU);const[i,s]=E.useState(null);function l(){s(f=>{if(!e)return null;if(e.isConnected===!1){var p;return(p=f??n)!=null?p:null}const m=t(e);return JSON.stringify(f)===JSON.stringify(m)?f:m})}const c=tU({callback(f){if(e)for(const p of f){const{type:m,target:g}=p;if(m==="childList"&&g instanceof HTMLElement&&g.contains(e)){l();break}}}}),d=cd({callback:l});return Zr(()=>{l(),e?(d==null||d.observe(e),c==null||c.observe(document.body,{childList:!0,subtree:!0})):(d==null||d.disconnect(),c==null||c.disconnect())},[e]),i}function rU(e){const t=gS(e);return lS(e,t)}const O0=[];function iU(e){const t=E.useRef(e),n=Eo(i=>e?i&&i!==O0&&e&&t.current&&e.parentNode===t.current.parentNode?i:Eb(e):O0,[e]);return E.useEffect(()=>{t.current=e},[e]),n}function aU(e){const[t,n]=E.useState(null),i=E.useRef(e),s=E.useCallback(l=>{const c=Fp(l.target);c&&n(d=>d?(d.set(c,Rg(c)),new Map(d)):null)},[]);return E.useEffect(()=>{const l=i.current;if(e!==l){c(l);const d=e.map(f=>{const p=Fp(f);return p?(p.addEventListener("scroll",s,{passive:!0}),[p,Rg(p)]):null}).filter(f=>f!=null);n(d.length?new Map(d):null),i.current=e}return()=>{c(e),c(l)};function c(d){d.forEach(f=>{const p=Fp(f);p==null||p.removeEventListener("scroll",s)})}},[s,e]),E.useMemo(()=>e.length?t?Array.from(t.values()).reduce((l,c)=>Ms(l,c),zr):pS(e):zr,[e,t])}function R0(e,t){t===void 0&&(t=[]);const n=E.useRef(null);return E.useEffect(()=>{n.current=null},t),E.useEffect(()=>{const i=e!==zr;i&&!n.current&&(n.current=e),!i&&n.current&&(n.current=null)},[e]),n.current?Pu(e,n.current):zr}function sU(e){E.useEffect(()=>{if(!ld)return;const t=e.map(n=>{let{sensor:i}=n;return i.setup==null?void 0:i.setup()});return()=>{for(const n of t)n==null||n()}},e.map(t=>{let{sensor:n}=t;return n}))}function lU(e,t){return E.useMemo(()=>e.reduce((n,i)=>{let{eventName:s,handler:l}=i;return n[s]=c=>{l(c,t)},n},{}),[e,t])}function bS(e){return E.useMemo(()=>e?DF(e):null,[e])}const N0=[];function oU(e,t){t===void 0&&(t=Hs);const[n]=e,i=bS(n?Wn(n):null),[s,l]=E.useState(N0);function c(){l(()=>e.length?e.map(f=>dS(f)?i:new Sb(t(f),f)):N0)}const d=cd({callback:c});return Zr(()=>{d==null||d.disconnect(),c(),e.forEach(f=>d==null?void 0:d.observe(f))},[e]),s}function cU(e){if(!e)return null;if(e.children.length>1)return e;const t=e.children[0];return wo(t)?t:e}function uU(e){let{measure:t}=e;const[n,i]=E.useState(null),s=E.useCallback(p=>{for(const{target:m}of p)if(wo(m)){i(g=>{const y=t(m);return g?{...g,width:y.width,height:y.height}:y});break}},[t]),l=cd({callback:s}),c=E.useCallback(p=>{const m=cU(p);l==null||l.disconnect(),m&&(l==null||l.observe(m)),i(m?t(m):null)},[t,l]),[d,f]=Mu(c);return E.useMemo(()=>({nodeRef:d,rect:n,setRef:f}),[n,d,f])}const dU=[{sensor:od,options:{}},{sensor:mS,options:{}}],fU={current:{}},du={draggable:{measure:x0},droppable:{measure:x0,strategy:mo.WhileDragging,frequency:Ag.Optimized},dragOverlay:{measure:Hs}};class ao extends Map{get(t){var n;return t!=null&&(n=super.get(t))!=null?n:void 0}toArray(){return Array.from(this.values())}getEnabled(){return this.toArray().filter(t=>{let{disabled:n}=t;return!n})}getNodeFor(t){var n,i;return(n=(i=this.get(t))==null?void 0:i.node.current)!=null?n:void 0}}const pU={activatorEvent:null,active:null,activeNode:null,activeNodeRect:null,collisions:null,containerNodeRect:null,draggableNodes:new Map,droppableRects:new Map,droppableContainers:new ao,over:null,dragOverlay:{nodeRef:{current:null},rect:null,setRef:Iu},scrollableAncestors:[],scrollableAncestorRects:[],measuringConfiguration:du,measureDroppableContainers:Iu,windowRect:null,measuringScheduled:!1},hU={activatorEvent:null,activators:[],active:null,activeNodeRect:null,ariaDescribedById:{draggable:""},dispatch:Iu,draggableNodes:new Map,over:null,measureDroppableContainers:Iu},ud=E.createContext(hU),yS=E.createContext(pU);function mU(){return{draggable:{active:null,initialCoordinates:{x:0,y:0},nodes:new Map,translate:{x:0,y:0}},droppable:{containers:new ao}}}function gU(e,t){switch(t.type){case hn.DragStart:return{...e,draggable:{...e.draggable,initialCoordinates:t.initialCoordinates,active:t.active}};case hn.DragMove:return e.draggable.active==null?e:{...e,draggable:{...e.draggable,translate:{x:t.coordinates.x-e.draggable.initialCoordinates.x,y:t.coordinates.y-e.draggable.initialCoordinates.y}}};case hn.DragEnd:case hn.DragCancel:return{...e,draggable:{...e.draggable,active:null,initialCoordinates:{x:0,y:0},translate:{x:0,y:0}}};case hn.RegisterDroppable:{const{element:n}=t,{id:i}=n,s=new ao(e.droppable.containers);return s.set(i,n),{...e,droppable:{...e.droppable,containers:s}}}case hn.SetDroppableDisabled:{const{id:n,key:i,disabled:s}=t,l=e.droppable.containers.get(n);if(!l||i!==l.key)return e;const c=new ao(e.droppable.containers);return c.set(n,{...l,disabled:s}),{...e,droppable:{...e.droppable,containers:c}}}case hn.UnregisterDroppable:{const{id:n,key:i}=t,s=e.droppable.containers.get(n);if(!s||i!==s.key)return e;const l=new ao(e.droppable.containers);return l.delete(n),{...e,droppable:{...e.droppable,containers:l}}}default:return e}}function bU(e){let{disabled:t}=e;const{active:n,activatorEvent:i,draggableNodes:s}=E.useContext(ud),l=Tg(i),c=Tg(n==null?void 0:n.id);return E.useEffect(()=>{if(!t&&!i&&l&&c!=null){if(!wb(l)||document.activeElement===l.target)return;const d=s.get(c);if(!d)return;const{activatorNode:f,node:p}=d;if(!f.current&&!p.current)return;requestAnimationFrame(()=>{for(const m of[f.current,p.current]){if(!m)continue;const g=cF(m);if(g){g.focus();break}}})}},[i,t,s,c,l]),null}function yU(e,t){let{transform:n,...i}=t;return e!=null&&e.length?e.reduce((s,l)=>l({transform:s,...i}),n):n}function vU(e){return E.useMemo(()=>({draggable:{...du.draggable,...e==null?void 0:e.draggable},droppable:{...du.droppable,...e==null?void 0:e.droppable},dragOverlay:{...du.dragOverlay,...e==null?void 0:e.dragOverlay}}),[e==null?void 0:e.draggable,e==null?void 0:e.droppable,e==null?void 0:e.dragOverlay])}function _U(e){let{activeNode:t,measure:n,initialRect:i,config:s=!0}=e;const l=E.useRef(!1),{x:c,y:d}=typeof s=="boolean"?{x:s,y:s}:s;Zr(()=>{if(!c&&!d||!t){l.current=!1;return}if(l.current||!i)return;const p=t==null?void 0:t.node.current;if(!p||p.isConnected===!1)return;const m=n(p),g=lS(m,i);if(c||(g.x=0),d||(g.y=0),l.current=!0,Math.abs(g.x)>0||Math.abs(g.y)>0){const y=oS(p);y&&y.scrollBy({top:g.y,left:g.x})}},[t,c,d,i,n])}const vS=E.createContext({...zr,scaleX:1,scaleY:1});var ea;(function(e){e[e.Uninitialized=0]="Uninitialized",e[e.Initializing=1]="Initializing",e[e.Initialized=2]="Initialized"})(ea||(ea={}));const _S=E.memo(function(t){var n,i,s,l;let{id:c,accessibility:d,autoScroll:f=!0,children:p,sensors:m=dU,collisionDetection:g=SF,measuring:y,modifiers:v,..._}=t;const T=E.useReducer(gU,void 0,mU),[N,C]=T,[P,k]=mF(),[I,D]=E.useState(ea.Uninitialized),M=I===ea.Initialized,{draggable:{active:z,nodes:Z,translate:W},droppable:{containers:$}}=N,re=z!=null?Z.get(z):null,se=E.useRef({initial:null,translated:null}),Se=E.useMemo(()=>{var Ft;return z!=null?{id:z,data:(Ft=re==null?void 0:re.data)!=null?Ft:fU,rect:se}:null},[z,re]),ue=E.useRef(null),[V,B]=E.useState(null),[ee,X]=E.useState(null),pe=ho(_,Object.values(_)),x=So("DndDescribedBy",c),q=E.useMemo(()=>$.getEnabled(),[$]),U=vU(y),{droppableRects:R,measureDroppableContainers:fe,measuringScheduled:we}=JF(q,{dragging:M,dependencies:[W.x,W.y],config:U.droppable}),be=ZF(Z,z),ke=E.useMemo(()=>ee?Og(ee):null,[ee]),Me=oa(),at=eU(be,U.draggable.measure);_U({activeNode:z!=null?Z.get(z):null,config:Me.layoutShiftCompensation,initialRect:at,measure:U.draggable.measure});const $e=T0(be,U.draggable.measure,at),ie=T0(be?be.parentElement:null),ze=E.useRef({activatorEvent:null,active:null,activeNode:be,collisionRect:null,collisions:null,droppableRects:R,draggableNodes:Z,draggingNode:null,draggingNodeRect:null,droppableContainers:$,over:null,scrollableAncestors:[],scrollAdjustedTranslate:null}),st=$.getNodeFor((n=ze.current.over)==null?void 0:n.id),lt=uU({measure:U.dragOverlay.measure}),Tt=(i=lt.nodeRef.current)!=null?i:be,Be=M?(s=lt.rect)!=null?s:$e:null,_t=!!(lt.nodeRef.current&&lt.rect),Ve=rU(_t?null:$e),Ut=bS(Tt?Wn(Tt):null),Zt=iU(M?st??be:null),Et=oU(Zt),Bn=yU(v,{transform:{x:W.x-Ve.x,y:W.y-Ve.y,scaleX:1,scaleY:1},activatorEvent:ee,active:Se,activeNodeRect:$e,containerNodeRect:ie,draggingNodeRect:Be,over:ze.current.over,overlayNodeRect:lt.rect,scrollableAncestors:Zt,scrollableAncestorRects:Et,windowRect:Ut}),hr=ke?Ms(ke,W):null,Fn=aU(Zt),Ci=R0(Fn),ne=R0(Fn,[$e]),de=Ms(Bn,Ci),Ae=Be?OF(Be,Bn):null,Ie=Se&&Ae?g({active:Se,collisionRect:Ae,droppableRects:R,droppableContainers:q,pointerCoordinates:hr}):null,gt=wF(Ie,"id"),[Ht,Un]=E.useState(null),mn=_t?Bn:Ms(Bn,ne),Mn=CF(mn,(l=Ht==null?void 0:Ht.rect)!=null?l:null,$e),dn=E.useRef(null),Vt=E.useCallback((Ft,Qt)=>{let{sensor:j,options:ae}=Qt;if(ue.current==null)return;const me=Z.get(ue.current);if(!me)return;const De=Ft.nativeEvent,pt=new j({active:ue.current,activeNode:me,event:De,options:ae,context:ze,onAbort(_e){if(!Z.get(_e))return;const{onDragAbort:Te}=pe.current,ht={id:_e};Te==null||Te(ht),P({type:"onDragAbort",event:ht})},onPending(_e,ye,Te,ht){if(!Z.get(_e))return;const{onDragPending:Qn}=pe.current,Hn={id:_e,constraint:ye,initialCoordinates:Te,offset:ht};Qn==null||Qn(Hn),P({type:"onDragPending",event:Hn})},onStart(_e){const ye=ue.current;if(ye==null)return;const Te=Z.get(ye);if(!Te)return;const{onDragStart:ht}=pe.current,Rt={activatorEvent:De,active:{id:ye,data:Te.data,rect:se}};As.unstable_batchedUpdates(()=>{ht==null||ht(Rt),D(ea.Initializing),C({type:hn.DragStart,initialCoordinates:_e,active:ye}),P({type:"onDragStart",event:Rt}),B(dn.current),X(De)})},onMove(_e){C({type:hn.DragMove,coordinates:_e})},onEnd:Ot(hn.DragEnd),onCancel:Ot(hn.DragCancel)});dn.current=pt;function Ot(_e){return async function(){const{active:Te,collisions:ht,over:Rt,scrollAdjustedTranslate:Qn}=ze.current;let Hn=null;if(Te&&Qn){const{cancelDrop:mr}=pe.current;Hn={activatorEvent:De,active:Te,collisions:ht,delta:Qn,over:Rt},_e===hn.DragEnd&&typeof mr=="function"&&await Promise.resolve(mr(Hn))&&(_e=hn.DragCancel)}ue.current=null,As.unstable_batchedUpdates(()=>{C({type:_e}),D(ea.Uninitialized),Un(null),B(null),X(null),dn.current=null;const mr=_e===hn.DragEnd?"onDragEnd":"onDragCancel";if(Hn){const Rr=pe.current[mr];Rr==null||Rr(Hn),P({type:mr,event:Hn})}})}}},[Z]),On=E.useCallback((Ft,Qt)=>(j,ae)=>{const me=j.nativeEvent,De=Z.get(ae);if(ue.current!==null||!De||me.dndKit||me.defaultPrevented)return;const pt={active:De};Ft(j,Qt.options,pt)===!0&&(me.dndKit={capturedBy:Qt.sensor},ue.current=ae,Vt(j,Qt))},[Z,Vt]),gn=QF(m,On);sU(m),Zr(()=>{$e&&I===ea.Initializing&&D(ea.Initialized)},[$e,I]),E.useEffect(()=>{const{onDragMove:Ft}=pe.current,{active:Qt,activatorEvent:j,collisions:ae,over:me}=ze.current;if(!Qt||!j)return;const De={active:Qt,activatorEvent:j,collisions:ae,delta:{x:de.x,y:de.y},over:me};As.unstable_batchedUpdates(()=>{Ft==null||Ft(De),P({type:"onDragMove",event:De})})},[de.x,de.y]),E.useEffect(()=>{const{active:Ft,activatorEvent:Qt,collisions:j,droppableContainers:ae,scrollAdjustedTranslate:me}=ze.current;if(!Ft||ue.current==null||!Qt||!me)return;const{onDragOver:De}=pe.current,pt=ae.get(gt),Ot=pt&&pt.rect.current?{id:pt.id,rect:pt.rect.current,data:pt.data,disabled:pt.disabled}:null,_e={active:Ft,activatorEvent:Qt,collisions:j,delta:{x:me.x,y:me.y},over:Ot};As.unstable_batchedUpdates(()=>{Un(Ot),De==null||De(_e),P({type:"onDragOver",event:_e})})},[gt]),Zr(()=>{ze.current={activatorEvent:ee,active:Se,activeNode:be,collisionRect:Ae,collisions:Ie,droppableRects:R,draggableNodes:Z,draggingNode:Tt,draggingNodeRect:Be,droppableContainers:$,over:Ht,scrollableAncestors:Zt,scrollAdjustedTranslate:de},se.current={initial:Be,translated:Ae}},[Se,be,Ie,Ae,Z,Tt,Be,R,$,Ht,Zt,de]),YF({...Me,delta:W,draggingRect:Ae,pointerCoordinates:hr,scrollableAncestors:Zt,scrollableAncestorRects:Et});const sa=E.useMemo(()=>({active:Se,activeNode:be,activeNodeRect:$e,activatorEvent:ee,collisions:Ie,containerNodeRect:ie,dragOverlay:lt,draggableNodes:Z,droppableContainers:$,droppableRects:R,over:Ht,measureDroppableContainers:fe,scrollableAncestors:Zt,scrollableAncestorRects:Et,measuringConfiguration:U,measuringScheduled:we,windowRect:Ut}),[Se,be,$e,ee,Ie,ie,lt,Z,$,R,Ht,fe,Zt,Et,U,we,Ut]),la=E.useMemo(()=>({activatorEvent:ee,activators:gn,active:Se,activeNodeRect:$e,ariaDescribedById:{draggable:x},dispatch:C,draggableNodes:Z,over:Ht,measureDroppableContainers:fe}),[ee,gn,Se,$e,C,x,Z,Ht,fe]);return Wt.createElement(rS.Provider,{value:k},Wt.createElement(ud.Provider,{value:la},Wt.createElement(yS.Provider,{value:sa},Wt.createElement(vS.Provider,{value:Mn},p)),Wt.createElement(bU,{disabled:(d==null?void 0:d.restoreFocus)===!1})),Wt.createElement(yF,{...d,hiddenTextDescribedById:x}));function oa(){const Ft=(V==null?void 0:V.autoScrollEnabled)===!1,Qt=typeof f=="object"?f.enabled===!1:f===!1,j=M&&!Ft&&!Qt;return typeof f=="object"?{...f,enabled:j}:{enabled:j}}}),xU=E.createContext(null),A0="button",wU="Draggable";function EU(e){let{id:t,data:n,disabled:i=!1,attributes:s}=e;const l=So(wU),{activators:c,activatorEvent:d,active:f,activeNodeRect:p,ariaDescribedById:m,draggableNodes:g,over:y}=E.useContext(ud),{role:v=A0,roleDescription:_="draggable",tabIndex:T=0}=s??{},N=(f==null?void 0:f.id)===t,C=E.useContext(N?vS:xU),[P,k]=Mu(),[I,D]=Mu(),M=lU(c,t),z=ho(n);Zr(()=>(g.set(t,{id:t,key:l,node:P,activatorNode:I,data:z}),()=>{const W=g.get(t);W&&W.key===l&&g.delete(t)}),[g,t]);const Z=E.useMemo(()=>({role:v,tabIndex:T,"aria-disabled":i,"aria-pressed":N&&v===A0?!0:void 0,"aria-roledescription":_,"aria-describedby":m.draggable}),[i,v,T,N,_,m.draggable]);return{active:f,activatorEvent:d,activeNodeRect:p,attributes:Z,isDragging:N,listeners:i?void 0:M,node:P,over:y,setNodeRef:k,setActivatorNodeRef:D,transform:C}}function SU(){return E.useContext(yS)}const CU="Droppable",TU={timeout:25};function xS(e){let{data:t,disabled:n=!1,id:i,resizeObserverConfig:s}=e;const l=So(CU),{active:c,dispatch:d,over:f,measureDroppableContainers:p}=E.useContext(ud),m=E.useRef({disabled:n}),g=E.useRef(!1),y=E.useRef(null),v=E.useRef(null),{disabled:_,updateMeasurementsFor:T,timeout:N}={...TU,...s},C=ho(T??i),P=E.useCallback(()=>{if(!g.current){g.current=!0;return}v.current!=null&&clearTimeout(v.current),v.current=setTimeout(()=>{p(Array.isArray(C.current)?C.current:[C.current]),v.current=null},N)},[N]),k=cd({callback:P,disabled:_||!c}),I=E.useCallback((Z,W)=>{k&&(W&&(k.unobserve(W),g.current=!1),Z&&k.observe(Z))},[k]),[D,M]=Mu(I),z=ho(t);return E.useEffect(()=>{!k||!D.current||(k.disconnect(),g.current=!1,k.observe(D.current))},[D,k]),E.useEffect(()=>(d({type:hn.RegisterDroppable,element:{id:i,key:l,disabled:n,node:D,rect:y,data:z}}),()=>d({type:hn.UnregisterDroppable,key:l,id:i})),[i]),E.useEffect(()=>{n!==m.current.disabled&&(d({type:hn.SetDroppableDisabled,id:i,key:l,disabled:n}),m.current.disabled=n)},[i,l,n,d]),{active:c,rect:y,isOver:(f==null?void 0:f.id)===i,node:D,over:f,setNodeRef:M}}function wS(e,t,n){const i=e.slice();return i.splice(n<0?i.length+n:n,0,i.splice(t,1)[0]),i}function OU(e,t){return e.reduce((n,i,s)=>{const l=t.get(i);return l&&(n[s]=l),n},Array(e.length))}function Wc(e){return e!==null&&e>=0}function RU(e,t){if(e===t)return!0;if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function NU(e){return typeof e=="boolean"?{draggable:e,droppable:e}:e}const ES=e=>{let{rects:t,activeIndex:n,overIndex:i,index:s}=e;const l=wS(t,i,n),c=t[s],d=l[s];return!d||!c?null:{x:d.left-c.left,y:d.top-c.top,scaleX:d.width/c.width,scaleY:d.height/c.height}},Zc={scaleX:1,scaleY:1},SS=e=>{var t;let{activeIndex:n,activeNodeRect:i,index:s,rects:l,overIndex:c}=e;const d=(t=l[n])!=null?t:i;if(!d)return null;if(s===n){const p=l[c];return p?{x:0,y:n<c?p.top+p.height-(d.top+d.height):p.top-d.top,...Zc}:null}const f=AU(l,s,n);return s>n&&s<=c?{x:0,y:-d.height-f,...Zc}:s<n&&s>=c?{x:0,y:d.height+f,...Zc}:{x:0,y:0,...Zc}};function AU(e,t,n){const i=e[t],s=e[t-1],l=e[t+1];return i?n<t?s?i.top-(s.top+s.height):l?l.top-(i.top+i.height):0:l?l.top-(i.top+i.height):s?i.top-(s.top+s.height):0:0}const CS="Sortable",TS=Wt.createContext({activeIndex:-1,containerId:CS,disableTransforms:!1,items:[],overIndex:-1,useDragOverlay:!1,sortedRects:[],strategy:ES,disabled:{draggable:!1,droppable:!1}});function OS(e){let{children:t,id:n,items:i,strategy:s=ES,disabled:l=!1}=e;const{active:c,dragOverlay:d,droppableRects:f,over:p,measureDroppableContainers:m}=SU(),g=So(CS,n),y=d.rect!==null,v=E.useMemo(()=>i.map(M=>typeof M=="object"&&"id"in M?M.id:M),[i]),_=c!=null,T=c?v.indexOf(c.id):-1,N=p?v.indexOf(p.id):-1,C=E.useRef(v),P=!RU(v,C.current),k=N!==-1&&T===-1||P,I=NU(l);Zr(()=>{P&&_&&m(v)},[P,v,_,m]),E.useEffect(()=>{C.current=v},[v]);const D=E.useMemo(()=>({activeIndex:T,containerId:g,disabled:I,disableTransforms:k,items:v,overIndex:N,useDragOverlay:y,sortedRects:OU(v,f),strategy:s}),[T,g,I.draggable,I.droppable,k,v,N,f,y,s]);return Wt.createElement(TS.Provider,{value:D},t)}const DU=e=>{let{id:t,items:n,activeIndex:i,overIndex:s}=e;return wS(n,i,s).indexOf(t)},kU=e=>{let{containerId:t,isSorting:n,wasDragging:i,index:s,items:l,newIndex:c,previousItems:d,previousContainerId:f,transition:p}=e;return!p||!i||d!==l&&s===c?!1:n?!0:c!==s&&t===f},MU={duration:200,easing:"ease"},RS="transform",PU=Is.Transition.toString({property:RS,duration:0,easing:"linear"}),IU={roleDescription:"sortable"};function LU(e){let{disabled:t,index:n,node:i,rect:s}=e;const[l,c]=E.useState(null),d=E.useRef(n);return Zr(()=>{if(!t&&n!==d.current&&i.current){const f=s.current;if(f){const p=Hs(i.current,{ignoreTransform:!0}),m={x:f.left-p.left,y:f.top-p.top,scaleX:f.width/p.width,scaleY:f.height/p.height};(m.x||m.y)&&c(m)}}n!==d.current&&(d.current=n)},[t,n,i,s]),E.useEffect(()=>{l&&c(null)},[l]),l}function NS(e){let{animateLayoutChanges:t=kU,attributes:n,disabled:i,data:s,getNewIndex:l=DU,id:c,strategy:d,resizeObserverConfig:f,transition:p=MU}=e;const{items:m,containerId:g,activeIndex:y,disabled:v,disableTransforms:_,sortedRects:T,overIndex:N,useDragOverlay:C,strategy:P}=E.useContext(TS),k=jU(i,v),I=m.indexOf(c),D=E.useMemo(()=>({sortable:{containerId:g,index:I,items:m},...s}),[g,s,I,m]),M=E.useMemo(()=>m.slice(m.indexOf(c)),[m,c]),{rect:z,node:Z,isOver:W,setNodeRef:$}=xS({id:c,data:D,disabled:k.droppable,resizeObserverConfig:{updateMeasurementsFor:M,...f}}),{active:re,activatorEvent:se,activeNodeRect:Se,attributes:ue,setNodeRef:V,listeners:B,isDragging:ee,over:X,setActivatorNodeRef:pe,transform:x}=EU({id:c,data:D,attributes:{...IU,...n},disabled:k.draggable}),q=aF($,V),U=!!re,R=U&&!_&&Wc(y)&&Wc(N),fe=!C&&ee,we=fe&&R?x:null,ke=R?we??(d??P)({rects:T,activeNodeRect:Se,activeIndex:y,overIndex:N,index:I}):null,Me=Wc(y)&&Wc(N)?l({id:c,items:m,activeIndex:y,overIndex:N}):I,at=re==null?void 0:re.id,$e=E.useRef({activeId:at,items:m,newIndex:Me,containerId:g}),ie=m!==$e.current.items,ze=t({active:re,containerId:g,isDragging:ee,isSorting:U,id:c,index:I,items:m,newIndex:$e.current.newIndex,previousItems:$e.current.items,previousContainerId:$e.current.containerId,transition:p,wasDragging:$e.current.activeId!=null}),st=LU({disabled:!ze,index:I,node:Z,rect:z});return E.useEffect(()=>{U&&$e.current.newIndex!==Me&&($e.current.newIndex=Me),g!==$e.current.containerId&&($e.current.containerId=g),m!==$e.current.items&&($e.current.items=m)},[U,Me,g,m]),E.useEffect(()=>{if(at===$e.current.activeId)return;if(at!=null&&$e.current.activeId==null){$e.current.activeId=at;return}const Tt=setTimeout(()=>{$e.current.activeId=at},50);return()=>clearTimeout(Tt)},[at]),{active:re,activeIndex:y,attributes:ue,data:D,rect:z,index:I,newIndex:Me,items:m,isOver:W,isSorting:U,isDragging:ee,listeners:B,node:Z,overIndex:N,over:X,setNodeRef:q,setActivatorNodeRef:pe,setDroppableNodeRef:$,setDraggableNodeRef:V,transform:st??ke,transition:lt()};function lt(){if(st||ie&&$e.current.newIndex===I)return PU;if(!(fe&&!wb(se)||!p)&&(U||ze))return Is.Transition.toString({...p,property:RS})}}function jU(e,t){var n,i;return typeof e=="boolean"?{draggable:e,droppable:!1}:{draggable:(n=e==null?void 0:e.draggable)!=null?n:t.draggable,droppable:(i=e==null?void 0:e.droppable)!=null?i:t.droppable}}Ct.Down,Ct.Right,Ct.Up,Ct.Left;const AS=(e,t)=>_o(n=>n.folders.items,n=>n.filter(i=>i.projectId===e&&(i.section??"files")===t)),$U=e=>_o(t=>t.assets.byId,t=>Object.values(t).filter(n=>n.projectId===e));function Wr(e,t,n){if(!t)return e;const i=[e];let s=n.find(l=>l.id===t);for(;s;)i.unshift(s.name),s=s.parentId?n.find(l=>l.id===s.parentId):void 0;return i.join("/")}function DS(e,t){const n=[],i=[e];for(;i.length;){const s=i.shift();t.filter(c=>c.parentId===s).forEach(c=>{n.push(c.id),i.push(c.id)})}return n}const ju=({folderId:e,name:t})=>(n,i)=>{n(xA({folderId:e,name:t}));const{folders:s,files:l,assets:c}=i(),d=s.items,f=DS(e,d),p=new Set([e,...f]),m=Object.values(l.byId).filter(y=>y.folderId!==null&&p.has(y.folderId)).map(y=>({id:y.id,fullName:Wr(y.name,y.folderId,d)})),g=Object.values(c.byId).filter(y=>y.folderId!==null&&p.has(y.folderId)).map(y=>({id:y.id,fullName:Wr(y.name,y.folderId,d)}));m.length&&n(mE(m)),g.length&&n(yE(g))},$u=({folderId:e})=>(t,n)=>{const{folders:i,files:s,assets:l}=n(),c=i.items.find(_=>_.id===e);if(!c)return;const d=c.parentId,f=DS(e,i.items),p=i.items.filter(_=>_.id!==e).map(_=>_.parentId===e?{..._,parentId:d}:_),m=Object.values(s.byId).filter(_=>_.folderId===e).map(_=>({id:_.id,folderId:d,fullName:Wr(_.name,d,p)})),g=Object.values(l.byId).filter(_=>_.folderId===e).map(_=>({id:_.id,folderId:d,fullName:Wr(_.name,d,p)})),y=Object.values(s.byId).filter(_=>_.folderId!==null&&f.includes(_.folderId)).map(_=>({id:_.id,fullName:Wr(_.name,_.folderId,p)})),v=Object.values(l.byId).filter(_=>_.folderId!==null&&f.includes(_.folderId)).map(_=>({id:_.id,fullName:Wr(_.name,_.folderId,p)}));t(_E(e)),m.length&&t(fA(m)),g.length&&t(bA(g)),y.length&&t(mE(y)),v.length&&t(yE(v))},kS=({folderId:e,name:t,isOpen:n,itemCount:i,depth:s,onToggle:l,onRename:c,onDelete:d,dragHandleProps:f,isDragging:p,isSelected:m=!1})=>{const g=s*12,{setNodeRef:y,isOver:v}=xS({id:`folder-drop:${e}`}),_=T=>{T.stopPropagation(),l()};return S.jsxs("div",{ref:y,style:{paddingLeft:g,opacity:p?.5:1},className:`group flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer select-none transition-colors
        ${v?"bg-ds-accent-subtle text-ds-text border border-ds-accent":m?"bg-ds-accent/15 text-ds-text border border-ds-accent/40":"text-ds-text-muted hover:bg-ds-surface-2 hover:text-ds-text"}`,onClick:_,children:[S.jsx("button",{...f,"aria-label":"Drag folder",tabIndex:-1,className:"opacity-0 group-hover:opacity-100 text-ds-text-dim cursor-grab active:cursor-grabbing leading-none transition-opacity flex-shrink-0",onClick:T=>T.stopPropagation(),children:"⠿"}),S.jsx("span",{className:"text-ds-text-dim text-[9px] w-2 flex-shrink-0",children:n?"▼":"▶"}),S.jsx("span",{className:"flex-shrink-0",children:"📁"}),S.jsx("span",{className:"truncate flex-1 font-medium",children:t}),!n&&i>0&&S.jsx("span",{className:"text-[9px] text-ds-text-dim bg-ds-surface rounded px-1",children:i}),S.jsx("button",{onClick:T=>{T.stopPropagation(),c()},className:"opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-text transition-opacity flex-shrink-0 p-0.5","aria-label":`Rename folder ${t}`,title:"Rename",tabIndex:-1,children:"✏️"}),S.jsx("button",{onClick:T=>{T.stopPropagation(),d()},className:"opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error transition-opacity flex-shrink-0","aria-label":`Delete folder ${t}`,title:"Delete",tabIndex:-1,children:"🗑"})]})};function D0(e,t,n){if(!e.trim())return"Name cannot be empty.";const i=e.trim();return t.some(l=>l.name===i&&(l.folderId??null)===n)?`'${i}' already exists in this folder.`:null}const zU=({asset:e,depth:t,onRemove:n,onDoubleClick:i})=>{const{attributes:s,listeners:l,setNodeRef:c,transform:d,transition:f,isDragging:p}=NS({id:e.id}),m={paddingLeft:t*12,transform:Is.Transform.toString(d),transition:f,opacity:p?.5:1};return S.jsxs("li",{ref:c,style:m,className:"group flex items-center justify-between px-2 py-1 rounded text-xs text-ds-text-muted hover:bg-ds-surface-2 hover:text-ds-text cursor-pointer",onDoubleClick:()=>i==null?void 0:i(e.id),children:[S.jsx("button",{...l,...s,"aria-label":"Drag to reorder",tabIndex:-1,className:"opacity-0 group-hover:opacity-100 text-ds-text-dim cursor-grab active:cursor-grabbing leading-none transition-opacity flex-shrink-0",onClick:g=>g.stopPropagation(),children:"⠿"}),S.jsx("span",{className:"truncate flex-1",children:e.name}),S.jsx("button",{onClick:()=>n(e.id),className:"opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error ml-1 leading-none transition-opacity","aria-label":`Remove ${e.name}`,children:"×"})]})},BU=4*1024*1024;function MS(e,t,n){const i=n.filter(l=>l.folderId===e).length,s=t.filter(l=>l.parentId===e);return i+s.reduce((l,c)=>l+MS(c.id,t,n),0)}function FU(e,t){if(e===null)return"";const n=[];let i=t.find(s=>s.id===e);for(;i;)n.unshift(i.name),i=i.parentId?t.find(s=>s.id===i.parentId):void 0;return n.join("/")}const UU=({projectId:e,onOpenAsset:t})=>{const n=Or(),i=E.useMemo(()=>$U(e),[e]),s=an(i),l=E.useRef(null),c=E.useRef(null),d=E.useRef(null),f=E.useRef(null),[p,m]=E.useState(!1),[g,y]=E.useState({}),[v,_]=E.useState(void 0),[T,N]=E.useState(""),[C,P]=E.useState(null),[k,I]=E.useState(null),[D,M]=E.useState(""),[z,Z]=E.useState(null),W=E.useRef(null),[$,re]=E.useState(null),[se,Se]=E.useState(!1),[ue,V]=E.useState(""),[B,ee]=E.useState(null),X=E.useRef(null),pe=E.useMemo(()=>AS(e,"assets"),[e]),x=an(pe),q=an(ie=>ie.assets.assetOrder),U=aS(iS(od,{activationConstraint:{distance:8}}));E.useEffect(()=>{v!==void 0&&setTimeout(()=>{var ie;return(ie=c.current)==null?void 0:ie.focus()},0)},[v]),E.useEffect(()=>{k&&setTimeout(()=>{var ie;return(ie=d.current)==null?void 0:ie.focus()},0)},[k]),E.useEffect(()=>{if(!k)return;const ie=ze=>{ze.key==="Escape"&&I(null)};return document.addEventListener("keydown",ie),()=>document.removeEventListener("keydown",ie)},[k]),E.useEffect(()=>{if(!C)return;const ie=ze=>{ze.key==="Escape"&&P(null)};return document.addEventListener("keydown",ie),()=>document.removeEventListener("keydown",ie)},[C]),E.useEffect(()=>{if(z===null){W.current&&clearTimeout(W.current);return}return W.current=setTimeout(()=>{y(ie=>({...ie,[z]:!0}))},500),()=>{W.current&&clearTimeout(W.current)}},[z]),E.useEffect(()=>{se&&setTimeout(()=>{var ie;return(ie=X.current)==null?void 0:ie.focus()},0)},[se]),E.useEffect(()=>{if(!se)return;const ie=ze=>{ze.key==="Escape"&&Se(!1)};return document.addEventListener("keydown",ie),()=>document.removeEventListener("keydown",ie)},[se]);const R=async(ie,ze=null)=>{for(const st of Array.from(ie))if(st.size>BU){alert(`${st.name} is too large (max 4 MB).`);return}await Promise.all(Array.from(ie).map(st=>new Promise((lt,Tt)=>{const Be=new FileReader;Be.onload=()=>{const _t=st.name,Ve=Wr(_t,ze,x);n(Eu({id:crypto.randomUUID(),name:_t,content:Be.result,projectId:e,folderId:ze,fullName:Ve})),lt()},Be.onerror=()=>Tt(Be.error),Be.readAsDataURL(st)})))},fe=()=>{const ie=T.trim();if(!ie){_(void 0);return}n(ab({id:yi(),name:ie,projectId:e,parentId:v??null,section:"assets"})),N(""),_(void 0)},we=()=>{const ie=ue.trim(),ze=D0(ie,s,$);if(ze){ee(ze);return}const st=crypto.randomUUID(),lt=Wr(ie,$,x);n(Eu({id:st,name:ie,content:"data:text/plain;base64,",projectId:e,folderId:$,fullName:lt})),$&&y(Tt=>({...Tt,[$]:!0})),t==null||t(st),Se(!1),V(""),ee(null)},be=E.useCallback(ie=>{const{active:ze,over:st}=ie;if(Z(null),!st||ze.id===st.id)return;const lt=s.find(Et=>Et.id===ze.id);if(!lt)return;if(String(st.id).startsWith("folder-drop:")){const Et=String(st.id).replace("folder-drop:",""),Bn=Wr(lt.name,Et,x);n(gA({assetId:lt.id,folderId:Et,fullName:Bn})),y(hr=>({...hr,[Et]:!0}));return}const Tt=s.find(Et=>Et.id===st.id);if(!Tt||Tt.folderId!==lt.folderId)return;const Be=`${e}:${lt.folderId??"root"}`,_t=q[Be],Ve=_t!=null&&_t.length?_t.map(Et=>s.find(Bn=>Bn.id===Et)).filter(Boolean):s.filter(Et=>(Et.folderId??null)===(lt.folderId??null)),Ut=Ve.findIndex(Et=>Et.id===ze.id),Zt=Ve.findIndex(Et=>Et.id===st.id);Ut!==-1&&Zt!==-1&&n(yA({orderKey:Be,fromIndex:Ut,toIndex:Zt}))},[s,q,x,n,e]),ke=(ie,ze)=>{const st=x.filter(Ve=>Ve.parentId===ie),lt=`${e}:${ie??"root"}`,Tt=q[lt],Be=Tt!=null&&Tt.length?Tt.map(Ve=>s.find(Ut=>Ut.id===Ve)).filter(Boolean):s.filter(Ve=>(Ve.folderId??null)===ie),_t=Be.map(Ve=>Ve.id);return S.jsxs(S.Fragment,{children:[st.map(Ve=>{const Ut=g[Ve.id]!==!1,Zt=MS(Ve.id,x,s);return S.jsxs("div",{children:[S.jsx(kS,{folderId:Ve.id,name:Ve.name,isOpen:Ut,itemCount:Zt,depth:ze,isSelected:$===Ve.id,onToggle:()=>{y(Et=>({...Et,[Ve.id]:!Ut})),re(Ve.id)},onRename:()=>P(Ve),onDelete:()=>{I(Ve),M("")}}),Ut&&S.jsx("div",{style:{paddingLeft:(ze+1)*4},children:ke(Ve.id,ze+1)})]},Ve.id)}),S.jsx(OS,{items:_t,strategy:SS,children:S.jsx("ul",{className:"space-y-0.5",children:Be.map(Ve=>S.jsx(zU,{asset:Ve,depth:ze,onRemove:Ut=>n(bE(Ut)),onDoubleClick:t},Ve.id))})}),v===ie&&S.jsxs("div",{style:{paddingLeft:ze*12},className:"flex items-center gap-1 px-2 py-1",children:[S.jsx("span",{className:"text-xs",children:"📁"}),S.jsx("input",{ref:c,type:"text",value:T,onChange:Ve=>N(Ve.target.value),onKeyDown:Ve=>{Ve.key==="Enter"&&fe(),Ve.key==="Escape"&&_(void 0)},onBlur:fe,placeholder:"Folder name",className:"flex-1 bg-ds-bg border border-ds-border rounded px-2 py-0.5 text-xs text-ds-text focus:outline-none focus:ring-1 focus:ring-ds-accent"})]})]})},Me=C?Lr.createPortal(S.jsx("div",{className:"fixed inset-0 bg-black/60 flex items-center justify-center z-50",onClick:ie=>{ie.target===ie.currentTarget&&P(null)},children:S.jsxs("div",{role:"dialog","aria-modal":"true","aria-labelledby":"at-rename-folder-title",className:"bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl",children:[S.jsx("h2",{id:"at-rename-folder-title",className:"text-ds-text text-lg font-semibold mb-4",children:"Rename folder"}),S.jsx("input",{ref:f,autoFocus:!0,defaultValue:C.name,type:"text",placeholder:"Folder name",className:"w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent mb-4",onKeyDown:ie=>{if(ie.key==="Enter"){const ze=ie.target.value.trim();ze&&ze!==C.name&&n(ju({folderId:C.id,name:ze})),P(null)}ie.key==="Escape"&&P(null)}}),S.jsxs("div",{className:"flex justify-end gap-3",children:[S.jsx("button",{onClick:()=>{var ze;const ie=(ze=f.current)==null?void 0:ze.value.trim();ie&&ie!==C.name&&n(ju({folderId:C.id,name:ie})),P(null)},className:"bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-2 rounded hover:opacity-90 transition",children:"Rename"}),S.jsx("button",{onClick:()=>P(null),className:"bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition",children:"Cancel"})]})]})}),document.body):null,at=se?Lr.createPortal(S.jsx("div",{className:"fixed inset-0 bg-black/60 flex items-center justify-center z-50",onClick:ie=>{ie.target===ie.currentTarget&&Se(!1)},children:S.jsxs("div",{role:"dialog","aria-modal":"true","aria-labelledby":"at-new-file-title",className:"bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl",children:[S.jsx("h2",{id:"at-new-file-title",className:"text-ds-text text-lg font-semibold mb-1",children:"New text file"}),$?S.jsxs("p",{className:"text-ds-text-muted text-xs mb-3",children:["Creating in ",S.jsx("span",{className:"text-ds-text font-medium",children:FU($,x)})]}):S.jsx("p",{className:"text-ds-text-muted text-xs mb-3",children:"Creating in root"}),S.jsx("input",{ref:X,type:"text",value:ue,onChange:ie=>{V(ie.target.value),ee(D0(ie.target.value.trim(),s,$))},onKeyDown:ie=>{ie.key==="Enter"&&we()},placeholder:"filename.txt","aria-describedby":B?"at-new-file-error":void 0,className:`w-full bg-ds-bg border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent ${B?"border-ds-error mb-1":"border-ds-border mb-4"}`}),B&&S.jsx("p",{id:"at-new-file-error",className:"text-ds-error text-xs mb-3",children:B}),S.jsxs("div",{className:"flex justify-end gap-3",children:[S.jsx("button",{onClick:we,disabled:!!B||!ue.trim(),className:"bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed",children:"Create"}),S.jsx("button",{onClick:()=>Se(!1),className:"bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition",children:"Cancel"})]})]})}),document.body):null,$e=k?Lr.createPortal(S.jsx("div",{className:"fixed inset-0 bg-black/60 flex items-center justify-center z-50",onClick:ie=>{ie.target===ie.currentTarget&&I(null)},children:S.jsxs("div",{role:"dialog","aria-modal":"true","aria-labelledby":"at-delete-folder-title",className:"bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl",children:[S.jsx("h2",{id:"at-delete-folder-title",className:"text-ds-text text-lg font-semibold mb-2",children:"Delete folder"}),S.jsxs("p",{className:"text-ds-text-muted text-sm mb-4",children:["Items inside will move to the parent level. Type ",S.jsx("span",{className:"text-ds-text font-medium",children:k.name})," to confirm."]}),S.jsx("input",{ref:d,type:"text",value:D,onChange:ie=>M(ie.target.value),onKeyDown:ie=>{ie.key==="Enter"&&D===k.name&&(n($u({folderId:k.id})),I(null))},placeholder:k.name,className:"w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-error mb-4"}),S.jsxs("div",{className:"flex justify-end gap-3",children:[S.jsx("button",{onClick:()=>{n($u({folderId:k.id})),I(null)},disabled:D!==k.name,className:"bg-ds-error text-white text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed",children:"Delete"}),S.jsx("button",{onClick:()=>I(null),className:"bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition",children:"Cancel"})]})]})}),document.body):null;return S.jsxs("div",{onClick:()=>re(null),children:[Me,$e,at,S.jsxs("div",{className:"flex items-center justify-between mb-1",children:[S.jsx("span",{className:"text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim",children:"Assets"}),S.jsxs("div",{className:"flex items-center gap-2",children:[S.jsx("button",{onClick:()=>{_(null),N("")},className:"text-ds-text-muted hover:text-ds-text transition text-sm leading-none","aria-label":"New folder",title:"New folder",children:"📁+"}),S.jsx("button",{onClick:()=>{Se(!0),V(""),ee(null)},className:"text-ds-text-muted hover:text-ds-text transition text-sm leading-none","aria-label":"New text file",title:"New text file",children:"📄+"}),S.jsx("button",{onClick:()=>{var ie;return(ie=l.current)==null?void 0:ie.click()},className:"text-ds-text-muted hover:text-ds-text transition text-sm leading-none","aria-label":"Upload asset",title:"Upload asset",children:"+"}),S.jsx("input",{ref:l,type:"file",multiple:!0,className:"hidden","data-testid":"uploader","aria-label":"Upload asset",onChange:ie=>{ie.target.files&&R(ie.target.files),ie.target.value=""}})]})]}),s.length===0&&x.length===0?S.jsx("div",{onDragOver:ie=>{ie.preventDefault(),m(!0)},onDragLeave:()=>m(!1),onDrop:ie=>{ie.preventDefault(),m(!1),ie.dataTransfer.files.length&&R(ie.dataTransfer.files)},onClick:()=>{var ie;return(ie=l.current)==null?void 0:ie.click()},className:`mt-1 border border-dashed rounded px-2 py-3 text-center cursor-pointer transition-colors
            ${p?"border-ds-accent text-ds-text-muted bg-ds-accent-subtle":"border-ds-border text-ds-text-dim hover:border-ds-accent hover:text-ds-text-muted"}`,children:S.jsxs("span",{className:"text-[10px] leading-relaxed",children:["Drop files here",S.jsx("br",{}),"or click + to browse"]})}):S.jsxs(_S,{sensors:U,collisionDetection:sS,onDragOver:ie=>{var st;const ze=String(((st=ie.over)==null?void 0:st.id)??"");if(ze.startsWith("folder-drop:")){const lt=ze.replace("folder-drop:","");Z(Tt=>Tt===lt?Tt:lt)}else Z(null)},onDragEnd:be,children:[ke(null,0),S.jsx("div",{onDragOver:ie=>{ie.preventDefault(),m(!0)},onDragLeave:()=>m(!1),onDrop:ie=>{ie.preventDefault(),m(!1),ie.dataTransfer.files.length&&R(ie.dataTransfer.files)},onClick:()=>{var ie;return(ie=l.current)==null?void 0:ie.click()},className:`mt-1 border border-dashed rounded px-2 py-1.5 text-center cursor-pointer transition-colors text-[10px]
              ${p?"border-ds-accent text-ds-text-muted":"border-ds-border text-ds-text-dim hover:border-ds-accent"}`,children:"Drop to add more"})]})]})},HU=({title:e,openText:t="Open",placeholder:n="Type here...",saveText:i="Save",closeText:s="Close",onSubmit:l,validate:c})=>{const[d,f]=E.useState(!1),[p,m]=E.useState(""),[g,y]=E.useState(null),v=E.useRef(null),_=E.useRef(null),T=E.useRef(`modal-title-${Math.random().toString(36).slice(2)}`),N=()=>{f(!0),m(""),y(null)},C=()=>{var D;f(!1),y(null),(D=v.current)==null||D.focus()},P=D=>{m(D),c&&y(c(D))},k=()=>{if(c){const D=c(p);if(D){y(D);return}}l(p),C()};E.useEffect(()=>{d&&setTimeout(()=>{var D;return(D=_.current)==null?void 0:D.focus()},0)},[d]),E.useEffect(()=>{if(!d)return;const D=M=>{M.key==="Escape"&&C()};return document.addEventListener("keydown",D),()=>document.removeEventListener("keydown",D)},[d]);const I=d?Lr.createPortal(S.jsx("div",{className:"fixed inset-0 bg-black/60 flex items-center justify-center z-50",onClick:D=>{D.target===D.currentTarget&&C()},children:S.jsxs("div",{role:"dialog","aria-modal":"true","aria-labelledby":T.current,className:"bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl",onKeyDown:D=>{if(D.key!=="Tab")return;const M=D.currentTarget.querySelectorAll('input, button, [tabindex]:not([tabindex="-1"])'),z=M[0],Z=M[M.length-1];D.shiftKey?document.activeElement===z&&(D.preventDefault(),Z.focus()):document.activeElement===Z&&(D.preventDefault(),z.focus())},children:[S.jsx("h2",{id:T.current,className:"text-ds-text text-lg font-semibold mb-4",children:e}),S.jsx("input",{ref:_,type:"text",value:p,onChange:D=>P(D.target.value),onKeyDown:D=>{D.key==="Enter"&&k()},placeholder:n,"aria-describedby":g?`${T.current}-error`:void 0,className:`w-full bg-ds-bg border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent ${g?"border-ds-error mb-1":"border-ds-border mb-4"}`}),g&&S.jsx("p",{id:`${T.current}-error`,className:"text-ds-error text-xs mb-3",children:g}),S.jsxs("div",{className:"flex justify-end gap-3",children:[S.jsx("button",{onClick:k,className:"bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-2 rounded hover:opacity-90 transition",children:i}),S.jsx("button",{onClick:C,className:"bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition",children:s})]})]})}),document.body):null;return S.jsxs(S.Fragment,{children:[S.jsx("button",{ref:v,onClick:N,className:"text-ds-text-muted hover:text-ds-text transition text-sm","aria-label":t,children:t}),I]})};function qU(e){const t=VU(e);return t.length===0?"File name must not be empty.":/^[A-Za-z]/.test(t)?/^[A-Za-z][A-Za-z0-9]*$/.test(t)?null:"File name may only contain letters and numbers.":"File name must start with a letter."}function GU(e){return e.toLowerCase().endsWith(".bas")?e:`${e}.bas`}function VU(e){return e.toLowerCase().endsWith(".bas")?e.slice(0,-4):e}const KU=({file:e,isSelected:t,showDelete:n,onSelect:i,onDelete:s,onKeyDown:l,itemRef:c})=>{const{attributes:d,listeners:f,setNodeRef:p,transform:m,transition:g,isDragging:y}=NS({id:e.id}),v={transform:Is.Transform.toString(m),transition:g,opacity:y?.5:1};return S.jsxs("li",{ref:_=>{p(_),c(_)},role:"option","aria-selected":t,tabIndex:0,style:v,onClick:()=>i(e.id),onKeyDown:l,className:`
        group flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-ds-accent
        ${t?"bg-ds-accent-subtle text-ds-text font-semibold":"text-ds-text-muted hover:bg-ds-surface-2 hover:text-ds-text"}
      `,children:[S.jsx("button",{...f,...d,"aria-label":"Drag to reorder",tabIndex:-1,className:"opacity-0 group-hover:opacity-100 text-ds-text-dim cursor-grab active:cursor-grabbing leading-none transition-opacity flex-shrink-0",onClick:_=>_.stopPropagation(),children:"⠿"}),S.jsx("span",{className:"truncate flex-1",children:e.name}),n&&S.jsx("button",{onClick:_=>{_.stopPropagation(),s(e.id)},className:"opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error ml-1 leading-none transition-opacity flex-shrink-0","aria-label":`Delete ${e.name}`,tabIndex:-1,children:"×"})]})},YU=e=>_o(t=>{var n;return(n=t.projects.items.find(i=>i.id===e))==null?void 0:n.packageIds},t=>t.packages.byId,(t,n)=>(t??["softcore","softgfx"]).map(s=>n[s]).filter(s=>!!s)),XU=({projectId:e,onAddClick:t=()=>{}})=>{const[n,i]=E.useState(!1),s=Or(),l=E.useMemo(()=>YU(e),[e]),c=an(l);return S.jsxs("div",{className:"mb-2",children:[S.jsxs("div",{className:"flex items-center justify-between mb-1",children:[S.jsxs("button",{className:"flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim hover:text-ds-text transition",onClick:()=>i(d=>!d),"aria-expanded":n,"aria-label":"Packages",children:[S.jsx("span",{children:n?"▼":"▶"}),S.jsx("span",{children:"Packages"}),!n&&S.jsx("span",{className:"ml-1 bg-ds-surface-2 text-ds-accent text-[10px] px-1.5 rounded",children:c.length})]}),S.jsx("button",{onClick:t,"aria-label":"Add package",className:"text-ds-text-muted hover:text-ds-text transition text-sm",children:"＋"})]}),n&&S.jsx("ul",{className:"space-y-0.5 mb-1",children:c.map(d=>S.jsxs("li",{className:"flex items-center gap-2 px-2 py-1 text-sm text-ds-text-dim rounded",children:[S.jsx("span",{className:"text-green-400 text-xs",children:"●"}),S.jsx("span",{children:d.name}),S.jsx("span",{className:"ml-auto",children:d.isCore?S.jsx("span",{className:"text-[10px] text-ds-text-dim",children:"core"}):S.jsx("button",{"aria-label":`Remove ${d.name}`,onClick:()=>s(iA({projectId:e,packageId:d.id})),className:"text-ds-text-dim hover:text-ds-text transition text-xs",children:"✕"})})]},d.id))})]})},WU=e=>_o(t=>{var n;return(n=t.projects.items.find(i=>i.id===e))==null?void 0:n.packageIds},t=>t.packages.byId,(t,n)=>{const i=t??[];return Object.values(n).filter(s=>!i.includes(s.id))}),ZU=({projectId:e,isOpen:t,onClose:n})=>{const[i,s]=Wt.useState(""),l=Or(),c=E.useRef(null),d=E.useMemo(()=>WU(e),[e]),p=an(d).filter(g=>g.name.toLowerCase().includes(i.toLowerCase())),m=g=>{l(rA({projectId:e,packageId:g})),n()};return E.useEffect(()=>{t&&(s(""),setTimeout(()=>{var g;return(g=c.current)==null?void 0:g.focus()},0))},[t]),E.useEffect(()=>{if(!t)return;const g=y=>{y.key==="Escape"&&n()};return document.addEventListener("keydown",g),()=>document.removeEventListener("keydown",g)},[t,n]),t?Lr.createPortal(S.jsx("div",{className:"fixed inset-0 bg-black/60 flex items-center justify-center z-50",onClick:g=>{g.target===g.currentTarget&&n()},children:S.jsxs("div",{role:"dialog","aria-modal":"true","aria-label":"Add package",className:"bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl",children:[S.jsx("h2",{className:"text-ds-text text-lg font-semibold mb-4",children:"Add package"}),S.jsx("input",{ref:c,type:"text",value:i,onChange:g=>s(g.target.value),placeholder:"Search packages...",className:"w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent mb-4"}),p.length===0?S.jsx("p",{className:"text-ds-text-dim text-sm",children:"No packages available to add."}):S.jsx("ul",{className:"space-y-1",children:p.map(g=>S.jsxs("li",{className:"flex items-center justify-between py-1.5",children:[S.jsx("span",{className:"text-ds-text text-sm",children:g.name}),S.jsx("button",{onClick:()=>m(g.id),"aria-label":`Add ${g.name}`,className:"text-ds-accent text-sm hover:opacity-80 transition",children:"+ Add"})]},g.id))}),S.jsx("div",{className:"mt-4 flex justify-end",children:S.jsx("button",{onClick:n,className:"bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition",children:"Close"})})]})}),document.body):null};function PS(e,t,n){const i=n.filter(l=>l.folderId===e).length,s=t.filter(l=>l.parentId===e);return i+s.reduce((l,c)=>l+PS(c.id,t,n),0)}const QU=({projectId:e})=>{const t=Or(),n=ed(e),i=E.useMemo(()=>AS(e,"files"),[e]),s=an(i),[l,c]=E.useState(!1),[d,f]=E.useState({}),[p,m]=E.useState(null),g=E.useRef(null),[y,v]=E.useState(void 0),[_,T]=E.useState(""),N=E.useRef(null),[C,P]=E.useState(null),[k,I]=E.useState(null),[D,M]=E.useState(""),z=E.useRef(null),Z=E.useRef(null),W=an(U=>U.ui.selectedFileByProject[e]),$=aS(iS(od,{activationConstraint:{distance:8}})),re=E.useRef([]),se=U=>{t(Su({projectId:e,fileId:U}))};E.useEffect(()=>{!W&&n.length>0&&t(Su({projectId:e,fileId:n[0].id}))},[W,n,t,e]),E.useEffect(()=>{var U;y!==void 0&&((U=N.current)==null||U.focus())},[y]),E.useEffect(()=>{var U;k&&((U=z.current)==null||U.focus())},[k]),E.useEffect(()=>{if(!C)return;const U=R=>{R.key==="Escape"&&P(null)};return document.addEventListener("keydown",U),()=>document.removeEventListener("keydown",U)},[C]),E.useEffect(()=>{if(!k)return;const U=R=>{R.key==="Escape"&&I(null)};return document.addEventListener("keydown",U),()=>document.removeEventListener("keydown",U)},[k]),E.useEffect(()=>{if(p===null){g.current&&clearTimeout(g.current);return}return g.current=setTimeout(()=>{f(U=>({...U,[p]:!0}))},500),()=>{g.current&&clearTimeout(g.current)}},[p]);const Se=U=>{const R=GU(U),fe={id:yi(),name:R,source:"",projectId:e,folderId:null,fullName:R};t(wu(fe)),se(fe.id)},ue=U=>{if(t(hE(U)),U===W){const R=n.filter(fe=>fe.id!==U);R.length>0?se(R[0].id):t(EE(e))}},V=()=>{const U=_.trim();if(!U){v(void 0);return}t(ab({id:yi(),name:U,projectId:e,parentId:y??null,section:"files"})),T(""),v(void 0)},B=E.useCallback(U=>{const{active:R,over:fe}=U;if(!fe||R.id===fe.id)return;const we=n.find(ie=>ie.id===R.id);if(!we)return;if(String(fe.id).startsWith("folder-drop:")){const ie=String(fe.id).replace("folder-drop:","");if(!s.find(lt=>lt.id===ie))return;const st=Wr(we.name,ie,s);t(dA({fileId:we.id,folderId:ie,fullName:st})),f(lt=>({...lt,[ie]:!0}));return}const be=n.find(ie=>ie.id===fe.id);if(!be||be.folderId!==we.folderId)return;const ke=`${e}:${we.folderId??"root"}`,Me=n.filter(ie=>(ie.folderId??null)===(we.folderId??null)),at=Me.findIndex(ie=>ie.id===R.id),$e=Me.findIndex(ie=>ie.id===fe.id);at!==-1&&$e!==-1&&t(uA({orderKey:ke,fromIndex:at,toIndex:$e}))},[n,s,t,e]),ee=E.useRef({value:0}),X=(U,R,fe)=>{switch(U.key){case"ArrowDown":{U.preventDefault();const we=re.current[R+1];we&&we.focus();break}case"ArrowUp":{U.preventDefault();const we=re.current[R-1];we&&we.focus();break}case"Enter":U.preventDefault(),se(fe);break}};ee.current.value=0,re.current=[];const pe=(U,R)=>{const fe=s.filter(ke=>ke.parentId===U),we=n.filter(ke=>(ke.folderId??null)===U),be=we.map(ke=>ke.id);return S.jsxs(S.Fragment,{children:[fe.map(ke=>{const Me=d[ke.id]!==!1,at=PS(ke.id,s,n);return S.jsxs("div",{children:[S.jsx(kS,{folderId:ke.id,name:ke.name,isOpen:Me,itemCount:at,depth:R,onToggle:()=>f($e=>({...$e,[ke.id]:!Me})),onRename:()=>P(ke),onDelete:()=>{I(ke),M("")}}),Me&&S.jsx("div",{style:{paddingLeft:(R+1)*4},children:pe(ke.id,R+1)})]},ke.id)}),S.jsx(OS,{items:be,strategy:SS,children:S.jsx("ul",{role:"listbox","aria-label":"Files",className:"space-y-0.5",children:we.map(ke=>{const Me=ee.current.value++;return S.jsx(KU,{file:ke,isSelected:ke.id===W,showDelete:n.length>1,onSelect:se,onDelete:ue,onKeyDown:at=>X(at,Me,ke.id),itemRef:at=>{re.current[Me]=at}},ke.id)})})}),y===U&&S.jsxs("div",{style:{paddingLeft:R*12},className:"flex items-center gap-1 px-2 py-1",children:[S.jsx("span",{className:"text-xs",children:"📁"}),S.jsx("input",{ref:N,type:"text",value:_,onChange:ke=>T(ke.target.value),onKeyDown:ke=>{ke.key==="Enter"&&V(),ke.key==="Escape"&&v(void 0)},onBlur:V,placeholder:"Folder name",className:"flex-1 bg-ds-bg border border-ds-border rounded px-2 py-0.5 text-xs text-ds-text focus:outline-none focus:ring-1 focus:ring-ds-accent"})]})]})},x=C?Lr.createPortal(S.jsx("div",{className:"fixed inset-0 bg-black/60 flex items-center justify-center z-50",onClick:U=>{U.target===U.currentTarget&&P(null)},children:S.jsxs("div",{role:"dialog","aria-modal":"true","aria-labelledby":"rename-folder-modal-title",className:"bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl",children:[S.jsx("h2",{id:"rename-folder-modal-title",className:"text-ds-text text-lg font-semibold mb-4",children:"Rename folder"}),S.jsx("input",{ref:Z,autoFocus:!0,defaultValue:C.name,type:"text",placeholder:"Folder name",className:"w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent mb-4",onKeyDown:U=>{if(U.key==="Enter"){const R=U.target.value.trim();R&&R!==C.name&&t(ju({folderId:C.id,name:R})),P(null)}U.key==="Escape"&&P(null)}}),S.jsxs("div",{className:"flex justify-end gap-3",children:[S.jsx("button",{onClick:()=>{var R;const U=(R=Z.current)==null?void 0:R.value.trim();U&&U!==C.name&&t(ju({folderId:C.id,name:U})),P(null)},className:"bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-2 rounded hover:opacity-90 transition",children:"Rename"}),S.jsx("button",{onClick:()=>P(null),className:"bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition",children:"Cancel"})]})]})}),document.body):null,q=k?Lr.createPortal(S.jsx("div",{className:"fixed inset-0 bg-black/60 flex items-center justify-center z-50",onClick:U=>{U.target===U.currentTarget&&I(null)},children:S.jsxs("div",{role:"dialog","aria-modal":"true","aria-labelledby":"delete-folder-modal-title",className:"bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl",children:[S.jsx("h2",{id:"delete-folder-modal-title",className:"text-ds-text text-lg font-semibold mb-2",children:"Delete folder"}),S.jsxs("p",{className:"text-ds-text-muted text-sm mb-4",children:["Items inside will move to the parent level. Type"," ",S.jsx("span",{className:"text-ds-text font-medium",children:k.name})," to confirm."]}),S.jsx("input",{ref:z,type:"text",value:D,onChange:U=>M(U.target.value),onKeyDown:U=>{U.key==="Enter"&&D===k.name&&(t($u({folderId:k.id})),I(null))},placeholder:k.name,className:"w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-error mb-4"}),S.jsxs("div",{className:"flex justify-end gap-3",children:[S.jsx("button",{onClick:()=>{t($u({folderId:k.id})),I(null)},disabled:D!==k.name,className:"bg-ds-error text-white text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed",children:"Delete"}),S.jsx("button",{onClick:()=>I(null),className:"bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition",children:"Cancel"})]})]})}),document.body):null;return S.jsxs("div",{children:[x,q,S.jsx(XU,{projectId:e,onAddClick:()=>c(!0)}),S.jsx(ZU,{projectId:e,isOpen:l,onClose:()=>c(!1)}),S.jsxs("div",{className:"flex items-center justify-between mb-1",children:[S.jsx("span",{className:"text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim",children:"Files"}),S.jsxs("div",{className:"flex items-center gap-2",children:[S.jsx("button",{onClick:()=>{v(null),T("")},className:"text-ds-text-muted hover:text-ds-text transition text-sm leading-none","aria-label":"New folder",title:"New folder",children:"📁+"}),S.jsx(HU,{onSubmit:Se,openText:"+",saveText:"Save",closeText:"Close",title:"New file",placeholder:"e.g. Main",validate:qU})]})]}),S.jsx(_S,{sensors:$,collisionDetection:sS,onDragOver:U=>{var fe;const R=String(((fe=U.over)==null?void 0:fe.id)??"");if(R.startsWith("folder-drop:")){const we=R.replace("folder-drop:","");m(be=>be===we?be:we)}else m(null)},onDragEnd:U=>{m(null),B(U)},children:pe(null,0)})]})},JU=({projectId:e,onOpenAsset:t})=>S.jsxs(S.Fragment,{children:[S.jsx(QU,{projectId:e}),S.jsx("div",{className:"mt-4 pt-4 border-t border-ds-border-subtle",children:S.jsx(UU,{projectId:e,onOpenAsset:t})})]}),e4=()=>S.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.75",strokeLinecap:"round",strokeLinejoin:"round",children:[S.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),S.jsx("polyline",{points:"14 2 14 8 20 8"})]}),t4=()=>S.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.75",strokeLinecap:"round",strokeLinejoin:"round",children:[S.jsx("path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}),S.jsx("polyline",{points:"7 10 12 15 17 10"}),S.jsx("line",{x1:"12",y1:"15",x2:"12",y2:"3"})]}),n4=({header:e,activitySections:t,editor:n,preview:i,panel:s,footer:l})=>{var g;const[c,d]=E.useState(((g=t[0])==null?void 0:g.id)??null),f=t.find(y=>y.id===c),p=c!==null&&(f==null?void 0:f.content)!=null,m=y=>{d(v=>v===y?null:y)};return S.jsxs("div",{className:"h-screen w-screen flex flex-col bg-ds-bg text-ds-text overflow-hidden",children:[S.jsx("header",{className:"h-11 flex-shrink-0 flex items-center px-4 bg-ds-surface border-b border-ds-border",children:e}),S.jsxs("div",{className:"flex flex-1 overflow-hidden",children:[S.jsx("div",{className:"w-10 flex-shrink-0 flex flex-col items-center py-2 gap-1 bg-ds-surface border-r border-ds-border",children:t.map(y=>S.jsx("button",{onClick:()=>y.onAction?y.onAction():m(y.id),"aria-label":y.ariaLabel,title:y.ariaLabel,className:`
                w-8 h-8 flex items-center justify-center rounded transition-colors
                focus:outline-none focus:ring-2 focus:ring-ds-accent focus:ring-offset-1 focus:ring-offset-ds-surface
                ${c===y.id&&!y.onAction?"text-ds-accent-btn-text bg-ds-accent-subtle":"text-ds-text-dim hover:text-ds-text-muted"}
              `,children:y.icon},y.id))}),p&&S.jsxs("div",{className:"w-56 flex-shrink-0 flex flex-col bg-ds-surface border-r border-ds-border overflow-y-auto",children:[S.jsx("div",{className:"px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim",children:f==null?void 0:f.ariaLabel}),S.jsx("div",{className:"flex-1 px-2 pb-3",children:f==null?void 0:f.content})]}),S.jsx("main",{className:"flex-1 flex flex-col min-w-0 overflow-hidden bg-ds-bg",children:n}),i&&S.jsxs("aside",{className:"w-2/5 flex-shrink-0 bg-ds-bg border-l border-ds-border flex flex-col overflow-hidden",children:[S.jsx("div",{className:"px-3 py-1 text-[10px] text-ds-text-dim uppercase tracking-wider bg-ds-surface border-b border-ds-border flex-shrink-0",children:"Preview"}),S.jsx("div",{className:"flex-1 overflow-hidden",children:i})]})]}),s,l&&S.jsx("footer",{className:"h-7 flex-shrink-0 flex items-center justify-between px-4 bg-ds-surface border-t border-ds-border text-[11px] text-ds-text-dim",children:l})]})},r4=({files:e,selectedFileId:t,dirtyFileIds:n,onSelect:i,onClose:s,assetTabs:l=[],selectedAssetTabId:c,dirtyAssetIds:d=[],onSelectAsset:f,onCloseAsset:p})=>{const m=e.length>1;return S.jsxs("div",{role:"tablist","aria-label":"Open files",className:"flex items-end bg-ds-bg border-b border-ds-border overflow-x-auto flex-shrink-0",children:[e.map(g=>{const y=g.id===t,v=n.includes(g.id);return S.jsxs("div",{role:"tab","aria-selected":y,onClick:()=>i(g.id),className:`
              group relative flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer
              select-none whitespace-nowrap border-b-2 transition-colors
              ${y?"text-ds-text border-ds-accent bg-ds-surface":"text-ds-text-muted border-transparent hover:text-ds-text hover:bg-ds-surface-2"}
            `,children:[v&&S.jsx("span",{className:"text-ds-accent","aria-label":"unsaved changes",children:"●"}),S.jsx("span",{children:g.name}),m&&S.jsx("button",{onClick:_=>{_.stopPropagation(),s(g.id)},className:"ml-1 text-ds-text-dim hover:text-ds-error opacity-0 group-hover:opacity-100 transition-opacity leading-none","aria-label":`Close ${g.name}`,tabIndex:-1,children:"×"})]},g.id)}),l.map(g=>{const y=g.id===c,v=d.includes(g.id);return S.jsxs("div",{role:"tab","aria-selected":y,onClick:()=>f==null?void 0:f(g.id),className:`
              group relative flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer
              select-none whitespace-nowrap border-b-2 transition-colors
              ${y?"text-ds-text border-ds-accent bg-ds-surface":"text-ds-text-muted border-transparent hover:text-ds-text hover:bg-ds-surface-2"}
            `,children:[v&&S.jsx("span",{className:"text-ds-accent","aria-label":"unsaved changes",children:"●"}),S.jsx("span",{children:g.name}),S.jsx("button",{onClick:_=>{_.stopPropagation(),p==null||p(g.id)},className:"ml-1 text-ds-text-dim hover:text-ds-error opacity-0 group-hover:opacity-100 transition-opacity leading-none","aria-label":`Close ${g.name}`,tabIndex:-1,children:"×"})]},`asset:${g.id}`)})]})},i4={[$n.Notice]:"bg-ds-success-bg text-ds-success",[$n.Error]:"bg-ds-error-bg text-ds-error",[$n.Warning]:"bg-ds-warning-bg text-ds-warning",[$n.Output]:"bg-ds-surface-2 text-ds-text-muted"},a4={[$n.Notice]:"OK",[$n.Error]:"ERR",[$n.Warning]:"WARN",[$n.Output]:"OUT"},s4=({logs:e})=>{const[t,n]=E.useState("console"),[i,s]=E.useState(!1),l=e.filter(d=>d.type===$n.Error),c=t==="console"?e:l;return S.jsxs("div",{className:"flex flex-col bg-ds-bg border-t border-ds-border",style:{height:i?"auto":"180px"},children:[S.jsxs("div",{role:"tablist",className:"flex items-center bg-ds-surface border-b border-ds-border flex-shrink-0 px-2",children:[["console","problems"].map(d=>{const f=t===d,p=d==="problems"?l.length:e.length,m=d==="problems"&&l.length>0?"bg-ds-error-bg text-ds-error":"bg-ds-surface-2 text-ds-text-dim";return S.jsxs("button",{role:"tab","aria-selected":f,onClick:()=>n(d),className:`
                flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 transition-colors capitalize
                ${f?"text-ds-text border-ds-accent":"text-ds-text-muted border-transparent hover:text-ds-text"}
              `,children:[d,p>0&&S.jsx("span",{className:`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${m}`,children:p})]},d)}),S.jsx("button",{onClick:()=>s(d=>!d),className:"ml-auto text-ds-text-dim hover:text-ds-text-muted px-2 py-1 text-xs transition-colors","aria-label":i?"Expand panel":"Collapse panel",children:i?"▲":"▼"})]}),!i&&S.jsxs("ul",{className:"flex-1 overflow-y-auto font-mono text-xs p-2 space-y-0.5",children:[c.length===0&&S.jsx("li",{className:"text-ds-text-dim py-1 px-1",children:"No output."}),c.map((d,f)=>S.jsxs("li",{className:"flex items-start gap-2 px-1 py-0.5",children:[S.jsx("span",{className:`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${i4[d.type]}`,children:a4[d.type]}),S.jsx("span",{className:"text-ds-text leading-relaxed",children:d.text})]},f))]})]})},l4=new Set([".png",".jpg",".jpeg",".gif",".webp",".svg",".bmp"]);function o4(e){const t=e.lastIndexOf(".");if(t===-1)return"text";const n=e.slice(t).toLowerCase();return l4.has(n)?"image":"text"}const c4=({asset:e})=>{const[t,n]=E.useState(!1),i=()=>n(!0);return S.jsx("div",{className:"flex flex-col items-center justify-center h-full p-4",children:t?S.jsx("p",{role:"alert",className:"text-ds-text-muted text-sm",children:"Unable to display image."}):S.jsx("img",{src:e.content,alt:e.name,onError:i,className:"max-w-full max-h-full object-contain"})})};function qp(e){const t=e.indexOf(",");if(t===-1)return"";try{return decodeURIComponent(escape(atob(e.slice(t+1))))}catch(n){return console.error("TextEditor: failed to decode asset content",n),""}}const u4=({asset:e,onDirtyChange:t})=>{const n=Or(),[i,s]=E.useState(()=>qp(e.content)),l=E.useMemo(()=>qp(e.content),[e.content]);E.useEffect(()=>{s(qp(e.content))},[e.id]);const c=i!==l,d=p=>{const m=p.target.value;s(m),t==null||t(e.id,m!==l)},f=()=>{const m=`data:${e.content.startsWith("data:")?e.content.slice(5,e.content.indexOf(";")):"text/plain"};base64,`+btoa(unescape(encodeURIComponent(i)));n(mA({...e,content:m})),t==null||t(e.id,!1)};return S.jsxs("div",{className:"flex flex-col h-full p-2 gap-2",children:[S.jsx("textarea",{"aria-label":"Asset text content",value:i,onChange:d,className:"flex-1 resize-none bg-ds-bg text-ds-text border border-ds-border rounded p-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ds-accent"}),S.jsx("div",{className:"flex justify-end",children:S.jsx("button",{type:"button",disabled:!c,onClick:f,className:"bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-1.5 rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed",children:"Save"})})]})},d4=({asset:e,onDirtyChange:t})=>o4(e.name)==="image"?S.jsx(c4,{asset:e}):S.jsx(u4,{asset:e,onDirtyChange:t}),f4=()=>{const e=Ku(),t=Ei(),n=Or(),{id:i}=Xg(),s=an(X=>X.projects.items.find(pe=>pe.id===i)),l=an(X=>X.session.transpiled),c=an(X=>X.session.logs),d=an(X=>X.files.dirtyFileIds),f=an(X=>X.assets.byId),[p,m]=E.useState({line:1,col:1}),[g,y]=E.useState([]),[v,_]=E.useState(null),[T,N]=E.useState([]),{run:C,stop:P,isRunning:k}=tF(i??"");rF(),iF();const I=xD(i??""),D=ed(i??""),[M,z]=E.useState(()=>D.map(X=>X.id));if(E.useEffect(()=>{z(X=>{const pe=D.map(x=>x.id).filter(x=>!X.includes(x));return pe.length>0?[...X,...pe]:X})},[D]),E.useEffect(()=>{s!=null&&s.id||(t.key!=="default"?e(-1):e("/"))},[s,e,t]),!s)return S.jsx("div",{className:"min-h-screen bg-ds-bg flex items-center justify-center text-ds-error text-sm",children:"Project not found."});const Z=X=>{X&&I&&n(oA({...I,source:X}))},W=X=>{_(null),n(Su({projectId:s.id,fileId:X}))},$=X=>{if((I==null?void 0:I.id)===X){const pe=M.indexOf(X),x=M.filter(U=>U!==X),q=x[pe]??x[pe-1];q&&n(Su({projectId:s.id,fileId:q}))}z(pe=>pe.filter(x=>x!==X))},re=X=>{g.some(pe=>pe.assetId===X)||y(pe=>[...pe,{assetId:X}]),_(X)},se=X=>{_(X)},Se=X=>{T.includes(X)&&!window.confirm("Discard unsaved changes?")||(y(pe=>pe.filter(x=>x.assetId!==X)),N(pe=>pe.filter(x=>x!==X)),v===X&&_(null))},ue=(X,pe)=>{N(x=>pe?x.includes(X)?x:[...x,X]:x.filter(q=>q!==X))},V=D.filter(X=>M.includes(X.id)),B=g.map(X=>{var pe;return{id:X.assetId,name:((pe=f[X.assetId])==null?void 0:pe.name)??"Unknown"}}),ee=v?f[v]:void 0;return S.jsx(n4,{header:S.jsxs(S.Fragment,{children:[S.jsx(ra,{to:"/",className:"mr-2 text-ds-text-dim hover:text-ds-text-muted transition-colors text-lg leading-none","aria-label":"Back to projects",title:"Back to projects",children:"‹"}),S.jsx("span",{className:"font-bold text-sm text-ds-accent-btn-text tracking-wide mr-3",children:"softBASIC"}),S.jsx("span",{className:"text-ds-text-dim text-sm",children:s.name}),I&&S.jsxs(S.Fragment,{children:[S.jsx("span",{className:"text-ds-text-dim mx-1.5 text-sm",children:"›"}),S.jsx("span",{className:"text-ds-text-muted text-sm",children:I.name})]}),S.jsx("div",{className:"flex-1"}),S.jsx("a",{href:"/docs",target:"_blank",rel:"noopener noreferrer",className:"text-sm text-ds-text-muted hover:text-ds-text transition-colors mr-2",children:"Docs"}),k?S.jsx("button",{onClick:P,className:"border border-ds-error text-ds-error text-sm font-semibold px-4 py-1.5 rounded-md hover:bg-ds-error-bg transition focus:outline-none focus:ring-2 focus:ring-ds-error","aria-label":"Stop project",children:"■ Stop"}):S.jsx("button",{onClick:C,className:"bg-ds-accent-btn text-ds-accent-btn-text text-sm font-semibold px-4 py-1.5 rounded-md hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-ds-accent","aria-label":"Run project",children:"▶ Run"})]}),activitySections:[{id:"files",icon:S.jsx(e4,{}),ariaLabel:"Files",content:S.jsx(JU,{projectId:s.id,onOpenAsset:re})},{id:"export",icon:S.jsx(t4,{}),ariaLabel:"Export project",onAction:()=>n(OE(s.id))}],editor:S.jsx(o0,{fallback:S.jsx("p",{className:"p-4 text-ds-error text-sm",children:"Editor failed to load."}),children:S.jsxs("div",{className:"flex flex-col h-full",children:[S.jsx(r4,{files:V,selectedFileId:v||I==null?void 0:I.id,dirtyFileIds:d,onSelect:W,onClose:$,assetTabs:B,selectedAssetTabId:v??void 0,dirtyAssetIds:T,onSelectAsset:se,onCloseAsset:Se}),S.jsx("div",{className:"flex-1 min-h-0",children:v&&ee?S.jsx(d4,{asset:ee,onDirtyChange:ue}):S.jsx(Qk,{onChange:Z,file:I,height:"100%",onCursorChange:(X,pe)=>m({line:X,col:pe})})})]})},s.id),preview:k?S.jsx(o0,{fallback:S.jsx("p",{className:"p-4 text-ds-error text-sm",children:"Preview failed to load."}),children:S.jsx(uM,{transpiled:l,projectId:s.id})},s.id):void 0,panel:S.jsx(s4,{logs:c}),footer:S.jsxs(S.Fragment,{children:[S.jsxs("span",{children:["Ln ",p.line,", Col ",p.col]}),S.jsx("span",{children:"Spaces: 2 · UTF-8 · LF"})]})})};function Dg(e){return e.groups?e.groups.flatMap(t=>t.topics):e.topics}const dd=[{id:"language-guide",label:"Language Guide",topics:[{slug:"modules",title:"Modules",file:"language-guide/modules.md"},{slug:"classes",title:"Classes",file:"language-guide/classes.md"},{slug:"self",title:"self.",file:"language-guide/self.md"},{slug:"variable-scoping",title:"Variable Scoping",file:"language-guide/variable-scoping.md"},{slug:"functions",title:"Functions",file:"language-guide/functions.md"},{slug:"lifecycle",title:"Lifecycle Functions",file:"language-guide/lifecycle.md"},{slug:"constructors",title:"Constructors",file:"language-guide/constructors.md"},{slug:"inheritance",title:"Inheritance",file:"language-guide/inheritance.md"},{slug:"multi-file",title:"Multi-file Projects",file:"language-guide/multi-file.md"},{slug:"class-composition",title:"Class Composition",file:"language-guide/class-composition.md"},{slug:"control-flow",title:"Control Flow",file:"language-guide/control-flow.md"},{slug:"operators",title:"Operators",file:"language-guide/operators.md"},{slug:"arrays",title:"Arrays",file:"language-guide/arrays.md"},{slug:"dictionaries",title:"Dictionaries",file:"language-guide/dictionaries.md"},{slug:"new-keyword",title:"The new Keyword",file:"language-guide/new-keyword.md"},{slug:"packages",title:"Packages",file:"language-guide/packages.md"}]},{id:"api-reference",label:"API Reference",topics:[],groups:[{label:"softGfx",topics:[{slug:"gfx",title:"gfx",file:"api-reference/gfx.md"},{slug:"input",title:"input",file:"api-reference/input.md"},{slug:"drawing",title:"drawing",file:"api-reference/drawing.md"},{slug:"stage",title:"stage",file:"api-reference/stage.md"},{slug:"pen",title:"pen",file:"api-reference/pen.md"},{slug:"assetmanager",title:"assetmanager",file:"api-reference/assetmanager.md"},{slug:"objecttransform",title:"ObjectTransform",file:"api-reference/objecttransform.md"},{slug:"sprite",title:"sprite",file:"api-reference/sprite.md"},{slug:"animatedsprite",title:"animatedsprite",file:"api-reference/animatedsprite.md"},{slug:"text",title:"text",file:"api-reference/text.md"},{slug:"tilemap",title:"tilemap",file:"api-reference/tilemap.md"}]},{label:"softCore",topics:[{slug:"math",title:"math",file:"api-reference/math.md"},{slug:"string",title:"string",file:"api-reference/string.md"},{slug:"array",title:"array",file:"api-reference/array.md"},{slug:"dict",title:"dict",file:"api-reference/dict.md"}]}]},{id:"tutorials",label:"Tutorials",topics:[{slug:"tutorial-01-hello-world",title:"1. Hello World",file:"tutorials/01-hello-world.md"},{slug:"tutorial-02-drawing",title:"2. Drawing on Screen",file:"tutorials/02-drawing.md"},{slug:"tutorial-03-sprite",title:"3. Your First Sprite",file:"tutorials/03-sprite.md"},{slug:"tutorial-04-motion",title:"4. Making Things Move",file:"tutorials/04-motion.md"},{slug:"tutorial-05-keyboard",title:"5. Keyboard Control",file:"tutorials/05-keyboard.md"},{slug:"tutorial-06-bounds",title:"6. Staying on Screen",file:"tutorials/06-bounds.md"},{slug:"tutorial-07-score",title:"7. Score and Text",file:"tutorials/07-score.md"},{slug:"tutorial-08-functions",title:"8. Functions",file:"tutorials/08-functions.md"},{slug:"tutorial-09-enemies",title:"9. Multiple Enemies",file:"tutorials/09-enemies.md"},{slug:"tutorial-10-classes",title:"10. How Classes Work",file:"tutorials/10-classes.md"},{slug:"tutorial-11-dodge",title:"11. Dodge!",file:"tutorials/11-dodge.md"}]}],p4=({sectionId:e})=>S.jsx("div",{className:"flex border-b border-ds-border bg-ds-surface px-4",children:dd.map(t=>{var l;const n=t.id===e,i=(l=t.topics[0])==null?void 0:l.slug,s=i?`/docs/${t.id}/${i}`:`/docs/${t.id}`;return S.jsx(ra,{to:s,className:["px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",n?"border-ds-accent text-ds-accent":"border-transparent text-ds-text-muted hover:text-ds-text"].join(" "),children:t.label},t.id)})}),h4=({sectionId:e,slug:t})=>{const n=dd.find(s=>s.id===e),i=s=>S.jsx(ra,{to:`/docs/${e}/${s.slug}`,className:["block px-4 py-1.5 text-sm transition-colors",s.slug===t?"border-l-2 border-ds-accent text-ds-text bg-ds-bg font-medium":"border-l-2 border-transparent text-ds-text-muted hover:text-ds-text"].join(" "),children:s.title},s.slug);return!n||Dg(n).length===0?S.jsx("aside",{className:"w-52 flex-shrink-0 border-r border-ds-border bg-ds-surface overflow-y-auto",children:S.jsx("div",{className:"py-4",children:S.jsx("p",{className:"px-4 py-2 text-xs text-ds-text-dim",children:"Coming soon."})})}):S.jsx("aside",{className:"w-52 flex-shrink-0 border-r border-ds-border bg-ds-surface overflow-y-auto",children:S.jsx("div",{className:"py-4",children:n.groups?n.groups.map(s=>S.jsxs("div",{children:[S.jsx("p",{className:"text-xs text-ds-text-dim uppercase tracking-wider px-4 pt-4 pb-1",children:s.label}),s.topics.map(i)]},s.label)):n.topics.map(i)})})},m4=`# animatedsprite

An \`animatedsprite\` plays frame-by-frame animations from a sprite sheet. The sprite sheet must be a grid of equal-sized frames. Extend it using \`Extends animatedsprite\` in your class file.

Position is controlled through \`self.transform\` — see [ObjectTransform](objecttransform).

## Constructor

\`\`\`bas
Class
Extends animatedsprite

Constructor()
  super("character.png", 32, 32)
  stage.add(self)
EndConstructor
\`\`\`

| Parameter | Type   | Description |
|-----------|--------|-------------|
| imagePath | string | Filename of the sprite sheet |
| frameW    | number | Width of each frame in pixels |
| frameH    | number | Height of each frame in pixels |

## addAnim(name, startFrame, endFrame, fps, loop)

Defines a named animation from a range of frames on the sprite sheet. Frames are numbered from 0 starting at the top-left, going left to right.

| Parameter  | Type              | Description |
|------------|-------------------|-------------|
| name       | string            | A name for this animation, e.g. \`"walk"\`, \`"jump"\` |
| startFrame | number            | Index of the first frame (0 = top-left frame) |
| endFrame   | number            | Index of the last frame (inclusive) |
| fps        | number            | How many frames to show per second |
| loop       | \`true\` or \`false\` | \`true\` to repeat the animation, \`false\` to play once |

\`\`\`bas
function onenter()
  self.addAnim("walk", 0, 7, 12, true)
  self.addAnim("jump", 8, 11, 10, false)
endfunction
\`\`\`

## play(name)

Starts playing a named animation.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| name      | string | The animation to play, as defined with \`addAnim\` |

\`\`\`bas
self.play("walk")
\`\`\`

## isPlaying(name)

Checks whether a specific animation is currently playing.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| name      | string | The animation name to check |

**Returns:** \`true\` if the named animation is playing, \`false\` if not.

\`\`\`bas
if not self.isPlaying("jump") then
  self.play("walk")
endif
\`\`\`

## setAngle(angle)

Rotates the sprite.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| angle     | number | Rotation in degrees |

\`\`\`bas
self.setAngle(90)
\`\`\`

## setAlpha(a)

Sets the transparency of the sprite.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | number | Opacity from 0 (invisible) to 1 (fully visible) |

\`\`\`bas
self.setAlpha(0.8)
\`\`\`

## setScale(sx, sy)

Resizes the sprite.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| sx        | number | Horizontal scale multiplier |
| sy        | number | Vertical scale multiplier |

\`\`\`bas
self.setScale(2, 2)
\`\`\`

## setFlip(h, v)

Mirrors the sprite.

| Parameter | Type              | Description |
|-----------|-------------------|-------------|
| h         | \`true\` or \`false\` | \`true\` to mirror left-to-right |
| v         | \`true\` or \`false\` | \`true\` to flip upside-down |

\`\`\`bas
self.setFlip(true, false)
\`\`\`

## setVisible(v)

Shows or hides the sprite.

| Parameter | Type              | Description |
|-----------|-------------------|-------------|
| v         | \`true\` or \`false\` | \`true\` to show, \`false\` to hide |

\`\`\`bas
self.setVisible(false)
\`\`\`

## width()

Returns the frame width in pixels.

**Returns:** number

\`\`\`bas
dim w
w = self.width()
\`\`\`

## height()

Returns the frame height in pixels.

**Returns:** number

\`\`\`bas
dim h
h = self.height()
\`\`\`
`,g4=`# array

The \`array\` module provides functions for working with arrays. It is part of the **softCore** package.

Arrays in softBASIC are declared with a size: \`dim scores(10)\` creates an array of 10 elements. The functions below let you work with them dynamically.

## arrLength(a)

Returns the number of elements in an array.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| a         | array | The array to measure |

**Returns:** number

\`\`\`bas
dim items(5)
dim n
n = array.arrLength(items)   ' n is 5
\`\`\`

## push(arr, item)

Adds an item to the end of an array.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| arr       | array | The array to add to |
| item      | any   | The value to add |

\`\`\`bas
dim scores(0)
array.push(scores, 100)
array.push(scores, 200)
\`\`\`

## pop(arr)

Removes and returns the last item in an array.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| arr       | array | The array to remove from |

**Returns:** the removed item.

\`\`\`bas
dim scores(0)
array.push(scores, 100)
array.push(scores, 200)
dim last
last = array.pop(scores)   ' last is 200, scores now has one item
\`\`\`

## contains(arr, item)

Checks whether an array contains a specific value.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| arr       | array | The array to search |
| item      | any   | The value to look for |

**Returns:** \`true\` if found, \`false\` if not.

\`\`\`bas
if array.contains(inventory, "sword") then
  print "You have a sword"
endif
\`\`\`

## indexOf(arr, item)

Returns the position of a value in an array. Returns -1 if not found. Positions start at 0.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| arr       | array | The array to search |
| item      | any   | The value to find |

**Returns:** number

\`\`\`bas
dim pos
pos = array.indexOf(inventory, "potion")
\`\`\`

## remove(arr, index)

Removes the item at a specific position and shifts the remaining items down.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| arr       | array  | The array to modify |
| index     | number | Position to remove (0 = first item) |

\`\`\`bas
array.remove(inventory, 0)   ' removes the first item
\`\`\`

## join(a, s)

Joins all items in an array into a single string, separated by \`s\`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | array  | The array to join |
| s         | string | Separator between items |

**Returns:** string

\`\`\`bas
dim items(3)
items(0) = "sword"
items(1) = "shield"
items(2) = "potion"
dim result
result = array.join(items, ", ")   ' result is "sword, shield, potion"
\`\`\`

## clear(arr)

Removes all items from an array.

| Parameter | Type  | Description |
|-----------|-------|-------------|
| arr       | array | The array to clear |

\`\`\`bas
array.clear(inventory)
\`\`\`
`,b4=`# assetmanager

The \`assetmanager\` module lets you retrieve images from your project's asset library by name. Images are loaded automatically when your project starts — you only need this module when you want to pass an image reference to your own code rather than a filename string.

## loadImage(name)

Retrieves a loaded image from your project assets by its filename.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| name      | string | The filename of the image, as it appears in your project's Assets panel, e.g. \`"player.png"\` |

**Returns:** object — the loaded image. Sprites and tilemaps accept a filename string directly in their constructors, so you usually do not need to use this return value.

> **Note:** If the filename doesn't match an image in your Assets panel exactly, this will throw an error.

\`\`\`bas
dim playerImage
playerImage = assetmanager.loadImage("player.png")
\`\`\`
`,y4=`# dict

The \`dict\` module provides functions for working with dictionaries.

A dictionary stores values under named keys. Use \`dim name[]\` to declare one, square brackets to set and get values, and \`dict.*\` functions for common operations.

---

## keys

Returns an array containing all keys in the dictionary.

| Parameter | Type | Description |
|---|---|---|
| \`dic\` | object | The dictionary to read from |

**Returns:** array — the keys as a new array.

\`\`\`bas
dim scores[]
scores["Alice"] = 100
scores["Bob"] = 80

dim k
k = dict.keys(scores)
print array.length(k)   ' 2
\`\`\`

---

## values

Returns an array containing all values in the dictionary.

| Parameter | Type | Description |
|---|---|---|
| \`dic\` | object | The dictionary to read from |

**Returns:** array — the values as a new array.

\`\`\`bas
dim scores[]
scores["Alice"] = 100
scores["Bob"] = 80

dim v
v = dict.values(scores)
print array.join(v, ", ")   ' 100, 80
\`\`\`

---

## joinKeys

Joins all keys in the dictionary into a single string, separated by a delimiter.

| Parameter | Type | Description |
|---|---|---|
| \`dic\` | object | The dictionary |
| \`sep\` | string | The separator string |

**Returns:** string — keys joined by the separator.

\`\`\`bas
dim inventory[]
inventory["sword"] = 1
inventory["shield"] = 1

dim s
s = dict.joinKeys(inventory, ", ")
print s   ' sword, shield
\`\`\`
`,v4=`# drawing

The \`drawing\` module lets you draw shapes directly onto the canvas. Shapes are drawn immediately when the function is called. Use the [pen](pen) module to set fill colour, line colour, and line width before drawing.

## drawLine(x, y, x2, y2)

Draws a straight line between two points.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal start position in pixels |
| y         | number | Vertical start position in pixels |
| x2        | number | Horizontal end position in pixels |
| y2        | number | Vertical end position in pixels |

\`\`\`bas
pen.setLineColor(255, 0, 0)
pen.setLineWidth(2)
drawing.drawLine(0, 0, 100, 100)
\`\`\`

## drawRect(x, y, width, height)

Draws a filled rectangle.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal position of the centre of the rectangle |
| y         | number | Vertical position of the centre of the rectangle |
| width     | number | Width of the rectangle in pixels |
| height    | number | Height of the rectangle in pixels |

\`\`\`bas
pen.setFillColor(0, 128, 255)
drawing.drawRect(50, 50, 200, 100)
\`\`\`

## drawCircle(x, y, radius)

Draws a filled circle.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal position of the centre |
| y         | number | Vertical position of the centre |
| radius    | number | Radius of the circle in pixels |

\`\`\`bas
pen.setFillColor(255, 200, 0)
drawing.drawCircle(stage.width() / 2, stage.height() / 2, 40)
\`\`\`
`,_4=`# gfx

The \`gfx\` module provides collision detection. Include the **softGfx** package in your project to use it.

For keyboard and mouse input, see [input](input).

## boxCollide(a, b)

Checks whether two sprites overlap. Uses a simple bounding-box test — if the rectangular areas of the two sprites touch or overlap, this returns \`true\`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | object | First sprite instance |
| b         | object | Second sprite instance |

**Returns:** \`true\` if the sprites overlap, \`false\` if they do not.

\`\`\`bas
if gfx.boxCollide(player, enemy) then
  player.takeDamage(10)
endif
\`\`\`
`,x4=`# input

The \`input\` module handles keyboard and mouse input. Include the **softGfx** package in your project to use it.

Key codes are numeric values that identify keyboard keys. Common key codes:

| Key | Code |
|-----|------|
| Left arrow | 37 |
| Up arrow | 38 |
| Right arrow | 39 |
| Down arrow | 40 |
| Space | 32 |
| Enter | 13 |
| Escape | 27 |
| A–Z | 65–90 |
| 0–9 | 48–57 |

## getKeyDown(keycode)

Checks whether a specific key is currently held down.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| keycode   | number | The numeric key code to check |

**Returns:** \`true\` if the key is held down, \`false\` if it is not.

\`\`\`bas
function onupdate(delta)
  if input.getKeyDown(39) then
    self.transform.setPosition(self.transform.x() + 5, self.transform.y())
  endif
endfunction
\`\`\`

## mouseX()

Returns the current horizontal position of the mouse cursor on the canvas.

**Returns:** number — the x coordinate in pixels from the left edge.

\`\`\`bas
dim cursorX
cursorX = input.mouseX()
\`\`\`

## mouseY()

Returns the current vertical position of the mouse cursor on the canvas.

**Returns:** number — the y coordinate in pixels from the top edge.

\`\`\`bas
dim cursorY
cursorY = input.mouseY()
\`\`\`

## mouseDown()

Checks whether the primary mouse button is currently held down.

**Returns:** \`true\` if the mouse button is pressed, \`false\` if not.

\`\`\`bas
function onupdate(delta)
  if input.mouseDown() then
    fireProjectile()
  endif
endfunction
\`\`\`
`,w4=`# math

The \`math\` module provides mathematical functions. It is part of the **softCore** package.

## Basic Arithmetic

### abs(n)

Returns the absolute (positive) value of a number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number — the positive version of \`n\`.

\`\`\`bas
dim result
result = math.abs(-5)   ' result is 5
\`\`\`

### pow(base, exponent)

Raises a number to a power.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| base      | number | The number to raise |
| exponent  | number | The power to raise it to |

**Returns:** number

\`\`\`bas
dim result
result = math.pow(2, 8)   ' result is 256
\`\`\`

### sqrt(n)

Returns the square root of a number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | A non-negative number |

**Returns:** number

\`\`\`bas
dim result
result = math.sqrt(16)   ' result is 4
\`\`\`

### cbrt(n)

Returns the cube root of a number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

\`\`\`bas
dim result
result = math.cbrt(27)   ' result is 3
\`\`\`

### sign(n)

Returns -1 if \`n\` is negative, 0 if \`n\` is zero, or 1 if \`n\` is positive.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

\`\`\`bas
dim s
s = math.sign(-5)   ' s is -1
\`\`\`

## Rounding

### floor(n)

Rounds a number down to the nearest whole number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

\`\`\`bas
dim result
result = math.floor(3.9)   ' result is 3
\`\`\`

### ceil(n)

Rounds a number up to the nearest whole number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

\`\`\`bas
dim result
result = math.ceil(3.1)   ' result is 4
\`\`\`

### round(n)

Rounds a number to the nearest whole number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

\`\`\`bas
dim result
result = math.round(3.5)   ' result is 4
\`\`\`

### trunc(n)

Removes the decimal part of a number without rounding.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

\`\`\`bas
dim result
result = math.trunc(3.9)   ' result is 3
\`\`\`

## Random Numbers

### random(max)

Returns a random decimal number from 0 up to (but not including) \`max\`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| max       | number | The upper limit (not included in results) |

**Returns:** number

\`\`\`bas
dim roll
roll = math.random(1.0)   ' a random float between 0 and 1
\`\`\`

### randomint(max)

Returns a random whole number from 0 up to (but not including) \`max\`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| max       | number | The number of possible values (results range from 0 to max-1) |

**Returns:** number

\`\`\`bas
dim side
side = math.randomint(4)   ' gives 0, 1, 2, or 3
\`\`\`

## Comparison

### min(a, b)

Returns the smaller of two numbers.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | number | First number |
| b         | number | Second number |

**Returns:** number

\`\`\`bas
health = math.min(health, 100)   ' caps health at 100
\`\`\`

### max(a, b)

Returns the larger of two numbers.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | number | First number |
| b         | number | Second number |

**Returns:** number

\`\`\`bas
health = math.max(health, 0)   ' prevents health going below 0
\`\`\`

### clamp(value, min, max)

Keeps a number within a range. If \`value\` is less than \`min\`, returns \`min\`. If greater than \`max\`, returns \`max\`. Otherwise returns \`value\`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| value     | number | The number to clamp |
| min       | number | Lower bound |
| max       | number | Upper bound |

**Returns:** number

\`\`\`bas
speed = math.clamp(speed, 0, 10)
\`\`\`

## Distance and Interpolation

### distance(x1, y1, x2, y2)

Returns the straight-line distance between two points.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x1        | number | X coordinate of the first point |
| y1        | number | Y coordinate of the first point |
| x2        | number | X coordinate of the second point |
| y2        | number | Y coordinate of the second point |

**Returns:** number

\`\`\`bas
dim dist
dist = math.distance(player.transform.x(), player.transform.y(), enemy.transform.x(), enemy.transform.y())
\`\`\`

### lerp(a, b, t)

Smoothly blends between two values. When \`t\` is 0 the result is \`a\`; when \`t\` is 1 the result is \`b\`; values in between give a proportional blend.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | number | Start value |
| b         | number | End value |
| t         | number | Blend amount, 0–1 |

**Returns:** number

\`\`\`bas
dim smoothX
smoothX = math.lerp(currentX, targetX, 0.1)   ' moves 10% closer each frame
\`\`\`

## Trigonometry

### sin(angle)

Returns the sine of an angle in radians.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| angle     | number | Angle in radians |

**Returns:** number

\`\`\`bas
dim y
y = math.sin(angle) * radius
\`\`\`

### cos(angle)

Returns the cosine of an angle in radians.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| angle     | number | Angle in radians |

**Returns:** number

\`\`\`bas
dim x
x = math.cos(angle) * radius
\`\`\`

### tan(angle)

Returns the tangent of an angle in radians.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| angle     | number | Angle in radians |

**Returns:** number

\`\`\`bas
dim slope
slope = math.tan(angle)
\`\`\`

### asin(n)

Returns the arcsine (inverse sine) of \`n\` in radians.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | A value between -1 and 1 |

**Returns:** number

\`\`\`bas
dim angle
angle = math.asin(0.5)   ' approximately 0.524 radians
\`\`\`

### acos(n)

Returns the arccosine (inverse cosine) of \`n\` in radians.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | A value between -1 and 1 |

**Returns:** number

\`\`\`bas
dim angle
angle = math.acos(0.5)   ' approximately 1.047 radians
\`\`\`

### atan(n)

Returns the arctangent (inverse tangent) of \`n\` in radians.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

\`\`\`bas
dim angle
angle = math.atan(1)   ' approximately 0.785 radians (45 degrees)
\`\`\`

### atan2(y, x)

Returns the angle in radians between the positive x-axis and the point \`(x, y)\`. Useful for pointing a sprite towards a target.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| y         | number | Vertical distance to target |
| x         | number | Horizontal distance to target |

**Returns:** number — angle in radians.

\`\`\`bas
dim angle
angle = math.atan2(targetY - selfY, targetX - selfX)
\`\`\`

### sinh(n)

Returns the hyperbolic sine of \`n\`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

\`\`\`bas
dim result
result = math.sinh(1)   ' approximately 1.175
\`\`\`

### cosh(n)

Returns the hyperbolic cosine of \`n\`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

\`\`\`bas
dim result
result = math.cosh(1)   ' approximately 1.543
\`\`\`

### tanh(n)

Returns the hyperbolic tangent of \`n\`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

\`\`\`bas
dim result
result = math.tanh(1)   ' approximately 0.762
\`\`\`

### asinh(n)

Returns the inverse hyperbolic sine of \`n\`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Any number |

**Returns:** number

\`\`\`bas
dim result
result = math.asinh(1)   ' approximately 0.881
\`\`\`

### acosh(n)

Returns the inverse hyperbolic cosine of \`n\`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | A number ≥ 1 |

**Returns:** number

\`\`\`bas
dim result
result = math.acosh(2)   ' approximately 1.317
\`\`\`

### atanh(n)

Returns the inverse hyperbolic tangent of \`n\`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | A value between -1 and 1 |

**Returns:** number

\`\`\`bas
dim result
result = math.atanh(0.5)   ' approximately 0.549
\`\`\`

## Logarithms and Exponents

### exp(n)

Returns e raised to the power \`n\`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | The exponent |

**Returns:** number

\`\`\`bas
dim result
result = math.exp(1)   ' result is approximately 2.718
\`\`\`

### log(n)

Returns the natural logarithm of \`n\`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | A positive number |

**Returns:** number

\`\`\`bas
dim result
result = math.log(math.euler())   ' result is 1
\`\`\`

### log2(n)

Returns the base-2 logarithm of \`n\`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | A positive number |

**Returns:** number

\`\`\`bas
dim result
result = math.log2(8)   ' result is 3
\`\`\`

### log10(n)

Returns the base-10 logarithm of \`n\`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | A positive number |

**Returns:** number

\`\`\`bas
dim result
result = math.log10(1000)   ' result is 3
\`\`\`

## Constants

### pi()

Returns the mathematical constant π (approximately 3.14159).

**Returns:** number

\`\`\`bas
dim circumference
circumference = 2 * math.pi() * radius
\`\`\`

### euler()

Returns Euler's number e (approximately 2.71828).

**Returns:** number

\`\`\`bas
dim result
result = math.euler()   ' result is approximately 2.718
\`\`\`

## Conversion

### val(s)

Converts a string to a number.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | A string containing a number, e.g. \`"42"\` |

**Returns:** number

\`\`\`bas
dim n
n = math.val("42")   ' n is 42
\`\`\`
`,E4=`# ObjectTransform

\`ObjectTransform\` controls the position of a sprite, animated sprite, or tilemap on the canvas. You do not create an \`ObjectTransform\` yourself — it is always accessed through the \`.transform\` property on an object that has one.

\`\`\`bas
self.transform.setPosition(100, 200)
\`\`\`

See [sprite](sprite), [animatedsprite](animatedsprite), and [tilemap](tilemap) for examples of how \`.transform\` is used.

## setPosition(x, y)

Moves the object to an exact position on the canvas.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal position in pixels from the left edge |
| y         | number | Vertical position in pixels from the top edge |

\`\`\`bas
function onenter()
  self.transform.setPosition(100, 200)
endfunction
\`\`\`

## x()

Returns the current horizontal position of the object.

**Returns:** number — x coordinate in pixels.

\`\`\`bas
dim currentX
currentX = self.transform.x()
\`\`\`

## y()

Returns the current vertical position of the object.

**Returns:** number — y coordinate in pixels.

\`\`\`bas
dim currentY
currentY = self.transform.y()
\`\`\`
`,S4=`# pen

The \`pen\` module controls the colours and line thickness used by the [drawing](drawing) module. Call these functions before calling \`drawLine\`, \`drawRect\`, or \`drawCircle\` to set the style.

## setFillColor(r, g, b)

Sets the colour used to fill shapes drawn after this call.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| r         | number | Red component, 0–255 |
| g         | number | Green component, 0–255 |
| b         | number | Blue component, 0–255 |

\`\`\`bas
pen.setFillColor(255, 0, 0)
drawing.drawCircle(100, 100, 30)
\`\`\`

## setLineColor(r, g, b)

Sets the colour of lines and shape outlines drawn after this call.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| r         | number | Red component, 0–255 |
| g         | number | Green component, 0–255 |
| b         | number | Blue component, 0–255 |

\`\`\`bas
pen.setLineColor(255, 255, 255)
drawing.drawLine(0, 0, 200, 200)
\`\`\`

## setLineWidth(n)

Sets the thickness of lines drawn after this call.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Line thickness in pixels |

\`\`\`bas
pen.setLineWidth(3)
drawing.drawRect(10, 10, 80, 40)
\`\`\`
`,C4=`# sprite

A \`sprite\` displays a single image on the canvas. Extend it using \`Extends sprite\` in your class file, then call \`super("image.png")\` in your constructor.

Position is controlled through \`self.transform\` — see [ObjectTransform](objecttransform).

## Constructor

\`\`\`bas
Class
Extends sprite

Constructor()
  super("player.png")
  stage.add(self)
EndConstructor
\`\`\`

| Parameter | Type   | Description |
|-----------|--------|-------------|
| imagePath | string | Filename of the image to display, e.g. \`"player.png"\` |

## setAngle(angle)

Rotates the sprite.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| angle     | number | Rotation in degrees. 0 is no rotation, 90 is a quarter turn clockwise. |

\`\`\`bas
self.setAngle(45)
\`\`\`

## setAlpha(a)

Sets how transparent the sprite is.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | number | Opacity from 0 (fully invisible) to 1 (fully visible) |

\`\`\`bas
self.setAlpha(0.5)
\`\`\`

## setScale(sx, sy)

Resizes the sprite by a multiplier.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| sx        | number | Horizontal scale. 1 is normal size, 2 is double width, 0.5 is half width. |
| sy        | number | Vertical scale. 1 is normal size, 2 is double height. |

\`\`\`bas
self.setScale(2, 2)
\`\`\`

## setFlip(h, v)

Mirrors the sprite horizontally or vertically.

| Parameter | Type              | Description |
|-----------|-------------------|-------------|
| h         | \`true\` or \`false\` | Pass \`true\` to mirror left-to-right |
| v         | \`true\` or \`false\` | Pass \`true\` to flip upside-down |

\`\`\`bas
self.setFlip(true, false)
\`\`\`

## setVisible(v)

Shows or hides the sprite without removing it from the stage.

| Parameter | Type              | Description |
|-----------|-------------------|-------------|
| v         | \`true\` or \`false\` | \`true\` to show, \`false\` to hide |

\`\`\`bas
self.setVisible(false)
\`\`\`

## setTexture(path)

Swaps the image displayed by the sprite.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| path      | string | Filename of the new image |

\`\`\`bas
self.setTexture("player_hurt.png")
\`\`\`

## width()

Returns the width of the sprite in pixels.

**Returns:** number

\`\`\`bas
dim w
w = self.width()
\`\`\`

## height()

Returns the height of the sprite in pixels.

**Returns:** number

\`\`\`bas
dim h
h = self.height()
\`\`\`
`,T4=`# stage

The \`stage\` module controls which objects are visible on screen and provides information about the canvas size. Any sprite, text, or tilemap must be added to the stage before it will appear.

## add(obj)

Adds an object to the stage so it becomes visible.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| obj       | object | A sprite, animatedsprite, text, or tilemap instance |

\`\`\`bas
function onenter()
  stage.add(self)
endfunction
\`\`\`

## remove(obj)

Removes an object from the stage so it is no longer visible.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| obj       | object | The object to remove |

\`\`\`bas
stage.remove(enemy)
\`\`\`

## clear()

Removes all objects from the stage at once.

\`\`\`bas
function onenter()
  stage.clear()
endfunction
\`\`\`

## width()

Returns the width of the canvas in pixels.

**Returns:** number

\`\`\`bas
dim centreX
centreX = stage.width() / 2
\`\`\`

## height()

Returns the height of the canvas in pixels.

**Returns:** number

\`\`\`bas
dim centreY
centreY = stage.height() / 2
\`\`\`

## setBackground(r, g, b)

Sets the background colour of the canvas using red, green, and blue values (0–255 each).

| Parameter | Type   | Description |
|-----------|--------|-------------|
| r         | number | Red component, 0–255 |
| g         | number | Green component, 0–255 |
| b         | number | Blue component, 0–255 |

\`\`\`bas
function onenter()
  stage.setBackground(30, 30, 50)
endfunction
\`\`\`
`,O4=`# string

The \`string\` module provides functions for working with text. It is part of the **softCore** package.

## len(s)

Returns the number of characters in a string.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to measure |

**Returns:** number

\`\`\`bas
dim n
n = string.len("hello")   ' n is 5
\`\`\`

## lcase(s)

Converts all letters in a string to lowercase.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to convert |

**Returns:** string

\`\`\`bas
dim result
result = string.lcase("HELLO")   ' result is "hello"
\`\`\`

## ucase(s)

Converts all letters in a string to uppercase.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to convert |

**Returns:** string

\`\`\`bas
dim result
result = string.ucase("hello")   ' result is "HELLO"
\`\`\`

## trim(s)

Removes spaces from the start and end of a string.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to trim |

**Returns:** string

\`\`\`bas
dim result
result = string.trim("  hello  ")   ' result is "hello"
\`\`\`

## str(n)

Converts a number to a string. Useful for displaying scores or other values in text objects.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | The number to convert |

**Returns:** string

\`\`\`bas
dim display
display = "Score: " + string.str(score)
\`\`\`

## substr(s, start, end)

Returns a section of a string, from position \`start\` up to (but not including) position \`end\`. Positions start at 0.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The source string |
| start     | number | Position to start from (0 = first character) |
| end       | number | Position to stop at (not included in result) |

**Returns:** string

\`\`\`bas
dim result
result = string.substr("hello world", 0, 5)   ' result is "hello"
\`\`\`

## replace(s, a, b)

Replaces every occurrence of \`a\` in \`s\` with \`b\`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The source string |
| a         | string | The text to find |
| b         | string | The text to replace it with |

**Returns:** string

\`\`\`bas
dim result
result = string.replace("hello world", "world", "there")   ' result is "hello there"
\`\`\`

## split(s, c)

Splits a string into an array using a separator character.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to split |
| c         | string | The separator character |

**Returns:** array of strings

\`\`\`bas
dim parts
parts = string.split("a,b,c", ",")   ' parts is ["a", "b", "c"]
\`\`\`

## contains(s, sub)

Checks whether a string contains a given piece of text.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to search |
| sub       | string | The text to look for |

**Returns:** \`true\` if found, \`false\` if not.

\`\`\`bas
if string.contains(name, "boss") then
  print "it's a boss!"
endif
\`\`\`

## indexof(s, sub)

Returns the position of the first occurrence of \`sub\` in \`s\`. Returns -1 if not found. Positions start at 0.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to search |
| sub       | string | The text to find |

**Returns:** number

\`\`\`bas
dim pos
pos = string.indexof("hello", "ll")   ' pos is 2
\`\`\`

## padstart(s, n, p)

Pads the start of a string with a character until it reaches the desired length.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to pad |
| n         | number | The target length |
| p         | string | The padding character |

**Returns:** string

\`\`\`bas
dim result
result = string.padstart("7", 3, "0")   ' result is "007"
\`\`\`

## padend(s, n, p)

Pads the end of a string with a character until it reaches the desired length.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | The string to pad |
| n         | number | The target length |
| p         | string | The padding character |

**Returns:** string

\`\`\`bas
dim result
result = string.padend("hi", 5, ".")   ' result is "hi..."
\`\`\`

## char(n)

Returns the character for a given character code.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Character code (e.g. 65 = "A") |

**Returns:** string (single character)

\`\`\`bas
dim result
result = string.char(65)   ' result is "A"
\`\`\`

## asc(s)

Returns the character code of the first character in a string.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| s         | string | A string (uses the first character) |

**Returns:** number

\`\`\`bas
dim code
code = string.asc("A")   ' code is 65
\`\`\`
`,R4=`# text

The \`text\` class renders a string of text on the canvas. Extend it using \`Extends text\` in your class file.

Unlike [sprite](sprite) and [tilemap](tilemap), \`text\` does not have a \`.transform\` property. Use \`setPosition(x, y)\` directly to move it.

## Constructor

\`\`\`bas
Class
Extends text

Constructor()
  super("Score: 0", 20, 20)
  stage.add(self)
EndConstructor
\`\`\`

| Parameter | Type   | Description |
|-----------|--------|-------------|
| content   | string | The text to display |
| x         | number | Horizontal position in pixels |
| y         | number | Vertical position in pixels |

## setText(content)

Changes the displayed text.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| content   | string | The new text to show |

\`\`\`bas
self.setText("Score: " + str(score))
\`\`\`

## setPosition(x, y)

Moves the text to a new position.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal position in pixels |
| y         | number | Vertical position in pixels |

\`\`\`bas
self.setPosition(stage.width() - 100, 20)
\`\`\`

## setAlpha(a)

Sets the transparency of the text.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | number | Opacity from 0 (invisible) to 1 (fully visible) |

\`\`\`bas
self.setAlpha(0.5)
\`\`\`

## setStyle(size, r, g, b)

Sets the font size and colour.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| size      | number | Font size in points |
| r         | number | Red component of the colour, 0–255 |
| g         | number | Green component, 0–255 |
| b         | number | Blue component, 0–255 |

\`\`\`bas
self.setStyle(24, 255, 255, 0)
\`\`\`
`,N4=`# tilemap

A \`tilemap\` renders a tile-based level on the canvas. It takes a tile sheet (a grid of equally-sized tiles) and a JSON file describing where each tile goes. Extend it using \`Extends tilemap\` in your class file.

Position is controlled through \`self.transform\` — see [ObjectTransform](objecttransform).

## Constructor

\`\`\`bas
Class
Extends tilemap

Constructor()
  super("tiles.png", 32, 32)
  stage.add(self)
EndConstructor
\`\`\`

| Parameter   | Type   | Description |
|-------------|--------|-------------|
| tilesetPath | string | Filename of the tile sheet image |
| tileW       | number | Width of each tile in pixels |
| tileH       | number | Height of each tile in pixels |

## load(jsonPath)

Loads a tilemap layout from a JSON file in your project assets.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| jsonPath  | string | Filename of the JSON layout file |

\`\`\`bas
function onenter()
  self.load("level1.json")
endfunction
\`\`\`

## tileAt(x, y)

Returns the tile ID at a given world position. Useful for checking what the player is standing on.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal world position in pixels |
| y         | number | Vertical world position in pixels |

**Returns:** number — the tile ID at that position, or 0 if the position is empty.

\`\`\`bas
dim tile
tile = self.tileAt(player.transform.x(), player.transform.y())
if tile = 1 then
  print "standing on grass"
endif
\`\`\`

## widthPx()

Returns the total width of the tilemap in pixels.

**Returns:** number

\`\`\`bas
dim mapW
mapW = self.widthPx()
\`\`\`

## heightPx()

Returns the total height of the tilemap in pixels.

**Returns:** number

\`\`\`bas
dim mapH
mapH = self.heightPx()
\`\`\`
`,A4=`# Arrays

Arrays store ordered collections of values.

## Declaration

\`\`\`bas
dim scores(10)   ' array of 10 elements, indices 0–9
\`\`\`

## Access

\`\`\`bas
scores(0) = 100
scores(1) = 200
print scores(0)   ' 100
\`\`\`

## Iteration

\`\`\`bas
dim i
for i = 0 to 9
  print scores(i)
next i
\`\`\`

## Typed arrays

A typed array holds elements of a specific class. Declare it with \`dim arr(N) as ClassName\` and assign each slot individually with \`new\`:

\`\`\`bas
dim enemies(3) as Enemy
enemies(0) = new Enemy("goblin.png")
enemies(1) = new Enemy("orc.png")
enemies(2) = new Enemy("troll.png")

enemies(0).update()
\`\`\`

All slots start empty. Accessing an unassigned slot stops the game with a null reference error.

See [The new Keyword](new-keyword) for the full reference.

## Related Topics

- [Variable Scoping](variable-scoping)
- [Control Flow](control-flow)
`,D4=`# Class Composition

Classes can hold instances of other classes as properties, set up inside the constructor.

## Pattern

\`\`\`bas
Class
Extends sprite

Constructor(imagePath)
  super(imagePath)
  dim self.weapon as Weapon()
EndConstructor

function onupdate(delta)
  self.weapon.update(delta)
endfunction
\`\`\`

Here, each instance of this class owns its own \`Weapon\` instance stored at \`self.weapon\`.

## Why Composition

softBASIC supports single-level inheritance only. For more complex object relationships, compose objects by nesting instances.

## softGfx Example

The built-in softGfx classes use this pattern: \`Sprite\`, \`AnimatedSprite\`, and \`TileMap\` each hold an \`ObjectTransform\` instance at \`self.transform\`:

\`\`\`bas
Class
Extends sprite

Constructor()
  super("player.png")
EndConstructor

function onenter()
  self.transform.setPosition(100, 200)
endfunction
\`\`\`

## Related Topics

- [Classes](classes)
- [Constructors](constructors)
- [Inheritance](inheritance)
- [Packages](packages)
`,k4=`# Classes

A file is declared as a **class** by placing the \`Class\` keyword alone on line 1. Classes support multiple instances, each with their own state.

## Declaration

\`\`\`bas
Class
dim health
dim x
dim y
\`\`\`

The class name is derived from the filename (lowercase, no extension). A file named \`Enemy.bas\` produces a class named \`enemy\`.

## Instance Variables

Variables declared with \`dim\` inside a class body (outside any function or constructor) are prototype properties — they exist on every instance. Access them inside methods using \`self.\`:

\`\`\`bas
Class
dim health

function takeDamage(amount)
  self.health = self.health - amount
endfunction
\`\`\`

## Creating Instances

\`\`\`bas
dim e1 as enemy()
dim e2 as enemy()
\`\`\`

Each instance has its own copy of \`health\`.

## EndClass

An optional \`EndClass\` keyword can close the class body. It is not required.

## Related Topics

- [self.](self) — required prefix for instance variable access inside methods
- [Constructors](constructors) — initialise instance state at creation time
- [Inheritance](inheritance) — extend one class from another
`,M4=`# Constructors

A constructor initialises a class instance when it is created. It runs once per instance, immediately after \`dim … as ClassName(…)\`.

## Syntax

\`\`\`bas
Constructor(param1, param2)
  self.param1 = param1
  self.param2 = param2
EndConstructor
\`\`\`

Constructor parameters are passed as arguments to \`dim … as ClassName(…)\`:

\`\`\`bas
dim player as Player(100, 200)   ' calls Constructor(100, 200)
\`\`\`

## Setting Instance Properties

Use \`self.\` to assign constructor arguments to instance variables:

\`\`\`bas
Class
dim health
dim name

Constructor(startHealth, playerName)
  self.health = startHealth
  self.name = playerName
EndConstructor
\`\`\`

## Creating Object Properties

A \`dim … as ClassName()\` statement inside a constructor body creates an instance property that holds another object:

\`\`\`bas
Constructor()
  dim self.transform as ObjectTransform()
EndConstructor
\`\`\`

This stores the ObjectTransform instance as \`this.transform\` on the class instance.

## Inheritance

If a class extends another, call \`super()\` first in the constructor:

\`\`\`bas
Constructor(x, y)
  super(x, y)
  self.type = "boss"
EndConstructor
\`\`\`

See [Inheritance](inheritance) for details.

## Related Topics

- [Classes](classes)
- [self.](self)
- [Inheritance](inheritance)
`,P4=`# Control Flow

## if / endif

\`\`\`bas
if score > 100 then
  print "High score!"
endif
\`\`\`

## if / else / endif

\`\`\`bas
if lives > 0 then
  respawn()
else
  gameOver()
endif
\`\`\`

## while / wend

\`\`\`bas
while lives > 0
  playRound()
wend
\`\`\`

## for / next

\`\`\`bas
dim i
for i = 1 to 10
  print i
next i
\`\`\`

Step value:

\`\`\`bas
for i = 10 to 1 step -1
  print i
next i
\`\`\`

## Related Topics

- [Operators](operators)
- [Functions](functions)
`,I4=`# Dictionaries

A dictionary stores values under named keys. Each key maps to one value, and you can look up, add, or replace values at any time using square bracket syntax.

## Declaring a dictionary

Use \`dim\` with empty square brackets:

\`\`\`bas
dim scores[]
dim inventory[]
\`\`\`

Dictionaries are always empty at creation — you cannot set values in the declaration line.

## Setting values

Assign to any key using square brackets. Keys can be strings or numbers:

\`\`\`bas
scores["Alice"] = 100
scores["Bob"] = 80
scores[1] = 999
\`\`\`

If the key already exists, its value is replaced.

## Reading values

Read a value using the same square bracket syntax:

\`\`\`bas
print scores["Alice"]   ' 100

dim x
x = scores["Bob"]
\`\`\`

If the key does not exist, the game stops with the error: \`Dictionary key not found: "Alice"\`. Use \`array.contains(d, key)\` to check before reading if the key might be missing.

## Checking and removing keys

The shared collection functions work with dictionaries as well as arrays:

\`\`\`bas
' Check if a key exists
if array.contains(scores, "Alice") = true
  print scores["Alice"]
endif

' Remove a key
array.remove(scores, "Bob")

' Count the number of keys
print array.length(scores)

' Empty the dictionary
array.clear(scores)
\`\`\`

## Getting all keys or values

Use \`dict.keys\` and \`dict.values\` to get arrays you can work with:

\`\`\`bas
dim inventory[]
inventory["sword"] = 1
inventory["potion"] = 5
inventory["shield"] = 1

dim k
k = dict.keys(inventory)
print array.length(k)   ' 3
print array.join(k, ", ")  ' sword, potion, shield

dim v
v = dict.values(inventory)
print array.join(v, ", ")  ' 1, 5, 1
\`\`\`

## String vs number keys

String key \`"5"\` and number key \`5\` are different keys — they do not collide:

\`\`\`bas
dim d[]
d["5"] = "five as string"
d[5]   = "five as number"

print d["5"]   ' five as string
print d[5]     ' five as number
\`\`\`

## Iterating over a dictionary

To loop over all keys, get them as an array first and use a \`for\` loop:

\`\`\`bas
dim scores[]
scores["Alice"] = 100
scores["Bob"] = 80

dim k
k = dict.keys(scores)

dim i
for i = 0 to array.length(k) - 1
  print k(i)
  print scores[k(i)]
next i
\`\`\`

## Typed dictionaries

A typed dictionary holds values of a specific class. Declare it with \`dim d[] as ClassName\` and assign each key with \`new\`:

\`\`\`bas
dim players[] as Sprite
players["Alice"] = new Sprite("hero.png")
players["Bob"] = new Sprite("hero2.png")

players["Alice"].setPosition(100, 200)
\`\`\`

Values not yet assigned give a runtime error if accessed. See [The new Keyword](new-keyword) for the full reference.
`,L4=`# Functions

Functions are declared with the \`function\` / \`endfunction\` keywords. They may take parameters and return a value.

## Syntax

\`\`\`bas
function add(a, b)
  return a + b
endfunction
\`\`\`

## Parameters

Parameters are comma-separated identifiers. No type annotations.

\`\`\`bas
function greet(name, times)
  dim i
  for i = 1 to times
    print "Hello, " + name
  next i
endfunction
\`\`\`

## Return Values

Use \`return\` followed by an expression. A function without a \`return\` statement returns \`undefined\`.

\`\`\`bas
function square(n)
  return n * n
endfunction
\`\`\`

## Calling Functions

\`\`\`bas
dim result
result = square(5)   ' 25
\`\`\`

## Functions Inside Classes

Functions inside a class body are instance methods. They must use \`self.\` to access instance variables.

\`\`\`bas
Class
dim x

function getX()
  return self.x
endfunction
\`\`\`

## Related Topics

- [Variable Scoping](variable-scoping)
- [self.](self)
- [Lifecycle Functions](lifecycle)
`,j4=`# Inheritance

A class can extend another class using the \`Extends\` keyword. The child class inherits all methods and properties from the parent.

## Syntax

\`\`\`bas
Class
Extends ParentClassName
\`\`\`

\`ParentClassName\` is the lowercase name of the parent class (the filename without \`.bas\`).

## Example

**Enemy.bas:**
\`\`\`bas
Class
dim health
dim x

Constructor(startHealth, startX)
  self.health = startHealth
  self.x = startX
EndConstructor

function takeDamage(amount)
  self.health = self.health - amount
endfunction
\`\`\`

**Boss.bas:**
\`\`\`bas
Class
Extends enemy

Constructor(startHealth, startX)
  super(startHealth, startX)
  self.phase = 1
EndConstructor

function onupdate(delta)
  ' boss-specific behaviour
endfunction
\`\`\`

## super()

Call \`super(…)\` in the child constructor to run the parent constructor. This should be done first, before assigning child-specific properties.

## super.method()

Call a parent method that has been overridden in the child:

\`\`\`bas
function takeDamage(amount)
  super.takeDamage(amount)
  ' additional boss-specific logic
endfunction
\`\`\`

## Constraints

- Single-level inheritance only — a class can extend one parent, but that parent cannot itself extend another class.
- The parent class file must be included in the project.

## Related Topics

- [Classes](classes)
- [Constructors](constructors)
`,$4=`# Lifecycle Functions

The softBASIC engine calls specific functions on every active module and class instance during each frame. These are the lifecycle hooks available to your code.

## onenter()

Called once when the scene starts. Use it to initialise state.

\`\`\`bas
function onenter()
  score = 0
  lives = 3
endfunction
\`\`\`

## onupdate(delta)

Called every frame. \`delta\` is the elapsed time in milliseconds since the last frame.

\`\`\`bas
function onupdate(delta)
  x = x + speed * delta
endfunction
\`\`\`

## onkeydown(key) — optional

Called when a key is pressed. \`key\` is the numeric key code (e.g. \`32\` for Space, \`39\` for right arrow). If this function is not defined, the engine skips it for that module/class.

\`\`\`bas
function onkeydown(key)
  if key = 32 then
    fireProjectile()
  endif
endfunction
\`\`\`

## onkeyup(key) — optional

Called when a key is released. Same \`key\` values as \`onkeydown\`. Optional.

\`\`\`bas
function onkeyup(key)
  if key = 37 then
    stopMoving()
  endif
endfunction
\`\`\`

## Class Instances

Lifecycle functions work the same way inside classes. Instance methods with these names will be called by the engine on every active instance.

\`\`\`bas
Class
dim x

function onupdate(delta)
  self.x = self.x + 100 * delta
endfunction
\`\`\`

## Related Topics

- [Modules](modules)
- [Classes](classes)
`,z4=`# Modules

Every \`.bas\` file is a **module** by default. A module is a static class — all variables and functions belong to the type itself, not to instances.

## Declaration

No declaration keyword is needed. A file with no \`Class\` keyword on line 1 is automatically a module.

\`\`\`bas
dim score
dim lives

function onenter()
  score = 0
  lives = 3
endfunction

function onupdate(delta)
  ' game logic here
endfunction
\`\`\`

## Variable Scope

Variables declared with \`dim\` at the top level of a module belong to the module itself. They persist for the lifetime of the scene.

## Lifecycle Functions

Modules participate in the engine lifecycle: \`onenter\`, \`onupdate\`, \`onkeydown\`, \`onkeyup\`. See [Lifecycle Functions](lifecycle) for details.

## Using Modules from Other Files

In a multi-file project, one module can call functions on another using the filename (lowercase, no extension) as the identifier.

\`\`\`bas
' In Main.bas — calls a function in scoreboard.bas
scoreboard.addPoints(10)
\`\`\`

See [Multi-file Projects](multi-file) for details.
`,B4=`# Multi-file Projects

A softBASIC project can contain multiple \`.bas\` files. Each file is either a module or a class, and they can reference each other.

## Calling Between Files

Use the filename (lowercase, no extension) as the identifier to call functions on another module or create instances of a class.

**main.bas calling scoreboard.bas:**
\`\`\`bas
scoreboard.addPoints(10)
scoreboard.reset()
\`\`\`

**Instantiating a class from another file:**
\`\`\`bas
' Enemy.bas defines the enemy class
dim e as enemy(100, 50)
\`\`\`

## Load Order

All files in a project are compiled together. There is no explicit import — every file is available to every other file by its filename identifier.

## Naming

The identifier for a file is always the filename lowercased with no extension:
- \`Player.bas\` → \`player\`
- \`EnemySpawner.bas\` → \`enemyspawner\`
- \`Main.bas\` → \`main\`

## Related Topics

- [Modules](modules)
- [Classes](classes)
- [Class Composition](class-composition)
`,F4=`# The \`new\` Keyword

The \`new\` keyword creates an object instance from a class. Use it to assign objects to typed variables and typed collection slots.

## Typed variables

Declare a typed variable with \`dim name as ClassName\`. The variable starts as null — you must assign it before using it:

\`\`\`bas
dim player as Sprite
player = new Sprite("hero.png")

player.setPosition(100, 200)
\`\`\`

You can also declare and construct in one line:

\`\`\`bas
dim player as Sprite = new Sprite("hero.png")

player.setPosition(100, 200)
\`\`\`

Or use type inference when the class is obvious from context:

\`\`\`bas
dim player = new Sprite("hero.png")

player.setPosition(100, 200)   ' type is inferred from new
\`\`\`

## Reassignment

A typed variable can be reassigned at any time with the same class:

\`\`\`bas
dim player as Sprite
player = new Sprite("hero.png")
' later...
player = new Sprite("hero2.png")   ' OK — same class
\`\`\`

Assigning the wrong class is a compile error:

\`\`\`bas
dim player as Sprite
player = new Enemy("goblin.png")   ' compile error — type mismatch
\`\`\`

## Typed arrays

Declare a typed array with \`dim arr(N) as ClassName\`. All slots start empty — assign each slot with \`new\`:

\`\`\`bas
dim enemies(10) as Enemy
enemies(0) = new Enemy("goblin.png")
enemies(1) = new Enemy("orc.png")

enemies(0).update()   ' OK — element type is Enemy
\`\`\`

Accessing a slot before assigning it stops the game with a null reference error. Assign all slots you plan to use before calling methods on them.

## Typed dictionaries

Declare a typed dictionary with \`dim d[] as ClassName\`. All keys start empty — assign each key with \`new\`:

\`\`\`bas
dim players[] as Sprite
players["Alice"] = new Sprite("hero.png")
players["Bob"] = new Sprite("hero2.png")

players["Alice"].setPosition(100, 200)
\`\`\`

## Typed parameters

### Scalar typed parameters

A single object parameter can be typed with \`as ClassName\`. Member access on it compiles:

\`\`\`bas
function spawn(e as Enemy)
  e.update()
endfunction

spawn(new Enemy("goblin.png"))
\`\`\`

Passing the wrong class is a compile error:

\`\`\`bas
dim s as Sprite = new Sprite("hero.png")
spawn(s)   ' compile error — Sprite is not Enemy
\`\`\`

### Typed array parameters

Declare an array parameter with \`arr() as ClassName\`. You can call methods on elements inside the function:

\`\`\`bas
function updateAll(enemies() as Enemy)
  enemies(0).update()
  enemies(1).update()
endfunction

dim wave(5) as Enemy
wave(0) = new Enemy("goblin.png")
wave(1) = new Enemy("orc.png")
updateAll(wave)
\`\`\`

### Typed dictionary parameters

Declare a dictionary parameter with \`d[] as ClassName\`. You can call methods on values inside the function:

\`\`\`bas
function repositionAll(players[] as Sprite, x, y)
  players["Alice"].setPosition(x, y)
  players["Bob"].setPosition(x + 50, y)
endfunction

dim team[] as Sprite
team["Alice"] = new Sprite("hero.png")
team["Bob"] = new Sprite("hero2.png")
repositionAll(team, 100, 200)
\`\`\`

## Null reference errors

Accessing a member on a typed variable or collection slot that has not yet been assigned gives a runtime error:

\`\`\`
Null reference: 'enemies(5)' has not been initialised. Assign a value with 'new' before accessing members.
\`\`\`

Always assign slots before calling methods on them.
`,U4=`# Operators

## Arithmetic

| Operator | Description | Example |
|----------|-------------|---------|
| \`+\` | Addition | \`x + 1\` |
| \`-\` | Subtraction | \`x - 1\` |
| \`*\` | Multiplication | \`x * 2\` |
| \`/\` | Division | \`x / 2\` |
| \`mod\` | Modulo | \`x mod 3\` |

## Comparison

| Operator | Description |
|----------|-------------|
| \`=\` | Equal |
| \`<>\` | Not equal |
| \`<\` | Less than |
| \`>\` | Greater than |
| \`<=\` | Less than or equal |
| \`>=\` | Greater than or equal |

## Boolean

| Operator | Description |
|----------|-------------|
| \`and\` | Logical AND |
| \`or\` | Logical OR |
| \`not\` | Logical NOT |

Example:

\`\`\`bas
if x > 0 and y > 0 then
  print "first quadrant"
endif
\`\`\`

## String Concatenation

Use \`+\` to concatenate strings:

\`\`\`bas
dim greeting
greeting = "Hello, " + name + "!"
\`\`\`

## Assignment

\`=\` is used for both assignment and equality comparison. Context determines which.

## Related Topics

- [Control Flow](control-flow)
- [Variable Scoping](variable-scoping)
`,H4=`# Packages

Packages are pre-built libraries included in your project to provide additional functionality.

## Adding a Package

Packages are added via the project settings in the softBASIC IDE. Once added, their modules are available by name.

## softGfx

The main first-party package. Provides graphics, animation, and asset management.

**Modules:**

| Module | Description |
|--------|-------------|
| \`gfx\` | Canvas setup and frame management |
| \`drawing\` | Primitive drawing (lines, rectangles, circles) |
| \`stage\` | Scene/entity management |
| \`pen\` | Drawing state (colour, line width) |
| \`assetmanager\` | Asset loading and management |
| \`ObjectTransform\` | Position, scale, rotation for sprites |
| \`sprite\` | Static image sprites |
| \`animatedsprite\` | Frame-animated sprites |
| \`text\` | Text rendering |
| \`tilemap\` | Tile-based map rendering |

## Sprite

Renders a static image. Position, scale and rotation are managed via \`self.transform\`.

\`\`\`bas
Class
Extends sprite

Constructor()
  super("bunny.png")
EndConstructor

function onenter()
  self.transform.setPosition(100, 200)
endfunction
\`\`\`

## AnimatedSprite

Like \`Sprite\` but plays through animation frames.

\`\`\`bas
Class
Extends animatedsprite

Constructor()
  super("walk.png", frameWidth, frameHeight, frameCount, fps)
EndConstructor

function onenter()
  self.transform.setPosition(50, 50)
  self.play()
endfunction
\`\`\`

## ObjectTransform

Holds position, scale, and rotation. Accessed via \`.transform\` on sprite/animatedsprite/tilemap instances.

\`\`\`bas
self.transform.setPosition(x, y)
self.transform.x()      ' get x position
self.transform.y()      ' get y position
\`\`\`

## TileMap

Renders a tile-based map.

\`\`\`bas
Class
Extends tilemap

Constructor()
  super("tileset.png", tileWidth, tileHeight)
EndConstructor
\`\`\`

## assetmanager

Loads and caches assets.

\`\`\`bas
assetmanager.load("player.png")
\`\`\`

## Related Topics

- [Classes](classes)
- [Constructors](constructors)
- [Class Composition](class-composition)
`,q4=`# self.

Inside class methods and constructors, instance variables **must** be accessed with the \`self.\` prefix. Bare access to a class variable without \`self.\` is a compile error.

## Usage

\`\`\`bas
Class
dim score

function addPoints(amount)
  self.score = self.score + amount   ' correct
  ' score = score + amount           ' compile error — bare access
endfunction
\`\`\`

\`self.\` compiles to \`this.\` in the generated JavaScript.

## In Constructors

\`\`\`bas
Constructor(startScore)
  self.score = startScore
EndConstructor
\`\`\`

## Why Required

Because softBASIC modules are also static classes and use bare variable names at the top level, requiring \`self.\` inside instance classes makes the distinction explicit and prevents accidental reference to module-level scope.

## Related Topics

- [Classes](classes)
- [Constructors](constructors)
`,G4=`# Variable Scoping

softBASIC has three variable scopes: module-level, class-level, and function-local.

## Module-Level Variables

Declared with \`dim\` at the top of a module (non-class file). Accessible anywhere in the module without a prefix.

\`\`\`bas
dim score

function addPoints(n)
  score = score + n
endfunction
\`\`\`

## Class-Level Variables (Instance Properties)

Declared with \`dim\` inside a class body (outside functions/constructors). Must be accessed with \`self.\` inside methods.

\`\`\`bas
Class
dim health

function heal(amount)
  self.health = self.health + amount
endfunction
\`\`\`

## Function-Local Variables

Declared with \`dim\` inside a function body. Scoped to that function call only.

\`\`\`bas
function calculate(x)
  dim result
  result = x * 2
  return result
endfunction
\`\`\`

## Object Variables in Constructors

A \`dim\` statement using \`as ClassName()\` inside a constructor body creates an instance property (stored as \`this.propertyName\`):

\`\`\`bas
Constructor()
  dim self.transform as ObjectTransform()
EndConstructor
\`\`\`

## Related Topics

- [self.](self)
- [Functions](functions)
`,V4=`# Tutorial 1: Hello World

Welcome to Basic4WebGL! In this tutorial you'll write your first program and get comfortable with the editor.

## What you'll build

A program that prints messages to the console and does some maths. Nothing on screen yet — just getting familiar with the tools.

## Step 1: Create a new project

On the Projects page, click **New Project** and give it a name like \`Hello World\`. This opens the editor with a single file, \`Main.bas\`.

## Step 2: Print a message

Type the following in \`Main.bas\`:

\`\`\`bas
print "Hello, world!"
\`\`\`

Click **Run**. The console panel at the bottom shows:

\`\`\`
Hello, world!
\`\`\`

\`print\` outputs any value — text, numbers, or expressions.

## Step 3: Print some numbers

Add a few more lines:

\`\`\`bas
print "Hello, world!"
print 42
print 3.14
\`\`\`

Run it again. Each \`print\` appears on its own line.

## Step 4: Do some maths

You can print the result of any calculation:

\`\`\`bas
print 10 + 5
print 100 - 25
print 6 * 7
print 20 / 4
\`\`\`

This prints \`15\`, \`75\`, \`42\`, \`5\`.

## Step 5: Store a value in a variable

Variables let you name a value and use it later:

\`\`\`bas
dim score
score = 0
score = score + 10
print score
\`\`\`

\`dim\` declares the variable. The next lines set and update its value. This prints \`10\`.

## Step 6: Combine text and numbers

Use \`string.str()\` to convert a number to text so you can join it with a string:

\`\`\`bas
dim lives
lives = 3
print "Lives remaining: " + string.str(lives)
\`\`\`

This prints \`Lives remaining: 3\`.

## Complete code

\`\`\`bas
print "Hello, world!"

dim score
score = 0
score = score + 10
print "Score: " + string.str(score)

dim lives
lives = 3
print "Lives remaining: " + string.str(lives)
\`\`\`

## What you've learned

- How to create a project and run code
- \`print\` outputs values to the console
- \`dim\` declares a variable
- \`string.str()\` converts a number to text for joining with strings

## Next up

[Tutorial 2: Drawing on Screen →](tutorial-02-drawing)
`,K4=`# Tutorial 2: Drawing on Screen

In this tutorial you'll draw shapes directly onto the canvas and learn how the coordinate system works.

## What you'll build

A simple space scene — a dark background with a planet and some stars — drawn entirely with shapes.

## Step 1: Set the background colour

Start a new project called \`Drawing\`. In \`Main.bas\`, add an \`onenter\` function. This runs once when your program starts:

\`\`\`bas
function onenter()
  stage.setBackground(10, 10, 30)
endfunction
\`\`\`

\`stage.setBackground(r, g, b)\` sets the canvas colour using red, green, and blue values from 0 to 255. \`10, 10, 30\` is a deep dark blue — like space.

Click **Run** and you should see a dark canvas.

## Step 2: Understand the coordinate system

The canvas is 640 pixels wide and 360 pixels tall. The top-left corner is \`(0, 0)\`. X increases to the right, Y increases downward.

\`\`\`
(0,0) ─────────────────────── (640,0)
  │                               │
  │                               │
  │           canvas              │
  │                               │
(0,360) ──────────────────── (640,360)
\`\`\`

## Step 3: Draw a planet

\`pen.setFillColor(r, g, b)\` sets the colour for filled shapes. \`drawing.drawCircle(x, y, radius)\` draws a filled circle — \`x\` and \`y\` are the centre point.

Add these lines inside \`onenter\`:

\`\`\`bas
function onenter()
  stage.setBackground(10, 10, 30)

  pen.setFillColor(80, 140, 200)
  drawing.drawCircle(480, 200, 80)
endfunction
\`\`\`

Run it. A blue planet appears near the right side of the screen.

## Step 4: Add an atmosphere ring

Draw a slightly larger, slightly transparent circle behind the planet to suggest an atmosphere. Put it before the planet so the planet draws on top:

\`\`\`bas
function onenter()
  stage.setBackground(10, 10, 30)

  pen.setFillColor(100, 160, 220)
  drawing.drawCircle(480, 200, 95)

  pen.setFillColor(80, 140, 200)
  drawing.drawCircle(480, 200, 80)
endfunction
\`\`\`

## Step 5: Draw some stars

\`drawing.drawRect(x, y, width, height)\` draws a filled rectangle — \`x\` and \`y\` are its centre point. Tiny white squares make convincing stars:

\`\`\`bas
pen.setFillColor(255, 255, 255)
drawing.drawRect(50, 60, 3, 3)
drawing.drawRect(120, 30, 2, 2)
drawing.drawRect(200, 140, 3, 3)
drawing.drawRect(300, 80, 2, 2)
drawing.drawRect(380, 50, 3, 3)
\`\`\`

Add these before the planet code (stars should appear behind it).

## Step 6: Draw a spaceship

Two rectangles and a triangle shape built from a narrower rectangle make a quick spaceship:

\`\`\`bas
pen.setFillColor(180, 180, 200)
drawing.drawRect(100, 180, 60, 20)
drawing.drawRect(100, 170, 20, 10)
\`\`\`

## Complete code

\`\`\`bas
function onenter()
  stage.setBackground(10, 10, 30)

  ' Stars
  pen.setFillColor(255, 255, 255)
  drawing.drawRect(50, 60, 3, 3)
  drawing.drawRect(120, 30, 2, 2)
  drawing.drawRect(200, 140, 3, 3)
  drawing.drawRect(300, 80, 2, 2)
  drawing.drawRect(380, 50, 3, 3)

  ' Planet atmosphere
  pen.setFillColor(100, 160, 220)
  drawing.drawCircle(480, 200, 95)

  ' Planet
  pen.setFillColor(80, 140, 200)
  drawing.drawCircle(480, 200, 80)

  ' Spaceship
  pen.setFillColor(180, 180, 200)
  drawing.drawRect(100, 180, 60, 20)
  drawing.drawRect(100, 170, 20, 10)
endfunction
\`\`\`

## What you've learned

- \`onenter()\` runs once when the program starts
- \`stage.setBackground(r, g, b)\` sets the canvas background
- \`pen.setFillColor(r, g, b)\` sets the colour for the next shape
- \`drawing.drawRect(x, y, w, h)\` and \`drawing.drawCircle(x, y, r)\` draw shapes — \`x, y\` is the centre
- Shapes drawn later appear on top of shapes drawn earlier
- Comments start with \`'\`

## Next up

[Tutorial 3: Your First Sprite →](tutorial-03-sprite)
`,Y4=`# Tutorial 3: Your First Sprite

In this tutorial you'll load an image onto the canvas as a sprite and position it precisely on screen.

## What you'll build

A spaceship image placed in the centre of the canvas, ready to be moved in the next tutorial.

## What you'll need

A small image for your spaceship — anything works, even a 32×32 pixel PNG you draw yourself. Name it \`ship.png\`.

## Step 1: Upload your image

In the editor, click the **Assets** tab in the file panel and upload your image. Give it the name \`ship.png\`.

## Step 2: Understand how sprites work

Unlike shapes from the drawing module, sprites are game objects. Every sprite in softBASIC needs its own **class file**. Don't worry about what that means yet — we'll explain classes properly in Tutorial 10. For now, just follow the pattern.

## Step 3: Create the Player class file

Click **+** in the file panel and create a new file called \`Player\`. Type this exactly:

\`\`\`bas
Class
Extends sprite

Constructor()
  super("ship.png")
  self.transform.setPosition(320, 180)
  stage.add(self)
EndConstructor
\`\`\`

This file describes your player ship. Line by line:
- \`Class\` — this file defines a class (a type of game object)
- \`Extends sprite\` — this class is a sprite (an image on screen)
- \`Constructor()\` — this code runs when a Player is created
- \`super("ship.png")\` — loads the image
- \`self.transform.setPosition(320, 180)\` — places it at the centre of the 640×360 canvas
- \`stage.add(self)\` — makes it visible

## Step 4: Create the Player in Main

Open \`Main.bas\` and add an \`onenter\` function that creates a Player:

\`\`\`bas
function onenter()
  stage.setBackground(10, 10, 30)
  dim player = new Player()
endfunction
\`\`\`

\`dim player = new Player()\` creates a Player object. Its constructor runs immediately, loading the image and adding it to the stage.

## Step 5: Run it

Click **Run**. Your ship image should appear in the centre of a dark canvas.

If you see a white square instead of your image, check that the filename in \`super(...)\` exactly matches the name you gave the asset.

## Step 6: Change the position

Try different positions by changing the numbers in \`setPosition(x, y)\`:

\`\`\`bas
self.transform.setPosition(100, 100)   ' near top-left
self.transform.setPosition(320, 180)   ' centre
self.transform.setPosition(540, 300)   ' near bottom-right
\`\`\`

## Complete code

**Player.bas**

\`\`\`bas
Class
Extends sprite

Constructor()
  super("ship.png")
  self.transform.setPosition(320, 180)
  stage.add(self)
EndConstructor
\`\`\`

**Main.bas**

\`\`\`bas
function onenter()
  stage.setBackground(10, 10, 30)
  dim player = new Player()
endfunction
\`\`\`

## What you've learned

- Sprites need a class file that \`Extends sprite\`
- \`Constructor()\` runs when the object is created
- \`super("image.png")\` loads the image
- \`self.transform.setPosition(x, y)\` places the sprite on screen
- \`stage.add(self)\` makes it visible
- \`dim name = new ClassName()\` creates an object in Main

## Next up

[Tutorial 4: Making Things Move →](tutorial-04-motion)
`,X4=`# Tutorial 4: Making Things Move

In this tutorial you'll make your sprite move automatically every frame. This is the foundation of every game — the engine calls your code 60 times per second, and each time you move things a little.

## What you'll build

A spaceship that drifts across the screen on its own.

## Step 1: Open your Tutorial 3 project

Continue from the project you built in Tutorial 3, with \`Player.bas\` and \`Main.bas\`.

## Step 2: Understand onupdate

The engine calls \`onupdate\` on every class instance, every frame. Add it to \`Player.bas\`:

\`\`\`bas
function onupdate(delta)

endfunction
\`\`\`

\`delta\` is the time in milliseconds since the last frame — usually around 16ms at 60 frames per second. You'll use it in a moment.

## Step 3: Read the current position

To move the ship, you first need to know where it is. \`self.transform.x()\` and \`self.transform.y()\` return the current position:

\`\`\`bas
function onupdate(delta)
  dim x
  x = self.transform.x()
  print x
endfunction
\`\`\`

Run it. Numbers stream into the console — the ship's x position, printed 60 times a second. Delete the \`print\` line once you've seen it working.

## Step 4: Move by a fixed amount

Update the position each frame by adding a small number:

\`\`\`bas
function onupdate(delta)
  dim x
  x = self.transform.x() + 3
  self.transform.setPosition(x, self.transform.y())
endfunction
\`\`\`

Run it. The ship drifts to the right and eventually disappears off screen.

## Step 5: Use delta time for smooth movement

Adding 3 pixels per frame works, but it ties the game speed to the frame rate — on a faster computer the ship would move faster. The fix is to think in **pixels per second** instead:

\`\`\`bas
function onupdate(delta)
  dim x
  x = self.transform.x() + self.speed * delta / 1000
  self.transform.setPosition(x, self.transform.y())
endfunction
\`\`\`

\`self.speed * delta / 1000\` converts milliseconds to seconds, so \`speed = 200\` means 200 pixels per second regardless of frame rate.

## Step 6: Store speed as a class variable

\`self.speed\` needs to be declared at the class level (outside any function) and set in the constructor. Update \`Player.bas\`:

\`\`\`bas
Class
Extends sprite

dim speed

Constructor()
  super("ship.png")
  self.speed = 200
  self.transform.setPosition(320, 180)
  stage.add(self)
EndConstructor

function onupdate(delta)
  dim x
  x = self.transform.x() + self.speed * delta / 1000
  self.transform.setPosition(x, self.transform.y())
endfunction
\`\`\`

Variables declared with \`dim\` outside any function — like \`dim speed\` here — belong to the object and are accessed with \`self.\`. Variables declared inside a function are local to that function call.

## Complete code

**Player.bas**

\`\`\`bas
Class
Extends sprite

dim speed

Constructor()
  super("ship.png")
  self.speed = 200
  self.transform.setPosition(320, 180)
  stage.add(self)
EndConstructor

function onupdate(delta)
  dim x
  x = self.transform.x() + self.speed * delta / 1000
  self.transform.setPosition(x, self.transform.y())
endfunction
\`\`\`

**Main.bas**

\`\`\`bas
function onenter()
  stage.setBackground(10, 10, 30)
  dim player = new Player()
endfunction
\`\`\`

## What you've learned

- \`onupdate(delta)\` is called every frame
- \`self.transform.x()\` and \`self.transform.y()\` read the current position
- \`self.transform.setPosition(x, y)\` updates it
- \`delta\` is the time in milliseconds since the last frame
- Using \`speed * delta / 1000\` ties movement to real time, not frame rate
- \`dim\` outside functions creates instance variables; \`dim\` inside creates local variables

## Next up

[Tutorial 5: Keyboard Control →](tutorial-05-keyboard)
`,W4=`# Tutorial 5: Keyboard Control

In this tutorial you'll read keyboard input and use it to move your ship. The player will be in control.

## What you'll build

A spaceship that moves left, right, up, and down in response to the arrow keys.

## Step 1: Open your Tutorial 4 project

Continue with \`Player.bas\` and \`Main.bas\` from Tutorial 4.

## Step 2: Check a key with input.getKeyDown

\`input.getKeyDown(keycode)\` returns \`true\` while a key is held down. Keys are identified by a numeric key code — the arrow keys are 37 (left), 38 (up), 39 (right), 40 (down).

Replace the auto-movement in \`onupdate\` with a keyboard check:

\`\`\`bas
function onupdate(delta)
  if input.getKeyDown(39) then
    dim x
    x = self.transform.x() + self.speed * delta / 1000
    self.transform.setPosition(x, self.transform.y())
  endif
endfunction
\`\`\`

Run it. The ship only moves right when you hold the right arrow key.

## Step 3: Add left movement

Add a second check for the left arrow (key code 37):

\`\`\`bas
function onupdate(delta)
  dim x
  x = self.transform.x()

  if input.getKeyDown(39) then
    x = x + self.speed * delta / 1000
  endif

  if input.getKeyDown(37) then
    x = x - self.speed * delta / 1000
  endif

  self.transform.setPosition(x, self.transform.y())
endfunction
\`\`\`

Notice \`dim x\` is now declared once before the checks, not inside each \`if\`. This is cleaner — you calculate the final position first, then move the ship once at the end.

## Step 4: Add up and down movement

Add Y movement using key codes 38 (up) and 40 (down):

\`\`\`bas
function onupdate(delta)
  dim x
  dim y
  dim move
  x = self.transform.x()
  y = self.transform.y()
  move = self.speed * delta / 1000

  if input.getKeyDown(39) then
    x = x + move
  endif
  if input.getKeyDown(37) then
    x = x - move
  endif
  if input.getKeyDown(40) then
    y = y + move
  endif
  if input.getKeyDown(38) then
    y = y - move
  endif

  self.transform.setPosition(x, y)
endfunction
\`\`\`

\`move\` is calculated once and reused — no need to repeat the same formula four times.

## Step 5: Try different speeds

Change \`self.speed\` in the constructor to see the difference:

\`\`\`bas
self.speed = 100   ' slow
self.speed = 400   ' fast
self.speed = 250   ' a good starting point
\`\`\`

## Complete code

**Player.bas**

\`\`\`bas
Class
Extends sprite

dim speed

Constructor()
  super("ship.png")
  self.speed = 250
  self.transform.setPosition(320, 180)
  stage.add(self)
EndConstructor

function onupdate(delta)
  dim x
  dim y
  dim move
  x = self.transform.x()
  y = self.transform.y()
  move = self.speed * delta / 1000

  if input.getKeyDown(39) then
    x = x + move
  endif
  if input.getKeyDown(37) then
    x = x - move
  endif
  if input.getKeyDown(40) then
    y = y + move
  endif
  if input.getKeyDown(38) then
    y = y - move
  endif

  self.transform.setPosition(x, y)
endfunction
\`\`\`

**Main.bas**

\`\`\`bas
function onenter()
  stage.setBackground(10, 10, 30)
  dim player = new Player()
endfunction
\`\`\`

## Key code reference

| Key | Code |
|-----|------|
| Left arrow | 37 |
| Up arrow | 38 |
| Right arrow | 39 |
| Down arrow | 40 |
| Space | 32 |
| Enter | 13 |
| Escape | 27 |

For a full list, see the [input](../api-reference/input) API reference.

## What you've learned

- \`input.getKeyDown(keycode)\` returns \`true\` while the key is held
- Keys are identified by numeric key codes, not names
- Multiple \`if\` checks can each adjust the same variable before acting on it
- Storing a computed value in a local variable avoids repeating the formula

## Next up

[Tutorial 6: Staying on Screen →](tutorial-06-bounds)
`,Z4=`# Tutorial 6: Staying on Screen

In this tutorial you'll stop the ship from flying off the edges. You'll use \`if\` to clamp the position within the canvas.

## What you'll build

A player ship that moves freely but bounces off — or stops at — the edges of the screen.

## Step 1: Open your Tutorial 5 project

Continue with \`Player.bas\` and \`Main.bas\` from Tutorial 5.

## Step 2: Know the canvas size

The canvas is always 640 pixels wide and 360 pixels tall. \`stage.width()\` and \`stage.height()\` return these values so you don't have to hardcode them.

\`\`\`bas
print stage.width()   ' prints 640
print stage.height()  ' prints 360
\`\`\`

## Step 3: Clamp the x position

After calculating the new position, check whether it has gone past an edge and correct it:

\`\`\`bas
if x < 0 then
  x = 0
endif
if x > stage.width() then
  x = stage.width()
endif
\`\`\`

Add these checks to \`onupdate\` after the keyboard input but before \`setPosition\`. Run it — the ship now stops at the left and right edges.

## Step 4: Account for the ship's size

The ship's position is its centre point. If you stop at \`x = 0\`, half the ship disappears off the left edge. A better boundary is half the ship's width:

\`\`\`bas
dim halfW
dim halfH
halfW = self.width() / 2
halfH = self.height() / 2

if x < halfW then
  x = halfW
endif
if x > stage.width() - halfW then
  x = stage.width() - halfW
endif
if y < halfH then
  y = halfH
endif
if y > stage.height() - halfH then
  y = stage.height() - halfH
endif
\`\`\`

\`self.width()\` and \`self.height()\` return the pixel dimensions of the sprite image.

## Step 5: Put it all together

The full \`onupdate\` function:

\`\`\`bas
function onupdate(delta)
  dim x
  dim y
  dim move
  dim halfW
  dim halfH
  x = self.transform.x()
  y = self.transform.y()
  move = self.speed * delta / 1000

  if input.getKeyDown(39) then
    x = x + move
  endif
  if input.getKeyDown(37) then
    x = x - move
  endif
  if input.getKeyDown(40) then
    y = y + move
  endif
  if input.getKeyDown(38) then
    y = y - move
  endif

  halfW = self.width() / 2
  halfH = self.height() / 2

  if x < halfW then
    x = halfW
  endif
  if x > stage.width() - halfW then
    x = stage.width() - halfW
  endif
  if y < halfH then
    y = halfH
  endif
  if y > stage.height() - halfH then
    y = stage.height() - halfH
  endif

  self.transform.setPosition(x, y)
endfunction
\`\`\`

## Complete code

**Player.bas**

\`\`\`bas
Class
Extends sprite

dim speed

Constructor()
  super("ship.png")
  self.speed = 250
  self.transform.setPosition(320, 180)
  stage.add(self)
EndConstructor

function onupdate(delta)
  dim x
  dim y
  dim move
  dim halfW
  dim halfH
  x = self.transform.x()
  y = self.transform.y()
  move = self.speed * delta / 1000

  if input.getKeyDown(39) then
    x = x + move
  endif
  if input.getKeyDown(37) then
    x = x - move
  endif
  if input.getKeyDown(40) then
    y = y + move
  endif
  if input.getKeyDown(38) then
    y = y - move
  endif

  halfW = self.width() / 2
  halfH = self.height() / 2

  if x < halfW then
    x = halfW
  endif
  if x > stage.width() - halfW then
    x = stage.width() - halfW
  endif
  if y < halfH then
    y = halfH
  endif
  if y > stage.height() - halfH then
    y = stage.height() - halfH
  endif

  self.transform.setPosition(x, y)
endfunction
\`\`\`

**Main.bas** (unchanged)

\`\`\`bas
function onenter()
  stage.setBackground(10, 10, 30)
  dim player = new Player()
endfunction
\`\`\`

## What you've learned

- \`stage.width()\` and \`stage.height()\` return the canvas dimensions (640 × 360)
- \`self.width()\` and \`self.height()\` return the sprite's image dimensions
- Clamping a position means checking both the minimum and maximum and correcting if out of range
- Accounting for half the sprite size keeps the whole image on screen

## Next up

[Tutorial 7: Score and Text →](tutorial-07-score)
`,Q4=`# Tutorial 7: Score and Text

In this tutorial you'll display a live score counter on screen. You'll create a text object using the \`text\` class and update it every second using the delta timer pattern.

## What you'll build

A score that counts up once per second, displayed in the top-left corner of the canvas.

## Step 1: Open your Tutorial 6 project

Continue with \`Player.bas\` and \`Main.bas\` from Tutorial 6.

## Step 2: Understand the text class

The \`text\` class works like \`sprite\` — you create a class file that \`Extends text\`. The constructor takes the starting text and the position:

\`\`\`bas
super("Hello!", x, y)
\`\`\`

To update what it shows, call \`self.setText("new text")\`.

## Step 3: Create the ScoreDisplay class

Create a new file called \`ScoreDisplay\`. Type this:

\`\`\`bas
Class
Extends text

Constructor()
  super("Score: 0", 10, 10)
  self.setStyle(24, 255, 255, 100)
  stage.add(self)
EndConstructor

function setScore(s)
  self.setText("Score: " + string.str(s))
endfunction
\`\`\`

- \`super("Score: 0", 10, 10)\` creates the text object at position (10, 10)
- \`setStyle(24, 255, 255, 100)\` sets font size 24, with a warm yellow colour
- \`setScore(s)\` is a method Main.bas will call to update the display

## Step 4: Add the score to Main.bas

Open \`Main.bas\`. You need three things: a score counter, a timer accumulator, and the ScoreDisplay object.

\`\`\`bas
dim score
dim timer
dim scoreDisplay as ScoreDisplay

function onenter()
  stage.setBackground(10, 10, 30)
  score = 0
  timer = 0
  scoreDisplay = new ScoreDisplay()
  dim player = new Player()
endfunction
\`\`\`

## Step 5: Count up every second

Add an \`onupdate\` to \`Main.bas\` that accumulates the delta time and increments the score every 1000 milliseconds:

\`\`\`bas
function onupdate(delta)
  timer = timer + delta
  if timer >= 1000 then
    score = score + 1
    timer = timer - 1000
    scoreDisplay.setScore(score)
  endif
endfunction
\`\`\`

\`timer - 1000\` (rather than \`timer = 0\`) keeps any leftover milliseconds so the counter stays accurate over time.

## Step 6: Run it

Click **Run**. The score in the top-left should tick up by one every second while you fly the ship around.

## Complete code

**ScoreDisplay.bas**

\`\`\`bas
Class
Extends text

Constructor()
  super("Score: 0", 10, 10)
  self.setStyle(24, 255, 255, 100)
  stage.add(self)
EndConstructor

function setScore(s)
  self.setText("Score: " + string.str(s))
endfunction
\`\`\`

**Main.bas**

\`\`\`bas
dim score
dim timer
dim scoreDisplay as ScoreDisplay

function onenter()
  stage.setBackground(10, 10, 30)
  score = 0
  timer = 0
  scoreDisplay = new ScoreDisplay()
  dim player = new Player()
endfunction

function onupdate(delta)
  timer = timer + delta
  if timer >= 1000 then
    score = score + 1
    timer = timer - 1000
    scoreDisplay.setScore(score)
  endif
endfunction
\`\`\`

**Player.bas** (unchanged from Tutorial 6)

## What you've learned

- A \`text\` class file works like a sprite — \`Extends text\` and a \`Constructor()\`
- \`super("text", x, y)\` sets the initial content and position
- \`self.setText(str)\` updates what is displayed
- \`string.str(number)\` converts a number to a string so you can join it with other text
- A delta timer accumulator is the standard way to trigger something once per second

## Next up

[Tutorial 8: Functions →](tutorial-08-functions)
`,J4=`# Tutorial 8: Functions

In this tutorial you'll extract repeated code into your own functions. Functions let you name a pattern, reuse it in multiple places, and make your code easier to read.

## What you'll build

A cleaner version of the Player movement from Tutorial 6, with the boundary clamping extracted into a reusable \`clamp\` function.

## Step 1: Open your Tutorial 7 project

Continue with \`Player.bas\` and \`Main.bas\` from Tutorial 7.

## Step 2: Spot the repetition

Look at the bounds-checking code in \`Player.bas\`:

\`\`\`bas
if x < halfW then
  x = halfW
endif
if x > stage.width() - halfW then
  x = stage.width() - halfW
endif
if y < halfH then
  y = halfH
endif
if y > stage.height() - halfH then
  y = stage.height() - halfH
endif
\`\`\`

The same pattern appears twice — once for x, once for y. Any time you copy and paste logic, that's a good sign it belongs in a function.

## Step 3: Write a clamp function

A **clamp** keeps a value between a minimum and a maximum. Add this function to \`Player.bas\`, outside of \`onupdate\`:

\`\`\`bas
function clamp(value, minVal, maxVal)
  if value < minVal then
    value = minVal
  endif
  if value > maxVal then
    value = maxVal
  endif
  return value
endfunction
\`\`\`

\`return value\` sends the result back to whoever called the function.

## Step 4: Use the function

Replace all four bounds checks in \`onupdate\` with two \`clamp\` calls:

\`\`\`bas
x = self.clamp(x, halfW, stage.width() - halfW)
y = self.clamp(y, halfH, stage.height() - halfH)
\`\`\`

The same logic, but now each check is a single readable line. If you ever need to change how clamping works, you change it in one place.

> **Did you know?** The \`math\` module already provides \`math.clamp(value, min, max)\` that does exactly this. Writing your own version here is the teaching point — in real projects you'd use \`math.clamp\` directly and skip this function.

## Step 5: Run it

Click **Run**. The ship should behave exactly as before — still stops at the edges — but the code is shorter and cleaner.

## How functions work

A function has three parts:

\`\`\`bas
function name(param1, param2)
  ' body
  return result
endfunction
\`\`\`

- **Parameters** — values passed in when you call the function (\`value\`, \`minVal\`, \`maxVal\`)
- **Body** — code that runs each time the function is called
- **Return** — the result sent back to the caller (leave it out for functions that don't produce a value)

When you write \`x = clamp(x, halfW, limit)\`, softBASIC calls the function, runs its body with those arguments, and replaces the call with whatever was returned.

## Complete code

**Player.bas**

\`\`\`bas
Class
Extends sprite

dim speed

Constructor()
  super("ship.png")
  self.speed = 250
  self.transform.setPosition(320, 180)
  stage.add(self)
EndConstructor

function clamp(value, minVal, maxVal)
  if value < minVal then
    value = minVal
  endif
  if value > maxVal then
    value = maxVal
  endif
  return value
endfunction

function onupdate(delta)
  dim x
  dim y
  dim move
  dim halfW
  dim halfH
  x = self.transform.x()
  y = self.transform.y()
  move = self.speed * delta / 1000
  halfW = self.width() / 2
  halfH = self.height() / 2

  if input.getKeyDown(39) then
    x = x + move
  endif
  if input.getKeyDown(37) then
    x = x - move
  endif
  if input.getKeyDown(40) then
    y = y + move
  endif
  if input.getKeyDown(38) then
    y = y - move
  endif

  x = self.clamp(x, halfW, stage.width() - halfW)
  y = self.clamp(y, halfH, stage.height() - halfH)

  self.transform.setPosition(x, y)
endfunction
\`\`\`

**Main.bas** (unchanged from Tutorial 7)

## What you've learned

- Functions let you name and reuse a pattern
- Parameters are the inputs; \`return\` sends the result back
- Calling a function: \`result = functionName(arg1, arg2)\`
- If repeated code has the same shape, it probably belongs in a function

## Next up

[Tutorial 9: Multiple Enemies →](tutorial-09-enemies)
`,e9=`# Tutorial 9: Multiple Enemies

In this tutorial you'll add falling enemy ships to the game. You'll use an array to track all of them and spawn them at random positions along the top of the screen.

## What you'll build

A wave of enemy ships that drift down from the top and loop back when they reach the bottom.

## What you'll need

An image for the enemy ship — call it \`enemy.png\`. Any small image will do; you can even reuse \`ship.png\` for now.

## Step 1: Open your Tutorial 8 project

Continue with \`Player.bas\`, \`ScoreDisplay.bas\`, and \`Main.bas\` from Tutorial 8.

## Step 2: Create the Enemy class

Create a new file called \`Enemy\`. Each enemy moves downward every frame and loops back to the top when it falls off the bottom:

\`\`\`bas
Class
Extends sprite

dim speed

Constructor(startX)
  super("enemy.png")
  self.speed = 120
  self.transform.setPosition(startX, 0)
  stage.add(self)
EndConstructor

function onupdate(delta)
  dim y
  y = self.transform.y() + self.speed * delta / 1000
  if y > stage.height() then
    y = 0
  endif
  self.transform.setPosition(self.transform.x(), y)
endfunction
\`\`\`

\`Constructor(startX)\` takes a starting x position so each enemy can be placed at a different spot.

## Step 3: Spawn several enemies in Main.bas

Open \`Main.bas\`. Create an array and fill it with Enemy objects spread across the screen:

\`\`\`bas
dim score
dim timer
dim scoreDisplay as ScoreDisplay
dim enemies(0)

function onenter()
  stage.setBackground(10, 10, 30)
  score = 0
  timer = 0
  scoreDisplay = new ScoreDisplay()
  dim player = new Player()

  dim e1 = new Enemy(80)
  dim e2 = new Enemy(220)
  dim e3 = new Enemy(360)
  dim e4 = new Enemy(500)
  dim e5 = new Enemy(620)
  array.push(enemies, e1)
  array.push(enemies, e2)
  array.push(enemies, e3)
  array.push(enemies, e4)
  array.push(enemies, e5)
endfunction
\`\`\`

Each enemy starts at a fixed x position spread evenly across the 640-pixel canvas.

## Step 4: Stagger the starting heights

Right now all five enemies start at y = 0 and move in lock-step, which looks like a single enemy. Give them different starting y positions (negative values place them off-screen above the canvas):

\`\`\`bas
  dim e1 = new Enemy(80,  0)
  dim e2 = new Enemy(220, -72)
  dim e3 = new Enemy(360, -144)
  dim e4 = new Enemy(500, -216)
  dim e5 = new Enemy(620, -288)
\`\`\`

Update \`Enemy.bas\` to accept a second parameter:

\`\`\`bas
Constructor(startX, startY)
  super("enemy.png")
  self.speed = 120
  self.transform.setPosition(startX, startY)
  stage.add(self)
EndConstructor
\`\`\`

Now they arrive spaced out rather than all at once.

## Step 5: Run it

Click **Run**. Five enemy ships should drift down the screen, each looping back to the top when they disappear off the bottom. Your player ship still moves with the arrow keys.

## Complete code

**Enemy.bas**

\`\`\`bas
Class
Extends sprite

dim speed

Constructor(startX, startY)
  super("enemy.png")
  self.speed = 120
  self.transform.setPosition(startX, startY)
  stage.add(self)
EndConstructor

function onupdate(delta)
  dim y
  y = self.transform.y() + self.speed * delta / 1000
  if y > stage.height() then
    y = 0
  endif
  self.transform.setPosition(self.transform.x(), y)
endfunction
\`\`\`

**Main.bas**

\`\`\`bas
dim score
dim timer
dim scoreDisplay as ScoreDisplay
dim enemies(0)

function onenter()
  stage.setBackground(10, 10, 30)
  score = 0
  timer = 0
  scoreDisplay = new ScoreDisplay()
  dim player = new Player()

  dim e1 = new Enemy(80,  0)
  dim e2 = new Enemy(220, -72)
  dim e3 = new Enemy(360, -144)
  dim e4 = new Enemy(500, -216)
  dim e5 = new Enemy(620, -288)
  array.push(enemies, e1)
  array.push(enemies, e2)
  array.push(enemies, e3)
  array.push(enemies, e4)
  array.push(enemies, e5)
endfunction

function onupdate(delta)
  timer = timer + delta
  if timer >= 1000 then
    score = score + 1
    timer = timer - 1000
    scoreDisplay.setScore(score)
  endif
endfunction
\`\`\`

## What you've learned

- Classes can take constructor parameters to customise each instance
- \`dim enemies(0)\` creates an empty array; \`array.push(arr, item)\` adds to it
- Each object's \`onupdate\` runs automatically — the engine calls it on every active instance
- Staggering start positions with negative y values spaces enemies out naturally

## Next up

[Tutorial 10: How Classes Work →](tutorial-10-classes)
`,t9="# Tutorial 10: How Classes Work\n\nYou've been writing class files since Tutorial 3. This tutorial explains what they actually are and why they work the way they do. No new game features — just understanding what you've already built.\n\n## What is a class?\n\nA **class** is a blueprint for creating objects. When you write:\n\n```bas\ndim player = new Player()\n```\n\nsoftBASIC uses the `Player.bas` class file as a blueprint to build a new Player object. You can create as many objects from the same blueprint as you like — each is independent.\n\nIn Tutorial 9 you created five Enemy objects from one `Enemy.bas` file. They each have their own position and move independently, but they all follow the same rules.\n\n## The parts of a class file\n\n```bas\nClass           ' marks this file as a class\nExtends sprite  ' this class inherits everything a sprite can do\n\ndim speed       ' instance variable — each object gets its own copy\n\nConstructor(startX, startY)   ' runs when a new object is created\n  super(\"enemy.png\")          ' call the parent class constructor\n  self.speed = 120\n  self.transform.setPosition(startX, startY)\n  stage.add(self)\nEndConstructor\n\nfunction onupdate(delta)       ' a method — a function that belongs to the object\n  dim y                        ' local variable — exists only during this call\n  y = self.transform.y() + self.speed * delta / 1000\n  self.transform.setPosition(self.transform.x(), y)\nendfunction\n```\n\n### `Class` and `Extends`\n\nEvery class file begins with `Class`. The `Extends` line says which parent class this inherits from — in this case `sprite`. Inheritance means the Enemy automatically has everything a sprite can do: `transform`, `width()`, `height()`, and so on.\n\n### Instance variables (`dim` outside functions)\n\n`dim speed` at the top level of the class creates an **instance variable**. Every Enemy object gets its own `speed` value. Change one enemy's speed and the others are not affected.\n\nYou access instance variables using `self.` — `self.speed`, `self.transform.x()`, etc. `self` always refers to the specific object whose method is running.\n\n### The Constructor\n\nThe constructor runs once when the object is created — when you write `new Enemy(...)`. It sets up the object: loading the image, setting the starting position, adding to the stage. Arguments to `new Enemy(80, 0)` are passed to the constructor's parameters.\n\n### Methods\n\nA method is a function defined inside a class. `onupdate` is a method. So is `setScore` in ScoreDisplay. You call a method on a specific object:\n\n```bas\nscoreDisplay.setScore(5)\n```\n\nThis calls `setScore` on the `scoreDisplay` object. Inside that function, `self` refers to `scoreDisplay`.\n\n### Local variables (`dim` inside functions)\n\n`dim y` inside `onupdate` is a **local variable**. It is created fresh each time `onupdate` runs and disappears when the function returns. Local variables cannot be accessed with `self.`.\n\n## Instance vs local — a summary\n\n| Where declared | Access | Lifetime |\n|---|---|---|\n| Top of class (outside functions) | `self.name` | Lives as long as the object |\n| Inside a function | `name` (no self.) | Lives only during that function call |\n\n## What `self` means\n\n`self` is how an object refers to itself. When `enemy1.onupdate(delta)` runs, `self` is `enemy1`. When `enemy2.onupdate(delta)` runs, `self` is `enemy2`. Same code, different object.\n\n## Why this matters\n\nUnderstanding classes means you can now:\n- Design new types of game objects with their own behaviour\n- Give each object private state (instance variables) that nobody else can accidentally change\n- Add new methods to your classes at any time\n\nIn the next tutorial you'll put all of this together into a complete game.\n\n## Next up\n\n[Tutorial 11: Dodge! →](tutorial-11-dodge)\n",n9=`# Tutorial 11: Dodge!

This is the final tutorial. You'll combine everything from the series into a complete game: a player ship that dodges falling enemies, a score that counts up while you survive, and a game-over screen when you get hit.

## What you'll build

**Dodge!** — avoid the enemies as long as you can. Your score is how many seconds you survived.

## Step 1: Start from Tutorial 9

Open your Tutorial 9 project. You should have:
- \`Player.bas\` — moves with arrow keys, stays within bounds
- \`Enemy.bas\` — falls from the top, loops back
- \`ScoreDisplay.bas\` — shows the score
- \`Main.bas\` — wires it all together

Make sure all four files are present before continuing.

## Step 2: Add a game-over display

Create a new file called \`GameOverDisplay\`. It shows a message when the player is hit and stays hidden until then:

\`\`\`bas
Class
Extends text

Constructor()
  super("GAME OVER", stage.width() / 2 - 100, stage.height() / 2 - 20)
  self.setStyle(40, 255, 80, 80)
  self.setAlpha(0)
  stage.add(self)
EndConstructor

function show()
  self.setAlpha(1)
endfunction
\`\`\`

\`setAlpha(0)\` makes it invisible at the start. \`show()\` reveals it.

## Step 3: Add a running flag to Main.bas

Open \`Main.bas\`. Add a \`running\` variable and the \`GameOverDisplay\` object. When \`running\` is 0, the game is over and \`onupdate\` stops doing anything:

\`\`\`bas
dim score
dim timer
dim scoreDisplay as ScoreDisplay
dim gameOverDisplay as GameOverDisplay
dim enemies(0)
dim running

function onenter()
  stage.setBackground(10, 10, 30)
  running = 1
  score = 0
  timer = 0
  scoreDisplay = new ScoreDisplay()
  gameOverDisplay = new GameOverDisplay()
  dim player = new Player()

  dim e1 = new Enemy(80,  0)
  dim e2 = new Enemy(220, -72)
  dim e3 = new Enemy(360, -144)
  dim e4 = new Enemy(500, -216)
  dim e5 = new Enemy(620, -288)
  array.push(enemies, e1)
  array.push(enemies, e2)
  array.push(enemies, e3)
  array.push(enemies, e4)
  array.push(enemies, e5)
endfunction

function onupdate(delta)
  if running = 0 then
    return
  endif

  timer = timer + delta
  if timer >= 1000 then
    score = score + 1
    timer = timer - 1000
    scoreDisplay.setScore(score)
  endif
endfunction
\`\`\`

## Step 4: Pass the player and enemies list into Player.bas

The collision check needs to happen somewhere that has access to both the player and the enemies. \`Main.bas\` is the right place — but the player needs to tell Main when it's been hit.

Add a \`checkCollisions\` function to \`Main.bas\` that loops over the enemies array:

\`\`\`bas
function checkCollisions(player)
  dim i
  for i = 0 to array.arrLength(enemies) - 1
    if gfx.boxCollide(player, enemies(i)) then
      running = 0
      gameOverDisplay.show()
    endif
  next i
endfunction
\`\`\`

\`gfx.boxCollide(a, b)\` returns \`true\` if the two sprites overlap. The \`for\` loop checks every enemy in one pass.

## Step 5: Call checkCollisions from Player.bas

The player doesn't know about Main.bas directly, but Main.bas *owns* the player — it calls \`new Player()\`. The simplest approach is to give the Player a reference to Main's check function.

However, for a small game like this, the cleanest solution is to do the collision check in \`Main.bas\`'s \`onupdate\` by passing the \`player\` object up. Update \`onenter\` in Main.bas to keep a reference to the player:

\`\`\`bas
dim score
dim timer
dim scoreDisplay as ScoreDisplay
dim gameOverDisplay as GameOverDisplay
dim enemies(0)
dim running
dim player as Player
\`\`\`

Remove the \`dim\` from the player creation line so it uses the module-level variable:

\`\`\`bas
  player = new Player()
\`\`\`

Then update \`onupdate\` to call \`checkCollisions\`:

\`\`\`bas
function onupdate(delta)
  if running = 0 then
    return
  endif

  checkCollisions(player)

  timer = timer + delta
  if timer >= 1000 then
    score = score + 1
    timer = timer - 1000
    scoreDisplay.setScore(score)
  endif
endfunction
\`\`\`

## Step 6: Run it

Click **Run**. Dodge the falling enemy ships with the arrow keys. When one hits you, the GAME OVER message appears and the score freezes. How long can you survive?

## Complete code

**GameOverDisplay.bas**

\`\`\`bas
Class
Extends text

Constructor()
  super("GAME OVER", stage.width() / 2 - 100, stage.height() / 2 - 20)
  self.setStyle(40, 255, 80, 80)
  self.setAlpha(0)
  stage.add(self)
EndConstructor

function show()
  self.setAlpha(1)
endfunction
\`\`\`

**Main.bas**

\`\`\`bas
dim score
dim timer
dim scoreDisplay as ScoreDisplay
dim gameOverDisplay as GameOverDisplay
dim enemies(0)
dim running
dim player as Player

function onenter()
  stage.setBackground(10, 10, 30)
  running = 1
  score = 0
  timer = 0
  scoreDisplay = new ScoreDisplay()
  gameOverDisplay = new GameOverDisplay()
  player = new Player()

  dim e1 = new Enemy(80,  0)
  dim e2 = new Enemy(220, -72)
  dim e3 = new Enemy(360, -144)
  dim e4 = new Enemy(500, -216)
  dim e5 = new Enemy(620, -288)
  array.push(enemies, e1)
  array.push(enemies, e2)
  array.push(enemies, e3)
  array.push(enemies, e4)
  array.push(enemies, e5)
endfunction

function checkCollisions(p)
  dim i
  for i = 0 to array.arrLength(enemies) - 1
    if gfx.boxCollide(p, enemies(i)) then
      running = 0
      gameOverDisplay.show()
    endif
  next i
endfunction

function onupdate(delta)
  if running = 0 then
    return
  endif

  checkCollisions(player)

  timer = timer + delta
  if timer >= 1000 then
    score = score + 1
    timer = timer - 1000
    scoreDisplay.setScore(score)
  endif
endfunction
\`\`\`

**Player.bas** (from Tutorial 8)

\`\`\`bas
Class
Extends sprite

dim speed

Constructor()
  super("ship.png")
  self.speed = 250
  self.transform.setPosition(320, 180)
  stage.add(self)
EndConstructor

function clamp(value, minVal, maxVal)
  if value < minVal then
    value = minVal
  endif
  if value > maxVal then
    value = maxVal
  endif
  return value
endfunction

function onupdate(delta)
  dim x
  dim y
  dim move
  dim halfW
  dim halfH
  x = self.transform.x()
  y = self.transform.y()
  move = self.speed * delta / 1000
  halfW = self.width() / 2
  halfH = self.height() / 2

  if input.getKeyDown(39) then
    x = x + move
  endif
  if input.getKeyDown(37) then
    x = x - move
  endif
  if input.getKeyDown(40) then
    y = y + move
  endif
  if input.getKeyDown(38) then
    y = y - move
  endif

  x = self.clamp(x, halfW, stage.width() - halfW)
  y = self.clamp(y, halfH, stage.height() - halfH)

  self.transform.setPosition(x, y)
endfunction
\`\`\`

**Enemy.bas** (from Tutorial 9)

\`\`\`bas
Class
Extends sprite

dim speed

Constructor(startX, startY)
  super("enemy.png")
  self.speed = 120
  self.transform.setPosition(startX, startY)
  stage.add(self)
EndConstructor

function onupdate(delta)
  dim y
  y = self.transform.y() + self.speed * delta / 1000
  if y > stage.height() then
    y = 0
  endif
  self.transform.setPosition(self.transform.x(), y)
endfunction
\`\`\`

**ScoreDisplay.bas** (from Tutorial 7)

\`\`\`bas
Class
Extends text

Constructor()
  super("Score: 0", 10, 10)
  self.setStyle(24, 255, 255, 100)
  stage.add(self)
EndConstructor

function setScore(s)
  self.setText("Score: " + string.str(s))
endfunction
\`\`\`

## Ideas for taking it further

- Increase enemy speed over time: update \`self.speed\` in each enemy's \`onupdate\` based on score
- Add more enemies as the score increases: push new Enemy objects into the \`enemies\` array from \`onupdate\`
- Display a "Press Space to restart" message and restart on \`onkeydown\` key code 32
- Add a high score that persists across runs using a module-level variable

## What you've learned

- \`gfx.boxCollide(a, b)\` checks whether two sprites overlap
- A \`for\` loop over an array checks every element in one pass
- A \`running\` flag is a simple and reliable way to pause or stop a game
- \`setAlpha(0)\` hides an object; \`setAlpha(1)\` reveals it
- Module-level \`dim\` variables in \`Main.bas\` act as shared game state

## You've completed the tutorial series!

You now know how to build a real softBASIC game from scratch. Explore the [API Reference](../api-reference/gfx) to discover more of what softGfx can do.
`;function r9(e,t){const n={};return(e[e.length-1]===""?[...e,""]:e).join((n.padRight?" ":"")+","+(n.padLeft===!1?"":" ")).trim()}const i9=/^[$_\p{ID_Start}][$_\u{200C}\u{200D}\p{ID_Continue}]*$/u,a9=/^[$_\p{ID_Start}][-$_\u{200C}\u{200D}\p{ID_Continue}]*$/u,s9={};function k0(e,t){return(s9.jsx?a9:i9).test(e)}const l9=/[ \t\n\f\r]/g;function o9(e){return typeof e=="object"?e.type==="text"?M0(e.value):!1:M0(e)}function M0(e){return e.replace(l9,"")===""}class Co{constructor(t,n,i){this.normal=n,this.property=t,i&&(this.space=i)}}Co.prototype.normal={};Co.prototype.property={};Co.prototype.space=void 0;function IS(e,t){const n={},i={};for(const s of e)Object.assign(n,s.property),Object.assign(i,s.normal);return new Co(n,i,t)}function kg(e){return e.toLowerCase()}class Zn{constructor(t,n){this.attribute=n,this.property=t}}Zn.prototype.attribute="";Zn.prototype.booleanish=!1;Zn.prototype.boolean=!1;Zn.prototype.commaOrSpaceSeparated=!1;Zn.prototype.commaSeparated=!1;Zn.prototype.defined=!1;Zn.prototype.mustUseProperty=!1;Zn.prototype.number=!1;Zn.prototype.overloadedBoolean=!1;Zn.prototype.property="";Zn.prototype.spaceSeparated=!1;Zn.prototype.space=void 0;let c9=0;const Qe=Ua(),un=Ua(),Mg=Ua(),ge=Ua(),$t=Ua(),Pa=Ua(),cr=Ua();function Ua(){return 2**++c9}const Pg=Object.freeze(Object.defineProperty({__proto__:null,boolean:Qe,booleanish:un,commaOrSpaceSeparated:cr,commaSeparated:Pa,number:ge,overloadedBoolean:Mg,spaceSeparated:$t},Symbol.toStringTag,{value:"Module"})),Gp=Object.keys(Pg);class Tb extends Zn{constructor(t,n,i,s){let l=-1;if(super(t,n),P0(this,"space",s),typeof i=="number")for(;++l<Gp.length;){const c=Gp[l];P0(this,Gp[l],(i&Pg[c])===Pg[c])}}}Tb.prototype.defined=!0;function P0(e,t,n){n&&(e[t]=n)}function qs(e){const t={},n={};for(const[i,s]of Object.entries(e.properties)){const l=new Tb(i,e.transform(e.attributes||{},i),s,e.space);e.mustUseProperty&&e.mustUseProperty.includes(i)&&(l.mustUseProperty=!0),t[i]=l,n[kg(i)]=i,n[kg(l.attribute)]=i}return new Co(t,n,e.space)}const LS=qs({properties:{ariaActiveDescendant:null,ariaAtomic:un,ariaAutoComplete:null,ariaBusy:un,ariaChecked:un,ariaColCount:ge,ariaColIndex:ge,ariaColSpan:ge,ariaControls:$t,ariaCurrent:null,ariaDescribedBy:$t,ariaDetails:null,ariaDisabled:un,ariaDropEffect:$t,ariaErrorMessage:null,ariaExpanded:un,ariaFlowTo:$t,ariaGrabbed:un,ariaHasPopup:null,ariaHidden:un,ariaInvalid:null,ariaKeyShortcuts:null,ariaLabel:null,ariaLabelledBy:$t,ariaLevel:ge,ariaLive:null,ariaModal:un,ariaMultiLine:un,ariaMultiSelectable:un,ariaOrientation:null,ariaOwns:$t,ariaPlaceholder:null,ariaPosInSet:ge,ariaPressed:un,ariaReadOnly:un,ariaRelevant:null,ariaRequired:un,ariaRoleDescription:$t,ariaRowCount:ge,ariaRowIndex:ge,ariaRowSpan:ge,ariaSelected:un,ariaSetSize:ge,ariaSort:null,ariaValueMax:ge,ariaValueMin:ge,ariaValueNow:ge,ariaValueText:null,role:null},transform(e,t){return t==="role"?t:"aria-"+t.slice(4).toLowerCase()}});function jS(e,t){return t in e?e[t]:t}function $S(e,t){return jS(e,t.toLowerCase())}const u9=qs({attributes:{acceptcharset:"accept-charset",classname:"class",htmlfor:"for",httpequiv:"http-equiv"},mustUseProperty:["checked","multiple","muted","selected"],properties:{abbr:null,accept:Pa,acceptCharset:$t,accessKey:$t,action:null,allow:null,allowFullScreen:Qe,allowPaymentRequest:Qe,allowUserMedia:Qe,alpha:Qe,alt:null,as:null,async:Qe,autoCapitalize:null,autoComplete:$t,autoFocus:Qe,autoPlay:Qe,blocking:$t,capture:null,charSet:null,checked:Qe,cite:null,className:$t,closedBy:null,colorSpace:null,cols:ge,colSpan:ge,command:null,commandFor:null,content:null,contentEditable:un,controls:Qe,controlsList:$t,coords:ge|Pa,crossOrigin:null,data:null,dateTime:null,decoding:null,default:Qe,defer:Qe,dir:null,dirName:null,disabled:Qe,download:Mg,draggable:un,encType:null,enterKeyHint:null,fetchPriority:null,form:null,formAction:null,formEncType:null,formMethod:null,formNoValidate:Qe,formTarget:null,headers:$t,height:ge,hidden:Mg,high:ge,href:null,hrefLang:null,htmlFor:$t,httpEquiv:$t,id:null,imageSizes:null,imageSrcSet:null,inert:Qe,inputMode:null,integrity:null,is:null,isMap:Qe,itemId:null,itemProp:$t,itemRef:$t,itemScope:Qe,itemType:$t,kind:null,label:null,lang:null,language:null,list:null,loading:null,loop:Qe,low:ge,manifest:null,max:null,maxLength:ge,media:null,method:null,min:null,minLength:ge,multiple:Qe,muted:Qe,name:null,nonce:null,noModule:Qe,noValidate:Qe,onAbort:null,onAfterPrint:null,onAuxClick:null,onBeforeMatch:null,onBeforePrint:null,onBeforeToggle:null,onBeforeUnload:null,onBlur:null,onCancel:null,onCanPlay:null,onCanPlayThrough:null,onChange:null,onClick:null,onClose:null,onContextLost:null,onContextMenu:null,onContextRestored:null,onCopy:null,onCueChange:null,onCut:null,onDblClick:null,onDrag:null,onDragEnd:null,onDragEnter:null,onDragExit:null,onDragLeave:null,onDragOver:null,onDragStart:null,onDrop:null,onDurationChange:null,onEmptied:null,onEnded:null,onError:null,onFocus:null,onFormData:null,onHashChange:null,onInput:null,onInvalid:null,onKeyDown:null,onKeyPress:null,onKeyUp:null,onLanguageChange:null,onLoad:null,onLoadedData:null,onLoadedMetadata:null,onLoadEnd:null,onLoadStart:null,onMessage:null,onMessageError:null,onMouseDown:null,onMouseEnter:null,onMouseLeave:null,onMouseMove:null,onMouseOut:null,onMouseOver:null,onMouseUp:null,onOffline:null,onOnline:null,onPageHide:null,onPageShow:null,onPaste:null,onPause:null,onPlay:null,onPlaying:null,onPopState:null,onProgress:null,onRateChange:null,onRejectionHandled:null,onReset:null,onResize:null,onScroll:null,onScrollEnd:null,onSecurityPolicyViolation:null,onSeeked:null,onSeeking:null,onSelect:null,onSlotChange:null,onStalled:null,onStorage:null,onSubmit:null,onSuspend:null,onTimeUpdate:null,onToggle:null,onUnhandledRejection:null,onUnload:null,onVolumeChange:null,onWaiting:null,onWheel:null,open:Qe,optimum:ge,pattern:null,ping:$t,placeholder:null,playsInline:Qe,popover:null,popoverTarget:null,popoverTargetAction:null,poster:null,preload:null,readOnly:Qe,referrerPolicy:null,rel:$t,required:Qe,reversed:Qe,rows:ge,rowSpan:ge,sandbox:$t,scope:null,scoped:Qe,seamless:Qe,selected:Qe,shadowRootClonable:Qe,shadowRootCustomElementRegistry:Qe,shadowRootDelegatesFocus:Qe,shadowRootMode:null,shadowRootSerializable:Qe,shape:null,size:ge,sizes:null,slot:null,span:ge,spellCheck:un,src:null,srcDoc:null,srcLang:null,srcSet:null,start:ge,step:null,style:null,tabIndex:ge,target:null,title:null,translate:null,type:null,typeMustMatch:Qe,useMap:null,value:un,width:ge,wrap:null,writingSuggestions:null,align:null,aLink:null,archive:$t,axis:null,background:null,bgColor:null,border:ge,borderColor:null,bottomMargin:ge,cellPadding:null,cellSpacing:null,char:null,charOff:null,classId:null,clear:null,code:null,codeBase:null,codeType:null,color:null,compact:Qe,declare:Qe,event:null,face:null,frame:null,frameBorder:null,hSpace:ge,leftMargin:ge,link:null,longDesc:null,lowSrc:null,marginHeight:ge,marginWidth:ge,noResize:Qe,noHref:Qe,noShade:Qe,noWrap:Qe,object:null,profile:null,prompt:null,rev:null,rightMargin:ge,rules:null,scheme:null,scrolling:un,standby:null,summary:null,text:null,topMargin:ge,valueType:null,version:null,vAlign:null,vLink:null,vSpace:ge,allowTransparency:null,autoCorrect:null,autoSave:null,credentialless:Qe,disablePictureInPicture:Qe,disableRemotePlayback:Qe,exportParts:Pa,part:$t,prefix:null,property:null,results:ge,security:null,unselectable:null},space:"html",transform:$S}),d9=qs({attributes:{accentHeight:"accent-height",alignmentBaseline:"alignment-baseline",arabicForm:"arabic-form",baselineShift:"baseline-shift",capHeight:"cap-height",className:"class",clipPath:"clip-path",clipRule:"clip-rule",colorInterpolation:"color-interpolation",colorInterpolationFilters:"color-interpolation-filters",colorProfile:"color-profile",colorRendering:"color-rendering",crossOrigin:"crossorigin",dataType:"datatype",dominantBaseline:"dominant-baseline",enableBackground:"enable-background",fillOpacity:"fill-opacity",fillRule:"fill-rule",floodColor:"flood-color",floodOpacity:"flood-opacity",fontFamily:"font-family",fontSize:"font-size",fontSizeAdjust:"font-size-adjust",fontStretch:"font-stretch",fontStyle:"font-style",fontVariant:"font-variant",fontWeight:"font-weight",glyphName:"glyph-name",glyphOrientationHorizontal:"glyph-orientation-horizontal",glyphOrientationVertical:"glyph-orientation-vertical",hrefLang:"hreflang",horizAdvX:"horiz-adv-x",horizOriginX:"horiz-origin-x",horizOriginY:"horiz-origin-y",imageRendering:"image-rendering",letterSpacing:"letter-spacing",lightingColor:"lighting-color",markerEnd:"marker-end",markerMid:"marker-mid",markerStart:"marker-start",maskType:"mask-type",navDown:"nav-down",navDownLeft:"nav-down-left",navDownRight:"nav-down-right",navLeft:"nav-left",navNext:"nav-next",navPrev:"nav-prev",navRight:"nav-right",navUp:"nav-up",navUpLeft:"nav-up-left",navUpRight:"nav-up-right",onAbort:"onabort",onActivate:"onactivate",onAfterPrint:"onafterprint",onBeforePrint:"onbeforeprint",onBegin:"onbegin",onCancel:"oncancel",onCanPlay:"oncanplay",onCanPlayThrough:"oncanplaythrough",onChange:"onchange",onClick:"onclick",onClose:"onclose",onCopy:"oncopy",onCueChange:"oncuechange",onCut:"oncut",onDblClick:"ondblclick",onDrag:"ondrag",onDragEnd:"ondragend",onDragEnter:"ondragenter",onDragExit:"ondragexit",onDragLeave:"ondragleave",onDragOver:"ondragover",onDragStart:"ondragstart",onDrop:"ondrop",onDurationChange:"ondurationchange",onEmptied:"onemptied",onEnd:"onend",onEnded:"onended",onError:"onerror",onFocus:"onfocus",onFocusIn:"onfocusin",onFocusOut:"onfocusout",onHashChange:"onhashchange",onInput:"oninput",onInvalid:"oninvalid",onKeyDown:"onkeydown",onKeyPress:"onkeypress",onKeyUp:"onkeyup",onLoad:"onload",onLoadedData:"onloadeddata",onLoadedMetadata:"onloadedmetadata",onLoadStart:"onloadstart",onMessage:"onmessage",onMouseDown:"onmousedown",onMouseEnter:"onmouseenter",onMouseLeave:"onmouseleave",onMouseMove:"onmousemove",onMouseOut:"onmouseout",onMouseOver:"onmouseover",onMouseUp:"onmouseup",onMouseWheel:"onmousewheel",onOffline:"onoffline",onOnline:"ononline",onPageHide:"onpagehide",onPageShow:"onpageshow",onPaste:"onpaste",onPause:"onpause",onPlay:"onplay",onPlaying:"onplaying",onPopState:"onpopstate",onProgress:"onprogress",onRateChange:"onratechange",onRepeat:"onrepeat",onReset:"onreset",onResize:"onresize",onScroll:"onscroll",onSeeked:"onseeked",onSeeking:"onseeking",onSelect:"onselect",onShow:"onshow",onStalled:"onstalled",onStorage:"onstorage",onSubmit:"onsubmit",onSuspend:"onsuspend",onTimeUpdate:"ontimeupdate",onToggle:"ontoggle",onUnload:"onunload",onVolumeChange:"onvolumechange",onWaiting:"onwaiting",onZoom:"onzoom",overlinePosition:"overline-position",overlineThickness:"overline-thickness",paintOrder:"paint-order",panose1:"panose-1",pointerEvents:"pointer-events",referrerPolicy:"referrerpolicy",renderingIntent:"rendering-intent",shapeRendering:"shape-rendering",stopColor:"stop-color",stopOpacity:"stop-opacity",strikethroughPosition:"strikethrough-position",strikethroughThickness:"strikethrough-thickness",strokeDashArray:"stroke-dasharray",strokeDashOffset:"stroke-dashoffset",strokeLineCap:"stroke-linecap",strokeLineJoin:"stroke-linejoin",strokeMiterLimit:"stroke-miterlimit",strokeOpacity:"stroke-opacity",strokeWidth:"stroke-width",tabIndex:"tabindex",textAnchor:"text-anchor",textDecoration:"text-decoration",textRendering:"text-rendering",transformOrigin:"transform-origin",typeOf:"typeof",underlinePosition:"underline-position",underlineThickness:"underline-thickness",unicodeBidi:"unicode-bidi",unicodeRange:"unicode-range",unitsPerEm:"units-per-em",vAlphabetic:"v-alphabetic",vHanging:"v-hanging",vIdeographic:"v-ideographic",vMathematical:"v-mathematical",vectorEffect:"vector-effect",vertAdvY:"vert-adv-y",vertOriginX:"vert-origin-x",vertOriginY:"vert-origin-y",wordSpacing:"word-spacing",writingMode:"writing-mode",xHeight:"x-height",playbackOrder:"playbackorder",timelineBegin:"timelinebegin"},properties:{about:cr,accentHeight:ge,accumulate:null,additive:null,alignmentBaseline:null,alphabetic:ge,amplitude:ge,arabicForm:null,ascent:ge,attributeName:null,attributeType:null,azimuth:ge,bandwidth:null,baselineShift:null,baseFrequency:null,baseProfile:null,bbox:null,begin:null,bias:ge,by:null,calcMode:null,capHeight:ge,className:$t,clip:null,clipPath:null,clipPathUnits:null,clipRule:null,color:null,colorInterpolation:null,colorInterpolationFilters:null,colorProfile:null,colorRendering:null,content:null,contentScriptType:null,contentStyleType:null,crossOrigin:null,cursor:null,cx:null,cy:null,d:null,dataType:null,defaultAction:null,descent:ge,diffuseConstant:ge,direction:null,display:null,dur:null,divisor:ge,dominantBaseline:null,download:Qe,dx:null,dy:null,edgeMode:null,editable:null,elevation:ge,enableBackground:null,end:null,event:null,exponent:ge,externalResourcesRequired:null,fill:null,fillOpacity:ge,fillRule:null,filter:null,filterRes:null,filterUnits:null,floodColor:null,floodOpacity:null,focusable:null,focusHighlight:null,fontFamily:null,fontSize:null,fontSizeAdjust:null,fontStretch:null,fontStyle:null,fontVariant:null,fontWeight:null,format:null,fr:null,from:null,fx:null,fy:null,g1:Pa,g2:Pa,glyphName:Pa,glyphOrientationHorizontal:null,glyphOrientationVertical:null,glyphRef:null,gradientTransform:null,gradientUnits:null,handler:null,hanging:ge,hatchContentUnits:null,hatchUnits:null,height:null,href:null,hrefLang:null,horizAdvX:ge,horizOriginX:ge,horizOriginY:ge,id:null,ideographic:ge,imageRendering:null,initialVisibility:null,in:null,in2:null,intercept:ge,k:ge,k1:ge,k2:ge,k3:ge,k4:ge,kernelMatrix:cr,kernelUnitLength:null,keyPoints:null,keySplines:null,keyTimes:null,kerning:null,lang:null,lengthAdjust:null,letterSpacing:null,lightingColor:null,limitingConeAngle:ge,local:null,markerEnd:null,markerMid:null,markerStart:null,markerHeight:null,markerUnits:null,markerWidth:null,mask:null,maskContentUnits:null,maskType:null,maskUnits:null,mathematical:null,max:null,media:null,mediaCharacterEncoding:null,mediaContentEncodings:null,mediaSize:ge,mediaTime:null,method:null,min:null,mode:null,name:null,navDown:null,navDownLeft:null,navDownRight:null,navLeft:null,navNext:null,navPrev:null,navRight:null,navUp:null,navUpLeft:null,navUpRight:null,numOctaves:null,observer:null,offset:null,onAbort:null,onActivate:null,onAfterPrint:null,onBeforePrint:null,onBegin:null,onCancel:null,onCanPlay:null,onCanPlayThrough:null,onChange:null,onClick:null,onClose:null,onCopy:null,onCueChange:null,onCut:null,onDblClick:null,onDrag:null,onDragEnd:null,onDragEnter:null,onDragExit:null,onDragLeave:null,onDragOver:null,onDragStart:null,onDrop:null,onDurationChange:null,onEmptied:null,onEnd:null,onEnded:null,onError:null,onFocus:null,onFocusIn:null,onFocusOut:null,onHashChange:null,onInput:null,onInvalid:null,onKeyDown:null,onKeyPress:null,onKeyUp:null,onLoad:null,onLoadedData:null,onLoadedMetadata:null,onLoadStart:null,onMessage:null,onMouseDown:null,onMouseEnter:null,onMouseLeave:null,onMouseMove:null,onMouseOut:null,onMouseOver:null,onMouseUp:null,onMouseWheel:null,onOffline:null,onOnline:null,onPageHide:null,onPageShow:null,onPaste:null,onPause:null,onPlay:null,onPlaying:null,onPopState:null,onProgress:null,onRateChange:null,onRepeat:null,onReset:null,onResize:null,onScroll:null,onSeeked:null,onSeeking:null,onSelect:null,onShow:null,onStalled:null,onStorage:null,onSubmit:null,onSuspend:null,onTimeUpdate:null,onToggle:null,onUnload:null,onVolumeChange:null,onWaiting:null,onZoom:null,opacity:null,operator:null,order:null,orient:null,orientation:null,origin:null,overflow:null,overlay:null,overlinePosition:ge,overlineThickness:ge,paintOrder:null,panose1:null,path:null,pathLength:ge,patternContentUnits:null,patternTransform:null,patternUnits:null,phase:null,ping:$t,pitch:null,playbackOrder:null,pointerEvents:null,points:null,pointsAtX:ge,pointsAtY:ge,pointsAtZ:ge,preserveAlpha:null,preserveAspectRatio:null,primitiveUnits:null,propagate:null,property:cr,r:null,radius:null,referrerPolicy:null,refX:null,refY:null,rel:cr,rev:cr,renderingIntent:null,repeatCount:null,repeatDur:null,requiredExtensions:cr,requiredFeatures:cr,requiredFonts:cr,requiredFormats:cr,resource:null,restart:null,result:null,rotate:null,rx:null,ry:null,scale:null,seed:null,shapeRendering:null,side:null,slope:null,snapshotTime:null,specularConstant:ge,specularExponent:ge,spreadMethod:null,spacing:null,startOffset:null,stdDeviation:null,stemh:null,stemv:null,stitchTiles:null,stopColor:null,stopOpacity:null,strikethroughPosition:ge,strikethroughThickness:ge,string:null,stroke:null,strokeDashArray:cr,strokeDashOffset:null,strokeLineCap:null,strokeLineJoin:null,strokeMiterLimit:ge,strokeOpacity:ge,strokeWidth:null,style:null,surfaceScale:ge,syncBehavior:null,syncBehaviorDefault:null,syncMaster:null,syncTolerance:null,syncToleranceDefault:null,systemLanguage:cr,tabIndex:ge,tableValues:null,target:null,targetX:ge,targetY:ge,textAnchor:null,textDecoration:null,textRendering:null,textLength:null,timelineBegin:null,title:null,transformBehavior:null,type:null,typeOf:cr,to:null,transform:null,transformOrigin:null,u1:null,u2:null,underlinePosition:ge,underlineThickness:ge,unicode:null,unicodeBidi:null,unicodeRange:null,unitsPerEm:ge,values:null,vAlphabetic:ge,vMathematical:ge,vectorEffect:null,vHanging:ge,vIdeographic:ge,version:null,vertAdvY:ge,vertOriginX:ge,vertOriginY:ge,viewBox:null,viewTarget:null,visibility:null,width:null,widths:null,wordSpacing:null,writingMode:null,x:null,x1:null,x2:null,xChannelSelector:null,xHeight:ge,y:null,y1:null,y2:null,yChannelSelector:null,z:null,zoomAndPan:null},space:"svg",transform:jS}),zS=qs({properties:{xLinkActuate:null,xLinkArcRole:null,xLinkHref:null,xLinkRole:null,xLinkShow:null,xLinkTitle:null,xLinkType:null},space:"xlink",transform(e,t){return"xlink:"+t.slice(5).toLowerCase()}}),BS=qs({attributes:{xmlnsxlink:"xmlns:xlink"},properties:{xmlnsXLink:null,xmlns:null},space:"xmlns",transform:$S}),FS=qs({properties:{xmlBase:null,xmlLang:null,xmlSpace:null},space:"xml",transform(e,t){return"xml:"+t.slice(3).toLowerCase()}}),f9={classId:"classID",dataType:"datatype",itemId:"itemID",strokeDashArray:"strokeDasharray",strokeDashOffset:"strokeDashoffset",strokeLineCap:"strokeLinecap",strokeLineJoin:"strokeLinejoin",strokeMiterLimit:"strokeMiterlimit",typeOf:"typeof",xLinkActuate:"xlinkActuate",xLinkArcRole:"xlinkArcrole",xLinkHref:"xlinkHref",xLinkRole:"xlinkRole",xLinkShow:"xlinkShow",xLinkTitle:"xlinkTitle",xLinkType:"xlinkType",xmlnsXLink:"xmlnsXlink"},p9=/[A-Z]/g,I0=/-[a-z]/g,h9=/^data[-\w.:]+$/i;function m9(e,t){const n=kg(t);let i=t,s=Zn;if(n in e.normal)return e.property[e.normal[n]];if(n.length>4&&n.slice(0,4)==="data"&&h9.test(t)){if(t.charAt(4)==="-"){const l=t.slice(5).replace(I0,b9);i="data"+l.charAt(0).toUpperCase()+l.slice(1)}else{const l=t.slice(4);if(!I0.test(l)){let c=l.replace(p9,g9);c.charAt(0)!=="-"&&(c="-"+c),t="data"+c}}s=Tb}return new s(i,t)}function g9(e){return"-"+e.toLowerCase()}function b9(e){return e.charAt(1).toUpperCase()}const y9=IS([LS,u9,zS,BS,FS],"html"),Ob=IS([LS,d9,zS,BS,FS],"svg");function v9(e){return e.join(" ").trim()}var Ss={},Vp,L0;function _9(){if(L0)return Vp;L0=1;var e=/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g,t=/\n/g,n=/^\s*/,i=/^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/,s=/^:\s*/,l=/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/,c=/^[;\s]*/,d=/^\s+|\s+$/g,f=`
`,p="/",m="*",g="",y="comment",v="declaration";function _(N,C){if(typeof N!="string")throw new TypeError("First argument must be a string");if(!N)return[];C=C||{};var P=1,k=1;function I(ue){var V=ue.match(t);V&&(P+=V.length);var B=ue.lastIndexOf(f);k=~B?ue.length-B:k+ue.length}function D(){var ue={line:P,column:k};return function(V){return V.position=new M(ue),W(),V}}function M(ue){this.start=ue,this.end={line:P,column:k},this.source=C.source}M.prototype.content=N;function z(ue){var V=new Error(C.source+":"+P+":"+k+": "+ue);if(V.reason=ue,V.filename=C.source,V.line=P,V.column=k,V.source=N,!C.silent)throw V}function Z(ue){var V=ue.exec(N);if(V){var B=V[0];return I(B),N=N.slice(B.length),V}}function W(){Z(n)}function $(ue){var V;for(ue=ue||[];V=re();)V!==!1&&ue.push(V);return ue}function re(){var ue=D();if(!(p!=N.charAt(0)||m!=N.charAt(1))){for(var V=2;g!=N.charAt(V)&&(m!=N.charAt(V)||p!=N.charAt(V+1));)++V;if(V+=2,g===N.charAt(V-1))return z("End of comment missing");var B=N.slice(2,V-2);return k+=2,I(B),N=N.slice(V),k+=2,ue({type:y,comment:B})}}function se(){var ue=D(),V=Z(i);if(V){if(re(),!Z(s))return z("property missing ':'");var B=Z(l),ee=ue({type:v,property:T(V[0].replace(e,g)),value:B?T(B[0].replace(e,g)):g});return Z(c),ee}}function Se(){var ue=[];$(ue);for(var V;V=se();)V!==!1&&(ue.push(V),$(ue));return ue}return W(),Se()}function T(N){return N?N.replace(d,g):g}return Vp=_,Vp}var j0;function x9(){if(j0)return Ss;j0=1;var e=Ss&&Ss.__importDefault||function(i){return i&&i.__esModule?i:{default:i}};Object.defineProperty(Ss,"__esModule",{value:!0}),Ss.default=n;const t=e(_9());function n(i,s){let l=null;if(!i||typeof i!="string")return l;const c=(0,t.default)(i),d=typeof s=="function";return c.forEach(f=>{if(f.type!=="declaration")return;const{property:p,value:m}=f;d?s(p,m,f):m&&(l=l||{},l[p]=m)}),l}return Ss}var Kl={},$0;function w9(){if($0)return Kl;$0=1,Object.defineProperty(Kl,"__esModule",{value:!0}),Kl.camelCase=void 0;var e=/^--[a-zA-Z0-9_-]+$/,t=/-([a-z])/g,n=/^[^-]+$/,i=/^-(webkit|moz|ms|o|khtml)-/,s=/^-(ms)-/,l=function(p){return!p||n.test(p)||e.test(p)},c=function(p,m){return m.toUpperCase()},d=function(p,m){return"".concat(m,"-")},f=function(p,m){return m===void 0&&(m={}),l(p)?p:(p=p.toLowerCase(),m.reactCompat?p=p.replace(s,d):p=p.replace(i,d),p.replace(t,c))};return Kl.camelCase=f,Kl}var Yl,z0;function E9(){if(z0)return Yl;z0=1;var e=Yl&&Yl.__importDefault||function(s){return s&&s.__esModule?s:{default:s}},t=e(x9()),n=w9();function i(s,l){var c={};return!s||typeof s!="string"||(0,t.default)(s,function(d,f){d&&f&&(c[(0,n.camelCase)(d,l)]=f)}),c}return i.default=i,Yl=i,Yl}var S9=E9();const C9=za(S9),US=HS("end"),Rb=HS("start");function HS(e){return t;function t(n){const i=n&&n.position&&n.position[e]||{};if(typeof i.line=="number"&&i.line>0&&typeof i.column=="number"&&i.column>0)return{line:i.line,column:i.column,offset:typeof i.offset=="number"&&i.offset>-1?i.offset:void 0}}}function T9(e){const t=Rb(e),n=US(e);if(t&&n)return{start:t,end:n}}function so(e){return!e||typeof e!="object"?"":"position"in e||"type"in e?B0(e.position):"start"in e||"end"in e?B0(e):"line"in e||"column"in e?Ig(e):""}function Ig(e){return F0(e&&e.line)+":"+F0(e&&e.column)}function B0(e){return Ig(e&&e.start)+"-"+Ig(e&&e.end)}function F0(e){return e&&typeof e=="number"?e:1}class kn extends Error{constructor(t,n,i){super(),typeof n=="string"&&(i=n,n=void 0);let s="",l={},c=!1;if(n&&("line"in n&&"column"in n?l={place:n}:"start"in n&&"end"in n?l={place:n}:"type"in n?l={ancestors:[n],place:n.position}:l={...n}),typeof t=="string"?s=t:!l.cause&&t&&(c=!0,s=t.message,l.cause=t),!l.ruleId&&!l.source&&typeof i=="string"){const f=i.indexOf(":");f===-1?l.ruleId=i:(l.source=i.slice(0,f),l.ruleId=i.slice(f+1))}if(!l.place&&l.ancestors&&l.ancestors){const f=l.ancestors[l.ancestors.length-1];f&&(l.place=f.position)}const d=l.place&&"start"in l.place?l.place.start:l.place;this.ancestors=l.ancestors||void 0,this.cause=l.cause||void 0,this.column=d?d.column:void 0,this.fatal=void 0,this.file="",this.message=s,this.line=d?d.line:void 0,this.name=so(l.place)||"1:1",this.place=l.place||void 0,this.reason=this.message,this.ruleId=l.ruleId||void 0,this.source=l.source||void 0,this.stack=c&&l.cause&&typeof l.cause.stack=="string"?l.cause.stack:"",this.actual=void 0,this.expected=void 0,this.note=void 0,this.url=void 0}}kn.prototype.file="";kn.prototype.name="";kn.prototype.reason="";kn.prototype.message="";kn.prototype.stack="";kn.prototype.column=void 0;kn.prototype.line=void 0;kn.prototype.ancestors=void 0;kn.prototype.cause=void 0;kn.prototype.fatal=void 0;kn.prototype.place=void 0;kn.prototype.ruleId=void 0;kn.prototype.source=void 0;const Nb={}.hasOwnProperty,O9=new Map,R9=/[A-Z]/g,N9=new Set(["table","tbody","thead","tfoot","tr"]),A9=new Set(["td","th"]),qS="https://github.com/syntax-tree/hast-util-to-jsx-runtime";function D9(e,t){if(!t||t.Fragment===void 0)throw new TypeError("Expected `Fragment` in options");const n=t.filePath||void 0;let i;if(t.development){if(typeof t.jsxDEV!="function")throw new TypeError("Expected `jsxDEV` in options when `development: true`");i=z9(n,t.jsxDEV)}else{if(typeof t.jsx!="function")throw new TypeError("Expected `jsx` in production options");if(typeof t.jsxs!="function")throw new TypeError("Expected `jsxs` in production options");i=$9(n,t.jsx,t.jsxs)}const s={Fragment:t.Fragment,ancestors:[],components:t.components||{},create:i,elementAttributeNameCase:t.elementAttributeNameCase||"react",evaluater:t.createEvaluater?t.createEvaluater():void 0,filePath:n,ignoreInvalidStyle:t.ignoreInvalidStyle||!1,passKeys:t.passKeys!==!1,passNode:t.passNode||!1,schema:t.space==="svg"?Ob:y9,stylePropertyNameCase:t.stylePropertyNameCase||"dom",tableCellAlignToStyle:t.tableCellAlignToStyle!==!1},l=GS(s,e,void 0);return l&&typeof l!="string"?l:s.create(e,s.Fragment,{children:l||void 0},void 0)}function GS(e,t,n){if(t.type==="element")return k9(e,t,n);if(t.type==="mdxFlowExpression"||t.type==="mdxTextExpression")return M9(e,t);if(t.type==="mdxJsxFlowElement"||t.type==="mdxJsxTextElement")return I9(e,t,n);if(t.type==="mdxjsEsm")return P9(e,t);if(t.type==="root")return L9(e,t,n);if(t.type==="text")return j9(e,t)}function k9(e,t,n){const i=e.schema;let s=i;t.tagName.toLowerCase()==="svg"&&i.space==="html"&&(s=Ob,e.schema=s),e.ancestors.push(t);const l=KS(e,t.tagName,!1),c=B9(e,t);let d=Db(e,t);return N9.has(t.tagName)&&(d=d.filter(function(f){return typeof f=="string"?!o9(f):!0})),VS(e,c,l,t),Ab(c,d),e.ancestors.pop(),e.schema=i,e.create(t,l,c,n)}function M9(e,t){if(t.data&&t.data.estree&&e.evaluater){const i=t.data.estree.body[0];return i.type,e.evaluater.evaluateExpression(i.expression)}go(e,t.position)}function P9(e,t){if(t.data&&t.data.estree&&e.evaluater)return e.evaluater.evaluateProgram(t.data.estree);go(e,t.position)}function I9(e,t,n){const i=e.schema;let s=i;t.name==="svg"&&i.space==="html"&&(s=Ob,e.schema=s),e.ancestors.push(t);const l=t.name===null?e.Fragment:KS(e,t.name,!0),c=F9(e,t),d=Db(e,t);return VS(e,c,l,t),Ab(c,d),e.ancestors.pop(),e.schema=i,e.create(t,l,c,n)}function L9(e,t,n){const i={};return Ab(i,Db(e,t)),e.create(t,e.Fragment,i,n)}function j9(e,t){return t.value}function VS(e,t,n,i){typeof n!="string"&&n!==e.Fragment&&e.passNode&&(t.node=i)}function Ab(e,t){if(t.length>0){const n=t.length>1?t:t[0];n&&(e.children=n)}}function $9(e,t,n){return i;function i(s,l,c,d){const p=Array.isArray(c.children)?n:t;return d?p(l,c,d):p(l,c)}}function z9(e,t){return n;function n(i,s,l,c){const d=Array.isArray(l.children),f=Rb(i);return t(s,l,c,d,{columnNumber:f?f.column-1:void 0,fileName:e,lineNumber:f?f.line:void 0},void 0)}}function B9(e,t){const n={};let i,s;for(s in t.properties)if(s!=="children"&&Nb.call(t.properties,s)){const l=U9(e,s,t.properties[s]);if(l){const[c,d]=l;e.tableCellAlignToStyle&&c==="align"&&typeof d=="string"&&A9.has(t.tagName)?i=d:n[c]=d}}if(i){const l=n.style||(n.style={});l[e.stylePropertyNameCase==="css"?"text-align":"textAlign"]=i}return n}function F9(e,t){const n={};for(const i of t.attributes)if(i.type==="mdxJsxExpressionAttribute")if(i.data&&i.data.estree&&e.evaluater){const l=i.data.estree.body[0];l.type;const c=l.expression;c.type;const d=c.properties[0];d.type,Object.assign(n,e.evaluater.evaluateExpression(d.argument))}else go(e,t.position);else{const s=i.name;let l;if(i.value&&typeof i.value=="object")if(i.value.data&&i.value.data.estree&&e.evaluater){const d=i.value.data.estree.body[0];d.type,l=e.evaluater.evaluateExpression(d.expression)}else go(e,t.position);else l=i.value===null?!0:i.value;n[s]=l}return n}function Db(e,t){const n=[];let i=-1;const s=e.passKeys?new Map:O9;for(;++i<t.children.length;){const l=t.children[i];let c;if(e.passKeys){const f=l.type==="element"?l.tagName:l.type==="mdxJsxFlowElement"||l.type==="mdxJsxTextElement"?l.name:void 0;if(f){const p=s.get(f)||0;c=f+"-"+p,s.set(f,p+1)}}const d=GS(e,l,c);d!==void 0&&n.push(d)}return n}function U9(e,t,n){const i=m9(e.schema,t);if(!(n==null||typeof n=="number"&&Number.isNaN(n))){if(Array.isArray(n)&&(n=i.commaSeparated?r9(n):v9(n)),i.property==="style"){let s=typeof n=="object"?n:H9(e,String(n));return e.stylePropertyNameCase==="css"&&(s=q9(s)),["style",s]}return[e.elementAttributeNameCase==="react"&&i.space?f9[i.property]||i.property:i.attribute,n]}}function H9(e,t){try{return C9(t,{reactCompat:!0})}catch(n){if(e.ignoreInvalidStyle)return{};const i=n,s=new kn("Cannot parse `style` attribute",{ancestors:e.ancestors,cause:i,ruleId:"style",source:"hast-util-to-jsx-runtime"});throw s.file=e.filePath||void 0,s.url=qS+"#cannot-parse-style-attribute",s}}function KS(e,t,n){let i;if(!n)i={type:"Literal",value:t};else if(t.includes(".")){const s=t.split(".");let l=-1,c;for(;++l<s.length;){const d=k0(s[l])?{type:"Identifier",name:s[l]}:{type:"Literal",value:s[l]};c=c?{type:"MemberExpression",object:c,property:d,computed:!!(l&&d.type==="Literal"),optional:!1}:d}i=c}else i=k0(t)&&!/^[a-z]/.test(t)?{type:"Identifier",name:t}:{type:"Literal",value:t};if(i.type==="Literal"){const s=i.value;return Nb.call(e.components,s)?e.components[s]:s}if(e.evaluater)return e.evaluater.evaluateExpression(i);go(e)}function go(e,t){const n=new kn("Cannot handle MDX estrees without `createEvaluater`",{ancestors:e.ancestors,place:t,ruleId:"mdx-estree",source:"hast-util-to-jsx-runtime"});throw n.file=e.filePath||void 0,n.url=qS+"#cannot-handle-mdx-estrees-without-createevaluater",n}function q9(e){const t={};let n;for(n in e)Nb.call(e,n)&&(t[G9(n)]=e[n]);return t}function G9(e){let t=e.replace(R9,V9);return t.slice(0,3)==="ms-"&&(t="-"+t),t}function V9(e){return"-"+e.toLowerCase()}const Kp={action:["form"],cite:["blockquote","del","ins","q"],data:["object"],formAction:["button","input"],href:["a","area","base","link"],icon:["menuitem"],itemId:null,manifest:["html"],ping:["a","area"],poster:["video"],src:["audio","embed","iframe","img","input","script","source","track","video"]},K9={};function kb(e,t){const n=K9,i=typeof n.includeImageAlt=="boolean"?n.includeImageAlt:!0,s=typeof n.includeHtml=="boolean"?n.includeHtml:!0;return YS(e,i,s)}function YS(e,t,n){if(Y9(e)){if("value"in e)return e.type==="html"&&!n?"":e.value;if(t&&"alt"in e&&e.alt)return e.alt;if("children"in e)return U0(e.children,t,n)}return Array.isArray(e)?U0(e,t,n):""}function U0(e,t,n){const i=[];let s=-1;for(;++s<e.length;)i[s]=YS(e[s],t,n);return i.join("")}function Y9(e){return!!(e&&typeof e=="object")}const H0=document.createElement("i");function Mb(e){const t="&"+e+";";H0.innerHTML=t;const n=H0.textContent;return n.charCodeAt(n.length-1)===59&&e!=="semi"||n===t?!1:n}function dr(e,t,n,i){const s=e.length;let l=0,c;if(t<0?t=-t>s?0:s+t:t=t>s?s:t,n=n>0?n:0,i.length<1e4)c=Array.from(i),c.unshift(t,n),e.splice(...c);else for(n&&e.splice(t,n);l<i.length;)c=i.slice(l,l+1e4),c.unshift(t,0),e.splice(...c),l+=1e4,t+=1e4}function Tr(e,t){return e.length>0?(dr(e,e.length,0,t),e):t}const q0={}.hasOwnProperty;function XS(e){const t={};let n=-1;for(;++n<e.length;)X9(t,e[n]);return t}function X9(e,t){let n;for(n in t){const s=(q0.call(e,n)?e[n]:void 0)||(e[n]={}),l=t[n];let c;if(l)for(c in l){q0.call(s,c)||(s[c]=[]);const d=l[c];W9(s[c],Array.isArray(d)?d:d?[d]:[])}}}function W9(e,t){let n=-1;const i=[];for(;++n<t.length;)(t[n].add==="after"?e:i).push(t[n]);dr(e,0,0,i)}function WS(e,t){const n=Number.parseInt(e,t);return n<9||n===11||n>13&&n<32||n>126&&n<160||n>55295&&n<57344||n>64975&&n<65008||(n&65535)===65535||(n&65535)===65534||n>1114111?"�":String.fromCodePoint(n)}function jr(e){return e.replace(/[\t\n\r ]+/g," ").replace(/^ | $/g,"").toLowerCase().toUpperCase()}const jn=aa(/[A-Za-z]/),Dn=aa(/[\dA-Za-z]/),Z9=aa(/[#-'*+\--9=?A-Z^-~]/);function zu(e){return e!==null&&(e<32||e===127)}const Lg=aa(/\d/),Q9=aa(/[\dA-Fa-f]/),J9=aa(/[!-/:-@[-`{-~]/);function Fe(e){return e!==null&&e<-2}function zt(e){return e!==null&&(e<0||e===32)}function ft(e){return e===-2||e===-1||e===32}const fd=aa(new RegExp("\\p{P}|\\p{S}","u")),$a=aa(/\s/);function aa(e){return t;function t(n){return n!==null&&n>-1&&e.test(String.fromCharCode(n))}}function Gs(e){const t=[];let n=-1,i=0,s=0;for(;++n<e.length;){const l=e.charCodeAt(n);let c="";if(l===37&&Dn(e.charCodeAt(n+1))&&Dn(e.charCodeAt(n+2)))s=2;else if(l<128)/[!#$&-;=?-Z_a-z~]/.test(String.fromCharCode(l))||(c=String.fromCharCode(l));else if(l>55295&&l<57344){const d=e.charCodeAt(n+1);l<56320&&d>56319&&d<57344?(c=String.fromCharCode(l,d),s=1):c="�"}else c=String.fromCharCode(l);c&&(t.push(e.slice(i,n),encodeURIComponent(c)),i=n+s+1,c=""),s&&(n+=s,s=0)}return t.join("")+e.slice(i)}function vt(e,t,n,i){const s=i?i-1:Number.POSITIVE_INFINITY;let l=0;return c;function c(f){return ft(f)?(e.enter(n),d(f)):t(f)}function d(f){return ft(f)&&l++<s?(e.consume(f),d):(e.exit(n),t(f))}}const e6={tokenize:t6};function t6(e){const t=e.attempt(this.parser.constructs.contentInitial,i,s);let n;return t;function i(d){if(d===null){e.consume(d);return}return e.enter("lineEnding"),e.consume(d),e.exit("lineEnding"),vt(e,t,"linePrefix")}function s(d){return e.enter("paragraph"),l(d)}function l(d){const f=e.enter("chunkText",{contentType:"text",previous:n});return n&&(n.next=f),n=f,c(d)}function c(d){if(d===null){e.exit("chunkText"),e.exit("paragraph"),e.consume(d);return}return Fe(d)?(e.consume(d),e.exit("chunkText"),l):(e.consume(d),c)}}const n6={tokenize:r6},G0={tokenize:i6};function r6(e){const t=this,n=[];let i=0,s,l,c;return d;function d(k){if(i<n.length){const I=n[i];return t.containerState=I[1],e.attempt(I[0].continuation,f,p)(k)}return p(k)}function f(k){if(i++,t.containerState._closeFlow){t.containerState._closeFlow=void 0,s&&P();const I=t.events.length;let D=I,M;for(;D--;)if(t.events[D][0]==="exit"&&t.events[D][1].type==="chunkFlow"){M=t.events[D][1].end;break}C(i);let z=I;for(;z<t.events.length;)t.events[z][1].end={...M},z++;return dr(t.events,D+1,0,t.events.slice(I)),t.events.length=z,p(k)}return d(k)}function p(k){if(i===n.length){if(!s)return y(k);if(s.currentConstruct&&s.currentConstruct.concrete)return _(k);t.interrupt=!!(s.currentConstruct&&!s._gfmTableDynamicInterruptHack)}return t.containerState={},e.check(G0,m,g)(k)}function m(k){return s&&P(),C(i),y(k)}function g(k){return t.parser.lazy[t.now().line]=i!==n.length,c=t.now().offset,_(k)}function y(k){return t.containerState={},e.attempt(G0,v,_)(k)}function v(k){return i++,n.push([t.currentConstruct,t.containerState]),y(k)}function _(k){if(k===null){s&&P(),C(0),e.consume(k);return}return s=s||t.parser.flow(t.now()),e.enter("chunkFlow",{_tokenizer:s,contentType:"flow",previous:l}),T(k)}function T(k){if(k===null){N(e.exit("chunkFlow"),!0),C(0),e.consume(k);return}return Fe(k)?(e.consume(k),N(e.exit("chunkFlow")),i=0,t.interrupt=void 0,d):(e.consume(k),T)}function N(k,I){const D=t.sliceStream(k);if(I&&D.push(null),k.previous=l,l&&(l.next=k),l=k,s.defineSkip(k.start),s.write(D),t.parser.lazy[k.start.line]){let M=s.events.length;for(;M--;)if(s.events[M][1].start.offset<c&&(!s.events[M][1].end||s.events[M][1].end.offset>c))return;const z=t.events.length;let Z=z,W,$;for(;Z--;)if(t.events[Z][0]==="exit"&&t.events[Z][1].type==="chunkFlow"){if(W){$=t.events[Z][1].end;break}W=!0}for(C(i),M=z;M<t.events.length;)t.events[M][1].end={...$},M++;dr(t.events,Z+1,0,t.events.slice(z)),t.events.length=M}}function C(k){let I=n.length;for(;I-- >k;){const D=n[I];t.containerState=D[1],D[0].exit.call(t,e)}n.length=k}function P(){s.write([null]),l=void 0,s=void 0,t.containerState._closeFlow=void 0}}function i6(e,t,n){return vt(e,e.attempt(this.parser.constructs.document,t,n),"linePrefix",this.parser.constructs.disable.null.includes("codeIndented")?void 0:4)}function Ls(e){if(e===null||zt(e)||$a(e))return 1;if(fd(e))return 2}function pd(e,t,n){const i=[];let s=-1;for(;++s<e.length;){const l=e[s].resolveAll;l&&!i.includes(l)&&(t=l(t,n),i.push(l))}return t}const jg={name:"attention",resolveAll:a6,tokenize:s6};function a6(e,t){let n=-1,i,s,l,c,d,f,p,m;for(;++n<e.length;)if(e[n][0]==="enter"&&e[n][1].type==="attentionSequence"&&e[n][1]._close){for(i=n;i--;)if(e[i][0]==="exit"&&e[i][1].type==="attentionSequence"&&e[i][1]._open&&t.sliceSerialize(e[i][1]).charCodeAt(0)===t.sliceSerialize(e[n][1]).charCodeAt(0)){if((e[i][1]._close||e[n][1]._open)&&(e[n][1].end.offset-e[n][1].start.offset)%3&&!((e[i][1].end.offset-e[i][1].start.offset+e[n][1].end.offset-e[n][1].start.offset)%3))continue;f=e[i][1].end.offset-e[i][1].start.offset>1&&e[n][1].end.offset-e[n][1].start.offset>1?2:1;const g={...e[i][1].end},y={...e[n][1].start};V0(g,-f),V0(y,f),c={type:f>1?"strongSequence":"emphasisSequence",start:g,end:{...e[i][1].end}},d={type:f>1?"strongSequence":"emphasisSequence",start:{...e[n][1].start},end:y},l={type:f>1?"strongText":"emphasisText",start:{...e[i][1].end},end:{...e[n][1].start}},s={type:f>1?"strong":"emphasis",start:{...c.start},end:{...d.end}},e[i][1].end={...c.start},e[n][1].start={...d.end},p=[],e[i][1].end.offset-e[i][1].start.offset&&(p=Tr(p,[["enter",e[i][1],t],["exit",e[i][1],t]])),p=Tr(p,[["enter",s,t],["enter",c,t],["exit",c,t],["enter",l,t]]),p=Tr(p,pd(t.parser.constructs.insideSpan.null,e.slice(i+1,n),t)),p=Tr(p,[["exit",l,t],["enter",d,t],["exit",d,t],["exit",s,t]]),e[n][1].end.offset-e[n][1].start.offset?(m=2,p=Tr(p,[["enter",e[n][1],t],["exit",e[n][1],t]])):m=0,dr(e,i-1,n-i+3,p),n=i+p.length-m-2;break}}for(n=-1;++n<e.length;)e[n][1].type==="attentionSequence"&&(e[n][1].type="data");return e}function s6(e,t){const n=this.parser.constructs.attentionMarkers.null,i=this.previous,s=Ls(i);let l;return c;function c(f){return l=f,e.enter("attentionSequence"),d(f)}function d(f){if(f===l)return e.consume(f),d;const p=e.exit("attentionSequence"),m=Ls(f),g=!m||m===2&&s||n.includes(f),y=!s||s===2&&m||n.includes(i);return p._open=!!(l===42?g:g&&(s||!y)),p._close=!!(l===42?y:y&&(m||!g)),t(f)}}function V0(e,t){e.column+=t,e.offset+=t,e._bufferIndex+=t}const l6={name:"autolink",tokenize:o6};function o6(e,t,n){let i=0;return s;function s(v){return e.enter("autolink"),e.enter("autolinkMarker"),e.consume(v),e.exit("autolinkMarker"),e.enter("autolinkProtocol"),l}function l(v){return jn(v)?(e.consume(v),c):v===64?n(v):p(v)}function c(v){return v===43||v===45||v===46||Dn(v)?(i=1,d(v)):p(v)}function d(v){return v===58?(e.consume(v),i=0,f):(v===43||v===45||v===46||Dn(v))&&i++<32?(e.consume(v),d):(i=0,p(v))}function f(v){return v===62?(e.exit("autolinkProtocol"),e.enter("autolinkMarker"),e.consume(v),e.exit("autolinkMarker"),e.exit("autolink"),t):v===null||v===32||v===60||zu(v)?n(v):(e.consume(v),f)}function p(v){return v===64?(e.consume(v),m):Z9(v)?(e.consume(v),p):n(v)}function m(v){return Dn(v)?g(v):n(v)}function g(v){return v===46?(e.consume(v),i=0,m):v===62?(e.exit("autolinkProtocol").type="autolinkEmail",e.enter("autolinkMarker"),e.consume(v),e.exit("autolinkMarker"),e.exit("autolink"),t):y(v)}function y(v){if((v===45||Dn(v))&&i++<63){const _=v===45?y:g;return e.consume(v),_}return n(v)}}const To={partial:!0,tokenize:c6};function c6(e,t,n){return i;function i(l){return ft(l)?vt(e,s,"linePrefix")(l):s(l)}function s(l){return l===null||Fe(l)?t(l):n(l)}}const ZS={continuation:{tokenize:d6},exit:f6,name:"blockQuote",tokenize:u6};function u6(e,t,n){const i=this;return s;function s(c){if(c===62){const d=i.containerState;return d.open||(e.enter("blockQuote",{_container:!0}),d.open=!0),e.enter("blockQuotePrefix"),e.enter("blockQuoteMarker"),e.consume(c),e.exit("blockQuoteMarker"),l}return n(c)}function l(c){return ft(c)?(e.enter("blockQuotePrefixWhitespace"),e.consume(c),e.exit("blockQuotePrefixWhitespace"),e.exit("blockQuotePrefix"),t):(e.exit("blockQuotePrefix"),t(c))}}function d6(e,t,n){const i=this;return s;function s(c){return ft(c)?vt(e,l,"linePrefix",i.parser.constructs.disable.null.includes("codeIndented")?void 0:4)(c):l(c)}function l(c){return e.attempt(ZS,t,n)(c)}}function f6(e){e.exit("blockQuote")}const QS={name:"characterEscape",tokenize:p6};function p6(e,t,n){return i;function i(l){return e.enter("characterEscape"),e.enter("escapeMarker"),e.consume(l),e.exit("escapeMarker"),s}function s(l){return J9(l)?(e.enter("characterEscapeValue"),e.consume(l),e.exit("characterEscapeValue"),e.exit("characterEscape"),t):n(l)}}const JS={name:"characterReference",tokenize:h6};function h6(e,t,n){const i=this;let s=0,l,c;return d;function d(g){return e.enter("characterReference"),e.enter("characterReferenceMarker"),e.consume(g),e.exit("characterReferenceMarker"),f}function f(g){return g===35?(e.enter("characterReferenceMarkerNumeric"),e.consume(g),e.exit("characterReferenceMarkerNumeric"),p):(e.enter("characterReferenceValue"),l=31,c=Dn,m(g))}function p(g){return g===88||g===120?(e.enter("characterReferenceMarkerHexadecimal"),e.consume(g),e.exit("characterReferenceMarkerHexadecimal"),e.enter("characterReferenceValue"),l=6,c=Q9,m):(e.enter("characterReferenceValue"),l=7,c=Lg,m(g))}function m(g){if(g===59&&s){const y=e.exit("characterReferenceValue");return c===Dn&&!Mb(i.sliceSerialize(y))?n(g):(e.enter("characterReferenceMarker"),e.consume(g),e.exit("characterReferenceMarker"),e.exit("characterReference"),t)}return c(g)&&s++<l?(e.consume(g),m):n(g)}}const K0={partial:!0,tokenize:g6},Y0={concrete:!0,name:"codeFenced",tokenize:m6};function m6(e,t,n){const i=this,s={partial:!0,tokenize:D};let l=0,c=0,d;return f;function f(M){return p(M)}function p(M){const z=i.events[i.events.length-1];return l=z&&z[1].type==="linePrefix"?z[2].sliceSerialize(z[1],!0).length:0,d=M,e.enter("codeFenced"),e.enter("codeFencedFence"),e.enter("codeFencedFenceSequence"),m(M)}function m(M){return M===d?(c++,e.consume(M),m):c<3?n(M):(e.exit("codeFencedFenceSequence"),ft(M)?vt(e,g,"whitespace")(M):g(M))}function g(M){return M===null||Fe(M)?(e.exit("codeFencedFence"),i.interrupt?t(M):e.check(K0,T,I)(M)):(e.enter("codeFencedFenceInfo"),e.enter("chunkString",{contentType:"string"}),y(M))}function y(M){return M===null||Fe(M)?(e.exit("chunkString"),e.exit("codeFencedFenceInfo"),g(M)):ft(M)?(e.exit("chunkString"),e.exit("codeFencedFenceInfo"),vt(e,v,"whitespace")(M)):M===96&&M===d?n(M):(e.consume(M),y)}function v(M){return M===null||Fe(M)?g(M):(e.enter("codeFencedFenceMeta"),e.enter("chunkString",{contentType:"string"}),_(M))}function _(M){return M===null||Fe(M)?(e.exit("chunkString"),e.exit("codeFencedFenceMeta"),g(M)):M===96&&M===d?n(M):(e.consume(M),_)}function T(M){return e.attempt(s,I,N)(M)}function N(M){return e.enter("lineEnding"),e.consume(M),e.exit("lineEnding"),C}function C(M){return l>0&&ft(M)?vt(e,P,"linePrefix",l+1)(M):P(M)}function P(M){return M===null||Fe(M)?e.check(K0,T,I)(M):(e.enter("codeFlowValue"),k(M))}function k(M){return M===null||Fe(M)?(e.exit("codeFlowValue"),P(M)):(e.consume(M),k)}function I(M){return e.exit("codeFenced"),t(M)}function D(M,z,Z){let W=0;return $;function $(V){return M.enter("lineEnding"),M.consume(V),M.exit("lineEnding"),re}function re(V){return M.enter("codeFencedFence"),ft(V)?vt(M,se,"linePrefix",i.parser.constructs.disable.null.includes("codeIndented")?void 0:4)(V):se(V)}function se(V){return V===d?(M.enter("codeFencedFenceSequence"),Se(V)):Z(V)}function Se(V){return V===d?(W++,M.consume(V),Se):W>=c?(M.exit("codeFencedFenceSequence"),ft(V)?vt(M,ue,"whitespace")(V):ue(V)):Z(V)}function ue(V){return V===null||Fe(V)?(M.exit("codeFencedFence"),z(V)):Z(V)}}}function g6(e,t,n){const i=this;return s;function s(c){return c===null?n(c):(e.enter("lineEnding"),e.consume(c),e.exit("lineEnding"),l)}function l(c){return i.parser.lazy[i.now().line]?n(c):t(c)}}const Yp={name:"codeIndented",tokenize:y6},b6={partial:!0,tokenize:v6};function y6(e,t,n){const i=this;return s;function s(p){return e.enter("codeIndented"),vt(e,l,"linePrefix",5)(p)}function l(p){const m=i.events[i.events.length-1];return m&&m[1].type==="linePrefix"&&m[2].sliceSerialize(m[1],!0).length>=4?c(p):n(p)}function c(p){return p===null?f(p):Fe(p)?e.attempt(b6,c,f)(p):(e.enter("codeFlowValue"),d(p))}function d(p){return p===null||Fe(p)?(e.exit("codeFlowValue"),c(p)):(e.consume(p),d)}function f(p){return e.exit("codeIndented"),t(p)}}function v6(e,t,n){const i=this;return s;function s(c){return i.parser.lazy[i.now().line]?n(c):Fe(c)?(e.enter("lineEnding"),e.consume(c),e.exit("lineEnding"),s):vt(e,l,"linePrefix",5)(c)}function l(c){const d=i.events[i.events.length-1];return d&&d[1].type==="linePrefix"&&d[2].sliceSerialize(d[1],!0).length>=4?t(c):Fe(c)?s(c):n(c)}}const _6={name:"codeText",previous:w6,resolve:x6,tokenize:E6};function x6(e){let t=e.length-4,n=3,i,s;if((e[n][1].type==="lineEnding"||e[n][1].type==="space")&&(e[t][1].type==="lineEnding"||e[t][1].type==="space")){for(i=n;++i<t;)if(e[i][1].type==="codeTextData"){e[n][1].type="codeTextPadding",e[t][1].type="codeTextPadding",n+=2,t-=2;break}}for(i=n-1,t++;++i<=t;)s===void 0?i!==t&&e[i][1].type!=="lineEnding"&&(s=i):(i===t||e[i][1].type==="lineEnding")&&(e[s][1].type="codeTextData",i!==s+2&&(e[s][1].end=e[i-1][1].end,e.splice(s+2,i-s-2),t-=i-s-2,i=s+2),s=void 0);return e}function w6(e){return e!==96||this.events[this.events.length-1][1].type==="characterEscape"}function E6(e,t,n){let i=0,s,l;return c;function c(g){return e.enter("codeText"),e.enter("codeTextSequence"),d(g)}function d(g){return g===96?(e.consume(g),i++,d):(e.exit("codeTextSequence"),f(g))}function f(g){return g===null?n(g):g===32?(e.enter("space"),e.consume(g),e.exit("space"),f):g===96?(l=e.enter("codeTextSequence"),s=0,m(g)):Fe(g)?(e.enter("lineEnding"),e.consume(g),e.exit("lineEnding"),f):(e.enter("codeTextData"),p(g))}function p(g){return g===null||g===32||g===96||Fe(g)?(e.exit("codeTextData"),f(g)):(e.consume(g),p)}function m(g){return g===96?(e.consume(g),s++,m):s===i?(e.exit("codeTextSequence"),e.exit("codeText"),t(g)):(l.type="codeTextData",p(g))}}class S6{constructor(t){this.left=t?[...t]:[],this.right=[]}get(t){if(t<0||t>=this.left.length+this.right.length)throw new RangeError("Cannot access index `"+t+"` in a splice buffer of size `"+(this.left.length+this.right.length)+"`");return t<this.left.length?this.left[t]:this.right[this.right.length-t+this.left.length-1]}get length(){return this.left.length+this.right.length}shift(){return this.setCursor(0),this.right.pop()}slice(t,n){const i=n??Number.POSITIVE_INFINITY;return i<this.left.length?this.left.slice(t,i):t>this.left.length?this.right.slice(this.right.length-i+this.left.length,this.right.length-t+this.left.length).reverse():this.left.slice(t).concat(this.right.slice(this.right.length-i+this.left.length).reverse())}splice(t,n,i){const s=n||0;this.setCursor(Math.trunc(t));const l=this.right.splice(this.right.length-s,Number.POSITIVE_INFINITY);return i&&Xl(this.left,i),l.reverse()}pop(){return this.setCursor(Number.POSITIVE_INFINITY),this.left.pop()}push(t){this.setCursor(Number.POSITIVE_INFINITY),this.left.push(t)}pushMany(t){this.setCursor(Number.POSITIVE_INFINITY),Xl(this.left,t)}unshift(t){this.setCursor(0),this.right.push(t)}unshiftMany(t){this.setCursor(0),Xl(this.right,t.reverse())}setCursor(t){if(!(t===this.left.length||t>this.left.length&&this.right.length===0||t<0&&this.left.length===0))if(t<this.left.length){const n=this.left.splice(t,Number.POSITIVE_INFINITY);Xl(this.right,n.reverse())}else{const n=this.right.splice(this.left.length+this.right.length-t,Number.POSITIVE_INFINITY);Xl(this.left,n.reverse())}}}function Xl(e,t){let n=0;if(t.length<1e4)e.push(...t);else for(;n<t.length;)e.push(...t.slice(n,n+1e4)),n+=1e4}function e1(e){const t={};let n=-1,i,s,l,c,d,f,p;const m=new S6(e);for(;++n<m.length;){for(;n in t;)n=t[n];if(i=m.get(n),n&&i[1].type==="chunkFlow"&&m.get(n-1)[1].type==="listItemPrefix"&&(f=i[1]._tokenizer.events,l=0,l<f.length&&f[l][1].type==="lineEndingBlank"&&(l+=2),l<f.length&&f[l][1].type==="content"))for(;++l<f.length&&f[l][1].type!=="content";)f[l][1].type==="chunkText"&&(f[l][1]._isInFirstContentOfListItem=!0,l++);if(i[0]==="enter")i[1].contentType&&(Object.assign(t,C6(m,n)),n=t[n],p=!0);else if(i[1]._container){for(l=n,s=void 0;l--;)if(c=m.get(l),c[1].type==="lineEnding"||c[1].type==="lineEndingBlank")c[0]==="enter"&&(s&&(m.get(s)[1].type="lineEndingBlank"),c[1].type="lineEnding",s=l);else if(!(c[1].type==="linePrefix"||c[1].type==="listItemIndent"))break;s&&(i[1].end={...m.get(s)[1].start},d=m.slice(s,n),d.unshift(i),m.splice(s,n-s+1,d))}}return dr(e,0,Number.POSITIVE_INFINITY,m.slice(0)),!p}function C6(e,t){const n=e.get(t)[1],i=e.get(t)[2];let s=t-1;const l=[];let c=n._tokenizer;c||(c=i.parser[n.contentType](n.start),n._contentTypeTextTrailing&&(c._contentTypeTextTrailing=!0));const d=c.events,f=[],p={};let m,g,y=-1,v=n,_=0,T=0;const N=[T];for(;v;){for(;e.get(++s)[1]!==v;);l.push(s),v._tokenizer||(m=i.sliceStream(v),v.next||m.push(null),g&&c.defineSkip(v.start),v._isInFirstContentOfListItem&&(c._gfmTasklistFirstContentOfListItem=!0),c.write(m),v._isInFirstContentOfListItem&&(c._gfmTasklistFirstContentOfListItem=void 0)),g=v,v=v.next}for(v=n;++y<d.length;)d[y][0]==="exit"&&d[y-1][0]==="enter"&&d[y][1].type===d[y-1][1].type&&d[y][1].start.line!==d[y][1].end.line&&(T=y+1,N.push(T),v._tokenizer=void 0,v.previous=void 0,v=v.next);for(c.events=[],v?(v._tokenizer=void 0,v.previous=void 0):N.pop(),y=N.length;y--;){const C=d.slice(N[y],N[y+1]),P=l.pop();f.push([P,P+C.length-1]),e.splice(P,2,C)}for(f.reverse(),y=-1;++y<f.length;)p[_+f[y][0]]=_+f[y][1],_+=f[y][1]-f[y][0]-1;return p}const T6={resolve:R6,tokenize:N6},O6={partial:!0,tokenize:A6};function R6(e){return e1(e),e}function N6(e,t){let n;return i;function i(d){return e.enter("content"),n=e.enter("chunkContent",{contentType:"content"}),s(d)}function s(d){return d===null?l(d):Fe(d)?e.check(O6,c,l)(d):(e.consume(d),s)}function l(d){return e.exit("chunkContent"),e.exit("content"),t(d)}function c(d){return e.consume(d),e.exit("chunkContent"),n.next=e.enter("chunkContent",{contentType:"content",previous:n}),n=n.next,s}}function A6(e,t,n){const i=this;return s;function s(c){return e.exit("chunkContent"),e.enter("lineEnding"),e.consume(c),e.exit("lineEnding"),vt(e,l,"linePrefix")}function l(c){if(c===null||Fe(c))return n(c);const d=i.events[i.events.length-1];return!i.parser.constructs.disable.null.includes("codeIndented")&&d&&d[1].type==="linePrefix"&&d[2].sliceSerialize(d[1],!0).length>=4?t(c):e.interrupt(i.parser.constructs.flow,n,t)(c)}}function t1(e,t,n,i,s,l,c,d,f){const p=f||Number.POSITIVE_INFINITY;let m=0;return g;function g(C){return C===60?(e.enter(i),e.enter(s),e.enter(l),e.consume(C),e.exit(l),y):C===null||C===32||C===41||zu(C)?n(C):(e.enter(i),e.enter(c),e.enter(d),e.enter("chunkString",{contentType:"string"}),T(C))}function y(C){return C===62?(e.enter(l),e.consume(C),e.exit(l),e.exit(s),e.exit(i),t):(e.enter(d),e.enter("chunkString",{contentType:"string"}),v(C))}function v(C){return C===62?(e.exit("chunkString"),e.exit(d),y(C)):C===null||C===60||Fe(C)?n(C):(e.consume(C),C===92?_:v)}function _(C){return C===60||C===62||C===92?(e.consume(C),v):v(C)}function T(C){return!m&&(C===null||C===41||zt(C))?(e.exit("chunkString"),e.exit(d),e.exit(c),e.exit(i),t(C)):m<p&&C===40?(e.consume(C),m++,T):C===41?(e.consume(C),m--,T):C===null||C===32||C===40||zu(C)?n(C):(e.consume(C),C===92?N:T)}function N(C){return C===40||C===41||C===92?(e.consume(C),T):T(C)}}function n1(e,t,n,i,s,l){const c=this;let d=0,f;return p;function p(v){return e.enter(i),e.enter(s),e.consume(v),e.exit(s),e.enter(l),m}function m(v){return d>999||v===null||v===91||v===93&&!f||v===94&&!d&&"_hiddenFootnoteSupport"in c.parser.constructs?n(v):v===93?(e.exit(l),e.enter(s),e.consume(v),e.exit(s),e.exit(i),t):Fe(v)?(e.enter("lineEnding"),e.consume(v),e.exit("lineEnding"),m):(e.enter("chunkString",{contentType:"string"}),g(v))}function g(v){return v===null||v===91||v===93||Fe(v)||d++>999?(e.exit("chunkString"),m(v)):(e.consume(v),f||(f=!ft(v)),v===92?y:g)}function y(v){return v===91||v===92||v===93?(e.consume(v),d++,g):g(v)}}function r1(e,t,n,i,s,l){let c;return d;function d(y){return y===34||y===39||y===40?(e.enter(i),e.enter(s),e.consume(y),e.exit(s),c=y===40?41:y,f):n(y)}function f(y){return y===c?(e.enter(s),e.consume(y),e.exit(s),e.exit(i),t):(e.enter(l),p(y))}function p(y){return y===c?(e.exit(l),f(c)):y===null?n(y):Fe(y)?(e.enter("lineEnding"),e.consume(y),e.exit("lineEnding"),vt(e,p,"linePrefix")):(e.enter("chunkString",{contentType:"string"}),m(y))}function m(y){return y===c||y===null||Fe(y)?(e.exit("chunkString"),p(y)):(e.consume(y),y===92?g:m)}function g(y){return y===c||y===92?(e.consume(y),m):m(y)}}function lo(e,t){let n;return i;function i(s){return Fe(s)?(e.enter("lineEnding"),e.consume(s),e.exit("lineEnding"),n=!0,i):ft(s)?vt(e,i,n?"linePrefix":"lineSuffix")(s):t(s)}}const D6={name:"definition",tokenize:M6},k6={partial:!0,tokenize:P6};function M6(e,t,n){const i=this;let s;return l;function l(v){return e.enter("definition"),c(v)}function c(v){return n1.call(i,e,d,n,"definitionLabel","definitionLabelMarker","definitionLabelString")(v)}function d(v){return s=jr(i.sliceSerialize(i.events[i.events.length-1][1]).slice(1,-1)),v===58?(e.enter("definitionMarker"),e.consume(v),e.exit("definitionMarker"),f):n(v)}function f(v){return zt(v)?lo(e,p)(v):p(v)}function p(v){return t1(e,m,n,"definitionDestination","definitionDestinationLiteral","definitionDestinationLiteralMarker","definitionDestinationRaw","definitionDestinationString")(v)}function m(v){return e.attempt(k6,g,g)(v)}function g(v){return ft(v)?vt(e,y,"whitespace")(v):y(v)}function y(v){return v===null||Fe(v)?(e.exit("definition"),i.parser.defined.push(s),t(v)):n(v)}}function P6(e,t,n){return i;function i(d){return zt(d)?lo(e,s)(d):n(d)}function s(d){return r1(e,l,n,"definitionTitle","definitionTitleMarker","definitionTitleString")(d)}function l(d){return ft(d)?vt(e,c,"whitespace")(d):c(d)}function c(d){return d===null||Fe(d)?t(d):n(d)}}const I6={name:"hardBreakEscape",tokenize:L6};function L6(e,t,n){return i;function i(l){return e.enter("hardBreakEscape"),e.consume(l),s}function s(l){return Fe(l)?(e.exit("hardBreakEscape"),t(l)):n(l)}}const j6={name:"headingAtx",resolve:$6,tokenize:z6};function $6(e,t){let n=e.length-2,i=3,s,l;return e[i][1].type==="whitespace"&&(i+=2),n-2>i&&e[n][1].type==="whitespace"&&(n-=2),e[n][1].type==="atxHeadingSequence"&&(i===n-1||n-4>i&&e[n-2][1].type==="whitespace")&&(n-=i+1===n?2:4),n>i&&(s={type:"atxHeadingText",start:e[i][1].start,end:e[n][1].end},l={type:"chunkText",start:e[i][1].start,end:e[n][1].end,contentType:"text"},dr(e,i,n-i+1,[["enter",s,t],["enter",l,t],["exit",l,t],["exit",s,t]])),e}function z6(e,t,n){let i=0;return s;function s(m){return e.enter("atxHeading"),l(m)}function l(m){return e.enter("atxHeadingSequence"),c(m)}function c(m){return m===35&&i++<6?(e.consume(m),c):m===null||zt(m)?(e.exit("atxHeadingSequence"),d(m)):n(m)}function d(m){return m===35?(e.enter("atxHeadingSequence"),f(m)):m===null||Fe(m)?(e.exit("atxHeading"),t(m)):ft(m)?vt(e,d,"whitespace")(m):(e.enter("atxHeadingText"),p(m))}function f(m){return m===35?(e.consume(m),f):(e.exit("atxHeadingSequence"),d(m))}function p(m){return m===null||m===35||zt(m)?(e.exit("atxHeadingText"),d(m)):(e.consume(m),p)}}const B6=["address","article","aside","base","basefont","blockquote","body","caption","center","col","colgroup","dd","details","dialog","dir","div","dl","dt","fieldset","figcaption","figure","footer","form","frame","frameset","h1","h2","h3","h4","h5","h6","head","header","hr","html","iframe","legend","li","link","main","menu","menuitem","nav","noframes","ol","optgroup","option","p","param","search","section","summary","table","tbody","td","tfoot","th","thead","title","tr","track","ul"],X0=["pre","script","style","textarea"],F6={concrete:!0,name:"htmlFlow",resolveTo:q6,tokenize:G6},U6={partial:!0,tokenize:K6},H6={partial:!0,tokenize:V6};function q6(e){let t=e.length;for(;t--&&!(e[t][0]==="enter"&&e[t][1].type==="htmlFlow"););return t>1&&e[t-2][1].type==="linePrefix"&&(e[t][1].start=e[t-2][1].start,e[t+1][1].start=e[t-2][1].start,e.splice(t-2,2)),e}function G6(e,t,n){const i=this;let s,l,c,d,f;return p;function p(R){return m(R)}function m(R){return e.enter("htmlFlow"),e.enter("htmlFlowData"),e.consume(R),g}function g(R){return R===33?(e.consume(R),y):R===47?(e.consume(R),l=!0,T):R===63?(e.consume(R),s=3,i.interrupt?t:x):jn(R)?(e.consume(R),c=String.fromCharCode(R),N):n(R)}function y(R){return R===45?(e.consume(R),s=2,v):R===91?(e.consume(R),s=5,d=0,_):jn(R)?(e.consume(R),s=4,i.interrupt?t:x):n(R)}function v(R){return R===45?(e.consume(R),i.interrupt?t:x):n(R)}function _(R){const fe="CDATA[";return R===fe.charCodeAt(d++)?(e.consume(R),d===fe.length?i.interrupt?t:se:_):n(R)}function T(R){return jn(R)?(e.consume(R),c=String.fromCharCode(R),N):n(R)}function N(R){if(R===null||R===47||R===62||zt(R)){const fe=R===47,we=c.toLowerCase();return!fe&&!l&&X0.includes(we)?(s=1,i.interrupt?t(R):se(R)):B6.includes(c.toLowerCase())?(s=6,fe?(e.consume(R),C):i.interrupt?t(R):se(R)):(s=7,i.interrupt&&!i.parser.lazy[i.now().line]?n(R):l?P(R):k(R))}return R===45||Dn(R)?(e.consume(R),c+=String.fromCharCode(R),N):n(R)}function C(R){return R===62?(e.consume(R),i.interrupt?t:se):n(R)}function P(R){return ft(R)?(e.consume(R),P):$(R)}function k(R){return R===47?(e.consume(R),$):R===58||R===95||jn(R)?(e.consume(R),I):ft(R)?(e.consume(R),k):$(R)}function I(R){return R===45||R===46||R===58||R===95||Dn(R)?(e.consume(R),I):D(R)}function D(R){return R===61?(e.consume(R),M):ft(R)?(e.consume(R),D):k(R)}function M(R){return R===null||R===60||R===61||R===62||R===96?n(R):R===34||R===39?(e.consume(R),f=R,z):ft(R)?(e.consume(R),M):Z(R)}function z(R){return R===f?(e.consume(R),f=null,W):R===null||Fe(R)?n(R):(e.consume(R),z)}function Z(R){return R===null||R===34||R===39||R===47||R===60||R===61||R===62||R===96||zt(R)?D(R):(e.consume(R),Z)}function W(R){return R===47||R===62||ft(R)?k(R):n(R)}function $(R){return R===62?(e.consume(R),re):n(R)}function re(R){return R===null||Fe(R)?se(R):ft(R)?(e.consume(R),re):n(R)}function se(R){return R===45&&s===2?(e.consume(R),B):R===60&&s===1?(e.consume(R),ee):R===62&&s===4?(e.consume(R),q):R===63&&s===3?(e.consume(R),x):R===93&&s===5?(e.consume(R),pe):Fe(R)&&(s===6||s===7)?(e.exit("htmlFlowData"),e.check(U6,U,Se)(R)):R===null||Fe(R)?(e.exit("htmlFlowData"),Se(R)):(e.consume(R),se)}function Se(R){return e.check(H6,ue,U)(R)}function ue(R){return e.enter("lineEnding"),e.consume(R),e.exit("lineEnding"),V}function V(R){return R===null||Fe(R)?Se(R):(e.enter("htmlFlowData"),se(R))}function B(R){return R===45?(e.consume(R),x):se(R)}function ee(R){return R===47?(e.consume(R),c="",X):se(R)}function X(R){if(R===62){const fe=c.toLowerCase();return X0.includes(fe)?(e.consume(R),q):se(R)}return jn(R)&&c.length<8?(e.consume(R),c+=String.fromCharCode(R),X):se(R)}function pe(R){return R===93?(e.consume(R),x):se(R)}function x(R){return R===62?(e.consume(R),q):R===45&&s===2?(e.consume(R),x):se(R)}function q(R){return R===null||Fe(R)?(e.exit("htmlFlowData"),U(R)):(e.consume(R),q)}function U(R){return e.exit("htmlFlow"),t(R)}}function V6(e,t,n){const i=this;return s;function s(c){return Fe(c)?(e.enter("lineEnding"),e.consume(c),e.exit("lineEnding"),l):n(c)}function l(c){return i.parser.lazy[i.now().line]?n(c):t(c)}}function K6(e,t,n){return i;function i(s){return e.enter("lineEnding"),e.consume(s),e.exit("lineEnding"),e.attempt(To,t,n)}}const Y6={name:"htmlText",tokenize:X6};function X6(e,t,n){const i=this;let s,l,c;return d;function d(x){return e.enter("htmlText"),e.enter("htmlTextData"),e.consume(x),f}function f(x){return x===33?(e.consume(x),p):x===47?(e.consume(x),D):x===63?(e.consume(x),k):jn(x)?(e.consume(x),Z):n(x)}function p(x){return x===45?(e.consume(x),m):x===91?(e.consume(x),l=0,_):jn(x)?(e.consume(x),P):n(x)}function m(x){return x===45?(e.consume(x),v):n(x)}function g(x){return x===null?n(x):x===45?(e.consume(x),y):Fe(x)?(c=g,ee(x)):(e.consume(x),g)}function y(x){return x===45?(e.consume(x),v):g(x)}function v(x){return x===62?B(x):x===45?y(x):g(x)}function _(x){const q="CDATA[";return x===q.charCodeAt(l++)?(e.consume(x),l===q.length?T:_):n(x)}function T(x){return x===null?n(x):x===93?(e.consume(x),N):Fe(x)?(c=T,ee(x)):(e.consume(x),T)}function N(x){return x===93?(e.consume(x),C):T(x)}function C(x){return x===62?B(x):x===93?(e.consume(x),C):T(x)}function P(x){return x===null||x===62?B(x):Fe(x)?(c=P,ee(x)):(e.consume(x),P)}function k(x){return x===null?n(x):x===63?(e.consume(x),I):Fe(x)?(c=k,ee(x)):(e.consume(x),k)}function I(x){return x===62?B(x):k(x)}function D(x){return jn(x)?(e.consume(x),M):n(x)}function M(x){return x===45||Dn(x)?(e.consume(x),M):z(x)}function z(x){return Fe(x)?(c=z,ee(x)):ft(x)?(e.consume(x),z):B(x)}function Z(x){return x===45||Dn(x)?(e.consume(x),Z):x===47||x===62||zt(x)?W(x):n(x)}function W(x){return x===47?(e.consume(x),B):x===58||x===95||jn(x)?(e.consume(x),$):Fe(x)?(c=W,ee(x)):ft(x)?(e.consume(x),W):B(x)}function $(x){return x===45||x===46||x===58||x===95||Dn(x)?(e.consume(x),$):re(x)}function re(x){return x===61?(e.consume(x),se):Fe(x)?(c=re,ee(x)):ft(x)?(e.consume(x),re):W(x)}function se(x){return x===null||x===60||x===61||x===62||x===96?n(x):x===34||x===39?(e.consume(x),s=x,Se):Fe(x)?(c=se,ee(x)):ft(x)?(e.consume(x),se):(e.consume(x),ue)}function Se(x){return x===s?(e.consume(x),s=void 0,V):x===null?n(x):Fe(x)?(c=Se,ee(x)):(e.consume(x),Se)}function ue(x){return x===null||x===34||x===39||x===60||x===61||x===96?n(x):x===47||x===62||zt(x)?W(x):(e.consume(x),ue)}function V(x){return x===47||x===62||zt(x)?W(x):n(x)}function B(x){return x===62?(e.consume(x),e.exit("htmlTextData"),e.exit("htmlText"),t):n(x)}function ee(x){return e.exit("htmlTextData"),e.enter("lineEnding"),e.consume(x),e.exit("lineEnding"),X}function X(x){return ft(x)?vt(e,pe,"linePrefix",i.parser.constructs.disable.null.includes("codeIndented")?void 0:4)(x):pe(x)}function pe(x){return e.enter("htmlTextData"),c(x)}}const Pb={name:"labelEnd",resolveAll:J6,resolveTo:e5,tokenize:t5},W6={tokenize:n5},Z6={tokenize:r5},Q6={tokenize:i5};function J6(e){let t=-1;const n=[];for(;++t<e.length;){const i=e[t][1];if(n.push(e[t]),i.type==="labelImage"||i.type==="labelLink"||i.type==="labelEnd"){const s=i.type==="labelImage"?4:2;i.type="data",t+=s}}return e.length!==n.length&&dr(e,0,e.length,n),e}function e5(e,t){let n=e.length,i=0,s,l,c,d;for(;n--;)if(s=e[n][1],l){if(s.type==="link"||s.type==="labelLink"&&s._inactive)break;e[n][0]==="enter"&&s.type==="labelLink"&&(s._inactive=!0)}else if(c){if(e[n][0]==="enter"&&(s.type==="labelImage"||s.type==="labelLink")&&!s._balanced&&(l=n,s.type!=="labelLink")){i=2;break}}else s.type==="labelEnd"&&(c=n);const f={type:e[l][1].type==="labelLink"?"link":"image",start:{...e[l][1].start},end:{...e[e.length-1][1].end}},p={type:"label",start:{...e[l][1].start},end:{...e[c][1].end}},m={type:"labelText",start:{...e[l+i+2][1].end},end:{...e[c-2][1].start}};return d=[["enter",f,t],["enter",p,t]],d=Tr(d,e.slice(l+1,l+i+3)),d=Tr(d,[["enter",m,t]]),d=Tr(d,pd(t.parser.constructs.insideSpan.null,e.slice(l+i+4,c-3),t)),d=Tr(d,[["exit",m,t],e[c-2],e[c-1],["exit",p,t]]),d=Tr(d,e.slice(c+1)),d=Tr(d,[["exit",f,t]]),dr(e,l,e.length,d),e}function t5(e,t,n){const i=this;let s=i.events.length,l,c;for(;s--;)if((i.events[s][1].type==="labelImage"||i.events[s][1].type==="labelLink")&&!i.events[s][1]._balanced){l=i.events[s][1];break}return d;function d(y){return l?l._inactive?g(y):(c=i.parser.defined.includes(jr(i.sliceSerialize({start:l.end,end:i.now()}))),e.enter("labelEnd"),e.enter("labelMarker"),e.consume(y),e.exit("labelMarker"),e.exit("labelEnd"),f):n(y)}function f(y){return y===40?e.attempt(W6,m,c?m:g)(y):y===91?e.attempt(Z6,m,c?p:g)(y):c?m(y):g(y)}function p(y){return e.attempt(Q6,m,g)(y)}function m(y){return t(y)}function g(y){return l._balanced=!0,n(y)}}function n5(e,t,n){return i;function i(g){return e.enter("resource"),e.enter("resourceMarker"),e.consume(g),e.exit("resourceMarker"),s}function s(g){return zt(g)?lo(e,l)(g):l(g)}function l(g){return g===41?m(g):t1(e,c,d,"resourceDestination","resourceDestinationLiteral","resourceDestinationLiteralMarker","resourceDestinationRaw","resourceDestinationString",32)(g)}function c(g){return zt(g)?lo(e,f)(g):m(g)}function d(g){return n(g)}function f(g){return g===34||g===39||g===40?r1(e,p,n,"resourceTitle","resourceTitleMarker","resourceTitleString")(g):m(g)}function p(g){return zt(g)?lo(e,m)(g):m(g)}function m(g){return g===41?(e.enter("resourceMarker"),e.consume(g),e.exit("resourceMarker"),e.exit("resource"),t):n(g)}}function r5(e,t,n){const i=this;return s;function s(d){return n1.call(i,e,l,c,"reference","referenceMarker","referenceString")(d)}function l(d){return i.parser.defined.includes(jr(i.sliceSerialize(i.events[i.events.length-1][1]).slice(1,-1)))?t(d):n(d)}function c(d){return n(d)}}function i5(e,t,n){return i;function i(l){return e.enter("reference"),e.enter("referenceMarker"),e.consume(l),e.exit("referenceMarker"),s}function s(l){return l===93?(e.enter("referenceMarker"),e.consume(l),e.exit("referenceMarker"),e.exit("reference"),t):n(l)}}const a5={name:"labelStartImage",resolveAll:Pb.resolveAll,tokenize:s5};function s5(e,t,n){const i=this;return s;function s(d){return e.enter("labelImage"),e.enter("labelImageMarker"),e.consume(d),e.exit("labelImageMarker"),l}function l(d){return d===91?(e.enter("labelMarker"),e.consume(d),e.exit("labelMarker"),e.exit("labelImage"),c):n(d)}function c(d){return d===94&&"_hiddenFootnoteSupport"in i.parser.constructs?n(d):t(d)}}const l5={name:"labelStartLink",resolveAll:Pb.resolveAll,tokenize:o5};function o5(e,t,n){const i=this;return s;function s(c){return e.enter("labelLink"),e.enter("labelMarker"),e.consume(c),e.exit("labelMarker"),e.exit("labelLink"),l}function l(c){return c===94&&"_hiddenFootnoteSupport"in i.parser.constructs?n(c):t(c)}}const Xp={name:"lineEnding",tokenize:c5};function c5(e,t){return n;function n(i){return e.enter("lineEnding"),e.consume(i),e.exit("lineEnding"),vt(e,t,"linePrefix")}}const fu={name:"thematicBreak",tokenize:u5};function u5(e,t,n){let i=0,s;return l;function l(p){return e.enter("thematicBreak"),c(p)}function c(p){return s=p,d(p)}function d(p){return p===s?(e.enter("thematicBreakSequence"),f(p)):i>=3&&(p===null||Fe(p))?(e.exit("thematicBreak"),t(p)):n(p)}function f(p){return p===s?(e.consume(p),i++,f):(e.exit("thematicBreakSequence"),ft(p)?vt(e,d,"whitespace")(p):d(p))}}const Xn={continuation:{tokenize:h5},exit:g5,name:"list",tokenize:p5},d5={partial:!0,tokenize:b5},f5={partial:!0,tokenize:m5};function p5(e,t,n){const i=this,s=i.events[i.events.length-1];let l=s&&s[1].type==="linePrefix"?s[2].sliceSerialize(s[1],!0).length:0,c=0;return d;function d(v){const _=i.containerState.type||(v===42||v===43||v===45?"listUnordered":"listOrdered");if(_==="listUnordered"?!i.containerState.marker||v===i.containerState.marker:Lg(v)){if(i.containerState.type||(i.containerState.type=_,e.enter(_,{_container:!0})),_==="listUnordered")return e.enter("listItemPrefix"),v===42||v===45?e.check(fu,n,p)(v):p(v);if(!i.interrupt||v===49)return e.enter("listItemPrefix"),e.enter("listItemValue"),f(v)}return n(v)}function f(v){return Lg(v)&&++c<10?(e.consume(v),f):(!i.interrupt||c<2)&&(i.containerState.marker?v===i.containerState.marker:v===41||v===46)?(e.exit("listItemValue"),p(v)):n(v)}function p(v){return e.enter("listItemMarker"),e.consume(v),e.exit("listItemMarker"),i.containerState.marker=i.containerState.marker||v,e.check(To,i.interrupt?n:m,e.attempt(d5,y,g))}function m(v){return i.containerState.initialBlankLine=!0,l++,y(v)}function g(v){return ft(v)?(e.enter("listItemPrefixWhitespace"),e.consume(v),e.exit("listItemPrefixWhitespace"),y):n(v)}function y(v){return i.containerState.size=l+i.sliceSerialize(e.exit("listItemPrefix"),!0).length,t(v)}}function h5(e,t,n){const i=this;return i.containerState._closeFlow=void 0,e.check(To,s,l);function s(d){return i.containerState.furtherBlankLines=i.containerState.furtherBlankLines||i.containerState.initialBlankLine,vt(e,t,"listItemIndent",i.containerState.size+1)(d)}function l(d){return i.containerState.furtherBlankLines||!ft(d)?(i.containerState.furtherBlankLines=void 0,i.containerState.initialBlankLine=void 0,c(d)):(i.containerState.furtherBlankLines=void 0,i.containerState.initialBlankLine=void 0,e.attempt(f5,t,c)(d))}function c(d){return i.containerState._closeFlow=!0,i.interrupt=void 0,vt(e,e.attempt(Xn,t,n),"linePrefix",i.parser.constructs.disable.null.includes("codeIndented")?void 0:4)(d)}}function m5(e,t,n){const i=this;return vt(e,s,"listItemIndent",i.containerState.size+1);function s(l){const c=i.events[i.events.length-1];return c&&c[1].type==="listItemIndent"&&c[2].sliceSerialize(c[1],!0).length===i.containerState.size?t(l):n(l)}}function g5(e){e.exit(this.containerState.type)}function b5(e,t,n){const i=this;return vt(e,s,"listItemPrefixWhitespace",i.parser.constructs.disable.null.includes("codeIndented")?void 0:5);function s(l){const c=i.events[i.events.length-1];return!ft(l)&&c&&c[1].type==="listItemPrefixWhitespace"?t(l):n(l)}}const W0={name:"setextUnderline",resolveTo:y5,tokenize:v5};function y5(e,t){let n=e.length,i,s,l;for(;n--;)if(e[n][0]==="enter"){if(e[n][1].type==="content"){i=n;break}e[n][1].type==="paragraph"&&(s=n)}else e[n][1].type==="content"&&e.splice(n,1),!l&&e[n][1].type==="definition"&&(l=n);const c={type:"setextHeading",start:{...e[i][1].start},end:{...e[e.length-1][1].end}};return e[s][1].type="setextHeadingText",l?(e.splice(s,0,["enter",c,t]),e.splice(l+1,0,["exit",e[i][1],t]),e[i][1].end={...e[l][1].end}):e[i][1]=c,e.push(["exit",c,t]),e}function v5(e,t,n){const i=this;let s;return l;function l(p){let m=i.events.length,g;for(;m--;)if(i.events[m][1].type!=="lineEnding"&&i.events[m][1].type!=="linePrefix"&&i.events[m][1].type!=="content"){g=i.events[m][1].type==="paragraph";break}return!i.parser.lazy[i.now().line]&&(i.interrupt||g)?(e.enter("setextHeadingLine"),s=p,c(p)):n(p)}function c(p){return e.enter("setextHeadingLineSequence"),d(p)}function d(p){return p===s?(e.consume(p),d):(e.exit("setextHeadingLineSequence"),ft(p)?vt(e,f,"lineSuffix")(p):f(p))}function f(p){return p===null||Fe(p)?(e.exit("setextHeadingLine"),t(p)):n(p)}}const _5={tokenize:x5};function x5(e){const t=this,n=e.attempt(To,i,e.attempt(this.parser.constructs.flowInitial,s,vt(e,e.attempt(this.parser.constructs.flow,s,e.attempt(T6,s)),"linePrefix")));return n;function i(l){if(l===null){e.consume(l);return}return e.enter("lineEndingBlank"),e.consume(l),e.exit("lineEndingBlank"),t.currentConstruct=void 0,n}function s(l){if(l===null){e.consume(l);return}return e.enter("lineEnding"),e.consume(l),e.exit("lineEnding"),t.currentConstruct=void 0,n}}const w5={resolveAll:a1()},E5=i1("string"),S5=i1("text");function i1(e){return{resolveAll:a1(e==="text"?C5:void 0),tokenize:t};function t(n){const i=this,s=this.parser.constructs[e],l=n.attempt(s,c,d);return c;function c(m){return p(m)?l(m):d(m)}function d(m){if(m===null){n.consume(m);return}return n.enter("data"),n.consume(m),f}function f(m){return p(m)?(n.exit("data"),l(m)):(n.consume(m),f)}function p(m){if(m===null)return!0;const g=s[m];let y=-1;if(g)for(;++y<g.length;){const v=g[y];if(!v.previous||v.previous.call(i,i.previous))return!0}return!1}}}function a1(e){return t;function t(n,i){let s=-1,l;for(;++s<=n.length;)l===void 0?n[s]&&n[s][1].type==="data"&&(l=s,s++):(!n[s]||n[s][1].type!=="data")&&(s!==l+2&&(n[l][1].end=n[s-1][1].end,n.splice(l+2,s-l-2),s=l+2),l=void 0);return e?e(n,i):n}}function C5(e,t){let n=0;for(;++n<=e.length;)if((n===e.length||e[n][1].type==="lineEnding")&&e[n-1][1].type==="data"){const i=e[n-1][1],s=t.sliceStream(i);let l=s.length,c=-1,d=0,f;for(;l--;){const p=s[l];if(typeof p=="string"){for(c=p.length;p.charCodeAt(c-1)===32;)d++,c--;if(c)break;c=-1}else if(p===-2)f=!0,d++;else if(p!==-1){l++;break}}if(t._contentTypeTextTrailing&&n===e.length&&(d=0),d){const p={type:n===e.length||f||d<2?"lineSuffix":"hardBreakTrailing",start:{_bufferIndex:l?c:i.start._bufferIndex+c,_index:i.start._index+l,line:i.end.line,column:i.end.column-d,offset:i.end.offset-d},end:{...i.end}};i.end={...p.start},i.start.offset===i.end.offset?Object.assign(i,p):(e.splice(n,0,["enter",p,t],["exit",p,t]),n+=2)}n++}return e}const T5={42:Xn,43:Xn,45:Xn,48:Xn,49:Xn,50:Xn,51:Xn,52:Xn,53:Xn,54:Xn,55:Xn,56:Xn,57:Xn,62:ZS},O5={91:D6},R5={[-2]:Yp,[-1]:Yp,32:Yp},N5={35:j6,42:fu,45:[W0,fu],60:F6,61:W0,95:fu,96:Y0,126:Y0},A5={38:JS,92:QS},D5={[-5]:Xp,[-4]:Xp,[-3]:Xp,33:a5,38:JS,42:jg,60:[l6,Y6],91:l5,92:[I6,QS],93:Pb,95:jg,96:_6},k5={null:[jg,w5]},M5={null:[42,95]},P5={null:[]},I5=Object.freeze(Object.defineProperty({__proto__:null,attentionMarkers:M5,contentInitial:O5,disable:P5,document:T5,flow:N5,flowInitial:R5,insideSpan:k5,string:A5,text:D5},Symbol.toStringTag,{value:"Module"}));function L5(e,t,n){let i={_bufferIndex:-1,_index:0,line:n&&n.line||1,column:n&&n.column||1,offset:n&&n.offset||0};const s={},l=[];let c=[],d=[];const f={attempt:z(D),check:z(M),consume:P,enter:k,exit:I,interrupt:z(M,{interrupt:!0})},p={code:null,containerState:{},defineSkip:T,events:[],now:_,parser:e,previous:null,sliceSerialize:y,sliceStream:v,write:g};let m=t.tokenize.call(p,f);return t.resolveAll&&l.push(t),p;function g(re){return c=Tr(c,re),N(),c[c.length-1]!==null?[]:(Z(t,0),p.events=pd(l,p.events,p),p.events)}function y(re,se){return $5(v(re),se)}function v(re){return j5(c,re)}function _(){const{_bufferIndex:re,_index:se,line:Se,column:ue,offset:V}=i;return{_bufferIndex:re,_index:se,line:Se,column:ue,offset:V}}function T(re){s[re.line]=re.column,$()}function N(){let re;for(;i._index<c.length;){const se=c[i._index];if(typeof se=="string")for(re=i._index,i._bufferIndex<0&&(i._bufferIndex=0);i._index===re&&i._bufferIndex<se.length;)C(se.charCodeAt(i._bufferIndex));else C(se)}}function C(re){m=m(re)}function P(re){Fe(re)?(i.line++,i.column=1,i.offset+=re===-3?2:1,$()):re!==-1&&(i.column++,i.offset++),i._bufferIndex<0?i._index++:(i._bufferIndex++,i._bufferIndex===c[i._index].length&&(i._bufferIndex=-1,i._index++)),p.previous=re}function k(re,se){const Se=se||{};return Se.type=re,Se.start=_(),p.events.push(["enter",Se,p]),d.push(Se),Se}function I(re){const se=d.pop();return se.end=_(),p.events.push(["exit",se,p]),se}function D(re,se){Z(re,se.from)}function M(re,se){se.restore()}function z(re,se){return Se;function Se(ue,V,B){let ee,X,pe,x;return Array.isArray(ue)?U(ue):"tokenize"in ue?U([ue]):q(ue);function q(be){return ke;function ke(Me){const at=Me!==null&&be[Me],$e=Me!==null&&be.null,ie=[...Array.isArray(at)?at:at?[at]:[],...Array.isArray($e)?$e:$e?[$e]:[]];return U(ie)(Me)}}function U(be){return ee=be,X=0,be.length===0?B:R(be[X])}function R(be){return ke;function ke(Me){return x=W(),pe=be,be.partial||(p.currentConstruct=be),be.name&&p.parser.constructs.disable.null.includes(be.name)?we():be.tokenize.call(se?Object.assign(Object.create(p),se):p,f,fe,we)(Me)}}function fe(be){return re(pe,x),V}function we(be){return x.restore(),++X<ee.length?R(ee[X]):B}}}function Z(re,se){re.resolveAll&&!l.includes(re)&&l.push(re),re.resolve&&dr(p.events,se,p.events.length-se,re.resolve(p.events.slice(se),p)),re.resolveTo&&(p.events=re.resolveTo(p.events,p))}function W(){const re=_(),se=p.previous,Se=p.currentConstruct,ue=p.events.length,V=Array.from(d);return{from:ue,restore:B};function B(){i=re,p.previous=se,p.currentConstruct=Se,p.events.length=ue,d=V,$()}}function $(){i.line in s&&i.column<2&&(i.column=s[i.line],i.offset+=s[i.line]-1)}}function j5(e,t){const n=t.start._index,i=t.start._bufferIndex,s=t.end._index,l=t.end._bufferIndex;let c;if(n===s)c=[e[n].slice(i,l)];else{if(c=e.slice(n,s),i>-1){const d=c[0];typeof d=="string"?c[0]=d.slice(i):c.shift()}l>0&&c.push(e[s].slice(0,l))}return c}function $5(e,t){let n=-1;const i=[];let s;for(;++n<e.length;){const l=e[n];let c;if(typeof l=="string")c=l;else switch(l){case-5:{c="\r";break}case-4:{c=`
`;break}case-3:{c=`\r
`;break}case-2:{c=t?" ":"	";break}case-1:{if(!t&&s)continue;c=" ";break}default:c=String.fromCharCode(l)}s=l===-2,i.push(c)}return i.join("")}function z5(e){const i={constructs:XS([I5,...(e||{}).extensions||[]]),content:s(e6),defined:[],document:s(n6),flow:s(_5),lazy:{},string:s(E5),text:s(S5)};return i;function s(l){return c;function c(d){return L5(i,l,d)}}}function B5(e){for(;!e1(e););return e}const Z0=/[\0\t\n\r]/g;function F5(){let e=1,t="",n=!0,i;return s;function s(l,c,d){const f=[];let p,m,g,y,v;for(l=t+(typeof l=="string"?l.toString():new TextDecoder(c||void 0).decode(l)),g=0,t="",n&&(l.charCodeAt(0)===65279&&g++,n=void 0);g<l.length;){if(Z0.lastIndex=g,p=Z0.exec(l),y=p&&p.index!==void 0?p.index:l.length,v=l.charCodeAt(y),!p){t=l.slice(g);break}if(v===10&&g===y&&i)f.push(-3),i=void 0;else switch(i&&(f.push(-5),i=void 0),g<y&&(f.push(l.slice(g,y)),e+=y-g),v){case 0:{f.push(65533),e++;break}case 9:{for(m=Math.ceil(e/4)*4,f.push(-2);e++<m;)f.push(-1);break}case 10:{f.push(-4),e=1;break}default:i=!0,e=1}g=y+1}return d&&(i&&f.push(-5),t&&f.push(t),f.push(null)),f}}const U5=/\\([!-/:-@[-`{-~])|&(#(?:\d{1,7}|x[\da-f]{1,6})|[\da-z]{1,31});/gi;function H5(e){return e.replace(U5,q5)}function q5(e,t,n){if(t)return t;if(n.charCodeAt(0)===35){const s=n.charCodeAt(1),l=s===120||s===88;return WS(n.slice(l?2:1),l?16:10)}return Mb(n)||e}const s1={}.hasOwnProperty;function G5(e,t,n){return t&&typeof t=="object"&&(n=t,t=void 0),V5(n)(B5(z5(n).document().write(F5()(e,t,!0))))}function V5(e){const t={transforms:[],canContainEols:["emphasis","fragment","heading","paragraph","strong"],enter:{autolink:l(Ut),autolinkProtocol:W,autolinkEmail:W,atxHeading:l(Tt),blockQuote:l($e),characterEscape:W,characterReference:W,codeFenced:l(ie),codeFencedFenceInfo:c,codeFencedFenceMeta:c,codeIndented:l(ie,c),codeText:l(ze,c),codeTextData:W,data:W,codeFlowValue:W,definition:l(st),definitionDestinationString:c,definitionLabelString:c,definitionTitleString:c,emphasis:l(lt),hardBreakEscape:l(Be),hardBreakTrailing:l(Be),htmlFlow:l(_t,c),htmlFlowData:W,htmlText:l(_t,c),htmlTextData:W,image:l(Ve),label:c,link:l(Ut),listItem:l(Et),listItemValue:y,listOrdered:l(Zt,g),listUnordered:l(Zt),paragraph:l(Bn),reference:R,referenceString:c,resourceDestinationString:c,resourceTitleString:c,setextHeading:l(Tt),strong:l(hr),thematicBreak:l(Ci)},exit:{atxHeading:f(),atxHeadingSequence:D,autolink:f(),autolinkEmail:at,autolinkProtocol:Me,blockQuote:f(),characterEscapeValue:$,characterReferenceMarkerHexadecimal:we,characterReferenceMarkerNumeric:we,characterReferenceValue:be,characterReference:ke,codeFenced:f(N),codeFencedFence:T,codeFencedFenceInfo:v,codeFencedFenceMeta:_,codeFlowValue:$,codeIndented:f(C),codeText:f(V),codeTextData:$,data:$,definition:f(),definitionDestinationString:I,definitionLabelString:P,definitionTitleString:k,emphasis:f(),hardBreakEscape:f(se),hardBreakTrailing:f(se),htmlFlow:f(Se),htmlFlowData:$,htmlText:f(ue),htmlTextData:$,image:f(ee),label:pe,labelText:X,lineEnding:re,link:f(B),listItem:f(),listOrdered:f(),listUnordered:f(),paragraph:f(),referenceString:fe,resourceDestinationString:x,resourceTitleString:q,resource:U,setextHeading:f(Z),setextHeadingLineSequence:z,setextHeadingText:M,strong:f(),thematicBreak:f()}};l1(t,(e||{}).mdastExtensions||[]);const n={};return i;function i(ne){let de={type:"root",children:[]};const Ae={stack:[de],tokenStack:[],config:t,enter:d,exit:p,buffer:c,resume:m,data:n},Ie=[];let gt=-1;for(;++gt<ne.length;)if(ne[gt][1].type==="listOrdered"||ne[gt][1].type==="listUnordered")if(ne[gt][0]==="enter")Ie.push(gt);else{const Ht=Ie.pop();gt=s(ne,Ht,gt)}for(gt=-1;++gt<ne.length;){const Ht=t[ne[gt][0]];s1.call(Ht,ne[gt][1].type)&&Ht[ne[gt][1].type].call(Object.assign({sliceSerialize:ne[gt][2].sliceSerialize},Ae),ne[gt][1])}if(Ae.tokenStack.length>0){const Ht=Ae.tokenStack[Ae.tokenStack.length-1];(Ht[1]||Q0).call(Ae,void 0,Ht[0])}for(de.position={start:Qi(ne.length>0?ne[0][1].start:{line:1,column:1,offset:0}),end:Qi(ne.length>0?ne[ne.length-2][1].end:{line:1,column:1,offset:0})},gt=-1;++gt<t.transforms.length;)de=t.transforms[gt](de)||de;return de}function s(ne,de,Ae){let Ie=de-1,gt=-1,Ht=!1,Un,mn,Mn,dn;for(;++Ie<=Ae;){const Vt=ne[Ie];switch(Vt[1].type){case"listUnordered":case"listOrdered":case"blockQuote":{Vt[0]==="enter"?gt++:gt--,dn=void 0;break}case"lineEndingBlank":{Vt[0]==="enter"&&(Un&&!dn&&!gt&&!Mn&&(Mn=Ie),dn=void 0);break}case"linePrefix":case"listItemValue":case"listItemMarker":case"listItemPrefix":case"listItemPrefixWhitespace":break;default:dn=void 0}if(!gt&&Vt[0]==="enter"&&Vt[1].type==="listItemPrefix"||gt===-1&&Vt[0]==="exit"&&(Vt[1].type==="listUnordered"||Vt[1].type==="listOrdered")){if(Un){let On=Ie;for(mn=void 0;On--;){const gn=ne[On];if(gn[1].type==="lineEnding"||gn[1].type==="lineEndingBlank"){if(gn[0]==="exit")continue;mn&&(ne[mn][1].type="lineEndingBlank",Ht=!0),gn[1].type="lineEnding",mn=On}else if(!(gn[1].type==="linePrefix"||gn[1].type==="blockQuotePrefix"||gn[1].type==="blockQuotePrefixWhitespace"||gn[1].type==="blockQuoteMarker"||gn[1].type==="listItemIndent"))break}Mn&&(!mn||Mn<mn)&&(Un._spread=!0),Un.end=Object.assign({},mn?ne[mn][1].start:Vt[1].end),ne.splice(mn||Ie,0,["exit",Un,Vt[2]]),Ie++,Ae++}if(Vt[1].type==="listItemPrefix"){const On={type:"listItem",_spread:!1,start:Object.assign({},Vt[1].start),end:void 0};Un=On,ne.splice(Ie,0,["enter",On,Vt[2]]),Ie++,Ae++,Mn=void 0,dn=!0}}}return ne[de][1]._spread=Ht,Ae}function l(ne,de){return Ae;function Ae(Ie){d.call(this,ne(Ie),Ie),de&&de.call(this,Ie)}}function c(){this.stack.push({type:"fragment",children:[]})}function d(ne,de,Ae){this.stack[this.stack.length-1].children.push(ne),this.stack.push(ne),this.tokenStack.push([de,Ae||void 0]),ne.position={start:Qi(de.start),end:void 0}}function f(ne){return de;function de(Ae){ne&&ne.call(this,Ae),p.call(this,Ae)}}function p(ne,de){const Ae=this.stack.pop(),Ie=this.tokenStack.pop();if(Ie)Ie[0].type!==ne.type&&(de?de.call(this,ne,Ie[0]):(Ie[1]||Q0).call(this,ne,Ie[0]));else throw new Error("Cannot close `"+ne.type+"` ("+so({start:ne.start,end:ne.end})+"): it’s not open");Ae.position.end=Qi(ne.end)}function m(){return kb(this.stack.pop())}function g(){this.data.expectingFirstListItemValue=!0}function y(ne){if(this.data.expectingFirstListItemValue){const de=this.stack[this.stack.length-2];de.start=Number.parseInt(this.sliceSerialize(ne),10),this.data.expectingFirstListItemValue=void 0}}function v(){const ne=this.resume(),de=this.stack[this.stack.length-1];de.lang=ne}function _(){const ne=this.resume(),de=this.stack[this.stack.length-1];de.meta=ne}function T(){this.data.flowCodeInside||(this.buffer(),this.data.flowCodeInside=!0)}function N(){const ne=this.resume(),de=this.stack[this.stack.length-1];de.value=ne.replace(/^(\r?\n|\r)|(\r?\n|\r)$/g,""),this.data.flowCodeInside=void 0}function C(){const ne=this.resume(),de=this.stack[this.stack.length-1];de.value=ne.replace(/(\r?\n|\r)$/g,"")}function P(ne){const de=this.resume(),Ae=this.stack[this.stack.length-1];Ae.label=de,Ae.identifier=jr(this.sliceSerialize(ne)).toLowerCase()}function k(){const ne=this.resume(),de=this.stack[this.stack.length-1];de.title=ne}function I(){const ne=this.resume(),de=this.stack[this.stack.length-1];de.url=ne}function D(ne){const de=this.stack[this.stack.length-1];if(!de.depth){const Ae=this.sliceSerialize(ne).length;de.depth=Ae}}function M(){this.data.setextHeadingSlurpLineEnding=!0}function z(ne){const de=this.stack[this.stack.length-1];de.depth=this.sliceSerialize(ne).codePointAt(0)===61?1:2}function Z(){this.data.setextHeadingSlurpLineEnding=void 0}function W(ne){const Ae=this.stack[this.stack.length-1].children;let Ie=Ae[Ae.length-1];(!Ie||Ie.type!=="text")&&(Ie=Fn(),Ie.position={start:Qi(ne.start),end:void 0},Ae.push(Ie)),this.stack.push(Ie)}function $(ne){const de=this.stack.pop();de.value+=this.sliceSerialize(ne),de.position.end=Qi(ne.end)}function re(ne){const de=this.stack[this.stack.length-1];if(this.data.atHardBreak){const Ae=de.children[de.children.length-1];Ae.position.end=Qi(ne.end),this.data.atHardBreak=void 0;return}!this.data.setextHeadingSlurpLineEnding&&t.canContainEols.includes(de.type)&&(W.call(this,ne),$.call(this,ne))}function se(){this.data.atHardBreak=!0}function Se(){const ne=this.resume(),de=this.stack[this.stack.length-1];de.value=ne}function ue(){const ne=this.resume(),de=this.stack[this.stack.length-1];de.value=ne}function V(){const ne=this.resume(),de=this.stack[this.stack.length-1];de.value=ne}function B(){const ne=this.stack[this.stack.length-1];if(this.data.inReference){const de=this.data.referenceType||"shortcut";ne.type+="Reference",ne.referenceType=de,delete ne.url,delete ne.title}else delete ne.identifier,delete ne.label;this.data.referenceType=void 0}function ee(){const ne=this.stack[this.stack.length-1];if(this.data.inReference){const de=this.data.referenceType||"shortcut";ne.type+="Reference",ne.referenceType=de,delete ne.url,delete ne.title}else delete ne.identifier,delete ne.label;this.data.referenceType=void 0}function X(ne){const de=this.sliceSerialize(ne),Ae=this.stack[this.stack.length-2];Ae.label=H5(de),Ae.identifier=jr(de).toLowerCase()}function pe(){const ne=this.stack[this.stack.length-1],de=this.resume(),Ae=this.stack[this.stack.length-1];if(this.data.inReference=!0,Ae.type==="link"){const Ie=ne.children;Ae.children=Ie}else Ae.alt=de}function x(){const ne=this.resume(),de=this.stack[this.stack.length-1];de.url=ne}function q(){const ne=this.resume(),de=this.stack[this.stack.length-1];de.title=ne}function U(){this.data.inReference=void 0}function R(){this.data.referenceType="collapsed"}function fe(ne){const de=this.resume(),Ae=this.stack[this.stack.length-1];Ae.label=de,Ae.identifier=jr(this.sliceSerialize(ne)).toLowerCase(),this.data.referenceType="full"}function we(ne){this.data.characterReferenceType=ne.type}function be(ne){const de=this.sliceSerialize(ne),Ae=this.data.characterReferenceType;let Ie;Ae?(Ie=WS(de,Ae==="characterReferenceMarkerNumeric"?10:16),this.data.characterReferenceType=void 0):Ie=Mb(de);const gt=this.stack[this.stack.length-1];gt.value+=Ie}function ke(ne){const de=this.stack.pop();de.position.end=Qi(ne.end)}function Me(ne){$.call(this,ne);const de=this.stack[this.stack.length-1];de.url=this.sliceSerialize(ne)}function at(ne){$.call(this,ne);const de=this.stack[this.stack.length-1];de.url="mailto:"+this.sliceSerialize(ne)}function $e(){return{type:"blockquote",children:[]}}function ie(){return{type:"code",lang:null,meta:null,value:""}}function ze(){return{type:"inlineCode",value:""}}function st(){return{type:"definition",identifier:"",label:null,title:null,url:""}}function lt(){return{type:"emphasis",children:[]}}function Tt(){return{type:"heading",depth:0,children:[]}}function Be(){return{type:"break"}}function _t(){return{type:"html",value:""}}function Ve(){return{type:"image",title:null,url:"",alt:null}}function Ut(){return{type:"link",title:null,url:"",children:[]}}function Zt(ne){return{type:"list",ordered:ne.type==="listOrdered",start:null,spread:ne._spread,children:[]}}function Et(ne){return{type:"listItem",spread:ne._spread,checked:null,children:[]}}function Bn(){return{type:"paragraph",children:[]}}function hr(){return{type:"strong",children:[]}}function Fn(){return{type:"text",value:""}}function Ci(){return{type:"thematicBreak"}}}function Qi(e){return{line:e.line,column:e.column,offset:e.offset}}function l1(e,t){let n=-1;for(;++n<t.length;){const i=t[n];Array.isArray(i)?l1(e,i):K5(e,i)}}function K5(e,t){let n;for(n in t)if(s1.call(t,n))switch(n){case"canContainEols":{const i=t[n];i&&e[n].push(...i);break}case"transforms":{const i=t[n];i&&e[n].push(...i);break}case"enter":case"exit":{const i=t[n];i&&Object.assign(e[n],i);break}}}function Q0(e,t){throw e?new Error("Cannot close `"+e.type+"` ("+so({start:e.start,end:e.end})+"): a different token (`"+t.type+"`, "+so({start:t.start,end:t.end})+") is open"):new Error("Cannot close document, a token (`"+t.type+"`, "+so({start:t.start,end:t.end})+") is still open")}function Y5(e){const t=this;t.parser=n;function n(i){return G5(i,{...t.data("settings"),...e,extensions:t.data("micromarkExtensions")||[],mdastExtensions:t.data("fromMarkdownExtensions")||[]})}}function X5(e,t){const n={type:"element",tagName:"blockquote",properties:{},children:e.wrap(e.all(t),!0)};return e.patch(t,n),e.applyData(t,n)}function W5(e,t){const n={type:"element",tagName:"br",properties:{},children:[]};return e.patch(t,n),[e.applyData(t,n),{type:"text",value:`
`}]}function Z5(e,t){const n=t.value?t.value+`
`:"",i={},s=t.lang?t.lang.split(/\s+/):[];s.length>0&&(i.className=["language-"+s[0]]);let l={type:"element",tagName:"code",properties:i,children:[{type:"text",value:n}]};return t.meta&&(l.data={meta:t.meta}),e.patch(t,l),l=e.applyData(t,l),l={type:"element",tagName:"pre",properties:{},children:[l]},e.patch(t,l),l}function Q5(e,t){const n={type:"element",tagName:"del",properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function J5(e,t){const n={type:"element",tagName:"em",properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function eH(e,t){const n=typeof e.options.clobberPrefix=="string"?e.options.clobberPrefix:"user-content-",i=String(t.identifier).toUpperCase(),s=Gs(i.toLowerCase()),l=e.footnoteOrder.indexOf(i);let c,d=e.footnoteCounts.get(i);d===void 0?(d=0,e.footnoteOrder.push(i),c=e.footnoteOrder.length):c=l+1,d+=1,e.footnoteCounts.set(i,d);const f={type:"element",tagName:"a",properties:{href:"#"+n+"fn-"+s,id:n+"fnref-"+s+(d>1?"-"+d:""),dataFootnoteRef:!0,ariaDescribedBy:["footnote-label"]},children:[{type:"text",value:String(c)}]};e.patch(t,f);const p={type:"element",tagName:"sup",properties:{},children:[f]};return e.patch(t,p),e.applyData(t,p)}function tH(e,t){const n={type:"element",tagName:"h"+t.depth,properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function nH(e,t){if(e.options.allowDangerousHtml){const n={type:"raw",value:t.value};return e.patch(t,n),e.applyData(t,n)}}function o1(e,t){const n=t.referenceType;let i="]";if(n==="collapsed"?i+="[]":n==="full"&&(i+="["+(t.label||t.identifier)+"]"),t.type==="imageReference")return[{type:"text",value:"!["+t.alt+i}];const s=e.all(t),l=s[0];l&&l.type==="text"?l.value="["+l.value:s.unshift({type:"text",value:"["});const c=s[s.length-1];return c&&c.type==="text"?c.value+=i:s.push({type:"text",value:i}),s}function rH(e,t){const n=String(t.identifier).toUpperCase(),i=e.definitionById.get(n);if(!i)return o1(e,t);const s={src:Gs(i.url||""),alt:t.alt};i.title!==null&&i.title!==void 0&&(s.title=i.title);const l={type:"element",tagName:"img",properties:s,children:[]};return e.patch(t,l),e.applyData(t,l)}function iH(e,t){const n={src:Gs(t.url)};t.alt!==null&&t.alt!==void 0&&(n.alt=t.alt),t.title!==null&&t.title!==void 0&&(n.title=t.title);const i={type:"element",tagName:"img",properties:n,children:[]};return e.patch(t,i),e.applyData(t,i)}function aH(e,t){const n={type:"text",value:t.value.replace(/\r?\n|\r/g," ")};e.patch(t,n);const i={type:"element",tagName:"code",properties:{},children:[n]};return e.patch(t,i),e.applyData(t,i)}function sH(e,t){const n=String(t.identifier).toUpperCase(),i=e.definitionById.get(n);if(!i)return o1(e,t);const s={href:Gs(i.url||"")};i.title!==null&&i.title!==void 0&&(s.title=i.title);const l={type:"element",tagName:"a",properties:s,children:e.all(t)};return e.patch(t,l),e.applyData(t,l)}function lH(e,t){const n={href:Gs(t.url)};t.title!==null&&t.title!==void 0&&(n.title=t.title);const i={type:"element",tagName:"a",properties:n,children:e.all(t)};return e.patch(t,i),e.applyData(t,i)}function oH(e,t,n){const i=e.all(t),s=n?cH(n):c1(t),l={},c=[];if(typeof t.checked=="boolean"){const m=i[0];let g;m&&m.type==="element"&&m.tagName==="p"?g=m:(g={type:"element",tagName:"p",properties:{},children:[]},i.unshift(g)),g.children.length>0&&g.children.unshift({type:"text",value:" "}),g.children.unshift({type:"element",tagName:"input",properties:{type:"checkbox",checked:t.checked,disabled:!0},children:[]}),l.className=["task-list-item"]}let d=-1;for(;++d<i.length;){const m=i[d];(s||d!==0||m.type!=="element"||m.tagName!=="p")&&c.push({type:"text",value:`
`}),m.type==="element"&&m.tagName==="p"&&!s?c.push(...m.children):c.push(m)}const f=i[i.length-1];f&&(s||f.type!=="element"||f.tagName!=="p")&&c.push({type:"text",value:`
`});const p={type:"element",tagName:"li",properties:l,children:c};return e.patch(t,p),e.applyData(t,p)}function cH(e){let t=!1;if(e.type==="list"){t=e.spread||!1;const n=e.children;let i=-1;for(;!t&&++i<n.length;)t=c1(n[i])}return t}function c1(e){const t=e.spread;return t??e.children.length>1}function uH(e,t){const n={},i=e.all(t);let s=-1;for(typeof t.start=="number"&&t.start!==1&&(n.start=t.start);++s<i.length;){const c=i[s];if(c.type==="element"&&c.tagName==="li"&&c.properties&&Array.isArray(c.properties.className)&&c.properties.className.includes("task-list-item")){n.className=["contains-task-list"];break}}const l={type:"element",tagName:t.ordered?"ol":"ul",properties:n,children:e.wrap(i,!0)};return e.patch(t,l),e.applyData(t,l)}function dH(e,t){const n={type:"element",tagName:"p",properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function fH(e,t){const n={type:"root",children:e.wrap(e.all(t))};return e.patch(t,n),e.applyData(t,n)}function pH(e,t){const n={type:"element",tagName:"strong",properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function hH(e,t){const n=e.all(t),i=n.shift(),s=[];if(i){const c={type:"element",tagName:"thead",properties:{},children:e.wrap([i],!0)};e.patch(t.children[0],c),s.push(c)}if(n.length>0){const c={type:"element",tagName:"tbody",properties:{},children:e.wrap(n,!0)},d=Rb(t.children[1]),f=US(t.children[t.children.length-1]);d&&f&&(c.position={start:d,end:f}),s.push(c)}const l={type:"element",tagName:"table",properties:{},children:e.wrap(s,!0)};return e.patch(t,l),e.applyData(t,l)}function mH(e,t,n){const i=n?n.children:void 0,l=(i?i.indexOf(t):1)===0?"th":"td",c=n&&n.type==="table"?n.align:void 0,d=c?c.length:t.children.length;let f=-1;const p=[];for(;++f<d;){const g=t.children[f],y={},v=c?c[f]:void 0;v&&(y.align=v);let _={type:"element",tagName:l,properties:y,children:[]};g&&(_.children=e.all(g),e.patch(g,_),_=e.applyData(g,_)),p.push(_)}const m={type:"element",tagName:"tr",properties:{},children:e.wrap(p,!0)};return e.patch(t,m),e.applyData(t,m)}function gH(e,t){const n={type:"element",tagName:"td",properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}const J0=9,ew=32;function bH(e){const t=String(e),n=/\r?\n|\r/g;let i=n.exec(t),s=0;const l=[];for(;i;)l.push(tw(t.slice(s,i.index),s>0,!0),i[0]),s=i.index+i[0].length,i=n.exec(t);return l.push(tw(t.slice(s),s>0,!1)),l.join("")}function tw(e,t,n){let i=0,s=e.length;if(t){let l=e.codePointAt(i);for(;l===J0||l===ew;)i++,l=e.codePointAt(i)}if(n){let l=e.codePointAt(s-1);for(;l===J0||l===ew;)s--,l=e.codePointAt(s-1)}return s>i?e.slice(i,s):""}function yH(e,t){const n={type:"text",value:bH(String(t.value))};return e.patch(t,n),e.applyData(t,n)}function vH(e,t){const n={type:"element",tagName:"hr",properties:{},children:[]};return e.patch(t,n),e.applyData(t,n)}const _H={blockquote:X5,break:W5,code:Z5,delete:Q5,emphasis:J5,footnoteReference:eH,heading:tH,html:nH,imageReference:rH,image:iH,inlineCode:aH,linkReference:sH,link:lH,listItem:oH,list:uH,paragraph:dH,root:fH,strong:pH,table:hH,tableCell:gH,tableRow:mH,text:yH,thematicBreak:vH,toml:Qc,yaml:Qc,definition:Qc,footnoteDefinition:Qc};function Qc(){}const u1=-1,hd=0,oo=1,Bu=2,Ib=3,Lb=4,jb=5,$b=6,d1=7,f1=8,xH=typeof self=="object"?self:globalThis,nw=(e,t)=>{switch(e){case"Function":case"SharedWorker":case"Worker":case"eval":case"setInterval":case"setTimeout":throw new TypeError("unable to deserialize "+e)}return new xH[e](t)},wH=(e,t)=>{const n=(s,l)=>(e.set(l,s),s),i=s=>{if(e.has(s))return e.get(s);const[l,c]=t[s];switch(l){case hd:case u1:return n(c,s);case oo:{const d=n([],s);for(const f of c)d.push(i(f));return d}case Bu:{const d=n({},s);for(const[f,p]of c)d[i(f)]=i(p);return d}case Ib:return n(new Date(c),s);case Lb:{const{source:d,flags:f}=c;return n(new RegExp(d,f),s)}case jb:{const d=n(new Map,s);for(const[f,p]of c)d.set(i(f),i(p));return d}case $b:{const d=n(new Set,s);for(const f of c)d.add(i(f));return d}case d1:{const{name:d,message:f}=c;return n(nw(d,f),s)}case f1:return n(BigInt(c),s);case"BigInt":return n(Object(BigInt(c)),s);case"ArrayBuffer":return n(new Uint8Array(c).buffer,c);case"DataView":{const{buffer:d}=new Uint8Array(c);return n(new DataView(d),c)}}return n(nw(l,c),s)};return i},rw=e=>wH(new Map,e)(0),Cs="",{toString:EH}={},{keys:SH}=Object,Wl=e=>{const t=typeof e;if(t!=="object"||!e)return[hd,t];const n=EH.call(e).slice(8,-1);switch(n){case"Array":return[oo,Cs];case"Object":return[Bu,Cs];case"Date":return[Ib,Cs];case"RegExp":return[Lb,Cs];case"Map":return[jb,Cs];case"Set":return[$b,Cs];case"DataView":return[oo,n]}return n.includes("Array")?[oo,n]:n.includes("Error")?[d1,n]:[Bu,n]},Jc=([e,t])=>e===hd&&(t==="function"||t==="symbol"),CH=(e,t,n,i)=>{const s=(c,d)=>{const f=i.push(c)-1;return n.set(d,f),f},l=c=>{if(n.has(c))return n.get(c);let[d,f]=Wl(c);switch(d){case hd:{let m=c;switch(f){case"bigint":d=f1,m=c.toString();break;case"function":case"symbol":if(e)throw new TypeError("unable to serialize "+f);m=null;break;case"undefined":return s([u1],c)}return s([d,m],c)}case oo:{if(f){let y=c;return f==="DataView"?y=new Uint8Array(c.buffer):f==="ArrayBuffer"&&(y=new Uint8Array(c)),s([f,[...y]],c)}const m=[],g=s([d,m],c);for(const y of c)m.push(l(y));return g}case Bu:{if(f)switch(f){case"BigInt":return s([f,c.toString()],c);case"Boolean":case"Number":case"String":return s([f,c.valueOf()],c)}if(t&&"toJSON"in c)return l(c.toJSON());const m=[],g=s([d,m],c);for(const y of SH(c))(e||!Jc(Wl(c[y])))&&m.push([l(y),l(c[y])]);return g}case Ib:return s([d,c.toISOString()],c);case Lb:{const{source:m,flags:g}=c;return s([d,{source:m,flags:g}],c)}case jb:{const m=[],g=s([d,m],c);for(const[y,v]of c)(e||!(Jc(Wl(y))||Jc(Wl(v))))&&m.push([l(y),l(v)]);return g}case $b:{const m=[],g=s([d,m],c);for(const y of c)(e||!Jc(Wl(y)))&&m.push(l(y));return g}}const{message:p}=c;return s([d,{name:f,message:p}],c)};return l},iw=(e,{json:t,lossy:n}={})=>{const i=[];return CH(!(t||n),!!t,new Map,i)(e),i},Fu=typeof structuredClone=="function"?(e,t)=>t&&("json"in t||"lossy"in t)?rw(iw(e,t)):structuredClone(e):(e,t)=>rw(iw(e,t));function TH(e,t){const n=[{type:"text",value:"↩"}];return t>1&&n.push({type:"element",tagName:"sup",properties:{},children:[{type:"text",value:String(t)}]}),n}function OH(e,t){return"Back to reference "+(e+1)+(t>1?"-"+t:"")}function RH(e){const t=typeof e.options.clobberPrefix=="string"?e.options.clobberPrefix:"user-content-",n=e.options.footnoteBackContent||TH,i=e.options.footnoteBackLabel||OH,s=e.options.footnoteLabel||"Footnotes",l=e.options.footnoteLabelTagName||"h2",c=e.options.footnoteLabelProperties||{className:["sr-only"]},d=[];let f=-1;for(;++f<e.footnoteOrder.length;){const p=e.footnoteById.get(e.footnoteOrder[f]);if(!p)continue;const m=e.all(p),g=String(p.identifier).toUpperCase(),y=Gs(g.toLowerCase());let v=0;const _=[],T=e.footnoteCounts.get(g);for(;T!==void 0&&++v<=T;){_.length>0&&_.push({type:"text",value:" "});let P=typeof n=="string"?n:n(f,v);typeof P=="string"&&(P={type:"text",value:P}),_.push({type:"element",tagName:"a",properties:{href:"#"+t+"fnref-"+y+(v>1?"-"+v:""),dataFootnoteBackref:"",ariaLabel:typeof i=="string"?i:i(f,v),className:["data-footnote-backref"]},children:Array.isArray(P)?P:[P]})}const N=m[m.length-1];if(N&&N.type==="element"&&N.tagName==="p"){const P=N.children[N.children.length-1];P&&P.type==="text"?P.value+=" ":N.children.push({type:"text",value:" "}),N.children.push(..._)}else m.push(..._);const C={type:"element",tagName:"li",properties:{id:t+"fn-"+y},children:e.wrap(m,!0)};e.patch(p,C),d.push(C)}if(d.length!==0)return{type:"element",tagName:"section",properties:{dataFootnotes:!0,className:["footnotes"]},children:[{type:"element",tagName:l,properties:{...Fu(c),id:"footnote-label"},children:[{type:"text",value:s}]},{type:"text",value:`
`},{type:"element",tagName:"ol",properties:{},children:e.wrap(d,!0)},{type:"text",value:`
`}]}}const Oo=(function(e){if(e==null)return kH;if(typeof e=="function")return md(e);if(typeof e=="object")return Array.isArray(e)?NH(e):AH(e);if(typeof e=="string")return DH(e);throw new Error("Expected function, string, or object as test")});function NH(e){const t=[];let n=-1;for(;++n<e.length;)t[n]=Oo(e[n]);return md(i);function i(...s){let l=-1;for(;++l<t.length;)if(t[l].apply(this,s))return!0;return!1}}function AH(e){const t=e;return md(n);function n(i){const s=i;let l;for(l in e)if(s[l]!==t[l])return!1;return!0}}function DH(e){return md(t);function t(n){return n&&n.type===e}}function md(e){return t;function t(n,i,s){return!!(MH(n)&&e.call(this,n,typeof i=="number"?i:void 0,s||void 0))}}function kH(){return!0}function MH(e){return e!==null&&typeof e=="object"&&"type"in e}const p1=[],PH=!0,$g=!1,IH="skip";function h1(e,t,n,i){let s;typeof t=="function"&&typeof n!="function"?(i=n,n=t):s=t;const l=Oo(s),c=i?-1:1;d(e,void 0,[])();function d(f,p,m){const g=f&&typeof f=="object"?f:{};if(typeof g.type=="string"){const v=typeof g.tagName=="string"?g.tagName:typeof g.name=="string"?g.name:void 0;Object.defineProperty(y,"name",{value:"node ("+(f.type+(v?"<"+v+">":""))+")"})}return y;function y(){let v=p1,_,T,N;if((!t||l(f,p,m[m.length-1]||void 0))&&(v=LH(n(f,m)),v[0]===$g))return v;if("children"in f&&f.children){const C=f;if(C.children&&v[0]!==IH)for(T=(i?C.children.length:-1)+c,N=m.concat(C);T>-1&&T<C.children.length;){const P=C.children[T];if(_=d(P,T,N)(),_[0]===$g)return _;T=typeof _[1]=="number"?_[1]:T+c}}return v}}}function LH(e){return Array.isArray(e)?e:typeof e=="number"?[PH,e]:e==null?p1:[e]}function gd(e,t,n,i){let s,l,c;typeof t=="function"&&typeof n!="function"?(l=void 0,c=t,s=n):(l=t,c=n,s=i),h1(e,l,d,s);function d(f,p){const m=p[p.length-1],g=m?m.children.indexOf(f):void 0;return c(f,g,m)}}const zg={}.hasOwnProperty,jH={};function $H(e,t){const n=t||jH,i=new Map,s=new Map,l=new Map,c={..._H,...n.handlers},d={all:p,applyData:BH,definitionById:i,footnoteById:s,footnoteCounts:l,footnoteOrder:[],handlers:c,one:f,options:n,patch:zH,wrap:UH};return gd(e,function(m){if(m.type==="definition"||m.type==="footnoteDefinition"){const g=m.type==="definition"?i:s,y=String(m.identifier).toUpperCase();g.has(y)||g.set(y,m)}}),d;function f(m,g){const y=m.type,v=d.handlers[y];if(zg.call(d.handlers,y)&&v)return v(d,m,g);if(d.options.passThrough&&d.options.passThrough.includes(y)){if("children"in m){const{children:T,...N}=m,C=Fu(N);return C.children=d.all(m),C}return Fu(m)}return(d.options.unknownHandler||FH)(d,m,g)}function p(m){const g=[];if("children"in m){const y=m.children;let v=-1;for(;++v<y.length;){const _=d.one(y[v],m);if(_){if(v&&y[v-1].type==="break"&&(!Array.isArray(_)&&_.type==="text"&&(_.value=aw(_.value)),!Array.isArray(_)&&_.type==="element")){const T=_.children[0];T&&T.type==="text"&&(T.value=aw(T.value))}Array.isArray(_)?g.push(..._):g.push(_)}}}return g}}function zH(e,t){e.position&&(t.position=T9(e))}function BH(e,t){let n=t;if(e&&e.data){const i=e.data.hName,s=e.data.hChildren,l=e.data.hProperties;if(typeof i=="string")if(n.type==="element")n.tagName=i;else{const c="children"in n?n.children:[n];n={type:"element",tagName:i,properties:{},children:c}}n.type==="element"&&l&&Object.assign(n.properties,Fu(l)),"children"in n&&n.children&&s!==null&&s!==void 0&&(n.children=s)}return n}function FH(e,t){const n=t.data||{},i="value"in t&&!(zg.call(n,"hProperties")||zg.call(n,"hChildren"))?{type:"text",value:t.value}:{type:"element",tagName:"div",properties:{},children:e.all(t)};return e.patch(t,i),e.applyData(t,i)}function UH(e,t){const n=[];let i=-1;for(t&&n.push({type:"text",value:`
`});++i<e.length;)i&&n.push({type:"text",value:`
`}),n.push(e[i]);return t&&e.length>0&&n.push({type:"text",value:`
`}),n}function aw(e){let t=0,n=e.charCodeAt(t);for(;n===9||n===32;)t++,n=e.charCodeAt(t);return e.slice(t)}function sw(e,t){const n=$H(e,t),i=n.one(e,void 0),s=RH(n),l=Array.isArray(i)?{type:"root",children:i}:i||{type:"root",children:[]};return s&&l.children.push({type:"text",value:`
`},s),l}function HH(e,t){return e&&"run"in e?async function(n,i){const s=sw(n,{file:i,...t});await e.run(s,i)}:function(n,i){return sw(n,{file:i,...e||t})}}function lw(e){if(e)throw e}var Wp,ow;function qH(){if(ow)return Wp;ow=1;var e=Object.prototype.hasOwnProperty,t=Object.prototype.toString,n=Object.defineProperty,i=Object.getOwnPropertyDescriptor,s=function(p){return typeof Array.isArray=="function"?Array.isArray(p):t.call(p)==="[object Array]"},l=function(p){if(!p||t.call(p)!=="[object Object]")return!1;var m=e.call(p,"constructor"),g=p.constructor&&p.constructor.prototype&&e.call(p.constructor.prototype,"isPrototypeOf");if(p.constructor&&!m&&!g)return!1;var y;for(y in p);return typeof y>"u"||e.call(p,y)},c=function(p,m){n&&m.name==="__proto__"?n(p,m.name,{enumerable:!0,configurable:!0,value:m.newValue,writable:!0}):p[m.name]=m.newValue},d=function(p,m){if(m==="__proto__")if(e.call(p,m)){if(i)return i(p,m).value}else return;return p[m]};return Wp=function f(){var p,m,g,y,v,_,T=arguments[0],N=1,C=arguments.length,P=!1;for(typeof T=="boolean"&&(P=T,T=arguments[1]||{},N=2),(T==null||typeof T!="object"&&typeof T!="function")&&(T={});N<C;++N)if(p=arguments[N],p!=null)for(m in p)g=d(T,m),y=d(p,m),T!==y&&(P&&y&&(l(y)||(v=s(y)))?(v?(v=!1,_=g&&s(g)?g:[]):_=g&&l(g)?g:{},c(T,{name:m,newValue:f(P,_,y)})):typeof y<"u"&&c(T,{name:m,newValue:y}));return T},Wp}var GH=qH();const Zp=za(GH);function Bg(e){if(typeof e!="object"||e===null)return!1;const t=Object.getPrototypeOf(e);return(t===null||t===Object.prototype||Object.getPrototypeOf(t)===null)&&!(Symbol.toStringTag in e)&&!(Symbol.iterator in e)}function VH(){const e=[],t={run:n,use:i};return t;function n(...s){let l=-1;const c=s.pop();if(typeof c!="function")throw new TypeError("Expected function as last argument, not "+c);d(null,...s);function d(f,...p){const m=e[++l];let g=-1;if(f){c(f);return}for(;++g<s.length;)(p[g]===null||p[g]===void 0)&&(p[g]=s[g]);s=p,m?KH(m,d)(...p):c(null,...p)}}function i(s){if(typeof s!="function")throw new TypeError("Expected `middelware` to be a function, not "+s);return e.push(s),t}}function KH(e,t){let n;return i;function i(...c){const d=e.length>c.length;let f;d&&c.push(s);try{f=e.apply(this,c)}catch(p){const m=p;if(d&&n)throw m;return s(m)}d||(f&&f.then&&typeof f.then=="function"?f.then(l,s):f instanceof Error?s(f):l(f))}function s(c,...d){n||(n=!0,t(c,...d))}function l(c){s(null,c)}}const Xr={basename:YH,dirname:XH,extname:WH,join:ZH,sep:"/"};function YH(e,t){if(t!==void 0&&typeof t!="string")throw new TypeError('"ext" argument must be a string');Ro(e);let n=0,i=-1,s=e.length,l;if(t===void 0||t.length===0||t.length>e.length){for(;s--;)if(e.codePointAt(s)===47){if(l){n=s+1;break}}else i<0&&(l=!0,i=s+1);return i<0?"":e.slice(n,i)}if(t===e)return"";let c=-1,d=t.length-1;for(;s--;)if(e.codePointAt(s)===47){if(l){n=s+1;break}}else c<0&&(l=!0,c=s+1),d>-1&&(e.codePointAt(s)===t.codePointAt(d--)?d<0&&(i=s):(d=-1,i=c));return n===i?i=c:i<0&&(i=e.length),e.slice(n,i)}function XH(e){if(Ro(e),e.length===0)return".";let t=-1,n=e.length,i;for(;--n;)if(e.codePointAt(n)===47){if(i){t=n;break}}else i||(i=!0);return t<0?e.codePointAt(0)===47?"/":".":t===1&&e.codePointAt(0)===47?"//":e.slice(0,t)}function WH(e){Ro(e);let t=e.length,n=-1,i=0,s=-1,l=0,c;for(;t--;){const d=e.codePointAt(t);if(d===47){if(c){i=t+1;break}continue}n<0&&(c=!0,n=t+1),d===46?s<0?s=t:l!==1&&(l=1):s>-1&&(l=-1)}return s<0||n<0||l===0||l===1&&s===n-1&&s===i+1?"":e.slice(s,n)}function ZH(...e){let t=-1,n;for(;++t<e.length;)Ro(e[t]),e[t]&&(n=n===void 0?e[t]:n+"/"+e[t]);return n===void 0?".":QH(n)}function QH(e){Ro(e);const t=e.codePointAt(0)===47;let n=JH(e,!t);return n.length===0&&!t&&(n="."),n.length>0&&e.codePointAt(e.length-1)===47&&(n+="/"),t?"/"+n:n}function JH(e,t){let n="",i=0,s=-1,l=0,c=-1,d,f;for(;++c<=e.length;){if(c<e.length)d=e.codePointAt(c);else{if(d===47)break;d=47}if(d===47){if(!(s===c-1||l===1))if(s!==c-1&&l===2){if(n.length<2||i!==2||n.codePointAt(n.length-1)!==46||n.codePointAt(n.length-2)!==46){if(n.length>2){if(f=n.lastIndexOf("/"),f!==n.length-1){f<0?(n="",i=0):(n=n.slice(0,f),i=n.length-1-n.lastIndexOf("/")),s=c,l=0;continue}}else if(n.length>0){n="",i=0,s=c,l=0;continue}}t&&(n=n.length>0?n+"/..":"..",i=2)}else n.length>0?n+="/"+e.slice(s+1,c):n=e.slice(s+1,c),i=c-s-1;s=c,l=0}else d===46&&l>-1?l++:l=-1}return n}function Ro(e){if(typeof e!="string")throw new TypeError("Path must be a string. Received "+JSON.stringify(e))}const e8={cwd:t8};function t8(){return"/"}function Fg(e){return!!(e!==null&&typeof e=="object"&&"href"in e&&e.href&&"protocol"in e&&e.protocol&&e.auth===void 0)}function n8(e){if(typeof e=="string")e=new URL(e);else if(!Fg(e)){const t=new TypeError('The "path" argument must be of type string or an instance of URL. Received `'+e+"`");throw t.code="ERR_INVALID_ARG_TYPE",t}if(e.protocol!=="file:"){const t=new TypeError("The URL must be of scheme file");throw t.code="ERR_INVALID_URL_SCHEME",t}return r8(e)}function r8(e){if(e.hostname!==""){const i=new TypeError('File URL host must be "localhost" or empty on darwin');throw i.code="ERR_INVALID_FILE_URL_HOST",i}const t=e.pathname;let n=-1;for(;++n<t.length;)if(t.codePointAt(n)===37&&t.codePointAt(n+1)===50){const i=t.codePointAt(n+2);if(i===70||i===102){const s=new TypeError("File URL path must not include encoded / characters");throw s.code="ERR_INVALID_FILE_URL_PATH",s}}return decodeURIComponent(t)}const Qp=["history","path","basename","stem","extname","dirname"];class m1{constructor(t){let n;t?Fg(t)?n={path:t}:typeof t=="string"||i8(t)?n={value:t}:n=t:n={},this.cwd="cwd"in n?"":e8.cwd(),this.data={},this.history=[],this.messages=[],this.value,this.map,this.result,this.stored;let i=-1;for(;++i<Qp.length;){const l=Qp[i];l in n&&n[l]!==void 0&&n[l]!==null&&(this[l]=l==="history"?[...n[l]]:n[l])}let s;for(s in n)Qp.includes(s)||(this[s]=n[s])}get basename(){return typeof this.path=="string"?Xr.basename(this.path):void 0}set basename(t){eh(t,"basename"),Jp(t,"basename"),this.path=Xr.join(this.dirname||"",t)}get dirname(){return typeof this.path=="string"?Xr.dirname(this.path):void 0}set dirname(t){cw(this.basename,"dirname"),this.path=Xr.join(t||"",this.basename)}get extname(){return typeof this.path=="string"?Xr.extname(this.path):void 0}set extname(t){if(Jp(t,"extname"),cw(this.dirname,"extname"),t){if(t.codePointAt(0)!==46)throw new Error("`extname` must start with `.`");if(t.includes(".",1))throw new Error("`extname` cannot contain multiple dots")}this.path=Xr.join(this.dirname,this.stem+(t||""))}get path(){return this.history[this.history.length-1]}set path(t){Fg(t)&&(t=n8(t)),eh(t,"path"),this.path!==t&&this.history.push(t)}get stem(){return typeof this.path=="string"?Xr.basename(this.path,this.extname):void 0}set stem(t){eh(t,"stem"),Jp(t,"stem"),this.path=Xr.join(this.dirname||"",t+(this.extname||""))}fail(t,n,i){const s=this.message(t,n,i);throw s.fatal=!0,s}info(t,n,i){const s=this.message(t,n,i);return s.fatal=void 0,s}message(t,n,i){const s=new kn(t,n,i);return this.path&&(s.name=this.path+":"+s.name,s.file=this.path),s.fatal=!1,this.messages.push(s),s}toString(t){return this.value===void 0?"":typeof this.value=="string"?this.value:new TextDecoder(t||void 0).decode(this.value)}}function Jp(e,t){if(e&&e.includes(Xr.sep))throw new Error("`"+t+"` cannot be a path: did not expect `"+Xr.sep+"`")}function eh(e,t){if(!e)throw new Error("`"+t+"` cannot be empty")}function cw(e,t){if(!e)throw new Error("Setting `"+t+"` requires `path` to be set too")}function i8(e){return!!(e&&typeof e=="object"&&"byteLength"in e&&"byteOffset"in e)}const a8=(function(e){const i=this.constructor.prototype,s=i[e],l=function(){return s.apply(l,arguments)};return Object.setPrototypeOf(l,i),l}),s8={}.hasOwnProperty;class zb extends a8{constructor(){super("copy"),this.Compiler=void 0,this.Parser=void 0,this.attachers=[],this.compiler=void 0,this.freezeIndex=-1,this.frozen=void 0,this.namespace={},this.parser=void 0,this.transformers=VH()}copy(){const t=new zb;let n=-1;for(;++n<this.attachers.length;){const i=this.attachers[n];t.use(...i)}return t.data(Zp(!0,{},this.namespace)),t}data(t,n){return typeof t=="string"?arguments.length===2?(rh("data",this.frozen),this.namespace[t]=n,this):s8.call(this.namespace,t)&&this.namespace[t]||void 0:t?(rh("data",this.frozen),this.namespace=t,this):this.namespace}freeze(){if(this.frozen)return this;const t=this;for(;++this.freezeIndex<this.attachers.length;){const[n,...i]=this.attachers[this.freezeIndex];if(i[0]===!1)continue;i[0]===!0&&(i[0]=void 0);const s=n.call(t,...i);typeof s=="function"&&this.transformers.use(s)}return this.frozen=!0,this.freezeIndex=Number.POSITIVE_INFINITY,this}parse(t){this.freeze();const n=eu(t),i=this.parser||this.Parser;return th("parse",i),i(String(n),n)}process(t,n){const i=this;return this.freeze(),th("process",this.parser||this.Parser),nh("process",this.compiler||this.Compiler),n?s(void 0,n):new Promise(s);function s(l,c){const d=eu(t),f=i.parse(d);i.run(f,d,function(m,g,y){if(m||!g||!y)return p(m);const v=g,_=i.stringify(v,y);c8(_)?y.value=_:y.result=_,p(m,y)});function p(m,g){m||!g?c(m):l?l(g):n(void 0,g)}}}processSync(t){let n=!1,i;return this.freeze(),th("processSync",this.parser||this.Parser),nh("processSync",this.compiler||this.Compiler),this.process(t,s),dw("processSync","process",n),i;function s(l,c){n=!0,lw(l),i=c}}run(t,n,i){uw(t),this.freeze();const s=this.transformers;return!i&&typeof n=="function"&&(i=n,n=void 0),i?l(void 0,i):new Promise(l);function l(c,d){const f=eu(n);s.run(t,f,p);function p(m,g,y){const v=g||t;m?d(m):c?c(v):i(void 0,v,y)}}}runSync(t,n){let i=!1,s;return this.run(t,n,l),dw("runSync","run",i),s;function l(c,d){lw(c),s=d,i=!0}}stringify(t,n){this.freeze();const i=eu(n),s=this.compiler||this.Compiler;return nh("stringify",s),uw(t),s(t,i)}use(t,...n){const i=this.attachers,s=this.namespace;if(rh("use",this.frozen),t!=null)if(typeof t=="function")f(t,n);else if(typeof t=="object")Array.isArray(t)?d(t):c(t);else throw new TypeError("Expected usable value, not `"+t+"`");return this;function l(p){if(typeof p=="function")f(p,[]);else if(typeof p=="object")if(Array.isArray(p)){const[m,...g]=p;f(m,g)}else c(p);else throw new TypeError("Expected usable value, not `"+p+"`")}function c(p){if(!("plugins"in p)&&!("settings"in p))throw new Error("Expected usable value but received an empty preset, which is probably a mistake: presets typically come with `plugins` and sometimes with `settings`, but this has neither");d(p.plugins),p.settings&&(s.settings=Zp(!0,s.settings,p.settings))}function d(p){let m=-1;if(p!=null)if(Array.isArray(p))for(;++m<p.length;){const g=p[m];l(g)}else throw new TypeError("Expected a list of plugins, not `"+p+"`")}function f(p,m){let g=-1,y=-1;for(;++g<i.length;)if(i[g][0]===p){y=g;break}if(y===-1)i.push([p,...m]);else if(m.length>0){let[v,..._]=m;const T=i[y][1];Bg(T)&&Bg(v)&&(v=Zp(!0,T,v)),i[y]=[p,v,..._]}}}}const l8=new zb().freeze();function th(e,t){if(typeof t!="function")throw new TypeError("Cannot `"+e+"` without `parser`")}function nh(e,t){if(typeof t!="function")throw new TypeError("Cannot `"+e+"` without `compiler`")}function rh(e,t){if(t)throw new Error("Cannot call `"+e+"` on a frozen processor.\nCreate a new processor first, by calling it: use `processor()` instead of `processor`.")}function uw(e){if(!Bg(e)||typeof e.type!="string")throw new TypeError("Expected node, got `"+e+"`")}function dw(e,t,n){if(!n)throw new Error("`"+e+"` finished async. Use `"+t+"` instead")}function eu(e){return o8(e)?e:new m1(e)}function o8(e){return!!(e&&typeof e=="object"&&"message"in e&&"messages"in e)}function c8(e){return typeof e=="string"||u8(e)}function u8(e){return!!(e&&typeof e=="object"&&"byteLength"in e&&"byteOffset"in e)}const d8="https://github.com/remarkjs/react-markdown/blob/main/changelog.md",fw=[],pw={allowDangerousHtml:!0},f8=/^(https?|ircs?|mailto|xmpp)$/i,p8=[{from:"astPlugins",id:"remove-buggy-html-in-markdown-parser"},{from:"allowDangerousHtml",id:"remove-buggy-html-in-markdown-parser"},{from:"allowNode",id:"replace-allownode-allowedtypes-and-disallowedtypes",to:"allowElement"},{from:"allowedTypes",id:"replace-allownode-allowedtypes-and-disallowedtypes",to:"allowedElements"},{from:"className",id:"remove-classname"},{from:"disallowedTypes",id:"replace-allownode-allowedtypes-and-disallowedtypes",to:"disallowedElements"},{from:"escapeHtml",id:"remove-buggy-html-in-markdown-parser"},{from:"includeElementIndex",id:"#remove-includeelementindex"},{from:"includeNodeIndex",id:"change-includenodeindex-to-includeelementindex"},{from:"linkTarget",id:"remove-linktarget"},{from:"plugins",id:"change-plugins-to-remarkplugins",to:"remarkPlugins"},{from:"rawSourcePos",id:"#remove-rawsourcepos"},{from:"renderers",id:"change-renderers-to-components",to:"components"},{from:"source",id:"change-source-to-children",to:"children"},{from:"sourcePos",id:"#remove-sourcepos"},{from:"transformImageUri",id:"#add-urltransform",to:"urlTransform"},{from:"transformLinkUri",id:"#add-urltransform",to:"urlTransform"}];function h8(e){const t=m8(e),n=g8(e);return b8(t.runSync(t.parse(n),n),e)}function m8(e){const t=e.rehypePlugins||fw,n=e.remarkPlugins||fw,i=e.remarkRehypeOptions?{...e.remarkRehypeOptions,...pw}:pw;return l8().use(Y5).use(n).use(HH,i).use(t)}function g8(e){const t=e.children||"",n=new m1;return typeof t=="string"&&(n.value=t),n}function b8(e,t){const n=t.allowedElements,i=t.allowElement,s=t.components,l=t.disallowedElements,c=t.skipHtml,d=t.unwrapDisallowed,f=t.urlTransform||y8;for(const m of p8)Object.hasOwn(t,m.from)&&(""+m.from+(m.to?"use `"+m.to+"` instead":"remove it")+d8+m.id,void 0);return gd(e,p),D9(e,{Fragment:S.Fragment,components:s,ignoreInvalidStyle:!0,jsx:S.jsx,jsxs:S.jsxs,passKeys:!0,passNode:!0});function p(m,g,y){if(m.type==="raw"&&y&&typeof g=="number")return c?y.children.splice(g,1):y.children[g]={type:"text",value:m.value},g;if(m.type==="element"){let v;for(v in Kp)if(Object.hasOwn(Kp,v)&&Object.hasOwn(m.properties,v)){const _=m.properties[v],T=Kp[v];(T===null||T.includes(m.tagName))&&(m.properties[v]=f(String(_||""),v,m))}}if(m.type==="element"){let v=n?!n.includes(m.tagName):l?l.includes(m.tagName):!1;if(!v&&i&&typeof g=="number"&&(v=!i(m,g,y)),v&&y&&typeof g=="number")return d&&m.children?y.children.splice(g,1,...m.children):y.children.splice(g,1),g}}}function y8(e){const t=e.indexOf(":"),n=e.indexOf("?"),i=e.indexOf("#"),s=e.indexOf("/");return t===-1||s!==-1&&t>s||n!==-1&&t>n||i!==-1&&t>i||f8.test(e.slice(0,t))?e:""}function hw(e,t){const n=String(e);if(typeof t!="string")throw new TypeError("Expected character");let i=0,s=n.indexOf(t);for(;s!==-1;)i++,s=n.indexOf(t,s+t.length);return i}function v8(e){if(typeof e!="string")throw new TypeError("Expected a string");return e.replace(/[|\\{}()[\]^$+*?.]/g,"\\$&").replace(/-/g,"\\x2d")}function _8(e,t,n){const s=Oo((n||{}).ignore||[]),l=x8(t);let c=-1;for(;++c<l.length;)h1(e,"text",d);function d(p,m){let g=-1,y;for(;++g<m.length;){const v=m[g],_=y?y.children:void 0;if(s(v,_?_.indexOf(v):void 0,y))return;y=v}if(y)return f(p,m)}function f(p,m){const g=m[m.length-1],y=l[c][0],v=l[c][1];let _=0;const N=g.children.indexOf(p);let C=!1,P=[];y.lastIndex=0;let k=y.exec(p.value);for(;k;){const I=k.index,D={index:k.index,input:k.input,stack:[...m,p]};let M=v(...k,D);if(typeof M=="string"&&(M=M.length>0?{type:"text",value:M}:void 0),M===!1?y.lastIndex=I+1:(_!==I&&P.push({type:"text",value:p.value.slice(_,I)}),Array.isArray(M)?P.push(...M):M&&P.push(M),_=I+k[0].length,C=!0),!y.global)break;k=y.exec(p.value)}return C?(_<p.value.length&&P.push({type:"text",value:p.value.slice(_)}),g.children.splice(N,1,...P)):P=[p],N+P.length}}function x8(e){const t=[];if(!Array.isArray(e))throw new TypeError("Expected find and replace tuple or list of tuples");const n=!e[0]||Array.isArray(e[0])?e:[e];let i=-1;for(;++i<n.length;){const s=n[i];t.push([w8(s[0]),E8(s[1])])}return t}function w8(e){return typeof e=="string"?new RegExp(v8(e),"g"):e}function E8(e){return typeof e=="function"?e:function(){return e}}const ih="phrasing",ah=["autolink","link","image","label"];function S8(){return{transforms:[D8],enter:{literalAutolink:T8,literalAutolinkEmail:sh,literalAutolinkHttp:sh,literalAutolinkWww:sh},exit:{literalAutolink:A8,literalAutolinkEmail:N8,literalAutolinkHttp:O8,literalAutolinkWww:R8}}}function C8(){return{unsafe:[{character:"@",before:"[+\\-.\\w]",after:"[\\-.\\w]",inConstruct:ih,notInConstruct:ah},{character:".",before:"[Ww]",after:"[\\-.\\w]",inConstruct:ih,notInConstruct:ah},{character:":",before:"[ps]",after:"\\/",inConstruct:ih,notInConstruct:ah}]}}function T8(e){this.enter({type:"link",title:null,url:"",children:[]},e)}function sh(e){this.config.enter.autolinkProtocol.call(this,e)}function O8(e){this.config.exit.autolinkProtocol.call(this,e)}function R8(e){this.config.exit.data.call(this,e);const t=this.stack[this.stack.length-1];t.type,t.url="http://"+this.sliceSerialize(e)}function N8(e){this.config.exit.autolinkEmail.call(this,e)}function A8(e){this.exit(e)}function D8(e){_8(e,[[/(https?:\/\/|www(?=\.))([-.\w]+)([^ \t\r\n]*)/gi,k8],[new RegExp("(?<=^|\\s|\\p{P}|\\p{S})([-.\\w+]+)@([-\\w]+(?:\\.[-\\w]+)+)","gu"),M8]],{ignore:["link","linkReference"]})}function k8(e,t,n,i,s){let l="";if(!g1(s)||(/^w/i.test(t)&&(n=t+n,t="",l="http://"),!P8(n)))return!1;const c=I8(n+i);if(!c[0])return!1;const d={type:"link",title:null,url:l+t+c[0],children:[{type:"text",value:t+c[0]}]};return c[1]?[d,{type:"text",value:c[1]}]:d}function M8(e,t,n,i){return!g1(i,!0)||/[-\d_]$/.test(n)?!1:{type:"link",title:null,url:"mailto:"+t+"@"+n,children:[{type:"text",value:t+"@"+n}]}}function P8(e){const t=e.split(".");return!(t.length<2||t[t.length-1]&&(/_/.test(t[t.length-1])||!/[a-zA-Z\d]/.test(t[t.length-1]))||t[t.length-2]&&(/_/.test(t[t.length-2])||!/[a-zA-Z\d]/.test(t[t.length-2])))}function I8(e){const t=/[!"&'),.:;<>?\]}]+$/.exec(e);if(!t)return[e,void 0];e=e.slice(0,t.index);let n=t[0],i=n.indexOf(")");const s=hw(e,"(");let l=hw(e,")");for(;i!==-1&&s>l;)e+=n.slice(0,i+1),n=n.slice(i+1),i=n.indexOf(")"),l++;return[e,n]}function g1(e,t){const n=e.input.charCodeAt(e.index-1);return(e.index===0||$a(n)||fd(n))&&(!t||n!==47)}b1.peek=q8;function L8(){this.buffer()}function j8(e){this.enter({type:"footnoteReference",identifier:"",label:""},e)}function $8(){this.buffer()}function z8(e){this.enter({type:"footnoteDefinition",identifier:"",label:"",children:[]},e)}function B8(e){const t=this.resume(),n=this.stack[this.stack.length-1];n.type,n.identifier=jr(this.sliceSerialize(e)).toLowerCase(),n.label=t}function F8(e){this.exit(e)}function U8(e){const t=this.resume(),n=this.stack[this.stack.length-1];n.type,n.identifier=jr(this.sliceSerialize(e)).toLowerCase(),n.label=t}function H8(e){this.exit(e)}function q8(){return"["}function b1(e,t,n,i){const s=n.createTracker(i);let l=s.move("[^");const c=n.enter("footnoteReference"),d=n.enter("reference");return l+=s.move(n.safe(n.associationId(e),{after:"]",before:l})),d(),c(),l+=s.move("]"),l}function G8(){return{enter:{gfmFootnoteCallString:L8,gfmFootnoteCall:j8,gfmFootnoteDefinitionLabelString:$8,gfmFootnoteDefinition:z8},exit:{gfmFootnoteCallString:B8,gfmFootnoteCall:F8,gfmFootnoteDefinitionLabelString:U8,gfmFootnoteDefinition:H8}}}function V8(e){let t=!1;return e&&e.firstLineBlank&&(t=!0),{handlers:{footnoteDefinition:n,footnoteReference:b1},unsafe:[{character:"[",inConstruct:["label","phrasing","reference"]}]};function n(i,s,l,c){const d=l.createTracker(c);let f=d.move("[^");const p=l.enter("footnoteDefinition"),m=l.enter("label");return f+=d.move(l.safe(l.associationId(i),{before:f,after:"]"})),m(),f+=d.move("]:"),i.children&&i.children.length>0&&(d.shift(4),f+=d.move((t?`
`:" ")+l.indentLines(l.containerFlow(i,d.current()),t?y1:K8))),p(),f}}function K8(e,t,n){return t===0?e:y1(e,t,n)}function y1(e,t,n){return(n?"":"    ")+e}const Y8=["autolink","destinationLiteral","destinationRaw","reference","titleQuote","titleApostrophe"];v1.peek=J8;function X8(){return{canContainEols:["delete"],enter:{strikethrough:Z8},exit:{strikethrough:Q8}}}function W8(){return{unsafe:[{character:"~",inConstruct:"phrasing",notInConstruct:Y8}],handlers:{delete:v1}}}function Z8(e){this.enter({type:"delete",children:[]},e)}function Q8(e){this.exit(e)}function v1(e,t,n,i){const s=n.createTracker(i),l=n.enter("strikethrough");let c=s.move("~~");return c+=n.containerPhrasing(e,{...s.current(),before:c,after:"~"}),c+=s.move("~~"),l(),c}function J8(){return"~"}function eq(e){return e.length}function tq(e,t){const n=t||{},i=(n.align||[]).concat(),s=n.stringLength||eq,l=[],c=[],d=[],f=[];let p=0,m=-1;for(;++m<e.length;){const T=[],N=[];let C=-1;for(e[m].length>p&&(p=e[m].length);++C<e[m].length;){const P=nq(e[m][C]);if(n.alignDelimiters!==!1){const k=s(P);N[C]=k,(f[C]===void 0||k>f[C])&&(f[C]=k)}T.push(P)}c[m]=T,d[m]=N}let g=-1;if(typeof i=="object"&&"length"in i)for(;++g<p;)l[g]=mw(i[g]);else{const T=mw(i);for(;++g<p;)l[g]=T}g=-1;const y=[],v=[];for(;++g<p;){const T=l[g];let N="",C="";T===99?(N=":",C=":"):T===108?N=":":T===114&&(C=":");let P=n.alignDelimiters===!1?1:Math.max(1,f[g]-N.length-C.length);const k=N+"-".repeat(P)+C;n.alignDelimiters!==!1&&(P=N.length+P+C.length,P>f[g]&&(f[g]=P),v[g]=P),y[g]=k}c.splice(1,0,y),d.splice(1,0,v),m=-1;const _=[];for(;++m<c.length;){const T=c[m],N=d[m];g=-1;const C=[];for(;++g<p;){const P=T[g]||"";let k="",I="";if(n.alignDelimiters!==!1){const D=f[g]-(N[g]||0),M=l[g];M===114?k=" ".repeat(D):M===99?D%2?(k=" ".repeat(D/2+.5),I=" ".repeat(D/2-.5)):(k=" ".repeat(D/2),I=k):I=" ".repeat(D)}n.delimiterStart!==!1&&!g&&C.push("|"),n.padding!==!1&&!(n.alignDelimiters===!1&&P==="")&&(n.delimiterStart!==!1||g)&&C.push(" "),n.alignDelimiters!==!1&&C.push(k),C.push(P),n.alignDelimiters!==!1&&C.push(I),n.padding!==!1&&C.push(" "),(n.delimiterEnd!==!1||g!==p-1)&&C.push("|")}_.push(n.delimiterEnd===!1?C.join("").replace(/ +$/,""):C.join(""))}return _.join(`
`)}function nq(e){return e==null?"":String(e)}function mw(e){const t=typeof e=="string"?e.codePointAt(0):0;return t===67||t===99?99:t===76||t===108?108:t===82||t===114?114:0}function rq(e,t,n,i){const s=n.enter("blockquote"),l=n.createTracker(i);l.move("> "),l.shift(2);const c=n.indentLines(n.containerFlow(e,l.current()),iq);return s(),c}function iq(e,t,n){return">"+(n?"":" ")+e}function aq(e,t){return gw(e,t.inConstruct,!0)&&!gw(e,t.notInConstruct,!1)}function gw(e,t,n){if(typeof t=="string"&&(t=[t]),!t||t.length===0)return n;let i=-1;for(;++i<t.length;)if(e.includes(t[i]))return!0;return!1}function bw(e,t,n,i){let s=-1;for(;++s<n.unsafe.length;)if(n.unsafe[s].character===`
`&&aq(n.stack,n.unsafe[s]))return/[ \t]/.test(i.before)?"":" ";return`\\
`}function sq(e,t){const n=String(e);let i=n.indexOf(t),s=i,l=0,c=0;if(typeof t!="string")throw new TypeError("Expected substring");for(;i!==-1;)i===s?++l>c&&(c=l):l=1,s=i+t.length,i=n.indexOf(t,s);return c}function lq(e,t){return!!(t.options.fences===!1&&e.value&&!e.lang&&/[^ \r\n]/.test(e.value)&&!/^[\t ]*(?:[\r\n]|$)|(?:^|[\r\n])[\t ]*$/.test(e.value))}function oq(e){const t=e.options.fence||"`";if(t!=="`"&&t!=="~")throw new Error("Cannot serialize code with `"+t+"` for `options.fence`, expected `` ` `` or `~`");return t}function cq(e,t,n,i){const s=oq(n),l=e.value||"",c=s==="`"?"GraveAccent":"Tilde";if(lq(e,n)){const g=n.enter("codeIndented"),y=n.indentLines(l,uq);return g(),y}const d=n.createTracker(i),f=s.repeat(Math.max(sq(l,s)+1,3)),p=n.enter("codeFenced");let m=d.move(f);if(e.lang){const g=n.enter(`codeFencedLang${c}`);m+=d.move(n.safe(e.lang,{before:m,after:" ",encode:["`"],...d.current()})),g()}if(e.lang&&e.meta){const g=n.enter(`codeFencedMeta${c}`);m+=d.move(" "),m+=d.move(n.safe(e.meta,{before:m,after:`
`,encode:["`"],...d.current()})),g()}return m+=d.move(`
`),l&&(m+=d.move(l+`
`)),m+=d.move(f),p(),m}function uq(e,t,n){return(n?"":"    ")+e}function Bb(e){const t=e.options.quote||'"';if(t!=='"'&&t!=="'")throw new Error("Cannot serialize title with `"+t+"` for `options.quote`, expected `\"`, or `'`");return t}function dq(e,t,n,i){const s=Bb(n),l=s==='"'?"Quote":"Apostrophe",c=n.enter("definition");let d=n.enter("label");const f=n.createTracker(i);let p=f.move("[");return p+=f.move(n.safe(n.associationId(e),{before:p,after:"]",...f.current()})),p+=f.move("]: "),d(),!e.url||/[\0- \u007F]/.test(e.url)?(d=n.enter("destinationLiteral"),p+=f.move("<"),p+=f.move(n.safe(e.url,{before:p,after:">",...f.current()})),p+=f.move(">")):(d=n.enter("destinationRaw"),p+=f.move(n.safe(e.url,{before:p,after:e.title?" ":`
`,...f.current()}))),d(),e.title&&(d=n.enter(`title${l}`),p+=f.move(" "+s),p+=f.move(n.safe(e.title,{before:p,after:s,...f.current()})),p+=f.move(s),d()),c(),p}function fq(e){const t=e.options.emphasis||"*";if(t!=="*"&&t!=="_")throw new Error("Cannot serialize emphasis with `"+t+"` for `options.emphasis`, expected `*`, or `_`");return t}function bo(e){return"&#x"+e.toString(16).toUpperCase()+";"}function Uu(e,t,n){const i=Ls(e),s=Ls(t);return i===void 0?s===void 0?n==="_"?{inside:!0,outside:!0}:{inside:!1,outside:!1}:s===1?{inside:!0,outside:!0}:{inside:!1,outside:!0}:i===1?s===void 0?{inside:!1,outside:!1}:s===1?{inside:!0,outside:!0}:{inside:!1,outside:!1}:s===void 0?{inside:!1,outside:!1}:s===1?{inside:!0,outside:!1}:{inside:!1,outside:!1}}_1.peek=pq;function _1(e,t,n,i){const s=fq(n),l=n.enter("emphasis"),c=n.createTracker(i),d=c.move(s);let f=c.move(n.containerPhrasing(e,{after:s,before:d,...c.current()}));const p=f.charCodeAt(0),m=Uu(i.before.charCodeAt(i.before.length-1),p,s);m.inside&&(f=bo(p)+f.slice(1));const g=f.charCodeAt(f.length-1),y=Uu(i.after.charCodeAt(0),g,s);y.inside&&(f=f.slice(0,-1)+bo(g));const v=c.move(s);return l(),n.attentionEncodeSurroundingInfo={after:y.outside,before:m.outside},d+f+v}function pq(e,t,n){return n.options.emphasis||"*"}function hq(e,t){let n=!1;return gd(e,function(i){if("value"in i&&/\r?\n|\r/.test(i.value)||i.type==="break")return n=!0,$g}),!!((!e.depth||e.depth<3)&&kb(e)&&(t.options.setext||n))}function mq(e,t,n,i){const s=Math.max(Math.min(6,e.depth||1),1),l=n.createTracker(i);if(hq(e,n)){const m=n.enter("headingSetext"),g=n.enter("phrasing"),y=n.containerPhrasing(e,{...l.current(),before:`
`,after:`
`});return g(),m(),y+`
`+(s===1?"=":"-").repeat(y.length-(Math.max(y.lastIndexOf("\r"),y.lastIndexOf(`
`))+1))}const c="#".repeat(s),d=n.enter("headingAtx"),f=n.enter("phrasing");l.move(c+" ");let p=n.containerPhrasing(e,{before:"# ",after:`
`,...l.current()});return/^[\t ]/.test(p)&&(p=bo(p.charCodeAt(0))+p.slice(1)),p=p?c+" "+p:c,n.options.closeAtx&&(p+=" "+c),f(),d(),p}x1.peek=gq;function x1(e){return e.value||""}function gq(){return"<"}w1.peek=bq;function w1(e,t,n,i){const s=Bb(n),l=s==='"'?"Quote":"Apostrophe",c=n.enter("image");let d=n.enter("label");const f=n.createTracker(i);let p=f.move("![");return p+=f.move(n.safe(e.alt,{before:p,after:"]",...f.current()})),p+=f.move("]("),d(),!e.url&&e.title||/[\0- \u007F]/.test(e.url)?(d=n.enter("destinationLiteral"),p+=f.move("<"),p+=f.move(n.safe(e.url,{before:p,after:">",...f.current()})),p+=f.move(">")):(d=n.enter("destinationRaw"),p+=f.move(n.safe(e.url,{before:p,after:e.title?" ":")",...f.current()}))),d(),e.title&&(d=n.enter(`title${l}`),p+=f.move(" "+s),p+=f.move(n.safe(e.title,{before:p,after:s,...f.current()})),p+=f.move(s),d()),p+=f.move(")"),c(),p}function bq(){return"!"}E1.peek=yq;function E1(e,t,n,i){const s=e.referenceType,l=n.enter("imageReference");let c=n.enter("label");const d=n.createTracker(i);let f=d.move("![");const p=n.safe(e.alt,{before:f,after:"]",...d.current()});f+=d.move(p+"]["),c();const m=n.stack;n.stack=[],c=n.enter("reference");const g=n.safe(n.associationId(e),{before:f,after:"]",...d.current()});return c(),n.stack=m,l(),s==="full"||!p||p!==g?f+=d.move(g+"]"):s==="shortcut"?f=f.slice(0,-1):f+=d.move("]"),f}function yq(){return"!"}S1.peek=vq;function S1(e,t,n){let i=e.value||"",s="`",l=-1;for(;new RegExp("(^|[^`])"+s+"([^`]|$)").test(i);)s+="`";for(/[^ \r\n]/.test(i)&&(/^[ \r\n]/.test(i)&&/[ \r\n]$/.test(i)||/^`|`$/.test(i))&&(i=" "+i+" ");++l<n.unsafe.length;){const c=n.unsafe[l],d=n.compilePattern(c);let f;if(c.atBreak)for(;f=d.exec(i);){let p=f.index;i.charCodeAt(p)===10&&i.charCodeAt(p-1)===13&&p--,i=i.slice(0,p)+" "+i.slice(f.index+1)}}return s+i+s}function vq(){return"`"}function C1(e,t){const n=kb(e);return!!(!t.options.resourceLink&&e.url&&!e.title&&e.children&&e.children.length===1&&e.children[0].type==="text"&&(n===e.url||"mailto:"+n===e.url)&&/^[a-z][a-z+.-]+:/i.test(e.url)&&!/[\0- <>\u007F]/.test(e.url))}T1.peek=_q;function T1(e,t,n,i){const s=Bb(n),l=s==='"'?"Quote":"Apostrophe",c=n.createTracker(i);let d,f;if(C1(e,n)){const m=n.stack;n.stack=[],d=n.enter("autolink");let g=c.move("<");return g+=c.move(n.containerPhrasing(e,{before:g,after:">",...c.current()})),g+=c.move(">"),d(),n.stack=m,g}d=n.enter("link"),f=n.enter("label");let p=c.move("[");return p+=c.move(n.containerPhrasing(e,{before:p,after:"](",...c.current()})),p+=c.move("]("),f(),!e.url&&e.title||/[\0- \u007F]/.test(e.url)?(f=n.enter("destinationLiteral"),p+=c.move("<"),p+=c.move(n.safe(e.url,{before:p,after:">",...c.current()})),p+=c.move(">")):(f=n.enter("destinationRaw"),p+=c.move(n.safe(e.url,{before:p,after:e.title?" ":")",...c.current()}))),f(),e.title&&(f=n.enter(`title${l}`),p+=c.move(" "+s),p+=c.move(n.safe(e.title,{before:p,after:s,...c.current()})),p+=c.move(s),f()),p+=c.move(")"),d(),p}function _q(e,t,n){return C1(e,n)?"<":"["}O1.peek=xq;function O1(e,t,n,i){const s=e.referenceType,l=n.enter("linkReference");let c=n.enter("label");const d=n.createTracker(i);let f=d.move("[");const p=n.containerPhrasing(e,{before:f,after:"]",...d.current()});f+=d.move(p+"]["),c();const m=n.stack;n.stack=[],c=n.enter("reference");const g=n.safe(n.associationId(e),{before:f,after:"]",...d.current()});return c(),n.stack=m,l(),s==="full"||!p||p!==g?f+=d.move(g+"]"):s==="shortcut"?f=f.slice(0,-1):f+=d.move("]"),f}function xq(){return"["}function Fb(e){const t=e.options.bullet||"*";if(t!=="*"&&t!=="+"&&t!=="-")throw new Error("Cannot serialize items with `"+t+"` for `options.bullet`, expected `*`, `+`, or `-`");return t}function wq(e){const t=Fb(e),n=e.options.bulletOther;if(!n)return t==="*"?"-":"*";if(n!=="*"&&n!=="+"&&n!=="-")throw new Error("Cannot serialize items with `"+n+"` for `options.bulletOther`, expected `*`, `+`, or `-`");if(n===t)throw new Error("Expected `bullet` (`"+t+"`) and `bulletOther` (`"+n+"`) to be different");return n}function Eq(e){const t=e.options.bulletOrdered||".";if(t!=="."&&t!==")")throw new Error("Cannot serialize items with `"+t+"` for `options.bulletOrdered`, expected `.` or `)`");return t}function R1(e){const t=e.options.rule||"*";if(t!=="*"&&t!=="-"&&t!=="_")throw new Error("Cannot serialize rules with `"+t+"` for `options.rule`, expected `*`, `-`, or `_`");return t}function Sq(e,t,n,i){const s=n.enter("list"),l=n.bulletCurrent;let c=e.ordered?Eq(n):Fb(n);const d=e.ordered?c==="."?")":".":wq(n);let f=t&&n.bulletLastUsed?c===n.bulletLastUsed:!1;if(!e.ordered){const m=e.children?e.children[0]:void 0;if((c==="*"||c==="-")&&m&&(!m.children||!m.children[0])&&n.stack[n.stack.length-1]==="list"&&n.stack[n.stack.length-2]==="listItem"&&n.stack[n.stack.length-3]==="list"&&n.stack[n.stack.length-4]==="listItem"&&n.indexStack[n.indexStack.length-1]===0&&n.indexStack[n.indexStack.length-2]===0&&n.indexStack[n.indexStack.length-3]===0&&(f=!0),R1(n)===c&&m){let g=-1;for(;++g<e.children.length;){const y=e.children[g];if(y&&y.type==="listItem"&&y.children&&y.children[0]&&y.children[0].type==="thematicBreak"){f=!0;break}}}}f&&(c=d),n.bulletCurrent=c;const p=n.containerFlow(e,i);return n.bulletLastUsed=c,n.bulletCurrent=l,s(),p}function Cq(e){const t=e.options.listItemIndent||"one";if(t!=="tab"&&t!=="one"&&t!=="mixed")throw new Error("Cannot serialize items with `"+t+"` for `options.listItemIndent`, expected `tab`, `one`, or `mixed`");return t}function Tq(e,t,n,i){const s=Cq(n);let l=n.bulletCurrent||Fb(n);t&&t.type==="list"&&t.ordered&&(l=(typeof t.start=="number"&&t.start>-1?t.start:1)+(n.options.incrementListMarker===!1?0:t.children.indexOf(e))+l);let c=l.length+1;(s==="tab"||s==="mixed"&&(t&&t.type==="list"&&t.spread||e.spread))&&(c=Math.ceil(c/4)*4);const d=n.createTracker(i);d.move(l+" ".repeat(c-l.length)),d.shift(c);const f=n.enter("listItem"),p=n.indentLines(n.containerFlow(e,d.current()),m);return f(),p;function m(g,y,v){return y?(v?"":" ".repeat(c))+g:(v?l:l+" ".repeat(c-l.length))+g}}function Oq(e,t,n,i){const s=n.enter("paragraph"),l=n.enter("phrasing"),c=n.containerPhrasing(e,i);return l(),s(),c}const Rq=Oo(["break","delete","emphasis","footnote","footnoteReference","image","imageReference","inlineCode","inlineMath","link","linkReference","mdxJsxTextElement","mdxTextExpression","strong","text","textDirective"]);function Nq(e,t,n,i){return(e.children.some(function(c){return Rq(c)})?n.containerPhrasing:n.containerFlow).call(n,e,i)}function Aq(e){const t=e.options.strong||"*";if(t!=="*"&&t!=="_")throw new Error("Cannot serialize strong with `"+t+"` for `options.strong`, expected `*`, or `_`");return t}N1.peek=Dq;function N1(e,t,n,i){const s=Aq(n),l=n.enter("strong"),c=n.createTracker(i),d=c.move(s+s);let f=c.move(n.containerPhrasing(e,{after:s,before:d,...c.current()}));const p=f.charCodeAt(0),m=Uu(i.before.charCodeAt(i.before.length-1),p,s);m.inside&&(f=bo(p)+f.slice(1));const g=f.charCodeAt(f.length-1),y=Uu(i.after.charCodeAt(0),g,s);y.inside&&(f=f.slice(0,-1)+bo(g));const v=c.move(s+s);return l(),n.attentionEncodeSurroundingInfo={after:y.outside,before:m.outside},d+f+v}function Dq(e,t,n){return n.options.strong||"*"}function kq(e,t,n,i){return n.safe(e.value,i)}function Mq(e){const t=e.options.ruleRepetition||3;if(t<3)throw new Error("Cannot serialize rules with repetition `"+t+"` for `options.ruleRepetition`, expected `3` or more");return t}function Pq(e,t,n){const i=(R1(n)+(n.options.ruleSpaces?" ":"")).repeat(Mq(n));return n.options.ruleSpaces?i.slice(0,-1):i}const A1={blockquote:rq,break:bw,code:cq,definition:dq,emphasis:_1,hardBreak:bw,heading:mq,html:x1,image:w1,imageReference:E1,inlineCode:S1,link:T1,linkReference:O1,list:Sq,listItem:Tq,paragraph:Oq,root:Nq,strong:N1,text:kq,thematicBreak:Pq};function Iq(){return{enter:{table:Lq,tableData:yw,tableHeader:yw,tableRow:$q},exit:{codeText:zq,table:jq,tableData:lh,tableHeader:lh,tableRow:lh}}}function Lq(e){const t=e._align;this.enter({type:"table",align:t.map(function(n){return n==="none"?null:n}),children:[]},e),this.data.inTable=!0}function jq(e){this.exit(e),this.data.inTable=void 0}function $q(e){this.enter({type:"tableRow",children:[]},e)}function lh(e){this.exit(e)}function yw(e){this.enter({type:"tableCell",children:[]},e)}function zq(e){let t=this.resume();this.data.inTable&&(t=t.replace(/\\([\\|])/g,Bq));const n=this.stack[this.stack.length-1];n.type,n.value=t,this.exit(e)}function Bq(e,t){return t==="|"?t:e}function Fq(e){const t=e||{},n=t.tableCellPadding,i=t.tablePipeAlign,s=t.stringLength,l=n?" ":"|";return{unsafe:[{character:"\r",inConstruct:"tableCell"},{character:`
`,inConstruct:"tableCell"},{atBreak:!0,character:"|",after:"[	 :-]"},{character:"|",inConstruct:"tableCell"},{atBreak:!0,character:":",after:"-"},{atBreak:!0,character:"-",after:"[:|-]"}],handlers:{inlineCode:y,table:c,tableCell:f,tableRow:d}};function c(v,_,T,N){return p(m(v,T,N),v.align)}function d(v,_,T,N){const C=g(v,T,N),P=p([C]);return P.slice(0,P.indexOf(`
`))}function f(v,_,T,N){const C=T.enter("tableCell"),P=T.enter("phrasing"),k=T.containerPhrasing(v,{...N,before:l,after:l});return P(),C(),k}function p(v,_){return tq(v,{align:_,alignDelimiters:i,padding:n,stringLength:s})}function m(v,_,T){const N=v.children;let C=-1;const P=[],k=_.enter("table");for(;++C<N.length;)P[C]=g(N[C],_,T);return k(),P}function g(v,_,T){const N=v.children;let C=-1;const P=[],k=_.enter("tableRow");for(;++C<N.length;)P[C]=f(N[C],v,_,T);return k(),P}function y(v,_,T){let N=A1.inlineCode(v,_,T);return T.stack.includes("tableCell")&&(N=N.replace(/\|/g,"\\$&")),N}}function Uq(){return{exit:{taskListCheckValueChecked:vw,taskListCheckValueUnchecked:vw,paragraph:qq}}}function Hq(){return{unsafe:[{atBreak:!0,character:"-",after:"[:|-]"}],handlers:{listItem:Gq}}}function vw(e){const t=this.stack[this.stack.length-2];t.type,t.checked=e.type==="taskListCheckValueChecked"}function qq(e){const t=this.stack[this.stack.length-2];if(t&&t.type==="listItem"&&typeof t.checked=="boolean"){const n=this.stack[this.stack.length-1];n.type;const i=n.children[0];if(i&&i.type==="text"){const s=t.children;let l=-1,c;for(;++l<s.length;){const d=s[l];if(d.type==="paragraph"){c=d;break}}c===n&&(i.value=i.value.slice(1),i.value.length===0?n.children.shift():n.position&&i.position&&typeof i.position.start.offset=="number"&&(i.position.start.column++,i.position.start.offset++,n.position.start=Object.assign({},i.position.start)))}}this.exit(e)}function Gq(e,t,n,i){const s=e.children[0],l=typeof e.checked=="boolean"&&s&&s.type==="paragraph",c="["+(e.checked?"x":" ")+"] ",d=n.createTracker(i);l&&d.move(c);let f=A1.listItem(e,t,n,{...i,...d.current()});return l&&(f=f.replace(/^(?:[*+-]|\d+\.)([\r\n]| {1,3})/,p)),f;function p(m){return m+c}}function Vq(){return[S8(),G8(),X8(),Iq(),Uq()]}function Kq(e){return{extensions:[C8(),V8(e),W8(),Fq(e),Hq()]}}const Yq={tokenize:eG,partial:!0},D1={tokenize:tG,partial:!0},k1={tokenize:nG,partial:!0},M1={tokenize:rG,partial:!0},Xq={tokenize:iG,partial:!0},P1={name:"wwwAutolink",tokenize:Qq,previous:L1},I1={name:"protocolAutolink",tokenize:Jq,previous:j1},Si={name:"emailAutolink",tokenize:Zq,previous:$1},Qr={};function Wq(){return{text:Qr}}let Da=48;for(;Da<123;)Qr[Da]=Si,Da++,Da===58?Da=65:Da===91&&(Da=97);Qr[43]=Si;Qr[45]=Si;Qr[46]=Si;Qr[95]=Si;Qr[72]=[Si,I1];Qr[104]=[Si,I1];Qr[87]=[Si,P1];Qr[119]=[Si,P1];function Zq(e,t,n){const i=this;let s,l;return c;function c(g){return!Ug(g)||!$1.call(i,i.previous)||Ub(i.events)?n(g):(e.enter("literalAutolink"),e.enter("literalAutolinkEmail"),d(g))}function d(g){return Ug(g)?(e.consume(g),d):g===64?(e.consume(g),f):n(g)}function f(g){return g===46?e.check(Xq,m,p)(g):g===45||g===95||Dn(g)?(l=!0,e.consume(g),f):m(g)}function p(g){return e.consume(g),s=!0,f}function m(g){return l&&s&&jn(i.previous)?(e.exit("literalAutolinkEmail"),e.exit("literalAutolink"),t(g)):n(g)}}function Qq(e,t,n){const i=this;return s;function s(c){return c!==87&&c!==119||!L1.call(i,i.previous)||Ub(i.events)?n(c):(e.enter("literalAutolink"),e.enter("literalAutolinkWww"),e.check(Yq,e.attempt(D1,e.attempt(k1,l),n),n)(c))}function l(c){return e.exit("literalAutolinkWww"),e.exit("literalAutolink"),t(c)}}function Jq(e,t,n){const i=this;let s="",l=!1;return c;function c(g){return(g===72||g===104)&&j1.call(i,i.previous)&&!Ub(i.events)?(e.enter("literalAutolink"),e.enter("literalAutolinkHttp"),s+=String.fromCodePoint(g),e.consume(g),d):n(g)}function d(g){if(jn(g)&&s.length<5)return s+=String.fromCodePoint(g),e.consume(g),d;if(g===58){const y=s.toLowerCase();if(y==="http"||y==="https")return e.consume(g),f}return n(g)}function f(g){return g===47?(e.consume(g),l?p:(l=!0,f)):n(g)}function p(g){return g===null||zu(g)||zt(g)||$a(g)||fd(g)?n(g):e.attempt(D1,e.attempt(k1,m),n)(g)}function m(g){return e.exit("literalAutolinkHttp"),e.exit("literalAutolink"),t(g)}}function eG(e,t,n){let i=0;return s;function s(c){return(c===87||c===119)&&i<3?(i++,e.consume(c),s):c===46&&i===3?(e.consume(c),l):n(c)}function l(c){return c===null?n(c):t(c)}}function tG(e,t,n){let i,s,l;return c;function c(p){return p===46||p===95?e.check(M1,f,d)(p):p===null||zt(p)||$a(p)||p!==45&&fd(p)?f(p):(l=!0,e.consume(p),c)}function d(p){return p===95?i=!0:(s=i,i=void 0),e.consume(p),c}function f(p){return s||i||!l?n(p):t(p)}}function nG(e,t){let n=0,i=0;return s;function s(c){return c===40?(n++,e.consume(c),s):c===41&&i<n?l(c):c===33||c===34||c===38||c===39||c===41||c===42||c===44||c===46||c===58||c===59||c===60||c===63||c===93||c===95||c===126?e.check(M1,t,l)(c):c===null||zt(c)||$a(c)?t(c):(e.consume(c),s)}function l(c){return c===41&&i++,e.consume(c),s}}function rG(e,t,n){return i;function i(d){return d===33||d===34||d===39||d===41||d===42||d===44||d===46||d===58||d===59||d===63||d===95||d===126?(e.consume(d),i):d===38?(e.consume(d),l):d===93?(e.consume(d),s):d===60||d===null||zt(d)||$a(d)?t(d):n(d)}function s(d){return d===null||d===40||d===91||zt(d)||$a(d)?t(d):i(d)}function l(d){return jn(d)?c(d):n(d)}function c(d){return d===59?(e.consume(d),i):jn(d)?(e.consume(d),c):n(d)}}function iG(e,t,n){return i;function i(l){return e.consume(l),s}function s(l){return Dn(l)?n(l):t(l)}}function L1(e){return e===null||e===40||e===42||e===95||e===91||e===93||e===126||zt(e)}function j1(e){return!jn(e)}function $1(e){return!(e===47||Ug(e))}function Ug(e){return e===43||e===45||e===46||e===95||Dn(e)}function Ub(e){let t=e.length,n=!1;for(;t--;){const i=e[t][1];if((i.type==="labelLink"||i.type==="labelImage")&&!i._balanced){n=!0;break}if(i._gfmAutolinkLiteralWalkedInto){n=!1;break}}return e.length>0&&!n&&(e[e.length-1][1]._gfmAutolinkLiteralWalkedInto=!0),n}const aG={tokenize:pG,partial:!0};function sG(){return{document:{91:{name:"gfmFootnoteDefinition",tokenize:uG,continuation:{tokenize:dG},exit:fG}},text:{91:{name:"gfmFootnoteCall",tokenize:cG},93:{name:"gfmPotentialFootnoteCall",add:"after",tokenize:lG,resolveTo:oG}}}}function lG(e,t,n){const i=this;let s=i.events.length;const l=i.parser.gfmFootnotes||(i.parser.gfmFootnotes=[]);let c;for(;s--;){const f=i.events[s][1];if(f.type==="labelImage"){c=f;break}if(f.type==="gfmFootnoteCall"||f.type==="labelLink"||f.type==="label"||f.type==="image"||f.type==="link")break}return d;function d(f){if(!c||!c._balanced)return n(f);const p=jr(i.sliceSerialize({start:c.end,end:i.now()}));return p.codePointAt(0)!==94||!l.includes(p.slice(1))?n(f):(e.enter("gfmFootnoteCallLabelMarker"),e.consume(f),e.exit("gfmFootnoteCallLabelMarker"),t(f))}}function oG(e,t){let n=e.length;for(;n--;)if(e[n][1].type==="labelImage"&&e[n][0]==="enter"){e[n][1];break}e[n+1][1].type="data",e[n+3][1].type="gfmFootnoteCallLabelMarker";const i={type:"gfmFootnoteCall",start:Object.assign({},e[n+3][1].start),end:Object.assign({},e[e.length-1][1].end)},s={type:"gfmFootnoteCallMarker",start:Object.assign({},e[n+3][1].end),end:Object.assign({},e[n+3][1].end)};s.end.column++,s.end.offset++,s.end._bufferIndex++;const l={type:"gfmFootnoteCallString",start:Object.assign({},s.end),end:Object.assign({},e[e.length-1][1].start)},c={type:"chunkString",contentType:"string",start:Object.assign({},l.start),end:Object.assign({},l.end)},d=[e[n+1],e[n+2],["enter",i,t],e[n+3],e[n+4],["enter",s,t],["exit",s,t],["enter",l,t],["enter",c,t],["exit",c,t],["exit",l,t],e[e.length-2],e[e.length-1],["exit",i,t]];return e.splice(n,e.length-n+1,...d),e}function cG(e,t,n){const i=this,s=i.parser.gfmFootnotes||(i.parser.gfmFootnotes=[]);let l=0,c;return d;function d(g){return e.enter("gfmFootnoteCall"),e.enter("gfmFootnoteCallLabelMarker"),e.consume(g),e.exit("gfmFootnoteCallLabelMarker"),f}function f(g){return g!==94?n(g):(e.enter("gfmFootnoteCallMarker"),e.consume(g),e.exit("gfmFootnoteCallMarker"),e.enter("gfmFootnoteCallString"),e.enter("chunkString").contentType="string",p)}function p(g){if(l>999||g===93&&!c||g===null||g===91||zt(g))return n(g);if(g===93){e.exit("chunkString");const y=e.exit("gfmFootnoteCallString");return s.includes(jr(i.sliceSerialize(y)))?(e.enter("gfmFootnoteCallLabelMarker"),e.consume(g),e.exit("gfmFootnoteCallLabelMarker"),e.exit("gfmFootnoteCall"),t):n(g)}return zt(g)||(c=!0),l++,e.consume(g),g===92?m:p}function m(g){return g===91||g===92||g===93?(e.consume(g),l++,p):p(g)}}function uG(e,t,n){const i=this,s=i.parser.gfmFootnotes||(i.parser.gfmFootnotes=[]);let l,c=0,d;return f;function f(_){return e.enter("gfmFootnoteDefinition")._container=!0,e.enter("gfmFootnoteDefinitionLabel"),e.enter("gfmFootnoteDefinitionLabelMarker"),e.consume(_),e.exit("gfmFootnoteDefinitionLabelMarker"),p}function p(_){return _===94?(e.enter("gfmFootnoteDefinitionMarker"),e.consume(_),e.exit("gfmFootnoteDefinitionMarker"),e.enter("gfmFootnoteDefinitionLabelString"),e.enter("chunkString").contentType="string",m):n(_)}function m(_){if(c>999||_===93&&!d||_===null||_===91||zt(_))return n(_);if(_===93){e.exit("chunkString");const T=e.exit("gfmFootnoteDefinitionLabelString");return l=jr(i.sliceSerialize(T)),e.enter("gfmFootnoteDefinitionLabelMarker"),e.consume(_),e.exit("gfmFootnoteDefinitionLabelMarker"),e.exit("gfmFootnoteDefinitionLabel"),y}return zt(_)||(d=!0),c++,e.consume(_),_===92?g:m}function g(_){return _===91||_===92||_===93?(e.consume(_),c++,m):m(_)}function y(_){return _===58?(e.enter("definitionMarker"),e.consume(_),e.exit("definitionMarker"),s.includes(l)||s.push(l),vt(e,v,"gfmFootnoteDefinitionWhitespace")):n(_)}function v(_){return t(_)}}function dG(e,t,n){return e.check(To,t,e.attempt(aG,t,n))}function fG(e){e.exit("gfmFootnoteDefinition")}function pG(e,t,n){const i=this;return vt(e,s,"gfmFootnoteDefinitionIndent",5);function s(l){const c=i.events[i.events.length-1];return c&&c[1].type==="gfmFootnoteDefinitionIndent"&&c[2].sliceSerialize(c[1],!0).length===4?t(l):n(l)}}function hG(e){let n=(e||{}).singleTilde;const i={name:"strikethrough",tokenize:l,resolveAll:s};return n==null&&(n=!0),{text:{126:i},insideSpan:{null:[i]},attentionMarkers:{null:[126]}};function s(c,d){let f=-1;for(;++f<c.length;)if(c[f][0]==="enter"&&c[f][1].type==="strikethroughSequenceTemporary"&&c[f][1]._close){let p=f;for(;p--;)if(c[p][0]==="exit"&&c[p][1].type==="strikethroughSequenceTemporary"&&c[p][1]._open&&c[f][1].end.offset-c[f][1].start.offset===c[p][1].end.offset-c[p][1].start.offset){c[f][1].type="strikethroughSequence",c[p][1].type="strikethroughSequence";const m={type:"strikethrough",start:Object.assign({},c[p][1].start),end:Object.assign({},c[f][1].end)},g={type:"strikethroughText",start:Object.assign({},c[p][1].end),end:Object.assign({},c[f][1].start)},y=[["enter",m,d],["enter",c[p][1],d],["exit",c[p][1],d],["enter",g,d]],v=d.parser.constructs.insideSpan.null;v&&dr(y,y.length,0,pd(v,c.slice(p+1,f),d)),dr(y,y.length,0,[["exit",g,d],["enter",c[f][1],d],["exit",c[f][1],d],["exit",m,d]]),dr(c,p-1,f-p+3,y),f=p+y.length-2;break}}for(f=-1;++f<c.length;)c[f][1].type==="strikethroughSequenceTemporary"&&(c[f][1].type="data");return c}function l(c,d,f){const p=this.previous,m=this.events;let g=0;return y;function y(_){return p===126&&m[m.length-1][1].type!=="characterEscape"?f(_):(c.enter("strikethroughSequenceTemporary"),v(_))}function v(_){const T=Ls(p);if(_===126)return g>1?f(_):(c.consume(_),g++,v);if(g<2&&!n)return f(_);const N=c.exit("strikethroughSequenceTemporary"),C=Ls(_);return N._open=!C||C===2&&!!T,N._close=!T||T===2&&!!C,d(_)}}}class mG{constructor(){this.map=[]}add(t,n,i){gG(this,t,n,i)}consume(t){if(this.map.sort(function(l,c){return l[0]-c[0]}),this.map.length===0)return;let n=this.map.length;const i=[];for(;n>0;)n-=1,i.push(t.slice(this.map[n][0]+this.map[n][1]),this.map[n][2]),t.length=this.map[n][0];i.push(t.slice()),t.length=0;let s=i.pop();for(;s;){for(const l of s)t.push(l);s=i.pop()}this.map.length=0}}function gG(e,t,n,i){let s=0;if(!(n===0&&i.length===0)){for(;s<e.map.length;){if(e.map[s][0]===t){e.map[s][1]+=n,e.map[s][2].push(...i);return}s+=1}e.map.push([t,n,i])}}function bG(e,t){let n=!1;const i=[];for(;t<e.length;){const s=e[t];if(n){if(s[0]==="enter")s[1].type==="tableContent"&&i.push(e[t+1][1].type==="tableDelimiterMarker"?"left":"none");else if(s[1].type==="tableContent"){if(e[t-1][1].type==="tableDelimiterMarker"){const l=i.length-1;i[l]=i[l]==="left"?"center":"right"}}else if(s[1].type==="tableDelimiterRow")break}else s[0]==="enter"&&s[1].type==="tableDelimiterRow"&&(n=!0);t+=1}return i}function yG(){return{flow:{null:{name:"table",tokenize:vG,resolveAll:_G}}}}function vG(e,t,n){const i=this;let s=0,l=0,c;return d;function d($){let re=i.events.length-1;for(;re>-1;){const ue=i.events[re][1].type;if(ue==="lineEnding"||ue==="linePrefix")re--;else break}const se=re>-1?i.events[re][1].type:null,Se=se==="tableHead"||se==="tableRow"?M:f;return Se===M&&i.parser.lazy[i.now().line]?n($):Se($)}function f($){return e.enter("tableHead"),e.enter("tableRow"),p($)}function p($){return $===124||(c=!0,l+=1),m($)}function m($){return $===null?n($):Fe($)?l>1?(l=0,i.interrupt=!0,e.exit("tableRow"),e.enter("lineEnding"),e.consume($),e.exit("lineEnding"),v):n($):ft($)?vt(e,m,"whitespace")($):(l+=1,c&&(c=!1,s+=1),$===124?(e.enter("tableCellDivider"),e.consume($),e.exit("tableCellDivider"),c=!0,m):(e.enter("data"),g($)))}function g($){return $===null||$===124||zt($)?(e.exit("data"),m($)):(e.consume($),$===92?y:g)}function y($){return $===92||$===124?(e.consume($),g):g($)}function v($){return i.interrupt=!1,i.parser.lazy[i.now().line]?n($):(e.enter("tableDelimiterRow"),c=!1,ft($)?vt(e,_,"linePrefix",i.parser.constructs.disable.null.includes("codeIndented")?void 0:4)($):_($))}function _($){return $===45||$===58?N($):$===124?(c=!0,e.enter("tableCellDivider"),e.consume($),e.exit("tableCellDivider"),T):D($)}function T($){return ft($)?vt(e,N,"whitespace")($):N($)}function N($){return $===58?(l+=1,c=!0,e.enter("tableDelimiterMarker"),e.consume($),e.exit("tableDelimiterMarker"),C):$===45?(l+=1,C($)):$===null||Fe($)?I($):D($)}function C($){return $===45?(e.enter("tableDelimiterFiller"),P($)):D($)}function P($){return $===45?(e.consume($),P):$===58?(c=!0,e.exit("tableDelimiterFiller"),e.enter("tableDelimiterMarker"),e.consume($),e.exit("tableDelimiterMarker"),k):(e.exit("tableDelimiterFiller"),k($))}function k($){return ft($)?vt(e,I,"whitespace")($):I($)}function I($){return $===124?_($):$===null||Fe($)?!c||s!==l?D($):(e.exit("tableDelimiterRow"),e.exit("tableHead"),t($)):D($)}function D($){return n($)}function M($){return e.enter("tableRow"),z($)}function z($){return $===124?(e.enter("tableCellDivider"),e.consume($),e.exit("tableCellDivider"),z):$===null||Fe($)?(e.exit("tableRow"),t($)):ft($)?vt(e,z,"whitespace")($):(e.enter("data"),Z($))}function Z($){return $===null||$===124||zt($)?(e.exit("data"),z($)):(e.consume($),$===92?W:Z)}function W($){return $===92||$===124?(e.consume($),Z):Z($)}}function _G(e,t){let n=-1,i=!0,s=0,l=[0,0,0,0],c=[0,0,0,0],d=!1,f=0,p,m,g;const y=new mG;for(;++n<e.length;){const v=e[n],_=v[1];v[0]==="enter"?_.type==="tableHead"?(d=!1,f!==0&&(_w(y,t,f,p,m),m=void 0,f=0),p={type:"table",start:Object.assign({},_.start),end:Object.assign({},_.end)},y.add(n,0,[["enter",p,t]])):_.type==="tableRow"||_.type==="tableDelimiterRow"?(i=!0,g=void 0,l=[0,0,0,0],c=[0,n+1,0,0],d&&(d=!1,m={type:"tableBody",start:Object.assign({},_.start),end:Object.assign({},_.end)},y.add(n,0,[["enter",m,t]])),s=_.type==="tableDelimiterRow"?2:m?3:1):s&&(_.type==="data"||_.type==="tableDelimiterMarker"||_.type==="tableDelimiterFiller")?(i=!1,c[2]===0&&(l[1]!==0&&(c[0]=c[1],g=tu(y,t,l,s,void 0,g),l=[0,0,0,0]),c[2]=n)):_.type==="tableCellDivider"&&(i?i=!1:(l[1]!==0&&(c[0]=c[1],g=tu(y,t,l,s,void 0,g)),l=c,c=[l[1],n,0,0])):_.type==="tableHead"?(d=!0,f=n):_.type==="tableRow"||_.type==="tableDelimiterRow"?(f=n,l[1]!==0?(c[0]=c[1],g=tu(y,t,l,s,n,g)):c[1]!==0&&(g=tu(y,t,c,s,n,g)),s=0):s&&(_.type==="data"||_.type==="tableDelimiterMarker"||_.type==="tableDelimiterFiller")&&(c[3]=n)}for(f!==0&&_w(y,t,f,p,m),y.consume(t.events),n=-1;++n<t.events.length;){const v=t.events[n];v[0]==="enter"&&v[1].type==="table"&&(v[1]._align=bG(t.events,n))}return e}function tu(e,t,n,i,s,l){const c=i===1?"tableHeader":i===2?"tableDelimiter":"tableData",d="tableContent";n[0]!==0&&(l.end=Object.assign({},Os(t.events,n[0])),e.add(n[0],0,[["exit",l,t]]));const f=Os(t.events,n[1]);if(l={type:c,start:Object.assign({},f),end:Object.assign({},f)},e.add(n[1],0,[["enter",l,t]]),n[2]!==0){const p=Os(t.events,n[2]),m=Os(t.events,n[3]),g={type:d,start:Object.assign({},p),end:Object.assign({},m)};if(e.add(n[2],0,[["enter",g,t]]),i!==2){const y=t.events[n[2]],v=t.events[n[3]];if(y[1].end=Object.assign({},v[1].end),y[1].type="chunkText",y[1].contentType="text",n[3]>n[2]+1){const _=n[2]+1,T=n[3]-n[2]-1;e.add(_,T,[])}}e.add(n[3]+1,0,[["exit",g,t]])}return s!==void 0&&(l.end=Object.assign({},Os(t.events,s)),e.add(s,0,[["exit",l,t]]),l=void 0),l}function _w(e,t,n,i,s){const l=[],c=Os(t.events,n);s&&(s.end=Object.assign({},c),l.push(["exit",s,t])),i.end=Object.assign({},c),l.push(["exit",i,t]),e.add(n+1,0,l)}function Os(e,t){const n=e[t],i=n[0]==="enter"?"start":"end";return n[1][i]}const xG={name:"tasklistCheck",tokenize:EG};function wG(){return{text:{91:xG}}}function EG(e,t,n){const i=this;return s;function s(f){return i.previous!==null||!i._gfmTasklistFirstContentOfListItem?n(f):(e.enter("taskListCheck"),e.enter("taskListCheckMarker"),e.consume(f),e.exit("taskListCheckMarker"),l)}function l(f){return zt(f)?(e.enter("taskListCheckValueUnchecked"),e.consume(f),e.exit("taskListCheckValueUnchecked"),c):f===88||f===120?(e.enter("taskListCheckValueChecked"),e.consume(f),e.exit("taskListCheckValueChecked"),c):n(f)}function c(f){return f===93?(e.enter("taskListCheckMarker"),e.consume(f),e.exit("taskListCheckMarker"),e.exit("taskListCheck"),d):n(f)}function d(f){return Fe(f)?t(f):ft(f)?e.check({tokenize:SG},t,n)(f):n(f)}}function SG(e,t,n){return vt(e,i,"whitespace");function i(s){return s===null?n(s):t(s)}}function CG(e){return XS([Wq(),sG(),hG(e),yG(),wG()])}const TG={};function OG(e){const t=this,n=e||TG,i=t.data(),s=i.micromarkExtensions||(i.micromarkExtensions=[]),l=i.fromMarkdownExtensions||(i.fromMarkdownExtensions=[]),c=i.toMarkdownExtensions||(i.toMarkdownExtensions=[]);s.push(CG(n)),l.push(Vq()),c.push(Kq(n))}const xw=(function(e,t,n){const i=Oo(n);if(!e||!e.type||!e.children)throw new Error("Expected parent node");if(typeof t=="number"){if(t<0||t===Number.POSITIVE_INFINITY)throw new Error("Expected positive finite number as index")}else if(t=e.children.indexOf(t),t<0)throw new Error("Expected child node or index");for(;++t<e.children.length;)if(i(e.children[t],t,e))return e.children[t]}),Ha=(function(e){if(e==null)return AG;if(typeof e=="string")return NG(e);if(typeof e=="object")return RG(e);if(typeof e=="function")return Hb(e);throw new Error("Expected function, string, or array as `test`")});function RG(e){const t=[];let n=-1;for(;++n<e.length;)t[n]=Ha(e[n]);return Hb(i);function i(...s){let l=-1;for(;++l<t.length;)if(t[l].apply(this,s))return!0;return!1}}function NG(e){return Hb(t);function t(n){return n.tagName===e}}function Hb(e){return t;function t(n,i,s){return!!(DG(n)&&e.call(this,n,typeof i=="number"?i:void 0,s||void 0))}}function AG(e){return!!(e&&typeof e=="object"&&"type"in e&&e.type==="element"&&"tagName"in e&&typeof e.tagName=="string")}function DG(e){return e!==null&&typeof e=="object"&&"type"in e&&"tagName"in e}const ww=/\n/g,Ew=/[\t ]+/g,Hg=Ha("br"),Sw=Ha(zG),kG=Ha("p"),Cw=Ha("tr"),MG=Ha(["datalist","head","noembed","noframes","noscript","rp","script","style","template","title",$G,BG]),z1=Ha(["address","article","aside","blockquote","body","caption","center","dd","dialog","dir","dl","dt","div","figure","figcaption","footer","form,","h1","h2","h3","h4","h5","h6","header","hgroup","hr","html","legend","li","listing","main","menu","nav","ol","p","plaintext","pre","section","ul","xmp"]);function PG(e,t){const n=t||{},i="children"in e?e.children:[],s=z1(e),l=U1(e,{whitespace:n.whitespace||"normal"}),c=[];(e.type==="text"||e.type==="comment")&&c.push(...F1(e,{breakBefore:!0,breakAfter:!0}));let d=-1;for(;++d<i.length;)c.push(...B1(i[d],e,{whitespace:l,breakBefore:d?void 0:s,breakAfter:d<i.length-1?Hg(i[d+1]):s}));const f=[];let p;for(d=-1;++d<c.length;){const m=c[d];typeof m=="number"?p!==void 0&&m>p&&(p=m):m&&(p!==void 0&&p>-1&&f.push(`
`.repeat(p)||" "),p=-1,f.push(m))}return f.join("")}function B1(e,t,n){return e.type==="element"?IG(e,t,n):e.type==="text"?n.whitespace==="normal"?F1(e,n):LG(e):[]}function IG(e,t,n){const i=U1(e,n),s=e.children||[];let l=-1,c=[];if(MG(e))return c;let d,f;for(Hg(e)||Cw(e)&&xw(t,e,Cw)?f=`
`:kG(e)?(d=2,f=2):z1(e)&&(d=1,f=1);++l<s.length;)c=c.concat(B1(s[l],e,{whitespace:i,breakBefore:l?void 0:d,breakAfter:l<s.length-1?Hg(s[l+1]):f}));return Sw(e)&&xw(t,e,Sw)&&c.push("	"),d&&c.unshift(d),f&&c.push(f),c}function F1(e,t){const n=String(e.value),i=[],s=[];let l=0;for(;l<=n.length;){ww.lastIndex=l;const f=ww.exec(n),p=f&&"index"in f?f.index:n.length;i.push(jG(n.slice(l,p).replace(/[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g,""),l===0?t.breakBefore:!0,p===n.length?t.breakAfter:!0)),l=p+1}let c=-1,d;for(;++c<i.length;)i[c].charCodeAt(i[c].length-1)===8203||c<i.length-1&&i[c+1].charCodeAt(0)===8203?(s.push(i[c]),d=void 0):i[c]?(typeof d=="number"&&s.push(d),s.push(i[c]),d=0):(c===0||c===i.length-1)&&s.push(0);return s}function LG(e){return[String(e.value)]}function jG(e,t,n){const i=[];let s=0,l;for(;s<e.length;){Ew.lastIndex=s;const c=Ew.exec(e);l=c?c.index:e.length,!s&&!l&&c&&!t&&i.push(""),s!==l&&i.push(e.slice(s,l)),s=c?l+c[0].length:l}return s!==l&&!n&&i.push(""),i.join(" ")}function U1(e,t){if(e.type==="element"){const n=e.properties||{};switch(e.tagName){case"listing":case"plaintext":case"xmp":return"pre";case"nobr":return"nowrap";case"pre":return n.wrap?"pre-wrap":"pre";case"td":case"th":return n.noWrap?"nowrap":t.whitespace;case"textarea":return"pre-wrap"}}return t.whitespace}function $G(e){return!!(e.properties||{}).hidden}function zG(e){return e.tagName==="td"||e.tagName==="th"}function BG(e){return e.tagName==="dialog"&&!(e.properties||{}).open}function FG(e){const t=e.regex,n=e.COMMENT("//","$",{contains:[{begin:/\\\n/}]}),i="decltype\\(auto\\)",s="[a-zA-Z_]\\w*::",c="(?!struct)("+i+"|"+t.optional(s)+"[a-zA-Z_]\\w*"+t.optional("<[^<>]+>")+")",d={className:"type",begin:"\\b[a-z\\d_]*_t\\b"},p={className:"string",variants:[{begin:'(u8?|U|L)?"',end:'"',illegal:"\\n",contains:[e.BACKSLASH_ESCAPE]},{begin:"(u8?|U|L)?'("+"\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)"+"|.)",end:"'",illegal:"."},e.END_SAME_AS_BEGIN({begin:/(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,end:/\)([^()\\ ]{0,16})"/})]},m={className:"number",variants:[{begin:"[+-]?(?:(?:[0-9](?:'?[0-9])*\\.(?:[0-9](?:'?[0-9])*)?|\\.[0-9](?:'?[0-9])*)(?:[Ee][+-]?[0-9](?:'?[0-9])*)?|[0-9](?:'?[0-9])*[Ee][+-]?[0-9](?:'?[0-9])*|0[Xx](?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*(?:\\.(?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)?)?|\\.[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)[Pp][+-]?[0-9](?:'?[0-9])*)(?:[Ff](?:16|32|64|128)?|(BF|bf)16|[Ll]|)"},{begin:"[+-]?\\b(?:0[Bb][01](?:'?[01])*|0[Xx][0-9A-Fa-f](?:'?[0-9A-Fa-f])*|0(?:'?[0-7])*|[1-9](?:'?[0-9])*)(?:[Uu](?:LL?|ll?)|[Uu][Zz]?|(?:LL?|ll?)[Uu]?|[Zz][Uu]|)"}],relevance:0},g={className:"meta",begin:/#\s*[a-z]+\b/,end:/$/,keywords:{keyword:"if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include"},contains:[{begin:/\\\n/,relevance:0},e.inherit(p,{className:"string"}),{className:"string",begin:/<.*?>/},n,e.C_BLOCK_COMMENT_MODE]},y={className:"title",begin:t.optional(s)+e.IDENT_RE,relevance:0},v=t.optional(s)+e.IDENT_RE+"\\s*\\(",_=["alignas","alignof","and","and_eq","asm","atomic_cancel","atomic_commit","atomic_noexcept","auto","bitand","bitor","break","case","catch","class","co_await","co_return","co_yield","compl","concept","const_cast|10","consteval","constexpr","constinit","continue","decltype","default","delete","do","dynamic_cast|10","else","enum","explicit","export","extern","false","final","for","friend","goto","if","import","inline","module","mutable","namespace","new","noexcept","not","not_eq","nullptr","operator","or","or_eq","override","private","protected","public","reflexpr","register","reinterpret_cast|10","requires","return","sizeof","static_assert","static_cast|10","struct","switch","synchronized","template","this","thread_local","throw","transaction_safe","transaction_safe_dynamic","true","try","typedef","typeid","typename","union","using","virtual","volatile","while","xor","xor_eq"],T=["bool","char","char16_t","char32_t","char8_t","double","float","int","long","short","void","wchar_t","unsigned","signed","const","static"],N=["any","auto_ptr","barrier","binary_semaphore","bitset","complex","condition_variable","condition_variable_any","counting_semaphore","deque","false_type","flat_map","flat_set","future","imaginary","initializer_list","istringstream","jthread","latch","lock_guard","multimap","multiset","mutex","optional","ostringstream","packaged_task","pair","promise","priority_queue","queue","recursive_mutex","recursive_timed_mutex","scoped_lock","set","shared_future","shared_lock","shared_mutex","shared_timed_mutex","shared_ptr","stack","string_view","stringstream","timed_mutex","thread","true_type","tuple","unique_lock","unique_ptr","unordered_map","unordered_multimap","unordered_multiset","unordered_set","variant","vector","weak_ptr","wstring","wstring_view"],C=["abort","abs","acos","apply","as_const","asin","atan","atan2","calloc","ceil","cerr","cin","clog","cos","cosh","cout","declval","endl","exchange","exit","exp","fabs","floor","fmod","forward","fprintf","fputs","free","frexp","fscanf","future","invoke","isalnum","isalpha","iscntrl","isdigit","isgraph","islower","isprint","ispunct","isspace","isupper","isxdigit","labs","launder","ldexp","log","log10","make_pair","make_shared","make_shared_for_overwrite","make_tuple","make_unique","malloc","memchr","memcmp","memcpy","memset","modf","move","pow","printf","putchar","puts","realloc","scanf","sin","sinh","snprintf","sprintf","sqrt","sscanf","std","stderr","stdin","stdout","strcat","strchr","strcmp","strcpy","strcspn","strlen","strncat","strncmp","strncpy","strpbrk","strrchr","strspn","strstr","swap","tan","tanh","terminate","to_underlying","tolower","toupper","vfprintf","visit","vprintf","vsprintf"],I={type:T,keyword:_,literal:["NULL","false","nullopt","nullptr","true"],built_in:["_Pragma"],_type_hints:N},D={className:"function.dispatch",relevance:0,keywords:{_hint:C},begin:t.concat(/\b/,/(?!decltype)/,/(?!if)/,/(?!for)/,/(?!switch)/,/(?!while)/,e.IDENT_RE,t.lookahead(/(<[^<>]+>|)\s*\(/))},M=[D,g,d,n,e.C_BLOCK_COMMENT_MODE,m,p],z={variants:[{begin:/=/,end:/;/},{begin:/\(/,end:/\)/},{beginKeywords:"new throw return else",end:/;/}],keywords:I,contains:M.concat([{begin:/\(/,end:/\)/,keywords:I,contains:M.concat(["self"]),relevance:0}]),relevance:0},Z={className:"function",begin:"("+c+"[\\*&\\s]+)+"+v,returnBegin:!0,end:/[{;=]/,excludeEnd:!0,keywords:I,illegal:/[^\w\s\*&:<>.]/,contains:[{begin:i,keywords:I,relevance:0},{begin:v,returnBegin:!0,contains:[y],relevance:0},{begin:/::/,relevance:0},{begin:/:/,endsWithParent:!0,contains:[p,m]},{relevance:0,match:/,/},{className:"params",begin:/\(/,end:/\)/,keywords:I,relevance:0,contains:[n,e.C_BLOCK_COMMENT_MODE,p,m,d,{begin:/\(/,end:/\)/,keywords:I,relevance:0,contains:["self",n,e.C_BLOCK_COMMENT_MODE,p,m,d]}]},d,n,e.C_BLOCK_COMMENT_MODE,g]};return{name:"C++",aliases:["cc","c++","h++","hpp","hh","hxx","cxx"],keywords:I,illegal:"</",classNameAliases:{"function.dispatch":"built_in"},contains:[].concat(z,Z,D,M,[g,{begin:"\\b(deque|list|queue|priority_queue|pair|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array|tuple|optional|variant|function|flat_map|flat_set)\\s*<(?!<)",end:">",keywords:I,contains:["self",d]},{begin:e.IDENT_RE+"::",keywords:I},{match:[/\b(?:enum(?:\s+(?:class|struct))?|class|struct|union)/,/\s+/,/\w+/],className:{1:"keyword",3:"title.class"}}])}}function UG(e){const t={type:["boolean","byte","word","String"],built_in:["KeyboardController","MouseController","SoftwareSerial","EthernetServer","EthernetClient","LiquidCrystal","RobotControl","GSMVoiceCall","EthernetUDP","EsploraTFT","HttpClient","RobotMotor","WiFiClient","GSMScanner","FileSystem","Scheduler","GSMServer","YunClient","YunServer","IPAddress","GSMClient","GSMModem","Keyboard","Ethernet","Console","GSMBand","Esplora","Stepper","Process","WiFiUDP","GSM_SMS","Mailbox","USBHost","Firmata","PImage","Client","Server","GSMPIN","FileIO","Bridge","Serial","EEPROM","Stream","Mouse","Audio","Servo","File","Task","GPRS","WiFi","Wire","TFT","GSM","SPI","SD"],_hints:["setup","loop","runShellCommandAsynchronously","analogWriteResolution","retrieveCallingNumber","printFirmwareVersion","analogReadResolution","sendDigitalPortPair","noListenOnLocalhost","readJoystickButton","setFirmwareVersion","readJoystickSwitch","scrollDisplayRight","getVoiceCallStatus","scrollDisplayLeft","writeMicroseconds","delayMicroseconds","beginTransmission","getSignalStrength","runAsynchronously","getAsynchronously","listenOnLocalhost","getCurrentCarrier","readAccelerometer","messageAvailable","sendDigitalPorts","lineFollowConfig","countryNameWrite","runShellCommand","readStringUntil","rewindDirectory","readTemperature","setClockDivider","readLightSensor","endTransmission","analogReference","detachInterrupt","countryNameRead","attachInterrupt","encryptionType","readBytesUntil","robotNameWrite","readMicrophone","robotNameRead","cityNameWrite","userNameWrite","readJoystickY","readJoystickX","mouseReleased","openNextFile","scanNetworks","noInterrupts","digitalWrite","beginSpeaker","mousePressed","isActionDone","mouseDragged","displayLogos","noAutoscroll","addParameter","remoteNumber","getModifiers","keyboardRead","userNameRead","waitContinue","processInput","parseCommand","printVersion","readNetworks","writeMessage","blinkVersion","cityNameRead","readMessage","setDataMode","parsePacket","isListening","setBitOrder","beginPacket","isDirectory","motorsWrite","drawCompass","digitalRead","clearScreen","serialEvent","rightToLeft","setTextSize","leftToRight","requestFrom","keyReleased","compassRead","analogWrite","interrupts","WiFiServer","disconnect","playMelody","parseFloat","autoscroll","getPINUsed","setPINUsed","setTimeout","sendAnalog","readSlider","analogRead","beginWrite","createChar","motorsStop","keyPressed","tempoWrite","readButton","subnetMask","debugPrint","macAddress","writeGreen","randomSeed","attachGPRS","readString","sendString","remotePort","releaseAll","mouseMoved","background","getXChange","getYChange","answerCall","getResult","voiceCall","endPacket","constrain","getSocket","writeJSON","getButton","available","connected","findUntil","readBytes","exitValue","readGreen","writeBlue","startLoop","IPAddress","isPressed","sendSysex","pauseMode","gatewayIP","setCursor","getOemKey","tuneWrite","noDisplay","loadImage","switchPIN","onRequest","onReceive","changePIN","playFile","noBuffer","parseInt","overflow","checkPIN","knobRead","beginTFT","bitClear","updateIR","bitWrite","position","writeRGB","highByte","writeRed","setSpeed","readBlue","noStroke","remoteIP","transfer","shutdown","hangCall","beginSMS","endWrite","attached","maintain","noCursor","checkReg","checkPUK","shiftOut","isValid","shiftIn","pulseIn","connect","println","localIP","pinMode","getIMEI","display","noBlink","process","getBand","running","beginSD","drawBMP","lowByte","setBand","release","bitRead","prepare","pointTo","readRed","setMode","noFill","remove","listen","stroke","detach","attach","noTone","exists","buffer","height","bitSet","circle","config","cursor","random","IRread","setDNS","endSMS","getKey","micros","millis","begin","print","write","ready","flush","width","isPIN","blink","clear","press","mkdir","rmdir","close","point","yield","image","BSSID","click","delay","read","text","move","peek","beep","rect","line","open","seek","fill","size","turn","stop","home","find","step","tone","sqrt","RSSI","SSID","end","bit","tan","cos","sin","pow","map","abs","max","min","get","run","put"],literal:["DIGITAL_MESSAGE","FIRMATA_STRING","ANALOG_MESSAGE","REPORT_DIGITAL","REPORT_ANALOG","INPUT_PULLUP","SET_PIN_MODE","INTERNAL2V56","SYSTEM_RESET","LED_BUILTIN","INTERNAL1V1","SYSEX_START","INTERNAL","EXTERNAL","DEFAULT","OUTPUT","INPUT","HIGH","LOW"]},n=FG(e),i=n.keywords;return i.type=[...i.type,...t.type],i.literal=[...i.literal,...t.literal],i.built_in=[...i.built_in,...t.built_in],i._hints=t._hints,n.name="Arduino",n.aliases=["ino"],n.supersetOf="cpp",n}function HG(e){const t=e.regex,n={},i={begin:/\$\{/,end:/\}/,contains:["self",{begin:/:-/,contains:[n]}]};Object.assign(n,{className:"variable",variants:[{begin:t.concat(/\$[\w\d#@][\w\d_]*/,"(?![\\w\\d])(?![$])")},i]});const s={className:"subst",begin:/\$\(/,end:/\)/,contains:[e.BACKSLASH_ESCAPE]},l=e.inherit(e.COMMENT(),{match:[/(^|\s)/,/#.*$/],scope:{2:"comment"}}),c={begin:/<<-?\s*(?=\w+)/,starts:{contains:[e.END_SAME_AS_BEGIN({begin:/(\w+)/,end:/(\w+)/,className:"string"})]}},d={className:"string",begin:/"/,end:/"/,contains:[e.BACKSLASH_ESCAPE,n,s]};s.contains.push(d);const f={match:/\\"/},p={className:"string",begin:/'/,end:/'/},m={match:/\\'/},g={begin:/\$?\(\(/,end:/\)\)/,contains:[{begin:/\d+#[0-9a-f]+/,className:"number"},e.NUMBER_MODE,n]},y=["fish","bash","zsh","sh","csh","ksh","tcsh","dash","scsh"],v=e.SHEBANG({binary:`(${y.join("|")})`,relevance:10}),_={className:"function",begin:/\w[\w\d_]*\s*\(\s*\)\s*\{/,returnBegin:!0,contains:[e.inherit(e.TITLE_MODE,{begin:/\w[\w\d_]*/})],relevance:0},T=["if","then","else","elif","fi","time","for","while","until","in","do","done","case","esac","coproc","function","select"],N=["true","false"],C={match:/(\/[a-z._-]+)+/},P=["break","cd","continue","eval","exec","exit","export","getopts","hash","pwd","readonly","return","shift","test","times","trap","umask","unset"],k=["alias","bind","builtin","caller","command","declare","echo","enable","help","let","local","logout","mapfile","printf","read","readarray","source","sudo","type","typeset","ulimit","unalias"],I=["autoload","bg","bindkey","bye","cap","chdir","clone","comparguments","compcall","compctl","compdescribe","compfiles","compgroups","compquote","comptags","comptry","compvalues","dirs","disable","disown","echotc","echoti","emulate","fc","fg","float","functions","getcap","getln","history","integer","jobs","kill","limit","log","noglob","popd","print","pushd","pushln","rehash","sched","setcap","setopt","stat","suspend","ttyctl","unfunction","unhash","unlimit","unsetopt","vared","wait","whence","where","which","zcompile","zformat","zftp","zle","zmodload","zparseopts","zprof","zpty","zregexparse","zsocket","zstyle","ztcp"],D=["chcon","chgrp","chown","chmod","cp","dd","df","dir","dircolors","ln","ls","mkdir","mkfifo","mknod","mktemp","mv","realpath","rm","rmdir","shred","sync","touch","truncate","vdir","b2sum","base32","base64","cat","cksum","comm","csplit","cut","expand","fmt","fold","head","join","md5sum","nl","numfmt","od","paste","ptx","pr","sha1sum","sha224sum","sha256sum","sha384sum","sha512sum","shuf","sort","split","sum","tac","tail","tr","tsort","unexpand","uniq","wc","arch","basename","chroot","date","dirname","du","echo","env","expr","factor","groups","hostid","id","link","logname","nice","nohup","nproc","pathchk","pinky","printenv","printf","pwd","readlink","runcon","seq","sleep","stat","stdbuf","stty","tee","test","timeout","tty","uname","unlink","uptime","users","who","whoami","yes"];return{name:"Bash",aliases:["sh","zsh"],keywords:{$pattern:/\b[a-z][a-z0-9._-]+\b/,keyword:T,literal:N,built_in:[...P,...k,"set","shopt",...I,...D]},contains:[v,e.SHEBANG(),_,g,l,c,C,d,f,p,m,n]}}function qG(e){const t=e.regex,n=e.COMMENT("//","$",{contains:[{begin:/\\\n/}]}),i="decltype\\(auto\\)",s="[a-zA-Z_]\\w*::",c="("+i+"|"+t.optional(s)+"[a-zA-Z_]\\w*"+t.optional("<[^<>]+>")+")",d={className:"type",variants:[{begin:"\\b[a-z\\d_]*_t\\b"},{match:/\batomic_[a-z]{3,6}\b/}]},p={className:"string",variants:[{begin:'(u8?|U|L)?"',end:'"',illegal:"\\n",contains:[e.BACKSLASH_ESCAPE]},{begin:"(u8?|U|L)?'("+"\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)"+"|.)",end:"'",illegal:"."},e.END_SAME_AS_BEGIN({begin:/(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,end:/\)([^()\\ ]{0,16})"/})]},m={className:"number",variants:[{match:/\b(0b[01']+)/},{match:/(-?)\b([\d']+(\.[\d']*)?|\.[\d']+)((ll|LL|l|L)(u|U)?|(u|U)(ll|LL|l|L)?|f|F|b|B)/},{match:/(-?)\b(0[xX][a-fA-F0-9]+(?:'[a-fA-F0-9]+)*(?:\.[a-fA-F0-9]*(?:'[a-fA-F0-9]*)*)?(?:[pP][-+]?[0-9]+)?(l|L)?(u|U)?)/},{match:/(-?)\b\d+(?:'\d+)*(?:\.\d*(?:'\d*)*)?(?:[eE][-+]?\d+)?/}],relevance:0},g={className:"meta",begin:/#\s*[a-z]+\b/,end:/$/,keywords:{keyword:"if else elif endif define undef warning error line pragma _Pragma ifdef ifndef elifdef elifndef include"},contains:[{begin:/\\\n/,relevance:0},e.inherit(p,{className:"string"}),{className:"string",begin:/<.*?>/},n,e.C_BLOCK_COMMENT_MODE]},y={className:"title",begin:t.optional(s)+e.IDENT_RE,relevance:0},v=t.optional(s)+e.IDENT_RE+"\\s*\\(",N={keyword:["asm","auto","break","case","continue","default","do","else","enum","extern","for","fortran","goto","if","inline","register","restrict","return","sizeof","typeof","typeof_unqual","struct","switch","typedef","union","volatile","while","_Alignas","_Alignof","_Atomic","_Generic","_Noreturn","_Static_assert","_Thread_local","alignas","alignof","noreturn","static_assert","thread_local","_Pragma"],type:["float","double","signed","unsigned","int","short","long","char","void","_Bool","_BitInt","_Complex","_Imaginary","_Decimal32","_Decimal64","_Decimal96","_Decimal128","_Decimal64x","_Decimal128x","_Float16","_Float32","_Float64","_Float128","_Float32x","_Float64x","_Float128x","const","static","constexpr","complex","bool","imaginary"],literal:"true false NULL",built_in:"std string wstring cin cout cerr clog stdin stdout stderr stringstream istringstream ostringstream auto_ptr deque list queue stack vector map set pair bitset multiset multimap unordered_set unordered_map unordered_multiset unordered_multimap priority_queue make_pair array shared_ptr abort terminate abs acos asin atan2 atan calloc ceil cosh cos exit exp fabs floor fmod fprintf fputs free frexp fscanf future isalnum isalpha iscntrl isdigit isgraph islower isprint ispunct isspace isupper isxdigit tolower toupper labs ldexp log10 log malloc realloc memchr memcmp memcpy memset modf pow printf putchar puts scanf sinh sin snprintf sprintf sqrt sscanf strcat strchr strcmp strcpy strcspn strlen strncat strncmp strncpy strpbrk strrchr strspn strstr tanh tan vfprintf vprintf vsprintf endl initializer_list unique_ptr"},C=[g,d,n,e.C_BLOCK_COMMENT_MODE,m,p],P={variants:[{begin:/=/,end:/;/},{begin:/\(/,end:/\)/},{beginKeywords:"new throw return else",end:/;/}],keywords:N,contains:C.concat([{begin:/\(/,end:/\)/,keywords:N,contains:C.concat(["self"]),relevance:0}]),relevance:0},k={begin:"("+c+"[\\*&\\s]+)+"+v,returnBegin:!0,end:/[{;=]/,excludeEnd:!0,keywords:N,illegal:/[^\w\s\*&:<>.]/,contains:[{begin:i,keywords:N,relevance:0},{begin:v,returnBegin:!0,contains:[e.inherit(y,{className:"title.function"})],relevance:0},{relevance:0,match:/,/},{className:"params",begin:/\(/,end:/\)/,keywords:N,relevance:0,contains:[n,e.C_BLOCK_COMMENT_MODE,p,m,d,{begin:/\(/,end:/\)/,keywords:N,relevance:0,contains:["self",n,e.C_BLOCK_COMMENT_MODE,p,m,d]}]},d,n,e.C_BLOCK_COMMENT_MODE,g]};return{name:"C",aliases:["h"],keywords:N,disableAutodetect:!0,illegal:"</",contains:[].concat(P,k,C,[g,{begin:e.IDENT_RE+"::",keywords:N},{className:"class",beginKeywords:"enum class struct union",end:/[{;:<>=]/,contains:[{beginKeywords:"final class struct"},e.TITLE_MODE]}]),exports:{preprocessor:g,strings:p,keywords:N}}}function GG(e){const t=e.regex,n=e.COMMENT("//","$",{contains:[{begin:/\\\n/}]}),i="decltype\\(auto\\)",s="[a-zA-Z_]\\w*::",c="(?!struct)("+i+"|"+t.optional(s)+"[a-zA-Z_]\\w*"+t.optional("<[^<>]+>")+")",d={className:"type",begin:"\\b[a-z\\d_]*_t\\b"},p={className:"string",variants:[{begin:'(u8?|U|L)?"',end:'"',illegal:"\\n",contains:[e.BACKSLASH_ESCAPE]},{begin:"(u8?|U|L)?'("+"\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)"+"|.)",end:"'",illegal:"."},e.END_SAME_AS_BEGIN({begin:/(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,end:/\)([^()\\ ]{0,16})"/})]},m={className:"number",variants:[{begin:"[+-]?(?:(?:[0-9](?:'?[0-9])*\\.(?:[0-9](?:'?[0-9])*)?|\\.[0-9](?:'?[0-9])*)(?:[Ee][+-]?[0-9](?:'?[0-9])*)?|[0-9](?:'?[0-9])*[Ee][+-]?[0-9](?:'?[0-9])*|0[Xx](?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*(?:\\.(?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)?)?|\\.[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)[Pp][+-]?[0-9](?:'?[0-9])*)(?:[Ff](?:16|32|64|128)?|(BF|bf)16|[Ll]|)"},{begin:"[+-]?\\b(?:0[Bb][01](?:'?[01])*|0[Xx][0-9A-Fa-f](?:'?[0-9A-Fa-f])*|0(?:'?[0-7])*|[1-9](?:'?[0-9])*)(?:[Uu](?:LL?|ll?)|[Uu][Zz]?|(?:LL?|ll?)[Uu]?|[Zz][Uu]|)"}],relevance:0},g={className:"meta",begin:/#\s*[a-z]+\b/,end:/$/,keywords:{keyword:"if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include"},contains:[{begin:/\\\n/,relevance:0},e.inherit(p,{className:"string"}),{className:"string",begin:/<.*?>/},n,e.C_BLOCK_COMMENT_MODE]},y={className:"title",begin:t.optional(s)+e.IDENT_RE,relevance:0},v=t.optional(s)+e.IDENT_RE+"\\s*\\(",_=["alignas","alignof","and","and_eq","asm","atomic_cancel","atomic_commit","atomic_noexcept","auto","bitand","bitor","break","case","catch","class","co_await","co_return","co_yield","compl","concept","const_cast|10","consteval","constexpr","constinit","continue","decltype","default","delete","do","dynamic_cast|10","else","enum","explicit","export","extern","false","final","for","friend","goto","if","import","inline","module","mutable","namespace","new","noexcept","not","not_eq","nullptr","operator","or","or_eq","override","private","protected","public","reflexpr","register","reinterpret_cast|10","requires","return","sizeof","static_assert","static_cast|10","struct","switch","synchronized","template","this","thread_local","throw","transaction_safe","transaction_safe_dynamic","true","try","typedef","typeid","typename","union","using","virtual","volatile","while","xor","xor_eq"],T=["bool","char","char16_t","char32_t","char8_t","double","float","int","long","short","void","wchar_t","unsigned","signed","const","static"],N=["any","auto_ptr","barrier","binary_semaphore","bitset","complex","condition_variable","condition_variable_any","counting_semaphore","deque","false_type","flat_map","flat_set","future","imaginary","initializer_list","istringstream","jthread","latch","lock_guard","multimap","multiset","mutex","optional","ostringstream","packaged_task","pair","promise","priority_queue","queue","recursive_mutex","recursive_timed_mutex","scoped_lock","set","shared_future","shared_lock","shared_mutex","shared_timed_mutex","shared_ptr","stack","string_view","stringstream","timed_mutex","thread","true_type","tuple","unique_lock","unique_ptr","unordered_map","unordered_multimap","unordered_multiset","unordered_set","variant","vector","weak_ptr","wstring","wstring_view"],C=["abort","abs","acos","apply","as_const","asin","atan","atan2","calloc","ceil","cerr","cin","clog","cos","cosh","cout","declval","endl","exchange","exit","exp","fabs","floor","fmod","forward","fprintf","fputs","free","frexp","fscanf","future","invoke","isalnum","isalpha","iscntrl","isdigit","isgraph","islower","isprint","ispunct","isspace","isupper","isxdigit","labs","launder","ldexp","log","log10","make_pair","make_shared","make_shared_for_overwrite","make_tuple","make_unique","malloc","memchr","memcmp","memcpy","memset","modf","move","pow","printf","putchar","puts","realloc","scanf","sin","sinh","snprintf","sprintf","sqrt","sscanf","std","stderr","stdin","stdout","strcat","strchr","strcmp","strcpy","strcspn","strlen","strncat","strncmp","strncpy","strpbrk","strrchr","strspn","strstr","swap","tan","tanh","terminate","to_underlying","tolower","toupper","vfprintf","visit","vprintf","vsprintf"],I={type:T,keyword:_,literal:["NULL","false","nullopt","nullptr","true"],built_in:["_Pragma"],_type_hints:N},D={className:"function.dispatch",relevance:0,keywords:{_hint:C},begin:t.concat(/\b/,/(?!decltype)/,/(?!if)/,/(?!for)/,/(?!switch)/,/(?!while)/,e.IDENT_RE,t.lookahead(/(<[^<>]+>|)\s*\(/))},M=[D,g,d,n,e.C_BLOCK_COMMENT_MODE,m,p],z={variants:[{begin:/=/,end:/;/},{begin:/\(/,end:/\)/},{beginKeywords:"new throw return else",end:/;/}],keywords:I,contains:M.concat([{begin:/\(/,end:/\)/,keywords:I,contains:M.concat(["self"]),relevance:0}]),relevance:0},Z={className:"function",begin:"("+c+"[\\*&\\s]+)+"+v,returnBegin:!0,end:/[{;=]/,excludeEnd:!0,keywords:I,illegal:/[^\w\s\*&:<>.]/,contains:[{begin:i,keywords:I,relevance:0},{begin:v,returnBegin:!0,contains:[y],relevance:0},{begin:/::/,relevance:0},{begin:/:/,endsWithParent:!0,contains:[p,m]},{relevance:0,match:/,/},{className:"params",begin:/\(/,end:/\)/,keywords:I,relevance:0,contains:[n,e.C_BLOCK_COMMENT_MODE,p,m,d,{begin:/\(/,end:/\)/,keywords:I,relevance:0,contains:["self",n,e.C_BLOCK_COMMENT_MODE,p,m,d]}]},d,n,e.C_BLOCK_COMMENT_MODE,g]};return{name:"C++",aliases:["cc","c++","h++","hpp","hh","hxx","cxx"],keywords:I,illegal:"</",classNameAliases:{"function.dispatch":"built_in"},contains:[].concat(z,Z,D,M,[g,{begin:"\\b(deque|list|queue|priority_queue|pair|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array|tuple|optional|variant|function|flat_map|flat_set)\\s*<(?!<)",end:">",keywords:I,contains:["self",d]},{begin:e.IDENT_RE+"::",keywords:I},{match:[/\b(?:enum(?:\s+(?:class|struct))?|class|struct|union)/,/\s+/,/\w+/],className:{1:"keyword",3:"title.class"}}])}}function VG(e){const t=["bool","byte","char","decimal","delegate","double","dynamic","enum","float","int","long","nint","nuint","object","sbyte","short","string","ulong","uint","ushort"],n=["public","private","protected","static","internal","protected","abstract","async","extern","override","unsafe","virtual","new","sealed","partial"],i=["default","false","null","true"],s=["abstract","as","base","break","case","catch","class","const","continue","do","else","event","explicit","extern","finally","fixed","for","foreach","goto","if","implicit","in","interface","internal","is","lock","namespace","new","operator","out","override","params","private","protected","public","readonly","record","ref","return","scoped","sealed","sizeof","stackalloc","static","struct","switch","this","throw","try","typeof","unchecked","unsafe","using","virtual","void","volatile","while"],l=["add","alias","and","ascending","args","async","await","by","descending","dynamic","equals","file","from","get","global","group","init","into","join","let","nameof","not","notnull","on","or","orderby","partial","record","remove","required","scoped","select","set","unmanaged","value|0","var","when","where","with","yield"],c={keyword:s.concat(l),built_in:t,literal:i},d=e.inherit(e.TITLE_MODE,{begin:"[a-zA-Z](\\.?\\w)*"}),f={className:"number",variants:[{begin:"\\b(0b[01']+)"},{begin:"(-?)\\b([\\d']+(\\.[\\d']*)?|\\.[\\d']+)(u|U|l|L|ul|UL|f|F|b|B)"},{begin:"(-?)(\\b0[xX][a-fA-F0-9']+|(\\b[\\d']+(\\.[\\d']*)?|\\.[\\d']+)([eE][-+]?[\\d']+)?)"}],relevance:0},p={className:"string",begin:/"""("*)(?!")(.|\n)*?"""\1/,relevance:1},m={className:"string",begin:'@"',end:'"',contains:[{begin:'""'}]},g=e.inherit(m,{illegal:/\n/}),y={className:"subst",begin:/\{/,end:/\}/,keywords:c},v=e.inherit(y,{illegal:/\n/}),_={className:"string",begin:/\$"/,end:'"',illegal:/\n/,contains:[{begin:/\{\{/},{begin:/\}\}/},e.BACKSLASH_ESCAPE,v]},T={className:"string",begin:/\$@"/,end:'"',contains:[{begin:/\{\{/},{begin:/\}\}/},{begin:'""'},y]},N=e.inherit(T,{illegal:/\n/,contains:[{begin:/\{\{/},{begin:/\}\}/},{begin:'""'},v]});y.contains=[T,_,m,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,f,e.C_BLOCK_COMMENT_MODE],v.contains=[N,_,g,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,f,e.inherit(e.C_BLOCK_COMMENT_MODE,{illegal:/\n/})];const C={variants:[p,T,_,m,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]},P={begin:"<",end:">",contains:[{beginKeywords:"in out"},d]},k=e.IDENT_RE+"(<"+e.IDENT_RE+"(\\s*,\\s*"+e.IDENT_RE+")*>)?(\\[\\])?",I={begin:"@"+e.IDENT_RE,relevance:0};return{name:"C#",aliases:["cs","c#"],keywords:c,illegal:/::/,contains:[e.COMMENT("///","$",{returnBegin:!0,contains:[{className:"doctag",variants:[{begin:"///",relevance:0},{begin:"<!--|-->"},{begin:"</?",end:">"}]}]}),e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,{className:"meta",begin:"#",end:"$",keywords:{keyword:"if else elif endif define undef warning error line region endregion pragma checksum"}},C,f,{beginKeywords:"class interface",relevance:0,end:/[{;=]/,illegal:/[^\s:,]/,contains:[{beginKeywords:"where class"},d,P,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{beginKeywords:"namespace",relevance:0,end:/[{;=]/,illegal:/[^\s:]/,contains:[d,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{beginKeywords:"record",relevance:0,end:/[{;=]/,illegal:/[^\s:]/,contains:[d,P,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{className:"meta",begin:"^\\s*\\[(?=[\\w])",excludeBegin:!0,end:"\\]",excludeEnd:!0,contains:[{className:"string",begin:/"/,end:/"/}]},{beginKeywords:"new return throw await else",relevance:0},{className:"function",begin:"("+k+"\\s+)+"+e.IDENT_RE+"\\s*(<[^=]+>\\s*)?\\(",returnBegin:!0,end:/\s*[{;=]/,excludeEnd:!0,keywords:c,contains:[{beginKeywords:n.join(" "),relevance:0},{begin:e.IDENT_RE+"\\s*(<[^=]+>\\s*)?\\(",returnBegin:!0,contains:[e.TITLE_MODE,P],relevance:0},{match:/\(\)/},{className:"params",begin:/\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:c,relevance:0,contains:[C,f,e.C_BLOCK_COMMENT_MODE]},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},I]}}const KG=e=>({IMPORTANT:{scope:"meta",begin:"!important"},BLOCK_COMMENT:e.C_BLOCK_COMMENT_MODE,HEXCOLOR:{scope:"number",begin:/#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/},FUNCTION_DISPATCH:{className:"built_in",begin:/[\w-]+(?=\()/},ATTRIBUTE_SELECTOR_MODE:{scope:"selector-attr",begin:/\[/,end:/\]/,illegal:"$",contains:[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]},CSS_NUMBER_MODE:{scope:"number",begin:e.NUMBER_RE+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",relevance:0},CSS_VARIABLE:{className:"attr",begin:/--[A-Za-z_][A-Za-z0-9_-]*/}}),YG=["a","abbr","address","article","aside","audio","b","blockquote","body","button","canvas","caption","cite","code","dd","del","details","dfn","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","html","i","iframe","img","input","ins","kbd","label","legend","li","main","mark","menu","nav","object","ol","optgroup","option","p","picture","q","quote","samp","section","select","source","span","strong","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","ul","var","video"],XG=["defs","g","marker","mask","pattern","svg","switch","symbol","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feFlood","feGaussianBlur","feImage","feMerge","feMorphology","feOffset","feSpecularLighting","feTile","feTurbulence","linearGradient","radialGradient","stop","circle","ellipse","image","line","path","polygon","polyline","rect","text","use","textPath","tspan","foreignObject","clipPath"],WG=[...YG,...XG],ZG=["any-hover","any-pointer","aspect-ratio","color","color-gamut","color-index","device-aspect-ratio","device-height","device-width","display-mode","forced-colors","grid","height","hover","inverted-colors","monochrome","orientation","overflow-block","overflow-inline","pointer","prefers-color-scheme","prefers-contrast","prefers-reduced-motion","prefers-reduced-transparency","resolution","scan","scripting","update","width","min-width","max-width","min-height","max-height"].sort().reverse(),QG=["active","any-link","blank","checked","current","default","defined","dir","disabled","drop","empty","enabled","first","first-child","first-of-type","fullscreen","future","focus","focus-visible","focus-within","has","host","host-context","hover","indeterminate","in-range","invalid","is","lang","last-child","last-of-type","left","link","local-link","not","nth-child","nth-col","nth-last-child","nth-last-col","nth-last-of-type","nth-of-type","only-child","only-of-type","optional","out-of-range","past","placeholder-shown","read-only","read-write","required","right","root","scope","target","target-within","user-invalid","valid","visited","where"].sort().reverse(),JG=["after","backdrop","before","cue","cue-region","first-letter","first-line","grammar-error","marker","part","placeholder","selection","slotted","spelling-error"].sort().reverse(),eV=["accent-color","align-content","align-items","align-self","alignment-baseline","all","anchor-name","animation","animation-composition","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-range","animation-range-end","animation-range-start","animation-timeline","animation-timing-function","appearance","aspect-ratio","backdrop-filter","backface-visibility","background","background-attachment","background-blend-mode","background-clip","background-color","background-image","background-origin","background-position","background-position-x","background-position-y","background-repeat","background-size","baseline-shift","block-size","border","border-block","border-block-color","border-block-end","border-block-end-color","border-block-end-style","border-block-end-width","border-block-start","border-block-start-color","border-block-start-style","border-block-start-width","border-block-style","border-block-width","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-end-end-radius","border-end-start-radius","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-inline","border-inline-color","border-inline-end","border-inline-end-color","border-inline-end-style","border-inline-end-width","border-inline-start","border-inline-start-color","border-inline-start-style","border-inline-start-width","border-inline-style","border-inline-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-start-end-radius","border-start-start-radius","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-align","box-decoration-break","box-direction","box-flex","box-flex-group","box-lines","box-ordinal-group","box-orient","box-pack","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","caret-color","clear","clip","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","color-scheme","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","contain","contain-intrinsic-block-size","contain-intrinsic-height","contain-intrinsic-inline-size","contain-intrinsic-size","contain-intrinsic-width","container","container-name","container-type","content","content-visibility","counter-increment","counter-reset","counter-set","cue","cue-after","cue-before","cursor","cx","cy","direction","display","dominant-baseline","empty-cells","enable-background","field-sizing","fill","fill-opacity","fill-rule","filter","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","flood-color","flood-opacity","flow","font","font-display","font-family","font-feature-settings","font-kerning","font-language-override","font-optical-sizing","font-palette","font-size","font-size-adjust","font-smooth","font-smoothing","font-stretch","font-style","font-synthesis","font-synthesis-position","font-synthesis-small-caps","font-synthesis-style","font-synthesis-weight","font-variant","font-variant-alternates","font-variant-caps","font-variant-east-asian","font-variant-emoji","font-variant-ligatures","font-variant-numeric","font-variant-position","font-variation-settings","font-weight","forced-color-adjust","gap","glyph-orientation-horizontal","glyph-orientation-vertical","grid","grid-area","grid-auto-columns","grid-auto-flow","grid-auto-rows","grid-column","grid-column-end","grid-column-start","grid-gap","grid-row","grid-row-end","grid-row-start","grid-template","grid-template-areas","grid-template-columns","grid-template-rows","hanging-punctuation","height","hyphenate-character","hyphenate-limit-chars","hyphens","icon","image-orientation","image-rendering","image-resolution","ime-mode","initial-letter","initial-letter-align","inline-size","inset","inset-area","inset-block","inset-block-end","inset-block-start","inset-inline","inset-inline-end","inset-inline-start","isolation","justify-content","justify-items","justify-self","kerning","left","letter-spacing","lighting-color","line-break","line-height","line-height-step","list-style","list-style-image","list-style-position","list-style-type","margin","margin-block","margin-block-end","margin-block-start","margin-bottom","margin-inline","margin-inline-end","margin-inline-start","margin-left","margin-right","margin-top","margin-trim","marker","marker-end","marker-mid","marker-start","marks","mask","mask-border","mask-border-mode","mask-border-outset","mask-border-repeat","mask-border-slice","mask-border-source","mask-border-width","mask-clip","mask-composite","mask-image","mask-mode","mask-origin","mask-position","mask-repeat","mask-size","mask-type","masonry-auto-flow","math-depth","math-shift","math-style","max-block-size","max-height","max-inline-size","max-width","min-block-size","min-height","min-inline-size","min-width","mix-blend-mode","nav-down","nav-index","nav-left","nav-right","nav-up","none","normal","object-fit","object-position","offset","offset-anchor","offset-distance","offset-path","offset-position","offset-rotate","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-anchor","overflow-block","overflow-clip-margin","overflow-inline","overflow-wrap","overflow-x","overflow-y","overlay","overscroll-behavior","overscroll-behavior-block","overscroll-behavior-inline","overscroll-behavior-x","overscroll-behavior-y","padding","padding-block","padding-block-end","padding-block-start","padding-bottom","padding-inline","padding-inline-end","padding-inline-start","padding-left","padding-right","padding-top","page","page-break-after","page-break-before","page-break-inside","paint-order","pause","pause-after","pause-before","perspective","perspective-origin","place-content","place-items","place-self","pointer-events","position","position-anchor","position-visibility","print-color-adjust","quotes","r","resize","rest","rest-after","rest-before","right","rotate","row-gap","ruby-align","ruby-position","scale","scroll-behavior","scroll-margin","scroll-margin-block","scroll-margin-block-end","scroll-margin-block-start","scroll-margin-bottom","scroll-margin-inline","scroll-margin-inline-end","scroll-margin-inline-start","scroll-margin-left","scroll-margin-right","scroll-margin-top","scroll-padding","scroll-padding-block","scroll-padding-block-end","scroll-padding-block-start","scroll-padding-bottom","scroll-padding-inline","scroll-padding-inline-end","scroll-padding-inline-start","scroll-padding-left","scroll-padding-right","scroll-padding-top","scroll-snap-align","scroll-snap-stop","scroll-snap-type","scroll-timeline","scroll-timeline-axis","scroll-timeline-name","scrollbar-color","scrollbar-gutter","scrollbar-width","shape-image-threshold","shape-margin","shape-outside","shape-rendering","speak","speak-as","src","stop-color","stop-opacity","stroke","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke-width","tab-size","table-layout","text-align","text-align-all","text-align-last","text-anchor","text-combine-upright","text-decoration","text-decoration-color","text-decoration-line","text-decoration-skip","text-decoration-skip-ink","text-decoration-style","text-decoration-thickness","text-emphasis","text-emphasis-color","text-emphasis-position","text-emphasis-style","text-indent","text-justify","text-orientation","text-overflow","text-rendering","text-shadow","text-size-adjust","text-transform","text-underline-offset","text-underline-position","text-wrap","text-wrap-mode","text-wrap-style","timeline-scope","top","touch-action","transform","transform-box","transform-origin","transform-style","transition","transition-behavior","transition-delay","transition-duration","transition-property","transition-timing-function","translate","unicode-bidi","user-modify","user-select","vector-effect","vertical-align","view-timeline","view-timeline-axis","view-timeline-inset","view-timeline-name","view-transition-name","visibility","voice-balance","voice-duration","voice-family","voice-pitch","voice-range","voice-rate","voice-stress","voice-volume","white-space","white-space-collapse","widows","width","will-change","word-break","word-spacing","word-wrap","writing-mode","x","y","z-index","zoom"].sort().reverse();function tV(e){const t=e.regex,n=KG(e),i={begin:/-(webkit|moz|ms|o)-(?=[a-z])/},s="and or not only",l=/@-?\w[\w]*(-\w+)*/,c="[a-zA-Z-][a-zA-Z0-9_-]*",d=[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE];return{name:"CSS",case_insensitive:!0,illegal:/[=|'\$]/,keywords:{keyframePosition:"from to"},classNameAliases:{keyframePosition:"selector-tag"},contains:[n.BLOCK_COMMENT,i,n.CSS_NUMBER_MODE,{className:"selector-id",begin:/#[A-Za-z0-9_-]+/,relevance:0},{className:"selector-class",begin:"\\."+c,relevance:0},n.ATTRIBUTE_SELECTOR_MODE,{className:"selector-pseudo",variants:[{begin:":("+QG.join("|")+")"},{begin:":(:)?("+JG.join("|")+")"}]},n.CSS_VARIABLE,{className:"attribute",begin:"\\b("+eV.join("|")+")\\b"},{begin:/:/,end:/[;}{]/,contains:[n.BLOCK_COMMENT,n.HEXCOLOR,n.IMPORTANT,n.CSS_NUMBER_MODE,...d,{begin:/(url|data-uri)\(/,end:/\)/,relevance:0,keywords:{built_in:"url data-uri"},contains:[...d,{className:"string",begin:/[^)]/,endsWithParent:!0,excludeEnd:!0}]},n.FUNCTION_DISPATCH]},{begin:t.lookahead(/@/),end:"[{;]",relevance:0,illegal:/:/,contains:[{className:"keyword",begin:l},{begin:/\s/,endsWithParent:!0,excludeEnd:!0,relevance:0,keywords:{$pattern:/[a-z-]+/,keyword:s,attribute:ZG.join(" ")},contains:[{begin:/[a-z-]+(?=:)/,className:"attribute"},...d,n.CSS_NUMBER_MODE]}]},{className:"selector-tag",begin:"\\b("+WG.join("|")+")\\b"}]}}function nV(e){const t=e.regex;return{name:"Diff",aliases:["patch"],contains:[{className:"meta",relevance:10,match:t.either(/^@@ +-\d+,\d+ +\+\d+,\d+ +@@/,/^\*\*\* +\d+,\d+ +\*\*\*\*$/,/^--- +\d+,\d+ +----$/)},{className:"comment",variants:[{begin:t.either(/Index: /,/^index/,/={3,}/,/^-{3}/,/^\*{3} /,/^\+{3}/,/^diff --git/),end:/$/},{match:/^\*{15}$/}]},{className:"addition",begin:/^\+/,end:/$/},{className:"deletion",begin:/^-/,end:/$/},{className:"addition",begin:/^!/,end:/$/}]}}function rV(e){const l={keyword:["break","case","chan","const","continue","default","defer","else","fallthrough","for","func","go","goto","if","import","interface","map","package","range","return","select","struct","switch","type","var"],type:["bool","byte","complex64","complex128","error","float32","float64","int8","int16","int32","int64","string","uint8","uint16","uint32","uint64","int","uint","uintptr","rune"],literal:["true","false","iota","nil"],built_in:["append","cap","close","complex","copy","imag","len","make","new","panic","print","println","real","recover","delete"]};return{name:"Go",aliases:["golang"],keywords:l,illegal:"</",contains:[e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,{className:"string",variants:[e.QUOTE_STRING_MODE,e.APOS_STRING_MODE,{begin:"`",end:"`"}]},{className:"number",variants:[{match:/-?\b0[xX]\.[a-fA-F0-9](_?[a-fA-F0-9])*[pP][+-]?\d(_?\d)*i?/,relevance:0},{match:/-?\b0[xX](_?[a-fA-F0-9])+((\.([a-fA-F0-9](_?[a-fA-F0-9])*)?)?[pP][+-]?\d(_?\d)*)?i?/,relevance:0},{match:/-?\b0[oO](_?[0-7])*i?/,relevance:0},{match:/-?\.\d(_?\d)*([eE][+-]?\d(_?\d)*)?i?/,relevance:0},{match:/-?\b\d(_?\d)*(\.(\d(_?\d)*)?)?([eE][+-]?\d(_?\d)*)?i?/,relevance:0}]},{begin:/:=/},{className:"function",beginKeywords:"func",end:"\\s*(\\{|$)",excludeEnd:!0,contains:[e.TITLE_MODE,{className:"params",begin:/\(/,end:/\)/,endsParent:!0,keywords:l,illegal:/["']/}]}]}}function iV(e){const t=e.regex,n=/[_A-Za-z][_0-9A-Za-z]*/;return{name:"GraphQL",aliases:["gql"],case_insensitive:!0,disableAutodetect:!1,keywords:{keyword:["query","mutation","subscription","type","input","schema","directive","interface","union","scalar","fragment","enum","on"],literal:["true","false","null"]},contains:[e.HASH_COMMENT_MODE,e.QUOTE_STRING_MODE,e.NUMBER_MODE,{scope:"punctuation",match:/[.]{3}/,relevance:0},{scope:"punctuation",begin:/[\!\(\)\:\=\[\]\{\|\}]{1}/,relevance:0},{scope:"variable",begin:/\$/,end:/\W/,excludeEnd:!0,relevance:0},{scope:"meta",match:/@\w+/,excludeEnd:!0},{scope:"symbol",begin:t.concat(n,t.lookahead(/\s*:/)),relevance:0}],illegal:[/[;<']/,/BEGIN/]}}function aV(e){const t=e.regex,n={className:"number",relevance:0,variants:[{begin:/([+-]+)?[\d]+_[\d_]+/},{begin:e.NUMBER_RE}]},i=e.COMMENT();i.variants=[{begin:/;/,end:/$/},{begin:/#/,end:/$/}];const s={className:"variable",variants:[{begin:/\$[\w\d"][\w\d_]*/},{begin:/\$\{(.*?)\}/}]},l={className:"literal",begin:/\bon|off|true|false|yes|no\b/},c={className:"string",contains:[e.BACKSLASH_ESCAPE],variants:[{begin:"'''",end:"'''",relevance:10},{begin:'"""',end:'"""',relevance:10},{begin:'"',end:'"'},{begin:"'",end:"'"}]},d={begin:/\[/,end:/\]/,contains:[i,l,s,c,n,"self"],relevance:0},f=/[A-Za-z0-9_-]+/,p=/"(\\"|[^"])*"/,m=/'[^']*'/,g=t.either(f,p,m),y=t.concat(g,"(\\s*\\.\\s*",g,")*",t.lookahead(/\s*=\s*[^#\s]/));return{name:"TOML, also INI",aliases:["toml"],case_insensitive:!0,illegal:/\S/,contains:[i,{className:"section",begin:/\[+/,end:/\]+/},{begin:y,className:"attr",starts:{end:/$/,contains:[i,d,l,s,c,n]}}]}}var Rs="[0-9](_*[0-9])*",nu=`\\.(${Rs})`,ru="[0-9a-fA-F](_*[0-9a-fA-F])*",Tw={className:"number",variants:[{begin:`(\\b(${Rs})((${nu})|\\.)?|(${nu}))[eE][+-]?(${Rs})[fFdD]?\\b`},{begin:`\\b(${Rs})((${nu})[fFdD]?\\b|\\.([fFdD]\\b)?)`},{begin:`(${nu})[fFdD]?\\b`},{begin:`\\b(${Rs})[fFdD]\\b`},{begin:`\\b0[xX]((${ru})\\.?|(${ru})?\\.(${ru}))[pP][+-]?(${Rs})[fFdD]?\\b`},{begin:"\\b(0|[1-9](_*[0-9])*)[lL]?\\b"},{begin:`\\b0[xX](${ru})[lL]?\\b`},{begin:"\\b0(_*[0-7])*[lL]?\\b"},{begin:"\\b0[bB][01](_*[01])*[lL]?\\b"}],relevance:0};function H1(e,t,n){return n===-1?"":e.replace(t,i=>H1(e,t,n-1))}function sV(e){const t=e.regex,n="[À-ʸa-zA-Z_$][À-ʸa-zA-Z_$0-9]*",i=n+H1("(?:<"+n+"~~~(?:\\s*,\\s*"+n+"~~~)*>)?",/~~~/g,2),f={keyword:["synchronized","abstract","private","var","static","if","const ","for","while","strictfp","finally","protected","import","native","final","void","enum","else","break","transient","catch","instanceof","volatile","case","assert","package","default","public","try","switch","continue","throws","protected","public","private","module","requires","exports","do","sealed","yield","permits","goto","when"],literal:["false","true","null"],type:["char","boolean","long","float","int","byte","short","double"],built_in:["super","this"]},p={className:"meta",begin:"@"+n,contains:[{begin:/\(/,end:/\)/,contains:["self"]}]},m={className:"params",begin:/\(/,end:/\)/,keywords:f,relevance:0,contains:[e.C_BLOCK_COMMENT_MODE],endsParent:!0};return{name:"Java",aliases:["jsp"],keywords:f,illegal:/<\/|#/,contains:[e.COMMENT("/\\*\\*","\\*/",{relevance:0,contains:[{begin:/\w+@/,relevance:0},{className:"doctag",begin:"@[A-Za-z]+"}]}),{begin:/import java\.[a-z]+\./,keywords:"import",relevance:2},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,{begin:/"""/,end:/"""/,className:"string",contains:[e.BACKSLASH_ESCAPE]},e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,{match:[/\b(?:class|interface|enum|extends|implements|new)/,/\s+/,n],className:{1:"keyword",3:"title.class"}},{match:/non-sealed/,scope:"keyword"},{begin:[t.concat(/(?!else)/,n),/\s+/,n,/\s+/,/=(?!=)/],className:{1:"type",3:"variable",5:"operator"}},{begin:[/record/,/\s+/,n],className:{1:"keyword",3:"title.class"},contains:[m,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{beginKeywords:"new throw return else",relevance:0},{begin:["(?:"+i+"\\s+)",e.UNDERSCORE_IDENT_RE,/\s*(?=\()/],className:{2:"title.function"},keywords:f,contains:[{className:"params",begin:/\(/,end:/\)/,keywords:f,relevance:0,contains:[p,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,Tw,e.C_BLOCK_COMMENT_MODE]},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},Tw,p]}}const Ow="[A-Za-z$_][0-9A-Za-z$_]*",lV=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends","using"],oV=["true","false","null","undefined","NaN","Infinity"],q1=["Object","Function","Boolean","Symbol","Math","Date","Number","BigInt","String","RegExp","Array","Float32Array","Float64Array","Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Int32Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array","Set","Map","WeakSet","WeakMap","ArrayBuffer","SharedArrayBuffer","Atomics","DataView","JSON","Promise","Generator","GeneratorFunction","AsyncFunction","Reflect","Proxy","Intl","WebAssembly"],G1=["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],V1=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],cV=["arguments","this","super","console","window","document","localStorage","sessionStorage","module","global"],uV=[].concat(V1,q1,G1);function dV(e){const t=e.regex,n=(X,{after:pe})=>{const x="</"+X[0].slice(1);return X.input.indexOf(x,pe)!==-1},i=Ow,s={begin:"<>",end:"</>"},l=/<[A-Za-z0-9\\._:-]+\s*\/>/,c={begin:/<[A-Za-z0-9\\._:-]+/,end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(X,pe)=>{const x=X[0].length+X.index,q=X.input[x];if(q==="<"||q===","){pe.ignoreMatch();return}q===">"&&(n(X,{after:x})||pe.ignoreMatch());let U;const R=X.input.substring(x);if(U=R.match(/^\s*=/)){pe.ignoreMatch();return}if((U=R.match(/^\s+extends\s+/))&&U.index===0){pe.ignoreMatch();return}}},d={$pattern:Ow,keyword:lV,literal:oV,built_in:uV,"variable.language":cV},f="[0-9](_?[0-9])*",p=`\\.(${f})`,m="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",g={className:"number",variants:[{begin:`(\\b(${m})((${p})|\\.)?|(${p}))[eE][+-]?(${f})\\b`},{begin:`\\b(${m})\\b((${p})\\b|\\.)?|(${p})\\b`},{begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{begin:"\\b0[0-7]+n?\\b"}],relevance:0},y={className:"subst",begin:"\\$\\{",end:"\\}",keywords:d,contains:[]},v={begin:".?html`",end:"",starts:{end:"`",returnEnd:!1,contains:[e.BACKSLASH_ESCAPE,y],subLanguage:"xml"}},_={begin:".?css`",end:"",starts:{end:"`",returnEnd:!1,contains:[e.BACKSLASH_ESCAPE,y],subLanguage:"css"}},T={begin:".?gql`",end:"",starts:{end:"`",returnEnd:!1,contains:[e.BACKSLASH_ESCAPE,y],subLanguage:"graphql"}},N={className:"string",begin:"`",end:"`",contains:[e.BACKSLASH_ESCAPE,y]},P={className:"comment",variants:[e.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,excludeBegin:!0,relevance:0},{className:"variable",begin:i+"(?=\\s*(-)|$)",endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]}),e.C_BLOCK_COMMENT_MODE,e.C_LINE_COMMENT_MODE]},k=[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,v,_,T,N,{match:/\$\d+/},g];y.contains=k.concat({begin:/\{/,end:/\}/,keywords:d,contains:["self"].concat(k)});const I=[].concat(P,y.contains),D=I.concat([{begin:/(\s*)\(/,end:/\)/,keywords:d,contains:["self"].concat(I)}]),M={className:"params",begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:d,contains:D},z={variants:[{match:[/class/,/\s+/,i,/\s+/,/extends/,/\s+/,t.concat(i,"(",t.concat(/\./,i),")*")],scope:{1:"keyword",3:"title.class",5:"keyword",7:"title.class.inherited"}},{match:[/class/,/\s+/,i],scope:{1:"keyword",3:"title.class"}}]},Z={relevance:0,match:t.either(/\bJSON/,/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),className:"title.class",keywords:{_:[...q1,...G1]}},W={label:"use_strict",className:"meta",relevance:10,begin:/^\s*['"]use (strict|asm)['"]/},$={variants:[{match:[/function/,/\s+/,i,/(?=\s*\()/]},{match:[/function/,/\s*(?=\()/]}],className:{1:"keyword",3:"title.function"},label:"func.def",contains:[M],illegal:/%/},re={relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,className:"variable.constant"};function se(X){return t.concat("(?!",X.join("|"),")")}const Se={match:t.concat(/\b/,se([...V1,"super","import"].map(X=>`${X}\\s*\\(`)),i,t.lookahead(/\s*\(/)),className:"title.function",relevance:0},ue={begin:t.concat(/\./,t.lookahead(t.concat(i,/(?![0-9A-Za-z$_(])/))),end:i,excludeBegin:!0,keywords:"prototype",className:"property",relevance:0},V={match:[/get|set/,/\s+/,i,/(?=\()/],className:{1:"keyword",3:"title.function"},contains:[{begin:/\(\)/},M]},B="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+e.UNDERSCORE_IDENT_RE+")\\s*=>",ee={match:[/const|var|let/,/\s+/,i,/\s*/,/=\s*/,/(async\s*)?/,t.lookahead(B)],keywords:"async",className:{1:"keyword",3:"title.function"},contains:[M]};return{name:"JavaScript",aliases:["js","jsx","mjs","cjs"],keywords:d,exports:{PARAMS_CONTAINS:D,CLASS_REFERENCE:Z},illegal:/#(?![$_A-z])/,contains:[e.SHEBANG({label:"shebang",binary:"node",relevance:5}),W,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,v,_,T,N,P,{match:/\$\d+/},g,Z,{scope:"attr",match:i+t.lookahead(":"),relevance:0},ee,{begin:"("+e.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",keywords:"return throw case",relevance:0,contains:[P,e.REGEXP_MODE,{className:"function",begin:B,returnBegin:!0,end:"\\s*=>",contains:[{className:"params",variants:[{begin:e.UNDERSCORE_IDENT_RE,relevance:0},{className:null,begin:/\(\s*\)/,skip:!0},{begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:d,contains:D}]}]},{begin:/,/,relevance:0},{match:/\s+/,relevance:0},{variants:[{begin:s.begin,end:s.end},{match:l},{begin:c.begin,"on:begin":c.isTrulyOpeningTag,end:c.end}],subLanguage:"xml",contains:[{begin:c.begin,end:c.end,skip:!0,contains:["self"]}]}]},$,{beginKeywords:"while if switch catch for"},{begin:"\\b(?!function)"+e.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",returnBegin:!0,label:"func.def",contains:[M,e.inherit(e.TITLE_MODE,{begin:i,className:"title.function"})]},{match:/\.\.\./,relevance:0},ue,{match:"\\$"+i,relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},contains:[M]},Se,re,z,V,{match:/\$[(.]/}]}}function fV(e){const t={className:"attr",begin:/"(\\.|[^\\"\r\n])*"(?=\s*:)/,relevance:1.01},n={match:/[{}[\],:]/,className:"punctuation",relevance:0},i=["true","false","null"],s={scope:"literal",beginKeywords:i.join(" ")};return{name:"JSON",aliases:["jsonc"],keywords:{literal:i},contains:[t,n,e.QUOTE_STRING_MODE,s,e.C_NUMBER_MODE,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE],illegal:"\\S"}}var Ns="[0-9](_*[0-9])*",iu=`\\.(${Ns})`,au="[0-9a-fA-F](_*[0-9a-fA-F])*",pV={className:"number",variants:[{begin:`(\\b(${Ns})((${iu})|\\.)?|(${iu}))[eE][+-]?(${Ns})[fFdD]?\\b`},{begin:`\\b(${Ns})((${iu})[fFdD]?\\b|\\.([fFdD]\\b)?)`},{begin:`(${iu})[fFdD]?\\b`},{begin:`\\b(${Ns})[fFdD]\\b`},{begin:`\\b0[xX]((${au})\\.?|(${au})?\\.(${au}))[pP][+-]?(${Ns})[fFdD]?\\b`},{begin:"\\b(0|[1-9](_*[0-9])*)[lL]?\\b"},{begin:`\\b0[xX](${au})[lL]?\\b`},{begin:"\\b0(_*[0-7])*[lL]?\\b"},{begin:"\\b0[bB][01](_*[01])*[lL]?\\b"}],relevance:0};function hV(e){const t={keyword:"abstract as val var vararg get set class object open private protected public noinline crossinline dynamic final enum if else do while for when throw try catch finally import package is in fun override companion reified inline lateinit init interface annotation data sealed internal infix operator out by constructor super tailrec where const inner suspend typealias external expect actual",built_in:"Byte Short Char Int Long Boolean Float Double Void Unit Nothing",literal:"true false null"},n={className:"keyword",begin:/\b(break|continue|return|this)\b/,starts:{contains:[{className:"symbol",begin:/@\w+/}]}},i={className:"symbol",begin:e.UNDERSCORE_IDENT_RE+"@"},s={className:"subst",begin:/\$\{/,end:/\}/,contains:[e.C_NUMBER_MODE]},l={className:"variable",begin:"\\$"+e.UNDERSCORE_IDENT_RE},c={className:"string",variants:[{begin:'"""',end:'"""(?=[^"])',contains:[l,s]},{begin:"'",end:"'",illegal:/\n/,contains:[e.BACKSLASH_ESCAPE]},{begin:'"',end:'"',illegal:/\n/,contains:[e.BACKSLASH_ESCAPE,l,s]}]};s.contains.push(c);const d={className:"meta",begin:"@(?:file|property|field|get|set|receiver|param|setparam|delegate)\\s*:(?:\\s*"+e.UNDERSCORE_IDENT_RE+")?"},f={className:"meta",begin:"@"+e.UNDERSCORE_IDENT_RE,contains:[{begin:/\(/,end:/\)/,contains:[e.inherit(c,{className:"string"}),"self"]}]},p=pV,m=e.COMMENT("/\\*","\\*/",{contains:[e.C_BLOCK_COMMENT_MODE]}),g={variants:[{className:"type",begin:e.UNDERSCORE_IDENT_RE},{begin:/\(/,end:/\)/,contains:[]}]},y=g;return y.variants[1].contains=[g],g.variants[1].contains=[y],{name:"Kotlin",aliases:["kt","kts"],keywords:t,contains:[e.COMMENT("/\\*\\*","\\*/",{relevance:0,contains:[{className:"doctag",begin:"@[A-Za-z]+"}]}),e.C_LINE_COMMENT_MODE,m,n,i,d,f,{className:"function",beginKeywords:"fun",end:"[(]|$",returnBegin:!0,excludeEnd:!0,keywords:t,relevance:5,contains:[{begin:e.UNDERSCORE_IDENT_RE+"\\s*\\(",returnBegin:!0,relevance:0,contains:[e.UNDERSCORE_TITLE_MODE]},{className:"type",begin:/</,end:/>/,keywords:"reified",relevance:0},{className:"params",begin:/\(/,end:/\)/,endsParent:!0,keywords:t,relevance:0,contains:[{begin:/:/,end:/[=,\/]/,endsWithParent:!0,contains:[g,e.C_LINE_COMMENT_MODE,m],relevance:0},e.C_LINE_COMMENT_MODE,m,d,f,c,e.C_NUMBER_MODE]},m]},{begin:[/class|interface|trait/,/\s+/,e.UNDERSCORE_IDENT_RE],beginScope:{3:"title.class"},keywords:"class interface trait",end:/[:\{(]|$/,excludeEnd:!0,illegal:"extends implements",contains:[{beginKeywords:"public protected internal private constructor"},e.UNDERSCORE_TITLE_MODE,{className:"type",begin:/</,end:/>/,excludeBegin:!0,excludeEnd:!0,relevance:0},{className:"type",begin:/[,:]\s*/,end:/[<\(,){\s]|$/,excludeBegin:!0,returnEnd:!0},d,f]},c,{className:"meta",begin:"^#!/usr/bin/env",end:"$",illegal:`
`},p]}}const mV=e=>({IMPORTANT:{scope:"meta",begin:"!important"},BLOCK_COMMENT:e.C_BLOCK_COMMENT_MODE,HEXCOLOR:{scope:"number",begin:/#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/},FUNCTION_DISPATCH:{className:"built_in",begin:/[\w-]+(?=\()/},ATTRIBUTE_SELECTOR_MODE:{scope:"selector-attr",begin:/\[/,end:/\]/,illegal:"$",contains:[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]},CSS_NUMBER_MODE:{scope:"number",begin:e.NUMBER_RE+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",relevance:0},CSS_VARIABLE:{className:"attr",begin:/--[A-Za-z_][A-Za-z0-9_-]*/}}),gV=["a","abbr","address","article","aside","audio","b","blockquote","body","button","canvas","caption","cite","code","dd","del","details","dfn","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","html","i","iframe","img","input","ins","kbd","label","legend","li","main","mark","menu","nav","object","ol","optgroup","option","p","picture","q","quote","samp","section","select","source","span","strong","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","ul","var","video"],bV=["defs","g","marker","mask","pattern","svg","switch","symbol","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feFlood","feGaussianBlur","feImage","feMerge","feMorphology","feOffset","feSpecularLighting","feTile","feTurbulence","linearGradient","radialGradient","stop","circle","ellipse","image","line","path","polygon","polyline","rect","text","use","textPath","tspan","foreignObject","clipPath"],yV=[...gV,...bV],vV=["any-hover","any-pointer","aspect-ratio","color","color-gamut","color-index","device-aspect-ratio","device-height","device-width","display-mode","forced-colors","grid","height","hover","inverted-colors","monochrome","orientation","overflow-block","overflow-inline","pointer","prefers-color-scheme","prefers-contrast","prefers-reduced-motion","prefers-reduced-transparency","resolution","scan","scripting","update","width","min-width","max-width","min-height","max-height"].sort().reverse(),K1=["active","any-link","blank","checked","current","default","defined","dir","disabled","drop","empty","enabled","first","first-child","first-of-type","fullscreen","future","focus","focus-visible","focus-within","has","host","host-context","hover","indeterminate","in-range","invalid","is","lang","last-child","last-of-type","left","link","local-link","not","nth-child","nth-col","nth-last-child","nth-last-col","nth-last-of-type","nth-of-type","only-child","only-of-type","optional","out-of-range","past","placeholder-shown","read-only","read-write","required","right","root","scope","target","target-within","user-invalid","valid","visited","where"].sort().reverse(),Y1=["after","backdrop","before","cue","cue-region","first-letter","first-line","grammar-error","marker","part","placeholder","selection","slotted","spelling-error"].sort().reverse(),_V=["accent-color","align-content","align-items","align-self","alignment-baseline","all","anchor-name","animation","animation-composition","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-range","animation-range-end","animation-range-start","animation-timeline","animation-timing-function","appearance","aspect-ratio","backdrop-filter","backface-visibility","background","background-attachment","background-blend-mode","background-clip","background-color","background-image","background-origin","background-position","background-position-x","background-position-y","background-repeat","background-size","baseline-shift","block-size","border","border-block","border-block-color","border-block-end","border-block-end-color","border-block-end-style","border-block-end-width","border-block-start","border-block-start-color","border-block-start-style","border-block-start-width","border-block-style","border-block-width","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-end-end-radius","border-end-start-radius","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-inline","border-inline-color","border-inline-end","border-inline-end-color","border-inline-end-style","border-inline-end-width","border-inline-start","border-inline-start-color","border-inline-start-style","border-inline-start-width","border-inline-style","border-inline-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-start-end-radius","border-start-start-radius","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-align","box-decoration-break","box-direction","box-flex","box-flex-group","box-lines","box-ordinal-group","box-orient","box-pack","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","caret-color","clear","clip","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","color-scheme","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","contain","contain-intrinsic-block-size","contain-intrinsic-height","contain-intrinsic-inline-size","contain-intrinsic-size","contain-intrinsic-width","container","container-name","container-type","content","content-visibility","counter-increment","counter-reset","counter-set","cue","cue-after","cue-before","cursor","cx","cy","direction","display","dominant-baseline","empty-cells","enable-background","field-sizing","fill","fill-opacity","fill-rule","filter","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","flood-color","flood-opacity","flow","font","font-display","font-family","font-feature-settings","font-kerning","font-language-override","font-optical-sizing","font-palette","font-size","font-size-adjust","font-smooth","font-smoothing","font-stretch","font-style","font-synthesis","font-synthesis-position","font-synthesis-small-caps","font-synthesis-style","font-synthesis-weight","font-variant","font-variant-alternates","font-variant-caps","font-variant-east-asian","font-variant-emoji","font-variant-ligatures","font-variant-numeric","font-variant-position","font-variation-settings","font-weight","forced-color-adjust","gap","glyph-orientation-horizontal","glyph-orientation-vertical","grid","grid-area","grid-auto-columns","grid-auto-flow","grid-auto-rows","grid-column","grid-column-end","grid-column-start","grid-gap","grid-row","grid-row-end","grid-row-start","grid-template","grid-template-areas","grid-template-columns","grid-template-rows","hanging-punctuation","height","hyphenate-character","hyphenate-limit-chars","hyphens","icon","image-orientation","image-rendering","image-resolution","ime-mode","initial-letter","initial-letter-align","inline-size","inset","inset-area","inset-block","inset-block-end","inset-block-start","inset-inline","inset-inline-end","inset-inline-start","isolation","justify-content","justify-items","justify-self","kerning","left","letter-spacing","lighting-color","line-break","line-height","line-height-step","list-style","list-style-image","list-style-position","list-style-type","margin","margin-block","margin-block-end","margin-block-start","margin-bottom","margin-inline","margin-inline-end","margin-inline-start","margin-left","margin-right","margin-top","margin-trim","marker","marker-end","marker-mid","marker-start","marks","mask","mask-border","mask-border-mode","mask-border-outset","mask-border-repeat","mask-border-slice","mask-border-source","mask-border-width","mask-clip","mask-composite","mask-image","mask-mode","mask-origin","mask-position","mask-repeat","mask-size","mask-type","masonry-auto-flow","math-depth","math-shift","math-style","max-block-size","max-height","max-inline-size","max-width","min-block-size","min-height","min-inline-size","min-width","mix-blend-mode","nav-down","nav-index","nav-left","nav-right","nav-up","none","normal","object-fit","object-position","offset","offset-anchor","offset-distance","offset-path","offset-position","offset-rotate","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-anchor","overflow-block","overflow-clip-margin","overflow-inline","overflow-wrap","overflow-x","overflow-y","overlay","overscroll-behavior","overscroll-behavior-block","overscroll-behavior-inline","overscroll-behavior-x","overscroll-behavior-y","padding","padding-block","padding-block-end","padding-block-start","padding-bottom","padding-inline","padding-inline-end","padding-inline-start","padding-left","padding-right","padding-top","page","page-break-after","page-break-before","page-break-inside","paint-order","pause","pause-after","pause-before","perspective","perspective-origin","place-content","place-items","place-self","pointer-events","position","position-anchor","position-visibility","print-color-adjust","quotes","r","resize","rest","rest-after","rest-before","right","rotate","row-gap","ruby-align","ruby-position","scale","scroll-behavior","scroll-margin","scroll-margin-block","scroll-margin-block-end","scroll-margin-block-start","scroll-margin-bottom","scroll-margin-inline","scroll-margin-inline-end","scroll-margin-inline-start","scroll-margin-left","scroll-margin-right","scroll-margin-top","scroll-padding","scroll-padding-block","scroll-padding-block-end","scroll-padding-block-start","scroll-padding-bottom","scroll-padding-inline","scroll-padding-inline-end","scroll-padding-inline-start","scroll-padding-left","scroll-padding-right","scroll-padding-top","scroll-snap-align","scroll-snap-stop","scroll-snap-type","scroll-timeline","scroll-timeline-axis","scroll-timeline-name","scrollbar-color","scrollbar-gutter","scrollbar-width","shape-image-threshold","shape-margin","shape-outside","shape-rendering","speak","speak-as","src","stop-color","stop-opacity","stroke","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke-width","tab-size","table-layout","text-align","text-align-all","text-align-last","text-anchor","text-combine-upright","text-decoration","text-decoration-color","text-decoration-line","text-decoration-skip","text-decoration-skip-ink","text-decoration-style","text-decoration-thickness","text-emphasis","text-emphasis-color","text-emphasis-position","text-emphasis-style","text-indent","text-justify","text-orientation","text-overflow","text-rendering","text-shadow","text-size-adjust","text-transform","text-underline-offset","text-underline-position","text-wrap","text-wrap-mode","text-wrap-style","timeline-scope","top","touch-action","transform","transform-box","transform-origin","transform-style","transition","transition-behavior","transition-delay","transition-duration","transition-property","transition-timing-function","translate","unicode-bidi","user-modify","user-select","vector-effect","vertical-align","view-timeline","view-timeline-axis","view-timeline-inset","view-timeline-name","view-transition-name","visibility","voice-balance","voice-duration","voice-family","voice-pitch","voice-range","voice-rate","voice-stress","voice-volume","white-space","white-space-collapse","widows","width","will-change","word-break","word-spacing","word-wrap","writing-mode","x","y","z-index","zoom"].sort().reverse(),xV=K1.concat(Y1).sort().reverse();function wV(e){const t=mV(e),n=xV,i="and or not only",s="[\\w-]+",l="("+s+"|@\\{"+s+"\\})",c=[],d=[],f=function(k){return{className:"string",begin:"~?"+k+".*?"+k}},p=function(k,I,D){return{className:k,begin:I,relevance:D}},m={$pattern:/[a-z-]+/,keyword:i,attribute:vV.join(" ")},g={begin:"\\(",end:"\\)",contains:d,keywords:m,relevance:0};d.push(e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,f("'"),f('"'),t.CSS_NUMBER_MODE,{begin:"(url|data-uri)\\(",starts:{className:"string",end:"[\\)\\n]",excludeEnd:!0}},t.HEXCOLOR,g,p("variable","@@?"+s,10),p("variable","@\\{"+s+"\\}"),p("built_in","~?`[^`]*?`"),{className:"attribute",begin:s+"\\s*:",end:":",returnBegin:!0,excludeEnd:!0},t.IMPORTANT,{beginKeywords:"and not"},t.FUNCTION_DISPATCH);const y=d.concat({begin:/\{/,end:/\}/,contains:c}),v={beginKeywords:"when",endsWithParent:!0,contains:[{beginKeywords:"and not"}].concat(d)},_={begin:l+"\\s*:",returnBegin:!0,end:/[;}]/,relevance:0,contains:[{begin:/-(webkit|moz|ms|o)-/},t.CSS_VARIABLE,{className:"attribute",begin:"\\b("+_V.join("|")+")\\b",end:/(?=:)/,starts:{endsWithParent:!0,illegal:"[<=$]",relevance:0,contains:d}}]},T={className:"keyword",begin:"@(import|media|charset|font-face|(-[a-z]+-)?keyframes|supports|document|namespace|page|viewport|host)\\b",starts:{end:"[;{}]",keywords:m,returnEnd:!0,contains:d,relevance:0}},N={className:"variable",variants:[{begin:"@"+s+"\\s*:",relevance:15},{begin:"@"+s}],starts:{end:"[;}]",returnEnd:!0,contains:y}},C={variants:[{begin:"[\\.#:&\\[>]",end:"[;{}]"},{begin:l,end:/\{/}],returnBegin:!0,returnEnd:!0,illegal:`[<='$"]`,relevance:0,contains:[e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,v,p("keyword","all\\b"),p("variable","@\\{"+s+"\\}"),{begin:"\\b("+yV.join("|")+")\\b",className:"selector-tag"},t.CSS_NUMBER_MODE,p("selector-tag",l,0),p("selector-id","#"+l),p("selector-class","\\."+l,0),p("selector-tag","&",0),t.ATTRIBUTE_SELECTOR_MODE,{className:"selector-pseudo",begin:":("+K1.join("|")+")"},{className:"selector-pseudo",begin:":(:)?("+Y1.join("|")+")"},{begin:/\(/,end:/\)/,relevance:0,contains:y},{begin:"!important"},t.FUNCTION_DISPATCH]},P={begin:s+`:(:)?(${n.join("|")})`,returnBegin:!0,contains:[C]};return c.push(e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,T,N,P,_,C,v,t.FUNCTION_DISPATCH),{name:"Less",case_insensitive:!0,illegal:`[=>'/<($"]`,contains:c}}function EV(e){const t="\\[=*\\[",n="\\]=*\\]",i={begin:t,end:n,contains:["self"]},s=[e.COMMENT("--(?!"+t+")","$"),e.COMMENT("--"+t,n,{contains:[i],relevance:10})];return{name:"Lua",aliases:["pluto"],keywords:{$pattern:e.UNDERSCORE_IDENT_RE,literal:"true false nil",keyword:"and break do else elseif end for goto if in local not or repeat return then until while",built_in:"_G _ENV _VERSION __index __newindex __mode __call __metatable __tostring __len __gc __add __sub __mul __div __mod __pow __concat __unm __eq __lt __le assert collectgarbage dofile error getfenv getmetatable ipairs load loadfile loadstring module next pairs pcall print rawequal rawget rawset require select setfenv setmetatable tonumber tostring type unpack xpcall arg self coroutine resume yield status wrap create running debug getupvalue debug sethook getmetatable gethook setmetatable setlocal traceback setfenv getinfo setupvalue getlocal getregistry getfenv io lines write close flush open output type read stderr stdin input stdout popen tmpfile math log max acos huge ldexp pi cos tanh pow deg tan cosh sinh random randomseed frexp ceil floor rad abs sqrt modf asin min mod fmod log10 atan2 exp sin atan os exit setlocale date getenv difftime remove time clock tmpname rename execute package preload loadlib loaded loaders cpath config path seeall string sub upper len gfind rep find match char dump gmatch reverse byte format gsub lower table setn insert getn foreachi maxn foreach concat sort remove"},contains:s.concat([{className:"function",beginKeywords:"function",end:"\\)",contains:[e.inherit(e.TITLE_MODE,{begin:"([_a-zA-Z]\\w*\\.)*([_a-zA-Z]\\w*:)?[_a-zA-Z]\\w*"}),{className:"params",begin:"\\(",endsWithParent:!0,contains:s}].concat(s)},e.C_NUMBER_MODE,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,{className:"string",begin:t,end:n,contains:[i],relevance:5}])}}function SV(e){const t={className:"variable",variants:[{begin:"\\$\\("+e.UNDERSCORE_IDENT_RE+"\\)",contains:[e.BACKSLASH_ESCAPE]},{begin:/\$[@%<?\^\+\*]/}]},n={className:"string",begin:/"/,end:/"/,contains:[e.BACKSLASH_ESCAPE,t]},i={className:"variable",begin:/\$\([\w-]+\s/,end:/\)/,keywords:{built_in:"subst patsubst strip findstring filter filter-out sort word wordlist firstword lastword dir notdir suffix basename addsuffix addprefix join wildcard realpath abspath error warning shell origin flavor foreach if or and call eval file value"},contains:[t,n]},s={begin:"^"+e.UNDERSCORE_IDENT_RE+"\\s*(?=[:+?]?=)"},l={className:"meta",begin:/^\.PHONY:/,end:/$/,keywords:{$pattern:/[\.\w]+/,keyword:".PHONY"}},c={className:"section",begin:/^[^\s]+:/,end:/$/,contains:[t]};return{name:"Makefile",aliases:["mk","mak","make"],keywords:{$pattern:/[\w-]+/,keyword:"define endef undefine ifdef ifndef ifeq ifneq else endif include -include sinclude override export unexport private vpath"},contains:[e.HASH_COMMENT_MODE,t,n,i,s,l,c]}}function CV(e){const t=e.regex,n={begin:/<\/?[A-Za-z_]/,end:">",subLanguage:"xml",relevance:0},i={begin:"^[-\\*]{3,}",end:"$"},s={className:"code",variants:[{begin:"(`{3,})[^`](.|\\n)*?\\1`*[ ]*"},{begin:"(~{3,})[^~](.|\\n)*?\\1~*[ ]*"},{begin:"```",end:"```+[ ]*$"},{begin:"~~~",end:"~~~+[ ]*$"},{begin:"`.+?`"},{begin:"(?=^( {4}|\\t))",contains:[{begin:"^( {4}|\\t)",end:"(\\n)$"}],relevance:0}]},l={className:"bullet",begin:"^[ 	]*([*+-]|(\\d+\\.))(?=\\s+)",end:"\\s+",excludeEnd:!0},c={begin:/^\[[^\n]+\]:/,returnBegin:!0,contains:[{className:"symbol",begin:/\[/,end:/\]/,excludeBegin:!0,excludeEnd:!0},{className:"link",begin:/:\s*/,end:/$/,excludeBegin:!0}]},d=/[A-Za-z][A-Za-z0-9+.-]*/,f={variants:[{begin:/\[.+?\]\[.*?\]/,relevance:0},{begin:/\[.+?\]\(((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?\)/,relevance:2},{begin:t.concat(/\[.+?\]\(/,d,/:\/\/.*?\)/),relevance:2},{begin:/\[.+?\]\([./?&#].*?\)/,relevance:1},{begin:/\[.*?\]\(.*?\)/,relevance:0}],returnBegin:!0,contains:[{match:/\[(?=\])/},{className:"string",relevance:0,begin:"\\[",end:"\\]",excludeBegin:!0,returnEnd:!0},{className:"link",relevance:0,begin:"\\]\\(",end:"\\)",excludeBegin:!0,excludeEnd:!0},{className:"symbol",relevance:0,begin:"\\]\\[",end:"\\]",excludeBegin:!0,excludeEnd:!0}]},p={className:"strong",contains:[],variants:[{begin:/_{2}(?!\s)/,end:/_{2}/},{begin:/\*{2}(?!\s)/,end:/\*{2}/}]},m={className:"emphasis",contains:[],variants:[{begin:/\*(?![*\s])/,end:/\*/},{begin:/_(?![_\s])/,end:/_/,relevance:0}]},g=e.inherit(p,{contains:[]}),y=e.inherit(m,{contains:[]});p.contains.push(y),m.contains.push(g);let v=[n,f];return[p,m,g,y].forEach(C=>{C.contains=C.contains.concat(v)}),v=v.concat(p,m),{name:"Markdown",aliases:["md","mkdown","mkd"],contains:[{className:"section",variants:[{begin:"^#{1,6}",end:"$",contains:v},{begin:"(?=^.+?\\n[=-]{2,}$)",contains:[{begin:"^[=-]*$"},{begin:"^",end:"\\n",contains:v}]}]},n,l,p,m,{className:"quote",begin:"^>\\s+",contains:v,end:"$"},s,i,f,c,{scope:"literal",match:/&([a-zA-Z0-9]+|#[0-9]{1,7}|#[Xx][0-9a-fA-F]{1,6});/}]}}function TV(e){const t={className:"built_in",begin:"\\b(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)\\w+"},n=/[a-zA-Z@][a-zA-Z0-9_]*/,d={"variable.language":["this","super"],$pattern:n,keyword:["while","export","sizeof","typedef","const","struct","for","union","volatile","static","mutable","if","do","return","goto","enum","else","break","extern","asm","case","default","register","explicit","typename","switch","continue","inline","readonly","assign","readwrite","self","@synchronized","id","typeof","nonatomic","IBOutlet","IBAction","strong","weak","copy","in","out","inout","bycopy","byref","oneway","__strong","__weak","__block","__autoreleasing","@private","@protected","@public","@try","@property","@end","@throw","@catch","@finally","@autoreleasepool","@synthesize","@dynamic","@selector","@optional","@required","@encode","@package","@import","@defs","@compatibility_alias","__bridge","__bridge_transfer","__bridge_retained","__bridge_retain","__covariant","__contravariant","__kindof","_Nonnull","_Nullable","_Null_unspecified","__FUNCTION__","__PRETTY_FUNCTION__","__attribute__","getter","setter","retain","unsafe_unretained","nonnull","nullable","null_unspecified","null_resettable","class","instancetype","NS_DESIGNATED_INITIALIZER","NS_UNAVAILABLE","NS_REQUIRES_SUPER","NS_RETURNS_INNER_POINTER","NS_INLINE","NS_AVAILABLE","NS_DEPRECATED","NS_ENUM","NS_OPTIONS","NS_SWIFT_UNAVAILABLE","NS_ASSUME_NONNULL_BEGIN","NS_ASSUME_NONNULL_END","NS_REFINED_FOR_SWIFT","NS_SWIFT_NAME","NS_SWIFT_NOTHROW","NS_DURING","NS_HANDLER","NS_ENDHANDLER","NS_VALUERETURN","NS_VOIDRETURN"],literal:["false","true","FALSE","TRUE","nil","YES","NO","NULL"],built_in:["dispatch_once_t","dispatch_queue_t","dispatch_sync","dispatch_async","dispatch_once"],type:["int","float","char","unsigned","signed","short","long","double","wchar_t","unichar","void","bool","BOOL","id|0","_Bool"]},f={$pattern:n,keyword:["@interface","@class","@protocol","@implementation"]};return{name:"Objective-C",aliases:["mm","objc","obj-c","obj-c++","objective-c++"],keywords:d,illegal:"</",contains:[t,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,e.C_NUMBER_MODE,e.QUOTE_STRING_MODE,e.APOS_STRING_MODE,{className:"string",variants:[{begin:'@"',end:'"',illegal:"\\n",contains:[e.BACKSLASH_ESCAPE]}]},{className:"meta",begin:/#\s*[a-z]+\b/,end:/$/,keywords:{keyword:"if else elif endif define undef warning error line pragma ifdef ifndef include"},contains:[{begin:/\\\n/,relevance:0},e.inherit(e.QUOTE_STRING_MODE,{className:"string"}),{className:"string",begin:/<.*?>/,end:/$/,illegal:"\\n"},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{className:"class",begin:"("+f.keyword.join("|")+")\\b",end:/(\{|$)/,excludeEnd:!0,keywords:f,contains:[e.UNDERSCORE_TITLE_MODE]},{begin:"\\."+e.UNDERSCORE_IDENT_RE,relevance:0}]}}function OV(e){const t=e.regex,n=["abs","accept","alarm","and","atan2","bind","binmode","bless","break","caller","chdir","chmod","chomp","chop","chown","chr","chroot","class","close","closedir","connect","continue","cos","crypt","dbmclose","dbmopen","defined","delete","die","do","dump","each","else","elsif","endgrent","endhostent","endnetent","endprotoent","endpwent","endservent","eof","eval","exec","exists","exit","exp","fcntl","field","fileno","flock","for","foreach","fork","format","formline","getc","getgrent","getgrgid","getgrnam","gethostbyaddr","gethostbyname","gethostent","getlogin","getnetbyaddr","getnetbyname","getnetent","getpeername","getpgrp","getpriority","getprotobyname","getprotobynumber","getprotoent","getpwent","getpwnam","getpwuid","getservbyname","getservbyport","getservent","getsockname","getsockopt","given","glob","gmtime","goto","grep","gt","hex","if","index","int","ioctl","join","keys","kill","last","lc","lcfirst","length","link","listen","local","localtime","log","lstat","lt","ma","map","method","mkdir","msgctl","msgget","msgrcv","msgsnd","my","ne","next","no","not","oct","open","opendir","or","ord","our","pack","package","pipe","pop","pos","print","printf","prototype","push","q|0","qq","quotemeta","qw","qx","rand","read","readdir","readline","readlink","readpipe","recv","redo","ref","rename","require","reset","return","reverse","rewinddir","rindex","rmdir","say","scalar","seek","seekdir","select","semctl","semget","semop","send","setgrent","sethostent","setnetent","setpgrp","setpriority","setprotoent","setpwent","setservent","setsockopt","shift","shmctl","shmget","shmread","shmwrite","shutdown","sin","sleep","socket","socketpair","sort","splice","split","sprintf","sqrt","srand","stat","state","study","sub","substr","symlink","syscall","sysopen","sysread","sysseek","system","syswrite","tell","telldir","tie","tied","time","times","tr","truncate","uc","ucfirst","umask","undef","unless","unlink","unpack","unshift","untie","until","use","utime","values","vec","wait","waitpid","wantarray","warn","when","while","write","x|0","xor","y|0"],i=/[dualxmsipngr]{0,12}/,s={$pattern:/[\w.]+/,keyword:n.join(" ")},l={className:"subst",begin:"[$@]\\{",end:"\\}",keywords:s},c={begin:/->\{/,end:/\}/},d={scope:"attr",match:/\s+:\s*\w+(\s*\(.*?\))?/},f={scope:"variable",variants:[{begin:/\$\d/},{begin:t.concat(/[$%@](?!")(\^\w\b|#\w+(::\w+)*|\{\w+\}|\w+(::\w*)*)/,"(?![A-Za-z])(?![@$%])")},{begin:/[$%@](?!")[^\s\w{=]|\$=/,relevance:0}],contains:[d]},p={className:"number",variants:[{match:/0?\.[0-9][0-9_]+\b/},{match:/\bv?(0|[1-9][0-9_]*(\.[0-9_]+)?|[1-9][0-9_]*)\b/},{match:/\b0[0-7][0-7_]*\b/},{match:/\b0x[0-9a-fA-F][0-9a-fA-F_]*\b/},{match:/\b0b[0-1][0-1_]*\b/}],relevance:0},m=[e.BACKSLASH_ESCAPE,l,f],g=[/!/,/\//,/\|/,/\?/,/'/,/"/,/#/],y=(T,N,C="\\1")=>{const P=C==="\\1"?C:t.concat(C,N);return t.concat(t.concat("(?:",T,")"),N,/(?:\\.|[^\\\/])*?/,P,/(?:\\.|[^\\\/])*?/,C,i)},v=(T,N,C)=>t.concat(t.concat("(?:",T,")"),N,/(?:\\.|[^\\\/])*?/,C,i),_=[f,e.HASH_COMMENT_MODE,e.COMMENT(/^=\w/,/=cut/,{endsWithParent:!0}),c,{className:"string",contains:m,variants:[{begin:"q[qwxr]?\\s*\\(",end:"\\)",relevance:5},{begin:"q[qwxr]?\\s*\\[",end:"\\]",relevance:5},{begin:"q[qwxr]?\\s*\\{",end:"\\}",relevance:5},{begin:"q[qwxr]?\\s*\\|",end:"\\|",relevance:5},{begin:"q[qwxr]?\\s*<",end:">",relevance:5},{begin:"qw\\s+q",end:"q",relevance:5},{begin:"'",end:"'",contains:[e.BACKSLASH_ESCAPE]},{begin:'"',end:'"'},{begin:"`",end:"`",contains:[e.BACKSLASH_ESCAPE]},{begin:/\{\w+\}/,relevance:0},{begin:"-?\\w+\\s*=>",relevance:0}]},p,{begin:"(\\/\\/|"+e.RE_STARTERS_RE+"|\\b(split|return|print|reverse|grep)\\b)\\s*",keywords:"split return print reverse grep",relevance:0,contains:[e.HASH_COMMENT_MODE,{className:"regexp",variants:[{begin:y("s|tr|y",t.either(...g,{capture:!0}))},{begin:y("s|tr|y","\\(","\\)")},{begin:y("s|tr|y","\\[","\\]")},{begin:y("s|tr|y","\\{","\\}")}],relevance:2},{className:"regexp",variants:[{begin:/(m|qr)\/\//,relevance:0},{begin:v("(?:m|qr)?",/\//,/\//)},{begin:v("m|qr",t.either(...g,{capture:!0}),/\1/)},{begin:v("m|qr",/\(/,/\)/)},{begin:v("m|qr",/\[/,/\]/)},{begin:v("m|qr",/\{/,/\}/)}]}]},{className:"function",beginKeywords:"sub method",end:"(\\s*\\(.*?\\))?[;{]",excludeEnd:!0,relevance:5,contains:[e.TITLE_MODE,d]},{className:"class",beginKeywords:"class",end:"[;{]",excludeEnd:!0,relevance:5,contains:[e.TITLE_MODE,d,p]},{begin:"-\\w\\b",relevance:0},{begin:"^__DATA__$",end:"^__END__$",subLanguage:"mojolicious",contains:[{begin:"^@@.*",end:"$",className:"comment"}]}];return l.contains=_,c.contains=_,{name:"Perl",aliases:["pl","pm"],keywords:s,contains:_}}function RV(e){const t=e.regex,n=/(?![A-Za-z0-9])(?![$])/,i=t.concat(/[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/,n),s=t.concat(/(\\?[A-Z][a-z0-9_\x7f-\xff]+|\\?[A-Z]+(?=[A-Z][a-z0-9_\x7f-\xff])){1,}/,n),l=t.concat(/[A-Z]+/,n),c={scope:"variable",match:"\\$+"+i},d={scope:"meta",variants:[{begin:/<\?php/,relevance:10},{begin:/<\?=/},{begin:/<\?/,relevance:.1},{begin:/\?>/}]},f={scope:"subst",variants:[{begin:/\$\w+/},{begin:/\{\$/,end:/\}/}]},p=e.inherit(e.APOS_STRING_MODE,{illegal:null}),m=e.inherit(e.QUOTE_STRING_MODE,{illegal:null,contains:e.QUOTE_STRING_MODE.contains.concat(f)}),g={begin:/<<<[ \t]*(?:(\w+)|"(\w+)")\n/,end:/[ \t]*(\w+)\b/,contains:e.QUOTE_STRING_MODE.contains.concat(f),"on:begin":(ue,V)=>{V.data._beginMatch=ue[1]||ue[2]},"on:end":(ue,V)=>{V.data._beginMatch!==ue[1]&&V.ignoreMatch()}},y=e.END_SAME_AS_BEGIN({begin:/<<<[ \t]*'(\w+)'\n/,end:/[ \t]*(\w+)\b/}),v=`[ 	
]`,_={scope:"string",variants:[m,p,g,y]},T={scope:"number",variants:[{begin:"\\b0[bB][01]+(?:_[01]+)*\\b"},{begin:"\\b0[oO][0-7]+(?:_[0-7]+)*\\b"},{begin:"\\b0[xX][\\da-fA-F]+(?:_[\\da-fA-F]+)*\\b"},{begin:"(?:\\b\\d+(?:_\\d+)*(\\.(?:\\d+(?:_\\d+)*))?|\\B\\.\\d+)(?:[eE][+-]?\\d+)?"}],relevance:0},N=["false","null","true"],C=["__CLASS__","__DIR__","__FILE__","__FUNCTION__","__COMPILER_HALT_OFFSET__","__LINE__","__METHOD__","__NAMESPACE__","__TRAIT__","die","echo","exit","include","include_once","print","require","require_once","array","abstract","and","as","binary","bool","boolean","break","callable","case","catch","class","clone","const","continue","declare","default","do","double","else","elseif","empty","enddeclare","endfor","endforeach","endif","endswitch","endwhile","enum","eval","extends","final","finally","float","for","foreach","from","global","goto","if","implements","instanceof","insteadof","int","integer","interface","isset","iterable","list","match|0","mixed","new","never","object","or","private","protected","public","readonly","real","return","string","switch","throw","trait","try","unset","use","var","void","while","xor","yield"],P=["Error|0","AppendIterator","ArgumentCountError","ArithmeticError","ArrayIterator","ArrayObject","AssertionError","BadFunctionCallException","BadMethodCallException","CachingIterator","CallbackFilterIterator","CompileError","Countable","DirectoryIterator","DivisionByZeroError","DomainException","EmptyIterator","ErrorException","Exception","FilesystemIterator","FilterIterator","GlobIterator","InfiniteIterator","InvalidArgumentException","IteratorIterator","LengthException","LimitIterator","LogicException","MultipleIterator","NoRewindIterator","OutOfBoundsException","OutOfRangeException","OuterIterator","OverflowException","ParentIterator","ParseError","RangeException","RecursiveArrayIterator","RecursiveCachingIterator","RecursiveCallbackFilterIterator","RecursiveDirectoryIterator","RecursiveFilterIterator","RecursiveIterator","RecursiveIteratorIterator","RecursiveRegexIterator","RecursiveTreeIterator","RegexIterator","RuntimeException","SeekableIterator","SplDoublyLinkedList","SplFileInfo","SplFileObject","SplFixedArray","SplHeap","SplMaxHeap","SplMinHeap","SplObjectStorage","SplObserver","SplPriorityQueue","SplQueue","SplStack","SplSubject","SplTempFileObject","TypeError","UnderflowException","UnexpectedValueException","UnhandledMatchError","ArrayAccess","BackedEnum","Closure","Fiber","Generator","Iterator","IteratorAggregate","Serializable","Stringable","Throwable","Traversable","UnitEnum","WeakReference","WeakMap","Directory","__PHP_Incomplete_Class","parent","php_user_filter","self","static","stdClass"],I={keyword:C,literal:(ue=>{const V=[];return ue.forEach(B=>{V.push(B),B.toLowerCase()===B?V.push(B.toUpperCase()):V.push(B.toLowerCase())}),V})(N),built_in:P},D=ue=>ue.map(V=>V.replace(/\|\d+$/,"")),M={variants:[{match:[/new/,t.concat(v,"+"),t.concat("(?!",D(P).join("\\b|"),"\\b)"),s],scope:{1:"keyword",4:"title.class"}}]},z=t.concat(i,"\\b(?!\\()"),Z={variants:[{match:[t.concat(/::/,t.lookahead(/(?!class\b)/)),z],scope:{2:"variable.constant"}},{match:[/::/,/class/],scope:{2:"variable.language"}},{match:[s,t.concat(/::/,t.lookahead(/(?!class\b)/)),z],scope:{1:"title.class",3:"variable.constant"}},{match:[s,t.concat("::",t.lookahead(/(?!class\b)/))],scope:{1:"title.class"}},{match:[s,/::/,/class/],scope:{1:"title.class",3:"variable.language"}}]},W={scope:"attr",match:t.concat(i,t.lookahead(":"),t.lookahead(/(?!::)/))},$={relevance:0,begin:/\(/,end:/\)/,keywords:I,contains:[W,c,Z,e.C_BLOCK_COMMENT_MODE,_,T,M]},re={relevance:0,match:[/\b/,t.concat("(?!fn\\b|function\\b|",D(C).join("\\b|"),"|",D(P).join("\\b|"),"\\b)"),i,t.concat(v,"*"),t.lookahead(/(?=\()/)],scope:{3:"title.function.invoke"},contains:[$]};$.contains.push(re);const se=[W,Z,e.C_BLOCK_COMMENT_MODE,_,T,M],Se={begin:t.concat(/#\[\s*\\?/,t.either(s,l)),beginScope:"meta",end:/]/,endScope:"meta",keywords:{literal:N,keyword:["new","array"]},contains:[{begin:/\[/,end:/]/,keywords:{literal:N,keyword:["new","array"]},contains:["self",...se]},...se,{scope:"meta",variants:[{match:s},{match:l}]}]};return{case_insensitive:!1,keywords:I,contains:[Se,e.HASH_COMMENT_MODE,e.COMMENT("//","$"),e.COMMENT("/\\*","\\*/",{contains:[{scope:"doctag",match:"@[A-Za-z]+"}]}),{match:/__halt_compiler\(\);/,keywords:"__halt_compiler",starts:{scope:"comment",end:e.MATCH_NOTHING_RE,contains:[{match:/\?>/,scope:"meta",endsParent:!0}]}},d,{scope:"variable.language",match:/\$this\b/},c,re,Z,{match:[/const/,/\s/,i],scope:{1:"keyword",3:"variable.constant"}},M,{scope:"function",relevance:0,beginKeywords:"fn function",end:/[;{]/,excludeEnd:!0,illegal:"[$%\\[]",contains:[{beginKeywords:"use"},e.UNDERSCORE_TITLE_MODE,{begin:"=>",endsParent:!0},{scope:"params",begin:"\\(",end:"\\)",excludeBegin:!0,excludeEnd:!0,keywords:I,contains:["self",Se,c,Z,e.C_BLOCK_COMMENT_MODE,_,T]}]},{scope:"class",variants:[{beginKeywords:"enum",illegal:/[($"]/},{beginKeywords:"class interface trait",illegal:/[:($"]/}],relevance:0,end:/\{/,excludeEnd:!0,contains:[{beginKeywords:"extends implements"},e.UNDERSCORE_TITLE_MODE]},{beginKeywords:"namespace",relevance:0,end:";",illegal:/[.']/,contains:[e.inherit(e.UNDERSCORE_TITLE_MODE,{scope:"title.class"})]},{beginKeywords:"use",relevance:0,end:";",contains:[{match:/\b(as|const|function)\b/,scope:"keyword"},e.UNDERSCORE_TITLE_MODE]},_,T]}}function NV(e){return{name:"PHP template",subLanguage:"xml",contains:[{begin:/<\?(php|=)?/,end:/\?>/,subLanguage:"php",contains:[{begin:"/\\*",end:"\\*/",skip:!0},{begin:'b"',end:'"',skip:!0},{begin:"b'",end:"'",skip:!0},e.inherit(e.APOS_STRING_MODE,{illegal:null,className:null,contains:null,skip:!0}),e.inherit(e.QUOTE_STRING_MODE,{illegal:null,className:null,contains:null,skip:!0})]}]}}function AV(e){return{name:"Plain text",aliases:["text","txt"],disableAutodetect:!0}}function DV(e){const t=e.regex,n=new RegExp("[\\p{XID_Start}_]\\p{XID_Continue}*","u"),i=["and","as","assert","async","await","break","case","class","continue","def","del","elif","else","except","finally","for","from","global","if","import","in","is","lambda","match","nonlocal|10","not","or","pass","raise","return","try","while","with","yield"],d={$pattern:/[A-Za-z]\w+|__\w+__/,keyword:i,built_in:["__import__","abs","all","any","ascii","bin","bool","breakpoint","bytearray","bytes","callable","chr","classmethod","compile","complex","delattr","dict","dir","divmod","enumerate","eval","exec","filter","float","format","frozenset","getattr","globals","hasattr","hash","help","hex","id","input","int","isinstance","issubclass","iter","len","list","locals","map","max","memoryview","min","next","object","oct","open","ord","pow","print","property","range","repr","reversed","round","set","setattr","slice","sorted","staticmethod","str","sum","super","tuple","type","vars","zip"],literal:["__debug__","Ellipsis","False","None","NotImplemented","True"],type:["Any","Callable","Coroutine","Dict","List","Literal","Generic","Optional","Sequence","Set","Tuple","Type","Union"]},f={className:"meta",begin:/^(>>>|\.\.\.) /},p={className:"subst",begin:/\{/,end:/\}/,keywords:d,illegal:/#/},m={begin:/\{\{/,relevance:0},g={className:"string",contains:[e.BACKSLASH_ESCAPE],variants:[{begin:/([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,end:/'''/,contains:[e.BACKSLASH_ESCAPE,f],relevance:10},{begin:/([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,end:/"""/,contains:[e.BACKSLASH_ESCAPE,f],relevance:10},{begin:/([fF][rR]|[rR][fF]|[fF])'''/,end:/'''/,contains:[e.BACKSLASH_ESCAPE,f,m,p]},{begin:/([fF][rR]|[rR][fF]|[fF])"""/,end:/"""/,contains:[e.BACKSLASH_ESCAPE,f,m,p]},{begin:/([uU]|[rR])'/,end:/'/,relevance:10},{begin:/([uU]|[rR])"/,end:/"/,relevance:10},{begin:/([bB]|[bB][rR]|[rR][bB])'/,end:/'/},{begin:/([bB]|[bB][rR]|[rR][bB])"/,end:/"/},{begin:/([fF][rR]|[rR][fF]|[fF])'/,end:/'/,contains:[e.BACKSLASH_ESCAPE,m,p]},{begin:/([fF][rR]|[rR][fF]|[fF])"/,end:/"/,contains:[e.BACKSLASH_ESCAPE,m,p]},e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]},y="[0-9](_?[0-9])*",v=`(\\b(${y}))?\\.(${y})|\\b(${y})\\.`,_=`\\b|${i.join("|")}`,T={className:"number",relevance:0,variants:[{begin:`(\\b(${y})|(${v}))[eE][+-]?(${y})[jJ]?(?=${_})`},{begin:`(${v})[jJ]?`},{begin:`\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${_})`},{begin:`\\b0[bB](_?[01])+[lL]?(?=${_})`},{begin:`\\b0[oO](_?[0-7])+[lL]?(?=${_})`},{begin:`\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${_})`},{begin:`\\b(${y})[jJ](?=${_})`}]},N={className:"comment",begin:t.lookahead(/# type:/),end:/$/,keywords:d,contains:[{begin:/# type:/},{begin:/#/,end:/\b\B/,endsWithParent:!0}]},C={className:"params",variants:[{className:"",begin:/\(\s*\)/,skip:!0},{begin:/\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:d,contains:["self",f,T,g,e.HASH_COMMENT_MODE]}]};return p.contains=[g,T,f],{name:"Python",aliases:["py","gyp","ipython"],unicodeRegex:!0,keywords:d,illegal:/(<\/|\?)|=>/,contains:[f,T,{scope:"variable.language",match:/\bself\b/},{beginKeywords:"if",relevance:0},{match:/\bor\b/,scope:"keyword"},g,N,e.HASH_COMMENT_MODE,{match:[/\bdef/,/\s+/,n],scope:{1:"keyword",3:"title.function"},contains:[C]},{variants:[{match:[/\bclass/,/\s+/,n,/\s*/,/\(\s*/,n,/\s*\)/]},{match:[/\bclass/,/\s+/,n]}],scope:{1:"keyword",3:"title.class",6:"title.class.inherited"}},{className:"meta",begin:/^[\t ]*@/,end:/(?=#)|$/,contains:[T,C,g]}]}}function kV(e){return{aliases:["pycon"],contains:[{className:"meta.prompt",starts:{end:/ |$/,starts:{end:"$",subLanguage:"python"}},variants:[{begin:/^>>>(?=[ ]|$)/},{begin:/^\.\.\.(?=[ ]|$)/}]}]}}function MV(e){const t=e.regex,n=/(?:(?:[a-zA-Z]|\.[._a-zA-Z])[._a-zA-Z0-9]*)|\.(?!\d)/,i=t.either(/0[xX][0-9a-fA-F]+\.[0-9a-fA-F]*[pP][+-]?\d+i?/,/0[xX][0-9a-fA-F]+(?:[pP][+-]?\d+)?[Li]?/,/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[Li]?/),s=/[=!<>:]=|\|\||&&|:::?|<-|<<-|->>|->|\|>|[-+*\/?!$&|:<=>@^~]|\*\*/,l=t.either(/[()]/,/[{}]/,/\[\[/,/[[\]]/,/\\/,/,/);return{name:"R",keywords:{$pattern:n,keyword:"function if in break next repeat else for while",literal:"NULL NA TRUE FALSE Inf NaN NA_integer_|10 NA_real_|10 NA_character_|10 NA_complex_|10",built_in:"LETTERS letters month.abb month.name pi T F abs acos acosh all any anyNA Arg as.call as.character as.complex as.double as.environment as.integer as.logical as.null.default as.numeric as.raw asin asinh atan atanh attr attributes baseenv browser c call ceiling class Conj cos cosh cospi cummax cummin cumprod cumsum digamma dim dimnames emptyenv exp expression floor forceAndCall gamma gc.time globalenv Im interactive invisible is.array is.atomic is.call is.character is.complex is.double is.environment is.expression is.finite is.function is.infinite is.integer is.language is.list is.logical is.matrix is.na is.name is.nan is.null is.numeric is.object is.pairlist is.raw is.recursive is.single is.symbol lazyLoadDBfetch length lgamma list log max min missing Mod names nargs nzchar oldClass on.exit pos.to.env proc.time prod quote range Re rep retracemem return round seq_along seq_len seq.int sign signif sin sinh sinpi sqrt standardGeneric substitute sum switch tan tanh tanpi tracemem trigamma trunc unclass untracemem UseMethod xtfrm"},contains:[e.COMMENT(/#'/,/$/,{contains:[{scope:"doctag",match:/@examples/,starts:{end:t.lookahead(t.either(/\n^#'\s*(?=@[a-zA-Z]+)/,/\n^(?!#')/)),endsParent:!0}},{scope:"doctag",begin:"@param",end:/$/,contains:[{scope:"variable",variants:[{match:n},{match:/`(?:\\.|[^`\\])+`/}],endsParent:!0}]},{scope:"doctag",match:/@[a-zA-Z]+/},{scope:"keyword",match:/\\[a-zA-Z]+/}]}),e.HASH_COMMENT_MODE,{scope:"string",contains:[e.BACKSLASH_ESCAPE],variants:[e.END_SAME_AS_BEGIN({begin:/[rR]"(-*)\(/,end:/\)(-*)"/}),e.END_SAME_AS_BEGIN({begin:/[rR]"(-*)\{/,end:/\}(-*)"/}),e.END_SAME_AS_BEGIN({begin:/[rR]"(-*)\[/,end:/\](-*)"/}),e.END_SAME_AS_BEGIN({begin:/[rR]'(-*)\(/,end:/\)(-*)'/}),e.END_SAME_AS_BEGIN({begin:/[rR]'(-*)\{/,end:/\}(-*)'/}),e.END_SAME_AS_BEGIN({begin:/[rR]'(-*)\[/,end:/\](-*)'/}),{begin:'"',end:'"',relevance:0},{begin:"'",end:"'",relevance:0}]},{relevance:0,variants:[{scope:{1:"operator",2:"number"},match:[s,i]},{scope:{1:"operator",2:"number"},match:[/%[^%]*%/,i]},{scope:{1:"punctuation",2:"number"},match:[l,i]},{scope:{2:"number"},match:[/[^a-zA-Z0-9._]|^/,i]}]},{scope:{3:"operator"},match:[n,/\s+/,/<-/,/\s+/]},{scope:"operator",relevance:0,variants:[{match:s},{match:/%[^%]*%/}]},{scope:"punctuation",relevance:0,match:l},{begin:"`",end:"`",contains:[{begin:/\\./}]}]}}function PV(e){const t=e.regex,n="([a-zA-Z_]\\w*[!?=]?|[-+~]@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?)",i=t.either(/\b([A-Z]+[a-z0-9]+)+/,/\b([A-Z]+[a-z0-9]+)+[A-Z]+/),s=t.concat(i,/(::\w+)*/),c={"variable.constant":["__FILE__","__LINE__","__ENCODING__"],"variable.language":["self","super"],keyword:["alias","and","begin","BEGIN","break","case","class","defined","do","else","elsif","end","END","ensure","for","if","in","module","next","not","or","redo","require","rescue","retry","return","then","undef","unless","until","when","while","yield",...["include","extend","prepend","public","private","protected","raise","throw"]],built_in:["proc","lambda","attr_accessor","attr_reader","attr_writer","define_method","private_constant","module_function"],literal:["true","false","nil"]},d={className:"doctag",begin:"@[A-Za-z]+"},f={begin:"#<",end:">"},p=[e.COMMENT("#","$",{contains:[d]}),e.COMMENT("^=begin","^=end",{contains:[d],relevance:10}),e.COMMENT("^__END__",e.MATCH_NOTHING_RE)],m={className:"subst",begin:/#\{/,end:/\}/,keywords:c},g={className:"string",contains:[e.BACKSLASH_ESCAPE,m],variants:[{begin:/'/,end:/'/},{begin:/"/,end:/"/},{begin:/`/,end:/`/},{begin:/%[qQwWx]?\(/,end:/\)/},{begin:/%[qQwWx]?\[/,end:/\]/},{begin:/%[qQwWx]?\{/,end:/\}/},{begin:/%[qQwWx]?</,end:/>/},{begin:/%[qQwWx]?\//,end:/\//},{begin:/%[qQwWx]?%/,end:/%/},{begin:/%[qQwWx]?-/,end:/-/},{begin:/%[qQwWx]?\|/,end:/\|/},{begin:/\B\?(\\\d{1,3})/},{begin:/\B\?(\\x[A-Fa-f0-9]{1,2})/},{begin:/\B\?(\\u\{?[A-Fa-f0-9]{1,6}\}?)/},{begin:/\B\?(\\M-\\C-|\\M-\\c|\\c\\M-|\\M-|\\C-\\M-)[\x20-\x7e]/},{begin:/\B\?\\(c|C-)[\x20-\x7e]/},{begin:/\B\?\\?\S/},{begin:t.concat(/<<[-~]?'?/,t.lookahead(/(\w+)(?=\W)[^\n]*\n(?:[^\n]*\n)*?\s*\1\b/)),contains:[e.END_SAME_AS_BEGIN({begin:/(\w+)/,end:/(\w+)/,contains:[e.BACKSLASH_ESCAPE,m]})]}]},y="[1-9](_?[0-9])*|0",v="[0-9](_?[0-9])*",_={className:"number",relevance:0,variants:[{begin:`\\b(${y})(\\.(${v}))?([eE][+-]?(${v})|r)?i?\\b`},{begin:"\\b0[dD][0-9](_?[0-9])*r?i?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*r?i?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*r?i?\\b"},{begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*r?i?\\b"},{begin:"\\b0(_?[0-7])+r?i?\\b"}]},T={variants:[{match:/\(\)/},{className:"params",begin:/\(/,end:/(?=\))/,excludeBegin:!0,endsParent:!0,keywords:c}]},M=[g,{variants:[{match:[/class\s+/,s,/\s+<\s+/,s]},{match:[/\b(class|module)\s+/,s]}],scope:{2:"title.class",4:"title.class.inherited"},keywords:c},{match:[/(include|extend)\s+/,s],scope:{2:"title.class"},keywords:c},{relevance:0,match:[s,/\.new[. (]/],scope:{1:"title.class"}},{relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,className:"variable.constant"},{relevance:0,match:i,scope:"title.class"},{match:[/def/,/\s+/,n],scope:{1:"keyword",3:"title.function"},contains:[T]},{begin:e.IDENT_RE+"::"},{className:"symbol",begin:e.UNDERSCORE_IDENT_RE+"(!|\\?)?:",relevance:0},{className:"symbol",begin:":(?!\\s)",contains:[g,{begin:n}],relevance:0},_,{className:"variable",begin:"(\\$\\W)|((\\$|@@?)(\\w+))(?=[^@$?])(?![A-Za-z])(?![@$?'])"},{className:"params",begin:/\|(?!=)/,end:/\|/,excludeBegin:!0,excludeEnd:!0,relevance:0,keywords:c},{begin:"("+e.RE_STARTERS_RE+"|unless)\\s*",keywords:"unless",contains:[{className:"regexp",contains:[e.BACKSLASH_ESCAPE,m],illegal:/\n/,variants:[{begin:"/",end:"/[a-z]*"},{begin:/%r\{/,end:/\}[a-z]*/},{begin:"%r\\(",end:"\\)[a-z]*"},{begin:"%r!",end:"![a-z]*"},{begin:"%r\\[",end:"\\][a-z]*"}]}].concat(f,p),relevance:0}].concat(f,p);m.contains=M,T.contains=M;const $=[{begin:/^\s*=>/,starts:{end:"$",contains:M}},{className:"meta.prompt",begin:"^("+"[>?]>"+"|"+"[\\w#]+\\(\\w+\\):\\d+:\\d+[>*]"+"|"+"(\\w+-)?\\d+\\.\\d+\\.\\d+(p\\d+)?[^\\d][^>]+>"+")(?=[ ])",starts:{end:"$",keywords:c,contains:M}}];return p.unshift(f),{name:"Ruby",aliases:["rb","gemspec","podspec","thor","irb"],keywords:c,illegal:/\/\*/,contains:[e.SHEBANG({binary:"ruby"})].concat($).concat(p).concat(M)}}function IV(e){const t=e.regex,n=/(r#)?/,i=t.concat(n,e.UNDERSCORE_IDENT_RE),s=t.concat(n,e.IDENT_RE),l={className:"title.function.invoke",relevance:0,begin:t.concat(/\b/,/(?!let|for|while|if|else|match\b)/,s,t.lookahead(/\s*\(/))},c="([ui](8|16|32|64|128|size)|f(32|64))?",d=["abstract","as","async","await","become","box","break","const","continue","crate","do","dyn","else","enum","extern","false","final","fn","for","if","impl","in","let","loop","macro","match","mod","move","mut","override","priv","pub","ref","return","self","Self","static","struct","super","trait","true","try","type","typeof","union","unsafe","unsized","use","virtual","where","while","yield"],f=["true","false","Some","None","Ok","Err"],p=["drop ","Copy","Send","Sized","Sync","Drop","Fn","FnMut","FnOnce","ToOwned","Clone","Debug","PartialEq","PartialOrd","Eq","Ord","AsRef","AsMut","Into","From","Default","Iterator","Extend","IntoIterator","DoubleEndedIterator","ExactSizeIterator","SliceConcatExt","ToString","assert!","assert_eq!","bitflags!","bytes!","cfg!","col!","concat!","concat_idents!","debug_assert!","debug_assert_eq!","env!","eprintln!","panic!","file!","format!","format_args!","include_bytes!","include_str!","line!","local_data_key!","module_path!","option_env!","print!","println!","select!","stringify!","try!","unimplemented!","unreachable!","vec!","write!","writeln!","macro_rules!","assert_ne!","debug_assert_ne!"],m=["i8","i16","i32","i64","i128","isize","u8","u16","u32","u64","u128","usize","f32","f64","str","char","bool","Box","Option","Result","String","Vec"];return{name:"Rust",aliases:["rs"],keywords:{$pattern:e.IDENT_RE+"!?",type:m,keyword:d,literal:f,built_in:p},illegal:"</",contains:[e.C_LINE_COMMENT_MODE,e.COMMENT("/\\*","\\*/",{contains:["self"]}),e.inherit(e.QUOTE_STRING_MODE,{begin:/b?"/,illegal:null}),{className:"symbol",begin:/'[a-zA-Z_][a-zA-Z0-9_]*(?!')/},{scope:"string",variants:[{begin:/b?r(#*)"(.|\n)*?"\1(?!#)/},{begin:/b?'/,end:/'/,contains:[{scope:"char.escape",match:/\\('|\w|x\w{2}|u\w{4}|U\w{8})/}]}]},{className:"number",variants:[{begin:"\\b0b([01_]+)"+c},{begin:"\\b0o([0-7_]+)"+c},{begin:"\\b0x([A-Fa-f0-9_]+)"+c},{begin:"\\b(\\d[\\d_]*(\\.[0-9_]+)?([eE][+-]?[0-9_]+)?)"+c}],relevance:0},{begin:[/fn/,/\s+/,i],className:{1:"keyword",3:"title.function"}},{className:"meta",begin:"#!?\\[",end:"\\]",contains:[{className:"string",begin:/"/,end:/"/,contains:[e.BACKSLASH_ESCAPE]}]},{begin:[/let/,/\s+/,/(?:mut\s+)?/,i],className:{1:"keyword",3:"keyword",4:"variable"}},{begin:[/for/,/\s+/,i,/\s+/,/in/],className:{1:"keyword",3:"variable",5:"keyword"}},{begin:[/type/,/\s+/,i],className:{1:"keyword",3:"title.class"}},{begin:[/(?:trait|enum|struct|union|impl|for)/,/\s+/,i],className:{1:"keyword",3:"title.class"}},{begin:e.IDENT_RE+"::",keywords:{keyword:"Self",built_in:p,type:m}},{className:"punctuation",begin:"->"},l]}}const LV=e=>({IMPORTANT:{scope:"meta",begin:"!important"},BLOCK_COMMENT:e.C_BLOCK_COMMENT_MODE,HEXCOLOR:{scope:"number",begin:/#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/},FUNCTION_DISPATCH:{className:"built_in",begin:/[\w-]+(?=\()/},ATTRIBUTE_SELECTOR_MODE:{scope:"selector-attr",begin:/\[/,end:/\]/,illegal:"$",contains:[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]},CSS_NUMBER_MODE:{scope:"number",begin:e.NUMBER_RE+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",relevance:0},CSS_VARIABLE:{className:"attr",begin:/--[A-Za-z_][A-Za-z0-9_-]*/}}),jV=["a","abbr","address","article","aside","audio","b","blockquote","body","button","canvas","caption","cite","code","dd","del","details","dfn","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","html","i","iframe","img","input","ins","kbd","label","legend","li","main","mark","menu","nav","object","ol","optgroup","option","p","picture","q","quote","samp","section","select","source","span","strong","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","ul","var","video"],$V=["defs","g","marker","mask","pattern","svg","switch","symbol","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feFlood","feGaussianBlur","feImage","feMerge","feMorphology","feOffset","feSpecularLighting","feTile","feTurbulence","linearGradient","radialGradient","stop","circle","ellipse","image","line","path","polygon","polyline","rect","text","use","textPath","tspan","foreignObject","clipPath"],zV=[...jV,...$V],BV=["any-hover","any-pointer","aspect-ratio","color","color-gamut","color-index","device-aspect-ratio","device-height","device-width","display-mode","forced-colors","grid","height","hover","inverted-colors","monochrome","orientation","overflow-block","overflow-inline","pointer","prefers-color-scheme","prefers-contrast","prefers-reduced-motion","prefers-reduced-transparency","resolution","scan","scripting","update","width","min-width","max-width","min-height","max-height"].sort().reverse(),FV=["active","any-link","blank","checked","current","default","defined","dir","disabled","drop","empty","enabled","first","first-child","first-of-type","fullscreen","future","focus","focus-visible","focus-within","has","host","host-context","hover","indeterminate","in-range","invalid","is","lang","last-child","last-of-type","left","link","local-link","not","nth-child","nth-col","nth-last-child","nth-last-col","nth-last-of-type","nth-of-type","only-child","only-of-type","optional","out-of-range","past","placeholder-shown","read-only","read-write","required","right","root","scope","target","target-within","user-invalid","valid","visited","where"].sort().reverse(),UV=["after","backdrop","before","cue","cue-region","first-letter","first-line","grammar-error","marker","part","placeholder","selection","slotted","spelling-error"].sort().reverse(),HV=["accent-color","align-content","align-items","align-self","alignment-baseline","all","anchor-name","animation","animation-composition","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-range","animation-range-end","animation-range-start","animation-timeline","animation-timing-function","appearance","aspect-ratio","backdrop-filter","backface-visibility","background","background-attachment","background-blend-mode","background-clip","background-color","background-image","background-origin","background-position","background-position-x","background-position-y","background-repeat","background-size","baseline-shift","block-size","border","border-block","border-block-color","border-block-end","border-block-end-color","border-block-end-style","border-block-end-width","border-block-start","border-block-start-color","border-block-start-style","border-block-start-width","border-block-style","border-block-width","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-end-end-radius","border-end-start-radius","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-inline","border-inline-color","border-inline-end","border-inline-end-color","border-inline-end-style","border-inline-end-width","border-inline-start","border-inline-start-color","border-inline-start-style","border-inline-start-width","border-inline-style","border-inline-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-start-end-radius","border-start-start-radius","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-align","box-decoration-break","box-direction","box-flex","box-flex-group","box-lines","box-ordinal-group","box-orient","box-pack","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","caret-color","clear","clip","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","color-scheme","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","contain","contain-intrinsic-block-size","contain-intrinsic-height","contain-intrinsic-inline-size","contain-intrinsic-size","contain-intrinsic-width","container","container-name","container-type","content","content-visibility","counter-increment","counter-reset","counter-set","cue","cue-after","cue-before","cursor","cx","cy","direction","display","dominant-baseline","empty-cells","enable-background","field-sizing","fill","fill-opacity","fill-rule","filter","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","flood-color","flood-opacity","flow","font","font-display","font-family","font-feature-settings","font-kerning","font-language-override","font-optical-sizing","font-palette","font-size","font-size-adjust","font-smooth","font-smoothing","font-stretch","font-style","font-synthesis","font-synthesis-position","font-synthesis-small-caps","font-synthesis-style","font-synthesis-weight","font-variant","font-variant-alternates","font-variant-caps","font-variant-east-asian","font-variant-emoji","font-variant-ligatures","font-variant-numeric","font-variant-position","font-variation-settings","font-weight","forced-color-adjust","gap","glyph-orientation-horizontal","glyph-orientation-vertical","grid","grid-area","grid-auto-columns","grid-auto-flow","grid-auto-rows","grid-column","grid-column-end","grid-column-start","grid-gap","grid-row","grid-row-end","grid-row-start","grid-template","grid-template-areas","grid-template-columns","grid-template-rows","hanging-punctuation","height","hyphenate-character","hyphenate-limit-chars","hyphens","icon","image-orientation","image-rendering","image-resolution","ime-mode","initial-letter","initial-letter-align","inline-size","inset","inset-area","inset-block","inset-block-end","inset-block-start","inset-inline","inset-inline-end","inset-inline-start","isolation","justify-content","justify-items","justify-self","kerning","left","letter-spacing","lighting-color","line-break","line-height","line-height-step","list-style","list-style-image","list-style-position","list-style-type","margin","margin-block","margin-block-end","margin-block-start","margin-bottom","margin-inline","margin-inline-end","margin-inline-start","margin-left","margin-right","margin-top","margin-trim","marker","marker-end","marker-mid","marker-start","marks","mask","mask-border","mask-border-mode","mask-border-outset","mask-border-repeat","mask-border-slice","mask-border-source","mask-border-width","mask-clip","mask-composite","mask-image","mask-mode","mask-origin","mask-position","mask-repeat","mask-size","mask-type","masonry-auto-flow","math-depth","math-shift","math-style","max-block-size","max-height","max-inline-size","max-width","min-block-size","min-height","min-inline-size","min-width","mix-blend-mode","nav-down","nav-index","nav-left","nav-right","nav-up","none","normal","object-fit","object-position","offset","offset-anchor","offset-distance","offset-path","offset-position","offset-rotate","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-anchor","overflow-block","overflow-clip-margin","overflow-inline","overflow-wrap","overflow-x","overflow-y","overlay","overscroll-behavior","overscroll-behavior-block","overscroll-behavior-inline","overscroll-behavior-x","overscroll-behavior-y","padding","padding-block","padding-block-end","padding-block-start","padding-bottom","padding-inline","padding-inline-end","padding-inline-start","padding-left","padding-right","padding-top","page","page-break-after","page-break-before","page-break-inside","paint-order","pause","pause-after","pause-before","perspective","perspective-origin","place-content","place-items","place-self","pointer-events","position","position-anchor","position-visibility","print-color-adjust","quotes","r","resize","rest","rest-after","rest-before","right","rotate","row-gap","ruby-align","ruby-position","scale","scroll-behavior","scroll-margin","scroll-margin-block","scroll-margin-block-end","scroll-margin-block-start","scroll-margin-bottom","scroll-margin-inline","scroll-margin-inline-end","scroll-margin-inline-start","scroll-margin-left","scroll-margin-right","scroll-margin-top","scroll-padding","scroll-padding-block","scroll-padding-block-end","scroll-padding-block-start","scroll-padding-bottom","scroll-padding-inline","scroll-padding-inline-end","scroll-padding-inline-start","scroll-padding-left","scroll-padding-right","scroll-padding-top","scroll-snap-align","scroll-snap-stop","scroll-snap-type","scroll-timeline","scroll-timeline-axis","scroll-timeline-name","scrollbar-color","scrollbar-gutter","scrollbar-width","shape-image-threshold","shape-margin","shape-outside","shape-rendering","speak","speak-as","src","stop-color","stop-opacity","stroke","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke-width","tab-size","table-layout","text-align","text-align-all","text-align-last","text-anchor","text-combine-upright","text-decoration","text-decoration-color","text-decoration-line","text-decoration-skip","text-decoration-skip-ink","text-decoration-style","text-decoration-thickness","text-emphasis","text-emphasis-color","text-emphasis-position","text-emphasis-style","text-indent","text-justify","text-orientation","text-overflow","text-rendering","text-shadow","text-size-adjust","text-transform","text-underline-offset","text-underline-position","text-wrap","text-wrap-mode","text-wrap-style","timeline-scope","top","touch-action","transform","transform-box","transform-origin","transform-style","transition","transition-behavior","transition-delay","transition-duration","transition-property","transition-timing-function","translate","unicode-bidi","user-modify","user-select","vector-effect","vertical-align","view-timeline","view-timeline-axis","view-timeline-inset","view-timeline-name","view-transition-name","visibility","voice-balance","voice-duration","voice-family","voice-pitch","voice-range","voice-rate","voice-stress","voice-volume","white-space","white-space-collapse","widows","width","will-change","word-break","word-spacing","word-wrap","writing-mode","x","y","z-index","zoom"].sort().reverse();function qV(e){const t=LV(e),n=UV,i=FV,s="@[a-z-]+",l="and or not only",d={className:"variable",begin:"(\\$"+"[a-zA-Z-][a-zA-Z0-9_-]*"+")\\b",relevance:0};return{name:"SCSS",case_insensitive:!0,illegal:"[=/|']",contains:[e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,t.CSS_NUMBER_MODE,{className:"selector-id",begin:"#[A-Za-z0-9_-]+",relevance:0},{className:"selector-class",begin:"\\.[A-Za-z0-9_-]+",relevance:0},t.ATTRIBUTE_SELECTOR_MODE,{className:"selector-tag",begin:"\\b("+zV.join("|")+")\\b",relevance:0},{className:"selector-pseudo",begin:":("+i.join("|")+")"},{className:"selector-pseudo",begin:":(:)?("+n.join("|")+")"},d,{begin:/\(/,end:/\)/,contains:[t.CSS_NUMBER_MODE]},t.CSS_VARIABLE,{className:"attribute",begin:"\\b("+HV.join("|")+")\\b"},{begin:"\\b(whitespace|wait|w-resize|visible|vertical-text|vertical-ideographic|uppercase|upper-roman|upper-alpha|underline|transparent|top|thin|thick|text|text-top|text-bottom|tb-rl|table-header-group|table-footer-group|sw-resize|super|strict|static|square|solid|small-caps|separate|se-resize|scroll|s-resize|rtl|row-resize|ridge|right|repeat|repeat-y|repeat-x|relative|progress|pointer|overline|outside|outset|oblique|nowrap|not-allowed|normal|none|nw-resize|no-repeat|no-drop|newspaper|ne-resize|n-resize|move|middle|medium|ltr|lr-tb|lowercase|lower-roman|lower-alpha|loose|list-item|line|line-through|line-edge|lighter|left|keep-all|justify|italic|inter-word|inter-ideograph|inside|inset|inline|inline-block|inherit|inactive|ideograph-space|ideograph-parenthesis|ideograph-numeric|ideograph-alpha|horizontal|hidden|help|hand|groove|fixed|ellipsis|e-resize|double|dotted|distribute|distribute-space|distribute-letter|distribute-all-lines|disc|disabled|default|decimal|dashed|crosshair|collapse|col-resize|circle|char|center|capitalize|break-word|break-all|bottom|both|bolder|bold|block|bidi-override|below|baseline|auto|always|all-scroll|absolute|table|table-cell)\\b"},{begin:/:/,end:/[;}{]/,relevance:0,contains:[t.BLOCK_COMMENT,d,t.HEXCOLOR,t.CSS_NUMBER_MODE,e.QUOTE_STRING_MODE,e.APOS_STRING_MODE,t.IMPORTANT,t.FUNCTION_DISPATCH]},{begin:"@(page|font-face)",keywords:{$pattern:s,keyword:"@page @font-face"}},{begin:"@",end:"[{;]",returnBegin:!0,keywords:{$pattern:/[a-z-]+/,keyword:l,attribute:BV.join(" ")},contains:[{begin:s,className:"keyword"},{begin:/[a-z-]+(?=:)/,className:"attribute"},d,e.QUOTE_STRING_MODE,e.APOS_STRING_MODE,t.HEXCOLOR,t.CSS_NUMBER_MODE]},t.FUNCTION_DISPATCH]}}function GV(e){return{name:"Shell Session",aliases:["console","shellsession"],contains:[{className:"meta.prompt",begin:/^\s{0,3}[/~\w\d[\]()@-]*[>%$#][ ]?/,starts:{end:/[^\\](?=\s*$)/,subLanguage:"bash"}}]}}function VV(e){const t=e.regex,n=e.COMMENT("--","$"),i={scope:"string",variants:[{begin:/'/,end:/'/,contains:[{match:/''/}]}]},s={begin:/"/,end:/"/,contains:[{match:/""/}]},l=["true","false","unknown"],c=["double precision","large object","with timezone","without timezone"],d=["bigint","binary","blob","boolean","char","character","clob","date","dec","decfloat","decimal","float","int","integer","interval","nchar","nclob","national","numeric","real","row","smallint","time","timestamp","varchar","varying","varbinary"],f=["add","asc","collation","desc","final","first","last","view"],p=["abs","acos","all","allocate","alter","and","any","are","array","array_agg","array_max_cardinality","as","asensitive","asin","asymmetric","at","atan","atomic","authorization","avg","begin","begin_frame","begin_partition","between","bigint","binary","blob","boolean","both","by","call","called","cardinality","cascaded","case","cast","ceil","ceiling","char","char_length","character","character_length","check","classifier","clob","close","coalesce","collate","collect","column","commit","condition","connect","constraint","contains","convert","copy","corr","corresponding","cos","cosh","count","covar_pop","covar_samp","create","cross","cube","cume_dist","current","current_catalog","current_date","current_default_transform_group","current_path","current_role","current_row","current_schema","current_time","current_timestamp","current_path","current_role","current_transform_group_for_type","current_user","cursor","cycle","date","day","deallocate","dec","decimal","decfloat","declare","default","define","delete","dense_rank","deref","describe","deterministic","disconnect","distinct","double","drop","dynamic","each","element","else","empty","end","end_frame","end_partition","end-exec","equals","escape","every","except","exec","execute","exists","exp","external","extract","false","fetch","filter","first_value","float","floor","for","foreign","frame_row","free","from","full","function","fusion","get","global","grant","group","grouping","groups","having","hold","hour","identity","in","indicator","initial","inner","inout","insensitive","insert","int","integer","intersect","intersection","interval","into","is","join","json_array","json_arrayagg","json_exists","json_object","json_objectagg","json_query","json_table","json_table_primitive","json_value","lag","language","large","last_value","lateral","lead","leading","left","like","like_regex","listagg","ln","local","localtime","localtimestamp","log","log10","lower","match","match_number","match_recognize","matches","max","member","merge","method","min","minute","mod","modifies","module","month","multiset","national","natural","nchar","nclob","new","no","none","normalize","not","nth_value","ntile","null","nullif","numeric","octet_length","occurrences_regex","of","offset","old","omit","on","one","only","open","or","order","out","outer","over","overlaps","overlay","parameter","partition","pattern","per","percent","percent_rank","percentile_cont","percentile_disc","period","portion","position","position_regex","power","precedes","precision","prepare","primary","procedure","ptf","range","rank","reads","real","recursive","ref","references","referencing","regr_avgx","regr_avgy","regr_count","regr_intercept","regr_r2","regr_slope","regr_sxx","regr_sxy","regr_syy","release","result","return","returns","revoke","right","rollback","rollup","row","row_number","rows","running","savepoint","scope","scroll","search","second","seek","select","sensitive","session_user","set","show","similar","sin","sinh","skip","smallint","some","specific","specifictype","sql","sqlexception","sqlstate","sqlwarning","sqrt","start","static","stddev_pop","stddev_samp","submultiset","subset","substring","substring_regex","succeeds","sum","symmetric","system","system_time","system_user","table","tablesample","tan","tanh","then","time","timestamp","timezone_hour","timezone_minute","to","trailing","translate","translate_regex","translation","treat","trigger","trim","trim_array","true","truncate","uescape","union","unique","unknown","unnest","update","upper","user","using","value","values","value_of","var_pop","var_samp","varbinary","varchar","varying","versioning","when","whenever","where","width_bucket","window","with","within","without","year"],m=["abs","acos","array_agg","asin","atan","avg","cast","ceil","ceiling","coalesce","corr","cos","cosh","count","covar_pop","covar_samp","cume_dist","dense_rank","deref","element","exp","extract","first_value","floor","json_array","json_arrayagg","json_exists","json_object","json_objectagg","json_query","json_table","json_table_primitive","json_value","lag","last_value","lead","listagg","ln","log","log10","lower","max","min","mod","nth_value","ntile","nullif","percent_rank","percentile_cont","percentile_disc","position","position_regex","power","rank","regr_avgx","regr_avgy","regr_count","regr_intercept","regr_r2","regr_slope","regr_sxx","regr_sxy","regr_syy","row_number","sin","sinh","sqrt","stddev_pop","stddev_samp","substring","substring_regex","sum","tan","tanh","translate","translate_regex","treat","trim","trim_array","unnest","upper","value_of","var_pop","var_samp","width_bucket"],g=["current_catalog","current_date","current_default_transform_group","current_path","current_role","current_schema","current_transform_group_for_type","current_user","session_user","system_time","system_user","current_time","localtime","current_timestamp","localtimestamp"],y=["create table","insert into","primary key","foreign key","not null","alter table","add constraint","grouping sets","on overflow","character set","respect nulls","ignore nulls","nulls first","nulls last","depth first","breadth first"],v=m,_=[...p,...f].filter(D=>!m.includes(D)),T={scope:"variable",match:/@[a-z0-9][a-z0-9_]*/},N={scope:"operator",match:/[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?/,relevance:0},C={match:t.concat(/\b/,t.either(...v),/\s*\(/),relevance:0,keywords:{built_in:v}};function P(D){return t.concat(/\b/,t.either(...D.map(M=>M.replace(/\s+/,"\\s+"))),/\b/)}const k={scope:"keyword",match:P(y),relevance:0};function I(D,{exceptions:M,when:z}={}){const Z=z;return M=M||[],D.map(W=>W.match(/\|\d+$/)||M.includes(W)?W:Z(W)?`${W}|0`:W)}return{name:"SQL",case_insensitive:!0,illegal:/[{}]|<\//,keywords:{$pattern:/\b[\w\.]+/,keyword:I(_,{when:D=>D.length<3}),literal:l,type:d,built_in:g},contains:[{scope:"type",match:P(c)},k,C,T,i,s,e.C_NUMBER_MODE,e.C_BLOCK_COMMENT_MODE,n,N]}}function X1(e){return e?typeof e=="string"?e:e.source:null}function Zl(e){return Lt("(?=",e,")")}function Lt(...e){return e.map(n=>X1(n)).join("")}function KV(e){const t=e[e.length-1];return typeof t=="object"&&t.constructor===Object?(e.splice(e.length-1,1),t):{}}function Ln(...e){return"("+(KV(e).capture?"":"?:")+e.map(i=>X1(i)).join("|")+")"}const qb=e=>Lt(/\b/,e,/\w$/.test(e)?/\b/:/\B/),YV=["Protocol","Type"].map(qb),Rw=["init","self"].map(qb),XV=["Any","Self"],oh=["actor","any","associatedtype","async","await",/as\?/,/as!/,"as","borrowing","break","case","catch","class","consume","consuming","continue","convenience","copy","default","defer","deinit","didSet","distributed","do","dynamic","each","else","enum","extension","fallthrough",/fileprivate\(set\)/,"fileprivate","final","for","func","get","guard","if","import","indirect","infix",/init\?/,/init!/,"inout",/internal\(set\)/,"internal","in","is","isolated","nonisolated","lazy","let","macro","mutating","nonmutating",/open\(set\)/,"open","operator","optional","override","package","postfix","precedencegroup","prefix",/private\(set\)/,"private","protocol",/public\(set\)/,"public","repeat","required","rethrows","return","set","some","static","struct","subscript","super","switch","throws","throw",/try\?/,/try!/,"try","typealias",/unowned\(safe\)/,/unowned\(unsafe\)/,"unowned","var","weak","where","while","willSet"],Nw=["false","nil","true"],WV=["assignment","associativity","higherThan","left","lowerThan","none","right"],ZV=["#colorLiteral","#column","#dsohandle","#else","#elseif","#endif","#error","#file","#fileID","#fileLiteral","#filePath","#function","#if","#imageLiteral","#keyPath","#line","#selector","#sourceLocation","#warning"],Aw=["abs","all","any","assert","assertionFailure","debugPrint","dump","fatalError","getVaList","isKnownUniquelyReferenced","max","min","numericCast","pointwiseMax","pointwiseMin","precondition","preconditionFailure","print","readLine","repeatElement","sequence","stride","swap","swift_unboxFromSwiftValueWithType","transcode","type","unsafeBitCast","unsafeDowncast","withExtendedLifetime","withUnsafeMutablePointer","withUnsafePointer","withVaList","withoutActuallyEscaping","zip"],W1=Ln(/[/=\-+!*%<>&|^~?]/,/[\u00A1-\u00A7]/,/[\u00A9\u00AB]/,/[\u00AC\u00AE]/,/[\u00B0\u00B1]/,/[\u00B6\u00BB\u00BF\u00D7\u00F7]/,/[\u2016-\u2017]/,/[\u2020-\u2027]/,/[\u2030-\u203E]/,/[\u2041-\u2053]/,/[\u2055-\u205E]/,/[\u2190-\u23FF]/,/[\u2500-\u2775]/,/[\u2794-\u2BFF]/,/[\u2E00-\u2E7F]/,/[\u3001-\u3003]/,/[\u3008-\u3020]/,/[\u3030]/),Z1=Ln(W1,/[\u0300-\u036F]/,/[\u1DC0-\u1DFF]/,/[\u20D0-\u20FF]/,/[\uFE00-\uFE0F]/,/[\uFE20-\uFE2F]/),ch=Lt(W1,Z1,"*"),Q1=Ln(/[a-zA-Z_]/,/[\u00A8\u00AA\u00AD\u00AF\u00B2-\u00B5\u00B7-\u00BA]/,/[\u00BC-\u00BE\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/,/[\u0100-\u02FF\u0370-\u167F\u1681-\u180D\u180F-\u1DBF]/,/[\u1E00-\u1FFF]/,/[\u200B-\u200D\u202A-\u202E\u203F-\u2040\u2054\u2060-\u206F]/,/[\u2070-\u20CF\u2100-\u218F\u2460-\u24FF\u2776-\u2793]/,/[\u2C00-\u2DFF\u2E80-\u2FFF]/,/[\u3004-\u3007\u3021-\u302F\u3031-\u303F\u3040-\uD7FF]/,/[\uF900-\uFD3D\uFD40-\uFDCF\uFDF0-\uFE1F\uFE30-\uFE44]/,/[\uFE47-\uFEFE\uFF00-\uFFFD]/),Hu=Ln(Q1,/\d/,/[\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/),Yr=Lt(Q1,Hu,"*"),su=Lt(/[A-Z]/,Hu,"*"),QV=["attached","autoclosure",Lt(/convention\(/,Ln("swift","block","c"),/\)/),"discardableResult","dynamicCallable","dynamicMemberLookup","escaping","freestanding","frozen","GKInspectable","IBAction","IBDesignable","IBInspectable","IBOutlet","IBSegueAction","inlinable","main","nonobjc","NSApplicationMain","NSCopying","NSManaged",Lt(/objc\(/,Yr,/\)/),"objc","objcMembers","propertyWrapper","requires_stored_property_inits","resultBuilder","Sendable","testable","UIApplicationMain","unchecked","unknown","usableFromInline","warn_unqualified_access"],JV=["iOS","iOSApplicationExtension","macOS","macOSApplicationExtension","macCatalyst","macCatalystApplicationExtension","watchOS","watchOSApplicationExtension","tvOS","tvOSApplicationExtension","swift"];function e7(e){const t={match:/\s+/,relevance:0},n=e.COMMENT("/\\*","\\*/",{contains:["self"]}),i=[e.C_LINE_COMMENT_MODE,n],s={match:[/\./,Ln(...YV,...Rw)],className:{2:"keyword"}},l={match:Lt(/\./,Ln(...oh)),relevance:0},c=oh.filter(Be=>typeof Be=="string").concat(["_|0"]),d=oh.filter(Be=>typeof Be!="string").concat(XV).map(qb),f={variants:[{className:"keyword",match:Ln(...d,...Rw)}]},p={$pattern:Ln(/\b\w+/,/#\w+/),keyword:c.concat(ZV),literal:Nw},m=[s,l,f],g={match:Lt(/\./,Ln(...Aw)),relevance:0},y={className:"built_in",match:Lt(/\b/,Ln(...Aw),/(?=\()/)},v=[g,y],_={match:/->/,relevance:0},T={className:"operator",relevance:0,variants:[{match:ch},{match:`\\.(\\.|${Z1})+`}]},N=[_,T],C="([0-9]_*)+",P="([0-9a-fA-F]_*)+",k={className:"number",relevance:0,variants:[{match:`\\b(${C})(\\.(${C}))?([eE][+-]?(${C}))?\\b`},{match:`\\b0x(${P})(\\.(${P}))?([pP][+-]?(${C}))?\\b`},{match:/\b0o([0-7]_*)+\b/},{match:/\b0b([01]_*)+\b/}]},I=(Be="")=>({className:"subst",variants:[{match:Lt(/\\/,Be,/[0\\tnr"']/)},{match:Lt(/\\/,Be,/u\{[0-9a-fA-F]{1,8}\}/)}]}),D=(Be="")=>({className:"subst",match:Lt(/\\/,Be,/[\t ]*(?:[\r\n]|\r\n)/)}),M=(Be="")=>({className:"subst",label:"interpol",begin:Lt(/\\/,Be,/\(/),end:/\)/}),z=(Be="")=>({begin:Lt(Be,/"""/),end:Lt(/"""/,Be),contains:[I(Be),D(Be),M(Be)]}),Z=(Be="")=>({begin:Lt(Be,/"/),end:Lt(/"/,Be),contains:[I(Be),M(Be)]}),W={className:"string",variants:[z(),z("#"),z("##"),z("###"),Z(),Z("#"),Z("##"),Z("###")]},$=[e.BACKSLASH_ESCAPE,{begin:/\[/,end:/\]/,relevance:0,contains:[e.BACKSLASH_ESCAPE]}],re={begin:/\/[^\s](?=[^/\n]*\/)/,end:/\//,contains:$},se=Be=>{const _t=Lt(Be,/\//),Ve=Lt(/\//,Be);return{begin:_t,end:Ve,contains:[...$,{scope:"comment",begin:`#(?!.*${Ve})`,end:/$/}]}},Se={scope:"regexp",variants:[se("###"),se("##"),se("#"),re]},ue={match:Lt(/`/,Yr,/`/)},V={className:"variable",match:/\$\d+/},B={className:"variable",match:`\\$${Hu}+`},ee=[ue,V,B],X={match:/(@|#(un)?)available/,scope:"keyword",starts:{contains:[{begin:/\(/,end:/\)/,keywords:JV,contains:[...N,k,W]}]}},pe={scope:"keyword",match:Lt(/@/,Ln(...QV),Zl(Ln(/\(/,/\s+/)))},x={scope:"meta",match:Lt(/@/,Yr)},q=[X,pe,x],U={match:Zl(/\b[A-Z]/),relevance:0,contains:[{className:"type",match:Lt(/(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)/,Hu,"+")},{className:"type",match:su,relevance:0},{match:/[?!]+/,relevance:0},{match:/\.\.\./,relevance:0},{match:Lt(/\s+&\s+/,Zl(su)),relevance:0}]},R={begin:/</,end:/>/,keywords:p,contains:[...i,...m,...q,_,U]};U.contains.push(R);const fe={match:Lt(Yr,/\s*:/),keywords:"_|0",relevance:0},we={begin:/\(/,end:/\)/,relevance:0,keywords:p,contains:["self",fe,...i,Se,...m,...v,...N,k,W,...ee,...q,U]},be={begin:/</,end:/>/,keywords:"repeat each",contains:[...i,U]},ke={begin:Ln(Zl(Lt(Yr,/\s*:/)),Zl(Lt(Yr,/\s+/,Yr,/\s*:/))),end:/:/,relevance:0,contains:[{className:"keyword",match:/\b_\b/},{className:"params",match:Yr}]},Me={begin:/\(/,end:/\)/,keywords:p,contains:[ke,...i,...m,...N,k,W,...q,U,we],endsParent:!0,illegal:/["']/},at={match:[/(func|macro)/,/\s+/,Ln(ue.match,Yr,ch)],className:{1:"keyword",3:"title.function"},contains:[be,Me,t],illegal:[/\[/,/%/]},$e={match:[/\b(?:subscript|init[?!]?)/,/\s*(?=[<(])/],className:{1:"keyword"},contains:[be,Me,t],illegal:/\[|%/},ie={match:[/operator/,/\s+/,ch],className:{1:"keyword",3:"title"}},ze={begin:[/precedencegroup/,/\s+/,su],className:{1:"keyword",3:"title"},contains:[U],keywords:[...WV,...Nw],end:/}/},st={match:[/class\b/,/\s+/,/func\b/,/\s+/,/\b[A-Za-z_][A-Za-z0-9_]*\b/],scope:{1:"keyword",3:"keyword",5:"title.function"}},lt={match:[/class\b/,/\s+/,/var\b/],scope:{1:"keyword",3:"keyword"}},Tt={begin:[/(struct|protocol|class|extension|enum|actor)/,/\s+/,Yr,/\s*/],beginScope:{1:"keyword",3:"title.class"},keywords:p,contains:[be,...m,{begin:/:/,end:/\{/,keywords:p,contains:[{scope:"title.class.inherited",match:su},...m],relevance:0}]};for(const Be of W.variants){const _t=Be.contains.find(Ut=>Ut.label==="interpol");_t.keywords=p;const Ve=[...m,...v,...N,k,W,...ee];_t.contains=[...Ve,{begin:/\(/,end:/\)/,contains:["self",...Ve]}]}return{name:"Swift",keywords:p,contains:[...i,at,$e,st,lt,Tt,ie,ze,{beginKeywords:"import",end:/$/,contains:[...i],relevance:0},Se,...m,...v,...N,k,W,...ee,...q,U,we]}}const qu="[A-Za-z$_][0-9A-Za-z$_]*",J1=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends","using"],eC=["true","false","null","undefined","NaN","Infinity"],tC=["Object","Function","Boolean","Symbol","Math","Date","Number","BigInt","String","RegExp","Array","Float32Array","Float64Array","Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Int32Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array","Set","Map","WeakSet","WeakMap","ArrayBuffer","SharedArrayBuffer","Atomics","DataView","JSON","Promise","Generator","GeneratorFunction","AsyncFunction","Reflect","Proxy","Intl","WebAssembly"],nC=["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],rC=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],iC=["arguments","this","super","console","window","document","localStorage","sessionStorage","module","global"],aC=[].concat(rC,tC,nC);function t7(e){const t=e.regex,n=(X,{after:pe})=>{const x="</"+X[0].slice(1);return X.input.indexOf(x,pe)!==-1},i=qu,s={begin:"<>",end:"</>"},l=/<[A-Za-z0-9\\._:-]+\s*\/>/,c={begin:/<[A-Za-z0-9\\._:-]+/,end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(X,pe)=>{const x=X[0].length+X.index,q=X.input[x];if(q==="<"||q===","){pe.ignoreMatch();return}q===">"&&(n(X,{after:x})||pe.ignoreMatch());let U;const R=X.input.substring(x);if(U=R.match(/^\s*=/)){pe.ignoreMatch();return}if((U=R.match(/^\s+extends\s+/))&&U.index===0){pe.ignoreMatch();return}}},d={$pattern:qu,keyword:J1,literal:eC,built_in:aC,"variable.language":iC},f="[0-9](_?[0-9])*",p=`\\.(${f})`,m="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",g={className:"number",variants:[{begin:`(\\b(${m})((${p})|\\.)?|(${p}))[eE][+-]?(${f})\\b`},{begin:`\\b(${m})\\b((${p})\\b|\\.)?|(${p})\\b`},{begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{begin:"\\b0[0-7]+n?\\b"}],relevance:0},y={className:"subst",begin:"\\$\\{",end:"\\}",keywords:d,contains:[]},v={begin:".?html`",end:"",starts:{end:"`",returnEnd:!1,contains:[e.BACKSLASH_ESCAPE,y],subLanguage:"xml"}},_={begin:".?css`",end:"",starts:{end:"`",returnEnd:!1,contains:[e.BACKSLASH_ESCAPE,y],subLanguage:"css"}},T={begin:".?gql`",end:"",starts:{end:"`",returnEnd:!1,contains:[e.BACKSLASH_ESCAPE,y],subLanguage:"graphql"}},N={className:"string",begin:"`",end:"`",contains:[e.BACKSLASH_ESCAPE,y]},P={className:"comment",variants:[e.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,excludeBegin:!0,relevance:0},{className:"variable",begin:i+"(?=\\s*(-)|$)",endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]}),e.C_BLOCK_COMMENT_MODE,e.C_LINE_COMMENT_MODE]},k=[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,v,_,T,N,{match:/\$\d+/},g];y.contains=k.concat({begin:/\{/,end:/\}/,keywords:d,contains:["self"].concat(k)});const I=[].concat(P,y.contains),D=I.concat([{begin:/(\s*)\(/,end:/\)/,keywords:d,contains:["self"].concat(I)}]),M={className:"params",begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:d,contains:D},z={variants:[{match:[/class/,/\s+/,i,/\s+/,/extends/,/\s+/,t.concat(i,"(",t.concat(/\./,i),")*")],scope:{1:"keyword",3:"title.class",5:"keyword",7:"title.class.inherited"}},{match:[/class/,/\s+/,i],scope:{1:"keyword",3:"title.class"}}]},Z={relevance:0,match:t.either(/\bJSON/,/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),className:"title.class",keywords:{_:[...tC,...nC]}},W={label:"use_strict",className:"meta",relevance:10,begin:/^\s*['"]use (strict|asm)['"]/},$={variants:[{match:[/function/,/\s+/,i,/(?=\s*\()/]},{match:[/function/,/\s*(?=\()/]}],className:{1:"keyword",3:"title.function"},label:"func.def",contains:[M],illegal:/%/},re={relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,className:"variable.constant"};function se(X){return t.concat("(?!",X.join("|"),")")}const Se={match:t.concat(/\b/,se([...rC,"super","import"].map(X=>`${X}\\s*\\(`)),i,t.lookahead(/\s*\(/)),className:"title.function",relevance:0},ue={begin:t.concat(/\./,t.lookahead(t.concat(i,/(?![0-9A-Za-z$_(])/))),end:i,excludeBegin:!0,keywords:"prototype",className:"property",relevance:0},V={match:[/get|set/,/\s+/,i,/(?=\()/],className:{1:"keyword",3:"title.function"},contains:[{begin:/\(\)/},M]},B="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+e.UNDERSCORE_IDENT_RE+")\\s*=>",ee={match:[/const|var|let/,/\s+/,i,/\s*/,/=\s*/,/(async\s*)?/,t.lookahead(B)],keywords:"async",className:{1:"keyword",3:"title.function"},contains:[M]};return{name:"JavaScript",aliases:["js","jsx","mjs","cjs"],keywords:d,exports:{PARAMS_CONTAINS:D,CLASS_REFERENCE:Z},illegal:/#(?![$_A-z])/,contains:[e.SHEBANG({label:"shebang",binary:"node",relevance:5}),W,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,v,_,T,N,P,{match:/\$\d+/},g,Z,{scope:"attr",match:i+t.lookahead(":"),relevance:0},ee,{begin:"("+e.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",keywords:"return throw case",relevance:0,contains:[P,e.REGEXP_MODE,{className:"function",begin:B,returnBegin:!0,end:"\\s*=>",contains:[{className:"params",variants:[{begin:e.UNDERSCORE_IDENT_RE,relevance:0},{className:null,begin:/\(\s*\)/,skip:!0},{begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:d,contains:D}]}]},{begin:/,/,relevance:0},{match:/\s+/,relevance:0},{variants:[{begin:s.begin,end:s.end},{match:l},{begin:c.begin,"on:begin":c.isTrulyOpeningTag,end:c.end}],subLanguage:"xml",contains:[{begin:c.begin,end:c.end,skip:!0,contains:["self"]}]}]},$,{beginKeywords:"while if switch catch for"},{begin:"\\b(?!function)"+e.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",returnBegin:!0,label:"func.def",contains:[M,e.inherit(e.TITLE_MODE,{begin:i,className:"title.function"})]},{match:/\.\.\./,relevance:0},ue,{match:"\\$"+i,relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},contains:[M]},Se,re,z,V,{match:/\$[(.]/}]}}function n7(e){const t=e.regex,n=t7(e),i=qu,s=["any","void","number","boolean","string","object","never","symbol","bigint","unknown"],l={begin:[/namespace/,/\s+/,e.IDENT_RE],beginScope:{1:"keyword",3:"title.class"}},c={beginKeywords:"interface",end:/\{/,excludeEnd:!0,keywords:{keyword:"interface extends",built_in:s},contains:[n.exports.CLASS_REFERENCE]},d={className:"meta",relevance:10,begin:/^\s*['"]use strict['"]/},f=["type","interface","public","private","protected","implements","declare","abstract","readonly","enum","override","satisfies"],p={$pattern:qu,keyword:J1.concat(f),literal:eC,built_in:aC.concat(s),"variable.language":iC},m={className:"meta",begin:"@"+i},g=(T,N,C)=>{const P=T.contains.findIndex(k=>k.label===N);if(P===-1)throw new Error("can not find mode to replace");T.contains.splice(P,1,C)};Object.assign(n.keywords,p),n.exports.PARAMS_CONTAINS.push(m);const y=n.contains.find(T=>T.scope==="attr"),v=Object.assign({},y,{match:t.concat(i,t.lookahead(/\s*\?:/))});n.exports.PARAMS_CONTAINS.push([n.exports.CLASS_REFERENCE,y,v]),n.contains=n.contains.concat([m,l,c,v]),g(n,"shebang",e.SHEBANG()),g(n,"use_strict",d);const _=n.contains.find(T=>T.label==="func.def");return _.relevance=0,Object.assign(n,{name:"TypeScript",aliases:["ts","tsx","mts","cts"]}),n}function r7(e){const t=e.regex,n={className:"string",begin:/"(""|[^/n])"C\b/},i={className:"string",begin:/"/,end:/"/,illegal:/\n/,contains:[{begin:/""/}]},s=/\d{1,2}\/\d{1,2}\/\d{4}/,l=/\d{4}-\d{1,2}-\d{1,2}/,c=/(\d|1[012])(:\d+){0,2} *(AM|PM)/,d=/\d{1,2}(:\d{1,2}){1,2}/,f={className:"literal",variants:[{begin:t.concat(/# */,t.either(l,s),/ *#/)},{begin:t.concat(/# */,d,/ *#/)},{begin:t.concat(/# */,c,/ *#/)},{begin:t.concat(/# */,t.either(l,s),/ +/,t.either(c,d),/ *#/)}]},p={className:"number",relevance:0,variants:[{begin:/\b\d[\d_]*((\.[\d_]+(E[+-]?[\d_]+)?)|(E[+-]?[\d_]+))[RFD@!#]?/},{begin:/\b\d[\d_]*((U?[SIL])|[%&])?/},{begin:/&H[\dA-F_]+((U?[SIL])|[%&])?/},{begin:/&O[0-7_]+((U?[SIL])|[%&])?/},{begin:/&B[01_]+((U?[SIL])|[%&])?/}]},m={className:"label",begin:/^\w+:/},g=e.COMMENT(/'''/,/$/,{contains:[{className:"doctag",begin:/<\/?/,end:/>/}]}),y=e.COMMENT(null,/$/,{variants:[{begin:/'/},{begin:/([\t ]|^)REM(?=\s)/}]});return{name:"Visual Basic .NET",aliases:["vb"],case_insensitive:!0,classNameAliases:{label:"symbol"},keywords:{keyword:"addhandler alias aggregate ansi as async assembly auto binary by byref byval call case catch class compare const continue custom declare default delegate dim distinct do each equals else elseif end enum erase error event exit explicit finally for friend from function get global goto group handles if implements imports in inherits interface into iterator join key let lib loop me mid module mustinherit mustoverride mybase myclass namespace narrowing new next notinheritable notoverridable of off on operator option optional order overloads overridable overrides paramarray partial preserve private property protected public raiseevent readonly redim removehandler resume return select set shadows shared skip static step stop structure strict sub synclock take text then throw to try unicode until using when where while widening with withevents writeonly yield",built_in:"addressof and andalso await directcast gettype getxmlnamespace is isfalse isnot istrue like mod nameof new not or orelse trycast typeof xor cbool cbyte cchar cdate cdbl cdec cint clng cobj csbyte cshort csng cstr cuint culng cushort",type:"boolean byte char date decimal double integer long object sbyte short single string uinteger ulong ushort",literal:"true false nothing"},illegal:"//|\\{|\\}|endif|gosub|variant|wend|^\\$ ",contains:[n,i,f,p,m,g,y,{className:"meta",begin:/[\t ]*#(const|disable|else|elseif|enable|end|externalsource|if|region)\b/,end:/$/,keywords:{keyword:"const disable else elseif enable end externalsource if region then"},contains:[y]}]}}function i7(e){e.regex;const t=e.COMMENT(/\(;/,/;\)/);t.contains.push("self");const n=e.COMMENT(/;;/,/$/),i=["anyfunc","block","br","br_if","br_table","call","call_indirect","data","drop","elem","else","end","export","func","global.get","global.set","local.get","local.set","local.tee","get_global","get_local","global","if","import","local","loop","memory","memory.grow","memory.size","module","mut","nop","offset","param","result","return","select","set_global","set_local","start","table","tee_local","then","type","unreachable"],s={begin:[/(?:func|call|call_indirect)/,/\s+/,/\$[^\s)]+/],className:{1:"keyword",3:"title.function"}},l={className:"variable",begin:/\$[\w_]+/},c={match:/(\((?!;)|\))+/,className:"punctuation",relevance:0},d={className:"number",relevance:0,match:/[+-]?\b(?:\d(?:_?\d)*(?:\.\d(?:_?\d)*)?(?:[eE][+-]?\d(?:_?\d)*)?|0x[\da-fA-F](?:_?[\da-fA-F])*(?:\.[\da-fA-F](?:_?[\da-fA-D])*)?(?:[pP][+-]?\d(?:_?\d)*)?)\b|\binf\b|\bnan(?::0x[\da-fA-F](?:_?[\da-fA-D])*)?\b/},f={match:/(i32|i64|f32|f64)(?!\.)/,className:"type"},p={className:"keyword",match:/\b(f32|f64|i32|i64)(?:\.(?:abs|add|and|ceil|clz|const|convert_[su]\/i(?:32|64)|copysign|ctz|demote\/f64|div(?:_[su])?|eqz?|extend_[su]\/i32|floor|ge(?:_[su])?|gt(?:_[su])?|le(?:_[su])?|load(?:(?:8|16|32)_[su])?|lt(?:_[su])?|max|min|mul|nearest|neg?|or|popcnt|promote\/f32|reinterpret\/[fi](?:32|64)|rem_[su]|rot[lr]|shl|shr_[su]|store(?:8|16|32)?|sqrt|sub|trunc(?:_[su]\/f(?:32|64))?|wrap\/i64|xor))\b/};return{name:"WebAssembly",keywords:{$pattern:/[\w.]+/,keyword:i},contains:[n,t,{match:[/(?:offset|align)/,/\s*/,/=/],className:{1:"keyword",3:"operator"}},l,c,s,e.QUOTE_STRING_MODE,f,p,d]}}function a7(e){const t=e.regex,n=t.concat(/[\p{L}_]/u,t.optional(/[\p{L}0-9_.-]*:/u),/[\p{L}0-9_.-]*/u),i=/[\p{L}0-9._:-]+/u,s={className:"symbol",begin:/&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/},l={begin:/\s/,contains:[{className:"keyword",begin:/#?[a-z_][a-z1-9_-]+/,illegal:/\n/}]},c=e.inherit(l,{begin:/\(/,end:/\)/}),d=e.inherit(e.APOS_STRING_MODE,{className:"string"}),f=e.inherit(e.QUOTE_STRING_MODE,{className:"string"}),p={endsWithParent:!0,illegal:/</,relevance:0,contains:[{className:"attr",begin:i,relevance:0},{begin:/=\s*/,relevance:0,contains:[{className:"string",endsParent:!0,variants:[{begin:/"/,end:/"/,contains:[s]},{begin:/'/,end:/'/,contains:[s]},{begin:/[^\s"'=<>`]+/}]}]}]};return{name:"HTML, XML",aliases:["html","xhtml","rss","atom","xjb","xsd","xsl","plist","wsf","svg"],case_insensitive:!0,unicodeRegex:!0,contains:[{className:"meta",begin:/<![a-z]/,end:/>/,relevance:10,contains:[l,f,d,c,{begin:/\[/,end:/\]/,contains:[{className:"meta",begin:/<![a-z]/,end:/>/,contains:[l,c,f,d]}]}]},e.COMMENT(/<!--/,/-->/,{relevance:10}),{begin:/<!\[CDATA\[/,end:/\]\]>/,relevance:10},s,{className:"meta",end:/\?>/,variants:[{begin:/<\?xml/,relevance:10,contains:[f]},{begin:/<\?[a-z][a-z0-9]+/}]},{className:"tag",begin:/<style(?=\s|>)/,end:/>/,keywords:{name:"style"},contains:[p],starts:{end:/<\/style>/,returnEnd:!0,subLanguage:["css","xml"]}},{className:"tag",begin:/<script(?=\s|>)/,end:/>/,keywords:{name:"script"},contains:[p],starts:{end:/<\/script>/,returnEnd:!0,subLanguage:["javascript","handlebars","xml"]}},{className:"tag",begin:/<>|<\/>/},{className:"tag",begin:t.concat(/</,t.lookahead(t.concat(n,t.either(/\/>/,/>/,/\s/)))),end:/\/?>/,contains:[{className:"name",begin:n,relevance:0,starts:p}]},{className:"tag",begin:t.concat(/<\//,t.lookahead(t.concat(n,/>/))),contains:[{className:"name",begin:n,relevance:0},{begin:/>/,relevance:0,endsParent:!0}]}]}}function s7(e){const t="true false yes no null",n="[\\w#;/?:@&=+$,.~*'()[\\]]+",i={className:"attr",variants:[{begin:/[\w*@][\w*@ :()\./-]*:(?=[ \t]|$)/},{begin:/"[\w*@][\w*@ :()\./-]*":(?=[ \t]|$)/},{begin:/'[\w*@][\w*@ :()\./-]*':(?=[ \t]|$)/}]},s={className:"template-variable",variants:[{begin:/\{\{/,end:/\}\}/},{begin:/%\{/,end:/\}/}]},l={className:"string",relevance:0,begin:/'/,end:/'/,contains:[{match:/''/,scope:"char.escape",relevance:0}]},c={className:"string",relevance:0,variants:[{begin:/"/,end:/"/},{begin:/\S+/}],contains:[e.BACKSLASH_ESCAPE,s]},d=e.inherit(c,{variants:[{begin:/'/,end:/'/,contains:[{begin:/''/,relevance:0}]},{begin:/"/,end:/"/},{begin:/[^\s,{}[\]]+/}]}),y={className:"number",begin:"\\b"+"[0-9]{4}(-[0-9][0-9]){0,2}"+"([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?"+"(\\.[0-9]*)?"+"([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?"+"\\b"},v={end:",",endsWithParent:!0,excludeEnd:!0,keywords:t,relevance:0},_={begin:/\{/,end:/\}/,contains:[v],illegal:"\\n",relevance:0},T={begin:"\\[",end:"\\]",contains:[v],illegal:"\\n",relevance:0},N=[i,{className:"meta",begin:"^---\\s*$",relevance:10},{className:"string",begin:"[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"},{begin:"<%[%=-]?",end:"[%-]?%>",subLanguage:"ruby",excludeBegin:!0,excludeEnd:!0,relevance:0},{className:"type",begin:"!\\w+!"+n},{className:"type",begin:"!<"+n+">"},{className:"type",begin:"!"+n},{className:"type",begin:"!!"+n},{className:"meta",begin:"&"+e.UNDERSCORE_IDENT_RE+"$"},{className:"meta",begin:"\\*"+e.UNDERSCORE_IDENT_RE+"$"},{className:"bullet",begin:"-(?=[ ]|$)",relevance:0},e.HASH_COMMENT_MODE,{beginKeywords:t,keywords:{literal:t}},y,{className:"number",begin:e.C_NUMBER_RE+"\\b",relevance:0},_,T,l,c],C=[...N];return C.pop(),C.push(d),v.contains=C,{name:"YAML",case_insensitive:!0,aliases:["yml"],contains:N}}const l7={arduino:UG,bash:HG,c:qG,cpp:GG,csharp:VG,css:tV,diff:nV,go:rV,graphql:iV,ini:aV,java:sV,javascript:dV,json:fV,kotlin:hV,less:wV,lua:EV,makefile:SV,markdown:CV,objectivec:TV,perl:OV,php:RV,"php-template":NV,plaintext:AV,python:DV,"python-repl":kV,r:MV,ruby:PV,rust:IV,scss:qV,shell:GV,sql:VV,swift:e7,typescript:n7,vbnet:r7,wasm:i7,xml:a7,yaml:s7};var uh,Dw;function o7(){if(Dw)return uh;Dw=1;function e(j){return j instanceof Map?j.clear=j.delete=j.set=function(){throw new Error("map is read-only")}:j instanceof Set&&(j.add=j.clear=j.delete=function(){throw new Error("set is read-only")}),Object.freeze(j),Object.getOwnPropertyNames(j).forEach(ae=>{const me=j[ae],De=typeof me;(De==="object"||De==="function")&&!Object.isFrozen(me)&&e(me)}),j}class t{constructor(ae){ae.data===void 0&&(ae.data={}),this.data=ae.data,this.isMatchIgnored=!1}ignoreMatch(){this.isMatchIgnored=!0}}function n(j){return j.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;")}function i(j,...ae){const me=Object.create(null);for(const De in j)me[De]=j[De];return ae.forEach(function(De){for(const pt in De)me[pt]=De[pt]}),me}const s="</span>",l=j=>!!j.scope,c=(j,{prefix:ae})=>{if(j.startsWith("language:"))return j.replace("language:","language-");if(j.includes(".")){const me=j.split(".");return[`${ae}${me.shift()}`,...me.map((De,pt)=>`${De}${"_".repeat(pt+1)}`)].join(" ")}return`${ae}${j}`};class d{constructor(ae,me){this.buffer="",this.classPrefix=me.classPrefix,ae.walk(this)}addText(ae){this.buffer+=n(ae)}openNode(ae){if(!l(ae))return;const me=c(ae.scope,{prefix:this.classPrefix});this.span(me)}closeNode(ae){l(ae)&&(this.buffer+=s)}value(){return this.buffer}span(ae){this.buffer+=`<span class="${ae}">`}}const f=(j={})=>{const ae={children:[]};return Object.assign(ae,j),ae};class p{constructor(){this.rootNode=f(),this.stack=[this.rootNode]}get top(){return this.stack[this.stack.length-1]}get root(){return this.rootNode}add(ae){this.top.children.push(ae)}openNode(ae){const me=f({scope:ae});this.add(me),this.stack.push(me)}closeNode(){if(this.stack.length>1)return this.stack.pop()}closeAllNodes(){for(;this.closeNode(););}toJSON(){return JSON.stringify(this.rootNode,null,4)}walk(ae){return this.constructor._walk(ae,this.rootNode)}static _walk(ae,me){return typeof me=="string"?ae.addText(me):me.children&&(ae.openNode(me),me.children.forEach(De=>this._walk(ae,De)),ae.closeNode(me)),ae}static _collapse(ae){typeof ae!="string"&&ae.children&&(ae.children.every(me=>typeof me=="string")?ae.children=[ae.children.join("")]:ae.children.forEach(me=>{p._collapse(me)}))}}class m extends p{constructor(ae){super(),this.options=ae}addText(ae){ae!==""&&this.add(ae)}startScope(ae){this.openNode(ae)}endScope(){this.closeNode()}__addSublanguage(ae,me){const De=ae.root;me&&(De.scope=`language:${me}`),this.add(De)}toHTML(){return new d(this,this.options).value()}finalize(){return this.closeAllNodes(),!0}}function g(j){return j?typeof j=="string"?j:j.source:null}function y(j){return T("(?=",j,")")}function v(j){return T("(?:",j,")*")}function _(j){return T("(?:",j,")?")}function T(...j){return j.map(me=>g(me)).join("")}function N(j){const ae=j[j.length-1];return typeof ae=="object"&&ae.constructor===Object?(j.splice(j.length-1,1),ae):{}}function C(...j){return"("+(N(j).capture?"":"?:")+j.map(De=>g(De)).join("|")+")"}function P(j){return new RegExp(j.toString()+"|").exec("").length-1}function k(j,ae){const me=j&&j.exec(ae);return me&&me.index===0}const I=/\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;function D(j,{joinWith:ae}){let me=0;return j.map(De=>{me+=1;const pt=me;let Ot=g(De),_e="";for(;Ot.length>0;){const ye=I.exec(Ot);if(!ye){_e+=Ot;break}_e+=Ot.substring(0,ye.index),Ot=Ot.substring(ye.index+ye[0].length),ye[0][0]==="\\"&&ye[1]?_e+="\\"+String(Number(ye[1])+pt):(_e+=ye[0],ye[0]==="("&&me++)}return _e}).map(De=>`(${De})`).join(ae)}const M=/\b\B/,z="[a-zA-Z]\\w*",Z="[a-zA-Z_]\\w*",W="\\b\\d+(\\.\\d+)?",$="(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)",re="\\b(0b[01]+)",se="!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~",Se=(j={})=>{const ae=/^#![ ]*\//;return j.binary&&(j.begin=T(ae,/.*\b/,j.binary,/\b.*/)),i({scope:"meta",begin:ae,end:/$/,relevance:0,"on:begin":(me,De)=>{me.index!==0&&De.ignoreMatch()}},j)},ue={begin:"\\\\[\\s\\S]",relevance:0},V={scope:"string",begin:"'",end:"'",illegal:"\\n",contains:[ue]},B={scope:"string",begin:'"',end:'"',illegal:"\\n",contains:[ue]},ee={begin:/\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/},X=function(j,ae,me={}){const De=i({scope:"comment",begin:j,end:ae,contains:[]},me);De.contains.push({scope:"doctag",begin:"[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",end:/(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,excludeBegin:!0,relevance:0});const pt=C("I","a","is","so","us","to","at","if","in","it","on",/[A-Za-z]+['](d|ve|re|ll|t|s|n)/,/[A-Za-z]+[-][a-z]+/,/[A-Za-z][a-z]{2,}/);return De.contains.push({begin:T(/[ ]+/,"(",pt,/[.]?[:]?([.][ ]|[ ])/,"){3}")}),De},pe=X("//","$"),x=X("/\\*","\\*/"),q=X("#","$"),U={scope:"number",begin:W,relevance:0},R={scope:"number",begin:$,relevance:0},fe={scope:"number",begin:re,relevance:0},we={scope:"regexp",begin:/\/(?=[^/\n]*\/)/,end:/\/[gimuy]*/,contains:[ue,{begin:/\[/,end:/\]/,relevance:0,contains:[ue]}]},be={scope:"title",begin:z,relevance:0},ke={scope:"title",begin:Z,relevance:0},Me={begin:"\\.\\s*"+Z,relevance:0};var $e=Object.freeze({__proto__:null,APOS_STRING_MODE:V,BACKSLASH_ESCAPE:ue,BINARY_NUMBER_MODE:fe,BINARY_NUMBER_RE:re,COMMENT:X,C_BLOCK_COMMENT_MODE:x,C_LINE_COMMENT_MODE:pe,C_NUMBER_MODE:R,C_NUMBER_RE:$,END_SAME_AS_BEGIN:function(j){return Object.assign(j,{"on:begin":(ae,me)=>{me.data._beginMatch=ae[1]},"on:end":(ae,me)=>{me.data._beginMatch!==ae[1]&&me.ignoreMatch()}})},HASH_COMMENT_MODE:q,IDENT_RE:z,MATCH_NOTHING_RE:M,METHOD_GUARD:Me,NUMBER_MODE:U,NUMBER_RE:W,PHRASAL_WORDS_MODE:ee,QUOTE_STRING_MODE:B,REGEXP_MODE:we,RE_STARTERS_RE:se,SHEBANG:Se,TITLE_MODE:be,UNDERSCORE_IDENT_RE:Z,UNDERSCORE_TITLE_MODE:ke});function ie(j,ae){j.input[j.index-1]==="."&&ae.ignoreMatch()}function ze(j,ae){j.className!==void 0&&(j.scope=j.className,delete j.className)}function st(j,ae){ae&&j.beginKeywords&&(j.begin="\\b("+j.beginKeywords.split(" ").join("|")+")(?!\\.)(?=\\b|\\s)",j.__beforeBegin=ie,j.keywords=j.keywords||j.beginKeywords,delete j.beginKeywords,j.relevance===void 0&&(j.relevance=0))}function lt(j,ae){Array.isArray(j.illegal)&&(j.illegal=C(...j.illegal))}function Tt(j,ae){if(j.match){if(j.begin||j.end)throw new Error("begin & end are not supported with match");j.begin=j.match,delete j.match}}function Be(j,ae){j.relevance===void 0&&(j.relevance=1)}const _t=(j,ae)=>{if(!j.beforeMatch)return;if(j.starts)throw new Error("beforeMatch cannot be used with starts");const me=Object.assign({},j);Object.keys(j).forEach(De=>{delete j[De]}),j.keywords=me.keywords,j.begin=T(me.beforeMatch,y(me.begin)),j.starts={relevance:0,contains:[Object.assign(me,{endsParent:!0})]},j.relevance=0,delete me.beforeMatch},Ve=["of","and","for","in","not","or","if","then","parent","list","value"],Ut="keyword";function Zt(j,ae,me=Ut){const De=Object.create(null);return typeof j=="string"?pt(me,j.split(" ")):Array.isArray(j)?pt(me,j):Object.keys(j).forEach(function(Ot){Object.assign(De,Zt(j[Ot],ae,Ot))}),De;function pt(Ot,_e){ae&&(_e=_e.map(ye=>ye.toLowerCase())),_e.forEach(function(ye){const Te=ye.split("|");De[Te[0]]=[Ot,Et(Te[0],Te[1])]})}}function Et(j,ae){return ae?Number(ae):Bn(j)?0:1}function Bn(j){return Ve.includes(j.toLowerCase())}const hr={},Fn=j=>{console.error(j)},Ci=(j,...ae)=>{console.log(`WARN: ${j}`,...ae)},ne=(j,ae)=>{hr[`${j}/${ae}`]||(console.log(`Deprecated as of ${j}. ${ae}`),hr[`${j}/${ae}`]=!0)},de=new Error;function Ae(j,ae,{key:me}){let De=0;const pt=j[me],Ot={},_e={};for(let ye=1;ye<=ae.length;ye++)_e[ye+De]=pt[ye],Ot[ye+De]=!0,De+=P(ae[ye-1]);j[me]=_e,j[me]._emit=Ot,j[me]._multi=!0}function Ie(j){if(Array.isArray(j.begin)){if(j.skip||j.excludeBegin||j.returnBegin)throw Fn("skip, excludeBegin, returnBegin not compatible with beginScope: {}"),de;if(typeof j.beginScope!="object"||j.beginScope===null)throw Fn("beginScope must be object"),de;Ae(j,j.begin,{key:"beginScope"}),j.begin=D(j.begin,{joinWith:""})}}function gt(j){if(Array.isArray(j.end)){if(j.skip||j.excludeEnd||j.returnEnd)throw Fn("skip, excludeEnd, returnEnd not compatible with endScope: {}"),de;if(typeof j.endScope!="object"||j.endScope===null)throw Fn("endScope must be object"),de;Ae(j,j.end,{key:"endScope"}),j.end=D(j.end,{joinWith:""})}}function Ht(j){j.scope&&typeof j.scope=="object"&&j.scope!==null&&(j.beginScope=j.scope,delete j.scope)}function Un(j){Ht(j),typeof j.beginScope=="string"&&(j.beginScope={_wrap:j.beginScope}),typeof j.endScope=="string"&&(j.endScope={_wrap:j.endScope}),Ie(j),gt(j)}function mn(j){function ae(_e,ye){return new RegExp(g(_e),"m"+(j.case_insensitive?"i":"")+(j.unicodeRegex?"u":"")+(ye?"g":""))}class me{constructor(){this.matchIndexes={},this.regexes=[],this.matchAt=1,this.position=0}addRule(ye,Te){Te.position=this.position++,this.matchIndexes[this.matchAt]=Te,this.regexes.push([Te,ye]),this.matchAt+=P(ye)+1}compile(){this.regexes.length===0&&(this.exec=()=>null);const ye=this.regexes.map(Te=>Te[1]);this.matcherRe=ae(D(ye,{joinWith:"|"}),!0),this.lastIndex=0}exec(ye){this.matcherRe.lastIndex=this.lastIndex;const Te=this.matcherRe.exec(ye);if(!Te)return null;const ht=Te.findIndex((Qn,Hn)=>Hn>0&&Qn!==void 0),Rt=this.matchIndexes[ht];return Te.splice(0,ht),Object.assign(Te,Rt)}}class De{constructor(){this.rules=[],this.multiRegexes=[],this.count=0,this.lastIndex=0,this.regexIndex=0}getMatcher(ye){if(this.multiRegexes[ye])return this.multiRegexes[ye];const Te=new me;return this.rules.slice(ye).forEach(([ht,Rt])=>Te.addRule(ht,Rt)),Te.compile(),this.multiRegexes[ye]=Te,Te}resumingScanAtSamePosition(){return this.regexIndex!==0}considerAll(){this.regexIndex=0}addRule(ye,Te){this.rules.push([ye,Te]),Te.type==="begin"&&this.count++}exec(ye){const Te=this.getMatcher(this.regexIndex);Te.lastIndex=this.lastIndex;let ht=Te.exec(ye);if(this.resumingScanAtSamePosition()&&!(ht&&ht.index===this.lastIndex)){const Rt=this.getMatcher(0);Rt.lastIndex=this.lastIndex+1,ht=Rt.exec(ye)}return ht&&(this.regexIndex+=ht.position+1,this.regexIndex===this.count&&this.considerAll()),ht}}function pt(_e){const ye=new De;return _e.contains.forEach(Te=>ye.addRule(Te.begin,{rule:Te,type:"begin"})),_e.terminatorEnd&&ye.addRule(_e.terminatorEnd,{type:"end"}),_e.illegal&&ye.addRule(_e.illegal,{type:"illegal"}),ye}function Ot(_e,ye){const Te=_e;if(_e.isCompiled)return Te;[ze,Tt,Un,_t].forEach(Rt=>Rt(_e,ye)),j.compilerExtensions.forEach(Rt=>Rt(_e,ye)),_e.__beforeBegin=null,[st,lt,Be].forEach(Rt=>Rt(_e,ye)),_e.isCompiled=!0;let ht=null;return typeof _e.keywords=="object"&&_e.keywords.$pattern&&(_e.keywords=Object.assign({},_e.keywords),ht=_e.keywords.$pattern,delete _e.keywords.$pattern),ht=ht||/\w+/,_e.keywords&&(_e.keywords=Zt(_e.keywords,j.case_insensitive)),Te.keywordPatternRe=ae(ht,!0),ye&&(_e.begin||(_e.begin=/\B|\b/),Te.beginRe=ae(Te.begin),!_e.end&&!_e.endsWithParent&&(_e.end=/\B|\b/),_e.end&&(Te.endRe=ae(Te.end)),Te.terminatorEnd=g(Te.end)||"",_e.endsWithParent&&ye.terminatorEnd&&(Te.terminatorEnd+=(_e.end?"|":"")+ye.terminatorEnd)),_e.illegal&&(Te.illegalRe=ae(_e.illegal)),_e.contains||(_e.contains=[]),_e.contains=[].concat(..._e.contains.map(function(Rt){return dn(Rt==="self"?_e:Rt)})),_e.contains.forEach(function(Rt){Ot(Rt,Te)}),_e.starts&&Ot(_e.starts,ye),Te.matcher=pt(Te),Te}if(j.compilerExtensions||(j.compilerExtensions=[]),j.contains&&j.contains.includes("self"))throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");return j.classNameAliases=i(j.classNameAliases||{}),Ot(j)}function Mn(j){return j?j.endsWithParent||Mn(j.starts):!1}function dn(j){return j.variants&&!j.cachedVariants&&(j.cachedVariants=j.variants.map(function(ae){return i(j,{variants:null},ae)})),j.cachedVariants?j.cachedVariants:Mn(j)?i(j,{starts:j.starts?i(j.starts):null}):Object.isFrozen(j)?i(j):j}var Vt="11.11.1";class On extends Error{constructor(ae,me){super(ae),this.name="HTMLInjectionError",this.html=me}}const gn=n,sa=i,la=Symbol("nomatch"),oa=7,Ft=function(j){const ae=Object.create(null),me=Object.create(null),De=[];let pt=!0;const Ot="Could not find the language '{}', did you forget to load/include a language module?",_e={disableAutodetect:!0,name:"Plain text",contains:[]};let ye={ignoreUnescapedHTML:!1,throwUnescapedHTML:!1,noHighlightRe:/^(no-?highlight)$/i,languageDetectRe:/\blang(?:uage)?-([\w-]+)\b/i,classPrefix:"hljs-",cssSelector:"pre code",languages:null,__emitter:m};function Te(ve){return ye.noHighlightRe.test(ve)}function ht(ve){let Le=ve.className+" ";Le+=ve.parentNode?ve.parentNode.className:"";const et=ye.languageDetectRe.exec(Le);if(et){const Nt=Pn(et[1]);return Nt||(Ci(Ot.replace("{}",et[1])),Ci("Falling back to no-highlight mode for this block.",ve)),Nt?et[1]:"no-highlight"}return Le.split(/\s+/).find(Nt=>Te(Nt)||Pn(Nt))}function Rt(ve,Le,et){let Nt="",Yt="";typeof Le=="object"?(Nt=ve,et=Le.ignoreIllegals,Yt=Le.language):(ne("10.7.0","highlight(lang, code, ...args) has been deprecated."),ne("10.7.0",`Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`),Yt=ve,Nt=Le),et===void 0&&(et=!0);const Jn={code:Nt,language:Yt};ti("before:highlight",Jn);const Ar=Jn.result?Jn.result:Qn(Jn.language,Jn.code,et);return Ar.code=Jn.code,ti("after:highlight",Ar),Ar}function Qn(ve,Le,et,Nt){const Yt=Object.create(null);function Jn(Ce,Re){return Ce.keywords[Re]}function Ar(){if(!Ze.keywords){sn.addText(At);return}let Ce=0;Ze.keywordPatternRe.lastIndex=0;let Re=Ze.keywordPatternRe.exec(At),Xe="";for(;Re;){Xe+=At.substring(Ce,Re.index);const xt=er.case_insensitive?Re[0].toLowerCase():Re[0],ln=Jn(Ze,xt);if(ln){const[br,ha]=ln;if(sn.addText(Xe),Xe="",Yt[xt]=(Yt[xt]||0)+1,Yt[xt]<=oa&&(Ga+=ha),br.startsWith("_"))Xe+=Re[0];else{const Dr=er.classNameAliases[br]||br;gr(Re[0],Dr)}}else Xe+=Re[0];Ce=Ze.keywordPatternRe.lastIndex,Re=Ze.keywordPatternRe.exec(At)}Xe+=At.substring(Ce),sn.addText(Xe)}function xn(){if(At==="")return;let Ce=null;if(typeof Ze.subLanguage=="string"){if(!ae[Ze.subLanguage]){sn.addText(At);return}Ce=Qn(Ze.subLanguage,At,!0,Xs[Ze.subLanguage]),Xs[Ze.subLanguage]=Ce._top}else Ce=mr(At,Ze.subLanguage.length?Ze.subLanguage:null);Ze.relevance>0&&(Ga+=Ce.relevance),sn.__addSublanguage(Ce._emitter,Ce.language)}function Rn(){Ze.subLanguage!=null?xn():Ar(),At=""}function gr(Ce,Re){Ce!==""&&(sn.startScope(Re),sn.addText(Ce),sn.endScope())}function da(Ce,Re){let Xe=1;const xt=Re.length-1;for(;Xe<=xt;){if(!Ce._emit[Xe]){Xe++;continue}const ln=er.classNameAliases[Ce[Xe]]||Ce[Xe],br=Re[Xe];ln?gr(br,ln):(At=br,Ar(),At=""),Xe++}}function Ks(Ce,Re){return Ce.scope&&typeof Ce.scope=="string"&&sn.openNode(er.classNameAliases[Ce.scope]||Ce.scope),Ce.beginScope&&(Ce.beginScope._wrap?(gr(At,er.classNameAliases[Ce.beginScope._wrap]||Ce.beginScope._wrap),At=""):Ce.beginScope._multi&&(da(Ce.beginScope,Re),At="")),Ze=Object.create(Ce,{parent:{value:Ze}}),Ze}function fa(Ce,Re,Xe){let xt=k(Ce.endRe,Xe);if(xt){if(Ce["on:end"]){const ln=new t(Ce);Ce["on:end"](Re,ln),ln.isMatchIgnored&&(xt=!1)}if(xt){for(;Ce.endsParent&&Ce.parent;)Ce=Ce.parent;return Ce}}if(Ce.endsWithParent)return fa(Ce.parent,Re,Xe)}function yd(Ce){return Ze.matcher.regexIndex===0?(At+=Ce[0],1):(pa=!0,0)}function qn(Ce){const Re=Ce[0],Xe=Ce.rule,xt=new t(Xe),ln=[Xe.__beforeBegin,Xe["on:begin"]];for(const br of ln)if(br&&(br(Ce,xt),xt.isMatchIgnored))return yd(Re);return Xe.skip?At+=Re:(Xe.excludeBegin&&(At+=Re),Rn(),!Xe.returnBegin&&!Xe.excludeBegin&&(At=Re)),Ks(Xe,Ce),Xe.returnBegin?0:Re.length}function Ys(Ce){const Re=Ce[0],Xe=Le.substring(Ce.index),xt=fa(Ze,Ce,Xe);if(!xt)return la;const ln=Ze;Ze.endScope&&Ze.endScope._wrap?(Rn(),gr(Re,Ze.endScope._wrap)):Ze.endScope&&Ze.endScope._multi?(Rn(),da(Ze.endScope,Ce)):ln.skip?At+=Re:(ln.returnEnd||ln.excludeEnd||(At+=Re),Rn(),ln.excludeEnd&&(At=Re));do Ze.scope&&sn.closeNode(),!Ze.skip&&!Ze.subLanguage&&(Ga+=Ze.relevance),Ze=Ze.parent;while(Ze!==xt.parent);return xt.starts&&Ks(xt.starts,Ce),ln.returnEnd?0:Re.length}function Mo(){const Ce=[];for(let Re=Ze;Re!==er;Re=Re.parent)Re.scope&&Ce.unshift(Re.scope);Ce.forEach(Re=>sn.openNode(Re))}let Ri={};function ni(Ce,Re){const Xe=Re&&Re[0];if(At+=Ce,Xe==null)return Rn(),0;if(Ri.type==="begin"&&Re.type==="end"&&Ri.index===Re.index&&Xe===""){if(At+=Le.slice(Re.index,Re.index+1),!pt){const xt=new Error(`0 width match regex (${ve})`);throw xt.languageName=ve,xt.badRule=Ri.rule,xt}return 1}if(Ri=Re,Re.type==="begin")return qn(Re);if(Re.type==="illegal"&&!et){const xt=new Error('Illegal lexeme "'+Xe+'" for mode "'+(Ze.scope||"<unnamed>")+'"');throw xt.mode=Ze,xt}else if(Re.type==="end"){const xt=Ys(Re);if(xt!==la)return xt}if(Re.type==="illegal"&&Xe==="")return At+=`
`,1;if(Ni>1e5&&Ni>Re.index*3)throw new Error("potential infinite loop, way more iterations than matches");return At+=Xe,Xe.length}const er=Pn(ve);if(!er)throw Fn(Ot.replace("{}",ve)),new Error('Unknown language: "'+ve+'"');const Po=mn(er);let Ur="",Ze=Nt||Po;const Xs={},sn=new ye.__emitter(ye);Mo();let At="",Ga=0,ri=0,Ni=0,pa=!1;try{if(er.__emitTokens)er.__emitTokens(Le,sn);else{for(Ze.matcher.considerAll();;){Ni++,pa?pa=!1:Ze.matcher.considerAll(),Ze.matcher.lastIndex=ri;const Ce=Ze.matcher.exec(Le);if(!Ce)break;const Re=Le.substring(ri,Ce.index),Xe=ni(Re,Ce);ri=Ce.index+Xe}ni(Le.substring(ri))}return sn.finalize(),Ur=sn.toHTML(),{language:ve,value:Ur,relevance:Ga,illegal:!1,_emitter:sn,_top:Ze}}catch(Ce){if(Ce.message&&Ce.message.includes("Illegal"))return{language:ve,value:gn(Le),illegal:!0,relevance:0,_illegalBy:{message:Ce.message,index:ri,context:Le.slice(ri-100,ri+100),mode:Ce.mode,resultSoFar:Ur},_emitter:sn};if(pt)return{language:ve,value:gn(Le),illegal:!1,relevance:0,errorRaised:Ce,_emitter:sn,_top:Ze};throw Ce}}function Hn(ve){const Le={value:gn(ve),illegal:!1,relevance:0,_top:_e,_emitter:new ye.__emitter(ye)};return Le._emitter.addText(ve),Le}function mr(ve,Le){Le=Le||ye.languages||Object.keys(ae);const et=Hn(ve),Nt=Le.filter(Pn).filter(Vs).map(Rn=>Qn(Rn,ve,!1));Nt.unshift(et);const Yt=Nt.sort((Rn,gr)=>{if(Rn.relevance!==gr.relevance)return gr.relevance-Rn.relevance;if(Rn.language&&gr.language){if(Pn(Rn.language).supersetOf===gr.language)return 1;if(Pn(gr.language).supersetOf===Rn.language)return-1}return 0}),[Jn,Ar]=Yt,xn=Jn;return xn.secondBest=Ar,xn}function Rr(ve,Le,et){const Nt=Le&&me[Le]||et;ve.classList.add("hljs"),ve.classList.add(`language-${Nt}`)}function ca(ve){let Le=null;const et=ht(ve);if(Te(et))return;if(ti("before:highlightElement",{el:ve,language:et}),ve.dataset.highlighted){console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.",ve);return}if(ve.children.length>0&&(ye.ignoreUnescapedHTML||(console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."),console.warn("https://github.com/highlightjs/highlight.js/wiki/security"),console.warn("The element with unescaped HTML:"),console.warn(ve)),ye.throwUnescapedHTML))throw new On("One of your code blocks includes unescaped HTML.",ve.innerHTML);Le=ve;const Nt=Le.textContent,Yt=et?Rt(Nt,{language:et,ignoreIllegals:!0}):mr(Nt);ve.innerHTML=Yt.value,ve.dataset.highlighted="yes",Rr(ve,et,Yt.language),ve.result={language:Yt.language,re:Yt.relevance,relevance:Yt.relevance},Yt.secondBest&&(ve.secondBest={language:Yt.secondBest.language,relevance:Yt.secondBest.relevance}),ti("after:highlightElement",{el:ve,result:Yt,text:Nt})}function Ti(ve){ye=sa(ye,ve)}const Oi=()=>{Kt(),ne("10.6.0","initHighlighting() deprecated.  Use highlightAll() now.")};function ua(){Kt(),ne("10.6.0","initHighlightingOnLoad() deprecated.  Use highlightAll() now.")}let Jr=!1;function Kt(){function ve(){Kt()}if(document.readyState==="loading"){Jr||window.addEventListener("DOMContentLoaded",ve,!1),Jr=!0;return}document.querySelectorAll(ye.cssSelector).forEach(ca)}function No(ve,Le){let et=null;try{et=Le(j)}catch(Nt){if(Fn("Language definition for '{}' could not be registered.".replace("{}",ve)),pt)Fn(Nt);else throw Nt;et=_e}et.name||(et.name=ve),ae[ve]=et,et.rawDefinition=Le.bind(null,j),et.aliases&&Do(et.aliases,{languageName:ve})}function Ao(ve){delete ae[ve];for(const Le of Object.keys(me))me[Le]===ve&&delete me[Le]}function ei(){return Object.keys(ae)}function Pn(ve){return ve=(ve||"").toLowerCase(),ae[ve]||ae[me[ve]]}function Do(ve,{languageName:Le}){typeof ve=="string"&&(ve=[ve]),ve.forEach(et=>{me[et.toLowerCase()]=Le})}function Vs(ve){const Le=Pn(ve);return Le&&!Le.disableAutodetect}function ko(ve){ve["before:highlightBlock"]&&!ve["before:highlightElement"]&&(ve["before:highlightElement"]=Le=>{ve["before:highlightBlock"](Object.assign({block:Le.el},Le))}),ve["after:highlightBlock"]&&!ve["after:highlightElement"]&&(ve["after:highlightElement"]=Le=>{ve["after:highlightBlock"](Object.assign({block:Le.el},Le))})}function bd(ve){ko(ve),De.push(ve)}function qa(ve){const Le=De.indexOf(ve);Le!==-1&&De.splice(Le,1)}function ti(ve,Le){const et=ve;De.forEach(function(Nt){Nt[et]&&Nt[et](Le)})}function Nr(ve){return ne("10.7.0","highlightBlock will be removed entirely in v12.0"),ne("10.7.0","Please use highlightElement now."),ca(ve)}Object.assign(j,{highlight:Rt,highlightAuto:mr,highlightAll:Kt,highlightElement:ca,highlightBlock:Nr,configure:Ti,initHighlighting:Oi,initHighlightingOnLoad:ua,registerLanguage:No,unregisterLanguage:Ao,listLanguages:ei,getLanguage:Pn,registerAliases:Do,autoDetection:Vs,inherit:sa,addPlugin:bd,removePlugin:qa}),j.debugMode=function(){pt=!1},j.safeMode=function(){pt=!0},j.versionString=Vt,j.regex={concat:T,lookahead:y,either:C,optional:_,anyNumberOfTimes:v};for(const ve in $e)typeof $e[ve]=="object"&&e($e[ve]);return Object.assign(j,$e),j},Qt=Ft({});return Qt.newInstance=()=>Ft({}),uh=Qt,Qt.HighlightJS=Qt,Qt.default=Qt,uh}var c7=o7();const u7=za(c7),kw={},d7="hljs-";function f7(e){const t=u7.newInstance();return e&&l(e),{highlight:n,highlightAuto:i,listLanguages:s,register:l,registerAlias:c,registered:d};function n(f,p,m){const g=m||kw,y=typeof g.prefix=="string"?g.prefix:d7;if(!t.getLanguage(f))throw new Error("Unknown language: `"+f+"` is not registered");t.configure({__emitter:p7,classPrefix:y});const v=t.highlight(p,{ignoreIllegals:!0,language:f});if(v.errorRaised)throw new Error("Could not highlight with `Highlight.js`",{cause:v.errorRaised});const _=v._emitter.root,T=_.data;return T.language=v.language,T.relevance=v.relevance,_}function i(f,p){const g=(p||kw).subset||s();let y=-1,v=0,_;for(;++y<g.length;){const T=g[y];if(!t.getLanguage(T))continue;const N=n(T,f,p);N.data&&N.data.relevance!==void 0&&N.data.relevance>v&&(v=N.data.relevance,_=N)}return _||{type:"root",children:[],data:{language:void 0,relevance:v}}}function s(){return t.listLanguages()}function l(f,p){if(typeof f=="string")t.registerLanguage(f,p);else{let m;for(m in f)Object.hasOwn(f,m)&&t.registerLanguage(m,f[m])}}function c(f,p){if(typeof f=="string")t.registerAliases(typeof p=="string"?p:[...p],{languageName:f});else{let m;for(m in f)if(Object.hasOwn(f,m)){const g=f[m];t.registerAliases(typeof g=="string"?g:[...g],{languageName:m})}}}function d(f){return!!t.getLanguage(f)}}class p7{constructor(t){this.options=t,this.root={type:"root",children:[],data:{language:void 0,relevance:0}},this.stack=[this.root]}addText(t){if(t==="")return;const n=this.stack[this.stack.length-1],i=n.children[n.children.length-1];i&&i.type==="text"?i.value+=t:n.children.push({type:"text",value:t})}startScope(t){this.openNode(String(t))}endScope(){this.closeNode()}__addSublanguage(t,n){const i=this.stack[this.stack.length-1],s=t.root.children;n?i.children.push({type:"element",tagName:"span",properties:{className:[n]},children:s}):i.children.push(...s)}openNode(t){const n=this,i=t.split(".").map(function(c,d){return d?c+"_".repeat(d):n.options.classPrefix+c}),s=this.stack[this.stack.length-1],l={type:"element",tagName:"span",properties:{className:i},children:[]};s.children.push(l),this.stack.push(l)}closeNode(){this.stack.pop()}finalize(){}toHTML(){return""}}const h7={};function m7(e){const t=e||h7,n=t.aliases,i=t.detect||!1,s=t.languages||l7,l=t.plainText,c=t.prefix,d=t.subset;let f="hljs";const p=f7(s);if(n&&p.registerAlias(n),c){const m=c.indexOf("-");f=m===-1?c:c.slice(0,m)}return function(m,g){gd(m,"element",function(y,v,_){if(y.tagName!=="code"||!_||_.type!=="element"||_.tagName!=="pre")return;const T=g7(y);if(T===!1||!T&&!i||T&&l&&l.includes(T))return;Array.isArray(y.properties.className)||(y.properties.className=[]),y.properties.className.includes(f)||y.properties.className.unshift(f);const N=PG(y,{whitespace:"pre"});let C;try{C=T?p.highlight(T,N,{prefix:c}):p.highlightAuto(N,{prefix:c,subset:d})}catch(P){const k=P;if(T&&/Unknown language/.test(k.message)){g.message("Cannot highlight as `"+T+"`, it’s not registered",{ancestors:[_,y],cause:k,place:y.position,ruleId:"missing-language",source:"rehype-highlight"});return}throw k}!T&&C.data&&C.data.language&&y.properties.className.push("language-"+C.data.language),C.children.length>0&&(y.children=C.children)})}}function g7(e){const t=e.properties.className;let n=-1;if(!Array.isArray(t))return;let i;for(;++n<t.length;){const s=String(t[n]);if(s==="no-highlight"||s==="nohighlight")return!1;!i&&s.slice(0,5)==="lang-"&&(i=s.slice(5)),!i&&s.slice(0,9)==="language-"&&(i=s.slice(9))}return i}const b7=({href:e,children:t,...n})=>{const i=Ku(),{section:s}=Xg(),l=c=>{c.preventDefault(),i(`/docs/${s??"language-guide"}/${e}`)};return S.jsx("a",{href:e,onClick:l,className:"text-ds-accent hover:underline cursor-pointer",...n,children:t})},y7={a:({href:e,children:t,...n})=>e?e.startsWith("http://")||e.startsWith("https://")?S.jsx("a",{href:e,target:"_blank",rel:"noopener noreferrer",className:"text-ds-accent hover:underline",...n,children:t}):S.jsx(b7,{href:e,...n,children:t}):S.jsx("a",{...n,children:t}),code:({className:e,children:t,...n})=>e?S.jsx("code",{className:e,...n,children:t}):S.jsx("code",{className:"bg-ds-surface text-ds-accent px-1 py-0.5 rounded text-sm font-mono",...n,children:t}),pre:({children:e})=>S.jsx("pre",{className:"bg-ds-surface rounded-md p-4 overflow-x-auto my-4 text-sm border border-ds-border",children:e}),table:({children:e})=>S.jsx("div",{className:"overflow-x-auto my-4",children:S.jsx("table",{className:"w-full border-collapse text-sm",children:e})}),th:({children:e})=>S.jsx("th",{className:"text-left px-3 py-2 border border-ds-border bg-ds-surface text-ds-text font-semibold",children:e}),td:({children:e})=>S.jsx("td",{className:"px-3 py-2 border border-ds-border text-ds-text-muted",children:e}),h1:({children:e})=>S.jsx("h1",{className:"text-2xl font-bold text-ds-text mb-4 mt-0",children:e}),h2:({children:e})=>S.jsx("h2",{className:"text-lg font-semibold text-ds-text mt-8 mb-3 border-b border-ds-border pb-2",children:e}),h3:({children:e})=>S.jsx("h3",{className:"text-base font-semibold text-ds-text mt-6 mb-2",children:e}),p:({children:e})=>S.jsx("p",{className:"text-ds-text-muted leading-relaxed mb-4",children:e}),ul:({children:e})=>S.jsx("ul",{className:"list-disc list-inside text-ds-text-muted mb-4 space-y-1",children:e}),ol:({children:e})=>S.jsx("ol",{className:"list-decimal list-inside text-ds-text-muted mb-4 space-y-1",children:e}),li:({children:e})=>S.jsx("li",{className:"text-ds-text-muted",children:e}),blockquote:({children:e})=>S.jsx("blockquote",{className:"border-l-2 border-ds-accent pl-4 my-4 text-ds-text-dim italic",children:e})},v7=({content:e})=>S.jsx(h8,{remarkPlugins:[OG],rehypePlugins:[m7],components:y7,children:e}),_7=Object.assign({"../../docs/api-reference/animatedsprite.md":m4,"../../docs/api-reference/array.md":g4,"../../docs/api-reference/assetmanager.md":b4,"../../docs/api-reference/dict.md":y4,"../../docs/api-reference/drawing.md":v4,"../../docs/api-reference/gfx.md":_4,"../../docs/api-reference/input.md":x4,"../../docs/api-reference/math.md":w4,"../../docs/api-reference/objecttransform.md":E4,"../../docs/api-reference/pen.md":S4,"../../docs/api-reference/sprite.md":C4,"../../docs/api-reference/stage.md":T4,"../../docs/api-reference/string.md":O4,"../../docs/api-reference/text.md":R4,"../../docs/api-reference/tilemap.md":N4,"../../docs/language-guide/arrays.md":A4,"../../docs/language-guide/class-composition.md":D4,"../../docs/language-guide/classes.md":k4,"../../docs/language-guide/constructors.md":M4,"../../docs/language-guide/control-flow.md":P4,"../../docs/language-guide/dictionaries.md":I4,"../../docs/language-guide/functions.md":L4,"../../docs/language-guide/inheritance.md":j4,"../../docs/language-guide/lifecycle.md":$4,"../../docs/language-guide/modules.md":z4,"../../docs/language-guide/multi-file.md":B4,"../../docs/language-guide/new-keyword.md":F4,"../../docs/language-guide/operators.md":U4,"../../docs/language-guide/packages.md":H4,"../../docs/language-guide/self.md":q4,"../../docs/language-guide/variable-scoping.md":G4,"../../docs/tutorials/01-hello-world.md":V4,"../../docs/tutorials/02-drawing.md":K4,"../../docs/tutorials/03-sprite.md":Y4,"../../docs/tutorials/04-motion.md":X4,"../../docs/tutorials/05-keyboard.md":W4,"../../docs/tutorials/06-bounds.md":Z4,"../../docs/tutorials/07-score.md":Q4,"../../docs/tutorials/08-functions.md":J4,"../../docs/tutorials/09-enemies.md":e9,"../../docs/tutorials/10-classes.md":t9,"../../docs/tutorials/11-dodge.md":n9}),x7=({sectionId:e,slug:t})=>{const n=dd.find(m=>m.id===e);if(!n)return S.jsx("div",{className:"flex-1 p-8 text-ds-text-dim text-sm",children:"Section not found."});if(Dg(n).length===0)return S.jsx("div",{className:"flex-1 p-8 flex items-center justify-center",children:S.jsx("p",{className:"text-ds-text-dim text-sm",children:"Coming soon."})});const i=Dg(n),s=i.findIndex(m=>m.slug===t),l=i[s];if(!l)return S.jsx("div",{className:"flex-1 p-8 text-ds-text-dim text-sm",children:"Topic not found."});const c=`../../docs/${l.file}`,d=_7[c],f=s>0?i[s-1]:void 0,p=s<i.length-1?i[s+1]:void 0;return S.jsx("div",{className:"flex-1 overflow-y-auto",children:S.jsxs("div",{className:"max-w-3xl mx-auto px-8 py-6",children:[S.jsxs("div",{className:"text-xs text-ds-text-dim mb-6",children:[n.label," › ",l.title]}),d?S.jsx(v7,{content:d}):S.jsx("p",{className:"text-ds-text-dim text-sm",children:"Content not available."}),S.jsxs("div",{className:"flex justify-between mt-12 pt-6 border-t border-ds-border",children:[S.jsx("div",{children:f&&S.jsxs(ra,{to:`/docs/${e}/${f.slug}`,className:"text-sm text-ds-text-muted hover:text-ds-text transition-colors",children:["← ",f.title]})}),S.jsx("div",{children:p&&S.jsxs(ra,{to:`/docs/${e}/${p.slug}`,className:"text-sm text-ds-text-muted hover:text-ds-text transition-colors",children:[p.title," →"]})})]})]})})},w7=({sectionId:e,slug:t})=>S.jsxs("div",{className:"min-h-screen flex flex-col bg-ds-bg text-ds-text",children:[S.jsx("header",{className:"h-11 flex-shrink-0 flex items-center px-6 bg-ds-surface border-b border-ds-border",children:S.jsx("span",{className:"font-bold text-base tracking-wide text-ds-accent-btn-text",children:"softBASIC Docs"})}),S.jsx(p4,{sectionId:e}),S.jsxs("div",{className:"flex flex-1 overflow-hidden",children:[S.jsx(h4,{sectionId:e,slug:t}),S.jsx(x7,{sectionId:e,slug:t})]})]}),sC="language-guide";var Mw,Pw;const E7=((Pw=(Mw=dd.find(e=>e.id===sC))==null?void 0:Mw.topics[0])==null?void 0:Pw.slug)??"modules",dh=()=>{const{section:e,slug:t}=Xg(),n=e??sC,i=t??E7;return!e||!t?S.jsx(cR,{to:`/docs/${n}/${i}`,replace:!0}):S.jsx(w7,{sectionId:n,slug:i})},S7=()=>S.jsxs(dR,{children:[S.jsx(Ts,{path:"/",element:S.jsx(_D,{})}),S.jsx(Ts,{path:"/projects/:id/edit",element:S.jsx(f4,{})}),S.jsx(Ts,{path:"/docs",element:S.jsx(dh,{})}),S.jsx(Ts,{path:"/docs/:section",element:S.jsx(dh,{})}),S.jsx(Ts,{path:"/docs/:section/:slug",element:S.jsx(dh,{})})]});function C7(){const e=Or();return E.useEffect(()=>{e(SA(oD))},[e]),S.jsx("div",{className:"h-screen w-screen flex flex-col bg-gray-900 text-white",children:S.jsx(S7,{})})}function pu(e){return typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?pu=function(n){return typeof n}:pu=function(n){return n&&typeof Symbol=="function"&&n.constructor===Symbol&&n!==Symbol.prototype?"symbol":typeof n},pu(e)}function T7(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function O7(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}function R7(e,t,n){return t&&O7(e.prototype,t),e}function N7(e,t){return t&&(pu(t)==="object"||typeof t=="function")?t:hu(e)}function qg(e){return qg=Object.setPrototypeOf?Object.getPrototypeOf:function(n){return n.__proto__||Object.getPrototypeOf(n)},qg(e)}function hu(e){if(e===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function A7(e,t){if(typeof t!="function"&&t!==null)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&Gg(e,t)}function Gg(e,t){return Gg=Object.setPrototypeOf||function(i,s){return i.__proto__=s,i},Gg(e,t)}function mu(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var lC=(function(e){A7(t,e);function t(){var n,i;T7(this,t);for(var s=arguments.length,l=new Array(s),c=0;c<s;c++)l[c]=arguments[c];return i=N7(this,(n=qg(t)).call.apply(n,[this].concat(l))),mu(hu(i),"state",{bootstrapped:!1}),mu(hu(i),"_unsubscribe",void 0),mu(hu(i),"handlePersistorState",function(){var d=i.props.persistor,f=d.getState(),p=f.bootstrapped;p&&(i.props.onBeforeLift?Promise.resolve(i.props.onBeforeLift()).finally(function(){return i.setState({bootstrapped:!0})}):i.setState({bootstrapped:!0}),i._unsubscribe&&i._unsubscribe())}),i}return R7(t,[{key:"componentDidMount",value:function(){this._unsubscribe=this.props.persistor.subscribe(this.handlePersistorState),this.handlePersistorState()}},{key:"componentWillUnmount",value:function(){this._unsubscribe&&this._unsubscribe()}},{key:"render",value:function(){return typeof this.props.children=="function"?this.props.children(this.state.bootstrapped):this.state.bootstrapped?this.props.children:this.props.loading}}]),t})(E.PureComponent);mu(lC,"defaultProps",{children:null,loading:null});vO.createRoot(document.getElementById("root")).render(S.jsx(Wt.StrictMode,{children:S.jsx(aN,{store:TE,children:S.jsx(lC,{loading:null,persistor:lD,children:S.jsx(IR,{children:S.jsx(C7,{})})})})}));
