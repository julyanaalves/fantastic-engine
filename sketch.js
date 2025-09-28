/*
  "O Construtor de Pontes" - Versão com obstáculos móveis
  Etapas implementadas: canvas + ilhas + obstáculos móveis
*/

let islandLeft, islandRight;
let obstacles = [];
let links = []; // pontos da ponte
let completed = false;
let failed = false; // novo estado quando tempo acaba
let collisionFlashFrames = 0;
let flowAnimT = 0; // usado depois
let flowParticles = [];
let removalFlashes = [];

// Sistema de Níveis
let currentLevel = 1; // 1: ponte, 2: organizador, 3: semente
const levelTimeLimit = { 1: 20*1000, 2: 20*1000, 3: 20*1000 }; // cada nível 20s
let startTime = 0;
function currentTimeLimit(){ return levelTimeLimit[currentLevel] || 20000; }

// Estado nível 2 (Organizador de Ideias)
let level2Shapes = []; // {type, x,y, size, baseColor, vx, vy, grabbed, placed, targetSlot}
let level2DragIndex = -1;
let level2Offset = {x:0,y:0};
const level2Types = ['circle','square','triangle'];
const level2PerType = 3; // 3 de cada
let level2DropZones = []; // {type, x,y,w,h, collected}
let level2Effects = []; // efeitos de encaixe

// Estado nível 3 (Semente da Curiosidade)
let seed = { x:0, y:0, stage:0 }; // stage 0..requiredOrbs
let orbs = []; // {x,y,r,collected, glow}
const level3Required = 6; // coleta para completar
let level3Effects = []; // efeitos em coleta

function resetLevelSpecific(){
  if (currentLevel === 1){
    // já tratado em initScene() para pontes
  } else if (currentLevel === 2){
    setupLevel2();
  } else if (currentLevel === 3){
    setupLevel3();
  }
}

let difficultyLastStep = 0;
const difficultyInterval = 8000; // ms
const maxExtraObstacles = 3; // além dos iniciais
let baseObstacleCount = 6;
let gameStarted = false; // só começa após clicar na tela inicial

function setup() {
  const s = Math.min(window.innerWidth, window.innerHeight);
  createCanvas(window.innerWidth, window.innerHeight).parent('container');
  initScene(); // prepara mas não inicia cronômetro
  const undoBtn = document.getElementById('undoBtn');
  if (undoBtn){
    undoBtn.addEventListener('click', undoLastLink);
    undoBtn.disabled = true;
  }
  const startBtn = document.getElementById('startBtn');
  if (startBtn){
    startBtn.addEventListener('click', startGame);
  }
  // Atualiza tela inicial para o nível 1
  showStartScreenForLevel();
  updateOverlayForLevel();
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
  initScene(true);
}

function initScene(keepBridge=false){
  const margin = width * 0.08;
  const r = Math.min(width, height) * 0.09;
  islandLeft = { x: margin, y: height/2, r };
  islandRight = { x: width - margin, y: height/2, r };
  if(!keepBridge){
    links = [];
    completed = false;
    failed = false;
    if (gameStarted){
      startTime = millis(); // só reinicia tempo se jogo já iniciou
    }
    removeFailMessage();
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) undoBtn.disabled = true;
    removalFlashes = [];
  }
  if (currentLevel === 1) generateObstacles();
}

function generateObstacles(){
  obstacles = [];
  const count = baseObstacleCount; // pode crescer
  const minX = islandLeft.x + islandLeft.r * 1.4;
  const maxX = islandRight.x - islandRight.r * 1.4;
  for (let i=0;i<count;i++){
    const baseX = random(minX, maxX);
    const y = random(height*0.25, height*0.75);
    const r = random(18, 34);
    const amp = random(40, 120); // amplitude do movimento
    const speed = random(0.4, 1.0) * (random()<0.5?1:-1);
    const axis = random()<0.5 ? 'vertical' : 'horizontal';
    obstacles.push({ baseX, x: baseX, y, baseY: y, r, amp, speed, t: random(TWO_PI), axis, type:'circle' });
  }
  difficultyLastStep = millis();
}

