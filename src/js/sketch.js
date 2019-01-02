// Running score
let score = 0
/* Program state: 0, 1, 2, 3
    0 - Intro Screen
    1 - Actual Gameplay
    2 - Between Levels
    3 - Game Over / Performance Overview
*/
let gameStage = 0
// Current health: starts at 100
let health = 100
// Blocked and Missed
let blocked, missed
// Coordinates for core / player
let coreX, coreY
// Speed Controls
const rotateSpd = .05
const playerSpd = 2.5
// Set up core and shields
let armLength = 80
const shieldSize = 15
let myCore, shield0, shield1, shield2, shield3
// Initial Shield Rotations
let deg0 = Math.PI
let deg1 = 2 * Math.PI
let deg2 = Math.PI / 2
let deg3 = -Math.PI / 2
// Difficulty
let diff = 1
// Collision Groups
let shields, projectiles, walls
// Border wall thickness
let wallThickness = 30;
// DOM Stuff
let domLoaded = false
let healthDiv, scoreP
let showForm = false
// API
// const url = "https://galvanize-cors.herokuapp.com/https://images-api.nasa.gov/asset/GSFC_20171208_Archive_e000136?api_key=NNKOjkoul8n1CH18TWA9gwngW1s1SmjESPjNoUFo"

function setup() {
  // API
  // axios.get(url)
  //   .then(function(response) {
  //     // handle success
  //     // bg = loadImage(response.data['collection']['items'][0].href)
  //   })
  //   .catch(function(error) {
  //     // handle error
  //     console.log(error)
  //   })
  //   .then(function() {
  //     // always executed
  //   });
  // Create canvas and add to dom ---------------------
  let canvasDiv = document.getElementById('canvasDiv')
  var width = windowWidth - (windowWidth / 5)
  var height = windowHeight - (windowHeight / 5)
  background(10)

  var myCanvas = createCanvas(width, height);
  myCanvas.parent("canvasDiv")
  // Set Global Initial Values ------------------------
  // Core Coordinates
  coreX = width / 2
  coreY = height / 2
  armLength = 80
  // Collision groups
  shields = new Group()
  projectiles = new Group()
  walls = new Group()
  // Border walls
  createWalls()
  // Create core
  if (myCore !== undefined) {
    myCore.remove()
  }
  for (let i = 0; i < shields.length; i++) {
    shields[i].remove()
  }
  createCore()
  // Create Shields
  createShields()
  // Create projectiles
  createProjectiles(diff)
  // console.log('setup')
  if (localStorage.getItem("highscore") === null) {
    localStorage.setItem("highscore", "0")
    console.log('local')
  }
}

function draw() {
  // Reset Background before drawing
  background(10);
  drawSprites(walls)
  projectiles.bounce(walls)
  switch (gameStage) {
    case 0: // Title Screen
      showLevelInput()
      // Resets
      score = 0
      blocked = 0
      missed = 0
      // Objectives & Controls
      objsAndControls()
      if (projectiles.length < 1) {
        createProjectiles(diff)
      }
      // Start Game
      if (keyWentDown('space')) {
        if (projectiles.length < 1) {
          createProjectiles(diff)
        }
        changegameStage()
        document.getElementById('theForm').style.display = 'none'
      }
      break
    case 1: // Game Play
      background(bg);
      // 'tint image'
      background('rgba(0,0,0, 0.5)')
      // Display level
      textSize(20)
      textAlign(CENTER)
      fill(255, 255, 255)
      text(`Level ${diff}`, width / 2, 30)
      moveCore() // Update Core's x, y
      rotateShields() // Update Shields' rotations
      // projectiles.bounce(walls) // Bounds check
      // Collision
      projectiles.overlap(shields, hitShield)
      projectiles.overlap(myCore, hitCore)
      checkProjectiles()
      // drawSprites()
      drawSprite(myCore)
      drawSprites(shields) // Draw all Sprites
      drawSprites(projectiles)

      break
    case 2: // Between Levels
      // Level Complete Notification
      fill('white')
      textSize(40)
      textAlign(CENTER)
      text(`Level ${diff -1} Complete!`, width / 2, height / 2 + 10)
      text(`Press space to continue`, width / 2, height / 2 + 60)

      // Reset Sprites
      myCore.remove()
      for (let i = 0; i < shields.length; i++) {
        shields[i].remove()
      }
      // Start next level
      if (keyDown('space')) {
        gameStage--
        setup()
      }
      break
    case 3: // Game Over: Summary
      // Game Over Notification
      textSize(50)
      textAlign(CENTER)
      fill('white')
      text('Game Over ☹', width / 2 + 10, height / 2)
      textSize(20)
      text('Press space to restart!', width / 2, height / 2 + 30)
      // Reset Sprites
      myCore.remove()
      health = 100
      diff = 1
      for (let i = 0; i < shields.length; i++) {
        shields[i].remove()
      }
      // High Score
      let hs = localStorage.getItem("highscore")
      if (score > hs || hs === null) {
        localStorage.setItem('highscore', score)
      }

      if (keyWentDown('space')) {
        gameStage = 0
        setup()
      }
      break
  }
}

