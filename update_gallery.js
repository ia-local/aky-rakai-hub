const fs = require('fs');
const path = require('path');

const imgDirectory = path.join(__dirname, 'docs','assets', 'img');
const outputJson = path.join(__dirname, 'docs','assets', 'data', 'gallery.json');

// Lit le dossier d'images
fs.readdir(imgDirectory, (err, files) => {
    if (err) return console.error('Erreur de lecture du dossier:', err);

    // Filtre pour ne garder que les images
    const images = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));

    // Écrit le résultat dans le fichier JSON
    fs.writeFileSync(outputJson, JSON.stringify(images, null, 4));
    console.log(`✅ ${images.length} images indexées avec succès dans gallery.json !`);
});