function draw() {
  background(244,247,251); // fundo claro
  if (collisionFlashFrames > 0){
    collisionFlashFrames--;
    background(255,230,236);
  }
  if (currentLevel === 1){
    if (gameStarted){
      updateTimer();
      updateObstacles();
      drawObstacles();
    } else {
      drawObstacles();
    }
    drawIslands();
    drawExistingBridge();
    drawPreviewLine();
    updateRemovalFlashes();
    if (completed) drawFlowAnimation();
  } else if (currentLevel === 2){
    if (gameStarted) updateTimer();
    drawLevel2();
    drawSafeTopLine();
  } else if (currentLevel === 3){
    if (gameStarted) updateTimer();
    drawLevel3();
    drawSafeTopLine();
  }
}

function updateObstacles(){
  maybeIncreaseDifficulty();
  for (const o of obstacles){
    o.t += 0.01 * o.speed;
    if (o.axis === 'vertical'){
      o.y = o.baseY + sin(o.t) * o.amp;
    } else {
      o.x = o.baseX + sin(o.t) * o.amp;
    }
    // se for retângulo mais tarde poderemos rotacionar
  }
}

function maybeIncreaseDifficulty(){
  if (completed || failed) return;
  const now = millis();
  if (now - difficultyLastStep >= difficultyInterval){
    difficultyLastStep = now;
    // Acelera velocidades
    for (const o of obstacles){
      o.speed *= 1.12;
      o.amp *= 1.05;
    }
    // Chance de novo obstáculo se não excedeu limite
    const currentExtra = obstacles.length - baseObstacleCount;
    if (currentExtra < maxExtraObstacles){
      addExtraObstacle();
    }
  }
}

function addExtraObstacle(){
  const minX = islandLeft.x + islandLeft.r * 1.4;
  const maxX = islandRight.x - islandRight.r * 1.4;
  const baseX = random(minX, maxX);
  const y = random(height*0.25, height*0.75);
  const r = random(16, 30);
  const amp = random(50, 140);
  const speed = random(0.6, 1.2) * (random()<0.5?1:-1);
  const axis = random()<0.5 ? 'vertical' : 'horizontal';
  obstacles.push({ baseX, x: baseX, y, baseY: y, r, amp, speed, t: random(TWO_PI), axis, type:'circle' });
}

function drawObstacles(){
  noStroke();
  for (const o of obstacles){
    const edgeGlow = 32;
    for (let i=4;i>=0;i--){
      const alpha = map(i,0,4,6,55);
      fill(255,110,150, alpha);
      circle(o.x, o.y, o.r*2 + i*edgeGlow*0.12);
    }
    fill(255,80,130);
    circle(o.x, o.y, o.r*2*0.9);
  }
}

function drawIslands(){
  noStroke();
  // esquerda
  push();
  translate(islandLeft.x, islandLeft.y);
  drawIslandShape(islandLeft.r, color(50,140,255));
  pop();

  // direita
  push();
  translate(islandRight.x, islandRight.y);
  drawIslandShape(islandRight.r, color(160,120,255));
  pop();
}

function drawIslandShape(r, c){
  for(let i=r; i>0; i-=2){
    const inter = map(i,0,r,0,1);
    const col = lerpColor(c, color(255), inter*0.75);
    fill(col);
    ellipse(0,0,i*2,i*2*0.95);
  }
}

function mousePressed(){
  if (!gameStarted || failed) return;
  if (currentLevel === 1) return mousePressedLevel1();
  if (currentLevel === 2) return mousePressedLevel2();
  if (currentLevel === 3) return mousePressedLevel3();
}

function mousePressedLevel1(){
  const p = createVector(mouseX, mouseY);
  if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) return;

  // 1) Verifica se clique foi em um elo existente para removê-lo
  const hitIndex = findLinkIndexNear(p.x, p.y, 12);
  if (hitIndex !== -1) {
    // salva posição para feedback
    const removed = links[hitIndex];
    links.splice(hitIndex,1);
    if (completed) { // se estava completo, desfaz estado e remove mensagem
      completed = false;
      const msg = document.querySelector('.message-final:not([data-kind="fail"])');
      if (msg) msg.remove();
      flowParticles = [];
    }
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) undoBtn.disabled = links.length === 0;
    spawnRemovalFlash(removed.x, removed.y);
    return; // não adiciona novo elo
  }

  // 2) Se não clicou em elo existente e jogo não está completo, tentar adicionar
  if (!completed){
    if (links.length > 0){
      const last = links[links.length-1];
      if (segmentHitsAnyObstacle(last, p)){
        flashCollision();
        return;
      }
    }
    links.push(p);
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) undoBtn.disabled = links.length === 0;
    checkCompletion();
  }
}

