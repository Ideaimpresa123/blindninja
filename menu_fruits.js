
const floatingFruits = [];

window.addEventListener('DOMContentLoaded', () => {
  const menu = document.getElementById('menu');
  for (let i = 0; i < 5; i++) {
    const fruit = document.createElement('img');
    fruit.src = 'images/fruit.png';
    fruit.alt = 'Frutto';
    fruit.className = 'floating-fruit';
    fruit.style.top = `${Math.random() * 80 + 10}%`;
    fruit.style.left = `${Math.random() * 80 + 10}%`;
    fruit.style.animationDelay = `${Math.random() * 5}s`;
    menu.appendChild(fruit);
    floatingFruits.push(fruit);
  }
});
