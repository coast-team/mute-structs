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
    private documentL: number
    private totalNodeLength: number
    private nodeNumber: number
    private treeHeigth: number

    private nodeStat: BasicStats
    private identifierStat: BasicStats

    private nodeTab: number[]
    private identifierTab: number[]

    constructor (rope: LogootSRopes) {
        this.documentL = 0
        this.treeHeigth = 0
        this.nodeNumber = 0
        this.nodeTab = []
        this.identifierTab = []
        this.totalNodeLength = 0
        this.nodeStat = {
            max: 0,
            min: -1,
            mean: 0,
            median: 0,
            lengthRepartition: new Map<number, number>(),
        }
        this.identifierStat = {
            max: 0,
            min: -1,
            mean: 0,
            median: 0,
            lengthRepartition: new Map<number, number>(),
        }
        this.compute(rope)
    }

    public toString (): string {
        let str = ""
        str += "Document stats : \n"
        str += "\t Document length : " + this.documentL + "\n"
        str += "\t Number of nodes : " + this.numberOfNodes + "\n"
        str += "\t Total Nodes length : " + this.totalNodeLength + "\n"
        str += "\t Height of the tree : " + this.heightOfTree + "\n"
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

        this.documentL = rope.str.length
        this.nodeNumber = this.recCompute(rope.root)
        if (rope.root) {
            this.treeHeigth = rope.root.height
        }

        this.nodeTab = this.nodeTab.sort((a, b) => {
            return a - b
        })
        this.identifierTab = this.identifierTab.sort((a, b) => {
            return a - b
        })

        this.nodeStat.mean /= this.nodeNumber
        const N = this.nodeTab.length
        this.nodeStat.median =
            N % 2 === 0
                ? (this.nodeTab[N / 2] + this.nodeTab[N / 2 + 1]) / 2
                : this.nodeTab[Math.ceil(N / 2)]

        this.identifierStat.mean /= this.nodeNumber
        const M = this.identifierTab.length
        this.identifierStat.median =
            M % 2 === 0
                ? (this.identifierTab[M / 2] + this.identifierTab[M / 2 + 1]) / 2
                : this.identifierTab[Math.ceil(M / 2)]
    }

    private recCompute (rope: RopesNodes | null): number {
        if (!rope) {
            return 0
        }

        // node stats

        const nLength = rope.length
        this.nodeTab.push(nLength)
        this.totalNodeLength += nLength
        this.nodeStat.max =
            this.nodeStat.max < nLength ? nLength : this.nodeStat.max
        this.nodeStat.min =
            this.nodeStat.min === -1
                ? nLength
                : this.nodeStat.min > nLength
                    ? nLength
                    : this.nodeStat.min
        this.nodeStat.mean += nLength
        if (this.nodeStat.lengthRepartition.has(nLength)) {
            const n = this.nodeStat.lengthRepartition.get(nLength)
            if (n) {
                this.nodeStat.lengthRepartition.set(nLength, n + 1)
            }
        } else {
            this.nodeStat.lengthRepartition.set(nLength, 1)
        }

        // identifier stats

        const iLength = rope.getIdBegin().length
        this.identifierTab.push(iLength)
        this.identifierStat.max =
            this.identifierStat.max < iLength ? iLength : this.identifierStat.max
        this.identifierStat.min =
            this.identifierStat.min === -1
                ? iLength
                : this.identifierStat.min > iLength
                    ? iLength
                    : this.identifierStat.min
        this.identifierStat.mean += iLength
        if (
            this.identifierStat.lengthRepartition.has(iLength) &&
            this.identifierStat.lengthRepartition
        ) {
            const n = this.identifierStat.lengthRepartition.get(iLength)
            if (n) {
                this.identifierStat.lengthRepartition.set(iLength, n + 1)
            }
        } else {
            this.identifierStat.lengthRepartition.set(iLength, 1)
        }

        return this.recCompute(rope.left) + 1 + this.recCompute(rope.right)
    }

    get documentLength (): number {
        return this.documentL
    }

    get numberOfNodes (): number {
        return this.nodeNumber
    }

    get heightOfTree (): number {
        return this.treeHeigth
    }

    get maxNodeLength (): number {
        return this.nodeStat.max
    }

    get minNodeLength (): number {
        return this.nodeStat.min
    }

    get meanNodeLength (): number {
        return this.nodeStat.mean
    }

    get medianNodeLength (): number {
        return this.nodeStat.median
    }

    get repartitionNodeLength (): Map<number, number> {
        return this.nodeStat.lengthRepartition
    }

    get repartitionNodeLengthString (): string {
        const arr = Array.from(this.nodeStat.lengthRepartition)
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
        return this.identifierStat.max
    }

    get minIdentifierLength (): number {
        return this.identifierStat.min
    }

    get meanIdentifierLength (): number {
        return this.identifierStat.mean
    }

    get medianIdentifierLength (): number {
        return this.identifierStat.median
    }

    get repartitionIdentifierLength (): Map<number, number> {
        return this.identifierStat.lengthRepartition
    }

    get repartitionIdentifierLengthString (): string {
        const arr = Array.from(this.identifierStat.lengthRepartition)
        arr.sort((a, b) => {
            return a[0] - b[0]
        })
        let str = ""
        arr.forEach((entry) => {
            str += "(" + entry[0] + ", " + entry[1] + "), "
        })
        return str
    }
}
