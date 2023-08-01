let minAcceleration = -1023.0
let maxAcceleration = 1023.0
// byteWidth = 4; length = 20
let accelerationHistory: Buffer = pins.createBuffer(80)
let startY: number = input.acceleration(Dimension.Y)

for (let i = 0; i < 80; i += 4) {
    accelerationHistory.setNumber(NumberFormat.Int32LE, i, startY)
}

// let bugFlashRate: number = 120
// let screen: Image = led.screenshot()

input.setAccelerometerRange(AcceleratorRange.OneG)

basic.forever(() => {
    let vertical: number = input.acceleration(Dimension.Y)

    accelerationHistory.shift(4)
    accelerationHistory.setNumber(NumberFormat.Int32LE, 76, vertical)

    let sum: number =
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

    let averageAcceration: number = Math.constrain(sum * -0.05, minAcceleration, maxAcceleration)
    let ledY: number = Math.round(Math.map(averageAcceration, minAcceleration, maxAcceleration, -0.5, 4.49))

    led.stopAnimation()
    led.plot(0, 4 - ledY)

    // 1000 / 8 = roughly 125 samples per second
    // 125 / 20 = new history 6.25 times per second
    // 1000 / 6.25 = roughly 160 milliseconds per move
    // 160 * 4 = roughly 640 milliseconds to "fall" from top to bottom
    basic.pause(8)
})
