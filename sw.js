/* =====================================================
   Biozone Service Worker — 100% Offline (cache-first)
   ★★★ v4 = medal track /15 alignment fix.
   ඉස්සරහ වෙනස් කරන්න ඕනේ නෑ.
   ===================================================== */
'use strict';
var CACHE_NAME = 'biozone-v5';

var PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-maskable.svg'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(c){
      return Promise.all(PRECACHE.map(function(u){
        return fetch(u, {cache:'reload'}).then(function(res){
          if(res && res.ok) return c.put(u, res);
        }).catch(function(){});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return (k === CACHE_NAME) ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* 100% cache-first — offline එකේ network request එකක්වත් යන්නේ නෑ */
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = null;
  try{ url = new URL(req.url); }catch(err){ return; }
  if(!url || url.origin !== location.origin) return;

  if(req.mode === 'navigate'){
    e.respondWith(
      caches.match(req, {ignoreSearch:true}).then(function(hit){
        if(hit) return hit;
        return caches.match('./index.html', {ignoreSearch:true}).then(function(hit2){
          if(hit2) return hit2;
          return fetch(req).then(function(res){
            if(res && res.ok){
              var cp = res.clone();
              caches.open(CACHE_NAME).then(function(c){ c.put('./index.html', cp); });
            }
            return res;
          });
        });
      }).catch(function(){
        return new Response(
          '<!DOCTYPE html><html lang="si"><head><meta charset="UTF-8">'
          +'<meta name="viewport" content="width=device-width,initial-scale=1">'
          +'<title>Biozone</title></head>'
          +'<body style="font-family:sans-serif;background:#d5e5dc;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">'
          +'<div style="text-align:center;padding:2rem"><div style="font-size:3rem">📡</div>'
          +'<h2 style="color:#0b5c3d">Internet connection එකක් අවශ්‍යයි</h2>'
          +'<p style="color:#4e8d6e">පළවෙනි වරක් open කරන්න internet එකක් අවශ්‍යයි.<br>ඊට පස්සේ සම්පූර්ණයෙන්ම offline වැඩ කරයි.</p></div></body></html>',
          {headers:{'Content-Type':'text/html; charset=utf-8'}}
        );
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req, {ignoreSearch:true}).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        if(res && res.ok && res.type === 'basic'){
          var cp = res.clone();
          caches.open(CACHE_NAME).then(function(c){ c.put(req, cp); });
        }
        return res;
      });
    }).catch(function(){
      return new Response('', {status:504});
    })
  );
});
