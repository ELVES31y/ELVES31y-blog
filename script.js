const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
$('#year').textContent = new Date().getFullYear();
const cards = $$('.post-card');
$('#themeBtn').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  $('#themeBtn').textContent = dark ? '☀' : '☾';
  localStorage.setItem('elves-theme', dark ? 'dark' : 'light');
});
if (localStorage.getItem('elves-theme') === 'dark') {
  document.body.classList.add('dark');
  $('#themeBtn').textContent = '☀';
}
let activeCategory = '全部';
function filterCards(query='') {
  const q = query.trim().toLowerCase();
  let visible = 0;
  cards.forEach(card => {
    const matchesCategory = activeCategory === '全部' || card.dataset.category === activeCategory;
    const text = (card.dataset.search + ' ' + card.innerText).toLowerCase();
    const show = matchesCategory && (!q || text.includes(q));
    card.hidden = !show; if(show) visible++;
  });
  $('#emptyState').hidden = visible > 0;
}
$$('.category').forEach(btn => btn.addEventListener('click', () => {
  activeCategory = btn.dataset.category;
  $$('.category').forEach(b => b.classList.toggle('active', b === btn));
  filterCards($('#searchInput').value);
}));
$('#searchInput').addEventListener('input', e => { filterCards(e.target.value); $('#dialogSearch').value = e.target.value; });
const dialog = $('#searchDialog');
function openSearch(){dialog.hidden=false;$('#dialogSearch').value=$('#searchInput').value;setTimeout(()=>$('#dialogSearch').focus(),30)}
function closeSearch(){dialog.hidden=true;$('#searchBtn').focus()}
$('#searchBtn').addEventListener('click',openSearch);
$('#closeSearch').addEventListener('click',closeSearch);
dialog.addEventListener('click',e=>{if(e.target===dialog)closeSearch()});
$('#dialogSearch').addEventListener('input',e=>{$('#searchInput').value=e.target.value;filterCards(e.target.value)});
document.addEventListener('keydown',e=>{
  if(e.key==='/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();openSearch()}
  if(e.key==='Escape'&&!dialog.hidden)closeSearch();
});
$('#menuBtn').addEventListener('click',()=>$('#nav').classList.toggle('open'));
$$('#nav a').forEach(a=>a.addEventListener('click',()=>$('#nav').classList.remove('open')));
