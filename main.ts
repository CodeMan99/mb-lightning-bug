enum Walls {
    None = 0b00000,
    Y0   = 0b00001,
    Y1   = 0b00010,
    Y2   = 0b00100,
    Y3   = 0b01000,
    Y4   = 0b10000,
    All  = 0b11111,
}

const MIN_ACCELERATION: number = -1023.0
const MAX_ACCELERATION: number = 1023.0

const pointSound = new music.StringArrayPlayable(["E5"], 200)
const endGameSound = music.builtInPlayableMelody(Melodies.Wawawawaa)
// byteWidth = 4; length = 20
const accelerationHistory: Buffer = pins.createBuffer(80)
const wallMap: Buffer = pins.createBuffer(128)
const startY: number = input.acceleration(Dimension.Y)

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
    accelerationHistory.setNumber(NumberFormat.Int32LE, i, startY)
}

wallMap.setUint8(2, Walls.Y0)
wallMap.setUint8(4, Walls.Y4)
wallMap.setUint8(7, Walls.Y2 | Walls.Y3)
wallMap.setUint8(11, Walls.Y0 | Walls.Y3 | Walls.Y4)
wallMap.setUint8(13, Walls.Y2)
wallMap.setUint8(16, Walls.Y0 | Walls.Y1 | Walls.Y2)
wallMap.setUint8(20, Walls.Y2 | Walls.Y3 | Walls.Y4)
wallMap.setUint8(23, Walls.Y1 | Walls.Y3)
wallMap.setUint8(27, Walls.Y1)
wallMap.setUint8(28, Walls.Y4)
wallMap.setUint8(29, Walls.Y0)
wallMap.setUint8(30, Walls.Y2)
wallMap.setUint8(33, Walls.All ^ Walls.Y3)
wallMap.setUint8(37, Walls.Y1 | Walls.Y2 | Walls.Y3)
wallMap.setUint8(40, Walls.Y0 | Walls.Y4)
wallMap.setUint8(42, Walls.Y1 | Walls.Y3)
wallMap.setUint8(44, Walls.Y1 | Walls.Y3)
wallMap.setUint8(48, Walls.Y0 | Walls.Y1 | Walls.Y3)
wallMap.setUint8(52, Walls.Y1 | Walls.Y2 | Walls.Y4)

wallMap.setUint8(54, Walls.Y0)
wallMap.setUint8(56, Walls.Y4)
wallMap.setUint8(59, Walls.Y2 | Walls.Y3)
wallMap.setUint8(63, Walls.Y0 | Walls.Y3 | Walls.Y4)
wallMap.setUint8(65, Walls.Y2)
wallMap.setUint8(68, Walls.Y0 | Walls.Y1 | Walls.Y2)
wallMap.setUint8(72, Walls.Y2 | Walls.Y3 | Walls.Y4)
wallMap.setUint8(75, Walls.Y1 | Walls.Y3)
wallMap.setUint8(79, Walls.Y1)
wallMap.setUint8(80, Walls.Y4)
wallMap.setUint8(81, Walls.Y0)
wallMap.setUint8(82, Walls.Y2)
wallMap.setUint8(85, Walls.All ^ Walls.Y3)
wallMap.setUint8(89, Walls.Y1 | Walls.Y2 | Walls.Y3)
wallMap.setUint8(92, Walls.Y0 | Walls.Y4)
wallMap.setUint8(94, Walls.Y1 | Walls.Y3)
wallMap.setUint8(96, Walls.Y1 | Walls.Y3)
wallMap.setUint8(100, Walls.Y0 | Walls.Y1 | Walls.Y3)
wallMap.setUint8(104, Walls.Y1 | Walls.Y2 | Walls.Y4)

wallMap.setUint8(107, Walls.Y2 | Walls.Y3)
wallMap.setUint8(111, Walls.Y0 | Walls.Y1 | Walls.Y4)
wallMap.setUint8(113, Walls.Y4)
wallMap.setUint8(115, Walls.Y2)
wallMap.setUint8(118, Walls.Y1 | Walls.Y2 | Walls.Y3)
wallMap.setUint8(121, Walls.Y0)
wallMap.setUint8(122, Walls.Y4)
wallMap.setUint8(124, Walls.Y1 | Walls.Y2)
wallMap.setUint8(126, Walls.Y3 | Walls.Y4)

input.setAccelerometerRange(AcceleratorRange.OneG)
music.setBuiltInSpeakerEnabled(true)

basic.forever(() => {
    const vertical: number = input.acceleration(Dimension.Y)

    accelerationHistory.shift(4)
    accelerationHistory.setNumber(NumberFormat.Int32LE, 76, vertical)

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
        vertical

    const averageAcceration: number = Math.constrain(sum * 0.05, MIN_ACCELERATION, MAX_ACCELERATION)
    const ledY: number = Math.round(Math.map(averageAcceration, MIN_ACCELERATION, MAX_ACCELERATION, -0.5, 4.49))
    const collisionY: number = Math.pow(2, ledY)
    // advance the map once every twelve frames
    const xMapOffsetStart: number = Math.floor(mapTickCount / 12)
    const currentWall: number = wallMap.getUint8(xMapOffsetStart)
    const currentWallFrame: number = mapTickCount % 12
    // Allow mistakes! Ignore collision if the first or last frame of the currentWall.
    const gameOver: boolean =
        isGameOver || (
            0 < currentWallFrame &&
            currentWallFrame < 11 &&
            (currentWall & collisionY) > 0
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
        displayWalls(0, currentWall)
        displayWalls(1, wallMap.getUint8(xMapOffsetStart + 1))
        displayWalls(2, wallMap.getUint8(xMapOffsetStart + 2))
        displayWalls(3, wallMap.getUint8(xMapOffsetStart + 3))
        displayWalls(4, wallMap.getUint8(xMapOffsetStart + 4))
        led.plot(0, ledY)

        // 128 (wallMap.length) * 12 = 1536
        mapTickCount = (mapTickCount + 1) % 1536
    }

    // 1000 / 8 = roughly 125 frames per second
    // 125 / 20 = new history 6.25 times per second
    // 1000 / 6.25 = roughly 160 milliseconds per move
    // 160 * 4 = roughly 640 milliseconds to "fall" from top to bottom
    basic.pause(8)
})

function displayWalls(xOffset: number, wallColumn: Walls): void {
    ;(wallColumn & Walls.Y0) === Walls.Y0 && led.plot(xOffset, 0)
    ;(wallColumn & Walls.Y1) === Walls.Y1 && led.plot(xOffset, 1)
    ;(wallColumn & Walls.Y2) === Walls.Y2 && led.plot(xOffset, 2)
    ;(wallColumn & Walls.Y3) === Walls.Y3 && led.plot(xOffset, 3)
    ;(wallColumn & Walls.Y4) === Walls.Y4 && led.plot(xOffset, 4)
}

input.onButtonPressed(Button.B, () => {
    doResetGame = isGameOver && true
})

input.onButtonPressed(Button.A, () => {
    showHighScore = isGameOver && true
})