function showLevelInput() { // Show 'Secret' level input
  if (keyWentDown('esc')) {
    document.getElementById('theForm').style.display = 'inline'
    showForm = true
  }
}

function levelChange() { // Change level on submit button
  document.getElementById('theForm').style.display = 'none'
  var inputLevel = document.getElementById("mylevel")
  var mylevel = inputLevel.value
  if (mylevel % 1 === 0) {
    diff = parseInt(mylevel)
  } else {
    alert('please input a valid number')
  }
  myCore.remove()
  for (let i = 0; i < shields.length; i++) {
    shields[i].remove()
  }
  setup()
}

function objsAndControls() { // Display game objectives and controls
  textSize(20)
  textAlign(CENTER)
  // text('Press Space to Start', coreX, coreY)
  // text(`(or press space)`, coreX, coreY + 20)
  fill('white')
  text('Press Space to Start', coreX, coreY + 50)
  textSize(9)
  fill(60, 60, 60)
  text('Press esc to pick your level', 80, height - 20)
  fill('white')
  textAlign(LEFT)
  // OBJECTIVES
  textSize(30)
  let xoffset1 = 50
  text(`Objectives`, xoffset1 - 10, 50)
  textSize(20)

  text(`Protect the blue core from the red projectiles.`, xoffset1, 80)
  text(`Block the projectiles with the green shields.`, xoffset1, 110)
  text(`Blocking will make your score go up.`, xoffset1, 140)
  text(`Getting hit will lower your HP.`, xoffset1, 170)
  text(`Getting to 0 HP will end the game.`, xoffset1, 200)

  // CONROLS
  textSize(30)
  let xoffset = coreX + windowWidth / 8
  text(`Controls`, xoffset - 10, 50)
  textSize(20)

  text(`W: ↑ Move core up`, xoffset, 80)
  text(`S: ↓ Move player down`, xoffset, 110)
  text(`A: ← Move player left`, xoffset, 140)
  text(`D: → Move player right`, xoffset, 170)
  text(`Left Arrow: ⤺ Rotate shields left`, xoffset, 200)
  text(`Right Arrow: ⤻ Rotate shields right`, xoffset, 230)
  text(`Up Arrow: ⤎ ⤏ Move shields away from core`, xoffset, 260)
  text(`Down Arrow: ⤏ ⤎ Move shields towards core`, xoffset, 290)

}

function changegameStage() { // Change game state

  if (gameStage !== 3) {
    gameStage++
  } else {
    gameStage = 0
    setup()
  }
  init()
}