function mousePressedLevel2(){
  // detectar clique em shape
  for (let i=level2Shapes.length-1;i>=0;i--){
    const s = level2Shapes[i];
    if (s.placed) continue;
    if (pointInsideShape(mouseX, mouseY, s)){
      level2DragIndex = i;
      level2Offset.x = mouseX - s.x;
      level2Offset.y = mouseY - s.y;
      return;
    }
  }
}

function mousePressedLevel3(){
  // nada específico; movimento segue o mouse automaticamente
}

function mouseReleased(){
  if (!gameStarted || failed) return;
  if (currentLevel === 2 && level2DragIndex !== -1){
    const s = level2Shapes[level2DragIndex];
    // verificar encaixe em zona correta
    for (const z of level2DropZones){
      if (z.type === s.type && pointInRect(s.x, s.y, z.x, z.y, z.w, z.h)){
        // posicionar shape dentro da zona
        s.placed = true;
        z.collected++;
        // organizar empilhamento visual (grid simples)
        const idx = z.collected - 1;
        const cols = 3;
        const cellSize = 46; // tamanho fixo para alinhamento consistente
        const gap = 10;
        const totalWidth = cols*cellSize + (cols-1)*gap;
        const startX = z.x + (z.w - totalWidth)/2;
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const baseY = z.y + z.h/2 - cellSize/2 - 8; // leve ajuste vertical
        s.x = startX + col*(cellSize+gap) + cellSize/2;
        s.y = baseY + row*(cellSize+gap) + cellSize/2;
        s.size = cellSize; // normaliza visual
        level2Effects.push({x:s.x,y:s.y,life:22});
        break;
      }
    }
    level2DragIndex = -1;
    checkCompletionLevel2();
  }
}

function mouseDragged(){
  if (!gameStarted || failed) return;
  if (currentLevel === 2 && level2DragIndex !== -1){
    const s = level2Shapes[level2DragIndex];
    s.x = mouseX - level2Offset.x;
    s.y = mouseY - level2Offset.y;
  }
}

function touchStarted(){
  // delega para mousePressed (p5 chama ambos em desktop; previne duplo?)
  if (touches.length > 0) {
    mousePressed();
    return false; // previne default
  }
}

function keyPressed(){
  if (key === 'r' || key === 'R') {
    restartCurrentLevel();
  } else if (key === 'Backspace') {
    if (currentLevel === 1) {
      undoLastLink();
      return false;
    }
  }
}

function drawExistingBridge(){
  if (links.length === 0) return;
  strokeWeight(4);
  stroke(90,170,255);
  noFill();
  beginShape();
  for (const v of links){
    vertex(v.x, v.y);
  }
  endShape();

  // desenha pontos
  noStroke();
  for(const v of links){
    fill(200);
    circle(v.x, v.y, 10);
  }
}

function drawPreviewLine(){
  if (currentLevel !== 1) return;
  if (completed || failed) return;
  if (links.length === 0) return;
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  const last = links[links.length-1];
  const cursor = createVector(mouseX, mouseY);
  const collides = segmentHitsAnyObstacle(last, cursor);
  strokeWeight(3);
  if (collides) stroke(255,80,100,160); else stroke(120,200,255,140);
  line(last.x, last.y, cursor.x, cursor.y);
  noStroke();
  fill( collides? color(255,90,120): color(180) );
  circle(cursor.x, cursor.y, 10);
}

function checkCompletion(){
  if (currentLevel === 1){
    if (links.length < 2) return;
    const first = links[0];
    const last = links[links.length-1];
    const inLeft = dist(first.x, first.y, islandLeft.x, islandLeft.y) <= islandLeft.r*1.05;
    const inRight = dist(last.x, last.y, islandRight.x, islandRight.y) <= islandRight.r*1.05;
    if (inLeft && inRight){
      completed = true;
      createFlowParticles();
      showLevelCompletedMessage();
    }
  }
}

