import Alea from 'alea'
import { createNoise2D } from 'simplex-noise'
import utils from './utils'

export default class Random {
    constructor(seed) {
        if (!seed) {
            this.prng = new Alea()
        } else {
            this.prng = new Alea(seed)
        }
        this.noise2D = createNoise2D(this.prng)
    }

    noise2D(x, y) {
        return this.noise2D(x, y)
    }

    shuffle(array) {
        if (!Array.isArray(array)) {
            throw new TypeError(`Expected an array, got ${typeof array}`);
        }

        // clone
        array = [...array];

        for (let index = array.length - 1; index > 0; index--) {
            const newIndex = Math.floor(this.prng() * (index + 1));
            [array[index], array[newIndex]] = [array[newIndex], array[index]];
        }

        return array;
    }

    randomBrightColor() {
        let h = Math.floor(this.prng() * 360)
        let s = this.prng() * 30 + 60
        let b = this.prng() * 30 + 60

        return utils.HSBtoRGB(h, s, b)
    }
    randomDarkColor() {
        let h = Math.floor(this.prng() * 360)
        let s = this.prng() * 30 + 60
        let b = 60 - this.prng() * 30

        return utils.HSBtoRGB(h, s, b)
    }
    randomColor() {
        return {
            r: this.randomBetween(0, 256),
            g: this.randomBetween(0, 256),
            b: this.randomBetween(0, 256),
        }
    }
    randomSign() {
        return (this.prng() < 0.5) ? -1 : 1
    }
    // highly overriden depending on inputs
    random(inp, inp2) {
        if (typeof inp === 'undefined' || inp === null) {
            return this.prng()
        } else if (Array.isArray(inp)) {
            return inp[Math.floor(this.prng() * inp.length)]
        } else if (typeof inp === 'number') {
            if (typeof inp2 === 'number') {
                // do a between
                return inp + this.prng() * (inp2 - inp)
            } else {
                if (inp === Math.floor(inp)) { // is this an integer?
                    return Math.floor(this.prng() * inp)
                } else {
                    return this.prng() * inp
                }
            }
        }
    }
    randomBetween(min, max) {
        let d = max - min
        return min + this.prng() * d
    }
    randomIntBetween(min, max) {
        let d = max - min
        return Math.floor(min + this.prng() * d)
    }
    randomWithBias(min, max, bias, influence) {
        var rnd = this.prng() * (max - min) + min,   // random in range
            mix = this.prng() * influence;           // random mixer
        return rnd * (1 - mix) + bias * mix;         // mix full range and bias
    }
    jitterRandom(min,max) {
        if (typeof max === 'undefined') {
            return this.prng() * min - (min / 2)
        } else {
            return (this.prng() * (max - min) + min) * this.randomSign()
        }
    }
    jitterRandomInt(min,max) {
        if (typeof max === 'undefined') {
            return Math.floor(this.prng() * min - (min / 2))
        } else {
            return Math.floor((this.prng() * (max - min) + min) * this.randomSign())
        }
    }
    randomSet(arr, setSize) {
        if (arr.length < setSize) {
            console.log(`Cannot get ${setSize} indexes from an array with only ${arr.length} items`)
            throw new Error(`Cannot get ${setSize} indexes from an array with only ${arr.length} items`)
        } else if (arr.length === setSize) {
            return [...arr]
        }

        let out = []
        let indexes = arr.map((v, i) => i)

        while (setSize > 0) {
            let rid = Math.floor(this.prng() * indexes.length)
            let idx = indexes[rid]
            indexes.splice(rid, 1)

            out.push(arr[idx])
            setSize--
        }
        return out
    }
    pullRandomSet(arr, setSize) {
        if (arr.length < setSize) {
            console.log(`Cannot get ${setSize} indexes from an array with only ${arr.length} items`)
            throw new Error(`Cannot get ${setSize} indexes from an array with only ${arr.length} items`)
        } else if (arr.length === setSize) {
            return arr.splice(0)
        }

        let out = []
        while (setSize > 0) {
            let idx = Math.floor(this.prng() * arr.length)
            out.push(arr[idx])
            arr.splice(idx, 1)
            setSize--
        }
        return out
    }
}