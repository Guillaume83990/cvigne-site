/* ============================================================
   EMILIEN GOUTU — main.js
   Lit automatiquement tous les fichiers Markdown du dossier
   content/histoires/ via l'API GitHub publique
   ============================================================ */

// ⚙️ À MODIFIER si le repo GitHub change
const GITHUB_USER = "Guillaume83990";
const GITHUB_REPO = "cvigne-site";
const GITHUB_BRANCH = "main";
const HISTOIRES_PATH = "content/histoires";

/* ── Burger menu ─────────────────────────────────────────── */
function initBurger() {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('header nav ul');
    if (!burger || !nav) return;
    burger.addEventListener('click', () => {
        const ouvert = nav.classList.toggle('open');
        burger.setAttribute('aria-expanded', ouvert);
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('header nav')) {
            nav.classList.remove('open');
            burger.setAttribute('aria-expanded', false);
        }
    });
}

/* ── Scroll animations ───────────────────────────────────── */
function initAnimations() {
    const els = document.querySelectorAll('.fade-in');
    if (!els.length) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
        });
    }, { threshold: 0.12 });
    els.forEach(el => observer.observe(el));
}

/* ── Sticky header ───────────────────────────────────────── */
function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
}

/* ── Format date français ────────────────────────────────── */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── Parser le front matter YAML d'un fichier Markdown ────── */
function parseMarkdown(texte) {
    const data = {};
    const match = texte.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (match) {
        match[1].split('\n').forEach(ligne => {
            const idx = ligne.indexOf(':');
            if (idx === -1) return;
            const cle = ligne.substring(0, idx).trim();
            let val = ligne.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
            data[cle] = val;
        });
        data.body = match[2].trim();
    } else {
        data.body = texte.trim();
    }
    return data;
}

/* ── Convertir Markdown basique en HTML ──────────────────── */
function mdVersHtml(md) {
    if (!md) return '';
    return md
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/\n\n+/g, '</p><p>')
        .replace(/^(?!<[hbp])(.+)$/gm, (m) => m.startsWith('<') ? m : `<p>${m}</p>`)
        .replace(/<p><\/p>/g, '')
        .trim();
}

/* ── Charger toutes les histoires automatiquement ────────── */
async function chargerHistoires(containerId, limit = null, cartes = true) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        // 1. Récupérer la liste de tous les fichiers .md via l'API GitHub
        const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${HISTOIRES_PATH}?ref=${GITHUB_BRANCH}`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('API GitHub inaccessible');
        const fichiers = await res.json();

        // 2. Garder seulement les fichiers .md
        const fichiersMd = fichiers.filter(f => f.name.endsWith('.md'));
        if (fichiersMd.length === 0) {
            container.innerHTML = '<p class="vide-msg">Aucune histoire publiée pour le moment. Revenez bientôt&nbsp;!</p>';
            return;
        }

        // 3. Télécharger et parser chaque fichier
        const promises = fichiersMd.map(async (f) => {
            const r = await fetch(f.download_url);
            if (!r.ok) return null;
            const texte = await r.text();
            return parseMarkdown(texte);
        });

        let histoires = (await Promise.all(promises)).filter(Boolean);

        // 4. Filtrer les non publiées
        histoires = histoires.filter(h => h.publie !== 'false' && h.publie !== false);

        // 5. Trier par date décroissante
        histoires.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (limit) histoires = histoires.slice(0, limit);

        if (histoires.length === 0) {
            container.innerHTML = '<p class="vide-msg">Aucune histoire publiée pour le moment. Revenez bientôt&nbsp;!</p>';
            return;
        }

        container.innerHTML = '';
        afficherHistoires(histoires, container, cartes);

    } catch (err) {
        console.error('Erreur chargement histoires:', err);
        container.innerHTML = '<p class="vide-msg">Aucune histoire disponible pour le moment.<br>Revenez bientôt&nbsp;!</p>';
    }
}

/* ── Afficher les histoires ──────────────────────────────── */
function afficherHistoires(histoires, container, cartes) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
        });
    }, { threshold: 0.1 });

    histoires.forEach(h => {
        const titre = h.titre || h.title || '';
        const corps = h.body || h.contenu || '';

        if (cartes) {
            const extrait = corps.replace(/[#*_>]/g, '').substring(0, 180) + '…';
            const div = document.createElement('div');
            div.className = 'carte fade-in';
            div.innerHTML = `
        <div class="carte-date">${formatDate(h.date)}</div>
        <h3>${titre}</h3>
        <p>${extrait}</p>
      `;
            container.appendChild(div);
        } else {
            const article = document.createElement('article');
            article.className = 'histoire-article fade-in';
            article.innerHTML = `
        <header class="histoire-header">
          <div class="histoire-date">${formatDate(h.date)}</div>
          <h2 class="histoire-titre">${titre}</h2>
          <hr class="divider">
        </header>
        <div class="histoire-corps">${mdVersHtml(corps)}</div>
      `;
            container.appendChild(article);
        }
        observer.observe(container.lastElementChild);
    });
}

/* ── Formulaire de contact ───────────────────────────────── */
function initContact() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.textContent = 'Envoi en cours…';
        btn.disabled = true;
        try {
            const res = await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(new FormData(form)).toString()
            });
            if (res.ok) {
                afficherPopupSucces();
                form.reset();
                btn.textContent = 'Envoyer le message';
                btn.disabled = false;
            } else throw new Error();
        } catch {
            btn.textContent = 'Réessayer';
            btn.disabled = false;
            afficherPopupErreur();
        }
    });
}

/* ── Pop-ups ─────────────────────────────────────────────── */
function afficherPopupSucces() {
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `<div class="popup-box">
    <div class="popup-icon">✦</div>
    <h3>Message envoyé !</h3>
    <p>Merci pour votre message.<br>C. Vigné vous répondra avec plaisir dans les meilleurs délais.</p>
    <button class="btn btn-primary popup-fermer">Fermer</button>
  </div>`;
    document.body.appendChild(popup);
    requestAnimationFrame(() => popup.classList.add('visible'));
    popup.querySelector('.popup-fermer').addEventListener('click', () => fermerPopup(popup));
    popup.addEventListener('click', (e) => { if (e.target === popup) fermerPopup(popup); });
    document.addEventListener('keydown', function h(e) {
        if (e.key === 'Escape') { fermerPopup(popup); document.removeEventListener('keydown', h); }
    });
}

function afficherPopupErreur() {
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `<div class="popup-box">
    <div class="popup-icon" style="color:var(--bordeaux);">⚠</div>
    <h3>Une erreur est survenue</h3>
    <p>Votre message n'a pas pu être envoyé.<br>Veuillez réessayer.</p>
    <button class="btn btn-outline popup-fermer">Fermer</button>
  </div>`;
    document.body.appendChild(popup);
    requestAnimationFrame(() => popup.classList.add('visible'));
    popup.querySelector('.popup-fermer').addEventListener('click', () => fermerPopup(popup));
    popup.addEventListener('click', (e) => { if (e.target === popup) fermerPopup(popup); });
}

function fermerPopup(popup) {
    popup.classList.remove('visible');
    setTimeout(() => popup.remove(), 300);
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    initBurger();
    initAnimations();
    initHeader();
    initContact();
});