function createFlowParticles(){
  const totalLen = bridgeTotalLength();
  const count = 18;
  flowParticles = [];
  for (let i=0;i<count;i++){
    flowParticles.push({
      offset: random(totalLen),
      speed: random(90,140), // px por segundo
      size: random(6,12),
      hue: random(40,60)
    });
  }
}
function bridgeTotalLength(){
  let len = 0;
  for (let i=0;i<links.length-1;i++) len += p5.Vector.dist(links[i], links[i+1]);
  return len;
}
function pointAtDistanceOnBridge(d){
  let remaining = d;
  for (let i=0;i<links.length-1;i++){
    const a = links[i];
    const b = links[i+1];
    const segLen = p5.Vector.dist(a,b);
    if (remaining <= segLen){
      const t = remaining/segLen;
      return createVector(lerp(a.x,b.x,t), lerp(a.y,b.y,t));
    }
    remaining -= segLen;
  }
  return links[links.length-1].copy();
}

function drawFlowAnimation(){
  if (links.length < 2) return;
  const dt = deltaTime/1000; // segundos
  const totalLen = bridgeTotalLength();
  strokeWeight(5);
  stroke(255,255,255,25);
  noFill();
  beginShape();
  for(const v of links) vertex(v.x,v.y);
  endShape();
  // atualizar e desenhar partículas
  colorMode(HSB,360,100,100,100);
  noStroke();
  for (const p of flowParticles){
    p.offset += p.speed * dt;
    if (p.offset > totalLen) p.offset -= totalLen; // loop
    const pos = pointAtDistanceOnBridge(p.offset);
    const glowSteps = 4;
    for (let g=glowSteps; g>=0; g--){
      const alpha = map(g,0,glowSteps,10,60);
      fill(p.hue,80,100,alpha);
      circle(pos.x, pos.y, p.size + g*14);
    }
    fill(p.hue,90,100,90);
    circle(pos.x,pos.y,p.size);
  }
  colorMode(RGB,255,255,255,255);
}

function showLevelCompletedMessage(){
  let text = '';
  if (currentLevel === 1){
    text = 'Acredito que as melhores soluções nascem da conexão.<br/>Meu objetivo é construir pontes entre a tecnologia e as pessoas.';
  } else if (currentLevel === 2){
    text = 'Eu encontro clareza no caos.<br/>Organizar ideias é o primeiro passo para criar algo incrível.';
  } else if (currentLevel === 3){
    text = 'Minha maior motivação é o aprendizado contínuo.<br/>Cada novo conhecimento me ajuda a crescer e a criar.<br/><br/><strong>Muito obrigada por participar da minha experiência!</strong>';
  }
  let msg = document.createElement('div');
  msg.className = 'message-final';
  let inner = `<div>${text}<br/><br/>`;
  if (currentLevel < 3){
    inner += `<button class="nextBtn" id="nextLevelBtn">Próxima Fase</button><br/>`;
  } else {
    inner += '<small>(Pressione R para revisitar)</small>';
  }
  inner += '</div>';
  msg.innerHTML = inner;
  document.body.appendChild(msg);
  setTimeout(()=> msg.classList.add('visible'), 50);
  if (currentLevel < 3){
    setTimeout(()=>{
      const btn = document.getElementById('nextLevelBtn');
      if (btn) btn.onclick = gotoNextLevel;
    },60);
  }
}

function showFailMessage(){
  let msg = document.createElement('div');
  msg.className = 'message-final visible';
  msg.dataset.kind = 'fail';
  msg.innerHTML = '<div><strong>Tempo esgotado.</strong><br/>Você ainda pode tentar de novo!<br/><br/><small>(Pressione R para reiniciar)</small></div>';
  document.body.appendChild(msg);
}
function removeFailMessage(){
  document.querySelectorAll('.message-final[data-kind="fail"]').forEach(e=>e.remove());
}

