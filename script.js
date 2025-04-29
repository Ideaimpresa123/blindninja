let currentDifficulty = 'facile';

window.onload = () => {
    const logo = document.getElementById("logo-screen");
    setTimeout(() => {
        logo.style.display = "none";
        showMenu();
    }, 5000);
};

// Tasto Invio sempre valido per tornare al menu
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        stopGame?.();
        showMenu();
    }
});

// Cursore personalizzato (immagine da sostituire in seguito)
const swordCursor = document.createElement("img");
swordCursor.id = "swordCursor";
swordCursor.src = "images/sword_cursor.png"; // Placeholder, sostituibile
document.body.appendChild(swordCursor);

document.addEventListener("mousemove", (e) => {
    swordCursor.style.left = e.pageX + "px";
    swordCursor.style.top = e.pageY + "px";
});



let difficulty = 4;
let sections = [];
let canvas, ctx;

let fruit = null;
let blade = { x: 0, y: 0, slicing: false };
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let gameMode = "classico";
let timer = 60;
let timerInterval;
let listening = false;
let recognition;

let trail = [];
let splashes = [];


const fruitImgs = [
  new Image(), new Image(), new Image()
];
fruitImgs[0].src = "images/fruit.png";
fruitImgs[1].src = "images/fruit1.png";
fruitImgs[2].src = "images/fruit2.png";

const fruitHalf1 = new Image();
fruitHalf1.src = "images/fruit_half1.png";
const fruitHalf2 = new Image();
fruitHalf2.src = "images/fruit_half2.png";
const bombImg = new Image();
bombImg.src = "images/bomb.png";

window.onload = () => {
  speak("Benvenuto. Quale difficoltà vuoi giocare? Puoi dire: Facile, Medio, Difficile, Tempo, Allenamento, Sfida del giorno o Statistiche.");
  setTimeout(startVoiceRecognition, 5000);
};

function speak(text, pitch = 1, rate = 0.95) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "it-IT";
  utterance.pitch = pitch;
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.rate = 0.9;
  utterance.volume = 1;
  speechSynthesis.speak(utterance);
}

function startVoiceRecognition() {
  if (listening) return;
  listening = true;
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "it-IT";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.toLowerCase();
    handleCommand(command);
  };

  recognition.onerror = () => {
    speak("Non ho capito. Riprova.");
    listening = false;
    setTimeout(startVoiceRecognition, 3000);
  };

  recognition.onend = () => { listening = false; };

  recognition.start();
}

function handleCommand(command) {
  if (command.includes("facile")) { difficulty = 4; gameMode = "classico"; }
  else if (command.includes("medio")) { difficulty = 6; gameMode = "classico"; }
  else if (command.includes("difficile")) { difficulty = 8; gameMode = "classico"; }
  else if (command.includes("tempo")) { difficulty = 6; gameMode = "tempo"; }
  else if (command.includes("allenamento")) { difficulty = 4; gameMode = "allenamento"; }
  else if (command.includes("statistiche")) { return speakStats(); }
  else if (command.includes("rigioca")) { return location.reload(); }
  else {
    
    return;
  }

  speak("Hai scelto la modalità " + command);
  initGame();
  if (recognition) recognition.stop();
}

function speakStats() {
  const stats = JSON.parse(localStorage.getItem("stats") || '{"totalFruits":0,"totalTime":0,"gamesPlayed":0}');
  speak(`Hai giocato ${stats.gamesPlayed} partite. Hai tagliato ${stats.totalFruits} frutti. Tempo totale di gioco: ${Math.round(stats.totalTime / 60)} minuti.`);
}

function initGame() {
  document.getElementById("menu").style.display = "none";
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
  canvas.style.display = "block";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  sections = [];
  const sectionWidth = canvas.width / difficulty;
  for (let i = 0; i < difficulty; i++) {
    const audio = new Audio("sounds/section" + (i + 1) + ".mp3");
    audio.volume = 0.6;
    sections.push({ x: i * sectionWidth, sound: audio });
  }

  const stats = JSON.parse(localStorage.getItem("stats") || '{"totalFruits":0,"totalTime":0,"gamesPlayed":0}');
  stats.gamesPlayed += 1;
  localStorage.setItem("stats", JSON.stringify(stats));

  if (gameMode === "tempo") {
    speak("Hai sessanta secondi. Inizia ora.");
    timer = 60;
    timerInterval = setInterval(() => {
      timer--;
      if (timer <= 0) {
        clearInterval(timerInterval);
        speak("Tempo scaduto. Il tuo punteggio è " + score);
        setTimeout(() => location.reload(), 5000);
      }
    }, 1000);
  }

  spawnFruit();
  requestAnimationFrame(gameLoop);
}

