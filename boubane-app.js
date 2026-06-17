
window.toggleSidebar = function() {
  var overlay = document.getElementById('sidebar-overlay');
  var sidebar = document.querySelector('.sidebar');
  if(overlay) overlay.classList.toggle('show');
  if(sidebar) sidebar.classList.toggle('open');
};

window.go = function(pageId) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  var page = document.getElementById('page-'+pageId);
  if(page) page.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  var navItem = document.querySelector('.nav-item[data-page="' + pageId + '"]');
  if(navItem) navItem.classList.add('active');

  var overlay = document.getElementById('sidebar-overlay');
  var sidebar = document.querySelector('.sidebar');
  if(overlay) overlay.classList.remove('show');
  if(sidebar) sidebar.classList.remove('open');
  
  var md = document.getElementById('mail-detail-pane');
  if(md) md.classList.remove('mobile-show');
};

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.nav-item').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      var page = btn.getAttribute('data-page');
      if(page) window.go(page);
    });
  });
});

window.mailCompose = function() { 
  var el = document.getElementById('mail-compose-overlay'); 
  if(el) el.classList.add('open'); 
};
window.mailComposeClose = function() { 
  var el = document.getElementById('mail-compose-overlay'); 
  if(el) el.classList.remove('open'); 
};
window.mailComposeSend = window.mailComposeClose;
window.toast = function(msg) { console.log(msg); };
window.mailBackMobile = function() { 
  var el = document.getElementById('mail-detail-pane'); 
  if(el) el.classList.remove('mobile-show'); 
};