function updateTimer(){
  if (!gameStarted || completed || failed) return; // pausa antes de iniciar
  const now = millis();
  const elapsed = now - startTime;
  const remaining = currentTimeLimit() - elapsed;
  if (remaining <= 0){
    failed = true;
    showFailMessage();
    setTimerDisplay(0);
    return;
  }
  setTimerDisplay(remaining);
}

function setTimerDisplay(remainingMs){
  const el = document.getElementById('timer');
  if (!el) return;
  const totalSec = Math.max(0, Math.floor(remainingMs/1000));
  const mm = String(Math.floor(totalSec/60)).padStart(2,'0');
  const ss = String(totalSec%60).padStart(2,'0');
  el.textContent = `${mm}:${ss}`;
  if (totalSec <= 10) el.classList.add('danger'); else el.classList.remove('danger');
  updateTimeBar(remainingMs);
}

function updateTimeBar(remainingMs){
  const wrap = document.getElementById('timeBarWrap');
  const bar = document.getElementById('timeBar');
  if (!wrap || !bar) return;
  const ratio = constrain(remainingMs / currentTimeLimit(), 0, 1);
  bar.style.width = (ratio*100).toFixed(2)+'%';
  if (ratio <= 0.166) wrap.classList.add('danger'); else wrap.classList.remove('danger');
}

function segmentHitsAnyObstacle(a, b){
  for (const o of obstacles){
    if (segmentCircleIntersect(a.x,a.y,b.x,b.y,o.x,o.y,o.r)) return true;
  }
  return false;
}

// Algoritmo de distância ponto-segmento vs raio
function segmentCircleIntersect(x1,y1,x2,y2,cx,cy,r){
  const vx = x2 - x1;
  const vy = y2 - y1;
  const wx = cx - x1;
  const wy = cy - y1;
  const len2 = vx*vx + vy*vy;
  let t = 0;
  if (len2 > 0){
    t = (wx*vx + wy*vy) / len2;
    t = constrain(t, 0, 1);
  }
  const px = x1 + t*vx;
  const py = y1 + t*vy;
  const d2 = (px-cx)*(px-cx) + (py-cy)*(py-cy);
  return d2 <= r*r;
}

function flashCollision(){ collisionFlashFrames = 15; }

function spawnRemovalFlash(x,y){
  removalFlashes.push({x,y,life:18,size:10});
}

function updateRemovalFlashes(){
  for (let i=removalFlashes.length-1;i>=0;i--){
    const f = removalFlashes[i];
    f.life--;
    const t = f.life/18;
    noStroke();
    fill(255,120,160, 40 + 80*t);
    circle(f.x, f.y, f.size + (1-t)*26);
    if (f.life<=0) removalFlashes.splice(i,1);
  }
}

function undoLastLink(){
  if (currentLevel !== 1) return;
  if (!gameStarted || failed) return;
  if (links.length === 0) return;
  links.pop();
  if (completed){
    completed = false;
    const msg = document.querySelector('.message-final:not([data-kind="fail"])');
    if (msg) msg.remove();
    flowParticles = [];
  }
  const undoBtn = document.getElementById('undoBtn');
  if (undoBtn) undoBtn.disabled = links.length === 0;
}

// Utilitário: encontra índice de elo próximo a (x,y)
function findLinkIndexNear(x,y, radius){
  const r2 = radius*radius;
  for (let i=0;i<links.length;i++){
    const dx = links[i].x - x;
    const dy = links[i].y - y;
    if (dx*dx + dy*dy <= r2) return i;
  }
  return -1;
}

function drawSafeTopLine(){
  stroke(180,190,210,140); strokeWeight(2); line(0, SAFE_TOP, width, SAFE_TOP); noStroke();
}

// ===================== LEVEL 2 =====================
function setupLevel2(){
  level2Shapes = [];
  level2DropZones = [];
  level2Effects = [];
  // zonas no rodapé divididas em 3
  const zoneH = 130;
  const zoneW = width/3;
  for (let i=0;i<3;i++){
    level2DropZones.push({ type: level2Types[i], x: i*zoneW, y: height - zoneH, w: zoneW, h: zoneH, collected:0 });
  }
  for (const type of level2Types){
    for (let i=0;i<level2PerType;i++){
      const size = random(42,64);
      level2Shapes.push({
        type,
        x: random(size, width-size),
        y: random(SAFE_TOP + size, height*0.55 - size),
        size,
        baseColor: randomShapeColor(type),
        vx: random(-1,1),
        vy: random(-1,1),
        grabbed:false,
        placed:false
      });
    }
  }
}