function spawnFruit() {
  const isBomb = (gameMode === "allenamento") ? false : Math.random() < 0.1;
  const x = Math.random() * (canvas.width - 100) + 50;
  const y = -50;
  const speed = 0.5 + Math.random();
  fruit = {
    x, y, speed, hit: false, type: isBomb ? 'bomb' : 'fruit', img: isBomb ? bombImg : fruitImgs[Math.floor(Math.random() * fruitImgs.length)],
    animation: null, notified: false,
  };
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  for (let i = 1; i < difficulty; i++) {
    const x = (canvas.width / difficulty) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText(`Punteggio: ${score}`, 20, 40);
  ctx.fillText(`Record: ${highScore}`, 20, 70);
  if (gameMode === "tempo") {
    ctx.fillText(`Tempo: ${timer}s`, canvas.width - 150, 40);
  }

  if (fruit && !fruit.hit) {
    fruit.y += fruit.speed;
    ctx.drawImage(fruit.img, fruit.x - 60, fruit.y - 60, 120, 120);

    if (!fruit.notified && fruit.y > 0) {
      fruit.notified = true;
      const sectionIndex = Math.floor(fruit.x / (canvas.width / difficulty));
      if (sections[sectionIndex]) sections[sectionIndex].sound.play();
      speak(fruit.type === "fruit" ? "Frutto in arrivo" : "Attenzione, bomba in arrivo");
    }

    if (blade.slicing) {
      const dx = blade.x - fruit.x;
      const dy = blade.y - fruit.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 50) handleHit();
    }

    if (fruit.y > canvas.height) spawnFruit();
  }

  if (fruit && fruit.hit && fruit.animation) {
    const { x, y, time } = fruit.animation;
    ctx.save();
    ctx.globalAlpha = 1 - time / 30;
    ctx.drawImage(fruitHalf1, x - 60 - time, y + time, 60, 60);
    ctx.drawImage(fruitHalf2, x + time, y + time, 60, 60);
    ctx.restore();
    fruit.animation.time++;
    if (fruit.animation.time > 30) spawnFruit();
  }

  for (let i = 0; i < splashes.length; i++) {
    const s = splashes[i];
    ctx.beginPath();
    ctx.fillStyle = `rgba(${s.color},${1 - s.life / 30})`;
    ctx.arc(s.x, s.y, 6 + s.life / 2, 0, Math.PI * 2);
    ctx.fill();
    s.x += s.vx;
s.y += s.vy;
s.life++;
  }
  splashes = splashes.filter(s => s.life < 30);

  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i < trail.length - 1; i++) {
    ctx.moveTo(trail[i].x, trail[i].y);
    ctx.lineTo(trail[i + 1].x, trail[i + 1].y);
  }
  ctx.stroke();
  if (trail.length > 10) trail.shift();

  const stats = JSON.parse(localStorage.getItem("stats") || '{"totalFruits":0,"totalTime":0,"gamesPlayed":0}');
  stats.totalTime += 1 / 60;
  localStorage.setItem("stats", JSON.stringify(stats));

  requestAnimationFrame(gameLoop);
}

function handleHit() {
  if (fruit.type === 'bomb') {
    fruit.hit = true;
    fruit.animation = { x: fruit.x, y: fruit.y, time: 0 };
    speak("Hai perso.", 0.7, 0.8);
    showMenu();
  } else {
    let juiceColor = "255,0,0"; // default rosso
    juiceColor = ["255,0,0", "255,200,0", "0,255,0", "255,105,180"][Math.floor(Math.random()*4)];
    addJuiceSplash(fruit.x, fruit.y, juiceColor);
    fruit.hit = true;
    fruit.animation = { x: fruit.x, y: fruit.y, time: 0 };
    score += 1;
    const stats = JSON.parse(localStorage.getItem("stats") || '{"totalFruits":0,"totalTime":0,"gamesPlayed":0}');
    stats.totalFruits += 1;
    localStorage.setItem("stats", JSON.stringify(stats));
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("highScore", highScore);
    }
    speak("Frutto tagliato! Hai fatto " + score + " punti.", 1.3, 0.9);
  }
}

document.addEventListener("mousedown", () => blade.slicing = true);
document.addEventListener("mouseup", () => blade.slicing = false);
document.addEventListener("mousemove", (e) => {
  blade.x = e.clientX;
  blade.y = e.clientY;
  trail.push({ x: e.clientX, y: e.clientY });
});

// Effetto spruzzo colorato direzionale
function addJuiceSplash(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const speed = Math.random() * 4 + 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    splashes.push({ x, y, vx, vy, color, life: 0 });
  }
}



function showMenu() {
    console.log("Mostro il menu");
    gameState = "menu";
    document.getElementById("menu").style.display = "flex";
    document.getElementById("gameCanvas").style.display = "none";
  document.getElementById("menu").style.display = "flex";
  const canvas = document.getElementById("gameCanvas");
  canvas.style.display = "none";
  speak("Benvenuto. Premi spazio e scegli la difficoltà.");
}



document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.getElementById("menu").style.display !== "none") {
    speak("Quale difficoltà vuoi giocare? Puoi dire: Facile, Medio, Difficile, Tempo, Allenamento, Sfida del giorno o Statistiche.");
    setTimeout(startVoiceRecognition, 500);
  }
});



window.addEventListener("load", () => {
    const logo = document.getElementById("logo-screen");
    if (logo) {
        setTimeout(() => {
            logo.style.display = "none";
            const menu = document.getElementById("menu");
            if (menu) {
                menu.style.display = "flex";
            }
            if (typeof showMenu === "function") {
                showMenu();
            }
        }, 5000);
    }
});
