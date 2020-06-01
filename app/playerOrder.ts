//Fixed permutations with even draw/describe up to length 10. After that node ran out of memory so if we get more than 10 players we will just return a cycle
const orders = [[[1]], [ [ 1, 2 ], [ 2, 1 ] ], [ [ 1, 2, 3 ], [ 2, 3, 1 ], [ 3, 1, 2 ] ], [ [ 1, 3, 4, 2 ], [ 2, 4, 3, 1 ], [ 3, 1, 2, 4 ], [ 4, 2, 1, 3 ] ], [ [ 1, 5, 2, 3, 4 ], [ 2, 4, 5, 1, 3 ], [ 3, 1, 4, 5, 2 ], [ 4, 3, 1, 2, 5 ], [ 5, 2, 3, 4, 1 ] ], [ [ 1, 4, 5, 2, 6, 3 ], [ 2, 3, 1, 6, 5, 4 ], [ 3, 2, 6, 4, 1, 5 ], [ 4, 6, 3, 5, 2, 1 ], [ 5, 1, 2, 3, 4, 6 ], [ 6, 5, 4, 1, 3, 2 ] ], [ [ 1, 4, 7, 6, 3, 2, 5 ], [ 2, 6, 4, 7, 5, 1, 3 ], [ 3, 1, 6, 5, 4, 7, 2 ], [ 4, 2, 3, 1, 6, 5, 7 ], [ 5, 7, 2, 3, 1, 6, 4 ], [ 6, 3, 5, 2, 7, 4, 1 ], [ 7, 5, 1, 4, 2, 3, 6 ] ], [ [ 1, 6, 8, 7, 3, 4, 5, 2 ], [ 2, 1, 3, 8, 4, 5, 7, 6 ], [ 3, 5, 6, 1, 2, 8, 4, 7 ], [ 4, 7, 5, 3, 6, 2, 8, 1 ], [ 5, 2, 7, 4, 8, 6, 1, 3 ], [ 6, 4, 2, 5, 1, 7, 3, 8 ], [ 7, 8, 1, 6, 5, 3, 2, 4 ], [ 8, 3, 4, 2, 7, 1, 6, 5 ] ], [ [ 1, 2, 4, 8, 3, 6, 9, 5, 7 ], [ 2, 4, 5, 9, 8, 7, 6, 3, 1 ], [ 3, 1, 2, 7, 5, 4, 8, 6, 9 ], [ 4, 6, 9, 5, 2, 1, 3, 7, 8 ], [ 5, 7, 6, 3, 9, 8, 2, 1, 4 ], [ 6, 3, 8, 4, 1, 9, 7, 2, 5 ], [ 7, 9, 3, 6, 4, 5, 1, 8, 2 ], [ 8, 5, 1, 2, 7, 3, 4, 9, 6 ], [ 9, 8, 7, 1, 6, 2, 5, 4, 3 ] ], [ [ 1, 10, 4, 7, 9, 5, 2, 8, 6, 3 ], [ 2, 4, 3, 1, 5, 9, 7, 6, 10, 8 ], [ 3, 8, 7, 5, 10, 4, 6, 9, 1, 2 ], [ 4, 2, 6, 3, 7, 8, 1, 5, 9, 10 ], [ 5, 7, 8, 10, 1, 3, 9, 4, 2, 6 ], [ 6, 9, 10, 4, 8, 7, 3, 2, 5, 1 ], [ 7, 1, 5, 6, 3, 2, 4, 10, 8, 9 ], [ 8, 6, 1, 9, 2, 10, 5, 3, 7, 4 ], [ 9, 3, 2, 8, 6, 1, 10, 7, 4, 5 ], [ 10, 5, 9, 2, 4, 6, 8, 1, 3, 7 ] ]]

function cycle(length : number) : number[][] {
    let arr : number[] = [];
    let result : number[][] = [];
    for (let i = 0; i < length; i++) {
        arr.push(i + 1);
    }
    for (let i = 0; i < length; i++) {
        result.push(arr.slice())
        let num = arr.shift();
        if (num) {
            arr.push(num);
        }
    }
    return result;
}

export default function permute<T>(ts : T[]) : T[][] {
    if (ts.length <= orders.length) {
        return orders[ts.length - 1].map(o => o.map(i => ts[i - 1]));
    }

    return cycle(ts.length).map(o => o.map(i => ts[i]));
}