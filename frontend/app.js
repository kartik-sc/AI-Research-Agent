const form   = document.getElementById('query-form');
const query  = document.getElementById('query');
const output = document.getElementById('results');

function addCard(title, items, isList = false) {
  if (!items || items.length === 0) return;
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `<h2>${title}</h2>`;
  if (isList) {
    const ul = document.createElement('ul');
    items.forEach(i => {
      const li = document.createElement('li');
      if (typeof i === 'object' && i.url) {
        li.innerHTML = `<a href="${i.url}" target="_blank">${i.title || i.url}</a>`;
      } else {
        li.textContent = i;
      }
      ul.appendChild(li);
    });
    card.appendChild(ul);
  } else {
    const p = document.createElement('p');
    p.textContent = items;
    card.appendChild(p);
  }
  output.appendChild(card);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = query.value.trim();
  if (!q) return;
  output.innerHTML = '';
  output.classList.remove('hidden');

  try {
    const res = await fetch('http://localhost:8000/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q })
    });
    const d = await res.json();
    addCard('1. Summary', d.summary);
    addCard('2. Key Insights', d.insights, true);
    addCard('3. Open Questions', d.open_questions, true);
    addCard('4. Possible Hypotheses', d.possible_hypotheses, true);
    addCard('5. Keywords', d.keywords, true);
    addCard('6. Citations', d.citations, true);
  } catch (err) {
    output.innerHTML = `<div class="card"><h2>Error</h2><p>${err.message}</p></div>`;
  }
});
