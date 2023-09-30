enum Walls {
    None = 0b00000,
    X0   = 0b00001,
    X1   = 0b00010,
    X2   = 0b00100,
    X3   = 0b01000,
    X4   = 0b10000,
    All  = 0b11111,
}

const MIN_ACCELERATION: number = -1023.0
const MAX_ACCELERATION: number = 1023.0

// D5, 1/8 note at 125 BPM
const pointSound = new music.TonePlayable(587.3295, 240)
const endGameSound = music.builtInPlayableMelody(Melodies.Wawawawaa)
// byteWidth = 4; length = 20
const accelerationHistory: Buffer = pins.createBuffer(80)
const wallMap: Buffer = pins.createBuffer(128)
const startX: number = input.acceleration(Dimension.X)

let isGameOver: boolean = false
let showHighScore: boolean = false
let doResetGame: boolean = false
let mapTickCount: number = 0
let highScore: number = 0
let score: number = 0

function resetGame() {
    isGameOver = false
    showHighScore = false
    doResetGame = false
    mapTickCount = 0
    score = 0
}

for (let i = 0; i < 80; i += 4) {
    accelerationHistory.setNumber(NumberFormat.Int32LE, i, startX)
}

wallMap.setUint8(2, Walls.X0)
wallMap.setUint8(4, Walls.X4)
wallMap.setUint8(7, Walls.X2 | Walls.X3)
wallMap.setUint8(11, Walls.X0 | Walls.X3 | Walls.X4)
wallMap.setUint8(13, Walls.X2)
wallMap.setUint8(16, Walls.X0 | Walls.X1 | Walls.X2)
wallMap.setUint8(20, Walls.X2 | Walls.X3 | Walls.X4)
wallMap.setUint8(23, Walls.X1 | Walls.X3)
wallMap.setUint8(27, Walls.X1)
wallMap.setUint8(28, Walls.X4)
wallMap.setUint8(29, Walls.X0)
wallMap.setUint8(30, Walls.X2)
wallMap.setUint8(33, Walls.All ^ Walls.X3)
wallMap.setUint8(37, Walls.X1 | Walls.X2 | Walls.X3)
wallMap.setUint8(40, Walls.X0 | Walls.X4)
wallMap.setUint8(42, Walls.X1 | Walls.X3)
wallMap.setUint8(44, Walls.X1 | Walls.X3)
wallMap.setUint8(48, Walls.X0 | Walls.X1 | Walls.X3)
wallMap.setUint8(52, Walls.X1 | Walls.X2 | Walls.X4)

wallMap.setUint8(54, Walls.X0)
wallMap.setUint8(56, Walls.X4)
wallMap.setUint8(59, Walls.X2 | Walls.X3)
wallMap.setUint8(63, Walls.X0 | Walls.X3 | Walls.X4)
wallMap.setUint8(65, Walls.X2)
wallMap.setUint8(68, Walls.X0 | Walls.X1 | Walls.X2)
wallMap.setUint8(72, Walls.X2 | Walls.X3 | Walls.X4)
wallMap.setUint8(75, Walls.X1 | Walls.X3)
wallMap.setUint8(79, Walls.X1)
wallMap.setUint8(80, Walls.X4)
wallMap.setUint8(81, Walls.X0)
wallMap.setUint8(82, Walls.X2)
wallMap.setUint8(85, Walls.All ^ Walls.X3)
wallMap.setUint8(89, Walls.X1 | Walls.X2 | Walls.X3)
wallMap.setUint8(92, Walls.X0 | Walls.X4)
wallMap.setUint8(94, Walls.X1 | Walls.X3)
wallMap.setUint8(96, Walls.X1 | Walls.X3)
wallMap.setUint8(100, Walls.X0 | Walls.X1 | Walls.X3)
wallMap.setUint8(104, Walls.X1 | Walls.X2 | Walls.X4)

wallMap.setUint8(107, Walls.X2 | Walls.X3)
wallMap.setUint8(111, Walls.X0 | Walls.X1 | Walls.X4)
wallMap.setUint8(113, Walls.X4)
wallMap.setUint8(115, Walls.X2)
wallMap.setUint8(118, Walls.X1 | Walls.X2 | Walls.X3)
wallMap.setUint8(121, Walls.X0)
wallMap.setUint8(122, Walls.X4)
wallMap.setUint8(124, Walls.X1 | Walls.X2)
wallMap.setUint8(126, Walls.X3 | Walls.X4)

input.setAccelerometerRange(AcceleratorRange.OneG)
music.setBuiltInSpeakerEnabled(true)