function drawLevel2(){
  // fundo leve
  // movimento suave
  if (gameStarted && !completed && !failed){
    for (const s of level2Shapes){
      if (s.placed || level2DragIndex === level2Shapes.indexOf(s)) continue;
      s.x += s.vx * 0.6;
      s.y += s.vy * 0.6;
      // bounce
      if (s.x < s.size) { s.x = s.size; s.vx *= -1; }
      if (s.x > width - s.size){ s.x = width - s.size; s.vx *= -1; }
      if (s.y < SAFE_TOP + s.size) { s.y = SAFE_TOP + s.size; s.vy *= -1; }
      if (s.y > height*0.55 - s.size){ s.y = height*0.55 - s.size; s.vy *= -1; }
    }
  }
  // Desenhar zonas
  noStroke();
  for (const z of level2DropZones){
    push();
    translate(z.x, z.y);
    const prog = z.collected / level2PerType;
    fill(255,255,255, 150);
    strokeWeight(2);
    stroke( prog>=1 ? color(80,200,140) : color(120,160,200));
    const dd = 8;
    rect(4,4,z.w-8,z.h-8,16);
    noStroke();
    fill(0,0,0,40);
    textAlign(CENTER,TOP);
    textSize(14);
    fill(40,60,90,170);
    text(symbolForType(z.type), z.w/2, 10);
    pop();
  }
  // Shapes
  for (let i=0;i<level2Shapes.length;i++){
    const s = level2Shapes[i];
    drawShape(s);
  }
  // efeitos encaixe
  for (let i=level2Effects.length-1;i>=0;i--){
    const e = level2Effects[i];
    e.life--;
    const t = e.life/22;
    noFill();
    stroke(255,200,60, 120*t);
    strokeWeight(2);
    circle(e.x, e.y, 20 + (1-t)*60);
    if (e.life<=0) level2Effects.splice(i,1);
  }
}

function pointInsideShape(mx,my,s){
  if (s.type==='circle') return dist(mx,my,s.x,s.y) <= s.size/2;
  if (s.type==='square') return mx>=s.x - s.size/2 && mx<= s.x + s.size/2 && my>= s.y - s.size/2 && my<= s.y + s.size/2;
  if (s.type==='triangle'){
    // aproximar por círculo inscrito
    return dist(mx,my,s.x,s.y) <= s.size*0.55;
  }
  return false;
}

function randomShapeColor(type){
  if (type==='circle') return color(70,140,255);
  if (type==='square') return color(255,120,160);
  return color(140,90,255);
}

function drawShape(s){
  push();
  noStroke();
  fill(s.baseColor);
  if (s.placed) fill(red(s.baseColor), green(s.baseColor), blue(s.baseColor), 200);
  if (s.type==='circle'){
    circle(s.x, s.y, s.size);
  } else if (s.type==='square'){
    rectMode(CENTER);
    rect(s.x, s.y, s.size, s.size, 10);
  } else if (s.type==='triangle'){
    const h = s.size;
    const w = s.size*0.9;
    triangle(s.x, s.y - h/2, s.x - w/2, s.y + h/2, s.x + w/2, s.y + h/2);
  }
  pop();
}

function symbolForType(t){ if (t==='circle') return '●'; if (t==='square') return '■'; return '▲'; }

function pointInRect(px,py,x,y,w,h){ return px>=x && px<=x+w && py>=y && py<=y+h; }

function checkCompletionLevel2(){
  if (level2Shapes.length && level2Shapes.every(s=>s.placed)){
    completed = true;
    showLevelCompletedMessage();
  }
}

// ===================== LEVEL 3 =====================
function setupLevel3(){
  seed = { x: width/2, y: height/2, stage:0 };
  orbs = [];
  level3Effects = [];
  for (let i=0;i<level3Required;i++){
    orbs.push({ x: random(40,width-40), y: random(SAFE_TOP+60,height-60), r: 14, collected:false, glow: random(0, TWO_PI) });
  }
}

