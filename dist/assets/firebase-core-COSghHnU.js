import{L as W,C as b,g as L,E as G,d as B,a as K,b as R,i as z,v as J,F as O}from"./firebase-DsjMOuOd.js";const Y=(e,t)=>t.some(a=>e instanceof a);let A,x;function X(){return A||(A=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Q(){return x||(x=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const k=new WeakMap,E=new WeakMap,j=new WeakMap,g=new WeakMap,$=new WeakMap;function Z(e){const t=new Promise((a,r)=>{const n=()=>{e.removeEventListener("success",s),e.removeEventListener("error",i)},s=()=>{a(h(e.result)),n()},i=()=>{r(e.error),n()};e.addEventListener("success",s),e.addEventListener("error",i)});return t.then(a=>{a instanceof IDBCursor&&k.set(a,e)}).catch(()=>{}),$.set(t,e),t}function q(e){if(E.has(e))return;const t=new Promise((a,r)=>{const n=()=>{e.removeEventListener("complete",s),e.removeEventListener("error",i),e.removeEventListener("abort",i)},s=()=>{a(),n()},i=()=>{r(e.error||new DOMException("AbortError","AbortError")),n()};e.addEventListener("complete",s),e.addEventListener("error",i),e.addEventListener("abort",i)});E.set(e,t)}let y={get(e,t,a){if(e instanceof IDBTransaction){if(t==="done")return E.get(e);if(t==="objectStoreNames")return e.objectStoreNames||j.get(e);if(t==="store")return a.objectStoreNames[1]?void 0:a.objectStore(a.objectStoreNames[0])}return h(e[t])},set(e,t,a){return e[t]=a,!0},has(e,t){return e instanceof IDBTransaction&&(t==="done"||t==="store")?!0:t in e}};function ee(e){y=e(y)}function te(e){return e===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(t,...a){const r=e.call(w(this),t,...a);return j.set(r,t.sort?t.sort():[t]),h(r)}:Q().includes(e)?function(...t){return e.apply(w(this),t),h(k.get(this))}:function(...t){return h(e.apply(w(this),t))}}function ae(e){return typeof e=="function"?te(e):(e instanceof IDBTransaction&&q(e),Y(e,X())?new Proxy(e,y):e)}function h(e){if(e instanceof IDBRequest)return Z(e);if(g.has(e))return g.get(e);const t=ae(e);return t!==e&&(g.set(e,t),$.set(t,e)),t}const w=e=>$.get(e);function re(e,t,{blocked:a,upgrade:r,blocking:n,terminated:s}={}){const i=indexedDB.open(e,t),d=h(i);return r&&i.addEventListener("upgradeneeded",o=>{r(h(i.result),o.oldVersion,o.newVersion,h(i.transaction),o)}),a&&i.addEventListener("blocked",o=>a(o.oldVersion,o.newVersion,o)),d.then(o=>{s&&o.addEventListener("close",()=>s()),n&&o.addEventListener("versionchange",p=>n(p.oldVersion,p.newVersion,p))}).catch(()=>{}),d}const ne=["get","getKey","getAll","getAllKeys","count"],se=["put","add","delete","clear"],D=new Map;function M(e,t){if(!(e instanceof IDBDatabase&&!(t in e)&&typeof t=="string"))return;if(D.get(t))return D.get(t);const a=t.replace(/FromIndex$/,""),r=t!==a,n=se.includes(a);if(!(a in(r?IDBIndex:IDBObjectStore).prototype)||!(n||ne.includes(a)))return;const s=async function(i,...d){const o=this.transaction(i,n?"readwrite":"readonly");let p=o.store;return r&&(p=p.index(d.shift())),(await Promise.all([p[a](...d),n&&o.done]))[0]};return D.set(t,s),s}ee(e=>({...e,get:(t,a,r)=>M(t,a)||e.get(t,a,r),has:(t,a)=>!!M(t,a)||e.has(t,a)}));/**
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
 */class ie{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(a=>{if(oe(a)){const r=a.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(a=>a).join(" ")}}function oe(e){const t=e.getComponent();return(t==null?void 0:t.type)==="VERSION"}const I="@firebase/app",P="0.14.6";/**
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
 */const c=new W("@firebase/app"),ce="@firebase/app-compat",de="@firebase/analytics-compat",he="@firebase/analytics",fe="@firebase/app-check-compat",pe="@firebase/app-check",le="@firebase/auth",me="@firebase/auth-compat",ue="@firebase/database",be="@firebase/data-connect",ge="@firebase/database-compat",we="@firebase/functions",De="@firebase/functions-compat",_e="@firebase/installations",Ee="@firebase/installations-compat",ye="@firebase/messaging",Ie="@firebase/messaging-compat",Ce="@firebase/performance",ve="@firebase/performance-compat",Se="@firebase/remote-config",$e="@firebase/remote-config-compat",Be="@firebase/storage",Ae="@firebase/storage-compat",xe="@firebase/firestore",Me="@firebase/ai",Pe="@firebase/firestore-compat",Ne="firebase",Te="12.6.0";/**
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
 */const C="[DEFAULT]",Fe={[I]:"fire-core",[ce]:"fire-core-compat",[he]:"fire-analytics",[de]:"fire-analytics-compat",[pe]:"fire-app-check",[fe]:"fire-app-check-compat",[le]:"fire-auth",[me]:"fire-auth-compat",[ue]:"fire-rtdb",[be]:"fire-data-connect",[ge]:"fire-rtdb-compat",[we]:"fire-fn",[De]:"fire-fn-compat",[_e]:"fire-iid",[Ee]:"fire-iid-compat",[ye]:"fire-fcm",[Ie]:"fire-fcm-compat",[Ce]:"fire-perf",[ve]:"fire-perf-compat",[Se]:"fire-rc",[$e]:"fire-rc-compat",[Be]:"fire-gcs",[Ae]:"fire-gcs-compat",[xe]:"fire-fst",[Pe]:"fire-fst-compat",[Me]:"fire-vertex","fire-js":"fire-js",[Ne]:"fire-js-all"};/**
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
 */const l=new Map,He=new Map,v=new Map;function N(e,t){try{e.container.addComponent(t)}catch(a){c.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,a)}}function S(e){const t=e.name;if(v.has(t))return c.debug(`There were multiple attempts to register component ${t}.`),!1;v.set(t,e);for(const a of l.values())N(a,e);for(const a of He.values())N(a,e);return!0}function qe(e,t){const a=e.container.getProvider("heartbeat").getImmediate({optional:!0});return a&&a.triggerHeartbeat(),e.container.getProvider(t)}function et(e){return e==null?!1:e.settings!==void 0}/**
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
 */const Le={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},f=new G("app","Firebase",Le);/**
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
 */class Re{constructor(t,a,r){this._isDeleted=!1,this._options={...t},this._config={...a},this._name=a.name,this._automaticDataCollectionEnabled=a.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new b("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw f.create("app-deleted",{appName:this._name})}}/**
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
 */const tt=Te;function Oe(e,t={}){let a=e;typeof t!="object"&&(t={name:t});const r={name:C,automaticDataCollectionEnabled:!0,...t},n=r.name;if(typeof n!="string"||!n)throw f.create("bad-app-name",{appName:String(n)});if(a||(a=L()),!a)throw f.create("no-options");const s=l.get(n);if(s){if(B(a,s.options)&&B(r,s.config))return s;throw f.create("duplicate-app",{appName:n})}const i=new K(n);for(const o of v.values())i.addComponent(o);const d=new Re(a,r,i);return l.set(n,d),d}function at(e=C){const t=l.get(e);if(!t&&e===C&&L())return Oe();if(!t)throw f.create("no-app",{appName:e});return t}function rt(){return Array.from(l.values())}function u(e,t,a){let r=Fe[e]??e;a&&(r+=`-${a}`);const n=r.match(/\s|\//),s=t.match(/\s|\//);if(n||s){const i=[`Unable to register library "${r}" with version "${t}":`];n&&i.push(`library name "${r}" contains illegal characters (whitespace or "/")`),n&&s&&i.push("and"),s&&i.push(`version name "${t}" contains illegal characters (whitespace or "/")`),c.warn(i.join(" "));return}S(new b(`${r}-version`,()=>({library:r,version:t}),"VERSION"))}/**
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
 */const ke="firebase-heartbeat-database",je=1,m="firebase-heartbeat-store";let _=null;function U(){return _||(_=re(ke,je,{upgrade:(e,t)=>{switch(t){case 0:try{e.createObjectStore(m)}catch(a){console.warn(a)}}}}).catch(e=>{throw f.create("idb-open",{originalErrorMessage:e.message})})),_}async function Ue(e){try{const a=(await U()).transaction(m),r=await a.objectStore(m).get(V(e));return await a.done,r}catch(t){if(t instanceof O)c.warn(t.message);else{const a=f.create("idb-get",{originalErrorMessage:t==null?void 0:t.message});c.warn(a.message)}}}async function T(e,t){try{const r=(await U()).transaction(m,"readwrite");await r.objectStore(m).put(t,V(e)),await r.done}catch(a){if(a instanceof O)c.warn(a.message);else{const r=f.create("idb-set",{originalErrorMessage:a==null?void 0:a.message});c.warn(r.message)}}}function V(e){return`${e.name}!${e.options.appId}`}/**
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
 */const Ve=1024,We=30;class Ge{constructor(t){this.container=t,this._heartbeatsCache=null;const a=this.container.getProvider("app").getImmediate();this._storage=new ze(a),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var t,a;try{const n=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),s=F();if(((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((a=this._heartbeatsCache)==null?void 0:a.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===s||this._heartbeatsCache.heartbeats.some(i=>i.date===s))return;if(this._heartbeatsCache.heartbeats.push({date:s,agent:n}),this._heartbeatsCache.heartbeats.length>We){const i=Je(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(i,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){c.warn(r)}}async getHeartbeatsHeader(){var t;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const a=F(),{heartbeatsToSend:r,unsentEntries:n}=Ke(this._heartbeatsCache.heartbeats),s=R(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=a,n.length>0?(this._heartbeatsCache.heartbeats=n,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),s}catch(a){return c.warn(a),""}}}function F(){return new Date().toISOString().substring(0,10)}function Ke(e,t=Ve){const a=[];let r=e.slice();for(const n of e){const s=a.find(i=>i.agent===n.agent);if(s){if(s.dates.push(n.date),H(a)>t){s.dates.pop();break}}else if(a.push({agent:n.agent,dates:[n.date]}),H(a)>t){a.pop();break}r=r.slice(1)}return{heartbeatsToSend:a,unsentEntries:r}}class ze{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return z()?J().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const a=await Ue(this.app);return a!=null&&a.heartbeats?a:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){if(await this._canUseIndexedDBPromise){const r=await this.read();return T(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){if(await this._canUseIndexedDBPromise){const r=await this.read();return T(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...t.heartbeats]})}else return}}function H(e){return R(JSON.stringify({version:2,heartbeats:e})).length}function Je(e){if(e.length===0)return-1;let t=0,a=e[0].date;for(let r=1;r<e.length;r++)e[r].date<a&&(a=e[r].date,t=r);return t}/**
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
 */function Ye(e){S(new b("platform-logger",t=>new ie(t),"PRIVATE")),S(new b("heartbeat",t=>new Ge(t),"PRIVATE")),u(I,P,e),u(I,P,"esm2020"),u("fire-js","")}Ye("");var Xe="firebase",Qe="12.7.0";/**
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
 */u(Xe,Qe,"app");export{tt as S,S as _,et as a,qe as b,rt as c,at as g,Oe as i,u as r};
