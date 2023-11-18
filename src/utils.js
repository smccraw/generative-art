export default class utils {
    static map(min, max, curr, newMin, newMax) {
        let t = Math.max(0, Math.min(1,(curr - min) / (max - min)))
        return newMin + t * (newMax - newMin)
    }
    static mapEase(min, max, curr, newMin, newMax, easor) {
        let t = easor((curr - min) / (max - min))
        return newMin + t * (newMax - newMin)
    }
    // t===0 and t===1 must be first and last entries
    // frames: [{t:0, v:23},{t:0.123, v:23}, {t:0.223, v: 35}, {t:1, v:23}]
    static mapEaseKeyFrames(min, max, curr, frames, easor) {
        let t = easor((curr - min) / (max - min))

       
        let idx = 1
        while (idx < frames.length) {
            if (t <= frames[idx].t) {
                return utils.mapEase(frames[idx-1].t, frames[idx].t, t, frames[idx-1].v, frames[idx].v, (t2) => t2)
            }
            idx++
        }
        return frames[frames.length-1].v
    }
    static isBetween(pt1, pt2, ptTest) {
        if (pt1 < pt2) {
            return (pt1 <= ptTest && pt2 >= ptTest)
        } else {
            return (pt2 <= ptTest && pt1 >= ptTest)
        }
    }
    static quantizePoint(pt) {
        pt.x = Math.floor(pt.x)
        pt.y = Math.floor(pt.y)
        return pt
    }
    static calculateT(min, max, num) {
        let d = max - min
        let p = num - min

        return Math.max(0, Math.min(1, p / d))
    }
    static linearEaseNumber(min, max, t) {
        let d = (max - min)
        return d * t + min
    }

    static qt_search(quadtree, xmin, ymin, xmax, ymax) {
        const results = [];
        quadtree.visit((node, x1, y1, x2, y2) => {
            if (!node.length) {
                do {
                    let d = node.data;
                    if (d.x >= xmin && d.x < xmax && d.y >= ymin && d.y < ymax) {
                        results.push(d);
                    }
                } while ((node = node.next));
            }
            return x1 >= xmax || y1 >= ymax || x2 < xmin || y2 < ymin;
        });
        return results;
    }

    static uniqueSetKey(id1, id2) {
        if (id1 <= id2) {
            return `${id1}_${id2}`
        }
        return `${id2}_${id1}`
    }
}