function createWalls() { // Create border walls
  wallTop = createSprite(width / 2, -wallThickness / 2 + 3, width + wallThickness * 2, wallThickness);
  wallTop.immovable = true;
  walls.add(wallTop)
  wallTop.shapeColor = "#dddddd"

  wallBottom = createSprite(width / 2, height + wallThickness / 2 - 3, width + wallThickness * 2, wallThickness);
  wallBottom.immovable = true;
  walls.add(wallBottom)
  wallBottom.shapeColor = "#dddddd"

  wallLeft = createSprite(-wallThickness / 2 + 3, height / 2, wallThickness, height);
  wallLeft.immovable = true;
  walls.add(wallLeft)
  wallLeft.shapeColor = "#dddddd"

  wallRight = createSprite(width + wallThickness / 2 - 3, height / 2, wallThickness, height);
  wallRight.immovable = true;
  walls.add(wallRight)
  wallRight.shapeColor = "#dddddd"
}
// CORE
function createCore() { // Create 'core' sprite
  let img = loadImage('img/core1.png');
  myCore = createSprite(coreX, coreY)
  myCore.setCollider('circle', 0, 0, 45)
  // myCore.shapeColor = "#00ddff"
  myCore.addImage(img)
}

function moveCore() { // Move core using w a s d
  if (keyDown('w')) {
    if (coreY > armLength + shieldSize / 2) {
      coreY -= playerSpd
    }
  }
  if (keyDown('s')) {
    if (coreY < height - armLength - shieldSize / 2) {
      coreY += playerSpd
    }
  }
  if (keyDown('a')) {
    if (coreX > armLength + shieldSize / 2) {
      coreX -= playerSpd * 1.2
    }
  }
  if (keyDown('d')) {
    if (coreX < width - armLength - shieldSize / 2) {
      coreX += playerSpd * 1.2
    }
  }
  myCore.position.x = constrain(coreX, 0 + armLength, width - armLength)
  myCore.position.y = constrain(coreY, 0 - armLength, height - armLength)
}
// SHIELDS
function createShields() { // Create 'shield' sprites
  let img = loadImage('img/shield1.png');

  shield0 = createSprite(coreX + armLength * cos(deg0), coreY + armLength * sin(deg0))
  shields.add(shield0)
  shield0.setCollider('circle', 0, 0, 30)
  // shield0.shapeColor = "#00ff00"
  shield0.addImage(img);
  shield0.scale = 0.4;

  shield1 = createSprite(coreX + armLength * cos(deg1), coreY + armLength * sin(deg1))
  shields.add(shield1)
  shield1.setCollider('circle', 0, 0, 30)
  // shield1.shapeColor = "#00ff00"
  shield1.addImage(img);
  shield1.scale = 0.4;

  shield2 = createSprite(coreX + armLength * cos(deg2), coreY + armLength * sin(deg2))
  shields.add(shield2)
  shield2.setCollider('circle', 0, 0, 30)
  // shield2.shapeColor = "#00ff00"
  shield2.addImage(img);
  shield2.scale = 0.4;

  shield3 = createSprite(coreX + armLength * cos(deg3), coreY + armLength * sin(deg3))
  shields.add(shield3)
  shield3.setCollider('circle', 0, 0, 30)
  // shield3.shapeColor = "#00ff00"
  shield3.addImage(img);
  shield3.scale = 0.4;
}

