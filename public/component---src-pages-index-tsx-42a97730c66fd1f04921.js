"use strict";(self.webpackChunkakaakuhub=self.webpackChunkakaakuhub||[]).push([[245],{1823:function(e,t,n){n.r(t),n.d(t,{Head:function(){return o},default:function(){return a}});var r=n(6540),c=n(4506);var u=e=>{let{children:t}=e;const{0:n,1:u}=(0,r.useState)([]),i=(0,r.useRef)(0),a=(0,r.useRef)(null),o=(0,r.useRef)(0),l=(0,r.useRef)(null),s=(0,r.useRef)(!1);return(0,r.useEffect)((()=>{const e=e=>{l.current={x:e.clientX,y:e.clientY},s.current=!0},t=e=>{l.current={x:e.touches[0].clientX,y:e.touches[0].clientY},s.current=!0},n=()=>{s.current=!1},r=()=>{s.current=!1},d=e=>{s.current&&(l.current={x:e.clientX,y:e.clientY})},v=e=>{s.current&&(l.current={x:e.touches[0].clientX,y:e.touches[0].clientY})};window.addEventListener("mousedown",e),window.addEventListener("mouseup",n),window.addEventListener("dragend",n),window.addEventListener("mousemove",d),window.addEventListener("touchstart",t),window.addEventListener("touchend",r),window.addEventListener("touchmove",v);return a.current=window.setInterval((()=>{const e=Date.now();if(s.current&&e-o.current>100){var t,n;const r={id:i.current,x:(null===(t=l.current)||void 0===t?void 0:t.x)||0,y:(null===(n=l.current)||void 0===n?void 0:n.y)||0,expirationTime:e+500};u((e=>[].concat((0,c.A)(e),[r]))),i.current+=1,o.current=e}u((t=>t.filter((t=>t.expirationTime>e))))}),100),()=>{window.removeEventListener("mousedown",e),window.removeEventListener("mouseup",n),window.removeEventListener("mousemove",d),window.removeEventListener("touchstart",t),window.removeEventListener("touchend",r),window.removeEventListener("touchmove",v),null!==a.current&&clearInterval(a.current)}}),[]),r.createElement("div",{className:"tap-effect-container"},n.map((e=>r.createElement("div",{key:e.id,className:"tap-effect",style:{left:e.x-25+"px",top:e.y-25+"px"}}))),t)};var i=()=>r.createElement("div",null,r.createElement("div",{className:"navigation"},r.createElement("div",{className:"navigation_button"},"1"),r.createElement("div",{className:"navigation_button"},"2"),r.createElement("div",{className:"navigation_button"},"3")));var a=()=>r.createElement("main",null,r.createElement(u,null,r.createElement("div",null,"ここが本文の予定です ここが本文の予定です ここが本文の予定です ここが本文の予定です ここが本文の予定です ここが本文の予定です ここが本文の予定です ここが本文の予定です"),r.createElement(i,null)));const o=()=>r.createElement("title",null,"Home Page")}}]);
//# sourceMappingURL=component---src-pages-index-tsx-42a97730c66fd1f04921.js.map