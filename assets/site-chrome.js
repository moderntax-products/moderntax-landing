/* ModernTax Compliance Platform — global nav behaviour (mobile menu + dropdowns). */
(function () {
  var btn = document.getElementById('gnav-menu-btn');
  var panel = document.getElementById('gnav-mobile');
  if (btn && panel) {
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        panel.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var dds = document.querySelectorAll('.gnav-dd');
  function closeAll(except) {
    dds.forEach(function (dd) {
      if (dd === except) return;
      dd.classList.remove('open');
      var b = dd.querySelector('button');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  dds.forEach(function (dd) {
    var b = dd.querySelector('button');
    if (!b) return;
    dd.addEventListener('focusout', function (e) {
      if (!dd.contains(e.relatedTarget)) { dd.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); }
    });
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !dd.classList.contains('open');
      closeAll(dd);
      dd.classList.toggle('open', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.gnav-dd')) closeAll();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var inDd = document.activeElement && document.activeElement.closest && document.activeElement.closest('.gnav-dd');
      closeAll();
      if (inDd) { var b = inDd.querySelector('button'); if (b) b.focus(); }
      if (panel && panel.classList.contains('open')) {
        panel.classList.remove('open');
        if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
      }
    }
  });
})();