function rotateShields() { // Rotate and move shields using arrow keys
  if (keyDown(LEFT_ARROW)) {
    deg0 -= rotateSpd
    deg1 -= rotateSpd
    deg2 -= rotateSpd
    deg3 -= rotateSpd
  }
  if (keyDown(RIGHT_ARROW)) {
    deg0 += rotateSpd
    deg1 += rotateSpd
    deg2 += rotateSpd
    deg3 += rotateSpd
  }
  if (keyDown(UP_ARROW)) {
    if (armLength < 120) {
      armLength += 5
    }
  }
  if (keyDown(DOWN_ARROW)) {
    if (armLength > 60) {
      armLength -= 5
    }
  }
  shield0.position.x = (coreX + armLength * cos(deg0))
  shield0.position.y = (coreY + armLength * sin(deg0))

  shield1.position.x = (coreX + armLength * cos(deg1))
  shield1.position.y = (coreY + armLength * sin(deg1))

  shield2.position.x = (coreX + armLength * cos(deg2))
  shield2.position.y = (coreY + armLength * sin(deg2))

  shield3.position.x = (coreX + armLength * cos(deg3))
  shield3.position.y = (coreY + armLength * sin(deg3))
}
// PROJECTILES
function createProjectiles(diff) { // Generate diff number of projectile sprites
  // console.log(width+','+height)
  // for (let i = 0; i < 8 + (diff * 5); i++) {
  while (projectiles.length < 8 + (diff * 5)) {
    // set random direction
    width = windowWidth - (windowWidth / 5)
    height = windowHeight - (windowHeight / 5)
    let px = random(wallThickness, width - wallThickness)
    let py = random(wallThickness, height - wallThickness)
    while (dist(coreX, coreY, px, py) < armLength * 2.5) {
      px = random(wallThickness, width - wallThickness)
      py = random(wallThickness, height - wallThickness)
    }
    //create sprite
    createProjectile(px, py)
    checkProjectiles()
  }
}

function createProjectile(px, py) { // Create one projectile given x and y
  let a = createSprite(px, py, 10, 10);
  let img = loadImage('img/projectiles.png');
  a.addImage(img);
  a.setSpeed(random(3, 5.5), random(360))
  a.rotationSpeed = random(0.5, 0.8)
  a.scale = random(.9, 1.5)
  a.setCollider('circle', 0, 0, (10 * a.scale))
  projectiles.add(a)

  return a;
}

function checkProjectiles() { // Check that projectiles are in bounds, weird edge cases?
  for (var i = 0; i < projectiles.length; i++) {
    let proj = projectiles[i]
    if (proj.position.x < 0 || proj.position.x > width) {
      projectiles.splice(i, 1)
    }
    // check this more
    if (proj.position.y < 0 || proj.position.y > height) {
      projectiles.splice(i, 1)
    }
  }
}
// GAME MECHANICS
function levelOver() { // Check for remaining projectiles and hp
  if (projectiles.length === 0) {
    gameStage++
    diff++
    console.log(diff)
    health = 100
  }
  if (domLoaded && gameStage !== 0) {
    healthDiv.innerText = `HP: ${health} `
  }
}

function hitShield(projectile, shield) { // When a projectile is blocked
  projectile.remove();
  score += parseInt(diff)
  blocked++
  // console.log(`score: ${score}`)
  if (domLoaded && gameStage !== 0) {
    scoreP.innerText = `Score: ${score}`
  }
  levelOver()
}

function hitCore(projectile, myCore) {
  // console.log('corehit')
  projectile.remove()
  health -= 10
  missed++
  // console.log(`HP: ${health} `)
  if (health === 0) {
    // alert('game over?!?!?!')
    health === 100
    gameStage = 3
  }
  levelOver()
} // When the core is hit
// NON-P5.JS CODE
function windowResized() { // Resize Canvas
  let canvasDiv = document.getElementById('canvasDiv')
  width = windowWidth - (windowWidth / 5)
  height = windowHeight - (windowHeight / 5)
  resizeCanvas(width, height);
  if (gameStage !== 1) {
    // walls[i].remove()
    walls.splice(0, 4)
    createWalls()
  }
  // walls.remove()
  // createWalls()
}
// Non p5.js code ~ domcontentloaded
function init() { // Change dom elements
  // DOM
  document.getElementById("mainHeader").innerText = 'Core Defense'
  healthDiv = document.getElementById('health')
  scoreP = document.getElementById('myScore')
  highScoreP = document.getElementById('highScore')
  domLoaded = true
  let highscorei = localStorage.getItem("highscore")
  window.addEventListener("keydown", function(e) {
    // space and arrow keys
    if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
      e.preventDefault();
    }
  }, false);
  if (gameStage !== 0) {
    scoreP.innerText = `Score: ${score}`
    highScoreP.innerText = `Highscore: ${highscorei}`
    healthDiv.innerText = `HP: ${health} `
  }
}

window.addEventListener('load', init);