basic.forever(() => {
    const horizonal: number = input.acceleration(Dimension.X)

    accelerationHistory.shift(4)
    accelerationHistory.setNumber(NumberFormat.Int32LE, 76, horizonal)

    const sum: number =
        accelerationHistory.getNumber(NumberFormat.Int32LE,  0) +
        accelerationHistory.getNumber(NumberFormat.Int32LE,  4) +
        accelerationHistory.getNumber(NumberFormat.Int32LE,  8) +
        accelerationHistory.getNumber(NumberFormat.Int32LE, 12) +
        accelerationHistory.getNumber(NumberFormat.Int32LE, 16) +
        accelerationHistory.getNumber(NumberFormat.Int32LE, 20) +
        accelerationHistory.getNumber(NumberFormat.Int32LE, 24) +
        accelerationHistory.getNumber(NumberFormat.Int32LE, 28) +
        accelerationHistory.getNumber(NumberFormat.Int32LE, 32) +
        accelerationHistory.getNumber(NumberFormat.Int32LE, 36) +
        accelerationHistory.getNumber(NumberFormat.Int32LE, 40) +
        accelerationHistory.getNumber(NumberFormat.Int32LE, 44) +
        accelerationHistory.getNumber(NumberFormat.Int32LE, 48) +
        accelerationHistory.getNumber(NumberFormat.Int32LE, 52) +
        accelerationHistory.getNumber(NumberFormat.Int32LE, 56) +
        accelerationHistory.getNumber(NumberFormat.Int32LE, 60) +
        accelerationHistory.getNumber(NumberFormat.Int32LE, 64) +
        accelerationHistory.getNumber(NumberFormat.Int32LE, 68) +
        accelerationHistory.getNumber(NumberFormat.Int32LE, 72) +
        horizonal

    const averageAcceration: number = Math.constrain(sum * 0.05, MIN_ACCELERATION, MAX_ACCELERATION)
    const ledX: number = Math.round(Math.map(averageAcceration, MIN_ACCELERATION, MAX_ACCELERATION, -0.5, 4.49))
    const collisionX: number = Math.pow(2, ledX)
    // advance the map once every twelve frames
    const yMapOffsetStart: number = Math.floor(mapTickCount / 12)
    const currentWall: number = wallMap.getUint8(yMapOffsetStart)
    const currentWallFrame: number = mapTickCount % 12
    // Allow mistakes! Ignore collision if the first or last frame of the currentWall.
    const gameOver: boolean =
        isGameOver || (
            0 < currentWallFrame &&
            currentWallFrame < 11 &&
            (currentWall & collisionX) > 0
        )

    if (currentWall !== Walls.None && currentWallFrame === 11) {
        score += 1
        music.play(pointSound, music.PlaybackMode.InBackground)
    }

    led.stopAnimation()

    if (gameOver) {
        if (isGameOver === false) {
            music.play(endGameSound, music.PlaybackMode.InBackground)
            basic.showString(`Game Over - Score ${score}`, 60)
            highScore = Math.max(score, highScore)
        }

        if (showHighScore) {
            basic.showString(`High Score ${highScore}`, 60)
            showHighScore = false
        } else {
            basic.showNumber(score, 120)
        }

        isGameOver = true

        if (doResetGame) {
            resetGame()
        }
    } else {
        displayWalls(0, wallMap.getUint8(yMapOffsetStart + 4))
        displayWalls(1, wallMap.getUint8(yMapOffsetStart + 3))
        displayWalls(2, wallMap.getUint8(yMapOffsetStart + 2))
        displayWalls(3, wallMap.getUint8(yMapOffsetStart + 1))
        displayWalls(4, currentWall)
        led.plot(ledX, 4)

        // 128 (wallMap.length) * 12 = 1536
        mapTickCount = (mapTickCount + 1) % 1536
    }

    // 1000 / 8 = roughly 125 frames per second
    // 125 / 20 = new history 6.25 times per second
    // 1000 / 6.25 = roughly 160 milliseconds per move
    // 160 * 4 = roughly 640 milliseconds to "fall" from top to bottom
    basic.pause(8)
})

function displayWalls(yOffset: number, wallColumn: Walls): void {
    ;(wallColumn & Walls.X0) === Walls.X0 && led.plot(0, yOffset)
    ;(wallColumn & Walls.X1) === Walls.X1 && led.plot(1, yOffset)
    ;(wallColumn & Walls.X2) === Walls.X2 && led.plot(2, yOffset)
    ;(wallColumn & Walls.X3) === Walls.X3 && led.plot(3, yOffset)
    ;(wallColumn & Walls.X4) === Walls.X4 && led.plot(4, yOffset)
}

input.onButtonPressed(Button.B, () => {
    doResetGame = isGameOver && true
})

input.onButtonPressed(Button.A, () => {
    showHighScore = isGameOver && true
})
