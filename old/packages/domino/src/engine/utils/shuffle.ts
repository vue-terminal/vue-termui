// for i from n−1 downto 1 do
//      j ← random integer such that 0 ≤ j ≤ i
//      exchange a[j] and a[i]

export function shuffle<T>(array: T[]): T[] {
  let i = array.length
  let temp: T
  while (i > 0) {
    // start with i = to len so it can reach the upper bound with floor
    const j = Math.floor(Math.random() * i)
    i-- // correct the swapping index
    temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }

  return array
}
