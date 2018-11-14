import { LogootSRopes } from "./logootsropes"
import { RopesNodes } from "./ropesnodes"

export interface BasicStats {
    min: number
    max: number
    mean: number
    median: number
    lengthRepartition: Map<number, number>
}

export class Stats {
    readonly documentLength: number
    readonly treeHeight: number
    private nodeNumber: number

    private nodesStats: BasicStats
    private identifiersStats: BasicStats

    private nodeLengths: number[]
    private identifierLengths: number[]

    constructor (rope: LogootSRopes) {
        this.documentLength = rope.str.length
        this.treeHeight = rope.height
        this.nodeNumber = 0
        this.nodeLengths = []
        this.identifierLengths = []
        this.nodesStats = {
            max: 0,
            min: -1,
            mean: 0,
            median: 0,
            lengthRepartition: new Map<number, number>(),
        }
        this.identifiersStats = {
            max: 0,
            min: -1,
            mean: 0,
            median: 0,
            lengthRepartition: new Map<number, number>(),
        }
        this.compute(rope)
    }

    get numberOfNodes (): number {
        return this.nodeNumber
    }

    get maxNodeLength (): number {
        return this.nodesStats.max
    }

    get minNodeLength (): number {
        return this.nodesStats.min
    }

    get meanNodeLength (): number {
        return this.nodesStats.mean
    }

    get medianNodeLength (): number {
        return this.nodesStats.median
    }

    get repartitionNodeLength (): Map<number, number> {
        return this.nodesStats.lengthRepartition
    }

    get repartitionNodeLengthString (): string {
        const arr = Array.from(this.nodesStats.lengthRepartition)
        arr.sort((a, b) => {
            return a[0] - b[0]
        })
        let str = ""
        arr.forEach((entry) => {
            str += "(" + entry[0] + ", " + entry[1] + "), "
        })
        return str
    }

    get maxIdentifierLength (): number {
        return this.identifiersStats.max
    }

    get minIdentifierLength (): number {
        return this.identifiersStats.min
    }

    get meanIdentifierLength (): number {
        return this.identifiersStats.mean
    }

    get medianIdentifierLength (): number {
        return this.identifiersStats.median
    }

    get repartitionIdentifierLength (): Map<number, number> {
        return this.identifiersStats.lengthRepartition
    }

    get repartitionIdentifierLengthString (): string {
        const arr = Array.from(this.identifiersStats.lengthRepartition)
        arr.sort((a, b) => {
            return a[0] - b[0]
        })
        let str = ""
        arr.forEach((entry) => {
            str += "(" + entry[0] + ", " + entry[1] + "), "
        })
        return str
    }

    public toString (): string {
        let str = ""
        str += "Document stats : \n"
        str += "\t Document length : " + this.documentLength + "\n"
        str += "\t Number of nodes : " + this.numberOfNodes + "\n"
        str += "\t Height of the tree : " + this.treeHeight + "\n"
        str += "\t Nodes : " + "\n"
        str += "\t\tMax length : " + this.maxNodeLength + "\n"
        str += "\t\tMin length : " + this.minNodeLength + "\n"
        str += "\t\tMean length : " + this.meanNodeLength + "\n"
        str += "\t\tMedian length : " + this.medianNodeLength + "\n"
        str +=
            "\t\tLength repartition : " + this.repartitionNodeLengthString + "\n"
        str += "\t Identifier : " + "\n"
        str += "\t\tMax length : " + this.maxIdentifierLength + "\n"
        str += "\t\tMin length : " + this.minIdentifierLength + "\n"
        str += "\t\tMean length : " + this.meanIdentifierLength + "\n"
        str += "\t\tMedian length : " + this.medianIdentifierLength + "\n"
        str +=
            "\t\tLength repartition : " +
            this.repartitionIdentifierLengthString +
            "\n"
        return str
    }

    private compute (rope: LogootSRopes) {
        this.nodeNumber = this.recCompute(rope.root)

        this.nodeLengths = this.nodeLengths.sort((a, b) => {
            return a - b
        })
        this.identifierLengths = this.identifierLengths.sort((a, b) => {
            return a - b
        })

        this.nodesStats.mean /= this.nodeNumber
        const N = this.nodeLengths.length
        this.nodesStats.median =
            N % 2 === 0
                ? (this.nodeLengths[N / 2] + this.nodeLengths[N / 2 + 1]) / 2
                : this.nodeLengths[Math.ceil(N / 2)]

        this.identifiersStats.mean /= this.nodeNumber
        const M = this.identifierLengths.length
        this.identifiersStats.median =
            M % 2 === 0
                ? (this.identifierLengths[M / 2] + this.identifierLengths[M / 2 + 1]) / 2
                : this.identifierLengths[Math.ceil(M / 2)]
    }

    private recCompute (rope: RopesNodes | null): number {
        if (!rope) {
            return 0
        }

        // node stats

        const nLength = rope.length
        this.nodeLengths.push(nLength)
        this.nodesStats.max =
            this.nodesStats.max < nLength ? nLength : this.nodesStats.max
        this.nodesStats.min =
            this.nodesStats.min === -1
                ? nLength
                : this.nodesStats.min > nLength
                    ? nLength
                    : this.nodesStats.min
        this.nodesStats.mean += nLength
        if (this.nodesStats.lengthRepartition.has(nLength)) {
            const n = this.nodesStats.lengthRepartition.get(nLength)
            if (n) {
                this.nodesStats.lengthRepartition.set(nLength, n + 1)
            }
        } else {
            this.nodesStats.lengthRepartition.set(nLength, 1)
        }

        // identifier stats

        const iLength = rope.getIdBegin().length
        this.identifierLengths.push(iLength)
        this.identifiersStats.max =
            this.identifiersStats.max < iLength ? iLength : this.identifiersStats.max
        this.identifiersStats.min =
            this.identifiersStats.min === -1
                ? iLength
                : this.identifiersStats.min > iLength
                    ? iLength
                    : this.identifiersStats.min
        this.identifiersStats.mean += iLength
        if (
            this.identifiersStats.lengthRepartition.has(iLength) &&
            this.identifiersStats.lengthRepartition
        ) {
            const n = this.identifiersStats.lengthRepartition.get(iLength)
            if (n) {
                this.identifiersStats.lengthRepartition.set(iLength, n + 1)
            }
        } else {
            this.identifiersStats.lengthRepartition.set(iLength, 1)
        }

        return this.recCompute(rope.left) + 1 + this.recCompute(rope.right)
    }
}