function drawLevel3(){
  // seed segue mouse com suavização
  if (gameStarted && !completed && !failed){
    const target = createVector(mouseX, mouseY);
    const v = createVector(seed.x, seed.y);
    const dir = p5.Vector.sub(target, v);
    if (dir.mag() > 1){
      dir.setMag( min(6, dir.mag()*0.2) );
      seed.x += dir.x;
      seed.y += dir.y;
    }
    // coleta orbs
    for (const o of orbs){
      if (!o.collected && dist(seed.x, seed.y, o.x, o.y) < (o.r+18)){
        o.collected = true;
        seed.stage++;
        level3Effects.push({x:o.x,y:o.y,life:28});
        if (seed.stage >= level3Required){
          completed = true;
          showLevelCompletedMessage();
          break;
        }
      }
    }
  }
  // desenhar orbs
  for (const o of orbs){
    if (o.collected) continue;
    o.glow += 0.05;
    const puls = 4 + sin(o.glow)*2;
    noFill();
    stroke(255,220,120,120);
    circle(o.x, o.y, (o.r+puls)*2.4);
    noStroke();
    fill(255,230,150);
    circle(o.x, o.y, o.r*2 + puls);
  }
  // desenhar seed (estágios)
  drawSeed();
  // efeitos coleta
  for (let i=level3Effects.length-1;i>=0;i--){
    const e = level3Effects[i];
    e.life--;
    const t = e.life/28;
    noFill(); stroke(180,210,255,140*t); strokeWeight(2);
    circle(e.x, e.y, 20 + (1-t)*60);
    if (e.life<=0) level3Effects.splice(i,1);
  }
}

function drawSeed(){
  push();
  translate(seed.x, seed.y);
  noStroke();
  // tronco
  const growth = seed.stage / level3Required;
  const trunkH = 40 + growth * 120;
  push();
  translate(0,0);
  fill(120,90,55);
  rectMode(CENTER);
  rect(0, -trunkH/2, 14, trunkH, 6);
  pop();
  // núcleo/raiz (semente na base)
  fill(150,110,70);
  ellipse(0,10,32,22);
  // folhas em camadas - cada estágio adiciona um anel de folhas estilizadas
  for (let i=1;i<=seed.stage;i++){
    const layerT = i/level3Required;
    const y = - (trunkH*0.2 + (trunkH*0.55)*layerT);
    const leafCount = 4 + Math.floor(i*0.8);
    const radius = 22 + i*4;
    for (let k=0;k<leafCount;k++){
      const ang = (TWO_PI/leafCount)*k + frameCount*0.002;
      const lx = cos(ang)*radius*0.7;
      const ly = sin(ang)*radius*0.35;
      const hueBase = 90 - i*3;
      fill(80,150 + i*5, 90, 200 - i*6);
      push();
      translate(lx, y+ly);
      rotate(ang);
      ellipse(0,0, 26 - i*1.1, 12 - i*0.4);
      pop();
    }
    // pequena luz central por camada
    fill(200,255,200,90 - i*5);
    circle(0,y, 10 + i*2);
  }
  // brilho no topo quando completo
  if (seed.stage >= level3Required){
    const pulse = 8 + sin(frameCount*0.15)*4;
    noFill(); stroke(255,240,160,180); strokeWeight(2);
    circle(0, -trunkH*0.75, pulse*3);
  }
  pop();
}

