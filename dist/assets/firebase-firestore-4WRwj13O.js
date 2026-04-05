import{_ as Pc,r as Ni,a as Sc,b as sa,g as bc,S as Cc}from"./firebase-core-COSghHnU.js";import{L as Dc,I as et,C as xc,F as Nc,c as Re,d as ia,e as Ns,p as oa,f as kc,u as Mc,h as Fc,X as Oc,j as Lc,k as Hr,l as Uc,m as qc,W as $n,n as Bc,S as ki,o as aa,q as cr,r as zc,i as Kc,s as ua,M as Gc,t as me}from"./firebase-DsjMOuOd.js";const Mi="@firebase/firestore",Fi="4.9.3";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class X{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}X.UNAUTHENTICATED=new X(null),X.GOOGLE_CREDENTIALS=new X("google-credentials-uid"),X.FIRST_PARTY=new X("first-party-uid"),X.MOCK_USER=new X("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let jt="12.7.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ot=new Dc("@firebase/firestore");function At(){return ot.logLevel}function g(r,...e){if(ot.logLevel<=Re.DEBUG){const t=e.map(ks);ot.debug(`Firestore (${jt}): ${r}`,...t)}}function $(r,...e){if(ot.logLevel<=Re.ERROR){const t=e.map(ks);ot.error(`Firestore (${jt}): ${r}`,...t)}}function St(r,...e){if(ot.logLevel<=Re.WARN){const t=e.map(ks);ot.warn(`Firestore (${jt}): ${r}`,...t)}}function ks(r){if(typeof r=="string")return r;try{/**
* @license
* Copyright 2020 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/return(function(t){return JSON.stringify(t)})(r)}catch{return r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function I(r,e,t){let n="Unexpected state";typeof e=="string"?n=e:t=e,ca(r,n,t)}function ca(r,e,t){let n=`FIRESTORE (${jt}) INTERNAL ASSERTION FAILED: ${e} (ID: ${r.toString(16)})`;if(t!==void 0)try{n+=" CONTEXT: "+JSON.stringify(t)}catch{n+=" CONTEXT: "+t}throw $(n),new Error(n)}function v(r,e,t,n){let s="Unexpected state";typeof t=="string"?s=t:n=t,r||ca(e,s,n)}function w(r,e){return r}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const m={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class p extends Nc{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Te{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class la{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class $c{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable((()=>t(X.UNAUTHENTICATED)))}shutdown(){}}class jc{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable((()=>t(this.token.user)))}shutdown(){this.changeListener=null}}class Qc{constructor(e){this.t=e,this.currentUser=X.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,t){v(this.o===void 0,42304);let n=this.i;const s=u=>this.i!==n?(n=this.i,t(u)):Promise.resolve();let i=new Te;this.o=()=>{this.i++,this.currentUser=this.u(),i.resolve(),i=new Te,e.enqueueRetryable((()=>s(this.currentUser)))};const o=()=>{const u=i;e.enqueueRetryable((async()=>{await u.promise,await s(this.currentUser)}))},a=u=>{g("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=u,this.o&&(this.auth.addAuthTokenListener(this.o),o())};this.t.onInit((u=>a(u))),setTimeout((()=>{if(!this.auth){const u=this.t.getImmediate({optional:!0});u?a(u):(g("FirebaseAuthCredentialsProvider","Auth not yet detected"),i.resolve(),i=new Te)}}),0),o()}getToken(){const e=this.i,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then((n=>this.i!==e?(g("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):n?(v(typeof n.accessToken=="string",31837,{l:n}),new la(n.accessToken,this.currentUser)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const e=this.auth&&this.auth.getUid();return v(e===null||typeof e=="string",2055,{h:e}),new X(e)}}class Wc{constructor(e,t,n){this.P=e,this.T=t,this.I=n,this.type="FirstParty",this.user=X.FIRST_PARTY,this.A=new Map}R(){return this.I?this.I():null}get headers(){this.A.set("X-Goog-AuthUser",this.P);const e=this.R();return e&&this.A.set("Authorization",e),this.T&&this.A.set("X-Goog-Iam-Authorization-Token",this.T),this.A}}class Hc{constructor(e,t,n){this.P=e,this.T=t,this.I=n}getToken(){return Promise.resolve(new Wc(this.P,this.T,this.I))}start(e,t){e.enqueueRetryable((()=>t(X.FIRST_PARTY)))}shutdown(){}invalidateToken(){}}class Oi{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class Jc{constructor(e,t){this.V=t,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,Sc(e)&&e.settings.appCheckToken&&(this.p=e.settings.appCheckToken)}start(e,t){v(this.o===void 0,3512);const n=i=>{i.error!=null&&g("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${i.error.message}`);const o=i.token!==this.m;return this.m=i.token,g("FirebaseAppCheckTokenProvider",`Received ${o?"new":"existing"} token.`),o?t(i.token):Promise.resolve()};this.o=i=>{e.enqueueRetryable((()=>n(i)))};const s=i=>{g("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=i,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit((i=>s(i))),setTimeout((()=>{if(!this.appCheck){const i=this.V.getImmediate({optional:!0});i?s(i):g("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}}),0)}getToken(){if(this.p)return Promise.resolve(new Oi(this.p));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then((t=>t?(v(typeof t.token=="string",44558,{tokenResult:t}),this.m=t.token,new Oi(t.token)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Yc(r){const e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(r);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let n=0;n<r;n++)t[n]=Math.floor(256*Math.random());return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ms{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516);let n="";for(;n.length<20;){const s=Yc(40);for(let i=0;i<s.length;++i)n.length<20&&s[i]<t&&(n+=e.charAt(s[i]%62))}return n}}function V(r,e){return r<e?-1:r>e?1:0}function os(r,e){const t=Math.min(r.length,e.length);for(let n=0;n<t;n++){const s=r.charAt(n),i=e.charAt(n);if(s!==i)return Jr(s)===Jr(i)?V(s,i):Jr(s)?1:-1}return V(r.length,e.length)}const Xc=55296,Zc=57343;function Jr(r){const e=r.charCodeAt(0);return e>=Xc&&e<=Zc}function bt(r,e,t){return r.length===e.length&&r.every(((n,s)=>t(n,e[s])))}function ha(r){return r+"\0"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Li="__name__";class ge{constructor(e,t,n){t===void 0?t=0:t>e.length&&I(637,{offset:t,range:e.length}),n===void 0?n=e.length-t:n>e.length-t&&I(1746,{length:n,range:e.length-t}),this.segments=e,this.offset=t,this.len=n}get length(){return this.len}isEqual(e){return ge.comparator(this,e)===0}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof ge?e.forEach((n=>{t.push(n)})):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,n=this.limit();t<n;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const n=Math.min(e.length,t.length);for(let s=0;s<n;s++){const i=ge.compareSegments(e.get(s),t.get(s));if(i!==0)return i}return V(e.length,t.length)}static compareSegments(e,t){const n=ge.isNumericId(e),s=ge.isNumericId(t);return n&&!s?-1:!n&&s?1:n&&s?ge.extractNumericId(e).compare(ge.extractNumericId(t)):os(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return et.fromString(e.substring(4,e.length-2))}}class x extends ge{construct(e,t,n){return new x(e,t,n)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const n of e){if(n.indexOf("//")>=0)throw new p(m.INVALID_ARGUMENT,`Invalid segment (${n}). Paths must not contain // in them.`);t.push(...n.split("/").filter((s=>s.length>0)))}return new x(t)}static emptyPath(){return new x([])}}const el=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class U extends ge{construct(e,t,n){return new U(e,t,n)}static isValidIdentifier(e){return el.test(e)}canonicalString(){return this.toArray().map((e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),U.isValidIdentifier(e)||(e="`"+e+"`"),e))).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===Li}static keyField(){return new U([Li])}static fromServerFormat(e){const t=[];let n="",s=0;const i=()=>{if(n.length===0)throw new p(m.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(n),n=""};let o=!1;for(;s<e.length;){const a=e[s];if(a==="\\"){if(s+1===e.length)throw new p(m.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const u=e[s+1];if(u!=="\\"&&u!=="."&&u!=="`")throw new p(m.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);n+=u,s+=2}else a==="`"?(o=!o,s++):a!=="."||o?(n+=a,s++):(i(),s++)}if(i(),o)throw new p(m.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new U(t)}static emptyPath(){return new U([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class y{constructor(e){this.path=e}static fromPath(e){return new y(x.fromString(e))}static fromName(e){return new y(x.fromString(e).popFirst(5))}static empty(){return new y(x.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&x.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return x.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new y(new x(e.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function da(r,e,t){if(!t)throw new p(m.INVALID_ARGUMENT,`Function ${r}() cannot be called with an empty ${e}.`)}function tl(r,e,t,n){if(e===!0&&n===!0)throw new p(m.INVALID_ARGUMENT,`${r} and ${t} cannot be used together.`)}function Ui(r){if(!y.isDocumentKey(r))throw new p(m.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${r} has ${r.length}.`)}function qi(r){if(y.isDocumentKey(r))throw new p(m.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${r} has ${r.length}.`)}function fa(r){return typeof r=="object"&&r!==null&&(Object.getPrototypeOf(r)===Object.prototype||Object.getPrototypeOf(r)===null)}function br(r){if(r===void 0)return"undefined";if(r===null)return"null";if(typeof r=="string")return r.length>20&&(r=`${r.substring(0,20)}...`),JSON.stringify(r);if(typeof r=="number"||typeof r=="boolean")return""+r;if(typeof r=="object"){if(r instanceof Array)return"an array";{const e=(function(n){return n.constructor?n.constructor.name:null})(r);return e?`a custom ${e} object`:"an object"}}return typeof r=="function"?"a function":I(12329,{type:typeof r})}function ie(r,e){if("_delegate"in r&&(r=r._delegate),!(r instanceof e)){if(e.name===r.constructor.name)throw new p(m.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const t=br(r);throw new p(m.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return r}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function W(r,e){const t={typeString:r};return e&&(t.value=e),t}function Cn(r,e){if(!fa(r))throw new p(m.INVALID_ARGUMENT,"JSON must be an object");let t;for(const n in e)if(e[n]){const s=e[n].typeString,i="value"in e[n]?{value:e[n].value}:void 0;if(!(n in r)){t=`JSON missing required field: '${n}'`;break}const o=r[n];if(s&&typeof o!==s){t=`JSON field '${n}' must be a ${s}.`;break}if(i!==void 0&&o!==i.value){t=`Expected '${n}' field to equal '${i.value}'`;break}}if(t)throw new p(m.INVALID_ARGUMENT,t);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bi=-62135596800,zi=1e6;class k{static now(){return k.fromMillis(Date.now())}static fromDate(e){return k.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),n=Math.floor((e-1e3*t)*zi);return new k(t,n)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new p(m.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new p(m.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<Bi)throw new p(m.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new p(m.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/zi}_compareTo(e){return this.seconds===e.seconds?V(this.nanoseconds,e.nanoseconds):V(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:k._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(Cn(e,k._jsonSchema))return new k(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-Bi;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}k._jsonSchemaVersion="firestore/timestamp/1.0",k._jsonSchema={type:W("string",k._jsonSchemaVersion),seconds:W("number"),nanoseconds:W("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class R{static fromTimestamp(e){return new R(e)}static min(){return new R(new k(0,0))}static max(){return new R(new k(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ct=-1;class lr{constructor(e,t,n,s){this.indexId=e,this.collectionGroup=t,this.fields=n,this.indexState=s}}function as(r){return r.fields.find((e=>e.kind===2))}function Qe(r){return r.fields.filter((e=>e.kind!==2))}lr.UNKNOWN_ID=-1;class Xn{constructor(e,t){this.fieldPath=e,this.kind=t}}class gn{constructor(e,t){this.sequenceNumber=e,this.offset=t}static empty(){return new gn(0,de.min())}}function ma(r,e){const t=r.toTimestamp().seconds,n=r.toTimestamp().nanoseconds+1,s=R.fromTimestamp(n===1e9?new k(t+1,0):new k(t,n));return new de(s,y.empty(),e)}function _a(r){return new de(r.readTime,r.key,Ct)}class de{constructor(e,t,n){this.readTime=e,this.documentKey=t,this.largestBatchId=n}static min(){return new de(R.min(),y.empty(),Ct)}static max(){return new de(R.max(),y.empty(),Ct)}}function Fs(r,e){let t=r.readTime.compareTo(e.readTime);return t!==0?t:(t=y.comparator(r.documentKey,e.documentKey),t!==0?t:V(r.largestBatchId,e.largestBatchId))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ga="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class pa{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach((e=>e()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ze(r){if(r.code!==m.FAILED_PRECONDITION||r.message!==ga)throw r;g("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class f{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e((t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t)}),(t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t)}))}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&I(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new f(((n,s)=>{this.nextCallback=i=>{this.wrapSuccess(e,i).next(n,s)},this.catchCallback=i=>{this.wrapFailure(t,i).next(n,s)}}))}toPromise(){return new Promise(((e,t)=>{this.next(e,t)}))}wrapUserFunction(e){try{const t=e();return t instanceof f?t:f.resolve(t)}catch(t){return f.reject(t)}}wrapSuccess(e,t){return e?this.wrapUserFunction((()=>e(t))):f.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction((()=>e(t))):f.reject(t)}static resolve(e){return new f(((t,n)=>{t(e)}))}static reject(e){return new f(((t,n)=>{n(e)}))}static waitFor(e){return new f(((t,n)=>{let s=0,i=0,o=!1;e.forEach((a=>{++s,a.next((()=>{++i,o&&i===s&&t()}),(u=>n(u)))})),o=!0,i===s&&t()}))}static or(e){let t=f.resolve(!1);for(const n of e)t=t.next((s=>s?f.resolve(s):n()));return t}static forEach(e,t){const n=[];return e.forEach(((s,i)=>{n.push(t.call(this,s,i))})),this.waitFor(n)}static mapArray(e,t){return new f(((n,s)=>{const i=e.length,o=new Array(i);let a=0;for(let u=0;u<i;u++){const c=u;t(e[c]).next((l=>{o[c]=l,++a,a===i&&n(o)}),(l=>s(l)))}}))}static doWhile(e,t){return new f(((n,s)=>{const i=()=>{e()===!0?t().next((()=>{i()}),s):n()};i()}))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ce="SimpleDb";class Cr{static open(e,t,n,s){try{return new Cr(t,e.transaction(s,n))}catch(i){throw new an(t,i)}}constructor(e,t){this.action=e,this.transaction=t,this.aborted=!1,this.S=new Te,this.transaction.oncomplete=()=>{this.S.resolve()},this.transaction.onabort=()=>{t.error?this.S.reject(new an(e,t.error)):this.S.resolve()},this.transaction.onerror=n=>{const s=Os(n.target.error);this.S.reject(new an(e,s))}}get D(){return this.S.promise}abort(e){e&&this.S.reject(e),this.aborted||(g(ce,"Aborting transaction:",e?e.message:"Client-initiated abort"),this.aborted=!0,this.transaction.abort())}C(){const e=this.transaction;this.aborted||typeof e.commit!="function"||e.commit()}store(e){const t=this.transaction.objectStore(e);return new rl(t)}}class Fe{static delete(e){return g(ce,"Removing database:",e),He(zc().indexedDB.deleteDatabase(e)).toPromise()}static v(){if(!Kc())return!1;if(Fe.F())return!0;const e=cr(),t=Fe.M(e),n=0<t&&t<10,s=ya(e),i=0<s&&s<4.5;return!(e.indexOf("MSIE ")>0||e.indexOf("Trident/")>0||e.indexOf("Edge/")>0||n||i)}static F(){var e;return typeof process<"u"&&((e=process.__PRIVATE_env)==null?void 0:e.__PRIVATE_USE_MOCK_PERSISTENCE)==="YES"}static O(e,t){return e.store(t)}static M(e){const t=e.match(/i(?:phone|pad|pod) os ([\d_]+)/i),n=t?t[1].split("_").slice(0,2).join("."):"-1";return Number(n)}constructor(e,t,n){this.name=e,this.version=t,this.N=n,this.B=null,Fe.M(cr())===12.2&&$("Firestore persistence suffers from a bug in iOS 12.2 Safari that may cause your app to stop working. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.")}async L(e){return this.db||(g(ce,"Opening database:",this.name),this.db=await new Promise(((t,n)=>{const s=indexedDB.open(this.name,this.version);s.onsuccess=i=>{const o=i.target.result;t(o)},s.onblocked=()=>{n(new an(e,"Cannot upgrade IndexedDB schema while another tab is open. Close all tabs that access Firestore and reload this page to proceed."))},s.onerror=i=>{const o=i.target.error;o.name==="VersionError"?n(new p(m.FAILED_PRECONDITION,"A newer version of the Firestore SDK was previously used and so the persisted data is not compatible with the version of the SDK you are now using. The SDK will operate with persistence disabled. If you need persistence, please re-upgrade to a newer version of the SDK or else clear the persisted IndexedDB data for your app to start fresh.")):o.name==="InvalidStateError"?n(new p(m.FAILED_PRECONDITION,"Unable to open an IndexedDB connection. This could be due to running in a private browsing session on a browser whose private browsing sessions do not support IndexedDB: "+o)):n(new an(e,o))},s.onupgradeneeded=i=>{g(ce,'Database "'+this.name+'" requires upgrade from version:',i.oldVersion);const o=i.target.result;this.N.k(o,s.transaction,i.oldVersion,this.version).next((()=>{g(ce,"Database upgrade to version "+this.version+" complete")}))}}))),this.q&&(this.db.onversionchange=t=>this.q(t)),this.db}$(e){this.q=e,this.db&&(this.db.onversionchange=t=>e(t))}async runTransaction(e,t,n,s){const i=t==="readonly";let o=0;for(;;){++o;try{this.db=await this.L(e);const a=Cr.open(this.db,e,i?"readonly":"readwrite",n),u=s(a).next((c=>(a.C(),c))).catch((c=>(a.abort(c),f.reject(c)))).toPromise();return u.catch((()=>{})),await a.D,u}catch(a){const u=a,c=u.name!=="FirebaseError"&&o<3;if(g(ce,"Transaction failed with error:",u.message,"Retrying:",c),this.close(),!c)return Promise.reject(u)}}}close(){this.db&&this.db.close(),this.db=void 0}}function ya(r){const e=r.match(/Android ([\d.]+)/i),t=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(t)}class nl{constructor(e){this.U=e,this.K=!1,this.W=null}get isDone(){return this.K}get G(){return this.W}set cursor(e){this.U=e}done(){this.K=!0}j(e){this.W=e}delete(){return He(this.U.delete())}}class an extends p{constructor(e,t){super(m.UNAVAILABLE,`IndexedDB transaction '${e}' failed: ${t}`),this.name="IndexedDbTransactionError"}}function Ke(r){return r.name==="IndexedDbTransactionError"}class rl{constructor(e){this.store=e}put(e,t){let n;return t!==void 0?(g(ce,"PUT",this.store.name,e,t),n=this.store.put(t,e)):(g(ce,"PUT",this.store.name,"<auto-key>",e),n=this.store.put(e)),He(n)}add(e){return g(ce,"ADD",this.store.name,e,e),He(this.store.add(e))}get(e){return He(this.store.get(e)).next((t=>(t===void 0&&(t=null),g(ce,"GET",this.store.name,e,t),t)))}delete(e){return g(ce,"DELETE",this.store.name,e),He(this.store.delete(e))}count(){return g(ce,"COUNT",this.store.name),He(this.store.count())}J(e,t){const n=this.options(e,t),s=n.index?this.store.index(n.index):this.store;if(typeof s.getAll=="function"){const i=s.getAll(n.range);return new f(((o,a)=>{i.onerror=u=>{a(u.target.error)},i.onsuccess=u=>{o(u.target.result)}}))}{const i=this.cursor(n),o=[];return this.H(i,((a,u)=>{o.push(u)})).next((()=>o))}}Y(e,t){const n=this.store.getAll(e,t===null?void 0:t);return new f(((s,i)=>{n.onerror=o=>{i(o.target.error)},n.onsuccess=o=>{s(o.target.result)}}))}Z(e,t){g(ce,"DELETE ALL",this.store.name);const n=this.options(e,t);n.X=!1;const s=this.cursor(n);return this.H(s,((i,o,a)=>a.delete()))}ee(e,t){let n;t?n=e:(n={},t=e);const s=this.cursor(n);return this.H(s,t)}te(e){const t=this.cursor({});return new f(((n,s)=>{t.onerror=i=>{const o=Os(i.target.error);s(o)},t.onsuccess=i=>{const o=i.target.result;o?e(o.primaryKey,o.value).next((a=>{a?o.continue():n()})):n()}}))}H(e,t){const n=[];return new f(((s,i)=>{e.onerror=o=>{i(o.target.error)},e.onsuccess=o=>{const a=o.target.result;if(!a)return void s();const u=new nl(a),c=t(a.primaryKey,a.value,u);if(c instanceof f){const l=c.catch((h=>(u.done(),f.reject(h))));n.push(l)}u.isDone?s():u.G===null?a.continue():a.continue(u.G)}})).next((()=>f.waitFor(n)))}options(e,t){let n;return e!==void 0&&(typeof e=="string"?n=e:t=e),{index:n,range:t}}cursor(e){let t="next";if(e.reverse&&(t="prev"),e.index){const n=this.store.index(e.index);return e.X?n.openKeyCursor(e.range,t):n.openCursor(e.range,t)}return this.store.openCursor(e.range,t)}}function He(r){return new f(((e,t)=>{r.onsuccess=n=>{const s=n.target.result;e(s)},r.onerror=n=>{const s=Os(n.target.error);t(s)}}))}let Ki=!1;function Os(r){const e=Fe.M(cr());if(e>=12.2&&e<13){const t="An internal error was encountered in the Indexed Database server";if(r.message.indexOf(t)>=0){const n=new p("internal",`IOS_INDEXEDDB_BUG1: IndexedDb has thrown '${t}'. This is likely due to an unavoidable bug in iOS. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.`);return Ki||(Ki=!0,setTimeout((()=>{throw n}),0)),n}}return r}const un="IndexBackfiller";class sl{constructor(e,t){this.asyncQueue=e,this.ne=t,this.task=null}start(){this.re(15e3)}stop(){this.task&&(this.task.cancel(),this.task=null)}get started(){return this.task!==null}re(e){g(un,`Scheduled in ${e}ms`),this.task=this.asyncQueue.enqueueAfterDelay("index_backfill",e,(async()=>{this.task=null;try{const t=await this.ne.ie();g(un,`Documents written: ${t}`)}catch(t){Ke(t)?g(un,"Ignoring IndexedDB error during index backfill: ",t):await ze(t)}await this.re(6e4)}))}}class il{constructor(e,t){this.localStore=e,this.persistence=t}async ie(e=50){return this.persistence.runTransaction("Backfill Indexes","readwrite-primary",(t=>this.se(t,e)))}se(e,t){const n=new Set;let s=t,i=!0;return f.doWhile((()=>i===!0&&s>0),(()=>this.localStore.indexManager.getNextCollectionGroupToUpdate(e).next((o=>{if(o!==null&&!n.has(o))return g(un,`Processing collection: ${o}`),this.oe(e,o,s).next((a=>{s-=a,n.add(o)}));i=!1})))).next((()=>t-s))}oe(e,t,n){return this.localStore.indexManager.getMinOffsetFromCollectionGroup(e,t).next((s=>this.localStore.localDocuments.getNextDocuments(e,t,s,n).next((i=>{const o=i.changes;return this.localStore.indexManager.updateIndexEntries(e,o).next((()=>this._e(s,i))).next((a=>(g(un,`Updating offset: ${a}`),this.localStore.indexManager.updateCollectionGroup(e,t,a)))).next((()=>o.size))}))))}_e(e,t){let n=e;return t.changes.forEach(((s,i)=>{const o=_a(i);Fs(o,n)>0&&(n=o)})),new de(n.readTime,n.documentKey,Math.max(t.batchId,e.largestBatchId))}}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ae{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=n=>this.ae(n),this.ue=n=>t.writeSequenceNumber(n))}ae(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.ue&&this.ue(e),e}}ae.ce=-1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tt=-1;function Dr(r){return r==null}function pn(r){return r===0&&1/r==-1/0}function Ia(r){return typeof r=="number"&&Number.isInteger(r)&&!pn(r)&&r<=Number.MAX_SAFE_INTEGER&&r>=Number.MIN_SAFE_INTEGER}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const hr="";function se(r){let e="";for(let t=0;t<r.length;t++)e.length>0&&(e=Gi(e)),e=ol(r.get(t),e);return Gi(e)}function ol(r,e){let t=e;const n=r.length;for(let s=0;s<n;s++){const i=r.charAt(s);switch(i){case"\0":t+="";break;case hr:t+="";break;default:t+=i}}return t}function Gi(r){return r+hr+""}function ye(r){const e=r.length;if(v(e>=2,64408,{path:r}),e===2)return v(r.charAt(0)===hr&&r.charAt(1)==="",56145,{path:r}),x.emptyPath();const t=e-2,n=[];let s="";for(let i=0;i<e;){const o=r.indexOf(hr,i);switch((o<0||o>t)&&I(50515,{path:r}),r.charAt(o+1)){case"":const a=r.substring(i,o);let u;s.length===0?u=a:(s+=a,u=s,s=""),n.push(u);break;case"":s+=r.substring(i,o),s+="\0";break;case"":s+=r.substring(i,o+1);break;default:I(61167,{path:r})}i=o+2}return new x(n)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const We="remoteDocuments",Dn="owner",gt="owner",yn="mutationQueues",al="userId",_e="mutations",$i="batchId",Ze="userMutationsIndex",ji=["userId","batchId"];/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zn(r,e){return[r,se(e)]}function Ta(r,e,t){return[r,se(e),t]}const ul={},Dt="documentMutations",dr="remoteDocumentsV14",cl=["prefixPath","collectionGroup","readTime","documentId"],er="documentKeyIndex",ll=["prefixPath","collectionGroup","documentId"],Ea="collectionGroupIndex",hl=["collectionGroup","readTime","prefixPath","documentId"],In="remoteDocumentGlobal",us="remoteDocumentGlobalKey",xt="targets",Aa="queryTargetsIndex",dl=["canonicalId","targetId"],Nt="targetDocuments",fl=["targetId","path"],Ls="documentTargetsIndex",ml=["path","targetId"],fr="targetGlobalKey",nt="targetGlobal",Tn="collectionParents",_l=["collectionId","parent"],kt="clientMetadata",gl="clientId",xr="bundles",pl="bundleId",Nr="namedQueries",yl="name",Us="indexConfiguration",Il="indexId",cs="collectionGroupIndex",Tl="collectionGroup",cn="indexState",El=["indexId","uid"],wa="sequenceNumberIndex",Al=["uid","sequenceNumber"],ln="indexEntries",wl=["indexId","uid","arrayValue","directionalValue","orderedDocumentKey","documentKey"],va="documentKeyIndex",vl=["indexId","uid","orderedDocumentKey"],kr="documentOverlays",Rl=["userId","collectionPath","documentId"],ls="collectionPathOverlayIndex",Vl=["userId","collectionPath","largestBatchId"],Ra="collectionGroupOverlayIndex",Pl=["userId","collectionGroup","largestBatchId"],qs="globals",Sl="name",Va=[yn,_e,Dt,We,xt,Dn,nt,Nt,kt,In,Tn,xr,Nr],bl=[...Va,kr],Pa=[yn,_e,Dt,dr,xt,Dn,nt,Nt,kt,In,Tn,xr,Nr,kr],Sa=Pa,Bs=[...Sa,Us,cn,ln],Cl=Bs,ba=[...Bs,qs],Dl=ba;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hs extends pa{constructor(e,t){super(),this.le=e,this.currentSequenceNumber=t}}function J(r,e){const t=w(r);return Fe.O(t.le,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Qi(r){let e=0;for(const t in r)Object.prototype.hasOwnProperty.call(r,t)&&e++;return e}function Ge(r,e){for(const t in r)Object.prototype.hasOwnProperty.call(r,t)&&e(t,r[t])}function Ca(r){for(const e in r)if(Object.prototype.hasOwnProperty.call(r,e))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class O{constructor(e,t){this.comparator=e,this.root=t||Z.EMPTY}insert(e,t){return new O(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,Z.BLACK,null,null))}remove(e){return new O(this.comparator,this.root.remove(e,this.comparator).copy(null,null,Z.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){const n=this.comparator(e,t.key);if(n===0)return t.value;n<0?t=t.left:n>0&&(t=t.right)}return null}indexOf(e){let t=0,n=this.root;for(;!n.isEmpty();){const s=this.comparator(e,n.key);if(s===0)return t+n.left.size;s<0?n=n.left:(t+=n.left.size+1,n=n.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal(((t,n)=>(e(t,n),!1)))}toString(){const e=[];return this.inorderTraversal(((t,n)=>(e.push(`${t}:${n}`),!1))),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new jn(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new jn(this.root,e,this.comparator,!1)}getReverseIterator(){return new jn(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new jn(this.root,e,this.comparator,!0)}}class jn{constructor(e,t,n,s){this.isReverse=s,this.nodeStack=[];let i=1;for(;!e.isEmpty();)if(i=t?n(e.key,t):1,t&&s&&(i*=-1),i<0)e=this.isReverse?e.left:e.right;else{if(i===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}}class Z{constructor(e,t,n,s,i){this.key=e,this.value=t,this.color=n??Z.RED,this.left=s??Z.EMPTY,this.right=i??Z.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,n,s,i){return new Z(e??this.key,t??this.value,n??this.color,s??this.left,i??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,n){let s=this;const i=n(e,s.key);return s=i<0?s.copy(null,null,null,s.left.insert(e,t,n),null):i===0?s.copy(null,t,null,null,null):s.copy(null,null,null,null,s.right.insert(e,t,n)),s.fixUp()}removeMin(){if(this.left.isEmpty())return Z.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let n,s=this;if(t(e,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(e,t),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),t(e,s.key)===0){if(s.right.isEmpty())return Z.EMPTY;n=s.right.min(),s=s.copy(n.key,n.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(e,t))}return s.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,Z.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,Z.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw I(43730,{key:this.key,value:this.value});if(this.right.isRed())throw I(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw I(27949);return e+(this.isRed()?0:1)}}Z.EMPTY=null,Z.RED=!0,Z.BLACK=!1;Z.EMPTY=new class{constructor(){this.size=0}get key(){throw I(57766)}get value(){throw I(16141)}get color(){throw I(16727)}get left(){throw I(29726)}get right(){throw I(36894)}copy(e,t,n,s,i){return this}insert(e,t,n){return new Z(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class F{constructor(e){this.comparator=e,this.data=new O(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal(((t,n)=>(e(t),!1)))}forEachInRange(e,t){const n=this.data.getIteratorFrom(e[0]);for(;n.hasNext();){const s=n.getNext();if(this.comparator(s.key,e[1])>=0)return;t(s.key)}}forEachWhile(e,t){let n;for(n=t!==void 0?this.data.getIteratorFrom(t):this.data.getIterator();n.hasNext();)if(!e(n.getNext().key))return}firstAfterOrEqual(e){const t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new Wi(this.data.getIterator())}getIteratorFrom(e){return new Wi(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach((n=>{t=t.add(n)})),t}isEqual(e){if(!(e instanceof F)||this.size!==e.size)return!1;const t=this.data.getIterator(),n=e.data.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=n.getNext().key;if(this.comparator(s,i)!==0)return!1}return!0}toArray(){const e=[];return this.forEach((t=>{e.push(t)})),e}toString(){const e=[];return this.forEach((t=>e.push(t))),"SortedSet("+e.toString()+")"}copy(e){const t=new F(this.comparator);return t.data=e,t}}class Wi{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}function pt(r){return r.hasNext()?r.getNext():void 0}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ue{constructor(e){this.fields=e,e.sort(U.comparator)}static empty(){return new ue([])}unionWith(e){let t=new F(U.comparator);for(const n of this.fields)t=t.add(n);for(const n of e)t=t.add(n);return new ue(t.toArray())}covers(e){for(const t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return bt(this.fields,e.fields,((t,n)=>t.isEqual(n)))}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Da extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class j{constructor(e){this.binaryString=e}static fromBase64String(e){const t=(function(s){try{return atob(s)}catch(i){throw typeof DOMException<"u"&&i instanceof DOMException?new Da("Invalid base64 string: "+i):i}})(e);return new j(t)}static fromUint8Array(e){const t=(function(s){let i="";for(let o=0;o<s.length;++o)i+=String.fromCharCode(s[o]);return i})(e);return new j(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return(function(t){return btoa(t)})(this.binaryString)}toUint8Array(){return(function(t){const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n})(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return V(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}j.EMPTY_BYTE_STRING=new j("");const xl=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Pe(r){if(v(!!r,39018),typeof r=="string"){let e=0;const t=xl.exec(r);if(v(!!t,46558,{timestamp:r}),t[1]){let s=t[1];s=(s+"000000000").substr(0,9),e=Number(s)}const n=new Date(r);return{seconds:Math.floor(n.getTime()/1e3),nanos:e}}return{seconds:L(r.seconds),nanos:L(r.nanos)}}function L(r){return typeof r=="number"?r:typeof r=="string"?Number(r):0}function Se(r){return typeof r=="string"?j.fromBase64String(r):j.fromUint8Array(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xa="server_timestamp",Na="__type__",ka="__previous_value__",Ma="__local_write_time__";function zs(r){var t,n;return((n=(((t=r==null?void 0:r.mapValue)==null?void 0:t.fields)||{})[Na])==null?void 0:n.stringValue)===xa}function Mr(r){const e=r.mapValue.fields[ka];return zs(e)?Mr(e):e}function En(r){const e=Pe(r.mapValue.fields[Ma].timestampValue);return new k(e.seconds,e.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nl{constructor(e,t,n,s,i,o,a,u,c,l){this.databaseId=e,this.appId=t,this.persistenceKey=n,this.host=s,this.ssl=i,this.forceLongPolling=o,this.autoDetectLongPolling=a,this.longPollingOptions=u,this.useFetchStreams=c,this.isUsingEmulator=l}}const An="(default)";class at{constructor(e,t){this.projectId=e,this.database=t||An}static empty(){return new at("","")}get isDefaultDatabase(){return this.database===An}isEqual(e){return e instanceof at&&e.projectId===this.projectId&&e.database===this.database}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ks="__type__",Fa="__max__",Me={mapValue:{fields:{__type__:{stringValue:Fa}}}},Gs="__vector__",Mt="value",tr={nullValue:"NULL_VALUE"};function Le(r){return"nullValue"in r?0:"booleanValue"in r?1:"integerValue"in r||"doubleValue"in r?2:"timestampValue"in r?3:"stringValue"in r?5:"bytesValue"in r?6:"referenceValue"in r?7:"geoPointValue"in r?8:"arrayValue"in r?9:"mapValue"in r?zs(r)?4:Oa(r)?9007199254740991:Fr(r)?10:11:I(28295,{value:r})}function we(r,e){if(r===e)return!0;const t=Le(r);if(t!==Le(e))return!1;switch(t){case 0:case 9007199254740991:return!0;case 1:return r.booleanValue===e.booleanValue;case 4:return En(r).isEqual(En(e));case 3:return(function(s,i){if(typeof s.timestampValue=="string"&&typeof i.timestampValue=="string"&&s.timestampValue.length===i.timestampValue.length)return s.timestampValue===i.timestampValue;const o=Pe(s.timestampValue),a=Pe(i.timestampValue);return o.seconds===a.seconds&&o.nanos===a.nanos})(r,e);case 5:return r.stringValue===e.stringValue;case 6:return(function(s,i){return Se(s.bytesValue).isEqual(Se(i.bytesValue))})(r,e);case 7:return r.referenceValue===e.referenceValue;case 8:return(function(s,i){return L(s.geoPointValue.latitude)===L(i.geoPointValue.latitude)&&L(s.geoPointValue.longitude)===L(i.geoPointValue.longitude)})(r,e);case 2:return(function(s,i){if("integerValue"in s&&"integerValue"in i)return L(s.integerValue)===L(i.integerValue);if("doubleValue"in s&&"doubleValue"in i){const o=L(s.doubleValue),a=L(i.doubleValue);return o===a?pn(o)===pn(a):isNaN(o)&&isNaN(a)}return!1})(r,e);case 9:return bt(r.arrayValue.values||[],e.arrayValue.values||[],we);case 10:case 11:return(function(s,i){const o=s.mapValue.fields||{},a=i.mapValue.fields||{};if(Qi(o)!==Qi(a))return!1;for(const u in o)if(o.hasOwnProperty(u)&&(a[u]===void 0||!we(o[u],a[u])))return!1;return!0})(r,e);default:return I(52216,{left:r})}}function wn(r,e){return(r.values||[]).find((t=>we(t,e)))!==void 0}function Ue(r,e){if(r===e)return 0;const t=Le(r),n=Le(e);if(t!==n)return V(t,n);switch(t){case 0:case 9007199254740991:return 0;case 1:return V(r.booleanValue,e.booleanValue);case 2:return(function(i,o){const a=L(i.integerValue||i.doubleValue),u=L(o.integerValue||o.doubleValue);return a<u?-1:a>u?1:a===u?0:isNaN(a)?isNaN(u)?0:-1:1})(r,e);case 3:return Hi(r.timestampValue,e.timestampValue);case 4:return Hi(En(r),En(e));case 5:return os(r.stringValue,e.stringValue);case 6:return(function(i,o){const a=Se(i),u=Se(o);return a.compareTo(u)})(r.bytesValue,e.bytesValue);case 7:return(function(i,o){const a=i.split("/"),u=o.split("/");for(let c=0;c<a.length&&c<u.length;c++){const l=V(a[c],u[c]);if(l!==0)return l}return V(a.length,u.length)})(r.referenceValue,e.referenceValue);case 8:return(function(i,o){const a=V(L(i.latitude),L(o.latitude));return a!==0?a:V(L(i.longitude),L(o.longitude))})(r.geoPointValue,e.geoPointValue);case 9:return Ji(r.arrayValue,e.arrayValue);case 10:return(function(i,o){var d,_,T,A;const a=i.fields||{},u=o.fields||{},c=(d=a[Mt])==null?void 0:d.arrayValue,l=(_=u[Mt])==null?void 0:_.arrayValue,h=V(((T=c==null?void 0:c.values)==null?void 0:T.length)||0,((A=l==null?void 0:l.values)==null?void 0:A.length)||0);return h!==0?h:Ji(c,l)})(r.mapValue,e.mapValue);case 11:return(function(i,o){if(i===Me.mapValue&&o===Me.mapValue)return 0;if(i===Me.mapValue)return 1;if(o===Me.mapValue)return-1;const a=i.fields||{},u=Object.keys(a),c=o.fields||{},l=Object.keys(c);u.sort(),l.sort();for(let h=0;h<u.length&&h<l.length;++h){const d=os(u[h],l[h]);if(d!==0)return d;const _=Ue(a[u[h]],c[l[h]]);if(_!==0)return _}return V(u.length,l.length)})(r.mapValue,e.mapValue);default:throw I(23264,{he:t})}}function Hi(r,e){if(typeof r=="string"&&typeof e=="string"&&r.length===e.length)return V(r,e);const t=Pe(r),n=Pe(e),s=V(t.seconds,n.seconds);return s!==0?s:V(t.nanos,n.nanos)}function Ji(r,e){const t=r.values||[],n=e.values||[];for(let s=0;s<t.length&&s<n.length;++s){const i=Ue(t[s],n[s]);if(i)return i}return V(t.length,n.length)}function Ft(r){return ds(r)}function ds(r){return"nullValue"in r?"null":"booleanValue"in r?""+r.booleanValue:"integerValue"in r?""+r.integerValue:"doubleValue"in r?""+r.doubleValue:"timestampValue"in r?(function(t){const n=Pe(t);return`time(${n.seconds},${n.nanos})`})(r.timestampValue):"stringValue"in r?r.stringValue:"bytesValue"in r?(function(t){return Se(t).toBase64()})(r.bytesValue):"referenceValue"in r?(function(t){return y.fromName(t).toString()})(r.referenceValue):"geoPointValue"in r?(function(t){return`geo(${t.latitude},${t.longitude})`})(r.geoPointValue):"arrayValue"in r?(function(t){let n="[",s=!0;for(const i of t.values||[])s?s=!1:n+=",",n+=ds(i);return n+"]"})(r.arrayValue):"mapValue"in r?(function(t){const n=Object.keys(t.fields||{}).sort();let s="{",i=!0;for(const o of n)i?i=!1:s+=",",s+=`${o}:${ds(t.fields[o])}`;return s+"}"})(r.mapValue):I(61005,{value:r})}function nr(r){switch(Le(r)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const e=Mr(r);return e?16+nr(e):16;case 5:return 2*r.stringValue.length;case 6:return Se(r.bytesValue).approximateByteSize();case 7:return r.referenceValue.length;case 9:return(function(n){return(n.values||[]).reduce(((s,i)=>s+nr(i)),0)})(r.arrayValue);case 10:case 11:return(function(n){let s=0;return Ge(n.fields,((i,o)=>{s+=i.length+nr(o)})),s})(r.mapValue);default:throw I(13486,{value:r})}}function vn(r,e){return{referenceValue:`projects/${r.projectId}/databases/${r.database}/documents/${e.path.canonicalString()}`}}function fs(r){return!!r&&"integerValue"in r}function Rn(r){return!!r&&"arrayValue"in r}function Yi(r){return!!r&&"nullValue"in r}function Xi(r){return!!r&&"doubleValue"in r&&isNaN(Number(r.doubleValue))}function rr(r){return!!r&&"mapValue"in r}function Fr(r){var t,n;return((n=(((t=r==null?void 0:r.mapValue)==null?void 0:t.fields)||{})[Ks])==null?void 0:n.stringValue)===Gs}function hn(r){if(r.geoPointValue)return{geoPointValue:{...r.geoPointValue}};if(r.timestampValue&&typeof r.timestampValue=="object")return{timestampValue:{...r.timestampValue}};if(r.mapValue){const e={mapValue:{fields:{}}};return Ge(r.mapValue.fields,((t,n)=>e.mapValue.fields[t]=hn(n))),e}if(r.arrayValue){const e={arrayValue:{values:[]}};for(let t=0;t<(r.arrayValue.values||[]).length;++t)e.arrayValue.values[t]=hn(r.arrayValue.values[t]);return e}return{...r}}function Oa(r){return(((r.mapValue||{}).fields||{}).__type__||{}).stringValue===Fa}const La={mapValue:{fields:{[Ks]:{stringValue:Gs},[Mt]:{arrayValue:{}}}}};function kl(r){return"nullValue"in r?tr:"booleanValue"in r?{booleanValue:!1}:"integerValue"in r||"doubleValue"in r?{doubleValue:NaN}:"timestampValue"in r?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"stringValue"in r?{stringValue:""}:"bytesValue"in r?{bytesValue:""}:"referenceValue"in r?vn(at.empty(),y.empty()):"geoPointValue"in r?{geoPointValue:{latitude:-90,longitude:-180}}:"arrayValue"in r?{arrayValue:{}}:"mapValue"in r?Fr(r)?La:{mapValue:{}}:I(35942,{value:r})}function Ml(r){return"nullValue"in r?{booleanValue:!1}:"booleanValue"in r?{doubleValue:NaN}:"integerValue"in r||"doubleValue"in r?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"timestampValue"in r?{stringValue:""}:"stringValue"in r?{bytesValue:""}:"bytesValue"in r?vn(at.empty(),y.empty()):"referenceValue"in r?{geoPointValue:{latitude:-90,longitude:-180}}:"geoPointValue"in r?{arrayValue:{}}:"arrayValue"in r?La:"mapValue"in r?Fr(r)?{mapValue:{}}:Me:I(61959,{value:r})}function Zi(r,e){const t=Ue(r.value,e.value);return t!==0?t:r.inclusive&&!e.inclusive?-1:!r.inclusive&&e.inclusive?1:0}function eo(r,e){const t=Ue(r.value,e.value);return t!==0?t:r.inclusive&&!e.inclusive?1:!r.inclusive&&e.inclusive?-1:0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class re{constructor(e){this.value=e}static empty(){return new re({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let n=0;n<e.length-1;++n)if(t=(t.mapValue.fields||{})[e.get(n)],!rr(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=hn(t)}setAll(e){let t=U.emptyPath(),n={},s=[];e.forEach(((o,a)=>{if(!t.isImmediateParentOf(a)){const u=this.getFieldsMap(t);this.applyChanges(u,n,s),n={},s=[],t=a.popLast()}o?n[a.lastSegment()]=hn(o):s.push(a.lastSegment())}));const i=this.getFieldsMap(t);this.applyChanges(i,n,s)}delete(e){const t=this.field(e.popLast());rr(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return we(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let n=0;n<e.length;++n){let s=t.mapValue.fields[e.get(n)];rr(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},t.mapValue.fields[e.get(n)]=s),t=s}return t.mapValue.fields}applyChanges(e,t,n){Ge(t,((s,i)=>e[s]=i));for(const s of n)delete e[s]}clone(){return new re(hn(this.value))}}function Ua(r){const e=[];return Ge(r.fields,((t,n)=>{const s=new U([t]);if(rr(n)){const i=Ua(n.mapValue).fields;if(i.length===0)e.push(s);else for(const o of i)e.push(s.child(o))}else e.push(s)})),new ue(e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class z{constructor(e,t,n,s,i,o,a){this.key=e,this.documentType=t,this.version=n,this.readTime=s,this.createTime=i,this.data=o,this.documentState=a}static newInvalidDocument(e){return new z(e,0,R.min(),R.min(),R.min(),re.empty(),0)}static newFoundDocument(e,t,n,s){return new z(e,1,t,R.min(),n,s,0)}static newNoDocument(e,t){return new z(e,2,t,R.min(),R.min(),re.empty(),0)}static newUnknownDocument(e,t){return new z(e,3,t,R.min(),R.min(),re.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual(R.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=re.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=re.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=R.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof z&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new z(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ot{constructor(e,t){this.position=e,this.inclusive=t}}function to(r,e,t){let n=0;for(let s=0;s<r.position.length;s++){const i=e[s],o=r.position[s];if(i.field.isKeyField()?n=y.comparator(y.fromName(o.referenceValue),t.key):n=Ue(o,t.data.field(i.field)),i.dir==="desc"&&(n*=-1),n!==0)break}return n}function no(r,e){if(r===null)return e===null;if(e===null||r.inclusive!==e.inclusive||r.position.length!==e.position.length)return!1;for(let t=0;t<r.position.length;t++)if(!we(r.position[t],e.position[t]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mr{constructor(e,t="asc"){this.field=e,this.dir=t}}function Fl(r,e){return r.dir===e.dir&&r.field.isEqual(e.field)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qa{}class C extends qa{constructor(e,t,n){super(),this.field=e,this.op=t,this.value=n}static create(e,t,n){return e.isKeyField()?t==="in"||t==="not-in"?this.createKeyFieldInFilter(e,t,n):new Ol(e,t,n):t==="array-contains"?new ql(e,n):t==="in"?new ja(e,n):t==="not-in"?new Bl(e,n):t==="array-contains-any"?new zl(e,n):new C(e,t,n)}static createKeyFieldInFilter(e,t,n){return t==="in"?new Ll(e,n):new Ul(e,n)}matches(e){const t=e.data.field(this.field);return this.op==="!="?t!==null&&t.nullValue===void 0&&this.matchesComparison(Ue(t,this.value)):t!==null&&Le(this.value)===Le(t)&&this.matchesComparison(Ue(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return I(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class M extends qa{constructor(e,t){super(),this.filters=e,this.op=t,this.Pe=null}static create(e,t){return new M(e,t)}matches(e){return Lt(this)?this.filters.find((t=>!t.matches(e)))===void 0:this.filters.find((t=>t.matches(e)))!==void 0}getFlattenedFilters(){return this.Pe!==null||(this.Pe=this.filters.reduce(((e,t)=>e.concat(t.getFlattenedFilters())),[])),this.Pe}getFilters(){return Object.assign([],this.filters)}}function Lt(r){return r.op==="and"}function ms(r){return r.op==="or"}function $s(r){return Ba(r)&&Lt(r)}function Ba(r){for(const e of r.filters)if(e instanceof M)return!1;return!0}function _s(r){if(r instanceof C)return r.field.canonicalString()+r.op.toString()+Ft(r.value);if($s(r))return r.filters.map((e=>_s(e))).join(",");{const e=r.filters.map((t=>_s(t))).join(",");return`${r.op}(${e})`}}function za(r,e){return r instanceof C?(function(n,s){return s instanceof C&&n.op===s.op&&n.field.isEqual(s.field)&&we(n.value,s.value)})(r,e):r instanceof M?(function(n,s){return s instanceof M&&n.op===s.op&&n.filters.length===s.filters.length?n.filters.reduce(((i,o,a)=>i&&za(o,s.filters[a])),!0):!1})(r,e):void I(19439)}function Ka(r,e){const t=r.filters.concat(e);return M.create(t,r.op)}function Ga(r){return r instanceof C?(function(t){return`${t.field.canonicalString()} ${t.op} ${Ft(t.value)}`})(r):r instanceof M?(function(t){return t.op.toString()+" {"+t.getFilters().map(Ga).join(" ,")+"}"})(r):"Filter"}class Ol extends C{constructor(e,t,n){super(e,t,n),this.key=y.fromName(n.referenceValue)}matches(e){const t=y.comparator(e.key,this.key);return this.matchesComparison(t)}}class Ll extends C{constructor(e,t){super(e,"in",t),this.keys=$a("in",t)}matches(e){return this.keys.some((t=>t.isEqual(e.key)))}}class Ul extends C{constructor(e,t){super(e,"not-in",t),this.keys=$a("not-in",t)}matches(e){return!this.keys.some((t=>t.isEqual(e.key)))}}function $a(r,e){var t;return(((t=e.arrayValue)==null?void 0:t.values)||[]).map((n=>y.fromName(n.referenceValue)))}class ql extends C{constructor(e,t){super(e,"array-contains",t)}matches(e){const t=e.data.field(this.field);return Rn(t)&&wn(t.arrayValue,this.value)}}class ja extends C{constructor(e,t){super(e,"in",t)}matches(e){const t=e.data.field(this.field);return t!==null&&wn(this.value.arrayValue,t)}}class Bl extends C{constructor(e,t){super(e,"not-in",t)}matches(e){if(wn(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const t=e.data.field(this.field);return t!==null&&t.nullValue===void 0&&!wn(this.value.arrayValue,t)}}class zl extends C{constructor(e,t){super(e,"array-contains-any",t)}matches(e){const t=e.data.field(this.field);return!(!Rn(t)||!t.arrayValue.values)&&t.arrayValue.values.some((n=>wn(this.value.arrayValue,n)))}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kl{constructor(e,t=null,n=[],s=[],i=null,o=null,a=null){this.path=e,this.collectionGroup=t,this.orderBy=n,this.filters=s,this.limit=i,this.startAt=o,this.endAt=a,this.Te=null}}function gs(r,e=null,t=[],n=[],s=null,i=null,o=null){return new Kl(r,e,t,n,s,i,o)}function ut(r){const e=w(r);if(e.Te===null){let t=e.path.canonicalString();e.collectionGroup!==null&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map((n=>_s(n))).join(","),t+="|ob:",t+=e.orderBy.map((n=>(function(i){return i.field.canonicalString()+i.dir})(n))).join(","),Dr(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map((n=>Ft(n))).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map((n=>Ft(n))).join(",")),e.Te=t}return e.Te}function xn(r,e){if(r.limit!==e.limit||r.orderBy.length!==e.orderBy.length)return!1;for(let t=0;t<r.orderBy.length;t++)if(!Fl(r.orderBy[t],e.orderBy[t]))return!1;if(r.filters.length!==e.filters.length)return!1;for(let t=0;t<r.filters.length;t++)if(!za(r.filters[t],e.filters[t]))return!1;return r.collectionGroup===e.collectionGroup&&!!r.path.isEqual(e.path)&&!!no(r.startAt,e.startAt)&&no(r.endAt,e.endAt)}function _r(r){return y.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}function gr(r,e){return r.filters.filter((t=>t instanceof C&&t.field.isEqual(e)))}function ro(r,e,t){let n=tr,s=!0;for(const i of gr(r,e)){let o=tr,a=!0;switch(i.op){case"<":case"<=":o=kl(i.value);break;case"==":case"in":case">=":o=i.value;break;case">":o=i.value,a=!1;break;case"!=":case"not-in":o=tr}Zi({value:n,inclusive:s},{value:o,inclusive:a})<0&&(n=o,s=a)}if(t!==null){for(let i=0;i<r.orderBy.length;++i)if(r.orderBy[i].field.isEqual(e)){const o=t.position[i];Zi({value:n,inclusive:s},{value:o,inclusive:t.inclusive})<0&&(n=o,s=t.inclusive);break}}return{value:n,inclusive:s}}function so(r,e,t){let n=Me,s=!0;for(const i of gr(r,e)){let o=Me,a=!0;switch(i.op){case">=":case">":o=Ml(i.value),a=!1;break;case"==":case"in":case"<=":o=i.value;break;case"<":o=i.value,a=!1;break;case"!=":case"not-in":o=Me}eo({value:n,inclusive:s},{value:o,inclusive:a})>0&&(n=o,s=a)}if(t!==null){for(let i=0;i<r.orderBy.length;++i)if(r.orderBy[i].field.isEqual(e)){const o=t.position[i];eo({value:n,inclusive:s},{value:o,inclusive:t.inclusive})>0&&(n=o,s=t.inclusive);break}}return{value:n,inclusive:s}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nn{constructor(e,t=null,n=[],s=[],i=null,o="F",a=null,u=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=n,this.filters=s,this.limit=i,this.limitType=o,this.startAt=a,this.endAt=u,this.Ie=null,this.Ee=null,this.de=null,this.startAt,this.endAt}}function Qa(r,e,t,n,s,i,o,a){return new Nn(r,e,t,n,s,i,o,a)}function kn(r){return new Nn(r)}function io(r){return r.filters.length===0&&r.limit===null&&r.startAt==null&&r.endAt==null&&(r.explicitOrderBy.length===0||r.explicitOrderBy.length===1&&r.explicitOrderBy[0].field.isKeyField())}function Wa(r){return r.collectionGroup!==null}function dn(r){const e=w(r);if(e.Ie===null){e.Ie=[];const t=new Set;for(const i of e.explicitOrderBy)e.Ie.push(i),t.add(i.field.canonicalString());const n=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(o){let a=new F(U.comparator);return o.filters.forEach((u=>{u.getFlattenedFilters().forEach((c=>{c.isInequality()&&(a=a.add(c.field))}))})),a})(e).forEach((i=>{t.has(i.canonicalString())||i.isKeyField()||e.Ie.push(new mr(i,n))})),t.has(U.keyField().canonicalString())||e.Ie.push(new mr(U.keyField(),n))}return e.Ie}function he(r){const e=w(r);return e.Ee||(e.Ee=Gl(e,dn(r))),e.Ee}function Gl(r,e){if(r.limitType==="F")return gs(r.path,r.collectionGroup,e,r.filters,r.limit,r.startAt,r.endAt);{e=e.map((s=>{const i=s.dir==="desc"?"asc":"desc";return new mr(s.field,i)}));const t=r.endAt?new Ot(r.endAt.position,r.endAt.inclusive):null,n=r.startAt?new Ot(r.startAt.position,r.startAt.inclusive):null;return gs(r.path,r.collectionGroup,e,r.filters,r.limit,t,n)}}function ps(r,e){const t=r.filters.concat([e]);return new Nn(r.path,r.collectionGroup,r.explicitOrderBy.slice(),t,r.limit,r.limitType,r.startAt,r.endAt)}function ys(r,e,t){return new Nn(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),e,t,r.startAt,r.endAt)}function Or(r,e){return xn(he(r),he(e))&&r.limitType===e.limitType}function Ha(r){return`${ut(he(r))}|lt:${r.limitType}`}function wt(r){return`Query(target=${(function(t){let n=t.path.canonicalString();return t.collectionGroup!==null&&(n+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(n+=`, filters: [${t.filters.map((s=>Ga(s))).join(", ")}]`),Dr(t.limit)||(n+=", limit: "+t.limit),t.orderBy.length>0&&(n+=`, orderBy: [${t.orderBy.map((s=>(function(o){return`${o.field.canonicalString()} (${o.dir})`})(s))).join(", ")}]`),t.startAt&&(n+=", startAt: ",n+=t.startAt.inclusive?"b:":"a:",n+=t.startAt.position.map((s=>Ft(s))).join(",")),t.endAt&&(n+=", endAt: ",n+=t.endAt.inclusive?"a:":"b:",n+=t.endAt.position.map((s=>Ft(s))).join(",")),`Target(${n})`})(he(r))}; limitType=${r.limitType})`}function Mn(r,e){return e.isFoundDocument()&&(function(n,s){const i=s.key.path;return n.collectionGroup!==null?s.key.hasCollectionId(n.collectionGroup)&&n.path.isPrefixOf(i):y.isDocumentKey(n.path)?n.path.isEqual(i):n.path.isImmediateParentOf(i)})(r,e)&&(function(n,s){for(const i of dn(n))if(!i.field.isKeyField()&&s.data.field(i.field)===null)return!1;return!0})(r,e)&&(function(n,s){for(const i of n.filters)if(!i.matches(s))return!1;return!0})(r,e)&&(function(n,s){return!(n.startAt&&!(function(o,a,u){const c=to(o,a,u);return o.inclusive?c<=0:c<0})(n.startAt,dn(n),s)||n.endAt&&!(function(o,a,u){const c=to(o,a,u);return o.inclusive?c>=0:c>0})(n.endAt,dn(n),s))})(r,e)}function Ja(r){return r.collectionGroup||(r.path.length%2==1?r.path.lastSegment():r.path.get(r.path.length-2))}function Ya(r){return(e,t)=>{let n=!1;for(const s of dn(r)){const i=$l(s,e,t);if(i!==0)return i;n=n||s.field.isKeyField()}return 0}}function $l(r,e,t){const n=r.field.isKeyField()?y.comparator(e.key,t.key):(function(i,o,a){const u=o.data.field(i),c=a.data.field(i);return u!==null&&c!==null?Ue(u,c):I(42886)})(r.field,e,t);switch(r.dir){case"asc":return n;case"desc":return-1*n;default:return I(19790,{direction:r.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class be{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){const t=this.mapKeyFn(e),n=this.inner[t];if(n!==void 0){for(const[s,i]of n)if(this.equalsFn(s,e))return i}}has(e){return this.get(e)!==void 0}set(e,t){const n=this.mapKeyFn(e),s=this.inner[n];if(s===void 0)return this.inner[n]=[[e,t]],void this.innerSize++;for(let i=0;i<s.length;i++)if(this.equalsFn(s[i][0],e))return void(s[i]=[e,t]);s.push([e,t]),this.innerSize++}delete(e){const t=this.mapKeyFn(e),n=this.inner[t];if(n===void 0)return!1;for(let s=0;s<n.length;s++)if(this.equalsFn(n[s][0],e))return n.length===1?delete this.inner[t]:n.splice(s,1),this.innerSize--,!0;return!1}forEach(e){Ge(this.inner,((t,n)=>{for(const[s,i]of n)e(s,i)}))}isEmpty(){return Ca(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jl=new O(y.comparator);function le(){return jl}const Xa=new O(y.comparator);function nn(...r){let e=Xa;for(const t of r)e=e.insert(t.key,t);return e}function Za(r){let e=Xa;return r.forEach(((t,n)=>e=e.insert(t,n.overlayedDocument))),e}function Ie(){return fn()}function eu(){return fn()}function fn(){return new be((r=>r.toString()),((r,e)=>r.isEqual(e)))}const Ql=new O(y.comparator),Wl=new F(y.comparator);function S(...r){let e=Wl;for(const t of r)e=e.add(t);return e}const Hl=new F(V);function js(){return Hl}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Qs(r,e){if(r.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:pn(e)?"-0":e}}function tu(r){return{integerValue:""+r}}function Jl(r,e){return Ia(e)?tu(e):Qs(r,e)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lr{constructor(){this._=void 0}}function Yl(r,e,t){return r instanceof Vn?(function(s,i){const o={fields:{[Na]:{stringValue:xa},[Ma]:{timestampValue:{seconds:s.seconds,nanos:s.nanoseconds}}}};return i&&zs(i)&&(i=Mr(i)),i&&(o.fields[ka]=i),{mapValue:o}})(t,e):r instanceof Ut?ru(r,e):r instanceof qt?su(r,e):(function(s,i){const o=nu(s,i),a=oo(o)+oo(s.Ae);return fs(o)&&fs(s.Ae)?tu(a):Qs(s.serializer,a)})(r,e)}function Xl(r,e,t){return r instanceof Ut?ru(r,e):r instanceof qt?su(r,e):t}function nu(r,e){return r instanceof Pn?(function(n){return fs(n)||(function(i){return!!i&&"doubleValue"in i})(n)})(e)?e:{integerValue:0}:null}class Vn extends Lr{}class Ut extends Lr{constructor(e){super(),this.elements=e}}function ru(r,e){const t=iu(e);for(const n of r.elements)t.some((s=>we(s,n)))||t.push(n);return{arrayValue:{values:t}}}class qt extends Lr{constructor(e){super(),this.elements=e}}function su(r,e){let t=iu(e);for(const n of r.elements)t=t.filter((s=>!we(s,n)));return{arrayValue:{values:t}}}class Pn extends Lr{constructor(e,t){super(),this.serializer=e,this.Ae=t}}function oo(r){return L(r.integerValue||r.doubleValue)}function iu(r){return Rn(r)&&r.arrayValue.values?r.arrayValue.values.slice():[]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zl{constructor(e,t){this.field=e,this.transform=t}}function eh(r,e){return r.field.isEqual(e.field)&&(function(n,s){return n instanceof Ut&&s instanceof Ut||n instanceof qt&&s instanceof qt?bt(n.elements,s.elements,we):n instanceof Pn&&s instanceof Pn?we(n.Ae,s.Ae):n instanceof Vn&&s instanceof Vn})(r.transform,e.transform)}class th{constructor(e,t){this.version=e,this.transformResults=t}}class H{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new H}static exists(e){return new H(void 0,e)}static updateTime(e){return new H(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function sr(r,e){return r.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(r.updateTime):r.exists===void 0||r.exists===e.isFoundDocument()}class Ur{}function ou(r,e){if(!r.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return r.isNoDocument()?new Fn(r.key,H.none()):new Qt(r.key,r.data,H.none());{const t=r.data,n=re.empty();let s=new F(U.comparator);for(let i of e.fields)if(!s.has(i)){let o=t.field(i);o===null&&i.length>1&&(i=i.popLast(),o=t.field(i)),o===null?n.delete(i):n.set(i,o),s=s.add(i)}return new Ce(r.key,n,new ue(s.toArray()),H.none())}}function nh(r,e,t){r instanceof Qt?(function(s,i,o){const a=s.value.clone(),u=uo(s.fieldTransforms,i,o.transformResults);a.setAll(u),i.convertToFoundDocument(o.version,a).setHasCommittedMutations()})(r,e,t):r instanceof Ce?(function(s,i,o){if(!sr(s.precondition,i))return void i.convertToUnknownDocument(o.version);const a=uo(s.fieldTransforms,i,o.transformResults),u=i.data;u.setAll(au(s)),u.setAll(a),i.convertToFoundDocument(o.version,u).setHasCommittedMutations()})(r,e,t):(function(s,i,o){i.convertToNoDocument(o.version).setHasCommittedMutations()})(0,e,t)}function mn(r,e,t,n){return r instanceof Qt?(function(i,o,a,u){if(!sr(i.precondition,o))return a;const c=i.value.clone(),l=co(i.fieldTransforms,u,o);return c.setAll(l),o.convertToFoundDocument(o.version,c).setHasLocalMutations(),null})(r,e,t,n):r instanceof Ce?(function(i,o,a,u){if(!sr(i.precondition,o))return a;const c=co(i.fieldTransforms,u,o),l=o.data;return l.setAll(au(i)),l.setAll(c),o.convertToFoundDocument(o.version,l).setHasLocalMutations(),a===null?null:a.unionWith(i.fieldMask.fields).unionWith(i.fieldTransforms.map((h=>h.field)))})(r,e,t,n):(function(i,o,a){return sr(i.precondition,o)?(o.convertToNoDocument(o.version).setHasLocalMutations(),null):a})(r,e,t)}function rh(r,e){let t=null;for(const n of r.fieldTransforms){const s=e.data.field(n.field),i=nu(n.transform,s||null);i!=null&&(t===null&&(t=re.empty()),t.set(n.field,i))}return t||null}function ao(r,e){return r.type===e.type&&!!r.key.isEqual(e.key)&&!!r.precondition.isEqual(e.precondition)&&!!(function(n,s){return n===void 0&&s===void 0||!(!n||!s)&&bt(n,s,((i,o)=>eh(i,o)))})(r.fieldTransforms,e.fieldTransforms)&&(r.type===0?r.value.isEqual(e.value):r.type!==1||r.data.isEqual(e.data)&&r.fieldMask.isEqual(e.fieldMask))}class Qt extends Ur{constructor(e,t,n,s=[]){super(),this.key=e,this.value=t,this.precondition=n,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}}class Ce extends Ur{constructor(e,t,n,s,i=[]){super(),this.key=e,this.data=t,this.fieldMask=n,this.precondition=s,this.fieldTransforms=i,this.type=1}getFieldMask(){return this.fieldMask}}function au(r){const e=new Map;return r.fieldMask.fields.forEach((t=>{if(!t.isEmpty()){const n=r.data.field(t);e.set(t,n)}})),e}function uo(r,e,t){const n=new Map;v(r.length===t.length,32656,{Re:t.length,Ve:r.length});for(let s=0;s<t.length;s++){const i=r[s],o=i.transform,a=e.data.field(i.field);n.set(i.field,Xl(o,a,t[s]))}return n}function co(r,e,t){const n=new Map;for(const s of r){const i=s.transform,o=t.data.field(s.field);n.set(s.field,Yl(i,o,e))}return n}class Fn extends Ur{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class uu extends Ur{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ws{constructor(e,t,n,s){this.batchId=e,this.localWriteTime=t,this.baseMutations=n,this.mutations=s}applyToRemoteDocument(e,t){const n=t.mutationResults;for(let s=0;s<this.mutations.length;s++){const i=this.mutations[s];i.key.isEqual(e.key)&&nh(i,e,n[s])}}applyToLocalView(e,t){for(const n of this.baseMutations)n.key.isEqual(e.key)&&(t=mn(n,e,t,this.localWriteTime));for(const n of this.mutations)n.key.isEqual(e.key)&&(t=mn(n,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){const n=eu();return this.mutations.forEach((s=>{const i=e.get(s.key),o=i.overlayedDocument;let a=this.applyToLocalView(o,i.mutatedFields);a=t.has(s.key)?null:a;const u=ou(o,a);u!==null&&n.set(s.key,u),o.isValidDocument()||o.convertToNoDocument(R.min())})),n}keys(){return this.mutations.reduce(((e,t)=>e.add(t.key)),S())}isEqual(e){return this.batchId===e.batchId&&bt(this.mutations,e.mutations,((t,n)=>ao(t,n)))&&bt(this.baseMutations,e.baseMutations,((t,n)=>ao(t,n)))}}class Hs{constructor(e,t,n,s){this.batch=e,this.commitVersion=t,this.mutationResults=n,this.docVersions=s}static from(e,t,n){v(e.mutations.length===n.length,58842,{me:e.mutations.length,fe:n.length});let s=(function(){return Ql})();const i=e.mutations;for(let o=0;o<i.length;o++)s=s.insert(i[o].key,n[o].version);return new Hs(e,t,n,s)}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Js{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sh{constructor(e,t){this.count=e,this.unchangedNames=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Q,D;function ih(r){switch(r){case m.OK:return I(64938);case m.CANCELLED:case m.UNKNOWN:case m.DEADLINE_EXCEEDED:case m.RESOURCE_EXHAUSTED:case m.INTERNAL:case m.UNAVAILABLE:case m.UNAUTHENTICATED:return!1;case m.INVALID_ARGUMENT:case m.NOT_FOUND:case m.ALREADY_EXISTS:case m.PERMISSION_DENIED:case m.FAILED_PRECONDITION:case m.ABORTED:case m.OUT_OF_RANGE:case m.UNIMPLEMENTED:case m.DATA_LOSS:return!0;default:return I(15467,{code:r})}}function cu(r){if(r===void 0)return $("GRPC error has no .code"),m.UNKNOWN;switch(r){case Q.OK:return m.OK;case Q.CANCELLED:return m.CANCELLED;case Q.UNKNOWN:return m.UNKNOWN;case Q.DEADLINE_EXCEEDED:return m.DEADLINE_EXCEEDED;case Q.RESOURCE_EXHAUSTED:return m.RESOURCE_EXHAUSTED;case Q.INTERNAL:return m.INTERNAL;case Q.UNAVAILABLE:return m.UNAVAILABLE;case Q.UNAUTHENTICATED:return m.UNAUTHENTICATED;case Q.INVALID_ARGUMENT:return m.INVALID_ARGUMENT;case Q.NOT_FOUND:return m.NOT_FOUND;case Q.ALREADY_EXISTS:return m.ALREADY_EXISTS;case Q.PERMISSION_DENIED:return m.PERMISSION_DENIED;case Q.FAILED_PRECONDITION:return m.FAILED_PRECONDITION;case Q.ABORTED:return m.ABORTED;case Q.OUT_OF_RANGE:return m.OUT_OF_RANGE;case Q.UNIMPLEMENTED:return m.UNIMPLEMENTED;case Q.DATA_LOSS:return m.DATA_LOSS;default:return I(39323,{code:r})}}(D=Q||(Q={}))[D.OK=0]="OK",D[D.CANCELLED=1]="CANCELLED",D[D.UNKNOWN=2]="UNKNOWN",D[D.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",D[D.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",D[D.NOT_FOUND=5]="NOT_FOUND",D[D.ALREADY_EXISTS=6]="ALREADY_EXISTS",D[D.PERMISSION_DENIED=7]="PERMISSION_DENIED",D[D.UNAUTHENTICATED=16]="UNAUTHENTICATED",D[D.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",D[D.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",D[D.ABORTED=10]="ABORTED",D[D.OUT_OF_RANGE=11]="OUT_OF_RANGE",D[D.UNIMPLEMENTED=12]="UNIMPLEMENTED",D[D.INTERNAL=13]="INTERNAL",D[D.UNAVAILABLE=14]="UNAVAILABLE",D[D.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function oh(){return new TextEncoder}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ah=new et([4294967295,4294967295],0);function lo(r){const e=oh().encode(r),t=new Gc;return t.update(e),new Uint8Array(t.digest())}function ho(r){const e=new DataView(r.buffer),t=e.getUint32(0,!0),n=e.getUint32(4,!0),s=e.getUint32(8,!0),i=e.getUint32(12,!0);return[new et([t,n],0),new et([s,i],0)]}class Ys{constructor(e,t,n){if(this.bitmap=e,this.padding=t,this.hashCount=n,t<0||t>=8)throw new rn(`Invalid padding: ${t}`);if(n<0)throw new rn(`Invalid hash count: ${n}`);if(e.length>0&&this.hashCount===0)throw new rn(`Invalid hash count: ${n}`);if(e.length===0&&t!==0)throw new rn(`Invalid padding when bitmap length is 0: ${t}`);this.ge=8*e.length-t,this.pe=et.fromNumber(this.ge)}ye(e,t,n){let s=e.add(t.multiply(et.fromNumber(n)));return s.compare(ah)===1&&(s=new et([s.getBits(0),s.getBits(1)],0)),s.modulo(this.pe).toNumber()}we(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(this.ge===0)return!1;const t=lo(e),[n,s]=ho(t);for(let i=0;i<this.hashCount;i++){const o=this.ye(n,s,i);if(!this.we(o))return!1}return!0}static create(e,t,n){const s=e%8==0?0:8-e%8,i=new Uint8Array(Math.ceil(e/8)),o=new Ys(i,s,t);return n.forEach((a=>o.insert(a))),o}insert(e){if(this.ge===0)return;const t=lo(e),[n,s]=ho(t);for(let i=0;i<this.hashCount;i++){const o=this.ye(n,s,i);this.Se(o)}}Se(e){const t=Math.floor(e/8),n=e%8;this.bitmap[t]|=1<<n}}class rn extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class On{constructor(e,t,n,s,i){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=n,this.documentUpdates=s,this.resolvedLimboDocuments=i}static createSynthesizedRemoteEventForCurrentChange(e,t,n){const s=new Map;return s.set(e,Ln.createSynthesizedTargetChangeForCurrentChange(e,t,n)),new On(R.min(),s,new O(V),le(),S())}}class Ln{constructor(e,t,n,s,i){this.resumeToken=e,this.current=t,this.addedDocuments=n,this.modifiedDocuments=s,this.removedDocuments=i}static createSynthesizedTargetChangeForCurrentChange(e,t,n){return new Ln(n,t,S(),S(),S())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ir{constructor(e,t,n,s){this.be=e,this.removedTargetIds=t,this.key=n,this.De=s}}class lu{constructor(e,t){this.targetId=e,this.Ce=t}}class hu{constructor(e,t,n=j.EMPTY_BYTE_STRING,s=null){this.state=e,this.targetIds=t,this.resumeToken=n,this.cause=s}}class fo{constructor(){this.ve=0,this.Fe=mo(),this.Me=j.EMPTY_BYTE_STRING,this.xe=!1,this.Oe=!0}get current(){return this.xe}get resumeToken(){return this.Me}get Ne(){return this.ve!==0}get Be(){return this.Oe}Le(e){e.approximateByteSize()>0&&(this.Oe=!0,this.Me=e)}ke(){let e=S(),t=S(),n=S();return this.Fe.forEach(((s,i)=>{switch(i){case 0:e=e.add(s);break;case 2:t=t.add(s);break;case 1:n=n.add(s);break;default:I(38017,{changeType:i})}})),new Ln(this.Me,this.xe,e,t,n)}qe(){this.Oe=!1,this.Fe=mo()}Qe(e,t){this.Oe=!0,this.Fe=this.Fe.insert(e,t)}$e(e){this.Oe=!0,this.Fe=this.Fe.remove(e)}Ue(){this.ve+=1}Ke(){this.ve-=1,v(this.ve>=0,3241,{ve:this.ve})}We(){this.Oe=!0,this.xe=!0}}class uh{constructor(e){this.Ge=e,this.ze=new Map,this.je=le(),this.Je=Qn(),this.He=Qn(),this.Ye=new O(V)}Ze(e){for(const t of e.be)e.De&&e.De.isFoundDocument()?this.Xe(t,e.De):this.et(t,e.key,e.De);for(const t of e.removedTargetIds)this.et(t,e.key,e.De)}tt(e){this.forEachTarget(e,(t=>{const n=this.nt(t);switch(e.state){case 0:this.rt(t)&&n.Le(e.resumeToken);break;case 1:n.Ke(),n.Ne||n.qe(),n.Le(e.resumeToken);break;case 2:n.Ke(),n.Ne||this.removeTarget(t);break;case 3:this.rt(t)&&(n.We(),n.Le(e.resumeToken));break;case 4:this.rt(t)&&(this.it(t),n.Le(e.resumeToken));break;default:I(56790,{state:e.state})}}))}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.ze.forEach(((n,s)=>{this.rt(s)&&t(s)}))}st(e){const t=e.targetId,n=e.Ce.count,s=this.ot(t);if(s){const i=s.target;if(_r(i))if(n===0){const o=new y(i.path);this.et(t,o,z.newNoDocument(o,R.min()))}else v(n===1,20013,{expectedCount:n});else{const o=this._t(t);if(o!==n){const a=this.ut(e),u=a?this.ct(a,e,o):1;if(u!==0){this.it(t);const c=u===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Ye=this.Ye.insert(t,c)}}}}}ut(e){const t=e.Ce.unchangedNames;if(!t||!t.bits)return null;const{bits:{bitmap:n="",padding:s=0},hashCount:i=0}=t;let o,a;try{o=Se(n).toUint8Array()}catch(u){if(u instanceof Da)return St("Decoding the base64 bloom filter in existence filter failed ("+u.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw u}try{a=new Ys(o,s,i)}catch(u){return St(u instanceof rn?"BloomFilter error: ":"Applying bloom filter failed: ",u),null}return a.ge===0?null:a}ct(e,t,n){return t.Ce.count===n-this.Pt(e,t.targetId)?0:2}Pt(e,t){const n=this.Ge.getRemoteKeysForTarget(t);let s=0;return n.forEach((i=>{const o=this.Ge.ht(),a=`projects/${o.projectId}/databases/${o.database}/documents/${i.path.canonicalString()}`;e.mightContain(a)||(this.et(t,i,null),s++)})),s}Tt(e){const t=new Map;this.ze.forEach(((i,o)=>{const a=this.ot(o);if(a){if(i.current&&_r(a.target)){const u=new y(a.target.path);this.It(u).has(o)||this.Et(o,u)||this.et(o,u,z.newNoDocument(u,e))}i.Be&&(t.set(o,i.ke()),i.qe())}}));let n=S();this.He.forEach(((i,o)=>{let a=!0;o.forEachWhile((u=>{const c=this.ot(u);return!c||c.purpose==="TargetPurposeLimboResolution"||(a=!1,!1)})),a&&(n=n.add(i))})),this.je.forEach(((i,o)=>o.setReadTime(e)));const s=new On(e,t,this.Ye,this.je,n);return this.je=le(),this.Je=Qn(),this.He=Qn(),this.Ye=new O(V),s}Xe(e,t){if(!this.rt(e))return;const n=this.Et(e,t.key)?2:0;this.nt(e).Qe(t.key,n),this.je=this.je.insert(t.key,t),this.Je=this.Je.insert(t.key,this.It(t.key).add(e)),this.He=this.He.insert(t.key,this.dt(t.key).add(e))}et(e,t,n){if(!this.rt(e))return;const s=this.nt(e);this.Et(e,t)?s.Qe(t,1):s.$e(t),this.He=this.He.insert(t,this.dt(t).delete(e)),this.He=this.He.insert(t,this.dt(t).add(e)),n&&(this.je=this.je.insert(t,n))}removeTarget(e){this.ze.delete(e)}_t(e){const t=this.nt(e).ke();return this.Ge.getRemoteKeysForTarget(e).size+t.addedDocuments.size-t.removedDocuments.size}Ue(e){this.nt(e).Ue()}nt(e){let t=this.ze.get(e);return t||(t=new fo,this.ze.set(e,t)),t}dt(e){let t=this.He.get(e);return t||(t=new F(V),this.He=this.He.insert(e,t)),t}It(e){let t=this.Je.get(e);return t||(t=new F(V),this.Je=this.Je.insert(e,t)),t}rt(e){const t=this.ot(e)!==null;return t||g("WatchChangeAggregator","Detected inactive target",e),t}ot(e){const t=this.ze.get(e);return t&&t.Ne?null:this.Ge.At(e)}it(e){this.ze.set(e,new fo),this.Ge.getRemoteKeysForTarget(e).forEach((t=>{this.et(e,t,null)}))}Et(e,t){return this.Ge.getRemoteKeysForTarget(e).has(t)}}function Qn(){return new O(y.comparator)}function mo(){return new O(y.comparator)}const ch={asc:"ASCENDING",desc:"DESCENDING"},lh={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},hh={and:"AND",or:"OR"};class dh{constructor(e,t){this.databaseId=e,this.useProto3Json=t}}function Is(r,e){return r.useProto3Json||Dr(e)?e:{value:e}}function Bt(r,e){return r.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function du(r,e){return r.useProto3Json?e.toBase64():e.toUint8Array()}function fh(r,e){return Bt(r,e.toTimestamp())}function oe(r){return v(!!r,49232),R.fromTimestamp((function(t){const n=Pe(t);return new k(n.seconds,n.nanos)})(r))}function Xs(r,e){return Ts(r,e).canonicalString()}function Ts(r,e){const t=(function(s){return new x(["projects",s.projectId,"databases",s.database])})(r).child("documents");return e===void 0?t:t.child(e)}function fu(r){const e=x.fromString(r);return v(Au(e),10190,{key:e.toString()}),e}function pr(r,e){return Xs(r.databaseId,e.path)}function rt(r,e){const t=fu(e);if(t.get(1)!==r.databaseId.projectId)throw new p(m.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+t.get(1)+" vs "+r.databaseId.projectId);if(t.get(3)!==r.databaseId.database)throw new p(m.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+t.get(3)+" vs "+r.databaseId.database);return new y(gu(t))}function mu(r,e){return Xs(r.databaseId,e)}function _u(r){const e=fu(r);return e.length===4?x.emptyPath():gu(e)}function Es(r){return new x(["projects",r.databaseId.projectId,"databases",r.databaseId.database]).canonicalString()}function gu(r){return v(r.length>4&&r.get(4)==="documents",29091,{key:r.toString()}),r.popFirst(5)}function _o(r,e,t){return{name:pr(r,e),fields:t.value.mapValue.fields}}function mh(r,e,t){const n=rt(r,e.name),s=oe(e.updateTime),i=e.createTime?oe(e.createTime):R.min(),o=new re({mapValue:{fields:e.fields}}),a=z.newFoundDocument(n,s,i,o);return t&&a.setHasCommittedMutations(),t?a.setHasCommittedMutations():a}function _h(r,e){let t;if("targetChange"in e){e.targetChange;const n=(function(c){return c==="NO_CHANGE"?0:c==="ADD"?1:c==="REMOVE"?2:c==="CURRENT"?3:c==="RESET"?4:I(39313,{state:c})})(e.targetChange.targetChangeType||"NO_CHANGE"),s=e.targetChange.targetIds||[],i=(function(c,l){return c.useProto3Json?(v(l===void 0||typeof l=="string",58123),j.fromBase64String(l||"")):(v(l===void 0||l instanceof Buffer||l instanceof Uint8Array,16193),j.fromUint8Array(l||new Uint8Array))})(r,e.targetChange.resumeToken),o=e.targetChange.cause,a=o&&(function(c){const l=c.code===void 0?m.UNKNOWN:cu(c.code);return new p(l,c.message||"")})(o);t=new hu(n,s,i,a||null)}else if("documentChange"in e){e.documentChange;const n=e.documentChange;n.document,n.document.name,n.document.updateTime;const s=rt(r,n.document.name),i=oe(n.document.updateTime),o=n.document.createTime?oe(n.document.createTime):R.min(),a=new re({mapValue:{fields:n.document.fields}}),u=z.newFoundDocument(s,i,o,a),c=n.targetIds||[],l=n.removedTargetIds||[];t=new ir(c,l,u.key,u)}else if("documentDelete"in e){e.documentDelete;const n=e.documentDelete;n.document;const s=rt(r,n.document),i=n.readTime?oe(n.readTime):R.min(),o=z.newNoDocument(s,i),a=n.removedTargetIds||[];t=new ir([],a,o.key,o)}else if("documentRemove"in e){e.documentRemove;const n=e.documentRemove;n.document;const s=rt(r,n.document),i=n.removedTargetIds||[];t=new ir([],i,s,null)}else{if(!("filter"in e))return I(11601,{Rt:e});{e.filter;const n=e.filter;n.targetId;const{count:s=0,unchangedNames:i}=n,o=new sh(s,i),a=n.targetId;t=new lu(a,o)}}return t}function yr(r,e){let t;if(e instanceof Qt)t={update:_o(r,e.key,e.value)};else if(e instanceof Fn)t={delete:pr(r,e.key)};else if(e instanceof Ce)t={update:_o(r,e.key,e.data),updateMask:Eh(e.fieldMask)};else{if(!(e instanceof uu))return I(16599,{Vt:e.type});t={verify:pr(r,e.key)}}return e.fieldTransforms.length>0&&(t.updateTransforms=e.fieldTransforms.map((n=>(function(i,o){const a=o.transform;if(a instanceof Vn)return{fieldPath:o.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(a instanceof Ut)return{fieldPath:o.field.canonicalString(),appendMissingElements:{values:a.elements}};if(a instanceof qt)return{fieldPath:o.field.canonicalString(),removeAllFromArray:{values:a.elements}};if(a instanceof Pn)return{fieldPath:o.field.canonicalString(),increment:a.Ae};throw I(20930,{transform:o.transform})})(0,n)))),e.precondition.isNone||(t.currentDocument=(function(s,i){return i.updateTime!==void 0?{updateTime:fh(s,i.updateTime)}:i.exists!==void 0?{exists:i.exists}:I(27497)})(r,e.precondition)),t}function As(r,e){const t=e.currentDocument?(function(i){return i.updateTime!==void 0?H.updateTime(oe(i.updateTime)):i.exists!==void 0?H.exists(i.exists):H.none()})(e.currentDocument):H.none(),n=e.updateTransforms?e.updateTransforms.map((s=>(function(o,a){let u=null;if("setToServerValue"in a)v(a.setToServerValue==="REQUEST_TIME",16630,{proto:a}),u=new Vn;else if("appendMissingElements"in a){const l=a.appendMissingElements.values||[];u=new Ut(l)}else if("removeAllFromArray"in a){const l=a.removeAllFromArray.values||[];u=new qt(l)}else"increment"in a?u=new Pn(o,a.increment):I(16584,{proto:a});const c=U.fromServerFormat(a.fieldPath);return new Zl(c,u)})(r,s))):[];if(e.update){e.update.name;const s=rt(r,e.update.name),i=new re({mapValue:{fields:e.update.fields}});if(e.updateMask){const o=(function(u){const c=u.fieldPaths||[];return new ue(c.map((l=>U.fromServerFormat(l))))})(e.updateMask);return new Ce(s,i,o,t,n)}return new Qt(s,i,t,n)}if(e.delete){const s=rt(r,e.delete);return new Fn(s,t)}if(e.verify){const s=rt(r,e.verify);return new uu(s,t)}return I(1463,{proto:e})}function gh(r,e){return r&&r.length>0?(v(e!==void 0,14353),r.map((t=>(function(s,i){let o=s.updateTime?oe(s.updateTime):oe(i);return o.isEqual(R.min())&&(o=oe(i)),new th(o,s.transformResults||[])})(t,e)))):[]}function pu(r,e){return{documents:[mu(r,e.path)]}}function yu(r,e){const t={structuredQuery:{}},n=e.path;let s;e.collectionGroup!==null?(s=n,t.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(s=n.popLast(),t.structuredQuery.from=[{collectionId:n.lastSegment()}]),t.parent=mu(r,s);const i=(function(c){if(c.length!==0)return Eu(M.create(c,"and"))})(e.filters);i&&(t.structuredQuery.where=i);const o=(function(c){if(c.length!==0)return c.map((l=>(function(d){return{field:vt(d.field),direction:yh(d.dir)}})(l)))})(e.orderBy);o&&(t.structuredQuery.orderBy=o);const a=Is(r,e.limit);return a!==null&&(t.structuredQuery.limit=a),e.startAt&&(t.structuredQuery.startAt=(function(c){return{before:c.inclusive,values:c.position}})(e.startAt)),e.endAt&&(t.structuredQuery.endAt=(function(c){return{before:!c.inclusive,values:c.position}})(e.endAt)),{ft:t,parent:s}}function Iu(r){let e=_u(r.parent);const t=r.structuredQuery,n=t.from?t.from.length:0;let s=null;if(n>0){v(n===1,65062);const l=t.from[0];l.allDescendants?s=l.collectionId:e=e.child(l.collectionId)}let i=[];t.where&&(i=(function(h){const d=Tu(h);return d instanceof M&&$s(d)?d.getFilters():[d]})(t.where));let o=[];t.orderBy&&(o=(function(h){return h.map((d=>(function(T){return new mr(Rt(T.field),(function(E){switch(E){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}})(T.direction))})(d)))})(t.orderBy));let a=null;t.limit&&(a=(function(h){let d;return d=typeof h=="object"?h.value:h,Dr(d)?null:d})(t.limit));let u=null;t.startAt&&(u=(function(h){const d=!!h.before,_=h.values||[];return new Ot(_,d)})(t.startAt));let c=null;return t.endAt&&(c=(function(h){const d=!h.before,_=h.values||[];return new Ot(_,d)})(t.endAt)),Qa(e,s,o,i,a,"F",u,c)}function ph(r,e){const t=(function(s){switch(s){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return I(28987,{purpose:s})}})(e.purpose);return t==null?null:{"goog-listen-tags":t}}function Tu(r){return r.unaryFilter!==void 0?(function(t){switch(t.unaryFilter.op){case"IS_NAN":const n=Rt(t.unaryFilter.field);return C.create(n,"==",{doubleValue:NaN});case"IS_NULL":const s=Rt(t.unaryFilter.field);return C.create(s,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const i=Rt(t.unaryFilter.field);return C.create(i,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const o=Rt(t.unaryFilter.field);return C.create(o,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return I(61313);default:return I(60726)}})(r):r.fieldFilter!==void 0?(function(t){return C.create(Rt(t.fieldFilter.field),(function(s){switch(s){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return I(58110);default:return I(50506)}})(t.fieldFilter.op),t.fieldFilter.value)})(r):r.compositeFilter!==void 0?(function(t){return M.create(t.compositeFilter.filters.map((n=>Tu(n))),(function(s){switch(s){case"AND":return"and";case"OR":return"or";default:return I(1026)}})(t.compositeFilter.op))})(r):I(30097,{filter:r})}function yh(r){return ch[r]}function Ih(r){return lh[r]}function Th(r){return hh[r]}function vt(r){return{fieldPath:r.canonicalString()}}function Rt(r){return U.fromServerFormat(r.fieldPath)}function Eu(r){return r instanceof C?(function(t){if(t.op==="=="){if(Xi(t.value))return{unaryFilter:{field:vt(t.field),op:"IS_NAN"}};if(Yi(t.value))return{unaryFilter:{field:vt(t.field),op:"IS_NULL"}}}else if(t.op==="!="){if(Xi(t.value))return{unaryFilter:{field:vt(t.field),op:"IS_NOT_NAN"}};if(Yi(t.value))return{unaryFilter:{field:vt(t.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:vt(t.field),op:Ih(t.op),value:t.value}}})(r):r instanceof M?(function(t){const n=t.getFilters().map((s=>Eu(s)));return n.length===1?n[0]:{compositeFilter:{op:Th(t.op),filters:n}}})(r):I(54877,{filter:r})}function Eh(r){const e=[];return r.fields.forEach((t=>e.push(t.canonicalString()))),{fieldPaths:e}}function Au(r){return r.length>=4&&r.get(0)==="projects"&&r.get(2)==="databases"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ve{constructor(e,t,n,s,i=R.min(),o=R.min(),a=j.EMPTY_BYTE_STRING,u=null){this.target=e,this.targetId=t,this.purpose=n,this.sequenceNumber=s,this.snapshotVersion=i,this.lastLimboFreeSnapshotVersion=o,this.resumeToken=a,this.expectedCount=u}withSequenceNumber(e){return new Ve(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new Ve(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new Ve(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new Ve(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wu{constructor(e){this.yt=e}}function Ah(r,e){let t;if(e.document)t=mh(r.yt,e.document,!!e.hasCommittedMutations);else if(e.noDocument){const n=y.fromSegments(e.noDocument.path),s=lt(e.noDocument.readTime);t=z.newNoDocument(n,s),e.hasCommittedMutations&&t.setHasCommittedMutations()}else{if(!e.unknownDocument)return I(56709);{const n=y.fromSegments(e.unknownDocument.path),s=lt(e.unknownDocument.version);t=z.newUnknownDocument(n,s)}}return e.readTime&&t.setReadTime((function(s){const i=new k(s[0],s[1]);return R.fromTimestamp(i)})(e.readTime)),t}function go(r,e){const t=e.key,n={prefixPath:t.getCollectionPath().popLast().toArray(),collectionGroup:t.collectionGroup,documentId:t.path.lastSegment(),readTime:Ir(e.readTime),hasCommittedMutations:e.hasCommittedMutations};if(e.isFoundDocument())n.document=(function(i,o){return{name:pr(i,o.key),fields:o.data.value.mapValue.fields,updateTime:Bt(i,o.version.toTimestamp()),createTime:Bt(i,o.createTime.toTimestamp())}})(r.yt,e);else if(e.isNoDocument())n.noDocument={path:t.path.toArray(),readTime:ct(e.version)};else{if(!e.isUnknownDocument())return I(57904,{document:e});n.unknownDocument={path:t.path.toArray(),version:ct(e.version)}}return n}function Ir(r){const e=r.toTimestamp();return[e.seconds,e.nanoseconds]}function ct(r){const e=r.toTimestamp();return{seconds:e.seconds,nanoseconds:e.nanoseconds}}function lt(r){const e=new k(r.seconds,r.nanoseconds);return R.fromTimestamp(e)}function Je(r,e){const t=(e.baseMutations||[]).map((i=>As(r.yt,i)));for(let i=0;i<e.mutations.length-1;++i){const o=e.mutations[i];if(i+1<e.mutations.length&&e.mutations[i+1].transform!==void 0){const a=e.mutations[i+1];o.updateTransforms=a.transform.fieldTransforms,e.mutations.splice(i+1,1),++i}}const n=e.mutations.map((i=>As(r.yt,i))),s=k.fromMillis(e.localWriteTimeMs);return new Ws(e.batchId,s,t,n)}function sn(r){const e=lt(r.readTime),t=r.lastLimboFreeSnapshotVersion!==void 0?lt(r.lastLimboFreeSnapshotVersion):R.min();let n;return n=(function(i){return i.documents!==void 0})(r.query)?(function(i){const o=i.documents.length;return v(o===1,1966,{count:o}),he(kn(_u(i.documents[0])))})(r.query):(function(i){return he(Iu(i))})(r.query),new Ve(n,r.targetId,"TargetPurposeListen",r.lastListenSequenceNumber,e,t,j.fromBase64String(r.resumeToken))}function vu(r,e){const t=ct(e.snapshotVersion),n=ct(e.lastLimboFreeSnapshotVersion);let s;s=_r(e.target)?pu(r.yt,e.target):yu(r.yt,e.target).ft;const i=e.resumeToken.toBase64();return{targetId:e.targetId,canonicalId:ut(e.target),readTime:t,resumeToken:i,lastListenSequenceNumber:e.sequenceNumber,lastLimboFreeSnapshotVersion:n,query:s}}function Ru(r){const e=Iu({parent:r.parent,structuredQuery:r.structuredQuery});return r.limitType==="LAST"?ys(e,e.limit,"L"):e}function Yr(r,e){return new Js(e.largestBatchId,As(r.yt,e.overlayMutation))}function po(r,e){const t=e.path.lastSegment();return[r,se(e.path.popLast()),t]}function yo(r,e,t,n){return{indexId:r,uid:e,sequenceNumber:t,readTime:ct(n.readTime),documentKey:se(n.documentKey.path),largestBatchId:n.largestBatchId}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wh{getBundleMetadata(e,t){return Io(e).get(t).next((n=>{if(n)return(function(i){return{id:i.bundleId,createTime:lt(i.createTime),version:i.version}})(n)}))}saveBundleMetadata(e,t){return Io(e).put((function(s){return{bundleId:s.id,createTime:ct(oe(s.createTime)),version:s.version}})(t))}getNamedQuery(e,t){return To(e).get(t).next((n=>{if(n)return(function(i){return{name:i.name,query:Ru(i.bundledQuery),readTime:lt(i.readTime)}})(n)}))}saveNamedQuery(e,t){return To(e).put((function(s){return{name:s.name,readTime:ct(oe(s.readTime)),bundledQuery:s.bundledQuery}})(t))}}function Io(r){return J(r,xr)}function To(r){return J(r,Nr)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qr{constructor(e,t){this.serializer=e,this.userId=t}static wt(e,t){const n=t.uid||"";return new qr(e,n)}getOverlay(e,t){return Yt(e).get(po(this.userId,t)).next((n=>n?Yr(this.serializer,n):null))}getOverlays(e,t){const n=Ie();return f.forEach(t,(s=>this.getOverlay(e,s).next((i=>{i!==null&&n.set(s,i)})))).next((()=>n))}saveOverlays(e,t,n){const s=[];return n.forEach(((i,o)=>{const a=new Js(t,o);s.push(this.St(e,a))})),f.waitFor(s)}removeOverlaysForBatchId(e,t,n){const s=new Set;t.forEach((o=>s.add(se(o.getCollectionPath()))));const i=[];return s.forEach((o=>{const a=IDBKeyRange.bound([this.userId,o,n],[this.userId,o,n+1],!1,!0);i.push(Yt(e).Z(ls,a))})),f.waitFor(i)}getOverlaysForCollection(e,t,n){const s=Ie(),i=se(t),o=IDBKeyRange.bound([this.userId,i,n],[this.userId,i,Number.POSITIVE_INFINITY],!0);return Yt(e).J(ls,o).next((a=>{for(const u of a){const c=Yr(this.serializer,u);s.set(c.getKey(),c)}return s}))}getOverlaysForCollectionGroup(e,t,n,s){const i=Ie();let o;const a=IDBKeyRange.bound([this.userId,t,n],[this.userId,t,Number.POSITIVE_INFINITY],!0);return Yt(e).ee({index:Ra,range:a},((u,c,l)=>{const h=Yr(this.serializer,c);i.size()<s||h.largestBatchId===o?(i.set(h.getKey(),h),o=h.largestBatchId):l.done()})).next((()=>i))}St(e,t){return Yt(e).put((function(s,i,o){const[a,u,c]=po(i,o.mutation.key);return{userId:i,collectionPath:u,documentId:c,collectionGroup:o.mutation.key.getCollectionGroup(),largestBatchId:o.largestBatchId,overlayMutation:yr(s.yt,o.mutation)}})(this.serializer,this.userId,t))}}function Yt(r){return J(r,kr)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vh{bt(e){return J(e,qs)}getSessionToken(e){return this.bt(e).get("sessionToken").next((t=>{const n=t==null?void 0:t.value;return n?j.fromUint8Array(n):j.EMPTY_BYTE_STRING}))}setSessionToken(e,t){return this.bt(e).put({name:"sessionToken",value:t.toUint8Array()})}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ye{constructor(){}Dt(e,t){this.Ct(e,t),t.vt()}Ct(e,t){if("nullValue"in e)this.Ft(t,5);else if("booleanValue"in e)this.Ft(t,10),t.Mt(e.booleanValue?1:0);else if("integerValue"in e)this.Ft(t,15),t.Mt(L(e.integerValue));else if("doubleValue"in e){const n=L(e.doubleValue);isNaN(n)?this.Ft(t,13):(this.Ft(t,15),pn(n)?t.Mt(0):t.Mt(n))}else if("timestampValue"in e){let n=e.timestampValue;this.Ft(t,20),typeof n=="string"&&(n=Pe(n)),t.xt(`${n.seconds||""}`),t.Mt(n.nanos||0)}else if("stringValue"in e)this.Ot(e.stringValue,t),this.Nt(t);else if("bytesValue"in e)this.Ft(t,30),t.Bt(Se(e.bytesValue)),this.Nt(t);else if("referenceValue"in e)this.Lt(e.referenceValue,t);else if("geoPointValue"in e){const n=e.geoPointValue;this.Ft(t,45),t.Mt(n.latitude||0),t.Mt(n.longitude||0)}else"mapValue"in e?Oa(e)?this.Ft(t,Number.MAX_SAFE_INTEGER):Fr(e)?this.kt(e.mapValue,t):(this.qt(e.mapValue,t),this.Nt(t)):"arrayValue"in e?(this.Qt(e.arrayValue,t),this.Nt(t)):I(19022,{$t:e})}Ot(e,t){this.Ft(t,25),this.Ut(e,t)}Ut(e,t){t.xt(e)}qt(e,t){const n=e.fields||{};this.Ft(t,55);for(const s of Object.keys(n))this.Ot(s,t),this.Ct(n[s],t)}kt(e,t){var o,a;const n=e.fields||{};this.Ft(t,53);const s=Mt,i=((a=(o=n[s].arrayValue)==null?void 0:o.values)==null?void 0:a.length)||0;this.Ft(t,15),t.Mt(L(i)),this.Ot(s,t),this.Ct(n[s],t)}Qt(e,t){const n=e.values||[];this.Ft(t,50);for(const s of n)this.Ct(s,t)}Lt(e,t){this.Ft(t,37),y.fromName(e).path.forEach((n=>{this.Ft(t,60),this.Ut(n,t)}))}Ft(e,t){e.Mt(t)}Nt(e){e.Mt(2)}}Ye.Kt=new Ye;/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law | agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES | CONDITIONS OF ANY KIND, either express | implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yt=255;function Rh(r){if(r===0)return 8;let e=0;return r>>4||(e+=4,r<<=4),r>>6||(e+=2,r<<=2),r>>7||(e+=1),e}function Eo(r){const e=64-(function(n){let s=0;for(let i=0;i<8;++i){const o=Rh(255&n[i]);if(s+=o,o!==8)break}return s})(r);return Math.ceil(e/8)}class Vh{constructor(){this.buffer=new Uint8Array(1024),this.position=0}Wt(e){const t=e[Symbol.iterator]();let n=t.next();for(;!n.done;)this.Gt(n.value),n=t.next();this.zt()}jt(e){const t=e[Symbol.iterator]();let n=t.next();for(;!n.done;)this.Jt(n.value),n=t.next();this.Ht()}Yt(e){for(const t of e){const n=t.charCodeAt(0);if(n<128)this.Gt(n);else if(n<2048)this.Gt(960|n>>>6),this.Gt(128|63&n);else if(t<"\uD800"||"\uDBFF"<t)this.Gt(480|n>>>12),this.Gt(128|63&n>>>6),this.Gt(128|63&n);else{const s=t.codePointAt(0);this.Gt(240|s>>>18),this.Gt(128|63&s>>>12),this.Gt(128|63&s>>>6),this.Gt(128|63&s)}}this.zt()}Zt(e){for(const t of e){const n=t.charCodeAt(0);if(n<128)this.Jt(n);else if(n<2048)this.Jt(960|n>>>6),this.Jt(128|63&n);else if(t<"\uD800"||"\uDBFF"<t)this.Jt(480|n>>>12),this.Jt(128|63&n>>>6),this.Jt(128|63&n);else{const s=t.codePointAt(0);this.Jt(240|s>>>18),this.Jt(128|63&s>>>12),this.Jt(128|63&s>>>6),this.Jt(128|63&s)}}this.Ht()}Xt(e){const t=this.en(e),n=Eo(t);this.tn(1+n),this.buffer[this.position++]=255&n;for(let s=t.length-n;s<t.length;++s)this.buffer[this.position++]=255&t[s]}nn(e){const t=this.en(e),n=Eo(t);this.tn(1+n),this.buffer[this.position++]=~(255&n);for(let s=t.length-n;s<t.length;++s)this.buffer[this.position++]=~(255&t[s])}rn(){this.sn(yt),this.sn(255)}_n(){this.an(yt),this.an(255)}reset(){this.position=0}seed(e){this.tn(e.length),this.buffer.set(e,this.position),this.position+=e.length}un(){return this.buffer.slice(0,this.position)}en(e){const t=(function(i){const o=new DataView(new ArrayBuffer(8));return o.setFloat64(0,i,!1),new Uint8Array(o.buffer)})(e),n=!!(128&t[0]);t[0]^=n?255:128;for(let s=1;s<t.length;++s)t[s]^=n?255:0;return t}Gt(e){const t=255&e;t===0?(this.sn(0),this.sn(255)):t===yt?(this.sn(yt),this.sn(0)):this.sn(t)}Jt(e){const t=255&e;t===0?(this.an(0),this.an(255)):t===yt?(this.an(yt),this.an(0)):this.an(e)}zt(){this.sn(0),this.sn(1)}Ht(){this.an(0),this.an(1)}sn(e){this.tn(1),this.buffer[this.position++]=e}an(e){this.tn(1),this.buffer[this.position++]=~e}tn(e){const t=e+this.position;if(t<=this.buffer.length)return;let n=2*this.buffer.length;n<t&&(n=t);const s=new Uint8Array(n);s.set(this.buffer),this.buffer=s}}class Ph{constructor(e){this.cn=e}Bt(e){this.cn.Wt(e)}xt(e){this.cn.Yt(e)}Mt(e){this.cn.Xt(e)}vt(){this.cn.rn()}}class Sh{constructor(e){this.cn=e}Bt(e){this.cn.jt(e)}xt(e){this.cn.Zt(e)}Mt(e){this.cn.nn(e)}vt(){this.cn._n()}}class Xt{constructor(){this.cn=new Vh,this.ln=new Ph(this.cn),this.hn=new Sh(this.cn)}seed(e){this.cn.seed(e)}Pn(e){return e===0?this.ln:this.hn}un(){return this.cn.un()}reset(){this.cn.reset()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xe{constructor(e,t,n,s){this.Tn=e,this.In=t,this.En=n,this.dn=s}An(){const e=this.dn.length,t=e===0||this.dn[e-1]===255?e+1:e,n=new Uint8Array(t);return n.set(this.dn,0),t!==e?n.set([0],this.dn.length):++n[n.length-1],new Xe(this.Tn,this.In,this.En,n)}Rn(e,t,n){return{indexId:this.Tn,uid:e,arrayValue:or(this.En),directionalValue:or(this.dn),orderedDocumentKey:or(t),documentKey:n.path.toArray()}}Vn(e,t,n){const s=this.Rn(e,t,n);return[s.indexId,s.uid,s.arrayValue,s.directionalValue,s.orderedDocumentKey,s.documentKey]}}function De(r,e){let t=r.Tn-e.Tn;return t!==0?t:(t=Ao(r.En,e.En),t!==0?t:(t=Ao(r.dn,e.dn),t!==0?t:y.comparator(r.In,e.In)))}function Ao(r,e){for(let t=0;t<r.length&&t<e.length;++t){const n=r[t]-e[t];if(n!==0)return n}return r.length-e.length}function or(r){return ua()?(function(t){let n="";for(let s=0;s<t.length;s++)n+=String.fromCharCode(t[s]);return n})(r):r}function wo(r){return typeof r!="string"?r:(function(t){const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n})(r)}class vo{constructor(e){this.mn=new F(((t,n)=>U.comparator(t.field,n.field))),this.collectionId=e.collectionGroup!=null?e.collectionGroup:e.path.lastSegment(),this.fn=e.orderBy,this.gn=[];for(const t of e.filters){const n=t;n.isInequality()?this.mn=this.mn.add(n):this.gn.push(n)}}get pn(){return this.mn.size>1}yn(e){if(v(e.collectionGroup===this.collectionId,49279),this.pn)return!1;const t=as(e);if(t!==void 0&&!this.wn(t))return!1;const n=Qe(e);let s=new Set,i=0,o=0;for(;i<n.length&&this.wn(n[i]);++i)s=s.add(n[i].fieldPath.canonicalString());if(i===n.length)return!0;if(this.mn.size>0){const a=this.mn.getIterator().getNext();if(!s.has(a.field.canonicalString())){const u=n[i];if(!this.Sn(a,u)||!this.bn(this.fn[o++],u))return!1}++i}for(;i<n.length;++i){const a=n[i];if(o>=this.fn.length||!this.bn(this.fn[o++],a))return!1}return!0}Dn(){if(this.pn)return null;let e=new F(U.comparator);const t=[];for(const n of this.gn)if(!n.field.isKeyField())if(n.op==="array-contains"||n.op==="array-contains-any")t.push(new Xn(n.field,2));else{if(e.has(n.field))continue;e=e.add(n.field),t.push(new Xn(n.field,0))}for(const n of this.fn)n.field.isKeyField()||e.has(n.field)||(e=e.add(n.field),t.push(new Xn(n.field,n.dir==="asc"?0:1)));return new lr(lr.UNKNOWN_ID,this.collectionId,t,gn.empty())}wn(e){for(const t of this.gn)if(this.Sn(t,e))return!0;return!1}Sn(e,t){if(e===void 0||!e.field.isEqual(t.fieldPath))return!1;const n=e.op==="array-contains"||e.op==="array-contains-any";return t.kind===2===n}bn(e,t){return!!e.field.isEqual(t.fieldPath)&&(t.kind===0&&e.dir==="asc"||t.kind===1&&e.dir==="desc")}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vu(r){var t,n;if(v(r instanceof C||r instanceof M,20012),r instanceof C){if(r instanceof ja){const s=((n=(t=r.value.arrayValue)==null?void 0:t.values)==null?void 0:n.map((i=>C.create(r.field,"==",i))))||[];return M.create(s,"or")}return r}const e=r.filters.map((s=>Vu(s)));return M.create(e,r.op)}function bh(r){if(r.getFilters().length===0)return[];const e=Rs(Vu(r));return v(Pu(e),7391),ws(e)||vs(e)?[e]:e.getFilters()}function ws(r){return r instanceof C}function vs(r){return r instanceof M&&$s(r)}function Pu(r){return ws(r)||vs(r)||(function(t){if(t instanceof M&&ms(t)){for(const n of t.getFilters())if(!ws(n)&&!vs(n))return!1;return!0}return!1})(r)}function Rs(r){if(v(r instanceof C||r instanceof M,34018),r instanceof C)return r;if(r.filters.length===1)return Rs(r.filters[0]);const e=r.filters.map((n=>Rs(n)));let t=M.create(e,r.op);return t=Tr(t),Pu(t)?t:(v(t instanceof M,64498),v(Lt(t),40251),v(t.filters.length>1,57927),t.filters.reduce(((n,s)=>Zs(n,s))))}function Zs(r,e){let t;return v(r instanceof C||r instanceof M,38388),v(e instanceof C||e instanceof M,25473),t=r instanceof C?e instanceof C?(function(s,i){return M.create([s,i],"and")})(r,e):Ro(r,e):e instanceof C?Ro(e,r):(function(s,i){if(v(s.filters.length>0&&i.filters.length>0,48005),Lt(s)&&Lt(i))return Ka(s,i.getFilters());const o=ms(s)?s:i,a=ms(s)?i:s,u=o.filters.map((c=>Zs(c,a)));return M.create(u,"or")})(r,e),Tr(t)}function Ro(r,e){if(Lt(e))return Ka(e,r.getFilters());{const t=e.filters.map((n=>Zs(r,n)));return M.create(t,"or")}}function Tr(r){if(v(r instanceof C||r instanceof M,11850),r instanceof C)return r;const e=r.getFilters();if(e.length===1)return Tr(e[0]);if(Ba(r))return r;const t=e.map((s=>Tr(s))),n=[];return t.forEach((s=>{s instanceof C?n.push(s):s instanceof M&&(s.op===r.op?n.push(...s.filters):n.push(s))})),n.length===1?n[0]:M.create(n,r.op)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ch{constructor(){this.Cn=new ei}addToCollectionParentIndex(e,t){return this.Cn.add(t),f.resolve()}getCollectionParents(e,t){return f.resolve(this.Cn.getEntries(t))}addFieldIndex(e,t){return f.resolve()}deleteFieldIndex(e,t){return f.resolve()}deleteAllFieldIndexes(e){return f.resolve()}createTargetIndexes(e,t){return f.resolve()}getDocumentsMatchingTarget(e,t){return f.resolve(null)}getIndexType(e,t){return f.resolve(0)}getFieldIndexes(e,t){return f.resolve([])}getNextCollectionGroupToUpdate(e){return f.resolve(null)}getMinOffset(e,t){return f.resolve(de.min())}getMinOffsetFromCollectionGroup(e,t){return f.resolve(de.min())}updateCollectionGroup(e,t,n){return f.resolve()}updateIndexEntries(e,t){return f.resolve()}}class ei{constructor(){this.index={}}add(e){const t=e.lastSegment(),n=e.popLast(),s=this.index[t]||new F(x.comparator),i=!s.has(n);return this.index[t]=s.add(n),i}has(e){const t=e.lastSegment(),n=e.popLast(),s=this.index[t];return s&&s.has(n)}getEntries(e){return(this.index[e]||new F(x.comparator)).toArray()}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vo="IndexedDbIndexManager",Wn=new Uint8Array(0);class Dh{constructor(e,t){this.databaseId=t,this.vn=new ei,this.Fn=new be((n=>ut(n)),((n,s)=>xn(n,s))),this.uid=e.uid||""}addToCollectionParentIndex(e,t){if(!this.vn.has(t)){const n=t.lastSegment(),s=t.popLast();e.addOnCommittedListener((()=>{this.vn.add(t)}));const i={collectionId:n,parent:se(s)};return Po(e).put(i)}return f.resolve()}getCollectionParents(e,t){const n=[],s=IDBKeyRange.bound([t,""],[ha(t),""],!1,!0);return Po(e).J(s).next((i=>{for(const o of i){if(o.collectionId!==t)break;n.push(ye(o.parent))}return n}))}addFieldIndex(e,t){const n=Zt(e),s=(function(a){return{indexId:a.indexId,collectionGroup:a.collectionGroup,fields:a.fields.map((u=>[u.fieldPath.canonicalString(),u.kind]))}})(t);delete s.indexId;const i=n.add(s);if(t.indexState){const o=Tt(e);return i.next((a=>{o.put(yo(a,this.uid,t.indexState.sequenceNumber,t.indexState.offset))}))}return i.next()}deleteFieldIndex(e,t){const n=Zt(e),s=Tt(e),i=It(e);return n.delete(t.indexId).next((()=>s.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0)))).next((()=>i.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0))))}deleteAllFieldIndexes(e){const t=Zt(e),n=It(e),s=Tt(e);return t.Z().next((()=>n.Z())).next((()=>s.Z()))}createTargetIndexes(e,t){return f.forEach(this.Mn(t),(n=>this.getIndexType(e,n).next((s=>{if(s===0||s===1){const i=new vo(n).Dn();if(i!=null)return this.addFieldIndex(e,i)}}))))}getDocumentsMatchingTarget(e,t){const n=It(e);let s=!0;const i=new Map;return f.forEach(this.Mn(t),(o=>this.xn(e,o).next((a=>{s&&(s=!!a),i.set(o,a)})))).next((()=>{if(s){let o=S();const a=[];return f.forEach(i,((u,c)=>{g(Vo,`Using index ${(function(P){return`id=${P.indexId}|cg=${P.collectionGroup}|f=${P.fields.map((q=>`${q.fieldPath}:${q.kind}`)).join(",")}`})(u)} to execute ${ut(t)}`);const l=(function(P,q){const G=as(q);if(G===void 0)return null;for(const B of gr(P,G.fieldPath))switch(B.op){case"array-contains-any":return B.value.arrayValue.values||[];case"array-contains":return[B.value]}return null})(c,u),h=(function(P,q){const G=new Map;for(const B of Qe(q))for(const ee of gr(P,B.fieldPath))switch(ee.op){case"==":case"in":G.set(B.fieldPath.canonicalString(),ee.value);break;case"not-in":case"!=":return G.set(B.fieldPath.canonicalString(),ee.value),Array.from(G.values())}return null})(c,u),d=(function(P,q){const G=[];let B=!0;for(const ee of Qe(q)){const _t=ee.kind===0?ro(P,ee.fieldPath,P.startAt):so(P,ee.fieldPath,P.startAt);G.push(_t.value),B&&(B=_t.inclusive)}return new Ot(G,B)})(c,u),_=(function(P,q){const G=[];let B=!0;for(const ee of Qe(q)){const _t=ee.kind===0?so(P,ee.fieldPath,P.endAt):ro(P,ee.fieldPath,P.endAt);G.push(_t.value),B&&(B=_t.inclusive)}return new Ot(G,B)})(c,u),T=this.On(u,c,d),A=this.On(u,c,_),E=this.Nn(u,c,h),N=this.Bn(u.indexId,l,T,d.inclusive,A,_.inclusive,E);return f.forEach(N,(b=>n.Y(b,t.limit).next((P=>{P.forEach((q=>{const G=y.fromSegments(q.documentKey);o.has(G)||(o=o.add(G),a.push(G))}))}))))})).next((()=>a))}return f.resolve(null)}))}Mn(e){let t=this.Fn.get(e);return t||(e.filters.length===0?t=[e]:t=bh(M.create(e.filters,"and")).map((n=>gs(e.path,e.collectionGroup,e.orderBy,n.getFilters(),e.limit,e.startAt,e.endAt))),this.Fn.set(e,t),t)}Bn(e,t,n,s,i,o,a){const u=(t!=null?t.length:1)*Math.max(n.length,i.length),c=u/(t!=null?t.length:1),l=[];for(let h=0;h<u;++h){const d=t?this.Ln(t[h/c]):Wn,_=this.kn(e,d,n[h%c],s),T=this.qn(e,d,i[h%c],o),A=a.map((E=>this.kn(e,d,E,!0)));l.push(...this.createRange(_,T,A))}return l}kn(e,t,n,s){const i=new Xe(e,y.empty(),t,n);return s?i:i.An()}qn(e,t,n,s){const i=new Xe(e,y.empty(),t,n);return s?i.An():i}xn(e,t){const n=new vo(t),s=t.collectionGroup!=null?t.collectionGroup:t.path.lastSegment();return this.getFieldIndexes(e,s).next((i=>{let o=null;for(const a of i)n.yn(a)&&(!o||a.fields.length>o.fields.length)&&(o=a);return o}))}getIndexType(e,t){let n=2;const s=this.Mn(t);return f.forEach(s,(i=>this.xn(e,i).next((o=>{o?n!==0&&o.fields.length<(function(u){let c=new F(U.comparator),l=!1;for(const h of u.filters)for(const d of h.getFlattenedFilters())d.field.isKeyField()||(d.op==="array-contains"||d.op==="array-contains-any"?l=!0:c=c.add(d.field));for(const h of u.orderBy)h.field.isKeyField()||(c=c.add(h.field));return c.size+(l?1:0)})(i)&&(n=1):n=0})))).next((()=>(function(o){return o.limit!==null})(t)&&s.length>1&&n===2?1:n))}Qn(e,t){const n=new Xt;for(const s of Qe(e)){const i=t.data.field(s.fieldPath);if(i==null)return null;const o=n.Pn(s.kind);Ye.Kt.Dt(i,o)}return n.un()}Ln(e){const t=new Xt;return Ye.Kt.Dt(e,t.Pn(0)),t.un()}$n(e,t){const n=new Xt;return Ye.Kt.Dt(vn(this.databaseId,t),n.Pn((function(i){const o=Qe(i);return o.length===0?0:o[o.length-1].kind})(e))),n.un()}Nn(e,t,n){if(n===null)return[];let s=[];s.push(new Xt);let i=0;for(const o of Qe(e)){const a=n[i++];for(const u of s)if(this.Un(t,o.fieldPath)&&Rn(a))s=this.Kn(s,o,a);else{const c=u.Pn(o.kind);Ye.Kt.Dt(a,c)}}return this.Wn(s)}On(e,t,n){return this.Nn(e,t,n.position)}Wn(e){const t=[];for(let n=0;n<e.length;++n)t[n]=e[n].un();return t}Kn(e,t,n){const s=[...e],i=[];for(const o of n.arrayValue.values||[])for(const a of s){const u=new Xt;u.seed(a.un()),Ye.Kt.Dt(o,u.Pn(t.kind)),i.push(u)}return i}Un(e,t){return!!e.filters.find((n=>n instanceof C&&n.field.isEqual(t)&&(n.op==="in"||n.op==="not-in")))}getFieldIndexes(e,t){const n=Zt(e),s=Tt(e);return(t?n.J(cs,IDBKeyRange.bound(t,t)):n.J()).next((i=>{const o=[];return f.forEach(i,(a=>s.get([a.indexId,this.uid]).next((u=>{o.push((function(l,h){const d=h?new gn(h.sequenceNumber,new de(lt(h.readTime),new y(ye(h.documentKey)),h.largestBatchId)):gn.empty(),_=l.fields.map((([T,A])=>new Xn(U.fromServerFormat(T),A)));return new lr(l.indexId,l.collectionGroup,_,d)})(a,u))})))).next((()=>o))}))}getNextCollectionGroupToUpdate(e){return this.getFieldIndexes(e).next((t=>t.length===0?null:(t.sort(((n,s)=>{const i=n.indexState.sequenceNumber-s.indexState.sequenceNumber;return i!==0?i:V(n.collectionGroup,s.collectionGroup)})),t[0].collectionGroup)))}updateCollectionGroup(e,t,n){const s=Zt(e),i=Tt(e);return this.Gn(e).next((o=>s.J(cs,IDBKeyRange.bound(t,t)).next((a=>f.forEach(a,(u=>i.put(yo(u.indexId,this.uid,o,n))))))))}updateIndexEntries(e,t){const n=new Map;return f.forEach(t,((s,i)=>{const o=n.get(s.collectionGroup);return(o?f.resolve(o):this.getFieldIndexes(e,s.collectionGroup)).next((a=>(n.set(s.collectionGroup,a),f.forEach(a,(u=>this.zn(e,s,u).next((c=>{const l=this.jn(i,u);return c.isEqual(l)?f.resolve():this.Jn(e,i,u,c,l)})))))))}))}Hn(e,t,n,s){return It(e).put(s.Rn(this.uid,this.$n(n,t.key),t.key))}Yn(e,t,n,s){return It(e).delete(s.Vn(this.uid,this.$n(n,t.key),t.key))}zn(e,t,n){const s=It(e);let i=new F(De);return s.ee({index:va,range:IDBKeyRange.only([n.indexId,this.uid,or(this.$n(n,t))])},((o,a)=>{i=i.add(new Xe(n.indexId,t,wo(a.arrayValue),wo(a.directionalValue)))})).next((()=>i))}jn(e,t){let n=new F(De);const s=this.Qn(t,e);if(s==null)return n;const i=as(t);if(i!=null){const o=e.data.field(i.fieldPath);if(Rn(o))for(const a of o.arrayValue.values||[])n=n.add(new Xe(t.indexId,e.key,this.Ln(a),s))}else n=n.add(new Xe(t.indexId,e.key,Wn,s));return n}Jn(e,t,n,s,i){g(Vo,"Updating index entries for document '%s'",t.key);const o=[];return(function(u,c,l,h,d){const _=u.getIterator(),T=c.getIterator();let A=pt(_),E=pt(T);for(;A||E;){let N=!1,b=!1;if(A&&E){const P=l(A,E);P<0?b=!0:P>0&&(N=!0)}else A!=null?b=!0:N=!0;N?(h(E),E=pt(T)):b?(d(A),A=pt(_)):(A=pt(_),E=pt(T))}})(s,i,De,(a=>{o.push(this.Hn(e,t,n,a))}),(a=>{o.push(this.Yn(e,t,n,a))})),f.waitFor(o)}Gn(e){let t=1;return Tt(e).ee({index:wa,reverse:!0,range:IDBKeyRange.upperBound([this.uid,Number.MAX_SAFE_INTEGER])},((n,s,i)=>{i.done(),t=s.sequenceNumber+1})).next((()=>t))}createRange(e,t,n){n=n.sort(((o,a)=>De(o,a))).filter(((o,a,u)=>!a||De(o,u[a-1])!==0));const s=[];s.push(e);for(const o of n){const a=De(o,e),u=De(o,t);if(a===0)s[0]=e.An();else if(a>0&&u<0)s.push(o),s.push(o.An());else if(u>0)break}s.push(t);const i=[];for(let o=0;o<s.length;o+=2){if(this.Zn(s[o],s[o+1]))return[];const a=s[o].Vn(this.uid,Wn,y.empty()),u=s[o+1].Vn(this.uid,Wn,y.empty());i.push(IDBKeyRange.bound(a,u))}return i}Zn(e,t){return De(e,t)>0}getMinOffsetFromCollectionGroup(e,t){return this.getFieldIndexes(e,t).next(So)}getMinOffset(e,t){return f.mapArray(this.Mn(t),(n=>this.xn(e,n).next((s=>s||I(44426))))).next(So)}}function Po(r){return J(r,Tn)}function It(r){return J(r,ln)}function Zt(r){return J(r,Us)}function Tt(r){return J(r,cn)}function So(r){v(r.length!==0,28825);let e=r[0].indexState.offset,t=e.largestBatchId;for(let n=1;n<r.length;n++){const s=r[n].indexState.offset;Fs(s,e)<0&&(e=s),t<s.largestBatchId&&(t=s.largestBatchId)}return new de(e.readTime,e.documentKey,t)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bo={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},Su=41943040;class ne{static withCacheSize(e){return new ne(e,ne.DEFAULT_COLLECTION_PERCENTILE,ne.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,t,n){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=n}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bu(r,e,t){const n=r.store(_e),s=r.store(Dt),i=[],o=IDBKeyRange.only(t.batchId);let a=0;const u=n.ee({range:o},((l,h,d)=>(a++,d.delete())));i.push(u.next((()=>{v(a===1,47070,{batchId:t.batchId})})));const c=[];for(const l of t.mutations){const h=Ta(e,l.key.path,t.batchId);i.push(s.delete(h)),c.push(l.key)}return f.waitFor(i).next((()=>c))}function Er(r){if(!r)return 0;let e;if(r.document)e=r.document;else if(r.unknownDocument)e=r.unknownDocument;else{if(!r.noDocument)throw I(14731);e=r.noDocument}return JSON.stringify(e).length}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ne.DEFAULT_COLLECTION_PERCENTILE=10,ne.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,ne.DEFAULT=new ne(Su,ne.DEFAULT_COLLECTION_PERCENTILE,ne.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),ne.DISABLED=new ne(-1,0,0);class Br{constructor(e,t,n,s){this.userId=e,this.serializer=t,this.indexManager=n,this.referenceDelegate=s,this.Xn={}}static wt(e,t,n,s){v(e.uid!=="",64387);const i=e.isAuthenticated()?e.uid:"";return new Br(i,t,n,s)}checkEmpty(e){let t=!0;const n=IDBKeyRange.bound([this.userId,Number.NEGATIVE_INFINITY],[this.userId,Number.POSITIVE_INFINITY]);return xe(e).ee({index:Ze,range:n},((s,i,o)=>{t=!1,o.done()})).next((()=>t))}addMutationBatch(e,t,n,s){const i=Vt(e),o=xe(e);return o.add({}).next((a=>{v(typeof a=="number",49019);const u=new Ws(a,t,n,s),c=(function(_,T,A){const E=A.baseMutations.map((b=>yr(_.yt,b))),N=A.mutations.map((b=>yr(_.yt,b)));return{userId:T,batchId:A.batchId,localWriteTimeMs:A.localWriteTime.toMillis(),baseMutations:E,mutations:N}})(this.serializer,this.userId,u),l=[];let h=new F(((d,_)=>V(d.canonicalString(),_.canonicalString())));for(const d of s){const _=Ta(this.userId,d.key.path,a);h=h.add(d.key.path.popLast()),l.push(o.put(c)),l.push(i.put(_,ul))}return h.forEach((d=>{l.push(this.indexManager.addToCollectionParentIndex(e,d))})),e.addOnCommittedListener((()=>{this.Xn[a]=u.keys()})),f.waitFor(l).next((()=>u))}))}lookupMutationBatch(e,t){return xe(e).get(t).next((n=>n?(v(n.userId===this.userId,48,"Unexpected user for mutation batch",{userId:n.userId,batchId:t}),Je(this.serializer,n)):null))}er(e,t){return this.Xn[t]?f.resolve(this.Xn[t]):this.lookupMutationBatch(e,t).next((n=>{if(n){const s=n.keys();return this.Xn[t]=s,s}return null}))}getNextMutationBatchAfterBatchId(e,t){const n=t+1,s=IDBKeyRange.lowerBound([this.userId,n]);let i=null;return xe(e).ee({index:Ze,range:s},((o,a,u)=>{a.userId===this.userId&&(v(a.batchId>=n,47524,{tr:n}),i=Je(this.serializer,a)),u.done()})).next((()=>i))}getHighestUnacknowledgedBatchId(e){const t=IDBKeyRange.upperBound([this.userId,Number.POSITIVE_INFINITY]);let n=tt;return xe(e).ee({index:Ze,range:t,reverse:!0},((s,i,o)=>{n=i.batchId,o.done()})).next((()=>n))}getAllMutationBatches(e){const t=IDBKeyRange.bound([this.userId,tt],[this.userId,Number.POSITIVE_INFINITY]);return xe(e).J(Ze,t).next((n=>n.map((s=>Je(this.serializer,s)))))}getAllMutationBatchesAffectingDocumentKey(e,t){const n=Zn(this.userId,t.path),s=IDBKeyRange.lowerBound(n),i=[];return Vt(e).ee({range:s},((o,a,u)=>{const[c,l,h]=o,d=ye(l);if(c===this.userId&&t.path.isEqual(d))return xe(e).get(h).next((_=>{if(!_)throw I(61480,{nr:o,batchId:h});v(_.userId===this.userId,10503,"Unexpected user for mutation batch",{userId:_.userId,batchId:h}),i.push(Je(this.serializer,_))}));u.done()})).next((()=>i))}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new F(V);const s=[];return t.forEach((i=>{const o=Zn(this.userId,i.path),a=IDBKeyRange.lowerBound(o),u=Vt(e).ee({range:a},((c,l,h)=>{const[d,_,T]=c,A=ye(_);d===this.userId&&i.path.isEqual(A)?n=n.add(T):h.done()}));s.push(u)})),f.waitFor(s).next((()=>this.rr(e,n)))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,s=n.length+1,i=Zn(this.userId,n),o=IDBKeyRange.lowerBound(i);let a=new F(V);return Vt(e).ee({range:o},((u,c,l)=>{const[h,d,_]=u,T=ye(d);h===this.userId&&n.isPrefixOf(T)?T.length===s&&(a=a.add(_)):l.done()})).next((()=>this.rr(e,a)))}rr(e,t){const n=[],s=[];return t.forEach((i=>{s.push(xe(e).get(i).next((o=>{if(o===null)throw I(35274,{batchId:i});v(o.userId===this.userId,9748,"Unexpected user for mutation batch",{userId:o.userId,batchId:i}),n.push(Je(this.serializer,o))})))})),f.waitFor(s).next((()=>n))}removeMutationBatch(e,t){return bu(e.le,this.userId,t).next((n=>(e.addOnCommittedListener((()=>{this.ir(t.batchId)})),f.forEach(n,(s=>this.referenceDelegate.markPotentiallyOrphaned(e,s))))))}ir(e){delete this.Xn[e]}performConsistencyCheck(e){return this.checkEmpty(e).next((t=>{if(!t)return f.resolve();const n=IDBKeyRange.lowerBound((function(o){return[o]})(this.userId)),s=[];return Vt(e).ee({range:n},((i,o,a)=>{if(i[0]===this.userId){const u=ye(i[1]);s.push(u)}else a.done()})).next((()=>{v(s.length===0,56720,{sr:s.map((i=>i.canonicalString()))})}))}))}containsKey(e,t){return Cu(e,this.userId,t)}_r(e){return Du(e).get(this.userId).next((t=>t||{userId:this.userId,lastAcknowledgedBatchId:tt,lastStreamToken:""}))}}function Cu(r,e,t){const n=Zn(e,t.path),s=n[1],i=IDBKeyRange.lowerBound(n);let o=!1;return Vt(r).ee({range:i,X:!0},((a,u,c)=>{const[l,h,d]=a;l===e&&h===s&&(o=!0),c.done()})).next((()=>o))}function xe(r){return J(r,_e)}function Vt(r){return J(r,Dt)}function Du(r){return J(r,yn)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ht{constructor(e){this.ar=e}next(){return this.ar+=2,this.ar}static ur(){return new ht(0)}static cr(){return new ht(-1)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xh{constructor(e,t){this.referenceDelegate=e,this.serializer=t}allocateTargetId(e){return this.lr(e).next((t=>{const n=new ht(t.highestTargetId);return t.highestTargetId=n.next(),this.hr(e,t).next((()=>t.highestTargetId))}))}getLastRemoteSnapshotVersion(e){return this.lr(e).next((t=>R.fromTimestamp(new k(t.lastRemoteSnapshotVersion.seconds,t.lastRemoteSnapshotVersion.nanoseconds))))}getHighestSequenceNumber(e){return this.lr(e).next((t=>t.highestListenSequenceNumber))}setTargetsMetadata(e,t,n){return this.lr(e).next((s=>(s.highestListenSequenceNumber=t,n&&(s.lastRemoteSnapshotVersion=n.toTimestamp()),t>s.highestListenSequenceNumber&&(s.highestListenSequenceNumber=t),this.hr(e,s))))}addTargetData(e,t){return this.Pr(e,t).next((()=>this.lr(e).next((n=>(n.targetCount+=1,this.Tr(t,n),this.hr(e,n))))))}updateTargetData(e,t){return this.Pr(e,t)}removeTargetData(e,t){return this.removeMatchingKeysForTargetId(e,t.targetId).next((()=>Et(e).delete(t.targetId))).next((()=>this.lr(e))).next((n=>(v(n.targetCount>0,8065),n.targetCount-=1,this.hr(e,n))))}removeTargets(e,t,n){let s=0;const i=[];return Et(e).ee(((o,a)=>{const u=sn(a);u.sequenceNumber<=t&&n.get(u.targetId)===null&&(s++,i.push(this.removeTargetData(e,u)))})).next((()=>f.waitFor(i))).next((()=>s))}forEachTarget(e,t){return Et(e).ee(((n,s)=>{const i=sn(s);t(i)}))}lr(e){return Co(e).get(fr).next((t=>(v(t!==null,2888),t)))}hr(e,t){return Co(e).put(fr,t)}Pr(e,t){return Et(e).put(vu(this.serializer,t))}Tr(e,t){let n=!1;return e.targetId>t.highestTargetId&&(t.highestTargetId=e.targetId,n=!0),e.sequenceNumber>t.highestListenSequenceNumber&&(t.highestListenSequenceNumber=e.sequenceNumber,n=!0),n}getTargetCount(e){return this.lr(e).next((t=>t.targetCount))}getTargetData(e,t){const n=ut(t),s=IDBKeyRange.bound([n,Number.NEGATIVE_INFINITY],[n,Number.POSITIVE_INFINITY]);let i=null;return Et(e).ee({range:s,index:Aa},((o,a,u)=>{const c=sn(a);xn(t,c.target)&&(i=c,u.done())})).next((()=>i))}addMatchingKeys(e,t,n){const s=[],i=ke(e);return t.forEach((o=>{const a=se(o.path);s.push(i.put({targetId:n,path:a})),s.push(this.referenceDelegate.addReference(e,n,o))})),f.waitFor(s)}removeMatchingKeys(e,t,n){const s=ke(e);return f.forEach(t,(i=>{const o=se(i.path);return f.waitFor([s.delete([n,o]),this.referenceDelegate.removeReference(e,n,i)])}))}removeMatchingKeysForTargetId(e,t){const n=ke(e),s=IDBKeyRange.bound([t],[t+1],!1,!0);return n.delete(s)}getMatchingKeysForTargetId(e,t){const n=IDBKeyRange.bound([t],[t+1],!1,!0),s=ke(e);let i=S();return s.ee({range:n,X:!0},((o,a,u)=>{const c=ye(o[1]),l=new y(c);i=i.add(l)})).next((()=>i))}containsKey(e,t){const n=se(t.path),s=IDBKeyRange.bound([n],[ha(n)],!1,!0);let i=0;return ke(e).ee({index:Ls,X:!0,range:s},(([o,a],u,c)=>{o!==0&&(i++,c.done())})).next((()=>i>0))}At(e,t){return Et(e).get(t).next((n=>n?sn(n):null))}}function Et(r){return J(r,xt)}function Co(r){return J(r,nt)}function ke(r){return J(r,Nt)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Do="LruGarbageCollector",xu=1048576;function xo([r,e],[t,n]){const s=V(r,t);return s===0?V(e,n):s}class Nh{constructor(e){this.Ir=e,this.buffer=new F(xo),this.Er=0}dr(){return++this.Er}Ar(e){const t=[e,this.dr()];if(this.buffer.size<this.Ir)this.buffer=this.buffer.add(t);else{const n=this.buffer.last();xo(t,n)<0&&(this.buffer=this.buffer.delete(n).add(t))}}get maxValue(){return this.buffer.last()[0]}}class Nu{constructor(e,t,n){this.garbageCollector=e,this.asyncQueue=t,this.localStore=n,this.Rr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.Vr(6e4)}stop(){this.Rr&&(this.Rr.cancel(),this.Rr=null)}get started(){return this.Rr!==null}Vr(e){g(Do,`Garbage collection scheduled in ${e}ms`),this.Rr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,(async()=>{this.Rr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(t){Ke(t)?g(Do,"Ignoring IndexedDB error during garbage collection: ",t):await ze(t)}await this.Vr(3e5)}))}}class kh{constructor(e,t){this.mr=e,this.params=t}calculateTargetCount(e,t){return this.mr.gr(e).next((n=>Math.floor(t/100*n)))}nthSequenceNumber(e,t){if(t===0)return f.resolve(ae.ce);const n=new Nh(t);return this.mr.forEachTarget(e,(s=>n.Ar(s.sequenceNumber))).next((()=>this.mr.pr(e,(s=>n.Ar(s))))).next((()=>n.maxValue))}removeTargets(e,t,n){return this.mr.removeTargets(e,t,n)}removeOrphanedDocuments(e,t){return this.mr.removeOrphanedDocuments(e,t)}collect(e,t){return this.params.cacheSizeCollectionThreshold===-1?(g("LruGarbageCollector","Garbage collection skipped; disabled"),f.resolve(bo)):this.getCacheSize(e).next((n=>n<this.params.cacheSizeCollectionThreshold?(g("LruGarbageCollector",`Garbage collection skipped; Cache size ${n} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),bo):this.yr(e,t)))}getCacheSize(e){return this.mr.getCacheSize(e)}yr(e,t){let n,s,i,o,a,u,c;const l=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next((h=>(h>this.params.maximumSequenceNumbersToCollect?(g("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${h}`),s=this.params.maximumSequenceNumbersToCollect):s=h,o=Date.now(),this.nthSequenceNumber(e,s)))).next((h=>(n=h,a=Date.now(),this.removeTargets(e,n,t)))).next((h=>(i=h,u=Date.now(),this.removeOrphanedDocuments(e,n)))).next((h=>(c=Date.now(),At()<=Re.DEBUG&&g("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${o-l}ms
	Determined least recently used ${s} in `+(a-o)+`ms
	Removed ${i} targets in `+(u-a)+`ms
	Removed ${h} documents in `+(c-u)+`ms
Total Duration: ${c-l}ms`),f.resolve({didRun:!0,sequenceNumbersCollected:s,targetsRemoved:i,documentsRemoved:h}))))}}function ku(r,e){return new kh(r,e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mh{constructor(e,t){this.db=e,this.garbageCollector=ku(this,t)}gr(e){const t=this.wr(e);return this.db.getTargetCache().getTargetCount(e).next((n=>t.next((s=>n+s))))}wr(e){let t=0;return this.pr(e,(n=>{t++})).next((()=>t))}forEachTarget(e,t){return this.db.getTargetCache().forEachTarget(e,t)}pr(e,t){return this.Sr(e,((n,s)=>t(s)))}addReference(e,t,n){return Hn(e,n)}removeReference(e,t,n){return Hn(e,n)}removeTargets(e,t,n){return this.db.getTargetCache().removeTargets(e,t,n)}markPotentiallyOrphaned(e,t){return Hn(e,t)}br(e,t){return(function(s,i){let o=!1;return Du(s).te((a=>Cu(s,a,i).next((u=>(u&&(o=!0),f.resolve(!u)))))).next((()=>o))})(e,t)}removeOrphanedDocuments(e,t){const n=this.db.getRemoteDocumentCache().newChangeBuffer(),s=[];let i=0;return this.Sr(e,((o,a)=>{if(a<=t){const u=this.br(e,o).next((c=>{if(!c)return i++,n.getEntry(e,o).next((()=>(n.removeEntry(o,R.min()),ke(e).delete((function(h){return[0,se(h.path)]})(o)))))}));s.push(u)}})).next((()=>f.waitFor(s))).next((()=>n.apply(e))).next((()=>i))}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.db.getTargetCache().updateTargetData(e,n)}updateLimboDocument(e,t){return Hn(e,t)}Sr(e,t){const n=ke(e);let s,i=ae.ce;return n.ee({index:Ls},(([o,a],{path:u,sequenceNumber:c})=>{o===0?(i!==ae.ce&&t(new y(ye(s)),i),i=c,s=u):i=ae.ce})).next((()=>{i!==ae.ce&&t(new y(ye(s)),i)}))}getCacheSize(e){return this.db.getRemoteDocumentCache().getSize(e)}}function Hn(r,e){return ke(r).put((function(n,s){return{targetId:0,path:se(n.path),sequenceNumber:s}})(e,r.currentSequenceNumber))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mu{constructor(){this.changes=new be((e=>e.toString()),((e,t)=>e.isEqual(t))),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,z.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();const n=this.changes.get(t);return n!==void 0?f.resolve(n):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fh{constructor(e){this.serializer=e}setIndexManager(e){this.indexManager=e}addEntry(e,t,n){return je(e).put(n)}removeEntry(e,t,n){return je(e).delete((function(i,o){const a=i.path.toArray();return[a.slice(0,a.length-2),a[a.length-2],Ir(o),a[a.length-1]]})(t,n))}updateMetadata(e,t){return this.getMetadata(e).next((n=>(n.byteSize+=t,this.Dr(e,n))))}getEntry(e,t){let n=z.newInvalidDocument(t);return je(e).ee({index:er,range:IDBKeyRange.only(en(t))},((s,i)=>{n=this.Cr(t,i)})).next((()=>n))}vr(e,t){let n={size:0,document:z.newInvalidDocument(t)};return je(e).ee({index:er,range:IDBKeyRange.only(en(t))},((s,i)=>{n={document:this.Cr(t,i),size:Er(i)}})).next((()=>n))}getEntries(e,t){let n=le();return this.Fr(e,t,((s,i)=>{const o=this.Cr(s,i);n=n.insert(s,o)})).next((()=>n))}Mr(e,t){let n=le(),s=new O(y.comparator);return this.Fr(e,t,((i,o)=>{const a=this.Cr(i,o);n=n.insert(i,a),s=s.insert(i,Er(o))})).next((()=>({documents:n,Or:s})))}Fr(e,t,n){if(t.isEmpty())return f.resolve();let s=new F(Mo);t.forEach((u=>s=s.add(u)));const i=IDBKeyRange.bound(en(s.first()),en(s.last())),o=s.getIterator();let a=o.getNext();return je(e).ee({index:er,range:i},((u,c,l)=>{const h=y.fromSegments([...c.prefixPath,c.collectionGroup,c.documentId]);for(;a&&Mo(a,h)<0;)n(a,null),a=o.getNext();a&&a.isEqual(h)&&(n(a,c),a=o.hasNext()?o.getNext():null),a?l.j(en(a)):l.done()})).next((()=>{for(;a;)n(a,null),a=o.hasNext()?o.getNext():null}))}getDocumentsMatchingQuery(e,t,n,s,i){const o=t.path,a=[o.popLast().toArray(),o.lastSegment(),Ir(n.readTime),n.documentKey.path.isEmpty()?"":n.documentKey.path.lastSegment()],u=[o.popLast().toArray(),o.lastSegment(),[Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],""];return je(e).J(IDBKeyRange.bound(a,u,!0)).next((c=>{i==null||i.incrementDocumentReadCount(c.length);let l=le();for(const h of c){const d=this.Cr(y.fromSegments(h.prefixPath.concat(h.collectionGroup,h.documentId)),h);d.isFoundDocument()&&(Mn(t,d)||s.has(d.key))&&(l=l.insert(d.key,d))}return l}))}getAllFromCollectionGroup(e,t,n,s){let i=le();const o=ko(t,n),a=ko(t,de.max());return je(e).ee({index:Ea,range:IDBKeyRange.bound(o,a,!0)},((u,c,l)=>{const h=this.Cr(y.fromSegments(c.prefixPath.concat(c.collectionGroup,c.documentId)),c);i=i.insert(h.key,h),i.size===s&&l.done()})).next((()=>i))}newChangeBuffer(e){return new Oh(this,!!e&&e.trackRemovals)}getSize(e){return this.getMetadata(e).next((t=>t.byteSize))}getMetadata(e){return No(e).get(us).next((t=>(v(!!t,20021),t)))}Dr(e,t){return No(e).put(us,t)}Cr(e,t){if(t){const n=Ah(this.serializer,t);if(!(n.isNoDocument()&&n.version.isEqual(R.min())))return n}return z.newInvalidDocument(e)}}function Fu(r){return new Fh(r)}class Oh extends Mu{constructor(e,t){super(),this.Nr=e,this.trackRemovals=t,this.Br=new be((n=>n.toString()),((n,s)=>n.isEqual(s)))}applyChanges(e){const t=[];let n=0,s=new F(((i,o)=>V(i.canonicalString(),o.canonicalString())));return this.changes.forEach(((i,o)=>{const a=this.Br.get(i);if(t.push(this.Nr.removeEntry(e,i,a.readTime)),o.isValidDocument()){const u=go(this.Nr.serializer,o);s=s.add(i.path.popLast());const c=Er(u);n+=c-a.size,t.push(this.Nr.addEntry(e,i,u))}else if(n-=a.size,this.trackRemovals){const u=go(this.Nr.serializer,o.convertToNoDocument(R.min()));t.push(this.Nr.addEntry(e,i,u))}})),s.forEach((i=>{t.push(this.Nr.indexManager.addToCollectionParentIndex(e,i))})),t.push(this.Nr.updateMetadata(e,n)),f.waitFor(t)}getFromCache(e,t){return this.Nr.vr(e,t).next((n=>(this.Br.set(t,{size:n.size,readTime:n.document.readTime}),n.document)))}getAllFromCache(e,t){return this.Nr.Mr(e,t).next((({documents:n,Or:s})=>(s.forEach(((i,o)=>{this.Br.set(i,{size:o,readTime:n.get(i).readTime})})),n)))}}function No(r){return J(r,In)}function je(r){return J(r,dr)}function en(r){const e=r.path.toArray();return[e.slice(0,e.length-2),e[e.length-2],e[e.length-1]]}function ko(r,e){const t=e.documentKey.path.toArray();return[r,Ir(e.readTime),t.slice(0,t.length-2),t.length>0?t[t.length-1]:""]}function Mo(r,e){const t=r.path.toArray(),n=e.path.toArray();let s=0;for(let i=0;i<t.length-2&&i<n.length-2;++i)if(s=V(t[i],n[i]),s)return s;return s=V(t.length,n.length),s||(s=V(t[t.length-2],n[n.length-2]),s||V(t[t.length-1],n[n.length-1]))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lh{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ou{constructor(e,t,n,s){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=n,this.indexManager=s}getDocument(e,t){let n=null;return this.documentOverlayCache.getOverlay(e,t).next((s=>(n=s,this.remoteDocumentCache.getEntry(e,t)))).next((s=>(n!==null&&mn(n.mutation,s,ue.empty(),k.now()),s)))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next((n=>this.getLocalViewOfDocuments(e,n,S()).next((()=>n))))}getLocalViewOfDocuments(e,t,n=S()){const s=Ie();return this.populateOverlays(e,s,t).next((()=>this.computeViews(e,t,s,n).next((i=>{let o=nn();return i.forEach(((a,u)=>{o=o.insert(a,u.overlayedDocument)})),o}))))}getOverlayedDocuments(e,t){const n=Ie();return this.populateOverlays(e,n,t).next((()=>this.computeViews(e,t,n,S())))}populateOverlays(e,t,n){const s=[];return n.forEach((i=>{t.has(i)||s.push(i)})),this.documentOverlayCache.getOverlays(e,s).next((i=>{i.forEach(((o,a)=>{t.set(o,a)}))}))}computeViews(e,t,n,s){let i=le();const o=fn(),a=(function(){return fn()})();return t.forEach(((u,c)=>{const l=n.get(c.key);s.has(c.key)&&(l===void 0||l.mutation instanceof Ce)?i=i.insert(c.key,c):l!==void 0?(o.set(c.key,l.mutation.getFieldMask()),mn(l.mutation,c,l.mutation.getFieldMask(),k.now())):o.set(c.key,ue.empty())})),this.recalculateAndSaveOverlays(e,i).next((u=>(u.forEach(((c,l)=>o.set(c,l))),t.forEach(((c,l)=>a.set(c,new Lh(l,o.get(c)??null)))),a)))}recalculateAndSaveOverlays(e,t){const n=fn();let s=new O(((o,a)=>o-a)),i=S();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next((o=>{for(const a of o)a.keys().forEach((u=>{const c=t.get(u);if(c===null)return;let l=n.get(u)||ue.empty();l=a.applyToLocalView(c,l),n.set(u,l);const h=(s.get(a.batchId)||S()).add(u);s=s.insert(a.batchId,h)}))})).next((()=>{const o=[],a=s.getReverseIterator();for(;a.hasNext();){const u=a.getNext(),c=u.key,l=u.value,h=eu();l.forEach((d=>{if(!i.has(d)){const _=ou(t.get(d),n.get(d));_!==null&&h.set(d,_),i=i.add(d)}})),o.push(this.documentOverlayCache.saveOverlays(e,c,h))}return f.waitFor(o)})).next((()=>n))}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next((n=>this.recalculateAndSaveOverlays(e,n)))}getDocumentsMatchingQuery(e,t,n,s){return(function(o){return y.isDocumentKey(o.path)&&o.collectionGroup===null&&o.filters.length===0})(t)?this.getDocumentsMatchingDocumentQuery(e,t.path):Wa(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,n,s):this.getDocumentsMatchingCollectionQuery(e,t,n,s)}getNextDocuments(e,t,n,s){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,n,s).next((i=>{const o=s-i.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,n.largestBatchId,s-i.size):f.resolve(Ie());let a=Ct,u=i;return o.next((c=>f.forEach(c,((l,h)=>(a<h.largestBatchId&&(a=h.largestBatchId),i.get(l)?f.resolve():this.remoteDocumentCache.getEntry(e,l).next((d=>{u=u.insert(l,d)}))))).next((()=>this.populateOverlays(e,c,i))).next((()=>this.computeViews(e,u,c,S()))).next((l=>({batchId:a,changes:Za(l)})))))}))}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new y(t)).next((n=>{let s=nn();return n.isFoundDocument()&&(s=s.insert(n.key,n)),s}))}getDocumentsMatchingCollectionGroupQuery(e,t,n,s){const i=t.collectionGroup;let o=nn();return this.indexManager.getCollectionParents(e,i).next((a=>f.forEach(a,(u=>{const c=(function(h,d){return new Nn(d,null,h.explicitOrderBy.slice(),h.filters.slice(),h.limit,h.limitType,h.startAt,h.endAt)})(t,u.child(i));return this.getDocumentsMatchingCollectionQuery(e,c,n,s).next((l=>{l.forEach(((h,d)=>{o=o.insert(h,d)}))}))})).next((()=>o))))}getDocumentsMatchingCollectionQuery(e,t,n,s){let i;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,n.largestBatchId).next((o=>(i=o,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,n,i,s)))).next((o=>{i.forEach(((u,c)=>{const l=c.getKey();o.get(l)===null&&(o=o.insert(l,z.newInvalidDocument(l)))}));let a=nn();return o.forEach(((u,c)=>{const l=i.get(u);l!==void 0&&mn(l.mutation,c,ue.empty(),k.now()),Mn(t,c)&&(a=a.insert(u,c))})),a}))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Uh{constructor(e){this.serializer=e,this.Lr=new Map,this.kr=new Map}getBundleMetadata(e,t){return f.resolve(this.Lr.get(t))}saveBundleMetadata(e,t){return this.Lr.set(t.id,(function(s){return{id:s.id,version:s.version,createTime:oe(s.createTime)}})(t)),f.resolve()}getNamedQuery(e,t){return f.resolve(this.kr.get(t))}saveNamedQuery(e,t){return this.kr.set(t.name,(function(s){return{name:s.name,query:Ru(s.bundledQuery),readTime:oe(s.readTime)}})(t)),f.resolve()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qh{constructor(){this.overlays=new O(y.comparator),this.qr=new Map}getOverlay(e,t){return f.resolve(this.overlays.get(t))}getOverlays(e,t){const n=Ie();return f.forEach(t,(s=>this.getOverlay(e,s).next((i=>{i!==null&&n.set(s,i)})))).next((()=>n))}saveOverlays(e,t,n){return n.forEach(((s,i)=>{this.St(e,t,i)})),f.resolve()}removeOverlaysForBatchId(e,t,n){const s=this.qr.get(n);return s!==void 0&&(s.forEach((i=>this.overlays=this.overlays.remove(i))),this.qr.delete(n)),f.resolve()}getOverlaysForCollection(e,t,n){const s=Ie(),i=t.length+1,o=new y(t.child("")),a=this.overlays.getIteratorFrom(o);for(;a.hasNext();){const u=a.getNext().value,c=u.getKey();if(!t.isPrefixOf(c.path))break;c.path.length===i&&u.largestBatchId>n&&s.set(u.getKey(),u)}return f.resolve(s)}getOverlaysForCollectionGroup(e,t,n,s){let i=new O(((c,l)=>c-l));const o=this.overlays.getIterator();for(;o.hasNext();){const c=o.getNext().value;if(c.getKey().getCollectionGroup()===t&&c.largestBatchId>n){let l=i.get(c.largestBatchId);l===null&&(l=Ie(),i=i.insert(c.largestBatchId,l)),l.set(c.getKey(),c)}}const a=Ie(),u=i.getIterator();for(;u.hasNext()&&(u.getNext().value.forEach(((c,l)=>a.set(c,l))),!(a.size()>=s)););return f.resolve(a)}St(e,t,n){const s=this.overlays.get(n.key);if(s!==null){const o=this.qr.get(s.largestBatchId).delete(n.key);this.qr.set(s.largestBatchId,o)}this.overlays=this.overlays.insert(n.key,new Js(t,n));let i=this.qr.get(t);i===void 0&&(i=S(),this.qr.set(t,i)),this.qr.set(t,i.add(n.key))}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bh{constructor(){this.sessionToken=j.EMPTY_BYTE_STRING}getSessionToken(e){return f.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,f.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ti{constructor(){this.Qr=new F(Y.$r),this.Ur=new F(Y.Kr)}isEmpty(){return this.Qr.isEmpty()}addReference(e,t){const n=new Y(e,t);this.Qr=this.Qr.add(n),this.Ur=this.Ur.add(n)}Wr(e,t){e.forEach((n=>this.addReference(n,t)))}removeReference(e,t){this.Gr(new Y(e,t))}zr(e,t){e.forEach((n=>this.removeReference(n,t)))}jr(e){const t=new y(new x([])),n=new Y(t,e),s=new Y(t,e+1),i=[];return this.Ur.forEachInRange([n,s],(o=>{this.Gr(o),i.push(o.key)})),i}Jr(){this.Qr.forEach((e=>this.Gr(e)))}Gr(e){this.Qr=this.Qr.delete(e),this.Ur=this.Ur.delete(e)}Hr(e){const t=new y(new x([])),n=new Y(t,e),s=new Y(t,e+1);let i=S();return this.Ur.forEachInRange([n,s],(o=>{i=i.add(o.key)})),i}containsKey(e){const t=new Y(e,0),n=this.Qr.firstAfterOrEqual(t);return n!==null&&e.isEqual(n.key)}}class Y{constructor(e,t){this.key=e,this.Yr=t}static $r(e,t){return y.comparator(e.key,t.key)||V(e.Yr,t.Yr)}static Kr(e,t){return V(e.Yr,t.Yr)||y.comparator(e.key,t.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zh{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.tr=1,this.Zr=new F(Y.$r)}checkEmpty(e){return f.resolve(this.mutationQueue.length===0)}addMutationBatch(e,t,n,s){const i=this.tr;this.tr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const o=new Ws(i,t,n,s);this.mutationQueue.push(o);for(const a of s)this.Zr=this.Zr.add(new Y(a.key,i)),this.indexManager.addToCollectionParentIndex(e,a.key.path.popLast());return f.resolve(o)}lookupMutationBatch(e,t){return f.resolve(this.Xr(t))}getNextMutationBatchAfterBatchId(e,t){const n=t+1,s=this.ei(n),i=s<0?0:s;return f.resolve(this.mutationQueue.length>i?this.mutationQueue[i]:null)}getHighestUnacknowledgedBatchId(){return f.resolve(this.mutationQueue.length===0?tt:this.tr-1)}getAllMutationBatches(e){return f.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){const n=new Y(t,0),s=new Y(t,Number.POSITIVE_INFINITY),i=[];return this.Zr.forEachInRange([n,s],(o=>{const a=this.Xr(o.Yr);i.push(a)})),f.resolve(i)}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new F(V);return t.forEach((s=>{const i=new Y(s,0),o=new Y(s,Number.POSITIVE_INFINITY);this.Zr.forEachInRange([i,o],(a=>{n=n.add(a.Yr)}))})),f.resolve(this.ti(n))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,s=n.length+1;let i=n;y.isDocumentKey(i)||(i=i.child(""));const o=new Y(new y(i),0);let a=new F(V);return this.Zr.forEachWhile((u=>{const c=u.key.path;return!!n.isPrefixOf(c)&&(c.length===s&&(a=a.add(u.Yr)),!0)}),o),f.resolve(this.ti(a))}ti(e){const t=[];return e.forEach((n=>{const s=this.Xr(n);s!==null&&t.push(s)})),t}removeMutationBatch(e,t){v(this.ni(t.batchId,"removed")===0,55003),this.mutationQueue.shift();let n=this.Zr;return f.forEach(t.mutations,(s=>{const i=new Y(s.key,t.batchId);return n=n.delete(i),this.referenceDelegate.markPotentiallyOrphaned(e,s.key)})).next((()=>{this.Zr=n}))}ir(e){}containsKey(e,t){const n=new Y(t,0),s=this.Zr.firstAfterOrEqual(n);return f.resolve(t.isEqual(s&&s.key))}performConsistencyCheck(e){return this.mutationQueue.length,f.resolve()}ni(e,t){return this.ei(e)}ei(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}Xr(e){const t=this.ei(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kh{constructor(e){this.ri=e,this.docs=(function(){return new O(y.comparator)})(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){const n=t.key,s=this.docs.get(n),i=s?s.size:0,o=this.ri(t);return this.docs=this.docs.insert(n,{document:t.mutableCopy(),size:o}),this.size+=o-i,this.indexManager.addToCollectionParentIndex(e,n.path.popLast())}removeEntry(e){const t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){const n=this.docs.get(t);return f.resolve(n?n.document.mutableCopy():z.newInvalidDocument(t))}getEntries(e,t){let n=le();return t.forEach((s=>{const i=this.docs.get(s);n=n.insert(s,i?i.document.mutableCopy():z.newInvalidDocument(s))})),f.resolve(n)}getDocumentsMatchingQuery(e,t,n,s){let i=le();const o=t.path,a=new y(o.child("__id-9223372036854775808__")),u=this.docs.getIteratorFrom(a);for(;u.hasNext();){const{key:c,value:{document:l}}=u.getNext();if(!o.isPrefixOf(c.path))break;c.path.length>o.length+1||Fs(_a(l),n)<=0||(s.has(l.key)||Mn(t,l))&&(i=i.insert(l.key,l.mutableCopy()))}return f.resolve(i)}getAllFromCollectionGroup(e,t,n,s){I(9500)}ii(e,t){return f.forEach(this.docs,(n=>t(n)))}newChangeBuffer(e){return new Gh(this)}getSize(e){return f.resolve(this.size)}}class Gh extends Mu{constructor(e){super(),this.Nr=e}applyChanges(e){const t=[];return this.changes.forEach(((n,s)=>{s.isValidDocument()?t.push(this.Nr.addEntry(e,s)):this.Nr.removeEntry(n)})),f.waitFor(t)}getFromCache(e,t){return this.Nr.getEntry(e,t)}getAllFromCache(e,t){return this.Nr.getEntries(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $h{constructor(e){this.persistence=e,this.si=new be((t=>ut(t)),xn),this.lastRemoteSnapshotVersion=R.min(),this.highestTargetId=0,this.oi=0,this._i=new ti,this.targetCount=0,this.ai=ht.ur()}forEachTarget(e,t){return this.si.forEach(((n,s)=>t(s))),f.resolve()}getLastRemoteSnapshotVersion(e){return f.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return f.resolve(this.oi)}allocateTargetId(e){return this.highestTargetId=this.ai.next(),f.resolve(this.highestTargetId)}setTargetsMetadata(e,t,n){return n&&(this.lastRemoteSnapshotVersion=n),t>this.oi&&(this.oi=t),f.resolve()}Pr(e){this.si.set(e.target,e);const t=e.targetId;t>this.highestTargetId&&(this.ai=new ht(t),this.highestTargetId=t),e.sequenceNumber>this.oi&&(this.oi=e.sequenceNumber)}addTargetData(e,t){return this.Pr(t),this.targetCount+=1,f.resolve()}updateTargetData(e,t){return this.Pr(t),f.resolve()}removeTargetData(e,t){return this.si.delete(t.target),this._i.jr(t.targetId),this.targetCount-=1,f.resolve()}removeTargets(e,t,n){let s=0;const i=[];return this.si.forEach(((o,a)=>{a.sequenceNumber<=t&&n.get(a.targetId)===null&&(this.si.delete(o),i.push(this.removeMatchingKeysForTargetId(e,a.targetId)),s++)})),f.waitFor(i).next((()=>s))}getTargetCount(e){return f.resolve(this.targetCount)}getTargetData(e,t){const n=this.si.get(t)||null;return f.resolve(n)}addMatchingKeys(e,t,n){return this._i.Wr(t,n),f.resolve()}removeMatchingKeys(e,t,n){this._i.zr(t,n);const s=this.persistence.referenceDelegate,i=[];return s&&t.forEach((o=>{i.push(s.markPotentiallyOrphaned(e,o))})),f.waitFor(i)}removeMatchingKeysForTargetId(e,t){return this._i.jr(t),f.resolve()}getMatchingKeysForTargetId(e,t){const n=this._i.Hr(t);return f.resolve(n)}containsKey(e,t){return f.resolve(this._i.containsKey(t))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ni{constructor(e,t){this.ui={},this.overlays={},this.ci=new ae(0),this.li=!1,this.li=!0,this.hi=new Bh,this.referenceDelegate=e(this),this.Pi=new $h(this),this.indexManager=new Ch,this.remoteDocumentCache=(function(s){return new Kh(s)})((n=>this.referenceDelegate.Ti(n))),this.serializer=new wu(t),this.Ii=new Uh(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.li=!1,Promise.resolve()}get started(){return this.li}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new qh,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let n=this.ui[e.toKey()];return n||(n=new zh(t,this.referenceDelegate),this.ui[e.toKey()]=n),n}getGlobalsCache(){return this.hi}getTargetCache(){return this.Pi}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Ii}runTransaction(e,t,n){g("MemoryPersistence","Starting transaction:",e);const s=new jh(this.ci.next());return this.referenceDelegate.Ei(),n(s).next((i=>this.referenceDelegate.di(s).next((()=>i)))).toPromise().then((i=>(s.raiseOnCommittedEvent(),i)))}Ai(e,t){return f.or(Object.values(this.ui).map((n=>()=>n.containsKey(e,t))))}}class jh extends pa{constructor(e){super(),this.currentSequenceNumber=e}}class zr{constructor(e){this.persistence=e,this.Ri=new ti,this.Vi=null}static mi(e){return new zr(e)}get fi(){if(this.Vi)return this.Vi;throw I(60996)}addReference(e,t,n){return this.Ri.addReference(n,t),this.fi.delete(n.toString()),f.resolve()}removeReference(e,t,n){return this.Ri.removeReference(n,t),this.fi.add(n.toString()),f.resolve()}markPotentiallyOrphaned(e,t){return this.fi.add(t.toString()),f.resolve()}removeTarget(e,t){this.Ri.jr(t.targetId).forEach((s=>this.fi.add(s.toString())));const n=this.persistence.getTargetCache();return n.getMatchingKeysForTargetId(e,t.targetId).next((s=>{s.forEach((i=>this.fi.add(i.toString())))})).next((()=>n.removeTargetData(e,t)))}Ei(){this.Vi=new Set}di(e){const t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return f.forEach(this.fi,(n=>{const s=y.fromPath(n);return this.gi(e,s).next((i=>{i||t.removeEntry(s,R.min())}))})).next((()=>(this.Vi=null,t.apply(e))))}updateLimboDocument(e,t){return this.gi(e,t).next((n=>{n?this.fi.delete(t.toString()):this.fi.add(t.toString())}))}Ti(e){return 0}gi(e,t){return f.or([()=>f.resolve(this.Ri.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.Ai(e,t)])}}class Ar{constructor(e,t){this.persistence=e,this.pi=new be((n=>se(n.path)),((n,s)=>n.isEqual(s))),this.garbageCollector=ku(this,t)}static mi(e,t){return new Ar(e,t)}Ei(){}di(e){return f.resolve()}forEachTarget(e,t){return this.persistence.getTargetCache().forEachTarget(e,t)}gr(e){const t=this.wr(e);return this.persistence.getTargetCache().getTargetCount(e).next((n=>t.next((s=>n+s))))}wr(e){let t=0;return this.pr(e,(n=>{t++})).next((()=>t))}pr(e,t){return f.forEach(this.pi,((n,s)=>this.br(e,n,s).next((i=>i?f.resolve():t(s)))))}removeTargets(e,t,n){return this.persistence.getTargetCache().removeTargets(e,t,n)}removeOrphanedDocuments(e,t){let n=0;const s=this.persistence.getRemoteDocumentCache(),i=s.newChangeBuffer();return s.ii(e,(o=>this.br(e,o,t).next((a=>{a||(n++,i.removeEntry(o,R.min()))})))).next((()=>i.apply(e))).next((()=>n))}markPotentiallyOrphaned(e,t){return this.pi.set(t,e.currentSequenceNumber),f.resolve()}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,n)}addReference(e,t,n){return this.pi.set(n,e.currentSequenceNumber),f.resolve()}removeReference(e,t,n){return this.pi.set(n,e.currentSequenceNumber),f.resolve()}updateLimboDocument(e,t){return this.pi.set(t,e.currentSequenceNumber),f.resolve()}Ti(e){let t=e.key.toString().length;return e.isFoundDocument()&&(t+=nr(e.data.value)),t}br(e,t,n){return f.or([()=>this.persistence.Ai(e,t),()=>this.persistence.getTargetCache().containsKey(e,t),()=>{const s=this.pi.get(t);return f.resolve(s!==void 0&&s>n)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qh{constructor(e){this.serializer=e}k(e,t,n,s){const i=new Cr("createOrUpgrade",t);n<1&&s>=1&&((function(u){u.createObjectStore(Dn)})(e),(function(u){u.createObjectStore(yn,{keyPath:al}),u.createObjectStore(_e,{keyPath:$i,autoIncrement:!0}).createIndex(Ze,ji,{unique:!0}),u.createObjectStore(Dt)})(e),Fo(e),(function(u){u.createObjectStore(We)})(e));let o=f.resolve();return n<3&&s>=3&&(n!==0&&((function(u){u.deleteObjectStore(Nt),u.deleteObjectStore(xt),u.deleteObjectStore(nt)})(e),Fo(e)),o=o.next((()=>(function(u){const c=u.store(nt),l={highestTargetId:0,highestListenSequenceNumber:0,lastRemoteSnapshotVersion:R.min().toTimestamp(),targetCount:0};return c.put(fr,l)})(i)))),n<4&&s>=4&&(n!==0&&(o=o.next((()=>(function(u,c){return c.store(_e).J().next((h=>{u.deleteObjectStore(_e),u.createObjectStore(_e,{keyPath:$i,autoIncrement:!0}).createIndex(Ze,ji,{unique:!0});const d=c.store(_e),_=h.map((T=>d.put(T)));return f.waitFor(_)}))})(e,i)))),o=o.next((()=>{(function(u){u.createObjectStore(kt,{keyPath:gl})})(e)}))),n<5&&s>=5&&(o=o.next((()=>this.yi(i)))),n<6&&s>=6&&(o=o.next((()=>((function(u){u.createObjectStore(In)})(e),this.wi(i))))),n<7&&s>=7&&(o=o.next((()=>this.Si(i)))),n<8&&s>=8&&(o=o.next((()=>this.bi(e,i)))),n<9&&s>=9&&(o=o.next((()=>{(function(u){u.objectStoreNames.contains("remoteDocumentChanges")&&u.deleteObjectStore("remoteDocumentChanges")})(e)}))),n<10&&s>=10&&(o=o.next((()=>this.Di(i)))),n<11&&s>=11&&(o=o.next((()=>{(function(u){u.createObjectStore(xr,{keyPath:pl})})(e),(function(u){u.createObjectStore(Nr,{keyPath:yl})})(e)}))),n<12&&s>=12&&(o=o.next((()=>{(function(u){const c=u.createObjectStore(kr,{keyPath:Rl});c.createIndex(ls,Vl,{unique:!1}),c.createIndex(Ra,Pl,{unique:!1})})(e)}))),n<13&&s>=13&&(o=o.next((()=>(function(u){const c=u.createObjectStore(dr,{keyPath:cl});c.createIndex(er,ll),c.createIndex(Ea,hl)})(e))).next((()=>this.Ci(e,i))).next((()=>e.deleteObjectStore(We)))),n<14&&s>=14&&(o=o.next((()=>this.Fi(e,i)))),n<15&&s>=15&&(o=o.next((()=>(function(u){u.createObjectStore(Us,{keyPath:Il,autoIncrement:!0}).createIndex(cs,Tl,{unique:!1}),u.createObjectStore(cn,{keyPath:El}).createIndex(wa,Al,{unique:!1}),u.createObjectStore(ln,{keyPath:wl}).createIndex(va,vl,{unique:!1})})(e)))),n<16&&s>=16&&(o=o.next((()=>{t.objectStore(cn).clear()})).next((()=>{t.objectStore(ln).clear()}))),n<17&&s>=17&&(o=o.next((()=>{(function(u){u.createObjectStore(qs,{keyPath:Sl})})(e)}))),n<18&&s>=18&&ua()&&(o=o.next((()=>{t.objectStore(cn).clear()})).next((()=>{t.objectStore(ln).clear()}))),o}wi(e){let t=0;return e.store(We).ee(((n,s)=>{t+=Er(s)})).next((()=>{const n={byteSize:t};return e.store(In).put(us,n)}))}yi(e){const t=e.store(yn),n=e.store(_e);return t.J().next((s=>f.forEach(s,(i=>{const o=IDBKeyRange.bound([i.userId,tt],[i.userId,i.lastAcknowledgedBatchId]);return n.J(Ze,o).next((a=>f.forEach(a,(u=>{v(u.userId===i.userId,18650,"Cannot process batch from unexpected user",{batchId:u.batchId});const c=Je(this.serializer,u);return bu(e,i.userId,c).next((()=>{}))}))))}))))}Si(e){const t=e.store(Nt),n=e.store(We);return e.store(nt).get(fr).next((s=>{const i=[];return n.ee(((o,a)=>{const u=new x(o),c=(function(h){return[0,se(h)]})(u);i.push(t.get(c).next((l=>l?f.resolve():(h=>t.put({targetId:0,path:se(h),sequenceNumber:s.highestListenSequenceNumber}))(u))))})).next((()=>f.waitFor(i)))}))}bi(e,t){e.createObjectStore(Tn,{keyPath:_l});const n=t.store(Tn),s=new ei,i=o=>{if(s.add(o)){const a=o.lastSegment(),u=o.popLast();return n.put({collectionId:a,parent:se(u)})}};return t.store(We).ee({X:!0},((o,a)=>{const u=new x(o);return i(u.popLast())})).next((()=>t.store(Dt).ee({X:!0},(([o,a,u],c)=>{const l=ye(a);return i(l.popLast())}))))}Di(e){const t=e.store(xt);return t.ee(((n,s)=>{const i=sn(s),o=vu(this.serializer,i);return t.put(o)}))}Ci(e,t){const n=t.store(We),s=[];return n.ee(((i,o)=>{const a=t.store(dr),u=(function(h){return h.document?new y(x.fromString(h.document.name).popFirst(5)):h.noDocument?y.fromSegments(h.noDocument.path):h.unknownDocument?y.fromSegments(h.unknownDocument.path):I(36783)})(o).path.toArray(),c={prefixPath:u.slice(0,u.length-2),collectionGroup:u[u.length-2],documentId:u[u.length-1],readTime:o.readTime||[0,0],unknownDocument:o.unknownDocument,noDocument:o.noDocument,document:o.document,hasCommittedMutations:!!o.hasCommittedMutations};s.push(a.put(c))})).next((()=>f.waitFor(s)))}Fi(e,t){const n=t.store(_e),s=Fu(this.serializer),i=new ni(zr.mi,this.serializer.yt);return n.J().next((o=>{const a=new Map;return o.forEach((u=>{let c=a.get(u.userId)??S();Je(this.serializer,u).keys().forEach((l=>c=c.add(l))),a.set(u.userId,c)})),f.forEach(a,((u,c)=>{const l=new X(c),h=qr.wt(this.serializer,l),d=i.getIndexManager(l),_=Br.wt(l,this.serializer,d,i.referenceDelegate);return new Ou(s,_,h,d).recalculateAndSaveOverlaysForDocumentKeys(new hs(t,ae.ce),u).next()}))}))}}function Fo(r){r.createObjectStore(Nt,{keyPath:fl}).createIndex(Ls,ml,{unique:!0}),r.createObjectStore(xt,{keyPath:"targetId"}).createIndex(Aa,dl,{unique:!0}),r.createObjectStore(nt)}const Ne="IndexedDbPersistence",Xr=18e5,Zr=5e3,es="Failed to obtain exclusive access to the persistence layer. To allow shared access, multi-tab synchronization has to be enabled in all tabs. If you are using `experimentalForceOwningTab:true`, make sure that only one tab has persistence enabled at any given time.",Wh="main";class ri{constructor(e,t,n,s,i,o,a,u,c,l,h=18){if(this.allowTabSynchronization=e,this.persistenceKey=t,this.clientId=n,this.Mi=i,this.window=o,this.document=a,this.xi=c,this.Oi=l,this.Ni=h,this.ci=null,this.li=!1,this.isPrimary=!1,this.networkEnabled=!0,this.Bi=null,this.inForeground=!1,this.Li=null,this.ki=null,this.qi=Number.NEGATIVE_INFINITY,this.Qi=d=>Promise.resolve(),!ri.v())throw new p(m.UNIMPLEMENTED,"This platform is either missing IndexedDB or is known to have an incomplete implementation. Offline persistence has been disabled.");this.referenceDelegate=new Mh(this,s),this.$i=t+Wh,this.serializer=new wu(u),this.Ui=new Fe(this.$i,this.Ni,new Qh(this.serializer)),this.hi=new vh,this.Pi=new xh(this.referenceDelegate,this.serializer),this.remoteDocumentCache=Fu(this.serializer),this.Ii=new wh,this.window&&this.window.localStorage?this.Ki=this.window.localStorage:(this.Ki=null,l===!1&&$(Ne,"LocalStorage is unavailable. As a result, persistence may not work reliably. In particular enablePersistence() could fail immediately after refreshing the page."))}start(){return this.Wi().then((()=>{if(!this.isPrimary&&!this.allowTabSynchronization)throw new p(m.FAILED_PRECONDITION,es);return this.Gi(),this.zi(),this.ji(),this.runTransaction("getHighestListenSequenceNumber","readonly",(e=>this.Pi.getHighestSequenceNumber(e)))})).then((e=>{this.ci=new ae(e,this.xi)})).then((()=>{this.li=!0})).catch((e=>(this.Ui&&this.Ui.close(),Promise.reject(e))))}Ji(e){return this.Qi=async t=>{if(this.started)return e(t)},e(this.isPrimary)}setDatabaseDeletedListener(e){this.Ui.$((async t=>{t.newVersion===null&&await e()}))}setNetworkEnabled(e){this.networkEnabled!==e&&(this.networkEnabled=e,this.Mi.enqueueAndForget((async()=>{this.started&&await this.Wi()})))}Wi(){return this.runTransaction("updateClientMetadataAndTryBecomePrimary","readwrite",(e=>Jn(e).put({clientId:this.clientId,updateTimeMs:Date.now(),networkEnabled:this.networkEnabled,inForeground:this.inForeground}).next((()=>{if(this.isPrimary)return this.Hi(e).next((t=>{t||(this.isPrimary=!1,this.Mi.enqueueRetryable((()=>this.Qi(!1))))}))})).next((()=>this.Yi(e))).next((t=>this.isPrimary&&!t?this.Zi(e).next((()=>!1)):!!t&&this.Xi(e).next((()=>!0)))))).catch((e=>{if(Ke(e))return g(Ne,"Failed to extend owner lease: ",e),this.isPrimary;if(!this.allowTabSynchronization)throw e;return g(Ne,"Releasing owner lease after error during lease refresh",e),!1})).then((e=>{this.isPrimary!==e&&this.Mi.enqueueRetryable((()=>this.Qi(e))),this.isPrimary=e}))}Hi(e){return tn(e).get(gt).next((t=>f.resolve(this.es(t))))}ts(e){return Jn(e).delete(this.clientId)}async ns(){if(this.isPrimary&&!this.rs(this.qi,Xr)){this.qi=Date.now();const e=await this.runTransaction("maybeGarbageCollectMultiClientState","readwrite-primary",(t=>{const n=J(t,kt);return n.J().next((s=>{const i=this.ss(s,Xr),o=s.filter((a=>i.indexOf(a)===-1));return f.forEach(o,(a=>n.delete(a.clientId))).next((()=>o))}))})).catch((()=>[]));if(this.Ki)for(const t of e)this.Ki.removeItem(this._s(t.clientId))}}ji(){this.ki=this.Mi.enqueueAfterDelay("client_metadata_refresh",4e3,(()=>this.Wi().then((()=>this.ns())).then((()=>this.ji()))))}es(e){return!!e&&e.ownerId===this.clientId}Yi(e){return this.Oi?f.resolve(!0):tn(e).get(gt).next((t=>{if(t!==null&&this.rs(t.leaseTimestampMs,Zr)&&!this.us(t.ownerId)){if(this.es(t)&&this.networkEnabled)return!0;if(!this.es(t)){if(!t.allowTabSynchronization)throw new p(m.FAILED_PRECONDITION,es);return!1}}return!(!this.networkEnabled||!this.inForeground)||Jn(e).J().next((n=>this.ss(n,Zr).find((s=>{if(this.clientId!==s.clientId){const i=!this.networkEnabled&&s.networkEnabled,o=!this.inForeground&&s.inForeground,a=this.networkEnabled===s.networkEnabled;if(i||o&&a)return!0}return!1}))===void 0))})).next((t=>(this.isPrimary!==t&&g(Ne,`Client ${t?"is":"is not"} eligible for a primary lease.`),t)))}async shutdown(){this.li=!1,this.cs(),this.ki&&(this.ki.cancel(),this.ki=null),this.ls(),this.hs(),await this.Ui.runTransaction("shutdown","readwrite",[Dn,kt],(e=>{const t=new hs(e,ae.ce);return this.Zi(t).next((()=>this.ts(t)))})),this.Ui.close(),this.Ps()}ss(e,t){return e.filter((n=>this.rs(n.updateTimeMs,t)&&!this.us(n.clientId)))}Ts(){return this.runTransaction("getActiveClients","readonly",(e=>Jn(e).J().next((t=>this.ss(t,Xr).map((n=>n.clientId))))))}get started(){return this.li}getGlobalsCache(){return this.hi}getMutationQueue(e,t){return Br.wt(e,this.serializer,t,this.referenceDelegate)}getTargetCache(){return this.Pi}getRemoteDocumentCache(){return this.remoteDocumentCache}getIndexManager(e){return new Dh(e,this.serializer.yt.databaseId)}getDocumentOverlayCache(e){return qr.wt(this.serializer,e)}getBundleCache(){return this.Ii}runTransaction(e,t,n){g(Ne,"Starting transaction:",e);const s=t==="readonly"?"readonly":"readwrite",i=(function(u){return u===18?Dl:u===17?ba:u===16?Cl:u===15?Bs:u===14?Sa:u===13?Pa:u===12?bl:u===11?Va:void I(60245)})(this.Ni);let o;return this.Ui.runTransaction(e,s,i,(a=>(o=new hs(a,this.ci?this.ci.next():ae.ce),t==="readwrite-primary"?this.Hi(o).next((u=>!!u||this.Yi(o))).next((u=>{if(!u)throw $(`Failed to obtain primary lease for action '${e}'.`),this.isPrimary=!1,this.Mi.enqueueRetryable((()=>this.Qi(!1))),new p(m.FAILED_PRECONDITION,ga);return n(o)})).next((u=>this.Xi(o).next((()=>u)))):this.Is(o).next((()=>n(o)))))).then((a=>(o.raiseOnCommittedEvent(),a)))}Is(e){return tn(e).get(gt).next((t=>{if(t!==null&&this.rs(t.leaseTimestampMs,Zr)&&!this.us(t.ownerId)&&!this.es(t)&&!(this.Oi||this.allowTabSynchronization&&t.allowTabSynchronization))throw new p(m.FAILED_PRECONDITION,es)}))}Xi(e){const t={ownerId:this.clientId,allowTabSynchronization:this.allowTabSynchronization,leaseTimestampMs:Date.now()};return tn(e).put(gt,t)}static v(){return Fe.v()}Zi(e){const t=tn(e);return t.get(gt).next((n=>this.es(n)?(g(Ne,"Releasing primary lease."),t.delete(gt)):f.resolve()))}rs(e,t){const n=Date.now();return!(e<n-t)&&(!(e>n)||($(`Detected an update time that is in the future: ${e} > ${n}`),!1))}Gi(){this.document!==null&&typeof this.document.addEventListener=="function"&&(this.Li=()=>{this.Mi.enqueueAndForget((()=>(this.inForeground=this.document.visibilityState==="visible",this.Wi())))},this.document.addEventListener("visibilitychange",this.Li),this.inForeground=this.document.visibilityState==="visible")}ls(){this.Li&&(this.document.removeEventListener("visibilitychange",this.Li),this.Li=null)}zi(){var e;typeof((e=this.window)==null?void 0:e.addEventListener)=="function"&&(this.Bi=()=>{this.cs();const t=/(?:Version|Mobile)\/1[456]/;aa()&&(navigator.appVersion.match(t)||navigator.userAgent.match(t))&&this.Mi.enterRestrictedMode(!0),this.Mi.enqueueAndForget((()=>this.shutdown()))},this.window.addEventListener("pagehide",this.Bi))}hs(){this.Bi&&(this.window.removeEventListener("pagehide",this.Bi),this.Bi=null)}us(e){var t;try{const n=((t=this.Ki)==null?void 0:t.getItem(this._s(e)))!==null;return g(Ne,`Client '${e}' ${n?"is":"is not"} zombied in LocalStorage`),n}catch(n){return $(Ne,"Failed to get zombied client id.",n),!1}}cs(){if(this.Ki)try{this.Ki.setItem(this._s(this.clientId),String(Date.now()))}catch(e){$("Failed to set zombie client id.",e)}}Ps(){if(this.Ki)try{this.Ki.removeItem(this._s(this.clientId))}catch{}}_s(e){return`firestore_zombie_${this.persistenceKey}_${e}`}}function tn(r){return J(r,Dn)}function Jn(r){return J(r,kt)}function Lu(r,e){let t=r.projectId;return r.isDefaultDatabase||(t+="."+r.database),"firestore/"+e+"/"+t+"/"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class si{constructor(e,t,n,s){this.targetId=e,this.fromCache=t,this.Es=n,this.ds=s}static As(e,t){let n=S(),s=S();for(const i of t.docChanges)switch(i.type){case 0:n=n.add(i.doc.key);break;case 1:s=s.add(i.doc.key)}return new si(e,t.fromCache,n,s)}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hh{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Uu{constructor(){this.Rs=!1,this.Vs=!1,this.fs=100,this.gs=(function(){return aa()?8:ya(cr())>0?6:4})()}initialize(e,t){this.ps=e,this.indexManager=t,this.Rs=!0}getDocumentsMatchingQuery(e,t,n,s){const i={result:null};return this.ys(e,t).next((o=>{i.result=o})).next((()=>{if(!i.result)return this.ws(e,t,s,n).next((o=>{i.result=o}))})).next((()=>{if(i.result)return;const o=new Hh;return this.Ss(e,t,o).next((a=>{if(i.result=a,this.Vs)return this.bs(e,t,o,a.size)}))})).next((()=>i.result))}bs(e,t,n,s){return n.documentReadCount<this.fs?(At()<=Re.DEBUG&&g("QueryEngine","SDK will not create cache indexes for query:",wt(t),"since it only creates cache indexes for collection contains","more than or equal to",this.fs,"documents"),f.resolve()):(At()<=Re.DEBUG&&g("QueryEngine","Query:",wt(t),"scans",n.documentReadCount,"local documents and returns",s,"documents as results."),n.documentReadCount>this.gs*s?(At()<=Re.DEBUG&&g("QueryEngine","The SDK decides to create cache indexes for query:",wt(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,he(t))):f.resolve())}ys(e,t){if(io(t))return f.resolve(null);let n=he(t);return this.indexManager.getIndexType(e,n).next((s=>s===0?null:(t.limit!==null&&s===1&&(t=ys(t,null,"F"),n=he(t)),this.indexManager.getDocumentsMatchingTarget(e,n).next((i=>{const o=S(...i);return this.ps.getDocuments(e,o).next((a=>this.indexManager.getMinOffset(e,n).next((u=>{const c=this.Ds(t,a);return this.Cs(t,c,o,u.readTime)?this.ys(e,ys(t,null,"F")):this.vs(e,c,t,u)}))))})))))}ws(e,t,n,s){return io(t)||s.isEqual(R.min())?f.resolve(null):this.ps.getDocuments(e,n).next((i=>{const o=this.Ds(t,i);return this.Cs(t,o,n,s)?f.resolve(null):(At()<=Re.DEBUG&&g("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),wt(t)),this.vs(e,o,t,ma(s,Ct)).next((a=>a)))}))}Ds(e,t){let n=new F(Ya(e));return t.forEach(((s,i)=>{Mn(e,i)&&(n=n.add(i))})),n}Cs(e,t,n,s){if(e.limit===null)return!1;if(n.size!==t.size)return!0;const i=e.limitType==="F"?t.last():t.first();return!!i&&(i.hasPendingWrites||i.version.compareTo(s)>0)}Ss(e,t,n){return At()<=Re.DEBUG&&g("QueryEngine","Using full collection scan to execute query:",wt(t)),this.ps.getDocumentsMatchingQuery(e,t,de.min(),n)}vs(e,t,n,s){return this.ps.getDocumentsMatchingQuery(e,n,s).next((i=>(t.forEach((o=>{i=i.insert(o.key,o)})),i)))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ii="LocalStore",Jh=3e8;class Yh{constructor(e,t,n,s){this.persistence=e,this.Fs=t,this.serializer=s,this.Ms=new O(V),this.xs=new be((i=>ut(i)),xn),this.Os=new Map,this.Ns=e.getRemoteDocumentCache(),this.Pi=e.getTargetCache(),this.Ii=e.getBundleCache(),this.Bs(n)}Bs(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new Ou(this.Ns,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Ns.setIndexManager(this.indexManager),this.Fs.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",(t=>e.collect(t,this.Ms)))}}function qu(r,e,t,n){return new Yh(r,e,t,n)}async function Bu(r,e){const t=w(r);return await t.persistence.runTransaction("Handle user change","readonly",(n=>{let s;return t.mutationQueue.getAllMutationBatches(n).next((i=>(s=i,t.Bs(e),t.mutationQueue.getAllMutationBatches(n)))).next((i=>{const o=[],a=[];let u=S();for(const c of s){o.push(c.batchId);for(const l of c.mutations)u=u.add(l.key)}for(const c of i){a.push(c.batchId);for(const l of c.mutations)u=u.add(l.key)}return t.localDocuments.getDocuments(n,u).next((c=>({Ls:c,removedBatchIds:o,addedBatchIds:a})))}))}))}function Xh(r,e){const t=w(r);return t.persistence.runTransaction("Acknowledge batch","readwrite-primary",(n=>{const s=e.batch.keys(),i=t.Ns.newChangeBuffer({trackRemovals:!0});return(function(a,u,c,l){const h=c.batch,d=h.keys();let _=f.resolve();return d.forEach((T=>{_=_.next((()=>l.getEntry(u,T))).next((A=>{const E=c.docVersions.get(T);v(E!==null,48541),A.version.compareTo(E)<0&&(h.applyToRemoteDocument(A,c),A.isValidDocument()&&(A.setReadTime(c.commitVersion),l.addEntry(A)))}))})),_.next((()=>a.mutationQueue.removeMutationBatch(u,h)))})(t,n,e,i).next((()=>i.apply(n))).next((()=>t.mutationQueue.performConsistencyCheck(n))).next((()=>t.documentOverlayCache.removeOverlaysForBatchId(n,s,e.batch.batchId))).next((()=>t.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(n,(function(a){let u=S();for(let c=0;c<a.mutationResults.length;++c)a.mutationResults[c].transformResults.length>0&&(u=u.add(a.batch.mutations[c].key));return u})(e)))).next((()=>t.localDocuments.getDocuments(n,s)))}))}function zu(r){const e=w(r);return e.persistence.runTransaction("Get last remote snapshot version","readonly",(t=>e.Pi.getLastRemoteSnapshotVersion(t)))}function Zh(r,e){const t=w(r),n=e.snapshotVersion;let s=t.Ms;return t.persistence.runTransaction("Apply remote event","readwrite-primary",(i=>{const o=t.Ns.newChangeBuffer({trackRemovals:!0});s=t.Ms;const a=[];e.targetChanges.forEach(((l,h)=>{const d=s.get(h);if(!d)return;a.push(t.Pi.removeMatchingKeys(i,l.removedDocuments,h).next((()=>t.Pi.addMatchingKeys(i,l.addedDocuments,h))));let _=d.withSequenceNumber(i.currentSequenceNumber);e.targetMismatches.get(h)!==null?_=_.withResumeToken(j.EMPTY_BYTE_STRING,R.min()).withLastLimboFreeSnapshotVersion(R.min()):l.resumeToken.approximateByteSize()>0&&(_=_.withResumeToken(l.resumeToken,n)),s=s.insert(h,_),(function(A,E,N){return A.resumeToken.approximateByteSize()===0||E.snapshotVersion.toMicroseconds()-A.snapshotVersion.toMicroseconds()>=Jh?!0:N.addedDocuments.size+N.modifiedDocuments.size+N.removedDocuments.size>0})(d,_,l)&&a.push(t.Pi.updateTargetData(i,_))}));let u=le(),c=S();if(e.documentUpdates.forEach((l=>{e.resolvedLimboDocuments.has(l)&&a.push(t.persistence.referenceDelegate.updateLimboDocument(i,l))})),a.push(ed(i,o,e.documentUpdates).next((l=>{u=l.ks,c=l.qs}))),!n.isEqual(R.min())){const l=t.Pi.getLastRemoteSnapshotVersion(i).next((h=>t.Pi.setTargetsMetadata(i,i.currentSequenceNumber,n)));a.push(l)}return f.waitFor(a).next((()=>o.apply(i))).next((()=>t.localDocuments.getLocalViewOfDocuments(i,u,c))).next((()=>u))})).then((i=>(t.Ms=s,i)))}function ed(r,e,t){let n=S(),s=S();return t.forEach((i=>n=n.add(i))),e.getEntries(r,n).next((i=>{let o=le();return t.forEach(((a,u)=>{const c=i.get(a);u.isFoundDocument()!==c.isFoundDocument()&&(s=s.add(a)),u.isNoDocument()&&u.version.isEqual(R.min())?(e.removeEntry(a,u.readTime),o=o.insert(a,u)):!c.isValidDocument()||u.version.compareTo(c.version)>0||u.version.compareTo(c.version)===0&&c.hasPendingWrites?(e.addEntry(u),o=o.insert(a,u)):g(ii,"Ignoring outdated watch update for ",a,". Current version:",c.version," Watch version:",u.version)})),{ks:o,qs:s}}))}function td(r,e){const t=w(r);return t.persistence.runTransaction("Get next mutation batch","readonly",(n=>(e===void 0&&(e=tt),t.mutationQueue.getNextMutationBatchAfterBatchId(n,e))))}function wr(r,e){const t=w(r);return t.persistence.runTransaction("Allocate target","readwrite",(n=>{let s;return t.Pi.getTargetData(n,e).next((i=>i?(s=i,f.resolve(s)):t.Pi.allocateTargetId(n).next((o=>(s=new Ve(e,o,"TargetPurposeListen",n.currentSequenceNumber),t.Pi.addTargetData(n,s).next((()=>s)))))))})).then((n=>{const s=t.Ms.get(n.targetId);return(s===null||n.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(t.Ms=t.Ms.insert(n.targetId,n),t.xs.set(e,n.targetId)),n}))}async function zt(r,e,t){const n=w(r),s=n.Ms.get(e),i=t?"readwrite":"readwrite-primary";try{t||await n.persistence.runTransaction("Release target",i,(o=>n.persistence.referenceDelegate.removeTarget(o,s)))}catch(o){if(!Ke(o))throw o;g(ii,`Failed to update sequence numbers for target ${e}: ${o}`)}n.Ms=n.Ms.remove(e),n.xs.delete(s.target)}function Vs(r,e,t){const n=w(r);let s=R.min(),i=S();return n.persistence.runTransaction("Execute query","readwrite",(o=>(function(u,c,l){const h=w(u),d=h.xs.get(l);return d!==void 0?f.resolve(h.Ms.get(d)):h.Pi.getTargetData(c,l)})(n,o,he(e)).next((a=>{if(a)return s=a.lastLimboFreeSnapshotVersion,n.Pi.getMatchingKeysForTargetId(o,a.targetId).next((u=>{i=u}))})).next((()=>n.Fs.getDocumentsMatchingQuery(o,e,t?s:R.min(),t?i:S()))).next((a=>($u(n,Ja(e),a),{documents:a,Qs:i})))))}function Ku(r,e){const t=w(r),n=w(t.Pi),s=t.Ms.get(e);return s?Promise.resolve(s.target):t.persistence.runTransaction("Get target data","readonly",(i=>n.At(i,e).next((o=>o?o.target:null))))}function Gu(r,e){const t=w(r),n=t.Os.get(e)||R.min();return t.persistence.runTransaction("Get new document changes","readonly",(s=>t.Ns.getAllFromCollectionGroup(s,e,ma(n,Ct),Number.MAX_SAFE_INTEGER))).then((s=>($u(t,e,s),s)))}function $u(r,e,t){let n=r.Os.get(e)||R.min();t.forEach(((s,i)=>{i.readTime.compareTo(n)>0&&(n=i.readTime)})),r.Os.set(e,n)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ju="firestore_clients";function Oo(r,e){return`${ju}_${r}_${e}`}const Qu="firestore_mutations";function Lo(r,e,t){let n=`${Qu}_${r}_${t}`;return e.isAuthenticated()&&(n+=`_${e.uid}`),n}const Wu="firestore_targets";function ts(r,e){return`${Wu}_${r}_${e}`}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pe="SharedClientState";class vr{constructor(e,t,n,s){this.user=e,this.batchId=t,this.state=n,this.error=s}static Ws(e,t,n){const s=JSON.parse(n);let i,o=typeof s=="object"&&["pending","acknowledged","rejected"].indexOf(s.state)!==-1&&(s.error===void 0||typeof s.error=="object");return o&&s.error&&(o=typeof s.error.message=="string"&&typeof s.error.code=="string",o&&(i=new p(s.error.code,s.error.message))),o?new vr(e,t,s.state,i):($(pe,`Failed to parse mutation state for ID '${t}': ${n}`),null)}Gs(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class _n{constructor(e,t,n){this.targetId=e,this.state=t,this.error=n}static Ws(e,t){const n=JSON.parse(t);let s,i=typeof n=="object"&&["not-current","current","rejected"].indexOf(n.state)!==-1&&(n.error===void 0||typeof n.error=="object");return i&&n.error&&(i=typeof n.error.message=="string"&&typeof n.error.code=="string",i&&(s=new p(n.error.code,n.error.message))),i?new _n(e,n.state,s):($(pe,`Failed to parse target state for ID '${e}': ${t}`),null)}Gs(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class Rr{constructor(e,t){this.clientId=e,this.activeTargetIds=t}static Ws(e,t){const n=JSON.parse(t);let s=typeof n=="object"&&n.activeTargetIds instanceof Array,i=js();for(let o=0;s&&o<n.activeTargetIds.length;++o)s=Ia(n.activeTargetIds[o]),i=i.add(n.activeTargetIds[o]);return s?new Rr(e,i):($(pe,`Failed to parse client data for instance '${e}': ${t}`),null)}}class oi{constructor(e,t){this.clientId=e,this.onlineState=t}static Ws(e){const t=JSON.parse(e);return typeof t=="object"&&["Unknown","Online","Offline"].indexOf(t.onlineState)!==-1&&typeof t.clientId=="string"?new oi(t.clientId,t.onlineState):($(pe,`Failed to parse online state: ${e}`),null)}}class Ps{constructor(){this.activeTargetIds=js()}zs(e){this.activeTargetIds=this.activeTargetIds.add(e)}js(e){this.activeTargetIds=this.activeTargetIds.delete(e)}Gs(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class ns{constructor(e,t,n,s,i){this.window=e,this.Mi=t,this.persistenceKey=n,this.Js=s,this.syncEngine=null,this.onlineStateHandler=null,this.sequenceNumberHandler=null,this.Hs=this.Ys.bind(this),this.Zs=new O(V),this.started=!1,this.Xs=[];const o=n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");this.storage=this.window.localStorage,this.currentUser=i,this.eo=Oo(this.persistenceKey,this.Js),this.no=(function(u){return`firestore_sequence_number_${u}`})(this.persistenceKey),this.Zs=this.Zs.insert(this.Js,new Ps),this.ro=new RegExp(`^${ju}_${o}_([^_]*)$`),this.io=new RegExp(`^${Qu}_${o}_(\\d+)(?:_(.*))?$`),this.so=new RegExp(`^${Wu}_${o}_(\\d+)$`),this.oo=(function(u){return`firestore_online_state_${u}`})(this.persistenceKey),this._o=(function(u){return`firestore_bundle_loaded_v2_${u}`})(this.persistenceKey),this.window.addEventListener("storage",this.Hs)}static v(e){return!(!e||!e.localStorage)}async start(){const e=await this.syncEngine.Ts();for(const n of e){if(n===this.Js)continue;const s=this.getItem(Oo(this.persistenceKey,n));if(s){const i=Rr.Ws(n,s);i&&(this.Zs=this.Zs.insert(i.clientId,i))}}this.ao();const t=this.storage.getItem(this.oo);if(t){const n=this.uo(t);n&&this.co(n)}for(const n of this.Xs)this.Ys(n);this.Xs=[],this.window.addEventListener("pagehide",(()=>this.shutdown())),this.started=!0}writeSequenceNumber(e){this.setItem(this.no,JSON.stringify(e))}getAllActiveQueryTargets(){return this.lo(this.Zs)}isActiveQueryTarget(e){let t=!1;return this.Zs.forEach(((n,s)=>{s.activeTargetIds.has(e)&&(t=!0)})),t}addPendingMutation(e){this.ho(e,"pending")}updateMutationState(e,t,n){this.ho(e,t,n),this.Po(e)}addLocalQueryTarget(e,t=!0){let n="not-current";if(this.isActiveQueryTarget(e)){const s=this.storage.getItem(ts(this.persistenceKey,e));if(s){const i=_n.Ws(e,s);i&&(n=i.state)}}return t&&this.To.zs(e),this.ao(),n}removeLocalQueryTarget(e){this.To.js(e),this.ao()}isLocalQueryTarget(e){return this.To.activeTargetIds.has(e)}clearQueryState(e){this.removeItem(ts(this.persistenceKey,e))}updateQueryState(e,t,n){this.Io(e,t,n)}handleUserChange(e,t,n){t.forEach((s=>{this.Po(s)})),this.currentUser=e,n.forEach((s=>{this.addPendingMutation(s)}))}setOnlineState(e){this.Eo(e)}notifyBundleLoaded(e){this.Ao(e)}shutdown(){this.started&&(this.window.removeEventListener("storage",this.Hs),this.removeItem(this.eo),this.started=!1)}getItem(e){const t=this.storage.getItem(e);return g(pe,"READ",e,t),t}setItem(e,t){g(pe,"SET",e,t),this.storage.setItem(e,t)}removeItem(e){g(pe,"REMOVE",e),this.storage.removeItem(e)}Ys(e){const t=e;if(t.storageArea===this.storage){if(g(pe,"EVENT",t.key,t.newValue),t.key===this.eo)return void $("Received WebStorage notification for local change. Another client might have garbage-collected our state");this.Mi.enqueueRetryable((async()=>{if(this.started){if(t.key!==null){if(this.ro.test(t.key)){if(t.newValue==null){const n=this.Ro(t.key);return this.Vo(n,null)}{const n=this.mo(t.key,t.newValue);if(n)return this.Vo(n.clientId,n)}}else if(this.io.test(t.key)){if(t.newValue!==null){const n=this.fo(t.key,t.newValue);if(n)return this.po(n)}}else if(this.so.test(t.key)){if(t.newValue!==null){const n=this.yo(t.key,t.newValue);if(n)return this.wo(n)}}else if(t.key===this.oo){if(t.newValue!==null){const n=this.uo(t.newValue);if(n)return this.co(n)}}else if(t.key===this.no){const n=(function(i){let o=ae.ce;if(i!=null)try{const a=JSON.parse(i);v(typeof a=="number",30636,{So:i}),o=a}catch(a){$(pe,"Failed to read sequence number from WebStorage",a)}return o})(t.newValue);n!==ae.ce&&this.sequenceNumberHandler(n)}else if(t.key===this._o){const n=this.bo(t.newValue);await Promise.all(n.map((s=>this.syncEngine.Do(s))))}}}else this.Xs.push(t)}))}}get To(){return this.Zs.get(this.Js)}ao(){this.setItem(this.eo,this.To.Gs())}ho(e,t,n){const s=new vr(this.currentUser,e,t,n),i=Lo(this.persistenceKey,this.currentUser,e);this.setItem(i,s.Gs())}Po(e){const t=Lo(this.persistenceKey,this.currentUser,e);this.removeItem(t)}Eo(e){const t={clientId:this.Js,onlineState:e};this.storage.setItem(this.oo,JSON.stringify(t))}Io(e,t,n){const s=ts(this.persistenceKey,e),i=new _n(e,t,n);this.setItem(s,i.Gs())}Ao(e){const t=JSON.stringify(Array.from(e));this.setItem(this._o,t)}Ro(e){const t=this.ro.exec(e);return t?t[1]:null}mo(e,t){const n=this.Ro(e);return Rr.Ws(n,t)}fo(e,t){const n=this.io.exec(e),s=Number(n[1]),i=n[2]!==void 0?n[2]:null;return vr.Ws(new X(i),s,t)}yo(e,t){const n=this.so.exec(e),s=Number(n[1]);return _n.Ws(s,t)}uo(e){return oi.Ws(e)}bo(e){return JSON.parse(e)}async po(e){if(e.user.uid===this.currentUser.uid)return this.syncEngine.Co(e.batchId,e.state,e.error);g(pe,`Ignoring mutation for non-active user ${e.user.uid}`)}wo(e){return this.syncEngine.vo(e.targetId,e.state,e.error)}Vo(e,t){const n=t?this.Zs.insert(e,t):this.Zs.remove(e),s=this.lo(this.Zs),i=this.lo(n),o=[],a=[];return i.forEach((u=>{s.has(u)||o.push(u)})),s.forEach((u=>{i.has(u)||a.push(u)})),this.syncEngine.Fo(o,a).then((()=>{this.Zs=n}))}co(e){this.Zs.get(e.clientId)&&this.onlineStateHandler(e.onlineState)}lo(e){let t=js();return e.forEach(((n,s)=>{t=t.unionWith(s.activeTargetIds)})),t}}class Hu{constructor(){this.Mo=new Ps,this.xo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,n){}addLocalQueryTarget(e,t=!0){return t&&this.Mo.zs(e),this.xo[e]||"not-current"}updateQueryState(e,t,n){this.xo[e]=t}removeLocalQueryTarget(e){this.Mo.js(e)}isLocalQueryTarget(e){return this.Mo.activeTargetIds.has(e)}clearQueryState(e){delete this.xo[e]}getAllActiveQueryTargets(){return this.Mo.activeTargetIds}isActiveQueryTarget(e){return this.Mo.activeTargetIds.has(e)}start(){return this.Mo=new Ps,Promise.resolve()}handleUserChange(e,t,n){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nd{Oo(e){}shutdown(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Uo="ConnectivityMonitor";class qo{constructor(){this.No=()=>this.Bo(),this.Lo=()=>this.ko(),this.qo=[],this.Qo()}Oo(e){this.qo.push(e)}shutdown(){window.removeEventListener("online",this.No),window.removeEventListener("offline",this.Lo)}Qo(){window.addEventListener("online",this.No),window.addEventListener("offline",this.Lo)}Bo(){g(Uo,"Network connectivity changed: AVAILABLE");for(const e of this.qo)e(0)}ko(){g(Uo,"Network connectivity changed: UNAVAILABLE");for(const e of this.qo)e(1)}static v(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Yn=null;function Ss(){return Yn===null?Yn=(function(){return 268435456+Math.round(2147483648*Math.random())})():Yn++,"0x"+Yn.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rs="RestConnection",rd={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};class sd{get $o(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const t=e.ssl?"https":"http",n=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.Uo=t+"://"+e.host,this.Ko=`projects/${n}/databases/${s}`,this.Wo=this.databaseId.database===An?`project_id=${n}`:`project_id=${n}&database_id=${s}`}Go(e,t,n,s,i){const o=Ss(),a=this.zo(e,t.toUriEncodedString());g(rs,`Sending RPC '${e}' ${o}:`,a,n);const u={"google-cloud-resource-prefix":this.Ko,"x-goog-request-params":this.Wo};this.jo(u,s,i);const{host:c}=new URL(a),l=Ns(c);return this.Jo(e,a,u,n,l).then((h=>(g(rs,`Received RPC '${e}' ${o}: `,h),h)),(h=>{throw St(rs,`RPC '${e}' ${o} failed with error: `,h,"url: ",a,"request:",n),h}))}Ho(e,t,n,s,i,o){return this.Go(e,t,n,s,i)}jo(e,t,n){e["X-Goog-Api-Client"]=(function(){return"gl-js/ fire/"+jt})(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach(((s,i)=>e[i]=s)),n&&n.headers.forEach(((s,i)=>e[i]=s))}zo(e,t){const n=rd[e];return`${this.Uo}/v1/${t}:${n}`}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class id{constructor(e){this.Yo=e.Yo,this.Zo=e.Zo}Xo(e){this.e_=e}t_(e){this.n_=e}r_(e){this.i_=e}onMessage(e){this.s_=e}close(){this.Zo()}send(e){this.Yo(e)}o_(){this.e_()}__(){this.n_()}a_(e){this.i_(e)}u_(e){this.s_(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const te="WebChannelConnection";class od extends sd{constructor(e){super(e),this.c_=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}Jo(e,t,n,s,i){const o=Ss();return new Promise(((a,u)=>{const c=new Oc;c.setWithCredentials(!0),c.listenOnce(Lc.COMPLETE,(()=>{try{switch(c.getLastErrorCode()){case Hr.NO_ERROR:const h=c.getResponseJson();g(te,`XHR for RPC '${e}' ${o} received:`,JSON.stringify(h)),a(h);break;case Hr.TIMEOUT:g(te,`RPC '${e}' ${o} timed out`),u(new p(m.DEADLINE_EXCEEDED,"Request time out"));break;case Hr.HTTP_ERROR:const d=c.getStatus();if(g(te,`RPC '${e}' ${o} failed with status:`,d,"response text:",c.getResponseText()),d>0){let _=c.getResponseJson();Array.isArray(_)&&(_=_[0]);const T=_==null?void 0:_.error;if(T&&T.status&&T.message){const A=(function(N){const b=N.toLowerCase().replace(/_/g,"-");return Object.values(m).indexOf(b)>=0?b:m.UNKNOWN})(T.status);u(new p(A,T.message))}else u(new p(m.UNKNOWN,"Server responded with status "+c.getStatus()))}else u(new p(m.UNAVAILABLE,"Connection failed."));break;default:I(9055,{l_:e,streamId:o,h_:c.getLastErrorCode(),P_:c.getLastError()})}}finally{g(te,`RPC '${e}' ${o} completed.`)}}));const l=JSON.stringify(s);g(te,`RPC '${e}' ${o} sending request:`,s),c.send(t,"POST",l,n,15)}))}T_(e,t,n){const s=Ss(),i=[this.Uo,"/","google.firestore.v1.Firestore","/",e,"/channel"],o=Uc(),a=qc(),u={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},c=this.longPollingOptions.timeoutSeconds;c!==void 0&&(u.longPollingTimeout=Math.round(1e3*c)),this.useFetchStreams&&(u.useFetchStreams=!0),this.jo(u.initMessageHeaders,t,n),u.encodeInitMessageHeaders=!0;const l=i.join("");g(te,`Creating RPC '${e}' stream ${s}: ${l}`,u);const h=o.createWebChannel(l,u);this.I_(h);let d=!1,_=!1;const T=new id({Yo:E=>{_?g(te,`Not sending because RPC '${e}' stream ${s} is closed:`,E):(d||(g(te,`Opening RPC '${e}' stream ${s} transport.`),h.open(),d=!0),g(te,`RPC '${e}' stream ${s} sending:`,E),h.send(E))},Zo:()=>h.close()}),A=(E,N,b)=>{E.listen(N,(P=>{try{b(P)}catch(q){setTimeout((()=>{throw q}),0)}}))};return A(h,$n.EventType.OPEN,(()=>{_||(g(te,`RPC '${e}' stream ${s} transport opened.`),T.o_())})),A(h,$n.EventType.CLOSE,(()=>{_||(_=!0,g(te,`RPC '${e}' stream ${s} transport closed`),T.a_(),this.E_(h))})),A(h,$n.EventType.ERROR,(E=>{_||(_=!0,St(te,`RPC '${e}' stream ${s} transport errored. Name:`,E.name,"Message:",E.message),T.a_(new p(m.UNAVAILABLE,"The operation could not be completed")))})),A(h,$n.EventType.MESSAGE,(E=>{var N;if(!_){const b=E.data[0];v(!!b,16349);const P=b,q=(P==null?void 0:P.error)||((N=P[0])==null?void 0:N.error);if(q){g(te,`RPC '${e}' stream ${s} received error:`,q);const G=q.status;let B=(function(Vc){const xi=Q[Vc];if(xi!==void 0)return cu(xi)})(G),ee=q.message;B===void 0&&(B=m.INTERNAL,ee="Unknown error status: "+G+" with message "+q.message),_=!0,T.a_(new p(B,ee)),h.close()}else g(te,`RPC '${e}' stream ${s} received:`,b),T.u_(b)}})),A(a,Bc.STAT_EVENT,(E=>{E.stat===ki.PROXY?g(te,`RPC '${e}' stream ${s} detected buffering proxy`):E.stat===ki.NOPROXY&&g(te,`RPC '${e}' stream ${s} detected no buffering proxy`)})),setTimeout((()=>{T.__()}),0),T}terminate(){this.c_.forEach((e=>e.close())),this.c_=[]}I_(e){this.c_.push(e)}E_(e){this.c_=this.c_.filter((t=>t===e))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ju(){return typeof window<"u"?window:null}function ar(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Kr(r){return new dh(r,!0)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yu{constructor(e,t,n=1e3,s=1.5,i=6e4){this.Mi=e,this.timerId=t,this.d_=n,this.A_=s,this.R_=i,this.V_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.V_=0}g_(){this.V_=this.R_}p_(e){this.cancel();const t=Math.floor(this.V_+this.y_()),n=Math.max(0,Date.now()-this.f_),s=Math.max(0,t-n);s>0&&g("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.V_} ms, delay with jitter: ${t} ms, last attempt: ${n} ms ago)`),this.m_=this.Mi.enqueueAfterDelay(this.timerId,s,(()=>(this.f_=Date.now(),e()))),this.V_*=this.A_,this.V_<this.d_&&(this.V_=this.d_),this.V_>this.R_&&(this.V_=this.R_)}w_(){this.m_!==null&&(this.m_.skipDelay(),this.m_=null)}cancel(){this.m_!==null&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.V_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bo="PersistentStream";class Xu{constructor(e,t,n,s,i,o,a,u){this.Mi=e,this.S_=n,this.b_=s,this.connection=i,this.authCredentialsProvider=o,this.appCheckCredentialsProvider=a,this.listener=u,this.state=0,this.D_=0,this.C_=null,this.v_=null,this.stream=null,this.F_=0,this.M_=new Yu(e,t)}x_(){return this.state===1||this.state===5||this.O_()}O_(){return this.state===2||this.state===3}start(){this.F_=0,this.state!==4?this.auth():this.N_()}async stop(){this.x_()&&await this.close(0)}B_(){this.state=0,this.M_.reset()}L_(){this.O_()&&this.C_===null&&(this.C_=this.Mi.enqueueAfterDelay(this.S_,6e4,(()=>this.k_())))}q_(e){this.Q_(),this.stream.send(e)}async k_(){if(this.O_())return this.close(0)}Q_(){this.C_&&(this.C_.cancel(),this.C_=null)}U_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(e,t){this.Q_(),this.U_(),this.M_.cancel(),this.D_++,e!==4?this.M_.reset():t&&t.code===m.RESOURCE_EXHAUSTED?($(t.toString()),$("Using maximum backoff delay to prevent overloading the backend."),this.M_.g_()):t&&t.code===m.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.K_(),this.stream.close(),this.stream=null),this.state=e,await this.listener.r_(t)}K_(){}auth(){this.state=1;const e=this.W_(this.D_),t=this.D_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then((([n,s])=>{this.D_===t&&this.G_(n,s)}),(n=>{e((()=>{const s=new p(m.UNKNOWN,"Fetching auth token failed: "+n.message);return this.z_(s)}))}))}G_(e,t){const n=this.W_(this.D_);this.stream=this.j_(e,t),this.stream.Xo((()=>{n((()=>this.listener.Xo()))})),this.stream.t_((()=>{n((()=>(this.state=2,this.v_=this.Mi.enqueueAfterDelay(this.b_,1e4,(()=>(this.O_()&&(this.state=3),Promise.resolve()))),this.listener.t_())))})),this.stream.r_((s=>{n((()=>this.z_(s)))})),this.stream.onMessage((s=>{n((()=>++this.F_==1?this.J_(s):this.onNext(s)))}))}N_(){this.state=5,this.M_.p_((async()=>{this.state=0,this.start()}))}z_(e){return g(Bo,`close with error: ${e}`),this.stream=null,this.close(4,e)}W_(e){return t=>{this.Mi.enqueueAndForget((()=>this.D_===e?t():(g(Bo,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve())))}}}class ad extends Xu{constructor(e,t,n,s,i,o){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,n,s,o),this.serializer=i}j_(e,t){return this.connection.T_("Listen",e,t)}J_(e){return this.onNext(e)}onNext(e){this.M_.reset();const t=_h(this.serializer,e),n=(function(i){if(!("targetChange"in i))return R.min();const o=i.targetChange;return o.targetIds&&o.targetIds.length?R.min():o.readTime?oe(o.readTime):R.min()})(e);return this.listener.H_(t,n)}Y_(e){const t={};t.database=Es(this.serializer),t.addTarget=(function(i,o){let a;const u=o.target;if(a=_r(u)?{documents:pu(i,u)}:{query:yu(i,u).ft},a.targetId=o.targetId,o.resumeToken.approximateByteSize()>0){a.resumeToken=du(i,o.resumeToken);const c=Is(i,o.expectedCount);c!==null&&(a.expectedCount=c)}else if(o.snapshotVersion.compareTo(R.min())>0){a.readTime=Bt(i,o.snapshotVersion.toTimestamp());const c=Is(i,o.expectedCount);c!==null&&(a.expectedCount=c)}return a})(this.serializer,e);const n=ph(this.serializer,e);n&&(t.labels=n),this.q_(t)}Z_(e){const t={};t.database=Es(this.serializer),t.removeTarget=e,this.q_(t)}}class ud extends Xu{constructor(e,t,n,s,i,o){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,n,s,o),this.serializer=i}get X_(){return this.F_>0}start(){this.lastStreamToken=void 0,super.start()}K_(){this.X_&&this.ea([])}j_(e,t){return this.connection.T_("Write",e,t)}J_(e){return v(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,v(!e.writeResults||e.writeResults.length===0,55816),this.listener.ta()}onNext(e){v(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this.M_.reset();const t=gh(e.writeResults,e.commitTime),n=oe(e.commitTime);return this.listener.na(n,t)}ra(){const e={};e.database=Es(this.serializer),this.q_(e)}ea(e){const t={streamToken:this.lastStreamToken,writes:e.map((n=>yr(this.serializer,n)))};this.q_(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cd{}class ld extends cd{constructor(e,t,n,s){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=n,this.serializer=s,this.ia=!1}sa(){if(this.ia)throw new p(m.FAILED_PRECONDITION,"The client has already been terminated.")}Go(e,t,n,s){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([i,o])=>this.connection.Go(e,Ts(t,n),s,i,o))).catch((i=>{throw i.name==="FirebaseError"?(i.code===m.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),i):new p(m.UNKNOWN,i.toString())}))}Ho(e,t,n,s,i){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([o,a])=>this.connection.Ho(e,Ts(t,n),s,o,a,i))).catch((o=>{throw o.name==="FirebaseError"?(o.code===m.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new p(m.UNKNOWN,o.toString())}))}terminate(){this.ia=!0,this.connection.terminate()}}class hd{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.oa=0,this._a=null,this.aa=!0}ua(){this.oa===0&&(this.ca("Unknown"),this._a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,(()=>(this._a=null,this.la("Backend didn't respond within 10 seconds."),this.ca("Offline"),Promise.resolve()))))}ha(e){this.state==="Online"?this.ca("Unknown"):(this.oa++,this.oa>=1&&(this.Pa(),this.la(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.ca("Offline")))}set(e){this.Pa(),this.oa=0,e==="Online"&&(this.aa=!1),this.ca(e)}ca(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}la(e){const t=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.aa?($(t),this.aa=!1):g("OnlineStateTracker",t)}Pa(){this._a!==null&&(this._a.cancel(),this._a=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dt="RemoteStore";class dd{constructor(e,t,n,s,i){this.localStore=e,this.datastore=t,this.asyncQueue=n,this.remoteSyncer={},this.Ta=[],this.Ia=new Map,this.Ea=new Set,this.da=[],this.Aa=i,this.Aa.Oo((o=>{n.enqueueAndForget((async()=>{ft(this)&&(g(dt,"Restarting streams for network reachability change."),await(async function(u){const c=w(u);c.Ea.add(4),await Un(c),c.Ra.set("Unknown"),c.Ea.delete(4),await Gr(c)})(this))}))})),this.Ra=new hd(n,s)}}async function Gr(r){if(ft(r))for(const e of r.da)await e(!0)}async function Un(r){for(const e of r.da)await e(!1)}function $r(r,e){const t=w(r);t.Ia.has(e.targetId)||(t.Ia.set(e.targetId,e),ci(t)?ui(t):Ht(t).O_()&&ai(t,e))}function Kt(r,e){const t=w(r),n=Ht(t);t.Ia.delete(e),n.O_()&&Zu(t,e),t.Ia.size===0&&(n.O_()?n.L_():ft(t)&&t.Ra.set("Unknown"))}function ai(r,e){if(r.Va.Ue(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(R.min())>0){const t=r.remoteSyncer.getRemoteKeysForTarget(e.targetId).size;e=e.withExpectedCount(t)}Ht(r).Y_(e)}function Zu(r,e){r.Va.Ue(e),Ht(r).Z_(e)}function ui(r){r.Va=new uh({getRemoteKeysForTarget:e=>r.remoteSyncer.getRemoteKeysForTarget(e),At:e=>r.Ia.get(e)||null,ht:()=>r.datastore.serializer.databaseId}),Ht(r).start(),r.Ra.ua()}function ci(r){return ft(r)&&!Ht(r).x_()&&r.Ia.size>0}function ft(r){return w(r).Ea.size===0}function ec(r){r.Va=void 0}async function fd(r){r.Ra.set("Online")}async function md(r){r.Ia.forEach(((e,t)=>{ai(r,e)}))}async function _d(r,e){ec(r),ci(r)?(r.Ra.ha(e),ui(r)):r.Ra.set("Unknown")}async function gd(r,e,t){if(r.Ra.set("Online"),e instanceof hu&&e.state===2&&e.cause)try{await(async function(s,i){const o=i.cause;for(const a of i.targetIds)s.Ia.has(a)&&(await s.remoteSyncer.rejectListen(a,o),s.Ia.delete(a),s.Va.removeTarget(a))})(r,e)}catch(n){g(dt,"Failed to remove targets %s: %s ",e.targetIds.join(","),n),await Vr(r,n)}else if(e instanceof ir?r.Va.Ze(e):e instanceof lu?r.Va.st(e):r.Va.tt(e),!t.isEqual(R.min()))try{const n=await zu(r.localStore);t.compareTo(n)>=0&&await(function(i,o){const a=i.Va.Tt(o);return a.targetChanges.forEach(((u,c)=>{if(u.resumeToken.approximateByteSize()>0){const l=i.Ia.get(c);l&&i.Ia.set(c,l.withResumeToken(u.resumeToken,o))}})),a.targetMismatches.forEach(((u,c)=>{const l=i.Ia.get(u);if(!l)return;i.Ia.set(u,l.withResumeToken(j.EMPTY_BYTE_STRING,l.snapshotVersion)),Zu(i,u);const h=new Ve(l.target,u,c,l.sequenceNumber);ai(i,h)})),i.remoteSyncer.applyRemoteEvent(a)})(r,t)}catch(n){g(dt,"Failed to raise snapshot:",n),await Vr(r,n)}}async function Vr(r,e,t){if(!Ke(e))throw e;r.Ea.add(1),await Un(r),r.Ra.set("Offline"),t||(t=()=>zu(r.localStore)),r.asyncQueue.enqueueRetryable((async()=>{g(dt,"Retrying IndexedDB access"),await t(),r.Ea.delete(1),await Gr(r)}))}function tc(r,e){return e().catch((t=>Vr(r,t,e)))}async function Wt(r){const e=w(r),t=qe(e);let n=e.Ta.length>0?e.Ta[e.Ta.length-1].batchId:tt;for(;pd(e);)try{const s=await td(e.localStore,n);if(s===null){e.Ta.length===0&&t.L_();break}n=s.batchId,yd(e,s)}catch(s){await Vr(e,s)}nc(e)&&rc(e)}function pd(r){return ft(r)&&r.Ta.length<10}function yd(r,e){r.Ta.push(e);const t=qe(r);t.O_()&&t.X_&&t.ea(e.mutations)}function nc(r){return ft(r)&&!qe(r).x_()&&r.Ta.length>0}function rc(r){qe(r).start()}async function Id(r){qe(r).ra()}async function Td(r){const e=qe(r);for(const t of r.Ta)e.ea(t.mutations)}async function Ed(r,e,t){const n=r.Ta.shift(),s=Hs.from(n,e,t);await tc(r,(()=>r.remoteSyncer.applySuccessfulWrite(s))),await Wt(r)}async function Ad(r,e){e&&qe(r).X_&&await(async function(n,s){if((function(o){return ih(o)&&o!==m.ABORTED})(s.code)){const i=n.Ta.shift();qe(n).B_(),await tc(n,(()=>n.remoteSyncer.rejectFailedWrite(i.batchId,s))),await Wt(n)}})(r,e),nc(r)&&rc(r)}async function zo(r,e){const t=w(r);t.asyncQueue.verifyOperationInProgress(),g(dt,"RemoteStore received new credentials");const n=ft(t);t.Ea.add(3),await Un(t),n&&t.Ra.set("Unknown"),await t.remoteSyncer.handleCredentialChange(e),t.Ea.delete(3),await Gr(t)}async function bs(r,e){const t=w(r);e?(t.Ea.delete(2),await Gr(t)):e||(t.Ea.add(2),await Un(t),t.Ra.set("Unknown"))}function Ht(r){return r.ma||(r.ma=(function(t,n,s){const i=w(t);return i.sa(),new ad(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(r.datastore,r.asyncQueue,{Xo:fd.bind(null,r),t_:md.bind(null,r),r_:_d.bind(null,r),H_:gd.bind(null,r)}),r.da.push((async e=>{e?(r.ma.B_(),ci(r)?ui(r):r.Ra.set("Unknown")):(await r.ma.stop(),ec(r))}))),r.ma}function qe(r){return r.fa||(r.fa=(function(t,n,s){const i=w(t);return i.sa(),new ud(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(r.datastore,r.asyncQueue,{Xo:()=>Promise.resolve(),t_:Id.bind(null,r),r_:Ad.bind(null,r),ta:Td.bind(null,r),na:Ed.bind(null,r)}),r.da.push((async e=>{e?(r.fa.B_(),await Wt(r)):(await r.fa.stop(),r.Ta.length>0&&(g(dt,`Stopping write stream with ${r.Ta.length} pending writes`),r.Ta=[]))}))),r.fa}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class li{constructor(e,t,n,s,i){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=n,this.op=s,this.removalCallback=i,this.deferred=new Te,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch((o=>{}))}get promise(){return this.deferred.promise}static createAndSchedule(e,t,n,s,i){const o=Date.now()+n,a=new li(e,t,o,s,i);return a.start(n),a}start(e){this.timerHandle=setTimeout((()=>this.handleDelayElapsed()),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new p(m.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget((()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then((e=>this.deferred.resolve(e)))):Promise.resolve()))}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function hi(r,e){if($("AsyncQueue",`${e}: ${r}`),Ke(r))return new p(m.UNAVAILABLE,`${e}: ${r}`);throw r}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pt{static emptySet(e){return new Pt(e.comparator)}constructor(e){this.comparator=e?(t,n)=>e(t,n)||y.comparator(t.key,n.key):(t,n)=>y.comparator(t.key,n.key),this.keyedMap=nn(),this.sortedSet=new O(this.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal(((t,n)=>(e(t),!1)))}add(e){const t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){const t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof Pt)||this.size!==e.size)return!1;const t=this.sortedSet.getIterator(),n=e.sortedSet.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=n.getNext().key;if(!s.isEqual(i))return!1}return!0}toString(){const e=[];return this.forEach((t=>{e.push(t.toString())})),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,t){const n=new Pt;return n.comparator=this.comparator,n.keyedMap=e,n.sortedSet=t,n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ko{constructor(){this.ga=new O(y.comparator)}track(e){const t=e.doc.key,n=this.ga.get(t);n?e.type!==0&&n.type===3?this.ga=this.ga.insert(t,e):e.type===3&&n.type!==1?this.ga=this.ga.insert(t,{type:n.type,doc:e.doc}):e.type===2&&n.type===2?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):e.type===2&&n.type===0?this.ga=this.ga.insert(t,{type:0,doc:e.doc}):e.type===1&&n.type===0?this.ga=this.ga.remove(t):e.type===1&&n.type===2?this.ga=this.ga.insert(t,{type:1,doc:n.doc}):e.type===0&&n.type===1?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):I(63341,{Rt:e,pa:n}):this.ga=this.ga.insert(t,e)}ya(){const e=[];return this.ga.inorderTraversal(((t,n)=>{e.push(n)})),e}}class Gt{constructor(e,t,n,s,i,o,a,u,c){this.query=e,this.docs=t,this.oldDocs=n,this.docChanges=s,this.mutatedKeys=i,this.fromCache=o,this.syncStateChanged=a,this.excludesMetadataChanges=u,this.hasCachedResults=c}static fromInitialDocuments(e,t,n,s,i){const o=[];return t.forEach((a=>{o.push({type:0,doc:a})})),new Gt(e,t,Pt.emptySet(t),o,n,s,!0,!1,i)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&Or(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const t=this.docChanges,n=e.docChanges;if(t.length!==n.length)return!1;for(let s=0;s<t.length;s++)if(t[s].type!==n[s].type||!t[s].doc.isEqual(n[s].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wd{constructor(){this.wa=void 0,this.Sa=[]}ba(){return this.Sa.some((e=>e.Da()))}}class vd{constructor(){this.queries=Go(),this.onlineState="Unknown",this.Ca=new Set}terminate(){(function(t,n){const s=w(t),i=s.queries;s.queries=Go(),i.forEach(((o,a)=>{for(const u of a.Sa)u.onError(n)}))})(this,new p(m.ABORTED,"Firestore shutting down"))}}function Go(){return new be((r=>Ha(r)),Or)}async function di(r,e){const t=w(r);let n=3;const s=e.query;let i=t.queries.get(s);i?!i.ba()&&e.Da()&&(n=2):(i=new wd,n=e.Da()?0:1);try{switch(n){case 0:i.wa=await t.onListen(s,!0);break;case 1:i.wa=await t.onListen(s,!1);break;case 2:await t.onFirstRemoteStoreListen(s)}}catch(o){const a=hi(o,`Initialization of query '${wt(e.query)}' failed`);return void e.onError(a)}t.queries.set(s,i),i.Sa.push(e),e.va(t.onlineState),i.wa&&e.Fa(i.wa)&&mi(t)}async function fi(r,e){const t=w(r),n=e.query;let s=3;const i=t.queries.get(n);if(i){const o=i.Sa.indexOf(e);o>=0&&(i.Sa.splice(o,1),i.Sa.length===0?s=e.Da()?0:1:!i.ba()&&e.Da()&&(s=2))}switch(s){case 0:return t.queries.delete(n),t.onUnlisten(n,!0);case 1:return t.queries.delete(n),t.onUnlisten(n,!1);case 2:return t.onLastRemoteStoreUnlisten(n);default:return}}function Rd(r,e){const t=w(r);let n=!1;for(const s of e){const i=s.query,o=t.queries.get(i);if(o){for(const a of o.Sa)a.Fa(s)&&(n=!0);o.wa=s}}n&&mi(t)}function Vd(r,e,t){const n=w(r),s=n.queries.get(e);if(s)for(const i of s.Sa)i.onError(t);n.queries.delete(e)}function mi(r){r.Ca.forEach((e=>{e.next()}))}var Cs,$o;($o=Cs||(Cs={})).Ma="default",$o.Cache="cache";class _i{constructor(e,t,n){this.query=e,this.xa=t,this.Oa=!1,this.Na=null,this.onlineState="Unknown",this.options=n||{}}Fa(e){if(!this.options.includeMetadataChanges){const n=[];for(const s of e.docChanges)s.type!==3&&n.push(s);e=new Gt(e.query,e.docs,e.oldDocs,n,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.Oa?this.Ba(e)&&(this.xa.next(e),t=!0):this.La(e,this.onlineState)&&(this.ka(e),t=!0),this.Na=e,t}onError(e){this.xa.error(e)}va(e){this.onlineState=e;let t=!1;return this.Na&&!this.Oa&&this.La(this.Na,e)&&(this.ka(this.Na),t=!0),t}La(e,t){if(!e.fromCache||!this.Da())return!0;const n=t!=="Offline";return(!this.options.qa||!n)&&(!e.docs.isEmpty()||e.hasCachedResults||t==="Offline")}Ba(e){if(e.docChanges.length>0)return!0;const t=this.Na&&this.Na.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&this.options.includeMetadataChanges===!0}ka(e){e=Gt.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.Oa=!0,this.xa.next(e)}Da(){return this.options.source!==Cs.Cache}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sc{constructor(e){this.key=e}}class ic{constructor(e){this.key=e}}class Pd{constructor(e,t){this.query=e,this.Ya=t,this.Za=null,this.hasCachedResults=!1,this.current=!1,this.Xa=S(),this.mutatedKeys=S(),this.eu=Ya(e),this.tu=new Pt(this.eu)}get nu(){return this.Ya}ru(e,t){const n=t?t.iu:new Ko,s=t?t.tu:this.tu;let i=t?t.mutatedKeys:this.mutatedKeys,o=s,a=!1;const u=this.query.limitType==="F"&&s.size===this.query.limit?s.last():null,c=this.query.limitType==="L"&&s.size===this.query.limit?s.first():null;if(e.inorderTraversal(((l,h)=>{const d=s.get(l),_=Mn(this.query,h)?h:null,T=!!d&&this.mutatedKeys.has(d.key),A=!!_&&(_.hasLocalMutations||this.mutatedKeys.has(_.key)&&_.hasCommittedMutations);let E=!1;d&&_?d.data.isEqual(_.data)?T!==A&&(n.track({type:3,doc:_}),E=!0):this.su(d,_)||(n.track({type:2,doc:_}),E=!0,(u&&this.eu(_,u)>0||c&&this.eu(_,c)<0)&&(a=!0)):!d&&_?(n.track({type:0,doc:_}),E=!0):d&&!_&&(n.track({type:1,doc:d}),E=!0,(u||c)&&(a=!0)),E&&(_?(o=o.add(_),i=A?i.add(l):i.delete(l)):(o=o.delete(l),i=i.delete(l)))})),this.query.limit!==null)for(;o.size>this.query.limit;){const l=this.query.limitType==="F"?o.last():o.first();o=o.delete(l.key),i=i.delete(l.key),n.track({type:1,doc:l})}return{tu:o,iu:n,Cs:a,mutatedKeys:i}}su(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,n,s){const i=this.tu;this.tu=e.tu,this.mutatedKeys=e.mutatedKeys;const o=e.iu.ya();o.sort(((l,h)=>(function(_,T){const A=E=>{switch(E){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return I(20277,{Rt:E})}};return A(_)-A(T)})(l.type,h.type)||this.eu(l.doc,h.doc))),this.ou(n),s=s??!1;const a=t&&!s?this._u():[],u=this.Xa.size===0&&this.current&&!s?1:0,c=u!==this.Za;return this.Za=u,o.length!==0||c?{snapshot:new Gt(this.query,e.tu,i,o,e.mutatedKeys,u===0,c,!1,!!n&&n.resumeToken.approximateByteSize()>0),au:a}:{au:a}}va(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({tu:this.tu,iu:new Ko,mutatedKeys:this.mutatedKeys,Cs:!1},!1)):{au:[]}}uu(e){return!this.Ya.has(e)&&!!this.tu.has(e)&&!this.tu.get(e).hasLocalMutations}ou(e){e&&(e.addedDocuments.forEach((t=>this.Ya=this.Ya.add(t))),e.modifiedDocuments.forEach((t=>{})),e.removedDocuments.forEach((t=>this.Ya=this.Ya.delete(t))),this.current=e.current)}_u(){if(!this.current)return[];const e=this.Xa;this.Xa=S(),this.tu.forEach((n=>{this.uu(n.key)&&(this.Xa=this.Xa.add(n.key))}));const t=[];return e.forEach((n=>{this.Xa.has(n)||t.push(new ic(n))})),this.Xa.forEach((n=>{e.has(n)||t.push(new sc(n))})),t}cu(e){this.Ya=e.Qs,this.Xa=S();const t=this.ru(e.documents);return this.applyChanges(t,!0)}lu(){return Gt.fromInitialDocuments(this.query,this.tu,this.mutatedKeys,this.Za===0,this.hasCachedResults)}}const Jt="SyncEngine";class Sd{constructor(e,t,n){this.query=e,this.targetId=t,this.view=n}}class bd{constructor(e){this.key=e,this.hu=!1}}class Cd{constructor(e,t,n,s,i,o){this.localStore=e,this.remoteStore=t,this.eventManager=n,this.sharedClientState=s,this.currentUser=i,this.maxConcurrentLimboResolutions=o,this.Pu={},this.Tu=new be((a=>Ha(a)),Or),this.Iu=new Map,this.Eu=new Set,this.du=new O(y.comparator),this.Au=new Map,this.Ru=new ti,this.Vu={},this.mu=new Map,this.fu=ht.cr(),this.onlineState="Unknown",this.gu=void 0}get isPrimaryClient(){return this.gu===!0}}async function Dd(r,e,t=!0){const n=jr(r);let s;const i=n.Tu.get(e);return i?(n.sharedClientState.addLocalQueryTarget(i.targetId),s=i.view.lu()):s=await oc(n,e,t,!0),s}async function xd(r,e){const t=jr(r);await oc(t,e,!0,!1)}async function oc(r,e,t,n){const s=await wr(r.localStore,he(e)),i=s.targetId,o=r.sharedClientState.addLocalQueryTarget(i,t);let a;return n&&(a=await gi(r,e,i,o==="current",s.resumeToken)),r.isPrimaryClient&&t&&$r(r.remoteStore,s),a}async function gi(r,e,t,n,s){r.pu=(h,d,_)=>(async function(A,E,N,b){let P=E.view.ru(N);P.Cs&&(P=await Vs(A.localStore,E.query,!1).then((({documents:ee})=>E.view.ru(ee,P))));const q=b&&b.targetChanges.get(E.targetId),G=b&&b.targetMismatches.get(E.targetId)!=null,B=E.view.applyChanges(P,A.isPrimaryClient,q,G);return Ds(A,E.targetId,B.au),B.snapshot})(r,h,d,_);const i=await Vs(r.localStore,e,!0),o=new Pd(e,i.Qs),a=o.ru(i.documents),u=Ln.createSynthesizedTargetChangeForCurrentChange(t,n&&r.onlineState!=="Offline",s),c=o.applyChanges(a,r.isPrimaryClient,u);Ds(r,t,c.au);const l=new Sd(e,t,o);return r.Tu.set(e,l),r.Iu.has(t)?r.Iu.get(t).push(e):r.Iu.set(t,[e]),c.snapshot}async function Nd(r,e,t){const n=w(r),s=n.Tu.get(e),i=n.Iu.get(s.targetId);if(i.length>1)return n.Iu.set(s.targetId,i.filter((o=>!Or(o,e)))),void n.Tu.delete(e);n.isPrimaryClient?(n.sharedClientState.removeLocalQueryTarget(s.targetId),n.sharedClientState.isActiveQueryTarget(s.targetId)||await zt(n.localStore,s.targetId,!1).then((()=>{n.sharedClientState.clearQueryState(s.targetId),t&&Kt(n.remoteStore,s.targetId),$t(n,s.targetId)})).catch(ze)):($t(n,s.targetId),await zt(n.localStore,s.targetId,!0))}async function kd(r,e){const t=w(r),n=t.Tu.get(e),s=t.Iu.get(n.targetId);t.isPrimaryClient&&s.length===1&&(t.sharedClientState.removeLocalQueryTarget(n.targetId),Kt(t.remoteStore,n.targetId))}async function Md(r,e,t){const n=Ti(r);try{const s=await(function(o,a){const u=w(o),c=k.now(),l=a.reduce(((_,T)=>_.add(T.key)),S());let h,d;return u.persistence.runTransaction("Locally write mutations","readwrite",(_=>{let T=le(),A=S();return u.Ns.getEntries(_,l).next((E=>{T=E,T.forEach(((N,b)=>{b.isValidDocument()||(A=A.add(N))}))})).next((()=>u.localDocuments.getOverlayedDocuments(_,T))).next((E=>{h=E;const N=[];for(const b of a){const P=rh(b,h.get(b.key).overlayedDocument);P!=null&&N.push(new Ce(b.key,P,Ua(P.value.mapValue),H.exists(!0)))}return u.mutationQueue.addMutationBatch(_,c,N,a)})).next((E=>{d=E;const N=E.applyToLocalDocumentSet(h,A);return u.documentOverlayCache.saveOverlays(_,E.batchId,N)}))})).then((()=>({batchId:d.batchId,changes:Za(h)})))})(n.localStore,e);n.sharedClientState.addPendingMutation(s.batchId),(function(o,a,u){let c=o.Vu[o.currentUser.toKey()];c||(c=new O(V)),c=c.insert(a,u),o.Vu[o.currentUser.toKey()]=c})(n,s.batchId,t),await $e(n,s.changes),await Wt(n.remoteStore)}catch(s){const i=hi(s,"Failed to persist write");t.reject(i)}}async function ac(r,e){const t=w(r);try{const n=await Zh(t.localStore,e);e.targetChanges.forEach(((s,i)=>{const o=t.Au.get(i);o&&(v(s.addedDocuments.size+s.modifiedDocuments.size+s.removedDocuments.size<=1,22616),s.addedDocuments.size>0?o.hu=!0:s.modifiedDocuments.size>0?v(o.hu,14607):s.removedDocuments.size>0&&(v(o.hu,42227),o.hu=!1))})),await $e(t,n,e)}catch(n){await ze(n)}}function jo(r,e,t){const n=w(r);if(n.isPrimaryClient&&t===0||!n.isPrimaryClient&&t===1){const s=[];n.Tu.forEach(((i,o)=>{const a=o.view.va(e);a.snapshot&&s.push(a.snapshot)})),(function(o,a){const u=w(o);u.onlineState=a;let c=!1;u.queries.forEach(((l,h)=>{for(const d of h.Sa)d.va(a)&&(c=!0)})),c&&mi(u)})(n.eventManager,e),s.length&&n.Pu.H_(s),n.onlineState=e,n.isPrimaryClient&&n.sharedClientState.setOnlineState(e)}}async function Fd(r,e,t){const n=w(r);n.sharedClientState.updateQueryState(e,"rejected",t);const s=n.Au.get(e),i=s&&s.key;if(i){let o=new O(y.comparator);o=o.insert(i,z.newNoDocument(i,R.min()));const a=S().add(i),u=new On(R.min(),new Map,new O(V),o,a);await ac(n,u),n.du=n.du.remove(i),n.Au.delete(e),Ii(n)}else await zt(n.localStore,e,!1).then((()=>$t(n,e,t))).catch(ze)}async function Od(r,e){const t=w(r),n=e.batch.batchId;try{const s=await Xh(t.localStore,e);yi(t,n,null),pi(t,n),t.sharedClientState.updateMutationState(n,"acknowledged"),await $e(t,s)}catch(s){await ze(s)}}async function Ld(r,e,t){const n=w(r);try{const s=await(function(o,a){const u=w(o);return u.persistence.runTransaction("Reject batch","readwrite-primary",(c=>{let l;return u.mutationQueue.lookupMutationBatch(c,a).next((h=>(v(h!==null,37113),l=h.keys(),u.mutationQueue.removeMutationBatch(c,h)))).next((()=>u.mutationQueue.performConsistencyCheck(c))).next((()=>u.documentOverlayCache.removeOverlaysForBatchId(c,l,a))).next((()=>u.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(c,l))).next((()=>u.localDocuments.getDocuments(c,l)))}))})(n.localStore,e);yi(n,e,t),pi(n,e),n.sharedClientState.updateMutationState(e,"rejected",t),await $e(n,s)}catch(s){await ze(s)}}function pi(r,e){(r.mu.get(e)||[]).forEach((t=>{t.resolve()})),r.mu.delete(e)}function yi(r,e,t){const n=w(r);let s=n.Vu[n.currentUser.toKey()];if(s){const i=s.get(e);i&&(t?i.reject(t):i.resolve(),s=s.remove(e)),n.Vu[n.currentUser.toKey()]=s}}function $t(r,e,t=null){r.sharedClientState.removeLocalQueryTarget(e);for(const n of r.Iu.get(e))r.Tu.delete(n),t&&r.Pu.yu(n,t);r.Iu.delete(e),r.isPrimaryClient&&r.Ru.jr(e).forEach((n=>{r.Ru.containsKey(n)||uc(r,n)}))}function uc(r,e){r.Eu.delete(e.path.canonicalString());const t=r.du.get(e);t!==null&&(Kt(r.remoteStore,t),r.du=r.du.remove(e),r.Au.delete(t),Ii(r))}function Ds(r,e,t){for(const n of t)n instanceof sc?(r.Ru.addReference(n.key,e),Ud(r,n)):n instanceof ic?(g(Jt,"Document no longer in limbo: "+n.key),r.Ru.removeReference(n.key,e),r.Ru.containsKey(n.key)||uc(r,n.key)):I(19791,{wu:n})}function Ud(r,e){const t=e.key,n=t.path.canonicalString();r.du.get(t)||r.Eu.has(n)||(g(Jt,"New document in limbo: "+t),r.Eu.add(n),Ii(r))}function Ii(r){for(;r.Eu.size>0&&r.du.size<r.maxConcurrentLimboResolutions;){const e=r.Eu.values().next().value;r.Eu.delete(e);const t=new y(x.fromString(e)),n=r.fu.next();r.Au.set(n,new bd(t)),r.du=r.du.insert(t,n),$r(r.remoteStore,new Ve(he(kn(t.path)),n,"TargetPurposeLimboResolution",ae.ce))}}async function $e(r,e,t){const n=w(r),s=[],i=[],o=[];n.Tu.isEmpty()||(n.Tu.forEach(((a,u)=>{o.push(n.pu(u,e,t).then((c=>{var l;if((c||t)&&n.isPrimaryClient){const h=c?!c.fromCache:(l=t==null?void 0:t.targetChanges.get(u.targetId))==null?void 0:l.current;n.sharedClientState.updateQueryState(u.targetId,h?"current":"not-current")}if(c){s.push(c);const h=si.As(u.targetId,c);i.push(h)}})))})),await Promise.all(o),n.Pu.H_(s),await(async function(u,c){const l=w(u);try{await l.persistence.runTransaction("notifyLocalViewChanges","readwrite",(h=>f.forEach(c,(d=>f.forEach(d.Es,(_=>l.persistence.referenceDelegate.addReference(h,d.targetId,_))).next((()=>f.forEach(d.ds,(_=>l.persistence.referenceDelegate.removeReference(h,d.targetId,_)))))))))}catch(h){if(!Ke(h))throw h;g(ii,"Failed to update sequence numbers: "+h)}for(const h of c){const d=h.targetId;if(!h.fromCache){const _=l.Ms.get(d),T=_.snapshotVersion,A=_.withLastLimboFreeSnapshotVersion(T);l.Ms=l.Ms.insert(d,A)}}})(n.localStore,i))}async function qd(r,e){const t=w(r);if(!t.currentUser.isEqual(e)){g(Jt,"User change. New user:",e.toKey());const n=await Bu(t.localStore,e);t.currentUser=e,(function(i,o){i.mu.forEach((a=>{a.forEach((u=>{u.reject(new p(m.CANCELLED,o))}))})),i.mu.clear()})(t,"'waitForPendingWrites' promise is rejected due to a user change."),t.sharedClientState.handleUserChange(e,n.removedBatchIds,n.addedBatchIds),await $e(t,n.Ls)}}function Bd(r,e){const t=w(r),n=t.Au.get(e);if(n&&n.hu)return S().add(n.key);{let s=S();const i=t.Iu.get(e);if(!i)return s;for(const o of i){const a=t.Tu.get(o);s=s.unionWith(a.view.nu)}return s}}async function zd(r,e){const t=w(r),n=await Vs(t.localStore,e.query,!0),s=e.view.cu(n);return t.isPrimaryClient&&Ds(t,e.targetId,s.au),s}async function Kd(r,e){const t=w(r);return Gu(t.localStore,e).then((n=>$e(t,n)))}async function Gd(r,e,t,n){const s=w(r),i=await(function(a,u){const c=w(a),l=w(c.mutationQueue);return c.persistence.runTransaction("Lookup mutation documents","readonly",(h=>l.er(h,u).next((d=>d?c.localDocuments.getDocuments(h,d):f.resolve(null)))))})(s.localStore,e);i!==null?(t==="pending"?await Wt(s.remoteStore):t==="acknowledged"||t==="rejected"?(yi(s,e,n||null),pi(s,e),(function(a,u){w(w(a).mutationQueue).ir(u)})(s.localStore,e)):I(6720,"Unknown batchState",{Su:t}),await $e(s,i)):g(Jt,"Cannot apply mutation batch with id: "+e)}async function $d(r,e){const t=w(r);if(jr(t),Ti(t),e===!0&&t.gu!==!0){const n=t.sharedClientState.getAllActiveQueryTargets(),s=await Qo(t,n.toArray());t.gu=!0,await bs(t.remoteStore,!0);for(const i of s)$r(t.remoteStore,i)}else if(e===!1&&t.gu!==!1){const n=[];let s=Promise.resolve();t.Iu.forEach(((i,o)=>{t.sharedClientState.isLocalQueryTarget(o)?n.push(o):s=s.then((()=>($t(t,o),zt(t.localStore,o,!0)))),Kt(t.remoteStore,o)})),await s,await Qo(t,n),(function(o){const a=w(o);a.Au.forEach(((u,c)=>{Kt(a.remoteStore,c)})),a.Ru.Jr(),a.Au=new Map,a.du=new O(y.comparator)})(t),t.gu=!1,await bs(t.remoteStore,!1)}}async function Qo(r,e,t){const n=w(r),s=[],i=[];for(const o of e){let a;const u=n.Iu.get(o);if(u&&u.length!==0){a=await wr(n.localStore,he(u[0]));for(const c of u){const l=n.Tu.get(c),h=await zd(n,l);h.snapshot&&i.push(h.snapshot)}}else{const c=await Ku(n.localStore,o);a=await wr(n.localStore,c),await gi(n,cc(c),o,!1,a.resumeToken)}s.push(a)}return n.Pu.H_(i),s}function cc(r){return Qa(r.path,r.collectionGroup,r.orderBy,r.filters,r.limit,"F",r.startAt,r.endAt)}function jd(r){return(function(t){return w(w(t).persistence).Ts()})(w(r).localStore)}async function Qd(r,e,t,n){const s=w(r);if(s.gu)return void g(Jt,"Ignoring unexpected query state notification.");const i=s.Iu.get(e);if(i&&i.length>0)switch(t){case"current":case"not-current":{const o=await Gu(s.localStore,Ja(i[0])),a=On.createSynthesizedRemoteEventForCurrentChange(e,t==="current",j.EMPTY_BYTE_STRING);await $e(s,o,a);break}case"rejected":await zt(s.localStore,e,!0),$t(s,e,n);break;default:I(64155,t)}}async function Wd(r,e,t){const n=jr(r);if(n.gu){for(const s of e){if(n.Iu.has(s)&&n.sharedClientState.isActiveQueryTarget(s)){g(Jt,"Adding an already active target "+s);continue}const i=await Ku(n.localStore,s),o=await wr(n.localStore,i);await gi(n,cc(i),o.targetId,!1,o.resumeToken),$r(n.remoteStore,o)}for(const s of t)n.Iu.has(s)&&await zt(n.localStore,s,!1).then((()=>{Kt(n.remoteStore,s),$t(n,s)})).catch(ze)}}function jr(r){const e=w(r);return e.remoteStore.remoteSyncer.applyRemoteEvent=ac.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=Bd.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=Fd.bind(null,e),e.Pu.H_=Rd.bind(null,e.eventManager),e.Pu.yu=Vd.bind(null,e.eventManager),e}function Ti(r){const e=w(r);return e.remoteStore.remoteSyncer.applySuccessfulWrite=Od.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=Ld.bind(null,e),e}class Sn{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=Kr(e.databaseInfo.databaseId),this.sharedClientState=this.Du(e),this.persistence=this.Cu(e),await this.persistence.start(),this.localStore=this.vu(e),this.gcScheduler=this.Fu(e,this.localStore),this.indexBackfillerScheduler=this.Mu(e,this.localStore)}Fu(e,t){return null}Mu(e,t){return null}vu(e){return qu(this.persistence,new Uu,e.initialUser,this.serializer)}Cu(e){return new ni(zr.mi,this.serializer)}Du(e){return new Hu}async terminate(){var e,t;(e=this.gcScheduler)==null||e.stop(),(t=this.indexBackfillerScheduler)==null||t.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}Sn.provider={build:()=>new Sn};class Hd extends Sn{constructor(e){super(),this.cacheSizeBytes=e}Fu(e,t){v(this.persistence.referenceDelegate instanceof Ar,46915);const n=this.persistence.referenceDelegate.garbageCollector;return new Nu(n,e.asyncQueue,t)}Cu(e){const t=this.cacheSizeBytes!==void 0?ne.withCacheSize(this.cacheSizeBytes):ne.DEFAULT;return new ni((n=>Ar.mi(n,t)),this.serializer)}}class lc extends Sn{constructor(e,t,n){super(),this.xu=e,this.cacheSizeBytes=t,this.forceOwnership=n,this.kind="persistent",this.synchronizeTabs=!1}async initialize(e){await super.initialize(e),await this.xu.initialize(this,e),await Ti(this.xu.syncEngine),await Wt(this.xu.remoteStore),await this.persistence.Ji((()=>(this.gcScheduler&&!this.gcScheduler.started&&this.gcScheduler.start(),this.indexBackfillerScheduler&&!this.indexBackfillerScheduler.started&&this.indexBackfillerScheduler.start(),Promise.resolve())))}vu(e){return qu(this.persistence,new Uu,e.initialUser,this.serializer)}Fu(e,t){const n=this.persistence.referenceDelegate.garbageCollector;return new Nu(n,e.asyncQueue,t)}Mu(e,t){const n=new il(t,this.persistence);return new sl(e.asyncQueue,n)}Cu(e){const t=Lu(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey),n=this.cacheSizeBytes!==void 0?ne.withCacheSize(this.cacheSizeBytes):ne.DEFAULT;return new ri(this.synchronizeTabs,t,e.clientId,n,e.asyncQueue,Ju(),ar(),this.serializer,this.sharedClientState,!!this.forceOwnership)}Du(e){return new Hu}}class Jd extends lc{constructor(e,t){super(e,t,!1),this.xu=e,this.cacheSizeBytes=t,this.synchronizeTabs=!0}async initialize(e){await super.initialize(e);const t=this.xu.syncEngine;this.sharedClientState instanceof ns&&(this.sharedClientState.syncEngine={Co:Gd.bind(null,t),vo:Qd.bind(null,t),Fo:Wd.bind(null,t),Ts:jd.bind(null,t),Do:Kd.bind(null,t)},await this.sharedClientState.start()),await this.persistence.Ji((async n=>{await $d(this.xu.syncEngine,n),this.gcScheduler&&(n&&!this.gcScheduler.started?this.gcScheduler.start():n||this.gcScheduler.stop()),this.indexBackfillerScheduler&&(n&&!this.indexBackfillerScheduler.started?this.indexBackfillerScheduler.start():n||this.indexBackfillerScheduler.stop())}))}Du(e){const t=Ju();if(!ns.v(t))throw new p(m.UNIMPLEMENTED,"IndexedDB persistence is only available on platforms that support LocalStorage.");const n=Lu(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey);return new ns(t,e.asyncQueue,n,e.clientId,e.initialUser)}}class bn{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=n=>jo(this.syncEngine,n,1),this.remoteStore.remoteSyncer.handleCredentialChange=qd.bind(null,this.syncEngine),await bs(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return(function(){return new vd})()}createDatastore(e){const t=Kr(e.databaseInfo.databaseId),n=(function(i){return new od(i)})(e.databaseInfo);return(function(i,o,a,u){return new ld(i,o,a,u)})(e.authCredentials,e.appCheckCredentials,n,t)}createRemoteStore(e){return(function(n,s,i,o,a){return new dd(n,s,i,o,a)})(this.localStore,this.datastore,e.asyncQueue,(t=>jo(this.syncEngine,t,0)),(function(){return qo.v()?new qo:new nd})())}createSyncEngine(e,t){return(function(s,i,o,a,u,c,l){const h=new Cd(s,i,o,a,u,c);return l&&(h.gu=!0),h})(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){var e,t;await(async function(s){const i=w(s);g(dt,"RemoteStore shutting down."),i.Ea.add(5),await Un(i),i.Aa.shutdown(),i.Ra.set("Unknown")})(this.remoteStore),(e=this.datastore)==null||e.terminate(),(t=this.eventManager)==null||t.terminate()}}bn.provider={build:()=>new bn};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ei{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Ou(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Ou(this.observer.error,e):$("Uncaught Error in snapshot listener:",e.toString()))}Nu(){this.muted=!0}Ou(e,t){setTimeout((()=>{this.muted||e(t)}),0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Be="FirestoreClient";class Yd{constructor(e,t,n,s,i){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=n,this.databaseInfo=s,this.user=X.UNAUTHENTICATED,this.clientId=Ms.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=i,this.authCredentials.start(n,(async o=>{g(Be,"Received user=",o.uid),await this.authCredentialListener(o),this.user=o})),this.appCheckCredentials.start(n,(o=>(g(Be,"Received new app check token=",o),this.appCheckCredentialListener(o,this.user))))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this.databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();const e=new Te;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted((async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){const n=hi(t,"Failed to shutdown persistence");e.reject(n)}})),e.promise}}async function ss(r,e){r.asyncQueue.verifyOperationInProgress(),g(Be,"Initializing OfflineComponentProvider");const t=r.configuration;await e.initialize(t);let n=t.initialUser;r.setCredentialChangeListener((async s=>{n.isEqual(s)||(await Bu(e.localStore,s),n=s)})),e.persistence.setDatabaseDeletedListener((()=>r.terminate())),r._offlineComponents=e}async function Wo(r,e){r.asyncQueue.verifyOperationInProgress();const t=await Xd(r);g(Be,"Initializing OnlineComponentProvider"),await e.initialize(t,r.configuration),r.setCredentialChangeListener((n=>zo(e.remoteStore,n))),r.setAppCheckTokenChangeListener(((n,s)=>zo(e.remoteStore,s))),r._onlineComponents=e}async function Xd(r){if(!r._offlineComponents)if(r._uninitializedComponentsProvider){g(Be,"Using user provided OfflineComponentProvider");try{await ss(r,r._uninitializedComponentsProvider._offline)}catch(e){const t=e;if(!(function(s){return s.name==="FirebaseError"?s.code===m.FAILED_PRECONDITION||s.code===m.UNIMPLEMENTED:!(typeof DOMException<"u"&&s instanceof DOMException)||s.code===22||s.code===20||s.code===11})(t))throw t;St("Error using user provided cache. Falling back to memory cache: "+t),await ss(r,new Sn)}}else g(Be,"Using default OfflineComponentProvider"),await ss(r,new Hd(void 0));return r._offlineComponents}async function hc(r){return r._onlineComponents||(r._uninitializedComponentsProvider?(g(Be,"Using user provided OnlineComponentProvider"),await Wo(r,r._uninitializedComponentsProvider._online)):(g(Be,"Using default OnlineComponentProvider"),await Wo(r,new bn))),r._onlineComponents}function Zd(r){return hc(r).then((e=>e.syncEngine))}async function Pr(r){const e=await hc(r),t=e.eventManager;return t.onListen=Dd.bind(null,e.syncEngine),t.onUnlisten=Nd.bind(null,e.syncEngine),t.onFirstRemoteStoreListen=xd.bind(null,e.syncEngine),t.onLastRemoteStoreUnlisten=kd.bind(null,e.syncEngine),t}function ef(r,e,t={}){const n=new Te;return r.asyncQueue.enqueueAndForget((async()=>(function(i,o,a,u,c){const l=new Ei({next:d=>{l.Nu(),o.enqueueAndForget((()=>fi(i,h)));const _=d.docs.has(a);!_&&d.fromCache?c.reject(new p(m.UNAVAILABLE,"Failed to get document because the client is offline.")):_&&d.fromCache&&u&&u.source==="server"?c.reject(new p(m.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):c.resolve(d)},error:d=>c.reject(d)}),h=new _i(kn(a.path),l,{includeMetadataChanges:!0,qa:!0});return di(i,h)})(await Pr(r),r.asyncQueue,e,t,n))),n.promise}function tf(r,e,t={}){const n=new Te;return r.asyncQueue.enqueueAndForget((async()=>(function(i,o,a,u,c){const l=new Ei({next:d=>{l.Nu(),o.enqueueAndForget((()=>fi(i,h))),d.fromCache&&u.source==="server"?c.reject(new p(m.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):c.resolve(d)},error:d=>c.reject(d)}),h=new _i(a,l,{includeMetadataChanges:!0,qa:!0});return di(i,h)})(await Pr(r),r.asyncQueue,e,t,n))),n.promise}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dc(r){const e={};return r.timeoutSeconds!==void 0&&(e.timeoutSeconds=r.timeoutSeconds),e}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ho=new Map;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fc="firestore.googleapis.com",Jo=!0;class Yo{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new p(m.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=fc,this.ssl=Jo}else this.host=e.host,this.ssl=e.ssl??Jo;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e.cacheSizeBytes===void 0)this.cacheSizeBytes=Su;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<xu)throw new p(m.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}tl("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=dc(e.experimentalLongPollingOptions??{}),(function(n){if(n.timeoutSeconds!==void 0){if(isNaN(n.timeoutSeconds))throw new p(m.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (must not be NaN)`);if(n.timeoutSeconds<5)throw new p(m.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (minimum allowed value is 5)`);if(n.timeoutSeconds>30)throw new p(m.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (maximum allowed value is 30)`)}})(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&(function(n,s){return n.timeoutSeconds===s.timeoutSeconds})(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams}}class Qr{constructor(e,t,n,s){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=n,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Yo({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new p(m.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new p(m.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Yo(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=(function(n){if(!n)return new $c;switch(n.type){case"firstParty":return new Hc(n.sessionIndex||"0",n.iamToken||null,n.authTokenFactory||null);case"provider":return n.client;default:throw new p(m.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}})(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return(function(t){const n=Ho.get(t);n&&(g("ComponentProvider","Removing Datastore"),Ho.delete(t),n.terminate())})(this),Promise.resolve()}}function nf(r,e,t,n={}){var c;r=ie(r,Qr);const s=Ns(e),i=r._getSettings(),o={...i,emulatorOptions:r._getEmulatorOptions()},a=`${e}:${t}`;s&&(oa(`https://${a}`),Mc("Firestore",!0)),i.host!==fc&&i.host!==a&&St("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const u={...i,host:a,ssl:s,emulatorOptions:n};if(!ia(u,o)&&(r._setSettings(u),n.mockUserToken)){let l,h;if(typeof n.mockUserToken=="string")l=n.mockUserToken,h=X.MOCK_USER;else{l=Fc(n.mockUserToken,(c=r._app)==null?void 0:c.options.projectId);const d=n.mockUserToken.sub||n.mockUserToken.user_id;if(!d)throw new p(m.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");h=new X(d)}r._authCredentials=new jc(new la(l,h))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mt{constructor(e,t,n){this.converter=t,this._query=n,this.type="query",this.firestore=e}withConverter(e){return new mt(this.firestore,e,this._query)}}class K{constructor(e,t,n){this.converter=t,this._key=n,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Oe(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new K(this.firestore,e,this._key)}toJSON(){return{type:K._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,n){if(Cn(t,K._jsonSchema))return new K(e,n||null,new y(x.fromString(t.referencePath)))}}K._jsonSchemaVersion="firestore/documentReference/1.0",K._jsonSchema={type:W("string",K._jsonSchemaVersion),referencePath:W("string")};class Oe extends mt{constructor(e,t,n){super(e,t,kn(n)),this._path=n,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new K(this.firestore,null,new y(e))}withConverter(e){return new Oe(this.firestore,e,this._path)}}function wf(r,e,...t){if(r=me(r),da("collection","path",e),r instanceof Qr){const n=x.fromString(e,...t);return qi(n),new Oe(r,null,n)}{if(!(r instanceof K||r instanceof Oe))throw new p(m.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(x.fromString(e,...t));return qi(n),new Oe(r.firestore,null,n)}}function rf(r,e,...t){if(r=me(r),arguments.length===1&&(e=Ms.newId()),da("doc","path",e),r instanceof Qr){const n=x.fromString(e,...t);return Ui(n),new K(r,null,new y(n))}{if(!(r instanceof K||r instanceof Oe))throw new p(m.INVALID_ARGUMENT,"Expected first argument to doc() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(x.fromString(e,...t));return Ui(n),new K(r.firestore,r instanceof Oe?r.converter:null,new y(n))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xo="AsyncQueue";class Zo{constructor(e=Promise.resolve()){this.Xu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new Yu(this,"async_queue_retry"),this._c=()=>{const n=ar();n&&g(Xo,"Visibility state changed to "+n.visibilityState),this.M_.w_()},this.ac=e;const t=ar();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.uc(),this.cc(e)}enterRestrictedMode(e){if(!this.ec){this.ec=!0,this.sc=e||!1;const t=ar();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this._c)}}enqueue(e){if(this.uc(),this.ec)return new Promise((()=>{}));const t=new Te;return this.cc((()=>this.ec&&this.sc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise))).then((()=>t.promise))}enqueueRetryable(e){this.enqueueAndForget((()=>(this.Xu.push(e),this.lc())))}async lc(){if(this.Xu.length!==0){try{await this.Xu[0](),this.Xu.shift(),this.M_.reset()}catch(e){if(!Ke(e))throw e;g(Xo,"Operation failed with retryable error: "+e)}this.Xu.length>0&&this.M_.p_((()=>this.lc()))}}cc(e){const t=this.ac.then((()=>(this.rc=!0,e().catch((n=>{throw this.nc=n,this.rc=!1,$("INTERNAL UNHANDLED ERROR: ",ea(n)),n})).then((n=>(this.rc=!1,n))))));return this.ac=t,t}enqueueAfterDelay(e,t,n){this.uc(),this.oc.indexOf(e)>-1&&(t=0);const s=li.createAndSchedule(this,e,t,n,(i=>this.hc(i)));return this.tc.push(s),s}uc(){this.nc&&I(47125,{Pc:ea(this.nc)})}verifyOperationInProgress(){}async Tc(){let e;do e=this.ac,await e;while(e!==this.ac)}Ic(e){for(const t of this.tc)if(t.timerId===e)return!0;return!1}Ec(e){return this.Tc().then((()=>{this.tc.sort(((t,n)=>t.targetTimeMs-n.targetTimeMs));for(const t of this.tc)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.Tc()}))}dc(e){this.oc.push(e)}hc(e){const t=this.tc.indexOf(e);this.tc.splice(t,1)}}function ea(r){let e=r.message||"";return r.stack&&(e=r.stack.includes(r.message)?r.stack:r.message+`
`+r.stack),e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ta(r){return(function(t,n){if(typeof t!="object"||t===null)return!1;const s=t;for(const i of n)if(i in s&&typeof s[i]=="function")return!0;return!1})(r,["next","error","complete"])}class ve extends Qr{constructor(e,t,n,s){super(e,t,n,s),this.type="firestore",this._queue=new Zo,this._persistenceKey=(s==null?void 0:s.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new Zo(e),this._firestoreClient=void 0,await e}}}function vf(r,e,t){t||(t=An);const n=sa(r,"firestore");if(n.isInitialized(t)){const s=n.getImmediate({identifier:t}),i=n.getOptions(t);if(ia(i,e))return s;throw new p(m.FAILED_PRECONDITION,"initializeFirestore() has already been called with different options. To avoid this error, call initializeFirestore() with the same options as when it was originally called, or call getFirestore() to return the already initialized instance.")}if(e.cacheSizeBytes!==void 0&&e.localCache!==void 0)throw new p(m.INVALID_ARGUMENT,"cache and cacheSizeBytes cannot be specified at the same time as cacheSizeBytes willbe deprecated. Instead, specify the cache size in the cache object");if(e.cacheSizeBytes!==void 0&&e.cacheSizeBytes!==-1&&e.cacheSizeBytes<xu)throw new p(m.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");return e.host&&Ns(e.host)&&oa(e.host),n.initialize({options:e,instanceIdentifier:t})}function Rf(r,e){const t=typeof r=="object"?r:bc(),n=typeof r=="string"?r:An,s=sa(t,"firestore").getImmediate({identifier:n});if(!s._initialized){const i=kc("firestore");i&&nf(s,...i)}return s}function qn(r){if(r._terminated)throw new p(m.FAILED_PRECONDITION,"The client has already been terminated.");return r._firestoreClient||sf(r),r._firestoreClient}function sf(r){var n,s,i;const e=r._freezeSettings(),t=(function(a,u,c,l){return new Nl(a,u,c,l.host,l.ssl,l.experimentalForceLongPolling,l.experimentalAutoDetectLongPolling,dc(l.experimentalLongPollingOptions),l.useFetchStreams,l.isUsingEmulator)})(r._databaseId,((n=r._app)==null?void 0:n.options.appId)||"",r._persistenceKey,e);r._componentsProvider||(s=e.localCache)!=null&&s._offlineComponentProvider&&((i=e.localCache)!=null&&i._onlineComponentProvider)&&(r._componentsProvider={_offline:e.localCache._offlineComponentProvider,_online:e.localCache._onlineComponentProvider}),r._firestoreClient=new Yd(r._authCredentials,r._appCheckCredentials,r._queue,t,r._componentsProvider&&(function(a){const u=a==null?void 0:a._online.build();return{_offline:a==null?void 0:a._offline.build(u),_online:u}})(r._componentsProvider))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fe{constructor(e){this._byteString=e}static fromBase64String(e){try{return new fe(j.fromBase64String(e))}catch(t){throw new p(m.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new fe(j.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:fe._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(Cn(e,fe._jsonSchema))return fe.fromBase64String(e.bytes)}}fe._jsonSchemaVersion="firestore/bytes/1.0",fe._jsonSchema={type:W("string",fe._jsonSchemaVersion),bytes:W("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bn{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new p(m.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new U(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ai{constructor(e){this._methodName=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ee{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new p(m.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new p(m.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return V(this._lat,e._lat)||V(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:Ee._jsonSchemaVersion}}static fromJSON(e){if(Cn(e,Ee._jsonSchema))return new Ee(e.latitude,e.longitude)}}Ee._jsonSchemaVersion="firestore/geoPoint/1.0",Ee._jsonSchema={type:W("string",Ee._jsonSchemaVersion),latitude:W("number"),longitude:W("number")};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ae{constructor(e){this._values=(e||[]).map((t=>t))}toArray(){return this._values.map((e=>e))}isEqual(e){return(function(n,s){if(n.length!==s.length)return!1;for(let i=0;i<n.length;++i)if(n[i]!==s[i])return!1;return!0})(this._values,e._values)}toJSON(){return{type:Ae._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(Cn(e,Ae._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every((t=>typeof t=="number")))return new Ae(e.vectorValues);throw new p(m.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}Ae._jsonSchemaVersion="firestore/vectorValue/1.0",Ae._jsonSchema={type:W("string",Ae._jsonSchemaVersion),vectorValues:W("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const of=/^__.*__$/;class af{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return this.fieldMask!==null?new Ce(e,this.data,this.fieldMask,t,this.fieldTransforms):new Qt(e,this.data,t,this.fieldTransforms)}}class mc{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return new Ce(e,this.data,this.fieldMask,t,this.fieldTransforms)}}function _c(r){switch(r){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw I(40011,{Ac:r})}}class wi{constructor(e,t,n,s,i,o){this.settings=e,this.databaseId=t,this.serializer=n,this.ignoreUndefinedProperties=s,i===void 0&&this.Rc(),this.fieldTransforms=i||[],this.fieldMask=o||[]}get path(){return this.settings.path}get Ac(){return this.settings.Ac}Vc(e){return new wi({...this.settings,...e},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}mc(e){var s;const t=(s=this.path)==null?void 0:s.child(e),n=this.Vc({path:t,fc:!1});return n.gc(e),n}yc(e){var s;const t=(s=this.path)==null?void 0:s.child(e),n=this.Vc({path:t,fc:!1});return n.Rc(),n}wc(e){return this.Vc({path:void 0,fc:!0})}Sc(e){return Sr(e,this.settings.methodName,this.settings.bc||!1,this.path,this.settings.Dc)}contains(e){return this.fieldMask.find((t=>e.isPrefixOf(t)))!==void 0||this.fieldTransforms.find((t=>e.isPrefixOf(t.field)))!==void 0}Rc(){if(this.path)for(let e=0;e<this.path.length;e++)this.gc(this.path.get(e))}gc(e){if(e.length===0)throw this.Sc("Document fields must not be empty");if(_c(this.Ac)&&of.test(e))throw this.Sc('Document fields cannot begin and end with "__"')}}class uf{constructor(e,t,n){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=n||Kr(e)}Cc(e,t,n,s=!1){return new wi({Ac:e,methodName:t,Dc:n,path:U.emptyPath(),fc:!1,bc:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function zn(r){const e=r._freezeSettings(),t=Kr(r._databaseId);return new uf(r._databaseId,!!e.ignoreUndefinedProperties,t)}function vi(r,e,t,n,s,i={}){const o=r.Cc(i.merge||i.mergeFields?2:0,e,t,s);Ri("Data must be an object, but it was:",o,n);const a=yc(n,o);let u,c;if(i.merge)u=new ue(o.fieldMask),c=o.fieldTransforms;else if(i.mergeFields){const l=[];for(const h of i.mergeFields){const d=xs(e,h,t);if(!o.contains(d))throw new p(m.INVALID_ARGUMENT,`Field '${d}' is specified in your field mask but missing from your input data.`);Tc(l,d)||l.push(d)}u=new ue(l),c=o.fieldTransforms.filter((h=>u.covers(h.field)))}else u=null,c=o.fieldTransforms;return new af(new re(a),u,c)}class Wr extends Ai{_toFieldTransform(e){if(e.Ac!==2)throw e.Ac===1?e.Sc(`${this._methodName}() can only appear at the top level of your update data`):e.Sc(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof Wr}}function gc(r,e,t,n){const s=r.Cc(1,e,t);Ri("Data must be an object, but it was:",s,n);const i=[],o=re.empty();Ge(n,((u,c)=>{const l=Vi(e,u,t);c=me(c);const h=s.yc(l);if(c instanceof Wr)i.push(l);else{const d=Kn(c,h);d!=null&&(i.push(l),o.set(l,d))}}));const a=new ue(i);return new mc(o,a,s.fieldTransforms)}function pc(r,e,t,n,s,i){const o=r.Cc(1,e,t),a=[xs(e,n,t)],u=[s];if(i.length%2!=0)throw new p(m.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let d=0;d<i.length;d+=2)a.push(xs(e,i[d])),u.push(i[d+1]);const c=[],l=re.empty();for(let d=a.length-1;d>=0;--d)if(!Tc(c,a[d])){const _=a[d];let T=u[d];T=me(T);const A=o.yc(_);if(T instanceof Wr)c.push(_);else{const E=Kn(T,A);E!=null&&(c.push(_),l.set(_,E))}}const h=new ue(c);return new mc(l,h,o.fieldTransforms)}function cf(r,e,t,n=!1){return Kn(t,r.Cc(n?4:3,e))}function Kn(r,e){if(Ic(r=me(r)))return Ri("Unsupported field value:",e,r),yc(r,e);if(r instanceof Ai)return(function(n,s){if(!_c(s.Ac))throw s.Sc(`${n._methodName}() can only be used with update() and set()`);if(!s.path)throw s.Sc(`${n._methodName}() is not currently supported inside arrays`);const i=n._toFieldTransform(s);i&&s.fieldTransforms.push(i)})(r,e),null;if(r===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),r instanceof Array){if(e.settings.fc&&e.Ac!==4)throw e.Sc("Nested arrays are not supported");return(function(n,s){const i=[];let o=0;for(const a of n){let u=Kn(a,s.wc(o));u==null&&(u={nullValue:"NULL_VALUE"}),i.push(u),o++}return{arrayValue:{values:i}}})(r,e)}return(function(n,s){if((n=me(n))===null)return{nullValue:"NULL_VALUE"};if(typeof n=="number")return Jl(s.serializer,n);if(typeof n=="boolean")return{booleanValue:n};if(typeof n=="string")return{stringValue:n};if(n instanceof Date){const i=k.fromDate(n);return{timestampValue:Bt(s.serializer,i)}}if(n instanceof k){const i=new k(n.seconds,1e3*Math.floor(n.nanoseconds/1e3));return{timestampValue:Bt(s.serializer,i)}}if(n instanceof Ee)return{geoPointValue:{latitude:n.latitude,longitude:n.longitude}};if(n instanceof fe)return{bytesValue:du(s.serializer,n._byteString)};if(n instanceof K){const i=s.databaseId,o=n.firestore._databaseId;if(!o.isEqual(i))throw s.Sc(`Document reference is for database ${o.projectId}/${o.database} but should be for database ${i.projectId}/${i.database}`);return{referenceValue:Xs(n.firestore._databaseId||s.databaseId,n._key.path)}}if(n instanceof Ae)return(function(o,a){return{mapValue:{fields:{[Ks]:{stringValue:Gs},[Mt]:{arrayValue:{values:o.toArray().map((c=>{if(typeof c!="number")throw a.Sc("VectorValues must only contain numeric values.");return Qs(a.serializer,c)}))}}}}}})(n,s);throw s.Sc(`Unsupported field value: ${br(n)}`)})(r,e)}function yc(r,e){const t={};return Ca(r)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):Ge(r,((n,s)=>{const i=Kn(s,e.mc(n));i!=null&&(t[n]=i)})),{mapValue:{fields:t}}}function Ic(r){return!(typeof r!="object"||r===null||r instanceof Array||r instanceof Date||r instanceof k||r instanceof Ee||r instanceof fe||r instanceof K||r instanceof Ai||r instanceof Ae)}function Ri(r,e,t){if(!Ic(t)||!fa(t)){const n=br(t);throw n==="an object"?e.Sc(r+" a custom object"):e.Sc(r+" "+n)}}function xs(r,e,t){if((e=me(e))instanceof Bn)return e._internalPath;if(typeof e=="string")return Vi(r,e);throw Sr("Field path arguments must be of type string or ",r,!1,void 0,t)}const lf=new RegExp("[~\\*/\\[\\]]");function Vi(r,e,t){if(e.search(lf)>=0)throw Sr(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,r,!1,void 0,t);try{return new Bn(...e.split("."))._internalPath}catch{throw Sr(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,r,!1,void 0,t)}}function Sr(r,e,t,n,s){const i=n&&!n.isEmpty(),o=s!==void 0;let a=`Function ${e}() called with invalid data`;t&&(a+=" (via `toFirestore()`)"),a+=". ";let u="";return(i||o)&&(u+=" (found",i&&(u+=` in field ${n}`),o&&(u+=` in document ${s}`),u+=")"),new p(m.INVALID_ARGUMENT,a+r+u)}function Tc(r,e){return r.some((t=>t.isEqual(e)))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ec{constructor(e,t,n,s,i){this._firestore=e,this._userDataWriter=t,this._key=n,this._document=s,this._converter=i}get id(){return this._key.path.lastSegment()}get ref(){return new K(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new hf(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}get(e){if(this._document){const t=this._document.data.field(Ac("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}}class hf extends Ec{data(){return super.data()}}function Ac(r,e){return typeof e=="string"?Vi(r,e):e instanceof Bn?e._internalPath:e._delegate._internalPath}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wc(r){if(r.limitType==="L"&&r.explicitOrderBy.length===0)throw new p(m.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class Pi{}class df extends Pi{}function Vf(r,e,...t){let n=[];e instanceof Pi&&n.push(e),n=n.concat(t),(function(i){const o=i.filter((u=>u instanceof bi)).length,a=i.filter((u=>u instanceof Si)).length;if(o>1||o>0&&a>0)throw new p(m.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")})(n);for(const s of n)r=s._apply(r);return r}class Si extends df{constructor(e,t,n){super(),this._field=e,this._op=t,this._value=n,this.type="where"}static _create(e,t,n){return new Si(e,t,n)}_apply(e){const t=this._parse(e);return vc(e._query,t),new mt(e.firestore,e.converter,ps(e._query,t))}_parse(e){const t=zn(e.firestore);return(function(i,o,a,u,c,l,h){let d;if(c.isKeyField()){if(l==="array-contains"||l==="array-contains-any")throw new p(m.INVALID_ARGUMENT,`Invalid Query. You can't perform '${l}' queries on documentId().`);if(l==="in"||l==="not-in"){ra(h,l);const T=[];for(const A of h)T.push(na(u,i,A));d={arrayValue:{values:T}}}else d=na(u,i,h)}else l!=="in"&&l!=="not-in"&&l!=="array-contains-any"||ra(h,l),d=cf(a,o,h,l==="in"||l==="not-in");return C.create(c,l,d)})(e._query,"where",t,e.firestore._databaseId,this._field,this._op,this._value)}}class bi extends Pi{constructor(e,t){super(),this.type=e,this._queryConstraints=t}static _create(e,t){return new bi(e,t)}_parse(e){const t=this._queryConstraints.map((n=>n._parse(e))).filter((n=>n.getFilters().length>0));return t.length===1?t[0]:M.create(t,this._getOperator())}_apply(e){const t=this._parse(e);return t.getFilters().length===0?e:((function(s,i){let o=s;const a=i.getFlattenedFilters();for(const u of a)vc(o,u),o=ps(o,u)})(e._query,t),new mt(e.firestore,e.converter,ps(e._query,t)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}function na(r,e,t){if(typeof(t=me(t))=="string"){if(t==="")throw new p(m.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!Wa(e)&&t.indexOf("/")!==-1)throw new p(m.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${t}' contains a '/' character.`);const n=e.path.child(x.fromString(t));if(!y.isDocumentKey(n))throw new p(m.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${n}' is not because it has an odd number of segments (${n.length}).`);return vn(r,new y(n))}if(t instanceof K)return vn(r,t._key);throw new p(m.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${br(t)}.`)}function ra(r,e){if(!Array.isArray(r)||r.length===0)throw new p(m.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`)}function vc(r,e){const t=(function(s,i){for(const o of s)for(const a of o.getFlattenedFilters())if(i.indexOf(a.op)>=0)return a.op;return null})(r.filters,(function(s){switch(s){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}})(e.op));if(t!==null)throw t===e.op?new p(m.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new p(m.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${t.toString()}' filters.`)}class ff{convertValue(e,t="none"){switch(Le(e)){case 0:return null;case 1:return e.booleanValue;case 2:return L(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,t);case 5:return e.stringValue;case 6:return this.convertBytes(Se(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,t);case 11:return this.convertObject(e.mapValue,t);case 10:return this.convertVectorValue(e.mapValue);default:throw I(62114,{value:e})}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){const n={};return Ge(e,((s,i)=>{n[s]=this.convertValue(i,t)})),n}convertVectorValue(e){var n,s,i;const t=(i=(s=(n=e.fields)==null?void 0:n[Mt].arrayValue)==null?void 0:s.values)==null?void 0:i.map((o=>L(o.doubleValue)));return new Ae(t)}convertGeoPoint(e){return new Ee(L(e.latitude),L(e.longitude))}convertArray(e,t){return(e.values||[]).map((n=>this.convertValue(n,t)))}convertServerTimestamp(e,t){switch(t){case"previous":const n=Mr(e);return n==null?null:this.convertValue(n,t);case"estimate":return this.convertTimestamp(En(e));default:return null}}convertTimestamp(e){const t=Pe(e);return new k(t.seconds,t.nanos)}convertDocumentKey(e,t){const n=x.fromString(e);v(Au(n),9688,{name:e});const s=new at(n.get(1),n.get(3)),i=new y(n.popFirst(5));return s.isEqual(t)||$(`Document ${i} contains a document reference within a different database (${s.projectId}/${s.database}) which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),i}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ci(r,e,t){let n;return n=r?t&&(t.merge||t.mergeFields)?r.toFirestore(e,t):r.toFirestore(e):e,n}class on{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class st extends Ec{constructor(e,t,n,s,i,o){super(e,t,n,s,o),this._firestore=e,this._firestoreImpl=e,this.metadata=i}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new ur(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const n=this._document.data.field(Ac("DocumentSnapshot.get",e));if(n!==null)return this._userDataWriter.convertValue(n,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new p(m.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=st._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}}st._jsonSchemaVersion="firestore/documentSnapshot/1.0",st._jsonSchema={type:W("string",st._jsonSchemaVersion),bundleSource:W("string","DocumentSnapshot"),bundleName:W("string"),bundle:W("string")};class ur extends st{data(e={}){return super.data(e)}}class it{constructor(e,t,n,s){this._firestore=e,this._userDataWriter=t,this._snapshot=s,this.metadata=new on(s.hasPendingWrites,s.fromCache),this.query=n}get docs(){const e=[];return this.forEach((t=>e.push(t))),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach((n=>{e.call(t,new ur(this._firestore,this._userDataWriter,n.key,n,new on(this._snapshot.mutatedKeys.has(n.key),this._snapshot.fromCache),this.query.converter))}))}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new p(m.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=(function(s,i){if(s._snapshot.oldDocs.isEmpty()){let o=0;return s._snapshot.docChanges.map((a=>{const u=new ur(s._firestore,s._userDataWriter,a.doc.key,a.doc,new on(s._snapshot.mutatedKeys.has(a.doc.key),s._snapshot.fromCache),s.query.converter);return a.doc,{type:"added",doc:u,oldIndex:-1,newIndex:o++}}))}{let o=s._snapshot.oldDocs;return s._snapshot.docChanges.filter((a=>i||a.type!==3)).map((a=>{const u=new ur(s._firestore,s._userDataWriter,a.doc.key,a.doc,new on(s._snapshot.mutatedKeys.has(a.doc.key),s._snapshot.fromCache),s.query.converter);let c=-1,l=-1;return a.type!==0&&(c=o.indexOf(a.doc.key),o=o.delete(a.doc.key)),a.type!==1&&(o=o.add(a.doc),l=o.indexOf(a.doc.key)),{type:mf(a.type),doc:u,oldIndex:c,newIndex:l}}))}})(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new p(m.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=it._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=Ms.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],n=[],s=[];return this.docs.forEach((i=>{i._document!==null&&(t.push(i._document),n.push(this._userDataWriter.convertObjectMap(i._document.data.value.mapValue.fields,"previous")),s.push(i.ref.path))})),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function mf(r){switch(r){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return I(61501,{type:r})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Pf(r){r=ie(r,K);const e=ie(r.firestore,ve);return ef(qn(e),r._key).then((t=>Rc(e,r,t)))}it._jsonSchemaVersion="firestore/querySnapshot/1.0",it._jsonSchema={type:W("string",it._jsonSchemaVersion),bundleSource:W("string","QuerySnapshot"),bundleName:W("string"),bundle:W("string")};class Di extends ff{constructor(e){super(),this.firestore=e}convertBytes(e){return new fe(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new K(this.firestore,null,t)}}function Sf(r){r=ie(r,mt);const e=ie(r.firestore,ve),t=qn(e),n=new Di(e);return wc(r._query),tf(t,r._query).then((s=>new it(e,n,r,s)))}function bf(r,e,t){r=ie(r,K);const n=ie(r.firestore,ve),s=Ci(r.converter,e,t);return Gn(n,[vi(zn(n),"setDoc",r._key,s,r.converter!==null,t).toMutation(r._key,H.none())])}function Cf(r,e,t,...n){r=ie(r,K);const s=ie(r.firestore,ve),i=zn(s);let o;return o=typeof(e=me(e))=="string"||e instanceof Bn?pc(i,"updateDoc",r._key,e,t,n):gc(i,"updateDoc",r._key,e),Gn(s,[o.toMutation(r._key,H.exists(!0))])}function Df(r){return Gn(ie(r.firestore,ve),[new Fn(r._key,H.none())])}function xf(r,e){const t=ie(r.firestore,ve),n=rf(r),s=Ci(r.converter,e);return Gn(t,[vi(zn(r.firestore),"addDoc",n._key,s,r.converter!==null,{}).toMutation(n._key,H.exists(!1))]).then((()=>n))}function Nf(r,...e){var u,c,l;r=me(r);let t={includeMetadataChanges:!1,source:"default"},n=0;typeof e[n]!="object"||ta(e[n])||(t=e[n++]);const s={includeMetadataChanges:t.includeMetadataChanges,source:t.source};if(ta(e[n])){const h=e[n];e[n]=(u=h.next)==null?void 0:u.bind(h),e[n+1]=(c=h.error)==null?void 0:c.bind(h),e[n+2]=(l=h.complete)==null?void 0:l.bind(h)}let i,o,a;if(r instanceof K)o=ie(r.firestore,ve),a=kn(r._key.path),i={next:h=>{e[n]&&e[n](Rc(o,r,h))},error:e[n+1],complete:e[n+2]};else{const h=ie(r,mt);o=ie(h.firestore,ve),a=h._query;const d=new Di(o);i={next:_=>{e[n]&&e[n](new it(o,d,h,_))},error:e[n+1],complete:e[n+2]},wc(r._query)}return(function(d,_,T,A){const E=new Ei(A),N=new _i(_,E,T);return d.asyncQueue.enqueueAndForget((async()=>di(await Pr(d),N))),()=>{E.Nu(),d.asyncQueue.enqueueAndForget((async()=>fi(await Pr(d),N)))}})(qn(o),a,s,i)}function Gn(r,e){return(function(n,s){const i=new Te;return n.asyncQueue.enqueueAndForget((async()=>Md(await Zd(n),s,i))),i.promise})(qn(r),e)}function Rc(r,e,t){const n=t.docs.get(e._key),s=new Di(r);return new st(r,s,e._key,n,new on(t.hasPendingWrites,t.fromCache),e.converter)}class _f{constructor(e){let t;this.kind="persistent",e!=null&&e.tabManager?(e.tabManager._initialize(e),t=e.tabManager):(t=yf(void 0),t._initialize(e)),this._onlineComponentProvider=t._onlineComponentProvider,this._offlineComponentProvider=t._offlineComponentProvider}toJSON(){return{kind:this.kind}}}function kf(r){return new _f(r)}class gf{constructor(e){this.forceOwnership=e,this.kind="persistentSingleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=bn.provider,this._offlineComponentProvider={build:t=>new lc(t,e==null?void 0:e.cacheSizeBytes,this.forceOwnership)}}}class pf{constructor(){this.kind="PersistentMultipleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=bn.provider,this._offlineComponentProvider={build:t=>new Jd(t,e==null?void 0:e.cacheSizeBytes)}}}function yf(r){return new gf(r==null?void 0:r.forceOwnership)}function Mf(){return new pf}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class If{constructor(e,t){this._firestore=e,this._commitHandler=t,this._mutations=[],this._committed=!1,this._dataReader=zn(e)}set(e,t,n){this._verifyNotCommitted();const s=is(e,this._firestore),i=Ci(s.converter,t,n),o=vi(this._dataReader,"WriteBatch.set",s._key,i,s.converter!==null,n);return this._mutations.push(o.toMutation(s._key,H.none())),this}update(e,t,n,...s){this._verifyNotCommitted();const i=is(e,this._firestore);let o;return o=typeof(t=me(t))=="string"||t instanceof Bn?pc(this._dataReader,"WriteBatch.update",i._key,t,n,s):gc(this._dataReader,"WriteBatch.update",i._key,t),this._mutations.push(o.toMutation(i._key,H.exists(!0))),this}delete(e){this._verifyNotCommitted();const t=is(e,this._firestore);return this._mutations=this._mutations.concat(new Fn(t._key,H.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new p(m.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function is(r,e){if((r=me(r)).firestore!==e)throw new p(m.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ff(r){return qn(r=ie(r,ve)),new If(r,(e=>Gn(r,e)))}(function(e,t=!0){(function(s){jt=s})(Cc),Pc(new xc("firestore",((n,{instanceIdentifier:s,options:i})=>{const o=n.getProvider("app").getImmediate(),a=new ve(new Qc(n.getProvider("auth-internal")),new Jc(o,n.getProvider("app-check-internal")),(function(c,l){if(!Object.prototype.hasOwnProperty.apply(c.options,["projectId"]))throw new p(m.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new at(c.options.projectId,l)})(o,s),o);return i={useFetchStreams:t,...i},a._setSettings(i),a}),"PUBLIC").setMultipleInstances(!0)),Ni(Mi,Fi,e),Ni(Mi,Fi,"esm2020")})();export{Mf as a,wf as b,nf as c,rf as d,Pf as e,Sf as f,Rf as g,Df as h,vf as i,xf as j,Nf as o,kf as p,Vf as q,bf as s,Cf as u,Ff as w};
