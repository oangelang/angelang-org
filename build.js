const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchRSS() {
  return new Promise((resolve, reject) => {
    https.get('https://humanityintheroom.substack.com/feed', res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseItems(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) && items.length < 3) {
    const block = m[1];
    const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/) || [])[1];
    const link = (block.match(/<link>(.*?)<\/link>/) || [])[1];
    const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1];
    if (title && link) {
      const d = new Date(pubDate);
      const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const iso = d.toISOString().split('T')[0];
      items.push({ title: title.trim(), link, date: formatted, iso });
    }
  }
  return items;
}

function buildListHTML(items) {
  return items.map(i =>
    `          <li><a href="${i.link}" target="_blank" rel="noopener noreferrer">${i.title}</a> <time datetime="${i.iso}">${i.date}</time></li>`
  ).join('\n');
}

async function main() {
  const indexPath = path.join(__dirname, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  try {
    const xml = await fetchRSS();
    const items = parseItems(xml);
    if (items.length > 0) {
      const listHTML = buildListHTML(items);
      html = html.replace(
        /<ul class="recent-posts" id="newsletter-posts">[\s\S]*?<\/ul>/,
        `<ul class="recent-posts" id="newsletter-posts">\n${listHTML}\n        </ul>`
      );
      fs.writeFileSync(indexPath, html);
      console.log(`Injected ${items.length} newsletter post(s) from RSS.`);
    } else {
      console.log('No RSS items found. Keeping static fallback.');
    }
  } catch (err) {
    console.log('RSS fetch failed, keeping static fallback:', err.message);
  }
}

main();