// ===================== TRANSIÇÕES / TELAS =====================
function showStartScreenForLevel(){
  let scr = document.getElementById('startScreen');
  if (!scr){
    scr = document.createElement('div');
    scr.id = 'startScreen';
    const panel = document.createElement('div');
    panel.className='panel';
    scr.appendChild(panel);
    document.body.appendChild(scr);
  }
  const panel = scr.querySelector('.panel');
  let title='', instructions='';
  if (currentLevel === 1){
    title = 'Nível 1: O Construtor de Pontes';
    instructions = `<ul class="rules"><li>Crie elos clicando e conecte as duas ilhas.</li><li>Evite os obstáculos móveis.</li><li>Desfaça com Backspace ou clicando num elo.</li><li>Complete em até 20 segundos.</li></ul>`;
  } else if (currentLevel === 2){
    title = 'Nível 2: O Organizador de Ideias';
    instructions = `<ul class="rules"><li>Arraste cada forma até a caixa do mesmo símbolo no rodapé.</li><li>Use o tempo com sabedoria (20s).</li><li>Ao encaixar todas, avança.</li></ul>`;
  } else if (currentLevel === 3){
    title = 'Nível 3: A Semente da Curiosidade';
    instructions = `<ul class="rules"><li>Mova o mouse para guiar a semente.</li><li>Colete pontos de luz para fazê-la crescer.</li><li>Complete todos os estágios em 20s.</li></ul>`;
  }
  panel.innerHTML = `<h1>${title}</h1><p class="intro">${subtitleForLevel()}</p>${instructions}<button id="startBtn">Iniciar Jogo</button><small class="note">Pressione R para reiniciar este nível.</small>`;
  scr.classList.remove('hidden');
  gameStarted = false;
  const btn = panel.querySelector('#startBtn');
  if (btn) btn.onclick = startGame;
  setTimerDisplay(currentTimeLimit());
}

function subtitleForLevel(){
  if (currentLevel === 1) return 'Conecte ideias criando uma ponte eficiente.';
  if (currentLevel === 2) return 'Traga ordem às ideias dispersas.';
  if (currentLevel === 3) return 'Cada descoberta nutre o crescimento.';
  return '';
}

function startGame(){
  if (gameStarted) return;
  // preparar recursos do nível
  if (currentLevel === 2 && level2Shapes.length===0) setupLevel2();
  if (currentLevel === 3 && orbs.length===0) setupLevel3();
  gameStarted = true;
  startTime = millis();
  const scr = document.getElementById('startScreen');
  if (scr){
    scr.classList.add('hidden');
    setTimeout(()=> scr.remove(), 500);
  }
  setTimerDisplay(currentTimeLimit());
}

function gotoNextLevel(){
  currentLevel++;
  if (currentLevel>3) currentLevel=3;
  completed = false; failed=false; links=[]; flowParticles=[]; removalFlashes=[];
  gameStarted = false;
  initScene(); // reusa para limpar nível1 se voltar
  resetLevelSpecific();
  showStartScreenForLevel();
  updateOverlayForLevel();
  const msg = document.querySelector('.message-final:not([data-kind="fail"])');
  if (msg) msg.remove();
}

function restartCurrentLevel(){
  completed=false; failed=false; flowParticles=[]; removalFlashes=[]; links=[];
  if (currentLevel===1){ initScene(false); }
  else if (currentLevel===2){ setupLevel2(); }
  else if (currentLevel===3){ setupLevel3(); }
  startTime = millis();
  setTimerDisplay(currentTimeLimit());
  const msg = document.querySelector('.message-final:not([data-kind="fail"])');
  if (msg) msg.remove();
  removeFailMessage();
  const timer = document.getElementById('timer');
  if (timer) timer.classList.remove('danger');
}

function updateOverlayForLevel(){
  const titleEl = document.querySelector('#overlay h1');
  const hintEl = document.querySelector('#overlay .hint');
  if (!titleEl || !hintEl) return;
  if (currentLevel === 1){
    titleEl.textContent = 'Nível 1: O Construtor de Pontes';
    hintEl.innerHTML = 'Clique para adicionar elos e conecte as duas ilhas sem tocar nos obstáculos. R reinicia, Backspace/Undo desfaz.';
  } else if (currentLevel === 2){
    titleEl.textContent = 'Nível 2: O Organizador de Ideias';
    hintEl.innerHTML = 'Arraste cada forma até a caixa do mesmo símbolo no rodapé. Complete antes do tempo acabar. R reinicia.';
  } else if (currentLevel === 3){
    titleEl.textContent = 'Nível 3: A Semente da Curiosidade';
    hintEl.innerHTML = 'Mova o mouse para coletar pontos de luz e fazer a semente crescer por estágios. R reinicia.';
  }
}

// Limite superior jogável (evita shapes sob cabeçalho)
const SAFE_TOP = 140; // px abaixo do cabeçalho


// (função startGame já definida anteriormente; duplicata removida)
