let videoCategories = {};

const BASE = 'https://tube-sciences-technologies.apps.education.fr';
const CHANNEL = 'rolland_renaud_channel';
const PAGE_SIZE = 10;

const grid = document.querySelector('#video-grid');
const status = document.querySelector('#video-status');
const search = document.querySelector('#video-search');
const level = document.querySelector('#video-level');
const type = document.querySelector('#video-type');
const dialog = document.querySelector('#video-dialog');
const player = document.querySelector('#video-player');
const dialogTitle = document.querySelector('#video-dialog-title');
const closeButton = document.querySelector('#video-close');

let videos = [];
let previousFocus = null;

function duration(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function categoryOf(video) {
  return videoCategories[video.uuid] || {
    niveaux: [],
    type: null,
    themes: []
  };
}

function label(value) {
  return {
    '6e': '6e',
    '3e': '3e',
    automatismes: 'Automatismes',
    exercices: 'Exercices',
    cours: 'Cours',
    unclassified: 'À classer'
  }[value] || value;
}

async function loadVideos() {
  const result = [];
  let total = Infinity;

  for (let start = 0; start < total; start += PAGE_SIZE) {
    const url =
      `${BASE}/api/v1/video-channels/${CHANNEL}/videos` +
      `?start=${start}&count=${PAGE_SIZE}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    const json = await response.json();

    if (!Array.isArray(json.data) ||
        !Number.isInteger(json.total)) {
      throw new Error('Réponse PeerTube inattendue');
    }

    total = json.total;
    result.push(...json.data);

    if (!json.data.length) break;
  }

  return result;
}

function openVideo(video) {
  previousFocus = document.activeElement;
  dialogTitle.textContent = video.name;
  player.replaceChildren();

  const iframe = document.createElement('iframe');
  iframe.title = video.name;
  iframe.src = new URL(video.embedPath, BASE).href;
  iframe.allow = 'fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;

  player.append(iframe);
  dialog.hidden = false;
  document.body.classList.add('video-modal-open');
  closeButton.focus();
}

function closeVideo() {
  if (dialog.hidden) return;

  dialog.hidden = true;
  player.replaceChildren();
  document.body.classList.remove('video-modal-open');
  previousFocus?.focus();
}

function render() {
  const term = search.value.trim().toLocaleLowerCase('fr');

  const selected = videos.filter(video => {
    const category = categoryOf(video);

    const levelMatches =
      level.value === 'all' ||
      (
        level.value === 'unclassified'
          ? !category.niveaux?.length
          : category.niveaux?.includes(level.value)
      );

    const typeMatches =
      type.value === 'all' ||
      (
        type.value === 'unclassified'
          ? !category.type
          : category.type === type.value
      );

    const searchMatches =
      video.name.toLocaleLowerCase('fr').includes(term);

    return levelMatches && typeMatches && searchMatches;
  });

  status.textContent =
    `${selected.length} vidéo${selected.length > 1 ? 's' : ''} ` +
    `affichée${selected.length > 1 ? 's' : ''} ` +
    `sur ${videos.length}`;

  grid.replaceChildren();

  for (const video of selected) {
    const category = categoryOf(video);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'video-card';

    const thumb = document.createElement('div');
    thumb.className = 'video-thumb';

    const image = document.createElement('img');
    image.src = new URL(video.thumbnailPath, BASE).href;
    image.alt = '';
    image.loading = 'lazy';
    thumb.append(image);

    const time = document.createElement('span');
    time.className = 'video-duration';
    time.textContent = duration(video.duration);
    thumb.append(time);

    const title = document.createElement('span');
    title.className = 'video-card-title';
    title.textContent = video.name;

    const meta = document.createElement('span');
    meta.className = 'video-card-meta';

    meta.textContent =
      `${
        category.niveaux?.length
          ? category.niveaux.join(' / ')
          : 'Niveau à classer'
      } · ${
        label(category.type || 'unclassified')
      }${
        category.themes?.length
          ? ' · ' + category.themes.join(', ')
          : ''
      }`;

    button.append(thumb, title, meta);
    button.addEventListener('click', () => openVideo(video));
    grid.append(button);
  }
}

search.addEventListener('input', render);
level.addEventListener('change', render);
type.addEventListener('change', render);

closeButton.addEventListener('click', closeVideo);
dialog.querySelector('[data-close]').addEventListener(
  'click',
  closeVideo
);

document.addEventListener('keydown', event => {
  if (dialog.hidden) return;

  if (event.key === 'Escape') closeVideo();

  if (event.key === 'Tab') {
    const focusable = [
      closeButton,
      player.querySelector('iframe')
    ].filter(Boolean);

    const index = focusable.indexOf(document.activeElement);

    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      focusable.at(-1).focus();
    } else if (
      !event.shiftKey &&
      index === focusable.length - 1
    ) {
      event.preventDefault();
      focusable[0].focus();
    }
  }
});

try {
  const response = await fetch(
    './videoCategories.json',
    { cache: 'no-store' }
  );

  if (!response.ok) {
    throw new Error(
      `Classement JSON : HTTP ${response.status}`
    );
  }

  videoCategories = await response.json();
  videos = await loadVideos();
  render();

} catch (error) {
  status.textContent =
    'Impossible de charger les vidéos ou leur classement. ' +
    'Vérifie la connexion et le fichier videoCategories.json.';

  console.error('Vidéothèque PeerTube :', error);
}